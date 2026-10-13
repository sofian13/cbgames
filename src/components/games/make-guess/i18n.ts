import type { I18n } from "@/lib/i18n";
import { THEME_IDS, type ThemeId } from "./words";

const THEME_COUNT = THEME_IDS.length;

// Chaînes d'interface de « Fais Deviner » (FR / EN / ES).

export interface MakeGuessStrings {
  title: string;
  tagline: string;
  rules: string[];
  howTo: string;
  howTo1: [string, string, string];
  howTo2: [string, string, string];
  howTo3: [string, string, string];
  howTo4: [string, string, string];
  teamName: (n: number) => string;
  teamNamePh: string;
  teamNameAria: (n: number) => string;
  removeTeam: string;
  playerPh: (n: 1 | 2) => string;
  playerAria: (p: 1 | 2, team: number) => string;
  teams: string;
  addTeam: string;
  themes: string;
  words: (n: number) => string;
  clearAll: string;
  mixAll: string;
  pickOne: string;
  optInNote: string;
  /** Version découverte (app sans Zinzin+) */
  freeNote: (n: number) => string;
  lockedTheme: (name: string) => string;
  timer: string;
  timerChip: (d: number) => string;
  rounds: string;
  start: string;
  fillNames: string;
  roundTurn: (round: number, total: number, sub: number) => string;
  describer: string;
  guesser: string;
  passPhone: (describer: string, guesser: string) => string;
  letsGo: string;
  points: (n: number) => string;
  noMoreWords: string;
  reroll: string;
  undo: string;
  got: string;
  skip: string;
  timeUp: string;
  wordsFound: (n: number) => string;
  noWords: string;
  nextTeam: string;
  nextTurn: string;
  seeRecap: string;
  finalResults: string;
  endOfRound: (n: number) => string;
  ranking: string;
  round: (n: number) => string;
  gameOver: string;
  tie: string;
  wins: (name: string) => string;
  ordinal: (n: number) => string;
  rematch: string;
  rematchHint: string;
  settings: string;
  quit: string;
  themeLabels: Record<ThemeId, string>;
}

