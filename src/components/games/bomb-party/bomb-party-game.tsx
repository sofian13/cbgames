"use client";

import { Flame, Heart, TimerReset, Users } from "lucide-react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { BombPartyInput } from "./bomb-party-input";
import { BombPartyBomb } from "./bomb-party-bomb";
import type { GameProps } from "@/lib/games/types";
import type { BombPartyPlayer, BombPartyState } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

function getTurnDuration(round: number) {
  return Math.max(4, 10 - Math.floor(round / 3));
}

export default function BombPartyGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "bomb-party", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as BombPartyState;

  if (!state || state.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="premium-panel rounded-[2rem] px-6 py-8 text-center">
          <p className="section-title">Bomb Party</p>
          <p className="mt-3 text-lg font-semibold text-white/86">En attente des joueurs...</p>
          <p className="mt-2 text-sm text-white/46">La bombe sera armee des que la partie demarre.</p>
        </div>
      </div>
    );
  }

  const isMyTurn = state.currentPlayerId === playerId;
  const players = state.players ?? [];
  const round = state.round ?? 1;
  const maxTime = getTurnDuration(round);
  const currentPlayer = players.find((player) => player.id === state.currentPlayerId);
  const recentWords = [...(state.usedWords ?? [])].slice(-18).reverse();

  const handleSubmitWord = (word: string) => {
    sendAction({ action: "submit-word", word });
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,138,61,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(110,228,247,0.12),transparent_26%),linear-gradient(180deg,#05070f_0%,#0a1120_48%,#060913_100%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="premium-panel mesh-surface rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-title">Bomb Party</p>
                <h2 className="mt-2 text-3xl font-black text-white">Trouve un mot avant l&apos;explosion.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/54">
                  La syllabe change a chaque manche, le chrono raccourcit et les mots deja joues restent bloques.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Round</p>
                  <p className="mt-2 text-xl font-black text-white">{round}</p>
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Timer</p>
                  <p className="mt-2 text-xl font-black text-white">{maxTime}s</p>
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Mots</p>
                  <p className="mt-2 text-xl font-black text-white">{state.usedWords?.length ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <CountdownTimer timeLeft={state.timeLeft ?? 0} maxTime={maxTime} />

              <BombPartyBomb
                syllable={state.syllable ?? ""}
                timeLeft={state.timeLeft ?? 0}
                isMyTurn={isMyTurn}
              />

              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="section-title">Tour en cours</p>
                    <p className="mt-2 text-lg font-semibold text-white/88">
                      {isMyTurn ? "A toi de poser un mot" : `Tour de ${currentPlayer?.name ?? "..."}`}
                    </p>
                    <p className="mt-1 text-sm text-white/44">
                      {isMyTurn
                        ? "Le mot doit contenir la syllabe affichee."
                        : "Observe la manche et prepare ton prochain mot."}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      isMyTurn
                        ? "border-[#ffb98c]/28 bg-[#ff8a3d]/14 text-[#ffe2cd]"
                        : "border-white/10 bg-black/20 text-white/46"
                    )}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    {isMyTurn ? "Action" : "Attente"}
                  </span>
                </div>
              </div>

              <BombPartyInput
                isMyTurn={isMyTurn}
                syllable={state.syllable ?? ""}
                onSubmit={handleSubmitWord}
              />

              {error && (
                <div className="rounded-[1.4rem] border border-red-400/24 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
            </div>
          </section>

          <aside className="premium-panel-soft rounded-[2rem] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
              <div>
                <p className="section-title">Joueurs</p>
                <h3 className="mt-2 text-2xl font-black text-white">Qui tient encore ?</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Users className="h-5 w-5 text-[#72e4f7]" />
              </div>
            </div>

            <div className="mt-4 grid gap-2.5">
              {players.map((player: BombPartyPlayer) => (
                <div
                  key={player.id}
                  className={cn(
                    "rounded-[1.4rem] border px-4 py-3 transition-all duration-300",
                    player.id === state.currentPlayerId
                      ? "border-[#72e4f7]/25 bg-[#72e4f7]/10"
                      : "border-white/8 bg-white/[0.03]",
                    !player.isAlive && "opacity-45 grayscale"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white/86">
                        {player.name}
                        {player.id === playerId && <span className="ml-1 text-white/32">(toi)</span>}
                      </p>
                      <p className="mt-1 text-xs text-white/38">{player.score} point(s)</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/42">
                      {player.isAlive ? "in" : "out"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <span
                          key={index}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-xl border",
                            index < player.lives
                              ? "border-red-400/18 bg-red-500/12 text-red-200"
                              : "border-white/8 bg-white/[0.03] text-white/18"
                          )}
                        >
                          <Heart className="h-3.5 w-3.5" fill="currentColor" />
                        </span>
                      ))}
                    </div>

                    {player.lastWord && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/54">
                        {player.lastWord}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="premium-panel-soft rounded-[2rem] p-4 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-white/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-title">Historique</p>
              <h3 className="mt-2 text-2xl font-black text-white">Derniers mots valides</h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/46">
              <TimerReset className="h-3.5 w-3.5 text-[#ffb17f]" />
              {recentWords.length} affiches
            </span>
          </div>

          {recentWords.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {recentWords.map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-white/66"
                >
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/42">Aucun mot valide n&apos;a encore ete pose.</p>
          )}
        </section>
      </div>
    </div>
  );
}
