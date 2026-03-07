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

type Trap = {
  x: number;
  w: number;
};

type Gap = {
  x: number;
  w: number;
};

type Hazard = {
  kind: "saw" | "orb";
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type Level = {
  id: number;
  goalX: number;
  traps: Trap[];
  gaps: Gap[];
  enemies: Enemy[];
  hazards: Hazard[];
};

const MAX_PLAYERS = 5;
const PLAYER_W = 28;
const PLAYER_H = 28;
const ENEMY_H = 24;
const MOVE_SPEED = 240;
const GRAVITY = 1500;
const JUMP_VELOCITY = 560;
const TICK_MS = 33;
const FALL_LIMIT = -170;

const COLOR_POOL = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"] as const;

function overlaps(aX: number, aW: number, bX: number, bW: number) {
  return aX < bX + bW && aX + aW > bX;
}

function overlapsY(aY: number, aH: number, bY: number, bH: number) {
  return aY < bY + bH && aY + aH > bY;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelTemplate(): Level[] {
  return [
    {
      id: 1,
      goalX: 2050,
      gaps: [
        { x: 420, w: 150 },
        { x: 980, w: 130 },
        { x: 1540, w: 170 },
      ],
      traps: [
        { x: 730, w: 90 },
        { x: 1240, w: 88 },
        { x: 1810, w: 96 },
      ],
      enemies: [
        { x: 250, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 70, minX: 210, maxX: 330 },
        { x: 880, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 80, minX: 840, maxX: 950 },
        { x: 1380, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 85, minX: 1330, maxX: 1460 },
      ],
      hazards: [
        {
          kind: "saw",
          x: 520,
          y: 84,
          w: 28,
          h: 28,
          vx: 130,
          vy: 0,
          minX: 460,
          maxX: 620,
          minY: 84,
          maxY: 84,
        },
        {
          kind: "orb",
          x: 1080,
          y: 60,
          w: 22,
          h: 22,
          vx: 0,
          vy: 95,
          minX: 1080,
          maxX: 1080,
          minY: 28,
          maxY: 102,
        },
        {
          kind: "saw",
          x: 1630,
          y: 92,
          w: 30,
          h: 30,
          vx: 145,
          vy: 0,
          minX: 1560,
          maxX: 1750,
          minY: 92,
          maxY: 92,
        },
      ],
    },
    {
      id: 2,
      goalX: 2360,
      gaps: [
        { x: 330, w: 110 },
        { x: 760, w: 150 },
        { x: 1260, w: 120 },
        { x: 1820, w: 180 },
      ],
      traps: [
        { x: 540, w: 104 },
        { x: 1040, w: 86 },
        { x: 1540, w: 110 },
        { x: 2110, w: 90 },
      ],
      enemies: [
        { x: 210, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 90, minX: 180, maxX: 280 },
        { x: 640, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 96, minX: 600, maxX: 720 },
        { x: 1450, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 100, minX: 1400, maxX: 1530 },
        { x: 2050, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 110, minX: 2000, maxX: 2140 },
      ],
      hazards: [
        {
          kind: "orb",
          x: 385,
          y: 72,
          w: 22,
          h: 22,
          vx: 0,
          vy: 110,
          minX: 385,
          maxX: 385,
          minY: 24,
          maxY: 104,
        },
        {
          kind: "saw",
          x: 830,
          y: 90,
          w: 30,
          h: 30,
          vx: 165,
          vy: 0,
          minX: 760,
          maxX: 930,
          minY: 90,
          maxY: 90,
        },
        {
          kind: "orb",
          x: 1320,
          y: 66,
          w: 24,
          h: 24,
          vx: 0,
          vy: 120,
          minX: 1320,
          maxX: 1320,
          minY: 22,
          maxY: 112,
        },
        {
          kind: "saw",
          x: 1895,
          y: 88,
          w: 30,
          h: 30,
          vx: 150,
          vy: 0,
          minX: 1820,
          maxX: 2030,
          minY: 88,
          maxY: 88,
        },
      ],
    },
    {
      id: 3,
      goalX: 2640,
      gaps: [
        { x: 380, w: 160 },
        { x: 870, w: 120 },
        { x: 1280, w: 160 },
        { x: 1760, w: 130 },
        { x: 2190, w: 170 },
      ],
      traps: [
        { x: 640, w: 118 },
        { x: 1090, w: 90 },
        { x: 1540, w: 120 },
        { x: 1980, w: 92 },
        { x: 2470, w: 90 },
      ],
      enemies: [
        { x: 220, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 100, minX: 170, maxX: 310 },
        { x: 710, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 112, minX: 660, maxX: 810 },
        { x: 1470, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 116, minX: 1410, maxX: 1560 },
        { x: 2060, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 124, minX: 1990, maxX: 2130 },
      ],
      hazards: [
        {
          kind: "saw",
          x: 470,
          y: 92,
          w: 30,
          h: 30,
          vx: 175,
          vy: 0,
          minX: 400,
          maxX: 570,
          minY: 92,
          maxY: 92,
        },
        {
          kind: "orb",
          x: 930,
          y: 58,
          w: 24,
          h: 24,
          vx: 0,
          vy: 130,
          minX: 930,
          maxX: 930,
          minY: 20,
          maxY: 110,
        },
        {
          kind: "saw",
          x: 1350,
          y: 95,
          w: 30,
          h: 30,
          vx: 180,
          vy: 0,
          minX: 1285,
          maxX: 1455,
          minY: 95,
          maxY: 95,
        },
        {
          kind: "orb",
          x: 1825,
          y: 54,
          w: 24,
          h: 24,
          vx: 0,
          vy: 135,
          minX: 1825,
          maxX: 1825,
          minY: 18,
          maxY: 118,
        },
        {
          kind: "saw",
          x: 2270,
          y: 94,
          w: 32,
          h: 32,
          vx: 190,
          vy: 0,
          minX: 2200,
          maxX: 2390,
          minY: 94,
          maxY: 94,
        },
      ],
    },
    {
      id: 4,
      goalX: 2940,
      gaps: [
        { x: 300, w: 130 },
        { x: 690, w: 180 },
        { x: 1180, w: 150 },
        { x: 1660, w: 120 },
        { x: 2080, w: 180 },
        { x: 2540, w: 150 },
      ],
      traps: [
        { x: 510, w: 86 },
        { x: 980, w: 108 },
        { x: 1450, w: 102 },
        { x: 1910, w: 94 },
        { x: 2340, w: 108 },
        { x: 2780, w: 90 },
      ],
      enemies: [
        { x: 180, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 110, minX: 130, maxX: 270 },
        { x: 910, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 118, minX: 860, maxX: 1010 },
        { x: 1560, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 126, minX: 1500, maxX: 1640 },
        { x: 2430, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 134, minX: 2370, maxX: 2520 },
      ],
      hazards: [
        {
          kind: "orb",
          x: 365,
          y: 60,
          w: 22,
          h: 22,
          vx: 0,
          vy: 140,
          minX: 365,
          maxX: 365,
          minY: 18,
          maxY: 114,
        },
        {
          kind: "saw",
          x: 770,
          y: 92,
          w: 30,
          h: 30,
          vx: 200,
          vy: 0,
          minX: 700,
          maxX: 880,
          minY: 92,
          maxY: 92,
        },
        {
          kind: "orb",
          x: 1250,
          y: 50,
          w: 24,
          h: 24,
          vx: 0,
          vy: 145,
          minX: 1250,
          maxX: 1250,
          minY: 14,
          maxY: 120,
        },
        {
          kind: "saw",
          x: 1710,
          y: 96,
          w: 30,
          h: 30,
          vx: 210,
          vy: 0,
          minX: 1650,
          maxX: 1805,
          minY: 96,
          maxY: 96,
        },
        {
          kind: "orb",
          x: 2165,
          y: 56,
          w: 24,
          h: 24,
          vx: 0,
          vy: 150,
          minX: 2165,
          maxX: 2165,
          minY: 16,
          maxY: 118,
        },
        {
          kind: "saw",
          x: 2610,
          y: 94,
          w: 32,
          h: 32,
          vx: 220,
          vy: 0,
          minX: 2555,
          maxX: 2710,
          minY: 94,
          maxY: 94,
        },
      ],
    },
  ];
}

function cloneLevel(level: Level): Level {
  return {
    ...level,
    traps: level.traps.map((trap) => ({ ...trap })),
    gaps: level.gaps.map((gap) => ({ ...gap })),
    enemies: level.enemies.map((enemy) => ({ ...enemy })),
    hazards: level.hazards.map((hazard) => ({ ...hazard })),
  };
}

function isOverGap(level: Level, playerX: number) {
  const supportX = playerX + PLAYER_W / 2;
  return level.gaps.some((gap) => supportX >= gap.x && supportX <= gap.x + gap.w);
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
      const taken = new Set(
        Array.from(this.statePlayers.values()).map((player) => player.color)
      );
      const color = COLOR_POOL.find((candidate) => !taken.has(candidate)) ?? COLOR_POOL[0];
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
      const player = this.statePlayers.get(id);
      if (player) player.name = name;
    }
    this.broadcastState();
  }

  removePlayer(connectionId: string) {
    const removed = super.removePlayer(connectionId);
    if (!removed) return null;
    this.playerOrder = this.playerOrder.filter((id) => id !== removed.id);
    this.statePlayers.delete(removed.id);
    if (this.players.size === 0) this.stopTick();
    if (this.phase === "playing" && this.getActivePlayers().length === 0) {
      this.phase = "waiting";
    }
    this.broadcastState();
    return removed;
  }

  getActivePlayers() {
    return this.playerOrder
      .filter((id) => this.players.has(id))
      .slice(0, this.playerCount)
      .map((id) => this.statePlayers.get(id))
      .filter((player): player is RunnerPlayer => !!player);
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
    this.failMessage = null;
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

    for (const hazard of level.hazards) {
      hazard.x += hazard.vx * dt;
      hazard.y += hazard.vy * dt;

      if (hazard.x < hazard.minX || hazard.x > hazard.maxX) {
        hazard.vx *= -1;
        hazard.x = clamp(hazard.x, hazard.minX, hazard.maxX);
      }
      if (hazard.y < hazard.minY || hazard.y > hazard.maxY) {
        hazard.vy *= -1;
        hazard.y = clamp(hazard.y, hazard.minY, hazard.maxY);
      }
    }

    let failureMessage: string | null = null;

    for (const player of activePlayers) {
      if (!player.alive || player.finished) continue;

      const prevY = player.y;
      const prevBottom = player.y;

      player.x = clamp(player.x + player.inputX * MOVE_SPEED * dt, 0, level.goalX);

      const gapBeforeJump = isOverGap(level, player.x);
      if (player.jumpQueued && player.y <= 0.5 && !gapBeforeJump) {
        player.vy = JUMP_VELOCITY;
      }
      player.jumpQueued = false;

      player.vy -= GRAVITY * dt;
      player.y += player.vy * dt;

      const gapAfterMove = isOverGap(level, player.x);
      if (!gapAfterMove && player.y <= 0) {
        player.y = 0;
        if (player.vy < 0) player.vy = 0;
      }

      if (gapAfterMove && player.y < FALL_LIMIT) {
        player.alive = false;
        failureMessage ??= "Un joueur est tombe dans un trou.";
        continue;
      }

      const trapHit = level.traps.some(
        (trap) => overlaps(player.x + 4, PLAYER_W - 8, trap.x, trap.w) && player.y <= 6
      );
      if (trapHit) {
        player.alive = false;
        failureMessage ??= "Les pics ont eu raison de l'equipe.";
        continue;
      }

      for (const hazard of level.hazards) {
        if (
          overlaps(player.x + 2, PLAYER_W - 4, hazard.x, hazard.w) &&
          overlapsY(player.y, PLAYER_H, hazard.y, hazard.h)
        ) {
          player.alive = false;
          failureMessage ??=
            hazard.kind === "saw"
              ? "Une scie mobile a tranche la course."
              : "Le piege mobile a touche un joueur.";
          break;
        }
      }
      if (!player.alive) continue;

      for (const enemy of level.enemies) {
        if (!enemy.alive) continue;
        if (!overlaps(player.x, PLAYER_W, enemy.x, enemy.w)) continue;
        if (!overlapsY(player.y, PLAYER_H, enemy.y, enemy.h)) continue;

        const enemyTop = enemy.y + enemy.h;
        const stomped =
          prevBottom >= enemyTop - 2 &&
          player.y <= enemyTop + 6 &&
          player.vy < 0 &&
          prevY > player.y;

        if (stomped) {
          enemy.alive = false;
          player.vy = JUMP_VELOCITY * 0.68;
        } else {
          player.alive = false;
          failureMessage ??= "Une bete patrouille bloquait le passage.";
          break;
        }
      }
      if (!player.alive) continue;

      if (player.x + PLAYER_W >= level.goalX) {
        player.finished = true;
      }
    }

    if (activePlayers.some((player) => !player.alive)) {
      this.phase = "failed";
      this.failMessage = failureMessage ?? "Un joueur est mort. Recommencer...";
      this.broadcastState();
      setTimeout(() => this.restartLevel(true), 1100);
      return;
    }

    if (activePlayers.every((player) => player.finished)) {
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
      const taken = this.getActivePlayers().some(
        (player) => player.id !== senderPlayer.id && player.color === color
      );
      if (taken) return;
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
    }
  }

  getState() {
    const activeIds = new Set(
      this.playerOrder.filter((id) => this.players.has(id)).slice(0, this.playerCount)
    );
    const activePlayers = Array.from(activeIds)
      .map((id) => this.statePlayers.get(id))
      .filter((player): player is RunnerPlayer => !!player);
    const spectators = this.playerOrder.filter(
      (id) => this.players.has(id) && !activeIds.has(id)
    );
    const level = this.currentLevel();

    return {
      phase: this.phase,
      playerCount: this.playerCount,
      levelIndex: this.levelIndex,
      levelCount: this.levels.length,
      attempt: this.attempt,
      failMessage: this.failMessage,
      myPlayerId: null,
      players: activePlayers.map((player) => ({
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        alive: player.alive,
        finished: player.finished,
        color: player.color,
      })),
      spectators: spectators.map((id) => {
        const player = this.players.get(id);
        return { id, name: player?.name ?? "Spectateur" };
      }),
      level: {
        id: level.id,
        goalX: level.goalX,
        traps: level.traps.map((trap) => ({ ...trap })),
        gaps: level.gaps.map((gap) => ({ ...gap })),
        enemies: level.enemies.map((enemy) => ({
          x: enemy.x,
          y: enemy.y,
          w: enemy.w,
          h: enemy.h,
          alive: enemy.alive,
        })),
        hazards: level.hazards.map((hazard) => ({
          kind: hazard.kind,
          x: hazard.x,
          y: hazard.y,
          w: hazard.w,
          h: hazard.h,
        })),
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
