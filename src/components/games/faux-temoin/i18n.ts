// Textes du Faux Témoin (interface + libellés des scènes / questions), FR · EN · ES.
import type { I18n } from "@/lib/i18n";
import type { Acc, Answer, ColorId, DecorId, ObjId, PetId, QKind } from "./scene";

type ColorObj = "ball" | "gift" | "guitar" | "book";

export interface FTStrings {
  name: string;
  ideaKind: string;
  // Outils
  rules: string;
  close: string;
  mute: string;
  unmute: string;
  // Mini-tuto
  howtoTitle: string;
  howto: { title: string; text: string }[];
  howtoGo: string;
  // Avant la distribution
  round: (n: number) => string;
  teaserTitle: string;
  teaserSub: string;
  rerollScene: string;
  deal: string;
  // Distribution
  passHint: (sec: number) => string;
  passBtn: string;
  witnessChip: string;
  witnessText: string;
  fakeChip: string;
  fakeTitle: string;
  fakeText: string;
  secondsLeft: (n: number) => string;
  // Questions
  centerTitle: string;
  centerText: (n: number) => string;
  centerBtn: string;
  qCounter: (i: number, n: number) => string;
  starts: (name: string) => string;
  aloud: string;
  rerollQ: string;
  nextQ: string;
  toVote: string;
  // Vote
  voteTitle: string;
  voteText: string;
  voteBtn: string;
  votePick: string;
  suspense: string;
  // Verdict
  caughtTitle: string;
  caughtText: (name: string) => string;
  caughtHint: string;
  caughtBtn: string;
  missedTitle: string;
  missedText: (accused: string, fake: string) => string;
  seeScene: string;
  lastTitle: (name: string) => string;
  lastSub: string;
  lastWinTitle: string;
  lastWinText: (name: string) => string;
  lastLoseTitle: string;
  lastLoseText: string;
  // Révélation / scores
  revealTitle: string;
  revealWho: (name: string) => string;
  answersTitle: string;
  lastTag: string;
  ptsFake: (name: string, pts: number) => string;
  ptsWitnesses: string;
  scoresBtn: string;
  scoresTitle: string;
  nextRound: string;
  finish: string;
  endTitle: string;
  winner: (name: string) => string;
  tie: string;
  replay: string;
  quit: string;
  pts: string;
  sceneLabel: string;
  teaserLabel: string;
  // Contenu
  decor: Record<DecorId, string>;
  color: Record<ColorId, string>;
  obj: Record<ObjId, string>;
  pet: Record<PetId, string>;
  hour: (h: number) => string;
  question: (q: QKind) => string;
}

// ── Français ─────────────────────────────────────────────
const FEATURE_FR: Record<DecorId, string> = {
  kitchen: "le frigo", beach: "le parasol", party: "le canapé", street: "la voiture", classroom: "le bureau du prof",
  forest: "la tente", tvset: "le pupitre", pool: "la bouée", club: "la cabine du DJ", wedding: "l'arche de fleurs", park: "le banc",
};
const ACC_COUNT_FR: Record<Acc, string> = { hat: "un chapeau", glasses: "des lunettes", crown: "une couronne", bow: "un nœud papillon" };
const ACC_WITH_FR: Record<Acc, string> = { hat: "au chapeau", glasses: "à lunettes", crown: "à la couronne", bow: "au nœud papillon" };
const OBJ_COLOR_FR: Record<ColorObj, string> = {
  ball: "De quelle couleur était le ballon ?",
  gift: "De quelle couleur était le paquet cadeau ?",
  guitar: "De quelle couleur était la guitare ?",
  book: "De quelle couleur étaient les livres ?",
};

