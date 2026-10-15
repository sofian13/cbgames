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
  /** Gagnant(s) d'après le jeu (meilleur score), seulement si le jeu a un classement net — optionnel */
  winners?: string[];
  /** Classement mesuré par le jeu (rang 1 = meilleur, ex æquo = même rang) — optionnel */
  ranking?: GameRank[];
}

export interface GameRank { name: string; rank: number }

/** Scores d'une partie, dans l'ordre des prénoms (lowerWins : le plus petit gagne, ex. nombre de défaites). */
export interface GameScores { names: string[]; values: number[]; lowerWins?: boolean }

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
 */
export function useGameFinished(finished: boolean, info?: { loser?: string | null; scores?: GameScores; winners?: string[] | null }) {
  const latest = useRef(info);
  useEffect(() => { latest.current = info; });
  useEffect(() => {
    if (!finished) return;
    const sc = latest.current?.scores;
    const ranking = sc ? rankByScores(sc.names, sc.values, sc.lowerWins) : [];
    // Gagnants explicites du jeu (camp, équipe, dernier en vie…) prioritaires sur le podium des scores
    const explicit = (latest.current?.winners ?? []).map((w) => (w ?? "").trim()).filter(Boolean);
    const winners = explicit.length ? Array.from(new Set(explicit)) : ranking.length >= 2 ? topOf(ranking) : [];
    emitGameFinished({
      loser: latest.current?.loser ?? null,
      ...(ranking.length >= 2 ? { ranking } : {}),
      ...(winners.length ? { winners } : {}),
    });
  }, [finished]);
}

/** Classement « compétition » (1, 2, 2, 4) à partir des scores ; prénoms vides ignorés. */
export function rankByScores(names: string[], values: number[], lowerWins = false): GameRank[] {
  const rows = names
    .map((name, i) => ({ name: (name ?? "").trim(), v: Number.isFinite(values[i]) ? values[i] : 0 }))
    .filter((r) => r.name);
  const better = (a: number, b: number) => (lowerWins ? a < b : a > b);
  return rows
    .map((r) => ({ name: r.name, rank: 1 + rows.filter((x) => better(x.v, r.v)).length }))
    .sort((a, b) => a.rank - b.rank);
}

/** Les premiers ex æquo, seulement si c'est un vrai podium (pas la moitié de la table ou plus). */
export function topOf(ranking: GameRank[]): string[] {
  const top = ranking.filter((r) => r.rank === 1).map((r) => r.name);
  return top.length && top.length <= Math.max(1, Math.floor(ranking.length / 2)) ? top : [];
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
