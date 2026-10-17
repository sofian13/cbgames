import type { I18n, Lang } from "@/lib/i18n";

/**
 * Moteur de « Tapote le blob » (pur, sans React) : bâtiments, améliorations, production,
 * blob doré, « Grande fête » (recommencer contre des confettis = bonus permanent), format des grands nombres.
 * Sauvegarde : clicker-save.ts. Interface : ui/BlobClicker.tsx.
 */

export interface ClickerState {
  v: 2;
  /** Vrais touchers (paliers de récompenses, jamais remis à zéro) */
  taps: number;
  gloops: number;
  /** Gloops gagnés depuis la dernière Grande fête (déblocages, Grande fête) */
  earned: number;
  /** Gloops gagnés depuis toujours */
  earnedAll: number;
  /** Nombre de chaque bâtiment (même ordre que BUILDINGS) */
  bld: number[];
  /** Améliorations achetées (ids) */
  upg: string[];
  /** Confettis (Grande fête) : +2 % de tout par confetti, à vie */
  confetti: number;
  /** Dernier passage (gains hors ligne) */
  last: number;
  /** Date de sauvegarde (choisir la copie la plus récente) */
  savedAt: number;
}

export const freshState = (): ClickerState => ({
  v: 2, taps: 0, gloops: 0, earned: 0, earnedAll: 0, bld: BUILDINGS.map(() => 0), upg: [], confetti: 0, last: Date.now(), savedAt: 0,
});

export interface Building { id: string; icon: string; base: number; prod: number; name: I18n<string> }
export const BUILDINGS: Building[] = [
  { id: "mini", icon: "🫧", base: 15, prod: 0.1, name: { fr: "Mini-blob", en: "Mini-blob", es: "Mini-blob" } },
  { id: "dj", icon: "🎧", base: 100, prod: 1, name: { fr: "Blob DJ", en: "Blob DJ", es: "Blob DJ" } },
  { id: "bar", icon: "🍹", base: 1_100, prod: 8, name: { fr: "Bar à blobs", en: "Blob bar", es: "Bar de blobs" } },
  { id: "club", icon: "🪩", base: 12_000, prod: 47, name: { fr: "Boîte de nuit", en: "Nightclub", es: "Discoteca" } },
  { id: "fest", icon: "🎪", base: 130_000, prod: 260, name: { fr: "Festival", en: "Festival", es: "Festival" } },
  { id: "bus", icon: "🚌", base: 1_400_000, prod: 1_400, name: { fr: "Tournée en bus", en: "Party bus tour", es: "Gira en autobús" } },
  { id: "factory", icon: "🏭", base: 20_000_000, prod: 7_800, name: { fr: "Usine à blobs", en: "Blob factory", es: "Fábrica de blobs" } },
  { id: "planet", icon: "🪐", base: 330_000_000, prod: 44_000, name: { fr: "Planète Blob", en: "Planet Blob", es: "Planeta Blob" } },
  { id: "multi", icon: "🌌", base: 5_100_000_000, prod: 260_000, name: { fr: "Multivers Zinzin", en: "Zinzin multiverse", es: "Multiverso Zinzin" } },
  { id: "bang", icon: "💥", base: 75_000_000_000, prod: 1_600_000, name: { fr: "Big Bang de la fête", en: "Party Big Bang", es: "Big Bang de la fiesta" } },
];

export const buildingCost = (b: Building, owned: number) => Math.ceil(b.base * 1.15 ** owned);

export interface Upgrade {
  id: string;
  icon: string;
  cost: number;
  name: I18n<string>;
  /** Visible quand… */
  show: (s: ClickerState) => boolean;
}

const TAP_UPS: [string, number, number, I18n<string>][] = [
  ["t1", 100, 15, { fr: "Doigt musclé", en: "Strong finger", es: "Dedo musculoso" }],
  ["t2", 500, 50, { fr: "Doigt d'acier", en: "Steel finger", es: "Dedo de acero" }],
  ["t3", 10_000, 300, { fr: "Doigt en titane", en: "Titanium finger", es: "Dedo de titanio" }],
  ["t4", 1_000_000, 1_000, { fr: "Doigt cosmique", en: "Cosmic finger", es: "Dedo cósmico" }],
  ["t5", 100_000_000, 3_000, { fr: "Doigt divin", en: "Divine finger", es: "Dedo divino" }],
];
/** Paliers des améliorations de bâtiment : nombre possédé → multiplicateur du prix de base */
const BLD_TIERS: [number, number][] = [[1, 10], [10, 50], [25, 500], [50, 50_000], [100, 5_000_000]];
const TIER_NAMES: I18n<string[]> = {
  fr: ["Échauffement", "Ambiance", "Folie", "Délire", "Légende"],
  en: ["Warm-up", "Good vibes", "Madness", "Frenzy", "Legend"],
  es: ["Calentamiento", "Ambiente", "Locura", "Delirio", "Leyenda"],
};

