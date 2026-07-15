import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ── Néon Rush ⚡ (Curve Fever / Achtung die Kurve) ─────────
// Chaque joueur est une courbe néon qui avance toute seule et laisse une
// traînée. Un seul contrôle : tourner à gauche / à droite. Toucher un mur ou
// une traînée = mort immédiate. Dernier vivant remporte la manche. Manches de
// 30-60 s, perdants éliminés en continu — parfait en mode apéro.

const TICK_MS = 33; // 30 Hz, comme block-runner / double-saut
const ARENA = 360; // unités logiques (carré)
const SPEED = 68; // u/s
const TURN_RATE = 3.3; // rad/s
const HEAD_R = 2.2;
const CELL = 3; // grille de collision
const SELF_GRACE_TICKS = 14; // on ignore sa propre traînée toute fraîche
const COUNTDOWN_MS = 2600;
const ROUND_END_MS = 3400;
const GAP_MS = 260; // durée d'un trou dans la traînée
const DRAW_MIN_MS = 1700; // durée de tracé entre deux trous
const DRAW_MAX_MS = 3300;
const START_DELAY = 1300;
const MAX_ROUNDS = 12; // garde-fou

type Phase = "waiting" | "countdown" | "playing" | "round-end" | "game-over";

interface Curve {
  id: string;
  name: string;
  colorIdx: number;
  x: number;
  y: number;
  angle: number;
  dir: -1 | 0 | 1; // input courant
  alive: boolean;
  points: number;
  gapping: boolean;
  gapTimer: number; // ms restantes dans l'état courant (tracé ou trou)
  deathX: number | null;
  deathY: number | null;
}

export class NeonRushGame extends BaseGame {
  curves: Map<string, Curve> = new Map();
  phase: Phase = "waiting";
  round = 0;
  roundSeq = 0; // change à chaque manche → le client efface son canvas
  targetScore = 5;
  tick = 0;
  // Grille d'occupation : "cx,cy" → { owner, tick }
  cells: Map<string, { owner: string; tick: number }> = new Map();
  feed: { id: number; text: string }[] = [];
  feedId = 0;
  deadline = 0;
  tickTimer: ReturnType<typeof setInterval> | null = null;
  timer: ReturnType<typeof setTimeout> | null = null;

  start() {
    this.started = true;
    this.clearTimer();
    this.timer = setTimeout(() => this.beginMatch(), START_DELAY);
  }

  beginMatch() {
    this.round = 0;
    this.feed = [];
    this.curves.clear();
    for (const [id, p] of this.players) {
      this.curves.set(id, this.freshCurve(id, p.name, this.curves.size));
    }
    const n = Math.max(2, this.curves.size);
    this.targetScore = Math.max(5, 3 * (n - 1));
    this.startRound();
  }

  restartIfFinished(): boolean {
    if (this.phase !== "game-over") return false;
    this.beginMatch();
    return true;
  }

  freshCurve(id: string, name: string, colorIdx: number): Curve {
    return {
      id,
      name,
      colorIdx,
      x: 0,
      y: 0,
      angle: 0,
      dir: 0,
      alive: true,
      points: 0,
      gapping: false,
      gapTimer: 0,
      deathX: null,
      deathY: null,
    };
  }

  pushFeed(text: string) {
    this.feed.push({ id: ++this.feedId, text });
    if (this.feed.length > 5) this.feed.shift();
  }

