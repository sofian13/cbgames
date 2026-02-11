"use client";

import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type { SpeedQuizState, SpeedQuizPlayer } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

export default function SpeedQuizGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "speed-quiz", playerId, playerName);
  const { gameState, error } = useGameStore();

  const state = gameState as unknown as SpeedQuizState;

  if (!state || state.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-white/40 animate-pulse font-sans">En attente des joueurs...</p>
      </div>
    );
  }

  const handleAnswer = (choiceIndex: number) => {
    sendAction({ action: "answer", choiceIndex });
  };

  const me = state.players?.find((p: SpeedQuizPlayer) => p.id === playerId);
  const hasAnswered = me?.hasAnswered ?? false;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      {/* Progress bar / Timer */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/30 font-sans">
            Question {state.currentQuestion?.index !== undefined ? state.currentQuestion.index + 1 : "?"} / {state.currentQuestion?.total ?? 10}
          </span>
          <span className={cn(
            "text-sm font-mono font-bold",
            (state.timeLeft ?? 0) <= 5 ? "text-red-400" : "text-ember"
          )}>
            {state.timeLeft ?? 0}s
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-ember transition-all duration-1000 ease-linear"
            style={{ width: `${((state.timeLeft ?? 0) / 15) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {state.currentQuestion && (
        <div className="w-full max-w-2xl text-center mt-4">
          <h2 className="text-2xl font-light font-serif text-white/90 mb-8">
            {state.currentQuestion.text}
          </h2>

          {/* Choices grid */}
          <div className="grid grid-cols-2 gap-3">
            {state.currentQuestion.choices.map((choice: string, i: number) => {
              const isCorrectRevealed = state.status === "reveal" && state.correctAnswer === i;
              const isWrongRevealed = state.status === "reveal" && state.correctAnswer !== i;

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={hasAnswered || state.status === "reveal"}
                  className={cn(
                    "relative p-4 rounded-lg border text-left font-sans text-sm transition-all duration-300",
                    "hover:border-ember/40 hover:bg-ember/5",
                    hasAnswered && "cursor-default",
                    !hasAnswered && state.status === "question" && "cursor-pointer",
                    isCorrectRevealed && "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
                    isWrongRevealed && "border-white/[0.04] bg-white/[0.01] text-white/30",
                    !isCorrectRevealed && !isWrongRevealed && "border-white/[0.08] bg-white/[0.03] text-white/70",
                  )}
                >
                  <span className="text-xs font-bold text-white/20 mr-2">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice}
                  {isCorrectRevealed && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status feedback */}
      {hasAnswered && state.status === "question" && (
        <p className="text-sm text-white/30 font-sans animate-pulse">
          En attente des autres joueurs...
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 animate-in fade-in font-sans">{error}</p>
      )}

      {/* Players scoreboard */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {state.players?.map((p: SpeedQuizPlayer) => (
          <div
            key={p.id}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-3 min-w-[100px] transition-all backdrop-blur-sm",
              "border-white/[0.06] bg-white/[0.03]",
              p.hasAnswered && p.lastCorrect === true && "border-emerald-500/20 bg-emerald-500/5",
              p.hasAnswered && p.lastCorrect === false && "border-red-500/20 bg-red-500/5",
            )}
          >
            <span className="text-sm font-medium truncate max-w-[90px] text-white/80 font-sans">
              {p.name}
              {p.id === playerId && " (toi)"}
            </span>
            {p.hasAnswered && (
              <span className={cn("text-xs", p.lastCorrect ? "text-emerald-400" : "text-red-400")}>
                {p.lastCorrect ? "✓" : "✗"}
              </span>
            )}
            <span className="text-xs text-ember font-mono">{p.score} pts</span>
            {state.firstCorrectId === p.id && (
              <span className="text-[10px] text-amber-400 font-bold">1er !</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
