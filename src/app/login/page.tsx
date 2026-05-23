"use client";

/**
 * /login — Connexion.
 * Brand pitch à gauche, formulaire à droite avec OAuth Discord/Google.
 *
 * TODO :
 *   - Wire the OAuth buttons to `signIn("discord")` / `signIn("google")`
 *     once NextAuth is configured.
 *   - The credentials provider should hit POST /api/auth/login.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Sparkles } from "@/components/ConfettiBurst";
import { Mascot, MASCOT_PALETTE } from "@/components/Mascot";
import { AuthInput } from "@/components/AuthInput";
import { useMe } from "@/lib/hooks/useMe";

export default function LoginPage() {
  const router = useRouter();
  const [me, update] = useMe();
  const [password, setPassword] = useState("");

  const submit = () => {
    // TODO : signIn("credentials", { email: me.email, password })
    router.push("/");
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Sparkles count={10} />
      <SiteNav />

      <section className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 sm:px-10 lg:grid-cols-2 lg:gap-20">
        {/* LEFT */}
        <div className="relative text-center">
          <div
            className="absolute inset-10"
            style={{
              background: `radial-gradient(circle, ${MASCOT_PALETTE[me.color].glow}, transparent 70%)`,
              filter: "blur(40px)",
            }}
          />
          <p className="relative af-eyebrow">Welcome back</p>
          <h1 className="relative cb-display-xl" style={{ letterSpacing: -2.5, lineHeight: 0.9 }}>
            On t&apos;a<br />
            <span
              style={{
                background: "linear-gradient(120deg, var(--af-pink), var(--af-yellow))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              attendu.
            </span>
          </h1>
          <div className="relative mt-8 flex justify-center">
            <Mascot size={200} color={me.color} mood="love" arms cheering />
          </div>
          <p className="relative mx-auto mt-5 max-w-xs text-sm" style={{ color: "var(--text-dim)" }}>
            Connecte-toi pour retrouver ton blob, tes stats et tes potes.
          </p>
        </div>

        {/* RIGHT */}
        <div className="af-card-glass p-8">
          <p className="af-eyebrow" style={{ color: "var(--cb-brand)" }}>Connexion</p>
          <h2 className="cb-display-md mt-1" style={{ fontSize: 32, letterSpacing: -1 }}>
            Reprends ta place
          </h2>

          <div className="mt-6 grid gap-3.5">
            <AuthInput
              label="Email"
              type="email"
              value={me.email}
              onChange={(v) => update({ email: v })}
              placeholder="tu@example.com"
              autoComplete="email"
            />
            <AuthInput
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="•••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "var(--cb-brand)" }} />
              Se souvenir de moi
            </label>
            <Link href="/signup" className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
              Mot de passe oublié ?
            </Link>
          </div>

          <button onClick={submit} className="af-btn af-btn-primary mt-5 w-full" style={{ padding: "16px" }}>
            Se connecter →
          </button>

          <div className="my-6 h-px bg-white/10" />

          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => signIn("discord", { callbackUrl: "/" })} className="af-btn af-btn-ghost" style={{ padding: "12px", fontSize: 13 }}>
              🎮 Discord
            </button>
            <button onClick={() => signIn("discord", { callbackUrl: "/" })} title="Google bientôt — Discord pour l'instant" className="af-btn af-btn-ghost" style={{ padding: "12px", fontSize: 13, opacity: 0.6 }}>
              G&nbsp;&nbsp;Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-dim)" }}>
            Pas de compte ?{" "}
            <Link href="/signup" className="font-bold" style={{ color: "var(--af-pink)" }}>
              Inscription →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