  // ── Manche ───────────────────────────────────────────────
  startRound() {
    this.stopTick();
    this.clearTimer();
    this.round++;
    this.roundSeq++;
    this.cells.clear();
    this.tick = 0;

    // Nouveaux joueurs arrivés entre deux manches → ils entrent en jeu
    for (const [id, p] of this.players) {
      if (!this.curves.has(id)) {
        this.curves.set(id, this.freshCurve(id, p.name, this.curves.size));
      }
    }
    // Joueurs partis → on les retire
    for (const id of this.curves.keys()) {
      if (!this.players.has(id)) this.curves.delete(id);
    }

    // Placement : cercle central, orientés vers l'extérieur (évite les morts au spawn)
    const list = [...this.curves.values()];
    const n = list.length;
    list.forEach((c, i) => {
      const slot = (i / Math.max(1, n)) * Math.PI * 2 + Math.random() * 0.5;
      const r = ARENA * 0.26 + Math.random() * ARENA * 0.08;
      c.x = ARENA / 2 + Math.cos(slot) * r;
      c.y = ARENA / 2 + Math.sin(slot) * r;
      c.angle = slot + (Math.random() - 0.5) * 0.9; // vers l'extérieur ± un peu
      c.dir = 0;
      c.alive = true;
      c.gapping = false;
      c.gapTimer = DRAW_MIN_MS + Math.random() * (DRAW_MAX_MS - DRAW_MIN_MS);
      c.deathX = null;
      c.deathY = null;
    });

    this.phase = "countdown";
    this.deadline = Date.now() + COUNTDOWN_MS;
    this.broadcastState();
    this.timer = setTimeout(() => {
      this.phase = "playing";
      this.broadcastState();
      this.tickTimer = setInterval(() => this.doTick(TICK_MS / 1000), TICK_MS);
    }, COUNTDOWN_MS);
  }

  // ── Tick 30 Hz ───────────────────────────────────────────
  doTick(dt: number) {
    if (this.phase !== "playing") return;
    this.tick++;

    // Bots : pilotage par échantillonnage devant (toutes les 3 ticks)
    if (this.tick % 3 === 0) {
      for (const c of this.curves.values()) {
        if (c.alive && this.isBot(c.id)) c.dir = this.botSteer(c);
      }
    }

    const deaths: Curve[] = [];
    for (const c of this.curves.values()) {
      if (!c.alive) continue;

      // Trous dans la traînée
      c.gapTimer -= dt * 1000;
      if (c.gapTimer <= 0) {
        c.gapping = !c.gapping;
        c.gapTimer = c.gapping
          ? GAP_MS
          : DRAW_MIN_MS + Math.random() * (DRAW_MAX_MS - DRAW_MIN_MS);
      }

      const prevX = c.x;
      const prevY = c.y;
      c.angle += c.dir * TURN_RATE * dt;
      c.x += Math.cos(c.angle) * SPEED * dt;
      c.y += Math.sin(c.angle) * SPEED * dt;

      // Mur
      if (c.x < HEAD_R || c.x > ARENA - HEAD_R || c.y < HEAD_R || c.y > ARENA - HEAD_R) {
        deaths.push(c);
        continue;
      }
      // Traînées (grille)
      if (this.hitTrail(c)) {
        deaths.push(c);
        continue;
      }
      // On marque le chemin parcouru (sauf pendant un trou)
      if (!c.gapping) this.markPath(c.id, prevX, prevY, c.x, c.y);
    }

    for (const c of deaths) {
      c.alive = false;
      c.deathX = c.x;
      c.deathY = c.y;
      // Tous les survivants marquent 1 point
      for (const other of this.curves.values()) {
        if (other.alive && other.id !== c.id) other.points++;
      }
      this.pushFeed(`💥 ${c.name} est éliminé !`);
    }

    const alive = [...this.curves.values()].filter((c) => c.alive);
    if (alive.length <= (this.curves.size > 1 ? 1 : 0)) {
      this.endRound(alive[0] ?? null);
      return;
    }

    // Paquet léger 30 Hz : têtes uniquement (le client trace lui-même)
    this.broadcast({
      type: "game-update",
      payload: {
        tick: this.tick,
        heads: [...this.curves.values()].map((c) => ({
          id: c.id,
          x: Math.round(c.x * 10) / 10,
          y: Math.round(c.y * 10) / 10,
          alive: c.alive,
          gapping: c.gapping,
          deathX: c.deathX,
          deathY: c.deathY,
          points: c.points,
        })),
        feed: this.feed,
      },
    });
  }

