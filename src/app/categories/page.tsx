"use client";

/**
 * /categories — Bibliothèque interactive des jeux par catégorie.
 *
 * Les jeux affichés viennent de `@/lib/games/registry` (GAMES). Le filtre
 * de catégorie se fait côté client via useState. La grille est cliquable :
 * un clic sur une carte navigue vers `/?game=<id>` (ouvre le lobby).
 *
 * TODO :
 *   - Quand un game card mène à un lobby dédié plutôt qu'à un query param,
 *     change le `<Link href>` en conséquence.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Sparkles } from "@/components/ConfettiBurst";
import { Mascot, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { GAMES } from "@/lib/games/registry";

interface CategoryMeta {
  id: string;
  label: string;
  tag: string;
  color: MascotColor;
  icon: string;
}

const CATEGORY_META: CategoryMeta[] = [
  { id: "words",    label: "Mots",      tag: "Vocabulaire",   color: "sky",      icon: "💬" },
  { id: "trivia",   label: "Quiz",      tag: "Culture G",     color: "yellow",   icon: "🧠" },
  { id: "speed",    label: "Rapide",    tag: "Réflexes",      color: "coral",    icon: "⚡" },
  { id: "strategy", label: "Stratégie", tag: "Tête froide",   color: "mint",     icon: "♟" },
  { id: "social",   label: "Bluff",     tag: "Lis les gens",  color: "pink",     icon: "🎭" },
  { id: "cards",    label: "Cartes",    tag: "Tour de table", color: "purple",   icon: "🃏" },
  { id: "party",    label: "Party",     tag: "Chaos joyeux",  color: "lavender", icon: "🎉" },
  { id: "sport",    label: "Sport",     tag: "Coordination",  color: "sky",      icon: "🎾" },
];

export default function CategoriesPage() {
  const [active, setActive] = useState<string>("all");

  const visibleCats = useMemo(() => {
    if (active === "all") return CATEGORY_META;
    return CATEGORY_META.filter((c) => c.id === active);
  }, [active]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of GAMES) {
      const k = (g.category as string) ?? "party";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, []);

  const total = GAMES.length;

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Sparkles count={14} />
      <SiteNav />

      {/* HERO */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-10 sm:px-10">
        <p className="af-eyebrow" style={{ color: "var(--af-mint)" }}>
          ✦ Bibliothèque · {total} jeux
        </p>
        <h1 className="mt-3 cb-display-xl" style={{ letterSpacing: -2.2, lineHeight: 0.95 }}>
          Huit ambiances,<br />
          <span
            style={{
              background: "linear-gradient(120deg, var(--af-pink), var(--af-yellow))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            une seule app.
          </span>
        </h1>
        <p className="mt-4 max-w-lg text-base" style={{ color: "var(--text-dim)" }}>
          Filtre par humeur. Picke un jeu. Pas de friction, pas d&apos;install.
        </p>
      </section>

      {/* FILTERS */}
      <section className="relative z-10 mx-auto mt-6 w-full max-w-6xl px-5 sm:px-10">
        <div className="flex flex-wrap gap-2">
          <FilterPill active={active === "all"} onClick={() => setActive("all")}>
            Tout · {total}
          </FilterPill>
          {CATEGORY_META.map((c) => (
            <FilterPill
              key={c.id}
              active={active === c.id}
              color={c.color}
              onClick={() => setActive(c.id)}
            >
              <span>{c.icon}</span>
              {c.label} · {counts.get(c.id) ?? 0}
            </FilterPill>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl px-5 pb-12 sm:px-10">
        {visibleCats.map((c) => {
          const games = GAMES.filter((g) => g.category === c.id);
          if (!games.length) return null;
          return (
            <div key={c.id} className="mb-12">
              <div className="mb-4 flex items-end justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                    style={{
                      background: `linear-gradient(160deg, ${MASCOT_PALETTE[c.color].body}, ${MASCOT_PALETTE[c.color].deep})`,
                      boxShadow: `0 10px 24px ${MASCOT_PALETTE[c.color].glow}`,
                    }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p className="af-eyebrow" style={{ color: MASCOT_PALETTE[c.color].body }}>{c.tag}</p>
                    <h2 className="cb-display-md" style={{ fontSize: 34, letterSpacing: -1 }}>{c.label}</h2>
                  </div>
                </div>
                <span className="cb-mono text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: 1.5 }}>
                  {games.length} jeu{games.length > 1 ? "x" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {games.map((g, i) => (
                  <Link
                    key={g.id}
                    href={`/?game=${g.id}`}
                    className="site-card-hover relative overflow-hidden rounded-2xl border p-5"
                    style={{
                      background: `linear-gradient(160deg, ${MASCOT_PALETTE[c.color].body}10, rgba(255,255,255,0.03))`,
                      borderColor: `${MASCOT_PALETTE[c.color].body}33`,
                    }}
                  >
                    <div className="pointer-events-none absolute -right-3 -top-2" style={{ opacity: 0.35 }}>
                      <Mascot size={60} color={c.color} mood="happy" delay={i * 0.15} />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{g.icon ?? c.icon}</span>
                      <div>
                        <div className="cb-display-sm">{g.name}</div>
                        <div className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                          👥 {g.minPlayers}-{g.maxPlayers}
                        </div>
                      </div>
                    </div>

                    {g.description && (
                      <p className="mt-3 text-[12px] leading-snug" style={{ color: "var(--text-dim)" }}>
                        {g.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="af-eyebrow" style={{ color: MASCOT_PALETTE[c.color].body, fontSize: 10 }}>
                        {c.label}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          background: `${MASCOT_PALETTE[c.color].body}33`,
                          border: `1px solid ${MASCOT_PALETTE[c.color].body}66`,
                          color: MASCOT_PALETTE[c.color].body,
                        }}
                      >
                        ▶ Jouer
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA */}
      <section className="relative z-10 overflow-hidden border-t" style={{ borderColor: "var(--line-soft)" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 100% at 50% 100%, rgba(255,62,165,0.25), transparent 60%)" }}
        />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-5 py-20 text-center sm:px-10 sm:py-24">
          <h2 className="cb-display-xl" style={{ letterSpacing: -2 }}>Trop d&apos;options ?</h2>
          <p className="max-w-sm text-sm" style={{ color: "var(--text-dim)" }}>
            On te jette dans une partie aléatoire. Pas le temps de tergiverser.
          </p>
          <Link href="/" className="af-btn af-btn-primary" style={{ padding: "18px 32px" }}>
            🎲 Surprise-moi
          </Link>
        </div>
      </section>
    </main>
  );
}

function FilterPill({
  active, color, onClick, children,
}: {
  active: boolean;
  color?: MascotColor;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const c = color ? MASCOT_PALETTE[color] : null;
  return (
    <button
      onClick={onClick}
      data-af-variant="pill"
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition"
      style={{
        background: active
          ? (c ? c.body : "var(--cb-brand)")
          : "rgba(255,255,255,0.04)",
        border: active
          ? `1px solid ${c ? c.body : "var(--cb-brand)"}`
          : "1px solid rgba(255,255,255,0.08)",
        color: active ? "#fff" : "var(--text-muted)",
        boxShadow: active && c ? `0 6px 14px ${c.glow}` : active ? "0 6px 14px rgba(91,54,214,0.45)" : "none",
      }}
    >
      {children}
    </button>
  );
}
