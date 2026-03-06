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
        "flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-3.5 py-2 text-xs backdrop-blur-sm",
        className
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isConnected
            ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
            : "bg-red-400 animate-pulse"
        )}
      />
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/32">Socket</p>
        <p className="mt-0.5 text-[11px] font-semibold text-white/72">
          {isConnected ? "Connecte" : "Deconnecte"}
        </p>
      </div>
    </div>
  );
}
