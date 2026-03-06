"use client";

import { useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import { useRoomStore } from "@/lib/stores/room-store";
import { getPartyKitHost, getPartyKitWsProtocol } from "@/lib/party/host";
import type {
  LobbyClientMessage,
  LobbyServerMessage,
} from "@/lib/party/message-types";

export function useRoom(
  roomCode: string,
  playerId: string,
  playerName: string,
  avatar?: string,
  isGuest = true,
  optimisticHost = false
) {
  const socketRef = useRef<PartySocket | null>(null);
  const store = useRoomStore();

  useEffect(() => {
    // Prevent stale lobby state when switching rooms or reconnecting.
    store.reset();

    const host = getPartyKitHost();
    const protocol = getPartyKitWsProtocol(host);

    const socket = new PartySocket({
      host,
      room: roomCode,
      protocol,
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      store.setConnected(true);
      store.setError(null);
      // Host fallback only for the room creator route (?host=1), not invite links.
      if (optimisticHost) {
        store.addPlayer({
          id: playerId,
          name: playerName,
          avatar,
          isHost: true,
          isReady: false,
          isConnected: true,
          isGuest,
        });
        store.setHostId(playerId);
      }
      // Send join message
      const msg: LobbyClientMessage = {
        type: "join",
        payload: { playerId, name: playerName, avatar, isGuest },
      };
      socket.send(JSON.stringify(msg));
    });

    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data) as LobbyServerMessage;

      switch (msg.type) {
        case "lobby-state":
          store.setLobbyState(msg.payload);
          break;
        case "player-joined":
          store.addPlayer(msg.payload.player);
          break;
        case "player-left":
          store.removePlayer(msg.payload.playerId);
          break;
        case "player-updated":
          store.updatePlayer(msg.payload.player);
          break;
        case "game-selected":
          store.setSelectedGame(msg.payload.gameId);
          break;
        case "ready-changed":
          store.setReadyState(msg.payload.playerId, msg.payload.isReady);
          break;
        case "host-changed":
          store.setHostId(msg.payload.playerId);
          break;
        case "game-starting":
          store.setSelectedGame(msg.payload.gameId);
          store.setStatus("in-game");
          break;
        case "scores-updated":
        case "game-ended":
          store.setSessionScores(msg.payload.scores);
          store.setStatus("waiting");
          // Reset ready state for all players
          store.players.forEach((p) => store.setReadyState(p.id, false));
          break;
        case "error":
          {
            const serverMessage = msg.payload.message ?? "";
            const normalized = serverMessage.toLowerCase();
            // Guard rail: ignore stale backend message that still enforces 2 players.
            if (normalized.includes("il faut au moins 2 joueurs")) {
              store.setError(null);
              break;
            }
            store.setError(serverMessage);
          }
          break;
      }
    });

    socket.addEventListener("close", () => {
      store.setConnected(false);
    });

    socket.addEventListener("error", () => {
      store.setError("Connexion perdue");
    });

    return () => {
      socket.close();
      socketRef.current = null;
      store.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, playerId, playerName, optimisticHost, avatar, isGuest]);

  const send = useCallback((msg: LobbyClientMessage) => {
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  const selectGame = useCallback(
    (gameId: string) => {
      const normalized = gameId.trim().toLowerCase();
      // Optimistic update to avoid race with start-game click.
      store.setSelectedGame(normalized);
      send({ type: "select-game", payload: { gameId: normalized } });
    },
    [send, store]
  );

  const toggleReady = useCallback(
    () => send({ type: "toggle-ready" }),
    [send]
  );

  const startGame = useCallback(
    (gameId?: string | null) =>
      send({
        type: "start-game",
        payload: gameId ? { gameId: gameId.trim().toLowerCase() } : undefined,
      }),
    [send]
  );

  const returnToLobby = useCallback(
    () => send({ type: "return-to-lobby" }),
    [send]
  );

  return { send, selectGame, toggleReady, startGame, returnToLobby };
}
