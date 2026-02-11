import type { GameRanking } from "./types";

/**
 * Calculate points to award based on ranking.
 * 1st place: 10pts, 2nd: 7pts, 3rd: 5pts, 4th: 3pts, rest: 1pt
 */
const RANK_POINTS = [10, 7, 5, 3, 2, 1, 1, 1];

export function calculateSessionPoints(rankings: GameRanking[]): Record<string, number> {
  const points: Record<string, number> = {};
  for (const r of rankings) {
    points[r.playerId] = RANK_POINTS[r.rank - 1] ?? 1;
  }
  return points;
}

export function mergeScores(
  existing: Record<string, number>,
  newPoints: Record<string, number>
): Record<string, number> {
  const merged = { ...existing };
  for (const [id, pts] of Object.entries(newPoints)) {
    merged[id] = (merged[id] ?? 0) + pts;
  }
  return merged;
}
