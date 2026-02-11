"use client";

import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { BombPartyInput } from "./bomb-party-input";
import { BombPartyBomb } from "./bomb-party-bomb";
import type { GameProps } from "@/lib/games/types";
import type { BombPartyState, BombPartyPlayer } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

export default function BombPartyGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "bomb-party", playerId, playerName);
  const { gameState, error } = useGameStore();

  const state = gameState as unknown as BombPartyState;

  if (!state || state.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground animate-pulse">En attente des joueurs...</p>
      </div>
    );
  }

  const isMyTurn = state.currentPlayerId === playerId;

  const handleSubmitWord = (word: string) => {
    sendAction({ action: "submit-word", word });
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      {/* Timer */}
      <div className="w-full max-w-md">
        <CountdownTimer
          timeLeft={state.timeLeft ?? 0}
          maxTime={10}
        />
      </div>

      {/* Bomb + syllable */}
      <BombPartyBomb
        syllable={state.syllable ?? ""}
        timeLeft={state.timeLeft ?? 0}
        isMyTurn={isMyTurn}
      />

      {/* Current player indicator */}
      <p className="text-lg">
        {isMyTurn ? (
          <span className="font-bold text-primary">C&apos;est ton tour !</span>
        ) : (
          <span className="text-muted-foreground">
            Tour de{" "}
            <span className="font-semibold text-foreground">
              {state.players?.find((p: BombPartyPlayer) => p.id === state.currentPlayerId)?.name ?? "..."}
            </span>
          </span>
        )}
      </p>

      {/* Input */}
      <BombPartyInput
        isMyTurn={isMyTurn}
        syllable={state.syllable ?? ""}
        onSubmit={handleSubmitWord}
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive animate-in fade-in">{error}</p>
      )}

      {/* Players status */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {state.players?.map((p: BombPartyPlayer) => (
          <div
            key={p.id}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-3 min-w-[100px] transition-all",
              p.id === state.currentPlayerId && "border-primary bg-primary/5 ring-1 ring-primary/20",
              !p.isAlive && "opacity-40"
            )}
          >
            <span className="text-sm font-medium truncate max-w-[90px]">
              {p.name}
              {p.id === playerId && " (toi)"}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-sm",
                    i < p.lives ? "text-red-500" : "text-muted-foreground/30"
                  )}
                >
                  ❤️
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{p.score} pts</span>
          </div>
        ))}
      </div>

      {/* Used words */}
      {state.usedWords && state.usedWords.length > 0 && (
        <div className="w-full max-w-md mt-4">
          <p className="text-xs text-muted-foreground mb-1">Mots utilisés :</p>
          <div className="flex flex-wrap gap-1">
            {state.usedWords.slice(-10).map((word: string, i: number) => (
              <span key={i} className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
