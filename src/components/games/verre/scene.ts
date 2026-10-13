/**
 * Le Verre Invisible — simulation du liquide + rendu Canvas 2D (60 fps, zéro React).
 *
 * Modèle : un verre (gobelet légèrement évasé) vu de côté en légère plongée.
 * La surface du liquide est un plan h = L + sx·u + sz·v (u = gauche/droite, v = avant/arrière,
 * dans le disque unité) + des vagues stationnaires. La pente (sx, sz) suit l'inclinaison du tél
 * via un ressort amorti (le liquide « en retard » fait des vagues, dépasse, revient…).
 * Ça déborde quand le point le plus haut de la surface (+ vagues + mousse) passe le bord.
 */

import type { LiquidId } from "./i18n";

export const INK = "#15082E";

export type Difficulty = "easy" | "normal" | "pro";

/** Réglages par difficulté : gain (pente par inclinaison), amortissement, secousses, chrono du passage. */
export const DIFF: Record<Difficulty, { gain: number; zeta: number; accel: number; turb: number; passTime: number }> = {
  easy: { gain: 0.46, zeta: 0.26, accel: 0.35, turb: 0.5, passTime: 7 },
  normal: { gain: 0.66, zeta: 0.15, accel: 0.55, turb: 0.8, passTime: 6 },
  pro: { gain: 0.86, zeta: 0.09, accel: 0.8, turb: 1.1, passTime: 5 },
};

export interface LiquidStyle {
  id: LiquidId;
  body: string;
  deep: string;
  top: string;
  /** densité de bulles 0..1 */
  fizz: number;
}

export const LIQUIDS: LiquidStyle[] = [
  { id: "orange", body: "#FF9F1C", deep: "#E8590C", top: "#FFC861", fizz: 0.25 },
  { id: "grenadine", body: "#FF3E6C", deep: "#B3123E", top: "#FF8BA7", fizz: 0.2 },
  { id: "cola", body: "#8A4A22", deep: "#3E1A08", top: "#C98A5A", fizz: 1 },
  { id: "sparkling", body: "#9FE3FF", deep: "#4BA8DC", top: "#DDF6FF", fizz: 1 },
  { id: "mint", body: "#3DDC97", deep: "#12865A", top: "#A4F2CC", fizz: 0.25 },
  { id: "lemonade", body: "#FFE45C", deep: "#E0B000", top: "#FFF4AE", fizz: 0.8 },
  { id: "blueberry", body: "#7A4EE8", deep: "#3A1C94", top: "#B59CFF", fizz: 0.2 },
];

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Wave { a: number; v: number; n: number }
interface Bubble { u: number; h: number; r: number; sp: number; ph: number }

export interface Glass {
  /** niveau (0 = fond, 1 = bord d'un verre normal) */
  L: number;
  /** hauteur du bord (1 = normal, < 1 = « petit verre ») */
  rim: number;
  rimTarget: number;
  sx: number; sz: number; vx: number; vz: number;
  waves: Wave[];
  foam: number;
  omega: number;
  /** multiplicateur de sensibilité */
  gainMul: number;
  /** taille relative (1 = verre principal) */
  scale: number;
  /** décalage horizontal (en demi-largeurs de bord du verre principal) */
  pos: number;
  posTarget: number;
  /** apparition 0..1 */
  appear: number;
  bubbles: Bubble[];
  /** dernier signe de vitesse (clapotis) */
  lastSign: number;
}

interface Drop { x: number; y: number; vx: number; vy: number; r: number; color: string; life: number; floor: number }
interface Ice { u: number; rot: number; vr: number; s: number; y: number | null; vy: number; ph: number; settle: number }
interface Puddle { x: number; y: number; r: number; target: number; color: string }

export type SceneFx =
  | { t: "glug"; rate: number }
  | { t: "slosh"; v: number }
  | { t: "plop" }
  | { t: "drip" }
  | { t: "spray" };

export interface Layout {
  W: number; H: number;
  cx: number; tableY: number; baseY: number;
  glassH: number; Rt: number; Rb: number;
  bottleL: number;
  mascotX: number; mascotS: number;
  levelX: number; levelY: number; levelR: number;
}

function newGlass(L: number, omega: number): Glass {
  return {
    L, rim: 1, rimTarget: 1,
    sx: 0, sz: 0, vx: 0, vz: 0,
    waves: [{ a: 0, v: 0, n: 2 }, { a: 0, v: 0, n: 3 }, { a: 0, v: 0, n: 5 }],
    foam: 0, omega, gainMul: 1, scale: 1, pos: 0, posTarget: 0, appear: 1,
    bubbles: [], lastSign: 0,
  };
}

export class VerreScene {
  diff = DIFF.normal;
  liquid: LiquidStyle = LIQUIDS[0];
  glasses: Glass[] = [newGlass(0.2, TAU * 1.25)];
  ice: Ice[] = [];
  drops: Drop[] = [];
  puddles: Puddle[] = [];
  fx: SceneFx[] = [];
  layout: Layout | null = null;
  time = 0;

  // ── Entrées (écrites par le composant à chaque image) ──
  /** inclinaison relative lissée (radians) : x = droite en bas, z = bas du tél en bas */
  tiltX = 0;
  tiltZ = 0;
  /** accélération linéaire (m/s²) */
  ax = 0; ay = 0; az = 0;
  /** le joueur maintient « Verser » */
  pouring = false;

  // ── État visuel / jeu ──
  pourAnim = 0;
  pourHeld = 0;
  streamOn = 0;
  streamTail = 0;
  nextGlug = 0;
  /** volume versé pendant ce tour (unités de niveau, verre principal) */
  poured = 0;
  /** fissure : hauteur, temps restant / total (s) */
  crack: { h: number; left: number; total: number; nextDrip: number } | null = null;
  foamOn = false;
  /** blob de la mascotte : couleur du joueur qui tient le tél */
  mascotColor = "#FF3EA5";
  mascotDeep = "#A8195F";
  spill: { g: number; dir: number; front: boolean; t: number; x: number; y: number } | null = null;
  shake = 0;
  dangerSmooth = 0;
  /** affichage du niveau à bulle */
  showLevel = true;
  lastSpray = 0;

  setLiquid(l: LiquidStyle) {
    this.liquid = l;
  }

  /** Nouvelle manche : verre presque vide, plus de glaçons ni de flaques. */
  reset(L: number) {
    this.glasses = [newGlass(L, TAU * 1.25)];
    this.ice = [];
    this.drops = [];
    this.puddles = [];
    this.crack = null;
    this.foamOn = false;
    this.spill = null;
    this.shake = 0;
    this.poured = 0;
    this.pourAnim = 0;
    this.streamOn = 0;
  }

