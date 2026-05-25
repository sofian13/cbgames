"use client";

import { useMemo, useState, useEffect, useCallback, useRef, memo } from "react";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot } from "@/components/Mascot";

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

// \uFE0E = text variation selector — forces text rendering on iOS (not emoji)
const PIECE_GLYPH: Record<string, string> = {
  wp: "\u265F\uFE0E",
  wn: "\u265E\uFE0E",
  wb: "\u265D\uFE0E",
  wr: "\u265C\uFE0E",
  wq: "\u265B\uFE0E",
  wk: "\u265A\uFE0E",
  bp: "\u265F\uFE0E",
  bn: "\u265E\uFE0E",
  bb: "\u265D\uFE0E",
  br: "\u265C\uFE0E",
  bq: "\u265B\uFE0E",
  bk: "\u265A\uFE0E",
};

const PIECE_SYMBOL = PIECE_GLYPH;

const TIME_OPTIONS = [5, 10, 15, 30] as const;

type BoardTheme = "classic" | "ocean" | "rose" | "noir" | "emerald";
const BOARD_THEMES: Record<BoardTheme, { light: string; dark: string; accent: string; name: string }> = {
  classic: { light: "#EFE2C5", dark: "#A37553", accent: "#FFD23F", name: "Classique" },
  ocean: { light: "#E8F0F4", dark: "#5A7E9B", accent: "#3DDC97", name: "Océan" },
  rose: { light: "#F5E5E2", dark: "#B95F73", accent: "#FF3EA5", name: "Rose" },
  noir: { light: "#2C2645", dark: "#1A1A2E", accent: "#7A4EE8", name: "Nuit" },
  emerald: { light: "#E8F5E0", dark: "#3B6B43", accent: "#FFD23F", name: "Émeraude" },
};

type PlayColor = "w" | "random" | "b";
type Cadence = { id: string; name: string; big: string; sub: string; minutes: number };
const CADENCES: Cadence[] = [
  { id: "none", name: "Sans timer", big: "∞", sub: "détente", minutes: 999 },
  { id: "bullet", name: "Bullet", big: "1+0", sub: "très rapide", minutes: 1 },
  { id: "blitz", name: "Blitz", big: "3+2", sub: "rapide", minutes: 3 },
  { id: "rapide", name: "Rapide", big: "10+5", sub: "équilibré", minutes: 10 },
  { id: "classique", name: "Classique", big: "30+0", sub: "long", minutes: 30 },
  { id: "perso", name: "Personnalisé", big: "⚙", sub: "à toi", minutes: 15 },
];

const AI_LEVELS: Array<{ key: string; level: BotLevel; name: string; elo: string; desc: string; color: string; icon: string }> = [
  { key: "beginner", level: "easy", name: "Débutant", elo: "~800", desc: "Joue au hasard parfois", color: "#65dfb2", icon: "🌱" },
  { key: "easy", level: "easy", name: "Facile", elo: "~1200", desc: "Cherche 2 coups", color: "#5BA7E8", icon: "📘" },
  { key: "medium", level: "medium", name: "Moyen", elo: "~1800", desc: "Cherche 4 coups", color: "#FFD23F", icon: "🔥" },
  { key: "expert", level: "hard", name: "Expert", elo: "~2400", desc: "Stockfish full power", color: "#FF3EA5", icon: "⚡" },
];

