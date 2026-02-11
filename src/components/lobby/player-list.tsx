"use client";

import { AvatarCircle } from "@/components/shared/avatar-circle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Player } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onKick?: (playerId: string) => void;
}

export function PlayerList({ players, currentPlayerId, isHost, onKick }: PlayerListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Joueurs ({players.length}/8)
      </h3>
      <div className="grid gap-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors",
              player.id === currentPlayerId && "border-primary/50 bg-primary/5"
            )}
          >
            <AvatarCircle
              name={player.name}
              avatar={player.avatar}
              isConnected={player.isConnected}
              isHost={player.isHost}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {player.name}
                {player.id === currentPlayerId && (
                  <span className="text-muted-foreground text-sm"> (toi)</span>
                )}
              </p>
              <div className="flex gap-1 mt-1">
                {player.isHost && (
                  <Badge variant="secondary" className="text-xs">Host</Badge>
                )}
                {player.isGuest && (
                  <Badge variant="outline" className="text-xs">Invité</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {player.isReady && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Prêt
                </Badge>
              )}
              {isHost && !player.isHost && player.id !== currentPlayerId && onKick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onKick(player.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
