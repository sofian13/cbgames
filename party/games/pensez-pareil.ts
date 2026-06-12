import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Config -----------------------------------------------
const START_DELAY = 1200;
const INTRO_TIME = 2800;
const ANSWER_TIME = 35;
const REVEAL_TIME = 6500;
const TOTAL_ROUNDS = 8;

const SYNC_BASE = 100; // points pour un sync
const COMBO_STEP = 25; // bonus par cran de série

// -- Prompts (escalade soft -> couple -> coquin) ----------
interface Prompt {
  text: string;
  tier: "soft" | "couple" | "spicy";
}

const PROMPTS: Prompt[] = [
  // soft — "pensez au même truc"
  { text: "Un fruit", tier: "soft" },
  { text: "Une couleur", tier: "soft" },
  { text: "Un animal de compagnie", tier: "soft" },
  { text: "Un pays à visiter", tier: "soft" },
  { text: "Un chiffre entre 1 et 10", tier: "soft" },
  { text: "Une saison", tier: "soft" },
  { text: "Un dessert", tier: "soft" },
  { text: "Un super-héros", tier: "soft" },
  { text: "Une boisson chaude", tier: "soft" },
  { text: "Un film d'animation", tier: "soft" },
  { text: "Un emoji", tier: "soft" },
  { text: "Une pizza (la garniture)", tier: "soft" },
  // couple — "êtes-vous d'accord sur nous ?"
  { text: "Notre série du moment", tier: "couple" },
  { text: "Notre prochaine destination", tier: "couple" },
  { text: "Un plat qu'on commande toujours", tier: "couple" },
  { text: "Notre activité du dimanche", tier: "couple" },
  { text: "Notre chanson", tier: "couple" },
  { text: "Le prénom de notre futur animal", tier: "couple" },
  { text: "Notre resto préféré", tier: "couple" },
  { text: "Un truc qui nous fait toujours rire", tier: "couple" },
  // spicy — coquin (suggestif, dans le ton de l'app)
  { text: "Un endroit insolite pour s'embrasser", tier: "spicy" },
  { text: "Une partie du corps de l'autre", tier: "spicy" },
  { text: "Un mot pour décrire notre dernière nuit", tier: "spicy" },
  { text: "Une tenue qui rend l'autre fou", tier: "spicy" },
];

// -- Matching ---------------------------------------------
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^(l'|le |la |les |un |une |des |du |de |d')/, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function lev(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function isMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x))) return true;
  return lev(x, y) <= 1 && Math.max(x.length, y.length) >= 4;
}

function pickRoundPrompts(): Prompt[] {
  const byTier = (t: Prompt["tier"]) =>
    PROMPTS.filter((p) => p.tier === t).sort(() => Math.random() - 0.5);
  const soft = byTier("soft");
  const couple = byTier("couple");
  const spicy = byTier("spicy");
  // escalade : 3 soft, 3 couple, 2 spicy
  return [...soft.slice(0, 3), ...couple.slice(0, 3), ...spicy.slice(0, 2)];
}

// -- Types ------------------------------------------------
interface PPlayer {
  id: string;
  name: string;
  answer: string | null;
}

type Phase = "waiting" | "intro" | "answer" | "reveal" | "game-over";

// ==========================================================
export class PensezPareilGame extends BaseGame {
  gamePlayers: Map<string, PPlayer> = new Map();
  phase: Phase = "waiting";
  round = 0;
  prompts: Prompt[] = [];
  prompt: Prompt | null = null;

  syncs = 0;
  streak = 0;
  bestStreak = 0;
  teamScore = 0;
  lastMatched = false;
  lastPoints = 0;

  timeLeft = 0;
  timer: ReturnType<typeof setInterval> | null = null;
  phaseTimeout: ReturnType<typeof setTimeout> | null = null;

  start() {
    this.started = true;
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(() => this.beginGame(), START_DELAY);
  }

  beginGame() {
    this.gamePlayers.clear();
    for (const [id, player] of this.players) {
      this.gamePlayers.set(id, { id, name: player.name, answer: null });
    }
    this.prompts = pickRoundPrompts();
    this.round = 0;
    this.syncs = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.teamScore = 0;
    this.startRound();
  }

