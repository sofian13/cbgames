import type { I18n } from "@/lib/i18n";

// Pile Poil · mode Tournoi (app) — textes FR / EN / ES.

export interface ChallengeText { emoji: string; title: string; desc: string }
export type ChallengeId = "eyes" | "sing" | "mystery" | "noise" | "flamingo" | "hand" | "dance" | "stare" | "calc" | "spin";
export const CHALLENGE_IDS: ChallengeId[] = ["eyes", "sing", "mystery", "noise", "flamingo", "hand", "dance", "stare", "calc", "spin"];

// Défis spéciaux occasionnels
export const CHALLENGES: I18n<Record<ChallengeId, ChallengeText>> = {
  fr: {
    eyes: { emoji: "🙈", title: "Les yeux fermés", desc: "Appuie sur GO, ferme les yeux, et STOP sans les rouvrir." },
    sing: { emoji: "🎤", title: "En chantant", desc: "Chante un refrain à voix haute pendant tout le chrono. Pas le droit de t'arrêter." },
    mystery: { emoji: "❓", title: "Cible mystère", desc: "Personne ne connaît la cible ! Arrête-toi quand tu le sens : elle sera tirée au sort à la fin." },
    noise: { emoji: "🗣️", title: "Les perturbateurs", desc: "Les autres ont le droit de compter à voix haute des faux chiffres pour te déconcentrer." },
    flamingo: { emoji: "🦩", title: "Sur un pied", desc: "Tiens-toi sur un pied du GO jusqu'au STOP." },
    hand: { emoji: "🫲", title: "Mauvaise main", desc: "GO et STOP avec ta main non dominante." },
    dance: { emoji: "💃", title: "En dansant", desc: "Danse pendant tout le chrono. Les autres jugent l'engagement." },
    stare: { emoji: "👀", title: "Les yeux dans les yeux", desc: "Fixe un autre joueur dans les yeux pendant que tu comptes. Interdit de rire." },
    calc: { emoji: "🧮", title: "Calcul mental", desc: "La cible est un calcul. À toi de trouver combien de secondes ça fait !" },
    spin: { emoji: "🌀", title: "La toupie", desc: "Fais un tour complet sur toi-même pendant le chrono." },
  },
  en: {
    eyes: { emoji: "🙈", title: "Eyes shut", desc: "Hit GO, close your eyes, and hit STOP without opening them." },
    sing: { emoji: "🎤", title: "Sing it", desc: "Sing a chorus out loud for the whole count. No stopping allowed." },
    mystery: { emoji: "❓", title: "Mystery target", desc: "Nobody knows the target! Stop when it feels right: it gets drawn at random at the end." },
    noise: { emoji: "🗣️", title: "The hecklers", desc: "Everyone else can shout fake numbers out loud to throw you off." },
    flamingo: { emoji: "🦩", title: "One foot", desc: "Stand on one foot from GO to STOP." },
    hand: { emoji: "🫲", title: "Wrong hand", desc: "GO and STOP with your non-dominant hand." },
    dance: { emoji: "💃", title: "Dance it", desc: "Dance for the whole count. The others judge your commitment." },
    stare: { emoji: "👀", title: "Staring contest", desc: "Stare into another player's eyes while you count. No laughing." },
    calc: { emoji: "🧮", title: "Mental maths", desc: "The target is a sum. Work out how many seconds that is!" },
    spin: { emoji: "🌀", title: "Spinning top", desc: "Do a full spin on the spot during the count." },
  },
  es: {
    eyes: { emoji: "🙈", title: "Con los ojos cerrados", desc: "Pulsa GO, cierra los ojos y dale a STOP sin abrirlos." },
    sing: { emoji: "🎤", title: "Cantando", desc: "Canta un estribillo en voz alta durante todo el crono. Prohibido parar." },
    mystery: { emoji: "❓", title: "Objetivo misterioso", desc: "¡Nadie sabe el objetivo! Para cuando lo sientas: se sorteará al final." },
    noise: { emoji: "🗣️", title: "Los saboteadores", desc: "Los demás pueden contar números falsos en voz alta para desconcentrarte." },
    flamingo: { emoji: "🦩", title: "A la pata coja", desc: "Mantente sobre un pie desde el GO hasta el STOP." },
    hand: { emoji: "🫲", title: "La otra mano", desc: "GO y STOP con tu mano no dominante." },
    dance: { emoji: "💃", title: "Bailando", desc: "Baila durante todo el crono. Los demás juzgan tu entrega." },
    stare: { emoji: "👀", title: "Mirada fija", desc: "Mira fijamente a los ojos a otro jugador mientras cuentas. Prohibido reírse." },
    calc: { emoji: "🧮", title: "Cálculo mental", desc: "El objetivo es una operación. ¡Averigua cuántos segundos son!" },
    spin: { emoji: "🌀", title: "La peonza", desc: "Da una vuelta completa sobre ti mismo durante el crono." },
  },
};

