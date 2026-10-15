import type { I18n } from "@/lib/i18n";

// Chaînes d'interface de « Catégorie Chrono » (FR / EN / ES).
// Les règles en 3 stickers contiennent du gras : [avant, gras, après(, gras, après)].

export interface CategoryChronoStrings {
  title: string;
  titleTop: string;
  titleBottom: string;
  soundOn: string;
  soundOff: string;
  rule1: [string, string, string];
  rule2: [string, string, string];
  rule3: [string, string, string, string, string];
  themes: string;
  poolCount: (n: number) => string;
  startTimer: string;
  lives: string;
  letsGo: string;
  pickTheme: string;
  editPlayers: string;
  theCategory: string;
  forExample: string;
  starts: (secs: number) => string;
  go: string;
  itsTurn: string;
  sayWord: string;
  judgeHint: string;
  pause: string;
  paused: string;
  pausedSub: string;
  resume: string;
  wordsSaid: (n: number) => string;
  valid: string;
  failed: string;
  eliminated: string;
  losesLife: string;
  noLifeLeft: string;
  livesLeft: string;
  nextCategory: string;
  lastStanding: string;
  nobody: string;
  ranking: string;
  eliminatedAria: string;
  playAgain: string;
  changeSettings: string;
  quit: string;
  livesAria: (n: number) => string;
  decimal: string;
}

