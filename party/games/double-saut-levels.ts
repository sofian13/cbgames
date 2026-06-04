/* ──────────────────────────────────────────────────────────────
   Double Saut — données de niveaux + parsing (PARTAGÉ).
   ⚠️  Ce fichier est dupliqué à l'identique dans
       party/games/double-saut-levels.ts (le serveur ne peut pas
       importer depuis src/). Toute modif doit être reportée là-bas.
   Grille 15 lignes. Légende :
     '#' solide  '^' piques  'C' friable  'S' scie  'E' ennemi
     '<' canon←  '>' canon→  'o' étoile   'G' sortie  '1'/'2' spawns
   ────────────────────────────────────────────────────────────── */

export const TILE = 48;
export const VW = 1280;
export const VH = 720;

export interface LevelDef {
  name: string;
  accent: string;
  sky: string;
  rows: string[];
}

export interface ParsedLevel {
  def: LevelDef;
  W: number;
  H: number;
  pixelW: number;
  tiles: number[][]; // 0 vide · 1 solide · 2 pique · 3 friable
  enemies: { x: number; y: number; w: number; h: number; dir: number }[];
  saws: { x: number; y: number }[];
  shooters: { x: number; y: number; dir: number }[];
  coins: { x: number; y: number }[];
  p1: { x: number; y: number } | null;
  p2: { x: number; y: number } | null;
  goal: { x: number; y: number; cx: number } | null;
}

export function parseLevel(def: LevelDef): ParsedLevel {
  const rows = def.rows;
  const H = rows.length;
  const W = rows[0].length;
  const tiles: number[][] = [];
  const enemies: ParsedLevel["enemies"] = [];
  const saws: ParsedLevel["saws"] = [];
  const shooters: ParsedLevel["shooters"] = [];
  const coins: ParsedLevel["coins"] = [];
  let p1: ParsedLevel["p1"] = null;
  let p2: ParsedLevel["p2"] = null;
  let goal: ParsedLevel["goal"] = null;

  for (let y = 0; y < H; y++) {
    tiles.push(new Array(W).fill(0));
    for (let x = 0; x < W; x++) {
      const ch = rows[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (ch === "#") tiles[y][x] = 1;
      else if (ch === "^") tiles[y][x] = 2;
      else if (ch === "C") tiles[y][x] = 3;
      else if (ch === "E") enemies.push({ x: px + 4, y: py + (TILE - 32), w: 40, h: 32, dir: -1 });
      else if (ch === "S") saws.push({ x: px + TILE / 2, y: py + TILE / 2 });
      else if (ch === "<") shooters.push({ x: px + TILE / 2, y: py + TILE / 2, dir: -1 });
      else if (ch === ">") shooters.push({ x: px + TILE / 2, y: py + TILE / 2, dir: 1 });
      else if (ch === "o") coins.push({ x: px + TILE / 2, y: py + TILE / 2 });
      else if (ch === "1") p1 = { x: px, y: py };
      else if (ch === "2") p2 = { x: px, y: py };
      else if (ch === "G") goal = { x: px - 4, y: py - TILE, cx: px + TILE / 2 };
    }
  }
  return { def, W, H, pixelW: W * TILE, tiles, enemies, saws, shooters, coins, p1, p2, goal };
}

// ─────────── Construction des 6 niveaux ───────────
const H = 15;
function blank(w: number): string[][] {
  const g: string[][] = [];
  for (let y = 0; y < H; y++) g.push(new Array(w).fill(" "));
  return g;
}
function rect(g: string[][], x0: number, y0: number, x1: number, y1: number, ch: string) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (g[y] && x >= 0 && x < g[y].length) g[y][x] = ch;
}
const ground = (g: string[][], x0: number, x1: number, top: number) => rect(g, x0, top, x1, H - 1, "#");
const span = (g: string[][], x0: number, x1: number, y: number, ch: string) => {
  for (let x = x0; x <= x1; x++) g[y][x] = ch;
};
const put = (g: string[][], x: number, y: number, ch: string) => {
  g[y][x] = ch;
};
const toRows = (g: string[][]) => g.map((r) => r.join(""));

