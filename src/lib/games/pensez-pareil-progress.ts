"use client";

/**
 * Progression persistante (localStorage) pour Pensez Pareil.
 * La "complicité" du couple monte de partie en partie : chaque sync = 1 XP.
 * Stocké sur l'appareil — chaque téléphone garde la mémoire de la relation.
 */

export interface PPProgress {
  xp: number; // total de syncs cumulés
  bestStreak: number; // plus longue série de syncs
  gamesPlayed: number;
  badges: string[];
}

export interface PPLevel {
  index: number;
  name: string;
  emoji: string;
  /** XP minimum pour atteindre ce niveau */
  min: number;
  /** XP du niveau suivant (Infinity si max) */
  next: number;
}

const KEY = "pp-progress-v1";

export const PP_LEVELS = [
  { name: "Premiers signaux", emoji: "📡", min: 0 },
  { name: "Sur la même longueur", emoji: "🔗", min: 12 },
  { name: "Complices", emoji: "💞", min: 30 },
  { name: "Connectés", emoji: "🧠", min: 60 },
  { name: "Télépathes", emoji: "🔮", min: 100 },
  { name: "Âmes sœurs", emoji: "💍", min: 160 },
] as const;

export const PP_BADGES: Record<string, { label: string; emoji: string }> = {
  "first-sync": { label: "Premier sync", emoji: "✨" },
  "streak-3": { label: "Combo x3", emoji: "🔥" },
  "streak-5": { label: "Combo x5", emoji: "⚡" },
  "perfect": { label: "Partie parfaite", emoji: "💯" },
  "veteran": { label: "10 parties", emoji: "🏅" },
};

export function levelFor(xp: number): PPLevel {
  let idx = 0;
  for (let i = 0; i < PP_LEVELS.length; i++) {
    if (xp >= PP_LEVELS[i].min) idx = i;
  }
  const lvl = PP_LEVELS[idx];
  const next = idx + 1 < PP_LEVELS.length ? PP_LEVELS[idx + 1].min : Infinity;
  return { index: idx, name: lvl.name, emoji: lvl.emoji, min: lvl.min, next };
}

const EMPTY: PPProgress = { xp: 0, bestStreak: 0, gamesPlayed: 0, badges: [] };

export function getProgress(): PPProgress {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw) as Partial<PPProgress>;
    return {
      xp: p.xp ?? 0,
      bestStreak: p.bestStreak ?? 0,
      gamesPlayed: p.gamesPlayed ?? 0,
      badges: Array.isArray(p.badges) ? p.badges : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export interface RecordResult {
  before: PPProgress;
  after: PPProgress;
  leveledUp: boolean;
  fromLevel: PPLevel;
  toLevel: PPLevel;
  newBadges: string[];
}

/** Enregistre une partie terminée et renvoie ce qui a été débloqué. */
export function recordGame(opts: { syncs: number; bestStreak: number; perfect: boolean }): RecordResult {
  const before = getProgress();
  const after: PPProgress = {
    xp: before.xp + opts.syncs,
    bestStreak: Math.max(before.bestStreak, opts.bestStreak),
    gamesPlayed: before.gamesPlayed + 1,
    badges: [...before.badges],
  };

  const newBadges: string[] = [];
  const unlock = (id: string) => {
    if (!after.badges.includes(id)) {
      after.badges.push(id);
      newBadges.push(id);
    }
  };

  if (after.xp > 0) unlock("first-sync");
  if (opts.bestStreak >= 3) unlock("streak-3");
  if (opts.bestStreak >= 5) unlock("streak-5");
  if (opts.perfect && opts.syncs > 0) unlock("perfect");
  if (after.gamesPlayed >= 10) unlock("veteran");

  const fromLevel = levelFor(before.xp);
  const toLevel = levelFor(after.xp);
  const leveledUp = toLevel.index > fromLevel.index;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(after));
    } catch {
      /* ignore quota */
    }
  }

  return { before, after, leveledUp, fromLevel, toLevel, newBadges };
}
