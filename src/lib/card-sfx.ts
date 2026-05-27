// Petits bruitages synthétisés (Web Audio) pour les jeux de cartes.
// Pas de fichiers : tout est généré à la volée. Respecte le mute via l'appelant.
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, t0: number, dur: number, type: OscillatorType, gain: number) {
  const c = ctx!;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noiseSwoosh(t0: number, dur: number, fStart: number, fEnd: number, gain: number) {
  const c = ctx!;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(fStart, t0);
  filter.frequency.exponentialRampToValueAtTime(fEnd, t0 + dur);
  filter.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter); filter.connect(g); g.connect(c.destination);
  src.start(t0); src.stop(t0 + dur + 0.02);
}

// Carte posée sur le tapis : petit "flick".
export function sfxCardPlay() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  tone(420, t, 0.06, "triangle", 0.12);
  noiseSwoosh(t, 0.07, 2400, 900, 0.1);
}

// Le gagnant ramasse le pli : balayage + petit thump.
export function sfxTrickWin() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  noiseSwoosh(t, 0.26, 1600, 420, 0.16);
  tone(180, t + 0.12, 0.14, "sine", 0.18);
}

// Belote / annonce : petit "pop".
export function sfxBidPop() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  tone(620, t, 0.09, "sine", 0.13);
  tone(820, t + 0.05, 0.08, "sine", 0.1);
}

// Fin de manche : carillon ascendant.
export function sfxHandChime(win = true) {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  const notes = win ? [523, 659, 784, 1047] : [392, 349, 311];
  notes.forEach((f, i) => tone(f, t + i * 0.11, 0.32, "sine", 0.16));
}

// Glissando qui accompagne le remplissage d'une barre (recap).
export function sfxBarFill(dur = 0.7) {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(330, t);
  osc.frequency.exponentialRampToValueAtTime(760, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t); osc.stop(t + dur + 0.02);
}
