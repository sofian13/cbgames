/**
 * Perso personnalisé d'un joueur (« Ma bande ») : données pures, sans React.
 * - Le catalogue (couleurs, yeux, cheveux, chapeaux, visage, accessoires) est
 *   ORDONNÉ ET EN AJOUT SEUL : l'ordre sert au code de bande (index compacts).
 *   On ajoute toujours à la fin, on ne retire ni ne réordonne jamais.
 * - Aucun élément ne porte le nom d'une œuvre ou d'un personnage : coupes et
 *   accessoires génériques, à combiner librement (pas de tenue prédéfinie).
 */

export type AvatarTab = "color" | "eyes" | "hair" | "hat" | "face" | "extra";
export type AvatarSlot = "eyes" | "hair" | "hat" | "face" | "extra";

export interface AvatarLook {
  color: string;
  eyes: string;
  hair: string;
  /** "auto" = couleur propre à la coupe */
  hairColor: string;
  hat: string;
  face: string;
  extra: string;
}

export interface AvatarItem {
  id: string;
  /** Gratuit (sinon Zinzin+ dans l'app) */
  free: boolean;
  /** Équivalent gratuit le plus proche (affichage sans Zinzin+) */
  fallback?: string;
  /** Secret (easter egg, voir secrets.ts) : caché dans l'éditeur tant qu'il n'est pas trouvé, jamais tiré au hasard */
  secret?: boolean;
}

/* ───────── Couleurs du blob (toutes gratuites) ───────── */
export const AVATAR_PALETTE: Record<string, { body: string; deep: string; hi: string }> = {
  pink:     { body: "#FF3EA5", deep: "#C41F78", hi: "#FF9DD0" },
  yellow:   { body: "#FFD23F", deep: "#E09A00", hi: "#FFF0A8" },
  purple:   { body: "#7A4EE8", deep: "#4C27B8", hi: "#B9A0FF" },
  mint:     { body: "#3DDC97", deep: "#1C9E68", hi: "#A8F5D0" },
  sky:      { body: "#4ECDC4", deep: "#22938C", hi: "#B4F1EC" },
  coral:    { body: "#FF6B5B", deep: "#CF3B2C", hi: "#FFC0B8" },
  lavender: { body: "#A98BFF", deep: "#6E50D8", hi: "#E1D6FF" },
  white:    { body: "#F5F1E8", deep: "#C9BFA8", hi: "#FFFFFF" },
  orange:   { body: "#FF9A2E", deep: "#D2650A", hi: "#FFD3A1" },
  cherry:   { body: "#E8304A", deep: "#A3132A", hi: "#FF9AA8" },
  blue:     { body: "#3D7BFF", deep: "#1F4FC4", hi: "#A9C6FF" },
  forest:   { body: "#2FA86A", deep: "#1A7048", hi: "#93E0B6" },
  cocoa:    { body: "#A8693E", deep: "#6E3F1F", hi: "#E2B58E" },
  peach:    { body: "#FFC4A3", deep: "#E08E68", hi: "#FFE6D6" },
  night:    { body: "#5A4E85", deep: "#352B5A", hi: "#9F94CC" },
  lime:     { body: "#C6F04A", deep: "#8DB51C", hi: "#EBFFB0" },
};
export const AVATAR_COLORS = Object.keys(AVATAR_PALETTE);

/* ───────── Couleurs de cheveux (gratuites) ───────── */
export const HAIR_COLORS: Record<string, string> = {
  auto: "",
  black: "#221838",
  brown: "#6B3E1F",
  blond: "#F5C842",
  ginger: "#E8642A",
  pink: "#FF7EC0",
  blue: "#3D7BFF",
  green: "#2FA84F",
  white: "#EDEBF5",
  purple: "#8B5CF6",
};
export const HAIR_COLOR_IDS = Object.keys(HAIR_COLORS);

/* ───────── Éléments ───────── */
const item = (id: string, free: boolean, fallback?: string): AvatarItem => ({ id, free, fallback });
/** Accessoire secret : gratuit une fois trouvé (récompense) */
const secretItem = (id: string): AvatarItem => ({ id, free: true, secret: true });

