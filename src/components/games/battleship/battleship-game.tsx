"use client";

import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
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

// ── Naval design system (maquettes BS) ─────────────────────
const BS_SONAR = "#00FFB4";
const BS_INK = "#E8F4F8";
const BS_INKMUTE = "#6B8AA0";
const NAVAL_BG = "radial-gradient(120% 70% at 50% 0%, rgba(0,255,180,0.10) 0%, transparent 55%), linear-gradient(180deg,#020F18 0%,#031826 100%)";
const NAVAL_SCANLINES = "repeating-linear-gradient(0deg, rgba(0,255,180,0.04) 0px, rgba(0,255,180,0.04) 1px, transparent 1px, transparent 4px)";

type BotLevel2 = "mousse" | "capitaine" | "amiral";
const BS_AI_LEVELS: Array<{ id: BotLevel2; name: string; desc: string; color: string; icon: string }> = [
  { id: "mousse", name: "Mousse", desc: "tire au hasard", color: BS_SONAR, icon: "🌊" },
  { id: "capitaine", name: "Capitaine", desc: "stratégie classique", color: "#FFD23F", icon: "⚓" },
  { id: "amiral", name: "Amiral", desc: "probabilités avancées", color: "#FF3838", icon: "💀" },
];

function NavalShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto font-sans" style={{
      background: NAVAL_BG, color: BS_INK,
      padding: "calc(env(safe-area-inset-top,0px) + 18px) 16px calc(env(safe-area-inset-bottom,0px) + 26px)",
    }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: NAVAL_SCANLINES, mixBlendMode: "screen" }} />
      <div className="relative mx-auto flex w-full max-w-[460px] flex-1 flex-col">{children}</div>
    </div>
  );
}

// Mini radar animé (hero BS01).
function SonarHero({ size = 240 }: { size?: number }) {
  const n = 10;
  const cell = size / n;
  const blips = [
    { x: 2, y: 3, hit: false }, { x: 5, y: 5, hit: true }, { x: 7, y: 2, hit: false },
    { x: 8, y: 7, hit: true }, { x: 3, y: 7, hit: false },
  ];
  return (
    <div className="relative overflow-hidden rounded-xl" style={{
      width: size, height: size,
      background: "radial-gradient(circle at 50% 50%, rgba(0,255,180,0.10), transparent 60%), #020F18",
      boxShadow: "0 18px 36px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,255,180,0.08), inset 0 0 0 1px rgba(0,255,180,0.30)",
    }}>
      <svg width={size} height={size} className="absolute inset-0">
        {Array.from({ length: n + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={i * cell} y1={0} x2={i * cell} y2={size} stroke={BS_SONAR} strokeWidth={i === 0 || i === n ? 1 : 0.5} opacity={0.3} />
        ))}
        {Array.from({ length: n + 1 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * cell} x2={size} y2={i * cell} stroke={BS_SONAR} strokeWidth={i === 0 || i === n ? 1 : 0.5} opacity={0.3} />
        ))}
      </svg>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", background: `conic-gradient(from 0deg, ${BS_SONAR}30 0deg, transparent 70deg)` }} />
      {blips.map((b, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: b.x * cell + cell * 0.2, top: b.y * cell + cell * 0.2, width: cell * 0.6, height: cell * 0.6,
          background: b.hit ? "#FF3838" : "transparent", border: b.hit ? "none" : `2px solid ${BS_SONAR}`,
          boxShadow: b.hit ? "0 0 10px #FF3838" : `0 0 8px ${BS_SONAR}`,
        }} />
      ))}
    </div>
  );
}

function BSModeRow({ icon, title, sub, accent, onClick }: { icon: string; title: string; sub: string; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3.5 rounded-[14px] p-3.5 text-left transition active:scale-[0.98]"
      style={{ background: "rgba(168,184,197,0.04)", border: "1px solid rgba(168,184,197,0.15)" }}>
      <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl text-[22px]" style={{ background: `${accent}1A`, border: `1px solid ${accent}33` }}>{icon}</span>
      <span className="flex-1">
        <span className="block text-[17px] font-extrabold leading-none" style={{ color: BS_INK }}>{title}</span>
        <span className="mt-1 block text-xs" style={{ color: BS_INKMUTE }}>{sub}</span>
      </span>
      <span style={{ color: accent, fontSize: 20, fontWeight: 800 }}>›</span>
    </button>
  );
}

