import type { GameMeta } from "./types";

export const GAMES: GameMeta[] = [
  {
    id: "bomb-party",
    name: "Bomb Party",
    description: "Trouve un mot contenant la syllabe imposée avant que la bombe explose !",
    category: "words",
    minPlayers: 2,
    maxPlayers: 8,
    icon: "💣",
    implemented: true,
    component: () => import("@/components/games/bomb-party/bomb-party-game"),
  },
  {
    id: "speed-quiz",
    name: "Speed Quiz",
    description: "Réponds le plus vite possible aux questions de culture générale !",
    category: "trivia",
    minPlayers: 2,
    maxPlayers: 8,
    icon: "⚡",
    implemented: true,
    component: () => import("@/components/games/speed-quiz/speed-quiz-game"),
  },
  {
    id: "word-chain",
    name: "Chaîne de mots",
    description: "Chaque joueur doit dire un mot commençant par la dernière lettre du mot précédent.",
    category: "words",
    minPlayers: 2,
    maxPlayers: 8,
    icon: "🔗",
    implemented: true,
    component: () => import("@/components/games/word-chain/word-chain-game"),
  },
  {
    id: "reaction-time",
    name: "Réflexes",
    description: "Clique le plus vite possible quand l'écran change de couleur !",
    category: "speed",
    minPlayers: 2,
    maxPlayers: 8,
    icon: "🎯",
    implemented: true,
    component: () => import("@/components/games/reaction-time/reaction-time-game"),
  },
];

export function getGameById(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGamesByCategory(category: string): GameMeta[] {
  return GAMES.filter((g) => g.category === category);
}

export const CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "words", label: "Mots" },
  { id: "trivia", label: "Culture" },
  { id: "speed", label: "Rapidité" },
  { id: "strategy", label: "Stratégie" },
] as const;
