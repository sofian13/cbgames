import type { I18n } from "@/lib/i18n";
import type { PackId } from "./questions";

// Test de pureté — textes d'interface FR / EN / ES.

interface PureteStr {
  name: string;
  /** Titre en 2 lignes de l'écran d'accueil */
  title: [string, string];
  rules: string[];
  pct: (n: number) => string;
  quote: (s: string) => string;
  packs: Record<PackId, { label: string; tag: string }>;
  /** Barème (du plus pur au moins pur), mêmes seuils que TITLES */
  titles: string[];
  you: string;
  intro: string;
  modes: { secret: [string, string]; groupe: [string, string]; solo: [string, string] };
  questions: string;
  checkPack: string;
  howMany: string;
  onlyN: (n: number) => string;
  anonLabel: string;
  anonSub: string;
  namesLabel: string;
  namesSub: string;
  howManyYou: string;
  less: string;
  more: string;
  penaltyLabel: string;
  penaltyNeedNames: string;
  penaltySub: string;
  go: string;
  whoPlays: string;
  passHint: (n: number) => string;
  passBtn: string;
  questionOf: (i: number, total: number) => string;
  last: string;
  left: (n: number) => string;
  answerHonest: string;
  answerSecret: string;
  yes: string;
  never: string;
  prevQuestion: string;
  hiddenScore: string;
  soloDone: string;
  soloDoneSub: string;
  allDone: [string, string];
  allDoneSub: string;
  reveal: string;
  howManyYes: string;
  whoDid: string;
  oneLessYes: string;
  oneMoreYes: string;
  angelsSoFar: string;
  wholeTable: string;
  pctCracked: (pct: string) => string;
  seeResults: string;
  nextQuestion: string;
  tablePureAt: string;
  wholeTableName: string;
  yourScore: string;
  leastPure: string;
  mostPure: string;
  revealN: (i: number, total: number) => string;
  seeVerdict: string;
  seeRanking: string;
  next: string;
  tableReport: string;
  yourVerdict: string;
  ranking: string;
  revelations: string;
  demonPenalty: string;
  orSips: (n: number) => string;
  replay: string;
  playMulti: string;
  changePlayers: string;
  quit: string;
  revNone: string;
  revAll: string;
  revOneName: (name: string) => string;
  revOne: string;
  revN: (yes: number, total: number) => string;
  confessions: string;
  yesDot: string;
  andMore: (n: number) => string;
  /** Test Officiel Zinzin */
  qOfficiel: [string, string];
  qRandom: [string, string];
  officielNote: string;
  adultsOnly: string;
  officielName: string;
  officielScoreTop: string;
  /** Nom du test, sans article, sous officielScoreTop */
  officielShort: string;
  officielYourScore: string;
  penaltySubDare: string;
  dateLocale: string;
}

