import { useSyncExternalStore } from "react";
import { GAMES, GAME_KIND, playerRange, type ZGame, type ZKind } from "./catalog";
import type { ZGameId } from "./catalog-text";
import { isPremium } from "./premium";
import type { GameFinishedDetail, GameRank } from "@/lib/game-finished";

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
  /** Ce qui a été mesuré par jeu (même index que la playlist) — absent des anciennes sauvegardes */
  outcomes?: (SoireeOutcome | null)[];
  /** Fin du jeu en cours reçue du jeu lui-même (signal de fin de partie), en attente du « Qui a gagné ? » */
  pending?: Omit<SoireeOutcome, "winners"> & { winners?: string[] };
  /** Cérémonie des trophées déjà vue ? */
  awards?: { done: boolean };
}

/** Résultat mesuré d'un jeu de la soirée (rien d'inventé : table + signal de fin du jeu). */
export interface SoireeOutcome {
  /** Gagnants validés par la table (écran « Qui a gagné ? ») */
  winners: string[];
  /** Perdant désigné par le jeu */
  loser?: string | null;
  /** Classement du jeu (rang 1 = meilleur), prénoms de la bande seulement */
  ranking?: GameRank[];
}

/* ───────── Choix des jeux ───────── */

/** Jeux trop longs pour une soirée courte */
const LONG: ZGameId[] = ["loup-garou"];

/** Le jeu est-il jouable dans cette soirée (nombre de joueurs + ambiance) ? */
export function eligible(g: ZGame, players: number, vibe: Vibe): boolean {
  // Sans Zinzin+ : uniquement les jeux gratuits (en version découverte)
  if (!g.free && !isPremium()) return false;
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
  if (state) commit(advance({ ...state, pending: undefined }));
}

const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
/** Prénom du jeu → prénom de la bande (null si inconnu). */
function inBand(band: string[], name: string | null | undefined): string | null {
  if (!name) return null;
  return band.find((b) => b === name) ?? band.find((b) => norm(b) === norm(name)) ?? null;
}

/** Le jeu en cours vient d'arriver sur son écran de fin : on garde ce qu'il sait (gagnants, perdant, classement). */
export function captureFinished(d: GameFinishedDetail) {
  if (!state || state.phase !== "playing" || d.soiree) return;
  if (d.gameId && d.gameId !== state.playlist[state.index]) return;
  const band = state.band;
  const ranking = (d.ranking ?? [])
    .map((r) => ({ name: inBand(band, r.name), rank: r.rank }))
    .filter((r): r is GameRank => Boolean(r.name));
  const winners = (d.winners ?? []).map((w) => inBand(band, w)).filter((w): w is string => Boolean(w));
  commit({
    ...state,
    pending: {
      loser: inBand(band, d.loser),
      ...(ranking.length >= 2 ? { ranking } : {}),
      ...(winners.length ? { winners: Array.from(new Set(winners)) } : {}),
    },
  });
}

/** Enregistre les gagnants du jeu en cours (+1 point chacun) puis passe à la suite. */
export function recordWinners(winners: string[]) {
  if (!state) return;
  const points = { ...state.points };
  for (const w of winners) points[w] = (points[w] ?? 0) + 1;
  const results = [...state.results];
  results[state.index] = winners.length ? winners : null;
  const outcomes = state.playlist.map((_, i) => state!.outcomes?.[i] ?? null);
  const p = state.pending;
  outcomes[state.index] = { winners, ...(p?.loser ? { loser: p.loser } : {}), ...(p?.ranking ? { ranking: p.ranking } : {}) };
  commit(advance({ ...state, points, results, outcomes, pending: undefined, played: (state.played ?? 0) + 1 }));
}

/** Fin de la cérémonie des trophées. */
export function finishCeremony() {
  if (state) commit({ ...state, awards: { done: true } });
}

