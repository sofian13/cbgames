import type { MascotColor } from "@/components/Mascot";
import { GAME_NAMES } from "@/lib/games/game-names-i18n";
import { type I18n, type Lang, getLang, pick } from "@/lib/i18n";
import type { ShareAward, ShareCard, ShareRow } from "@/lib/share-card";
import { MASCOT_COLORS } from "@/components/Mascot";

/**
 * Contenu des cartes « Partager mon résultat », jeu par jeu (FR / EN / ES).
 * Les jeux passent leurs données de fin (prénoms, scores) ; ici on compose
 * la carte et le petit texte qui l'accompagne.
 */

const T: I18n<{
  iAm: string;
  purity: string;
  soloText: (pct: string, verdict: string) => string;
  angel: string;
  devil: (name: string, pct: string) => string;
  groupText: (name: string, pct: string) => string;
  table: string;
  tableText: (pct: string) => string;
  bestWaiter: string;
  spilled: (name: string, n: number) => string;
  noSpill: string;
  verreText: (name: string) => string;
  star: string;
  penalties: (n: number) => string;
  roundText: (name: string) => string;
  chutText: (name: string) => string;
  winner: string;
  rankingText: (game: string, name: string) => string;
  tie: string;
}> = {
  fr: {
    iAm: "J'ai",
    purity: "de pureté",
    soloText: (p, v) => `J'ai ${p} de pureté au Test de pureté : « ${v} ». Et toi ?`,
    angel: "L'ange de la bande",
    devil: (n, p) => `Le démon de la bande : ${n} (${p})`,
    groupText: (n, p) => `Test de pureté : ${n} est l'ange de la bande (${p}). Et vous ?`,
    table: "Notre bande est pure à",
    tableText: (p) => `Notre bande est pure à ${p} au Test de pureté. Et la vôtre ?`,
    bestWaiter: "Meilleur serveur de la soirée",
    spilled: (n, k) => `${n} a renversé le verre ${k === 1 ? "1 fois" : `${k} fois`}`,
    noSpill: "Personne n'a rien renversé !",
    verreText: (n) => `${n} gagne au Verre Invisible ! Qui fait mieux ?`,
    star: "La star de la soirée",
    penalties: (k) => `${k} peine${k > 1 ? "s" : ""}`,
    roundText: (n) => `${n} est la star de notre Tournée. On remet ça ?`,
    chutText: (n) => `${n} a gardé son sérieux à Chut ! Tu tiendrais ?`,
    winner: "Grand gagnant",
    rankingText: (g, n) => `${n} gagne à ${g} ! Revanche ?`,
    tie: "Égalité au sommet !",
  },
  en: {
    iAm: "I'm",
    purity: "pure",
    soloText: (p, v) => `I'm ${p} pure on the Purity Test: "${v}". What about you?`,
    angel: "Our crew's angel",
    devil: (n, p) => `Our crew's devil: ${n} (${p})`,
    groupText: (n, p) => `Purity Test: ${n} is our crew's angel (${p}). Your turn?`,
    table: "Our crew is",
    tableText: (p) => `Our crew is ${p} pure on the Purity Test. How about yours?`,
    bestWaiter: "Best waiter of the night",
    spilled: (n, k) => `${n} spilled the glass ${k === 1 ? "once" : `${k} times`}`,
    noSpill: "Nobody spilled a drop!",
    verreText: (n) => `${n} wins The Invisible Glass! Can you do better?`,
    star: "Star of the night",
    penalties: (k) => `${k} ${k === 1 ? "penalty" : "penalties"}`,
    roundText: (n) => `${n} is the star of our Round. Same again?`,
    chutText: (n) => `${n} kept a straight face in Shh! Could you?`,
    winner: "The winner",
    rankingText: (g, n) => `${n} wins ${g}! Rematch?`,
    tie: "It's a tie at the top!",
  },
  es: {
    iAm: "Tengo un",
    purity: "de pureza",
    soloText: (p, v) => `Tengo un ${p} de pureza en el Test de Pureza: «${v}». ¿Y tú?`,
    angel: "El ángel del grupo",
    devil: (n, p) => `El demonio del grupo: ${n} (${p})`,
    groupText: (n, p) => `Test de Pureza: ${n} es el ángel del grupo (${p}). ¿Y vosotros?`,
    table: "Nuestro grupo es puro al",
    tableText: (p) => `Nuestro grupo es puro al ${p} en el Test de Pureza. ¿Y el vuestro?`,
    bestWaiter: "El mejor camarero de la noche",
    spilled: (n, k) => `${n} derramó el vaso ${k === 1 ? "1 vez" : `${k} veces`}`,
    noSpill: "¡Nadie derramó ni una gota!",
    verreText: (n) => `¡${n} gana en El Vaso Invisible! ¿Lo superas?`,
    star: "La estrella de la noche",
    penalties: (k) => `${k} ${k === 1 ? "castigo" : "castigos"}`,
    roundText: (n) => `${n} es la estrella de nuestra Ronda. ¿Otra?`,
    chutText: (n) => `¡${n} aguantó sin reírse en ¡Chis! ¿Aguantarías tú?`,
    winner: "El ganador",
    rankingText: (g, n) => `¡${n} gana en ${g}! ¿Revancha?`,
    tie: "¡Empate en lo más alto!",
  },
};

