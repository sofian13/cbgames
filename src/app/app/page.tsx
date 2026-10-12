"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, Smartphone, Users, Wifi, X } from "lucide-react";
import { Mascot, MascotAvatar, MASCOT_PALETTE } from "@/components/Mascot";
import { GameExplainer } from "@/components/lobby/game-explainer";
import { generateRoomCode, ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { getOrCreateGuest, setGuestName } from "@/lib/guest";
import { getGameById } from "@/lib/games/registry";
import { APP_SECTIONS, type AppGame } from "@/lib/games/app-catalog";
import { haptic } from "@/lib/app-mode";

const LocalPlay = dynamic(() => import("@/components/local/local-play").then((m) => m.LocalPlay), { ssr: false });

const BG = "#0B0620";

export default function AppHome() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [sheet, setSheet] = useState<AppGame | null>(null);
  const [local, setLocal] = useState<{ game?: string } | null>(null);
  const [editName, setEditName] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(getOrCreateGuest().name);
    router.prefetch("/room/_warm");
  }, [router]);

  useEffect(() => {
    if (joinOpen) codeRef.current?.focus();
  }, [joinOpen]);

  const createRoom = useCallback((gameId?: string) => {
    haptic("medium");
    if (!navigator.onLine) {
      setLocal({ game: gameId });
      return;
    }
    const roomCode = generateRoomCode();
    sessionStorage.setItem("af-created-room-code", roomCode);
    if (gameId) sessionStorage.setItem("zz-preselect-game", gameId);
    router.push(`/room/${roomCode}`);
  }, [router]);

  const join = useCallback(() => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== ROOM_CODE_LENGTH) return;
    haptic("medium");
    router.push(`/room/${trimmed}`);
  }, [code, router]);

  const openGame = (g: AppGame) => {
    haptic();
    setSheet(g);
  };

  return (
    <main className="min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] text-white" style={{ background: BG }}>
      {/* lueur douce en haut */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-[420px]"
           style={{ background: "radial-gradient(60% 70% at 50% 0%, rgba(255,62,165,0.20), transparent 70%)" }} />

      {local && <LocalPlay initialGame={local.game} onClose={() => setLocal(null)} />}

      <div className="relative mx-auto w-full max-w-md px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MascotAvatar color="pink" size={38} mood="laughing" border={false} />
            <span className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              zinzin
            </span>
          </div>
          <button onClick={() => setEditName(true)}
                  className="flex h-11 items-center gap-2 rounded-full bg-white/[0.06] pl-1.5 pr-4 text-sm font-semibold active:scale-95">
            <MascotAvatar color="purple" size={32} mood="wink" border={false} />
            <span className="max-w-[110px] truncate">{name || "…"}</span>
          </button>
        </header>

        {/* HERO */}
        <section className="mt-6 overflow-hidden rounded-[30px] p-5"
                 style={{ background: "linear-gradient(145deg, #FF3EA5 0%, #7A4EE8 100%)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white/80">Salut {name.split(" ")[0] || "toi"} 👋</p>
              <h1 className="mt-1 text-[30px] font-semibold leading-[1.02] tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                On joue à quoi<br />ce soir ?
              </h1>
            </div>
            <Mascot size={74} color="yellow" mood="fire" arms />
          </div>

          {!joinOpen ? (
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button onClick={() => createRoom()}
                      className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-bold active:scale-[0.97]"
                      style={{ color: "#2A0E5C" }}>
                <Users className="h-4 w-4" /> Créer
              </button>
              <button onClick={() => { haptic(); setJoinOpen(true); }}
                      className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-black/20 text-[15px] font-bold active:scale-[0.97]">
                <Wifi className="h-4 w-4" /> Rejoindre
              </button>
            </div>
          ) : (
            <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); join(); }}>
              <input ref={codeRef} value={code}
                     onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH))}
                     placeholder="CODE" inputMode="text" autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                     className="h-14 min-w-0 flex-1 rounded-2xl bg-white px-4 text-center text-xl font-bold tracking-[0.4em] outline-none placeholder:text-black/25"
                     style={{ color: "#2A0E5C", fontFamily: "var(--font-mono)" }} />
              <button type="submit" disabled={code.length !== ROOM_CODE_LENGTH} aria-label="Rejoindre"
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/25 disabled:opacity-40 active:scale-95">
                <ArrowRight className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => { setJoinOpen(false); setCode(""); }} aria-label="Annuler"
                      className="flex h-14 w-11 items-center justify-center rounded-2xl text-white/70">
                <X className="h-5 w-5" />
              </button>
            </form>
          )}
        </section>

        <button onClick={() => { haptic(); setLocal({}); }}
                className="mt-3 flex h-14 w-full items-center gap-3 rounded-2xl bg-white/[0.05] px-4 text-left active:scale-[0.99]">
          <Smartphone className="h-5 w-5 text-[#3DDC97]" />
          <span className="flex-1">
            <span className="block text-[15px] font-semibold">Sur un seul téléphone</span>
            <span className="block text-xs text-white/50">On se passe le tél · marche sans réseau</span>
          </span>
          <ArrowRight className="h-4 w-4 text-white/40" />
        </button>

        {/* SECTIONS */}
        {APP_SECTIONS.map((section) => (
          <section key={section.id} className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{section.title}</h2>
                <p className="text-xs text-white/45">{section.subtitle}</p>
              </div>
            </div>
            <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {section.games.map((g) => <GameTile key={g.id} game={g} onOpen={() => openGame(g)} />)}
            </div>
          </section>
        ))}

        <p className="mt-10 text-center text-xs text-white/30">Zinzin · à consommer avec modération 🫧</p>
      </div>

      {sheet && (
        <GameSheet game={sheet} onClose={() => setSheet(null)}
                   onOnline={() => { const id = sheet.id; setSheet(null); createRoom(id); }}
                   onLocal={() => { const id = sheet.id; setSheet(null); setLocal({ game: id }); }} />
      )}

      {editName && (
        <NameSheet initial={name} onClose={() => setEditName(false)}
                   onSave={(n) => { setGuestName(n); setName(n); setEditName(false); }} />
      )}
    </main>
  );
}

