import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";
import frenchWordsData from "../data/french-words.json";

// Strip diacritics so "élève" matches "eleve"
const stripAccents = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Dictionnaire FR (le JSON est déjà normalisé : minuscules, sans accents, dédupé).
// On construit le Set à la DEMANDE (paresseux + mémoïsé) au lieu du chargement du
// module : sinon chaque salle payait ce coût au boot du Worker PartyKit (194k
// normalize()), ce qui dépassait le budget CPU de démarrage → salle qui ne se
// lançait pas ("faut relancer PartyKit").
let frenchWordSet: Set<string> | null = null;
function getFrenchWords(): Set<string> {
  if (!frenchWordSet) frenchWordSet = new Set(frenchWordsData as string[]);
  return frenchWordSet;
}

// Common French syllables for the game
const SYLLABLES = [
  "AB", "AC", "AD", "AI", "AL", "AM", "AN", "AP", "AR", "AS", "AT", "AU", "AV",
  "BA", "BE", "BI", "BL", "BO", "BR", "BU",
  "CA", "CE", "CH", "CI", "CL", "CO", "CR", "CU",
  "DA", "DE", "DI", "DO", "DR", "DU",
  "EA", "EC", "EF", "EL", "EM", "EN", "EP", "ER", "ES", "ET", "EU", "EV", "EX",
  "FA", "FE", "FI", "FL", "FO", "FR", "FU",
  "GA", "GE", "GI", "GL", "GN", "GO", "GR", "GU",
  "HA", "HE", "HI", "HO", "HU",
  "IA", "IC", "ID", "IF", "IL", "IM", "IN", "IO", "IR", "IS", "IT", "IV",
  "JA", "JE", "JO", "JU",
  "LA", "LE", "LI", "LO", "LU",
  "MA", "ME", "MI", "MO", "MU",
  "NA", "NE", "NI", "NO", "NU",
  "OB", "OC", "OI", "OM", "ON", "OP", "OR", "OS", "OU", "OV",
  "PA", "PE", "PH", "PI", "PL", "PO", "PR", "PU",
  "QU",
  "RA", "RE", "RI", "RO", "RU",
  "SA", "SC", "SE", "SI", "SO", "SP", "ST", "SU",
  "TA", "TE", "TH", "TI", "TO", "TR", "TU",
  "UL", "UN", "UR", "US", "UT",
  "VA", "VE", "VI", "VO", "VU",
];

const INITIAL_TIME = 10; // seconds per turn
const MIN_TIME = 4; // minimum time per turn (decreases over rounds)
const LIVES = 3;
const MIN_WORD_LENGTH = 3;

interface BombPartyPlayer {
  id: string;
  name: string;
  lives: number;
  score: number;
  isAlive: boolean;
  lastWord?: string;
}

export class BombPartyGame extends BaseGame {
  bombPlayers: Map<string, BombPartyPlayer> = new Map();
  turnOrder: string[] = [];
  currentTurnIndex = 0;
  currentSyllable = "";
  usedWords: Set<string> = new Set();
  timeLeft = INITIAL_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  round = 1;
  status: "waiting" | "playing" | "round-end" | "game-over" = "waiting";

