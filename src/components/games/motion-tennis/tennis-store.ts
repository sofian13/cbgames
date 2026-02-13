/**
 * Mutable store for 60fps position data.
 * These are plain objects — NOT React state — so updating them
 * never triggers re-renders. Components read them inside useFrame().
 *
 * This follows the R3F best practice: "NEVER setState in useFrame".
 */

export interface CharPos {
  x: number;
  z: number;
}

export interface BallPos {
  x: number;
  y: number;
  z: number;
}

/** Character target positions — keyed by character id (e.g. "near-front") */
export const charTargets: Record<string, CharPos> = {};

/** Latest ball position from server */
export const ballStore: { current: BallPos | null } = { current: null };

/** Reset all targets (e.g. on game start) */
export function resetStore() {
  for (const key of Object.keys(charTargets)) {
    delete charTargets[key];
  }
  ballStore.current = null;
}
