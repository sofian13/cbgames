/**
 * Ambiance de la Soirée Zinzin, transmise aux jeux lancés depuis la soirée.
 * - "chill"  : rien de 18+, peines en gages uniquement (pas de gorgées)
 * - "soiree" : réglages par défaut de chaque jeu
 * - "folle"  : packs 18+ cochés d'office là où le jeu en propose, gorgées autorisées
 * Hors soirée : null → chaque jeu garde ses réglages habituels.
 *
 * Les jeux lisent getPartyMood() UNE FOIS, à l'initialisation de leurs réglages
 * (valeur par défaut d'un useState), le joueur peut toujours décocher ensuite.
 */

import { useSyncExternalStore } from "react";

export type PartyMood = "chill" | "soiree" | "folle";

const KEY = "zz-party-mood";

export function setPartyMood(mood: PartyMood | null) {
  try {
    if (mood) sessionStorage.setItem(KEY, mood);
    else sessionStorage.removeItem(KEY);
  } catch { /* stockage indisponible */ }
}

export function getPartyMood(): PartyMood | null {
  try {
    const v = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(KEY) : null;
    return v === "chill" || v === "soiree" || v === "folle" ? v : null;
  } catch {
    return null;
  }
}

/** Valeur par défaut d'une case « pack 18+ » selon l'ambiance (sinon la valeur habituelle du jeu). */
export function adultDefault(usual: boolean): boolean {
  const m = getPartyMood();
  return m === "folle" ? true : m === "chill" ? false : usual;
}

/**
 * Réglage global « Mode sans alcool » (Réglages de l'app, persistant) :
 * toutes les peines deviennent des gages, dans tous les jeux, quelle que soit l'ambiance.
 */
const NO_ALCOHOL_KEY = "zz-no-alcohol";
const noAlcListeners = new Set<() => void>();

export function isNoAlcohol(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(NO_ALCOHOL_KEY) === "1";
  } catch {
    return false;
  }
}

export function setNoAlcohol(on: boolean) {
  try {
    if (on) localStorage.setItem(NO_ALCOHOL_KEY, "1");
    else localStorage.removeItem(NO_ALCOHOL_KEY);
  } catch { /* stockage indisponible */ }
  noAlcListeners.forEach((l) => l());
}

/** Version React (se met à jour quand on bascule le réglage). */
export function useNoAlcohol(): boolean {
  return useSyncExternalStore(
    (cb) => { noAlcListeners.add(cb); return () => { noAlcListeners.delete(cb); }; },
    isNoAlcohol,
    () => false,
  );
}

/**
 * Les peines peuvent-elles inclure des gorgées ?
 * Mode sans alcool ou Soirée « Chill » = gages uniquement (et l'option gorgées est masquée).
 */
export function sipsAllowed(usual: boolean): boolean {
  if (isNoAlcohol()) return false;
  const m = getPartyMood();
  return m === "chill" ? false : m === "folle" ? true : usual;
}

/** Mots qui trahissent une gorgée dans un texte (FR / EN / ES). */
export const SIP_WORDS = /gorg[ée]e|\bsips?\b|\btragos?\b/i;

/** Remplace la (les) ligne(s) qui parlent de gorgées par `replacement` (mode sans alcool). */
export function soberLines(lines: string[], replacement: string): string[] {
  return lines.map((l) => (SIP_WORDS.test(l) ? replacement : l));
}
