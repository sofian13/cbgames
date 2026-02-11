"use client";

import { useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
} as const;

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const code = (params.code as string).toUpperCase();
  const gameId = params.gameId as string;

  const { id: playerId, name: playerName, isGuest, avatar } = useMemo(() => {
    if (session?.user) {
      return {
        id: session.user.id,
        name: session.user.name ?? "Joueur",
        isGuest: false,
        avatar: session.user.image ?? undefined,
      };
    }
    const guest = getOrCreateGuest();
    return { id: guest.id, name: guest.name, isGuest: true, avatar: undefined };
  }, [session]);

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
        <p className="text-white/40 font-sans">Jeu non trouvé</p>
      </div>
    );
  }

  return (
    <GameShell roomCode={code} gameId={gameId} onReturnToLobby={handleReturnToLobby}>
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
        />
      </Suspense>
    </GameShell>
  );
}
