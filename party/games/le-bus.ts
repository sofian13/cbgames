import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ── Le Bus (Ride the Bus) — jeu à boire ────────────────────
// Phase 1 « Questions » : 4 manches simultanées (rouge/noir, plus/moins,
// intérieur/extérieur, couleur). Raté = tu bois N gorgées, réussi = tu les
// distribues. Phase 2 « Pyramide » : les cartes se retournent, pose tes
// doublons pour faire boire. Phase 3 « Le Bus » : celui qui garde le plus de
// cartes enchaîne les plus/moins pour descendre du bus.

const START_DELAY = 1300;
const ANSWER_TIME = 14000;
const REVEAL_TIME = 9000;
const PYRAMID_INTRO_TIME = 4500;
const FLIP_TIME = 8000;
const BUS_INTRO_TIME = 5000;
const BUS_SAFETY_TIME = 25000; // rideur AFK → choix auto
const BUS_STEPS = 5;
const BUS_MAX_ATTEMPTS = 8; // règle de pitié : le bus finit par partir

const SUITS = ["♠", "♥", "♦", "♣"] as const;
type Suit = (typeof SUITS)[number];

interface Card {
  rank: number; // 1..13 (1 = As)
  suit: Suit;
}

// L'As est la carte la plus forte
const cardValue = (c: Card) => (c.rank === 1 ? 14 : c.rank);
const isRed = (c: Card) => c.suit === "♥" || c.suit === "♦";

interface BusPlayer {
  id: string;
  name: string;
  cards: Card[]; // cartes face visible gagnées en phase questions
  sipsTaken: number;
  sipsGiven: number;
  answer: string | null; // choix de la manche en cours
  lastResult: { card: Card; correct: boolean; sips: number } | null;
  pendingGive: number; // gorgées à distribuer pendant le reveal
}

interface PyramidCard {
  card: Card;
  row: number; // 1 (bas) .. 4 (sommet)
  flipped: boolean;
}

type Phase =
  | "waiting"
  | "questions"
  | "pyramid-intro"
  | "pyramid"
  | "bus-intro"
  | "bus"
  | "game-over";

type QuestionSub = "answer" | "reveal";

const ROW_SIZES = [4, 3, 2, 1]; // bas → sommet ; gorgées = n° de rangée

