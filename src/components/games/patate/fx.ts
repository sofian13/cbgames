// Bruitages + vibrations des jeux « objet » (La Patate, Lâche pas !).
// Vrais samples via src/lib/sfx.ts (coupure du son globale, partagée par tous les jeux).
import { isNativeApp } from "@/lib/app-mode";
import { isSfxMuted, playCombo, playSfx, preloadSfx, setSfxMuted } from "@/lib/sfx";

/** Sons utilisés par ces jeux : à précharger au montage. */
export const OBJECT_GAME_SFX = ["tick", "tock", "whoosh", "boom", "plate", "thump", "whooshdown", "pop", "pop2", "ding", "success", "gong", "select", "wrong", "lose"] as const;

export function preloadObjectSfx() {
  preloadSfx([...OBJECT_GAME_SFX]);
}

export function setMuted(m: boolean) {
  setSfxMuted(m);
}
export function isMuted() {
  return isSfxMuted();
}

/** Gardé pour compat : sfx.ts réveille déjà l'audio au premier toucher. */
export function unlockAudio() {
  preloadObjectSfx();
}

/**
 * Tic (aigu) / tac (grave) d'horloge. `urgency` 0 → 1 : le tic-tac monte
 * en hauteur et en volume quand la mèche raccourcit.
 */
export function sfxTick(high: boolean, urgency = 0) {
  const u = Math.max(0, Math.min(1, urgency));
  playSfx(high ? "tick" : "tock", { volume: 0.45 + u * 0.45, rate: 1 + u * 0.55 });
}

/** Le tél change de main. */
export function sfxPass() {
  playSfx("whoosh", { volume: 0.55, rate: 1.15 });
}

/** Grosse explosion. */
export function sfxBoom() {
  playCombo("explosion");
}

/** Pétard / fausse alerte : claquement sec. */
export function sfxPop() {
  playSfx("pop", { volume: 0.9, rate: 0.8 });
  playSfx("thump", { volume: 0.7, rate: 1.2 });
}

/** Battement de cœur (boum-boum). */
export function sfxHeart() {
  playSfx("thump", { volume: 0.65, rate: 0.8 });
  playSfx("thump", { volume: 0.45, rate: 0.75, delay: 0.17 });
}

/** Petit « ding » positif (la mèche s'allume, la bombe s'arme). */
export function sfxDing() {
  playSfx("ding", { volume: 0.7 });
}

/** Un doigt se lève. */
export function sfxLift() {
  playSfx("pop2", { volume: 0.6, rate: 1.1 });
}

/** Compte à rebours (3, 2, 1). */
export function sfxCount(last = false) {
  playSfx(last ? "gong" : "tick", { volume: last ? 0.6 : 0.8, rate: last ? 1.2 : 1 });
}

/**
 * Vibration : navigator.vibrate (Android / web) + Haptics Capacitor dans l'app
 * (iOS n'a pas navigator.vibrate). Silencieux si rien n'est dispo.
 */
export function buzz(kind: "tick" | "pass" | "warn" | "boom") {
  try {
    const pattern = kind === "tick" ? 12 : kind === "pass" ? 30 : kind === "warn" ? [60, 40, 60] : [500, 80, 300, 80, 500];
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  } catch {
    // ignore
  }
  if (!isNativeApp()) return;
  void (async () => {
    try {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (kind === "tick") await Haptics.impact({ style: ImpactStyle.Light });
      else if (kind === "pass") await Haptics.impact({ style: ImpactStyle.Medium });
      else if (kind === "warn") await Haptics.notification({ type: NotificationType.Warning });
      else {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await Haptics.vibrate({ duration: 700 });
      }
    } catch {
      // plugin indisponible : on ignore
    }
  })();
}
