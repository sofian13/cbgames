"use client";

import { Crown, Signal, UserX } from "lucide-react";
import { AvatarCircle } from "@/components/shared/avatar-circle";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onKick?: (playerId: string) => void;
}

export function PlayerList({ players, currentPlayerId, isHost, onKick }: PlayerListProps) {
  const connectedPlayers = players.filter((player) => player.isConnected);
  const isSolo = connectedPlayers.length === 1 && connectedPlayers[0]?.id === currentPlayerId;

  return (
    <section className="premium-panel-soft rounded-[1.75rem] p-4" style={{ animation: "slideInRight 0.5s ease" }}>
      <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div>
          <p className="section-title">Joueurs</p>
          <h3 className="mt-2 text-xl font-black text-white">Roster de la room</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/32">Places</p>
          <p className="mt-1 text-sm font-semibold text-white/82">{players.length}/8</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5">
        {players.map((player, index) => {
          const isMe = player.id === currentPlayerId;
          const isActiveHost = player.isHost || (isSolo && isMe);

          return (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-3 rounded-[1.4rem] border px-3 py-3 transition-all duration-300",
                isMe
                  ? "border-[#72e4f7]/28 bg-[#72e4f7]/10"
                  : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]"
              )}
              style={{ animation: `fadeUp 0.4s ease ${index * 0.08}s both` }}
            >
              <AvatarCircle
                name={player.name}
                avatar={player.avatar}
                isConnected={player.isConnected}
                isHost={player.isHost}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white/88">{player.name}</p>
                  {isMe && <span className="text-xs text-white/34">(toi)</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/36">
                  <span className="inline-flex items-center gap-1">
                    <Signal className="h-3 w-3" />
                    {player.isConnected ? "en ligne" : "hors ligne"}
                  </span>
                  {isActiveHost && (
                    <span className="inline-flex items-center gap-1 text-[#ffd3b1]">
                      <Crown className="h-3 w-3" />
                      host
                    </span>
                  )}
                  {player.isReady && <span className="text-[#8ff2bb]">pret</span>}
                </div>
              </div>

              {isHost && !player.isHost && !isMe && onKick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.04] text-white/35 hover:border-red-400/25 hover:bg-red-500/12 hover:text-red-200"
                  onClick={() => onKick(player.id)}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
