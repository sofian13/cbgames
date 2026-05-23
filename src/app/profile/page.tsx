"use client";

/**
 * /profile — Profil utilisateur.
 * Dashboard avec hero (blob + XP), stats, parties récentes, badges, customizer inline.
 *
 * TODO (intégration backend) :
 *   - `recent` doit venir d'une route /api/me/recent (PartyKit stats)
 *   - `badges` à brancher sur ta logique d'unlock (achievements.ts)
 *   - L'XP / niveau / titre vivent dans `global-points.ts` (zustand store)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Sparkles } from "@/components/ConfettiBurst";
import { Mascot, MASCOT_PALETTE, type MascotColor, type MascotMood } from "@/components/Mascot";
import { Customizer } from "@/components/Customizer";
import { useMe } from "@/lib/hooks/useMe";
import { getGlobalStats, getPlayerRecent, getLevel, type GlobalStats } from "@/lib/stores/global-points";
import { getGameById } from "@/lib/games/registry";

const CAT_COLOR: Record<string, MascotColor> = {
  words: "sky", trivia: "yellow", speed: "coral", strategy: "mint",
  social: "pink", cards: "purple", party: "lavender", sport: "sky",
};

function relTime(ts: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hier" : `il y a ${d} j`;
}

const BADGE_DEFS: { id: string; emoji: string; label: string; color: MascotColor; test: (s: GlobalStats | null) => boolean }[] = [
  { id: "newbie", emoji: "🌱", label: "Première partie", color: "mint", test: (s) => !!s && s.gamesPlayed >= 1 },
  { id: "win1", emoji: "🏅", label: "Première victoire", color: "yellow", test: (s) => !!s && s.wins >= 1 },
  { id: "ten", emoji: "🔟", label: "10 parties", color: "sky", test: (s) => !!s && s.gamesPlayed >= 10 },
  { id: "win10", emoji: "👑", label: "10 victoires", color: "pink", test: (s) => !!s && s.wins >= 10 },
  { id: "fifty", emoji: "5️⃣0️⃣", label: "50 parties", color: "coral", test: (s) => !!s && s.gamesPlayed >= 50 },
  { id: "expert", emoji: "⚡", label: "Niveau Expert", color: "purple", test: (s) => !!s && s.totalPoints >= 1000 },
  { id: "legend", emoji: "✨", label: "Niveau Légende", color: "lavender", test: (s) => !!s && s.totalPoints >= 4000 },
  { id: "century", emoji: "💯", label: "100 parties", color: "purple", test: (s) => !!s && s.gamesPlayed >= 100 },
];

interface RecentGame {
  game: string;
  emoji: string;
  color: MascotColor;
  when: string;
  rank: number;
  score: string;
  win: boolean;
}

export default function ProfilePage() {
  const [me, update] = useMe();
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [recent, setRecent] = useState<RecentGame[]>([]);

  useEffect(() => {
    if (!me.id) return;
    getGlobalStats(me.id).then(setStats).catch(() => {});
    getPlayerRecent(me.id, 6).then((list) =>
      setRecent(list.map((r) => {
        const meta = getGameById(r.gameId);
        return {
          game: meta?.name ?? r.gameId,
          emoji: meta?.icon ?? "🎮",
          color: CAT_COLOR[r.category] ?? "purple",
          when: relTime(r.playedAt),
          rank: r.rank,
          score: `+${r.points} XP`,
          win: r.rank === 1,
        };
      }))
    ).catch(() => {});
  }, [me.id]);

  const games = stats?.gamesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const STATS = [
    { label: "Parties jouées",   value: games,   color: "purple" as MascotColor, emoji: "🎮" },
    { label: "Victoires",        value: wins,    color: "yellow" as MascotColor, emoji: "👑" },
    { label: "Taux de victoire", value: games ? `${Math.round((wins / games) * 100)}%` : "—", color: "mint" as MascotColor, emoji: "📈" },
    { label: "Meilleur rang",    value: stats && stats.topRank < 999 ? `#${stats.topRank}` : "—", color: "coral" as MascotColor, emoji: "🏆" },
  ];
  const BADGES = BADGE_DEFS.map((b) => ({ ...b, unlocked: b.test(stats) }));
  const unlocked = BADGES.filter((b) => b.unlocked).length;

  const nextThreshold = getLevel(me.xp).nextLevelPoints;
  const xpPct = Math.min(100, nextThreshold ? (me.xp / nextThreshold) * 100 : 100);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Sparkles count={12} />
      <SiteNav />

      {/* HERO */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-10 sm:px-10">
        <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-center">
          {/* Blob */}
          <div className="relative flex h-[220px] w-[220px] shrink-0 items-center justify-center self-center">
            <div
              className="absolute inset-3"
              style={{
                background: `radial-gradient(circle at 50% 55%, ${MASCOT_PALETTE[me.color].glow}, transparent 65%)`,
                filter: "blur(8px)", opacity: 0.7, zIndex: 0,
              }}
            />
            <div className="relative z-10">
              <Mascot
                size={170}
                color={me.color}
                mood={me.mood}
                arms={me.accessory === "arms"}
                crown={me.accessory === "crown"}
              />
            </div>
            <button
              onClick={() => setEditing((v) => !v)}
              aria-label={editing ? "Fermer le customizer" : "Personnaliser le blob"}
              className="absolute bottom-2 right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full text-white"
              style={{
                background: "var(--cb-brand)",
                border: "3px solid var(--bg-deep)",
                boxShadow: "0 6px 20px rgba(91,54,214,0.5)",
              }}
            >
              {editing ? "✓" : "✎"}
            </button>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>
              ✦ Niveau {me.level} · {me.title}
            </p>
            <h1 className="cb-display-xl mt-2" style={{ letterSpacing: -2.2, lineHeight: 0.95 }}>
              {me.name}
            </h1>
            <p className="mt-3 max-w-lg text-sm" style={{ color: "var(--text-dim)" }}>
              {games > 0
                ? `${me.title} · ${games} partie${games > 1 ? "s" : ""} jouée${games > 1 ? "s" : ""}${wins > 0 ? ` · ${wins} victoire${wins > 1 ? "s" : ""}` : ""}.`
                : "Nouveau joueur af.games. Lance une partie en ligne pour grimper au classement !"}
            </p>

            {/* XP bar */}
            <div className="mt-5 max-w-md">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Vers niveau {me.level + 1}</span>
                <span className="cb-mono" style={{ color: "var(--text-muted)" }}>
                  {me.xp.toLocaleString("fr-FR")} / {nextThreshold.toLocaleString("fr-FR")} XP
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xpPct}%`,
                    background: "linear-gradient(90deg, var(--cb-brand), var(--af-pink), var(--af-yellow))",
                    boxShadow: "0 0 12px rgba(255,210,63,0.5)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col gap-2 self-center">
            <Link href="/" className="af-btn af-btn-primary text-center" style={{ padding: "14px 22px", fontSize: 14 }}>
              ▶ Jouer maintenant
            </Link>
            <Link href="/leaderboard" className="af-btn af-btn-ghost text-center" style={{ padding: "14px 22px", fontSize: 13 }}>
              Voir classement
            </Link>
          </div>
        </div>
      </section>

      {/* Customizer inline */}
      {editing && (
        <section className="relative z-10 mx-auto mt-6 w-full max-w-6xl px-5 sm:px-10">
          <div className="af-card-glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="cb-display-md" style={{ fontSize: 22 }}>Customise ton blob</h3>
              <button
                onClick={() => setEditing(false)}
                className="af-btn af-btn-ghost"
                style={{ padding: "8px 16px", fontSize: 12 }}
              >
                Fermer ✕
              </button>
            </div>
            <Customizer me={me} update={update} layout="row" blobSize={70} />
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl px-5 sm:px-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="af-card-glass p-5">
              <div className="flex items-start justify-between">
                <span className="af-eyebrow">{s.label}</span>
                <span className="text-2xl">{s.emoji}</span>
              </div>
              <div
                className="cb-display-md mt-3"
                style={{
                  fontSize: 38, lineHeight: 1, letterSpacing: -1.2,
                  background: `linear-gradient(120deg, ${MASCOT_PALETTE[s.color].body}, #fff)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT + BADGES */}
      <section className="relative z-10 mx-auto mt-6 w-full max-w-6xl gap-5 px-5 pb-16 sm:px-10 lg:grid lg:grid-cols-[1.3fr_1fr]">
        {/* Recent */}
        <div className="af-card-glass p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="cb-display-md" style={{ fontSize: 20 }}>Dernières parties</h3>
            <Link href="/leaderboard" className="text-xs font-bold" style={{ color: "var(--cb-brand)" }}>
              Tout voir →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.length === 0 && (
              <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Aucune partie en ligne pour l&apos;instant.
              </p>
            )}
            {recent.map((r, i) => (
              <RecentRow key={i} row={r} />
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="af-card-glass mt-5 p-6 lg:mt-0">
          <h3 className="cb-display-md mb-4" style={{ fontSize: 20 }}>
            Badges <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>· {unlocked}/{BADGES.length}</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2.5 rounded-xl p-3"
                style={{
                  background: b.unlocked
                    ? `linear-gradient(160deg, ${MASCOT_PALETTE[b.color].body}28, rgba(255,255,255,0.03))`
                    : "rgba(255,255,255,0.02)",
                  border: b.unlocked
                    ? `1px solid ${MASCOT_PALETTE[b.color].body}55`
                    : "1px dashed rgba(255,255,255,0.10)",
                  opacity: b.unlocked ? 1 : 0.5,
                }}
              >
                <span className="text-xl" style={{ filter: b.unlocked ? "none" : "grayscale(1)" }}>
                  {b.emoji}
                </span>
                <span className="text-[11px] font-semibold leading-tight">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function RecentRow({ row }: { row: RecentGame }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3"
      style={{
        background: row.win
          ? `linear-gradient(120deg, ${MASCOT_PALETTE[row.color].body}1F, rgba(255,255,255,0.02))`
          : "rgba(255,255,255,0.03)",
        border: row.win
          ? `1px solid ${MASCOT_PALETTE[row.color].body}44`
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: `linear-gradient(160deg, ${MASCOT_PALETTE[row.color].body}, ${MASCOT_PALETTE[row.color].deep})` }}
      >
        {row.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{row.game}</div>
        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{row.when}</div>
      </div>
      <div
        className="rounded-full px-2.5 py-1 text-[11px] font-black"
        style={{
          background: row.win ? "rgba(255,210,63,0.2)" : "rgba(255,255,255,0.06)",
          color: row.win ? "var(--af-yellow)" : "var(--text-muted)",
        }}
      >
        {row.win ? "👑 1er" : `#${row.rank}`}
      </div>
      <span className="cb-mono w-16 text-right text-xs font-bold" style={{ color: "var(--af-mint)" }}>
        {row.score}
      </span>
    </div>
  );
}
