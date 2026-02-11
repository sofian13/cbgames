import type { Party, Connection } from "partykit/server";
import type { BaseGame } from "./games/base-game";
import { BombPartyGame } from "./games/bomb-party";
import { SpeedQuizGame } from "./games/speed-quiz";
import { WordChainGame } from "./games/word-chain";
import { ReactionTimeGame } from "./games/reaction-time";

// Registry of game constructors
const GAME_REGISTRY: Record<string, () => BaseGame> = {
  "bomb-party": () => new BombPartyGame(),
  "speed-quiz": () => new SpeedQuizGame(),
  "word-chain": () => new WordChainGame(),
  "reaction-time": () => new ReactionTimeGame(),
};

export default class GameServer {
  party: Party;
  game: BaseGame | null = null;
  gameId: string | null = null;

  constructor(party: Party) {
    this.party = party;
    // Room ID format: "ROOMCODE-gameid"
    const parts = party.id.split("-");
    if (parts.length >= 2) {
      this.gameId = parts.slice(1).join("-");
      const factory = GAME_REGISTRY[this.gameId];
      if (factory) {
        this.game = factory();
      }
    }
  }

  onMessage(message: string, sender: Connection) {
    let msg: { type: string; payload?: Record<string, unknown> };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    if (msg.type === "game-join") {
      const { playerId, name } = msg.payload as { playerId: string; name: string };
      if (!this.game) {
        sender.send(
          JSON.stringify({
            type: "game-error",
            payload: { message: "Jeu non trouvé" },
          })
        );
        return;
      }

      this.game.addPlayer(playerId, name, sender);

      // Send current state to joining player
      sender.send(
        JSON.stringify({
          type: "game-state",
          payload: this.game.getState(),
        })
      );

      // Auto-start when enough players join (2+) and game hasn't started
      if (this.game.players.size >= 2 && !this.game.started) {
        this.game.start();
      }
      return;
    }

    if (msg.type === "game-action" && this.game) {
      this.game.onMessage(msg.payload ?? {}, sender);
      return;
    }
  }

  onClose(conn: Connection) {
    if (this.game) {
      this.game.removePlayer(conn.id);
      // If no players left, cleanup
      if (this.game.players.size === 0) {
        this.game.cleanup();
      }
    }
  }
}
