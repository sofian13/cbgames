import type { MascotColor, MascotMood } from "@/components/Mascot";

/** Les jeux mis en avant dans l'app mobile (les autres restent sur le site). */
export interface AppGame {
  id: string;
  color: MascotColor;
  mood: MascotMood;
  /** Jouable sur un seul téléphone (pass-and-play, marche sans réseau) */
  local: boolean;
  /** Jouable en ligne, chacun sur son téléphone */
  online: boolean;
  /** Contenu 18+ (alcool / coquin) */
  adult?: boolean;
}

export interface AppSection {
  id: string;
  title: string;
  subtitle: string;
  games: AppGame[];
}

export const APP_SECTIONS: AppSection[] = [
  {
    id: "bluff",
    title: "Qui ment ?",
    subtitle: "Bluff, rôles secrets et gros débats",
    games: [
      { id: "undercover", color: "pink", mood: "sus", local: true, online: true },
      { id: "loup-garou", color: "purple", mood: "shifty", local: false, online: true },
      { id: "infiltre", color: "coral", mood: "sus", local: false, online: true },
      { id: "le-bluffeur", color: "yellow", mood: "wink", local: true, online: true },
    ],
  },
  {
    id: "ambiance",
    title: "Ambiance",
    subtitle: "Pour lancer la soirée",
    games: [
      { id: "top-ten", color: "coral", mood: "fire", local: true, online: true },
      { id: "tu-prefere", color: "sky", mood: "thinking", local: true, online: false },
      { id: "longueur-onde", color: "lavender", mood: "mindblown", local: true, online: true },
      { id: "make-guess", color: "mint", mood: "laughing", local: true, online: false },
    ],
  },
  {
    id: "cartes",
    title: "Cartes",
    subtitle: "Les classiques, avec ou sans bots",
    games: [
      { id: "uno", color: "yellow", mood: "cool", local: false, online: true },
      { id: "president", color: "purple", mood: "cool", local: false, online: true },
      { id: "le-bus", color: "coral", mood: "rofl", local: false, online: true, adult: true },
    ],
  },
  {
    id: "rapide",
    title: "Vite, vite !",
    subtitle: "Réflexes et mots",
    games: [
      { id: "bomb-party", color: "coral", mood: "shocked", local: false, online: true },
      { id: "code-names", color: "sky", mood: "thinking", local: false, online: true },
    ],
  },
  {
    id: "duo",
    title: "À deux",
    subtitle: "Pour les couples et les meilleurs potes",
    games: [
      { id: "pensez-pareil", color: "pink", mood: "love", local: true, online: true },
    ],
  },
  {
    id: "after",
    title: "After 🔞",
    subtitle: "Jeux à boire — avec modération",
    games: [
      { id: "picolette", color: "yellow", mood: "rofl", local: true, online: false, adult: true },
    ],
  },
];

export const APP_GAMES: AppGame[] = APP_SECTIONS.flatMap((s) => s.games);
export const APP_GAME_IDS = new Set(APP_GAMES.map((g) => g.id));

export function getAppGame(id: string): AppGame | undefined {
  return APP_GAMES.find((g) => g.id === id);
}
