import { type I18n, type Lang, getLang } from "@/lib/i18n";

/**
 * Noms des jeux de l'app Zinzin dans les 3 langues.
 * Les jeux passent souvent leur nom français aux composants partagés
 * (PlayersSetup, IdeaButton…) : `localizeGameName` le traduit à l'affichage.
 * (Le registry du site reste en français.)
 */
export const GAME_NAMES: Record<string, I18n<string>> = {
  undercover: { fr: "L'Intrus", en: "The Impostor", es: "El Impostor" },
  "top-ten": { fr: "De 1 à 10", en: "From 1 to 10", es: "Del 1 al 10" },
  "tu-prefere": { fr: "Tu préfères ?", en: "Would You Rather?", es: "¿Qué prefieres?" },
  "pile-poil": { fr: "Pile Poil", en: "Spot On", es: "Justo a Tiempo" },
  "le-bluffeur": { fr: "Le Bluffeur", en: "The Bluffer", es: "El Farsante" },
  "longueur-onde": { fr: "Le Curseur", en: "The Dial", es: "El Dial" },
  "make-guess": { fr: "Fais Deviner", en: "Make Them Guess", es: "Haz que Adivinen" },
  "guess-word": { fr: "Deviner le Mot", en: "Guess the Word", es: "Adivina la Palabra" },
  "category-chrono": { fr: "Catégorie Chrono", en: "Category Clock", es: "Categoría Contrarreloj" },
  "pensez-pareil": { fr: "Pensez Pareil", en: "Think Alike", es: "Pensad Igual" },
  "couple-quiz": { fr: "Tu me connais ?", en: "Do You Know Me?", es: "¿Me Conoces?" },
  picolette: { fr: "La Tournée", en: "The Round", es: "La Ronda" },
  tgv: { fr: "Le Train Fou", en: "The Crazy Train", es: "El Tren Loco" },
  patate: { fr: "La Patate", en: "Hot Potato", es: "La Patata Caliente" },
  "lache-pas": { fr: "Lâche pas !", en: "Don't Let Go!", es: "¡No Sueltes!" },
  "loup-garou": { fr: "Loup-Garou", en: "Werewolf", es: "El Hombre Lobo" },
  "code-names": { fr: "Mots Espions", en: "Spy Words", es: "Palabras Espía" },
  purete: { fr: "Test de pureté", en: "Purity Test", es: "Test de Pureza" },
  "faux-temoin": { fr: "Le Faux Témoin", en: "The Fake Witness", es: "El Falso Testigo" },
};

/** Clé de comparaison : sans emoji, accents, ponctuation ni casse. */
function key(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

let index: Map<string, string> | null = null;
function lookup(name: string): string | undefined {
  if (!index) {
    index = new Map();
    for (const [id, n] of Object.entries(GAME_NAMES)) {
      index.set(key(id), id);
      for (const v of Object.values(n)) index.set(key(v), id);
    }
  }
  return index.get(key(name));
}

/** « L'Intrus » → « The Impostor » en anglais. Nom inconnu : renvoyé tel quel. */
export function localizeGameName(name: string, lang: Lang = getLang()): string {
  const id = lookup(name);
  return id ? GAME_NAMES[id][lang] : name;
}
