import { getGameById } from "@/lib/games/registry";
import type { ZGame } from "../catalog";

/** Textes d'un jeu : surcharge `meta` du catalogue, sinon registry du site. */
export interface GameInfo {
  name: string;
  pitch: string;
  example?: string;
  rules: string[];
  minPlayers: number;
  maxPlayers: number;
}

/** Retire les emojis (souvent en fin de nom dans le registry). */
export function stripEmoji(s: string): string {
  return s.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍⃣]/gu, "").replace(/\s{2,}/g, " ").trim();
}

export function gameInfo(g: ZGame): GameInfo {
  const m = g.meta;
  if (m) return { name: stripEmoji(m.name), pitch: m.pitch, example: m.example, rules: m.rules, minPlayers: m.minPlayers, maxPlayers: m.maxPlayers };
  const r = getGameById(g.id);
  return {
    name: stripEmoji(r?.name ?? g.id),
    pitch: r?.pitch ?? r?.description ?? "",
    example: r?.example,
    rules: r?.rules ?? [],
    minPlayers: r?.minPlayers ?? 2,
    maxPlayers: r?.maxPlayers ?? 10,
  };
}

/** Libellé joueurs : « 3-12 » → « 3 à 12 joueurs », « 2+ » → « 2 joueurs et + ». */
export function playersLabel(p: string): string {
  if (/^\d+\+$/.test(p)) return `${p.slice(0, -1)} joueurs et +`;
  const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return `${m[1]} à ${m[2]} joueurs`;
  if (/^\d+$/.test(p)) return `${p} joueurs`;
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
