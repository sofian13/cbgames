import type { I18n } from "@/lib/i18n";

// Chaînes d'interface de « Deviner le Mot » (FR / EN / ES).

export interface GuessWordStrings {
  title: string;
  rules: string[];
  how1: [string, string, string];
  how2: [string, string, string];
  how3: [string, string, string, string, string];
  themes: string;
  words: (n: number) => string;
  timePerPlayer: string;
  turns: string;
  turnsHint: (n: number) => string;
  letsGo: string;
  pickTheme: string;
  editPlayers: string;
  passHint: (turn: number, total: number, secs: number) => string;
  ready: string;
  phoneOnForehead: string;
  found: (n: number) => string;
  reroll: string;
  got: string;
  skip: string;
  timeUp: string;
  wordsFound: (n: number) => string;
  noWords: string;
  finalRanking: string;
  nextPlayer: (name: string) => string;
  endGame: string;
  tieTop: string;
  bestGuesser: string;
  playAgain: string;
  themesBtn: string;
  quit: string;
}

export const STR: I18n<GuessWordStrings> = {
  fr: {
    title: "Deviner le Mot",
    rules: [
      "Mets le tél sur ton front, écran vers les autres.",
      "Ils te font deviner le mot sans le dire.",
      "Tape à gauche si tu trouves, à droite pour passer.",
      "Le plus de mots trouvés gagne.",
    ],
    how1: [" Mets le tél ", "sur ton front", ", écran vers les autres."],
    how2: [" Ils te font deviner le mot ", "sans le dire", " (mime, indices, bruitages)."],
    how3: [" Tape ", "à gauche", " si tu trouves, ", "à droite", " pour passer "],
    themes: "Les thèmes",
    words: (n) => `${n} mot${n > 1 ? "s" : ""}`,
    timePerPlayer: "Temps par joueur",
    turns: "Tours",
    turnsHint: (n) => `Chaque joueur passe ${n} fois avec le tél sur le front.`,
    letsGo: "C'est parti !",
    pickTheme: "Choisis un thème",
    editPlayers: "Modifier les joueurs",
    passHint: (turn, total, secs) => `C'est toi qui devines ! Tour ${turn}/${total} · ${secs} s. Prépare-toi à mettre le tél sur ton front.`,
    ready: "Prêt, on lance !",
    phoneOnForehead: " Tél sur le front !",
    found: (n) => `${n} trouvé${n > 1 ? "s" : ""}`,
    reroll: "Mot nul ? Changer de mot",
    got: "Trouvé",
    skip: "Passer",
    timeUp: "Temps écoulé !",
    wordsFound: (n) => `mot${n > 1 ? "s" : ""} trouvé${n > 1 ? "s" : ""}`,
    noWords: "Aucun mot… on se réveille !",
    finalRanking: "Classement final",
    // « de Léa » / « d'Al » (élision devant une voyelle)
    nextPlayer: (name) => `Au tour ${/^[aeiouyàâäéèêëîïôöùûü]/i.test(name) ? `d'${name}` : `de ${name}`}`,
    endGame: "Terminer la partie",
    tieTop: "Égalité au sommet !",
    bestGuesser: "Meilleur·e devin·e",
    playAgain: "Rejouer",
    themesBtn: "Les thèmes",
    quit: "Quitter",
  },
  en: {
    title: "Guess the Word",
    rules: [
      "Hold the phone to your forehead, screen facing the others.",
      "They get you to guess the word without saying it.",
      "Tap left if you get it, right to skip.",
      "Most words guessed wins.",
    ],
    how1: [" Hold the phone ", "to your forehead", ", screen facing the others."],
    how2: [" They get you to guess the word ", "without saying it", " (miming, clues, sound effects)."],
    how3: [" Tap ", "left", " if you get it, ", "right", " to skip "],
    themes: "Themes",
    words: (n) => `${n} word${n === 1 ? "" : "s"}`,
    timePerPlayer: "Time per player",
    turns: "Turns",
    turnsHint: (n) => (n === 1 ? "Each player gets 1 go with the phone on their forehead." : `Each player gets ${n} goes with the phone on their forehead.`),
    letsGo: "Let's go!",
    pickTheme: "Pick a theme",
    editPlayers: "Edit players",
    passHint: (turn, total, secs) => `You're guessing! Turn ${turn}/${total} · ${secs} s. Get ready to put the phone on your forehead.`,
    ready: "Ready, let's go!",
    phoneOnForehead: " Phone on your forehead!",
    found: (n) => `${n} guessed`,
    reroll: "Bad word? Swap it",
    got: "Got it",
    skip: "Skip",
    timeUp: "Time's up!",
    wordsFound: (n) => (n === 1 ? "word guessed" : "words guessed"),
    noWords: "No words… wake up!",
    finalRanking: "Final standings",
    nextPlayer: (name) => `${name}'s turn`,
    endGame: "End the game",
    tieTop: "Tie at the top!",
    bestGuesser: "Best guesser",
    playAgain: "Play again",
    themesBtn: "Themes",
    quit: "Quit",
  },
  es: {
    title: "Adivina la Palabra",
    rules: [
      "Ponte el móvil en la frente, con la pantalla hacia los demás.",
      "Te hacen adivinar la palabra sin decirla.",
      "Toca a la izquierda si aciertas, a la derecha para pasar.",
      "Gana quien acierte más palabras.",
    ],
    how1: [" Ponte el móvil ", "en la frente", ", con la pantalla hacia los demás."],
    how2: [" Te hacen adivinar la palabra ", "sin decirla", " (mímica, pistas, ruidos)."],
    how3: [" Toca ", "a la izquierda", " si aciertas, ", "a la derecha", " para pasar "],
    themes: "Los temas",
    words: (n) => `${n} palabra${n === 1 ? "" : "s"}`,
    timePerPlayer: "Tiempo por jugador",
    turns: "Turnos",
    turnsHint: (n) => (n === 1 ? "Cada jugador juega 1 vez con el móvil en la frente." : `Cada jugador juega ${n} veces con el móvil en la frente.`),
    letsGo: "¡Vamos!",
    pickTheme: "Elige un tema",
    editPlayers: "Cambiar jugadores",
    passHint: (turn, total, secs) => `¡Te toca adivinar! Turno ${turn}/${total} · ${secs} s. Prepárate para ponerte el móvil en la frente.`,
    ready: "¡Listo, empezamos!",
    phoneOnForehead: " ¡Móvil en la frente!",
    found: (n) => `${n} acertada${n === 1 ? "" : "s"}`,
    reroll: "¿Palabra mala? Cambiarla",
    got: "Acertada",
    skip: "Pasar",
    timeUp: "¡Se acabó el tiempo!",
    wordsFound: (n) => (n === 1 ? "palabra acertada" : "palabras acertadas"),
    noWords: "Ninguna palabra… ¡despierta!",
    finalRanking: "Clasificación final",
    nextPlayer: (name) => `Le toca a ${name}`,
    endGame: "Terminar la partida",
    tieTop: "¡Empate en lo más alto!",
    bestGuesser: "Mejor adivino",
    playAgain: "Volver a jugar",
    themesBtn: "Los temas",
    quit: "Salir",
  },
};