  startRound() {
    this.round++;
    this.phase = "intro";
    this.prompt = this.prompts[(this.round - 1) % this.prompts.length];
    this.lastMatched = false;
    this.lastPoints = 0;
    for (const p of this.gamePlayers.values()) p.answer = null;

    this.broadcastPersonalizedState();

    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(() => {
      this.phase = "answer";
      this.timeLeft = ANSWER_TIME;
      this.broadcastPersonalizedState();
      this.startTimer();
      this.scheduleBots();
    }, INTRO_TIME);
  }

  scheduleBots() {
    for (const p of this.gamePlayers.values()) {
      if (this.isBot(p.id) && p.answer == null) {
        this.queueBotAction(() => {
          if (this.phase !== "answer") return;
          const bot = this.gamePlayers.get(p.id);
          if (!bot || bot.answer != null) return;
          bot.answer = "...";
          this.afterAnswer();
        }, 2500, 6000);
      }
    }
  }

  resolve() {
    this.stopTimer();
    const players = Array.from(this.gamePlayers.values());
    const [a, b] = players;
    const matched = players.length >= 2 ? isMatch(a?.answer ?? null, b?.answer ?? null) : false;

    this.lastMatched = matched;
    if (matched) {
      this.syncs++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.lastPoints = SYNC_BASE + (this.streak - 1) * COMBO_STEP;
      this.teamScore += this.lastPoints;
    } else {
      this.streak = 0;
      this.lastPoints = 0;
    }

    this.phase = "reveal";
    this.broadcastPersonalizedState();

    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(() => {
      if (this.round >= TOTAL_ROUNDS) this.endMatch();
      else this.startRound();
    }, REVEAL_TIME);
  }

  endMatch() {
    this.stopTimer();
    this.phase = "game-over";
    // Coopératif : les deux partagent le score d'équipe.
    const rankings: GameRanking[] = Array.from(this.gamePlayers.values()).map((p) => ({
      playerId: p.id,
      playerName: p.name,
      rank: 1,
      score: this.teamScore,
    }));
    this.broadcastPersonalizedState();
    setTimeout(() => this.endGame(rankings), 500);
  }

  afterAnswer() {
    const players = Array.from(this.gamePlayers.values());
    const needed = Math.min(2, players.length);
    const answered = players.filter((p) => p.answer != null).length;
    this.broadcastPersonalizedState();
    if (answered >= needed && needed >= 1) this.resolve();
  }

  // -- Messages --------------------------------------------
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const sp = this.findPlayerByConnection(sender.id);
    if (!sp) return;
    const gp = this.gamePlayers.get(sp.id);
    if (!gp) return;

    if (action === "submit-answer" && this.phase === "answer") {
      if (gp.answer != null) return;
      const ans = ((payload.answer as string) ?? "").trim().slice(0, 40);
      if (!ans) return;
      gp.answer = ans;
      this.afterAnswer();
      return;
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({ type: "game-update", payload: { timeLeft: this.timeLeft } });
      if (this.timeLeft <= 0) {
        // temps écoulé : on remplit les réponses manquantes par vide et on résout
        if (this.phase === "answer") this.resolve();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  // -- State -----------------------------------------------
  broadcastPersonalizedState() {
    for (const [pid, player] of this.players) {
      this.sendTo(player.connectionId, { type: "game-state", payload: this.getStateForPlayer(pid) });
    }
  }

  getStateForPlayer(pid: string): Record<string, unknown> {
    const state = this.buildPublicState();
    const me = this.gamePlayers.get(pid);
    state.myAnswer = me?.answer ?? null;
    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const isReveal = this.phase === "reveal" || this.phase === "game-over";
    const players = Array.from(this.gamePlayers.values());
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: TOTAL_ROUNDS,
      timeLeft: this.timeLeft,
      prompt: this.prompt,
      syncs: this.syncs,
      streak: this.streak,
      bestStreak: this.bestStreak,
      teamScore: this.teamScore,
      matched: isReveal ? this.lastMatched : null,
      lastPoints: isReveal ? this.lastPoints : null,
      answers: isReveal
        ? Object.fromEntries(players.map((p) => [p.id, p.answer]))
        : null,
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        hasAnswered: p.answer != null,
      })),
    };
  }

  getState(): Record<string, unknown> {
    return this.buildPublicState();
  }

  restartIfFinished(): boolean {
    if (this.phase === "game-over") {
      this.beginGame();
      return true;
    }
    return false;
  }

  cleanup() {
    this.stopTimer();
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.clearBotTimeouts();
  }
}
