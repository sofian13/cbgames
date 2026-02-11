"use client";

import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-destructive animate-pulse"
        )}
      />
      <span className="text-muted-foreground">
        {isConnected ? "Connecté" : "Déconnecté"}
      </span>
    </div>
  );
}
