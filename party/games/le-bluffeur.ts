import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Config -----------------------------------------------
const WRITE_TIME = 40;
const VOTE_TIME = 30;
const REVEAL_TIME = 8500;
const TOTAL_ROUNDS = 6;
const START_DELAY = 1300;

// Points
const PTS_FOUND_TRUTH = 30; // tu votes pour la vraie reponse
const PTS_FOOLED = 20; // par personne qui tombe dans ton piege
const PTS_WROTE_TRUTH = 15; // tu as ecrit pile la vraie reponse

// -- Question bank ----------------------------------------
interface QA {
  question: string;
  answer: string;
}

const QUESTIONS: QA[] = [
  { question: "Un escargot peut dormir jusqu'à ___ d'affilée.", answer: "3 ans" },
  { question: "Le cœur d'une crevette se situe dans ___.", answer: "sa tête" },
  { question: "Les flamants roses naissent de couleur ___.", answer: "grise" },
  { question: "La Tour Eiffel peut grandir d'environ ___ en été.", answer: "15 cm" },
  { question: "Le miel ne ___ jamais.", answer: "périme" },
  { question: "Les koalas dorment environ ___ par jour.", answer: "22 heures" },
  { question: "Le sang des pieuvres est de couleur ___.", answer: "bleue" },
  { question: "Une pieuvre possède ___ cœurs.", answer: "3" },
  { question: "Les loutres dorment en ___ pour ne pas se perdre.", answer: "se tenant la main" },
  { question: "Il est quasi impossible d'___ les yeux ouverts.", answer: "éternuer" },
  { question: "Les requins existaient déjà avant ___.", answer: "les arbres" },
  { question: "Le ketchup était vendu au 19e siècle comme ___.", answer: "médicament" },
  { question: "Le Nutella consomme environ ___ % des noisettes produites dans le monde.", answer: "25" },
  { question: "Le premier objet scanné avec un code-barres était ___.", answer: "un paquet de chewing-gum" },
  { question: "Un nuage moyen pèse environ ___.", answer: "500 tonnes" },
  { question: "Un humain partage environ ___ % de son ADN avec une banane.", answer: "50" },
  { question: "Le record du plus long hoquet a duré ___.", answer: "68 ans" },
  { question: "Un groupe de flamants roses s'appelle ___.", answer: "une flamboyance" },
  { question: "Sur Vénus, une journée dure plus longtemps qu'___.", answer: "une année" },
  { question: "La langouste et le homard ont le sang ___.", answer: "transparent" },
  { question: "Le record du monde du plus long baiser est d'environ ___.", answer: "58 heures" },
  { question: "Un être humain produit assez de salive dans sa vie pour remplir ___.", answer: "deux piscines" },
  { question: "Les fourmis ne dorment pas mais font de courtes ___.", answer: "siestes" },
  { question: "Le mot « ___ » est l'un des plus longs de la langue française.", answer: "anticonstitutionnellement" },
  { question: "En moyenne, une personne passe ___ de sa vie à attendre aux feux rouges.", answer: "6 mois" },
  { question: "Le venin d'un seul ___ peut tuer plusieurs adultes.", answer: "poisson-pierre" },
];

// -- Types ------------------------------------------------
interface BluffPlayer {
  id: string;
  name: string;
  score: number;
  fake: string | null;
  vote: string | null; // optionId
  foundTruth: boolean; // a ecrit pile la verite
}

interface AnswerOption {
  id: string;
  text: string;
  authorIds: string[];
  isTruth: boolean;
}

type GamePhase = "waiting" | "writing" | "voting" | "reveal" | "game-over";

const normalize = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ");

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

  startRound() {
    this.round++;
    this.phase = "writing";
    this.options = [];
    this.roundPoints = {};
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
  }

  buildVoting() {
    this.stopTimer();
    if (!this.currentQ) return;
    const truthNorm = normalize(this.currentQ.answer);

    // Regroupe les fausses reponses (dedupe), detecte celles qui valent la verite
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
    let i = 0;
    for (const { text, authorIds } of fakeMap.values()) {
      opts.push({ id: `opt-${i++}`, text, authorIds, isTruth: false });
    }
    opts.push({ id: "truth", text: this.currentQ.answer, authorIds: [], isTruth: true });

    // Shuffle
    this.options = opts.sort(() => Math.random() - 0.5);

    this.phase = "voting";
    this.timeLeft = VOTE_TIME;
    this.broadcastPersonalizedState();
    this.startTimer();
  }

  resolveVotes() {
    this.stopTimer();

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

    if (action === "submit-fake" && this.phase === "writing") {
      const fake = ((payload.fake as string) ?? "").trim();
      if (!fake || gp.fake) return;
      gp.fake = fake.slice(0, 80);
      this.broadcastPersonalizedState();
      if (Array.from(this.gamePlayers.values()).every((p) => p.fake !== null)) {
        this.buildVoting();
      }
      return;
    }

    if (action === "vote" && this.phase === "voting") {
      if (gp.vote) return;
      const optId = payload.optionId as string;
      const opt = this.options.find((o) => o.id === optId);
      if (!opt) return;
      if (opt.authorIds.includes(gp.id)) return; // pas voter pour son propre piege
      gp.vote = optId;
      this.broadcastPersonalizedState();
      if (Array.from(this.gamePlayers.values()).every((p) => p.vote !== null || p.foundTruth)) {
        this.resolveVotes();
      }
      return;
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({ type: "game-update", payload: { timeLeft: this.timeLeft } });
      if (this.timeLeft <= 0) {
        if (this.phase === "writing") this.buildVoting();
        else if (this.phase === "voting") this.resolveVotes();
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
    state.myFake = me?.fake ?? null;
    state.myVote = me?.vote ?? null;
    state.iFoundTruth = me?.foundTruth ?? false;
    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const isReveal = this.phase === "reveal" || this.phase === "game-over";

    // Options visibles : pendant le vote on cache auteurs/verite ; au reveal on montre tout
    const optionsOut = this.options.map((o) => {
      const voters = Array.from(this.gamePlayers.values()).filter((p) => p.vote === o.id);
      return {
        id: o.id,
        text: o.text,
        isTruth: isReveal ? o.isTruth : null,
        authors: isReveal ? o.authorIds.map((id) => this.gamePlayers.get(id)?.name ?? "?") : null,
        voterNames: isReveal ? voters.map((v) => v.name) : null,
        voteCount: isReveal ? voters.length : null,
      };
    });

    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.totalRounds,
      timeLeft: this.timeLeft,
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
      })),
    };
  }

  getState(): Record<string, unknown> {
    return this.buildPublicState();
  }

  cleanup() {
    this.stopTimer();
    if (this.startTimeout) clearTimeout(this.startTimeout);
  }
}
