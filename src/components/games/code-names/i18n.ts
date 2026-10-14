/**
 * Mots Espions (mode un seul téléphone) : textes de l'interface en FR / EN / ES.
 * Sur le site web, getLang() vaut toujours "fr" : rien ne change.
 */

import type { I18n } from "@/lib/i18n";

type TeamText = {
  /** Étiquette courte (pastille, compteur) */
  short: string;
  /** « l'équipe rouge » (dans une phrase) */
  the: string;
  /** « L'équipe rouge » (début de phrase) */
  The: string;
  /** Couleur des cartes (« rouge ») */
  color: string;
};

const fr = {
  title: "Mots Espions",
  muteOn: "Activer le son",
  muteOff: "Couper le son",
  close: "Fermer",
  back: "Retour",
  team: {
    red: { short: "Rouges", the: "l'équipe rouge", The: "L'équipe rouge", color: "rouge" },
    blue: { short: "Bleus", the: "l'équipe bleue", The: "L'équipe bleue", color: "bleue" },
  } as Record<"red" | "blue", TeamText>,

  // Équipes
  teamsTitle: "Faites 2 équipes",
  teamsSub: "Touche un joueur pour le changer d'équipe.",
  shuffle: "Mélanger",
  needTwo: (the: string) => `Il faut au moins 2 joueurs dans ${the}.`,
  whoStarts: "Qui commence ?",
  random: "Hasard",
  timerTitle: "Chrono pour chercher",
  timerHint: "Il ne tourne que quand l'équipe touche les cartes.",
  noTimer: "Sans",
  secs: (n: number) => `${n} s`,
  toChiefs: "Choisir les chefs",

  // Choix du chef
  chiefQ: (the: string) => `Qui est le chef de ${the} ?`,
  chiefRole: "Le chef voit la carte secrète et donne les indices. Les autres devinent.",
  chiefPick: "Touche son perso",
  chiefOk: (name: string) => `C'est ${name} !`,

  // Étape secrète
  onlyChiefs: "Seuls les chefs regardent !",
  gateBoth: (a: string, b: string) => `${a} et ${b}, prenez le tél. Les autres : fermez les yeux !`,
  gateOne: (name: string) => `${name}, prends le tél. Les autres : fermez les yeux !`,
  weAreChiefs: "On est les chefs",
  itsMe: (name: string) => `C'est moi, ${name}`,
  keyTitle: "La carte secrète",
  keyIntro: "Elle dit à qui est chaque mot.",
  legendTeam: (n: number, team: "red" | "blue") => `${n} mots ${team === "red" ? "rouges" : "bleus"}`,
  legendNeutral: "7 neutres : à personne",
  legendBomb: "La bombe : perdu direct !",
  holdToSee: "Maintiens le bouton pour voir",
  holdBtn: "Maintenir pour voir",
  releaseHide: "Relâche pour cacher",
  alreadyFound: "déjà trouvé",
  rerollGrid: "Pas fou ? Une autre grille",
  newGrid: "Nouvelle grille ! Regardez la nouvelle carte",
  keyDone: "C'est bon, on cache",
  keyBack: "C'est bon, je cache",

  // Passage de tour
  turnOf: (the: string) => `Au tour de ${the} !`,
  chiefIs: (name: string) => `Chef : ${name}`,
  firstTurn: (n: number, m: number) => `Vous commencez : ${n} mots à trouver. L'autre équipe en a ${m}.`,
  passHint: (name: string) => `${name}, prends le tél : regarde la carte si besoin, puis donne ton indice.`,
  go: "C'est parti !",

  // Tour : indice
  turnBanner: (short: string) => `Tour des ${short}`,
  clueHint: (name: string) => `${name} (chef) : UN mot qui relie plusieurs de tes cartes + un nombre.`,
  seeKey: "Voir la carte",
  giveClue: "Donner l'indice",
  clueTitle: (name: string) => `L'indice de ${name}`,
  clueSub: "UN seul mot + un nombre : le nombre de cartes de ton équipe qui vont avec.",
  cluePlaceholder: "Un mot (ex. : plage)",
  clueAria: "Mot de l'indice",
  howMany: "Combien de cartes vont avec ?",
  countHelp: (n: number) => `Ton équipe pourra toucher jusqu'à ${n + 1} cartes.`,
  countHelpFree: "Sans limite : ton équipe touche autant de cartes qu'elle veut.",
  countAria: (n: string) => (n === "∞" ? "Sans limite" : `${n} carte${n === "0" || n === "1" ? "" : "s"}`),
  errOneWord: "Un seul mot, sans espace.",
  errGridWord: "Interdit : ce mot est dans la grille.",
  errNeedWord: "Écris ton mot-indice.",
  errNeedCount: "Choisis un nombre.",
  announce: "Annoncer l'indice",
  cancel: "Annuler",

  // Annonce
  chiefSays: (name: string) => `${name} dit :`,
  shutUp: (name: string) => `${name} se tait !`,
  othersTap: (the: string) => `Les autres de ${the} touchent les cartes.`,
  triesMax: (n: number) => `${n} essai${n > 1 ? "s" : ""} max`,
  triesFree: "Essais illimités",
  letsGo: "On y va !",

  // Tour : on devine
  guessHint: (name: string) => `${name} se tait ! Touchez une carte, puis « Valider ».`,
  triesLeft: (n: number) => (n <= 0 ? "Plus d'essais" : `Encore ${n} essai${n > 1 ? "s" : ""}`),
  triesInf: "Essais : ∞",
  stop: "On arrête",
  validate: (w: string) => `Valider « ${w} »`,
  noClue: "En attente de l'indice",
  waitClue: "Attendez l'indice du chef !",

  // Verdicts
  vOwn: (color: string) => `Carte ${color} : bien vu !`,
  vOwnMore: (n: number) => `Continuez : encore ${n} essai${n > 1 ? "s" : ""}.`,
  vOwnFree: "Continuez… ou arrêtez-vous.",
  vOwnLast: "Plus d'essais : fin du tour.",
  vNeutral: "Carte neutre",
  vNeutralSub: "Elle n'est à personne : fin du tour.",
  vEnemy: (color: string) => `Carte ${color} !`,
  vEnemySub: (short: string) => `Un mot de moins à trouver pour les ${short}. Fin du tour.`,
  vTime: "Temps écoulé !",
  vTimeSub: "Fin du tour.",
  vStop: "On s'arrête là",
  vStopSub: "Au tour de l'autre équipe.",

  boom: "Boum !",
  bombHitBy: (The: string) => `${The} a touché la bombe`,

  // Fin
  gameOver: "Partie finie",
  wins: (The: string) => `${The} gagne !`,
  reasonWords: "Tous ses mots sont trouvés.",
  reasonGift: (The: string, team: "red" | "blue") => `${The} a touché par erreur le dernier mot ${team === "red" ? "rouge" : "bleu"}.`,
  reasonBomb: (The: string) => `${The} a touché la bombe.`,
  wholeGrid: "Toute la grille",
  replay: "Rejouer",
  changeTeams: "Changer les équipes",
  quit: "Quitter",
  counterAria: (team: string, n: number) => `${team} : ${n} mot${n > 1 ? "s" : ""} à trouver`,
  timeLeft: "Temps restant",

  // Règles
  rulesItems: [
    "Faites 2 équipes (rouge et bleue). Chaque équipe choisit son chef.",
    "Seuls les chefs regardent la carte secrète : elle dit quels mots sont rouges, bleus, neutres (à personne)… et où est la bombe.",
    "À son tour, le chef donne UN seul mot + un nombre (ex. « Plage, 2 ») : le nombre, c'est combien de cartes de son équipe vont avec. Interdit de dire un mot de la grille ou de mimer.",
    "Puis le chef se tait ! Les autres de l'équipe touchent une carte, puis « Valider ». Ils ont droit au nombre + 1 essais (sans limite avec 0 ou ∞).",
    "Carte de ton équipe : on continue. Carte neutre ou de l'autre équipe : fin du tour. Vous pouvez aussi arrêter avec « On arrête ».",
    "La bombe : défaite immédiate !",
    "La première équipe qui trouve tous ses mots gagne. L'équipe qui commence en a 9, l'autre 8.",
  ],

  // Tuto
  tuto: [
    { title: "Deux équipes, deux chefs", text: "Faites 2 équipes avec un chef chacune. Le but : trouver tous les mots de ton équipe avant l'autre." },
    { title: "Seul le chef voit", text: "Les autres ferment les yeux. Les chefs regardent la carte secrète : la couleur de chaque mot." },
    { title: "Un mot + un nombre", text: "Léa dit « Espace, 2 » : un mot qui relie 2 mots rouges, Lune et Fusée. Puis elle se tait." },
    { title: "Touche… gare à la bombe", text: "Malik touche Lune : rouge, on continue ! Neutre ou bleu : tour fini. La bombe : perdu direct." },
  ],
  tutoArt: { moon: "LUNE", rocket: "FUSÉE", star: "ÉTOILE", beach: "PLAGE", clue: "ESPACE, 2", chief: "CHEF", neutral: "neutre", bomb: "BOMBE", lost: "PERDU", blues: "Bleus !", two: "2 = combien de mots" },
};

