/**
 * Micro de « Chut ! » : mesure UNIQUEMENT le niveau sonore (RMS en dBFS), en direct.
 * Rien n'est enregistré, rien n'est envoyé : l'AnalyserNode lit le flux et on jette tout.
 * Le micro est ouvert au tap de départ et libéré (stop des pistes + fermeture du contexte)
 * dès que la manche finit.
 */

export type MicError = "denied" | "unavailable";
export type Sensitivity = "library" | "living" | "club";

/** Réglages de seuil selon la sensibilité choisie. */
const SENS: Record<Sensitivity, { margin: number; minAbs: number; holdMs: number }> = {
  // marge au-dessus du bruit ambiant, seuil plancher absolu, durée de bruit pour déclencher
  library: { margin: 9, minAbs: -62, holdMs: 110 },
  living: { margin: 15, minAbs: -52, holdMs: 160 },
  club: { margin: 22, minAbs: -42, holdMs: 220 },
};

export const SILENT_DB = -100;

export function micSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
    && typeof window !== "undefined" && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
}

export class MicMeter {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private buf: Float32Array<ArrayBuffer> | null = null;

  get running() {
    return this.analyser != null;
  }

  /** À appeler DANS le geste (tap) : le contexte audio est créé avant toute attente. */
  async start(): Promise<void> {
    if (this.running) return;
    if (!micSupported()) throw "unavailable" as MicError;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (e) {
      this.stop();
      const name = (e as { name?: string })?.name;
      throw (name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable") as MicError;
    }
    // Arrêté entre-temps (démontage, quitter) : on rend le micro tout de suite
    if (this.ctx !== ctx) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    this.stream = stream;
    // iOS : à l'ouverture du micro, la session audio bascule en lecture+enregistrement et peut
    // « interrompre » le contexte créé juste avant → on le relance, sinon on en recrée un neuf.
    let live: AudioContext = ctx;
    if (live.state !== "running") await live.resume().catch(() => {});
    if (live.state !== "running") {
      void live.close().catch(() => {});
      live = new AC();
      this.ctx = live;
      await live.resume().catch(() => {});
    }
    const src = live.createMediaStreamSource(stream);
    const an = live.createAnalyser();
    an.fftSize = 2048;
    an.smoothingTimeConstant = 0;
    src.connect(an); // pas relié aux haut-parleurs : aucun retour
    this.analyser = an;
    this.buf = new Float32Array(an.fftSize);
  }

  /** Niveau instantané en dBFS (≈ -100 silence total … 0 saturation). */
  db(): number {
    const an = this.analyser;
    const buf = this.buf;
    if (!an || !buf) return SILENT_DB;
    an.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    return Math.max(SILENT_DB, 20 * Math.log10(rms || 1e-9));
  }

  /** Libère le micro (le voyant orange de l'iPhone s'éteint). */
  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.analyser = null;
    this.buf = null;
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx && ctx.state !== "closed") void ctx.close().catch(() => {});
  }
}

/** Bruit ambiant = 75e centile des mesures (ignore les rares pics). */
export function floorFrom(samples: number[]): number {
  if (samples.length === 0) return -70;
  const s = [...samples].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.75))];
}

/** Seuil de BUZZ adapté au bruit ambiant et à la sensibilité. */
export function thresholdFor(floor: number, sens: Sensitivity): number {
  const c = SENS[sens];
  return Math.min(-8, Math.max(floor + c.margin, c.minAbs));
}

export function holdMsFor(sens: Sensitivity): number {
  return SENS[sens].holdMs;
}

/** Position de l'aiguille (0..1) : le seuil tombe aux 3/4 du cadran. */
export function gaugeOf(db: number, floor: number, threshold: number): number {
  const span = Math.max(4, threshold - floor);
  return Math.max(0, Math.min(1, ((db - floor) / span) * 0.75));
}

// ── Niveau de voix (modes « Le bon volume », « Chuchote-le ! », « Crescendo », « Sans souffle ») ──

/** Plafond de l'échelle : au-delà, le micro du téléphone sature. */
const TOP_DB = -4;

/**
 * Niveau de voix 0..1 relatif au bruit ambiant calibré :
 * 0 = bruit de la pièce, ~0.25 = murmure près du micro, ~0.5 = voix normale,
 * ~0.7 = voix forte, ~0.9 = cri. Rien d'absolu : seulement des proportions.
 */
export function voiceLevel(db: number, floor: number): number {
  const span = Math.max(30, TOP_DB - floor);
  return Math.max(0, Math.min(1, (db - floor - 2) / span));
}

/** Seuil « chuchotement » de Chuchote-le ! selon la sensibilité choisie. */
export function whisperMax(sens: Sensitivity): number {
  return sens === "library" ? 0.32 : sens === "club" ? 0.48 : 0.4;
}

/**
 * Écoute lissée du niveau de voix (moyenne glissante ~150 ms) avec « bouchons » :
 * pendant `gate()`, le niveau renvoyé est 0 (sons joués par le téléphone, tap sur l'écran…).
 */
export class VoiceListener {
  private mic: MicMeter | null = null;
  private smooth = 0;
  private gateUntil = 0;
  floor = -70;

  get running() {
    return this.mic?.running ?? false;
  }

  /** À appeler dans le geste (tap). */
  async open(floor: number | null): Promise<void> {
    this.close();
    const m = new MicMeter();
    this.mic = m;
    await m.start();
    if (this.mic !== m) { m.stop(); return; }
    this.floor = floor ?? -70;
    this.smooth = 0;
  }

  close() {
    this.mic?.stop();
    this.mic = null;
  }

  gate(ms: number) {
    this.gateUntil = Math.max(this.gateUntil, performance.now() + ms);
  }

  get gated() {
    return performance.now() < this.gateUntil;
  }

  /** Niveau brut en dBFS (mesure du bruit ambiant avant une manche). */
  db(): number {
    return this.mic?.db() ?? SILENT_DB;
  }

  /** Plancher de la manche : jamais sous le calibrage, au plus +12 dB au-dessus. */
  refloor(calibrated: number | null, samples: number[]) {
    const base = calibrated ?? floorFrom(samples);
    this.floor = samples.length ? Math.min(Math.max(base, floorFrom(samples)), base + 12) : base;
  }

  /** Niveau 0..1 lissé (0 pendant un bouchon). */
  level(): number {
    if (!this.mic) return 0;
    const raw = voiceLevel(this.mic.db(), this.floor);
    if (this.gated) { this.smooth = 0; return 0; }
    // montée rapide, descente un peu plus lente : l'aiguille reste lisible
    const a = raw > this.smooth ? 0.55 : 0.3;
    this.smooth += (raw - this.smooth) * a;
    return this.smooth;
  }
}
