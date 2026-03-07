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

type ButtonSwitch = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  oneShot: boolean;
};

type Platform = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minY: number;
  maxY: number;
  speed: number;
  triggerId?: string;
};

type Level = {
  id: number;
  goalX: number;
  hint: string;
  traps: Trap[];
  gaps: Gap[];
  enemies: Enemy[];
  hazards: Hazard[];
  switches: ButtonSwitch[];
  platforms: Platform[];
};

const MAX_PLAYERS = 5;
const PLAYER_W = 28;
const PLAYER_H = 28;
const ENEMY_H = 24;
const PLATFORM_H = 16;
const MOVE_SPEED = 178;
const GRAVITY = 1180;
const JUMP_VELOCITY = 495;
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
      goalX: 1780,
      hint: "Prends le rythme. Les collisions sont plus propres, mais les trous punissent toujours.",
      gaps: [{ x: 430, w: 126 }, { x: 1080, w: 142 }],
      traps: [{ x: 760, w: 80 }, { x: 1460, w: 84 }],
      enemies: [
        { x: 260, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 44, minX: 220, maxX: 330 },
        { x: 905, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 52, minX: 850, maxX: 980 },
      ],
      hazards: [
        {
          kind: "saw",
          x: 608,
          y: 74,
          w: 28,
          h: 28,
          vx: 74,
          vy: 0,
          minX: 560,
          maxX: 700,
          minY: 74,
          maxY: 74,
        },
        {
          kind: "orb",
          x: 1315,
          y: 54,
          w: 22,
          h: 22,
          vx: 0,
          vy: 62,
          minX: 1315,
          maxX: 1315,
          minY: 26,
          maxY: 90,
        },
      ],
      switches: [],
      platforms: [],
    },
    {
      id: 2,
      goalX: 2220,
      hint: "Empilez-vous sous le relais pour lever le pont. Seul, personne ne passe.",
      gaps: [{ x: 1050, w: 286 }, { x: 1815, w: 150 }],
      traps: [{ x: 1540, w: 74 }],
      enemies: [
        { x: 1685, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 56, minX: 1620, maxX: 1760 },
      ],
      hazards: [
        {
          kind: "orb",
          x: 1465,
          y: 56,
          w: 24,
          h: 24,
          vx: 0,
          vy: 66,
          minX: 1465,
          maxX: 1465,
          minY: 22,
          maxY: 92,
        },
      ],
      switches: [
        {
          id: "relay-bridge",
          x: 760,
          y: 136,
          w: 34,
          h: 34,
          active: false,
          oneShot: true,
        },
      ],
      platforms: [
        {
          id: "bridge-platform",
          x: 1134,
          y: -112,
          w: 144,
          h: PLATFORM_H,
          minY: -112,
          maxY: 6,
          speed: 128,
          triggerId: "relay-bridge",
        },
      ],
    },
    {
      id: 3,
      goalX: 2480,
      hint: "Derniere run: tempo lent, mais il faut lire le terrain et l’espace entre les pieges.",
      gaps: [
        { x: 540, w: 136 },
        { x: 1260, w: 160 },
        { x: 1980, w: 156 },
      ],
      traps: [{ x: 870, w: 88 }, { x: 1650, w: 94 }],
      enemies: [
        { x: 330, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 48, minX: 260, maxX: 410 },
        { x: 1488, y: 0, w: 34, h: ENEMY_H, alive: true, vx: 58, minX: 1440, maxX: 1560 },
      ],
      hazards: [
        {
          kind: "saw",
          x: 710,
          y: 78,
          w: 30,
          h: 30,
          vx: 84,
          vy: 0,
          minX: 650,
          maxX: 820,
          minY: 78,
          maxY: 78,
        },
        {
          kind: "orb",
          x: 1150,
          y: 62,
          w: 24,
          h: 24,
          vx: 0,
          vy: 68,
          minX: 1150,
          maxX: 1150,
          minY: 26,
          maxY: 94,
        },
        {
          kind: "saw",
          x: 1788,
          y: 78,
          w: 30,
          h: 30,
          vx: 92,
          vy: 0,
          minX: 1720,
          maxX: 1880,
          minY: 78,
          maxY: 78,
        },
      ],
      switches: [],
      platforms: [
        {
          id: "final-step",
          x: 2136,
          y: 44,
          w: 84,
          h: PLATFORM_H,
          minY: 44,
          maxY: 44,
          speed: 0,
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
    switches: level.switches.map((button) => ({ ...button })),
    platforms: level.platforms.map((platform) => ({ ...platform })),
  };
}

function isOverGap(level: Level, playerX: number) {
  const supportX = playerX + PLAYER_W / 2;
  return level.gaps.some((gap) => supportX >= gap.x && supportX <= gap.x + gap.w);
}

function overlapsRect(
  aX: number,
  aY: number,
  aW: number,
  aH: number,
  bX: number,
  bY: number,
  bW: number,
  bH: number
) {
  return overlaps(aX, aW, bX, bW) && overlapsY(aY, aH, bY, bH);
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
    this.getActivePlayers().forEach((player, index) => {
      player.x = index * (PLAYER_W + 6);
      player.y = 0;
      player.vy = 0;
      player.alive = true;
      player.finished = false;
      player.inputX = 0;
      player.jumpQueued = false;
    });
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

    for (const button of level.switches) {
      if (button.active) continue;
      button.active = activePlayers.some((player) =>
        overlapsRect(
          player.x + 5,
          player.y + 4,
          PLAYER_W - 10,
          PLAYER_H - 8,
          button.x,
          button.y,
          button.w,
          button.h
        )
      );
    }

    for (const platform of level.platforms) {
      const targetY =
        platform.triggerId &&
        level.switches.some((button) => button.id === platform.triggerId && button.active)
          ? platform.maxY
          : platform.minY;

      if (platform.y < targetY) {
        platform.y = Math.min(targetY, platform.y + platform.speed * dt);
      } else if (platform.y > targetY) {
        platform.y = Math.max(targetY, platform.y - platform.speed * dt);
      }
    }

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
    const previousBottoms = new Map(activePlayers.map((player) => [player.id, player.y] as const));

    for (const player of activePlayers) {
      if (!player.alive || player.finished) continue;

      const prevY = player.y;
      player.x = clamp(player.x + player.inputX * MOVE_SPEED * dt, 0, level.goalX);

      const standingOnPlatform = level.platforms.some(
        (platform) =>
          overlaps(player.x + 6, PLAYER_W - 12, platform.x, platform.w) &&
          Math.abs(player.y - (platform.y + platform.h)) <= 4
      );
      const standingOnPlayer = activePlayers.some(
        (other) =>
          other.id !== player.id &&
          other.alive &&
          overlaps(player.x + 5, PLAYER_W - 10, other.x + 4, PLAYER_W - 8) &&
          Math.abs(player.y - (other.y + PLAYER_H)) <= 4
      );
      const gapBeforeJump = isOverGap(level, player.x);
      if (
        player.jumpQueued &&
        (player.y <= 0.5 || standingOnPlatform || standingOnPlayer) &&
        (!gapBeforeJump || standingOnPlatform || standingOnPlayer)
      ) {
        player.vy = JUMP_VELOCITY;
      }
      player.jumpQueued = false;

      player.vy -= GRAVITY * dt;
      player.y += player.vy * dt;

      const prevBottom = previousBottoms.get(player.id) ?? prevY;
      let supportTop: number | null = null;

      const gapAfterMove = isOverGap(level, player.x);
      if (!gapAfterMove) {
        supportTop = 0;
      }

      for (const platform of level.platforms) {
        const platformTop = platform.y + platform.h;
        if (!overlaps(player.x + 4, PLAYER_W - 8, platform.x, platform.w)) continue;
        if (prevBottom < platformTop - 10) continue;
        if (player.y > platformTop + 10) continue;
        supportTop = Math.max(supportTop ?? -Infinity, platformTop);
      }

      const sortedOthers = [...activePlayers]
        .filter((other) => other.id !== player.id && other.alive)
        .sort((a, b) => a.y - b.y);
      for (const other of sortedOthers) {
        const otherTop = other.y + PLAYER_H;
        if (!overlaps(player.x + 5, PLAYER_W - 10, other.x + 4, PLAYER_W - 8)) continue;
        if (prevBottom < otherTop - 8) continue;
        if (player.y > otherTop + 10) continue;
        supportTop = Math.max(supportTop ?? -Infinity, otherTop);
      }

      if (supportTop !== null && player.vy <= 0 && player.y <= supportTop + 10) {
        player.y = supportTop;
        player.vy = 0;
      }

      if (gapAfterMove && player.y < FALL_LIMIT) {
        player.alive = false;
        failureMessage ??= "Un joueur est tombe dans un trou.";
        continue;
      }

      const trapHit = level.traps.some(
        (trap) => overlaps(player.x + 7, PLAYER_W - 14, trap.x + 5, trap.w - 10) && player.y <= 4
      );
      if (trapHit) {
        player.alive = false;
        failureMessage ??= "Les pics ont eu raison de l'equipe.";
        continue;
      }

      for (const hazard of level.hazards) {
        if (
          overlaps(player.x + 6, PLAYER_W - 12, hazard.x + 4, Math.max(6, hazard.w - 8)) &&
          overlapsY(player.y + 4, PLAYER_H - 8, hazard.y + 4, Math.max(6, hazard.h - 8))
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
        if (!overlaps(player.x + 5, PLAYER_W - 10, enemy.x + 4, enemy.w - 8)) continue;
        if (!overlapsY(player.y + 3, PLAYER_H - 6, enemy.y + 2, enemy.h - 4)) continue;

        const enemyTop = enemy.y + enemy.h;
        const stomped =
          prevBottom >= enemyTop - 4 &&
          player.y <= enemyTop + 4 &&
          player.vy < 0 &&
          prevY > player.y;

        if (stomped) {
          enemy.alive = false;
          player.vy = JUMP_VELOCITY * 0.52;
        } else {
          player.alive = false;
          failureMessage ??= "Une bete patrouille bloquait le passage.";
          break;
        }
      }
      if (!player.alive) continue;

      for (const button of level.switches) {
        if (button.active) continue;
        if (
          overlapsRect(
            player.x + 5,
            player.y + 4,
            PLAYER_W - 10,
            PLAYER_H - 8,
            button.x,
            button.y,
            button.w,
            button.h
          )
        ) {
          button.active = true;
        }
      }

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
        hint: level.hint,
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
        switches: level.switches.map((button) => ({
          id: button.id,
          x: button.x,
          y: button.y,
          w: button.w,
          h: button.h,
          active: button.active,
        })),
        platforms: level.platforms.map((platform) => ({
          id: platform.id,
          x: platform.x,
          y: platform.y,
          w: platform.w,
          h: platform.h,
          active:
            !platform.triggerId ||
            level.switches.some((button) => button.id === platform.triggerId && button.active),
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
