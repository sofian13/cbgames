"use client";

/** Tuto en slides de « Lâche pas ! » + textes ajoutés (prénoms des doigts). */

import type { ReactNode } from "react";
import type { I18n } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import type { TutoSlide } from "@/components/games/game-tuto";
import { Arrow, Blob, CAST, Crown, INK, SvgText, TutoSvg } from "@/components/games/game-tuto-art";

type Txt = { title: string; text: string };
interface LpExtra {
  slides: Txt[];
  art: { boom: string; first: string; coward: string; noBoom: string };
  whoPlays: string;
  whoPlaysSub: string;
  namePh: (n: number) => string;
  /** Lobby : prochain prénom attendu */
  nextFinger: (name: string) => string;
  youAre: (name: string, color: string) => string;
  lost: (names: string) => string;
  firstLostName: (name: string) => string;
  winnerName: (name: string) => string;
  /** Règles ajoutées */
  ruleNames: string;
  and: string;
  /** Écran de fin : classement de la partie (couronnes, départage au moins de défaites) */
  rankTitle: string;
  crowns: (n: number) => string;
  losses: (n: number) => string;
  champ: (names: string) => string;
  noChamp: string;
}

export const LP_EXTRA: I18n<LpExtra> = {
  fr: {
    slides: [
      { title: "Un doigt chacun", text: "Tél à plat, posez un doigt chacun, dans l'ordre des prénoms. Ton prénom s'affiche sous ton doigt !" },
      { title: "Lâche avant le BOUM", text: "Une bombe explose à un moment secret. Ton doigt est encore posé au BOUM ? Tu as perdu." },
      { title: "Mais pas le premier !", text: "Attention : si tout le monde lâche avant, le premier à avoir lâché perd. Le dernier à lâcher gagne la couronne." },
    ],
    art: { boom: "BOUM", first: "1er", coward: "TROUILLARD", noBoom: "pas de BOUM" },
    whoPlays: "Qui joue ?",
    whoPlaysSub: "Facultatif : posez vos doigts dans cet ordre, chacun aura son prénom sous le doigt.",
    namePh: (n) => `Joueur ${n}`,
    nextFinger: (n) => `Au tour de ${n} de poser son doigt`,
    youAre: (n, c) => `${n} = ${c}`,
    lost: (n) => `${n} a perdu`,
    firstLostName: (n) => `${n} a lâché en premier : perdu !`,
    winnerName: (n) => `${n} a lâché en dernier : il choisit qui fait un gage en plus !`,
    ruleNames: "Entrez vos prénoms avant de jouer (facultatif) et posez vos doigts dans cet ordre : chaque doigt garde son prénom et sa couleur.",
    and: " et ",
    rankTitle: "Classement de la partie",
    crowns: (n) => `${n} couronne${n > 1 ? "s" : ""}`,
    losses: (n) => `${n} défaite${n > 1 ? "s" : ""}`,
    champ: (n) => `${n} : le plus de couronnes !`,
    noChamp: "Égalité parfaite : pas de gagnant",
  },
  en: {
    slides: [
      { title: "One finger each", text: "Phone flat, everyone puts one finger down, in name order. Your name shows up under your finger!" },
      { title: "Let go before BOOM", text: "A bomb goes off at a secret moment. Finger still down at BOOM? You lose." },
      { title: "But not first!", text: "Careful: if everyone lets go early, the first to let go loses. The last to let go wins the crown." },
    ],
    art: { boom: "BOOM", first: "1st", coward: "CHICKEN", noBoom: "no BOOM" },
    whoPlays: "Who's playing?",
    whoPlaysSub: "Optional: put your fingers down in this order and everyone gets their name under their finger.",
    namePh: (n) => `Player ${n}`,
    nextFinger: (n) => `${n}, put your finger down`,
    youAre: (n, c) => `${n} = ${c}`,
    lost: (n) => `${n} lost`,
    firstLostName: (n) => `${n} let go first: you lose!`,
    winnerName: (n) => `${n} let go last: they pick someone to do an extra dare!`,
    ruleNames: "Enter your names before playing (optional) and put your fingers down in that order: each finger keeps its name and colour.",
    and: " and ",
    rankTitle: "Game standings",
    crowns: (n) => `${n} crown${n > 1 ? "s" : ""}`,
    losses: (n) => `${n} loss${n > 1 ? "es" : ""}`,
    champ: (n) => `${n}: the most crowns!`,
    noChamp: "Perfect tie: no winner",
  },
  es: {
    slides: [
      { title: "Un dedo cada uno", text: "Móvil plano, cada uno pone un dedo, en el orden de los nombres. ¡Tu nombre aparece bajo tu dedo!" },
      { title: "Suelta antes del BUM", text: "Una bomba explota en un momento secreto. ¿Tu dedo sigue puesto en el BUM? Pierdes." },
      { title: "¡Pero no el primero!", text: "Ojo: si todos sueltan antes, pierde el primero que soltó. El último en soltar gana la corona." },
    ],
    art: { boom: "BUM", first: "1.º", coward: "GALLINA", noBoom: "sin BUM" },
    whoPlays: "¿Quién juega?",
    whoPlaysSub: "Opcional: poned los dedos en este orden y cada uno tendrá su nombre bajo el dedo.",
    namePh: (n) => `Jugador ${n}`,
    nextFinger: (n) => `${n}, pon tu dedo`,
    youAre: (n, c) => `${n} = ${c}`,
    lost: (n) => `${n} ha perdido`,
    firstLostName: (n) => `${n} soltó primero: ¡pierde!`,
    winnerName: (n) => `${n} soltó el último: ¡elige quién hace un reto extra!`,
    ruleNames: "Escribid vuestros nombres antes de jugar (opcional) y poned los dedos en ese orden: cada dedo conserva su nombre y su color.",
    and: " y ",
    rankTitle: "Clasificación de la partida",
    crowns: (n) => `${n} corona${n > 1 ? "s" : ""}`,
    losses: (n) => `${n} derrota${n > 1 ? "s" : ""}`,
    champ: (n) => `${n}: ¡el que más coronas tiene!`,
    noChamp: "Empate total: no hay ganador",
  },
};

