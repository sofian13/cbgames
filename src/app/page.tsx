"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { generateRoomCode, ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { getOrCreateGuest, setGuestName } from "@/lib/guest";
import { GAMES } from "@/lib/games/registry";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { Sparkles } from "@/components/ConfettiBurst";
import { SiteNav } from "@/components/SiteNav";
import { InstallApp } from "@/components/InstallApp";

type CategoryMeta = {
  label: string;
  tag: string;
  color: MascotColor;
  icon: string;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  words:    { label: "Mots",      tag: "Vocabulaire", color: "sky",      icon: "💬" },
  trivia:   { label: "Quiz",      tag: "Culture",     color: "yellow",   icon: "🧠" },
  speed:    { label: "Rapide",    tag: "Réflexes",    color: "coral",    icon: "⚡" },
  strategy: { label: "Stratégie", tag: "Tête froide", color: "mint",     icon: "♟" },
  social:   { label: "Bluff",     tag: "Lis-les",     color: "pink",     icon: "🎭" },
  cards:    { label: "Cartes",    tag: "Tour table",  color: "purple",   icon: "🃏" },
  party:    { label: "Party",     tag: "Ambiance",    color: "lavender", icon: "🎉" },
  sport:    { label: "Sport",     tag: "Coordination", color: "sky",     icon: "🎾" },
};

