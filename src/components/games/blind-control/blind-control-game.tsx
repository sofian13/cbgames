"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

interface BCPlayer { id: string; name: string; score: number; hasSubmitted: boolean; }
interface VisibleCell { x: number; y: number; type: string; }
interface BCState {
  status: "waiting" | "moving" | "result" | "game-over";
  round: number; totalRounds: number; gridSize: number;
  charPos: { x: number; y: number }; visibleCells: VisibleCell[];
  lastResult: { direction: string; cell: string; scoreChange: number } | null;
  timeLeft: number; players: BCPlayer[];
}

const DIR_LABELS: Record<string, { emoji: string; label: string }> = {
  up: { emoji: "⬆️", label: "Haut" },
  down: { emoji: "⬇️", label: "Bas" },
  left: { emoji: "⬅️", label: "Gauche" },
  right: { emoji: "➡️", label: "Droite" },
};

const CELL_EMOJI: Record<string, string> = { empty: "·", coin: "🪙", trap: "💀", bonus: "⭐" };

export default function BlindControlGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "blind-control", playerId, playerName);
  const { gameState } = useGameStore();
  const [submitted, setSubmitted] = useState(false);
  const prevRoundRef = useRef(0);
  const state = gameState as unknown as BCState;

  useEffect(() => {
    if (state?.round !== prevRoundRef.current) {
      prevRoundRef.current = state?.round ?? 0;
      setSubmitted(false);
    }
  }, [state?.round]);

  const handleMove = useCallback((dir: string) => {
    if (submitted) return;
    setSubmitted(true);
    sendAction({ action: "move", direction: dir });
  }, [submitted, sendAction]);

  if (!state || state.status === "waiting") return (
    <div
      className="flex flex-1 items-center justify-center min-h-screen"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.12), transparent 40%), #060606" }}
    >
      <p className="text-3xl text-white/40 animate-pulse font-serif">En attente...</p>
    </div>
  );

  if (state.status === "moving") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-4 min-h-screen"
        style={{ background: "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(78,207,138,0.08), transparent 35%), #060606" }}
      >
        <div className="w-full max-w-md space-y-6">
          {/* Round & Timer header */}
          <div className="flex justify-between items-center rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-5 py-3">
            <span className="text-sm text-white/40 font-sans uppercase tracking-widest">
              Tour <span className="font-mono text-white/90">{state.round}</span>
              <span className="text-white/25"> / {state.totalRounds}</span>
            </span>
            <span
              className={cn(
                "text-xl font-mono font-semibold",
                state.timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-ember"
              )}
              style={state.timeLeft > 5 ? { textShadow: "0 0 12px rgba(80,216,255,0.4)" } : { textShadow: "0 0 12px rgba(248,113,113,0.5)" }}
            >
              {state.timeLeft}s
            </span>
          </div>

          {/* Mini grid 3x3 */}
          <div className="flex justify-center">
            <div
              className="grid grid-cols-3 gap-1.5 p-4 rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm"
              style={{ boxShadow: "0 0 30px rgba(80,216,255,0.08)" }}
            >
              {[-1, 0, 1].map(dy =>
                [-1, 0, 1].map(dx => {
                  const cell = state.visibleCells.find(c => c.x === state.charPos.x + dx && c.y === state.charPos.y + dy);
                  const isCenter = dx === 0 && dy === 0;
                  return (
                    <div key={`${dx}-${dy}`}
                      className={cn(
                        "w-[4.5rem] h-[4.5rem] rounded-2xl border flex items-center justify-center text-2xl transition-all duration-300",
                        isCenter
                          ? "border-ember/50 bg-ember/10 shadow-[0_0_20px_rgba(80,216,255,0.25)]"
                          : "border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.06]"
                      )}
                    >
                      {isCenter ? "🤖" : cell ? CELL_EMOJI[cell.type] : <span className="text-white/25 font-mono text-lg">?</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <p className="text-center text-sm text-white/25 font-mono tracking-wide">
            ({state.charPos.x}, {state.charPos.y}) <span className="text-white/40 font-sans">sur</span> {state.gridSize}×{state.gridSize}
          </p>

          {/* Direction buttons */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto">
            <div />
            <button onClick={() => handleMove("up")} disabled={submitted}
              className={cn(
                "rounded-2xl border p-3.5 text-center text-xl transition-all duration-200 active:scale-90",
                submitted
                  ? "border-white/[0.06] bg-white/[0.02] opacity-30 cursor-not-allowed"
                  : "border-white/[0.15] bg-white/[0.05] hover:border-[#65dfb2]/50 hover:bg-[#65dfb2]/10 hover:shadow-[0_0_15px_rgba(101,223,178,0.15)]"
              )}>
              ⬆️
            </button>
            <div />
            <button onClick={() => handleMove("left")} disabled={submitted}
              className={cn(
                "rounded-2xl border p-3.5 text-center text-xl transition-all duration-200 active:scale-90",
                submitted
                  ? "border-white/[0.06] bg-white/[0.02] opacity-30 cursor-not-allowed"
                  : "border-white/[0.15] bg-white/[0.05] hover:border-[#65dfb2]/50 hover:bg-[#65dfb2]/10 hover:shadow-[0_0_15px_rgba(101,223,178,0.15)]"
              )}>
              ⬅️
            </button>
            <div
              className="rounded-2xl border border-ember/20 bg-ember/5 p-3.5 text-center text-xl text-white/25"
              style={{ boxShadow: "0 0 10px rgba(80,216,255,0.08)" }}
            >
              🤖
            </div>
            <button onClick={() => handleMove("right")} disabled={submitted}
              className={cn(
                "rounded-2xl border p-3.5 text-center text-xl transition-all duration-200 active:scale-90",
                submitted
                  ? "border-white/[0.06] bg-white/[0.02] opacity-30 cursor-not-allowed"
                  : "border-white/[0.15] bg-white/[0.05] hover:border-[#65dfb2]/50 hover:bg-[#65dfb2]/10 hover:shadow-[0_0_15px_rgba(101,223,178,0.15)]"
              )}>
              ➡️
            </button>
            <div />
            <button onClick={() => handleMove("down")} disabled={submitted}
              className={cn(
                "rounded-2xl border p-3.5 text-center text-xl transition-all duration-200 active:scale-90",
                submitted
                  ? "border-white/[0.06] bg-white/[0.02] opacity-30 cursor-not-allowed"
                  : "border-white/[0.15] bg-white/[0.05] hover:border-[#65dfb2]/50 hover:bg-[#65dfb2]/10 hover:shadow-[0_0_15px_rgba(101,223,178,0.15)]"
              )}>
              ⬇️
            </button>
            <div />
          </div>

          {submitted && (
            <p
              className="text-sm text-white/40 text-center font-sans"
              style={{ textShadow: "0 0 8px rgba(101,223,178,0.3)" }}
            >
              Direction choisie
            </p>
          )}

          {/* Player status pills */}
          <div className="flex gap-2 flex-wrap justify-center">
            {state.players.map(p => (
              <span key={p.id}
                className={cn(
                  "text-xs font-sans px-3 py-1.5 rounded-full border transition-all duration-300",
                  p.hasSubmitted
                    ? "text-[#65dfb2]/80 bg-[#65dfb2]/10 border-[#65dfb2]/20 shadow-[0_0_10px_rgba(101,223,178,0.1)]"
                    : "text-white/25 bg-white/[0.03] border-white/[0.08]"
                )}
              >
                {p.name} {p.hasSubmitted ? "✓" : "..."}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "result" && state.lastResult) {
    const r = state.lastResult;
    const resultColor = r.scoreChange > 0
      ? { bg: "rgba(101,223,178,0.15)", glow: "rgba(101,223,178,0.25)" }
      : r.scoreChange < 0
        ? { bg: "rgba(248,113,113,0.12)", glow: "rgba(248,113,113,0.2)" }
        : { bg: "rgba(80,216,255,0.08)", glow: "rgba(80,216,255,0.1)" };

    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 min-h-screen"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${resultColor.bg}, transparent 45%), radial-gradient(circle at 50% 25%, rgba(80,216,255,0.08), transparent 40%), #060606`
        }}
      >
        <div className="w-full max-w-md text-center space-y-6">
          {/* Result icon */}
          <div
            className="text-6xl mx-auto w-28 h-28 flex items-center justify-center rounded-full border border-white/25 bg-black/30 backdrop-blur-sm"
            style={{ boxShadow: `0 0 40px ${resultColor.glow}` }}
          >
            {r.cell === "coin" ? "🪙" : r.cell === "bonus" ? "⭐" : r.cell === "trap" ? "💀" : "·"}
          </div>

          {/* Direction voted */}
          <p className="text-lg text-white/40 font-sans">
            Le groupe a vote <span className="text-white/90 font-semibold">{DIR_LABELS[r.direction]?.emoji} {DIR_LABELS[r.direction]?.label}</span>
          </p>

          {/* Score change */}
          <p
            className={cn(
              "text-5xl font-mono font-semibold",
              r.scoreChange > 0 ? "text-[#65dfb2]" : r.scoreChange < 0 ? "text-red-400" : "text-white/40"
            )}
            style={{
              textShadow: r.scoreChange > 0
                ? "0 0 20px rgba(101,223,178,0.4)"
                : r.scoreChange < 0
                  ? "0 0 20px rgba(248,113,113,0.4)"
                  : "none"
            }}
          >
            {r.scoreChange > 0 ? "+" : ""}{r.scoreChange} pts
          </p>

          {/* Player scores */}
          <div className="flex gap-3 flex-wrap justify-center mt-4">
            {state.players.map(p => (
              <div key={p.id}
                className="text-center px-4 py-3 rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm"
                style={{ boxShadow: "0 0 15px rgba(80,216,255,0.06)" }}
              >
                <span className="text-xs font-sans text-white/40 block mb-1">{p.name}</span>
                <p
                  className="text-lg font-mono font-semibold text-white/90"
                  style={{ textShadow: "0 0 8px rgba(80,216,255,0.3)" }}
                >
                  {p.score}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 items-center justify-center min-h-screen"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.1), transparent 40%), #060606" }}
    >
      <p className="text-3xl text-white/40 animate-pulse font-serif">Chargement...</p>
    </div>
  );
}
