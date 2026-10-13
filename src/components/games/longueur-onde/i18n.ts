import type { I18n } from "@/lib/i18n";

/** Textes du Curseur (mode un seul téléphone). Le mode en ligne (site) reste en français. */
export const STR: I18n<{
  name: string;
  tagline: string;
  noDigits: string;
  howHow: string;
  tuto1: [string, string, string];
  tutoName: string;
  tutoClue: string;
  tuto2: string;
  tuto3: string;
  gotIt: string;
  reviewExample: string;
  passHint: string;
  round: (r: number, t: number) => string;
  otherPair: string;
  lookTarget: (name: string) => string;
  hideScreen: string;
  findThing: string;
  findCat: (art: string, cat: string) => string;
  exPrefix: string;
  orYours: string;
  sayItPass: string;
  yourClueLabel: string;
  writeClue: string;
  gaveClue: string;
  othersPlay: string;
  yourTurn: string;
  clueOf: (name: string) => string;
  saidAloud: (name: string) => string;
  dragHint: string;
  oneCursor: [string, string, string];
  validate: string;
  verdictWait: string;
  bull: string;
  close: string;
  notFar: string;
  missed: string;
  clueQuote: (name: string, clue: string) => string;
  zeroPoint: string;
  pointsFor: (name: string) => string;
  tooBad: string;
  seeScores: string;
  nextPsychic: (name: string) => string;
  bestPsychic: string;
  scoreNote: string;
  playAgain: string;
  changePlayers: string;
  backHome: string;
  ideaKind: string;
}> = {
  fr: {
    name: "Le Curseur",
    tagline: "Un Médium voit en secret où est la cible sur une échelle (froid ↔ chaud…), dit UN indice, et les autres placent le curseur.",
    noDigits: "Pas de chiffres seuls : donne un mot ou un exemple !",
    howHow: "Comment on joue, en 3 images :",
    tuto1: ["Léa voit en secret la cible : ", "tout à droite", ", côté génial."],
    tutoName: "Léa",
    tutoClue: "« Bali ! »",
    tuto2: "Elle dit à voix haute UNE destination qui se place là.",
    tuto3: "Les autres placent le curseur. Pile dans la cible : +4 !",
    gotIt: "Compris, on joue !",
    reviewExample: "Revoir l'exemple",
    passHint: "Tu es le Médium : toi seul vas voir où est la cible. Cache bien l'écran !",
    round: (r, t) => `Manche ${r}/${t}`,
    otherPair: "Une autre paire",
    lookTarget: (name) => `${name}, regarde où est la cible `,
    hideScreen: "(cache l'écran !)",
    findThing: "Trouve UN truc qui se place là",
    findCat: (art, cat) => `Trouve ${art.toUpperCase()} ${cat} qui se place là`,
    exPrefix: "Ex. : ",
    orYours: " (ou mieux, le tien !)",
    sayItPass: "Dis-le à voix haute et passe le tél",
    yourClueLabel: "Ton indice (pour s'en souvenir)",
    writeClue: "Écrire l'indice pour s'en souvenir",
    gaveClue: "J'ai donné mon indice",
    othersPlay: "→ les autres jouent",
    yourTurn: "À vous de jouer !",
    clueOf: (name) => `L'indice ${/^[aeiouyàâäéèêëîïôöùûü]/i.test(name) ? `d'${name}` : `de ${name}`} :`,
    saidAloud: (name) => `${name} vous a dit son indice à voix haute.`,
    dragHint: "Faites glisser le curseur là où vous pensez que l'indice se place.",
    oneCursor: ["Un seul curseur pour toute la table : ", "mettez-vous", " d'accord\u00a0!"],
    validate: "Valider",
    verdictWait: "Alors… ?",
    bull: "Dans le mille !",
    close: "Tout près !",
    notFar: "Pas loin !",
    missed: "Raté !",
    clueQuote: (name, clue) => `Indice ${/^[aeiouyàâäéèêëîïôöùûü]/i.test(name) ? `d'${name}` : `de ${name}`} : « ${clue} »`,
    zeroPoint: "0 point",
    pointsFor: (name) => `points pour ${name}`,
    tooBad: "Dommage, ça arrive !",
    seeScores: "Voir les scores",
    nextPsychic: (name) => `Médium suivant : ${name}`,
    bestPsychic: " meilleur Médium !",
    scoreNote: "Chacun marque les points trouvés grâce à son indice.",
    playAgain: "Rejouer",
    changePlayers: "Changer les joueurs",
    backHome: "Retour à l'accueil",
    ideaKind: "paire",
  },
  en: {
    name: "The Dial",
    tagline: "A Psychic secretly sees where the target is on a scale (cold ↔ hot…), gives ONE clue, and the others move the dial.",
    noDigits: "No numbers on their own: give a word or an example!",
    howHow: "How to play, in 3 pictures:",
    tuto1: ["Lea secretly sees the target: ", "far right", ", on the amazing side."],
    tutoName: "Lea",
    tutoClue: "“Bali!”",
    tuto2: "She says out loud ONE destination that fits there.",
    tuto3: "The others move the dial. Bang on target: +4!",
    gotIt: "Got it, let's play!",
    reviewExample: "See the example again",
    passHint: "You're the Psychic: only you will see where the target is. Hide the screen!",
    round: (r, t) => `Round ${r}/${t}`,
    otherPair: "Another scale",
    lookTarget: (name) => `${name}, look where the target is `,
    hideScreen: "(hide the screen!)",
    findThing: "Think of ONE thing that fits there",
    findCat: (_art, cat) => `Think of ONE ${cat} that fits there`,
    exPrefix: "E.g. ",
    orYours: " (or better, your own!)",
    sayItPass: "Say it out loud and pass the phone",
    yourClueLabel: "Your clue (so you don't forget)",
    writeClue: "Write the clue down so you don't forget",
    gaveClue: "I've given my clue",
    othersPlay: "→ the others play",
    yourTurn: "Your turn!",
    clueOf: (name) => `${name}'s clue:`,
    saidAloud: (name) => `${name} said their clue out loud.`,
    dragHint: "Drag the needle to where you think the clue belongs.",
    oneCursor: ["One dial for the whole table: ", "agree", " together!"],
    validate: "Lock it in",
    verdictWait: "So…?",
    bull: "Bullseye!",
    close: "So close!",
    notFar: "Not far!",
    missed: "Missed!",
    clueQuote: (name, clue) => `${name}'s clue: “${clue}”`,
    zeroPoint: "0 points",
    pointsFor: (name) => `points for ${name}`,
    tooBad: "Too bad, it happens!",
    seeScores: "See the scores",
    nextPsychic: (name) => `Next Psychic: ${name}`,
    bestPsychic: " best Psychic!",
    scoreNote: "Everyone scores the points their own clue earned.",
    playAgain: "Play again",
    changePlayers: "Change players",
    backHome: "Back to home",
    ideaKind: "paire",
  },
  es: {
    name: "El Dial",
    tagline: "Un Médium ve en secreto dónde está el objetivo en una escala (frío ↔ caliente…), da UNA pista y los demás mueven el dial.",
    noDigits: "Nada de números solos: ¡di una palabra o un ejemplo!",
    howHow: "Cómo se juega, en 3 imágenes:",
    tuto1: ["Lea ve en secreto el objetivo: ", "a la derecha del todo", ", en lo genial."],
    tutoName: "Lea",
    tutoClue: "«¡Bali!»",
    tuto2: "Dice en voz alta UN destino que encaje ahí.",
    tuto3: "Los demás mueven el dial. Justo en el objetivo: ¡+4!",
    gotIt: "¡Entendido, a jugar!",
    reviewExample: "Ver el ejemplo otra vez",
    passHint: "Eres el Médium: solo tú vas a ver dónde está el objetivo. ¡Tapa bien la pantalla!",
    round: (r, t) => `Ronda ${r}/${t}`,
    otherPair: "Otra escala",
    lookTarget: (name) => `${name}, mira dónde está el objetivo `,
    hideScreen: "(¡tapa la pantalla!)",
    findThing: "Piensa en UNA cosa que encaje ahí",
    findCat: (art, cat) => `Piensa en ${art.toUpperCase()} ${cat} que encaje ahí`,
    exPrefix: "Ej.: ",
    orYours: " (¡o mejor, el tuyo!)",
    sayItPass: "Dilo en voz alta y pasa el móvil",
    yourClueLabel: "Tu pista (para no olvidarla)",
    writeClue: "Escribir la pista para no olvidarla",
    gaveClue: "Ya he dado mi pista",
    othersPlay: "→ juegan los demás",
    yourTurn: "¡A jugar!",
    clueOf: (name) => `La pista de ${name}:`,
    saidAloud: (name) => `${name} ya dijo su pista en voz alta.`,
    dragHint: "Mueve la aguja hasta donde creas que va la pista.",
    oneCursor: ["Un solo dial para toda la mesa: ", "¡hay que", " ponerse de acuerdo!"],
    validate: "Confirmar",
    verdictWait: "¿Y bien…?",
    bull: "¡En el blanco!",
    close: "¡Casi!",
    notFar: "¡No muy lejos!",
    missed: "¡Fallado!",
    clueQuote: (name, clue) => `Pista de ${name}: «${clue}»`,
    zeroPoint: "0 puntos",
    pointsFor: (name) => `puntos para ${name}`,
    tooBad: "¡Qué pena, pasa!",
    seeScores: "Ver puntuaciones",
    nextPsychic: (name) => `Siguiente Médium: ${name}`,
    bestPsychic: " ¡mejor Médium!",
    scoreNote: "Cada uno se lleva los puntos que consiguió con su pista.",
    playAgain: "Volver a jugar",
    changePlayers: "Cambiar jugadores",
    backHome: "Volver al inicio",
    ideaKind: "paire",
  },
};

/** Exemple du mini-tuto (catégorie « destination », gauche ↔ droite). */
export const TUTO: I18n<{ art: "une" | "a" | "un"; category: string; left: string; right: string }> = {
  fr: { art: "une", category: "destination", left: "Nulle", right: "Géniale" },
  en: { art: "a", category: "destination", left: "Rubbish", right: "Amazing" },
  es: { art: "un", category: "destino", left: "Horrible", right: "Genial" },
};
