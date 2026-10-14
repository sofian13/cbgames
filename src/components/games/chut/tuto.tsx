"use client";

/**
 * Tuto général de « Chut ! » en slides (FR / EN / ES). Chaque mode garde en plus
 * sa carte « Comment on joue » en 3 étapes sur l'écran de réglages.
 */

import type { I18n } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Badge, Blob, CAST, Crown, INK, Phone, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

const N = " ";

type Txt = {
  slides: { title: string; text: string }[];
  noRec: string;
  zones: [string, string, string, string];
  talk: string;
  penalty: string;
};

export const TUTO_STR: I18n<Txt> = {
  fr: {
    slides: [
      { title: "Silence, on mesure", text: `D'abord, 3 secondes de silence total${N}: le tél mesure le bruit de la pièce. Rien n'est enregistré.` },
      { title: "Reste dans la zone", text: `Exemple, «${N}Le bon volume${N}»${N}: Hugo maintient «${N}Parler${N}» et chuchote sa phrase. L'aiguille doit rester dans «${N}Murmure${N}».` },
      { title: "Le moins bon prend", text: `Plus tu restes dans la zone, plus tu marques. À la fin, le dernier prend la peine. Chaque mode a sa règle${N}!` },
    ],
    noRec: "Rien n'est enregistré",
    zones: ["Murmure", "Normal", "Fort", "Cri"],
    talk: "Parler",
    penalty: "GAGE",
  },
  en: {
    slides: [
      { title: "Quiet, measuring", text: "First, 3 seconds of total silence: the phone measures the room's noise. Nothing is recorded." },
      { title: "Stay in the zone", text: "Example, \"Volume Control\": Hugo holds \"Talk\" and whispers his line. The needle must stay in \"Whisper\"." },
      { title: "Lowest score pays", text: "The longer you stay in the zone, the more you score. At the end, last place takes the penalty. Each mode has its own rule!" },
    ],
    noRec: "Nothing is recorded",
    zones: ["Whisper", "Normal", "Loud", "Shout"],
    talk: "Talk",
    penalty: "DARE",
  },
  es: {
    slides: [
      { title: "Silencio, medimos", text: "Primero, 3 segundos de silencio total: el móvil mide el ruido de la sala. No se graba nada." },
      { title: "Quédate en la zona", text: "Ejemplo, «El volumen justo»: Hugo mantiene «Hablar» y susurra su frase. La aguja debe quedarse en «Susurro»." },
      { title: "El peor paga", text: "Cuanto más tiempo en la zona, más puntos. Al final, el último se lleva el castigo. ¡Cada modo tiene su regla!" },
    ],
    noRec: "No se graba nada",
    zones: ["Susurro", "Normal", "Alto", "Grito"],
    talk: "Hablar",
    penalty: "RETO",
  },
};

/** Doigt « chut » devant la bouche d'un blob (x, y = bouche). */
function Hush({ x, y }: { x: number; y: number }) {
  return <rect x={x - 2.5} y={y - 6} width={5} height={16} rx={2.5} fill="#FFC9A8" stroke={INK} strokeWidth={1.8} />;
}

/** Cadenas (vie privée). */
function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-6 -4 L-6 -9 Q-6 -15 0 -15 Q6 -15 6 -9 L6 -4" fill="none" stroke={INK} strokeWidth={3} />
      <rect x={-9} y={-5} width={18} height={14} rx={3} fill="#FFD23F" stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

function Slide1({ s }: { s: Txt }) {
  const blobs: [number, string][] = [[28, CAST.lea], [70, CAST.malik], [150, CAST.ines], [192, CAST.hugo]];
  return (
    <TutoSvg floor>
      {blobs.map(([x, c], i) => (
        <g key={i}>
          <Blob x={x} y={140} s={38} color={c} mood="sleep" />
          <Hush x={x + 1} y={132} />
        </g>
      ))}
      <Phone x={84} y={38} w={52} h={88}>
        {/* le tél écoute : micro + ondes */}
        <rect x={18} y={18} width={8} height={16} rx={4} fill={INK} />
        <path d="M14 28 Q14 38 22 38 Q30 38 30 28 M22 38 L22 44" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M8 20 Q4 27 8 34 M36 20 Q40 27 36 34" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" className="gt-blink" />
        {/* jauge à zéro */}
        <rect x={6} y={58} width={32} height={8} rx={4} fill="#fff" stroke={INK} strokeWidth={2} />
        <rect x={7} y={59} width={3} height={6} rx={2} fill="#3DDC97" className="gt-blink" />
      </Phone>
      <g className="gt-bob">
        <Lock x={20} y={30} />
        <SvgText x={34} y={30} text={s.noRec} size={11} fill="#fff" anchor="start" style={{ wordSpacing: "0.25em" }} />
      </g>
    </TutoSvg>
  );
}

