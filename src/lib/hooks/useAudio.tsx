"use client";

/**
 * useAudio — fournisseur audio du site : musique d'ambiance + sons d'interface.
 *
 * Les sons (clics, succès, échec) sont de vrais samples joués par src/lib/sfx.ts,
 * et la coupure du son est CELLE de sfx.ts (une seule coupure pour tout le site
 * et l'app Zinzin). Sans Provider (app Zinzin), `useAudio()` renvoie quand même
 * l'état de coupure global, pour que les jeux le respectent.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { isSfxMuted, playCombo, playSfx, setSfxMuted, subscribeSfxMuted, type SfxName } from "@/lib/sfx";

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

// Clic → sample (volume bas : ça sonne sur chaque bouton)
const CLICK_SFX: Record<ClickVariant, { name: SfxName; volume: number }> = {
  tap: { name: "tap", volume: 0.35 },
  primary: { name: "select", volume: 0.45 },
  back: { name: "back", volume: 0.4 },
  pill: { name: "toggle", volume: 0.35 },
};

const useSfxMutedState = () => useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);

/** Ancienne clé de coupure du site : reprise une fois vers sfx.ts. */
function migrateLegacyMute() {
  if (typeof window === "undefined") return;
  try {
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (legacy === null) return;
    if (localStorage.getItem("zz-sound") === null && JSON.parse(legacy) === true) setSfxMuted(true);
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* indispo */ }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const muted = useSfxMutedState();
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);
  const runningRef = useRef(false);
  const beatRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Reprise de l'ancienne préférence du site
  useEffect(() => { migrateLegacyMute(); }, []);

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
    ctxRef.current = ctx;
    masterRef.current = master;
    musicRef.current = music;
    return ctx;
  }, [muted]);

  // Sons d'interface : samples via sfx.ts (qui gère lui-même la coupure)
  const playClick = useCallback((variant: ClickVariant = "tap") => {
    const c = CLICK_SFX[variant];
    playSfx(c.name, { volume: c.volume });
  }, []);

  const playSuccess = useCallback(() => { playSfx("success", { volume: 0.8 }); }, []);

  const playFail = useCallback(() => { playCombo("fail"); }, []);

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

  const setMuted = useCallback((next: boolean) => { setSfxMuted(next); }, []);

  // La musique suit la coupure globale (qu'elle vienne d'ici ou d'un jeu)
  useEffect(() => {
    const master = masterRef.current; const ctx = ctxRef.current;
    if (master && ctx) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.55, now + 0.25);
    }
    if (muted) stopMusic();
    else if (startedRef.current) startMusic();
  }, [muted, startMusic, stopMusic]);

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

// Sans Provider (app Zinzin…) : coupure globale de sfx.ts + sons en samples
const NO_PROVIDER = {
  setMuted: (v: boolean) => setSfxMuted(v),
  toggleMute: () => setSfxMuted(!isSfxMuted()),
  playClick: (v: ClickVariant = "tap") => playSfx(CLICK_SFX[v].name, { volume: CLICK_SFX[v].volume }),
  playSuccess: () => playSfx("success", { volume: 0.8 }),
  playFail: () => playCombo("fail"),
};

export function useAudio(): AudioCtxValue {
  const ctx = useContext(AudioContext);
  const muted = useSfxMutedState();
  if (!ctx) return { muted, ...NO_PROVIDER };
  return ctx;
}
