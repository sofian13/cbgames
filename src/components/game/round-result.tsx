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
        "animate-in fade-in slide-in-from-bottom-2 rounded-lg p-3 text-center text-sm",
        event === "word-accepted"
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-destructive/10 text-destructive border border-destructive/20"
      )}
    >
      {event === "word-accepted" ? (
        <p>
          <span className="font-semibold">{playerName}</span> a trouvé{" "}
          <span className="font-mono font-bold">{word}</span>
        </p>
      ) : (
        <p>
          La bombe a explosé sur <span className="font-semibold">{playerName}</span>
          {isEliminated ? " — Éliminé !" : ` — ${livesLeft} vie${(livesLeft ?? 0) > 1 ? "s" : ""} restante${(livesLeft ?? 0) > 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  );
}
