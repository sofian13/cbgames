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
        "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        className
      )}
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--line-soft)",
      }}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", isConnected ? "" : "cb-live-pulse")}
        style={{
          background: isConnected ? "var(--cb-strategy)" : "var(--cb-social)",
        }}
      />
      <span
        className="hidden font-semibold sm:inline"
        style={{ color: "var(--text-dim)", fontSize: "10px" }}
      >
        {isConnected ? "LIVE" : "OFFLINE"}
      </span>
    </div>
  );
}