// Gages doux (alternative à la gorgée — l'eau et les softs comptent aussi)
export const GAGES: I18n<string[]> = {
  fr: [
    "Imite le cri d'un animal choisi par la table",
    "Parle avec un accent jusqu'à ton prochain tour",
    "Fais 10 squats en comptant à voix haute",
    "Raconte ta pire honte de soirée en 20 secondes",
    "Fais un compliment sincère à chaque joueur",
    "Chante le refrain que la table choisit",
    "Montre la dernière photo de ta galerie (ou fais 15 pompes)",
    "Garde une grimace jusqu'à la fin de la manche",
    "Danse 10 secondes sans musique",
    "Laisse la table choisir ton prochain défi",
    "Parle à la 3e personne jusqu'à ton prochain tour",
    "Fais une déclaration d'amour à un objet de la pièce",
    "Fais le présentateur météo de la soirée",
    "Mime ton métier de rêve, les autres devinent",
    "Envoie un emoji au hasard au 3e contact de ton tél",
    "Tiens la planche 20 secondes",
    "Raconte une blague. Si personne ne rit, refais-en une",
    "Fais un beatbox de 10 secondes",
  ],
  en: [
    "Do the animal noise the table picks",
    "Talk in an accent until your next turn",
    "Do 10 squats counting out loud",
    "Tell your most embarrassing party story in 20 seconds",
    "Give every player a genuine compliment",
    "Sing the chorus the table picks",
    "Show the last photo in your camera roll (or do 15 push-ups)",
    "Pull a face and hold it until the end of the round",
    "Dance for 10 seconds with no music",
    "Let the table pick your next challenge",
    "Talk about yourself in the third person until your next turn",
    "Declare your love to an object in the room",
    "Do tonight's weather forecast, TV-presenter style",
    "Mime your dream job, the others guess",
    "Send a random emoji to the 3rd contact in your phone",
    "Hold a plank for 20 seconds",
    "Tell a joke. If nobody laughs, tell another one",
    "Beatbox for 10 seconds",
  ],
  es: [
    "Imita el sonido de un animal que elija la mesa",
    "Habla con un acento hasta tu próximo turno",
    "Haz 10 sentadillas contando en voz alta",
    "Cuenta tu peor momento de fiesta en 20 segundos",
    "Dile un cumplido sincero a cada jugador",
    "Canta el estribillo que elija la mesa",
    "Enseña la última foto de tu galería (o haz 15 flexiones)",
    "Pon una mueca y no la quites hasta el final de la ronda",
    "Baila 10 segundos sin música",
    "Deja que la mesa elija tu próximo desafío",
    "Habla de ti en tercera persona hasta tu próximo turno",
    "Declárale tu amor a un objeto de la habitación",
    "Haz de presentador del tiempo de esta noche",
    "Haz la mímica de tu trabajo soñado, los demás adivinan",
    "Manda un emoji al azar al 3.er contacto de tu móvil",
    "Aguanta la plancha 20 segundos",
    "Cuenta un chiste. Si nadie se ríe, cuenta otro",
    "Haz 10 segundos de beatbox",
  ],
};

