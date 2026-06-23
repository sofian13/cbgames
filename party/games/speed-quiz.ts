import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";
import { ALL_QUESTIONS, type QuizQuestion } from "./quiz-questions";

// ── Config ───────────────────────────────────────────────
const TOTAL_ROUNDS = 10;
const QUESTION_TIME = 15; // secondes pour repondre (petit timer facon "12 coups de midi")
const REVEAL_TIME = 4500; // ms d'affichage de la bonne reponse avant la question suivante

// ── Normalisation / auto-validation ──────────────────────
// On compare la reponse tapee aux reponses de reference apres nettoyage
// (minuscules, accents, ponctuation, articles). Plus besoin d'un "host".
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/[^a-z0-9\s]/g, " ") // ponctuation -> espace
    .replace(/\b(le|la|les|l|un|une|des|du|de|d|au|aux)\b/g, " ") // articles
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrect(answer: string, refs: string[]): boolean {
  const a = normalize(answer);
  if (!a) return false;
  return refs.some((r) => {
    const n = normalize(r);
    return n.length > 0 && n === a;
  });
}

// ── Player state ─────────────────────────────────────────
interface QuizPlayer {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  submittedAnswer: string | null;
  answerTime: number | null;
  lastCorrect: boolean;
  lastGained: number;
}

// ══════════════════════════════════════════════════════════
export class SpeedQuizGame extends BaseGame {
  quizPlayers: Map<string, QuizPlayer> = new Map();
  questions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  timeLeft = QUESTION_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  revealTimer: ReturnType<typeof setTimeout> | null = null;
  status: "waiting" | "question" | "reveal" | "game-over" = "waiting";
  questionStartTime = 0;

  pickQuestions() {
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const easy = shuffle(ALL_QUESTIONS.filter((q) => q.difficulty === "easy"));
    const medium = shuffle(ALL_QUESTIONS.filter((q) => q.difficulty === "medium"));
    // Majorite de questions faciles ("pas trop dures") : 6 faciles + 4 moyennes
    const picked: QuizQuestion[] = [...easy.slice(0, 6), ...medium.slice(0, 4)];
    // Complete si un pool etait trop court
    if (picked.length < TOTAL_ROUNDS) {
      const rest = shuffle(ALL_QUESTIONS.filter((q) => !picked.includes(q)));
      picked.push(...rest.slice(0, TOTAL_ROUNDS - picked.length));
    }
    this.questions = shuffle(picked).slice(0, TOTAL_ROUNDS);
  }

  start() {
    this.started = true;
    this.pickQuestions();

    for (const [id, player] of this.players) {
      this.quizPlayers.set(id, {
        id,
        name: player.name,
        score: 0,
        hasAnswered: false,
        submittedAnswer: null,
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
    this.timeLeft = QUESTION_TIME;
    this.questionStartTime = Date.now();

    for (const p of this.quizPlayers.values()) {
      p.hasAnswered = false;
      p.submittedAnswer = null;
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

  // ── Reveal : on montre la bonne reponse, puis on enchaine ──
  reveal() {
    this.stopTimer();
    this.status = "reveal";
    this.broadcastState();

    if (this.revealTimer) clearTimeout(this.revealTimer);
    this.revealTimer = setTimeout(() => {
      this.currentQuestionIndex++;
      this.startQuestion();
    }, REVEAL_TIME);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;

    // ── Le joueur tape sa reponse pendant la phase question ──
    if (action === "answer" && this.status === "question") {
      const answer = ((payload.answer as string) ?? "").trim();
      if (!answer) return;

      const senderPlayer = this.findGamePlayerByConnection(sender.id);
      if (!senderPlayer) return;

      const qp = this.quizPlayers.get(senderPlayer.id);
      if (!qp || qp.hasAnswered) return;

      const q = this.questions[this.currentQuestionIndex];
      qp.hasAnswered = true;
      qp.submittedAnswer = answer;
      qp.answerTime = Date.now() - this.questionStartTime;

      const correct = q ? isCorrect(answer, q.answers) : false;
      qp.lastCorrect = correct;
      if (correct) {
        // 100 pts + bonus de vitesse (plus tu reponds tot, plus le bonus est gros)
        const frac = Math.max(0, 1 - qp.answerTime / (QUESTION_TIME * 1000));
        qp.lastGained = 100 + Math.round(frac * 100);
        qp.score += qp.lastGained;
      } else {
        qp.lastGained = 0;
      }

      // On diffuse juste l'etat "a repondu" (pas la reponse) aux autres
      this.broadcast({
        type: "game-update",
        payload: { players: this.publicPlayers() },
      });

      // Tout le monde a repondu -> reveal immediat
      if (Array.from(this.quizPlayers.values()).every((p) => p.hasAnswered)) {
        this.reveal();
      }
      return;
    }
  }

  endQuiz() {
    this.stopTimer();
    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }
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

  getState(): Record<string, unknown> {
    const q = this.questions[this.currentQuestionIndex];
    const revealing = this.status === "reveal";
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
      players: this.publicPlayers(),
      timeLeft: this.timeLeft,
      questionTime: QUESTION_TIME,
      status: this.status,
      round: this.currentQuestionIndex + 1,
      // Phase reveal : la bonne reponse + le detail de chacun
      correctAnswer: revealing && q ? q.answers[0] : null,
      acceptedAnswers: revealing && q ? q.answers : null,
      results: revealing
        ? Array.from(this.quizPlayers.values()).map((p) => ({
            playerId: p.id,
            playerName: p.name,
            answer: p.submittedAnswer ?? "",
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
    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }
  }
}
