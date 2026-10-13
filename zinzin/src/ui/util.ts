import { type Lang, pick } from "@/lib/i18n";
import { GAME_TEXT, type ZGame, type ZGameText } from "../catalog";
import { UI } from "../strings";

/** Textes d'un jeu dans la langue demandée (catalog-text.ts). */
export type GameInfo = ZGameText;

/** Retire les emojis (titres de section…). */
export function stripEmoji(s: string): string {
  return s.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍⃣]/gu, "").replace(/\s{2,}/g, " ").trim();
}

export function gameInfo(g: ZGame, lang: Lang): GameInfo {
  return pick(GAME_TEXT[g.id], lang);
}

/** Libellé joueurs : « 3-12 » → « 3 à 12 joueurs », « 2+ » → « 2 joueurs et + » (selon la langue). */
export function playersLabel(p: string, lang: Lang): string {
  const t = pick(UI, lang).players;
  if (/^\d+\+$/.test(p)) return t.plus(p.slice(0, -1));
  const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return t.range(m[1], m[2]);
  if (/^\d+$/.test(p)) return t.exact(p);
  return p;
}

/** Petit retour haptique (natif uniquement, silencieux sur le web). */
export function haptic(kind: "light" | "medium" | "success" = "light") {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  import("@capacitor/haptics")
    .then(({ Haptics, ImpactStyle, NotificationType }) => {
      if (kind === "success") return Haptics.notification({ type: NotificationType.Success });
      return Haptics.impact({ style: kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
    })
    .catch(() => {});
}

export const reducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const AGE_KEY = "zz-age-ok";
export const isAgeOk = () => {
  try { return localStorage.getItem(AGE_KEY) === "1"; } catch { return false; }
};
export const setAgeOk = () => {
  try { localStorage.setItem(AGE_KEY, "1"); } catch { /* stockage indisponible */ }
};

export const APP_VERSION = "1.0.0";
