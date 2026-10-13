/**
 * Face d'une carte à jouer dessinée en SVG (proportions réelles ~63×88).
 * - 2 à 10 : coins valeur + symbole, et le nombre exact de symboles au centre,
 *   disposés comme sur une vraie carte (moitié basse retournée à 180°).
 * - As : un seul grand symbole central.
 * - Figures : image /cards/faces/*.jpg encadrée, avec les mêmes coins.
 * Tout est dans un seul viewBox : la carte se met à l'échelle sans chevauchement.
 */

import { useId } from "react";

const INK = "#15082E";
const RED = "#E0263D";

// Repère de la carte : 126 × 176 (= 63 × 88 × 2)
const W = 126;
const H = 176;

export type SuitKey = "s" | "h" | "d" | "c";
export const SUIT_KEY: Record<string, SuitKey> = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };

/** Symbole dessiné dans une boîte 100 × 100 centrée en (50, 50). */
function SuitShape({ suit }: { suit: SuitKey }) {
  switch (suit) {
    case "h":
      return <path d="M50 94 C 30 74 3 56 3 31 C 3 15 15 5 29 5 C 39 5 46 11 50 20 C 54 11 61 5 71 5 C 85 5 97 15 97 31 C 97 56 70 74 50 94 Z" />;
    case "d":
      return <path d="M50 2 C 62 20 75 36 90 50 C 75 64 62 80 50 98 C 38 80 25 64 10 50 C 25 36 38 20 50 2 Z" />;
    case "s":
      return (
        <path d="M50 3 C 64 22 97 38 97 62 C 97 76 87 84 75 84 C 66 84 59 80 55 73 C 56 83 60 90 68 97 L 32 97 C 40 90 44 83 45 73 C 41 80 34 84 25 84 C 13 84 3 76 3 62 C 3 38 36 22 50 3 Z" />
      );
    case "c":
      return (
        <g>
          <circle cx="50" cy="27" r="22" />
          <circle cx="25" cy="60" r="22" />
          <circle cx="75" cy="60" r="22" />
          <path d="M42 40 L 58 40 L 60 62 L 40 62 Z" />
          <path d="M46 58 C 46 76 41 88 31 97 L 69 97 C 59 88 54 76 54 58 Z" />
        </g>
      );
  }
}

/** Place un symbole centré en (x, y), de taille `size`, retourné si `flip`. */
function Pip({ suit, x, y, size, flip, className }: { suit: SuitKey; x: number; y: number; size: number; flip?: boolean; className?: string }) {
  const k = size / 100;
  return (
    // Groupe externe réservé à une mise à l'échelle CSS (classe), l'interne porte la position
    <g className={className}>
      <g transform={`translate(${x} ${y}) rotate(${flip ? 180 : 0}) scale(${k}) translate(-50 -50)`}>
        <SuitShape suit={suit} />
      </g>
    </g>
  );
}

// Disposition standard des symboles (colonnes et rangées dans le repère 126 × 176)
const L = 40;
const C = 63;
const R = 86;
const T = 36;
const B = 140;
const M = 88;
const Q1 = 72; // 1re rangée intermédiaire (9, 10)
const Q3 = 104;
const S1 = 62; // symbole central haut (7, 8)
const S2 = 114; // symbole central bas (8)
const LAYOUT: Record<number, [number, number][]> = {
  2: [[C, T], [C, B]],
  3: [[C, T], [C, M], [C, B]],
  4: [[L, T], [R, T], [L, B], [R, B]],
  5: [[L, T], [R, T], [C, M], [L, B], [R, B]],
  6: [[L, T], [R, T], [L, M], [R, M], [L, B], [R, B]],
  7: [[L, T], [R, T], [C, S1], [L, M], [R, M], [L, B], [R, B]],
  8: [[L, T], [R, T], [C, S1], [L, M], [R, M], [C, S2], [L, B], [R, B]],
  9: [[L, T], [R, T], [L, Q1], [R, Q1], [C, M], [L, Q3], [R, Q3], [L, B], [R, B]],
  10: [[L, T], [R, T], [C, 54], [L, Q1], [R, Q1], [L, Q3], [R, Q3], [C, 122], [L, B], [R, B]],
};
const PIP = 26; // taille d'un symbole central
/** CSS à injecter une fois : symboles centraux un peu plus petits sur les petits écrans
 *  (la carte y descend à ~118 px de haut), les coins gardent leur taille. */
export const CARD_FACE_CSS = `.tgv-pip{transform-box:fill-box;transform-origin:center}
@media (max-height: 705px){.tgv-pip{scale:.86}}`;

/** Coin : valeur au-dessus du petit symbole. */
function Corner({ label, suit, flip }: { label: string; suit: SuitKey; flip?: boolean }) {
  const ten = label.length > 1;
  return (
    <g transform={flip ? `rotate(180 ${W / 2} ${H / 2})` : undefined}>
      <text
        x={14}
        y={25}
        textAnchor="middle"
        fontFamily="var(--font-display), system-ui, sans-serif"
        fontWeight={700}
        fontSize={22}
        // « 10 » serré pour garder la même largeur de coin que les autres valeurs
        {...(ten ? { textLength: 19, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        {label}
      </text>
      <Pip suit={suit} x={14} y={36} size={14} />
    </g>
  );
}

export function CardFace({
  value, label, suit, red, faceSrc,
}: {
  /** 2…10 pour les cartes à points, 14 pour l'as, autre pour les figures */
  value: number;
  /** texte des coins (ex. « 7 », « D », « A ») */
  label: string;
  suit: SuitKey;
  red: boolean;
  /** image de la figure (Valet / Dame / Roi) */
  faceSrc?: string;
}) {
  const color = red ? RED : INK;
  const pips = LAYOUT[value];
  const clipId = `tgv-face-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" fill={color} aria-hidden style={{ display: "block" }}>
      <Corner label={label} suit={suit} />
      <Corner label={label} suit={suit} flip />
      {pips ? (
        pips.map(([x, y], i) => <Pip key={i} suit={suit} x={x} y={y} size={PIP} flip={y > M + 0.5} className="tgv-pip" />)
      ) : faceSrc ? (
        <g>
          <clipPath id={clipId}><rect x={30} y={22} width={66} height={132} rx={5} /></clipPath>
          <image href={faceSrc} x={30} y={22} width={66} height={132} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
          <rect x={30} y={22} width={66} height={132} rx={5} fill="none" stroke={INK} strokeWidth={2.5} />
        </g>
      ) : (
        // As : un seul grand symbole
        <Pip suit={suit} x={C} y={M} size={58} />
      )}
    </svg>
  );
}
