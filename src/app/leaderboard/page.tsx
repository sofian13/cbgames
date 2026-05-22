"use client";

/**
 * Leaderboard / Top Ten page
 *
 * TODO (intégration backend) :
 *   - Remplacer MOCK_PLAYERS par un fetch depuis ton PartyKit stats server
 *   - Le hook devrait probablement vivre dans @/lib/stores/global-points
 *     ou être servi par le party/stats.ts en mode "list top N"
 *
 * Pour l'instant, données mockées pour montrer le layout.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { Sparkles } from "@/components/ConfettiBurst";

type LeaderboardEntry = {
  name: string;
  color: MascotColor;
  xp: number;
  level: number;
  title: string;
  games: number;
  wins: number;
  streak: number;
  delta: string;
  isMe?: boolean;
};

const MOCK_PLAYERS: LeaderboardEntry[] = [
  { name: "Léa",     color: "purple",   xp: 12480, level: 9, title: "Mythique",     games: 156, wins: 84, streak: 7, delta: "+248", isMe: true },
  { name: "Sofian",  color: "coral",    xp: 11320, level: 8, title: "Légende",      games: 142, wins: 68, streak: 0, delta: "+140" },
  { name: "Marie",   color: "mint",     xp: 9870,  level: 8, title: "Légende",      games: 128, wins: 52, streak: 3, delta: "+96"  },
  { name: "Théo",    color: "yellow",   xp: 8240,  level: 7, title: "Grand Maître", games: 119, wins: 47, streak: 2, delta: "+62"  },
  { name: "Inès",    color: "pink",     xp: 7100,  level: 7, title: "Grand Maître", games: 108, wins: 38, streak: 5, delta: "+88"  },
  { name: "Hugo",    color: "sky",      xp: 5840,  level: 6, title: "Maître",       games: 89,  wins: 28, streak: 0, delta: "+24"  },
  { name: "Camille", color: "lavender", xp: 4720,  level: 6, title: "Maître",       games: 74,  wins: 23, streak: 1, delta: "+18"  },
  { name: "Rayane",  color: "purple",   xp: 3960,  level: 5, title: "Experte",      games: 62,  wins: 18, streak: 0, delta: "+12"  },
  { name: "Sarah",   color: "coral",    xp: 3210,  level: 5, title: "Expert",       games: 54,  wins: 14, streak: 4, delta: "+44"  },
  { name: "Mehdi",   color: "mint",     xp: 2840,  level: 4, title: "Confirmé",     games: 47,  wins: 11, streak: 0, delta: "+8"   },
];

const PODIUM_COLORS = {
  1: { bg: "linear-gradient(180deg, #FFD23F 0%, #B27800 100%)", text: "#3A2700" },
  2: { bg: "linear-gradient(180deg, #E8E8E8 0%, #888 100%)",     text: "rgba(0,0,0,0.6)" },
  3: { bg: "linear-gradient(180deg, #FF8B5C 0%, #A04020 100%)",  text: "rgba(0,0,0,0.6)" },
} as const;

export default function LeaderboardPage() {
  const top3 = [MOCK_PLAYERS[1], MOCK_PLAYERS[0], MOCK_PLAYERS[2]]; // 2, 1, 3 order
  const me = MOCK_PLAYERS.find(p => p.isMe);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Sparkles count={14} />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <span className="text-xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          af<span style={{ color: "var(--af-pink)" }}>.</span>games
        </span>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-10 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>✦ Classement global · semaine du 18 mai</p>
            <h1 className="mt-3 cb-display-xl" style={{ letterSpacing: -2.2, lineHeight: 0.95, fontSize: "clamp(3rem, 8vw, 5rem)" }}>
              Top <span style={{
                background: "linear-gradient(120deg, var(--af-yellow), var(--af-pink))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Ten.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm" style={{ color: "var(--text-dim)" }}>
              Les pros du canapé. Reset tous les dimanches à minuit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="af-eyebrow mr-1">Période</span>
            {["Semaine", "Mois", "All-time"].map((f, i) => (
              <span
                key={f}
                className="cursor-pointer rounded-full px-3 py-2 text-xs font-bold text-white"
                style={{
                  background: i === 0 ? "var(--cb-brand)" : "rgba(255,255,255,0.06)",
                  boxShadow: i === 0 ? "0 6px 14px rgba(91,54,214,0.4)" : "none",
                }}
              >{f}</span>
            ))}
          </div>
        </div>

        {/* PODIUM */}
        <div className="mt-10 grid grid-cols-3 items-end gap-4 sm:gap-6">
          {top3.map((p, i) => {
            const place = (i === 1 ? 1 : i === 0 ? 2 : 3) as 1 | 2 | 3;
            const heights = { 1: 230, 2: 170, 3: 130 };
            return (
              <div key={p.name} className="relative flex flex-col items-center">
                {place === 1 && (
                  <div className="absolute -top-5 h-[260px] w-[260px]" style={{
                    background: "radial-gradient(circle, rgba(255,210,63,0.3), transparent 70%)",
                    filter: "blur(20px)",
                  }} />
                )}
                <div className="relative mb-4 text-center">
                  <div className="cb-display-md" style={{ fontSize: place === 1 ? 22 : 16, color: "#fff" }}>{p.name}</div>
                  <div className="cb-mono mt-1 text-xs" style={{ color: "var(--text-dim)" }}>{p.xp.toLocaleString("fr-FR")} XP</div>
                  {p.streak > 0 && (
                    <div className="mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold"
                         style={{ background: "rgba(255,107,91,0.18)", border: "1px solid rgba(255,107,91,0.3)", color: "var(--af-coral)" }}>
                      🔥 {p.streak} d&apos;affilée
                    </div>
                  )}
                </div>
                <Mascot
                  size={place === 1 ? 130 : 90}
                  color={p.color}
                  mood="happy"
                  arms
                  cheering={place === 1}
                  crown={place === 1}
                  delay={place * 0.15}
                />
                <div className="mt-3 flex w-full flex-col items-center justify-start rounded-t-2xl border border-b-0 pt-4"
                     style={{
                       height: heights[place],
                       background: PODIUM_COLORS[place].bg,
                       borderColor: "rgba(255,255,255,0.18)",
                       boxShadow: place === 1
                         ? "0 0 50px rgba(255,210,63,0.35), inset 0 -10px 30px rgba(0,0,0,0.2)"
                         : "0 10px 30px rgba(0,0,0,0.3)",
                     }}>
                  <div className="cb-display-lg" style={{ fontSize: place === 1 ? 64 : 48, color: PODIUM_COLORS[place].text, lineHeight: 1 }}>
                    {place}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: PODIUM_COLORS[place].text, opacity: 0.7 }}>
                    {p.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 sm:px-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Parties cette semaine", value: "1 248",      delta: "+18%", color: "mint" as MascotColor,   emoji: "🎮" },
            { label: "Joueurs actifs",        value: "248",        delta: "live", color: "yellow" as MascotColor, emoji: "👥" },
            { label: "Plus joué",             value: "Bomb Party", delta: "342×", color: "sky" as MascotColor,    emoji: "💣" },
            { label: "Ton rang",              value: "#1",         delta: "↑ 2",  color: "pink" as MascotColor,   emoji: "✦" },
          ].map((s) => (
            <div key={s.label} className="af-card-glass p-5">
              <div className="flex items-start justify-between">
                <span className="af-eyebrow">{s.label}</span>
                <span className="text-xl">{s.emoji}</span>
              </div>
              <div className="cb-display-md mt-2" style={{ letterSpacing: -0.5, fontSize: 26, lineHeight: 1 }}>{s.value}</div>
              <div className="mt-1 text-xs font-bold" style={{ color: MASCOT_PALETTE[s.color].body }}>{s.delta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TABLE */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 sm:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="cb-display-md">Classement complet</h3>
          <div className="flex gap-2">
            {["Toutes catégories", "Bluff", "Mots", "Quiz"].map((f, i) => (
              <span key={f} className="af-chip cursor-pointer"
                    style={{
                      background: i === 0 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                      color: i === 0 ? "#fff" : "var(--text-dim)",
                      letterSpacing: 0, fontSize: 11, textTransform: "none",
                    }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Headers — desktop only */}
        <div className="hidden grid-cols-[50px_1fr_80px_120px_80px_90px_70px] gap-4 px-5 pb-2 sm:grid"
             style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
          <div>#</div><div>Joueur</div>
          <div className="text-right">Niveau</div><div className="text-right">XP</div>
          <div className="text-right">Parties</div><div className="text-right">Victoires</div>
          <div className="text-right">7 jours</div>
        </div>

        <div className="af-card-glass p-2">
          {MOCK_PLAYERS.map((p, i) => {
            const place = i + 1;
            return (
              <div
                key={p.name}
                className="grid items-center gap-4 rounded-xl p-3 sm:grid-cols-[50px_1fr_80px_120px_80px_90px_70px]"
                style={{
                  background: p.isMe ? `linear-gradient(120deg, ${MASCOT_PALETTE.purple.body}1F, rgba(255,255,255,0.02))` : "transparent",
                  border: p.isMe ? `1px solid ${MASCOT_PALETTE.purple.body}55` : "1px solid transparent",
                }}
              >
                <div className="flex items-center">
                  {place <= 3 ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full"
                         style={{
                           background: PODIUM_COLORS[place as 1 | 2 | 3].bg,
                           color: PODIUM_COLORS[place as 1 | 2 | 3].text,
                           fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14,
                           boxShadow: place === 1 ? "0 4px 12px rgba(255,210,63,0.4)" : "0 2px 6px rgba(0,0,0,0.3)",
                         }}>{place}</div>
                  ) : (
                    <span className="cb-mono pl-2 text-base font-bold" style={{ color: "var(--text-muted)" }}>{place}</span>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <MascotAvatar color={p.color} size={36} mood={place === 1 ? "wink" : place <= 3 ? "happy" : "neutral"} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{p.name}</span>
                      {p.isMe && (
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-black text-white" style={{ background: MASCOT_PALETTE.purple.body, letterSpacing: 0.5 }}>
                          TOI
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {p.title}
                      {p.streak >= 3 && <span className="ml-2" style={{ color: "var(--af-coral)" }}>· 🔥 {p.streak}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right text-lg font-bold" style={{
                  fontFamily: "var(--font-display)",
                  color: place === 1 ? "transparent" : "#fff",
                  background: place === 1 ? "linear-gradient(135deg, var(--af-yellow), var(--af-pink))" : undefined,
                  WebkitBackgroundClip: place === 1 ? "text" : undefined,
                }}>
                  {p.level}
                </div>
                <div className="text-right">
                  <div className="cb-mono text-sm font-bold">{p.xp.toLocaleString("fr-FR")}</div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(p.xp / MOCK_PLAYERS[0].xp) * 100}%`,
                      background: `linear-gradient(90deg, ${MASCOT_PALETTE[p.color].body}, ${MASCOT_PALETTE[p.color].deep})`,
                    }} />
                  </div>
                </div>
                <div className="cb-mono text-right text-sm" style={{ color: "var(--text-dim)" }}>{p.games}</div>
                <div className="cb-mono text-right text-sm" style={{ color: "var(--text-dim)" }}>
                  {p.wins} <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>({Math.round(p.wins / p.games * 100)}%)</span>
                </div>
                <div className="cb-mono text-right text-sm font-bold" style={{ color: p.delta.startsWith("+") ? "var(--af-mint)" : "var(--text-muted)" }}>
                  {p.delta}
                </div>
              </div>
            );
          })}
        </div>

        {/* YOU bar */}
        {me && (
          <div className="mt-6 flex items-center gap-5 rounded-3xl p-5"
               style={{
                 background: `linear-gradient(120deg, ${MASCOT_PALETTE.purple.body}25, ${MASCOT_PALETTE.pink.body}1A)`,
                 border: `1.5px solid ${MASCOT_PALETTE.purple.body}55`,
               }}>
            <Mascot size={64} color="purple" mood="wink" crown shadow={false} />
            <div className="flex-1">
              <p className="af-eyebrow">Ta position cette semaine</p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="cb-display-md" style={{ fontSize: 32, letterSpacing: -1 }}>#1</span>
                <span className="text-xs font-bold" style={{ color: "var(--af-mint)" }}>↑ 2 places vs semaine dernière</span>
              </div>
            </div>
            <div className="hidden gap-6 sm:flex">
              <div>
                <p className="af-eyebrow mb-1">Avance</p>
                <p className="cb-mono text-lg font-bold" style={{ color: "var(--af-yellow)" }}>+1160 XP</p>
              </div>
              <div>
                <p className="af-eyebrow mb-1">Win rate</p>
                <p className="cb-mono text-lg font-bold">54%</p>
              </div>
            </div>
            <Link href="/" className="af-btn af-btn-primary" style={{ fontSize: 14, padding: "14px 22px" }}>
              Continue de jouer →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
