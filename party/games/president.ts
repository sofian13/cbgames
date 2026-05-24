/**
 * Le Président (Trou-du-cul) — PartyKit server
 *
 * Rules (simplified):
 *  - 52 cards, dealt evenly to all players (3-7).
 *  - Combos: single, pair, triple, quad. Must beat previous combo with
 *    same size and higher rank. If everyone passes, the last leader starts fresh.
 *  - Card order (low → high): 3, 4, 5, 6, 7, 8, 9, 10, V, D, R, A, 2.
 *  - Win order: 1st out = Président, 2nd = Vice-Prés, etc. Last = Trou-du-cul.
 *  - Between rounds: Trou gives 2 best to Président, Vice-Trou gives 1 to Vice-Prés.
 *    They send back their worst cards in return.
 *
 * For brevity, this MVP version implements:
 *  - Dealing + combos (singles/pairs/triples/quads)
 *  - Turn rotation + pass
 *  - Rank reveal at the end of each round
 *  - Forced exchange happens automatically (no manual card pick in MVP)
 */
import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "V" | "D" | "R" | "A" | "2";

interface Card { rank: Rank; suit: Suit; }

const RANK_ORDER: Rank[] = ["3","4","5","6","7","8","9","10","V","D","R","A","2"];
const SUITS: Suit[] = ["♠","♥","♦","♣"];

interface PrePlayer {
  id: string;
  name: string;
  hand: Card[];
  finishedAt: number | null; // order of finishing (1 = president)
}

const TURN_TIME = 30;

export class PresidentGame extends BaseGame {
  prePlayers: Map<string, PrePlayer> = new Map();
  turnOrder: string[] = [];
  currentIdx = 0;
  lastCombo: Card[] = [];
  lastComboPlayer: string | null = null;
  consecutivePasses = 0;
  passedThisRound = new Set<string>();
  finishersOrder: string[] = []; // player IDs in finishing order (président first)
  penalized: string[] = [];      // finished by playing a 2 → forced last place (trou)
  forcedRank: Rank | null = null; // when two equal combos stack: next must match this rank or skip
  status: "waiting" | "playing" | "round-over" = "waiting";
  timeLeft = TURN_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  round = 1;

  buildDeck(): Card[] {
    const cards: Card[] = [];
    for (const r of RANK_ORDER) for (const s of SUITS) cards.push({ rank: r, suit: s });
    return cards;
  }

  shuffle<T>(a: T[]) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  start() {
    if (this.started || this.players.size < 3) return;
    this.started = true;
    this.dealRound();
  }

  dealRound() {
    this.status = "playing";
    this.lastCombo = [];
    this.lastComboPlayer = null;
    this.consecutivePasses = 0;
    this.passedThisRound.clear();
    this.finishersOrder = [];
    this.penalized = [];
    this.forcedRank = null;

    const deck = this.buildDeck();
    this.shuffle(deck);

    this.turnOrder = Array.from(this.players.keys());
    this.prePlayers.clear();
    const perPlayer = Math.floor(deck.length / this.turnOrder.length);

    for (let i = 0; i < this.turnOrder.length; i++) {
      const id = this.turnOrder[i];
      const player = this.players.get(id)!;
      const start = i * perPlayer;
      const hand = deck.slice(start, start + perPlayer).sort(this.sortHand.bind(this));
      this.prePlayers.set(id, { id, name: player.name, hand, finishedAt: null });
    }

    // Player holding 3♣ starts (canonical rule)
    let starter = 0;
    for (let i = 0; i < this.turnOrder.length; i++) {
      const p = this.prePlayers.get(this.turnOrder[i])!;
      if (p.hand.some(c => c.rank === "3" && c.suit === "♣")) { starter = i; break; }
    }
    this.currentIdx = starter;

    this.startTurnTimer();
    this.broadcastState();
  }

  sortHand(a: Card, b: Card) {
    const ar = RANK_ORDER.indexOf(a.rank);
    const br = RANK_ORDER.indexOf(b.rank);
    if (ar !== br) return ar - br;
    return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
  }