export const STR: I18n<MakeGuessStrings> = {
  fr: {
    title: "Fais Deviner",
    tagline: "Décris, fais deviner, marque des points !",
    rules: [
      "Faites des équipes de 2.",
      "L'un tient le tél et décrit le mot sans le dire.",
      "L'autre devine, sans voir l'écran.",
      "Trouvé = 1 point. Bloqué ? Passe au suivant.",
    ],
    howTo: "Comment jouer",
    howTo1: ["Au moins ", "4 joueurs", " : 2 équipes de 2, un seul téléphone."],
    howTo2: ["Celui qui fait deviner ", "tient le tél", " et décrit le mot sans le dire."],
    howTo3: ["Son coéquipier devine, ", "sans voir l'écran", "."],
    howTo4: [" trouvé, ", " passer, ", " annuler une erreur."],
    teamName: (n) => `Équipe ${n}`,
    teamNamePh: "Nom de l'équipe",
    teamNameAria: (n) => `Nom de l'équipe ${n}`,
    removeTeam: "Supprimer l'équipe",
    playerPh: (n) => `Joueur ${n}`,
    playerAria: (p, team) => `Joueur ${p}, équipe ${team}`,
    teams: "Les équipes",
    addTeam: "Ajouter une équipe",
    themes: "Les thèmes",
    words: (n) => `${n} mot${n > 1 ? "s" : ""}`,
    clearAll: "Tout retirer",
    mixAll: "Tout mélanger",
    pickOne: "Choisis au moins un thème.",
    optInNote: "« Marques & logos » et « 18+ » ne sont pas inclus par défaut.",
    freeNote: (n) => `${n} mots offerts qui tournent. Les ${THEME_COUNT} thèmes sont dans Zinzin+.`,
    lockedTheme: (name) => `${name} : disponible avec Zinzin+`,
    timer: "Durée du chrono",
    timerChip: (d) => (d === 120 ? "2 min" : `${d} s`),
    rounds: "Nombre de manches",
    start: "Commencer la partie",
    fillNames: "Remplis tous les noms : au moins 2 équipes de 2 joueurs.",
    roundTurn: (r, t, s) => `Manche ${r}/${t} · tour ${s}/2`,
    describer: "Fait deviner, tient le tél",
    guesser: "Devine, sans regarder l'écran",
    passPhone: (d, g) => `Passe le tél à ${d}. ${g} ne doit pas voir l'écran !`,
    letsGo: "C'est parti !",
    points: (n) => `${n} pt${n > 1 ? "s" : ""}`,
    noMoreWords: "Plus de mots !",
    reroll: "Mot nul ? Changer de mot",
    undo: "Annuler le dernier",
    got: "Trouvé",
    skip: "Passer",
    timeUp: "Temps écoulé !",
    wordsFound: (n) => `mot${n > 1 ? "s" : ""} trouvé${n > 1 ? "s" : ""}`,
    noWords: "Aucun mot… au prochain tour !",
    nextTeam: "Équipe suivante",
    nextTurn: "Tour suivant",
    seeRecap: "Voir le récap",
    finalResults: "Résultats finaux",
    endOfRound: (n) => `Fin de la manche ${n}`,
    ranking: "Classement",
    round: (n) => `Manche ${n}`,
    gameOver: "Partie terminée",
    tie: "Égalité !",
    wins: (name) => `${name} l'emporte !`,
    ordinal: (n) => (n === 1 ? "1er" : `${n}ᵉ`),
    rematch: "Revanche",
    rematchHint: "Mêmes équipes, nouveaux mots",
    settings: "Réglages",
    quit: "Quitter",
    themeLabels: {
      simple: "Facile", objects: "Objets", animals: "Animaux", famous: "Célébrités", actions: "Actions",
      places: "Lieux", nature: "Nature & espace", legends: "Contes & légendes", expressions: "Expressions",
      movies: "Films & séries", food: "Bouffe & plats", jobs: "Métiers", fun: "Drôle", abstract: "Émotions & idées",
      culture: "Culture pop", brands: "Marques & logos", adult: "18+",
      sports: "Sports", body: "Corps humain", countries: "Pays & villes", characters: "Personnages",
      manga: "Manga & anime", music: "Musique", y2k: "Années 2000", internet: "Internet & réseaux",
      party: "Soirée", school: "École", holidays: "Vacances", doctor: "Chez le médecin",
    },
  },
  en: {
    title: "Make Them Guess",
    tagline: "Describe it, get them to guess, score points!",
    rules: [
      "Split into teams of 2.",
      "One holds the phone and describes the word without saying it.",
      "The other guesses, without looking at the screen.",
      "Got it = 1 point. Stuck? Skip to the next one.",
    ],
    howTo: "How to play",
    howTo1: ["At least ", "4 players", ": 2 teams of 2, one phone."],
    howTo2: ["The describer ", "holds the phone", " and describes the word without saying it."],
    howTo3: ["Their teammate guesses, ", "without seeing the screen", "."],
    howTo4: [" got it, ", " skip, ", " undo a mistake."],
    teamName: (n) => `Team ${n}`,
    teamNamePh: "Team name",
    teamNameAria: (n) => `Team ${n} name`,
    removeTeam: "Remove team",
    playerPh: (n) => `Player ${n}`,
    playerAria: (p, team) => `Player ${p}, team ${team}`,
    teams: "Teams",
    addTeam: "Add a team",
    themes: "Themes",
    words: (n) => `${n} word${n === 1 ? "" : "s"}`,
    clearAll: "Clear all",
    mixAll: "Mix them all",
    pickOne: "Pick at least one theme.",
    optInNote: "“Brands & logos” and “18+” aren't included by default.",
    freeNote: (n) => `${n} free words on rotation. All ${THEME_COUNT} themes are in Zinzin+.`,
    lockedTheme: (name) => `${name}: available with Zinzin+`,
    timer: "Timer",
    timerChip: (d) => (d === 120 ? "2 min" : `${d} s`),
    rounds: "Rounds",
    start: "Start the game",
    fillNames: "Fill in every name: at least 2 teams of 2 players.",
    roundTurn: (r, t, s) => `Round ${r}/${t} · turn ${s}/2`,
    describer: "Describes, holds the phone",
    guesser: "Guesses, no peeking at the screen",
    passPhone: (d, g) => `Pass the phone to ${d}. ${g} mustn't see the screen!`,
    letsGo: "Let's go!",
    points: (n) => `${n} pt${n === 1 ? "" : "s"}`,
    noMoreWords: "Out of words!",
    reroll: "Bad word? Swap it",
    undo: "Undo last",
    got: "Got it",
    skip: "Skip",
    timeUp: "Time's up!",
    wordsFound: (n) => (n === 1 ? "word guessed" : "words guessed"),
    noWords: "No words… next time!",
    nextTeam: "Next team",
    nextTurn: "Next turn",
    seeRecap: "See the recap",
    finalResults: "Final results",
    endOfRound: (n) => `End of round ${n}`,
    ranking: "Standings",
    round: (n) => `Round ${n}`,
    gameOver: "Game over",
    tie: "It's a tie!",
    wins: (name) => `${name} wins!`,
    ordinal: (n) => {
      const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
      return `${n}${s}`;
    },
    rematch: "Rematch",
    rematchHint: "Same teams, new words",
    settings: "Settings",
    quit: "Quit",
    themeLabels: {
      simple: "Easy", objects: "Objects", animals: "Animals", famous: "Famous people", actions: "Actions",
      places: "Places", nature: "Nature & space", legends: "Myths & legends", expressions: "Idioms",
      movies: "Movies & TV", food: "Food & dishes", jobs: "Jobs", fun: "Funny", abstract: "Feelings & ideas",
      culture: "Pop culture", brands: "Brands & logos", adult: "18+",
      sports: "Sports", body: "Human body", countries: "Countries & cities", characters: "Characters",
      manga: "Manga & anime", music: "Music", y2k: "The 2000s", internet: "Internet & social",
      party: "Party", school: "School", holidays: "Holidays", doctor: "At the doctor's",
    },
  },
  es: {
    title: "Haz que Adivinen",
    tagline: "¡Describe, haz que adivinen y suma puntos!",
    rules: [
      "Formad equipos de 2.",
      "Uno sujeta el móvil y describe la palabra sin decirla.",
      "El otro adivina, sin ver la pantalla.",
      "Acertada = 1 punto. ¿Atascado? Pasa a la siguiente.",
    ],
    howTo: "Cómo se juega",
    howTo1: ["Mínimo ", "4 jugadores", ": 2 equipos de 2, un solo móvil."],
    howTo2: ["Quien describe ", "sujeta el móvil", " y explica la palabra sin decirla."],
    howTo3: ["Su compañero adivina, ", "sin ver la pantalla", "."],
    howTo4: [" acertada, ", " pasar, ", " deshacer un error."],
    teamName: (n) => `Equipo ${n}`,
    teamNamePh: "Nombre del equipo",
    teamNameAria: (n) => `Nombre del equipo ${n}`,
    removeTeam: "Quitar equipo",
    playerPh: (n) => `Jugador ${n}`,
    playerAria: (p, team) => `Jugador ${p}, equipo ${team}`,
    teams: "Los equipos",
    addTeam: "Añadir un equipo",
    themes: "Los temas",
    words: (n) => `${n} palabra${n === 1 ? "" : "s"}`,
    clearAll: "Quitar todo",
    mixAll: "Mezclar todo",
    pickOne: "Elige al menos un tema.",
    optInNote: "«Marcas y logos» y «18+» no están incluidos por defecto.",
    freeNote: (n) => `${n} palabras gratis que van rotando. Los ${THEME_COUNT} temas están en Zinzin+.`,
    lockedTheme: (name) => `${name}: disponible con Zinzin+`,
    timer: "Tiempo por turno",
    timerChip: (d) => (d === 120 ? "2 min" : `${d} s`),
    rounds: "Número de rondas",
    start: "Empezar la partida",
    fillNames: "Rellena todos los nombres: mínimo 2 equipos de 2 jugadores.",
    roundTurn: (r, t, s) => `Ronda ${r}/${t} · turno ${s}/2`,
    describer: "Describe y sujeta el móvil",
    guesser: "Adivina, sin mirar la pantalla",
    passPhone: (d, g) => `Pásale el móvil a ${d}. ¡${g} no puede ver la pantalla!`,
    letsGo: "¡Vamos!",
    points: (n) => `${n} pt${n === 1 ? "" : "s"}`,
    noMoreWords: "¡No quedan palabras!",
    reroll: "¿Palabra mala? Cambiarla",
    undo: "Deshacer la última",
    got: "Acertada",
    skip: "Pasar",
    timeUp: "¡Se acabó el tiempo!",
    wordsFound: (n) => (n === 1 ? "palabra acertada" : "palabras acertadas"),
    noWords: "Ninguna palabra… ¡a la próxima!",
    nextTeam: "Siguiente equipo",
    nextTurn: "Siguiente turno",
    seeRecap: "Ver el resumen",
    finalResults: "Resultados finales",
    endOfRound: (n) => `Fin de la ronda ${n}`,
    ranking: "Clasificación",
    round: (n) => `Ronda ${n}`,
    gameOver: "Fin de la partida",
    tie: "¡Empate!",
    wins: (name) => `¡Gana ${name}!`,
    ordinal: (n) => `${n}.º`,
    rematch: "Revancha",
    rematchHint: "Mismos equipos, palabras nuevas",
    settings: "Ajustes",
    quit: "Salir",
    themeLabels: {
      simple: "Fácil", objects: "Objetos", animals: "Animales", famous: "Famosos", actions: "Acciones",
      places: "Lugares", nature: "Naturaleza y espacio", legends: "Cuentos y leyendas", expressions: "Expresiones",
      movies: "Pelis y series", food: "Comida y platos", jobs: "Profesiones", fun: "Divertido", abstract: "Emociones e ideas",
      culture: "Cultura pop", brands: "Marcas y logos", adult: "18+",
      sports: "Deportes", body: "Cuerpo humano", countries: "Países y ciudades", characters: "Personajes",
      manga: "Manga y anime", music: "Música", y2k: "Los 2000", internet: "Internet y redes",
      party: "Fiesta", school: "Escuela", holidays: "Vacaciones", doctor: "En el médico",
    },
  },
};