export class LeBusGame extends BaseGame {
  gamePlayers: Map<string, BusPlayer> = new Map();
  phase: Phase = "waiting";
  questionRound = 0; // 1..4
  questionSub: QuestionSub = "answer";
  deck: Card[] = [];
  pyramid: PyramidCard[] = [];
  flipIndex = -1; // index de la dernière carte retournée
  busRiderId: string | null = null;
  busCurrent: Card | null = null;
  busProgress = 0;
  busAttempts = 0;
  busLast: { card: Card; correct: boolean } | null = null;
  busDone = false;
  feed: { id: number; text: string }[] = [];
  feedId = 0;
  deadline = 0; // epoch ms — le client affiche le compte à rebours
  timer: ReturnType<typeof setTimeout> | null = null;
  safetyTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Deck ─────────────────────────────────────────────────
  buildDeck() {
    this.deck = [];
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) this.deck.push({ rank, suit });
    }
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  draw(): Card {
    if (this.deck.length === 0) this.buildDeck(); // on rebrasse un paquet neuf
    return this.deck.pop()!;
  }

  // ── Lifecycle ────────────────────────────────────────────
  start() {
    this.started = true;
    this.clearTimer();
    this.timer = setTimeout(() => this.beginGame(), START_DELAY);
  }

  beginGame() {
    this.gamePlayers.clear();
    for (const [id, p] of this.players) {
      this.gamePlayers.set(id, {
        id,
        name: p.name,
        cards: [],
        sipsTaken: 0,
        sipsGiven: 0,
        answer: null,
        lastResult: null,
        pendingGive: 0,
      });
    }
    this.buildDeck();
    this.pyramid = [];
    this.flipIndex = -1;
    this.busRiderId = null;
    this.busCurrent = null;
    this.busProgress = 0;
    this.busAttempts = 0;
    this.busLast = null;
    this.busDone = false;
    this.feed = [];
    this.startQuestionRound(1);
  }

  restartIfFinished(): boolean {
    if (this.phase !== "game-over") return false;
    this.beginGame();
    return true;
  }

  pushFeed(text: string) {
    this.feed.push({ id: ++this.feedId, text });
    if (this.feed.length > 6) this.feed.shift();
  }

  // ── Phase 1 : Questions ──────────────────────────────────
  startQuestionRound(round: number) {
    this.phase = "questions";
    this.questionRound = round;
    this.questionSub = "answer";
    for (const p of this.gamePlayers.values()) {
      p.answer = null;
      p.lastResult = null;
      p.pendingGive = 0;
    }
    this.deadline = Date.now() + ANSWER_TIME;
    this.clearTimer();
    this.timer = setTimeout(() => this.resolveQuestionRound(), ANSWER_TIME);

    // Bots : réponse aléatoire
    for (const id of this.gamePlayers.keys()) {
      if (!this.isBot(id)) continue;
      this.queueBotAction(() => {
        const p = this.gamePlayers.get(id);
        if (!p || this.phase !== "questions" || this.questionSub !== "answer") return;
        p.answer = this.randomChoice(round);
        this.broadcastState();
      }, 1500, 6000);
    }
    this.broadcastState();
  }

  randomChoice(round: number): string {
    const pools: Record<number, string[]> = {
      1: ["rouge", "noir"],
      2: ["plus", "moins"],
      3: ["interieur", "exterieur"],
      4: [...SUITS],
    };
    const pool = pools[round];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  allAnswered(): boolean {
    return [...this.gamePlayers.values()].every((p) => p.answer !== null);
  }

  resolveQuestionRound() {
    if (this.phase !== "questions" || this.questionSub !== "answer") return;
    this.clearTimer();
    const sips = this.questionRound;

    for (const p of this.gamePlayers.values()) {
      const card = this.draw();
      const correct = this.evaluate(p, card);
      p.lastResult = { card, correct, sips };
      if (correct) {
        p.pendingGive = sips;
      } else {
        p.sipsTaken += sips;
      }
      p.cards.push(card);
    }

    this.questionSub = "reveal";
    this.deadline = Date.now() + REVEAL_TIME;
    this.timer = setTimeout(() => this.finishReveal(), REVEAL_TIME);

    // Bots : distribution à une cible aléatoire
    for (const id of this.gamePlayers.keys()) {
      if (!this.isBot(id)) continue;
      const p = this.gamePlayers.get(id);
      if (!p || p.pendingGive <= 0) continue;
      this.queueBotAction(() => this.giveSips(id, this.randomOtherId(id)), 1200, 4000);
    }
    this.broadcastState();
  }

  evaluate(p: BusPlayer, card: Card): boolean {
    const a = p.answer;
    if (!a) return false; // pas répondu = tu bois
    const v = cardValue(card);
    switch (this.questionRound) {
      case 1:
        return (a === "rouge") === isRed(card);
      case 2: {
        const ref = cardValue(p.cards[0]);
        if (v === ref) return false; // égalité = perdu
        return a === "plus" ? v > ref : v < ref;
      }
      case 3: {
        const lo = Math.min(cardValue(p.cards[0]), cardValue(p.cards[1]));
        const hi = Math.max(cardValue(p.cards[0]), cardValue(p.cards[1]));
        if (v === lo || v === hi) return false; // sur la borne = perdu
        const inside = v > lo && v < hi;
        return a === "interieur" ? inside : !inside;
      }
      case 4:
        return a === card.suit;
      default:
        return false;
    }
  }

  randomOtherId(selfId: string): string {
    const others = [...this.gamePlayers.keys()].filter((id) => id !== selfId);
    if (others.length === 0) return selfId;
    return others[Math.floor(Math.random() * others.length)];
  }

  giveSips(fromId: string, targetId: string) {
    const from = this.gamePlayers.get(fromId);
    const target = this.gamePlayers.get(targetId);
    if (!from || !target || from.pendingGive <= 0 || fromId === targetId) return;
    target.sipsTaken += from.pendingGive;
    from.sipsGiven += from.pendingGive;
    this.pushFeed(`${from.name} donne ${from.pendingGive} gorgée${from.pendingGive > 1 ? "s" : ""} à ${target.name} 🍺`);
    from.pendingGive = 0;
    this.broadcastState();
  }

  finishReveal() {
    if (this.phase !== "questions" || this.questionSub !== "reveal") return;
    this.clearTimer();
    // Gorgées non distribuées → cible aléatoire
    for (const p of this.gamePlayers.values()) {
      if (p.pendingGive > 0) this.giveSips(p.id, this.randomOtherId(p.id));
    }
    if (this.questionRound < 4) {
      this.startQuestionRound(this.questionRound + 1);
    } else {
      this.startPyramidIntro();
    }
  }

  // ── Phase 2 : Pyramide ───────────────────────────────────
  startPyramidIntro() {
    this.phase = "pyramid-intro";
    this.pyramid = [];
    ROW_SIZES.forEach((size, i) => {
      for (let k = 0; k < size; k++) {
        this.pyramid.push({ card: this.draw(), row: i + 1, flipped: false });
      }
    });
    this.flipIndex = -1;
    this.deadline = Date.now() + PYRAMID_INTRO_TIME;
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.phase = "pyramid";
      this.flipNext();
    }, PYRAMID_INTRO_TIME);
    this.broadcastState();
  }

  flipNext() {
    this.clearTimer();
    this.flipIndex++;
    if (this.flipIndex >= this.pyramid.length) {
      this.startBusIntro();
      return;
    }
    this.pyramid[this.flipIndex].flipped = true;
    this.deadline = Date.now() + FLIP_TIME;
    this.timer = setTimeout(() => this.flipNext(), FLIP_TIME);

    // Bots : jouent leurs doublons sur une cible aléatoire
    const current = this.pyramid[this.flipIndex];
    for (const id of this.gamePlayers.keys()) {
      if (!this.isBot(id)) continue;
      const p = this.gamePlayers.get(id);
      if (!p) continue;
      const idx = p.cards.findIndex((c) => c.rank === current.card.rank);
      if (idx >= 0) {
        const flipAtQueue = this.flipIndex;
        this.queueBotAction(() => {
          if (this.phase === "pyramid" && this.flipIndex === flipAtQueue) {
            this.playPyramidCard(id, idx, this.randomOtherId(id));
          }
        }, 1500, 5500);
      }
    }
    this.broadcastState();
  }

  playPyramidCard(playerId: string, cardIndex: number, targetId: string) {
    if (this.phase !== "pyramid" || this.flipIndex < 0) return;
    const p = this.gamePlayers.get(playerId);
    const target = this.gamePlayers.get(targetId);
    const current = this.pyramid[this.flipIndex];
    if (!p || !target || !current || playerId === targetId) return;
    const card = p.cards[cardIndex];
    if (!card || card.rank !== current.card.rank) return;
    const sips = current.row; // rangée 1 = 1 gorgée … sommet = 4
    p.cards.splice(cardIndex, 1);
    p.sipsGiven += sips;
    target.sipsTaken += sips;
    this.pushFeed(`${p.name} pose ${rankLabel(card.rank)}${card.suit} → ${target.name} boit ${sips} 🍻`);
    this.broadcastState();
  }

  // ── Phase 3 : Le Bus ─────────────────────────────────────
  startBusIntro() {
    this.clearTimer();
    // Le plus de cartes restantes monte dans le bus (égalité → hasard)
    let max = -1;
    let candidates: string[] = [];
    for (const p of this.gamePlayers.values()) {
      if (p.cards.length > max) {
        max = p.cards.length;
        candidates = [p.id];
      } else if (p.cards.length === max) {
        candidates.push(p.id);
      }
    }
    this.busRiderId = candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    if (!this.busRiderId) {
      this.finishGame();
      return;
    }
    const rider = this.gamePlayers.get(this.busRiderId);
    this.pushFeed(`${rider?.name} monte dans le bus 🚌 (${max} carte${max > 1 ? "s" : ""} en main)`);
    this.phase = "bus-intro";
    this.deadline = Date.now() + BUS_INTRO_TIME;
    this.timer = setTimeout(() => this.startBusRide(), BUS_INTRO_TIME);
    this.broadcastState();
  }

  startBusRide() {
    this.phase = "bus";
    this.buildDeck(); // paquet neuf pour le bus
    this.busCurrent = this.draw();
    this.busProgress = 0;
    this.busAttempts = 0;
    this.busLast = null;
    this.deadline = 0;
    this.armBusSafety();
    this.maybeBotRide();
    this.broadcastState();
  }

  armBusSafety() {
    this.clearSafety();
    this.safetyTimer = setTimeout(() => {
      // Rideur AFK → on joue pour lui
      if (this.phase === "bus" && !this.busDone) {
        this.busGuess(this.busRiderId!, Math.random() < 0.5 ? "plus" : "moins");
      }
    }, BUS_SAFETY_TIME);
  }

  maybeBotRide() {
    if (this.busRiderId && this.isBot(this.busRiderId)) {
      this.queueBotAction(() => {
        if (this.phase === "bus" && !this.busDone) {
          // Le bot joue la proba : carte basse → plus, carte haute → moins
          const v = this.busCurrent ? cardValue(this.busCurrent) : 8;
          const choice = v <= 8 ? "plus" : "moins";
          this.busGuess(this.busRiderId!, choice);
        }
      }, 1400, 2600);
    }
  }

  busGuess(playerId: string, choice: string) {
    if (this.phase !== "bus" || this.busDone) return;
    if (playerId !== this.busRiderId || !this.busCurrent) return;
    if (choice !== "plus" && choice !== "moins") return;
    const rider = this.gamePlayers.get(playerId);
    if (!rider) return;

    const next = this.draw();
    const cur = cardValue(this.busCurrent);
    const nxt = cardValue(next);
    const correct = nxt !== cur && (choice === "plus" ? nxt > cur : nxt < cur);
    this.busLast = { card: next, correct };

    if (correct) {
      this.busProgress++;
      this.busCurrent = next;
      if (this.busProgress >= BUS_STEPS) {
        this.busDone = true;
        this.pushFeed(`${rider.name} descend du bus, victoire ! 🎉`);
        this.clearSafety();
        this.clearTimer();
        this.timer = setTimeout(() => this.finishGame(), 4000);
        this.broadcastState();
        return;
      }
    } else {
      const sips = this.busProgress + 1;
      rider.sipsTaken += sips;
      this.busAttempts++;
      this.busProgress = 0;
      this.busCurrent = next; // la carte ratée devient la nouvelle base
      this.pushFeed(`${rider.name} déraille → ${sips} gorgée${sips > 1 ? "s" : ""} 🥴`);
      if (this.busAttempts >= BUS_MAX_ATTEMPTS) {
        this.busDone = true;
        this.pushFeed(`Le bus part sans ${rider.name}… fin du calvaire 🚌💨`);
        this.clearSafety();
        this.clearTimer();
        this.timer = setTimeout(() => this.finishGame(), 4000);
        this.broadcastState();
        return;
      }
    }
    this.armBusSafety();
    this.maybeBotRide();
    this.broadcastState();
  }

  // ── Fin de partie ────────────────────────────────────────
  finishGame() {
    this.clearTimer();
    this.clearSafety();
    this.phase = "game-over";

    const sorted = [...this.gamePlayers.values()].sort(
      (a, b) => a.sipsTaken - b.sipsTaken || b.sipsGiven - a.sipsGiven
    );
    const rankings: GameRanking[] = sorted.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      // Score = gorgées distribuées − gorgées bues (le plus sobre gagne)
      score: p.sipsGiven - p.sipsTaken,
    }));
    this.broadcastState();
    setTimeout(() => this.endGame(rankings), 600);
  }

  // ── Messages ─────────────────────────────────────────────
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const player = this.findPlayerByConnection(sender.id);
    if (!player) return;

    if (action === "answer" && this.phase === "questions" && this.questionSub === "answer") {
      const p = this.gamePlayers.get(player.id);
      const choice = String(payload.choice ?? "");
      if (!p || p.answer !== null) return;
      const valid: Record<number, string[]> = {
        1: ["rouge", "noir"],
        2: ["plus", "moins"],
        3: ["interieur", "exterieur"],
        4: [...SUITS],
      };
      if (!valid[this.questionRound]?.includes(choice)) return;
      p.answer = choice;
      // Tout le monde a répondu → on résout sans attendre le chrono
      if (this.allAnswered()) this.resolveQuestionRound();
      else this.broadcastState();
      return;
    }

    if (action === "give-sips" && this.phase === "questions" && this.questionSub === "reveal") {
      this.giveSips(player.id, String(payload.targetId ?? ""));
      return;
    }

    if (action === "play-pyramid-card" && this.phase === "pyramid") {
      this.playPyramidCard(player.id, Number(payload.cardIndex), String(payload.targetId ?? ""));
      return;
    }

    if (action === "bus-guess" && this.phase === "bus") {
      this.busGuess(player.id, String(payload.choice ?? ""));
      return;
    }
  }

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  // ── State ────────────────────────────────────────────────
  getState(): Record<string, unknown> {
    return {
      phase: this.phase,
      questionRound: this.questionRound,
      questionSub: this.questionSub,
      deadline: this.deadline,
      pyramid: this.pyramid.map((pc, i) => ({
        row: pc.row,
        flipped: pc.flipped,
        rank: pc.flipped ? pc.card.rank : null,
        suit: pc.flipped ? pc.card.suit : null,
        current: i === this.flipIndex && this.phase === "pyramid",
      })),
      busRiderId: this.busRiderId,
      busCurrent: this.busCurrent,
      busProgress: this.busProgress,
      busSteps: BUS_STEPS,
      busAttempts: this.busAttempts,
      busMaxAttempts: BUS_MAX_ATTEMPTS,
      busLast: this.busLast,
      busDone: this.busDone,
      feed: this.feed,
      players: [...this.gamePlayers.values()].map((p) => ({
        id: p.id,
        name: p.name,
        cards: p.cards,
        sipsTaken: p.sipsTaken,
        sipsGiven: p.sipsGiven,
        hasAnswered: p.answer !== null,
        lastResult: this.questionSub === "reveal" ? p.lastResult : null,
        pendingGive: p.pendingGive,
      })),
    };
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  clearSafety() {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
  }

  cleanup() {
    this.clearTimer();
    this.clearSafety();
    this.clearBotTimeouts();
  }
}

function rankLabel(rank: number): string {
  if (rank === 1) return "A";
  if (rank === 11) return "V";
  if (rank === 12) return "D";
  if (rank === 13) return "R";
  return String(rank);
}
