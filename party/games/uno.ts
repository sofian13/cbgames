import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ── Config ───────────────────────────────────────────────
const HAND_SIZE = 7;
const TURN_TIME = 30; // seconds per turn
const UNO_CALL_WINDOW = 3000; // ms to call UNO after playing
const PENALTY_DRAW = 2; // cards for missing UNO call

// ── Card types ───────────────────────────────────────────
type CardColor = "rouge" | "bleu" | "vert" | "jaune";
type WildType = "joker" | "plus4";
type ActionType = "plus2" | "passe" | "inverse";

interface NumberCard {
  type: "number";
  color: CardColor;
  value: number;
}

interface ActionCard {
  type: "action";
  color: CardColor;
  action: ActionType;
}

interface WildCard {
  type: "wild";
  wild: WildType;
  chosenColor: CardColor | null;
}

type UnoCard = NumberCard | ActionCard | WildCard;

// ── Player state ─────────────────────────────────────────
interface UnoPlayer {
  id: string;
  name: string;
  hand: UnoCard[];
  calledUno: boolean;
  // Track whether they need to call UNO (played down to 1 card)
  mustCallUno: boolean;
  unoDeadline: number; // timestamp when UNO call window expires
}

// ── Game status ──────────────────────────────────────────
type UnoStatus = "waiting" | "playing" | "choosing-color" | "game-over";

// ══════════════════════════════════════════════════════════
export class UnoGame extends BaseGame {
  unoPlayers: Map<string, UnoPlayer> = new Map();
  deck: UnoCard[] = [];
  discardPile: UnoCard[] = [];
  turnOrder: string[] = []; // player IDs in order
  currentTurnIndex = 0;
  direction: 1 | -1 = 1; // 1 = clockwise, -1 = counter-clockwise
  status: UnoStatus = "waiting";
  timeLeft = TURN_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  unoTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  // After drawing, the player can play the drawn card or pass
  drawnCard: UnoCard | null = null;
  drawnPlayerId: string | null = null;

  // ── Deck creation ────────────────────────────────────────
  createDeck(): UnoCard[] {
    const colors: CardColor[] = ["rouge", "bleu", "vert", "jaune"];
    const cards: UnoCard[] = [];

    for (const color of colors) {
      // One 0 per color
      cards.push({ type: "number", color, value: 0 });
      // Two of 1-9 per color
      for (let v = 1; v <= 9; v++) {
        cards.push({ type: "number", color, value: v });
        cards.push({ type: "number", color, value: v });
      }
      // Two of each action per color
      const actions: ActionType[] = ["plus2", "passe", "inverse"];
      for (const action of actions) {
        cards.push({ type: "action", color, action });
        cards.push({ type: "action", color, action });
      }
    }

    // 4 Joker, 4 +4
    for (let i = 0; i < 4; i++) {
      cards.push({ type: "wild", wild: "joker", chosenColor: null });
      cards.push({ type: "wild", wild: "plus4", chosenColor: null });
    }

    return cards;
  }

  shuffle(arr: UnoCard[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  drawCards(count: number): UnoCard[] {
    const drawn: UnoCard[] = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        this.reshuffleDiscard();
      }
      if (this.deck.length === 0) break; // truly no cards left
      drawn.push(this.deck.pop()!);
    }
    return drawn;
  }

  reshuffleDiscard() {
    if (this.discardPile.length <= 1) return;
    const top = this.discardPile.pop()!;
    // Reset wild cards' chosen color
    for (const card of this.discardPile) {
      if (card.type === "wild") {
        card.chosenColor = null;
      }
    }
    this.deck = [...this.discardPile];
    this.discardPile = [top];
    this.shuffle(this.deck);
  }

