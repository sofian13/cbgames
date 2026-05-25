/**
 * La Contrée (Belote 2v2) — PartyKit server
 *
 * 32-card deck (7,8,9,10,V,D,R,A in 4 suits).
 * 4 players seated 0,1,2,3 with teams [0+2] vs [1+3].
 *
 * Phase 1 — Enchères :
 *  - Each player in turn either bids (80-160 step 10, OR Capot=250, OR Générale=500)
 *    in a suit (♠♥♦♣) — OR passes.
 *  - 3 consecutive passes after a bid → bidding ends, contract = last bid.
 *  - 4 passes from start → redeal.
 *  - Opponent of the bidder can "Coincher" (×2), original team can "Surcoincher" (×4).
 *
 * Phase 2 — Plis (8 tricks, 8 cards in hand) :
 *  - Lead trick = bidder's left (player after the dealer).
 *    For simplicity in this MVP: bidder starts the first trick.
 *  - Must follow suit; must overcut at trump if partner not winning; etc.
 *    MVP : only enforce "must follow suit if possible".
 *  - Trump points: V=20, 9=14, A=11, 10=10, R=4, D=3, 8/7=0.
 *  - Non-trump:      A=11, 10=10, R=4, D=3, V=2, 9=0, 8=0, 7=0.
 *  - "Belote-rebelote" : if you have R+D of trump, +20 pts at the end.
 *  - "Dix de der"      : team winning the last trick = +10 pts.
 *
 * Phase 3 — Score & target :
 *  - Bidding team must reach their bid; if not → opponents get all the points + bid.
 *  - Coinche ×2, Surcoinche ×4.
 *  - First team to reach `targetPoints` (default 1000) wins the match.
 */
import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "7" | "8" | "9" | "10" | "V" | "D" | "R" | "A";

interface Card { rank: Rank; suit: Suit; }

interface ContreePlayer {
  id: string;
  name: string;
  hand: Card[];
  team: 0 | 1; // 0 = team A (positions 0+2), 1 = team B (1+3)
  seatIndex: number; // 0..3
}

interface Bid {
  amount: number; // 80, 90, ..., 160, OR 250 (capot), 500 (generale)
  suit: Suit;
  bidder: string; // player id
  multiplier: 1 | 2 | 4; // contrée / coinche / surcoinche
}

const SUITS: Suit[] = ["♠","♥","♦","♣"];
const RANKS: Rank[] = ["7","8","9","10","V","D","R","A"];
const SUIT_LABEL: Record<Suit, string> = { "♠":"pique","♥":"cœur","♦":"carreau","♣":"trèfle" };

// Card values by context
function trumpValue(rank: Rank): number {
  return { V:20, 9:14, A:11, 10:10, R:4, D:3, 8:0, 7:0 }[rank];
}
function plainValue(rank: Rank): number {
  return { A:11, 10:10, R:4, D:3, V:2, 9:0, 8:0, 7:0 }[rank];
}
function trumpOrder(rank: Rank): number {
  return RANKS_TRUMP_ORDER.indexOf(rank);
}
function plainOrder(rank: Rank): number {
  return RANKS_PLAIN_ORDER.indexOf(rank);
}
const RANKS_TRUMP_ORDER: Rank[] = ["7","8","D","R","10","A","9","V"]; // low → high at trump
const RANKS_PLAIN_ORDER: Rank[] = ["7","8","9","V","D","R","10","A"]; // low → high off-trump

const TURN_TIME = 25;
const TARGET_DEFAULT = 1000;

export class ContreeGame extends BaseGame {
  contreePlayers: Map<string, ContreePlayer> = new Map();
  seatOrder: string[] = []; // index by seat 0..3
  phase: "waiting" | "bidding" | "playing" | "hand-over" | "match-over" = "waiting";
  dealer = 0; // seat index of dealer
  currentBidder = 0; // seat index in bidding
  currentBid: Bid | null = null;
  consecutivePasses = 0;
  passCount = 0; // total passes this bidding round
  currentTurn = 0; // seat index whose turn
  trick: { card: Card; seat: number }[] = [];
  trickLeadSuit: Suit | null = null;
  lastTrickWinnerSeat: number | null = null;
  bubbles: Record<string, { text: string; tone: "bid" | "pass" | "coincher" | "belote" }> = {};
  trumpSuit: Suit | null = null;
  pliCounts: [number, number] = [0, 0]; // tricks won by team A, B
  trickPoints: [number, number] = [0, 0]; // raw card points won this hand
  matchScore: [number, number] = [0, 0]; // running match total
  beloteHolder: string | null = null; // player who has R+D of trump
  belotePartialClaimed = false; // after playing first of R/D
  targetPoints = TARGET_DEFAULT;
  timeLeft = TURN_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  handNumber = 1;

