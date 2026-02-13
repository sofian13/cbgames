import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

interface Item { name: string; emoji: string; hint: string; value: number; }
const ITEMS: Item[] = [
  { name: "Diamant Noir", emoji: "💎", hint: "Un objet d'une valeur inestimable", value: 300 },
  { name: "Sceptre Royal", emoji: "👑", hint: "Symbole de pouvoir absolu", value: 250 },
  { name: "Coffre d'Or", emoji: "🪙", hint: "Rempli de richesses", value: 200 },
  { name: "Potion Magique", emoji: "🧪", hint: "Un élixir aux propriétés étonnantes", value: 150 },
  { name: "Amulette Antique", emoji: "📿", hint: "Un artefact ancien et mystérieux", value: 100 },
  { name: "Couronne de Jade", emoji: "🟢", hint: "Bijou d'un empire oublié", value: 175 },
  { name: "Épée Légendaire", emoji: "⚔️", hint: "Forgée par les dieux", value: 225 },
  { name: "Relique Maudite", emoji: "💀", hint: "Quelque chose de sinistre émane de cet objet", value: -200 },
  { name: "Piège Explosif", emoji: "💣", hint: "Attention, danger potentiel", value: -150 },
  { name: "Poison Subtil", emoji: "🧫", hint: "Sentiments mitigés autour de cet artefact", value: -100 },
  { name: "Malédiction Ancienne", emoji: "☠️", hint: "Les anciens ont scellé un terrible pouvoir", value: -250 },
  { name: "Coffre Vide", emoji: "📦", hint: "Peut-être pas aussi précieux qu'il y paraît", value: -75 },
  { name: "Artefact Mystère", emoji: "❓", hint: "Le destin seul connaît sa valeur", value: 0 },
  { name: "Boîte de Pandore", emoji: "🎁", hint: "Un risque... ou une récompense ?", value: 0 },
  { name: "Dé du Destin", emoji: "🎲", hint: "La fortune sourit aux audacieux", value: 0 },
];

const TOTAL_ROUNDS = 10;
const BID_TIME = 12000;
const POISON_TIME = 5000;
const REVEAL_TIME = 4000;

interface EncherePlayer {
  id: string; name: string; gold: number;
  items: { name: string; emoji: string; value: number }[];
  bid: number; hasBid: boolean;
}

export class EnchereGame extends BaseGame {
  ePlayers: Map<string, EncherePlayer> = new Map();
  round = 0;
  status: "waiting" | "bidding" | "poison-choice" | "reveal" | "game-over" = "waiting";
  currentItem: Item | null = null;
  actualValue = 0;
  timer: ReturnType<typeof setTimeout> | null = null;
  tickTimer: ReturnType<typeof setInterval> | null = null;
  timeLeft = 0;
  winnerId: string | null = null;
  winnerBid = 0;
  poisonerId: string | null = null;
  poisoned = false;
  usedItems: Set<number> = new Set();

  start() {
    this.started = true;
    for (const [id, p] of this.players) {
      this.ePlayers.set(id, { id, name: p.name, gold: 1000, items: [], bid: 0, hasBid: false });
    }
    this.nextRound();
  }

  nextRound() {
    this.round++;
    if (this.round > TOTAL_ROUNDS) { this.endAuction(); return; }
    for (const p of this.ePlayers.values()) { p.bid = 0; p.hasBid = false; }
    this.winnerId = null; this.winnerBid = 0; this.poisonerId = null; this.poisoned = false;
    this.currentItem = this.pickItem();
    this.actualValue = this.currentItem.value;
    // Randomize mystery items
    if (this.currentItem.name === "Artefact Mystère") this.actualValue = Math.floor(Math.random() * 400) - 150;
    if (this.currentItem.name === "Boîte de Pandore") this.actualValue = Math.floor(Math.random() * 700) - 300;
    if (this.currentItem.name === "Dé du Destin") this.actualValue = Math.floor(Math.random() * 500) - 200;
    this.status = "bidding";
    this.timeLeft = Math.ceil(BID_TIME / 1000);
    this.broadcastState();
    this.startTick(BID_TIME, () => this.resolveBids());
  }

  pickItem(): Item {
    const avail = ITEMS.map((it, i) => ({ it, i })).filter(x => !this.usedItems.has(x.i));
    if (avail.length === 0) this.usedItems.clear();
    const pool = avail.length > 0 ? avail : ITEMS.map((it, i) => ({ it, i }));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.usedItems.add(pick.i);
    return pick.it;
  }

