/**
 * Voix des persos (« Ma bande ») : enregistrement court au micro, lecture Web Audio,
 * et « qui parle en ce moment » (pour animer la bouche du blob).
 * - Enregistrement : MediaRecorder (iOS WKWebView : audio/mp4 ; navigateurs : webm/ogg),
 *   mono, débit modeste, 5 s max. Volume normalisé par un gain calculé une fois (pas de ré-encodage).
 * - Lecture : contexte audio partagé de src/lib/sfx.ts → respecte le bouton son coupé global.
 * Rien n'est envoyé nulle part : le son reste sur le téléphone (IndexedDB, voice-store.ts).
 */
import { useSyncExternalStore } from "react";
import type { MascotMood } from "@/components/Mascot";
import { sfxOutput } from "@/lib/sfx";
import { getVoiceFor, subscribePlayers } from "@/lib/saved-players";
import { VOICE_MAX_BYTES, VOICE_MAX_S, baseMime, getVoice, newVoiceId, type VoiceClip } from "./voice-store";

export type RecError = "denied" | "unavailable" | "short" | "big" | "failed";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
/** Clé « qui parle » d'un perso de la bande. */
export const voiceKey = (name: string) => `n:${norm(name)}`;

/* ───────── Réglage « Voix des persos en jeu » (activé par défaut) ───────── */
const GAME_KEY = "zz-voices-game";
const GAME_EVENT = "zz:voices-game";

export function voicesInGameOn(): boolean {
  try { return localStorage.getItem(GAME_KEY) !== "0"; } catch { return true; }
}
export function setVoicesInGame(on: boolean): void {
  try { localStorage.setItem(GAME_KEY, on ? "1" : "0"); } catch { /* indispo */ }
  window.dispatchEvent(new Event(GAME_EVENT));
}
export function useVoicesInGame(): boolean {
  return useSyncExternalStore(
    (cb) => { window.addEventListener(GAME_EVENT, cb); return () => window.removeEventListener(GAME_EVENT, cb); },
    voicesInGameOn,
    () => true,
  );
}

/** Id du son d'un perso de la bande (réactif), ou null (pas de son, ou voix reçue coupée). */
export function usePersoVoice(name?: string | null): string | null {
  return useSyncExternalStore(subscribePlayers, () => (name ? getVoiceFor(name) : null), () => null);
}

/* ───────── Enregistrement ───────── */
export function recordSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

function pickMime(): string | undefined {
  const c = ["audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"];
  try {
    return c.find((m) => MediaRecorder.isTypeSupported?.(m));
  } catch {
    return undefined;
  }
}

const AC = () => (typeof window === "undefined" ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

/** Ouvre puis referme le micro tout de suite : déclenche la demande d'autorisation hors enregistrement. */
export async function warmUpMic(): Promise<RecError | null> {
  if (!recordSupported()) return "unavailable";
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach((t) => t.stop());
    return null;
  } catch (e) {
    return micErr(e);
  }
}

function micErr(e: unknown): RecError {
  const n = (e as { name?: string })?.name;
  return n === "NotAllowedError" || n === "SecurityError" ? "denied" : "unavailable";
}

/**
 * Un enregistrement « maintenir pour parler ».
 * start() (dans le geste) → level() pour la jauge → stop() rend le son prêt à stocker.
 * `onLimit` est appelé quand les 5 s sont atteintes (l'appelant fait alors stop()).
 */
