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
      <div
        className="flex flex-1 items-center justify-center"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(120, 80, 200, 0.15), transparent 60%), #060606",
        }}
      >
        <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-10 py-8 text-center"
          style={{ boxShadow: "0 0 40px rgba(120, 80, 200, 0.1)" }}>
          <p className="text-xl text-white/40 animate-pulse font-sans">En attente des joueurs...</p>
        </div>
      </div>
    );
  }

  const me = state.players?.find((p: ReactionTimePlayer) => p.id === playerId);

  // RED phase
  if (state.status === "red") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center cursor-pointer select-none relative overflow-hidden"
        onClick={handleClick}
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(220, 38, 38, 0.2), transparent 50%), radial-gradient(circle at 50% 75%, rgba(180, 20, 20, 0.1), transparent 40%), #060606",
        }}
      >
        {/* Subtle animated ring */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full border border-red-500/10 animate-pulse"
          style={{ boxShadow: "0 0 80px rgba(220, 38, 38, 0.08), inset 0 0 80px rgba(220, 38, 38, 0.05)" }}
        />

        <div className="text-center z-10">
          <span className="text-xs text-white/25 font-sans uppercase tracking-[0.25em]">
            Manche {state.round} / {state.totalRounds}
          </span>
          <h2
            className="text-5xl font-serif font-light text-red-400/80 mt-6 mb-4"
            style={{ textShadow: "0 0 40px rgba(220, 38, 38, 0.35), 0 0 80px rgba(220, 38, 38, 0.15)" }}
          >
            Attends...
          </h2>
          <p className="text-sm text-white/20 font-sans tracking-wide">Ne clique pas encore !</p>
        </div>

        {tooEarly && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(127, 29, 29, 0.7), rgba(6, 6, 6, 0.85) 70%)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div className="rounded-3xl border border-red-500/30 bg-black/40 backdrop-blur-sm px-10 py-8 text-center"
              style={{ boxShadow: "0 0 30px rgba(220, 38, 38, 0.25)" }}>
              <p className="text-3xl font-serif text-red-400" style={{ textShadow: "0 0 20px rgba(220, 38, 38, 0.4)" }}>
                Trop tot !
              </p>
              <p className="text-lg text-red-400/60 font-mono mt-2">+500ms</p>
            </div>
          </div>
        )}

        {/* Player scores bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex gap-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm px-5 py-3"
            style={{ boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)" }}>
            {state.players?.map((p: ReactionTimePlayer) => (
              <div key={p.id} className="text-center px-2">
                <span className="text-xs text-white/30 font-sans block">{p.name}</span>
                <p className="text-sm text-amber-400/80 font-mono font-semibold mt-0.5">{p.totalScore}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // GREEN phase
  if (state.status === "green") {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center select-none relative overflow-hidden",
          hasClicked ? "cursor-default" : "cursor-pointer"
        )}
        onClick={handleClick}
        style={{
          background: hasClicked
            ? "radial-gradient(circle at 50% 25%, rgba(20, 120, 60, 0.12), transparent 50%), #060606"
            : "radial-gradient(circle at 50% 25%, rgba(34, 197, 94, 0.25), transparent 45%), radial-gradient(circle at 50% 75%, rgba(20, 180, 80, 0.12), transparent 40%), #060606",
        }}
      >
        {/* Glowing ring for active state */}
        {!hasClicked && (
          <div
            className="absolute w-[450px] h-[450px] rounded-full border-2 border-emerald-400/20 animate-ping"
            style={{
              animationDuration: "1.5s",
              boxShadow: "0 0 60px rgba(34, 197, 94, 0.15), inset 0 0 60px rgba(34, 197, 94, 0.08)",
            }}
          />
        )}

        <div className="text-center z-10">
          {hasClicked ? (
            <>
              <div className="rounded-3xl border border-emerald-400/20 bg-black/30 backdrop-blur-sm px-12 py-8"
                style={{ boxShadow: "0 0 30px rgba(34, 197, 94, 0.1)" }}>
                <h2
                  className="text-5xl font-mono font-bold text-emerald-400/70 mb-2"
                  style={{ textShadow: "0 0 30px rgba(34, 197, 94, 0.3)" }}
                >
                  {me?.roundTime != null ? `${me.roundTime}ms` : "Clique !"}
                </h2>
                <p className="text-sm text-white/25 font-sans mt-3">En attente des autres...</p>
              </div>
            </>
          ) : (
            <>
              <h2
                className="text-6xl font-serif font-bold text-emerald-400 animate-pulse"
                style={{
                  textShadow: "0 0 60px rgba(34, 197, 94, 0.5), 0 0 120px rgba(34, 197, 94, 0.25), 0 0 200px rgba(34, 197, 94, 0.1)",
                }}
              >
                CLIQUE !
              </h2>
              <p className="text-sm text-emerald-300/40 font-sans mt-4 tracking-wide">Le plus vite possible !</p>
            </>
          )}
        </div>

        {me?.penalty && (
          <div className="mt-6 z-10 rounded-xl border border-red-500/20 bg-red-950/20 backdrop-blur-sm px-5 py-2">
            <p className="text-sm text-red-400/80 font-sans">+500ms de penalite (clic trop tot)</p>
          </div>
        )}

        {/* Player scores bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex gap-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm px-5 py-3"
            style={{ boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)" }}>
            {state.players?.map((p: ReactionTimePlayer) => (
              <div key={p.id} className="text-center px-2">
                <span className={cn(
                  "text-xs font-sans block",
                  p.clicked ? "text-emerald-400/60" : "text-white/30"
                )}>
                  {p.name}
                </span>
                <p className="text-sm text-amber-400/80 font-mono font-semibold mt-0.5">{p.totalScore}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // RESULTS phase
  if (state.status === "results") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 overflow-hidden"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(120, 80, 200, 0.12), transparent 50%), radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.06), transparent 40%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.25em] mb-6">
          Resultats — Manche {state.round} / {state.totalRounds}
        </span>

        <div className="w-full max-w-md space-y-2.5 mt-2">
          {state.roundResults?.map((r: ReactionRoundResult, i: number) => {
            const player = state.players?.find((p: ReactionTimePlayer) => p.id === r.playerId);
            const isFirst = i === 0 && r.time < 9999;
            const isMe = r.playerId === playerId;
            return (
              <div
                key={r.playerId}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-4 backdrop-blur-sm transition-all",
                  isFirst
                    ? "border-emerald-400/25 bg-emerald-500/[0.07]"
                    : "border-white/[0.08] bg-white/[0.03]"
                )}
                style={isFirst ? { boxShadow: "0 0 20px rgba(34, 197, 94, 0.1)" } : undefined}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-xl font-mono w-8",
                    isFirst ? "text-emerald-400/60" : "text-white/20"
                  )}>
                    #{i + 1}
                  </span>
                  <span className={cn(
                    "text-base font-sans",
                    isMe ? "text-white/90 font-semibold" : "text-white/70"
                  )}>
                    {player?.name ?? "?"}
                    {isMe && (
                      <span className="text-white/30 font-normal ml-1.5">(toi)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {r.penalty && (
                    <span className="text-[10px] text-red-400/70 font-sans rounded-full border border-red-500/20 bg-red-950/20 px-2 py-0.5">
                      +500ms
                    </span>
                  )}
                  <span className={cn(
                    "text-base font-mono font-semibold",
                    r.time >= 9999 ? "text-white/20" : isFirst ? "text-emerald-400/80" : "text-white/60"
                  )}>
                    {r.time >= 9999 ? "---" : `${r.time}ms`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total scores panel */}
        <div className="mt-8 rounded-3xl border border-white/15 bg-black/30 backdrop-blur-sm px-8 py-5"
          style={{ boxShadow: "0 0 30px rgba(0, 0, 0, 0.2)" }}>
          <p className="text-[10px] text-white/25 font-sans uppercase tracking-[0.2em] text-center mb-3">
            Classement
          </p>
          <div className="flex gap-6">
            {state.players
              ?.slice()
              .sort((a: ReactionTimePlayer, b: ReactionTimePlayer) => b.totalScore - a.totalScore)
              .map((p: ReactionTimePlayer, i: number) => (
                <div key={p.id} className="text-center">
                  <span className={cn(
                    "text-xs font-sans block",
                    p.id === playerId ? "text-white/60" : "text-white/30"
                  )}>
                    {p.name}
                  </span>
                  <p className={cn(
                    "text-2xl font-mono font-bold mt-1",
                    i === 0 ? "text-amber-400/90" : "text-white/50"
                  )}
                    style={i === 0 ? { textShadow: "0 0 20px rgba(251, 191, 36, 0.25)" } : undefined}
                  >
                    {p.totalScore}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div
      className="flex flex-1 items-center justify-center"
      style={{ background: "#060606" }}
    >
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/10 backdrop-blur-sm px-6 py-4">
          <p className="text-sm text-red-400/80 font-sans">{error}</p>
        </div>
      )}
    </div>
  );
}
