import type { ComponentType } from "react";
import type { GameProps } from "@/lib/games/types";
import type { MascotColor, MascotMood } from "@/components/Mascot";
import type { ZCostume } from "./ui/costumes";

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
  /** Déguisement du blob (reconnaître le jeu au premier coup d'œil) */
  costume?: ZCostume;
  load: () => Promise<{ default: ComponentType<GameProps> }>;
  /**
   * Mini BD affichée dans la fiche (« Ça donne quoi ? ») : quelques répliques
   * courtes qui font comprendre le jeu en 5 s. Sans `who` = narrateur / le tél.
   * Absent → la fiche affiche `example` dans une seule grosse bulle.
   */
  story?: ZLine[];
  /** Les règles en 3 à 5 étapes courtes (sinon : règles du registry) */
  steps?: string[];
  /** Surcharge des textes du registry (jeux propres à l'app) */
  meta?: { name: string; icon: string; pitch: string; example: string; rules: string[]; minPlayers: number; maxPlayers: number };
}

/** Une réplique de la mini BD. `color` facultatif : sinon couleur attitrée du prénom. */
export interface ZLine {
  who?: string;
  text: string;
  color?: MascotColor;
}

/** Couleur attitrée des personnages récurrents des mini BD. */
export const CAST: Record<string, MascotColor> = {
  Léa: "pink", Malik: "sky", Inès: "yellow", Tom: "coral", Sarah: "mint", Hugo: "purple", Max: "lavender",
};

export interface ZSection {
  id: string;
  title: string;
  subtitle: string;
  ids: string[];
}

