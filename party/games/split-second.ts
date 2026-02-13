import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

type ChallengeType = "click-color" | "type-word" | "math" | "click-count" | "dont-click" | "biggest" | "odd-one-out";

interface Challenge { type: ChallengeType; instruction: string; data: Record<string, unknown>; answer: unknown; }

const COLORS = ["Rouge", "Bleu", "Vert", "Jaune"];
const WORDS = ["RAPIDE", "VITE", "TURBO", "FONCE", "ECLAT", "FLASH", "BOOM", "NINJA"];
const EMOJIS_SETS = [
  { items: ["🍎", "🍎", "🍌", "🍎"], odd: 2 },
  { items: ["🐱", "🐶", "🐱", "🐱"], odd: 1 },
  { items: ["⭐", "⭐", "⭐", "🌙"], odd: 3 },
  { items: ["🔵", "🔵", "🔴", "🔵"], odd: 2 },
  { items: ["🎵", "🎵", "🎵", "🎶"], odd: 3 },
];

const MAX_ROUNDS = 25;
const INITIAL_TIME = 3500;
const TIME_DECREASE = 150;
const MIN_TIME = 1500;
const RESULT_DISPLAY = 2000;

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function generateChallenge(): Challenge {
  const types: ChallengeType[] = ["click-color", "type-word", "math", "click-count", "dont-click", "biggest", "odd-one-out"];
  const type = types[Math.floor(Math.random() * types.length)];
  switch (type) {
    case "click-color": {
      const target = COLORS[Math.floor(Math.random() * COLORS.length)];
      return { type, instruction: `Clique sur ${target} !`, data: { buttons: shuffle(COLORS), targetColor: target }, answer: target };
    }
    case "type-word": {
      const word = WORDS[Math.floor(Math.random() * WORDS.length)];
      return { type, instruction: `Tape : ${word}`, data: { word }, answer: word };
    }
    case "math": {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const ops = ["+", "-", "×"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let ans = 0;
      if (op === "+") ans = a + b;
      else if (op === "-") ans = a - b;
      else ans = a * b;
      return { type, instruction: `Calcule : ${a} ${op} ${b} = ?`, data: { display: `${a} ${op} ${b}` }, answer: ans };
    }
    case "click-count": {
      const target = Math.floor(Math.random() * 4) + 3;
      return { type, instruction: `Clique ${target} fois !`, data: { target }, answer: target };
    }
    case "dont-click":
      return { type, instruction: "NE CLIQUE PAS !", data: {}, answer: null };
    case "biggest": {
      const nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 100) + 1);
      while (new Set(nums).size < 4) { nums[Math.floor(Math.random() * 4)] = Math.floor(Math.random() * 100) + 1; }
      return { type, instruction: "Clique le plus GRAND !", data: { numbers: nums }, answer: String(Math.max(...nums)) };
    }
    case "odd-one-out": {
      const set = EMOJIS_SETS[Math.floor(Math.random() * EMOJIS_SETS.length)];
      return { type, instruction: "Trouve l'intrus !", data: { items: set.items }, answer: set.odd };
    }
  }
}

interface SSPlayer {
  id: string; name: string; lives: number; score: number; isAlive: boolean;
  answered: boolean; success: boolean | null; clickCount: number;
}

export class SplitSecondGame extends BaseGame {
  sPlayers: Map<string, SSPlayer> = new Map();
  round = 0;
  status: "waiting" | "challenge" | "result" | "game-over" = "waiting";
  challenge: Challenge | null = null;
  timeLimit = INITIAL_TIME;
  timer: ReturnType<typeof setTimeout> | null = null;
  tickTimer: ReturnType<typeof setInterval> | null = null;
  timeLeft = 0;
  roundResults: { playerId: string; success: boolean }[] = [];

  start() {
    this.started = true;
    for (const [id, p] of this.players) {
      this.sPlayers.set(id, { id, name: p.name, lives: 3, score: 0, isAlive: true, answered: false, success: null, clickCount: 0 });
    }
    this.nextRound();
  }

