import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";
// Banque de questions partagée avec le mode local : fichier de données pur
// (aucun import), embarqué tel quel dans le bundle PartyKit.
import { BLUFF_QUESTIONS as QUESTIONS, type BluffQuestion as QA } from "../../src/components/games/le-bluffeur/questions";

// -- Config -----------------------------------------------
const WRITE_TIME = 40;
const VOTE_TIME = 30;
const REVEAL_TIME = 8500;
const TOTAL_ROUNDS = 6;
const START_DELAY = 1300;

// Points
const PTS_FOUND_TRUTH = 30; // tu votes pour la vraie réponse
const PTS_FOOLED = 20; // par personne qui tombe dans ton piège
const PTS_WROTE_TRUTH = 15; // tu as écrit pile la vraie réponse

// -- Types ------------------------------------------------
interface BluffPlayer {
  id: string;
  name: string;
  score: number;
  fake: string | null;
  vote: string | null; // optionId
  foundTruth: boolean; // a écrit pile la vérité
}

interface AnswerOption {
  id: string; // id opaque (aléatoire) : ne révèle rien pendant le vote
  text: string;
  authorIds: string[];
  isTruth: boolean;
}

type GamePhase = "waiting" | "writing" | "voting" | "reveal" | "game-over";

const MIN_ONLINE_PLAYERS = 3;

const normalize = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ");

const randomId = () => Math.random().toString(36).slice(2, 10);

// ==========================================================
export class LeBluffeurGame extends BaseGame {
  gamePlayers: Map<string, BluffPlayer> = new Map();
  phase: GamePhase = "waiting";
  round = 0;
  totalRounds = 0;
  usedQ: Set<number> = new Set();
  currentQ: QA | null = null;
  options: AnswerOption[] = [];
  roundPoints: Record<string, number> = {};
  timeLeft = 0;
  timer: ReturnType<typeof setInterval> | null = null;
  startTimeout: ReturnType<typeof setTimeout> | null = null;

  start() {
    this.started = true;
    if (this.startTimeout) clearTimeout(this.startTimeout);
    this.startTimeout = setTimeout(() => this.beginGame(), START_DELAY);
  }

  beginGame() {
    this.gamePlayers.clear();
    for (const [id, player] of this.players) {
      this.gamePlayers.set(id, { id, name: player.name, score: 0, fake: null, vote: null, foundTruth: false });
    }
    this.totalRounds = Math.min(TOTAL_ROUNDS, QUESTIONS.length);
    this.round = 0;
    this.usedQ.clear();
    this.startRound();
  }

  /** Joueur présent = encore connecté (les déconnectés ne bloquent plus les phases). */
  isPresent(id: string) {
    return this.players.has(id);
  }

  presentPlayers() {
    return Array.from(this.gamePlayers.values()).filter((p) => this.isPresent(p.id));
  }

  startRound() {
    this.round++;
    this.phase = "writing";
    this.options = [];
    this.roundPoints = {};

    // Les retardataires (arrivés après le lancement) entrent en jeu à la manche suivante
    for (const [id, player] of this.players) {
      if (!this.gamePlayers.has(id)) {
        this.gamePlayers.set(id, { id, name: player.name, score: 0, fake: null, vote: null, foundTruth: false });
      }
    }
    for (const p of this.gamePlayers.values()) {
      p.fake = null;
      p.vote = null;
      p.foundTruth = false;
    }

    if (this.usedQ.size >= QUESTIONS.length) this.usedQ.clear();
    let idx = Math.floor(Math.random() * QUESTIONS.length);
    while (this.usedQ.has(idx)) idx = Math.floor(Math.random() * QUESTIONS.length);
    this.usedQ.add(idx);
    this.currentQ = QUESTIONS[idx];

    this.timeLeft = WRITE_TIME;
    this.broadcastPersonalizedState();
    this.startTimer();
    this.queueBotFakes();
  }

