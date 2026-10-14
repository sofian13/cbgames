import type { I18n } from "@/lib/i18n";
import type { ModeId, ZoneId } from "./modes";

/**
 * Textes du choix de mode et des 4 modes micro (« Le bon volume », « Chuchote-le ! »,
 * « Crescendo », « Le Souffle »). Les textes du duel et de « Silence total » sont dans i18n.ts.
 */
interface ModesStr {
  // Choix du mode
  modesTitle: string;
  modesSub: string;
  star: string;
  min4: string;
  modeName: Record<ModeId, string>;
  modeSub: Record<ModeId, string>;
  modeWho: Record<ModeId, string>;
  howTo: string;
  steps: Record<ModeId, string[]>;
  rules: Record<ModeId, string[]>;
  allModes: string;
  changeMode: string;
  recalib: string;
  calibrated: string;
  // Réglages
  secTours: string;
  tours: (n: number) => string;
  phrasesCount: (n: number) => string;
  secTeams: string;
  teamNames: [string, string];
  shuffleTeams: string;
  secRounds: string;
  roundsPerTeam: (n: number) => string;
  secDirection: string;
  dirUp: string;
  dirUpSub: string;
  dirDown: string;
  dirDownSub: string;
  secFalls: string;
  falls: (n: number) => string;
  fallsSub: string;
  humanSub: Record<ModeId, string>;
  secMic: string;
  micOn: string;
  micOnSub: string;
  wSens: Record<"library" | "living" | "club", string>;
  secPenaltyTeam: string;
  secPenaltyLast: string;
  // Commun
  /** « Libellé : valeur » avec la ponctuation de la langue */
  labelled: (label: string, value: string) => string;
  /** Citation avec les guillemets de la langue */
  quote: (s: string) => string;
  holdNear: string;
  nextPlayer: string;
  seeRanking: string;
  finishEarly: string;
  lastPenalty: string;
  tieBottom: string;
  unitPts: string;
  ready: string;
  zone: Record<ZoneId, string>;
  zoneHint: Record<ZoneId, string>;
  narrow: string;
  endTitle: string;
  // Le bon volume
  vChip: (i: number, total: number) => string;
  vLevel: (n: number) => string;
  vYourZone: string;
  vReadyHint: string;
  vShow: string;
  vTalk: string;
  vTalkSub: string;
  vTalking: string;
  vTryHint: string;
  vInZone: (pct: number) => string;
  vTooShort: string;
  vNothing: string;
  vVerdict: [string, string, string, string];
  vPctLabel: string;
  vBonus: string;
  vNoBonus: string;
  vTooLoud: string;
  vTooSoft: string;
  vContest: string;
  vContested: string;
  vRetry: string;
  vJudgeTitle: string;
  vJudge: [string, string, string, string];
  vWhole: string;
  vPassHint: (zone: string) => string;
  vNote: (n: number, avg: number) => string;
  meterLabel: string;
  // Chuchote-le !
  wRound: (i: number, total: number) => string;
  wPassHint: (team: string) => string;
  wReadyTitle: string;
  wReadyHint: string;
  wGo: string;
  wFound: string;
  wSkip: string;
  wBuzz: string;
  wBuzzSub: string;
  wMeter: string;
  wOk: string;
  wLoud: string;
  wTimeUp: string;
  wRoundScore: (team: string, pts: number) => string;
  wFoundN: (n: number) => string;
  wBuzzN: (n: number) => string;
  wSkipN: (n: number) => string;
  wNext: string;
  wHumanBuzz: string;
  wHumanBuzzWho: string;
  wHumanHint: string;
  wWinner: (team: string) => string;
  wTie: string;
  wTieNote: string;
  wPenaltyTeam: (team: string) => string;
  wPts: (n: number) => string;
  wGuessers: (names: string) => string;
  // Crescendo
  cChain: (n: number) => string;
  cFalls: (n: number, max: number) => string;
  cRecord: string;
  cFirstUp: string;
  cFirstDown: string;
  cPassHint: (up: boolean) => string;
  cHold: string;
  cHoldSub: string;
  cHolding: string;
  cBoom: string;
  cOk: (up: boolean) => string;
  cNewRecord: string;
  cFail: { weak: string; boom: string; loud: string; silent: string };
  cFailSub: string;
  cNewChain: string;
  cShort: string;
  cJudge: (up: boolean) => string;
  cYes: string;
  cNo: string;
  cNote: (falls: number, ok: number) => string;
  cHumanHint: (up: boolean) => string;
  // Le Souffle
  sTour: (i: number, total: number) => string;
  sPassHint: (zone: string) => string;
  sReadyHint: string;
  sGo: string;
  sWaiting: string;
  sHolding: string;
  sOut: string;
  sRecord: (name: string, s: string) => string;
  sNoRecord: string;
  sNewRecord: string;
  sNoStart: string;
  sHumanStart: string;
  sHumanStop: string;
  sHumanHint: string;
  sNote: (best: string) => string;
}