export const AVATAR_ITEMS: Record<AvatarSlot, AvatarItem[]> = {
  eyes: [
    item("classic", true), item("big", true), item("happy", true), item("sleepy", true), item("determined", true),
    item("star", true), item("heart", true), item("wink", true), item("dots", true), item("cross", true),
    // Ajout v4
    item("allnighter", true), item("tears", true),
  ],
  hair: [
    item("none", true), item("swoop", true), item("afro", true), item("mohawk", true), item("bun", true),
    item("pigtails", false, "bun"), item("golden", false, "mohawk"), item("swordsman", false, "buzz"),
    item("hero", false, "mohawk"), item("long", false, "swoop"), item("buzz", true), item("curly", false, "afro"),
    item("bowl", false, "swoop"), item("emo", false, "swoop"), item("flame", false, "mohawk"),
    // Coupes « manga » (ajout v2)
    item("silver", false, "swoop"), item("ponytail", false, "bun"), item("messy", false, "mohawk"),
    item("twintails", false, "bun"), item("sticks", false, "bun"), item("hedgehog", true),
    item("streak", false, "swoop"), item("peekaboo", false, "swoop"), item("ahoge", false, "swoop"),
    item("mane", false, "afro"),
    // Ajout v4
    item("mullet", true), item("quiff", true),
  ],
  hat: [
    item("none", true), item("straw", false, "bucket"), item("cap", true), item("beanie", true), item("crown", false, "party"),
    item("horns", false, "party"), item("bucket", true), item("ninja", false, "beanie"), item("cowboy", false, "bucket"),
    item("bow", true), item("halo", false, "party"), item("tophat", false, "cap"), item("party", true),
    item("bandana", false, "beanie"),
    // Secret : trouvé en touchant le blob doré de l'accueil (ajout v3)
    secretItem("goldhalo"),
    // Ajout v4
    item("flowers", true), item("propeller", false, "cap"),
  ],
  face: [
    item("none", true), item("shades", true), item("round", true), item("moustache", false, "none"), item("scar", false, "plaster"),
    item("plaster", true), item("mask", false, "none"), item("patch", false, "shades"), item("blush", true),
    item("goggles", false, "round"), item("freckles", true), item("beard", false, "none"), item("domino", false, "shades"),
    item("crossscar", false, "plaster"), item("bandages", true), item("earring", false, "none"),
    // Ajout v4
    item("clown", true), item("glasses3d", false, "round"), item("goldtooth", true),
  ],
  extra: [
    item("none", true), item("scarf", true), item("armband", false, "scarf"), item("necklace", true), item("bowtie", true),
    item("cape", false, "scarf"), item("tie", false, "bowtie"), item("headphones", false, "necklace"),
    item("wings", false, "none"), item("lei", false, "necklace"),
    item("katana", false, "none"), item("longscarf", false, "scarf"),
    // Ajout v4
    item("medal", true), item("balloon", true),
  ],
};

export const AVATAR_SLOTS: AvatarSlot[] = ["eyes", "hair", "hat", "face", "extra"];

export const DEFAULT_LOOK: AvatarLook = {
  color: "pink", eyes: "classic", hair: "none", hairColor: "auto", hat: "none", face: "none", extra: "none",
};

const findItem = (slot: AvatarSlot, id: string) => AVATAR_ITEMS[slot].find((x) => x.id === id);

/** Élément gratuit ? (les couleurs et les yeux le sont toujours) */
export function isFreeItem(slot: AvatarSlot, id: string): boolean {
  return findItem(slot, id)?.free ?? true;
}

/** Le look contient-il des éléments Zinzin+ ? */
export function lookHasPremium(look: AvatarLook): boolean {
  return AVATAR_SLOTS.some((s) => !isFreeItem(s, look[s]));
}

/** Version gratuite d'un look (équivalents gratuits les plus proches). */
export function freeLook(look: AvatarLook): AvatarLook {
  if (!lookHasPremium(look)) return look;
  const out = { ...look };
  for (const s of AVATAR_SLOTS) {
    const it = findItem(s, out[s]);
    if (it && !it.free) out[s] = it.fallback && isFreeItem(s, it.fallback) ? it.fallback : s === "eyes" ? "classic" : "none";
  }
  return out;
}