export const STR: I18n<CategoryChronoStrings> = {
  fr: {
    title: "Catégorie Chrono",
    titleTop: "Catégorie",
    titleBottom: "Chrono",
    soundOn: "Activer le son",
    soundOff: "Couper le son",
    rule1: ["Une ", "catégorie", " tombe (ex. « Fruits »)."],
    rule2: ["Chacun son tour, dis ", "un mot", " de la catégorie avant la fin du chrono. Une seule personne tient le tél et appuie sur « Validé » / « Raté » pour chacun."],
    rule3: ["Le chrono ", "raccourcit", " à chaque mot. Pas de mot, répétition ou hors sujet : ", "une vie en moins", "."],
    themes: "Les thèmes",
    poolCount: (n) => `${n} catégorie${n > 1 ? "s" : ""} dans la pioche`,
    startTimer: "Le chrono de départ",
    lives: "Les vies",
    letsGo: "C'est parti !",
    pickTheme: "Choisis au moins un thème",
    editPlayers: "Modifier les joueurs",
    theCategory: "La catégorie :",
    forExample: "Par exemple :",
    starts: (s) => `commence, ${s} secondes`,
    go: "Go !",
    itsTurn: "C'est à",
    sayWord: "Dis un mot de la catégorie !",
    judgeHint: "« Validé » si le mot est bon, « Raté » sinon : le suivant enchaîne direct.",
    pause: "Mettre en pause",
    paused: "Pause",
    pausedSub: "Le chrono est arrêté. On reprend quand vous voulez.",
    resume: "Reprendre",
    wordsSaid: (n) => `${n} mot${n > 1 ? "s" : ""} déjà dit${n > 1 ? "s" : ""}`,
    valid: "Validé",
    failed: "Raté",
    eliminated: "est éliminé·e !",
    losesLife: "perd une vie !",
    noLifeLeft: "Plus de vie",
    livesLeft: "Il reste",
    nextCategory: "Catégorie suivante",
    lastStanding: "Dernier·e en vie",
    nobody: "Personne",
    ranking: "Le classement",
    eliminatedAria: "Éliminé",
    playAgain: "Rejouer",
    changeSettings: "Changer les réglages",
    quit: "Quitter",
    livesAria: (n) => `${n} vie${n > 1 ? "s" : ""}`,
    decimal: ",",
  },
  en: {
    title: "Category Clock",
    titleTop: "Category",
    titleBottom: "Clock",
    soundOn: "Turn sound on",
    soundOff: "Mute",
    rule1: ["A ", "category", " comes up (e.g. “Fruit”)."],
    rule2: ["Take turns saying ", "one word", " from the category before the timer runs out. One person holds the phone and taps “Good” / “Fail” for everyone."],
    rule3: ["The timer gets ", "shorter", " with every word. No word, a repeat or off-topic: ", "you lose a life", "."],
    themes: "Themes",
    poolCount: (n) => `${n} categor${n === 1 ? "y" : "ies"} in the deck`,
    startTimer: "Starting timer",
    lives: "Lives",
    letsGo: "Let's go!",
    pickTheme: "Pick at least one theme",
    editPlayers: "Edit players",
    theCategory: "The category:",
    forExample: "For example:",
    starts: (s) => `starts, ${s} seconds`,
    go: "Go!",
    itsTurn: "Over to",
    sayWord: "Say a word from the category!",
    judgeHint: "“Good” if the word works, “Fail” if not: the next player goes straight away.",
    pause: "Pause",
    paused: "Paused",
    pausedSub: "The timer is stopped. Resume whenever you're ready.",
    resume: "Resume",
    wordsSaid: (n) => `${n} word${n === 1 ? "" : "s"} said`,
    valid: "Good",
    failed: "Fail",
    eliminated: "is out!",
    losesLife: "loses a life!",
    noLifeLeft: "No lives left",
    livesLeft: "Lives left:",
    nextCategory: "Next category",
    lastStanding: "Last one standing",
    nobody: "Nobody",
    ranking: "Standings",
    eliminatedAria: "Out",
    playAgain: "Play again",
    changeSettings: "Change settings",
    quit: "Quit",
    livesAria: (n) => `${n} li${n === 1 ? "fe" : "ves"}`,
    decimal: ".",
  },
  es: {
    title: "Categoría Contrarreloj",
    titleTop: "Categoría",
    titleBottom: "Contrarreloj",
    soundOn: "Activar el sonido",
    soundOff: "Silenciar",
    rule1: ["Sale una ", "categoría", " (p. ej., «Frutas»)."],
    rule2: ["Por turnos, di ", "una palabra", " de la categoría antes de que acabe el tiempo. Una sola persona sostiene el móvil y toca «Vale» / «Fallo» para todos."],
    rule3: ["El tiempo se ", "acorta", " con cada palabra. Sin palabra, repetida o fuera de tema: ", "pierdes una vida", "."],
    themes: "Los temas",
    poolCount: (n) => `${n} categoría${n === 1 ? "" : "s"} en el mazo`,
    startTimer: "Tiempo inicial",
    lives: "Las vidas",
    letsGo: "¡Vamos!",
    pickTheme: "Elige al menos un tema",
    editPlayers: "Cambiar jugadores",
    theCategory: "La categoría:",
    forExample: "Por ejemplo:",
    starts: (s) => `empieza, ${s} segundos`,
    go: "¡Ya!",
    itsTurn: "Le toca a",
    sayWord: "¡Di una palabra de la categoría!",
    judgeHint: "«Vale» si la palabra es buena, «Fallo» si no: el siguiente sigue al instante.",
    pause: "Pausar",
    paused: "Pausa",
    pausedSub: "El tiempo está parado. Seguid cuando queráis.",
    resume: "Seguir",
    wordsSaid: (n) => `${n} palabra${n === 1 ? "" : "s"} dicha${n === 1 ? "" : "s"}`,
    valid: "Vale",
    failed: "Fallo",
    eliminated: "¡queda eliminado!",
    losesLife: "¡pierde una vida!",
    noLifeLeft: "Sin vidas",
    livesLeft: "Le quedan",
    nextCategory: "Siguiente categoría",
    lastStanding: "Último en pie",
    nobody: "Nadie",
    ranking: "La clasificación",
    eliminatedAria: "Eliminado",
    playAgain: "Volver a jugar",
    changeSettings: "Cambiar ajustes",
    quit: "Salir",
    livesAria: (n) => `${n} vida${n === 1 ? "" : "s"}`,
    decimal: ",",
  },
};
