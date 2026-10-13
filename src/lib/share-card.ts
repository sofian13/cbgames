import { MASCOT_COLORS, MASCOT_PALETTE, type MascotColor, type MascotMood } from "@/components/Mascot";
import { GAME_NAMES } from "@/lib/games/game-names-i18n";
import { type I18n, getLang, pick } from "@/lib/i18n";

/**
 * « Partager mon résultat » : carte image verticale 1080×1920 (format story)
 * dans la DA Zinzin, dessinée en local sur un <canvas> puis partagée en PNG.
 * - Rien ne part sur Internet : l'image est générée sur le tél et ne sort que
 *   par la feuille de partage système choisie par le joueur.
 * - Seuls les prénoms affichés à l'écran figurent sur l'image.
 * - Polices : celles de l'app (Clash Display, DM Sans), chargées avant de dessiner.
 * - Blobs : l'app enregistre un rendu SVG de ses ZBlob déguisés (registerShareArt) ;
 *   à défaut, un blob SVG simple.
 */

export const SHARE_SITE = "zinzin-app.com";

/* ───────── Données d'une carte ───────── */
export interface ShareRow {
  name: string;
  /** Score affiché à droite (« 73 % », « 12 pts »…) */
  value?: string;
  /** Petite ligne sous le prénom (verdict, titre…) */
  note?: string;
  /** Couleur du blob (index du joueur, comme à l'écran) */
  colorIndex?: number;
  /** Rang affiché (ex æquo) ; défaut : position */
  rank?: number;
}

export interface ShareAward {
  label: string;
  name: string;
  colorIndex?: number;
  bg?: string;
  mood?: MascotMood;
}

export interface ShareCard {
  /** Id du jeu (costume du blob, nom) ou « soiree » */
  game: string;
  /** Nom affiché dans l'étiquette (défaut : nom du jeu traduit) */
  chip?: string;
  /** Bloc principal (sticker) */
  hero?: { kicker?: string; big?: string; title?: string; sub?: string; bg?: string };
  awards?: ShareAward[];
  rows?: ShareRow[];
  /** Phrase finale dans un sticker corail */
  footnote?: string;
  /** Fond de la phrase finale (défaut : corail) */
  footBg?: string;
  /** Texte qui accompagne l'image (l'adresse du site est ajoutée) */
  text: string;
  /** Blob principal */
  color?: MascotColor;
  mood?: MascotMood;
  crown?: boolean;
}

/* ───────── Rendu des blobs (fourni par l'app) ───────── */
export interface ShareBlobOpts {
  game?: string;
  color?: MascotColor;
  mood?: MascotMood;
  crown?: boolean;
  seed?: number;
}
/**
 * SVG attendu : repère du ZBlob (120×120) agrandi pour les costumes qui dépassent,
 * soit viewBox="-30 -30 180 180" (1,5× la taille du blob).
 */
export const SHARE_ART_VIEWBOX = "-30 -30 180 180";
const ART = 1.5;
const ART_PAD = 0.25;
type BlobArt = (o: ShareBlobOpts) => string | null;
let blobArt: BlobArt | null = null;

/** L'app branche ici son rendu SVG des ZBlob (avec le costume du jeu). */
export function registerShareArt(fn: BlobArt) {
  blobArt = fn;
}

