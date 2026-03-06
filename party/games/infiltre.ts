import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Config -----------------------------------------------
const WORD_REVEAL_TIME = 5000;
const DESCRIBE_TIME = 20;
const VOTE_TIME = 30;
const VOTE_RESULT_TIME = 4000;
const GUESS_TIME = 15;
const MIN_PLAYERS_END = 3;

// -- Word bank (120+ French words) ------------------------
const WORD_BANK: string[] = [
  // Lieux
  "Piscine", "Bibliotheque", "Aeroport", "Hopital", "Restaurant",
  "Boulangerie", "Cinema", "Pharmacie", "Supermarche", "Gare",
  "Stade", "Musee", "Zoo", "Aquarium", "Discotheque",
  "Laverie", "Commissariat", "Casino", "Spa", "Karting",
  "Bowling", "Patinoire", "Creche", "Lycee", "Cimetiere",
  // Evenements
  "Mariage", "Noel", "Halloween", "Anniversaire", "Festival",
  "Camping", "Carnaval", "Enterrement", "Bapteme", "Nouvel An",
  "Rentree scolaire", "Fete foraine", "Concert", "Ramadan",
  // Metiers
  "Dentiste", "Pompier", "Boulanger", "Professeur", "Pilote",
  "Astronaute", "Plombier", "Coiffeur", "Boucher", "Chirurgien",
  "Avocat", "Detective", "Facteur", "Magicien", "Veterinaire",
  // Nourriture
  "Sushi", "Croissant", "Kebab", "Fondue", "Raclette",
  "Couscous", "Pizza", "Hamburger", "Crepe", "Tacos",
  "Tiramisu", "Paella", "Ramen", "Macaron", "Brioche",
  // Jeux video
  "Fortnite", "Minecraft", "FIFA", "Mario", "Pokemon",
  "GTA", "Zelda", "Tetris", "Among Us", "Roblox",
  // Sports
  "Basketball", "Surf", "Boxe", "Escalade", "Ski",
  "Tennis", "Football", "Rugby", "Judo", "Natation",
  "Ping-pong", "Petanque", "Handball", "Escrime",
  // Films / Series
  "Titanic", "Star Wars", "Harry Potter", "Jurassic Park", "Avatar",
  "Spider-Man", "Batman", "Le Roi Lion", "Inception", "Matrix",
  "Squid Game", "Stranger Things", "One Piece", "Naruto",
  // Villes
  "Paris", "Tokyo", "New York", "Dubai", "Marrakech",
  "Rome", "Londres", "Barcelone", "Moscou", "Sydney",
  "Rio de Janeiro", "Le Caire", "Amsterdam",
  // Instruments
  "Guitare", "Batterie", "Violon", "Saxophone", "DJ",
  "Piano", "Trompette", "Flute", "Harpe", "Accordeon",
  // Nature
  "Plage", "Montagne", "Desert", "Jungle", "Grotte",
  "Ile", "Volcan", "Cascade", "Foret", "Glacier",
  "Recif corallien", "Savane", "Marais",
  // Objets / Concepts
  "TikTok", "Netflix", "Uber", "Ikea", "McDonald's",
  "Tinder", "Snapchat", "Photomaton", "Karaoke", "Escape Game",
  "Trampoline", "Jacuzzi", "Sauna", "Limousine",
];

// -- Player state -----------------------------------------
interface InfiltrePlayer {
  id: string;
  name: string;
  score: number;
  isInfiltre: boolean;
  isEliminated: boolean;
  clue: string | null;
  votedFor: string | null;
}

type GamePhase =
  | "waiting"
  | "word-reveal"
  | "describe"
  | "vote"
  | "vote-result"
  | "guess-word"
  | "round-end"
  | "game-over";

// ==========================================================
export class InfiltreGame extends BaseGame {
  gamePlayers: Map<string, InfiltrePlayer> = new Map();
  phase: GamePhase = "waiting";
  secretWord = "";
  infiltreIds: Set<string> = new Set();
  round = 0;
  currentDescriberIndex = 0;
  describeOrder: string[] = [];
  timeLeft = 0;
  timer: ReturnType<typeof setInterval> | null = null;
  clueHistory: { playerId: string; playerName: string; clue: string; round: number }[] = [];
  eliminatedThisRound: string | null = null;
  votes: Map<string, string> = new Map();
  lastGuess: string | null = null;
  lastGuessCorrect: boolean | null = null;

