"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
    const guest = getOrCreateGuest();
    return { id: guest.id, name: guest.name, isGuest: true, avatar: undefined };
  }, []);

  const optimisticHost = useMemo(() => {
    if (typeof window === "undefined") return false;
    const createdCode = sessionStorage.getItem("af-created-room-code");
    return createdCode?.toUpperCase() === code;
  }, [code]);

  const { selectGame, toggleReady, startGame, send } = useRoom(
    code,
    playerId,
    playerName,
    avatar,
    isGuest,
    optimisticHost
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

  const connectedPlayers = players.filter((p) => p.isConnected);
  const me = players.find((p) => p.id === playerId);
  const isHost =
    hostId === playerId ||
    !!me?.isHost ||
    (connectedPlayers.length === 1 && connectedPlayers[0]?.id === playerId);

  const handleStartGame = (gameId?: string | null) => {
    const id = (gameId ?? selectedGameId)?.trim().toLowerCase();
    if (!id) return;
    startGame(id);
    router.push(`/room/${code}/game/${id}`);
  };

  useEffect(() => {
    if (status === "in-game" && selectedGameId) {
      router.push(`/room/${code}/game/${selectedGameId}`);
    }
  }, [status, selectedGameId, code, router]);

  const handleKick = (targetId: string) => {
    send({ type: "kick-player", payload: { playerId: targetId } });
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(130% 85% at 50% -10%, rgba(90,160,255,0.18) 0%, transparent 60%), linear-gradient(180deg, #030710 0%, #040b1a 55%, #030710 100%)",
      }}
    >
      <FilmGrain />
      <EmberParticles mouse={mouseRef} count={25} />
      <EmberKeyframes />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header roomCode={code} isConnected={isConnected} />
        <main className="flex flex-1">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-5 lg:p-6">
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300 backdrop-blur-sm font-sans">
                {error}
              </div>
            )}

            {/* Session scores */}
            {Object.keys(sessionScores).length > 0 && (
              <div className="premium-panel-soft rounded-2xl p-4">
                <h3 className="section-title mb-3">Scores de session</h3>
                <div className="flex gap-4 flex-wrap">
                  {players
                    .sort((a, b) => (sessionScores[b.id] ?? 0) - (sessionScores[a.id] ?? 0))
                    .map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5">
                        <span className="text-sm font-medium text-white/75 font-sans">{p.name}</span>
                        <span className="text-sm font-bold text-cyan-300 font-mono">
                          {sessionScores[p.id] ?? 0}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
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
                  onStartGame={handleStartGame}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
