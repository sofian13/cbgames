"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Gamepad2,
  Plus,
  Smartphone,
  Sparkles,
  Users2,
  Zap,
} from "lucide-react";
import { generateRoomCode, ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { getOrCreateGuest, setGuestName } from "@/lib/guest";
import { GAMES } from "@/lib/games/registry";
import { LineMask } from "@/components/animations/line-mask";
import { Magnetic } from "@/components/animations/magnetic";
import { Marquee } from "@/components/animations/marquee";
import { Reveal } from "@/components/animations/reveal";

const CATEGORY_META: Record<
  string,
  { label: string; tagline: string; hue: string }
> = {
  words: { label: "Mots", tagline: "Vocabulaire sous pression", hue: "188, 95%, 62%" },
  trivia: { label: "Quiz", tagline: "Culture G a la seconde", hue: "42, 100%, 66%" },
  speed: { label: "Rapide", tagline: "Reflexes purs", hue: "18, 96%, 63%" },
  strategy: { label: "Strategie", tagline: "Tete froide", hue: "156, 72%, 52%" },
  social: { label: "Bluff", tagline: "Lis les autres", hue: "350, 86%, 64%" },
  cards: { label: "Cartes", tagline: "Tour de table", hue: "214, 92%, 66%" },
  party: { label: "Party", tagline: "Ambiance", hue: "198, 90%, 64%" },
  sport: { label: "Skill", tagline: "Coordination", hue: "132, 68%, 52%" },
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
          className="h-10 rounded-full border border-white/12 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-[color:var(--brand-2)] focus:bg-white/[0.08]"
        />
        <button
          onClick={save}
          className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:border-[color:var(--brand-2)] hover:text-white"
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-[color:var(--brand-2)] hover:bg-white/[0.08] hover:text-white"
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
  const categories = Array.from(
    new Set(implementedGames.map((game) => game.category))
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
    <main className="grain-overlay relative min-h-screen overflow-x-clip bg-[#060818] text-white">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen w-full">
        <div className="spotlight" aria-hidden />
        <div className="spotlight spotlight-cool" aria-hidden />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-10 pt-6 sm:px-10">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_10px_35px_rgba(0,0,0,0.28)]">
                <Gamepad2 className="h-5 w-5 text-[color:var(--brand-light)]" />
              </div>
              <div>
                <p className="label-xs">AF Games</p>
                <p className="text-sm text-white/72">Party arcade</p>
              </div>
            </div>

            {guestName && (
              <UsernameEditor initialName={guestName} onSave={handleSaveName} />
            )}
          </header>

          <div className="flex flex-1 flex-col justify-center gap-10 py-10 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-16">
            <div className="flex flex-col gap-6 lg:gap-8">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line-brand)] bg-[rgba(56,201,255,0.06)] px-3 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--brand-2)] shadow-[0_0_8px_var(--brand-2)]" />
                  <span className="label-accent">
                    {implementedGames.length} jeux live
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                  <span className="label-xs">{categories.length} univers</span>
                </span>
              </div>

              <h1 className="heading-display text-white">
                <LineMask as="span" trigger="load" splitBy="word" stagger={0.05}>
                  Lance une room.
                </LineMask>
                <br />
                <LineMask
                  as="span"
                  trigger="load"
                  splitBy="word"
                  stagger={0.05}
                  delay={0.25}
                >
                  Choisis un jeu.
                </LineMask>
                <br />
                <LineMask
                  as="span"
                  trigger="load"
                  splitBy="word"
                  stagger={0.05}
                  delay={0.5}
                  className="text-[color:var(--brand)]"
                >
                  Fais jouer tout le monde.
                </LineMask>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-[color:var(--text-dim)] sm:text-lg">
                Une party arcade propre, rapide et lisible sur telephone comme
                sur ordi. Un code, une salle, puis des mini-jeux qui partent
                sans friction.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Magnetic strength={0.25}>
                  <button onClick={handleCreate} className="btn-brand">
                    <Plus className="h-4 w-4" />
                    Nouvelle salle
                  </button>
                </Magnetic>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5 pl-5 backdrop-blur-xl">
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
                    className="w-28 bg-transparent font-mono text-base font-semibold tracking-[0.42em] text-white outline-none placeholder:text-white/20"
                  />
                  <Magnetic strength={0.2}>
                    <button
                      onClick={handleJoin}
                      aria-label="Rejoindre la salle"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-white/80 transition hover:bg-[color:var(--brand-2)] hover:text-[#06101a]"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Magnetic>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[rgba(255,106,61,0.12)] via-[rgba(14,17,48,0.8)] to-[rgba(56,201,255,0.12)] p-8 backdrop-blur-2xl">
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--brand)] blur-3xl" />
                    <div className="absolute left-1/3 top-2/3 h-32 w-32 rounded-full bg-[color:var(--brand-2)] blur-2xl" />
                  </div>

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="label-accent">Preview</span>
                      <span className="label-xs">Session live</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-5xl font-bold tracking-[0.15em] text-white">
                          AFKR
                        </span>
                        <span className="label-xs">room</span>
                      </div>
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <div className="flex items-center gap-2">
                          <Users2 className="h-3.5 w-3.5" />
                          <span>5 / 8 joueurs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-[color:var(--brand-2)]" />
                          <span className="text-white/70">Pret a lancer</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {["BOMB", "QUIZ", "DRAW"].map((name, i) => (
                        <div
                          key={name}
                          className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] font-mono text-[10px] font-bold tracking-[0.2em] text-white/70"
                          style={{
                            transform: `rotate(${(i - 1) * 2}deg)`,
                          }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute -left-4 -top-4 rounded-full border border-[color:var(--line-brand)] bg-[#0b1030]/80 px-4 py-2 backdrop-blur-xl">
                  <span className="label-accent">26 mini-jeux</span>
                </div>
                <div className="absolute -bottom-3 -right-2 rounded-full border border-white/10 bg-[#0b1030]/80 px-4 py-2 backdrop-blur-xl">
                  <span className="label-xs">sans compte</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 self-start">
            <div className="scroll-pulse" />
            <span className="label-xs">scroll</span>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <section className="relative border-y border-white/5 bg-[#08091F] py-14">
        <Marquee speed={0.5}>
          {implementedGames.map((game, i) => (
            <span key={game.id} className="flex items-center gap-14">
              <span
                className={
                  i % 3 === 0
                    ? "marquee-item marquee-item-outline"
                    : "marquee-item"
                }
              >
                {game.name}
              </span>
              <span className="marquee-sep" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* ===== 8 CATEGORIES BENTO ===== */}
      <section className="relative mx-auto w-full max-w-7xl px-6 py-28 sm:px-10 sm:py-36">
        <Reveal className="mb-14 flex flex-col gap-4">
          <span className="label-accent">01 — Univers</span>
          <h2 className="heading-h2 max-w-3xl">
            <LineMask as="span" splitBy="word" stagger={0.05}>
              Huit univers, ving-six jeux, zero temps mort.
            </LineMask>
          </h2>
          <p className="max-w-xl text-base text-[color:var(--text-dim)]">
            Chaque categorie a son rythme, son ambiance, ses regles. Choisis
            selon l&apos;humeur du moment.
          </p>
        </Reveal>

        <Reveal
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
          stagger={0.06}
          staggerSelector=".bento-card"
          y={28}
        >
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = implementedGames.filter(
              (g) => g.category === cat
            ).length;
            const sample = implementedGames.find((g) => g.category === cat);
            return (
              <article
                key={cat}
                className="bento-card group relative aspect-[4/5] overflow-hidden p-5"
                style={
                  { "--cat": meta.hue } as React.CSSProperties
                }
              >
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(100% 120% at 50% 100%, hsla(${meta.hue}, 0.22), transparent 70%)`,
                  }}
                />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="label-xs">0{categories.indexOf(cat) + 1}</span>
                    <span
                      className="font-mono text-4xl"
                      aria-hidden
                    >
                      {sample?.icon}
                    </span>
                  </div>

                  <div>
                    <p className="heading-h3 text-white">{meta.label}</p>
                    <p className="mt-2 text-sm text-[color:var(--text-dim)]">
                      {meta.tagline}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                      <span className="label-xs">
                        {count} jeu{count > 1 ? "x" : ""}
                      </span>
                      <ArrowRight className="h-4 w-4 text-white/40 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--brand-2)]" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </Reveal>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative border-y border-white/5 bg-gradient-to-b from-[#07091C] via-[#0B0D25] to-[#07091C] py-28 sm:py-36">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <Reveal className="mb-16 flex flex-col gap-4">
            <span className="label-accent">02 — Flow</span>
            <h2 className="heading-h2 max-w-3xl">
              <LineMask as="span" splitBy="word" stagger={0.05}>
                Trois etapes. Pas de compte. Pas de friction.
              </LineMask>
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Creer",
                desc: "Un clic, un code de salle unique. Tu partages, on arrive.",
                icon: Plus,
              },
              {
                num: "02",
                title: "Choisir",
                desc: "Picke un jeu dans les 26 disponibles. Chaque joueur vote pret.",
                icon: Gamepad2,
              },
              {
                num: "03",
                title: "Jouer",
                desc: "Le jeu se lance. Ecran principal + phones synchro. Ca part.",
                icon: Zap,
              },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 0.1}>
                <article className="relative h-full overflow-hidden rounded-3xl border border-white/8 bg-[rgba(14,17,48,0.55)] p-8 backdrop-blur-xl">
                  <div className="mb-10 flex items-center justify-between">
                    <span className="font-mono text-6xl font-bold leading-none text-[color:var(--brand)]">
                      {step.num}
                    </span>
                    <step.icon className="h-6 w-6 text-[color:var(--brand-2)]" />
                  </div>
                  <h3 className="heading-h3 text-white">{step.title}</h3>
                  <p className="mt-3 text-[color:var(--text-dim)]">
                    {step.desc}
                  </p>
                  <div
                    className="mt-8 h-px w-full"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--brand-2), transparent)",
                    }}
                  />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="relative mx-auto w-full max-w-7xl px-6 py-28 sm:px-10 sm:py-36">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Users2,
              label: "2 a 8 joueurs",
              title: "Multi rapide",
              desc: "Des parties courtes qui se lancent vite et s'enchainent.",
              accent: "var(--brand-2)",
            },
            {
              icon: Smartphone,
              label: "Pense telephone",
              title: "Touch first",
              desc: "Grandes cibles, peu de texte, action directe au doigt.",
              accent: "var(--brand)",
            },
            {
              icon: Sparkles,
              label: "Zero setup",
              title: "Aucune friction",
              desc: "Pas d'install, pas de compte, pas de mur de texte.",
              accent: "var(--brand-3)",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-white/8 bg-[rgba(14,17,48,0.5)] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/18">
                <f.icon
                  className="h-7 w-7 transition-transform duration-500 group-hover:scale-110"
                  style={{ color: f.accent }}
                />
                <p className="mt-8 label-xs">{f.label}</p>
                <h3 className="heading-h3 mt-2 text-white">{f.title}</h3>
                <p className="mt-3 text-[color:var(--text-dim)]">{f.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden border-t border-white/5 bg-[#060818] py-32 sm:py-44">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[color:var(--brand)] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-[color:var(--brand-2)] blur-[120px]" />
        </div>

        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 text-center sm:px-10">
          <span className="label-accent">Ready player one</span>
          <Reveal>
            <h2 className="heading-display text-white">
              <LineMask as="span" splitBy="word" stagger={0.05}>
                On joue ?
              </LineMask>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="max-w-xl text-lg text-[color:var(--text-dim)]">
              Un code, une salle, 26 mini-jeux. Le reste depend de ton canape
              et de ton wifi.
            </p>
          </Reveal>

          <Reveal delay={0.25} className="flex flex-wrap items-center justify-center gap-4">
            <Magnetic strength={0.3}>
              <button
                onClick={handleCreate}
                className="btn-brand text-base"
                style={{ padding: "1.15rem 2rem" }}
              >
                <Plus className="h-5 w-5" />
                Lancer une salle
              </button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 bg-[#05071A] py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 text-xs text-white/35 sm:px-10">
          <p>Sans compte, sans pub, sans friction.</p>
          <p className="font-mono uppercase tracking-[0.22em]">
            AF / party arcade
          </p>
        </div>
      </footer>
    </main>
  );
}
