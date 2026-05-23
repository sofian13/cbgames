"use client";

/**
 * /about — Page À propos / histoire de la marque.
 * Stats clés, valeurs, timeline, équipe, CTA final.
 */

import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Sparkles } from "@/components/ConfettiBurst";
import { Mascot, MASCOT_PALETTE, type MascotColor, type MascotMood } from "@/components/Mascot";

const TEAM: { name: string; color: MascotColor; mood: MascotMood; role: string }[] = [
  { name: "Sofian", color: "coral",  mood: "wink",  role: "Cofondateur · code & jeux" },
  { name: "Rayane", color: "purple", mood: "happy", role: "Cofondateur · serveur temps réel" },
  { name: "Léa",    color: "pink",   mood: "love",  role: "Direction artistique" },
  { name: "Marie",  color: "mint",   mood: "happy", role: "Game design" },
];

const STATS = [
  { value: "28", label: "Jeux disponibles",     color: "yellow"  as MascotColor },
  { value: "8",  label: "Univers",              color: "pink"    as MascotColor },
  { value: "0",  label: "Comptes obligatoires", color: "mint"    as MascotColor },
  { value: "∞",  label: "Soirées sauvées",      color: "purple"  as MascotColor },
];

const VALUES = [
  {
    emoji: "⚡", color: "yellow" as MascotColor,
    title: "Zéro friction",
    desc: "Pas de compte requis, pas d'install. Un code de salle, un lien, c'est parti.",
  },
  {
    emoji: "🎨", color: "pink" as MascotColor,
    title: "Tout est custom",
    desc: "Ton blob, ton style. Les jeux s'adaptent au nombre de joueurs et à la table.",
  },
  {
    emoji: "🌍", color: "mint" as MascotColor,
    title: "Tout en local",
    desc: "Les jeux tournent en peer-to-peer. Pas de tracking, pas de pub. Just for fun.",
  },
  {
    emoji: "🚀", color: "purple" as MascotColor,
    title: "Open & vivant",
    desc: "Nouveau jeu ajouté toutes les 2 semaines. Suggère le tien sur Discord.",
  },
];

