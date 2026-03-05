"use client";

import { getPartyKitHost, getPartyKitHttpProtocol } from "@/lib/party/host";

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

function getStatsUrl(): string {
  const host = getPartyKitHost();
  const protocol = getPartyKitHttpProtocol(host);
  return `${protocol}://${host}/parties/stats/global`;
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

// --- Server API ---

export async function addGameResult(
  playerId: string,
  playerName: string,
  rank: number,
  score: number
): Promise<{ earnedPoints: number; stats: GlobalStats }> {
  try {
    const res = await fetch(getStatsUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-result", playerId, playerName, rank, score }),
    });
    if (res.ok) {
      const data = await res.json() as { earnedPoints: number; stats: GlobalStats };
      saveLocalCache(playerId, data.stats);
      return data;
    }
  } catch { /* fallback below */ }

  // Fallback: compute locally if server unreachable
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
  try {
    const res = await fetch(`${getStatsUrl()}?action=get-stats&playerId=${encodeURIComponent(playerId)}`);
    if (res.ok) {
      const data = await res.json() as GlobalStats | null;
      if (data) saveLocalCache(playerId, data);
      return data;
    }
  } catch { /* fallback below */ }

  // Fallback: local cache
  const map = getLocalCache();
  return map[playerId] ?? null;
}

export async function getLeaderboard(limit = 20): Promise<GlobalStats[]> {
  try {
    const res = await fetch(`${getStatsUrl()}?action=leaderboard&limit=${limit}`);
    if (res.ok) return await res.json() as GlobalStats[];
  } catch { /* fallback below */ }

  // Fallback: local cache (only own data)
  const map = getLocalCache();
  return Object.values(map).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, limit);
}

export function getLevel(totalPoints: number): { level: number; title: string; nextLevelPoints: number; progress: number } {
  const levels = [
    { threshold: 0, title: "Débutant" },
    { threshold: 100, title: "Apprenti" },
    { threshold: 300, title: "Joueur" },
    { threshold: 600, title: "Confirmé" },
    { threshold: 1000, title: "Expert" },
    { threshold: 1500, title: "Maître" },
    { threshold: 2500, title: "Grand Maître" },
    { threshold: 4000, title: "Légende" },
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