  get main() {
    return this.glasses[0];
  }

  /** Plateau de serveur : un 2e verre plus petit à côté. */
  addTray() {
    if (this.glasses.length > 1) return;
    const g = newGlass(clamp(this.main.L * 0.95, 0.2, 0.78), TAU * 1.7);
    g.scale = 0.66;
    g.gainMul = 1.15;
    g.pos = 2.4;
    g.posTarget = 1.25;
    g.appear = 0;
    this.main.posTarget = -0.62;
    this.glasses.push(g);
  }

  removeTray() {
    if (this.glasses.length < 2) return;
    this.glasses.length = 1;
    this.main.posTarget = 0;
  }

  /** Glaçon : tombe du haut, fait monter le niveau en plongeant. */
  dropIce() {
    this.ice.push({ u: (Math.random() - 0.5) * 0.7, rot: Math.random() * 0.6 - 0.3, vr: (Math.random() - 0.5) * 3, s: 0.8 + Math.random() * 0.3, y: -1, vy: 0, ph: Math.random() * TAU, settle: 0 });
  }

  /** Coup de pied dans le liquide (secousse, glaçon…). */
  kick(power: number) {
    for (const g of this.glasses) {
      g.vx += (Math.random() - 0.5) * power * 2;
      g.vz += (Math.random() - 0.5) * power * 1.4;
      for (const w of g.waves) w.v += (Math.random() - 0.5) * power * 1.6;
    }
  }

  // ═══════════════ Géométrie ═══════════════

  resize(W: number, H: number, safeTop: number, safeBottom: number) {
    const topReserve = safeTop + 150;
    const bottomReserve = safeBottom + 172;
    const tableY = H - bottomReserve - 44;
    const avail = Math.max(200, tableY - topReserve);
    const glassH = clamp(Math.min(avail / 1.6, W * 0.6), 130, 300);
    const Rt = glassH * 0.34;
    const Rb = Rt * 0.76;
    const cx = W / 2;
    const mascotS = clamp(glassH * 0.33, 58, 86);
    this.layout = {
      W, H, cx, tableY, baseY: tableY + 12,
      glassH, Rt, Rb,
      bottleL: glassH * 0.72,
      mascotX: Math.max(mascotS * 0.6, cx - Rt - mascotS * 0.72 - 8), mascotS,
      levelX: W - 36, levelY: topReserve + 16, levelR: 19,
    };
  }

  /** Dimensions écran d'un verre. */
  private gm(g: Glass) {
    const lay = this.layout!;
    const s = g.scale;
    const Hg = lay.glassH * s;
    const Rt = lay.Rt * s;
    const Rb = lay.Rb * s;
    const cx = lay.cx + g.pos * lay.Rt;
    const baseY = lay.baseY;
    const base = Hg * 0.075;
    const yIb = baseY - base; // fond intérieur
    const Hi = Hg - base; // hauteur intérieure pour rim = 1
    const wall = Math.max(3, 5 * s);
    const ry = 0.2;
    const rAt = (h: number) => Rb - wall + (Rt - Rb) * h; // demi-largeur intérieure à la hauteur h
    const yTop = yIb - g.rim * Hi;
    return { cx, baseY, yIb, Hi, Rt, Rb, wall, ry, rAt, yTop, Hg, s };
  }

  // ═══════════════ Simulation ═══════════════

  /** Hauteur max de la surface (bord le plus haut) / hauteur du bord : ≥ 1 = ça déborde. */
  fill(g: Glass): number {
    const crest = 0.6 * g.waves.reduce((a, w) => a + Math.abs(w.a), 0);
    return (g.L + g.foam + Math.hypot(g.sx, g.sz) + crest) / g.rim;
  }

  /** 0 (calme) → 1 (ça va déborder) sur le verre le plus en danger. */
  danger(): number {
    let d = 0;
    for (const g of this.glasses) d = Math.max(d, this.fill(g));
    return clamp((d - 0.55) / 0.45, 0, 1.2);
  }

  /** Renvoie l'index du verre qui déborde, sinon -1. */
  overflowing(): number {
    for (let i = 0; i < this.glasses.length; i++) if (this.fill(this.glasses[i]) >= 1) return i;
    return -1;
  }

