/**
 * PlayingCard — shared card component.
 * Renders a real playing card using SVG art from /public/cards/ with French
 * notation (A, 7-10, V, D, R · ♠♥♦♣) overlaid in the corner indices.
 *
 * Sizes:
 *   xs / sm / md / lg / xl
 * Variants:
 *   faceDown, dim (greyed out), raised (extra shadow)
 */
"use client";

import { cn } from "@/lib/utils";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "V" | "D" | "R";
export type CardValue = { value: Rank; suit: Suit };

const RANK_TO_FILE: Record<Rank, number> = {
  A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, V: 11, D: 12, R: 13,
};
const SUIT_TO_FILE: Record<Suit, string> = {
  "♠": "s", "♥": "h", "♦": "d", "♣": "c",
};

const SIZES = {
  xs: { w: 32, h: 46, fs: 8,  pad: 3 },
  sm: { w: 44, h: 62, fs: 10, pad: 4 },
  md: { w: 56, h: 80, fs: 12, pad: 4 },
  lg: { w: 78, h: 110, fs: 15, pad: 5 },
  xl: { w: 98, h: 140, fs: 18, pad: 6 },
} as const;

export type CardSize = keyof typeof SIZES;

interface PlayingCardProps {
  value?: Rank;
  suit?: Suit;
  size?: CardSize;
  faceDown?: boolean;
  dim?: boolean;
  raised?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function PlayingCard({
  value, suit,
  size = "md",
  faceDown = false,
  dim = false,
  raised = false,
  className,
  style,
  onClick,
}: PlayingCardProps) {
  const s = SIZES[size];
  const isRed = suit === "♥" || suit === "♦";
  const ink = isRed ? "#E23434" : "#0A0A0A";

  const wrapperStyle: React.CSSProperties = {
    width: s.w,
    height: s.h,
    borderRadius: 7,
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
    opacity: dim ? 0.4 : 1,
    cursor: onClick ? "pointer" : undefined,
    transition: "transform 200ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 200ms",
    ...style,
  };

  if (faceDown) {
    return (
      <div
        className={cn("select-none", className)}
        style={{
          ...wrapperStyle,
          background: "linear-gradient(135deg, #1F2A55 0%, #0C1330 100%)",
          boxShadow: raised
            ? "0 6px 14px rgba(0,0,0,0.25)"
            : "0 2px 6px rgba(0,0,0,0.18)",
          border: "1px solid rgba(0,0,0,0.2)",
        }}
        onClick={onClick}
      >
        <div
          style={{
            position: "absolute", inset: 4, borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.14)",
            background: `
              repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 6px),
              repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 6px)`,
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.2)",
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: s.w * 0.42,
            letterSpacing: "-0.05em",
          }}
        >
          cb
        </div>
      </div>
    );
  }

  if (!value || !suit) return null;

  const rankNum = RANK_TO_FILE[value];
  const suitChar = SUIT_TO_FILE[suit];
  const svgPath = rankNum && suitChar ? `/cards/${rankNum}${suitChar}.svg` : null;

  return (
    <div
      className={cn("select-none", className)}
      style={{
        ...wrapperStyle,
        background: "#FAFAF9",
        boxShadow: raised
          ? "0 6px 14px rgba(0,0,0,0.18)"
          : "0 2px 6px rgba(0,0,0,0.14)",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
      onClick={onClick}
    >
      {svgPath && (
        <img
          src={svgPath}
          alt=""
          style={{
            position: "absolute",
            top: "14%", left: "16%", width: "68%", height: "72%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 1,
          }}
          draggable={false}
        />
      )}
      {/* Top-left index */}
      <div
        style={{
          position: "absolute", top: s.pad, left: s.pad,
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: s.fs,
          color: ink,
          lineHeight: 0.95,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        <span>{value}</span>
        <span style={{ fontSize: s.fs * 0.85 }}>{suit}</span>
      </div>
      {/* Bottom-right index (rotated) */}
      <div
        style={{
          position: "absolute", bottom: s.pad, right: s.pad,
          transform: "rotate(180deg)",
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: s.fs,
          color: ink,
          lineHeight: 0.95,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        <span>{value}</span>
        <span style={{ fontSize: s.fs * 0.85 }}>{suit}</span>
      </div>
    </div>
  );
}