export const UPGRADES: Upgrade[] = [
  ...TAP_UPS.map(([id, cost, taps, name]) => ({ id, icon: "👆", cost, name, show: (s: ClickerState) => s.taps >= taps })),
  { id: "tp1", icon: "✨", cost: 50_000, name: { fr: "Tap magique (+1 % du /s)", en: "Magic tap (+1% of /s)", es: "Toque mágico (+1 % del /s)" }, show: (s) => s.earned >= 20_000 },
  { id: "tp2", icon: "🌟", cost: 5_000_000, name: { fr: "Tap stellaire (+2 % du /s)", en: "Stellar tap (+2% of /s)", es: "Toque estelar (+2 % del /s)" }, show: (s) => s.earned >= 2_000_000 },
  ...BUILDINGS.flatMap((b, bi) => BLD_TIERS.map(([need, k], ti) => ({
    id: `b${bi}-${ti}`,
    icon: b.icon,
    cost: b.base * k,
    name: { fr: `${b.name.fr} : ${TIER_NAMES.fr[ti]} ×2`, en: `${b.name.en}: ${TIER_NAMES.en[ti]} ×2`, es: `${b.name.es}: ${TIER_NAMES.es[ti]} ×2` },
    show: (s: ClickerState) => s.bld[bi] >= need,
  }))),
];

const has = (s: ClickerState, id: string) => s.upg.includes(id);

/** Multiplicateur global (confettis + frénésie du blob doré). */
export const globalMult = (s: ClickerState, frenzy: boolean) => (1 + 0.02 * s.confetti) * (frenzy ? 7 : 1);

export function buildingMult(s: ClickerState, bi: number): number {
  let m = 1;
  BLD_TIERS.forEach((_, ti) => { if (has(s, `b${bi}-${ti}`)) m *= 2; });
  return m;
}

/** Production par seconde. */
export function perSecond(s: ClickerState, frenzy = false): number {
  let p = 0;
  BUILDINGS.forEach((b, i) => { p += s.bld[i] * b.prod * buildingMult(s, i); });
  return p * globalMult(s, frenzy);
}

/** Gloops par toucher. */
export function perTap(s: ClickerState, frenzy = false): number {
  let t = 1;
  TAP_UPS.forEach(([id]) => { if (has(s, id)) t *= 2; });
  t *= 1 + 0.02 * s.confetti;
  const pct = (has(s, "tp1") ? 0.01 : 0) + (has(s, "tp2") ? 0.02 : 0);
  return t * (frenzy ? 7 : 1) + perSecond(s, frenzy) * pct;
}

export function earn(s: ClickerState, n: number): ClickerState {
  return { ...s, gloops: s.gloops + n, earned: s.earned + n, earnedAll: s.earnedAll + n };
}

/* ───── Grande fête : recommencer à zéro contre des confettis (bonus permanent) ───── */
export const PARTY_MIN = 1_000_000_000;
/** Confettis gagnés si on fait la Grande fête maintenant (racine cubique des milliards gagnés, cumulés). */
export function partyConfetti(s: ClickerState): number {
  return Math.floor(Math.cbrt(s.earnedAll / PARTY_MIN)) * 10 - s.confetti;
}
export function bigParty(s: ClickerState): ClickerState {
  const gain = Math.max(0, partyConfetti(s));
  return { ...freshState(), taps: s.taps, earnedAll: s.earnedAll, confetti: s.confetti + gain, last: Date.now() };
}

/* ───── Grands nombres ───── */
const SUFFIX: I18n<string[]> = {
  fr: ["", " K", " M", " Md", " Bn", " Bd", " Tn", " Td", " Qn", " Qd"],
  en: ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"],
  es: ["", " K", " M", " mil M", " B", " mil B", " T", " mil T", " C", " mil C"],
};
export function fmtBig(n: number, lang: Lang): string {
  const loc = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "fr-FR";
  if (!Number.isFinite(n)) return "∞";
  if (n < 1000) return n < 10 && n % 1 ? n.toLocaleString(loc, { maximumFractionDigits: 1 }) : Math.floor(n).toLocaleString(loc);
  if (n < 1_000_000) return Math.floor(n).toLocaleString(loc);
  const e = Math.min(SUFFIX[lang].length - 1, Math.floor(Math.log10(n) / 3));
  const v = n / 10 ** (e * 3);
  return `${v.toLocaleString(loc, { maximumFractionDigits: v < 10 ? 2 : v < 100 ? 1 : 0 })}${SUFFIX[lang][e]}`;
}

/** Ancienne sauvegarde (v1 : taps, gloops, finger, minis) → v2. */
export function migrate(raw: unknown): ClickerState {
  const base = freshState();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const num = (k: string) => (typeof o[k] === "number" && Number.isFinite(o[k] as number) ? (o[k] as number) : 0);
  if (o.v === 2) {
    const bld = Array.isArray(o.bld) ? BUILDINGS.map((_, i) => Math.max(0, Math.floor(Number((o.bld as unknown[])[i]) || 0))) : base.bld;
    const upg = Array.isArray(o.upg) ? (o.upg as unknown[]).filter((x): x is string => typeof x === "string") : [];
    return { ...base, taps: num("taps"), gloops: num("gloops"), earned: num("earned"), earnedAll: num("earnedAll"), bld, upg, confetti: num("confetti"), last: num("last") || Date.now(), savedAt: num("savedAt") };
  }
  const bld = base.bld.slice();
  bld[0] = Math.floor(num("minis"));
  const upg = TAP_UPS.slice(0, Math.min(TAP_UPS.length, Math.floor(num("finger")))).map(([id]) => id);
  const g = num("gloops");
  return { ...base, taps: num("taps"), gloops: g, earned: g, earnedAll: g, bld, upg, last: num("last") || Date.now() };
}
