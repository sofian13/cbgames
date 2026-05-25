"use client";

/**
 * uc-kit — design system de la refonte Undercover (thème noir / dossier).
 * Porté du prototype designer (undercover-shared.jsx) en TSX.
 * Blob → Mascot ; tokens prototype → tokens de l'app.
 */

import type { CSSProperties, ReactNode } from "react";
import { Mascot, type MascotColor, type MascotMood } from "@/components/Mascot";

const DISP = "var(--font-display), sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

// ── Shades — lunettes noires posées sur un blob ──
export function Shades({ size = 80, tilt = -2, glow = false }: { size?: number; tilt?: number; glow?: boolean }) {
  const w = size * 0.78;
  const h = size * 0.22;
  return (
    <div style={{ position: "absolute", left: "50%", top: size * 0.32, width: w, height: h, transform: `translateX(-50%) rotate(${tilt}deg)`, pointerEvents: "none" }}>
      <svg viewBox="0 0 100 28" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`shg-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E0828" /><stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>
        <path d="M2 12 L18 12 M48 12 L52 12 M82 12 L98 12" stroke="#1A0E2E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M18 4 Q18 18 30 22 Q44 24 47 14 Q48 6 36 4 Z" fill={`url(#shg-${size})`} stroke="#FFD23F" strokeWidth="1" />
        <path d="M53 14 Q56 24 70 22 Q82 18 82 4 L65 4 Q53 6 53 14 Z" fill={`url(#shg-${size})`} stroke="#FFD23F" strokeWidth="1" />
        <ellipse cx="26" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.55" />
        <ellipse cx="63" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.4" />
        {glow && <><circle cx="33" cy="13" r="11" fill="#FF3EA5" opacity="0.25" /><circle cx="67" cy="13" r="11" fill="#FF3EA5" opacity="0.25" /></>}
      </svg>
    </div>
  );
}

// ── SpyBlob — Mascot + lunettes ──
export function SpyBlob({ size = 80, glow = false, shadesTilt = -2, color = "purple", mood = "neutral" as MascotMood }: { size?: number; glow?: boolean; shadesTilt?: number; color?: MascotColor; mood?: MascotMood }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <Mascot size={size} color={color} mood={mood} bob={false} blink={false} shadow={false} />
      <Shades size={size} tilt={shadesTilt} glow={glow} />
    </div>
  );
}

// ── Stamp — tampon pivoté (CLASSIFIED, ÉLIMINÉ…) ──
export function Stamp({ text, color = "#FF3EA5", rotate = -8, size = 22, style = {} }: { text: string; color?: string; rotate?: number; size?: number; style?: CSSProperties }) {
  return (
    <div style={{
      display: "inline-block", padding: `${size * 0.18}px ${size * 0.5}px`, border: `3px solid ${color}`, color,
      fontFamily: DISP, fontWeight: 900, fontSize: size, letterSpacing: 3, textTransform: "uppercase",
      transform: `rotate(${rotate}deg)`, borderRadius: 6, background: "rgba(0,0,0,0.18)",
      boxShadow: `inset 0 0 0 1px ${color}55`, textShadow: `0 0 14px ${color}55`, ...style,
    }}>{text}</div>
  );
}

// ── DossierTag — "FILE · 03" mono ──
export function DossierTag({ children, color = "#FFD23F", style = {} }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color,
      padding: "3px 8px", border: `1px solid ${color}55`, borderRadius: 3, background: `${color}11`, ...style,
    }}>{children}</span>
  );
}

// ── UCBack — fond noir / spotlight / grille dossier (rempli le conteneur) ──
export function UCBack({ tone = "noir", children, style = {} }: { tone?: "noir" | "danger" | "spot" | "civ"; children?: ReactNode; style?: CSSProperties }) {
  const toneBg: Record<string, string> = {
    noir: "radial-gradient(120% 70% at 50% 0%, rgba(91,54,214,0.35) 0%, transparent 60%), radial-gradient(120% 60% at 50% 100%, rgba(255,62,165,0.18) 0%, transparent 60%), linear-gradient(180deg, #0A0420 0%, #150834 100%)",
    danger: "radial-gradient(circle at 50% 25%, rgba(255,62,165,0.35), transparent 55%), linear-gradient(180deg, #1A0414 0%, #0E0828 100%)",
    spot: "radial-gradient(ellipse 90% 60% at 50% 18%, rgba(255,210,63,0.18) 0%, transparent 55%), linear-gradient(180deg, #0E0828 0%, #06021A 100%)",
    civ: "radial-gradient(circle at 50% 28%, rgba(61,220,151,0.30), transparent 55%), linear-gradient(180deg, #0A1A18 0%, #0E0828 100%)",
  };
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: toneBg[tone] || toneBg.noir, ...style }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px)",
        maskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 80%)",
      }} />
      {children}
    </div>
  );
}

