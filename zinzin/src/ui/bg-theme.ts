import type { I18n } from "@/lib/i18n";

/**
 * Thèmes de fond secrets de l'accueil : débloqués par 10 touchers rapides sur le logo
 * (Logo.tsx), chaque nouvelle série passe au suivant, le dernier ramène le fond normal.
 * Appliqués par un attribut sur <html> (data-zz-theme) lu en CSS (zinzin.css) :
 * aucun composant React ne se redessine. Mémorisé dans le stockage local.
 */

export type BgTheme = "normal" | "sunset" | "ocean" | "neon" | "candy";

/** Ordre du cycle (après « candy » : retour au normal). */
export const BG_THEMES: BgTheme[] = ["normal", "sunset", "ocean", "neon", "candy"];

export const BG_THEME_NAMES: I18n<Record<BgTheme, string>> = {
  fr: { normal: "Normal", sunset: "Coucher de soleil", ocean: "Océan", neon: "Néon", candy: "Bonbon" },
  en: { normal: "Normal", sunset: "Sunset", ocean: "Ocean", neon: "Neon", candy: "Candy" },
  es: { normal: "Normal", sunset: "Atardecer", ocean: "Océano", neon: "Neón", candy: "Caramelo" },
};

const KEY = "zz-bg-theme";

function apply(t: BgTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "normal") root.removeAttribute("data-zz-theme");
  else root.setAttribute("data-zz-theme", t);
}

export function getBgTheme(): BgTheme {
  try {
    const v = localStorage.getItem(KEY) as BgTheme | null;
    return v && BG_THEMES.includes(v) ? v : "normal";
  } catch {
    return "normal";
  }
}

/** Passe au thème suivant du cycle, l'applique, le mémorise et le renvoie. */
export function nextBgTheme(): BgTheme {
  const cur = getBgTheme();
  const next = BG_THEMES[(BG_THEMES.indexOf(cur) + 1) % BG_THEMES.length];
  try {
    if (next === "normal") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch { /* stockage indisponible : le thème vaut pour cette ouverture */ }
  apply(next);
  return next;
}

// Thème mémorisé appliqué dès le chargement du module (pas de flash du fond normal)
apply(getBgTheme());
