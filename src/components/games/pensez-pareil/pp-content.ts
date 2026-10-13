// Contenu + matching de Pensez Pareil, partagés entre le client (mode local)
// et le serveur PartyKit (party/games/pensez-pareil.ts). Module pur : aucun import.
// Matching multilingue (FR par défaut ; EN / ES pour l'app Zinzin). Les thèmes
// EN / ES sont dans pp-content.en.ts / pp-content.es.ts (côté client seulement).

/** Langue du matching (même valeurs que Lang de src/lib/i18n, sans import). */
export type MatchLang = "fr" | "en" | "es";

export type Tier = "soft" | "couple" | "spicy";
export interface Prompt {
  text: string;
  tier: Tier;
}

const SOFT = [
  "Un fruit", "Une couleur", "Un animal de compagnie", "Un pays à visiter", "Un chiffre entre 1 et 10",
  "Une saison", "Un dessert", "Un super-héros", "Une boisson chaude", "Un film d'animation",
  "Un emoji", "Une garniture de pizza", "Un légume", "Un sport", "Un instrument de musique",
  "Un jour de la semaine", "Une ville de France", "Un animal de la ferme", "Un animal de la savane", "Une fleur",
  "Un métier", "Un moyen de transport", "Un fromage", "Un plat de fast-food", "Une partie du visage",
  "Un vêtement d'hiver", "Un objet de la salle de bain", "Une matière à l'école", "Un jeu de société", "Un personnage de dessin animé",
  "Une princesse de conte", "Un réseau social", "Une planète", "Un mois de l'année", "Un bonbon",
  "Un parfum de glace", "Un insecte", "Un oiseau", "Un poisson", "Une capitale européenne",
  "Un fruit exotique", "Une forme géométrique", "Un jus de fruit", "Une épice", "Un ustensile de cuisine",
  "Un meuble", "Un objet qu'on emporte à la plage", "Un dinosaure", "Un sorcier célèbre", "Un pays où il fait froid",
  "Une langue étrangère", "Un chiffre entre 1 et 100", "Une émotion", "Un truc qu'on mange au petit-déj", "Une fête de l'année",
  "Un sport d'hiver", "Un truc rouge", "Un truc qui pique", "Un animal qui fait peur", "Un monument célèbre",
  "Un plat de mamie", "Un héros de jeu vidéo", "Un truc qu'on trouve dans un sac à main", "Un sport avec un ballon", "Une pâtisserie",
];

const COUPLE = [
  "Notre série du moment", "Notre prochaine destination", "Un plat qu'on commande toujours", "Notre activité du dimanche", "Notre chanson",
  "Le prénom de notre futur animal", "Notre resto préféré", "Un truc qui nous fait toujours rire", "Le surnom qu'on se donne", "Qui cuisine le mieux (prénom)",
  "Le premier film vu ensemble", "Le lieu de notre premier date", "Notre dessert à partager", "Le pire défaut de l'autre", "La qualité préférée chez l'autre",
  "Le plat que l'autre rate toujours", "Qui s'endort en premier (prénom)", "Qui a dit « je t'aime » en premier (prénom)", "Le pays où on vivrait", "Le prénom de notre futur enfant",
  "Notre emoji", "Le cadeau idéal pour l'autre", "Notre sujet de dispute n°1", "Notre pièce préférée de la maison", "Le jeu auquel on joue ensemble",
  "Le plat de notre premier dîner", "L'animal qui ressemble à l'autre", "La saison préférée de l'autre", "La couleur préférée de l'autre", "Le snack préféré de l'autre",
  "Le chanteur préféré de l'autre", "Un mot qui décrit notre couple", "Qui est le plus jaloux (prénom)", "Qui est toujours en retard (prénom)", "Notre activité de vacances",
  "Le film qu'on peut revoir 100 fois",
];

const SPICY = [
  "Un endroit insolite pour s'embrasser", "La partie du corps de l'autre que je préfère", "Un mot pour décrire notre dernière nuit", "Une tenue qui rend l'autre fou/folle", "Un endroit où on n'a jamais osé",
  "Le surnom coquin de l'autre", "Une couleur de lingerie", "Un parfum qui fait craquer", "Une pièce de la maison (pas la chambre)", "Le meilleur moment de la journée pour un câlin",
  "Un film qui donne chaud", "Une chanson pour mettre l'ambiance", "Un accessoire pour pimenter", "Un aliment sexy", "Ce que l'autre porte au lit",
  "Un mot doux à chuchoter", "Un endroit du corps pour un massage", "Le premier truc qu'on remarque chez l'autre", "Une destination pour une escapade à deux", "Un jeu coquin",
  "Un costume pour un jeu de rôle", "Un endroit du corps à embrasser", "Une boisson pour un tête-à-tête", "Une odeur qui rend fou/folle", "Un fantasme en un mot",
  "Le meuble le plus solide de la maison", "Un mot pour décrire nos bisous", "Le vêtement de l'autre que je préfère retirer", "Une matière qui donne envie de toucher", "Un dessert à partager au lit",
  "Un emoji coquin", "Ce qu'on fait en premier en rentrant d'un date", "Un endroit pour un bain de minuit",
];

export const PROMPTS: Prompt[] = [
  ...SOFT.map((text) => ({ text, tier: "soft" as const })),
  ...COUPLE.map((text) => ({ text, tier: "couple" as const })),
  ...SPICY.map((text) => ({ text, tier: "spicy" as const })),
];

