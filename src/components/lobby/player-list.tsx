"use client";

import { AvatarCircle } from "@/components/shared/avatar-circle";
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
    <div className="space-y-3" style={{ animation: "slideInRight 0.5s ease" }}>
      <div className="flex items-center justify-between">
        <h3 className="section-title">Joueurs</h3>
        <span className="text-[11px] font-mono text-white/25">{players.length}/8</span>
      </div>
      <div className="grid gap-2">
        {players.map((player, i) => (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 transition-all duration-300",
              player.id === currentPlayerId
                ? "border-cyan-300/30 bg-cyan-300/[0.06]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
            )}
            style={{ animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}
          >
            <AvatarCircle
              name={player.name}
              avatar={player.avatar}
              isConnected={player.isConnected}
              isHost={player.isHost}
            />
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-white/80 truncate">
                {player.name}
                {player.id === currentPlayerId && (
                  <span className="text-white/30 text-xs ml-1">(toi)</span>
                )}
              </p>
              <div className="mt-0.5 flex gap-1.5">
                {(player.isHost || (isSolo && player.id === currentPlayerId)) && (
                  <span className="text-[10px] font-sans font-medium text-cyan-300/60">
                    Host
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {player.isReady && (
                <span
                  className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ animation: "scaleIn 0.3s ease" }}
                />
              )}
              {isHost && !player.isHost && player.id !== currentPlayerId && onKick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/20 hover:bg-red-500/15 hover:text-red-300 press-effect"
                  onClick={() => onKick(player.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