  buildVoting() {
    this.stopTimer();
    if (!this.currentQ || this.phase !== "writing") return;
    const truthNorm = normalize(this.currentQ.answer);

    // Regroupe les fausses réponses (dédoublonnées), détecte celles qui valent la vérité
    const fakeMap: Map<string, { text: string; authorIds: string[] }> = new Map();
    for (const p of this.gamePlayers.values()) {
      if (!p.fake) continue;
      const norm = normalize(p.fake);
      if (norm === truthNorm) {
        p.foundTruth = true;
        continue;
      }
      const existing = fakeMap.get(norm);
      if (existing) existing.authorIds.push(p.id);
      else fakeMap.set(norm, { text: p.fake.trim(), authorIds: [p.id] });
    }

    const opts: AnswerOption[] = [];
    for (const { text, authorIds } of fakeMap.values()) {
      opts.push({ id: randomId(), text, authorIds, isTruth: false });
    }
    opts.push({ id: randomId(), text: this.currentQ.answer, authorIds: [], isTruth: true });

    // Mélange (Fisher-Yates)
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    this.options = opts;

    this.phase = "voting";
    this.timeLeft = VOTE_TIME;
    this.broadcastPersonalizedState();
    if (this.allVoted()) {
      this.resolveVotes();
      return;
    }
    this.startTimer();
    this.queueBotVotes();
  }

  allFaked() {
    const present = this.presentPlayers();
    return present.length > 0 && present.every((p) => p.fake !== null);
  }

  allVoted() {
    return this.presentPlayers().every((p) => p.vote !== null || p.foundTruth);
  }

  resolveVotes() {
    this.stopTimer();
    if (this.phase !== "voting") return;

    const pts: Record<string, number> = {};
    for (const p of this.gamePlayers.values()) pts[p.id] = 0;

    for (const p of this.gamePlayers.values()) {
      if (!p.vote) continue;
      const opt = this.options.find((o) => o.id === p.vote);
      if (!opt) continue;
      if (opt.isTruth) {
        pts[p.id] += PTS_FOUND_TRUTH;
      } else {
        for (const a of opt.authorIds) pts[a] = (pts[a] ?? 0) + PTS_FOOLED;
      }
    }
    for (const p of this.gamePlayers.values()) {
      if (p.foundTruth) pts[p.id] += PTS_WROTE_TRUTH;
    }

    this.roundPoints = pts;
    for (const p of this.gamePlayers.values()) p.score += pts[p.id] ?? 0;

    this.phase = "reveal";
    this.broadcastPersonalizedState();

    if (this.startTimeout) clearTimeout(this.startTimeout);
    this.startTimeout = setTimeout(() => {
      if (this.round >= this.totalRounds) this.endBluffeur();
      else this.startRound();
    }, REVEAL_TIME);
  }

