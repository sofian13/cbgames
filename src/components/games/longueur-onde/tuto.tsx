"use client";

/**
 * Tuto en slides + règles du Curseur (mode un seul téléphone), FR / EN / ES.
 * Le joueur qui voit la cible s'appelle « le Devin » (EN Psychic, ES Adivino).
 */

import type { I18n } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Badge, Blob, Bubble, CAST, Finger, INK, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

type Txt = {
  slides: { title: string; text: string }[];
  rules: string[];
  cold: string;
  hot: string;
  clue: string;
  legend: string;
  role: string;
};

export const TUTO_STR: I18n<Txt> = {
  fr: {
    slides: [
      { title: "Le Devin voit la cible", text: "À chaque manche, un joueur est le Devin : lui seul voit où se cache la cible sur l'échelle." },
      { title: "Un seul indice", text: "Léa voit la cible côté froid. Elle dit à voix haute un seul truc qui va là : « la banquise »." },
      { title: "Placez le curseur", text: "Les autres bougent le curseur ensemble, puis touchent « Valider ». Dans le mille : +4 pour Léa ! Chacun sera Devin." },
    ],
    rules: [
      "À chaque manche, un joueur est le Devin : lui seul voit en secret où se cache la cible sur l'échelle (ex. froid ↔ chaud).",
      "Le Devin dit à voix haute UN indice qui se place là (un mot ou un exemple, pas de chiffre), puis passe le tél.",
      "Les autres bougent le curseur ensemble, se mettent d'accord, puis touchent « Valider ».",
      "Seul le Devin marque : 4 points dans le mille, 3 tout près, 2 pas loin, 0 sinon.",
      "Chacun est Devin une fois. Le meilleur total gagne.",
    ],
    cold: "FROID",
    hot: "CHAUD",
    clue: "La banquise !",
    legend: "4 pile · 3 tout près · 2 pas loin",
    role: "DEVIN",
  },
  en: {
    slides: [
      { title: "The Psychic sees the target", text: "Each round, one player is the Psychic: only they see where the target hides on the scale." },
      { title: "Just one clue", text: "Léa sees the target on the cold side. She says one thing out loud that fits there: \"an iceberg\"." },
      { title: "Place the dial", text: "The others move the dial together, then tap \"Lock it in\". Bullseye: +4 for Léa! Everyone gets a turn as Psychic." },
    ],
    rules: [
      "Each round, one player is the Psychic: only they secretly see where the target hides on the scale (e.g. cold ↔ hot).",
      "The Psychic says ONE clue out loud that fits there (a word or an example, no numbers), then passes the phone.",
      "The others move the dial together, agree, then tap \"Lock it in\".",
      "Only the Psychic scores: 4 points for a bullseye, 3 if close, 2 if not far, 0 otherwise.",
      "Everyone is the Psychic once. Highest total wins.",
    ],
    cold: "COLD",
    hot: "HOT",
    clue: "An iceberg!",
    legend: "4 bullseye · 3 close · 2 not far",
    role: "PSYCHIC",
  },
  es: {
    slides: [
      { title: "El Adivino ve el objetivo", text: "En cada ronda, un jugador es el Adivino: solo él ve dónde se esconde el objetivo en la escala." },
      { title: "Una sola pista", text: "Léa ve el objetivo del lado frío. Dice en voz alta una sola cosa que encaje ahí: «el polo norte»." },
      { title: "Colocad el dial", text: "Los demás mueven el dial juntos y tocan «Confirmar». En el blanco: ¡+4 para Léa! Todos serán Adivino." },
    ],
    rules: [
      "En cada ronda, un jugador es el Adivino: solo él ve en secreto dónde se esconde el objetivo en la escala (p. ej., frío ↔ caliente).",
      "El Adivino dice en voz alta UNA pista que encaje ahí (una palabra o un ejemplo, sin números) y pasa el móvil.",
      "Los demás mueven el dial juntos, se ponen de acuerdo y tocan «Confirmar».",
      "Solo puntúa el Adivino: 4 puntos en el blanco, 3 si es casi, 2 si está cerca, 0 si no.",
      "Todos son Adivino una vez. Gana el total más alto.",
    ],
    cold: "FRÍO",
    hot: "CALOR",
    clue: "¡El polo norte!",
    legend: "4 en el blanco · 3 casi · 2 cerca",
    role: "ADIVINO",
  },
};

