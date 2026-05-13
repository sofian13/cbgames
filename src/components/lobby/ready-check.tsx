"use client";

import { Check, Play } from "lucide-react";
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
  const currentPlayer = players.find((player) => player.id === currentPlayerId);
  const connectedPlayers = players.filter((player) => player.isConnected);
  const isSolo = connectedPlayers.length === 1 && connectedPlayers[0]?.id === currentPlayerId;
  const effectiveIsHost = isHost || !!currentPlayer?.isHost || isSolo;
  const readyCount = connectedPlayers.filter((player) => player.isReady || player.isHost).length;
  const normalizedGameId = selectedGameId?.trim().toLowerCase() ?? null;
  const canStart = effectiveIsHost && !!selectedGameId && connectedPlayers.length >= 1;
  const progress =
    connectedPlayers.length > 0 ? (readyCount / connectedPlayers.length) * 100 : 0;

  return (
    <section
      className="rounded-2xl border bg-[color:var(--surface)] p-5"
      style={{ borderColor: "var(--line-soft)" }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <span className="cb-eyebrow">lancement</span>
          <h3 className="cb-display-md mt-1">
            {selectedGameId ? "Tout est prêt." : "Choisis un jeu."}
          </h3>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-xs cb-mono font-bold"
          style={{
            background: readyCount === connectedPlayers.length && readyCount > 0
              ? "var(--cb-strategy)"
              : "var(--surface-2)",
            color: readyCount === connectedPlayers.length && readyCount > 0
              ? "#fff"
              : "var(--text-dim)",
            borderColor: "transparent",
          }}
        >
          {readyCount}/{connectedPlayers.length} prêts
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: "var(--cb-brand)",
          }}
        />
      </div>

      <div className="space-y-2">
        {!effectiveIsHost && (
          <button
            onClick={onToggleReady}
            className={cn("cb-btn w-full", currentPlayer?.isReady ? "cb-btn-soft" : "cb-btn-brand")}
          >
            <Check className="h-4 w-4" />
            {currentPlayer?.isReady ? "Retirer mon ready" : "Je suis prêt"}
          </button>
        )}

        {effectiveIsHost && (
          <button
            onClick={() => onStartGame(normalizedGameId)}
            disabled={!canStart}
            className={cn("cb-btn cb-btn-lg w-full", canStart ? "cb-btn-brand" : "cb-btn-soft")}
            style={!canStart ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            <Play className="h-4 w-4 fill-current" />
            {!selectedGameId ? "Choisir un jeu" : "Lancer la partie"}
          </button>
        )}
      </div>
    </section>
  );
}
