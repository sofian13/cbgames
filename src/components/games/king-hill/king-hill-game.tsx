"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

interface KHPlayer { id: string; name: string; score: number; energy: number; isKing: boolean; hasActed: boolean; }
interface KHState {
  status: "waiting" | "action" | "result" | "game-over";
  round: number; totalRounds: number; timeLeft: number;
  players: KHPlayer[]; roundLog: string[];
}

const ACTIONS = {
  attack: { emoji: "\u2694\uFE0F", label: "Attaquer", desc: "Attaque le roi (-1 \u00E9nergie)" },
  defend: { emoji: "\uD83D\uDEE1\uFE0F", label: "D\u00E9fendre", desc: "Bloque les attaques ce tour" },
  steal: { emoji: "\uD83D\uDCB0", label: "Voler", desc: "Vole des points au roi" },
  charge: { emoji: "\u26A1", label: "Charger", desc: "+1 \u00E9nergie" },
} as const;

const KING_ACTIONS = {
  defend: { emoji: "\uD83D\uDEE1\uFE0F", label: "D\u00E9fendre", desc: "Bloque attaques et vols" },
  charge: { emoji: "\u26A1", label: "Charger", desc: "+1 \u00E9nergie" },
} as const;

export default function KingHillGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "king-hill", playerId, playerName);
  const { gameState } = useGameStore();
  const [acted, setActed] = useState(false);
  const prevRoundRef = useRef(0);
  const state = gameState as unknown as KHState;

  useEffect(() => {
    if (state?.round !== prevRoundRef.current) {
      prevRoundRef.current = state?.round ?? 0;
      setActed(false);
    }
  }, [state?.round]);

  const handleAction = useCallback((choice: string) => {
    if (acted) return;
    setActed(true);
    sendAction({ action: "choose", choice });
  }, [acted, sendAction]);

  if (!state || state.status === "waiting") return (
    <div className="flex flex-1 items-center justify-center min-h-screen"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(6,182,212,0.12), transparent 50%), #060606" }}>
      <p className="text-3xl text-white/40 animate-pulse font-sans font-semibold tracking-wide">En attente...</p>
    </div>
  );

  const me = state.players?.find(p => p.id === playerId);
  const king = state.players?.find(p => p.isKing);

  if (state.status === "action") {
    const isKing = me?.isKing;
    const availableActions = isKing ? KING_ACTIONS : ACTIONS;

    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-screen"
        style={{ background: isKing
          ? "radial-gradient(circle at 50% 25%, rgba(6,182,212,0.18), transparent 40%), radial-gradient(circle at 50% 80%, rgba(6,182,212,0.06), transparent 40%), #060606"
          : "radial-gradient(circle at 50% 25%, rgba(245,158,11,0.14), transparent 40%), radial-gradient(circle at 50% 80%, rgba(6,182,212,0.06), transparent 40%), #060606"
        }}>
        <div className="w-full max-w-md space-y-6">
          {/* Round header */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em]">
              Round {state.round}/{state.totalRounds}
            </span>
            <span className={cn(
              "text-lg font-mono font-semibold",
              state.timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white/90"
            )}>
              {state.timeLeft}s
            </span>
          </div>

          {/* King banner */}
          <div className="rounded-3xl border border-cyan-400/25 bg-black/30 backdrop-blur-sm p-5 text-center"
            style={{ boxShadow: "0 0 20px rgba(6,182,212,0.15)" }}>
            <span className="text-5xl block mb-2">{"\uD83D\uDC51"}</span>
            <p className="text-xl font-serif text-white/90 font-semibold">{king?.name} est le Roi</p>
            <p className="text-sm text-cyan-300/50 font-mono mt-1">{king?.score} pts</p>
          </div>

          {isKing && (
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/5 backdrop-blur-sm px-4 py-3 text-center">
              <p className="text-sm text-cyan-300/70 font-sans font-semibold">
                Tu es le Roi ! +10 pts/tour. D&eacute;fends-toi !
              </p>
            </div>
          )}

          {/* My stats */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-sans uppercase tracking-wider">&Eacute;nergie</span>
              <span className="text-lg font-mono">{"\u26A1".repeat(me?.energy ?? 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-sans uppercase tracking-wider">Score</span>
              <span className="text-xl font-mono font-semibold text-white/90">{me?.score ?? 0}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(availableActions).map(([key, act]) => {
              const disabled = acted || (key === "attack" && (me?.energy ?? 0) < 1);
              return (
                <button key={key} onClick={() => handleAction(key)} disabled={disabled}
                  className={cn(
                    "rounded-3xl border p-5 text-center transition-all duration-200",
                    disabled
                      ? "border-white/[0.06] bg-black/20 text-white/20 cursor-not-allowed"
                      : "border-white/25 bg-black/30 backdrop-blur-sm text-white/90 hover:bg-white/[0.08] hover:border-white/40 active:scale-95"
                  )}
                  style={!disabled ? { boxShadow: "0 0 20px rgba(255,255,255,0.04)" } : undefined}>
                  <span className="text-3xl block mb-2">{act.emoji}</span>
                  <span className="text-base font-sans font-semibold block">{act.label}</span>
                  <span className="text-xs text-white/40 font-sans mt-1 block">{act.desc}</span>
                </button>
              );
            })}
          </div>

          {acted && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 backdrop-blur-sm py-3 text-center"
              style={{ boxShadow: "0 0 15px rgba(52,211,153,0.08)" }}>
              <p className="text-sm text-emerald-300/70 font-sans font-semibold">Action choisie</p>
            </div>
          )}

          {/* Player status */}
          <div className="flex gap-2 flex-wrap justify-center">
            {state.players.map(p => (
              <span key={p.id} className={cn(
                "text-xs font-sans font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all",
                p.isKing
                  ? "text-cyan-300/90 bg-cyan-500/10 border-cyan-400/25"
                  : p.hasActed
                    ? "text-emerald-300/70 bg-emerald-500/10 border-emerald-400/20"
                    : "text-white/25 bg-white/[0.03] border-white/[0.08]"
              )}>
                {p.isKing ? "\uD83D\uDC51 " : ""}{p.name} {p.hasActed ? "\u2713" : "..."}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "result") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 min-h-screen"
        style={{ background: "radial-gradient(circle at 50% 25%, rgba(6,182,212,0.15), transparent 40%), radial-gradient(circle at 50% 85%, rgba(245,158,11,0.08), transparent 40%), #060606" }}>
        <div className="w-full max-w-md space-y-5">
          {/* King banner */}
          <div className="rounded-3xl border border-cyan-400/25 bg-black/30 backdrop-blur-sm p-5 text-center"
            style={{ boxShadow: "0 0 20px rgba(6,182,212,0.15)" }}>
            <span className="text-4xl block mb-2">{"\uD83D\uDC51"}</span>
            <p className="text-xl font-serif text-white/90 font-semibold">{king?.name} est le Roi</p>
          </div>

          {/* Round log */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-5 space-y-2">
            <p className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-3 text-center">
              R&eacute;sum&eacute; du round
            </p>
            {state.roundLog.map((log, i) => (
              <p key={i} className="text-sm text-white/60 font-sans text-center leading-relaxed">{log}</p>
            ))}
          </div>

          {/* Scoreboard */}
          <div className="space-y-2">
            {[...state.players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className={cn(
                "flex items-center justify-between rounded-2xl border p-4 backdrop-blur-sm transition-all",
                p.isKing
                  ? "border-cyan-400/25 bg-black/30"
                  : "border-white/[0.1] bg-black/20"
              )}
              style={p.isKing ? { boxShadow: "0 0 15px rgba(6,182,212,0.1)" } :
                     i === 0 && !p.isKing ? { boxShadow: "0 0 12px rgba(245,158,11,0.08)" } : undefined}>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-lg font-mono font-semibold w-7 text-center",
                    i === 0 ? "text-amber-400/80" : i === 1 ? "text-white/50" : "text-white/25"
                  )}>{i + 1}</span>
                  {p.isKing && <span className="text-lg">{"\uD83D\uDC51"}</span>}
                  <span className={cn(
                    "text-base font-sans font-semibold",
                    p.id === playerId ? "text-white/90" : "text-white/70"
                  )}>{p.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/25 font-mono">{"\u26A1".repeat(p.energy)}</span>
                  <span className="text-xl font-mono font-semibold text-white/90">{p.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(6,182,212,0.12), transparent 50%), #060606" }}>
      <p className="text-3xl text-white/40 animate-pulse font-sans font-semibold tracking-wide">Chargement...</p>
    </div>
  );
}
