"use client";

import { cn } from "@/lib/utils";

interface BombPartyBombProps {
  syllable: string;
  timeLeft: number;
  isMyTurn: boolean;
}

export function BombPartyBomb({ syllable, timeLeft, isMyTurn }: BombPartyBombProps) {
  const isUrgent = timeLeft <= 3;

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Bomb */}
      <div
        className={cn(
          "relative flex h-32 w-32 items-center justify-center rounded-full border-4 transition-all",
          isUrgent
            ? "border-destructive bg-destructive/10 animate-pulse"
            : isMyTurn
              ? "border-primary bg-primary/10"
              : "border-border bg-card"
        )}
      >
        {/* Fuse */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <div
            className={cn(
              "h-6 w-1 rounded-full",
              isUrgent ? "bg-destructive" : "bg-muted-foreground"
            )}
          />
          {/* Spark */}
          <div
            className={cn(
              "absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full",
              isUrgent
                ? "bg-orange-500 animate-ping"
                : "bg-yellow-500/60 animate-pulse"
            )}
          />
        </div>

        {/* Syllable */}
        <span
          className={cn(
            "font-mono text-3xl font-black tracking-wider",
            isUrgent ? "text-destructive" : "text-foreground"
          )}
        >
          {syllable}
        </span>
      </div>
    </div>
  );
}
