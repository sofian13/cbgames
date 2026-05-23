"use client";

/**
 * SiteNav — Top navigation reused on Home, Lobby, Leaderboard, Categories,
 * About, Profile, Signup, Login. Reads the user's customization from useMe
 * so the avatar reflects the current blob everywhere.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MascotAvatar } from "@/components/Mascot";
import { MuteToggle } from "@/components/MuteToggle";
import { useMe } from "@/lib/hooks/useMe";

interface SiteNavProps {
  /** Override displayed user info (defaults to useMe) */
  user?: string;
  level?: number;
  xp?: number;
  /** Optional pill on the right (e.g. current room code) */
  room?: string | null;
}

const LINKS: { label: string; href: string; matchPrefix?: string }[] = [
  { label: "Jeux", href: "/", matchPrefix: "/" },
  { label: "Catégories", href: "/categories" },
  { label: "Classement", href: "/leaderboard" },
  { label: "À propos", href: "/about" },
];

export function SiteNav({ user, level, xp, room = null }: SiteNavProps) {
  const [me] = useMe();
  const pathname = usePathname();
  const navUser = user ?? me.name;
  const navLevel = level ?? me.level;
  const navXp = xp ?? me.xp;

  const isActive = (link: { href: string; matchPrefix?: string }) => {
    if (link.matchPrefix === "/") return pathname === "/";
    return pathname === link.href || pathname?.startsWith(link.href + "/");
  };

  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-6 sm:px-10">
      <Link href="/" className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white"
          style={{
            background: "linear-gradient(135deg, var(--cb-brand), var(--af-pink))",
            fontFamily: "var(--font-display)",
          }}
        >
          af
        </div>
        <span
          className="text-2xl font-black tracking-tight"
          style={{ fontFamily: "var(--font-display)", letterSpacing: -0.5 }}
        >
          af<span style={{ color: "var(--af-pink)" }}>.</span>games
        </span>
      </Link>

      <nav className="hidden items-center gap-1 md:flex">
        {LINKS.map((link) => {
          const active = isActive(link);
          return (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold transition"
              style={{
                color: active ? "#fff" : "var(--text-muted)",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        {room && (
          <span className="af-chip" style={{ color: "var(--af-yellow)", letterSpacing: 2, fontWeight: 800 }}>
            {room}
          </span>
        )}
        <MuteToggle />
        <Link
          href="/login"
          className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/[0.1] sm:inline-block"
        >
          Connexion
        </Link>
        <div
          className="hidden items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-1.5 sm:flex"
        >
          <span className="cb-mono text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--af-yellow)" }}>★</span>{" "}
            {typeof navXp === "number" ? navXp.toLocaleString("fr-FR") : navXp}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--af-pink), var(--cb-brand))" }}
          >
            Niv. {navLevel}
          </span>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-2"
          aria-label="Voir mon profil"
        >
          <MascotAvatar color={me.color} size={36} mood={me.mood} />
          <span className="hidden text-sm font-semibold text-white sm:inline">{navUser}</span>
        </Link>
      </div>
    </header>
  );
}
