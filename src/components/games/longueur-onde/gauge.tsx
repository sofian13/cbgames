"use client";

/**
 * Le cadran du Curseur (mode un seul téléphone) : un demi-cadran façon compteur,
 * dégradé d'un extrême à l'autre, les deux extrêmes écrits en gros aux deux bouts.
 * - cible : une part de camembert en 3 zones chiffrées (4 au centre, puis 3, puis 2) ;
 * - aiguille : le curseur des joueurs, qu'on fait tourner au doigt (onChange).
 */

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { DISPLAY } from "@/components/games/local-kit";
import { GAME_INK } from "@/components/games/game-icon-button";
import { playSfx } from "@/lib/sfx";
import { ZONE_2, ZONE_3, ZONE_4 } from "./pairs";

const INK = GAME_INK;
export const LEFT_COLOR = "#4ECDC4";
export const RIGHT_COLOR = "#FF6B5B";

// Géométrie (unités du viewBox)
const W = 200;
const CX = 100;
const CY = 104;
const R = 92;
const H = 112;

/** Point du cadran pour une valeur 0-100 (0 = tout à gauche) à un rayon donné. */
function pt(v: number, r: number): [number, number] {
  const a = Math.PI * (1 - v / 100);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

/** Part de camembert entre deux valeurs. */
function slice(v1: number, v2: number, r = R): string {
  const a = Math.max(0, Math.min(100, v1));
  const b = Math.max(0, Math.min(100, v2));
  const [x1, y1] = pt(a, r);
  const [x2, y2] = pt(b, r);
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

/** Étiquette d'un extrême : sticker plein, plus petit si le texte est long. */
function EndLabel({ text, side, small }: { text: string; side: "left" | "right"; small?: boolean }) {
  // taille selon la longueur totale ET le mot le plus long (+ la flèche collée)
  const n = text.length;
  const word = Math.max(...text.split(" ").map((w) => w.length)) + (small ? 0 : 2);
  const fs = small
    ? (n > 12 || word > 7 ? 11 : 13)
    : Math.min(n > 18 ? 16 : n > 12 ? 18 : n > 9 ? 20 : 22, word > 12 ? 15 : word > 10 ? 17 : word > 8 ? 19 : 22);
  const style: CSSProperties = {
    ...DISPLAY,
    background: side === "left" ? LEFT_COLOR : RIGHT_COLOR,
    color: INK,
    border: `${small ? 2 : 3}px solid ${INK}`,
    boxShadow: `0 ${small ? 2 : 4}px 0 ${INK}`,
    borderRadius: small ? 12 : 16,
    rotate: side === "left" ? "-2deg" : "2deg",
    fontSize: fs,
    lineHeight: 1.02,
    maxWidth: "48%",
    textAlign: side,
    padding: small ? "3px 6px" : "7px 12px",
  };
  const arrow = !small;
  // Rétrécit le texte tant qu'un mot dépasse (petits écrans, mots longs)
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = fs;
    el.style.fontSize = `${size}px`;
    while (el.scrollWidth > el.clientWidth + 0.5 && size > 11) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
  }, [text, fs]);
  // la flèche reste collée au dernier / premier mot
  return <div ref={ref} style={style}>{arrow && side === "left" ? "←\u00a0" : ""}{text}{arrow && side === "right" ? "\u00a0→" : ""}</div>;
}

