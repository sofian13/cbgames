// Textes du Faux Témoin (interface + libellés des scènes / questions), FR · EN · ES.
import type { I18n } from "@/lib/i18n";
import type { Acc, Answer, ColorId, CountDecor, DecorId, ObjId, PetId, QKind } from "./scene";

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
  // Questions entre joueurs
  centerTitle: string;
  centerText: string;
  turnsLabel: string;
  centerBtn: string;
  turnChip: (i: number, n: number) => string;
  orderLabel: string;
  askTitle: (name: string) => string;
  askWho: string;
  answersAloud: (name: string) => string;
  beware: string;
  ideaBtn: string;
  ideaAnother: string;
  ideaNone: string;
  ideaTag: string;
  /** La question d'idée, adressée à la cible si elle est choisie */
  ask: (name: string | null, q: string) => string;
  nextTurn: string;
  nextTurnPick: string;
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
  askedTitle: string;
  noneAsked: string;
  moreDetails: string;
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
  acc: Record<Acc | "none", string>;
  hour: (h: number) => string;
  question: (q: QKind) => string;
}

/** « Tom, combien de… » : minuscule après le prénom (en sautant ¿ ¡ en espagnol). */
const lcFirst = (q: string) => q.replace(/^([¿¡]?)(\p{L})/u, (_, p: string, c: string) => p + c.toLowerCase());
const addressed = (name: string | null, q: string) => (name ? `${name}, ${lcFirst(q)}` : q);
const COLOR_LC: Record<"fr" | "en" | "es", Record<ColorId, string>> = {
  fr: { red: "rouge", yellow: "jaune", blue: "bleu", green: "vert", pink: "rose", purple: "violet", orange: "orange" },
  en: { red: "red", yellow: "yellow", blue: "blue", green: "green", pink: "pink", purple: "purple", orange: "orange" },
  es: { red: "rojo", yellow: "amarillo", blue: "azul", green: "verde", pink: "rosa", purple: "morado", orange: "naranja" },
};