  step(dt: number) {
    if (!this.layout) return;
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    const d = this.diff;
    const lay = this.layout;

    // ── Bouteille + filet ──
    this.pourAnim += ((this.pouring && !this.spill ? 1 : 0) - this.pourAnim) * Math.min(1, dt * (this.pouring ? 9 : 6));
    if (this.pouring && !this.spill) this.pourHeld += dt;
    else this.pourHeld = 0;
    const flowing = this.pouring && this.pourAnim > 0.82 && !this.spill;
    if (flowing) this.streamTail = 0.14; // quelques gouttes après le relâchement
    else this.streamTail = Math.max(0, this.streamTail - dt);
    const streamTarget = flowing ? 1 : this.streamTail > 0 ? 0.35 : 0;
    this.streamOn += (streamTarget - this.streamOn) * Math.min(1, dt * 14);

    const m = this.main;
    if (this.streamOn > 0.05 && !this.spill) {
      // le débit accélère quand on maintient (le goulot se dégage)
      const rate = (0.075 + 0.075 * clamp(this.pourHeld / 1.3, 0, 1)) * this.streamOn;
      m.L += rate * dt;
      this.poured += rate * dt;
      // l'impact du filet fait des vaguelettes
      for (const w of m.waves) w.v += (Math.random() - 0.5) * 0.9 * dt * this.streamOn;
      m.vx += (Math.random() - 0.5) * 0.25 * dt;
      if (this.foamOn) m.foam += 0.05 * dt;
      // glouglou : de plus en plus aigu quand le verre se remplit (colonne d'air plus courte)
      if (this.time >= this.nextGlug) {
        this.fx.push({ t: "glug", rate: 0.55 + m.L * 0.55 + Math.random() * 0.12 });
        this.nextGlug = this.time + 0.1 + Math.random() * 0.08;
      }
      // éclaboussures à l'impact
      if (Math.random() < dt * 22 * this.streamOn) {
        const gm = this.gm(m);
        const hs = this.surfaceAt(m, 0, 0.35);
        this.spawnDrop(gm.cx + (Math.random() - 0.5) * 8, gm.yIb - hs * gm.Hi + 4, (Math.random() - 0.5) * 120, -120 - Math.random() * 140, 2 + Math.random() * 2.5, this.liquid.body, gm.yIb - hs * gm.Hi + 10);
      }
    }

    // ── Pente du liquide : ressort amorti vers l'inclinaison ──
    const tanX = Math.tan(clamp(this.tiltX, -0.9, 0.9));
    const tanZ = Math.tan(clamp(this.tiltZ, -0.9, 0.9));
    const kx = -this.ax / 9.81 * d.accel;
    const kz = this.ay / 9.81 * d.accel;
    const jolt = Math.min(6, Math.hypot(this.ax, this.ay, this.az));
    const sub = 3;
    const h = dt / sub;
    for (const g of this.glasses) {
      const G = d.gain * g.gainMul;
      const tx = G * (tanX + kx);
      const tz = G * (tanZ + kz);
      const w0 = g.omega;
      const z = d.zeta;
      const before = g.vx;
      for (let k = 0; k < sub; k++) {
        g.vx += (w0 * w0 * (tx - g.sx) - 2 * z * w0 * g.vx) * h;
        g.vz += (w0 * w0 * (tz - g.sz) - 2 * z * w0 * g.vz) * h;
        g.sx += g.vx * h;
        g.sz += g.vz * h;
        for (const w of g.waves) {
          const wn = w0 * Math.sqrt(w.n) * 1.15;
          w.v += (-wn * wn * w.a - 2 * (z + 0.05) * wn * w.v) * h;
          w.a += w.v * h;
        }
      }
      // les à-coups (variation de pente, secousses) excitent les vagues
      const accSlope = Math.abs(g.vx - before) / Math.max(dt, 1e-3);
      for (const w of g.waves) w.v += (Math.random() - 0.5) * (accSlope * 0.004 + jolt * 0.012) * dt * 10;
      // mousse : monte quand on bouge, retombe doucement
      if (this.foamOn) g.foam += (Math.abs(g.vx) + Math.abs(g.vz)) * 0.045 * dt + jolt * 0.006 * dt;
      g.foam = clamp(g.foam - (this.foamOn ? 0.01 : 0.12) * dt, 0, 0.22);
      // clapotis : la vague repart dans l'autre sens
      const sign = Math.sign(g.vx);
      if (sign !== 0 && sign !== g.lastSign && Math.abs(g.sx) > 0.05) this.fx.push({ t: "slosh", v: Math.min(1, Math.abs(g.sx) * 3) });
      g.lastSign = sign;
      // animations de forme
      g.rim += (g.rimTarget - g.rim) * Math.min(1, dt * 3.2);
      g.pos += (g.posTarget - g.pos) * Math.min(1, dt * 5);
      g.appear = Math.min(1, g.appear + dt * 2.5);
      this.stepBubbles(g, dt);
    }

    // ── Gouttelettes qui sautent quand ça frôle le bord (sans déborder) ──
    const dg = this.danger();
    this.dangerSmooth += (dg - this.dangerSmooth) * Math.min(1, dt * 6);
    if (!this.spill && dg > 0.88 && this.time - this.lastSpray > 0.25) {
      this.lastSpray = this.time;
      const g = this.glasses[0];
      const gm = this.gm(g);
      const side = g.sx >= 0 ? 1 : -1;
      for (let i = 0; i < 2; i++) this.spawnDrop(gm.cx + side * gm.rAt(g.rim) * 0.9, gm.yTop + 2, side * (40 + Math.random() * 80), -90 - Math.random() * 90, 1.8 + Math.random() * 1.5, this.liquid.body, gm.yTop + 6);
      this.fx.push({ t: "spray" });
    }

    // ── Fissure : le verre fuit ──
    if (this.crack && !this.spill) {
      const c = this.crack;
      c.left -= dt;
      if (m.L > c.h) m.L -= 0.004 * dt;
      if (this.time >= c.nextDrip) {
        c.nextDrip = this.time + 0.32 + Math.random() * 0.25;
        const gm = this.gm(m);
        this.spawnDrop(gm.cx - gm.rAt(c.h) * 0.25, gm.yIb - c.h * gm.Hi + gm.rAt(c.h) * gm.ry * 0.9, -6, 20, 2.6, this.liquid.body, lay.tableY + 30);
        this.fx.push({ t: "drip" });
      }
    }

    // ── Glaçons ──
    for (const ic of this.ice) {
      const gm = this.gm(m);
      const surfY = gm.yIb - this.surfaceAt(m, ic.u, 0.2) * gm.Hi + gm.rAt(m.L) * gm.ry * 0.2;
      if (ic.y !== null) {
        if (ic.y < 0) ic.y = lay.tableY - lay.glassH * 1.7;
        ic.vy += 1500 * dt;
        ic.y += ic.vy * dt;
        ic.rot += ic.vr * dt;
        if (ic.y >= surfY) {
          ic.y = null;
          m.L += 0.055;
          this.kick(0.9);
          for (let i = 0; i < 10; i++) this.spawnDrop(gm.cx + ic.u * gm.rAt(m.L) * 0.8, surfY, (Math.random() - 0.5) * 260, -160 - Math.random() * 220, 2 + Math.random() * 3, this.liquid.body, surfY + 8);
          this.fx.push({ t: "plop" });
        }
      } else {
        ic.settle = Math.min(1, ic.settle + dt * 2);
        ic.u = clamp(ic.u + m.sx * dt * 0.4, -0.55, 0.55);
        ic.rot += (m.sx * 0.6 - ic.rot) * dt * 2;
      }
    }

    // ── Débordement en cours ──
    if (this.spill) {
      const sp = this.spill;
      sp.t += dt;
      const g = this.glasses[sp.g];
      const gm = this.gm(g);
      if (sp.t < 1.1) {
        g.L = Math.max(0.3, g.L - 0.16 * dt);
        g.sx += ((sp.front ? 0 : sp.dir * 0.35) - g.sx) * dt * 3;
        g.sz += ((sp.front ? 0.35 : 0) - g.sz) * dt * 3;
        const n = Math.random() < 0.7 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const x = sp.front ? gm.cx + (Math.random() - 0.5) * gm.Rt * 1.2 : gm.cx + sp.dir * gm.Rt;
          const vx = sp.front ? (Math.random() - 0.5) * 200 : sp.dir * (60 + Math.random() * 180);
          this.spawnDrop(x, gm.yTop + (sp.front ? gm.Rt * gm.ry : 0), vx, -60 - Math.random() * 200, 2.5 + Math.random() * 4, this.liquid.body, lay.tableY + 14 + Math.random() * 30);
        }
      }
      for (const p of this.puddles) p.r += (p.target - p.r) * Math.min(1, dt * 2.2);
    }
    this.shake = Math.max(0, this.shake - dt * 18);

