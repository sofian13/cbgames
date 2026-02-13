import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ── Config ──────────────────────────────────────────────────
const REVEAL_DURATION = 5000;
const DESCRIBE_TIMEOUT = 30000;
const VOTE_TIMEOUT = 30000;
const RESULT_DISPLAY_TIME = 4000;
const MR_WHITE_GUESS_TIMEOUT = 20000;
const GAME_END_DISPLAY_TIME = 5000;

// ── Word Pairs (70 pairs) ───────────────────────────────────
const WORD_PAIRS: [string, string][] = [
  ["Chat", "Chien"],
  ["Coca-Cola", "Pepsi"],
  ["Netflix", "YouTube"],
  ["Pizza", "Burger"],
  ["iPhone", "Samsung"],
  ["Paris", "Londres"],
  ["Football", "Rugby"],
  ["Chocolat", "Caramel"],
  ["Avion", "Helicoptere"],
  ["Guitare", "Piano"],
  ["Batman", "Superman"],
  ["McDonald's", "Burger King"],
  ["Instagram", "TikTok"],
  ["Plage", "Piscine"],
  ["Voiture", "Moto"],
  ["Soleil", "Lune"],
  ["Dentiste", "Medecin"],
  ["Cinema", "Theatre"],
  ["Cafe", "The"],
  ["Montagne", "Colline"],
  ["Pomme", "Poire"],
  ["Ski", "Snowboard"],
  ["Chemise", "T-shirt"],
  ["Biere", "Vin"],
  ["Violon", "Violoncelle"],
  ["Manga", "Comics"],
  ["Croissant", "Pain au chocolat"],
  ["Sushi", "Maki"],
  ["Tennis", "Badminton"],
  ["Lion", "Tigre"],
  ["Rose", "Tulipe"],
  ["Pluie", "Neige"],
  ["Train", "Metro"],
  ["Livre", "Magazine"],
  ["Canape", "Fauteuil"],
  ["Email", "SMS"],
  ["Gateau", "Tarte"],
  ["Google", "Bing"],
  ["Stylo", "Crayon"],
  ["Fourchette", "Cuillere"],
  ["Basket", "Running"],
  ["Chapeau", "Casquette"],
  ["Araignee", "Scorpion"],
  ["Mer", "Ocean"],
  ["Fromage", "Beurre"],
  ["Radio", "Podcast"],
  ["Aquarium", "Zoo"],
  ["Chaussettes", "Chaussures"],
  ["Marteau", "Tournevis"],
  ["Fraise", "Framboise"],
  ["Souris", "Rat"],
  ["Crocodile", "Alligator"],
  ["Trompette", "Saxophone"],
  ["Bretagne", "Normandie"],
  ["Hibou", "Chouette"],
  ["Crevette", "Homard"],
  ["Mars", "Snickers"],
  ["Spotify", "Deezer"],
  ["WhatsApp", "Telegram"],
  ["Karate", "Judo"],
  ["Opera", "Ballet"],
  ["Camping", "Glamping"],
  ["Bague", "Bracelet"],
  ["Valise", "Sac a dos"],
  ["Pyramide", "Tour Eiffel"],
  ["Moustache", "Barbe"],
  ["Aspirateur", "Balai"],
  ["Parapluie", "Parasol"],
  ["Vampire", "Loup-garou"],
  ["Banane", "Ananas"],
];

// ── Types ───────────────────────────────────────────────────

type Role = "civilian" | "undercover" | "mrwhite";

type GamePhase =
  | "waiting"
  | "role-reveal"
  | "describe"
  | "vote"
  | "vote-result"
  | "mrwhite-guess"
  | "game-over";

interface UndercoverPlayer {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  alive: boolean;
  description: string | null;
  hasDescribed: boolean;
  vote: string | null;
  hasVoted: boolean;
}

interface ClueEntry {
  playerId: string;
  playerName: string;
  text: string;
  round: number;
}

// ── Game Class ──────────────────────────────────────────────

export class UndercoverGame extends BaseGame {
  ucPlayers: Map<string, UndercoverPlayer> = new Map();
  phase: GamePhase = "waiting";
  round = 0;
  civilianWord = "";
  undercoverWord = "";
  turnOrder: string[] = [];
  currentDescriberIndex = 0;
  clueHistory: ClueEntry[] = [];
  eliminatedPlayerId: string | null = null;
  eliminatedRole: Role | null = null;
  mrWhiteGuessCorrect: boolean | null = null;
  winners: Role | null = null;

  revealTimeout: ReturnType<typeof setTimeout> | null = null;
  describeTimeout: ReturnType<typeof setTimeout> | null = null;
  voteTimeout: ReturnType<typeof setTimeout> | null = null;
  resultTimeout: ReturnType<typeof setTimeout> | null = null;
  mrWhiteTimeout: ReturnType<typeof setTimeout> | null = null;
  timerInterval: ReturnType<typeof setInterval> | null = null;
  timeLeft = 0;

