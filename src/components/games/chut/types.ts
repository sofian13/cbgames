/**
 * Types partagés de « Chut ! » (contenu dans les 3 langues : content.fr/en/es.ts).
 */

/** Famille d'une munition du Clown (pictogramme + consigne « bouton ou pas »). */
export type AmmoKind = "voice" | "face" | "mime" | "question" | "sound" | "story";

export interface Ammo {
  kind: AmmoKind;
  text: string;
}

export interface ChutContent {
  /** Munitions du Clown (≥ 150) */
  ammo: Ammo[];
  /** Pack 18+ coquin, non explicite (décoché par défaut) */
  adult: Ammo[];
  /** Mode « Toute la table » : scènes absurdes à lire en silence */
  table: string[];
  /** Gages pour celui qui craque */
  dares: string[];
}
