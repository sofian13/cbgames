/**
 * Le Président (Trou-du-cul) — PartyKit server
 *
 * Règles :
 *  - 52 cartes, TOUTES distribuées (certains joueurs ont 1 carte de plus).
 *  - Combos : simple, paire, brelan, carré. On bat avec le même nombre de cartes
 *    et une valeur supérieure ou égale. Valeur égale → « X ou rien » : le suivant
 *    doit poser la même valeur, sinon ça saute (il n'est PAS marqué « passe »).
 *  - Ordre (faible → fort) : 3, 4, 5, 6, 7, 8, 9, 10, V, D, R, A, 2.
 *  - Un 2 ferme le pli : celui qui l'a posé relance.
 *  - Finir sur un 2 = Trou-du-cul d'office.
 *  - 1er à vider sa main = Président, 2e = Vice-Président (≥ 4 joueurs),
 *    avant-dernier = Vice-Trou (≥ 4 joueurs), dernier = Trou-du-cul.
 *  - Entre deux manches : le Trou-du-cul donne ses 2 meilleures cartes au Président
 *    qui lui rend 2 cartes de son choix ; Vice-Trou ↔ Vice-Président : 1 carte.
 */
import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "V" | "D" | "R" | "A" | "2";

interface Card { rank: Rank; suit: Suit; }

type Title = "president" | "vice-president" | "neutre" | "vice-trou" | "trou";

const RANK_ORDER: Rank[] = ["3","4","5","6","7","8","9","10","V","D","R","A","2"];
const SUITS: Suit[] = ["♠","♥","♦","♣"];
// Ordre d'affichage de la main : regroupé par logo (trèfle, pique, cœur, carreau).
const HAND_SUIT_ORDER: Suit[] = ["♣","♠","♥","♦"];

interface PrePlayer {
  id: string;
  name: string;
  hand: Card[];
  finishedAt: number | null; // ordre d'arrivée (1 = président), -1 = fini sur un 2
}

/** Un joueur qui doit rendre des cartes pendant l'échange. */
interface PendingGive {
  to: string;
  count: number;
  received: Card[];
}

const TURN_TIME = 30;
const EXCHANGE_TIME = 20;

const rv = (c: Card) => RANK_ORDER.indexOf(c.rank);

export class PresidentGame extends BaseGame {
  prePlayers: Map<string, PrePlayer> = new Map();
  turnOrder: string[] = [];
  currentIdx = 0;
  lastCombo: Card[] = [];
  lastComboPlayer: string | null = null;
  consecutivePasses = 0;
  passedThisRound = new Set<string>();
  finishersOrder: string[] = []; // joueurs dans l'ordre d'arrivée (président en premier)
  penalized: string[] = [];      // finis sur un 2 → relégués en bas
  forcedRank: Rank | null = null; // deux combos égaux : le suivant doit poser cette valeur ou ça saute
  status: "waiting" | "exchange" | "playing" | "round-over" = "waiting";
  timeLeft = TURN_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  round = 1;
  /** Hiérarchie (titre par joueur), conservée d'une manche à l'autre. */
  titles: Record<string, Title> = {};
  /** Ordre final de la manche précédente (président → trou). */
  lastOrder: string[] = [];
  /** Échange en cours : joueur qui doit rendre → détails. */
  pendingGives: Map<string, PendingGive> = new Map();
  /** Cartes données automatiquement par le Trou / Vice-Trou (pour l'affichage). */
  gaveAuto: Record<string, { to: string; cards: Card[] }> = {};

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

  /** Les états sont personnalisés (chacun ne voit que sa main). */
  broadcastState() {
    this.syncAll();
  }

  titlesFromOrder(order: string[]): Record<string, Title> {
    const n = order.length;
    const t: Record<string, Title> = {};
    order.forEach((id, i) => {
      if (i === 0) t[id] = "president";
      else if (i === n - 1) t[id] = "trou";
      else if (n >= 4 && i === 1) t[id] = "vice-president";
      else if (n >= 4 && i === n - 2) t[id] = "vice-trou";
      else t[id] = "neutre";
    });
    return t;
  }