  nextRound() {
    this.round++;
    const alive = Array.from(this.sPlayers.values()).filter(p => p.isAlive);
    if (alive.length <= 1 || this.round > MAX_ROUNDS) { this.endSS(); return; }
    for (const p of this.sPlayers.values()) { p.answered = false; p.success = null; p.clickCount = 0; }
    this.challenge = generateChallenge();
    this.timeLimit = Math.max(MIN_TIME, INITIAL_TIME - (this.round - 1) * TIME_DECREASE);
    this.status = "challenge";
    this.timeLeft = Math.ceil(this.timeLimit / 1000);
    this.broadcastState();
    this.startTick(this.timeLimit, () => this.resolveRound());
  }

  resolveRound() {
    this.clearTimers();
    const alive = Array.from(this.sPlayers.values()).filter(p => p.isAlive);
    this.roundResults = [];
    for (const p of alive) {
      let success = false;
      if (this.challenge?.type === "dont-click") {
        success = !p.answered; // didn't click = success
      } else if (this.challenge?.type === "click-count") {
        success = p.clickCount >= (this.challenge.data.target as number);
      } else {
        success = p.success === true;
      }
      if (!success) { p.lives--; if (p.lives <= 0) p.isAlive = false; }
      else { p.score += 10; }
      this.roundResults.push({ playerId: p.id, success });
    }
    this.status = "result";
    this.broadcastState();
    this.timer = setTimeout(() => this.nextRound(), RESULT_DISPLAY);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const gp = this.findByConn(sender.id); if (!gp) return;
    const sp = this.sPlayers.get(gp.id); if (!sp || !sp.isAlive || this.status !== "challenge") return;

    if (action === "answer" && !sp.answered) {
      sp.answered = true;
      const val = String(payload.value ?? "");
      const ch = this.challenge!;
      if (ch.type === "click-color") sp.success = val === ch.answer;
      else if (ch.type === "type-word") sp.success = val.toUpperCase() === (ch.answer as string);
      else if (ch.type === "math") sp.success = Number(val) === ch.answer;
      else if (ch.type === "biggest") sp.success = val === ch.answer;
      else if (ch.type === "odd-one-out") sp.success = Number(val) === ch.answer;
      this.broadcastState();
      if (this.allAnswered()) this.resolveRound();
    }
    if (action === "click" && this.challenge?.type === "click-count") {
      sp.clickCount++;
      if (sp.clickCount >= (this.challenge.data.target as number) && !sp.answered) {
        sp.answered = true; sp.success = true;
      }
      this.broadcastState();
      if (this.allAnswered()) this.resolveRound();
    }
    if (action === "clicked" && this.challenge?.type === "dont-click") {
      sp.answered = true; sp.success = false;
      this.broadcastState();
    }
  }

  allAnswered() {
    return Array.from(this.sPlayers.values()).filter(p => p.isAlive).every(p => p.answered);
  }

  endSS() {
    this.clearTimers(); this.status = "game-over";
    const sorted = Array.from(this.sPlayers.values()).sort((a, b) => b.isAlive === a.isAlive ? b.score - a.score : (b.isAlive ? 1 : 0) - (a.isAlive ? 1 : 0));
    const rankings: GameRanking[] = sorted.map((p, i) => ({ playerId: p.id, playerName: p.name, rank: i + 1, score: p.score }));
    this.endGame(rankings);
  }

  findByConn(c: string) { for (const [, p] of this.players) { if (p.connectionId === c) return p; } return null; }
  broadcastState() { this.broadcast({ type: "game-state", payload: this.getState() }); }

  getState(): Record<string, unknown> {
    return {
      status: this.status, round: this.round,
      challenge: this.challenge && this.status === "challenge" ? { type: this.challenge.type, instruction: this.challenge.instruction, data: this.challenge.data } : null,
      timeLimit: this.timeLimit, timeLeft: this.timeLeft,
      players: Array.from(this.sPlayers.values()).map(p => ({
        id: p.id, name: p.name, lives: p.lives, score: p.score, isAlive: p.isAlive,
        lastResult: this.status === "result" ? (this.roundResults.find(r => r.playerId === p.id)?.success ? "success" : "fail") : null,
      })),
      roundResults: this.status === "result" ? this.roundResults : undefined,
    };
  }

  startTick(ms: number, onDone: () => void) {
    this.clearTimers(); this.timeLeft = Math.ceil(ms / 1000);
    this.tickTimer = setInterval(() => { this.timeLeft--; this.broadcastState(); if (this.timeLeft <= 0) { this.clearTimers(); onDone(); } }, 1000);
  }
  clearTimers() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; } }
  cleanup() { this.clearTimers(); }
}