export const ANSWER_TIME = 35;

// -- Matching ---------------------------------------------
const UNITS = [
  "zero", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dixsept", "dixhuit", "dixneuf", "vingt",
];
const TENS: Record<number, string> = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante", 8: "quatrevingt" };

/** 0-100 en toutes lettres (sans tirets ni espaces, pour comparer « 17 » et « dix-sept »). */
function numberToWords(n: number): string | null {
  if (n < 0 || n > 100) return null;
  if (n <= 20) return UNITS[n];
  if (n === 100) return "cent";
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    // 70-79 = soixante + 10..19, 90-99 = quatre-vingt + 10..19
    const base = t === 7 ? "soixante" : "quatrevingt";
    const rest = 10 + u;
    return base + (rest === 11 && t === 7 ? "etonze" : UNITS[rest]);
  }
  if (u === 0) return t === 8 ? "quatrevingts" : TENS[t];
  if (u === 1 && t !== 8) return TENS[t] + "etun";
  return TENS[t] + UNITS[u];
}

const ARTICLES = new Set(["le", "la", "les", "un", "une", "des", "du", "de", "l", "d"]);

// ── Anglais ──
const EN_UNITS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
/** 0-100 en anglais, collé (« twenty-one » → « twentyone »). */
function numberToWordsEn(n: number): string | null {
  if (n < 0 || n > 100) return null;
  if (n < 20) return EN_UNITS[n];
  if (n === 100) return "onehundred";
  const t = Math.floor(n / 10);
  const u = n % 10;
  return EN_TENS[t] + (u ? EN_UNITS[u] : "");
}
const EN_ARTICLES = new Set(["the", "a", "an", "some"]);
/** Pluriels anglais réguliers (cherries → cherry, boxes → box, cats → cat). */
function singularEn(w: string): string {
  if (w.length < 4) return w;
  if (/ies$/.test(w) && w.length > 4) return w.slice(0, -3) + "y";
  if (/(ches|shes|xes|sses|zes|oes)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}

// ── Espagnol ──
const ES_UNITS = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
  "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve", "veinte",
  "veintiuno", "veintidos", "veintitres", "veinticuatro", "veinticinco", "veintiseis", "veintisiete", "veintiocho", "veintinueve",
];
const ES_TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
/** 0-100 en espagnol, collé (« treinta y uno » → « treintayuno »). */
function numberToWordsEs(n: number): string | null {
  if (n < 0 || n > 100) return null;
  if (n < 30) return ES_UNITS[n];
  if (n === 100) return "cien";
  const t = Math.floor(n / 10);
  const u = n % 10;
  return ES_TENS[t] + (u ? "y" + ES_UNITS[u] : "");
}
const ES_ARTICLES = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "lo"]);
/** Pluriels espagnols (flores → flor, tomates → tomate, luces → luz) : même racine des deux côtés. */
function singularEs(w: string): string {
  if (w.length >= 4 && /s$/.test(w)) w = w.slice(0, -1);
  if (w.length >= 4 && /[^aeiou]e$/.test(w)) w = w.slice(0, -1);
  return w.replace(/z$/, "c");
}

const LANG_RULES: Record<MatchLang, { articles: Set<string>; num: (n: number) => string | null; sing: (w: string) => string }> = {
  fr: { articles: ARTICLES, num: numberToWords, sing: (w) => (w.length >= 4 && /[sx]$/.test(w) ? w.slice(0, -1) : w) },
  en: { articles: EN_ARTICLES, num: numberToWordsEn, sing: singularEn },
  es: { articles: ES_ARTICLES, num: numberToWordsEs, sing: singularEs },
};

export function normalizeAnswer(s: string, lang: MatchLang = "fr"): string {
  const rules = LANG_RULES[lang] ?? LANG_RULES.fr;
  const words = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/['’`]/g, " ")
    .replace(/-/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  // Articles en tête (« la plage », « l'été », « des fraises » / « the beach » / « las fresas »)
  while (words.length > 1 && rules.articles.has(words[0])) words.shift();
  // « a hundred » / « one hundred » = « 100 » ; « una » / « un » seul = « uno »
  if (lang === "en" && words.length === 1 && words[0] === "hundred") words[0] = "onehundred";
  if (lang === "es" && words.length === 1 && (words[0] === "un" || words[0] === "una")) words[0] = "uno";
  const out = words.map((w) => {
    // Chiffres → lettres (« 7 » = « sept » / « seven » / « siete »)
    if (/^\d+$/.test(w)) {
      const asWords = rules.num(parseInt(w, 10));
      if (asWords) w = asWords;
    }
    // Pluriel → singulier (« fraises » = « fraise », « gâteaux » = « gâteau », « cherries » = « cherry », « flores » = « flor »)
    return rules.sing(w);
  });
  // Nombres en plusieurs mots : « twenty one », « treinta y uno » → collés comme les chiffres
  return out.join("");
}

function lev(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * Même réponse ? Égalité après normalisation (accents, casse, articles, pluriel,
 * chiffres → lettres) OU une seule faute de frappe pour les mots de 5 lettres et plus.
 */
export function isMatch(a: string | null, b: string | null, lang: MatchLang = "fr"): boolean {
  if (!a || !b) return false;
  const x = normalizeAnswer(a, lang);
  const y = normalizeAnswer(b, lang);
  if (!x || !y) return false;
  if (x === y) return true;
  return Math.min(x.length, y.length) >= 5 && lev(x, y) <= 1;
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