  start() {
    this.started = true;
    this.round = 0;

    for (const [id, player] of this.players) {
      this.gamePlayers.set(id, {
        id,
        name: player.name,
        score: 0,
        isInfiltre: false,
        isEliminated: false,
        clue: null,
        votedFor: null,
      });
    }

    this.secretWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];

    const playerIds = Array.from(this.gamePlayers.keys());
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    let infiltreCount = 1;
    if (playerIds.length >= 6) {
      infiltreCount = Math.random() < 0.5 ? 1 : 2;
    }

    this.infiltreIds.clear();
    for (let i = 0; i < infiltreCount && i < shuffled.length; i++) {
      this.infiltreIds.add(shuffled[i]);
      const p = this.gamePlayers.get(shuffled[i]);
      if (p) p.isInfiltre = true;
    }

    this.startWordReveal();
  }

  // -- Phase: Word Reveal ----------------------------------
  startWordReveal() {
    this.round++;
    this.phase = "word-reveal";
    this.eliminatedThisRound = null;
    this.lastGuess = null;
    this.lastGuessCorrect = null;

    for (const p of this.gamePlayers.values()) {
      if (!p.isEliminated) {
        p.clue = null;
        p.votedFor = null;
      }
    }
    this.votes.clear();

    this.describeOrder = this.getAlivePlayers()
      .map((p) => p.id)
      .sort(() => Math.random() - 0.5);
    this.currentDescriberIndex = 0;

    this.broadcastPersonalizedState();

    setTimeout(() => {
      if (this.phase === "word-reveal") {
        this.startDescribePhase();
      }
    }, WORD_REVEAL_TIME);
  }

  // -- Phase: Describe -------------------------------------
  startDescribePhase() {
    this.phase = "describe";
    this.currentDescriberIndex = 0;
    this.timeLeft = DESCRIBE_TIME;

    this.broadcastPersonalizedState();
    this.startTimer();
  }

  // -- Phase: Vote -----------------------------------------
  startVotePhase() {
    this.stopTimer();
    this.phase = "vote";
    this.timeLeft = VOTE_TIME;
    this.votes.clear();

    for (const p of this.gamePlayers.values()) {
      if (!p.isEliminated) {
        p.votedFor = null;
      }
    }

    this.broadcastPersonalizedState();
    this.startTimer();
  }

  // -- Phase: Vote Result ----------------------------------
  resolveVotes() {
    this.stopTimer();

    const voteCounts: Map<string, number> = new Map();
    for (const targetId of this.votes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1);
    }

    let maxVotes = 0;
    const candidates: string[] = [];
    for (const [pid, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates.length = 0;
        candidates.push(pid);
      } else if (count === maxVotes) {
        candidates.push(pid);
      }
    }

    if (candidates.length === 0) {
      this.phase = "vote-result";
      this.eliminatedThisRound = null;
      this.broadcastPersonalizedState();
      setTimeout(() => this.afterVoteResult(), VOTE_RESULT_TIME);
      return;
    }

    const eliminatedId = candidates[Math.floor(Math.random() * candidates.length)];
    this.eliminatedThisRound = eliminatedId;

    const eliminatedPlayer = this.gamePlayers.get(eliminatedId);
    if (eliminatedPlayer) {
      eliminatedPlayer.isEliminated = true;

      if (eliminatedPlayer.isInfiltre) {
        for (const [voterId, targetId] of this.votes) {
          if (targetId === eliminatedId) {
            const voter = this.gamePlayers.get(voterId);
            if (voter && !voter.isInfiltre) {
              voter.score += 2;
            }
          }
        }
      }
    }

    this.phase = "vote-result";
    this.broadcastPersonalizedState();

    if (eliminatedPlayer?.isInfiltre) {
      const remainingInfiltres = this.getAlivePlayers().filter((p) => p.isInfiltre);
      if (remainingInfiltres.length === 0) {
        setTimeout(() => this.startGuessPhase(eliminatedId), VOTE_RESULT_TIME);
        return;
      }
    }

    setTimeout(() => this.afterVoteResult(), VOTE_RESULT_TIME);
  }

  afterVoteResult() {
    const alive = this.getAlivePlayers();
    const aliveInfiltres = alive.filter((p) => p.isInfiltre);
    const aliveCivilians = alive.filter((p) => !p.isInfiltre);

    if (aliveInfiltres.length > 0 && alive.length <= MIN_PLAYERS_END) {
      for (const inf of aliveInfiltres) inf.score += 3;
      this.endInfiltreGame("infiltre-survives");
      return;
    }

    if (aliveInfiltres.length === 0) {
      for (const c of aliveCivilians) c.score += 2;
      this.endInfiltreGame("civilians-win");
      return;
    }

    if (aliveCivilians.length < 2) {
      for (const inf of aliveInfiltres) inf.score += 3;
      this.endInfiltreGame("infiltre-survives");
      return;
    }

    for (const inf of aliveInfiltres) inf.score += 1;

    this.startWordReveal();
  }

  // -- Phase: Guess Word -----------------------------------
  startGuessPhase(infiltreId: string) {
    this.phase = "guess-word";
    this.timeLeft = GUESS_TIME;
    this.lastGuess = null;
    this.lastGuessCorrect = null;
    this.eliminatedThisRound = infiltreId;

    this.broadcastPersonalizedState();
    this.startTimer();
  }

  resolveGuess(guess: string) {
    this.stopTimer();

    const normalize = (s: string) =>
      s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    this.lastGuess = guess;
    this.lastGuessCorrect = normalize(guess) === normalize(this.secretWord);

    if (this.lastGuessCorrect) {
      const infiltrePlayer = this.eliminatedThisRound
        ? this.gamePlayers.get(this.eliminatedThisRound)
        : null;
      if (infiltrePlayer) infiltrePlayer.score += 3;
      this.phase = "round-end";
      this.broadcastPersonalizedState();
      setTimeout(() => this.endInfiltreGame("infiltre-guesses"), 3000);
    } else {
      for (const p of this.gamePlayers.values()) {
        if (!p.isInfiltre) p.score += 2;
      }
      this.phase = "round-end";
      this.broadcastPersonalizedState();
      setTimeout(() => this.endInfiltreGame("civilians-win"), 3000);
    }
  }

  // -- End Game --------------------------------------------
  endInfiltreGame(_reason: string) {
    this.stopTimer();
    this.phase = "game-over";

    const players = Array.from(this.gamePlayers.values());
    players.sort((a, b) => b.score - a.score);

    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));

    this.broadcastFinalReveal();
    setTimeout(() => this.endGame(rankings), 500);
  }

  broadcastFinalReveal() {
    const base = this.buildPublicState();
    base.secretWord = this.secretWord;
    base.infiltreIds = Array.from(this.infiltreIds);
    base.lastGuess = this.lastGuess;
    base.lastGuessCorrect = this.lastGuessCorrect;

    this.broadcast({ type: "game-state", payload: base });
  }

  // -- Timer -----------------------------------------------
  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({ type: "game-update", payload: { timeLeft: this.timeLeft } });
      if (this.timeLeft <= 0) this.onTimerExpired();
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onTimerExpired() {
    this.stopTimer();

    if (this.phase === "describe") {
      const describerId = this.describeOrder[this.currentDescriberIndex];
      const describer = this.gamePlayers.get(describerId);
      if (describer && !describer.clue) {
        describer.clue = "(temps ecoule)";
        this.clueHistory.push({
          playerId: describer.id,
          playerName: describer.name,
          clue: "(temps ecoule)",
          round: this.round,
        });
      }
      this.advanceDescriber();
    } else if (this.phase === "vote") {
      this.resolveVotes();
    } else if (this.phase === "guess-word") {
      this.lastGuess = null;
      this.lastGuessCorrect = false;
      for (const p of this.gamePlayers.values()) {
        if (!p.isInfiltre) p.score += 2;
      }
      this.phase = "round-end";
      this.broadcastPersonalizedState();
      setTimeout(() => this.endInfiltreGame("civilians-win"), 3000);
    }
  }

  advanceDescriber() {
    this.currentDescriberIndex++;

    while (
      this.currentDescriberIndex < this.describeOrder.length &&
      this.gamePlayers.get(this.describeOrder[this.currentDescriberIndex])?.isEliminated
    ) {
      this.currentDescriberIndex++;
    }

    if (this.currentDescriberIndex >= this.describeOrder.length) {
      this.startVotePhase();
    } else {
      this.timeLeft = DESCRIBE_TIME;
      this.broadcastPersonalizedState();
      this.startTimer();
    }
  }

  // -- Message Handler -------------------------------------
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const senderPlayer = this.findPlayerByConnection(sender.id);
    if (!senderPlayer) return;

    const gamePlayer = this.gamePlayers.get(senderPlayer.id);
    if (!gamePlayer) return;

    if (action === "describe" && this.phase === "describe") {
      if (gamePlayer.isEliminated) return;
      const currentDescriberId = this.describeOrder[this.currentDescriberIndex];
      if (senderPlayer.id !== currentDescriberId) return;

      const clue = ((payload.clue as string) ?? "").trim();
      if (!clue) return;

      gamePlayer.clue = clue;
      this.clueHistory.push({
        playerId: gamePlayer.id,
        playerName: gamePlayer.name,
        clue,
        round: this.round,
      });

      this.stopTimer();
      this.advanceDescriber();
      return;
    }

    if (action === "vote" && this.phase === "vote") {
      if (gamePlayer.isEliminated) return;
      const targetId = payload.targetId as string;
      if (!targetId || targetId === senderPlayer.id) return;

      const target = this.gamePlayers.get(targetId);
      if (!target || target.isEliminated) return;

      gamePlayer.votedFor = targetId;
      this.votes.set(senderPlayer.id, targetId);

      this.broadcastPersonalizedState();

      const alive = this.getAlivePlayers();
      if (alive.every((p) => p.votedFor !== null)) {
        this.resolveVotes();
      }
      return;
    }

    if (action === "guess-word" && this.phase === "guess-word") {
      if (senderPlayer.id !== this.eliminatedThisRound) return;

      const word = ((payload.word as string) ?? "").trim();
      if (!word) return;

      this.resolveGuess(word);
      return;
    }
  }

  // -- Helpers ---------------------------------------------
  getAlivePlayers(): InfiltrePlayer[] {
    return Array.from(this.gamePlayers.values()).filter((p) => !p.isEliminated);
  }

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  // -- Personalized State Broadcasting ---------------------
  broadcastPersonalizedState() {
    for (const [pid, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(pid),
      });
    }
  }

  getStateForPlayer(pid: string): Record<string, unknown> {
    const state = this.buildPublicState();
    const gamePlayer = this.gamePlayers.get(pid);

    if (gamePlayer) {
      state.myRole = gamePlayer.isInfiltre ? "infiltre" : "civilian";
      state.secretWord = gamePlayer.isInfiltre ? null : this.secretWord;
    }

    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const currentDescriberId =
      this.phase === "describe" && this.currentDescriberIndex < this.describeOrder.length
        ? this.describeOrder[this.currentDescriberIndex]
        : null;

    let voteTally: Record<string, number> | null = null;
    let voteDetails: { voterId: string; voterName: string; targetId: string }[] | null = null;

    if (
      this.phase === "vote-result" ||
      this.phase === "guess-word" ||
      this.phase === "round-end" ||
      this.phase === "game-over"
    ) {
      voteTally = {};
      voteDetails = [];
      for (const [voterId, targetId] of this.votes) {
        voteTally[targetId] = (voteTally[targetId] ?? 0) + 1;
        const voter = this.gamePlayers.get(voterId);
        if (voter) {
          voteDetails.push({ voterId, voterName: voter.name, targetId });
        }
      }
    }

    return {
      phase: this.phase,
      round: this.round,
      timeLeft: this.timeLeft,
      currentDescriberId,
      describeOrder: this.describeOrder,
      eliminatedThisRound: this.eliminatedThisRound,
      eliminatedIsInfiltre: this.eliminatedThisRound
        ? this.gamePlayers.get(this.eliminatedThisRound)?.isInfiltre ?? false
        : null,
      infiltreCount: this.infiltreIds.size,
      voteTally,
      voteDetails,
      lastGuess:
        this.phase === "round-end" || this.phase === "game-over" ? this.lastGuess : null,
      lastGuessCorrect:
        this.phase === "round-end" || this.phase === "game-over" ? this.lastGuessCorrect : null,
      clueHistory: this.clueHistory,
      players: Array.from(this.gamePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isEliminated: p.isEliminated,
        hasClue: p.clue !== null,
        hasVoted: p.votedFor !== null,
        isInfiltre:
          this.phase === "game-over" || this.phase === "round-end"
            ? p.isInfiltre
            : p.id === this.eliminatedThisRound &&
                (this.phase === "vote-result" || this.phase === "guess-word")
              ? p.isInfiltre
              : null,
      })),
    };
  }

  getState(): Record<string, unknown> {
    return {
      phase: this.phase,
      round: this.round,
      timeLeft: this.timeLeft,
      players: Array.from(this.gamePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isEliminated: p.isEliminated,
        hasClue: p.clue !== null,
        hasVoted: p.votedFor !== null,
        isInfiltre: null,
      })),
      clueHistory: this.clueHistory,
      infiltreCount: this.infiltreIds.size,
    };
  }

  cleanup() {
    this.stopTimer();
  }
}