interface PPStr {
  name: string;
  rules: string[];
  dec: string;
  turnOf: (name: string) => string;
  half: (n: string) => string;
  screenPicks: string;
  screenPicksSub: string;
  pickHere: string;
  passMystery: string;
  passTarget: (target: string, challenge: string | null) => string;
  imReady: string;
  roundOf: (n: number, total: number) => string;
  countInHead: string;
  trustGut: string;
  closestNoOver: string;
  closest: string;
  stop: string;
  go: string;
  hiddenTimer: string;
  pressGo: string;
  roundResults: string;
  // Réglages
  rule1: [string, string, string];
  rule2: [string, string, string];
  rule3: [string, string, string];
  perfectBonus: string;
  roundsCount: string;
  theRule: string;
  closestTitle: string;
  closestSub: string;
  noOverTitle: string;
  noOverSub: string;
  targets: string;
  surprise: string;
  surpriseSub: string;
  weChoose: string;
  weChooseSub: string;
  specials: string;
  specialsSub: string;
  letsGo: string;
  editPlayers: (n: number) => string;
  // Annonce de manche
  finalRound: string;
  roundBadge: (n: number, total: number) => string;
  theTarget: string;
  rerollTarget: string;
  chooseTarget: string;
  less: string;
  more: string;
  shownAsCalc: (l: string) => string;
  special: string;
  rerollChallenge: string;
  noOver: string;
  starts: (name: string) => string;
  screenChooses: string;
  // Révélation
  revealedAtEnd: string;
  busted: string;
  almost: string;
  notBad: string;
  meh: string;
  tooLong: string;
  tooRushed: string;
  target: (s: string) => string;
  pilePoil: string;
  bonus: string;
  // Résultats
  mysteryWas: string;
  boardBadge: (n: number, total: number, mystery: boolean, target: string) => string;
  results: string;
  bustedTag: string;
  perfectTag: string;
  perfectFor: (names: string, many: boolean, sips?: boolean) => string;
  takesPenalty: (name: string) => string;
  sipsOrDare: (n: number) => string;
  /** Soirée « Chill » : gage seulement, pas de gorgée */
  dareOnly: string;
  rerollDare: string;
  pts: (n: number) => string;
  finalStandings: string;
  nextRound: (n: number) => string;
  endGame: string;
  // Classement final
  champ: string;
  points: (n: number) => string;
  tieBreak: string;
  bestShot: string;
  bestDetail: (gap: string, target: string) => string;
  worstShot: string;
  worstDetail: (time: string, target: string) => string;
  replay: string;
  players: string;
  quit: string;
}

