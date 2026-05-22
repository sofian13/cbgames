"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GamePicker } from "@/components/lobby/game-picker";
import { PlayerList } from "@/components/lobby/player-list";
import { ReadyCheck } from "@/components/lobby/ready-check";
import { getOrCreateGuest } from "@/lib/guest";
import { getGameById } from "@/lib/games/registry";
import { useRoom } from "@/lib/party/use-room";
import { useRoomStore } from "@/lib/stores/room-store";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { Sparkles } from "@/components/ConfettiBurst";

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
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white">
      <Sparkles count={8} />

      {/* HEADER */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-6 sm:px-10">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:text-white"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--line-soft)" }}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="af-chip" style={{
            background: "rgba(255,210,63,0.18)", borderColor: "rgba(255,210,63,0.3)",
            color: "var(--af-yellow)", letterSpacing: 2,
          }}>
            <span className="cb-mono">ROOM · {code}</span>
          </span>
          <div className="flex h-2 w-2 rounded-full" style={{
            background: isConnected ? "var(--af-mint)" : "var(--af-coral)",
            boxShadow: `0 0 8px ${isConnected ? "rgba(61,220,151,0.7)" : "rgba(255,107,91,0.7)"}`,
          }} />
        </div>
        <div className="flex items-center gap-2">
          <MascotAvatar color="purple" size={32} mood="wink" />
          <span className="text-sm font-bold">{playerName}</span>
        </div>
      </header>

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
