"use client";

/**
 * card-kit — Moteur de rendu des jeux de carte (table feutrée landscape).
 * Porté du prototype designer (card-engine.jsx) en TSX typé.
 * Fournit : PlayingCard (cartes illustrées R/D/V en SVG), CardBack, TableBg,
 * SeatAvatar et FanHand. Réutilisé par Président, Contrée et 8 Américain.
 */

import type { CSSProperties, ReactNode } from "react";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "V" | "D" | "R";
export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

export const CARD_SIZES: Record<CardSize, { w: number; h: number; rank: number; pip: number; corner: number }> = {
  xs: { w: 38, h: 53, rank: 9, pip: 10, corner: 4 },
  sm: { w: 48, h: 67, rank: 12, pip: 13, corner: 5 },
  md: { w: 60, h: 84, rank: 14, pip: 16, corner: 5 },
  lg: { w: 74, h: 104, rank: 17, pip: 20, corner: 6 },
  xl: { w: 96, h: 134, rank: 22, pip: 26, corner: 7 },
};

export const SUIT_RED = (s: string) => s === "♥" || s === "♦";
export const SUIT_COLOR = (s: string) => (SUIT_RED(s) ? "#D11C2D" : "#0A0A0A");
const SUIT_GLYPH: Record<string, string> = { "♠": "♠", "♥": "♥", "♦": "♦", "♣": "♣" };

export const SEAT_PALETTE = [
  "#5BA3FF", "#FF6A3D", "#7E66FF", "#22C55E", "#E63CA0", "#E89A2B", "#00B3A6", "#E23434",
];

// Pip layouts for ranks 2–10 — [col 0..2, row 0..6]
const PIPS: Record<string, [number, number][]> = {
  "1": [[1, 3]],
  "2": [[1, 1], [1, 5]],
  "3": [[1, 1], [1, 3], [1, 5]],
  "4": [[0, 1], [2, 1], [0, 5], [2, 5]],
  "5": [[0, 1], [2, 1], [1, 3], [0, 5], [2, 5]],
  "6": [[0, 1], [2, 1], [0, 3], [2, 3], [0, 5], [2, 5]],
  "7": [[0, 1], [2, 1], [1, 2], [0, 3], [2, 3], [0, 5], [2, 5]],
  "8": [[0, 1], [2, 1], [1, 2], [0, 3], [2, 3], [1, 4], [0, 5], [2, 5]],
  "9": [[0, 1], [2, 1], [0, 2.3], [2, 2.3], [1, 3], [0, 3.7], [2, 3.7], [0, 5], [2, 5]],
  "10": [[0, 1], [2, 1], [1, 1.7], [0, 2.5], [2, 2.5], [0, 3.5], [2, 3.5], [1, 4.3], [0, 5], [2, 5]],
};

const FACE_LABELS = ["V", "D", "R", "J", "Q", "K"];