const RING = [CAST.lea, CAST.malik, CAST.ines, CAST.tom];

/** Téléphone à plat vu de dessus. */
function FlatPhone({ children }: { children?: ReactNode }) {
  return (
    <g>
      <rect x={60} y={30} width={100} height={112} rx={14} fill="#7A4EE8" stroke={INK} strokeWidth={3} />
      <rect x={66} y={38} width={88} height={96} rx={8} fill="#1A0F45" stroke={INK} strokeWidth={2} />
      {children}
    </g>
  );
}

function Ring({ x, y, color, off, className }: { x: number; y: number; color: string; off?: boolean; className?: string }) {
  return (
    <g className={className}>
      <circle cx={x} cy={y} r={11} fill="none" stroke={INK} strokeWidth={7} opacity={off ? 0.4 : 1} />
      <circle cx={x} cy={y} r={11} fill="none" stroke={off ? "#3A3150" : color} strokeWidth={4} />
      <circle cx={x} cy={y} r={5} fill="#FFC9A8" stroke={INK} strokeWidth={1.5} opacity={off ? 0 : 1} />
    </g>
  );
}

function ArtFingers() {
  const names = ["Léa", "Malik", "Inès", "Tom"];
  const pos: [number, number][] = [[92, 66], [128, 66], [92, 104], [128, 104]];
  const blobs: [number, number][] = [[28, 64], [192, 64], [28, 150], [192, 150]];
  return (
    <TutoSvg>
      <FlatPhone>
        {pos.map(([x, y], i) => (
          <g key={i} className="gt-pop" style={{ animationDelay: `${i * 0.25}s` }}>
            <Ring x={x} y={y} color={RING[i]} />
            <SvgText x={x} y={y + 18} text={names[i]} size={8} fill="#fff" />
          </g>
        ))}
      </FlatPhone>
      {blobs.map(([x, y], i) => (
        <g key={i}>
          <Blob x={x} y={y} s={36} color={RING[i]} mood="happy" />
          <path d={`M${x} ${y - 20} L${pos[i][0]} ${pos[i][1]}`} stroke={RING[i]} strokeWidth={2} strokeDasharray="3 4" opacity={0.8} />
        </g>
      ))}
    </TutoSvg>
  );
}

