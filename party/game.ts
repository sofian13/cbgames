import type { Party, Connection } from "partykit/server";
import type { BaseGame } from "./games/base-game";
import { BombPartyGame } from "./games/bomb-party";
import { SpeedQuizGame } from "./games/speed-quiz";
import { WordChainGame } from "./games/word-chain";
import { ReactionTimeGame } from "./games/reaction-time";
import { LoupGarouGame } from "./games/loup-garou";
import { UndercoverGame } from "./games/undercover";
import { CodeNamesGame } from "./games/code-names";
import { InfiltreGame } from "./games/infiltre";
import { UnoGame } from "./games/uno";
import { PokerGame } from "./games/poker";
import { RoastQuizGame } from "./games/roast-quiz";
import { LaTaupeGame } from "./games/la-taupe";
import { EnchereGame } from "./games/enchere";
import { SplitSecondGame } from "./games/split-second";
import { BlindControlGame } from "./games/blind-control";
import { RouletteGame } from "./games/roulette";
import { BlackMarketGame } from "./games/black-market";
import { KingHillGame } from "./games/king-hill";
import { MotionTennisGame } from "./games/motion-tennis";
import { ChessGame } from "./games/chess";

// Registry of game constructors
const GAME_REGISTRY: Record<string, () => BaseGame> = {
  "bomb-party": () => new BombPartyGame(),
  "speed-quiz": () => new SpeedQuizGame(),
  "word-chain": () => new WordChainGame(),
  "reaction-time": () => new ReactionTimeGame(),
  "loup-garou": () => new LoupGarouGame(),
  "undercover": () => new UndercoverGame(),
  "code-names": () => new CodeNamesGame(),
  "infiltre": () => new InfiltreGame(),
  "uno": () => new UnoGame(),
  "poker": () => new PokerGame(),
  "roast-quiz": () => new RoastQuizGame(),
  "la-taupe": () => new LaTaupeGame(),
  "enchere": () => new EnchereGame(),
  "split-second": () => new SplitSecondGame(),
  "blind-control": () => new BlindControlGame(),
  "roulette": () => new RouletteGame(),
  "black-market": () => new BlackMarketGame(),
  "king-hill": () => new KingHillGame(),
  "motion-tennis": () => new MotionTennisGame(),
  "chess": () => new ChessGame(),
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

      // Broadcast current state so waiting screens stay in sync
      this.game.broadcast({
        type: "game-state",
        payload: this.game.getState(),
      });

      // Auto-start when enough players join and game hasn't started
      // Motion tennis can start solo (vs bot)
      if (this.gameId === "undercover" || this.gameId === "chess") {
        return;
      }
      const soloGames = new Set(["motion-tennis", "undercover", "chess"]);
      const minToStart = this.gameId && soloGames.has(this.gameId) ? 1 : 2;
      if (this.game.players.size >= minToStart && !this.game.started) {
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