type CnStrings = typeof fr;

const en: CnStrings = {
  title: "Spy Words",
  muteOn: "Turn sound on",
  muteOff: "Mute",
  close: "Close",
  back: "Back",
  team: {
    red: { short: "Red", the: "the red team", The: "The red team", color: "red" },
    blue: { short: "Blue", the: "the blue team", The: "The blue team", color: "blue" },
  },

  teamsTitle: "Make 2 teams",
  teamsSub: "Tap a player to switch their team.",
  shuffle: "Shuffle",
  needTwo: (the) => `You need at least 2 players in ${the}.`,
  whoStarts: "Who starts?",
  random: "Random",
  timerTitle: "Timer for guessing",
  timerHint: "It only runs while the team is tapping cards.",
  noTimer: "None",
  secs: (n) => `${n} s`,
  toChiefs: "Pick the captains",

  chiefQ: (the) => `Who's the captain of ${the}?`,
  chiefRole: "The captain sees the secret key and gives the clues. The others guess.",
  chiefPick: "Tap their character",
  chiefOk: (name) => `It's ${name}!`,

  onlyChiefs: "Captains only!",
  gateBoth: (a, b) => `${a} and ${b}, take the phone. Everyone else: close your eyes!`,
  gateOne: (name) => `${name}, take the phone. Everyone else: close your eyes!`,
  weAreChiefs: "We're the captains",
  itsMe: (name) => `It's me, ${name}`,
  keyTitle: "The secret key",
  keyIntro: "It shows who each word belongs to.",
  legendTeam: (n, team) => `${n} ${team} words`,
  legendNeutral: "7 neutral: nobody's",
  legendBomb: "The bomb: instant loss!",
  holdToSee: "Hold the button to see",
  holdBtn: "Hold to see",
  releaseHide: "Let go to hide",
  alreadyFound: "already found",
  rerollGrid: "Meh? Another grid",
  newGrid: "New grid! Check the new key",
  keyDone: "Done, hide it",
  keyBack: "Done, hide it",

  turnOf: (the) => `${the.charAt(0).toUpperCase()}${the.slice(1)}'s turn!`,
  chiefIs: (name) => `Captain: ${name}`,
  firstTurn: (n, m) => `You go first: ${n} words to find. The other team has ${m}.`,
  passHint: (name) => `${name}, take the phone: check the key if needed, then give your clue.`,
  go: "Let's go!",

  turnBanner: (short) => `${short} team's turn`,
  clueHint: (name) => `${name} (captain): ONE word linking several of your cards + a number.`,
  seeKey: "See the key",
  giveClue: "Give the clue",
  clueTitle: (name) => `${name}'s clue`,
  clueSub: "ONE single word + a number: how many of your team's cards go with it.",
  cluePlaceholder: "One word (e.g. beach)",
  clueAria: "Clue word",
  howMany: "How many cards go with it?",
  countHelp: (n) => `Your team can tap up to ${n + 1} cards.`,
  countHelpFree: "No limit: your team taps as many cards as it wants.",
  countAria: (n) => (n === "∞" ? "No limit" : `${n} card${n === "1" ? "" : "s"}`),
  errOneWord: "Just one word, no spaces.",
  errGridWord: "Not allowed: that word is on the grid.",
  errNeedWord: "Type your clue word.",
  errNeedCount: "Pick a number.",
  announce: "Announce the clue",
  cancel: "Cancel",

  chiefSays: (name) => `${name} says:`,
  shutUp: (name) => `${name}, not a word now!`,
  othersTap: (the) => `The rest of ${the} taps the cards.`,
  triesMax: (n) => `${n} guess${n > 1 ? "es" : ""} max`,
  triesFree: "Unlimited guesses",
  letsGo: "Let's go!",

  guessHint: (name) => `${name} stays silent! Tap a card, then “Confirm”.`,
  triesLeft: (n) => (n <= 0 ? "No guesses left" : `${n} guess${n > 1 ? "es" : ""} left`),
  triesInf: "Guesses: ∞",
  stop: "We stop",
  validate: (w) => `Confirm “${w}”`,
  noClue: "Waiting for the clue",
  waitClue: "Wait for the captain's clue!",

  vOwn: (color) => `A ${color} card: nice one!`,
  vOwnMore: (n) => `Keep going: ${n} guess${n > 1 ? "es" : ""} left.`,
  vOwnFree: "Keep going… or stop there.",
  vOwnLast: "No guesses left: end of turn.",
  vNeutral: "Neutral card",
  vNeutralSub: "It's nobody's: end of turn.",
  vEnemy: (color) => `A ${color} card!`,
  vEnemySub: (short) => `One less word for the ${short} team to find. End of turn.`,
  vTime: "Time's up!",
  vTimeSub: "End of turn.",
  vStop: "We stop here",
  vStopSub: "Over to the other team.",

  boom: "Boom!",
  bombHitBy: (The) => `${The} hit the bomb`,

  gameOver: "Game over",
  wins: (The) => `${The} wins!`,
  reasonWords: "All its words were found.",
  reasonGift: (The, team) => `${The} tapped the last ${team} word by mistake.`,
  reasonBomb: (The) => `${The} hit the bomb.`,
  wholeGrid: "The whole grid",
  replay: "Play again",
  changeTeams: "Change teams",
  quit: "Quit",
  counterAria: (team, n) => `${team}: ${n} word${n > 1 ? "s" : ""} to find`,
  timeLeft: "Time left",

  rulesItems: [
    "Make 2 teams (red and blue). Each team picks its captain.",
    "Only the captains look at the secret key: it shows which words are red, blue, neutral (nobody's)… and where the bomb is.",
    "On their turn, the captain gives ONE single word + a number (e.g. “Beach, 2”): the number is how many of their team's cards go with it. No saying a word from the grid, no miming.",
    "Then the captain stays silent! The rest of the team taps a card, then “Confirm”. They get the number + 1 guesses (no limit with 0 or ∞).",
    "Your team's card: keep going. Neutral or other team's card: end of turn. You can also stop with “We stop”.",
    "The bomb: instant defeat!",
    "The first team to find all its words wins. The team that starts has 9, the other 8.",
  ],

  tuto: [
    { title: "Two teams, two captains", text: "Make 2 teams, each with a captain. Goal: find all your team's words before the other team." },
    { title: "Only captains see", text: "Everyone else closes their eyes. The captains look at the secret key: each word's colour." },
    { title: "One word + a number", text: "Léa says “Space, 2”: one word linking 2 red words, Moon and Rocket. Then she stays silent." },
    { title: "Tap… mind the bomb", text: "Malik taps Moon: red, keep going! Neutral or blue: turn over. The bomb: you lose instantly." },
  ],
  tutoArt: { moon: "MOON", rocket: "ROCKET", star: "STAR", beach: "BEACH", clue: "SPACE, 2", chief: "CAPTAIN", neutral: "neutral", bomb: "BOMB", lost: "LOST", blues: "Blue!", two: "2 = how many words" },
};

