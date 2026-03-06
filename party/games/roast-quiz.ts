import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

interface Question {
  text: string;
  choices: string[];
  correctIndex: number;
  category: string;
}

const QUESTIONS: Question[] = [
  { text: "Quelle est la capitale de l'Australie ?", choices: ["Sydney", "Melbourne", "Canberra", "Perth"], correctIndex: 2, category: "Geographie" },
  { text: "En quelle annee l'homme a-t-il marche sur la Lune ?", choices: ["1965", "1969", "1971", "1973"], correctIndex: 1, category: "Histoire" },
  { text: "Quel est l'element chimique le plus abondant dans l'univers ?", choices: ["Oxygene", "Carbone", "Helium", "Hydrogene"], correctIndex: 3, category: "Sciences" },
  { text: "Qui a peint 'La Nuit etoilee' ?", choices: ["Monet", "Van Gogh", "Picasso", "Dali"], correctIndex: 1, category: "Culture" },
  { text: "Combien d'os possede le corps humain adulte ?", choices: ["186", "206", "226", "246"], correctIndex: 1, category: "Sciences" },
  { text: "Quel pays a remporte la Coupe du Monde 2022 ?", choices: ["France", "Bresil", "Argentine", "Croatie"], correctIndex: 2, category: "Sport" },
  { text: "Quel est le plus long fleuve du monde ?", choices: ["Amazone", "Nil", "Mississippi", "Yangtse"], correctIndex: 1, category: "Geographie" },
  { text: "Qui a ecrit 'Les Miserables' ?", choices: ["Zola", "Hugo", "Balzac", "Flaubert"], correctIndex: 1, category: "Culture" },
  { text: "Quelle planete est surnommee 'la planete rouge' ?", choices: ["Venus", "Jupiter", "Mars", "Saturne"], correctIndex: 2, category: "Sciences" },
  { text: "En quelle annee a eu lieu la Revolution francaise ?", choices: ["1776", "1789", "1799", "1815"], correctIndex: 1, category: "Histoire" },
  { text: "Quel groupe a chante 'Bohemian Rhapsody' ?", choices: ["The Beatles", "Led Zeppelin", "Queen", "Pink Floyd"], correctIndex: 2, category: "Musique" },
  { text: "Quel est le plus petit pays du monde ?", choices: ["Monaco", "Vatican", "San Marin", "Liechtenstein"], correctIndex: 1, category: "Geographie" },
  { text: "Combien de joueurs composent une equipe de rugby ?", choices: ["11", "13", "15", "18"], correctIndex: 2, category: "Sport" },
  { text: "Quel est le symbole chimique de l'or ?", choices: ["Or", "Au", "Ag", "Fe"], correctIndex: 1, category: "Sciences" },
  { text: "Qui a realise le film 'Inception' ?", choices: ["Spielberg", "Nolan", "Scorsese", "Tarantino"], correctIndex: 1, category: "Culture" },
  { text: "Quelle est la monnaie du Japon ?", choices: ["Yuan", "Won", "Yen", "Ringgit"], correctIndex: 2, category: "Geographie" },
  { text: "En quelle annee est tombe le mur de Berlin ?", choices: ["1987", "1989", "1991", "1993"], correctIndex: 1, category: "Histoire" },
  { text: "Quel rappeur francais a sorti 'Civilisation' ?", choices: ["Booba", "PNL", "Orelsan", "Jul"], correctIndex: 2, category: "Musique" },
  { text: "Combien de dents possede un adulte ?", choices: ["28", "30", "32", "34"], correctIndex: 2, category: "Sciences" },
  { text: "Quel est le plus grand ocean du monde ?", choices: ["Atlantique", "Indien", "Arctique", "Pacifique"], correctIndex: 3, category: "Geographie" },
  { text: "Qui a invente la theorie de la relativite ?", choices: ["Newton", "Einstein", "Hawking", "Bohr"], correctIndex: 1, category: "Sciences" },
  { text: "Quel joueur detient le record de Ballons d'Or ?", choices: ["Ronaldo", "Messi", "Pele", "Maradona"], correctIndex: 1, category: "Sport" },
  { text: "Quelle est la langue la plus parlee au monde ?", choices: ["Anglais", "Espagnol", "Hindi", "Mandarin"], correctIndex: 3, category: "Culture" },
  { text: "Quel animal est le plus rapide sur terre ?", choices: ["Lion", "Guepard", "Antilope", "Levrier"], correctIndex: 1, category: "Sciences" },
  { text: "Qui a compose 'Les Quatre Saisons' ?", choices: ["Bach", "Mozart", "Vivaldi", "Beethoven"], correctIndex: 2, category: "Musique" },
  { text: "Combien y a-t-il de continents ?", choices: ["5", "6", "7", "8"], correctIndex: 2, category: "Geographie" },
  { text: "Quel est le nom du createur de Facebook ?", choices: ["Elon Musk", "Jeff Bezos", "Mark Zuckerberg", "Bill Gates"], correctIndex: 2, category: "Culture" },
  { text: "En quelle annee a commence la Premiere Guerre mondiale ?", choices: ["1912", "1914", "1916", "1918"], correctIndex: 1, category: "Histoire" },
  { text: "Quelle vitamine est produite par exposition au soleil ?", choices: ["A", "B12", "C", "D"], correctIndex: 3, category: "Sciences" },
  { text: "Quel est le desert le plus grand du monde ?", choices: ["Sahara", "Gobi", "Antarctique", "Kalahari"], correctIndex: 2, category: "Geographie" },
  { text: "Combien de cordes a une guitare classique ?", choices: ["4", "5", "6", "8"], correctIndex: 2, category: "Musique" },
  { text: "Quel est le metal le plus conducteur ?", choices: ["Or", "Cuivre", "Argent", "Aluminium"], correctIndex: 2, category: "Sciences" },
];

