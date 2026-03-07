"use client";

import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-2 text-xs backdrop-blur-sm sm:px-3",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isConnected
            ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            : "bg-red-400 animate-pulse"
        )}
      />
      <span className="hidden font-sans text-[11px] text-white/52 sm:inline">
        {isConnected ? "Live" : "Hors ligne"}
      </span>
    </div>
  );
}
