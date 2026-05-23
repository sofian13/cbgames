"use client";

import { getSupabase } from "@/lib/supabase/client";

const GLOBAL_STATS_KEY = "af-games-global-stats";

export interface GlobalStats {
  playerId: string;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  topRank: number;
  lastPlayed: number;
}

// Maps a snake_case row from the `game_stats` table to GlobalStats.
function rowToStats(r: Record<string, unknown>): GlobalStats {
  return {
    playerId: String(r.player_id),
    playerName: String(r.player_name),
    totalPoints: Number(r.total_points ?? 0),
    gamesPlayed: Number(r.games_played ?? 0),
    wins: Number(r.wins ?? 0),
    topRank: Number(r.top_rank ?? 999),
    lastPlayed: r.last_played ? Date.parse(String(r.last_played)) : 0,
  };
}

// --- Local cache (fallback) ---

function getLocalCache(): Record<string, GlobalStats> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GLOBAL_STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCache(playerId: string, stats: GlobalStats) {
  if (typeof window === "undefined") return;
  try {
    const map = getLocalCache();
    map[playerId] = stats;
    localStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

// --- Supabase API (with localStorage fallback) ---

export async function addGameResult(
  playerId: string,
  playerName: string,
  rank: number,
  score: number
): Promise<{ earnedPoints: number; stats: GlobalStats }> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.rpc("add_game_result", {
        p_player_id: playerId, p_player_name: playerName, p_rank: rank, p_score: score,
      });
      if (!error && data) {
        const stats = rowToStats(data.stats);
        saveLocalCache(playerId, stats);
        return { earnedPoints: Number(data.earned_points ?? 0), stats };
      }
    } catch { /* fallback below */ }
  }

  // Fallback: compute locally if Supabase unreachable / not configured
  const map = getLocalCache();
  const current: GlobalStats = map[playerId] ?? {
    playerId, playerName, totalPoints: 0, gamesPlayed: 0, wins: 0, topRank: 999, lastPlayed: 0,
  };
  const rankBonus = rank === 1 ? 50 : rank === 2 ? 25 : rank === 3 ? 10 : 0;
  const earnedPoints = Math.max(0, Math.round(score / 10)) + rankBonus + 5;
  current.playerName = playerName;
  current.totalPoints += earnedPoints;
  current.gamesPlayed += 1;
  if (rank === 1) current.wins += 1;
  if (rank < current.topRank) current.topRank = rank;
  current.lastPlayed = Date.now();
  saveLocalCache(playerId, current);
  return { earnedPoints, stats: current };
}

export async function getGlobalStats(playerId: string): Promise<GlobalStats | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from("game_stats").select("*").eq("player_id", playerId).maybeSingle();
      if (!error) {
        const stats = data ? rowToStats(data) : null;
        if (stats) saveLocalCache(playerId, stats);
        return stats;
      }
    } catch { /* fallback below */ }
  }
  const map = getLocalCache();
  return map[playerId] ?? null;
}

export async function getLeaderboard(limit = 20): Promise<GlobalStats[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("game_stats").select("*")
        .order("total_points", { ascending: false })
        .limit(limit);
      if (!error && data) return data.map(rowToStats);
    } catch { /* fallback below */ }
  }
  const map = getLocalCache();
  return Object.values(map).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, limit);
}

export function getLevel(totalPoints: number): { level: number; title: string; nextLevelPoints: number; progress: number } {
  const levels = [
    { threshold: 0, title: "Debutant" },
    { threshold: 100, title: "Apprenti" },
    { threshold: 300, title: "Joueur" },
    { threshold: 600, title: "Confirme" },
    { threshold: 1000, title: "Expert" },
    { threshold: 1500, title: "Maitre" },
    { threshold: 2500, title: "Grand Maitre" },
    { threshold: 4000, title: "Legende" },
    { threshold: 6000, title: "Mythique" },
    { threshold: 10000, title: "Divin" },
  ];

  let currentLevel = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalPoints >= levels[i].threshold) {
      currentLevel = i;
      break;
    }
  }

  const nextLevel = currentLevel < levels.length - 1 ? levels[currentLevel + 1] : null;
  const currentThreshold = levels[currentLevel].threshold;
  const nextThreshold = nextLevel?.threshold ?? levels[levels.length - 1].threshold;
  const progress = nextLevel
    ? Math.min(100, ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return {
    level: currentLevel + 1,
    title: levels[currentLevel].title,
    nextLevelPoints: nextThreshold,
    progress,
  };
}
