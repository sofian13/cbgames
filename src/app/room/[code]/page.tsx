"use client";

import { useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Crown, Layers3, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PlayerList } from "@/components/lobby/player-list";
import { GamePicker } from "@/components/lobby/game-picker";
import { ReadyCheck } from "@/components/lobby/ready-check";
import { useRoom } from "@/lib/party/use-room";
import { useRoomStore } from "@/lib/stores/room-store";
import { getOrCreateGuest } from "@/lib/guest";
import { EmberParticles, EmberKeyframes, FilmGrain } from "@/components/shared/ember";

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const mouseRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
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

  const { players, hostId, selectedGameId, status, isConnected, sessionScores, error } = useRoomStore();

  const connectedPlayers = players.filter((player) => player.isConnected);
  const me = players.find((player) => player.id === playerId);
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

  const sortedSessionPlayers = [...players].sort(
    (left, right) => (sessionScores[right.id] ?? 0) - (sessionScores[left.id] ?? 0)
  );

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 50% -10%, rgba(255,138,61,0.14) 0%, transparent 60%), radial-gradient(80% 80% at 100% 10%, rgba(110,228,247,0.1) 0%, transparent 58%), linear-gradient(180deg, #05070f 0%, #09111f 52%, #060913 100%)",
      }}
    >
      <FilmGrain />
      <EmberParticles mouse={mouseRef} count={18} />
      <EmberKeyframes />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header roomCode={code} isConnected={isConnected} />

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          {error && (
            <div className="rounded-[1.5rem] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
              {error}
            </div>
          )}

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
            <div className="premium-panel mesh-surface rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="section-title">Salon {code}</p>
                  <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                    Selectionne un jeu, puis lance la partie.
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">
                    Le lobby a ete compact pour mobile et plus lisible sur desktop. Tout le flow reste identique.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[320px]">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Joueurs</p>
                    <p className="mt-2 text-lg font-black text-white">{connectedPlayers.length}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Role</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/86">
                      <Crown className="h-4 w-4 text-[#ffd3b1]" />
                      {isHost ? "Host" : "Joueur"}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Etat</p>
                    <p className="mt-2 text-sm font-semibold text-white/86">
                      {selectedGameId ? "Pret a lancer" : "Choix en cours"}
                    </p>
                  </div>
                </div>
              </div>

              {Object.keys(sessionScores).length > 0 ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-[#72e4f7]" />
                      <p className="section-title">Session</p>
                    </div>
                    <p className="mt-3 text-lg font-black text-white">Scores en cours</p>
                    <p className="mt-2 text-sm leading-6 text-white/48">
                      Les points restent visibles pendant toute la session multijeux.
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {sortedSessionPlayers.map((player) => (
                        <div key={player.id} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-white/84">{player.name}</p>
                          <p className="mt-1 text-xs text-white/34">Score session</p>
                          <p className="mt-2 font-mono text-2xl font-black text-[#ffe0c8]">
                            {sessionScores[player.id] ?? 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.03] px-5 py-4 text-sm text-white/44">
                  Les scores de session apparaitront ici apres la premiere partie.
                </div>
              )}
            </div>

            <div className="premium-panel-soft rounded-[2rem] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <Users className="h-5 w-5 text-[#72e4f7]" />
                </div>
                <div>
                  <p className="section-title">Room signal</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Tout est synchronise</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/52">
                Choix du jeu, etat des joueurs et demarrage restent centralises ici pour eviter toute confusion sur mobile.
              </p>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
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
          </section>
        </main>
      </div>
    </div>
  );
}