export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private t0 = 0;
  private ctx: AudioContext | null = null;
  private an: AnalyserNode | null = null;
  private buf: Float32Array<ArrayBuffer> | null = null;
  private limit: ReturnType<typeof setTimeout> | undefined;
  private cancelled = false;

  constructor(private onLimit?: () => void) {}

  /** Le micro est ouvert et l'enregistrement a commencé. */
  get started(): boolean {
    return this.rec !== null;
  }

  async start(): Promise<void> {
    if (!recordSupported()) throw "unavailable" as RecError;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      throw micErr(e);
    }
    if (this.cancelled) { stream.getTracks().forEach((t) => t.stop()); throw "short" as RecError; }
    this.stream = stream;
    const mime = pickMime();
    try {
      this.rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 64000 });
    } catch {
      try { this.rec = new MediaRecorder(stream); } catch { this.release(); throw "unavailable" as RecError; }
    }
    this.rec.ondataavailable = (e) => { if (e.data && e.data.size) this.chunks.push(e.data); };
    this.rec.start();
    this.t0 = performance.now();
    this.limit = setTimeout(() => this.onLimit?.(), VOICE_MAX_S * 1000);
    // Jauge de niveau (affichage seulement : rien n'est relié aux haut-parleurs)
    try {
      const C = AC();
      if (C) {
        const ctx = new C();
        const an = ctx.createAnalyser();
        an.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(an);
        this.ctx = ctx;
        this.an = an;
        this.buf = new Float32Array(an.fftSize);
      }
    } catch { /* jauge facultative */ }
  }

  /** Secondes écoulées depuis le début. */
  elapsed(): number {
    return this.t0 ? (performance.now() - this.t0) / 1000 : 0;
  }

  /** Niveau 0..1 (jauge). */
  level(): number {
    if (!this.an || !this.buf) return 0;
    this.an.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const db = 20 * Math.log10(Math.sqrt(sum / this.buf.length) || 1e-9);
    return Math.max(0, Math.min(1, (db + 60) / 50));
  }

  /** Termine et rend le son (id neuf, pas encore stocké). */
  async stop(): Promise<VoiceClip> {
    const rec = this.rec;
    const elapsed = this.elapsed();
    if (!rec) { this.release(); throw "short" as RecError; }
    const done = new Promise<void>((res) => { rec.onstop = () => res(); });
    try { if (rec.state !== "inactive") rec.stop(); } catch { /* déjà arrêté */ }
    await Promise.race([done, new Promise((r) => setTimeout(r, 1500))]);
    this.release();
    if (elapsed < 0.4) throw "short" as RecError;
    const type = rec.mimeType || this.chunks[0]?.type || "audio/mp4";
    const blob = new Blob(this.chunks, { type });
    if (!blob.size) throw "failed" as RecError;
    if (blob.size > VOICE_MAX_BYTES) throw "big" as RecError;
    const data = await blob.arrayBuffer();
    const { dur, gain } = await analyse(data, Math.min(elapsed, VOICE_MAX_S));
    return { id: newVoiceId(), mime: baseMime(type) ?? "audio/mp4", dur, gain, data };
  }

  /** Abandonne (doigt glissé hors du bouton, écran fermé…). */
  cancel() {
    this.cancelled = true;
    try { if (this.rec && this.rec.state !== "inactive") this.rec.stop(); } catch { /* ignore */ }
    this.release();
  }

  private release() {
    clearTimeout(this.limit);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.an = null;
    this.buf = null;
    const c = this.ctx;
    this.ctx = null;
    if (c && c.state !== "closed") void c.close().catch(() => {});
  }
}

/** Durée réelle + gain de normalisation (cible : voix bien audible sans saturer). */
async function analyse(data: ArrayBuffer, fallbackDur: number): Promise<{ dur: number; gain: number }> {
  try {
    const out = sfxOutput();
    let audio: AudioBuffer;
    if (out) audio = await out.ctx.decodeAudioData(data.slice(0));
    else {
      const O = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      audio = await new O(1, 1, 44100).decodeAudioData(data.slice(0));
    }
    const ch = audio.getChannelData(0);
    let peak = 0, sum = 0;
    for (let i = 0; i < ch.length; i++) { const v = Math.abs(ch[i]); if (v > peak) peak = v; sum += v * v; }
    const rms = Math.sqrt(sum / Math.max(1, ch.length));
    const gain = peak > 0.001 ? Math.max(0.5, Math.min(5, 0.9 / peak, 0.16 / Math.max(rms, 0.004))) : 1;
    return { dur: Math.min(VOICE_MAX_S, Math.round(audio.duration * 100) / 100), gain: Math.round(gain * 100) / 100 };
  } catch {
    return { dur: Math.round(fallbackDur * 100) / 100, gain: 1 };
  }
}

