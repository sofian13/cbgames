import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

interface EstimationQ { question: string; answer: number; tolerance: number; }
const ESTIMATIONS: EstimationQ[] = [
  { question: "Combien de pays y a-t-il en Afrique ?", answer: 54, tolerance: 5 },
  { question: "Combien de km separe Paris de New York (vol d'oiseau) ?", answer: 5836, tolerance: 500 },
  { question: "En quelle annee la Tour Eiffel a-t-elle ete construite ?", answer: 1889, tolerance: 10 },
  { question: "Combien de langues sont parlees dans le monde ?", answer: 7000, tolerance: 700 },
  { question: "Combien pese un elephant d'Afrique en kg ?", answer: 6000, tolerance: 1000 },
  { question: "Combien d'etoiles peut-on voir a l'oeil nu ?", answer: 5000, tolerance: 1000 },
  { question: "Quelle est la profondeur de la fosse des Mariannes en metres ?", answer: 10994, tolerance: 1000 },
  { question: "Combien de muscles dans le corps humain ?", answer: 639, tolerance: 100 },
  { question: "Combien de films Marvel au total (MCU) ?", answer: 33, tolerance: 5 },
  { question: "Quelle est la temperature du soleil en degres Celsius ?", answer: 5500, tolerance: 1000 },
  { question: "Combien de stations de metro a Paris ?", answer: 308, tolerance: 30 },
  { question: "Combien de pays dans l'Union Europeenne ?", answer: 27, tolerance: 3 },
];

const VOTE_TOPICS = [
  "Nommez une couleur", "Nommez un fruit", "Nommez un animal de compagnie",
  "Nommez un pays d'Europe", "Nommez un sport", "Nommez une marque de voiture",
  "Nommez un super-heros", "Nommez un instrument de musique", "Nommez une saison",
  "Nommez une planete",
];

type MissionType = "estimation" | "vote-unanime" | "confiance";
const MISSION_ORDER: MissionType[] = ["estimation", "vote-unanime", "confiance", "estimation", "vote-unanime"];
const TOTAL_ROUNDS = 5;
const MISSION_TIME = 20000;
const VOTE_TIME = 15000;
const RESULT_TIME = 5000;

interface TaupePlayer {
  id: string; name: string; score: number; role: "taupe" | "loyal";
  isEliminated: boolean; hasSubmitted: boolean; hasVoted: boolean;
  submission: unknown; voteTarget: string | null;
}

export class LaTaupeGame extends BaseGame {
  tPlayers: Map<string, TaupePlayer> = new Map();
  round = 0;
  status: "waiting" | "role-reveal" | "mission" | "mission-result" | "vote" | "vote-result" | "game-over" = "waiting";
  currentMission: { type: MissionType; question: string; answer?: number; tolerance?: number } | null = null;
  missionResult: { success: boolean; detail: string; teamScore: number } | null = null;
  voteResults: { playerId: string; playerName: string; votesReceived: number }[] | null = null;
  teamScore = 0;
  timer: ReturnType<typeof setTimeout> | null = null;
  tickTimer: ReturnType<typeof setInterval> | null = null;
  timeLeft = 0;
  usedEstimations: Set<number> = new Set();
  usedTopics: Set<number> = new Set();
  winner: "loyaux" | "taupe" | null = null;
  eliminatedMoleId: string | null = null;

  start() {
    this.started = true;
    const ids = Array.from(this.players.keys());
    const taupeIdx = Math.floor(Math.random() * ids.length);
    ids.forEach((id, i) => {
      const p = this.players.get(id)!;
      this.tPlayers.set(id, {
        id, name: p.name, score: 0, role: i === taupeIdx ? "taupe" : "loyal",
        isEliminated: false, hasSubmitted: false, hasVoted: false, submission: null, voteTarget: null,
      });
    });
    this.status = "role-reveal";
    this.broadcastPersonalized();
    this.timer = setTimeout(() => this.nextRound(), 4000);
  }

