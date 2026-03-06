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
      {/* Glow backdrop */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-3xl opacity-40 transition-all duration-500",
          isUrgent
            ? "bg-red-500/30 scale-125"
            : isMyTurn
              ? "bg-cyan-400/20 scale-110"
              : "bg-white/5"
        )}
      />

      {/* Bomb */}
      <div
        className={cn(
          "relative flex h-36 w-36 items-center justify-center rounded-full border-2 transition-all duration-300",
          isUrgent
            ? "border-red-400/50 bg-gradient-to-br from-red-500/20 to-orange-500/10 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
            : isMyTurn
              ? "border-cyan-300/30 bg-gradient-to-br from-cyan-400/15 to-blue-500/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]"
              : "border-white/10 bg-white/[0.04]",
          isUrgent && "animate-[bombShake_0.15s_ease-in-out_infinite]"
        )}
      >
        {/* Fuse */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
          <div
            className={cn(
              "h-7 w-1 rounded-full transition-colors",
              isUrgent ? "bg-red-400" : "bg-white/20"
            )}
          />
          {/* Spark */}
          <div
            className={cn(
              "absolute -top-2.5 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full",
              isUrgent
                ? "bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.8)] animate-ping"
                : "bg-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-pulse"
            )}
          />
        </div>

        {/* Syllable */}
        <span
          className={cn(
            "font-mono text-4xl font-black tracking-wider uppercase",
            isUrgent ? "text-red-300" : isMyTurn ? "text-cyan-200" : "text-white/60"
          )}
        >
          {syllable}
        </span>
      </div>

    </div>
  );
}