  start() {
    const playerCount = this.players.size;

    if (playerCount < 3) {
      this.broadcast({
        type: "game-error",
        payload: { message: "Il faut au moins 3 joueurs pour jouer." },
      });
      return;
    }

    this.started = true;

    // Pick a random word pair
    const pairIndex = Math.floor(Math.random() * WORD_PAIRS.length);
    const pair = WORD_PAIRS[pairIndex];
    if (Math.random() < 0.5) {
      this.civilianWord = pair[0];
      this.undercoverWord = pair[1];
    } else {
      this.civilianWord = pair[1];
      this.undercoverWord = pair[0];
    }

    // Assign roles
    const playerIds = Array.from(this.players.keys());
    this.shuffleArray(playerIds);

    let undercoverCount: number;
    let mrWhiteCount: number;

    if (playerCount <= 5) {
      undercoverCount = 1;
      mrWhiteCount = 0;
    } else {
      // 6+ players: 1 undercover + 1 mr white OR 2 undercovers
      if (Math.random() < 0.5) {
        undercoverCount = 1;
        mrWhiteCount = 1;
      } else {
        undercoverCount = 2;
        mrWhiteCount = 0;
      }
    }

    for (let i = 0; i < playerIds.length; i++) {
      const pid = playerIds[i];
      const player = this.players.get(pid)!;
      let role: Role = "civilian";
      let word: string | null = this.civilianWord;

      if (i < undercoverCount) {
        role = "undercover";
        word = this.undercoverWord;
      } else if (i < undercoverCount + mrWhiteCount) {
        role = "mrwhite";
        word = null;
      }

      this.ucPlayers.set(pid, {
        id: pid,
        name: player.name,
        role,
        word,
        alive: true,
        description: null,
        hasDescribed: false,
        vote: null,
        hasVoted: false,
      });
    }

    // Randomize turn order
    this.turnOrder = Array.from(this.players.keys());
    this.shuffleArray(this.turnOrder);

    // Start role reveal
    this.phase = "role-reveal";
    this.broadcastPersonalizedState();

    this.revealTimeout = setTimeout(() => {
      this.startDescribePhase();
    }, REVEAL_DURATION);
  }

  // ── Phase transitions ─────────────────────────────────────

  startDescribePhase() {
    this.clearTimers();
    this.round++;
    this.currentDescriberIndex = 0;
    this.phase = "describe";

    for (const p of this.ucPlayers.values()) {
      if (p.alive) {
        p.description = null;
        p.hasDescribed = false;
      }
    }

    this.advanceToNextAliveDescriber();
    this.startDescribeTimer();
    this.broadcastPersonalizedState();
  }

  advanceToNextAliveDescriber(): boolean {
    while (this.currentDescriberIndex < this.turnOrder.length) {
      const pid = this.turnOrder[this.currentDescriberIndex];
      const p = this.ucPlayers.get(pid);
      if (p && p.alive) return true;
      this.currentDescriberIndex++;
    }
    return false;
  }

