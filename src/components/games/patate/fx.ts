// Bruitages synthétisés (Web Audio) + vibrations pour les jeux « objet » (La Patate, Lâche pas !).
// Aucun fichier son : tout est généré à la volée, donc 100 % hors-ligne.
import { isNativeApp } from "@/lib/app-mode";

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** À appeler dans un geste (tap) : iOS ne joue aucun son avant. */
export function unlockAudio() {
  const c = ac();
  if (!c) return;
  // Buffer muet : débloque la sortie audio sur iOS
  const b = c.createBuffer(1, 1, 22050);
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(c.destination);
  s.start(0);
}

function tone(freq: number, t0: number, dur: number, type: OscillatorType, gain: number, freqEnd?: number) {
  const c = ctx!;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(t0: number, dur: number, fStart: number, fEnd: number, gain: number, type: BiquadFilterType = "lowpass") {
  const c = ctx!;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(fStart, t0);
  f.frequency.exponentialRampToValueAtTime(fEnd, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/** Tic (aigu) / tac (grave) d'horloge. */
export function sfxTick(high: boolean) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(high ? 1900 : 1300, t, 0.045, "square", 0.08);
  noise(t, 0.03, 6000, 2500, 0.08, "highpass");
}

/** Le tél change de main : petit « whoosh » montant. */
export function sfxPass() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  noise(t, 0.18, 800, 4000, 0.14, "bandpass");
  tone(520, t, 0.12, "triangle", 0.1, 1040);
}

/** Grosse explosion : craquement + grave qui chute. */
export function sfxBoom() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  noise(t, 1.6, 3000, 60, 0.9, "lowpass");
  noise(t, 0.25, 9000, 1500, 0.5, "highpass");
  tone(140, t, 1.2, "sine", 0.8, 28);
  tone(70, t + 0.02, 1.4, "sawtooth", 0.25, 20);
}

/** Pétard / fausse alerte : claquement sec. */
export function sfxPop() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  noise(t, 0.12, 5000, 400, 0.5, "lowpass");
  tone(300, t, 0.08, "square", 0.12, 90);
}

/** Battement de cœur (boum-boum). */
export function sfxHeart() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(62, t, 0.14, "sine", 0.55, 40);
  tone(58, t + 0.17, 0.16, "sine", 0.4, 38);
}

/** Petit « ding » positif. */
export function sfxDing() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(880, t, 0.18, "triangle", 0.18);
  tone(1320, t + 0.08, 0.25, "triangle", 0.14);
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
