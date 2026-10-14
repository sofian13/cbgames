import { MASCOT_COLORS, type MascotColor } from "@/components/Mascot";

/** Même règle que colorForIndex (local-kit), sans import circulaire. */
export function colorForIndexSafe(i: number): MascotColor {
  return MASCOT_COLORS[Math.abs(Math.floor(i)) % MASCOT_COLORS.length];
}
