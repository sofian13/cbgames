"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Scoreboard } from "./scoreboard";
import { useGameStore } from "@/lib/stores/game-store";
import { EmberParticles, FilmGrain, EmberKeyframes } from "@/components/shared/ember";
import { addGameResult, getLevel, type GlobalStats } from "@/lib/stores/global-points";
import { getGameById } from "@/lib/games/registry";
import { signIn } from "next-auth/react";
import { ArrowLeft, BookOpen, X, LogIn } from "lucide-react";

interface GameShellProps {
  roomCode: string;
  gameId: string;
  playerId: string;
  playerName: string;
  isGuest: boolean;
  children: React.ReactNode;
  onReturnToLobby: () => void;
}

export function GameShell({ roomCode, gameId, playerId, playerName, isGuest, children, onReturnToLobby }: GameShellProps) {
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

  // Record global points when game ends (async — saves to PartyKit durable storage)
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
          "radial-gradient(130% 85% at 50% -10%, rgba(90,160,255,0.2) 0%, transparent 60%), linear-gradient(180deg, #030710 0%, #040b1a 55%, #030710 100%)",
      }}
    >
      <FilmGrain />
      <EmberParticles mouse={mouseRef} count={isGameOver ? 30 : 20} />
      <EmberKeyframes />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header roomCode={roomCode} isConnected={isConnected} />

        {/* Rules button (always visible during game) */}
        {!isGameOver && gameMeta?.rules && (
          <button
            onClick={() => setShowRules(true)}
            className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-xl border border-cyan-300/24 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100/75 backdrop-blur-sm transition-colors hover:text-white hover:bg-cyan-300/20"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Règles
          </button>
        )}

        {/* Rules modal */}
        {showRules && gameMeta && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRules(false)}>
            <div className="premium-panel relative w-full max-w-md mx-4 rounded-2xl border p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowRules(false)} className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{gameMeta.icon}</span>
                <h3 className="text-xl font-serif font-light text-white/90">{gameMeta.name}</h3>
              </div>
              <ul className="space-y-2.5">
                {gameMeta.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/60 font-sans">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember/60" />
                    {rule}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-white/20 font-sans">
                {gameMeta.minPlayers}-{gameMeta.maxPlayers} joueurs
              </p>
            </div>
          </div>
        )}

        {isGameOver && (
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
              <h2 className="text-2xl font-light text-center font-serif text-white/90">
                Partie terminée !
              </h2>
              <Scoreboard rankings={rankings} />

              {/* Global points earned */}
              {pointsEarned != null && level && (
                <div className="premium-panel-soft rounded-2xl p-4 text-center space-y-2">
                  <p className="text-sm text-cyan-300 font-sans font-medium">
                    +{pointsEarned} points globaux
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-white/40 font-sans">Niv. {level.level}</span>
                    <span className="text-xs font-semibold text-white/70 font-sans">{level.title}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-ember/60 transition-all duration-1000"
                      style={{ width: `${level.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/20 font-sans">
                    {stats?.totalPoints} / {level.nextLevelPoints} pts
                  </p>
                </div>
              )}

              {/* Guest warning — encourage Discord login */}
              {isGuest && (
                <button
                  onClick={() => signIn("discord")}
                  className="w-full rounded-lg border border-[#5865F2]/30 bg-[#5865F2]/10 p-3 text-center transition-colors hover:bg-[#5865F2]/20 group"
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4 text-[#5865F2]/70 group-hover:text-[#5865F2]" />
                    <span className="text-sm text-[#5865F2]/80 font-sans group-hover:text-[#5865F2]">
                      Connecte-toi avec Discord
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30 font-sans mt-1">
                    pour sauvegarder tes points sur tous tes appareils
                  </p>
                </button>
              )}

              <Button
                onClick={onReturnToLobby}
                className="w-full gap-2 bg-ember hover:bg-ember-glow text-white border-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au lobby
              </Button>
            </div>
          </main>
        )}
        {/* Always render children to keep useGame hook mounted — prevents store.reset() from clearing isGameOver */}
        <div className={`flex flex-1 flex-col ${isGameOver ? "hidden" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
