import type { I18n, Lang } from "@/lib/i18n";
import type { AmmoKind, ChutContent } from "./types";
import { CONTENT_FR } from "./content.fr";
import { CONTENT_EN } from "./content.en";
import { CONTENT_ES } from "./content.es";

/** Contenu de la partie (figé dans la langue du début de partie). */
export const CHUT_CONTENT: I18n<ChutContent> = { fr: CONTENT_FR, en: CONTENT_EN, es: CONTENT_ES };

export function chutContent(lang: Lang): ChutContent {
  return CHUT_CONTENT[lang] ?? CONTENT_FR;
}

interface ChutStr {
  name: string;
  tagline: string;
  rules: string[];
  rulesTitle: string;
  rulesLabel: string;
  close: string;
  serious: string;
  clown: string;
  // Réglages
  setupTitle: string;
  secMode: string;
  modeDuel: string;
  modeDuelSub: string;
  modeTable: string;
  modeTableSub: string;
  secFormat: string;
  formatRotation: string;
  formatRotationSub: string;
  formatKo: string;
  formatKoSub: string;
  tours: (n: number) => string;
  duelsCount: (n: number) => string;
  secSens: string;
  sensLibrary: string;
  sensLibrarySub: string;
  sensLiving: string;
  sensLivingSub: string;
  sensClub: string;
  sensClubSub: string;
  secPenalty: string;
  dareTitle: string;
  dareSub: string;
  sipsTitle: string;
  sipsSub: string;
  secAmmo: string;
  adultTitle: string;
  adultSub: string;
  humanTitle: string;
  humanSub: string;
  toCalib: string;
  go: string;
  // Calibrage
  calibTitle: string;
  calibIntro: string;
  privacy: string;
  calibStart: string;
  calibListening: string;
  calibDone: string;
  ambQuiet: string;
  ambMid: string;
  ambLoud: string;
  loudTip: string;
  tryIt: string;
  testHit: string;
  recalibrate: string;
  calibOk: string;
  micErrTitle: string;
  micDenied: string;
  micUnavailable: string;
  retry: string;
  playHuman: string;
  micLost: string;
  noRecord: string;
  // Duel
  duelN: (i: number, total: number) => string;
  sudden: string;
  koRound: (left: number, round: number) => string;
  passHint: (serious: string) => string;
  faceOff: string;
  vs: string;
  seriousJob: string;
  clownJob: (s: number) => string;
  setupPhone: string;
  startDuel: string;
  hush: string;
  measuring: string;
  holdBtn: string;
  holdSub: string;
  talking: string;
  silence: string;
  silenceSub: string;
  overtime: string;
  ammoNext: string;
  kinds: Record<AmmoKind, string>;
  silentHint: string;
  holdOn: string;
  meter: string;
  crack: string;
  micPaused: string;
  laughed: (name: string) => string;
  humanHint: string;
  // Résultats
  cracked: string;
  crackedAfter: (name: string, s: string) => string;
  survivedTitle: string;
  survived: (name: string, s: number) => string;
  clownScore: (clown: string) => string;
  falseAlarm: string;
  penaltyFor: (name: string) => string;
  sips: (n: number) => string;
  orDare: string;
  rerollDare: string;
  nextDuel: string;
  seeBracket: string;
  toResults: string;
  finish: string;
  // Élimination
  matchWon: (name: string) => string;
  bye: (name: string) => string;
  coin: string;
  nextMatch: string;
  matchOf: (a: string, b: string) => string;
  pending: string;
  // Toute la table
  tableTitle: string;
  tableIntro: string;
  tableStart: string;
  tableLive: string;
  tableSound: string;
  tableWho: string;
  nobody: string;
  tableSurvived: string;
  tableSurvivedSub: (s: number) => string;
  tableRound: (n: number) => string;
  nextRound: string;
  humanTable: string;
  tableCulprit: (name: string) => string;
  // Fin
  endTitle: string;
  tombstone: string;
  tombstoneSub: string;
  weakest: string;
  weakestSub: string;
  goldClown: string;
  goldClownSub: string;
  champion: string;
  noteDuel: (cracks: number, held: number) => string;
  noteTable: (cracks: number) => string;
  unitS: string;
  replay: string;
  quit: string;
  sec: (s: string) => string;
  dec: string;
}