// ── Français ─────────────────────────────────────────────
const FEATURE_FR: Record<DecorId, string> = {
  kitchen: "le frigo", beach: "le parasol", party: "le canapé", street: "la voiture", classroom: "le bureau du prof",
  forest: "la tente", tvset: "le pupitre", pool: "la bouée", club: "la cabine du DJ", wedding: "l'arche de fleurs", park: "le banc",
  bank: "le coffre-fort", supermarket: "le chariot", metro: "la rame de métro", camping: "la caravane", gym: "le sac de frappe",
  birthday: "le gâteau d'anniversaire", airport: "la valise", hospital: "la couverture du lit", concert: "la grosse caisse",
  zoo: "l'écharpe de la girafe", funfair: "la grande roue", laundromat: "la machine à laver du milieu", office: "la photocopieuse",
  schoolyard: "le toit de l'école", christmas: "les boules du sapin", hotel: "le comptoir de la réception",
  cruise: "la cheminée du bateau", worksite: "la grue", farm: "la grange", museum: "le cadre du grand tableau",
  salon: "le fauteuil du coiffeur", train: "le chariot du bar", festival: "le food truck", restaurant: "la grande marmite",
};
const COUNT_FR: Record<CountDecor, string> = {
  bank: "Combien de lingots d'or y avait-il devant le coffre-fort ?",
  supermarket: "Combien d'articles y avait-il dans le chariot ?",
  metro: "Combien de fenêtres avait la rame de métro ?",
  camping: "Combien de guimauves y avait-il sur la pique ?",
  gym: "Combien de kettlebells y avait-il par terre ?",
  birthday: "Combien de bougies y avait-il sur le gâteau ?",
  airport: "Combien d'autocollants y avait-il sur la valise ?",
  hospital: "Combien de fleurs y avait-il dans le vase ?",
  concert: "Combien de projecteurs éclairaient la scène ?",
  zoo: "Combien de manchots y avait-il ?",
  funfair: "Combien de nacelles avait la grande roue ?",
  laundromat: "Combien de chaussettes séchaient sur le fil ?",
  office: "Combien de pense-bêtes y avait-il sur le tableau ?",
  schoolyard: "Combien de fenêtres avait l'école ?",
  christmas: "Combien de boules y avait-il dans le sapin ?",
  hotel: "Combien de clés étaient accrochées au tableau ?",
  cruise: "Combien de mouettes volaient dans le ciel ?",
  worksite: "Combien de cônes de chantier y avait-il ?",
  farm: "Combien de poules y avait-il devant la grange ?",
  museum: "Combien de pommes y avait-il dans le tableau ?",
  salon: "Combien de flacons y avait-il sur l'étagère ?",
  train: "Combien de vaches voyait-on par la fenêtre ?",
  festival: "Combien de drapeaux flottaient sur le food truck ?",
  restaurant: "Combien de poêles étaient accrochées au mur ?",
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
  bank: "the safe", supermarket: "the shopping cart", metro: "the subway train", camping: "the caravan", gym: "the punching bag",
  birthday: "the birthday cake", airport: "the suitcase", hospital: "the blanket on the bed", concert: "the bass drum",
  zoo: "the giraffe's scarf", funfair: "the Ferris wheel", laundromat: "the washing machine in the middle", office: "the photocopier",
  schoolyard: "the school roof", christmas: "the Christmas tree baubles", hotel: "the reception desk",
  cruise: "the ship's funnel", worksite: "the crane", farm: "the barn", museum: "the frame of the big painting",
  salon: "the salon chair", train: "the snack trolley", festival: "the food truck", restaurant: "the big pot",
};
const COUNT_EN: Record<CountDecor, string> = {
  bank: "How many gold bars were in front of the safe?",
  supermarket: "How many items were in the shopping cart?",
  metro: "How many windows did the subway train have?",
  camping: "How many marshmallows were on the stick?",
  gym: "How many kettlebells were on the floor?",
  birthday: "How many candles were on the cake?",
  airport: "How many stickers were on the suitcase?",
  hospital: "How many flowers were in the vase?",
  concert: "How many spotlights were over the stage?",
  zoo: "How many penguins were there?",
  funfair: "How many cabins did the Ferris wheel have?",
  laundromat: "How many socks were drying on the line?",
  office: "How many sticky notes were on the board?",
  schoolyard: "How many windows did the school have?",
  christmas: "How many baubles were on the Christmas tree?",
  hotel: "How many keys were hanging on the board?",
  cruise: "How many seagulls were flying in the sky?",
  worksite: "How many traffic cones were there?",
  farm: "How many hens were in front of the barn?",
  museum: "How many apples were in the painting?",
  salon: "How many bottles were on the shelf?",
  train: "How many cows could you see out the window?",
  festival: "How many flags were on the food truck?",
  restaurant: "How many frying pans were hanging on the wall?",
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
  bank: "la caja fuerte", supermarket: "el carrito de la compra", metro: "el vagón del metro", camping: "la caravana", gym: "el saco de boxeo",
  birthday: "la tarta de cumpleaños", airport: "la maleta", hospital: "la manta de la cama", concert: "el bombo",
  zoo: "la bufanda de la jirafa", funfair: "la noria", laundromat: "la lavadora del centro", office: "la fotocopiadora",
  schoolyard: "el tejado del colegio", christmas: "las bolas del árbol de Navidad", hotel: "el mostrador de recepción",
  cruise: "la chimenea del barco", worksite: "la grúa", farm: "el granero", museum: "el marco del cuadro grande",
  salon: "el sillón de la peluquería", train: "el carrito de la cafetería", festival: "la furgoneta de comida", restaurant: "la olla grande",
};
const COUNT_ES: Record<CountDecor, string> = {
  bank: "¿Cuántos lingotes de oro había delante de la caja fuerte?",
  supermarket: "¿Cuántos productos había en el carrito?",
  metro: "¿Cuántas ventanas tenía el vagón del metro?",
  camping: "¿Cuántas nubes de golosina había en el palo?",
  gym: "¿Cuántas pesas rusas había en el suelo?",
  birthday: "¿Cuántas velas había en la tarta?",
  airport: "¿Cuántas pegatinas había en la maleta?",
  hospital: "¿Cuántas flores había en el jarrón?",
  concert: "¿Cuántos focos iluminaban el escenario?",
  zoo: "¿Cuántos pingüinos había?",
  funfair: "¿Cuántas cabinas tenía la noria?",
  laundromat: "¿Cuántos calcetines se secaban en el tendedero?",
  office: "¿Cuántas notas adhesivas había en el tablero?",
  schoolyard: "¿Cuántas ventanas tenía el colegio?",
  christmas: "¿Cuántas bolas había en el árbol de Navidad?",
  hotel: "¿Cuántas llaves colgaban del tablero?",
  cruise: "¿Cuántas gaviotas volaban por el cielo?",
  worksite: "¿Cuántos conos de obra había?",
  farm: "¿Cuántas gallinas había delante del granero?",
  museum: "¿Cuántas manzanas había en el cuadro?",
  salon: "¿Cuántos frascos había en la estantería?",
  train: "¿Cuántas vacas se veían por la ventana?",
  festival: "¿Cuántas banderas ondeaban sobre la furgoneta de comida?",
  restaurant: "¿Cuántas sartenes colgaban de la pared?",
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
      { title: "Regarde la scène", text: "Chacun son tour, 5 secondes pour mémoriser une scène. Sauf le Faux Témoin, qui ne voit rien." },
      { title: "Interrogez-vous", text: "À ton tour, pose une question sur la scène à qui tu veux. En panne ? Touche « Une idée de question ? »." },
      { title: "Démasquez-le", text: "Le Faux Témoin pose et répond aussi… au bluff. Votez ! Démasqué, il a une dernière chance." },
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
    fakeText: "Bluffe : pose des questions crédibles et écoute bien les réponses.",
    secondsLeft: (n) => `${n} s`,
    centerTitle: "Téléphone au centre !",
    centerText: "Chacun son tour, pose une question sur la scène à qui tu veux. Le Faux Témoin aussi… à vous de le griller !",
    turnsLabel: "Combien de tours de table ?",
    centerBtn: "Première question",
    turnChip: (i, n) => `Tour ${i}/${n}`,
    orderLabel: "Ordre de passage",
    askTitle: (name) => `${name}, pose ta question !`,
    askWho: "Tu interroges qui ?",
    answersAloud: (name) => `${name} répond à voix haute.`,
    beware: "Réponse floue ? Question bizarre ? Méfiance…",
    ideaBtn: "Une idée de question ?",
    ideaAnother: "Une autre",
    ideaNone: "Plus d'idées : invente ta question !",
    ideaTag: "Idée",
    ask: addressed,
    nextTurn: "Répondu ! Au suivant",
    nextTurnPick: "Touche qui tu interroges",
    toVote: "On vote !",
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
    askedTitle: "Les questions posées",
    noneAsked: "Pas d'idée tirée cette fois : vérifiez vos questions sur la scène !",
    moreDetails: "Tous les détails de la scène",
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
      bank: "Le braquage", supermarket: "Le supermarché", metro: "Le métro", camping: "Le camping", gym: "La salle de sport",
      birthday: "L'anniversaire", airport: "L'aéroport", hospital: "L'hôpital", concert: "Le concert", zoo: "Le zoo",
      funfair: "La fête foraine", laundromat: "La laverie", office: "L'open space", schoolyard: "La cour de récré",
      christmas: "Noël en famille", hotel: "L'hôtel", cruise: "La croisière", worksite: "Le chantier", farm: "La ferme",
      museum: "Le musée", salon: "Le salon de coiffure", train: "Le train", festival: "Le festival", restaurant: "La cuisine du resto",
    },
    color: { red: "Rouge", yellow: "Jaune", blue: "Bleu", green: "Vert", pink: "Rose", purple: "Violet", orange: "Orange" },
    obj: {
      pizza: "Une pizza", guitar: "Une guitare", gift: "Un cadeau", plant: "Une plante", ball: "Un ballon",
      trophy: "Une coupe", radio: "Une radio", cake: "Un gâteau", book: "Des livres",
    },
    pet: { cat: "Un chat", dog: "Un chien", duck: "Un canard" },
    acc: { hat: "Un chapeau", glasses: "Des lunettes", crown: "Une couronne", bow: "Un nœud papillon", none: "Rien" },
    hour: (h) => `${h} h`,
    question: (q) => {
      switch (q.t) {
        case "countBlobs": return "Combien de blobs y avait-il ?";
        case "countAcc": return `Combien de blobs portaient ${ACC_COUNT_FR[q.acc]} ?`;
        case "colorAcc": return `De quelle couleur était le blob ${ACC_WITH_FR[q.acc]} ?`;
        case "colorSleeper": return "Un blob dormait. De quelle couleur était-il ?";
        case "featureColor": return q.decor === "christmas" ? "De quelle couleur étaient les boules du sapin ?" : `De quelle couleur était ${FEATURE_FR[q.decor]} ?`;
        case "featureCount": return COUNT_FR[q.decor];
        case "colorCheer": return "Un blob levait les bras. De quelle couleur était-il ?";
        case "clock": return "Quelle heure indiquait l'horloge ?";
        case "sign": return "Quel nombre était écrit sur le panneau ?";
        case "balloonsCount": return "Combien y avait-il de ballons de baudruche ?";
        case "balloonsColor": return "De quelle couleur étaient les ballons de baudruche ?";
        case "tableItem": return "Qu'est-ce qui était posé sur la table ?";
        case "pet": return "Quel animal se cachait dans la scène ?";
        case "objColor": return OBJ_COLOR_FR[q.obj as ColorObj];
        case "objectPresent": return "Lequel de ces objets était dans la scène ?";
        case "blobLeft": return "De quelle couleur était le blob tout à gauche ?";
        case "blobRight": return "De quelle couleur était le blob tout à droite ?";
        case "wear": return `Que portait le blob ${COLOR_LC.fr[q.color]} ?`;
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
      { title: "Look at the scene", text: "One by one, 5 seconds to memorize a scene. Except the Fake Witness, who sees nothing." },
      { title: "Grill each other", text: "On your turn, ask anyone a question about the scene. Stuck? Tap \"Need a question idea?\"." },
      { title: "Unmask them", text: "The Fake Witness asks and answers too… by bluffing. Vote! If caught, they get one last chance." },
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
    fakeText: "Bluff: ask believable questions and listen closely to the answers.",
    secondsLeft: (n) => `${n}s`,
    centerTitle: "Phone in the middle!",
    centerText: "Take turns asking anyone a question about the scene. The Fake Witness asks too… so catch them out!",
    turnsLabel: "How many times around the table?",
    centerBtn: "First question",
    turnChip: (i, n) => `Lap ${i}/${n}`,
    orderLabel: "Turn order",
    askTitle: (name) => `${name}, ask a question!`,
    askWho: "Who are you asking?",
    answersAloud: (name) => `${name} answers out loud.`,
    beware: "Vague answer? Weird question? Suspicious…",
    ideaBtn: "Need a question idea?",
    ideaAnother: "Another one",
    ideaNone: "Out of ideas: make up your own!",
    ideaTag: "Idea",
    ask: addressed,
    nextTurn: "Answered! Next",
    nextTurnPick: "Tap who you're asking",
    toVote: "Let's vote!",
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
    askedTitle: "Questions asked",
    noneAsked: "No idea cards drawn this time: check your questions against the scene!",
    moreDetails: "Every detail of the scene",
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
      bank: "The bank heist", supermarket: "The supermarket", metro: "The subway", camping: "The campsite", gym: "The gym",
      birthday: "The birthday party", airport: "The airport", hospital: "The hospital", concert: "The concert", zoo: "The zoo",
      funfair: "The funfair", laundromat: "The laundromat", office: "The office", schoolyard: "The playground",
      christmas: "Christmas at home", hotel: "The hotel", cruise: "The cruise", worksite: "The building site", farm: "The farm",
      museum: "The museum", salon: "The hair salon", train: "The train", festival: "The festival", restaurant: "The restaurant kitchen",
    },
    color: { red: "Red", yellow: "Yellow", blue: "Blue", green: "Green", pink: "Pink", purple: "Purple", orange: "Orange" },
    obj: {
      pizza: "A pizza", guitar: "A guitar", gift: "A present", plant: "A plant", ball: "A ball",
      trophy: "A trophy", radio: "A boombox", cake: "A cake", book: "Books",
    },
    pet: { cat: "A cat", dog: "A dog", duck: "A duck" },
    acc: { hat: "A hat", glasses: "Glasses", crown: "A crown", bow: "A bow tie", none: "Nothing" },
    hour: (h) => `${h} o'clock`,
    question: (q) => {
      switch (q.t) {
        case "countBlobs": return "How many blobs were there?";
        case "countAcc": return `How many blobs were wearing ${ACC_COUNT_EN[q.acc]}?`;
        case "colorAcc": return `What color was the blob ${ACC_WITH_EN[q.acc]}?`;
        case "colorSleeper": return "One blob was asleep. What color was it?";
        case "featureColor": return q.decor === "christmas" ? "What color were the Christmas tree baubles?" : `What color was ${FEATURE_EN[q.decor]}?`;
        case "featureCount": return COUNT_EN[q.decor];
        case "colorCheer": return "One blob had its arms up. What color was it?";
        case "clock": return "What time did the clock say?";
        case "sign": return "What number was on the sign?";
        case "balloonsCount": return "How many balloons were there?";
        case "balloonsColor": return "What color were the balloons?";
        case "tableItem": return "What was on the table?";
        case "pet": return "Which animal was hiding in the scene?";
        case "objColor": return OBJ_COLOR_EN[q.obj as ColorObj];
        case "objectPresent": return "Which of these things was in the scene?";
        case "blobLeft": return "What color was the blob furthest to the left?";
        case "blobRight": return "What color was the blob furthest to the right?";
        case "wear": return `What was the ${COLOR_LC.en[q.color]} blob wearing?`;
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
      { title: "Mira la escena", text: "Por turnos, 5 segundos para memorizar una escena. Menos el Falso Testigo, que no ve nada." },
      { title: "Interrogaos", text: "En tu turno, hazle una pregunta sobre la escena a quien quieras. ¿Sin ideas? Toca «¿Una idea de pregunta?»." },
      { title: "Desenmascáralo", text: "El Falso Testigo también pregunta y responde… de farol. ¡Votad! Si lo pilláis, tiene una última oportunidad." },
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
    fakeText: "Marca un farol: haz preguntas creíbles y escucha bien las respuestas.",
    secondsLeft: (n) => `${n} s`,
    centerTitle: "¡Móvil en el centro!",
    centerText: "Por turnos, hazle una pregunta sobre la escena a quien quieras. El Falso Testigo también… ¡a pillarlo!",
    turnsLabel: "¿Cuántas vueltas de preguntas?",
    centerBtn: "Primera pregunta",
    turnChip: (i, n) => `Vuelta ${i}/${n}`,
    orderLabel: "Orden de turnos",
    askTitle: (name) => `${name}, ¡haz tu pregunta!`,
    askWho: "¿A quién preguntas?",
    answersAloud: (name) => `${name} responde en voz alta.`,
    beware: "¿Respuesta vaga? ¿Pregunta rara? Sospechoso…",
    ideaBtn: "¿Una idea de pregunta?",
    ideaAnother: "Otra",
    ideaNone: "No quedan ideas: ¡inventa tu pregunta!",
    ideaTag: "Idea",
    ask: addressed,
    nextTurn: "¡Respondido! Siguiente",
    nextTurnPick: "Toca a quién preguntas",
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
    askedTitle: "Las preguntas hechas",
    noneAsked: "Esta vez no salió ninguna idea: ¡comprobad vuestras preguntas en la escena!",
    moreDetails: "Todos los detalles de la escena",
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
      bank: "El atraco al banco", supermarket: "El supermercado", metro: "El metro", camping: "El camping", gym: "El gimnasio",
      birthday: "El cumpleaños", airport: "El aeropuerto", hospital: "El hospital", concert: "El concierto", zoo: "El zoo",
      funfair: "La feria", laundromat: "La lavandería", office: "La oficina", schoolyard: "El patio del colegio",
      christmas: "Navidad en familia", hotel: "El hotel", cruise: "El crucero", worksite: "La obra", farm: "La granja",
      museum: "El museo", salon: "La peluquería", train: "El tren", festival: "El festival", restaurant: "La cocina del restaurante",
    },
    color: { red: "Rojo", yellow: "Amarillo", blue: "Azul", green: "Verde", pink: "Rosa", purple: "Morado", orange: "Naranja" },
    obj: {
      pizza: "Una pizza", guitar: "Una guitarra", gift: "Un regalo", plant: "Una planta", ball: "Un balón",
      trophy: "Un trofeo", radio: "Un radiocasete", cake: "Una tarta", book: "Libros",
    },
    pet: { cat: "Un gato", dog: "Un perro", duck: "Un pato" },
    acc: { hat: "Un sombrero", glasses: "Gafas", crown: "Una corona", bow: "Una pajarita", none: "Nada" },
    hour: (h) => (h === 1 ? "La una" : `Las ${h}`),
    question: (q) => {
      switch (q.t) {
        case "countBlobs": return "¿Cuántos blobs había?";
        case "countAcc": return `¿Cuántos blobs llevaban ${ACC_COUNT_ES[q.acc]}?`;
        case "colorAcc": return `¿De qué color era el blob ${ACC_WITH_ES[q.acc]}?`;
        case "colorSleeper": return "Un blob estaba dormido. ¿De qué color era?";
        case "featureColor": return q.decor === "christmas" ? "¿De qué color eran las bolas del árbol de Navidad?" : `¿De qué color era ${FEATURE_ES[q.decor]}?`;
        case "featureCount": return COUNT_ES[q.decor];
        case "colorCheer": return "Un blob tenía los brazos en alto. ¿De qué color era?";
        case "clock": return "¿Qué hora marcaba el reloj?";
        case "sign": return "¿Qué número había en el cartel?";
        case "balloonsCount": return "¿Cuántos globos había?";
        case "balloonsColor": return "¿De qué color eran los globos?";
        case "tableItem": return "¿Qué había encima de la mesa?";
        case "pet": return "¿Qué animal se escondía en la escena?";
        case "objColor": return OBJ_COLOR_ES[q.obj as ColorObj];
        case "objectPresent": return "¿Cuál de estas cosas estaba en la escena?";
        case "blobLeft": return "¿De qué color era el blob más a la izquierda?";
        case "blobRight": return "¿De qué color era el blob más a la derecha?";
        case "wear": return `¿Qué llevaba el blob ${COLOR_LC.es[q.color]}?`;
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
    case "acc": return t.acc[a.v];
  }
}
