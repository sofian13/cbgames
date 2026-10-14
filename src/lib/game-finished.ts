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
}

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
 * Optionnel : `{ loser }` (lu au moment de la fin).
 */
export function useGameFinished(finished: boolean, info?: { loser?: string | null }) {
  const latest = useRef(info);
  useEffect(() => { latest.current = info; });
  useEffect(() => {
    if (finished) emitGameFinished({ loser: latest.current?.loser ?? null });
  }, [finished]);
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
