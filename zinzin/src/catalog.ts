import type { ComponentType } from "react";
import type { GameProps } from "@/lib/games/types";
import type { MascotColor, MascotMood } from "@/components/Mascot";
import type { I18n } from "@/lib/i18n";
import type { ZCostume } from "./ui/costumes";
import type { ZGameId } from "./catalog-text";

export { GAME_TEXT, type ZGameText, type ZLine } from "./catalog-text";

/**
 * Catalogue de l'app Zinzin : uniquement des jeux sur UN SEUL téléphone.
 * Les textes (nom, accroche, exemple, règles, étapes, mini BD) sont dans
 * catalog-text.ts, en FR / EN / ES (le registry du site n'est plus lu).
 */
export interface ZGame {
  id: ZGameId;
  color: MascotColor;
  mood: MascotMood;
  /** Jouable sans payer */
  free?: boolean;
  /** Contenu alcool / coquin */
  adult?: boolean;
  /** Nouveau dans l'app */
  isNew?: boolean;
  /** « 3-12 », « 2+ », « 2 » (libellé traduit par playersLabel) */
  players: string;
  /** Déguisement du blob (reconnaître le jeu au premier coup d'œil) */
  costume?: ZCostume;
  load: () => Promise<{ default: ComponentType<GameProps> }>;
}

/** Couleur attitrée des personnages récurrents des mini BD (mêmes prénoms dans toutes les langues). */
export const CAST: Record<string, MascotColor> = {
  Léa: "pink", Malik: "sky", Inès: "yellow", Tom: "coral", Sarah: "mint", Hugo: "purple", Max: "lavender",
};

export interface ZSection {
  id: string;
  title: I18n<string>;
  subtitle: I18n<string>;
  ids: string[];
}

export const GAMES: ZGame[] = [
  { id: "undercover", costume: "groucho", color: "pink", mood: "sus", free: true, players: "3-12",
    load: () => import("@/components/games/undercover/undercover-game") },
  { id: "top-ten", costume: "ten", color: "coral", mood: "laughing", free: true, players: "2-10",
    load: () => import("@/components/games/top-ten/top-ten-game") },
  { id: "tu-prefere", costume: "split", color: "sky", mood: "thinking", free: true, players: "2+",
    load: () => import("@/components/games/tu-prefere/tu-prefere-game") },
  { id: "patate", costume: "potato", color: "yellow", mood: "shocked", isNew: true, players: "3-10",
    load: () => import("@/components/games/patate/patate-game") },
  { id: "purete", costume: "angeldevil", color: "lavender", mood: "wink", isNew: true, players: "1-12",
    load: () => import("@/components/games/purete/purete-game") },
  { id: "lache-pas", costume: "fuse", color: "coral", mood: "sus", isNew: true, players: "2-10",
    load: () => import("@/components/games/lache-pas/lache-pas-game") },
  { id: "verre", costume: "waiter", color: "mint", mood: "shocked", isNew: true, players: "2-10",
    load: () => import("@/components/games/verre/verre-game") },
  { id: "chut", costume: "shush", color: "yellow", mood: "laughing", isNew: true, players: "2-12",
    load: () => import("@/components/games/chut/chut-game") },
  { id: "pile-poil", costume: "stopwatch", color: "mint", mood: "mindblown", players: "2-10",
    load: () => import("@/components/games/pile-poil/pile-poil-game") },
  { id: "loup-garou", costume: "wolf", color: "purple", mood: "shifty", isNew: true, players: "5-16",
    load: () => import("@/components/games/loup-garou/loup-garou-local") },
  { id: "faux-temoin", costume: "blindfold", color: "sky", mood: "sus", isNew: true, players: "3-10",
    load: () => import("@/components/games/faux-temoin/faux-temoin-game") },
  { id: "le-bluffeur", costume: "pinocchio", color: "yellow", mood: "wink", players: "2-8",
    load: () => import("@/components/games/le-bluffeur/le-bluffeur-game") },
  { id: "longueur-onde", costume: "antenna", color: "lavender", mood: "mindblown", players: "2-8",
    load: () => import("@/components/games/longueur-onde/longueur-onde-game") },
  { id: "make-guess", costume: "mime", color: "mint", mood: "laughing", players: "4+",
    load: () => import("@/components/games/make-guess/make-guess-game") },
  { id: "guess-word", costume: "card", color: "sky", mood: "shocked", players: "2+",
    load: () => import("@/components/games/guess-word/guess-word-game") },
  { id: "category-chrono", costume: "hourglass", color: "coral", mood: "shocked", players: "2+",
    load: () => import("@/components/games/category-chrono/category-chrono-game") },
  { id: "code-names", costume: "spy", color: "sky", mood: "thinking", isNew: true, players: "4+",
    load: () => import("@/components/games/code-names/code-names-local") },
  { id: "pensez-pareil", costume: "duo", color: "pink", mood: "love", players: "2",
    load: () => import("@/components/games/pensez-pareil/pensez-pareil-game") },
  { id: "couple-quiz", costume: "hearts", color: "pink", mood: "kiss", players: "2",
    load: () => import("@/components/games/couple-quiz/couple-quiz-game") },
  { id: "picolette", costume: "beer", color: "yellow", mood: "rofl", adult: true, players: "2-10",
    load: () => import("@/components/games/picolette/picolette-game") },
  { id: "tgv", costume: "train", color: "purple", mood: "rofl", adult: true, players: "2-8",
    load: () => import("@/components/games/tgv/tgv-game") },
];

