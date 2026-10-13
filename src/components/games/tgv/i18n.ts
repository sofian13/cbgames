/**
 * Le Train Fou : textes de l'interface et gages, en FR / EN / ES.
 * Sur le site web, getLang() vaut toujours "fr" : rien ne change.
 */

import type { I18n } from "@/lib/i18n";

/** Lettres des figures dans les coins (Valet/Dame/Roi/As) selon l'usage du pays. */
export const RANK_LABEL: I18n<Record<string, string>> = {
  fr: { V: "V", D: "D", R: "R", A: "A" },
  en: { V: "J", D: "Q", R: "K", A: "A" },
  // Baraja francesa en Espagne : J (jota), Q (reina), K (rey)
  es: { V: "J", D: "Q", R: "K", A: "A" },
};

export const RANK_NAME: I18n<Record<string, string>> = {
  fr: { V: "Valet", D: "Dame", R: "Roi", A: "As" },
  en: { V: "Jack", D: "Queen", R: "King", A: "Ace" },
  es: { V: "Jota", D: "Reina", R: "Rey", A: "As" },
};

/** Gages (jamais d'alcool imposé). Même nombre minimum dans chaque langue. */
export const GAGES: I18n<string[]> = {
  fr: [
    "Imite un animal choisi par la table",
    "Parle avec un accent jusqu'à ton prochain tour",
    "Fais 10 squats",
    "Fais un compliment à chaque joueur",
    "Chante un refrain choisi par la table",
    "Garde une grimace pendant un tour complet",
    "Danse 10 secondes sans musique",
    "Raconte ta pire honte en 20 secondes",
    "Parle à la 3e personne jusqu'à ton prochain tour",
    "Fais le présentateur météo de la soirée",
    "Tiens la planche 20 secondes",
    "Mime ton métier de rêve",
    "Fais un beatbox de 10 secondes",
    "Laisse la table choisir ton fond d'écran pour la soirée",
    "Fais une déclaration d'amour à un objet",
  ],
  en: [
    "Impersonate an animal picked by the group",
    "Talk in an accent until your next turn",
    "Do 10 squats",
    "Give every player a compliment",
    "Sing a chorus picked by the group",
    "Pull a face for one full round",
    "Dance for 10 seconds with no music",
    "Tell your most embarrassing story in 20 seconds",
    "Talk about yourself in the third person until your next turn",
    "Do tonight's weather forecast like a TV presenter",
    "Hold a plank for 20 seconds",
    "Act out your dream job, no words",
    "Beatbox for 10 seconds",
    "Let the group pick your phone wallpaper for the night",
    "Make a heartfelt love confession to an object",
  ],
  es: [
    "Imita a un animal que elija el grupo",
    "Habla con acento hasta tu próximo turno",
    "Haz 10 sentadillas",
    "Hazle un cumplido a cada jugador",
    "Canta un estribillo que elija el grupo",
    "Pon una mueca durante una ronda entera",
    "Baila 10 segundos sin música",
    "Cuenta tu momento más vergonzoso en 20 segundos",
    "Habla de ti en tercera persona hasta tu próximo turno",
    "Da el parte del tiempo de esta noche como en la tele",
    "Aguanta 20 segundos haciendo la plancha",
    "Representa con mímica el trabajo de tus sueños",
    "Haz beatbox durante 10 segundos",
    "Deja que el grupo elija tu fondo de pantalla para esta noche",
    "Declárale tu amor a un objeto",
  ],
};

interface TgvStrings {
  gameName: string;
  muteOn: string;
  muteOff: string;
  step1: string;
  step2: string;
  step3: string;
  titleTop: string;
  titleBottom: string;
  wagons: string;
  pileLabel: (n: number) => string;
  penalty: string;
  mix: string;
  sips: string;
  gages: string;
  sipNote: string;
  launch: string;
  editPlayers: string;
  passHint: (n: number) => string;
  board: string;
  lastWagon: string;
  wagonOf: (i: number, n: number) => string;
  atStake: (n: number) => string;
  lastCard: string;
  nextWill: string;
  higher: string;
  equal: string;
  lower: string;
  nice: string;
  arrive: string;
  nextWagon: string;
  tie: string;
  miss: string;
  tieNote: string;
  missNote: string;
  endGame: string;
  arrived: string;
  winNote: string;
  turnOf: (name: string) => string;
  terminus: string;
  summary: string;
  bestDriver: string;
  penalties: (n: number) => string;
  replay: string;
  settings: string;
  home: string;
  penaltyFor: string;
  sipsN: (n: number) => string;
  orDare: (g: string) => string;
  orSips: (n: number) => string;
  reroll: string;
  done: string;
}

