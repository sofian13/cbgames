import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

type TapRushStatus = "waiting" | "countdown" | "playing" | "results" | "game-over";

interface TapRushPlayer {
  id: string;
  name: string;
  totalScore: number;
  roundTaps: number;
  bestRound: number;
  lastTapAt: number;
}

interface TapRushRoundResult {
  playerId: string;
  taps: number;
  totalScore: number;
  rank: number;
}

const TOTAL_ROUNDS = 4;
const COUNTDOWN_MS = 3000;
const ROUND_DURATION_MS = 7000;
const RESULTS_MS = 2600;
const TICK_MS = 150;
const MIN_TAP_INTERVAL_MS = 18;

export class TapRushGame extends BaseGame {
  tapPlayers: Map<string, TapRushPlayer> = new Map();
  status: TapRushStatus = "waiting";
  round = 0;
  timeLeftMs = 0;
  phaseDurationMs = 0;
  phaseEndsAt = 0;
  phaseInterval: ReturnType<typeof setInterval> | null = null;
  phaseTimeout: ReturnType<typeof setTimeout> | null = null;
  roundResults: TapRushRoundResult[] = [];

  addPlayer(id: string, name: string, conn: Connection) {
    super.addPlayer(id, name, conn);

    const existing = this.tapPlayers.get(id);
    this.tapPlayers.set(id, {
      id,
      name,
      totalScore: existing?.totalScore ?? 0,
      roundTaps: existing?.roundTaps ?? 0,
      bestRound: existing?.bestRound ?? 0,
      lastTapAt: existing?.lastTapAt ?? 0,
    });
  }

  removePlayer(connectionId: string) {
    const removed = super.removePlayer(connectionId);
    if (!removed) return null;

    this.tapPlayers.delete(removed.id);

    if (this.players.size === 0) {
      this.cleanup();
    } else {
      this.broadcastState();
    }

    return removed;
  }

  start() {
    if (this.started) return;

    this.started = true;
    this.round = 0;
    this.roundResults = [];
    this.status = "waiting";

    for (const [id, player] of this.players) {
      this.tapPlayers.set(id, {
        id,
        name: player.name,
        totalScore: 0,
        roundTaps: 0,
        bestRound: 0,
        lastTapAt: 0,
      });
    }

    this.startCountdown();
  }

  startCountdown() {
    this.round += 1;

    if (this.round > TOTAL_ROUNDS) {
      this.finishGame();
      return;
    }

    for (const player of this.tapPlayers.values()) {
      player.roundTaps = 0;
      player.lastTapAt = 0;
    }

    this.roundResults = [];
    this.startPhase("countdown", COUNTDOWN_MS, () => {
      this.startRound();
    });
  }

  startRound() {
    this.startPhase("playing", ROUND_DURATION_MS, () => {
      this.finishRound();
    });
  }

  finishRound() {
    const orderedPlayers = Array.from(this.tapPlayers.values()).sort(
      (a, b) =>
        b.roundTaps - a.roundTaps ||
        b.totalScore - a.totalScore ||
        a.name.localeCompare(b.name)
    );

    for (const player of orderedPlayers) {
      player.totalScore += player.roundTaps;
      player.bestRound = Math.max(player.bestRound, player.roundTaps);
    }

    this.roundResults = orderedPlayers.map((player, index) => ({
      playerId: player.id,
      taps: player.roundTaps,
      totalScore: player.totalScore,
      rank: index + 1,
    }));

    this.startPhase("results", RESULTS_MS, () => {
      this.startCountdown();
    });
  }

  finishGame() {
    this.clearPhaseTimers();
    this.status = "game-over";
    this.timeLeftMs = 0;
    this.phaseDurationMs = 0;

    const players = Array.from(this.tapPlayers.values()).sort(
      (a, b) => b.totalScore - a.totalScore || b.bestRound - a.bestRound || a.name.localeCompare(b.name)
    );

    const rankings: GameRanking[] = players.map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      rank: index + 1,
      score: player.totalScore,
    }));

    this.endGame(rankings);
  }

  startPhase(status: TapRushStatus, durationMs: number, onComplete: () => void) {
    this.clearPhaseTimers();
    this.status = status;
    this.phaseDurationMs = durationMs;
    this.phaseEndsAt = Date.now() + durationMs;
    this.timeLeftMs = durationMs;
    this.broadcastState();

    this.phaseInterval = setInterval(() => {
      this.timeLeftMs = Math.max(0, this.phaseEndsAt - Date.now());
      this.broadcastState();
    }, TICK_MS);

    this.phaseTimeout = setTimeout(() => {
      this.clearPhaseTimers();
      this.timeLeftMs = 0;
      onComplete();
    }, durationMs);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    if (action !== "tap" || this.status !== "playing") return;

    const senderPlayer = this.findGamePlayerByConnection(sender.id);
    if (!senderPlayer) return;

    const player = this.tapPlayers.get(senderPlayer.id);
    if (!player) return;

    const now = Date.now();
    if (now - player.lastTapAt < MIN_TAP_INTERVAL_MS) return;

    player.lastTapAt = now;
    player.roundTaps += 1;
  }

  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  getState(): Record<string, unknown> {
    return {
      players: Array.from(this.tapPlayers.values()).map((player) => ({
        id: player.id,
        name: player.name,
        totalScore: player.totalScore,
        roundTaps: player.roundTaps,
        bestRound: player.bestRound,
      })),
      status: this.status,
      round: this.round,
      totalRounds: TOTAL_ROUNDS,
      timeLeftMs: this.timeLeftMs,
      phaseDurationMs: this.phaseDurationMs,
      roundResults: this.roundResults,
    };
  }

  broadcastState() {
    this.broadcast({
      type: "game-state",
      payload: this.getState(),
    });
  }

  clearPhaseTimers() {
    if (this.phaseInterval) {
      clearInterval(this.phaseInterval);
      this.phaseInterval = null;
    }
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
  }

  cleanup() {
    this.clearPhaseTimers();
  }
}
