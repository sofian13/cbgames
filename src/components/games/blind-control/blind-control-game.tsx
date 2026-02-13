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

  if (!state || state.status === "waiting") return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">En attente...</p></div>;

  if (state.status === "moving") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/20 font-sans uppercase tracking-wider">Tour {state.round}/{state.totalRounds}</span>
            <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
          </div>

          {/* Mini grid 3x3 */}
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-1">
              {[-1, 0, 1].map(dy =>
                [-1, 0, 1].map(dx => {
                  const cell = state.visibleCells.find(c => c.x === state.charPos.x + dx && c.y === state.charPos.y + dy);
                  const isCenter = dx === 0 && dy === 0;
                  return (
                    <div key={`${dx}-${dy}`}
                      className={cn("w-16 h-16 rounded-lg border flex items-center justify-center text-2xl",
                        isCenter ? "border-ember/50 bg-ember/10" : "border-white/[0.08] bg-white/[0.03]")}>
                      {isCenter ? "🤖" : cell ? CELL_EMOJI[cell.type] : "?"}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <p className="text-center text-xs text-white/30 font-sans">
            Position : ({state.charPos.x}, {state.charPos.y}) sur {state.gridSize}x{state.gridSize}
          </p>

          {/* Direction buttons */}
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
            <div />
            <button onClick={() => handleMove("up")} disabled={submitted}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-center text-xl hover:border-ember/40 hover:bg-ember/5 active:scale-90 transition-all disabled:opacity-30">
              ⬆️
            </button>
            <div />
            <button onClick={() => handleMove("left")} disabled={submitted}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-center text-xl hover:border-ember/40 hover:bg-ember/5 active:scale-90 transition-all disabled:opacity-30">
              ⬅️
            </button>
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 text-center text-xl text-white/20">
              🤖
            </div>
            <button onClick={() => handleMove("right")} disabled={submitted}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-center text-xl hover:border-ember/40 hover:bg-ember/5 active:scale-90 transition-all disabled:opacity-30">
              ➡️
            </button>
            <div />
            <button onClick={() => handleMove("down")} disabled={submitted}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-center text-xl hover:border-ember/40 hover:bg-ember/5 active:scale-90 transition-all disabled:opacity-30">
              ⬇️
            </button>
            <div />
          </div>

          {submitted && <p className="text-xs text-white/20 text-center font-sans">Direction choisie</p>}

          <div className="flex gap-2 flex-wrap justify-center">
            {state.players.map(p => (
              <span key={p.id} className={cn("text-xs font-sans px-2 py-1 rounded", p.hasSubmitted ? "text-ember/60 bg-ember/5" : "text-white/20")}>
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
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md text-center space-y-4">
          <span className="text-5xl">
            {r.cell === "coin" ? "🪙" : r.cell === "bonus" ? "⭐" : r.cell === "trap" ? "💀" : "·"}
          </span>
          <p className="text-sm text-white/60 font-sans">
            Le groupe a voté {DIR_LABELS[r.direction]?.emoji} {DIR_LABELS[r.direction]?.label}
          </p>
          <p className={cn("text-2xl font-mono font-bold", r.scoreChange > 0 ? "text-emerald-400" : r.scoreChange < 0 ? "text-red-400" : "text-white/40")}>
            {r.scoreChange > 0 ? "+" : ""}{r.scoreChange} pts
          </p>
          <div className="flex gap-3 flex-wrap justify-center mt-4">
            {state.players.map(p => (
              <div key={p.id} className="text-center px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03]">
                <span className="text-xs font-sans text-white/60 block">{p.name}</span>
                <p className="text-sm font-mono text-ember">{p.score}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">Chargement...</p></div>;
}
