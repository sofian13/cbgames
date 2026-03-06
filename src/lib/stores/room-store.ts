import { create } from "zustand";
import type { Player, LobbyState } from "@/lib/party/message-types";

interface RoomStore {
  // State
  players: Player[];
  hostId: string | null;
  selectedGameId: string | null;
  status: "waiting" | "ready-check" | "in-game";
  sessionScores: Record<string, number>;
  isConnected: boolean;
  error: string | null;
  debugLastEvent: string | null;
  debugEventCount: number;

  // Actions
  setLobbyState: (state: LobbyState) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (player: Player) => void;
  setSelectedGame: (gameId: string) => void;
  setReadyState: (playerId: string, isReady: boolean) => void;
  setHostId: (playerId: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setSessionScores: (scores: Record<string, number>) => void;
  setStatus: (status: "waiting" | "ready-check" | "in-game") => void;
  setDebugEvent: (event: string) => void;
  reset: () => void;
}

const initialState = {
  players: [],
  hostId: null,
  selectedGameId: null,
  status: "waiting" as const,
  sessionScores: {},
  isConnected: false,
  error: null,
  debugLastEvent: null,
  debugEventCount: 0,
};

export const useRoomStore = create<RoomStore>((set) => ({
  ...initialState,

  setLobbyState: (state) =>
    set({
      players: state.players,
      hostId: state.hostId,
      selectedGameId: state.selectedGameId,
      status: state.status,
      sessionScores: state.sessionScores,
    }),

  addPlayer: (player) =>
    set((s) => ({
      players: s.players.some((p) => p.id === player.id)
        ? s.players.map((p) => (p.id === player.id ? player : p))
        : [...s.players, player],
    })),

  removePlayer: (playerId) =>
    set((s) => ({
      players: s.players.filter((p) => p.id !== playerId),
    })),

  updatePlayer: (player) =>
    set((s) => ({
      players: s.players.map((p) => (p.id === player.id ? player : p)),
    })),

  setSelectedGame: (gameId) => set({ selectedGameId: gameId }),

  setReadyState: (playerId, isReady) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, isReady } : p
      ),
    })),

  setHostId: (playerId) => set({ hostId: playerId }),
  setConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ error }),
  setSessionScores: (scores) => set({ sessionScores: scores }),
  setStatus: (status) => set({ status }),
  setDebugEvent: (event) =>
    set((s) => ({
      debugLastEvent: event,
      debugEventCount: s.debugEventCount + 1,
    })),
  reset: () => set(initialState),
}));
