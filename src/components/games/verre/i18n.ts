import type { I18n } from "@/lib/i18n";

/**
 * Le Verre Invisible — textes FR / EN / ES.
 * Interface (VERRE_STR), contenu (liquides, événements, gages) et fiche catalogue (VERRE_TEXT).
 */

export type EventId = "ice" | "small" | "crack" | "oneHand" | "eyes" | "spin" | "foam" | "tray";
export type LiquidId = "orange" | "grenadine" | "cola" | "sparkling" | "mint" | "lemonade" | "blueberry";

interface Strings {
  name: string;
  // Réglages
  beforeStart: string;
  difficulty: string;
  easy: string; easySub: string;
  normal: string; normalSub: string;
  pro: string; proSub: string;
  loserTakes: string;
  dareTitle: string; dareSub: string;
  sipsTitle: string; sipsSub: string;
  roundsTitle: string;
  roundsN: (n: number) => string;
  sensorNote: string;
  go: string;
  tutoAgain: string;
  // Capteurs
  noticeDenied: string;
  noticeNoSensor: string;
  touchChip: string;
  // Début de manche
  roundHint: (round: number, liquid: string) => string;
  firstBtn: string;
  // Manche
  roundChip: (r: number, total: number) => string;
  pours: string;
  calib: string;
  calibDone: string;
  pourBtn: string;
  pourHold: string;
  doneBtn: string;
  pourMin: string;
  ptsUnit: (n: number) => string;
  passTo: (name: string) => string;
  passSub: string;
  gotIt: string;
  gotItHint: (name: string) => string;
  leak: string;
  double: string;
  splash: string;
  tooSlow: string;
  // Résultat de manche
  spilledPour: (name: string) => string;
  spilledPass: (name: string) => string;
  spilledSlow: (name: string) => string;
  spilledLeak: (name: string) => string;
  lostPts: (n: number) => string;
  sips: (n: number) => string;
  orDare: string;
  yourDare: string;
  rerollDare: string;
  scoreTitle: string;
  nextRound: string;
  finalRanking: string;
  stopHere: string;
  /** Version découverte (app sans Zinzin+) : écran après la 1re manche */
  moreChip: string;
  moreTitle: string;
  moreText: string;
  moreCta: string;
  moreStop: string;
  // Fin
  winner: (name: string) => string;
  bestBarman: string;
  spillKing: (name: string, n: number) => string;
  noSpill: string;
  spills: (n: number) => string;
  replay: string;
  players: string;
  quit: string;
  // Tuto
  tuto: { title: string; text: string }[];
  next: string;
  understood: string;
  skip: string;
  // Règles
  rulesBtn: string;
  rulesTitle: string;
  rules: string[];
  /** Règle de la peine en mode sans alcool / Soirée Chill (remplace celle qui parle de gorgées) */
  ruleNoSips: string;
  close: string;
  // Contenu
  liquids: Record<LiquidId, string>;
  events: Record<EventId, { title: string; sub: string }>;
  dares: string[];
}

