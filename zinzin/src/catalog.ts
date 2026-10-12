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
  { id: "patate", color: "yellow", mood: "shocked", isNew: true, players: "3-10",
    load: () => import("@/components/games/patate/patate-game"),
    meta: {
      name: "La Patate", icon: "🥔", minPlayers: 3, maxPlayers: 10,
      pitch: "Le téléphone est une patate chaude : réponds à la catégorie et passe-le avant qu'il explose !",
      example: "Catégorie « Un truc qu'on trouve dans une salle de bain ». Léa dit « brosse à dents » et passe à Malik, qui crie « peignoir ! » et passe à Inès. Le tic-tac s'emballe, Inès bloque… BOUM ! Elle a 2 gorgées ou un gage.",
      rules: [
        "Mettez-vous en cercle et entrez les prénoms dans l'ordre où vous êtes assis",
        "Une catégorie s'affiche : celui qui tient le tél dit UNE réponse à voix haute (pas de répétition)",
        "Il tape « J'ai répondu » et passe le tél à son voisin, vite !",
        "La mèche est cachée (15 à 60 s) et le tic-tac accélère : celui qui tient le tél au BOUM a perdu",
        "Mode « Ne la secoue pas ! » : trop secouée, la patate explose plus tôt",
        "Le perdant fait un gage (ou 1 à 3 gorgées, eau acceptée) et lance la manche suivante",
      ],
    } },
  { id: "lache-pas", color: "coral", mood: "sus", isNew: true, players: "2-10",
    load: () => import("@/components/games/lache-pas/lache-pas-game"),
    meta: {
      name: "Lâche pas !", icon: "💣", minPlayers: 2, maxPlayers: 10,
      pitch: "Tout le monde pose un doigt sur l'écran, une bombe s'arme : lâche avant le boum… mais pas le premier !",
      example: "On pose 4 doigts, la bombe s'arme. Un pétard claque, Tom lâche de peur. On tient… Inès lâche à 9 s, et BOUM à 10 s : Léa et Malik sont grillés, Inès gagne la couronne.",
      rules: [
        "Chacun pose UN doigt sur l'écran (2 à 5 doigts par manche ; à plus, on tourne)",
        "Une bombe s'arme et explose entre 4 et 22 s, personne ne sait quand",
        "Tu peux lâcher quand tu veux, mais un doigt levé ne revient pas",
        "Au BOUM, tous les doigts encore posés ont perdu",
        "Si tout le monde a lâché avant, c'est le premier à avoir lâché (le trouillard) qui perd",
        "Le dernier à lâcher avant le boum gagne la couronne 👑 et choisit qui fait un gage",
      ],
    } },
  { id: "pile-poil", color: "mint", mood: "mindblown", players: "2-10",
    load: () => import("@/components/games/pile-poil/pile-poil-game") },
  { id: "loup-garou", color: "purple", mood: "shifty", isNew: true, players: "5-16",
    load: () => import("@/components/games/loup-garou/loup-garou-local"),
    meta: {
      name: "Loup-Garou", icon: "🐺", minPlayers: 5, maxPlayers: 16,
      pitch: "Le grand classique, avec le téléphone en maître du jeu : il distribue les rôles et raconte la nuit.",
      example: "Le tél annonce « Les loups ouvrent les yeux… ». Ils choisissent Hugo. Au réveil, Hugo est mort : c'était la Voyante ! Le village débat 2 minutes et élimine Sarah… une simple villageoise. Les loups rigolent.",
      rules: [
        "Entrez les prénoms : le tél propose une répartition des rôles (Loups, Voyante, Sorcière, Chasseur…)",
        "Passez-vous le tél : chacun maintient le doigt pour voir son rôle en secret",
        "La nuit, posez le tél au centre : il appelle chaque rôle à voix haute, qui vient jouer sur l'écran",
        "Le jour : on découvre les morts, on débat (minuteur) puis on vote pour éliminer un suspect",
        "Le village gagne s'il élimine tous les loups · les loups gagnent dès qu'ils sont aussi nombreux que les villageois",
      ],
    } },
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
  { id: "code-names", color: "sky", mood: "thinking", isNew: true, players: "4+",
    load: () => import("@/components/games/code-names/code-names-local"),
    meta: {
      name: "Mots Espions", icon: "🕵️", minPlayers: 4, maxPlayers: 20,
      pitch: "Deux équipes, une grille de 25 mots : fais deviner les tiens avec un seul mot-indice.",
      example: "Tu es chef des Rouges, tes mots sont « Lune » et « Fusée ». Tu dis « Espace, 2 ». Ton équipe touche Lune ✅, puis Étoile… raté, c'était neutre : le tour passe.",
      rules: [
        "Formez 2 équipes, chacune choisit un chef",
        "Seuls les chefs regardent la carte secrète (appui long) : elle montre quels mots sont à quelle équipe",
        "Le chef dit à voix haute 1 mot + un nombre de mots liés",
        "Son équipe touche les mots sur le tél (2 taps pour valider) — tant qu'elle trouve, elle continue",
        "La Bombe = défaite immédiate. Première équipe à trouver tous ses mots gagne !",
      ],
    } },
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
  { id: "top", title: "Les incontournables", subtitle: "Pour lancer la soirée", ids: ["undercover", "patate", "top-ten", "lache-pas", "tu-prefere"] },
  { id: "zinzin", title: "Que sur Zinzin", subtitle: "Le téléphone devient le jeu", ids: ["patate", "lache-pas", "pile-poil"] },
  { id: "bluff", title: "Qui ment ?", subtitle: "Bluff et rôles secrets", ids: ["loup-garou", "undercover", "le-bluffeur"] },
  { id: "devine", title: "Fais deviner", subtitle: "Mimes, mots et chrono", ids: ["code-names", "make-guess", "guess-word", "category-chrono"] },
  { id: "ambiance", title: "Ambiance", subtitle: "Débats, flair et réflexes", ids: ["top-ten", "longueur-onde", "tu-prefere", "pile-poil"] },
  { id: "duo", title: "À deux", subtitle: "Couples et meilleurs potes", ids: ["pensez-pareil", "couple-quiz"] },
  { id: "after", title: "After 🔞", subtitle: "Jeux à boire — avec modération", ids: ["picolette", "tgv"] },
];

export function getZGame(id: string): ZGame | undefined {
  return GAMES.find((g) => g.id === id);
}
