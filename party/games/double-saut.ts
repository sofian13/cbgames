import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import { LEVELS, LEVEL_COUNT, parseLevel, TILE, VW, VH, type ParsedLevel } from "./double-saut-levels";

/* ──────────────────────────────────────────────────────────────
   DOUBLE SAUT — serveur autoritaire (coop à deux).
   Port fidèle de la physique de pf-game.js (le rendu reste client).
   Pas fixe 1/120, tick réseau ~30 Hz. Mort partagée, 6 niveaux.
   ────────────────────────────────────────────────────────────── */

// ── Physique (identique au prototype) ──
const DT = 1 / 120;
const GRAV = 2700, MOVE = 330, JUMP = 1040, MAXFALL = 1500;
const COYOTE = 0.10, BUFFER = 0.12;
const ESPEED = 78, PSPEED = 250, PINTERVAL = 1.9;
const SAW_R = 26;
const TICK_MS = 33;
const COLORS = ["purple", "pink"];

type Status = "intro" | "play" | "dead" | "clear" | "win";

interface Control { moveX: number; jumpHeld: boolean; jumpQueued: boolean }

interface SimPlayer {
  x: number; y: number; w: number; h: number;
  vx: number; vy: number; onGround: boolean; facing: number;
  color: string; idx: number; alive: boolean;
  coyote: number; buffer: number; squash: number; runT: number;
  atGoal: boolean; deathT: number;
}
interface SimEnemy { x: number; y: number; w: number; h: number; dir: number; vx: number; vy: number; onGround: boolean; alive: boolean; dead: number }
interface SimShooter { x: number; y: number; dir: number; t: number }
interface SimProjectile { x: number; y: number; vx: number; life: number; ph: number }
interface SimCoin { x: number; y: number; taken: boolean }
type CrumbleState = "idle" | "shake" | "gone";

export class DoubleSautGame extends BaseGame {
  playerOrder: string[] = [];
  controls: Map<string, Control> = new Map();

  status: Status = "intro";
  statusT = 0;
  index = 0;
  deaths = 0;
  carryDeaths = false;
  cameraX = 0;

  level!: ParsedLevel;
  W = 0; H = 0; pixelW = 0;
  tiles: number[][] = [];

  blobs: SimPlayer[] = [];
  enemies: SimEnemy[] = [];
  shooters: SimShooter[] = [];
  projectiles: SimProjectile[] = [];
  coins: SimCoin[] = [];
  crumbles: Map<string, { state: CrumbleState; t: number }> = new Map();
  starsTotal = 0;

  tickTimer: ReturnType<typeof setInterval> | null = null;
  acc = 0;

  // ─────────── Joueurs (connexions) ───────────
  addPlayer(id: string, name: string, conn: Connection) {
    super.addPlayer(id, name, conn);
    if (!this.playerOrder.includes(id)) this.playerOrder.push(id);
    if (!this.controls.has(id)) this.controls.set(id, { moveX: 0, jumpHeld: false, jumpQueued: false });
    this.broadcastState();
  }

  removePlayer(connectionId: string) {
    const removed = super.removePlayer(connectionId);
    if (!removed) return null;
    this.playerOrder = this.playerOrder.filter((id) => id !== removed.id);
    this.controls.delete(removed.id);
    if (this.players.size === 0) this.stopTick();
    if (this.started && this.activeIds().length < 2) {
      // plus assez de joueurs : retour au salon
      this.started = false;
      this.stopTick();
    }
    this.broadcastState();
    return removed;
  }

  activeIds(): string[] {
    return this.playerOrder.filter((id) => this.players.has(id)).slice(0, 2);
  }

  // ─────────── Niveau / reset ───────────
  loadLevel(i: number) {
    this.index = i;
    this.level = parseLevel(LEVELS[i]);
    this.W = this.level.W; this.H = this.level.H; this.pixelW = this.level.pixelW;
    this.tiles = this.level.tiles;
    this.status = "intro"; this.statusT = 0;
    if (!this.carryDeaths) this.deaths = 0;
    this.crumbles = new Map();
    for (let y = 0; y < this.H; y++)
      for (let x = 0; x < this.W; x++)
        if (this.tiles[y][x] === 3) this.crumbles.set(x + "," + y, { state: "idle", t: 0 });
    this.starsTotal = this.level.coins.length;
    this.resetEntities();
    this.broadcastState();
  }

