import type { I18n, Lang } from "@/lib/i18n";
import { PROMPTS, type Prompt } from "./pp-content";
import { PROMPTS_EN } from "./pp-content.en";
import { PROMPTS_ES } from "./pp-content.es";

/** Thèmes de la langue de la partie (le serveur en ligne garde le FR). */
export function promptsFor(lang: Lang): Prompt[] {
  return lang === "en" ? PROMPTS_EN : lang === "es" ? PROMPTS_ES : PROMPTS;
}

/** Textes de Pensez Pareil (mode local). Le mode en ligne (site) reste en français. */
export const STR: I18n<{
  name: string;
  tagline: string;
  player: (n: number) => string;
  packs: Record<"soft" | "mix" | "hot", { label: string; sub: string }>;
  passA: string;
  passB: (name: string) => string;
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
  answers: (name: string) => string;
  reroll: string;
  /** Niveaux de complicité (même ordre que PP_LEVELS) */
  levels: string[];
  /** Badges (mêmes clés que PP_BADGES) */
  badges: Record<string, string>;
}> = {
  fr: {
    name: "Pensez Pareil",
    tagline: "Un thème, 35 secondes, 1 ou 2 mots : répondez chacun en secret et tombez sur la MÊME réponse. Plus vous êtes synchro, plus votre complicité monte.",
    player: (n) => `Joueur ${n}`,
    packs: {
      soft: { label: "Soft", sub: "Tout public, on s'échauffe" },
      mix: { label: "Couple", sub: "Notre vie à deux" },
      hot: { label: "Hot 18+", sub: "Ça monte en température" },
    },
    passA: "Toi seul regardes : écris ta réponse sans la montrer.",
    passB: (name) => `À ton tour : même thème, réponds en secret. ${name} a déjà répondu !`,
    intro: "Un thème, chacun écrit 1 ou 2 mots en secret… et vous comparez. Même réponse = sync !",
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
    noMatch: "Pas la même réponse. La série repart à zéro.",
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
    answers: (name) => `${name} répond`,
    reroll: "Pas fou ? Un autre thème",
    levels: ["Premiers signaux", "Sur la même longueur", "Complices", "Connectés", "Télépathes", "Âmes sœurs"],
    badges: { "first-sync": "Premier sync", "streak-3": "Combo ×3", "streak-5": "Combo ×5", perfect: "Partie parfaite", veteran: "10 parties" },
  },
  en: {
    name: "Think Alike",
    tagline: "A theme, 35 seconds, 1 or 2 words: answer in secret and land on the SAME answer. The more in sync you are, the stronger your bond.",
    player: (n) => `Player ${n}`,
    packs: {
      soft: { label: "Soft", sub: "For everyone, warming up" },
      mix: { label: "Couple", sub: "Our life together" },
      hot: { label: "Hot 18+", sub: "Turning up the heat" },
    },
    passA: "Only you look: write your answer without showing it.",
    passB: (name) => `Your turn: same theme, answer in secret. ${name} has already answered!`,
    intro: "One theme, each of you secretly writes 1 or 2 words… then you compare. Same answer = sync!",
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
    noMatch: "Not the same answer. The streak resets.",
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
    answers: (name) => `${name} answers`,
    reroll: "Meh? Another theme",
    levels: ["First signals", "On the same wavelength", "Partners in crime", "Connected", "Telepaths", "Soulmates"],
    badges: { "first-sync": "First sync", "streak-3": "Combo ×3", "streak-5": "Combo ×5", perfect: "Perfect game", veteran: "10 games" },
  },
  es: {
    name: "Pensad Igual",
    tagline: "Un tema, 35 segundos, 1 o 2 palabras: responded en secreto y coincidid en la MISMA respuesta. Cuanto más sincronizados, más complicidad.",
    player: (n) => `Jugador ${n}`,
    packs: {
      soft: { label: "Soft", sub: "Para todos, para calentar" },
      mix: { label: "Pareja", sub: "Nuestra vida juntos" },
      hot: { label: "Hot 18+", sub: "Sube la temperatura" },
    },
    passA: "Solo miras tú: escribe tu respuesta sin enseñarla.",
    passB: (name) => `Te toca: mismo tema, responde en secreto. ¡${name} ya ha respondido!`,
    intro: "Un tema, cada uno escribe 1 o 2 palabras en secreto… y comparáis. ¡Misma respuesta = sync!",
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
    noMatch: "No es la misma respuesta. La racha vuelve a cero.",
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
    answers: (name) => `Responde ${name}`,
    reroll: "¿No mola? Otro tema",
    levels: ["Primeras señales", "En la misma onda", "Cómplices", "Conectados", "Telépatas", "Almas gemelas"],
    badges: { "first-sync": "Primer sync", "streak-3": "Combo ×3", "streak-5": "Combo ×5", perfect: "Partida perfecta", veteran: "10 partidas" },
  },
};
