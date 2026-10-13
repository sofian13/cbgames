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

/** Les peines peuvent-elles inclure des gorgées ? (Chill = gages uniquement) */
export function sipsAllowed(usual: boolean): boolean {
  const m = getPartyMood();
  return m === "chill" ? false : m === "folle" ? true : usual;
}
