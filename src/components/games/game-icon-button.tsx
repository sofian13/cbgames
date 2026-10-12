"use client";

/**
 * Icônes d'interface des jeux (site + app Zinzin) : boutons ronds « sticker »
 * (contour épais encre, ombre dure décalée, s'enfonce à l'appui) avec une icône
 * lucide — à la place des emojis Apple (🔊, ⓘ, 📜…) qui faisaient cheap.
 * Aucun CSS global requis : tout est en styles inline + Tailwind de base.
 */

import { useState, type CSSProperties, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export const GAME_INK = "#15082E";

type Size = "sm" | "md" | "lg";
const DIM: Record<Size, { box: number; icon: number; shadow: number; border: number }> = {
  sm: { box: 44, icon: 20, shadow: 3, border: 2.5 },
  md: { box: 48, icon: 22, shadow: 4, border: 2.5 },
  lg: { box: 60, icon: 28, shadow: 4, border: 3 },
};

/** Encre lisible sur un fond plein (#RRGGBB) : encre foncée ou blanc. */
function readableOn(bg: string): string {
  const m = bg.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return GAME_INK;
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.22 ? GAME_INK : "#fff";
}

/** Bouton rond icône seule (son, règles, historique…). ≥ 44 px, label accessible obligatoire. */
export function GameIconButton({
  icon: Icon,
  label,
  onClick,
  size = "sm",
  bg = "#fff",
  color,
  active,
  disabled,
  badge,
  className,
  style,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  size?: Size;
  /** Fond plein (#RRGGBB). Blanc par défaut. */
  bg?: string;
  /** Couleur de l'icône (déduite du fond sinon). */
  color?: string;
  /** État « enclenché » (aria-pressed), ex. son coupé. */
  active?: boolean;
  disabled?: boolean;
  /** Petite pastille (compteur…) en haut à droite. */
  badge?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const d = DIM[size];
  const [down, setDown] = useState(false);
  const pressed = down && !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
      className={`relative grid shrink-0 place-items-center rounded-full ${className ?? ""}`}
      style={{
        width: d.box,
        height: d.box,
        background: bg,
        color: color ?? readableOn(bg),
        border: `${d.border}px solid ${GAME_INK}`,
        boxShadow: `0 ${pressed ? 1 : d.shadow}px 0 ${GAME_INK}`,
        transform: pressed ? `translateY(${d.shadow - 1}px)` : undefined,
        transition: "transform 110ms ease, box-shadow 110ms ease",
        opacity: disabled ? 0.5 : 1,
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <Icon size={d.icon} strokeWidth={2.8} aria-hidden />
      {badge != null && (
        <span
          className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black leading-none"
          style={{ background: "#FF3EA5", color: "#fff", border: `2px solid ${GAME_INK}` }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/** Rangée de boutons ronds fixée en haut à DROITE (le haut-gauche reste au bouton quitter de l'app). */
export function GameTopRight({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`fixed right-3 z-40 flex gap-2.5 ${className ?? ""}`}
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
    >
      {children}
    </div>
  );
}

/** Icône en ligne dans un bouton texte (« Rejouer », « Revoir l'historique »…), à la taille du texte. */
export function GameInlineIcon({ icon: Icon, size = "1.1em", strokeWidth = 2.8, style }: { icon: LucideIcon; size?: number | string; strokeWidth?: number; style?: CSSProperties }) {
  return (
    <Icon
      aria-hidden
      size={size}
      strokeWidth={strokeWidth}
      style={{ display: "inline-block", verticalAlign: "-0.17em", flexShrink: 0, ...style }}
    />
  );
}

/** Pastille ronde « sticker » décorative (picto d'option, pas cliquable). */
export function GameIconBadge({ icon: Icon, bg = "#fff", color, size = 40, style }: { icon: LucideIcon; bg?: string; color?: string; size?: number; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: bg, color: color ?? readableOn(bg), border: `2.5px solid ${GAME_INK}`, boxShadow: `0 3px 0 ${GAME_INK}`, ...style }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.8} />
    </span>
  );
}
