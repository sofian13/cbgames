import type { I18n, Lang } from "@/lib/i18n";
import type { BluffQuestion } from "./questions";
import { BLUFF_QUESTIONS } from "./questions";
import { BLUFF_QUESTIONS_EN } from "./questions.en";
import { BLUFF_QUESTIONS_ES } from "./questions.es";

/** Banque de questions de la langue de la partie (le serveur en ligne garde le FR). */
export function questionsFor(lang: Lang): BluffQuestion[] {
  return lang === "en" ? BLUFF_QUESTIONS_EN : lang === "es" ? BLUFF_QUESTIONS_ES : BLUFF_QUESTIONS;
}

/** Textes du Bluffeur (mode un seul téléphone + habillage). Le mode en ligne (site) reste en français. */
export const STR: I18n<{
  name: string;
  tagline: string;
  intro: string;
  rerollQ: string;
  action: string;
  passWrite: string;
  validateBluff: string;
  meVote: string;
  passVote: string;
  votes: (name: string) => string;
  whichTrue: string;
  yourBluff: string;
  round: (r: number, t: number) => string;
  trueAnswer: string;
  foundBy: string;
  writtenBy: string;
  theBluffs: string;
  by: string;
  each: string;
  fooled: string;
  nobodyFell: string;
  seeScores: string;
  nextRound: string;
  bluffAce: string;
  playAgain: string;
  changePlayers: string;
  backHome: string;
  inputLabel: string;
  placeholder: string;
  perFooled: string;
  didYouKnow: string;
}> = {
  fr: {
    name: "Le Bluffeur",
    tagline: "Invente une fausse réponse crédible, puis démasque la vraie parmi les bluffs.",
    intro: "Chacun invente en secret une fausse réponse crédible. Ensuite, trouvez la vraie parmi les bluffs !",
    rerollQ: "Pas fou ? Une autre question",
    action: "Action ! On invente",
    passWrite: "Toi seul : invente une fausse réponse crédible, sans la montrer aux autres.",
    validateBluff: "Valider mon bluff",
    meVote: "C'est moi, je vote",
    passVote: "Trouve la VRAIE réponse parmi les propositions.",
    votes: (name) => `${name} vote`,
    whichTrue: "Laquelle est la vraie ?",
    yourBluff: "C'est ton bluff",
    round: (r, t) => `Manche ${r}/${t}`,
    trueAnswer: "La vraie réponse",
    foundBy: "Trouvée par ",
    writtenBy: " Écrite pile par ",
    theBluffs: "Les bluffs",
    by: "De ",
    each: " (chacun)",
    fooled: " · a piégé ",
    nobodyFell: " · personne n'est tombé dedans",
    seeScores: "Voir les scores",
    nextRound: "Manche suivante",
    bluffAce: " as du bluff",
    playAgain: "Rejouer",
    changePlayers: "Changer les joueurs",
    backHome: "Retour à l'accueil",
    inputLabel: "Ton bluff",
    placeholder: "Une fausse réponse crédible…",
    perFooled: "+20 par joueur piégé",
    didYouKnow: "Le saviez-vous ?",
  },
  en: {
    name: "The Bluffer",
    tagline: "Make up a believable fake answer, then spot the real one among the bluffs.",
    intro: "Everyone secretly makes up a believable fake answer. Then find the real one among the bluffs!",
    rerollQ: "Meh? Another question",
    action: "Action! Start bluffing",
    passWrite: "Just you: make up a believable fake answer, and don't show anyone.",
    validateBluff: "Lock in my bluff",
    meVote: "It's me, I'm voting",
    passVote: "Find the REAL answer among the options.",
    votes: (name) => `${name} votes`,
    whichTrue: "Which one is real?",
    yourBluff: "That's your bluff",
    round: (r, t) => `Round ${r}/${t}`,
    trueAnswer: "The real answer",
    foundBy: "Found by ",
    writtenBy: " Nailed it: ",
    theBluffs: "The bluffs",
    by: "By ",
    each: " (each)",
    fooled: " · fooled ",
    nobodyFell: " · nobody fell for it",
    seeScores: "See the scores",
    nextRound: "Next round",
    bluffAce: " bluff master",
    playAgain: "Play again",
    changePlayers: "Change players",
    backHome: "Back to home",
    inputLabel: "Your bluff",
    placeholder: "A believable fake answer…",
    perFooled: "+20 per player fooled",
    didYouKnow: "Did you know?",
  },
  es: {
    name: "El Farsante",
    tagline: "Inventa una respuesta falsa creíble y luego descubre la verdadera entre los faroles.",
    intro: "Cada uno inventa en secreto una respuesta falsa creíble. Después, ¡hay que encontrar la verdadera entre los faroles!",
    rerollQ: "¿No mola? Otra pregunta",
    action: "¡Acción! A inventar",
    passWrite: "Solo tú: inventa una respuesta falsa creíble, sin enseñársela a nadie.",
    validateBluff: "Confirmar mi farol",
    meVote: "Soy yo, voto",
    passVote: "Encuentra la respuesta VERDADERA entre las opciones.",
    votes: (name) => `Vota ${name}`,
    whichTrue: "¿Cuál es la verdadera?",
    yourBluff: "Es tu farol",
    round: (r, t) => `Ronda ${r}/${t}`,
    trueAnswer: "La respuesta verdadera",
    foundBy: "La encontró: ",
    writtenBy: " La escribió tal cual: ",
    theBluffs: "Los faroles",
    by: "De ",
    each: " (cada uno)",
    fooled: " · engañó a ",
    nobodyFell: " · nadie cayó",
    seeScores: "Ver puntuaciones",
    nextRound: "Siguiente ronda",
    bluffAce: " ¡rey del farol!",
    playAgain: "Volver a jugar",
    changePlayers: "Cambiar jugadores",
    backHome: "Volver al inicio",
    inputLabel: "Tu farol",
    placeholder: "Una respuesta falsa creíble…",
    perFooled: "+20 por jugador engañado",
    didYouKnow: "¿Sabías que…?",
  },
};
