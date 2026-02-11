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
      <div className="flex flex-1 items-center justify-center">
        <p className="text-white/40 animate-pulse font-sans">En attente des joueurs...</p>
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

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      {/* Timer */}
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/30 font-sans">Tour {state.round}</span>
          <span className={cn(
            "text-sm font-mono font-bold",
            (state.timeLeft ?? 0) <= 3 ? "text-red-400" : "text-ember"
          )}>
            {state.timeLeft ?? 0}s
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-ember transition-all duration-1000 ease-linear"
            style={{ width: `${((state.timeLeft ?? 0) / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Last word */}
      {state.lastWord && (
        <div className="text-center">
          <span className="text-xs text-white/30 font-sans uppercase tracking-wider">Dernier mot</span>
          <p className="text-xl text-white/60 font-sans mt-1">
            {state.lastWord.slice(0, -1)}
            <span className="text-ember font-bold text-2xl">{state.lastWord.slice(-1)}</span>
          </p>
        </div>
      )}

      {/* Required letter */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-white/30 font-sans uppercase tracking-wider">Commence par</span>
        <div
          className="text-7xl font-serif font-bold text-ember"
          style={{
            textShadow: "0 0 40px rgba(249,115,22,0.3), 0 0 80px rgba(234,88,12,0.15)",
          }}
        >
          {state.requiredLetter}
        </div>
      </div>

      {/* Current player indicator */}
      <p className="text-lg font-sans">
        {isMyTurn ? (
          <span className="font-bold text-ember">C&apos;est ton tour !</span>
        ) : (
          <span className="text-white/40">
            Tour de{" "}
            <span className="font-semibold text-white/70">
              {state.players?.find((p: WordChainPlayer) => p.id === state.currentPlayerId)?.name ?? "..."}
            </span>
          </span>
        )}
      </p>

      {/* Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toLowerCase())}
            disabled={!isMyTurn}
            placeholder={isMyTurn ? `Mot commençant par ${state.requiredLetter}...` : "Attends ton tour..."}
            className={cn(
              "flex-1 rounded-lg border px-4 py-3 text-sm font-sans bg-transparent outline-none transition-all",
              isMyTurn
                ? "border-ember/30 text-white placeholder:text-white/20 focus:border-ember/60 focus:shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                : "border-white/[0.06] text-white/30 placeholder:text-white/10 cursor-not-allowed"
            )}
            autoFocus={isMyTurn}
          />
          <button
            type="submit"
            disabled={!isMyTurn || input.trim().length < 3}
            className={cn(
              "px-6 py-3 rounded-lg font-sans text-sm font-medium transition-all",
              isMyTurn && input.trim().length >= 3
                ? "bg-ember text-white hover:bg-ember-glow"
                : "bg-white/[0.04] text-white/20 cursor-not-allowed"
            )}
          >
            Envoyer
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 animate-in fade-in font-sans">{error}</p>
      )}

      {/* Players status */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {state.players?.map((p: WordChainPlayer) => (
          <div
            key={p.id}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-3 min-w-[100px] transition-all backdrop-blur-sm",
              p.id === state.currentPlayerId && "border-ember/30 bg-ember/5 ring-1 ring-ember/20",
              !p.isAlive && "opacity-40",
              p.id !== state.currentPlayerId && p.isAlive && "border-white/[0.06] bg-white/[0.03]"
            )}
          >
            <span className="text-sm font-medium truncate max-w-[90px] text-white/80 font-sans">
              {p.name}
              {p.id === playerId && " (toi)"}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={cn("text-sm", i < p.lives ? "text-red-500" : "text-white/10")}
                >
                  ❤️
                </span>
              ))}
            </div>
            <span className="text-xs text-ember font-mono">{p.score} pts</span>
          </div>
        ))}
      </div>

      {/* Used words chain */}
      {state.usedWords && state.usedWords.length > 0 && (
        <div className="w-full max-w-lg mt-4">
          <p className="text-xs text-white/20 mb-1 font-sans">Chaîne de mots :</p>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {state.usedWords.slice(-15).map((word: string, i: number) => (
              <span key={i} className="text-xs bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono text-white/40">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
