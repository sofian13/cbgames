import type { I18n, Lang } from "@/lib/i18n";
import { PROMPTS, type Prompt } from "./pp-content";
import { PROMPTS_EN } from "./pp-content.en";
import { PROMPTS_ES } from "./pp-content.es";

/** Thèmes de la langue de la partie (le serveur en ligne garde le FR). */
export function promptsFor(lang: Lang): Prompt[] {
  return lang === "en" ? PROMPTS_EN : lang === "es" ? PROMPTS_ES : PROMPTS;
}

/** Textes de Pensez Pareil (mode local, à voix haute ; quelques textes servent aussi au mode en ligne). Le mode en ligne (site) reste en français. */
export const STR: I18n<{
  name: string;
  tagline: string;
  player: (n: number) => string;
  packs: Record<"soft" | "mix" | "hot", { label: string; sub: string }>;
  intro: string;
  yourLevel: (lvl: string) => string;
  youTwo: string;
  yourName: string;
  theirName: string;
  partnerAria: string;
  vibe: string;
  go: string;
  bothNames: string;
  tierSpicy: string;
  tierCouple: string;
  tierSoft: string;
  wordsHint: (timed: boolean) => string;
  placeholder: string;
  lock: string;
  round: (r: number, t: number) => string;
  streak: (n: number) => string;
  syncs: (n: number) => string;
  sync: string;
  almost: string;
  ptsLine: (pts: number, streak: number) => string;
  noMatch: string;
  nextRound: string;
  seeBond: string;
  totalSyncs: (s: number, t: number) => string;
  great: string;
  good: string;
  practice: string;
  score: string;
  syncsLabel: string;
  bestStreak: string;
  levelUp: string;
  ourBond: string;
  xpLeft: (n: number) => string;
  playAgain: string;
  backHome: string;
  reroll: string;
  /** Écran du thème (local) : on réfléchit chacun dans sa tête */
  thinkHint: string;
  countdownGo: string;
  countdownHint: string;
  sayIt: string;
  judgeTitle: string;
  judgeHint: string;
  sameWord: string;
  notSame: string;
  /** Niveaux de complicité (même ordre que PP_LEVELS) */
  levels: string[];
  /** Badges (mêmes clés que PP_BADGES) */
  badges: Record<string, string>;
}> = {
  fr: {
    name: "Pensez Pareil",
    tagline: "Un thème, un mot dans la tête, et à « 3, 2, 1 » vous le dites en même temps. Même mot = sync ! Plus vous êtes synchro, plus votre complicité monte.",
    player: (n) => `Joueur ${n}`,
    packs: {
      soft: { label: "Soft", sub: "Tout public, on s'échauffe" },
      mix: { label: "Couple", sub: "Notre vie à deux" },
      hot: { label: "Hot 18+", sub: "Ça monte en température" },
    },
    intro: "Un thème, chacun pense à un mot… et à « 3, 2, 1 » vous le dites en même temps. Même mot = sync !",
    yourLevel: (lvl) => `Votre complicité : ${lvl}`,
    youTwo: "Vous deux",
    yourName: "Ton prénom",
    theirName: "Son prénom",
    partnerAria: "Prénom de ton/ta partenaire",
    vibe: "L'ambiance",
    go: "C'est parti !",
    bothNames: "Vos deux prénoms !",
    tierSpicy: "Coquin",
    tierCouple: "Nous deux",
    tierSoft: "Soft",
    wordsHint: (timed) => `1 ou 2 mots${timed ? " · 35 s" : ""}, sans vous concerter !`,
    placeholder: "Ta réponse secrète…",
    lock: "Verrouiller ma réponse",
    round: (r, t) => `Manche ${r}/${t}`,
    streak: (n) => `Série ×${n}`,
    syncs: (n) => `${n} sync${n > 1 ? "s" : ""}`,
    sync: "Sync !",
    almost: "Presque…",
    ptsLine: (pts, streak) => `+${pts} pts${streak >= 2 ? ` · série ×${streak}` : ""}`,
    noMatch: "Pas le même mot. La série repart à zéro.",
    nextRound: "Manche suivante",
    seeBond: "Voir notre complicité",
    totalSyncs: (s, t) => `${s}/${t} syncs`,
    great: "Vous êtes connectés !",
    good: "Belle complicité !",
    practice: "On s'entraîne encore un peu ?",
    score: "Score",
    syncsLabel: "Syncs",
    bestStreak: "Série max",
    levelUp: "Nouveau niveau débloqué !",
    ourBond: "Votre complicité",
    xpLeft: (n) => `encore ${n} XP`,
    playAgain: "Rejouer",
    backHome: "Retour à l'accueil",
    reroll: "Pas fou ? Un autre thème",
    thinkHint: "Chacun pense à son mot dans sa tête, sans rien dire. À « 1 », dites-le à voix haute en même temps !",
    countdownGo: "3, 2, 1… on y va !",
    countdownHint: "Préparez votre mot…",
    sayIt: "Dites-le !",
    judgeTitle: "Alors ?",
    judgeHint: "Exactement le même mot ? Les synonymes ne comptent pas : c'est vous qui jugez.",
    sameWord: "Même mot !",
    notSame: "Pas pareil",
    levels: ["Premiers signaux", "Sur la même longueur", "Complices", "Connectés", "Télépathes", "Âmes sœurs"],
    badges: { "first-sync": "Premier sync", "streak-3": "Combo ×3", "streak-5": "Combo ×5", perfect: "Partie parfaite", veteran: "10 parties" },
  },
  en: {
    name: "Think Alike",
    tagline: "A theme, a word in your head, and on \"3, 2, 1\" you both say it. Same word = sync! The more in sync you are, the stronger your bond.",
    player: (n) => `Player ${n}`,
    packs: {
      soft: { label: "Soft", sub: "For everyone, warming up" },
      mix: { label: "Couple", sub: "Our life together" },
      hot: { label: "Hot 18+", sub: "Turning up the heat" },
    },
    intro: "One theme, each of you thinks of a word… and on \"3, 2, 1\" you say it together. Same word = sync!",
    yourLevel: (lvl) => `Your bond: ${lvl}`,
    youTwo: "You two",
    yourName: "Your name",
    theirName: "Their name",
    partnerAria: "Your partner's name",
    vibe: "The vibe",
    go: "Let's go!",
    bothNames: "Both your names!",
    tierSpicy: "Spicy",
    tierCouple: "Us two",
    tierSoft: "Soft",
    wordsHint: (timed) => `1 or 2 words${timed ? " · 35 s" : ""}, no conferring!`,
    placeholder: "Your secret answer…",
    lock: "Lock in my answer",
    round: (r, t) => `Round ${r}/${t}`,
    streak: (n) => `Streak ×${n}`,
    syncs: (n) => `${n} sync${n === 1 ? "" : "s"}`,
    sync: "Sync!",
    almost: "Almost…",
    ptsLine: (pts, streak) => `+${pts} pts${streak >= 2 ? ` · streak ×${streak}` : ""}`,
    noMatch: "Not the same word. The streak resets.",
    nextRound: "Next round",
    seeBond: "See our bond",
    totalSyncs: (s, t) => `${s}/${t} syncs`,
    great: "You two are connected!",
    good: "Great chemistry!",
    practice: "A bit more practice?",
    score: "Score",
    syncsLabel: "Syncs",
    bestStreak: "Best streak",
    levelUp: "New level unlocked!",
    ourBond: "Your bond",
    xpLeft: (n) => `${n} XP to go`,
    playAgain: "Play again",
    backHome: "Back to home",
    reroll: "Meh? Another theme",
    thinkHint: "Each of you thinks of a word, silently. On \"1\", say it out loud at the same time!",
    countdownGo: "3, 2, 1… go!",
    countdownHint: "Get your word ready…",
    sayIt: "Say it!",
    judgeTitle: "So?",
    judgeHint: "Exactly the same word? Synonyms don't count: you two are the judges.",
    sameWord: "Same word!",
    notSame: "Not the same",
    levels: ["First signals", "On the same wavelength", "Partners in crime", "Connected", "Telepaths", "Soulmates"],
    badges: { "first-sync": "First sync", "streak-3": "Combo ×3", "streak-5": "Combo ×5", perfect: "Perfect game", veteran: "10 games" },
  },
  es: {
    name: "Pensad Igual",
    tagline: "Un tema, una palabra en la cabeza y, al «3, 2, 1», la decís a la vez. ¡Misma palabra = sync! Cuanto más sincronizados, más complicidad.",
    player: (n) => `Jugador ${n}`,
    packs: {
      soft: { label: "Soft", sub: "Para todos, para calentar" },
      mix: { label: "Pareja", sub: "Nuestra vida juntos" },
      hot: { label: "Hot 18+", sub: "Sube la temperatura" },
    },
    intro: "Un tema, cada uno piensa una palabra… y al «3, 2, 1» la decís a la vez. ¡Misma palabra = sync!",
    yourLevel: (lvl) => `Vuestra complicidad: ${lvl}`,
    youTwo: "Vosotros dos",
    yourName: "Tu nombre",
    theirName: "Su nombre",
    partnerAria: "Nombre de tu pareja",
    vibe: "El ambiente",
    go: "¡Vamos!",
    bothNames: "¡Vuestros dos nombres!",
    tierSpicy: "Picante",
    tierCouple: "En pareja",
    tierSoft: "Soft",
    wordsHint: (timed) => `1 o 2 palabras${timed ? " · 35 s" : ""}, ¡sin poneros de acuerdo!`,
    placeholder: "Tu respuesta secreta…",
    lock: "Bloquear mi respuesta",
    round: (r, t) => `Ronda ${r}/${t}`,
    streak: (n) => `Racha ×${n}`,
    syncs: (n) => `${n} sync${n === 1 ? "" : "s"}`,
    sync: "¡Sync!",
    almost: "Casi…",
    ptsLine: (pts, streak) => `+${pts} pts${streak >= 2 ? ` · racha ×${streak}` : ""}`,
    noMatch: "No es la misma palabra. La racha vuelve a cero.",
    nextRound: "Siguiente ronda",
    seeBond: "Ver nuestra complicidad",
    totalSyncs: (s, t) => `${s}/${t} syncs`,
    great: "¡Estáis conectados!",
    good: "¡Buena complicidad!",
    practice: "¿Un poco más de práctica?",
    score: "Puntos",
    syncsLabel: "Syncs",
    bestStreak: "Mejor racha",
    levelUp: "¡Nuevo nivel desbloqueado!",
    ourBond: "Vuestra complicidad",
    xpLeft: (n) => `faltan ${n} XP`,
    playAgain: "Volver a jugar",
    backHome: "Volver al inicio",
    reroll: "¿No mola? Otro tema",
    thinkHint: "Cada uno piensa su palabra, en silencio. Al «1», ¡decidla en voz alta a la vez!",
    countdownGo: "3, 2, 1… ¡vamos!",
    countdownHint: "Preparad vuestra palabra…",
    sayIt: "¡Decidla!",
    judgeTitle: "¿Y bien?",
    judgeHint: "¿Exactamente la misma palabra? Los sinónimos no cuentan: juzgáis vosotros.",
    sameWord: "¡Misma palabra!",
    notSame: "No es igual",
    levels: ["Primeras señales", "En la misma onda", "Cómplices", "Conectados", "Telépatas", "Almas gemelas"],
    badges: { "first-sync": "Primer sync", "streak-3": "Combo ×3", "streak-5": "Combo ×5", perfect: "Partida perfecta", veteran: "10 partidas" },
  },
};
