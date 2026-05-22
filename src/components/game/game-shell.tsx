"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowLeft, BookOpen, Home, LogIn, RotateCcw, X } from "lucide-react";
import { Scoreboard } from "./scoreboard";
import { getGameById } from "@/lib/games/registry";
import { addGameResult, getLevel, type GlobalStats } from "@/lib/stores/global-points";
import { useGameStore } from "@/lib/stores/game-store";
import { useKeyedState } from "@/lib/use-keyed-state";
import { cn } from "@/lib/utils";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";

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

// Deterministic color per playerId so each player gets a stable blob color
const COLORS: MascotColor[] = ["purple", "pink", "yellow", "mint", "sky", "coral", "lavender"];
function colorFor(id: string): MascotColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

export function GameShell({
  roomCode, gameId, playerId, playerName, isGuest,
  children, onReturnToLobby, onResetGame,
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
    if (!isGameOver) recordedResultRef.current = "";
  }, [isGameOver]);

  useEffect(() => {
    document.body.classList.add("game-shell-active", "dark");
    return () => { document.body.classList.remove("game-shell-active", "dark"); };
  }, []);

  // Podium config — top 3 in order 2nd, 1st, 3rd for visual placement
  const top3 = rankings.slice(0, 3);
  const others = rankings.slice(3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const PODIUM_BG: Record<number, string> = {
    1: "linear-gradient(180deg, #FFD23F 0%, #B27800 100%)",
    2: "linear-gradient(180deg, #E8E8E8 0%, #888 100%)",
    3: "linear-gradient(180deg, #FF8B5C 0%, #A04020 100%)",
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden text-white">
      <div className="relative z-10 flex min-h-[100svh] flex-col">

        {/* TOP BAR (only when not game-over) */}
        {!isGameOver && gameMeta && (
          <div className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:px-5">
            <div className="pointer-events-auto mx-auto flex w-full max-w-[1100px] items-center justify-between gap-2">
              <button onClick={onReturnToLobby} aria-label="Retour au lobby"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition active:scale-95"
                style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.12)", color: "#fff" }}>
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full border px-4 py-2 backdrop-blur-md"
                   style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.12)" }}>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.5)" }}>en jeu</p>
                  <p className="truncate text-sm font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{gameMeta.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="cb-mono rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.22em]"
                        style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>{roomCode}</span>
                  <span className={cn("h-2 w-2 rounded-full", isConnected ? "" : "cb-live-pulse")}
                        style={{ background: isConnected ? "var(--af-mint)" : "var(--af-coral)", boxShadow: `0 0 8px ${isConnected ? "rgba(61,220,151,0.6)" : "rgba(255,107,91,0.6)"}` }} />
                </div>
              </div>

              {gameMeta.rules ? (
                <button onClick={() => setShowRules(true)} aria-label="Voir les règles"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition active:scale-95"
                  style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.12)", color: "#fff" }}>
                  <BookOpen className="h-4 w-4" />
                </button>
              ) : (<div className="h-10 w-10 shrink-0" />)}
            </div>
          </div>
        )}

        <div className="flex w-full flex-1 flex-col px-0 pb-[calc(env(safe-area-inset-bottom,0px)+5.6rem)] pt-16 sm:pb-28 sm:pt-20">
          {isGameOver ? (
            <main className="relative flex flex-1 items-center justify-center p-4 sm:p-6">
              <ConfettiBurst count={60} />
              <Sparkles count={14} />

              <div className="relative w-full max-w-2xl">
                {/* HERO — winner reveal */}
                <div className="text-center mb-6">
                  <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>✦ Partie terminée</p>
                  {top3[0] && (
                    <h2 className="cb-display-xl mt-2" style={{ letterSpacing: -2, fontSize: "clamp(2.5rem, 7vw, 4.5rem)", lineHeight: 0.92 }}>
                      <span style={{
                        background: "linear-gradient(120deg, var(--af-yellow), var(--af-pink))",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      }}>{top3[0].playerName}</span> l&apos;emporte !
                    </h2>
                  )}
                  {gameMeta && (
                    <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
                      <span className="mr-1.5">{gameMeta.icon}</span>{gameMeta.name}
                    </p>
                  )}
                </div>

                {/* PODIUM */}
                {top3.length >= 3 && (
                  <div className="grid grid-cols-3 items-end gap-3 sm:gap-5 mb-6">
                    {podiumOrder.map((p) => {
                      if (!p) return null;
                      const place = p.rank;
                      const heights: Record<number, number> = { 1: 130, 2: 100, 3: 80 };
                      const color = colorFor(p.playerId);
                      return (
                        <div key={p.playerId} className="flex flex-col items-center">
                          <Mascot size={place === 1 ? 90 : 64}
                                  color={color} mood="happy" arms
                                  cheering={place === 1} crown={place === 1}
                                  delay={place * 0.15} />
                          <div className="mt-2 flex w-full flex-col items-center justify-center rounded-t-2xl border border-b-0 pt-3"
                               style={{
                                 height: heights[place],
                                 background: PODIUM_BG[place],
                                 borderColor: "rgba(255,255,255,0.18)",
                               }}>
                            <div className="cb-display-lg" style={{ fontSize: place === 1 ? 36 : 26, color: place === 1 ? "#3A2700" : "rgba(0,0,0,0.6)", lineHeight: 1 }}>
                              {place}
                            </div>
                            <div className="mt-1 text-xs font-bold" style={{ color: place === 1 ? "#3A2700" : "rgba(0,0,0,0.7)" }}>{p.playerName}</div>
                            <div className="cb-mono text-[10px]" style={{ color: place === 1 ? "rgba(58,39,0,0.7)" : "rgba(0,0,0,0.55)" }}>{p.score} pts</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SCOREBOARD fallback for <3 players */}
                {top3.length < 3 && (
                  <div className="af-card-glass p-5 mb-4">
                    <Scoreboard rankings={rankings} />
                  </div>
                )}

                {/* XP CARD */}
                {pointsEarned != null && level && (
                  <div className="relative overflow-hidden rounded-3xl p-5 mb-4"
                       style={{
                         background: "rgba(255,210,63,0.10)",
                         border: "1.5px solid rgba(255,210,63,0.35)",
                       }}>
                    <div className="absolute -right-3 -top-3 text-7xl opacity-25">★</div>
                    <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>+ Points gagnés</p>
                    <div className="cb-display-xl mt-2" style={{ fontSize: 56, letterSpacing: -1.5, lineHeight: 1 }}>
                      <span style={{ color: "var(--af-yellow)" }}>+{pointsEarned}</span> XP
                    </div>

                    <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.3)" }}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm" style={{ color: "var(--text-dim)" }}>
                          Niveau {level.level} · {level.title}
                        </span>
                        <span className="cb-mono text-xs" style={{ color: "var(--text-muted)" }}>
                          {stats?.totalPoints} / {level.nextLevelPoints}
                        </span>
                      </div>
                      <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
                        <div className="absolute inset-0 rounded-full"
                             style={{
                               width: `${level.progress}%`,
                               background: "linear-gradient(90deg, var(--cb-brand), var(--af-pink), var(--af-yellow))",
                               boxShadow: "0 0 14px rgba(255,210,63,0.5)",
                             }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* OTHER PLAYERS */}
                {others.length > 0 && (
                  <div className="af-card-glass p-4 mb-4">
                    <p className="af-eyebrow mb-2">Autres joueurs</p>
                    {others.map((p, i) => {
                      const color = colorFor(p.playerId);
                      return (
                        <div key={p.playerId} className="flex items-center gap-3 py-2"
                             style={{ borderBottom: i < others.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <span className="w-6 font-bold" style={{ color: "var(--text-muted)" }}>{p.rank}</span>
                          <MascotAvatar color={color} size={32} mood="neutral" />
                          <span className="flex-1 text-sm font-semibold">{p.playerName}</span>
                          <span className="cb-mono text-sm font-bold" style={{ color: "var(--text-dim)" }}>{p.score}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Discord prompt for guests */}
                {isGuest && (
                  <button onClick={() => signIn("discord")}
                          className="mb-4 w-full rounded-2xl border px-4 py-3 transition hover:opacity-90"
                          style={{ background: "rgba(88,101,242,0.12)", borderColor: "rgba(88,101,242,0.3)" }}>
                    <div className="flex items-center justify-center gap-2" style={{ color: "#a4adef" }}>
                      <LogIn className="h-4 w-4" />
                      <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>Connecter Discord</span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>pour garder les points</p>
                  </button>
                )}

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button onClick={onReturnToLobby} className="cb-btn cb-btn-soft flex-1">
                    <ArrowLeft className="h-4 w-4" /> Lobby
                  </button>
                  {onResetGame && (
                    <button onClick={onResetGame} className="cb-btn cb-btn-brand flex-[2]">
                      <RotateCcw className="h-4 w-4" /> Rejouer
                    </button>
                  )}
                </div>
              </div>
            </main>
          ) : (
            <div className="safe-bottom flex min-h-0 flex-1 flex-col pb-20 sm:pb-24">
              {children}
            </div>
          )}
        </div>

        {/* BOTTOM DOCK */}
        {!isGameOver && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.95rem)]">
            <div className="pointer-events-auto mx-auto flex w-full max-w-[1100px] justify-center">
              <div className="flex items-center gap-1.5 rounded-full border p-1.5 backdrop-blur-md"
                   style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.1)" }}>
                {onResetGame && (
                  <button onClick={onResetGame} title="Relancer" aria-label="Relancer"
                          className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
                          style={{ background: "rgba(181,161,255,0.2)", color: "var(--af-lavender)" }}>
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button onClick={onReturnToLobby} title="Lobby" aria-label="Retour au lobby"
                        className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
                        style={{ background: "var(--cb-brand)", color: "#fff" }}>
                  <Home className="h-4 w-4" />
                </button>
                {gameMeta?.rules && (
                  <button onClick={() => setShowRules(true)} title="Règles" aria-label="Voir les règles"
                          className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}>
                    <BookOpen className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RULES MODAL */}
        {showRules && gameMeta && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center"
               onClick={() => setShowRules(false)}>
            <div className="w-full max-w-lg rounded-3xl border p-6"
                 style={{ background: "var(--surface)", borderColor: "rgba(255,255,255,0.08)" }}
                 onClick={(e) => e.stopPropagation()}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                       style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {gameMeta.icon}
                  </div>
                  <div>
                    <h3 className="cb-display-md">{gameMeta.name}</h3>
                    <p className="cb-mono mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {gameMeta.minPlayers}–{gameMeta.maxPlayers} joueurs
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowRules(false)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border"
                        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {gameMeta.rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-xl border px-4 py-2.5 text-sm leading-6"
                       style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)" }}>
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--cb-brand)" }} />
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