// Cadran en demi-cercle : f = 0 (gauche) → 1 (droite)
const CX = 110;
const CY = 108;
const R = 64;
const pt = (f: number, r = R): [number, number] => [CX + r * Math.cos(Math.PI * (1 - f)), CY - r * Math.sin(Math.PI * (1 - f))];
function wedge(f1: number, f2: number, r = R) {
  const [x1, y1] = pt(f1, r);
  const [x2, y2] = pt(f2, r);
  return `M${CX} ${CY} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}
const T = 0.12; // cible côté froid

/** Cadran froid ↔ chaud, avec (ou sans) la cible 2-3-4 et l'aiguille. */
function Dial({ s, target, needle }: { s: Txt; target: boolean; needle?: "anim" | "center" }) {
  const bands = ["#4ECDC4", "#9FE6E0", "#FFF6E5", "#FFB199", "#FF6B5B"];
  return (
    <g>
      {bands.map((c, i) => <path key={i} d={wedge(i / 5, (i + 1) / 5)} fill={c} />)}
      {target && (
        <g>
          <path d={wedge(T - 0.11, T + 0.11)} fill="#FFD23F" stroke={INK} strokeWidth={1.5} />
          <path d={wedge(T - 0.065, T + 0.065)} fill="#FF9F1C" stroke={INK} strokeWidth={1.5} />
          <path d={wedge(T - 0.025, T + 0.025)} fill="#FF3EA5" stroke={INK} strokeWidth={1.5} />
        </g>
      )}
      <path d={`M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY} Z`} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {needle && (
        <g style={needle === "anim" ? { transformOrigin: `${CX}px ${CY}px`, animation: "lo-needle 3s ease-in-out infinite" } : undefined}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - R + 6} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <line x1={CX} y1={CY} x2={CX} y2={CY - R + 6} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )}
      <circle cx={CX} cy={CY} r={6} fill={INK} />
      <SvgText x={CX - R + 4} y={CY + 11} text={s.cold} size={10} fill="#9FE6E0" />
      <SvgText x={CX + R - 4} y={CY + 11} text={s.hot} size={10} fill="#FF8A7E" />
      <style>{"@keyframes lo-needle{0%,15%{transform:rotate(0deg)}55%,100%{transform:rotate(-68deg)}}"}</style>
    </g>
  );
}

/** Bandeau de devin (turban) sur un blob. */
function Turban({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-20 0 Q-20 -18 0 -18 Q20 -18 20 0 Z" fill="#7A4EE8" stroke={INK} strokeWidth={2.5} />
      <circle cx={0} cy={-7} r={4} fill="#FFD23F" stroke={INK} strokeWidth={2} />
    </g>
  );
}

/** Bandeau sur les yeux. */
function Blindfold({ x, y, w = 40 }: { x: number; y: number; w?: number }) {
  return <rect x={x - w / 2} y={y - 5} width={w} height={10} rx={4} fill="#2E1C6E" stroke={INK} strokeWidth={2} />;
}

function Slide1({ s }: { s: Txt }) {
  return (
    <TutoSvg>
      <g transform="translate(26 -14)">
        <Dial s={s} target />
      </g>
      <Blob x={30} y={168} s={48} color={CAST.lea} mood="wink" />
      <Turban x={30} y={124} />
      <SvgText x={30} y={100} text={s.role} size={10} fill="#FFD23F" outline />
      <Blob x={150} y={168} s={40} color={CAST.malik} mood="sleep" />
      <Blindfold x={150} y={147} w={38} />
      <Blob x={194} y={168} s={40} color={CAST.ines} mood="sleep" />
      <Blindfold x={194} y={147} w={38} />
    </TutoSvg>
  );
}

function Slide2({ s }: { s: Txt }) {
  return (
    <TutoSvg>
      <g transform="translate(26 4) scale(0.8)">
        <Dial s={s} target />
      </g>
      <Blob x={40} y={168} s={52} color={CAST.lea} mood="talk" />
      <Turban x={40} y={120} />
      <Bubble x={100} y={126} w={108} h={28} text={s.clue} size={12} tail="left" className="gt-pulse" />
      <Arrow d="M112 122 Q100 100 86 86" head={[86, 86, -131]} color="#FFD23F" dashed />
    </TutoSvg>
  );
}

function Slide3({ s }: { s: Txt }) {
  return (
    <TutoSvg>
      <g transform="translate(10 -26)">
        <Dial s={s} target needle="anim" />
      </g>
      <Finger x={108} y={102} rot={-18} />
      <Finger x={134} y={102} rot={18} style={{ animationDelay: "0.3s" }} />
      <Blob x={24} y={130} s={38} color={CAST.lea} mood="happy" />
      <Badge x={24} y={78} r={13} fill="#FF3EA5" text="+4" className="gt-pulse" />
      <Blob x={198} y={130} s={36} color={CAST.malik} mood="happy" />
      <rect x={6} y={140} width={208} height={24} rx={12} fill="#2E1C6E" stroke={INK} strokeWidth={2} />
      <SvgText x={110} y={153} text={s.legend} size={10.5} fill="#fff" />
    </TutoSvg>
  );
}

/** Slides et règles du Curseur, dans la langue courante. */
export function useCurseurTuto(): { slides: TutoSlide[]; rules: string[] } {
  const s = useT(TUTO_STR);
  const arts = [<Slide1 key={0} s={s} />, <Slide2 key={1} s={s} />, <Slide3 key={2} s={s} />];
  return { slides: s.slides.map((x, i) => ({ ...x, art: arts[i] })), rules: s.rules };
}
