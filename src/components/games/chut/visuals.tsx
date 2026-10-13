"use client";

import { useId, type CSSProperties } from "react";
import { MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";

const INK = "#15082E";

export type BlobState = "calm" | "strain" | "burst";

/**
 * Le blob de « Chut ! » (dans l'esprit des Mascot, en SVG) :
 * - calm   : doigt sur la bouche, chut ;
 * - strain : retient son rire, les joues gonflent avec `level` (0..1), il tremble et rougit ;
 * - burst  : explose de rire (bouche grande ouverte, larmes, secousses).
 */
export function ChutBlob({ size = 160, color = "yellow", state = "calm", level = 0, style }: {
  size?: number;
  color?: MascotColor;
  state?: BlobState;
  level?: number;
  style?: CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const c = MASCOT_PALETTE[color];
  const l = state === "strain" ? Math.max(0, Math.min(1, level)) : 0;
  const squeeze = l > 0.45;
  const cheek = 13 + l * 17;
  const sx = 1 + l * 0.12;
  const sy = 1 - l * 0.06;
  const shake = state === "burst" ? "chut-rofl 0.42s ease-in-out infinite" : l > 0.15 ? `chut-shiver ${(0.22 - l * 0.12).toFixed(2)}s linear infinite` : "chut-breathe 3s ease-in-out infinite";
  return (
    <div style={{ width: size, height: size, position: "relative", ...style }} aria-hidden>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible", animation: shake, transformOrigin: "50% 85%" }}>
        <defs>
          <radialGradient id={`b${id}`} cx="0.34" cy="0.3" r="0.8">
            <stop offset="0" stopColor={c.hi} />
            <stop offset="0.42" stopColor={c.body} />
            <stop offset="1" stopColor={c.deep} />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="190" rx="62" ry="7" fill="rgba(0,0,0,0.3)" />
        <g style={{ transform: `scale(${sx}, ${sy})`, transformOrigin: "100px 185px", transition: "transform 120ms" }}>
          {/* corps */}
          <path d="M100 22 C152 22 184 62 184 112 C184 160 150 186 100 186 C50 186 16 160 16 112 C16 62 48 22 100 22 Z" fill={`url(#b${id})`} />
          <ellipse cx="66" cy="56" rx="22" ry="13" fill="rgba(255,255,255,0.5)" transform="rotate(-22 66 56)" />
          {/* rougeur qui monte */}
          {l > 0 && <path d="M100 22 C152 22 184 62 184 112 C184 160 150 186 100 186 C50 186 16 160 16 112 C16 62 48 22 100 22 Z" fill="#FF3E6C" opacity={l * 0.35} />}

          {/* yeux */}
          {state === "burst" ? (
            <>
              <path d="M56 78 L80 90 L56 102" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M144 78 L120 90 L144 102" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : squeeze ? (
            <>
              <path d="M54 92 Q68 78 82 92" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
              <path d="M118 92 Q132 78 146 92" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
              <path d="M52 70 L80 78" stroke={INK} strokeWidth="5" strokeLinecap="round" />
              <path d="M148 70 L120 78" stroke={INK} strokeWidth="5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="70" cy="88" r="17" fill="#fff" />
              <circle cx="130" cy="88" r="17" fill="#fff" />
              <circle cx={state === "calm" ? 74 : 70} cy={state === "calm" ? 90 : 92} r="9" fill={INK} />
              <circle cx={state === "calm" ? 134 : 130} cy={state === "calm" ? 90 : 92} r="9" fill={INK} />
              <circle cx="76" cy="83" r="3.5" fill="#fff" />
              <circle cx="136" cy="83" r="3.5" fill="#fff" />
            </>
          )}

          {/* joues gonflées */}
          {state === "strain" && (
            <>
              <circle cx={44 - l * 6} cy="128" r={cheek} fill="#FF8FB8" opacity="0.85" />
              <circle cx={156 + l * 6} cy="128" r={cheek} fill="#FF8FB8" opacity="0.85" />
            </>
          )}

          {/* bouche */}
          {state === "burst" ? (
            <g>
              <path d="M60 118 Q100 116 140 118 Q138 172 100 172 Q62 172 60 118 Z" fill={INK} />
              <path d="M74 152 Q100 136 126 152 Q118 168 100 168 Q82 168 74 152 Z" fill="#FF5C8A" />
              <path d="M66 120 L134 120 L132 130 L68 130 Z" fill="#fff" />
            </g>
          ) : state === "strain" ? (
            <path d={`M78 ${136 + l * 2} q6 -6 11 0 q6 6 11 0 q6 -6 11 0 q6 6 11 0`} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M84 138 Q100 134 116 138" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          )}

          {/* doigt sur la bouche (« chut ») */}
          {state === "calm" && (
            <g>
              <rect x="91" y="104" width="20" height="62" rx="10" fill={c.hi} stroke={c.deep} strokeWidth="3" />
              <path d="M95 112 Q101 108 107 112" fill="none" stroke={c.deep} strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* sueur */}
          {state === "strain" && l > 0.55 && <path d="M160 52 Q170 70 160 76 Q150 70 160 52 Z" fill="#87DEFF" stroke="#4ECDC4" strokeWidth="2" style={{ animation: "chut-drip 1s ease-in infinite" }} />}
        </g>

        {/* larmes de rire */}
        {state === "burst" && (
          <>
            <path d="M38 92 Q22 98 26 110 Q38 108 38 92 Z" fill="#87DEFF" style={{ animation: "chut-tear-l 0.6s ease-out infinite" }} />
            <path d="M162 92 Q178 98 174 110 Q162 108 162 92 Z" fill="#87DEFF" style={{ animation: "chut-tear-r 0.6s ease-out infinite" }} />
          </>
        )}
      </svg>
      <style>{BLOB_KEYFRAMES}</style>
    </div>
  );
}

const BLOB_KEYFRAMES = `
@keyframes chut-breathe { 0%,100% { transform: scale(1,1); } 50% { transform: scale(1.03,0.97); } }
@keyframes chut-shiver { 0% { transform: translate(0,0); } 25% { transform: translate(-1.5px,1px) rotate(-0.8deg); } 50% { transform: translate(1.5px,-1px); } 75% { transform: translate(-1px,-1px) rotate(0.8deg); } 100% { transform: translate(0,0); } }
@keyframes chut-rofl { 0%,100% { transform: rotate(-9deg) scale(1.04,0.96); } 50% { transform: rotate(9deg) scale(0.96,1.05) translateY(-6px); } }
@keyframes chut-drip { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(26px); opacity: 0; } }
@keyframes chut-tear-l { 0% { transform: translate(0,0); opacity: 1; } 100% { transform: translate(-22px,-14px); opacity: 0; } }
@keyframes chut-tear-r { 0% { transform: translate(0,0); opacity: 1; } 100% { transform: translate(22px,-14px); opacity: 0; } }
`;

/**
 * Bruitomètre : cadran demi-cercle, aiguille qui tremble, seuil « Crac » aux 3/4.
 * `value` 0..1 ; `paused` = micro en pause (aiguille couchée, cadran grisé).
 */
export function NoiseMeter({ value, paused = false, width = 300, crackLabel, label }: {
  value: number;
  paused?: boolean;
  width?: number;
  crackLabel: string;
  label?: string;
}) {
  const v = paused ? 0 : Math.max(0, Math.min(1, value));
  // tremblement de l'aiguille proportionnel au niveau
  const angle = -90 + v * 180;
  const arc = (from: number, to: number) => {
    const p = (t: number) => {
      const a = Math.PI * (1 - t);
      return [150 + 120 * Math.cos(a), 150 - 120 * Math.sin(a)];
    };
    const [x1, y1] = p(from);
    const [x2, y2] = p(to);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A120 120 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const tick = (() => {
    const a = Math.PI * (1 - 0.75);
    return { x1: 150 + 96 * Math.cos(a), y1: 150 - 96 * Math.sin(a), x2: 150 + 146 * Math.cos(a), y2: 150 - 146 * Math.sin(a), tx: 150 + 162 * Math.cos(a), ty: 150 - 162 * Math.sin(a) };
  })();
  return (
    <div style={{ width, maxWidth: "100%", opacity: paused ? 0.55 : 1, transition: "opacity 200ms" }} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <svg viewBox="-12 -10 324 176" width="100%" style={{ overflow: "visible", display: "block" }}>
        <path d={arc(0, 1)} fill="none" stroke={INK} strokeWidth="40" strokeLinecap="round" />
        <path d={arc(0.001, 0.5)} fill="none" stroke="#3DDC97" strokeWidth="30" />
        <path d={arc(0.5, 0.75)} fill="none" stroke="#FFD23F" strokeWidth="30" />
        <path d={arc(0.75, 0.999)} fill="none" stroke="#FF3E6C" strokeWidth="30" />
        <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <text x={tick.tx} y={tick.ty} fill="#fff" stroke={INK} strokeWidth="5" paintOrder="stroke" fontSize="20" fontWeight="700" textAnchor="start" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
          {crackLabel}
        </text>
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "150px 150px", transition: "transform 70ms linear" }}>
          <path d="M150 40 L158 150 L142 150 Z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        </g>
        <circle cx="150" cy="150" r="16" fill="#FFD23F" stroke={INK} strokeWidth="4" />
      </svg>
    </div>
  );
}
