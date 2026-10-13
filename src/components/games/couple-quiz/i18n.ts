import type { I18n, Lang } from "@/lib/i18n";
import { QPACKS, type QPack } from "./questions";
import { QPACKS_EN } from "./questions.en";
import { QPACKS_ES } from "./questions.es";

/** Packs de questions de la langue de la partie (mêmes ids dans les 3 langues). */
export function packsFor(lang: Lang): QPack[] {
  return lang === "en" ? QPACKS_EN : lang === "es" ? QPACKS_ES : QPACKS;
}

/** Textes de « Tu me connais ? » (mode local). Le mode en ligne (site) reste en français. */
export const STR: I18n<{
  name: string;
  tagline: string;
  verdicts: [string, string, string, string];
  soundOn: string;
  soundOff: string;
  continue: string;
  bothNames: string;
  title: [string, string];
  intro: string;
  you: string;
  partner: string;
  nameAria: (n: number) => string;
  pickOne: string;
  go: string;
  changeNames: string;
  themes: string;
  inDeck: (n: number) => string;
  adultTag: string;
  howMany: string;
  meAnswer: string;
  meGuess: string;
  passTo: string;
  passAnswer: [string, string];
  passGuess: [string, string];
  reroll: string;
  youAre: string;
  isRather: string;
  honest: string;
  yourGuess: [string, string];
  seeResult: string;
  nextQuestion: string;
  bull: string;
  missed: string;
  answererIs: (name: string) => string;
  guesserSaid: (name: string) => string;
  explain: (name: string) => string;
  playAgain: string;
  changeThemes: string;
  quit: string;
  rate: string;
  goodAnswers: (n: number, total: number) => string;
  questionOf: (r: number, t: number) => string;
  or: string;
}> = {
  fr: {
    name: "Tu me connais ?",
    tagline: "Quiz de couple : l'un répond sur lui, l'autre devine. Ensemble sur un tél, ou chacun le sien à distance.",
    verdicts: ["Âmes sœurs !", "Sacrée complicité", "Encore des choses à découvrir", "Premier rendez-vous ?"],
    soundOn: "Activer le son",
    soundOff: "Couper le son",
    continue: "Continuer",
    bothNames: "Vos deux prénoms",
    title: ["Tu me", "connais ?"],
    intro: "À deux sur un seul tél. L'un répond en secret sur lui-même, l'autre doit deviner sa réponse. On alterne à chaque question.",
    you: "Toi",
    partner: "Ta moitié",
    nameAria: (n) => `Prénom ${n}`,
    pickOne: "Choisis au moins un thème",
    go: "C'est parti !",
    changeNames: "Changer les prénoms",
    themes: "Les thèmes",
    inDeck: (n) => `${n} questions dans la pioche`,
    adultTag: "18+, coquin",
    howMany: "Combien de questions ?",
    meAnswer: "C'est moi, je réponds",
    meGuess: "C'est moi, je devine",
    passTo: "Passe le tél à…",
    passAnswer: ["Réponds sur toi, sans montrer l'écran. ", " devra deviner."],
    passGuess: ["Devine ce que ", " a répondu sur soi."],
    reroll: "Pas fou ? Une autre",
    youAre: ", toi tu es plutôt…",
    isRather: " est plutôt…",
    honest: "Réponds honnêtement, et ne montre pas !",
    yourGuess: ["À ton avis, qu'a répondu ", " ?"],
    seeResult: "Voir le résultat",
    nextQuestion: "Question suivante",
    bull: "Dans le mille !",
    missed: "Raté !",
    answererIs: (name) => `${name} est plutôt`,
    guesserSaid: (name) => `${name} avait deviné`,
    explain: (name) => `${name}, explique-toi !`,
    playAgain: "Rejouer",
    changeThemes: "Changer les thèmes",
    quit: "Quitter",
    rate: "Votre taux de complicité",
    goodAnswers: (n, total) => `${n} bonne${n > 1 ? "s" : ""} réponse${n > 1 ? "s" : ""} sur ${total}`,
    questionOf: (r, t) => `Question ${r} sur ${t}`,
    or: "ou",
  },
  en: {
    name: "Do You Know Me?",
    tagline: "Couples quiz: one answers about themselves, the other guesses. Together on one phone, or each on their own from afar.",
    verdicts: ["Soulmates!", "Serious chemistry", "Still things to discover", "First date?"],
    soundOn: "Turn sound on",
    soundOff: "Mute sound",
    continue: "Continue",
    bothNames: "Both your names",
    title: ["Do you", "know me?"],
    intro: "Two of you, one phone. One answers about themselves in secret, the other has to guess their answer. Swap every question.",
    you: "You",
    partner: "Your other half",
    nameAria: (n) => `Name ${n}`,
    pickOne: "Pick at least one theme",
    go: "Let's go!",
    changeNames: "Change names",
    themes: "Themes",
    inDeck: (n) => `${n} questions in the deck`,
    adultTag: "18+, cheeky",
    howMany: "How many questions?",
    meAnswer: "It's me, I'm answering",
    meGuess: "It's me, I'm guessing",
    passTo: "Pass the phone to…",
    passAnswer: ["Answer about yourself, don't show the screen. ", " will have to guess."],
    passGuess: ["Guess what ", " said about themselves."],
    reroll: "Meh? Another one",
    youAre: ", are you more…",
    isRather: " is more…",
    honest: "Answer honestly, and don't show!",
    yourGuess: ["What do you think ", " answered?"],
    seeResult: "See the result",
    nextQuestion: "Next question",
    bull: "Bang on!",
    missed: "Missed!",
    answererIs: (name) => `${name} is more`,
    guesserSaid: (name) => `${name} guessed`,
    explain: (name) => `${name}, explain yourself!`,
    playAgain: "Play again",
    changeThemes: "Change themes",
    quit: "Quit",
    rate: "Your chemistry score",
    goodAnswers: (n, total) => `${n} right answer${n === 1 ? "" : "s"} out of ${total}`,
    questionOf: (r, t) => `Question ${r} of ${t}`,
    or: "or",
  },
  es: {
    name: "¿Me Conoces?",
    tagline: "Quiz de pareja: uno responde sobre sí mismo y el otro adivina. Juntos en un móvil, o cada uno en el suyo a distancia.",
    verdicts: ["¡Almas gemelas!", "Menuda complicidad", "Aún queda mucho por descubrir", "¿Primera cita?"],
    soundOn: "Activar el sonido",
    soundOff: "Silenciar",
    continue: "Continuar",
    bothNames: "Vuestros dos nombres",
    title: ["¿Me", "conoces?"],
    intro: "Dos personas, un solo móvil. Uno responde en secreto sobre sí mismo y el otro tiene que adivinar su respuesta. Se alterna en cada pregunta.",
    you: "Tú",
    partner: "Tu media naranja",
    nameAria: (n) => `Nombre ${n}`,
    pickOne: "Elige al menos un tema",
    go: "¡Vamos!",
    changeNames: "Cambiar los nombres",
    themes: "Los temas",
    inDeck: (n) => `${n} preguntas en el mazo`,
    adultTag: "18+, atrevido",
    howMany: "¿Cuántas preguntas?",
    meAnswer: "Soy yo, respondo",
    meGuess: "Soy yo, adivino",
    passTo: "Pásale el móvil a…",
    passAnswer: ["Responde sobre ti, sin enseñar la pantalla. ", " tendrá que adivinarlo."],
    passGuess: ["Adivina qué respondió ", " sobre sí mismo/a."],
    reroll: "¿No mola? Otra",
    youAre: ", ¿tú eres más…",
    isRather: " es más…",
    honest: "¡Responde con sinceridad y no lo enseñes!",
    yourGuess: ["¿Qué crees que respondió ", "?"],
    seeResult: "Ver el resultado",
    nextQuestion: "Siguiente pregunta",
    bull: "¡En el blanco!",
    missed: "¡Fallado!",
    answererIs: (name) => `${name} es más`,
    guesserSaid: (name) => `${name} había dicho`,
    explain: (name) => `${name}, ¡explícate!`,
    playAgain: "Volver a jugar",
    changeThemes: "Cambiar los temas",
    quit: "Salir",
    rate: "Vuestro nivel de complicidad",
    goodAnswers: (n, total) => `${n} acierto${n === 1 ? "" : "s"} de ${total}`,
    questionOf: (r, t) => `Pregunta ${r} de ${t}`,
    or: "o",
  },
};
