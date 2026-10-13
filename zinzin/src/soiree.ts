import { useSyncExternalStore } from "react";
import { GAMES, GAME_KIND, playerRange, type ZGame, type ZKind } from "./catalog";
import type { ZGameId } from "./catalog-text";

/**
 * Soirée Zinzin : une « playlist » de jeux enchaînés avec la même bande,
 * un classement de soirée et une reprise si on quitte l'app (localStorage).
 */

export type Vibe = "chill" | "soiree" | "folle";
export type SoireeLength = 4 | 6 | 10;
export const VIBES: Vibe[] = ["chill", "soiree", "folle"];
export const LENGTHS: SoireeLength[] = [4, 6, 10];

/** intro = écran de transition · playing = jeu en cours · winner = « qui a gagné ? » · end = podium */
export type SoireePhase = "intro" | "playing" | "winner" | "end";

export interface SoireeState {
  v: 1;
  band: string[];
  vibe: Vibe;
  length: SoireeLength;
  playlist: ZGameId[];
  index: number;
  phase: SoireePhase;
  /** Points de soirée par prénom */
  points: Record<string, number>;
  /** Gagnants de chaque jeu (null = passé ou personne) */
  results: (string[] | null)[];
  /** Jeux réellement joués (hors « Passer ce jeu ») */
  played: number;
  startedAt: number;
}

/* ───────── Choix des jeux ───────── */

/** Jeux trop longs pour une soirée courte */
const LONG: ZGameId[] = ["loup-garou"];

/** Le jeu est-il jouable dans cette soirée (nombre de joueurs + ambiance) ? */
export function eligible(g: ZGame, players: number, vibe: Vibe): boolean {
  const [min, max] = playerRange(g);
  if (players < min || players > max) return false;
  const kind = GAME_KIND[g.id];
  // Jeux à deux : seulement si la bande est un duo
  if (kind === "duo" && players !== 2) return false;
  // Jeux à boire : uniquement en soirée folle
  if (kind === "boire" && vibe !== "folle") return false;
  // Chill : ni alcool ni questions coquines
  if (vibe === "chill" && (g.adult || g.id === "purete")) return false;
  return true;
}

export function eligibleGames(players: number, vibe: Vibe): ZGame[] {
  return GAMES.filter((g) => eligible(g, players, vibe));
}

/**
 * Génère la playlist : on alterne les types (bluff / tél-jouet / devinettes…),
 * jamais deux fois le même jeu, un démarrage facile et (soirée folle) au moins un jeu à boire.
 */
export function generatePlaylist(players: number, vibe: Vibe, length: SoireeLength, rnd: () => number = Math.random): ZGameId[] {
  const pool = eligibleGames(players, vibe).filter((g) => length > 4 || !LONG.includes(g.id));
  const out: ZGameId[] = [];
  const count: Partial<Record<ZKind, number>> = {};
  while (out.length < length && out.length < pool.length) {
    const prev = out.length ? GAME_KIND[out[out.length - 1]] : null;
    let best: ZGame | null = null;
    let bestScore = -Infinity;
    for (const g of pool) {
      if (out.includes(g.id)) continue;
      const kind = GAME_KIND[g.id];
      let score = rnd() * 2;
      if (kind === prev) score -= 6;
      score -= (count[kind] ?? 0) * 1.6;
      // Pour chauffer la salle : un jeu simple en premier
      if (out.length === 0 && (kind === "ambiance" || kind === "tel")) score += 1.5;
      if (out.length === 0 && LONG.includes(g.id)) score -= 4;
      if (vibe === "folle" && kind === "boire" && !count.boire && out.length >= 1) score += 1 + out.length * 0.6;
      if (score > bestScore) { bestScore = score; best = g; }
    }
    if (!best) break;
    out.push(best.id);
    count[GAME_KIND[best.id]] = (count[GAME_KIND[best.id]] ?? 0) + 1;
  }
  return out;
}

