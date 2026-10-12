import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";
import frenchWordsData from "../data/french-words.json";

// Normalise : minuscules, sans accents, ligatures œ/æ éclatées ("cœur" → "coeur")
const normalizeWord = (s: string) =>
  s
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’`´]/g, "'")
    .trim();

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

// Anglicismes / mots du quotidien absents du dictionnaire (forme sans séparateur).
const EXTRA_WORDS = new Set([
  "selfie", "wifi", "weekend", "hashtag", "podcast", "smartphone", "burger", "tshirt",
  "sweat", "fun", "manga", "cookie", "spam", "bug", "geek", "blog", "rap", "tweet",
  "story", "like", "stream", "streaming", "gamer", "youtubeur", "influenceur",
  "startup", "bitcoin", "emoji", "fake", "casting", "dressing", "piercing", "airbag",
  "bluetooth", "cupcake", "donut", "pancake", "smoothie", "tacos", "kebab", "wrap",
  "nugget", "feedback", "deadline", "coworking", "freelance", "hacker", "login",
  "replay", "spoiler", "playlist", "remix", "tuto", "vlog", "texto", "appli",
  "snowboard", "fitness", "running", "trail", "aujourdhui", "foodtruck", "team",
]);

function isKnownWord(w: string): boolean {
  if (!w) return false;
  if (getFrenchWords().has(w) || EXTRA_WORDS.has(w)) return true;
  // pluriel simple des anglicismes (selfies, burgers…)
  return w.endsWith("s") && EXTRA_WORDS.has(w.slice(0, -1));
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
const PAUSE_AFTER_WORD_MS = 1000;
const PAUSE_AFTER_BOOM_MS = 2000;

interface BombPartyPlayer {
  id: string;
  name: string;
  lives: number;
  score: number;
  isAlive: boolean;
  lastWord?: string;
}

/** Dernier événement marquant, lu par le client pour ses retours visuels. */
interface BombPartyEvent {
  kind: "word" | "boom" | "eliminated" | "left";
  playerId: string;
  playerName: string;
  word?: string;
  livesLeft?: number;
  at: number;
}

export class BombPartyGame extends BaseGame {
  bombPlayers: Map<string, BombPartyPlayer> = new Map();
  turnOrder: string[] = [];
  currentTurnIndex = 0;
  currentSyllable = "";
  usedWords: Set<string> = new Set();
  timeLeft = INITIAL_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  nextTurnTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Vrai entre la fin d'un tour et le début du suivant : aucune saisie acceptée. */
  turnLocked = false;
  round = 1;
  status: "waiting" | "playing" | "round-end" | "game-over" = "waiting";
  /** Ids dans l'ordre d'élimination (premier éliminé en tête). */
  eliminationOrder: string[] = [];
  lastEvent: BombPartyEvent | null = null;

  getRandomSyllable(): string {
    return SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)];
  }

  getCurrentTime(): number {
    // Timer gets shorter as rounds progress
    return Math.max(MIN_TIME, INITIAL_TIME - Math.floor(this.round / 3));
  }

  get currentPlayerId(): string | undefined {
    return this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
  }

  /** Le joueur est-il toujours connecté (ou un bot) ? */
  isPresent(id: string): boolean {
    return this.players.has(id);
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

  eliminate(bp: BombPartyPlayer) {
    if (!bp.isAlive) return;
    bp.isAlive = false;
    bp.lives = 0;
    this.eliminationOrder.push(bp.id);
  }

  /** Fin de partie si au plus un survivant. Renvoie true si la partie est finie. */
  checkGameOver(): boolean {
    const alive = Array.from(this.bombPlayers.values()).filter((p) => p.isAlive);
    if (alive.length > 1) return false;
    if (alive.length === 1) alive[0].score += 10;
    this.endBombParty();
    return true;
  }

  /** Programme le tour suivant après une pause, saisie verrouillée entre-temps. */
  scheduleNextTurn(delay: number) {
    this.turnLocked = true;
    if (this.nextTurnTimeout) clearTimeout(this.nextTurnTimeout);
    this.nextTurnTimeout = setTimeout(() => {
      this.nextTurnTimeout = null;
      this.startNewTurn();
    }, delay);
  }

  startNewTurn() {
    if (this.status === "game-over") return;

    // Joueurs déconnectés : éliminés tout de suite plutôt que d'attendre leurs 3 bombes
    for (const bp of this.bombPlayers.values()) {
      if (bp.isAlive && !this.isPresent(bp.id)) {
        this.eliminate(bp);
        this.lastEvent = { kind: "left", playerId: bp.id, playerName: bp.name, at: Date.now() };
      }
    }
    if (this.checkGameOver()) return;

    // Skip eliminated players
    let attempts = 0;
    while (attempts < this.turnOrder.length) {
      const bp = this.bombPlayers.get(this.currentPlayerId ?? "");
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
    this.turnLocked = false;

    this.broadcastState();
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      // Le joueur dont c'est le tour s'est déconnecté → on passe immédiatement
      const pid = this.currentPlayerId;
      if (pid && !this.isPresent(pid)) {
        this.stopTimer();
        const bp = this.bombPlayers.get(pid);
        if (bp) {
          this.eliminate(bp);
          this.lastEvent = { kind: "left", playerId: bp.id, playerName: bp.name, at: Date.now() };
        }
        if (this.checkGameOver()) return;
        this.currentTurnIndex++;
        this.startNewTurn();
        return;
      }

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
    if (this.turnLocked || this.status !== "playing") return;
    const currentPlayerId = this.currentPlayerId;
    const bp = this.bombPlayers.get(currentPlayerId ?? "");
    if (!bp) return;

    bp.lives--;
    if (bp.lives <= 0) this.eliminate(bp);

    this.lastEvent = {
      kind: bp.isAlive ? "boom" : "eliminated",
      playerId: bp.id,
      playerName: bp.name,
      livesLeft: bp.lives,
      at: Date.now(),
    };

    if (this.checkGameOver()) return;

    // Move to next turn
    this.round++;
    this.currentTurnIndex++;
    this.scheduleNextTurn(PAUSE_AFTER_BOOM_MS);
    // currentTurnIndex a avancé mais le tour suivant n'a pas commencé :
    // l'état diffusé reste verrouillé (turnLocked) jusqu'à startNewTurn.
    this.broadcastState();
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;

    if (action === "submit-word") {
      const senderPlayer = this.findGamePlayerByConnection(sender.id);
      if (!senderPlayer) return;
      if (this.status !== "playing" || this.turnLocked) return;

      const currentPlayerId = this.currentPlayerId;
      if (senderPlayer.id !== currentPlayerId) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce n'est pas ton tour !" },
        });
        return;
      }

      const raw = normalizeWord(String(payload.word ?? ""));
      // Deux formes testées : avec séparateurs ("week-end") et sans ("weekend")
      const collapsed = raw.replace(/[-' ]/g, "");
      if (!/^[a-z]+$/.test(collapsed)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Uniquement des lettres, s'il te plaît" },
        });
        return;
      }

      // Validate word
      if (collapsed.length < MIN_WORD_LENGTH) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: `Le mot doit faire au moins ${MIN_WORD_LENGTH} lettres` },
        });
        return;
      }

      const syl = this.currentSyllable.toLowerCase();
      if (!collapsed.includes(syl) && !raw.includes(syl)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: `Le mot doit contenir « ${this.currentSyllable} »` },
        });
        return;
      }

      if (this.usedWords.has(collapsed)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce mot a déjà été utilisé !" },
        });
        return;
      }

      if (!isKnownWord(raw) && !isKnownWord(collapsed)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce mot n'est pas dans le dictionnaire" },
        });
        return;
      }

      // Word is valid!
      this.stopTimer();
      this.usedWords.add(collapsed);

      const bp = this.bombPlayers.get(senderPlayer.id);
      if (bp) {
        bp.score++;
        bp.lastWord = raw;
      }

      this.lastEvent = {
        kind: "word",
        playerId: senderPlayer.id,
        playerName: bp?.name ?? senderPlayer.name,
        word: raw,
        at: Date.now(),
      };

      // Next turn
      this.round++;
      this.currentTurnIndex++;
      this.scheduleNextTurn(PAUSE_AFTER_WORD_MS);
      this.broadcastState();
    }
  }

  endBombParty() {
    this.stopTimer();
    if (this.nextTurnTimeout) {
      clearTimeout(this.nextTurnTimeout);
      this.nextTurnTimeout = null;
    }
    if (this.status === "game-over") return;
    this.status = "game-over";
    this.turnLocked = true;

    const players = Array.from(this.bombPlayers.values());
    // Survivant(s) d'abord, puis les éliminés du dernier au premier
    const elimRank = (id: string) => this.eliminationOrder.indexOf(id);
    players.sort((a, b) => {
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      if (!a.isAlive) {
        const d = elimRank(b.id) - elimRank(a.id);
        if (d !== 0) return d;
      }
      if (a.score !== b.score) return b.score - a.score;
      return b.lives - a.lives;
    });

    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));

    this.broadcastState();
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
      // Pendant la pause entre deux tours, personne n'a la main
      currentPlayerId: this.turnLocked ? null : this.currentPlayerId ?? null,
      syllable: this.currentSyllable,
      players: Array.from(this.bombPlayers.values()),
      timeLeft: this.timeLeft,
      round: this.round,
      status: this.status,
      usedWords: Array.from(this.usedWords),
      turnLocked: this.turnLocked,
      lastEvent: this.lastEvent,
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
    if (this.nextTurnTimeout) {
      clearTimeout(this.nextTurnTimeout);
      this.nextTurnTimeout = null;
    }
  }
}
