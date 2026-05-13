/**
 * 8 Américain (Crazy Eights variant) — PartyKit server
 *
 * Rules (FR):
 *  - 52 cards + 2 jokers = 54
 *  - 7 cards per player to start
 *  - Play matching suit OR rank
 *  - Specials:
 *      As (A)        → next player picks +2 (stackable)
 *      Joker (JK)    → next player picks +4 + chooser names new suit (stackable)
 *      8             → chooser names new suit
 *      Dame ♣        → next player picks +3
 *      Valet (V)     → reverses direction
 *      7             → skips next player
 *      10            → current player plays again
 *  - 2-8 players; first to empty hand wins
 *  - If you can't play, draw 1; if still can't, skip
 */
import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "V" | "D" | "R" | "JK";

interface Card { rank: Rank; suit: Suit | null; } // suit null for joker

interface AmPlayer {
  id: string;
  name: string;
  hand: Card[];
}

const TURN_TIME = 25;
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["A","2","3","4","5","6","7","8","9","10","V","D","R"];

export class HuitAmericainGame extends BaseGame {
  amPlayers: Map<string, AmPlayer> = new Map();
  deck: Card[] = [];
  discardTop: Card | null = null;
  askedSuit: Suit | null = null; // when 8 or joker forces a color
  turnOrder: string[] = [];
  currentIdx = 0;
  direction: 1 | -1 = 1;
  pendingDraws = 0; // accumulated +2/+3/+4
  status: "waiting" | "playing" | "game-over" = "waiting";
  timeLeft = TURN_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  ranks: GameRanking[] = []; // accumulates finishers in order

