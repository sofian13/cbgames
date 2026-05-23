"use client";

/**
 * useAudio — Web Audio engine: ambient lofi music + UI click sounds.
 *
 * Wired as a Provider at the app root (see `<AudioProvider>` in layout).
 * Buttons get clicks for free via document-level click capture, but you
 * can also play specific FX with the returned helpers.
 *
 * TODO :
 *   - Si tu veux remplacer la musique synthétisée par un vrai loop MP3,
 *     ajoute un <audio> tag dans le provider et mappe `setMuted` dessus.
 *   - Tu peux aussi exposer un volume slider sur la page profil.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ClickVariant = "tap" | "primary" | "back" | "pill";

interface AudioCtxValue {
  muted: boolean;
  setMuted: (v: boolean) => void;
  toggleMute: () => void;
  playClick: (v?: ClickVariant) => void;
  playSuccess: () => void;
  playFail: () => void;
}

const AudioContext = createContext<AudioCtxValue | null>(null);

const STORAGE_KEY = "afgames-muted";
const TEMPO = 84;
const BEAT_MS = (60 / TEMPO) * 1000;

const PROG: number[][] = [
  [220.00, 261.63, 329.63],   // Am
  [174.61, 220.00, 261.63],   // F
  [261.63, 329.63, 392.00],   // C
  [196.00, 246.94, 293.66],   // G
];
const SPARKLES = [880, 987.77, 1174.66, 1318.51];

interface ClickProfile {
  freq0: number; freq1: number; type: OscillatorType;
  dur: number; gain: number; cutoff: number;
}

const CLICK_MAP: Record<ClickVariant, ClickProfile> = {
  tap:     { freq0: 760, freq1: 300, type: "square",   dur: 0.07, gain: 0.15, cutoff: 2400 },
  primary: { freq0: 540, freq1: 200, type: "triangle", dur: 0.12, gain: 0.22, cutoff: 2000 },
  back:    { freq0: 320, freq1: 180, type: "sine",     dur: 0.10, gain: 0.18, cutoff: 1400 },
  pill:    { freq0: 900, freq1: 600, type: "sine",     dur: 0.06, gain: 0.12, cutoff: 3000 },
};

function readMuted(): boolean {
  if (typeof window === "undefined") return false;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "false"); } catch { return false; }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMutedState] = useState<boolean>(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicRef = useRef<GainNode | null>(null);
  const fxRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);
  const runningRef = useRef(false);
  const beatRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Hydrate from storage on mount
  useEffect(() => {
    setMutedState(readMuted());
  }, []);

  const ensureCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    if (typeof window === "undefined") return null;
    const AC: typeof window.AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    const music = ctx.createGain();
    music.gain.value = 0.22;
    music.connect(master);
    const fx = ctx.createGain();
    fx.gain.value = 0.85;
    fx.connect(master);
    ctxRef.current = ctx;
    masterRef.current = master;
    musicRef.current = music;
    fxRef.current = fx;
    return ctx;
  }, [muted]);

  const playClick = useCallback((variant: ClickVariant = "tap") => {
    const ctx = ensureCtx();
    const fx = fxRef.current;
    if (!ctx || !fx) return;
    const cfg = CLICK_MAP[variant];
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.freq0, t);
    osc.frequency.exponentialRampToValueAtTime(cfg.freq1, t + cfg.dur);
    filter.frequency.value = cfg.cutoff;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(cfg.gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, t + cfg.dur);
    osc.connect(filter); filter.connect(g); g.connect(fx);
    osc.start(t); osc.stop(t + cfg.dur + 0.02);
  }, [ensureCtx]);

  const playSuccess = useCallback(() => {
    const ctx = ensureCtx();
    const fx = fxRef.current;
    if (!ctx || !fx) return;
    const t0 = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      const t = t0 + i * 0.08;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle"; osc.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.5);
      osc.connect(g); g.connect(fx);
      osc.start(t); osc.stop(t + 0.55);
    });
  }, [ensureCtx]);

  const playFail = useCallback(() => {
    const ctx = ensureCtx();
    const fx = fxRef.current;
    if (!ctx || !fx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.4);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.4);
    osc.connect(g); g.connect(fx);
    osc.start(t); osc.stop(t + 0.42);
  }, [ensureCtx]);

  const noteVoice = useCallback((freq: number, dur: number, gain = 0.1, type: OscillatorType = "sine", cutoff = 1200) => {
    const ctx = ctxRef.current; const music = musicRef.current;
    if (!ctx || !music) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = cutoff;
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(f); f.connect(g); g.connect(music);
    osc.start(t); osc.stop(t + dur + 0.05);
  }, []);

  const stopMusic = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const musicStep = useCallback(() => {
    if (!runningRef.current) return;
    const beat = 60 / TEMPO;
    const chord = PROG[Math.floor(beatRef.current / 4) % PROG.length];
    const arp = chord[beatRef.current % chord.length] * 2;
    noteVoice(arp, beat * 0.9, 0.08, "sine", 1600);
    if (beatRef.current % 4 === 0) {
      noteVoice(chord[0] / 2, beat * 4, 0.07, "triangle", 600);
      noteVoice(chord[1], beat * 4, 0.05, "sine", 800);
    }
    if (beatRef.current % 16 === 12) {
      const sp = SPARKLES[Math.floor(Math.random() * SPARKLES.length)];
      noteVoice(sp, beat * 1.5, 0.06, "sine", 3000);
    }
    beatRef.current += 1;
    timerRef.current = window.setTimeout(musicStep, BEAT_MS);
  }, [noteVoice]);

  const startMusic = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (runningRef.current) return;
    runningRef.current = true;
    beatRef.current = 0;
    if (ctx.state === "suspended") void ctx.resume();
    musicStep();
  }, [ensureCtx, musicStep]);

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    const master = masterRef.current; const ctx = ctxRef.current;
    if (master && ctx) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(next ? 0 : 0.55, now + 0.25);
    }
    if (next) stopMusic();
    else if (startedRef.current) startMusic();
  }, [startMusic, stopMusic]);

  const toggleMute = useCallback(() => setMuted(!muted), [muted, setMuted]);

  // Global click capture — clicks on buttons/links play FX, and bootstrap
  // music on the first user gesture (browser autoplay policy).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!startedRef.current) {
        startedRef.current = true;
        const ctx = ensureCtx();
        if (ctx && ctx.state === "suspended") void ctx.resume();
        if (!muted) startMusic();
      }
      const target = (event.target as HTMLElement | null)?.closest(
        "button, a, [data-af-click], .af-btn, .af-chip"
      );
      if (!target) return;
      if (target.matches("input, textarea, select")) return;
      let variant: ClickVariant = "tap";
      if (target.matches(".af-btn-primary, .af-btn-pink, [data-af-variant='primary']")) variant = "primary";
      else if (target.matches(".af-chip, [data-af-variant='pill']")) variant = "pill";
      else if (target.matches("[data-af-variant='back']")) variant = "back";
      playClick(variant);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [ensureCtx, muted, playClick, startMusic]);

  const value = useMemo<AudioCtxValue>(() => ({
    muted, setMuted, toggleMute, playClick, playSuccess, playFail,
  }), [muted, setMuted, toggleMute, playClick, playSuccess, playFail]);

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioCtxValue {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    // Safe no-op if provider isn't mounted (avoids crashes in storybook etc.)
    return {
      muted: false,
      setMuted: () => {},
      toggleMute: () => {},
      playClick: () => {},
      playSuccess: () => {},
      playFail: () => {},
    };
  }
  return ctx;
}
