import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

type MatchStatus = "waiting" | "connecting" | "serving" | "playing" | "point-scored" | "game-over";
type Side = "near" | "far";
type Role = "front" | "back";
type SwingType = "forehand" | "backhand" | "smash" | "slice" | "lob";

interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  bounceCount: number;
}

/** A character on the court (4 total: 2 per side) */
interface Character {
  id: string;
  side: Side;
  role: Role;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  baseX: number;
  baseZ: number;
}

interface TennisPlayer {
  id: string;
  name: string;
  side: Side;
  isBot: boolean;
  controllerConnected: boolean;
  controllerConnectionId: string | null;
  screenConnectionId: string | null;
  lastSwing: SwingType | null;
  score: number;
}

const POINTS_TO_WIN = 7;
const COURT_LENGTH = 36;
const COURT_WIDTH = 20;
const TICK_RATE = 16; // 60Hz
const POINT_PAUSE_MS = 2000;
const SERVE_WINDOW_MS = 5000;
const HIT_RADIUS = 2.5; // Slightly forgiving on bigger court
const HIT_HEIGHT_MAX = 2.5;
const CHARACTER_SPEED = 15; // Faster to cover bigger court
const GRAVITY = 18; // Moderate arcs for big court
const AIR_DRAG = 0.995;
const BOUNCE_RESTITUTION = 0.65;
const BALL_RADIUS = 0.05;

// Bot tuning
const BOT_REACTION_MIN_MS = 250;
const BOT_REACTION_MAX_MS = 450;
const BOT_MISS_CHANCE = 0.12; // 12%
const BOT_SERVE_DELAY_MS = 1200;

// Character base positions (doubles formation)
const NEAR_FRONT_Z = -COURT_LENGTH / 2 + 6;
const NEAR_BACK_Z = -COURT_LENGTH / 2 + 2;
const FAR_FRONT_Z = COURT_LENGTH / 2 - 6;
const FAR_BACK_Z = COURT_LENGTH / 2 - 2;

export class MotionTennisGame extends BaseGame {
  status: MatchStatus = "waiting";
  tPlayers: TennisPlayer[] = [];
  characters: Character[] = [];
  ball: BallState | null = null;
  servingSide: Side = "near";
  hittable = false;
  hittableTarget: string | null = null;
  hittableCharId: string | null = null;
  ballEnteredHitZoneAt = 0;
  activeCharacterId: string | null = null;
  serveWindow = false;
  serveWindowPlayerId: string | null = null;
  tickInterval: ReturnType<typeof setInterval> | null = null;
  pointPauseTimeout: ReturnType<typeof setTimeout> | null = null;
  serveTimeout: ReturnType<typeof setTimeout> | null = null;
  botReactionTimeout: ReturnType<typeof setTimeout> | null = null;
  lastHitterId: string | null = null;
  lastHitterCharacterId: string | null = null;
  hasBot = false;
  idleBroadcastCounter = 0;

