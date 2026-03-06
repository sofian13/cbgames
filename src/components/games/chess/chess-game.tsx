"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { cn } from "@/lib/utils";

type Color = "w" | "b";
type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
type BotLevel = "easy" | "medium" | "hard";
type ChessMode = "online" | "bot";
type EndReason = "checkmate" | "stalemate" | "resign" | "draw" | "timeout";

interface Piece {
  color: Color;
  type: PieceType;
}

interface ChessMove {
  from: number;
  to: number;
  promotion?: PieceType;
}

interface ChessPlayer {
  id: string;
  name: string;
  color: Color;
}

interface ChessState {
  phase: "waiting" | "playing" | "game-over";
  mode: ChessMode;
  botLevel: BotLevel;
  timeControlMinutes: number;
  board: Array<string | null>;
  turn: Color;
  whiteTimeMs: number;
  blackTimeMs: number;
  winner: Color | "draw" | null;
  reason: EndReason | null;
  lastMove: { from: number; to: number; fromSquare: string; toSquare: string } | null;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  players: ChessPlayer[];
  connectedPlayers: Array<{ id: string; name: string }>;
  myColor: Color | null;
  inCheck: boolean;
  legalMoves: Array<{ from: number; to: number }>;
}

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const PIECE_GLYPH: Record<string, string> = {
  wp: "\u2659",
  wn: "\u2658",
  wb: "\u2657",
  wr: "\u2656",
  wq: "\u2655",
  wk: "\u2654",
  bp: "\u265F",
  bn: "\u265E",
  bb: "\u265D",
  br: "\u265C",
  bq: "\u265B",
  bk: "\u265A",
};

const PIECE_SYMBOL: Record<string, string> = {
  wp: "\u2659",
  wn: "\u2658",
  wb: "\u2657",
  wr: "\u2656",
  wq: "\u2655",
  wk: "\u2654",
  bp: "\u265F",
  bn: "\u265E",
  bb: "\u265D",
  br: "\u265C",
  bq: "\u265B",
  bk: "\u265A",
};

const TIME_OPTIONS = [5, 10, 15, 30] as const;

function inside(x: number, y: number) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function makeIndex(x: number, y: number) {
  return y * 8 + x;
}

function otherColor(color: Color): Color {
  return color === "w" ? "b" : "w";
}

function decodePiece(code: string | null): Piece | null {
  if (!code || code.length !== 2) return null;
  const color = code[0] as Color;
  const type = code[1] as PieceType;
  if ((color !== "w" && color !== "b") || !"pnbrqk".includes(type)) return null;
  return { color, type };
}

function cloneBoard(board: Array<Piece | null>) {
  return board.map((p) => (p ? { ...p } : null));
}

function initialBoard(): Array<Piece | null> {
  const board: Array<Piece | null> = Array.from({ length: 64 }, () => null);
  const back: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  for (let x = 0; x < 8; x++) {
    board[makeIndex(x, 0)] = { color: "b", type: back[x] };
    board[makeIndex(x, 1)] = { color: "b", type: "p" };
    board[makeIndex(x, 6)] = { color: "w", type: "p" };
    board[makeIndex(x, 7)] = { color: "w", type: back[x] };
  }
  return board;
}

function generatePseudoMoves(
  board: Array<Piece | null>,
  from: number,
  forAttack = false
): ChessMove[] {
  const piece = board[from];
  if (!piece) return [];
  const x = from % 8;
  const y = Math.floor(from / 8);
  const moves: ChessMove[] = [];

  const addIfValid = (tx: number, ty: number) => {
    if (!inside(tx, ty)) return;
    const to = makeIndex(tx, ty);
    const target = board[to];
    if (!target) {
      moves.push({ from, to });
      return;
    }
    if (target.color !== piece.color) {
      moves.push({ from, to });
    }
  };

  if (piece.type === "p") {
    const dir = piece.color === "w" ? -1 : 1;
    const startRank = piece.color === "w" ? 6 : 1;
    const nextY = y + dir;

    for (const dx of [-1, 1]) {
      const tx = x + dx;
      const ty = nextY;
      if (!inside(tx, ty)) continue;
      const to = makeIndex(tx, ty);
      const target = board[to];
      if (forAttack) {
        moves.push({ from, to });
      } else if (target && target.color !== piece.color) {
        moves.push({ from, to });
      }
    }

    if (!forAttack && inside(x, nextY) && !board[makeIndex(x, nextY)]) {
      moves.push({ from, to: makeIndex(x, nextY) });
      const twoY = y + dir * 2;
      if (y === startRank && !board[makeIndex(x, twoY)]) {
        moves.push({ from, to: makeIndex(x, twoY) });
      }
    }
    return moves;
  }

  if (piece.type === "n") {
    const jumps = [
      [1, 2],
      [2, 1],
      [-1, 2],
      [-2, 1],
      [1, -2],
      [2, -1],
      [-1, -2],
      [-2, -1],
    ];
    for (const [dx, dy] of jumps) addIfValid(x + dx, y + dy);
    return moves;
  }

  if (piece.type === "k") {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        addIfValid(x + dx, y + dy);
      }
    }
    return moves;
  }

  const dirs: Array<[number, number]> = [];
  if (piece.type === "b" || piece.type === "q") dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
  if (piece.type === "r" || piece.type === "q") dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);

  for (const [dx, dy] of dirs) {
    let tx = x + dx;
    let ty = y + dy;
    while (inside(tx, ty)) {
      const to = makeIndex(tx, ty);
      const target = board[to];
      if (!target) {
        moves.push({ from, to });
      } else {
        if (target.color !== piece.color) moves.push({ from, to });
        break;
      }
      tx += dx;
      ty += dy;
    }
  }

  return moves;
}

