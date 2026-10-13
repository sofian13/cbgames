// Banque de mots de L'Intrus, une version par langue (mêmes ids de catégories).
// La langue est figée au moment du tirage (getLang()) : on ne change pas en pleine partie.
import type { I18n, Lang } from "@/lib/i18n";
import { WORD_CATEGORIES_FR } from "@/components/games/undercover/words.fr";
import { WORD_CATEGORIES_EN } from "@/components/games/undercover/words.en";
import { WORD_CATEGORIES_ES } from "@/components/games/undercover/words.es";

export interface WordCategory {
  id: string;
  label: string;
  emoji: string;
  adult?: boolean;
  pairs: [string, string][];
}

export const WORD_BANK: I18n<WordCategory[]> = { fr: WORD_CATEGORIES_FR, en: WORD_CATEGORIES_EN, es: WORD_CATEGORIES_ES };

// Version gratuite de l'app : toujours les mêmes 50 paires (4 par thème du quotidien), dans chaque langue.
// Anime, +18 et les autres thèmes sont réservés à Premium.
export const FREE_CAT_IDS = ["food", "drinks", "places", "sport", "animals", "transport", "objects", "nature", "jobs", "home", "fashion", "music", "events"];

export function wordCategories(lang: Lang): WordCategory[] {
  return WORD_BANK[lang] ?? WORD_CATEGORIES_FR;
}
/** Sans sélection : tout sauf le +18. */
export function allWordPairs(lang: Lang): [string, string][] {
  return wordCategories(lang).filter((c) => !c.adult).flatMap((c) => c.pairs);
}
export function freePairs(lang: Lang): [string, string][] {
  const cats = wordCategories(lang);
  return FREE_CAT_IDS.flatMap((id) => (cats.find((c) => c.id === id)?.pairs ?? []).slice(0, 4)).slice(0, 50);
}
