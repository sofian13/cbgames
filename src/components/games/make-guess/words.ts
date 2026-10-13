import type { I18n } from "@/lib/i18n";
import { WORDS_FR } from "./words.fr";
import { WORDS_EN } from "./words.en";
import { WORDS_ES } from "./words.es";

// Thèmes de « Fais Deviner » : mêmes ids dans toutes les langues,
// une liste de mots par langue (adaptée, pas traduite mot à mot).

export const THEME_IDS = [
  "simple", "objects", "animals", "food", "jobs", "sports", "body", "places", "countries", "nature",
  "actions", "famous", "characters", "legends", "movies", "manga", "music", "culture", "y2k", "internet",
  "party", "school", "holidays", "doctor", "fun", "abstract", "expressions", "brands", "adult",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export type ThemeWords = Record<ThemeId, string[]>;

// Thèmes non cochés par défaut (et exclus de « Tout mélanger ») : à activer volontairement.
export const OPT_IN_THEME_IDS: ThemeId[] = ["brands", "adult"];
export const DEFAULT_THEME_IDS: ThemeId[] = THEME_IDS.filter((id) => !OPT_IN_THEME_IDS.includes(id));

export const WORDS: I18n<ThemeWords> = { fr: WORDS_FR, en: WORDS_EN, es: WORDS_ES };

/**
 * Version découverte (app sans Zinzin+) : 60 mots FIXES, les 15 premiers des thèmes
 * Facile, Objets, Animaux et Bouffe (les plus mimables), dans chaque langue.
 */
export const FREE_THEME_IDS: ThemeId[] = ["simple", "objects", "animals", "food"];
const FREE_PER_THEME = 15;

export function freeWords(lang: keyof typeof WORDS): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of FREE_THEME_IDS) {
    for (const w of WORDS[lang][id].slice(0, FREE_PER_THEME)) {
      const k = w.toLocaleLowerCase(lang);
      if (!seen.has(k)) { seen.add(k); out.push(w); }
    }
  }
  return out;
}