function applyMove(board: Array<Piece | null>, move: ChessMove): Array<Piece | null> {
  const copy = cloneBoard(board);
  const piece = copy[move.from];
  if (!piece) return copy;
  copy[move.from] = null;

  const toRank = Math.floor(move.to / 8);
  const promoted =
    piece.type === "p" && (toRank === 0 || toRank === 7)
      ? { color: piece.color, type: move.promotion ?? "q" }
      : piece;
  copy[move.to] = { ...promoted };
  return copy;
}

function findKingSquare(board: Array<Piece | null>, color: Color) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.color === color && p.type === "k") return i;
  }
  return -1;
}

function isSquareAttacked(board: Array<Piece | null>, square: number, byColor: Color) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.color !== byColor) continue;
    const moves = generatePseudoMoves(board, i, true);
    if (moves.some((m) => m.to === square)) return true;
  }
  return false;
}

function isInCheck(board: Array<Piece | null>, color: Color) {
  const king = findKingSquare(board, color);
  if (king < 0) return true;
  return isSquareAttacked(board, king, otherColor(color));
}

function generateLegalMoves(board: Array<Piece | null>, color: Color): ChessMove[] {
  const legal: ChessMove[] = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.color !== color) continue;
    const pseudo = generatePseudoMoves(board, i);
    for (const move of pseudo) {
      const after = applyMove(board, move);
      if (!isInCheck(after, color)) legal.push(move);
    }
  }
  return legal;
}

function evaluateBoard(board: Array<Piece | null>) {
  let score = 0;
  for (const p of board) {
    if (!p) continue;
    score += p.color === "b" ? PIECE_VALUES[p.type] : -PIECE_VALUES[p.type];
  }
  return score;
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickBotMove(board: Array<Piece | null>, legal: ChessMove[], level: BotLevel, color: Color) {
  if (level === "easy") return pickRandom(legal);

  if (level === "medium") {
    const captures = legal.filter((m) => board[m.to] !== null);
    if (captures.length === 0) return pickRandom(legal);
    captures.sort((a, b) => {
      const pa = board[a.to];
      const pb = board[b.to];
      const va = pa ? PIECE_VALUES[pa.type] : 0;
      const vb = pb ? PIECE_VALUES[pb.type] : 0;
      return vb - va;
    });
    return captures[0];
  }

  let bestScore = -Infinity;
  let best: ChessMove[] = [];
  for (const move of legal) {
    const next = applyMove(board, move);
    const opp = otherColor(color);
    const replies = generateLegalMoves(next, opp);
    let score = evaluateBoard(next);
    if (replies.length > 0) {
      let worstReply = Infinity;
      for (const reply of replies) {
        const afterReply = applyMove(next, reply);
        worstReply = Math.min(worstReply, evaluateBoard(afterReply));
      }
      score = worstReply;
    } else if (isInCheck(next, opp)) {
      score += 100000;
    }
    if (color === "w") score = -score;

    if (score > bestScore) {
      bestScore = score;
      best = [move];
    } else if (score === bestScore) {
      best.push(move);
    }
  }
  return best.length > 0 ? pickRandom(best) : pickRandom(legal);
}

function gameOverLabel(winner: Color | "draw" | null, reason: EndReason | null) {
  if (!winner) return "Partie terminee";
  if (winner === "draw") return reason === "stalemate" ? "Pat" : "Match nul";
  const who = winner === "w" ? "Blancs" : "Noirs";
  if (reason === "checkmate") return `${who} gagnent par echec et mat`;
  if (reason === "resign") return `${who} gagnent par abandon`;
  if (reason === "timeout") return `${who} gagnent au temps`;
  return `${who} gagnent`;
}

function formatClock(ms: number) {
  const safe = Math.max(0, ms);
  const total = Math.ceil(safe / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const INITIAL_PIECE_COUNTS: Record<PieceType, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

function getCapturedPieceSymbols(board: Array<Piece | null>, color: Color) {
  const remaining: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  for (const p of board) {
    if (!p || p.color !== color) continue;
    remaining[p.type] += 1;
  }
  const captured: string[] = [];
  (["q", "r", "b", "n", "p"] as PieceType[]).forEach((type) => {
    const missing = Math.max(0, INITIAL_PIECE_COUNTS[type] - remaining[type]);
    for (let i = 0; i < missing; i++) {
      captured.push(PIECE_SYMBOL[`${color}${type}`] ?? "");
    }
  });
  return captured;
}

function CapturedPieces({ label, pieces }: { label: string; pieces: string[] }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 backdrop-blur-sm">
      <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-white/40">{label}</p>
      <p className="mt-1.5 min-h-7 font-sans text-lg leading-7 text-white/90">
        {pieces.length > 0 ? pieces.join(" ") : <span className="text-white/25">--</span>}
      </p>
    </div>
  );
}

/* ── Clock display component ── */
function ClockPanel({
  name,
  time,
  isActive,
  color,
}: {
  name: string;
  time: number;
  isActive: boolean;
  color: "white" | "black";
}) {
  const isLow = time < 60_000;
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 backdrop-blur-sm transition-all",
        isActive
          ? color === "white"
            ? "border-white/30 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
            : "border-purple-400/30 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
          : "border-white/10 bg-black/30"
      )}
    >
      <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-white/40">{name}</p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-semibold",
          isLow ? "text-red-400" : isActive ? "text-white/90" : "text-white/60"
        )}
      >
        {formatClock(time)}
      </p>
    </div>
  );
}