  start() {
    this.started = true;
    const playerIds = Array.from(this.players.keys());
    for (let i = 0; i < playerIds.length && i < 2; i++) {
      const pid = playerIds[i];
      const player = this.players.get(pid)!;
      const side: Side = i === 0 ? "near" : "far";
      this.tPlayers.push({
        id: pid,
        name: player.name,
        side,
        isBot: false,
        controllerConnected: false,
        controllerConnectionId: null,
        screenConnectionId: player.connectionId,
        lastSwing: null,
        score: 0,
      });
    }

    // Solo mode: add bot on "far" side
    if (this.tPlayers.length === 1) {
      this.hasBot = true;
      this.tPlayers.push({
        id: "__bot__",
        name: "BOT",
        side: "far",
        isBot: true,
        controllerConnected: true,
        controllerConnectionId: null,
        screenConnectionId: null,
        lastSwing: null,
        score: 0,
      });
    }

    // Create 4 characters (2 per side) — Wii Sports doubles
    this.characters = [
      { id: "near-front", side: "near", role: "front", x: -3.5, z: NEAR_FRONT_Z, targetX: -3.5, targetZ: NEAR_FRONT_Z, baseX: -3.5, baseZ: NEAR_FRONT_Z },
      { id: "near-back", side: "near", role: "back", x: 3.5, z: NEAR_BACK_Z, targetX: 3.5, targetZ: NEAR_BACK_Z, baseX: 3.5, baseZ: NEAR_BACK_Z },
      { id: "far-front", side: "far", role: "front", x: 3.5, z: FAR_FRONT_Z, targetX: 3.5, targetZ: FAR_FRONT_Z, baseX: 3.5, baseZ: FAR_FRONT_Z },
      { id: "far-back", side: "far", role: "back", x: -3.5, z: FAR_BACK_Z, targetX: -3.5, targetZ: FAR_BACK_Z, baseX: -3.5, baseZ: FAR_BACK_Z },
    ];

    if (this.hasBot) {
      // Don't auto-start — let user connect controller or choose keyboard
      this.status = "connecting";
      this.broadcastState();
      this.tickInterval = setInterval(() => this.tick(), TICK_RATE);
    } else {
      this.status = "connecting";
      this.broadcastState();
      this.tickInterval = setInterval(() => this.tick(), TICK_RATE);
    }
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;

    if (action === "controller-join") {
      const targetName = payload.playerName as string;
      // Try name match first, then fallback to first unconnected human
      let tp = this.tPlayers.find((p) => p.name === targetName && !p.isBot);
      if (!tp) {
        tp = this.tPlayers.find((p) => !p.isBot && !p.controllerConnected);
      }
      if (tp) {
        tp.controllerConnected = true;
        tp.controllerConnectionId = sender.id;
        this.connections.set(sender.id, sender);
      }

      const humans = this.tPlayers.filter((p) => !p.isBot);
      if (humans.length >= 1 && humans.every((p) => p.controllerConnected) && this.status === "connecting") {
        this.status = "serving";
        this.broadcastState();
        setTimeout(() => this.openServeWindow(), 1500);
      } else {
        this.broadcastState();
      }
      return;
    }

    if (action === "start-keyboard") {
      const tp = this.tPlayers.find((p) => !p.isBot);
      if (tp && !tp.controllerConnected) {
        tp.controllerConnected = true;
        if (this.status === "connecting") {
          this.status = "serving";
          this.broadcastState();
          setTimeout(() => this.openServeWindow(), 1500);
        }
      }
      return;
    }

    if (action === "swing") {
      const swingType = payload.swingType as SwingType;
      const power = payload.power as number;
      const swingTimestamp = payload.swingTimestamp as number | undefined;

      let tp = this.tPlayers.find((p) => p.controllerConnectionId === sender.id);
      if (!tp) {
        tp = this.tPlayers.find((p) => p.screenConnectionId === sender.id && !p.isBot);
      }
      if (!tp) return;

      tp.lastSwing = swingType;

      // Always broadcast visual swing (Wii Sports: swing anytime)
      const swingChar = this.closestCharacter(tp.side) ?? this.characters.find((c) => c.side === tp!.side);
      this.broadcast({
        type: "game-update",
        payload: {
          event: "player-swung",
          side: tp.side,
          swingType,
          activeCharacterId: swingChar?.id ?? null,
        },
      });

      // Service gesture
      if (this.serveWindow && this.serveWindowPlayerId === tp.id) {
        this.serveWindow = false;
        this.serveWindowPlayerId = null;
        if (this.serveTimeout) {
          clearTimeout(this.serveTimeout);
          this.serveTimeout = null;
        }
        this.executeServe(tp, swingType, power);
        return;
      }

      // Rally hit
      if (this.hittable && this.hittableTarget === tp.id && this.ball) {
        this.handleHit(tp, swingType, power, swingTimestamp);
        this.hittable = false;
        this.hittableTarget = null;
        this.hittableCharId = null;
      }
      return;
    }
  }

  // ── Bot AI ──────────────────────────────────────────

  botPickSwing(): SwingType {
    const r = Math.random();
    if (r < 0.30) return "forehand";
    if (r < 0.55) return "backhand";
    if (r < 0.70) return "smash";
    if (r < 0.85) return "slice";
    return "lob";
  }

