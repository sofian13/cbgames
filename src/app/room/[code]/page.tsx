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

  const { id: playerId, name: playerName } = useMemo(() => {
    const guest = getOrCreateGuest();
    return { id: guest.id, name: guest.name };
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
    undefined,
    true,
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
    <div className="site-shell flex min-h-screen flex-col">
      <Header roomCode={code} isConnected={isConnected} />

      <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        {error && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{
              background: "rgba(226,52,52,0.08)",
              borderColor: "rgba(226,52,52,0.3)",
              color: "var(--cb-social)",
            }}
          >
            {error}
          </div>
        )}

        {/* Selected game banner */}
        <section
          className="overflow-hidden rounded-2xl border"
          style={{
            background: selectedGame ? "var(--primary)" : "var(--surface)",
            color: selectedGame ? "var(--primary-foreground)" : "var(--foreground)",
            borderColor: selectedGame ? "transparent" : "var(--line-soft)",
          }}
        >
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-full border px-3 py-1 text-[10px] cb-mono font-bold uppercase tracking-[0.22em]"
                  style={{
                    background: selectedGame ? "rgba(255,255,255,0.1)" : "var(--surface-2)",
                    borderColor: selectedGame ? "transparent" : "var(--line-soft)",
                    color: selectedGame ? "rgba(255,255,255,0.9)" : "var(--text-strong)",
                  }}
                >
                  ROOM · {code}
                </span>
                <span
                  className="rounded-full border px-3 py-1 text-[10px] cb-mono font-bold uppercase tracking-[0.22em]"
                  style={{
                    background: selectedGame ? "rgba(255,255,255,0.06)" : "var(--surface-2)",
                    borderColor: selectedGame ? "transparent" : "var(--line-soft)",
                    color: selectedGame ? "rgba(255,255,255,0.7)" : "var(--text-dim)",
                  }}
                >
                  {connectedPlayers.length} joueur{connectedPlayers.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="min-w-0">
                <span
                  className="cb-eyebrow"
                  style={{ color: selectedGame ? "rgba(255,255,255,0.6)" : undefined }}
                >
                  {selectedGame ? "jeu verrouillé" : "en attente"}
                </span>
                <h1 className="cb-display-lg mt-1 text-balance">
                  {selectedGame
                    ? `${selectedGame.name} est prêt à partir.`
                    : "Choisis le prochain jeu."}
                </h1>
                <p
                  className="mt-2 max-w-2xl text-sm"
                  style={{
                    color: selectedGame ? "rgba(255,255,255,0.7)" : "var(--text-dim)",
                  }}
                >
                  Un jeu sélectionné, des joueurs prêts, puis la partie part.
                </p>
              </div>
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <div
                className="rounded-xl p-3"
                style={{
                  background: selectedGame ? "rgba(255,255,255,0.06)" : "var(--surface-2)",
                  border: "1px solid " + (selectedGame ? "rgba(255,255,255,0.08)" : "var(--line-soft)"),
                }}
              >
                <span className="cb-eyebrow"
                      style={{ color: selectedGame ? "rgba(255,255,255,0.5)" : undefined }}>
                  jeu sélectionné
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                    style={{
                      background: selectedGame ? "rgba(255,255,255,0.08)" : "var(--surface)",
                      border: "1px solid " + (selectedGame ? "rgba(255,255,255,0.1)" : "var(--line-soft)"),
                    }}
                  >
                    {selectedGame?.icon ?? "?"}
                  </div>
                  <div>
                    <p className="text-base font-bold"
                       style={{ fontFamily: "var(--font-display)" }}>
                      {selectedGame?.name ?? "Aucun"}
                    </p>
                    <p className="text-xs cb-mono"
                       style={{ color: selectedGame ? "rgba(255,255,255,0.5)" : "var(--text-dim)" }}>
                      {selectedGame
                        ? `${selectedGame.minPlayers}-${selectedGame.maxPlayers} joueurs`
                        : "sélection du host"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-3"
                style={{
                  background: selectedGame ? "rgba(255,255,255,0.06)" : "var(--surface-2)",
                  border: "1px solid " + (selectedGame ? "rgba(255,255,255,0.08)" : "var(--line-soft)"),
                }}
              >
                <span className="cb-eyebrow"
                      style={{ color: selectedGame ? "rgba(255,255,255,0.5)" : undefined }}>
                  score session
                </span>
                {Object.keys(sessionScores).length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {players
                      .slice()
                      .sort(
                        (a, b) =>
                          (sessionScores[b.id] ?? 0) - (sessionScores[a.id] ?? 0)
                      )
                      .map((player) => (
                        <div
                          key={player.id}
                          className="rounded-full border px-2.5 py-1 text-xs"
                          style={{
                            background: selectedGame ? "rgba(255,255,255,0.06)" : "var(--surface)",
                            borderColor: selectedGame ? "rgba(255,255,255,0.1)" : "var(--line-soft)",
                            color: selectedGame ? "rgba(255,255,255,0.85)" : "var(--text-strong)",
                          }}
                        >
                          <span>{player.name}</span>
                          <span
                            className="ml-1.5 cb-mono font-bold"
                            style={{ color: "var(--cb-brand)" }}
                          >
                            {sessionScores[player.id] ?? 0}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p
                    className="mt-2 text-xs"
                    style={{
                      color: selectedGame ? "rgba(255,255,255,0.5)" : "var(--text-dim)",
                    }}
                  >
                    Les points apparaîtront après la 1re partie.
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
  );
}