function GameTile({ game, onOpen }: { game: AppGame; onOpen: () => void }) {
  const meta = getGameById(game.id);
  if (!meta) return null;
  const c = MASCOT_PALETTE[game.color];
  return (
    <button onClick={onOpen}
            className="relative flex h-[208px] w-[164px] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] p-4 text-left active:scale-[0.97] transition-transform"
            style={{ background: `linear-gradient(160deg, ${c.body}38 0%, ${c.body}14 100%)`, border: `1px solid ${c.body}40` }}>
      <div className="absolute -right-3 -top-2">
        <Mascot size={78} color={game.color} mood={game.mood} bob={false} shadow={false} />
      </div>
      <div className="mt-auto">
        <h3 className="text-[19px] font-semibold leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          {meta.name.replace(/\s*[\p{Extended_Pictographic}\u{FE0F}]+$/u, "")}
        </h3>
        <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-white/65">{meta.pitch ?? meta.description}</p>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {game.local && <Badge>1 tél</Badge>}
          {game.online && <Badge>En ligne</Badge>}
          {game.adult && <Badge>18+</Badge>}
        </div>
      </div>
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold text-white/80">{children}</span>;
}

function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/55 backdrop-blur-sm" onClick={onClose}
         style={{ animation: "fadeIn 0.18s ease" }}>
      <div className="max-h-[88dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[32px] px-5 pt-3"
           style={{ background: "#160D33", animation: "sheetUp 0.28s cubic-bezier(.2,.9,.3,1)" }}
           onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
        {children}
      </div>
      <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:none}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}

function GameSheet({ game, onClose, onOnline, onLocal }: {
  game: AppGame; onClose: () => void; onOnline: () => void; onLocal: () => void;
}) {
  const meta = getGameById(game.id);
  if (!meta) return null;
  const c = MASCOT_PALETTE[game.color];
  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px]" style={{ background: `${c.body}30` }}>
          <Mascot size={64} color={game.color} mood={game.mood} shadow={false} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[26px] font-semibold leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{meta.name}</h2>
          <p className="mt-0.5 text-sm text-white/55">{meta.minPlayers}–{meta.maxPlayers} joueurs{game.adult ? " · 18+" : ""}</p>
        </div>
      </div>

      <div className="mt-5">
        <GameExplainer game={meta} accent={c.body} />
      </div>

      <div className="sticky bottom-0 -mx-5 mt-5 grid gap-2.5 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3"
           style={{ background: "linear-gradient(180deg, rgba(22,13,51,0) 0%, #160D33 30%)" }}>
        {game.online && (
          <button onClick={onOnline} className="flex h-14 items-center justify-center gap-2 rounded-2xl text-[15px] font-bold active:scale-[0.98]"
                  style={{ background: c.body, color: "#15082E" }}>
            <Users className="h-4 w-4" /> Créer une partie en ligne
          </button>
        )}
        {game.local && (
          <button onClick={onLocal}
                  className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-[15px] font-bold active:scale-[0.98] ${game.online ? "bg-white/[0.07] text-white" : ""}`}
                  style={game.online ? undefined : { background: c.body, color: "#15082E" }}>
            <Smartphone className="h-4 w-4" /> Jouer sur ce téléphone
          </button>
        )}
      </div>
    </Sheet>
  );
}

function NameSheet({ initial, onClose, onSave }: { initial: string; onClose: () => void; onSave: (n: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <Sheet onClose={onClose}>
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Ton pseudo</h2>
      <p className="mt-1 text-sm text-white/55">C&apos;est ce que tes potes verront en partie.</p>
      <form className="pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]" onSubmit={(e) => { e.preventDefault(); const v = value.trim(); if (v) onSave(v.slice(0, 20)); }}>
        <input value={value} onChange={(e) => setValue(e.target.value.slice(0, 20))} autoFocus autoCorrect="off" spellCheck={false}
               className="mt-4 h-14 w-full rounded-2xl bg-white/[0.07] px-4 text-base font-semibold outline-none focus:bg-white/[0.1]" />
        <button type="submit" className="mt-3 h-14 w-full rounded-2xl bg-white text-[15px] font-bold active:scale-[0.98]" style={{ color: "#2A0E5C" }}>
          Enregistrer
        </button>
      </form>
    </Sheet>
  );
}