export const VERRE_STR: I18n<Strings> = {
  fr: {
    name: "Le Verre Invisible",
    beforeStart: "On remplit ?",
    difficulty: "La difficulté",
    easy: "Facile", easySub: "Le liquide est sage, on a le temps.",
    normal: "Normal", normalSub: "Ça tangue pour de vrai.",
    pro: "Barman pro", proSub: "Le moindre geste fait des vagues.",
    loserTakes: "Celui qui renverse prend",
    dareTitle: "Un gage", dareSub: "Zéro gorgée, juste la honte.",
    sipsTitle: "Gorgées ou gage", sipsSub: "1 à 3 gorgées de zinzin (eau acceptée) ou un gage.",
    roundsTitle: "Les manches",
    roundsN: (n) => `${n} manches`,
    sensorNote: "Le tél sert de plateau : il suit l'inclinaison grâce à ses capteurs. Tenez-le bien à plat !",
    go: "C'est parti !",
    tutoAgain: "Revoir le tuto",
    noticeDenied: "Capteurs refusés : glisse ton doigt sur l'écran pour incliner le verre.",
    noticeNoSensor: "Pas de capteur d'inclinaison ici : glisse ton doigt pour incliner le verre.",
    touchChip: "Mode tactile : glisse le doigt",
    roundHint: (r, liquid) => `Manche ${r} · ${liquid}. Tu verses en premier !`,
    firstBtn: "C'est moi, je verse",
    roundChip: (r, total) => `Manche ${r}/${total}`,
    pours: "verse",
    calib: "Tiens-le à plat…",
    calibDone: "Calibré !",
    pourBtn: "Verser",
    pourHold: "Un seul appui : quand tu lâches, tu passes !",
    doneBtn: "C'est bon !",
    pourMin: "Verse au moins une goutte !",
    ptsUnit: (n) => (n <= 1 ? "pt" : "pts"),
    passTo: (name) => `Passe à ${name} !`,
    passSub: "Bien à plat, tout doucement…",
    gotIt: "Je l'ai !",
    gotItHint: (name) => `${name}, appuie dès que tu l'as en main !`,
    leak: "Fuite",
    double: "Points x2",
    splash: "SPLASH !",
    tooSlow: "Trop lent !",
    spilledPour: (name) => `${name} a tout renversé !`,
    spilledPass: (name) => `${name} l'a renversé en passant !`,
    spilledSlow: (name) => `${name} a trop traîné : le verre a valsé !`,
    spilledLeak: (name) => `Le verre de ${name} a fui partout !`,
    lostPts: (n) => `Points de la manche perdus : ${n}`,
    sips: (n) => `${n} gorgée${n > 1 ? "s" : ""} de zinzin`,
    orDare: "ou le gage :",
    yourDare: "Ton gage :",
    rerollDare: "Un autre gage",
    scoreTitle: "Le classement",
    nextRound: "Manche suivante",
    finalRanking: "Voir le classement final",
    stopHere: "Arrêter là",
    moreChip: "Manche découverte terminée",
    moreTitle: "Continuer la partie ?",
    moreText: "Le plateau commence à peine à chauffer… La suite de la partie (et tous les liquides) est dans Zinzin+.",
    moreCta: "Continuer avec Zinzin+",
    moreStop: "Terminer ici",
    winner: (name) => `${name} gagne !`,
    bestBarman: "Le meilleur barman de la soirée",
    spillKing: (name, n) => `Roi du renversé : ${name} (${n})`,
    noSpill: "Personne n'a rien renversé… vraiment ?",
    spills: (n) => `${n} renversé${n > 1 ? "s" : ""}`,
    replay: "Rejouer",
    players: "Joueurs",
    quit: "Quitter",
    tuto: [
      { title: "Verse", text: "Maintiens « Verser », un seul appui : dès que tu lâches, c'est au suivant. Plus tu prends de la place qui reste, plus tu marques." },
      { title: "Passe-le à plat", text: "Puis passe le tél à ton voisin, comme un plateau. Il appuie sur « Je l'ai ! »." },
      { title: "Ça déborde ? Perdu", text: "Le verre se remplit à chaque tour. Celui qui fait déborder prend la peine !" },
    ],
    next: "Suivant",
    understood: "Compris !",
    skip: "Passer",
    rulesBtn: "Règles",
    rulesTitle: "Les règles",
    ruleNoSips: "Si ça déborde (en versant ou pendant le passage), tu perds tes points de la manche et tu fais un gage.",
    rules: [
      "Le téléphone devient un plateau avec un verre posé dessus : le liquide suit l'inclinaison du tél.",
      "À ton tour, maintiens « Verser » pour remplir le verre. Un seul appui : dès que tu lâches, ton tour est fini.",
      "Les points dépendent de la place restante que tu remplis : remplir la moitié de ce qui reste rapporte autant dans un verre vide que presque plein.",
      "Ensuite, passe le tél à ton voisin, bien à plat, avant la fin du compte à rebours. Il appuie sur « Je l'ai ! ».",
      "Si ça déborde (en versant ou pendant le passage), tu perds tes points de la manche et tu prends la peine : un gage, ou 1 à 3 gorgées de zinzin (eau acceptée).",
      "Des surprises tombent : glaçon, petit verre, fissure, mousse, plateau de serveur… Le meilleur total après toutes les manches gagne.",
    ],
    close: "Fermer",
    liquids: {
      orange: "Jus d'orange",
      grenadine: "Sirop de grenadine",
      cola: "Soda au cola",
      sparkling: "Eau pétillante",
      mint: "Sirop de menthe",
      lemonade: "Limonade",
      blueberry: "Jus de myrtille",
    },
    events: {
      ice: { title: "Glaçon !", sub: "Il plonge dans le verre : le niveau monte d'un coup." },
      small: { title: "Petit verre !", sub: "Le verre rétrécit pendant ton tour." },
      crack: { title: "Fissure !", sub: "Le verre fuit : verse et passe-le avant la fin de la fuite." },
      oneHand: { title: "D'une seule main !", sub: "Ce tour-ci, tu le passes avec une seule main." },
      eyes: { title: "Yeux fermés !", sub: "Pendant le passage, tu fermes les yeux. Ton voisin te guide." },
      spin: { title: "Fais un tour sur toi-même !", sub: "Tourne une fois sur toi en le passant (3 s de plus)." },
      foam: { title: "Mousse !", sub: "Chaque mouvement fait monter la mousse." },
      tray: { title: "Plateau de serveur !", sub: "Deux verres à la fois. Points doublés !" },
    },
    dares: [
      "Fais le serveur chic : prends la commande de chaque joueur avec un accent snob.",
      "Porte un toast de 20 secondes à la personne à ta gauche.",
      "Mime un serveur qui traverse une salle bondée avec un plateau plein.",
      "Fais une pub de 15 secondes pour un verre d'eau du robinet.",
      "Chante un refrain en remplaçant chaque mot par « glou ».",
      "Fais 10 squats en tenant un verre vide bien droit.",
      "Imite la mascotte qui panique quand le verre tangue.",
      "Tu es le videur : chaque joueur a 5 secondes pour te convaincre de le laisser entrer. Tu en recales un, sans pitié.",
      "Applaudis-toi 10 secondes en remerciant ton public.",
      "Donne un surnom de barman à chaque joueur.",
      "Fais une déclaration d'amour passionnée à ton verre.",
      "Garde un objet en équilibre sur le dos de ta main pendant 20 secondes.",
      "Invente un cocktail imaginaire, décris-le et vends-le avec passion.",
      "Fais « glouglou » pendant 10 secondes sans rire.",
      "Les autres choisissent un mot interdit : si tu le dis avant ton prochain tour, tu refais un gage.",
      "Goûte un verre d'eau comme si c'était un grand cru hors de prix.",
      "Fais la danse de la victoire d'un serveur qui n'a rien renversé.",
      "Parle en chuchotant jusqu'à ton prochain tour.",
      "Raconte ta pire maladresse comme un commentateur sportif.",
      "Serviette sur le bras : reste en mode serveur jusqu'à la fin de la manche suivante.",
      "Fais le tour de la table en annonçant le plat du jour à chacun.",
      "Imite le bruit d'une bouteille qu'on débouche, trois fois, de plus en plus fort.",
    ],
  },

  en: {
    name: "The Invisible Glass",
    beforeStart: "Ready to pour?",
    difficulty: "Difficulty",
    easy: "Easy", easySub: "The liquid behaves, no rush.",
    normal: "Normal", normalSub: "It really sloshes around.",
    pro: "Pro bartender", proSub: "The tiniest move makes waves.",
    loserTakes: "Whoever spills takes",
    dareTitle: "A dare", dareSub: "Zero sips, just shame.",
    sipsTitle: "Sips or a dare", sipsSub: "1 to 3 zinzin sips (water counts) or a dare.",
    roundsTitle: "Rounds",
    roundsN: (n) => `${n} rounds`,
    sensorNote: "The phone is your tray: its sensors follow every tilt. Keep it nice and flat!",
    go: "Let's go!",
    tutoAgain: "Watch the tutorial again",
    noticeDenied: "Sensors blocked: slide your finger on the screen to tilt the glass.",
    noticeNoSensor: "No tilt sensor here: slide your finger to tilt the glass.",
    touchChip: "Touch mode: slide your finger",
    roundHint: (r, liquid) => `Round ${r} · ${liquid}. You pour first!`,
    firstBtn: "That's me, I'll pour",
    roundChip: (r, total) => `Round ${r}/${total}`,
    pours: "is pouring",
    calib: "Hold it flat…",
    calibDone: "Calibrated!",
    pourBtn: "Pour",
    pourHold: "One press only: let go and you pass!",
    doneBtn: "That's enough!",
    pourMin: "Pour at least a drop!",
    ptsUnit: (n) => (n <= 1 ? "pt" : "pts"),
    passTo: (name) => `Pass to ${name}!`,
    passSub: "Nice and flat, slowly…",
    gotIt: "Got it!",
    gotItHint: (name) => `${name}, tap as soon as it's in your hands!`,
    leak: "Leak",
    double: "Points x2",
    splash: "SPLASH!",
    tooSlow: "Too slow!",
    spilledPour: (name) => `${name} spilled everything!`,
    spilledPass: (name) => `${name} spilled it mid-pass!`,
    spilledSlow: (name) => `${name} took too long: the glass went flying!`,
    spilledLeak: (name) => `${name}'s glass leaked everywhere!`,
    lostPts: (n) => `Points lost this round: ${n}`,
    sips: (n) => `${n} zinzin sip${n > 1 ? "s" : ""}`,
    orDare: "or the dare:",
    yourDare: "Your dare:",
    rerollDare: "Another dare",
    scoreTitle: "Leaderboard",
    nextRound: "Next round",
    finalRanking: "See the final leaderboard",
    stopHere: "Stop here",
    moreChip: "Trial round done",
    moreTitle: "Keep playing?",
    moreText: "The tray's only just warming up… The rest of the game (and every drink) is in Zinzin+.",
    moreCta: "Continue with Zinzin+",
    moreStop: "End here",
    winner: (name) => `${name} wins!`,
    bestBarman: "Best bartender of the night",
    spillKing: (name, n) => `Spill champion: ${name} (${n})`,
    noSpill: "Nobody spilled a thing… seriously?",
    spills: (n) => `${n} spill${n > 1 ? "s" : ""}`,
    replay: "Play again",
    players: "Players",
    quit: "Quit",
    tuto: [
      { title: "Pour", text: "Hold \"Pour\", one press only: as soon as you let go, it's the next player's turn. The more of the remaining room you fill, the more you score." },
      { title: "Pass it flat", text: "Then pass the phone to your neighbour like a tray. They tap \"Got it!\"." },
      { title: "It overflows? You lose", text: "The glass fills up every turn. Whoever makes it overflow takes the penalty!" },
    ],
    next: "Next",
    understood: "Got it!",
    skip: "Skip",
    rulesBtn: "Rules",
    rulesTitle: "The rules",
    ruleNoSips: "If it overflows (while pouring or passing), you lose your points for the round and do a dare.",
    rules: [
      "The phone becomes a tray with a glass on it: the liquid follows the phone's tilt.",
      "On your turn, hold \"Pour\" to fill the glass. One press only: as soon as you let go, your turn is over.",
      "Points depend on the remaining room you fill: filling half of what's left scores the same in an empty glass as in a nearly full one.",
      "Then pass the phone to your neighbour, nice and flat, before the countdown ends. They tap \"Got it!\".",
      "If it overflows (while pouring or passing), you lose your points for the round and take the penalty: a dare, or 1 to 3 zinzin sips (water counts).",
      "Surprises drop in: ice cube, tiny glass, crack, foam, waiter's tray… Best total after all the rounds wins.",
    ],
    close: "Close",
    liquids: {
      orange: "Orange juice",
      grenadine: "Grenadine syrup",
      cola: "Cola",
      sparkling: "Sparkling water",
      mint: "Mint syrup",
      lemonade: "Lemonade",
      blueberry: "Blueberry juice",
    },
    events: {
      ice: { title: "Ice cube!", sub: "It plops into the glass: the level jumps up." },
      small: { title: "Tiny glass!", sub: "The glass shrinks during your turn." },
      crack: { title: "Crack!", sub: "The glass is leaking: pour and pass before it runs dry." },
      oneHand: { title: "One hand only!", sub: "This turn, you pass it with one hand." },
      eyes: { title: "Eyes closed!", sub: "Close your eyes while passing. Your neighbour guides you." },
      spin: { title: "Spin around!", sub: "Do a full spin while passing it (3 extra seconds)." },
      foam: { title: "Foam!", sub: "Every move makes the foam rise." },
      tray: { title: "Waiter's tray!", sub: "Two glasses at once. Double points!" },
    },
    dares: [
      "Be a posh waiter: take everyone's order in a snooty accent.",
      "Give a 20-second toast to the person on your left.",
      "Mime a waiter crossing a packed room with a full tray.",
      "Do a 15-second advert for a glass of tap water.",
      "Sing a chorus replacing every word with \"glug\".",
      "Do 10 squats holding an empty glass perfectly straight.",
      "Impersonate the mascot panicking when the glass wobbles.",
      "You're the bouncer: each player gets 5 seconds to convince you to let them in. Turn one away, no mercy.",
      "Applaud yourself for 10 seconds while thanking your fans.",
      "Give every player a bartender nickname.",
      "Make a passionate declaration of love to your glass.",
      "Balance an object on the back of your hand for 20 seconds.",
      "Invent an imaginary cocktail, describe it and sell it with passion.",
      "Go \"glug glug\" for 10 seconds without laughing.",
      "The others pick a forbidden word: say it before your next turn and you do another dare.",
      "Taste a glass of water as if it were a ridiculously expensive vintage.",
      "Do the victory dance of a waiter who didn't spill a drop.",
      "Whisper everything until your next turn.",
      "Tell the story of your clumsiest moment like a sports commentator.",
      "Napkin over your arm: stay in waiter mode until the end of the next round.",
      "Go around the table announcing today's special to everyone.",
      "Make the sound of a bottle being uncorked, three times, louder each time.",
    ],
  },

  es: {
    name: "El Vaso Invisible",
    beforeStart: "¿Llenamos?",
    difficulty: "La dificultad",
    easy: "Fácil", easySub: "El líquido se porta bien, sin prisas.",
    normal: "Normal", normalSub: "Se mueve de verdad.",
    pro: "Barman pro", proSub: "El mínimo gesto hace olas.",
    loserTakes: "Quien lo derrame se lleva",
    dareTitle: "Un reto", dareSub: "Cero tragos, solo vergüenza.",
    sipsTitle: "Tragos o reto", sipsSub: "De 1 a 3 tragos de zinzin (vale agua) o un reto.",
    roundsTitle: "Las rondas",
    roundsN: (n) => `${n} rondas`,
    sensorNote: "El móvil es tu bandeja: sus sensores siguen cada inclinación. ¡Mantenedlo bien plano!",
    go: "¡Vamos!",
    tutoAgain: "Ver el tutorial otra vez",
    noticeDenied: "Sensores bloqueados: desliza el dedo por la pantalla para inclinar el vaso.",
    noticeNoSensor: "Aquí no hay sensor de inclinación: desliza el dedo para inclinar el vaso.",
    touchChip: "Modo táctil: desliza el dedo",
    roundHint: (r, liquid) => `Ronda ${r} · ${liquid}. ¡Sirves tú primero!`,
    firstBtn: "Soy yo, sirvo",
    roundChip: (r, total) => `Ronda ${r}/${total}`,
    pours: "sirve",
    calib: "Mantenlo plano…",
    calibDone: "¡Calibrado!",
    pourBtn: "Servir",
    pourHold: "Un solo toque: ¡si sueltas, pasas!",
    doneBtn: "¡Ya está!",
    pourMin: "¡Sirve al menos una gota!",
    ptsUnit: (n) => (n <= 1 ? "pt" : "pts"),
    passTo: (name) => `¡Pásaselo a ${name}!`,
    passSub: "Bien plano, despacito…",
    gotIt: "¡Lo tengo!",
    gotItHint: (name) => `${name}, pulsa en cuanto lo tengas en la mano`,
    leak: "Fuga",
    double: "Puntos x2",
    splash: "¡SPLASH!",
    tooSlow: "¡Demasiado lento!",
    spilledPour: (name) => `¡${name} lo ha derramado todo!`,
    spilledPass: (name) => `¡${name} lo ha derramado al pasarlo!`,
    spilledSlow: (name) => `¡${name} tardó demasiado: el vaso salió volando!`,
    spilledLeak: (name) => `¡El vaso de ${name} se ha salido por todas partes!`,
    lostPts: (n) => `Puntos perdidos en la ronda: ${n}`,
    sips: (n) => `${n} trago${n > 1 ? "s" : ""} de zinzin`,
    orDare: "o el reto:",
    yourDare: "Tu reto:",
    rerollDare: "Otro reto",
    scoreTitle: "La clasificación",
    nextRound: "Siguiente ronda",
    finalRanking: "Ver la clasificación final",
    stopHere: "Parar aquí",
    moreChip: "Ronda de prueba terminada",
    moreTitle: "¿Seguimos la partida?",
    moreText: "La bandeja apenas se está calentando… El resto de la partida (y todas las bebidas) está en Zinzin+.",
    moreCta: "Seguir con Zinzin+",
    moreStop: "Terminar aquí",
    winner: (name) => `¡${name} gana!`,
    bestBarman: "El mejor barman de la noche",
    spillKing: (name, n) => `Rey del derrame: ${name} (${n})`,
    noSpill: "Nadie ha derramado nada… ¿en serio?",
    spills: (n) => `${n} derrame${n > 1 ? "s" : ""}`,
    replay: "Volver a jugar",
    players: "Jugadores",
    quit: "Salir",
    tuto: [
      { title: "Sirve", text: "Mantén pulsado «Servir», un solo toque: en cuanto sueltas, le toca al siguiente. Cuanto más espacio libre llenas, más puntos ganas." },
      { title: "Pásalo plano", text: "Luego pásale el móvil a tu vecino como una bandeja. Él pulsa «¡Lo tengo!»." },
      { title: "¿Se desborda? Pierdes", text: "El vaso se llena en cada turno. ¡Quien lo desborde se lleva el castigo!" },
    ],
    next: "Siguiente",
    understood: "¡Entendido!",
    skip: "Saltar",
    rulesBtn: "Reglas",
    rulesTitle: "Las reglas",
    ruleNoSips: "Si se desborda (al servir o al pasarlo), pierdes tus puntos de la ronda y haces un reto.",
    rules: [
      "El móvil se convierte en una bandeja con un vaso encima: el líquido sigue la inclinación del móvil.",
      "En tu turno, mantén pulsado «Servir» para llenar el vaso. Un solo toque: en cuanto sueltas, se acaba tu turno.",
      "Los puntos dependen del espacio libre que llenas: llenar la mitad de lo que queda vale lo mismo en un vaso vacío que en uno casi lleno.",
      "Luego pásale el móvil a tu vecino, bien plano, antes de que acabe la cuenta atrás. Él pulsa «¡Lo tengo!».",
      "Si se desborda (al servir o al pasarlo), pierdes tus puntos de la ronda y te llevas el castigo: un reto, o de 1 a 3 tragos de zinzin (vale agua).",
      "Caen sorpresas: cubito, vaso pequeño, grieta, espuma, bandeja de camarero… Gana el mejor total al final de todas las rondas.",
    ],
    close: "Cerrar",
    liquids: {
      orange: "Zumo de naranja",
      grenadine: "Sirope de granadina",
      cola: "Refresco de cola",
      sparkling: "Agua con gas",
      mint: "Sirope de menta",
      lemonade: "Limonada",
      blueberry: "Zumo de arándanos",
    },
    events: {
      ice: { title: "¡Cubito!", sub: "Cae dentro del vaso: el nivel sube de golpe." },
      small: { title: "¡Vaso pequeño!", sub: "El vaso encoge durante tu turno." },
      crack: { title: "¡Grieta!", sub: "El vaso gotea: sirve y pásalo antes de que se vacíe." },
      oneHand: { title: "¡Con una sola mano!", sub: "Este turno lo pasas con una sola mano." },
      eyes: { title: "¡Ojos cerrados!", sub: "Cierra los ojos al pasarlo. Tu vecino te guía." },
      spin: { title: "¡Da una vuelta!", sub: "Gira sobre ti mismo al pasarlo (3 s más)." },
      foam: { title: "¡Espuma!", sub: "Cada movimiento hace subir la espuma." },
      tray: { title: "¡Bandeja de camarero!", sub: "Dos vasos a la vez. ¡Puntos dobles!" },
    },
    dares: [
      "Haz de camarero pijo: toma nota a cada jugador con acento estirado.",
      "Haz un brindis de 20 segundos por la persona de tu izquierda.",
      "Imita a un camarero cruzando un local lleno con la bandeja a tope.",
      "Haz un anuncio de 15 segundos para un vaso de agua del grifo.",
      "Canta un estribillo cambiando cada palabra por «glu».",
      "Haz 10 sentadillas sujetando un vaso vacío bien recto.",
      "Imita a la mascota cuando entra en pánico porque el vaso se tambalea.",
      "Eres el portero de la discoteca: cada jugador tiene 5 segundos para convencerte de que le dejes entrar. Rechaza a uno sin piedad.",
      "Apláudete 10 segundos dando las gracias a tu público.",
      "Ponle un apodo de barman a cada jugador.",
      "Haz una declaración de amor apasionada a tu vaso.",
      "Mantén un objeto en equilibrio sobre el dorso de la mano durante 20 segundos.",
      "Inventa un cóctel imaginario, descríbelo y véndelo con pasión.",
      "Haz «glu glu» durante 10 segundos sin reírte.",
      "Los demás eligen una palabra prohibida: si la dices antes de tu próximo turno, haces otro reto.",
      "Prueba un vaso de agua como si fuera un vino carísimo.",
      "Baila el baile de la victoria de un camarero que no ha derramado nada.",
      "Habla susurrando hasta tu próximo turno.",
      "Cuenta tu mayor torpeza como si fueras comentarista deportivo.",
      "Servilleta al brazo: sigue en modo camarero hasta el final de la siguiente ronda.",
      "Da la vuelta a la mesa anunciando el plato del día a cada uno.",
      "Imita el ruido de una botella al descorcharse, tres veces, cada vez más fuerte.",
    ],
  },
};