export const PURETE_STR: I18n<PureteStr> = {
  fr: {
    name: "Test de pureté",
    title: ["Test de", "pureté"],
    rules: [
      "Une question « As-tu déjà… ? ». Réponds Oui ou Jamais.",
      "Le Test Officiel Zinzin : 50 questions fixes, du plus sage au plus hardcore (questions pour adultes). Ou bien des questions au hasard, dans les packs de ton choix.",
      "Chaque oui fait baisser ta pureté. 100 % = ange, 0 % = démon.",
      "À plusieurs, on se passe le tél en secret… ou on répond ensemble, main levée.",
      "Grande révélation à la fin. Personne n'est obligé de tout raconter !",
    ],
    pct: (n) => `${n} %`,
    quote: (s) => `« ${s} »`,
    packs: {
      soft: { label: "Soft", tag: "Tout public" },
      soiree: { label: "Soirée", tag: "Fêtes, ex, bêtises" },
      coquin: { label: "Coquin", tag: "18+ · suggestif" },
    },
    titles: ["Ange tombé du ciel", "Enfant de chœur", "Sage comme une image", "Gentil, mais pas trop", "Ni ange ni démon", "Petit diable en formation", "Mauvaise influence", "Légende des soirées", "Casier bien rempli", "Démon certifié"],
    you: "Toi",
    intro: "Plus tu dis oui, moins tu es pur. Qui est l'ange de la table… et qui est le démon ?",
    modes: {
      secret: ["Chacun son tour", "En secret, on se passe le tél"],
      groupe: ["Tous ensemble", "À voix haute, main levée"],
      solo: ["Solo", "Rien que toi : découvre ton score"],
    },
    questions: "Les questions",
    checkPack: "Coche au moins un pack.",
    howMany: "Combien de questions ?",
    onlyN: (n) => `Seulement ${n} questions dans ces packs : on jouera avec toutes.`,
    anonLabel: "Révélations anonymes",
    anonSub: "« 3 personnes sur 5 ont déjà… » sans dire qui",
    namesLabel: "Avec les prénoms",
    namesSub: "Pour avoir le score de chacun. Sinon, on compte juste les mains.",
    howManyYou: "Vous êtes combien ?",
    less: "Moins",
    more: "Plus",
    penaltyLabel: "Peines pour le moins pur",
    penaltyNeedNames: "Il faut les prénoms pour savoir qui est le moins pur.",
    penaltySub: "Un gage, ou 1 à 3 gorgées de zinzin",
    go: "C'est parti !",
    whoPlays: "Qui joue ?",
    passHint: (n) => `${n} questions, réponds en secret. Personne ne regarde !`,
    passBtn: "C'est moi, je réponds",
    questionOf: (i, total) => `Question ${i} / ${total}`,
    last: "Dernière !",
    left: (n) => `encore ${n}`,
    answerHonest: "Réponds franchement",
    answerSecret: "Réponds en secret",
    yes: "Oui",
    never: "Jamais",
    prevQuestion: "Question précédente",
    hiddenScore: "Score caché",
    soloDone: "C'est fini !",
    soloDoneSub: "Ange ou démon ? Prépare-toi à assumer.",
    allDone: ["Tout le monde", "a répondu !"],
    allDoneSub: "Posez le téléphone au milieu de la table. L'heure de vérité a sonné.",
    reveal: "Révéler",
    howManyYes: "Combien ont dit oui ?",
    whoDid: "Qui l'a déjà fait ? Touchez les prénoms",
    oneLessYes: "Un oui de moins",
    oneMoreYes: "Un oui de plus",
    angelsSoFar: "Que des anges pour l'instant…",
    wholeTable: "Toute la table ! Aucune honte.",
    pctCracked: (p) => `${p} de la table a déjà craqué`,
    seeResults: "Voir les résultats",
    nextQuestion: "Question suivante",
    tablePureAt: "La table est pure à…",
    wholeTableName: "Toute la table",
    yourScore: "Ton score de pureté…",
    leastPure: "Et le moins pur de la table est…",
    mostPure: "Le plus pur de la table…",
    revealN: (i, total) => `Révélation ${i} / ${total}`,
    seeVerdict: "Voir mon verdict",
    seeRanking: "Voir le classement",
    next: "Suivant",
    tableReport: "Bilan de la table",
    yourVerdict: "Ton verdict",
    ranking: "Classement de pureté",
    revelations: "Révélations",
    demonPenalty: "La peine du démon",
    orSips: (n) => `Ou ${n} gorgée${n > 1 ? "s" : ""} de zinzin, au choix.`,
    replay: "Rejouer",
    playMulti: "Jouer à plusieurs",
    changePlayers: "Changer les joueurs",
    quit: "Quitter",
    revNone: "Personne n'a dit oui. Une table d'anges ?",
    revAll: "Toute la table a dit oui !",
    revOneName: (name) => `Une seule personne : ${name} !`,
    revOne: "Une seule personne a dit oui…",
    revN: (yes, total) => `${yes} personnes sur ${total} ont dit oui`,
    confessions: "Tes aveux",
    yesDot: "Oui.",
    andMore: (n) => `… et ${n} autre${n > 1 ? "s" : ""}. On ne juge pas. Un peu.`,
    qOfficiel: ["Le Test Officiel", "50 questions fixes, du plus sage au plus hardcore"],
    qRandom: ["Au hasard", "Tes packs, de 20 à 60 questions"],
    officielNote: "Les mêmes 50 questions pour tout le monde, dans le même ordre : comparez vos scores !",
    adultsOnly: "Contient des questions pour adultes.",
    officielName: "Test Officiel Zinzin",
    officielScoreTop: "Ton score au",
    officielShort: "Test Officiel Zinzin",
    officielYourScore: "Ton score au Test Officiel Zinzin…",
    penaltySubDare: "Un gage pour le moins pur",
    dateLocale: "fr-FR",
  },
  en: {
    name: "Purity Test",
    title: ["Purity", "Test"],
    rules: [
      "A “Have you ever…?” question. Answer Yes or Never.",
      "The Official Zinzin Test: 50 set questions, from innocent to hardcore (adult questions). Or random questions from the packs you pick.",
      "Every yes knocks your purity down. 100% = angel, 0% = demon.",
      "In a group, pass the phone around in secret… or answer together, hands up.",
      "Big reveal at the end. Nobody has to spill everything!",
    ],
    pct: (n) => `${n}%`,
    quote: (s) => `“${s}”`,
    packs: {
      soft: { label: "Soft", tag: "For everyone" },
      soiree: { label: "Party", tag: "Nights out, exes, bad ideas" },
      coquin: { label: "Spicy", tag: "18+ · suggestive" },
    },
    titles: ["Heaven-sent angel", "Choirboy energy", "Butter wouldn't melt", "Nice, but not too nice", "Neither angel nor demon", "Devil in training", "Bad influence", "Party legend", "Long rap sheet", "Certified demon"],
    you: "You",
    intro: "The more you say yes, the less pure you are. Who's the angel of the group… and who's the demon?",
    modes: {
      secret: ["Take turns", "In secret, pass the phone around"],
      groupe: ["All together", "Out loud, hands up"],
      solo: ["Solo", "Just you: find out your score"],
    },
    questions: "Questions",
    checkPack: "Pick at least one pack.",
    howMany: "How many questions?",
    onlyN: (n) => `Only ${n} questions in these packs: we'll play them all.`,
    anonLabel: "Anonymous reveals",
    anonSub: "“3 out of 5 people have…” without saying who",
    namesLabel: "With names",
    namesSub: "To get everyone's score. Otherwise we just count hands.",
    howManyYou: "How many of you?",
    less: "Less",
    more: "More",
    penaltyLabel: "Penalties for the least pure",
    penaltyNeedNames: "You need names to know who's the least pure.",
    penaltySub: "A dare, or 1 to 3 zinzin sips",
    go: "Let's go!",
    whoPlays: "Who's playing?",
    passHint: (n) => `${n} questions, answer in secret. No peeking!`,
    passBtn: "It's me, I'm answering",
    questionOf: (i, total) => `Question ${i} / ${total}`,
    last: "Last one!",
    left: (n) => `${n} to go`,
    answerHonest: "Be honest",
    answerSecret: "Answer in secret",
    yes: "Yes",
    never: "Never",
    prevQuestion: "Previous question",
    hiddenScore: "Score hidden",
    soloDone: "All done!",
    soloDoneSub: "Angel or demon? Time to own it.",
    allDone: ["Everyone", "has answered!"],
    allDoneSub: "Put the phone in the middle of the table. The moment of truth has arrived.",
    reveal: "Reveal",
    howManyYes: "How many said yes?",
    whoDid: "Who's done it? Tap the names",
    oneLessYes: "One less yes",
    oneMoreYes: "One more yes",
    angelsSoFar: "All angels so far…",
    wholeTable: "The whole table! No shame.",
    pctCracked: (p) => `${p} of the table has cracked`,
    seeResults: "See results",
    nextQuestion: "Next question",
    tablePureAt: "The table's purity is…",
    wholeTableName: "The whole table",
    yourScore: "Your purity score…",
    leastPure: "And the least pure of the table is…",
    mostPure: "The purest of the table…",
    revealN: (i, total) => `Reveal ${i} / ${total}`,
    seeVerdict: "See my verdict",
    seeRanking: "See the ranking",
    next: "Next",
    tableReport: "Table report",
    yourVerdict: "Your verdict",
    ranking: "Purity ranking",
    revelations: "Revelations",
    demonPenalty: "The demon's penalty",
    orSips: (n) => `Or ${n} zinzin sip${n !== 1 ? "s" : ""}, your choice.`,
    replay: "Play again",
    playMulti: "Play with friends",
    changePlayers: "Change players",
    quit: "Quit",
    revNone: "Nobody said yes. A table of angels?",
    revAll: "The whole table said yes!",
    revOneName: (name) => `Just one person: ${name}!`,
    revOne: "Only one person said yes…",
    revN: (yes, total) => `${yes} out of ${total} people said yes`,
    confessions: "Your confessions",
    yesDot: "Yes.",
    andMore: (n) => `…and ${n} more. No judgement. Well, a little.`,
    qOfficiel: ["The Official Test", "50 set questions, from innocent to hardcore"],
    qRandom: ["Random", "Your packs, 20 to 60 questions"],
    officielNote: "The same 50 questions for everyone, in the same order: compare your scores!",
    adultsOnly: "Contains questions for adults.",
    officielName: "The Official Zinzin Test",
    officielScoreTop: "Your score on the",
    officielShort: "Official Zinzin Test",
    officielYourScore: "Your score on the Official Zinzin Test…",
    penaltySubDare: "A dare for the least pure",
    dateLocale: "en-GB",
  },
  es: {
    name: "Test de Pureza",
    title: ["Test de", "pureza"],
    rules: [
      "Una pregunta «¿Alguna vez has…?». Responde Sí o Nunca.",
      "El Test Oficial Zinzin: 50 preguntas fijas, de lo más inocente a lo más fuerte (preguntas para adultos). O preguntas al azar de los packs que elijas.",
      "Cada sí te baja la pureza. 100 % = ángel, 0 % = demonio.",
      "En grupo, os pasáis el móvil en secreto… o respondéis juntos, mano arriba.",
      "Gran revelación al final. ¡Nadie está obligado a contarlo todo!",
    ],
    pct: (n) => `${n} %`,
    quote: (s) => `«${s}»`,
    packs: {
      soft: { label: "Soft", tag: "Para todos" },
      soiree: { label: "Fiesta", tag: "Fiestas, ex, locuras" },
      coquin: { label: "Picante", tag: "+18 · sugerente" },
    },
    titles: ["Ángel caído del cielo", "Monaguillo", "Más bueno que el pan", "Bueno, pero no tanto", "Ni ángel ni demonio", "Diablillo en prácticas", "Mala influencia", "Leyenda de la fiesta", "Con antecedentes", "Demonio certificado"],
    you: "Tú",
    intro: "Cuantas más veces digas sí, menos puro eres. ¿Quién es el ángel de la mesa… y quién el demonio?",
    modes: {
      secret: ["Por turnos", "En secreto, os pasáis el móvil"],
      groupe: ["Todos juntos", "En voz alta, mano arriba"],
      solo: ["Solo", "Solo tú: descubre tu puntuación"],
    },
    questions: "Las preguntas",
    checkPack: "Marca al menos un pack.",
    howMany: "¿Cuántas preguntas?",
    onlyN: (n) => `Solo hay ${n} preguntas en estos packs: jugaremos con todas.`,
    anonLabel: "Revelaciones anónimas",
    anonSub: "«3 de cada 5 personas han…» sin decir quién",
    namesLabel: "Con nombres",
    namesSub: "Para tener la puntuación de cada uno. Si no, solo contamos manos.",
    howManyYou: "¿Cuántos sois?",
    less: "Menos",
    more: "Más",
    penaltyLabel: "Castigo para el menos puro",
    penaltyNeedNames: "Hacen falta los nombres para saber quién es el menos puro.",
    penaltySub: "Un reto, o de 1 a 3 tragos de zinzin",
    go: "¡Vamos!",
    whoPlays: "¿Quién juega?",
    passHint: (n) => `${n} preguntas, responde en secreto. ¡Que nadie mire!`,
    passBtn: "Soy yo, respondo",
    questionOf: (i, total) => `Pregunta ${i} / ${total}`,
    last: "¡La última!",
    left: (n) => `quedan ${n}`,
    answerHonest: "Responde con sinceridad",
    answerSecret: "Responde en secreto",
    yes: "Sí",
    never: "Nunca",
    prevQuestion: "Pregunta anterior",
    hiddenScore: "Puntuación oculta",
    soloDone: "¡Se acabó!",
    soloDoneSub: "¿Ángel o demonio? Prepárate para asumirlo.",
    allDone: ["¡Todos han", "respondido!"],
    allDoneSub: "Dejad el móvil en el centro de la mesa. Ha llegado la hora de la verdad.",
    reveal: "Revelar",
    howManyYes: "¿Cuántos han dicho sí?",
    whoDid: "¿Quién lo ha hecho? Tocad los nombres",
    oneLessYes: "Un sí menos",
    oneMoreYes: "Un sí más",
    angelsSoFar: "Por ahora, todos angelitos…",
    wholeTable: "¡Toda la mesa! Sin vergüenza.",
    pctCracked: (p) => `El ${p} de la mesa ya ha caído`,
    seeResults: "Ver resultados",
    nextQuestion: "Siguiente pregunta",
    tablePureAt: "La pureza de la mesa es…",
    wholeTableName: "Toda la mesa",
    yourScore: "Tu puntuación de pureza…",
    leastPure: "Y el menos puro de la mesa es…",
    mostPure: "El más puro de la mesa…",
    revealN: (i, total) => `Revelación ${i} / ${total}`,
    seeVerdict: "Ver mi veredicto",
    seeRanking: "Ver la clasificación",
    next: "Siguiente",
    tableReport: "Balance de la mesa",
    yourVerdict: "Tu veredicto",
    ranking: "Clasificación de pureza",
    revelations: "Revelaciones",
    demonPenalty: "El castigo del demonio",
    orSips: (n) => `O ${n} trago${n !== 1 ? "s" : ""} de zinzin, a elegir.`,
    replay: "Volver a jugar",
    playMulti: "Jugar en grupo",
    changePlayers: "Cambiar jugadores",
    quit: "Salir",
    revNone: "Nadie ha dicho que sí. ¿Una mesa de ángeles?",
    revAll: "¡Toda la mesa ha dicho que sí!",
    revOneName: (name) => `¡Solo una persona: ${name}!`,
    revOne: "Solo una persona ha dicho que sí…",
    revN: (yes, total) => `${yes} de ${total} personas han dicho que sí`,
    confessions: "Tus confesiones",
    yesDot: "Sí.",
    andMore: (n) => `…y ${n} más. No juzgamos. Bueno, un poco.`,
    qOfficiel: ["El Test Oficial", "50 preguntas fijas, de lo más inocente a lo más fuerte"],
    qRandom: ["Al azar", "Tus packs, de 20 a 60 preguntas"],
    officielNote: "Las mismas 50 preguntas para todos, en el mismo orden: ¡comparad vuestras puntuaciones!",
    adultsOnly: "Contiene preguntas para adultos.",
    officielName: "El Test Oficial Zinzin",
    officielScoreTop: "Tu puntuación en el",
    officielShort: "Test Oficial Zinzin",
    officielYourScore: "Tu puntuación en el Test Oficial Zinzin…",
    penaltySubDare: "Un reto para el menos puro",
    dateLocale: "es-ES",
  },
};
