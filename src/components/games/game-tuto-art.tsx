"use client";

/**
 * Kit d'illustrations des tutos (DA sticker du Verre Invisible : contour encre épais,
 * couleurs pleines, blobs Zinzin) pour composer les vignettes 220×170 de chaque jeu.
 *
 *   <TutoSvg>
 *     <Blob x={50} y={130} color={CAST.lea} mood="happy" />
 *     <Phone x={120} y={40} w={56} h={96}><SvgText x={28} y={50} text="9" size={34} /></Phone>
 *   </TutoSvg>
 *
 * Animations : classes CSS gt-bob, gt-pop, gt-pulse, gt-shake, gt-wiggle, gt-blink, gt-float,
 * gt-slide (va-et-vient horizontal), gt-flash (apparition cyclique) ; délai via style.animationDelay.
 * Tout est coupé si prefers-reduced-motion.
 */

import type { CSSProperties, ReactNode } from "react";

export const INK = "#15082E";
export const NIGHT_SOFT = "#2E1C6E";

/** Personnages récurrents des tutos et leur couleur. */
export const CAST = {
  lea: "#FF3EA5",
  malik: "#4ECDC4",
  ines: "#FFD23F",
  tom: "#FF6B5B",
  sarah: "#3DDC97",
  hugo: "#7A4EE8",
  max: "#B79CFF",
} as const;

export const FONT = "var(--font-display), system-ui, sans-serif";

const KEYFRAMES = `
@keyframes gt-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes gt-pop { 0%,15% { transform: scale(0); } 30% { transform: scale(1.15); } 40%,100% { transform: scale(1); } }
@keyframes gt-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes gt-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 60% { transform: translateX(-2px); } 80% { transform: translateX(2px); } }
@keyframes gt-wiggle { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
@keyframes gt-blink { 0%,45% { opacity: 1; } 50%,95% { opacity: 0.25; } 100% { opacity: 1; } }
@keyframes gt-float { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-7px) rotate(2deg); } }
@keyframes gt-slide { 0%,15% { transform: translateX(0); } 55%,100% { transform: translateX(var(--gt-dx, 40px)); } }
@keyframes gt-flash { 0%,30% { opacity: 0; transform: scale(0.6); } 40%,85% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1); } }
@keyframes gt-fade-a { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes gt-fade-b { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes gt-dash { to { stroke-dashoffset: -20; } }
.gt-bob { animation: gt-bob 1.6s ease-in-out infinite; }
.gt-pop { animation: gt-pop 2.6s cubic-bezier(.2,1.4,.4,1) infinite; transform-box: fill-box; transform-origin: center; }
.gt-pulse { animation: gt-pulse 1.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.gt-shake { animation: gt-shake 0.6s ease-in-out infinite; }
.gt-wiggle { animation: gt-wiggle 0.9s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
.gt-blink { animation: gt-blink 1.4s steps(1) infinite; }
.gt-float { animation: gt-float 2.2s ease-in-out infinite; }
.gt-slide { animation: gt-slide 2.6s ease-in-out infinite alternate; }
.gt-flash { animation: gt-flash 2.6s ease-out infinite; transform-box: fill-box; transform-origin: center; }
.gt-fade-a { animation: gt-fade-a 4s steps(1) infinite; }
.gt-fade-b { animation: gt-fade-b 4s steps(1) infinite; }
.gt-dash { stroke-dasharray: 6 4; animation: gt-dash 0.8s linear infinite; }
@media (prefers-reduced-motion: reduce) { .gt-anim, .gt-anim * { animation: none !important; } .gt-anim .gt-fade-b { opacity: 0; } }
`;

/** Cadre SVG 220×170 d'une vignette (fond nuit fourni par le GameTuto). `floor` : sol violet. */
export function TutoSvg({ children, floor = false, sky }: { children: ReactNode; floor?: boolean; sky?: string }) {
  return (
    <svg viewBox="0 0 220 170" className="gt-anim h-full w-full" aria-hidden style={{ display: "block" }}>
      <style>{KEYFRAMES}</style>
      {sky && <rect x={0} y={0} width={220} height={170} fill={sky} />}
      {floor && (
        <>
          <rect x={0} y={140} width={220} height={30} fill={NIGHT_SOFT} />
          <line x1={0} y1={140} x2={220} y2={140} stroke={INK} strokeWidth={3} />
        </>
      )}
      {children}
    </svg>
  );
}

