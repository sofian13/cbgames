import type { I18n, Lang } from "@/lib/i18n";

/**
 * Moteur de « Tapote le blob » (pur, sans React). Volontairement simple à comprendre :
 * 5 améliorations à niveaux (le doigt + 4 producteurs), toujours aux mêmes places ;
 * tous les 10 niveaux, une amélioration DOUBLE d'efficacité (jalons visibles).
 * + la « Grande fête » (6e carte) : tout recommencer contre des confettis (+3 % de tout chacun, à vie),
 * ce qui permet de monter sans fin. Sauvegarde : clicker-save.ts. Interface : ui/BlobClicker.tsx.
 */

export interface ClickerState {
  v: 3;
  /** Vrais touchers (paliers de récompenses, jamais remis à zéro) */
  taps: number;
  gloops: number;
  /** Gloops gagnés depuis la dernière Grande fête */
  earned: number;
  /** Gloops gagnés depuis toujours (confettis) */
  earnedAll: number;
  /** Niveaux, même ordre que LEVELS : doigt, mini-blobs, blob DJ, boîte de nuit, planète */
  lv: number[];
  confetti: number;
  last: number;
  savedAt: number;
  /** Décor choisi (ClickerScenes.tsx) ; par défaut le dernier débloqué */
  env?: string;
}

export interface LevelDef { id: string; icon: string; base: number; growth: number; /** 0 = le doigt (par tap) ; sinon production /s par niveau */ prod: number; name: I18n<string> }
export const LEVELS: LevelDef[] = [
  { id: "finger", icon: "👆", base: 20, growth: 1.45, prod: 0, name: { fr: "Doigt musclé", en: "Strong finger", es: "Dedo musculoso" } },
  { id: "mini", icon: "🫧", base: 15, growth: 1.15, prod: 0.2, name: { fr: "Mini-blobs", en: "Mini-blobs", es: "Mini-blobs" } },
  { id: "dj", icon: "🎧", base: 120, growth: 1.15, prod: 2, name: { fr: "Blob DJ", en: "Blob DJ", es: "Blob DJ" } },
  { id: "club", icon: "🪩", base: 1_500, growth: 1.15, prod: 15, name: { fr: "Boîte de nuit", en: "Nightclub", es: "Discoteca" } },
  { id: "planet", icon: "🪐", base: 25_000, growth: 1.15, prod: 120, name: { fr: "Planète Blob", en: "Planet Blob", es: "Planeta Blob" } },
];

export const freshState = (): ClickerState => ({ v: 3, taps: 0, gloops: 0, earned: 0, earnedAll: 0, lv: LEVELS.map(() => 0), confetti: 0, last: Date.now(), savedAt: 0 });

export const levelCost = (i: number, lv: number) => Math.ceil(LEVELS[i].base * LEVELS[i].growth ** lv);
/** Tous les 10 niveaux : ×2 */
export const levelMult = (lv: number) => 2 ** Math.floor(lv / 10);
export const confettiMult = (s: ClickerState) => 1 + 0.03 * s.confetti;
/** Une amélioration est visible dès qu'on a gagné la moitié de son premier prix (ou qu'on l'a déjà). */
export const levelUnlocked = (s: ClickerState, i: number) => i <= 1 || s.lv[i] > 0 || s.earned >= LEVELS[i].base * 0.5;

/** Ce que rapporte une amélioration à son niveau actuel (gloops/tap pour le doigt, gloops/s sinon). */
export function levelOutput(s: ClickerState, i: number, lv = s.lv[i]): number {
  if (i === 0) return (1 + lv) * levelMult(lv) * confettiMult(s);
  return LEVELS[i].prod * lv * levelMult(lv) * confettiMult(s);
}

export function perSecond(s: ClickerState, frenzy = false): number {
  let p = 0;
  for (let i = 1; i < LEVELS.length; i++) p += levelOutput(s, i);
  return p * (frenzy ? 7 : 1);
}
export function perTap(s: ClickerState, frenzy = false): number {
  return levelOutput(s, 0) * (frenzy ? 7 : 1);
}
export function earn(s: ClickerState, n: number): ClickerState {
  return { ...s, gloops: s.gloops + n, earned: s.earned + n, earnedAll: s.earnedAll + n };
}

/* ───── Grande fête ───── */
export const PARTY_MIN = 1_000_000;
/** Confettis gagnés si on fait la fête maintenant (racine carrée des millions gagnés depuis toujours). */
export function partyConfetti(s: ClickerState): number {
  return Math.floor(Math.sqrt(s.earnedAll / PARTY_MIN)) * 5 - s.confetti;
}
export function bigParty(s: ClickerState): ClickerState {
  return { ...freshState(), taps: s.taps, earnedAll: s.earnedAll, confetti: s.confetti + Math.max(0, partyConfetti(s)), last: Date.now(), env: s.env };
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
  if (n < 10 && n % 1) return n.toLocaleString(loc, { maximumFractionDigits: 1 });
  if (n < 100_000) return Math.floor(n).toLocaleString(loc);
  const e = Math.min(SUFFIX[lang].length - 1, Math.max(1, Math.floor(Math.log10(n) / 3)));
  const v = n / 10 ** (e * 3);
  return `${v.toLocaleString(loc, { maximumFractionDigits: v < 10 ? 2 : v < 100 ? 1 : 0 })}${SUFFIX[lang][e]}`;
}

/** Anciennes sauvegardes (v1 : finger/minis ; v2 : bâtiments + améliorations) → v3. */
export function migrate(raw: unknown): ClickerState {
  const base = freshState();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const num = (k: string) => (typeof o[k] === "number" && Number.isFinite(o[k] as number) ? (o[k] as number) : 0);
  const keep = { taps: num("taps"), gloops: num("gloops"), confetti: 0, last: num("last") || Date.now(), savedAt: num("savedAt") };
  if (o.v === 3) {
    const lv = Array.isArray(o.lv) ? LEVELS.map((_, i) => Math.max(0, Math.floor(Number((o.lv as unknown[])[i]) || 0))) : base.lv;
    return { ...base, ...keep, earned: num("earned"), earnedAll: num("earnedAll"), lv, confetti: num("confetti"), ...(typeof o.env === "string" ? { env: o.env } : {}) };
  }
  const lv = base.lv.slice();
  if (o.v === 2) {
    const bld = Array.isArray(o.bld) ? (o.bld as unknown[]).map((x) => Math.floor(Number(x) || 0)) : [];
    const upg = Array.isArray(o.upg) ? (o.upg as unknown[]) : [];
    lv[0] = upg.filter((x) => typeof x === "string" && /^t\d$/.test(x)).length * 3;
    lv[1] = bld[0] ?? 0; lv[2] = (bld[1] ?? 0) + (bld[2] ?? 0); lv[3] = bld[3] ?? 0; lv[4] = bld.slice(4).reduce((a, b) => a + b, 0);
  } else {
    lv[0] = Math.floor(num("finger")) * 3;
    lv[1] = Math.floor(num("minis"));
  }
  const g = num("gloops");
  return { ...base, ...keep, earned: Math.max(g, num("earned")), earnedAll: Math.max(g, num("earnedAll")), lv };
}
