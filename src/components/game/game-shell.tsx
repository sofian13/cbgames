"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import {
  ArrowLeft,
  BookOpen,
  Home,
  LogIn,
  RotateCcw,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Scoreboard } from "./scoreboard";
import { Button } from "@/components/ui/button";
import { getGameById } from "@/lib/games/registry";
import { addGameResult, getLevel, type GlobalStats } from "@/lib/stores/global-points";
import { useGameStore } from "@/lib/stores/game-store";
import { useKeyedState } from "@/lib/use-keyed-state";

interface GameShellProps {
  roomCode: string;
  gameId: string;
  playerId: string;
  playerName: string;
  isGuest: boolean;
  children: React.ReactNode;
  onReturnToLobby: () => void;
  onResetGame?: () => void;
}

export function GameShell({
  roomCode,
  gameId,
  playerId,
  playerName,
  isGuest,
  children,
  onReturnToLobby,
  onResetGame,
}: GameShellProps) {
  const { isGameOver, rankings, isConnected } = useGameStore();
  const [showRules, setShowRules] = useState(false);
  const pointsRecordKey = isGameOver
    ? rankings.map((entry) => `${entry.playerId}:${entry.rank}:${entry.score}`).join("|")
    : "active";
  const [pointsEarned, setPointsEarned] = useKeyedState<number | null>(pointsRecordKey, null);
  const [stats, setStats] = useKeyedState<GlobalStats | null>(pointsRecordKey, null);
  const recordedResultRef = useRef<string>("");

  const gameMeta = getGameById(gameId);
  const level = stats ? getLevel(stats.totalPoints) : null;

  useEffect(() => {
    if (!isGameOver || rankings.length === 0 || !playerId) return;
    if (recordedResultRef.current === pointsRecordKey) return;

    const ranking = rankings.find((entry) => entry.playerId === playerId);
    if (!ranking) return;

    recordedResultRef.current = pointsRecordKey;
    addGameResult(playerId, playerName, ranking.rank, ranking.score).then((result) => {
      setPointsEarned(result.earnedPoints);
      setStats(result.stats);
    });
  }, [isGameOver, playerId, playerName, pointsRecordKey, rankings, setPointsEarned, setStats]);

  useEffect(() => {
    if (!isGameOver) {
      recordedResultRef.current = "";
    }
  }, [isGameOver]);

  return (
    <div className="site-shell">
      <div
        className="site-orb h-72 w-72 bg-[#ff8755]/30"
        style={{ left: "-5rem", top: "8rem" }}
      />
      <div
        className="site-orb h-80 w-80 bg-cyan-300/20"
        style={{ right: "-6rem", top: "12rem", animationDelay: "-6s" }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header roomCode={roomCode} isConnected={isConnected} />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-5">
          {!isGameOver && gameMeta && (
            <section className="site-panel mb-4 rounded-[1.8rem] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-3xl">
                    {gameMeta.icon}
                  </div>
                  <div>
                    <p className="section-title">Jeu en cours</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">
                      {gameMeta.name}
                    </h1>
                    <p className="mt-1 text-sm text-white/48">{gameMeta.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="site-chip rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {playerName}
                  </span>
                  <span className="site-chip-cool rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    mobile first
                  </span>
                </div>
              </div>
            </section>
          )}

          {isGameOver ? (
            <main className="flex flex-1 items-center justify-center py-6">
              <div className="site-panel w-full max-w-lg rounded-[2rem] p-5 sm:p-6">
                <div className="mb-6 text-center">
                  <p className="section-title">Fin de partie</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
                    Partie terminee
                  </h2>
                  {gameMeta && (
                    <p className="mt-2 text-sm text-white/45">
                      {gameMeta.icon} {gameMeta.name}
                    </p>
                  )}
                </div>

                <Scoreboard rankings={rankings} />

                {pointsEarned != null && level && (
                  <div className="site-panel-soft mt-5 rounded-[1.6rem] p-5 text-center">
                    <p className="text-2xl font-semibold text-cyan-100">+{pointsEarned} points</p>
                    <p className="mt-1 text-sm text-white/45">
                      Niveau {level.level} · {level.title}
                    </p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-[#ff8755]"
                        style={{ width: `${level.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-white/34">
                      {stats?.totalPoints} / {level.nextLevelPoints} pts
                    </p>
                  </div>
                )}

                {isGuest && (
                  <button
                    onClick={() => signIn("discord")}
                    className="mt-5 w-full rounded-[1.4rem] border border-[#5865F2]/20 bg-[#5865F2]/10 px-4 py-4 text-center transition hover:bg-[#5865F2]/14"
                  >
                    <div className="flex items-center justify-center gap-2 text-[#d9ddff]">
                      <LogIn className="h-4 w-4" />
                      <span className="text-sm font-medium">Connecter Discord</span>
                    </div>
                    <p className="mt-1 text-xs text-white/35">pour garder les points</p>
                  </button>
                )}

                <Button onClick={onReturnToLobby} className="mt-5 w-full gap-2" size="lg">
                  <ArrowLeft className="h-4 w-4" />
                  Retour au lobby
                </Button>
              </div>
            </main>
          ) : (
            <div className="safe-bottom flex flex-1 flex-col pb-24 lg:pb-6">{children}</div>
          )}
        </div>

        {!isGameOver && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:bottom-auto lg:left-auto lg:right-5 lg:top-24 lg:w-auto lg:px-0 lg:pb-0">
            <div className="pointer-events-auto mx-auto flex max-w-6xl justify-end">
              <div className="site-panel flex w-full max-w-lg items-center gap-2 rounded-[1.5rem] p-2 lg:max-w-none">
                {onResetGame && (
                  <button
                    onClick={onResetGame}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-medium text-white/72 transition hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Relancer
                  </button>
                )}

                <button
                  onClick={onReturnToLobby}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-medium text-white/72 transition hover:text-white"
                >
                  <Home className="h-4 w-4" />
                  Lobby
                </button>

                {gameMeta?.rules && (
                  <button
                    onClick={() => setShowRules(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[1rem] border border-cyan-300/18 bg-cyan-300/[0.08] px-3 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/[0.12]"
                  >
                    <BookOpen className="h-4 w-4" />
                    Regles
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showRules && gameMeta && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/72 p-4 backdrop-blur-md sm:items-center"
            onClick={() => setShowRules(false)}
          >
            <div
              className="site-panel w-full max-w-lg rounded-[2rem] p-6 sm:p-7"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-3xl">
                    {gameMeta.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{gameMeta.name}</h3>
                    <p className="mt-1 text-sm text-white/45">
                      {gameMeta.minPlayers}-{gameMeta.maxPlayers} joueurs
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowRules(false)}
                  className="rounded-full border border-white/10 bg-white/[0.05] p-2 text-white/42 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {gameMeta.rules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/72"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/70" />
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
