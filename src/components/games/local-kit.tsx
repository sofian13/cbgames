"use client";

/**
 * Shared building blocks for single-device ("pass-and-play") local game modes.
 * Used by Top Ten, Le Bluffeur and Longueur d'onde to offer a local mode
 * alongside their online (multi-device) mode.
 */

import { useState } from "react";
import { Mascot, MascotAvatar, MASCOT_COLORS, type MascotColor } from "@/components/Mascot";

export type GameMode = "local" | "online";

export function colorForIndex(i: number): MascotColor {
  return MASCOT_COLORS[i % MASCOT_COLORS.length];
}

const SHELL = "relative flex min-h-[100svh] flex-col items-center text-white";
const BG = (accent: string) =>
  `radial-gradient(circle at 50% 12%, ${accent}, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`;

// ── Mode selection ────────────────────────────────────────
export function ModeSelect({
  emoji,
  name,
  tagline,
  onPick,
}: {
  emoji: string;
  name: string;
  tagline: string;
  onPick: (m: GameMode) => void;
}) {
  return (
    <div className={SHELL} style={{ background: BG("rgba(91,54,214,0.35)"), justifyContent: "center", padding: 24 }}>
      <div className="mb-3 text-5xl sm:text-7xl">{emoji}</div>
      <h1 className="cb-display-lg text-center sm:text-5xl">{name}</h1>
      <p className="mt-2 mb-8 max-w-md text-center text-sm sm:text-base" style={{ color: "var(--text-dim)" }}>{tagline}</p>

      <div className="w-full max-w-md space-y-3 sm:max-w-xl">
        <button
          onClick={() => onPick("local")}
          className="w-full rounded-3xl border p-5 text-left transition active:scale-[0.99]"
          style={{ background: "linear-gradient(140deg, rgba(255,62,165,0.18), rgba(255,255,255,0.04))", borderColor: "rgba(255,62,165,0.4)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📱</span>
            <div>
              <p className="cb-display-sm">Sur ce téléphone</p>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>On se passe le tél à tour de rôle (pass-and-play)</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onPick("online")}
          className="w-full rounded-3xl border p-5 text-left transition active:scale-[0.99]"
          style={{ background: "linear-gradient(140deg, rgba(78,205,196,0.16), rgba(255,255,255,0.04))", borderColor: "rgba(78,205,196,0.4)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📡</span>
            <div>
              <p className="cb-display-sm">Plusieurs téléphones</p>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>Chacun sur son tél, en ligne dans la même salle</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Players setup (local) ─────────────────────────────────
export function PlayersSetup({
  emoji,
  name,
  min,
  max,
  accent,
  onStart,
  onBack,
}: {
  emoji: string;
  name: string;
  min: number;
  max: number;
  accent: string;
  onStart: (names: string[]) => void;
  onBack?: () => void;
}) {
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const filled = names.map((n) => n.trim()).filter(Boolean);
  const canStart = filled.length >= min;

  const update = (i: number, v: string) => setNames((p) => p.map((n, idx) => (idx === i ? v.slice(0, 16) : n)));
  const add = () => setNames((p) => (p.length < max ? [...p, ""] : p));
  const remove = (i: number) => setNames((p) => p.filter((_, idx) => idx !== i));

  return (
    <div className={SHELL} style={{ background: BG(`${accent}30`), padding: "32px 20px" }}>
      <div className="mt-4 text-4xl sm:text-6xl">{emoji}</div>
      <h1 className="cb-display-md mt-2 sm:text-4xl">{name}</h1>
      <p className="mb-6 text-xs sm:text-sm" style={{ color: "var(--text-dim)" }}>Qui joue ? ({min}–{max} joueurs)</p>

      <div className="w-full max-w-md space-y-2 sm:max-w-xl sm:space-y-3">
        {names.map((n, i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-3">
            <MascotAvatar color={colorForIndex(i)} size={38} mood="happy" />
            <input
              value={n}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`Joueur ${i + 1}`}
              className="flex-1 rounded-2xl border px-4 py-3 text-sm outline-none sm:py-4 sm:text-base"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--line-soft)", color: "#fff" }}
            />
            {names.length > min && (
              <button onClick={() => remove(i)} className="px-2 text-lg" style={{ color: "var(--text-muted)" }}>×</button>
            )}
          </div>
        ))}
      </div>

      {names.length < max && (
        <button onClick={add} className="mt-3 rounded-full border px-4 py-2 text-xs font-semibold"
          style={{ borderColor: "var(--line-soft)", color: "var(--text-dim)" }}>
          + Ajouter un joueur
        </button>
      )}

      <button
        onClick={() => onStart(filled)}
        disabled={!canStart}
        className="af-btn af-btn-primary mt-8 w-full max-w-md disabled:opacity-40 sm:max-w-xl"
        style={{ fontSize: 16 }}
      >
        C&apos;est parti !
      </button>
      {!canStart && <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Minimum {min} joueurs</p>}

      {onBack && (
        <button onClick={onBack} className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>← Changer de mode</button>
      )}
    </div>
  );
}

// ── Pass-the-phone screen ─────────────────────────────────
export function PassScreen({
  toName,
  colorIndex,
  hint,
  buttonLabel = "C'est moi — ouvrir",
  accent = "#5B36D6",
  onReady,
}: {
  toName: string;
  colorIndex: number;
  hint?: string;
  buttonLabel?: string;
  accent?: string;
  onReady: () => void;
}) {
  return (
    <div className={SHELL} style={{ background: BG(`${accent}30`), justifyContent: "center", padding: 24 }}>
      <p className="af-eyebrow mb-4" style={{ color: "var(--text-dim)" }}>Passe le téléphone à</p>
      <Mascot size={130} color={colorForIndex(colorIndex)} mood="wink" arms />
      <h1 className="cb-display-lg mt-3 text-center sm:text-5xl">{toName}</h1>
      {hint && <p className="mt-2 max-w-sm text-center text-sm sm:text-base" style={{ color: "var(--text-dim)" }}>{hint}</p>}
      <button onClick={onReady} className="af-btn af-btn-primary mt-8 w-full max-w-xs sm:max-w-sm" style={{ fontSize: 16 }}>{buttonLabel}</button>
    </div>
  );
}

// ── Generic centered shell (loading etc.) ─────────────────
export function LocalShell({ accent = "#5B36D6", center, children }: { accent?: string; center?: boolean; children: React.ReactNode }) {
  return (
    <div className={SHELL} style={{ background: BG(`${accent}28`), justifyContent: center ? "center" : "flex-start", padding: "24px 20px" }}>
      {children}
    </div>
  );
}