export function endSoiree() {
  if (state) commit({ ...state, phase: "end", pending: undefined });
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

/* ───────── Trophées de fin de soirée ───────── */

/**
 * Un prix par perso de la bande, calculé UNIQUEMENT sur ce qui a été mesuré pendant la soirée
 * (gagnants validés par la table, perdants et classements remontés par les jeux) :
 * king = le plus de victoires · naze = rien gagné / le plus perdu (révélé en dernier) ·
 * game = son jeu gagné le plus marquant · comeback = dernier à un jeu puis gagnant d'un suivant ·
 * consolation sans victoire : second (2e quelque part), cascadeur (désigné perdant), touriste (le reste).
 */
export type TrophyId = "king" | "naze" | "game" | "comeback" | "second" | "cascadeur" | "touriste";

export interface Trophy {
  id: TrophyId;
  name: string;
  /** Jeux concernés (king : gagnés · second : finis 2e · cascadeur : finis derniers) */
  games?: ZGameId[];
  /** game / comeback : le jeu gagné */
  game?: ZGameId;
  /** comeback : le jeu perdu avant */
  lostGame?: ZGameId;
  /** naze / touriste : jeux joués ou défaites */
  n?: number;
  /** naze : aucune victoire de la soirée */
  allLost?: boolean;
  /** Tirage de la variante de texte (stable pour une soirée donnée) */
  v: number;
}

/** Petit hachage stable (variantes de textes : mêmes à la cérémonie, au récap et sur l'image). */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function computeTrophies(s: SoireeState): Trophy[] {
  const band = s.band;
  const games = s.playlist
    .map((id, i) => ({ id, o: s.outcomes?.[i] ?? null }))
    .filter((g): g is { id: ZGameId; o: SoireeOutcome } => Boolean(g.o));
  if (!games.length || band.length < 2) return [];

  const won: Record<string, ZGameId[]> = Object.fromEntries(band.map((n) => [n, []]));
  const lost: Record<string, ZGameId[]> = Object.fromEntries(band.map((n) => [n, []]));
  const seconds: Record<string, ZGameId[]> = Object.fromEntries(band.map((n) => [n, []]));
  const rankSum: Record<string, number> = Object.fromEntries(band.map((n) => [n, 0]));
  const ranked: Record<string, number> = Object.fromEntries(band.map((n) => [n, 0]));
  /** Perdant d'un jeu : désigné par le jeu, sinon le seul dernier de son classement */
  const loserOf = (o: SoireeOutcome): string | null => {
    if (o.loser) return o.loser;
    const r = o.ranking;
    if (!r || r.length < 3) return null;
    const last = Math.max(...r.map((x) => x.rank));
    const at = r.filter((x) => x.rank === last);
    return at.length === 1 && last > 1 ? at[0].name : null;
  };
  for (const g of games) {
    for (const w of new Set(g.o.winners)) won[w]?.push(g.id);
    const l = loserOf(g.o);
    if (l && lost[l] && !g.o.winners.includes(l)) lost[l].push(g.id);
    for (const r of g.o.ranking ?? []) {
      if (!(r.name in rankSum)) continue;
      rankSum[r.name] += (r.rank - 1) / Math.max(1, g.o.ranking!.length - 1);
      ranked[r.name]++;
      if (r.rank === 2) seconds[r.name].push(g.id);
    }
  }
  const W = (n: string) => won[n].length, L = (n: string) => lost[n].length;
  const avgRank = (n: string) => (ranked[n] ? rankSum[n] / ranked[n] : 0.5);
  /** Le seul en tête après départages successifs (sinon personne) */
  const unique = (pool: string[], ...keys: ((n: string) => number)[]): string | null => {
    let top = pool;
    for (const k of keys) {
      if (top.length <= 1) break;
      const best = Math.max(...top.map(k));
      top = top.filter((n) => k(n) === best);
    }
    return top.length === 1 ? top[0] : null;
  };
  const v = (name: string, id: string) => hash(`${s.startedAt}|${name}|${id}`);
  const out = new Map<string, Trophy>();

  // Le Roi : le plus de victoires (départage : le moins de défaites, puis le meilleur classement moyen)
  // (puis le plus de victoires en solo, puis celui qui a gagné le plus récemment)
  const solo = (n: string) => games.filter((g) => g.o.winners.length === 1 && g.o.winners[0] === n).length;
  const lastWin = (n: string) => Math.max(-1, ...games.map((g, i) => (g.o.winners.includes(n) ? i : -1)));
  const king = Math.max(...band.map(W)) > 0 ? unique(band, W, (n) => -L(n), solo, (n) => -avgRank(n), lastWin) : null;
  if (king) out.set(king, { id: "king", name: king, games: won[king], v: v(king, "king") });

  // Le Plus Gros Naze : parmi ceux qui n'ont rien gagné (sinon toute la bande), le plus de défaites puis le pire classement
  const zeroWin = band.filter((n) => W(n) === 0 && n !== king);
  const nazePool = zeroWin.length ? zeroWin : band.filter((n) => n !== king);
  const naze = nazePool.length && (zeroWin.length || Math.max(...nazePool.map(L)) > 0)
    ? unique(nazePool, L, (n) => -W(n), avgRank) : null;
  if (naze) {
    out.set(naze, W(naze) === 0
      ? { id: "naze", name: naze, n: games.length, allLost: true, v: v(naze, "naze") }
      : { id: "naze", name: naze, n: L(naze), v: v(naze, "naze") });
  }

  // Les gagnants : leur jeu le plus marquant (titre pas encore pris, victoire en solo, le plus récent)
  const takenGames = new Set<ZGameId>();
  const winners = band.filter((n) => !out.has(n) && W(n) > 0).sort((a, b) => W(a) - W(b));
  for (const n of winners) {
    const alone = (id: ZGameId) => (games.find((g) => g.id === id)?.o.winners.length === 1 ? 1 : 0);
    const best = [...won[n]].sort((a, b) =>
      Number(takenGames.has(a)) - Number(takenGames.has(b)) || alone(b) - alone(a) || s.playlist.indexOf(b) - s.playlist.indexOf(a))[0];
    // Titre déjà pris par un autre : « Le Revenant » s'il a perdu un jeu avant d'en gagner un
    if (takenGames.has(best)) {
      const lostIdx = games.findIndex((g) => lost[n].includes(g.id));
      const after = lostIdx >= 0 ? games.slice(lostIdx + 1).find((g) => won[n].includes(g.id)) : undefined;
      if (after) { out.set(n, { id: "comeback", name: n, game: after.id, lostGame: games[lostIdx].id, v: v(n, "comeback") }); continue; }
    }
    takenGames.add(best);
    out.set(n, { id: "game", name: n, game: best, v: v(n, `game-${best}`) });
  }

  // Les autres (aucune victoire) : un prix de consolation mesuré, si possible chacun le sien
  const usedKinds = new Set<TrophyId>();
  for (const n of band) {
    if (out.has(n)) continue;
    const options: TrophyId[] = [];
    if (seconds[n].length) options.push("second");
    if (L(n)) options.push("cascadeur");
    const id = options.find((o) => !usedKinds.has(o)) ?? options[0] ?? "touriste";
    usedKinds.add(id);
    out.set(n, {
      id, name: n, v: v(n, id),
      ...(id === "second" ? { games: seconds[n] } : id === "cascadeur" ? { games: lost[n] } : { n: games.length }),
    });
  }

  // Ordre de révélation : consolations, prix de jeux (dans l'ordre de la soirée), le Roi, puis le Naze en grand final
  const rank = (t: Trophy) =>
    t.id === "naze" ? 1000 : t.id === "king" ? 900
      : t.id === "game" || t.id === "comeback" ? 100 + s.playlist.indexOf(t.game!) : 0;
  return [...out.values()].sort((a, b) => rank(a) - rank(b) || band.indexOf(a.name) - band.indexOf(b.name));
}
