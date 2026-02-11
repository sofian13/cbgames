import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

const TOTAL_ROUNDS = 5;
const MIN_DELAY = 2000; // ms before green
const MAX_DELAY = 6000;
const ROUND_TIMEOUT = 5000; // ms to collect clicks after green
const PENALTY_MS = 500;
const RESULTS_DISPLAY_TIME = 3000;

const POINTS_BY_RANK = [100, 75, 50, 30, 10];

interface ReactionPlayer {
  id: string;
  name: string;
  totalScore: number;
  roundTime?: number; // ms, undefined = didn't click
  penalty: boolean;
  clicked: boolean;
}

export class ReactionTimeGame extends BaseGame {
  reactionPlayers: Map<string, ReactionPlayer> = new Map();
  round = 0;
  status: "waiting" | "red" | "green" | "results" | "game-over" = "waiting";
  greenTimestamp = 0;
  redTimeout: ReturnType<typeof setTimeout> | null = null;
  roundTimeout: ReturnType<typeof setTimeout> | null = null;
  resultsTimeout: ReturnType<typeof setTimeout> | null = null;
  roundResults: { playerId: string; time: number; penalty: boolean }[] = [];

  start() {
    this.started = true;

    for (const [id, player] of this.players) {
      this.reactionPlayers.set(id, {
        id,
        name: player.name,
        totalScore: 0,
        penalty: false,
        clicked: false,
      });
    }

    this.nextRound();
  }

  nextRound() {
    this.round++;
    if (this.round > TOTAL_ROUNDS) {
      this.endReactionTime();
      return;
    }

    // Reset player state for new round
    for (const p of this.reactionPlayers.values()) {
      p.roundTime = undefined;
      p.penalty = false;
      p.clicked = false;
    }
    this.roundResults = [];

    // Show red
    this.status = "red";
    this.broadcastState();

    // Random delay before green
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    this.redTimeout = setTimeout(() => {
      this.goGreen();
    }, delay);
  }

  goGreen() {
    this.status = "green";
    this.greenTimestamp = Date.now();
    this.broadcastState();

    // Timeout: collect results after 5s
    this.roundTimeout = setTimeout(() => {
      this.collectResults();
    }, ROUND_TIMEOUT);
  }

  collectResults() {
    this.clearTimers();

    // Players who didn't click get no points
    const results: { playerId: string; time: number; penalty: boolean }[] = [];

    for (const p of this.reactionPlayers.values()) {
      if (p.clicked) {
        const time = p.penalty ? (p.roundTime ?? 9999) + PENALTY_MS : (p.roundTime ?? 9999);
        results.push({ playerId: p.id, time, penalty: p.penalty });
      } else {
        results.push({ playerId: p.id, time: 9999, penalty: false });
      }
    }

    // Sort by time (lower is better)
    results.sort((a, b) => a.time - b.time);

    // Award points
    results.forEach((r, i) => {
      if (r.time < 9999) {
        const points = POINTS_BY_RANK[Math.min(i, POINTS_BY_RANK.length - 1)];
        const player = this.reactionPlayers.get(r.playerId);
        if (player) player.totalScore += points;
      }
    });

    this.roundResults = results;
    this.status = "results";
    this.broadcastState();

    this.resultsTimeout = setTimeout(() => {
      this.nextRound();
    }, RESULTS_DISPLAY_TIME);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;

    if (action === "click") {
      const senderPlayer = this.findGamePlayerByConnection(sender.id);
      if (!senderPlayer) return;

      const rp = this.reactionPlayers.get(senderPlayer.id);
      if (!rp || rp.clicked) return;

      rp.clicked = true;

      if (this.status === "red") {
        // Clicked too early!
        rp.penalty = true;
        rp.roundTime = 0;

        this.sendTo(sender.id, {
          type: "round-result",
          payload: { event: "too-early" },
        });
      } else if (this.status === "green") {
        const reactionTime = Date.now() - this.greenTimestamp;
        rp.roundTime = reactionTime;

        this.sendTo(sender.id, {
          type: "round-result",
          payload: { event: "clicked", time: reactionTime },
        });

        // Broadcast update so others see who clicked
        this.broadcast({
          type: "game-update",
          payload: {
            players: Array.from(this.reactionPlayers.values()).map(p => ({
              id: p.id,
              name: p.name,
              totalScore: p.totalScore,
              clicked: p.clicked,
              penalty: p.penalty,
            })),
          },
        });

        // Check if all players have clicked
        const allClicked = Array.from(this.reactionPlayers.values()).every(p => p.clicked);
        if (allClicked) {
          this.collectResults();
        }
      }
    }
  }

  endReactionTime() {
    this.clearTimers();
    this.status = "game-over";

    const players = Array.from(this.reactionPlayers.values());
    players.sort((a, b) => b.totalScore - a.totalScore);

    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.totalScore,
    }));

    this.endGame(rankings);
  }

  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  getState(): Record<string, unknown> {
    return {
      players: Array.from(this.reactionPlayers.values()).map(p => ({
        id: p.id,
        name: p.name,
        totalScore: p.totalScore,
        roundTime: p.roundTime,
        penalty: p.penalty,
        clicked: p.clicked,
      })),
      status: this.status,
      round: this.round,
      totalRounds: TOTAL_ROUNDS,
      roundResults: this.roundResults,
    };
  }

  broadcastState() {
    this.broadcast({
      type: "game-state",
      payload: this.getState(),
    });
  }

  clearTimers() {
    if (this.redTimeout) { clearTimeout(this.redTimeout); this.redTimeout = null; }
    if (this.roundTimeout) { clearTimeout(this.roundTimeout); this.roundTimeout = null; }
    if (this.resultsTimeout) { clearTimeout(this.resultsTimeout); this.resultsTimeout = null; }
  }

  cleanup() {
    this.clearTimers();
  }
}
