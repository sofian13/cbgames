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
              ? "bg-gradient-to-r from-red-500 to-pink-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
              : percentage < 50
                ? "bg-gradient-to-r from-[color:var(--brand-accent)] to-[color:var(--brand-3)] shadow-[0_0_10px_rgba(139,92,246,0.35)]"
                : "bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] shadow-[0_0_10px_rgba(46,124,255,0.38)]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={cn(
          "text-2xl font-mono font-bold tabular-nums min-w-[3ch] text-right text-white/80",
          isUrgent && "text-red-400 animate-pulse"
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
}
