"use client";

import { Button } from "@/components/ui/button";
import { Play, Check } from "lucide-react";
import type { Player } from "@/lib/party/message-types";

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
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-sans">
        <span className="text-white/35">
          {readyCount}/{connectedPlayers.length} prets
        </span>
        {!selectedGameId && (
          <span className="text-cyan-300/50">Aucun jeu choisi</span>
        )}
      </div>

      <div className="flex gap-2">
        {!effectiveIsHost && (
          <Button
            onClick={onToggleReady}
            variant={currentPlayer?.isReady ? "secondary" : "default"}
            className="flex-1 gap-2"
          >
            <Check className="h-4 w-4" />
            {currentPlayer?.isReady ? "Pas pret" : "Pret !"}
          </Button>
        )}

        {effectiveIsHost && (
          <Button
            onClick={() => onStartGame(normalizedGameId)}
            disabled={!canStart}
            className="flex-1 gap-2"
          >
            <Play className="h-4 w-4" />
            {!selectedGameId ? "Choisis un jeu" : "Lancer la partie"}
          </Button>
        )}
      </div>
    </div>
  );
}
