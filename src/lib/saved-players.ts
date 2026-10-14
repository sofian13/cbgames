/**
 * Mémoire des prénoms (site + app) : la dernière table utilisée, l'historique
 * des prénoms récents, et « Ma bande » (jusqu'à 16 persos : prénom + look), en localStorage.
 * Tout est protégé par try/catch (stockage indisponible = on oublie, sans casser).
 * Migration douce : les anciennes données (sans looks ni bande) restent valides.
 */
import { BAND_MAX, cleanName, sanitizeLook, type AvatarLook } from "@/lib/avatar/look";

const KEY = "zz-players-v1";
const MAX_RECENT = 20;
const EVENT = "zz:players";

interface Stored {
  /** Dernière table lancée (« C'est parti ! ») */
  last: string[];
  /** Prénoms distincts, les plus récents d'abord */
  recent: string[];
  /** Look personnalisé par prénom (clé : prénom normalisé) — optionnel */
  looks: Record<string, AvatarLook>;
  /** « Ma bande » : prénoms dans l'ordre choisi (16 max) — optionnel */
  band: string[];
  /** Le joueur principal (« Moi »), parmi la bande — optionnel */
  me: string | null;
}

/** Un perso de « Ma bande ». */
export interface BandEntry { name: string; look: AvatarLook | null; me: boolean }

/** Clé de comparaison : sans casse, sans accents, espaces normalisés. */
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function clean(names: unknown): string[] {
  if (!Array.isArray(names)) return [];
  return names.filter((n): n is string => typeof n === "string").map((n) => n.trim()).filter(Boolean);
}

const EMPTY: Stored = { last: [], recent: [], looks: {}, band: [], me: null };

function parse(raw: string | null): Stored {
  if (!raw) return EMPTY;
  try {
    const p = JSON.parse(raw) as Partial<Record<keyof Stored, unknown>>;
    const looks: Record<string, AvatarLook> = {};
    if (p.looks && typeof p.looks === "object") {
      for (const [k, v] of Object.entries(p.looks as Record<string, unknown>).slice(0, 200)) {
        const l = sanitizeLook(v);
        if (l) looks[norm(k)] = l;
      }
    }
    const band = uniq(clean(p.band).map(cleanName)).slice(0, BAND_MAX);
    const me = typeof p.me === "string" && band.some((b) => norm(b) === norm(p.me as string)) ? (p.me as string) : null;
    return { last: clean(p.last), recent: clean(p.recent), looks, band, me };
  } catch {
    return EMPTY;
  }
}

// Mémoïsé sur le texte brut : instantané stable pour useSyncExternalStore
let cacheRaw: string | null | undefined;
let cache: Stored = EMPTY;

function read(): Stored {
  let raw: string | null = null;
  try {
    raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
  } catch {
    raw = null;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = parse(raw);
  }
  return cache;
}

function write(data: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* stockage indisponible */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Dédoublonne (casse/accents ignorés) en gardant la 1re occurrence. */
function uniq(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const k = norm(n);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out;
}

/** La dernière table utilisée (peut être vide). */
export function getSavedPlayers(): string[] {
  return [...read().last];
}

/** Historique des ~20 derniers prénoms distincts, les plus récents d'abord. */
export function getRecentNames(): string[] {
  return [...read().recent];
}

/** À appeler au lancement d'une partie : mémorise la table + l'historique. */
export function savePlayers(names: string[]): void {
  const last = uniq(clean(names));
  if (!last.length) return;
  const prev = read();
  write({ ...prev, last, recent: uniq([...last, ...prev.recent]).slice(0, MAX_RECENT) });
}

/** Même prénom ? (casse et accents ignorés) */
export function sameName(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

/* ── Jeux à deux (Pensez Pareil, Tu me connais ?) : le dernier duo ── */
const DUO_KEY = "zz-duo-v1";

/** Le dernier duo qui a joué, ou deux champs vides. */
export function getSavedDuo(): [string, string] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(DUO_KEY) : null;
    const v = raw ? JSON.parse(raw) : null;
    if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "string")) return [v[0], v[1]];
  } catch {
    /* stockage indisponible ou corrompu */
  }
  return ["", ""];
}

