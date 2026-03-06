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
import { getPartyKitHost } from "@/lib/party/host";
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
  const debugHost = getPartyKitHost();

  const handleStartGame = (gameId?: string | null) => {
    const id = (gameId ?? selectedGameId)?.trim().toLowerCase();
    if (!id) return;
    startGame(id);
    // Fallback navigation in case lobby websocket event is delayed/dropped.
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
          "radial-gradient(130% 85% at 50% -10%, rgba(90,160,255,0.22) 0%, transparent 60%), linear-gradient(180deg, #030710 0%, #040b1a 55%, #030710 100%)",
      }}
    >
      <FilmGrain />
      <EmberParticles mouse={mouseRef} count={30} />
      <EmberKeyframes />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header roomCode={code} isConnected={isConnected} />
        <main className="flex flex-1">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300 backdrop-blur-sm">
                {error}
              </div>
            )}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-[11px] text-white/55">
              debug: host={debugHost} | room={code} | me={playerId.slice(0, 12)} | hostId={hostId ?? "none"} | connected={connectedPlayers.length}
            </div>

            {/* Session scores */}
            {Object.keys(sessionScores).length > 0 && (
              <div className="premium-panel rounded-2xl p-4">
                <h3 className="mb-2 text-sm font-semibold text-white/55 uppercase tracking-[0.16em] font-sans">
                  Scores de session
                </h3>
                <div className="flex gap-4 flex-wrap">
                  {players
                    .sort((a, b) => (sessionScores[b.id] ?? 0) - (sessionScores[a.id] ?? 0))
                    .map((p) => (
                      <span key={p.id} className="text-sm font-sans">
                        <span className="font-medium text-white/80">{p.name}</span>
                        <span className="ml-1 text-cyan-300">
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
