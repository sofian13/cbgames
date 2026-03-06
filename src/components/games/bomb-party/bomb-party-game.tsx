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
        <p className="text-white/40 font-sans animate-pulse text-lg">En attente des joueurs...</p>
      </div>
    );
  }

  const isMyTurn = state.currentPlayerId === playerId;

  const handleSubmitWord = (word: string) => {
    sendAction({ action: "submit-word", word });
  };

  return (
    <div
      className="flex flex-1 flex-col items-center gap-6 p-6"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, rgba(34,211,238,0.08), transparent 45%), radial-gradient(circle at 50% 80%, rgba(239,68,68,0.06), transparent 40%)",
      }}
    >
      {/* Timer */}
      <div className="w-full max-w-md">
        <CountdownTimer timeLeft={state.timeLeft ?? 0} maxTime={10} />
      </div>

      {/* Bomb + syllable */}
      <BombPartyBomb
        syllable={state.syllable ?? ""}
        timeLeft={state.timeLeft ?? 0}
        isMyTurn={isMyTurn}
      />

      {/* Current player indicator */}
      <p className="text-lg font-sans">
        {isMyTurn ? (
          <span className="font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
            C&apos;est ton tour !
          </span>
        ) : (
          <span className="text-white/40">
            Tour de{" "}
            <span className="font-semibold text-white/70">
              {state.players?.find((p: BombPartyPlayer) => p.id === state.currentPlayerId)?.name ?? "..."}
            </span>
          </span>
        )}
      </p>

      {/* Input */}
      <BombPartyInput isMyTurn={isMyTurn} syllable={state.syllable ?? ""} onSubmit={handleSubmitWord} />

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2">
          <p className="text-sm text-red-300 font-sans">{error}</p>
        </div>
      )}

      {/* Players status */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {state.players?.map((p: BombPartyPlayer) => (
          <div
            key={p.id}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 min-w-[110px] transition-all backdrop-blur-sm",
              p.id === state.currentPlayerId
                ? "border-cyan-300/25 bg-cyan-300/[0.06] shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                : "border-white/[0.08] bg-white/[0.03]",
              !p.isAlive && "opacity-30 grayscale"
            )}
          >
            <span className="text-sm font-sans font-semibold truncate max-w-[90px] text-white/80">
              {p.name}
              {p.id === playerId && (
                <span className="text-cyan-300/60 ml-1">(toi)</span>
              )}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-sm transition-all",
                    i < p.lives
                      ? "drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                      : "opacity-20 grayscale"
                  )}
                >
                  ❤️
                </span>
              ))}
            </div>
            <span className="text-xs font-mono text-white/35">{p.score} pts</span>
          </div>
        ))}
      </div>

      {/* Used words */}
      {state.usedWords && state.usedWords.length > 0 && (
        <div className="w-full max-w-md mt-2">
          <p className="text-[11px] text-white/25 font-sans mb-2 uppercase tracking-wider">Mots utilises</p>
          <div className="flex flex-wrap gap-1.5">
            {state.usedWords.slice(-10).map((word: string, i: number) => (
              <span
                key={i}
                className="text-xs font-mono rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-white/40"
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
