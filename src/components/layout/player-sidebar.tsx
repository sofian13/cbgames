"use client";

import { AvatarCircle } from "@/components/shared/avatar-circle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/party/message-types";

interface PlayerSidebarProps {
  players: Player[];
  currentPlayerId?: string;
  sessionScores?: Record<string, number>;
  className?: string;
}

export function PlayerSidebar({
  players,
  currentPlayerId,
  sessionScores = {},
  className,
}: PlayerSidebarProps) {
  return (
    <aside className={cn("w-64 border-r border-border bg-card/30 p-4", className)}>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Joueurs ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2 transition-colors",
              player.id === currentPlayerId && "bg-primary/10"
            )}
          >
            <AvatarCircle
              name={player.name}
              avatar={player.avatar}
              isConnected={player.isConnected}
              isHost={player.isHost}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {player.name}
                {player.id === currentPlayerId && (
                  <span className="text-muted-foreground"> (toi)</span>
                )}
              </p>
              {sessionScores[player.id] !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {sessionScores[player.id]} pts
                </p>
              )}
            </div>
            {player.isReady && (
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                Prêt
              </Badge>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
