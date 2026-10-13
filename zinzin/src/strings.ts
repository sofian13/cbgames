import type { I18n } from "@/lib/i18n";

/**
 * Textes de l'interface de l'app (hors jeux), en FR / EN / ES.
 * Dans un composant : `const t = useT(UI);` (re-rend au changement de langue).
 * FR : espaces insécables gérés automatiquement (ui/typo.ts) ; EN/ES : pas d'espace avant ? ! :
 */
export const UI: I18n<{
  // Communs
  close: string;
  back: string;
  settings: string;
  // Lancement
  splashTagline: string;
  skipIntro: string;
  // Âge
  ageTitle: string;
  ageText: string;
  ageOk: string;
  // Accueil
  premium: string;
  unlockAllTitle: string;
  unlockAllSub: string;
  sipNote: string;
  featuredLabel: string;
  slideOf: (i: number, n: number) => string;
  seeGame: string;
  seeGameAria: (title: string) => string;
  lockedSuffix: string;
  tagNew: string;
  tagFree: string;
  // Fiche jeu
  howItLooks: string;
  howToPlay: string;
  rulesShow: string;
  rulesHide: string;
  adultNote: string;
  unlockGame: string;
  play: string;
  // Joueurs
  players: { range: (a: string, b: string) => string; plus: (a: string) => string; exact: (a: string) => string };
  // Paywall
  perks: string[];
  paywallTitle1: string;
  paywallTitle2: string;
  plansLabel: string;
  plans: Record<"weekly" | "monthly" | "yearly", { title: string; period: string; badge?: string }>;
  perMonthSuffix: string;
  buyCta: string;
  autoRenew: string;
  restoring: string;
  restore: string;
  terms: string;
  privacy: string;
  legalNotice: string;
  testMode: string;
  welcome: string;
  buyFailed: string;
  restored: string;
  nothingToRestore: string;
  // Réglages
  yourStatus: string;
  freeVersion: string;
  freeGames: string;
  premiumText: string;
  freeText: string;
  unlockEverything: string;
  manageSub: string;
  contactUs: string;
  contactSub: string;
  share: string;
  thanksShare: string;
  rate: string;
  rateSub: string;
  backToFree: string;
  backToFreeToast: string;
  version: (v: string) => string;
  notifTitle: string;
  notifSub: string;
  notifDenied: string;
  notifOn: string;
  notifOff: string;
  language: string;
  eraseArmed: string;
  erase: string;
  lastUpdate: (d: string) => string;
  // Jeu
  player: string;
  backHome: string;
  quitAria: string;
  quitTitle: string;
  quitText: string;
  keepPlaying: string;
  quit: string;
  loading: string;
  // Plantage
  oopsTitle: string;
  oopsText: string;
  relaunch: string;
}> = {
  fr: {
    close: "Fermer",
    back: "Retour",
    settings: "Réglages",
    splashTagline: "Jeux de soirée · un seul téléphone",
    skipIntro: "Passer l'introduction",
    ageTitle: "Ici, c’est entre adultes.",
    ageText: "Zinzin est réservé aux 18 ans et plus. Dans les jeux à boire, une « gorgée de zinzin », c’est de ce que tu veux : eau, soft, jus… Avec modération.",
    ageOk: "J’ai 18 ans ou plus",
    premium: "Premium",
    unlockAllTitle: "Débloque tout Zinzin",
    unlockAllSub: "Tous les jeux, et du nouveau chaque mois.",
    sipNote: "Une gorgée de zinzin, c’est de ce que tu veux : eau, soft… avec modération.",
    featuredLabel: "À la une",
    slideOf: (i, n) => `Slide ${i} sur ${n}`,
    seeGame: "Voir le jeu",
    seeGameAria: (title) => `${title} : voir le jeu`,
    lockedSuffix: " (verrouillé)",
    tagNew: "Nouveau",
    tagFree: "Gratuit",
    howItLooks: "Ça donne quoi ?",
    howToPlay: "Comment on joue",
    rulesShow: "Les règles en détail",
    rulesHide: "Masquer les règles détaillées",
    adultNote: "Une gorgée de zinzin, c’est de ce que tu veux : eau, soft, jus… ou un gage. Avec modération.",
    unlockGame: "Débloquer ce jeu",
    play: "Jouer",
    players: {
      range: (a, b) => `${a} à ${b} joueurs`,
      plus: (a) => `${a} joueurs et +`,
      exact: (a) => `${a} joueurs`,
    },
    perks: ["Tous les jeux, sans limite", "De nouveaux jeux chaque mois", "Les packs 18+ débloqués", "Zéro pub, jamais"],
    paywallTitle1: "Débloque toute",
    paywallTitle2: "la folie",
    plansLabel: "Offres",
    plans: {
      weekly: { title: "Pass soirée", period: "7 jours" },
      monthly: { title: "Mensuel", period: "par mois", badge: "Le + choisi" },
      yearly: { title: "Annuel", period: "par an", badge: "-58 %" },
    },
    perMonthSuffix: "/mois",
    buyCta: "Je débloque tout",
    autoRenew: "Renouvellement automatique, annulable à tout moment.",
    restoring: "Restauration…",
    restore: "Restaurer mes achats",
    terms: "Conditions",
    privacy: "Confidentialité",
    legalNotice: "Mentions légales",
    testMode: "Mode test : l’achat débloque gratuitement",
    welcome: "Bienvenue dans la folie !",
    buyFailed: "Achat non finalisé",
    restored: "Achats restaurés",
    nothingToRestore: "Aucun achat à restaurer",
    yourStatus: "Ton statut",
    freeVersion: "Version gratuite",
    freeGames: "3 jeux offerts",
    premiumText: "Tout est débloqué. Les nouveaux jeux arrivent tout seuls.",
    freeText: "Le reste t'attend : tous les jeux, et du nouveau chaque\u00a0mois.",
    unlockEverything: "Tout débloquer",
    manageSub: "Gérer mon abonnement",
    contactUs: "Nous écrire",
    contactSub: "Un bug ? Une question ?",
    share: "Partager Zinzin",
    thanksShare: "Merci de faire tourner 💛",
    rate: "Évaluer l'app",
    rateSub: "5 étoiles = 1 blob heureux",
    backToFree: "Revenir en gratuit (test)",
    backToFreeToast: "Retour en gratuit (test)",
    version: (v) => `Zinzin, version ${v}. Fait avec amour et beaucoup de\u00a0blobs.`,
    notifTitle: "Rappels de soirée",
    notifSub: "Une notif le vendredi et le samedi soir",
    notifDenied: "Autorise les notifications dans les Réglages de l'iPhone",
    notifOn: "Rappels activés : vendredi et samedi soir",
    notifOff: "Rappels désactivés",
    language: "Langue",
    eraseArmed: "Sûr ? Touche encore pour tout effacer",
    erase: "Effacer mes données de ce téléphone",
    lastUpdate: (d) => `Dernière mise à jour : ${d}`,
    player: "Joueur",
    backHome: "Retour à l’accueil",
    quitAria: "Quitter la partie",
    quitTitle: "On arrête déjà ?",
    quitText: "La partie en cours sera perdue.",
    keepPlaying: "Je continue",
    quit: "Quitter la partie",
    loading: "Chargement…",
    oopsTitle: "Oups, ça a buggé",
    oopsText: "Le blob a glissé sur une peau de banane. Désolé !",
    relaunch: "Relancer Zinzin",
  },
  en: {
    close: "Close",
    back: "Back",
    settings: "Settings",
    splashTagline: "Party games · just one phone",
    skipIntro: "Skip intro",
    ageTitle: "Adults only in here.",
    ageText: "Zinzin is for ages 18 and up. In the drinking games, a \"zinzin sip\" is whatever you like: water, soft drinks, juice… Please drink responsibly.",
    ageOk: "I'm 18 or older",
    premium: "Premium",
    unlockAllTitle: "Unlock all of Zinzin",
    unlockAllSub: "Every game, plus new ones every month.",
    sipNote: "A zinzin sip is whatever you like: water, soft drinks… in moderation.",
    featuredLabel: "Featured",
    slideOf: (i, n) => `Slide ${i} of ${n}`,
    seeGame: "See the game",
    seeGameAria: (title) => `${title}: see the game`,
    lockedSuffix: " (locked)",
    tagNew: "New",
    tagFree: "Free",
    howItLooks: "What's it like?",
    howToPlay: "How to play",
    rulesShow: "Full rules",
    rulesHide: "Hide full rules",
    adultNote: "A zinzin sip is whatever you like: water, soft drinks, juice… or a dare. In moderation.",
    unlockGame: "Unlock this game",
    play: "Play",
    players: {
      range: (a, b) => `${a} to ${b} players`,
      plus: (a) => `${a}+ players`,
      exact: (a) => `${a} players`,
    },
    perks: ["Every game, no limits", "New games every month", "18+ packs unlocked", "Zero ads, ever"],
    paywallTitle1: "Unlock all",
    paywallTitle2: "the madness",
    plansLabel: "Plans",
    plans: {
      weekly: { title: "Party Pass", period: "7 days" },
      monthly: { title: "Monthly", period: "per month", badge: "Most popular" },
      yearly: { title: "Yearly", period: "per year", badge: "-58%" },
    },
    perMonthSuffix: "/mo",
    buyCta: "Unlock everything",
    autoRenew: "Renews automatically, cancel anytime.",
    restoring: "Restoring…",
    restore: "Restore purchases",
    terms: "Terms",
    privacy: "Privacy",
    legalNotice: "Legal notice",
    testMode: "Test mode: purchasing unlocks for free",
    welcome: "Welcome to the madness!",
    buyFailed: "Purchase not completed",
    restored: "Purchases restored",
    nothingToRestore: "No purchases to restore",
    yourStatus: "Your status",
    freeVersion: "Free version",
    freeGames: "3 free games",
    premiumText: "Everything's unlocked. New games show up on their own.",
    freeText: "The rest is waiting: every game, plus new ones every month.",
    unlockEverything: "Unlock everything",
    manageSub: "Manage my subscription",
    contactUs: "Contact us",
    contactSub: "Found a bug? Got a question?",
    share: "Share Zinzin",
    thanksShare: "Thanks for spreading the word 💛",
    rate: "Rate the app",
    rateSub: "5 stars = 1 happy blob",
    backToFree: "Back to free (test)",
    backToFreeToast: "Back to free (test)",
    version: (v) => `Zinzin, version ${v}. Made with love and lots of blobs.`,
    notifTitle: "Party reminders",
    notifSub: "A notification on Friday and Saturday nights",
    notifDenied: "Allow notifications in your iPhone Settings",
    notifOn: "Reminders on: Friday and Saturday nights",
    notifOff: "Reminders off",
    language: "Language",
    eraseArmed: "Sure? Tap again to erase everything",
    erase: "Erase my data from this phone",
    lastUpdate: (d) => `Last updated: ${d}`,
    player: "Player",
    backHome: "Back to home",
    quitAria: "Quit the game",
    quitTitle: "Stopping already?",
    quitText: "The current game will be lost.",
    keepPlaying: "Keep playing",
    quit: "Quit the game",
    loading: "Loading…",
    oopsTitle: "Oops, something broke",
    oopsText: "The blob slipped on a banana peel. Sorry!",
    relaunch: "Restart Zinzin",
  },
  es: {
    close: "Cerrar",
    back: "Volver",
    settings: "Ajustes",
    splashTagline: "Juegos de fiesta · un solo móvil",
    skipIntro: "Saltar la introducción",
    ageTitle: "Aquí solo entran adultos.",
    ageText: "Zinzin es solo para mayores de 18 años. En los juegos para beber, un «trago de zinzin» es de lo que quieras: agua, refresco, zumo… Con moderación.",
    ageOk: "Tengo 18 años o más",
    premium: "Premium",
    unlockAllTitle: "Desbloquea todo Zinzin",
    unlockAllSub: "Todos los juegos y novedades cada mes.",
    sipNote: "Un trago de zinzin es de lo que quieras: agua, refresco… con moderación.",
    featuredLabel: "Destacados",
    slideOf: (i, n) => `Diapositiva ${i} de ${n}`,
    seeGame: "Ver el juego",
    seeGameAria: (title) => `${title}: ver el juego`,
    lockedSuffix: " (bloqueado)",
    tagNew: "Nuevo",
    tagFree: "Gratis",
    howItLooks: "¿Cómo es?",
    howToPlay: "Cómo se juega",
    rulesShow: "Reglas completas",
    rulesHide: "Ocultar las reglas completas",
    adultNote: "Un trago de zinzin es de lo que quieras: agua, refresco, zumo… o un reto. Con moderación.",
    unlockGame: "Desbloquear este juego",
    play: "Jugar",
    players: {
      range: (a, b) => `De ${a} a ${b} jugadores`,
      plus: (a) => `${a} jugadores o más`,
      exact: (a) => `${a} jugadores`,
    },
    perks: ["Todos los juegos, sin límites", "Juegos nuevos cada mes", "Packs 18+ desbloqueados", "Cero anuncios, nunca"],
    paywallTitle1: "Desbloquea toda",
    paywallTitle2: "la locura",
    plansLabel: "Planes",
    plans: {
      weekly: { title: "Pase fiesta", period: "7 días" },
      monthly: { title: "Mensual", period: "al mes", badge: "El más elegido" },
      yearly: { title: "Anual", period: "al año", badge: "-58 %" },
    },
    perMonthSuffix: "/mes",
    buyCta: "Lo desbloqueo todo",
    autoRenew: "Renovación automática, cancelable en cualquier momento.",
    restoring: "Restaurando…",
    restore: "Restaurar compras",
    terms: "Condiciones",
    privacy: "Privacidad",
    legalNotice: "Aviso legal",
    testMode: "Modo de prueba: la compra desbloquea gratis",
    welcome: "¡Bienvenido a la locura!",
    buyFailed: "Compra no completada",
    restored: "Compras restauradas",
    nothingToRestore: "No hay compras que restaurar",
    yourStatus: "Tu estado",
    freeVersion: "Versión gratuita",
    freeGames: "3 juegos gratis",
    premiumText: "Todo está desbloqueado. Los juegos nuevos llegan solos.",
    freeText: "El resto te espera: todos los juegos y novedades cada mes.",
    unlockEverything: "Desbloquearlo todo",
    manageSub: "Gestionar mi suscripción",
    contactUs: "Escríbenos",
    contactSub: "¿Un fallo? ¿Una pregunta?",
    share: "Compartir Zinzin",
    thanksShare: "Gracias por correr la voz 💛",
    rate: "Valorar la app",
    rateSub: "5 estrellas = 1 blob feliz",
    backToFree: "Volver a gratis (prueba)",
    backToFreeToast: "De vuelta a gratis (prueba)",
    version: (v) => `Zinzin, versión ${v}. Hecho con amor y muchos blobs.`,
    notifTitle: "Recordatorios de fiesta",
    notifSub: "Un aviso el viernes y el sábado por la noche",
    notifDenied: "Permite las notificaciones en los Ajustes del iPhone",
    notifOn: "Recordatorios activados: viernes y sábado por la noche",
    notifOff: "Recordatorios desactivados",
    language: "Idioma",
    eraseArmed: "¿Seguro? Toca otra vez para borrarlo todo",
    erase: "Borrar mis datos de este móvil",
    lastUpdate: (d) => `Última actualización: ${d}`,
    player: "Jugador",
    backHome: "Volver al inicio",
    quitAria: "Salir de la partida",
    quitTitle: "¿Ya lo dejáis?",
    quitText: "Se perderá la partida en curso.",
    keepPlaying: "Sigo jugando",
    quit: "Salir de la partida",
    loading: "Cargando…",
    oopsTitle: "Uy, algo ha fallado",
    oopsText: "El blob ha resbalado con una piel de plátano. ¡Lo sentimos!",
    relaunch: "Reiniciar Zinzin",
  },
};

