"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GamePicker } from "@/components/lobby/game-picker";
import { PlayerList } from "@/components/lobby/player-list";
import { ReadyCheck } from "@/components/lobby/ready-check";
import { getOrCreateGuest } from "@/lib/guest";
import { getGameById } from "@/lib/games/registry";
import { useRoom } from "@/lib/party/use-room";
import { useRoomStore } from "@/lib/stores/room-store";
import { Mascot, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { Sparkles } from "@/components/ConfettiBurst";
import { SiteNav } from "@/components/SiteNav";

// Map game category → mascot color (so banner picks a coherent mascot)
const CAT_COLOR: Record<string, MascotColor> = {
  words: "sky", trivia: "yellow", speed: "coral", strategy: "mint",
  social: "pink", cards: "purple", party: "lavender", sport: "sky",
};

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
    code, playerId, playerName, undefined, true, optimisticHost,
  );

  const {
    players, hostId, selectedGameId, status, isConnected, sessionScores, error,
  } = useRoomStore();

  const connectedPlayers = players.filter((player) => player.isConnected);
  const me = players.find((player) => player.id === playerId);
  const isHost =
    hostId === playerId ||
    !!me?.isHost ||
    (connectedPlayers.length === 1 && connectedPlayers[0]?.id === playerId);
  const selectedGame = selectedGameId ? getGameById(selectedGameId) : null;
  const gameColor: MascotColor = selectedGame ? (CAT_COLOR[selectedGame.category] ?? "purple") : "purple";

  // Le lobby dépend d'identités client (localStorage) + WebSocket : on rend
  // un écran d'attente jusqu'au montage pour éviter tout mismatch d'hydratation.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <p className="animate-pulse text-sm" style={{ color: "var(--text-dim)" }}>
          Connexion à la salle…
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white">
      <Sparkles count={8} />

      <SiteNav room={code} />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-5 py-6 sm:px-10">
        {error && (
          <div className="rounded-2xl border px-4 py-3 text-sm"
               style={{ background: "rgba(255,107,91,0.08)", borderColor: "rgba(255,107,91,0.3)", color: "var(--af-coral)" }}>
            {error}
          </div>
        )}

        {/* SELECTED GAME BANNER */}
        <section className="relative overflow-hidden rounded-3xl"
                 style={{
                   background: selectedGame
                     ? `linear-gradient(120deg, ${MASCOT_PALETTE[gameColor].body} 0%, ${MASCOT_PALETTE.purple.body} 100%)`
                     : "rgba(255,255,255,0.04)",
                   border: selectedGame ? "none" : "1px solid var(--line-soft)",
                   minHeight: 220,
                 }}>
          {selectedGame && (
            <div className="absolute right-0 bottom-0 sm:right-8" style={{ opacity: 0.95 }}>
              <Mascot size={170} color={gameColor} mood="shocked" delay={0.2} />
            </div>
          )}

          <div className="relative grid gap-5 p-6 sm:p-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="af-chip" style={{
                  background: selectedGame ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                  borderColor: "transparent", color: "#fff",
                }}>
                  <span className="cb-mono" style={{ letterSpacing: 1.5 }}>ROOM · {code}</span>
                </span>
                <span className="af-chip" style={{
                  background: selectedGame ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
                  borderColor: "transparent", color: "rgba(255,255,255,0.85)",
                }}>
                  👥 {connectedPlayers.length} joueur{connectedPlayers.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="min-w-0">
                <p className="af-eyebrow" style={{ color: selectedGame ? "rgba(255,255,255,0.7)" : "var(--text-dim)" }}>
                  {selectedGame ? "jeu verrouillé" : "en attente"}
                </p>
                <h1 className="cb-display-lg mt-1" style={{ letterSpacing: -1, lineHeight: 1 }}>
                  {selectedGame
                    ? `${selectedGame.name} ${selectedGame.icon ?? ""}`
                    : "Choisis le prochain jeu."}
                </h1>
                <p className="mt-2 max-w-md text-sm"
                   style={{ color: selectedGame ? "rgba(255,255,255,0.85)" : "var(--text-dim)" }}>
                  {selectedGame
                    ? `Un jeu sélectionné, des joueurs prêts, puis la partie part. ${selectedGame.minPlayers}–${selectedGame.maxPlayers} joueurs.`
                    : "Un jeu sélectionné, des joueurs prêts, puis la partie part."}
                </p>
              </div>
            </div>

            {/* Session scores */}
            <div className="grid min-w-0 gap-2">
              <div className="rounded-2xl p-3"
                   style={{
                     background: selectedGame ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.04)",
                     border: `1px solid ${selectedGame ? "rgba(255,255,255,0.10)" : "var(--line-soft)"}`,
                     backdropFilter: "blur(8px)",
                   }}>
                <span className="af-eyebrow" style={{ color: selectedGame ? "rgba(255,255,255,0.6)" : undefined }}>
                  score session
                </span>
                {Object.keys(sessionScores).length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {players
                      .slice()
                      .sort((a, b) => (sessionScores[b.id] ?? 0) - (sessionScores[a.id] ?? 0))
                      .map((player) => (
                        <div key={player.id}
                             className="rounded-full border px-2.5 py-1 text-xs"
                             style={{
                               background: "rgba(255,255,255,0.08)",
                               borderColor: "rgba(255,255,255,0.10)",
                               color: "#fff",
                             }}>
                          <span>{player.name}</span>
                          <span className="cb-mono ml-1.5 font-bold" style={{ color: "var(--af-yellow)" }}>
                            {sessionScores[player.id] ?? 0}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs" style={{ color: selectedGame ? "rgba(255,255,255,0.55)" : "var(--text-dim)" }}>
                    Les points apparaîtront après la 1<sup>re</sup> partie.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* MAIN GRID — kept compatible with existing GamePicker/PlayerList/ReadyCheck */}
        <div className="grid min-w-0 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <GamePicker
            selectedGameId={selectedGameId}
            isHost={isHost}
            onSelectGame={selectGame}
          />

          <div className="flex flex-col gap-5">
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
