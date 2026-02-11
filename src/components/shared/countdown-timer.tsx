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
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            isUrgent ? "bg-destructive" : percentage < 50 ? "bg-yellow-500" : "bg-green-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={cn(
          "text-2xl font-mono font-bold tabular-nums min-w-[3ch] text-right",
          isUrgent && "text-destructive animate-pulse"
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
}
