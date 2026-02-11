import type { Connection } from "partykit/server";
import type { GameRanking } from "../shared/types";

export interface GamePlayer {
  id: string;
  name: string;
  connectionId: string;
}

export abstract class BaseGame {
  players: Map<string, GamePlayer> = new Map();
  connections: Map<string, Connection> = new Map();
  started = false;

  addPlayer(id: string, name: string, conn: Connection) {
    this.players.set(id, { id, name, connectionId: conn.id });
    this.connections.set(conn.id, conn);
  }

  removePlayer(connectionId: string) {
    for (const [id, player] of this.players) {
      if (player.connectionId === connectionId) {
        this.players.delete(id);
        this.connections.delete(connectionId);
        return player;
      }
    }
    return null;
  }

  broadcast(msg: Record<string, unknown>) {
    const data = JSON.stringify(msg);
    for (const conn of this.connections.values()) {
      conn.send(data);
    }
  }

  sendTo(connectionId: string, msg: Record<string, unknown>) {
    const conn = this.connections.get(connectionId);
    conn?.send(JSON.stringify(msg));
  }

  sendToPlayer(playerId: string, msg: Record<string, unknown>) {
    const player = this.players.get(playerId);
    if (player) {
      this.sendTo(player.connectionId, msg);
    }
  }

  abstract start(): void;
  abstract onMessage(message: Record<string, unknown>, sender: Connection): void;
  abstract getState(): Record<string, unknown>;
  abstract cleanup(): void;

  endGame(rankings: GameRanking[]) {
    this.broadcast({
      type: "game-over",
      payload: { rankings },
    });
  }
}
