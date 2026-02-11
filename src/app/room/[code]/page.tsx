"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { PlayerList } from "@/components/lobby/player-list";
import { GamePicker } from "@/components/lobby/game-picker";
import { ReadyCheck } from "@/components/lobby/ready-check";
import { useRoom } from "@/lib/party/use-room";
import { useRoomStore } from "@/lib/stores/room-store";
import { getOrCreateGuest } from "@/lib/guest";
import { EmberParticles, FilmGrain, EmberKeyframes } from "@/components/shared/ember";
import { useRef } from "react";

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const code = (params.code as string).toUpperCase();
  const mouseRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

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

  const { selectGame, toggleReady, startGame, send } = useRoom(
    code,
    playerId,
    playerName,
    avatar,
    isGuest
  );

  const {
    players,
    hostId,
    selectedGameId,
    status,
    isConnected,
    sessionScores,
    error,
  } = useRoomStore();

  const isHost = hostId === playerId;

  useEffect(() => {
    if (status === "in-game" && selectedGameId) {
      router.push(`/room/${code}/game/${selectedGameId}`);
    }
  }, [status, selectedGameId, code, router]);

  const handleKick = (targetId: string) => {
    send({ type: "kick-player", payload: { playerId: targetId } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#060606" }}>
      <FilmGrain />
      <EmberParticles mouse={mouseRef} count={30} />
      <EmberKeyframes />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header roomCode={code} isConnected={isConnected} />
        <main className="flex flex-1">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400 backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* Session scores */}
            {Object.keys(sessionScores).length > 0 && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-2 font-sans">
                  Scores de session
                </h3>
                <div className="flex gap-4 flex-wrap">
                  {players
                    .sort((a, b) => (sessionScores[b.id] ?? 0) - (sessionScores[a.id] ?? 0))
                    .map((p) => (
                      <span key={p.id} className="text-sm font-sans">
                        <span className="font-medium text-white/80">{p.name}</span>
                        <span className="text-ember ml-1">
                          {sessionScores[p.id] ?? 0} pts
                        </span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <GamePicker
                selectedGameId={selectedGameId}
                isHost={isHost}
                onSelectGame={selectGame}
              />

              <div className="flex flex-col gap-4">
                <PlayerList
                  players={players}
                  currentPlayerId={playerId}
                  isHost={isHost}
                  onKick={handleKick}
                />
                <ReadyCheck
                  players={players}
                  currentPlayerId={playerId}
                  selectedGameId={selectedGameId}
                  isHost={isHost}
                  onToggleReady={toggleReady}
                  onStartGame={startGame}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
