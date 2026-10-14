"use client";

/** Tuto en slides de « De 1 à 10 » + consignes ajoutées (numéro secret, repères, barème, règles). */

import type { ReactNode } from "react";
import type { I18n } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Badge, Blob, Bubble, CAST, Card, Check, Crown, INK, Phone, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

type Txt = { title: string; text: string };
interface TtExtra {
  slides: Txt[];
  art: { theme: string; leaAnswer: string; malikAnswer: string; mild: string; strong: string };
  /** Écran du thème : consigne */
  themeHelp: (range: number) => string;
  secretRule: (low: string, range: number, high: string) => string;
  /** Écran de réponse */
  neverSay: string;
  speakOrder: string;
  /** Écran de classement */
  themeReminder: string;
  inSpeakOrder: string;
  /** Révélation : barème en une ligne */
  scoreLine: string;
  rules: string[];
}

export const TT_EXTRA: I18n<TtExtra> = {
  fr: {
    slides: [
      { title: "Ton numéro secret", text: "Chacun regarde en secret son numéro, de 1 (le plus faible) à 10 (le plus fort). Ne le dis jamais !" },
      { title: "Réponds selon ton numéro", text: "Thème : « une excuse pour être en retard ». Léa (2) : « les bouchons ». Malik (9) : « enlevé par des extraterrestres » !" },
      { title: "Chacun classe, en secret", text: "Ensuite, chacun son tour et en secret, range les prénoms du plus faible au plus fort. Toi compris !" },
      { title: "Le meilleur flair gagne", text: "On révèle les vrais numéros. +2 par voisins bien rangés, +5 si tout est parfait. Le meilleur flair gagne !" },
    ],
    art: { theme: "Une excuse pour être en retard", leaAnswer: "Les bouchons…", malikAnswer: "Des aliens !", mild: "1 · faible", strong: "10 · fort" },
    themeHelp: (r) => `Lisez le thème à voix haute. Les cartes 1 et ${r} ne sont que des repères.`,
    secretRule: (lo, r, hi) => `Ton numéro est SECRET : ne le dis pas ! Réponds au thème selon ton numéro : 1 = le plus ${lo}, ${r} = le plus ${hi}.`,
    neverSay: "Ne dis JAMAIS ton numéro ! Retenez bien les réponses de chacun.",
    speakOrder: "Ordre de parole",
    themeReminder: "Le thème",
    inSpeakOrder: "Les prénoms sont dans l'ordre où vous avez parlé.",
    scoreLine: "+2 pts par paire de voisins bien rangés · +5 si ton classement est parfait",
    rules: [
      "Un thème tombe, avec deux repères : ce qui vaudrait 1 et ce qui vaudrait 10 (ou 25, 50). Ce ne sont que des exemples.",
      "Chacun reçoit en secret un numéro différent, tiré au hasard : ils ne se suivent pas forcément (ex. 2, 5, 7, 9).",
      "Ne dis jamais ton numéro ! Réponds au thème à voix haute, avec une réponse qui colle à l'intensité de ton numéro.",
      "Quand tout le monde a parlé, chacun son tour et en secret, range toute la table (toi compris) du plus faible au plus fort.",
      "Chacun marque seul : +2 points par paire de voisins bien rangés, +5 si tout son classement est parfait.",
      "Après toutes les manches, le meilleur total a le meilleur flair.",
    ],
  },
  en: {
    slides: [
      { title: "Your secret number", text: "Everyone secretly checks their number, from 1 (the lowest) to 10 (the highest). Never say it out loud!" },
      { title: "Answer to match it", text: "Theme: \"an excuse for being late\". Léa (2): \"traffic\". Malik (9): \"abducted by aliens\"!" },
      { title: "Everyone ranks, in secret", text: "Then, one by one and in secret, order the names from lowest to highest. Yourself included!" },
      { title: "Best instinct wins", text: "The real numbers are revealed. +2 per pair of neighbours in the right order, +5 if it's perfect. Best instinct wins!" },
    ],
    art: { theme: "An excuse for being late", leaAnswer: "Traffic…", malikAnswer: "Aliens!", mild: "1 · low", strong: "10 · high" },
    themeHelp: (r) => `Read the theme out loud. Cards 1 and ${r} are just guides.`,
    secretRule: (lo, r, hi) => `Your number is SECRET: don't say it! Answer the theme to match your number: 1 = most ${lo}, ${r} = most ${hi}.`,
    neverSay: "NEVER say your number! Remember everyone's answers.",
    speakOrder: "Speaking order",
    themeReminder: "The theme",
    inSpeakOrder: "Names are in the order you spoke.",
    scoreLine: "+2 pts per pair of neighbours in the right order · +5 if your ranking is perfect",
    rules: [
      "A theme comes up with two guides: what would be a 1 and what would be a 10 (or 25, 50). They're only examples.",
      "Everyone secretly gets a different, random number: they don't have to follow each other (e.g. 2, 5, 7, 9).",
      "Never say your number! Answer the theme out loud with something that matches how high your number is.",
      "Once everyone has spoken, one by one and in secret, order the whole table (yourself included) from lowest to highest.",
      "Everyone scores on their own: +2 points per pair of neighbours in the right order, +5 if the whole ranking is perfect.",
      "After all the rounds, the best total has the best instinct.",
    ],
  },
  es: {
    slides: [
      { title: "Tu número secreto", text: "Cada uno mira en secreto su número, del 1 (lo más bajo) al 10 (lo más alto). ¡No lo digas nunca!" },
      { title: "Responde según tu número", text: "Tema: «una excusa para llegar tarde». Léa (2): «había atasco». Malik (9): «¡me abdujeron los extraterrestres!»" },
      { title: "Cada uno ordena, en secreto", text: "Luego, por turnos y en secreto, ordena los nombres de más bajo a más alto. ¡Tú también!" },
      { title: "Gana el mejor olfato", text: "Se revelan los números reales. +2 por cada pareja de vecinos bien ordenada, +5 si es perfecto. ¡Gana el mejor olfato!" },
    ],
    art: { theme: "Una excusa para llegar tarde", leaAnswer: "Había atasco…", malikAnswer: "¡Aliens!", mild: "1 · bajo", strong: "10 · alto" },
    themeHelp: (r) => `Leed el tema en voz alta. Las cartas 1 y ${r} solo son referencias.`,
    secretRule: (lo, r, hi) => `Tu número es SECRETO: ¡no lo digas! Responde al tema según tu número: 1 = lo más ${lo}, ${r} = lo más ${hi}.`,
    neverSay: "¡No digas NUNCA tu número! Recordad bien las respuestas de cada uno.",
    speakOrder: "Orden para hablar",
    themeReminder: "El tema",
    inSpeakOrder: "Los nombres están en el orden en que hablasteis.",
    scoreLine: "+2 pts por cada pareja de vecinos bien ordenada · +5 si tu orden es perfecto",
    rules: [
      "Sale un tema con dos referencias: lo que valdría un 1 y lo que valdría un 10 (o 25, 50). Solo son ejemplos.",
      "Cada uno recibe en secreto un número distinto al azar: no tienen por qué ser seguidos (p. ej. 2, 5, 7, 9).",
      "¡No digas nunca tu número! Responde al tema en voz alta con algo que encaje con la intensidad de tu número.",
      "Cuando todos han hablado, por turnos y en secreto, ordena a toda la mesa (tú también) de más bajo a más alto.",
      "Cada uno puntúa por su cuenta: +2 puntos por cada pareja de vecinos bien ordenada, +5 si todo su orden es perfecto.",
      "Tras todas las rondas, el mejor total tiene el mejor olfato.",
    ],
  },
};

