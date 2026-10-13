/**
 * Sons de Zinzin / du site : vrais samples (Kenney, CC0) dans /sfx/*.m4a,
 * joués via Web Audio (préchargés, latence quasi nulle, superposables).
 * Remplace les bips synthétisés. Coupure globale persistée (clé zz-sound).
 *
 * Usage : playSfx("success"), playSfx("boom", { volume: 0.8 }), playCombo("explosion").
 */

export type SfxName =
  | "tap" | "tap2" | "select" | "toggle" | "back" | "open" | "close"
  | "confirm" | "success" | "error" | "wrong" | "question"
  | "pop" | "pop2" | "ding" | "ding2" | "gong" | "tick" | "tock" | "scratch" | "pluck" | "pluck2"
  | "whoosh" | "whooshdown"
  | "card-place" | "card-slide" | "card-shuffle" | "card-fan" | "card-flip"
  | "dice-shake" | "dice-throw" | "coin" | "coins"
  | "boom" | "thump" | "bell" | "clink" | "glass" | "plate"
  | "powerup" | "win" | "rise" | "lose" | "pep" | "levelup" | "twotone";

/** Sons composés (plusieurs samples superposés / enchaînés). */
export type SfxCombo = "explosion" | "fanfare" | "drumroll" | "fail" | "reveal" | "countdown";

const MUTE_KEY = "zz-sound";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<SfxName, AudioBuffer>();
const loading = new Map<SfxName, Promise<AudioBuffer | null>>();
const listeners = new Set<() => void>();

let muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === "off"; } catch { return false; }
})();

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// iOS : le contexte audio ne démarre qu'après un geste → on le réveille au premier toucher
if (typeof window !== "undefined") {
  const unlock = () => { audio(); window.removeEventListener("pointerdown", unlock); };
  window.addEventListener("pointerdown", unlock, { passive: true });
}

function load(name: SfxName): Promise<AudioBuffer | null> {
  const ready = buffers.get(name);
  if (ready) return Promise.resolve(ready);
  const pending = loading.get(name);
  if (pending) return pending;
  const ac = audio();
  if (!ac) return Promise.resolve(null);
  const p = fetch(`/sfx/${name}.m4a`)
    .then((r) => r.arrayBuffer())
    .then((data) => ac.decodeAudioData(data))
    .then((buf) => { buffers.set(name, buf); return buf; })
    .catch(() => null);
  loading.set(name, p);
  return p;
}

/** Précharge des sons (à appeler au montage d'un jeu pour éviter la latence du 1er son). */
export function preloadSfx(names: SfxName[]) {
  names.forEach((n) => void load(n));
}

export interface SfxOptions {
  /** 0..1 (défaut 1) */
  volume?: number;
  /** vitesse/hauteur (défaut 1 ; 1.2 = plus aigu) */
  rate?: number;
  /** délai en secondes */
  delay?: number;
}

export function playSfx(name: SfxName, { volume = 1, rate = 1, delay = 0 }: SfxOptions = {}) {
  if (muted) return;
  const ac = audio();
  if (!ac || !master) return;
  void load(name).then((buf) => {
    if (!buf || !ctx || !master) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = Math.max(0, Math.min(1.5, volume));
    src.connect(g).connect(master);
    src.start(ctx.currentTime + delay);
  });
}

/** Sons composés, pour les grands moments. */
export function playCombo(combo: SfxCombo) {
  switch (combo) {
    case "explosion":
      playSfx("boom", { volume: 1.2, rate: 0.7 });
      playSfx("plate", { volume: 0.8, rate: 0.6 });
      playSfx("thump", { volume: 1, rate: 0.5, delay: 0.03 });
      playSfx("whooshdown", { volume: 0.5, rate: 0.8, delay: 0.05 });
      break;
    case "fanfare":
      playSfx("win", { volume: 0.9 });
      playSfx("powerup", { volume: 0.6, delay: 0.12 });
      playSfx("ding", { volume: 0.7, rate: 1.25, delay: 0.32 });
      break;
    case "drumroll":
      for (let i = 0; i < 14; i++) playSfx("tock", { volume: 0.35 + i * 0.03, rate: 0.75, delay: i * 0.07 });
      break;
    case "fail":
      playSfx("wrong", { volume: 0.9 });
      playSfx("lose", { volume: 0.6, delay: 0.08 });
      break;
    case "reveal":
      playSfx("whoosh", { volume: 0.6 });
      playSfx("gong", { volume: 0.8, delay: 0.12 });
      break;
    case "countdown":
      playSfx("tick", { volume: 0.8 });
      break;
  }
}

export function isSfxMuted() {
  return muted;
}

export function setSfxMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem(MUTE_KEY, v ? "off" : "on"); } catch { /* indispo */ }
  listeners.forEach((l) => l());
}

/** Pour les boutons son : se réabonner aux changements (React useSyncExternalStore). */
export function subscribeSfxMuted(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