export const PP_STR: I18n<PPStr> = {
  fr: {
    name: "Pile Poil",
    rules: [
      "Une cible s'affiche, par exemple 7 s.",
      "GO, compte dans ta tête (le chrono est caché), puis STOP.",
      "Le plus proche gagne la manche. À 0,10 s près : PILE POIL, +1 bonus.",
      "Le plus loin prend un gage ou 1 gorgée (eau OK).",
    ],
    dec: ",",
    // « Au tour d'Inès » (élision devant une voyelle ou un h muet probable)
    turnOf: (name) => (/^[aeiouyhàâäéèêëîïôöùûü]/i.test(name) ? `Au tour d'${name}` : `Au tour de ${name}`),
    half: (n) => `la moitié de ${n}`,
    screenPicks: "L'écran choisit…",
    screenPicksSub: "Saisis la cible sur le tél « Écran ». Dès qu'elle est validée, la manche continue ici.",
    pickHere: "Choisir ici",
    passMystery: "Cible mystère : arrête-toi quand tu le sens !",
    passTarget: (target, ch) => `Cible : ${target}${ch ? ` · ${ch}` : ""}`,
    imReady: "C'est moi, prêt",
    roundOf: (n, total) => `manche ${n}/${total}`,
    countInHead: "Compte dans ta tête…",
    trustGut: "Fie-toi à ton instinct !",
    closestNoOver: "Le plus proche SANS dépasser !",
    closest: "Le plus proche possible !",
    stop: "STOP",
    go: "GO",
    hiddenTimer: "Le chrono est caché. Appuie quand tu penses y être.",
    pressGo: "Appuie sur GO et commence à compter.",
    roundResults: "Résultats de la manche",
    rule1: ["1. Une ", "cible", " s'affiche (ex. 7 s)."],
    rule2: ["2. GO, tu comptes ", "dans ta tête", " : le chrono est caché."],
    rule3: ["3. STOP quand tu y es. Le plus proche gagne, ", "le plus loin prend une peine", " (1 gorgée, eau OK, ou un gage)."],
    perfectBonus: "À 0,10 s près : PILE POIL, +1 bonus.",
    roundsCount: "Nombre de manches",
    theRule: "La règle",
    closestTitle: "Au plus proche",
    closestSub: "Avant ou après, peu importe",
    noOverTitle: "Sans dépasser",
    noOverSub: "Dépasser = dernier de la manche",
    targets: "Les cibles",
    surprise: "Surprise",
    surpriseSub: "De plus en plus dures",
    weChoose: "On choisit",
    weChooseSub: "À chaque manche",
    specials: "Défis spéciaux",
    specialsSub: "Yeux fermés, en chantant, cible mystère…",
    letsGo: "C'est parti !",
    editPlayers: (n) => `Modifier les joueurs (${n})`,
    finalRound: "Manche finale",
    roundBadge: (n, total) => `Manche ${n}/${total}`,
    theTarget: "La cible",
    rerollTarget: "Pas fou ? Une autre cible",
    chooseTarget: "Choisissez la cible",
    less: "Moins",
    more: "Plus",
    shownAsCalc: (l) => `Affichée en calcul : « ${l} »`,
    special: "Défi spécial",
    rerollChallenge: "Pas fou ? Un autre défi",
    noOver: "Sans dépasser",
    starts: (name) => `${name} commence`,
    screenChooses: "L'écran choisit la cible",
    revealedAtEnd: "Cible révélée à la fin de la manche",
    busted: "Dépassé ! Dernier de la manche",
    almost: "Presque !",
    notBad: "Pas mal du tout",
    meh: "Bof…",
    tooLong: "Beaucoup trop long",
    tooRushed: "Beaucoup trop pressé",
    target: (s) => `Cible : ${s}`,
    pilePoil: "PILE POIL !",
    bonus: " · +1 point bonus",
    mysteryWas: "La cible mystère était…",
    boardBadge: (n, total, mystery, target) => `Manche ${n}/${total} · ${mystery ? "la cible était" : "cible"} ${target}`,
    results: "Résultats",
    bustedTag: " · dépassé",
    perfectTag: " · pile poil, +1",
    perfectFor: (names, many, sips = true) => `PILE POIL pour ${names} : ${many ? "chacun distribue" : "distribue"} ${sips ? "1 gorgée ou un gage" : "un gage"} !`,
    takesPenalty: (name) => `${name} prend une peine`,
    sipsOrDare: (n) => `${n} gorgée${n > 1 ? "s" : ""} de zinzin ou le gage :`,
    dareOnly: "Le gage :",
    rerollDare: "Pas fou ? Un autre gage",
    pts: (n) => `${n} pt${n > 1 ? "s" : ""}`,
    finalStandings: "Classement final",
    nextRound: (n) => `Manche ${n}`,
    endGame: "Terminer la partie",
    champ: "Champion·ne du chrono",
    points: (n) => `${n} point${n > 1 ? "s" : ""}`,
    tieBreak: " · départagé au plus petit écart cumulé",
    bestShot: "Meilleur tir",
    bestDetail: (gap, target) => `à ${gap} de ${target}`,
    worstShot: "Le plus à côté",
    worstDetail: (time, target) => `${time} pour ${target}`,
    replay: "Rejouer",
    players: "Les joueurs",
    quit: "Quitter",
  },
  en: {
    name: "Spot On",
    rules: [
      "A target pops up, say 7 s.",
      "Hit GO, count in your head (the timer is hidden), then STOP.",
      "Closest wins the round. Within 0.10 s: SPOT ON, +1 bonus.",
      "Furthest off does a dare or takes 1 sip (water's fine).",
    ],
    dec: ".",
    turnOf: (name) => `${name}'s turn`,
    half: (n) => `half of ${n}`,
    screenPicks: "The screen is choosing…",
    screenPicksSub: "Enter the target on the “Screen” phone. As soon as it's confirmed, the round carries on here.",
    pickHere: "Choose here",
    passMystery: "Mystery target: stop when it feels right!",
    passTarget: (target, ch) => `Target: ${target}${ch ? ` · ${ch}` : ""}`,
    imReady: "It's me, ready",
    roundOf: (n, total) => `round ${n}/${total}`,
    countInHead: "Count in your head…",
    trustGut: "Trust your gut!",
    closestNoOver: "Closest WITHOUT going over!",
    closest: "As close as you can!",
    stop: "STOP",
    go: "GO",
    hiddenTimer: "The timer is hidden. Tap when you think you're there.",
    pressGo: "Hit GO and start counting.",
    roundResults: "Round results",
    rule1: ["1. A ", "target", " pops up (e.g. 7 s)."],
    rule2: ["2. Hit GO and count ", "in your head", ": the timer is hidden."],
    rule3: ["3. STOP when you're there. Closest wins, ", "furthest off gets a penalty", " (1 sip, water's fine, or a dare)."],
    perfectBonus: "Within 0.10 s: SPOT ON, +1 bonus.",
    roundsCount: "Number of rounds",
    theRule: "The rule",
    closestTitle: "Closest wins",
    closestSub: "Over or under, doesn't matter",
    noOverTitle: "Don't go over",
    noOverSub: "Going over = last place this round",
    targets: "Targets",
    surprise: "Surprise",
    surpriseSub: "Harder and harder",
    weChoose: "We pick",
    weChooseSub: "Every round",
    specials: "Special challenges",
    specialsSub: "Eyes shut, singing, mystery target…",
    letsGo: "Let's go!",
    editPlayers: (n) => `Edit players (${n})`,
    finalRound: "Final round",
    roundBadge: (n, total) => `Round ${n}/${total}`,
    theTarget: "The target",
    rerollTarget: "Meh? Another target",
    chooseTarget: "Pick the target",
    less: "Less",
    more: "More",
    shownAsCalc: (l) => `Shown as a sum: “${l}”`,
    special: "Special challenge",
    rerollChallenge: "Meh? Another challenge",
    noOver: "Don't go over",
    starts: (name) => `${name} goes first`,
    screenChooses: "The screen picks the target",
    revealedAtEnd: "Target revealed at the end of the round",
    busted: "Went over! Last place this round",
    almost: "So close!",
    notBad: "Not bad at all",
    meh: "Meh…",
    tooLong: "Way too long",
    tooRushed: "Way too quick",
    target: (s) => `Target: ${s}`,
    pilePoil: "SPOT ON!",
    bonus: " · +1 bonus point",
    mysteryWas: "The mystery target was…",
    boardBadge: (n, total, mystery, target) => `Round ${n}/${total} · ${mystery ? "the target was" : "target"} ${target}`,
    results: "Results",
    bustedTag: " · over",
    perfectTag: " · spot on, +1",
    perfectFor: (names, many, sips = true) => `SPOT ON for ${names}: ${many ? "each of you hands out" : "hand out"} ${sips ? "1 sip or a dare" : "a dare"}!`,
    takesPenalty: (name) => `${name} gets a penalty`,
    sipsOrDare: (n) => `${n} zinzin sip${n !== 1 ? "s" : ""} or the dare:`,
    dareOnly: "The dare:",
    rerollDare: "Meh? Another dare",
    pts: (n) => `${n} pt${n !== 1 ? "s" : ""}`,
    finalStandings: "Final standings",
    nextRound: (n) => `Round ${n}`,
    endGame: "End the game",
    champ: "Timing champion",
    points: (n) => `${n} point${n !== 1 ? "s" : ""}`,
    tieBreak: " · tie broken by smallest total gap",
    bestShot: "Best shot",
    bestDetail: (gap, target) => `${gap} off ${target}`,
    worstShot: "Furthest off",
    worstDetail: (time, target) => `${time} for ${target}`,
    replay: "Play again",
    players: "Players",
    quit: "Quit",
  },
  es: {
    name: "Justo a Tiempo",
    rules: [
      "Aparece un objetivo, por ejemplo 7 s.",
      "Pulsa GO, cuenta mentalmente (el crono está oculto) y luego STOP.",
      "El más cercano gana la ronda. A 0,10 s o menos: ¡JUSTO A TIEMPO!, +1 extra.",
      "El más alejado hace un reto o toma 1 trago (vale agua).",
    ],
    dec: ",",
    turnOf: (name) => `Turno de ${name}`,
    half: (n) => `la mitad de ${n}`,
    screenPicks: "La pantalla elige…",
    screenPicksSub: "Escribe el objetivo en el móvil «Pantalla». En cuanto se confirme, la ronda sigue aquí.",
    pickHere: "Elegir aquí",
    passMystery: "Objetivo misterioso: ¡para cuando lo sientas!",
    passTarget: (target, ch) => `Objetivo: ${target}${ch ? ` · ${ch}` : ""}`,
    imReady: "Soy yo, listo",
    roundOf: (n, total) => `ronda ${n}/${total}`,
    countInHead: "Cuenta mentalmente…",
    trustGut: "¡Fíate de tu instinto!",
    closestNoOver: "¡Lo más cerca SIN pasarte!",
    closest: "¡Lo más cerca posible!",
    stop: "STOP",
    go: "GO",
    hiddenTimer: "El crono está oculto. Pulsa cuando creas que has llegado.",
    pressGo: "Pulsa GO y empieza a contar.",
    roundResults: "Resultados de la ronda",
    rule1: ["1. Aparece un ", "objetivo", " (p. ej. 7 s)."],
    rule2: ["2. GO, cuentas ", "mentalmente", ": el crono está oculto."],
    rule3: ["3. STOP cuando llegues. Gana el más cercano, ", "el más alejado se lleva un castigo", " (1 trago, vale agua, o un reto)."],
    perfectBonus: "A 0,10 s o menos: ¡JUSTO A TIEMPO!, +1 extra.",
    roundsCount: "Número de rondas",
    theRule: "La regla",
    closestTitle: "Lo más cerca",
    closestSub: "Antes o después, da igual",
    noOverTitle: "Sin pasarse",
    noOverSub: "Pasarse = último de la ronda",
    targets: "Los objetivos",
    surprise: "Sorpresa",
    surpriseSub: "Cada vez más difíciles",
    weChoose: "Los elegimos",
    weChooseSub: "En cada ronda",
    specials: "Desafíos especiales",
    specialsSub: "Ojos cerrados, cantando, objetivo misterioso…",
    letsGo: "¡Vamos!",
    editPlayers: (n) => `Cambiar jugadores (${n})`,
    finalRound: "Ronda final",
    roundBadge: (n, total) => `Ronda ${n}/${total}`,
    theTarget: "El objetivo",
    rerollTarget: "¿No mola? Otro objetivo",
    chooseTarget: "Elegid el objetivo",
    less: "Menos",
    more: "Más",
    shownAsCalc: (l) => `Se muestra como operación: «${l}»`,
    special: "Desafío especial",
    rerollChallenge: "¿No mola? Otro desafío",
    noOver: "Sin pasarse",
    starts: (name) => `Empieza ${name}`,
    screenChooses: "La pantalla elige el objetivo",
    revealedAtEnd: "El objetivo se revela al final de la ronda",
    busted: "¡Te has pasado! Último de la ronda",
    almost: "¡Casi!",
    notBad: "Nada mal",
    meh: "Regular…",
    tooLong: "Demasiado largo",
    tooRushed: "Demasiadas prisas",
    target: (s) => `Objetivo: ${s}`,
    pilePoil: "¡JUSTO A TIEMPO!",
    bonus: " · +1 punto extra",
    mysteryWas: "El objetivo misterioso era…",
    boardBadge: (n, total, mystery, target) => `Ronda ${n}/${total} · ${mystery ? "el objetivo era" : "objetivo"} ${target}`,
    results: "Resultados",
    bustedTag: " · pasado",
    perfectTag: " · justo, +1",
    perfectFor: (names, many, sips = true) => `¡JUSTO A TIEMPO para ${names}! ${many ? "Cada uno reparte" : "Reparte"} ${sips ? "1 trago o un reto" : "un reto"}.`,
    takesPenalty: (name) => `${name} se lleva un castigo`,
    sipsOrDare: (n) => `${n} trago${n !== 1 ? "s" : ""} de zinzin o el reto:`,
    dareOnly: "El reto:",
    rerollDare: "¿No mola? Otro reto",
    pts: (n) => `${n} pt${n !== 1 ? "s" : ""}`,
    finalStandings: "Clasificación final",
    nextRound: (n) => `Ronda ${n}`,
    endGame: "Terminar la partida",
    champ: "Campeón del crono",
    points: (n) => `${n} punto${n !== 1 ? "s" : ""}`,
    tieBreak: " · desempate por menor desvío total",
    bestShot: "Mejor tiro",
    bestDetail: (gap, target) => `a ${gap} de ${target}`,
    worstShot: "El más alejado",
    worstDetail: (time, target) => `${time} para ${target}`,
    replay: "Volver a jugar",
    players: "Jugadores",
    quit: "Salir",
  },
};
