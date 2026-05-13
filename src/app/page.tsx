"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Smartphone, Sparkles, Users2, Zap } from "lucide-react";
import { generateRoomCode, ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { getOrCreateGuest, setGuestName } from "@/lib/guest";
import { GAMES } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<
  string,
  { label: string; tagline: string; color: string; art: string }
> = {
  words:    { label: "Mots",      tagline: "Vocabulaire sous pression",  color: "var(--cb-words)",    art: "/categories/words.svg"    },
  trivia:   { label: "Quiz",      tagline: "Culture G à la seconde",      color: "var(--cb-trivia)",   art: "/categories/trivia.svg"   },
  speed:    { label: "Rapide",    tagline: "Réflexes purs",               color: "var(--cb-speed)",    art: "/categories/speed.svg"    },
  strategy: { label: "Stratégie", tagline: "Tête froide",                 color: "var(--cb-strategy)", art: "/categories/strategy.svg" },
  social:   { label: "Bluff",     tagline: "Lis les autres",              color: "var(--cb-social)",   art: "/categories/social.svg"   },
  cards:    { label: "Cartes",    tagline: "Tour de table",               color: "var(--cb-cards)",    art: "/categories/cards.svg"    },
  party:    { label: "Party",     tagline: "Ambiance",                    color: "var(--cb-party)",    art: "/categories/party.svg"    },
  sport:    { label: "Sport",     tagline: "Coordination",                color: "var(--cb-sport)",    art: "/categories/sport.svg"    },
};

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
          className="h-9 rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] px-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--cb-brand)] focus:ring-2 focus:ring-[color:var(--cb-brand-tint)]"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-strong)] transition hover:border-[color:var(--cb-brand)]"
    >
      {initialName}
    </button>
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
  const categoriesList = Array.from(
    new Set(implementedGames.map((g) => g.category))
  );

  const featured = [
    { id: "bomb-party",    emoji: "💣", name: "Bomb Party",    cat: "Mots",   color: "var(--cb-words)",    tagline: "Désamorce avant l'explosion" },
    { id: "loup-garou",    emoji: "🐺", name: "Loup-Garou",    cat: "Bluff",  color: "var(--cb-social)",   tagline: "Démasque les loups" },
    { id: "motion-tennis", emoji: "🎾", name: "Motion Tennis", cat: "Sport",  color: "var(--cb-sport)",    tagline: "Ton tel = ta raquette" },
    { id: "contree",       emoji: "♥",  name: "La Contrée",    cat: "Cartes", color: "var(--cb-cards)",    tagline: "Belote 2v2, coinche incluse" },
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
    <main className="relative min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* HERO */}
      <section className="relative w-full">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-10 pt-6 sm:px-10">
          {/* Header */}
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-black"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                cb
              </span>
              <span
                className="font-display text-xl font-black tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                games
              </span>
            </div>

            {guestName && (
              <UsernameEditor initialName={guestName} onSave={handleSaveName} />
            )}
          </header>

          {/* Hero content */}
          <div className="flex flex-col gap-8 py-12 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-16">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    background: "var(--cb-brand-tint)",
                    borderColor: "var(--line-brand)",
                    color: "var(--cb-brand)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full cb-live-pulse"
                    style={{ background: "var(--cb-brand)" }}
                  />
                  {implementedGames.length} jeux live
                </span>
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ borderColor: "var(--line-soft)", color: "var(--text-dim)" }}
                >
                  {categoriesList.length} univers
                </span>
              </div>

              <h1
                className="cb-display-xl text-balance"
                style={{ fontFamily: "var(--font-display)" }}
              >
                La soirée
                <br />
                <span style={{ color: "var(--cb-brand)" }}>commence ici.</span>
              </h1>

              <p
                className="max-w-md text-base leading-relaxed sm:text-lg"
                style={{ color: "var(--text-dim)" }}
              >
                Un code, une salle, on joue. Pas de compte, pas d&apos;install — juste ton tel et tes potes.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleCreate}
                  className="cb-btn cb-btn-primary cb-btn-lg group"
                >
                  <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                  Créer une salle
                </button>

                <div
                  className="flex items-center gap-1 rounded-full border bg-[color:var(--surface)] p-1.5 pl-5"
                  style={{ borderColor: "var(--line-soft)" }}
                >
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
                    className="w-24 bg-transparent text-base font-bold tracking-[0.4em] outline-none placeholder:text-[color:var(--text-muted)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  />
                  <button
                    onClick={handleJoin}
                    aria-label="Rejoindre la salle"
                    disabled={code.length !== ROOM_CODE_LENGTH}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: code.length === ROOM_CODE_LENGTH ? "var(--cb-brand)" : "var(--surface-2)",
                      color: code.length === ROOM_CODE_LENGTH ? "var(--cb-brand-ink)" : "var(--text-dim)",
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Featured games grid */}
            <div className="grid grid-cols-2 gap-3">
              {featured.map((g) => (
                <article
                  key={g.id}
                  className="site-card-hover relative overflow-hidden rounded-2xl border bg-[color:var(--surface)] p-5"
                  style={{ borderColor: "var(--line-soft)" }}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-60"
                    style={{
                      background: `radial-gradient(100% 120% at 50% 100%, ${g.color}22, transparent 70%)`,
                    }}
                  />
                  <div className="relative flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                      <span className="text-4xl leading-none">{g.emoji}</span>
                      <span
                        className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ borderColor: g.color, color: g.color }}
                      >
                        {g.cat}
                      </span>
                    </div>
                    <div>
                      <p className="cb-display-sm">{g.name}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
                        {g.tagline}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section className="border-y" style={{ borderColor: "var(--line-soft)", background: "var(--surface)" }}>
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 sm:py-20">
          <div className="mb-10 flex flex-col gap-3">
            <span className="cb-eyebrow">01 — univers</span>
            <h2 className="cb-display-lg text-balance">
              Huit ambiances,
              <br />
              <span style={{ color: "var(--cb-brand)" }}>{implementedGames.length} jeux</span>, zéro temps mort.
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categoriesList.map((cat, idx) => {
              const meta = CATEGORY_META[cat];
              if (!meta) return null;
              const count = implementedGames.filter((g) => g.category === cat).length;
              const sample = implementedGames.find((g) => g.category === cat);
              return (
                <article
                  key={cat}
                  className="site-card-hover group relative overflow-hidden rounded-2xl border bg-[color:var(--bg-2)] p-5 aspect-[4/5]"
                  style={{ borderColor: "var(--line-soft)" }}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-50 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(100% 120% at 50% 100%, ${meta.color}33, transparent 70%)`,
                    }}
                  />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="cb-eyebrow">0{idx + 1}</span>
                      <span className="text-4xl">{sample?.icon}</span>
                    </div>
                    <img
                      src={meta.art}
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2 select-none transition-transform duration-500 group-hover:scale-105"
                      draggable={false}
                    />
                    <div className="relative">
                      <p className="cb-display-md" style={{ color: meta.color }}>
                        {meta.label}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
                        {meta.tagline}
                      </p>
                      <div
                        className="mt-3 flex items-center justify-between border-t pt-2"
                        style={{ borderColor: "var(--line-soft)" }}
                      >
                        <span className="cb-eyebrow">
                          {count} jeu{count > 1 ? "x" : ""}
                        </span>
                        <ArrowRight
                          className="h-4 w-4 transition-all group-hover:translate-x-1"
                          style={{ color: meta.color }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 sm:py-20">
        <div className="mb-10 flex flex-col gap-3">
          <span className="cb-eyebrow">02 — flow</span>
          <h2 className="cb-display-lg text-balance">
            Trois étapes. Aucune friction.
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { num: "01", title: "Créer",  desc: "Un clic, un code de salle unique. Tu partages, on arrive.",     icon: Plus    },
            { num: "02", title: "Choisir", desc: "Picke un jeu dans la liste. Chaque joueur vote prêt.",          icon: Sparkles },
            { num: "03", title: "Jouer",   desc: "Le jeu se lance. Écran principal + phones synchro. Ça part.", icon: Zap     },
          ].map((step) => (
            <article
              key={step.num}
              className="relative overflow-hidden rounded-2xl border bg-[color:var(--surface)] p-6"
              style={{ borderColor: "var(--line-soft)" }}
            >
              <div className="mb-8 flex items-center justify-between">
                <span
                  className="font-black leading-none"
                  style={{
                    color: "var(--cb-brand)",
                    fontFamily: "var(--font-display)",
                    fontSize: "3.5rem",
                  }}
                >
                  {step.num}
                </span>
                <step.icon className="h-6 w-6" style={{ color: "var(--text-dim)" }} />
              </div>
              <h3 className="cb-display-sm">{step.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
                {step.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        className="border-t"
        style={{ borderColor: "var(--line-soft)", background: "var(--surface)" }}
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 sm:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Users2,     label: "2 à 8 joueurs",   title: "Multi rapide",   desc: "Des parties courtes qui s'enchaînent." },
              { icon: Smartphone, label: "Mobile first",    title: "Touch first",    desc: "Grandes cibles, peu de texte, action directe." },
              { icon: Sparkles,   label: "Zero setup",      title: "Aucune friction", desc: "Pas d'install, pas de compte, pas de mur de texte." },
            ].map((f) => (
              <article
                key={f.title}
                className="site-card-hover relative overflow-hidden rounded-2xl border bg-[color:var(--bg-2)] p-6"
                style={{ borderColor: "var(--line-soft)" }}
              >
                <f.icon className="h-6 w-6" style={{ color: "var(--cb-brand)" }} />
                <p className="cb-eyebrow mt-6">{f.label}</p>
                <h3 className="cb-display-sm mt-1">{f.title}</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
                  {f.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative overflow-hidden border-t"
        style={{ borderColor: "var(--line-soft)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(60% 100% at 50% 100%, var(--cb-brand-tint), transparent 60%)`,
          }}
        />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-5 py-20 text-center sm:px-10 sm:py-28">
          <span className="cb-eyebrow">ready player one</span>
          <h2 className="cb-display-xl text-balance">
            On joue ?
          </h2>
          <p className="max-w-lg text-base" style={{ color: "var(--text-dim)" }}>
            Un code, une salle, {implementedGames.length} mini-jeux. Le reste dépend de ton canapé et de ton wifi.
          </p>
          <button onClick={handleCreate} className="cb-btn cb-btn-brand cb-btn-lg">
            <Plus className="h-5 w-5" />
            Lancer une salle
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="border-t py-8"
        style={{ borderColor: "var(--line-soft)", background: "var(--bg-deep)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-xs sm:px-10">
          <p style={{ color: "var(--text-dim)" }}>Sans compte, sans pub, sans friction.</p>
          <p
            className={cn("cb-mono uppercase tracking-[0.22em]")}
            style={{ color: "var(--text-muted)" }}
          >
            cb / party arcade
          </p>
        </div>
      </footer>
    </main>
  );
}
