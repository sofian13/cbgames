"use client";

/**
 * Vignettes du tuto de Mots Espions (220×170, DA sticker du kit game-tuto-art).
 * Léa (rose) et Malik : équipe rouge ; Inès (jaune) et Tom : équipe bleue.
 */

import { Arrow, Badge, Blob, CAST, Card, Check, Finger, INK, Phone, Sparkle, SvgText, TutoSvg, Zzz } from "@/components/games/game-tuto-art";

const RED = "#FF5A5F";
const BLUE = "#3D86FF";
const BEIGE = "#E6D9BC";
const CREAM = "#FFF6E5";

export type TutoArtText = { moon: string; rocket: string; star: string; beach: string; clue: string; chief: string; neutral: string; bomb: string; lost: string; blues: string; two: string };

/** Taille de texte qui tient dans une carte de largeur w. */
const fit = (text: string, w: number, max = 9) => Math.min(max, (w - 6) / (text.length * 0.72));

function WordCard({ x, y, w = 44, h = 20, word, fill = CREAM, color = INK, className, style }: { x: number; y: number; w?: number; h?: number; word: string; fill?: string; color?: string; className?: string; style?: React.CSSProperties }) {
  return <Card x={x} y={y} w={w} h={h} fill={fill} text={word} size={fit(word, w)} color={color} className={className} style={style} />;
}

/** Petit badge « CHEF » posé au-dessus d'un blob. */
function ChiefTag({ x, y, text, delay = 0 }: { x: number; y: number; text: string; delay?: number }) {
  const w = Math.max(30, text.length * 6 + 10);
  return <Card x={x - w / 2} y={y} w={w} h={14} fill="#FFD23F" text={text} size={8} className="gt-pulse" style={{ animationDelay: `${delay}s` }} />;
}