export const MODES_STR: I18n<ModesStr> = {
  fr: {
    modesTitle: "Choisis ton mode",
    modesSub: "Le micro entend un bruit, pas qui l'a fait : chaque mode dit clairement qui il écoute.",
    star: "Mode phare",
    min4: "4 joueurs minimum",
    modeName: { volume: "Le bon volume", whisper: "Chuchote-le !", crescendo: "Crescendo", souffle: "Le Souffle", duel: "Ne ris pas !", table: "Silence total" },
    modeSub: {
      volume: "Dis la phrase en gardant l'aiguille dans la zone",
      whisper: "Fais deviner des mots… en chuchotant",
      crescendo: "Chacun plus fort que le précédent, sans exploser",
      souffle: "Tiens un « Aaaah » le plus longtemps possible",
      duel: "Un Clown contre un Sérieux, 30 secondes",
      table: "Tout le monde se tait, le téléphone attaque",
    },
    modeWho: { volume: "Tél en main", whisper: "2 équipes", crescendo: "Tél en main", souffle: "Tél en main", duel: "Face à face", table: "Toute la table" },
    howTo: "Comment on joue",
    steps: {
      volume: [
        "Le téléphone passe de main en main. L'app te donne une phrase et une zone : murmure, voix normale, forte ou cri.",
        "Tiens le tél près de ta bouche, maintiens « Parler » et dis la phrase en gardant l'aiguille dans la zone.",
        "Ton score = le % du temps passé dans la zone, +20 si tu dis la phrase en entier. Le dernier prend la peine.",
      ],
      whisper: [
        "Deux équipes. Celui qui tient le tél fait deviner un max de mots à son équipe en 60 secondes.",
        "Interdit de parler fort : on CHUCHOTE. Le micro entend toute la table, devineurs compris.",
        "Trouvé = +1. Un éclat de voix = BUZZ, mot perdu et −1. L'équipe perdante prend la peine.",
      ],
      crescendo: [
        "On se passe le tél. Chacun fait un son, en maintenant le bouton, près de sa bouche.",
        "Il doit être PLUS FORT que le précédent (ou plus doux en Decrescendo)… sans dépasser le plafond BOUM.",
        "Celui qui rate casse la chaîne et prend la peine. Nouvelle chaîne, on recommence à zéro.",
      ],
      souffle: [
        "Chacun son tour, le tél près de la bouche.",
        "Inspire, et tiens un « Aaaah » le plus longtemps possible en restant dans la zone de volume.",
        "Le chrono s'arrête dès que tu sors de la zone. Record à battre ; le dernier prend la peine.",
      ],
      duel: [
        "Deux joueurs face à face, le téléphone posé entre eux.",
        "Le Clown a 30 s pour faire craquer le Sérieux. Il parle en maintenant « À moi ! » (micro en pause).",
        "Il relâche : 3 s de silence qui tue. Le moindre bruit du Sérieux = BUZZ et une peine.",
      ],
      table: [
        "Le téléphone au milieu de la table, tout le monde se tait.",
        "Il affiche des scènes absurdes et fait des bruits ridicules pendant 30 secondes.",
        "Le premier bruit = BUZZ. La table désigne le coupable, qui prend la peine.",
      ],
    },
    rules: {
      volume: [
        "Le téléphone passe de main en main : seul celui qui le tient joue, les autres se taisent.",
        "L'app affiche une phrase (de plus en plus absurde) et une zone cible sur la jauge : murmure, voix normale, voix forte ou cri. Aux niveaux avancés, la zone se resserre.",
        "Maintiens « Parler », dis la phrase en entier en gardant l'aiguille dans la zone, puis relâche.",
        "Score = % du temps de parole passé dans la zone (sur 100), +20 si la phrase a été dite en entier (durée minimale). La table peut contester le bonus.",
        "Après tous les tours, le dernier du classement prend la peine.",
      ],
      whisper: [
        "Deux équipes. À chaque manche, un joueur tient le téléphone et fait deviner un maximum de mots à son équipe en 60 secondes, sans dire le mot.",
        "Tout se fait en chuchotant : celui qui fait deviner ET ceux qui devinent.",
        "Le micro entend toute la table : si le volume dépasse le seuil du chuchotement, BUZZ ! Le mot en cours est perdu et l'équipe prend −1.",
        "« Trouvé ! » = +1 ; « Passer » = 0. Les équipes alternent, celui qui fait deviner change à chaque manche.",
        "À la fin, l'équipe perdante prend la peine (chaque membre).",
      ],
      crescendo: [
        "On se passe le téléphone. Celui qui le tient maintient le bouton et fait un son, près de sa bouche.",
        "Crescendo : chaque son doit être plus fort que le record de la chaîne, sans atteindre le plafond BOUM.",
        "Decrescendo : chaque son doit être plus doux que le précédent, mais toujours audible.",
        "Celui qui rate casse la chaîne et prend la peine ; une nouvelle chaîne repart de zéro.",
        "La partie s'arrête au nombre de chutes choisi. Le moins de chutes gagne.",
      ],
      souffle: [
        "Chacun son tour, le téléphone près de la bouche, les autres en silence.",
        "Tiens un « Aaaah » le plus longtemps possible en restant dans la zone de volume affichée.",
        "Le chrono démarre quand tu entres dans la zone et s'arrête si tu en sors plus d'une demi-seconde.",
        "Un tour par zone (voix normale, puis murmure, puis voix forte). Le total des temps fait le classement ; le dernier prend la peine.",
      ],
      duel: [
        "Deux joueurs face à face, le téléphone posé entre eux.",
        "Le Sérieux doit garder son calme : pas un rire, pas un pouffement.",
        "Le Clown a 30 secondes pour le faire craquer, avec les munitions proposées par l'app.",
        "Le Clown ne parle QUE en maintenant « À moi ! » : pendant ce temps, le micro est en pause.",
        "Il relâche : 3 secondes de silence qui tue. Le moindre bruit = BUZZ, le Sérieux a craqué.",
      ],
      table: [
        "Le téléphone est posé au milieu : tout le monde se tait.",
        "Il affiche des scènes absurdes et fait des bruits ridicules (le micro se bouche les oreilles pendant ses propres sons).",
        "Le premier bruit = BUZZ. Le micro ne sait pas qui : la table désigne le coupable.",
      ],
    },
    allModes: "Les modes",
    changeMode: "Changer de mode",
    recalib: "Recalibrer le micro",
    calibrated: "Micro calibré",
    secTours: "Les tours",
    tours: (n) => (n > 1 ? `${n} tours` : "1 tour"),
    phrasesCount: (n) => (n > 1 ? `${n} passages au programme` : "1 passage au programme"),
    secTeams: "Les équipes",
    teamNames: ["Les Souris", "Les Hiboux"],
    shuffleTeams: "Mélanger les équipes",
    secRounds: "Les manches",
    roundsPerTeam: (n) => (n > 1 ? `${n} manches par équipe` : "1 manche par équipe"),
    secDirection: "Le sens",
    dirUp: "Crescendo",
    dirUpSub: "De plus en plus fort",
    dirDown: "Decrescendo",
    dirDownSub: "De plus en plus doux",
    secFalls: "La durée",
    falls: (n) => `${n} chutes`,
    fallsSub: "La partie s'arrête à la dernière chute",
    humanSub: {
      volume: "Sans micro : la table juge chaque phrase",
      whisper: "Sans micro : un joueur de l'autre équipe voit l'écran et appuie sur BUZZ",
      crescendo: "Sans micro : la table juge chaque son",
      souffle: "Sans micro : la table arrête le chrono",
      duel: "Sans micro : un joueur appuie sur « Il a ri ! »",
      table: "Sans micro : un joueur appuie au premier rire",
    },
    labelled: (l, v) => `${l} : ${v}`,
    quote: (q) => `« ${q} »`,
    secMic: "Le micro",
    micOn: "Avec le micro",
    micOnSub: "Il mesure le volume, rien n'est enregistré",
    wSens: { library: "Seuil très bas : chuchotement de souris", living: "Seuil normal : chuchotement de salon", club: "Seuil haut : pour les pièces bruyantes" },
    secPenaltyTeam: "L'équipe perdante prend…",
    secPenaltyLast: "Le dernier prend…",
    holdNear: "Tiens le téléphone près de ta bouche, à une main de distance.",
    nextPlayer: "Joueur suivant",
    seeRanking: "Voir le classement",
    finishEarly: "Terminer",
    lastPenalty: "La lanterne rouge",
    tieBottom: "Égalité tout en bas : pas de peine cette fois. Revanche ?",
    unitPts: "pts",
    ready: "Je suis prêt",
    zone: { whisper: "Murmure", normal: "Voix normale", loud: "Voix forte", shout: "Cri" },
    zoneHint: { whisper: "Comme à la bibliothèque", normal: "Comme au dîner", loud: "Comme pour appeler quelqu'un", shout: "Comme au stade" },
    narrow: "zone étroite",
    endTitle: "Le classement",
    vChip: (i, total) => `Passage ${i}/${total}`,
    vLevel: (n) => (n === 1 ? "Niveau 1" : n === 2 ? "Niveau 2 · farfelu" : "Niveau 3 · absurde"),
    vYourZone: "Ta zone",
    vReadyHint: "Maintiens « Parler », dis la phrase en gardant l'aiguille dans la zone, relâche quand tu as fini.",
    vShow: "Voir ma phrase",
    vTalk: "Parler",
    vTalkSub: "Maintiens pendant toute la phrase",
    vTalking: "Relâche quand tu as fini",
    vTryHint: "Teste ta voix avant d'appuyer : ça ne compte pas encore.",
    vInZone: (p) => `Dans la zone : ${p} %`,
    vTooShort: "Maintiens « Parler » pendant toute la phrase !",
    vNothing: "On n'a rien entendu…",
    vVerdict: ["Raté !", "Bof…", "Pas mal !", "Pile-poil !"],
    vPctLabel: "du temps dans la zone",
    vBonus: "Phrase entière : +20",
    vNoBonus: "Trop rapide : pas de bonus",
    vTooLoud: "Tu étais surtout trop fort.",
    vTooSoft: "Tu étais surtout trop bas.",
    vContest: "La table conteste : phrase pas finie",
    vContested: "Bonus retiré par la table",
    vRetry: "Faux départ ? Recommencer",
    vJudgeTitle: "La table juge le volume :",
    vJudge: ["Raté", "Bof", "Presque", "Pile !"],
    vWhole: "Phrase dite en entier (+20)",
    vPassHint: (z) => `Ta zone : ${z}. Tiens le téléphone près de ta bouche, les autres se taisent.`,
    vNote: (n, avg) => `${n > 1 ? `${n} phrases` : "1 phrase"} · ${avg} % dans la zone`,
    meterLabel: "Volume de ta voix",
    wRound: (i, total) => `Manche ${i}/${total}`,
    wPassHint: (team) => `Fais deviner ${team} en CHUCHOTANT. Garde l'écran pour toi.`,
    wReadyTitle: "60 secondes",
    wReadyHint: "Chuchote des indices sans dire le mot. Ton équipe devine… en chuchotant aussi ! Le micro entend toute la table : au moindre éclat de voix, BUZZ et le mot est perdu (−1).",
    wGo: "Go, en chuchotant",
    wFound: "Trouvé !",
    wSkip: "Passer",
    wBuzz: "BUZZ !",
    wBuzzSub: "Trop fort : mot perdu, −1",
    wMeter: "Volume de la table",
    wOk: "Chuchotement OK",
    wLoud: "Trop fort !",
    wTimeUp: "Temps écoulé !",
    wRoundScore: (team, p) => `${team} : ${p > 0 ? "+" : ""}${p} cette manche`,
    wFoundN: (n) => (n > 1 ? `${n} trouvés` : `${n} trouvé`),
    wBuzzN: (n) => (n > 1 ? `${n} buzz` : `${n} buzz`),
    wSkipN: (n) => (n > 1 ? `${n} passés` : `${n} passé`),
    wNext: "Manche suivante",
    wHumanBuzz: "BUZZ ! Trop fort",
    wHumanBuzzWho: "Bouton de l'AUTRE équipe :",
    wHumanHint: "Sans micro : un joueur de l'AUTRE équipe s'assoit à côté du chuchoteur, regarde l'écran et appuie sur BUZZ au moindre éclat de voix. Ton équipe, elle, ne regarde pas l'écran !",
    wWinner: (team) => `${team} gagnent !`,
    wTie: "Égalité parfaite !",
    wTieNote: "Pas de peine cette fois. Revanche ?",
    wPenaltyTeam: (team) => `Pour chaque membre : ${team}`,
    wPts: (n) => (Math.abs(n) > 1 ? `${n} pts` : `${n} pt`),
    wGuessers: (names) => `Devinent : ${names}`,
    cChain: (n) => `Chaîne ${n}`,
    cFalls: (n, max) => `Chute ${n}/${max}`,
    cRecord: "Record à battre",
    cFirstUp: "Premier son de la chaîne : à toi de placer la barre (pas trop haut !).",
    cFirstDown: "Premier son de la chaîne : sous le plafond BOUM, mais pas trop bas.",
    cPassHint: (up) => (up ? "Fais un son PLUS FORT que le précédent… sans exploser !" : "Fais un son PLUS DOUX que le précédent… mais qu'on entende !"),
    cHold: "Maintiens et fais ton son",
    cHoldSub: "Relâche quand c'est fait",
    cHolding: "Je t'écoute…",
    cBoom: "BOUM",
    cOk: (up) => (up ? "Plus fort !" : "Plus doux !"),
    cNewRecord: "Nouveau record de la chaîne",
    cFail: { weak: "Pas plus fort !", boom: "EXPLOSION !", loud: "Pas plus doux !", silent: "On n'a rien entendu !" },
    cFailSub: "La chaîne casse.",
    cNewChain: "Nouvelle chaîne",
    cShort: "Maintiens un peu plus longtemps !",
    cJudge: (up) => (up ? "La table juge : c'était plus fort, sans hurler ?" : "La table juge : c'était plus doux, et audible ?"),
    cYes: "Réussi",
    cNo: "Raté",
    cNote: (f, ok) => `${f > 1 ? `${f} chutes` : `${f} chute`} · ${ok > 1 ? `${ok} réussites` : `${ok} réussite`}`,
    cHumanHint: (up) => (up ? "Fais un son plus fort que le précédent, la table juge." : "Fais un son plus doux que le précédent, la table juge."),
    sTour: (i, total) => `Tour ${i}/${total}`,
    sPassHint: (z) => `Inspire un grand coup. Tiens un « Aaaah » le plus longtemps possible, zone : ${z}.`,
    sReadyHint: "Le chrono démarre quand ton « Aaaah » entre dans la zone et s'arrête si tu en sors.",
    sGo: "Aaaaaah !",
    sWaiting: "Vas-y, lance ton « Aaaah »",
    sHolding: "Tiens bon !",
    sOut: "Hors zone !",
    sRecord: (n, s) => `Record : ${n}, ${s} s`,
    sNoRecord: "Pas encore de record",
    sNewRecord: "Nouveau record !",
    sNoStart: "Pas démarré à temps",
    sHumanStart: "Top départ",
    sHumanStop: "Lâché !",
    sHumanHint: "Sans micro : la table arrête le chrono dès que le son s'arrête ou change de volume.",
    sNote: (b) => `Meilleur : ${b} s`,
  },
  en: {
    modesTitle: "Pick your mode",
    modesSub: "The mic hears a sound, not who made it: each mode makes it clear who it's listening to.",
    star: "Top mode",
    min4: "4 players minimum",
    modeName: { volume: "Volume Control", whisper: "Whisper It!", crescendo: "Crescendo", souffle: "Hold the Note", duel: "Don't Laugh!", table: "Total Silence" },
    modeSub: {
      volume: "Say the line and keep the needle in the zone",
      whisper: "Get your team to guess words… in a whisper",
      crescendo: "Each one louder than the last, without blowing up",
      souffle: "Hold an \"Aaaah\" for as long as you can",
      duel: "One Clown vs one Straight Face, 30 seconds",
      table: "Everyone shuts up, the phone attacks",
    },
    modeWho: { volume: "Phone in hand", whisper: "2 teams", crescendo: "Phone in hand", souffle: "Phone in hand", duel: "Face to face", table: "Whole table" },
    howTo: "How to play",
    steps: {
      volume: [
        "The phone goes from hand to hand. The app gives you a line and a zone: whisper, normal voice, loud or shout.",
        "Hold the phone near your mouth, hold \"Talk\" and say the line while keeping the needle in the zone.",
        "Your score = % of time spent in the zone, +20 if you say the whole line. Last place takes the penalty.",
      ],
      whisper: [
        "Two teams. Whoever holds the phone gets their team to guess as many words as possible in 60 seconds.",
        "No loud voices: you WHISPER. The mic hears the whole table, guessers included.",
        "Got it = +1. Any loud burst = BUZZ, word lost and −1. The losing team takes the penalty.",
      ],
      crescendo: [
        "Pass the phone around. Each player holds the button and makes a sound, close to their mouth.",
        "It must be LOUDER than the last one (or softer in Decrescendo)… without hitting the BOOM ceiling.",
        "Miss it and you break the chain and take the penalty. New chain, back to zero.",
      ],
      souffle: [
        "Take turns, phone close to your mouth.",
        "Breathe in, then hold an \"Aaaah\" for as long as you can while staying in the volume zone.",
        "The clock stops as soon as you leave the zone. Beat the record; last place takes the penalty.",
      ],
      duel: [
        "Two players face to face, the phone lying between them.",
        "The Clown has 30 s to crack the Straight Face, talking only while holding \"My turn!\" (mic paused).",
        "Let go: 3 s of killer silence. The slightest sound from the Straight Face = BUZZ and a penalty.",
      ],
      table: [
        "Phone in the middle of the table, everyone goes quiet.",
        "It shows absurd scenes and makes silly noises for 30 seconds.",
        "First sound = BUZZ. The table points at the culprit, who takes the penalty.",
      ],
    },
    rules: {
      volume: [
        "The phone goes from hand to hand: only the player holding it plays, everyone else stays quiet.",
        "The app shows a line (more and more absurd) and a target zone on the gauge: whisper, normal voice, loud voice or shout. At higher levels the zone gets narrower.",
        "Hold \"Talk\", say the whole line while keeping the needle in the zone, then let go.",
        "Score = % of talking time spent in the zone (out of 100), +20 if the whole line was said (minimum duration). The table can challenge the bonus.",
        "After all the turns, last place takes the penalty.",
      ],
      whisper: [
        "Two teams. Each round, one player holds the phone and gets their team to guess as many words as possible in 60 seconds, without saying the word.",
        "Everything is whispered: the clue-giver AND the guessers.",
        "The mic hears the whole table: if the volume goes over the whisper threshold, BUZZ! The current word is lost and the team gets −1.",
        "\"Got it!\" = +1; \"Skip\" = 0. Teams take turns, and the clue-giver changes every round.",
        "At the end, the losing team takes the penalty (every member).",
      ],
      crescendo: [
        "Pass the phone around. Whoever holds it holds the button and makes a sound, close to their mouth.",
        "Crescendo: each sound must be louder than the chain's record, without reaching the BOOM ceiling.",
        "Decrescendo: each sound must be softer than the last one, but still audible.",
        "Miss it and you break the chain and take the penalty; a new chain starts from zero.",
        "The game ends after the chosen number of misses. Fewest misses wins.",
      ],
      souffle: [
        "Take turns with the phone close to your mouth, everyone else silent.",
        "Hold an \"Aaaah\" for as long as you can while staying in the volume zone shown.",
        "The clock starts when you enter the zone and stops if you leave it for more than half a second.",
        "One turn per zone (normal voice, then whisper, then loud voice). Total time sets the ranking; last place takes the penalty.",
      ],
      duel: [
        "Two players face to face, the phone lying between them.",
        "The Straight Face must keep it together: no laugh, no snort.",
        "The Clown has 30 seconds to make them crack, using the ammo the app suggests.",
        "The Clown ONLY talks while holding \"My turn!\": meanwhile, the mic is paused.",
        "Let go: 3 seconds of killer silence. The slightest sound = BUZZ, the Straight Face cracked.",
      ],
      table: [
        "The phone sits in the middle: everyone shuts up.",
        "It shows absurd scenes and makes silly noises (the mic covers its ears during its own sounds).",
        "First sound = BUZZ. The mic can't tell who: the table points at the culprit.",
      ],
    },
    allModes: "The modes",
    changeMode: "Change mode",
    recalib: "Recalibrate the mic",
    calibrated: "Mic calibrated",
    secTours: "Rounds",
    tours: (n) => (n > 1 ? `${n} rounds` : "1 round"),
    phrasesCount: (n) => (n > 1 ? `${n} turns coming up` : "1 turn coming up"),
    secTeams: "Teams",
    teamNames: ["The Mice", "The Owls"],
    shuffleTeams: "Shuffle teams",
    secRounds: "Rounds",
    roundsPerTeam: (n) => (n > 1 ? `${n} rounds per team` : "1 round per team"),
    secDirection: "Direction",
    dirUp: "Crescendo",
    dirUpSub: "Louder and louder",
    dirDown: "Decrescendo",
    dirDownSub: "Softer and softer",
    secFalls: "Length",
    falls: (n) => `${n} misses`,
    fallsSub: "The game ends on the last miss",
    humanSub: {
      volume: "No mic: the table judges each line",
      whisper: "No mic: a player from the other team watches the screen and taps BUZZ",
      crescendo: "No mic: the table judges each sound",
      souffle: "No mic: the table stops the clock",
      duel: "No mic: a player taps \"They laughed!\"",
      table: "No mic: a player taps at the first laugh",
    },
    labelled: (l, v) => `${l}: ${v}`,
    quote: (q) => `“${q}”`,
    secMic: "The mic",
    micOn: "With the mic",
    micOnSub: "It measures volume, nothing is recorded",
    wSens: { library: "Very low threshold: mouse-level whispers", living: "Normal threshold: living-room whispers", club: "High threshold: for noisy rooms" },
    secPenaltyTeam: "The losing team takes…",
    secPenaltyLast: "Last place takes…",
    holdNear: "Hold the phone close to your mouth, about a hand's width away.",
    nextPlayer: "Next player",
    seeRanking: "See the ranking",
    finishEarly: "Finish",
    lastPenalty: "Last place",
    tieBottom: "Tie at the bottom: no penalty this time. Rematch?",
    unitPts: "pts",
    ready: "I'm ready",
    zone: { whisper: "Whisper", normal: "Normal voice", loud: "Loud voice", shout: "Shout" },
    zoneHint: { whisper: "Like in a library", normal: "Like at dinner", loud: "Like calling someone over", shout: "Like at a stadium" },
    narrow: "narrow zone",
    endTitle: "The ranking",
    vChip: (i, total) => `Turn ${i}/${total}`,
    vLevel: (n) => (n === 1 ? "Level 1" : n === 2 ? "Level 2 · wacky" : "Level 3 · absurd"),
    vYourZone: "Your zone",
    vReadyHint: "Hold \"Talk\", say the line while keeping the needle in the zone, let go when you're done.",
    vShow: "Show my line",
    vTalk: "Talk",
    vTalkSub: "Hold for the whole line",
    vTalking: "Let go when you're done",
    vTryHint: "Test your voice before pressing: it doesn't count yet.",
    vInZone: (p) => `In the zone: ${p}%`,
    vTooShort: "Hold \"Talk\" for the whole line!",
    vNothing: "We didn't hear a thing…",
    vVerdict: ["Missed!", "Meh…", "Not bad!", "Spot on!"],
    vPctLabel: "of the time in the zone",
    vBonus: "Whole line: +20",
    vNoBonus: "Too quick: no bonus",
    vTooLoud: "You were mostly too loud.",
    vTooSoft: "You were mostly too quiet.",
    vContest: "The table objects: line not finished",
    vContested: "Bonus removed by the table",
    vRetry: "False start? Try again",
    vJudgeTitle: "The table judges the volume:",
    vJudge: ["Missed", "Meh", "Close", "Spot on!"],
    vWhole: "Whole line said (+20)",
    vPassHint: (z) => `Your zone: ${z}. Hold the phone close to your mouth, everyone else stays quiet.`,
    vNote: (n, avg) => `${n > 1 ? `${n} lines` : "1 line"} · ${avg}% in the zone`,
    meterLabel: "Your voice volume",
    wRound: (i, total) => `Round ${i}/${total}`,
    wPassHint: (team) => `Get ${team} to guess, in a WHISPER. Keep the screen to yourself.`,
    wReadyTitle: "60 seconds",
    wReadyHint: "Whisper clues without saying the word. Your team guesses… in a whisper too! The mic hears the whole table: any loud burst means BUZZ and the word is lost (−1).",
    wGo: "Go, whisper",
    wFound: "Got it!",
    wSkip: "Skip",
    wBuzz: "BUZZ!",
    wBuzzSub: "Too loud: word lost, −1",
    wMeter: "Table volume",
    wOk: "Whisper OK",
    wLoud: "Too loud!",
    wTimeUp: "Time's up!",
    wRoundScore: (team, p) => `${team}: ${p > 0 ? "+" : ""}${p} this round`,
    wFoundN: (n) => `${n} guessed`,
    wBuzzN: (n) => (n === 1 ? "1 buzz" : `${n} buzzes`),
    wSkipN: (n) => `${n} skipped`,
    wNext: "Next round",
    wHumanBuzz: "BUZZ! Too loud",
    wHumanBuzzWho: "For the OTHER team:",
    wHumanHint: "No mic: a player from the OTHER team sits next to the whisperer, watches the screen and taps BUZZ at any loud burst. Your own team doesn't look at the screen!",
    wWinner: (team) => `${team} win!`,
    wTie: "Perfect tie!",
    wTieNote: "No penalty this time. Rematch?",
    wPenaltyTeam: (team) => `For every member of ${team}`,
    wPts: (n) => (Math.abs(n) === 1 ? `${n} pt` : `${n} pts`),
    wGuessers: (names) => `Guessing: ${names}`,
    cChain: (n) => `Chain ${n}`,
    cFalls: (n, max) => `Miss ${n}/${max}`,
    cRecord: "Record to beat",
    cFirstUp: "First sound of the chain: you set the bar (not too high!).",
    cFirstDown: "First sound of the chain: under the BOOM ceiling, but not too low.",
    cPassHint: (up) => (up ? "Make a sound LOUDER than the last one… without blowing up!" : "Make a sound SOFTER than the last one… but we must hear it!"),
    cHold: "Hold and make your sound",
    cHoldSub: "Let go when you're done",
    cHolding: "Listening…",
    cBoom: "BOOM",
    cOk: (up) => (up ? "Louder!" : "Softer!"),
    cNewRecord: "New chain record",
    cFail: { weak: "Not louder!", boom: "KABOOM!", loud: "Not softer!", silent: "We didn't hear a thing!" },
    cFailSub: "The chain breaks.",
    cNewChain: "New chain",
    cShort: "Hold a bit longer!",
    cJudge: (up) => (up ? "The table judges: louder, without screaming?" : "The table judges: softer, and still audible?"),
    cYes: "Made it",
    cNo: "Missed",
    cNote: (f, ok) => `${f === 1 ? "1 miss" : `${f} misses`} · ${ok === 1 ? "1 success" : `${ok} successes`}`,
    cHumanHint: (up) => (up ? "Make a sound louder than the last one, the table judges." : "Make a sound softer than the last one, the table judges."),
    sTour: (i, total) => `Round ${i}/${total}`,
    sPassHint: (z) => `Take a deep breath. Hold an "Aaaah" as long as you can, zone: ${z}.`,
    sReadyHint: "The clock starts when your \"Aaaah\" enters the zone and stops if you leave it.",
    sGo: "Aaaaaah!",
    sWaiting: "Go, start your \"Aaaah\"",
    sHolding: "Hold on!",
    sOut: "Out of the zone!",
    sRecord: (n, s) => `Record: ${n}, ${s} s`,
    sNoRecord: "No record yet",
    sNewRecord: "New record!",
    sNoStart: "Didn't start in time",
    sHumanStart: "Go!",
    sHumanStop: "Stopped!",
    sHumanHint: "No mic: the table stops the clock as soon as the sound stops or changes volume.",
    sNote: (b) => `Best: ${b} s`,
  },
  es: {
    modesTitle: "Elige tu modo",
    modesSub: "El micro oye un ruido, no quién lo hace: cada modo deja claro a quién escucha.",
    star: "Modo estrella",
    min4: "Mínimo 4 jugadores",
    modeName: { volume: "El volumen justo", whisper: "¡Susúrralo!", crescendo: "Crescendo", souffle: "Sin aliento", duel: "¡No te rías!", table: "Silencio total" },
    modeSub: {
      volume: "Di la frase con la aguja dentro de la zona",
      whisper: "Haz que adivinen palabras… susurrando",
      crescendo: "Cada uno más fuerte que el anterior, sin explotar",
      souffle: "Aguanta un «Aaaah» todo lo que puedas",
      duel: "Un Payaso contra un Serio, 30 segundos",
      table: "Todos callados, el teléfono ataca",
    },
    modeWho: { volume: "Móvil en mano", whisper: "2 equipos", crescendo: "Móvil en mano", souffle: "Móvil en mano", duel: "Cara a cara", table: "Toda la mesa" },
    howTo: "Cómo se juega",
    steps: {
      volume: [
        "El móvil pasa de mano en mano. La app te da una frase y una zona: susurro, voz normal, voz alta o grito.",
        "Ponte el móvil cerca de la boca, mantén «Hablar» y di la frase con la aguja dentro de la zona.",
        "Tu puntuación = % del tiempo dentro de la zona, +20 si dices la frase entera. El último se lleva el castigo.",
      ],
      whisper: [
        "Dos equipos. Quien tiene el móvil hace adivinar el máximo de palabras a su equipo en 60 segundos.",
        "Prohibido hablar alto: se SUSURRA. El micro oye a toda la mesa, también a los que adivinan.",
        "Acierto = +1. Una voz alta = BUZZ, palabra perdida y −1. El equipo perdedor se lleva el castigo.",
      ],
      crescendo: [
        "Os pasáis el móvil. Cada uno mantiene el botón y hace un sonido, cerca de la boca.",
        "Tiene que ser MÁS FUERTE que el anterior (o más suave en Decrescendo)… sin pasar del techo BUM.",
        "Quien falla rompe la cadena y se lleva el castigo. Nueva cadena, desde cero.",
      ],
      souffle: [
        "Por turnos, con el móvil cerca de la boca.",
        "Coge aire y aguanta un «Aaaah» todo lo que puedas sin salirte de la zona de volumen.",
        "El crono se para en cuanto sales de la zona. Bate el récord; el último se lleva el castigo.",
      ],
      duel: [
        "Dos jugadores cara a cara, con el móvil entre ellos.",
        "El Payaso tiene 30 s para hacer reír al Serio. Solo habla manteniendo «¡Me toca!» (micro en pausa).",
        "Al soltar: 3 s de silencio mortal. El menor ruido del Serio = BUZZ y castigo.",
      ],
      table: [
        "El móvil en el centro de la mesa, todos callados.",
        "Muestra escenas absurdas y hace ruidos ridículos durante 30 segundos.",
        "El primer ruido = BUZZ. La mesa señala al culpable, que se lleva el castigo.",
      ],
    },
    rules: {
      volume: [
        "El móvil pasa de mano en mano: solo juega quien lo tiene, los demás se callan.",
        "La app muestra una frase (cada vez más absurda) y una zona objetivo en el medidor: susurro, voz normal, voz alta o grito. En los niveles avanzados la zona se estrecha.",
        "Mantén «Hablar», di la frase entera con la aguja dentro de la zona y suelta.",
        "Puntuación = % del tiempo de habla dentro de la zona (sobre 100), +20 si has dicho la frase entera (duración mínima). La mesa puede protestar el bonus.",
        "Tras todas las rondas, el último de la clasificación se lleva el castigo.",
      ],
      whisper: [
        "Dos equipos. En cada ronda, un jugador tiene el móvil y hace adivinar el máximo de palabras a su equipo en 60 segundos, sin decir la palabra.",
        "Todo se hace susurrando: quien da las pistas Y quienes adivinan.",
        "El micro oye a toda la mesa: si el volumen supera el umbral del susurro, ¡BUZZ! La palabra se pierde y el equipo pierde 1 punto.",
        "«¡Acertado!» = +1; «Pasar» = 0. Los equipos se turnan y quien da las pistas cambia en cada ronda.",
        "Al final, el equipo perdedor se lleva el castigo (cada miembro).",
      ],
      crescendo: [
        "Os pasáis el móvil. Quien lo tiene mantiene el botón y hace un sonido, cerca de la boca.",
        "Crescendo: cada sonido tiene que superar el récord de la cadena, sin llegar al techo BUM.",
        "Decrescendo: cada sonido tiene que ser más suave que el anterior, pero audible.",
        "Quien falla rompe la cadena y se lleva el castigo; una nueva cadena empieza de cero.",
        "La partida termina al llegar al número de fallos elegido. Gana quien menos falla.",
      ],
      souffle: [
        "Por turnos, con el móvil cerca de la boca y los demás en silencio.",
        "Aguanta un «Aaaah» todo lo que puedas sin salirte de la zona de volumen.",
        "El crono arranca cuando entras en la zona y se para si sales más de medio segundo.",
        "Una ronda por zona (voz normal, luego susurro, luego voz alta). El tiempo total hace la clasificación; el último se lleva el castigo.",
      ],
      duel: [
        "Duelo: dos jugadores cara a cara, con el móvil entre ellos.",
        "El Serio debe mantener la calma: ni una risa, ni un resoplido.",
        "El Payaso tiene 30 segundos para hacerle reír, con la munición que propone la app.",
        "El Payaso SOLO habla mientras mantiene «¡Me toca!»: mientras tanto, el micro está en pausa.",
        "Al soltar: 3 segundos de silencio mortal. El menor ruido = ¡BUZZ!, el Serio se ha reído.",
      ],
      table: [
        "El móvil en el centro: todos callados.",
        "Muestra escenas absurdas y hace ruidos ridículos (el micro se tapa los oídos durante sus propios sonidos).",
        "El primer ruido = BUZZ. El micro no sabe quién: la mesa señala al culpable.",
      ],
    },
    allModes: "Los modos",
    changeMode: "Cambiar de modo",
    recalib: "Recalibrar el micro",
    calibrated: "Micro calibrado",
    secTours: "Las rondas",
    tours: (n) => (n > 1 ? `${n} rondas` : "1 ronda"),
    phrasesCount: (n) => (n > 1 ? `${n} turnos en total` : "1 turno en total"),
    secTeams: "Los equipos",
    teamNames: ["Los Ratones", "Los Búhos"],
    shuffleTeams: "Mezclar equipos",
    secRounds: "Las rondas",
    roundsPerTeam: (n) => (n > 1 ? `${n} rondas por equipo` : "1 ronda por equipo"),
    secDirection: "El sentido",
    dirUp: "Crescendo",
    dirUpSub: "Cada vez más fuerte",
    dirDown: "Decrescendo",
    dirDownSub: "Cada vez más suave",
    secFalls: "La duración",
    falls: (n) => `${n} fallos`,
    fallsSub: "La partida termina con el último fallo",
    humanSub: {
      volume: "Sin micro: la mesa juzga cada frase",
      whisper: "Sin micro: alguien del otro equipo mira la pantalla y pulsa BUZZ",
      crescendo: "Sin micro: la mesa juzga cada sonido",
      souffle: "Sin micro: la mesa para el crono",
      duel: "Sin micro: un jugador pulsa «¡Se rió!»",
      table: "Sin micro: un jugador pulsa a la primera risa",
    },
    labelled: (l, v) => `${l}: ${v}`,
    quote: (q) => `«${q}»`,
    secMic: "El micro",
    micOn: "Con el micro",
    micOnSub: "Mide el volumen, no se graba nada",
    wSens: { library: "Umbral muy bajo: susurro de ratón", living: "Umbral normal: susurro de salón", club: "Umbral alto: para sitios ruidosos" },
    secPenaltyTeam: "El equipo perdedor se lleva…",
    secPenaltyLast: "El último se lleva…",
    holdNear: "Ponte el móvil cerca de la boca, a un palmo.",
    nextPlayer: "Siguiente jugador",
    seeRanking: "Ver la clasificación",
    finishEarly: "Terminar",
    lastPenalty: "El farolillo rojo",
    tieBottom: "Empate en la cola: esta vez no hay castigo. ¿Revancha?",
    unitPts: "pts",
    ready: "Estoy listo",
    zone: { whisper: "Susurro", normal: "Voz normal", loud: "Voz alta", shout: "Grito" },
    zoneHint: { whisper: "Como en la biblioteca", normal: "Como en la cena", loud: "Como para llamar a alguien", shout: "Como en el estadio" },
    narrow: "zona estrecha",
    endTitle: "La clasificación",
    vChip: (i, total) => `Turno ${i}/${total}`,
    vLevel: (n) => (n === 1 ? "Nivel 1" : n === 2 ? "Nivel 2 · disparatado" : "Nivel 3 · absurdo"),
    vYourZone: "Tu zona",
    vReadyHint: "Mantén «Hablar», di la frase con la aguja dentro de la zona y suelta cuando acabes.",
    vShow: "Ver mi frase",
    vTalk: "Hablar",
    vTalkSub: "Mantén durante toda la frase",
    vTalking: "Suelta cuando acabes",
    vTryHint: "Prueba tu voz antes de pulsar: todavía no cuenta.",
    vInZone: (p) => `En la zona: ${p} %`,
    vTooShort: "¡Mantén «Hablar» durante toda la frase!",
    vNothing: "No hemos oído nada…",
    vVerdict: ["¡Fallo!", "Regular…", "¡Nada mal!", "¡Clavado!"],
    vPctLabel: "del tiempo en la zona",
    vBonus: "Frase entera: +20",
    vNoBonus: "Demasiado rápido: sin bonus",
    vTooLoud: "Sobre todo, demasiado fuerte.",
    vTooSoft: "Sobre todo, demasiado bajo.",
    vContest: "La mesa protesta: frase sin terminar",
    vContested: "Bonus retirado por la mesa",
    vRetry: "¿Salida en falso? Repetir",
    vJudgeTitle: "La mesa juzga el volumen:",
    vJudge: ["Fallo", "Regular", "Casi", "¡Clavado!"],
    vWhole: "Frase dicha entera (+20)",
    vPassHint: (z) => `Tu zona: ${z}. Ponte el móvil cerca de la boca, los demás callados.`,
    vNote: (n, avg) => `${n > 1 ? `${n} frases` : "1 frase"} · ${avg} % en la zona`,
    meterLabel: "Volumen de tu voz",
    wRound: (i, total) => `Ronda ${i}/${total}`,
    wPassHint: (team) => `Haz adivinar a ${team} SUSURRANDO. La pantalla, solo para ti.`,
    wReadyTitle: "60 segundos",
    wReadyHint: "Susurra pistas sin decir la palabra. Tu equipo adivina… ¡susurrando también! El micro oye a toda la mesa: a la mínima voz alta, BUZZ y la palabra se pierde (−1).",
    wGo: "¡Vamos, susurrando!",
    wFound: "¡Acertado!",
    wSkip: "Pasar",
    wBuzz: "¡BUZZ!",
    wBuzzSub: "Demasiado alto: palabra perdida, −1",
    wMeter: "Volumen de la mesa",
    wOk: "Susurro OK",
    wLoud: "¡Demasiado alto!",
    wTimeUp: "¡Se acabó el tiempo!",
    wRoundScore: (team, p) => `${team}: ${p > 0 ? "+" : ""}${p} en esta ronda`,
    wFoundN: (n) => (n === 1 ? "1 acertada" : `${n} acertadas`),
    wBuzzN: (n) => `${n} buzz`,
    wSkipN: (n) => (n === 1 ? "1 pasada" : `${n} pasadas`),
    wNext: "Siguiente ronda",
    wHumanBuzz: "¡BUZZ! Demasiado alto",
    wHumanBuzzWho: "Para el OTRO equipo:",
    wHumanHint: "Sin micro: alguien del OTRO equipo se sienta al lado del que susurra, mira la pantalla y pulsa BUZZ a la mínima voz alta. ¡Tu equipo no mira la pantalla!",
    wWinner: (team) => `¡Ganan ${team}!`,
    wTie: "¡Empate perfecto!",
    wTieNote: "Esta vez no hay castigo. ¿Revancha?",
    wPenaltyTeam: (team) => `Para cada miembro de ${team}`,
    wPts: (n) => (Math.abs(n) === 1 ? `${n} pt` : `${n} pts`),
    wGuessers: (names) => `Adivinan: ${names}`,
    cChain: (n) => `Cadena ${n}`,
    cFalls: (n, max) => `Fallo ${n}/${max}`,
    cRecord: "Récord a batir",
    cFirstUp: "Primer sonido de la cadena: tú pones el listón (¡no muy alto!).",
    cFirstDown: "Primer sonido de la cadena: por debajo del techo BUM, pero no muy bajo.",
    cPassHint: (up) => (up ? "Haz un sonido MÁS FUERTE que el anterior… ¡sin explotar!" : "Haz un sonido MÁS SUAVE que el anterior… ¡pero que se oiga!"),
    cHold: "Mantén y haz tu sonido",
    cHoldSub: "Suelta cuando termines",
    cHolding: "Te escucho…",
    cBoom: "BUM",
    cOk: (up) => (up ? "¡Más fuerte!" : "¡Más suave!"),
    cNewRecord: "Nuevo récord de la cadena",
    cFail: { weak: "¡No es más fuerte!", boom: "¡EXPLOSIÓN!", loud: "¡No es más suave!", silent: "¡No hemos oído nada!" },
    cFailSub: "La cadena se rompe.",
    cNewChain: "Nueva cadena",
    cShort: "¡Mantén un poco más!",
    cJudge: (up) => (up ? "La mesa juzga: ¿más fuerte, sin gritar?" : "La mesa juzga: ¿más suave y audible?"),
    cYes: "Conseguido",
    cNo: "Fallo",
    cNote: (f, ok) => `${f === 1 ? "1 fallo" : `${f} fallos`} · ${ok === 1 ? "1 acierto" : `${ok} aciertos`}`,
    cHumanHint: (up) => (up ? "Haz un sonido más fuerte que el anterior, la mesa juzga." : "Haz un sonido más suave que el anterior, la mesa juzga."),
    sTour: (i, total) => `Ronda ${i}/${total}`,
    sPassHint: (z) => `Coge aire. Aguanta un «Aaaah» todo lo que puedas, zona: ${z}.`,
    sReadyHint: "El crono arranca cuando tu «Aaaah» entra en la zona y se para si te sales.",
    sGo: "¡Aaaaaah!",
    sWaiting: "Vamos, empieza tu «Aaaah»",
    sHolding: "¡Aguanta!",
    sOut: "¡Fuera de la zona!",
    sRecord: (n, s) => `Récord: ${n}, ${s} s`,
    sNoRecord: "Todavía no hay récord",
    sNewRecord: "¡Nuevo récord!",
    sNoStart: "No empezó a tiempo",
    sHumanStart: "¡Ya!",
    sHumanStop: "¡Paró!",
    sHumanHint: "Sin micro: la mesa para el crono en cuanto el sonido se corta o cambia de volumen.",
    sNote: (b) => `Mejor: ${b} s`,
  },
};
