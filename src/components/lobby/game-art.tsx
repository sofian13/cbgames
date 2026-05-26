"use client";

/**
 * game-art — illustration unique par jeu pour les tuiles du catalogue.
 * Porté du prototype designer (game-art.jsx) en TSX.
 * GameArt = dégradé catégorie + motif + icône SVG dédiée + sheen.
 */

import { useId } from "react";

const DISP = "var(--font-display), sans-serif";

export const CB_CAT: Record<string, { color: string; color2: string; label: string }> = {
  words:    { color: "#5BA3FF", color2: "#3D7DD0", label: "Mots" },
  trivia:   { color: "#FFD23F", color2: "#D9A60D", label: "Culture" },
  speed:    { color: "#FF6B5B", color2: "#D33D2A", label: "Rapidité" },
  strategy: { color: "#3DDC97", color2: "#1AA66A", label: "Stratégie" },
  social:   { color: "#FF3EA5", color2: "#C71B7A", label: "Bluff" },
  cards:    { color: "#7A4EE8", color2: "#5526BA", label: "Cartes" },
  party:    { color: "#C58CFF", color2: "#9555E0", label: "Party" },
  sport:    { color: "#4ECDC4", color2: "#1F9C92", label: "Sport" },
};

type Pattern = "dots" | "grid" | "diag" | "wave" | "blob" | "cards" | "stars" | "tri";

function GameBackdrop({ cat, pattern = "dots", angle = 145 }: { cat: string; pattern?: Pattern; angle?: number }) {
  const c = CB_CAT[cat] || CB_CAT.party;
  const uid = useId().replace(/:/g, "");
  const g = `${uid}-g`, p = `${uid}-p`, v = `${uid}-v`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={c.color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c.color2} stopOpacity="1" />
        </linearGradient>
        {pattern === "dots" && (
          <pattern id={p} width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.2" fill="white" fillOpacity="0.16" /></pattern>
        )}
        {pattern === "grid" && (
          <pattern id={p} width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 0 H14 M0 0 V14" stroke="white" strokeOpacity="0.10" strokeWidth="1" /></pattern>
        )}
        {pattern === "diag" && (
          <pattern id={p} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="white" strokeOpacity="0.12" strokeWidth="2" /></pattern>
        )}
        {pattern === "wave" && (
          <pattern id={p} width="20" height="10" patternUnits="userSpaceOnUse"><path d="M0 5 Q5 0 10 5 T20 5" fill="none" stroke="white" strokeOpacity="0.14" strokeWidth="1.4" /></pattern>
        )}
        {pattern === "blob" && (
          <pattern id={p} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="6" fill="white" fillOpacity="0.08" /></pattern>
        )}
        {pattern === "cards" && (
          <pattern id={p} width="18" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(15)"><rect x="2" y="2" width="10" height="14" rx="1.5" fill="white" fillOpacity="0.10" /></pattern>
        )}
        {pattern === "stars" && (
          <pattern id={p} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M11 4 L12.2 8.5 L17 9 L13.3 12 L14.5 17 L11 14 L7.5 17 L8.7 12 L5 9 L9.8 8.5 Z" fill="white" fillOpacity="0.13" /></pattern>
        )}
        {pattern === "tri" && (
          <pattern id={p} width="16" height="14" patternUnits="userSpaceOnUse"><path d="M8 2 L14 12 L2 12 Z" fill="white" fillOpacity="0.10" /></pattern>
        )}
        <radialGradient id={v} cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${g})`} />
      <rect width="100" height="100" fill={`url(#${p})`} />
      <rect width="100" height="100" fill={`url(#${v})`} />
    </svg>
  );
}

