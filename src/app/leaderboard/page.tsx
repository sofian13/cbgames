"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Mascot, MascotAvatar, MASCOT_PALETTE, MASCOT_COLORS, type MascotColor } from "@/components/Mascot";
import { Sparkles } from "@/components/ConfettiBurst";
import { getLeaderboard, getLevel, type GlobalStats } from "@/lib/stores/global-points";
import { getOrCreateGuest } from "@/lib/guest";

function colorFor(id: string): MascotColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return MASCOT_COLORS[h % MASCOT_COLORS.length];
}

const PODIUM = {
  1: { bg: "linear-gradient(180deg, #FFD23F 0%, #B27800 100%)", text: "#3A2700" },
  2: { bg: "linear-gradient(180deg, #E8E8E8 0%, #888 100%)", text: "rgba(0,0,0,0.6)" },
  3: { bg: "linear-gradient(180deg, #FF8B5C 0%, #A04020 100%)", text: "rgba(0,0,0,0.6)" },
} as const;

export default function LeaderboardPage() {
  const [rows, setRows] = useState<GlobalStats[] | null>(null);
  const [meId, setMeId] = useState("");

  useEffect(() => {
    setMeId(getOrCreateGuest().id);
    getLeaderboard(50).then(setRows).catch(() => setRows([]));
  }, []);

  const loading = rows === null;
  const players = rows ?? [];
  const top3 = [players[1], players[0], players[2]].filter(Boolean) as GlobalStats[];
  const myIndex = players.findIndex((p) => p.playerId === meId);
  const totalGames = players.reduce((s, p) => s + p.gamesPlayed, 0);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Sparkles count={12} />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2 text-sm transition hover:text-white" style={{ color: "var(--text-dim)" }}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <span className="text-xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          af<span style={{ color: "var(--af-pink)" }}>.</span>games
        </span>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-10 sm:px-10">
        <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>✦ Classement global</p>
        <h1 className="mt-3 cb-display-xl" style={{ letterSpacing: -2.2, lineHeight: 0.95, fontSize: "clamp(3rem, 8vw, 5rem)" }}>
          Top <span style={{ background: "linear-gradient(120deg, var(--af-yellow), var(--af-pink))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ten.</span>
        </h1>
        <p className="mt-3 max-w-md text-sm" style={{ color: "var(--text-dim)" }}>
          Les pros du canapé. Les points montent à chaque partie jouée.
        </p>

        {loading && <p className="mt-10 animate-pulse" style={{ color: "var(--text-dim)" }}>Chargement du classement…</p>}

        {!loading && players.length === 0 && (
          <div className="mt-10 rounded-3xl border p-8 text-center" style={{ borderColor: "var(--line-soft)", background: "rgba(255,255,255,0.04)" }}>
            <div className="mb-3 text-4xl">🏆</div>
            <p className="cb-display-sm">Personne au classement… encore.</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>Lance une partie en ligne pour marquer tes premiers points !</p>
            <Link href="/" className="af-btn af-btn-primary mt-5 inline-block">Jouer</Link>
          </div>
        )}

        {/* PODIUM */}
        {!loading && top3.length >= 3 && (
          <div className="mt-10 grid grid-cols-3 items-end gap-4 sm:gap-6">
            {top3.map((p) => {
              const place = (players.indexOf(p) + 1) as 1 | 2 | 3;
              const heights = { 1: 220, 2: 165, 3: 125 };
              const lvl = getLevel(p.totalPoints);
              return (
                <div key={p.playerId} className="relative flex flex-col items-center">
                  <div className="relative mb-3 text-center">
                    <div className="cb-display-md" style={{ fontSize: place === 1 ? 22 : 16 }}>{p.playerName}</div>
                    <div className="cb-mono mt-1 text-xs" style={{ color: "var(--text-dim)" }}>{p.totalPoints.toLocaleString("fr-FR")} XP</div>
                  </div>
                  <Mascot size={place === 1 ? 120 : 84} color={colorFor(p.playerId)} mood="happy" arms cheering={place === 1} crown={place === 1} delay={place * 0.15} />
                  <div className="mt-3 flex w-full flex-col items-center rounded-t-2xl border border-b-0 pt-4"
                    style={{ height: heights[place], background: PODIUM[place].bg, borderColor: "rgba(255,255,255,0.18)" }}>
                    <div className="cb-display-lg" style={{ fontSize: place === 1 ? 60 : 44, color: PODIUM[place].text, lineHeight: 1 }}>{place}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: PODIUM[place].text, opacity: 0.7 }}>{lvl.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* STATS STRIP */}
      {!loading && players.length > 0 && (
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 sm:px-10">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Joueurs classés", value: String(players.length), color: "mint" as MascotColor, emoji: "👥" },
              { label: "Parties jouées", value: totalGames.toLocaleString("fr-FR"), color: "yellow" as MascotColor, emoji: "🎮" },
              { label: "Ton rang", value: myIndex >= 0 ? `#${myIndex + 1}` : "—", color: "pink" as MascotColor, emoji: "✦" },
            ].map((s) => (
              <div key={s.label} className="af-card-glass p-5">
                <div className="flex items-start justify-between">
                  <span className="af-eyebrow">{s.label}</span>
                  <span className="text-xl">{s.emoji}</span>
                </div>
                <div className="cb-display-md mt-2" style={{ fontSize: 26, lineHeight: 1, color: MASCOT_PALETTE[s.color].body }}>{s.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TABLE */}
      {!loading && players.length > 0 && (
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 sm:px-10">
          <h3 className="cb-display-md mb-4">Classement complet</h3>
          <div className="af-card-glass p-2">
            {players.map((p, i) => {
              const place = i + 1;
              const lvl = getLevel(p.totalPoints);
              const isMe = p.playerId === meId;
              const c = colorFor(p.playerId);
              return (
                <div key={p.playerId}
                  className="grid items-center gap-3 rounded-xl p-3 sm:grid-cols-[44px_1fr_90px_110px_70px_80px]"
                  style={{ background: isMe ? `${MASCOT_PALETTE[c].body}1F` : "transparent", border: isMe ? `1px solid ${MASCOT_PALETTE[c].body}55` : "1px solid transparent" }}>
                  <div className="flex items-center">
                    {place <= 3 ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: PODIUM[place as 1 | 2 | 3].bg, color: PODIUM[place as 1 | 2 | 3].text, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14 }}>{place}</div>
                    ) : (
                      <span className="cb-mono pl-2 text-base font-bold" style={{ color: "var(--text-muted)" }}>{place}</span>
                    )}
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <MascotAvatar color={c} size={34} mood={place === 1 ? "wink" : "happy"} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">{p.playerName}</span>
                        {isMe && <span className="rounded-full px-2 py-0.5 text-[9px] font-black text-white" style={{ background: MASCOT_PALETTE[c].body }}>TOI</span>}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{lvl.title}</div>
                    </div>
                  </div>
                  <div className="hidden text-right text-sm font-bold sm:block" style={{ fontFamily: "var(--font-display)" }}>Niv.{lvl.level}</div>
                  <div className="cb-mono text-right text-sm font-bold">{p.totalPoints.toLocaleString("fr-FR")} <span className="text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>XP</span></div>
                  <div className="hidden text-right text-sm sm:block" style={{ color: "var(--text-dim)" }}>{p.gamesPlayed}<span className="text-[10px]" style={{ color: "var(--text-muted)" }}> parties</span></div>
                  <div className="hidden text-right text-sm sm:block" style={{ color: "var(--text-dim)" }}>{p.wins}<span className="text-[10px]" style={{ color: "var(--text-muted)" }}> 🏆</span></div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