export const CHUT_STR: I18n<ChutStr> = {
  fr: {
    name: "Chut !",
    tagline: "Fais craquer le Sérieux. Le micro arbitre.",
    rules: [
      "Duel : deux joueurs face à face, le téléphone posé entre eux.",
      "Le Sérieux doit garder son calme : pas un rire, pas un pouffement.",
      "Le Clown a 30 secondes pour le faire craquer, avec les munitions proposées par l'app.",
      "Le Clown ne parle QUE en maintenant « À moi ! » : pendant ce temps, le micro est en pause.",
      "Il relâche : 3 secondes de silence qui tue. Le moindre bruit = BUZZ, le Sérieux a craqué.",
      "Toute la table : tout le monde se tait pendant que le téléphone affiche des trucs absurdes et fait des bruits ridicules. Le premier bruit perd.",
      "Pas de micro ? Un arbitre humain appuie sur « Il a ri ! ».",
    ],
    rulesTitle: "Les règles",
    rulesLabel: "Règles",
    close: "Fermer",
    serious: "Sérieux",
    clown: "Clown",
    setupTitle: "On joue comment ?",
    secMode: "Le mode",
    modeDuel: "Duel",
    modeDuelSub: "Un Clown contre un Sérieux, 30 secondes",
    modeTable: "Toute la table",
    modeTableSub: "Tout le monde se tait, le téléphone attaque",
    secFormat: "Le tournoi",
    formatRotation: "Rotation",
    formatRotationSub: "Chacun passe Sérieux face à un Clown différent",
    formatKo: "Élimination",
    formatKoSub: "Tableau à élimination directe, un seul survivant",
    tours: (n) => (n > 1 ? `${n} tours` : "1 tour"),
    duelsCount: (n) => (n > 1 ? `${n} duels au programme` : "1 duel au programme"),
    secSens: "La sensibilité",
    sensLibrary: "Bibliothèque",
    sensLibrarySub: "Le moindre pouffement compte",
    sensLiving: "Salon",
    sensLivingSub: "Un vrai rire, pas un souffle",
    sensClub: "Boîte de nuit",
    sensClubSub: "Pour les soirées bruyantes",
    secPenalty: "Celui qui craque prend…",
    dareTitle: "Un gage",
    dareSub: "Que des gages, zéro gorgée",
    sipsTitle: "Gorgées ou gage",
    sipsSub: "1 à 3 gorgées de zinzin, ou un gage",
    secAmmo: "Les munitions",
    adultTitle: "Pack 18+ coquin",
    adultSub: "Des munitions osées, jamais explicites",
    humanTitle: "Arbitre humain",
    humanSub: "Sans micro : un joueur appuie sur « Il a ri ! »",
    toCalib: "Calibrer le micro",
    go: "C'est parti !",
    calibTitle: "Calibrage",
    calibIntro: "Chut, tout le monde ! On écoute 3 secondes de silence pour mesurer le bruit de la pièce.",
    privacy: "On n'enregistre rien : le micro mesure seulement le volume, en direct, sur ce téléphone. Rien n'est gardé ni envoyé.",
    calibStart: "Autoriser le micro et calibrer",
    calibListening: "Silence…",
    calibDone: "Calibré !",
    ambQuiet: "Pièce calme",
    ambMid: "Un peu de bruit",
    ambLoud: "Ça fait la fête ici",
    loudTip: "Beaucoup de bruit : choisis Boîte de nuit ou éloignez-vous de la musique.",
    tryIt: "Teste : pouffe un coup, l'aiguille doit passer dans le rouge.",
    testHit: "Craqué ! Le micro t'a entendu.",
    recalibrate: "Recalibrer",
    calibOk: "C'est bon !",
    micErrTitle: "Micro indisponible",
    micDenied: "Le micro est refusé. Autorise-le dans les Réglages du téléphone, ou joue avec un arbitre humain.",
    micUnavailable: "Impossible d'utiliser le micro ici. Pas grave : un arbitre humain fera l'affaire.",
    retry: "Réessayer",
    playHuman: "Jouer avec un arbitre humain",
    micLost: "Micro perdu : on passe en arbitre humain.",
    noRecord: "Rien n'est enregistré",
    duelN: (i, total) => `Duel ${i}/${total}`,
    sudden: "Mort subite !",
    koRound: (left, round) => (left <= 2 ? "La finale" : left <= 4 ? "Les demi-finales" : left <= 8 ? "Les quarts de finale" : `Tour ${round}`),
    passHint: (s) => `Tu es le Clown. Pose le téléphone entre toi et ${s}, écran vers toi.`,
    faceOff: "Face à face",
    vs: "contre",
    seriousJob: "Garde ton calme. Pas un bruit.",
    clownJob: (s) => `Fais-le craquer en ${s} secondes.`,
    setupPhone: "Le téléphone est posé entre vous deux, écran côté Clown.",
    startDuel: "Lancer le duel",
    hush: "Chut…",
    measuring: "On mesure le silence",
    holdBtn: "À moi !",
    holdSub: "Maintiens pour parler",
    talking: "Le Clown parle… micro en pause",
    silence: "Le silence qui tue",
    silenceSub: "Pas un bruit !",
    overtime: "Prolongation : silence !",
    ammoNext: "Une autre munition",
    kinds: { voice: "Voix imposée", face: "Grimace", mime: "Imitation", question: "Question absurde", sound: "Bruitage", story: "Histoire" },
    silentHint: "Muet : pas besoin du bouton",
    holdOn: "Tiens bon !",
    meter: "Bruitomètre",
    crack: "Crac",
    micPaused: "Micro en pause",
    laughed: (n) => `${n} a ri !`,
    humanHint: "Arbitre humain : le premier qui entend un rire appuie.",
    cracked: "CRAQUÉ !",
    crackedAfter: (n, s) => `${n} a craqué au bout de ${s} s.`,
    survivedTitle: "Imperturbable !",
    survived: (n, s) => `${n} a tenu ${s} secondes sans un bruit.`,
    clownScore: (c) => `${c} a fait mouche !`,
    falseAlarm: "Faux bruit ? On reprend",
    penaltyFor: (n) => `Pour ${n}`,
    sips: (n) => (n > 1 ? `${n} gorgées de zinzin` : "1 gorgée de zinzin"),
    orDare: "ou le gage :",
    rerollDare: "Un autre gage",
    nextDuel: "Duel suivant",
    seeBracket: "Voir le tableau",
    toResults: "Voir le verdict",
    finish: "Terminer",
    matchWon: (n) => `${n} passe au tour suivant !`,
    bye: (n) => `${n} est qualifié d'office.`,
    coin: "Égalité parfaite : le hasard tranche !",
    nextMatch: "Match suivant",
    matchOf: (a, b) => `${a} contre ${b}`,
    pending: "à venir",
    tableTitle: "Toute la table",
    tableIntro: "Tout le monde se tait. Le téléphone va afficher des scènes absurdes et faire des bruits ridicules. Le premier qui fait un bruit a perdu.",
    tableStart: "Silence… on y va",
    tableLive: "Pas un bruit !",
    tableSound: "Le téléphone fait le malin (micro en pause)",
    tableWho: "Qui a craqué ?",
    nobody: "Personne, faux bruit : on reprend",
    tableSurvived: "Table de marbre !",
    tableSurvivedSub: (s) => `${s} secondes de silence total. Bravo… et un peu flippant.`,
    tableRound: (n) => `Manche ${n}`,
    nextRound: "Manche suivante",
    humanTable: "Quelqu'un a ri !",
    tableCulprit: (n) => `${n} a craqué !`,
    endTitle: "Le verdict",
    tombstone: "Pierre tombale",
    tombstoneSub: "Le plus sérieux de la soirée",
    weakest: "Le plus faible",
    weakestSub: "A craqué le plus vite",
    goldClown: "Clown d'or",
    goldClownSub: "A fait craquer le plus de monde",
    champion: "Champion du sérieux",
    noteDuel: (c, h) => `${c > 1 ? `${c} craquages` : `${c} craquage`} · ${h > 1 ? `${h} duels tenus` : `${h} duel tenu`}`,
    noteTable: (c) => (c === 0 ? "N'a jamais craqué" : c > 1 ? `${c} craquages` : "1 craquage"),
    unitS: "s",
    replay: "Rejouer",
    quit: "Quitter",
    sec: (s) => `${s} s`,
    dec: ",",
  },
  en: {
    name: "Shh!",
    tagline: "Make the Straight Face crack. The mic is the referee.",
    rules: [
      "Duel: two players face each other, the phone lying between them.",
      "The Straight Face must keep it together: no laugh, no snort.",
      "The Clown has 30 seconds to make them crack, using the ammo the app suggests.",
      "The Clown ONLY talks while holding “My turn!”: meanwhile, the mic is paused.",
      "Let go: 3 seconds of killer silence. The slightest sound = BUZZ, the Straight Face cracked.",
      "Whole table: everyone stays silent while the phone shows absurd scenes and makes silly noises. First sound loses.",
      "No mic? A human referee taps “They laughed!”.",
    ],
    rulesTitle: "The rules",
    rulesLabel: "Rules",
    close: "Close",
    serious: "Straight Face",
    clown: "Clown",
    setupTitle: "How do we play?",
    secMode: "The mode",
    modeDuel: "Duel",
    modeDuelSub: "One Clown vs one Straight Face, 30 seconds",
    modeTable: "Whole table",
    modeTableSub: "Everyone shuts up, the phone attacks",
    secFormat: "The tournament",
    formatRotation: "Rotation",
    formatRotationSub: "Everyone plays Straight Face against a different Clown",
    formatKo: "Knockout",
    formatKoSub: "Straight knockout bracket, only one survivor",
    tours: (n) => (n > 1 ? `${n} rounds` : "1 round"),
    duelsCount: (n) => (n > 1 ? `${n} duels coming up` : "1 duel coming up"),
    secSens: "Sensitivity",
    sensLibrary: "Library",
    sensLibrarySub: "The tiniest snort counts",
    sensLiving: "Living room",
    sensLivingSub: "A real laugh, not a breath",
    sensClub: "Nightclub",
    sensClubSub: "For noisy parties",
    secPenalty: "Whoever cracks gets…",
    dareTitle: "A dare",
    dareSub: "Dares only, zero sips",
    sipsTitle: "Sips or a dare",
    sipsSub: "1 to 3 zinzin sips, or a dare",
    secAmmo: "The ammo",
    adultTitle: "Cheeky 18+ pack",
    adultSub: "Daring ammo, never explicit",
    humanTitle: "Human referee",
    humanSub: "No mic: a player taps “They laughed!”",
    toCalib: "Calibrate the mic",
    go: "Let's go!",
    calibTitle: "Calibration",
    calibIntro: "Shh, everyone! We listen to 3 seconds of silence to measure how noisy the room is.",
    privacy: "Nothing is recorded: the mic only measures the volume, live, on this phone. Nothing is kept or sent.",
    calibStart: "Allow the mic and calibrate",
    calibListening: "Silence…",
    calibDone: "Calibrated!",
    ambQuiet: "Quiet room",
    ambMid: "A bit of noise",
    ambLoud: "Party in here",
    loudTip: "Lots of noise: pick Nightclub or move away from the music.",
    tryIt: "Test it: snort once, the needle should hit the red.",
    testHit: "Cracked! The mic heard you.",
    recalibrate: "Recalibrate",
    calibOk: "All good!",
    micErrTitle: "Mic unavailable",
    micDenied: "Mic access was denied. Allow it in the phone's Settings, or play with a human referee.",
    micUnavailable: "We can't use the mic here. No worries: a human referee will do.",
    retry: "Try again",
    playHuman: "Play with a human referee",
    micLost: "Mic lost: switching to a human referee.",
    noRecord: "Nothing is recorded",
    duelN: (i, total) => `Duel ${i}/${total}`,
    sudden: "Sudden death!",
    koRound: (left, round) => (left <= 2 ? "The final" : left <= 4 ? "The semi-finals" : left <= 8 ? "The quarter-finals" : `Round ${round}`),
    passHint: (s) => `You're the Clown. Put the phone down between you and ${s}, screen facing you.`,
    faceOff: "Face-off",
    vs: "vs",
    seriousJob: "Keep calm. Not a sound.",
    clownJob: (s) => `Make them crack in ${s} seconds.`,
    setupPhone: "The phone lies between you two, screen facing the Clown.",
    startDuel: "Start the duel",
    hush: "Shh…",
    measuring: "Measuring the silence",
    holdBtn: "My turn!",
    holdSub: "Hold to talk",
    talking: "The Clown is talking… mic paused",
    silence: "Killer silence",
    silenceSub: "Not a sound!",
    overtime: "Overtime: silence!",
    ammoNext: "Other ammo",
    kinds: { voice: "Funny voice", face: "Face", mime: "Impression", question: "Absurd question", sound: "Sound effect", story: "Story" },
    silentHint: "Silent: no button needed",
    holdOn: "Hang in there!",
    meter: "Noise-o-meter",
    crack: "Crack",
    micPaused: "Mic paused",
    laughed: (n) => `${n} laughed!`,
    humanHint: "Human referee: whoever hears a laugh first taps.",
    cracked: "CRACKED!",
    crackedAfter: (n, s) => `${n} cracked after ${s} s.`,
    survivedTitle: "Unshakeable!",
    survived: (n, s) => `${n} lasted ${s} seconds without a sound.`,
    clownScore: (c) => `${c} nailed it!`,
    falseAlarm: "False alarm? Resume",
    penaltyFor: (n) => `For ${n}`,
    sips: (n) => (n > 1 ? `${n} zinzin sips` : "1 zinzin sip"),
    orDare: "or the dare:",
    rerollDare: "Another dare",
    nextDuel: "Next duel",
    seeBracket: "See the bracket",
    toResults: "See the verdict",
    finish: "Finish",
    matchWon: (n) => `${n} goes through!`,
    bye: (n) => `${n} gets a bye.`,
    coin: "Perfect tie: fate decides!",
    nextMatch: "Next match",
    matchOf: (a, b) => `${a} vs ${b}`,
    pending: "coming up",
    tableTitle: "Whole table",
    tableIntro: "Everyone stays silent. The phone will show absurd scenes and make silly noises. The first one to make a sound loses.",
    tableStart: "Silence… here we go",
    tableLive: "Not a sound!",
    tableSound: "The phone is showing off (mic paused)",
    tableWho: "Who cracked?",
    nobody: "Nobody, false alarm: resume",
    tableSurvived: "Stone-cold table!",
    tableSurvivedSub: (s) => `${s} seconds of total silence. Well done… and a bit creepy.`,
    tableRound: (n) => `Round ${n}`,
    nextRound: "Next round",
    humanTable: "Someone laughed!",
    tableCulprit: (n) => `${n} cracked!`,
    endTitle: "The verdict",
    tombstone: "Tombstone",
    tombstoneSub: "The most serious face of the night",
    weakest: "The weakest",
    weakestSub: "Cracked the fastest",
    goldClown: "Golden Clown",
    goldClownSub: "Made the most people crack",
    champion: "Champion of serious",
    noteDuel: (c, h) => `${c === 1 ? "1 crack" : `${c} cracks`} · ${h === 1 ? "1 duel held" : `${h} duels held`}`,
    noteTable: (c) => (c === 0 ? "Never cracked" : c === 1 ? "1 crack" : `${c} cracks`),
    unitS: "s",
    replay: "Play again",
    quit: "Quit",
    sec: (s) => `${s} s`,
    dec: ".",
  },
  es: {
    name: "¡Chis!",
    tagline: "Haz que el Serio se ría. El micro es el árbitro.",
    rules: [
      "Duelo: dos jugadores cara a cara, con el teléfono entre ellos.",
      "El Serio debe mantener la calma: ni una risa, ni un resoplido.",
      "El Payaso tiene 30 segundos para hacerle reír, con la munición que propone la app.",
      "El Payaso SOLO habla mientras mantiene «¡Me toca!»: mientras tanto, el micro está en pausa.",
      "Al soltar: 3 segundos de silencio mortal. El menor ruido = ¡BUZZ!, el Serio se ha reído.",
      "Toda la mesa: todos en silencio mientras el teléfono muestra escenas absurdas y hace ruidos ridículos. El primer ruido pierde.",
      "¿Sin micro? Un árbitro humano pulsa «¡Se rió!».",
    ],
    rulesTitle: "Las reglas",
    rulesLabel: "Reglas",
    close: "Cerrar",
    serious: "Serio",
    clown: "Payaso",
    setupTitle: "¿Cómo jugamos?",
    secMode: "El modo",
    modeDuel: "Duelo",
    modeDuelSub: "Un Payaso contra un Serio, 30 segundos",
    modeTable: "Toda la mesa",
    modeTableSub: "Todos callados, el teléfono ataca",
    secFormat: "El torneo",
    formatRotation: "Rotación",
    formatRotationSub: "Todos hacen de Serio contra un Payaso distinto",
    formatKo: "Eliminatoria",
    formatKoSub: "Cuadro de eliminación directa, un solo superviviente",
    tours: (n) => (n > 1 ? `${n} vueltas` : "1 vuelta"),
    duelsCount: (n) => (n > 1 ? `${n} duelos en el programa` : "1 duelo en el programa"),
    secSens: "La sensibilidad",
    sensLibrary: "Biblioteca",
    sensLibrarySub: "El menor resoplido cuenta",
    sensLiving: "Salón",
    sensLivingSub: "Una risa de verdad, no un suspiro",
    sensClub: "Discoteca",
    sensClubSub: "Para fiestas ruidosas",
    secPenalty: "Quien se ría se lleva…",
    dareTitle: "Un reto",
    dareSub: "Solo retos, cero tragos",
    sipsTitle: "Tragos o reto",
    sipsSub: "1 a 3 tragos de zinzin, o un reto",
    secAmmo: "La munición",
    adultTitle: "Pack pícaro +18",
    adultSub: "Munición atrevida, nunca explícita",
    humanTitle: "Árbitro humano",
    humanSub: "Sin micro: un jugador pulsa «¡Se rió!»",
    toCalib: "Calibrar el micro",
    go: "¡Vamos!",
    calibTitle: "Calibración",
    calibIntro: "¡Chis, todos! Escuchamos 3 segundos de silencio para medir el ruido de la sala.",
    privacy: "No grabamos nada: el micro solo mide el volumen, en directo, en este teléfono. Nada se guarda ni se envía.",
    calibStart: "Permitir el micro y calibrar",
    calibListening: "Silencio…",
    calibDone: "¡Calibrado!",
    ambQuiet: "Sala tranquila",
    ambMid: "Algo de ruido",
    ambLoud: "Aquí hay fiesta",
    loudTip: "Mucho ruido: elige Discoteca o alejaos de la música.",
    tryIt: "Prueba: suelta una risita, la aguja debe llegar al rojo.",
    testHit: "¡Pillado! El micro te ha oído.",
    recalibrate: "Recalibrar",
    calibOk: "¡Listo!",
    micErrTitle: "Micro no disponible",
    micDenied: "Se ha denegado el micro. Actívalo en los Ajustes del teléfono, o juega con un árbitro humano.",
    micUnavailable: "No podemos usar el micro aquí. No pasa nada: un árbitro humano servirá.",
    retry: "Reintentar",
    playHuman: "Jugar con un árbitro humano",
    micLost: "Micro perdido: pasamos a árbitro humano.",
    noRecord: "No se graba nada",
    duelN: (i, total) => `Duelo ${i}/${total}`,
    sudden: "¡Muerte súbita!",
    koRound: (left, round) => (left <= 2 ? "La final" : left <= 4 ? "Las semifinales" : left <= 8 ? "Los cuartos de final" : `Ronda ${round}`),
    passHint: (s) => `Eres el Payaso. Pon el teléfono entre tú y ${s}, con la pantalla hacia ti.`,
    faceOff: "Cara a cara",
    vs: "contra",
    seriousJob: "Mantén la calma. Ni un ruido.",
    clownJob: (s) => `Hazle reír en ${s} segundos.`,
    setupPhone: "El teléfono está entre los dos, con la pantalla hacia el Payaso.",
    startDuel: "Empezar el duelo",
    hush: "Chis…",
    measuring: "Medimos el silencio",
    holdBtn: "¡Me toca!",
    holdSub: "Mantén pulsado para hablar",
    talking: "El Payaso habla… micro en pausa",
    silence: "El silencio mortal",
    silenceSub: "¡Ni un ruido!",
    overtime: "Prórroga: ¡silencio!",
    ammoNext: "Otra munición",
    kinds: { voice: "Voz impuesta", face: "Mueca", mime: "Imitación", question: "Pregunta absurda", sound: "Efecto de sonido", story: "Historia" },
    silentHint: "Muda: no hace falta el botón",
    holdOn: "¡Aguanta!",
    meter: "Ruidómetro",
    crack: "Crac",
    micPaused: "Micro en pausa",
    laughed: (n) => `¡${n} se rió!`,
    humanHint: "Árbitro humano: el primero que oiga una risa pulsa.",
    cracked: "¡SE RIÓ!",
    crackedAfter: (n, s) => `${n} se rió a los ${s} s.`,
    survivedTitle: "¡Imperturbable!",
    survived: (n, s) => `${n} aguantó ${s} segundos sin hacer ruido.`,
    clownScore: (c) => `¡${c} dio en el clavo!`,
    falseAlarm: "¿Ruido falso? Seguimos",
    penaltyFor: (n) => `Para ${n}`,
    sips: (n) => (n > 1 ? `${n} tragos de zinzin` : "1 trago de zinzin"),
    orDare: "o el reto:",
    rerollDare: "Otro reto",
    nextDuel: "Siguiente duelo",
    seeBracket: "Ver el cuadro",
    toResults: "Ver el veredicto",
    finish: "Terminar",
    matchWon: (n) => `¡${n} pasa a la siguiente ronda!`,
    bye: (n) => `${n} pasa directamente.`,
    coin: "Empate perfecto: ¡decide el azar!",
    nextMatch: "Siguiente enfrentamiento",
    matchOf: (a, b) => `${a} contra ${b}`,
    pending: "pendiente",
    tableTitle: "Toda la mesa",
    tableIntro: "Todos en silencio. El teléfono mostrará escenas absurdas y hará ruidos ridículos. El primero que haga ruido pierde.",
    tableStart: "Silencio… allá vamos",
    tableLive: "¡Ni un ruido!",
    tableSound: "El teléfono se hace el gracioso (micro en pausa)",
    tableWho: "¿Quién se rió?",
    nobody: "Nadie, ruido falso: seguimos",
    tableSurvived: "¡Mesa de mármol!",
    tableSurvivedSub: (s) => `${s} segundos de silencio total. Bravo… y un poco inquietante.`,
    tableRound: (n) => `Ronda ${n}`,
    nextRound: "Siguiente ronda",
    humanTable: "¡Alguien se rió!",
    tableCulprit: (n) => `¡${n} se rió!`,
    endTitle: "El veredicto",
    tombstone: "Cara de piedra",
    tombstoneSub: "El más serio de la noche",
    weakest: "El más flojo",
    weakestSub: "Se rió el primero",
    goldClown: "Payaso de oro",
    goldClownSub: "Hizo reír a más gente",
    champion: "Campeón de la seriedad",
    noteDuel: (c, h) => `${c === 1 ? "1 risa" : `${c} risas`} · ${h === 1 ? "1 duelo aguantado" : `${h} duelos aguantados`}`,
    noteTable: (c) => (c === 0 ? "Nunca se rió" : c === 1 ? "1 risa" : `${c} risas`),
    unitS: "s",
    replay: "Volver a jugar",
    quit: "Salir",
    sec: (s) => `${s} s`,
    dec: ",",
  },
};
