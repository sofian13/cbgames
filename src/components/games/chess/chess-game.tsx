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
  wp: "♙",
  wn: "♘",
  wb: "♗",
  wr: "♖",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚",
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

  return (
    <div className="grid grid-cols-8 overflow-hidden rounded-2xl border border-amber-200/35 shadow-[0_10px_32px_rgba(0,0,0,0.4)]">
      {rows.map((y) =>
        cols.map((x) => {
          const idx = makeIndex(x, y);
          const isLight = (x + y) % 2 === 0;
          const piece = board[idx];
          const code = piece ? `${piece.color}${piece.type}` : "";
          const isSelected = selectedSquare === idx;
          const isTarget = availableTargets.includes(idx);
          const isLastMove = !!lastMove && (lastMove.from === idx || lastMove.to === idx);

          return (
            <button
              key={idx}
              onClick={() => onSquareClick(idx)}
              className={cn(
                "relative flex aspect-square items-center justify-center text-4xl transition-all sm:text-5xl",
                isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]",
                isLastMove && "ring-2 ring-yellow-300/70 ring-inset",
                isSelected && "ring-2 ring-cyan-300 ring-inset",
                isTarget && "after:absolute after:h-3 after:w-3 after:rounded-full after:bg-cyan-400/80"
              )}
            >
              <span
                className={cn(
                  "select-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]",
                  piece?.color === "w" ? "text-[#f8fafc]" : "text-[#111827]"
                )}
              >
                {code ? PIECE_SYMBOL[code] ?? PIECE_GLYPH[code] : ""}
              </span>
            </button>
          );
        })
      )}
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
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
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
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
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

  if (localMode) {
    const localTargets = localSelected !== null ? localLegalByFrom.get(localSelected) ?? [] : [];
    const statusText = localWinner
      ? gameOverLabel(localWinner, localReason)
      : localTurn === "w"
        ? `Tour des blancs (${localWhiteName})`
        : localKind === "bot"
          ? "Tour du bot"
          : `Tour des noirs (${localBlackName})`;

    return (
      <div
        className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6"
        style={{ fontFamily: "\"Trebuchet MS\", Verdana, sans-serif" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,197,94,0.12),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(249,115,22,0.15),transparent_35%),linear-gradient(145deg,#111827,#1f2937)]" />
        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Echecs Local</p>
              <p className="text-sm text-white/80">{localKind === "bot" ? `vs Bot (${localBotLevel})` : "Duel 1 telephone"}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="rounded-lg border border-cyan-300/35 bg-cyan-500/20 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-500/30"
              >
                {isFullscreen ? "Quitter plein ecran" : "Plein ecran"}
              </button>
              <button
                onClick={() => setLocalMode(false)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/15"
              >
                Quitter local
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm text-white/85">{statusText}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white">
              Blanc {formatClock(localWhiteTimeMs)}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white">
              Noir {formatClock(localBlackTimeMs)}
            </span>
          </div>
          {!localWinner && localKind === "duel" && (
            <p className="mt-1 text-xs text-white/55">
              Passe le telephone au joueur {localTurn === "w" ? "Blanc" : "Noir"}.
            </p>
          )}

          <div className="mt-4 mx-auto w-full max-w-[min(92vw,820px)]">
            <ChessBoardView
              board={localBoard}
              selectedSquare={localSelected}
              onSquareClick={handleLocalClick}
              availableTargets={localTargets}
              lastMove={localLastMove}
              orientation="w"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/65">
            <span className="rounded-full border border-white/20 px-3 py-1">{localWhiteName} • Blanc</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{localKind === "bot" ? "Bot" : `${localBlackName}`} • Noir</span>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {localWinner ? (
              <button
                onClick={startLocalGame}
                className="rounded-xl border border-emerald-300/40 bg-emerald-500/80 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500"
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
                className="rounded-xl border border-red-300/35 bg-red-500/70 px-4 py-3 text-sm font-medium text-white hover:bg-red-500"
              >
                Abandonner
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!state || state.phase === "waiting") {
    const onlinePlayers = state?.connectedPlayers ?? [];
    return (
      <div
        className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6"
        style={{ fontFamily: "\"Trebuchet MS\", Verdana, sans-serif" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(251,191,36,0.16),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.14),transparent_35%),linear-gradient(145deg,#0f172a,#111827)]" />
        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-amber-200/20 bg-black/35 p-4 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/70">Mode de jeu</p>
              <h2 className="mt-1 text-3xl font-serif text-white">Echecs</h2>
            </div>
          </div>

          {entryMode === "choose" && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setEntryMode("local")}
                className="rounded-2xl border border-emerald-300/35 bg-emerald-400/10 p-6 text-left transition hover:bg-emerald-400/15"
              >
                <p className="text-xl font-semibold text-emerald-200">Local</p>
                <p className="mt-2 text-sm text-white/75">Sur le meme telephone: vs bot ou vs collegue</p>
              </button>
              <button
                onClick={() => {
                  setEntryMode("multi");
                  sendAction({ action: "set-mode", mode: "online" });
                }}
                className="rounded-2xl border border-amber-300/35 bg-amber-400/10 p-6 text-left transition hover:bg-amber-400/15"
              >
                <p className="text-xl font-semibold text-amber-100">Multijoueur</p>
                <p className="mt-2 text-sm text-white/75">Duel en ligne</p>
              </button>
            </div>
          )}

          {entryMode === "multi" && (
            <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-widest text-white/45">Cadence</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIME_OPTIONS.map((minutes) => (
                  <button
                    key={`multi-${minutes}`}
                    onClick={() => sendAction({ action: "set-time-control", minutes })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      (state?.timeControlMinutes ?? 15) === minutes
                        ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
                        : "border-white/10 bg-white/[0.03] text-white/75"
                    )}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </section>
          )}

          {entryMode === "multi" && (
            <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-widest text-white/45">Joueurs connectes ({onlinePlayers.length})</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {onlinePlayers.map((p) => (
                  <span key={p.id} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
                    {p.name}
                    {p.id === playerId ? " (toi)" : ""}
                  </span>
                ))}
              </div>
            </section>
          )}

          {entryMode === "local" && (
            <section className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.04] p-4">
              <p className="text-xs uppercase tracking-widest text-emerald-200/70">Mode local 1 telephone</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLocalKind("duel")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs",
                    localKind === "duel"
                      ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-200"
                      : "border-white/10 bg-white/[0.03] text-white/70"
                  )}
                >
                  Vs collegue (meme tel)
                </button>
                <button
                  onClick={() => setLocalKind("bot")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs",
                    localKind === "bot"
                      ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-200"
                      : "border-white/10 bg-white/[0.03] text-white/70"
                  )}
                >
                  Vs bot
                </button>
              </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs text-white/50">Temps par joueur</p>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map((minutes) => (
                    <button
                      key={`local-${minutes}`}
                      onClick={() => setLocalTimeMinutes(minutes)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-xs",
                        localTimeMinutes === minutes
                          ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                          : "border-white/10 bg-white/[0.03] text-white/70"
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
                          "rounded-lg border px-2 py-2 text-xs capitalize",
                          localBotLevel === level
                            ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                            : "border-white/10 bg-white/[0.03] text-white/70"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/50">Noms joueurs</p>
                <input
                  value={localWhiteName}
                  onChange={(e) => setLocalWhiteName(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                  placeholder="Nom joueur blanc"
                />
                <input
                  value={localBlackName}
                  onChange={(e) => setLocalBlackName(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                  placeholder={localKind === "bot" ? "Nom joueur" : "Nom joueur noir"}
                />
              </div>
            </div>
            <button
              onClick={startLocalGame}
              className="mt-3 rounded-xl border border-emerald-300/40 bg-emerald-500/80 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Lancer en local
            </button>
            </section>
          )}

          {entryMode === "multi" && (
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => sendAction({ action: "start-game" })}
                className="rounded-xl border border-amber-300/40 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-medium text-white hover:from-amber-400 hover:to-orange-400"
              >
                Lancer en multijoueur
              </button>
            </div>
          )}

          {entryMode !== "choose" && (
            <button
              onClick={() => setEntryMode("choose")}
              className="mt-3 w-fit rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/80"
            >
              Retour
            </button>
          )}
        </div>
      </div>
    );
  }

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

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6"
      style={{ fontFamily: "\"Trebuchet MS\", Verdana, sans-serif" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(251,191,36,0.16),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.14),transparent_35%),linear-gradient(145deg,#0f172a,#111827)]" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/70">Echecs en ligne</p>
            <p className="mt-1 text-sm text-white/85">{info}</p>
            {state.phase === "playing" && state.inCheck && (
              <p className="mt-1 text-xs text-red-300">Echec sur le roi {state.turn === "w" ? "blanc" : "noir"}.</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white">
                Blanc {formatClock(state.whiteTimeMs ?? 0)}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white">
                Noir {formatClock(state.blackTimeMs ?? 0)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-white/70">
            <button
              onClick={toggleFullscreen}
              className="rounded-lg border border-cyan-300/35 bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/30"
            >
              {isFullscreen ? "Quitter plein ecran" : "Plein ecran"}
            </button>
            <span>{whiteName} (Blanc)</span>
            <span>{blackName} (Noir)</span>
            {state.lastMove && (
              <span className="text-white/50">
                Dernier coup: {state.lastMove.fromSquare} → {state.lastMove.toSquare}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 mx-auto w-full max-w-[min(92vw,820px)]">
          <ChessBoardView
            board={board}
            selectedSquare={selected}
            onSquareClick={handleOnlineClick}
            availableTargets={selectedTargets}
            lastMove={state.lastMove ? { from: state.lastMove.from, to: state.lastMove.to } : null}
            orientation={orientation}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/65">
          <span className="rounded-full border border-white/20 px-3 py-1">
            Toi: {myColor ? (myColor === "w" ? "Blanc" : "Noir") : "Spectateur"}
          </span>
          {state.phase === "playing" && (
            <span className="rounded-full border border-white/20 px-3 py-1">
              {canPlayOnline ? "A toi de jouer" : "En attente"}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {state.phase === "playing" && myColor && (
            <button
              onClick={() => sendAction({ action: "resign" })}
              className="rounded-xl border border-red-300/35 bg-red-500/70 px-4 py-3 text-sm font-medium text-white hover:bg-red-500"
            >
              Abandonner
            </button>
          )}
          {state.phase === "game-over" && (
            <button
              onClick={() => sendAction({ action: "start-game" })}
              className="rounded-xl border border-amber-300/40 bg-amber-500/80 px-4 py-3 text-sm font-medium text-white hover:bg-amber-500"
            >
              Rejouer
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}
