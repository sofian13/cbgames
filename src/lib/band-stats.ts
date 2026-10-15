/**
 * Stats de « Ma bande » (app) : parties terminées, jeu le plus joué, qui perd le plus,
 * dernière partie. 100 % local (localStorage), alimenté par le signal central de fin
 * de partie (src/lib/game-finished.ts) : aucun jeu n'écrit ici directement.
 * Pas de compteur de gorgées : aucun point central ne les connaît, on n'invente pas de chiffre.
 * « played » (parties par prénom) n'est mesuré que pour les parties dont on connaît la table
 * (écran des prénoms, duo, Soirée) : une partie sans prénoms ne compte pour personne.
 */
import type { ReactNode } from "react";
import { GAME_FINISHED_EVENT, getCurrentGame, type GameFinishedDetail } from "@/lib/game-finished";
import type { Lang } from "@/lib/i18n";

const KEY = "zz-band-stats-v1";
const EVENT = "zz:band-stats";

export interface BandStats {
  /** Parties terminées (écran de fin atteint) */
  games: number;
  /** Parties par jeu (id du catalogue) */
  byGame: Record<string, number>;
  /** Défaites par prénom (clé normalisée → prénom affiché + nombre) */
  losses: Record<string, { name: string; n: number }>;
  /** Date de la dernière partie terminée (ms), 0 si aucune */
  last: number;
  /** Parties jouées par prénom (clé normalisée), quand la table est connue — optionnel (anciennes données) */
  played: Record<string, { name: string; n: number }>;
}

const EMPTY: BandStats = { games: 0, byGame: {}, losses: {}, last: 0, played: {} };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

/** Compteurs par prénom ({ clé: { name, n } }), nettoyés. */
function counts(v: unknown): Record<string, { name: string; n: number }> {
  const out: Record<string, { name: string; n: number }> = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, x] of Object.entries(v as Record<string, unknown>).slice(0, 200)) {
    const o = x as { name?: unknown; n?: unknown } | null;
    if (typeof o?.name === "string" && o.name.trim() && int(o.n)) out[k] = { name: o.name.trim().slice(0, 24), n: int(o.n) };
  }
  return out;
}

function parse(raw: string | null): BandStats {
  if (!raw) return EMPTY;
  try {
    const p = JSON.parse(raw) as Partial<Record<keyof BandStats, unknown>>;
    const byGame: Record<string, number> = {};
    if (p.byGame && typeof p.byGame === "object") {
      for (const [k, v] of Object.entries(p.byGame as Record<string, unknown>).slice(0, 100)) if (int(v)) byGame[k.slice(0, 40)] = int(v);
    }
    return { games: int(p.games), byGame, losses: counts(p.losses), last: int(p.last), played: counts(p.played) };
  } catch {
    return EMPTY;
  }
}

let cacheRaw: string | null | undefined;
let cache: BandStats = EMPTY;

/** Instantané stable (pour useSyncExternalStore). */
export function getBandStats(): BandStats {
  let raw: string | null = null;
  try { raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null; } catch { raw = null; }
  if (raw !== cacheRaw) { cacheRaw = raw; cache = parse(raw); }
  return cache;
}

