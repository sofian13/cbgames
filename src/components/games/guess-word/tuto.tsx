"use client";

/** Tuto en slides de Deviner le Mot (1re partie, ou « Revoir le tuto » dans les règles). */

import { type I18n, useT } from "@/lib/i18n";
import type { TutoSlide } from "../game-tuto";
import { Arrow, Blob, Bubble, CAST, INK, SvgText, TutoSvg } from "../game-tuto-art";

type Txt = { title: string; text: string };
const TUTO: I18n<{ word: string; clue: string; got: string; skip: string; slides: [Txt, Txt, Txt] }> = {
  fr: {
    word: "GIRAFE",
    clue: "Animal d'Afrique !",
    got: "TROUVÉ",
    skip: "PASSER",
    slides: [
      { title: "Le tél sur le front", text: "Inès pose le tél sur son front, couché, écran vers les autres. Elle seule ne voit pas le mot." },
      { title: "Les autres t'aident", text: "Tom mime un long cou, Léa dit « animal d'Afrique ». Ils peuvent tout faire, sauf dire le mot !" },
      { title: "Penche la tête", text: "Trouvé ? Penche la tête en avant, écran vers le sol. Trop dur ? En arrière, écran vers le plafond." },
    ],
  },
  en: {
    word: "GIRAFFE",
    clue: "African animal!",
    got: "GOT IT",
    skip: "SKIP",
    slides: [
      { title: "Phone on your forehead", text: "Inès puts the phone on her forehead, sideways, screen facing out. She's the only one who can't see the word." },
      { title: "The others help", text: "Tom mimes a long neck, Léa says \"African animal\". Anything goes, except saying the word!" },
      { title: "Tilt your head", text: "Got it? Tilt your head forward, screen to the floor. Too hard? Tilt back, screen to the ceiling." },
    ],
  },
  es: {
    word: "JIRAFA",
    clue: "¡Animal de África!",
    got: "ACERTADA",
    skip: "PASAR",
    slides: [
      { title: "El móvil en la frente", text: "Inès se pone el móvil en la frente, en horizontal, pantalla hacia fuera. Solo ella no ve la palabra." },
      { title: "Los demás te ayudan", text: "Tom imita un cuello largo, Léa dice «animal de África». ¡Vale todo menos decir la palabra!" },
      { title: "Inclina la cabeza", text: "¿Acertaste? Inclina la cabeza hacia delante, pantalla al suelo. ¿Muy difícil? Hacia atrás, pantalla al techo." },
    ],
  },
};

const KF = `
@keyframes gw-t-stretch { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.45); } }
@keyframes gw-t-fwd { 0%,20% { transform: rotate(0deg); } 45%,80% { transform: rotate(24deg); } 100% { transform: rotate(0deg); } }
@keyframes gw-t-back { 0%,20% { transform: rotate(0deg); } 45%,80% { transform: rotate(-24deg); } 100% { transform: rotate(0deg); } }
.gw-t-stretch { animation: gw-t-stretch 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
.gw-t-fwd { animation: gw-t-fwd 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
.gw-t-back { animation: gw-t-back 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
`;

/** Tél couché (paysage) posé sur un front, écran vers nous, avec le mot. */
function ForeheadPhone({ x, y, w, word, size }: { x: number; y: number; w: number; word: string; size: number }) {
  const h = w * 0.5;
  return (
    <g transform={`translate(${x - w / 2} ${y - h})`}>
      <rect x={0} y={0} width={w} height={h} rx={7} fill="#7A4EE8" stroke={INK} strokeWidth={3} />
      <rect x={6} y={4} width={w - 12} height={h - 8} rx={4} fill="#FFF6E5" stroke={INK} strokeWidth={2} />
      <SvgText x={w / 2} y={h / 2 + 1} text={word} size={size} />
    </g>
  );
}

/** Petit blob devineur avec le tél sur le front. (x, y) = bas du blob. */
function Guesser({ x, y, s, word, size, mood = "happy" }: { x: number; y: number; s: number; word: string; size: number; mood?: "happy" | "panic" }) {
  const top = y - s * 0.93;
  return (
    <g>
      <Blob x={x} y={y} s={s} color={CAST.ines} mood={mood} />
      <ForeheadPhone x={x} y={top + s * 0.28} w={s * 1.15} word={word} size={size} />
    </g>
  );
}

export function useGuessWordTuto(): TutoSlide[] {
  const t = useT(TUTO);
  const [s1, s2, s3] = t.slides;
  return [
    {
      ...s1,
      art: (
        <TutoSvg floor>
          <style>{KF}</style>
          <Guesser x={110} y={150} s={74} word={t.word} size={t.word.length > 6 ? 12 : 13} />
          <Bubble x={160} y={34} w={40} h={26} text="?" size={16} className="gt-pulse" />
          <Blob x={30} y={150} s={36} color={CAST.lea} mood="smirk" />
          <Blob x={192} y={150} s={36} color={CAST.tom} mood="wink" />
        </TutoSvg>
      ),
    },
    {
      ...s2,
      art: (
        <TutoSvg floor>
          <style>{KF}</style>
          {/* Tom mime un long cou */}
          <g className="gw-t-stretch">
            <Blob x={38} y={150} s={44} color={CAST.tom} mood="happy" />
          </g>
          <Guesser x={110} y={150} s={58} word={t.word} size={10} />
          <Blob x={184} y={150} s={44} color={CAST.lea} mood="talk" />
          <Bubble x={104} y={14} w={110} h={30} text={t.clue} size={11} tailX={80} className="gt-bob" />
        </TutoSvg>
      ),
    },
    {
      ...s3,
      art: (
        <TutoSvg floor>
          <style>{KF}</style>
          <line x1={110} y1={14} x2={110} y2={140} stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeDasharray="5 5" />
          {/* en avant = trouvé */}
          <g className="gw-t-fwd">
            <Guesser x={52} y={140} s={44} word={t.word} size={7} />
          </g>
          <Arrow d="M84 52 Q98 72 90 96" head={[90, 96, 105]} color="#3DDC97" />
          <g transform="translate(55 30)">
            <rect x={-38} y={-12} width={76} height={22} rx={11} fill="#3DDC97" stroke={INK} strokeWidth={2.5} />
            <SvgText x={0} y={0} text={`✓ ${t.got}`} size={t.got.length > 7 ? 9 : 10} />
          </g>
          {/* en arrière = passe */}
          <g className="gw-t-back">
            <Guesser x={166} y={140} s={44} word={t.word} size={7} />
          </g>
          <Arrow d="M136 96 Q124 74 134 54" head={[134, 54, -70]} color="#FF9F1C" />
          <g transform="translate(166 30)">
            <rect x={-36} y={-12} width={72} height={22} rx={11} fill="#FF9F1C" stroke={INK} strokeWidth={2.5} />
            <SvgText x={0} y={0} text={`→ ${t.skip}`} size={10} />
          </g>
        </TutoSvg>
      ),
    },
  ];
}
