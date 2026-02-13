// ===== Player =====
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isGuest: boolean;
}

// ===== Lobby Messages (Client → Server) =====
export type LobbyClientMessage =
  | { type: "join"; payload: { playerId: string; name: string; avatar?: string; isGuest: boolean } }
  | { type: "select-game"; payload: { gameId: string } }
  | { type: "toggle-ready" }
  | { type: "start-game" }
  | { type: "kick-player"; payload: { playerId: string } }
  | { type: "return-to-lobby" };

// ===== Lobby Messages (Server → Client) =====
export type LobbyServerMessage =
  | { type: "lobby-state"; payload: LobbyState }
  | { type: "player-joined"; payload: { player: Player } }
  | { type: "player-left"; payload: { playerId: string } }
  | { type: "player-updated"; payload: { player: Player } }
  | { type: "game-selected"; payload: { gameId: string } }
  | { type: "ready-changed"; payload: { playerId: string; isReady: boolean } }
  | { type: "game-starting"; payload: { gameId: string; roomCode: string } }
  | { type: "error"; payload: { message: string } }
  | { type: "host-changed"; payload: { playerId: string } }
  | { type: "scores-updated"; payload: { scores: Record<string, number> } }
  | { type: "game-ended"; payload: { scores: Record<string, number> } };

export interface LobbyState {
  players: Player[];
  selectedGameId: string | null;
  hostId: string;
  status: "waiting" | "ready-check" | "in-game";
  sessionScores: Record<string, number>;
}

// ===== Game Messages (Client → Server) =====
export type GameClientMessage =
  | { type: "game-join"; payload: { playerId: string; name: string } }
  | { type: "game-action"; payload: Record<string, unknown> };

// ===== Game Messages (Server → Client) =====
export type GameServerMessage =
  | { type: "game-state"; payload: Record<string, unknown> }
  | { type: "game-update"; payload: Record<string, unknown> }
  | { type: "game-over"; payload: { rankings: GameRanking[] } }
  | { type: "game-error"; payload: { message: string } }
  | { type: "round-result"; payload: Record<string, unknown> };

export interface GameRanking {
  playerId: string;
  playerName: string;
  rank: number;
  score: number;
}

// ===== Bomb Party Specific =====
export interface BombPartyState {
  currentPlayerId: string;
  syllable: string;
  players: BombPartyPlayer[];
  timeLeft: number;
  round: number;
  status: "waiting" | "playing" | "round-end" | "game-over";
  usedWords: string[];
}

export interface BombPartyPlayer {
  id: string;
  name: string;
  lives: number;
  score: number;
  isAlive: boolean;
  lastWord?: string;
}

export type BombPartyAction =
  | { type: "game-action"; payload: { action: "submit-word"; word: string } }
  | { type: "game-action"; payload: { action: "tick" } };

// ===== Speed Quiz Specific =====
export interface SpeedQuizState {
  currentQuestion: {
    text: string;
    category: string;
    difficulty: "easy" | "medium" | "hard";
    image?: string | null;
    index: number;
    total: number;
  } | null;
  players: SpeedQuizPlayer[];
  timeLeft: number;
  status: "waiting" | "question" | "validating" | "scores" | "game-over";
  round: number;
  hostId: string | null;
  // Validation phase
  answers?: SpeedQuizAnswer[];
  currentValidationIndex?: number;
  referenceAnswers?: string[]; // hint for the host
}

export interface SpeedQuizPlayer {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
}

export interface SpeedQuizAnswer {
  playerId: string;
  playerName: string;
  answer: string | null; // null if not yet revealed
  validated: boolean;
  correct: boolean | null;
}

// ===== Word Chain Specific =====
export interface WordChainState {
  currentPlayerId: string;
  lastWord: string;
  requiredLetter: string;
  players: WordChainPlayer[];
  timeLeft: number;
  status: "waiting" | "playing" | "game-over";
  usedWords: string[];
  round: number;
}

export interface WordChainPlayer {
  id: string;
  name: string;
  lives: number;
  score: number;
  isAlive: boolean;
}

// ===== Reaction Time Specific =====
export interface ReactionTimeState {
  players: ReactionTimePlayer[];
  status: "waiting" | "red" | "green" | "results" | "game-over";
  round: number;
  totalRounds: number;
  roundResults?: ReactionRoundResult[];
}

export interface ReactionTimePlayer {
  id: string;
  name: string;
  totalScore: number;
  roundTime?: number;
  penalty: boolean;
  clicked: boolean;
}

export interface ReactionRoundResult {
  playerId: string;
  time: number;
  penalty: boolean;
}
