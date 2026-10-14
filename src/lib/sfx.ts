/**
 * Sons de Zinzin / du site : vrais bruitages (CC0 / domaine public, voir public/sfx/CREDITS.txt)
 * dans /sfx/*.m4a, joués via Web Audio (préchargés, latence quasi nulle, superposables).
 * Coupure globale persistée (clé zz-sound).
 *
 * Usage : playSfx("success"), playSfx("explosion", { volume: 0.8 }), playCombo("fanfare"),
 * const stop = playLoop("fuse", { volume: 0.5 }) … stop().
 */

export type SfxName =
  // interface
  | "tap" | "tap2" | "select" | "toggle" | "back" | "open" | "close"
  | "confirm" | "success" | "error" | "wrong" | "question"
  | "pop" | "pop2" | "ding" | "ding2" | "gong" | "tick" | "tock" | "scratch" | "pluck" | "pluck2"
  | "whoosh" | "whooshdown"
  // interface de l'app, style « blob » (bloop2 = petit choix, toucher un jeu/perso = pop : voir ui-sfx.ts)
  | "bloop2"
  // objets
  | "card-place" | "card-slide" | "card-shuffle" | "card-fan" | "card-flip"
  | "dice-shake" | "dice-throw" | "coin" | "coins"
  | "boom" | "thump" | "bell" | "clink" | "glass" | "plate"
  | "powerup" | "win" | "rise" | "lose" | "pep" | "levelup" | "twotone"
  // bombe à retardement
  | "bomb-tick" | "bomb-tock" | "fuse" | "detonator-beep" | "explosion" | "firecracker"
  // ambiance soirée / plateau télé
  | "applause" | "crowd-cheer" | "crowd-aww" | "drumroll" | "drumroll-end" | "tada" | "cymbal"
  | "buzzer" | "correct" | "heartbeat" | "whistle" | "chime" | "laugh"
  // liquides (pour et fizz bouclables : playLoop)
  | "pour" | "glug" | "splash" | "fizz";

/** Sons composés (plusieurs samples superposés / enchaînés). */
export type SfxCombo = "explosion" | "fanfare" | "drumroll" | "fail" | "reveal" | "countdown";

/** Noms historiques qui pointent vers un bruitage partagé (un seul fichier, un seul buffer). */
const ALIASES: Partial<Record<SfxName, SfxName>> = {
  success: "correct",
  wrong: "buzzer",
  question: "pop2",
  powerup: "chime",
  win: "tada",
  levelup: "tada",
  lose: "crowd-aww",
};

const MUTE_KEY = "zz-sound";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<SfxName, AudioBuffer>();
const loading = new Map<SfxName, Promise<AudioBuffer | null>>();
const listeners = new Set<() => void>();
const activeLoops = new Set<LoopHandle>();

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

function fileOf(name: SfxName): SfxName {
  return ALIASES[name] ?? name;
}

function load(name: SfxName): Promise<AudioBuffer | null> {
  const file = fileOf(name);
  const ready = buffers.get(file);
  if (ready) return Promise.resolve(ready);
  const pending = loading.get(file);
  if (pending) return pending;
  const ac = audio();
  if (!ac) return Promise.resolve(null);
  const p = fetch(`/sfx/${file}.m4a`)
    .then((r) => r.arrayBuffer())
    .then((data) => ac.decodeAudioData(data))
    .then((buf) => { buffers.set(file, buf); return buf; })
    .catch(() => { loading.delete(file); return null; });
  loading.set(file, p);
  return p;
}

/** Samples des sons composés (playCombo) : préchargés avec n'importe quel jeu, pour que la fanfare,
 * le roulement ou l'échec ne partent pas en retard la première fois. */
const COMBO_SFX: SfxName[] = ["tada", "applause", "buzzer", "crowd-aww", "whoosh", "gong", "drumroll", "drumroll-end"];

/** Précharge des sons (à appeler au montage d'un jeu pour éviter la latence du 1er son). */
export function preloadSfx(names: SfxName[]) {
  [...names, ...COMBO_SFX].forEach((n) => void load(n));
}

export interface SfxOptions {
  /** 0..1 (défaut 1) */
  volume?: number;
  /** vitesse/hauteur (défaut 1 ; 1.2 = plus aigu) */
  rate?: number;
  /** délai en secondes */
  delay?: number;
}

interface PlayOptions extends SfxOptions {
  /** durée max jouée (s), coupée en fondu */
  duration?: number;
  /** volume de départ (crescendo jusqu'à `volume` sur toute la durée) */
  fromVolume?: number;
}

const clampVol = (v: number) => Math.max(0, Math.min(1.5, v));

function play(name: SfxName, { volume = 1, rate = 1, delay = 0, duration, fromVolume }: PlayOptions = {}) {
  if (muted) return;
  const ac = audio();
  if (!ac || !master) return;
  const asked = ac.currentTime;
  void load(name).then((buf) => {
    if (!buf || !ctx || !master || muted) return;
    // Si le décodage a pris du temps, on garde le rendez-vous prévu (sans repartir dans le passé)
    const at = Math.max(ctx.currentTime, asked + delay);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    const v = clampVol(volume);
    src.connect(g).connect(master);
    if (duration) {
      // crescendo éventuel, puis coupure en fondu court à la fin
      const end = at + duration;
      const fadeAt = Math.max(at, end - 0.04);
      g.gain.setValueAtTime(fromVolume != null ? clampVol(fromVolume) : v, at);
      g.gain.linearRampToValueAtTime(v, fadeAt);
      g.gain.linearRampToValueAtTime(0, end);
      src.start(at, 0, duration * rate + 0.01);
    } else {
      g.gain.value = v;
      src.start(at);
    }
  });
}

