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
    <aside className={cn("premium-panel w-72 rounded-r-2xl border-r p-4", className)}>
      <h3 className="mb-3 text-xs font-semibold text-white/55 uppercase tracking-[0.16em]">
        Joueurs ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              "premium-panel-soft flex items-center gap-3 rounded-xl p-2.5 transition-colors",
              player.id === currentPlayerId && "border-cyan-300/50 bg-cyan-300/12"
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
              <p className="truncate text-sm font-medium text-white/85">
                {player.name}
                {player.id === currentPlayerId && <span className="text-white/45"> (toi)</span>}
              </p>
              {sessionScores[player.id] !== undefined && (
                <p className="text-xs text-cyan-300/80">{sessionScores[player.id]} pts</p>
              )}
            </div>
            {player.isReady && (
              <Badge className="border-emerald-400/35 bg-emerald-400/15 text-emerald-200">
                Pret
              </Badge>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