function UsernameEditor({ initialName, onSave }: { initialName: string; onSave: (name: string) => void }) {
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
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value.slice(0, 20))}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") save();
          if (event.key === "Escape") { setName(initialName); setEditing(false); }
        }}
        className="h-9 rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] px-3 text-sm text-white outline-none transition focus:border-[color:var(--cb-brand)]"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 rounded-full border border-[color:var(--line-soft)] bg-white/[0.04] py-1 pl-1 pr-3 text-xs font-semibold text-white transition hover:border-[color:var(--cb-brand)]"
    >
      <MascotAvatar color="purple" size={28} mood="wink" />
      <span>{initialName}</span>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  // Init empty so SSR and first client render match; populate after mount.
  const [guestName, setGuestNameState] = useState("");
  useEffect(() => {
    setGuestNameState(getOrCreateGuest().name);
    // Précharge le bundle de la salle pour que "Créer une salle" soit instantané.
    router.prefetch("/room/_warm");
  }, [router]);

  const implementedGames = GAMES.filter((game) => game.implemented);
  const categoriesList = Array.from(new Set(implementedGames.map((g) => g.category)));

  const featured = [
    { id: "bomb-party",    emoji: "💣", name: "Bomb Party",    cat: "Mots",   color: "sky" as MascotColor,    line: "Désamorce avant l'explosion" },
    { id: "le-bluffeur",   emoji: "🎭", name: "Le Bluffeur",   cat: "Bluff",  color: "pink" as MascotColor,   line: "Invente, bluffe, démasque" },
    { id: "longueur-onde", emoji: "📡", name: "Longueur d'Onde", cat: "Party", color: "lavender" as MascotColor, line: "Synchro avec ton équipe" },
    { id: "motion-tennis", emoji: "🎾", name: "Motion Tennis", cat: "Sport",  color: "mint" as MascotColor,   line: "Ton tel = ta raquette" },
  ];

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
    <main className="relative min-h-screen overflow-hidden text-white">
      <Sparkles count={14} />
      <InstallApp />

      {/* HEADER */}
      <SiteNav />

      {/* HERO */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-10">
        <div className="grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-20">
          <div className="flex flex-col">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="af-chip" style={{
                background: "rgba(91,54,214,0.2)",
                borderColor: "rgba(91,54,214,0.4)",
                color: "#fff",
              }}>
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--af-mint)", boxShadow: "0 0 0 4px rgba(61,220,151,0.2)" }} />
                {implementedGames.length} jeux live
              </span>
              <span className="af-chip">{categoriesList.length} univers</span>
            </div>

            <h1 className="cb-display-xl" style={{ letterSpacing: -3, lineHeight: 0.92 }}>
              La soirée<br/>
              commence<br/>
              <span style={{ background: "linear-gradient(120deg, var(--af-pink), var(--af-yellow))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ici.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-dim)" }}>
              Un code, une salle, on joue.<br/>
              Pas de compte, pas d&apos;install — juste ton tel et tes potes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={handleCreate} className="af-btn af-btn-primary group flex items-center gap-3" style={{ padding: "18px 28px", fontSize: 16 }}>
                <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                Créer une salle
              </button>

              <div className="flex items-center gap-1 rounded-full border bg-white/[0.06] p-1.5 pl-5"
                   style={{ borderColor: "var(--line-soft)" }}>
                <input
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, ROOM_CODE_LENGTH))
                  }
                  onKeyDown={(event) => { if (event.key === "Enter") handleJoin(); }}
                  placeholder="CODE"
                  maxLength={ROOM_CODE_LENGTH}
                  className="w-24 bg-transparent text-base font-bold tracking-[0.4em] outline-none placeholder:text-white/40"
                  style={{ fontFamily: "var(--font-display)", color: "var(--af-yellow)" }}
                />
                <button
                  onClick={handleJoin}
                  aria-label="Rejoindre la salle"
                  disabled={code.length !== ROOM_CODE_LENGTH}
                  className="flex h-10 w-10 items-center justify-center rounded-full transition disabled:opacity-30"
                  style={{
                    background: code.length === ROOM_CODE_LENGTH ? "var(--cb-brand)" : "rgba(255,255,255,0.06)",
                    color: "#fff",
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mascots cluster */}
          <div className="relative h-[420px]">
            <div className="absolute inset-8" style={{
              background: "radial-gradient(circle at 50% 50%, rgba(255,62,165,0.35), transparent 70%)",
              filter: "blur(20px)",
            }} />
            <div className="absolute top-0 left-[30%]"><Mascot size={100} color="pink" mood="happy" arms cheering delay={0.0} /></div>
            <div className="absolute top-[20%] left-0"><Mascot size={84} color="yellow" mood="wink" arms delay={0.3} /></div>
            <div className="absolute top-[30%] right-0"><Mascot size={94} color="mint" mood="happy" arms delay={0.6} /></div>
            <div className="absolute bottom-[14%] left-[40%]"><Mascot size={130} color="purple" mood="happy" arms crown delay={0.2} /></div>
            <div className="absolute bottom-[20%] left-[12%]"><Mascot size={64} color="coral" mood="love" delay={0.9} /></div>
            <div className="absolute bottom-[6%] right-[15%]"><Mascot size={76} color="lavender" mood="happy" delay={1.1} /></div>
          </div>
        </div>
      </section>

      {/* FEATURED GRID */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 sm:px-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="af-eyebrow mb-2">01 — sélection</p>
            <h2 className="cb-display-lg" style={{ letterSpacing: -1 }}>Le top du moment.</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((g, i) => (
            <article
              key={g.id}
              className="site-card-hover relative overflow-hidden rounded-2xl border p-5"
              style={{
                background: `linear-gradient(155deg, ${MASCOT_PALETTE[g.color].body}1A, rgba(255,255,255,0.04))`,
                borderColor: `${MASCOT_PALETTE[g.color].body}33`,
                minHeight: 180,
              }}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl leading-none">{g.emoji}</span>
                <span className="af-chip" style={{ borderColor: MASCOT_PALETTE[g.color].body, color: MASCOT_PALETTE[g.color].body, background: "transparent" }}>
                  {g.cat}
                </span>
              </div>
              <div className="absolute right-[-12px] bottom-[-12px]" style={{ opacity: 0.55 }}>
                <Mascot size={80} color={g.color} mood="happy" delay={i * 0.25} />
              </div>
              <div className="relative mt-10">
                <p className="cb-display-md" style={{ color: MASCOT_PALETTE[g.color].body }}>{g.name}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>{g.line}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section
        className="relative z-10 border-y"
        style={{ borderColor: "var(--line-soft)", background: "linear-gradient(180deg, transparent, rgba(91,54,214,0.08))" }}
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 sm:py-20">
          <div className="mb-10">
            <p className="af-eyebrow mb-2">02 — univers</p>
            <h2 className="cb-display-lg text-balance" style={{ letterSpacing: -1 }}>
              Huit ambiances, <span style={{ color: "var(--af-pink)" }}>zéro temps mort</span>.
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categoriesList.map((cat, idx) => {
              const meta = CATEGORY_META[cat];
              if (!meta) return null;
              const count = implementedGames.filter((g) => g.category === cat).length;
              return (
                <article
                  key={cat}
                  className="site-card-hover relative overflow-hidden rounded-2xl border p-5"
                  style={{
                    background: `linear-gradient(155deg, ${MASCOT_PALETTE[meta.color].body}1A, rgba(255,255,255,0.04))`,
                    borderColor: `${MASCOT_PALETTE[meta.color].body}33`,
                    minHeight: 180,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span className="af-eyebrow">0{idx + 1}</span>
                    <span className="text-3xl">{meta.icon}</span>
                  </div>
                  <div className="absolute right-[-14px] bottom-[-10px]" style={{ opacity: 0.6 }}>
                    <Mascot size={72} color={meta.color} mood="happy" delay={idx * 0.18} />
                  </div>
                  <div className="relative mt-8">
                    <p className="cb-display-md" style={{ color: MASCOT_PALETTE[meta.color].body }}>{meta.label}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>{meta.tag}</p>
                    <div className="mt-3 flex items-center justify-between border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <span className="af-eyebrow" style={{ color: MASCOT_PALETTE[meta.color].body }}>{count} jeu{count > 1 ? "x" : ""}</span>
                      <ArrowRight className="h-4 w-4" style={{ color: MASCOT_PALETTE[meta.color].body }} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 sm:py-20">
        <div className="mb-10">
          <p className="af-eyebrow mb-2">03 — flow</p>
          <h2 className="cb-display-lg text-balance" style={{ letterSpacing: -1 }}>
            Trois étapes. <span style={{ color: "var(--af-mint)" }}>Aucune friction.</span>
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { num: "01", title: "Créer",   desc: "Un clic, un code de salle unique. Tu partages, on arrive.", color: "yellow", emoji: "✨" },
            { num: "02", title: "Choisir", desc: "Picke un jeu dans la liste. Chaque joueur vote prêt.",       color: "pink",   emoji: "🎯" },
            { num: "03", title: "Jouer",   desc: "Le jeu se lance. Écran + phones synchro. Ça part.",          color: "mint",   emoji: "🚀" },
          ].map((s) => (
            <article key={s.num} className="af-card-glass relative overflow-hidden p-6">
              <div className="absolute right-5 top-5 text-3xl opacity-60">{s.emoji}</div>
              <div
                className="cb-display-xl"
                style={{ color: MASCOT_PALETTE[s.color as MascotColor].body, fontSize: 70, lineHeight: 0.9 }}
              >
                {s.num}
              </div>
              <h3 className="cb-display-sm mt-4">{s.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>{s.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 overflow-hidden border-t" style={{ borderColor: "var(--line-soft)" }}>
        <div className="pointer-events-none absolute inset-0" style={{
          background: "radial-gradient(60% 100% at 50% 100%, rgba(255,62,165,0.25), transparent 60%)",
        }} />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-7 px-5 py-20 text-center sm:px-10 sm:py-28">
          <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>ready player one</p>
          <h2 className="cb-display-xl text-balance" style={{ letterSpacing: -2.5, fontSize: "clamp(3rem, 10vw, 6rem)" }}>
            On joue ?
          </h2>
          <p className="max-w-lg text-base" style={{ color: "var(--text-dim)" }}>
            Un code, une salle, {implementedGames.length} mini-jeux.<br/>
            Le reste dépend de ton canap&apos; et de ton wifi.
          </p>
          <button onClick={handleCreate} className="af-btn af-btn-primary flex items-center gap-3" style={{ padding: "20px 32px", fontSize: 16 }}>
            <Plus className="h-5 w-5" /> Lancer une salle
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8" style={{ borderColor: "var(--line-soft)" }}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-xs sm:px-10">
          <p style={{ color: "var(--text-dim)" }}>Sans compte, sans pub, sans friction.</p>
          <p className="cb-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
            af.games / party arcade
          </p>
        </div>
      </footer>
    </main>
  );
}
