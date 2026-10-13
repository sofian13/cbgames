// Textes d'interface de « De 1 à 10 » (mode local + écrans partagés), FR · EN · ES.
import type { I18n } from "@/lib/i18n";

type Pack = "adult" | "culture";

interface Scale {
  /** Mot court sur les pastilles (« Soft », « Hard ») */
  low: string;
  high: string;
  /** Pastille sous le numéro secret (moitié basse / haute) */
  chipLow: string;
  chipHigh: string;
  /** Titre de l'écran de classement */
  rankTitle: string;
  /** Consigne sur l'écran « passe le tél » avant de classer */
  passRankHint: string;
}

interface TTStrings {
  gameName: string;
  tagline: string;
  packLabel: Record<Pack, string>;
  scale: Record<Pack, Scale>;
  rerollTheme: string;
  dealNumbers: string;
  passNumberHint: (low: string, range: number, high: string) => string;
  yourNumber: (name: string) => string;
  seenHide: string;
  /** « Chacun répond <b>à voix haute</b>… <b>chacun</b> classera… » : 5 morceaux, gras sur 2 et 4 */
  answerHelp: [string, string, string, string, string];
  everyoneSpoke: string;
  itsMeRank: string;
  trueRanking: string;
  whoNailedIt: string;
  perfect: string;
  pairs: (c: number, t: number) => string;
  seeScores: string;
  nextRound: string;
  tieTop: string;
  bestInstinct: (name: string) => string;
  playAgain: string;
  changePlayers: string;
  backHome: string;
  roundOf: (r: number, t: number) => string;
  fromOneTo: (range: number) => string;
  rangeLabels: { 10: string; 25: string; 50: string };
  packs: Record<Pack, { label: string; sub: string }>;
  themesTitle: string;
  numbersUpTo: string;
  rangeHelp: string;
  startGame: string;
  sharedHint: string;
  editPlayers: string;
  outOf: (range: number) => string;
  numberHelp: string;
  ranks: (name: string) => string;
  rankHelp: string;
  dragAria: string;
  me: string;
  moveUp: (name: string) => string;
  moveDown: (name: string) => string;
  sent: (n: number, total: number) => string;
  rankingSent: string;
  submitRanking: string;
  /** Version découverte : « 30 thèmes offerts » */
  freeThemes: (n: number) => string;
}

