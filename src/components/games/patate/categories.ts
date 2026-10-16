// Catégories de La Patate : on dit UNE réponse à voix haute, puis on passe le tél.
// Pas de répétition dans une même manche (le groupe arbitre).
// Versions EN / ES : categories.en.ts, categories.es.ts (même structure).

import type { I18n, Lang } from "@/lib/i18n";
import { CATEGORIES_CLASSIC_EN, CATEGORIES_SPICY_EN, DARES_EN, DARES_SPICY_EN } from "./categories.en";
import { CATEGORIES_CLASSIC_ES, CATEGORIES_SPICY_ES, DARES_ES, DARES_SPICY_ES } from "./categories.es";

export const CATEGORIES_CLASSIC: string[] = [
  // Bouffe
  "Un fruit",
  "Un légume",
  "Un fromage",
  "Un plat de cantine",
  "Une garniture de pizza",
  "Un truc qu'on met dans un kebab",
  "Un dessert",
  "Un plat qu'on mange avec les doigts",
  "Une épice ou une herbe",
  "Un truc qu'on trouve au petit-déj",
  "Un plat de mamie",
  "Un parfum de glace",
  "Une sauce",
  "Un aliment orange",
  "Un truc qui croustille",
  "Un plat qu'on rate toujours",
  "Une boisson sans alcool",
  "Un truc qu'on grignote devant une série",
  "Une spécialité d'une région de France",
  "Un plat d'un autre pays",
  "Un aliment qu'on déteste enfant",
  "Un truc qu'on met dans une raclette",
  "Une sorte de pâtes",
  "Un truc qui se mange froid",
  // Maison & quotidien
  "Un truc qu'on trouve dans une salle de bain",
  "Un truc qu'on trouve dans un frigo",
  "Un truc qu'on trouve sous un lit",
  "Un objet dans une trousse",
  "Un truc qu'on oublie toujours en partant en vacances",
  "Un truc dans le sac d'une mère",
  "Un objet qui fait du bruit",
  "Un truc qui se recharge",
  "Un meuble",
  "Un objet qu'on trouve dans une cuisine",
  "Un truc qu'on perd tout le temps",
  "Un truc qu'on trouve dans une boîte à gants",
  "Un objet en plastique",
  "Un truc qui colle",
  "Un truc qui pique",
  "Un truc rond",
  "Un truc rouge",
  "Un truc qui sent mauvais",
  "Un truc qui sent bon",
  "Une tâche ménagère",
  "Un truc qu'on fait en pyjama",
  "Un objet qu'on a tous en double",
  "Un truc qu'on trouve dans un tiroir à bazar",
  // Animaux & nature
  "Un animal de la ferme",
  "Un animal qui vit dans l'eau",
  "Un animal qui vole",
  "Un animal qui pique ou qui mord",
  "Un animal mignon",
  "Un animal moche (désolé pour lui)",
  "Un insecte",
  "Un animal d'Afrique",
  "Un cri d'animal (à imiter !)",
  "Un arbre",
  "Une fleur",
  "Un truc qu'on trouve à la plage",
  "Un truc qu'on trouve en forêt",
  "Un phénomène météo",
  "Une planète ou un truc dans l'espace",
  // Géo & voyages
  "Un pays d'Europe",
  "Une capitale",
  "Un pays d'Afrique",
  "Un pays d'Asie",
  "Une ville de France",
  "Un département français",
  "Un pays où il fait chaud",
  "Un monument célèbre",
  "Un truc qu'on achète en souvenir de vacances",
  "Un moyen de transport",
  "Un truc qu'on fait dans un avion",
  "Une langue étrangère",
  "Une île",
  "Un fleuve ou une rivière",
  // Pop culture
  "Un rappeur ou une rappeuse français(e)",
  "Un chanteur ou une chanteuse des années 2000",
  "Un dessin animé",
  "Un personnage de dessin animé",
  "Un super-héros",
  "Un méchant de film",
  "Un film d'animation",
  "Une série",
  "Un jeu vidéo",
  "Un personnage de jeu vidéo",
  "Un youtubeur ou une youtubeuse",
  "Une chanson qu'on chante en soirée",
  "Un sport",
  "Un footballeur ou une footballeuse",
  "Un sportif ou une sportive (pas foot)",
  "Un club de foot",
  "Un instrument de musique",
  "Un style de musique",
  "Une danse",
  "Un jeu de société",
  "Un jeu de cour de récré",
  "Un personnage de conte",
  "Un truc magique",
  "Une émission de télé",
  "Un réseau social",
  "Une appli sur ton tél",
  "Un emoji",
  "Un mème ou une expression internet",
  "Un humoriste",
  "Un personnage historique",
  "Une personne célèbre qui a un prénom en M",
  // Langage
  "Un mot qui commence par « CH »",
  "Un mot qui finit en « -ette »",
  "Un mot qui rime avec « patate »",
  "Un mot de plus de 10 lettres",
  "Un mot anglais qu'on utilise en français",
  "Un gros mot gentil (genre « saperlipopette »)",
  "Une expression de vieux",
  "Une insulte de pirate",
  "Un prénom qui commence par L",
  "Un prénom de chien",
  "Un prénom de mamie",
  "Un mot qui se dit en verlan",
  "Un mot en 3 lettres",
  "Un adjectif pour décrire ton voisin de gauche",
  "Un compliment",
  "Un mot qu'on dit trop souvent",
  "Un truc qu'on crie",
  "Une phrase que disent les profs",
  "Une phrase que disent les parents",
  "Un truc qu'on dit au téléphone",
  // Vie & soirée
  "Une excuse pour ne pas venir à une soirée",
  "Une excuse pour partir d'une soirée",
  "Une excuse quand on est en retard",
  "Un truc qu'on fait en soirée à 3 h du mat'",
  "Un truc qu'on regrette le lendemain",
  "Un métier",
  "Un métier qui fait rêver les enfants",
  "Un métier qu'on ne voudrait jamais faire",
  "Une matière à l'école",
  "Un truc qu'on fait le dimanche",
  "Une fête ou un jour férié",
  "Un cadeau nul",
  "Un truc qu'on fait quand on s'ennuie",
  "Un truc qui fait peur",
  "Une phobie",
  "Un truc qui énerve dans les transports",
  "Un truc qu'on fait en cachette",
  "Un talent inutile",
  "Un truc qu'on fait à un mariage",
  "Un truc qu'on trouve dans une fête foraine",
  "Un truc qu'on fait à la salle de sport",
  "Une partie du corps",
  "Un vêtement",
  "Un accessoire de mode",
  "Une coiffure",
  "Une couleur",
  "Un truc qu'on fait en vacances",
  "Un sport d'hiver",
  "Un truc qu'on achète au supermarché à minuit",
  "Une raison de se disputer en coloc",
  "Un truc qu'on dit pour draguer… mais en version polie",
  "Un truc qu'on fait avant de dormir",
  "Une chose qui se casse facilement",
  "Une chose qu'on garde depuis l'enfance",
  "Un truc qui coûte trop cher",
  "Un truc gratuit",
  "Un bruit dégoûtant",
  "Une chose qu'on fait sous la douche",
  "Un tic de langage de quelqu'un ici",
  "Un truc que tout le monde ici a déjà fait",
  "Un super-pouvoir",
  "Un truc qu'on emmènerait sur une île déserte",
  "Un truc qui va dans le ciel",
  "Un nombre (pas 1, 2 ou 3, trop facile)",
  "Un truc qui a des roues",
  "Un truc qui a des ailes",
  "Un truc qui fond",
  "Un truc qui brille",
  "Un truc qui rentre dans une poche",
  "Un truc plus grand qu'une maison",
];

