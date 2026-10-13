import type { I18n } from "@/lib/i18n";

/** Nombre décimal à la mode de la langue (virgule en FR/ES, point en EN). */
export const decimal = (x: number, digits: number, sep: string) => x.toFixed(digits).replace(".", sep);

// ── Feuille de règles + bouton son (partagés par les jeux « sticker ») ──
export const SHEET_STR: I18n<{ soundOn: string; soundOff: string; rules: string; rulesOf: (t: string) => string; howTo: string; gotIt: string }> = {
  fr: { soundOn: "Activer le son", soundOff: "Couper le son", rules: "Règles", rulesOf: (t) => `Règles : ${t}`, howTo: "Comment on joue à", gotIt: "Compris !" },
  en: { soundOn: "Turn sound on", soundOff: "Mute sound", rules: "Rules", rulesOf: (t) => `Rules: ${t}`, howTo: "How to play", gotIt: "Got it!" },
  es: { soundOn: "Activar el sonido", soundOff: "Silenciar", rules: "Reglas", rulesOf: (t) => `Reglas: ${t}`, howTo: "Cómo se juega a", gotIt: "¡Entendido!" },
};

// ── La Patate ──
interface PatateStr {
  name: string;
  rules: string[];
  /** Dernière règle en mode sans alcool / Soirée Chill (gages uniquement) */
  ruleNoSips: string;
  noticeDenied: string;
  noticeUnavailable: string;
  noticeNoSensor: string;
  beforeStart: string;
  order: string;
  loserTakes: string;
  dareTitle: string;
  dareSub: string;
  sipsTitle: string;
  sipsSub: string;
  modes: string;
  shakeTitle: string;
  shakeSub: string;
  spicyTitle: string;
  spicySub: string;
  go: string;
  round: (n: number) => string;
  takesPhone: string;
  readyHint: (next: string) => string;
  light: [string, string];
  endGame: string;
  gentle: string;
  holds: string;
  answered: string;
  passTo: (name: string) => string;
  boom: string;
  tooShaken: string;
  fuseLasted: (secs: string) => string;
  heldPotato: string;
  sips: (n: number) => string;
  orDare: string;
  yourDare: string;
  rerollDare: string;
  scoreTitle: string;
  nextRound: string;
  finish: string;
  roundsPlayed: (n: number) => string;
  nobody: string;
  goldWin: (n: number) => string;
  nobodyBlew: string;
  booms: (n: number) => string;
  replay: string;
  players: string;
  quit: string;
  dec: string;
}

