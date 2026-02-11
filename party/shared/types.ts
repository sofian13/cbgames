// Server-side player (includes connectionId for internal routing)
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isGuest: boolean;
  connectionId: string;
}

// Serialized player sent to clients (no connectionId)
export type ClientPlayer = Omit<Player, "connectionId">;

export interface LobbyState {
  players: ClientPlayer[];
  selectedGameId: string | null;
  hostId: string;
  status: "waiting" | "ready-check" | "in-game";
  sessionScores: Record<string, number>;
}

export interface GameRanking {
  playerId: string;
  playerName: string;
  rank: number;
  score: number;
}