// Pack 18+ : coquin mais jamais explicite.
export const CATEGORIES_SPICY: string[] = [
  "Une phrase de drague nulle",
  "Un endroit insolite pour un premier bisou",
  "Un surnom d'amoureux ridicule",
  "Un truc sexy chez quelqu'un",
  "Un tue-l'amour absolu",
  "Une excuse pour rester dormir chez quelqu'un",
  "Un endroit où il ne faut PAS se faire surprendre",
  "Un truc à ne jamais dire pendant un rencard",
  "Un mot qui sonne coquin alors qu'il ne l'est pas",
  "Un fruit ou légume au sous-entendu douteux",
  "Une pièce de la maison… pour un câlin",
  "Un truc qu'on fait le lendemain d'un rencard",
  "Une raison de ne pas répondre à un ex",
  "Un sous-vêtement",
  "Un film à regarder « juste pour se faire un câlin »",
  "Un signe qu'un rencard se passe mal",
  "Un signe qu'un rencard se passe TRÈS bien",
  "Une bio de profil de rencontre qui fait fuir",
  "Un message à 2 h du mat'",
  "Un truc qui fait rougir",
  "Un endroit pour un rencard raté",
  "Un compliment osé (mais poli)",
  "Un métier qui a un uniforme sexy",
  "Une chanson pour une soirée en amoureux",
  "Une partie du corps qu'on peut embrasser",
  "Un truc qu'on fait pour séduire",
  "Une excuse pour annuler un rencard",
  "Un truc qu'on cache quand quelqu'un vient dormir",
  "Une phrase après un premier bisou",
  "Un truc qu'on a fait pour un crush",
  "Un prénom qui fait craquer",
  "Un parfum qui fait tourner la tête",
  "Un « red flag » chez un crush",
  "Un « green flag » chez un crush",
  "Une position… de yoga",
  "Un endroit où on a déjà dormi par accident",
  "Un émoji coquin",
  "Un truc qu'on dit en se réveillant à côté de quelqu'un",
  "Une tenue qui fait de l'effet",
  "Un jeu à faire à deux",
  "Une chose qu'on ose seulement après minuit",
  "Une manière de dire « je te kiffe » sans le dire",
];