const es: CnStrings = {
  title: "Palabras Espía",
  muteOn: "Activar el sonido",
  muteOff: "Silenciar",
  close: "Cerrar",
  back: "Volver",
  team: {
    red: { short: "Rojos", the: "el equipo rojo", The: "El equipo rojo", color: "roja" },
    blue: { short: "Azules", the: "el equipo azul", The: "El equipo azul", color: "azul" },
  },

  teamsTitle: "Haced 2 equipos",
  teamsSub: "Toca a un jugador para cambiarlo de equipo.",
  shuffle: "Mezclar",
  needTwo: (the) => `Hacen falta al menos 2 jugadores en ${the}.`,
  whoStarts: "¿Quién empieza?",
  random: "Al azar",
  timerTitle: "Tiempo para adivinar",
  timerHint: "Solo corre mientras el equipo toca las cartas.",
  noTimer: "Sin",
  secs: (n) => `${n} s`,
  toChiefs: "Elegir a los jefes",

  chiefQ: (the) => `¿Quién es el jefe ${the.replace(/^el /, "del ")}?`,
  chiefRole: "El jefe ve el mapa secreto y da las pistas. Los demás adivinan.",
  chiefPick: "Toca su personaje",
  chiefOk: (name) => `¡Es ${name}!`,

  onlyChiefs: "¡Solo miran los jefes!",
  gateBoth: (a, b) => `${a} y ${b}, coged el móvil. Los demás: ¡cerrad los ojos!`,
  gateOne: (name) => `${name}, coge el móvil. Los demás: ¡cerrad los ojos!`,
  weAreChiefs: "Somos los jefes",
  itsMe: (name) => `Soy yo, ${name}`,
  keyTitle: "El mapa secreto",
  keyIntro: "Dice de quién es cada palabra.",
  legendTeam: (n, team) => `${n} palabras ${team === "red" ? "rojas" : "azules"}`,
  legendNeutral: "7 neutrales: de nadie",
  legendBomb: "La bomba: ¡derrota directa!",
  holdToSee: "Mantén el botón pulsado para ver",
  holdBtn: "Mantén para ver",
  releaseHide: "Suelta para ocultar",
  alreadyFound: "ya encontrada",
  rerollGrid: "¿No mola? Otro tablero",
  newGrid: "¡Tablero nuevo! Mirad el nuevo mapa",
  keyDone: "Listo, lo tapamos",
  keyBack: "Listo, lo tapo",

  turnOf: (the) => `¡Le toca ${the.replace(/^el /, "al ")}!`,
  chiefIs: (name) => `Jefe: ${name}`,
  firstTurn: (n, m) => `Empezáis vosotros: ${n} palabras por encontrar. El otro equipo tiene ${m}.`,
  passHint: (name) => `${name}, coge el móvil: mira el mapa si hace falta y da tu pista.`,
  go: "¡Vamos!",

  turnBanner: (short) => `Turno de los ${short}`,
  clueHint: (name) => `${name} (jefe): UNA palabra que una varias de tus cartas + un número.`,
  seeKey: "Ver mapa",
  giveClue: "Dar la pista",
  clueTitle: (name) => `La pista de ${name}`,
  clueSub: "UNA sola palabra + un número: cuántas cartas de tu equipo van con ella.",
  cluePlaceholder: "Una palabra (p. ej.: playa)",
  clueAria: "Palabra de la pista",
  howMany: "¿Cuántas cartas van con ella?",
  countHelp: (n) => `Tu equipo podrá tocar hasta ${n + 1} cartas.`,
  countHelpFree: "Sin límite: tu equipo toca todas las cartas que quiera.",
  countAria: (n) => (n === "∞" ? "Sin límite" : `${n} carta${n === "1" ? "" : "s"}`),
  errOneWord: "Una sola palabra, sin espacios.",
  errGridWord: "Prohibido: esa palabra está en el tablero.",
  errNeedWord: "Escribe tu palabra pista.",
  errNeedCount: "Elige un número.",
  announce: "Anunciar la pista",
  cancel: "Cancelar",

  chiefSays: (name) => `${name} dice:`,
  shutUp: (name) => `¡${name}, ahora a callar!`,
  othersTap: (the) => `Los demás ${the.replace(/^el /, "del ")} tocan las cartas.`,
  triesMax: (n) => `${n} intento${n > 1 ? "s" : ""} máx.`,
  triesFree: "Intentos sin límite",
  letsGo: "¡Vamos!",

  guessHint: (name) => `¡${name} se calla! Tocad una carta y luego «Confirmar».`,
  triesLeft: (n) => (n <= 0 ? "Sin intentos" : `Queda${n > 1 ? "n" : ""} ${n} intento${n > 1 ? "s" : ""}`),
  triesInf: "Intentos: ∞",
  stop: "Paramos",
  validate: (w) => `Confirmar «${w}»`,
  noClue: "Esperando la pista",
  waitClue: "¡Esperad la pista del jefe!",

  vOwn: (color) => `Carta ${color}: ¡bien visto!`,
  vOwnMore: (n) => `Seguid: queda${n > 1 ? "n" : ""} ${n} intento${n > 1 ? "s" : ""}.`,
  vOwnFree: "Seguid… o paraos aquí.",
  vOwnLast: "No quedan intentos: fin del turno.",
  vNeutral: "Carta neutral",
  vNeutralSub: "No es de nadie: fin del turno.",
  vEnemy: (color) => `¡Carta ${color}!`,
  vEnemySub: (short) => `Una palabra menos para los ${short}. Fin del turno.`,
  vTime: "¡Se acabó el tiempo!",
  vTimeSub: "Fin del turno.",
  vStop: "Paramos aquí",
  vStopSub: "Le toca al otro equipo.",

  boom: "¡Bum!",
  bombHitBy: (The) => `${The} ha tocado la bomba`,

  gameOver: "Fin de la partida",
  wins: (The) => `¡${The} gana!`,
  reasonWords: "Ha encontrado todas sus palabras.",
  reasonGift: (The, team) => `${The} ha tocado por error la última palabra ${team === "red" ? "roja" : "azul"}.`,
  reasonBomb: (The) => `${The} ha tocado la bomba.`,
  wholeGrid: "Todo el tablero",
  replay: "Volver a jugar",
  changeTeams: "Cambiar equipos",
  quit: "Salir",
  counterAria: (team, n) => `${team}: ${n} palabra${n > 1 ? "s" : ""} por encontrar`,
  timeLeft: "Tiempo restante",

  rulesItems: [
    "Haced 2 equipos (rojo y azul). Cada equipo elige a su jefe.",
    "Solo los jefes miran el mapa secreto: dice qué palabras son rojas, azules, neutrales (de nadie)… y dónde está la bomba.",
    "En su turno, el jefe da UNA sola palabra + un número (p. ej. «Playa, 2»): el número es cuántas cartas de su equipo van con ella. Prohibido decir una palabra del tablero o hacer mímica.",
    "¡Luego el jefe se calla! Los demás del equipo tocan una carta y luego «Confirmar». Tienen el número + 1 intentos (sin límite con 0 o ∞).",
    "Carta de tu equipo: seguís. Carta neutral o del otro equipo: fin del turno. También podéis parar con «Paramos».",
    "La bomba: ¡derrota inmediata!",
    "Gana el primer equipo que encuentre todas sus palabras. El equipo que empieza tiene 9; el otro, 8.",
  ],

  tuto: [
    { title: "Dos equipos, dos jefes", text: "Haced 2 equipos, cada uno con un jefe. Objetivo: encontrar todas las palabras de tu equipo antes que el otro." },
    { title: "Solo el jefe ve", text: "Los demás cierran los ojos. Los jefes miran el mapa secreto: el color de cada palabra." },
    { title: "Una palabra + un número", text: "Léa dice «Espacio, 2»: una palabra que une 2 palabras rojas, Luna y Cohete. Luego se calla." },
    { title: "Toca… ¡ojo a la bomba!", text: "Malik toca Luna: ¡roja, seguimos! Neutral o azul: fin del turno. La bomba: derrota inmediata." },
  ],
  tutoArt: { moon: "LUNA", rocket: "COHETE", star: "ESTRELLA", beach: "PLAYA", clue: "ESPACIO, 2", chief: "JEFE", neutral: "neutral", bomb: "BOMBA", lost: "PERDIDO", blues: "¡Azules!", two: "2 = cuántas palabras" },
};

export const STR: I18n<CnStrings> = { fr, en, es };