/** Petite règle graduée 1 → 10 (vert → rouge) avec un curseur. */
function Ruler({ y, at }: { y: number; at: number }) {
  const x0 = 30;
  const w = 160;
  return (
    <g>
      <defs>
        <linearGradient id="tt-grad" x1="0" x2="1">
          <stop offset="0" stopColor="#3DDC97" />
          <stop offset="0.5" stopColor="#FFD23F" />
          <stop offset="1" stopColor="#FF3EA5" />
        </linearGradient>
      </defs>
      <rect x={x0} y={y} width={w} height={12} rx={6} fill="url(#tt-grad)" stroke={INK} strokeWidth={2.5} />
      <SvgText x={x0 - 10} y={y + 7} text="1" size={11} fill="#fff" />
      <SvgText x={x0 + w + 12} y={y + 7} text="10" size={11} fill="#fff" />
      <path d={`M${x0 + (w * (at - 1)) / 9} ${y - 3} l-5 -8 h10 z`} fill="#fff" stroke={INK} strokeWidth={2} />
    </g>
  );
}

function ArtSecret() {
  return (
    <TutoSvg>
      {/* Léa voit son 2 */}
      <Blob x={56} y={128} s={52} color={CAST.lea} mood="smirk" />
      <Phone x={72} y={46} w={44} h={70} rot={-6}>
        <SvgText x={18} y={28} text="2" size={34} fill="#1E9E66" />
      </Phone>
      {/* bulle « 2 » barrée : on ne dit pas son numéro */}
      <g transform="translate(14 22)"><g className="gt-bob">
        <Bubble x={0} y={0} w={36} h={26} text="2" size={16} tail="down" tailX={26} />
        <path d="M2 28 L36 -2" stroke="#FF3E3E" strokeWidth={5} strokeLinecap="round" />
        <path d="M2 28 L36 -2" stroke={INK} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
      </g></g>
      {/* Malik détourne la tête, son 9 arrive */}
      <Blob x={168} y={128} s={52} color={CAST.malik} mood="wink" />
      <g className="gt-flash">
        <Phone x={150} y={30} w={40} h={62} rot={6}>
          <SvgText x={16} y={24} text="9" size={30} fill="#E0207F" />
        </Phone>
      </g>
      <Ruler y={146} at={2} />
    </TutoSvg>
  );
}

