"use client";

import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-xs backdrop-blur-sm", className)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-red-400 animate-pulse"
        )}
      />
      <span className="text-white/40 font-sans text-[11px]">
        {isConnected ? "Connecte" : "Deconnecte"}
      </span>
    </div>
  );
}