export const SECTIONS: ZSection[] = [
  { id: "top", ids: ["undercover", "picolette", "verre", "faux-temoin", "purete", "patate", "top-ten", "lache-pas", "tu-prefere"],
    title: { fr: "Les incontournables", en: "Must-plays", es: "Imprescindibles" },
    subtitle: { fr: "Pour lancer la soirée", en: "To get the night started", es: "Para arrancar la noche" } },
  { id: "zinzin", ids: ["verre", "patate", "chut", "lache-pas", "pile-poil"],
    title: { fr: "Que sur Zinzin", en: "Only on Zinzin", es: "Solo en Zinzin" },
    subtitle: { fr: "Le téléphone devient le jeu", en: "The phone becomes the game", es: "El móvil se convierte en el juego" } },
  { id: "bluff", ids: ["faux-temoin", "loup-garou", "undercover", "le-bluffeur"],
    title: { fr: "Qui ment ?", en: "Who's lying?", es: "¿Quién miente?" },
    subtitle: { fr: "Bluff et rôles secrets", en: "Bluffing and secret roles", es: "Faroles y roles secretos" } },
  { id: "devine", ids: ["code-names", "make-guess", "guess-word", "category-chrono"],
    title: { fr: "Fais deviner", en: "Guessing games", es: "A adivinar" },
    subtitle: { fr: "Mimes, mots et chrono", en: "Charades, words and timers", es: "Mímica, palabras y contrarreloj" } },
  { id: "ambiance", ids: ["chut", "purete", "top-ten", "longueur-onde", "tu-prefere", "pile-poil"],
    title: { fr: "Ambiance", en: "Party vibes", es: "Ambiente" },
    subtitle: { fr: "Débats, flair et réflexes", en: "Debates, instinct and reflexes", es: "Debates, olfato y reflejos" } },
  { id: "duo", ids: ["pensez-pareil", "couple-quiz"],
    title: { fr: "À deux", en: "For two", es: "En pareja" },
    subtitle: { fr: "Couples et meilleurs potes", en: "Couples and best friends", es: "Parejas y mejores amigos" } },
  { id: "after", ids: ["picolette", "tgv"],
    title: { fr: "After 🔞", en: "After party 🔞", es: "After 🔞" },
    subtitle: { fr: "Jeux à boire — avec modération", en: "Drinking games, in moderation", es: "Juegos para beber, con moderación" } },
];

/**
 * Carrousel de l'accueil (défile tout seul, swipe, boucle).
 * À MODIFIER À CHAQUE NOUVEAUTÉ : ajouter / retirer / réordonner des lignes.
 * - `gameId` : jeu ouvert au tap (absent = slide d'accueil non cliquable).
 *   Si le jeu n'est pas (encore) dans GAMES, la slide est masquée.
 * - `kicker` : petit texte au-dessus du titre (phrase normale, pas de majuscules).
 * - `bg` : couleur de fond (plein) ou dégradé CSS ; `ink` : couleur du texte.
 * - `blob` / `mood` : le blob qui déborde de la carte ; `buddy` : un 2e petit blob.
 */
export interface ZFeatured {
  id: string;
  gameId?: string;
  kicker: I18n<string>;
  title: I18n<string>;
  subtitle: I18n<string>;
  bg: string;
  ink: string;
  blob: MascotColor;
  mood: MascotMood;
  buddy?: { color: MascotColor; mood: MascotMood };
  /** Déguisement du blob (par défaut : celui du jeu) */
  costume?: ZCostume;
}

