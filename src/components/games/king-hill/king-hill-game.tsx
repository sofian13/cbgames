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
  attack: { emoji: "⚔️", label: "Attaquer", desc: "Attaque le roi (-1 énergie)" },
  defend: { emoji: "🛡️", label: "Défendre", desc: "Bloque les attaques ce tour" },
  steal: { emoji: "💰", label: "Voler", desc: "Vole des points au roi" },
  charge: { emoji: "⚡", label: "Charger", desc: "+1 énergie" },
} as const;

const KING_ACTIONS = {
  defend: { emoji: "🛡️", label: "Défendre", desc: "Bloque attaques et vols" },
  charge: { emoji: "⚡", label: "Charger", desc: "+1 énergie" },
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

  if (!state || state.status === "waiting") return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">En attente...</p></div>;

  const me = state.players?.find(p => p.id === playerId);
  const king = state.players?.find(p => p.isKing);

  if (state.status === "action") {
    const isKing = me?.isKing;
    const availableActions = isKing ? KING_ACTIONS : ACTIONS;

    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/20 font-sans uppercase tracking-wider">Round {state.round}/{state.totalRounds}</span>
            <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
          </div>

          {/* King banner */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <span className="text-3xl">👑</span>
            <p className="text-sm font-serif text-amber-200/80">{king?.name} est le Roi</p>
            <p className="text-xs text-amber-200/40 font-mono">{king?.score} pts</p>
          </div>

          {isKing && (
            <p className="text-xs text-amber-400/60 text-center font-sans">Tu es le Roi ! +10 pts/tour. Défends-toi !</p>
          )}

          {/* My stats */}
          <div className="flex items-center justify-center gap-4">
            <span className="text-xs text-white/30 font-sans">Énergie :</span>
            <span className="text-sm font-mono text-ember">{"⚡".repeat(me?.energy ?? 0)}</span>
            <span className="text-xs text-white/30 font-sans">Score : {me?.score ?? 0}</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(availableActions).map(([key, act]) => {
              const disabled = acted || (key === "attack" && (me?.energy ?? 0) < 1);
              return (
                <button key={key} onClick={() => handleAction(key)} disabled={disabled}
                  className={cn("rounded-xl border p-4 text-center transition-all",
                    disabled ? "border-white/[0.04] text-white/20" :
                    "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-ember/40 hover:bg-ember/5 active:scale-95")}>
                  <span className="text-2xl block mb-1">{act.emoji}</span>
                  <span className="text-sm font-sans block">{act.label}</span>
                  <span className="text-[10px] text-white/30 font-sans">{act.desc}</span>
                </button>
              );
            })}
          </div>

          {acted && <p className="text-xs text-white/20 text-center font-sans">Action choisie</p>}

          {/* Player status */}
          <div className="flex gap-2 flex-wrap justify-center">
            {state.players.map(p => (
              <span key={p.id} className={cn("text-xs font-sans px-2 py-1 rounded",
                p.isKing ? "text-amber-400/80 bg-amber-500/10" :
                p.hasActed ? "text-ember/60 bg-ember/5" : "text-white/20")}>
                {p.isKing ? "👑" : ""} {p.name} {p.hasActed ? "✓" : "..."}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "result") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
            <span className="text-2xl">👑</span>
            <p className="text-sm font-serif text-amber-200/80">{king?.name} est le Roi</p>
          </div>

          {/* Round log */}
          <div className="space-y-1">
            {state.roundLog.map((log, i) => (
              <p key={i} className="text-xs text-white/50 font-sans text-center">{log}</p>
            ))}
          </div>

          {/* Scoreboard */}
          <div className="space-y-2">
            {[...state.players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className={cn("flex items-center justify-between rounded-lg border p-3",
                p.isKing ? "border-amber-500/20 bg-amber-500/5" : "border-white/[0.06] bg-white/[0.03]")}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30 font-mono w-4">{i + 1}</span>
                  {p.isKing && <span>👑</span>}
                  <span className="text-sm text-white/70 font-sans">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/20 font-mono">{"⚡".repeat(p.energy)}</span>
                  <span className="text-sm font-mono text-ember">{p.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">Chargement...</p></div>;
}
