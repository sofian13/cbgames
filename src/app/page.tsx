"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Gamepad2,
  Pencil,
  Plus,
  Sparkles,
  TimerReset,
  Users,
  Wand2,
} from "lucide-react";
import { EmberBackground, MagneticButton, EmberKeyframes } from "@/components/shared/ember";
import { generateRoomCode, ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { getOrCreateGuest, setGuestName } from "@/lib/guest";
import { GAMES } from "@/lib/games/registry";

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
    if (trimmed && trimmed !== initialName) {
      onSave(trimmed);
    } else {
      setName(initialName);
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all duration-300 hover:border-white/18 hover:bg-white/[0.08]"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/32">Pseudo</p>
          <p className="mt-1 text-base font-semibold text-white/88">{initialName}</p>
        </div>
        <Pencil className="h-4 w-4 text-white/28 transition-colors group-hover:text-[#ffb17f]" />
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 20))}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setName(initialName);
            setEditing(false);
          }
        }}
        onBlur={save}
        maxLength={20}
        className="sunrise-input h-12 flex-1 rounded-2xl px-4 text-base font-medium text-white outline-none transition focus:border-[#ff8a3d]/45 focus:shadow-[0_0_0_1px_rgba(255,138,61,0.28),0_0_28px_rgba(255,138,61,0.12)]"
      />
      <button
        onClick={save}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff8a3d]/30 bg-[#ff8a3d]/14 text-[#ffd0af] transition hover:bg-[#ff8a3d]/22"
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [guestName, setGuestNameState] = useState(() => {
    if (typeof window === "undefined") return "";
    return getOrCreateGuest().name;
  });

  const implementedGames = useMemo(() => GAMES.filter((game) => game.implemented), []);
  const featuredGames = implementedGames.slice(0, 6);
  const categoryCount = useMemo(
    () => new Set(implementedGames.map((game) => game.category)).size,
    [implementedGames]
  );

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
    <EmberBackground particleCount={56} showOrb={false}>
      <EmberKeyframes />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 text-white sm:px-6 lg:px-8">
        <div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ animation: "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="flex items-center gap-3">
            <div className="hero-ring flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
              <span className="text-lg font-black tracking-[0.18em] text-white/92">AF</span>
            </div>
            <div>
              <p className="section-title">Party arcade</p>
              <p className="mt-1 text-sm text-white/58">Salles instantanees, multi-jeux, mobile first.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="premium-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              {implementedGames.length} jeux live
            </span>
            <span className="premium-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase">
              <Users className="h-3.5 w-3.5" />
              Sans compte
            </span>
          </div>
        </div>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,420px)] lg:gap-12 lg:py-12">
          <div className="space-y-6" style={{ animation: "slideInLeft 0.8s ease both" }}>
            <div className="premium-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <Gamepad2 className="h-3.5 w-3.5" />
              Nouvelle direction visuelle
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-[clamp(3rem,8vw,6.6rem)] font-black leading-[0.92] tracking-[-0.05em] text-white premium-text-glow">
                Le salon multi-jeux qui fait enfin
                <span className="block bg-gradient-to-r from-[#ffe1cb] via-[#ff9d68] to-[#72e4f7] bg-clip-text text-transparent">
                  propre sur mobile.
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
                Cree une room en quelques secondes, lance un jeu, passe le code a tes potes et joue sans friction.
                AF Games passe sur une DA plus nette, plus dense et plus actuelle.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="glass-card rounded-3xl p-4">
                <p className="section-title">Jeux</p>
                <p className="mt-3 text-3xl font-black text-white">{implementedGames.length}</p>
                <p className="mt-1 text-sm text-white/48">Disponibles maintenant</p>
              </div>
              <div className="glass-card rounded-3xl p-4">
                <p className="section-title">Categories</p>
                <p className="mt-3 text-3xl font-black text-white">{categoryCount}</p>
                <p className="mt-1 text-sm text-white/48">Du duel au party game</p>
              </div>
              <div className="glass-card rounded-3xl p-4">
                <p className="section-title">Acces</p>
                <p className="mt-3 text-3xl font-black text-white">0</p>
                <p className="mt-1 text-sm text-white/48">Compte obligatoire</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="premium-panel mesh-surface rounded-[1.75rem] p-5 hero-grid">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-title">Selection</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Rooms rapides, jeux en chaine</h2>
                  </div>
                  <TimerReset className="h-5 w-5 text-[#72e4f7]" />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  Choix de jeu, check des joueurs, lancement direct. Le flow est plus clair sur tel et desktop.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {featuredGames.map((game) => (
                    <span
                      key={game.id}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/72"
                    >
                      {game.icon} {game.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="premium-panel-soft rounded-[1.75rem] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-title">Promesse</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Un front plus net, sans casser la logique</h2>
                  </div>
                  <Wand2 className="h-5 w-5 text-[#ffb17f]" />
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-white/58">
                  <li>Interfaces plus lisibles sur telephone.</li>
                  <li>Typo moins froide et hiarchie plus claire.</li>
                  <li>Composants de jeu plus coherents entre eux.</li>
                </ul>
              </div>
            </div>
          </div>

          <div
            className="premium-panel mesh-surface hero-ring rounded-[2rem] p-5 sm:p-6"
            style={{ animation: "slideInRight 0.8s ease both" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-title">Command center</p>
                <h2 className="mt-2 text-3xl font-black text-white">Entre dans la room</h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Live</p>
                <p className="mt-1 text-sm font-semibold text-white/82">Instant join</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {guestName && <UsernameEditor initialName={guestName} onSave={handleSaveName} />}

              <div className="premium-panel-soft rounded-[1.6rem] p-4">
                <p className="section-title">Creer</p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Ouvre une salle privee, choisis un jeu et balance le code a tes potes.
                </p>
                <MagneticButton
                  onClick={handleCreate}
                  className="sunrise-button press-effect mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.16em] transition-transform"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle salle
                </MagneticButton>
              </div>

              <div className="premium-panel-soft rounded-[1.6rem] p-4">
                <p className="section-title">Rejoindre</p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Entre un code room et saute directement dans le lobby.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, ROOM_CODE_LENGTH))
                    }
                    placeholder="CODE"
                    maxLength={ROOM_CODE_LENGTH}
                    className="sunrise-input h-14 flex-1 rounded-2xl px-4 text-center font-mono text-lg font-bold tracking-[0.32em] text-white outline-none transition focus:border-[#72e4f7]/40 focus:shadow-[0_0_0_1px_rgba(114,228,247,0.25),0_0_30px_rgba(114,228,247,0.12)] placeholder:text-white/18"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleJoin();
                    }}
                  />
                  <button
                    onClick={handleJoin}
                    className="press-effect flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/58 transition hover:border-[#72e4f7]/35 hover:bg-[#72e4f7]/12 hover:text-white"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Flow</p>
                  <p className="mt-2 text-sm font-semibold text-white/84">Lobby clair</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Mobile</p>
                  <p className="mt-2 text-sm font-semibold text-white/84">UI compacte</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">Mood</p>
                  <p className="mt-2 text-sm font-semibold text-white/84">Arcade chaud</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4 text-sm text-white/38">
          <p>Gratuit, room code shareable, multi-jeux entre potes.</p>
          <div className="flex flex-wrap gap-2">
            {featuredGames.slice(0, 4).map((game) => (
              <span key={game.id} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/54">
                {game.icon} {game.name}
              </span>
            ))}
          </div>
        </div>
      </main>
    </EmberBackground>
  );
}