const pct = (n: number, lang: Lang) => (lang === "en" ? `${n}%` : `${n} %`);
const colorOf = (i: number): MascotColor => MASCOT_COLORS[Math.abs(i) % MASCOT_COLORS.length];
/** « 1 pt » / « 12 pts » (comme ZRanking) */
const pts = (n: number | string) => `${n} ${typeof n === "number" && Math.abs(n) < 2 ? "pt" : "pts"}`;
const gameName = (id: string) => (GAME_NAMES[id] ? pick(GAME_NAMES[id]) : "Zinzin");

/** Rangs avec ex æquo (même score → même rang). */
function ranks<T>(rows: T[], score: (r: T) => unknown): number[] {
  const out: number[] = [];
  rows.forEach((r, i) => { out.push(i > 0 && score(rows[i - 1]) === score(r) ? out[i - 1] : i + 1); });
  return out;
}

/* ───────── Test de pureté ───────── */
export function pureteSoloCard(purity: number, verdict: string): ShareCard {
  const lang = getLang();
  const t = T[lang];
  const pure = purity >= 50;
  return {
    game: "purete",
    color: pure ? "white" : "coral",
    mood: purity >= 80 ? "love" : pure ? "wink" : purity >= 20 ? "fire" : "rofl",
    hero: { kicker: t.iAm, big: pct(purity, lang), title: t.purity, bg: pure ? "#FFD23F" : "#FF6B5B" },
    footnote: verdict,
    footBg: "#fff",
    text: t.soloText(pct(purity, lang), verdict),
  };
}

export function pureteGroupCard(rows: { name: string; purity: number; verdict: string; colorIndex: number }[]): ShareCard {
  const lang = getLang();
  const t = T[lang];
  const sorted = [...rows].sort((a, b) => b.purity - a.purity);
  const r = ranks(sorted, (x) => x.purity);
  const top = sorted[0];
  const last = sorted[sorted.length - 1];
  const tie = sorted.length > 1 && sorted[1].purity === top?.purity;
  return {
    game: "purete",
    color: colorOf(top?.colorIndex ?? 0),
    mood: "wink",
    hero: { kicker: tie ? undefined : t.angel, title: tie ? t.tie : top?.name, sub: tie ? undefined : `${pct(top.purity, lang)} · ${top.verdict}` },
    rows: sorted.map((x, i) => ({ name: x.name, value: pct(x.purity, lang), note: x.verdict, colorIndex: x.colorIndex, rank: r[i] })),
    footnote: last && sorted.length > 2 && last.purity < top.purity ? t.devil(last.name, pct(last.purity, lang)) : undefined,
    text: top ? t.groupText(top.name, pct(top.purity, lang)) : t.tableText(pct(0, lang)),
  };
}