export const FEATURED: ZFeatured[] = [
  { id: "hero",
    kicker: { fr: "Ce soir", en: "Tonight", es: "Esta noche" },
    title: { fr: "On joue à quoi ce soir ?", en: "What are we playing tonight?", es: "¿A qué jugamos esta noche?" },
    subtitle: { fr: "Un seul téléphone, tout le monde joue.", en: "One phone, everyone plays.", es: "Un solo móvil y juega todo el mundo." },
    bg: "linear-gradient(135deg,#7A4EE8 0%,#B743D8 55%,#FF3EA5 100%)", ink: "#fff",
    blob: "yellow", mood: "laughing", buddy: { color: "mint", mood: "shocked" } },
  { id: "verre", gameId: "verre", costume: "waiter",
    kicker: { fr: "Nouveau · tiens-le bien droit", en: "New · keep it steady", es: "Nuevo · mantenlo recto" },
    title: { fr: "Le Verre Invisible", en: "The Invisible Glass", es: "El Vaso Invisible" },
    subtitle: { fr: "Le tél devient un plateau. Verse, passe… ne renverse rien !", en: "Your phone's a tray. Pour, pass… don't spill a drop!", es: "El móvil es una bandeja. Sirve, pasa… ¡no derrames nada!" },
    bg: "#52C7FF", ink: "#15082E", blob: "mint", mood: "shocked", buddy: { color: "pink", mood: "laughing" } },
  { id: "purete", gameId: "purete",
    kicker: { fr: "Tout nouveau", en: "Brand new", es: "Novedad" },
    title: { fr: "Test de pureté", en: "Purity Test", es: "Test de Pureza" },
    subtitle: { fr: "Ange ou démon ? Le tél tranche.", en: "Angel or devil? The phone decides.", es: "¿Ángel o demonio? El móvil decide." },
    bg: "#A98BFF", ink: "#15082E", blob: "white", mood: "wink", costume: "angeldevil", buddy: { color: "pink", mood: "kiss" } },
  { id: "patate", costume: "potato", gameId: "patate",
    kicker: { fr: "Le tél va exploser", en: "The phone's gonna blow", es: "El móvil va a explotar" },
    title: { fr: "La Patate", en: "Hot Potato", es: "La Patata Caliente" },
    subtitle: { fr: "Passe-le avant le BOUM !", en: "Pass it on before the BOOM!", es: "¡Pásalo antes del BUM!" },
    bg: "#FFD23F", ink: "#15082E", blob: "coral", mood: "shocked" },
  { id: "loup-garou", costume: "wolf", gameId: "loup-garou",
    kicker: { fr: "Plus besoin de meneur", en: "No game master needed", es: "Sin necesidad de narrador" },
    title: { fr: "Loup-Garou", en: "Werewolf", es: "El Hombre Lobo" },
    subtitle: { fr: "Le tél raconte la nuit pour vous.", en: "The phone narrates the night for you.", es: "El móvil narra la noche por ti." },
    bg: "#7A4EE8", ink: "#fff", blob: "lavender", mood: "shifty", buddy: { color: "yellow", mood: "shocked" } },
  { id: "lache-pas", costume: "fuse", gameId: "lache-pas",
    kicker: { fr: "Nouveau", en: "New", es: "Nuevo" },
    title: { fr: "Lâche pas !", en: "Don't Let Go!", es: "¡No Sueltes!" },
    subtitle: { fr: "Un doigt sur l'écran. Tiens bon !", en: "One finger on the screen. Hold on!", es: "Un dedo en la pantalla. ¡Aguanta!" },
    bg: "#FF6B5B", ink: "#15082E", blob: "yellow", mood: "sus" },
];

/**
 * Type de chaque jeu, pour la Soirée Zinzin (alterner les ambiances).
 * Typé sur ZGameId : un nouveau jeu dans catalog-text.ts doit avoir son type ici.
 * bluff · tel (le téléphone est le jeu) · devine · rapide · ambiance · boire (18+) · duo (2 joueurs)
 */
export type ZKind = "bluff" | "tel" | "devine" | "rapide" | "ambiance" | "boire" | "duo";
export const GAME_KIND: Record<ZGameId, ZKind> = {
  undercover: "bluff",
  "faux-temoin": "bluff",
  "loup-garou": "bluff",
  "le-bluffeur": "bluff",
  patate: "tel",
  "lache-pas": "tel",
  "pile-poil": "tel",
  verre: "tel",
  chut: "ambiance",
  "make-guess": "devine",
  "guess-word": "devine",
  "code-names": "devine",
  "longueur-onde": "devine",
  "category-chrono": "rapide",
  "top-ten": "ambiance",
  "tu-prefere": "ambiance",
  purete: "ambiance",
  picolette: "boire",
  tgv: "boire",
  "pensez-pareil": "duo",
  "couple-quiz": "duo",
};

/** « 3-12 » → [3, 12] ; « 2+ » → [2, ∞] ; « 2 » → [2, 2]. */
export function playerRange(g: ZGame): [number, number] {
  const m = g.players.match(/^(\d+)\s*(?:-\s*(\d+)|(\+))?$/);
  if (!m) return [2, Infinity];
  const min = Number(m[1]);
  return [min, m[2] ? Number(m[2]) : m[3] ? Infinity : min];
}

export function getZGame(id: string): ZGame | undefined {
  return GAMES.find((g) => g.id === id);
}