function ArtAnswer({ theme, lea, malik }: { theme: string; lea: string; malik: string }) {
  return (
    <TutoSvg floor>
      <Card x={20} y={8} w={180} h={24} fill="#fff" text={theme} size={11} />
      <Blob x={46} y={146} s={46} color={CAST.lea} mood="happy" />
      <Blob x={166} y={146} s={46} color={CAST.malik} mood="panic" className="gt-shake" />
      <Card x={34} y={64} w={24} h={26} fill="#FFF6E5" text="?" size={14} />
      <Card x={154} y={64} w={24} h={26} fill="#FFF6E5" text="?" size={14} />
      <Bubble x={6} y={38} w={88} h={22} text={lea} size={10} />
      <Bubble x={124} y={38} w={84} h={22} text={malik} size={11} className="gt-pop" />
      {/* soucoupe */}
      <g transform="translate(110 78)"><g className="gt-float">
        <ellipse rx={16} ry={5} fill="#B79CFF" stroke={INK} strokeWidth={2} />
        <path d="M-7 -3 Q0 -13 7 -3" fill="#4ECDC4" stroke={INK} strokeWidth={2} />
      </g></g>
      {/* thermomètres */}
      <g transform="translate(82 100)">
        <rect x={-4} y={0} width={8} height={36} rx={4} fill="#fff" stroke={INK} strokeWidth={2} />
        <rect x={-2} y={28} width={4} height={6} rx={2} fill="#3DDC97" />
      </g>
      <g transform="translate(200 100)">
        <rect x={-4} y={0} width={8} height={36} rx={4} fill="#fff" stroke={INK} strokeWidth={2} />
        <rect x={-2} y={4} width={4} height={30} rx={2} fill="#FF3EA5" className="gt-pulse" />
      </g>
    </TutoSvg>
  );
}

function ArtRank({ mild, strong }: { mild: string; strong: string }) {
  const rows: [string, string][] = [["Léa", CAST.lea], ["Inès", CAST.ines], ["Malik", CAST.malik]];
  return (
    <TutoSvg>
      <Blob x={34} y={150} s={44} color={CAST.ines} mood="smirk" />
      <Blob x={190} y={150} s={34} color={CAST.lea} mood="sleep" />
      <Blob x={190} y={110} s={34} color={CAST.malik} mood="sleep" />
      <Phone x={62} y={8} w={100} h={156}>
        <Card x={8} y={6} w={76} h={16} fill="#3DDC97" text={mild} size={9} />
        {rows.map(([n, c], i) => (
          <g key={n} className={i === 2 ? "gt-bob" : undefined}>
            <Card x={6} y={28 + i * 26} w={80} h={22} fill="#fff">
              <circle cx={12} cy={11} r={6} fill={c} stroke={INK} strokeWidth={1.5} />
              <SvgText x={46} y={12} text={n} size={10} />
            </Card>
          </g>
        ))}
        <Card x={8} y={110} w={76} h={16} fill="#FF3EA5" text={strong} size={9} />
      </Phone>
      <Arrow d="M168 40 Q186 70 166 96" head={[166, 96, 120]} color="#FFD23F" width={3} />
    </TutoSvg>
  );
}

function ArtReveal() {
  const steps: [string, string, number, number][] = [["2", CAST.lea, 40, 108], ["5", CAST.ines, 110, 88], ["9", CAST.malik, 180, 68]];
  return (
    <TutoSvg floor>
      {steps.map(([n, c, x, top], i) => (
        <g key={n}>
          <rect x={x - 30} y={top} width={60} height={140 - top} fill={["#3DDC97", "#FFD23F", "#FF3EA5"][i]} stroke={INK} strokeWidth={2.5} />
          <Blob x={x} y={top} s={36} color={c} mood={i === 1 ? "cool" : "happy"} />
          <Card x={x - 11} y={top + 6} w={22} h={24} fill="#fff" text={n} size={13} />
        </g>
      ))}
      <Crown x={110} y={44} s={0.9} className="gt-bob" />
      <Badge x={148} y={34} r={13} fill="#3DDC97" text="+9" size={11} className="gt-pulse" />
      <Check x={75} y={96} s={0.8} className="gt-pop" />
      <Check x={145} y={76} s={0.8} className="gt-pop" style={{ animationDelay: "0.4s" }} />
    </TutoSvg>
  );
}

export function useTtTutoSlides(): TutoSlide[] {
  const t = useT(TT_EXTRA);
  const arts: ReactNode[] = [
    <ArtSecret key="s" />,
    <ArtAnswer key="a" theme={t.art.theme} lea={t.art.leaAnswer} malik={t.art.malikAnswer} />,
    <ArtRank key="r" mild={t.art.mild} strong={t.art.strong} />,
    <ArtReveal key="v" />,
  ];
  return t.slides.map((s, i) => ({ ...s, art: arts[i] }));
}
