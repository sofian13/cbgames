import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

const TOTAL_ROUNDS = 8;
const TRADE_TIME = 15000;
const REVEAL_TIME = 4000;

interface Card { name: string; emoji: string; value: number; fakeValue: number; }

const CARD_POOL: Omit<Card, "fakeValue">[] = [
  { name: "Diamant", emoji: "💎", value: 50 },
  { name: "Or", emoji: "🥇", value: 40 },
  { name: "Argent", emoji: "🥈", value: 30 },
  { name: "Bronze", emoji: "🥉", value: 20 },
  { name: "Pierre", emoji: "🪨", value: 5 },
  { name: "Bois", emoji: "🪵", value: 10 },
  { name: "Rubis", emoji: "♦️", value: 45 },
  { name: "Emeraude", emoji: "🟢", value: 35 },
  { name: "Charbon", emoji: "⬛", value: 3 },
  { name: "Cuivre", emoji: "🟤", value: 15 },
  { name: "Poison", emoji: "☠️", value: -30 },
  { name: "Bombe", emoji: "💣", value: -20 },
  { name: "Maudit", emoji: "🔮", value: -15 },
  { name: "Contrefacon", emoji: "🃏", value: -10 },
];

function makeCard(): Card {
  const base = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  // Fake value can differ from real value -- bluffing opportunity
  const offset = (Math.floor(Math.random() * 5) - 2) * 10;
  return { ...base, fakeValue: Math.max(-30, base.value + offset) };
}

interface BMPlayer {
  id: string; name: string; score: number;
  hand: Card[]; hasTraded: boolean;
  tradeOffer: { cardIndex: number; targetId: string; claimedValue: number } | null;
}

export class BlackMarketGame extends BaseGame {
  mPlayers: Map<string, BMPlayer> = new Map();
  round = 0;
  status: "waiting" | "trading" | "reveal" | "game-over" = "waiting";
  timer: ReturnType<typeof setTimeout> | null = null;
  tickTimer: ReturnType<typeof setInterval> | null = null;
  timeLeft = 0;
  pendingTrades: { fromId: string; toId: string; cardIndex: number; claimedValue: number }[] = [];
  acceptedTrades: { fromId: string; toId: string; fromCard: Card; toCard: Card }[] = [];

  start() {
    this.started = true;
    for (const [id, p] of this.players) {
      const hand = Array.from({ length: 3 }, () => makeCard());
      this.mPlayers.set(id, { id, name: p.name, score: 0, hand, hasTraded: false, tradeOffer: null });
    }
    this.nextRound();
  }

  nextRound() {
    this.round++;
    if (this.round > TOTAL_ROUNDS) { this.endBM(); return; }
    for (const p of this.mPlayers.values()) { p.hasTraded = false; p.tradeOffer = null; }
    this.pendingTrades = [];
    this.acceptedTrades = [];
    // Give each player a new card each round
    for (const p of this.mPlayers.values()) {
      if (p.hand.length < 5) p.hand.push(makeCard());
    }
    this.status = "trading";
    this.timeLeft = Math.ceil(TRADE_TIME / 1000);
    this.broadcastPersonalized();
    this.startTick(TRADE_TIME, () => this.resolveRound());
  }

