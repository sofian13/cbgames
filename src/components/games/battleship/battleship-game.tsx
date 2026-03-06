"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────
type CellState = "empty" | "ship" | "hit" | "miss";
type Phase = "placing" | "playing" | "game-over";

interface ShipConfig {
  id: string;
  size: number;
  label?: string;
}

interface Ship {
  id: string;
  size: number;
  cells: number[];
}

interface OnlineState {
  phase: Phase;
  myGrid: CellState[];
  myShips: Ship[];
  myAllPlaced: boolean;
  opponentGrid: CellState[];
  opponentShipsSunk: Ship[];
  isMyTurn: boolean;
  turnPlayerId: string | null;
  lastShot: { playerId: string; idx: number; result: "hit" | "miss" | "sunk"; shipId?: string } | null;
  winner: string | null;
  winnerName: string | null;
  opponentName: string | null;
  opponentReady: boolean;
  shipsConfig: ShipConfig[];
  playerNames: Record<string, string>;
  error?: string;
}

const GRID_SIZE = 10;
const TOTAL_CELLS = 100;
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const DEFAULT_SHIPS: ShipConfig[] = [
  { id: "carrier", size: 5, label: "Porte-avions" },
  { id: "battleship", size: 4, label: "Cuirasse" },
  { id: "cruiser1", size: 3, label: "Croiseur" },
  { id: "cruiser2", size: 3, label: "Sous-marin" },
  { id: "destroyer", size: 2, label: "Torpilleur" },
];

const CELL_COLORS: Record<CellState, string> = {
  empty: "bg-[#0c1a3a] border-cyan-300/10",
  ship: "bg-cyan-600/40 border-cyan-300/25",
  hit: "bg-red-500/60 border-red-400/40",
  miss: "bg-white/10 border-white/15",
};

// ── Helpers ──────────────────────────────────────────────
function makeEmptyGrid(): CellState[] {
  return Array(TOTAL_CELLS).fill("empty");
}

function canPlaceShip(grid: CellState[], startIdx: number, size: number, horizontal: boolean): boolean {
  const sx = startIdx % 10;
  const sy = Math.floor(startIdx / 10);
  for (let i = 0; i < size; i++) {
    const x = horizontal ? sx + i : sx;
    const y = horizontal ? sy : sy + i;
    if (x >= 10 || y >= 10) return false;
    if (grid[y * 10 + x] !== "empty") return false;
  }
  return true;
}

function placeShipOnGrid(grid: CellState[], startIdx: number, size: number, horizontal: boolean): number[] {
  const sx = startIdx % 10;
  const sy = Math.floor(startIdx / 10);
  const cells: number[] = [];
  for (let i = 0; i < size; i++) {
    const x = horizontal ? sx + i : sx;
    const y = horizontal ? sy : sy + i;
    const idx = y * 10 + x;
    grid[idx] = "ship";
    cells.push(idx);
  }
  return cells;
}

function isShipSunk(ship: Ship, grid: CellState[]): boolean {
  return ship.cells.every((idx) => grid[idx] === "hit");
}

function allShipsSunk(ships: Ship[], grid: CellState[]): boolean {
  return ships.every((s) => isShipSunk(s, grid));
}

function randomPlacement(): { grid: CellState[]; ships: Ship[] } {
  const grid = makeEmptyGrid();
  const ships: Ship[] = [];
  for (const cfg of DEFAULT_SHIPS) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 500) {
      attempts++;
      const horizontal = Math.random() > 0.5;
      const idx = Math.floor(Math.random() * TOTAL_CELLS);
      if (canPlaceShip(grid, idx, cfg.size, horizontal)) {
        const cells = placeShipOnGrid(grid, idx, cfg.size, horizontal);
        ships.push({ id: cfg.id, size: cfg.size, cells });
        placed = true;
      }
    }
  }
  return { grid, ships };
}