function GameIcon({ id }: { id: string }) {
  const SW = 2.2;
  const lite = "rgba(255,255,255,0.92)";
  const dark = "rgba(0,0,0,0.35)";

  switch (id) {
    case "bomb-party":
      return (
        <g>
          {/* corps de bombe — sphère noire brillante */}
          <ellipse cx="44" cy="80" rx="22" ry="4" fill="rgba(0,0,0,0.3)" />
          <circle cx="44" cy="58" r="25" fill="#0E0E14" />
          <circle cx="44" cy="58" r="25" fill="url(#bomb-shine)" />
          <defs>
            <radialGradient id="bomb-shine" cx="36%" cy="32%" r="72%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="32%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="35" cy="48" rx="7" ry="4.5" fill="rgba(255,255,255,0.5)" transform="rotate(-30 35 48)" />
          {/* embout métallique */}
          <rect x="50" y="33" width="14" height="9" rx="2" fill="#3A3A44" transform="rotate(-32 57 37)" />
          {/* mèche + étincelle */}
          <path d="M60 36 Q72 26 82 30 Q74 34 78 42" fill="none" stroke="#C9A227" strokeWidth={SW + 0.8} strokeLinecap="round" />
          <circle cx="80" cy="28" r="5" fill="#FFD23F" />
          <circle cx="80" cy="28" r="2.6" fill="#FF6B5B" />
          <g stroke="#FFD23F" strokeWidth="1.6" strokeLinecap="round">
            <line x1="84" y1="20" x2="88" y2="14" /><line x1="89" y1="28" x2="94" y2="27" /><line x1="76" y1="18" x2="74" y2="12" /><line x1="86" y1="34" x2="91" y2="37" />
          </g>
        </g>
      );
    case "word-chain":
      return (
        <g>
          {[{ x: 26, y: 50 }, { x: 44, y: 44 }, { x: 62, y: 38 }, { x: 80, y: 32 }].map((pt, i) => (
            <g key={i} transform={`translate(${pt.x} ${pt.y}) rotate(-28)`}>
              <ellipse cx="0" cy="0" rx="12" ry="7" fill="none" stroke={lite} strokeWidth={SW + 1} />
              <ellipse cx="0" cy="0" rx="8.5" ry="4" fill="none" stroke={lite} strokeWidth="0.8" strokeOpacity="0.5" />
            </g>
          ))}
          <text x="26" y="82" fontFamily={DISP} fontWeight="900" fontSize="13" textAnchor="middle" fill={lite}>A</text>
          <text x="35" y="82" fontFamily={DISP} fontWeight="700" fontSize="10" textAnchor="middle" fill="rgba(255,255,255,0.55)">→</text>
          <text x="45" y="82" fontFamily={DISP} fontWeight="900" fontSize="13" textAnchor="middle" fill={lite}>B</text>
          <text x="54" y="82" fontFamily={DISP} fontWeight="700" fontSize="10" textAnchor="middle" fill="rgba(255,255,255,0.55)">→</text>
          <text x="64" y="82" fontFamily={DISP} fontWeight="900" fontSize="13" textAnchor="middle" fill={lite}>C</text>
        </g>
      );
    case "speed-quiz":
      return (
        <g>
          <g transform="rotate(-4 50 54)">
            <rect x="18" y="26" width="56" height="52" rx="5" fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
            <rect x="24" y="34" width="40" height="5" rx="1" fill="#0A0A0A" />
            <rect x="24" y="44" width="44" height="4" rx="1" fill="rgba(0,0,0,0.2)" />
            <rect x="24" y="52" width="44" height="4" rx="1" fill="rgba(0,0,0,0.2)" />
            <rect x="24" y="60" width="44" height="4" rx="1" fill="rgba(0,0,0,0.2)" />
            <rect x="24" y="68" width="44" height="4" rx="1" fill="rgba(0,0,0,0.2)" />
          </g>
          <path d="M62 14 L46 50 L60 50 L52 84 L82 40 L66 40 L72 14 Z" fill="#FFD23F" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" strokeLinejoin="round" />
        </g>
      );
    case "roast-quiz":
      return (
        <g>
          <g transform="rotate(-6 46 56)">
            <rect x="18" y="32" width="56" height="48" rx="5" fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
            <rect x="24" y="40" width="34" height="5" rx="1" fill="#0A0A0A" />
            <rect x="24" y="50" width="44" height="4" rx="1" fill="#3DDC97" />
            <rect x="24" y="58" width="44" height="4" rx="1" fill="rgba(0,0,0,0.18)" />
            <rect x="24" y="66" width="44" height="4" rx="1" fill="rgba(0,0,0,0.18)" />
            <circle cx="22" cy="52" r="2" fill="#3DDC97" />
          </g>
          <g transform="translate(76 22)">
            <path d="M0 -14 C 8 -2 12 6 12 14 C 12 22 6 28 0 28 C -6 28 -12 22 -12 14 C -12 6 -8 -2 0 -14 Z" fill="#FF6B5B" />
            <path d="M0 -6 C 5 2 8 8 8 14 C 8 18 4 22 0 22 C -4 22 -8 18 -8 14 C -8 8 -4 2 0 -6 Z" fill="#FFD23F" />
          </g>
        </g>
      );
    case "reaction-time":
      return (
        <g>
          <circle cx="50" cy="52" r="32" fill="rgba(255,255,255,0.10)" stroke={lite} strokeWidth={SW} />
          <circle cx="50" cy="52" r="22" fill="none" stroke={lite} strokeWidth={SW - 0.4} />
          <circle cx="50" cy="52" r="12" fill="none" stroke={lite} strokeWidth={SW - 0.4} />
          <circle cx="50" cy="52" r="4" fill="#FFD23F" />
          <path d="M82 30 L66 46" stroke={lite} strokeWidth={SW + 1.2} strokeLinecap="round" />
          <path d="M76 24 L74 36 L86 32 Z" fill={lite} />
        </g>
      );
    case "tap-rush":
      return (
        <g>
          {[36, 26, 16].map((r, i) => (
            <circle key={i} cx="52" cy="56" r={r} fill="none" stroke={lite} strokeOpacity={0.18 + i * 0.16} strokeWidth={SW} />
          ))}
          <circle cx="52" cy="56" r="8" fill="#FFD23F" />
          <g transform="translate(48 28)">
            <rect x="-7" y="24" width="14" height="22" rx="3" fill={lite} />
            <rect x="-10" y="4" width="20" height="24" rx="5" fill={lite} />
            <rect x="-2.5" y="-10" width="5" height="16" rx="2.5" fill={lite} />
            <ellipse cx="0" cy="-9" rx="2.5" ry="1.5" fill="rgba(0,0,0,0.18)" />
            <line x1="-7" y1="12" x2="7" y2="12" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
            <line x1="-7" y1="20" x2="7" y2="20" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
          </g>
        </g>
      );
    case "split-second":
      return (
        <g>
          <circle cx="50" cy="56" r="28" fill="rgba(0,0,0,0.30)" stroke={lite} strokeWidth={SW} />
          <rect x="44" y="22" width="12" height="6" rx="2" fill={lite} />
          <line x1="50" y1="56" x2="68" y2="44" stroke={lite} strokeWidth={SW + 1} strokeLinecap="round" />
          <line x1="50" y1="56" x2="50" y2="36" stroke="#FFD23F" strokeWidth={SW - 0.4} strokeLinecap="round" />
          <circle cx="50" cy="56" r="3" fill={lite} />
        </g>
      );
    case "king-hill":
      return (
        <g>
          <path d="M10 80 L34 50 L50 64 L66 44 L90 80 Z" fill="rgba(0,0,0,0.25)" />
          <path d="M10 80 L34 50 L50 64 L66 44 L90 80 Z" fill="none" stroke={lite} strokeWidth={SW} />
          <path d="M40 32 L46 40 L52 28 L58 40 L64 32 L62 50 L42 50 Z" fill="#FFD23F" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <circle cx="46" cy="38" r="1.5" fill="#FF3EA5" /><circle cx="58" cy="38" r="1.5" fill="#FF3EA5" />
        </g>
      );
    case "loup-garou":
      return (
        <g>
          <circle cx="72" cy="28" r="22" fill="rgba(255,230,150,0.95)" />
          <circle cx="66" cy="22" r="4" fill="rgba(0,0,0,0.12)" /><circle cx="80" cy="34" r="3" fill="rgba(0,0,0,0.10)" /><circle cx="76" cy="20" r="2.5" fill="rgba(0,0,0,0.10)" />
          <g transform="translate(36 52)">
            <path d="M-22 -16 L-16 -32 L-10 -16 Z" fill="rgba(0,0,0,0.92)" /><path d="M22 -16 L16 -32 L10 -16 Z" fill="rgba(0,0,0,0.92)" />
            <path d="M-24 -10 Q-26 12 -16 20 L-8 24 Q0 28 8 24 L16 20 Q26 12 24 -10 Q22 -18 0 -20 Q-22 -18 -24 -10 Z" fill="rgba(0,0,0,0.92)" />
            <ellipse cx="-9" cy="-2" rx="3.4" ry="3" fill="#FFD23F" /><ellipse cx="9" cy="-2" rx="3.4" ry="3" fill="#FFD23F" />
            <ellipse cx="-9" cy="-2" rx="1.2" ry="2" fill="#0A0A0A" /><ellipse cx="9" cy="-2" rx="1.2" ry="2" fill="#0A0A0A" />
            <path d="M-6 12 L0 22 L6 12 Z" fill="rgba(0,0,0,0.95)" /><ellipse cx="0" cy="11" rx="3" ry="1.4" fill="#222" />
            <path d="M-3 17 L-1.5 23 L0 18 L1.5 23 L3 17" fill="#fff" stroke="rgba(0,0,0,0.8)" strokeWidth="0.4" />
          </g>
        </g>
      );
    case "undercover":
      return (
        <g>
          <ellipse cx="36" cy="52" rx="14" ry="10" fill="rgba(0,0,0,0.8)" stroke={lite} strokeWidth={SW - 0.4} />
          <ellipse cx="68" cy="52" rx="14" ry="10" fill="rgba(0,0,0,0.8)" stroke={lite} strokeWidth={SW - 0.4} />
          <line x1="50" y1="52" x2="54" y2="50" stroke={lite} strokeWidth={SW} /><line x1="50" y1="52" x2="46" y2="50" stroke={lite} strokeWidth={SW} />
          <ellipse cx="32" cy="48" rx="4" ry="2" fill="rgba(255,255,255,0.55)" /><ellipse cx="64" cy="48" rx="4" ry="2" fill="rgba(255,255,255,0.55)" />
          <path d="M20 80 Q50 70 80 80" fill="none" stroke={lite} strokeWidth={SW - 0.4} strokeLinecap="round" strokeOpacity="0.4" />
        </g>
      );
    case "infiltre":
      return (
        <g>
          <circle cx="42" cy="44" r="24" fill="rgba(255,255,255,0.15)" stroke={lite} strokeWidth={SW + 1} />
          <circle cx="42" cy="44" r="16" fill="rgba(255,255,255,0.25)" />
          <line x1="60" y1="62" x2="84" y2="86" stroke={lite} strokeWidth={SW + 3} strokeLinecap="round" />
          <text x="42" y="50" fontFamily={DISP} fontWeight="900" fontSize="22" textAnchor="middle" fill={lite}>?</text>
        </g>
      );
    case "la-taupe":
      return (
        <g>
          {/* monticule de terre + trou */}
          <ellipse cx="50" cy="76" rx="34" ry="9" fill="rgba(0,0,0,0.45)" />
          <ellipse cx="50" cy="73" rx="26" ry="6.5" fill="rgba(0,0,0,0.55)" />
          {/* corps de taupe qui sort */}
          <ellipse cx="50" cy="52" rx="21" ry="19" fill="#6E6678" />
          <ellipse cx="50" cy="47" rx="16" ry="13" fill="#867E92" />
          {/* pattes griffues */}
          <g fill="#F4B6C8">
            <path d="M30 60 l-5 3 m5 -3 l-5 0 m5 0 l-3 -4" stroke="#F4B6C8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M70 60 l5 3 m-5 -3 l5 0 m-5 0 l3 -4" stroke="#F4B6C8" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
          {/* museau rose */}
          <ellipse cx="50" cy="58" rx="8" ry="6" fill="#FF8FB0" />
          <circle cx="46.5" cy="59" r="1.3" fill="#0A0A0A" /><circle cx="53.5" cy="59" r="1.3" fill="#0A0A0A" />
          {/* yeux fermés (taupe aveugle) */}
          <path d="M40 47 q3 2 6 0" fill="none" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M54 47 q3 2 6 0" fill="none" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round" />
          {/* terre projetée */}
          <circle cx="22" cy="70" r="2" fill="rgba(0,0,0,0.4)" /><circle cx="78" cy="68" r="2.4" fill="rgba(0,0,0,0.4)" /><circle cx="16" cy="64" r="1.4" fill="rgba(0,0,0,0.35)" />
        </g>
      );
    case "black-market":
      return (
        <g>
          <ellipse cx="50" cy="46" rx="22" ry="22" fill={lite} />
          <rect x="42" y="62" width="16" height="10" fill={lite} />
          <circle cx="40" cy="44" r="5" fill="rgba(0,0,0,0.9)" /><circle cx="60" cy="44" r="5" fill="rgba(0,0,0,0.9)" />
          <rect x="46" y="56" width="3" height="6" fill="rgba(0,0,0,0.7)" /><rect x="51" y="56" width="3" height="6" fill="rgba(0,0,0,0.7)" />
          <path d="M44 68 L40 74 M50 68 L50 76 M56 68 L60 74" stroke={lite} strokeWidth={SW + 0.5} strokeLinecap="round" />
        </g>
      );
    case "code-names":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => {
            const colors = ["rgba(255,255,255,0.20)", "rgba(91,163,255,0.85)", "rgba(255,107,91,0.85)", "rgba(0,0,0,0.8)"];
            const variant = (i * 4 + j) % 7;
            const fill = variant === 1 ? colors[1] : variant === 3 ? colors[2] : variant === 5 ? colors[3] : colors[0];
            return <rect key={`${i}-${j}`} x={14 + j * 18} y={18 + i * 18} width="14" height="14" rx="2.5" fill={fill} />;
          }))}
        </g>
      );
    case "enchere":
      return (
        <g>
          <g transform="rotate(-22 50 50)">
            <rect x="22" y="38" width="50" height="14" rx="3" fill={lite} />
            <rect x="22" y="38" width="50" height="3" fill="rgba(0,0,0,0.18)" />
            <rect x="42" y="50" width="6" height="32" fill={lite} />
          </g>
          <g stroke={lite} strokeWidth="2" strokeLinecap="round">
            <line x1="76" y1="76" x2="88" y2="76" /><line x1="74" y1="84" x2="84" y2="90" /><line x1="68" y1="84" x2="68" y2="92" />
          </g>
        </g>
      );
    case "roulette":
      return (
        <g>
          <circle cx="50" cy="54" r="26" fill="none" stroke={lite} strokeWidth={SW + 1} />
          <circle cx="50" cy="54" r="20" fill="rgba(255,255,255,0.12)" />
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return <line key={i} x1={50 + Math.cos(a) * 20} y1={54 + Math.sin(a) * 20} x2={50 + Math.cos(a) * 26} y2={54 + Math.sin(a) * 26} stroke={lite} strokeWidth={SW - 0.4} />;
          })}
          <circle cx="56" cy="42" r="4" fill="#FF6B5B" />
        </g>
      );
    case "chess":
      return (
        <g>
          {/* Échiquier en perspective */}
          <g transform="translate(50 70) skewX(-26)">
            {Array.from({ length: 6 }).map((_, i) => Array.from({ length: 6 }).map((_, j) => (
              <rect key={`${i}-${j}`} x={-36 + j * 12} y={-15 + i * 5} width="12" height="5" fill={(i + j) % 2 === 0 ? "rgba(10,20,15,0.72)" : "rgba(255,255,255,0.9)"} />
            )))}
            <rect x={-36} y={-15} width={72} height={30} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.6" />
          </g>
          {/* Ombre portée du roi */}
          <ellipse cx="46" cy="70" rx="20" ry="4.5" fill="rgba(0,0,0,0.3)" />
          {/* Roi blanc */}
          <g transform="translate(46 46)">
            {/* socle */}
            <path d="M-15 22 L15 22 L11 16 L-11 16 Z" fill={lite} stroke="rgba(0,0,0,0.5)" strokeWidth="1.1" strokeLinejoin="round" />
            <rect x="-13" y="11" width="26" height="5" rx="1.5" fill={lite} stroke="rgba(0,0,0,0.5)" strokeWidth="1.1" />
            {/* corps en cloche */}
            <path d="M-11 11 C -13 -1, -8 -9, 0 -11 C 8 -9, 13 -1, 11 11 Z" fill={lite} stroke="rgba(0,0,0,0.5)" strokeWidth="1.1" strokeLinejoin="round" />
            {/* couronne */}
            <path d="M-8 -10 L-8 -17 L8 -17 L8 -10 Z" fill={lite} stroke="rgba(0,0,0,0.5)" strokeWidth="1.1" strokeLinejoin="round" />
            {/* croix */}
            <rect x="-1.8" y="-30" width="3.6" height="14" rx="1" fill={lite} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
            <rect x="-6" y="-26" width="12" height="3.6" rx="1" fill={lite} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
            {/* ombrage doux */}
            <path d="M-9 -8 C -10 0, -7 8, -4 10 L-2 10 C -6 6, -7 -2, -5 -9 Z" fill="rgba(0,0,0,0.12)" />
          </g>
          {/* Petit pion noir derrière */}
          <g transform="translate(76 58)">
            <ellipse cx="0" cy="11" rx="9" ry="2.6" fill="rgba(0,0,0,0.25)" />
            <circle cx="0" cy="-7" r="3.6" fill="rgba(8,16,12,0.9)" />
            <path d="M-3.4 -4 L3.4 -4 L2 0 L-2 0 Z" fill="rgba(8,16,12,0.9)" />
            <path d="M-6 0 L6 0 L8 10 L-8 10 Z" fill="rgba(8,16,12,0.9)" />
          </g>
        </g>
      );
    case "battleship":
      return (
        <g>
          <path d="M8 60 L18 76 L82 76 L92 60 Z" fill={lite} />
          <rect x="40" y="42" width="20" height="18" fill="rgba(255,255,255,0.75)" />
          <rect x="30" y="50" width="40" height="10" fill={lite} />
          <circle cx="46" cy="50" r="2" fill={dark} /><circle cx="54" cy="50" r="2" fill={dark} />
          <path d="M44 24 L50 16 L56 24 L56 42 L44 42 Z" fill={lite} />
          <path d="M0 84 Q20 78 40 84 T80 84 T100 84 V100 H0 Z" fill="rgba(0,0,0,0.25)" />
        </g>
      );
    case "uno":
      return (
        <g>
          <g transform="rotate(-18 30 60)">
            <rect x="14" y="30" width="36" height="54" rx="5" fill="#FF6B5B" stroke="#fff" strokeWidth="2" />
            <ellipse cx="32" cy="57" rx="15" ry="22" fill="#fff" transform="rotate(20 32 57)" />
            <text x="32" y="67" fontFamily={DISP} fontWeight="900" fontSize="28" textAnchor="middle" fill="#FF6B5B">9</text>
          </g>
          <g transform="rotate(6 52 48)">
            <rect x="36" y="18" width="36" height="54" rx="5" fill="#3DDC97" stroke="#fff" strokeWidth="2" />
            <ellipse cx="54" cy="45" rx="15" ry="22" fill="#fff" transform="rotate(20 54 45)" />
            <text x="54" y="55" fontFamily={DISP} fontWeight="900" fontSize="28" textAnchor="middle" fill="#3DDC97">4</text>
          </g>
          <g transform="rotate(22 74 38)">
            <rect x="58" y="10" width="36" height="54" rx="5" fill="#FFD23F" stroke="#fff" strokeWidth="2" />
            <ellipse cx="76" cy="37" rx="15" ry="22" fill="#fff" transform="rotate(20 76 37)" />
            <text x="76" y="45" fontFamily={DISP} fontWeight="900" fontSize="20" textAnchor="middle" fill="#FFD23F">+2</text>
          </g>
        </g>
      );
    case "poker":
      return (
        <g>
          <g transform="rotate(-10 30 50)">
            <rect x="14" y="24" width="32" height="46" rx="4" fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
            <text x="19" y="36" fontFamily="Georgia, serif" fontWeight="900" fontSize="12" fill="#0A0A0A">A</text>
            <text x="30" y="60" fontFamily="Georgia, serif" fontSize="22" textAnchor="middle" fill="#0A0A0A">♠</text>
          </g>
          <g transform="rotate(10 60 46)">
            <rect x="44" y="18" width="32" height="46" rx="4" fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
            <text x="49" y="30" fontFamily="Georgia, serif" fontWeight="900" fontSize="12" fill="#D11C2D">K</text>
            <text x="60" y="54" fontFamily="Georgia, serif" fontSize="22" textAnchor="middle" fill="#D11C2D">♥</text>
          </g>
          <ellipse cx="68" cy="82" rx="22" ry="5" fill="rgba(0,0,0,0.5)" />
          <ellipse cx="68" cy="78" rx="22" ry="5" fill="#FF6B5B" stroke="#fff" strokeWidth="1" />
          <ellipse cx="68" cy="74" rx="22" ry="5" fill="#3DDC97" stroke="#fff" strokeWidth="1" />
        </g>
      );
    case "huit-americain":
      return (
        <g>
          <g transform="rotate(-22 38 60)">
            <rect x="22" y="30" width="32" height="46" rx="4" fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
            <text x="27" y="42" fontFamily="Georgia, serif" fontWeight="900" fontSize="12" fill="#D11C2D">7</text>
            <text x="38" y="56" fontFamily="Georgia, serif" fontSize="18" textAnchor="middle" fill="#D11C2D">♦</text>
          </g>
          <g transform="rotate(6 52 50)"><rect x="36" y="20" width="32" height="46" rx="4" fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" /></g>
          <g>
            <rect x="42" y="14" width="36" height="54" rx="5" fill="#FFD23F" stroke="rgba(0,0,0,0.55)" strokeWidth="1.6" />
            <text x="60" y="54" fontFamily={DISP} fontWeight="900" fontSize="38" textAnchor="middle" fill="#0A0A0A">8</text>
          </g>
          <g transform="translate(82 86)">
            <circle r="11" fill="#FF6B5B" stroke="#fff" strokeWidth="2" />
            <text fontFamily={DISP} fontWeight="900" fontSize="10" textAnchor="middle" y="4" fill="#fff">+2</text>
          </g>
        </g>
      );
    case "president":
      return (
        <g>
          <g transform="translate(0 4) rotate(-12 24 64)">
            <rect x="10" y="40" width="28" height="40" rx="3.5" fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
            <text x="15" y="52" fontFamily="Georgia, serif" fontWeight="900" fontSize="11" fill="#0A0A0A">3</text>
            <text x="24" y="68" fontFamily="Georgia, serif" fontSize="14" textAnchor="middle" fill="#0A0A0A">♣</text>
          </g>
          <g transform="translate(0 -2) rotate(2 50 60)">
            <rect x="36" y="32" width="28" height="40" rx="3.5" fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
            <text x="41" y="44" fontFamily="Georgia, serif" fontWeight="900" fontSize="11" fill="#D11C2D">K</text>
            <text x="50" y="60" fontFamily="Georgia, serif" fontSize="14" textAnchor="middle" fill="#D11C2D">♥</text>
          </g>
          <g transform="translate(0 -8) rotate(14 76 56)">
            <rect x="62" y="28" width="28" height="40" rx="3.5" fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
            <text x="67" y="40" fontFamily="Georgia, serif" fontWeight="900" fontSize="11" fill="#0A0A0A">2</text>
            <text x="76" y="56" fontFamily="Georgia, serif" fontSize="14" textAnchor="middle" fill="#0A0A0A">♠</text>
          </g>
          <g transform="translate(50 14)">
            <path d="M-14 8 L-10 -4 L-4 4 L0 -8 L4 4 L10 -4 L14 8 Z" fill="#FFD23F" stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
            <rect x="-14" y="8" width="28" height="3" fill="#FFD23F" stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
            <circle cx="-6" cy="2" r="1.4" fill="#FF3EA5" /><circle cx="0" cy="-3" r="1.6" fill="#FF6B5B" /><circle cx="6" cy="2" r="1.4" fill="#FF3EA5" />
          </g>
        </g>
      );
    case "contree":
      return (
        <g>
          <g transform="translate(50 22)">
            <rect x="-12" y="-16" width="24" height="32" rx="3" fill="#1E3068" stroke="#fff" strokeWidth="1.2" />
            <rect x="-9" y="-13" width="18" height="26" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
            <text x="0" y="4" fontSize="14" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontFamily="Georgia, serif">♦</text>
          </g>
          <g transform="translate(50 76)">
            <rect x="-14" y="-18" width="28" height="34" rx="3.5" fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
            <text x="-9" y="-7" fontFamily="Georgia, serif" fontWeight="900" fontSize="10" fill="#D11C2D">A</text>
            <text x="0" y="8" fontFamily="Georgia, serif" fontSize="18" textAnchor="middle" fill="#D11C2D">♥</text>
          </g>
          <g transform="translate(20 50) rotate(-90)">
            <rect x="-12" y="-16" width="24" height="32" rx="3" fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
            <text x="-8" y="-6" fontFamily="Georgia, serif" fontWeight="900" fontSize="9" fill="#0A0A0A">10</text>
            <text x="0" y="8" fontFamily="Georgia, serif" fontSize="14" textAnchor="middle" fill="#0A0A0A">♠</text>
          </g>
          <g transform="translate(80 50) rotate(90)">
            <rect x="-12" y="-16" width="24" height="32" rx="3" fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
            <text x="-8" y="-6" fontFamily="Georgia, serif" fontWeight="900" fontSize="9" fill="#D11C2D">D</text>
            <text x="0" y="8" fontFamily="Georgia, serif" fontSize="14" textAnchor="middle" fill="#D11C2D">♥</text>
          </g>
          <g transform="translate(50 50)">
            <circle r="9" fill="#FFD23F" stroke="rgba(0,0,0,0.6)" strokeWidth="1.2" />
            <text textAnchor="middle" y="3" fontFamily={DISP} fontWeight="900" fontSize="8" fill="#0A0A0A">2v2</text>
          </g>
        </g>
      );
    case "blind-control":
      return (
        <g>
          <rect x="30" y="44" width="40" height="14" rx="3" fill={lite} /><rect x="43" y="30" width="14" height="40" rx="3" fill={lite} />
          <path d="M50 32 L46 36 H54 Z" fill="rgba(0,0,0,0.4)" /><path d="M50 68 L46 64 H54 Z" fill="rgba(0,0,0,0.4)" />
          <path d="M32 50 L36 46 V54 Z" fill="rgba(0,0,0,0.4)" /><path d="M68 50 L64 46 V54 Z" fill="rgba(0,0,0,0.4)" />
          <circle cx="22" cy="78" r="4" fill="#FFD23F" /><circle cx="80" cy="20" r="4" fill="#FF3EA5" /><circle cx="20" cy="22" r="4" fill="#3DDC97" /><circle cx="82" cy="80" r="4" fill="#5BA3FF" />
        </g>
      );
    case "block-runner":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={i * 20} y="72" width="20" height="14" fill={i % 2 ? "rgba(255,255,255,0.18)" : lite} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          ))}
          <rect x="36" y="34" width="22" height="22" rx="4" fill="#FFD23F" />
          <circle cx="42" cy="42" r="1.8" fill="#000" /><circle cx="50" cy="42" r="1.8" fill="#000" />
          <path d="M40 50 Q46 54 52 50" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M62 26 L78 26 L78 22 L88 30 L78 38 L78 34 L62 34 Z" fill={lite} />
        </g>
      );
    case "top-ten":
      return (
        <g>
          <rect x="14" y="22" width="72" height="14" rx="7" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
            const col = ["#3DDC97", "#5BA3FF", "#5BA3FF", "#A78BFA", "#C58CFF", "#FFD23F", "#FFD23F", "#FF8E58", "#FF6B5B", "#FF3EA5"][i];
            return <rect key={i} x={16 + i * 6.8} y={24} width={6} height={10} rx="1" fill={col} />;
          })}
          <path d="M82 38 L82 44 L77 44 L82 50 L87 44 L83 44 L83 38 Z" fill="#FF3EA5" />
          <g transform="translate(50 70)">
            <path d="M0 -22 C 12 -8 18 0 18 12 C 18 22 10 28 0 28 C -10 28 -18 22 -18 12 C -18 0 -12 -8 0 -22 Z" fill="#FF6B5B" />
            <path d="M0 -12 C 6 -4 10 2 10 10 C 10 16 6 20 0 20 C -6 20 -10 16 -10 10 C -10 4 -6 -2 0 -12 Z" fill="#FFD23F" />
            <text textAnchor="middle" y="12" fontFamily={DISP} fontWeight="900" fontSize="18" fill="#0A0A0A">10</text>
          </g>
        </g>
      );
    case "le-bluffeur":
      return (
        <g>
          <g transform="translate(-2 4) rotate(-12 38 50)">
            <path d="M22 30 Q38 22 54 30 L52 56 Q38 70 24 56 Z" fill={lite} />
            <ellipse cx="32" cy="42" rx="3" ry="4" fill="rgba(0,0,0,0.85)" /><ellipse cx="44" cy="42" rx="3" ry="4" fill="rgba(0,0,0,0.85)" />
            <path d="M30 56 Q38 50 46 56" stroke="rgba(0,0,0,0.7)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(4 -2) rotate(14 62 50)">
            <path d="M46 30 Q62 22 78 30 L76 56 Q62 70 48 56 Z" fill="#FFD23F" />
            <ellipse cx="56" cy="42" rx="3" ry="4" fill="rgba(0,0,0,0.85)" /><ellipse cx="68" cy="42" rx="3" ry="4" fill="rgba(0,0,0,0.85)" />
            <path d="M54 58 Q62 64 70 58" stroke="rgba(0,0,0,0.7)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        </g>
      );
    case "longueur-onde":
      return (
        <g>
          <path d="M14 70 A 36 36 0 0 1 86 70" fill="none" stroke={lite} strokeWidth={SW + 1} />
          <path d="M14 70 A 36 36 0 0 1 38 36" fill="none" stroke="#FF6B5B" strokeWidth={SW + 1} />
          <path d="M38 36 A 36 36 0 0 1 62 36" fill="none" stroke="#FFD23F" strokeWidth={SW + 1} />
          <path d="M62 36 A 36 36 0 0 1 86 70" fill="none" stroke="#3DDC97" strokeWidth={SW + 1} />
          <line x1="50" y1="70" x2="60" y2="38" stroke={lite} strokeWidth={SW + 2} strokeLinecap="round" />
          <circle cx="50" cy="70" r="4" fill={lite} />
        </g>
      );
    case "guess-word":
      return (
        <g>
          <rect x="20" y="22" width="60" height="38" rx="8" fill={lite} />
          <path d="M40 60 L50 72 L60 60 Z" fill={lite} />
          <text x="50" y="48" fontFamily={DISP} fontWeight="900" fontSize="22" textAnchor="middle" fill="#000">?!?</text>
        </g>
      );
    case "category-chrono":
      return (
        <g>
          <rect x="38" y="20" width="24" height="6" rx="2" fill={lite} />
          <circle cx="50" cy="58" r="26" fill="rgba(255,255,255,0.20)" stroke={lite} strokeWidth={SW} />
          <path d="M50 38 V58 L66 66" stroke={lite} strokeWidth={SW + 1.6} strokeLinecap="round" fill="none" />
          <circle cx="50" cy="58" r="3" fill="#FFD23F" />
        </g>
      );
    case "make-guess":
      return (
        <g>
          <rect x="14" y="22" width="44" height="32" rx="6" fill={lite} />
          <path d="M28 54 L36 64 L42 54 Z" fill={lite} />
          <rect x="42" y="44" width="44" height="32" rx="6" fill="#FFD23F" />
          <path d="M60 76 L68 86 L74 76 Z" fill="#FFD23F" />
          <text x="36" y="42" fontFamily={DISP} fontWeight="900" fontSize="18" textAnchor="middle" fill="#000">?</text>
          <text x="64" y="64" fontFamily={DISP} fontWeight="900" fontSize="18" textAnchor="middle" fill="#000">!</text>
        </g>
      );
    case "motion-tennis":
      return (
        <g>
          <g transform="rotate(-22 50 50)">
            <ellipse cx="40" cy="36" rx="14" ry="20" fill="none" stroke={lite} strokeWidth={SW + 1} />
            <line x1="40" y1="56" x2="62" y2="86" stroke={lite} strokeWidth={SW + 2} strokeLinecap="round" />
            <line x1="26" y1="36" x2="54" y2="36" stroke={lite} strokeWidth="1" strokeOpacity="0.6" />
            <line x1="40" y1="22" x2="40" y2="52" stroke={lite} strokeWidth="1" strokeOpacity="0.6" />
          </g>
          <circle cx="76" cy="22" r="9" fill="#FFD23F" />
          <path d="M70 18 Q76 24 82 18 M70 28 Q76 22 82 28" stroke="rgba(0,0,0,0.4)" strokeWidth="1" fill="none" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="50" cy="52" r="28" fill="rgba(255,255,255,0.15)" />
          <text x="50" y="66" fontSize="40" textAnchor="middle">🎲</text>
        </g>
      );
  }
}