function inside(x: number, y: number) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function makeIndex(x: number, y: number) {
  return y * 8 + x;
}
// Index (0 = a8) → nom de case "e4"
function squareLabel(idx: number) {
  return "abcdefgh"[idx % 8] + (8 - Math.floor(idx / 8));
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

function GameOverPopup({
  winnerName,
  reason,
  isDraw,
  onClose,
  onReplay,
}: {
  winnerName: string;
  reason: EndReason | null;
  isDraw: boolean;
  onClose: () => void;
  onReplay?: () => void;
}) {
  const reasonLabel = reason === "checkmate" ? "Echec et mat" : reason === "resign" ? "Abandon" : reason === "timeout" ? "Temps ecoule" : reason === "stalemate" ? "Pat" : "Match nul";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-white/25 bg-black/80 p-7 text-center backdrop-blur-md" style={{ animation: "scaleIn 0.3s ease" }}>
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-white/40">{reasonLabel}</p>
        {isDraw ? (
          <>
            <p className="mt-4 font-serif text-3xl font-bold text-white/90">Match nul</p>
            <p className="mt-2 font-sans text-sm text-white/50">Personne ne gagne</p>
          </>
        ) : (
          <>
            <p className="mt-4 font-serif text-3xl font-bold text-[#65dfb2]">{winnerName}</p>
            <p className="mt-2 font-sans text-sm text-white/50">remporte la partie</p>
          </>
        )}
        <div className="mt-6 flex flex-col gap-2">
          {onReplay && (
            <button
              onClick={() => { onClose(); onReplay(); }}
              className="rounded-xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-6 py-3 font-sans text-sm font-semibold text-black shadow-[0_0_20px_rgba(78,207,138,0.25)] transition hover:shadow-[0_0_30px_rgba(78,207,138,0.4)]"
            >
              Rejouer
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-xl border border-white/25 bg-white/5 px-6 py-3 font-sans text-sm text-white/70 transition hover:bg-white/10"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// Carte joueur compacte (style maquette CH05) — avatar roi + nom + captures + timer + glow.
function CompactPlayerCard({ name, color, timeMs, captures, isTurn }: {
  name: string; color: Color; timeMs: number; captures: string[]; isTurn: boolean;
}) {
  return (
    <div style={{
      padding: "8px 12px", borderRadius: 12,
      background: isTurn ? "linear-gradient(90deg, rgba(255,210,63,0.18) 0%, rgba(255,210,63,0.04) 100%)" : "rgba(255,255,255,0.04)",
      border: isTurn ? "1.5px solid #FFD23F" : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isTurn ? "0 8px 18px rgba(255,210,63,0.20)" : "none",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: color === "w" ? "#F4F1E8" : "#1A1A1A",
        border: `1px solid ${color === "w" ? "#C9C2AC" : "#3A3A3A"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 26, lineHeight: 1, color: color === "w" ? "#0F0F12" : "#FAF6E8" }}>♚</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-sans" style={{ fontSize: 14, color: "white", fontWeight: 800, lineHeight: 1.1 }}>{name}</div>
        {captures.length > 0 && (
          <div style={{ marginTop: 2, height: 16, overflow: "hidden", whiteSpace: "nowrap", fontSize: 14, lineHeight: 1, color: "rgba(255,255,255,0.55)" }}>
            {captures.join("")}
          </div>
        )}
      </div>
      <div style={{
        padding: "6px 12px", borderRadius: 8, minWidth: 78, textAlign: "center",
        background: isTurn ? "#FFD23F" : "rgba(255,255,255,0.06)",
        color: isTurn ? "#1A0E2E" : "white",
        fontFamily: "var(--font-mono, monospace)", fontSize: 20, fontWeight: 900, letterSpacing: 1,
        boxShadow: isTurn ? "0 6px 14px rgba(255,210,63,0.30)" : "none",
      }}>{formatClock(timeMs)}</div>
    </div>
  );
}

function LocalActionBtn({ icon, label, accent, onClick, disabled }: { icon: string; label: string; accent?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: "10px 6px", borderRadius: 14,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
    }}>
      <span style={{ fontSize: 18, color: accent || "white", lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{label}</span>
    </button>
  );
}

// En-tête d'étape (maquette CH02/03/04) : chip retour + sous-titre + titre + tag.
function ChessStepHeader({ onBack, sub, title, tag, tagColor = "#FFD23F" }: {
  onBack: () => void; sub: string; title: string; tag: string; tagColor?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onBack} aria-label="Retour" style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, lineHeight: 1,
      }}>‹</button>
      <div className="min-w-0 flex-1">
        <div className="font-mono" style={{ fontSize: 10, color: "#FFD23F", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{sub}</div>
        <div className="font-sans" style={{ fontSize: 22, color: "white", fontWeight: 800, letterSpacing: -0.5, lineHeight: 1, marginTop: 3 }}>{title}</div>
      </div>
      <span className="font-mono" style={{
        fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
        color: tagColor, padding: "4px 9px", borderRadius: 4,
        border: `1px solid ${tagColor}55`, background: `${tagColor}11`, whiteSpace: "nowrap",
      }}>{tag}</span>
    </div>
  );
}

// Roi unicode coloré (pour les cartes de choix de couleur CH03).
function KingGlyph({ color, size = 34 }: { color: Color; size?: number }) {
  return (
    <span style={{
      fontSize: size, lineHeight: 1,
      color: color === "w" ? "#FAF6E8" : "#0F0F12",
      WebkitTextStroke: color === "w" ? "0.6px #14101F" : "0.4px #5A4D7A",
      textShadow: color === "w" ? "0 2px 3px rgba(0,0,0,0.45)" : "0 2px 3px rgba(0,0,0,0.55)",
    }}>♚</span>
  );
}

// Modale de promotion (maquette CH07) + touche blob.
function ChessPromotionModal({ color, onPick }: { color: Color; onPick: (t: PieceType) => void }) {
  const choices: Array<{ t: PieceType; name: string; sub: string; featured?: boolean }> = [
    { t: "q", name: "Dame", sub: "+ puissante", featured: true },
    { t: "r", name: "Tour", sub: "lignes droites" },
    { t: "b", name: "Fou", sub: "diagonales" },
    { t: "n", name: "Cavalier", sub: "saute" },
  ];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6" style={{ background: "rgba(8,4,20,0.72)", backdropFilter: "blur(3px)", animation: "fadeIn 0.25s ease" }}>
      <div className="relative w-full max-w-sm rounded-3xl p-5 pt-12" style={{ background: "linear-gradient(180deg,#2A2440 0%,#161024 100%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 30px 60px rgba(0,0,0,0.65)", animation: "scaleIn 0.3s ease" }}>
        {/* Blob qui regarde par-dessus la modale */}
        <div className="absolute -top-9 left-1/2 -translate-x-1/2">
          <Mascot size={64} color="yellow" mood="happy" crown bob />
        </div>
        <div className="text-center">
          <span className="font-mono text-[9px] font-extrabold uppercase tracking-[2px]" style={{ color: "#FFD23F", padding: "4px 9px", borderRadius: 4, border: "1px solid #FFD23F55", background: "#FFD23F11" }}>Promotion</span>
          <h3 className="mt-2.5 text-2xl font-black text-white" style={{ letterSpacing: -0.5 }}>Choisis ta pièce</h3>
          <p className="mt-1 text-xs text-white/45">Ton pion atteint la dernière rangée</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {choices.map((c) => (
            <button key={c.t} onClick={() => onPick(c.t)} className="rounded-2xl px-3 pb-3 pt-4 text-center transition active:scale-95" style={{
              background: c.featured ? "linear-gradient(160deg, rgba(255,210,63,0.18) 0%, rgba(0,0,0,0.30) 100%)" : "rgba(255,255,255,0.04)",
              border: c.featured ? "2px solid #FFD23F" : "1px solid rgba(255,255,255,0.10)",
              boxShadow: c.featured ? "0 12px 24px rgba(255,210,63,0.25)" : "none",
            }}>
              <span style={{ fontSize: 48, lineHeight: 1, color: color === "w" ? "#FAF6E8" : "#0F0F12", WebkitTextStroke: color === "w" ? "0.7px #14101F" : "0.5px #5A4D7A", display: "block" }}>{PIECE_GLYPH[`${color}${c.t}`]}</span>
              <span className="mt-1.5 block text-[15px] font-extrabold text-white">{c.name}</span>
              <span className="block text-[10px] font-semibold" style={{ color: c.featured ? "#FFD23F" : "rgba(255,255,255,0.4)" }}>{c.sub}</span>
            </button>
          ))}
        </div>
      </div>
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
  inCheckSquare?: number | null;
  theme?: BoardTheme;
}

const ChessBoardView = memo(function ChessBoardView({
  board,
  selectedSquare,
  onSquareClick,
  availableTargets,
  lastMove,
  orientation = "w",
  inCheckSquare = null,
  theme = "classic",
}: ChessBoardViewProps) {
  const T = BOARD_THEMES[theme] ?? BOARD_THEMES.classic;
  const rows = orientation === "w" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const cols = orientation === "w" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const fileLabels = orientation === "w" ? ["a","b","c","d","e","f","g","h"] : ["h","g","f","e","d","c","b","a"];
  const rankLabels = orientation === "w" ? ["8","7","6","5","4","3","2","1"] : ["1","2","3","4","5","6","7","8"];
  const targetSet = useMemo(() => new Set(availableTargets), [availableTargets]);
  const lastMoveSet = useMemo(() => {
    if (!lastMove) return new Set<number>();
    return new Set([lastMove.from, lastMove.to]);
  }, [lastMove]);

  return (
    <div className="relative w-full">
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
        <div className="grid flex-1 grid-cols-8 overflow-hidden rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]" style={{ gap: 0, lineHeight: 0 }}>
          {rows.map((y) =>
            cols.map((x) => {
              const idx = makeIndex(x, y);
              const isLight = (x + y) % 2 === 0;
              const piece = board[idx];
              const code = piece ? `${piece.color}${piece.type}` : "";
              const isSelected = selectedSquare === idx;
              const isTarget = targetSet.has(idx);
              const isLastMove = lastMoveSet.has(idx);
              const isCapture = isTarget && piece !== null;
              const isCheck = inCheckSquare === idx;

              return (
                <button
                  key={idx}
                  onClick={() => onSquareClick(idx)}
                  className="relative flex aspect-square items-center justify-center leading-none"
                  style={{ background: isLight ? T.light : T.dark, fontSize: "clamp(1rem, 6vw, 2.8rem)" }}
                >
                  {isLastMove && (
                    <span className="pointer-events-none absolute inset-0" style={{ background: `${T.accent}4D` }} />
                  )}
                  {isSelected && (
                    <span className="pointer-events-none absolute inset-0" style={{ background: `${T.accent}66`, boxShadow: `inset 0 0 0 3px ${T.accent}` }} />
                  )}
                  {isCheck && (
                    <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle, rgba(255,62,165,0.7) 0%, rgba(255,62,165,0) 70%)" }} />
                  )}
                  {isTarget && !isCapture && (
                    <span className="absolute h-[28%] w-[28%] rounded-full" style={{ background: "rgba(0,0,0,0.32)" }} />
                  )}
                  {isCapture && (
                    <span className="absolute inset-[5%] rounded-full" style={{ border: "3px solid rgba(0,0,0,0.32)" }} />
                  )}
                  {code && (
                    <span
                      className={cn(
                        "relative z-10 select-none transition-transform duration-100",
                        isSelected && "scale-110"
                      )}
                      style={{
                        color: piece?.color === "w" ? "#FAF6E8" : "#0F0F12",
                        WebkitTextStroke: piece?.color === "w" ? "0.6px #14101F" : "0.4px #5A4D7A",
                        textShadow: piece?.color === "w"
                          ? "0 2px 3px rgba(0,0,0,0.45), 0 0 1px rgba(0,0,0,0.5)"
                          : "0 2px 3px rgba(0,0,0,0.55)",
                      }}
                    >
                      {PIECE_GLYPH[code]}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

export default function ChessGame({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const { sendAction } = useGame(roomCode, "chess", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as ChessState | null;

  const [selected, setSelected] = useState<number | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const [entryMode, setEntryMode] = useState<"choose" | "ai-level" | "setup" | "lobby">("choose");
  const [localKind, setLocalKind] = useState<"duel" | "bot">("duel");
  const [localBotLevel, setLocalBotLevel] = useState<BotLevel>("medium");
  const [aiLevelKey, setAiLevelKey] = useState<string>("easy");
  const [playColor, setPlayColor] = useState<PlayColor>("w");
  const [localHumanColor, setLocalHumanColor] = useState<Color>("w");
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("classic");
  const [cadenceId, setCadenceId] = useState<string>("blitz");
  const [localTimeMinutes, setLocalTimeMinutes] = useState<number>(3);
  const [localWhiteName, setLocalWhiteName] = useState("Joueur 1");
  const [localBlackName, setLocalBlackName] = useState("Joueur 2");
  const [localBoard, setLocalBoard] = useState<Array<Piece | null>>(() => initialBoard());
  const [localTurn, setLocalTurn] = useState<Color>("w");
  const [localWinner, setLocalWinner] = useState<Color | "draw" | null>(null);
  const [localReason, setLocalReason] = useState<EndReason | null>(null);
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const [localPromo, setLocalPromo] = useState<{ from: number; to: number } | null>(null);
  const [localLastMove, setLocalLastMove] = useState<ChessMove | null>(null);
  const [localMoveCount, setLocalMoveCount] = useState(0);
  const [localMoveLog, setLocalMoveLog] = useState<string[]>([]);
  const [localUndoStack, setLocalUndoStack] = useState<{ board: Array<Piece | null>; turn: Color; lastMove: ChessMove | null; moveCount: number; log: string[] }[]>([]);
  const [localWhiteTimeMs, setLocalWhiteTimeMs] = useState(15 * 60_000);
  const [localBlackTimeMs, setLocalBlackTimeMs] = useState(15 * 60_000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const onlineLastMoveKeyRef = useRef<string | null>(null);
  const endSoundPlayedRef = useRef(false);
  const onlineMoveKey = state?.lastMove
    ? `${state.lastMove.from}-${state.lastMove.to}-${state.phase}`
    : `phase-${state?.phase ?? "waiting"}`;
  const [optimisticMove, setOptimisticMove] = useKeyedState<ChessMove | null>(
    onlineMoveKey,
    null
  );
  const gameOverPopupKey = localMode
    ? `local-${localWinner ?? "active"}-${localReason ?? "none"}`
    : `online-${state?.phase ?? "waiting"}-${state?.winner ?? "none"}-${state?.reason ?? "none"}`;
  const [showGameOverPopup, setShowGameOverPopup] = useKeyedState<boolean>(
    gameOverPopupKey,
    () => (localMode ? !!localWinner : state?.phase === "game-over")
  );

  const serverBoard = useMemo(() => (state?.board ? state.board.map(decodePiece) : []), [state]);
  const board = useMemo(() => {
    if (optimisticMove && serverBoard.length > 0) {
      return applyMove(serverBoard, optimisticMove);
    }
    return serverBoard;
  }, [serverBoard, optimisticMove]);

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
  const localInCheckSquare = useMemo(() => {
    if (isInCheck(localBoard, localTurn)) return findKingSquare(localBoard, localTurn);
    return null;
  }, [localBoard, localTurn]);
  const onlineCapturedWhite = useMemo(() => getCapturedPieceSymbols(board, "w"), [board]);
  const onlineCapturedBlack = useMemo(() => getCapturedPieceSymbols(board, "b"), [board]);
  const onlineInCheckSquare =
    state?.inCheck && state?.turn ? findKingSquare(board, state.turn) : null;
  const isFocusView = isFullscreen || focusMode;

  const getAudioCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext ||
      // @ts-expect-error vendor prefix fallback
      window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
    return audioContextRef.current;
  }, []);

  const playMoveSound = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Wooden thud — low-freq knock with noise texture
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // Noise burst for click texture
    const bufSize = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 1.5;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.04);
  }, [getAudioCtx]);

  const playWinSound = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
  }, [getAudioCtx]);

  const playLoseSound = useCallback(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392, 349, 311, 262];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.1, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.35);
    });
  }, [getAudioCtx]);

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

    setLocalUndoStack((s) => [...s, { board: localBoard, turn: localTurn, lastMove: localLastMove, moveCount: localMoveCount, log: localMoveLog }]);
    setLocalMoveLog((l) => [...l, `${squareLabel(move.from)}${squareLabel(move.to)}`]);
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
  }, [localBoard, localMoveCount, localTurn, localLastMove, localMoveLog, playMoveSound]);

  const undoLocal = useCallback(() => {
    setLocalUndoStack((s) => {
      if (s.length === 0) return s;
      const prev = s[s.length - 1];
      setLocalBoard(prev.board);
      setLocalTurn(prev.turn);
      setLocalLastMove(prev.lastMove);
      setLocalMoveCount(prev.moveCount);
      setLocalMoveLog(prev.log);
      setLocalSelected(null);
      setLocalWinner(null);
      setLocalReason(null);
      return s.slice(0, -1);
    });
  }, []);

  const offerLocalDraw = useCallback(() => {
    setLocalWinner("draw");
    setLocalReason("draw");
  }, []);

  const localHint = useCallback(() => {
    if (localWinner) return;
    const legal = generateLegalMoves(localBoard, localTurn);
    if (legal.length > 0) setLocalSelected(legal[Math.floor(Math.random() * legal.length)].from);
  }, [localBoard, localTurn, localWinner]);

  useEffect(() => {
    if (!localMode || localWinner || localKind !== "bot") return;
    const botColor = otherColor(localHumanColor);
    if (localTurn !== botColor) return;
    const timer = setTimeout(() => {
      const legal = generateLegalMoves(localBoard, botColor);
      if (legal.length === 0) return;
      const move = pickBotMove(localBoard, legal, localBotLevel, botColor);
      applyLocalMove(move);
    }, 250);
    return () => clearTimeout(timer);
  }, [applyLocalMove, localBoard, localBotLevel, localHumanColor, localKind, localMode, localTurn, localWinner]);

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

  // Clear optimistic move when server confirms
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

  // Local game over sound + popup
  useEffect(() => {
    if (!localWinner || endSoundPlayedRef.current) return;
    endSoundPlayedRef.current = true;
    if (localWinner === "draw") {
      playLoseSound();
    } else if (localKind === "bot") {
      if (localWinner === "w") {
        playWinSound();
      } else {
        playLoseSound();
      }
    } else {
      playWinSound();
    }
  }, [localWinner, localKind, playWinSound, playLoseSound]);

  // Online game over sound + popup
  useEffect(() => {
    if (!state || state.phase !== "game-over" || endSoundPlayedRef.current) return;
    endSoundPlayedRef.current = true;
    if (!myColor || state.winner === "draw") {
      playLoseSound();
    } else if (state.winner === myColor) {
      playWinSound();
    } else {
      playLoseSound();
    }
  }, [state, myColor, playWinSound, playLoseSound]);

  // Reset end sound flag when starting new game
  useEffect(() => {
    if (localMode && !localWinner) {
      endSoundPlayedRef.current = false;
    }
  }, [localMode, localWinner]);

  useEffect(() => {
    if (state?.phase === "playing") {
      endSoundPlayedRef.current = false;
    }
  }, [state?.phase]);

  const handleOnlineClick = useCallback((index: number) => {
    if (!state || state.phase !== "playing" || !canPlayOnline) return;
    const piece = serverBoard[index];

    if (selected !== null) {
      const targets = legalMovesByFrom.get(selected) ?? [];
      if (targets.includes(index)) {
        const move = { from: selected, to: index };
        setOptimisticMove(move);
        playMoveSound();
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
  }, [serverBoard, canPlayOnline, legalMovesByFrom, myColor, selected, sendAction, setOptimisticMove, state, playMoveSound]);

  const handleLocalClick = useCallback((index: number) => {
    if (localWinner) return;
    if (localKind === "bot" && localTurn === otherColor(localHumanColor)) return;
    const piece = localBoard[index];

    if (localSelected !== null) {
      const targets = localLegalByFrom.get(localSelected) ?? [];
      if (targets.includes(index)) {
        const mover = localBoard[localSelected];
        const toRank = Math.floor(index / 8);
        if (mover?.type === "p" && (toRank === 0 || toRank === 7)) {
          setLocalPromo({ from: localSelected, to: index });
          setLocalSelected(null);
          return;
        }
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
  }, [applyLocalMove, localBoard, localHumanColor, localKind, localLegalByFrom, localSelected, localTurn, localWinner]);

  const startLocalGame = useCallback((minutesOverride?: number) => {
    const minutes = minutesOverride ?? localTimeMinutes;
    setLocalBoard(initialBoard());
    setLocalTurn("w");
    setLocalWinner(null);
    setLocalReason(null);
    setLocalSelected(null);
    setLocalLastMove(null);
    setLocalMoveCount(0);
    setLocalMoveLog([]);
    setLocalUndoStack([]);
    setLocalWhiteTimeMs(minutes * 60_000);
    setLocalBlackTimeMs(minutes * 60_000);
    setLocalMode(true);
  }, [localTimeMinutes]);

  // Lance une partie locale depuis l'écran de réglages (CH03).
  const launchLocalFromSetup = useCallback(() => {
    const human: Color = playColor === "random" ? (Math.random() < 0.5 ? "w" : "b") : playColor;
    const cad = CADENCES.find((c) => c.id === cadenceId) ?? CADENCES[2];
    setLocalHumanColor(human);
    setLocalTimeMinutes(cad.minutes);
    startLocalGame(cad.minutes);
  }, [playColor, cadenceId, startLocalGame]);

  const focusBoardStyle = {
    width: "min(calc(100vw - 1.25rem), calc(100svh - 13.5rem), 940px)",
    maxWidth: "100%",
  };
  const normalBoardStyle = {
    width: "min(calc(100vw - 4rem), calc(100svh - 20rem), 820px)",
    maxWidth: "100%",
  };

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
    const localWinnerName = localWinner === "w" ? localWhiteName : localWinner === "b" ? (localKind === "bot" ? "Bot" : localBlackName) : "";

    const bottomColor: Color = localKind === "bot" ? localHumanColor : "w";
    const topColor = otherColor(bottomColor);
    const localOrient: Color = bottomColor;
    const cardFor = (c: Color) => ({
      name: localKind === "bot" ? (c === localHumanColor ? (localWhiteName || "Toi") : "Bot") : c === "w" ? localWhiteName : localBlackName,
      color: c,
      timeMs: c === "w" ? localWhiteTimeMs : localBlackTimeMs,
      captures: c === "w" ? localCapturedBlack : localCapturedWhite,
      isTurn: !localWinner && localTurn === c,
    });

    const promoModal = localPromo ? (
      <ChessPromotionModal color={localTurn} onPick={(t) => { applyLocalMove({ from: localPromo.from, to: localPromo.to, promotion: t }); setLocalPromo(null); }} />
    ) : null;

    if (isFocusView) {
      return (
      <div className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_100%,rgba(45,236,255,0.24),transparent_34%),radial-gradient(circle_at_50%_12%,rgba(120,102,255,0.18),transparent_38%),linear-gradient(180deg,#2e2b56,#0a153c_58%,#010816)] px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)] pt-[calc(env(safe-area-inset-top,0px)+0.7rem)] font-sans sm:p-5">
        <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col">
          {/* Clocks */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
            <div className="mt-2 hidden grid-cols-2 gap-3 sm:grid">
              <CapturedPieces label={`${localWhiteName} a pris`} pieces={localCapturedBlack} />
              <CapturedPieces
                label={`${localKind === "bot" ? "Bot" : localBlackName} a pris`}
                pieces={localCapturedWhite}
              />
            </div>

            {/* Board */}
            <div className="mx-auto mt-3" style={focusBoardStyle}>
              <ChessBoardView
                board={localBoard}
                selectedSquare={localSelected}
                onSquareClick={handleLocalClick}
                availableTargets={localTargets}
                lastMove={localLastMove}
                orientation={localOrient}
                inCheckSquare={localInCheckSquare}
                theme={boardTheme}
              />
            </div>

            {/* Status bar */}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center font-sans text-xs text-white/80 sm:text-left sm:text-sm">{statusText}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                {!localWinner && (
                  <button
                    onClick={() => {
                      setLocalWinner(otherColor(localTurn));
                      setLocalReason("resign");
                    }}
                    className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2 font-sans text-xs font-semibold text-red-300 transition hover:bg-red-500/30"
                  >
                    Abandonner
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
                {onReturnToLobby && (
                  <button
                    onClick={onReturnToLobby}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-sans text-xs text-white/50 transition hover:bg-white/10 hover:text-white/80"
                  >
                    Menu des jeux
                  </button>
                )}
              </div>
            </div>
          </div>
          {showGameOverPopup && localWinner && (
            <GameOverPopup
              winnerName={localWinnerName}
              reason={localReason}
              isDraw={localWinner === "draw"}
              onClose={() => setShowGameOverPopup(false)}
              onReplay={startLocalGame}
            />
          )}
          {promoModal}
        </div>
      );
    }

    return (
      <div className="relative flex flex-1 flex-col overflow-hidden p-4 font-sans sm:p-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(78,207,138,0.12),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(139,92,246,0.1),transparent_40%),linear-gradient(145deg,#0a0a1a,#111827)]" />

        {/* Main panel */}
        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-white/18 bg-black/28 p-4 backdrop-blur-xl sm:p-7">
          {/* Top bar compacte (maquette CH05) */}
          <div className="flex items-center justify-between">
            <button onClick={() => setLocalMode(false)} aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-lg leading-none text-white">‹</button>
            <div className="text-center">
              <p className="font-mono text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/45">
                {(localKind === "bot" ? `IA · ${localBotLevel}` : "Duel")} · {localTimeMinutes} min
              </p>
              <p className="mt-0.5 font-sans text-[13px] font-bold text-white">
                {localWinner ? statusText : `Tour ${localTurn === "w" ? "blanc" : "noir"}`}
              </p>
            </div>
            <button onClick={toggleFullscreen} aria-label="Plein écran"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sm leading-none text-white">⛶</button>
          </div>

          {!localWinner && localKind === "duel" && (
            <p className="mt-2 text-center font-sans text-[11px] text-white/40">
              Passe le téléphone au joueur {localTurn === "w" ? "Blanc" : "Noir"}.
            </p>
          )}

          {/* Adversaire — en haut */}
          <div className="mt-3">
            <CompactPlayerCard {...cardFor(topColor)} />
          </div>

          {/* Board */}
          <div className="mx-auto mt-3" style={normalBoardStyle}>
            <ChessBoardView
              board={localBoard}
              selectedSquare={localSelected}
              onSquareClick={handleLocalClick}
              availableTargets={localTargets}
              lastMove={localLastMove}
              orientation={localOrient}
              inCheckSquare={localInCheckSquare}
              theme={boardTheme}
            />
          </div>

          {/* Moi — en bas */}
          <div className="mt-3">
            <CompactPlayerCard {...cardFor(bottomColor)} />
          </div>

          {/* Historique des coups (CH05) */}
          {localMoveLog.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-dashed border-white/10 bg-black/35 px-2.5 py-1.5">
              {localMoveLog.map((mv, i) => (
                <span key={i} className="flex shrink-0 items-center gap-1.5">
                  {i % 2 === 0 && <span className="font-mono text-[9px] font-extrabold tracking-wide text-white/40">{i / 2 + 1}.</span>}
                  <span className="font-mono text-[12px] font-bold" style={{
                    padding: "3px 8px", borderRadius: 6,
                    background: i === localMoveLog.length - 1 ? "#FFD23F" : "rgba(255,255,255,0.06)",
                    color: i === localMoveLog.length - 1 ? "#1A0E2E" : "#fff",
                  }}>{mv}</span>
                </span>
              ))}
            </div>
          )}

          {/* Actions (maquette CH05) */}
          <div className="mt-4 flex gap-2">
            {localWinner ? (
              <button onClick={() => startLocalGame()}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] py-3 font-sans text-sm font-bold text-black shadow-[0_0_20px_rgba(78,207,138,0.25)]">
                🔄 Rejouer
              </button>
            ) : (
              <>
                <LocalActionBtn icon="↶" label="Annuler" onClick={undoLocal} disabled={localUndoStack.length === 0} />
                <LocalActionBtn icon="💡" label="Indice" accent="#FFD23F" onClick={localHint} />
                <LocalActionBtn icon="🚩" label="Abandon" onClick={() => { setLocalWinner(otherColor(localTurn)); setLocalReason("resign"); }} />
                <LocalActionBtn icon="🤝" label="Nulle" onClick={offerLocalDraw} />
              </>
            )}
          </div>
        </div>
        {showGameOverPopup && localWinner && (
          <GameOverPopup
            winnerName={localWinnerName}
            reason={localReason}
            isDraw={localWinner === "draw"}
            onClose={() => setShowGameOverPopup(false)}
            onReplay={startLocalGame}
          />
        )}
        {promoModal}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     WAITING / MODE SELECT
     ════════════════════════════════════════════════════════ */
  if (!state || state.phase === "waiting") {
    const onlinePlayers = state?.connectedPlayers ?? [];
    const showColorPick = localKind === "bot";
    const meName = onlinePlayers.find((p) => p.id === playerId)?.name ?? playerName ?? "Toi";
    const oppName = onlinePlayers.find((p) => p.id !== playerId)?.name ?? null;
    const isHost = onlinePlayers.length > 0 && onlinePlayers[0].id === playerId;
    const lobbyCadence = CADENCES.find((c) => c.minutes === (state?.timeControlMinutes ?? 3));

    const modeRows = [
      { icon: "🤖", title: "Contre l'IA", sub: "4 niveaux · joue seul", accent: "#FFD23F", onClick: () => { setLocalKind("bot"); setEntryMode("ai-level"); } },
      { icon: "📱", title: "Un seul téléphone", sub: "On se le passe · pass-and-play", accent: "#65dfb2", onClick: () => { setLocalKind("duel"); setEntryMode("setup"); } },
      { icon: "🌐", title: "En ligne", sub: "Avec un code de salle", accent: "#FF3EA5", onClick: () => { setEntryMode("lobby"); sendAction({ action: "set-mode", mode: "online" }); } },
    ];

    return (
      <div className="relative flex flex-1 flex-col overflow-y-auto font-sans" style={{
        background: "radial-gradient(120% 70% at 50% 0%, rgba(122,78,232,0.22) 0%, transparent 60%), linear-gradient(180deg,#0F0A1F 0%,#1A1230 100%)",
        padding: "calc(env(safe-area-inset-top,0px) + 18px) 16px calc(env(safe-area-inset-bottom,0px) + 26px)",
      }}>
        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col">

          {/* ── CH01 · MODE ── */}
          {entryMode === "choose" && (
            <>
              <div className="flex flex-col items-center pt-2 text-center">
                <div className="mb-3 flex items-end justify-center gap-1">
                  <Mascot size={54} color="sky" mood="cool" delay={0.15} />
                  <Mascot size={88} color="yellow" mood="happy" crown arms cheering delay={0} />
                  <Mascot size={54} color="coral" mood="shocked" delay={0.3} />
                </div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">af games · le roi des jeux</p>
                <h2 className="mt-1 font-black text-white" style={{ fontSize: 52, letterSpacing: -2.2, lineHeight: 0.92, textShadow: "0 0 40px rgba(255,210,63,0.22)" }}>
                  Échec<span style={{ background: "linear-gradient(120deg,#FFD23F,#fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>s</span>
                </h2>
                <p className="mt-2.5 text-sm text-white/55">Le roi des jeux. <em className="not-italic font-bold text-[#FFD23F]">2 joueurs</em>, IA ou en ligne.</p>
              </div>
              <div className="mt-7 flex flex-col gap-2.5">
                {modeRows.map((m) => (
                  <button key={m.title} onClick={m.onClick}
                    className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-left transition active:scale-[0.98]">
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] text-2xl"
                      style={{ background: `${m.accent}1A`, border: `1px solid ${m.accent}33` }}>{m.icon}</span>
                    <span className="flex-1">
                      <span className="block text-[18px] font-extrabold leading-none text-white">{m.title}</span>
                      <span className="mt-1.5 block text-xs text-white/45">{m.sub}</span>
                    </span>
                    <span style={{ color: m.accent, fontSize: 20, fontWeight: 800 }}>›</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── CH02 · NIVEAU IA ── */}
          {entryMode === "ai-level" && (
            <>
              <ChessStepHeader onBack={() => setEntryMode("choose")} sub="Setup IA · 1/2" title="Niveau" tag="vs IA" tagColor="#65dfb2" />
              <div className="mt-6 flex justify-center">
                <div className="flex items-center justify-center" style={{
                  width: 100, height: 100, borderRadius: 28, fontSize: 52,
                  background: "linear-gradient(160deg, rgba(122,78,232,0.20) 0%, rgba(0,0,0,0.35) 100%)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 18px 40px rgba(122,78,232,0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
                }}>🤖</div>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                {AI_LEVELS.map((l) => {
                  const active = aiLevelKey === l.key;
                  return (
                    <button key={l.key} onClick={() => { setAiLevelKey(l.key); setLocalBotLevel(l.level); }}
                      className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition" style={{
                        background: active ? `linear-gradient(160deg, ${l.color}22 0%, rgba(0,0,0,0.30) 100%)` : "rgba(255,255,255,0.03)",
                        border: active ? `2px solid ${l.color}` : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: active ? `0 16px 30px ${l.color}33` : "none",
                      }}>
                      <span className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20, background: `${l.color}1A`, border: `1px solid ${l.color}40` }}>{l.icon}</span>
                      <span className="flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="text-[17px] font-extrabold text-white">{l.name}</span>
                          <span className="font-mono text-[10px] font-extrabold tracking-wider" style={{ color: l.color }}>ELO {l.elo}</span>
                        </span>
                        <span className="mt-0.5 block text-[11px] text-white/45">{l.desc}</span>
                      </span>
                      <span className="flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: active ? `2px solid ${l.color}` : "1.5px solid rgba(255,255,255,0.25)", background: active ? l.color : "transparent", color: "#1A0E2E", fontSize: 12, fontWeight: 900 }}>{active ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setEntryMode("setup")} className="mt-auto pt-6">
                <span className="block rounded-2xl py-4 text-center text-base font-bold text-[#1A0E2E]" style={{ background: "linear-gradient(180deg,#FFD23F 0%,#C48800 100%)", boxShadow: "0 14px 30px rgba(255,210,63,0.40)" }}>Continuer →</span>
              </button>
            </>
          )}

          {/* ── CH03 · CADENCE + THÈME ── */}
          {entryMode === "setup" && (
            <>
              <ChessStepHeader onBack={() => setEntryMode(localKind === "bot" ? "ai-level" : "choose")} sub="Setup · 2/2" title="Ta partie" tag="RÉGLAGES" />

              {showColorPick && (
                <div className="mt-6">
                  <p className="font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/40">Tu joues les…</p>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {([
                      { c: "w", bg: "#F4F1E8", border: "#C9C2AC", label: "Blancs", txt: "#1A0E2E", icon: <KingGlyph color="w" size={32} /> },
                      { c: "random", bg: "linear-gradient(135deg,#F4F1E8 0%,#F4F1E8 50%,#1A1A1A 50%,#1A1A1A 100%)", border: "#7A4EE8", label: "Au sort", txt: "#fff", icon: <span style={{ fontSize: 24 }}>🎲</span> },
                      { c: "b", bg: "#1A1A1A", border: "#3A3A3A", label: "Noirs", txt: "#fff", icon: <KingGlyph color="b" size={32} /> },
                    ] as const).map((o) => {
                      const active = playColor === o.c;
                      return (
                        <button key={o.c} onClick={() => setPlayColor(o.c as PlayColor)} className="relative rounded-[14px] px-2 pb-3 pt-3.5 text-center" style={{
                          background: o.bg, border: active ? "2px solid #FFD23F" : `1px solid ${o.border}`,
                          boxShadow: active ? "0 12px 28px rgba(255,210,63,0.25)" : "0 4px 10px rgba(0,0,0,0.30)",
                        }}>
                          <span className="flex h-9 items-center justify-center">{o.icon}</span>
                          <span className="mt-1.5 block text-[13px] font-extrabold" style={{ color: o.txt }}>{o.label}</span>
                          {active && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-[#1A0E2E]" style={{ background: "#FFD23F" }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <p className="font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/40">Cadence</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {CADENCES.map((c) => {
                    const active = cadenceId === c.id;
                    return (
                      <button key={c.id} onClick={() => { setCadenceId(c.id); setLocalTimeMinutes(c.minutes); }} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left" style={{
                        background: active ? "linear-gradient(160deg, rgba(255,210,63,0.18) 0%, rgba(255,210,63,0.04) 100%)" : "rgba(255,255,255,0.04)",
                        border: active ? "1.5px solid #FFD23F" : "1px solid rgba(255,255,255,0.08)",
                      }}>
                        <span className="font-mono text-[22px] font-black leading-none" style={{ color: active ? "#FFD23F" : "#fff", letterSpacing: -0.5 }}>{c.big}</span>
                        <span className="flex-1">
                          <span className="block text-[13px] font-bold text-white">{c.name}</span>
                          <span className="block text-[10px] text-white/40">{c.sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <p className="font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/40">Thème du plateau</p>
                <div className="mt-2.5 flex gap-2">
                  {(Object.keys(BOARD_THEMES) as BoardTheme[]).map((t) => {
                    const T = BOARD_THEMES[t];
                    const active = boardTheme === t;
                    return (
                      <button key={t} onClick={() => setBoardTheme(t)} className="flex-1 rounded-xl p-1.5" style={{
                        background: "rgba(255,255,255,0.04)", border: active ? "2px solid #FFD23F" : "1px solid rgba(255,255,255,0.08)",
                      }}>
                        <span className="grid aspect-square w-full overflow-hidden rounded-md" style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
                          <span style={{ background: T.light }} /><span style={{ background: T.dark }} />
                          <span style={{ background: T.dark }} /><span style={{ background: T.light }} />
                        </span>
                        <span className="mt-1.5 block text-center text-[9px] font-bold text-white">{T.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={launchLocalFromSetup} className="mt-auto pt-7">
                <span className="flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-[#1A0E2E]" style={{ background: "linear-gradient(180deg,#FFD23F 0%,#C48800 100%)", boxShadow: "0 14px 30px rgba(255,210,63,0.40)" }}>
                  <span style={{ fontSize: 18 }}>♔</span> Commencer la partie
                </span>
              </button>
            </>
          )}

          {/* ── CH04 · LOBBY ONLINE ── */}
          {entryMode === "lobby" && (
            <>
              <ChessStepHeader onBack={() => setEntryMode("choose")} sub="En ligne · attente" title="Salle d'attente" tag="LIVE" tagColor="#65dfb2" />

              {/* Code */}
              <div className="mt-6 rounded-[22px] px-5 py-5 text-center" style={{
                background: "linear-gradient(160deg, rgba(255,210,63,0.10) 0%, rgba(122,78,232,0.06) 100%)",
                border: "1px solid rgba(255,210,63,0.25)", boxShadow: "0 18px 40px rgba(255,210,63,0.12)",
              }}>
                <p className="font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/45">Code de salle</p>
                <p className="mt-2 font-black text-white" style={{ fontSize: 56, letterSpacing: 10, lineHeight: 1, textShadow: "0 0 28px rgba(255,210,63,0.4)" }}>{roomCode}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => { navigator.clipboard?.writeText(roomCode); setInviteFeedback("Code copié"); }}
                    className="rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-white">📋 Copier</button>
                  <button onClick={shareSpectatorLink} className="rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-white">↗ Partager</button>
                </div>
              </div>

              {/* Players */}
              <p className="mt-6 font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/40">Joueurs</p>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex-1 rounded-2xl px-3 py-3.5 text-center" style={{ background: "linear-gradient(160deg, rgba(255,210,63,0.10) 0%, rgba(0,0,0,0.30) 100%)", border: "1px solid rgba(255,210,63,0.25)" }}>
                  <div className="flex justify-center"><KingGlyph color="w" size={40} /></div>
                  <div className="mt-1 text-[15px] font-extrabold text-white">{meName}</div>
                  <div className="mt-1 text-[10px] font-bold text-[#65dfb2]">✓ Prêt</div>
                </div>
                <div className="text-xl font-black text-white/40">VS</div>
                {oppName ? (
                  <div className="flex-1 rounded-2xl px-3 py-3.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <div className="flex justify-center"><KingGlyph color="b" size={40} /></div>
                    <div className="mt-1 text-[15px] font-extrabold text-white">{oppName}</div>
                    <div className="mt-1 text-[10px] font-bold text-[#65dfb2]">✓ Connecté</div>
                  </div>
                ) : (
                  <div className="flex h-[110px] flex-1 flex-col items-center justify-center gap-2 rounded-2xl" style={{ border: "1.5px dashed rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.02)" }}>
                    <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#FFD23F]/30 border-t-[#FFD23F]" />
                    <span className="text-[11px] font-bold text-white/45">En attente…</span>
                  </div>
                )}
              </div>

              {/* Cadence (host) */}
              {isHost && (
                <>
                  <p className="mt-6 font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/40">Cadence</p>
                  <div className="mt-2.5 grid grid-cols-4 gap-2">
                    {TIME_OPTIONS.map((minutes) => (
                      <button key={`lob-${minutes}`} onClick={() => sendAction({ action: "set-time-control", minutes })} className={cn(
                        "rounded-xl border px-2 py-2.5 font-mono text-sm transition",
                        (state?.timeControlMinutes ?? 15) === minutes
                          ? "border-amber-300/50 bg-amber-300/15 text-amber-200"
                          : "border-white/10 bg-black/20 text-white/40")}>{minutes} min</button>
                    ))}
                  </div>
                </>
              )}

              {/* Waiting note */}
              <div className="mt-6 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" style={{ background: "rgba(255,210,63,0.06)", border: "1px dashed rgba(255,210,63,0.30)" }}>
                <span style={{ fontSize: 16 }}>⏳</span>
                <span className="text-xs text-white/55">{oppName ? `Prêt à lancer · ${lobbyCadence?.name ?? `${state?.timeControlMinutes ?? 15} min`}` : "En attente d'un adversaire…"}</span>
              </div>

              <div className="mt-auto flex flex-col gap-2.5 pt-6">
                {isHost && (
                  <button onClick={() => sendAction({ action: "start-game" })} disabled={!oppName} style={{ opacity: oppName ? 1 : 0.5 }}>
                    <span className="block rounded-2xl py-4 text-center text-base font-bold text-[#1A0E2E]" style={{ background: "linear-gradient(180deg,#FFD23F 0%,#C48800 100%)", boxShadow: "0 14px 30px rgba(255,210,63,0.40)" }}>Lancer en multijoueur</span>
                  </button>
                )}
                <button onClick={() => setEntryMode("choose")} className="rounded-2xl border border-white/12 bg-white/[0.06] py-3 text-sm font-semibold text-white/90">Annuler la salle</button>
              </div>
              {inviteFeedback && <p className="mt-2 text-center text-xs text-[#65dfb2]">{inviteFeedback}</p>}
            </>
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
  const onlineWinnerName = state.winner === "w" ? whiteName : state.winner === "b" ? blackName : "";

  if (isFocusView) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_100%,rgba(45,236,255,0.24),transparent_34%),radial-gradient(circle_at_50%_12%,rgba(120,102,255,0.18),transparent_38%),linear-gradient(180deg,#2e2b56,#0a153c_58%,#010816)] px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)] pt-[calc(env(safe-area-inset-top,0px)+0.7rem)] font-sans sm:p-5">
        <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col">
          {/* Clocks */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
          <div className="mt-2 hidden grid-cols-2 gap-3 sm:grid">
            <CapturedPieces label={`${whiteName} a pris`} pieces={onlineCapturedBlack} />
            <CapturedPieces label={`${blackName} a pris`} pieces={onlineCapturedWhite} />
          </div>

          {/* Board */}
          <div className="mx-auto mt-3" style={focusBoardStyle}>
            <ChessBoardView
              board={board}
              selectedSquare={selected}
              onSquareClick={handleOnlineClick}
              availableTargets={selectedTargets}
              lastMove={state.lastMove ? { from: state.lastMove.from, to: state.lastMove.to } : null}
              orientation={orientation}
              inCheckSquare={onlineInCheckSquare}
              theme={boardTheme}
            />
          </div>

          {/* Status bar */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center font-sans text-xs text-white/80 sm:text-left sm:text-sm">{info}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              {state.phase === "playing" && (
                <button
                  onClick={shareSpectatorLink}
                  className="rounded-xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-4 py-2 font-sans text-xs font-semibold text-black shadow-[0_0_12px_rgba(78,207,138,0.2)] transition hover:shadow-[0_0_20px_rgba(78,207,138,0.35)]"
                >
                  Inviter des spectateurs
                </button>
              )}
              {state.phase === "playing" && myColor && (
                <button
                  onClick={() => sendAction({ action: "resign" })}
                  className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2 font-sans text-xs font-semibold text-red-300 transition hover:bg-red-500/30"
                >
                  Abandonner
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
              {onReturnToLobby && (
                <button
                  onClick={onReturnToLobby}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-sans text-xs text-white/50 transition hover:bg-white/10 hover:text-white/80"
                >
                  Menu des jeux
                </button>
              )}
            </div>
          </div>
          {inviteFeedback && (
            <p className="mt-2 font-sans text-xs text-[#65dfb2]/90">{inviteFeedback}</p>
          )}
        </div>
        {showGameOverPopup && state.phase === "game-over" && (
          <GameOverPopup
            winnerName={onlineWinnerName}
            reason={state.reason}
            isDraw={state.winner === "draw"}
            onClose={() => setShowGameOverPopup(false)}
            onReplay={() => sendAction({ action: "start-game" })}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden p-4 font-sans sm:p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(251,191,36,0.14),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%),linear-gradient(145deg,#0a0a1a,#111827)]" />

      {/* Main panel */}
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-3xl border border-white/18 bg-black/28 p-4 backdrop-blur-xl sm:p-7">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
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
            <div className="mt-3 hidden grid-cols-2 gap-3 sm:grid">
              <CapturedPieces label={`${whiteName} a pris`} pieces={onlineCapturedBlack} />
              <CapturedPieces label={`${blackName} a pris`} pieces={onlineCapturedWhite} />
            </div>
          </div>

          {/* Side info */}
          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <button
              onClick={toggleFullscreen}
              className="rounded-xl border border-white/25 bg-black/30 px-4 py-2 font-sans text-xs text-white/90 backdrop-blur-sm transition hover:bg-white/10"
            >
              {isFullscreen ? "Quitter plein ecran" : "Plein ecran"}
            </button>
            <span className="hidden font-sans text-xs text-white/40 sm:inline">{whiteName} (Blanc)</span>
            <span className="hidden font-sans text-xs text-white/40 sm:inline">{blackName} (Noir)</span>
            {state.lastMove && (
              <span className="font-mono text-xs text-white/25">
                {state.lastMove.fromSquare} → {state.lastMove.toSquare}
              </span>
            )}
          </div>
        </div>

        {/* Board */}
        <div className="mx-auto mt-4" style={normalBoardStyle}>
          <ChessBoardView
            board={board}
            selectedSquare={selected}
            onSquareClick={handleOnlineClick}
            availableTargets={selectedTargets}
            lastMove={state.lastMove ? { from: state.lastMove.from, to: state.lastMove.to } : null}
            orientation={orientation}
            inCheckSquare={onlineInCheckSquare}
            theme={boardTheme}
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
        <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
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
      {showGameOverPopup && state.phase === "game-over" && (
        <GameOverPopup
          winnerName={onlineWinnerName}
          reason={state.reason}
          isDraw={state.winner === "draw"}
          onClose={() => setShowGameOverPopup(false)}
          onReplay={() => sendAction({ action: "start-game" })}
        />
      )}
    </div>
  );
}