  nextRound() {
    this.round++;
    if (this.round > TOTAL_ROUNDS) { this.taupeWins(); return; }
    for (const p of this.tPlayers.values()) {
      p.hasSubmitted = false; p.hasVoted = false; p.submission = null; p.voteTarget = null;
    }
    this.missionResult = null; this.voteResults = null;
    const mType = MISSION_ORDER[(this.round - 1) % MISSION_ORDER.length];
    this.currentMission = this.genMission(mType);
    this.status = "mission";
    this.timeLeft = Math.ceil(MISSION_TIME / 1000);
    this.broadcastPersonalized();
    this.startTick(MISSION_TIME, () => this.resolveMission());
  }

  genMission(type: MissionType) {
    if (type === "estimation") {
      const avail = ESTIMATIONS.map((e, i) => ({ e, i })).filter(x => !this.usedEstimations.has(x.i));
      if (avail.length === 0) this.usedEstimations.clear();
      const pool = avail.length > 0 ? avail : ESTIMATIONS.map((e, i) => ({ e, i }));
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.usedEstimations.add(pick.i);
      return { type, question: pick.e.question, answer: pick.e.answer, tolerance: pick.e.tolerance };
    }
    if (type === "vote-unanime") {
      const avail = VOTE_TOPICS.map((t, i) => ({ t, i })).filter(x => !this.usedTopics.has(x.i));
      if (avail.length === 0) this.usedTopics.clear();
      const pool = avail.length > 0 ? avail : VOTE_TOPICS.map((t, i) => ({ t, i }));
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.usedTopics.add(pick.i);
      return { type, question: pick.t };
    }
    return { type, question: "Contribuer au pot commun ou saboter ?" };
  }

  resolveMission() {
    this.clearTimers();
    const active = Array.from(this.tPlayers.values()).filter(p => !p.isEliminated);
    const type = this.currentMission?.type;
    let success = false; let detail = "";

    if (type === "estimation") {
      const subs = active.filter(p => p.hasSubmitted).map(p => p.submission as number);
      if (subs.length === 0) { detail = "Personne n'a repondu !"; }
      else {
        const avg = subs.reduce((a, b) => a + b, 0) / subs.length;
        const diff = Math.abs(avg - (this.currentMission!.answer ?? 0));
        success = diff <= (this.currentMission!.tolerance ?? 0);
        detail = `Moyenne: ${Math.round(avg)} (reponse: ${this.currentMission!.answer}). ${success ? "Assez proche !" : "Trop loin..."}`;
      }
    } else if (type === "vote-unanime") {
      const words = active.filter(p => p.hasSubmitted).map(p => (p.submission as string).toLowerCase().trim());
      const freq: Record<string, number> = {};
      words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      if (sorted[0] && sorted[0][1] > active.length / 2) {
        success = true; detail = `Majorite sur "${sorted[0][0]}" (${sorted[0][1]}/${active.length})`;
      } else { detail = "Pas de majorite ! Reponses trop variees."; }
    } else {
      let pot = 0;
      active.forEach(p => { pot += p.submission === "contribuer" ? 100 : -100; });
      success = pot > 0;
      detail = `Pot: ${pot > 0 ? "+" : ""}${pot}. ${success ? "Le groupe a coopere !" : "Trop de sabotage..."}`;
    }

    if (success) { this.teamScore += 100; active.filter(p => p.role === "loyal").forEach(p => { p.score += 20; }); }
    this.missionResult = { success, detail, teamScore: this.teamScore };
    this.status = "mission-result";
    this.broadcastPersonalized();
    this.timer = setTimeout(() => this.startVote(), RESULT_TIME);
  }

  startVote() {
    this.clearTimers();
    for (const p of this.tPlayers.values()) { p.hasVoted = false; p.voteTarget = null; }
    this.status = "vote";
    this.timeLeft = Math.ceil(VOTE_TIME / 1000);
    this.broadcastPersonalized();
    this.startTick(VOTE_TIME, () => this.resolveVote());
  }