export const GAMES: ZGame[] = [
  { id: "undercover", costume: "groucho", color: "pink", mood: "sus", free: true, players: "3-12",
    story: [
      { who: "Léa", text: "Mon indice : italien." },
      { who: "Malik", text: "Fromage qui file !" },
      { who: "Inès", text: "Euh… ça se mange vite ?" },
      { text: "Tout le monde vote Inès. Elle avait « burger » : l'Intrus est grillé !" },
    ],
    steps: [
      "Chacun reçoit un mot secret. L'Intrus a un mot presque pareil… sans le savoir",
      "Chacun donne un indice sur son mot, sans le dire",
      "On vote pour éliminer le plus louche",
      "Les civils gagnent s'ils sortent tous les intrus",
    ],
    load: () => import("@/components/games/undercover/undercover-game") },
  { id: "top-ten", costume: "ten", color: "coral", mood: "laughing", free: true, players: "2-10",
    story: [
      { text: "Thème : une excuse pour rater un date" },
      { who: "Tom", text: "J'ai le 2… « j'ai un peu mal à la tête »." },
      { who: "Sarah", text: "J'ai le 9 : « mon poisson rouge est en deuil »." },
      { text: "Maintenant, rangez tout le monde de 1 à 10 !" },
    ],
    steps: [
      "Chacun reçoit un numéro secret de 1 à 10",
      "Un thème tombe : réponds selon ton numéro (1 = tout doux, 10 = énorme)",
      "Ensemble, rangez les réponses de la plus petite à la plus grande",
      "Plus le classement est juste, plus vous marquez",
    ],
    load: () => import("@/components/games/top-ten/top-ten-game") },
  { id: "tu-prefere", costume: "split", color: "sky", mood: "thinking", free: true, players: "2+",
    story: [
      { text: "Tu préfères ne plus jamais manger de fromage… ou ne plus jamais boire de café ?" },
      { who: "Léa", text: "Le café, sans hésiter." },
      { who: "Malik", text: "Tu rigoles ? Le fromage c'est la vie." },
      { text: "Le tél révèle ce qu'ont choisi les gens. Débat !" },
    ],
    steps: [
      "Lisez le dilemme à voix haute",
      "À 3, tout le monde vote avec la main",
      "Tapez pour voir ce qu'ont choisi les gens",
      "Débattez… puis question suivante",
    ],
    load: () => import("@/components/games/tu-prefere/tu-prefere-game") },
  { id: "patate", costume: "potato", color: "yellow", mood: "shocked", isNew: true, players: "3-10",
    story: [
      { text: "Catégorie : un truc dans une salle de bain" },
      { who: "Léa", text: "Brosse à dents !" },
      { who: "Malik", text: "Peignoir !" },
      { who: "Inès", text: "Euh… euh…" },
      { text: "BOUM ! Inès : 2 gorgées ou un gage." },
    ],
    steps: [
      "Asseyez-vous en cercle, prénoms dans l'ordre",
      "Une catégorie s'affiche : dis une réponse et passe le tél",
      "La mèche est cachée et le tic-tac accélère",
      "Celui qui tient le tél au BOUM fait un gage (ou 1 à 3 gorgées)",
    ],
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
  { id: "purete", costume: "angeldevil", color: "lavender", mood: "wink", isNew: true, players: "1-12",
    story: [
      { text: "As-tu déjà écrit à ton ex en pleine nuit ?" },
      { who: "Léa", text: "Jamais. Je suis une sainte." },
      { who: "Tom", text: "…Oui. Deux fois. Cette semaine." },
      { text: "Tom : 12 % de pureté. Casier bien rempli, cornes sur la tête." },
    ],
    steps: [
      "Une question « As-tu déjà… ? » à la fois",
      "Oui = tu perds de la pureté, Jamais = tu restes un ange",
      "Réponds en secret (on se passe le tél) ou main levée, tous ensemble",
      "Score final en % de pureté, de l'ange au démon certifié",
    ],
    load: () => import("@/components/games/purete/purete-game"),
    meta: {
      name: "Test de pureté", icon: "😇", minPlayers: 1, maxPlayers: 12,
      pitch: "« As-tu déjà… ? » : plus tu dis oui, moins tu es pur. Qui est l'ange de la table, et qui est le démon ?",
      example: "« As-tu déjà écrit à ton ex en pleine nuit ? » Léa tape « Jamais » en secret, Tom tape « Oui »… À la fin, le compteur de Tom dégringole jusqu'à 12 % : « Casier bien rempli », cornes sur la tête. Et l'appli balance : « 3 personnes sur 4 ont déjà dormi dans une voiture après une soirée ».",
      rules: [
        "Une question « As-tu déjà… ? » à la fois : Oui = tu perds de la pureté, Jamais = tu restes un ange",
        "Chacun son tour : on se passe le tél et chacun répond en secret, puis grande révélation du classement",
        "Solo : réponds seul et découvre ton score… et tes aveux",
        "Tous ensemble : on lit à voix haute, ceux qui l'ont fait lèvent la main, on compte sur l'écran",
        "Score final en % de pureté avec un titre, de « Ange tombé du ciel » à « Démon certifié »",
        "Option peines : le moins pur prend un gage ou 1 à 3 gorgées (eau ou soft, ça compte). Pack Coquin 18+ facultatif",
      ],
    } },
  { id: "lache-pas", costume: "fuse", color: "coral", mood: "sus", isNew: true, players: "2-10",
    story: [
      { text: "4 doigts sur l'écran. La bombe s'arme…" },
      { who: "Tom", text: "J'ai entendu un clic, je lâche !" },
      { who: "Inès", text: "Je tiens… je tiens… je lâche !" },
      { text: "BOUM ! Léa et Malik sont grillés, Inès prend la couronne." },
    ],
    steps: [
      "Chacun pose un doigt sur l'écran",
      "La bombe explose entre 4 et 22 s, personne ne sait quand",
      "Lâche quand tu veux… mais pas le premier !",
      "Au BOUM, les doigts encore posés ont perdu",
    ],
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
  { id: "pile-poil", costume: "stopwatch", color: "mint", mood: "mindblown", players: "2-10",
    story: [
      { text: "Cible : 7 secondes. GO !" },
      { who: "Hugo", text: "…5, 6, 7. STOP !" },
      { text: "6,82 s. Pas mal du tout." },
      { who: "Sarah", text: "9,10 s ?! J'ai compté comme une tortue." },
      { text: "Sarah est la plus loin : elle prend une peine." },
    ],
    steps: [
      "Une cible s'affiche, par exemple 7 secondes",
      "GO, compte dans ta tête, STOP : le chrono est caché",
      "Chacun son tour sur le même tél",
      "Le plus loin prend une peine. À 0,15 s près : PILE POIL !",
    ],
    load: () => import("@/components/games/pile-poil/pile-poil-game") },
  { id: "loup-garou", costume: "wolf", color: "purple", mood: "shifty", isNew: true, players: "5-16",
    story: [
      { text: "La nuit tombe. Les loups ouvrent les yeux…" },
      { who: "Hugo", text: "Je suis mort ?! J'étais la Voyante !" },
      { who: "Sarah", text: "C'est Tom, il a rien dit de la partie." },
      { who: "Tom", text: "Moi ? Simple villageois, promis." },
      { text: "Le village élimine Sarah… simple villageoise. Les loups rigolent." },
    ],
    steps: [
      "Entrez les prénoms : le tél distribue les rôles",
      "Chacun découvre son rôle en secret",
      "La nuit, le tél raconte et appelle chaque rôle",
      "Le jour : débat, vote, un suspect est éliminé",
      "Le village doit éliminer tous les loups",
    ],
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
  { id: "le-bluffeur", costume: "pinocchio", color: "yellow", mood: "wink", players: "2-8",
    story: [
      { text: "Quel est le métier le plus bizarre qui existe ?" },
      { who: "Tom", text: "Testeur de toboggans. Crédible, non ?" },
      { who: "Léa", text: "J'y crois à fond, je vote ça." },
      { text: "Bluff réussi pour Tom ! La vraie réponse : renifleur de déodorant." },
    ],
    steps: [
      "Une question improbable s'affiche",
      "Chacun invente une fausse réponse crédible",
      "Tout est mélangé avec la vraie : votez pour la bonne",
      "Trouver la vérité ou piéger les autres rapporte des points",
    ],
    load: () => import("@/components/games/le-bluffeur/le-bluffeur-game") },
  { id: "longueur-onde", costume: "antenna", color: "lavender", mood: "mindblown", players: "2-10",
    story: [
      { text: "Échelle : ringard ↔ stylé. La cible est presque tout à droite." },
      { who: "Malik", text: "Des lunettes de soleil… la nuit." },
      { who: "Inès", text: "Stylé ?! Non mais c'est ringard !" },
      { text: "Curseur à deux crans de la cible : 4 points." },
    ],
    steps: [
      "Le Médium voit une cible cachée sur une échelle",
      "Il donne un indice pour la situer",
      "Les autres placent le curseur",
      "Plus vous êtes près, plus vous marquez",
    ],
    load: () => import("@/components/games/longueur-onde/longueur-onde-game") },
  { id: "make-guess", costume: "mime", color: "mint", mood: "laughing", players: "4+",
    story: [
      { text: "Le mot est « girafe »." },
      { who: "Léa", text: "Animal, très grand cou, Afrique !" },
      { who: "Malik", text: "GIRAFE !" },
      { text: "+1 ! Mot suivant, le chrono tourne." },
    ],
    steps: [
      "Formez des équipes de 2 ou plus",
      "Celui qui fait deviner tient le tél, l'autre ne regarde pas",
      "Tap à gauche : trouvé. Tap à droite : on passe",
      "L'équipe qui trouve le plus de mots gagne",
    ],
    load: () => import("@/components/games/make-guess/make-guess-game") },
  { id: "guess-word", costume: "card", color: "sky", mood: "shocked", players: "2+",
    story: [
      { text: "Le tél est sur le front d'Inès. Le mot : « girafe »." },
      { who: "Tom", text: "C'est un animal !" },
      { who: "Léa", text: "Avec un cou immense !" },
      { who: "Inès", text: "GIRAFE !" },
    ],
    steps: [
      "Mets le tél sur ton front, écran vers les autres",
      "Les autres te donnent des indices ou miment",
      "Trouvé : tape à gauche. On passe : à droite",
      "Le plus de mots dans le temps gagne",
    ],
    load: () => import("@/components/games/guess-word/guess-word-game") },
  { id: "category-chrono", costume: "hourglass", color: "coral", mood: "shocked", players: "2+",
    story: [
      { text: "Catégorie : un fruit" },
      { who: "Léa", text: "Pomme !" },
      { who: "Malik", text: "Banane !" },
      { who: "Tom", text: "Kiwi… non attends, euh…" },
      { text: "Temps écoulé : Tom perd une vie." },
    ],
    steps: [
      "Une catégorie s'affiche",
      "Chacun son tour, dis un mot avant la fin du chrono",
      "Pas de répétition, et le chrono raccourcit",
      "Tu bloques ? Une vie en moins. Le dernier debout gagne",
    ],
    load: () => import("@/components/games/category-chrono/category-chrono-game") },
  { id: "code-names", costume: "spy", color: "sky", mood: "thinking", isNew: true, players: "4+",
    story: [
      { who: "Inès", text: "Espace, 2." },
      { who: "Malik", text: "Lune, c'est sûr." },
      { text: "Lune : rouge ! Bien joué." },
      { who: "Malik", text: "Et… Étoile ?" },
      { text: "Raté, c'était neutre. Au tour des bleus." },
    ],
    steps: [
      "Deux équipes, chacune son chef",
      "Seuls les chefs regardent la carte secrète",
      "Le chef dit un mot et un nombre",
      "Son équipe touche les mots. Gare à la Bombe !",
    ],
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
  { id: "pensez-pareil", costume: "duo", color: "pink", mood: "love", players: "2",
    story: [
      { text: "Thème : un plat pour un dimanche soir" },
      { who: "Léa", text: "J'écris… pâtes." },
      { who: "Tom", text: "Pâtes." },
      { text: "SYNC ! Le combo monte." },
    ],
    steps: [
      "À deux : un thème s'affiche",
      "Chacun écrit sa réponse en secret",
      "Même réponse ? SYNC, vous marquez ensemble",
      "Enchaînez les syncs pour faire grimper le combo",
    ],
    load: () => import("@/components/games/pensez-pareil/pensez-pareil-game") },
  { id: "couple-quiz", costume: "hearts", color: "pink", mood: "kiss", players: "2",
    story: [
      { text: "Plutôt plage ou montagne ?" },
      { who: "Léa", text: "(en secret) Montagne." },
      { who: "Tom", text: "Plage, évidemment !" },
      { who: "Léa", text: "Raté. Tu me connais vraiment ?" },
    ],
    steps: [
      "L'un répond en secret à une question sur lui",
      "L'autre devine sa réponse",
      "Bonne réponse = 1 point, puis on inverse",
      "À la fin : votre taux de complicité",
    ],
    load: () => import("@/components/games/couple-quiz/couple-quiz-game") },
  { id: "picolette", costume: "beer", color: "yellow", mood: "rofl", adult: true, players: "2-10",
    story: [
      { text: "Votez : qui finirait en garde à vue en premier ?" },
      { who: "Léa", text: "Max. Évidemment Max." },
      { who: "Malik", text: "Désolé Max…" },
      { who: "Max", text: "Bon. Je fais tourner la roulette." },
      { text: "2 gorgées ou un gage. Carte suivante !" },
    ],
    steps: [
      "Choisissez vos packs de cartes",
      "Lisez la carte à voix haute et jouez-la",
      "Le perdant fait tourner la roulette : 1 à 3 gorgées ou un gage",
      "Eau et soft acceptés, personne n'est obligé",
    ],
    load: () => import("@/components/games/picolette/picolette-game") },
  { id: "tgv", costume: "train", color: "purple", mood: "rofl", adult: true, players: "2-8",
    story: [
      { text: "Carte posée : un 8." },
      { who: "Hugo", text: "Plus !" },
      { text: "Un roi. Wagon suivant !" },
      { who: "Hugo", text: "Une dame… je dis moins." },
      { text: "Un as. Raté : 2 gorgées ou un gage, retour au wagon 1." },
    ],
    steps: [
      "À ton tour : plus, moins ou égal sur la carte suivante",
      "Bon pari : wagon suivant",
      "Raté : 1 à 3 gorgées ou un gage, et retour au début",
      "Tous les wagons passés : c'est toi qui distribues",
    ],
    load: () => import("@/components/games/tgv/tgv-game") },
];

export const SECTIONS: ZSection[] = [
  { id: "top", title: "Les incontournables", subtitle: "Pour lancer la soirée", ids: ["undercover", "purete", "patate", "top-ten", "lache-pas", "tu-prefere"] },
  { id: "zinzin", title: "Que sur Zinzin", subtitle: "Le téléphone devient le jeu", ids: ["patate", "lache-pas", "pile-poil"] },
  { id: "bluff", title: "Qui ment ?", subtitle: "Bluff et rôles secrets", ids: ["loup-garou", "undercover", "le-bluffeur"] },
  { id: "devine", title: "Fais deviner", subtitle: "Mimes, mots et chrono", ids: ["code-names", "make-guess", "guess-word", "category-chrono"] },
  { id: "ambiance", title: "Ambiance", subtitle: "Débats, flair et réflexes", ids: ["purete", "top-ten", "longueur-onde", "tu-prefere", "pile-poil"] },
  { id: "duo", title: "À deux", subtitle: "Couples et meilleurs potes", ids: ["pensez-pareil", "couple-quiz"] },
  { id: "after", title: "After 🔞", subtitle: "Jeux à boire — avec modération", ids: ["picolette", "tgv"] },
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
  kicker: string;
  title: string;
  subtitle: string;
  bg: string;
  ink: string;
  blob: MascotColor;
  mood: MascotMood;
  buddy?: { color: MascotColor; mood: MascotMood };
  /** Déguisement du blob (par défaut : celui du jeu) */
  costume?: ZCostume;
}

export const FEATURED: ZFeatured[] = [
  { id: "hero", kicker: "Ce soir", title: "On joue à quoi ce soir ?", subtitle: "Un seul téléphone, tout le monde joue.",
    bg: "linear-gradient(135deg,#7A4EE8 0%,#B743D8 55%,#FF3EA5 100%)", ink: "#fff",
    blob: "yellow", mood: "laughing", buddy: { color: "mint", mood: "shocked" } },
  { id: "purete", gameId: "purete", kicker: "Tout nouveau", title: "Test de pureté", subtitle: "Ange ou démon ? Le tél tranche.",
    bg: "#A98BFF", ink: "#15082E", blob: "white", mood: "wink", costume: "angeldevil", buddy: { color: "pink", mood: "kiss" } },
  { id: "patate", costume: "potato", gameId: "patate", kicker: "Le tél va exploser", title: "La Patate", subtitle: "Passe-le avant le BOUM !",
    bg: "#FFD23F", ink: "#15082E", blob: "coral", mood: "shocked" },
  { id: "loup-garou", costume: "wolf", gameId: "loup-garou", kicker: "Plus besoin de meneur", title: "Loup-Garou", subtitle: "Le tél raconte la nuit pour vous.",
    bg: "#7A4EE8", ink: "#fff", blob: "lavender", mood: "shifty", buddy: { color: "yellow", mood: "shocked" } },
  { id: "lache-pas", costume: "fuse", gameId: "lache-pas", kicker: "Nouveau", title: "Lâche pas !", subtitle: "Un doigt sur l'écran. Tiens bon !",
    bg: "#FF6B5B", ink: "#15082E", blob: "yellow", mood: "sus" },
];

export function getZGame(id: string): ZGame | undefined {
  return GAMES.find((g) => g.id === id);
}