function buildLevels(): LevelDef[] {
  const LEVELS: LevelDef[] = [];

  // 1 · Réveil
  {
    const w = 54, g = blank(w);
    ground(g, 0, 11, 13); ground(g, 15, 30, 13); ground(g, 34, 53, 13);
    put(g, 2, 12, "1"); put(g, 4, 12, "2");
    span(g, 6, 9, 9, "#"); span(g, 24, 27, 10, "#"); span(g, 40, 44, 8, "#");
    span(g, 20, 22, 12, "^");
    put(g, 7, 8, "o"); put(g, 13, 9, "o"); put(g, 25, 9, "o");
    put(g, 32, 8, "o"); put(g, 42, 7, "o"); put(g, 48, 11, "o");
    put(g, 51, 12, "G");
    LEVELS.push({ name: "Réveil", accent: "#3DDC97", sky: "mint", rows: toRows(g) });
  }
  // 2 · Sous-bois
  {
    const w = 58, g = blank(w);
    ground(g, 0, 9, 13); ground(g, 13, 24, 13); ground(g, 28, 40, 13); ground(g, 44, 57, 13);
    put(g, 2, 12, "1"); put(g, 4, 12, "2");
    span(g, 10, 12, 9, "#"); span(g, 25, 27, 10, "#"); span(g, 41, 43, 9, "#");
    put(g, 18, 12, "E"); put(g, 34, 12, "E"); put(g, 50, 12, "E");
    span(g, 22, 23, 12, "^");
    put(g, 11, 8, "o"); put(g, 19, 11, "o"); put(g, 26, 9, "o");
    put(g, 35, 11, "o"); put(g, 42, 8, "o"); put(g, 52, 11, "o");
    put(g, 55, 12, "G");
    LEVELS.push({ name: "Sous-bois", accent: "#4ECDC4", sky: "sky", rows: toRows(g) });
  }
  // 3 · Ruines
  {
    const w = 60, g = blank(w);
    ground(g, 0, 9, 13); ground(g, 22, 31, 13); ground(g, 46, 59, 13);
    put(g, 2, 12, "1"); put(g, 4, 12, "2");
    put(g, 11, 11, "C"); put(g, 13, 10, "C"); put(g, 15, 11, "C");
    put(g, 17, 10, "C"); put(g, 19, 11, "C");
    put(g, 26, 12, "E");
    span(g, 28, 29, 12, "^");
    put(g, 33, 11, "C"); put(g, 35, 10, "C"); put(g, 37, 11, "C");
    put(g, 39, 10, "C"); put(g, 41, 11, "C"); put(g, 43, 10, "C");
    put(g, 12, 9, "o"); put(g, 16, 8, "o"); put(g, 25, 10, "o");
    put(g, 36, 8, "o"); put(g, 40, 8, "o"); put(g, 52, 11, "o");
    span(g, 48, 50, 9, "#");
    put(g, 57, 12, "G");
    LEVELS.push({ name: "Ruines", accent: "#FFD23F", sky: "yellow", rows: toRows(g) });
  }
  // 4 · Atelier
  {
    const w = 62, g = blank(w);
    ground(g, 0, 12, 13); ground(g, 16, 30, 13); ground(g, 34, 48, 13); ground(g, 52, 61, 13);
    put(g, 2, 12, "1"); put(g, 4, 12, "2");
    put(g, 9, 12, "S"); put(g, 24, 12, "S"); put(g, 44, 12, "S");
    span(g, 20, 23, 9, "#");
    put(g, 38, 8, "S");
    span(g, 36, 40, 9, "#");
    put(g, 28, 12, "E"); put(g, 46, 12, "E");
    span(g, 17, 18, 12, "^");
    put(g, 7, 11, "o"); put(g, 21, 8, "o"); put(g, 22, 8, "o");
    put(g, 38, 7, "o"); put(g, 50, 11, "o"); put(g, 57, 11, "o");
    put(g, 59, 12, "G");
    LEVELS.push({ name: "Atelier", accent: "#FF6B5B", sky: "coral", rows: toRows(g) });
  }
  // 5 · Forge
  {
    const w = 64, g = blank(w);
    ground(g, 0, 11, 13); ground(g, 15, 28, 13); ground(g, 32, 46, 13); ground(g, 50, 63, 13);
    put(g, 2, 12, "1"); put(g, 4, 12, "2");
    rect(g, 30, 4, 30, 8, "#"); put(g, 30, 6, "<");
    rect(g, 14, 8, 14, 12, "#"); put(g, 14, 10, ">");
    put(g, 48, 6, "<"); rect(g, 48, 4, 48, 8, "#");
    span(g, 18, 21, 9, "#"); span(g, 36, 39, 9, "#"); span(g, 24, 26, 7, "#");
    put(g, 22, 12, "E"); put(g, 42, 12, "E");
    put(g, 38, 12, "S");
    span(g, 16, 17, 12, "^");
    put(g, 19, 8, "o"); put(g, 25, 6, "o"); put(g, 37, 8, "o");
    put(g, 44, 11, "o"); put(g, 54, 11, "o"); put(g, 58, 11, "o");
    put(g, 61, 12, "G");
    LEVELS.push({ name: "Forge", accent: "#FF3EA5", sky: "pink", rows: toRows(g) });
  }
  // 6 · Le Gouffre
  {
    const w = 72, g = blank(w);
    ground(g, 0, 8, 13); ground(g, 20, 30, 13); ground(g, 40, 52, 13); ground(g, 62, 71, 13);
    put(g, 2, 12, "1"); put(g, 4, 12, "2");
    put(g, 10, 11, "C"); put(g, 12, 10, "C"); put(g, 14, 11, "C"); put(g, 16, 10, "C"); put(g, 18, 11, "C");
    put(g, 13, 7, "S");
    put(g, 24, 12, "E"); put(g, 27, 12, "E");
    span(g, 22, 23, 12, "^");
    rect(g, 31, 4, 31, 9, "#"); put(g, 31, 7, "<");
    span(g, 33, 35, 9, "#");
    put(g, 37, 12, "S");
    span(g, 36, 39, 13, "#");
    rect(g, 39, 5, 39, 9, "#"); put(g, 39, 7, ">");
    put(g, 45, 12, "E");
    put(g, 48, 12, "S");
    put(g, 50, 8, "S"); span(g, 48, 51, 9, "#");
    put(g, 54, 11, "C"); put(g, 56, 10, "C"); put(g, 58, 11, "C"); put(g, 60, 10, "C");
    span(g, 55, 56, 6, "^");
    put(g, 11, 9, "o"); put(g, 17, 8, "o"); put(g, 26, 10, "o");
    put(g, 34, 7, "o"); put(g, 50, 7, "o"); put(g, 59, 8, "o"); put(g, 66, 11, "o");
    put(g, 69, 12, "G");
    LEVELS.push({ name: "Le Gouffre", accent: "#7A4EE8", sky: "purple", rows: toRows(g) });
  }

  return LEVELS;
}

export const LEVELS: LevelDef[] = buildLevels();
export const LEVEL_COUNT = LEVELS.length;
