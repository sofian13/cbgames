// Textes d'interface de « Tu préfères ? », FR · EN · ES.
import type { I18n } from "@/lib/i18n";

type Cat = "classique" | "hot" | "absurde" | "couple";

interface TPStrings {
  gameName: string;
  /** Titre de l'écran d'accueil du jeu */
  title: string;
  intro: string;
  /** Feuille de règles (bouton livre) ; la ligne de peine dépend du réglage */
  rules: (sips: boolean, n: number) => string[];
  vibe: string;
  packs: Record<Cat, { label: string; tag: string }>;
  backHome: string;
  changeVibe: string;
  /** « Tu préfères… » au-dessus des deux options */
  prompt: string;
  or: string;
  countHandFor: (text: string) => string;
  hands: (n: number) => string;
  /** Pourcentage (FR/ES : espace insécable avant %, EN : collé) */
  pct: (n: number) => string;
  removeHand: string;
  tie: string;
  tableChose: (side: "A" | "B") => string;
  nextDilemma: string;
  raiseHands: string;
  reroll: string;
  seeResult: (n: number) => string;
  /** Réglage de la peine (camp minoritaire) */
  penaltyTitle: string;
  penaltyDares: { title: string; sub: string };
  penaltySips: { title: string; sub: string };
  penaltyChill: string;
  /** Réglage « Mode sans alcool » actif */
  penaltyNoAlc: string;
  /** Pastille sur la carte du camp minoritaire après révélation */
  minorityBadge: string;
  /** Égalité / unanimité : tout le monde prend la peine */
  everyoneTie: string;
  everyoneUnanimous: string;
  /** « Camp B (2 mains) prend la peine » */
  loserHead: (side: "A" | "B", n: number) => string;
  /** Gorgées pour chaque membre du camp minoritaire (n ≤ 3) */
  sipsEach: (n: number) => string;
  /** Une seule main dans la minorité : seul(e) contre tous */
  sipsSolo: (n: number) => string;
  orDare: string;
  dareOnly: string;
  waterOk: string;
  /** Gages courts, faisables par une ou plusieurs personnes */
  dares: string[];
  /** Gages pour toute la table (égalité / unanimité) */
  groupDares: string[];
  /** Dernier dilemme de la partie : bouton vers l'écran de fin */
  seeRecap: string;
  /** Écran de fin (bilan) */
  endTitle: (unanimous: number, played: number) => string;
  endSub: (n: number) => string;
  statPlayed: string;
  statUnanimous: string;
  closestTitle: string;
  /** Répartition des mains du dilemme le plus serré */
  closestSplit: (a: number, b: number) => string;
  noClosest: string;
  again: (n: number) => string;
  /** Version découverte (app sans Zinzin+) */
  freeDilemmas: (n: number) => string;
  restOfClassic: (n: number) => string;
}

