import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ── Card Types ──────────────────────────────────────────
type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Value = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

interface Card {
  suit: Suit;
  value: Value;
}

interface HandResult {
  rank: number; // 1 = Royal Flush ... 10 = High Card
  name: string;
  tiebreakers: number[]; // for comparing same-rank hands
  cards: Card[]; // the 5-card combo used
}

// ── Constants ───────────────────────────────────────────
const STARTING_CHIPS = 1000;
const MAX_HANDS = 20;
const ACTION_TIMEOUT = 30_000; // 30s per action
const SHOWDOWN_DISPLAY = 5_000;
const BLIND_LEVELS: [number, number][] = [
  [10, 20],
  [20, 40],
  [30, 60],
  [50, 100],
];
const HANDS_PER_BLIND_LEVEL = 5;

type PokerPhase =
  | "waiting"
  | "deal"
  | "pre-flop"
  | "flop"
  | "turn"
  | "river"
  | "showdown"
  | "hand-end"
  | "game-over";

type PlayerAction = "fold" | "check" | "call" | "raise" | "all-in";

interface PokerPlayer {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  currentBet: number;
  totalBetThisHand: number;
  folded: boolean;
  allIn: boolean;
  eliminated: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  lastAction?: string;
  seatIndex: number;
}

interface SidePot {
  amount: number;
  eligible: string[]; // player ids
}

// ── Hand Evaluator ──────────────────────────────────────

function evaluateHand(sevenCards: Card[]): HandResult {
  // Generate all 21 combinations of 5 from 7
  const combos = combinations(sevenCards, 5);
  let best: HandResult | null = null;

  for (const five of combos) {
    const result = evaluate5(five);
    if (!best || compareHands(result, best) > 0) {
      best = result;
    }
  }

  return best!;
}

function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const combo: T[] = [];

  function backtrack(start: number) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      backtrack(i + 1);
      combo.pop();
    }
  }

  backtrack(0);
  return result;
}

function evaluate5(cards: Card[]): HandResult {
  const values = cards.map((c) => c.value).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight (including Ace-low: A,2,3,4,5)
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;

  if (uniqueValues.length === 5) {
    if (uniqueValues[0] - uniqueValues[4] === 4) {
      isStraight = true;
      straightHigh = uniqueValues[0];
    }
    // Ace-low straight: A,5,4,3,2
    if (
      uniqueValues[0] === 14 &&
      uniqueValues[1] === 5 &&
      uniqueValues[2] === 4 &&
      uniqueValues[3] === 3 &&
      uniqueValues[4] === 2
    ) {
      isStraight = true;
      straightHigh = 5; // 5-high straight
    }
  }

  // Count occurrences
  const counts: Map<number, number> = new Map();
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1);
  }

  const groups = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // sort by count desc
    return b[0] - a[0]; // then by value desc
  });

  const pattern = groups.map((g) => g[1]).join(",");

  // Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return { rank: 1, name: "Quinte Flush Royale", tiebreakers: [14], cards };
  }

  // Straight Flush
  if (isFlush && isStraight) {
    return {
      rank: 2,
      name: "Quinte Flush",
      tiebreakers: [straightHigh],
      cards,
    };
  }

  // Four of a Kind
  if (pattern === "4,1") {
    return {
      rank: 3,
      name: "Carr\u00e9",
      tiebreakers: [groups[0][0], groups[1][0]],
      cards,
    };
  }

  // Full House
  if (pattern === "3,2") {
    return {
      rank: 4,
      name: "Full",
      tiebreakers: [groups[0][0], groups[1][0]],
      cards,
    };
  }

  // Flush
  if (isFlush) {
    return { rank: 5, name: "Couleur", tiebreakers: values, cards };
  }

  // Straight
  if (isStraight) {
    return { rank: 6, name: "Suite", tiebreakers: [straightHigh], cards };
  }

  // Three of a Kind
  if (pattern === "3,1,1") {
    return {
      rank: 7,
      name: "Brelan",
      tiebreakers: [groups[0][0], groups[1][0], groups[2][0]],
      cards,
    };
  }

  // Two Pair
  if (pattern === "2,2,1") {
    const highPair = Math.max(groups[0][0], groups[1][0]);
    const lowPair = Math.min(groups[0][0], groups[1][0]);
    return {
      rank: 8,
      name: "Double Paire",
      tiebreakers: [highPair, lowPair, groups[2][0]],
      cards,
    };
  }

  // One Pair
  if (pattern === "2,1,1,1") {
    return {
      rank: 9,
      name: "Paire",
      tiebreakers: [groups[0][0], groups[1][0], groups[2][0], groups[3][0]],
      cards,
    };
  }

  // High Card
  return { rank: 10, name: "Carte Haute", tiebreakers: values, cards };
}