// ── English ──────────────────────────────────────────────
const FEATURE_EN: Record<DecorId, string> = {
  kitchen: "the fridge", beach: "the beach umbrella", party: "the sofa", street: "the car", classroom: "the teacher's desk",
  forest: "the tent", tvset: "the podium", pool: "the pool ring", club: "the DJ booth", wedding: "the flower arch", park: "the bench",
};
const ACC_COUNT_EN: Record<Acc, string> = { hat: "a hat", glasses: "glasses", crown: "a crown", bow: "a bow tie" };
const ACC_WITH_EN: Record<Acc, string> = { hat: "with the hat", glasses: "with the glasses", crown: "with the crown", bow: "with the bow tie" };
const OBJ_COLOR_EN: Record<ColorObj, string> = {
  ball: "What color was the ball?",
  gift: "What color was the present?",
  guitar: "What color was the guitar?",
  book: "What color were the books?",
};

// ── Español ──────────────────────────────────────────────
const FEATURE_ES: Record<DecorId, string> = {
  kitchen: "la nevera", beach: "la sombrilla", party: "el sofá", street: "el coche", classroom: "la mesa del profe",
  forest: "la tienda de campaña", tvset: "el atril", pool: "el flotador", club: "la cabina del DJ", wedding: "el arco de flores", park: "el banco",
};
const ACC_COUNT_ES: Record<Acc, string> = { hat: "sombrero", glasses: "gafas", crown: "corona", bow: "pajarita" };
const ACC_WITH_ES: Record<Acc, string> = { hat: "con sombrero", glasses: "con gafas", crown: "con corona", bow: "con pajarita" };
const OBJ_COLOR_ES: Record<ColorObj, string> = {
  ball: "¿De qué color era el balón?",
  gift: "¿De qué color era el regalo?",
  guitar: "¿De qué color era la guitarra?",
  book: "¿De qué color eran los libros?",
};

