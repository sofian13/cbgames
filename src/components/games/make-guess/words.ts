import type { I18n } from "@/lib/i18n";
import { WORDS_FR } from "./words.fr";
import { WORDS_EN } from "./words.en";
import { WORDS_ES } from "./words.es";

// Thèmes de « Fais Deviner » : mêmes ids dans toutes les langues,
// une liste de mots par langue (adaptée, pas traduite mot à mot).

export const THEME_IDS = [
  "simple", "objects", "animals", "famous", "actions", "places", "nature", "legends", "expressions",
  "movies", "food", "jobs", "fun", "abstract", "culture", "brands", "adult",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export type ThemeWords = Record<ThemeId, string[]>;

// Thèmes non cochés par défaut (et exclus de « Tout mélanger ») : à activer volontairement.
export const OPT_IN_THEME_IDS: ThemeId[] = ["brands", "adult"];
export const DEFAULT_THEME_IDS: ThemeId[] = THEME_IDS.filter((id) => !OPT_IN_THEME_IDS.includes(id));

export const WORDS: I18n<ThemeWords> = { fr: WORDS_FR, en: WORDS_EN, es: WORDS_ES };
