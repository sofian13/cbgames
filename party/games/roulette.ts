import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

const MAX_TURNS = 20;
const STARTING_POINTS = 500;
const BETTING_TIME = 10000;
const ACTION_TIME = 8000;
const RESOLUTION_DISPLAY_TIME = 3500;
const SKIP_COST = 100;
const ADD_BULLET_COST = 150;
const PEEK_COST = 75;
const HIT_PENALTY = 300;
const TIMER_TICK = 1000;

interface RoulettePlayer {
  id: string;
  name: string;
  points: number;
  isAlive: boolean;
  hasBet: boolean;
  bet?: { prediction: "bang" | "safe"; amount: number };
}

interface Resolution {
  hit: boolean;
  playerId: string;
  playerName: string;
  action: string;
}

export class RouletteGame extends BaseGame {
  roulettePlayers: Map<string, RoulettePlayer> = new Map();
  status: "waiting" | "betting" | "action" | "resolution" | "game-over" = "waiting";
  turn = 0;
  currentPlayerIndex = 0;
  barrel = { chambers: 6, bullets: 1 };
  resolution: Resolution | null = null;
  peekResult: boolean | null = null;
  peekPlayerId: string | null = null;
  timeLeft = 0;
  phaseTimeout: ReturnType<typeof setTimeout> | null = null;
  tickInterval: ReturnType<typeof setInterval> | null = null;

  start() {
    this.started = true;
    for (const [id, player] of this.players) {
      this.roulettePlayers.set(id, {
        id, name: player.name, points: STARTING_POINTS, isAlive: true, hasBet: false,
      });
    }
    this.currentPlayerIndex = 0;
    this.nextTurn();
  }

  get playerOrder(): string[] {
    return Array.from(this.roulettePlayers.keys()).filter(
      (id) => this.roulettePlayers.get(id)!.isAlive
    );
  }

  get currentPlayerId(): string {
    const alive = this.playerOrder;
    if (alive.length === 0) return "";
    return alive[this.currentPlayerIndex % alive.length];
  }

  nextTurn() {
    this.turn++;
    if (this.turn > MAX_TURNS || this.playerOrder.length <= 1) {
      this.endRoulette();
      return;
    }
    for (const p of this.roulettePlayers.values()) {
      p.hasBet = false;
      p.bet = undefined;
    }
    this.resolution = null;
    this.peekResult = null;
    this.peekPlayerId = null;
    this.startBettingPhase();
  }

  startBettingPhase() {
    this.status = "betting";
    this.timeLeft = Math.floor(BETTING_TIME / 1000);
    this.broadcastState();
    this.startTimer(BETTING_TIME, () => this.startActionPhase());
  }

  startActionPhase() {
    this.clearTimers();
    this.status = "action";
    this.timeLeft = Math.floor(ACTION_TIME / 1000);
    this.broadcastState();
    this.startTimer(ACTION_TIME, () =>
      this.resolveTriggerPull(this.currentPlayerId, "tirer")
    );
  }

