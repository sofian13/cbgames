"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Scoreboard } from "./scoreboard";
import { useGameStore } from "@/lib/stores/game-store";
import { EmberParticles, FilmGrain, EmberKeyframes } from "@/components/shared/ember";
import { ArrowLeft } from "lucide-react";

interface GameShellProps {
  roomCode: string;
  gameId: string;
  children: React.ReactNode;
  onReturnToLobby: () => void;
}

export function GameShell({ roomCode, children, onReturnToLobby }: GameShellProps) {
  const { isGameOver, rankings, isConnected } = useGameStore();
  const mouseRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  if (isGameOver) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ background: "#060606" }}>
        <FilmGrain />
        <EmberParticles mouse={mouseRef} count={30} />
        <EmberKeyframes />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header roomCode={roomCode} isConnected={isConnected} />
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
              <h2 className="text-2xl font-light text-center font-serif text-white/90">
                Partie terminée !
              </h2>
              <Scoreboard rankings={rankings} />
              <Button
                onClick={onReturnToLobby}
                className="w-full gap-2 bg-ember hover:bg-ember-glow text-white border-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au lobby
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#060606" }}>
      <FilmGrain />
      <EmberParticles mouse={mouseRef} count={20} />
      <EmberKeyframes />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header roomCode={roomCode} isConnected={isConnected} />
        <main className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
