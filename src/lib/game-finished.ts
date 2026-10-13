import { useEffect } from "react";

/**
 * Signal « partie terminée » : un jeu l'émet quand il arrive sur son écran de fin
 * (pas quand on quitte au milieu). L'app Zinzin l'écoute pour la demande de note
 * (zinzin/src/rating.ts) ; sur le site web personne n'écoute, il ne se passe rien.
 */
export const GAME_FINISHED_EVENT = "zz:game-finished";

export interface GameFinishedDetail {
  /** Fin d'une Soirée Zinzin complète (et non d'un jeu) */
  soiree?: boolean;
}

export function emitGameFinished(detail: GameFinishedDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<GameFinishedDetail>(GAME_FINISHED_EVENT, { detail }));
}

/** Une ligne dans le jeu : `useGameFinished(phase === "end")` → émis à chaque arrivée sur l'écran de fin. */
export function useGameFinished(finished: boolean) {
  useEffect(() => {
    if (finished) emitGameFinished();
  }, [finished]);
}
