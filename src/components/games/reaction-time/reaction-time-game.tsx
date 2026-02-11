"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type { ReactionTimeState, ReactionTimePlayer, ReactionRoundResult } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

export default function ReactionTimeGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "reaction-time", playerId, playerName);
  const { gameState, error } = useGameStore();
  const [tooEarly, setTooEarly] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const prevRoundRef = useRef(0);

  const state = gameState as unknown as ReactionTimeState;

  // Reset click state when round changes to red phase
  useEffect(() => {
    if (state?.status === "red" && state.round !== prevRoundRef.current) {
      prevRoundRef.current = state.round;
      setHasClicked(false);
      setTooEarly(false);
    }
  }, [state?.status, state?.round]);

  const handleClick = useCallback(() => {
    if (hasClicked) return;

    if (state?.status === "red") {
      setTooEarly(true);
      setHasClicked(true);
      sendAction({ action: "click" });
      setTimeout(() => setTooEarly(false), 1500);
    } else if (state?.status === "green") {
      setHasClicked(true);
      sendAction({ action: "click" });
    }
  }, [state?.status, hasClicked, sendAction]);

  if (!state || state.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-white/40 animate-pulse font-sans">En attente des joueurs...</p>
      </div>
    );
  }

  const me = state.players?.find((p: ReactionTimePlayer) => p.id === playerId);

  // RED phase
  if (state.status === "red") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center cursor-pointer select-none relative"
        onClick={handleClick}
        style={{
          background: "radial-gradient(ellipse at center, rgba(180,20,20,0.15) 0%, #060606 70%)",
        }}
      >
        <div className="text-center">
          <span className="text-xs text-white/20 font-sans uppercase tracking-wider">
            Manche {state.round} / {state.totalRounds}
          </span>
          <h2 className="text-5xl font-serif font-light text-red-400/80 mt-4 mb-4"
            style={{ textShadow: "0 0 40px rgba(220,38,38,0.3)" }}>
            Attends...
          </h2>
          <p className="text-sm text-white/20 font-sans">Ne clique pas encore !</p>
        </div>
        {tooEarly && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/50 z-20">
            <p className="text-2xl font-serif text-red-400">Trop tôt ! +500ms</p>
          </div>
        )}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {state.players?.map((p: ReactionTimePlayer) => (
            <div key={p.id} className="text-center">
              <span className="text-xs text-white/30 font-sans">{p.name}</span>
              <p className="text-sm text-ember font-mono">{p.totalScore}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // GREEN phase
  if (state.status === "green") {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center select-none relative",
          hasClicked ? "cursor-default" : "cursor-pointer"
        )}
        onClick={handleClick}
        style={{
          background: hasClicked
            ? "radial-gradient(ellipse at center, rgba(20,100,20,0.1) 0%, #060606 70%)"
            : "radial-gradient(ellipse at center, rgba(20,180,20,0.2) 0%, #060606 70%)",
        }}
      >
        <div className="text-center">
          {hasClicked ? (
            <>
              <h2 className="text-4xl font-serif font-light text-emerald-400/60 mb-2">
                {me?.roundTime != null ? `${me.roundTime}ms` : "Cliqué !"}
              </h2>
              <p className="text-sm text-white/20 font-sans">En attente des autres...</p>
            </>
          ) : (
            <>
              <h2
                className="text-6xl font-serif font-bold text-emerald-400 animate-pulse"
                style={{ textShadow: "0 0 60px rgba(34,197,94,0.4), 0 0 120px rgba(34,197,94,0.2)" }}
              >
                CLIQUE !
              </h2>
              <p className="text-sm text-emerald-300/40 font-sans mt-2">Le plus vite possible !</p>
            </>
          )}
        </div>
        {me?.penalty && (
          <p className="text-sm text-red-400 mt-4 font-sans">+500ms de pénalité (clic trop tôt)</p>
        )}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {state.players?.map((p: ReactionTimePlayer) => (
            <div key={p.id} className="text-center">
              <span className={cn("text-xs font-sans", p.clicked ? "text-emerald-400/60" : "text-white/30")}>
                {p.name}
              </span>
              <p className="text-sm text-ember font-mono">{p.totalScore}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // RESULTS phase
  if (state.status === "results") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <span className="text-xs text-white/20 font-sans uppercase tracking-wider mb-2">
          Résultats — Manche {state.round} / {state.totalRounds}
        </span>
        <div className="w-full max-w-md space-y-2 mt-4">
          {state.roundResults?.map((r: ReactionRoundResult, i: number) => {
            const player = state.players?.find((p: ReactionTimePlayer) => p.id === r.playerId);
            return (
              <div
                key={r.playerId}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 backdrop-blur-sm",
                  i === 0 && r.time < 9999 ? "border-ember/30 bg-ember/5" : "border-white/[0.06] bg-white/[0.03]"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono text-white/30 w-6">#{i + 1}</span>
                  <span className="text-sm font-sans text-white/80">
                    {player?.name ?? "?"}
                    {r.playerId === playerId && " (toi)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {r.penalty && <span className="text-[10px] text-red-400 font-sans">+500ms</span>}
                  <span className={cn(
                    "text-sm font-mono",
                    r.time >= 9999 ? "text-white/20" : i === 0 ? "text-ember" : "text-white/60"
                  )}>
                    {r.time >= 9999 ? "—" : `${r.time}ms`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex gap-4">
          {state.players
            ?.slice()
            .sort((a: ReactionTimePlayer, b: ReactionTimePlayer) => b.totalScore - a.totalScore)
            .map((p: ReactionTimePlayer) => (
              <div key={p.id} className="text-center">
                <span className="text-xs text-white/30 font-sans">{p.name}</span>
                <p className="text-lg text-ember font-mono font-bold">{p.totalScore}</p>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex flex-1 items-center justify-center">
      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
    </div>
  );
}