export const TT_STR: I18n<TTStrings> = {
  fr: {
    gameName: "De 1 à 10",
    tagline: "Un thème, un numéro secret (de 1 à 10, 25 ou 50). Chacun répond à voix haute selon son numéro… puis chacun classe toute la table, lui compris. Deux ambiances : Soirée 18+ ou Culture pop (classements animés, villes, foot…).",
    packLabel: { adult: "Thème 18+", culture: "Culture pop" },
    scale: {
      adult: {
        low: "Soft", high: "Hard", chipLow: "plus soft", chipHigh: "plus hard",
        rankTitle: "Classe-les du plus soft au plus hard",
        passRankHint: "Personne ne regarde ! Classe toute la table (toi compris) du plus soft au plus hard.",
      },
      culture: {
        low: "Faible", high: "Fort", chipLow: "plus faible", chipHigh: "plus fort",
        rankTitle: "Classe-les du plus faible au plus fort",
        passRankHint: "Personne ne regarde ! Classe toute la table (toi compris) du plus faible au plus fort.",
      },
    },
    rerollTheme: "Pas fou ? Un autre thème",
    dealNumbers: "Distribuer les numéros",
    passNumberHint: (lo, r, hi) => `Toi seul : tu vas voir ton numéro secret, de 1 (${lo}) à ${r} (${hi}).`,
    yourNumber: (n) => `${n}, ton numéro`,
    seenHide: "J'ai vu, je cache",
    answerHelp: ["Chacun répond ", "à voix haute", ", selon l'intensité de son numéro. Écoutez bien : ensuite ", "chacun", " classera toute la table."],
    everyoneSpoke: "Tout le monde a parlé",
    itsMeRank: "C'est moi, je classe",
    trueRanking: "Le vrai classement",
    whoNailedIt: "Qui a eu le flair ?",
    perfect: "Parfait !",
    pairs: (c, t) => `${c}/${t} paires`,
    seeScores: "Voir les scores",
    nextRound: "Manche suivante",
    tieTop: "Égalité au sommet !",
    bestInstinct: (n) => `${n} a le meilleur flair`,
    playAgain: "Rejouer",
    changePlayers: "Changer les joueurs",
    backHome: "Retour à l'accueil",
    roundOf: (r, t) => `Manche ${r}/${t}`,
    fromOneTo: (r) => `De 1 à ${r}`,
    rangeLabels: { 10: "Classique", 25: "Nuance", 50: "Sniper" },
    packs: {
      adult: { label: "Soirée 18+", sub: "Thèmes osés et malaise" },
      culture: { label: "Culture pop", sub: "Animés, villes, foot…" },
    },
    themesTitle: "Les thèmes",
    numbersUpTo: "Les numéros vont jusqu'à",
    rangeHelp: "Chacun reçoit un numéro secret et répond à voix haute selon son intensité, puis chacun classe toute la table. Plus l'échelle est grande, plus il faut être précis.",
    startGame: "Lancer la partie",
    sharedHint: "N'importe qui peut changer l'échelle ou lancer.",
    editPlayers: "Modifier les joueurs",
    outOf: (r) => `sur ${r}`,
    numberHelp: "Donne une réponse à voix haute qui colle à l'intensité de ton numéro. Les autres devront te ranger au bon endroit !",
    ranks: (n) => `${n} classe`,
    rankHelp: "Toi compris ! Fais glisser avec la poignée ou utilise les flèches.",
    dragAria: "Glisser pour réordonner",
    me: " (toi)",
    moveUp: (n) => `Monter ${n}`,
    moveDown: (n) => `Descendre ${n}`,
    sent: (n, t) => `Envoyé, ${n}/${t}…`,
    rankingSent: "Classement envoyé",
    submitRanking: "Valider mon classement",
    freeThemes: (n) => `${n} thèmes offerts`,
  },
  en: {
    gameName: "From 1 to 10",
    tagline: "A theme, a secret number (1 to 10, 25 or 50). Everyone answers out loud to match their number… then everyone ranks the whole table, themselves included. Two vibes: 18+ Party or Pop Culture (anime, cities, football rankings…).",
    packLabel: { adult: "18+ theme", culture: "Pop culture" },
    scale: {
      adult: {
        low: "Mild", high: "Wild", chipLow: "on the mild side", chipHigh: "on the wild side",
        rankTitle: "Rank them from mildest to wildest",
        passRankHint: "No peeking! Rank the whole table (you included) from mildest to wildest.",
      },
      culture: {
        low: "Low", high: "High", chipLow: "on the low side", chipHigh: "on the high side",
        rankTitle: "Rank them from lowest to highest",
        passRankHint: "No peeking! Rank the whole table (you included) from lowest to highest.",
      },
    },
    rerollTheme: "Meh? Another theme",
    dealNumbers: "Deal the numbers",
    passNumberHint: (lo, r, hi) => `Just you: you'll see your secret number, from 1 (${lo}) to ${r} (${hi}).`,
    yourNumber: (n) => `${n}, your number`,
    seenHide: "Seen it, hide it",
    answerHelp: ["Everyone answers ", "out loud", ", matching how high their number is. Listen up: next, ", "everyone", " ranks the whole table."],
    everyoneSpoke: "Everyone has answered",
    itsMeRank: "It's me, let me rank",
    trueRanking: "The real ranking",
    whoNailedIt: "Who read the room?",
    perfect: "Perfect!",
    pairs: (c, t) => `${c}/${t} pairs`,
    seeScores: "See the scores",
    nextRound: "Next round",
    tieTop: "It's a tie at the top!",
    bestInstinct: (n) => `${n} has the best instinct`,
    playAgain: "Play again",
    changePlayers: "Change players",
    backHome: "Back to home",
    roundOf: (r, t) => `Round ${r}/${t}`,
    fromOneTo: (r) => `1 to ${r}`,
    rangeLabels: { 10: "Classic", 25: "Subtle", 50: "Sniper" },
    packs: {
      adult: { label: "18+ Party", sub: "Spicy and awkward themes" },
      culture: { label: "Pop culture", sub: "Anime, cities, football…" },
    },
    themesTitle: "Themes",
    numbersUpTo: "Numbers go up to",
    rangeHelp: "Everyone gets a secret number and answers out loud to match it, then everyone ranks the whole table. The bigger the scale, the sharper you need to be.",
    startGame: "Start the game",
    sharedHint: "Anyone can change the scale or start.",
    editPlayers: "Edit players",
    outOf: (r) => `out of ${r}`,
    numberHelp: "Give an answer out loud that matches how high your number is. The others will have to place you in the right spot!",
    ranks: (n) => `${n} is ranking`,
    rankHelp: "You included! Drag with the handle or use the arrows.",
    dragAria: "Drag to reorder",
    me: " (you)",
    moveUp: (n) => `Move ${n} up`,
    moveDown: (n) => `Move ${n} down`,
    sent: (n, t) => `Sent, ${n}/${t}…`,
    rankingSent: "Ranking sent",
    submitRanking: "Lock in my ranking",
    freeThemes: (n) => `${n} free themes`,
  },
  es: {
    gameName: "Del 1 al 10",
    tagline: "Un tema, un número secreto (del 1 al 10, 25 o 50). Cada uno responde en voz alta según su número… y luego todos ordenan a la mesa entera, incluidos ellos mismos. Dos ambientes: Fiesta +18 o Cultura pop (anime, ciudades, fútbol…).",
    packLabel: { adult: "Tema +18", culture: "Cultura pop" },
    scale: {
      adult: {
        low: "Suave", high: "Fuerte", chipLow: "tirando a suave", chipHigh: "tirando a fuerte",
        rankTitle: "Ordénalos del más suave al más fuerte",
        passRankHint: "¡Que nadie mire! Ordena a toda la mesa (tú incluido) del más suave al más fuerte.",
      },
      culture: {
        low: "Bajo", high: "Alto", chipLow: "tirando a bajo", chipHigh: "tirando a alto",
        rankTitle: "Ordénalos del más bajo al más alto",
        passRankHint: "¡Que nadie mire! Ordena a toda la mesa (tú incluido) del más bajo al más alto.",
      },
    },
    rerollTheme: "¿No mola? Otro tema",
    dealNumbers: "Repartir los números",
    passNumberHint: (lo, r, hi) => `Solo tú: vas a ver tu número secreto, del 1 (${lo}) al ${r} (${hi}).`,
    yourNumber: (n) => `${n}, tu número`,
    seenHide: "Visto, lo escondo",
    answerHelp: ["Cada uno responde ", "en voz alta", ", según la intensidad de su número. Atención: después ", "cada uno", " ordenará a toda la mesa."],
    everyoneSpoke: "Ya ha hablado todo el mundo",
    itsMeRank: "Soy yo, voy a ordenar",
    trueRanking: "El orden real",
    whoNailedIt: "¿Quién tuvo buen olfato?",
    perfect: "¡Perfecto!",
    pairs: (c, t) => `${c}/${t} parejas`,
    seeScores: "Ver las puntuaciones",
    nextRound: "Siguiente ronda",
    tieTop: "¡Empate en la cima!",
    bestInstinct: (n) => `${n} tiene el mejor olfato`,
    playAgain: "Volver a jugar",
    changePlayers: "Cambiar jugadores",
    backHome: "Volver al inicio",
    roundOf: (r, t) => `Ronda ${r}/${t}`,
    fromOneTo: (r) => `Del 1 al ${r}`,
    rangeLabels: { 10: "Clásico", 25: "Matices", 50: "Experto" },
    packs: {
      adult: { label: "Fiesta +18", sub: "Temas atrevidos e incómodos" },
      culture: { label: "Cultura pop", sub: "Anime, ciudades, fútbol…" },
    },
    themesTitle: "Los temas",
    numbersUpTo: "Los números llegan hasta",
    rangeHelp: "Cada uno recibe un número secreto y responde en voz alta según su intensidad; luego todos ordenan a la mesa entera. Cuanto más grande la escala, más precisión hace falta.",
    startGame: "Empezar la partida",
    sharedHint: "Cualquiera puede cambiar la escala o empezar.",
    editPlayers: "Editar jugadores",
    outOf: (r) => `de ${r}`,
    numberHelp: "Da en voz alta una respuesta que encaje con la intensidad de tu número. ¡Los demás tendrán que colocarte en tu sitio!",
    ranks: (n) => `Turno de ${n}`,
    rankHelp: "¡Tú incluido! Arrastra con el asa o usa las flechas.",
    dragAria: "Arrastrar para reordenar",
    me: " (tú)",
    moveUp: (n) => `Subir a ${n}`,
    moveDown: (n) => `Bajar a ${n}`,
    sent: (n, t) => `Enviado, ${n}/${t}…`,
    rankingSent: "Orden enviado",
    submitRanking: "Confirmar mi orden",
    freeThemes: (n) => `${n} temas gratis`,
  },
};
