import { create } from "zustand";
import type { GameRanking } from "@/lib/party/message-types";

interface GameStore {
  // State
  gameId: string | null;
  gameState: Record<string, unknown>;
  isConnected: boolean;
  isGameOver: boolean;
  rankings: GameRanking[];
  error: string | null;

  // Actions
  setGameId: (gameId: string) => void;
  setGameState: (state: Record<string, unknown>) => void;
  updateGameState: (partial: Record<string, unknown>) => void;
  setConnected: (connected: boolean) => void;
  setGameOver: (rankings: GameRanking[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  gameId: null,
  gameState: {},
  isConnected: false,
  isGameOver: false,
  rankings: [],
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setGameId: (gameId) => set({ gameId }),

  setGameState: (state) => set({ gameState: state }),

  updateGameState: (partial) =>
    set((s) => ({ gameState: { ...s.gameState, ...partial } })),

  setConnected: (connected) => set({ isConnected: connected }),

  setGameOver: (rankings) => set({ isGameOver: true, rankings }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