  buildDeck(): Card[] {
    const cards: Card[] = [];
    for (const s of SUITS) for (const r of RANKS) cards.push({ rank: r, suit: s });
    return cards;
  }

  shuffle<T>(a: T[]) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  start() {
    if (this.started || this.players.size < 4) return;
    this.started = true;
    this.dealHand();
  }

  dealHand() {
    this.phase = "bidding";
    this.currentBid = null;
    this.consecutivePasses = 0;
    this.passCount = 0;
    this.trick = [];
    this.trickLeadSuit = null;
    this.trumpSuit = null;
    this.pliCounts = [0, 0];
    this.trickPoints = [0, 0];
    this.beloteHolder = null;
    this.belotePartialClaimed = false;

    const deck = this.buildDeck();
    this.shuffle(deck);

    // Initialize player seating only on first hand
    if (this.seatOrder.length === 0) {
      this.seatOrder = Array.from(this.players.keys()).slice(0, 4);
      this.contreePlayers.clear();
      this.seatOrder.forEach((id, idx) => {
        const p = this.players.get(id)!;
        this.contreePlayers.set(id, {
          id, name: p.name,
          hand: [],
          team: (idx % 2 === 0 ? 0 : 1) as 0 | 1,
          seatIndex: idx,
        });
      });
    } else {
      // Reset hands
      for (const p of this.contreePlayers.values()) p.hand = [];
    }

    // Deal 8 cards each
    let idx = 0;
    for (const card of deck) {
      const seat = idx % 4;
      const id = this.seatOrder[seat];
      this.contreePlayers.get(id)!.hand.push(card);
      idx++;
    }
    // Sort each hand
    for (const p of this.contreePlayers.values()) {
      p.hand.sort((a, b) => {
        if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
        return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank);
      });
    }

