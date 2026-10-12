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
import { BlockRunnerGame } from "./games/block-runner";
import { BattleshipGame } from "./games/battleship";
import { TapRushGame } from "./games/tap-rush";
import { TopTenGame } from "./games/top-ten";
import { LeBluffeurGame } from "./games/le-bluffeur";
import { LongueurOndeGame } from "./games/longueur-onde";
import { LocalGame } from "./games/local-game";
import { HuitAmericainGame } from "./games/huit-americain";
import { PresidentGame } from "./games/president";
import { ContreeGame } from "./games/contree";
import { DoubleSautGame } from "./games/double-saut";
import { EscapeDuoGame } from "./games/escape-duo";
import { CoupleQuizGame } from "./games/couple-quiz";
import { PensezPareilGame } from "./games/pensez-pareil";
import { LeBusGame } from "./games/le-bus";
import { NeonRushGame } from "./games/neon-rush";
import { PilePoilGame } from "./games/pile-poil";

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
  "block-runner": () => new BlockRunnerGame(),
  "battleship": () => new BattleshipGame(),
  "tap-rush": () => new TapRushGame(),
  "top-ten": () => new TopTenGame(),
  "le-bluffeur": () => new LeBluffeurGame(),
  "longueur-onde": () => new LongueurOndeGame(),
  "guess-word": () => new LocalGame(),
  "make-guess": () => new LocalGame(),
  "category-chrono": () => new LocalGame(),
  "huit-americain": () => new HuitAmericainGame(),
  "president": () => new PresidentGame(),
  "contree": () => new ContreeGame(),
  "double-saut": () => new DoubleSautGame(),
  "escape-duo": () => new EscapeDuoGame(),
  "pensez-pareil": () => new PensezPareilGame(),
  "le-bus": () => new LeBusGame(),
  "neon-rush": () => new NeonRushGame(),
  "pile-poil": () => new PilePoilGame(),
  "tgv": () => new LocalGame(),
  "picolette": () => new LocalGame(),
  "tu-prefere": () => new LocalGame(),
  "couple-quiz": () => new CoupleQuizGame(),
};

// Jeux lancés à la main depuis le client (setup local, choix de mode…) : pas d'auto-start.
const MANUAL_START = new Set([
  "undercover", "chess", "block-runner", "double-saut", "escape-duo", "guess-word",
  "make-guess", "category-chrono", "tgv", "picolette", "tu-prefere", "pile-poil",
]);

export default class GameServer {
  party: Party;
  game: BaseGame | null = null;
  gameId: string | null = null;
  /** Joueurs attendus (taille du salon au lancement) : on ne démarre pas sans eux. */
  expectedPlayers = 0;
  startFallback: ReturnType<typeof setTimeout> | null = null;

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
      const { playerId, name, expected } = msg.payload as { playerId: string; name: string; expected?: number };
      if (!this.game) {
        sender.send(
          JSON.stringify({
            type: "game-error",
            payload: { message: "Jeu non trouve" },
          })
        );
        return;
      }

      // Nombre de joueurs présents dans le salon au lancement (envoyé par le client).
      if (typeof expected === "number" && expected > 0) {
        this.expectedPlayers = Math.max(this.expectedPlayers, Math.min(16, Math.floor(expected)));
      }

      // Partie terminée et le jeu ne sait pas se relancer tout seul → instance neuve,
      // en gardant les joueurs encore connectés. Sinon "Rejouer" retombe sur l'écran de fin.
      if (this.game.started && this.game.finished && !this.game.restartIfFinished) {
        this.recreateGame();
      }

      this.game.addPlayer(playerId, name, sender);

      // Rejoining a finished game (round/match over) → deal a fresh one so
      // players never get stuck on an empty, unplayable board.
      if (this.game.started && this.game.restartIfFinished?.()) {
        this.game.finished = false;
        this.game.broadcast({ type: "game-reset" });
        this.game.syncAll();
        return;
      }

      // Chacun reçoit SON état (une reconnexion n'efface plus les rôles/mains des autres)
      this.game.syncAll();