  botServe(botPlayer: TennisPlayer) {
    this.botReactionTimeout = setTimeout(() => {
      if (!this.serveWindow || this.serveWindowPlayerId !== botPlayer.id) return;
      this.serveWindow = false;
      this.serveWindowPlayerId = null;
      if (this.serveTimeout) {
        clearTimeout(this.serveTimeout);
        this.serveTimeout = null;
      }
      const swing = this.botPickSwing();
      const power = 0.4 + Math.random() * 0.5;
      this.executeServe(botPlayer, swing, power);
    }, BOT_SERVE_DELAY_MS);
  }

  botReact(botPlayer: TennisPlayer) {
    const reactionMs = BOT_REACTION_MIN_MS + Math.random() * (BOT_REACTION_MAX_MS - BOT_REACTION_MIN_MS);
    this.botReactionTimeout = setTimeout(() => {
      if (!this.hittable || this.hittableTarget !== botPlayer.id || !this.ball) return;

      if (Math.random() < BOT_MISS_CHANCE) {
        return;
      }

      const swing = this.botPickSwing();
      const power = 0.3 + Math.random() * 0.6;
      const fakeTimestamp = this.ballEnteredHitZoneAt + (Math.random() - 0.3) * 300;

      this.handleHit(botPlayer, swing, power, fakeTimestamp);
    }, reactionMs);
  }

  // ── Game logic ──────────────────────────────────────