function Flag({ x, color, flip }: { x: number; color: string; flip?: boolean }) {
  const d = flip ? -1 : 1;
  return (
    <g className="gt-wiggle" style={{ transformOrigin: `${x}px 120px` }}>
      <line x1={x} y1={56} x2={x} y2={120} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${x} 58 L${x + 26 * d} 66 L${x} 76 Z`} fill={color} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
}

/** 1. Deux équipes, deux chefs : grille beige au centre, une équipe de chaque côté. */
export function ArtTeams({ a }: { a: TutoArtText }) {
  const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <TutoSvg floor>
      <Flag x={14} color={RED} />
      <Flag x={206} color={BLUE} flip />
      <Phone x={78} y={22} w={64} h={104}>
        {cells.map((i) => (
          <rect key={i} x={3 + (i % 3) * 17} y={6 + Math.floor(i / 3) * 27} width={14} height={22} rx={3} fill={BEIGE} stroke={INK} strokeWidth={1.5} />
        ))}
      </Phone>
      <Blob x={40} y={146} s={40} color={CAST.lea} mood="happy" className="gt-bob" />
      <ChiefTag x={40} y={88} text={a.chief} />
      <Blob x={66} y={152} s={30} color={CAST.malik} mood="smirk" />
      <Blob x={180} y={146} s={40} color={CAST.ines} mood="happy" className="gt-bob" style={{ animationDelay: "0.4s" }} />
      <ChiefTag x={180} y={88} text={a.chief} delay={0.6} />
      <Blob x={154} y={152} s={30} color={CAST.tom} mood="wink" />
    </TutoSvg>
  );
}

/** 2. Seul le chef voit : Léa et Inès regardent la carte, Malik et Tom ont les yeux fermés. */
export function ArtKey({ a }: { a: TutoArtText }) {
  return (
    <TutoSvg floor>
      <Phone x={34} y={20} w={52} h={84}>
        {[RED, BLUE, BEIGE, RED, INK, BEIGE].map((c, i) => (
          <rect key={i} x={4 + (i % 2) * 20} y={6 + Math.floor(i / 2) * 22} width={16} height={18} rx={3} fill={c} stroke={INK} strokeWidth={1.5} />
        ))}
      </Phone>
      <Blob x={36} y={150} s={38} color={CAST.lea} mood="smirk" />
      <Blob x={84} y={150} s={38} color={CAST.ines} mood="smirk" />
      {/* Zoom sur la carte secrète */}
      <g className="gt-float">
        <rect x={110} y={10} width={102} height={84} rx={12} fill={CREAM} stroke={INK} strokeWidth={3} />
        <WordCard x={116} y={16} w={44} word={a.moon} fill={RED} color="#fff" />
        <WordCard x={162} y={16} w={44} word={a.rocket} fill={RED} color="#fff" />
        <WordCard x={116} y={40} w={44} word={a.beach} fill={BLUE} color="#fff" />
        <WordCard x={162} y={40} w={44} word={a.star} fill={BEIGE} />
        <Card x={116} y={66} w={44} h={20} fill={INK}>
          <circle cx={9} cy={10} r={4.5} fill="#FFD23F" />
          <SvgText x={27} y={11} text={a.bomb} size={fit(a.bomb, 30, 8)} fill="#FFD23F" />
        </Card>
        <rect x={164} y={71} width={10} height={10} rx={3} fill={BEIGE} stroke={INK} strokeWidth={1.5} />
        <SvgText x={177} y={77} text={a.neutral} size={fit(a.neutral, 40, 9)} fill="#6B5A8E" anchor="start" />
      </g>
      <Arrow d="M88 48 Q100 44 106 50" head={[106, 50, 30]} color="#FFD23F" width={3} />
      {/* Les autres : yeux fermés */}
      <Blob x={140} y={152} s={30} color={CAST.malik} mood="sleep" />
      <Blob x={184} y={152} s={30} color={CAST.tom} mood="sleep" />
      <Zzz x={156} y={118} />
      <Zzz x={198} y={118} />
    </TutoSvg>
  );
}

/** 3. Un mot + un nombre : « ESPACE, 2 » relie Lune et Fusée, puis Léa se tait. */
export function ArtClue({ a }: { a: TutoArtText }) {
  const bw = Math.max(76, a.clue.length * 8 + 16);
  return (
    <TutoSvg floor>
      <Blob x={42} y={148} s={46} color={CAST.lea} mood="talk" />
      {/* bouche fermée (fermeture éclair) en fin d'animation */}
      <g className="gt-fade-b">
        <rect x={30} y={124} width={24} height={9} rx={3} fill={CAST.lea} />
        <path d="M31 128 L53 128" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M34 125 L34 131 M38 125 L38 131 M42 125 L42 131 M46 125 L46 131 M50 125 L50 131" stroke={INK} strokeWidth={1.5} />
      </g>
      <Bubble2 x={8} y={22} w={bw} text={a.clue} />
      <WordCard x={128} y={30} w={40} word={a.moon} fill={CREAM} />
      <WordCard x={172} y={30} w={42} word={a.rocket} fill={CREAM} />
      <WordCard x={128} y={56} w={40} word={a.beach} />
      <WordCard x={172} y={56} w={42} word={a.star} />
      <rect x={126} y={28} width={44} height={24} rx={8} fill="none" stroke={RED} strokeWidth={3} className="gt-blink" />
      <rect x={170} y={28} width={46} height={24} rx={8} fill="none" stroke={RED} strokeWidth={3} className="gt-blink" />
      <Arrow d={`M${8 + bw} 32 Q120 14 140 24`} head={[140, 25, 30]} color="#fff" width={3} dashed />
      <Arrow d={`M${8 + bw - 14} 22 Q150 -2 190 24`} head={[190, 25, 45]} color="#fff" width={3} dashed />
      <Badge x={170} y={104} r={15} fill="#FFD23F" text="2" className="gt-pulse" />
      <SvgText x={166} y={130} text={a.two} size={fit(a.two, 120, 9.5)} fill="#fff" />
    </TutoSvg>
  );
}

function Bubble2({ x, y, w, text }: { x: number; y: number; w: number; text: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M22 26 L30 40 L36 26 Z" fill="#fff" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={0} y={0} width={w} height={28} rx={12} fill="#fff" stroke={INK} strokeWidth={2.5} />
      <path d="M24 26 L34 26" stroke="#fff" strokeWidth={3} />
      <SvgText x={w / 2} y={15} text={text} size={Math.min(14, (w - 10) / (text.length * 0.62))} />
    </g>
  );
}

/** 4. On touche : bonne carte / neutre (tour fini) / bombe (perdu). */
export function ArtTap({ a }: { a: TutoArtText }) {
  return (
    <TutoSvg floor>
      {/* (1) Lune : rouge, on continue */}
      <WordCard x={8} y={26} w={56} h={26} word={a.moon} fill={RED} color="#fff" className="gt-pop" />
      <Check x={60} y={26} s={0.8} className="gt-pop" />
      <Finger x={36} y={50} rot={0} />
      <Blob x={36} y={150} s={34} color={CAST.malik} mood="happy" className="gt-bob" />
      <Sparkle x={58} y={110} s={0.8} />
      {/* (2) Étoile : neutre, au tour des Bleus */}
      <WordCard x={82} y={26} w={56} h={26} word={a.star} fill={BEIGE} />
      <Arrow d="M110 60 Q112 92 124 104" head={[124, 104, 50]} color="#fff" width={3} />
      <g className="gt-flash">
        <rect x={86} y={108} width={52} height={20} rx={10} fill={BLUE} stroke={INK} strokeWidth={2.5} />
        <SvgText x={112} y={119} text={a.blues} size={fit(a.blues, 52, 10)} fill="#fff" />
      </g>
      {/* (3) La bombe : perdu */}
      <g className="gt-shake">
        <Card x={156} y={26} w={56} h={26} fill={INK}>
          <circle cx={14} cy={13} r={6} fill="#FFD23F" />
          <path d="M18 7 L22 3" stroke="#FFD23F" strokeWidth={2} />
          <SvgText x={36} y={14} text="!" size={14} fill="#FFD23F" />
        </Card>
      </g>
      <Blob x={184} y={150} s={34} color={CAST.malik} mood="panic" />
      <g className="gt-flash" style={{ animationDelay: "0.4s" }}>
        <g transform="rotate(-12 184 84)">
          <rect x={150} y={72} width={68} height={24} rx={6} fill="none" stroke={RED} strokeWidth={3} />
          <SvgText x={184} y={85} text={a.lost} size={fit(a.lost, 68, 13)} fill={RED} />
        </g>
      </g>
      <line x1={74} y1={20} x2={74} y2={138} stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeDasharray="4 4" />
      <line x1={147} y1={20} x2={147} y2={138} stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeDasharray="4 4" />
    </TutoSvg>
  );
}