  buildDeck(): Card[] {
    const cards: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) cards.push({ rank, suit });
    }
    cards.push({ rank: "JK", suit: null });
    cards.push({ rank: "JK", suit: null });
    return cards;
  }

  shuffle(a: Card[]) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  draw(n = 1): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < n; i++) {
      if (this.deck.length === 0) this.refillDeck();
      const card = this.deck.pop();
      if (card) drawn.push(card);
    }
    return drawn;
  }

  refillDeck() {
    if (!this.discardTop) return;
    // Recycle all but the current top
    if (this.deck.length === 0) {
      // No safe recycling source here (we don't keep a separate pile) — generate fresh deck minus visible cards
      const fresh = this.buildDeck();
      // Remove cards currently in hands and on top
      const inHands = new Set<string>();
      for (const p of this.amPlayers.values())
        for (const c of p.hand) inHands.add(this.cardKey(c));
      inHands.add(this.cardKey(this.discardTop));
      this.deck = fresh.filter(c => !inHands.has(this.cardKey(c)));
      this.shuffle(this.deck);
    }
  }

  cardKey(c: Card) { return `${c.rank}-${c.suit ?? "X"}`; }

  start() {
    if (this.started || this.players.size < 2) return;
    this.started = true;
    this.status = "playing";

    this.deck = this.buildDeck();
    this.shuffle(this.deck);

    this.turnOrder = Array.from(this.players.keys());
    this.amPlayers.clear();
    for (const id of this.turnOrder) {
      const player = this.players.get(id)!;
      this.amPlayers.set(id, { id, name: player.name, hand: this.draw(7) });
    }

    // First discard card — must not be a special-effect card; if it is, redraw
    let top: Card | undefined;
    do {
      top = this.deck.pop();
      if (!top) break;
      if (this.isSpecial(top)) {
        // put it back at the bottom and reshuffle
        this.deck.unshift(top);
      } else break;
    } while (this.deck.length > 0);
    this.discardTop = top || { rank: "9", suit: "♠" };

    this.currentIdx = 0;
    this.direction = 1;
    this.askedSuit = null;
    this.pendingDraws = 0;
    this.startTurnTimer();
    this.broadcastState();
  }

  isSpecial(c: Card): boolean {
    return c.rank === "A" || c.rank === "JK" || c.rank === "8" ||
           c.rank === "V" || c.rank === "7" || c.rank === "10" ||
           (c.rank === "D" && c.suit === "♣");
  }

  startTurnTimer() {
    this.stopTurnTimer();
    this.timeLeft = TURN_TIME;
    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        // Auto-draw + skip
        this.forceDraw();
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
      if (this.status !== "playing" || this.currentPlayerId() !== id || !this.discardTop) return;
      const p = this.amPlayers.get(id);
      if (!p) return;
      const top = this.discardTop;
      const idx = p.hand.findIndex((c) => this.canPlay(c, top, this.askedSuit));
      if (idx >= 0) {
        const card = p.hand[idx];
        const chosen = (card.rank === "8" || card.rank === "JK")
          ? SUITS[Math.floor(Math.random() * 4)]
          : null;
        this.playCard(id, idx, chosen);
      } else {
        this.forceDraw();
      }
    });
  }
  stopTurnTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  currentPlayerId(): string {
    return this.turnOrder[this.currentIdx];
  }

  nextIdx(skip = 0): number {
    const n = this.turnOrder.length;
    let idx = this.currentIdx;
    for (let i = 0; i <= skip; i++) {
      idx = (idx + this.direction + n) % n;
    }
    return idx;
  }

  canPlay(card: Card, top: Card, askedSuit: Suit | null): boolean {
    if (card.rank === "JK" || card.rank === "8") return true;
    const effectiveSuit = askedSuit ?? top.suit;
    if (card.suit && card.suit === effectiveSuit) return true;
    if (card.rank === top.rank) return true;
    return false;
  }

  onMessage(msg: Record<string, unknown>, sender: Connection) {
    const action = (msg as { action?: string }).action;
    const playerId = (msg as { playerId?: string }).playerId;
    if (!playerId || this.status !== "playing") return;
    if (this.currentPlayerId() !== playerId) return;

    if (action === "play-card") {
      const cardIndex = (msg as { cardIndex?: number }).cardIndex ?? -1;
      const chosenSuit = (msg as { chosenSuit?: Suit }).chosenSuit ?? null;
      this.playCard(playerId, cardIndex, chosenSuit);
    } else if (action === "draw") {
      this.drawAction(playerId);
    } else if (action === "pass") {
      this.advanceTurn();
      this.broadcastState();
    }
  }

  playCard(playerId: string, cardIndex: number, chosenSuit: Suit | null) {
    const p = this.amPlayers.get(playerId);
    if (!p) return;
    const card = p.hand[cardIndex];
    if (!card || !this.discardTop) return;

    // If there's a pending draw stack, only stackable cards allowed (A or JK or D♣)
    if (this.pendingDraws > 0) {
      const isStackable = card.rank === "A" || card.rank === "JK" || (card.rank === "D" && card.suit === "♣");
      if (!isStackable) return;
      // Stack only same kind continuing the chain
      // We allow any of A / JK / D♣ to stack on each other for simplicity
    } else {
      if (!this.canPlay(card, this.discardTop, this.askedSuit)) return;
    }

    p.hand.splice(cardIndex, 1);
    this.discardTop = card;
    this.askedSuit = null;

    // Effects
    let skip = 0;
    let replay = false;

    if (card.rank === "A") this.pendingDraws += 2;
    else if (card.rank === "JK") {
      this.pendingDraws += 4;
      this.askedSuit = chosenSuit;
    } else if (card.rank === "8") {
      this.askedSuit = chosenSuit;
    } else if (card.rank === "D" && card.suit === "♣") this.pendingDraws += 3;
    else if (card.rank === "V") this.direction = (this.direction * -1) as 1 | -1;
    else if (card.rank === "7") skip = 1;
    else if (card.rank === "10") replay = true;

    // Win condition
    if (p.hand.length === 0) {
      const rank = this.ranks.length + 1;
      this.ranks.push({ playerId: p.id, playerName: p.name, rank, score: 100 - (rank - 1) * 20 });
      this.amPlayers.delete(p.id);
      this.turnOrder = this.turnOrder.filter(id => id !== p.id);
      if (this.turnOrder.length <= 1) {
        // Remaining player(s) finish last
        for (const rid of this.turnOrder) {
          const rp = this.amPlayers.get(rid);
          if (rp) {
            const r = this.ranks.length + 1;
            this.ranks.push({ playerId: rp.id, playerName: rp.name, rank: r, score: Math.max(20, 100 - (r - 1) * 20) });
          }
        }
        this.endRound();
        return;
      }
      // Adjust currentIdx since we removed a player
      this.currentIdx = this.currentIdx % this.turnOrder.length;
      this.broadcastState();
      return;
    }

    if (!replay) this.currentIdx = this.nextIdx(skip);

    this.startTurnTimer();
    this.broadcastState();
  }

  drawAction(playerId: string) {
    const p = this.amPlayers.get(playerId);
    if (!p) return;
    if (this.pendingDraws > 0) {
      // Suffer the stack
      const drawn = this.draw(this.pendingDraws);
      p.hand.push(...drawn);
      this.pendingDraws = 0;
      this.advanceTurn();
    } else {
      const drawn = this.draw(1);
      p.hand.push(...drawn);
      // Check if drawn is playable; if not, pass; if yes, allow one extra action
      if (this.discardTop && this.canPlay(drawn[0], this.discardTop, this.askedSuit)) {
        // Player can play immediately — leave turn open
      } else {
        this.advanceTurn();
      }
    }
    this.startTurnTimer();
    this.broadcastState();
  }

  forceDraw() {
    const pid = this.currentPlayerId();
    if (!pid) return;
    this.drawAction(pid);
    if (this.currentPlayerId() === pid) {
      // Still their turn after auto-draw — force advance
      this.advanceTurn();
      this.startTurnTimer();
    }
  }

  advanceTurn() {
    this.currentIdx = this.nextIdx(0);
  }

  endRound() {
    this.stopTurnTimer();
    this.status = "game-over";
    this.endGame(this.ranks);
  }

  getState(): Record<string, unknown> {
    const cur = this.currentPlayerId() || null;
    return {
      status: this.status,
      currentPlayerId: cur,
      direction: this.direction,
      timeLeft: this.timeLeft,
      deckCount: this.deck.length,
      discardTop: this.discardTop,
      askedSuit: this.askedSuit,
      pendingDraws: this.pendingDraws,
      otherPlayers: this.turnOrder.map(id => {
        const p = this.amPlayers.get(id);
        return p ? { id: p.id, name: p.name, cardCount: p.hand.length, isCurrentTurn: id === cur } : null;
      }).filter(Boolean),
      hands: Object.fromEntries(
        Array.from(this.amPlayers.entries()).map(([id, p]) => [id, p.hand])
      ),
    };
  }

  cleanup() {
    this.stopTurnTimer();
    this.clearBotTimeouts();
  }
}