/**
 * Fiche catalogue de l'app (même forme que ZGameText de zinzin/src/catalog-text.ts),
 * à recopier / importer dans GAME_TEXT. Prénoms de la mini BD = CAST de l'app.
 */
export interface VerreCatalogText {
  name: string;
  tagline: string;
  pitch: string;
  example: string;
  rules: string[];
  steps: string[];
  story: { who?: string; text: string }[];
}

export const VERRE_MIN_PLAYERS = 2;
export const VERRE_MAX_PLAYERS = 10;

export const VERRE_TEXT: I18n<VerreCatalogText> = {
  fr: {
    name: "Le Verre Invisible",
    tagline: "Verse, passe… sans renverser !",
    pitch: "Le téléphone devient un plateau avec un verre dessus : verse, passe-le à plat… et prie pour que ça ne déborde pas.",
    example: "Léa verse un gros coup de grenadine (+28 pts !) et passe le tél à Malik, tout doucement. Malik ajoute une goutte, mais un glaçon tombe : le niveau monte d'un coup. Il passe à Inès en tremblant… SPLASH ! Ça déborde : Malik perd ses points de la manche et fait un gage.",
    rules: VERRE_STR.fr.rules,
    steps: [
      "Un seul appui sur « Verser » : tu lâches, c'est au suivant",
      "Passe le tél à ton voisin, bien à plat, avant la fin du chrono",
      "Glaçon, fissure, mousse… des surprises compliquent tout",
      "Ça déborde ? Tu perds tes points de la manche et tu prends un gage",
    ],
    story: [
      { who: "Léa", text: "Je verse… encore un peu… +28 !" },
      { who: "Malik", text: "Doucement ! Ça tangue, ça tangue !" },
      { text: "Glaçon ! Le niveau monte d'un coup." },
      { text: "SPLASH ! Malik a tout renversé : un gage." },
    ],
  },
  en: {
    name: "The Invisible Glass",
    tagline: "Pour, pass… don't spill!",
    pitch: "The phone becomes a tray with a glass on it: pour, pass it flat… and pray it doesn't overflow.",
    example: "Léa pours a big glug of grenadine (+28 pts!) and passes the phone to Malik, oh so gently. Malik adds a drop, but an ice cube falls in: the level jumps. He passes to Inès, shaking… SPLASH! It overflows: Malik loses his points for the round and does a dare.",
    rules: VERRE_STR.en.rules,
    steps: [
      "One press on \"Pour\": let go and it's the next player's turn",
      "Pass the phone to your neighbour, nice and flat, before time runs out",
      "Ice cube, crack, foam… surprises make it harder",
      "It overflows? You lose your round points and take a dare",
    ],
    story: [
      { who: "Léa", text: "Pouring… a bit more… +28!" },
      { who: "Malik", text: "Easy! It's sloshing, it's sloshing!" },
      { text: "Ice cube! The level jumps up." },
      { text: "SPLASH! Malik spilled everything: dare time." },
    ],
  },
  es: {
    name: "El Vaso Invisible",
    tagline: "Sirve, pasa… ¡sin derramar!",
    pitch: "El móvil se convierte en una bandeja con un vaso encima: sirve, pásalo bien plano… y reza para que no se desborde.",
    example: "Léa sirve un buen chorro de granadina (¡+28 pts!) y le pasa el móvil a Malik, muy despacito. Malik añade una gota, pero cae un cubito: el nivel sube de golpe. Se lo pasa a Inès temblando… ¡SPLASH! Se desborda: Malik pierde sus puntos de la ronda y hace un reto.",
    rules: VERRE_STR.es.rules,
    steps: [
      "Un solo toque en «Servir»: sueltas y le toca al siguiente",
      "Pásale el móvil a tu vecino, bien plano, antes de que acabe el tiempo",
      "Cubito, grieta, espuma… las sorpresas lo complican todo",
      "¿Se desborda? Pierdes tus puntos de la ronda y haces un reto",
    ],
    story: [
      { who: "Léa", text: "Sirvo… un poquito más… ¡+28!" },
      { who: "Malik", text: "¡Despacio! ¡Que se mueve, que se mueve!" },
      { text: "¡Cubito! El nivel sube de golpe." },
      { text: "¡SPLASH! Malik lo ha derramado todo: reto." },
    ],
  },
};
