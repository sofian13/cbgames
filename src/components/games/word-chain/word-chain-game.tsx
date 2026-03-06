"use client";

import { useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type { WordChainState, WordChainPlayer } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

export default function WordChainGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "word-chain", playerId, playerName);
  const { gameState, error } = useGameStore();
  const [input, setInput] = useState("");

  const state = gameState as unknown as WordChainState;

  if (!state || state.status === "waiting") {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.12), transparent 40%), radial-gradient(circle at 80% 70%, rgba(46,167,255,0.08), transparent 35%)",
          }}
        />
        <p className="animate-pulse font-sans text-lg text-white/40">En attente des joueurs...</p>
      </div>
    );
  }

  const isMyTurn = state.currentPlayerId === playerId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const word = input.trim();
    if (word.length >= 3 && isMyTurn) {
      sendAction({ action: "submit-word", word });
      setInput("");
    }
  };

  const timePercent = ((state.timeLeft ?? 0) / 8) * 100;
  const isLowTime = (state.timeLeft ?? 0) <= 3;

  return (
    <div className="relative flex flex-1 flex-col items-center gap-6 overflow-hidden px-4 py-8">
      {/* Radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 15%, rgba(80,216,255,0.14), transparent 40%), radial-gradient(circle at 20% 80%, rgba(46,167,255,0.07), transparent 35%), radial-gradient(circle at 85% 60%, rgba(80,216,255,0.05), transparent 30%)",
        }}
      />

      {/* Timer panel */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/25 bg-black/30 px-6 py-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-xs uppercase tracking-widest text-white/40">
            Tour {state.round}
          </span>
          <span
            className={cn(
              "font-mono text-3xl font-bold transition-colors",
              isLowTime ? "text-red-400" : "text-ember"
            )}
            style={{
              textShadow: isLowTime
                ? "0 0 20px rgba(248,113,113,0.4)"
                : "0 0 20px rgba(80,216,255,0.35)",
            }}
          >
            {state.timeLeft ?? 0}s
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              isLowTime ? "bg-red-400" : "bg-ember"
            )}
            style={{
              width: `${timePercent}%`,
              boxShadow: isLowTime
                ? "0 0 12px rgba(248,113,113,0.5)"
                : "0 0 12px rgba(80,216,255,0.4)",
            }}
          />
        </div>
      </div>

      {/* Last word display */}
      {state.lastWord && (
        <div className="relative text-center">
          <span className="font-sans text-xs uppercase tracking-widest text-white/40">
            Dernier mot
          </span>
          <p className="mt-1 font-sans text-3xl font-semibold text-white/60">
            {state.lastWord.slice(0, -1)}
            <span
              className="text-4xl font-bold text-ember"
              style={{ textShadow: "0 0 20px rgba(80,216,255,0.4)" }}
            >
              {state.lastWord.slice(-1)}
            </span>
          </p>
        </div>
      )}

      {/* Required letter — hero element */}
      <div className="relative flex flex-col items-center gap-3">
        <span className="font-sans text-xs uppercase tracking-widest text-white/40">
          Commence par
        </span>
        <div
          className="rounded-3xl border border-white/25 bg-black/30 px-10 py-6 backdrop-blur-sm"
          style={{
            boxShadow: "0 0 40px rgba(80,216,255,0.15), 0 0 80px rgba(46,167,255,0.08)",
          }}
        >
          <span
            className="font-serif text-7xl font-bold text-ember"
            style={{
              textShadow:
                "0 0 40px rgba(80,216,255,0.45), 0 0 80px rgba(46,167,255,0.25)",
            }}
          >
            {state.requiredLetter}
          </span>
        </div>
      </div>

      {/* Current player indicator */}
      <p className="font-sans text-xl">
        {isMyTurn ? (
          <span
            className="font-bold text-ember"
            style={{ textShadow: "0 0 16px rgba(80,216,255,0.3)" }}
          >
            C&apos;est ton tour !
          </span>
        ) : (
          <span className="text-white/40">
            Tour de{" "}
            <span className="font-semibold text-white/70">
              {state.players?.find((p: WordChainPlayer) => p.id === state.currentPlayerId)?.name ?? "..."}
            </span>
          </span>
        )}
      </p>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="relative w-full max-w-md">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toLowerCase())}
            disabled={!isMyTurn}
            placeholder={isMyTurn ? `Mot commencant par ${state.requiredLetter}...` : "Attends ton tour..."}
            className={cn(
              "flex-1 rounded-2xl border bg-black/30 px-5 py-3.5 font-mono text-lg text-white/90 placeholder:text-white/25 outline-none backdrop-blur-sm transition-all",
              isMyTurn
                ? "border-ember/30 focus:border-ember/60 focus:shadow-[0_0_20px_rgba(80,216,255,0.25)]"
                : "border-white/[0.08] text-white/30 placeholder:text-white/10 cursor-not-allowed"
            )}
            autoFocus={isMyTurn}
          />
          <button
            type="submit"
            disabled={!isMyTurn || input.trim().length < 3}
            className={cn(
              "rounded-2xl px-7 py-3.5 font-sans text-base font-semibold transition-all",
              isMyTurn && input.trim().length >= 3
                ? "bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] text-white shadow-[0_0_20px_rgba(78,207,138,0.25)] hover:shadow-[0_0_28px_rgba(78,207,138,0.35)] active:scale-[0.97]"
                : "border border-white/[0.08] bg-white/[0.04] text-white/20 cursor-not-allowed"
            )}
          >
            Envoyer
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2">
          <p className="font-sans text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Players status */}
      <div className="relative mt-2 flex flex-wrap justify-center gap-3">
        {state.players?.map((p: WordChainPlayer) => (
          <div
            key={p.id}
            className={cn(
              "flex min-w-[110px] flex-col items-center gap-1.5 rounded-2xl border p-4 backdrop-blur-sm transition-all",
              p.id === state.currentPlayerId &&
                "border-ember/30 bg-ember/[0.06]",
              !p.isAlive && "opacity-30",
              p.id !== state.currentPlayerId &&
                p.isAlive &&
                "border-white/[0.12] bg-black/30"
            )}
            style={
              p.id === state.currentPlayerId
                ? { boxShadow: "0 0 20px rgba(80,216,255,0.12)" }
                : undefined
            }
          >
            <span className="max-w-[100px] truncate font-sans text-sm font-semibold text-white/90">
              {p.name}
              {p.id === playerId && (
                <span className="ml-1 text-white/40">(toi)</span>
              )}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-sm transition-opacity",
                    i < p.lives ? "opacity-100" : "opacity-15"
                  )}
                >
                  {i < p.lives ? "\u2764\uFE0F" : "\u{1F5A4}"}
                </span>
              ))}
            </div>
            <span
              className="font-mono text-xs font-bold text-ember"
              style={{ textShadow: "0 0 8px rgba(80,216,255,0.2)" }}
            >
              {p.score} pts
            </span>
          </div>
        ))}
      </div>

      {/* Used words chain */}
      {state.usedWords && state.usedWords.length > 0 && (
        <div className="relative mt-2 w-full max-w-lg rounded-3xl border border-white/25 bg-black/30 px-5 py-4 backdrop-blur-sm">
          <p className="mb-2 font-sans text-xs uppercase tracking-widest text-white/40">
            Cha&icirc;ne de mots
          </p>
          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
            {state.usedWords.slice(-15).map((word: string, i: number) => (
              <span
                key={i}
                className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-white/50 transition-colors hover:text-white/70"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