  makePlayer(spawn: { x: number; y: number }, color: string, idx: number): SimPlayer {
    return {
      x: spawn.x + (TILE - 34) / 2, y: spawn.y + (TILE - 42), w: 34, h: 42,
      vx: 0, vy: 0, onGround: false, facing: 1, color, idx,
      alive: true, coyote: 0, buffer: 0, squash: 0, runT: 0, atGoal: false, deathT: 0,
    };
  }
  resetEntities() {
    const e = this.level;
    const s1 = e.p1 ?? { x: 0, y: 0 };
    const s2 = e.p2 ?? s1;
    this.blobs = [this.makePlayer(s1, COLORS[0], 0), this.makePlayer(s2, COLORS[1], 1)];
    this.enemies = e.enemies.map((o) => ({ x: o.x, y: o.y, w: o.w, h: o.h, dir: o.dir, vx: 0, vy: 0, onGround: false, alive: true, dead: 0 }));
    this.shooters = e.shooters.map((o) => ({ x: o.x, y: o.y, dir: o.dir, t: Math.random() * PINTERVAL }));
    this.coins = e.coins.map((o) => ({ x: o.x, y: o.y, taken: false }));
    this.projectiles = [];
    for (const c of this.crumbles.values()) { c.state = "idle"; c.t = 0; }
    this.cameraX = this.clampCam(this.blobs[0].x - VW / 2);
  }
  softReset() {
    this.deaths++;
    this.resetEntities();
    this.status = "play"; this.statusT = 0;
    this.broadcastState();
  }
  clampCam(x: number) { return Math.max(0, Math.min(this.pixelW - VW, x)); }

  // ─────────── Collisions ───────────
  solidAt(cx: number, cy: number): boolean {
    if (cx < 0 || cx >= this.W) return true;
    if (cy < 0 || cy >= this.H) return false;
    const t = this.tiles[cy][cx];
    if (t === 1) return true;
    if (t === 3) { const c = this.crumbles.get(cx + "," + cy); return !(c && c.state === "gone"); }
    return false;
  }
  spikeAt(cx: number, cy: number) {
    return cy >= 0 && cy < this.H && cx >= 0 && cx < this.W && this.tiles[cy][cx] === 2;
  }

  collideX(b: { x: number; y: number; w: number; h: number; vx: number }) {
    const top = Math.floor((b.y + 2) / TILE), bot = Math.floor((b.y + b.h - 2) / TILE);
    if (b.vx > 0) {
      const col = Math.floor((b.x + b.w) / TILE);
      for (let r = top; r <= bot; r++) if (this.solidAt(col, r)) { b.x = col * TILE - b.w; b.vx = 0; break; }
    } else if (b.vx < 0) {
      const col = Math.floor(b.x / TILE);
      for (let r = top; r <= bot; r++) if (this.solidAt(col, r)) { b.x = (col + 1) * TILE; b.vx = 0; break; }
    }
  }
  collideY(
    b: { x: number; y: number; w: number; h: number; vy: number; onGround: boolean },
    isPlayer: boolean,
    sp?: SimPlayer
  ) {
    const left = Math.floor((b.x + 3) / TILE), right = Math.floor((b.x + b.w - 3) / TILE);
    b.onGround = false;
    if (b.vy > 0) {
      const row = Math.floor((b.y + b.h) / TILE);
      for (let c = left; c <= right; c++) if (this.solidAt(c, row)) {
        b.y = row * TILE - b.h;
        if (b.vy > 60 && isPlayer && sp && sp.squash > -0.1) sp.squash = 0.32;
        b.vy = 0; b.onGround = true;
        if (isPlayer && this.tiles[row][c] === 3) this.triggerCrumble(c, row);
        break;
      }
    } else if (b.vy < 0) {
      const row = Math.floor(b.y / TILE);
      for (let c = left; c <= right; c++) if (this.solidAt(c, row)) { b.y = (row + 1) * TILE; b.vy = 0; break; }
    }
  }
  triggerCrumble(cx: number, cy: number) {
    const c = this.crumbles.get(cx + "," + cy);
    if (c && c.state === "idle") { c.state = "shake"; c.t = 0; }
  }

