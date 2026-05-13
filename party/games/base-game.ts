import type { Connection } from "partykit/server";
import type { GameRanking } from "../shared/types";

export interface GamePlayer {
  id: string;
  name: string;
  connectionId: string;
}

const BOT_NAMES = ["Léo", "Maya", "Théo", "Inès", "Sami", "Zoé", "Yanis", "Nora"];

export abstract class BaseGame {
  players: Map<string, GamePlayer> = new Map();
  connections: Map<string, Connection> = new Map();
  botIds: Set<string> = new Set();
  botTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();
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

  addBots(count: number) {
    const existing = this.players.size;
    for (let i = 0; i < count; i++) {
      const botId = `bot-${existing + i + 1}-${Math.random().toString(36).slice(2, 6)}`;
      const botName = BOT_NAMES[(existing + i) % BOT_NAMES.length];
      this.players.set(botId, { id: botId, name: botName, connectionId: botId });
      this.botIds.add(botId);
    }
  }

  isBot(playerId: string): boolean {
    return this.botIds.has(playerId);
  }

  queueBotAction(action: () => void, minDelay = 700, maxDelay = 1600) {
    const delay = minDelay + Math.floor(Math.random() * (maxDelay - minDelay + 1));
    const t = setTimeout(() => {
      this.botTimeouts.delete(t);
      action();
    }, delay);
    this.botTimeouts.add(t);
  }

  clearBotTimeouts() {
    for (const t of this.botTimeouts) clearTimeout(t);
    this.botTimeouts.clear();
  }

  broadcast(msg: Record<string, unknown>) {
    const data = JSON.stringify(msg);
    for (const conn of this.connections.values()) {
      conn.send(data);
    }
  }

  broadcastState() {
    this.broadcast({ type: "game-state", payload: this.getState() });
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
