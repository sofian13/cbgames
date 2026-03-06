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
  const connectedPlayers = players.filter((p) => p.isConnected);
  const isSolo = connectedPlayers.length === 1 && connectedPlayers[0]?.id === currentPlayerId;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white/55 uppercase tracking-[0.16em]">
        Joueurs ({players.length}/8)
      </h3>
      <div className="grid gap-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              "premium-panel-soft flex items-center gap-3 rounded-xl border p-3 transition-colors",
              player.id === currentPlayerId && "border-cyan-300/50 bg-cyan-300/10"
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
              <div className="mt-1 flex gap-1">
                {(player.isHost || (isSolo && player.id === currentPlayerId)) && (
                  <Badge variant="secondary" className="text-xs">
                    {isSolo && player.id === currentPlayerId ? "Host (Solo)" : "Host"}
                  </Badge>
                )}
                {player.isGuest && !(isSolo && player.id === currentPlayerId) && (
                  <Badge variant="outline" className="text-xs">Compte invite</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {player.isReady && (
                <Badge className="border-emerald-400/35 bg-emerald-400/15 text-emerald-200">
                  Pret
                </Badge>
              )}
              {isHost && !player.isHost && player.id !== currentPlayerId && onKick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 border border-cyan-300/18 bg-cyan-300/8 text-white/45 hover:bg-red-500/15 hover:text-red-300"
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