const TIMELINE = [
  {
    date: "Sept. 2025", color: "yellow" as MascotColor, title: "Un soir trop tard",
    text: "On galère à trouver un jeu en ligne qui marche sur tous les phones. On code un Bomb Party à 4h du mat'. C'était nul, mais on a ri.",
  },
  {
    date: "Nov. 2025", color: "coral" as MascotColor, title: "1ère version publique",
    text: "5 jeux, code de salle à 4 lettres, mascotte. Le mot « blob » a remplacé « avatar » dans nos slides.",
  },
  {
    date: "Fév. 2026", color: "mint" as MascotColor, title: "Tout en peer-to-peer",
    text: "On passe sur PartyKit. Pas de serveur central, pas de coût par joueur. Les jeux se lancent en moins d'une seconde.",
  },
  {
    date: "Aujourd'hui", color: "pink" as MascotColor, title: "28 jeux, refonte DA",
    text: "Cette page que tu lis fait partie de la refonte. Nouveau langage visuel, mêmes vibes. Plus que jamais : zéro friction.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Sparkles count={14} />
      <SiteNav />

      {/* HERO */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-12 sm:px-10">
        <p className="af-eyebrow mb-4" style={{ color: "var(--af-pink)" }}>✦ Notre histoire</p>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16">
          <div>
            <h1 className="cb-display-xl" style={{ letterSpacing: -3, lineHeight: 0.9, fontSize: "clamp(2.5rem, 9vw, 5.5rem)" }}>
              On fait des jeux pour{" "}
              <span style={{
                background: "linear-gradient(120deg, var(--af-pink), var(--af-yellow))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                les vraies soirées.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-dim)" }}>
              Au lieu de scroller chacun de son côté, on a voulu un truc qu&apos;on lance
              quand un pote ramène une bouteille. Un code, un lien, une partie. Pas de
              coupure, pas de « qui range les cartes ».
            </p>
          </div>

          <div className="relative h-[320px]">
            <div
              className="absolute inset-8"
              style={{
                background: "radial-gradient(circle, rgba(255,62,165,0.3), transparent 70%)",
                filter: "blur(30px)",
              }}
            />
            <div className="absolute left-[30%] top-0"><Mascot size={90} color="pink" mood="happy" arms cheering delay={0.0} /></div>
            <div className="absolute left-0 top-[80px]"><Mascot size={72} color="yellow" mood="wink" delay={0.4} /></div>
            <div className="absolute right-0 top-[110px]"><Mascot size={80} color="mint" mood="love" delay={0.7} /></div>
            <div className="absolute bottom-[30px] left-[40%]"><Mascot size={120} color="purple" mood="happy" arms crown delay={0.2} /></div>
            <div className="absolute bottom-[80px] right-[60px]"><Mascot size={64} color="coral" mood="shocked" delay={1.0} /></div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 mx-auto mt-12 w-full max-w-6xl px-5 sm:px-10">
        <div className="af-card-glass p-7">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="text-center"
                style={{ borderLeft: i > 0 ? "1px dashed rgba(255,255,255,0.10)" : undefined }}
              >
                <div
                  className="cb-display-xl"
                  style={{
                    fontSize: "clamp(2.5rem, 7vw, 4rem)", lineHeight: 1, letterSpacing: -2,
                    color: MASCOT_PALETTE[s.color].body,
                    textShadow: `0 0 40px ${MASCOT_PALETTE[s.color].glow}`,
                  }}
                >
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-dim)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="relative z-10 mx-auto mt-14 w-full max-w-6xl px-5 sm:px-10">
        <p className="af-eyebrow mb-2">02 — pourquoi</p>
        <h2 className="cb-display-lg" style={{ letterSpacing: -1.2 }}>
          Ce qui nous fait <span style={{ color: "var(--af-yellow)" }}>vibrer.</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="af-card-glass flex gap-4 p-6">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ background: `linear-gradient(160deg, ${MASCOT_PALETTE[v.color].body}, ${MASCOT_PALETTE[v.color].deep})` }}
              >
                {v.emoji}
              </div>
              <div>
                <h3 className="cb-display-sm">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="relative z-10 mx-auto mt-14 w-full max-w-6xl px-5 sm:px-10">
        <p className="af-eyebrow mb-2">03 — timeline</p>
        <h2 className="cb-display-lg" style={{ letterSpacing: -1.2 }}>
          La <span style={{ color: "var(--af-pink)" }}>petite histoire</span>.
        </h2>

        <div className="mt-8 grid gap-x-6 gap-y-6 sm:grid-cols-[120px_1fr]">
          {TIMELINE.map((e) => (
            <div key={e.title} className="contents">
              <div className="cb-mono pt-1 text-xs font-black uppercase tracking-wide" style={{ color: MASCOT_PALETTE[e.color].body }}>
                {e.date}
              </div>
              <div className="border-l-[3px] pl-5" style={{ borderColor: MASCOT_PALETTE[e.color].body }}>
                <h3 className="cb-display-sm">{e.title}</h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>{e.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="relative z-10 mx-auto mt-14 w-full max-w-6xl px-5 sm:px-10">
        <p className="af-eyebrow mb-2">04 — équipe</p>
        <h2 className="cb-display-lg" style={{ letterSpacing: -1.2 }}>
          La <span style={{ color: "var(--af-mint)" }}>petite team</span>.
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {TEAM.map((p) => (
            <div
              key={p.name}
              className="af-card-glass flex flex-col items-center gap-2 p-5 text-center"
              style={{
                background: `linear-gradient(180deg, ${MASCOT_PALETTE[p.color].body}25, rgba(255,255,255,0.03))`,
              }}
            >
              <Mascot size={92} color={p.color} mood={p.mood} delay={0.3} />
              <div className="cb-display-sm mt-2">{p.name}</div>
              <div className="text-[11px] font-semibold leading-snug" style={{ color: "var(--text-muted)" }}>
                {p.role}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mt-14 overflow-hidden border-t" style={{ borderColor: "var(--line-soft)" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 100% at 50% 100%, rgba(91,54,214,0.35), transparent 60%)" }}
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7 px-5 py-24 text-center sm:px-10">
          <h2 className="cb-display-xl" style={{ letterSpacing: -2.5, fontSize: "clamp(3rem, 10vw, 5rem)" }}>
            Allez,<br />
            <span style={{
              background: "linear-gradient(120deg, var(--af-pink), var(--af-yellow))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              on joue ?
            </span>
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link href="/" className="af-btn af-btn-primary" style={{ padding: "18px 28px" }}>+ Créer une salle</Link>
            <Link href="/categories" className="af-btn af-btn-ghost" style={{ padding: "18px 26px" }}>Voir les jeux →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
