// Bruitages + vibrations des jeux « objet » (La Patate, Lâche pas !).
// Vrais bruitages via src/lib/sfx.ts (coupure du son globale, partagée par tous les jeux) :
// tic-tac mécanique, mèche qui crépite, bips de détonateur, vraie explosion, pétards, cœur.
import { isNativeApp } from "@/lib/app-mode";
import { isSfxMuted, playCombo, playLoop, playSfx, preloadSfx, setSfxMuted, type LoopHandle } from "@/lib/sfx";

/** Sons utilisés par ces jeux : à précharger au montage. */
export const OBJECT_GAME_SFX = [
  "bomb-tick", "bomb-tock", "fuse", "detonator-beep", "explosion", "firecracker", "heartbeat",
  "whoosh", "whooshdown", "pop", "pop2", "ding", "select", "buzzer", "crowd-aww", "tada", "applause",
] as const;

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
 * Tic / tac d'horloge mécanique (bombe à retardement). `urgency` 0 → 1 :
 * plus fort et un peu plus aigu quand la mèche raccourcit.
 */
export function sfxTick(high: boolean, urgency = 0) {
  const u = Math.max(0, Math.min(1, urgency));
  playSfx(high ? "bomb-tick" : "bomb-tock", { volume: 0.45 + u * 0.35, rate: 1 + u * 0.22 });
}

/**
 * Mèche qui crépite en boucle. Renvoie l'arrêt (à appeler en fin de manche / au démontage).
 * `fuseHeat(handle, u)` l'attise quand la fin approche.
 */
export function startFuse(volume = 0.5): LoopHandle {
  return playLoop("fuse", { volume, fadeIn: 0.12 });
}
export function fuseHeat(fuse: LoopHandle | null, urgency: number, base = 0.5) {
  if (!fuse) return;
  const u = Math.max(0, Math.min(1, urgency));
  fuse.setRate(1 + u * 0.18);
  fuse.setVolume(base + u * 0.3);
}

/** Bip aigu de détonateur (urgence finale). */
export function sfxDetonator() {
  playSfx("detonator-beep", { volume: 0.6 });
}

/** La mèche prend feu. */
export function sfxIgnite() {
  playSfx("pop2", { volume: 0.55, rate: 0.75 });
  playSfx("whooshdown", { volume: 0.35, rate: 1.2 });
}

/** Le tél change de main. */
export function sfxPass() {
  playSfx("whoosh", { volume: 0.55, rate: 1.1 });
}

/** Grosse explosion. */
export function sfxBoom() {
  playCombo("explosion");
}

/** Pétard / fausse alerte : vrai claquement de pétard, jamais tout à fait le même. */
export function sfxPop() {
  playSfx("firecracker", { volume: 0.9, rate: 0.9 + Math.random() * 0.25 });
}

/** Battement de cœur (boum-boum) ; `rate` > 1 quand le cœur s'emballe. */
export function sfxHeart(rate = 1) {
  playSfx("heartbeat", { volume: 0.6, rate: Math.max(0.8, Math.min(1.6, rate)) });
}

/** Petit « ding » positif. */
export function sfxDing() {
  playSfx("ding", { volume: 0.7 });
}

/** Un doigt se lève. */
export function sfxLift() {
  playSfx("pop2", { volume: 0.6, rate: 1.1 });
}

/** Compte à rebours (3, 2, 1) puis la bombe s'arme (double bip de détonateur). */
export function sfxCount(last = false) {
  if (last) {
    playSfx("detonator-beep", { volume: 0.7 });
    playSfx("detonator-beep", { volume: 0.7, delay: 0.16 });
  } else playSfx("bomb-tick", { volume: 0.9 });
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
