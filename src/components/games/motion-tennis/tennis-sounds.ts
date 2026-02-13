let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noise(duration: number, gain: number, filterFreq: number, filterQ: number) {
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;

  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}

function tone(freq: number, duration: number, gain: number, type: OscillatorType = "sine") {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;

  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const TennisSounds = {
  /** Racket hitting ball — sharp crack */
  hit(power: number) {
    const vol = 0.3 + power * 0.5;
    noise(0.08, vol, 2000 + power * 3000, 1.5);
    tone(800 + power * 400, 0.05, vol * 0.4, "square");
  },

  /** Smash — heavy impact */
  smash() {
    noise(0.12, 1.0, 1200, 0.8);
    tone(200, 0.15, 0.6, "sawtooth");
    tone(400, 0.08, 0.3, "square");
  },

  /** Ball bouncing on court */
  bounce() {
    tone(300, 0.1, 0.25);
    noise(0.04, 0.12, 800, 2);
  },

  /** Ball hitting net */
  net() {
    noise(0.2, 0.2, 400, 0.5);
    tone(120, 0.3, 0.1, "sawtooth");
  },

  /** Point scored — ascending chime */
  point() {
    const notes = [523, 659, 784]; // C5 E5 G5
    notes.forEach((freq, i) => {
      setTimeout(() => tone(freq, 0.3, 0.3), i * 100);
    });
  },

  /** Game over — victory fanfare */
  victory() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => tone(freq, 0.5, 0.24), i * 150);
    });
  },

  /** Serve — whoosh */
  serve() {
    const c = getCtx();
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.15);

    const g = c.createGain();
    g.gain.setValueAtTime(0.2, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);

    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.2);

    noise(0.15, 0.16, 1500, 1);
  },

  /** Out — error tone */
  out() {
    tone(200, 0.15, 0.3, "square");
    setTimeout(() => tone(150, 0.2, 0.24, "square"), 150);
  },

  /** Crowd cheer — short burst */
  crowd() {
    noise(0.6, 0.15, 600, 0.3);
    noise(0.4, 0.10, 1200, 0.5);
  },

  /** Perfect timing — bright Wii-style chime */
  perfect() {
    tone(880, 0.15, 0.25);
    tone(1320, 0.2, 0.2);
    setTimeout(() => tone(1760, 0.3, 0.18), 80);
    setTimeout(() => tone(2200, 0.2, 0.12), 160);
  },

  /** Ambient crowd — Wii Sports style warm murmur with periodic claps */
  ambientStart(): () => void {
    const c = getCtx();
    let stopped = false;

    // Layer 1: Low crowd murmur
    const buf1 = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const d1 = buf1.getChannelData(0);
    for (let i = 0; i < d1.length; i++) d1[i] = Math.random() * 2 - 1;
    const src1 = c.createBufferSource();
    src1.buffer = buf1;
    src1.loop = true;
    const f1 = c.createBiquadFilter();
    f1.type = "lowpass";
    f1.frequency.value = 400;
    f1.Q.value = 0.5;
    const g1 = c.createGain();
    g1.gain.value = 0.05;
    src1.connect(f1).connect(g1).connect(c.destination);
    src1.start();

    // Layer 2: Mid crowd chatter
    const buf2 = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d2 = buf2.getChannelData(0);
    for (let i = 0; i < d2.length; i++) d2[i] = Math.random() * 2 - 1;
    const src2 = c.createBufferSource();
    src2.buffer = buf2;
    src2.loop = true;
    const f2 = c.createBiquadFilter();
    f2.type = "bandpass";
    f2.frequency.value = 800;
    f2.Q.value = 0.8;
    const g2 = c.createGain();
    g2.gain.value = 0.025;
    src2.connect(f2).connect(g2).connect(c.destination);
    src2.start();

    // Layer 3: Periodic claps (Wii Sports style)
    let clapTimeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleClap = () => {
      clapTimeout = setTimeout(() => {
        if (stopped) return;
        if (Math.random() < 0.65) {
          const count = Math.random() < 0.3 ? 3 : Math.random() < 0.5 ? 2 : 1;
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              if (!stopped) noise(0.04, 0.06 + Math.random() * 0.04, 3000 + Math.random() * 2000, 2);
            }, i * 70);
          }
        }
        scheduleClap();
      }, 2000 + Math.random() * 4000);
    };
    scheduleClap();

    return () => {
      stopped = true;
      g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
      setTimeout(() => {
        try { src1.stop(); } catch {}
        try { src2.stop(); } catch {}
      }, 600);
      if (clapTimeout) clearTimeout(clapTimeout);
    };
  },
};