/** Blob de secours (site) : SVG autonome, sans ressource externe. */
function fallbackBlob(o: ShareBlobOpts): string {
  const p = MASCOT_PALETTE[o.color ?? "pink"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -30 180 180" width="600" height="600">
<path d="M60 18 C88 17 108 37 108 64 C108 92 88 108 60 108 C32 108 12 94 12 66 C12 39 32 19 60 18Z" transform="translate(0 6)" fill="${INK}"/>
<path d="M60 18 C88 17 108 37 108 64 C108 92 88 108 60 108 C32 108 12 94 12 66 C12 39 32 19 60 18Z" fill="${p.body}" stroke="${INK}" stroke-width="4"/>
<ellipse cx="38" cy="38" rx="13" ry="8" transform="rotate(-24 38 38)" fill="#fff" opacity=".5"/>
<circle cx="44" cy="58" r="13" fill="#fff"/><circle cx="78" cy="55" r="16" fill="#fff"/>
<circle cx="48" cy="60" r="7" fill="${INK}"/><circle cx="73" cy="52" r="9" fill="${INK}"/>
<path d="M47 78 H73 C73 92 66 98 60 98 C54 98 47 92 47 78Z" fill="${INK}"/></svg>`;
}

/* ───────── Textes ───────── */
const STR: I18n<{ playOn: string; tail: string; dialog: string; more: (n: number) => string }> = {
  fr: { playOn: "Joue sur Zinzin", tail: "Joue sur Zinzin :", dialog: "Partager mon résultat", more: (n) => `+ ${n} autre${n > 1 ? "s" : ""}` },
  en: { playOn: "Play on Zinzin", tail: "Play on Zinzin:", dialog: "Share my result", more: (n) => `+ ${n} more` },
  es: { playOn: "Juega en Zinzin", tail: "Juega en Zinzin:", dialog: "Compartir mi resultado", more: (n) => `+ ${n} más` },
};

/* ───────── Dessin ───────── */
const W = 1080;
const H = 1920;
const INK = "#15082E";
const FD = '"Clash Display", system-ui, sans-serif';
const FB = '"DM Sans", system-ui, sans-serif';
const display = (px: number) => `700 ${Math.round(px)}px ${FD}`;
const body = (px: number, w = 800) => `${w} ${Math.round(px)}px ${FB}`;

type Ctx = CanvasRenderingContext2D;

function colorOf(i: number | undefined): MascotColor {
  return MASCOT_COLORS[Math.abs(i ?? 0) % MASCOT_COLORS.length];
}

/** Couleur d'encre lisible sur un fond (clair → encre, foncé → blanc). */
function inkOn(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length < 6) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? INK : "#fff";
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2));
}

/** Sticker : fond, contour #15082E et ombre décalée vers le bas. */
function sticker(ctx: Ctx, x: number, y: number, w: number, h: number, bg: string, opt: { r?: number; shadow?: number; tilt?: number; line?: number } = {}) {
  const { r = 44, shadow = 12, tilt = 0, line = 7 } = opt;
  ctx.save();
  if (tilt) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  rr(ctx, x, y + shadow, w, h, r);
  ctx.fillStyle = INK;
  ctx.fill();
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = line;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

/**
 * Clash Display a des espaces très serrés (l'app ajoute word-spacing: 0.12em) :
 * on les remplace par une espace d’un quart de cadratin pour mesurer et dessiner.
 */
function tx(ctx: Ctx, s: string): string {
  return ctx.font.includes("Clash") ? s.replace(/ /g, "\u2005") : s;
}
function measure(ctx: Ctx, s: string): number {
  return ctx.measureText(tx(ctx, s)).width;
}

/** Coupe un texte en lignes (mots ; un mot trop long est coupé, de préférence après un trait d'union). */
function wrap(ctx: Ctx, text: string, width: number): { lines: string[]; split: boolean } {
  const lines: string[] = [];
  let cur = "";
  let split = false;
  for (const word of text.split(/ +/)) {
    const tryLine = cur ? `${cur} ${word}` : word;
    if (measure(ctx, tryLine) <= width) { cur = tryLine; continue; }
    if (cur) lines.push(cur);
    cur = "";
    let w = word;
    while (measure(ctx, w) > width && w.length > 1) {
      split = true;
      let k = w.length - 1;
      while (k > 1 && measure(ctx, w.slice(0, k)) > width) k--;
      const hy = w.slice(0, k).lastIndexOf("-");
      if (hy > 0) k = hy + 1;
      lines.push(w.slice(0, k));
      w = w.slice(k);
    }
    cur = w;
  }
  if (cur) lines.push(cur);
  return { lines, split };
}

/**
 * Plus grande taille (≤ max) où le texte tient en `maxLines` lignes, sans couper
 * de mot si possible ; sinon en coupant ; en dernier recours tronqué « … ».
 */
function fit(ctx: Ctx, text: string, font: (px: number) => string, width: number, max: number, min: number, maxLines: number) {
  for (const allowSplit of [false, true]) {
    for (let px = max; px >= min; px -= 2) {
      ctx.font = font(px);
      const { lines, split } = wrap(ctx, text, width);
      if (lines.length <= maxLines && (allowSplit || !split)) return { px, lines };
    }
  }
  ctx.font = font(min);
  const lines = wrap(ctx, text, width).lines.slice(0, maxLines);
  let last = lines[maxLines - 1] ?? "";
  while (last.length > 1 && measure(ctx, `${last}…`) > width) last = last.slice(0, -1);
  lines[maxLines - 1] = `${last.trimEnd()}…`;
  return { px: min, lines };
}

function drawLines(ctx: Ctx, lines: string[], x: number, y: number, lh: number, color: string, align: CanvasTextAlign = "center") {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  lines.forEach((l, i) => ctx.fillText(tx(ctx, l), x, y + i * lh));
}

/* Décor du fond : lueurs, trame de points, petits dessins (comme l'accueil, figé) */
const DOODLES: { k: "star" | "sparkle" | "heart" | "squiggle" | "bolt" | "plus"; x: number; y: number; s: number; r: number; c: string }[] = [
  { k: "sparkle", x: 70, y: 470, s: 70, r: -12, c: "#FFD23F" },
  { k: "heart", x: 960, y: 520, s: 64, r: 14, c: "#FF3EA5" },
  { k: "star", x: 990, y: 980, s: 72, r: 10, c: "#3DDC97" },
  { k: "squiggle", x: 40, y: 1080, s: 84, r: -8, c: "#4ECDC4" },
  { k: "bolt", x: 70, y: 1480, s: 66, r: -14, c: "#FF6B5B" },
  { k: "sparkle", x: 1000, y: 1420, s: 56, r: 8, c: "#A98BFF" },
  { k: "plus", x: 930, y: 140, s: 48, r: 0, c: "#4ECDC4" },
  { k: "star", x: 120, y: 120, s: 52, r: -18, c: "#FF3EA5" },
  { k: "plus", x: 140, y: 1780, s: 40, r: 0, c: "#FFD23F" },
  { k: "heart", x: 950, y: 1800, s: 46, r: -10, c: "#3DDC97" },
];
const PATHS = {
  star: "M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z",
  sparkle: "M12 2c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7z",
  heart: "M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z",
  bolt: "M13.5 2L5 13.5h6L9.5 22 19 9.5h-6z",
};

function background(ctx: Ctx) {
  ctx.fillStyle = "#120A33";
  ctx.fillRect(0, 0, W, H);
  const glow = (x: number, y: number, r: number, c: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, "rgba(18,10,51,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(80, 380, 820, "rgba(255,62,165,0.30)");
  glow(1040, 1250, 900, "rgba(122,78,232,0.45)");
  glow(300, 1900, 700, "rgba(78,205,196,0.16)");
  // Trame de points
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let y = 30; y < H; y += 60) for (let x = (y / 60) % 2 ? 30 : 60; x < W; x += 60) {
    ctx.beginPath();
    ctx.arc(x, y, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const d of DOODLES) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate((d.r * Math.PI) / 180);
    ctx.scale(d.s / 24, d.s / 24);
    ctx.translate(-12, -12);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (d.k === "squiggle") {
      ctx.strokeStyle = d.c;
      ctx.lineWidth = 3.4;
      ctx.stroke(new Path2D("M-2 14c3-6 6-6 9 0s6 6 9 0 6-6 9 0"));
    } else if (d.k === "plus") {
      ctx.strokeStyle = d.c;
      ctx.lineWidth = 4;
      ctx.stroke(new Path2D("M12 4v16M4 12h16"));
    } else {
      const p = new Path2D(PATHS[d.k]);
      ctx.fillStyle = d.c;
      ctx.fill(p);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.stroke(p);
    }
    ctx.restore();
  }
}

/** Logo « zinzin » : lettres stickers multicolores, contour et ombre encre. */
const LETTERS = [
  { l: "z", r: -6, c: "#FFD23F" }, { l: "i", r: 4, c: "#FF3EA5" }, { l: "n", r: -3, c: "#3DDC97" },
  { l: "z", r: 5, c: "#4ECDC4" }, { l: "i", r: -5, c: "#FF6B5B" }, { l: "n", r: 3, c: "#A98BFF" },
];
function logo(ctx: Ctx, cx: number, baseline: number, size: number) {
  ctx.font = display(size);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const adv = LETTERS.map((x) => ctx.measureText(x.l).width - size * 0.06);
  const total = adv.reduce((a, b) => a + b, 0);
  let x = cx - total / 2;
  LETTERS.forEach((L, i) => {
    const w = adv[i];
    ctx.save();
    ctx.translate(x + w / 2, baseline - size * 0.3);
    ctx.rotate((L.r * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(baseline - size * 0.3));
    ctx.lineJoin = "round";
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.strokeText(L.l, x, baseline + size * 0.07);
    ctx.fillText(L.l, x, baseline + size * 0.07);
    ctx.strokeText(L.l, x, baseline);
    ctx.fillStyle = L.c;
    ctx.fillText(L.l, x, baseline);
    ctx.restore();
    x += w;
  });
}

async function loadSvg(svg: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

function blobSvg(o: ShareBlobOpts): string {
  try {
    return blobArt?.(o) ?? fallbackBlob(o);
  } catch {
    return fallbackBlob(o);
  }
}

function gameName(card: ShareCard): string {
  return card.chip ?? (GAME_NAMES[card.game] ? pick(GAME_NAMES[card.game]) : "Zinzin");
}

/** Charge les polices de l'app (sous-ensembles accentués compris) avant de dessiner. */
async function loadFonts(sample: string) {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = [display(80), body(40, 800), body(40, 700)];
  await Promise.all(specs.map((f) => document.fonts.load(f, sample).catch(() => [])));
  await document.fonts.ready;
}

/* Hauteurs des blocs (pour tout faire tenir sans rien couper) */
const CW = 920; // largeur des stickers
const CX = (W - CW) / 2;
const ROW_H = 124;
/** Le blob chevauche le haut du bloc principal ; marge haute du texte sous lui */
const OVER = 56;
const HERO_TOP = 18;
const AWARD_H = 170;

interface HeroLayout {
  h: number;
  kicker?: { px: number; lines: string[] };
  big?: { px: number; lines: string[] };
  title?: { px: number; lines: string[] };
  sub?: { px: number; lines: string[] };
}

function layoutHero(ctx: Ctx, hero: NonNullable<ShareCard["hero"]>, compact: boolean): HeroLayout {
  const inner = CW - 110;
  const out: HeroLayout = { h: 64 + HERO_TOP };
  if (hero.kicker) { out.kicker = fit(ctx, hero.kicker, (p) => body(p), inner, 42, 30, 2); out.h += out.kicker.lines.length * out.kicker.px * 1.2; }
  if (hero.big) { out.big = fit(ctx, hero.big, display, inner, compact ? 210 : 290, 90, 1); out.h += out.big.px * 0.98 + 8; }
  if (hero.title) {
    out.title = fit(ctx, hero.title, display, inner, hero.big ? 76 : compact ? 96 : 112, 44, 3);
    out.h += out.title.lines.length * out.title.px * 1.04 + 8;
  }
  if (hero.sub) { out.sub = fit(ctx, hero.sub, (p) => body(p, 700), inner, 38, 28, compact ? 2 : 3); out.h += out.sub.lines.length * out.sub.px * 1.25 + 10; }
  return out;
}

/** Dessine la carte et renvoie le canvas 1080×1920. */
export async function renderShareCard(card: ShareCard): Promise<HTMLCanvasElement> {
  const lang = getLang();
  const s = STR[lang];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const sample = [
    gameName(card), card.hero?.kicker, card.hero?.big, card.hero?.title, card.hero?.sub, card.footnote, s.playOn, SHARE_SITE,
    ...(card.awards ?? []).flatMap((a) => [a.label, a.name]),
    ...(card.rows ?? []).flatMap((r) => [r.name, r.value, r.note]),
  ].filter(Boolean).join(" ");
  await loadFonts(`${sample} zinzin0123456789`);

  background(ctx);

  // ── En-tête : logo + étiquette du jeu
  logo(ctx, W / 2, 262, 190);
  const chip = gameName(card);
  const chipFit = fit(ctx, chip, display, 760, 54, 36, 1);
  ctx.font = display(chipFit.px);
  const chipW = Math.min(860, measure(ctx, chipFit.lines[0]) + 90);
  const chipY = 330;
  sticker(ctx, (W - chipW) / 2, chipY, chipW, chipFit.px + 50, "#fff", { r: 999, shadow: 9, tilt: -2, line: 6 });
  ctx.save();
  ctx.translate(W / 2, chipY + (chipFit.px + 50) / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.textBaseline = "middle";
  drawLines(ctx, chipFit.lines, 0, chipFit.px * 0.06, 0, INK);
  ctx.restore();

  // ── Corps : on calcule les hauteurs pour tout faire tenir entre l'en-tête et le pied
  const top = chipY + chipFit.px + 50 + 40;
  const bottom = 1650;
  const avail = bottom - top;
  const rowsAll = card.rows ?? [];
  const awards = (card.awards ?? []).slice(0, 3);
  const gap = 34;

  let blob = 400;
  let rowsN = rowsAll.length;
  const compact = rowsAll.length > 0 || awards.length > 0;
  let hero = card.hero ? layoutHero(ctx, card.hero, compact) : null;
  let footFit = card.footnote ? fit(ctx, card.footnote, display, CW - 90, 50, 34, 2) : null;
  const total = () =>
    blob - OVER // le blob chevauche le haut du premier bloc
    + (hero ? hero.h + gap : 0)
    + (awards.length ? awards.length * (AWARD_H + 22) + gap - 22 : 0)
    + (rowsN ? rowsN * (ROW_H + 16) - 16 + (rowsN < rowsAll.length ? 52 : 0) + gap : 0)
    + (footFit ? footFit.lines.length * footFit.px * 1.1 + 60 + gap : 0);
  while (total() > avail && blob > 230) blob -= 10;
  while (total() > avail && rowsN > 3) rowsN--;
  if (total() > avail && hero && card.hero) hero = layoutHero(ctx, { ...card.hero, sub: undefined }, true);
  if (total() > avail) footFit = null;
  while (total() > avail && rowsN > 1) rowsN--;

  let y = top + Math.max(0, (avail - total()) / 2);
  const blobY = y;
  y += blob - OVER;

  // Bloc principal
  if (hero && card.hero) {
    const bg = card.hero.bg ?? "#FFD23F";
    const ink = inkOn(bg);
    sticker(ctx, CX, y, CW, hero.h, bg, { r: 56, shadow: 14, tilt: -1.5 });
    ctx.save();
    ctx.translate(W / 2, y + hero.h / 2);
    ctx.rotate((-1.5 * Math.PI) / 180);
    ctx.translate(-W / 2, -(y + hero.h / 2));
    let ty = y + 42 + HERO_TOP;
    if (hero.kicker) {
      ctx.font = body(hero.kicker.px);
      ctx.globalAlpha = 0.8;
      drawLines(ctx, hero.kicker.lines, W / 2, ty + hero.kicker.px, hero.kicker.px * 1.2, ink);
      ctx.globalAlpha = 1;
      ty += hero.kicker.lines.length * hero.kicker.px * 1.2;
    }
    if (hero.big) {
      ctx.font = display(hero.big.px);
      drawLines(ctx, hero.big.lines, W / 2, ty + hero.big.px * 0.82, 0, ink);
      ty += hero.big.px * 0.98 + 8;
    }
    if (hero.title) {
      ctx.font = display(hero.title.px);
      drawLines(ctx, hero.title.lines, W / 2, ty + hero.title.px * 0.86, hero.title.px * 1.04, ink);
      ty += hero.title.lines.length * hero.title.px * 1.04 + 8;
    }
    if (hero.sub) {
      ctx.font = body(hero.sub.px, 700);
      ctx.globalAlpha = 0.85;
      drawLines(ctx, hero.sub.lines, W / 2, ty + hero.sub.px * 1.05, hero.sub.px * 1.25, ink);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    y += hero.h + gap;
  }

  // Prix (Chut : le plus sérieux, celui qui a craqué…)
  const minis: { x: number; y: number; size: number; o: ShareBlobOpts }[] = [];
  awards.forEach((a, i) => {
    const bg = a.bg ?? "#fff";
    const ink = inkOn(bg);
    const tilt = i % 2 ? 1.2 : -1.2;
    sticker(ctx, CX, y, CW, AWARD_H, bg, { r: 44, shadow: 11, tilt });
    ctx.save();
    ctx.translate(W / 2, y + AWARD_H / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-W / 2, -(y + AWARD_H / 2));
    const tx = CX + 180;
    const lab = fit(ctx, a.label, (p) => body(p), CW - 220, 36, 26, 1);
    ctx.font = body(lab.px);
    drawLines(ctx, lab.lines, tx, y + 64, 0, ink, "left");
    const nm = fit(ctx, a.name, display, CW - 220, 66, 38, 1);
    ctx.font = display(nm.px);
    drawLines(ctx, nm.lines, tx, y + 72 + nm.px * 0.9, 0, ink, "left");
    ctx.restore();
    minis.push({ x: CX + 30, y: y + 25, size: 120, o: { color: colorOf(a.colorIndex), mood: a.mood ?? "laughing", seed: i + 2 } });
    y += AWARD_H + 22;
  });
  if (awards.length) y += gap - 22;

  // Classement
  const rows = rowsAll.slice(0, rowsN);
  rows.forEach((r, i) => {
    const rank = r.rank ?? i + 1;
    const first = rank === 1;
    const bg = first ? "#FFD23F" : "#fff";
    const tilt = first ? -1.2 : i % 2 ? 0.7 : -0.5;
    sticker(ctx, CX, y, CW, ROW_H, bg, { r: 40, shadow: first ? 10 : 8, tilt, line: 6 });
    ctx.save();
    ctx.translate(W / 2, y + ROW_H / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-W / 2, -(y + ROW_H / 2));
    // Rang
    ctx.beginPath();
    ctx.arc(CX + 62, y + ROW_H / 2, 34, 0, Math.PI * 2);
    ctx.fillStyle = first ? INK : "#F1ECFF";
    ctx.fill();
    ctx.font = display(40);
    ctx.textBaseline = "middle";
    drawLines(ctx, [String(rank)], CX + 62, y + ROW_H / 2 + 2, 0, first ? "#FFD23F" : INK);
    ctx.textBaseline = "alphabetic";
    // Score
    let right = CX + CW - 34;
    if (r.value) {
      const v = fit(ctx, r.value, display, 260, 52, 30, 1);
      ctx.font = display(v.px);
      drawLines(ctx, v.lines, right, y + ROW_H / 2 + v.px * 0.34, 0, INK, "right");
      right -= measure(ctx, v.lines[0]) + 24;
    }
    // Prénom + note
    const nx = CX + 210;
    const nw = right - nx;
    const nm = fit(ctx, r.name, display, nw, 52, 30, 1);
    ctx.font = display(nm.px);
    if (r.note) {
      drawLines(ctx, nm.lines, nx, y + 22 + nm.px * 0.86, 0, INK, "left");
      const nt = fit(ctx, r.note, (p) => body(p, 700), nw, 30, 24, 1);
      ctx.font = body(nt.px, 700);
      drawLines(ctx, nt.lines, nx, y + ROW_H - 26, 0, "#4A3A66", "left");
    } else {
      drawLines(ctx, nm.lines, nx, y + ROW_H / 2 + nm.px * 0.34, 0, INK, "left");
    }
    ctx.restore();
    minis.push({ x: CX + 104, y: y + 18, size: 92, o: { color: colorOf(r.colorIndex), mood: first ? "laughing" : "happy", seed: i, crown: false } });
    y += ROW_H + 16;
  });
  if (rows.length) {
    y -= 16;
    if (rows.length < rowsAll.length) {
      ctx.font = body(36);
      drawLines(ctx, [s.more(rowsAll.length - rows.length)], W / 2, y + 48, 0, "rgba(255,255,255,0.8)");
      y += 52;
    }
    y += gap;
  }

  // Phrase finale
  if (footFit) {
    const h = footFit.lines.length * footFit.px * 1.1 + 60;
    const fbg = card.footBg ?? "#FF6B5B";
    sticker(ctx, CX + 20, y, CW - 40, h, fbg, { r: 40, shadow: 10, tilt: 1.5 });
    ctx.save();
    ctx.translate(W / 2, y + h / 2);
    ctx.rotate((1.5 * Math.PI) / 180);
    ctx.font = display(footFit.px);
    drawLines(ctx, footFit.lines, 0, -h / 2 + 30 + footFit.px * 0.86, footFit.px * 1.1, inkOn(fbg));
    ctx.restore();
  }

  // Blobs (après les blocs : ils débordent par-dessus)
  const main = await loadSvg(blobSvg({ game: card.game, color: card.color, mood: card.mood, crown: card.crown, seed: 1 }));
  if (main) ctx.drawImage(main, (W - blob * ART) / 2, blobY - blob * ART_PAD, blob * ART, blob * ART);
  const imgs = await Promise.all(minis.map((m) => loadSvg(blobSvg(m.o))));
  minis.forEach((m, i) => {
    const img = imgs[i];
    if (img) ctx.drawImage(img, m.x - m.size * ART_PAD, m.y - m.size * ART_PAD, m.size * ART, m.size * ART);
  });

  // ── Pied : « Joue sur Zinzin · zinzin-app.com »
  ctx.font = display(64);
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.textAlign = "center";
  ctx.strokeText(tx(ctx, s.playOn), W / 2, 1752);
  drawLines(ctx, [s.playOn], W / 2, 1752, 0, "#fff");
  ctx.font = body(44);
  const pw = ctx.measureText(SHARE_SITE).width + 80;
  sticker(ctx, (W - pw) / 2, 1782, pw, 78, "#FFD23F", { r: 999, shadow: 8, tilt: 1, line: 6 });
  ctx.save();
  ctx.translate(W / 2, 1782 + 39);
  ctx.rotate(Math.PI / 180);
  ctx.textBaseline = "middle";
  ctx.font = body(44);
  drawLines(ctx, [SHARE_SITE], 0, 2, 0, INK);
  ctx.restore();

  return canvas;
}

/* ───────── Partage ───────── */
const isNative = () =>
  Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

export type ShareOutcome = "shared" | "saved" | "cancelled" | "error";

const cancelled = (e: unknown) => /cancel|abort/i.test(String((e as { message?: string })?.message ?? e)) || (e as { name?: string })?.name === "AbortError";

/**
 * Génère l'image et ouvre la feuille de partage :
 * - app native : fichier PNG dans le cache de l'app (@capacitor/filesystem) → @capacitor/share ;
 * - web : Web Share API avec fichier, sinon téléchargement du PNG.
 */
export async function shareResultCard(card: ShareCard): Promise<ShareOutcome> {
  const s = STR[getLang()];
  const text = `${card.text}\n${s.tail} https://${SHARE_SITE}`;
  let canvas: HTMLCanvasElement;
  try {
    canvas = await renderShareCard(card);
  } catch {
    return "error";
  }
  const name = `zinzin-${card.game}.png`;

  if (isNative()) {
    const { Share } = await import("@capacitor/share");
    let uri: string | null = null;
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const data = canvas.toDataURL("image/png").split(",")[1];
      uri = (await Filesystem.writeFile({ path: name, data, directory: Directory.Cache })).uri;
    } catch { /* plugin pas encore synchronisé : on partage au moins le texte */ }
    try {
      await Share.share(uri ? { text, files: [uri], dialogTitle: s.dialog } : { text, dialogTitle: s.dialog });
      return "shared";
    } catch (e) {
      return cancelled(e) ? "cancelled" : "error";
    }
  }

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return "error";
  const file = new File([blob], name, { type: "image/png" });
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch (e) {
      if (cancelled(e)) return "cancelled";
      // Geste utilisateur expiré, etc. : on retombe sur le téléchargement
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "saved";
}