interface ChessBoardViewProps {
  board: Array<Piece | null>;
  selectedSquare: number | null;
  onSquareClick: (idx: number) => void;
  availableTargets: number[];
  lastMove: ChessMove | null;
  orientation?: Color;
}

function ChessBoardView({
  board,
  selectedSquare,
  onSquareClick,
  availableTargets,
  lastMove,
  orientation = "w",
}: ChessBoardViewProps) {
  const rows = orientation === "w" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const cols = orientation === "w" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const fileLabels = orientation === "w" ? ["a","b","c","d","e","f","g","h"] : ["h","g","f","e","d","c","b","a"];
  const rankLabels = orientation === "w" ? ["8","7","6","5","4","3","2","1"] : ["1","2","3","4","5","6","7","8"];

  return (
    <div className="relative">
      {/* File labels (bottom) */}
      <div className="mt-1 grid grid-cols-8 px-0">
        {fileLabels.map((f, i) => (
          <span key={`file-${i}`} className="text-center font-mono text-[10px] text-white/25">
            {f}
          </span>
        ))}
      </div>
      <div className="flex">
        {/* Rank labels (left) */}
        <div className="mr-1 flex flex-col justify-around">
          {rankLabels.map((r, i) => (
            <span key={`rank-${i}`} className="font-mono text-[10px] leading-none text-white/25">
              {r}
            </span>
          ))}
        </div>
        {/* Board */}
        <div className="grid flex-1 grid-cols-8 overflow-hidden rounded-2xl border border-white/25 shadow-[0_0_40px_rgba(0,0,0,0.5),0_0_80px_rgba(139,92,246,0.08)]">
          {rows.map((y) =>
            cols.map((x) => {
              const idx = makeIndex(x, y);
              const isLight = (x + y) % 2 === 0;
              const piece = board[idx];
              const code = piece ? `${piece.color}${piece.type}` : "";
              const isSelected = selectedSquare === idx;
              const isTarget = availableTargets.includes(idx);
              const isLastMove = !!lastMove && (lastMove.from === idx || lastMove.to === idx);
              const isCapture = isTarget && piece !== null;

              return (
                <button
                  key={idx}
                  onClick={() => onSquareClick(idx)}
                  className={cn(
                    "relative flex aspect-square items-center justify-center text-4xl transition-all duration-150 sm:text-5xl",
                    /* Dark theme board squares */
                    isLight
                      ? "bg-[#2a2a3e]"
                      : "bg-[#1a1a2e]",
                    /* Last move highlight */
                    isLastMove && "bg-[#3d3560]",
                    /* Selected piece glow */
                    isSelected && "bg-[#4ecf8a]/25 shadow-[inset_0_0_20px_rgba(78,207,138,0.3)]",
                    /* Hover */
                    !isSelected && "hover:brightness-125"
                  )}
                >
                  {/* Available move dot */}
                  {isTarget && !isCapture && (
                    <span className="absolute h-3.5 w-3.5 rounded-full bg-[#65dfb2]/50 shadow-[0_0_8px_rgba(101,223,178,0.4)]" />
                  )}
                  {/* Capture ring */}
                  {isCapture && (
                    <span className="absolute inset-1 rounded-full border-2 border-red-400/60 shadow-[0_0_12px_rgba(248,113,113,0.3)]" />
                  )}
                  {/* Piece */}
                  <span
                    className={cn(
                      "relative z-10 select-none",
                      piece?.color === "w"
                        ? "text-[#e8e0f0] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                        : "text-[#8b7aab] drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]",
                      isSelected && "scale-110 drop-shadow-[0_0_16px_rgba(78,207,138,0.6)]"
                    )}
                  >
                    {code ? PIECE_SYMBOL[code] ?? PIECE_GLYPH[code] : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChessGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "chess", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as ChessState | null;

  const [selected, setSelected] = useState<number | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const [entryMode, setEntryMode] = useState<"choose" | "local" | "multi">("choose");
  const [localKind, setLocalKind] = useState<"duel" | "bot">("duel");
  const [localBotLevel, setLocalBotLevel] = useState<BotLevel>("medium");
  const [localTimeMinutes, setLocalTimeMinutes] = useState<number>(15);
  const [localWhiteName, setLocalWhiteName] = useState("Joueur 1");
  const [localBlackName, setLocalBlackName] = useState("Joueur 2");
  const [localBoard, setLocalBoard] = useState<Array<Piece | null>>(() => initialBoard());
  const [localTurn, setLocalTurn] = useState<Color>("w");
  const [localWinner, setLocalWinner] = useState<Color | "draw" | null>(null);
  const [localReason, setLocalReason] = useState<EndReason | null>(null);
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const [localLastMove, setLocalLastMove] = useState<ChessMove | null>(null);
  const [localMoveCount, setLocalMoveCount] = useState(0);
  const [localWhiteTimeMs, setLocalWhiteTimeMs] = useState(15 * 60_000);
  const [localBlackTimeMs, setLocalBlackTimeMs] = useState(15 * 60_000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const onlineLastMoveKeyRef = useRef<string | null>(null);

  const board = useMemo(() => (state?.board ? state.board.map(decodePiece) : []), [state]);

  const myColor = state?.myColor ?? null;
  const canPlayOnline = state?.phase === "playing" && myColor === state.turn;
  const legalMovesByFrom = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const m of state?.legalMoves ?? []) {
      const prev = map.get(m.from) ?? [];
      prev.push(m.to);
      map.set(m.from, prev);
    }
    return map;
  }, [state?.legalMoves]);

  const localLegalMoves = useMemo(() => generateLegalMoves(localBoard, localTurn), [localBoard, localTurn]);
  const localLegalByFrom = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const m of localLegalMoves) {
      const prev = map.get(m.from) ?? [];
      prev.push(m.to);
      map.set(m.from, prev);
    }
    return map;
  }, [localLegalMoves]);
  const localCapturedWhite = useMemo(() => getCapturedPieceSymbols(localBoard, "w"), [localBoard]);
  const localCapturedBlack = useMemo(() => getCapturedPieceSymbols(localBoard, "b"), [localBoard]);
  const onlineCapturedWhite = useMemo(() => getCapturedPieceSymbols(board, "w"), [board]);
  const onlineCapturedBlack = useMemo(() => getCapturedPieceSymbols(board, "b"), [board]);
  const isFocusView = isFullscreen || focusMode;

  const playMoveSound = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      // @ts-expect-error vendor prefix fallback
      window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const gain = ctx.createGain();
    oscA.type = "triangle";
    oscB.type = "sine";
    oscA.frequency.value = 720;
    oscB.frequency.value = 980;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(ctx.destination);
    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.08);
    oscB.stop(now + 0.08);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      setFocusMode(false);
      return;
    }
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setFocusMode(true);
      } else {
        setFocusMode((prev) => !prev);
      }
    } catch {
      // iOS and some Android browsers block fullscreen API: fallback to in-app focus mode.
      setFocusMode((prev) => !prev);
    }
  }, []);

  const shareSpectatorLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = "AF Games - Echecs";
    const text = "Rejoins la partie en spectateur";
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setInviteFeedback("Lien partage");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setInviteFeedback("Lien copie");
      } else {
        setInviteFeedback(url);
      }
    } catch (err) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setInviteFeedback("Lien copie");
      } else if ((err as Error)?.name !== "AbortError") {
        setInviteFeedback("Partage impossible");
      }
    }
  }, []);

  const applyLocalMove = useCallback((move: ChessMove) => {
    const nextBoard = applyMove(localBoard, move);
    const nextTurn = otherColor(localTurn);
    const nextLegal = generateLegalMoves(nextBoard, nextTurn);

    setLocalBoard(nextBoard);
    setLocalLastMove(move);
    playMoveSound();
    setLocalTurn(nextTurn);
    setLocalSelected(null);
    setLocalMoveCount((c) => c + 1);

    if (localMoveCount + 1 >= 220) {
      setLocalWinner("draw");
      setLocalReason("draw");
      return;
    }

    if (nextLegal.length === 0) {
      if (isInCheck(nextBoard, nextTurn)) {
        setLocalWinner(otherColor(nextTurn));
        setLocalReason("checkmate");
      } else {
        setLocalWinner("draw");
        setLocalReason("stalemate");
      }
    }
  }, [localBoard, localMoveCount, localTurn, playMoveSound]);

  useEffect(() => {
    if (!localMode || localWinner || localKind !== "bot" || localTurn !== "b") return;
    const timer = setTimeout(() => {
      const legal = generateLegalMoves(localBoard, "b");
      if (legal.length === 0) return;
      const move = pickBotMove(localBoard, legal, localBotLevel, "b");
      applyLocalMove(move);
    }, 250);
    return () => clearTimeout(timer);
  }, [applyLocalMove, localBoard, localBotLevel, localKind, localMode, localTurn, localWinner]);

  useEffect(() => {
    if (!localMode || localWinner) return;
    const timer = setInterval(() => {
      if (localTurn === "w") {
        setLocalWhiteTimeMs((prev) => {
          const next = Math.max(0, prev - 1000);
          if (next === 0) {
            setLocalWinner("b");
            setLocalReason("timeout");
          }
          return next;
        });
      } else {
        setLocalBlackTimeMs((prev) => {
          const next = Math.max(0, prev - 1000);
          if (next === 0) {
            setLocalWinner("w");
            setLocalReason("timeout");
          }
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [localMode, localTurn, localWinner]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) setFocusMode(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!state?.lastMove) return;
    const key = `${state.lastMove.from}-${state.lastMove.to}-${state.phase}`;
    if (onlineLastMoveKeyRef.current === key) return;
    onlineLastMoveKeyRef.current = key;
    playMoveSound();
  }, [playMoveSound, state?.lastMove, state?.phase]);

  useEffect(() => {
    if (!inviteFeedback) return;
    const timer = setTimeout(() => setInviteFeedback(""), 2600);
    return () => clearTimeout(timer);
  }, [inviteFeedback]);

  const handleOnlineClick = useCallback((index: number) => {
    if (!state || state.phase !== "playing" || !canPlayOnline) return;
    const piece = board[index];

    if (selected !== null) {
      const targets = legalMovesByFrom.get(selected) ?? [];
      if (targets.includes(index)) {
        sendAction({ action: "move", from: selected, to: index });
        setSelected(null);
        return;
      }
    }

    if (piece && piece.color === myColor) {
      const hasMoves = (legalMovesByFrom.get(index) ?? []).length > 0;
      setSelected(hasMoves ? index : null);
    } else {
      setSelected(null);
    }
  }, [board, canPlayOnline, legalMovesByFrom, myColor, selected, sendAction, state]);

  const handleLocalClick = useCallback((index: number) => {
    if (localWinner) return;
    if (localKind === "bot" && localTurn === "b") return;
    const piece = localBoard[index];

    if (localSelected !== null) {
      const targets = localLegalByFrom.get(localSelected) ?? [];
      if (targets.includes(index)) {
        applyLocalMove({ from: localSelected, to: index });
        return;
      }
    }

    if (piece && piece.color === localTurn) {
      const hasMoves = (localLegalByFrom.get(index) ?? []).length > 0;
      setLocalSelected(hasMoves ? index : null);
    } else {
      setLocalSelected(null);
    }
  }, [applyLocalMove, localBoard, localKind, localLegalByFrom, localSelected, localTurn, localWinner]);

  const startLocalGame = useCallback(() => {
    setLocalBoard(initialBoard());
    setLocalTurn("w");
    setLocalWinner(null);
    setLocalReason(null);
    setLocalSelected(null);
    setLocalLastMove(null);
    setLocalMoveCount(0);
    setLocalWhiteTimeMs(localTimeMinutes * 60_000);
    setLocalBlackTimeMs(localTimeMinutes * 60_000);
    setLocalMode(true);
  }, [localTimeMinutes]);

  /* ════════════════════════════════════════════════════════
     LOCAL MODE
     ════════════════════════════════════════════════════════ */
  if (localMode) {
    const localTargets = localSelected !== null ? localLegalByFrom.get(localSelected) ?? [] : [];
    const statusText = localWinner
      ? gameOverLabel(localWinner, localReason)
      : localTurn === "w"
        ? `Tour des blancs (${localWhiteName})`
        : localKind === "bot"
          ? "Tour du bot"
          : `Tour des noirs (${localBlackName})`;

    if (isFocusView) {
      return (
        <div className="fixed inset-0 z-[120] flex flex-col bg-[radial-gradient(circle_at_50%_25%,rgba(139,92,246,0.15),transparent_40%),linear-gradient(155deg,#0a0a1a,#111827)] p-3 font-sans sm:p-5">
          <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col">
            {/* Clocks */}
            <div className="grid grid-cols-2 gap-3">
              <ClockPanel
                name={localWhiteName}
                time={localWhiteTimeMs}
                isActive={!localWinner && localTurn === "w"}
                color="white"
              />
              <ClockPanel
                name={localKind === "bot" ? "Bot" : localBlackName}
                time={localBlackTimeMs}
                isActive={!localWinner && localTurn === "b"}
                color="black"
              />
            </div>

            {/* Captured pieces */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <CapturedPieces label={`${localWhiteName} a pris`} pieces={localCapturedBlack} />
              <CapturedPieces
                label={`${localKind === "bot" ? "Bot" : localBlackName} a pris`}
                pieces={localCapturedWhite}
              />
            </div>

            {/* Board */}
            <div className="mx-auto mt-4 w-full max-w-[min(98vw,940px)]">
              <ChessBoardView
                board={localBoard}
                selectedSquare={localSelected}
                onSquareClick={handleLocalClick}
                availableTargets={localTargets}
                lastMove={localLastMove}
                orientation="w"
              />
            </div>

            {/* Status bar */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="font-sans text-sm text-white/90">{statusText}</p>
              <button
                onClick={() => {
                  if (document.fullscreenElement) {
                    void document.exitFullscreen?.();
                  }
                  setFocusMode(false);
                }}
                className="rounded-xl border border-white/25 bg-black/30 px-4 py-2 font-sans text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
              >
                Quitter plein ecran
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 font-sans sm:p-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(78,207,138,0.12),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(139,92,246,0.1),transparent_40%),linear-gradient(145deg,#0a0a1a,#111827)]" />

        {/* Main panel */}
        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-white/25 bg-black/30 p-5 backdrop-blur-sm sm:p-7">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/40">Echecs Local</p>
              <p className="mt-0.5 font-sans text-sm text-white/90">
                {localKind === "bot" ? `vs Bot (${localBotLevel})` : "Duel 1 telephone"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="rounded-xl border border-white/25 bg-black/30 px-3 py-2 font-sans text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
              >
                {isFullscreen ? "Quitter plein ecran" : "Plein ecran"}
              </button>
              <button
                onClick={() => setLocalMode(false)}
                className="rounded-xl border border-white/25 bg-black/30 px-3 py-2 font-sans text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
              >
                Quitter local
              </button>
            </div>
          </div>

          {/* Status */}
          {localWinner ? (
            <div className="mt-4 rounded-2xl border border-[#65dfb2]/30 bg-[#65dfb2]/10 px-5 py-3 shadow-[0_0_20px_rgba(101,223,178,0.15)]">
              <p className="font-sans text-lg font-semibold text-white/90">{statusText}</p>
            </div>
          ) : (
            <p className="mt-4 font-sans text-lg font-semibold text-white/90">{statusText}</p>
          )}

          {/* Clocks */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ClockPanel
              name={localWhiteName}
              time={localWhiteTimeMs}
              isActive={!localWinner && localTurn === "w"}
              color="white"
            />
            <ClockPanel
              name={localKind === "bot" ? "Bot" : localBlackName}
              time={localBlackTimeMs}
              isActive={!localWinner && localTurn === "b"}
              color="black"
            />
          </div>

          {!localWinner && localKind === "duel" && (
            <p className="mt-2 font-sans text-xs text-white/40">
              Passe le telephone au joueur {localTurn === "w" ? "Blanc" : "Noir"}.
            </p>
          )}

          {/* Board */}
          <div className="mx-auto mt-4 w-full max-w-[min(92vw,820px)]">
            <ChessBoardView
              board={localBoard}
              selectedSquare={localSelected}
              onSquareClick={handleLocalClick}
              availableTargets={localTargets}
              lastMove={localLastMove}
              orientation="w"
            />
          </div>

          {/* Captured pieces */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <CapturedPieces label={`${localWhiteName} a pris`} pieces={localCapturedBlack} />
            <CapturedPieces
              label={`${localKind === "bot" ? "Bot" : localBlackName} a pris`}
              pieces={localCapturedWhite}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {localWinner ? (
              <button
                onClick={startLocalGame}
                className="rounded-xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-6 py-3 font-sans text-sm font-semibold text-black shadow-[0_0_20px_rgba(78,207,138,0.25)] transition hover:shadow-[0_0_30px_rgba(78,207,138,0.4)]"
              >
                Rejouer
              </button>
            ) : (
              <button
                onClick={() => {
                  const side = localTurn;
                  setLocalWinner(otherColor(side));
                  setLocalReason("resign");
                }}
                className="rounded-xl border border-red-400/30 bg-red-500/20 px-5 py-3 font-sans text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
              >
                Abandonner
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     WAITING / MODE SELECT
     ════════════════════════════════════════════════════════ */
  if (!state || state.phase === "waiting") {
    const onlinePlayers = state?.connectedPlayers ?? [];
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 font-sans sm:p-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(251,191,36,0.14),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%),linear-gradient(145deg,#0a0a1a,#111827)]" />

        {/* Main panel */}
        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-white/25 bg-black/30 p-5 backdrop-blur-sm sm:p-7">
          {/* Title */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/40">Mode de jeu</p>
              <h2 className="mt-1 font-serif text-4xl font-semibold text-white/90">Echecs</h2>
            </div>
          </div>

          {/* Mode chooser */}
          {entryMode === "choose" && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setEntryMode("local")}
                className="group rounded-3xl border border-white/25 bg-black/30 p-7 text-left backdrop-blur-sm transition hover:border-[#65dfb2]/40 hover:shadow-[0_0_20px_rgba(101,223,178,0.1)]"
              >
                <p className="font-sans text-xl font-semibold text-white/90 transition group-hover:text-[#65dfb2]">
                  Local
                </p>
                <p className="mt-2 font-sans text-sm text-white/40">
                  Sur le meme telephone: vs bot ou vs collegue
                </p>
              </button>
              <button
                onClick={() => {
                  setEntryMode("multi");
                  sendAction({ action: "set-mode", mode: "online" });
                }}
                className="group rounded-3xl border border-white/25 bg-black/30 p-7 text-left backdrop-blur-sm transition hover:border-amber-300/40 hover:shadow-[0_0_20px_rgba(251,191,36,0.1)]"
              >
                <p className="font-sans text-xl font-semibold text-white/90 transition group-hover:text-amber-300">
                  Multijoueur
                </p>
                <p className="mt-2 font-sans text-sm text-white/40">Duel en ligne</p>
              </button>
            </div>
          )}

          {/* Multiplayer time control */}
          {entryMode === "multi" && (
            <section className="mt-6 rounded-2xl border border-white/25 bg-black/30 p-5 backdrop-blur-sm">
              <p className="font-sans text-xs uppercase tracking-widest text-white/40">Cadence</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIME_OPTIONS.map((minutes) => (
                  <button
                    key={`multi-${minutes}`}
                    onClick={() => sendAction({ action: "set-time-control", minutes })}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 font-mono text-sm transition",
                      (state?.timeControlMinutes ?? 15) === minutes
                        ? "border-amber-300/50 bg-amber-300/15 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                        : "border-white/10 bg-black/20 text-white/40 hover:border-white/25 hover:text-white/60"
                    )}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Multiplayer connected players */}
          {entryMode === "multi" && (
            <section className="mt-4 rounded-2xl border border-white/25 bg-black/30 p-5 backdrop-blur-sm">
              <p className="font-sans text-xs uppercase tracking-widest text-white/40">
                Joueurs connectes ({onlinePlayers.length})
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {onlinePlayers.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full border border-white/25 bg-white/5 px-4 py-1.5 font-sans text-xs text-white/90"
                  >
                    {p.name}
                    {p.id === playerId ? " (toi)" : ""}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Local setup */}
          {entryMode === "local" && (
            <section className="mt-5 rounded-2xl border border-white/25 bg-black/30 p-5 backdrop-blur-sm">
              <p className="font-sans text-xs uppercase tracking-widest text-white/40">Mode local 1 telephone</p>

              {/* Local kind selector */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLocalKind("duel")}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 font-sans text-xs transition",
                    localKind === "duel"
                      ? "border-[#65dfb2]/50 bg-[#65dfb2]/15 text-[#65dfb2] shadow-[0_0_12px_rgba(101,223,178,0.12)]"
                      : "border-white/10 bg-black/20 text-white/40 hover:border-white/25"
                  )}
                >
                  Vs collegue (meme tel)
                </button>
                <button
                  onClick={() => setLocalKind("bot")}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 font-sans text-xs transition",
                    localKind === "bot"
                      ? "border-[#65dfb2]/50 bg-[#65dfb2]/15 text-[#65dfb2] shadow-[0_0_12px_rgba(101,223,178,0.12)]"
                      : "border-white/10 bg-black/20 text-white/40 hover:border-white/25"
                  )}
                >
                  Vs bot
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="font-sans text-xs text-white/40">Temps par joueur</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_OPTIONS.map((minutes) => (
                      <button
                        key={`local-${minutes}`}
                        onClick={() => setLocalTimeMinutes(minutes)}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 font-mono text-xs transition",
                          localTimeMinutes === minutes
                            ? "border-[#65dfb2]/50 bg-[#65dfb2]/15 text-[#65dfb2] shadow-[0_0_12px_rgba(101,223,178,0.12)]"
                            : "border-white/10 bg-black/20 text-white/40 hover:border-white/25"
                        )}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                  {localKind === "bot" && (
                    <div className="grid grid-cols-3 gap-2">
                      {(["easy", "medium", "hard"] as BotLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setLocalBotLevel(level)}
                          className={cn(
                            "rounded-xl border px-2 py-2.5 font-sans text-xs capitalize transition",
                            localBotLevel === level
                              ? "border-purple-400/50 bg-purple-400/15 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.12)]"
                              : "border-white/10 bg-black/20 text-white/40 hover:border-white/25"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="font-sans text-xs text-white/40">Noms joueurs</p>
                  <input
                    value={localWhiteName}
                    onChange={(e) => setLocalWhiteName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 font-sans text-sm text-white/90 outline-none transition focus:border-white/30 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                    placeholder="Nom joueur blanc"
                  />
                  <input
                    value={localBlackName}
                    onChange={(e) => setLocalBlackName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 font-sans text-sm text-white/90 outline-none transition focus:border-white/30 focus:shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                    placeholder={localKind === "bot" ? "Nom joueur" : "Nom joueur noir"}
                  />
                </div>
              </div>

              <button
                onClick={startLocalGame}
                className="mt-5 rounded-xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-6 py-3 font-sans text-sm font-semibold text-black shadow-[0_0_20px_rgba(78,207,138,0.25)] transition hover:shadow-[0_0_30px_rgba(78,207,138,0.4)]"
              >
                Lancer en local
              </button>
            </section>
          )}

          {/* Multiplayer start button */}
          {entryMode === "multi" && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => sendAction({ action: "start-game" })}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 font-sans text-sm font-semibold text-black shadow-[0_0_20px_rgba(251,191,36,0.25)] transition hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]"
              >
                Lancer en multijoueur
              </button>
            </div>
          )}

          {/* Back button */}
          {entryMode !== "choose" && (
            <button
              onClick={() => setEntryMode("choose")}
              className="mt-4 w-fit rounded-xl border border-white/25 bg-black/30 px-4 py-2 font-sans text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
            >
              Retour
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     ONLINE PLAYING / GAME OVER
     ════════════════════════════════════════════════════════ */
  const selectedTargets = selected !== null ? legalMovesByFrom.get(selected) ?? [] : [];
  const orientation: Color = myColor === "b" ? "b" : "w";
  const gamePlayers = state.players ?? [];
  const whiteName = gamePlayers.find((p) => p.color === "w")?.name ?? "Blanc";
  const blackName = gamePlayers.find((p) => p.color === "b")?.name ?? "Noir";
  const info =
    state.phase === "game-over"
      ? gameOverLabel(state.winner, state.reason)
      : state.turn === "w"
        ? `Tour des blancs (${whiteName})`
        : `Tour des noirs (${blackName})`;

  if (isFocusView) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col bg-[radial-gradient(circle_at_50%_25%,rgba(251,191,36,0.12),transparent_40%),linear-gradient(155deg,#0a0a1a,#111827)] p-3 font-sans sm:p-5">
        <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col">
          {/* Clocks */}
          <div className="grid grid-cols-2 gap-3">
            <ClockPanel
              name={whiteName}
              time={state.whiteTimeMs ?? 0}
              isActive={state.phase === "playing" && state.turn === "w"}
              color="white"
            />
            <ClockPanel
              name={blackName}
              time={state.blackTimeMs ?? 0}
              isActive={state.phase === "playing" && state.turn === "b"}
              color="black"
            />
          </div>

          {/* Captured pieces */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <CapturedPieces label={`${whiteName} a pris`} pieces={onlineCapturedBlack} />
            <CapturedPieces label={`${blackName} a pris`} pieces={onlineCapturedWhite} />
          </div>

          {/* Board */}
          <div className="mx-auto mt-4 w-full max-w-[min(98vw,940px)]">
            <ChessBoardView
              board={board}
              selectedSquare={selected}
              onSquareClick={handleOnlineClick}
              availableTargets={selectedTargets}
              lastMove={state.lastMove ? { from: state.lastMove.from, to: state.lastMove.to } : null}
              orientation={orientation}
            />
          </div>

          {/* Status bar */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="font-sans text-sm text-white/90">{info}</p>
            <div className="flex items-center gap-2">
              {state.phase === "playing" && (
                <button
                  onClick={shareSpectatorLink}
                  className="rounded-xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-4 py-2 font-sans text-xs font-semibold text-black shadow-[0_0_12px_rgba(78,207,138,0.2)] transition hover:shadow-[0_0_20px_rgba(78,207,138,0.35)]"
                >
                  Inviter des spectateurs
                </button>
              )}
              <button
                onClick={() => {
                  if (document.fullscreenElement) {
                    void document.exitFullscreen?.();
                  }
                  setFocusMode(false);
                }}
                className="rounded-xl border border-white/25 bg-black/30 px-4 py-2 font-sans text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
              >
                Quitter plein ecran
              </button>
            </div>
          </div>
          {inviteFeedback && (
            <p className="mt-2 font-sans text-xs text-[#65dfb2]/90">{inviteFeedback}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden p-4 font-sans sm:p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(251,191,36,0.14),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%),linear-gradient(145deg,#0a0a1a,#111827)]" />

      {/* Main panel */}
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-white/25 bg-black/30 p-5 backdrop-blur-sm sm:p-7">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/40">Echecs en ligne</p>

            {/* Game status */}
            {state.phase === "game-over" ? (
              <div className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-5 py-3 shadow-[0_0_20px_rgba(251,191,36,0.12)]">
                <p className="font-sans text-lg font-semibold text-white/90">{info}</p>
              </div>
            ) : (
              <p className="mt-2 font-sans text-lg font-semibold text-white/90">{info}</p>
            )}

            {/* Check warning */}
            {state.phase === "playing" && state.inCheck && (
              <div className="mt-2 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <p className="font-sans text-sm font-semibold text-red-300">
                  Echec sur le roi {state.turn === "w" ? "blanc" : "noir"}
                </p>
              </div>
            )}

            {/* Clocks */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <ClockPanel
                name={whiteName}
                time={state.whiteTimeMs ?? 0}
                isActive={state.phase === "playing" && state.turn === "w"}
                color="white"
              />
              <ClockPanel
                name={blackName}
                time={state.blackTimeMs ?? 0}
                isActive={state.phase === "playing" && state.turn === "b"}
                color="black"
              />
            </div>

            {/* Captured pieces */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <CapturedPieces label={`${whiteName} a pris`} pieces={onlineCapturedBlack} />
              <CapturedPieces label={`${blackName} a pris`} pieces={onlineCapturedWhite} />
            </div>
          </div>

          {/* Side info */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={toggleFullscreen}
              className="rounded-xl border border-white/25 bg-black/30 px-4 py-2 font-sans text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
            >
              {isFullscreen ? "Quitter plein ecran" : "Plein ecran"}
            </button>
            <span className="font-sans text-xs text-white/40">{whiteName} (Blanc)</span>
            <span className="font-sans text-xs text-white/40">{blackName} (Noir)</span>
            {state.lastMove && (
              <span className="font-mono text-xs text-white/25">
                {state.lastMove.fromSquare} → {state.lastMove.toSquare}
              </span>
            )}
          </div>
        </div>

        {/* Board */}
        <div className="mx-auto mt-5 w-full max-w-[min(92vw,820px)]">
          <ChessBoardView
            board={board}
            selectedSquare={selected}
            onSquareClick={handleOnlineClick}
            availableTargets={selectedTargets}
            lastMove={state.lastMove ? { from: state.lastMove.from, to: state.lastMove.to } : null}
            orientation={orientation}
          />
        </div>

        {/* Player tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/25 bg-white/5 px-4 py-1.5 font-sans text-xs text-white/90">
            Toi: {myColor ? (myColor === "w" ? "Blanc" : "Noir") : "Spectateur"}
          </span>
          {state.phase === "playing" && (
            <span
              className={cn(
                "rounded-full border px-4 py-1.5 font-sans text-xs",
                canPlayOnline
                  ? "border-[#65dfb2]/40 bg-[#65dfb2]/15 text-[#65dfb2]"
                  : "border-white/15 bg-white/5 text-white/40"
              )}
            >
              {canPlayOnline ? "A toi de jouer" : "En attente"}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-3">
          {state.phase === "playing" && (
            <button
              onClick={shareSpectatorLink}
              className="rounded-xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-5 py-3 font-sans text-sm font-semibold text-black shadow-[0_0_20px_rgba(78,207,138,0.25)] transition hover:shadow-[0_0_30px_rgba(78,207,138,0.4)]"
            >
              Inviter des spectateurs
            </button>
          )}
          {state.phase === "playing" && myColor && (
            <button
              onClick={() => sendAction({ action: "resign" })}
              className="rounded-xl border border-red-400/30 bg-red-500/20 px-5 py-3 font-sans text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
            >
              Abandonner
            </button>
          )}
          {state.phase === "game-over" && (
            <button
              onClick={() => sendAction({ action: "start-game" })}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 font-sans text-sm font-semibold text-black shadow-[0_0_20px_rgba(251,191,36,0.25)] transition hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]"
            >
              Rejouer
            </button>
          )}
        </div>

        {inviteFeedback && (
          <p className="mt-3 font-sans text-xs text-[#65dfb2]/90">{inviteFeedback}</p>
        )}
        {error && (
          <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 font-sans text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
