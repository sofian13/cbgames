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
import { getGameById } from "@/lib/games/registry";
import { addGameResult, getLevel, type GlobalStats } from "@/lib/stores/global-points";
import { useGameStore } from "@/lib/stores/game-store";
import { useKeyedState } from "@/lib/use-keyed-state";
import { cn } from "@/lib/utils";

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
    document.body.classList.add("game-shell-active", "dark");
    return () => {
      document.body.classList.remove("game-shell-active", "dark");
    };
  }, []);

  return (
    <div
      className="relative min-h-[100svh] overflow-hidden dark"
      style={{ background: "var(--bg-deep)", color: "var(--foreground)" }}
    >
      <div className="relative z-10 flex min-h-[100svh] flex-col">
        {!isGameOver && gameMeta && (
          <div className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:px-5">
            <div className="pointer-events-auto mx-auto flex w-full max-w-[1100px] items-center justify-between gap-2">
              <button
                onClick={onReturnToLobby}
                aria-label="Retour au lobby"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition active:scale-95"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "#fff",
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div
                className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full border px-4 py-2 backdrop-blur-md"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    en jeu
                  </p>
                  <p className="truncate text-sm font-bold text-white"
                     style={{ fontFamily: "var(--font-display)" }}>
                    {gameMeta.name}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="cb-mono rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.22em]"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                    }}
                  >
                    {roomCode}
                  </span>
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isConnected ? "" : "cb-live-pulse"
                    )}
                    style={{
                      background: isConnected ? "var(--cb-strategy)" : "var(--cb-social)",
                      boxShadow: isConnected
                        ? "0 0 8px rgba(24,169,87,0.6)"
                        : "0 0 8px rgba(226,52,52,0.6)",
                    }}
                  />
                </div>
              </div>

              {gameMeta.rules ? (
                <button
                  onClick={() => setShowRules(true)}
                  aria-label="Voir les règles"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition active:scale-95"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "#fff",
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                </button>
              ) : (
                <div className="h-10 w-10 shrink-0" />
              )}
            </div>
          </div>
        )}

        <div className="flex w-full flex-1 flex-col px-0 pb-[calc(env(safe-area-inset-bottom,0px)+5.6rem)] pt-16 sm:pb-28 sm:pt-20">
          {isGameOver ? (
            <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
              <div
                className="w-full max-w-lg overflow-hidden rounded-3xl border"
                style={{
                  background: "var(--surface)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                {/* Trophy hero */}
                <div
                  className="relative px-6 pt-7 pb-6 text-center"
                  style={{
                    background: "linear-gradient(180deg, var(--cb-brand-tint), transparent)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background: "radial-gradient(80% 60% at 50% 0%, var(--cb-brand-tint), transparent 65%)",
                    }}
                  />
                  <span className="relative cb-eyebrow"
                        style={{ color: "rgba(255,255,255,0.5)" }}>
                    fin de partie
                  </span>
                  <h2 className="relative cb-display-lg mt-2 text-white">
                    Partie terminée
                  </h2>
                  {gameMeta && (
                    <p
                      className="relative mt-2 text-sm"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      <span className="mr-1.5">{gameMeta.icon}</span>
                      {gameMeta.name}
                    </p>
                  )}
                </div>

                <div className="px-6 py-5">
                  <Scoreboard rankings={rankings} />

                  {pointsEarned != null && level && (
                    <div
                      className="mt-5 rounded-2xl border p-4 text-center"
                      style={{
                        background: "rgba(255,129,87,0.08)",
                        borderColor: "rgba(255,129,87,0.25)",
                      }}
                    >
                      <p
                        className="cb-display-md"
                        style={{ color: "var(--cb-brand)" }}
                      >
                        +{pointsEarned} XP
                      </p>
                      <p
                        className="mt-1 text-xs cb-mono"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        Niveau {level.level} · {level.title}
                      </p>
                      <div
                        className="mt-3 h-1.5 overflow-hidden rounded-full"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${level.progress}%`,
                            background: "var(--cb-brand)",
                          }}
                        />
                      </div>
                      <p
                        className="mt-2 text-[10px] cb-mono"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {stats?.totalPoints} / {level.nextLevelPoints} pts
                      </p>
                    </div>
                  )}

                  {isGuest && (
                    <button
                      onClick={() => signIn("discord")}
                      className="mt-4 w-full rounded-xl border px-4 py-3 transition hover:opacity-90"
                      style={{
                        background: "rgba(88,101,242,0.12)",
                        borderColor: "rgba(88,101,242,0.3)",
                      }}
                    >
                      <div className="flex items-center justify-center gap-2"
                           style={{ color: "#a4adef" }}>
                        <LogIn className="h-4 w-4" />
                        <span className="text-sm font-bold"
                              style={{ fontFamily: "var(--font-display)" }}>
                          Connecter Discord
                        </span>
                      </div>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        pour garder les points
                      </p>
                    </button>
                  )}

                  <div className="mt-4 flex items-center gap-2 mb-3">
                    {/* Player avatars staying */}
                    <div className="flex">
                      {rankings.slice(0, 5).map((r, i) => (
                        <span
                          key={r.playerId}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-black"
                          style={{
                            marginLeft: i === 0 ? 0 : -8,
                            borderColor: "var(--surface)",
                            background: `hsl(${(r.playerId.charCodeAt(0) * 60) % 360}, 70%, 55%)`,
                            color: "#fff",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {r.playerName.slice(0, 2).toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {rankings.length} joueur{rankings.length > 1 ? "s" : ""} restent dans la salle
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={onReturnToLobby}
                      className="cb-btn cb-btn-soft flex-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Lobby
                    </button>
                    {onResetGame && (
                      <button
                        onClick={onResetGame}
                        className="cb-btn cb-btn-brand flex-[2]"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Rejouer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </main>
          ) : (
            <div className="safe-bottom flex min-h-0 flex-1 flex-col pb-20 sm:pb-24">
              {children}
            </div>
          )}
        </div>

        {/* Bottom dock — Lobby + Rejouer + Règles */}
        {!isGameOver && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.95rem)]">
            <div className="pointer-events-auto mx-auto flex w-full max-w-[1100px] justify-center">
              <div
                className="flex items-center gap-1.5 rounded-full border p-1.5 backdrop-blur-md"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                {onResetGame && (
                  <button
                    onClick={onResetGame}
                    title="Relancer"
                    aria-label="Relancer"
                    className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
                    style={{
                      background: "rgba(138,114,255,0.2)",
                      color: "#a78bfa",
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onReturnToLobby}
                  title="Lobby"
                  aria-label="Retour au lobby"
                  className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
                  style={{
                    background: "var(--cb-brand)",
                    color: "var(--cb-brand-ink)",
                  }}
                >
                  <Home className="h-4 w-4" />
                </button>
                {gameMeta?.rules && (
                  <button
                    onClick={() => setShowRules(true)}
                    title="Règles"
                    aria-label="Voir les règles"
                    className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                    }}
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
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center"
            onClick={() => setShowRules(false)}
          >
            <div
              className="w-full max-w-lg rounded-3xl border p-6"
              style={{
                background: "var(--surface)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {gameMeta.icon}
                  </div>
                  <div>
                    <h3 className="cb-display-md text-white">{gameMeta.name}</h3>
                    <p
                      className="mt-1 text-xs cb-mono"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {gameMeta.minPlayers}–{gameMeta.maxPlayers} joueurs
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {gameMeta.rules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl border px-4 py-2.5 text-sm leading-6"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    <span
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--cb-brand)" }}
                    />
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
