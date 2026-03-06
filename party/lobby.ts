import type { Party, Connection } from "partykit/server";
import type { Player, LobbyState } from "./shared/types";
import { calculateSessionPoints, mergeScores } from "./shared/scoring";

const MAX_PLAYERS = 8;

function normalizeGameId(raw: string | null | undefined) {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}


export default class LobbyServer {
  party: Party;
  players: Map<string, Player> = new Map();
  selectedGameId: string | null = null;
  status: "waiting" | "ready-check" | "in-game" = "waiting";
  sessionScores: Record<string, number> = {};

  constructor(party: Party) {
    this.party = party;
  }

  getState(): LobbyState {
    const players = Array.from(this.players.values());
    const host = players.find((p) => p.isHost) ?? players.find((p) => p.isConnected);
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      players: players.map(({ connectionId, ...rest }) => rest),
      selectedGameId: this.selectedGameId,
      hostId: host?.id ?? "",
      status: this.status,
      sessionScores: this.sessionScores,
    };
  }

  ensureConnectedHost() {
    const anyHost = Array.from(this.players.values()).find((p) => p.isHost);
    if (anyHost) return;
    const connected = Array.from(this.players.values()).filter((p) => p.isConnected);
    if (connected.length === 0) return;
    for (const [, p] of this.players) {
      p.isHost = false;
    }
    connected[0].isHost = true;
    this.broadcast({
      type: "host-changed",
      payload: { playerId: connected[0].id },
    });
  }

  broadcast(msg: Record<string, unknown>, exclude?: string) {
    const data = JSON.stringify(msg);
    for (const [, player] of this.players) {
      if (player.connectionId !== exclude) {
        const conn = this.getConnectionById(player.connectionId);
        conn?.send(data);
      }
    }
  }

  sendTo(connectionId: string, msg: Record<string, unknown>) {
    const conn = this.getConnectionById(connectionId);
    conn?.send(JSON.stringify(msg));
  }

  getConnectionById(connectionId: string): Connection | undefined {
    for (const conn of this.party.getConnections()) {
      if (conn.id === connectionId) return conn;
    }
    return undefined;
  }

  promoteNewHost() {
    const players = Array.from(this.players.values()).filter((p) => p.isConnected);
    if (players.length === 0) return;

    // Clear old host
    for (const [, p] of this.players) {
      p.isHost = false;
    }

    players[0].isHost = true;
    this.broadcast({
      type: "host-changed",
      payload: { playerId: players[0].id },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onConnect(conn: Connection) {
    // Connection established, waiting for join message
  }

  onMessage(message: string, sender: Connection) {
    let msg: { type: string; payload?: Record<string, unknown> };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    switch (msg.type) {
      case "join": {
        const { playerId, name, avatar, isGuest } = msg.payload as {
          playerId: string;
          name: string;
          avatar?: string;
          isGuest: boolean;
        };

        if (this.players.size >= MAX_PLAYERS && !this.players.has(playerId)) {
          this.sendTo(sender.id, {
            type: "error",
            payload: { message: "Salle pleine (8 joueurs max)" },
          });
          return;
        }

        const connectedCount = Array.from(this.players.values()).filter((p) => p.isConnected).length;
        const isFirstConnected = connectedCount === 0;
        const existing = this.players.get(playerId);

        const player: Player = {
          id: playerId,
          name,
          avatar,
          isHost: existing?.isHost ?? isFirstConnected,
          isReady: false,
          isConnected: true,
          isGuest,
          connectionId: sender.id,
        };

        this.players.set(playerId, player);
        this.ensureConnectedHost();

        // Send full state to the joining player
        this.sendTo(sender.id, {
          type: "lobby-state",
          payload: this.getState(),
        });

        // Notify others
        this.broadcast(
          {
            type: "player-joined",
            payload: { player: { ...player, connectionId: undefined } },
          },
          sender.id
        );
        // Strong sync after joins to avoid stale/lost incremental events on mobile networks.
        this.broadcast({
          type: "lobby-state",
          payload: this.getState(),
        });
        break;
      }

      case "select-game": {
        const player = this.findPlayerByConnection(sender.id);
        if (!player?.isHost) return;

        const { gameId } = msg.payload as { gameId: string };
        const normalizedGameId = normalizeGameId(gameId);
        this.selectedGameId = normalizedGameId;

        // Reset ready states
        for (const [, p] of this.players) {
          p.isReady = false;
        }

        this.broadcast({
          type: "game-selected",
          payload: { gameId: normalizedGameId },
        });
        break;
      }

      case "toggle-ready": {
        const player = this.findPlayerByConnection(sender.id);
        if (!player) return;

        player.isReady = !player.isReady;
        this.broadcast({
          type: "ready-changed",
          payload: { playerId: player.id, isReady: player.isReady },
        });
        break;
      }

      case "start-game": {
        const player = this.findPlayerByConnection(sender.id);
        if (!player?.isHost) return;
        const payloadGameId = (msg.payload as { gameId?: string } | undefined)?.gameId;
        if (payloadGameId && payloadGameId.trim()) {
          this.selectedGameId = normalizeGameId(payloadGameId);
        }
        if (!this.selectedGameId) return;
        const connectedPlayers = Array.from(this.players.values()).filter(
          (p) => p.isConnected
        );

        const allReady = connectedPlayers.every(
          (p) => p.isReady || p.isHost
        );
        if (!allReady) {
          this.sendTo(sender.id, {
            type: "error",
            payload: { message: "Tous les joueurs doivent être prêts" },
          });
          return;
        }

        this.status = "in-game";
        this.broadcast({
          type: "game-starting",
          payload: {
            gameId: this.selectedGameId,
            roomCode: this.party.id,
          },
        });
        break;
      }

      case "return-to-lobby": {
        this.status = "waiting";
        for (const [, p] of this.players) {
          p.isReady = false;
        }
        this.broadcast({
          type: "lobby-state",
          payload: this.getState(),
        });
        break;
      }

      case "game-results": {
        // Called by game server to update session scores
        const { rankings } = msg.payload as {
          rankings: { playerId: string; playerName: string; rank: number; score: number }[];
        };
        const points = calculateSessionPoints(rankings);
        this.sessionScores = mergeScores(this.sessionScores, points);
        this.status = "waiting";

        for (const [, p] of this.players) {
          p.isReady = false;
        }

        this.broadcast({
          type: "game-ended",
          payload: { scores: this.sessionScores },
        });
        break;
      }

      case "kick-player": {
        const host = this.findPlayerByConnection(sender.id);
        if (!host?.isHost) return;

        const { playerId: targetId } = msg.payload as { playerId: string };
        const target = this.players.get(targetId);
        if (!target || target.isHost) return;

        this.players.delete(targetId);
        this.broadcast({
          type: "player-left",
          payload: { playerId: targetId },
        });

        // Close target's connection
        const targetConn = this.getConnectionById(target.connectionId);
        targetConn?.close();
        break;
      }
    }
  }

  onClose(conn: Connection) {
    const player = this.findPlayerByConnection(conn.id);
    if (!player) return;

    player.isConnected = false;

    // Remove after timeout if they don't reconnect
    setTimeout(() => {
      const current = this.players.get(player.id);
      if (current && !current.isConnected) {
        this.players.delete(player.id);
        this.broadcast({
          type: "player-left",
          payload: { playerId: player.id },
        });

        if (current.isHost) {
          this.promoteNewHost();
        } else {
          this.ensureConnectedHost();
        }
      }
    }, 15_000);
  }

  findPlayerByConnection(connectionId: string): Player | undefined {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return undefined;
  }
}
