import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";
import { QCM_QUESTIONS, type QcmQuestion } from "./quiz-qcm";

// ── Config ───────────────────────────────────────────────
const TIME_OPTIONS = [10, 15, 20, 30]; // secondes par question (choisi avant de lancer)
const ROUND_OPTIONS = [10, 15, 20]; // nombre de questions
const START_DELAY = 1200; // laisse tout le monde se connecter avant d'afficher le setup

// ── Player state ─────────────────────────────────────────
interface QuizPlayer {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  choiceIndex: number | null;
  answerTime: number | null;
  lastCorrect: boolean;
  lastGained: number;
}

// ══════════════════════════════════════════════════════════
export class SpeedQuizGame extends BaseGame {
  quizPlayers: Map<string, QuizPlayer> = new Map();
  questions: QcmQuestion[] = [];
  currentQuestionIndex = 0;
  timeLeft = 15;
  questionTime = 15;
  totalRounds = 10;
  timer: ReturnType<typeof setInterval> | null = null;
  setupTimer: ReturnType<typeof setTimeout> | null = null;
  status: "config" | "question" | "reveal" | "game-over" = "config";
  questionStartTime = 0;

  start() {
    // On passe d'abord par un écran de config (timer + nombre de questions).
    this.started = true;
    this.status = "config";
    if (this.setupTimer) clearTimeout(this.setupTimer);
    this.setupTimer = setTimeout(() => this.broadcastState(), START_DELAY);
  }

  pickQuestions() {
    const shuffled = [...QCM_QUESTIONS].sort(() => Math.random() - 0.5);
    this.questions = shuffled.slice(0, Math.min(this.totalRounds, shuffled.length));
  }

  beginGame() {
    this.pickQuestions();
    this.quizPlayers.clear();
    for (const [id, player] of this.players) {
      this.quizPlayers.set(id, {
        id,
        name: player.name,
        score: 0,
        hasAnswered: false,
        choiceIndex: null,
        answerTime: null,
        lastCorrect: false,
        lastGained: 0,
      });
    }
    this.currentQuestionIndex = 0;
    this.startQuestion();
  }

  startQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endQuiz();
      return;
    }

    this.status = "question";
    this.timeLeft = this.questionTime;
    this.questionStartTime = Date.now();

    for (const p of this.quizPlayers.values()) {
      p.hasAnswered = false;
      p.choiceIndex = null;
      p.answerTime = null;
      p.lastCorrect = false;
      p.lastGained = 0;
    }

    this.broadcastState();
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({ type: "game-update", payload: { timeLeft: this.timeLeft } });
      if (this.timeLeft <= 0) this.reveal();
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ── Reveal : montre la bonne réponse + l'explication.
  // PAS d'auto-avance : on attend un clic « Suivant » (action "next").
  reveal() {
    this.stopTimer();
    this.status = "reveal";
    this.broadcastState();
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const senderPlayer = this.findGamePlayerByConnection(sender.id);
    if (!senderPlayer) return;

    // ── Config : n'importe qui règle le timer / le nombre de questions et lance ──
    if (action === "set-time" && this.status === "config") {
      const t = Number(payload.time);
      if (TIME_OPTIONS.includes(t)) {
        this.questionTime = t;
        this.broadcastState();
      }
      return;
    }
    if (action === "set-rounds" && this.status === "config") {
      const r = Number(payload.rounds);
      if (ROUND_OPTIONS.includes(r)) {
        this.totalRounds = r;
        this.broadcastState();
      }
      return;
    }
    if (action === "begin" && this.status === "config") {
      if (this.setupTimer) { clearTimeout(this.setupTimer); this.setupTimer = null; }
      this.beginGame();
      return;
    }

    // ── Le joueur choisit une proposition pendant la phase question ──
    if (action === "answer" && this.status === "question") {
      const qp = this.quizPlayers.get(senderPlayer.id);
      if (!qp || qp.hasAnswered) return;
      const idx = Number(payload.choiceIndex);
      const q = this.questions[this.currentQuestionIndex];
      if (!q || !Number.isInteger(idx) || idx < 0 || idx >= q.choices.length) return;

      qp.hasAnswered = true;
      qp.choiceIndex = idx;
      qp.answerTime = Date.now() - this.questionStartTime;

      const correct = idx === q.correct;
      qp.lastCorrect = correct;
      if (correct) {
        // 100 pts + bonus de vitesse (plus tu réponds tôt, plus c'est gros)
        const frac = Math.max(0, 1 - qp.answerTime / (this.questionTime * 1000));
        qp.lastGained = 100 + Math.round(frac * 100);
        qp.score += qp.lastGained;
      } else {
        qp.lastGained = 0;
      }

      this.broadcast({
        type: "game-update",
        payload: { players: this.publicPlayers() },
      });

      // Tout le monde a répondu -> reveal immédiat
      if (Array.from(this.quizPlayers.values()).every((p) => p.hasAnswered)) {
        this.reveal();
      }
      return;
    }

    // ── « Suivant » : n'importe qui enchaîne après le reveal ──
    if (action === "next" && this.status === "reveal") {
      this.currentQuestionIndex++;
      this.startQuestion();
      return;
    }
  }

  endQuiz() {
    this.stopTimer();
    this.status = "game-over";

    const players = Array.from(this.quizPlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));

    this.broadcastState();
    this.endGame(rankings);
  }

  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  publicPlayers() {
    return Array.from(this.quizPlayers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      hasAnswered: p.hasAnswered,
    }));
  }

  // Pendant la config, quizPlayers n'est pas encore peuplé : on liste les joueurs bruts.
  lobbyPlayers() {
    return Array.from(this.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      score: 0,
      hasAnswered: false,
    }));
  }

  getState(): Record<string, unknown> {
    const q = this.questions[this.currentQuestionIndex];
    const revealing = this.status === "reveal";
    return {
      status: this.status,
      timeOptions: TIME_OPTIONS,
      roundOptions: ROUND_OPTIONS,
      questionTime: this.questionTime,
      totalRounds: this.totalRounds,
      round: this.currentQuestionIndex + 1,
      timeLeft: this.timeLeft,
      currentQuestion: q
        ? {
            text: q.text,
            choices: q.choices,
            category: q.category,
            index: this.currentQuestionIndex,
            total: this.questions.length,
          }
        : null,
      players: this.status === "config" ? this.lobbyPlayers() : this.publicPlayers(),
      // Phase reveal
      correctIndex: revealing && q ? q.correct : null,
      explanation: revealing && q ? q.explanation : null,
      results: revealing
        ? Array.from(this.quizPlayers.values()).map((p) => ({
            playerId: p.id,
            playerName: p.name,
            choiceIndex: p.choiceIndex,
            correct: p.lastCorrect,
            gained: p.lastGained,
          }))
        : null,
    };
  }

  broadcastState() {
    this.broadcast({ type: "game-state", payload: this.getState() });
  }

  cleanup() {
    this.stopTimer();
    if (this.setupTimer) {
      clearTimeout(this.setupTimer);
      this.setupTimer = null;
    }
  }
}