  startTimer(durationMs: number, onEnd: () => void) {
    this.clearTimers();
    this.tickInterval = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      this.broadcastState();
    }, TIMER_TICK);
    this.phaseTimeout = setTimeout(() => {
      this.clearTimers();
      onEnd();
    }, durationMs);
  }

  resolveTriggerPull(playerId: string, action: string) {
    this.clearTimers();
    const player = this.roulettePlayers.get(playerId);
    if (!player) return;
    const hit = Math.random() < this.barrel.bullets / this.barrel.chambers;
    this.resolution = { hit, playerId: player.id, playerName: player.name, action };
    if (hit) {
      player.points -= HIT_PENALTY;
      if (player.points <= 0) {
        player.points = 0;
        player.isAlive = false;
      }
      this.barrel = { chambers: 6, bullets: 1 };
    } else {
      this.barrel.chambers = Math.max(1, this.barrel.chambers - 1);
    }
    for (const p of this.roulettePlayers.values()) {
      if (p.id === playerId || !p.hasBet || !p.bet) continue;
      const correct =
        (p.bet.prediction === "bang" && hit) ||
        (p.bet.prediction === "safe" && !hit);
      if (correct) {
        p.points += p.bet.amount;
      } else {
        p.points -= p.bet.amount;
        if (p.points <= 0) {
          p.points = 0;
          p.isAlive = false;
        }
      }
    }
    this.status = "resolution";
    this.timeLeft = 0;
    this.broadcastState();
    const alive = this.playerOrder;
    if (alive.length <= 1 || this.turn >= MAX_TURNS) {
      this.phaseTimeout = setTimeout(
        () => this.endRoulette(),
        RESOLUTION_DISPLAY_TIME
      );
      return;
    }
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % alive.length;
    this.phaseTimeout = setTimeout(
      () => this.nextTurn(),
      RESOLUTION_DISPLAY_TIME
    );
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const sp = this.findPlayerByConnection(sender.id);
    if (!sp) return;
    const rp = this.roulettePlayers.get(sp.id);
    if (!rp || !rp.isAlive) return;

    if (action === "bet" && this.status === "betting") {
      if (sp.id === this.currentPlayerId || rp.hasBet) return;
      const prediction = payload.prediction as "bang" | "safe";
      const amount = payload.amount as number;
      if (!["bang", "safe"].includes(prediction)) return;
      if (![25, 50, 100].includes(amount)) return;
      if (amount > rp.points) return;
      rp.hasBet = true;
      rp.bet = { prediction, amount };
      this.broadcastState();
      const nonCurrent = Array.from(this.roulettePlayers.values()).filter(
        (p) => p.id !== this.currentPlayerId && p.isAlive
      );
      if (nonCurrent.every((p) => p.hasBet)) this.startActionPhase();
      return;
    }

    if (this.status !== "action" || sp.id !== this.currentPlayerId) return;

    switch (action) {
      case "tirer":
        this.resolveTriggerPull(sp.id, "tirer");
        break;
      case "sauter": {
        if (rp.points < SKIP_COST) {
          this.sendTo(sender.id, {
            type: "game-error",
            payload: { message: "Pas assez de points." },
          });
          return;
        }
        this.clearTimers();
        rp.points -= SKIP_COST;
        for (const p of this.roulettePlayers.values()) {
          if (p.id !== sp.id) {
            p.hasBet = false;
            p.bet = undefined;
          }
        }
        this.resolution = {
          hit: false,
          playerId: sp.id,
          playerName: rp.name,
          action: "sauter",
        };
        this.status = "resolution";
        this.broadcastState();
        const aliveSkip = this.playerOrder;
        this.currentPlayerIndex =
          (this.currentPlayerIndex + 1) % aliveSkip.length;
        this.phaseTimeout = setTimeout(
          () => this.nextTurn(),
          RESOLUTION_DISPLAY_TIME
        );
        break;
      }
      case "ajouter-balle": {
        if (rp.points < ADD_BULLET_COST) {
          this.sendTo(sender.id, {
            type: "game-error",
            payload: { message: "Pas assez de points." },
          });
          return;
        }
        rp.points -= ADD_BULLET_COST;
        this.barrel.bullets = Math.min(
          this.barrel.bullets + 1,
          this.barrel.chambers
        );
        this.resolveTriggerPull(sp.id, "ajouter-balle");
        break;
      }
      case "verifier": {
        if (rp.points < PEEK_COST) {
          this.sendTo(sender.id, {
            type: "game-error",
            payload: { message: "Pas assez de points." },
          });
          return;
        }
        rp.points -= PEEK_COST;
        const peekHit =
          Math.random() < this.barrel.bullets / this.barrel.chambers;
        this.peekResult = peekHit;
        this.peekPlayerId = sp.id;
        this.sendToPlayer(sp.id, {
          type: "game-update",
          payload: { peekResult: peekHit },
        });
        this.clearTimers();
        this.phaseTimeout = setTimeout(
          () => this.resolveTriggerPull(sp.id, "verifier"),
          2500
        );
        break;
      }
    }
  }

  endRoulette() {
    this.clearTimers();
    this.status = "game-over";
    const players = Array.from(this.roulettePlayers.values()).sort(
      (a, b) => b.points - a.points
    );
    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.points,
    }));
    this.broadcastState();
    this.endGame(rankings);
  }

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  getState(): Record<string, unknown> {
    return {
      status: this.status,
      turn: this.turn,
      maxTurns: MAX_TURNS,
      currentPlayerId: this.currentPlayerId,
      barrel: { ...this.barrel },
      players: Array.from(this.roulettePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        points: p.points,
        isAlive: p.isAlive,
        hasBet: p.hasBet,
      })),
      timeLeft: this.timeLeft,
      resolution: this.resolution,
    };
  }

  broadcastState() {
    this.broadcast({ type: "game-state", payload: this.getState() });
  }

  clearTimers() {
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  cleanup() {
    this.clearTimers();
  }
}