  startDescribeTimer() {
    this.timeLeft = Math.ceil(DESCRIBE_TIMEOUT / 1000);
    this.clearTimerInterval();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimerInterval();
      }
      this.broadcastPersonalizedState();
    }, 1000);

    this.describeTimeout = setTimeout(() => {
      this.handleDescribeTimeout();
    }, DESCRIBE_TIMEOUT);
  }

  handleDescribeTimeout() {
    this.clearTimers();
    const currentPid = this.turnOrder[this.currentDescriberIndex];
    const p = this.ucPlayers.get(currentPid);
    if (p && p.alive && !p.hasDescribed) {
      p.hasDescribed = true;
      p.description = "(pas de description)";
      this.clueHistory.push({
        playerId: p.id,
        playerName: p.name,
        text: "(pas de description)",
        round: this.round,
      });
    }
    this.moveToNextDescriber();
  }

  moveToNextDescriber() {
    this.currentDescriberIndex++;
    if (!this.advanceToNextAliveDescriber()) {
      this.startVotePhase();
    } else {
      this.startDescribeTimer();
      this.broadcastPersonalizedState();
    }
  }

  startVotePhase() {
    this.clearTimers();
    this.phase = "vote";

    for (const p of this.ucPlayers.values()) {
      p.vote = null;
      p.hasVoted = false;
    }

    this.timeLeft = Math.ceil(VOTE_TIMEOUT / 1000);
    this.clearTimerInterval();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimerInterval();
      }
      this.broadcastPersonalizedState();
    }, 1000);

    this.voteTimeout = setTimeout(() => {
      this.resolveVotes();
    }, VOTE_TIMEOUT);

    this.broadcastPersonalizedState();
  }

  resolveVotes() {
    this.clearTimers();

    const voteCounts: Record<string, number> = {};
    for (const p of this.ucPlayers.values()) {
      if (p.alive && p.vote) {
        voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1;
      }
    }

    let maxVotes = 0;
    let eliminated: string | null = null;
    let isTie = false;

    for (const [pid, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        eliminated = pid;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    if (isTie || !eliminated || maxVotes === 0) {
      this.eliminatedPlayerId = null;
      this.eliminatedRole = null;
      this.phase = "vote-result";
      this.broadcastPersonalizedState();

      this.resultTimeout = setTimeout(() => {
        this.afterVoteResult();
      }, RESULT_DISPLAY_TIME);
      return;
    }

    const ep = this.ucPlayers.get(eliminated);
    if (!ep) return;

    ep.alive = false;
    this.eliminatedPlayerId = eliminated;
    this.eliminatedRole = ep.role;

    // Mr. White gets a chance to guess
    if (ep.role === "mrwhite") {
      this.phase = "mrwhite-guess";
      this.timeLeft = Math.ceil(MR_WHITE_GUESS_TIMEOUT / 1000);
      this.broadcastPersonalizedState();

      this.clearTimerInterval();
      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.clearTimerInterval();
        }
        this.broadcastPersonalizedState();
      }, 1000);

      this.mrWhiteTimeout = setTimeout(() => {
        this.mrWhiteGuessCorrect = false;
        this.phase = "vote-result";
        this.broadcastPersonalizedState();
        this.resultTimeout = setTimeout(() => {
          this.afterVoteResult();
        }, RESULT_DISPLAY_TIME);
      }, MR_WHITE_GUESS_TIMEOUT);
      return;
    }

    this.phase = "vote-result";
    this.broadcastPersonalizedState();

    this.resultTimeout = setTimeout(() => {
      this.afterVoteResult();
    }, RESULT_DISPLAY_TIME);
  }

  afterVoteResult() {
    this.clearTimers();
    this.mrWhiteGuessCorrect = null;

    const alive = Array.from(this.ucPlayers.values()).filter((p) => p.alive);
    const aliveThreats = alive.filter(
      (p) => p.role === "undercover" || p.role === "mrwhite"
    ).length;
    const aliveCivilians = alive.filter((p) => p.role === "civilian").length;

    // Civilians win: all threats eliminated
    if (aliveThreats === 0) {
      this.winners = "civilian";
      this.endUndercoverGame();
      return;
    }

    // Undercover/MrWhite win: threats >= civilians
    if (aliveThreats >= aliveCivilians) {
      this.winners = "undercover";
      this.endUndercoverGame();
      return;
    }

    // Continue
    this.eliminatedPlayerId = null;
    this.eliminatedRole = null;
    this.startDescribePhase();
  }

  endUndercoverGame() {
    this.clearTimers();
    this.phase = "game-over";

    const players = Array.from(this.ucPlayers.values());
    const winnerRole = this.winners;
    const rankings: GameRanking[] = [];

    const isWinner = (p: UndercoverPlayer) => {
      if (winnerRole === "civilian") return p.role === "civilian";
      if (winnerRole === "mrwhite") return p.role === "mrwhite";
      return p.role === "undercover" || p.role === "mrwhite";
    };

    const winners = players.filter(isWinner);
    const losers = players.filter((p) => !isWinner(p));

    let rank = 1;
    for (const p of winners) {
      rankings.push({
        playerId: p.id,
        playerName: p.name,
        rank,
        score: p.alive ? 100 : 50,
      });
    }
    rank = winners.length + 1;
    for (const p of losers) {
      rankings.push({
        playerId: p.id,
        playerName: p.name,
        rank,
        score: 0,
      });
    }

    this.broadcastPersonalizedState();

    setTimeout(() => {
      this.endGame(rankings);
    }, GAME_END_DISPLAY_TIME);
  }

  // ── Message handling ──────────────────────────────────────

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const senderPlayer = this.findPlayerByConnection(sender.id);
    if (!senderPlayer) return;

    const pid = senderPlayer.id;
    const ucp = this.ucPlayers.get(pid);
    if (!ucp) return;

    switch (action) {
      case "describe": {
        if (this.phase !== "describe") return;
        if (!ucp.alive || ucp.hasDescribed) return;

        const currentPid = this.turnOrder[this.currentDescriberIndex];
        if (pid !== currentPid) return;

        const text = ((payload.text as string) || "").trim();
        if (!text) return;

        ucp.description = text;
        ucp.hasDescribed = true;
        this.clueHistory.push({
          playerId: pid,
          playerName: ucp.name,
          text,
          round: this.round,
        });

        this.clearTimers();
        this.moveToNextDescriber();
        break;
      }

      case "vote": {
        if (this.phase !== "vote") return;
        if (!ucp.alive || ucp.hasVoted) return;

        const targetId = payload.targetId as string;
        if (!targetId || targetId === pid) return;

        const target = this.ucPlayers.get(targetId);
        if (!target || !target.alive) return;

        ucp.vote = targetId;
        ucp.hasVoted = true;

        this.broadcastPersonalizedState();

        const allVoted = Array.from(this.ucPlayers.values())
          .filter((p) => p.alive)
          .every((p) => p.hasVoted);

        if (allVoted) {
          this.resolveVotes();
        }
        break;
      }

      case "mrwhite-guess": {
        if (this.phase !== "mrwhite-guess") return;
        if (ucp.role !== "mrwhite") return;

        const guess = ((payload.guess as string) || "").trim().toLowerCase();
        const correct = guess === this.civilianWord.toLowerCase();

        this.clearTimers();
        this.mrWhiteGuessCorrect = correct;

        if (correct) {
          this.winners = "mrwhite";
          this.phase = "vote-result";
          this.broadcastPersonalizedState();

          this.resultTimeout = setTimeout(() => {
            this.endUndercoverGame();
          }, RESULT_DISPLAY_TIME);
        } else {
          this.phase = "vote-result";
          this.broadcastPersonalizedState();

          this.resultTimeout = setTimeout(() => {
            this.afterVoteResult();
          }, RESULT_DISPLAY_TIME);
        }
        break;
      }
    }
  }

  // ── Personalized state ────────────────────────────────────

  broadcastPersonalizedState() {
    for (const [playerId, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(playerId),
      });
    }
  }

  getStateForPlayer(playerId: string): Record<string, unknown> {
    const me = this.ucPlayers.get(playerId);

    const players = Array.from(this.ucPlayers.values()).map((p) => {
      const isMe = p.id === playerId;
      const isEliminated = !p.alive;

      return {
        id: p.id,
        name: p.name,
        alive: p.alive,
        hasDescribed: p.hasDescribed,
        hasVoted: p.hasVoted,
        description: p.description,
        role:
          isMe || isEliminated || this.phase === "game-over"
            ? p.role
            : null,
        word:
          isMe
            ? p.word
            : this.phase === "game-over"
              ? p.word
              : null,
      };
    });

    let currentDescriberId: string | null = null;
    if (
      this.phase === "describe" &&
      this.currentDescriberIndex < this.turnOrder.length
    ) {
      currentDescriberId = this.turnOrder[this.currentDescriberIndex];
    }

    return {
      phase: this.phase,
      round: this.round,
      players,
      turnOrder: this.turnOrder,
      currentDescriberId,
      clueHistory: this.clueHistory,
      timeLeft: this.timeLeft,
      myRole: me?.role ?? null,
      myWord: me?.word ?? null,
      eliminatedPlayerId: this.eliminatedPlayerId,
      eliminatedRole: this.eliminatedRole,
      mrWhiteGuessCorrect: this.mrWhiteGuessCorrect,
      winners: this.winners,
      civilianWord: this.phase === "game-over" ? this.civilianWord : null,
      undercoverWord: this.phase === "game-over" ? this.undercoverWord : null,
    };
  }

  getState(): Record<string, unknown> {
    if (!this.started) {
      return { phase: "waiting", players: [], round: 0 };
    }
    return {
      phase: this.phase,
      round: this.round,
      players: Array.from(this.ucPlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        alive: p.alive,
        hasDescribed: p.hasDescribed,
        hasVoted: p.hasVoted,
        description: p.description,
        role: !p.alive || this.phase === "game-over" ? p.role : null,
        word: null,
      })),
      turnOrder: this.turnOrder,
      currentDescriberId: null,
      clueHistory: this.clueHistory,
      timeLeft: this.timeLeft,
      myRole: null,
      myWord: null,
      eliminatedPlayerId: this.eliminatedPlayerId,
      eliminatedRole: this.eliminatedRole,
      mrWhiteGuessCorrect: this.mrWhiteGuessCorrect,
      winners: this.winners,
      civilianWord: null,
      undercoverWord: null,
    };
  }

  // ── Utilities ─────────────────────────────────────────────

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  shuffleArray<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  clearTimerInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  clearTimers() {
    this.clearTimerInterval();
    if (this.revealTimeout) { clearTimeout(this.revealTimeout); this.revealTimeout = null; }
    if (this.describeTimeout) { clearTimeout(this.describeTimeout); this.describeTimeout = null; }
    if (this.voteTimeout) { clearTimeout(this.voteTimeout); this.voteTimeout = null; }
    if (this.resultTimeout) { clearTimeout(this.resultTimeout); this.resultTimeout = null; }
    if (this.mrWhiteTimeout) { clearTimeout(this.mrWhiteTimeout); this.mrWhiteTimeout = null; }
  }

  cleanup() {
    this.clearTimers();
  }
}