  resolveRound() {
    this.clearTimers();
    // Process accepted trades
    this.status = "reveal";
    // Calculate scores: sum of real card values
    for (const p of this.mPlayers.values()) {
      p.score = p.hand.reduce((sum, c) => sum + c.value, 0);
    }
    this.broadcastPersonalized();
    this.timer = setTimeout(() => this.nextRound(), REVEAL_TIME);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const gp = this.findByConn(sender.id); if (!gp) return;
    const mp = this.mPlayers.get(gp.id); if (!mp) return;

    if (action === "offer-trade" && this.status === "trading") {
      const cardIndex = Number(payload.cardIndex);
      const targetId = payload.targetId as string;
      const claimedValue = Number(payload.claimedValue);
      if (cardIndex < 0 || cardIndex >= mp.hand.length) return;
      if (!this.mPlayers.has(targetId) || targetId === gp.id) return;
      this.pendingTrades.push({ fromId: gp.id, toId: targetId, cardIndex, claimedValue });
      this.broadcastPersonalized();
    }

    if (action === "accept-trade" && this.status === "trading") {
      const tradeIndex = Number(payload.tradeIndex);
      const myCardIndex = Number(payload.myCardIndex);
      const trade = this.pendingTrades[tradeIndex];
      if (!trade || trade.toId !== gp.id) return;
      const from = this.mPlayers.get(trade.fromId);
      if (!from) return;
      if (myCardIndex < 0 || myCardIndex >= mp.hand.length) return;
      if (trade.cardIndex >= from.hand.length) return;

      // Swap cards
      const fromCard = from.hand.splice(trade.cardIndex, 1)[0];
      const toCard = mp.hand.splice(myCardIndex, 1)[0];
      from.hand.push(toCard);
      mp.hand.push(fromCard);
      this.acceptedTrades.push({ fromId: trade.fromId, toId: gp.id, fromCard, toCard });
      // Remove the pending trade
      this.pendingTrades.splice(tradeIndex, 1);
      this.broadcastPersonalized();
    }

    if (action === "decline-trade" && this.status === "trading") {
      const tradeIndex = Number(payload.tradeIndex);
      if (this.pendingTrades[tradeIndex]?.toId === gp.id) {
        this.pendingTrades.splice(tradeIndex, 1);
        this.broadcastPersonalized();
      }
    }
  }

  endBM() {
    this.clearTimers(); this.status = "game-over";
    for (const p of this.mPlayers.values()) {
      p.score = p.hand.reduce((sum, c) => sum + c.value, 0);
    }
    const sorted = Array.from(this.mPlayers.values()).sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = sorted.map((p, i) => ({ playerId: p.id, playerName: p.name, rank: i + 1, score: p.score }));
    this.endGame(rankings);
  }

  findByConn(c: string) { for (const [, p] of this.players) { if (p.connectionId === c) return p; } return null; }

  broadcastPersonalized() {
    for (const [id] of this.mPlayers) {
      this.sendToPlayer(id, { type: "game-state", payload: this.getStateFor(id) });
    }
  }

  getStateFor(forId: string): Record<string, unknown> {
    const mp = this.mPlayers.get(forId);
    return {
      status: this.status, round: this.round, totalRounds: TOTAL_ROUNDS, timeLeft: this.timeLeft,
      myHand: mp?.hand.map(c => ({ name: c.name, emoji: c.emoji, value: c.value, fakeValue: c.fakeValue })) ?? [],
      players: Array.from(this.mPlayers.values()).map(p => ({
        id: p.id, name: p.name, score: this.status === "reveal" || this.status === "game-over" ? p.score : undefined,
        cardCount: p.hand.length,
      })),
      pendingTrades: this.pendingTrades.map((t, i) => ({
        index: i, fromId: t.fromId, fromName: this.mPlayers.get(t.fromId)?.name,
        toId: t.toId, claimedValue: t.claimedValue,
      })),
      recentTrades: this.acceptedTrades.slice(-3).map(t => ({
        fromName: this.mPlayers.get(t.fromId)?.name, toName: this.mPlayers.get(t.toId)?.name,
      })),
    };
  }

  getState() { return this.getStateFor(""); }

  startTick(ms: number, onDone: () => void) {
    this.clearTimers(); this.timeLeft = Math.ceil(ms / 1000);
    this.tickTimer = setInterval(() => { this.timeLeft--; this.broadcastPersonalized(); if (this.timeLeft <= 0) { this.clearTimers(); onDone(); } }, 1000);
  }
  clearTimers() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; } }
  cleanup() { this.clearTimers(); }
}
