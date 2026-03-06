"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Scoreboard } from "./scoreboard";
import { useGameStore } from "@/lib/stores/game-store";
import { EmberParticles, FilmGrain, EmberKeyframes } from "@/components/shared/ember";
import { addGameResult, getLevel, type GlobalStats } from "@/lib/stores/global-points";
import { getGameById } from "@/lib/games/registry";
import { signIn } from "next-auth/react";
import { ArrowLeft, BookOpen, X, LogIn, Home, RotateCcw } from "lucide-react";

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

export function GameShell({ roomCode, gameId, playerId, playerName, isGuest, children, onReturnToLobby, onResetGame }: GameShellProps) {
  const { isGameOver, rankings, isConnected } = useGameStore();
  const mouseRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [showRules, setShowRules] = useState(false);
  const pointsRecordedRef = useRef(false);

  const gameMeta = getGameById(gameId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Record global points when game ends
  useEffect(() => {
    if (isGameOver && rankings.length > 0 && playerId && !pointsRecordedRef.current) {
      pointsRecordedRef.current = true;
      const myRanking = rankings.find((r) => r.playerId === playerId);
      if (myRanking) {
        addGameResult(playerId, playerName, myRanking.rank, myRanking.score).then((result) => {
          setPointsEarned(result.earnedPoints);
          setStats(result.stats);
        });
      }
    }
  }, [isGameOver, rankings, playerId, playerName]);

  const level = stats ? getLevel(stats.totalPoints) : null;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(125% 85% at 50% -10%, rgba(255,138,61,0.16) 0%, transparent 58%), radial-gradient(90% 80% at 100% 0%, rgba(110,228,247,0.11) 0%, transparent 56%), linear-gradient(180deg, #05070f 0%, #09111f 52%, #060913 100%)",
      }}
    >
      <FilmGrain />
      <EmberParticles mouse={mouseRef} count={isGameOver ? 30 : 15} />
      <EmberKeyframes />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header roomCode={roomCode} isConnected={isConnected} />

        {/* Floating action buttons (during game, not game over) */}
        {!isGameOver && (
          <div className="fixed inset-x-4 top-[5rem] z-50 flex flex-wrap justify-end gap-2 sm:inset-x-auto sm:right-4">
            {/* Reset game to initial screen */}
            {onResetGame && (
              <button
                onClick={onResetGame}
                className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#081224]/72 px-3.5 py-2 text-xs font-semibold text-white/64 backdrop-blur-md transition-all hover:border-[#72e4f7]/28 hover:bg-[#72e4f7]/12 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Relancer
              </button>
            )}
            {/* Return to lobby button */}
            <button
              onClick={onReturnToLobby}
              className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#081224]/72 px-3.5 py-2 text-xs font-semibold text-white/64 backdrop-blur-md transition-all hover:border-[#72e4f7]/28 hover:bg-[#72e4f7]/12 hover:text-white"
            >
              <Home className="h-3.5 w-3.5" />
              Menu des jeux
            </button>
            {/* Rules button */}
            {gameMeta?.rules && (
              <button
                onClick={() => setShowRules(true)}
                className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#081224]/72 px-3.5 py-2 text-xs font-semibold text-white/64 backdrop-blur-md transition-all hover:border-[#72e4f7]/28 hover:bg-[#72e4f7]/12 hover:text-white"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Regles
              </button>
            )}
          </div>
        )}

        {/* Rules modal */}
        {showRules && gameMeta && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-md" onClick={() => setShowRules(false)}>
            <div
              className="premium-panel mesh-surface relative mx-4 w-full max-w-lg rounded-[2rem] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowRules(false)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/35 transition hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-3xl">
                  {gameMeta.icon}
                </div>
                <div>
                  <p className="section-title">Guide rapide</p>
                  <h3 className="mt-2 text-2xl font-black text-white/92">{gameMeta.name}</h3>
                  <p className="text-[11px] text-white/30 font-sans">{gameMeta.minPlayers}-{gameMeta.maxPlayers} joueurs</p>
                </div>
              </div>
              <ul className="space-y-3">
                {gameMeta.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-[13px] text-white/62 font-sans leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#72e4f7]" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {isGameOver && (
          <main className="flex flex-1 items-center justify-center p-4">
            <div
              className="premium-panel mesh-surface w-full max-w-md space-y-6 rounded-[2rem] p-6"
              style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1)" }}
            >
              <div className="text-center space-y-1">
                <h2 className="text-3xl font-black text-white/92 premium-text-glow">
                  Partie terminee !
                </h2>
                {gameMeta && (
                  <p className="text-sm text-white/34 font-sans">{gameMeta.icon} {gameMeta.name}</p>
                )}
              </div>

              <Scoreboard rankings={rankings} />

              {/* Global points earned */}
              {pointsEarned != null && level && (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 text-center space-y-3">
                  <p className="text-lg font-black text-[#ffd1af]">
                    +{pointsEarned} points
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-white/30 font-sans">Niv. {level.level}</span>
                    <span className="text-xs font-semibold text-white/60 font-sans">{level.title}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#72e4f7] via-[#f3c56d] to-[#ff8a3d] transition-all duration-1000"
                      style={{ width: `${level.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/20 font-mono">
                    {stats?.totalPoints} / {level.nextLevelPoints} pts
                  </p>
                </div>
              )}

              {/* Guest warning */}
              {isGuest && (
                <button
                  onClick={() => signIn("discord")}
                  className="group w-full rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/[0.06] p-3 text-center transition-all hover:bg-[#5865F2]/[0.12]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4 text-[#5865F2]/60 group-hover:text-[#5865F2]/90" />
                    <span className="text-sm text-[#5865F2]/70 font-sans group-hover:text-[#5865F2]/90">
                      Connecte-toi avec Discord
                    </span>
                  </div>
                  <p className="text-[10px] text-white/20 font-sans mt-1">
                    pour sauvegarder tes points
                  </p>
                </button>
              )}

              <Button
                onClick={onReturnToLobby}
                className="w-full gap-2"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au menu des jeux
              </Button>
            </div>
          </main>
        )}
        {/* Always render children to keep useGame hook mounted */}
        <div className={`flex flex-1 flex-col ${isGameOver ? "hidden" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
