import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChessPieceColor = "w" | "b";
export type ChessPieceType = "p" | "n" | "b" | "r" | "q" | "k";

interface ChessPieceIconProps {
  color: ChessPieceColor;
  type: ChessPieceType;
  className?: string;
}

type Palette = {
  fill: string;
  stroke: string;
  accent: string;
  glow: string;
};

const PALETTES: Record<ChessPieceColor, Palette> = {
  w: {
    fill: "#fff7ec",
    stroke: "#4c3525",
    accent: "#f4c18d",
    glow: "drop-shadow(0 5px 8px rgba(40, 22, 12, 0.3))",
  },
  b: {
    fill: "#1f171a",
    stroke: "#f6d1ae",
    accent: "#ff9d68",
    glow: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.42))",
  },
};

function Base({
  color,
  className,
  children,
}: {
  color: ChessPieceColor;
  className?: string;
  children: ReactNode;
}) {
  const palette = PALETTES[color];

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-full w-full overflow-visible", className)}
      aria-hidden="true"
      style={{ filter: palette.glow }}
    >
      <g
        fill={palette.fill}
        stroke={palette.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      >
        {children}
      </g>
      <g fill="none" stroke={palette.accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M22 53.5h20" />
      </g>
    </svg>
  );
}

function Pawn({ color }: { color: ChessPieceColor }) {
  return (
    <Base color={color}>
      <circle cx="32" cy="18" r="7" />
      <path d="M24 30c0-4.8 3.6-8 8-8s8 3.2 8 8c0 3.3-1.6 5.7-4.2 7.3 4.6 2 7.7 5.9 7.7 11v1.5H20.5V48.3c0-5.1 3.1-9 7.7-11-2.6-1.6-4.2-4-4.2-7.3Z" />
      <path d="M23.5 49.8h17" fill="none" />
    </Base>
  );
}

function Rook({ color }: { color: ChessPieceColor }) {
  return (
    <Base color={color}>
      <path d="M21 14h6v5h4v-5h6v5h4v-5h6v8l-2.8 3.8V47H22.8V25.8L21 22Z" />
      <path d="M24.5 28h15" fill="none" />
      <path d="M22.5 47.5h19" fill="none" />
    </Base>
  );
}

function Bishop({ color }: { color: ChessPieceColor }) {
  return (
    <Base color={color}>
      <path d="M32 13c5.8 0 10.4 4.8 10.4 10.6 0 4.1-2.3 7.4-5.4 10 4.8 2.7 7.8 7 7.8 13.1V49H19.2v-2.3c0-6.1 3-10.4 7.8-13.1-3.1-2.6-5.4-5.9-5.4-10C21.6 17.8 26.2 13 32 13Z" />
      <path d="M36.5 16.5 28 28.5" fill="none" />
      <circle cx="32" cy="13" r="1.8" />
    </Base>
  );
}

function Knight({ color }: { color: ChessPieceColor }) {
  const palette = PALETTES[color];

  return (
    <Base color={color}>
      <path d="M23 48c0-8 3.4-18.6 12.3-26.2l4.2-3.8 6.2 2.4-3.4 7.8c4.3 2.4 6.7 6.8 6.7 12v7.8H23Z" />
      <path d="M32.5 25.5c-1.8 3.9-5.4 6.9-9.9 8.5" fill="none" />
      <path d="M27 47.8c3.7-1.8 7.2-2.5 10.8-2.1" fill="none" />
      <circle cx="40.8" cy="27.5" r="2" fill={palette.stroke} stroke="none" />
    </Base>
  );
}

function Queen({ color }: { color: ChessPieceColor }) {
  return (
    <Base color={color}>
      <circle cx="21" cy="17.5" r="3.2" />
      <circle cx="32" cy="13.5" r="3.2" />
      <circle cx="43" cy="17.5" r="3.2" />
      <path d="M20.5 22.5 24 40h16l3.5-17.5-11.5 8.2Z" />
      <path d="M23.5 40c0-3.8 3.8-6.6 8.5-6.6s8.5 2.8 8.5 6.6v8.5h-17Z" />
      <path d="M24.5 28.5h15" fill="none" />
    </Base>
  );
}

function King({ color }: { color: ChessPieceColor }) {
  return (
    <Base color={color}>
      <path d="M32 9.5v10" fill="none" />
      <path d="M27.5 14.5h9" fill="none" />
      <path d="M24 24.5c0-5.1 3.6-9.1 8-9.1s8 4 8 9.1c0 3.1-1.5 5.8-4 7.7 5 2.4 8 6.8 8 13V49H20v-3.8c0-6.2 3-10.6 8-13-2.5-1.9-4-4.6-4-7.7Z" />
      <path d="M23 39.5h18" fill="none" />
      <path d="M22.5 49h19" fill="none" />
    </Base>
  );
}

export function ChessPieceIcon({ color, type, className }: ChessPieceIconProps) {
  const pieces: Record<ChessPieceType, ReactElement> = {
    p: <Pawn color={color} />,
    r: <Rook color={color} />,
    b: <Bishop color={color} />,
    n: <Knight color={color} />,
    q: <Queen color={color} />,
    k: <King color={color} />,
  };

  return <div className={cn("pointer-events-none select-none", className)}>{pieces[type]}</div>;
}
