import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Config -----------------------------------------------
const INTRO_TIME = 3200;
const CLUE_TIME = 45;
const GUESS_TIME = 30;
const REVEAL_TIME = 8500;
const START_DELAY = 1300;

// Points selon la distance |guess - target| (0-100)
function distancePoints(d: number): number {
  if (d <= 5) return 5;
  if (d <= 12) return 3;
  if (d <= 22) return 2;
  return 0;
}

// -- Spectrum bank ----------------------------------------
interface Spectrum {
  left: string;
  right: string;
}

const SPECTRUMS: Spectrum[] = [
  { left: "Inutile", right: "Indispensable" },
  { left: "Ringard", right: "Stylé" },
  { left: "Sous-coté", right: "Surcoté" },
  { left: "Soft", right: "Hardcore" },
  { left: "Mauvais film", right: "Chef-d'œuvre" },
  { left: "Aliment dégueu", right: "Aliment délicieux" },
  { left: "Talent inutile", right: "Super-pouvoir" },
  { left: "Pas cher", right: "Hors de prix" },
  { left: "Animal nul", right: "Animal parfait" },
  { left: "Crime mineur", right: "Crime grave" },
  { left: "Date raté", right: "Date parfait" },
  { left: "Tenue gênante", right: "Tenue canon" },
  { left: "Pas romantique", right: "Très romantique" },
  { left: "Activité chiante", right: "Activité fun" },
  { left: "Cadeau nul", right: "Cadeau de rêve" },
  { left: "Pas attirant", right: "Irrésistible" },
  { left: "Métier facile", right: "Métier difficile" },
  { left: "Plaisir coupable", right: "Vraie fierté" },
  { left: "Banal", right: "Légendaire" },
  { left: "Calme", right: "Chaotique" },
  { left: "Has-been", right: "Tendance" },
  { left: "Effrayant", right: "Mignon" },
  { left: "Surfait", right: "Culte" },
  { left: "Léger", right: "Lourd à porter" },
  { left: "Innocent", right: "Coquin" },
  { left: "Mauvais goût", right: "Très classe" },
  { left: "Ennuyeux au lit", right: "Bête de sexe" },
  { left: "Petit mensonge", right: "Vraie trahison" },
  { left: "Bonne excuse", right: "Excuse bidon" },
  { left: "Trop tôt", right: "Trop tard" },
];

// -- Types ------------------------------------------------
interface WavePlayer {
  id: string;
  name: string;
  score: number;
  isPsychic: boolean;
  guess: number | null;
}

type GamePhase = "waiting" | "intro" | "clue" | "guessing" | "reveal" | "game-over";