  closestCharacter(side: Side): Character | null {
    if (!this.ball) return null;
    const chars = this.characters.filter((c) => c.side === side);
    let closest: Character | null = null;
    let minDist = Infinity;
    for (const c of chars) {
      const dx = c.x - this.ball.x;
      const dz = c.z - this.ball.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        closest = c;
      }
    }
    return closest;
  }

  openServeWindow() {
    if (this.status === "game-over") return;
    this.status = "serving";

    const server = this.tPlayers.find((p) => p.side === this.servingSide);
    if (!server) return;

    this.serveWindow = true;
    this.serveWindowPlayerId = server.id;

    const servingChar = this.characters.find(
      (c) => c.side === this.servingSide && c.role === "back"
    );
    this.activeCharacterId = servingChar?.id ?? null;

    this.broadcast({
      type: "game-update",
      payload: {
        event: "serve-window-open",
        serverId: server.id,
        serverName: server.name,
        servingSide: this.servingSide,
        activeCharacterId: this.activeCharacterId,
      },
    });

    if (server.isBot) {
      this.botServe(server);
    }

    this.serveTimeout = setTimeout(() => {
      if (this.serveWindow) {
        this.serveWindow = false;
        this.serveWindowPlayerId = null;
        this.executeServe(server, "forehand", 0.5);
      }
    }, SERVE_WINDOW_MS);
  }

  executeServe(server: TennisPlayer, swingType: SwingType, power: number) {
    this.status = "playing";

    const servingChar = this.characters.find(
      (c) => c.side === server.side && c.role === "back"
    );
    const startX = servingChar?.x ?? 0;
    const startZ = server.side === "near" ? -COURT_LENGTH / 2 + 2 : COURT_LENGTH / 2 - 2;
    const dir = server.side === "near" ? 1 : -1;

    let speed: number, vy: number, vx: number;

    // Power serve: smash with high power = ace-like fast serve
    const isPowerServe = swingType === "smash" && power > 0.7;

    switch (swingType) {
      case "smash":
        speed = isPowerServe ? 26 + power * 6 : 22 + power * 6;
        vy = isPowerServe ? 3 : 4;
        vx = (Math.random() - 0.5) * 2;
        break;
      case "slice":
        speed = 18 + power * 6;
        vy = 6;
        vx = (server.side === "near" ? 1 : -1) * (2 + power * 3);
        break;
      case "lob":
        speed = 14 + power * 6;
        vy = 9;
        vx = (Math.random() - 0.5) * 2;
        break;
      default:
        speed = 20 + power * 8;
        vy = 6;
        vx = (Math.random() - 0.5) * 3;
        break;
    }

    this.ball = { x: startX, y: 2.5, z: startZ, vx, vy, vz: dir * speed, bounceCount: 0 };
    this.lastHitterId = server.id;
    this.lastHitterCharacterId = servingChar?.id ?? null;
    this.activeCharacterId = servingChar?.id ?? null;

    this.broadcast({
      type: "game-update",
      payload: {
        event: "ball-served",
        ball: { ...this.ball },
        server: server.id,
        activeCharacterId: this.activeCharacterId,
        swingType,
        power,
        isPowerServe,
      },
    });

    this.broadcastState();
  }

  handleHit(player: TennisPlayer, swingType: SwingType, power: number, swingTimestamp?: number) {
    if (!this.ball) return;

    const hittingChar = this.closestCharacter(player.side);
    const dir = player.side === "near" ? 1 : -1;

    // Timing-based direction (Wii Sports core mechanic)
    const timing = (swingTimestamp ?? Date.now()) - this.ballEnteredHitZoneAt;
    let crossCourtFactor = 0;
    let timingResult: "early" | "perfect" | "late" = "perfect";
    if (timing < -150) {
      crossCourtFactor = player.side === "near" ? -1 : 1;
      timingResult = "early";
    } else if (timing > 150) {
      crossCourtFactor = player.side === "near" ? 1 : -1;
      timingResult = "late";
    }

    // Swing type affects horizontal direction (forehand = right, backhand = left)
    let swingDirX = 0;
    if (swingType === "forehand") swingDirX = 3;
    else if (swingType === "backhand") swingDirX = -3;
    // Flip for far side (they face opposite direction)
    if (player.side === "far") swingDirX = -swingDirX;

    const baseSpeed = 16 + power * 8;

    let vx: number, vy: number, vz: number;
    switch (swingType) {
      case "smash":
        vx = crossCourtFactor * 5 + swingDirX + (Math.random() - 0.5) * 0.5;
        vy = 3;
        vz = dir * baseSpeed * 1.2;
        break;
      case "slice":
        vx = crossCourtFactor * 5 + swingDirX + (Math.random() - 0.5) * 0.5;
        vy = 6;
        vz = dir * baseSpeed * 0.7;
        break;
      case "lob":
        vx = crossCourtFactor * 3 + swingDirX * 0.7 + (Math.random() - 0.5) * 0.5;
        vy = 12 + power * 3;
        vz = dir * baseSpeed * 0.5;
        break;
      case "backhand":
        vx = crossCourtFactor * 5 + swingDirX + (Math.random() - 0.5) * 0.5;
        vy = 6;
        vz = dir * baseSpeed * 0.9;
        break;
      default: // forehand
        vx = crossCourtFactor * 5 + swingDirX + (Math.random() - 0.5) * 0.5;
        vy = 6;
        vz = dir * baseSpeed;
        break;
    }

    this.ball.vx = vx;
    this.ball.vy = vy;
    this.ball.vz = vz;
    this.ball.bounceCount = 0;
    this.lastHitterId = player.id;
    this.lastHitterCharacterId = hittingChar?.id ?? null;
    this.activeCharacterId = hittingChar?.id ?? null;

    this.hittable = false;
    this.hittableTarget = null;
    this.hittableCharId = null;

    this.broadcast({
      type: "game-update",
      payload: {
        event: "ball-hit",
        ball: { ...this.ball },
        hitter: player.id,
        activeCharacterId: hittingChar?.id ?? null,
        swingType,
        power,
        timingResult,
      },
    });
  }

  // ── Landing prediction ──────────────────────────────
  // Always predict — even when ball is ascending (characters start running IMMEDIATELY)

  predictLanding(): { x: number; z: number } | null {
    if (!this.ball) return null;
    const { x, z, vx, vz, vy, y } = this.ball;
    const discriminant = vy * vy + 2 * GRAVITY * (y - BALL_RADIUS);
    if (discriminant < 0) return null;
    const t = (vy + Math.sqrt(discriminant)) / GRAVITY;
    if (t <= 0) return null;
    const dragFactor = Math.pow(AIR_DRAG, t * 60);
    return {
      x: x + vx * t * dragFactor,
      z: z + vz * t * dragFactor,
    };
  }

  // ── Character movement ──────────────────────────────
  // Called EVERY tick (not just during "playing") so characters are always alive

  moveCharacters() {
    const dt = TICK_RATE / 1000;
    const landing = this.predictLanding();
    const ballVz = this.ball?.vz ?? 0;
    const now = Date.now() * 0.002;

    for (const c of this.characters) {
      const isReceiving = this.ball &&
        ((c.side === "near" && ballVz < 0) || (c.side === "far" && ballVz > 0));

      if (isReceiving && landing) {
        const landingDepth = Math.abs(landing.z);
        const isShortBall = landingDepth < COURT_LENGTH / 4;

        if ((c.role === "front" && isShortBall) || (c.role === "back" && !isShortBall)) {
          c.targetX = landing.x;
          c.targetZ = landing.z;
        } else {
          c.targetX = c.baseX;
          c.targetZ = c.baseZ;
        }
      } else if (this.ball && !isReceiving) {
        // Not receiving but ball in play — mirror ball position slightly (ready stance)
        const ballX = this.ball.x;
        c.targetX = c.baseX + (ballX - c.baseX) * 0.2;
        c.targetZ = c.baseZ;
      } else {
        // No ball — return to base with idle shuffle
        c.targetX = c.baseX;
        c.targetZ = c.baseZ;
      }

      // Clamp targets
      c.targetX = Math.max(-COURT_WIDTH / 2 + 1, Math.min(COURT_WIDTH / 2 - 1, c.targetX));
      if (c.side === "near") {
        c.targetZ = Math.max(-COURT_LENGTH / 2, Math.min(-0.5, c.targetZ));
      } else {
        c.targetZ = Math.max(0.5, Math.min(COURT_LENGTH / 2, c.targetZ));
      }

      // Speed-based movement toward target
      const dx = c.targetX - c.x;
      const dz = c.targetZ - c.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.05) {
        const moveAmount = CHARACTER_SPEED * dt;
        if (moveAmount >= dist) {
          c.x = c.targetX;
          c.z = c.targetZ;
        } else {
          c.x += (dx / dist) * moveAmount;
          c.z += (dz / dist) * moveAmount;
        }
      } else {
        // At target — stay perfectly still (idle animation is client-side only)
        c.x = c.targetX;
        c.z = c.targetZ;
      }

      // Final clamp
      c.x = Math.max(-COURT_WIDTH / 2 + 1, Math.min(COURT_WIDTH / 2 - 1, c.x));
      if (c.side === "near") {
        c.z = Math.max(-COURT_LENGTH / 2, Math.min(-0.5, c.z));
      } else {
        c.z = Math.max(0.5, Math.min(COURT_LENGTH / 2, c.z));
      }
    }
  }

  tick() {
    // ALWAYS move characters — they should look alive even between points
    this.moveCharacters();

    // Outside of "playing", broadcast character positions at ~1Hz (just for sync)
    if (this.status !== "playing" || !this.ball) {
      this.idleBroadcastCounter++;
      if (this.idleBroadcastCounter % 60 === 0) {
        this.broadcast({
          type: "game-update",
          payload: {
            event: "characters-update",
            characters: this.characters.map((c) => ({ id: c.id, side: c.side, role: c.role, x: c.x, z: c.z })),
          },
        });
      }
      return;
    }

    const dt = TICK_RATE / 1000;

    // Physics update
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    this.ball.z += this.ball.vz * dt;
    this.ball.vy -= GRAVITY * dt;
    this.ball.vx *= AIR_DRAG;
    this.ball.vz *= AIR_DRAG;

    // Ground bounce
    if (this.ball.y <= BALL_RADIUS) {
      this.ball.y = BALL_RADIUS;
      this.ball.vy = Math.abs(this.ball.vy) * BOUNCE_RESTITUTION;
      this.ball.bounceCount++;

      this.broadcast({
        type: "game-update",
        payload: { event: "ball-bounce", x: this.ball.x, z: this.ball.z },
      });

      const inCourt = Math.abs(this.ball.x) <= COURT_WIDTH / 2 && Math.abs(this.ball.z) <= COURT_LENGTH / 2;

      if (this.ball.bounceCount === 1 && !inCourt) {
        const lastHitter = this.tPlayers.find((p) => p.id === this.lastHitterId);
        const scoringSide: Side = lastHitter?.side === "near" ? "far" : "near";
        this.scorePoint(scoringSide, "out");
        return;
      }

      if (this.ball.bounceCount >= 2) {
        const lastHitter = this.tPlayers.find((p) => p.id === this.lastHitterId);
        const scoringSide: Side = lastHitter?.side ?? "near";
        this.scorePoint(scoringSide, "double-bounce");
        return;
      }
    }

    // Continuous hit detection
    if (!this.hittable) {
      const receiverSide: Side = this.ball.vz > 0 ? "far" : "near";
      const receiver = this.tPlayers.find((p) => p.side === receiverSide);
      const closestChar = this.closestCharacter(receiverSide);

      if (closestChar && receiver) {
        const dx = closestChar.x - this.ball.x;
        const dz = closestChar.z - this.ball.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < HIT_RADIUS && this.ball.y < HIT_HEIGHT_MAX && this.ball.y > 0.2) {
          this.hittable = true;
          this.hittableTarget = receiver.id;
          this.hittableCharId = closestChar.id;
          this.ballEnteredHitZoneAt = Date.now();
          this.activeCharacterId = closestChar.id;

          this.broadcast({
            type: "game-update",
            payload: {
              event: "ball-hittable",
              targetPlayer: receiver.id,
              activeCharacterId: closestChar.id,
            },
          });

          if (receiver.isBot) {
            this.botReact(receiver);
          }
        }
      }
    } else {
      // Check if ball clearly left hit zone (generous margin)
      const char = this.characters.find((c) => c.id === this.hittableCharId);
      if (char) {
        const dx = char.x - this.ball.x;
        const dz = char.z - this.ball.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > HIT_RADIUS + 1.5 || this.ball.y > HIT_HEIGHT_MAX + 2) {
          const receiver = this.tPlayers.find((p) => p.id === this.hittableTarget);
          this.hittable = false;
          this.hittableTarget = null;
          this.hittableCharId = null;
          this.activeCharacterId = null;
          if (receiver) {
            const scoringSide: Side = receiver.side === "near" ? "far" : "near";
            this.scorePoint(scoringSide, "missed");
          }
          return;
        }
      }
    }

    // Net collision
    if (Math.abs(this.ball.z) < 0.3 && this.ball.y < 1.0) {
      const scoringSide: Side = this.ball.vz > 0 ? "far" : "near";
      this.scorePoint(scoringSide, "net");
      return;
    }

    // Out of bounds laterally
    if (Math.abs(this.ball.x) > COURT_WIDTH / 2 + 3) {
      const lastHitter = this.tPlayers.find((p) => p.id === this.lastHitterId);
      const scoringSide: Side = lastHitter?.side === "near" ? "far" : "near";
      this.scorePoint(scoringSide, "out");
      return;
    }

    // Out of bounds length
    if (Math.abs(this.ball.z) > COURT_LENGTH / 2 + 4) {
      const lastHitter = this.tPlayers.find((p) => p.id === this.lastHitterId);
      const scoringSide: Side = lastHitter?.side === "near" ? "far" : "near";
      this.scorePoint(scoringSide, "out");
      return;
    }

    // Broadcast tick
    this.broadcast({
      type: "game-update",
      payload: {
        event: "ball-tick",
        ball: { ...this.ball },
        hittable: this.hittable,
        hittableTarget: this.hittableTarget,
        activeCharacterId: this.activeCharacterId,
        characters: this.characters.map((c) => ({ id: c.id, side: c.side, role: c.role, x: c.x, z: c.z })),
      },
    });
  }

  scorePoint(winningSide: Side, reason: "net" | "out" | "missed" | "double-bounce") {
    this.status = "point-scored";
    this.ball = null;
    this.hittable = false;
    this.hittableTarget = null;
    this.hittableCharId = null;
    this.lastHitterId = null;
    this.lastHitterCharacterId = null;
    this.activeCharacterId = null;

    if (this.botReactionTimeout) {
      clearTimeout(this.botReactionTimeout);
      this.botReactionTimeout = null;
    }

    const winner = this.tPlayers.find((p) => p.side === winningSide);
    if (winner) {
      winner.score++;
    }

    this.resetCharacterPositions();

    this.broadcast({
      type: "game-update",
      payload: {
        event: "point-scored",
        reason,
        winningSide,
        winnerName: winner?.name,
        score: {
          near: this.tPlayers.find((p) => p.side === "near")?.score ?? 0,
          far: this.tPlayers.find((p) => p.side === "far")?.score ?? 0,
        },
      },
    });

    if (winner && winner.score >= POINTS_TO_WIN) {
      this.pointPauseTimeout = setTimeout(() => this.endMatch(), POINT_PAUSE_MS);
      return;
    }

    const totalPoints = this.tPlayers.reduce((s, p) => s + p.score, 0);
    if (totalPoints % 2 === 0) {
      this.servingSide = this.servingSide === "near" ? "far" : "near";
    }

    this.pointPauseTimeout = setTimeout(() => {
      this.openServeWindow();
    }, POINT_PAUSE_MS);
  }

  resetCharacterPositions() {
    for (const c of this.characters) {
      if (c.id === "near-front") { c.targetX = -3.5; c.targetZ = NEAR_FRONT_Z; c.baseX = -3.5; c.baseZ = NEAR_FRONT_Z; }
      if (c.id === "near-back") { c.targetX = 3.5; c.targetZ = NEAR_BACK_Z; c.baseX = 3.5; c.baseZ = NEAR_BACK_Z; }
      if (c.id === "far-front") { c.targetX = 3.5; c.targetZ = FAR_FRONT_Z; c.baseX = 3.5; c.baseZ = FAR_FRONT_Z; }
      if (c.id === "far-back") { c.targetX = -3.5; c.targetZ = FAR_BACK_Z; c.baseX = -3.5; c.baseZ = FAR_BACK_Z; }
    }
    // Don't snap position — let moveCharacters smoothly walk back
  }

  endMatch() {
    this.status = "game-over";
    this.clearTimers();

    const sorted = [...this.tPlayers].sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = sorted.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));

    this.endGame(rankings);
  }

  getState(): Record<string, unknown> {
    return {
      status: this.status,
      score: {
        near: this.tPlayers.find((p) => p.side === "near")?.score ?? 0,
        far: this.tPlayers.find((p) => p.side === "far")?.score ?? 0,
      },
      servingSide: this.servingSide,
      ball: this.ball,
      hittable: this.hittable,
      hittableTarget: this.hittableTarget,
      serveWindow: this.serveWindow,
      serveWindowPlayerId: this.serveWindowPlayerId,
      activeCharacterId: this.activeCharacterId,
      hasBot: this.hasBot,
      characters: this.characters.map((c) => ({ id: c.id, side: c.side, role: c.role, x: c.x, z: c.z })),
      players: this.tPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        side: p.side,
        isBot: p.isBot,
        controllerConnected: p.controllerConnected,
        lastSwing: p.lastSwing,
        score: p.score,
      })),
      pointsToWin: POINTS_TO_WIN,
    };
  }

  broadcastState() {
    this.broadcast({
      type: "game-state",
      payload: this.getState(),
    });
  }

  clearTimers() {
    if (this.tickInterval) { clearInterval(this.tickInterval); this.tickInterval = null; }
    if (this.pointPauseTimeout) { clearTimeout(this.pointPauseTimeout); this.pointPauseTimeout = null; }
    if (this.serveTimeout) { clearTimeout(this.serveTimeout); this.serveTimeout = null; }
    if (this.botReactionTimeout) { clearTimeout(this.botReactionTimeout); this.botReactionTimeout = null; }
  }

  cleanup() {
    this.clearTimers();
  }
}