/** Valide un look venu du stockage ou d'un code (champs inconnus → défaut). */
export function sanitizeLook(v: unknown): AvatarLook | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  const color = AVATAR_PALETTE[str("color")] ? str("color") : DEFAULT_LOOK.color;
  const hairColor = str("hairColor") in HAIR_COLORS ? str("hairColor") : "auto";
  const look: AvatarLook = { ...DEFAULT_LOOK, color, hairColor };
  for (const s of AVATAR_SLOTS) look[s] = findItem(s, str(s)) ? str(s) : DEFAULT_LOOK[s];
  return look;
}

/** Look de départ d'un joueur (sa couleur actuelle si on la connaît). */
export function baseLook(color?: string): AvatarLook {
  return { ...DEFAULT_LOOK, color: color && AVATAR_PALETTE[color] ? color : DEFAULT_LOOK.color };
}

/**
 * Perso « de base » d'un joueur qui n'a pas encore de perso dans « Ma bande » :
 * même dessin que les persos (contour, reflet), sans cheveux ni accessoire, dans la
 * couleur de son rang (couleurs du blob par défaut = mêmes clés que AVATAR_PALETTE).
 * Comme il n'a pas de regard choisi, ses yeux suivent l'humeur du moment (clin d'œil,
 * cœurs, étoiles, rire…) et « cool » met les lunettes noires, comme l'ancien blob.
 */
const MOOD_EYES: Record<string, string> = {
  wink: "wink", love: "heart", kiss: "heart", mindblown: "star", laughing: "happy", rofl: "happy",
  asleep: "sleepy", shocked: "big",
};
export function defaultLookFor(color?: string, mood?: string): AvatarLook {
  return {
    ...baseLook(color),
    eyes: (mood && MOOD_EYES[mood]) || "classic",
    face: mood === "cool" ? "shades" : "none",
  };
}

/**
 * Débord latéral (repère 120, au-delà du perso nu, du côté qui dépasse le plus) des coupes,
 * chapeaux et accessoires larges : mesuré au pixel sur le rendu (couettes, ailes, casquette…).
 * Dans une rangée serrée, le perso est réduit pour que rien ne déborde de sa case
 * (sinon une couette cache la 1re lettre du prénom). < 5 : négligeable, absent de la table.
 */
const SIDE_OVER: Partial<Record<AvatarSlot, Record<string, number>>> = {
  hair: { afro: 14, pigtails: 19, golden: 19, hero: 19, long: 8, curly: 11, silver: 8, ponytail: 23, messy: 16, twintails: 26.5, mane: 19, mullet: 10 },
  hat: { straw: 6, cap: 25, ninja: 22, cowboy: 17, bandana: 19 },
  face: { bandages: 13.5 },
  extra: { armband: 20, cape: 17, headphones: 10, wings: 26, katana: 18, longscarf: 43, balloon: 22.5 },
};
export function lookSideOverflow(look: AvatarLook): number {
  return Math.max(0, ...AVATAR_SLOTS.map((s) => SIDE_OVER[s]?.[look[s]] ?? 0));
}

/** Tirage au hasard : chaque élément est tiré séparément (pas de tenue toute faite). */
export function randomLook(onlyFree = false, rnd: () => number = Math.random): AvatarLook {
  const pickOf = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const pool = (s: AvatarSlot) => AVATAR_ITEMS[s].filter((x) => !x.secret && (!onlyFree || x.free)).map((x) => x.id);
  // Un peu de « rien » pour ne pas surcharger le perso
  const maybe = (s: AvatarSlot, p: number) => (rnd() < p ? pickOf(pool(s).filter((x) => x !== "none")) : "none");
  const hat = maybe("hat", 0.55);
  return {
    color: pickOf(AVATAR_COLORS),
    eyes: pickOf(pool("eyes")),
    hair: maybe("hair", 0.8),
    hairColor: rnd() < 0.6 ? "auto" : pickOf(HAIR_COLOR_IDS),
    hat,
    face: maybe("face", 0.45),
    extra: maybe("extra", 0.4),
  };
}

export function sameLook(a: AvatarLook, b: AvatarLook): boolean {
  return a.color === b.color && a.hairColor === b.hairColor && AVATAR_SLOTS.every((s) => a[s] === b[s]);
}