function BSStepHeader({ onBack, sub, title, tag, tagColor = BS_SONAR }: { onBack: () => void; sub: string; title: string; tag: string; tagColor?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onBack} aria-label="Retour" className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl text-lg leading-none"
        style={{ background: "rgba(0,255,180,0.08)", border: "1px solid rgba(0,255,180,0.25)", color: BS_SONAR }}>‹</button>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] font-extrabold uppercase tracking-[2px]" style={{ color: BS_SONAR }}>{sub}</div>
        <div className="mt-0.5 text-[22px] font-extrabold leading-none tracking-tight" style={{ color: BS_INK }}>{title}</div>
      </div>
      <span className="font-mono text-[9px] font-extrabold uppercase tracking-[2px]" style={{ color: tagColor, padding: "4px 9px", borderRadius: 4, border: `1px solid ${tagColor}55`, background: `${tagColor}11` }}>{tag}</span>
    </div>
  );
}

// Silhouette de navire (barre) pour la liste de flotte BS03.
function ShipBar({ len }: { len: number }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: len }).map((_, i) => (
        <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: i === 0 ? "#A8B8C5" : "#5A7691" }} />
      ))}
    </div>
  );
}

// ── Bot AI (local vs IA) ────────────────────────────────────
function enqueueNeighbors(idx: number, grid: CellState[], queue: number[]) {
  const x = idx % 10, y = Math.floor(idx / 10);
  const nbrs = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
  for (const [nx, ny] of nbrs) {
    if (nx < 0 || nx >= 10 || ny < 0 || ny >= 10) continue;
    const ni = ny * 10 + nx;
    if (grid[ni] === "empty" || grid[ni] === "ship") {
      if (!queue.includes(ni)) queue.push(ni);
    }
  }
}

