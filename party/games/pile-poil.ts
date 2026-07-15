import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";

/**
 * Pile Poil ⏱️ — relais minimal entre le tél « manette » (qui fait TOUTE
 * l'autorité de jeu : le temps officiel y est mesuré localement entre les
 * deux taps) et le(s) tél(s) « écran » qui ne font qu'afficher le chrono en
 * direct. Le serveur ne calcule rien : il rebroadcast les événements et garde
 * le dernier snapshot pour un écran qui rejoint en cours de partie.
 */
export class PilePoilGame extends BaseGame {
  lastSnapshot: Record<string, unknown> | null = null;

  start() {
    this.started = true;
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    if (payload.action === "pp-sync") {
      this.lastSnapshot = payload;
    }
    const data = JSON.stringify({ type: "game-update", payload });
    for (const conn of this.connections.values()) {
      if (conn.id !== sender.id) conn.send(data);
    }
  }

  getState(): Record<string, unknown> {
    return { relay: true, snapshot: this.lastSnapshot };
  }

  cleanup() {
    this.lastSnapshot = null;
  }
}