/* ───────── « Qui parle ? » (bouche animée) ───────── */
type Speaking = { key: string; level: 0 | 1 | 2 } | null;
let speaking: Speaking = null;
const speakers = new Set<() => void>();

function setSpeaking(s: Speaking) {
  if (s?.key === speaking?.key && s?.level === speaking?.level) return;
  speaking = s;
  speakers.forEach((l) => l());
}

/** Ouverture de la bouche de ce perso pendant qu'il parle (0..2), sinon null. */
export function useSpeaking(key?: string | null): 0 | 1 | 2 | null {
  return useSyncExternalStore(
    (cb) => { speakers.add(cb); return () => { speakers.delete(cb); }; },
    () => (key && speaking?.key === key ? speaking.level : null),
    () => null,
  );
}

/** Humeur (bouche) du blob selon l'ouverture. */
export function talkMood(level: 0 | 1 | 2): MascotMood {
  return level === 2 ? "laughing" : level === 1 ? "shocked" : "neutral";
}

/* ───────── Lecture ───────── */
const decoded = new WeakMap<ArrayBuffer, AudioBuffer>();
let current: { stop: () => void } | null = null;

/** Coupe la voix en cours. */
export function stopVoice() {
  current?.stop();
  current = null;
}

/**
 * Joue un son (une fois). Respecte la coupure du son global.
 * Résout true si la lecture a démarré.
 */
export async function playClip(key: string, clip: Pick<VoiceClip, "data" | "gain">, { volume = 0.9 }: { volume?: number } = {}): Promise<boolean> {
  const out = sfxOutput();
  if (!out) return false;
  const { ctx, master } = out;
  stopVoice();
  let ended = false;
  const token = { stop: () => { ended = true; } };
  current = token;
  let buf = decoded.get(clip.data);
  if (!buf) {
    try {
      buf = await ctx.decodeAudioData(clip.data.slice(0));
      decoded.set(clip.data, buf);
    } catch {
      if (current === token) current = null;
      return false;
    }
  }
  if (ended || current !== token) return false;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = Math.max(0, Math.min(5, clip.gain || 1)) * Math.max(0, Math.min(1, volume));
  const an = ctx.createAnalyser();
  an.fftSize = 512;
  src.connect(g).connect(an).connect(master);
  const data = new Float32Array(an.fftSize);
  let raf = 0;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    ended = true;
    cancelAnimationFrame(raf);
    raf = 0;
    try { src.stop(); } catch { /* déjà fini */ }
    try { src.disconnect(); an.disconnect(); } catch { /* ignore */ }
    if (speaking?.key === key) setSpeaking(null);
    if (current === token) current = null;
  };
  token.stop = finish;
  src.onended = finish;
  // Jamais plus de 5 s (un fichier reçu peut mentir sur sa durée)
  src.start(ctx.currentTime, 0, VOICE_MAX_S + 0.3);
  setSpeaking({ key, level: 1 });
  // Signal « une voix démarre » (tests, et pour qui voudrait baisser la musique)
  window.dispatchEvent(new CustomEvent("zz:voice-play", { detail: { key, dur: buf.duration } }));
  const tick = () => {
    if (ended) return;
    an.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    setSpeaking({ key, level: rms > 0.12 ? 2 : rms > 0.035 ? 1 : 0 });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return true;
}

/**
 * Fait parler un perso de la bande (s'il a un son et que sa voix n'est pas coupée).
 * `auto` = déclenché par le jeu (tour d'un joueur, gagnant) : respecte le réglage
 * « Voix des persos en jeu » et joue moins fort.
 */
export async function playPersoVoice(name: string, { auto = false }: { auto?: boolean } = {}): Promise<boolean> {
  if (auto && !voicesInGameOn()) return false;
  const id = getVoiceFor(name);
  if (!id) return false;
  const clip = await getVoice(id);
  if (!clip) return false;
  return playClip(voiceKey(name), clip, { volume: auto ? 0.7 : 0.95 });
}
