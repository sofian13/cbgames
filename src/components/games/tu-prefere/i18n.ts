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
}

export const TP_STR: I18n<TPStrings> = {
  fr: {
    gameName: "Tu préfères",
    title: "Tu préfères ?",
    intro: "Deux choix impossibles. Lisez-le à voix haute, levez la main, comptez les mains… et découvrez ce que pense le groupe.",
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
    raiseHands: "Levez la main ! Touchez une carte pour chaque main levée.",
    reroll: "Pas fou ? Un autre",
    seeResult: (n) => `Voir le résultat (${n} main${n > 1 ? "s" : ""})`,
  },
  en: {
    gameName: "Would You Rather",
    title: "Would You Rather?",
    intro: "Two impossible choices. Read it out loud, raise your hands, count them… and find out what the group really thinks.",
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
    raiseHands: "Hands up! Tap a card once for each raised hand.",
    reroll: "Meh? Another one",
    seeResult: (n) => `See the result (${n} hand${n === 1 ? "" : "s"})`,
  },
  es: {
    gameName: "¿Qué prefieres?",
    title: "¿Qué prefieres?",
    intro: "Dos opciones imposibles. Se lee en voz alta, se levanta la mano, se cuentan las manos… y se descubre qué piensa el grupo.",
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
    raiseHands: "¡Manos arriba! Toca una carta por cada mano levantada.",
    reroll: "¿No mola? Otra",
    seeResult: (n) => `Ver el resultado (${n} mano${n === 1 ? "" : "s"})`,
  },
};
