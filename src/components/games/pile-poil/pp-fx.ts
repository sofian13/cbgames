// Effets Pile Poil : petits sons synthétisés (Web Audio, aucun fichier) + vibrations.
// Tout est « best effort » : si l'API n'existe pas (iOS ne vibre pas en webview), on ignore.

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    return null;
  }
  return ctx;
}

function tone(freq: number, delay: number, dur: number, type: OscillatorType, gain: number, slideTo?: number) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

/** Débloque l'audio (à appeler sur un geste utilisateur, ex. le GO). */
export function fxUnlock() {
  ac();
}

/** Tic du compteur qui défile — la hauteur monte avec les secondes. */
export function fxTick(step: number) {
  tone(520 + Math.min(step, 30) * 28, 0, 0.05, "square", 0.05);
}

/** GO / STOP : petit clic franc. */
export function fxTap(high = true) {
  tone(high ? 880 : 440, 0, 0.07, "triangle", 0.14);
}

/** La cible vient d'être dépassée pendant le défilement. */
export function fxOver() {
  tone(220, 0, 0.22, "sawtooth", 0.08, 140);
}

/** Résultat correct (sans être pile poil). */
export function fxGood() {
  tone(660, 0, 0.12, "triangle", 0.14);
  tone(990, 0.1, 0.18, "triangle", 0.12);
}

/** Loin de la cible : « bwah-bwah ». */
export function fxBad() {
  tone(330, 0, 0.25, "sawtooth", 0.07, 260);
  tone(260, 0.24, 0.4, "sawtooth", 0.07, 180);
}

/** PILE POIL : fanfare. */
export function fxPerfect() {
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((f, i) => tone(f, i * 0.09, i === notes.length - 1 ? 0.6 : 0.14, "square", 0.08));
  notes.forEach((f, i) => tone(f / 2, i * 0.09, 0.14, "triangle", 0.1));
}

/** Roulement de tambour (cible mystère, perdant). */
export function fxDrum(durS = 1.2) {
  const n = Math.floor(durS / 0.06);
  for (let i = 0; i < n; i++) tone(140 + (i % 2) * 20, i * 0.06, 0.05, "triangle", 0.09);
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* pas de vibration dispo */
  }
}
