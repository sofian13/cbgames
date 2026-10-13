"use client";

/**
 * Illustrations SVG du Verre Invisible (DA sticker : contour encre, couleurs pleines) :
 * vignettes du mini-tuto (animées en CSS) et verre renversé de l'écran de résultat.
 */

const INK = "#15082E";

/** Verre droit (gobelet) avec liquide ; `fill` 0..1. */
function Glass({ x, y, w, h, color, top, fill, className }: { x: number; y: number; w: number; h: number; color: string; top: string; fill: number; className?: string }) {
  const tw = w;
  const bw = w * 0.76;
  const lh = h * fill;
  const ly = y + h - lh;
  const wAt = (yy: number) => bw + (tw - bw) * ((y + h - yy) / h);
  const lw = wAt(ly);
  const cx = x + w / 2;
  return (
    <g>
      <path d={`M${cx - tw / 2} ${y} L${cx - bw / 2} ${y + h} L${cx + bw / 2} ${y + h} L${cx + tw / 2} ${y} Z`} fill="rgba(220,235,255,0.25)" />
      <g className={className} style={{ transformOrigin: `${cx}px ${y + h}px` }}>
        <path d={`M${cx - lw / 2} ${ly} L${cx - bw / 2 + 2} ${y + h - 2} L${cx + bw / 2 - 2} ${y + h - 2} L${cx + lw / 2} ${ly} Z`} fill={color} />
        <ellipse cx={cx} cy={ly} rx={lw / 2 - 1} ry={lw * 0.09} fill={top} stroke={INK} strokeWidth={2} />
      </g>
      <path d={`M${cx - tw / 2} ${y} L${cx - bw / 2} ${y + h} L${cx + bw / 2} ${y + h} L${cx + tw / 2} ${y}`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <ellipse cx={cx} cy={y} rx={tw / 2} ry={tw * 0.1} fill="none" stroke={INK} strokeWidth={3.5} />
      <path d={`M${cx - tw * 0.36} ${y + h * 0.15} L${cx - bw * 0.36} ${y + h * 0.8}`} stroke="rgba(255,255,255,0.75)" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

function Bottle({ color }: { color: string }) {
  return (
    <g>
      <path d="M-7 -44 L-7 -30 Q-18 -26 -18 -16 L-18 30 Q-18 36 -12 36 L12 36 Q18 36 18 30 L18 -16 Q18 -26 7 -30 L7 -44 Z" fill={color} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <rect x={-19} y={-8} width={38} height={18} rx={3} fill="#FFF6E5" stroke={INK} strokeWidth={2.5} />
      <rect x={-9} y={-49} width={18} height={6} rx={2} fill="#FFD23F" stroke={INK} strokeWidth={2.5} />
      <path d="M-11 -18 L-11 -12 M-11 14 L-11 28" stroke="rgba(255,255,255,0.7)" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

/** Petit blob (yeux + bouche) en SVG. */
function Blob({ x, y, s, color, mood }: { x: number; y: number; s: number; color: string; mood: "happy" | "panic" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 60})`}>
      <path d="M-30 18 C-30 -26 -16 -30 0 -30 C16 -30 30 -26 30 18 Q30 26 22 26 L-22 26 Q-30 26 -30 18 Z" fill={color} stroke={INK} strokeWidth={3} />
      <circle cx={-10} cy={-6} r={mood === "panic" ? 9 : 7} fill="#fff" stroke={INK} strokeWidth={2.5} />
      <circle cx={10} cy={-6} r={mood === "panic" ? 9 : 7} fill="#fff" stroke={INK} strokeWidth={2.5} />
      <circle cx={-9} cy={-6} r={3} fill={INK} />
      <circle cx={11} cy={-6} r={3} fill={INK} />
      {mood === "panic" ? <ellipse cx={0} cy={12} rx={7} ry={8} fill={INK} /> : <path d="M-7 9 Q0 16 7 9" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
    </g>
  );
}

const KEYFRAMES = `
@keyframes vv-fill { 0% { transform: scaleY(0.35); } 70%,100% { transform: scaleY(1); } }
@keyframes vv-pour { 0%,8% { transform: translate(150px,40px) rotate(0deg); } 22%,82% { transform: translate(140px,30px) rotate(-118deg); } 100% { transform: translate(150px,40px) rotate(0deg); } }
@keyframes vv-stream { 0%,22% { opacity: 0; } 26%,78% { opacity: 1; } 82%,100% { opacity: 0; } }
@keyframes vv-slide { 0%,12% { transform: translate(-40px,-16px); } 60%,100% { transform: translate(40px,-16px); } }
@keyframes vv-tilt { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes vv-drop { 0% { transform: translate(0,0); opacity: 1; } 100% { transform: translate(var(--dx), 60px); opacity: 0; } }
@keyframes vv-wobble { 0%,100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }
@media (prefers-reduced-motion: reduce) { .vv-anim, .vv-anim * { animation: none !important; } }
`;

/** Vignette 1 : on verse, le verre se remplit. */
export function TutoPour({ color = "#FF3EA5", top = "#FF8BA7" }: { color?: string; top?: string }) {
  return (
    <svg viewBox="0 0 220 170" className="vv-anim h-full w-full" aria-hidden>
      <style>{KEYFRAMES}</style>
      <rect x={0} y={140} width={220} height={30} fill="#2E1C6E" />
      <line x1={0} y1={140} x2={220} y2={140} stroke={INK} strokeWidth={3} />
      <ellipse cx={92} cy={142} rx={42} ry={8} fill="#FFD23F" stroke={INK} strokeWidth={3} />
      <Glass x={57} y={58} w={70} h={82} color={color} top={top} fill={0.7} className="vv-fill-g" />
      <g style={{ animation: "vv-stream 2.8s ease-in-out infinite" }}>
        <path d="M96 30 Q94 60 93 90" stroke={INK} strokeWidth={10} strokeLinecap="round" fill="none" />
        <path d="M96 30 Q94 60 93 90" stroke={color} strokeWidth={5} strokeLinecap="round" fill="none" />
      </g>
      <g style={{ animation: "vv-pour 2.8s ease-in-out infinite" }}>
        <Bottle color={color} />
      </g>
      <style>{`.vv-fill-g{animation:vv-fill 2.8s ease-in-out infinite}`}</style>
    </svg>
  );
}

/** Vignette 2 : le tél passe à plat d'un blob à l'autre. */
export function TutoPass() {
  return (
    <svg viewBox="0 0 220 170" className="vv-anim h-full w-full" aria-hidden>
      <style>{KEYFRAMES}</style>
      <Blob x={38} y={128} s={52} color="#4ECDC4" mood="happy" />
      <Blob x={182} y={128} s={52} color="#FFD23F" mood="panic" />
      <g style={{ animation: "vv-slide 2.4s ease-in-out infinite alternate" }}>
        <g style={{ animation: "vv-tilt 0.9s ease-in-out infinite", transformOrigin: "110px 96px" }}>
          {/* tél vu en perspective, posé à plat */}
          <path d="M72 100 L92 84 L150 84 L132 100 Z" fill="#FFF6E5" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M72 100 L132 100 L132 106 L72 106 Z" fill="#7A4EE8" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M132 100 L150 84 L150 90 L132 106 Z" fill="#3F1F9C" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          {/* le verre dessus */}
          <path d="M100 60 L104 90 L120 90 L124 60 Z" fill="rgba(220,235,255,0.3)" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M101.5 70 L104.5 89 L119.5 89 L122.5 70 Z" fill="#FF9F1C" />
          <ellipse cx={112} cy={70} rx={10.5} ry={2.6} fill="#FFC861" stroke={INK} strokeWidth={1.8} />
          <ellipse cx={112} cy={60} rx={12} ry={3} fill="none" stroke={INK} strokeWidth={3} />
        </g>
      </g>
      <path d="M86 40 L134 40 M126 33 L134 40 L126 47" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Vignette 3 : ça déborde, la mascotte panique. */
export function TutoSpill({ color = "#3DDC97", top = "#A4F2CC" }: { color?: string; top?: string }) {
  return (
    <svg viewBox="0 0 220 170" className="vv-anim h-full w-full" aria-hidden>
      <style>{KEYFRAMES}</style>
      <rect x={0} y={140} width={220} height={30} fill="#2E1C6E" />
      <line x1={0} y1={140} x2={220} y2={140} stroke={INK} strokeWidth={3} />
      <ellipse cx={150} cy={150} rx={34} ry={7} fill={color} stroke={INK} strokeWidth={2.5} />
      <g style={{ animation: "vv-wobble 0.7s ease-in-out infinite", transformOrigin: "110px 140px" }}>
        <Glass x={75} y={52} w={70} h={86} color={color} top={top} fill={0.98} />
        <path d="M145 52 Q160 50 156 72 Q152 100 160 138 L148 138 Q146 100 140 64 Z" fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>
      {[-30, 10, 40].map((dx, i) => (
        <circle key={i} cx={148} cy={46} r={5 - i} fill={color} stroke={INK} strokeWidth={2}
          style={{ animation: `vv-drop 0.9s ${i * 0.25}s ease-in infinite`, ["--dx" as string]: `${dx}px` }} />
      ))}
      <Blob x={36} y={124} s={54} color="#FF3EA5" mood="panic" />
    </svg>
  );
}

/** Le verre renversé sur le côté + la flaque (écran « X a tout renversé »). */
export function SpilledGlass({ color, top, deep }: { color: string; top: string; deep: string }) {
  return (
    <svg viewBox="0 0 300 150" className="h-full w-full" aria-hidden>
      {/* flaque */}
      <path d="M40 118 C30 100 80 92 120 96 C170 88 250 92 268 110 C284 126 240 140 190 136 C150 146 90 142 60 136 C40 132 46 124 40 118 Z" fill={color} stroke={INK} strokeWidth={3.5} />
      <ellipse cx={110} cy={108} rx={26} ry={5} fill="rgba(255,255,255,0.55)" />
      <ellipse cx={210} cy={122} rx={14} ry={3} fill="rgba(255,255,255,0.45)" />
      {/* gouttes */}
      <circle cx={272} cy={86} r={6} fill={color} stroke={INK} strokeWidth={2.5} />
      <circle cx={256} cy={70} r={4} fill={color} stroke={INK} strokeWidth={2.5} />
      <circle cx={34} cy={96} r={5} fill={color} stroke={INK} strokeWidth={2.5} />
      {/* verre couché (bord à droite) */}
      <g transform="rotate(-8 150 90)">
        <path d="M70 72 L160 60 L160 120 L70 108 Z" fill="rgba(220,235,255,0.35)" />
        <path d="M74 98 L160 106 L160 120 L72 108 Z" fill={deep} opacity={0.9} />
        <path d="M74 98 L160 104" stroke={top} strokeWidth={4} strokeLinecap="round" />
        <path d="M70 72 L160 60 M70 108 L160 120" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <ellipse cx={70} cy={90} rx={9} ry={18} fill="rgba(255,255,255,0.4)" stroke={INK} strokeWidth={4} />
        <ellipse cx={160} cy={90} rx={11} ry={30} fill="none" stroke={INK} strokeWidth={4} />
        <path d="M92 74 L148 67" stroke="rgba(255,255,255,0.8)" strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* glaçon échappé */}
      <g transform="translate(200 98) rotate(18)">
        <rect x={-11} y={-11} width={22} height={22} rx={5} fill="rgba(232,250,255,0.95)" stroke={INK} strokeWidth={2.5} />
        <rect x={-7} y={-7} width={10} height={4} rx={2} fill="#fff" />
      </g>
    </svg>
  );
}
