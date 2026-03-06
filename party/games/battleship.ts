import type { Connection } from "partykit/server";
import { BaseGame, type GamePlayer } from "./base-game";

// ── Types ──────────────────────────────────────────────
type CellState = "empty" | "ship" | "hit" | "miss";
type Phase = "placing" | "playing" | "game-over";

interface Ship {
  id: string;
  size: number;
  cells: number[]; // flat indices in 10x10 grid
}

interface PlayerBoard {
  grid: CellState[]; // 100 cells (10x10)
  ships: Ship[];
  allPlaced: boolean;
}

interface BattleshipPlayer extends GamePlayer {
  board: PlayerBoard;
}

const SHIPS_CONFIG = [
  { id: "carrier", size: 5, label: "Porte-avions" },
  { id: "battleship", size: 4, label: "Cuirasse" },
  { id: "cruiser1", size: 3, label: "Croiseur" },
  { id: "cruiser2", size: 3, label: "Sous-marin" },
  { id: "destroyer", size: 2, label: "Torpilleur" },
];

function makeEmptyGrid(): CellState[] {
  return Array(100).fill("empty");
}

function canPlaceShip(
  grid: CellState[],
  startIdx: number,
  size: number,
  horizontal: boolean
): boolean {
  const startX = startIdx % 10;
  const startY = Math.floor(startIdx / 10);

  for (let i = 0; i < size; i++) {
    const x = horizontal ? startX + i : startX;
    const y = horizontal ? startY : startY + i;
    if (x >= 10 || y >= 10) return false;
    if (grid[y * 10 + x] !== "empty") return false;
  }
  return true;
}

function placeShipOnGrid(
  grid: CellState[],
  startIdx: number,
  size: number,
  horizontal: boolean
): number[] {
  const startX = startIdx % 10;
  const startY = Math.floor(startIdx / 10);
  const cells: number[] = [];

  for (let i = 0; i < size; i++) {
    const x = horizontal ? startX + i : startX;
    const y = horizontal ? startY : startY + i;
    const idx = y * 10 + x;
    grid[idx] = "ship";
    cells.push(idx);
  }
  return cells;
}

function isShipSunk(ship: Ship, grid: CellState[]): boolean {
  return ship.cells.every((idx) => grid[idx] === "hit");
}

function allShipsSunk(board: PlayerBoard): boolean {
  return board.ships.every((s) => isShipSunk(s, board.grid));
}

export class BattleshipGame extends BaseGame {
  phase: Phase = "placing";
  bPlayers: Map<string, BattleshipPlayer> = new Map();
  turnPlayerId: string | null = null;
  playerOrder: string[] = [];
  winner: string | null = null;
  lastShot: { playerId: string; idx: number; result: "hit" | "miss" | "sunk"; shipId?: string } | null = null;

  start() {
    this.started = true;
    this.phase = "placing";
    this.playerOrder = [...this.players.keys()];

    for (const [id, player] of this.players) {
      this.bPlayers.set(id, {
        ...player,
        board: {
          grid: makeEmptyGrid(),
          ships: [],
          allPlaced: false,
        },
      });
    }

    this.broadcastState();
  }

  onMessage(message: Record<string, unknown>, sender: Connection) {
    const playerId = this.findPlayerId(sender);
    if (!playerId) return;

    const action = message.action as string;

    if (action === "place-ship") {
      this.handlePlaceShip(playerId, message);
    } else if (action === "fire") {
      this.handleFire(playerId, message);
    }
  }

  private findPlayerId(sender: Connection): string | null {
    for (const [id, player] of this.players) {
      if (player.connectionId === sender.id) return id;
    }
    return null;
  }

  private handlePlaceShip(playerId: string, msg: Record<string, unknown>) {
    if (this.phase !== "placing") return;

    const bp = this.bPlayers.get(playerId);
    if (!bp || bp.board.allPlaced) return;

    const shipId = msg.shipId as string;
    const startIdx = msg.startIdx as number;
    const horizontal = msg.horizontal as boolean;

    const shipConfig = SHIPS_CONFIG.find((s) => s.id === shipId);
    if (!shipConfig) return;

    // Don't allow placing same ship twice
    if (bp.board.ships.some((s) => s.id === shipId)) return;

    if (!canPlaceShip(bp.board.grid, startIdx, shipConfig.size, horizontal)) {
      this.sendToPlayer(playerId, {
        type: "game-state",
        payload: { error: "Placement invalide" },
      });
      return;
    }

    const cells = placeShipOnGrid(bp.board.grid, startIdx, shipConfig.size, horizontal);
    bp.board.ships.push({ id: shipId, size: shipConfig.size, cells });

    if (bp.board.ships.length === SHIPS_CONFIG.length) {
      bp.board.allPlaced = true;
    }

    // Check if both players have placed all ships
    const allReady = [...this.bPlayers.values()].every((p) => p.board.allPlaced);
    if (allReady) {
      this.phase = "playing";
      this.turnPlayerId = this.playerOrder[0];
    }

    this.broadcastState();
  }

