"use client";

import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  timeLeft: number;
  maxTime: number;
  className?: string;
}

export function CountdownTimer({ timeLeft, maxTime, className }: CountdownTimerProps) {
  const percentage = (timeLeft / maxTime) * 100;
  const isUrgent = timeLeft <= 3;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            isUrgent
              ? "bg-gradient-to-r from-red-500 to-orange-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
              : percentage < 50
                ? "bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                : "bg-gradient-to-r from-emerald-400 to-cyan-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={cn(
          "text-2xl font-mono font-bold tabular-nums min-w-[3ch] text-right text-white/70",
          isUrgent && "text-red-400 animate-pulse"
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
}
