/**
 * Secrets de Zinzin (easter eggs) : accessoires cachés débloqués en jouant, et
 * clin d'œil du prénom « Zinzin ». Données locales uniquement (jamais annoncées).
 * - Accessoire secret : absent de l'éditeur tant qu'il n'est pas trouvé, gratuit ensuite
 *   (c'est une récompense, pas un élément Zinzin+).
 * - Prénom « Zinzin » (casse et accents ignorés) : couronne arc-en-ciel sur son perso.
 */

/** Chapeau secret débloqué en touchant le blob doré de l'accueil. */
export const SECRET_GOLD_HAT = "goldhalo";

const KEY = "zz-secrets";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

let cache: string[] | null = null;
const found = () => (cache ??= read());

const NONE: readonly string[] = [];
/** Secrets trouvés (même référence tant que rien ne change : useSyncExternalStore) */
export function getSecrets(): readonly string[] {
  return typeof window === "undefined" ? NONE : found();
}
export const getServerSecrets = () => NONE;

/** Secret déjà trouvé ? */
export function hasSecret(id: string): boolean {
  return found().includes(id);
}

/** Débloque un secret (persisté). Renvoie true si c'est une nouveauté. */
export function unlockSecret(id: string): boolean {
  if (hasSecret(id)) return false;
  cache = [...found(), id];
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* stockage indisponible : débloqué pour la session */ }
  listeners.forEach((f) => f());
  return true;
}

export function subscribeSecrets(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Le joueur s'appelle-t-il « Zinzin » ? (casse, accents, espaces et ponctuation ignorés) */
export function isZinzinName(name?: string | null): boolean {
  if (!name) return false;
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "") === "zinzin";
}
