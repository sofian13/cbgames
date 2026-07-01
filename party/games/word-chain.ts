import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

import frenchWordsData from "../data/french-words.json";

// Strip diacritics so "élève" matches "eleve" (même dico que bomb-party : ~194k mots)
const stripAccents = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Dictionnaire FR (JSON déjà normalisé : minuscules, sans accents). Construit à la
// DEMANDE (paresseux + mémoïsé) pour ne pas plomber le boot du Worker PartyKit.
let frenchWordSet: Set<string> | null = null;
function getFrenchWords(): Set<string> {
  if (!frenchWordSet) frenchWordSet = new Set(frenchWordsData as string[]);
  return frenchWordSet;
}

const INITIAL_TIME = 8;
const MIN_TIME = 4;
const LIVES = 3;
const MIN_WORD_LENGTH = 3;

// Starting words that work well (common letters at end)
const STARTER_WORDS = [
  "maison", "table", "arbre", "route", "monde",
  "livre", "femme", "terre", "porte", "homme",
];

interface ChainPlayer {
  id: string;
  name: string;
  lives: number;
  score: number;
  isAlive: boolean;
}

export class WordChainGame extends BaseGame {
  chainPlayers: Map<string, ChainPlayer> = new Map();
  turnOrder: string[] = [];
  currentTurnIndex = 0;
  lastWord = "";
  requiredLetter = "";
  usedWords: Set<string> = new Set();
  timeLeft = INITIAL_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  round = 1;
  status: "waiting" | "playing" | "game-over" = "waiting";

  getCurrentTime(): number {
    return Math.max(MIN_TIME, INITIAL_TIME - Math.floor(this.round / 5));
  }

  start() {
    this.started = true;
    this.status = "playing";

    for (const [id, player] of this.players) {
      this.chainPlayers.set(id, {
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

    // Pick a random starting word
    const starter = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
    this.lastWord = starter;
    this.requiredLetter = starter[starter.length - 1].toUpperCase();
    this.usedWords.add(starter);

    this.startNewTurn();
  }

  startNewTurn() {
    if (this.status === "game-over") return;

    // Skip eliminated players
    let attempts = 0;
    while (attempts < this.turnOrder.length) {
      const playerId = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
      const cp = this.chainPlayers.get(playerId);
      if (cp?.isAlive) break;
      this.currentTurnIndex++;
      attempts++;
    }

    if (attempts >= this.turnOrder.length) {
      this.endWordChain();
      return;
    }

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
        this.onTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onTimeUp() {
    this.stopTimer();
    const currentPlayerId = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
    const cp = this.chainPlayers.get(currentPlayerId);
    if (!cp) return;

    cp.lives--;
    if (cp.lives <= 0) {
      cp.isAlive = false;
    }

    const alivePlayers = Array.from(this.chainPlayers.values()).filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      if (alivePlayers.length === 1) {
        alivePlayers[0].score += 10;
      }
      this.endWordChain();
      return;
    }

    this.broadcast({
      type: "round-result",
      payload: {
        event: "time-up",
        playerId: currentPlayerId,
        playerName: cp.name,
        livesLeft: cp.lives,
        isEliminated: !cp.isAlive,
      },
    });

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

      if (word.length < MIN_WORD_LENGTH) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: `Le mot doit faire au moins ${MIN_WORD_LENGTH} lettres` },
        });
        return;
      }

      if (word[0].toUpperCase() !== this.requiredLetter) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: `Le mot doit commencer par "${this.requiredLetter}"` },
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

      // Valid word!
      this.stopTimer();
      this.usedWords.add(word);
      this.lastWord = word;
      this.requiredLetter = word[word.length - 1].toUpperCase();

      const cp = this.chainPlayers.get(currentPlayerId);
      if (cp) {
        cp.score++;
      }

      this.broadcast({
        type: "round-result",
        payload: {
          event: "word-accepted",
          playerId: currentPlayerId,
          word,
          nextLetter: this.requiredLetter,
        },
      });

      this.round++;
      this.currentTurnIndex++;
      setTimeout(() => this.startNewTurn(), 1000);
    }
  }

  endWordChain() {
    this.stopTimer();
    this.status = "game-over";

    const players = Array.from(this.chainPlayers.values());
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
      lastWord: this.lastWord,
      requiredLetter: this.requiredLetter,
      players: Array.from(this.chainPlayers.values()),
      timeLeft: this.timeLeft,
      status: this.status,
      usedWords: Array.from(this.usedWords),
      round: this.round,
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