const TOTAL_ROUNDS = 10;
const QUESTION_TIME = 12000;
const MALUS_CHOICE_TIME = 5000;
const REVEAL_TIME = 3000;

type MalusType = "shake" | "blur" | "invert" | "speed";

interface RoastPlayer {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  answerIndex: number | null;
  activeMalus: MalusType | null;
  pendingMalus: MalusType | null;
}

export class RoastQuizGame extends BaseGame {
  rPlayers: Map<string, RoastPlayer> = new Map();
  round = 0;
  status: "waiting" | "question" | "malus-choice" | "reveal" | "game-over" = "waiting";
  currentQuestion: Question | null = null;
  usedQuestions: Set<number> = new Set();
  timer: ReturnType<typeof setTimeout> | null = null;
  tickTimer: ReturnType<typeof setInterval> | null = null;
  timeLeft = 0;
  lastCorrectPlayerId: string | null = null;

  start() {
    this.started = true;
    for (const [id, p] of this.players) {
      this.rPlayers.set(id, { id, name: p.name, score: 0, hasAnswered: false, answerIndex: null, activeMalus: null, pendingMalus: null });
    }
    this.nextRound();
  }

  nextRound() {
    this.round++;
    if (this.round > TOTAL_ROUNDS) { this.endQuiz(); return; }
    for (const p of this.rPlayers.values()) {
      p.hasAnswered = false;
      p.answerIndex = null;
      if (p.pendingMalus) { p.activeMalus = p.pendingMalus; p.pendingMalus = null; }
      else { p.activeMalus = null; }
    }
    this.currentQuestion = this.pickQuestion();
    this.lastCorrectPlayerId = null;
    const timeMs = this.getQuestionTime();
    this.timeLeft = Math.ceil(timeMs / 1000);
    this.status = "question";
    this.broadcastState();
    this.startTick(timeMs, () => this.revealAnswer());
  }

  getQuestionTime(): number {
    // check if any player has speed malus -- that player gets half time but we use global timer
    return QUESTION_TIME;
  }