export type BlobMood = "happy" | "panic" | "sleep" | "wink" | "sad" | "smirk" | "talk" | "cool";

/**
 * Blob Zinzin (corps arrondi + yeux + bouche). (x, y) = centre bas du blob, `s` ≈ largeur.
 * `hat` : petit accessoire posé au-dessus (badge, couronne…) dessiné par l'appelant.
 */
export function Blob({ x, y, s = 52, color, mood = "happy", className, style, children }: { x: number; y: number; s?: number; color: string; mood?: BlobMood; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const k = s / 60;
  return (
    <g transform={`translate(${x} ${y - 26 * k}) scale(${k})`}>
      <g className={className} style={style}>
        <path d="M-30 18 C-30 -26 -16 -30 0 -30 C16 -30 30 -26 30 18 Q30 26 22 26 L-22 26 Q-30 26 -30 18 Z" fill={color} stroke={INK} strokeWidth={3} />
        <Face mood={mood} />
        {children}
      </g>
    </g>
  );
}

function Face({ mood }: { mood: BlobMood }) {
  if (mood === "sleep") {
    return (
      <>
        <path d="M-16 -6 Q-10 -1 -4 -6 M4 -6 Q10 -1 16 -6" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <path d="M-5 11 Q0 14 5 11" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      </>
    );
  }
  if (mood === "cool") {
    return (
      <>
        <rect x={-21} y={-13} width={18} height={12} rx={4} fill={INK} />
        <rect x={3} y={-13} width={18} height={12} rx={4} fill={INK} />
        <path d="M-3 -9 L3 -9" stroke={INK} strokeWidth={3} />
        <path d="M-7 10 Q0 15 8 8" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      </>
    );
  }
  const big = mood === "panic";
  return (
    <>
      <circle cx={-10} cy={-6} r={big ? 9 : 7} fill="#fff" stroke={INK} strokeWidth={2.5} />
      {mood === "wink" ? (
        <path d="M5 -6 Q10 -10 15 -6" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      ) : (
        <circle cx={10} cy={-6} r={big ? 9 : 7} fill="#fff" stroke={INK} strokeWidth={2.5} />
      )}
      <circle cx={-9} cy={-6} r={3} fill={INK} />
      {mood !== "wink" && <circle cx={11} cy={-6} r={3} fill={INK} />}
      {mood === "panic" && <ellipse cx={0} cy={12} rx={7} ry={8} fill={INK} />}
      {mood === "happy" && <path d="M-7 9 Q0 16 7 9" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
      {mood === "wink" && <path d="M-7 9 Q0 16 7 9" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
      {mood === "sad" && <path d="M-7 14 Q0 7 7 14" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
      {mood === "smirk" && <path d="M-6 11 Q3 13 9 7" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
      {mood === "talk" && <ellipse cx={0} cy={11} rx={6} ry={4.5} fill={INK} />}
    </>
  );
}

/**
 * Téléphone vu de face (portrait). Enfants dessinés dans le repère de l'écran :
 * (0,0) = coin haut-gauche de l'écran, largeur w-8, hauteur h-14.
 */
export function Phone({ x, y, w = 56, h = 96, rot = 0, screen = "#FFF6E5", body = "#7A4EE8", className, style, children }: { x: number; y: number; w?: number; h?: number; rot?: number; screen?: string; body?: string; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2})`}>
      <g className={className} style={style}>
        <rect x={0} y={0} width={w} height={h} rx={10} fill={body} stroke={INK} strokeWidth={3} />
        <rect x={4} y={8} width={w - 8} height={h - 14} rx={5} fill={screen} stroke={INK} strokeWidth={2} />
        <rect x={w / 2 - 7} y={3} width={14} height={2.5} rx={1.2} fill={INK} />
        <g transform="translate(4 8)">{children}</g>
      </g>
    </g>
  );
}

/** Texte « display » centré (avec contour encre si `outline`). */
export function SvgText({ x, y, text, size = 14, fill = INK, outline, anchor = "middle", weight = 700, className, style }: { x: number; y: number; text: string; size?: number; fill?: string; outline?: boolean; anchor?: "start" | "middle" | "end"; weight?: number; className?: string; style?: CSSProperties }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontFamily={FONT}
      fontWeight={weight}
      fontSize={size}
      fill={fill}
      stroke={outline ? INK : undefined}
      strokeWidth={outline ? size / 5 : undefined}
      paintOrder="stroke"
      letterSpacing="-0.02em"
      wordSpacing="0.25em"
      className={className}
      style={style}
    >
      {text}
    </text>
  );
}

/** Bulle de dialogue (rectangle arrondi + pointe). `tail` : direction de la pointe. */
export function Bubble({ x, y, w, h = 26, text, size = 12, fill = "#fff", color = INK, tail = "down", tailX, className, style }: { x: number; y: number; w: number; h?: number; text: string; size?: number; fill?: string; color?: string; tail?: "down" | "left" | "right" | "none"; tailX?: number; className?: string; style?: CSSProperties }) {
  const tx = tailX ?? w / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className} style={style}>
        {tail === "down" && <path d={`M${tx - 6} ${h - 2} L${tx} ${h + 8} L${tx + 6} ${h - 2} Z`} fill={fill} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />}
        {tail === "left" && <path d={`M2 ${h / 2 - 5} L-8 ${h / 2 + 4} L2 ${h / 2 + 5} Z`} fill={fill} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />}
        {tail === "right" && <path d={`M${w - 2} ${h / 2 - 5} L${w + 8} ${h / 2 + 4} L${w - 2} ${h / 2 + 5} Z`} fill={fill} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />}
        <rect x={0} y={0} width={w} height={h} rx={h / 2.4} fill={fill} stroke={INK} strokeWidth={2.5} />
        {tail === "down" && <path d={`M${tx - 4.5} ${h - 1.5} L${tx + 4.5} ${h - 1.5}`} stroke={fill} strokeWidth={3} />}
        <SvgText x={w / 2} y={h / 2 + 1} text={text} size={size} fill={color} />
      </g>
    </g>
  );
}

/** Carte à jouer / étiquette (rectangle arrondi plein + texte). */
export function Card({ x, y, w = 40, h = 54, fill = "#fff", text, size = 14, color = INK, rot = 0, className, style, children }: { x: number; y: number; w?: number; h?: number; fill?: string; text?: string; size?: number; color?: string; rot?: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2})`}>
      <g className={className} style={style}>
        <rect x={0} y={0} width={w} height={h} rx={Math.min(8, w / 5)} fill={fill} stroke={INK} strokeWidth={2.5} />
        {text != null && <SvgText x={w / 2} y={h / 2 + 1} text={text} size={size} fill={color} />}
        {children}
      </g>
    </g>
  );
}

/** Flèche (chemin SVG libre) avec pointe, contour encre + trait blanc par défaut. */
export function Arrow({ d, head, color = "#fff", width = 4, dashed, className, style }: { d: string; head: [number, number, number]; color?: string; width?: number; dashed?: boolean; className?: string; style?: CSSProperties }) {
  // head = [x, y, angle en degrés] : position et direction de la pointe
  const [hx, hy, a] = head;
  return (
    <g className={className} style={style}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" className={dashed ? "gt-dash" : undefined} />
      <path d="M-8 -7 L2 0 L-8 7" transform={`translate(${hx} ${hy}) rotate(${a})`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Pastille ronde (badge de points, numéro…). */
export function Badge({ x, y, r = 14, fill = "#FFD23F", text, size, color = INK, className, style }: { x: number; y: number; r?: number; fill?: string; text: string; size?: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className} style={style}>
        <circle cx={0} cy={0} r={r} fill={fill} stroke={INK} strokeWidth={2.5} />
        <SvgText x={0} y={1} text={text} size={size ?? r * 0.95} fill={color} />
      </g>
    </g>
  );
}

/** Coche verte / croix rouge. */
export function Check({ x, y, s = 1, ok = true, className, style }: { x: number; y: number; s?: number; ok?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={className} style={style}>
        <circle r={11} fill={ok ? "#3DDC97" : "#FF6B5B"} stroke={INK} strokeWidth={2.5} />
        {ok ? (
          <path d="M-5 0 L-1 4 L5 -4" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M-4 -4 L4 4 M4 -4 L-4 4" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        )}
      </g>
    </g>
  );
}

/** Petits « z z z » de sommeil / yeux fermés. */
export function Zzz({ x, y, className = "gt-float" }: { x: number; y: number; className?: string }) {
  return (
    <g className={className}>
      <SvgText x={x} y={y} text="z" size={11} fill="#fff" />
      <SvgText x={x + 7} y={y - 8} text="z" size={14} fill="#fff" />
    </g>
  );
}

/** Étoiles / étincelles décoratives. */
export function Sparkle({ x, y, s = 1, fill = "#FFD23F", className = "gt-pulse", style }: { x: number; y: number; s?: number; fill?: string; className?: string; style?: CSSProperties }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className={className} style={style} d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" fill={fill} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
    </g>
  );
}

/** Couronne (à poser au-dessus d'un blob). */
export function Crown({ x, y, s = 1, className, style }: { x: number; y: number; s?: number; className?: string; style?: CSSProperties }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className={className} style={style} d="M-13 6 L-15 -8 L-6 -1 L0 -11 L6 -1 L15 -8 L13 6 Z" fill="#FFD23F" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
}

/** Cœur (vies). `broken` : fendu en deux. */
export function Heart({ x, y, s = 1, fill = "#FF3EA5", broken, className, style }: { x: number; y: number; s?: number; fill?: string; broken?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={className} style={style}>
        <path d="M0 8 C-12 0 -12 -9 -6 -9 C-3 -9 0 -6 0 -4 C0 -6 3 -9 6 -9 C12 -9 12 0 0 8 Z" fill={broken ? "#6B5A8E" : fill} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        {broken && <path d="M0 -4 L-2 0 L2 2 L0 7" fill="none" stroke={INK} strokeWidth={2} />}
      </g>
    </g>
  );
}

/** Lune (nuit). */
export function Moon({ x, y, r = 14 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#FFF6E5" stroke={INK} strokeWidth={2.5} />
      <circle cx={r * 0.45} cy={-r * 0.25} r={r * 0.85} fill="#1A0F45" />
    </g>
  );
}

/** Soleil (jour). */
export function Sun({ x, y, r = 13, className = "gt-pulse" }: { x: number; y: number; r?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d={`M0 ${-r - 3} L0 ${-r - 9}`} transform={`rotate(${a})`} stroke="#FFD23F" strokeWidth={3.5} strokeLinecap="round" />
        ))}
        <circle r={r} fill="#FFD23F" stroke={INK} strokeWidth={2.5} />
      </g>
    </g>
  );
}

/** Main qui pointe (index tendu) et tapote : avec rot=0, le bout est en (x, y) et pointe vers le HAUT (rot=180 : vers le bas). */
export function Finger({ x, y, rot = 0, flip = false, className = "gt-bob", style }: { x: number; y: number; rot?: number; /** Main gauche (poing à gauche) */ flip?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})${flip ? " scale(-1 1)" : ""}`}>
      <g className={className} style={style}>
        {/* Main qui pointe : manche, poing (doigts repliés + pouce), index avec ongle */}
        <path d="M-9 37 L19 37 L20 47 L-10 47 Z" fill="#4AD6C8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M-8.5 40.5 L19.3 40.5" stroke={INK} strokeWidth={1.4} opacity={0.35} />
        <path d="M-6 16 L-6 30 Q-6 38.5 3 38.5 L11 38.5 Q18.5 38.5 18.5 31 L18.5 21 Q18.5 15.5 13 15.5 L5.5 15.5" fill="#FFC9A8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M5.5 22 Q12 21 18.3 22.3" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M5.8 28.6 Q12 27.8 18.3 29" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M-6 21 L-6 3 Q-6 -3.5 0 -3.5 Q6 -3.5 6 3 L6 21" fill="#FFC9A8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M-3.4 2.6 Q0 0 3.4 2.6 L3.4 6 Q0 7.3 -3.4 6 Z" fill="#FFE6D8" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
        <path d="M-3 13 Q0 14.2 3 13" fill="none" stroke={INK} strokeWidth={1.3} strokeLinecap="round" opacity={0.7} />
        <path d="M-6 22.5 Q-12.5 23 -12 28.5 Q-11.5 33.5 -4 33 L9 31.5 Q12 31 11.5 28.5" fill="#FFC9A8" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-3.8 9 L-3.8 18" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
      </g>
    </g>
  );
}