    // Player to the left of dealer starts bidding
    this.currentBidder = (this.dealer + 1) % 4;
    this.currentTurn = this.currentBidder;
    this.startTurnTimer();
    this.broadcastState();
  }

  startTurnTimer() {
    this.stopTurnTimer();
    this.timeLeft = TURN_TIME;
    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        if (this.phase === "bidding") this.handleBid({ type: "pass" }, this.seatOrder[this.currentBidder]);
        else if (this.phase === "playing") this.autoPlay();
      }
      this.broadcastState();
    }, 1000);
    this.scheduleBotIfNeeded();
  }

  scheduleBotIfNeeded() {
    if (this.phase === "bidding") {
      const id = this.seatOrder[this.currentBidder];
      if (!id || !this.isBot(id)) return;
      this.queueBotAction(() => {
        if (this.phase !== "bidding" || this.seatOrder[this.currentBidder] !== id) return;
        // 80% pass, 20% bid minimum if no bid yet
        if (!this.currentBid && Math.random() < 0.25) {
          const suit = SUITS[Math.floor(Math.random() * 4)];
          this.handleBid({ type: "bid", amount: 80, suit }, id);
        } else {
          this.handleBid({ type: "pass" }, id);
        }
      }, 1400, 2400); // slower bidding
    } else if (this.phase === "playing") {
      const id = this.seatOrder[this.currentTurn];
      if (!id || !this.isBot(id)) return;
      this.queueBotAction(() => {
        if (this.phase !== "playing" || this.seatOrder[this.currentTurn] !== id) return;
        this.autoPlay();
      }, 1600, 2800); // slower play
    }
  }
  stopTurnTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  onMessage(msg: Record<string, unknown>, sender: Connection) {
    const playerId = (msg as { playerId?: string }).playerId;
    const action   = (msg as { action?: string }).action;
    if (!playerId) return;
    const player = this.contreePlayers.get(playerId);
    if (!player) return;

    if (this.phase === "bidding") {
      if (this.seatOrder[this.currentBidder] !== playerId) return;
      if (action === "bid") {
        const amount = (msg as { amount?: number }).amount ?? 80;
        const suit   = (msg as { suit?: Suit }).suit;
        if (!suit || !SUITS.includes(suit)) return;
        this.handleBid({ type: "bid", amount, suit }, playerId);
      } else if (action === "pass") {
        this.handleBid({ type: "pass" }, playerId);
      } else if (action === "coincher") {
        // Only opponents of the bidder can coincher
        if (!this.currentBid) return;
        const bidderPlayer = this.contreePlayers.get(this.currentBid.bidder);
        if (!bidderPlayer || bidderPlayer.team === player.team) return;
        if (this.currentBid.multiplier !== 1) return;
        this.currentBid.multiplier = 2;
        this.showBubble(playerId, "Contre !", "coincher");
        this.consecutivePasses = 0;
        this.advanceBidder();
        this.startTurnTimer();
        this.broadcastState();
      } else if (action === "surcoincher") {
        if (!this.currentBid) return;
        const bidderPlayer = this.contreePlayers.get(this.currentBid.bidder);
        if (!bidderPlayer || bidderPlayer.team !== player.team) return;
        if (this.currentBid.multiplier !== 2) return;
        this.currentBid.multiplier = 4;
        this.showBubble(playerId, "Surcontre !", "coincher");
        this.endBiddingPhase();
      }
      return;
    }

    if (this.phase === "playing") {
      if (this.seatOrder[this.currentTurn] !== playerId) return;
      if (action === "play-card") {
        const cardIndex = (msg as { cardIndex?: number }).cardIndex ?? -1;
        this.playCard(playerId, cardIndex);
      }
    }
  }

  showBubble(playerId: string, text: string, tone: "bid" | "pass" | "coincher" | "belote") {
    this.bubbles[playerId] = { text, tone };
    setTimeout(() => {
      if (this.bubbles[playerId]?.text === text) {
        delete this.bubbles[playerId];
        this.broadcastState();
      }
    }, 2200);
  }

  handleBid(bid: { type: "bid"; amount: number; suit: Suit } | { type: "pass" }, playerId: string) {
    if (bid.type === "pass") {
      this.showBubble(playerId, "Passe", "pass");
      this.passCount++;
      this.consecutivePasses++;
      if (this.currentBid && this.consecutivePasses >= 3) {
        return this.endBiddingPhase();
      }
      if (!this.currentBid && this.passCount >= 4) {
        // No one bid → redeal with next dealer
        this.dealer = (this.dealer + 1) % 4;
        this.dealHand();
        return;
      }
      this.advanceBidder();
      this.startTurnTimer();
      this.broadcastState();
      return;
    }

    // Validate bid amount > current
    if (bid.amount < 80) return;
    if (this.currentBid && bid.amount <= this.currentBid.amount) return;

    this.showBubble(playerId, `${bid.amount} ${bid.suit}`, "bid");
    this.currentBid = {
      amount: bid.amount,
      suit: bid.suit,
      bidder: playerId,
      multiplier: 1,
    };
    this.consecutivePasses = 0;
    this.advanceBidder();
    this.startTurnTimer();
    this.broadcastState();
  }

  advanceBidder() {
    this.currentBidder = (this.currentBidder + 1) % 4;
    this.currentTurn = this.currentBidder;
  }

  endBiddingPhase() {
    if (!this.currentBid) return;
    this.phase = "playing";
    this.trumpSuit = this.currentBid.suit;
    // Detect Belote-Rebelote — find player with R + D of trump
    for (const p of this.contreePlayers.values()) {
      const hasR = p.hand.some(c => c.rank === "R" && c.suit === this.trumpSuit);
      const hasD = p.hand.some(c => c.rank === "D" && c.suit === this.trumpSuit);
      if (hasR && hasD) {
        this.beloteHolder = p.id;
        break;
      }
    }
    // Player to dealer's left leads
    this.currentTurn = (this.dealer + 1) % 4;
    this.trick = [];
    this.trickLeadSuit = null;
    this.startTurnTimer();
    this.broadcastState();
  }

  autoPlay() {
    // Simple bot: play first legal card
    const player = this.contreePlayers.get(this.seatOrder[this.currentTurn])!;
    const legalIdx = player.hand.findIndex((_, i) => this.isLegalPlay(player, i));
    if (legalIdx >= 0) this.playCard(player.id, legalIdx);
  }

  isLegalPlay(player: ContreePlayer, cardIndex: number): boolean {
    const card = player.hand[cardIndex];
    if (!card) return false;
    // No restriction if first to play in trick
    if (this.trick.length === 0) return true;
    const lead = this.trickLeadSuit!;
    // Must follow suit if possible
    if (card.suit === lead) return true;
    const hasLead = player.hand.some(c => c.suit === lead);
    if (hasLead) return false;
    // If no lead suit, must play trump if possible (MVP: just allow any non-lead)
    return true;
  }

  playCard(playerId: string, cardIndex: number) {
    const p = this.contreePlayers.get(playerId)!;
    if (!this.isLegalPlay(p, cardIndex)) return;
    const card = p.hand.splice(cardIndex, 1)[0];

    if (this.trick.length === 0) this.trickLeadSuit = card.suit;
    this.trick.push({ card, seat: p.seatIndex });

    // Belote announcement (auto)
    if (this.beloteHolder === playerId && card.suit === this.trumpSuit && (card.rank === "R" || card.rank === "D")) {
      if (!this.belotePartialClaimed) this.belotePartialClaimed = true;
    }

    if (this.trick.length === 4) {
      // Resolve trick
      this.resolveTrick();
      return;
    }
    this.currentTurn = (this.currentTurn + 1) % 4;
    this.startTurnTimer();
    this.broadcastState();
  }

  trickWinnerSeat(): number {
    const trump = this.trumpSuit!;
    const lead = this.trickLeadSuit!;
    let bestSeat = this.trick[0].seat;
    let bestCard = this.trick[0].card;
    for (let i = 1; i < this.trick.length; i++) {
      const { card, seat } = this.trick[i];
      const winsTrump = card.suit === trump && bestCard.suit !== trump;
      const bothTrump = card.suit === trump && bestCard.suit === trump;
      const bothLead = card.suit === lead && bestCard.suit === lead;
      let isHigher = false;
      if (winsTrump) isHigher = true;
      else if (bothTrump) isHigher = trumpOrder(card.rank) > trumpOrder(bestCard.rank);
      else if (bothLead) isHigher = plainOrder(card.rank) > plainOrder(bestCard.rank);
      if (isHigher) { bestSeat = seat; bestCard = card; }
    }
    return bestSeat;
  }

  resolveTrick() {
    const winnerSeat = this.trickWinnerSeat();
    const winnerTeam = (winnerSeat % 2) as 0 | 1;
    this.pliCounts[winnerTeam]++;

    // Tally points
    let pts = 0;
    for (const { card } of this.trick) {
      pts += card.suit === this.trumpSuit ? trumpValue(card.rank) : plainValue(card.rank);
    }
    this.trickPoints[winnerTeam] += pts;

    // Pause + animate: keep trick visible, mark winner
    this.stopTurnTimer();
    this.lastTrickWinnerSeat = winnerSeat;
    this.broadcastState();

    setTimeout(() => {
      this.lastTrickWinnerSeat = null;

      // Check if hand over (8 tricks)
      const totalTricks = this.pliCounts[0] + this.pliCounts[1];
      if (totalTricks === 8) {
        this.trickPoints[winnerTeam] += 10;
        this.endHand();
        return;
      }

      // Next trick: winner leads
      this.currentTurn = winnerSeat;
      this.trick = [];
      this.trickLeadSuit = null;
      this.startTurnTimer();
      this.broadcastState();
    }, 1500);
  }

  endHand() {
    if (!this.currentBid) return;
    const bidderTeam = (this.contreePlayers.get(this.currentBid.bidder)!.team) as 0 | 1;
    const opposingTeam = (1 - bidderTeam) as 0 | 1;

    // Points de cartes réalisés (le « 10 de der » est déjà inclus dans trickPoints) :
    // total = 152 cartes + 10 de der = 162. Valeurs réelles belote : V=20/9=14 à l'atout,
    // A=11, 10=10, R=4, D=3, V=2, 9/8/7=0 hors atout — calculées dans resolveTrick().
    const teamScore: [number, number] = [...this.trickPoints];
    const contract = this.currentBid.amount;
    const m = this.currentBid.multiplier;

    // Belote-rebelote : +20 à l'équipe qui détient R+D d'atout (toujours acquise).
    const beloteTeam = (this.beloteHolder && this.belotePartialClaimed)
      ? (this.contreePlayers.get(this.beloteHolder)!.team as 0 | 1)
      : null;
    if (beloteTeam !== null) teamScore[beloteTeam] += 20;

    const capot = this.pliCounts[bidderTeam] === 8 && this.pliCounts[opposingTeam] === 0;

    // Contrat atteint ? (la belote du preneur compte pour atteindre le contrat)
    let success = teamScore[bidderTeam] >= contract;
    if (contract === 250) success = capot;       // Capot annoncé
    if (contract === 500) success = capot;       // Générale

    const handFinal: [number, number] = [0, 0];
    if (success) {
      // Réussi : le preneur marque ses points réalisés + la valeur du contrat (×coinche).
      handFinal[bidderTeam] = (teamScore[bidderTeam] + contract) * m;
      handFinal[opposingTeam] = teamScore[opposingTeam];
    } else {
      // Chuté (« dedans ») : la défense empoche 162 + le contrat (×coinche).
      handFinal[opposingTeam] = (162 + contract) * m;
      handFinal[bidderTeam] = 0;
      // La belote reste acquise à son détenteur même en cas de chute.
      if (beloteTeam !== null) handFinal[beloteTeam] += 20;
    }

    this.matchScore[0] += handFinal[0];
    this.matchScore[1] += handFinal[1];

    // Broadcast hand result
    this.broadcast({
      type: "hand-result",
      payload: {
        success,
        bidderTeam,
        contract: this.currentBid,
        teamScore: handFinal,
        beloteRebelote: !!(this.beloteHolder && this.belotePartialClaimed),
        capot: this.pliCounts[bidderTeam] === 8,
        matchScore: this.matchScore,
      },
    });

    // Check match end
    if (this.matchScore[0] >= this.targetPoints || this.matchScore[1] >= this.targetPoints) {
      this.endMatch();
      return;
    }

    // Next hand: dealer rotates
    this.dealer = (this.dealer + 1) % 4;
    this.handNumber++;
    this.phase = "hand-over";
    this.broadcastState();
    // Auto-deal next hand after a short delay
    setTimeout(() => this.dealHand(), 4000);
  }

  endMatch() {
    this.phase = "match-over";
    this.stopTurnTimer();
    // Rankings: team-based
    const winningTeam: 0 | 1 = this.matchScore[0] > this.matchScore[1] ? 0 : 1;
    const rankings: GameRanking[] = [];
    for (const p of this.contreePlayers.values()) {
      const won = p.team === winningTeam;
      rankings.push({
        playerId: p.id,
        playerName: p.name,
        rank: won ? 1 : 3,
        score: this.matchScore[p.team],
      });
    }
    rankings.sort((a, b) => a.rank - b.rank);
    this.endGame(rankings);
  }

  getState(): Record<string, unknown> {
    const cur = this.seatOrder[this.currentTurn] || null;
    return {
      phase: this.phase,
      handNumber: this.handNumber,
      dealer: this.dealer,
      currentBidder: this.seatOrder[this.currentBidder],
      currentPlayerId: cur,
      currentBid: this.currentBid,
      timeLeft: this.timeLeft,
      trick: this.trick,
      trickLeadSuit: this.trickLeadSuit,
      lastTrickWinnerSeat: this.lastTrickWinnerSeat,
      bubbles: this.bubbles,
      trumpSuit: this.trumpSuit,
      pliCounts: this.pliCounts,
      trickPoints: this.trickPoints,
      matchScore: this.matchScore,
      targetPoints: this.targetPoints,
      beloteHolder: this.beloteHolder,
      seats: this.seatOrder.map((id, idx) => {
        const p = this.contreePlayers.get(id);
        return p ? {
          id: p.id, name: p.name,
          team: p.team, seatIndex: idx,
          cardCount: p.hand.length,
          isCurrentTurn: id === cur,
        } : null;
      }).filter(Boolean),
      hands: Object.fromEntries(
        Array.from(this.contreePlayers.entries()).map(([id, p]) => [id, p.hand])
      ),
      suitLabels: SUIT_LABEL,
    };
  }

  restartIfFinished(): boolean {
    if (this.phase === "match-over" && this.players.size >= 4) {
      this.matchScore = [0, 0];
      this.handNumber = 1;
      this.dealHand();
      return true;
    }
    return false;
  }

  cleanup() {
    this.stopTurnTimer();
    this.clearBotTimeouts();
  }
}