export function pureteTableCard(purity: number, verdict: string): ShareCard {
  const lang = getLang();
  const t = T[lang];
  return {
    game: "purete",
    mood: purity >= 50 ? "wink" : "fire",
    hero: { kicker: t.table, big: pct(purity, lang), title: verdict, bg: purity >= 50 ? "#FFD23F" : "#FF6B5B" },
    text: t.tableText(pct(purity, lang)),
  };
}

/* ───────── Le Verre Invisible ───────── */
export function verreCard(ranking: { name: string; score: number; spills: number; colorIndex: number; note?: string }[]): ShareCard {
  const t = pick(T);
  const r = ranks(ranking, (x) => x.score);
  const best = ranking[0];
  const king = [...ranking].sort((a, b) => b.spills - a.spills)[0];
  const tie = ranking.length > 1 && ranking[1].score === best?.score;
  return {
    game: "verre",
    color: colorOf(best?.colorIndex ?? 0),
    crown: true,
    mood: "laughing",
    hero: { kicker: tie ? undefined : t.bestWaiter, title: tie ? t.tie : best?.name },
    rows: ranking.map((x, i) => ({ name: x.name, value: pts(x.score), note: x.note, colorIndex: x.colorIndex, rank: r[i] })),
    footnote: king && king.spills > 0 ? t.spilled(king.name, king.spills) : t.noSpill,
    text: t.verreText(best?.name ?? ""),
  };
}

/* ───────── La Tournée ───────── */
export function tourneeCard(ranking: { name: string; losses: number; colorIndex: number }[]): ShareCard {
  const t = pick(T);
  const r = ranks(ranking, (x) => x.losses);
  const top = ranking[0];
  return {
    game: "picolette",
    color: colorOf(top?.colorIndex ?? 0),
    mood: "rofl",
    crown: true,
    hero: { kicker: t.star, title: top?.name, sub: top ? t.penalties(top.losses) : undefined },
    rows: ranking.slice(1).map((x, i) => ({ name: x.name, value: t.penalties(x.losses), colorIndex: x.colorIndex, rank: r[i + 1] })),
    text: t.roundText(top?.name ?? ""),
  };
}

/* ───────── Chut ! ───────── */
export function chutCard(awards: { title: string; sub: string; name: string; colorIndex: number; bg: string }[], rows: ShareRow[]): ShareCard {
  const t = pick(T);
  const [first, ...others] = awards;
  return {
    game: "chut",
    color: first ? colorOf(first.colorIndex) : undefined,
    mood: first ? "cool" : "laughing",
    hero: first ? { kicker: first.title, title: first.name, sub: first.sub, bg: first.bg } : undefined,
    awards: others.map((a): ShareAward => ({ label: `${a.title} · ${a.sub}`, name: a.name, colorIndex: a.colorIndex, bg: a.bg, mood: "rofl" })),
    rows,
    text: t.chutText(first?.name ?? rows[0]?.name ?? ""),
  };
}

/* ───────── Générique : jeux à classement (ZRanking) ───────── */
export function rankingCard(game: string, rows: { name: string; score: number | string; colorIndex: number; note?: string }[], unit = "pts"): ShareCard {
  const t = pick(T);
  const r = ranks(rows, (x) => x.score);
  const top = rows[0];
  const tie = rows.length > 1 && rows[1].score === top?.score;
  const name = gameName(game);
  return {
    game,
    color: colorOf(top?.colorIndex ?? 0),
    crown: !tie,
    mood: "laughing",
    hero: { kicker: tie ? undefined : t.winner, title: tie ? t.tie : top?.name },
    rows: rows.map((x, i) => ({ name: x.name, value: unit === "pts" ? pts(x.score) : unit ? `${x.score} ${unit}` : String(x.score), note: x.note, colorIndex: x.colorIndex, rank: r[i] })),
    text: tie ? `${name} · ${t.tie}` : t.rankingText(name, top?.name ?? ""),
  };
}