  dealRound() {
    this.stopTurnTimer();
    this.clearBotTimeouts();
    this.lastCombo = [];
    this.lastComboPlayer = null;
    this.consecutivePasses = 0;
    this.passedThisRound.clear();
    this.finishersOrder = [];
    this.penalized = [];
    this.forcedRank = null;
    this.pendingGives.clear();
    this.gaveAuto = {};

    const deck = this.buildDeck();
    this.shuffle(deck);

    this.turnOrder = Array.from(this.players.keys());
    this.prePlayers.clear();
    for (const id of this.turnOrder) {
      const player = this.players.get(id)!;
      this.prePlayers.set(id, { id, name: player.name, hand: [], finishedAt: null });
    }
    // Distribution de TOUTES les cartes, une par une
    deck.forEach((c, i) => {
      this.prePlayers.get(this.turnOrder[i % this.turnOrder.length])!.hand.push(c);
    });
    for (const p of this.prePlayers.values()) p.hand.sort(this.sortHand.bind(this));

    // Hiérarchie conservée seulement si ce sont exactement les mêmes joueurs
    const sameTable = this.lastOrder.length === this.turnOrder.length
      && this.lastOrder.every((id) => this.prePlayers.has(id));
    if (!sameTable) {
      this.lastOrder = [];
      this.titles = {};
    }

    if (sameTable && this.lastOrder.length >= 3) {
      this.beginExchange();
      return;
    }

    // Première manche : celui qui a le 3♣ commence
    let starter = 0;
    for (let i = 0; i < this.turnOrder.length; i++) {
      const p = this.prePlayers.get(this.turnOrder[i])!;
      if (p.hand.some(c => c.rank === "3" && c.suit === "♣")) { starter = i; break; }
    }
    this.currentIdx = starter;
    this.status = "playing";
    this.startTurnTimer();
    this.broadcastState();
  }

  // ── Échange de cartes entre manches ──

