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
  | "buzzer" | "correct" | "heartbeat" | "whistle" | "chime"
  // jingle de lancement (écran des blobs qui tombent)
  | "jingle" | "laugh"
  // intro d'Halloween : orgue « Toccata » (Bach, domaine public) synthétisé maison, voir tools/sfx/spooky-synth.py
  | "spooky"
  // easter eggs d'Halloween (synthétisés maison, tools/sfx/halloween-synth.py) : fantôme, crapaud du sort
  | "ghost-boo" | "croak"
  // gifle du perso dans l'éditeur : 3 vraies gifles enregistrées (CC0, voir CREDITS)
  | "slap" | "slap2" | "slap3"
  // boule à facettes de l'accueil : petite boucle disco composée maison (tools/sfx/disco-synth.py)
  | "disco"
  // liquides (pour et fizz bouclables : playLoop)
  | "pour" | "glug" | "splash" | "fizz"
  // élastique (blob tiré de l'accueil) : grincement bouclable pendant le tirage, claquement au lâcher
  | "elastic-stretch" | "elastic-snap";

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
/** Boucles en cours → leur relance sur le contexte courant (après une reconstruction). */
const activeLoops = new Map<LoopHandle, () => void>();
/** Lecteurs annexes (voix des persos) prévenus quand le contexte partagé est remplacé. */
const ctxListeners = new Set<() => void>();

let muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === "off"; } catch { return false; }
})();

/* iOS : après une interruption (appel, Siri, alarme, micro, écran verrouillé, casque débranché), le contexte
 * peut rester « interrupted »/« suspended » et resume() ne suffit plus, ou se dire « running » alors que son
 * horloge est figée (plus rien ne sort) : plus aucun son jusqu'au redémarrage de l'app.
 * On le marque alors « bloqué » et on le recrée (les AudioBuffer décodés restent valables d'un contexte à
 * l'autre ; les boucles en cours repartent toutes seules sur le nouveau). */
let stuck = false;
let checkTimer: ReturnType<typeof setTimeout> | undefined;
let lastRebuild = 0;

function create(): AudioContext | null {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  let ac: AudioContext;
  try { ac = new AC(); } catch { return null; }
  ctx = ac;
  master = ac.createGain();
  master.gain.value = 0.9;
  master.connect(ac.destination);
  // Reparti tout seul (fin d'appel…) : plus besoin de le recréer
  ac.addEventListener("statechange", () => { if (ctx === ac && ac.state === "running") stuck = false; });
  // Les boucles qui jouaient sur l'ancien contexte reprennent sur celui-ci
  activeLoops.forEach((revive) => revive());
  return ac;
}

/** Remplace le contexte (bloqué ou fermé) par un neuf. Le bouton son coupé reste respecté (rien ne rejoue). */
function rebuild() {
  const old = ctx;
  ctx = null;
  master = null;
  stuck = false;
  clearTimeout(checkTimer);
  checkTimer = undefined;
  lastRebuild = Date.now();
  if (old && old.state !== "closed") void old.close().catch(() => {});
  ctxListeners.forEach((l) => l());
  if (typeof window !== "undefined") create();
}

/**
 * Relance le contexte s'il dort ; `probe` : vérifie aussi qu'il tourne VRAIMENT (horloge qui avance),
 * après un retour au premier plan, une fin d'interruption ou de micro. Sinon, on le recrée.
 */
function wake(ac: AudioContext, probe = false) {
  if (ac.state !== "running") void ac.resume().catch(() => {});
  else if (!probe) return;
  if (!checkTimer) check(ac, ac.currentTime, 600, true); // sinon une vérification est déjà en cours
}

function check(ac: AudioContext, t0: number, ms: number, retry: boolean) {
  checkTimer = setTimeout(() => {
    checkTimer = undefined;
    if (ctx !== ac || document.hidden) return; // en arrière-plan : on revérifiera au retour
    if (ac.state === "running") {
      if (ac.currentTime - t0 > 0.1) { stuck = false; return; }
      // vient peut-être juste de repartir : on remesure l'horloge avant de conclure
      if (retry) { check(ac, ac.currentTime, 500, false); return; }
    }
    // Bloqué : on le recrée tout de suite (l'app iOS autorise l'audio sans geste) ; si le nouveau
    // ne démarre pas non plus (appel en cours…), un toucher ou la fin d'interruption le relancera
    stuck = true;
    if (Date.now() - lastRebuild < 5000) return; // pas de boucle de reconstructions
    rebuild();
  }, ms);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx && ctx.state === "closed") rebuild(); // fermé par le système : on en refait un
  const ac = ctx ?? create();
  if (!ac) return null;
  wake(ac);
  return ac;
}

/** Vérifie que le son sort encore (et le répare sinon) : retour au premier plan, fin d'interruption, micro rendu… */
function heal(force = false) {
  if (typeof window === "undefined" || !ctx) return; // pas encore de son joué : rien à réparer
  if (force) { rebuild(); return; }
  const ac = audio();
  if (ac) wake(ac, true);
}

/**
 * À appeler quand le micro est libéré (Chut !, voix des persos) : l'ouverture du micro bascule la session
 * audio d'iOS et peut couper le contexte des sons ; on remet aussi la sortie sur le haut-parleur (natif).
 * `micOff = false` : micro tout juste ouvert, on vérifie seulement que les sons sortent encore.
 */
