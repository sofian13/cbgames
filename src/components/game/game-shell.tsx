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

  useEffect(() => {
    document.body.classList.add("game-shell-active");
    return () => {
      document.body.classList.remove("game-shell-active");
    };
  }, []);

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-[#050812]">
      <div className="relative z-10 flex min-h-[100svh] flex-col">
        {!isGameOver && gameMeta && (
          <div className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:px-5">
            <div className="pointer-events-auto mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3">
              <button
                onClick={onReturnToLobby}
                className="arcade-float-button shrink-0"
                aria-label="Retour au lobby"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="arcade-header-pill min-w-0 flex-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/34">
                    En jeu
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    {gameMeta.name}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="arcade-meta-chip font-mono text-[11px] font-semibold tracking-[0.22em]">
                    {roomCode}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]"
                        : "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.55)]"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {gameMeta.rules ? (
                <button
                  onClick={() => setShowRules(true)}
                  className="arcade-float-button shrink-0"
                  aria-label="Voir les regles"
                >
                  <BookOpen className="h-4 w-4" />
                </button>
              ) : (
                <div className="h-12 w-12 shrink-0" />
              )}
            </div>
          </div>
        )}

        <div className="flex w-full flex-1 flex-col px-0 pb-[calc(env(safe-area-inset-bottom,0px)+5.6rem)] pt-18 sm:pb-28 sm:pt-20">
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
                      Niveau {level.level} - {level.title}
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
            <div className="safe-bottom flex min-h-0 flex-1 flex-col pb-24 sm:pb-28">
              {children}
            </div>
          )}
        </div>

        {!isGameOver && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.95rem)]">
            <div className="pointer-events-auto mx-auto flex w-full max-w-[1100px] justify-center">
              <div className="arcade-dock">
                {onResetGame && (
                  <button
                    onClick={onResetGame}
                    className="arcade-dock-button bg-[linear-gradient(180deg,rgba(169,101,255,0.92),rgba(127,72,236,0.9))] text-white"
                    aria-label="Relancer"
                    title="Relancer"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={onReturnToLobby}
                  className="arcade-dock-button bg-[linear-gradient(180deg,rgba(253,205,55,0.98),rgba(239,168,18,0.92))] text-slate-950"
                  aria-label="Retour au lobby"
                  title="Lobby"
                >
                  <Home className="h-4 w-4" />
                </button>

                {gameMeta?.rules && (
                  <button
                    onClick={() => setShowRules(true)}
                    className="arcade-dock-button bg-[linear-gradient(180deg,rgba(71,109,255,0.96),rgba(55,76,211,0.92))] text-white"
                    aria-label="Voir les regles"
                    title="Regles"
                  >
                    <BookOpen className="h-4 w-4" />
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
              className="arcade-sheet w-full max-w-lg rounded-[2rem] p-6 sm:p-7"
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
                  className="arcade-float-button h-10 w-10 text-white/72"
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
