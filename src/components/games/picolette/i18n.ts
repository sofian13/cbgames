/**
 * La Tournée : textes de l'interface en FR / EN / ES (les cartes sont dans cards*.ts).
 * Sur le site web, getLang() vaut toujours "fr" : rien ne change.
 */

import type { I18n } from "@/lib/i18n";

type Str = {
  gameName: string;
  ideaKind: string;
  someone: string;
  soundOn: string;
  soundOff: string;
  untilNextRule: string;
  forCards: (n: number) => string;
  forMin: (n: number) => string;
  ruleEnded: (rule: string) => string;
  ruleLifted: (rule: string) => string;
  cardsLeft: (n: number) => string;
  lastCard: string;
  untilNextRuleShort: string;
  introTitle: string;
  introSub: string;
  introRules: string[];
  /** Mode sans alcool / Soirée Chill : règles d'intro et note de peine, gages seulement */
  introRulesNoSips: string[];
  penaltyNoSips: string;
  introGo: string;
  ruleOngoing: string;
  ruleBy: (name: string) => string;
  someoneCracked: [string, string];
  readsCardAria: (name: string) => string;
  reads: (name: string) => string;
  answer: (a: string) => string;
  showAnswer: string;
  handUp: string;
  handDown: string;
  activateRule: string;
  whoLosesDuel: string;
  pickLoser: string;
  nextCard: string;
  skipRule: string;
  nobodyLoses: string;
  undoPenalty: (name: string) => string;
  endGame: string;
  pickShield: string;
  pickCracked: string;
  pickReader: string;
  pickRound: string;
  overTitle: string;
  overSub: string;
  overStar: string;
  penalties: (n: number) => string;
  overWater: string;
  playAgain: string;
  backHome: string;
  liftRule: string;
  noRule: string;
  choosePenalty: string;
  giveShield: string;
  undoLast: string;
  nothingToUndo: string;
  packsTitle: string;
  packsSub: string;
  cardsCount: (n: number) => string;
  penaltyTitle: string;
  modeMix: string;
  modeDares: string;
  penaltyNote: string;
  launch: (n: number) => string;
  editPlayers: string;
  shieldAria: string;
  cancel: string;
  penaltyFallsOn: string;
  sips: (n: number) => string;
  shieldResult: string;
  sipsNote: string;
  shieldNote: string;
  dareNote: string;
  ratherDare: string;
  anotherDare: string;
  spinning: string;
  done: string;
  // Pastille « Qui perd ? »
  loseTitle: string;
  penaltyIsMix: string;
  penaltyIsDare: string;
  prefHow: string;
  prefLose: string;
  prefTie: string;
  or: string;
  pickCamp: string;
  campTitle: string;
  campSub: string;
  confirm: (n: number) => string;
  and: string;
  shieldSpared: (names: string, n: number) => string;
};

