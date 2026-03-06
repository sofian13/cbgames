"use client";

import { Play, Check } from "lucide-react";
import type { Player } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

interface ReadyCheckProps {
  players: Player[];
  currentPlayerId: string;
  selectedGameId: string | null;
  isHost: boolean;
  onToggleReady: () => void;
  onStartGame: (gameId?: string | null) => void;
}

export function ReadyCheck({
  players,
  currentPlayerId,
  selectedGameId,
  isHost,
  onToggleReady,
  onStartGame,
}: ReadyCheckProps) {
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const connectedPlayers = players.filter((p) => p.isConnected);
  const isSolo = connectedPlayers.length === 1 && connectedPlayers[0]?.id === currentPlayerId;
  const effectiveIsHost = isHost || !!currentPlayer?.isHost || isSolo;
  const readyCount = connectedPlayers.filter((p) => p.isReady || p.isHost).length;
  const normalizedGameId = selectedGameId?.trim().toLowerCase() ?? null;
  const canStart = effectiveIsHost && !!selectedGameId && connectedPlayers.length >= 1;

  return (
    <div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3 backdrop-blur-sm"
      style={{ animation: "fadeUp 0.5s ease 0.3s both" }}
    >
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="text-white/35">
            {readyCount}/{connectedPlayers.length} prets
          </span>
          {!selectedGameId && (
            <span className="text-cyan-300/50">Aucun jeu choisi</span>
          )}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500 ease-out"
            style={{
              width: connectedPlayers.length > 0
                ? `${(readyCount / connectedPlayers.length) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {!effectiveIsHost && (
          <button
            onClick={onToggleReady}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-sans text-sm font-semibold transition-all duration-300 press-effect",
              currentPlayer?.isReady
                ? "border border-white/15 bg-white/[0.06] text-white/60 hover:bg-white/[0.1]"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_20px_rgba(80,216,255,0.2)] hover:shadow-[0_0_30px_rgba(80,216,255,0.35)]"
            )}
          >
            <Check className="h-4 w-4" />
            {currentPlayer?.isReady ? "Pas pret" : "Pret !"}
          </button>
        )}

        {effectiveIsHost && (
          <button
            onClick={() => onStartGame(normalizedGameId)}
            disabled={!canStart}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-sans text-sm font-semibold transition-all duration-300 press-effect",
              canStart
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_20px_rgba(80,216,255,0.2)] hover:shadow-[0_0_30px_rgba(80,216,255,0.35)]"
                : "border border-white/[0.08] bg-white/[0.03] text-white/25 cursor-not-allowed"
            )}
          >
            <Play className="h-4 w-4" />
            {!selectedGameId ? "Choisis un jeu" : "Lancer la partie"}
          </button>
        )}
      </div>
    </div>
  );
}
