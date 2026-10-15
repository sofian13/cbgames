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
  // Réglage du nombre de Faux Témoins
  fakesLabel: string;
  fakeTitleMulti: string;
  fakeTextMulti: (k: number) => string;
  // Ordre des questions (tout se passe à l'oral)
  orderTitle: string;
  orderText: string;
  orderFakes: (k: number) => string;
  orderChip: (i: number) => string;
  orderLabel: string;
  pairLabel: (asker: string, target: string) => string;
  ideaBtn: string;
  ideaAnother: string;
  ideaNone: string;
  ideaTag: string;
  moreTurn: string;
  toVote: string;
  // Vote : on élimine une personne
  voteTitle: (k: number) => string;
  voteText: string;
  votePick: string;
  voteBtn: (name: string) => string;
  tieLink: string;
  tieTitle: string;
  tieText: string;
  tiePick: string;
  tieBtn: string;
  tieCancel: string;
  revoteChip: string;
  revoteText: string;
  tieRandom: string;
  outLabel: (names: string) => string;
  suspense: (name: string) => string;
  // Résultat d'une élimination
  caughtTitle: string;
  caughtText: (name: string, k: number) => string;
  innocentTitle: string;
  innocentText: (name: string) => string;
  stillFree: (k: number) => string;
  secretPts: (pts: number, k: number) => string;
  witnessPts: (pts: number) => string;
  leftFakes: (k: number) => string;
  remaining: (n: number, k: number) => string;
  danger: (k: number) => string;
  nextQuestions: string;
  fakesWinTitle: (k: number) => string;
  fakesWinText: (names: string, k: number) => string;
  fakesWinPts: (pts: number, k: number) => string;
  witnessesWinTitle: string;
  witnessesWinText: (k: number) => string;
  seeScene: string;
  // Révélation / scores
  revealTitle: string;
  revealWho: (names: string, k: number) => string;
  ideasTitle: string;
  moreDetails: string;
  recapTitle: string;
  evInnocent: (name: string, fakes: string, pts: number) => string;
  evCaught: (name: string, witnesses: string, pts: number) => string;
  evFakesWin: (names: string, pts: number, k: number) => string;
  evWitnessesWin: string;
  recapTotal: string;
  /** « et » pour joindre des prénoms */
  and: string;
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
      { title: "Interrogez-vous", text: "L'app tire l'ordre : chacun pose une question sur la scène à voix haute. Le tél, on n'y touche plus." },
      { title: "Éliminez un suspect", text: "À trois, pointez un suspect : il est éliminé. Innocent ? Le Faux Témoin marque et on repart pour un tour. Démasquez-le avant qu'il ne reste qu'un témoin face à lui !" },
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
    fakesLabel: "Combien de Faux Témoins ?",
    fakeTitleMulti: "Tu es un Faux Témoin : tu n'as rien vu !",
    fakeTextMulti: (k) => `Vous êtes ${k} Faux Témoins… mais tu ne sais pas qui sont les autres. Bluffe !`,
    orderTitle: "Interrogez-vous !",
    orderText: "Dans cet ordre, chacun pose UNE question sur la scène, à voix haute. Le Faux Témoin aussi… au bluff !",
    orderFakes: (k) => `Attention : ${k} Faux Témoins parmi vous.`,
    orderChip: (i) => `Tour de questions ${i}`,
    orderLabel: "Ordre des questions",
    pairLabel: (a, b) => `${a} interroge ${b}`,
    ideaBtn: "Une idée de question ?",
    ideaAnother: "Une autre",
    ideaNone: "Plus d'idées : inventez !",
    ideaTag: "Idée",
    moreTurn: "Encore un tour de questions",
    toVote: "On passe au vote",
    voteTitle: (k) => (k > 1 ? "Qui est un Faux Témoin ?" : "Qui est le Faux Témoin ?"),
    voteText: "À trois, tout le monde pointe un suspect du doigt. Touchez le prénom qui a le plus de voix : il est éliminé.",
    votePick: "Touchez un prénom",
    voteBtn: (name) => `Éliminer ${name}`,
    tieLink: "Égalité ?",
    tieTitle: "Égalité !",
    tieText: "Touchez les prénoms à égalité : vous revoterez seulement entre eux.",
    tiePick: "Touchez au moins 2 prénoms",
    tieBtn: "Revoter entre eux",
    tieCancel: "Annuler",
    revoteChip: "Revote",
    revoteText: "À trois, revotez seulement entre eux. Touchez le prénom qui a le plus de voix.",
    tieRandom: "Encore égalité ? Le hasard tranche",
    outLabel: (names) => `Hors jeu : ${names}`,
    suspense: (name) => `${name} était…`,
    caughtTitle: "Démasqué !",
    caughtText: (name, k) => (k > 1 ? `${name} était bien un Faux Témoin !` : `${name} était bien le Faux Témoin !`),
    innocentTitle: "Erreur judiciaire !",
    innocentText: (name) => `${name} avait vraiment vu la scène.`,
    stillFree: (k) => (k > 1 ? "Les Faux Témoins courent toujours…" : "Le Faux Témoin court toujours…"),
    secretPts: (pts, k) => (k > 1 ? `Chaque Faux Témoin encore en jeu marque +${pts}, en secret.` : `Il marque +${pts}, en secret.`),
    witnessPts: (pts) => `Les témoins encore en jeu marquent +${pts} chacun.`,
    remaining: (n, k) => `Encore en jeu : ${n} joueurs, dont ${k > 1 ? `${k} Faux Témoins` : "1 Faux Témoin"}.`,
    leftFakes: (k) => (k > 1 ? `Il reste ${k} Faux Témoins à démasquer.` : "Il reste 1 Faux Témoin à démasquer."),
    danger: (k) => (k > 1 ? "Attention : encore une erreur et les Faux Témoins gagnent !" : "Attention : encore une erreur et le Faux Témoin gagne !"),
    nextQuestions: "Nouveau tour de questions",
    fakesWinTitle: (k) => (k > 1 ? "Les Faux Témoins gagnent !" : "Le Faux Témoin gagne !"),
    fakesWinText: (names, k) => (k > 1
      ? `Plus assez de témoins pour les arrêter : ${names} ont bluffé jusqu'au bout.`
      : `Plus assez de témoins pour l'arrêter : ${names} a bluffé jusqu'au bout.`),
    fakesWinPts: (pts, k) => (k > 1 ? `Bonus victoire : +${pts} pour chaque Faux Témoin.` : `Bonus victoire : +${pts}.`),
    witnessesWinTitle: "Les témoins gagnent !",
    witnessesWinText: (k) => (k > 1 ? "Tous les Faux Témoins sont démasqués." : "Le Faux Témoin est démasqué."),
    seeScene: "Voir la scène",
    revealTitle: "La scène",
    revealWho: (names, k) => (k > 1 ? `Les Faux Témoins : ${names}` : `Le Faux Témoin : ${names}`),
    ideasTitle: "Les idées tirées",
    moreDetails: "Tous les détails de la scène",
    recapTitle: "Les points de la manche",
    evInnocent: (name, fakes, pts) => `Erreur sur ${name} : +${pts} pour ${fakes}`,
    evCaught: (name, witnesses, pts) => `${name} démasqué : +${pts} chacun pour ${witnesses}`,
    evFakesWin: (names, pts, k) => (k > 1 ? `Victoire des Faux Témoins : +${pts} pour ${names}` : `Victoire du Faux Témoin : +${pts} pour ${names}`),
    evWitnessesWin: "Victoire des témoins !",
    recapTotal: "Total de la manche",
    and: "et",
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
      { title: "Grill each other", text: "The app picks the order: everyone asks a question about the scene out loud. No more tapping the phone." },
      { title: "Kick out a suspect", text: "On three, point at a suspect: they're out. Innocent? The Fake Witness scores and you go again. Catch them before only one witness is left facing them!" },
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
    fakesLabel: "How many Fake Witnesses?",
    fakeTitleMulti: "You're a Fake Witness: you saw nothing!",
    fakeTextMulti: (k) => `There are ${k} Fake Witnesses… but you don't know who the others are. Bluff!`,
    orderTitle: "Grill each other!",
    orderText: "In this order, everyone asks ONE question about the scene, out loud. The Fake Witness too… by bluffing!",
    orderFakes: (k) => `Heads up: ${k} Fake Witnesses among you.`,
    orderChip: (i) => `Question round ${i}`,
    orderLabel: "Question order",
    pairLabel: (a, b) => `${a} asks ${b}`,
    ideaBtn: "Need a question idea?",
    ideaAnother: "Another one",
    ideaNone: "Out of ideas: make one up!",
    ideaTag: "Idea",
    moreTurn: "One more round of questions",
    toVote: "Time to vote",
    voteTitle: (k) => (k > 1 ? "Who's a Fake Witness?" : "Who's the Fake Witness?"),
    voteText: "On three, everyone points at a suspect. Tap the name with the most fingers pointed at it: they're out.",
    votePick: "Tap a name",
    voteBtn: (name) => `Kick out ${name}`,
    tieLink: "A tie?",
    tieTitle: "It's a tie!",
    tieText: "Tap the tied names: you'll vote again between them only.",
    tiePick: "Tap at least 2 names",
    tieBtn: "Vote again between them",
    tieCancel: "Cancel",
    revoteChip: "Revote",
    revoteText: "On three, vote again between them only. Tap the name with the most votes.",
    tieRandom: "Still a tie? Let chance decide",
    outLabel: (names) => `Out: ${names}`,
    suspense: (name) => `${name} was…`,
    caughtTitle: "Busted!",
    caughtText: (name, k) => (k > 1 ? `${name} really was a Fake Witness!` : `${name} really was the Fake Witness!`),
    innocentTitle: "Wrong person!",
    innocentText: (name) => `${name} really did see the scene.`,
    stillFree: (k) => (k > 1 ? "The Fake Witnesses are still on the loose…" : "The Fake Witness is still on the loose…"),
    secretPts: (pts, k) => (k > 1 ? `Every Fake Witness still in the game secretly scores +${pts}.` : `They secretly score +${pts}.`),
    witnessPts: (pts) => `Every witness still in the game scores +${pts}.`,
    remaining: (n, k) => `Still in the game: ${n} players, including ${k > 1 ? `${k} Fake Witnesses` : "1 Fake Witness"}.`,
    leftFakes: (k) => (k > 1 ? `${k} Fake Witnesses left to catch.` : "1 Fake Witness left to catch."),
    danger: (k) => (k > 1 ? "Careful: one more mistake and the Fake Witnesses win!" : "Careful: one more mistake and the Fake Witness wins!"),
    nextQuestions: "New round of questions",
    fakesWinTitle: (k) => (k > 1 ? "The Fake Witnesses win!" : "The Fake Witness wins!"),
    fakesWinText: (names, k) => (k > 1
      ? `Not enough witnesses left to stop them: ${names} bluffed all the way.`
      : `Not enough witnesses left to stop them: ${names} bluffed all the way.`),
    fakesWinPts: (pts, k) => (k > 1 ? `Win bonus: +${pts} for each Fake Witness.` : `Win bonus: +${pts}.`),
    witnessesWinTitle: "The witnesses win!",
    witnessesWinText: (k) => (k > 1 ? "Every Fake Witness has been caught." : "The Fake Witness has been caught."),
    seeScene: "See the scene",
    revealTitle: "The scene",
    revealWho: (names, k) => (k > 1 ? `Fake Witnesses: ${names}` : `Fake Witness: ${names}`),
    ideasTitle: "Ideas drawn",
    moreDetails: "Every detail of the scene",
    recapTitle: "Points this round",
    evInnocent: (name, fakes, pts) => `Wrong call on ${name}: +${pts} for ${fakes}`,
    evCaught: (name, witnesses, pts) => `${name} busted: +${pts} each for ${witnesses}`,
    evFakesWin: (names, pts, k) => (k > 1 ? `The Fake Witnesses win: +${pts} for ${names}` : `The Fake Witness wins: +${pts} for ${names}`),
    evWitnessesWin: "The witnesses win!",
    recapTotal: "Round total",
    and: "and",
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
      { title: "Interrogaos", text: "La app sortea el orden: cada uno hace una pregunta sobre la escena en voz alta. El móvil ya no se toca." },
      { title: "Eliminad a un sospechoso", text: "A la de tres, señalad a un sospechoso: queda eliminado. ¿Inocente? El Falso Testigo puntúa y otra ronda. ¡Pilladlo antes de que solo quede un testigo frente a él!" },
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
    fakesLabel: "¿Cuántos Falsos Testigos?",
    fakeTitleMulti: "Eres un Falso Testigo: ¡no has visto nada!",
    fakeTextMulti: (k) => `Sois ${k} Falsos Testigos… pero no sabes quiénes son los demás. ¡Marca un farol!`,
    orderTitle: "¡Interrogaos!",
    orderText: "En este orden, cada uno hace UNA pregunta sobre la escena, en voz alta. El Falso Testigo también… ¡de farol!",
    orderFakes: (k) => `Ojo: hay ${k} Falsos Testigos entre vosotros.`,
    orderChip: (i) => `Ronda de preguntas ${i}`,
    orderLabel: "Orden de las preguntas",
    pairLabel: (a, b) => `${a} le pregunta a ${b}`,
    ideaBtn: "¿Una idea de pregunta?",
    ideaAnother: "Otra",
    ideaNone: "No quedan ideas: ¡inventad!",
    ideaTag: "Idea",
    moreTurn: "Otra ronda de preguntas",
    toVote: "¡A votar!",
    voteTitle: (k) => (k > 1 ? "¿Quién es un Falso Testigo?" : "¿Quién es el Falso Testigo?"),
    voteText: "A la de tres, todos señaláis a un sospechoso. Tocad el nombre con más votos: queda eliminado.",
    votePick: "Toca un nombre",
    voteBtn: (name) => `Eliminar a ${name}`,
    tieLink: "¿Empate?",
    tieTitle: "¡Empate!",
    tieText: "Tocad los nombres empatados: volveréis a votar solo entre ellos.",
    tiePick: "Tocad al menos 2 nombres",
    tieBtn: "Votar otra vez entre ellos",
    tieCancel: "Cancelar",
    revoteChip: "Desempate",
    revoteText: "A la de tres, votad otra vez solo entre ellos. Tocad el nombre con más votos.",
    tieRandom: "¿Otra vez empate? Que decida el azar",
    outLabel: (names) => `Eliminados: ${names}`,
    suspense: (name) => `${name} era…`,
    caughtTitle: "¡Pillado!",
    caughtText: (name, k) => (k > 1 ? `¡${name} era un Falso Testigo!` : `¡${name} era el Falso Testigo!`),
    innocentTitle: "¡Error judicial!",
    innocentText: (name) => `${name} sí había visto la escena.`,
    stillFree: (k) => (k > 1 ? "Los Falsos Testigos siguen sueltos…" : "El Falso Testigo sigue suelto…"),
    secretPts: (pts, k) => (k > 1 ? `Cada Falso Testigo que sigue en juego gana +${pts}, en secreto.` : `Gana +${pts}, en secreto.`),
    witnessPts: (pts) => `Cada testigo que sigue en juego gana +${pts}.`,
    remaining: (n, k) => `Siguen en juego: ${n} jugadores, ${k > 1 ? `${k} de ellos Falsos Testigos` : "uno de ellos Falso Testigo"}.`,
    leftFakes: (k) => (k > 1 ? `Quedan ${k} Falsos Testigos por desenmascarar.` : "Queda 1 Falso Testigo por desenmascarar."),
    danger: (k) => (k > 1 ? "Ojo: un error más y ganan los Falsos Testigos." : "Ojo: un error más y gana el Falso Testigo."),
    nextQuestions: "Nueva ronda de preguntas",
    fakesWinTitle: (k) => (k > 1 ? "¡Ganan los Falsos Testigos!" : "¡Gana el Falso Testigo!"),
    fakesWinText: (names, k) => (k > 1
      ? `Ya no quedan testigos suficientes para pararlos: ${names} se marcaron un farol hasta el final.`
      : `Ya no quedan testigos suficientes para pararlo: ${names} se marcó un farol hasta el final.`),
    fakesWinPts: (pts, k) => (k > 1 ? `Bonus de victoria: +${pts} para cada Falso Testigo.` : `Bonus de victoria: +${pts}.`),
    witnessesWinTitle: "¡Ganan los testigos!",
    witnessesWinText: (k) => (k > 1 ? "Todos los Falsos Testigos han sido desenmascarados." : "El Falso Testigo ha sido desenmascarado."),
    seeScene: "Ver la escena",
    revealTitle: "La escena",
    revealWho: (names, k) => (k > 1 ? `Los Falsos Testigos: ${names}` : `El Falso Testigo: ${names}`),
    ideasTitle: "Las ideas sacadas",
    moreDetails: "Todos los detalles de la escena",
    recapTitle: "Los puntos de la ronda",
    evInnocent: (name, fakes, pts) => `Error con ${name}: +${pts} para ${fakes}`,
    evCaught: (name, witnesses, pts) => `${name}, pillado: +${pts} para cada uno de ${witnesses}`,
    evFakesWin: (names, pts, k) => (k > 1 ? `Ganan los Falsos Testigos: +${pts} para ${names}` : `Gana el Falso Testigo: +${pts} para ${names}`),
    evWitnessesWin: "¡Ganan los testigos!",
    recapTotal: "Total de la ronda",
    and: "y",
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
