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
  /** Tuto des gestes (avant la 1re manche) */
  tutoTitle: string;
  tutoIntro: string;
  tutoForward: [string, string];
  tutoBack: [string, string];
  tutoNoSensor: string;
  tutoOk: string;
  /** Rappel discret pendant le compte à rebours */
  tiltHint: string;
  /** Rappel des gestes sur l'écran de passage (chaque devineur) */
  passTilt: string;
  /** Flash plein écran */
  flashFound: string;
  flashPass: string;
}

export const STR: I18n<GuessWordStrings> = {
  fr: {
    title: "Deviner le Mot",
    rules: [
      "Mets le tél sur ton front, écran vers les autres.",
      "Ils te font deviner le mot sans le dire.",
      "Penche la tête en avant (écran vers le sol) si tu trouves, en arrière (écran vers le plafond) pour passer.",
      "Le plus de mots trouvés gagne.",
    ],
    how1: [" Mets le tél ", "sur ton front", ", écran vers les autres."],
    how2: [" Ils te font deviner le mot ", "sans le dire", " (mime, indices, bruitages)."],
    how3: [" Penche ", "en avant", " si tu trouves, ", "en arrière", " pour passer."],
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
    tutoTitle: "Pas besoin de toucher l'écran",
    tutoIntro: "Le tél sur le front, en travers (paysage). Tu réponds d'un mouvement de tête :",
    tutoForward: ["Penche en avant", "écran vers le sol = TROUVÉ"],
    tutoBack: ["Penche en arrière", "écran vers le plafond = PASSER"],
    tutoNoSensor: "Pas de capteurs ? Les boutons en bas de l'écran marchent aussi.",
    tutoOk: "Compris, on y va !",
    tiltHint: "Avant = trouvé · Arrière = passer",
    passTilt: "Rappel : penche la tête en avant = trouvé, en arrière = passer.",
    flashFound: "TROUVÉ !",
    flashPass: "PASSE !",
  },
  en: {
    title: "Guess the Word",
    rules: [
      "Hold the phone to your forehead, screen facing the others.",
      "They get you to guess the word without saying it.",
      "Tip your head forward (screen to the floor) if you get it, back (screen to the ceiling) to skip.",
      "Most words guessed wins.",
    ],
    how1: [" Hold the phone ", "to your forehead", ", screen facing the others."],
    how2: [" They get you to guess the word ", "without saying it", " (miming, clues, sound effects)."],
    how3: [" Tip ", "forward", " if you get it, ", "back", " to skip."],
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
    tutoTitle: "No need to touch the screen",
    tutoIntro: "Phone on your forehead, sideways (landscape). Answer with a nod:",
    tutoForward: ["Tip forward", "screen to the floor = GOT IT"],
    tutoBack: ["Tip back", "screen to the ceiling = SKIP"],
    tutoNoSensor: "No motion sensors? The buttons at the bottom work too.",
    tutoOk: "Got it, let's go!",
    tiltHint: "Forward = got it · Back = skip",
    passTilt: "Reminder: tip your head forward = got it, back = skip.",
    flashFound: "GOT IT!",
    flashPass: "SKIP!",
  },
  es: {
    title: "Adivina la Palabra",
    rules: [
      "Ponte el móvil en la frente, con la pantalla hacia los demás.",
      "Te hacen adivinar la palabra sin decirla.",
      "Inclina la cabeza hacia delante (pantalla al suelo) si aciertas, hacia atrás (pantalla al techo) para pasar.",
      "Gana quien acierte más palabras.",
    ],
    how1: [" Ponte el móvil ", "en la frente", ", con la pantalla hacia los demás."],
    how2: [" Te hacen adivinar la palabra ", "sin decirla", " (mímica, pistas, ruidos)."],
    how3: [" Inclina ", "hacia delante", " si aciertas, ", "hacia atrás", " para pasar."],
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
    tutoTitle: "No hace falta tocar la pantalla",
    tutoIntro: "El móvil en la frente, de lado (horizontal). Respondes con la cabeza:",
    tutoForward: ["Inclina hacia delante", "pantalla al suelo = ACERTADA"],
    tutoBack: ["Inclina hacia atrás", "pantalla al techo = PASAR"],
    tutoNoSensor: "¿Sin sensores? Los botones de abajo también funcionan.",
    tutoOk: "¡Entendido, vamos!",
    tiltHint: "Delante = acertada · Atrás = pasar",
    passTilt: "Recuerda: cabeza hacia delante = acertada, hacia atrás = pasar.",
    flashFound: "¡ACERTADA!",
    flashPass: "¡PASO!",
  },
};