/** À appeler au lancement d'une partie à deux (alimente aussi les prénoms récents). */
export function saveDuo(names: [string, string]): void {
  const [a, b] = names.map((n) => n.trim());
  if (!a || !b) return;
  try {
    localStorage.setItem(DUO_KEY, JSON.stringify([a, b]));
  } catch {
    /* stockage indisponible */
  }
  const prev = read();
  write({ ...prev, recent: uniq([a, b, ...prev.recent]).slice(0, MAX_RECENT) });
}

/* ── Looks & « Ma bande » ── */

/** Abonnement aux changements (prénoms, looks, bande) — pour useSyncExternalStore. */
export function subscribePlayers(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

/** Instantané stable des données (change à chaque écriture) — pour useSyncExternalStore. */
export function playersVersion(): string {
  read();
  return cacheRaw ?? "";
}

/** Le look enregistré pour ce prénom, ou null. */
export function getPlayerLook(name: string): AvatarLook | null {
  const k = norm(name);
  return k ? read().looks[k] ?? null : null;
}

/** Enregistre (ou efface avec null) le look d'un prénom ; il rejoint la bande s'il reste de la place. */
export function setPlayerLook(name: string, look: AvatarLook | null): void {
  const n = cleanName(name);
  const k = norm(n);
  if (!k) return;
  const prev = read();
  const looks = { ...prev.looks };
  if (look) looks[k] = look;
  else delete looks[k];
  const inBand = prev.band.some((b) => norm(b) === k);
  const band = look && !inBand && prev.band.length < BAND_MAX ? [...prev.band, n] : prev.band;
  write({ ...prev, looks, band });
}

/** « Ma bande » dans l'ordre (16 max). */
export function getBand(): BandEntry[] {
  const s = read();
  return s.band.map((name) => ({ name, look: s.looks[norm(name)] ?? null, me: s.me !== null && norm(s.me) === norm(name) }));
}

/** Prénom du joueur principal (« Moi »), ou null. */
export function getMeName(): string | null {
  return read().me;
}

/**
 * Remplace toute la bande (ajout, suppression, ordre, renommage, import).
 * Les looks des persos retirés sont oubliés ; ceux des autres prénoms (tables récentes) restent.
 */
export function setBand(entries: { name: string; look: AvatarLook | null; me?: boolean }[]): void {
  const prev = read();
  const looks = { ...prev.looks };
  for (const b of prev.band) delete looks[norm(b)];
  const band: string[] = [];
  let me: string | null = null;
  for (const e of entries) {
    const n = cleanName(e.name);
    const k = norm(n);
    if (!k || band.some((b) => norm(b) === k) || band.length >= BAND_MAX) continue;
    band.push(n);
    if (e.look) looks[k] = e.look;
    if (e.me && !me) me = n;
  }
  write({ ...prev, looks, band, me });
}

/* ── Soirée Zinzin (app) : la bande enchaîne les jeux sans retaper les prénoms ──
 * Avant de lancer chaque jeu de la soirée, l'app « arme » la bande : le prochain
 * PlayersSetup monté la valide tout seul (une seule fois), si le nombre de joueurs
 * convient au jeu. En mémoire seulement : rien ne change hors soirée ni sur le site. */
let partyBand: string[] | null = null;

/** Arme le départ auto pour le prochain écran de joueurs (et mémorise la bande). */
export function armPartyBand(names: string[]): void {
  const band = uniq(clean(names));
  if (!band.length) return;
  savePlayers(band);
  if (band.length === 2) saveDuo([band[0], band[1]]);
  partyBand = band;
}

/** Désarme (fin du jeu, pause…). */
export function disarmPartyBand(): void {
  partyBand = null;
}

/** Appelé par PlayersSetup au montage : la bande à valider tout de suite, ou null. Consomme l'armement. */
export function takePartyBand(min: number, max: number): string[] | null {
  const band = partyBand;
  partyBand = null;
  if (!band || band.length < min || band.length > max) return null;
  return band;
}
