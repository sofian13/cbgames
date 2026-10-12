/**
 * Loup-Garou « un seul téléphone » : rôles, répartition recommandée et règles pures
 * (résolution de la nuit, morts en cascade, conditions de victoire).
 * Aucune dépendance React : tout est testable à la main.
 */

import type { MascotColor, MascotMood } from "@/components/Mascot";

export type RoleId = "loup" | "villageois" | "voyante" | "sorciere" | "chasseur" | "cupidon" | "gardien";

export interface RoleInfo {
  id: RoleId;
  name: string;
  /** « la Voyante », « un Loup-garou »… pour la narration */
  withArticle: string;
  emoji: string;
  color: MascotColor;
  mood: MascotMood;
  accent: string;
  camp: "loups" | "village";
  power: string;
}

export const ROLES: Record<RoleId, RoleInfo> = {
  loup: {
    id: "loup", name: "Loup-garou", withArticle: "un Loup-garou", emoji: "🐺", color: "coral", mood: "angry",
    accent: "#FF4D5E", camp: "loups",
    power: "Chaque nuit, ta meute dévore quelqu'un. Le jour, joue l'innocent.",
  },
  villageois: {
    id: "villageois", name: "Villageois", withArticle: "un Villageois", emoji: "🧑‍🌾", color: "mint", mood: "happy",
    accent: "#3DDC97", camp: "village",
    power: "Pas de pouvoir : ton flair et ta tchatche pour démasquer les loups.",
  },
  voyante: {
    id: "voyante", name: "Voyante", withArticle: "la Voyante", emoji: "🔮", color: "lavender", mood: "sus",
    accent: "#B5A1FF", camp: "village",
    power: "Chaque nuit, tu découvres en secret le vrai rôle d'un joueur.",
  },
  sorciere: {
    id: "sorciere", name: "Sorcière", withArticle: "la Sorcière", emoji: "🧪", color: "pink", mood: "wink",
    accent: "#FF3EA5", camp: "village",
    power: "Une potion pour sauver la victime des loups, une pour éliminer qui tu veux. Une fois chacune.",
  },
  chasseur: {
    id: "chasseur", name: "Chasseur", withArticle: "le Chasseur", emoji: "🎯", color: "yellow", mood: "cool",
    accent: "#FFD23F", camp: "village",
    power: "Si tu meurs, tu emportes aussitôt quelqu'un avec toi.",
  },
  cupidon: {
    id: "cupidon", name: "Cupidon", withArticle: "Cupidon", emoji: "💘", color: "white", mood: "love",
    accent: "#FFA5CD", camp: "village",
    power: "La 1re nuit, tu lies deux joueurs : si l'un meurt, l'autre meurt de chagrin.",
  },
  gardien: {
    id: "gardien", name: "Gardien", withArticle: "le Gardien", emoji: "🛡️", color: "sky", mood: "neutral",
    accent: "#4ECDC4", camp: "village",
    power: "Chaque nuit, tu protèges un joueur des loups (jamais le même deux nuits de suite).",
  },
};

/** Rôles spéciaux (0 ou 1 exemplaire), dans l'ordre d'affichage */
export const SPECIALS: RoleId[] = ["voyante", "sorciere", "chasseur", "gardien", "cupidon"];

export interface Composition {
  loup: number;
  voyante: boolean;
  sorciere: boolean;
  chasseur: boolean;
  gardien: boolean;
  cupidon: boolean;
}

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 16;

/** Répartition équilibrée selon le nombre de joueurs */
export function recommended(n: number): Composition {
  const loup = n <= 6 ? 1 : n <= 9 ? 2 : n <= 13 ? 3 : 4;
  return {
    loup,
    voyante: true,
    sorciere: n >= 6,
    chasseur: n >= 8,
    gardien: n >= 11,
    cupidon: n >= 12,
  };
}

export function specialsCount(c: Composition): number {
  return SPECIALS.filter((r) => c[r as keyof Composition]).length;
}

export function villagersCount(c: Composition, n: number): number {
  return n - c.loup - specialsCount(c);
}

/** null si la compo est jouable, sinon le problème en clair */
export function compositionProblem(c: Composition, n: number): string | null {
  if (c.loup < 1) return "Il faut au moins un loup.";
  if (villagersCount(c, n) < 0) return "Trop de rôles pour le nombre de joueurs.";
  if (c.loup * 2 >= n) return "Trop de loups : ils gagneraient d'entrée.";
  return null;
}

export interface Player {
  id: number;
  name: string;
  role: RoleId;
  alive: boolean;
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function deal(names: string[], c: Composition): Player[] {
  const roles: RoleId[] = [];
  for (let i = 0; i < c.loup; i++) roles.push("loup");
  for (const s of SPECIALS) if (c[s as keyof Composition]) roles.push(s);
  while (roles.length < names.length) roles.push("villageois");
  const mixed = shuffle(roles);
  return names.map((name, id) => ({ id, name, role: mixed[id], alive: true }));
}

export type DeathCause = "loups" | "poison" | "vote" | "chasseur" | "chagrin";

export interface Death {
  id: number;
  cause: DeathCause;
}

/**
 * Tue les joueurs listés puis applique le chagrin des amoureux (en cascade).
 * Renvoie les nouveaux joueurs et la liste ordonnée des morts réellement survenues.
 */
export function applyDeaths(
  players: Player[],
  kills: Death[],
  lovers: [number, number] | null,
): { players: Player[]; deaths: Death[] } {
  const next = players.map((p) => ({ ...p }));
  const deaths: Death[] = [];
  const kill = (d: Death) => {
    const p = next[d.id];
    if (!p || !p.alive) return;
    p.alive = false;
    deaths.push(d);
    if (lovers && lovers.includes(d.id)) {
      const other = lovers[0] === d.id ? lovers[1] : lovers[0];
      kill({ id: other, cause: "chagrin" });
    }
  };
  kills.forEach(kill);
  return { players: next, deaths };
}

export type Winner = "village" | "loups" | "amoureux" | "personne";

export function checkWinner(players: Player[], lovers: [number, number] | null): Winner | null {
  const alive = players.filter((p) => p.alive);
  if (alive.length === 0) return "personne";
  const wolves = alive.filter((p) => p.role === "loup").length;
  // Couple mixte (loup + villageois) : il gagne s'il reste seul en vie
  if (lovers && alive.length === 2 && alive.every((p) => lovers.includes(p.id))) {
    const mixed = players[lovers[0]].role === "loup" !== (players[lovers[1]].role === "loup");
    if (mixed) return "amoureux";
  }
  if (wolves === 0) return "village";
  if (wolves >= alive.length - wolves) return "loups";
  return null;
}

/** Ce qui s'est décidé pendant une nuit */
export interface NightActions {
  lovers: [number, number] | null;
  protect: number | null;
  wolfTarget: number | null;
  seer: number | null;
  saved: boolean;
  poison: number | null;
}

export const EMPTY_NIGHT: NightActions = { lovers: null, protect: null, wolfTarget: null, seer: null, saved: false, poison: null };

/** Morts « brutes » de la nuit (avant cascade des amoureux) */
export function nightKills(a: NightActions): Death[] {
  const kills: Death[] = [];
  if (a.wolfTarget !== null && !a.saved && a.protect !== a.wolfTarget) kills.push({ id: a.wolfTarget, cause: "loups" });
  if (a.poison !== null && !kills.some((k) => k.id === a.poison)) kills.push({ id: a.poison, cause: "poison" });
  return kills;
}