export const PATATE_STR: I18n<PatateStr> = {
  fr: {
    name: "La Patate",
    rules: [
      "Asseyez-vous en cercle, dans l'ordre des prénoms.",
      "Une catégorie s'affiche : dis UNE réponse à voix haute.",
      "Tape « J'ai répondu » et passe le tél au voisin. Pas de répétition !",
      "La mèche est cachée et le tic‑tac accélère. BOUM = celui qui tient le tél a perdu.",
      "Le perdant fait un gage (ou 1 à 3 gorgées, eau OK).",
    ],
    ruleNoSips: "Le perdant fait un gage.",
    noticeDenied: "Capteur refusé : on joue en mode classique (la patate ne craint pas les secousses).",
    noticeUnavailable: "Capteur indisponible : mode classique.",
    noticeNoSensor: "Pas d'accéléromètre ici : mode classique.",
    beforeStart: "Avant de lancer",
    order: "La patate tourne dans l'ordre des prénoms : asseyez-vous en cercle dans cet ordre.",
    loserTakes: "Le perdant prend…",
    dareTitle: "Un gage",
    dareSub: "Que des gages, zéro gorgée",
    sipsTitle: "Gorgées ou gage",
    sipsSub: "1 à 3 gorgées de zinzin",
    modes: "Les modes",
    shakeTitle: "Ne la secoue pas !",
    shakeSub: "Trop secouée, elle explose plus tôt",
    spicyTitle: "Pack 18+",
    spicySub: "Catégories coquines, rien d'explicite",
    go: "C'est parti !",
    round: (n) => `Manche ${n}`,
    takesPhone: "prend le tél et commence",
    readyHint: (next) => `La catégorie s'affiche et la mèche s'allume : réponds, puis passe vite à ${next} !`,
    light: ["Allumer", "la mèche"],
    endGame: "Terminer la partie",
    gentle: "Doucement !!",
    holds: "l'a !",
    answered: "J'ai répondu",
    passTo: (name) => `Passe à ${name}`,
    boom: "BOUM !",
    tooShaken: "Trop secouée : elle a explosé !",
    fuseLasted: (s) => `La mèche a tenu ${s} s`,
    heldPotato: "tenait la patate !",
    sips: (n) => `${n} gorgée${n > 1 ? "s" : ""} de zinzin`,
    orDare: "ou le gage :",
    yourDare: "Ton gage",
    rerollDare: "Pas fou ? Un autre gage",
    scoreTitle: "Patates reçues",
    nextRound: "Manche suivante",
    finish: "Fin de la partie",
    roundsPlayed: (n) => `${n} manche${n > 1 ? "s" : ""} jouée${n > 1 ? "s" : ""}`,
    nobody: "Personne",
    goldWin: (n) => `remporte la Patate d'or avec ${n} explosion${n > 1 ? "s" : ""}`,
    nobodyBlew: "n'a explosé. Bizarre.",
    booms: (n) => `${n} boum${n > 1 ? "s" : ""}`,
    replay: "Rejouer",
    players: "Les joueurs",
    quit: "Quitter",
    dec: ",",
  },
  en: {
    name: "Hot Potato",
    rules: [
      "Sit in a circle, in the same order as the names.",
      "A category pops up: say ONE answer out loud.",
      "Tap “I answered” and pass the phone to your neighbour. No repeats!",
      "The fuse is hidden and the ticking speeds up. BOOM = whoever's holding the phone loses.",
      "The loser does a dare (or takes 1–3 sips, water's fine).",
    ],
    ruleNoSips: "The loser does a dare.",
    noticeDenied: "Motion sensor denied: classic mode it is (the potato doesn't mind a shake).",
    noticeUnavailable: "Motion sensor unavailable: classic mode.",
    noticeNoSensor: "No accelerometer here: classic mode.",
    beforeStart: "Before we start",
    order: "The potato goes round in the order of the names: sit in a circle in that order.",
    loserTakes: "The loser gets…",
    dareTitle: "A dare",
    dareSub: "Only dares, zero sips",
    sipsTitle: "Sips or a dare",
    sipsSub: "1 to 3 zinzin sips",
    modes: "Modes",
    shakeTitle: "Don't shake it!",
    shakeSub: "Shake it too hard and it blows up sooner",
    spicyTitle: "18+ pack",
    spicySub: "Cheeky categories, nothing explicit",
    go: "Let's go!",
    round: (n) => `Round ${n}`,
    takesPhone: "grabs the phone and starts",
    readyHint: (next) => `The category appears and the fuse is lit: answer, then pass to ${next}, fast!`,
    light: ["Light", "the fuse"],
    endGame: "End the game",
    gentle: "Easy!!",
    holds: "has it!",
    answered: "I answered",
    passTo: (name) => `Pass to ${name}`,
    boom: "BOOM!",
    tooShaken: "Shaken too hard: it blew up!",
    fuseLasted: (s) => `The fuse lasted ${s} s`,
    heldPotato: "was holding the potato!",
    sips: (n) => `${n} zinzin sip${n !== 1 ? "s" : ""}`,
    orDare: "or the dare:",
    yourDare: "Your dare",
    rerollDare: "Meh? Another dare",
    scoreTitle: "Potatoes caught",
    nextRound: "Next round",
    finish: "End of the game",
    roundsPlayed: (n) => `${n} round${n !== 1 ? "s" : ""} played`,
    nobody: "Nobody",
    goldWin: (n) => `wins the Golden Potato with ${n} explosion${n !== 1 ? "s" : ""}`,
    nobodyBlew: "blew up. Weird.",
    booms: (n) => `${n} boom${n !== 1 ? "s" : ""}`,
    replay: "Play again",
    players: "Players",
    quit: "Quit",
    dec: ".",
  },
  es: {
    name: "La Patata Caliente",
    rules: [
      "Sentaos en círculo, en el orden de los nombres.",
      "Aparece una categoría: di UNA respuesta en voz alta.",
      "Pulsa «¡Listo!» y pásale el móvil a quien tienes al lado. ¡Sin repetir!",
      "La mecha está oculta y el tictac se acelera. BUM = quien tiene el móvil pierde.",
      "Quien pierde hace un reto (o 1 a 3 tragos, vale agua).",
    ],
    ruleNoSips: "Quien pierde hace un reto.",
    noticeDenied: "Sensor denegado: jugamos en modo clásico (a la patata no le importan las sacudidas).",
    noticeUnavailable: "Sensor no disponible: modo clásico.",
    noticeNoSensor: "Aquí no hay acelerómetro: modo clásico.",
    beforeStart: "Antes de empezar",
    order: "La patata gira en el orden de los nombres: sentaos en círculo en ese orden.",
    loserTakes: "Quien pierde se lleva…",
    dareTitle: "Un reto",
    dareSub: "Solo retos, cero tragos",
    sipsTitle: "Tragos o reto",
    sipsSub: "1 a 3 tragos de zinzin",
    modes: "Los modos",
    shakeTitle: "¡No la agites!",
    shakeSub: "Si la agitas mucho, explota antes",
    spicyTitle: "Pack +18",
    spicySub: "Categorías pícaras, nada explícito",
    go: "¡Vamos!",
    round: (n) => `Ronda ${n}`,
    takesPhone: "coge el móvil y empieza",
    readyHint: (next) => `Sale la categoría y se enciende la mecha: responde y pásaselo rápido a ${next}.`,
    light: ["Encender", "la mecha"],
    endGame: "Terminar la partida",
    gentle: "¡¡Con cuidado!!",
    holds: "¡la tiene!",
    answered: "¡Listo!",
    passTo: (name) => `Pásaselo a ${name}`,
    boom: "¡BUM!",
    tooShaken: "Demasiado agitada: ¡ha explotado!",
    fuseLasted: (s) => `La mecha ha durado ${s} s`,
    heldPotato: "¡tenía la patata!",
    sips: (n) => `${n} trago${n !== 1 ? "s" : ""} de zinzin`,
    orDare: "o el reto:",
    yourDare: "Tu reto",
    rerollDare: "¿No mola? Otro reto",
    scoreTitle: "Patatas recibidas",
    nextRound: "Siguiente ronda",
    finish: "Fin de la partida",
    roundsPlayed: (n) => `${n} ronda${n !== 1 ? "s" : ""} jugada${n !== 1 ? "s" : ""}`,
    nobody: "Nadie",
    goldWin: (n) => `gana la Patata de Oro con ${n} explosi${n !== 1 ? "ones" : "ón"}`,
    nobodyBlew: "ha explotado. Qué raro.",
    booms: (n) => `${n} bum${n !== 1 ? "s" : ""}`,
    replay: "Volver a jugar",
    players: "Jugadores",
    quit: "Salir",
    dec: ",",
  },
};
