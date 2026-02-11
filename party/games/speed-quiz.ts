import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

interface QuizQuestion {
  text: string;
  choices: string[];
  answer: number; // index of correct choice
}

const QUESTIONS: QuizQuestion[] = [
  { text: "Quelle est la capitale de l'Australie ?", choices: ["Sydney", "Melbourne", "Canberra", "Brisbane"], answer: 2 },
  { text: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?", choices: ["1967", "1969", "1971", "1965"], answer: 1 },
  { text: "Quel est le plus grand océan du monde ?", choices: ["Atlantique", "Indien", "Arctique", "Pacifique"], answer: 3 },
  { text: "Qui a peint La Joconde ?", choices: ["Michel-Ange", "Raphaël", "Léonard de Vinci", "Botticelli"], answer: 2 },
  { text: "Combien d'os le corps humain adulte possède-t-il ?", choices: ["186", "206", "226", "196"], answer: 1 },
  { text: "Quel est le plus long fleuve du monde ?", choices: ["Amazone", "Nil", "Yangtsé", "Mississippi"], answer: 1 },
  { text: "En quelle année a eu lieu la Révolution française ?", choices: ["1776", "1789", "1804", "1815"], answer: 1 },
  { text: "Quel élément chimique a pour symbole 'Au' ?", choices: ["Argent", "Aluminium", "Or", "Cuivre"], answer: 2 },
  { text: "Quel pays a la plus grande population au monde ?", choices: ["Inde", "États-Unis", "Chine", "Indonésie"], answer: 0 },
  { text: "Combien de planètes composent le système solaire ?", choices: ["7", "8", "9", "10"], answer: 1 },
  { text: "Qui a écrit 'Les Misérables' ?", choices: ["Émile Zola", "Victor Hugo", "Alexandre Dumas", "Gustave Flaubert"], answer: 1 },
  { text: "Quelle est la monnaie du Japon ?", choices: ["Won", "Yuan", "Yen", "Ringgit"], answer: 2 },
  { text: "Quel est le plus haut sommet du monde ?", choices: ["K2", "Kangchenjunga", "Mont Blanc", "Everest"], answer: 3 },
  { text: "Quelle planète est surnommée la planète rouge ?", choices: ["Vénus", "Jupiter", "Mars", "Saturne"], answer: 2 },
  { text: "Combien de côtés a un hexagone ?", choices: ["5", "6", "7", "8"], answer: 1 },
  { text: "En quelle année le mur de Berlin est-il tombé ?", choices: ["1987", "1989", "1991", "1985"], answer: 1 },
  { text: "Quel est le plus petit pays du monde ?", choices: ["Monaco", "Vatican", "Saint-Marin", "Liechtenstein"], answer: 1 },
  { text: "Qui a composé la Symphonie n°5 ?", choices: ["Mozart", "Bach", "Beethoven", "Vivaldi"], answer: 2 },
  { text: "Quel gaz les plantes absorbent-elles pour la photosynthèse ?", choices: ["Oxygène", "Azote", "Dioxyde de carbone", "Hydrogène"], answer: 2 },
  { text: "Quel sport pratique-t-on à Roland-Garros ?", choices: ["Football", "Tennis", "Rugby", "Athlétisme"], answer: 1 },
  { text: "Combien de dents un adulte a-t-il normalement ?", choices: ["28", "30", "32", "34"], answer: 2 },
  { text: "Quelle est la langue la plus parlée au monde ?", choices: ["Anglais", "Espagnol", "Mandarin", "Hindi"], answer: 2 },
  { text: "Quel animal est le symbole de la marque Lacoste ?", choices: ["Crocodile", "Alligator", "Lézard", "Caméléon"], answer: 0 },
  { text: "En combien de temps la Terre fait-elle le tour du Soleil ?", choices: ["364 jours", "365,25 jours", "366 jours", "360 jours"], answer: 1 },
  { text: "Quel est le métal le plus abondant dans la croûte terrestre ?", choices: ["Fer", "Cuivre", "Aluminium", "Or"], answer: 2 },
  { text: "Qui a inventé la théorie de la relativité ?", choices: ["Newton", "Einstein", "Hawking", "Bohr"], answer: 1 },
  { text: "Quelle ville est surnommée 'la ville lumière' ?", choices: ["Londres", "Rome", "Paris", "New York"], answer: 2 },
  { text: "Combien y a-t-il de continents ?", choices: ["5", "6", "7", "8"], answer: 2 },
  { text: "Quel est le plus grand désert du monde ?", choices: ["Sahara", "Gobi", "Antarctique", "Kalahari"], answer: 2 },
  { text: "Quel animal peut vivre le plus longtemps ?", choices: ["Éléphant", "Tortue géante", "Baleine", "Perroquet"], answer: 1 },
  { text: "Dans quel pays se trouve la tour de Pise ?", choices: ["France", "Espagne", "Italie", "Grèce"], answer: 2 },
  { text: "Quelle est la formule chimique de l'eau ?", choices: ["HO2", "H2O", "OH2", "H3O"], answer: 1 },
  { text: "Quel est le plus grand mammifère marin ?", choices: ["Requin blanc", "Orque", "Baleine bleue", "Cachalot"], answer: 2 },
  { text: "Combien de joueurs composent une équipe de football ?", choices: ["9", "10", "11", "12"], answer: 2 },
  { text: "Quel pays a inventé les Jeux Olympiques ?", choices: ["Italie", "France", "Grèce", "Turquie"], answer: 2 },
  { text: "Quelle est la vitesse de la lumière ?", choices: ["200 000 km/s", "300 000 km/s", "400 000 km/s", "150 000 km/s"], answer: 1 },
  { text: "Quel organe produit l'insuline ?", choices: ["Foie", "Rein", "Pancréas", "Estomac"], answer: 2 },
  { text: "Qui a découvert l'Amérique en 1492 ?", choices: ["Magellan", "Christophe Colomb", "Vasco de Gama", "Marco Polo"], answer: 1 },
  { text: "Quelle est la plus grande île du monde ?", choices: ["Madagascar", "Bornéo", "Groenland", "Nouvelle-Guinée"], answer: 2 },
  { text: "Quel est le symbole chimique du fer ?", choices: ["Fr", "Fe", "Fi", "Fa"], answer: 1 },
  { text: "Combien de cordes a un violon ?", choices: ["3", "4", "5", "6"], answer: 1 },
  { text: "Quel fleuve traverse Paris ?", choices: ["Rhône", "Loire", "Seine", "Garonne"], answer: 2 },
  { text: "Quel est le pays le plus vaste du monde ?", choices: ["Canada", "Chine", "États-Unis", "Russie"], answer: 3 },
  { text: "De quelle couleur est une émeraude ?", choices: ["Bleu", "Rouge", "Vert", "Violet"], answer: 2 },
  { text: "En quelle année le Titanic a-t-il coulé ?", choices: ["1910", "1912", "1914", "1908"], answer: 1 },
  { text: "Quel est le plus rapide animal terrestre ?", choices: ["Lion", "Guépard", "Antilope", "Lévrier"], answer: 1 },
  { text: "Combien de faces a un dé classique ?", choices: ["4", "6", "8", "10"], answer: 1 },
  { text: "Quelle est la capitale du Canada ?", choices: ["Toronto", "Montréal", "Ottawa", "Vancouver"], answer: 2 },
  { text: "Quel gaz compose principalement l'atmosphère terrestre ?", choices: ["Oxygène", "Azote", "Dioxyde de carbone", "Argon"], answer: 1 },
  { text: "Qui a peint le plafond de la chapelle Sixtine ?", choices: ["Léonard de Vinci", "Raphaël", "Michel-Ange", "Donatello"], answer: 2 },
];

const TOTAL_ROUNDS = 10;
const QUESTION_TIME = 15; // seconds per question
const REVEAL_TIME = 3000; // ms to show correct answer

interface QuizPlayer {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  lastCorrect?: boolean;
  answerTime?: number;
}

export class SpeedQuizGame extends BaseGame {
  quizPlayers: Map<string, QuizPlayer> = new Map();
  questions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  timeLeft = QUESTION_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  status: "waiting" | "question" | "reveal" | "game-over" = "waiting";
  questionStartTime = 0;
  firstCorrectId: string | null = null;
  answeredCount = 0;

  pickQuestions() {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    this.questions = shuffled.slice(0, TOTAL_ROUNDS);
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
    this.firstCorrectId = null;
    this.answeredCount = 0;

    for (const p of this.quizPlayers.values()) {
      p.hasAnswered = false;
      p.lastCorrect = undefined;
      p.answerTime = undefined;
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
        this.revealAnswer();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  revealAnswer() {
    this.stopTimer();
    this.status = "reveal";

    const q = this.questions[this.currentQuestionIndex];
    this.broadcast({
      type: "game-state",
      payload: {
        ...this.getState(),
        correctAnswer: q.answer,
      },
    });

    setTimeout(() => {
      this.currentQuestionIndex++;
      this.startQuestion();
    }, REVEAL_TIME);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;

    if (action === "answer" && this.status === "question") {
      const choiceIndex = payload.choiceIndex as number;
      const senderPlayer = this.findGamePlayerByConnection(sender.id);
      if (!senderPlayer) return;

      const qp = this.quizPlayers.get(senderPlayer.id);
      if (!qp || qp.hasAnswered) return;

      qp.hasAnswered = true;
      this.answeredCount++;

      const q = this.questions[this.currentQuestionIndex];
      const isCorrect = choiceIndex === q.answer;
      qp.lastCorrect = isCorrect;

      if (isCorrect) {
        const elapsed = (Date.now() - this.questionStartTime) / 1000;
        const timeBonus = Math.max(0, 1 - elapsed / QUESTION_TIME);
        const points = Math.round(50 + 50 * timeBonus); // 50-100 points based on speed

        if (!this.firstCorrectId) {
          this.firstCorrectId = senderPlayer.id;
          qp.score += points + 20; // bonus for being first
        } else {
          qp.score += points;
        }
        qp.answerTime = Math.round(elapsed * 100) / 100;
      }

      // Notify the answering player of their result
      this.sendTo(sender.id, {
        type: "round-result",
        payload: {
          correct: isCorrect,
          isFirst: this.firstCorrectId === senderPlayer.id,
          points: isCorrect ? (this.firstCorrectId === senderPlayer.id ? Math.round(50 + 50 * Math.max(0, 1 - (Date.now() - this.questionStartTime) / 1000 / QUESTION_TIME)) + 20 : Math.round(50 + 50 * Math.max(0, 1 - (Date.now() - this.questionStartTime) / 1000 / QUESTION_TIME))) : 0,
        },
      });

      // Update all players with answer status
      this.broadcast({
        type: "game-update",
        payload: {
          players: Array.from(this.quizPlayers.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            hasAnswered: p.hasAnswered,
            lastCorrect: p.lastCorrect,
          })),
        },
      });

      // If all players answered, reveal immediately
      if (this.answeredCount >= this.quizPlayers.size) {
        this.revealAnswer();
      }
    }
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

  getState(): Record<string, unknown> {
    const q = this.questions[this.currentQuestionIndex];
    return {
      currentQuestion: q ? {
        text: q.text,
        choices: q.choices,
        index: this.currentQuestionIndex,
        total: this.questions.length,
      } : null,
      players: Array.from(this.quizPlayers.values()).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        hasAnswered: p.hasAnswered,
        lastCorrect: p.lastCorrect,
      })),
      timeLeft: this.timeLeft,
      status: this.status,
      round: this.currentQuestionIndex + 1,
      firstCorrectId: this.firstCorrectId,
    };
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
