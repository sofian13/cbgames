"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Gamepad2, Plus, Smartphone, Sparkles, Users2 } from "lucide-react";
import { generateRoomCode, ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { getOrCreateGuest, setGuestName } from "@/lib/guest";
import { GAMES } from "@/lib/games/registry";
import { GameCover } from "@/components/shared/game-cover";

function UsernameEditor({
  initialName,
  onSave,
}: {
  initialName: string;
  onSave: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed.slice(0, 20));
      setName(trimmed.slice(0, 20));
    } else {
      setName(initialName);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value.slice(0, 20))}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") {
              setName(initialName);
              setEditing(false);
            }
          }}
          className="h-10 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.08]"
        />
        <button
          onClick={save}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-cyan-300/30 hover:text-white"
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/72 transition hover:border-cyan-300/30 hover:bg-white/[0.08] hover:text-white"
    >
      {initialName}
    </button>
  );
}

function PreviewCard({
  gameId,
  name,
  category,
  index,
}: {
  gameId: string;
  name: string;
  category: string;
  index: number;
}) {
  return (
    <article
      className="site-card-hover rounded-[1.55rem] border border-slate-800/90 bg-[#d7dfeb] p-2 shadow-[0_10px_0_rgba(15,23,42,0.92)]"
      style={{
        animationDelay: `${0.14 + index * 0.06}s`,
      }}
    >
      <GameCover gameId={gameId} name={name} category={category} compact />
    </article>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [guestName, setGuestNameState] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateGuest().name;
  });

  const implementedGames = GAMES.filter((game) => game.implemented);
  const featuredGames = implementedGames.slice(0, 6);
  const categoriesCount = new Set(implementedGames.map((game) => game.category)).size;

  const handleSaveName = useCallback((newName: string) => {
    setGuestName(newName);
    setGuestNameState(newName);
  }, []);

  const handleCreate = useCallback(() => {
    const roomCode = generateRoomCode();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("af-created-room-code", roomCode);
    }
    router.push(`/room/${roomCode}`);
  }, [router]);

  const handleJoin = useCallback(() => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === ROOM_CODE_LENGTH) {
      router.push(`/room/${trimmed}`);
    }
  }, [code, router]);

  return (
    <main className="site-shell text-white">
      <div
        className="site-orb h-72 w-72 bg-[#ff8755]/40"
        style={{ left: "-4rem", top: "7rem" }}
      />
      <div
        className="site-orb h-80 w-80 bg-cyan-300/25"
        style={{ right: "-6rem", top: "3rem", animationDelay: "-6s" }}
      />
      <div
        className="site-orb h-64 w-64 bg-amber-300/18"
        style={{ bottom: "-4rem", left: "35%", animationDelay: "-11s" }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6">
        <header
          className="page-enter flex items-center justify-between gap-3"
          style={{ animationDelay: "0.04s" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_10px_35px_rgba(0,0,0,0.28)]">
              <Gamepad2 className="h-5 w-5 text-[#ffb68c]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">AF Games</p>
              <p className="text-sm text-white/72">Party arcade mobile-first</p>
            </div>
          </div>

          {guestName && <UsernameEditor initialName={guestName} onSave={handleSaveName} />}
        </header>

        <section className="grid flex-1 items-center gap-6 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-10">
          <div
            className="page-enter flex flex-col gap-5"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex flex-wrap gap-2">
              <span className="site-chip rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                {implementedGames.length} jeux live
              </span>
              <span className="site-chip-cool rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                {categoriesCount} univers
              </span>
            </div>

            <div className="max-w-2xl space-y-4">
              <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
                Une arcade simple, nerveuse, et pensee pour le mobile.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-white/64 sm:text-base">
                Cree une salle, partage un code, lance un jeu. Peu de texte, plus
                d’action.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleCreate}
                className="site-card-hover flex min-h-36 flex-col justify-between rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-[#ff8755]/16 via-[#ff8755]/8 to-transparent p-5 text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]">
                  <Plus className="h-5 w-5 text-[#ffb68c]" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white">Nouvelle salle</p>
                  <p className="text-sm text-white/56">
                    Une pression, un code, et la partie part.
                  </p>
                </div>
              </button>

              <div className="site-panel rounded-[1.8rem] p-5">
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-white">Rejoindre</p>
                    <p className="text-sm text-white/56">Entre le code de la room.</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-[1.35rem] border border-white/10 bg-black/[0.18] p-2">
                    <input
                      type="text"
                      value={code}
                      onChange={(event) =>
                        setCode(
                          event.target.value
                            .toUpperCase()
                            .replace(/[^A-Z]/g, "")
                            .slice(0, ROOM_CODE_LENGTH)
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleJoin();
                      }}
                      placeholder="CODE"
                      maxLength={ROOM_CODE_LENGTH}
                      className="min-w-0 flex-1 bg-transparent px-3 text-center font-mono text-lg font-semibold tracking-[0.42em] text-white/88 outline-none placeholder:text-white/16"
                    />
                    <button
                      onClick={handleJoin}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="site-panel-soft rounded-[1.6rem] p-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">
                  <Users2 className="h-4 w-4 text-cyan-300/80" />
                  2 a 8 joueurs
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">
                  <Smartphone className="h-4 w-4 text-[#ffb68c]" />
                  Pense pour le telephone
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">
                  <Sparkles className="h-4 w-4 text-amber-300/80" />
                  Rapide a prendre en main
                </div>
              </div>
            </div>
          </div>

          <div
            className="page-enter"
            style={{ animationDelay: "0.18s" }}
          >
            <div className="site-panel rounded-[2rem] p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/32">
                    Apercu du catalogue
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Des parties courtes, lisibles, tactiles.
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/58">
                  no login
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {featuredGames.map((game, index) => (
                  <PreviewCard
                    key={game.id}
                    gameId={game.id}
                    name={game.name}
                    category={game.category}
                    index={index}
                  />
                ))}
              </div>

              <div className="site-divider my-5" />

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="site-panel-soft rounded-[1.3rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/34">Instant</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Room code</p>
                </div>
                <div className="site-panel-soft rounded-[1.3rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/34">Style</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Clean + anime</p>
                </div>
                <div className="site-panel-soft rounded-[1.3rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/34">Mobile</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Touch first</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer
          className="page-enter safe-bottom flex flex-wrap items-center justify-between gap-3 text-xs text-white/34"
          style={{ animationDelay: "0.26s" }}
        >
          <p>Sans compte, sans pub, sans friction.</p>
          <p className="font-mono uppercase tracking-[0.18em]">AF / party arcade</p>
        </footer>
      </div>
    </main>
  );
}
