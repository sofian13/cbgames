"use client";

import { X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onKick?: (playerId: string) => void;
}

// Deterministic color from a player name
function colorFor(name: string): string {
  const palette = ["#FF6A3D", "#2B6DE8", "#18A957", "#E63CA0", "#6B4FE8", "#E89A2B", "#00B3A6", "#E23434"];
  const hash = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PlayerList({ players, currentPlayerId, isHost, onKick }: PlayerListProps) {
  const connectedPlayers = players.filter((player) => player.isConnected);
  const isSolo = connectedPlayers.length === 1 && connectedPlayers[0]?.id === currentPlayerId;

  return (
    <section
      className="rounded-2xl border bg-[color:var(--surface)] p-4 sm:p-5"
      style={{ borderColor: "var(--line-soft)" }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <span className="cb-eyebrow">joueurs</span>
          <h3 className="cb-display-md mt-1">
            {connectedPlayers.length} connecté{connectedPlayers.length > 1 ? "s" : ""}
          </h3>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-xs cb-mono font-bold"
          style={{
            borderColor: "var(--line-soft)",
            color: "var(--text-dim)",
          }}
        >
          {players.length}/8
        </span>
      </div>

      <div className="space-y-2">
        {players.map((player) => {
          const bg = colorFor(player.name);
          const youHost = player.isHost || (isSolo && player.id === currentPlayerId);
          return (
            <article
              key={player.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors"
              )}
              style={{
                background: player.id === currentPlayerId
                  ? "var(--cb-brand-tint)"
                  : "var(--surface-2)",
                borderColor: player.id === currentPlayerId
                  ? "var(--line-brand)"
                  : "var(--line-soft)",
              }}
            >
              <div className="relative shrink-0">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black",
                    !player.isConnected && "opacity-45 grayscale"
                  )}
                  style={{
                    background: bg,
                    color: "#fff",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {initialsOf(player.name)}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                  style={{
                    background: player.isConnected ? "var(--cb-strategy)" : "var(--text-muted)",
                    borderColor: "var(--surface)",
                  }}
                />
                {youHost && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    <Crown className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {player.name}
                  {player.id === currentPlayerId && (
                    <span
                      className="ml-1.5 text-xs font-normal"
                      style={{ color: "var(--text-dim)" }}
                    >
                      (toi)
                    </span>
                  )}
                </p>

                <div className="mt-0.5 flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                  {youHost && (
                    <span
                      className="rounded-full px-1.5 py-0.5"
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                      }}
                    >
                      HOST
                    </span>
                  )}
                  {player.isReady && !youHost && (
                    <span
                      className="rounded-full px-1.5 py-0.5"
                      style={{
                        background: "var(--cb-strategy)",
                        color: "#fff",
                      }}
                    >
                      PRÊT
                    </span>
                  )}
                  {!player.isConnected && (
                    <span
                      className="rounded-full border px-1.5 py-0.5"
                      style={{
                        borderColor: "var(--line-soft)",
                        color: "var(--text-muted)",
                      }}
                    >
                      OFFLINE
                    </span>
                  )}
                </div>
              </div>

              {isHost && !player.isHost && player.id !== currentPlayerId && onKick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onKick(player.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
