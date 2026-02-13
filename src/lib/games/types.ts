import type { ComponentType } from "react";

export interface GameMeta {
  id: string;
  name: string;
  description: string;
  category: "words" | "trivia" | "speed" | "strategy" | "social" | "cards" | "party" | "sport";
  minPlayers: number;
  maxPlayers: number;
  icon: string;
  implemented: boolean;
  rules: string[];
  component: () => Promise<{ default: ComponentType<GameProps> }>;
}

export interface GameProps {
  roomCode: string;
  playerId: string;
  playerName: string;
}

export interface SessionScore {
  playerId: string;
  playerName: string;
  totalScore: number;
  gamesPlayed: number;
  wins: number;
}

export interface GameResult {
  gameId: string;
  rankings: {
    playerId: string;
    playerName: string;
    rank: number;
    score: number;
  }[];
}
