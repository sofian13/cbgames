import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";
import { PROMPTS, isMatch, shuffle, ANSWER_TIME, type Prompt } from "../../src/components/games/pensez-pareil/pp-content";

// -- Config -----------------------------------------------
const START_DELAY = 1200;
const INTRO_TIME = 2800;
const REVEAL_TIME = 6500;
const TOTAL_ROUNDS = 8;

const SYNC_BASE = 100; // points pour un sync
const COMBO_STEP = 25; // bonus par cran de série

// -- Prompts + matching : module partagé avec le client (pp-content.ts) ---
export { isMatch };

type Ambiance = "classic" | "spicy";

function pickRoundPrompts(ambiance: Ambiance): Prompt[] {
  const byTier = (t: Prompt["tier"]) => shuffle(PROMPTS.filter((p) => p.tier === t));
  const soft = byTier("soft");
  const couple = byTier("couple");
  if (ambiance === "spicy") {
    // escalade : 3 soft, 2 couple, 3 coquins
    return [...soft.slice(0, 3), ...couple.slice(0, 2), ...byTier("spicy").slice(0, 3)];
  }
  // Classique : 4 soft, 4 couple
  return [...soft.slice(0, 4), ...couple.slice(0, 4)];
}

// -- Types ------------------------------------------------
interface PPlayer {
  id: string;
  name: string;
  answer: string | null;
}

type Phase = "waiting" | "config" | "intro" | "answer" | "reveal" | "game-over";

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
  endTimer: ReturnType<typeof setTimeout> | null = null;

  ambiance: Ambiance = "classic"; // Classique par défaut, Coquin 18+ sur choix explicite
  paused = false; // un des deux joueurs est parti : on attend son retour

  start() {
    this.started = true;
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    // Choix de l'ambiance avant de lancer (comme le mode local)
    this.phaseTimeout = setTimeout(() => {
      this.phase = "config";
      this.broadcastPersonalizedState();
    }, START_DELAY);
  }

  /** Les deux joueurs de la partie sont-ils connectés ? */
  bothPresent(): boolean {
    const ids = Array.from(this.gamePlayers.keys());
    return ids.length >= 2 && ids.every((id) => this.players.has(id));
  }

  beginGame() {
    this.clearEndTimer();
    // On garde le duo en place s'il est toujours là ; sinon les 2 premiers présents.
    const keep = this.bothPresent() ? Array.from(this.gamePlayers.keys()) : Array.from(this.players.keys()).slice(0, 2);
    this.gamePlayers.clear();
    for (const id of keep) {
      const player = this.players.get(id);
      if (player) this.gamePlayers.set(id, { id, name: player.name, answer: null });
    }
    this.paused = false;
    this.prompts = pickRoundPrompts(this.ambiance);
    this.round = 0;
    this.syncs = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.teamScore = 0;
    this.startRound();
  }

  startRound() {
    if (!this.bothPresent()) {
      this.pause();
      return;
    }
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
    this.clearEndTimer();
    this.endTimer = setTimeout(() => {
      this.endTimer = null;
      this.endGame(rankings);
    }, 500);
  }

  clearEndTimer() {
    if (this.endTimer) clearTimeout(this.endTimer);
    this.endTimer = null;
  }

  afterAnswer() {
    const players = Array.from(this.gamePlayers.values());
    // La manche ne se résout que quand les DEUX joueurs de la partie ont répondu.
    if (players.length >= 2 && players.every((p) => p.answer != null)) {
      this.resolve();
    } else {
      this.broadcastPersonalizedState();
    }
  }

  /** Partenaire parti : on fige la manche en cours. */
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.stopTimer();
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = null;
    this.clearBotTimeouts();
    this.broadcastPersonalizedState();
  }

  /** Les deux sont de retour : on rejoue la manche interrompue. */
  resume() {
    if (!this.paused || !this.bothPresent()) return;
    this.paused = false;
    // Met à jour les noms/connexions et repart sur la même manche (réponses effacées)
    if (this.phase === "reveal") {
      // la manche était déjà jouée : on passe à la suivante
      if (this.round >= TOTAL_ROUNDS) this.endMatch();
      else this.startRound();
      return;
    }
    this.round = Math.max(0, this.round - 1);
    this.startRound();
  }

  addPlayer(id: string, name: string, conn: Connection) {
    super.addPlayer(id, name, conn);
    if (this.paused && this.gamePlayers.has(id)) this.resume();
  }

  removePlayer(connectionId: string) {
    const removed = super.removePlayer(connectionId);
    if (
      removed &&
      this.gamePlayers.has(removed.id) &&
      (this.phase === "intro" || this.phase === "answer" || this.phase === "reveal")
    ) {
      this.pause();
    }
    return removed;
  }

  // -- Messages --------------------------------------------
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const sp = this.findPlayerByConnection(sender.id);
    if (!sp) return;

    // Choix de l'ambiance + lancement (réservé aux 2 premiers joueurs)
    if (this.phase === "config") {
      const duo = Array.from(this.players.keys()).slice(0, 2);
      if (!duo.includes(sp.id)) return;
      if (action === "set-ambiance" && (payload.ambiance === "classic" || payload.ambiance === "spicy")) {
        this.ambiance = payload.ambiance;
        this.broadcastPersonalizedState();
        return;
      }
      if (action === "begin-game" && this.players.size >= 2) {
        this.beginGame();
        return;
      }
      return;
    }

    const gp = this.gamePlayers.get(sp.id);
    if (!gp) return; // spectateur : ignoré

    if (action === "submit-answer" && this.phase === "answer" && !this.paused) {
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
    // Au-delà des 2 joueurs de la partie : spectateur
    state.isSpectator =
      this.phase === "config"
        ? !Array.from(this.players.keys()).slice(0, 2).includes(pid)
        : this.gamePlayers.size > 0 && !me;
    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const isReveal = this.phase === "reveal" || this.phase === "game-over";
    const players = Array.from(this.gamePlayers.values());
    return {
      phase: this.phase,
      paused: this.paused,
      ambiance: this.ambiance,
      connectedCount: this.players.size,
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
        present: this.players.has(p.id),
      })),
    };
  }

  getState(): Record<string, unknown> {
    return this.buildPublicState();
  }

  restartIfFinished(): boolean {
    // Ne relance que si le duo est au complet (sinon on attend le/la partenaire)
    if (this.phase === "game-over" && this.players.size >= 2) {
      this.beginGame();
      return true;
    }
    return false;
  }

  cleanup() {
    this.stopTimer();
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.clearBotTimeouts();
    this.clearEndTimer();
  }
}