interface PlayingCardProps {
  rank?: Rank | string;
  suit?: Suit;
  size?: CardSize;
  faceDown?: boolean;
  dim?: boolean;
  raised?: boolean;
  selected?: boolean;
  playable?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

export function PlayingCard({
  rank = "1",
  suit = "♠",
  size = "md",
  faceDown = false,
  dim = false,
  raised = false,
  selected = false,
  playable = false,
  style = {},
  onClick,
}: PlayingCardProps) {
  const d = CARD_SIZES[size] || CARD_SIZES.md;
  const color = SUIT_COLOR(suit);

  // Normalize rank → FR notation (1/V/D/R)
  let label = String(rank);
  if (rank === "A" || rank === "1") label = "1";
  else if (rank === "J" || rank === "V") label = "V";
  else if (rank === "Q" || rank === "D") label = "D";
  else if (rank === "K" || rank === "R") label = "R";

  const isFace = FACE_LABELS.includes(label);
  const isAce = label === "1";

  const shadow = raised
    ? "0 10px 22px rgba(0,0,0,0.45), 0 2px 0 rgba(0,0,0,0.06) inset"
    : "0 4px 10px rgba(0,0,0,0.25), 0 1px 0 rgba(0,0,0,0.04) inset";
  const ring = selected
    ? "0 0 0 3px var(--cb-brand, #7A4EE8), 0 14px 28px rgba(122, 78, 232, 0.55)"
    : playable
    ? "0 0 0 1.5px rgba(255,255,255,0.85), 0 10px 22px rgba(0,0,0,0.4)"
    : null;

  if (faceDown) {
    return (
      <div
        onClick={onClick}
        style={{
          width: d.w, height: d.h,
          borderRadius: Math.max(4, d.w * 0.08),
          background: "repeating-linear-gradient(45deg, #1a3b8e 0 6px, #16357d 6px 12px)",
          boxShadow: ring || shadow,
          border: "1.5px solid rgba(255,255,255,0.12)",
          position: "relative", overflow: "hidden",
          opacity: dim ? 0.55 : 1,
          ...style,
        }}
      >
        <div style={{
          position: "absolute", inset: 4,
          borderRadius: Math.max(2, d.w * 0.06),
          border: "1px solid rgba(255,255,255,0.22)",
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), transparent 60%)",
        }} />
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          color: "rgba(255,255,255,0.55)",
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: d.w * 0.34, letterSpacing: "-0.05em",
        }}>♣♥♠♦</div>
      </div>
    );
  }

  const corner = (rotated: boolean) => (
    <div style={{
      position: "absolute",
      ...(rotated ? { bottom: d.corner, right: d.corner + 1 } : { top: d.corner, left: d.corner + 1 }),
      textAlign: "center", lineHeight: 1,
      fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900, color,
      transform: rotated ? "rotate(180deg)" : undefined,
    }}>
      <div style={{ fontSize: d.rank, letterSpacing: "-0.05em" }}>{label}</div>
      <div style={{ fontSize: d.rank * 0.78, marginTop: 1 }}>{SUIT_GLYPH[suit]}</div>
    </div>
  );

  return (
    <div
      onClick={onClick}
      style={{
        width: d.w, height: d.h,
        borderRadius: Math.max(4, d.w * 0.085),
        background: "linear-gradient(180deg, #FDFDFB 0%, #F1EEE5 100%)",
        boxShadow: ring || shadow,
        border: "1px solid rgba(0,0,0,0.08)",
        position: "relative", overflow: "hidden",
        opacity: dim ? 0.45 : 1,
        transition: "transform 180ms cubic-bezier(0.22, 1, 0.36, 1), filter 160ms",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {corner(false)}
      {corner(true)}
      {isFace ? <FaceCenter label={label} suit={suit} d={d} />
        : isAce ? <AceCenter suit={suit} d={d} />
        : <PipCenter rank={label} suit={suit} d={d} />}
    </div>
  );
}

type Dim = (typeof CARD_SIZES)[CardSize];

function PipCenter({ rank, suit, d }: { rank: string; suit: Suit; d: Dim }) {
  const layout = PIPS[rank] || [];
  const color = SUIT_COLOR(suit);
  const padX = d.w * 0.18;
  const padY = d.h * 0.16;
  return (
    <div style={{ position: "absolute", left: padX, top: padY, width: d.w - padX * 2, height: d.h - padY * 2 }}>
      {layout.map(([col, row], i) => {
        const flip = row > 3;
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${(col / 2) * 100}%`, top: `${(row / 6) * 100}%`,
            transform: `translate(-50%, -50%) scaleY(${flip ? -1 : 1})`,
            color, fontFamily: "Georgia, serif", fontWeight: 700,
            fontSize: d.pip, lineHeight: 1,
          }}>{SUIT_GLYPH[suit]}</div>
        );
      })}
    </div>
  );
}

function AceCenter({ suit, d }: { suit: Suit; d: Dim }) {
  const color = SUIT_COLOR(suit);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: d.w * 0.6, height: d.w * 0.6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: SUIT_RED(suit)
            ? "radial-gradient(circle, rgba(209,28,45,0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(0,0,0,0.07) 0%, transparent 70%)",
        }} />
        <span style={{
          fontFamily: "Georgia, serif", fontSize: d.w * 0.58, color, lineHeight: 1,
          textShadow: SUIT_RED(suit) ? "0 1px 0 rgba(0,0,0,0.05)" : "0 1px 0 rgba(255,255,255,0.4)",
        }}>{SUIT_GLYPH[suit]}</span>
      </div>
    </div>
  );
}

// Illustrated portrait (R/D/V) — vintage chromolithography style.
function FaceCenter({ label, suit, d }: { label: string; suit: Suit; d: Dim }) {
  const red = SUIT_RED(suit);
  const kind = label === "R" ? "R" : label === "D" ? "D" : "V";
  const robeMain = red ? "#C42030" : "#1E3068";
  const robeDeep = red ? "#7B121F" : "#0E1B40";
  const gold = "#C99B30";
  const goldDeep = "#8A6418";
  const skin = "#F1CFA8";
  const skinShade = "#C99772";
  const hair = kind === "D" ? "#3D2410" : "#1E1108";
  const eye = "#181020";
  const blush = "#D26352";
  const accent = red ? "#1E3068" : "#C42030";

  return (
    <svg viewBox="0 0 50 70" preserveAspectRatio="xMidYMid meet" style={{
      position: "absolute", left: d.w * 0.13, top: d.h * 0.10,
      width: d.w * 0.74, height: d.h * 0.80, overflow: "visible",
    }} aria-hidden>
      <rect x="1.2" y="1.2" width="47.6" height="67.6" rx="2" fill="none" stroke={goldDeep} strokeWidth="0.35" opacity="0.45" />
      <rect x="2.4" y="2.4" width="45.2" height="65.2" rx="1.4" fill="none" stroke={gold} strokeWidth="0.25" opacity="0.6" />
      {([[3, 3], [47, 3], [3, 67], [47, 67]] as [number, number][]).map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`} opacity="0.5">
          <circle r="0.9" fill={gold} /><circle r="0.35" fill={goldDeep} />
        </g>
      ))}
      <path d="M3,70 L3,52 Q6,48 12,46 L20,52 Q25,55 30,52 L38,46 Q44,48 47,52 L47,70 Z" fill={robeMain} />
      <path d="M3,70 L3,52 Q6,48 12,46 L14,52 L18,60 L12,70 Z" fill={robeDeep} opacity="0.5" />
      <path d="M47,70 L47,52 Q44,48 38,46 L36,52 L32,60 L38,70 Z" fill={robeDeep} opacity="0.5" />
      <path d="M15,46 Q25,42 35,46 L34,48 Q25,44 16,48 Z" fill={gold} />
      <g transform="translate(25, 56)">
        <circle r="3.4" fill={gold} stroke={goldDeep} strokeWidth="0.4" />
        <text x="0" y="1.6" textAnchor="middle" fontFamily="Georgia, serif" fontSize="5" fill={SUIT_COLOR(suit)}>{SUIT_GLYPH[suit]}</text>
      </g>
      <path d="M22,40 L22,46 Q25,47.5 28,46 L28,40 Z" fill={skin} />
      <ellipse cx="25" cy="32" rx="8.5" ry="10.5" fill={skin} />
      <ellipse cx="20.5" cy="35" rx="1.4" ry="0.9" fill={blush} opacity="0.5" />
      <ellipse cx="29.5" cy="35" rx="1.4" ry="0.9" fill={blush} opacity="0.5" />
      <path d="M29,25 Q33,28 33,35 Q33,40 28,42 L28,38 Q31,35 30,29 Z" fill={skinShade} opacity="0.35" />
      {kind === "R" && (
        <>
          <path d="M16,30 Q15,40 18,46 L21,43 Q19.5,37 19,30 Z" fill={hair} />
          <path d="M34,30 Q35,40 32,46 L29,43 Q30.5,37 31,30 Z" fill={hair} />
          <path d="M18,37 Q15,42 16,47 Q18,51 22,52 Q25,52.5 28,52 Q32,51 34,47 Q35,42 32,37 Q30,42 25,42.5 Q20,42 18,37 Z" fill={hair} />
          <path d="M19,37 Q22,40 25,39 Q28,40 31,37 Q28,38.5 25,38.5 Q22,38.5 19,37 Z" fill={hair} />
        </>
      )}
      {kind === "D" && (
        <>
          <path d="M14,28 Q11,40 13,52 Q16,50 17,42 Q18,36 19,30 Z" fill={hair} />
          <path d="M36,28 Q39,40 37,52 Q34,50 33,42 Q32,36 31,30 Z" fill={hair} />
          <path d="M16.5,28 Q17,24 25,23 Q33,24 33.5,28 L32,27 Q28,25 25,25 Q22,25 18,27 Z" fill={hair} />
          <circle cx="16" cy="36" r="0.6" fill={gold} /><circle cx="34" cy="36" r="0.6" fill={gold} />
        </>
      )}
      {kind === "V" && (
        <>
          <path d="M15,26 Q13,34 16,42 L20,40 Q18,34 18,28 Z" fill={hair} />
          <path d="M35,26 Q37,34 34,42 L30,40 Q32,34 32,28 Z" fill={hair} />
          <path d="M18,27 Q22,26 25,26.5 Q28,26 32,27 L31,28.5 Q28,28 25,28 Q22,28 19,28.5 Z" fill={hair} />
        </>
      )}
      <ellipse cx="21.5" cy="32.5" rx="0.8" ry="1" fill={eye} />
      <ellipse cx="28.5" cy="32.5" rx="0.8" ry="1" fill={eye} />
      <circle cx="21.7" cy="32.2" r="0.2" fill="#fff" /><circle cx="28.7" cy="32.2" r="0.2" fill="#fff" />
      <path d="M19.5,30 Q21.5,29 23,30" stroke={hair} strokeWidth="0.5" fill="none" strokeLinecap="round" />
      <path d="M27,30 Q28.5,29 30.5,30" stroke={hair} strokeWidth="0.5" fill="none" strokeLinecap="round" />
      <path d="M25,33 Q24.5,36 24.2,37 Q25,37.5 25.8,37 Q25.5,36 25,33" fill={skinShade} opacity="0.6" />
      {kind !== "R" && <path d="M23,40 Q25,41.5 27,40" stroke={blush} strokeWidth="0.6" fill="none" strokeLinecap="round" />}
      {kind === "R" && (
        <g>
          <path d="M16,22 L17,12 L20,18 L22,10 L25,18 L28,10 L30,18 L33,12 L34,22 Z" fill={gold} stroke={goldDeep} strokeWidth="0.4" />
          <rect x="15.5" y="21" width="19" height="2.5" fill={gold} stroke={goldDeep} strokeWidth="0.4" />
          <circle cx="22" cy="11" r="0.9" fill={accent} /><circle cx="25" cy="17.5" r="1" fill={accent} /><circle cx="28" cy="11" r="0.9" fill={accent} />
        </g>
      )}
      {kind === "D" && (
        <g>
          <path d="M17.5,24 L19,18 L22,22 L25,16 L28,22 L31,18 L32.5,24 Z" fill={gold} stroke={goldDeep} strokeWidth="0.35" />
          <rect x="17.2" y="23" width="15.6" height="1.6" fill={gold} stroke={goldDeep} strokeWidth="0.35" />
          <circle cx="22" cy="20.5" r="0.7" fill={accent} /><circle cx="25" cy="17.5" r="0.85" fill={accent} /><circle cx="28" cy="20.5" r="0.7" fill={accent} />
        </g>
      )}
      {kind === "V" && (
        <g>
          <path d="M16,26 Q15,22 19,20 Q22,18.5 25,18.5 Q30,18.5 32,21 Q35,23 34,26 Z" fill={accent} stroke={goldDeep} strokeWidth="0.3" />
          <path d="M16,26 L34,26" stroke={gold} strokeWidth="0.7" />
          <path d="M30,22 Q34,17 36,11 Q35,17 33,21 Q34,18 35,15 Q33,20 31,23 Z" fill={gold} stroke={goldDeep} strokeWidth="0.25" />
          <circle cx="22" cy="22" r="0.8" fill={gold} stroke={goldDeep} strokeWidth="0.2" />
        </g>
      )}
      <g transform="translate(25, 68)">
        <rect x="-5" y="-2.4" width="10" height="3.4" rx="0.6" fill="#F8F1DB" stroke={goldDeep} strokeWidth="0.25" />
        <text x="0" y="0.6" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="900" fontSize="3.2" fill={SUIT_COLOR(suit)}>{label}</text>
      </g>
    </svg>
  );
}