  // ── Game start ───────────────────────────────────────────
  start() {
    this.started = true;
    this.deck = this.createDeck();
    this.shuffle(this.deck);

    // Set turn order
    this.turnOrder = Array.from(this.players.keys());
    this.shuffle(this.turnOrder as unknown as UnoCard[]); // reuse shuffle

    // Actually shuffle the turn order properly
    for (let i = this.turnOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.turnOrder[i], this.turnOrder[j]] = [this.turnOrder[j], this.turnOrder[i]];
    }

    // Initialize players
    for (const [id, player] of this.players) {
      this.unoPlayers.set(id, {
        id,
        name: player.name,
        hand: [],
        calledUno: false,
        mustCallUno: false,
        unoDeadline: 0,
      });
    }

    // Deal 7 cards each
    for (const up of this.unoPlayers.values()) {
      up.hand = this.drawCards(HAND_SIZE);
    }

    // Place first card — if wild, keep drawing until we get a non-wild
    let startCard = this.deck.pop()!;
    while (startCard.type === "wild") {
      this.deck.unshift(startCard);
      this.shuffle(this.deck);
      startCard = this.deck.pop()!;
    }
    this.discardPile = [startCard];

    // Handle if starting card is an action card
    this.handleStartingCard(startCard);

    this.status = "playing";
    this.startTurnTimer();
    this.broadcastPersonalizedState();
  }

  handleStartingCard(card: UnoCard) {
    if (card.type === "action") {
      switch (card.action) {
        case "passe":
          // Skip first player
          this.advanceTurn();
          break;
        case "inverse":
          // Reverse direction
          this.direction = this.direction === 1 ? -1 : 1;
          break;
        case "plus2":
          // First player draws 2 and gets skipped
          {
            const firstPlayerId = this.turnOrder[this.currentTurnIndex];
            const firstPlayer = this.unoPlayers.get(firstPlayerId);
            if (firstPlayer) {
              firstPlayer.hand.push(...this.drawCards(2));
            }
            this.advanceTurn();
          }
          break;
      }
    }
  }

  // ── Turn management ──────────────────────────────────────
  getCurrentPlayerId(): string {
    return this.turnOrder[this.currentTurnIndex];
  }

  advanceTurn() {
    this.currentTurnIndex =
      (this.currentTurnIndex + this.direction + this.turnOrder.length) %
      this.turnOrder.length;
  }

  startTurnTimer() {
    this.stopTurnTimer();
    this.timeLeft = TURN_TIME;

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({
        type: "game-update",
        payload: { timeLeft: this.timeLeft },
      });

      if (this.timeLeft <= 0) {
        // Auto-draw on timeout
        this.handleAutoDraw();
      }
    }, 1000);
  }

  stopTurnTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  handleAutoDraw() {
    this.stopTurnTimer();
    const currentId = this.getCurrentPlayerId();
    const player = this.unoPlayers.get(currentId);
    if (!player) return;

    // Draw one card and pass
    const drawn = this.drawCards(1);
    player.hand.push(...drawn);

    this.drawnCard = null;
    this.drawnPlayerId = null;
    this.advanceTurn();
    this.startTurnTimer();
    this.broadcastPersonalizedState();
  }

  // ── Card matching ────────────────────────────────────────
  getTopCard(): UnoCard {
    return this.discardPile[this.discardPile.length - 1];
  }

  getEffectiveColor(card: UnoCard): CardColor | null {
    if (card.type === "wild") return card.chosenColor;
    return card.color;
  }

  canPlayCard(card: UnoCard, topCard: UnoCard): boolean {
    // Wild cards can always be played
    if (card.type === "wild") return true;

    const topColor = this.getEffectiveColor(topCard);

    // Match color
    if (card.color === topColor) return true;

    // Match number
    if (card.type === "number" && topCard.type === "number" && card.value === topCard.value) {
      return true;
    }

    // Match action
    if (card.type === "action" && topCard.type === "action" && card.action === topCard.action) {
      return true;
    }

    return false;
  }

  hasPlayableCard(player: UnoPlayer): boolean {
    const top = this.getTopCard();
    return player.hand.some((card) => this.canPlayCard(card, top));
  }

  // ── UNO call tracking ───────────────────────────────────
  startUnoWindow(playerId: string) {
    const player = this.unoPlayers.get(playerId);
    if (!player) return;

    player.mustCallUno = true;
    player.calledUno = false;
    player.unoDeadline = Date.now() + UNO_CALL_WINDOW;

    // Clear existing timer
    const existing = this.unoTimers.get(playerId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.unoTimers.delete(playerId);
      // If they didn't call UNO and still have 1 card, they can be caught
      // (We leave mustCallUno=true so others can catch them)
    }, UNO_CALL_WINDOW);

    this.unoTimers.set(playerId, timer);
  }

  // ── Message handling ─────────────────────────────────────
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const senderPlayer = this.findGamePlayerByConnection(sender.id);
    if (!senderPlayer) return;

    const playerId = senderPlayer.id;

    switch (action) {
      case "play-card":
        this.handlePlayCard(playerId, payload);
        break;
      case "draw":
        this.handleDraw(playerId);
        break;
      case "pass-after-draw":
        this.handlePassAfterDraw(playerId);
        break;
      case "uno":
        this.handleUnoCall(playerId);
        break;
      case "catch-uno":
        this.handleCatchUno(playerId, payload.targetId as string);
        break;
    }
  }

  handlePlayCard(playerId: string, payload: Record<string, unknown>) {
    if (this.status !== "playing") return;
    if (this.getCurrentPlayerId() !== playerId) return;

    const player = this.unoPlayers.get(playerId);
    if (!player) return;

    const cardIndex = payload.cardIndex as number;
    if (cardIndex < 0 || cardIndex >= player.hand.length) return;

    const card = player.hand[cardIndex];
    const topCard = this.getTopCard();

    // Check if playing the drawn card
    if (this.drawnPlayerId === playerId && this.drawnCard) {
      // Can only play the drawn card
      const drawnIdx = player.hand.length - 1; // drawn card is always last
      if (cardIndex !== drawnIdx) return;
    }

    if (!this.canPlayCard(card, topCard)) return;

    // For wild cards, require a chosen color
    if (card.type === "wild") {
      const chosenColor = payload.chosenColor as CardColor | undefined;
      if (!chosenColor || !["rouge", "bleu", "vert", "jaune"].includes(chosenColor)) return;
      card.chosenColor = chosenColor;
    }

    // Remove card from hand and add to discard
    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);

    this.drawnCard = null;
    this.drawnPlayerId = null;

    // Check for UNO situation (player now has 1 card)
    if (player.hand.length === 1) {
      this.startUnoWindow(playerId);
    } else {
      player.mustCallUno = false;
      player.calledUno = false;
    }

    // Check for win
    if (player.hand.length === 0) {
      this.handleWin(playerId);
      return;
    }

    // Apply card effects
    this.applyCardEffect(card);

    this.startTurnTimer();
    this.broadcastPersonalizedState();
  }

  applyCardEffect(card: UnoCard) {
    if (card.type === "action") {
      switch (card.action) {
        case "plus2": {
          // Next player draws 2 and loses turn
          this.advanceTurn();
          const nextId = this.getCurrentPlayerId();
          const nextPlayer = this.unoPlayers.get(nextId);
          if (nextPlayer) {
            nextPlayer.hand.push(...this.drawCards(2));
          }
          // Skip again (they lose their turn)
          this.advanceTurn();
          break;
        }
        case "passe": {
          // Skip next player
          this.advanceTurn();
          this.advanceTurn();
          break;
        }
        case "inverse": {
          // Reverse direction
          this.direction = this.direction === 1 ? -1 : 1;
          // In 2-player, reverse acts like skip
          if (this.turnOrder.length === 2) {
            this.advanceTurn();
          } else {
            this.advanceTurn();
          }
          break;
        }
      }
    } else if (card.type === "wild") {
      if (card.wild === "plus4") {
        // Next player draws 4 and loses turn
        this.advanceTurn();
        const nextId = this.getCurrentPlayerId();
        const nextPlayer = this.unoPlayers.get(nextId);
        if (nextPlayer) {
          nextPlayer.hand.push(...this.drawCards(4));
        }
        // Skip again
        this.advanceTurn();
      } else {
        // Regular joker: just advance
        this.advanceTurn();
      }
    } else {
      // Number card: advance normally
      this.advanceTurn();
    }
  }

  handleDraw(playerId: string) {
    if (this.status !== "playing") return;
    if (this.getCurrentPlayerId() !== playerId) return;
    if (this.drawnPlayerId === playerId) return; // already drew this turn

    const player = this.unoPlayers.get(playerId);
    if (!player) return;

    const drawn = this.drawCards(1);
    if (drawn.length === 0) return;

    player.hand.push(...drawn);
    this.drawnCard = drawn[0];
    this.drawnPlayerId = playerId;

    // Check if drawn card can be played
    const topCard = this.getTopCard();
    const canPlayDrawn = this.canPlayCard(drawn[0], topCard);

    if (canPlayDrawn) {
      // Send personalized state — player can now play or pass
      this.broadcastPersonalizedState();
    } else {
      // Auto-pass: card can't be played
      this.drawnCard = null;
      this.drawnPlayerId = null;
      this.advanceTurn();
      this.startTurnTimer();
      this.broadcastPersonalizedState();
    }
  }

  handlePassAfterDraw(playerId: string) {
    if (this.status !== "playing") return;
    if (this.getCurrentPlayerId() !== playerId) return;
    if (this.drawnPlayerId !== playerId) return;

    this.drawnCard = null;
    this.drawnPlayerId = null;
    this.advanceTurn();
    this.startTurnTimer();
    this.broadcastPersonalizedState();
  }

  handleUnoCall(playerId: string) {
    const player = this.unoPlayers.get(playerId);
    if (!player) return;

    if (player.hand.length === 1 && player.mustCallUno) {
      player.calledUno = true;
      player.mustCallUno = false;

      // Clear the UNO timer
      const timer = this.unoTimers.get(playerId);
      if (timer) {
        clearTimeout(timer);
        this.unoTimers.delete(playerId);
      }

      // Notify all players
      this.broadcast({
        type: "game-update",
        payload: {
          unoEvent: { playerId, playerName: player.name, type: "called" },
        },
      });
    }
  }

  handleCatchUno(catcherId: string, targetId: string) {
    if (!targetId) return;
    const target = this.unoPlayers.get(targetId);
    if (!target) return;

    // Target must have 1 card, must have mustCallUno=true, and hasn't called it
    if (target.hand.length !== 1 || !target.mustCallUno || target.calledUno) return;

    // Penalty: draw 2 cards
    target.hand.push(...this.drawCards(PENALTY_DRAW));
    target.mustCallUno = false;

    // Clear timer
    const timer = this.unoTimers.get(targetId);
    if (timer) {
      clearTimeout(timer);
      this.unoTimers.delete(targetId);
    }

    const catcher = this.unoPlayers.get(catcherId);
    this.broadcast({
      type: "game-update",
      payload: {
        unoEvent: {
          playerId: targetId,
          playerName: target.name,
          catcherName: catcher?.name ?? "?",
          type: "caught",
        },
      },
    });

    this.broadcastPersonalizedState();
  }

  // ── Win condition ────────────────────────────────────────
  handleWin(winnerId: string) {
    this.stopTurnTimer();
    this.clearUnoTimers();
    this.status = "game-over";

    // Calculate scores: cards left in other players' hands
    const winner = this.unoPlayers.get(winnerId)!;
    let winnerScore = 0;

    const rankings: GameRanking[] = [];

    for (const player of this.unoPlayers.values()) {
      if (player.id === winnerId) continue;
      let handScore = 0;
      for (const card of player.hand) {
        if (card.type === "number") {
          handScore += card.value;
        } else if (card.type === "action") {
          handScore += 20;
        } else {
          handScore += 50;
        }
      }
      winnerScore += handScore;
    }

    // Winner first
    rankings.push({
      playerId: winnerId,
      playerName: winner.name,
      rank: 1,
      score: winnerScore,
    });

    // Other players ranked by fewest cards (ascending hand value)
    const others = Array.from(this.unoPlayers.values())
      .filter((p) => p.id !== winnerId)
      .map((p) => {
        let handValue = 0;
        for (const card of p.hand) {
          if (card.type === "number") handValue += card.value;
          else if (card.type === "action") handValue += 20;
          else handValue += 50;
        }
        return { id: p.id, name: p.name, handValue, cardCount: p.hand.length };
      })
      .sort((a, b) => a.handValue - b.handValue);

    others.forEach((p, i) => {
      rankings.push({
        playerId: p.id,
        playerName: p.name,
        rank: i + 2,
        score: Math.max(0, winnerScore - p.handValue),
      });
    });

    // Broadcast final state before game-over
    this.broadcastPersonalizedState();

    // Small delay then end
    setTimeout(() => {
      this.endGame(rankings);
    }, 1500);
  }

  // ── State serialization (per-player) ─────────────────────
  broadcastPersonalizedState() {
    for (const [playerId, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(playerId),
      });
    }
  }

  getStateForPlayer(playerId: string): Record<string, unknown> {
    const me = this.unoPlayers.get(playerId);
    const topCard = this.getTopCard();
    const currentPlayerId = this.getCurrentPlayerId();
    const isMyTurn = currentPlayerId === playerId;

    // Calculate which cards in my hand are playable
    const myHand = me?.hand.map((card, index) => {
      const playable =
        isMyTurn &&
        this.status === "playing" &&
        this.canPlayCard(card, topCard) &&
        // If we drew a card, only that card is playable
        (this.drawnPlayerId !== playerId || index === (me?.hand.length ?? 0) - 1);

      return { ...card, playable };
    }) ?? [];

    // Other players: only card count, not cards
    const otherPlayers = this.turnOrder.map((id) => {
      const p = this.unoPlayers.get(id);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        cardCount: p.hand.length,
        isCurrentTurn: id === currentPlayerId,
        calledUno: p.calledUno,
        mustCallUno: p.mustCallUno && !p.calledUno && p.hand.length === 1,
      };
    }).filter(Boolean);

    return {
      status: this.status,
      myHand,
      myId: playerId,
      otherPlayers,
      topCard: this.serializeTopCard(topCard),
      currentPlayerId,
      direction: this.direction,
      timeLeft: this.timeLeft,
      deckCount: this.deck.length,
      isMyTurn,
      canDraw: isMyTurn && this.status === "playing" && this.drawnPlayerId !== playerId,
      drewCard: this.drawnPlayerId === playerId,
      canPassAfterDraw: this.drawnPlayerId === playerId,
      turnOrder: this.turnOrder,
    };
  }

  serializeTopCard(card: UnoCard): Record<string, unknown> {
    if (card.type === "number") {
      return { type: "number", color: card.color, value: card.value };
    } else if (card.type === "action") {
      return { type: "action", color: card.color, action: card.action };
    } else {
      return {
        type: "wild",
        wild: card.wild,
        chosenColor: card.chosenColor,
      };
    }
  }

  // getState() is used for initial join — returns a generic waiting state
  getState(): Record<string, unknown> {
    if (!this.started) {
      return { status: "waiting" };
    }
    // For initial join, return minimal info — personalized state is sent separately
    return { status: this.status };
  }

  // ── Helpers ──────────────────────────────────────────────
  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  clearUnoTimers() {
    for (const timer of this.unoTimers.values()) {
      clearTimeout(timer);
    }
    this.unoTimers.clear();
  }

  cleanup() {
    this.stopTurnTimer();
    this.clearUnoTimers();
  }
}
