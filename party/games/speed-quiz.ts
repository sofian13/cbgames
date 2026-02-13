import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";
import { ALL_QUESTIONS, type QuizQuestion } from "./quiz-questions";

// ── Config ───────────────────────────────────────────────
const TOTAL_ROUNDS = 10;
const QUESTION_TIME = 20; // seconds to answer
const SCORES_TIME = 4000; // ms to show round scores before next question

// ── Player state ─────────────────────────────────────────
interface QuizPlayer {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  submittedAnswer: string | null;
  answerTime: number | null;
}

// ── Answer to validate ───────────────────────────────────
interface AnswerEntry {
  playerId: string;
  playerName: string;
  answer: string;
  validated: boolean;
  correct: boolean | null; // null = not yet validated
}

// ══════════════════════════════════════════════════════════
export class SpeedQuizGame extends BaseGame {
  quizPlayers: Map<string, QuizPlayer> = new Map();
  questions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  timeLeft = QUESTION_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  status: "waiting" | "question" | "validating" | "scores" | "game-over" = "waiting";
  questionStartTime = 0;
  hostId: string | null = null;

  // Validation phase
  answersToValidate: AnswerEntry[] = [];
  currentValidationIndex = 0;

  pickQuestions() {
    // Pick 10 questions sorted by difficulty: easy → medium → hard
    const easy = ALL_QUESTIONS.filter((q) => q.difficulty === "easy");
    const medium = ALL_QUESTIONS.filter((q) => q.difficulty === "medium");
    const hard = ALL_QUESTIONS.filter((q) => q.difficulty === "hard");

    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const picked: QuizQuestion[] = [];
    // 3 easy, 4 medium, 3 hard
    picked.push(...shuffle(easy).slice(0, 3));
    picked.push(...shuffle(medium).slice(0, 4));
    picked.push(...shuffle(hard).slice(0, 3));

    this.questions = picked;
  }

  start() {
    this.started = true;
    this.pickQuestions();

    // First player in the map = host
    const firstPlayer = this.players.entries().next().value;
    if (firstPlayer) {
      this.hostId = firstPlayer[0];
    }

    for (const [id, player] of this.players) {
      this.quizPlayers.set(id, {
        id,
        name: player.name,
        score: 0,
        hasAnswered: false,
        submittedAnswer: null,
        answerTime: null,
      });
    }

    this.startQuestion();
  }

  startQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endQuiz();
      return;
    }

    this.status = "question";
    this.timeLeft = QUESTION_TIME;
    this.questionStartTime = Date.now();
    this.answersToValidate = [];
    this.currentValidationIndex = 0;

    for (const p of this.quizPlayers.values()) {
      p.hasAnswered = false;
      p.submittedAnswer = null;
      p.answerTime = null;
    }

    this.broadcastState();
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({
        type: "game-update",
        payload: { timeLeft: this.timeLeft },
      });

      if (this.timeLeft <= 0) {
        this.startValidation();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  startValidation() {
    this.stopTimer();
    this.status = "validating";
    this.currentValidationIndex = 0;

    // Build answers list — ordered by submission time (fastest first)
    // Players who didn't answer go at the end
    const answered: AnswerEntry[] = [];
    const notAnswered: AnswerEntry[] = [];

    for (const p of this.quizPlayers.values()) {
      const entry: AnswerEntry = {
        playerId: p.id,
        playerName: p.name,
        answer: p.submittedAnswer ?? "",
        validated: false,
        correct: null,
      };

      if (p.hasAnswered && p.submittedAnswer) {
        answered.push(entry);
      } else {
        entry.answer = "";
        notAnswered.push(entry);
      }
    }

    // Sort answered by answer time
    const sortedAnswered = answered.sort((a, b) => {
      const pa = this.quizPlayers.get(a.playerId);
      const pb = this.quizPlayers.get(b.playerId);
      return (pa?.answerTime ?? 0) - (pb?.answerTime ?? 0);
    });

    this.answersToValidate = [...sortedAnswered, ...notAnswered];

    // Skip players who didn't answer (auto-mark as wrong)
    for (const entry of this.answersToValidate) {
      if (!entry.answer) {
        entry.validated = true;
        entry.correct = false;
      }
    }

    // If all are auto-validated (nobody answered), go to scores
    if (this.answersToValidate.every((a) => a.validated)) {
      this.showScores();
      return;
    }

    // Find first non-validated answer
    this.currentValidationIndex = this.answersToValidate.findIndex((a) => !a.validated);

    this.broadcastValidationState();
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;

    // ── Player submits answer during question phase ──
    if (action === "answer" && this.status === "question") {
      const answer = ((payload.answer as string) ?? "").trim();
      if (!answer) return;

      const senderPlayer = this.findGamePlayerByConnection(sender.id);
      if (!senderPlayer) return;

      const qp = this.quizPlayers.get(senderPlayer.id);
      if (!qp || qp.hasAnswered) return;

      qp.hasAnswered = true;
      qp.submittedAnswer = answer;
      qp.answerTime = Date.now() - this.questionStartTime;

      // Broadcast updated player states (only hasAnswered visible)
      this.broadcast({
        type: "game-update",
        payload: {
          players: Array.from(this.quizPlayers.values()).map((p) => ({
            id: p.id,
            name: p.name,
            score: p.score,
            hasAnswered: p.hasAnswered,
          })),
        },
      });

      // If all answered, start validation immediately
      if (Array.from(this.quizPlayers.values()).every((p) => p.hasAnswered)) {
        this.startValidation();
      }
      return;
    }

    // ── Host validates an answer ──
    if (action === "validate" && this.status === "validating") {
      const senderPlayer = this.findGamePlayerByConnection(sender.id);
      if (!senderPlayer || senderPlayer.id !== this.hostId) return;

      const correct = payload.correct === true;
      const entry = this.answersToValidate[this.currentValidationIndex];
      if (!entry || entry.validated) return;

      entry.validated = true;
      entry.correct = correct;

      // Award point if correct
      if (correct) {
        const qp = this.quizPlayers.get(entry.playerId);
        if (qp) {
          qp.score += 1;
        }
      }

      // Move to next non-validated answer
      const nextIndex = this.answersToValidate.findIndex((a, i) => i > this.currentValidationIndex && !a.validated);

      if (nextIndex === -1) {
        // All validated → show scores
        this.showScores();
      } else {
        this.currentValidationIndex = nextIndex;
        this.broadcastValidationState();
      }
      return;
    }
  }

  showScores() {
    this.status = "scores";
    this.broadcastScoresState();

    setTimeout(() => {
      this.currentQuestionIndex++;
      this.startQuestion();
    }, SCORES_TIME);
  }

  endQuiz() {
    this.stopTimer();
    this.status = "game-over";

    const players = Array.from(this.quizPlayers.values());
    players.sort((a, b) => b.score - a.score);

    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));

    this.endGame(rankings);
  }

  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  // ── State: question phase ──────────────────────────────
  getState(): Record<string, unknown> {
    const q = this.questions[this.currentQuestionIndex];
    return {
      currentQuestion: q
        ? {
            text: q.text,
            category: q.category,
            difficulty: q.difficulty,
            image: q.image ?? null,
            index: this.currentQuestionIndex,
            total: this.questions.length,
          }
        : null,
      players: Array.from(this.quizPlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        hasAnswered: p.hasAnswered,
      })),
      timeLeft: this.timeLeft,
      status: this.status,
      round: this.currentQuestionIndex + 1,
      hostId: this.hostId,
    };
  }

  // ── State: validation phase ────────────────────────────
  broadcastValidationState() {
    const q = this.questions[this.currentQuestionIndex];
    this.broadcast({
      type: "game-state",
      payload: {
        currentQuestion: {
          text: q.text,
          category: q.category,
          difficulty: q.difficulty,
          image: q.image ?? null,
          index: this.currentQuestionIndex,
          total: this.questions.length,
        },
        // Hint for the host (reference answers)
        referenceAnswers: q.answers,
        players: Array.from(this.quizPlayers.values()).map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          hasAnswered: p.hasAnswered,
        })),
        answers: this.answersToValidate.map((a, i) => ({
          playerId: a.playerId,
          playerName: a.playerName,
          answer: i <= this.currentValidationIndex ? a.answer : null, // only reveal up to current
          validated: a.validated,
          correct: a.correct,
        })),
        currentValidationIndex: this.currentValidationIndex,
        timeLeft: 0,
        status: "validating",
        round: this.currentQuestionIndex + 1,
        hostId: this.hostId,
      },
    });
  }

  // ── State: scores phase ────────────────────────────────
  broadcastScoresState() {
    const q = this.questions[this.currentQuestionIndex];
    this.broadcast({
      type: "game-state",
      payload: {
        currentQuestion: {
          text: q.text,
          category: q.category,
          difficulty: q.difficulty,
          image: q.image ?? null,
          index: this.currentQuestionIndex,
          total: this.questions.length,
        },
        players: Array.from(this.quizPlayers.values())
          .map((p) => ({
            id: p.id,
            name: p.name,
            score: p.score,
            hasAnswered: p.hasAnswered,
          }))
          .sort((a, b) => b.score - a.score),
        answers: this.answersToValidate.map((a) => ({
          playerId: a.playerId,
          playerName: a.playerName,
          answer: a.answer,
          validated: true,
          correct: a.correct,
        })),
        timeLeft: 0,
        status: "scores",
        round: this.currentQuestionIndex + 1,
        hostId: this.hostId,
      },
    });
  }

  broadcastState() {
    this.broadcast({
      type: "game-state",
      payload: this.getState(),
    });
  }

  cleanup() {
    this.stopTimer();
  }
}