  // ─────────── Joueur ───────────
  updatePlayer(p: SimPlayer, control: Control, dt: number) {
    if (!p.alive) { p.deathT += dt; p.vy = Math.min(p.vy + GRAV * dt, MAXFALL); p.y += p.vy * dt; p.x += p.vx * dt; return; }
    p.vx = control.moveX * MOVE;
    if (control.moveX > 0.06) p.facing = 1; else if (control.moveX < -0.06) p.facing = -1;
    if (control.jumpQueued) { p.buffer = BUFFER; control.jumpQueued = false; }
    if (p.onGround) p.coyote = COYOTE; else p.coyote -= dt;
    p.buffer -= dt;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -JUMP; p.coyote = 0; p.buffer = 0; p.onGround = false; p.squash = -0.34;
    }
    if (!control.jumpHeld && p.vy < -JUMP * 0.42) p.vy = -JUMP * 0.42;
    p.vy = Math.min(p.vy + GRAV * dt, MAXFALL);
    p.x += p.vx * dt; this.collideX(p);
    p.y += p.vy * dt; this.collideY(p, true, p);
    p.x = Math.max(0, Math.min(this.pixelW - p.w, p.x));
    p.squash += (0 - p.squash) * Math.min(1, dt * 12);
    if (p.onGround && Math.abs(p.vx) > 30) p.runT += dt * 14; else p.runT *= 0.9;
  }

  killPlayer(p: SimPlayer) {
    if (!p.alive || this.status !== "play") return;
    p.alive = false; p.deathT = 0; p.vy = -360; p.vx = (Math.random() - 0.5) * 120;
    this.status = "dead"; this.statusT = 0;
  }

  playerHazards(p: SimPlayer) {
    if (!p.alive) return;
    if (p.y > VH + 80) { this.killPlayer(p); return; }
    const l = Math.floor((p.x + 6) / TILE), r = Math.floor((p.x + p.w - 6) / TILE);
    const t = Math.floor((p.y + 6) / TILE), b = Math.floor((p.y + p.h - 4) / TILE);
    for (let cy = t; cy <= b; cy++) for (let cx = l; cx <= r; cx++) if (this.spikeAt(cx, cy)) { this.killPlayer(p); return; }
    for (const s of this.level.saws) {
      const dx = (p.x + p.w / 2) - s.x, dy = (p.y + p.h / 2) - s.y;
      if (dx * dx + dy * dy < (SAW_R + 12) * (SAW_R + 12)) { this.killPlayer(p); return; }
    }
    for (const pr of this.projectiles) {
      if (p.x < pr.x + 9 && p.x + p.w > pr.x - 9 && p.y < pr.y + 9 && p.y + p.h > pr.y - 9) { this.killPlayer(p); return; }
    }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (p.x < e.x + e.w && p.x + p.w > e.x && p.y < e.y + e.h && p.y + p.h > e.y) {
        if (p.vy > 0 && (p.y + p.h) - e.y < 24) {
          e.alive = false; e.dead = 0; p.vy = -560; p.squash = -0.28;
        } else { this.killPlayer(p); return; }
      }
    }
    for (const c of this.coins) {
      if (c.taken) continue;
      const dx = (p.x + p.w / 2) - c.x, dy = (p.y + p.h / 2) - c.y;
      if (dx * dx + dy * dy < 30 * 30) { c.taken = true; this.broadcast({ type: "game-update", payload: { event: "coin" } }); }
    }
    if (this.level.goal) {
      const g = this.level.goal;
      p.atGoal = p.x + p.w > g.x + 6 && p.x < g.x + TILE + 4 && p.y + p.h > g.y && p.y < g.y + TILE * 2;
    }
  }

  updateEnemy(e: SimEnemy, dt: number) {
    if (!e.alive) { e.dead += dt; return; }
    e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
    e.x += e.dir * ESPEED * dt;
    const midRow = Math.floor((e.y + e.h / 2) / TILE);
    const aheadCol = Math.floor((e.dir > 0 ? e.x + e.w : e.x) / TILE);
    if (this.solidAt(aheadCol, midRow)) e.dir *= -1;
    const footRow = Math.floor((e.y + e.h + 4) / TILE);
    const frontCol = Math.floor((e.dir > 0 ? e.x + e.w + 3 : e.x - 3) / TILE);
    if (!this.solidAt(frontCol, footRow)) e.dir *= -1;
    this.collideX(e);
    e.y += e.vy * dt; this.collideY(e, false);
  }
  updateShooter(sh: SimShooter, dt: number) {
    sh.t += dt;
    if (sh.t >= PINTERVAL) {
      sh.t = 0;
      this.projectiles.push({ x: sh.x + sh.dir * 18, y: sh.y, vx: sh.dir * PSPEED, life: 6, ph: 0 });
      this.broadcast({ type: "game-update", payload: { event: "shoot" } });
    }
  }
  updateProjectiles(dt: number) {
    for (const pr of this.projectiles) {
      pr.x += pr.vx * dt; pr.life -= dt; pr.ph += dt;
      const cx = Math.floor(pr.x / TILE), cy = Math.floor(pr.y / TILE);
      if (this.solidAt(cx, cy)) pr.life = -1;
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0 && p.x > -200 && p.x < this.pixelW + 200);
  }
  updateCrumbles(dt: number) {
    for (const c of this.crumbles.values()) {
      if (c.state === "shake") { c.t += dt; if (c.t > 0.5) { c.state = "gone"; c.t = 0; } }
      else if (c.state === "gone") { c.t += dt; if (c.t > 2.6) { c.state = "idle"; c.t = 0; } }
    }
  }

  // ─────────── Boucle de simulation ───────────
  step(dt: number) {
    if (this.status === "intro") { this.statusT += dt; if (this.statusT > 1.3) { this.status = "play"; this.statusT = 0; } return; }
    if (this.status === "dead") {
      this.statusT += dt;
      for (const p of this.blobs) if (!p.alive) { p.vy = Math.min(p.vy + GRAV * dt, MAXFALL); p.y += p.vy * dt; }
      if (this.statusT > 0.95) this.softReset();
      return;
    }
    if (this.status === "win") { this.statusT += dt; return; }
    if (this.status === "clear") {
      this.statusT += dt;
      if (this.statusT > 1.7) {
        if (this.index + 1 < LEVEL_COUNT) { this.carryDeaths = false; this.loadLevel(this.index + 1); }
        else { this.status = "win"; this.statusT = 0; this.stopTick(); this.broadcastState(); }
      }
      return;
    }

    // ── play ──
    const ids = this.activeIds();
    for (let i = 0; i < 2; i++) {
      const ctrl = this.controls.get(ids[i]) ?? { moveX: 0, jumpHeld: false, jumpQueued: false };
      this.updatePlayer(this.blobs[i], ctrl, dt);
    }
    this.enemies.forEach((e) => this.updateEnemy(e, dt));
    this.shooters.forEach((sh) => this.updateShooter(sh, dt));
    this.updateProjectiles(dt);
    this.updateCrumbles(dt);
    for (const p of this.blobs) this.playerHazards(p);

    if (this.status === "play" && this.blobs.every((p) => p.alive && p.atGoal)) {
      this.status = "clear"; this.statusT = 0;
      this.broadcast({ type: "game-update", payload: { event: "win" } });
    }

    const cs = this.blobs.filter((p) => p.alive);
    const mid = cs.length ? cs.reduce((a, p) => a + p.x + p.w / 2, 0) / cs.length : this.blobs[0].x;
    this.cameraX += (this.clampCam(mid - VW / 2) - this.cameraX) * Math.min(1, dt * 6);
    this.cameraX = this.clampCam(this.cameraX);
  }

  // ─────────── Tick réseau ───────────
  startTick() {
    if (this.tickTimer) return;
    this.acc = 0;
    this.tickTimer = setInterval(() => this.tick(TICK_MS / 1000), TICK_MS);
  }
  stopTick() {
    if (!this.tickTimer) return;
    clearInterval(this.tickTimer);
    this.tickTimer = null;
  }
  tick(real: number) {
    if (!this.started) return;
    this.acc += Math.min(real, 0.1);
    let guard = 0;
    while (this.acc >= DT && guard < 16) { this.step(DT); this.acc -= DT; guard++; }
    this.broadcastState();
  }

  // ─────────── Cycle de vie ───────────
  start() {
    if (this.started) return;
    if (this.activeIds().length < 2) return;
    this.started = true;
    this.carryDeaths = false;
    for (const c of this.controls.values()) { c.moveX = 0; c.jumpHeld = false; c.jumpQueued = false; }
    this.loadLevel(0);
    this.startTick();
  }
  restartLevel() {
    if (!this.started) return;
    this.deaths++;
    this.resetEntities();
    this.status = "intro"; this.statusT = 0;
    if (!this.tickTimer) this.startTick();
    this.broadcastState();
  }
  restartGame() {
    if (!this.started) return;
    this.carryDeaths = false;
    this.loadLevel(0);
    if (!this.tickTimer) this.startTick();
  }

  findPlayerByConn(connId: string) {
    for (const [, pl] of this.players) if (pl.connectionId === connId) return pl;
    return null;
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const me = this.findPlayerByConn(sender.id);
    if (!me) return;
    const slot = this.activeIds().indexOf(me.id); // 0,1 ou -1 (spectateur)
    const ctrl = this.controls.get(me.id);

    switch (action) {
      case "start":
        this.start();
        break;
      case "restart-level":
        this.restartLevel();
        break;
      case "restart-game":
        this.restartGame();
        break;
      case "input":
        if (ctrl && slot >= 0) ctrl.moveX = Math.max(-1, Math.min(1, Number(payload.moveX) || 0));
        break;
      case "jump-down":
        if (ctrl && slot >= 0) { ctrl.jumpHeld = true; ctrl.jumpQueued = true; }
        break;
      case "jump-up":
        if (ctrl && slot >= 0) ctrl.jumpHeld = false;
        break;
    }
  }

  getState(): Record<string, unknown> {
    const ids = this.activeIds();
    const slotPlayers = this.blobs.map((p, i) => {
      const id = ids[i] ?? null;
      const meta = id ? this.players.get(id) : null;
      return {
        id,
        name: meta?.name ?? `J${i + 1}`,
        x: p.x, y: p.y, w: p.w, h: p.h, vx: p.vx, facing: p.facing,
        onGround: p.onGround, alive: p.alive, squash: p.squash, runT: p.runT,
        atGoal: p.atGoal, deathT: p.deathT, color: p.color, idx: p.idx,
      };
    });
    const crumbles: Record<string, string> = {};
    for (const [k, c] of this.crumbles) if (c.state !== "idle") crumbles[k] = c.state;

    const def = this.level?.def;
    return {
      started: this.started,
      status: this.status,
      statusT: this.statusT,
      index: this.index,
      levelCount: LEVEL_COUNT,
      deaths: this.deaths,
      starsTotal: this.starsTotal,
      name: def?.name ?? "",
      accent: def?.accent ?? "#7A4EE8",
      sky: def?.sky ?? "purple",
      pixelW: this.pixelW,
      cameraX: this.cameraX,
      slotIds: ids,
      lobby: this.playerOrder
        .filter((id) => this.players.has(id))
        .map((id) => ({ id, name: this.players.get(id)!.name })),
      players: this.started ? slotPlayers : [],
      enemies: this.enemies.map((e) => ({ x: e.x, y: e.y, w: e.w, h: e.h, alive: e.alive, dead: e.dead, dir: e.dir })),
      projectiles: this.projectiles.map((p) => ({ x: p.x, y: p.y, vx: p.vx })),
      coinsTaken: this.coins.map((c) => c.taken),
      crumbles,
    };
  }

  restartIfFinished(): boolean {
    if (this.status === "win") {
      this.started = false;
      this.status = "intro";
      this.broadcastState();
      return true;
    }
    return false;
  }

  cleanup() {
    this.stopTick();
  }
}