export function CursorGauge({
  left, right, target = null, needle = null, onChange, reveal = false, small = false, className,
}: {
  left: string;
  right: string;
  /** Position de la cible (part de camembert) ; null = cachée */
  target?: number | null;
  /** Position du curseur des joueurs ; null = pas d'aiguille */
  needle?: number | null;
  /** Rend le cadran manipulable au doigt */
  onChange?: (v: number) => void;
  /** La cible apparaît avec une petite animation (révélation) */
  reveal?: boolean;
  small?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastTen = useRef<number | null>(null);

  const fromPointer = (clientX: number, clientY: number) => {
    const el = box.current;
    if (!el || !onChange) return;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    const y = ((clientY - r.top) / r.height) * H;
    const dy = Math.max(1, CY - y);
    const a = Math.atan2(dy, x - CX); // 0 (droite) → π (gauche)
    const v = Math.round(Math.max(0, Math.min(100, 100 * (1 - a / Math.PI))));
    const ten = Math.round(v / 10);
    if (lastTen.current !== null && ten !== lastTen.current) playSfx("tick", { volume: 0.22, rate: 0.9 + ten * 0.04 });
    lastTen.current = ten;
    onChange(v);
  };

  const zones = target == null ? [] : [
    { a: target - ZONE_2, b: target - ZONE_3, fill: "#fff", n: 2 },
    { a: target + ZONE_3, b: target + ZONE_2, fill: "#fff", n: 2 },
    { a: target - ZONE_3, b: target - ZONE_4, fill: "#FFD23F", n: 3 },
    { a: target + ZONE_4, b: target + ZONE_3, fill: "#FFD23F", n: 3 },
    { a: target - ZONE_4, b: target + ZONE_4, fill: "#FF3EA5", n: 4 },
  ];

  const [nx, ny] = needle != null ? pt(needle, R * 0.97) : [0, 0];
  const [kx, ky] = needle != null ? pt(needle, R * 0.8) : [0, 0];

  return (
    <div className={`w-full ${className ?? ""}`}>
      <div
        ref={box}
        className={onChange ? "cursor-pointer select-none" : undefined}
        style={{ touchAction: onChange ? "none" : undefined, position: "relative" }}
        onPointerDown={onChange ? (e) => { dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); fromPointer(e.clientX, e.clientY); } : undefined}
        onPointerMove={onChange ? (e) => { if (dragging.current) { e.preventDefault(); fromPointer(e.clientX, e.clientY); } } : undefined}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="cur-face" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#BFF0EC" />
              <stop offset="50%" stopColor="#F4EEFF" />
              <stop offset="100%" stopColor="#FFC9C2" />
            </linearGradient>
            <linearGradient id="cur-rim" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={LEFT_COLOR} />
              <stop offset="50%" stopColor="#B5A1FF" />
              <stop offset="100%" stopColor={RIGHT_COLOR} />
            </linearGradient>
          </defs>
          {/* Ombre dure + cadran */}
          <path d={`M ${CX - R} ${CY + 4} A ${R} ${R} 0 0 1 ${CX + R} ${CY + 4} Z`} fill={INK} />
          <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY} Z`} fill="url(#cur-face)" />
          {/* Graduations */}
          {Array.from({ length: 11 }).map((_, i) => {
            const [x1, y1] = pt(i * 10, R - 2);
            const [x2, y2] = pt(i * 10, R - (i % 5 === 0 ? 13 : 8));
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeOpacity={0.35} strokeWidth={1.4} strokeLinecap="round" />;
          })}
          {/* La cible : 3 zones chiffrées */}
          {target != null && (
            <g className={reveal ? "cur-wedge" : undefined}>
              {zones.map((z, i) => (
                <path key={i} d={slice(z.a, z.b)} fill={z.fill} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
              ))}
              {zones.map((z, i) => {
                const a = Math.max(0, z.a), b = Math.min(100, z.b);
                if (b - a < 4) return null;
                const [x, y] = pt((a + b) / 2, R * 0.78);
                return (
                  <text key={`n${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                    style={{ ...DISPLAY, fontSize: z.n === 4 ? 14 : 11, fill: INK }}>
                    {z.n}
                  </text>
                );
              })}
            </g>
          )}
          {/* Contour coloré (dégradé gauche → droite) */}
          <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} fill="none" stroke="url(#cur-rim)" strokeWidth={7} />
          <path d={`M ${CX - R - 3.5} ${CY} A ${R + 3.5} ${R + 3.5} 0 0 1 ${CX + R + 3.5} ${CY} L ${CX - R - 3.5} ${CY} Z`} fill="none" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          {/* Aiguille = le curseur des joueurs */}
          {needle != null && (
            <g>
              <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
              <circle cx={kx} cy={ky} r={small ? 7 : onChange ? 11 : 8} fill="#FFD23F" stroke={INK} strokeWidth={2.4} />
            </g>
          )}
          <circle cx={CX} cy={CY} r={small ? 5 : 7} fill={INK} />
        </svg>
      </div>
      <div className={`flex items-start justify-between gap-2 ${small ? "mt-2" : "mt-3"}`}>
        <EndLabel text={left} side="left" small={small} />
        <EndLabel text={right} side="right" small={small} />
      </div>
      <style>{`.cur-wedge{transform-box:view-box;transform-origin:${CX}px ${CY}px;animation:cur-wedge .7s cubic-bezier(.2,1.5,.4,1) both}
@keyframes cur-wedge{from{transform:scale(.05) rotate(-40deg);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}
