import type { ComponentType } from "react";
import type { GameProps } from "@/lib/games/types";
import type { MascotColor, MascotMood } from "@/components/Mascot";

/**
 * Catalogue de l'app Zinzin : uniquement des jeux sur UN SEUL téléphone.
 * Les textes (nom, accroche, exemple, règles) viennent du registry du site
 * (`getGameById`) sauf si on les surcharge ici (`meta`).
 */
export interface ZGame {
  id: string;
  color: MascotColor;
  mood: MascotMood;
  /** Jouable sans payer */
  free?: boolean;
  /** Contenu alcool / coquin */
  adult?: boolean;
  /** Nouveau dans l'app */
  isNew?: boolean;
  players: string;
  load: () => Promise<{ default: ComponentType<GameProps> }>;
  /** Surcharge des textes du registry (jeux propres à l'app) */
  meta?: { name: string; icon: string; pitch: string; example: string; rules: string[]; minPlayers: number; maxPlayers: number };
}

export interface ZSection {
  id: string;
  title: string;
  subtitle: string;
  ids: string[];
}

export const GAMES: ZGame[] = [
  { id: "undercover", color: "pink", mood: "sus", free: true, players: "3-12",
    load: () => import("@/components/games/undercover/undercover-game") },
  { id: "top-ten", color: "coral", mood: "fire", free: true, players: "2-10",
    load: () => import("@/components/games/top-ten/top-ten-game") },
  { id: "tu-prefere", color: "sky", mood: "thinking", free: true, players: "2+",
    load: () => import("@/components/games/tu-prefere/tu-prefere-game") },
  { id: "pile-poil", color: "mint", mood: "mindblown", players: "2-10",
    load: () => import("@/components/games/pile-poil/pile-poil-game") },
  { id: "le-bluffeur", color: "yellow", mood: "wink", players: "2-8",
    load: () => import("@/components/games/le-bluffeur/le-bluffeur-game") },
  { id: "longueur-onde", color: "lavender", mood: "mindblown", players: "2-10",
    load: () => import("@/components/games/longueur-onde/longueur-onde-game") },
  { id: "make-guess", color: "mint", mood: "laughing", players: "4+",
    load: () => import("@/components/games/make-guess/make-guess-game") },
  { id: "guess-word", color: "sky", mood: "shocked", players: "2+",
    load: () => import("@/components/games/guess-word/guess-word-game") },
  { id: "category-chrono", color: "coral", mood: "shocked", players: "2+",
    load: () => import("@/components/games/category-chrono/category-chrono-game") },
  { id: "pensez-pareil", color: "pink", mood: "love", players: "2",
    load: () => import("@/components/games/pensez-pareil/pensez-pareil-game") },
  { id: "couple-quiz", color: "pink", mood: "kiss", players: "2",
    load: () => import("@/components/games/couple-quiz/couple-quiz-game") },
  { id: "picolette", color: "yellow", mood: "rofl", adult: true, players: "2-10",
    load: () => import("@/components/games/picolette/picolette-game") },
  { id: "tgv", color: "purple", mood: "rofl", adult: true, players: "2-8",
    load: () => import("@/components/games/tgv/tgv-game") },
];

export const SECTIONS: ZSection[] = [
  { id: "top", title: "Les incontournables", subtitle: "Pour lancer la soirée", ids: ["undercover", "top-ten", "pile-poil", "le-bluffeur", "tu-prefere"] },
  { id: "bluff", title: "Qui ment ?", subtitle: "Bluff et rôles secrets", ids: ["undercover", "le-bluffeur"] },
  { id: "devine", title: "Fais deviner", subtitle: "Mimes, mots et chrono", ids: ["make-guess", "guess-word", "category-chrono"] },
  { id: "ambiance", title: "Ambiance", subtitle: "Débats, flair et réflexes", ids: ["top-ten", "longueur-onde", "tu-prefere", "pile-poil"] },
  { id: "duo", title: "À deux", subtitle: "Couples et meilleurs potes", ids: ["pensez-pareil", "couple-quiz"] },
  { id: "after", title: "After 🔞", subtitle: "Jeux à boire — avec modération", ids: ["picolette", "tgv"] },
];

export function getZGame(id: string): ZGame | undefined {
  return GAMES.find((g) => g.id === id);
}