// ==========================================================
export class LongueurOndeGame extends BaseGame {
  gamePlayers: Map<string, WavePlayer> = new Map();
  phase: GamePhase = "waiting";
  round = 0;
  totalRounds = 0;
  psychicQueue: string[] = [];
  psychicId: string | null = null;
  spectrum: Spectrum | null = null;
  usedSpectrums: Set<number> = new Set();
  target = 50;
  clue: string | null = null;
  roundPoints: Record<string, number> = {};
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
      this.gamePlayers.set(id, { id, name: player.name, score: 0, isPsychic: false, guess: null });
    }
    const ids = Array.from(this.gamePlayers.keys());
    this.psychicQueue = [...ids].sort(() => Math.random() - 0.5);
    this.totalRounds = ids.length; // chacun est medium une fois
    this.round = 0;
    this.usedSpectrums.clear();
    this.startRound();
  }

  startRound() {
    this.round++;
    this.phase = "intro";
    this.clue = null;
    this.roundPoints = {};
    this.psychicId = this.psychicQueue[(this.round - 1) % this.psychicQueue.length];

    for (const p of this.gamePlayers.values()) {
      p.guess = null;
      p.isPsychic = p.id === this.psychicId;
    }

    if (this.usedSpectrums.size >= SPECTRUMS.length) this.usedSpectrums.clear();
    let idx = Math.floor(Math.random() * SPECTRUMS.length);
    while (this.usedSpectrums.has(idx)) idx = Math.floor(Math.random() * SPECTRUMS.length);
    this.usedSpectrums.add(idx);
    this.spectrum = SPECTRUMS[idx];

    this.target = 8 + Math.floor(Math.random() * 85); // 8..92

    this.broadcastPersonalizedState();

    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(() => {
      this.phase = "clue";
      this.timeLeft = CLUE_TIME;
      this.broadcastPersonalizedState();
      this.startTimer();
    }, INTRO_TIME);
  }

  startGuessing() {
    this.stopTimer();
    this.phase = "guessing";
    this.timeLeft = GUESS_TIME;
    this.broadcastPersonalizedState();
    this.startTimer();
  }

  resolve() {
    this.stopTimer();
    const pts: Record<string, number> = {};
    for (const p of this.gamePlayers.values()) pts[p.id] = 0;

    const guessers = Array.from(this.gamePlayers.values()).filter((p) => !p.isPsychic);
    let sum = 0;
    let count = 0;
    for (const g of guessers) {
      if (g.guess == null) continue;
      const d = Math.abs(g.guess - this.target);
      const p = distancePoints(d);
      pts[g.id] += p;
      sum += p;
      count++;
    }
    // Le medium gagne la moyenne (arrondie) des points de l'equipe
    if (this.psychicId) {
      pts[this.psychicId] = count > 0 ? Math.round(sum / count) : 0;
    }

    this.roundPoints = pts;
    for (const p of this.gamePlayers.values()) p.score += pts[p.id] ?? 0;

    this.phase = "reveal";
    this.broadcastPersonalizedState();

    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(() => {
      if (this.round >= this.totalRounds) this.endWave();
      else this.startRound();
    }, REVEAL_TIME);
  }

  endWave() {
    this.stopTimer();
    this.phase = "game-over";
    const players = Array.from(this.gamePlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));
    this.broadcastPersonalizedState();
    setTimeout(() => this.endGame(rankings), 500);
  }

  // -- Messages --------------------------------------------
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const sp = this.findPlayerByConnection(sender.id);
    if (!sp) return;
    const gp = this.gamePlayers.get(sp.id);
    if (!gp) return;

    if (action === "submit-clue" && this.phase === "clue") {
      if (gp.id !== this.psychicId) return;
      const clue = ((payload.clue as string) ?? "").trim();
      if (!clue) return;
      this.clue = clue.slice(0, 60);
      this.startGuessing();
      return;
    }

    if (action === "submit-guess" && this.phase === "guessing") {
      if (gp.isPsychic) return;
      let g = Number(payload.guess);
      if (Number.isNaN(g)) return;
      g = Math.max(0, Math.min(100, Math.round(g)));
      gp.guess = g;
      this.broadcastPersonalizedState();
      const guessers = Array.from(this.gamePlayers.values()).filter((p) => !p.isPsychic);
      if (guessers.every((p) => p.guess != null)) this.resolve();
      return;
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({ type: "game-update", payload: { timeLeft: this.timeLeft } });
      if (this.timeLeft <= 0) {
        if (this.phase === "clue") {
          this.clue = this.clue ?? "(pas d'indice)";
          this.startGuessing();
        } else if (this.phase === "guessing") {
          this.resolve();
        }
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
    const amPsychic = pid === this.psychicId;
    state.amPsychic = amPsychic;
    state.myGuess = me?.guess ?? null;
    // Le medium voit la cible pendant clue/guessing ; les autres jamais avant le reveal
    const isReveal = this.phase === "reveal" || this.phase === "game-over";
    state.myTarget = amPsychic && (this.phase === "clue" || this.phase === "guessing") ? this.target : isReveal ? this.target : null;
    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const psychic = this.psychicId ? this.gamePlayers.get(this.psychicId) : null;
    const isReveal = this.phase === "reveal" || this.phase === "game-over";

    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.totalRounds,
      timeLeft: this.timeLeft,
      psychicId: this.psychicId,
      psychicName: psychic?.name ?? null,
      spectrum: this.spectrum,
      clue: this.phase === "guessing" || isReveal ? this.clue : null,
      target: isReveal ? this.target : null,
      guesses: isReveal
        ? Object.fromEntries(
            Array.from(this.gamePlayers.values())
              .filter((p) => !p.isPsychic && p.guess != null)
              .map((p) => [p.id, p.guess])
          )
        : null,
      roundPoints: isReveal ? this.roundPoints : null,
      players: Array.from(this.gamePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isPsychic: p.isPsychic,
        hasGuessed: p.guess != null,
      })),
    };
  }

  getState(): Record<string, unknown> {
    return this.buildPublicState();
  }

  cleanup() {
    this.stopTimer();
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
  }
}
