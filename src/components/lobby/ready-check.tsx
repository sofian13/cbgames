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
    <section className="site-panel rounded-[1.6rem] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="section-title">Lancement</p>
          <p className="mt-1 text-sm text-[color:var(--text-dim)]">
            {selectedGameId ? "Le jeu est choisi." : "Selectionne un jeu pour continuer."}
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--line-brand)] bg-[rgba(46,124,255,0.08)] px-3 py-1 text-xs font-mono font-semibold text-[color:var(--brand-light)]">
          {readyCount}/{connectedPlayers.length} prets
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[color:var(--brand)] via-[color:var(--brand-accent)] to-[color:var(--brand-2)] shadow-[0_0_12px_var(--glow-brand)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-4 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--brand)]">Statut</p>
        <p className="mt-2 text-base font-semibold text-white sm:text-lg">
          {effectiveIsHost
            ? selectedGameId
              ? "Tu peux lancer la partie."
              : "Choisis un jeu pour lancer."
            : currentPlayer?.isReady
              ? "Tu es pret."
              : "Signale quand tu es pret."}
        </p>
      </div>

      <div className="space-y-3">
        {!effectiveIsHost && (
          <button
            onClick={onToggleReady}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold transition",
              currentPlayer?.isReady
                ? "border border-white/10 bg-white/[0.05] text-white/72 hover:border-[color:var(--brand)] hover:text-white"
                : "btn-brand"
            )}
          >
            <Check className="h-4 w-4" />
            {currentPlayer?.isReady ? "Retirer mon ready" : "Je suis pret"}
          </button>
        )}

        {effectiveIsHost && (
          <button
            onClick={() => onStartGame(normalizedGameId)}
            disabled={!canStart}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold transition",
              canStart
                ? "btn-brand"
                : "border border-white/10 bg-white/[0.04] text-white/30 cursor-not-allowed"
            )}
          >
            <Play className="h-4 w-4" />
            {!selectedGameId ? "Choisir un jeu" : "Lancer la partie"}
          </button>
        )}
      </div>
    </section>
  );
}
