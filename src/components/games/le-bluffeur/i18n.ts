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
  whichTrue: string;
  /** Vote commun : téléphone au milieu, tout le monde regarde le même écran */
  tableTitle: string;
  tableHint: string;
  tableBtn: string;
  voteChip: string;
  voteHow: string;
  countdownBtn: string;
  countdownGo: string;
  theVotes: string;
  votedFor: (name: string) => string;
  ownNote: string;
  votesCount: (n: number, t: number) => string;
  revealBtn: string;
  voteTurn: (name: string) => string;
  prevVoter: string;
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
    intro: "Celui qui tient le tél lit la question à voix haute pour toute la table. Puis chacun, en secret, invente une fausse réponse crédible. Ensuite, trouvez la vraie parmi les bluffs !",
    rerollQ: "Pas fou ? Une autre question",
    action: "Action ! On invente",
    passWrite: "Toi seul : invente une fausse réponse crédible, sans la montrer aux autres.",
    validateBluff: "Valider mon bluff",
    whichTrue: "Laquelle est la vraie ?",
    tableTitle: "Téléphone au milieu !",
    tableHint: "Tous les bluffs sont écrits. Posez le tél au centre : chacun vote à son tour, devant tout le monde, sur le même écran.",
    tableBtn: "On vote !",
    voteChip: "Le vote",
    voteHow: "Touche la réponse que tu crois vraie. Les autres regardent… et jugent.",
    countdownBtn: "3, 2, 1… montrez !",
    countdownGo: "Montrez !",
    theVotes: "Qui vote quoi ?",
    votedFor: (name) => `Vote de ${name}`,
    ownNote: "Voter pour son propre bluff ne rapporte rien.",
    votesCount: (n, t) => `${n}/${t} votes`,
    revealBtn: "Révéler la vraie réponse",
    voteTurn: (name) => `${name}, à toi de voter !`,
    prevVoter: "Revenir au vote d'avant",
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
    didYouKnow: "Complète la phrase",
  },
  en: {
    name: "The Bluffer",
    tagline: "Make up a believable fake answer, then spot the real one among the bluffs.",
    intro: "Whoever holds the phone reads the question out loud to the whole table. Then everyone secretly makes up a believable fake answer. Finally, find the real one among the bluffs!",
    rerollQ: "Meh? Another question",
    action: "Action! Start bluffing",
    passWrite: "Just you: make up a believable fake answer, and don't show anyone.",
    validateBluff: "Lock in my bluff",
    whichTrue: "Which one is real?",
    tableTitle: "Phone in the middle!",
    tableHint: "All the bluffs are in. Put the phone in the middle: everyone votes in turn, in front of everyone, on the same screen.",
    tableBtn: "Let's vote!",
    voteChip: "The vote",
    voteHow: "Tap the answer you think is real. Everyone else watches… and judges.",
    countdownBtn: "3, 2, 1… show!",
    countdownGo: "Show!",
    theVotes: "Who votes what?",
    votedFor: (name) => `${name}'s vote`,
    ownNote: "Voting for your own bluff scores nothing.",
    votesCount: (n, t) => `${n}/${t} votes`,
    revealBtn: "Reveal the real answer",
    voteTurn: (name) => `${name}, your vote!`,
    prevVoter: "Back to the previous vote",
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
    didYouKnow: "Fill in the blank",
  },
  es: {
    name: "El Farsante",
    tagline: "Inventa una respuesta falsa creíble y luego descubre la verdadera entre los faroles.",
    intro: "Quien tiene el móvil lee la pregunta en voz alta para toda la mesa. Luego cada uno inventa en secreto una respuesta falsa creíble. Después, ¡hay que encontrar la verdadera entre los faroles!",
    rerollQ: "¿No mola? Otra pregunta",
    action: "¡Acción! A inventar",
    passWrite: "Solo tú: inventa una respuesta falsa creíble, sin enseñársela a nadie.",
    validateBluff: "Confirmar mi farol",
    whichTrue: "¿Cuál es la verdadera?",
    tableTitle: "¡Móvil en el centro!",
    tableHint: "Ya están todos los faroles. Dejad el móvil en el centro: cada uno vota por turnos, delante de todos, en la misma pantalla.",
    tableBtn: "¡A votar!",
    voteChip: "La votación",
    voteHow: "Toca la respuesta que crees verdadera. Los demás miran… y juzgan.",
    countdownBtn: "3, 2, 1… ¡enseñad!",
    countdownGo: "¡Enseñad!",
    theVotes: "¿Quién vota qué?",
    votedFor: (name) => `Voto de ${name}`,
    ownNote: "Votar tu propio farol no da puntos.",
    votesCount: (n, t) => `${n}/${t} votos`,
    revealBtn: "Revelar la respuesta verdadera",
    voteTurn: (name) => `¡${name}, te toca votar!`,
    prevVoter: "Volver al voto anterior",
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
    didYouKnow: "Completa la frase",
  },
};
