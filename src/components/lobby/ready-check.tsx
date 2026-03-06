"use client";

import { Check, Play, ShieldCheck } from "lucide-react";
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
  const progress = connectedPlayers.length > 0 ? (readyCount / connectedPlayers.length) * 100 : 0;

  return (
    <section className="premium-panel-soft rounded-[1.75rem] p-4" style={{ animation: "fadeUp 0.5s ease 0.2s both" }}>
      <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div>
          <p className="section-title">Ready check</p>
          <h3 className="mt-2 text-xl font-black text-white">Feu vert pour lancer</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/32">Etat</p>
          <p className="mt-1 text-sm font-semibold text-white/82">{readyCount}/{connectedPlayers.length || 0}</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white/84">
                {selectedGameId ? "Jeu selectionne" : "Aucun jeu selectionne"}
              </p>
              <p className="mt-1 text-sm text-white/44">
                {selectedGameId
                  ? "Le host peut lancer des que la room est prete."
                  : "Choisis un jeu pour debloquer le lancement."}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/48">
              <ShieldCheck className="h-3.5 w-3.5 text-[#72e4f7]" />
              lobby sync
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#72e4f7] via-[#f3c56d] to-[#ff8a3d] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {!effectiveIsHost && (
            <button
              onClick={onToggleReady}
              className={cn(
                "press-effect flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-all duration-300",
                currentPlayer?.isReady
                  ? "border-white/12 bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
                  : "border-[#72e4f7]/24 bg-[#72e4f7]/14 text-[#e0fbff] hover:bg-[#72e4f7]/18"
              )}
            >
              <Check className="h-4 w-4" />
              {currentPlayer?.isReady ? "Pas pret" : "Pret"}
            </button>
          )}

          {effectiveIsHost && (
            <button
              onClick={() => onStartGame(normalizedGameId)}
              disabled={!canStart}
              className={cn(
                "press-effect flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-black uppercase tracking-[0.14em] transition-all duration-300",
                canStart
                  ? "border-[#ffb98c]/35 bg-gradient-to-r from-[#ff8a3d] via-[#ff7a48] to-[#ff5d67] text-[#180b04] shadow-[0_18px_34px_rgba(255,118,63,0.28)]"
                  : "cursor-not-allowed border-white/10 bg-white/[0.04] text-white/28"
              )}
            >
              <Play className="h-4 w-4" />
              {!selectedGameId ? "Choisis un jeu" : "Lancer"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