    // ── Gouttes ──
    for (const p of this.drops) {
      p.vy += 1500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.y >= p.floor && p.vy > 0) {
        if (p.floor >= lay.tableY) this.addPuddle(p.x, p.floor, p.r);
        p.life = 0;
      }
    }
    this.drops = this.drops.filter((p) => p.life > 0);
  }

  /** Déclenche le débordement (rendu + flaque). */
  startSpill(gIndex: number) {
    const g = this.glasses[gIndex];
    const front = Math.abs(g.sz) > Math.abs(g.sx) * 1.1;
    const dir = g.sx >= 0 ? 1 : -1;
    const gm = this.gm(g);
    this.spill = { g: gIndex, dir, front, t: 0, x: gm.cx, y: gm.yTop };
    this.shake = 14;
    this.pouring = false;
    const lay = this.layout!;
    const px = front ? gm.cx : gm.cx + dir * (gm.Rb + gm.Rt * 0.9);
    this.puddles.push({ x: clamp(px, 40, lay.W - 40), y: lay.tableY + 22, r: 4, target: gm.Rt * 1.25, color: this.liquid.body });
    for (let i = 0; i < 26; i++) {
      const x = front ? gm.cx + (Math.random() - 0.5) * gm.Rt * 1.6 : gm.cx + dir * gm.Rt;
      this.spawnDrop(x, gm.yTop, (front ? (Math.random() - 0.5) * 2 : dir) * (80 + Math.random() * 320), -200 - Math.random() * 380, 2.5 + Math.random() * 5, this.liquid.body, lay.tableY + 10 + Math.random() * 40);
    }
  }

  private addPuddle(x: number, y: number, r: number) {
    const near = this.puddles.find((p) => Math.abs(p.x - x) < p.target * 0.9 + 12);
    if (near) near.target = Math.min(near.target + r * 0.25, (this.layout?.Rt ?? 80) * 1.7);
    else if (this.puddles.length < 6) this.puddles.push({ x, y: this.layout!.tableY + 18 + Math.random() * 14, r: 1, target: r * 2.2, color: this.liquid.body });
  }

  private spawnDrop(x: number, y: number, vx: number, vy: number, r: number, color: string, floor: number) {
    if (this.drops.length > 160) return;
    this.drops.push({ x, y, vx, vy, r, color, life: 3, floor });
  }

  private stepBubbles(g: Glass, dt: number) {
    const want = Math.round(4 + this.liquid.fizz * 18 * g.scale);
    while (g.bubbles.length < want) g.bubbles.push({ u: Math.random() * 1.6 - 0.8, h: Math.random() * g.L, r: 1.4 + Math.random() * 2.6, sp: 0.08 + Math.random() * 0.14, ph: Math.random() * TAU });
    if (g.bubbles.length > want) g.bubbles.length = want;
    for (const b of g.bubbles) {
      b.h += b.sp * dt * (0.6 + this.liquid.fizz);
      b.ph += dt * 4;
      if (b.h > this.surfaceAt(g, b.u, 0.5) - 0.02) {
        b.h = 0.01 + Math.random() * 0.05;
        b.u = Math.random() * 1.6 - 0.8;
      }
    }
  }

  /** Hauteur de la surface au point (u, v) du disque unité. */
  surfaceAt(g: Glass, u: number, v: number): number {
    let w = 0;
    const x = (u + 1) / 2; // 0..1 d'un bord à l'autre
    for (const wv of g.waves) w += wv.a * Math.cos(wv.n * Math.PI * x);
    // petite ondulation de vie
    w += 0.004 * Math.sin(this.time * 2.3 + u * 3) * g.scale;
    return g.L + g.sx * u + g.sz * v + w;
  }

  // ═══════════════ Rendu ═══════════════

  draw(ctx: CanvasRenderingContext2D, dpr: number) {
    const lay = this.layout;
    if (!lay) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, lay.W, lay.H);
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    this.drawCounter(ctx);
    for (const p of this.puddles) this.drawPuddle(ctx, p);
    // verres du fond vers l'avant (le petit verre du plateau est dessiné après)
    for (const g of this.glasses) this.drawGlass(ctx, g);
    this.drawStream(ctx);
    this.drawBottle(ctx);
    this.drawSpillSheet(ctx);
    for (const p of this.drops) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = Math.min(2, p.r * 0.6);
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    this.drawMascot(ctx);
    if (this.showLevel && this.glasses.length === 1) this.drawLevel(ctx);
    ctx.restore();
  }

  /** Comptoir : bande violette avec un liseré, sous-verre jaune sous le verre. */
  private drawCounter(ctx: CanvasRenderingContext2D) {
    const lay = this.layout!;
    const y = lay.tableY;
    ctx.fillStyle = "#2E1C6E";
    ctx.fillRect(-20, y, lay.W + 40, lay.H - y + 20);
    ctx.fillStyle = "#3A2689";
    ctx.fillRect(-20, y, lay.W + 40, 14);
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(lay.W + 20, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // reflets du comptoir
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const x = (i * 0.37 + 0.12) * lay.W;
      ctx.beginPath();
      ctx.moveTo(x, y + 26 + i * 10);
      ctx.lineTo(x + 40, y + 26 + i * 10);
      ctx.stroke();
    }
  }

  private drawPuddle(ctx: CanvasRenderingContext2D, p: Puddle) {
    if (p.r < 1) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    // flaque en forme de blob irrégulier
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + 0.16 * Math.sin(a * 3 + p.x) + 0.08 * Math.cos(a * 5 + p.y);
      const x = Math.cos(a) * p.r * k;
      const y = Math.sin(a) * p.r * 0.3 * k;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-p.r * 0.3, -p.r * 0.08, p.r * 0.22, p.r * 0.05, 0, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();
    ctx.restore();
  }

  private drawGlass(ctx: CanvasRenderingContext2D, g: Glass) {
    const gm = this.gm(g);
    const { cx, baseY, yIb, Hi, Rt, Rb, ry, rAt, yTop } = gm;
    const a = g.appear;
    ctx.save();
    if (a < 1) {
      ctx.globalAlpha = a;
      ctx.translate(0, (1 - a) * 30);
    }
    const lw = Math.max(2.5, 4 * gm.s);

    // Sous-verre + ombre dure
    ctx.beginPath();
    ctx.ellipse(cx + 3, baseY + 7, Rb + 22 * gm.s, (Rb + 22 * gm.s) * ry, 0, 0, TAU);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 3, Rb + 22 * gm.s, (Rb + 22 * gm.s) * ry, 0, 0, TAU);
    ctx.fillStyle = "#FFD23F";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // Silhouette extérieure (paroi + fond épais)
    const outer = () => {
      ctx.beginPath();
      ctx.moveTo(cx - Rt, yTop);
      ctx.lineTo(cx - Rb, baseY);
      ctx.ellipse(cx, baseY, Rb, Rb * ry, 0, Math.PI, 0, true);
      ctx.lineTo(cx + Rt, yTop);
      ctx.ellipse(cx, yTop, Rt, Rt * ry, 0, 0, Math.PI, true);
      ctx.closePath();
    };
    // ombre dure décalée du verre
    ctx.save();
    ctx.translate(4 * gm.s, 4 * gm.s);
    outer();
    ctx.fillStyle = "rgba(21,8,46,0.35)";
    ctx.fill();
    ctx.restore();
    // verre teinté (paroi du fond)
    outer();
    ctx.fillStyle = "rgba(220,235,255,0.16)";
    ctx.fill();

    // ── Liquide (découpé à l'intérieur du verre) ──
    const rIn = rAt(0);
    ctx.save();
    ctx.beginPath();
    const rTopIn = rAt(g.rim);
    ctx.moveTo(cx - rTopIn, yTop - Hi);
    ctx.lineTo(cx - rTopIn, yTop);
    ctx.lineTo(cx - rIn, yIb);
    ctx.ellipse(cx, yIb, rIn, rIn * ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rTopIn, yTop);
    ctx.lineTo(cx + rTopIn, yTop - Hi);
    ctx.closePath();
    ctx.clip();

    const N = 30;
    const front: [number, number][] = [];
    const back: [number, number][] = [];
    const foamFront: [number, number][] = [];
    const foamBack: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const u = -1 + (2 * i) / N;
      const v = Math.sqrt(Math.max(0, 1 - u * u));
      const hf = this.surfaceAt(g, u, v);
      const hb = this.surfaceAt(g, u, -v);
      const rf = rAt(clamp(hf, 0, g.rim));
      const rb = rAt(clamp(hb, 0, g.rim));
      front.push([cx + u * rf, yIb - hf * Hi + v * rf * ry]);
      back.push([cx + u * rb, yIb - hb * Hi - v * rb * ry]);
      if (g.foam > 0.004) {
        const fh = g.foam * Hi;
        foamFront.push([cx + u * rf, yIb - hf * Hi + v * rf * ry - fh]);
        foamBack.push([cx + u * rb, yIb - hb * Hi - v * rb * ry - fh]);
      }
    }
    // corps du liquide
    ctx.beginPath();
    ctx.moveTo(front[0][0], front[0][1]);
    for (const p of front) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(cx + rIn + 40, yIb + Hi);
    ctx.lineTo(cx - rIn - 40, yIb + Hi);
    ctx.closePath();
    const topY = yIb - g.L * Hi;
    const grad = ctx.createLinearGradient(0, topY, 0, yIb + rIn * ry);
    grad.addColorStop(0, this.liquid.body);
    grad.addColorStop(1, this.liquid.deep);
    ctx.fillStyle = grad;
    ctx.fill();
    // bande plus claire contre la paroi gauche (lumière qui traverse)
    ctx.fillStyle = "rgba(255,255,255,0.13)";
    ctx.fillRect(cx - rIn - 30, topY, rIn * 0.42 + 30, Hi);

    // bulles
    ctx.lineWidth = 1.5;
    for (const b of g.bubbles) {
      const r = rAt(b.h);
      const x = cx + (b.u + Math.sin(b.ph) * 0.03) * r * 0.9;
      const y = yIb - b.h * Hi + r * ry * 0.45;
      ctx.beginPath();
      ctx.arc(x, y, b.r * gm.s, 0, TAU);
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.stroke();
    }


    // surface (vue de dessus, plus claire)
    ctx.beginPath();
    ctx.moveTo(front[0][0], front[0][1]);
    for (const p of front) ctx.lineTo(p[0], p[1]);
    for (let i = back.length - 1; i >= 0; i--) ctx.lineTo(back[i][0], back[i][1]);
    ctx.closePath();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = this.liquid.top;
    ctx.fill();
    ctx.globalAlpha = 1;
    // reflet de surface
    ctx.beginPath();
    for (let i = 4; i <= N - 10; i++) {
      const p = back[i];
      const y = lerp(p[1], front[i][1], 0.32);
      if (i === 4) ctx.moveTo(p[0], y); else ctx.lineTo(p[0], y);
    }
    ctx.lineWidth = 3 * gm.s;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.stroke();
    // bord avant de la surface (trait encre)
    ctx.beginPath();
    ctx.moveTo(front[0][0], front[0][1]);
    for (const p of front) ctx.lineTo(p[0], p[1]);
    ctx.lineWidth = 2.5 * gm.s;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // glaçons qui flottent (à moitié immergés)
    if (g === this.main) for (const ic of this.ice) if (ic.y === null) this.drawIce(ctx, g, ic);

    // mousse
    if (foamFront.length) {
      ctx.beginPath();
      ctx.moveTo(front[0][0], front[0][1]);
      for (const p of front) ctx.lineTo(p[0], p[1]);
      for (let i = foamFront.length - 1; i >= 0; i--) ctx.lineTo(foamFront[i][0], foamFront[i][1]);
      ctx.closePath();
      ctx.fillStyle = "#FFF6E5";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(foamFront[0][0], foamFront[0][1]);
      for (const p of foamFront) ctx.lineTo(p[0], p[1]);
      for (let i = foamBack.length - 1; i >= 0; i--) ctx.lineTo(foamBack[i][0], foamBack[i][1]);
      ctx.closePath();
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      // bulles de mousse sur le bord avant
      const br = Math.max(3, Math.min(9, g.foam * Hi * 0.5));
      for (let i = 1; i < foamFront.length - 1; i += 2) {
        const p = foamFront[i];
        ctx.beginPath();
        ctx.arc(p[0], p[1] + br * 0.3, br * (0.8 + 0.3 * Math.sin(i * 1.7 + this.time * 2)), 0, TAU);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(21,8,46,0.35)";
        ctx.stroke();
      }
    }
    ctx.restore(); // fin du clip

    // ── Verre (devant) ──
    // fond épais
    ctx.beginPath();
    ctx.ellipse(cx, yIb, rIn, rIn * ry, 0, 0, Math.PI);
    ctx.lineTo(cx - Rb, baseY);
    ctx.ellipse(cx, baseY, Rb, Rb * ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, yIb, rIn, rIn * ry, 0, 0, Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke();

    // fissure
    if (this.crack && g === this.main) {
      const c = this.crack;
      const y0 = yIb - c.h * Hi + rAt(c.h) * ry * 0.9;
      const x0 = cx - rAt(c.h) * 0.25;
      const pts: [number, number][] = [[x0 - Rt * 0.45, y0 - Hi * 0.12], [x0 - Rt * 0.3, y0 - Hi * 0.05], [x0 - Rt * 0.18, y0 - Hi * 0.09], [x0 - Rt * 0.05, y0 - Hi * 0.01], [x0, y0]];
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x0 - Rt * 0.3, y0 - Hi * 0.05);
      ctx.lineTo(x0 - Rt * 0.26, y0 + Hi * 0.04);
      ctx.stroke();
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + 1.5, y + 1.5) : ctx.moveTo(x + 1.5, y + 1.5)));
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.stroke();
    }

    // reflets du verre
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - Rt * 0.74, yTop + Hi * 0.14 * g.rim);
    ctx.lineTo(cx - Rb * 0.72, baseY - gm.Hg * 0.2);
    ctx.lineWidth = 8 * gm.s;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - Rt * 0.54, yTop + Hi * 0.2 * g.rim);
    ctx.lineTo(cx - Rt * 0.5, yTop + Hi * 0.34 * g.rim);
    ctx.lineWidth = 4 * gm.s;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + Rt * 0.78, yTop + Hi * 0.18 * g.rim);
    ctx.lineTo(cx + Rt * 0.76, yTop + Hi * 0.27 * g.rim);
    ctx.lineWidth = 5 * gm.s;
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.stroke();

    // contour encre (parois + fond)
    ctx.beginPath();
    ctx.moveTo(cx - Rt, yTop);
    ctx.lineTo(cx - Rb, baseY);
    ctx.ellipse(cx, baseY, Rb, Rb * ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + Rt, yTop);
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // bord (ellipse complète, épaisse)
    ctx.beginPath();
    ctx.ellipse(cx, yTop, Rt, Rt * ry, 0, 0, TAU);
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, yTop + 1, Rt - gm.wall, (Rt - gm.wall) * ry, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.stroke();

    // glaçon qui tombe (devant tout)
    if (g === this.main) for (const ic of this.ice) if (ic.y !== null && ic.y > 0) this.drawIceAt(ctx, cx + ic.u * Rt * 0.6, ic.y, ic.rot, ic.s * Rt * 0.36);
    ctx.restore();
  }

  private drawIce(ctx: CanvasRenderingContext2D, g: Glass, ic: Ice) {
    const gm = this.gm(g);
    const h = this.surfaceAt(g, ic.u, 0.2);
    const r = gm.rAt(clamp(h, 0, g.rim));
    const x = gm.cx + ic.u * r * 0.8;
    const y = gm.yIb - h * gm.Hi + r * gm.ry * 0.2 - 2 + Math.sin(this.time * 2 + ic.ph) * 2;
    this.drawIceAt(ctx, x, y, ic.rot, ic.s * gm.Rt * 0.4, 0.45);
  }

  /** Glaçon ; `sub` = part immergée (0..1), voilée par le liquide. */
  private drawIceAt(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, s: number, sub = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const r = s * 0.22;
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 2, s, s, r);
    ctx.fillStyle = "rgba(232,250,255,0.92)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-s / 2 + s * 0.14, -s / 2 + s * 0.12, s * 0.42, s * 0.16, s * 0.08);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.18, s * 0.28);
    ctx.lineTo(s * 0.3, s * 0.12);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(78,205,196,0.9)";
    ctx.stroke();
    if (sub > 0) {
      // partie sous l'eau : voilée par la couleur du liquide + ligne de flottaison
      ctx.rotate(-rot);
      const wl = s / 2 - s * sub;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-s, wl, s * 2, s);
      ctx.clip();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.roundRect(-s / 2 - 2, -s / 2 - 2, s + 4, s + 4, r);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = this.liquid.top;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(-s * 0.62, wl);
      ctx.quadraticCurveTo(0, wl + Math.sin(this.time * 4 + x) * 2.5, s * 0.62, wl);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Pose de la bouteille : repos (debout à droite) → versement (penchée au-dessus du verre). */
  private bottlePose() {
    const lay = this.layout!;
    const m = this.gm(this.main);
    const L = lay.bottleL;
    const t = this.pourAnim;
    const ease = t * t * (3 - 2 * t);
    // plateau de serveur : le 2e verre prend la place, la bouteille attend en l'air à droite
    const tray = this.glasses.length > 1;
    const restX = tray ? lay.W - L * 0.55 : Math.min(lay.W - L * 0.22, m.cx + m.Rt + L * 0.32);
    const restY = tray ? m.yTop - L * 0.4 : lay.tableY - L * 0.5 + 6;
    const pourX = m.cx + m.Rt * 0.95;
    const pourY = m.yTop - L * 0.42;
    const ang = lerp(tray ? -1.05 : 0.12, -2.06, ease) + (this.pouring ? Math.sin(this.time * 9) * 0.015 : 0);
    // arc de cercle entre les deux poses (la bouteille se soulève)
    const lift = Math.sin(ease * Math.PI) * L * 0.18;
    return { x: lerp(restX, pourX, ease), y: lerp(restY, pourY, ease) - lift, ang, L };
  }

  private bottleTip() {
    const p = this.bottlePose();
    const d = p.L * 0.5;
    return { x: p.x + Math.sin(p.ang) * d, y: p.y - Math.cos(p.ang) * d };
  }

  private drawBottle(ctx: CanvasRenderingContext2D) {
    const p = this.bottlePose();
    const L = p.L;
    const bw = L * 0.36;
    const bodyTop = -L * 0.12;
    const bodyBot = L * 0.5;
    const neckW = bw * 0.36;
    const neckTop = -L * 0.44;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.ang);
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(-neckW / 2, neckTop);
      ctx.lineTo(-neckW / 2, bodyTop - L * 0.1);
      ctx.quadraticCurveTo(-bw / 2, bodyTop - L * 0.06, -bw / 2, bodyTop + L * 0.06);
      ctx.lineTo(-bw / 2, bodyBot - bw * 0.2);
      ctx.quadraticCurveTo(-bw / 2, bodyBot, -bw / 2 + bw * 0.2, bodyBot);
      ctx.lineTo(bw / 2 - bw * 0.2, bodyBot);
      ctx.quadraticCurveTo(bw / 2, bodyBot, bw / 2, bodyBot - bw * 0.2);
      ctx.lineTo(bw / 2, bodyTop + L * 0.06);
      ctx.quadraticCurveTo(bw / 2, bodyTop - L * 0.06, neckW / 2, bodyTop - L * 0.1);
      ctx.lineTo(neckW / 2, neckTop);
      ctx.closePath();
    };
    // ombre dure
    ctx.save();
    ctx.translate(4, 5);
    shape();
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.restore();
    shape();
    ctx.fillStyle = this.liquid.body;
    ctx.fill();
    // verre de la bouteille vide en haut (le niveau reste horizontal… à peu près)
    ctx.save();
    shape();
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(-bw, neckTop - 10, bw * 2, bodyTop - neckTop + L * 0.02);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(bw * 0.18, bodyTop, bw, bodyBot - bodyTop);
    ctx.restore();
    shape();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // étiquette
    const ly = bodyTop + L * 0.14;
    const lh = L * 0.2;
    ctx.beginPath();
    ctx.roundRect(-bw / 2 - 1, ly, bw + 2, lh, 4);
    ctx.fillStyle = "#FFF6E5";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
    // étoile zinzin sur l'étiquette
    ctx.save();
    ctx.translate(0, ly + lh / 2);
    ctx.beginPath();
    const R1 = lh * 0.32;
    const R2 = R1 * 0.45;
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? R2 : R1;
      if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = "#FF3EA5";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // bague du goulot
    ctx.beginPath();
    ctx.roundRect(-neckW / 2 - 3, neckTop - 2, neckW + 6, L * 0.045, 3);
    ctx.fillStyle = "#FFD23F";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
    // reflet
    ctx.beginPath();
    ctx.moveTo(-bw * 0.3, bodyTop + L * 0.05);
    ctx.lineTo(-bw * 0.3, ly - 6);
    ctx.moveTo(-bw * 0.3, ly + lh + 8);
    ctx.lineTo(-bw * 0.3, bodyBot - bw * 0.3);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke();
    ctx.restore();
  }

  /** Filet de liquide du goulot jusqu'à la surface. */
  private drawStream(ctx: CanvasRenderingContext2D) {
    if (this.streamOn < 0.04) return;
    const tip = this.bottleTip();
    const m = this.main;
    const gm = this.gm(m);
    const u = clamp((tip.x - gm.cx) / Math.max(1, gm.rAt(m.L)), -0.8, 0.8);
    const hs = this.surfaceAt(m, u, 0.3);
    const endY = gm.yIb - hs * gm.Hi + gm.rAt(hs) * gm.ry * 0.3;
    const w = 3 + 6 * this.streamOn;
    const wob = Math.sin(this.time * 30) * 1.5;
    const pts: [number, number][] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([tip.x + wob * Math.sin(t * 9 + this.time * 20) * t + (gm.cx + u * gm.rAt(hs) - tip.x) * t * t * 0.4, lerp(tip.y + 4, endY, t)]);
    }
    const path = () => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    };
    path();
    ctx.lineWidth = w + 5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    path();
    ctx.lineWidth = w;
    ctx.strokeStyle = this.liquid.body;
    ctx.stroke();
    path();
    ctx.lineWidth = Math.max(1, w * 0.25);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.stroke();
    // anneau d'impact
    ctx.beginPath();
    ctx.ellipse(pts[n][0], endY, 10 + Math.sin(this.time * 25) * 3, 3.5, 0, 0, TAU);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.stroke();
  }

  /** Nappe de liquide qui coule par-dessus le bord pendant le débordement. */
  private drawSpillSheet(ctx: CanvasRenderingContext2D) {
    const sp = this.spill;
    if (!sp) return;
    const g = this.glasses[sp.g];
    const gm = this.gm(g);
    const lay = this.layout!;
    const k = clamp(sp.t / 0.45, 0, 1);
    const fade = clamp(2.6 - sp.t, 0, 1);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade;
    const endY = lerp(gm.yTop, lay.tableY + 18, k);
    if (sp.front) {
      // la nappe coule sur l'avant du verre
      const w = gm.Rt * 0.9;
      ctx.beginPath();
      ctx.moveTo(gm.cx - w, gm.yTop + gm.Rt * gm.ry * 0.8);
      ctx.quadraticCurveTo(gm.cx - w * 0.8, lerp(gm.yTop, endY, 0.5), gm.cx - w * 0.6, endY);
      ctx.lineTo(gm.cx + w * 0.6, endY);
      ctx.quadraticCurveTo(gm.cx + w * 0.8, lerp(gm.yTop, endY, 0.5), gm.cx + w, gm.yTop + gm.Rt * gm.ry * 0.8);
      ctx.closePath();
    } else {
      const d = sp.dir;
      const x0 = gm.cx + d * gm.Rt;
      const w = gm.Rt * 0.42;
      ctx.beginPath();
      ctx.moveTo(x0 - d * w, gm.yTop - 2);
      ctx.quadraticCurveTo(x0 + d * w * 0.5, gm.yTop - 14, x0 + d * w * 0.6, gm.yTop + 10);
      ctx.quadraticCurveTo(x0 + d * w * 0.9, lerp(gm.yTop, endY, 0.6), x0 + d * w * 1.3, endY);
      ctx.lineTo(x0 - d * w * 0.1, endY);
      ctx.quadraticCurveTo(x0 - d * w * 0.05, lerp(gm.yTop, endY, 0.4), x0 - d * w * 0.2, gm.yTop + 6);
      ctx.closePath();
    }
    const gr = ctx.createLinearGradient(0, gm.yTop, 0, endY);
    gr.addColorStop(0, this.liquid.top);
    gr.addColorStop(0.35, this.liquid.body);
    gr.addColorStop(1, this.liquid.deep);
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // reflet qui ondule dans la nappe
    if (!sp.front) {
      const x0 = gm.cx + sp.dir * gm.Rt;
      ctx.beginPath();
      ctx.moveTo(x0 + sp.dir * gm.Rt * 0.12, gm.yTop + 14);
      ctx.quadraticCurveTo(x0 + sp.dir * gm.Rt * (0.22 + 0.04 * Math.sin(this.time * 18)), lerp(gm.yTop, endY, 0.5), x0 + sp.dir * gm.Rt * 0.3, endY - 10);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.stroke();
    }
    ctx.restore();
  }

  /** La mascotte : un blob de la couleur du joueur, qui panique quand ça tangue. */
  private drawMascot(ctx: CanvasRenderingContext2D) {
    const lay = this.layout!;
    const S = lay.mascotS;
    const d = this.spill ? 1.2 : this.dangerSmooth;
    const jit = d > 0.5 ? (d - 0.5) * 5 : 0;
    const x = lay.mascotX + (Math.random() - 0.5) * jit;
    const squash = 1 + Math.sin(this.time * (3 + d * 10)) * (0.02 + d * 0.035);
    const bottom = lay.tableY + 16;
    const w = S;
    const h = S * 0.92 * squash;
    const top = bottom - h + (d > 1 ? -8 : 0);
    const cy = top + h / 2;
    // ombre
    ctx.beginPath();
    ctx.ellipse(x + 3, bottom + 2, w * 0.46, w * 0.09, 0, 0, TAU);
    ctx.fillStyle = "rgba(21,8,46,0.55)";
    ctx.fill();
    // bras levés quand ça va déborder
    if (d > 0.72) {
      const up = clamp((d - 0.72) / 0.3, 0, 1);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + s * w * 0.36, cy + h * 0.05);
        ctx.quadraticCurveTo(x + s * w * 0.62, cy - h * 0.1 * up, x + s * w * 0.56, cy - h * 0.55 * up + Math.sin(this.time * 20 + s) * 3);
        ctx.lineWidth = Math.max(7, S * 0.12) + 5;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.lineWidth = Math.max(7, S * 0.12);
        ctx.strokeStyle = this.mascotColor;
        ctx.stroke();
      }
    }
    // corps
    ctx.beginPath();
    ctx.moveTo(x - w / 2, bottom - h * 0.18);
    ctx.bezierCurveTo(x - w / 2, top + h * 0.05, x - w * 0.28, top, x, top);
    ctx.bezierCurveTo(x + w * 0.28, top, x + w / 2, top + h * 0.05, x + w / 2, bottom - h * 0.18);
    ctx.quadraticCurveTo(x + w / 2, bottom, x + w * 0.3, bottom);
    ctx.lineTo(x - w * 0.3, bottom);
    ctx.quadraticCurveTo(x - w / 2, bottom, x - w / 2, bottom - h * 0.18);
    ctx.closePath();
    ctx.fillStyle = this.mascotColor;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // reflet
    ctx.beginPath();
    ctx.ellipse(x - w * 0.24, top + h * 0.2, w * 0.08, h * 0.05, -0.6, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fill();
    // joues
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + s * w * 0.3, cy + h * 0.12, w * 0.08, w * 0.05, 0, 0, TAU);
      ctx.fill();
    }
    // yeux : suivent le point le plus haut du liquide
    const m = this.gm(this.main);
    const g = this.main;
    const hs = clamp(g.L + Math.hypot(g.sx, g.sz), 0, g.rim);
    const tx = m.cx + (g.sx >= 0 ? 1 : -1) * Math.min(1, Math.abs(g.sx) * 8) * m.rAt(hs);
    const ty = m.yIb - hs * m.Hi;
    const eyeR = S * (0.13 + d * 0.05);
    const ey = cy - h * 0.1;
    for (const s of [-1, 1]) {
      const ex = x + s * w * 0.17;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, TAU);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
      if (this.spill && this.spill.t > 0.2) {
        // yeux en croix… non : yeux en spirale de panique
        ctx.beginPath();
        for (let i = 0; i < 18; i++) {
          const a = i * 0.7 + this.time * 8;
          const r = (i / 18) * eyeR * 0.75;
          if (i) ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r); else ctx.moveTo(ex, ey);
        }
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        const ang = Math.atan2(ty - ey, tx - ex);
        const pr = eyeR * (0.55 - d * 0.22);
        const off = eyeR - pr - 1.5;
        ctx.beginPath();
        ctx.arc(ex + Math.cos(ang) * off, ey + Math.sin(ang) * off, pr, 0, TAU);
        ctx.fillStyle = INK;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + Math.cos(ang) * off - pr * 0.3, ey + Math.sin(ang) * off - pr * 0.35, pr * 0.32, 0, TAU);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
      // sourcils inquiets
      if (d > 0.35) {
        ctx.beginPath();
        ctx.moveTo(ex - s * eyeR * 0.9, ey - eyeR * 1.25);
        ctx.lineTo(ex + s * eyeR * 0.7, ey - eyeR * (1.25 + 0.5 * Math.min(1, d)));
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
    }
    // bouche
    const my = cy + h * 0.2;
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    if (d < 0.35) {
      ctx.beginPath();
      ctx.arc(x, my - S * 0.05, S * 0.12, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else if (d < 0.7) {
      ctx.beginPath();
      ctx.ellipse(x, my, S * 0.06, S * 0.07, 0, 0, TAU);
      ctx.fillStyle = INK;
      ctx.fill();
    } else {
      const open = S * (0.1 + 0.03 * Math.sin(this.time * 30));
      ctx.beginPath();
      ctx.ellipse(x, my + 2, S * 0.13, open, 0, 0, TAU);
      ctx.fillStyle = INK;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, my + 2 + open * 0.55, S * 0.08, open * 0.35, 0, 0, TAU);
      ctx.fillStyle = "#FF6B5B";
      ctx.fill();
    }
    // gouttes de sueur
    if (d > 0.55) {
      const t = (this.time * 1.4) % 1;
      const sx = x + w * 0.46;
      const sy = top + h * 0.2 + t * h * 0.4;
      ctx.beginPath();
      ctx.moveTo(sx, sy - S * 0.09);
      ctx.quadraticCurveTo(sx + S * 0.06, sy, sx, sy + S * 0.04);
      ctx.quadraticCurveTo(sx - S * 0.06, sy, sx, sy - S * 0.09);
      ctx.fillStyle = "#87DEFF";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }

  /** Niveau à bulle : la bulle file vers le côté le plus haut. */
  private drawLevel(ctx: CanvasRenderingContext2D) {
    const lay = this.layout!;
    const { levelX: x, levelY: y, levelR: R } = lay;
    const d = this.dangerSmooth;
    ctx.beginPath();
    ctx.arc(x + 2, y + 3, R, 0, TAU);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, R, 0, TAU);
    ctx.fillStyle = d > 0.75 ? "#FF6B5B" : d > 0.45 ? "#FFD23F" : "#3DDC97";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, R * 0.42, 0, TAU);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(21,8,46,0.5)";
    ctx.stroke();
    const k = R * 0.62;
    const bx = x - clamp(Math.tan(this.tiltX) / 0.3, -1, 1) * k;
    const by = y - clamp(Math.tan(this.tiltZ) / 0.3, -1, 1) * k;
    ctx.beginPath();
    ctx.arc(bx, by, R * 0.3, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
}
