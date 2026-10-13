import type { I18n, Lang } from "@/lib/i18n";
import { isNoAlcohol } from "@/lib/party-mood";
import type { ZGameText } from "./catalog-text";

/**
 * Réglage « Mode sans alcool » côté app : textes du réglage et réécriture des
 * fiches de jeux (catalog-text.ts) pour qu'aucune gorgée n'y apparaisse.
 * L'état lui-même vit dans src/lib/party-mood.ts (isNoAlcohol / setNoAlcohol),
 * partagé avec les jeux.
 */

export const NOALC_UI: I18n<{
  title: string;
  sub: string;
  /** Étiquette des jeux « À boire » (La Tournée, Le Train Fou) */
  kindBoire: string;
  /** Sous-titre de l'ambiance Soirée « Folle » */
  folleSub: string;
  /** Sous-titre de la section « After » de l'accueil */
  afterSub: string;
}> = {
  fr: {
    title: "Que des gages",
    sub: "Plus aucune gorgée : toutes les peines deviennent des gages.",
    kindBoire: "Cartes à gages",
    folleSub: "Packs coquins autorisés, peines en gages",
    afterSub: "Jeux de cartes à gages",
  },
  en: {
    title: "Dares only",
    sub: "No more sips: every penalty becomes a dare.",
    kindBoire: "Dare cards",
    folleSub: "Naughty packs allowed, dares as penalties",
    afterSub: "Card games with dares",
  },
  es: {
    title: "Solo retos",
    sub: "Se acabaron los tragos: todos los castigos son retos.",
    kindBoire: "Cartas con retos",
    folleSub: "Packs picantes permitidos, castigos en retos",
    afterSub: "Juegos de cartas con retos",
  },
};

/**
 * Réécritures des fiches : [texte, remplacement]. Remplacement `null` = la ligne
 * (règle / étape / réplique) disparaît. Appliquées dans l'ordre (les plus longues
 * d'abord). Les espaces du motif acceptent aussi les espaces insécables.
 */
type Rule = [string, string | null];
const RULES: I18n<Rule[]> = {
  fr: [
    ["Personne n'est obligé de boire de l'alcool", null],
    ["Une gorgée de zinzin, c'est de ce que tu veux", null],
    ["Eau et soft acceptés", null],
    ["un gage, ou 1 à 3 gorgées de zinzin (eau acceptée)", "un gage"],
    ["un gage, ou 1 à 2 gorgées de zinzin (eau OK)", "un gage"],
    [" (ou 1 à 3 gorgées, eau acceptée)", ""],
    [" (ou 1 à 3 gorgées)", ""],
    [" ou 1 à 3 gorgées de zinzin", ""],
    ["2 gorgées de zinzin ou un gage", "un gage"],
    ["1 à 3 gorgées ou un gage", "un gage"],
    ["2 gorgées ou un gage", "un gage"],
    ["arrivée en gare, tu distribues", "arrivée en gare, tu donnes un gage"],
    ["c'est toi qui distribues", "c'est toi qui donnes un gage"],
  ],
  en: [
    ["Nobody has to drink alcohol", null],
    ["A zinzin sip is whatever you like", null],
    ["Water and soft drinks count", null],
    ["a dare, or 1 to 3 zinzin sips (water counts)", "a dare"],
    ["a dare, or 1 to 2 zinzin sips (water is fine)", "a dare"],
    [" (or 1 to 3 zinzin sips, water counts)", ""],
    [" (or 1 to 3 zinzin sips)", ""],
    [" or 1 to 3 zinzin sips", ""],
    ["takes 2 zinzin sips or a dare", "does a dare"],
    ["1 to 3 zinzin sips or a dare", "a dare"],
    ["2 zinzin sips or a dare", "a dare"],
    ["hand out the sips", "hand out a dare"],
    ["you get to hand them out", "you get to hand out a dare"],
  ],
  es: [
    ["Nadie está obligado a beber alcohol", null],
    ["Un trago de zinzin es de lo que quieras", null],
    ["Vale agua y refrescos", null],
    ["un reto, o de 1 a 3 tragos de zinzin (vale agua)", "un reto"],
    ["un reto, o 1 a 2 tragos de zinzin (vale agua)", "un reto"],
    [" (o de 1 a 3 tragos de zinzin, vale agua)", ""],
    [" (o de 1 a 3 tragos)", ""],
    [" o de 1 a 3 tragos de zinzin", ""],
    ["Le tocan 2 tragos de zinzin o un reto", "Le toca un reto"],
    ["se lleva 2 tragos de zinzin o un reto", "se lleva un reto"],
    ["de 1 a 3 tragos de zinzin o un reto", "un reto"],
    ["de 1 a 3 tragos o un reto", "un reto"],
    ["2 tragos de zinzin o un reto", "un reto"],
    ["2 tragos o un reto", "un reto"],
    ["llegas a la estación y repartes tú", "llegas a la estación y repartes un reto"],
    ["superados: repartes tú", "superados: repartes un reto"],
  ],
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Motif tolérant : espace normale ou insécable, apostrophe droite ou courbe. */
const toRegex = (s: string) => new RegExp(esc(s).replace(/ /g, "[\\s\\u00A0\\u202F]").replace(/'/g, "['’]"), "g");
const COMPILED: Record<Lang, [RegExp, string | null][]> = {
  fr: RULES.fr.map(([a, b]) => [toRegex(a), b]),
  en: RULES.en.map(([a, b]) => [toRegex(a), b]),
  es: RULES.es.map(([a, b]) => [toRegex(a), b]),
};

/** Réécrit un texte ; renvoie null si la ligne entière doit disparaître. */
function soberLine(s: string, lang: Lang): string | null {
  let out = s;
  for (const [re, rep] of COMPILED[lang]) {
    re.lastIndex = 0;
    if (!re.test(out)) continue;
    if (rep === null) return null;
    out = out.replace(re, rep);
  }
  // « 2 gorgées ou un gage. » → « Un gage. » : majuscule si le début de ligne a été réécrit
  return out[0] !== s[0] ? out.charAt(0).toUpperCase() + out.slice(1) : out;
}

const keep = (s: string | null): s is string => s !== null;

/** Fiche d'un jeu sans aucune gorgée (mode sans alcool). */
export function soberGameText(info: ZGameText, lang: Lang): ZGameText {
  return {
    ...info,
    tagline: soberLine(info.tagline, lang) ?? info.tagline,
    pitch: soberLine(info.pitch, lang) ?? info.pitch,
    example: soberLine(info.example, lang) ?? info.example,
    rules: info.rules.map((r) => soberLine(r, lang)).filter(keep),
    steps: info.steps.map((r) => soberLine(r, lang)).filter(keep),
    story: info.story.map((l) => ({ ...l, text: soberLine(l.text, lang) })).filter((l): l is typeof l & { text: string } => l.text !== null),
  };
}

/** Étiquette du type de jeu en Soirée : « À boire » devient « Cartes à gages » en mode sans alcool. */
export function soberKind(kind: string, label: string, lang: Lang): string {
  return kind === "boire" && isNoAlcohol() ? NOALC_UI[lang].kindBoire : label;
}

/** Sous-titre d'une ambiance de Soirée (la « Folle » ne promet plus de jeux à boire). */
export function soberVibeSub(vibe: string, sub: string, lang: Lang): string {
  return vibe === "folle" && isNoAlcohol() ? NOALC_UI[lang].folleSub : sub;
}
