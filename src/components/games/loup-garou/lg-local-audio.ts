/**
 * Loup-Garou local : narration vocale (Web Speech API, fr-FR) et ambiance sonore
 * synthétisée (Web Audio). Tout est optionnel et échoue en silence.
 */

// ── Narration ─────────────────────────────────────────────
export function speechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;
function frenchVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  cachedVoice =
    voices.find((v) => v.lang === "fr-FR" && /thomas|amélie|amelie|audrey|marie/i.test(v.name)) ??
    voices.find((v) => v.lang === "fr-FR") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("fr")) ??
    null;
  return cachedVoice;
}

const RATE = 0.95;

/** Durée estimée d'une phrase lue (sert à cadencer la nuit, sans dépendre de onend) */
export function speechMs(text: string): number {
  return Math.max(1800, (text.length * 62) / RATE);
}

export function speak(text: string, enabled: boolean) {
  if (!enabled || !speechAvailable() || !text) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/·e/g, "e").replace(/[…]/g, "."));
    u.lang = "fr-FR";
    const v = frenchVoice();
    if (v) u.voice = v;
    u.rate = RATE;
    u.pitch = 0.92;
    synth.speak(u);
  } catch {
    /* narration indisponible : le texte reste à l'écran */
  }
}

export function stopSpeech() {
  if (!speechAvailable()) return;
  try { window.speechSynthesis.cancel(); } catch { /* rien */ }
}

// ── Ambiance ──────────────────────────────────────────────
export type Mood = "night" | "day" | "off";

type WinAudio = typeof window & { webkitAudioContext?: typeof AudioContext };

/** Nappes très discrètes : bourdon grave + grillons la nuit, accord doux + oiseaux le jour. */
export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layer: { gain: GainNode; nodes: AudioScheduledSourceNode[] } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private mood: Mood = "off";
  enabled = true;

  /** À appeler depuis un geste utilisateur (iOS) */
  unlock() {
    if (typeof window === "undefined") return;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as WinAudio).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    const m = this.mood;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.fadeOutLayer();
    if (on) {
      this.mood = "off";
      this.setMood(m);
    }
  }

  setMood(mood: Mood) {
    if (mood === this.mood && this.layer) return;
    this.mood = mood;
    this.fadeOutLayer();
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.enabled || mood === "off" || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(mood === "night" ? 0.11 : 0.07, ctx.currentTime + 3);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = mood === "night" ? 420 : 1300;
    filter.connect(gain);
    gain.connect(this.master);
    const freqs = mood === "night" ? [55, 82.4, 110.3] : [196, 246.9, 293.7, 392];
    const nodes: AudioScheduledSourceNode[] = [];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 && mood === "night" ? "sawtooth" : "sine";
      o.frequency.value = f;
      o.detune.value = (i - 1) * 6;
      const g = ctx.createGain();
      g.gain.value = 0.3 / freqs.length;
      // respiration lente
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx.createGain();
      lg.gain.value = 0.08 / freqs.length;
      lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(filter);
      o.start();
      lfo.start();
      nodes.push(o, lfo);
    });
    this.layer = { gain, nodes };
    this.scheduleDetail();
  }

  private scheduleDetail() {
    const wait = 2500 + Math.random() * 5000;
    this.timer = setTimeout(() => {
      if (this.mood === "night") this.chirp(4200, 0.012, 3);
      else if (this.mood === "day") this.chirp(2600 + Math.random() * 900, 0.018, 2);
      this.scheduleDetail();
    }, wait);
  }

  private chirp(freq: number, vol: number, count: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    for (let k = 0; k < count; k++) {
      const t = ctx.currentTime + k * 0.11;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * (this.mood === "day" ? 1.25 : 0.96), t + 0.07);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.1);
    }
  }

  private fadeOutLayer() {
    const l = this.layer;
    this.layer = null;
    if (!l || !this.ctx) return;
    const t = this.ctx.currentTime;
    l.gain.gain.cancelScheduledValues(t);
    l.gain.gain.setValueAtTime(l.gain.gain.value, t);
    l.gain.gain.linearRampToValueAtTime(0, t + 1.5);
    l.nodes.forEach((n) => { try { n.stop(t + 1.6); } catch { /* déjà arrêté */ } });
  }

  /** Hurlement lointain (réveil des loups) */
  howl() {
    const ctx = this.ctx;
    if (!this.enabled || !ctx || !this.master) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const vib = ctx.createOscillator();
    const vg = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(260, t);
    o.frequency.linearRampToValueAtTime(520, t + 0.7);
    o.frequency.linearRampToValueAtTime(470, t + 1.8);
    o.frequency.linearRampToValueAtTime(300, t + 2.4);
    vib.frequency.value = 5;
    vg.gain.value = 9;
    vib.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.4);
    g.gain.linearRampToValueAtTime(0.05, t + 1.8);
    g.gain.linearRampToValueAtTime(0, t + 2.5);
    o.connect(g).connect(this.master);
    o.start(t); vib.start(t);
    o.stop(t + 2.6); vib.stop(t + 2.6);
  }

  /** Petit carillon (révélations, fin de minuteur) */
  bell(times = 1) {
    const ctx = this.ctx;
    if (!this.enabled || !ctx || !this.master) return;
    for (let k = 0; k < times; k++) {
      const t = ctx.currentTime + k * 0.35;
      [660, 990].forEach((f) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        o.connect(g).connect(this.master!);
        o.start(t);
        o.stop(t + 1.3);
      });
    }
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.fadeOutLayer();
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx) setTimeout(() => { void ctx.close().catch(() => {}); }, 1700);
  }
}
