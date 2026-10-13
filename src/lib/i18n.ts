import { useSyncExternalStore } from "react";
import { isOfflineApp } from "@/lib/offline-app";

/**
 * Langue de Zinzin (FR / EN / ES), partagée par l'app (zinzin/) ET les jeux (src/).
 * - Dans l'app : choix dans les Réglages, sinon langue du téléphone (FR, ES, sinon EN).
 * - Sur le site web : toujours le français (les jeux du site ne sont pas traduits).
 *
 * Utilisation dans un composant :
 *   const t = useT(STRINGS);            // STRINGS = { fr: {...}, en: {...}, es: {...} }
 *   <h1>{t.title}</h1>
 * Contenu (cartes, mots, questions) : pick(CONTENT, lang) ou useT(CONTENT).
 * Hors React : getLang().
 */

export type Lang = "fr" | "en" | "es";
export const LANG_IDS: Lang[] = ["fr", "en", "es"];
export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "es", label: "Español", flag: "🇪🇸" },
];

/** Dictionnaire complet dans les 3 langues (le typage force à ne rien oublier). */
export type I18n<T> = Record<Lang, T>;

const KEY = "zz-lang";
const listeners = new Set<() => void>();

function detect(): Lang {
  if (typeof window === "undefined" || !isOfflineApp()) return "fr";
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "fr" || saved === "en" || saved === "es") return saved;
  } catch { /* stockage indisponible */ }
  const nav = navigator.language?.toLowerCase() ?? "";
  return nav.startsWith("fr") ? "fr" : nav.startsWith("es") ? "es" : "en";
}

let current: Lang | null = null;

export function getLang(): Lang {
  if (current === null) current = detect();
  return current;
}

export function setLang(v: Lang) {
  current = v;
  try { localStorage.setItem(KEY, v); } catch { /* stockage indisponible */ }
  if (typeof document !== "undefined") document.documentElement.lang = v;
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    getLang,
    () => "fr",
  );
}

/** Choisit la version de la langue courante d'un dictionnaire I18n. */
export function pick<T>(dict: I18n<T>, lang: Lang = getLang()): T {
  return dict[lang] ?? dict.fr;
}

/** Hook : dictionnaire de la langue courante (re-rend au changement de langue). */
export function useT<T>(dict: I18n<T>): T {
  return pick(dict, useLang());
}

/** Remplace {cle} dans une chaîne : fmt("Au tour de {name}", { name }) */
export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Accord simple : plural(n, "point", "points") */
export function plural(n: number, one: string, many: string): string {
  return Math.abs(n) <= 1 ? one : many;
}