function Bomb({ x, y, lit = true }: { x: number; y: number; lit?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M8 -16 Q16 -26 24 -22" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {lit && <circle cx={25} cy={-23} r={4} fill="#FFD23F" stroke="#FF6B5B" strokeWidth={2} className="gt-blink" />}
      <circle r={17} fill="#2B2140" stroke={INK} strokeWidth={3} />
      <rect x={2} y={-21} width={10} height={7} rx={2} fill="#6B5A8E" stroke={INK} strokeWidth={2} transform="rotate(30)" />
      <circle cx={-6} cy={-6} r={4} fill="rgba(255,255,255,0.35)" />
    </g>
  );
}

function ArtBoom({ boom }: { boom: string }) {
  return (
    <TutoSvg>
      <FlatPhone>
        <Ring x={92} y={110} color={CAST.lea} />
        <Ring x={128} y={110} color={CAST.malik} />
        <g className="gt-fade-b"><circle cx={92} cy={110} r={12} fill="#2B2140" opacity={0.85} /><circle cx={128} cy={110} r={12} fill="#2B2140" opacity={0.85} /></g>
        <Ring x={110} y={70} color={CAST.ines} off />
      </FlatPhone>
      <g className="gt-fade-a"><Bomb x={110} y={78} /></g>
      <g className="gt-fade-b">
        <path d="M110 46 L118 62 L136 58 L124 72 L138 86 L118 84 L110 100 L102 84 L82 86 L96 72 L84 58 L102 62 Z" fill="#FFD23F" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <SvgText x={110} y={74} text={boom} size={14} />
      </g>
      {/* Inès a retiré son doigt à temps */}
      <Blob x={30} y={74} s={36} color={CAST.ines} mood="cool" />
      <Arrow d="M50 40 L50 20" head={[50, 20, -90]} color="#3DDC97" width={3} />
      <Blob x={30} y={150} s={36} color={CAST.lea} mood="panic" />
      <Blob x={192} y={150} s={36} color={CAST.malik} mood="panic" />
    </TutoSvg>
  );
}

function ArtFirst({ first, coward, noBoom }: { first: string; coward: string; noBoom: string }) {
  const order = [CAST.tom, CAST.malik, CAST.lea, CAST.ines];
  return (
    <TutoSvg floor>
      <Bomb x={186} y={36} lit={false} />
      <SvgText x={186} y={64} text={noBoom} size={9} fill="#fff" />
      <Arrow d="M20 104 L196 104" head={[196, 104, 0]} color="rgba(255,255,255,0.5)" width={2} />
      {order.map((c, i) => (
        <g key={i} className="gt-pop" style={{ animationDelay: `${i * 0.3}s` }}>
          <Blob x={34 + i * 48} y={146} s={38} color={c} mood={i === 0 ? "panic" : i === 3 ? "cool" : "happy"} />
          {i === 3 && <Crown x={34 + i * 48} y={104} s={0.9} className="gt-bob" />}
        </g>
      ))}
      {/* poule sur la tête du trouillard */}
      <g transform="translate(34 98)">
        <ellipse rx={9} ry={7} fill="#fff" stroke={INK} strokeWidth={2} />
        <path d="M-3 -7 L0 -12 L3 -7" fill="#FF6B5B" stroke={INK} strokeWidth={1.5} />
        <path d="M8 -1 L13 0 L8 2" fill="#FFD23F" stroke={INK} strokeWidth={1.2} />
        <circle cx={4} cy={-2} r={1.2} fill={INK} />
      </g>
      <g transform="translate(10 22)">
        <rect width={92} height={34} rx={10} fill="#FF6B5B" stroke={INK} strokeWidth={2.5} />
        <SvgText x={46} y={11} text={first} size={10} fill={INK} />
        <SvgText x={46} y={24} text={coward} size={11} fill={INK} />
      </g>
    </TutoSvg>
  );
}

export function useLpTutoSlides(): TutoSlide[] {
  const t = useT(LP_EXTRA);
  const arts: ReactNode[] = [
    <ArtFingers key="f" />,
    <ArtBoom key="b" boom={t.art.boom} />,
    <ArtFirst key="1" first={t.art.first} coward={t.art.coward} noBoom={t.art.noBoom} />,
  ];
  return t.slides.map((s, i) => ({ ...s, art: arts[i] }));
}