  endBluffeur() {
    this.stopTimer();
    this.phase = "game-over";
    const players = Array.from(this.gamePlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      // Ex æquo = même rang
      rank: 1 + players.filter((o) => o.score > p.score).length,
      score: p.score,
    }));
    this.broadcastPersonalizedState();
    setTimeout(() => this.endGame(rankings), 500);
  }

  // -- Bots (partie lancée « avec des bots ») ---------------
  queueBotFakes() {
    for (const p of this.gamePlayers.values()) {
      if (!this.isBot(p.id)) continue;
      this.queueBotAction(() => {
        if (this.phase !== "writing" || p.fake !== null) return;
        // Bluff de bot : la réponse d'une autre question (crédible mais fausse)
        let other = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        if (other === this.currentQ) other = QUESTIONS[(QUESTIONS.indexOf(other) + 1) % QUESTIONS.length];
        this.submitFake(p, other.answer);
      }, 4000, 12000);
    }
  }

  queueBotVotes() {
    for (const p of this.gamePlayers.values()) {
      if (!this.isBot(p.id) || p.foundTruth) continue;
      this.queueBotAction(() => {
        if (this.phase !== "voting" || p.vote !== null) return;
        const choices = this.options.filter((o) => !o.authorIds.includes(p.id));
        const pick = choices[Math.floor(Math.random() * choices.length)];
        if (pick) this.castVote(p, pick.id);
      }, 3000, 9000);
    }
  }

  // -- Messages --------------------------------------------
  submitFake(gp: BluffPlayer, raw: string) {
    const fake = raw.trim();
    if (!fake || gp.fake) return;
    gp.fake = fake.slice(0, 80);
    this.broadcastPersonalizedState();
    if (this.allFaked()) this.buildVoting();
  }

  castVote(gp: BluffPlayer, optId: string) {
    if (gp.vote || gp.foundTruth) return;
    const opt = this.options.find((o) => o.id === optId);
    if (!opt) return;
    if (opt.authorIds.includes(gp.id)) return; // pas de vote pour son propre piège
    gp.vote = optId;
    this.broadcastPersonalizedState();
    if (this.allVoted()) this.resolveVotes();
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const sp = this.findPlayerByConnection(sender.id);
    if (!sp) return;
    const gp = this.gamePlayers.get(sp.id);
    if (!gp) return; // spectateur (arrivé en cours de manche)

    if (action === "submit-fake" && this.phase === "writing") {
      this.submitFake(gp, typeof payload.fake === "string" ? payload.fake : "");
      return;
    }

    if (action === "vote" && this.phase === "voting") {
      this.castVote(gp, payload.optionId as string);
      return;
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({ type: "game-update", payload: { timeLeft: this.timeLeft } });
      // Un joueur s'est déconnecté : on n'attend que les présents
      if (this.phase === "writing" && (this.timeLeft <= 0 || this.allFaked())) this.buildVoting();
      else if (this.phase === "voting" && (this.timeLeft <= 0 || this.allVoted())) this.resolveVotes();
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
      if (this.isBot(pid)) continue;
      this.sendTo(player.connectionId, { type: "game-state", payload: this.getStateForPlayer(pid) });
    }
  }

  getStateForPlayer(pid: string): Record<string, unknown> {
    const state = this.buildPublicState();
    const me = this.gamePlayers.get(pid);
    state.spectator = this.phase !== "waiting" && !me;
    state.myFake = me?.fake ?? null;
    state.myVote = me?.vote ?? null;
    state.iFoundTruth = me?.foundTruth ?? false;
    // Option qui contient MON bluff (comparaison par id, pas par texte)
    state.myOptionId = me ? this.options.find((o) => o.authorIds.includes(me.id))?.id ?? null : null;
    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const isReveal = this.phase === "reveal" || this.phase === "game-over";

    // Pendant le vote : ids opaques, ni auteurs ni vérité ; au reveal on montre tout
    const optionsOut = this.options.map((o) => {
      const voters = Array.from(this.gamePlayers.values()).filter((p) => p.vote === o.id);
      return {
        id: o.id,
        text: o.text,
        isTruth: isReveal ? o.isTruth : null,
        authors: isReveal ? o.authorIds.map((id) => this.gamePlayers.get(id)?.name ?? "?") : null,
        authorIds: isReveal ? o.authorIds : null,
        voterNames: isReveal ? voters.map((v) => v.name) : null,
        voteCount: isReveal ? voters.length : null,
      };
    });

    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.totalRounds,
      timeLeft: this.timeLeft,
      connectedCount: this.players.size,
      minPlayers: MIN_ONLINE_PLAYERS,
      question: this.currentQ?.question ?? null,
      trueAnswer: isReveal ? this.currentQ?.answer ?? null : null,
      options: this.phase === "voting" || isReveal ? optionsOut : null,
      roundPoints: isReveal ? this.roundPoints : null,
      players: Array.from(this.gamePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        hasFake: p.fake !== null,
        hasVoted: p.vote !== null,
        foundTruth: isReveal ? p.foundTruth : null,
        connected: this.isPresent(p.id),
      })),
    };
  }

  getState(): Record<string, unknown> {
    return this.buildPublicState();
  }

  cleanup() {
    this.stopTimer();
    this.clearBotTimeouts();
    if (this.startTimeout) clearTimeout(this.startTimeout);
  }
}
