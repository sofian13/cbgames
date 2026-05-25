"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
// La grille de jeux (illustrations des 32 jeux) est lourde : on la charge à part
// pour que la salle s'affiche instantanément.
const GamePicker = dynamic(
  () => import("@/components/lobby/game-picker").then((m) => m.GamePicker),
  { ssr: false, loading: () => <div className="py-10 text-center text-sm" style={{ color: "var(--text-dim)" }}>Chargement des jeux…</div> },
);
import { PlayerList } from "@/components/lobby/player-list";
import { ReadyCheck } from "@/components/lobby/ready-check";
import { getOrCreateGuest } from "@/lib/guest";
import { getGameById } from "@/lib/games/registry";
import { useRoom } from "@/lib/party/use-room";
import { useRoomStore } from "@/lib/stores/room-store";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { Sparkles } from "@/components/ConfettiBurst";
import { Users } from "lucide-react";
import { MuteToggle } from "@/components/MuteToggle";
import { Customizer } from "@/components/Customizer";
import { useMe } from "@/lib/hooks/useMe";

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

  const [persona, updatePersona] = useMe();
  const [showProfile, setShowProfile] = useState(false);

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

      {/* Header de lobby dédié — PAS de nav cross-site (sinon on quitte la salle) */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] sm:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" title="Accueil (quitter la salle)">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black text-white"
                 style={{ background: "linear-gradient(135deg, var(--cb-brand), var(--af-pink))", fontFamily: "var(--font-display)" }}>
              af
            </div>
          </Link>
          <span className="af-chip" style={{ background: "rgba(255,210,63,0.18)", borderColor: "rgba(255,210,63,0.3)", color: "var(--af-yellow)", fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: 0.3 }}>
            Salle · {code}
          </span>
          <span className="h-2 w-2 rounded-full" style={{
            background: isConnected ? "var(--af-mint)" : "var(--af-coral)",
            boxShadow: `0 0 8px ${isConnected ? "rgba(61,220,151,0.7)" : "rgba(255,107,91,0.7)"}`,
          }} />
        </div>
        <div className="flex items-center gap-3">
          <MuteToggle />
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2" aria-label="Mon profil">
            <MascotAvatar color={persona.color} size={34} mood={persona.mood} />
            <span className="hidden text-sm font-bold sm:inline">{playerName}</span>
          </button>
        </div>
      </header>

      {/* Profil / customizer en modal — sans quitter la salle */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center"
             onClick={() => setShowProfile(false)}>
          <div className="w-full max-w-lg rounded-3xl border p-6" style={{ background: "var(--surface)", borderColor: "rgba(255,255,255,0.1)" }}
               onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="cb-display-md">Ton blob</h3>
              <button onClick={() => setShowProfile(false)} className="flex h-9 w-9 items-center justify-center rounded-full border"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "var(--text-dim)" }}>✕</button>
            </div>
            <Customizer me={persona} update={updatePersona} layout="row" blobSize={70} />
            <a href="/profile" className="af-btn af-btn-ghost mt-4 block text-center" style={{ fontSize: 13 }}>
              Voir mon profil complet → <span style={{ color: "var(--text-muted)" }}>(quitte la salle)</span>
            </a>
          </div>
        </div>
      )}

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
                  fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: 0.3,
                }}>
                  Salle · {code}
                </span>
                <span className="af-chip inline-flex items-center gap-1.5" style={{
                  background: selectedGame ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
                  borderColor: "transparent", color: "rgba(255,255,255,0.85)",
                  fontFamily: "var(--font-display)", fontWeight: 700,
                }}>
                  <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {connectedPlayers.length} joueur{connectedPlayers.length > 1 ? "s" : ""}
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
