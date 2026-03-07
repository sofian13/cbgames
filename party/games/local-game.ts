import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";

/**
 * Stub server for games that run entirely client-side (local/same device).
 * Just holds the connection so the game shell doesn't error out.
 */
export class LocalGame extends BaseGame {
  start() {
    this.started = true;
    this.broadcast({ type: "game-state", payload: { local: true } });
  }

  onMessage(_message: Record<string, unknown>, _sender: Connection) {
    // No server logic — everything runs on the client
  }

  getState() {
    return { local: true };
  }

  cleanup() {
    // Nothing to clean up
  }
}