function pickBotTarget(grid: CellState[], queue: number[], level: BotLevel2): number | null {
  // Mode chasse ciblée : suit les touches déjà trouvées.
  if (level !== "mousse") {
    while (queue.length > 0) {
      const c = queue.pop()!;
      if (grid[c] === "empty" || grid[c] === "ship") return c;
    }
  }
  // Mode recherche.
  const all: number[] = [];
  const parity: number[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (grid[i] === "hit" || grid[i] === "miss") continue;
    all.push(i);
    if (((i % 10) + Math.floor(i / 10)) % 2 === 0) parity.push(i);
  }
  if (all.length === 0) return null;
  const pool = level === "mousse" ? all : parity.length > 0 ? parity : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

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

// ── Ship visual config ──────────────────────────────────
const SHIP_STYLES: Record<string, { gradient: string; border: string; icon: string }> = {
  carrier:    { gradient: "from-slate-500/70 to-slate-700/60", border: "border-slate-300/40", icon: "\u2693" },   // anchor
  battleship: { gradient: "from-zinc-500/70 to-zinc-600/60",  border: "border-zinc-300/40",  icon: "\u{1F4A3}" },   // bomb
  cruiser1:   { gradient: "from-cyan-500/60 to-teal-600/50",  border: "border-cyan-300/35",  icon: "\u{1F6A2}" },   // ship
  cruiser2:   { gradient: "from-blue-500/60 to-indigo-600/50", border: "border-blue-300/35", icon: "\u{1F30A}" },   // wave
  destroyer:  { gradient: "from-amber-500/60 to-orange-600/50", border: "border-amber-300/40", icon: "\u26A1" }, // bolt
};
const DEFAULT_SHIP_STYLE = { gradient: "from-cyan-500/50 to-blue-600/40", border: "border-cyan-300/30", icon: "" };

// ── Ship shape helpers ──────────────────────────────────
interface ShipEdgeInfo {
  isShip: boolean;
  shipId: string;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  isHead: boolean;
  isTail: boolean;
  isHoriz: boolean;
}

function getShipEdges(ships: Ship[], idx: number): ShipEdgeInfo {
  for (const s of ships) {
    const pos = s.cells.indexOf(idx);
    if (pos === -1) continue;
    const isHoriz = s.cells.length > 1 && Math.abs(s.cells[0] - s.cells[1]) === 1;
    const isHead = pos === 0;
    const isTail = pos === s.cells.length - 1;
    return {
      isShip: true,
      shipId: s.id,
      top: isHoriz || isHead,
      bottom: isHoriz || isTail,
      left: !isHoriz || isHead,
      right: !isHoriz || isTail,
      isHead,
      isTail,
      isHoriz,
    };
  }
  return { isShip: false, shipId: "", top: false, bottom: false, left: false, right: false, isHead: false, isTail: false, isHoriz: false };
}

function getShipCellRadius(edges: ShipEdgeInfo): string {
  if (!edges.isShip) return "0";
  const r = "40%";
  const z = "0";
  if (edges.isHoriz) {
    // Horizontal ship
    const tl = edges.isHead ? r : z;
    const tr = edges.isTail ? r : z;
    const br = edges.isTail ? r : z;
    const bl = edges.isHead ? r : z;
    return `${tl} ${tr} ${br} ${bl}`;
  } else {
    // Vertical ship
    const tl = edges.isHead ? r : z;
    const tr = edges.isHead ? r : z;
    const br = edges.isTail ? r : z;
    const bl = edges.isTail ? r : z;
    return `${tl} ${tr} ${br} ${bl}`;
  }
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
  hideShips,
}: {
  grid: CellState[];
  ships?: Ship[];
  onCellClick?: (idx: number) => void;
  isEnemy?: boolean;
  disabled?: boolean;
  highlightCells?: Set<number>;
  label: string;
  small?: boolean;
  hideShips?: boolean;
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

  const shipCells = useMemo(() => {
    if (!ships) return new Set<number>();
    const set = new Set<number>();
    for (const s of ships) for (const c of s.cells) set.add(c);
    return set;
  }, [ships]);

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
              const showShip = !isEnemy && !hideShips && (cell === "ship" || shipCells.has(idx));
              const edges = showShip && ships ? getShipEdges(ships, idx) : null;
              const shipStyle = edges?.isShip ? (SHIP_STYLES[edges.shipId] ?? DEFAULT_SHIP_STYLE) : null;
              const radius = edges ? getShipCellRadius(edges) : "0";
              const isMidCell = edges?.isShip && !edges.isHead && !edges.isTail;

              return (
                <button
                  key={idx}
                  onClick={() => onCellClick?.(idx)}
                  disabled={disabled || (!isEnemy)}
                  className={cn(
                    "w-[var(--cell)] h-[var(--cell)] transition-all relative",
                    // Base empty cell
                    !showShip && CELL_COLORS[isEnemy && cell === "ship" ? "empty" : (isHit ? "hit" : isMiss ? "miss" : "empty")],
                    !showShip && "border border-cyan-300/8",
                    // Ship hull styling
                    showShip && !isHit && `bg-gradient-to-br ${shipStyle?.gradient ?? "from-cyan-500/50 to-blue-600/40"}`,
                    showShip && !isHit && "border-2",
                    showShip && !isHit && (shipStyle?.border ?? "border-cyan-300/30"),
                    showShip && isHit && "bg-red-500/50 border-2 border-red-400/40",
                    isHighlight && "bg-cyan-400/20 border-cyan-300/40",
                    isSunk && isHit && "bg-red-600/50 border-red-400/30",
                    isEnemy && !disabled && cell !== "hit" && cell !== "miss" && "hover:bg-cyan-300/15 cursor-crosshair",
                    disabled && isEnemy && "cursor-not-allowed",
                  )}
                  style={{ borderRadius: showShip ? radius : undefined }}
                >
                  {/* Ship hull shine */}
                  {showShip && !isHit && (
                    <span className="absolute inset-0 pointer-events-none" style={{
                      borderRadius: radius,
                      background: edges?.isHoriz
                        ? "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                        : "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                    }} />
                  )}
                  {/* Porthole on mid cells */}
                  {showShip && !isHit && isMidCell && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full border border-white/25 bg-white/8" />
                    </span>
                  )}
                  {/* Ship icon on head cell */}
                  {showShip && !isHit && edges?.isHead && shipStyle?.icon && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-60 drop-shadow-sm">
                      {shipStyle.icon}
                    </span>
                  )}
                  {isHit && (
                    <span className="absolute inset-0 flex items-center justify-center text-red-400 font-bold text-sm drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]">
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
function LocalBattleship({ onReturnToLobby, onBackToModes, initialBot = false }: { onReturnToLobby?: () => void; onBackToModes?: () => void; initialBot?: boolean }) {
  const [localPhase, setLocalPhase] = useState<"setup" | "placing-1" | "placing-2" | "handoff" | "playing" | "game-over">("setup");
  const [vsBot] = useState(initialBot);
  const [botLevel, setBotLevel] = useState<BotLevel2>("capitaine");
  const [botTurn, setBotTurn] = useState(false);
  const [botTick, setBotTick] = useState(0);
  const botQueueRef = useRef<number[]>([]);
  const [player1Name, setPlayer1Name] = useState("Joueur 1");
  const [player2Name, setPlayer2Name] = useState(initialBot ? "L'IA" : "Joueur 2");
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

  // Refs pour le bot (lecture de l'état frais sans relancer l'effet).
  const p1GridRef = useRef(p1Grid);
  const p1ShipsRef = useRef(p1Ships);
  useEffect(() => { p1GridRef.current = p1Grid; }, [p1Grid]);
  useEffect(() => { p1ShipsRef.current = p1Ships; }, [p1Ships]);

  // Tour de l'IA : tire sur la flotte du joueur, rejoue tant qu'elle touche.
  useEffect(() => {
    if (!vsBot || !botTurn || localPhase !== "playing" || winner) return;
    const delay = botLevel === "amiral" ? 520 : 680;
    const t = setTimeout(() => {
      const grid = [...p1GridRef.current];
      const target = pickBotTarget(grid, botQueueRef.current, botLevel);
      if (target == null) { setBotTurn(false); return; }
      if (grid[target] === "ship") {
        grid[target] = "hit";
        enqueueNeighbors(target, grid, botQueueRef.current);
        setP1Grid(grid);
        if (allShipsSunk(p1ShipsRef.current, grid)) {
          setWinner(2);
          setLocalPhase("game-over");
          setBotTurn(false);
          return;
        }
        setBotTick((x) => x + 1); // rejoue
      } else {
        grid[target] = "miss";
        setP1Grid(grid);
        setBotTurn(false); // rend la main
      }
    }, delay);
    return () => clearTimeout(t);
  }, [vsBot, botTurn, botTick, localPhase, winner, botLevel]);

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
      if (vsBot) {
        // L'IA place sa flotte automatiquement, on saute le passage de téléphone.
        const { grid, ships } = randomPlacement();
        setP2Grid(grid);
        setP2Ships(ships);
        botQueueRef.current = [];
        setCurrentPlayer(1);
        setShowingBoard(true);
        setBotTurn(false);
        setLocalPhase("playing");
        return;
      }
      setLocalPhase("handoff");
      setCurrentPlayer(2);
      setSelectedShipId(DEFAULT_SHIPS[0].id);
      setHorizontal(true);
    } else if (localPhase === "placing-2") {
      setLocalPhase("handoff");
      setCurrentPlayer(1); // Player 1 starts
    }
  }, [localPhase, vsBot]);

  const handleHandoffContinue = useCallback(() => {
    if (p2Ships.length === 0) {
      setLocalPhase("placing-2");
    } else {
      setLocalPhase("playing");
      setShowingBoard(false);
    }
  }, [p2Ships.length]);

  const [shotLocked, setShotLocked] = useState(false);

  const handleFire = useCallback((idx: number) => {
    if (localPhase !== "playing" || shotLocked) return;
    if (vsBot && botTurn) return; // l'IA joue, pas le joueur
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
      // Hit = same player shoots again (no turn switch)
    } else {
      newGrid[idx] = "miss";
      setEnemyGrid(newGrid);
      setLastShotResult("miss");
      if (vsBot) {
        // Tour de l'IA, pas d'écran de passage.
        setTimeout(() => { setLastShotResult(null); setBotTurn(true); }, 700);
      } else {
        setShotLocked(true);
        // Switch turns after a delay — show handoff screen
        setTimeout(() => {
          setCurrentPlayer((p) => (p === 1 ? 2 : 1));
          setShowingBoard(false);
          setLastShotResult(null);
          setShotLocked(false);
        }, 1500);
      }
    }
  }, [localPhase, enemyGrid, setEnemyGrid, enemyShips, currentPlayer, shotLocked, vsBot, botTurn]);

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

  // ── Setup (BS02 adversaire / duel) ──
  if (localPhase === "setup") {
    const startPlacement = () => { setLocalPhase("placing-1"); setCurrentPlayer(1); setSelectedShipId(DEFAULT_SHIPS[0].id); setHorizontal(true); };
    return (
      <NavalShell>
        <BSStepHeader
          onBack={onBackToModes ?? onReturnToLobby ?? (() => {})}
          sub={vsBot ? "Setup · 1/2" : "Mode local"}
          title={vsBot ? "Adversaire" : "Les amiraux"}
          tag={vsBot ? "vs IA" : "DUEL"}
          tagColor={vsBot ? BS_SONAR : "#FFD23F"}
        />

        {vsBot ? (
          <>
            <div className="mt-6 flex justify-center">
              <div className="flex items-center justify-center" style={{
                width: 100, height: 100, borderRadius: 28, fontSize: 52,
                background: `linear-gradient(160deg, ${BS_SONAR}22 0%, rgba(0,0,0,0.35) 100%)`,
                border: `1px solid ${BS_SONAR}40`, boxShadow: `0 18px 40px ${BS_SONAR}33, inset 0 1px 0 rgba(255,255,255,0.10)`,
              }}>📡</div>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              {BS_AI_LEVELS.map((l) => {
                const active = botLevel === l.id;
                return (
                  <button key={l.id} onClick={() => setBotLevel(l.id)} className="flex items-center gap-3.5 rounded-[14px] px-4 py-3.5 text-left transition" style={{
                    background: active ? `linear-gradient(160deg, ${l.color}22 0%, rgba(0,0,0,0.30) 100%)` : "rgba(168,184,197,0.04)",
                    border: active ? `2px solid ${l.color}` : "1px solid rgba(168,184,197,0.15)",
                    boxShadow: active ? `0 14px 28px ${l.color}30` : "none",
                  }}>
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px]" style={{ background: `${l.color}1A`, border: `1px solid ${l.color}40` }}>{l.icon}</span>
                    <span className="flex-1">
                      <span className="block text-[18px] font-extrabold leading-none" style={{ color: BS_INK }}>{l.name}</span>
                      <span className="mt-1 block font-mono text-[10px] font-extrabold uppercase tracking-wider" style={{ color: l.color }}>{l.desc}</span>
                    </span>
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12px] font-black" style={{ border: active ? `2px solid ${l.color}` : "1.5px solid rgba(168,184,197,0.25)", background: active ? l.color : "transparent", color: "#031826" }}>{active ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="mt-6 font-mono text-[10px] font-extrabold uppercase tracking-[2px]" style={{ color: BS_INKMUTE }}>Les deux amiraux</p>
            <div className="mt-3 flex flex-col gap-2.5">
              <input value={player1Name} onChange={(e) => setPlayer1Name(e.target.value)} maxLength={15} placeholder="Joueur 1"
                className="w-full rounded-xl px-4 py-3 text-sm font-sans text-white outline-none" style={{ background: "rgba(168,184,197,0.04)", border: `1px solid ${BS_SONAR}33` }} />
              <input value={player2Name} onChange={(e) => setPlayer2Name(e.target.value)} maxLength={15} placeholder="Joueur 2"
                className="w-full rounded-xl px-4 py-3 text-sm font-sans text-white outline-none" style={{ background: "rgba(168,184,197,0.04)", border: `1px solid ${BS_SONAR}33` }} />
            </div>
          </>
        )}

        {/* Flotte (BS03) */}
        <p className="mt-6 font-mono text-[10px] font-extrabold uppercase tracking-[2px]" style={{ color: BS_INKMUTE }}>Ta flotte · 5 navires</p>
        <div className="mt-2.5 flex flex-col gap-2 rounded-[14px] p-3.5" style={{ background: "rgba(168,184,197,0.04)", border: "1px solid rgba(168,184,197,0.10)" }}>
          {DEFAULT_SHIPS.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs font-bold" style={{ color: BS_INK }}>{s.label ?? s.id}</div>
                <div className="font-mono text-[9px] font-bold tracking-wide" style={{ color: BS_INKMUTE }}>{s.size} CASES</div>
              </div>
              <ShipBar len={s.size} />
            </div>
          ))}
        </div>

        <button onClick={startPlacement} className="mt-auto pt-7">
          <span className="flex items-center justify-center gap-2 rounded-[14px] py-4 text-base font-bold" style={{ background: `linear-gradient(180deg, ${BS_SONAR} 0%, #00A878 100%)`, color: "#031826", boxShadow: `0 14px 30px rgba(0,255,180,0.40), inset 0 1px 0 rgba(255,255,255,0.30)` }}>
            <span style={{ fontSize: 18 }}>⚓</span> {vsBot ? "Placer ma flotte" : "Placer les flottes"}
          </span>
        </button>
      </NavalShell>
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
              const style = SHIP_STYLES[s.id] ?? DEFAULT_SHIP_STYLE;
              return (
                <button key={s.id} disabled={placed}
                  onClick={() => setSelectedShipId(s.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-sans transition-all flex items-center gap-1.5",
                    placed ? "border-white/5 bg-white/[0.02] text-white/20 line-through" :
                    selectedShipId === s.id ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200" :
                    "border-white/10 bg-white/[0.03] text-white/60 hover:border-cyan-300/30"
                  )}>
                  <span className="text-[11px]">{style.icon}</span>
                  {s.label ?? s.id} ({s.size})
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-white/20 font-sans sm:hidden">Maintiens un navire pour le deplacer</p>

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
                      const edges = isShip ? getShipEdges(currentShips, idx) : null;
                      const shipStyle = edges?.isShip ? (SHIP_STYLES[edges.shipId] ?? DEFAULT_SHIP_STYLE) : null;
                      const radius = edges ? getShipCellRadius(edges) : "0";
                      const isMidCell = edges?.isShip && !edges.isHead && !edges.isTail;
                      return (
                        <button key={idx}
                          onClick={() => handlePlacementClick(idx)}
                          onMouseEnter={() => handleHover(idx)}
                          onTouchStart={(e) => {
                            if (!isShip) return;
                            const ship = currentShips.find((s) => s.cells.includes(idx));
                            if (!ship) return;
                            const timer = setTimeout(() => {
                              // Long press: pick up ship to move it
                              const newGrid = [...currentGrid];
                              for (const c of ship.cells) newGrid[c] = "empty";
                              setCurrentGrid(newGrid);
                              setCurrentShips((prev) => prev.filter((s) => s.id !== ship.id));
                              setSelectedShipId(ship.id);
                              const cfg = DEFAULT_SHIPS.find((s) => s.id === ship.id);
                              if (cfg) {
                                const isH = ship.cells.length > 1 && Math.abs(ship.cells[0] - ship.cells[1]) === 1;
                                setHorizontal(isH);
                              }
                            }, 400);
                            const el = e.currentTarget;
                            const clearTimer = () => { clearTimeout(timer); el.removeEventListener("touchend", clearTimer); el.removeEventListener("touchmove", clearTimer); };
                            el.addEventListener("touchend", clearTimer, { once: true });
                            el.addEventListener("touchmove", clearTimer, { once: true });
                          }}
                          className={cn(
                            "w-[var(--cell)] h-[var(--cell)] transition-all relative",
                            isShip ? `bg-gradient-to-br ${shipStyle?.gradient ?? "from-cyan-500/50 to-blue-600/40"} border-2 ${shipStyle?.border ?? "border-cyan-300/30"}`
                              : "bg-[#0c1a3a] border border-cyan-300/8",
                            isHover && !isShip && "bg-cyan-400/20 border-cyan-300/35",
                          )}
                          style={{ borderRadius: isShip ? radius : undefined }}>
                          {/* Hull shine */}
                          {isShip && (
                            <span className="absolute inset-0 pointer-events-none" style={{
                              borderRadius: radius,
                              background: edges?.isHoriz
                                ? "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                                : "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                            }} />
                          )}
                          {/* Porthole */}
                          {isShip && isMidCell && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full border border-white/25 bg-white/8" />
                            </span>
                          )}
                          {/* Ship icon */}
                          {isShip && edges?.isHead && shipStyle?.icon && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-60">
                              {shipStyle.icon}
                            </span>
                          )}
                        </button>
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
    // Vs IA : grille ennemie + ta flotte, pas d'écran de passage.
    if (vsBot) {
      return (
        <NavalShell>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-[2px]" style={{ color: BS_SONAR }}>Opération · {botLevel}</span>
            {lastShotResult && (
              <span className="rounded px-2 py-0.5 text-xs font-bold" style={{
                color: lastShotResult === "miss" ? BS_INKMUTE : lastShotResult === "sunk" ? "#FF8A8A" : "#FFB84D",
                background: lastShotResult === "miss" ? "rgba(255,255,255,0.05)" : lastShotResult === "sunk" ? "rgba(255,56,56,0.20)" : "rgba(255,184,77,0.18)",
              }}>{lastShotResult === "hit" ? "Touché !" : lastShotResult === "sunk" ? "Coulé !" : "Raté !"}</span>
            )}
          </div>
          <div className="mt-2 text-center text-sm font-bold" style={{ color: botTurn ? "#FFB84D" : BS_SONAR }}>
            {botTurn ? "📡 L'ennemi tire…" : "À toi de tirer"}
          </div>
          <div className="mt-3 flex flex-col items-center gap-4">
            <div style={{ opacity: botTurn ? 0.55 : 1, transition: "opacity 0.3s" }}>
              <BattleGrid grid={p2Grid} ships={p2Ships} onCellClick={handleFire} isEnemy disabled={botTurn} label={`Cible · ${player2Name}`} />
            </div>
            <BattleGrid grid={p1Grid} ships={p1Ships} label={`Ta flotte · ${player1Name}`} small />
          </div>
          {onReturnToLobby && (
            <button onClick={onReturnToLobby} className="mx-auto mt-4 rounded-xl px-4 py-2 text-xs" style={{ border: `1px solid ${BS_SONAR}33`, color: BS_INKMUTE }}>Quitter</button>
          )}
        </NavalShell>
      );
    }
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

          {/* Enemy grid only — no own grid shown in local to prevent cheating */}
          <BattleGrid grid={enemyGrid} ships={enemyShips} onCellClick={handleFire}
            isEnemy disabled={shotLocked} label={`Grille de ${otherName}`} />
        </div>
      </div>
    );
  }

  // ── Game Over ──
  if (localPhase === "game-over") {
    const winnerName = winner === 1 ? player1Name : player2Name;
    const playerLost = vsBot && winner === 2;
    const accent = playerLost ? "#FF3838" : BS_SONAR;
    return (
      <NavalShell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-mono text-[11px] font-extrabold uppercase tracking-[3px]" style={{ color: BS_INKMUTE }}>
            {playerLost ? "Flotte coulée" : "Victoire"}
          </p>
          <div className="mt-3 text-[56px]">{playerLost ? "💀" : "🏆"}</div>
          <h2 className="mt-2 text-4xl font-black" style={{ color: accent, textShadow: `0 0 30px ${accent}66` }}>{winnerName}</h2>
          <p className="mt-1 text-sm" style={{ color: BS_INKMUTE }}>
            {playerLost ? "a coulé ta flotte…" : "a coulé toute la flotte !"}
          </p>
          <div className="mt-8 flex gap-3">
            <button onClick={() => {
              setLocalPhase("setup");
              setP1Grid(makeEmptyGrid());
              setP2Grid(makeEmptyGrid());
              setP1Ships([]);
              setP2Ships([]);
              setWinner(null);
              setLastShotResult(null);
              setBotTurn(false);
              botQueueRef.current = [];
            }}
              className="rounded-xl px-6 py-3 text-sm font-bold" style={{ background: `linear-gradient(180deg, ${BS_SONAR} 0%, #00A878 100%)`, color: "#031826", boxShadow: "0 14px 30px rgba(0,255,180,0.40)" }}>
              Rejouer
            </button>
            {onReturnToLobby && (
              <button onClick={onReturnToLobby} className="rounded-xl px-6 py-3 text-sm" style={{ border: `1px solid ${BS_SONAR}33`, color: BS_INKMUTE }}>
                Retour
              </button>
            )}
          </div>
        </div>
      </NavalShell>
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
  const [botStart, setBotStart] = useState(false);
  const [selectedShipId, setSelectedShipId] = useState<string | null>("carrier");
  const [horizontal, setHorizontal] = useState(true);
  const [hoverCells, setHoverCells] = useState<Set<number>>(new Set());

  // ── BS01 · Mode select ──
  if (entryMode === "choose") {
    return (
      <NavalShell>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-extrabold uppercase tracking-[2px]" style={{ color: BS_SONAR }}>Opération · 0142</span>
          <span className="font-mono text-[9px] font-extrabold uppercase tracking-[2px]" style={{ color: BS_SONAR, padding: "4px 9px", borderRadius: 4, border: `1px solid ${BS_SONAR}55`, background: `${BS_SONAR}11` }}>Briefing</span>
        </div>

        <div className="mt-6 flex justify-center"><SonarHero size={240} /></div>

        <div className="mt-7 text-center">
          <h1 className="font-black" style={{ fontSize: 46, lineHeight: 0.9, letterSpacing: -2, color: BS_INK, textShadow: `0 0 36px ${BS_SONAR}55` }}>
            Bataille<br />
            <span style={{ background: `linear-gradient(120deg, ${BS_SONAR}, #FFD23F)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>navale</span>
          </h1>
          <p className="mt-3 text-[13px]" style={{ color: BS_INKMUTE }}>
            Coule la flotte ennemie. <em className="not-italic font-bold" style={{ color: BS_SONAR }}>Mer agitée.</em>
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-2.5">
          <BSModeRow icon="📡" title="Contre l'IA" sub="3 niveaux · solo" accent="#FFD23F" onClick={() => { setBotStart(true); setEntryMode("local"); }} />
          <BSModeRow icon="📱" title="Un seul téléphone" sub="On se passe l'appareil" accent={BS_SONAR} onClick={() => { setBotStart(false); setEntryMode("local"); }} />
          <BSModeRow icon="🌐" title="En ligne" sub="Avec un code de salle" accent="#FF3EA5" onClick={() => setEntryMode("multi")} />
        </div>
      </NavalShell>
    );
  }

  if (entryMode === "local") {
    return <LocalBattleship onReturnToLobby={onReturnToLobby} onBackToModes={() => setEntryMode("choose")} initialBot={botStart} />;
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
              {state.isMyTurn ? "A toi de tirer !" : "En attente..."}
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

          <div className={cn("flex flex-col sm:flex-row gap-4 items-center sm:items-start transition-opacity duration-300", !state.isMyTurn && "opacity-50")}>
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
