"use client";

import { useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import { useGameStore } from "@/lib/stores/game-store";
import type {
  GameClientMessage,
  GameServerMessage,
} from "@/lib/party/message-types";

export function useGame(roomCode: string, gameId: string, playerId: string, playerName: string) {
  const socketRef = useRef<PartySocket | null>(null);
  const store = useGameStore();

  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
    const protocol = host.startsWith("localhost") ? "ws" : "wss";

    const socket = new PartySocket({
      host,
      room: `${roomCode}-${gameId}`,
      party: "game",
      protocol,
    });

    socketRef.current = socket;
    store.setGameId(gameId);

    socket.addEventListener("open", () => {
      store.setConnected(true);
      store.setError(null);
      const msg: GameClientMessage = {
        type: "game-join",
        payload: { playerId, name: playerName },
      };
      socket.send(JSON.stringify(msg));
    });

    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data) as GameServerMessage;

      switch (msg.type) {
        case "game-state":
          store.setGameState(msg.payload);
          break;
        case "game-update":
          store.updateGameState(msg.payload);
          break;
        case "game-over":
          store.setGameOver(msg.payload.rankings);
          break;
        case "game-error":
          store.setError(msg.payload.message);
          break;
      }
    });

    socket.addEventListener("close", () => {
      store.setConnected(false);
    });

    return () => {
      socket.close();
      socketRef.current = null;
      store.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, gameId, playerId, playerName]);

  const sendAction = useCallback((action: Record<string, unknown>) => {
    const msg: GameClientMessage = {
      type: "game-action",
      payload: action,
    };
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  return { sendAction };
}