export function playSfx(name: SfxName, opts: SfxOptions = {}) {
  play(name, opts);
}

export interface LoopOptions {
  /** 0..1 (défaut 1) */
  volume?: number;
  /** vitesse/hauteur (défaut 1) */
  rate?: number;
  /** fondu d'entrée en secondes (défaut 0.25) */
  fadeIn?: number;
}

/** Arrête la boucle (fondu de sortie, défaut 0.15 s). Peut être appelé plusieurs fois. */
export interface LoopHandle {
  (fadeOut?: number): void;
  /** change la vitesse/hauteur en douceur */
  setRate: (rate: number) => void;
  /** change le volume en douceur (0..1) */
  setVolume: (volume: number) => void;
}

/**
 * Joue un son en boucle (ex. la mèche) jusqu'à l'appel de la fonction renvoyée.
 * Si le son est coupé (bouton son), la boucle s'arrête ; renvoie un arrêt sans effet si le son est déjà coupé.
 */
export function playLoop(name: SfxName, { volume = 1, rate = 1, fadeIn = 0.25 }: LoopOptions = {}): LoopHandle {
  let stopped = false;
  let src: AudioBufferSourceNode | null = null;
  let gain: GainNode | null = null;
  let curRate = rate;
  let curVol = clampVol(volume);

  const stop = ((fadeOut = 0.15) => {
    if (stopped) return;
    stopped = true;
    activeLoops.delete(stop);
    if (!src || !gain || !ctx) return;
    const t = ctx.currentTime;
    const f = Math.max(0.01, fadeOut);
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + f);
    const s = src;
    try { s.stop(t + f + 0.02); } catch { /* déjà arrêtée */ }
    s.onended = () => { try { s.disconnect(); } catch { /* ignore */ } };
  }) as LoopHandle;
  stop.setRate = (r: number) => {
    curRate = r;
    if (src && ctx) src.playbackRate.setTargetAtTime(r, ctx.currentTime, 0.08);
  };
  stop.setVolume = (v: number) => {
    curVol = clampVol(v);
    if (gain && ctx && !stopped) gain.gain.setTargetAtTime(curVol, ctx.currentTime, 0.08);
  };

  if (muted) { stopped = true; return stop; }
  const ac = audio();
  if (!ac || !master) { stopped = true; return stop; }
  activeLoops.add(stop);
  void load(name).then((buf) => {
    if (!buf || !ctx || !master || stopped || muted) { stop(); return; }
    src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.playbackRate.value = curRate;
    gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(curVol, t + Math.max(0.01, fadeIn));
    src.connect(gain).connect(master);
    // départ à un endroit au hasard : deux manches ne sonnent pas pareil
    src.start(t, Math.random() * buf.duration * 0.9);
  });
  return stop;
}

/** Coupe toutes les boucles en cours (changement de jeu, son coupé…). */
export function stopAllLoops(fadeOut = 0.1) {
  [...activeLoops].forEach((s) => s(fadeOut));
}

/** Roulement de tambour réel, en crescendo, qui s'arrête net au bout de `seconds`. */
function drumroll(seconds: number) {
  const body = Math.max(0.3, Math.min(2.3, seconds - 0.25));
  play("drumroll", { volume: 0.95, fromVolume: 0.35, duration: body + 0.03 });
  play("drumroll-end", { volume: 0.95, delay: body - 0.02 });
}

export interface ComboOptions {
  /** durée du roulement (s), défaut 1,05 s (la révélation tombe juste après) */
  duration?: number;
}

/** Sons composés, pour les grands moments. */
export function playCombo(combo: SfxCombo, { duration }: ComboOptions = {}) {
  switch (combo) {
    case "explosion":
      playSfx("explosion", { volume: 1 });
      break;
    case "fanfare":
      playSfx("tada", { volume: 0.9 });
      playSfx("applause", { volume: 0.6, delay: 0.35 });
      break;
    case "drumroll":
      drumroll(duration ?? 1.05);
      break;
    case "fail":
      playSfx("buzzer", { volume: 0.75 });
      playSfx("crowd-aww", { volume: 0.6, delay: 0.3 });
      break;
    case "reveal":
      playSfx("whoosh", { volume: 0.6 });
      playSfx("gong", { volume: 0.8, delay: 0.1 });
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
  if (v) stopAllLoops();
  listeners.forEach((l) => l());
}

/** Pour les boutons son : se réabonner aux changements (React useSyncExternalStore). */
export function subscribeSfxMuted(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/**
 * Sortie Web Audio partagée (contexte + volume général), pour les lecteurs annexes
 * (voix des persos) : même contexte réveillé au premier toucher, même coupure.
 * null si le son est coupé ou Web Audio indisponible.
 */
export function sfxOutput(): { ctx: AudioContext; master: GainNode } | null {
  if (muted) return null;
  const ac = audio();
  return ac && master ? { ctx: ac, master } : null;
}
