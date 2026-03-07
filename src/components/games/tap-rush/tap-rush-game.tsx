"use client";

import { useCallback } from "react";
import { Gauge, Trophy } from "lucide-react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type {
  TapRushRoundResult,
  TapRushState,
} from "@/lib/party/message-types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

function formatTimer(timeLeftMs: number) {
  return (timeLeftMs / 1000).toFixed(timeLeftMs < 5000 ? 1 : 0);
}

export default function TapRushGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "tap-rush", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as TapRushState;
  const roundKey = state?.round ?? 0;
  const [localTaps, setLocalTaps] = useKeyedState<number>(roundKey, 0);

  const handleTap = useCallback(() => {
    if (state?.status !== "playing") return;

    setLocalTaps((value) => value + 1);
    sendAction({ action: "tap" });
  }, [sendAction, setLocalTaps, state?.status]);

  if (!state || state.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="site-panel w-full max-w-md rounded-[2rem] p-6 text-center">
          <p className="section-title">Tap Rush</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">En attente</h2>
          <p className="mt-3 text-sm text-white/50">
            Des que tout le monde est la, la dalle part.
          </p>
        </div>
      </div>
    );
  }

  const me = state.players?.find((player) => player.id === playerId);
  const myDisplayedTaps = Math.max(localTaps, me?.roundTaps ?? 0);
  const leaders = state.players
    ?.slice()
    .sort((a, b) => b.totalScore - a.totalScore || b.roundTaps - a.roundTaps || a.name.localeCompare(b.name));
  const timerLabel = formatTimer(state.timeLeftMs);
  const progress = state.phaseDurationMs > 0 ? Math.max(0, Math.min(100, (state.timeLeftMs / state.phaseDurationMs) * 100)) : 0;

  if (state.status === "countdown") {
    const countdownValue = Math.max(1, Math.ceil(state.timeLeftMs / 1000));

    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="site-panel w-full max-w-lg rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="site-chip rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
              Manche {state.round}/{state.totalRounds}
            </span>
            <span className="site-chip-cool rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
              pret
            </span>
          </div>

          <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
            <p className="text-sm uppercase tracking-[0.22em] text-white/34">Depart</p>
            <div className="mt-5 flex h-36 w-36 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] shadow-[0_0_60px_rgba(79,209,255,0.18)]">
              <span className="text-6xl font-semibold text-cyan-100">{countdownValue}</span>
            </div>
            <p className="mt-6 text-sm text-white/54">Pose le pouce. Ca part tout de suite.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "playing") {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <section className="site-panel rounded-[2rem] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Tap Rush</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Manche {state.round}/{state.totalRounds}
              </h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">temps</p>
              <p className="text-2xl font-semibold text-white">{timerLabel}s</p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-[#ff8755] to-amber-300 transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <button
          type="button"
          onPointerDown={handleTap}
          className="site-panel site-card-hover relative flex min-h-[20rem] flex-1 flex-col items-center justify-center overflow-hidden rounded-[2.2rem] border border-[#ff8755]/18 bg-[radial-gradient(circle_at_top,rgba(255,135,85,0.22),transparent_42%),radial-gradient(circle_at_bottom,rgba(79,209,255,0.14),transparent_36%)] px-5 py-8 text-center transition active:scale-[0.985]"
          style={{ touchAction: "manipulation" }}
        >
          <div className="absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            tap zone
          </span>
          <p className="mt-6 text-sm uppercase tracking-[0.22em] text-white/34">Score manche</p>
          <p className="mt-3 text-7xl font-semibold tracking-[-0.06em] text-white sm:text-8xl">
            {myDisplayedTaps}
          </p>
          <p className="mt-4 max-w-xs text-sm text-white/54">
            Tape partout sur la dalle tant que le chrono est ouvert.
          </p>

          <div className="mt-8 flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/[0.08] px-4 py-2 text-sm text-cyan-50">
            <Gauge className="h-4 w-4" />
            {me?.totalScore ?? 0} total
          </div>
        </button>

        <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="site-panel-soft rounded-[1.8rem] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Live board</p>
              <span className="text-xs uppercase tracking-[0.18em] text-white/34">
                round taps
              </span>
            </div>

            <div className="space-y-3">
              {leaders?.map((player, index) => {
                const width = myDisplayedTaps > 0 || player.roundTaps > 0
                  ? `${Math.max(18, (player.roundTaps / Math.max(1, leaders[0]?.roundTaps ?? 1)) * 100)}%`
                  : "18%";
                const isMe = player.id === playerId;

                return (
                  <div key={player.id} className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white/35">#{index + 1}</span>
                        <p className={cn("text-sm", isMe ? "font-semibold text-white" : "text-white/68")}>
                          {player.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{player.roundTaps}</p>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/28">
                          {player.totalScore} total
                        </p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-150",
                          isMe
                            ? "bg-gradient-to-r from-cyan-300 to-[#ff8755]"
                            : "bg-white/35"
                        )}
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="site-panel-soft rounded-[1.8rem] p-4">
            <p className="text-sm font-semibold text-white">Ton rythme</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">sur cette manche</p>
                <p className="mt-2 text-4xl font-semibold text-white">{myDisplayedTaps}</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">meilleure manche</p>
                <p className="mt-2 text-4xl font-semibold text-cyan-100">{me?.bestRound ?? 0}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (state.status === "results") {
    const winner = state.roundResults?.[0];

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
        <section className="site-panel w-full max-w-3xl rounded-[2rem] p-5 sm:p-6">
          <div className="text-center">
            <p className="section-title">Resultats</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Manche {state.round}</h2>
            {winner && (
              <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-amber-300/22 bg-amber-300/[0.08] px-4 py-2 text-amber-100">
                <Trophy className="h-4 w-4" />
                {state.players.find((player) => player.id === winner.playerId)?.name ?? "?"} prend la manche
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {state.roundResults?.map((result: TapRushRoundResult) => {
              const player = state.players.find((entry) => entry.id === result.playerId);
              const isMe = result.playerId === playerId;

              return (
                <div
                  key={result.playerId}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-[1.4rem] border p-4",
                    result.rank === 1
                      ? "border-amber-300/20 bg-amber-300/[0.07]"
                      : "border-white/8 bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-white/35">#{result.rank}</span>
                    <div>
                      <p className={cn("text-sm", isMe ? "font-semibold text-white" : "text-white/72")}>
                        {player?.name}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
                        {result.totalScore} total
                      </p>
                    </div>
                  </div>

                  <p className="text-2xl font-semibold text-white">{result.taps}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      {error && (
        <div className="rounded-[1.4rem] border border-red-500/20 bg-red-950/10 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
