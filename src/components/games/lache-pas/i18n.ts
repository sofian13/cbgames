import type { I18n } from "@/lib/i18n";

interface LachePasStr {
  name: string;
  rules: string[];
  taunts: string[];
  intro: string;
  loserTakes: string;
  dareTitle: string;
  dareSub: string;
  sipsTitle: string;
  sipsSub: string;
  placeFingers: string;
  introHint: string;
  endTitle: string;
  rounds: (n: number) => string;
  burnt: (n: number) => string;
  cowards: (n: number) => string;
  replay: string;
  quit: string;
  boom: string;
  coward: string;
  setTo: (s: string) => string;
  allLetGo: (s: string) => string;
  caught: string;
  theseLost: string;
  thisLost: string;
  firstLost: string;
  sips: (n: number) => string;
  orDare: string;
  rerollDare: string;
  winner: (color: string) => string;
  finish: string;
  nextRound: string;
  lobby0: string;
  lobby1: string;
  lobbyN: (n: number) => string;
  maxFingers: string;
  autoStart: string;
  holding: (n: number) => string;
  colors: Record<string, string>;
  dec: string;
}

export const LACHE_PAS_STR: I18n<LachePasStr> = {
  fr: {
    name: "Lâche pas !",
    rules: [
      "Chacun pose UN doigt sur l'écran (5 max).",
      "Une bombe s'arme. Personne ne sait quand elle explose.",
      "Lâche quand tu veux. Encore posé au BOUM = perdu.",
      "Tout le monde a lâché ? Le premier à avoir lâché perd.",
      "Le dernier à lâcher gagne la couronne.",
    ],
    taunts: ["Tu trembles ?", "Encore un peu…", "Elle chauffe…", "Lâche pas !", "Qui craque en premier ?", "T'es sûr ?", "Ça sent le roussi", "Respire…"],
    intro: "Tout le monde pose un doigt, une bombe s'arme. Lâche avant le boum… mais pas le premier !",
    loserTakes: "Le perdant prend…",
    dareTitle: "Un gage",
    dareSub: "Que des gages, zéro gorgée",
    sipsTitle: "Gorgées ou gage",
    sipsSub: "1 à 3 gorgées de zinzin",
    placeFingers: "Posez vos doigts",
    introHint: "2 à 5 doigts par manche · posez le tél à plat",
    endTitle: "Bien joué, les têtes brûlées",
    rounds: (n) => (n > 1 ? "manches" : "manche"),
    burnt: (n) => (n > 1 ? "doigts grillés" : "doigt grillé"),
    cowards: (n) => (n > 1 ? "trouillards" : "trouillard"),
    replay: "Rejouer",
    quit: "Quitter",
    boom: "BOUM !",
    coward: "Trouillard !",
    setTo: (s) => `La bombe était réglée sur ${s} s`,
    allLetGo: (s) => `Tout le monde a lâché… elle était réglée sur ${s} s`,
    caught: "pris !",
    theseLost: "Ces blobs ont perdu",
    thisLost: "Ce blob a perdu",
    firstLost: "Premier à lâcher = perdu",
    sips: (n) => `${n} gorgée${n > 1 ? "s" : ""} de zinzin`,
    orDare: "ou le gage :",
    rerollDare: "Pas fou ? Un autre gage",
    winner: (c) => `Le blob ${c} a lâché en dernier : il choisit qui fait un gage en plus !`,
    finish: "Terminer",
    nextRound: "Manche suivante",
    lobby0: "Posez tous un doigt",
    lobby1: "Encore un doigt…",
    lobbyN: (n) => `${n} doigts, on attend…`,
    maxFingers: "5 doigts max ! Les autres : à la prochaine.",
    autoStart: "Ne bougez plus, ça démarre tout seul",
    holding: (n) => `${n} doigt${n > 1 ? "s" : ""} encore posé${n > 1 ? "s" : ""}`,
    colors: { purple: "violet", pink: "rose", yellow: "jaune", mint: "vert", sky: "turquoise", coral: "corail", lavender: "lavande", white: "blanc" },
    dec: ",",
  },
  en: {
    name: "Don't Let Go!",
    rules: [
      "Everyone puts ONE finger on the screen (5 max).",
      "A bomb gets armed. Nobody knows when it'll blow.",
      "Let go whenever you want. Still touching at BOOM = you lose.",
      "Everyone let go? The first one to let go loses.",
      "The last one to let go wins the crown.",
    ],
    taunts: ["Shaking yet?", "Just a bit longer…", "It's heating up…", "Don't let go!", "Who cracks first?", "You sure?", "Something's burning…", "Breathe…"],
    intro: "Everyone puts a finger down and a bomb gets armed. Let go before the boom… but don't be the first!",
    loserTakes: "The loser gets…",
    dareTitle: "A dare",
    dareSub: "Only dares, zero sips",
    sipsTitle: "Sips or a dare",
    sipsSub: "1 to 3 zinzin sips",
    placeFingers: "Fingers down",
    introHint: "2 to 5 fingers per round · lay the phone flat",
    endTitle: "Well played, daredevils",
    rounds: (n) => (n !== 1 ? "rounds" : "round"),
    burnt: (n) => (n !== 1 ? "fingers fried" : "finger fried"),
    cowards: (n) => (n !== 1 ? "chickens" : "chicken"),
    replay: "Play again",
    quit: "Quit",
    boom: "BOOM!",
    coward: "Chicken!",
    setTo: (s) => `The bomb was set to ${s} s`,
    allLetGo: (s) => `Everyone let go… it was set to ${s} s`,
    caught: "caught!",
    theseLost: "These blobs lost",
    thisLost: "This blob lost",
    firstLost: "First to let go = loser",
    sips: (n) => `${n} zinzin sip${n !== 1 ? "s" : ""}`,
    orDare: "or the dare:",
    rerollDare: "Meh? Another dare",
    winner: (c) => `The ${c} blob let go last: they pick someone to do an extra dare!`,
    finish: "Finish",
    nextRound: "Next round",
    lobby0: "Everyone, finger down",
    lobby1: "One more finger…",
    lobbyN: (n) => `${n} fingers, hold on…`,
    maxFingers: "5 fingers max! Everyone else: next time.",
    autoStart: "Don't move, it starts by itself",
    holding: (n) => `${n} finger${n !== 1 ? "s" : ""} still down`,
    colors: { purple: "purple", pink: "pink", yellow: "yellow", mint: "green", sky: "turquoise", coral: "coral", lavender: "lavender", white: "white" },
    dec: ".",
  },
  es: {
    name: "¡No Sueltes!",
    rules: [
      "Cada uno pone UN dedo en la pantalla (5 como máximo).",
      "Se arma una bomba. Nadie sabe cuándo va a explotar.",
      "Suelta cuando quieras. Si sigues tocando en el BUM, pierdes.",
      "¿Todos han soltado? Pierde el primero que soltó.",
      "El último en soltar gana la corona.",
    ],
    taunts: ["¿Estás temblando?", "Un poquito más…", "Se está calentando…", "¡No sueltes!", "¿Quién se raja primero?", "¿Seguro?", "Esto huele a quemado", "Respira…"],
    intro: "Todos ponen un dedo y se arma una bomba. Suelta antes del bum… ¡pero no seas el primero!",
    loserTakes: "Quien pierde se lleva…",
    dareTitle: "Un reto",
    dareSub: "Solo retos, cero tragos",
    sipsTitle: "Tragos o reto",
    sipsSub: "1 a 3 tragos de zinzin",
    placeFingers: "Poned los dedos",
    introHint: "De 2 a 5 dedos por ronda · deja el móvil en plano",
    endTitle: "Bien jugado, valientes",
    rounds: (n) => (n !== 1 ? "rondas" : "ronda"),
    burnt: (n) => (n !== 1 ? "dedos quemados" : "dedo quemado"),
    cowards: (n) => (n !== 1 ? "gallinas" : "gallina"),
    replay: "Volver a jugar",
    quit: "Salir",
    boom: "¡BUM!",
    coward: "¡Gallina!",
    setTo: (s) => `La bomba estaba programada a ${s} s`,
    allLetGo: (s) => `Todos han soltado… estaba programada a ${s} s`,
    caught: "¡pillado!",
    theseLost: "Estos blobs han perdido",
    thisLost: "Este blob ha perdido",
    firstLost: "El primero en soltar pierde",
    sips: (n) => `${n} trago${n !== 1 ? "s" : ""} de zinzin`,
    orDare: "o el reto:",
    rerollDare: "¿No mola? Otro reto",
    winner: (c) => `El blob ${c} soltó el último: ¡elige quién hace un reto extra!`,
    finish: "Terminar",
    nextRound: "Siguiente ronda",
    lobby0: "Poned todos un dedo",
    lobby1: "Falta otro dedo…",
    lobbyN: (n) => `${n} dedos, esperamos…`,
    maxFingers: "¡5 dedos como máximo! Los demás, a la próxima.",
    autoStart: "No os mováis, empieza solo",
    holding: (n) => `${n} dedo${n !== 1 ? "s" : ""} todavía puesto${n !== 1 ? "s" : ""}`,
    colors: { purple: "morado", pink: "rosa", yellow: "amarillo", mint: "verde", sky: "turquesa", coral: "coral", lavender: "lila", white: "blanco" },
    dec: ",",
  },
};
