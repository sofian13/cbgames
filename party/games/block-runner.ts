import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";

export class BlockRunnerGame extends BaseGame {
  phase: "waiting" | "playing" = "waiting";

  start() {
    if (this.started) return;
    this.started = true;
    this.phase = "playing";
    this.broadcastState();
  }

  onMessage(message: Record<string, unknown>, sender: Connection) {
    void message;
    void sender;
    // Gameplay is handled client-side for now.
    this.broadcastState();
  }

  getState() {
    return {
      phase: this.phase,
      connectedPlayers: Array.from(this.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };
  }

  broadcastState() {
    this.broadcast({
      type: "game-state",
      payload: this.getState(),
    });
  }

  cleanup() {}
}
