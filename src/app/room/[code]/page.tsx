"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { GamePicker } from "@/components/lobby/game-picker";
import { PlayerList } from "@/components/lobby/player-list";
import { ReadyCheck } from "@/components/lobby/ready-check";
import { getOrCreateGuest } from "@/lib/guest";
import { getGameById } from "@/lib/games/registry";
import { useRoom } from "@/lib/party/use-room";
import { useRoomStore } from "@/lib/stores/room-store";

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

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

  const connectedPlayers = players.filter((player) => player.isConnected);
  const me = players.find((player) => player.id === playerId);
  const isHost =
    hostId === playerId ||
    !!me?.isHost ||
    (connectedPlayers.length === 1 && connectedPlayers[0]?.id === playerId);
  const selectedGame = selectedGameId ? getGameById(selectedGameId) : null;

  useEffect(() => {
    if (status === "in-game" && selectedGameId) {
      router.push(`/room/${code}/game/${selectedGameId}`);
    }
  }, [code, router, selectedGameId, status]);

  const handleStartGame = (gameId?: string | null) => {
    const id = (gameId ?? selectedGameId)?.trim().toLowerCase();
    if (!id) return;
    startGame(id);
    router.push(`/room/${code}/game/${id}`);
  };

  const handleKick = (targetId: string) => {
    send({ type: "kick-player", payload: { playerId: targetId } });
  };

  return (
    <div className="site-shell">
      <div
        className="site-orb h-72 w-72 bg-[#ff8755]/35"
        style={{ left: "-5rem", top: "10rem" }}
      />
      <div
        className="site-orb h-80 w-80 bg-cyan-300/25"
        style={{ right: "-6rem", top: "8rem", animationDelay: "-5s" }}
      />

      <div className="relative z-10 flex min-h-screen flex-col overflow-x-clip">
        <Header roomCode={code} isConnected={isConnected} />

        <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-4 overflow-x-clip px-3 py-3 sm:px-5 sm:py-6">
          {error && (
            <div className="rounded-[1.4rem] border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200/92">
              {error}
            </div>
          )}

          <section className="site-panel overflow-hidden rounded-[1.9rem] p-4 sm:p-6">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="site-chip rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    Room {code}
                  </span>
                  <span className="site-chip-cool rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {connectedPlayers.length} joueur{connectedPlayers.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="min-w-0">
                  <h1 className="text-balance text-2xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                    {selectedGame
                      ? `${selectedGame.name} est pret a partir.`
                      : "Choisis le prochain jeu pour la room."}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">
                    Un jeu selectionne, des joueurs prets, puis la partie part.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="site-panel-soft rounded-[1.4rem] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                      Flow
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">Choisir</p>
                  </div>
                  <div className="site-panel-soft rounded-[1.4rem] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                      Flow
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">Valider</p>
                  </div>
                  <div className="site-panel-soft rounded-[1.4rem] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                      Flow
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">Lancer</p>
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="site-panel-soft rounded-[1.6rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    Jeu selectionne
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.05] text-3xl">
                      {selectedGame?.icon ?? "?"}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white/92">
                        {selectedGame?.name ?? "Aucun"}
                      </p>
                      <p className="text-sm text-white/45">
                        {selectedGame
                          ? `${selectedGame.minPlayers}-${selectedGame.maxPlayers} joueurs`
                          : "Selection du host"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="site-panel-soft rounded-[1.6rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    Score session
                  </p>
                  {Object.keys(sessionScores).length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {players
                        .slice()
                        .sort(
                          (a, b) =>
                            (sessionScores[b.id] ?? 0) - (sessionScores[a.id] ?? 0)
                        )
                        .map((player) => (
                          <div
                            key={player.id}
                            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/72"
                          >
                            <span>{player.name}</span>
                            <span className="ml-2 font-mono text-cyan-100">
                              {sessionScores[player.id] ?? 0}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-white/42">
                      La session commence. Les points apparaissent apres la premiere partie.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <GamePicker
              selectedGameId={selectedGameId}
              isHost={isHost}
              onSelectGame={selectGame}
            />

            <div className="flex flex-col gap-4">
              <ReadyCheck
                players={players}
                currentPlayerId={playerId}
                selectedGameId={selectedGameId}
                isHost={isHost}
                onToggleReady={toggleReady}
                onStartGame={handleStartGame}
              />

              <PlayerList
                players={players}
                currentPlayerId={playerId}
                isHost={isHost}
                onKick={handleKick}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
