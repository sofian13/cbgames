import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

type Color = "w" | "b";
type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
type BotLevel = "easy" | "medium" | "hard";
type ChessMode = "online" | "bot";
type EndReason = "checkmate" | "stalemate" | "resign" | "draw";

interface Piece {
  color: Color;
  type: PieceType;
}

interface ChessMove {
  from: number;
  to: number;
  promotion?: PieceType;
}

const BOT_PLAYER_ID = "bot-chess";
const BOT_PLAYER_NAME = "Bot Chess";

const FILES = "abcdefgh";
const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function toSquare(index: number) {
  const x = index % 8;
  const y = Math.floor(index / 8);
  return `${FILES[x]}${8 - y}`;
}

function inside(x: number, y: number) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function makeIndex(x: number, y: number) {
  return y * 8 + x;
}

function otherColor(color: Color): Color {
  return color === "w" ? "b" : "w";
}

function pieceToCode(piece: Piece | null): string | null {
  if (!piece) return null;
  return `${piece.color}${piece.type}`;
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

    if (!forAttack) {
      if (inside(x, nextY) && !board[makeIndex(x, nextY)]) {
        moves.push({ from, to: makeIndex(x, nextY) });
        const twoY = y + dir * 2;
        if (y === startRank && !board[makeIndex(x, twoY)]) {
          moves.push({ from, to: makeIndex(x, twoY) });
        }
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
    for (const [dx, dy] of jumps) {
      addIfValid(x + dx, y + dy);
    }
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
  if (piece.type === "b" || piece.type === "q") {
    dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
  }
  if (piece.type === "r" || piece.type === "q") {
    dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
  }

  for (const [dx, dy] of dirs) {
    let tx = x + dx;
    let ty = y + dy;
    while (inside(tx, ty)) {
      const to = makeIndex(tx, ty);
      const target = board[to];
      if (!target) {
        moves.push({ from, to });
      } else {
        if (target.color !== piece.color) {
          moves.push({ from, to });
        }
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

  let nextPiece = { ...piece };
  const toRank = Math.floor(move.to / 8);
  if (piece.type === "p" && (toRank === 0 || toRank === 7)) {
    nextPiece = { color: piece.color, type: move.promotion ?? "q" };
  }

  copy[move.to] = nextPiece;
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
  const moves: ChessMove[] = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.color !== color) continue;
    const pseudo = generatePseudoMoves(board, i);
    for (const move of pseudo) {
      const next = applyMove(board, move);
      if (!isInCheck(next, color)) {
        moves.push(move);
      }
    }
  }
  return moves;
}

function evaluateBoard(board: Array<Piece | null>): number {
  let score = 0;
  for (const p of board) {
    if (!p) continue;
    const value = PIECE_VALUES[p.type];
    score += p.color === "b" ? value : -value;
  }
  return score;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class ChessGame extends BaseGame {
  phase: "waiting" | "playing" | "game-over" = "waiting";
  mode: ChessMode = "online";
  botLevel: BotLevel = "medium";
  board: Array<Piece | null> = initialBoard();
  turn: Color = "w";
  whitePlayerId: string | null = null;
  blackPlayerId: string | null = null;
  winner: Color | "draw" | null = null;
  reason: EndReason | null = null;
  lastMove: ChessMove | null = null;
  botTimeout: ReturnType<typeof setTimeout> | null = null;
  moveCount = 0;

  start() {
    if (this.phase !== "waiting") return;
    this.started = true;
    this.board = initialBoard();
    this.turn = "w";
    this.winner = null;
    this.reason = null;
    this.lastMove = null;
    this.moveCount = 0;

    const ids = Array.from(this.players.keys());
    if (ids.length < 1) {
      this.sendError("Aucun joueur connecte.");
      return;
    }

    if (this.mode === "online") {
      if (ids.length < 2) {
        this.mode = "bot";
        this.whitePlayerId = ids[0];
        this.blackPlayerId = BOT_PLAYER_ID;
      } else {
        this.whitePlayerId = ids[0];
        this.blackPlayerId = ids[1];
      }
    } else {
      this.whitePlayerId = ids[0];
      this.blackPlayerId = BOT_PLAYER_ID;
    }

    this.phase = "playing";
    this.broadcastState();

    this.maybePlayBot();
  }

  maybePlayBot() {
    if (this.phase !== "playing") return;
    if (this.mode !== "bot") return;
    const botColor: Color = this.blackPlayerId === BOT_PLAYER_ID ? "b" : "w";
    if (this.turn !== botColor) return;

    if (this.botTimeout) {
      clearTimeout(this.botTimeout);
      this.botTimeout = null;
    }

    this.botTimeout = setTimeout(() => {
      if (this.phase !== "playing") return;
      const legal = generateLegalMoves(this.board, botColor);
      if (legal.length === 0) return;
      const move = this.pickBotMove(legal, botColor);
      this.applyValidatedMove(move);
    }, 250);
  }

  pickBotMove(legal: ChessMove[], botColor: Color): ChessMove {
    if (this.botLevel === "easy") {
      return randomPick(legal);
    }

    if (this.botLevel === "medium") {
      const captures = legal.filter((m) => this.board[m.to] !== null);
      if (captures.length === 0) return randomPick(legal);
      captures.sort((a, b) => {
        const pa = this.board[a.to];
        const pb = this.board[b.to];
        const va = pa ? PIECE_VALUES[pa.type] : 0;
        const vb = pb ? PIECE_VALUES[pb.type] : 0;
        return vb - va;
      });
      return captures[0];
    }

    let bestScore = -Infinity;
    let best: ChessMove[] = [];
    for (const move of legal) {
      const nextBoard = applyMove(this.board, move);
      const opp = otherColor(botColor);
      const oppMoves = generateLegalMoves(nextBoard, opp);
      let score = evaluateBoard(nextBoard);
      if (oppMoves.length === 0) {
        if (isInCheck(nextBoard, opp)) {
          score += 100000;
        } else {
          score += 0;
        }
      } else {
        let worstReply = Infinity;
        for (const reply of oppMoves) {
          const afterReply = applyMove(nextBoard, reply);
          const replyScore = evaluateBoard(afterReply);
          worstReply = Math.min(worstReply, replyScore);
        }
        score = worstReply;
      }

      if (botColor === "w") score = -score;

      if (score > bestScore) {
        bestScore = score;
        best = [move];
      } else if (score === bestScore) {
        best.push(move);
      }
    }

    return best.length > 0 ? randomPick(best) : randomPick(legal);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string | undefined;
    if (!action) return;

    const senderPlayer = this.findGamePlayerByConnection(sender.id);

    if (this.phase === "waiting") {
      if (!senderPlayer) return;
      if (action === "set-mode") {
        const mode = payload.mode as ChessMode;
        if (mode !== "online" && mode !== "bot") return;
        this.mode = mode;
        this.broadcastState();
        return;
      }
      if (action === "set-bot-level") {
        const level = payload.level as BotLevel;
        if (level !== "easy" && level !== "medium" && level !== "hard") return;
        this.botLevel = level;
        this.broadcastState();
        return;
      }
      if (action === "start-game") {
        this.start();
      }
      return;
    }

    if (this.phase !== "playing") return;
    if (!senderPlayer) return;

    if (action === "resign") {
      const color = this.getPlayerColor(senderPlayer.id);
      if (!color) return;
      this.finishGame(otherColor(color), "resign");
      return;
    }

    if (action !== "move") return;
    const from = Number(payload.from);
    const to = Number(payload.to);
    if (!Number.isInteger(from) || !Number.isInteger(to)) return;
    if (from < 0 || from > 63 || to < 0 || to > 63) return;

    const playerColor = this.getPlayerColor(senderPlayer.id);
    if (!playerColor || playerColor !== this.turn) return;

    const legal = generateLegalMoves(this.board, this.turn);
    const move = legal.find((m) => m.from === from && m.to === to);
    if (!move) return;

    this.applyValidatedMove(move);
  }

  applyValidatedMove(move: ChessMove) {
    this.board = applyMove(this.board, move);
    this.lastMove = move;
    this.moveCount += 1;
    this.turn = otherColor(this.turn);

    if (this.moveCount >= 220) {
      this.finishGame("draw", "draw");
      return;
    }

    const legalNext = generateLegalMoves(this.board, this.turn);
    if (legalNext.length === 0) {
      if (isInCheck(this.board, this.turn)) {
        this.finishGame(otherColor(this.turn), "checkmate");
      } else {
        this.finishGame("draw", "stalemate");
      }
      return;
    }

    this.broadcastState();
    this.maybePlayBot();
  }

  finishGame(winner: Color | "draw", reason: EndReason) {
    this.phase = "game-over";
    this.winner = winner;
    this.reason = reason;
    this.broadcastState();

    const rankings = this.buildRankings();
    setTimeout(() => {
      this.endGame(rankings);
    }, 2500);
  }

  buildRankings(): GameRanking[] {
    const participants = Array.from(this.players.values())
      .filter(
        (p) => p.id === this.whitePlayerId || p.id === this.blackPlayerId
      );

    if (participants.length === 0) return [];

    if (this.winner === "draw") {
      return participants.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        rank: 1,
        score: 50,
      }));
    }

    if (this.winner === "w" || this.winner === "b") {
      return participants.map((p) => {
        const color = this.getPlayerColor(p.id);
        const won = color === this.winner;
        return {
          playerId: p.id,
          playerName: p.name,
          rank: won ? 1 : 2,
          score: won ? 100 : 0,
        };
      });
    }

    return participants.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      rank: 1,
      score: 0,
    }));
  }

  getPlayerColor(playerId: string): Color | null {
    if (playerId === this.whitePlayerId) return "w";
    if (playerId === this.blackPlayerId) return "b";
    return null;
  }

  getDisplayPlayers() {
    const list: Array<{ id: string; name: string; color: Color }> = [];
    if (this.whitePlayerId) {
      const p = this.players.get(this.whitePlayerId);
      list.push({
        id: this.whitePlayerId,
        name: p?.name ?? "Blanc",
        color: "w",
      });
    }
    if (this.blackPlayerId) {
      if (this.blackPlayerId === BOT_PLAYER_ID) {
        list.push({ id: BOT_PLAYER_ID, name: BOT_PLAYER_NAME, color: "b" });
      } else {
        const p = this.players.get(this.blackPlayerId);
        list.push({
          id: this.blackPlayerId,
          name: p?.name ?? "Noir",
          color: "b",
        });
      }
    }
    return list;
  }

  getStateForPlayer(playerId: string): Record<string, unknown> {
    const legalMoves = this.phase === "playing"
      ? generateLegalMoves(this.board, this.turn).map((m) => ({
          from: m.from,
          to: m.to,
        }))
      : [];

    const myColor = this.getPlayerColor(playerId);
    const inCheckNow = this.phase === "playing" ? isInCheck(this.board, this.turn) : false;

    return {
      phase: this.phase,
      mode: this.mode,
      botLevel: this.botLevel,
      board: this.board.map(pieceToCode),
      turn: this.turn,
      winner: this.winner,
      reason: this.reason,
      lastMove: this.lastMove
        ? {
            from: this.lastMove.from,
            to: this.lastMove.to,
            fromSquare: toSquare(this.lastMove.from),
            toSquare: toSquare(this.lastMove.to),
          }
        : null,
      whitePlayerId: this.whitePlayerId,
      blackPlayerId: this.blackPlayerId,
      players: this.getDisplayPlayers(),
      connectedPlayers: Array.from(this.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
      })),
      myColor,
      inCheck: inCheckNow,
      legalMoves,
    };
  }

  getState(): Record<string, unknown> {
    return this.getStateForPlayer("");
  }

  broadcastState() {
    for (const [playerId, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(playerId),
      });
    }
  }

  sendError(message: string) {
    this.broadcast({
      type: "game-error",
      payload: { message },
    });
  }

  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  cleanup() {
    if (this.botTimeout) {
      clearTimeout(this.botTimeout);
      this.botTimeout = null;
    }
  }
}