export const STR: I18n<Str> = {
  fr: {
    gameName: "La Tournée",
    ideaKind: "idée de carte",
    someone: "quelqu'un",
    soundOn: "Activer le son",
    soundOff: "Couper le son",
    untilNextRule: "Jusqu'à la prochaine règle",
    forCards: (n) => `Pendant ${n} cartes`,
    forMin: (n) => `Pendant ${n} min`,
    ruleEnded: (r) => `Fin de la règle : ${r}`,
    ruleLifted: (r) => `Règle levée : ${r}`,
    cardsLeft: (n) => `encore ${n} cartes`,
    lastCard: "dernière carte",
    untilNextRuleShort: "jusqu'à la prochaine règle",
    introTitle: "Avant de commencer",
    introSub: "Le tél lit les cartes et désigne le perdant. Tout le reste se joue à l'oral.",
    introRules: [
      "18+. Personne ne prend le volant après la soirée.",
      "La peine : 1 à 3 gorgées max… ou un gage.",
      "Une gorgée de zinzin, c’est de ce que tu veux : eau, soft, jus… ça compte pareil.",
      "Personne n'est obligé de boire : on peut toujours prendre le gage.",
      "Les cartes sont des suggestions, adaptez-les.",
    ],
    introRulesNoSips: [
      "18+ : certaines cartes sont coquines, rien d'explicite.",
      "La peine : toujours un gage, tiré par la roulette.",
      "Les cartes sont des suggestions, adaptez-les.",
    ],
    penaltyNoSips: "Que des gages : la roulette ne tire que des gages.",
    introGo: "OK, on lance",
    ruleOngoing: "Règle en cours",
    ruleBy: (n) => `Par ${n} · `,
    someoneCracked: ["Quelqu'un", "a craqué"],
    readsCardAria: (n) => `${n} lit la carte`,
    reads: (n) => `${n} lit`,
    answer: (a) => `Réponse : ${a}`,
    showAnswer: "Voir la réponse",
    handUp: "Main en haut",
    handDown: "Main en bas",
    activateRule: "Activer la règle",
    whoLosesDuel: "Qui perd le duel ?",
    pickLoser: "Désigner un perdant",
    nextCard: "Carte suivante",
    skipRule: "Passer cette règle",
    nobodyLoses: "Personne ne perd, carte suivante",
    undoPenalty: (n) => `Annuler la peine de ${n}`,
    endGame: "Terminer la partie",
    pickShield: "Qui reçoit le bouclier ?",
    pickCracked: "Qui a craqué ?",
    pickReader: "Qui lit la suite ?",
    pickRound: "Qui perd cette manche ?",
    overTitle: "Le palmarès",
    overSub: "Plus tu as ramassé de peines, plus t'as fait le show.",
    overStar: "La star de la soirée",
    penalties: (n) => `${n} peine${n > 1 ? "s" : ""}`,
    overWater: "Un grand verre d'eau, et personne ne conduit.",
    playAgain: "Rejouer",
    backHome: "Retour à l'accueil",
    liftRule: "Lever la règle",
    noRule: "Aucune règle en cours",
    choosePenalty: "Choisir qui prend la peine",
    giveShield: "Donner le bouclier à…",
    undoLast: "Annuler la dernière peine",
    nothingToUndo: "Aucune peine à annuler",
    packsTitle: "Les cartes",
    packsSub: "Choisis tes packs, on mélange tout.",
    cardsCount: (n) => `${n} cartes`,
    penaltyTitle: "La peine",
    modeMix: "1 à 3 gorgées ou un gage",
    modeDares: "Que des gages",
    penaltyNote: "La roulette tire au hasard. Une gorgée de zinzin, c'est de ce que tu veux : eau, soft, jus…",
    launch: (n) => `C'est parti ! (${n} cartes)`,
    editPlayers: "Modifier les joueurs",
    shieldAria: "Bouclier",
    cancel: "Annuler",
    penaltyFallsOn: "La peine tombe sur",
    sips: (n) => `${n} gorgée${n > 1 ? "s" : ""}`,
    shieldResult: "Bouclier ! Peine annulée.",
    sipsNote: "Des gorgées de zinzin… ou un gage, au choix.",
    shieldNote: "Le bouclier est cassé, profites-en.",
    dareNote: "Le gage ne passe pas ? Tire-en un autre.",
    ratherDare: "Plutôt un gage",
    anotherDare: "Pas fou ? Un autre gage",
    spinning: "La roulette tourne…",
    done: "C'est fait",
    loseTitle: "Qui perd ?",
    penaltyIsMix: "1 à 3 gorgées de zinzin ou un gage",
    penaltyIsDare: "Un gage tiré au sort",
    prefHow: "Au « 3-2-1 », tout le monde lève ou baisse la main en même temps.",
    prefLose: "Le camp le moins nombreux prend la peine.",
    prefTie: "Égalité ou tous pareil : personne ne perd.",
    or: "OU",
    pickCamp: "Désigner les perdants",
    campTitle: "Qui est dans le petit camp ?",
    campSub: "Touche tous les perdants : même peine pour tout le camp.",
    confirm: (n) => `Valider (${n})`,
    and: "et",
    shieldSpared: (names, n) => `Bouclier : ${names} y échappe${n > 1 ? "nt" : ""}.`,
  },
  en: {
    gameName: "The Round",
    ideaKind: "card idea",
    someone: "someone",
    soundOn: "Turn sound on",
    soundOff: "Mute sound",
    untilNextRule: "Until the next rule",
    forCards: (n) => `For ${n} cards`,
    forMin: (n) => `For ${n} min`,
    ruleEnded: (r) => `Rule over: ${r}`,
    ruleLifted: (r) => `Rule lifted: ${r}`,
    cardsLeft: (n) => `${n} cards left`,
    lastCard: "last card",
    untilNextRuleShort: "until the next rule",
    introTitle: "Before we start",
    introSub: "The phone reads the cards and picks the loser. Everything else happens out loud.",
    introRules: [
      "18+. Nobody drives home after the party.",
      "The penalty: 1 to 3 sips max… or a dare.",
      "A zinzin sip is whatever you like: water, soda, juice… it counts the same.",
      "Nobody has to drink: you can always take the dare.",
      "The cards are suggestions, tweak them.",
    ],
    introRulesNoSips: [
      "18+: some cards are cheeky, nothing explicit.",
      "The penalty: always a dare, picked by the wheel.",
      "The cards are suggestions, tweak them.",
    ],
    penaltyNoSips: "Dares only: the wheel only picks dares.",
    introGo: "OK, let's go",
    ruleOngoing: "Rule in play",
    ruleBy: (n) => `By ${n} · `,
    someoneCracked: ["Someone", "slipped up"],
    readsCardAria: (n) => `${n} reads the card`,
    reads: (n) => `${n} reads`,
    answer: (a) => `Answer: ${a}`,
    showAnswer: "Show the answer",
    handUp: "Hand up",
    handDown: "Hand down",
    activateRule: "Start the rule",
    whoLosesDuel: "Who lost the duel?",
    pickLoser: "Pick a loser",
    nextCard: "Next card",
    skipRule: "Skip this rule",
    nobodyLoses: "Nobody loses, next card",
    undoPenalty: (n) => `Undo ${n}'s penalty`,
    endGame: "End the game",
    pickShield: "Who gets the shield?",
    pickCracked: "Who slipped up?",
    pickReader: "Who reads next?",
    pickRound: "Who loses this round?",
    overTitle: "The leaderboard",
    overSub: "The more penalties you racked up, the more of a show you put on.",
    overStar: "Star of the night",
    penalties: (n) => `${n} ${n === 1 ? "penalty" : "penalties"}`,
    overWater: "A big glass of water, and nobody drives.",
    playAgain: "Play again",
    backHome: "Back to home",
    liftRule: "Lift the rule",
    noRule: "No rule in play",
    choosePenalty: "Choose who takes the penalty",
    giveShield: "Give the shield to…",
    undoLast: "Undo the last penalty",
    nothingToUndo: "No penalty to undo",
    packsTitle: "The cards",
    packsSub: "Pick your packs, we shuffle them all together.",
    cardsCount: (n) => `${n} cards`,
    penaltyTitle: "The penalty",
    modeMix: "1 to 3 sips or a dare",
    modeDares: "Dares only",
    penaltyNote: "The wheel picks at random. A zinzin sip is whatever you like: water, soda, juice…",
    launch: (n) => `Let's go! (${n} cards)`,
    editPlayers: "Edit players",
    shieldAria: "Shield",
    cancel: "Cancel",
    penaltyFallsOn: "The penalty goes to",
    sips: (n) => `${n} zinzin ${n === 1 ? "sip" : "sips"}`,
    shieldResult: "Shield! Penalty cancelled.",
    sipsNote: "Zinzin sips… or a dare, your call.",
    shieldNote: "The shield is broken, enjoy it.",
    dareNote: "Not feeling this dare? Spin another one.",
    ratherDare: "A dare instead",
    anotherDare: "Meh? Another dare",
    spinning: "The wheel is spinning…",
    done: "Done",
    loseTitle: "Who loses?",
    penaltyIsMix: "1 to 3 zinzin sips or a dare",
    penaltyIsDare: "A random dare",
    prefHow: "On “3-2-1”, everyone raises or lowers a hand at the same time.",
    prefLose: "The smaller side takes the penalty.",
    prefTie: "Tie or all the same: nobody loses.",
    or: "OR",
    pickCamp: "Pick the losers",
    campTitle: "Who's on the smaller side?",
    campSub: "Tap every loser: the whole side gets the same penalty.",
    confirm: (n) => `Confirm (${n})`,
    and: "and",
    shieldSpared: (names, n) => `Shield: ${names} ${n > 1 ? "escape" : "escapes"} it.`,
  },
  es: {
    gameName: "La Ronda",
    ideaKind: "idea de carta",
    someone: "alguien",
    soundOn: "Activar el sonido",
    soundOff: "Silenciar",
    untilNextRule: "Hasta la próxima regla",
    forCards: (n) => `Durante ${n} cartas`,
    forMin: (n) => `Durante ${n} min`,
    ruleEnded: (r) => `Fin de la regla: ${r}`,
    ruleLifted: (r) => `Regla anulada: ${r}`,
    cardsLeft: (n) => `quedan ${n} cartas`,
    lastCard: "última carta",
    untilNextRuleShort: "hasta la próxima regla",
    introTitle: "Antes de empezar",
    introSub: "El móvil lee las cartas y señala al perdedor. Todo lo demás se juega en voz alta.",
    introRules: [
      "18+. Nadie conduce después de la fiesta.",
      "El castigo: de 1 a 3 tragos como máximo… o un reto.",
      "Un trago de zinzin es de lo que quieras: agua, refresco, zumo o jugo… cuenta igual.",
      "Nadie está obligado a beber: siempre puedes elegir el reto.",
      "Las cartas son sugerencias, adaptadlas.",
    ],
    introRulesNoSips: [
      "18+: algunas cartas son pícaras, nada explícito.",
      "El castigo: siempre un reto, elegido por la ruleta.",
      "Las cartas son sugerencias, adaptadlas.",
    ],
    penaltyNoSips: "Solo retos: la ruleta solo elige retos.",
    introGo: "Vale, ¡empezamos!",
    ruleOngoing: "Regla activa",
    ruleBy: (n) => `De ${n} · `,
    someoneCracked: ["Alguien", "ha fallado"],
    readsCardAria: (n) => `${n} lee la carta`,
    reads: (n) => `Lee ${n}`,
    answer: (a) => `Respuesta: ${a}`,
    showAnswer: "Ver la respuesta",
    handUp: "Mano arriba",
    handDown: "Mano abajo",
    activateRule: "Activar la regla",
    whoLosesDuel: "¿Quién pierde el duelo?",
    pickLoser: "Señalar a un perdedor",
    nextCard: "Siguiente carta",
    skipRule: "Saltar esta regla",
    nobodyLoses: "Nadie pierde, siguiente carta",
    undoPenalty: (n) => `Anular el castigo de ${n}`,
    endGame: "Terminar la partida",
    pickShield: "¿Quién recibe el escudo?",
    pickCracked: "¿Quién ha fallado?",
    pickReader: "¿Quién lee la siguiente?",
    pickRound: "¿Quién pierde esta ronda?",
    overTitle: "El podio",
    overSub: "Cuantos más castigos te has llevado, más espectáculo has dado.",
    overStar: "La estrella de la noche",
    penalties: (n) => `${n} ${n === 1 ? "castigo" : "castigos"}`,
    overWater: "Un buen vaso de agua, y que nadie conduzca.",
    playAgain: "Volver a jugar",
    backHome: "Volver al inicio",
    liftRule: "Anular la regla",
    noRule: "Ninguna regla activa",
    choosePenalty: "Elegir quién se lleva el castigo",
    giveShield: "Dar el escudo a…",
    undoLast: "Anular el último castigo",
    nothingToUndo: "Ningún castigo que anular",
    packsTitle: "Las cartas",
    packsSub: "Elige tus packs, lo mezclamos todo.",
    cardsCount: (n) => `${n} cartas`,
    penaltyTitle: "El castigo",
    modeMix: "De 1 a 3 tragos o un reto",
    modeDares: "Solo retos",
    penaltyNote: "La ruleta elige al azar. Un trago de zinzin es de lo que quieras: agua, refresco, zumo o jugo…",
    launch: (n) => `¡Vamos! (${n} cartas)`,
    editPlayers: "Cambiar jugadores",
    shieldAria: "Escudo",
    cancel: "Cancelar",
    penaltyFallsOn: "El castigo le toca a",
    sips: (n) => `${n} ${n === 1 ? "trago" : "tragos"} de zinzin`,
    shieldResult: "¡Escudo! Castigo anulado.",
    sipsNote: "Tragos de zinzin… o un reto, tú eliges.",
    shieldNote: "El escudo se ha roto, aprovéchalo.",
    dareNote: "¿Este reto no te va? Saca otro.",
    ratherDare: "Mejor un reto",
    anotherDare: "¿No mola? Otro reto",
    spinning: "La ruleta gira…",
    done: "Hecho",
    loseTitle: "¿Quién pierde?",
    penaltyIsMix: "De 1 a 3 tragos de zinzin o un reto",
    penaltyIsDare: "Un reto al azar",
    prefHow: "Al «3, 2, 1», todos suben o bajan la mano a la vez.",
    prefLose: "El grupo con menos gente se lleva el castigo.",
    prefTie: "Empate o todos igual: nadie pierde.",
    or: "O",
    pickCamp: "Señalar perdedores",
    campTitle: "¿Quién está en el grupo pequeño?",
    campSub: "Toca a todos los perdedores: el mismo castigo para todo el grupo.",
    confirm: (n) => `Confirmar (${n})`,
    and: "y",
    shieldSpared: (names, n) => `Escudo: ${names} se ${n > 1 ? "libran" : "libra"}.`,
  },
};
