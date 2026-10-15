import { useEffect, useRef } from "react";

/**
 * Signal « partie terminée » : un jeu l'émet quand il arrive sur son écran de fin
 * (pas quand on quitte au milieu). L'app Zinzin l'écoute pour la demande de note
 * (zinzin/src/rating.ts) et les stats de « Ma bande » (src/lib/band-stats.ts) ;
 * sur le site web personne n'écoute, il ne se passe rien.
 */
export const GAME_FINISHED_EVENT = "zz:game-finished";

export interface GameFinishedDetail {
  /** Fin d'une Soirée Zinzin complète (et non d'un jeu) */
  soiree?: boolean;
  /** Id du jeu terminé (rempli tout seul avec le jeu en cours, voir setCurrentGame) */
  gameId?: string;
  /** Celui qui a le plus perdu la partie, si le jeu le sait sans ambiguïté */
  loser?: string | null;
  /** Prénoms de la table (rempli tout seul avec la dernière table lancée dans ce jeu, voir setCurrentPlayers) */
  players?: string[];
  /**
   * Gagnant(s) désignés par le jeu (règle unique, voir decideWinners) : toujours présent quand le
   * signal vient de useGameFinished — tableau vide = le jeu dit explicitement « pas de gagnant ».
   */
  winners?: string[];
  /** Classement mesuré par le jeu (rang 1 = meilleur, ex æquo = même rang) — optionnel */
  ranking?: GameRank[];
}

export interface GameRank { name: string; rank: number }

/**
 * Scores d'une partie, dans l'ordre des prénoms (lowerWins : le plus petit gagne, ex. nombre de défaites).
 * tiebreak : critère de départage des ex æquo, LE MÊME que celui de l'écran de fin du jeu
 * (ex. Verre : le moins de verres renversés) ; tiebreakLowerWins : le plus petit départage.
 */
export interface GameScores { names: string[]; values: number[]; lowerWins?: boolean; tiebreak?: number[]; tiebreakLowerWins?: boolean }

/* Jeu affiché en ce moment (posé par l'écran de jeu de l'app) : les jeux n'ont pas à connaître leur id */
let currentGame: string | null = null;
export function setCurrentGame(id: string | null) {
  currentGame = id;
  currentPlayers = null; // nouvelle partie : on ne connaît pas encore la table
}
export function getCurrentGame(): string | null {
  return currentGame;
}

/* Table du jeu en cours : posée au lancement (« C'est parti », duo, bande de la Soirée).
 * Un jeu sans écran de prénoms n'en pose pas : ses parties ne comptent pour personne. */
let currentPlayers: string[] | null = null;
export function setCurrentPlayers(names: string[] | null) {
  currentPlayers = names && names.length ? names.slice(0, 24) : null;
}

export function emitGameFinished(detail: GameFinishedDetail = {}) {
  if (typeof window === "undefined") return;
  const d: GameFinishedDetail = detail.soiree
    ? detail
    : { ...detail, gameId: detail.gameId ?? currentGame ?? undefined, players: detail.players ?? currentPlayers ?? undefined };
  window.dispatchEvent(new CustomEvent<GameFinishedDetail>(GAME_FINISHED_EVENT, { detail: d }));
}

/**
 * Une ligne dans le jeu : `useGameFinished(phase === "end")` → émis à chaque arrivée sur l'écran de fin.
 * Optionnel : `{ loser }`, `{ scores }` (classement + gagnants) et `{ winners }` (gagnants
 * désignés par le jeu lui-même, ex. l'équipe ou le camp gagnant), lus au moment de la fin.
 * Les gagnants suivent la règle unique (decideWinners) : l'écran de fin du jeu doit couronner les mêmes
 * (winnersOf pour les jeux à scores).
 */
export function useGameFinished(finished: boolean, info?: FinishedInfo) {
  const latest = useRef(info);
  useEffect(() => { latest.current = info; });
  useEffect(() => {
    if (!finished) return;
    emitGameFinished(finishedPayload(latest.current, currentPlayers));
  }, [finished]);
}

/** Ce qu'un jeu sait de sa fin de partie. */
export interface FinishedInfo {
  loser?: string | null;
  scores?: GameScores;
  winners?: string[] | null;
  /** Le jeu dit explicitement « pas de gagnant » (ex. « Terminer » avant que tout le monde ait joué) */
  noWinner?: boolean;
}

/**
 * Contenu du signal de fin (pur, testable) : classement + gagnants selon la règle unique.
 * `table` = prénoms de la table si le jeu ne fournit pas de scores (sert à la règle « toute la table »).
 */
