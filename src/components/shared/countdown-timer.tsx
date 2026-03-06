"use client";

import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  timeLeft: number;
  maxTime: number;
  className?: string;
}

export function CountdownTimer({ timeLeft, maxTime, className }: CountdownTimerProps) {
  const percentage = maxTime > 0 ? (timeLeft / maxTime) * 100 : 0;
  const isUrgent = timeLeft <= 3;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full border border-white/8 bg-white/[0.05]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            isUrgent
              ? "bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 shadow-[0_0_18px_rgba(239,68,68,0.45)]"
              : percentage < 50
                ? "bg-gradient-to-r from-amber-400 to-[#ff8a3d] shadow-[0_0_12px_rgba(251,191,36,0.28)]"
                : "bg-gradient-to-r from-[#72e4f7] via-[#7ee6a2] to-[#f3c56d] shadow-[0_0_12px_rgba(110,228,247,0.28)]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={cn(
          "min-w-[3ch] text-right font-mono text-2xl font-black tabular-nums text-white/78",
          isUrgent && "text-red-400 animate-pulse"
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
}
