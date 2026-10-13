// Textes d'interface de L'Intrus (mode local / app), FR · EN · ES.
import type { I18n } from "@/lib/i18n";

type Role = "civil" | "undercover" | "mrwhite" | "jester";

interface UCStrings {
  gameName: string;
  /** Nom du rôle (badge, classement) */
  role: Record<Role, string>;
  /** « C'était… un civil / l'Intrus… » */
  roleArticle: Record<Role, string>;
  back: string;
  // Distribution
  distribution: (pos: number, total: number) => string;
  rerollNotice: string;
  seeMyRole: string;
  rolesReady: string;
  passPhoneTo: string;
  whoSawWord: string;
  reviewLabel: string;
  privateTag: string;
  ghostLastChanceLabel: string;
  bonus: string;
  tryMyLuck: string;
  // Composition
  setupSub: (n: number) => string;
  setupTitle: string;
  rolesTag: string;
  whoIsWho: string;
  statCivils: string; statCivilsSub: string;
  statImpostor: string; statImpostorSub: string;
  statGhost: string; statGhostSub: string;
  statJester: string; statJesterSub: string;
  ucRange: (max: number) => string;
  ucMaxOne: string;
  ghostHint: string;
  ghostMin: string;
  jesterHint: string;
  jesterNotEnough: string;
  theWords: string;
  allChecked: string;
  checkAll: string;
  naughty: string;
  freePairs: (n: number) => string;
  premiumOnly: (label: string) => string;
  unlockAll: string;
  unlockAllSub: (n: number) => string;
  dealRoles: string;
  dealHint: string;
  lessOne: string;
  moreOne: string;
  // Révélation
  topSecret: string;
  hintGhost: string;
  hintJester: string;
  hintCivil: string;
  reminderSub: string;
  playerSub: (name: string) => string;
  secretWordTitle: string;
  nobodyElse: string;
  hideAndBack: string;
  memorizedNext: string;
  rerollWord: string;
  stampSecret: string;
  noWord: string;
  yourSecretWord: string;
  roundSuffix: (r: number) => string;
  // Tour de table
  roundN: (r: number) => string;
  tableTitle: string;
  aliveN: (n: number) => string;
  tableHelp: string;
  starts: string;
  reviewMyWord: string;
  goVote: string;
  // Revoir son mot
  shortMemory: string;
  whoReviews: string;
  confidential: string;
  pickBlobThen: string;
  nobodyElseStrong: string;
  tapToReview: string;
  backToTable: string;
  // Vote
  voteSub: (r: number) => string;
  whoEliminate: string;
  voteHelp: string;
  suspectPicked: string;
  tapToPick: string;
  eliminatePlayer: string;
  // Élimination
  verdictSub: (r: number) => string;
  unmasked: string;
  innocent: string;
  nobodyOut: string;
  vote: string;
  stampEliminated: string;
  itWas: string;
  hadNoWord: string;
  wordStaysSecret: string;
  noMajority: string;
  continueBtn: string;
  // Le Fantôme devine
  twistOfFate: string;
  ghostGuesses: string;
  lastChance: string;
  ghostEliminated: string;
  ghostGuessHelp: string;
  guessPlaceholder: string;
  bet: string;
  // Fin de partie
  winTitle: { civils: [string, string]; impostors: [string, string]; impostor: [string, string]; jester: [string, string]; ghost: [string, string] };
  endSub: string;
  victory: string;
  civilWord: string;
  impostorWord: string;
  ghostTried: string;
  betWon: string;
  betLost: string;
  ranking: string;
  rematch: string;
  rematchSub: string;
  backHome: string;
  // Règles
  rules: string;
  hide: string;
  show: string;
  rulesItems: string[];
  ruleJester: string;
}