function write(s: BandStats | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch { /* stockage indisponible */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function subscribeBandStats(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

/** Compte une partie terminée. */
export function recordGame(gameId: string | undefined, loser?: string | null, players?: string[]): void {
  const s = getBandStats();
  const byGame = { ...s.byGame };
  if (gameId) byGame[gameId] = (byGame[gameId] ?? 0) + 1;
  const losses = { ...s.losses };
  const name = loser?.trim();
  if (name) {
    const k = norm(name);
    losses[k] = { name: name.slice(0, 24), n: (losses[k]?.n ?? 0) + 1 };
  }
  const played = { ...s.played };
  const seen = new Set<string>();
  for (const p of players ?? []) {
    const n = typeof p === "string" ? p.trim() : "";
    const k = norm(n);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    played[k] = { name: n.slice(0, 24), n: (played[k]?.n ?? 0) + 1 };
  }
  write({ games: s.games + 1, byGame, losses, last: Date.now(), played });
}

/** « Remettre à zéro » (compteurs + victoires datées). */
export function resetBandStats(): void {
  try { localStorage.removeItem(WINS_KEY); } catch { /* stockage indisponible */ }
  write(null);
}

/* ───────── Victoires datées (trophée du mois) ─────────
 * Clé à part (« zz-band-stats-v1 » garde son format) : par mois (« 2026-10 »), victoires par prénom.
 * Alimenté par les gagnants du signal de fin de partie (règle unique decideWinners), à partir de
 * cette version : les parties plus anciennes n'ont pas de date, elles ne comptent pour aucun mois. */
const WINS_KEY = "zz-band-wins-v1";
const WINS_MONTHS = 12;

/** Victoires par mois (« AAAA-MM ») puis par prénom (clé normalisée). */
export type BandWins = Record<string, Record<string, { name: string; n: number }>>;
const NO_WINS: BandWins = {};

/** Mois civil local d'une date (« 2026-10 »). */
export function bandMonthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseWins(raw: string | null): BandWins {
  if (!raw) return NO_WINS;
  try {
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object") return NO_WINS;
    const out: BandWins = {};
    for (const [m, v] of Object.entries(p as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}$/.test(m)) continue;
      const c = counts(v);
      if (Object.keys(c).length) out[m] = c;
    }
    return out;
  } catch {
    return NO_WINS;
  }
}

let winsRaw: string | null | undefined;
let winsCache: BandWins = NO_WINS;

/** Instantané stable des victoires datées (pour useSyncExternalStore, avec subscribeBandStats). */
export function getBandWins(): BandWins {
  let raw: string | null = null;
  try { raw = typeof localStorage !== "undefined" ? localStorage.getItem(WINS_KEY) : null; } catch { raw = null; }
  if (raw !== winsRaw) { winsRaw = raw; winsCache = parseWins(raw); }
  return winsCache;
}

/** Compte une victoire datée pour chaque gagnant d'une partie (ex æquo : chacun la sienne). */
export function recordWins(winners: string[] | undefined, at: number = Date.now()): void {
  const names = Array.from(new Map((winners ?? [])
    .map((w) => (typeof w === "string" ? w.trim() : ""))
    .filter(Boolean)
    .map((n) => [norm(n), n] as const)).entries());
  if (!names.length) return;
  const all = { ...getBandWins() };
  const m = bandMonthKey(new Date(at));
  const month = { ...(all[m] ?? {}) };
  for (const [k, n] of names) month[k] = { name: n.slice(0, 24), n: (month[k]?.n ?? 0) + 1 };
  all[m] = month;
  // On ne garde que les derniers mois
  const keep = Object.keys(all).sort().slice(-WINS_MONTHS);
  const out: BandWins = {};
  for (const k of keep) out[k] = all[k];
  try { localStorage.setItem(WINS_KEY, JSON.stringify(out)); } catch { /* stockage indisponible */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Champion(s) d'un mois : le plus de victoires (égalité : co-champions, ordre alphabétique), ou null. */
export function monthChampions(w: BandWins, month: string): { names: string[]; n: number } | null {
  const rows = Object.values(w[month] ?? {});
  const n = Math.max(0, ...rows.map((r) => r.n));
  if (!n) return null;
  return { names: rows.filter((r) => r.n === n).map((r) => r.name).sort((a, b) => a.localeCompare(b)), n };
}

/** Champions des mois précédents (du plus récent au plus ancien). */
export function pastChampions(w: BandWins, current: string, limit = 3): { month: string; names: string[]; n: number }[] {
  return Object.keys(w)
    .filter((m) => m < current)
    .sort((a, b) => b.localeCompare(a))
    .flatMap((m) => {
      const c = monthChampions(w, m);
      return c ? [{ month: m, ...c }] : [];
    })
    .slice(0, limit);
}

/** Le jeu le plus joué (id), seulement s'il est seul en tête. */
export function favoriteGame(s: BandStats): string | null {
  let best = 0, id: string | null = null, tie = false;
  for (const [k, n] of Object.entries(s.byGame)) {
    if (n > best) { best = n; id = k; tie = false; } else if (n === best) tie = true;
  }
  return tie ? null : id;
}

/** Celui qui perd le plus (prénom + nombre), seulement s'il est seul en tête. */
export function topLoser(s: BandStats): { name: string; n: number } | null {
  let best: { name: string; n: number } | null = null, tie = false;
  for (const v of Object.values(s.losses)) {
    if (!best || v.n > best.n) { best = v; tie = false; } else if (v.n === best.n) tie = true;
  }
  return best && !tie ? best : null;
}

/** Clé de comparaison d'un prénom (la même que celle des compteurs). */
export const bandStatsKey = norm;

/** Les perdants, du plus au moins (égalités : ordre alphabétique). */
export function losersRanking(s: BandStats): { name: string; n: number }[] {
  return Object.values(s.losses).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

/** Les jeux les plus joués (id + nombre), du plus au moins. */
export function gamesRanking(s: BandStats): { id: string; n: number }[] {
  return Object.entries(s.byGame).map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));
}

/* Blob déguisé d'un jeu + sa couleur : fournis par l'app (catalogue + ZBlob), sinon rien */
export interface BandStatsGameArt {
  art: (id: string, size: number) => ReactNode;
  color: (id: string) => string | undefined;
}
let gameArt: BandStatsGameArt | null = null;
export function setBandStatsGameArt(a: BandStatsGameArt) {
  gameArt = a;
}
export function bandStatsGameArt(): BandStatsGameArt | null {
  return gameArt;
}

/* Nom affiché d'un jeu : fourni par l'app (catalogue), sinon rien */
let gameName: ((id: string, lang: Lang) => string | undefined) | null = null;
export function setBandStatsGameNames(fn: (id: string, lang: Lang) => string | undefined) {
  gameName = fn;
}
export function bandStatsGameName(id: string, lang: Lang): string | undefined {
  return gameName?.(id, lang);
}

let installed = false;
let lastEvent = 0;

/** À appeler une fois au démarrage de l'app : écoute les fins de partie. */
export function initBandStats() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener(GAME_FINISHED_EVENT, (e) => {
    const d = (e as CustomEvent<GameFinishedDetail>).detail ?? {};
    if (d.soiree) return; // la fin d'une Soirée n'est pas une partie de plus
    // Un même écran de fin peut émettre deux fois (StrictMode, re-montage) : on ignore les doublons
    const now = Date.now();
    if (now - lastEvent < 3000) return;
    lastEvent = now;
    recordGame(d.gameId ?? getCurrentGame() ?? undefined, d.loser, Array.isArray(d.players) ? d.players : undefined);
    if (Array.isArray(d.winners)) recordWins(d.winners);
  });
}
