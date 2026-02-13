import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

const TOTAL_ROUNDS = 12;
const ACTION_TIME = 8000;
const RESULT_TIME = 3000;

type Action = "attack" | "defend" | "steal" | "charge";

interface KHPlayer {
  id: string; name: string; score: number; energy: number;
  isKing: boolean; hasActed: boolean; action: Action | null;
  shieldActive: boolean; chargeCount: number;
}

export class KingHillGame extends BaseGame {
  kPlayers: Map<string, KHPlayer> = new Map();
  round = 0;
  status: "waiting" | "action" | "result" | "game-over" = "waiting";
  timer: ReturnType<typeof setTimeout> | null = null;
  tickTimer: ReturnType<typeof setInterval> | null = null;
  timeLeft = 0;
  roundLog: string[] = [];

  start() {
    this.started = true;
    const ids = Array.from(this.players.keys());
    const kingIdx = Math.floor(Math.random() * ids.length);
    ids.forEach((id, i) => {
      const p = this.players.get(id)!;
      this.kPlayers.set(id, {
        id, name: p.name, score: 0, energy: 3,
        isKing: i === kingIdx, hasActed: false, action: null,
        shieldActive: false, chargeCount: 0,
      });
    });
    this.nextRound();
  }

  nextRound() {
    this.round++;
    if (this.round > TOTAL_ROUNDS) { this.endKH(); return; }
    // King gains points each round
    for (const p of this.kPlayers.values()) {
      if (p.isKing) p.score += 10;
      p.hasActed = false; p.action = null; p.shieldActive = false;
    }
    this.roundLog = [];
    this.status = "action";
    this.timeLeft = Math.ceil(ACTION_TIME / 1000);
    this.broadcastState();
    this.startTick(ACTION_TIME, () => this.resolveRound());
  }

  resolveRound() {
    this.clearTimers();
    this.roundLog = [];
    const king = Array.from(this.kPlayers.values()).find(p => p.isKing);
    if (!king) { this.endKH(); return; }

    // Process defenses first
    for (const p of this.kPlayers.values()) {
      if (p.action === "defend") {
        p.shieldActive = true;
        this.roundLog.push(`${p.name} se défend`);
      }
      if (p.action === "charge") {
        p.chargeCount++;
        p.energy = Math.min(5, p.energy + 1);
        this.roundLog.push(`${p.name} charge son énergie (${p.energy})`);
      }
    }

    // Process attacks on king
    const attackers = Array.from(this.kPlayers.values()).filter(p => p.action === "attack" && !p.isKing);
    if (attackers.length > 0) {
      const totalAttackPower = attackers.reduce((sum, a) => sum + Math.min(a.energy, 2), 0);
      if (king.shieldActive) {
        this.roundLog.push(`${king.name} bloque les attaques !`);
      } else if (totalAttackPower >= 2) {
        // Dethrone! Strongest attacker becomes king
        const strongest = attackers.sort((a, b) => b.energy - a.energy)[0];
        king.isKing = false;
        strongest.isKing = true;
        strongest.score += 15;
        this.roundLog.push(`${strongest.name} détrône ${king.name} !`);
      } else {
        this.roundLog.push(`Attaque trop faible contre ${king.name}`);
      }
      // Attackers spend energy
      for (const a of attackers) { a.energy = Math.max(0, a.energy - 1); }
    }

    // Process steals
    const stealers = Array.from(this.kPlayers.values()).filter(p => p.action === "steal");
    for (const s of stealers) {
      if (king && !king.shieldActive && king.id !== s.id) {
        const stolen = 5;
        s.score += stolen;
        this.roundLog.push(`${s.name} vole ${stolen} pts au roi`);
      } else if (king?.shieldActive) {
        this.roundLog.push(`${s.name} ne peut pas voler (bouclier)`);
      }
    }

    this.status = "result";
    this.broadcastState();
    this.timer = setTimeout(() => this.nextRound(), RESULT_TIME);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const gp = this.findByConn(sender.id); if (!gp) return;
    const kp = this.kPlayers.get(gp.id); if (!kp) return;

    if (action === "choose" && this.status === "action" && !kp.hasActed) {
      const choice = payload.choice as Action;
      if (!["attack", "defend", "steal", "charge"].includes(choice)) return;
      // King can only defend or charge
      if (kp.isKing && (choice === "attack" || choice === "steal")) return;
      // Need energy to attack
      if (choice === "attack" && kp.energy < 1) return;
      kp.hasActed = true;
      kp.action = choice;
      this.broadcastState();
      if (this.allActed()) this.resolveRound();
    }
  }

  allActed() { return Array.from(this.kPlayers.values()).every(p => p.hasActed); }

  endKH() {
    this.clearTimers(); this.status = "game-over";
    const sorted = Array.from(this.kPlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = sorted.map((p, i) => ({ playerId: p.id, playerName: p.name, rank: i + 1, score: p.score }));
    this.endGame(rankings);
  }

  findByConn(c: string) { for (const [, p] of this.players) { if (p.connectionId === c) return p; } return null; }
  broadcastState() { this.broadcast({ type: "game-state", payload: this.getState() }); }

  getState(): Record<string, unknown> {
    return {
      status: this.status, round: this.round, totalRounds: TOTAL_ROUNDS, timeLeft: this.timeLeft,
      players: Array.from(this.kPlayers.values()).map(p => ({
        id: p.id, name: p.name, score: p.score, energy: p.energy,
        isKing: p.isKing, hasActed: p.hasActed,
      })),
      roundLog: this.roundLog,
    };
  }

  startTick(ms: number, onDone: () => void) {
    this.clearTimers(); this.timeLeft = Math.ceil(ms / 1000);
    this.tickTimer = setInterval(() => { this.timeLeft--; this.broadcastState(); if (this.timeLeft <= 0) { this.clearTimers(); onDone(); } }, 1000);
  }
  clearTimers() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; } }
  cleanup() { this.clearTimers(); }
}