const GAME_PATTERN: Record<string, Pattern> = {
  "bomb-party": "blob", "word-chain": "dots",
  "speed-quiz": "tri", "roast-quiz": "blob",
  "reaction-time": "dots", "tap-rush": "wave", "split-second": "grid", "king-hill": "tri",
  "loup-garou": "stars", "undercover": "diag", "infiltre": "dots", "la-taupe": "dots", "black-market": "diag",
  "code-names": "grid", "enchere": "diag", "roulette": "dots", "chess": "grid", "battleship": "wave",
  "uno": "cards", "poker": "cards", "huit-americain": "cards", "president": "stars", "contree": "cards",
  "blind-control": "grid", "block-runner": "grid", "top-ten": "blob", "le-bluffeur": "stars", "longueur-onde": "wave",
  "guess-word": "blob", "category-chrono": "dots", "make-guess": "blob",
  "motion-tennis": "wave",
};

export function GameArt({ game, rounded = 18, style = {} }: { game: { id: string; category: string }; rounded?: number; style?: React.CSSProperties }) {
  const pat = GAME_PATTERN[game.id] || "dots";
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: rounded, overflow: "hidden", ...style }}>
      <GameBackdrop cat={game.category} pattern={pat} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <GameIcon id={game.id} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.18) 100%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