/** Textes de la Soirée Zinzin (playlist de jeux enchaînés), en FR / EN / ES. */
export const SOIREE: I18n<{
  name: string;
  /** Titre de l'écran des joueurs : « Qui joue à {nom} ? » */
  setupName: string;
  cardSub: string;
  cardCta: string;
  resume: (i: number, n: number) => string;
  newOne: string;
  /** Étiquette de la carte quand une soirée est en pause */
  paused: string;
  stepOf: (i: number, n: number) => string;
  vibeTitle: string;
  vibes: Record<"chill" | "soiree" | "folle", { name: string; sub: string }>;
  lengthTitle: string;
  lengths: Record<4 | 6 | 10, { name: string; sub: string }>;
  next: string;
  recapTitle: string;
  recapSub: (players: number) => string;
  fewGames: (n: number) => string;
  noGames: string;
  change: string;
  moveUp: (name: string) => string;
  moveDown: (name: string) => string;
  launch: string;
  gameOf: (i: number, n: number) => string;
  nextUp: string;
  go: string;
  skip: string;
  finishNow: string;
  spicyHint: string;
  pause: string;
  winnerTitle: string;
  winnerSub: string;
  nobody: string;
  validate: (n: number) => string;
  standings: string;
  pts: (n: number) => string;
  endTitle: string;
  endSub: (played: number) => string;
  titles: string[];
  lastTitle: string;
  share: string;
  shareHead: string;
  shareGames: string;
  shared: string;
  newSoiree: string;
  home: string;
  kinds: Record<"bluff" | "tel" | "devine" | "rapide" | "ambiance" | "boire" | "duo", string>;
}> = {
  fr: {
    name: "Soirée Zinzin",
    setupName: "la Soirée Zinzin",
    cardSub: "On enchaîne les jeux, vous vous amusez.",
    cardCta: "Lancer une soirée",
    resume: (i, n) => `Reprendre la soirée (jeu ${i}/${n})`,
    newOne: "Nouvelle soirée",
    paused: "En pause",
    stepOf: (i, n) => `Étape ${i} sur ${n}`,
    vibeTitle: "L'ambiance",
    vibes: {
      chill: { name: "Chill", sub: "Sans alcool ni coquin" },
      soiree: { name: "Soirée", sub: "Le bon mix, pour tout le monde" },
      folle: { name: "Folle 18+", sub: "Jeux à boire et packs coquins autorisés" },
    },
    lengthTitle: "Combien de jeux ?",
    lengths: {
      4: { name: "Courte", sub: "4 jeux" },
      6: { name: "Normale", sub: "6 jeux" },
      10: { name: "Marathon", sub: "10 jeux" },
    },
    next: "Voir la playlist",
    recapTitle: "Votre playlist",
    recapSub: (p) => `Choisie pour vos ${p} joueurs. Un jeu ne vous plaît pas ? Changez-le.`,
    fewGames: (n) => `À ce nombre de joueurs, ${n} jeux seulement collent à l'ambiance.`,
    noGames: "Aucun jeu ne colle à cette bande. Changez d'ambiance ou ajoutez des joueurs.",
    change: "Changer",
    moveUp: (name) => `Monter ${name}`,
    moveDown: (name) => `Descendre ${name}`,
    launch: "Lancer la soirée",
    gameOf: (i, n) => `Jeu ${i}/${n}`,
    nextUp: "Prochain jeu",
    go: "On y va !",
    skip: "Passer ce jeu",
    finishNow: "Terminer la soirée",
    spicyHint: "Soirée folle : cochez les packs 18+ si le jeu en propose.",
    pause: "Mettre la soirée en pause",
    winnerTitle: "Qui a gagné ce jeu ?",
    winnerSub: "Touchez un ou plusieurs prénoms.",
    nobody: "Personne / égalité",
    validate: (n) => (n > 1 ? `Valider (${n} gagnants)` : "Valider"),
    standings: "Le classement de la soirée",
    pts: (n) => `${n} pt${n > 1 ? "s" : ""}`,
    endTitle: "Fin de la Soirée Zinzin",
    endSub: (p) => (p > 1 ? `${p} jeux joués. Quelle soirée !` : p === 1 ? "1 jeu joué. Quelle soirée !" : "Quelle soirée !"),
    titles: ["Roi de la soirée", "Le plus zinzin", "Toujours dans le coup", "L'ambianceur", "Le joker du groupe", "La révélation", "Le stratège", "Le roi du bluff"],
    lastTitle: "Prix du fair-play",
    share: "Partager",
    shareHead: "Notre Soirée Zinzin",
    shareGames: "Au programme",
    shared: "Classement partagé !",
    newSoiree: "Nouvelle soirée",
    home: "Retour à l'accueil",
    kinds: { bluff: "Bluff", tel: "Le tél est le jeu", devine: "Devinettes", rapide: "Rapide", ambiance: "Ambiance", boire: "À boire", duo: "À deux" },
  },
  en: {
    name: "Zinzin Night",
    setupName: "Zinzin Night",
    cardSub: "We line up the games, you have fun.",
    cardCta: "Start a night",
    resume: (i, n) => `Resume the night (game ${i}/${n})`,
    newOne: "New night",
    paused: "Paused",
    stepOf: (i, n) => `Step ${i} of ${n}`,
    vibeTitle: "The vibe",
    vibes: {
      chill: { name: "Chill", sub: "No drinking, nothing naughty" },
      soiree: { name: "Party", sub: "The right mix, for everyone" },
      folle: { name: "Wild 18+", sub: "Drinking games and naughty packs allowed" },
    },
    lengthTitle: "How many games?",
    lengths: {
      4: { name: "Short", sub: "4 games" },
      6: { name: "Regular", sub: "6 games" },
      10: { name: "Marathon", sub: "10 games" },
    },
    next: "See the playlist",
    recapTitle: "Your playlist",
    recapSub: (p) => `Picked for your ${p} players. Don't like a game? Swap it.`,
    fewGames: (n) => `With this many players, only ${n} games fit the vibe.`,
    noGames: "No game fits this crew. Pick another vibe or add players.",
    change: "Swap",
    moveUp: (name) => `Move ${name} up`,
    moveDown: (name) => `Move ${name} down`,
    launch: "Start the night",
    gameOf: (i, n) => `Game ${i}/${n}`,
    nextUp: "Next game",
    go: "Let's go!",
    skip: "Skip this game",
    finishNow: "End the night",
    spicyHint: "Wild night: tick the 18+ packs if the game has any.",
    pause: "Pause the night",
    winnerTitle: "Who won this game?",
    winnerSub: "Tap one or more names.",
    nobody: "Nobody / tie",
    validate: (n) => (n > 1 ? `Confirm (${n} winners)` : "Confirm"),
    standings: "Tonight's leaderboard",
    pts: (n) => `${n} pt${n === 1 ? "" : "s"}`,
    endTitle: "That's a wrap on Zinzin Night",
    endSub: (p) => (p > 1 ? `${p} games played. What a night!` : p === 1 ? "1 game played. What a night!" : "What a night!"),
    titles: ["King of the night", "The zinziest", "Always in the game", "The hype machine", "The wild card", "The breakout star", "The mastermind", "The bluff boss"],
    lastTitle: "Good sport award",
    share: "Share",
    shareHead: "Our Zinzin Night",
    shareGames: "On the menu",
    shared: "Leaderboard shared!",
    newSoiree: "New night",
    home: "Back to home",
    kinds: { bluff: "Bluffing", tel: "The phone is the game", devine: "Guessing", rapide: "Quick", ambiance: "Party vibes", boire: "Drinking", duo: "For two" },
  },
  es: {
    name: "Noche Zinzin",
    setupName: "la Noche Zinzin",
    cardSub: "Encadenamos los juegos, vosotros a disfrutar.",
    cardCta: "Empezar una noche",
    resume: (i, n) => `Retomar la noche (juego ${i}/${n})`,
    newOne: "Nueva noche",
    paused: "En pausa",
    stepOf: (i, n) => `Paso ${i} de ${n}`,
    vibeTitle: "El ambiente",
    vibes: {
      chill: { name: "Chill", sub: "Sin alcohol ni nada picante" },
      soiree: { name: "Fiesta", sub: "La mezcla perfecta, para todos" },
      folle: { name: "Loca 18+", sub: "Juegos para beber y packs picantes permitidos" },
    },
    lengthTitle: "¿Cuántos juegos?",
    lengths: {
      4: { name: "Corta", sub: "4 juegos" },
      6: { name: "Normal", sub: "6 juegos" },
      10: { name: "Maratón", sub: "10 juegos" },
    },
    next: "Ver la playlist",
    recapTitle: "Vuestra playlist",
    recapSub: (p) => `Elegida para vuestros ${p} jugadores. ¿Un juego no os convence? Cambiadlo.`,
    fewGames: (n) => `Con tantos jugadores, solo ${n} juegos encajan con el ambiente.`,
    noGames: "Ningún juego encaja con este grupo. Cambiad de ambiente o añadid jugadores.",
    change: "Cambiar",
    moveUp: (name) => `Subir ${name}`,
    moveDown: (name) => `Bajar ${name}`,
    launch: "Empezar la noche",
    gameOf: (i, n) => `Juego ${i}/${n}`,
    nextUp: "Siguiente juego",
    go: "¡Vamos!",
    skip: "Saltar este juego",
    finishNow: "Terminar la noche",
    spicyHint: "Noche loca: marcad los packs 18+ si el juego los tiene.",
    pause: "Pausar la noche",
    winnerTitle: "¿Quién ha ganado este juego?",
    winnerSub: "Toca uno o varios nombres.",
    nobody: "Nadie / empate",
    validate: (n) => (n > 1 ? `Confirmar (${n} ganadores)` : "Confirmar"),
    standings: "La clasificación de la noche",
    pts: (n) => `${n} pt${n === 1 ? "" : "s"}`,
    endTitle: "Fin de la Noche Zinzin",
    endSub: (p) => (p > 1 ? `${p} juegos jugados. ¡Menuda noche!` : p === 1 ? "1 juego jugado. ¡Menuda noche!" : "¡Menuda noche!"),
    titles: ["Rey de la noche", "El más zinzin", "Siempre en el ajo", "El alma de la fiesta", "El comodín del grupo", "La revelación", "El estratega", "El rey del farol"],
    lastTitle: "Premio al buen perdedor",
    share: "Compartir",
    shareHead: "Nuestra Noche Zinzin",
    shareGames: "En el menú",
    shared: "¡Clasificación compartida!",
    newSoiree: "Nueva noche",
    home: "Volver al inicio",
    kinds: { bluff: "Faroles", tel: "El móvil es el juego", devine: "Adivinar", rapide: "Rápido", ambiance: "Ambiente", boire: "Para beber", duo: "En pareja" },
  },
};
