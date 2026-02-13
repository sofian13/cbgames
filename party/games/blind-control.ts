import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

const GRID_SIZE = 8;
const TOTAL_ROUNDS = 8;
const MOVE_TIME = 10000;
const RESULT_TIME = 3000;

interface Cell { type: "empty" | "coin" | "trap" | "bonus"; }
interface Position { x: number; y: number; }

interface BCPlayer {
  id: string; name: string; score: number;
  hasSubmitted: boolean; direction: string | null;
}

function generateGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const r = Math.random();
      if (r < 0.2) row.push({ type: "coin" });
      else if (r < 0.3) row.push({ type: "trap" });
      else if (r < 0.35) row.push({ type: "bonus" });
      else row.push({ type: "empty" });
    }
    grid.push(row);
  }
  // Ensure start cell is safe
  grid[Math.floor(GRID_SIZE / 2)][Math.floor(GRID_SIZE / 2)] = { type: "empty" };
  return grid;
}

export class BlindControlGame extends BaseGame {
  bPlayers: Map<string, BCPlayer> = new Map();
  round = 0;
  status: "waiting" | "moving" | "result" | "game-over" = "waiting";
  grid: Cell[][] = [];
  charPos: Position = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
  lastResult: { direction: string; cell: string; scoreChange: number } | null = null;
  timer: ReturnType<typeof setTimeout> | null = null;
  tickTimer: ReturnType<typeof setInterval> | null = null;
  timeLeft = 0;

  start() {
    this.started = true;
    this.grid = generateGrid();
    for (const [id, p] of this.players) {
      this.bPlayers.set(id, { id, name: p.name, score: 0, hasSubmitted: false, direction: null });
    }
    this.nextRound();
  }

  nextRound() {
    this.round++;
    if (this.round > TOTAL_ROUNDS) { this.endBC(); return; }
    for (const p of this.bPlayers.values()) { p.hasSubmitted = false; p.direction = null; }
    this.lastResult = null;
    this.status = "moving";
    this.timeLeft = Math.ceil(MOVE_TIME / 1000);
    this.broadcastState();
    this.startTick(MOVE_TIME, () => this.resolveMove());
  }

  resolveMove() {
    this.clearTimers();
    // Count votes for each direction
    const votes: Record<string, number> = { up: 0, down: 0, left: 0, right: 0 };
    for (const p of this.bPlayers.values()) {
      if (p.direction && votes[p.direction] !== undefined) votes[p.direction]++;
    }
    // Majority wins, tie = random among tied
    const maxVotes = Math.max(...Object.values(votes));
    const candidates = Object.entries(votes).filter(([, v]) => v === maxVotes).map(([d]) => d);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? "up";

    // Move character
    const dx = chosen === "left" ? -1 : chosen === "right" ? 1 : 0;
    const dy = chosen === "up" ? -1 : chosen === "down" ? 1 : 0;
    const nx = Math.max(0, Math.min(GRID_SIZE - 1, this.charPos.x + dx));
    const ny = Math.max(0, Math.min(GRID_SIZE - 1, this.charPos.y + dy));
    this.charPos = { x: nx, y: ny };

    const cell = this.grid[ny][nx];
    let scoreChange = 0;
    if (cell.type === "coin") { scoreChange = 10; }
    else if (cell.type === "bonus") { scoreChange = 25; }
    else if (cell.type === "trap") { scoreChange = -15; }

    // Award/penalize all players who voted for the majority direction
    for (const p of this.bPlayers.values()) {
      if (p.direction === chosen) p.score += scoreChange;
      // Small bonus for participating
      if (p.hasSubmitted) p.score += 2;
    }

    // Clear the cell after landing
    this.grid[ny][nx] = { type: "empty" };

    this.lastResult = { direction: chosen, cell: cell.type, scoreChange };
    this.status = "result";
    this.broadcastState();
    this.timer = setTimeout(() => this.nextRound(), RESULT_TIME);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const gp = this.findByConn(sender.id); if (!gp) return;
    const bp = this.bPlayers.get(gp.id); if (!bp) return;

    if (action === "move" && this.status === "moving" && !bp.hasSubmitted) {
      const dir = payload.direction as string;
      if (["up", "down", "left", "right"].includes(dir)) {
        bp.hasSubmitted = true;
        bp.direction = dir;
        this.broadcastState();
        if (this.allSubmitted()) this.resolveMove();
      }
    }
  }

  allSubmitted() {
    return Array.from(this.bPlayers.values()).every(p => p.hasSubmitted);
  }

  endBC() {
    this.clearTimers(); this.status = "game-over";
    const sorted = Array.from(this.bPlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = sorted.map((p, i) => ({ playerId: p.id, playerName: p.name, rank: i + 1, score: p.score }));
    this.endGame(rankings);
  }

  findByConn(c: string) { for (const [, p] of this.players) { if (p.connectionId === c) return p; } return null; }
  broadcastState() { this.broadcast({ type: "game-state", payload: this.getState() }); }

  getState(): Record<string, unknown> {
    // Players can see a limited view of the grid (3x3 around character)
    const visible: { x: number; y: number; type: string }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const vx = this.charPos.x + dx;
        const vy = this.charPos.y + dy;
        if (vx >= 0 && vx < GRID_SIZE && vy >= 0 && vy < GRID_SIZE) {
          visible.push({ x: vx, y: vy, type: this.grid[vy][vx].type });
        }
      }
    }
    return {
      status: this.status, round: this.round, totalRounds: TOTAL_ROUNDS,
      gridSize: GRID_SIZE, charPos: this.charPos, visibleCells: visible,
      lastResult: this.lastResult, timeLeft: this.timeLeft,
      players: Array.from(this.bPlayers.values()).map(p => ({
        id: p.id, name: p.name, score: p.score, hasSubmitted: p.hasSubmitted,
      })),
    };
  }

  startTick(ms: number, onDone: () => void) {
    this.clearTimers(); this.timeLeft = Math.ceil(ms / 1000);
    this.tickTimer = setInterval(() => { this.timeLeft--; this.broadcastState(); if (this.timeLeft <= 0) { this.clearTimers(); onDone(); } }, 1000);
  }
  clearTimers() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; } }
  cleanup() { this.clearTimers(); }
}
