"use client";

/** Tuto en slides de Fais Deviner (1re partie, ou « Revoir le tuto » dans les règles). */

import { type I18n, useT } from "@/lib/i18n";
import type { TutoSlide } from "../game-tuto";
import { Badge, Blob, Bubble, CAST, Card, Finger, INK, Phone, SvgText, TutoSvg } from "../game-tuto-art";

type Txt = { title: string; text: string };
const TUTO: I18n<{ word: string; clues: [string, string, string]; got: string; skip: string; shout: string; slides: [Txt, Txt, Txt] }> = {
  fr: {
    word: "GIRAFE",
    clues: ["animal", "long cou", "Afrique"],
    got: "Trouvé",
    skip: "Passer",
    shout: "GIRAFE !",
    slides: [
      { title: "Des duos", text: "Faites des équipes de 2. L'un tient le tél et voit le mot, l'autre devine sans regarder l'écran." },
      { title: "Décris sans le dire", text: "Mot : « girafe ». Léa dit « animal, très long cou, Afrique ». Interdit de dire le mot !" },
      { title: "Trouvé ou Passer", text: "Malik trouve : Léa touche « Trouvé », +1. Trop dur : « Passer ». L'équipe avec le plus de mots gagne." },
    ],
  },
  en: {
    word: "GIRAFFE",
    clues: ["animal", "long neck", "Africa"],
    got: "Got it",
    skip: "Skip",
    shout: "GIRAFFE!",
    slides: [
      { title: "Teams of two", text: "Make teams of 2. One holds the phone and sees the word, the other guesses without looking." },
      { title: "Describe, don't say it", text: "Word: \"giraffe\". Léa says \"animal, super long neck, Africa\". Saying the word is forbidden!" },
      { title: "Got it or Skip", text: "Malik gets it: Léa taps \"Got it\", +1. Too hard: \"Skip\". The team with the most words wins." },
    ],
  },
  es: {
    word: "JIRAFA",
    clues: ["animal", "cuello largo", "África"],
    got: "Acertada",
    skip: "Pasar",
    shout: "¡JIRAFA!",
    slides: [
      { title: "Parejas", text: "Haced equipos de 2. Uno tiene el móvil y ve la palabra, el otro adivina sin mirar la pantalla." },
      { title: "Descríbela sin decirla", text: "Palabra: «jirafa». Léa dice «animal, cuello larguísimo, África». ¡Prohibido decir la palabra!" },
      { title: "Acertada o Pasar", text: "Malik acierta: Léa toca «Acertada», +1. Muy difícil: «Pasar». Gana el equipo con más palabras." },
    ],
  },
};

/** Sablier simple (l'équipe qui attend son tour). */
function Hourglass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="gt-wiggle">
        <rect x={-9} y={-13} width={18} height={4} rx={1.5} fill="#FFD23F" stroke={INK} strokeWidth={2} />
        <rect x={-9} y={9} width={18} height={4} rx={1.5} fill="#FFD23F" stroke={INK} strokeWidth={2} />
        <path d="M-6 -9 L6 -9 L0 0 L6 9 L-6 9 L0 0 Z" fill="#FFF6E5" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <path d="M-3 7 L3 7 L0 3 Z" fill="#FF9F1C" />
      </g>
    </g>
  );
}

export function useMakeGuessTuto(): TutoSlide[] {
  const t = useT(TUTO);
  const [s1, s2, s3] = t.slides;
  return [
    {
      ...s1,
      art: (
        <TutoSvg floor>
          {/* 2e équipe qui attend */}
          <Blob x={146} y={58} s={26} color={CAST.ines} mood="sleep" />
          <Blob x={172} y={58} s={26} color={CAST.tom} mood="sleep" />
          <Hourglass x={198} y={40} />
          {/* Léa tient le tél, mot visible pour elle seule */}
          <Blob x={48} y={150} s={58} color={CAST.lea} mood="smirk" />
          <Phone x={70} y={62} w={46} h={74} rot={-8} className="gt-bob">
            <SvgText x={19} y={30} text={t.word} size={8} />
          </Phone>
          {/* Malik devine, bandeau sur les yeux */}
          <Blob x={170} y={150} s={58} color={CAST.malik} mood="talk">
            <rect x={-30} y={-15} width={60} height={15} rx={4} fill={INK} />
          </Blob>
          <Bubble x={150} y={76} w={40} h={22} text="?" size={14} className="gt-pulse" />
        </TutoSvg>
      ),
    },
    {
      ...s2,
      art: (
        <TutoSvg floor>
          <Blob x={44} y={150} s={58} color={CAST.lea} mood="talk" />
          {/* bulle d'indices */}
          <g className="gt-bob"><g transform="translate(70 12)">
            <path d="M8 66 L-6 80 L22 66 Z" fill="#fff" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <rect x={0} y={0} width={110} height={68} rx={16} fill="#fff" stroke={INK} strokeWidth={2.5} />
            {t.clues.map((c, i) => (
              <SvgText key={c} x={55} y={15 + i * 19} text={c} size={13} />
            ))}
          </g></g>
          {/* le mot interdit */}
          <Card x={88} y={106} w={80} h={28} fill="#FFF6E5" text={t.word} size={11} />
          <path d="M90 128 L166 112" stroke="#FF6B5B" strokeWidth={3} strokeLinecap="round" opacity={0.85} />
          <g className="gt-pulse">
            <circle cx={176} cy={100} r={10} fill="#fff" stroke="#FF6B5B" strokeWidth={4} />
            <path d="M169 93 L183 107" stroke="#FF6B5B" strokeWidth={4} strokeLinecap="round" />
          </g>
          <Blob x={196} y={150} s={40} color={CAST.malik} mood="happy" />
        </TutoSvg>
      ),
    },
    {
      ...s3,
      art: (
        <TutoSvg floor>
          {/* tél : moitié Trouvé / moitié Passer */}
          <Phone x={40} y={24} w={104} h={110} body={CAST.hugo}>
            <rect x={0} y={0} width={48} height={96} rx={5} fill="#3DDC97" stroke={INK} strokeWidth={2} />
            <rect x={48} y={0} width={48} height={96} rx={5} fill="#FF6B5B" stroke={INK} strokeWidth={2} />
            <path d="M16 58 L22 65 L33 51" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M62 58 L80 58 M73 51 L80 58 L73 65" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <SvgText x={24} y={22} text={t.got} size={t.got.length > 6 ? 8.5 : 10} />
            <SvgText x={72} y={22} text={t.skip} size={10} />
          </Phone>
          <Finger x={64} y={110} />
          <Badge x={24} y={70} r={15} text="+1" fill="#FFD23F" className="gt-pop" />
          <Blob x={186} y={150} s={50} color={CAST.malik} mood="panic" />
          <Bubble x={150} y={72} w={68} h={24} text={t.shout} size={10} className="gt-pop" style={{ animationDelay: "0.2s" }} />
        </TutoSvg>
      ),
    },
  ];
}