  startTurnTimer() {
    this.stopTurnTimer();
    this.clearBotTimeouts(); // drop any stale bot action from the previous turn
    this.timeLeft = TURN_TIME;

    // Rank locked and current player can't match → "ça saute" (auto-skip after a beat).
    const cur = this.currentPlayerId();
    const curP = cur ? this.prePlayers.get(cur) : null;
    if (this.forcedRank && curP && !curP.hand.some((c) => c.rank === this.forcedRank)) {
      this.broadcastState();
      this.queueBotAction(() => {
        if (this.status === "playing" && this.currentPlayerId() === cur) this.passAction(cur);
      }, 1000, 1500);
      return;
    }

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        // Auto-pass
        this.passAction(this.currentPlayerId());
      }
      this.broadcastState();
    }, 1000);
    this.scheduleBotIfNeeded();
  }

  scheduleBotIfNeeded() {
    if (this.status !== "playing") return;
    const id = this.currentPlayerId();
    if (!id || !this.isBot(id)) return;
    this.queueBotAction(() => {
      if (this.status !== "playing" || this.currentPlayerId() !== id) return;
      const p = this.prePlayers.get(id);
      if (!p || p.hand.length === 0) return;
      const comboSize = this.lastCombo.length;
      // Try every single card from lowest. For multi-card combos, find same-size groups.
      if (comboSize <= 1) {
        for (let i = 0; i < p.hand.length; i++) {
          if (this.comboBeats([p.hand[i]], this.lastCombo) && this.validCombo([p.hand[i]])) {
            return this.playCombo(id, [i]);
          }
        }
      } else {
        // Group by rank, try ascending
        const groups = new Map<string, number[]>();
        p.hand.forEach((c, i) => {
          const arr = groups.get(c.rank) ?? [];
          arr.push(i);
          groups.set(c.rank, arr);
        });
        for (const indices of groups.values()) {
          if (indices.length >= comboSize) {
            const tryIndices = indices.slice(0, comboSize);
            const cards = tryIndices.map((i) => p.hand[i]);
            if (this.validCombo(cards) && this.comboBeats(cards, this.lastCombo)) {
              return this.playCombo(id, tryIndices);
            }
          }
        }
      }
      this.passAction(id);
    }, 1700, 3200); // slower bots — easier to follow
  }
  stopTurnTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  currentPlayerId(): string {
    return this.turnOrder[this.currentIdx];
  }

  advanceTurn() {
    const n = this.turnOrder.length;
    for (let attempts = 0; attempts < n; attempts++) {
      this.currentIdx = (this.currentIdx + 1) % n;
      const pid = this.currentPlayerId();
      const p = this.prePlayers.get(pid);
      if (!p || p.hand.length === 0) continue; // skip finished players
      // We've come back around to the player who laid the current combo:
      // everyone else passed → they win the trick and lead fresh.
      if (pid === this.lastComboPlayer) { this.resetTrick(); return; }
      // Next player who still has cards and hasn't passed this trick.
      if (!this.passedThisRound.has(pid)) return;
    }
    // No eligible responder found → trick won by the last combo player.
    this.resetTrick();
  }

  resetTrick() {
    this.lastCombo = [];
    this.forcedRank = null; // new trick → rank lock released
    this.passedThisRound.clear();
    if (this.lastComboPlayer) {
      const idx = this.turnOrder.indexOf(this.lastComboPlayer);
      if (idx >= 0) {
        this.currentIdx = idx;
        // If they already finished, advance to next
        const p = this.prePlayers.get(this.lastComboPlayer);
        if (!p || p.hand.length === 0) this.advanceTurn();
      }
    }
    this.lastComboPlayer = null;
  }

  validCombo(cards: Card[]): boolean {
    if (cards.length === 0 || cards.length > 4) return false;
    const ranks = new Set(cards.map(c => c.rank));
    return ranks.size === 1;
  }

  comboBeats(newCombo: Card[], oldCombo: Card[]): boolean {
    if (oldCombo.length === 0) return true;
    if (newCombo.length !== oldCombo.length) return false;
    // Rank locked (two equal combos stacked): only that exact rank may be played.
    if (this.forcedRank) return newCombo[0].rank === this.forcedRank;
    const a = RANK_ORDER.indexOf(newCombo[0].rank);
    const b = RANK_ORDER.indexOf(oldCombo[0].rank);
    return a >= b; // equal OR higher (equal triggers the lock)
  }

  onMessage(msg: Record<string, unknown>, sender: Connection) {
    const action = (msg as { action?: string }).action;
    const playerId = (msg as { playerId?: string }).playerId;
    if (!playerId || this.status !== "playing") return;
    if (this.currentPlayerId() !== playerId) return;

    if (action === "play-combo") {
      const indices = ((msg as { indices?: number[] }).indices || []).filter(i => typeof i === "number");
      this.playCombo(playerId, indices);
    } else if (action === "pass") {
      this.passAction(playerId);
    }
  }

  playCombo(playerId: string, indices: number[]) {
    const p = this.prePlayers.get(playerId);
    if (!p) return;
    const cards = indices.map(i => p.hand[i]).filter(Boolean);
    if (cards.length !== indices.length) return;
    if (!this.validCombo(cards)) return;
    if (!this.comboBeats(cards, this.lastCombo)) return;

    // Two equal combos stacked (same rank as the combo we just beat) → lock the rank:
    // the next players must play this same rank or "ça saute".
    const playedEqual = this.lastCombo.length > 0 && cards[0].rank === this.lastCombo[0].rank;

    // Remove cards from hand
    p.hand = p.hand.filter((_, i) => !indices.includes(i));
    this.lastCombo = cards;
    this.lastComboPlayer = playerId;
    this.consecutivePasses = 0;
    if (playedEqual) this.forcedRank = cards[0].rank;

    // Check if player finished
    if (p.hand.length === 0 && p.finishedAt === null) {
      if (cards[0].rank === "2") {
        // Forbidden to finish on a 2 → forced trou-du-cul (ranked last).
        p.finishedAt = -1; // sentinel: penalized, resolved at endRound
        this.penalized.push(playerId);
      } else {
        p.finishedAt = this.finishersOrder.length + 1;
        this.finishersOrder.push(playerId);
      }
      // Round over when only one player still holds cards.
      const remaining = this.turnOrder.filter(id => (this.prePlayers.get(id)?.hand.length ?? 0) > 0);
      if (remaining.length <= 1) {
        for (const rid of remaining) {
          const rp = this.prePlayers.get(rid);
          if (rp) { rp.finishedAt = this.finishersOrder.length + 1; this.finishersOrder.push(rid); }
        }
        return this.endRound();
      }
    }

    this.advanceTurn();
    this.startTurnTimer();
    this.broadcastState();
  }

  passAction(playerId: string) {
    if (this.lastCombo.length === 0) {
      // Can't pass when leading — just advance
      this.advanceTurn();
      this.startTurnTimer();
      this.broadcastState();
      return;
    }
    this.passedThisRound.add(playerId);
    this.advanceTurn();
    this.startTurnTimer();
    this.broadcastState();
  }

  endRound() {
    this.stopTurnTimer();
    this.status = "round-over";

    // Final order: normal finishers (président first), then players who finished
    // on a 2 (penalized → trou). penalized go last, in reverse so the most recent is dead-last.
    const order = [...this.finishersOrder, ...[...this.penalized].reverse()];
    const rankings: GameRanking[] = order.map((id, i) => {
      const p = this.prePlayers.get(id)!;
      return {
        playerId: id,
        playerName: p.name,
        rank: i + 1,
        score: Math.max(0, 100 - i * 25),
      };
    });
    this.endGame(rankings);
  }

  getState(): Record<string, unknown> {
    const cur = this.currentPlayerId() || null;
    return {
      status: this.status,
      round: this.round,
      currentPlayerId: cur,
      timeLeft: this.timeLeft,
      lastCombo: this.lastCombo,
      lastComboPlayer: this.lastComboPlayer,
      forcedRank: this.forcedRank,
      otherPlayers: this.turnOrder.map(id => {
        const p = this.prePlayers.get(id);
        return p ? {
          id: p.id,
          name: p.name,
          cardCount: p.hand.length,
          isCurrentTurn: id === cur,
          passed: this.passedThisRound.has(id),
          finishedAt: p.finishedAt,
        } : null;
      }).filter(Boolean),
      hands: Object.fromEntries(
        Array.from(this.prePlayers.entries()).map(([id, p]) => [id, p.hand])
      ),
    };
  }

  cleanup() {
    this.stopTurnTimer();
    this.clearBotTimeouts();
  }
}
