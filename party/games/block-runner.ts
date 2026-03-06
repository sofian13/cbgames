import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";

type RunnerPhase = "waiting" | "playing" | "failed" | "finished";

type RunnerPlayer = {
  id: string;
  name: string;
  x: number;
  y: number;
  vy: number;
  alive: boolean;
  finished: boolean;
  color: string;
  inputX: number;
  jumpQueued: boolean;
};

type Enemy = {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  vx: number;
  minX: number;
  maxX: number;
};

type Trap = { x: number; w: number };
type Level = { id: number; goalX: number; enemies: Enemy[]; traps: Trap[] };

const MAX_PLAYERS = 5;
const PLAYER_W = 28;
const PLAYER_H = 28;
const ENEMY_H = 24;
const MOVE_SPEED = 240;
const GRAVITY = 1500;
const JUMP_VELOCITY = 560;
const TICK_MS = 50;

const COLOR_POOL = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"] as const;

function overlaps(aX: number, aW: number, bX: number, bW: number) {
  return aX < bX + bW && aX + aW > bX;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelTemplate(): Level[] {
  return [
    {
      id: 1,
      goalX: 1800,
      traps: [{ x: 450, w: 110 }, { x: 980, w: 120 }, { x: 1360, w: 90 }],
      enemies: [
        { x: 320, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 60, minX: 260, maxX: 390 },
        { x: 760, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 70, minX: 700, maxX: 840 },
        { x: 1240, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 75, minX: 1190, maxX: 1310 },
      ],
    },
    {
      id: 2,
      goalX: 2200,
      traps: [{ x: 390, w: 100 }, { x: 810, w: 110 }, { x: 1190, w: 120 }, { x: 1670, w: 120 }],
      enemies: [
        { x: 250, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 85, minX: 200, maxX: 320 },
        { x: 620, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 90, minX: 570, maxX: 710 },
        { x: 1080, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 95, minX: 1010, maxX: 1160 },
        { x: 1560, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 110, minX: 1490, maxX: 1650 },
      ],
    },
    {
      id: 3,
      goalX: 2550,
      traps: [{ x: 320, w: 110 }, { x: 730, w: 120 }, { x: 1110, w: 110 }, { x: 1510, w: 130 }, { x: 1990, w: 120 }],
      enemies: [
        { x: 220, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 120, minX: 160, maxX: 300 },
        { x: 560, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 110, minX: 500, maxX: 650 },
        { x: 930, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 120, minX: 870, maxX: 1020 },
        { x: 1380, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 125, minX: 1310, maxX: 1460 },
        { x: 1840, y: 0, w: 32, h: ENEMY_H, alive: true, vx: 130, minX: 1760, maxX: 1920 },
      ],
    },
  ];
}

function cloneLevel(level: Level): Level {
  return {
    ...level,
    traps: level.traps.map((t) => ({ ...t })),
    enemies: level.enemies.map((e) => ({ ...e })),
  };
}

export class BlockRunnerGame extends BaseGame {
  phase: RunnerPhase = "waiting";
  playerCount = 1;
  levelIndex = 0;
  attempt = 1;
  failMessage: string | null = null;
  levels: Level[] = levelTemplate();
  statePlayers: Map<string, RunnerPlayer> = new Map();
  playerOrder: string[] = [];
  tickTimer: ReturnType<typeof setInterval> | null = null;

  addPlayer(id: string, name: string, conn: Connection) {
    super.addPlayer(id, name, conn);
    if (!this.playerOrder.includes(id)) this.playerOrder.push(id);
    if (!this.statePlayers.has(id)) {
      const taken = new Set(Array.from(this.statePlayers.values()).map((p) => p.color));
      const color = COLOR_POOL.find((c) => !taken.has(c)) ?? COLOR_POOL[0];
      this.statePlayers.set(id, {
        id,
        name,
        x: 0,
        y: 0,
        vy: 0,
        alive: true,
        finished: false,
        color,
        inputX: 0,
        jumpQueued: false,
      });
    } else {
      const p = this.statePlayers.get(id)!;
      p.name = name;
    }
    this.broadcastState();
  }

  removePlayer(connectionId: string) {
    const removed = super.removePlayer(connectionId);
    if (!removed) return null;
    this.playerOrder = this.playerOrder.filter((id) => id !== removed.id);
    this.statePlayers.delete(removed.id);
    if (this.players.size === 0) this.stopTick();
    if (this.phase === "playing") {
      const active = this.getActivePlayers();
      if (active.length === 0) {
        this.phase = "waiting";
      }
    }
    this.broadcastState();
    return removed;
  }

  getActivePlayers() {
    return this.playerOrder
      .filter((id) => this.players.has(id))
      .slice(0, this.playerCount)
      .map((id) => this.statePlayers.get(id))
      .filter((p): p is RunnerPlayer => !!p);
  }

  resetPlayersForLevel() {
    for (const player of this.getActivePlayers()) {
      player.x = 0;
      player.y = 0;
      player.vy = 0;
      player.alive = true;
      player.finished = false;
      player.inputX = 0;
      player.jumpQueued = false;
    }
  }

  currentLevel() {
    return this.levels[this.levelIndex];
  }

  start() {
    if (this.phase === "playing") return;
    this.phase = "playing";
    this.levelIndex = 0;
    this.attempt = 1;
    this.failMessage = null;
    this.levels = levelTemplate();
    this.resetPlayersForLevel();
    this.startTick();
    this.broadcastState();
  }

  startTick() {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => this.tick(TICK_MS / 1000), TICK_MS);
  }

  stopTick() {
    if (!this.tickTimer) return;
    clearInterval(this.tickTimer);
    this.tickTimer = null;
  }

  restartLevel(auto = false) {
    const original = levelTemplate()[this.levelIndex];
    this.levels[this.levelIndex] = cloneLevel(original);
    this.resetPlayersForLevel();
    this.phase = "playing";
    if (auto) this.attempt += 1;
    this.failMessage = null;
    this.broadcastState();
  }

  gotoNextLevel() {
    if (this.levelIndex >= this.levels.length - 1) {
      this.phase = "finished";
      this.stopTick();
      this.broadcastState();
      return;
    }
    this.levelIndex += 1;
    this.resetPlayersForLevel();
    this.phase = "playing";
    this.broadcastState();
  }

  tick(dt: number) {
    if (this.phase !== "playing") return;
    const level = this.currentLevel();
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) return;

    for (const enemy of level.enemies) {
      if (!enemy.alive) continue;
      enemy.x += enemy.vx * dt;
      if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
        enemy.vx *= -1;
        enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX);
      }
    }

    for (const player of activePlayers) {
      if (!player.alive || player.finished) continue;

      const prevY = player.y;
      player.x = clamp(player.x + player.inputX * MOVE_SPEED * dt, 0, level.goalX);

      if (player.jumpQueued && player.y <= 0.5) {
        player.vy = JUMP_VELOCITY;
      }
      player.jumpQueued = false;

      player.vy -= GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y <= 0) {
        player.y = 0;
        if (player.vy < 0) player.vy = 0;
      }

      const trapHit = level.traps.some((trap) => overlaps(player.x, PLAYER_W, trap.x, trap.w) && player.y <= 0.1);
      if (trapHit) {
        player.alive = false;
        continue;
      }

      for (const enemy of level.enemies) {
        if (!enemy.alive) continue;
        if (!overlaps(player.x, PLAYER_W, enemy.x, enemy.w)) continue;
        const enemyTop = enemy.h;
        const stomped = prevY > enemyTop + 6 && player.y <= enemyTop + 6 && player.vy < 0;
        if (stomped) {
          enemy.alive = false;
          player.vy = JUMP_VELOCITY * 0.7;
        } else if (player.y < enemyTop + PLAYER_H - 2) {
          player.alive = false;
        }
      }

      if (player.x >= level.goalX) {
        player.finished = true;
      }
    }

    if (activePlayers.some((p) => !p.alive)) {
      this.phase = "failed";
      this.failMessage = "Un joueur est mort. Recommencer...";
      this.broadcastState();
      setTimeout(() => this.restartLevel(true), 1100);
      return;
    }

    if (activePlayers.every((p) => p.finished)) {
      if (this.levelIndex >= this.levels.length - 1) {
        this.phase = "finished";
        this.stopTick();
        this.broadcastState();
        return;
      }
      this.phase = "failed";
      this.failMessage = "Niveau valide. Niveau suivant...";
      this.broadcastState();
      setTimeout(() => this.gotoNextLevel(), 1100);
      return;
    }

    this.broadcastState();
  }

  onMessage(message: Record<string, unknown>, sender: Connection) {
    const senderPlayer = this.findGamePlayerByConnection(sender.id);
    if (!senderPlayer) return;

    const action = String(message.action ?? "");

    if (action === "set-player-count") {
      if (this.phase !== "waiting") return;
      const requested = Number(message.count);
      if (!Number.isFinite(requested)) return;
      this.playerCount = clamp(Math.floor(requested), 1, MAX_PLAYERS);
      this.broadcastState();
      return;
    }

    if (action === "set-color") {
      if (this.phase !== "waiting") return;
      const color = String(message.color ?? "");
      if (!COLOR_POOL.includes(color as (typeof COLOR_POOL)[number])) return;
      const isTaken = this.getActivePlayers().some((p) => p.id !== senderPlayer.id && p.color === color);
      if (isTaken) return;
      const me = this.statePlayers.get(senderPlayer.id);
      if (!me) return;
      me.color = color;
      this.broadcastState();
      return;
    }

    if (action === "start-game") {
      this.start();
      return;
    }

    if (action === "restart-level") {
      if (this.phase === "playing" || this.phase === "failed") {
        this.restartLevel(false);
      }
      return;
    }

    if (action === "input") {
      if (this.phase !== "playing") return;
      const me = this.statePlayers.get(senderPlayer.id);
      if (!me) return;
      me.inputX = clamp(Number(message.moveX ?? 0), -1, 1);
      return;
    }

    if (action === "jump") {
      if (this.phase !== "playing") return;
      const me = this.statePlayers.get(senderPlayer.id);
      if (!me) return;
      me.jumpQueued = true;
      return;
    }
  }

  getState() {
    const activeIds = new Set(this.playerOrder.filter((id) => this.players.has(id)).slice(0, this.playerCount));
    const activePlayers = Array.from(activeIds).map((id) => this.statePlayers.get(id)).filter((p): p is RunnerPlayer => !!p);
    const spectators = this.playerOrder.filter((id) => this.players.has(id) && !activeIds.has(id));
    const level = this.currentLevel();

    return {
      phase: this.phase,
      playerCount: this.playerCount,
      levelIndex: this.levelIndex,
      levelCount: this.levels.length,
      attempt: this.attempt,
      failMessage: this.failMessage,
      myPlayerId: null,
      players: activePlayers.map((p) => ({
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        alive: p.alive,
        finished: p.finished,
        color: p.color,
      })),
      spectators: spectators.map((id) => {
        const p = this.players.get(id);
        return { id, name: p?.name ?? "Spectateur" };
      }),
      level: {
        id: level.id,
        goalX: level.goalX,
        traps: level.traps,
        enemies: level.enemies.map((e) => ({ x: e.x, y: e.y, w: e.w, h: e.h, alive: e.alive })),
      },
      palette: [...COLOR_POOL],
    };
  }

  getStateForPlayer(playerId: string) {
    return {
      ...this.getState(),
      myPlayerId: playerId,
    };
  }

  broadcastState() {
    for (const [playerId, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(playerId),
      });
    }
  }

  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  cleanup() {
    this.stopTick();
  }
}
