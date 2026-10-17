import { useSyncExternalStore } from "react";

/**
 * Qualité des effets adaptée au téléphone (iPhone ancien, Android d'entrée de gamme…) :
 * - au départ : « léger » si l'appareil annonce peu de cœurs / de mémoire, ou si l'utilisateur
 *   demande moins d'animations (réglage système) ;
 * - en direct : pendant les moments chargés, on mesure les images par seconde ; si ça descend
 *   sous ~50 i/s de façon durable, on passe en « léger » (mémorisé sur le téléphone).
 * Les composants lisent useLiteFx() pour alléger leurs effets (moins de particules, pas d'éclairs…).
 */

const KEY = "zz-lite-fx";
const listeners = new Set<() => void>();
/** Mode léger mémorisé valable 7 jours : un ralentissement passager ne bride pas le téléphone pour toujours. */
const STICKY_MS = 7 * 24 * 3600 * 1000;
let lite = (() => {
  if (typeof window === "undefined") return false;
  try {
    const at = Number(localStorage.getItem(KEY));
    if (at > 1 && Date.now() - at < STICKY_MS) return true;
    if (at) localStorage.removeItem(KEY);
  } catch { /* indispo */ }
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return true;
  // Nombre de cœurs et mémoire : seulement là où ils sont fiables (Android). Sur iPhone, Safari
  // plafonne volontairement ces chiffres (anti-pistage) : on se fie uniquement à la mesure en direct.
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory !== "number") return false;
  return nav.deviceMemory <= 3 || (nav.hardwareConcurrency ?? 8) <= 4;
})();

function setLite(v: boolean) {
  if (lite === v) return;
  lite = v;
  try { if (v) localStorage.setItem(KEY, String(Date.now())); else localStorage.removeItem(KEY); } catch { /* indispo */ }
  listeners.forEach((l) => l());
}

export function isLiteFx(): boolean {
  return lite;
}

export function useLiteFx(): boolean {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => lite, () => false);
}

/**
 * Surveille la fluidité pendant `ms` (à lancer quand un moment chargé commence : combo, pouvoir…).
 * Si la moyenne tombe sous 50 i/s, passe en mode léger. Une seule mesure à la fois.
 */
let measuring = false;
export function watchFps(ms = 2500): void {
  if (lite || measuring || typeof requestAnimationFrame !== "function") return;
  measuring = true;
  let frames = 0;
  const t0 = performance.now();
  const step = (t: number) => {
    frames++;
    if (t - t0 < ms) { requestAnimationFrame(step); return; }
    measuring = false;
    const fps = (frames * 1000) / (t - t0);
    if (!document.hidden && fps < 50) setLite(true);
  };
  requestAnimationFrame(step);
}
