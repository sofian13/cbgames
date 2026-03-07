"use client";

import { X } from "lucide-react";
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
    <section className="site-panel rounded-[1.8rem] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="section-title">Joueurs</p>
          <p className="mt-1 text-sm text-white/55">
            {connectedPlayers.length} connecte{connectedPlayers.length > 1 ? "s" : ""}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/45">
          {players.length}/8
        </span>
      </div>

      <div className="space-y-3">
        {players.map((player) => (
          <article
            key={player.id}
            className={cn(
              "site-panel-soft rounded-[1.4rem] p-3",
              player.id === currentPlayerId && "border-cyan-300/24 bg-cyan-300/[0.06]"
            )}
          >
            <div className="flex items-center gap-3">
              <AvatarCircle
                name={player.name}
                avatar={player.avatar}
                isConnected={player.isConnected}
                isHost={player.isHost}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/88">
                  {player.name}
                  {player.id === currentPlayerId && (
                    <span className="ml-1 text-white/34">(toi)</span>
                  )}
                </p>

                <div className="mt-1 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-white/36">
                  {(player.isHost || (isSolo && player.id === currentPlayerId)) && (
                    <span className="rounded-full border border-amber-200/18 bg-amber-300/10 px-2 py-1 text-amber-200/85">
                      Host
                    </span>
                  )}
                  {player.isReady && (
                    <span className="rounded-full border border-emerald-300/16 bg-emerald-300/10 px-2 py-1 text-emerald-200/85">
                      Pret
                    </span>
                  )}
                  {!player.isConnected && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-white/32">
                      Hors ligne
                    </span>
                  )}
                </div>
              </div>

              {isHost && !player.isHost && player.id !== currentPlayerId && onKick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.04] text-white/36 transition hover:border-red-400/26 hover:bg-red-400/8 hover:text-red-300"
                  onClick={() => onKick(player.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