export const STR: I18n<TgvStrings> = {
  fr: {
    gameName: "Le Train Fou",
    muteOn: "Activer le son",
    muteOff: "Couper le son",
    step1: "Une carte est retournée : la suivante sera plus haute, plus basse ou égale ?",
    step2: "Enchaîne tous les wagons sans te tromper pour arriver en gare.",
    step3: "Raté = une peine et retour au wagon 1. Plus tu tombes loin, plus elle grimpe (3 gorgées max, ou un gage).",
    titleTop: "Le Train",
    titleBottom: "Fou",
    wagons: "Les wagons",
    pileLabel: (n) => (n === 3 ? "express" : n === 4 ? "classique" : n === 5 ? "long" : "marathon"),
    penalty: "La peine",
    mix: "Mixte",
    sips: "Gorgées",
    gages: "Gages",
    sipNote: "Une gorgée, c'est de ce que tu bois, eau et soft compris. On peut toujours prendre un gage à la place. 18+, avec modération, et jamais si tu conduis.",
    launch: "Lancer le train",
    editPlayers: "Modifier les joueurs",
    passHint: (n) => `À toi de monter dans le Train Fou : ${n} wagons à enchaîner sans erreur.`,
    board: "Embarquer",
    lastWagon: "Dernier wagon !",
    wagonOf: (i, n) => `Wagon ${i} sur ${n}`,
    atStake: (n) => `en jeu : ${n} gorgée${n > 1 ? "s" : ""} ou un gage`,
    lastCard: "Dernière carte…",
    nextWill: "La prochaine carte sera…",
    higher: "Plus haute",
    equal: "Égale",
    lower: "Plus basse",
    nice: "Bien vu !",
    arrive: "Arriver en gare",
    nextWagon: "Wagon suivant",
    tie: "Égalité !",
    miss: "Raté !",
    tieNote: "Petite peine, mais tu restes sur ce wagon.",
    missNote: "Retour au wagon 1… après la peine.",
    endGame: "Terminer la partie",
    arrived: "Arrivé en gare !",
    winNote: "Tous les wagons d'un coup ! Tu distribues 2 gorgées (ou un gage) à qui tu veux.",
    turnOf: (name) => `Au tour de ${name}`,
    terminus: "Terminus !",
    summary: "Le bilan du voyage : le moins de peines gagne.",
    bestDriver: "Meilleur conducteur",
    penalties: (n) => `${n} peine${n > 1 ? "s" : ""}`,
    replay: "Rejouer",
    settings: "Réglages",
    home: "Accueil",
    penaltyFor: "Une peine pour",
    sipsN: (n) => `${n} gorgée${n > 1 ? "s" : ""}`,
    orDare: (g) => `Ou le gage, au choix : « ${g} »`,
    orSips: (n) => `Ou ${n} gorgée${n > 1 ? "s" : ""} de zinzin, au choix.`,
    reroll: "Pas fou ? Un autre gage",
    done: "C'est fait",
  },
  en: {
    gameName: "The Crazy Train",
    muteOn: "Turn sound on",
    muteOff: "Mute",
    step1: "A card is flipped: will the next one be higher, lower or equal?",
    step2: "Clear every carriage without a single mistake to reach the station.",
    step3: "Wrong = a penalty and back to carriage 1. The further you fall, the bigger it gets (3 sips max, or a dare).",
    titleTop: "The Crazy",
    titleBottom: "Train",
    wagons: "Carriages",
    pileLabel: (n) => (n === 3 ? "express" : n === 4 ? "classic" : n === 5 ? "long" : "marathon"),
    penalty: "Penalty",
    mix: "Mixed",
    sips: "Sips",
    gages: "Dares",
    sipNote: "A sip is of whatever you're drinking, water and soft drinks included. You can always take a dare instead. 18+, drink responsibly, and never if you're driving.",
    launch: "Start the train",
    editPlayers: "Edit players",
    passHint: (n) => `Your turn to board the Crazy Train: ${n} carriages to clear without a mistake.`,
    board: "All aboard",
    lastWagon: "Last carriage!",
    wagonOf: (i, n) => `Carriage ${i} of ${n}`,
    atStake: (n) => `at stake: ${n} sip${n > 1 ? "s" : ""} or a dare`,
    lastCard: "Last card…",
    nextWill: "The next card will be…",
    higher: "Higher",
    equal: "Equal",
    lower: "Lower",
    nice: "Nailed it!",
    arrive: "Pull into the station",
    nextWagon: "Next carriage",
    tie: "It's a tie!",
    miss: "Wrong!",
    tieNote: "Small penalty, but you stay on this carriage.",
    missNote: "Back to carriage 1… after the penalty.",
    endGame: "End the game",
    arrived: "Station reached!",
    winNote: "Every carriage in one go! Hand out 2 sips (or a dare) to whoever you like.",
    turnOf: (name) => `${name}'s turn`,
    terminus: "End of the line!",
    summary: "Trip report: fewest penalties wins.",
    bestDriver: "Best driver",
    penalties: (n) => `${n} penalt${n === 1 ? "y" : "ies"}`,
    replay: "Play again",
    settings: "Settings",
    home: "Home",
    penaltyFor: "A penalty for",
    sipsN: (n) => `${n} zinzin sip${n > 1 ? "s" : ""}`,
    orDare: (g) => `Or the dare, your call: “${g}”`,
    orSips: (n) => `Or ${n} zinzin sip${n > 1 ? "s" : ""}, your call.`,
    reroll: "Meh? Another dare",
    done: "Done",
  },
  es: {
    gameName: "El Tren Loco",
    muteOn: "Activar el sonido",
    muteOff: "Silenciar",
    step1: "Se gira una carta: ¿la siguiente será más alta, más baja o igual?",
    step2: "Supera todos los vagones sin fallar para llegar a la estación.",
    step3: "Fallo = un castigo y vuelta al vagón 1. Cuanto más lejos caigas, más sube (3 tragos máx., o un reto).",
    titleTop: "El Tren",
    titleBottom: "Loco",
    wagons: "Los vagones",
    pileLabel: (n) => (n === 3 ? "exprés" : n === 4 ? "clásico" : n === 5 ? "largo" : "maratón"),
    penalty: "El castigo",
    mix: "Mixto",
    sips: "Tragos",
    gages: "Retos",
    sipNote: "Un trago es de lo que estés bebiendo, agua y refrescos incluidos. Siempre puedes elegir un reto en su lugar. +18, con moderación, y nunca si conduces.",
    launch: "Arrancar el tren",
    editPlayers: "Cambiar jugadores",
    passHint: (n) => `Te toca subir al Tren Loco: ${n} vagones seguidos sin fallar.`,
    board: "¡Al tren!",
    lastWagon: "¡Último vagón!",
    wagonOf: (i, n) => `Vagón ${i} de ${n}`,
    atStake: (n) => `en juego: ${n} trago${n > 1 ? "s" : ""} o un reto`,
    lastCard: "Última carta…",
    nextWill: "La siguiente carta será…",
    higher: "Más alta",
    equal: "Igual",
    lower: "Más baja",
    nice: "¡Bien visto!",
    arrive: "Llegar a la estación",
    nextWagon: "Siguiente vagón",
    tie: "¡Empate!",
    miss: "¡Fallo!",
    tieNote: "Castigo pequeño, pero sigues en este vagón.",
    missNote: "Vuelta al vagón 1… después del castigo.",
    endGame: "Terminar la partida",
    arrived: "¡Llegada a la estación!",
    winNote: "¡Todos los vagones de una! Repartes 2 tragos (o un reto) a quien quieras.",
    turnOf: (name) => `Turno de ${name}`,
    terminus: "¡Final de trayecto!",
    summary: "Balance del viaje: gana quien tenga menos castigos.",
    bestDriver: "Mejor maquinista",
    penalties: (n) => `${n} castigo${n === 1 ? "" : "s"}`,
    replay: "Volver a jugar",
    settings: "Ajustes",
    home: "Inicio",
    penaltyFor: "Un castigo para",
    sipsN: (n) => `${n} trago${n > 1 ? "s" : ""} de zinzin`,
    orDare: (g) => `O el reto, tú eliges: «${g}»`,
    orSips: (n) => `O ${n} trago${n > 1 ? "s" : ""} de zinzin, tú eliges.`,
    reroll: "¿No mola? Otro reto",
    done: "Hecho",
  },
};
