"use client";

import { useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { GameShell } from "@/components/game/game-shell";
import { useRoom } from "@/lib/party/use-room";
import { getOrCreateGuest } from "@/lib/guest";
import { getGameById } from "@/lib/games/registry";

// Static map of dynamically imported game components (declared at module level)
const GameComponents = {
  "bomb-party": dynamic(
    () => import("@/components/games/bomb-party/bomb-party-game"),
    { ssr: false }
  ),
  "speed-quiz": dynamic(
    () => import("@/components/games/speed-quiz/speed-quiz-game"),
    { ssr: false }
  ),
  "word-chain": dynamic(
    () => import("@/components/games/word-chain/word-chain-game"),
    { ssr: false }
  ),
  "reaction-time": dynamic(
    () => import("@/components/games/reaction-time/reaction-time-game"),
    { ssr: false }
  ),
  "loup-garou": dynamic(
    () => import("@/components/games/loup-garou/loup-garou-game"),
    { ssr: false }
  ),
  "undercover": dynamic(
    () => import("@/components/games/undercover/undercover-game"),
    { ssr: false }
  ),
  "code-names": dynamic(
    () => import("@/components/games/code-names/code-names-game"),
    { ssr: false }
  ),
  "infiltre": dynamic(
    () => import("@/components/games/infiltre/infiltre-game"),
    { ssr: false }
  ),
  "uno": dynamic(
    () => import("@/components/games/uno/uno-game"),
    { ssr: false }
  ),
  "poker": dynamic(
    () => import("@/components/games/poker/poker-game"),
    { ssr: false }
  ),
  "roast-quiz": dynamic(
    () => import("@/components/games/roast-quiz/roast-quiz-game"),
    { ssr: false }
  ),
  "la-taupe": dynamic(
    () => import("@/components/games/la-taupe/la-taupe-game"),
    { ssr: false }
  ),
  "enchere": dynamic(
    () => import("@/components/games/enchere/enchere-game"),
    { ssr: false }
  ),
  "split-second": dynamic(
    () => import("@/components/games/split-second/split-second-game"),
    { ssr: false }
  ),
  "blind-control": dynamic(
    () => import("@/components/games/blind-control/blind-control-game"),
    { ssr: false }
  ),
  "roulette": dynamic(
    () => import("@/components/games/roulette/roulette-game"),
    { ssr: false }
  ),
  "black-market": dynamic(
    () => import("@/components/games/black-market/black-market-game"),
    { ssr: false }
  ),
  "king-hill": dynamic(
    () => import("@/components/games/king-hill/king-hill-game"),
    { ssr: false }
  ),
  "motion-tennis": dynamic(
    () => import("@/components/games/motion-tennis/motion-tennis-game"),
    { ssr: false }
  ),
  "chess": dynamic(
    () => import("@/components/games/chess/chess-game"),
    { ssr: false }
  ),
  "block-runner": dynamic(
    () => import("@/components/games/block-runner/block-runner-game"),
    { ssr: false }
  ),
} as const;

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const gameId = params.gameId as string;

  const { id: playerId, name: playerName, isGuest, avatar } = useMemo(() => {
    const guest = getOrCreateGuest();
    return { id: guest.id, name: guest.name, isGuest: true, avatar: undefined };
  }, []);

  // Keep lobby connection alive
  const { returnToLobby } = useRoom(code, playerId, playerName, avatar, isGuest);

  const gameMeta = getGameById(gameId);
  const GameComponent = GameComponents[gameId as keyof typeof GameComponents];

  const handleReturnToLobby = () => {
    returnToLobby();
    router.push(`/room/${code}`);
  };

  if (!gameMeta?.implemented || !GameComponent) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#060606" }}>
        <p className="text-white/40 font-sans">Jeu non trouve</p>
      </div>
    );
  }

  return (
    <GameShell roomCode={code} gameId={gameId} playerId={playerId} playerName={playerName} isGuest={isGuest} onReturnToLobby={handleReturnToLobby}>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <p className="text-white/40 animate-pulse font-sans">Chargement du jeu...</p>
          </div>
        }
      >
        <GameComponent
          roomCode={code}
          playerId={playerId}
          playerName={playerName}
          onReturnToLobby={handleReturnToLobby}
        />
      </Suspense>
    </GameShell>
  );
}