export const TP_STR: I18n<TPStrings> = {
  fr: {
    gameName: "Tu préfères",
    title: "Tu préfères ?",
    intro: "Lisez le dilemme à voix haute. À 3, chacun lève la main pour A ou B, on compte les mains sur l'écran… et le camp minoritaire prend la peine. Égalité ou unanimité ? Tout le monde prend !",
    rules: (sips, n) => [
      "Lisez le dilemme à voix haute : « Tu préfères A… ou B ? »",
      "À 3, chacun lève la main pour A ou B. Une personne compte : un tap sur la carte A ou B par main levée. Le bouton − corrige une erreur.",
      "Touchez « Voir le résultat » : le pourcentage de la table s'affiche.",
      sips
        ? "Le camp minoritaire prend la peine : 1 à 2 gorgées de zinzin chacun (eau acceptée) ou un gage. Égalité ou unanimité : tout le monde prend !"
        : "Le camp minoritaire fait un gage. Égalité ou unanimité : tout le monde fait le gage !",
      `« Dilemme suivant » pour continuer. Une partie = ${n} dilemmes, puis le bilan. Touche l'étiquette d'ambiance en haut pour en changer.`,
    ],
    vibe: "L'ambiance",
    packs: {
      classique: { label: "Classique", tag: "Pour tout le monde" },
      hot: { label: "Chaud", tag: "18+ entre potes" },
      absurde: { label: "Absurde", tag: "Pour les tordus" },
      couple: { label: "Couple", tag: "À deux" },
    },
    backHome: "Retour à l'accueil",
    changeVibe: "Changer d'ambiance",
    prompt: "Tu préfères…",
    or: "ou",
    countHandFor: (t) => `Compter une main pour : ${t}`,
    hands: (n) => `${n} main${n > 1 ? "s" : ""}`,
    pct: (n) => `${n}\u00A0%`,
    removeHand: "Retirer une main",
    tie: "Égalité parfaite, la table est coupée en deux !",
    tableChose: (s) => `La table a choisi ${s} !`,
    nextDilemma: "Dilemme suivant",
    raiseHands: "À 3, chacun lève la main pour A ou B. Touchez une carte une fois par main levée. La minorité prend la peine (égalité ou unanimité : tout le monde) !",
    reroll: "Pas fou ? Un autre",
    seeResult: (n) => `Voir le résultat (${n} main${n > 1 ? "s" : ""})`,
    penaltyTitle: "La minorité prend…",
    penaltyDares: { title: "Un gage", sub: "Zéro gorgée" },
    penaltySips: { title: "Des gorgées", sub: "1 à 2, ou un gage" },
    penaltyChill: "Ambiance chill : le camp minoritaire fait un gage (égalité ou unanimité : tout le monde).",
    penaltyNoAlc: "Que des gages : le camp minoritaire fait un gage (égalité ou unanimité : tout le monde).",
    minorityBadge: "Minorité",
    everyoneTie: "Égalité : tout le monde prend !",
    everyoneUnanimous: "Unanimité : pas de minorité… donc tout le monde prend !",
    loserHead: (s, n) => `Camp ${s} (${n} main${n > 1 ? "s" : ""}) prend la peine`,
    sipsEach: (n) => `${n} gorgée${n > 1 ? "s" : ""} de zinzin chacun`,
    sipsSolo: (n) => `Seul contre tous : ${n} gorgée${n > 1 ? "s" : ""} de zinzin`,
    orDare: "ou le gage :",
    dareOnly: "Gage :",
    waterOk: "Eau ou soft acceptés.",
    dares: [
      "Défendre ton choix pendant 15 secondes sans rire",
      "Imiter quelqu'un du camp gagnant pendant 10 secondes",
      "Faire un vrai compliment à quelqu'un du camp gagnant",
      "Parler avec un accent jusqu'au prochain dilemme",
      "Chanter un refrain choisi par le groupe",
      "Faire 5 squats en criant « j'avais raison »",
      "Rester debout jusqu'au prochain dilemme",
      "Raconter le dernier truc gênant qui t'est arrivé",
      "Faire ton meilleur cri d'animal",
      "Lire le prochain dilemme avec une voix de robot",
      "Ne plus dire « oui » ni « non » pendant 2 dilemmes",
      "Faire une danse de la victoire pour le camp gagnant",
      "Laisser le camp gagnant te donner un surnom pour la partie",
      "Mimer ton choix sans parler jusqu'à ce que le groupe devine",
      "Faire une déclaration d'amour à ton choix, avec émotion",
    ],
    groupDares: [
      "Tout le monde fait sa pire grimace pendant 5 secondes, photo de groupe à l'appui",
      "Tout le monde crie le même mot à 3 (sans se concerter)",
      "Tout le monde échange de place avec son voisin de gauche",
      "Tout le monde parle avec un accent jusqu'au prochain dilemme",
      "Tout le monde fait une danse de la victoire de 5 secondes, en même temps",
      "Tout le monde imite le cri d'un animal choisi par le plus jeune",
      "Tout le monde reste debout jusqu'au prochain dilemme",
      "Chacun fait un compliment à son voisin de droite",
      "Tout le monde chante le même refrain, choisi par le plus âgé",
      "Tout le monde fait 5 squats en même temps en comptant à voix haute",
    ],
    seeRecap: "Voir le bilan",
    endTitle: (u, p) => (u * 2 >= p ? "Une bande de clones !" : u === 0 ? "Zéro consensus !" : "Débat clos !"),
    endSub: (n) => `${n} dilemmes tranchés, zéro regret.`,
    statPlayed: "Dilemmes joués",
    statUnanimous: "Unanimes",
    closestTitle: "Le plus serré",
    closestSplit: (a, b) => `${a} main${a > 1 ? "s" : ""} contre ${b}`,
    noClosest: "Pas assez de mains pour trouver un dilemme serré. La prochaine fois, tout le monde vote !",
    again: (n) => `Encore ${n}`,
    freeDilemmas: (n) => `${n} dilemmes offerts`,
    restOfClassic: (n) => `Tout le Classique · ${n} dilemmes de plus`,
  },
  en: {
    gameName: "Would You Rather",
    title: "Would You Rather?",
    intro: "Read the dilemma out loud. On 3, everyone raises a hand for A or B, you count the hands on screen… and the minority side takes the penalty. A tie or everyone agrees? Everyone takes it!",
    rules: (sips, n) => [
      "Read the dilemma out loud: \"Would you rather A… or B?\"",
      "On 3, everyone raises a hand for A or B. One person counts: one tap on card A or B per raised hand. The − button fixes a mistake.",
      "Tap \"See the result\": the table's percentage shows up.",
      sips
        ? "The minority side takes the penalty: 1 to 2 zinzin sips each (water's fine) or a dare. A tie or everyone agrees? Everyone takes it!"
        : "The minority side does a dare. A tie or everyone agrees? Everyone does the dare!",
      `"Next dilemma" to keep going. A game = ${n} dilemmas, then the recap. Tap the vibe tag at the top to change it.`,
    ],
    vibe: "Pick a vibe",
    packs: {
      classique: { label: "Classic", tag: "For everyone" },
      hot: { label: "Spicy", tag: "18+ with friends" },
      absurde: { label: "Absurd", tag: "For twisted minds" },
      couple: { label: "Couples", tag: "For two" },
    },
    backHome: "Back to home",
    changeVibe: "Change vibe",
    prompt: "Would you rather…",
    or: "or",
    countHandFor: (t) => `Count one hand for: ${t}`,
    hands: (n) => `${n} hand${n === 1 ? "" : "s"}`,
    pct: (n) => `${n}%`,
    removeHand: "Remove a hand",
    tie: "Dead even, the table is split down the middle!",
    tableChose: (s) => `The table picked ${s}!`,
    nextDilemma: "Next dilemma",
    raiseHands: "On 3, everyone raises a hand for A or B. Tap a card once per raised hand. The minority takes the penalty (tie or unanimous: everyone does)!",
    reroll: "Meh? Another one",
    seeResult: (n) => `See the result (${n} hand${n === 1 ? "" : "s"})`,
    penaltyTitle: "The minority gets…",
    penaltyDares: { title: "A dare", sub: "Zero sips" },
    penaltySips: { title: "Sips", sub: "1 or 2, or a dare" },
    penaltyChill: "Chill vibe: the minority does a dare (tie or unanimous: everyone does).",
    penaltyNoAlc: "Dares only: the minority does a dare (tie or unanimous: everyone does).",
    minorityBadge: "Minority",
    everyoneTie: "It's a tie: everyone takes it!",
    everyoneUnanimous: "Unanimous: no minority… so everyone takes it!",
    loserHead: (s, n) => `Side ${s} (${n} hand${n === 1 ? "" : "s"}) takes the penalty`,
    sipsEach: (n) => `${n} zinzin sip${n === 1 ? "" : "s"} each`,
    sipsSolo: (n) => `Alone against everyone: ${n} zinzin sip${n === 1 ? "" : "s"}`,
    orDare: "or the dare:",
    dareOnly: "Dare:",
    waterOk: "Water or soft drinks are fine.",
    dares: [
      "Defend your choice for 15 seconds without laughing",
      "Impersonate someone from the winning side for 10 seconds",
      "Give someone on the winning side a genuine compliment",
      "Talk in an accent until the next dilemma",
      "Sing a chorus picked by the group",
      "Do 5 squats shouting “I was right”",
      "Stay standing until the next dilemma",
      "Tell the last embarrassing thing that happened to you",
      "Do your best animal noise",
      "Read the next dilemma in a robot voice",
      "Don't say “yes” or “no” for 2 dilemmas",
      "Do a victory dance for the winning side",
      "Let the winning side give you a nickname for the game",
      "Mime your choice without talking until the group guesses it",
      "Make a heartfelt love declaration to your choice",
    ],
    groupDares: [
      "Everyone pulls their worst face for 5 seconds, group photo included",
      "Everyone shouts the same word on 3 (no planning allowed)",
      "Everyone swaps seats with the person on their left",
      "Everyone talks in an accent until the next dilemma",
      "Everyone does a 5-second victory dance, all at once",
      "Everyone does the animal noise picked by the youngest player",
      "Everyone stays standing until the next dilemma",
      "Everyone gives the person on their right a compliment",
      "Everyone sings the same chorus, picked by the oldest player",
      "Everyone does 5 squats together, counting out loud",
    ],
    seeRecap: "See the recap",
    endTitle: (u, p) => (u * 2 >= p ? "A bunch of clones!" : u === 0 ? "Zero agreement!" : "Debate closed!"),
    endSub: (n) => `${n} dilemmas settled, zero regrets.`,
    statPlayed: "Dilemmas played",
    statUnanimous: "Unanimous",
    closestTitle: "Closest call",
    closestSplit: (a, b) => `${a} hand${a === 1 ? "" : "s"} vs ${b}`,
    noClosest: "Not enough hands for a close call. Next time, everyone votes!",
    again: (n) => `${n} more`,
    freeDilemmas: (n) => `${n} free dilemmas`,
    restOfClassic: (n) => `All of Classic · ${n} more dilemmas`,
  },
  es: {
    gameName: "¿Qué prefieres?",
    title: "¿Qué prefieres?",
    intro: "Lee el dilema en voz alta. A la de 3, cada uno levanta la mano por la A o la B, se cuentan las manos en la pantalla… y el bando minoritario paga. ¿Empate o unanimidad? ¡Paga todo el mundo!",
    rules: (sips, n) => [
      "Leed el dilema en voz alta: «¿Qué prefieres, A… o B?»",
      "A la de 3, cada uno levanta la mano por la A o la B. Una persona cuenta: un toque en la carta A o B por cada mano. El botón − corrige un error.",
      "Tocad «Ver el resultado»: aparece el porcentaje de la mesa.",
      sips
        ? "El bando minoritario paga: 1 o 2 tragos de zinzin cada uno (vale agua) o un reto. ¿Empate o unanimidad? ¡Paga todo el mundo!"
        : "El bando minoritario hace un reto. ¿Empate o unanimidad? ¡Todo el mundo hace el reto!",
      `«Siguiente dilema» para seguir. Una partida = ${n} dilemas, y luego el resumen. Toca la etiqueta de ambiente de arriba para cambiarlo.`,
    ],
    vibe: "El ambiente",
    packs: {
      classique: { label: "Clásico", tag: "Para todo el mundo" },
      hot: { label: "Picante", tag: "+18 entre amigos" },
      absurde: { label: "Absurdo", tag: "Para mentes retorcidas" },
      couple: { label: "Pareja", tag: "Para dos" },
    },
    backHome: "Volver al inicio",
    changeVibe: "Cambiar de ambiente",
    prompt: "¿Qué prefieres?",
    or: "o",
    countHandFor: (t) => `Contar una mano para: ${t}`,
    hands: (n) => `${n} mano${n === 1 ? "" : "s"}`,
    pct: (n) => `${n}\u00A0%`,
    removeHand: "Quitar una mano",
    tie: "¡Empate total, la mesa está partida en dos!",
    tableChose: (s) => `¡La mesa eligió la ${s}!`,
    nextDilemma: "Siguiente dilema",
    raiseHands: "A la de 3, cada uno levanta la mano por la A o la B. Toca una carta una vez por mano. ¡La minoría paga (empate o unanimidad: todo el mundo)!",
    reroll: "¿No mola? Otra",
    seeResult: (n) => `Ver el resultado (${n} mano${n === 1 ? "" : "s"})`,
    penaltyTitle: "La minoría se lleva…",
    penaltyDares: { title: "Un reto", sub: "Cero tragos" },
    penaltySips: { title: "Tragos", sub: "1 o 2, o un reto" },
    penaltyChill: "Ambiente chill: la minoría hace un reto (empate o unanimidad: todo el mundo).",
    penaltyNoAlc: "Solo retos: la minoría hace un reto (empate o unanimidad: todo el mundo).",
    minorityBadge: "Minoría",
    everyoneTie: "Empate: ¡paga todo el mundo!",
    everyoneUnanimous: "Unanimidad: no hay minoría… ¡así que paga todo el mundo!",
    loserHead: (s, n) => `El bando ${s} (${n} mano${n === 1 ? "" : "s"}) paga`,
    sipsEach: (n) => `${n} trago${n === 1 ? "" : "s"} de zinzin cada uno`,
    sipsSolo: (n) => `Solo contra todos: ${n} trago${n === 1 ? "" : "s"} de zinzin`,
    orDare: "o el reto:",
    dareOnly: "Reto:",
    waterOk: "Vale agua o refresco.",
    dares: [
      "Defender tu elección 15 segundos sin reírte",
      "Imitar a alguien del bando ganador durante 10 segundos",
      "Hacerle un cumplido sincero a alguien del bando ganador",
      "Hablar con acento hasta el siguiente dilema",
      "Cantar un estribillo que elija el grupo",
      "Hacer 5 sentadillas gritando « tenía razón »",
      "Quedarte de pie hasta el siguiente dilema",
      "Contar lo último vergonzoso que te ha pasado",
      "Hacer tu mejor ruido de animal",
      "Leer el siguiente dilema con voz de robot",
      "No decir « sí » ni « no » durante 2 dilemas",
      "Hacer un baile de la victoria para el bando ganador",
      "Dejar que el bando ganador te ponga un apodo para la partida",
      "Hacer mímica de tu elección sin hablar hasta que el grupo acierte",
      "Declararle tu amor a tu elección, con emoción",
    ],
    groupDares: [
      "Todo el mundo pone su peor mueca 5 segundos, con foto de grupo",
      "Todo el mundo grita la misma palabra a la de 3 (sin ponerse de acuerdo)",
      "Todo el mundo cambia de sitio con quien tenga a la izquierda",
      "Todo el mundo habla con acento hasta el siguiente dilema",
      "Todo el mundo hace un baile de la victoria de 5 segundos, a la vez",
      "Todo el mundo imita el animal que elija el más joven",
      "Todo el mundo se queda de pie hasta el siguiente dilema",
      "Cada uno le hace un cumplido a quien tenga a la derecha",
      "Todo el mundo canta el mismo estribillo, elegido por el mayor",
      "Todo el mundo hace 5 sentadillas a la vez, contando en voz alta",
    ],
    seeRecap: "Ver el resumen",
    endTitle: (u, p) => (u * 2 >= p ? "¡Sois todos clones!" : u === 0 ? "¡Cero consenso!" : "¡Debate cerrado!"),
    endSub: (n) => `${n} dilemas resueltos, cero arrepentimientos.`,
    statPlayed: "Dilemas jugados",
    statUnanimous: "Unánimes",
    closestTitle: "El más reñido",
    closestSplit: (a, b) => `${a} mano${a === 1 ? "" : "s"} contra ${b}`,
    noClosest: "No hay manos suficientes para un dilema reñido. ¡La próxima, votad todos!",
    again: (n) => `Otros ${n}`,
    freeDilemmas: (n) => `${n} dilemas gratis`,
    restOfClassic: (n) => `Todo el Clásico · ${n} dilemas más`,
  },
};