// ── FileCard — carte dossier (coin coupé + liseré accent) ──
export function FileCard({ children, style = {}, accent = "var(--af-yellow)", padding = 16 }: { children: ReactNode; style?: CSSProperties; accent?: string; padding?: number }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)",
      border: "1px solid rgba(255,255,255,0.10)", borderRadius: 18, padding,
      boxShadow: "0 12px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)", ...style,
    }}>
      <div style={{ position: "absolute", top: -1, right: -1, width: 22, height: 22, background: "var(--bg-deep, #0E0828)", clipPath: "polygon(100% 0, 0 0, 100% 100%)", borderLeft: "1px solid rgba(255,255,255,0.10)", borderBottom: "1px solid rgba(255,255,255,0.10)", borderTopRightRadius: 18 }} />
      <div style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 3, borderRadius: 3, background: accent, boxShadow: `0 0 12px ${accent}`, opacity: 0.9 }} />
      {children}
    </div>
  );
}

// ── UCButton — action principale ──
export function UCButton({ children, tone = "primary", icon, sub, full = true, style = {}, disabled, onClick }: {
  children: ReactNode; tone?: "primary" | "danger" | "gold" | "ghost" | "mint"; icon?: ReactNode; sub?: ReactNode; full?: boolean; style?: CSSProperties; disabled?: boolean; onClick?: () => void;
}) {
  const tones = {
    primary: { bg: "linear-gradient(180deg, #7A4EE8 0%, #4D26B6 100%)", shadow: "0 12px 28px rgba(91,54,214,0.55), inset 0 1px 0 rgba(255,255,255,0.25)", color: "white" },
    danger: { bg: "linear-gradient(180deg, #FF3EA5 0%, #B5176E 100%)", shadow: "0 12px 28px rgba(255,62,165,0.55), inset 0 1px 0 rgba(255,255,255,0.25)", color: "white" },
    gold: { bg: "linear-gradient(180deg, #FFD23F 0%, #C48800 100%)", shadow: "0 12px 28px rgba(255,210,63,0.45), inset 0 1px 0 rgba(255,255,255,0.4)", color: "#1A0E2E" },
    ghost: { bg: "rgba(255,255,255,0.08)", shadow: "inset 0 0 0 1px rgba(255,255,255,0.10)", color: "white" },
    mint: { bg: "linear-gradient(180deg, #3DDC97 0%, #189A66 100%)", shadow: "0 12px 28px rgba(61,220,151,0.45), inset 0 1px 0 rgba(255,255,255,0.3)", color: "#0E0828" },
  }[tone];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? "100%" : "auto", padding: sub ? "12px 18px" : "16px 18px", borderRadius: 18, border: "none",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
      background: tones.bg, color: tones.color, boxShadow: tones.shadow,
      fontFamily: DISP, fontWeight: 700, fontSize: 16, letterSpacing: -0.2,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10, ...style,
    }}>
      {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
        <span>{children}</span>
        {sub && <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75, letterSpacing: 0.3, marginTop: 2 }}>{sub}</span>}
      </span>
    </button>
  );
}

// ── PlayerCountPicker — sélecteur 3→8 en pastilles (le "slider" mobile) ──
export function PlayerCountPicker({ value, min = 3, max = 8, onChange }: { value: number; min?: number; max?: number; onChange: (n: number) => void }) {
  const opts: number[] = [];
  for (let n = min; n <= max; n++) opts.push(n);
  return (
    <div style={{ padding: "14px 12px", borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      {opts.map((n) => {
        const on = n <= value;
        const sel = n === value;
        return (
          <button key={n} onClick={() => onChange(n)} style={{
            width: sel ? 38 : 30, height: sel ? 38 : 30, borderRadius: "50%", padding: 0, cursor: "pointer",
            background: on ? (sel ? "linear-gradient(135deg, var(--af-yellow), #FF8B5C)" : "rgba(255,210,63,0.35)") : "rgba(255,255,255,0.05)",
            border: sel ? "2px solid white" : "1px solid rgba(255,255,255,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: DISP, fontWeight: 800, fontSize: sel ? 16 : 13,
            color: on ? (sel ? "#1A0E2E" : "white") : "var(--text-muted)",
            boxShadow: sel ? "0 8px 20px rgba(255,210,63,0.4)" : "none", transition: "all .15s",
          }}>{n}</button>
        );
      })}
    </div>
  );
}
