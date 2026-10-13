// Thèmes de « De 1 à 10 » (mode local), une version par langue.
import type { I18n } from "@/lib/i18n";
import { ADULT_THEMES_FR, CULTURE_THEMES_FR } from "@/components/games/top-ten/themes.fr";
import { ADULT_THEMES_EN, CULTURE_THEMES_EN } from "@/components/games/top-ten/themes.en";
import { ADULT_THEMES_ES, CULTURE_THEMES_ES } from "@/components/games/top-ten/themes.es";

export interface ThemeState {
  theme: string;
  low: string;
  high: string;
}

export const THEMES: I18n<{ adult: ThemeState[]; culture: ThemeState[] }> = {
  fr: { adult: ADULT_THEMES_FR, culture: CULTURE_THEMES_FR },
  en: { adult: ADULT_THEMES_EN, culture: CULTURE_THEMES_EN },
  es: { adult: ADULT_THEMES_ES, culture: CULTURE_THEMES_ES },
};