// Gages doux : jamais humiliants, jamais dangereux.
export const DARES: string[] = [
  "Imite un animal choisi par ton voisin de gauche pendant 10 secondes.",
  "Parle avec un accent (au choix du groupe) jusqu'à la prochaine manche.",
  "Fais une déclaration d'amour dramatique à la patate.",
  "Chante le refrain d'une chanson choisie par le groupe.",
  "Fais ton meilleur pas de danse pendant 10 secondes.",
  "Raconte ta pire honte… en 3 phrases.",
  "Fais un compliment sincère à chaque joueur.",
  "Garde une grimace jusqu'à ce que quelqu'un rigole.",
  "Lis à voix haute le dernier message que tu as envoyé.",
  "Parle à la 3ᵉ personne jusqu'à la prochaine manche.",
  "Fais 5 pompes (ou 10 secondes de gainage).",
  "Fais une pub de 15 secondes pour la patate.",
  "Imite quelqu'un ici, le groupe doit deviner qui.",
  "Raconte une blague. Si personne ne rit, refais-en une.",
  "Laisse ton voisin de droite te faire une coiffure.",
  "Fais le bruit d'une explosion avec ta bouche, le plus fort possible.",
  "Mime ton métier de rêve, le groupe doit deviner.",
  "Tiens-toi en équilibre sur un pied jusqu'à ta prochaine réponse.",
  "Jusqu'à la prochaine manche, tu finis chaque phrase par « patate ».",
  "Fais un discours de victoire comme si tu avais gagné.",
  "Envoie un emoji patate à la 3ᵉ personne de tes conversations.",
  "Parle sans dire « oui » ni « non » jusqu'à la prochaine manche.",
  "Fais un câlin à la personne de ton choix.",
  "Invente un surnom pour chaque joueur.",
  "Rejoue ta mort au ralenti, façon film d'action.",
  "Fais un beatbox de 10 secondes.",
  "Échange de place avec quelqu'un de ton choix.",
  "Commente la prochaine manche comme un journaliste sportif.",
  "Dis 3 qualités de la personne à ta gauche.",
  "Fais un défilé de mode d'un bout à l'autre de la pièce pendant que le groupe commente.",
  "Imite un bébé qui découvre une patate.",
  "Trouve 5 mots qui riment avec « patate » en 15 secondes.",
];