function Slide2({ s }: { s: Txt }) {
  // cadran 4 zones : murmure (surligné) → cri
  const cx = 140, cy = 106, r = 62;
  const colors = ["#3DDC97", "#FFD23F", "#FF9F1C", "#FF6B5B"];
  const p = (f: number, rr = r) => [cx + rr * Math.cos(Math.PI * (1 - f)), cy - rr * Math.sin(Math.PI * (1 - f))];
  const wedge = (a: number, b: number) => {
    const [x1, y1] = p(a); const [x2, y2] = p(b);
    return `M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
  };
  return (
    <TutoSvg>
      {colors.map((c, i) => <path key={i} d={wedge(i / 4, (i + 1) / 4)} fill={c} stroke={INK} strokeWidth={i === 0 ? 3.5 : 2} opacity={i === 0 ? 1 : 0.55} />)}
      {s.zones.map((z, i) => {
        const [x, y] = i === 0 ? [cx - r * 0.55, cy + 12] : p((i + 0.5) / 4, r + 13);
        return <SvgText key={z} x={x} y={y} text={z} size={i === 0 ? 11 : 9} fill={i === 0 ? "#3DDC97" : "rgba(255,255,255,0.75)"} />;
      })}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: "chut-needle 2.4s ease-in-out infinite" }}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - r + 4} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx} y2={cy - r + 4} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r={6} fill={INK} />
      <style>{"@keyframes chut-needle{0%,100%{transform:rotate(-70deg)}40%{transform:rotate(-55deg)}70%{transform:rotate(-78deg)}85%{transform:rotate(-30deg)}}"}</style>
      <Blob x={32} y={168} s={50} color={CAST.hugo} mood="talk" />
      <Phone x={58} y={112} w={24} h={40} rot={-10} />
      <g transform="translate(4 88)">
        <rect x={0} y={0} width={62} height={22} rx={11} fill="#FF3EA5" stroke={INK} strokeWidth={2.5} className="gt-pulse" />
      </g>
      <SvgText x={35} y={99.5} text={s.talk} size={11} fill="#fff" />
      <SvgText x={150} y={140} text="psst…" size={13} fill="#fff" className="gt-blink" />
    </TutoSvg>
  );
}

function Slide3({ s }: { s: Txt }) {
  return (
    <TutoSvg floor>
      {/* podium */}
      <rect x={80} y={92} width={60} height={48} fill="#FFD23F" stroke={INK} strokeWidth={3} />
      <rect x={20} y={110} width={60} height={30} fill="#4ECDC4" stroke={INK} strokeWidth={3} />
      <SvgText x={110} y={116} text="97" size={18} />
      <SvgText x={50} y={126} text="84" size={16} />
      <Blob x={110} y={92} s={40} color={CAST.lea} mood="happy" />
      <Crown x={110} y={46} s={0.8} className="gt-bob" />
      <Blob x={50} y={110} s={38} color={CAST.hugo} mood="happy" />
      {/* le dernier prend la peine */}
      <Blob x={180} y={140} s={44} color={CAST.tom} mood="sad" />
      <g className="gt-wiggle">
        <rect x={150} y={52} width={38} height={46} rx={6} fill="#fff" stroke={INK} strokeWidth={2.5} transform="rotate(-8 169 75)" />
        <SvgText x={169} y={75} text={s.penalty} size={10} style={{ transform: "rotate(-8deg)", transformOrigin: "169px 75px" }} />
      </g>
      <Badge x={204} y={60} r={12} fill="#FF6B5B" text="!" />
    </TutoSvg>
  );
}

export function useChutTuto(): TutoSlide[] {
  const s = useT(TUTO_STR);
  const arts = [<Slide1 key={0} s={s} />, <Slide2 key={1} s={s} />, <Slide3 key={2} s={s} />];
  return s.slides.map((x, i) => ({ ...x, art: arts[i] }));
}