  hitTrail(c: Curve): boolean {
    const cx = Math.floor(c.x / CELL);
    const cy = Math.floor(c.y / CELL);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const hit = this.cells.get(`${cx + dx},${cy + dy}`);
        if (!hit) continue;
        // Sa propre traînée toute fraîche ne compte pas (sinon on meurt en tournant)
        if (hit.owner === c.id && this.tick - hit.tick < SELF_GRACE_TICKS) continue;
        return true;
      }
    }
    return false;
  }

  markPath(id: string, x0: number, y0: number, x1: number, y1: number) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (CELL / 2)));
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      const key = `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
      this.cells.set(key, { owner: id, tick: this.tick });
    }
  }

  // Bot : teste tout droit / gauche / droite, garde la direction la plus sûre
  botSteer(c: Curve): -1 | 0 | 1 {
    const dirs: (-1 | 0 | 1)[] = [0, -1, 1];
    let best: -1 | 0 | 1 = 0;
    let bestDist = -1;
    for (const d of dirs) {
      let x = c.x;
      let y = c.y;
      let a = c.angle;
      let dist = 0;
      for (let s = 0; s < 26; s++) {
        a += d * TURN_RATE * 0.066;
        x += Math.cos(a) * SPEED * 0.066;
        y += Math.sin(a) * SPEED * 0.066;
        if (x < HEAD_R || x > ARENA - HEAD_R || y < HEAD_R || y > ARENA - HEAD_R) break;
        const hit = this.cells.get(`${Math.floor(x / CELL)},${Math.floor(y / CELL)}`);
        if (hit && !(hit.owner === c.id && this.tick - hit.tick < SELF_GRACE_TICKS)) break;
        dist++;
      }
      // Petit bruit pour ne pas être robotique
      const score = dist + Math.random() * 3;
      if (score > bestDist) {
        bestDist = score;
        best = d;
      }
    }
    return best;
  }

  // ── Fin de manche / match ────────────────────────────────
  endRound(winner: Curve | null) {
    this.stopTick();
    if (winner) {
      this.pushFeed(`👑 ${winner.name} remporte la manche ${this.round} !`);
    }
    const champion = [...this.curves.values()].find((c) => c.points >= this.targetScore);
    if (champion || this.round >= MAX_ROUNDS) {
      this.finishMatch();
      return;
    }
    this.phase = "round-end";
    this.deadline = Date.now() + ROUND_END_MS;
    this.broadcastState();
    this.clearTimer();
    this.timer = setTimeout(() => this.startRound(), ROUND_END_MS);
  }

  finishMatch() {
    this.stopTick();
    this.clearTimer();
    this.phase = "game-over";
    const sorted = [...this.curves.values()].sort((a, b) => b.points - a.points);
    const rankings: GameRanking[] = sorted.map((c, i) => ({
      playerId: c.id,
      playerName: c.name,
      rank: i + 1,
      score: c.points,
    }));
    this.broadcastState();
    setTimeout(() => this.endGame(rankings), 600);
  }

  // ── Messages ─────────────────────────────────────────────
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const player = this.findPlayerByConnection(sender.id);
    if (!player) return;

    if (action === "turn") {
      const c = this.curves.get(player.id);
      const dir = Number(payload.dir);
      if (c && c.alive && (dir === -1 || dir === 0 || dir === 1)) {
        c.dir = dir as -1 | 0 | 1;
      }
      return;
    }
  }

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  // ── State ────────────────────────────────────────────────
  getState(): Record<string, unknown> {
    return {
      phase: this.phase,
      round: this.round,
      roundSeq: this.roundSeq,
      targetScore: this.targetScore,
      arena: ARENA,
      deadline: this.deadline,
      feed: this.feed,
      players: [...this.curves.values()].map((c) => ({
        id: c.id,
        name: c.name,
        colorIdx: c.colorIdx,
        x: Math.round(c.x * 10) / 10,
        y: Math.round(c.y * 10) / 10,
        angle: Math.round(c.angle * 100) / 100,
        alive: c.alive,
        points: c.points,
      })),
    };
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  stopTick() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  cleanup() {
    this.clearTimer();
    this.stopTick();
    this.clearBotTimeouts();
  }
}