/** Positive if a > b, negative if a < b, 0 if tie */
function compareHands(a: HandResult, b: HandResult): number {
  // Lower rank number = better hand
  if (a.rank !== b.rank) return b.rank - a.rank;
  // Same rank: compare tiebreakers
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const av = a.tiebreakers[i] ?? 0;
    const bv = b.tiebreakers[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

// ── Card Utilities ──────────────────────────────────────

function createDeck(): Card[] {
  const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let value = 2; value <= 14; value++) {
      deck.push({ suit, value: value as Value });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function cardLabel(card: Card): string {
  const valueNames: Record<number, string> = {
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    11: "V",
    12: "D",
    13: "R",
    14: "A",
  };
  const suitSymbols: Record<Suit, string> = {
    spades: "\u2660",
    hearts: "\u2665",
    diamonds: "\u2666",
    clubs: "\u2663",
  };
  return `${valueNames[card.value]}${suitSymbols[card.suit]}`;
}

function handLabel(result: HandResult): string {
  return `${result.name} (${result.cards.map(cardLabel).join(", ")})`;
}

// ── Main Poker Game ─────────────────────────────────────

export class PokerGame extends BaseGame {
  pokerPlayers: Map<string, PokerPlayer> = new Map();
  seatOrder: string[] = []; // player ids in seat order
  deck: Card[] = [];
  communityCards: Card[] = [];
  pot = 0;
  sidePots: SidePot[] = [];
  phase: PokerPhase = "waiting";
  handNumber = 0;
  dealerIndex = -1; // index into seatOrder
  currentPlayerIndex = -1; // index into seatOrder
  currentBetLevel = 0; // the current highest bet on table
  minRaise = 0;
  lastRaiserIndex = -1;
  actionTimer: ReturnType<typeof setTimeout> | null = null;
  phaseTimer: ReturnType<typeof setTimeout> | null = null;
  actionTimeLeft = 30;
  actionCountdown: ReturnType<typeof setInterval> | null = null;

  // Showdown reveal data
  showdownResults: {
    playerId: string;
    playerName: string;
    holeCards: Card[];
    hand: HandResult;
    won: boolean;
    chipsWon: number;
  }[] = [];

  start() {
    this.started = true;

    let seatIdx = 0;
    for (const [id, player] of this.players) {
      this.pokerPlayers.set(id, {
        id,
        name: player.name,
        chips: STARTING_CHIPS,
        holeCards: [],
        currentBet: 0,
        totalBetThisHand: 0,
        folded: false,
        allIn: false,
        eliminated: false,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        seatIndex: seatIdx,
      });
      this.seatOrder.push(id);
      seatIdx++;
    }

    this.startNewHand();
  }

  // ── Blind helpers ───────────────────────────────────
  getBlinds(): [number, number] {
    const levelIndex = Math.min(
      Math.floor(this.handNumber / HANDS_PER_BLIND_LEVEL),
      BLIND_LEVELS.length - 1
    );
    return BLIND_LEVELS[levelIndex];
  }

  // ── Active players (not folded, not eliminated) ─────
  getActivePlayers(): PokerPlayer[] {
    return this.seatOrder
      .map((id) => this.pokerPlayers.get(id)!)
      .filter((p) => !p.folded && !p.eliminated);
  }

  getActivePlayerIds(): string[] {
    return this.getActivePlayers().map((p) => p.id);
  }

  getPlayersInHand(): PokerPlayer[] {
    return this.seatOrder
      .map((id) => this.pokerPlayers.get(id)!)
      .filter((p) => !p.eliminated);
  }

  getNonEliminatedIds(): string[] {
    return this.seatOrder.filter(
      (id) => !this.pokerPlayers.get(id)!.eliminated
    );
  }

  // ── Next seat that is not eliminated ────────────────
  nextSeat(fromIndex: number): number {
    const count = this.seatOrder.length;
    let idx = (fromIndex + 1) % count;
    let safety = 0;
    while (
      this.pokerPlayers.get(this.seatOrder[idx])!.eliminated &&
      safety < count
    ) {
      idx = (idx + 1) % count;
      safety++;
    }
    return idx;
  }

  // ── Next active (not folded, not eliminated, not all-in) seat ──
  nextActiveSeat(fromIndex: number): number {
    const count = this.seatOrder.length;
    let idx = (fromIndex + 1) % count;
    let safety = 0;
    while (safety < count) {
      const p = this.pokerPlayers.get(this.seatOrder[idx])!;
      if (!p.eliminated && !p.folded && !p.allIn) return idx;
      idx = (idx + 1) % count;
      safety++;
    }
    return -1; // no active player found
  }

  // ── Start New Hand ──────────────────────────────────
  startNewHand() {
    this.handNumber++;

    // Check game-ending conditions
    const alivePlayers = this.getNonEliminatedIds();
    if (alivePlayers.length <= 1 || this.handNumber > MAX_HANDS) {
      this.endPoker();
      return;
    }

    // Reset hand state
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.currentBetLevel = 0;
    this.minRaise = 0;
    this.lastRaiserIndex = -1;
    this.showdownResults = [];

    // Reset player hand state
    for (const p of this.pokerPlayers.values()) {
      p.holeCards = [];
      p.currentBet = 0;
      p.totalBetThisHand = 0;
      p.folded = false;
      p.allIn = false;
      p.isDealer = false;
      p.isSmallBlind = false;
      p.isBigBlind = false;
      p.lastAction = undefined;
    }

    // Rotate dealer
    if (this.dealerIndex === -1) {
      // First hand: random dealer among alive
      const aliveIndices = this.seatOrder
        .map((id, i) => ({ id, i }))
        .filter(({ id }) => !this.pokerPlayers.get(id)!.eliminated);
      this.dealerIndex =
        aliveIndices[Math.floor(Math.random() * aliveIndices.length)].i;
    } else {
      this.dealerIndex = this.nextSeat(this.dealerIndex);
    }

    const dealerPlayer = this.pokerPlayers.get(
      this.seatOrder[this.dealerIndex]
    )!;
    dealerPlayer.isDealer = true;

    // Assign blinds
    const [smallBlind, bigBlind] = this.getBlinds();
    const aliveCount = alivePlayers.length;

    let sbIndex: number;
    let bbIndex: number;

    if (aliveCount === 2) {
      // Heads up: dealer is small blind
      sbIndex = this.dealerIndex;
      bbIndex = this.nextSeat(this.dealerIndex);
    } else {
      sbIndex = this.nextSeat(this.dealerIndex);
      bbIndex = this.nextSeat(sbIndex);
    }

    const sbPlayer = this.pokerPlayers.get(this.seatOrder[sbIndex])!;
    const bbPlayer = this.pokerPlayers.get(this.seatOrder[bbIndex])!;

    sbPlayer.isSmallBlind = true;
    bbPlayer.isBigBlind = true;

    // Post blinds
    this.postBlind(sbPlayer, smallBlind);
    this.postBlind(bbPlayer, bigBlind);

    this.currentBetLevel = bigBlind;
    this.minRaise = bigBlind;

    // Shuffle and deal
    this.deck = shuffleDeck(createDeck());
    for (const id of alivePlayers) {
      const player = this.pokerPlayers.get(id)!;
      player.holeCards = [this.deck.pop()!, this.deck.pop()!];
    }

    this.phase = "pre-flop";

    // First to act: left of big blind (or small blind in heads-up)
    if (aliveCount === 2) {
      this.currentPlayerIndex = sbIndex;
    } else {
      this.currentPlayerIndex = this.nextActiveSeat(bbIndex);
    }

    this.lastRaiserIndex = bbIndex; // BB is the initial "raiser"

    this.broadcastPersonalizedState();
    this.startActionTimer();
  }

  postBlind(player: PokerPlayer, amount: number) {
    const actual = Math.min(amount, player.chips);
    player.chips -= actual;
    player.currentBet = actual;
    player.totalBetThisHand += actual;
    this.pot += actual;
    if (player.chips === 0) {
      player.allIn = true;
    }
  }

  // ── Action Timer ────────────────────────────────────
  startActionTimer() {
    this.clearActionTimer();
    this.actionTimeLeft = 30;

    this.actionCountdown = setInterval(() => {
      this.actionTimeLeft--;
      if (this.actionTimeLeft <= 0) {
        // done — the actionTimer handles the timeout
      }
      // We send updates when state is requested via getState
    }, 1000);

    this.actionTimer = setTimeout(() => {
      // Auto-fold on timeout
      this.handleAction(
        this.seatOrder[this.currentPlayerIndex],
        "fold",
        0
      );
    }, ACTION_TIMEOUT);
  }

  clearActionTimer() {
    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }
    if (this.actionCountdown) {
      clearInterval(this.actionCountdown);
      this.actionCountdown = null;
    }
  }

  clearPhaseTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  // ── Message Handler ─────────────────────────────────
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const senderPlayer = this.findPlayerByConnection(sender.id);
    if (!senderPlayer) return;

    const action = payload.action as string;

    if (
      this.phase !== "pre-flop" &&
      this.phase !== "flop" &&
      this.phase !== "turn" &&
      this.phase !== "river"
    ) {
      return; // Not in a betting phase
    }

    // Ensure it's this player's turn
    if (this.seatOrder[this.currentPlayerIndex] !== senderPlayer.id) return;

    const pokerP = this.pokerPlayers.get(senderPlayer.id)!;
    if (pokerP.folded || pokerP.allIn || pokerP.eliminated) return;

    switch (action) {
      case "fold":
        this.handleAction(senderPlayer.id, "fold", 0);
        break;
      case "check":
        this.handleAction(senderPlayer.id, "check", 0);
        break;
      case "call":
        this.handleAction(senderPlayer.id, "call", 0);
        break;
      case "raise": {
        const amount = Number(payload.amount) || 0;
        this.handleAction(senderPlayer.id, "raise", amount);
        break;
      }
      case "all-in":
        this.handleAction(senderPlayer.id, "all-in", 0);
        break;
    }
  }

  // ── Handle Player Action ────────────────────────────
  handleAction(playerId: string, action: PlayerAction, amount: number) {
    const player = this.pokerPlayers.get(playerId)!;

    switch (action) {
      case "fold":
        player.folded = true;
        player.lastAction = "Se couche";
        break;

      case "check":
        if (player.currentBet < this.currentBetLevel) {
          // Can't check — must call or fold
          return;
        }
        player.lastAction = "Parole";
        break;

      case "call": {
        const toCall = this.currentBetLevel - player.currentBet;
        if (toCall <= 0) {
          // Nothing to call, treat as check
          player.lastAction = "Parole";
          break;
        }
        const actualCall = Math.min(toCall, player.chips);
        player.chips -= actualCall;
        player.currentBet += actualCall;
        player.totalBetThisHand += actualCall;
        this.pot += actualCall;
        if (player.chips === 0) player.allIn = true;
        player.lastAction = player.allIn ? "Tapis" : "Suit";
        break;
      }

      case "raise": {
        const toCall = this.currentBetLevel - player.currentBet;
        const raiseAbove = amount - this.currentBetLevel;

        // Minimum raise is the last raise amount (or big blind)
        if (raiseAbove < this.minRaise && amount < player.chips + player.currentBet) {
          // Invalid raise (unless going all-in)
          return;
        }

        const totalNeeded = amount - player.currentBet;
        if (totalNeeded > player.chips) {
          // Not enough chips — treat as all-in
          this.handleAction(playerId, "all-in", 0);
          return;
        }

        player.chips -= totalNeeded;
        this.pot += totalNeeded;
        this.minRaise = Math.max(this.minRaise, amount - this.currentBetLevel);
        this.currentBetLevel = amount;
        player.currentBet = amount;
        player.totalBetThisHand += totalNeeded;
        this.lastRaiserIndex = this.currentPlayerIndex;
        if (player.chips === 0) player.allIn = true;
        player.lastAction = player.allIn ? "Tapis" : `Relance ${amount}`;
        break;
      }

      case "all-in": {
        const allInAmount = player.chips;
        const newBet = player.currentBet + allInAmount;
        this.pot += allInAmount;
        player.totalBetThisHand += allInAmount;
        player.chips = 0;
        player.currentBet = newBet;
        player.allIn = true;
        if (newBet > this.currentBetLevel) {
          this.minRaise = Math.max(
            this.minRaise,
            newBet - this.currentBetLevel
          );
          this.currentBetLevel = newBet;
          this.lastRaiserIndex = this.currentPlayerIndex;
        }
        player.lastAction = "Tapis";
        break;
      }
    }

    this.clearActionTimer();

    // Check if only one player left (everyone else folded)
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      this.awardPotToLastStanding(activePlayers[0]);
      return;
    }

    // Move to next player
    this.advanceAction();
  }

  // ── Advance to Next Player or Phase ─────────────────
  advanceAction() {
    const nextIdx = this.nextActiveSeat(this.currentPlayerIndex);

    // If no active player (all folded/all-in), go to next phase
    if (nextIdx === -1) {
      this.advancePhase();
      return;
    }

    // Check if betting round is complete:
    // The round completes when we've come back to the last raiser
    // (or everyone has acted at least once when there's no raise)
    if (nextIdx === this.lastRaiserIndex) {
      // Everyone has matched the current bet or folded
      this.advancePhase();
      return;
    }

    // Check if all non-folded players are all-in (except possibly one)
    const canAct = this.seatOrder.filter((id) => {
      const p = this.pokerPlayers.get(id)!;
      return !p.folded && !p.allIn && !p.eliminated;
    });

    if (canAct.length === 0) {
      // Everyone is all-in or folded: deal remaining community cards
      this.advancePhase();
      return;
    }

    if (canAct.length === 1) {
      // Only one player can act — check if they've already matched
      const solo = this.pokerPlayers.get(canAct[0])!;
      if (solo.currentBet >= this.currentBetLevel) {
        this.advancePhase();
        return;
      }
    }

    this.currentPlayerIndex = nextIdx;
    this.broadcastPersonalizedState();
    this.startActionTimer();
  }

  // ── Advance to Next Phase ───────────────────────────
  advancePhase() {
    // Reset current bets for next round
    for (const p of this.pokerPlayers.values()) {
      p.currentBet = 0;
    }
    this.currentBetLevel = 0;
    this.minRaise = this.getBlinds()[1]; // min raise resets to big blind

    // Check if we should fast-forward (all-in scenario)
    const canAct = this.seatOrder.filter((id) => {
      const p = this.pokerPlayers.get(id)!;
      return !p.folded && !p.allIn && !p.eliminated;
    });

    switch (this.phase) {
      case "pre-flop":
        this.phase = "flop";
        this.deck.pop(); // burn
        this.communityCards.push(
          this.deck.pop()!,
          this.deck.pop()!,
          this.deck.pop()!
        );
        break;
      case "flop":
        this.phase = "turn";
        this.deck.pop(); // burn
        this.communityCards.push(this.deck.pop()!);
        break;
      case "turn":
        this.phase = "river";
        this.deck.pop(); // burn
        this.communityCards.push(this.deck.pop()!);
        break;
      case "river":
        this.resolveShowdown();
        return;
    }

    // If fewer than 2 players can still act, fast-forward
    if (canAct.length < 2) {
      this.broadcastPersonalizedState();
      // Short delay then advance again
      this.phaseTimer = setTimeout(() => {
        this.advancePhase();
      }, 800);
      return;
    }

    // First to act after flop is left of dealer
    this.currentPlayerIndex = this.nextActiveSeat(this.dealerIndex);
    if (this.currentPlayerIndex === -1) {
      // No one can act — fast forward
      this.broadcastPersonalizedState();
      this.phaseTimer = setTimeout(() => {
        this.advancePhase();
      }, 800);
      return;
    }

    this.lastRaiserIndex = this.currentPlayerIndex;
    this.broadcastPersonalizedState();
    this.startActionTimer();
  }

  // ── Award Pot to Last Standing ──────────────────────
  awardPotToLastStanding(winner: PokerPlayer) {
    winner.chips += this.pot;
    this.showdownResults = [
      {
        playerId: winner.id,
        playerName: winner.name,
        holeCards: [],
        hand: { rank: 0, name: "Dernier debout", tiebreakers: [], cards: [] },
        won: true,
        chipsWon: this.pot,
      },
    ];

    this.phase = "hand-end";
    this.pot = 0;
    this.broadcastPersonalizedState();

    this.eliminateBrokePlayers();

    this.phaseTimer = setTimeout(() => {
      this.startNewHand();
    }, SHOWDOWN_DISPLAY);
  }

  // ── Resolve Showdown ────────────────────────────────
  resolveShowdown() {
    this.phase = "showdown";
    this.clearActionTimer();

    const activePlayers = this.getActivePlayers();

    // Evaluate all hands
    const evaluations: {
      playerId: string;
      player: PokerPlayer;
      hand: HandResult;
    }[] = [];

    for (const p of activePlayers) {
      const allCards = [...p.holeCards, ...this.communityCards];
      const hand = evaluateHand(allCards);
      evaluations.push({ playerId: p.id, player: p, hand });
    }

    // Calculate side pots
    this.calculateSidePots();

    // Distribute pots
    const winnings: Map<string, number> = new Map();
    for (const p of this.pokerPlayers.values()) {
      winnings.set(p.id, 0);
    }

    if (this.sidePots.length === 0) {
      // Simple case: single pot
      const bestHand = evaluations.reduce((best, curr) =>
        compareHands(curr.hand, best.hand) > 0 ? curr : best
      );

      // Check for ties
      const winners = evaluations.filter(
        (e) => compareHands(e.hand, bestHand.hand) === 0
      );
      const share = Math.floor(this.pot / winners.length);
      for (const w of winners) {
        w.player.chips += share;
        winnings.set(w.playerId, (winnings.get(w.playerId) || 0) + share);
      }
      // Remainder goes to first winner (closest to dealer)
      const remainder = this.pot - share * winners.length;
      if (remainder > 0) {
        winners[0].player.chips += remainder;
        winnings.set(
          winners[0].playerId,
          (winnings.get(winners[0].playerId) || 0) + remainder
        );
      }
    } else {
      // Distribute each side pot
      for (const sp of this.sidePots) {
        const eligible = evaluations.filter((e) =>
          sp.eligible.includes(e.playerId)
        );
        if (eligible.length === 0) continue;

        const bestInPot = eligible.reduce((best, curr) =>
          compareHands(curr.hand, best.hand) > 0 ? curr : best
        );
        const potWinners = eligible.filter(
          (e) => compareHands(e.hand, bestInPot.hand) === 0
        );
        const share = Math.floor(sp.amount / potWinners.length);
        for (const w of potWinners) {
          w.player.chips += share;
          winnings.set(w.playerId, (winnings.get(w.playerId) || 0) + share);
        }
        const remainder = sp.amount - share * potWinners.length;
        if (remainder > 0) {
          potWinners[0].player.chips += remainder;
          winnings.set(
            potWinners[0].playerId,
            (winnings.get(potWinners[0].playerId) || 0) + remainder
          );
        }
      }
    }

    // Build showdown results
    this.showdownResults = evaluations
      .sort((a, b) => compareHands(b.hand, a.hand))
      .map((e) => ({
        playerId: e.playerId,
        playerName: e.player.name,
        holeCards: e.player.holeCards,
        hand: e.hand,
        won: (winnings.get(e.playerId) || 0) > 0,
        chipsWon: winnings.get(e.playerId) || 0,
      }));

    this.pot = 0;
    this.broadcastPersonalizedState();

    this.eliminateBrokePlayers();

    this.phaseTimer = setTimeout(() => {
      this.startNewHand();
    }, SHOWDOWN_DISPLAY);
  }

  calculateSidePots() {
    const nonFolded = this.seatOrder
      .map((id) => this.pokerPlayers.get(id)!)
      .filter((p) => !p.folded && !p.eliminated);

    // Sort by total bet this hand
    const sorted = [...nonFolded].sort(
      (a, b) => a.totalBetThisHand - b.totalBetThisHand
    );

    this.sidePots = [];
    let prevBet = 0;

    for (let i = 0; i < sorted.length; i++) {
      const bet = sorted[i].totalBetThisHand;
      if (bet > prevBet) {
        const contribution = bet - prevBet;
        // Everyone who bet at least this much contributes
        const allPlayers = this.seatOrder
          .map((id) => this.pokerPlayers.get(id)!)
          .filter((p) => !p.eliminated);
        let potAmount = 0;
        for (const p of allPlayers) {
          potAmount += Math.min(contribution, Math.max(0, p.totalBetThisHand - prevBet));
        }
        const eligible = nonFolded
          .filter((p) => p.totalBetThisHand >= bet)
          .map((p) => p.id);
        this.sidePots.push({ amount: potAmount, eligible });
        prevBet = bet;
      }
    }
  }

  eliminateBrokePlayers() {
    for (const p of this.pokerPlayers.values()) {
      if (p.chips <= 0 && !p.eliminated) {
        p.eliminated = true;
      }
    }
  }

  // ── End Poker Game ──────────────────────────────────
  endPoker() {
    this.clearActionTimer();
    this.clearPhaseTimer();
    this.phase = "game-over";

    const players = Array.from(this.pokerPlayers.values());
    players.sort((a, b) => b.chips - a.chips);

    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.chips,
    }));

    this.broadcastPersonalizedState();
    this.endGame(rankings);
  }

  // ── Helper ──────────────────────────────────────────
  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  // ── Get Available Actions for a Player ──────────────
  getAvailableActions(playerId: string): {
    canFold: boolean;
    canCheck: boolean;
    canCall: boolean;
    callAmount: number;
    canRaise: boolean;
    minRaiseTotal: number;
    maxRaiseTotal: number;
    canAllIn: boolean;
  } {
    const player = this.pokerPlayers.get(playerId)!;
    const toCall = this.currentBetLevel - player.currentBet;

    return {
      canFold: true,
      canCheck: toCall <= 0,
      canCall: toCall > 0 && player.chips >= toCall,
      callAmount: Math.min(toCall, player.chips),
      canRaise:
        player.chips > toCall + this.minRaise &&
        toCall + this.minRaise <= player.chips,
      minRaiseTotal: this.currentBetLevel + this.minRaise,
      maxRaiseTotal: player.currentBet + player.chips,
      canAllIn: player.chips > 0,
    };
  }

  // ── State Broadcasting (Personalized) ───────────────
  broadcastPersonalizedState() {
    for (const [playerId, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(playerId),
      });
    }
  }

  getStateForPlayer(viewerId: string): Record<string, unknown> {
    const isShowdown =
      this.phase === "showdown" || this.phase === "hand-end";
    const currentPlayerId =
      this.currentPlayerIndex >= 0
        ? this.seatOrder[this.currentPlayerIndex]
        : null;

    const players = this.seatOrder.map((id) => {
      const p = this.pokerPlayers.get(id)!;
      const isViewer = id === viewerId;
      const showCards =
        isViewer ||
        (isShowdown &&
          !p.folded &&
          this.showdownResults.some((r) => r.playerId === id));

      return {
        id: p.id,
        name: p.name,
        chips: p.chips,
        holeCards: showCards ? p.holeCards : (p.holeCards.length > 0 ? [null, null] : []),
        currentBet: p.currentBet,
        folded: p.folded,
        allIn: p.allIn,
        eliminated: p.eliminated,
        isDealer: p.isDealer,
        isSmallBlind: p.isSmallBlind,
        isBigBlind: p.isBigBlind,
        lastAction: p.lastAction,
        seatIndex: p.seatIndex,
        isCurrentPlayer: id === currentPlayerId,
      };
    });

    const result: Record<string, unknown> = {
      phase: this.phase,
      handNumber: this.handNumber,
      maxHands: MAX_HANDS,
      communityCards: this.communityCards,
      pot: this.pot,
      currentBetLevel: this.currentBetLevel,
      players,
      currentPlayerId,
      blinds: this.getBlinds(),
      timeLeft: this.actionTimeLeft,
      showdownResults: isShowdown ? this.showdownResults : [],
    };

    // Only add available actions for the current player
    if (currentPlayerId === viewerId && !isShowdown) {
      result.availableActions = this.getAvailableActions(viewerId);
    }

    return result;
  }

  getState(): Record<string, unknown> {
    // Generic state (used for late-joining players before they get personalized state)
    return {
      phase: this.phase,
      handNumber: this.handNumber,
      maxHands: MAX_HANDS,
      communityCards: this.communityCards,
      pot: this.pot,
      currentBetLevel: this.currentBetLevel,
      players: this.seatOrder.map((id) => {
        const p = this.pokerPlayers.get(id)!;
        return {
          id: p.id,
          name: p.name,
          chips: p.chips,
          holeCards: [],
          currentBet: p.currentBet,
          folded: p.folded,
          allIn: p.allIn,
          eliminated: p.eliminated,
          isDealer: p.isDealer,
          isSmallBlind: p.isSmallBlind,
          isBigBlind: p.isBigBlind,
          lastAction: p.lastAction,
          seatIndex: p.seatIndex,
          isCurrentPlayer: false,
        };
      }),
      currentPlayerId: null,
      blinds: this.getBlinds(),
      timeLeft: this.actionTimeLeft,
      showdownResults: [],
    };
  }

  cleanup() {
    this.clearActionTimer();
    this.clearPhaseTimer();
  }
}