// ───────────────────────── TableBg ─────────────────────────
export function TableBg({ children, tone = "navy" }: { children?: ReactNode; tone?: "navy" | "green" | "plum" }) {
  const tones = {
    navy: { bg0: "#0B1437", bg1: "#050A20" },
    green: { bg0: "#0F3D26", bg1: "#06200F" },
    plum: { bg0: "#241040", bg1: "#100620" },
  };
  const t = tones[tone] || tones.navy;
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(140% 90% at 50% 35%, ${t.bg0} 0%, ${t.bg1} 100%)`, overflow: "hidden" }}>
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(70% 50% at 50% 45%, rgba(80,140,255,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {children}
    </div>
  );
}

// ───────────────────────── SeatAvatar ─────────────────────────
export function SeatAvatar({
  name = "P", hue = 0, isBot = true, isTurn = false, isDealer = false,
  cardCount = null, team = null, hint = null, size = 44, emoji = null,
}: {
  name?: string; hue?: number; isBot?: boolean; isTurn?: boolean; isDealer?: boolean;
  cardCount?: number | null; team?: "us" | "them" | null; hint?: ReactNode; size?: number; emoji?: string | null;
}) {
  const color = SEAT_PALETTE[hue % SEAT_PALETTE.length];
  return (
    <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ position: "relative" }}>
        {isTurn && (
          <span aria-hidden style={{ position: "absolute", inset: -6, borderRadius: "50%", background: `radial-gradient(circle, ${color}66, transparent 70%)`, animation: "pulseRing 1.4s ease-in-out infinite" }} />
        )}
        <div style={{
          position: "relative", width: size, height: size, borderRadius: "50%",
          background: `linear-gradient(160deg, ${color}, ${color}cc)`,
          border: isTurn ? "2.5px solid #fff" : "2px solid rgba(255,255,255,0.22)",
          boxShadow: isTurn ? `0 0 0 3px ${color}66, 0 0 20px ${color}aa, 0 4px 12px rgba(0,0,0,0.4)` : "0 4px 10px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          {emoji ? <span style={{ fontSize: size * 0.5 }}>{emoji}</span>
            : isBot ? <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "#fff", fontSize: size * 0.32, letterSpacing: "-0.03em", textShadow: "0 1px 1px rgba(0,0,0,0.3)" }}>AI</span>
            : <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "#fff", fontSize: size * 0.32 }}>{name.slice(0, 2).toUpperCase()}</span>}
        </div>
        {isDealer && (
          <span style={{
            position: "absolute", left: -10, top: -2, width: 22, height: 22, borderRadius: "50%",
            background: "radial-gradient(circle, #fff 40%, #C12121 41%)", border: "1.5px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 10, color: "#C12121", boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
          }}>D</span>
        )}
        {cardCount !== null && (
          <span style={{
            position: "absolute", right: -4, bottom: -4, minWidth: 18, height: 18, padding: "0 5px",
            display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9,
            background: "#0A1230", border: "1.5px solid rgba(255,255,255,0.28)",
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 9, color: "#fff",
          }}>{cardCount}</span>
        )}
      </div>
      <div style={{
        marginTop: 2, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, color: "#fff",
        letterSpacing: "-0.01em", textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", gap: 4, maxWidth: 90, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {team && <span style={{ width: 6, height: 6, borderRadius: "50%", background: team === "us" ? "#5BA3FF" : "#E23434" }} />}
        {name}
      </div>
      {hint && <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 10, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 3 }}>{hint}</div>}
    </div>
  );
}

// ───────────────────────── Fan hand ─────────────────────────
export function FanHand({
  hand, onClickIndex, isLegal = () => true, selectedSet = null,
  cardSize = "md", maxWidth = 600, disabled = false,
}: {
  hand: { rank: Rank | string; suit: Suit }[];
  onClickIndex?: (i: number) => void;
  isLegal?: (c: { rank: Rank | string; suit: Suit }) => boolean;
  selectedSet?: Set<number> | null;
  cardSize?: CardSize;
  maxWidth?: number;
  disabled?: boolean;
}) {
  const n = hand.length;
  const d = CARD_SIZES[cardSize];
  const mid = (n - 1) / 2;
  const spacing = Math.min(d.w * 0.72, (maxWidth - d.w) / Math.max(1, n - 1));
  return (
    <div style={{ position: "relative", width: "100%", height: d.h + 28, pointerEvents: n > 0 ? "auto" : "none" }}>
      {hand.map((c, i) => {
        const offset = i - mid;
        const rot = offset * Math.min(3.5, 14 / Math.max(1, n - 1));
        const x = offset * spacing;
        const y = Math.abs(offset) * 1.8;
        const playable = !disabled && isLegal(c);
        const isSel = !!selectedSet && selectedSet.has(i);
        return (
          <button
            key={`${c.rank}${c.suit}-${i}`}
            onClick={() => onClickIndex && onClickIndex(i)}
            style={{
              position: "absolute", left: "50%", bottom: 0,
              transform: `translateX(${x - d.w / 2}px) translateY(${-y - (isSel ? 16 : 0)}px) rotate(${rot}deg)`,
              transformOrigin: `center ${d.h + 60}px`,
              zIndex: isSel ? 200 + i : i,
              background: "transparent", border: 0, padding: 0,
              cursor: playable ? "pointer" : "default",
              transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
              filter: playable || isSel ? "none" : "saturate(0.45) brightness(0.7)",
            }}
            aria-label={`${c.rank} de ${c.suit}`}
          >
            <PlayingCard rank={c.rank} suit={c.suit} size={cardSize} raised={playable} selected={isSel} playable={playable && !isSel} />
          </button>
        );
      })}
    </div>
  );
}
