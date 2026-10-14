"use client";

/**
 * Le Train Fou : tuto en slides (1re partie) + feuille de règles en jeu, FR / EN / ES.
 */

import { useState } from "react";
import { type I18n, useT } from "@/lib/i18n";
import { sipsAllowed } from "@/lib/party-mood";
import { GameRulesSheet, type TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Blob, CAST, Card, Check, INK, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

type Txt = {
  slides: { title: string; text: string }[];
  /** Slide 3 sans gorgées (Soirée Chill / sans alcool) */
  slide3NoSips: string;
  higher: string;
  equal: string;
  lower: string;
  /** Figures dans l'échelle des cartes (V D R A / J Q K A) */
  faces: [string, string, string, string];
  strongest: string;
  station: string;
  sipsGift: string;
  dareGift: string;
  rulesName: string;
  rules: string[];
  rulesNoSips: string[];
};

const TXT: I18n<Txt> = {
  fr: {
    slides: [
      { title: "Plus haut ou plus bas ?", text: "Une carte : 8. La suivante sera plus haute, plus basse ou égale (même valeur) ? L'As est la plus forte." },
      { title: "Wagon suivant… ou retour", text: "Bon pari = un wagon de plus. Raté : une peine, retour au wagon 1… et c'est encore toi qui joues." },
      { title: "En gare : tu distribues", text: "Tous les wagons d'affilée ? En gare ! Donne 2 gorgées ou un gage à qui tu veux, puis joueur suivant." },
    ],
    slide3NoSips: "Tous les wagons d'affilée ? En gare ! Donne un gage à qui tu veux, puis joueur suivant.",
    higher: "Plus haute",
    equal: "Égale",
    lower: "Plus basse",
    faces: ["V", "D", "R", "As"],
    strongest: "de plus en plus fort",
    station: "GARE",
    sipsGift: "2 gorgées",
    dareGift: "un gage",
    rulesName: "Le Train Fou",
    rules: [
      "Une carte est retournée. Parie : la suivante sera plus haute, plus basse ou égale (même valeur) ?",
      "Ordre des cartes : 2, 3… 10, Valet, Dame, Roi, As. L'As est la plus forte, les couleurs ne comptent pas.",
      "Un wagon = un bon pari. Enchaîne tous les wagons d'affilée (3 à 6, réglable) pour arriver en gare.",
      "Raté : une peine (1 gorgée par wagon atteint, 3 max, ou un gage) et retour au wagon 1. C'est toujours toi qui rejoues, jusqu'à la gare.",
      "Même valeur alors que tu n'as pas parié « Égale » : petite peine, mais tu restes sur ton wagon.",
      "En gare : tu donnes 2 gorgées ou un gage à qui tu veux, puis c'est au joueur suivant.",
      "Arrêtez quand vous voulez : le moins de peines gagne.",
    ],
    rulesNoSips: [
      "Une carte est retournée. Parie : la suivante sera plus haute, plus basse ou égale (même valeur) ?",
      "Ordre des cartes : 2, 3… 10, Valet, Dame, Roi, As. L'As est la plus forte, les couleurs ne comptent pas.",
      "Un wagon = un bon pari. Enchaîne tous les wagons d'affilée (3 à 6, réglable) pour arriver en gare.",
      "Raté : un gage et retour au wagon 1. C'est toujours toi qui rejoues, jusqu'à la gare.",
      "Même valeur alors que tu n'as pas parié « Égale » : un gage, mais tu restes sur ton wagon.",
      "En gare : tu donnes un gage à qui tu veux, puis c'est au joueur suivant.",
      "Arrêtez quand vous voulez : le moins de peines gagne.",
    ],
  },
  en: {
    slides: [
      { title: "Higher or lower?", text: "A card: 8. Will the next one be higher, lower or equal (same value)? Ace is the highest." },
      { title: "Next carriage… or back", text: "Right guess = one more carriage. Wrong: a penalty, back to carriage 1… and you keep playing." },
      { title: "Station: you hand out", text: "Every carriage in a row? Station! Give 2 sips or a dare to anyone, then it's the next player." },
    ],
    slide3NoSips: "Every carriage in a row? Station! Give a dare to anyone, then it's the next player.",
    higher: "Higher",
    equal: "Equal",
    lower: "Lower",
    faces: ["J", "Q", "K", "A"],
    strongest: "stronger and stronger",
    station: "STATION",
    sipsGift: "2 sips",
    dareGift: "a dare",
    rulesName: "The Crazy Train",
    rules: [
      "A card is flipped. Bet: will the next one be higher, lower or equal (same value)?",
      "Card order: 2, 3… 10, Jack, Queen, King, Ace. Ace is the highest; suits don't matter.",
      "One carriage = one right guess. Clear every carriage in a row (3 to 6, your choice) to reach the station.",
      "Wrong: a penalty (1 sip per carriage reached, 3 max, or a dare) and back to carriage 1. You keep playing until you reach the station.",
      "Same value when you didn't bet \"Equal\": small penalty, but you stay on your carriage.",
      "At the station: give 2 sips or a dare to anyone, then it's the next player's turn.",
      "Stop whenever you like: fewest penalties wins.",
    ],
    rulesNoSips: [
      "A card is flipped. Bet: will the next one be higher, lower or equal (same value)?",
      "Card order: 2, 3… 10, Jack, Queen, King, Ace. Ace is the highest; suits don't matter.",
      "One carriage = one right guess. Clear every carriage in a row (3 to 6, your choice) to reach the station.",
      "Wrong: a dare and back to carriage 1. You keep playing until you reach the station.",
      "Same value when you didn't bet \"Equal\": a dare, but you stay on your carriage.",
      "At the station: give a dare to anyone, then it's the next player's turn.",
      "Stop whenever you like: fewest penalties wins.",
    ],
  },
  es: {
    slides: [
      { title: "¿Más alta o más baja?", text: "Una carta: 8. ¿La siguiente será más alta, más baja o igual (mismo valor)? El As es la más alta." },
      { title: "Siguiente vagón… o atrás", text: "Acierto = un vagón más. Fallo: castigo, vuelta al vagón 1… y sigues jugando tú." },
      { title: "En la estación: repartes", text: "¿Todos los vagones seguidos? ¡Estación! Da 2 tragos o un reto a quien quieras y pasa al siguiente." },
    ],
    slide3NoSips: "¿Todos los vagones seguidos? ¡Estación! Da un reto a quien quieras y pasa al siguiente.",
    higher: "Más alta",
    equal: "Igual",
    lower: "Más baja",
    faces: ["J", "Q", "K", "A"],
    strongest: "cada vez más alta",
    station: "ESTACIÓN",
    sipsGift: "2 tragos",
    dareGift: "un reto",
    rulesName: "El Tren Loco",
    rules: [
      "Se gira una carta. Apuesta: ¿la siguiente será más alta, más baja o igual (mismo valor)?",
      "Orden de las cartas: 2, 3… 10, J, Q, K, As. El As es la más alta; los palos no cuentan.",
      "Un vagón = un acierto. Supera todos los vagones seguidos (de 3 a 6, a elegir) para llegar a la estación.",
      "Fallo: un castigo (1 trago por vagón alcanzado, 3 máx., o un reto) y vuelta al vagón 1. Sigues jugando tú hasta llegar a la estación.",
      "Mismo valor sin haber apostado «Igual»: castigo pequeño, pero te quedas en tu vagón.",
      "En la estación: da 2 tragos o un reto a quien quieras y le toca al siguiente jugador.",
      "Parad cuando queráis: gana quien tenga menos castigos.",
    ],
    rulesNoSips: [
      "Se gira una carta. Apuesta: ¿la siguiente será más alta, más baja o igual (mismo valor)?",
      "Orden de las cartas: 2, 3… 10, J, Q, K, As. El As es la más alta; los palos no cuentan.",
      "Un vagón = un acierto. Supera todos los vagones seguidos (de 3 a 6, a elegir) para llegar a la estación.",
      "Fallo: un reto y vuelta al vagón 1. Sigues jugando tú hasta llegar a la estación.",
      "Mismo valor sin haber apostado «Igual»: un reto, pero te quedas en tu vagón.",
      "En la estación: da un reto a quien quieras y le toca al siguiente jugador.",
      "Parad cuando queráis: gana quien tenga menos castigos.",
    ],
  },
};

const RED = "#E0218A";

/** Petit bouton de pari (pilule colorée + flèche). */
function BetPill({ x, y, bg, label, sym }: { x: number; y: number; bg: string; label: string; sym: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={86} height={22} rx={11} fill={bg} stroke={INK} strokeWidth={2.5} />
      <SvgText x={13} y={11.5} text={sym} size={13} />
      <SvgText x={50} y={11.5} text={label} size={11} />
    </g>
  );
}

/** Carte à jouer : valeur + cœur. */
function PlayCard({ x, y, v, rot = 0, className, style }: { x: number; y: number; v: string; rot?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <Card x={x} y={y} w={46} h={64} rot={rot} className={className} style={style}>
      <SvgText x={23} y={26} text={v} size={24} fill={RED} />
      <path d="M23 52 C15 46 15 40 19 40 C21 40 23 42 23 43 C23 42 25 40 27 40 C31 40 31 46 23 52 Z" fill={RED} />
    </Card>
  );
}

function ArtBet({ t }: { t: Txt }) {
  const scale = ["2", "3", "…", "10", ...t.faces];
  return (
    <TutoSvg>
      <Blob x={30} y={108} s={44} color={CAST.hugo} mood="smirk" className="gt-bob" />
      <PlayCard x={60} y={22} v="8" rot={-4} />
      {/* la carte suivante se retourne : « ? » puis 10 */}
      <g className="gt-fade-a"><Card x={88} y={30} w={36} h={50} fill="#7A4EE8" text="?" size={24} color="#fff" rot={6} /></g>
      <g className="gt-fade-b"><Card x={88} y={30} w={36} h={50} rot={6}><SvgText x={18} y={20} text="10" size={17} fill={RED} /><SvgText x={18} y={38} text="↑" size={14} fill="#1F9D63" /></Card></g>
      <g className="gt-fade-b"><Check x={128} y={32} s={0.8} /></g>
      <BetPill x={130} y={18} bg="#FF6B5B" label={t.higher} sym="↑" />
      <BetPill x={130} y={46} bg="#FFD23F" label={t.equal} sym="=" />
      <BetPill x={130} y={74} bg="#4ECDC4" label={t.lower} sym="↓" />
      {/* échelle des cartes, de la plus faible à la plus forte */}
      <rect x={6} y={124} width={208} height={40} rx={10} fill="#FFF6E5" stroke={INK} strokeWidth={2.5} />
      {scale.map((r, i) => {
        const x = 20 + i * 22.6;
        const last = i === scale.length - 1;
        return (
          <g key={i}>
            {last && <circle cx={x} cy={138} r={11} fill="#FFD23F" stroke={INK} strokeWidth={2} />}
            <SvgText x={x} y={138.5} text={r} size={r.length > 2 ? 9 : 12} />
          </g>
        );
      })}
      <Arrow d="M16 155 L196 155" head={[198, 155, 0]} color={INK} width={2.2} />
      <rect x={70} y={150} width={80} height={10} fill="#FFF6E5" />
      <SvgText x={110} y={155.5} text={t.strongest} size={8.5} />
    </TutoSvg>
  );
}

/** Wagon de train (rectangle + roues), numéro dessus. */
function Wagon({ x, n, fill }: { x: number; n: number; fill: string }) {
  return (
    <g transform={`translate(${x} 92)`}>
      <rect x={0} y={0} width={40} height={30} rx={6} fill={fill} stroke={INK} strokeWidth={2.5} />
      <SvgText x={20} y={15} text={String(n)} size={15} />
      <circle cx={10} cy={33} r={5} fill={INK} />
      <circle cx={30} cy={33} r={5} fill={INK} />
    </g>
  );
}

function ArtWagons() {
  return (
    <TutoSvg floor>
      <line x1={0} y1={131} x2={220} y2={131} stroke="#8B7BC2" strokeWidth={3} strokeDasharray="10 6" />
      {[0, 1, 2, 3].map((i) => <Wagon key={i} x={14 + i * 50} n={i + 1} fill={i < 2 ? "#3DDC97" : i === 2 ? "#FFD23F" : "#B79CFF"} />)}
      {/* Bon pari : Hugo avance du wagon 2 au wagon 3 */}
      <g className="gt-fade-a">
        <g className="gt-slide" style={{ ["--gt-dx" as string]: "50px" }}>
          <Blob x={84} y={92} s={30} color={CAST.hugo} mood="happy" />
        </g>
        <Arrow d="M92 52 Q110 36 128 52" head={[130, 54, 50]} color="#3DDC97" width={4} />
        <Check x={110} y={30} s={0.9} />
      </g>
      {/* Raté : retour au wagon 1 */}
      <g className="gt-fade-b">
        <Blob x={34} y={92} s={30} color={CAST.hugo} mood="panic" className="gt-shake" />
        <Arrow d="M134 56 Q88 18 42 54" head={[40, 56, 120]} color="#FF6B5B" width={4} />
        <Check x={90} y={26} s={0.9} ok={false} />
      </g>
    </TutoSvg>
  );
}

function ArtStation({ t, sips }: { t: Txt; sips: boolean }) {
  return (
    <TutoSvg floor>
      {/* panneau GARE */}
      <line x1={204} y1={40} x2={204} y2={140} stroke={INK} strokeWidth={4} />
      <rect x={150} y={12} width={64} height={28} rx={6} fill="#4ECDC4" stroke={INK} strokeWidth={2.5} />
      <SvgText x={182} y={26.5} text={t.station} size={t.station.length > 6 ? 10 : 13} />
      {/* le train arrive */}
      <g className="gt-slide" style={{ ["--gt-dx" as string]: "14px", animationIterationCount: 1, animationFillMode: "forwards" }}>
        <rect x={4} y={110} width={44} height={24} rx={6} fill="#FF6B5B" stroke={INK} strokeWidth={2.5} />
        <rect x={50} y={110} width={30} height={24} rx={6} fill="#3DDC97" stroke={INK} strokeWidth={2.5} />
        {[14, 38, 58, 72].map((cx) => <circle key={cx} cx={cx} cy={136} r={4.5} fill={INK} />)}
      </g>
      {/* Hugo (casquette de conducteur) désigne Sarah */}
      <Blob x={40} y={106} s={40} color={CAST.hugo} mood="cool">
        <path d="M-22 -26 Q0 -44 22 -26 Z" fill="#FF6B5B" stroke={INK} strokeWidth={3} />
        <path d="M14 -27 L34 -24" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </Blob>
      <Arrow d="M70 88 L114 104" head={[116, 105, 20]} color="#fff" width={4} className="gt-bob" />
      <Blob x={146} y={140} s={42} color={CAST.sarah} mood="panic" />
      {/* ce qu'elle reçoit */}
      <g className="gt-bob">
        <rect x={102} y={48} width={88} height={sips ? 36 : 22} rx={11} fill="#FFD23F" stroke={INK} strokeWidth={2.5} />
        {sips ? (
          <>
            <SvgText x={146} y={59} text={t.sipsGift} size={11} />
            <SvgText x={146} y={73} text={`/ ${t.dareGift}`} size={10} />
          </>
        ) : (
          <SvgText x={146} y={59.5} text={t.dareGift} size={11} />
        )}
      </g>
    </TutoSvg>
  );
}

/** Slides du tuto (dans la langue courante). */
export function useTgvSlides(): TutoSlide[] {
  const t = useT(TXT);
  const [sips] = useState(() => sipsAllowed(true));
  return [
    { ...t.slides[0], art: <ArtBet t={t} /> },
    { ...t.slides[1], art: <ArtWagons /> },
    { title: t.slides[2].title, text: sips ? t.slides[2].text : t.slide3NoSips, art: <ArtStation t={t} sips={sips} /> },
  ];
}

/** Feuille de règles du Train Fou (avec « Revoir le tuto »). */
export function TgvRules({ onClose, onTuto }: { onClose: () => void; onTuto: () => void }) {
  const t = useT(TXT);
  const [sips] = useState(() => sipsAllowed(true));
  return <GameRulesSheet name={t.rulesName} rules={sips ? t.rules : t.rulesNoSips} onClose={onClose} onTuto={onTuto} />;
}
