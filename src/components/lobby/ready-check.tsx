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

      <p className="mb-3 text-xs" style={{ color: "var(--text-dim)" }}>
        On démarre dès que tout le monde a validé.
      </p>

      <div className="space-y-2">
        {/* Ready toggle — segmented, pour tout le monde */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { if (currentPlayer?.isReady) onToggleReady(); }}
            className="cb-btn"
            style={{
              background: !currentPlayer?.isReady ? "rgba(255,255,255,0.08)" : "transparent",
              border: "1px solid var(--line-soft)",
              color: !currentPlayer?.isReady ? "#fff" : "var(--text-dim)",
            }}
          >
            Pas prêt
          </button>
          <button
            onClick={() => { if (!currentPlayer?.isReady) onToggleReady(); }}
            className={cn("cb-btn", currentPlayer?.isReady ? "cb-btn-brand" : "")}
            style={!currentPlayer?.isReady
              ? { background: "rgba(255,255,255,0.08)", border: "1px solid var(--line-soft)", color: "#fff" }
              : undefined}
          >
            <Check className="h-4 w-4" />
            Je suis prêt
          </button>
        </div>

        {/* Démarrage forcé par l'hôte */}
        {effectiveIsHost && (
          <button
            onClick={() => onStartGame(normalizedGameId)}
            disabled={!canStart}
            className="cb-btn cb-btn-lg w-full"
            style={{
              background: canStart ? "var(--af-yellow)" : "var(--surface-2)",
              color: canStart ? "#3A2700" : "var(--text-dim)",
              boxShadow: canStart ? "0 10px 24px rgba(255,210,63,0.35)" : "none",
              opacity: canStart ? 1 : 0.6,
              cursor: canStart ? "pointer" : "not-allowed",
            }}
          >
            <Play className="h-4 w-4 fill-current" />
            {!selectedGameId ? "Choisir un jeu" : "Forcer le démarrage (Host)"}
          </button>
        )}
      </div>
    </section>
  );
}
