"use client";

/**
 * Mini-kit « sticker » partagé par La Patate, Lâche pas !, Pile Poil, Test de pureté,
 * Fais Deviner et Deviner le Mot (DA de l'app Zinzin) : blocs de couleur pleine,
 * contour encre épais, ombre dure décalée, titres Clash Display, boutons qui s'enfoncent.
 * Styles inline + Tailwind de base uniquement (aucun import depuis zinzin/).
 */

import { useState, type CSSProperties, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { GameIconBadge } from "../game-icon-button";

export const INK = "#15082E";
export const C = {
  yellow: "#FFD23F",
  pink: "#FF3EA5",
  violet: "#7A4EE8",
  mint: "#3DDC97",
  sky: "#4ECDC4",
  coral: "#FF6B5B",
  cream: "#FFF6E5",
  white: "#FFFFFF",
  night: "#1E1250",
  deep: "#0B0620",
  orange: "#FF8A3D",
} as const;

export const DISPLAY: CSSProperties = {
  fontFamily: "var(--font-display), system-ui, sans-serif",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  // L'espace de Clash Display est très étroit : on aère les mots
  wordSpacing: "0.12em",
};

/** Haut d'écran : sous la barre d'état ET sous la croix « quitter » de l'app. */
export const TOP_PAD = "calc(env(safe-area-inset-top, 0px) + 72px)";
export const BOTTOM_PAD = "calc(env(safe-area-inset-bottom, 0px) + 20px)";

/** Bloc plein à contour épais + ombre dure. */
export function sticker(bg: string, opts: { radius?: number; shadow?: number; border?: number; color?: string } = {}): CSSProperties {
  const { radius = 22, shadow = 4, border = 3, color = INK } = opts;
  return {
    background: bg,
    color,
    border: `${border}px solid ${INK}`,
    boxShadow: shadow ? `0 ${shadow}px 0 ${INK}` : "none",
    borderRadius: radius,
  };
}

/** Motif de points discret par-dessus une couleur pleine. */
export function dotted(bg: string, light = false): CSSProperties {
  return {
    backgroundColor: bg,
    backgroundImage: `radial-gradient(${light ? "rgba(21,8,46,0.09)" : "rgba(255,255,255,0.07)"} 1.6px, transparent 1.8px)`,
    backgroundSize: "22px 22px",
  };
}

/** Feuille de style commune (à placer une fois par écran). */
export function KitStyles() {
  return <style>{KIT_CSS}</style>;
}

const KIT_CSS = `
.zk-push { transition: transform .09s ease, box-shadow .09s ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.zk-push:not(:disabled):active { transform: translateY(3px) !important; box-shadow: 0 1px 0 ${INK} !important; }
.zk-push:disabled { opacity: .5; }
@keyframes zk-pop { 0% { transform: scale(.55) rotate(var(--zk-r, 0deg)); opacity: 0 } 70% { transform: scale(1.07) rotate(var(--zk-r, 0deg)); opacity: 1 } 100% { transform: scale(1) rotate(var(--zk-r, 0deg)) } }
@keyframes zk-rise { from { transform: translateY(18px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes zk-wobble { 0%,100% { transform: rotate(-7deg) scale(1) } 50% { transform: rotate(7deg) scale(1.04) } }
@keyframes zk-throb { 0%,100% { transform: scale(1) rotate(-3deg) } 50% { transform: scale(1.08) rotate(3deg) } }
@keyframes zk-spark { 0%,100% { transform: scale(1) rotate(0) } 50% { transform: scale(.7) rotate(25deg) } }
@keyframes zk-drop { 0% { transform: translateY(0); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(14px); opacity: 0 } }
@keyframes zk-blink { 0%,92%,100% { transform: scaleY(1) } 95% { transform: scaleY(.1) } }
.zk-pop { animation: zk-pop .42s cubic-bezier(.3,1.5,.5,1) both; }
.zk-rise { animation: zk-rise .38s cubic-bezier(.2,1.2,.4,1) both; }
`;

/** Écran plein : fond plein (+ points), contenu jamais sous la croix « quitter ». */
export function StickerScreen({
  bg = C.night,
  light = false,
  center = false,
  children,
  className = "",
  style,
}: {
  bg?: string;
  /** fond clair → points foncés, texte encre */
  light?: boolean;
  center?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative flex min-h-[100dvh] w-full shrink-0 flex-col items-center overflow-x-clip px-5 ${className}`}
      style={{
        ...dotted(bg, light),
        color: light ? INK : "#fff",
        paddingTop: TOP_PAD,
        paddingBottom: BOTTOM_PAD,
        transition: "background-color .35s",
        ...style,
      }}
    >
      <KitStyles />
      <div className={`flex w-full max-w-md flex-1 flex-col items-center ${center ? "justify-center" : ""}`}>{children}</div>
    </div>
  );
}

/** Bouton sticker (plein, contour, ombre dure, s'enfonce). `big` = bouton principal pleine largeur. */
export function StickerBtn({
  children,
  onClick,
  onPointerDown,
  bg = C.yellow,
  color = INK,
  big = false,
  disabled,
  className = "",
  style,
  label,
}: {
  children: ReactNode;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  bg?: string;
  color?: string;
  big?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      aria-label={label}
      className={`zk-push inline-flex items-center justify-center gap-2 px-5 ${big ? "w-full text-[22px]" : "text-[17px]"} ${className}`}
      style={{
        ...sticker(bg, { radius: 999, shadow: big ? 5 : 4, color }),
        ...DISPLAY,
        letterSpacing: "-0.01em",
        minHeight: big ? 60 : 48,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Lien discret (action secondaire), lisible, ≥ 44 px. */
export function SoftLink({ children, onClick, light = false }: { children: ReactNode; onClick: () => void; light?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4"
      style={{ color: light ? INK : "rgba(255,255,255,0.86)" }}
    >
      {children}
    </button>
  );
}

/** Titre de section (remplace les petits labels en capitales espacées). */
export function SectionTitle({ children, light = false, className = "" }: { children: ReactNode; light?: boolean; className?: string }) {
  return (
    <h2 className={`mb-2.5 w-full text-[22px] leading-tight ${className}`} style={{ ...DISPLAY, color: light ? INK : "#fff" }}>
      {children}
    </h2>
  );
}

/** Grande carte sticker. */
export function StickerCard({
  bg = C.cream,
  tilt = 0,
  radius = 24,
  shadow = 5,
  children,
  className = "",
  style,
}: {
  bg?: string;
  tilt?: number;
  radius?: number;
  shadow?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`w-full ${className}`} style={{ ...sticker(bg, { radius, shadow }), transform: tilt ? `rotate(${tilt}deg)` : undefined, ...style }}>
      {children}
    </div>
  );
}

/** Option à choix unique / interrupteur, en carte sticker. */
export function OptionCard({
  on,
  onClick,
  icon,
  title,
  sub,
  kind = "radio",
  onBg = C.yellow,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  title: string;
  sub?: string;
  kind?: "radio" | "switch";
  onBg?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role={kind === "switch" ? "switch" : "radio"}
      aria-checked={on}
      className="zk-push flex w-full items-center gap-3 px-3.5 py-3 text-left"
      style={{ ...sticker(on ? onBg : C.cream, { radius: 20, shadow: on ? 4 : 3 }), minHeight: 64 }}
    >
      {icon && <GameIconBadge icon={icon} bg={on ? "#fff" : onBg} size={40} />}
      <span className="min-w-0 flex-1">
        <span className="block text-[18px] leading-tight" style={DISPLAY}>{title}</span>
        {sub && <span className="mt-0.5 block text-[14px] font-semibold leading-snug" style={{ color: "#3A2A58" }}>{sub}</span>}
      </span>
      {kind === "switch" ? (
        <span className="relative shrink-0" style={{ width: 54, height: 32, borderRadius: 999, border: `3px solid ${INK}`, background: on ? C.mint : "#D9D2E6", transition: "background .2s" }}>
          <span className="absolute" style={{ top: 2, left: on ? 24 : 2, width: 22, height: 22, borderRadius: 999, background: "#fff", border: `3px solid ${INK}`, transition: "left .2s cubic-bezier(.4,1.6,.5,1)" }} />
        </span>
      ) : (
        <span className="grid shrink-0 place-items-center" style={{ width: 28, height: 28, borderRadius: 999, border: `3px solid ${INK}`, background: "#fff" }}>
          {on && <span style={{ width: 12, height: 12, borderRadius: 999, background: INK }} />}
        </span>
      )}
    </button>
  );
}

/** Pastille sélectionnable (nombre de manches, durées…). */
export function Chip({ on, onClick, children, onBg = C.yellow, className = "", style }: { on: boolean; onClick: () => void; children: ReactNode; onBg?: string; className?: string; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`zk-push min-h-12 px-4 text-[19px] ${className}`}
      style={{ ...sticker(on ? onBg : C.cream, { radius: 16, shadow: on ? 4 : 2 }), ...DISPLAY, letterSpacing: "-0.01em", ...style }}
    >
      {children}
    </button>
  );
}

/** Nom mis en valeur : petit sticker coloré dans une phrase (même police que la phrase). */
export function NameTag({ children, bg, tilt = -2, style }: { children: ReactNode; bg: string; tilt?: number; style?: CSSProperties }) {
  return (
    <span
      className="inline-block max-w-full truncate px-3 pb-1 pt-0.5 align-middle"
      style={{ ...sticker(bg, { radius: 14, shadow: 3, border: 2.5 }), transform: `rotate(${tilt}deg)`, ...style }}
    >
      {children}
    </span>
  );
}

// ═════════════════════════════════════════════════════════
// Visuels : patate et bombe en blobs SVG (cohérents avec les blobs de l'app)
// ═════════════════════════════════════════════════════════

const POTATO = { body: "#D9A066", deep: "#A8692F", hi: "#F4D3A0" };

function mixHex(a: string, b: string, t: number) {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

type BlobFace = "happy" | "worried" | "panic" | "dead" | "smug";

function Face({ face, cx = 60, cy = 62 }: { face: BlobFace; cx?: number; cy?: number }) {
  // Yeux globuleux de tailles différentes, comme les blobs de l'app
  const L = { x: cx - 17, y: cy - 8, r: face === "panic" ? 12 : 10 };
  const R = { x: cx + 15, y: cy - 10, r: face === "panic" ? 14 : 12 };
  if (face === "dead") {
    const x = (p: { x: number; y: number }, s: number) => (
      <g stroke={INK} strokeWidth={4.5} strokeLinecap="round">
        <path d={`M${p.x - s} ${p.y - s} L${p.x + s} ${p.y + s}`} />
        <path d={`M${p.x + s} ${p.y - s} L${p.x - s} ${p.y + s}`} />
      </g>
    );
    return (
      <g>
        {x(L, 7)}
        {x(R, 8)}
        <path d={`M${cx - 12} ${cy + 18} Q${cx} ${cy + 10} ${cx + 12} ${cy + 18}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d={`M${cx + 2} ${cy + 15} q4 10 9 2`} fill="#FF7A9C" stroke={INK} strokeWidth={2.5} />
      </g>
    );
  }
  const look = face === "smug" ? [0.35, 0.1] : face === "worried" ? [-0.2, -0.35] : [0.1, 0.25];
  const eye = (p: { x: number; y: number; r: number }, d: number) => (
    <g style={{ transformOrigin: `${p.x}px ${p.y}px`, animation: `zk-blink ${3 + d}s infinite` }}>
      <circle cx={p.x} cy={p.y} r={p.r} fill="#fff" stroke={INK} strokeWidth={3} />
      <circle cx={p.x + look[0] * p.r * 0.6} cy={p.y + look[1] * p.r * 0.6} r={p.r * (face === "panic" ? 0.32 : 0.48)} fill={INK} />
      <circle cx={p.x + look[0] * p.r * 0.6 + p.r * 0.18} cy={p.y + look[1] * p.r * 0.6 - p.r * 0.2} r={p.r * 0.15} fill="#fff" />
    </g>
  );
  return (
    <g>
      {eye(L, 0)}
      {eye(R, 0.7)}
      {face === "worried" && (
        <g stroke={INK} strokeWidth={3.5} strokeLinecap="round">
          <path d={`M${L.x - 9} ${L.y - 15} L${L.x + 7} ${L.y - 19}`} />
          <path d={`M${R.x - 8} ${R.y - 21} L${R.x + 10} ${R.y - 17}`} />
        </g>
      )}
      {face === "happy" && <path d={`M${cx - 12} ${cy + 12} Q${cx} ${cy + 24} ${cx + 12} ${cy + 12}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      {face === "smug" && <path d={`M${cx - 10} ${cy + 15} Q${cx + 4} ${cy + 21} ${cx + 13} ${cy + 11}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      {face === "worried" && <path d={`M${cx - 11} ${cy + 18} Q${cx - 5} ${cy + 12} ${cx} ${cy + 17} T${cx + 11} ${cy + 16}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      {face === "panic" && <ellipse cx={cx} cy={cy + 19} rx={9} ry={10} fill={INK} />}
    </g>
  );
}

/**
 * La patate : blob-pomme de terre (germes, taches), qui rougit et transpire
 * quand la mèche chauffe (`heat` 0 → 1).
 */
export function PotatoBlob({ size = 180, heat = 0, face, sweat, style, className }: { size?: number; heat?: number; face?: BlobFace; sweat?: boolean; style?: CSSProperties; className?: string }) {
  const h = Math.max(0, Math.min(1, heat));
  const body = mixHex(POTATO.body, "#FF6B3D", h * 0.75);
  const deep = mixHex(POTATO.deep, "#B8301A", h * 0.7);
  const f: BlobFace = face ?? (h > 0.7 ? "panic" : h > 0.35 ? "worried" : "happy");
  const drops = sweat ?? h > 0.3;
  return (
    <svg viewBox="-6 -14 132 140" width={size} height={size * (140 / 132)} style={{ overflow: "visible", ...style }} className={className} aria-hidden>
      {/* ombre au sol */}
      <ellipse cx={60} cy={120} rx={40} ry={6} fill="rgba(0,0,0,0.25)" />
      {/* germes */}
      <path d="M50 18 C47 6 38 1 29 3 C35 8 40 13 50 18Z" fill="#7BD35A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M60 16 C63 4 72 -1 81 1 C75 6 70 11 60 16Z" fill="#7BD35A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* corps (patate bosselée) */}
      <path
        d="M58 14 C82 12 104 26 109 50 C114 76 104 104 74 110 C48 115 18 106 11 80 C5 56 16 38 30 26 C38 19 47 15 58 14Z"
        fill={body}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      {/* ombre interne + reflet */}
      <path d="M100 66 C100 90 86 104 66 106 C84 98 96 86 100 66Z" fill={deep} opacity={0.45} />
      <ellipse cx={36} cy={34} rx={11} ry={6} fill={POTATO.hi} opacity={0.75} transform="rotate(-28 36 34)" />
      {/* taches */}
      <g fill={deep} opacity={0.6}>
        <ellipse cx={24} cy={62} rx={3.4} ry={2.4} />
        <ellipse cx={95} cy={44} rx={2.8} ry={2} />
        <ellipse cx={88} cy={92} rx={3.4} ry={2.4} />
        <ellipse cx={30} cy={92} rx={2.4} ry={1.8} />
        <ellipse cx={57} cy={102} rx={2.2} ry={1.6} />
      </g>
      {/* joues */}
      <ellipse cx={32} cy={76} rx={7} ry={4} fill="#FF6B8A" opacity={0.35 + h * 0.4} />
      <ellipse cx={90} cy={74} rx={7} ry={4} fill="#FF6B8A" opacity={0.35 + h * 0.4} />
      <Face face={f} cx={61} cy={60} />
      {drops && (
        <g>
          <path style={{ animation: "zk-drop 1.1s ease-in infinite" }} d="M10 34 C14 41 16 45 16 48 A6 6 0 0 1 4 48 C4 45 6 41 10 34Z" fill="#8FE3FF" stroke={INK} strokeWidth={2} />
          <path style={{ animation: "zk-drop 1.1s .5s ease-in infinite" }} d="M112 46 C115 51 116 54 116 56 A4.5 4.5 0 0 1 107 56 C107 54 109 51 112 46Z" fill="#8FE3FF" stroke={INK} strokeWidth={2} />
        </g>
      )}
    </svg>
  );
}

/** Bombe-blob (Lâche pas !) : corps rond, yeux, mèche avec étincelle. */
export function BombBlob({ size = 150, heat = 0, face, lit = true, style, className }: { size?: number; heat?: number; face?: BlobFace; lit?: boolean; style?: CSSProperties; className?: string }) {
  const h = Math.max(0, Math.min(1, heat));
  const body = mixHex("#4A4560", "#8A2A3A", h * 0.8);
  const f: BlobFace = face ?? (h > 0.6 ? "panic" : h > 0.25 ? "worried" : "smug");
  return (
    <svg viewBox="-6 -30 132 156" width={size} height={size * (156 / 132)} style={{ overflow: "visible", ...style }} className={className} aria-hidden>
      <ellipse cx={60} cy={120} rx={40} ry={6} fill="rgba(0,0,0,0.25)" />
      {/* mèche */}
      <rect x={50} y={8} width={20} height={12} rx={3} fill="#2C2840" stroke={INK} strokeWidth={3.2} />
      <path d="M60 8 C60 -4 70 -9 78 -16" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M60 8 C60 -4 70 -9 78 -16" fill="none" stroke="#C9935A" strokeWidth={4} strokeLinecap="round" />
      {lit && (
        <g style={{ transformOrigin: "80px -18px", animation: "zk-spark .28s steps(2) infinite" }}>
          <path d="M80 -32 L83 -22 L93 -21 L85 -15 L88 -5 L80 -11 L72 -5 L75 -15 L67 -21 L77 -22Z" fill="#FFD23F" stroke="#FF5A2E" strokeWidth={2.4} strokeLinejoin="round" />
        </g>
      )}
      <circle cx={60} cy={64} r={47} fill={body} stroke={INK} strokeWidth={3.5} />
      <ellipse cx={38} cy={40} rx={12} ry={7} fill="#fff" opacity={0.28} transform="rotate(-30 38 40)" />
      <ellipse cx={34} cy={80} rx={7} ry={4} fill="#FF6B8A" opacity={0.45 + h * 0.4} />
      <ellipse cx={88} cy={78} rx={7} ry={4} fill="#FF6B8A" opacity={0.45 + h * 0.4} />
      <Face face={f} cx={61} cy={62} />
    </svg>
  );
}

/** Petit compteur « bouton enfoncé » pour les états pressés tenus (gros boutons tactiles). */
export function usePressed() {
  const [down, setDown] = useState(false);
  return {
    down,
    bind: {
      onPointerDown: () => setDown(true),
      onPointerUp: () => setDown(false),
      onPointerLeave: () => setDown(false),
      onPointerCancel: () => setDown(false),
    },
  };
}
