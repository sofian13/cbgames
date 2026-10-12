/**
 * Mémoire des prénoms (site + app, sans dépendance) : la dernière table
 * utilisée et l'historique des prénoms récents, en localStorage.
 * Tout est protégé par try/catch (stockage indisponible = on oublie, sans casser).
 */

const KEY = "zz-players-v1";
const MAX_RECENT = 20;

interface Stored {
  /** Dernière table lancée (« C'est parti ! ») */
  last: string[];
  /** Prénoms distincts, les plus récents d'abord */
  recent: string[];
}

/** Clé de comparaison : sans casse, sans accents, espaces normalisés. */
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function clean(names: unknown): string[] {
  if (!Array.isArray(names)) return [];
  return names.filter((n): n is string => typeof n === "string").map((n) => n.trim()).filter(Boolean);
}

function read(): Stored {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!raw) return { last: [], recent: [] };
    const p = JSON.parse(raw) as Partial<Stored>;
    return { last: clean(p.last), recent: clean(p.recent) };
  } catch {
    return { last: [], recent: [] };
  }
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
  return read().last;
}

/** Historique des ~20 derniers prénoms distincts, les plus récents d'abord. */
export function getRecentNames(): string[] {
  return read().recent;
}

/** À appeler au lancement d'une partie : mémorise la table + l'historique. */
export function savePlayers(names: string[]): void {
  const last = uniq(clean(names));
  if (!last.length) return;
  const prev = read();
  const data: Stored = { last, recent: uniq([...last, ...prev.recent]).slice(0, MAX_RECENT) };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* stockage indisponible */
  }
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
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...prev, recent: uniq([a, b, ...prev.recent]).slice(0, MAX_RECENT) }));
  } catch {
    /* stockage indisponible */
  }
}
