"use client";

import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/party/message-types";
import { getGameById } from "@/lib/games/registry";

interface ReadyCheckProps {
  players: Player[];
  currentPlayerId: string;
  selectedGameId: string | null;
  isHost: boolean;
  onToggleReady: () => void;
  onStartGame: () => void;
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
  const readyCount = connectedPlayers.filter((p) => p.isReady || p.isHost).length;
  const allReady = readyCount === connectedPlayers.length;
  const normalizedGameId = selectedGameId?.trim().toLowerCase() ?? null;
  const soloGameIds = new Set(["motion-tennis", "undercover", "chess"]);
  const minPlayers = normalizedGameId
    ? soloGameIds.has(normalizedGameId)
      ? 1
      : (getGameById(normalizedGameId)?.minPlayers ?? 2)
    : 2;
  const canStart = isHost && allReady && selectedGameId && connectedPlayers.length >= minPlayers;

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
        {!isHost && (
          <Button
            onClick={onToggleReady}
            variant={currentPlayer?.isReady ? "secondary" : "default"}
            className="flex-1"
          >
            {currentPlayer?.isReady ? "Pas prêt" : "Prêt !"}
          </Button>
        )}

        {isHost && (
          <Button
            onClick={onStartGame}
            disabled={!canStart}
            className="flex-1"
          >
            {!selectedGameId
              ? "Choisis un jeu"
              : !allReady
                ? "En attente..."
                : connectedPlayers.length < minPlayers
                  ? `Il faut ${minPlayers} joueurs minimum`
                  : "Lancer la partie"}
          </Button>
        )}
      </div>
    </div>
  );
}