  pickQuestion(): Question {
    const available = QUESTIONS.map((q, i) => ({ q, i })).filter(x => !this.usedQuestions.has(x.i));
    if (available.length === 0) { this.usedQuestions.clear(); return this.pickQuestion(); }
    const pick = available[Math.floor(Math.random() * available.length)];
    this.usedQuestions.add(pick.i);
    return pick.q;
  }

  revealAnswer() {
    this.clearTimers();
    this.status = "reveal";
    this.broadcastState();
    if (this.lastCorrectPlayerId) {
      this.timer = setTimeout(() => this.startMalusChoice(), REVEAL_TIME);
    } else {
      this.timer = setTimeout(() => this.nextRound(), REVEAL_TIME);
    }
  }

  startMalusChoice() {
    this.clearTimers();
    this.status = "malus-choice";
    this.timeLeft = Math.ceil(MALUS_CHOICE_TIME / 1000);
    this.broadcastState();
    this.startTick(MALUS_CHOICE_TIME, () => this.nextRound());
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const player = this.findByConn(sender.id);
    if (!player) return;
    const rp = this.rPlayers.get(player.id);
    if (!rp) return;

    if (action === "answer" && this.status === "question" && !rp.hasAnswered) {
      const idx = payload.choiceIndex as number;
      rp.hasAnswered = true;
      rp.answerIndex = idx;
      if (this.currentQuestion && idx === this.currentQuestion.correctIndex) {
        rp.score += 100;
        if (!this.lastCorrectPlayerId) this.lastCorrectPlayerId = rp.id;
      }
      this.broadcastState();
      if (Array.from(this.rPlayers.values()).every(p => p.hasAnswered)) {
        this.revealAnswer();
      }
    }

    if (action === "send-malus" && this.status === "malus-choice" && rp.id === this.lastCorrectPlayerId) {
      const targetId = payload.targetId as string;
      const malusType = payload.malusType as MalusType;
      const target = this.rPlayers.get(targetId);
      if (target && target.id !== rp.id) {
        target.pendingMalus = malusType;
        this.clearTimers();
        this.broadcastState();
        this.timer = setTimeout(() => this.nextRound(), 1000);
      }
    }
  }

  endQuiz() {
    this.clearTimers();
    this.status = "game-over";
    const sorted = Array.from(this.rPlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = sorted.map((p, i) => ({ playerId: p.id, playerName: p.name, rank: i + 1, score: p.score }));
    this.endGame(rankings);
  }

  findByConn(connId: string) {
    for (const [, p] of this.players) { if (p.connectionId === connId) return p; }
    return null;
  }

  startTick(totalMs: number, onDone: () => void) {
    this.clearTimers();
    this.timeLeft = Math.ceil(totalMs / 1000);
    this.tickTimer = setInterval(() => {
      this.timeLeft--;
      this.broadcastState();
      if (this.timeLeft <= 0) { this.clearTimers(); onDone(); }
    }, 1000);
  }

  broadcastState() {
    this.broadcast({ type: "game-state", payload: this.getState() });
  }

  getState(): Record<string, unknown> {
    return {
      status: this.status,
      round: this.round,
      totalRounds: TOTAL_ROUNDS,
      question: this.currentQuestion && this.status !== "game-over" ? {
        text: this.currentQuestion.text,
        choices: this.currentQuestion.choices,
        category: this.currentQuestion.category,
      } : null,
      correctAnswer: this.status === "reveal" || this.status === "malus-choice" ? this.currentQuestion?.correctIndex : undefined,
      timeLeft: this.timeLeft,
      players: Array.from(this.rPlayers.values()).map(p => ({
        id: p.id, name: p.name, score: p.score, hasAnswered: p.hasAnswered, activeMalus: p.activeMalus,
      })),
      malusChooser: this.lastCorrectPlayerId,
      lastCorrectPlayer: this.lastCorrectPlayerId,
    };
  }

  clearTimers() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
  }

  cleanup() { this.clearTimers(); }
}
