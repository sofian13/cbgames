// Textes d'interface de « Tu préfères ? », FR · EN · ES.
import type { I18n } from "@/lib/i18n";

type Cat = "classique" | "hot" | "absurde" | "couple";

interface TPStrings {
  gameName: string;
  /** Titre de l'écran d'accueil du jeu */
  title: string;
  intro: string;
  vibe: string;
  packs: Record<Cat, { label: string; tag: string }>;
  backHome: string;
  changeVibe: string;
  /** « Tu préfères… » au-dessus des deux options */
  prompt: string;
  or: string;
  countHandFor: (text: string) => string;
  hands: (n: number) => string;
  /** Pourcentage (FR/ES : espace insécable avant %, EN : collé) */
  pct: (n: number) => string;
  removeHand: string;
  tie: string;
  tableChose: (side: "A" | "B") => string;
  nextDilemma: string;
  raiseHands: string;
  reroll: string;
  seeResult: (n: number) => string;
  /** Réglage de la peine (camp minoritaire) */
  penaltyTitle: string;
  penaltyDares: { title: string; sub: string };
  penaltySips: { title: string; sub: string };
  penaltyChill: string;
  /** Pastille sur la carte du camp minoritaire après révélation */
  minorityBadge: string;
  noPenaltyTie: string;
  noPenaltyUnanimous: string;
  /** « Camp B (2 mains) prend la peine » */
  loserHead: (side: "A" | "B", n: number) => string;
  /** Gorgées pour chaque membre du camp minoritaire (n ≤ 3) */
  sipsEach: (n: number) => string;
  /** Une seule main dans la minorité : seul(e) contre tous */
  sipsSolo: (n: number) => string;
  orDare: string;
  dareOnly: string;
  waterOk: string;
  /** Gages courts, faisables par une ou plusieurs personnes */
  dares: string[];
}