  resolveBids() {
    this.clearTimers();
    const bids = Array.from(this.ePlayers.values()).filter(p => p.bid > 0).sort((a, b) => b.bid - a.bid);
    if (bids.length === 0) { this.status = "reveal"; this.broadcastState(); this.timer = setTimeout(() => this.nextRound(), REVEAL_TIME); return; }
    const winner = bids[0];
    this.winnerId = winner.id; this.winnerBid = winner.bid;
    if (bids.length >= 2) {
      this.poisonerId = bids[1].id;
      this.status = "poison-choice";
      this.timeLeft = Math.ceil(POISON_TIME / 1000);
      this.broadcastState();
      this.startTick(POISON_TIME, () => this.resolvePoison(false));
    } else {
      this.applyWin(); this.status = "reveal"; this.broadcastState();
      this.timer = setTimeout(() => this.nextRound(), REVEAL_TIME);
    }
  }

  resolvePoison(didPoison: boolean) {
    this.clearTimers();
    this.poisoned = didPoison;
    this.applyWin();
    this.status = "reveal";
    this.broadcastState();
    this.timer = setTimeout(() => this.nextRound(), REVEAL_TIME);
  }

  applyWin() {
    const winner = this.ePlayers.get(this.winnerId!);
    if (!winner) return;
    winner.gold -= this.winnerBid;
    let val = this.actualValue;
    if (this.poisoned) { val = Math.floor(val / 2); const poisoner = this.ePlayers.get(this.poisonerId!); if (poisoner) poisoner.gold -= 50; }
    winner.items.push({ name: this.currentItem!.name, emoji: this.currentItem!.emoji, value: val });
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const gp = this.findByConn(sender.id); if (!gp) return;
    const ep = this.ePlayers.get(gp.id); if (!ep) return;

    if (action === "bid" && this.status === "bidding" && !ep.hasBid) {
      const amount = Math.max(0, Math.min(Number(payload.amount) || 0, ep.gold));
      ep.bid = amount >= 50 ? amount : 0;
      ep.hasBid = true;
      this.broadcastState();
      if (Array.from(this.ePlayers.values()).every(p => p.hasBid)) this.resolveBids();
    }
    if (action === "poison" && this.status === "poison-choice" && gp.id === this.poisonerId) {
      const poisoner = this.ePlayers.get(this.poisonerId!);
      if (poisoner && poisoner.gold >= 50) this.resolvePoison(true);
      else this.resolvePoison(false);
    }
    if (action === "pass-poison" && this.status === "poison-choice" && gp.id === this.poisonerId) {
      this.resolvePoison(false);
    }
  }

  endAuction() {
    this.clearTimers(); this.status = "game-over";
    const sorted = Array.from(this.ePlayers.values())
      .map(p => ({ ...p, score: p.gold + p.items.reduce((s, it) => s + it.value, 0) }))
      .sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = sorted.map((p, i) => ({ playerId: p.id, playerName: p.name, rank: i + 1, score: p.score }));
    this.endGame(rankings);
  }

  findByConn(c: string) { for (const [, p] of this.players) { if (p.connectionId === c) return p; } return null; }

  broadcastState() { this.broadcast({ type: "game-state", payload: this.getState() }); }

  getState(): Record<string, unknown> {
    return {
      status: this.status, round: this.round, totalRounds: TOTAL_ROUNDS,
      currentItem: this.currentItem ? { name: this.currentItem.name, emoji: this.currentItem.emoji, hint: this.currentItem.hint } : null,
      revealedValue: this.status === "reveal" ? this.actualValue : undefined,
      players: Array.from(this.ePlayers.values()).map(p => ({
        id: p.id, name: p.name, gold: p.gold,
        items: p.items, totalItemValue: p.items.reduce((s, it) => s + it.value, 0), hasBid: p.hasBid,
      })),
      timeLeft: this.timeLeft,
      winner: this.winnerId ? { playerId: this.winnerId, playerName: this.ePlayers.get(this.winnerId)?.name, bid: this.winnerBid } : undefined,
      poisonerId: this.poisonerId, poisoned: this.poisoned,
    };
  }

  startTick(ms: number, onDone: () => void) {
    this.clearTimers(); this.timeLeft = Math.ceil(ms / 1000);
    this.tickTimer = setInterval(() => { this.timeLeft--; this.broadcastState(); if (this.timeLeft <= 0) { this.clearTimers(); onDone(); } }, 1000);
  }
  clearTimers() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; } }
  cleanup() { this.clearTimers(); }
}