export const FT_STR: I18n<FTStrings> = {
  fr: {
    name: "Le Faux Témoin",
    ideaKind: "idée",
    rules: "Règles",
    close: "Fermer",
    mute: "Couper le son",
    unmute: "Remettre le son",
    howtoTitle: "Comment on joue ?",
    howto: [
      { title: "Regarde la scène", text: "Chacun son tour, tu as 5 secondes pour mémoriser une scène. Sauf un : le Faux Témoin, qui ne voit rien." },
      { title: "Réponds à voix haute", text: "Téléphone au centre : le jeu pose des questions sur la scène. Chacun répond à son tour. Le Faux Témoin écoute… et bluffe." },
      { title: "Démasquez-le", text: "Votez à main levée. S'il est démasqué, il a une dernière chance : une bonne réponse et il gagne quand même." },
    ],
    howtoGo: "C'est parti !",
    round: (n) => `Manche ${n}`,
    teaserTitle: "Prochaine scène",
    teaserSub: "Personne ne la voit avant son tour. Et un d'entre vous ne la verra jamais…",
    rerollScene: "Pas fou ? Une autre scène",
    deal: "On distribue !",
    passHint: (sec) => `Tu vas voir la scène pendant ${sec} secondes. Ouvre grand les yeux !`,
    passBtn: "C'est moi, montre !",
    witnessChip: "Mémorise tout !",
    witnessText: "Les couleurs, les objets, les détails…",
    fakeChip: "Chut…",
    fakeTitle: "Tu es le Faux Témoin : tu n'as rien vu !",
    fakeText: "Bluffe. Écoute bien les autres et fais comme si.",
    secondsLeft: (n) => `${n} s`,
    centerTitle: "Téléphone au centre !",
    centerText: (n) => `Tout le monde a vu la scène… enfin, presque. ${n} questions arrivent : répondez chacun votre tour, à voix haute.`,
    centerBtn: "Première question",
    qCounter: (i, n) => `Question ${i}/${n}`,
    starts: (name) => `${name} répond en premier, puis on tourne.`,
    aloud: "Chacun répond à voix haute, sans se concerter.",
    rerollQ: "Pas fou ? Une autre",
    nextQ: "Question suivante",
    toVote: "On passe au vote",
    voteTitle: "Qui est le Faux Témoin ?",
    voteText: "À trois, tout le monde pointe quelqu'un du doigt. Touchez le prénom qui a le plus de voix.",
    voteBtn: "On l'accuse !",
    votePick: "Touchez un prénom",
    suspense: "Le Faux Témoin était…",
    caughtTitle: "Démasqué !",
    caughtText: (name) => `${name} était bien le Faux Témoin.`,
    caughtHint: "Dernière chance : une bonne réponse et la victoire lui revient quand même !",
    caughtBtn: "Dernière chance",
    missedTitle: "Raté !",
    missedText: (accused, fake) => `${accused} avait tout vu. Le Faux Témoin, c'était ${fake} !`,
    seeScene: "Voir la scène",
    lastTitle: (name) => `${name}, dernière chance !`,
    lastSub: "Une seule réponse. Les autres, motus !",
    lastWinTitle: "Bien deviné !",
    lastWinText: (name) => `${name} vole la victoire.`,
    lastLoseTitle: "Raté !",
    lastLoseText: "Les témoins gagnent la manche.",
    revealTitle: "La scène",
    revealWho: (name) => `Le Faux Témoin : ${name}`,
    answersTitle: "Les bonnes réponses",
    lastTag: "Dernière chance",
    ptsFake: (name, pts) => `${name} remporte la manche : +${pts} points`,
    ptsWitnesses: "Les témoins marquent 1 point chacun",
    scoresBtn: "Les scores",
    scoresTitle: "Les scores",
    nextRound: "Manche suivante",
    finish: "Terminer la partie",
    endTitle: "Fin de la partie !",
    winner: (name) => `${name} gagne !`,
    tie: "Égalité !",
    replay: "Rejouer",
    quit: "Quitter",
    pts: "pts",
    sceneLabel: "La scène à mémoriser",
    teaserLabel: "Aperçu flou de la prochaine scène",
    decor: {
      kitchen: "La cuisine", beach: "La plage", party: "La soirée", street: "La rue", classroom: "La salle de classe",
      forest: "La forêt", tvset: "Le plateau télé", pool: "La piscine", club: "La boîte de nuit", wedding: "Le mariage", park: "Le parc",
    },
    color: { red: "Rouge", yellow: "Jaune", blue: "Bleu", green: "Vert", pink: "Rose", purple: "Violet", orange: "Orange" },
    obj: {
      pizza: "Une pizza", guitar: "Une guitare", gift: "Un cadeau", plant: "Une plante", ball: "Un ballon",
      trophy: "Une coupe", radio: "Une radio", cake: "Un gâteau", book: "Des livres",
    },
    pet: { cat: "Un chat", dog: "Un chien", duck: "Un canard" },
    hour: (h) => `${h} h`,
    question: (q) => {
      switch (q.t) {
        case "countBlobs": return "Combien de blobs y avait-il ?";
        case "countAcc": return `Combien de blobs portaient ${ACC_COUNT_FR[q.acc]} ?`;
        case "colorAcc": return `De quelle couleur était le blob ${ACC_WITH_FR[q.acc]} ?`;
        case "colorSleeper": return "Un blob dormait. De quelle couleur était-il ?";
        case "featureColor": return `De quelle couleur était ${FEATURE_FR[q.decor]} ?`;
        case "clock": return "Quelle heure indiquait l'horloge ?";
        case "sign": return "Quel nombre était écrit sur le panneau ?";
        case "balloonsCount": return "Combien y avait-il de ballons de baudruche ?";
        case "balloonsColor": return "De quelle couleur étaient les ballons de baudruche ?";
        case "tableItem": return "Qu'est-ce qui était posé sur la table ?";
        case "pet": return "Quel animal se cachait dans la scène ?";
        case "objColor": return OBJ_COLOR_FR[q.obj as ColorObj];
        case "objectPresent": return "Lequel de ces objets était dans la scène ?";
      }
    },
  },
  en: {
    name: "The Fake Witness",
    ideaKind: "idée",
    rules: "Rules",
    close: "Close",
    mute: "Mute",
    unmute: "Unmute",
    howtoTitle: "How to play",
    howto: [
      { title: "Look at the scene", text: "One by one, you get 5 seconds to memorize a scene. Except one player: the Fake Witness, who sees nothing." },
      { title: "Answer out loud", text: "Phone in the middle: the game asks questions about the scene. Everyone answers in turn. The Fake Witness listens… and bluffs." },
      { title: "Unmask them", text: "Vote by pointing. If the Fake Witness gets caught, they get one last chance: a right answer and they still win." },
    ],
    howtoGo: "Let's go!",
    round: (n) => `Round ${n}`,
    teaserTitle: "Next scene",
    teaserSub: "Nobody sees it before their turn. And one of you will never see it…",
    rerollScene: "Meh? Another scene",
    deal: "Deal it out!",
    passHint: (sec) => `You'll see the scene for ${sec} seconds. Eyes wide open!`,
    passBtn: "It's me, show me!",
    witnessChip: "Remember everything!",
    witnessText: "Colors, objects, little details…",
    fakeChip: "Shh…",
    fakeTitle: "You're the Fake Witness: you saw nothing!",
    fakeText: "Bluff. Listen closely to the others and play along.",
    secondsLeft: (n) => `${n}s`,
    centerTitle: "Phone in the middle!",
    centerText: (n) => `Everyone has seen the scene… well, almost. ${n} questions are coming: answer one at a time, out loud.`,
    centerBtn: "First question",
    qCounter: (i, n) => `Question ${i}/${n}`,
    starts: (name) => `${name} answers first, then go around the circle.`,
    aloud: "Everyone answers out loud, no conferring.",
    rerollQ: "Meh? Another one",
    nextQ: "Next question",
    toVote: "Time to vote",
    voteTitle: "Who's the Fake Witness?",
    voteText: "On three, everyone points at someone. Tap the name with the most fingers pointed at it.",
    voteBtn: "Accuse!",
    votePick: "Tap a name",
    suspense: "The Fake Witness was…",
    caughtTitle: "Busted!",
    caughtText: (name) => `${name} really was the Fake Witness.`,
    caughtHint: "Last chance: one right answer and they still win!",
    caughtBtn: "Last chance",
    missedTitle: "Wrong!",
    missedText: (accused, fake) => `${accused} saw everything. The Fake Witness was ${fake}!`,
    seeScene: "See the scene",
    lastTitle: (name) => `${name}, last chance!`,
    lastSub: "One answer only. Everyone else, zip it!",
    lastWinTitle: "Nice guess!",
    lastWinText: (name) => `${name} steals the win.`,
    lastLoseTitle: "Missed!",
    lastLoseText: "The witnesses win the round.",
    revealTitle: "The scene",
    revealWho: (name) => `Fake Witness: ${name}`,
    answersTitle: "The right answers",
    lastTag: "Last chance",
    ptsFake: (name, pts) => `${name} wins the round: +${pts} points`,
    ptsWitnesses: "Each witness scores 1 point",
    scoresBtn: "Scores",
    scoresTitle: "Scores",
    nextRound: "Next round",
    finish: "End the game",
    endTitle: "Game over!",
    winner: (name) => `${name} wins!`,
    tie: "It's a tie!",
    replay: "Play again",
    quit: "Quit",
    pts: "pts",
    sceneLabel: "The scene to memorize",
    teaserLabel: "Blurry preview of the next scene",
    decor: {
      kitchen: "The kitchen", beach: "The beach", party: "The house party", street: "The street", classroom: "The classroom",
      forest: "The forest", tvset: "The TV studio", pool: "The pool", club: "The nightclub", wedding: "The wedding", park: "The park",
    },
    color: { red: "Red", yellow: "Yellow", blue: "Blue", green: "Green", pink: "Pink", purple: "Purple", orange: "Orange" },
    obj: {
      pizza: "A pizza", guitar: "A guitar", gift: "A present", plant: "A plant", ball: "A ball",
      trophy: "A trophy", radio: "A boombox", cake: "A cake", book: "Books",
    },
    pet: { cat: "A cat", dog: "A dog", duck: "A duck" },
    hour: (h) => `${h} o'clock`,
    question: (q) => {
      switch (q.t) {
        case "countBlobs": return "How many blobs were there?";
        case "countAcc": return `How many blobs were wearing ${ACC_COUNT_EN[q.acc]}?`;
        case "colorAcc": return `What color was the blob ${ACC_WITH_EN[q.acc]}?`;
        case "colorSleeper": return "One blob was asleep. What color was it?";
        case "featureColor": return `What color was ${FEATURE_EN[q.decor]}?`;
        case "clock": return "What time did the clock say?";
        case "sign": return "What number was on the sign?";
        case "balloonsCount": return "How many balloons were there?";
        case "balloonsColor": return "What color were the balloons?";
        case "tableItem": return "What was on the table?";
        case "pet": return "Which animal was hiding in the scene?";
        case "objColor": return OBJ_COLOR_EN[q.obj as ColorObj];
        case "objectPresent": return "Which of these things was in the scene?";
      }
    },
  },
  es: {
    name: "El Falso Testigo",
    ideaKind: "idée",
    rules: "Reglas",
    close: "Cerrar",
    mute: "Silenciar",
    unmute: "Activar el sonido",
    howtoTitle: "¿Cómo se juega?",
    howto: [
      { title: "Mira la escena", text: "Por turnos, tienes 5 segundos para memorizar una escena. Todos menos uno: el Falso Testigo, que no ve nada." },
      { title: "Responde en voz alta", text: "Móvil en el centro: el juego hace preguntas sobre la escena. Cada uno responde por turnos. El Falso Testigo escucha… y se marca un farol." },
      { title: "Desenmascáralo", text: "Votad señalando con el dedo. Si lo pilláis, tiene una última oportunidad: si acierta, gana igualmente." },
    ],
    howtoGo: "¡Vamos!",
    round: (n) => `Ronda ${n}`,
    teaserTitle: "Próxima escena",
    teaserSub: "Nadie la ve antes de su turno. Y uno de vosotros no la verá nunca…",
    rerollScene: "¿No mola? Otra escena",
    deal: "¡A repartir!",
    passHint: (sec) => `Vas a ver la escena durante ${sec} segundos. ¡Abre bien los ojos!`,
    passBtn: "¡Soy yo, enséñamela!",
    witnessChip: "¡Memorízalo todo!",
    witnessText: "Los colores, los objetos, los detalles…",
    fakeChip: "Chis…",
    fakeTitle: "Eres el Falso Testigo: ¡no has visto nada!",
    fakeText: "Marca un farol. Escucha bien a los demás y disimula.",
    secondsLeft: (n) => `${n} s`,
    centerTitle: "¡Móvil en el centro!",
    centerText: (n) => `Todos han visto la escena… bueno, casi todos. Llegan ${n} preguntas: responded por turnos, en voz alta.`,
    centerBtn: "Primera pregunta",
    qCounter: (i, n) => `Pregunta ${i}/${n}`,
    starts: (name) => `${name} responde primero y luego seguís en ronda.`,
    aloud: "Cada uno responde en voz alta, sin ponerse de acuerdo.",
    rerollQ: "¿No mola? Otra",
    nextQ: "Siguiente pregunta",
    toVote: "¡A votar!",
    voteTitle: "¿Quién es el Falso Testigo?",
    voteText: "A la de tres, todos señaláis a alguien. Tocad el nombre con más votos.",
    voteBtn: "¡Lo acusamos!",
    votePick: "Toca un nombre",
    suspense: "El Falso Testigo era…",
    caughtTitle: "¡Pillado!",
    caughtText: (name) => `${name} era el Falso Testigo.`,
    caughtHint: "Última oportunidad: si acierta una respuesta, ¡gana igualmente!",
    caughtBtn: "Última oportunidad",
    missedTitle: "¡Fallasteis!",
    missedText: (accused, fake) => `${accused} lo había visto todo. ¡El Falso Testigo era ${fake}!`,
    seeScene: "Ver la escena",
    lastTitle: (name) => `${name}, ¡última oportunidad!`,
    lastSub: "Una sola respuesta. Los demás, ¡ni pío!",
    lastWinTitle: "¡Bien adivinado!",
    lastWinText: (name) => `${name} se lleva la victoria.`,
    lastLoseTitle: "¡Fallo!",
    lastLoseText: "Los testigos ganan la ronda.",
    revealTitle: "La escena",
    revealWho: (name) => `El Falso Testigo: ${name}`,
    answersTitle: "Las respuestas correctas",
    lastTag: "Última oportunidad",
    ptsFake: (name, pts) => `${name} gana la ronda: +${pts} puntos`,
    ptsWitnesses: "Cada testigo gana 1 punto",
    scoresBtn: "Puntuaciones",
    scoresTitle: "Puntuaciones",
    nextRound: "Siguiente ronda",
    finish: "Terminar la partida",
    endTitle: "¡Fin de la partida!",
    winner: (name) => `¡${name} gana!`,
    tie: "¡Empate!",
    replay: "Volver a jugar",
    quit: "Salir",
    pts: "pts",
    sceneLabel: "La escena que hay que memorizar",
    teaserLabel: "Vista borrosa de la próxima escena",
    decor: {
      kitchen: "La cocina", beach: "La playa", party: "La fiesta en casa", street: "La calle", classroom: "El aula",
      forest: "El bosque", tvset: "El plató de tele", pool: "La piscina", club: "La discoteca", wedding: "La boda", park: "El parque",
    },
    color: { red: "Rojo", yellow: "Amarillo", blue: "Azul", green: "Verde", pink: "Rosa", purple: "Morado", orange: "Naranja" },
    obj: {
      pizza: "Una pizza", guitar: "Una guitarra", gift: "Un regalo", plant: "Una planta", ball: "Un balón",
      trophy: "Un trofeo", radio: "Un radiocasete", cake: "Una tarta", book: "Libros",
    },
    pet: { cat: "Un gato", dog: "Un perro", duck: "Un pato" },
    hour: (h) => (h === 1 ? "La una" : `Las ${h}`),
    question: (q) => {
      switch (q.t) {
        case "countBlobs": return "¿Cuántos blobs había?";
        case "countAcc": return `¿Cuántos blobs llevaban ${ACC_COUNT_ES[q.acc]}?`;
        case "colorAcc": return `¿De qué color era el blob ${ACC_WITH_ES[q.acc]}?`;
        case "colorSleeper": return "Un blob estaba dormido. ¿De qué color era?";
        case "featureColor": return `¿De qué color era ${FEATURE_ES[q.decor]}?`;
        case "clock": return "¿Qué hora marcaba el reloj?";
        case "sign": return "¿Qué número había en el cartel?";
        case "balloonsCount": return "¿Cuántos globos había?";
        case "balloonsColor": return "¿De qué color eran los globos?";
        case "tableItem": return "¿Qué había encima de la mesa?";
        case "pet": return "¿Qué animal se escondía en la escena?";
        case "objColor": return OBJ_COLOR_ES[q.obj as ColorObj];
        case "objectPresent": return "¿Cuál de estas cosas estaba en la escena?";
      }
    },
  },
};

/** Libellé d'une réponse dans la langue courante. */
export function answerLabel(t: FTStrings, a: Answer): string {
  switch (a.k) {
    case "num": return String(a.v);
    case "color": return t.color[a.v];
    case "hour": return t.hour(a.v);
    case "obj": return t.obj[a.v];
    case "pet": return t.pet[a.v];
  }
}
