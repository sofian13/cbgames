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
  /**
   * Fin du jeu en cours reçue du jeu lui-même (signal de la DERNIÈRE partie terminée de ce jeu),
   * en attente de l'annonce. winners = exactement ceux que le jeu a désignés (vide = pas de gagnant) ;
   * unknown = gagnants du jeu introuvables dans la bande (à corriger, jamais perdus en silence).
   */
  pending?: Omit<SoireeOutcome, "winners"> & { winners?: string[]; unknown?: string[] };
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
  // Mime : équipes de deux, une bande impaire laisserait quelqu'un sans équipe
  if (g.id === "make-guess" && players % 2 !== 0) return false;
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

/** Bande sans doublons (casse, accents et espaces ignorés), 1re écriture gardée. */
export function uniqueBand(names: string[]): string[] {
  const out: string[] = [];
  for (const raw of names) {
    const n = (raw ?? "").replace(/\s+/g, " ").trim();
    if (n && !out.some((x) => norm(x) === norm(n))) out.push(n);
  }
  return out;
}

export function startSoiree(names: string[], vibe: Vibe, length: SoireeLength, playlist: ZGameId[]) {
  const band = uniqueBand(names);
  commit({
    v: 1, band, vibe, length, playlist, index: 0, phase: "intro",
    points: Object.fromEntries(band.map((n) => [n, 0])),
    results: playlist.map(() => null),
    played: 0,
    startedAt: Date.now(),
  });
}

/** Reprise : un jeu interrompu repart de son écran de transition (le résultat d'avant la fermeture est oublié). */
export function resumeSoiree() {
  if (state && state.phase === "playing") commit({ ...state, phase: "intro", pending: undefined });
}

export function setPhase(phase: SoireePhase) {
  if (!state) return;
  // Lancement d'un jeu : aucun résultat ne peut venir d'avant
  commit(phase === "playing" && state.phase !== "playing" ? { ...state, phase, pending: undefined } : { ...state, phase });
}

/** Passe au jeu suivant (ou au podium). */
function advance(s: SoireeState): SoireeState {
  const index = s.index + 1;
  return { ...s, index, phase: index >= s.playlist.length ? "end" : "intro" };
}

export function skipGame() {
  if (state) commit(advance({ ...state, pending: undefined }));
}

/** Comparaison tolérante des prénoms : accents, casse et espaces ignorés. */
const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
/** Prénom du jeu → prénom de la bande (null si inconnu). */
export function inBand(band: string[], name: string | null | undefined): string | null {
  if (!name || !name.trim()) return null;
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
  // Les gagnants sont ceux que le jeu a désignés (règle unique, src/lib/game-finished.ts) : on ne les
  // recalcule jamais ici. Un prénom introuvable dans la bande est gardé à part (annonce + « Corriger »).
  const named = (d.winners ?? []).map((w) => (w ?? "").trim()).filter(Boolean);
  const winners = Array.from(new Set(named.map((w) => inBand(band, w)).filter((w): w is string => Boolean(w))));
  const unknown = Array.from(new Set(named.filter((w) => !inBand(band, w))));
  commit({
    ...state,
    pending: {
      loser: inBand(band, d.loser),
      ...(ranking.length >= 2 ? { ranking } : {}),
      winners,
      ...(unknown.length ? { unknown } : {}),
    },
  });
}

/**
 * Ce que l'écran gagnant annonce : EXACTEMENT les gagnants désignés par le jeu (dernière partie terminée),
 * jamais déduits d'un classement ; + les prénoms du jeu introuvables dans la bande (à corriger).
 */
export function announced(s: SoireeState): { winners: string[]; unknown: string[] } {
  return {
    winners: (s.pending?.winners ?? []).filter((w) => s.band.includes(w)),
    unknown: s.pending?.unknown ?? [],
  };
}

/** Enregistre les gagnants du jeu en cours (+1 point chacun) puis passe à la suite. */
export function recordWinners(names: string[]) {
  // Garde : une seule fois par jeu de la playlist (écran « gagnant » du jeu en cours uniquement)
  if (!state || state.phase !== "winner" || state.index >= state.playlist.length) return;
  const band = state.band;
  const winners = Array.from(new Set(names.map((n) => inBand(band, n)).filter((n): n is string => Boolean(n))));
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

/**
 * Rois de la soirée = même règle que les jeux : le(s) 1er(s) au nombre de points (ex æquo = co-rois),
 * personne si toute la bande est à égalité ou si personne n'a de point.
 */
export function kingsOf(s: SoireeState): string[] {
  const rows = ranking(s);
  if (!rows.length || rows[0].points <= 0) return [];
  const top = rows.filter((r) => r.rank === 1).map((r) => r.name);
  return top.length < rows.length ? top : [];
}

/** Titre de chaque ligne du récap, selon le RANG (jamais « Roi » pour un non-roi, jamais « fair-play » pour un 1er). */
export function recapTitles(s: SoireeState, titles: string[], lastTitle: string): string[] {
  const rows = ranking(s);
  const kings = kingsOf(s);
  const lastRank = rows.length ? rows[rows.length - 1].rank : 0;
  let k = 0;
  return rows.map((r) => {
    if (kings.includes(r.name)) return titles[0];
    if (rows.length >= 4 && lastRank > 1 && r.rank === lastRank) return lastTitle;
    // Titres « fun » sans notion de rang, chacun le sien
    const fun = titles.slice(1);
    return fun[k++ % fun.length];
  });
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
  /** Jeux concernés (king / game : gagnés · second : finis 2e · cascadeur : finis derniers) */
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
  /** Perdant d'un jeu : seulement celui désigné par le jeu (même source que les stats « Ma bande ») */
  const loserOf = (o: SoireeOutcome): string | null => o.loser ?? null;
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

  // Le(s) Roi(s) : le plus de POINTS (comme le récap) ; ex æquo en tête = co-rois ; toute la bande à égalité = aucun
  const P = (n: string) => s.points[n] ?? 0;
  const kings = kingsOf(s);
  for (const k of kings) out.set(k, { id: "king", name: k, games: won[k], v: v(k, "king") });

  // Le Plus Gros Naze : seulement parmi les DERNIERS aux points (jamais à égalité avec un roi) ;
  // ex æquo en bas : départage par le plus de défaites, puis le pire classement moyen (sinon personne)
  const minP = Math.min(...band.map(P));
  const maxP = Math.max(...band.map(P));
  const nazePool = minP < maxP ? band.filter((n) => P(n) === minP && !out.has(n)) : [];
  const naze = nazePool.length && (minP === 0 || Math.max(...nazePool.map(L)) > 0)
    ? unique(nazePool, L, avgRank) : null;
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
    out.set(n, { id: "game", name: n, game: best, games: won[n], v: v(n, `game-${best}`) });
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