export function wakeSfx(micOff = true) {
  if (typeof window === "undefined") return;
  if (micOff) try {
    (window as unknown as { webkit?: { messageHandlers?: { zzaudio?: { postMessage: (m: string) => void } } } })
      .webkit?.messageHandlers?.zzaudio?.postMessage("mic-off");
  } catch { /* hors app iOS */ }
  heal();
  // la session iOS met un instant à revenir en lecture : deuxième vérification un peu plus tard
  setTimeout(() => heal(), 1200);
}

// iOS : le contexte audio ne démarre qu'après un geste → on le réveille à chaque toucher (et on le
// recrée s'il est resté bloqué), ainsi qu'au retour au premier plan
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => {
    // dans le geste : le nouveau contexte peut démarrer (au plus une fois par seconde, ex. appel en cours)
    if (stuck && Date.now() - lastRebuild > 1000) rebuild();
    audio();
  }, { passive: true, capture: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) heal(); });
  window.addEventListener("pageshow", () => heal());
  // App iOS (ZinzinBridgeViewController) : fin d'interruption (appel, Siri, alarme), casque/Bluetooth
  // branché ou débranché, retour au premier plan ; zzReset = services audio d'iOS redémarrés (tout est mort)
  window.addEventListener("zzaudioresume", (e) => heal(!!(e as Event & { zzReset?: boolean }).zzReset));
}

function fileOf(name: SfxName): SfxName {
  return ALIASES[name] ?? name;
}

/** Décode sur le contexte courant ; jamais d'attente infinie (contexte bloqué) : le son sera retenté plus tard. */
function decode(data: ArrayBuffer): Promise<AudioBuffer> {
  const ac = audio();
  if (!ac) return Promise.reject(new Error("no audio"));
  return new Promise<AudioBuffer>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), 8000);
    ac.decodeAudioData(data.slice(0)).then(
      (buf) => { clearTimeout(t); resolve(buf); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

function load(name: SfxName): Promise<AudioBuffer | null> {
  const file = fileOf(name);
  const ready = buffers.get(file);
  if (ready) return Promise.resolve(ready);
  const pending = loading.get(file);
  if (pending) return pending;
  if (!audio()) return Promise.resolve(null);
  const p = fetch(`/sfx/${file}.m4a`)
    .then((r) => r.arrayBuffer())
    // 2e essai sur le contexte courant : l'ancien a pu être recréé (fermé) pendant le décodage
    .then((data) => decode(data).catch(() => decode(data)))
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
    // Si le décodage a pris du temps, on garde le rendez-vous prévu (sans repartir dans le passé) ;
    // contexte recréé entre-temps : son horloge repart de zéro, on garde juste le délai demandé
    const at = ctx === ac ? Math.max(ctx.currentTime, asked + delay) : ctx.currentTime + delay;
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

/** `duration` (s) : ne joue que le début du son, coupé en fondu court (ex. un petit rire). */
export function playSfx(name: SfxName, opts: SfxOptions & { duration?: number } = {}) {
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
  let buffer: AudioBuffer | null = null;
  let src: AudioBufferSourceNode | null = null;
  let gain: GainNode | null = null;
  let on: AudioContext | null = null; // contexte où joue `src`
  let curRate = rate;
  let curVol = clampVol(volume);

  /** (Re)lance la boucle sur le contexte courant ; l'ancienne source (contexte remplacé) est lâchée. */
  const attach = (fade: number) => {
    if (stopped || muted || !buffer || !ctx || !master) return;
    const old = src;
    if (old) { try { old.stop(); old.disconnect(); } catch { /* contexte déjà fermé */ } }
    const ac = ctx;
    on = ac;
    src = ac.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.playbackRate.value = curRate;
    gain = ac.createGain();
    const t = ac.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(curVol, t + Math.max(0.01, fade));
    src.connect(gain).connect(master);
    // départ à un endroit au hasard : deux manches ne sonnent pas pareil
    src.start(t, Math.random() * buffer.duration * 0.9);
  };

  const stop = ((fadeOut = 0.15) => {
    if (stopped) return;
    stopped = true;
    activeLoops.delete(stop);
    if (!src || !gain || !on) return;
    const t = on.currentTime;
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
    if (src && on) src.playbackRate.setTargetAtTime(r, on.currentTime, 0.08);
  };
  stop.setVolume = (v: number) => {
    curVol = clampVol(v);
    if (gain && on && !stopped) gain.gain.setTargetAtTime(curVol, on.currentTime, 0.08);
  };

  if (muted) { stopped = true; return stop; }
  const ac = audio();
  if (!ac || !master) { stopped = true; return stop; }
  // contexte recréé (iOS bloqué) : la boucle reprend dessus, même vitesse, même volume, fondu court
  activeLoops.set(stop, () => attach(0.15));
  void load(name).then((buf) => {
    if (!buf || !ctx || !master || stopped || muted) { stop(); return; }
    buffer = buf;
    attach(fadeIn);
  });
  return stop;
}

/** Coupe toutes les boucles en cours (changement de jeu, son coupé…). */
export function stopAllLoops(fadeOut = 0.1) {
  [...activeLoops.keys()].forEach((s) => s(fadeOut));
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

/**
 * Prévient quand le contexte partagé est remplacé (iOS bloqué → recréé) : ce qui jouait dessus s'est tu.
 * Les lecteurs annexes ne gardent donc jamais `sfxOutput()` d'un appel à l'autre (le redemander à chaque son).
 */
export function onSfxContextChange(cb: () => void) {
  ctxListeners.add(cb);
  return () => { ctxListeners.delete(cb); };
}
