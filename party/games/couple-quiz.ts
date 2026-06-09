import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";

/* ──────────────────────────────────────────────────────────────
   TU ME CONNAIS ? — quiz de couple/duo en ligne (2 telephones).
   A chaque manche : un joueur repond sur lui-meme, l'autre devine.
   Le serveur est autoritaire (deck, roles, scores, phases).
   ────────────────────────────────────────────────────────────── */

const ROUNDS = 12;

interface Q { a: string; b: string; }
const QUESTIONS: Q[] = [
  { a: "grasse matinée", b: "lève-tôt" },
  { a: "plage", b: "montagne" },
  { a: "sucré", b: "salé" },
  { a: "film d'horreur", b: "comédie romantique" },
  { a: "soirée canapé", b: "sortir dehors" },
  { a: "thé", b: "café" },
  { a: "chien", b: "chat" },
  { a: "pizza", b: "burger" },
  { a: "Netflix à la maison", b: "ciné" },
  { a: "appeler", b: "envoyer un texto" },
  { a: "fête surprise", b: "soirée tranquille" },
  { a: "cuisiner maison", b: "commander" },
  { a: "douche le matin", b: "douche le soir" },
  { a: "bain", b: "douche" },
  { a: "vacances organisées", b: "à l'aventure" },
  { a: "tatouage", b: "piercing" },
  { a: "garder son calme", b: "exploser puis ça passe" },
  { a: "romantique", b: "rigolo·te" },
  { a: "plutôt frileux·se", b: "toujours trop chaud" },
  { a: "arriver en avance", b: "toujours à la bourre" },
  { a: "sortie resto", b: "pique-nique improvisé" },
  { a: "musique à fond", b: "podcast tranquille" },
  { a: "ranger au fur et à mesure", b: "grand ménage d'un coup" },
  { a: "série à binge-watcher", b: "un épisode par soir" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

type Phase = "lobby" | "answer" | "guess" | "reveal" | "over";

export class CoupleQuizGame extends BaseGame {
  joinOrder: string[] = [];
  phase: Phase = "lobby";
  deck: Q[] = [];
  round = 0;
  answerer = 0; // index 0/1 dans humanOrder
  truth: "a" | "b" | null = null;
  guess: "a" | "b" | null = null;
  scores: [number, number] = [0, 0];

  addPlayer(id: string, name: string, conn: Connection) {
    super.addPlayer(id, name, conn);
    if (!this.joinOrder.includes(id) && !this.isBot(id)) this.joinOrder.push(id);
  }

  humanOrder(): string[] {
    return this.joinOrder.filter((id) => this.players.has(id));
  }

  indexOf(playerId: string): number {
    return this.humanOrder().indexOf(playerId);
  }

  start() {
    if (this.started) return;
    if (this.humanOrder().length < 2) return;
    this.started = true;
    this.deck = shuffle(QUESTIONS).slice(0, ROUNDS);
    this.round = 0;
    this.answerer = 0;
    this.truth = null;
    this.guess = null;
    this.scores = [0, 0];
    this.phase = "answer";
    this.broadcastState();
  }

  restartIfFinished(): boolean {
    if (this.phase === "over") {
      this.started = false;
      this.phase = "lobby";
      this.start();
      return true;
    }
    return false;
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const me = [...this.players.values()].find((p) => p.connectionId === sender.id);
    if (!me) return;
    const action = payload.action as string;
    const myIdx = this.indexOf(me.id);

    if (action === "restart") {
      this.started = false;
      this.phase = "lobby";
      this.start();
      return;
    }
    if (!this.started) return;
    const guesser = 1 - this.answerer;

    switch (action) {
      case "answer":
        if (this.phase === "answer" && myIdx === this.answerer) {
          this.truth = payload.pick === "b" ? "b" : "a";
          this.phase = "guess";
          this.broadcastState();
        }
        break;
      case "guess":
        if (this.phase === "guess" && myIdx === guesser) {
          this.guess = payload.pick === "b" ? "b" : "a";
          if (this.guess === this.truth) this.scores[guesser]++;
          this.phase = "reveal";
          this.broadcastState();
        }
        break;
      case "next":
        if (this.phase === "reveal") {
          if (this.round + 1 >= this.deck.length) {
            this.phase = "over";
          } else {
            this.round++;
            this.answerer = 1 - this.answerer;
            this.truth = null;
            this.guess = null;
            this.phase = "answer";
          }
          this.broadcastState();
        }
        break;
    }
  }

  getState(): Record<string, unknown> {
    const order = this.humanOrder();
    const players = order.slice(0, 2).map((id) => ({ id, name: this.players.get(id)!.name }));
    const guesser = 1 - this.answerer;
    const reveal = this.phase === "reveal" || this.phase === "over";
    const q = this.deck[this.round];
    return {
      started: this.started,
      phase: this.phase,
      round: this.round,
      total: this.deck.length || ROUNDS,
      players,
      answererId: order[this.answerer] ?? null,
      guesserId: order[guesser] ?? null,
      question: q ? { a: q.a, b: q.b } : null,
      truth: reveal ? this.truth : null,
      guess: reveal ? this.guess : null,
      scores: { [order[0] ?? "_0"]: this.scores[0], [order[1] ?? "_1"]: this.scores[1] },
    };
  }

  cleanup() {}
}
