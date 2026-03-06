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
  const hasLobbyStateRef = useRef(false);
  const store = useRoomStore();

  useEffect(() => {
    // Prevent stale lobby state when switching rooms or reconnecting.
    store.reset();

    const host = getPartyKitHost();
    const protocol = getPartyKitWsProtocol(host);

    const socket = new PartySocket({
      host,
      room: roomCode,
      party: "main",
      protocol,
    });

    socketRef.current = socket;
    hasLobbyStateRef.current = false;

    socket.addEventListener("open", () => {
      store.setDebugEvent("ws-open");
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
      store.setDebugEvent("join-send");
      socket.send(JSON.stringify(msg));

      // Mobile networks can occasionally drop the first message:
      // retry join until lobby-state arrives.
      const retry = setInterval(() => {
        if (hasLobbyStateRef.current || socket.readyState !== WebSocket.OPEN) return;
        store.setDebugEvent("join-retry");
        socket.send(JSON.stringify(msg));
      }, 1500);

      socket.addEventListener(
        "close",
        () => {
          clearInterval(retry);
        },
        { once: true }
      );
    });

    socket.addEventListener("message", (event) => {
      let msg: LobbyServerMessage;
      try {
        msg = JSON.parse(event.data) as LobbyServerMessage;
      } catch {
        store.setDebugEvent("ws-parse-error");
        return;
      }
      store.setDebugEvent(msg.type);

      switch (msg.type) {
        case "lobby-state":
          hasLobbyStateRef.current = true;
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
      store.setDebugEvent("ws-close");
      store.setConnected(false);
    });

    socket.addEventListener("error", () => {
      store.setDebugEvent("ws-error");
      store.setError("Connexion perdue");
    });

    return () => {
      hasLobbyStateRef.current = false;
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
