"use client";

import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  return (
    <div className={cn("flex items-center gap-2 rounded-full border border-cyan-300/20 px-2.5 py-1 text-xs premium-panel-soft", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isConnected ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.65)]" : "bg-red-400 animate-pulse"
        )}
      />
      <span className="text-white/65 font-sans">
        {isConnected ? "Connecte" : "Deconnecte"}
      </span>
    </div>
  );
}
