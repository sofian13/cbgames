"use client";

import { cn } from "@/lib/utils";

interface RoundResultProps {
  event: "word-accepted" | "bomb-exploded";
  playerName: string;
  word?: string;
  livesLeft?: number;
  isEliminated?: boolean;
}

export function RoundResult({ event, playerName, word, livesLeft, isEliminated }: RoundResultProps) {
  return (
    <div
      className={cn(
        "premium-panel-soft animate-in fade-in slide-in-from-bottom-2 rounded-xl border p-3 text-center text-sm",
        event === "word-accepted"
          ? "border-emerald-400/35 bg-emerald-400/12 text-emerald-200"
          : "border-red-400/35 bg-red-500/12 text-red-200"
      )}
    >
      {event === "word-accepted" ? (
        <p>
          <span className="font-semibold">{playerName}</span> a trouve{" "}
          <span className="font-mono font-bold">{word}</span>
        </p>
      ) : (
        <p>
          La bombe a explose sur <span className="font-semibold">{playerName}</span>
          {isEliminated
            ? " - Elimine !"
            : ` - ${livesLeft} vie${(livesLeft ?? 0) > 1 ? "s" : ""} restante${(livesLeft ?? 0) > 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  );
}