export function finishedPayload(info: FinishedInfo | undefined, table?: string[] | null): GameFinishedDetail {
  // Partie arrêtée avant que chacun ait joué : pas de gagnant (ni classement, ni perdant)
  if (info?.noWinner) return { loser: null, winners: [] };
  const ranking = info?.scores ? rankingOf(info.scores) : [];
  const winners = decideWinners({ winners: info?.winners, ranking }, table);
  return {
    loser: info?.loser ?? null,
    ...(ranking.length >= 2 ? { ranking } : {}),
    winners,
  };
}

/**
 * RÈGLE UNIQUE DES GAGNANTS (tous les jeux + la Soirée) :
 * - gagnants explicites du jeu (camp, équipe, dernier en vie…) s'il en donne ; sinon les rang 1 du classement
 *   (départage compris, cf. GameScores.tiebreak) ;
 * - plusieurs ex æquo en tête : ils gagnent tous ;
 * - SAUF si toute la table est à égalité (ou « gagne ») : aucun gagnant.
 */
export function decideWinners(info: { winners?: string[] | null; ranking?: GameRank[] }, table?: string[] | null): string[] {
  const ranking = info.ranking ?? [];
  const explicit = Array.from(new Set((info.winners ?? []).map((w) => (w ?? "").trim()).filter(Boolean)));
  if (explicit.length) {
    // La table : celle du classement si le jeu en a un, sinon celle posée au lancement
    const all = ranking.length >= 2 ? ranking.map((r) => r.name) : (table ?? []).map((n) => (n ?? "").trim()).filter(Boolean);
    const key = (n: string) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    const won = new Set(explicit.map(key));
    const tableKeys = new Set(all.map(key));
    if (tableKeys.size >= 2 && [...tableKeys].every((k) => won.has(k))) return [];
    return explicit;
  }
  return ranking.length >= 2 ? topOf(ranking) : [];
}

/** Classement d'une partie (départage compris). */
export function rankingOf(sc: GameScores): GameRank[] {
  return rankByScores(sc.names, sc.values, sc.lowerWins, sc.tiebreak, sc.tiebreakLowerWins);
}

/** Gagnant(s) d'une partie à scores, selon la règle unique — à utiliser AUSSI par l'écran de fin du jeu. */
export function winnersOf(sc: GameScores): string[] {
  return topOf(rankingOf(sc));
}

/** Classement « compétition » (1, 2, 2, 4) à partir des scores (+ départage éventuel) ; prénoms vides ignorés. */
export function rankByScores(names: string[], values: number[], lowerWins = false, tiebreak?: number[], tiebreakLowerWins = false): GameRank[] {
  const num = (v: number | undefined) => (Number.isFinite(v) ? (v as number) : 0);
  const rows = names
    .map((name, i) => ({ name: (name ?? "").trim(), v: num(values[i]), tb: tiebreak ? num(tiebreak[i]) : 0 }))
    .filter((r) => r.name);
  const better = (a: number, b: number, low: boolean) => (low ? a < b : a > b);
  const beats = (x: { v: number; tb: number }, r: { v: number; tb: number }) =>
    better(x.v, r.v, lowerWins) || (x.v === r.v && !!tiebreak && better(x.tb, r.tb, tiebreakLowerWins));
  return rows
    .map((r) => ({ name: r.name, rank: 1 + rows.filter((x) => beats(x, r)).length }))
    .sort((a, b) => a.rank - b.rank);
}

/** Les premiers (ex æquo compris) ; personne si toute la table est à égalité en tête. */
export function topOf(ranking: GameRank[]): string[] {
  const top = ranking.filter((r) => r.rank === 1).map((r) => r.name);
  return top.length && top.length < ranking.length ? top : [];
}

/** Le joueur au plus grand compteur (pertes, verres renversés…), seulement s'il est seul en tête et > 0. */
export function uniqueMax(names: string[], counts: number[]): string | null {
  let best = -1, who: string | null = null, tie = false;
  names.forEach((n, i) => {
    const v = counts[i] ?? 0;
    if (v > best) { best = v; who = n; tie = false; } else if (v === best) tie = true;
  });
  return best > 0 && !tie ? who : null;
}

/** Le dernier du classement (plus petit score), seulement s'il est seul en bas et qu'il y a au moins 2 joueurs. */
export function uniqueMin(names: string[], scores: number[]): string | null {
  if (names.length < 2) return null;
  let low = Infinity, who: string | null = null, tie = false;
  names.forEach((n, i) => {
    const v = scores[i] ?? 0;
    if (v < low) { low = v; who = n; tie = false; } else if (v === low) tie = true;
  });
  return tie ? null : who;
}