/** Un autre jeu (absent de la playlist) pour la case `i`, si possible d'un autre type que ses voisins. */
export function swapGame(playlist: ZGameId[], i: number, players: number, vibe: Vibe, rnd: () => number = Math.random): ZGameId[] {
  const others = eligibleGames(players, vibe).filter((g) => !playlist.includes(g.id) && (playlist.length > 4 || !LONG.includes(g.id)));
  if (!others.length) return playlist;
  const near = [playlist[i - 1], playlist[i + 1]].filter(Boolean).map((id) => GAME_KIND[id]);
  const scored = others.map((g) => ({ g, s: rnd() - (near.includes(GAME_KIND[g.id]) ? 1 : 0) }));
  scored.sort((a, b) => b.s - a.s);
  const next = [...playlist];
  next[i] = scored[0].g.id;
  return next;
}

export function moveGame(playlist: ZGameId[], i: number, dir: -1 | 1): ZGameId[] {
  const j = i + dir;
  if (j < 0 || j >= playlist.length) return playlist;
  const next = [...playlist];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ───────── État persistant (reprise) ───────── */

const KEY = "zz-soiree-v1";
const listeners = new Set<() => void>();

function readStored(): SoireeState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SoireeState;
    if (s?.v !== 1 || !Array.isArray(s.playlist) || !Array.isArray(s.band) || !s.playlist.length) return null;
    // Jeux disparus du catalogue : on les retire
    const ids = new Set(GAMES.map((g) => g.id as string));
    if (!s.playlist.every((id) => ids.has(id))) return null;
    return s;
  } catch {
    return null;
  }
}

let state: SoireeState | null = typeof localStorage !== "undefined" ? readStored() : null;

function commit(next: SoireeState | null) {
  state = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch { /* stockage indisponible */ }
  listeners.forEach((l) => l());
}

export function getSoiree(): SoireeState | null {
  return state;
}

export function useSoiree(): SoireeState | null {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => state,
    () => null,
  );
}

/** Soirée à reprendre depuis l'accueil (pas encore finie). */
export function resumable(s: SoireeState | null): s is SoireeState {
  return Boolean(s && s.phase !== "end" && s.index < s.playlist.length);
}

export function startSoiree(band: string[], vibe: Vibe, length: SoireeLength, playlist: ZGameId[]) {
  commit({
    v: 1, band, vibe, length, playlist, index: 0, phase: "intro",
    points: Object.fromEntries(band.map((n) => [n, 0])),
    results: playlist.map(() => null),
    played: 0,
    startedAt: Date.now(),
  });
}

/** Reprise : un jeu interrompu repart de son écran de transition. */
export function resumeSoiree() {
  if (state && state.phase === "playing") commit({ ...state, phase: "intro" });
}

export function setPhase(phase: SoireePhase) {
  if (state) commit({ ...state, phase });
}

/** Passe au jeu suivant (ou au podium). */
function advance(s: SoireeState): SoireeState {
  const index = s.index + 1;
  return { ...s, index, phase: index >= s.playlist.length ? "end" : "intro" };
}

export function skipGame() {
  if (state) commit(advance(state));
}

/** Enregistre les gagnants du jeu en cours (+1 point chacun) puis passe à la suite. */
export function recordWinners(winners: string[]) {
  if (!state) return;
  const points = { ...state.points };
  for (const w of winners) points[w] = (points[w] ?? 0) + 1;
  const results = [...state.results];
  results[state.index] = winners.length ? winners : null;
  commit(advance({ ...state, points, results, played: (state.played ?? 0) + 1 }));
}

export function endSoiree() {
  if (state) commit({ ...state, phase: "end" });
}

export function clearSoiree() {
  commit(null);
}

/** Classement : points décroissants, ordre de la bande en cas d'égalité. */
export function ranking(s: SoireeState): { name: string; points: number; rank: number }[] {
  const rows = s.band.map((name, i) => ({ name, points: s.points[name] ?? 0, i }));
  rows.sort((a, b) => b.points - a.points || a.i - b.i);
  return rows.map((r) => ({ name: r.name, points: r.points, rank: rows.findIndex((x) => x.points === r.points) + 1 }));
}