      if (MANUAL_START.has(this.gameId ?? "")) return;
      this.maybeAutoStart();
      return;
    }

    if (msg.type === "game-action" && this.game) {
      this.game.onMessage(msg.payload ?? {}, sender);
      return;
    }

    // Réactions emojis — rebroadcast à tous les autres (le sender l'affiche déjà localement).
    if (msg.type === "reaction") {
      this.party.broadcast(
        JSON.stringify({ type: "reaction", payload: msg.payload ?? {} }),
        [sender.id]
      );
      return;
    }

    // Quitter volontairement : on retire le joueur ; s'il ne reste que des bots
    // (ou personne), on réinitialise la partie pour repartir de zéro au prochain lancement.
    if (msg.type === "leave-game" && this.game) {
      this.game.removePlayer(sender.id);
      const humansLeft = [...this.game.players.keys()].some((id) => !this.game!.isBot(id));
      if (!humansLeft && this.gameId) {
        this.game.cleanup();
        const factory = GAME_REGISTRY[this.gameId];
        if (factory) this.game = factory();
      } else {
        this.game.syncAll();
      }
      return;
    }

    if (msg.type === "start-with-bots" && this.game && !this.game.started) {
      const minToStart = this.gameId === "contree" ? 4 : this.gameId === "president" ? 3 : 2;
      const missing = Math.max(0, minToStart - this.game.players.size);
      if (missing > 0) this.game.addBots(missing);
      this.clearStartFallback();
      this.game.start();
      return;
    }
  }

  minPlayersToStart(): number {
    const id = this.gameId ?? "";
    // Les quiz se jouent très bien en solo (auto-validés / QCM, aucun adversaire requis)
    if (id === "speed-quiz" || id === "roast-quiz") return 1;
    // Jeux d'identification : sans assez de joueurs la partie est dégénérée/injouable
    if (id === "contree" || id === "loup-garou" || id === "la-taupe") return 4;
    if (["president", "top-ten", "le-bluffeur", "longueur-onde", "infiltre"].includes(id)) return 3;
    return 2;
  }

  /**
   * Démarre quand tout le salon est connecté. Si quelqu'un n'arrive jamais
   * (onglet fermé, réseau), on démarre quand même au bout de 8 s avec les présents.
   */
  maybeAutoStart() {
    const game = this.game;
    if (!game || game.started) return;
    const min = this.minPlayersToStart();
    const target = Math.max(min, this.expectedPlayers);
    if (game.players.size >= target) {
      this.clearStartFallback();
      game.start();
      return;
    }
    if (game.players.size >= min && !this.startFallback) {
      this.startFallback = setTimeout(() => {
        this.startFallback = null;
        if (this.game && !this.game.started && this.game.players.size >= this.minPlayersToStart()) {
          this.game.start();
        }
      }, 8000);
    }
  }

  clearStartFallback() {
    if (this.startFallback) clearTimeout(this.startFallback);
    this.startFallback = null;
  }

  /** Remplace l'instance terminée par une neuve en y reportant les humains encore connectés. */
  recreateGame() {
    const old = this.game;
    const factory = this.gameId ? GAME_REGISTRY[this.gameId] : undefined;
    if (!old || !factory) return;
    old.cleanup();
    old.clearBotTimeouts();
    const fresh = factory();
    for (const [id, p] of old.players) {
      if (old.isBot(id)) continue;
      const conn = old.connections.get(p.connectionId);
      if (conn) fresh.addPlayer(id, p.name, conn);
    }
    this.game = fresh;
    this.clearStartFallback();
    fresh.broadcast({ type: "game-reset" });
  }

  onClose(conn: Connection) {
    if (this.game) {
      this.game.removePlayer(conn.id);
      // Plus aucun humain (les bots ne comptent pas) → on nettoie et on repart à neuf
      const humansLeft = [...this.game.players.keys()].some((id) => !this.game!.isBot(id));
      if (!humansLeft) {
        this.game.cleanup();
        this.game.clearBotTimeouts();
        this.clearStartFallback();
        this.expectedPlayers = 0;
        const factory = this.gameId ? GAME_REGISTRY[this.gameId] : undefined;
        if (factory) this.game = factory();
      } else if (!this.game.started) {
        this.game.syncAll();
      }
    }
  }
}
