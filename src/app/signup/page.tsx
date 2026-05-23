"use client";

/**
 * /signup — Inscription + customisation du blob.
 *
 * Layout "studio" : pitch + preview à gauche, formulaire + customizer à droite.
 *
 * TODO (intégration backend) :
 *   - Brancher Next-Auth (Discord/Google) sur les boutons OAuth (login)
 *   - Sauver le profil via une route /api/me (POST) en plus du localStorage
 *   - Hash du mdp côté serveur si tu veux du credential-based auth
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Sparkles } from "@/components/ConfettiBurst";
import { Mascot, MASCOT_PALETTE } from "@/components/Mascot";
import { Customizer } from "@/components/Customizer";
import { AuthInput } from "@/components/AuthInput";
import { useMe } from "@/lib/hooks/useMe";
import { useAudio } from "@/lib/hooks/useAudio";

export default function SignupPage() {
  const router = useRouter();
  const [me, update] = useMe();
  const [password, setPassword] = useState("");
  const { playSuccess } = useAudio();

  const submit = () => {
    // TODO : call POST /api/auth/signup with { email, name, password }
    playSuccess();
    router.push("/");
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <Sparkles count={14} />
      <SiteNav />

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        {/* LEFT : Brand pitch */}
        <div className="flex flex-col lg:sticky lg:top-12 lg:self-start">
          <p className="af-eyebrow mb-2" style={{ color: "var(--af-pink)" }}>
            ✦ Création de blob
          </p>
          <h1 className="cb-display-xl" style={{ letterSpacing: -2.2, lineHeight: 0.95 }}>
            Donne vie<br />
            <span
              style={{
                background: "linear-gradient(120deg, var(--af-pink), var(--af-yellow))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              à ton avatar.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base" style={{ color: "var(--text-dim)" }}>
            Couleur, expression, accessoires. Ton blob te suit dans toutes les parties.
            Pas de photo, pas d&apos;identité — juste une vibe.
          </p>

          <div className="relative mt-8 flex justify-center py-6">
            <div
              className="absolute inset-5"
              style={{
                background: `radial-gradient(circle, ${MASCOT_PALETTE[me.color].glow}, transparent 70%)`,
                filter: "blur(40px)",
                opacity: 0.7,
              }}
            />
            <div className="relative">
              <Mascot
                size={260}
                color={me.color}
                mood={me.mood}
                arms={me.accessory === "arms"}
                crown={me.accessory === "crown"}
              />
            </div>
          </div>
          <div className="text-center">
            <p className="af-eyebrow">C&apos;est toi</p>
            <div className="cb-display-md mt-1" style={{ fontSize: 28 }}>{me.name}</div>
          </div>
        </div>

        {/* RIGHT : Form + customizer */}
        <div className="af-card-glass p-7">
          <p className="af-eyebrow" style={{ color: "var(--cb-brand)" }}>01 — Ton compte</p>
          <h2 className="cb-display-md mt-1" style={{ fontSize: 30, letterSpacing: -0.8 }}>
            Crée ton compte
          </h2>

          <div className="mt-6 grid gap-3.5">
            <AuthInput label="Pseudo" value={me.name} onChange={(v) => update({ name: v })} placeholder="Ton blase" />
            <AuthInput label="Email" type="email" value={me.email} onChange={(v) => update({ email: v })} placeholder="tu@example.com" autoComplete="email" />
            <AuthInput label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="•••••••••" autoComplete="new-password" />
          </div>

          <div className="my-7 h-px bg-white/10" />

          <p className="af-eyebrow" style={{ color: "var(--cb-brand)" }}>02 — Ton blob</p>
          <h3 className="cb-display-md mt-1" style={{ fontSize: 22 }}>Habille ton avatar</h3>
          <div className="mt-4">
            <Customizer me={me} update={update} layout="row" blobSize={70} showPreview={false} />
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={submit} className="af-btn af-btn-primary flex-1" style={{ padding: "16px" }}>
              Créer mon compte →
            </button>
            <Link
              href="/login"
              className="af-btn af-btn-ghost text-center"
              style={{ padding: "16px 22px", fontSize: 14, textDecoration: "none" }}
            >
              J&apos;en ai déjà un
            </Link>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            En continuant tu acceptes nos conditions. Pas de spam, on est trop fainéants pour ça.
          </p>
        </div>
      </section>
    </main>
  );
}