export const UC_STR: I18n<UCStrings> = {
  fr: {
    gameName: "L'Intrus",
    role: { civil: "Civil", undercover: "Intrus", mrwhite: "Fantôme", jester: "Bouffon" },
    roleArticle: { civil: "un civil", undercover: "l'Intrus", mrwhite: "le Fantôme", jester: "le Bouffon" },
    back: "Retour",
    distribution: (p, t) => `${p} / ${t} · Distribution`,
    rerollNotice: "Nouveau mot ! On refait la distribution",
    seeMyRole: "Voir mon rôle",
    rolesReady: "Rôles prêts",
    passPhoneTo: "Passe le téléphone à",
    whoSawWord: "Qui a vu son mot",
    reviewLabel: "Revoir le mot",
    privateTag: "Privé",
    ghostLastChanceLabel: "Fantôme · dernière chance",
    bonus: "Bonus",
    tryMyLuck: "Tenter ma chance",
    setupSub: (n) => `Étape 2 · ${n} joueurs`,
    setupTitle: "Composition",
    rolesTag: "Rôles",
    whoIsWho: "Qui est qui",
    statCivils: "Civils", statCivilsSub: "même mot",
    statImpostor: "Intrus", statImpostorSub: "mot voisin",
    statGhost: "Fantôme", statGhostSub: "sans mot",
    statJester: "Bouffon", statJesterSub: "à éliminer",
    ucRange: (m) => `1 à ${m}`,
    ucMaxOne: "1 maximum",
    ghostHint: "aucun mot · devine s'il sort",
    ghostMin: "5 joueurs min",
    jesterHint: "gagne seul s'il se fait éliminer par le vote",
    jesterNotEnough: "pas assez de civils",
    theWords: "Les mots",
    allChecked: "Tout est coché",
    checkAll: "Tout cocher",
    naughty: "Coquin 18+",
    freePairs: (n) => `${n} paires gratuites`,
    premiumOnly: (l) => `${l} : réservé à Premium`,
    unlockAll: "Débloque tous les mots",
    unlockAllSub: (n) => `+${n} paires, l'Anime, le +18 et tous les thèmes avec Premium.`,
    dealRoles: "Distribuer les rôles",
    dealHint: "Rôles au hasard. Chacun verra son mot à son tour.",
    lessOne: "Un de moins",
    moreOne: "Un de plus",
    topSecret: "Top secret",
    hintGhost: "Tu es le Fantôme : tu n'as pas de mot. Écoute, bluffe… Si tu es éliminé, devine le mot des civils pour gagner seul.",
    hintJester: "Tu es le Bouffon. Tu as le mot des civils, mais ton but est de te faire éliminer par le vote ! Sois louche… mais pas trop vite.",
    hintCivil: "Mémorise ton mot. Attention : tu ne sais pas si tu es civil… ou l'Intrus ! Donne un indice ni trop vague, ni trop évident.",
    reminderSub: "Rappel · ne pas montrer",
    playerSub: (n) => `Joueur · ${n}`,
    secretWordTitle: "Mot secret",
    nobodyElse: "Personne d'autre ne doit voir l'écran.",
    hideAndBack: "Cacher et revenir",
    memorizedNext: "J’ai mémorisé, suivant",
    rerollWord: "Mot nul ? Changer de mot",
    stampSecret: "Secret",
    noWord: "Tu n'as pas de mot",
    yourSecretWord: "Ton mot secret",
    roundSuffix: (r) => `· manche ${r}`,
    roundN: (r) => `Manche ${r}`,
    tableTitle: "Tour de table",
    aliveN: (n) => `${n} en vie`,
    tableHelp: "Dans l'ordre, chacun dit UN mot-indice à voix haute. Puis on vote.",
    starts: "commence",
    reviewMyWord: "Revoir mon mot",
    goVote: "Passer au vote",
    shortMemory: "Mémoire courte ?",
    whoReviews: "Qui veut revoir ?",
    confidential: "Confidentiel",
    pickBlobThen: "Choisis ton blob, puis",
    nobodyElseStrong: "personne d'autre ne doit voir l'écran.",
    tapToReview: "Touche pour revoir",
    backToTable: "Revenir au tour de table",
    voteSub: (r) => `Manche ${r} · le vote`,
    whoEliminate: "Qui éliminer ?",
    voteHelp: "Mettez-vous d'accord, touchez le suspect, puis confirmez.",
    suspectPicked: "Suspect choisi",
    tapToPick: "Touche pour choisir",
    eliminatePlayer: "Éliminer ce joueur",
    verdictSub: (r) => `Verdict · manche ${r}`,
    unmasked: "Démasqué !",
    innocent: "Innocent…",
    nobodyOut: "Personne ne sort",
    vote: "Vote",
    stampEliminated: "Éliminé",
    itWas: "C'était…",
    hadNoWord: "Il n'avait pas de mot.",
    wordStaysSecret: "Son mot reste secret.",
    noMajority: "Pas de majorité — personne ne sort cette manche.",
    continueBtn: "Continuer →",
    twistOfFate: "Coup du destin",
    ghostGuesses: "Le Fantôme devine",
    lastChance: "Dernière chance",
    ghostEliminated: "Fantôme éliminé",
    ghostGuessHelp: "Une dernière chance. Tape le mot des civils pour gagner seul.",
    guessPlaceholder: "Ton pari…",
    bet: "Parier",
    winTitle: {
      civils: ["Civils", "victorieux"], impostors: ["Imposteurs", "victorieux"], impostor: ["Imposteur", "victorieux"],
      jester: ["Le Bouffon", "gagne"], ghost: ["Le Fantôme", "triomphe"],
    },
    endSub: "Fin de partie",
    victory: "Victoire",
    civilWord: "Mot des civils",
    impostorWord: "Mot de l'Intrus",
    ghostTried: "Le Fantôme a tenté :",
    betWon: "✓ pari réussi",
    betLost: "✕ raté",
    ranking: "Le classement",
    rematch: "Revanche !",
    rematchSub: "Nouveau mot, même bande",
    backHome: "Retour à l'accueil",
    rules: "Les règles",
    hide: "Masquer",
    show: "Afficher",
    rulesItems: [
      "Chacun reçoit un mot secret. Les civils ont tous le même ; l'Intrus a un mot voisin… et ne sait pas qu'il est l'Intrus !",
      "Le Fantôme (optionnel) n'a pas de mot, lui le sait : il écoute et bluffe. S'il est éliminé, il peut gagner seul en devinant le mot des civils.",
      "À tour de rôle, chacun donne un indice à voix haute sur son mot, puis la table désigne ensemble un suspect à éliminer.",
      "Les civils gagnent quand tous les imposteurs sont éliminés. Les imposteurs gagnent dès qu'ils sont aussi nombreux que les autres joueurs.",
    ],
    ruleJester: "Le Bouffon a le mot des civils mais joue pour lui : il gagne seul s'il se fait éliminer par le vote.",
  },
  en: {
    gameName: "The Impostor",
    role: { civil: "Civilian", undercover: "Impostor", mrwhite: "Ghost", jester: "Jester" },
    roleArticle: { civil: "a Civilian", undercover: "the Impostor", mrwhite: "the Ghost", jester: "the Jester" },
    back: "Back",
    distribution: (p, t) => `${p} / ${t} · Dealing`,
    rerollNotice: "New word! Dealing again",
    seeMyRole: "See my role",
    rolesReady: "Roles ready",
    passPhoneTo: "Pass the phone to",
    whoSawWord: "Who has seen their word",
    reviewLabel: "Check your word",
    privateTag: "Private",
    ghostLastChanceLabel: "Ghost · last chance",
    bonus: "Bonus",
    tryMyLuck: "Try my luck",
    setupSub: (n) => `Step 2 · ${n} players`,
    setupTitle: "Line-up",
    rolesTag: "Roles",
    whoIsWho: "Who's who",
    statCivils: "Civilians", statCivilsSub: "same word",
    statImpostor: "Impostor", statImpostorSub: "close word",
    statGhost: "Ghost", statGhostSub: "no word",
    statJester: "Jester", statJesterSub: "wants out",
    ucRange: (m) => `1 to ${m}`,
    ucMaxOne: "1 max",
    ghostHint: "no word · guesses if voted out",
    ghostMin: "5 players min",
    jesterHint: "wins alone if voted out",
    jesterNotEnough: "not enough civilians",
    theWords: "The words",
    allChecked: "All selected",
    checkAll: "Select all",
    naughty: "Naughty 18+",
    freePairs: (n) => `${n} free pairs`,
    premiumOnly: (l) => `${l}: Premium only`,
    unlockAll: "Unlock every word",
    unlockAllSub: (n) => `+${n} pairs, Anime, 18+ and every theme with Premium.`,
    dealRoles: "Deal the roles",
    dealHint: "Random roles. Everyone sees their word in turn.",
    lessOne: "One less",
    moreOne: "One more",
    topSecret: "Top secret",
    hintGhost: "You're the Ghost: you have no word. Listen, bluff… If you get voted out, guess the civilians' word to win alone.",
    hintJester: "You're the Jester. You have the civilians' word, but your goal is to get voted out! Act shady… just not too fast.",
    hintCivil: "Memorise your word. Careful: you don't know if you're a civilian… or the Impostor! Give a clue that's not too vague, not too obvious.",
    reminderSub: "Reminder · don't show anyone",
    playerSub: (n) => `Player · ${n}`,
    secretWordTitle: "Secret word",
    nobodyElse: "Nobody else should see the screen.",
    hideAndBack: "Hide and go back",
    memorizedNext: "Got it, next",
    rerollWord: "Bad word? Change it",
    stampSecret: "Secret",
    noWord: "You have no word",
    yourSecretWord: "Your secret word",
    roundSuffix: (r) => `· round ${r}`,
    roundN: (r) => `Round ${r}`,
    tableTitle: "Around the table",
    aliveN: (n) => `${n} left`,
    tableHelp: "In order, everyone says ONE clue word out loud. Then you vote.",
    starts: "goes first",
    reviewMyWord: "Check my word",
    goVote: "Go to the vote",
    shortMemory: "Short memory?",
    whoReviews: "Who needs a peek?",
    confidential: "Confidential",
    pickBlobThen: "Pick your blob, then",
    nobodyElseStrong: "nobody else should see the screen.",
    tapToReview: "Tap to check",
    backToTable: "Back to the table",
    voteSub: (r) => `Round ${r} · the vote`,
    whoEliminate: "Who's out?",
    voteHelp: "Agree together, tap the suspect, then confirm.",
    suspectPicked: "Suspect picked",
    tapToPick: "Tap to pick",
    eliminatePlayer: "Vote this player out",
    verdictSub: (r) => `Verdict · round ${r}`,
    unmasked: "Busted!",
    innocent: "Innocent…",
    nobodyOut: "Nobody's out",
    vote: "Vote",
    stampEliminated: "Out",
    itWas: "They were…",
    hadNoWord: "They had no word.",
    wordStaysSecret: "Their word stays secret.",
    noMajority: "No majority — nobody is out this round.",
    continueBtn: "Continue →",
    twistOfFate: "Twist of fate",
    ghostGuesses: "The Ghost guesses",
    lastChance: "Last chance",
    ghostEliminated: "Ghost voted out",
    ghostGuessHelp: "One last chance. Type the civilians' word to win alone.",
    guessPlaceholder: "Your guess…",
    bet: "Guess",
    winTitle: {
      civils: ["Civilians", "win"], impostors: ["Impostors", "win"], impostor: ["Impostor", "wins"],
      jester: ["The Jester", "wins"], ghost: ["The Ghost", "triumphs"],
    },
    endSub: "Game over",
    victory: "Victory",
    civilWord: "Civilians' word",
    impostorWord: "Impostor's word",
    ghostTried: "The Ghost guessed:",
    betWon: "✓ nailed it",
    betLost: "✕ missed",
    ranking: "Leaderboard",
    rematch: "Rematch!",
    rematchSub: "New word, same crew",
    backHome: "Back to home",
    rules: "Rules",
    hide: "Hide",
    show: "Show",
    rulesItems: [
      "Everyone gets a secret word. Civilians all share the same one; the Impostor gets a close word… and doesn't know they're the Impostor!",
      "The Ghost (optional) has no word and knows it: they listen and bluff. If voted out, they can win alone by guessing the civilians' word.",
      "Taking turns, everyone gives one clue about their word out loud, then the table agrees on a suspect to vote out.",
      "Civilians win when every impostor is out. Impostors win as soon as there are as many of them as other players.",
    ],
    ruleJester: "The Jester has the civilians' word but plays for themselves: they win alone if they get voted out.",
  },
  es: {
    gameName: "El Impostor",
    role: { civil: "Civil", undercover: "Impostor", mrwhite: "Fantasma", jester: "Bufón" },
    roleArticle: { civil: "un civil", undercover: "el Impostor", mrwhite: "el Fantasma", jester: "el Bufón" },
    back: "Atrás",
    distribution: (p, t) => `${p} / ${t} · Reparto`,
    rerollNotice: "¡Palabra nueva! Repartimos otra vez",
    seeMyRole: "Ver mi rol",
    rolesReady: "Roles listos",
    passPhoneTo: "Pásale el móvil a",
    whoSawWord: "Quién ha visto su palabra",
    reviewLabel: "Volver a ver la palabra",
    privateTag: "Privado",
    ghostLastChanceLabel: "Fantasma · última oportunidad",
    bonus: "Bonus",
    tryMyLuck: "Probar suerte",
    setupSub: (n) => `Paso 2 · ${n} jugadores`,
    setupTitle: "Composición",
    rolesTag: "Roles",
    whoIsWho: "Quién es quién",
    statCivils: "Civiles", statCivilsSub: "misma palabra",
    statImpostor: "Impostor", statImpostorSub: "palabra vecina",
    statGhost: "Fantasma", statGhostSub: "sin palabra",
    statJester: "Bufón", statJesterSub: "quiere salir",
    ucRange: (m) => `de 1 a ${m}`,
    ucMaxOne: "1 como máximo",
    ghostHint: "sin palabra · adivina si sale",
    ghostMin: "mín. 5 jugadores",
    jesterHint: "gana solo si lo eliminan en la votación",
    jesterNotEnough: "faltan civiles",
    theWords: "Las palabras",
    allChecked: "Todo marcado",
    checkAll: "Marcar todo",
    naughty: "Picante +18",
    freePairs: (n) => `${n} parejas gratis`,
    premiumOnly: (l) => `${l}: solo con Premium`,
    unlockAll: "Desbloquea todas las palabras",
    unlockAllSub: (n) => `+${n} parejas, Anime, +18 y todos los temas con Premium.`,
    dealRoles: "Repartir los roles",
    dealHint: "Roles al azar. Cada uno verá su palabra por turnos.",
    lessOne: "Uno menos",
    moreOne: "Uno más",
    topSecret: "Alto secreto",
    hintGhost: "Eres el Fantasma: no tienes palabra. Escucha, farolea… Si te eliminan, adivina la palabra de los civiles para ganar solo.",
    hintJester: "Eres el Bufón. Tienes la palabra de los civiles, ¡pero tu objetivo es que te eliminen en la votación! Hazte el sospechoso… pero sin pasarte.",
    hintCivil: "Memoriza tu palabra. Ojo: no sabes si eres civil… ¡o el Impostor! Da una pista ni muy vaga ni muy obvia.",
    reminderSub: "Recordatorio · no la enseñes",
    playerSub: (n) => `Jugador · ${n}`,
    secretWordTitle: "Palabra secreta",
    nobodyElse: "Nadie más debe ver la pantalla.",
    hideAndBack: "Ocultar y volver",
    memorizedNext: "Memorizada, siguiente",
    rerollWord: "¿Palabra mala? Cambiarla",
    stampSecret: "Secreto",
    noWord: "No tienes palabra",
    yourSecretWord: "Tu palabra secreta",
    roundSuffix: (r) => `· ronda ${r}`,
    roundN: (r) => `Ronda ${r}`,
    tableTitle: "Ronda de pistas",
    aliveN: (n) => `${n} en juego`,
    tableHelp: "Por orden, cada uno dice UNA palabra-pista en voz alta. Luego se vota.",
    starts: "empieza",
    reviewMyWord: "Ver mi palabra",
    goVote: "Ir a la votación",
    shortMemory: "¿Memoria corta?",
    whoReviews: "¿Quién quiere verla?",
    confidential: "Confidencial",
    pickBlobThen: "Elige tu blob y luego",
    nobodyElseStrong: "nadie más debe ver la pantalla.",
    tapToReview: "Toca para verla",
    backToTable: "Volver a la ronda",
    voteSub: (r) => `Ronda ${r} · la votación`,
    whoEliminate: "¿A quién eliminamos?",
    voteHelp: "Entre todos: toca al sospechoso y confirma.",
    suspectPicked: "Sospechoso elegido",
    tapToPick: "Toca para elegir",
    eliminatePlayer: "Eliminar a este jugador",
    verdictSub: (r) => `Veredicto · ronda ${r}`,
    unmasked: "¡Pillado!",
    innocent: "Inocente…",
    nobodyOut: "No sale nadie",
    vote: "Voto",
    stampEliminated: "Eliminado",
    itWas: "Era…",
    hadNoWord: "No tenía palabra.",
    wordStaysSecret: "Su palabra sigue en secreto.",
    noMajority: "Sin mayoría: nadie sale esta ronda.",
    continueBtn: "Continuar →",
    twistOfFate: "Giro del destino",
    ghostGuesses: "El Fantasma adivina",
    lastChance: "Última oportunidad",
    ghostEliminated: "Fantasma eliminado",
    ghostGuessHelp: "Una última oportunidad. Escribe la palabra de los civiles para ganar solo.",
    guessPlaceholder: "Tu apuesta…",
    bet: "Apostar",
    winTitle: {
      civils: ["Los civiles", "ganan"], impostors: ["Los impostores", "ganan"], impostor: ["El impostor", "gana"],
      jester: ["El Bufón", "gana"], ghost: ["El Fantasma", "triunfa"],
    },
    endSub: "Fin de la partida",
    victory: "Victoria",
    civilWord: "Palabra civil",
    impostorWord: "Palabra del Impostor",
    ghostTried: "El Fantasma probó:",
    betWon: "✓ acertó",
    betLost: "✕ falló",
    ranking: "La clasificación",
    rematch: "¡Revancha!",
    rematchSub: "Palabra nueva, misma banda",
    backHome: "Volver al inicio",
    rules: "Las reglas",
    hide: "Ocultar",
    show: "Mostrar",
    rulesItems: [
      "Cada uno recibe una palabra secreta. Todos los civiles tienen la misma; el Impostor tiene una palabra parecida… ¡y no sabe que es el Impostor!",
      "El Fantasma (opcional) no tiene palabra y lo sabe: escucha y farolea. Si lo eliminan, puede ganar solo adivinando la palabra de los civiles.",
      "Por turnos, cada uno da una pista en voz alta sobre su palabra y luego la mesa elige junta a un sospechoso para eliminar.",
      "Los civiles ganan cuando eliminan a todos los impostores. Los impostores ganan en cuanto son tantos como el resto de jugadores.",
    ],
    ruleJester: "El Bufón tiene la palabra de los civiles pero juega para sí mismo: gana solo si lo eliminan en la votación.",
  },
};
