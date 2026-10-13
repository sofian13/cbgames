import type { CSSProperties } from "react";

/**
 * Logo « zinzin » multicolore (même que sur le site) : lettres stickers
 * contourées qui sautillent chacune leur tour.
 */
const LETTERS = [
  { l: "z", r: -6, c: "#FFD23F" },
  { l: "i", r: 4, c: "#FF3EA5" },
  { l: "n", r: -3, c: "#3DDC97" },
  { l: "z", r: 5, c: "#4ECDC4" },
  { l: "i", r: -5, c: "#FF6B5B" },
  { l: "n", r: 3, c: "#A98BFF" },
];

export function ZLogo({ size = 40, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <span role="img" aria-label="zinzin" className={`zz-wordmark inline-block select-none whitespace-nowrap ${className}`} style={{ fontSize: size, ...style }}>
      {LETTERS.map((x, i) => (
        <span
          key={i}
          aria-hidden
          className="zz-letter"
          style={{ color: x.c, ["--r" as string]: `${x.r}deg`, ["--d" as string]: `${i * 110}ms` }}
        >
          {x.l}
        </span>
      ))}
    </span>
  );
}