/* ───────── Code de bande (hors ligne) ─────────
 * « ZZB1-… » : base64url d'un JSON compact [[prénom, look, moi?], …].
 * Le look tient en 7 caractères base36 : index dans le catalogue ci-dessus.
 * Un caractère par élément : 36 éléments max par liste (index 0 à z), ne jamais dépasser.
 * Index inconnu (code venu d'une version plus récente) → élément par défaut.
 */
const CODE_PREFIX = "ZZB1-";
export const BAND_MAX = 16;
export const NAME_MAX = 16;
const CODE_MAX_LEN = 6000;

export interface BandMember { name: string; look: AvatarLook; me?: boolean }

const ORDER: { key: keyof AvatarLook; list: () => string[] }[] = [
  { key: "color", list: () => AVATAR_COLORS },
  { key: "eyes", list: () => AVATAR_ITEMS.eyes.map((x) => x.id) },
  { key: "hair", list: () => AVATAR_ITEMS.hair.map((x) => x.id) },
  { key: "hairColor", list: () => HAIR_COLOR_IDS },
  { key: "hat", list: () => AVATAR_ITEMS.hat.map((x) => x.id) },
  { key: "face", list: () => AVATAR_ITEMS.face.map((x) => x.id) },
  { key: "extra", list: () => AVATAR_ITEMS.extra.map((x) => x.id) },
];

export function packLook(l: AvatarLook): string {
  return ORDER.map(({ key, list }) => Math.max(0, list().indexOf(l[key])).toString(36)).join("");
}

export function unpackLook(s: string): AvatarLook {
  const look: AvatarLook = { ...DEFAULT_LOOK };
  ORDER.forEach(({ key, list }, i) => {
    const n = parseInt(s[i] ?? "", 36);
    const id = Number.isFinite(n) ? list()[n] : undefined;
    if (id !== undefined) look[key] = id; // index inconnu (version plus récente) : défaut
  });
  return look;
}

/** Nettoie un prénom (texte brut, sans caractères de contrôle, 16 car. max). */
export function cleanName(v: unknown): string {
  if (typeof v !== "string") return "";
  return Array.from(v.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, "").replace(/\s+/g, " ").trim()).slice(0, NAME_MAX).join("").trim();
}

function toB64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function encodeBand(members: BandMember[]): string {
  const data = members.slice(0, BAND_MAX).map((m) => {
    const row: (string | number)[] = [cleanName(m.name), packLook(m.look)];
    if (m.me) row.push(1);
    return row;
  });
  return CODE_PREFIX + toB64Url(JSON.stringify(data));
}

/** Décode un code de bande ; null si invalide. Ne lève jamais. */
export function decodeBand(input: string): BandMember[] | null {
  try {
    if (typeof input !== "string" || input.length > CODE_MAX_LEN * 2) return null;
    const at = input.toUpperCase().indexOf(CODE_PREFIX);
    if (at < 0) return null;
    const rest = input.slice(at + CODE_PREFIX.length);
    // Code seul, ou coupé par des retours à la ligne (messageries)
    const tries = [rest.match(/^[A-Za-z0-9_-]+/)?.[0] ?? "", rest.replace(/\s+/g, "").match(/^[A-Za-z0-9_-]+/)?.[0] ?? ""];
    let data: unknown = null;
    for (const body of tries) {
      if (!body || body.length > CODE_MAX_LEN) continue;
      try { data = JSON.parse(fromB64Url(body)); break; } catch { /* essai suivant */ }
    }
    if (!Array.isArray(data)) return null;
    const out: BandMember[] = [];
    const seen = new Set<string>();
    let me = false;
    for (const row of data.slice(0, BAND_MAX * 2)) {
      if (!Array.isArray(row)) continue;
      const name = cleanName(row[0]);
      const key = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      const look = unpackLook(typeof row[1] === "string" ? row[1].slice(0, 12) : "");
      const isMe = row[2] === 1 && !me;
      if (isMe) me = true;
      out.push(isMe ? { name, look, me: true } : { name, look });
      if (out.length >= BAND_MAX) break;
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}