  resolveVote() {
    this.clearTimers();
    const active = Array.from(this.tPlayers.values()).filter(p => !p.isEliminated);
    const votes: Record<string, number> = {};
    active.forEach(p => { if (p.voteTarget) votes[p.voteTarget] = (votes[p.voteTarget] || 0) + 1; });
    this.voteResults = active.map(p => ({ playerId: p.id, playerName: p.name, votesReceived: votes[p.id] || 0 }))
      .sort((a, b) => b.votesReceived - a.votesReceived);

    const top = this.voteResults[0];
    if (top && top.votesReceived >= Math.ceil(active.length / 2)) {
      const accused = this.tPlayers.get(top.playerId);
      if (accused?.role === "taupe") { accused.isEliminated = true; this.eliminatedMoleId = accused.id; this.loyauxWin(); return; }
    }
    this.status = "vote-result";
    this.broadcastPersonalized();
    this.timer = setTimeout(() => this.nextRound(), RESULT_TIME);
  }

  loyauxWin() {
    this.winner = "loyaux"; this.status = "game-over";
    const sorted = Array.from(this.tPlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = sorted.map((p, i) => ({
      playerId: p.id, playerName: p.name, rank: i + 1, score: p.role === "loyal" ? p.score + 50 : p.score,
    }));
    this.broadcastPersonalized();
    this.endGame(rankings);
  }

  taupeWins() {
    this.winner = "taupe"; this.status = "game-over";
    const taupe = Array.from(this.tPlayers.values()).find(p => p.role === "taupe");
    if (taupe) taupe.score += 200;
    const sorted = Array.from(this.tPlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = sorted.map((p, i) => ({ playerId: p.id, playerName: p.name, rank: i + 1, score: p.score }));
    this.broadcastPersonalized();
    this.endGame(rankings);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const gp = this.findByConn(sender.id); if (!gp) return;
    const tp = this.tPlayers.get(gp.id); if (!tp || tp.isEliminated) return;

    if (this.status === "mission" && !tp.hasSubmitted) {
      if (action === "submit-estimation") { tp.hasSubmitted = true; tp.submission = Number(payload.value) || 0; }
      if (action === "submit-vote-unanime") { tp.hasSubmitted = true; tp.submission = String(payload.word || ""); }
      if (action === "submit-confiance") { tp.hasSubmitted = true; tp.submission = payload.choice as string; }
      this.broadcastPersonalized();
      if (this.allSubmitted()) this.resolveMission();
    }
    if (action === "vote-suspect" && this.status === "vote" && !tp.hasVoted) {
      tp.hasVoted = true; tp.voteTarget = payload.targetId as string;
      this.broadcastPersonalized();
      if (this.allVoted()) this.resolveVote();
    }
  }

  allSubmitted() { return Array.from(this.tPlayers.values()).filter(p => !p.isEliminated).every(p => p.hasSubmitted); }
  allVoted() { return Array.from(this.tPlayers.values()).filter(p => !p.isEliminated).every(p => p.hasVoted); }
  findByConn(c: string) { for (const [, p] of this.players) { if (p.connectionId === c) return p; } return null; }

  broadcastPersonalized() {
    for (const [id] of this.tPlayers) {
      this.sendToPlayer(id, { type: "game-state", payload: this.getStateFor(id) });
    }
  }

  getStateFor(forId: string): Record<string, unknown> {
    const tp = this.tPlayers.get(forId);
    return {
      status: this.status, round: this.round, totalRounds: TOTAL_ROUNDS,
      mission: this.currentMission ? { type: this.currentMission.type, question: this.currentMission.question } : null,
      missionResult: this.missionResult, voteResults: this.voteResults, teamScore: this.teamScore,
      players: Array.from(this.tPlayers.values()).map(p => ({
        id: p.id, name: p.name, score: p.score, isEliminated: p.isEliminated,
        hasSubmitted: p.hasSubmitted, hasVoted: p.hasVoted,
      })),
      timeLeft: this.timeLeft, myRole: tp?.role, eliminatedMoleId: this.eliminatedMoleId, winner: this.winner,
    };
  }

  getState() { return this.getStateFor(""); }

  startTick(ms: number, onDone: () => void) {
    this.clearTimers();
    this.timeLeft = Math.ceil(ms / 1000);
    this.tickTimer = setInterval(() => {
      this.timeLeft--;
      this.broadcastPersonalized();
      if (this.timeLeft <= 0) { this.clearTimers(); onDone(); }
    }, 1000);
  }

  clearTimers() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
  }

  cleanup() { this.clearTimers(); }
}