// ── Grid Component ──────────────────────────────────────
function BattleGrid({
  grid,
  ships,
  onCellClick,
  isEnemy,
  disabled,
  highlightCells,
  label,
  small,
}: {
  grid: CellState[];
  ships?: Ship[];
  onCellClick?: (idx: number) => void;
  isEnemy?: boolean;
  disabled?: boolean;
  highlightCells?: Set<number>;
  label: string;
  small?: boolean;
}) {
  const sunkSet = useMemo(() => {
    if (!ships) return new Set<number>();
    const set = new Set<number>();
    for (const s of ships) {
      if (isShipSunk(s, grid)) {
        for (const c of s.cells) set.add(c);
      }
    }
    return set;
  }, [ships, grid]);

  return (
    <div className={cn("flex flex-col items-center gap-1", small && "scale-[0.85] origin-top")}>
      <span className="text-xs text-white/40 font-sans uppercase tracking-wider">{label}</span>
      <div className="flex">
        <div className="flex flex-col mr-0.5 mt-5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex items-center justify-center h-[var(--cell)] text-[9px] text-white/25 font-mono w-3">
              {i + 1}
            </div>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-10 ml-0.5 mb-0.5">
            {LETTERS.map((l) => (
              <div key={l} className="flex items-center justify-center w-[var(--cell)] text-[9px] text-white/25 font-mono">
                {l}
              </div>
            ))}
          </div>
          <div
            className="grid grid-cols-10 rounded-lg overflow-hidden border border-white/10"
            style={{ "--cell": small ? "clamp(22px, 3.2vw, 28px)" : "clamp(28px, 7.5vw, 38px)" } as React.CSSProperties}
          >
            {grid.map((cell, idx) => {
              const isHighlight = highlightCells?.has(idx);
              const isSunk = sunkSet.has(idx);
              const isHit = cell === "hit";
              const isMiss = cell === "miss";
              const showShip = !isEnemy && cell === "ship";

              return (
                <button
                  key={idx}
                  onClick={() => onCellClick?.(idx)}
                  disabled={disabled || (!isEnemy)}
                  className={cn(
                    "w-[var(--cell)] h-[var(--cell)] border transition-all relative",
                    showShip ? "bg-cyan-500/30 border-cyan-300/20" : CELL_COLORS[isEnemy && cell === "ship" ? "empty" : cell],
                    isHighlight && "bg-cyan-400/20 border-cyan-300/40",
                    isSunk && isHit && "bg-red-600/50 border-red-400/30",
                    isEnemy && !disabled && cell !== "hit" && cell !== "miss" && "hover:bg-cyan-300/15 cursor-crosshair",
                    disabled && isEnemy && "cursor-not-allowed",
                  )}
                >
                  {isHit && (
                    <span className="absolute inset-0 flex items-center justify-center text-red-400 font-bold text-sm">
                      X
                    </span>
                  )}
                  {isMiss && (
                    <span className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">
                      •
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Local Mode ──────────────────────────────────────────
function LocalBattleship({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  const [localPhase, setLocalPhase] = useState<"setup" | "placing-1" | "placing-2" | "handoff" | "playing" | "game-over">("setup");
  const [player1Name, setPlayer1Name] = useState("Joueur 1");
  const [player2Name, setPlayer2Name] = useState("Joueur 2");
  const [p1Grid, setP1Grid] = useState(makeEmptyGrid);
  const [p2Grid, setP2Grid] = useState(makeEmptyGrid);
  const [p1Ships, setP1Ships] = useState<Ship[]>([]);
  const [p2Ships, setP2Ships] = useState<Ship[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(DEFAULT_SHIPS[0].id);
  const [horizontal, setHorizontal] = useState(true);
  const [hoverCells, setHoverCells] = useState<Set<number>>(new Set());
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [lastShotResult, setLastShotResult] = useState<"hit" | "miss" | "sunk" | null>(null);
  const [showingBoard, setShowingBoard] = useState(false);

  const currentGrid = currentPlayer === 1 ? p1Grid : p2Grid;
  const currentShips = currentPlayer === 1 ? p1Ships : p2Ships;
  const setCurrentGrid = currentPlayer === 1 ? setP1Grid : setP2Grid;
  const setCurrentShips = currentPlayer === 1 ? setP1Ships : setP2Ships;
  const currentName = currentPlayer === 1 ? player1Name : player2Name;
  const otherName = currentPlayer === 1 ? player2Name : player1Name;
  const enemyGrid = currentPlayer === 1 ? p2Grid : p1Grid;
  const enemyShips = currentPlayer === 1 ? p2Ships : p1Ships;
  const setEnemyGrid = currentPlayer === 1 ? setP2Grid : setP1Grid;

  const placedIds = new Set(currentShips.map((s) => s.id));
  const remainingShips = DEFAULT_SHIPS.filter((s) => !placedIds.has(s.id));

  const handlePlacementClick = useCallback((idx: number) => {
    if (!selectedShipId) return;
    const cfg = DEFAULT_SHIPS.find((s) => s.id === selectedShipId);
    if (!cfg) return;
    const gridCopy = [...currentGrid];
    if (!canPlaceShip(gridCopy, idx, cfg.size, horizontal)) return;
    const cells = placeShipOnGrid(gridCopy, idx, cfg.size, horizontal);
    setCurrentGrid(gridCopy);
    setCurrentShips((prev) => [...prev, { id: cfg.id, size: cfg.size, cells }]);
    // Auto-select next ship
    const nextShip = DEFAULT_SHIPS.find((s) => !placedIds.has(s.id) && s.id !== selectedShipId);
    setSelectedShipId(nextShip?.id ?? null);
  }, [selectedShipId, horizontal, currentGrid, setCurrentGrid, setCurrentShips, placedIds]);

  const handleRandomPlace = useCallback(() => {
    const { grid, ships } = randomPlacement();
    setCurrentGrid(grid);
    setCurrentShips(ships);
    setSelectedShipId(null);
  }, [setCurrentGrid, setCurrentShips]);

  const handleResetPlacement = useCallback(() => {
    setCurrentGrid(makeEmptyGrid());
    setCurrentShips([]);
    setSelectedShipId(DEFAULT_SHIPS[0].id);
  }, [setCurrentGrid, setCurrentShips]);

  const handleConfirmPlacement = useCallback(() => {
    if (localPhase === "placing-1") {
      setLocalPhase("handoff");
      setCurrentPlayer(2);
      setSelectedShipId(DEFAULT_SHIPS[0].id);
      setHorizontal(true);
    } else if (localPhase === "placing-2") {
      setLocalPhase("handoff");
      setCurrentPlayer(1); // Player 1 starts
    }
  }, [localPhase]);

  const handleHandoffContinue = useCallback(() => {
    if (p2Ships.length === 0) {
      setLocalPhase("placing-2");
    } else {
      setLocalPhase("playing");
      setShowingBoard(false);
    }
  }, [p2Ships.length]);

  const handleFire = useCallback((idx: number) => {
    if (localPhase !== "playing") return;
    const cell = enemyGrid[idx];
    if (cell === "hit" || cell === "miss") return;

    const newGrid = [...enemyGrid];
    if (cell === "ship") {
      newGrid[idx] = "hit";
      setEnemyGrid(newGrid);
      const sunkShip = enemyShips.find((s) => s.cells.includes(idx) && isShipSunk(s, newGrid));
      setLastShotResult(sunkShip ? "sunk" : "hit");

      if (allShipsSunk(enemyShips, newGrid)) {
        setWinner(currentPlayer);
        setLocalPhase("game-over");
        return;
      }
      // Hit = same player shoots again
    } else {
      newGrid[idx] = "miss";
      setEnemyGrid(newGrid);
      setLastShotResult("miss");
      // Switch turns after a delay
      setTimeout(() => {
        setCurrentPlayer((p) => (p === 1 ? 2 : 1));
        setShowingBoard(false);
        setLastShotResult(null);
      }, 1200);
    }
  }, [localPhase, enemyGrid, setEnemyGrid, enemyShips, currentPlayer]);

  const handleHover = useCallback((idx: number) => {
    if (!selectedShipId) { setHoverCells(new Set()); return; }
    const cfg = DEFAULT_SHIPS.find((s) => s.id === selectedShipId);
    if (!cfg) return;
    const sx = idx % 10;
    const sy = Math.floor(idx / 10);
    const cells = new Set<number>();
    for (let i = 0; i < cfg.size; i++) {
      const x = horizontal ? sx + i : sx;
      const y = horizontal ? sy : sy + i;
      if (x < 10 && y < 10) cells.add(y * 10 + x);
    }
    setHoverCells(cells);
  }, [selectedShipId, horizontal]);

  // ── Setup ──
  if (localPhase === "setup") {
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl" style={{ animation: "scaleIn 0.4s ease" }}>
          <div className="text-center">
            <p className="text-[11px] font-sans uppercase tracking-[0.22em] text-cyan-200/65">Bataille Navale</p>
            <h2 className="mt-1 text-2xl font-serif text-white">Mode Local</h2>
          </div>
          <div className="w-full space-y-3">
            <div>
              <label className="text-xs text-white/40 font-sans">Joueur 1</label>
              <input value={player1Name} onChange={(e) => setPlayer1Name(e.target.value)} maxLength={15}
                className="mt-1 w-full rounded-xl border border-cyan-300/20 bg-white/[0.04] px-4 py-2.5 text-sm text-white font-sans placeholder:text-white/20 focus:outline-none focus:border-cyan-300/40" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-sans">Joueur 2</label>
              <input value={player2Name} onChange={(e) => setPlayer2Name(e.target.value)} maxLength={15}
                className="mt-1 w-full rounded-xl border border-cyan-300/20 bg-white/[0.04] px-4 py-2.5 text-sm text-white font-sans placeholder:text-white/20 focus:outline-none focus:border-cyan-300/40" />
            </div>
          </div>
          <button onClick={() => { setLocalPhase("placing-1"); setCurrentPlayer(1); }}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-sans font-medium text-white press-effect shadow-[0_0_20px_rgba(80,216,255,0.2)]">
            Commencer
          </button>
          {onReturnToLobby && (
            <button onClick={onReturnToLobby} className="text-xs text-white/30 font-sans hover:text-white/50">
              Retour
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Handoff between players ──
  if (localPhase === "handoff") {
    const nextName = p2Ships.length === 0 ? player2Name : (currentPlayer === 1 ? player1Name : player2Name);
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl" style={{ animation: "scaleIn 0.4s ease" }}>
          <h2 className="text-2xl font-serif text-cyan-200" style={{ textShadow: "0 0 30px rgba(80,216,255,0.35)" }}>
            Passe le telephone a {nextName}
          </h2>
          <p className="text-xs text-white/30 font-sans">Ne regarde pas !</p>
          <button onClick={handleHandoffContinue}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 text-sm font-sans font-medium text-white press-effect shadow-[0_0_20px_rgba(80,216,255,0.2)]">
            C&apos;est bon, je suis {nextName}
          </button>
        </div>
      </div>
    );
  }

  // ── Placement Phase ──
  if (localPhase === "placing-1" || localPhase === "placing-2") {
    const allPlaced = remainingShips.length === 0;
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-4 rounded-3xl border border-cyan-300/20 bg-black/35 p-4 backdrop-blur-xl sm:p-6" style={{ animation: "scaleIn 0.4s ease" }}>
          <div className="text-center">
            <p className="text-xs text-white/30 font-sans">{currentName}, place tes navires</p>
          </div>

          {/* Ship selection */}
          <div className="flex flex-wrap gap-2 justify-center">
            {DEFAULT_SHIPS.map((s) => {
              const placed = placedIds.has(s.id);
              return (
                <button key={s.id} disabled={placed}
                  onClick={() => setSelectedShipId(s.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-sans transition-all",
                    placed ? "border-white/5 bg-white/[0.02] text-white/20 line-through" :
                    selectedShipId === s.id ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200" :
                    "border-white/10 bg-white/[0.03] text-white/60 hover:border-cyan-300/30"
                  )}>
                  {s.label ?? s.id} ({s.size})
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setHorizontal((h) => !h)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-sans text-white/60 hover:border-cyan-300/30">
              {horizontal ? "↔ Horizontal" : "↕ Vertical"}
            </button>
            <button onClick={handleRandomPlace}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-sans text-white/60 hover:border-cyan-300/30">
              Aleatoire
            </button>
            <button onClick={handleResetPlacement}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-sans text-white/60 hover:border-red-300/30">
              Reset
            </button>
          </div>

          {/* Grid for placement */}
          <div onMouseLeave={() => setHoverCells(new Set())}>
            <div className="flex flex-col items-center gap-1">
              <div className="flex">
                <div className="flex flex-col mr-0.5 mt-5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="flex items-center justify-center text-[9px] text-white/25 font-mono w-3" style={{ height: "clamp(28px, 7.5vw, 38px)" }}>
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="grid grid-cols-10 ml-0.5 mb-0.5">
                    {LETTERS.map((l) => (
                      <div key={l} className="flex items-center justify-center text-[9px] text-white/25 font-mono" style={{ width: "clamp(28px, 7.5vw, 38px)" }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-10 rounded-lg overflow-hidden border border-white/10"
                    style={{ "--cell": "clamp(28px, 7.5vw, 38px)" } as React.CSSProperties}>
                    {currentGrid.map((cell, idx) => {
                      const isHover = hoverCells.has(idx);
                      const isShip = cell === "ship";
                      return (
                        <button key={idx}
                          onClick={() => handlePlacementClick(idx)}
                          onMouseEnter={() => handleHover(idx)}
                          className={cn(
                            "w-[var(--cell)] h-[var(--cell)] border transition-all",
                            isShip ? "bg-cyan-500/35 border-cyan-300/25" : "bg-[#0c1a3a] border-cyan-300/8",
                            isHover && !isShip && "bg-cyan-400/20 border-cyan-300/35",
                          )} />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {allPlaced && (
            <button onClick={handleConfirmPlacement}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 text-sm font-sans font-medium text-white press-effect shadow-[0_0_20px_rgba(80,216,255,0.2)]"
              style={{ animation: "scaleIn 0.3s ease" }}>
              Confirmer
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Playing Phase ──
  if (localPhase === "playing") {
    if (!showingBoard) {
      // Handoff screen between shots
      return (
        <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
          <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl" style={{ animation: "scaleIn 0.4s ease" }}>
            <h2 className="text-2xl font-serif text-cyan-200" style={{ textShadow: "0 0 30px rgba(80,216,255,0.35)" }}>
              Tour de {currentName}
            </h2>
            <p className="text-xs text-white/30 font-sans">Appuie quand tu es pret</p>
            <button onClick={() => setShowingBoard(true)}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 text-sm font-sans font-medium text-white press-effect shadow-[0_0_20px_rgba(80,216,255,0.2)]">
              Voir la grille
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 rounded-3xl border border-cyan-300/20 bg-black/35 p-3 backdrop-blur-xl sm:p-4">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-white/30 font-sans">Tour de <span className="text-cyan-300">{currentName}</span></span>
            {lastShotResult && (
              <span className={cn("text-xs font-sans font-bold px-2 py-0.5 rounded",
                lastShotResult === "miss" ? "text-white/40 bg-white/5" :
                lastShotResult === "sunk" ? "text-red-300 bg-red-500/20" : "text-orange-300 bg-orange-500/20"
              )} style={{ animation: "scaleIn 0.2s ease" }}>
                {lastShotResult === "hit" ? "Touche !" : lastShotResult === "sunk" ? "Coule !" : "Rate !"}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            {/* Enemy grid (attack) */}
            <BattleGrid grid={enemyGrid} ships={enemyShips} onCellClick={handleFire}
              isEnemy disabled={false} label={`Grille de ${otherName}`} />
            {/* My grid (reference) */}
            <BattleGrid grid={currentGrid} ships={currentShips} label="Ta flotte" small />
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over ──
  if (localPhase === "game-over") {
    const winnerName = winner === 1 ? player1Name : player2Name;
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl" style={{ animation: "scaleIn 0.4s ease" }}>
          <div className="text-center" style={{ animation: "fadeUp 0.5s ease" }}>
            <p className="text-xs text-white/30 font-sans uppercase tracking-widest">Victoire</p>
            <h2 className="mt-2 text-4xl font-serif text-cyan-200" style={{ textShadow: "0 0 30px rgba(80,216,255,0.4)", animation: "scaleIn 0.6s ease 0.2s both" }}>
              {winnerName}
            </h2>
            <p className="mt-1 text-sm text-white/40 font-sans">a coule toute la flotte !</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => {
              setLocalPhase("setup");
              setP1Grid(makeEmptyGrid());
              setP2Grid(makeEmptyGrid());
              setP1Ships([]);
              setP2Ships([]);
              setWinner(null);
              setLastShotResult(null);
            }}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-sans font-medium text-white press-effect">
              Rejouer
            </button>
            {onReturnToLobby && (
              <button onClick={onReturnToLobby}
                className="rounded-xl border border-white/15 bg-white/[0.06] px-6 py-2.5 text-sm font-sans text-white/60 hover:bg-white/[0.1]">
                Retour
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Main Component ──────────────────────────────────────
export default function BattleshipGame({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const { sendAction } = useGame(roomCode, "battleship", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as OnlineState | null;

  const [entryMode, setEntryMode] = useState<"choose" | "local" | "multi">("choose");
  const [selectedShipId, setSelectedShipId] = useState<string | null>("carrier");
  const [horizontal, setHorizontal] = useState(true);
  const [hoverCells, setHoverCells] = useState<Set<number>>(new Set());

  // ── Entry Mode ──
  if (entryMode === "choose") {
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl" style={{ animation: "scaleIn 0.4s ease" }}>
          <div className="text-center">
            <p className="text-[11px] font-sans uppercase tracking-[0.22em] text-cyan-200/65">Bataille Navale</p>
            <h2 className="mt-1 text-3xl font-serif text-white">Choisis ton mode</h2>
          </div>
          <div className="w-full space-y-3">
            <button onClick={() => setEntryMode("multi")}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 text-left press-effect shadow-[0_0_20px_rgba(80,216,255,0.15)]">
              <p className="text-sm font-sans font-medium text-white">En ligne</p>
              <p className="text-xs text-white/50 font-sans">Joue contre un autre joueur</p>
            </button>
            <button onClick={() => setEntryMode("local")}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4 text-left hover:border-cyan-300/25 hover:bg-white/[0.06] transition-all press-effect">
              <p className="text-sm font-sans font-medium text-white/80">Local</p>
              <p className="text-xs text-white/40 font-sans">Deux joueurs sur un seul telephone</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (entryMode === "local") {
    return <LocalBattleship onReturnToLobby={onReturnToLobby} />;
  }

  // ── Online Mode ──
  if (!state || error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/40 font-sans animate-pulse">
          {error ?? "Connexion en cours..."}
        </p>
      </div>
    );
  }

  const shipsConfig = state.shipsConfig ?? DEFAULT_SHIPS;
  const myPlacedIds = new Set((state.myShips ?? []).map((s: Ship) => s.id));
  const remainingOnline = shipsConfig.filter((s: ShipConfig) => !myPlacedIds.has(s.id));

  const handleOnlineHover = (idx: number) => {
    if (!selectedShipId) { setHoverCells(new Set()); return; }
    const cfg = shipsConfig.find((s: ShipConfig) => s.id === selectedShipId);
    if (!cfg) return;
    const sx = idx % 10;
    const sy = Math.floor(idx / 10);
    const cells = new Set<number>();
    for (let i = 0; i < cfg.size; i++) {
      const x = horizontal ? sx + i : sx;
      const y = horizontal ? sy : sy + i;
      if (x < 10 && y < 10) cells.add(y * 10 + x);
    }
    setHoverCells(cells);
  };

  // ── Online Placement ──
  if (state.phase === "placing") {
    const allPlaced = state.myAllPlaced;

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-4 rounded-3xl border border-cyan-300/20 bg-black/35 p-4 backdrop-blur-xl sm:p-6" style={{ animation: "scaleIn 0.4s ease" }}>
          <div className="text-center">
            <p className="text-xs text-white/30 font-sans">
              {allPlaced ? "En attente de l'adversaire..." : "Place tes navires"}
            </p>
            {state.opponentReady && <p className="text-[10px] text-cyan-300/50 font-sans mt-1">Adversaire pret</p>}
          </div>

          {!allPlaced && (
            <>
              <div className="flex flex-wrap gap-2 justify-center">
                {shipsConfig.map((s: ShipConfig) => {
                  const placed = myPlacedIds.has(s.id);
                  return (
                    <button key={s.id} disabled={placed}
                      onClick={() => setSelectedShipId(s.id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-sans transition-all",
                        placed ? "border-white/5 bg-white/[0.02] text-white/20 line-through" :
                        selectedShipId === s.id ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200" :
                        "border-white/10 bg-white/[0.03] text-white/60 hover:border-cyan-300/30"
                      )}>
                      {s.label ?? s.id} ({s.size})
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setHorizontal((h) => !h)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-sans text-white/60">
                {horizontal ? "↔ Horizontal" : "↕ Vertical"}
              </button>
            </>
          )}

          <div onMouseLeave={() => setHoverCells(new Set())}>
            <div className="flex flex-col items-center gap-1">
              <div className="flex">
                <div className="flex flex-col mr-0.5 mt-5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="flex items-center justify-center text-[9px] text-white/25 font-mono w-3" style={{ height: "clamp(28px, 7.5vw, 38px)" }}>{i + 1}</div>
                  ))}
                </div>
                <div>
                  <div className="grid grid-cols-10 ml-0.5 mb-0.5">
                    {LETTERS.map((l) => (
                      <div key={l} className="flex items-center justify-center text-[9px] text-white/25 font-mono" style={{ width: "clamp(28px, 7.5vw, 38px)" }}>{l}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-10 rounded-lg overflow-hidden border border-white/10"
                    style={{ "--cell": "clamp(28px, 7.5vw, 38px)" } as React.CSSProperties}>
                    {(state.myGrid ?? makeEmptyGrid()).map((cell: CellState, idx: number) => {
                      const isHover = hoverCells.has(idx);
                      const isShip = cell === "ship";
                      return (
                        <button key={idx}
                          onClick={() => {
                            if (!allPlaced && selectedShipId) {
                              sendAction({ action: "place-ship", shipId: selectedShipId, startIdx: idx, horizontal });
                              const next = remainingOnline.find((s: ShipConfig) => s.id !== selectedShipId);
                              setSelectedShipId(next?.id ?? null);
                            }
                          }}
                          onMouseEnter={() => handleOnlineHover(idx)}
                          disabled={allPlaced}
                          className={cn(
                            "w-[var(--cell)] h-[var(--cell)] border transition-all",
                            isShip ? "bg-cyan-500/35 border-cyan-300/25" : "bg-[#0c1a3a] border-cyan-300/8",
                            isHover && !isShip && "bg-cyan-400/20 border-cyan-300/35",
                            allPlaced && "cursor-default",
                          )} />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {allPlaced && (
            <p className="text-xs text-white/20 font-sans animate-pulse">En attente de l&apos;adversaire...</p>
          )}
        </div>
      </div>
    );
  }

  // ── Online Playing ──
  if (state.phase === "playing") {
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-3 rounded-3xl border border-cyan-300/20 bg-black/35 p-3 backdrop-blur-xl sm:p-4">
          <div className="flex items-center justify-between w-full">
            <span className={cn("text-sm font-sans font-medium", state.isMyTurn ? "text-cyan-300" : "text-white/40")}>
              {state.isMyTurn ? "A toi de tirer !" : `Tour de ${state.opponentName ?? "l'adversaire"}...`}
            </span>
            {state.lastShot && (
              <span className={cn("text-xs font-sans font-bold px-2 py-0.5 rounded",
                state.lastShot.result === "miss" ? "text-white/40 bg-white/5" :
                state.lastShot.result === "sunk" ? "text-red-300 bg-red-500/20" : "text-orange-300 bg-orange-500/20"
              )} style={{ animation: "scaleIn 0.2s ease" }}>
                {state.lastShot.result === "hit" ? "Touche !" : state.lastShot.result === "sunk" ? "Coule !" : "Rate !"}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            <BattleGrid
              grid={state.opponentGrid ?? makeEmptyGrid()}
              ships={state.opponentShipsSunk}
              onCellClick={(idx) => {
                if (state.isMyTurn) sendAction({ action: "fire", idx });
              }}
              isEnemy
              disabled={!state.isMyTurn}
              label={state.opponentName ?? "Adversaire"}
            />
            <BattleGrid
              grid={state.myGrid ?? makeEmptyGrid()}
              ships={state.myShips}
              label="Ta flotte"
              small
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Online Game Over ──
  if (state.phase === "game-over") {
    const iWon = state.winner === playerId;
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]" />
        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl" style={{ animation: "scaleIn 0.4s ease" }}>
          <div className="text-center" style={{ animation: "fadeUp 0.5s ease" }}>
            <p className="text-xs text-white/30 font-sans uppercase tracking-widest">
              {iWon ? "Victoire !" : "Defaite"}
            </p>
            <h2 className={cn("mt-2 text-4xl font-serif", iWon ? "text-cyan-200" : "text-red-300")}
              style={{ textShadow: iWon ? "0 0 30px rgba(80,216,255,0.4)" : "0 0 30px rgba(239,68,68,0.3)", animation: "scaleIn 0.6s ease 0.2s both" }}>
              {state.winnerName ?? "?"}
            </h2>
            <p className="mt-1 text-sm text-white/40 font-sans">a coule toute la flotte !</p>
          </div>
          <p className="text-xs text-white/20 font-sans animate-pulse">Retour au lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-white/40 font-sans animate-pulse">Chargement...</p>
    </div>
  );
}