export const TP_STR: I18n<TPStrings> = {
  fr: {
    gameName: "Tu préfères",
    title: "Tu préfères ?",
    intro: "Lisez le dilemme à voix haute. À 3, chacun lève la main pour A ou B, on compte les mains sur l'écran… et le camp minoritaire prend la peine.",
    vibe: "L'ambiance",
    packs: {
      classique: { label: "Classique", tag: "Pour tout le monde" },
      hot: { label: "Chaud", tag: "18+ entre potes" },
      absurde: { label: "Absurde", tag: "Pour les tordus" },
      couple: { label: "Couple", tag: "À deux" },
    },
    backHome: "Retour à l'accueil",
    changeVibe: "Changer d'ambiance",
    prompt: "Tu préfères…",
    or: "ou",
    countHandFor: (t) => `Compter une main pour : ${t}`,
    hands: (n) => `${n} main${n > 1 ? "s" : ""}`,
    pct: (n) => `${n}\u00A0%`,
    removeHand: "Retirer une main",
    tie: "Égalité parfaite, la table est coupée en deux !",
    tableChose: (s) => `La table a choisi ${s} !`,
    nextDilemma: "Dilemme suivant",
    raiseHands: "À 3, chacun lève la main pour A ou B. Touchez une carte une fois par main levée. La minorité prend la peine !",
    reroll: "Pas fou ? Un autre",
    seeResult: (n) => `Voir le résultat (${n} main${n > 1 ? "s" : ""})`,
    penaltyTitle: "La minorité prend…",
    penaltyDares: { title: "Un gage", sub: "Zéro gorgée" },
    penaltySips: { title: "Gorgées ou gage", sub: "1 à 2 gorgées de zinzin" },
    penaltyChill: "Ambiance chill : le camp minoritaire fait un gage.",
    minorityBadge: "Minorité",
    noPenaltyTie: "Personne ne prend : débattez !",
    noPenaltyUnanimous: "Unanimité ! Personne ne prend.",
    loserHead: (s, n) => `Camp ${s} (${n} main${n > 1 ? "s" : ""}) prend la peine`,
    sipsEach: (n) => `${n} gorgée${n > 1 ? "s" : ""} de zinzin chacun`,
    sipsSolo: (n) => `Seul contre tous : ${n} gorgée${n > 1 ? "s" : ""} de zinzin`,
    orDare: "ou le gage :",
    dareOnly: "Gage :",
    waterOk: "Eau ou soft acceptés.",
    dares: [
      "Défendre ton choix pendant 15 secondes sans rire",
      "Imiter quelqu'un du camp gagnant pendant 10 secondes",
      "Faire un vrai compliment à quelqu'un du camp gagnant",
      "Parler avec un accent jusqu'au prochain dilemme",
      "Chanter un refrain choisi par le groupe",
      "Faire 5 squats en criant « j'avais raison »",
      "Rester debout jusqu'au prochain dilemme",
      "Raconter le dernier truc gênant qui t'est arrivé",
      "Faire ton meilleur cri d'animal",
      "Lire le prochain dilemme avec une voix de robot",
      "Ne plus dire « oui » ni « non » pendant 2 dilemmes",
      "Faire une danse de la victoire pour le camp gagnant",
      "Laisser le camp gagnant te donner un surnom pour la partie",
      "Mimer ton choix sans parler jusqu'à ce que le groupe devine",
      "Faire une déclaration d'amour à ton choix, avec émotion",
    ],
  },
  en: {
    gameName: "Would You Rather",
    title: "Would You Rather?",
    intro: "Read the dilemma out loud. On 3, everyone raises a hand for A or B, you count the hands on screen… and the minority side takes the penalty.",
    vibe: "Pick a vibe",
    packs: {
      classique: { label: "Classic", tag: "For everyone" },
      hot: { label: "Spicy", tag: "18+ with friends" },
      absurde: { label: "Absurd", tag: "For twisted minds" },
      couple: { label: "Couples", tag: "For two" },
    },
    backHome: "Back to home",
    changeVibe: "Change vibe",
    prompt: "Would you rather…",
    or: "or",
    countHandFor: (t) => `Count one hand for: ${t}`,
    hands: (n) => `${n} hand${n === 1 ? "" : "s"}`,
    pct: (n) => `${n}%`,
    removeHand: "Remove a hand",
    tie: "Dead even, the table is split down the middle!",
    tableChose: (s) => `The table picked ${s}!`,
    nextDilemma: "Next dilemma",
    raiseHands: "On 3, everyone raises a hand for A or B. Tap a card once per raised hand. The minority takes the penalty!",
    reroll: "Meh? Another one",
    seeResult: (n) => `See the result (${n} hand${n === 1 ? "" : "s"})`,
    penaltyTitle: "The minority gets…",
    penaltyDares: { title: "A dare", sub: "Zero sips" },
    penaltySips: { title: "Sips or a dare", sub: "1 to 2 zinzin sips" },
    penaltyChill: "Chill vibe: the minority does a dare.",
    minorityBadge: "Minority",
    noPenaltyTie: "Nobody takes it: debate!",
    noPenaltyUnanimous: "Unanimous! Nobody takes it.",
    loserHead: (s, n) => `Side ${s} (${n} hand${n === 1 ? "" : "s"}) takes the penalty`,
    sipsEach: (n) => `${n} zinzin sip${n === 1 ? "" : "s"} each`,
    sipsSolo: (n) => `Alone against everyone: ${n} zinzin sip${n === 1 ? "" : "s"}`,
    orDare: "or the dare:",
    dareOnly: "Dare:",
    waterOk: "Water or soft drinks are fine.",
    dares: [
      "Defend your choice for 15 seconds without laughing",
      "Impersonate someone from the winning side for 10 seconds",
      "Give someone on the winning side a genuine compliment",
      "Talk in an accent until the next dilemma",
      "Sing a chorus picked by the group",
      "Do 5 squats shouting “I was right”",
      "Stay standing until the next dilemma",
      "Tell the last embarrassing thing that happened to you",
      "Do your best animal noise",
      "Read the next dilemma in a robot voice",
      "Don't say “yes” or “no” for 2 dilemmas",
      "Do a victory dance for the winning side",
      "Let the winning side give you a nickname for the game",
      "Mime your choice without talking until the group guesses it",
      "Make a heartfelt love declaration to your choice",
    ],
  },
  es: {
    gameName: "¿Qué prefieres?",
    title: "¿Qué prefieres?",
    intro: "Lee el dilema en voz alta. A la de 3, cada uno levanta la mano por la A o la B, se cuentan las manos en la pantalla… y el bando minoritario paga.",
    vibe: "El ambiente",
    packs: {
      classique: { label: "Clásico", tag: "Para todo el mundo" },
      hot: { label: "Picante", tag: "+18 entre amigos" },
      absurde: { label: "Absurdo", tag: "Para mentes retorcidas" },
      couple: { label: "Pareja", tag: "Para dos" },
    },
    backHome: "Volver al inicio",
    changeVibe: "Cambiar de ambiente",
    prompt: "¿Qué prefieres?",
    or: "o",
    countHandFor: (t) => `Contar una mano para: ${t}`,
    hands: (n) => `${n} mano${n === 1 ? "" : "s"}`,
    pct: (n) => `${n}\u00A0%`,
    removeHand: "Quitar una mano",
    tie: "¡Empate total, la mesa está partida en dos!",
    tableChose: (s) => `¡La mesa eligió la ${s}!`,
    nextDilemma: "Siguiente dilema",
    raiseHands: "A la de 3, cada uno levanta la mano por la A o la B. Toca una carta una vez por mano. ¡La minoría paga!",
    reroll: "¿No mola? Otra",
    seeResult: (n) => `Ver el resultado (${n} mano${n === 1 ? "" : "s"})`,
    penaltyTitle: "La minoría se lleva…",
    penaltyDares: { title: "Un reto", sub: "Cero tragos" },
    penaltySips: { title: "Tragos o reto", sub: "1 a 2 tragos de zinzin" },
    penaltyChill: "Ambiente chill: la minoría hace un reto.",
    minorityBadge: "Minoría",
    noPenaltyTie: "Nadie paga: ¡a debatir!",
    noPenaltyUnanimous: "¡Unanimidad! Nadie paga.",
    loserHead: (s, n) => `El bando ${s} (${n} mano${n === 1 ? "" : "s"}) paga`,
    sipsEach: (n) => `${n} trago${n === 1 ? "" : "s"} de zinzin cada uno`,
    sipsSolo: (n) => `Solo contra todos: ${n} trago${n === 1 ? "" : "s"} de zinzin`,
    orDare: "o el reto:",
    dareOnly: "Reto:",
    waterOk: "Vale agua o refresco.",
    dares: [
      "Defender tu elección 15 segundos sin reírte",
      "Imitar a alguien del bando ganador durante 10 segundos",
      "Hacerle un cumplido sincero a alguien del bando ganador",
      "Hablar con acento hasta el siguiente dilema",
      "Cantar un estribillo que elija el grupo",
      "Hacer 5 sentadillas gritando « tenía razón »",
      "Quedarte de pie hasta el siguiente dilema",
      "Contar lo último vergonzoso que te ha pasado",
      "Hacer tu mejor ruido de animal",
      "Leer el siguiente dilema con voz de robot",
      "No decir « sí » ni « no » durante 2 dilemas",
      "Hacer un baile de la victoria para el bando ganador",
      "Dejar que el bando ganador te ponga un apodo para la partida",
      "Hacer mímica de tu elección sin hablar hasta que el grupo acierte",
      "Declararle tu amor a tu elección, con emoción",
    ],
  },
};
