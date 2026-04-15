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
    <section className="site-panel rounded-[1.6rem] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="section-title">Joueurs</p>
          <p className="mt-1 text-sm text-[color:var(--text-dim)]">
            {connectedPlayers.length} connecte{connectedPlayers.length > 1 ? "s" : ""}
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--line-brand)] bg-[rgba(46,124,255,0.08)] px-3 py-1 text-xs font-mono font-semibold text-[color:var(--brand-light)]">
          {players.length}/8
        </span>
      </div>

      <div className="space-y-3">
        {players.map((player) => (
          <article
            key={player.id}
            className={cn(
              "site-panel-soft rounded-[1.25rem] p-3.5 transition-colors",
              player.id === currentPlayerId &&
                "border-[color:var(--brand)] bg-[rgba(46,124,255,0.08)] shadow-[0_0_0_1px_rgba(46,124,255,0.18)]"
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
                <p className="truncate text-sm font-semibold text-white/95">
                  {player.name}
                  {player.id === currentPlayerId && (
                    <span className="ml-1 text-white/38">(toi)</span>
                  )}
                </p>

                <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-white/38">
                  {(player.isHost || (isSolo && player.id === currentPlayerId)) && (
                    <span className="rounded-full border border-[color:var(--line-violet)] bg-[rgba(139,92,246,0.14)] px-2 py-0.5 text-[color:var(--brand-accent)]">
                      Host
                    </span>
                  )}
                  {player.isReady && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-emerald-200/90">
                      Pret
                    </span>
                  )}
                  {!player.isConnected && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/35">
                      Hors ligne
                    </span>
                  )}
                </div>
              </div>

              {isHost && !player.isHost && player.id !== currentPlayerId && onKick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.04] text-white/38 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
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
