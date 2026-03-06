"use client";

import { Button } from "@/components/ui/button";
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
    <div className="premium-panel-soft flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex items-center justify-between text-sm text-white/55">
        <span>
          {readyCount}/{connectedPlayers.length} joueurs prêts
        </span>
        {!selectedGameId && (
          <span className="text-cyan-200/75">Aucun jeu sélectionné</span>
        )}
      </div>

      <div className="flex gap-2">
        {!effectiveIsHost && (
          <Button
            onClick={onToggleReady}
            variant={currentPlayer?.isReady ? "secondary" : "default"}
            className="flex-1"
          >
            {currentPlayer?.isReady ? "Pas prêt" : "Prêt !"}
          </Button>
        )}

        {effectiveIsHost && (
          <Button
            onClick={() => onStartGame(normalizedGameId)}
            disabled={!canStart}
            className="flex-1"
          >
            {!selectedGameId
              ? "Choisis un jeu"
              : "Lancer la partie"}
          </Button>
        )}
      </div>
    </div>
  );
}