  getRandomSyllable(): string {
    return SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)];
  }

  getCurrentTime(): number {
    // Timer gets shorter as rounds progress
    return Math.max(MIN_TIME, INITIAL_TIME - Math.floor(this.round / 3));
  }

  start() {
    this.started = true;
    this.status = "playing";

    // Initialize bomb party players from connected players
    for (const [id, player] of this.players) {
      this.bombPlayers.set(id, {
        id,
        name: player.name,
        lives: LIVES,
        score: 0,
        isAlive: true,
      });
      this.turnOrder.push(id);
    }

    // Shuffle turn order
    for (let i = this.turnOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.turnOrder[i], this.turnOrder[j]] = [this.turnOrder[j], this.turnOrder[i]];
    }

    this.startNewTurn();
  }

  startNewTurn() {
    if (this.status === "game-over") return;

    // Skip eliminated players
    let attempts = 0;
    while (attempts < this.turnOrder.length) {
      const playerId = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
      const bp = this.bombPlayers.get(playerId);
      if (bp?.isAlive) break;
      this.currentTurnIndex++;
      attempts++;
    }

    if (attempts >= this.turnOrder.length) {
      this.endBombParty();
      return;
    }

    this.currentSyllable = this.getRandomSyllable();
    this.timeLeft = this.getCurrentTime();

    this.broadcastState();
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({
        type: "game-update",
        payload: { timeLeft: this.timeLeft },
      });

      if (this.timeLeft <= 0) {
        this.onBombExplode();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onBombExplode() {
    this.stopTimer();
    const currentPlayerId = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
    const bp = this.bombPlayers.get(currentPlayerId);
    if (!bp) return;

    bp.lives--;
    if (bp.lives <= 0) {
      bp.isAlive = false;
    }

    // Check if only one player left
    const alivePlayers = Array.from(this.bombPlayers.values()).filter((p) => p.isAlive);
    if (alivePlayers.length <= 1) {
      // Award score to winner
      if (alivePlayers.length === 1) {
        alivePlayers[0].score += 10;
      }
      this.endBombParty();
      return;
    }

    this.broadcast({
      type: "round-result",
      payload: {
        event: "bomb-exploded",
        playerId: currentPlayerId,
        playerName: bp.name,
        livesLeft: bp.lives,
        isEliminated: !bp.isAlive,
      },
    });

    // Move to next turn
    this.round++;
    this.currentTurnIndex++;
    setTimeout(() => this.startNewTurn(), 2000);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;

    if (action === "submit-word") {
      const word = stripAccents((payload.word as string || "").trim());
      const senderPlayer = this.findGamePlayerByConnection(sender.id);
      if (!senderPlayer) return;

      const currentPlayerId = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
      if (senderPlayer.id !== currentPlayerId) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce n'est pas ton tour !" },
        });
        return;
      }

      // Validate word
      if (word.length < MIN_WORD_LENGTH) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: `Le mot doit faire au moins ${MIN_WORD_LENGTH} lettres` },
        });
        return;
      }

      if (!word.toUpperCase().includes(this.currentSyllable)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: `Le mot doit contenir "${this.currentSyllable}"` },
        });
        return;
      }

      if (this.usedWords.has(word)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce mot a deja ete utilise !" },
        });
        return;
      }

      if (!getFrenchWords().has(word)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce mot n'est pas dans le dictionnaire" },
        });
        return;
      }

      // Word is valid!
      this.stopTimer();
      this.usedWords.add(word);

      const bp = this.bombPlayers.get(currentPlayerId);
      if (bp) {
        bp.score++;
        bp.lastWord = word;
      }

      this.broadcast({
        type: "round-result",
        payload: {
          event: "word-accepted",
          playerId: currentPlayerId,
          word,
        },
      });

      // Next turn
      this.round++;
      this.currentTurnIndex++;
      setTimeout(() => this.startNewTurn(), 1000);
    }
  }

  endBombParty() {
    this.stopTimer();
    this.status = "game-over";

    const players = Array.from(this.bombPlayers.values());
    // Sort by: alive first, then by score, then by lives
    players.sort((a, b) => {
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      if (a.score !== b.score) return b.score - a.score;
      return b.lives - a.lives;
    });

    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));

    this.endGame(rankings);
  }

  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  getState(): Record<string, unknown> {
    return {
      currentPlayerId: this.turnOrder[this.currentTurnIndex % this.turnOrder.length] ?? null,
      syllable: this.currentSyllable,
      players: Array.from(this.bombPlayers.values()),
      timeLeft: this.timeLeft,
      round: this.round,
      status: this.status,
      usedWords: Array.from(this.usedWords),
    };
  }

  broadcastState() {
    this.broadcast({
      type: "game-state",
      payload: this.getState(),
    });
  }

  cleanup() {
    this.stopTimer();
  }
}