// Gages du pack 18+ (coquins, jamais explicites)
export const DARES_SPICY: string[] = [
  "Dis ta pire phrase de drague à la personne de ton choix, les yeux dans les yeux.",
  "Fais un bisou sur la joue de la personne à ta droite (ou sur la patate).",
  "Raconte ton pire rencard en 3 phrases.",
  "Fais un clin d'œil séducteur à chaque joueur.",
  "Murmure un compliment à l'oreille de quelqu'un.",
  "Fais 10 secondes de danse langoureuse… avec la patate.",
];

/** Contenu de La Patate (et gages partagés) dans la langue voulue. */
export interface PatateContent { classic: string[]; spicy: string[]; dares: string[]; daresSpicy: string[] }
const CONTENT: I18n<PatateContent> = {
  fr: { classic: CATEGORIES_CLASSIC, spicy: CATEGORIES_SPICY, dares: DARES, daresSpicy: DARES_SPICY },
  en: { classic: CATEGORIES_CLASSIC_EN, spicy: CATEGORIES_SPICY_EN, dares: DARES_EN, daresSpicy: DARES_SPICY_EN },
  es: { classic: CATEGORIES_CLASSIC_ES, spicy: CATEGORIES_SPICY_ES, dares: DARES_ES, daresSpicy: DARES_SPICY_ES },
};
export function patateContent(lang: Lang): PatateContent {
  return CONTENT[lang] ?? CONTENT.fr;
}

/**
 * Thèmes des catégories classiques (tranches de la liste, mêmes indices dans les 3 langues).
 * App sans Zinzin+ : seuls les thèmes `free` sont joués ; les autres restent visibles avec un cadenas.
 */
export interface PatateTheme { id: string; label: I18n<string>; start: number; count: number; free?: boolean }
export const PATATE_THEMES: PatateTheme[] = [
  { id: "food", label: { fr: "Bouffe", en: "Food", es: "Comida" }, start: 0, count: 24, free: true },
  { id: "home", label: { fr: "Maison & quotidien", en: "Home & everyday", es: "Casa y día a día" }, start: 24, count: 23, free: true },
  { id: "animals", label: { fr: "Animaux & nature", en: "Animals & nature", es: "Animales y naturaleza" }, start: 47, count: 15, free: true },
  { id: "geo", label: { fr: "Géo & voyages", en: "Geography & travel", es: "Geografía y viajes" }, start: 62, count: 14 },
  { id: "pop", label: { fr: "Pop culture", en: "Pop culture", es: "Cultura pop" }, start: 76, count: 31 },
  { id: "lang", label: { fr: "Langage", en: "Language", es: "Lenguaje" }, start: 107, count: 20 },
  { id: "life", label: { fr: "Vie & soirée", en: "Life & parties", es: "Vida y fiesta" }, start: 127, count: 50 },
];

/** Catégories d'un thème. */
export function themeCategories(c: PatateContent, th: PatateTheme): string[] {
  return c.classic.slice(th.start, th.start + th.count);
}

/** Version découverte (app sans Zinzin+) : catégories des thèmes gratuits uniquement. */
export function freeCategories(c: PatateContent): string[] {
  return PATATE_THEMES.filter((th) => th.free).flatMap((th) => themeCategories(c, th));
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