  beginExchange() {
    this.status = "exchange";
    const order = this.lastOrder;
    const n = order.length;
    const pairs: [string, string, number][] = [[order[n - 1], order[0], 2]]; // [trou, président, nb]
    if (n >= 4) pairs.push([order[n - 2], order[1], 1]);

    for (const [lowId, highId, count] of pairs) {
      const low = this.prePlayers.get(lowId);
      const high = this.prePlayers.get(highId);
      if (!low || !high) continue;
      // Le bas de la hiérarchie donne ses meilleures cartes, automatiquement
      const best = [...low.hand].sort((a, b) => rv(b) - rv(a)).slice(0, count);
      low.hand = low.hand.filter((c) => !best.includes(c));
      high.hand.push(...best);
      high.hand.sort(this.sortHand.bind(this));
      this.gaveAuto[lowId] = { to: highId, cards: best };
      this.pendingGives.set(highId, { to: lowId, count, received: best });
    }

    // Bots : rendent leurs cartes les plus faibles
    for (const giver of this.pendingGives.keys()) {
      if (!this.isBot(giver)) continue;
      this.queueBotAction(() => this.autoGive(giver), 1200, 2400);
    }

    this.timeLeft = EXCHANGE_TIME;
    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        for (const giver of [...this.pendingGives.keys()]) this.autoGive(giver);
        return;
      }
      this.broadcastState();
    }, 1000);
    this.broadcastState();
  }

  autoGive(giverId: string) {
    const p = this.prePlayers.get(giverId);
    const pending = this.pendingGives.get(giverId);
    if (!p || !pending || this.status !== "exchange") return;
    // Rend ses cartes les plus faibles
    const sorted = p.hand.map((c, i) => ({ c, i })).sort((a, b) => rv(a.c) - rv(b.c));
    this.giveCards(giverId, sorted.slice(0, pending.count).map((x) => x.i));
  }

  giveCards(giverId: string, indices: number[]) {
    const p = this.prePlayers.get(giverId);
    const pending = this.pendingGives.get(giverId);
    if (!p || !pending || this.status !== "exchange") return;
    const uniq = [...new Set(indices)].filter((i) => Number.isInteger(i) && i >= 0 && i < p.hand.length);
    if (uniq.length !== pending.count) return;
    const cards = uniq.map((i) => p.hand[i]);
    p.hand = p.hand.filter((_, i) => !uniq.includes(i));
    const to = this.prePlayers.get(pending.to);
    if (to) {
      to.hand.push(...cards);
      to.hand.sort(this.sortHand.bind(this));
    }
    this.pendingGives.delete(giverId);
    if (this.pendingGives.size === 0) this.finishExchange();
    else this.broadcastState();
  }

  finishExchange() {
    this.stopTurnTimer();
    this.status = "playing";
    // Le Trou-du-cul commence la nouvelle manche
    const trou = this.lastOrder[this.lastOrder.length - 1];
    const idx = trou ? this.turnOrder.indexOf(trou) : -1;
    this.currentIdx = idx >= 0 ? idx : 0;
    this.startTurnTimer();
    this.broadcastState();
  }

  sortHand(a: Card, b: Card) {
    // Regroupé par couleur (trèfle, pique, cœur, carreau) puis par force de carte.
    const as = HAND_SUIT_ORDER.indexOf(a.suit);
    const bs = HAND_SUIT_ORDER.indexOf(b.suit);
    if (as !== bs) return as - bs;
    return rv(a) - rv(b);
  }

  startTurnTimer() {
    this.stopTurnTimer();
    this.clearBotTimeouts(); // on oublie toute action de bot du tour précédent
    this.timeLeft = TURN_TIME;

    const cur = this.currentPlayerId();
    const curP = cur ? this.prePlayers.get(cur) : null;

    // Valeur verrouillée et le joueur ne peut pas suivre → « ça saute » (sans le marquer « passe »).
    if (this.forcedRank && curP && !curP.hand.some((c) => c.rank === this.forcedRank)) {
      this.broadcastState();
      this.queueBotAction(() => {
        if (this.status === "playing" && this.currentPlayerId() === cur) this.skipAction();
      }, 1000, 1500);
      return;
    }

    // Joueur parti : on joue pour lui tout de suite (il passe)
    if (cur && !this.players.has(cur)) {
      this.queueBotAction(() => {
        if (this.status !== "playing" || this.currentPlayerId() !== cur) return;
        const p = this.prePlayers.get(cur);
        if (this.lastCombo.length === 0 && p && p.hand.length > 0) {
          const low = p.hand.reduce((best, c, i) => (rv(c) < rv(p.hand[best]) ? i : best), 0);
          this.playCombo(cur, [low]);
        } else {
          this.passAction(cur);
        }
      }, 600, 900);
      return;
    }

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        this.timeoutAction(this.currentPlayerId());
        return;
      }
      this.broadcastState();
    }, 1000);
    this.scheduleBotIfNeeded();
  }

  /** Temps écoulé : passe, ou pose la plus petite carte si on mène. */
  timeoutAction(pid: string) {
    const p = this.prePlayers.get(pid);
    if (this.lastCombo.length === 0 && p && p.hand.length > 0) {
      const play = this.botChooseLead(p.hand);
      this.playCombo(pid, play);
    } else {
      this.passAction(pid);
    }
  }

  // ── Bots ──

  /** Groupes de cartes par valeur : { rank, indices } triés du plus faible au plus fort. */
  groupsOf(hand: Card[]) {
    const m = new Map<Rank, number[]>();
    hand.forEach((c, i) => {
      const arr = m.get(c.rank) ?? [];
      arr.push(i);
      m.set(c.rank, arr);
    });
    return [...m.entries()]
      .map(([rank, indices]) => ({ rank, indices, v: RANK_ORDER.indexOf(rank) }))
      .sort((a, b) => a.v - b.v);
  }

  /** Quand le bot mène : combo de faible valeur, on garde 2 et As pour la fin. */
  botChooseLead(hand: Card[]): number[] {
    const groups = this.groupsOf(hand);
    const twos = groups.find((g) => g.rank === "2");
    const nonTwos = groups.filter((g) => g.rank !== "2");
    // Plus que des 2 en main → tant pis
    if (nonTwos.length === 0) return twos!.indices;
    // Il reste des 2 et presque plus rien d'autre : on s'en débarrasse maintenant
    // (un 2 ferme le pli → on relance avec la suite, et on ne finit jamais sur un 2).
    if (twos && nonTwos.length <= 1) return twos.indices.slice(0, 1);
    const cheap = nonTwos.filter((g) => g.rank !== "A");
    const pool = cheap.length > 0 ? cheap : nonTwos;
    // Parmi les plus faibles, privilégie un combo (paire/brelan) pour vider plus vite
    const lowest = pool.slice(0, 3);
    const combo = lowest.find((g) => g.indices.length >= 2 && g.indices.length < 4);
    return (combo ?? pool[0]).indices;
  }

  /** Quand le bot doit battre un combo : plus petit combo valide, sans casser ses 2/As trop tôt. */
  botChooseFollow(hand: Card[]): number[] | null {
    const size = this.lastCombo.length;
    const groups = this.groupsOf(hand).filter((g) => g.indices.length >= size);
    const candidates = groups
      .map((g) => ({ ...g, play: g.indices.slice(0, size) }))
      .filter((g) => this.comboBeats(g.play.map((i) => hand[i]), this.lastCombo));
    if (candidates.length === 0) return null;
    const endgame = hand.length <= 5;
    const nonTwoCards = hand.filter((c) => c.rank !== "2").length;
    for (const g of candidates) {
      // Ne jamais finir sur un 2
      if (g.rank === "2" && hand.length === size) continue;
      // Garde 2 et As pour la fin de manche (sauf s'il ne reste quasi que ça)
      if ((g.rank === "2" || g.rank === "A") && !endgame) continue;
      // Évite de casser une paire/un brelan pour une simple si on a mieux
      if (g.indices.length > size && candidates.some((o) => o !== g && o.indices.length === size && o.rank !== "2" && o.rank !== "A")) continue;
      return g.play;
    }
    // Un 2 en réserve et peu d'autres cartes : le poser maintenant pour ne pas finir dessus
    const two = candidates.find((g) => g.rank === "2");
    if (two && hand.length > size && nonTwoCards <= 2) return two.play;
    return null;
  }

  scheduleBotIfNeeded() {
    if (this.status !== "playing") return;
    const id = this.currentPlayerId();
    if (!id || !this.isBot(id)) return;
    this.queueBotAction(() => {
      if (this.status !== "playing" || this.currentPlayerId() !== id) return;
      const p = this.prePlayers.get(id);
      if (!p || p.hand.length === 0) return;
      if (this.lastCombo.length === 0) return this.playCombo(id, this.botChooseLead(p.hand));
      const play = this.botChooseFollow(p.hand);
      if (play) return this.playCombo(id, play);
      this.passAction(id);
    }, 1700, 3200); // bots lents — plus facile à suivre
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
      if (!p || p.hand.length === 0) continue; // joueurs déjà sortis
      // Retour à celui qui a posé le combo : tout le monde a passé → il remporte le pli.
      if (pid === this.lastComboPlayer) { this.resetTrick(); return; }
      if (!this.passedThisRound.has(pid)) return;
    }
    this.resetTrick();
  }

  resetTrick() {
    this.lastCombo = [];
    this.forcedRank = null;
    this.passedThisRound.clear();
    if (this.lastComboPlayer) {
      const idx = this.turnOrder.indexOf(this.lastComboPlayer);
      if (idx >= 0) {
        this.currentIdx = idx;
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
    if (this.forcedRank) return newCombo[0].rank === this.forcedRank;
    return rv(newCombo[0]) >= rv(oldCombo[0]); // égal → verrouillage « X ou rien »
  }

  /** Le joueur est identifié par sa connexion, jamais par un id envoyé par le client. */
  playerIdForConnection(connId: string): string | null {
    for (const [id, p] of this.players) if (p.connectionId === connId) return id;
    return null;
  }

  onMessage(msg: Record<string, unknown>, sender: Connection) {
    const action = (msg as { action?: string }).action;
    const playerId = this.playerIdForConnection(sender.id);
    if (!playerId) return;
    const rawIndices = (msg as { indices?: unknown }).indices;
    const indices = Array.isArray(rawIndices) ? rawIndices.filter((i): i is number => typeof i === "number") : [];

    if (this.status === "exchange") {
      if (action === "give-cards") this.giveCards(playerId, indices);
      return;
    }
    if (this.status !== "playing") return;
    if (this.currentPlayerId() !== playerId) return;

    if (action === "play-combo") {
      this.playCombo(playerId, indices);
    } else if (action === "pass") {
      this.passAction(playerId);
    }
  }

  playCombo(playerId: string, indices: number[]) {
    const p = this.prePlayers.get(playerId);
    if (!p) return;
    const uniq = [...new Set(indices)];
    const cards = uniq.map(i => p.hand[i]).filter(Boolean);
    if (cards.length !== uniq.length) return;
    if (!this.validCombo(cards)) return;
    if (!this.comboBeats(cards, this.lastCombo)) return;

    const playedEqual = this.lastCombo.length > 0 && cards[0].rank === this.lastCombo[0].rank;

    p.hand = p.hand.filter((_, i) => !uniq.includes(i));
    this.lastCombo = cards;
    this.lastComboPlayer = playerId;
    this.consecutivePasses = 0;
    if (playedEqual) this.forcedRank = cards[0].rank;

    if (p.hand.length === 0 && p.finishedAt === null) {
      if (cards[0].rank === "2") {
        // Interdit de finir sur un 2 → Trou-du-cul d'office.
        p.finishedAt = -1;
        this.penalized.push(playerId);
      } else {
        p.finishedAt = this.finishersOrder.length + 1;
        this.finishersOrder.push(playerId);
      }
      const remaining = this.turnOrder.filter(id => (this.prePlayers.get(id)?.hand.length ?? 0) > 0);
      if (remaining.length <= 1) {
        for (const rid of remaining) {
          const rp = this.prePlayers.get(rid);
          if (rp) { rp.finishedAt = this.finishersOrder.length + 1; this.finishersOrder.push(rid); }
        }
        return this.endRound();
      }
    }

    // Un 2 ferme le pli : le poseur relance (ou le suivant s'il vient de finir).
    if (cards[0].rank === "2") {
      this.resetTrick();
    } else {
      this.advanceTurn();
    }
    this.startTurnTimer();
    this.broadcastState();
  }

  passAction(playerId: string) {
    if (this.lastCombo.length > 0) this.passedThisRound.add(playerId);
    this.advanceTurn();
    this.startTurnTimer();
    this.broadcastState();
  }

  /** « Ça saute » : on passe au suivant SANS marquer le joueur comme ayant passé le pli. */
  skipAction() {
    this.advanceTurn();
    this.startTurnTimer();
    this.broadcastState();
  }

  endRound() {
    this.stopTurnTimer();
    this.clearBotTimeouts();
    this.status = "round-over";

    // Ordre final : arrivées normales, puis ceux qui ont fini sur un 2 (le plus récent tout en bas).
    const order = [...this.finishersOrder, ...[...this.penalized].reverse()];
    this.lastOrder = order;
    this.titles = this.titlesFromOrder(order);
    const rankings: GameRanking[] = order.map((id, i) => {
      const p = this.prePlayers.get(id)!;
      return {
        playerId: id,
        playerName: p.name,
        rank: i + 1,
        score: Math.max(0, 100 - i * 25),
      };
    });
    this.broadcastState();
    this.endGame(rankings);
  }

  /** État public : aucune main, seulement le nombre de cartes. */
  getState(): Record<string, unknown> {
    const cur = this.currentPlayerId() || null;
    return {
      status: this.status,
      round: this.round,
      currentPlayerId: this.status === "playing" ? cur : null,
      timeLeft: this.timeLeft,
      lastCombo: this.lastCombo,
      lastComboPlayer: this.lastComboPlayer,
      forcedRank: this.forcedRank,
      titles: this.titles,
      hierarchy: this.lastOrder,
      exchangePending: [...this.pendingGives.keys()],
      otherPlayers: this.turnOrder.map(id => {
        const p = this.prePlayers.get(id);
        return p ? {
          id: p.id,
          name: p.name,
          cardCount: p.hand.length,
          isCurrentTurn: this.status === "playing" && id === cur,
          passed: this.passedThisRound.has(id),
          finishedAt: p.finishedAt,
          isBot: this.isBot(id),
          title: this.titles[id] ?? null,
        } : null;
      }).filter(Boolean),
    };
  }

  /** Vue d'un joueur : état public + SA main + ce qui le concerne dans l'échange. */
  getStateForPlayer(playerId: string): Record<string, unknown> {
    const p = this.prePlayers.get(playerId);
    const pending = this.pendingGives.get(playerId);
    const gave = this.gaveAuto[playerId];
    const name = (id: string) => this.prePlayers.get(id)?.name ?? "?";
    return {
      ...this.getState(),
      myHand: p?.hand ?? [],
      myExchange: pending
        ? { role: "give", count: pending.count, toName: name(pending.to), received: pending.received }
        : gave
          ? { role: "gave", count: gave.cards.length, toName: name(gave.to), cards: gave.cards }
          : null,
    };
  }

  restartIfFinished(): boolean {
    if (this.status === "round-over" && this.players.size >= 2) {
      this.round += 1;
      this.dealRound();
      return true;
    }
    return false;
  }

  cleanup() {
    this.stopTurnTimer();
    this.clearBotTimeouts();
  }
}