  private handleFire(playerId: string, msg: Record<string, unknown>) {
    if (this.phase !== "playing") return;
    if (this.turnPlayerId !== playerId) return;

    const idx = msg.idx as number;
    if (idx < 0 || idx >= 100) return;

    // Find opponent
    const opponentId = this.playerOrder.find((id) => id !== playerId);
    if (!opponentId) return;

    const opponent = this.bPlayers.get(opponentId);
    if (!opponent) return;

    const cell = opponent.board.grid[idx];
    if (cell === "hit" || cell === "miss") return; // Already shot here

    if (cell === "ship") {
      opponent.board.grid[idx] = "hit";

      // Check if any ship is sunk
      const sunkShip = opponent.board.ships.find(
        (s) => s.cells.includes(idx) && isShipSunk(s, opponent.board.grid)
      );

      this.lastShot = {
        playerId,
        idx,
        result: sunkShip ? "sunk" : "hit",
        shipId: sunkShip?.id,
      };

      // Check win condition
      if (allShipsSunk(opponent.board)) {
        this.phase = "game-over";
        this.winner = playerId;
        this.broadcastState();

        const winnerPlayer = this.players.get(playerId);
        const loserPlayer = this.players.get(opponentId);

        setTimeout(() => {
          this.endGame([
            { playerId, playerName: winnerPlayer?.name ?? "?", rank: 1, score: 100 },
            { playerId: opponentId, playerName: loserPlayer?.name ?? "?", rank: 2, score: 0 },
          ]);
        }, 4000);
        return;
      }

      // Hit = player shoots again (stays same turn)
    } else {
      opponent.board.grid[idx] = "miss";
      this.lastShot = { playerId, idx, result: "miss" };

      // Miss = switch turns
      this.turnPlayerId = opponentId;
    }

    this.broadcastState();
  }

  broadcastState() {
    for (const [id, bp] of this.bPlayers) {
      const opponentId = this.playerOrder.find((pid) => pid !== id);
      const opponent = opponentId ? this.bPlayers.get(opponentId) : null;

      // Build opponent grid view (hide ship positions, show hits/misses)
      const opponentGridView = opponent
        ? opponent.board.grid.map((cell) => {
            if (cell === "ship") return "empty"; // Hide ships
            return cell;
          })
        : makeEmptyGrid();

      const opponentShipsSunk = opponent
        ? opponent.board.ships
            .filter((s) => isShipSunk(s, opponent.board.grid))
            .map((s) => ({ id: s.id, size: s.size, cells: s.cells }))
        : [];

      this.sendToPlayer(id, {
        type: "game-state",
        payload: {
          phase: this.phase,
          myGrid: bp.board.grid,
          myShips: bp.board.ships.map((s) => ({ id: s.id, size: s.size, cells: s.cells })),
          myAllPlaced: bp.board.allPlaced,
          opponentGrid: opponentGridView,
          opponentShipsSunk,
          isMyTurn: this.turnPlayerId === id,
          turnPlayerId: this.turnPlayerId,
          lastShot: this.lastShot,
          winner: this.winner,
          winnerName: this.winner ? this.players.get(this.winner)?.name : null,
          opponentName: opponent ? this.players.get(opponentId!)?.name : null,
          opponentReady: opponent?.board.allPlaced ?? false,
          shipsConfig: SHIPS_CONFIG,
          playerNames: Object.fromEntries(
            [...this.players.values()].map((p) => [p.id, p.name])
          ),
        },
      });
    }
  }

  getState() {
    return {
      phase: this.phase,
      winner: this.winner,
    };
  }

  cleanup() {
    this.bPlayers.clear();
    this.lastShot = null;
    this.winner = null;
  }
}
