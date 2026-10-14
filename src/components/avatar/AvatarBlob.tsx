"use client";

import { useId, useInsertionEffect, type CSSProperties, type ReactNode } from "react";
import type { MascotMood } from "@/components/Mascot";
import { AVATAR_PALETTE, HAIR_COLORS, type AvatarLook } from "@/lib/avatar/look";

/**
 * AvatarBlob — le perso personnalisé d'un joueur (« Ma bande »).
 * SVG inline dans le repère 120×120 des ZBlob de l'app (contour encre, ombre
 * décalée, reflets) ; les éléments débordent du repère (overflow visible) :
 * prévoir ~25 % de marge au-dessus pour les grands chapeaux / coupes.
 * Net de 32 à 600 px. Animation légère (CSS, coupée si mouvement réduit).
 *
 * Couches (de l'arrière vers l'avant) : dos (cape, ailes, cheveux longs) → corps
 * → peau (rasé, barbe, joues) → visage (yeux, bouche, lunettes) → cheveux devant
 * → accessoires (écharpe…) → chapeau → casque audio.
 */

const INK = "#15082E";
const SW = 3; // contour des éléments
const SHAPE = "M60 14 C88 13 108 33 108 62 C108 90 88 106 60 106 C32 106 12 92 12 64 C12 35 32 15 60 14Z";

type Eye = { x: number; y: number; r: number };
const L0: Eye = { x: 42, y: 57, r: 14 };
const R0: Eye = { x: 78, y: 57, r: 14 };

/** Contexte passé à un costume de jeu (même forme que les costumes de l'app). */
export interface AvatarCostumeCtx { c: { body: string; deep: string; hi: string }; L: Eye; R: Eye; clip: string }
export interface AvatarCostumeLayers { back?: ReactNode; skin?: ReactNode; face?: ReactNode; top?: ReactNode }

/* ───────── Couleurs ───────── */
function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

const HAIR_DEFAULT: Record<string, string> = {
  swoop: "#6B3E1F", afro: "#4A2E1C", mohawk: "#FF3EA5", bun: "#6B3E1F", pigtails: "#F5C842",
  golden: "#FFD84A", swordsman: "#3BAF5D", hero: "#221838", long: "#2A1B3D", buzz: "#2A1B3D",
  curly: "#E8642A", bowl: "#6B3E1F", emo: "#221838", flame: "#FF5A2E",
};

/** Hauteur du sommet de la coupe (pour poser couronne, auréole, cône dessus). */
const HAIR_TOP: Record<string, number> = {
  none: 14, swoop: 7, afro: -10, mohawk: -12, bun: -14, pigtails: 8, golden: -24, swordsman: 9,
  hero: -16, long: 7, buzz: 14, curly: -2, bowl: 4, emo: 6, flame: -18,
};

/** Chapeaux qui couvrent le crâne : y du bord (les cheveux au-dessus sont cachés dessous). */
const HAT_COVER: Record<string, number> = {
  straw: 24, cap: 30, beanie: 32, bucket: 30, cowboy: 26, tophat: 20, bandana: 30,
};

/* ───────── Styles CSS (une seule fois) ───────── */
const CSS = `
.av-wob{animation:av-wob var(--av-d,2.8s) ease-in-out infinite;transform-origin:50% 92%}
.av-blink{transform-box:fill-box;transform-origin:center;animation:av-blink 4.8s infinite}
@keyframes av-wob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-2.5%) scale(0.985,1.02)}}
@keyframes av-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(0.12)}}
@media (prefers-reduced-motion: reduce){.av-wob,.av-blink{animation:none!important}}
`;
let styleDone = false;
function useAvatarStyle() {
  useInsertionEffect(() => {
    if (styleDone || typeof document === "undefined") return;
    styleDone = true;
    const el = document.createElement("style");
    el.setAttribute("data-avatar", "");
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

/* ───────── Yeux ───────── */
function eyes(style: string, c: { body: string; deep: string }, hide: { L: boolean; R: boolean }, blink: boolean): ReactNode {
  const ink = INK;
  const blinkCls = blink ? "av-blink" : undefined;
  const round = (e: Eye, look: [number, number], k: number, side: number, iris?: string) => {
    const px = e.x + look[0] * e.r * 0.8, py = e.y + look[1] * e.r * 0.8;
    const pr = e.r * k;
    return (
      <g key={side} className={blinkCls} style={blink ? { animationDelay: `${side * 0.06}s` } : undefined}>
        <ellipse cx={e.x} cy={e.y + 2.2} rx={e.r} ry={e.r} fill={c.deep} opacity={0.5} />
        <circle cx={e.x} cy={e.y} r={e.r} fill="#fff" stroke={ink} strokeWidth={1.6} />
        {iris ? (
          <>
            <ellipse cx={px} cy={py} rx={pr} ry={pr * 1.18} fill={iris} />
            <ellipse cx={px} cy={py + pr * 0.15} rx={pr * 0.55} ry={pr * 0.7} fill={ink} />
            <circle cx={px + pr * 0.35} cy={py - pr * 0.45} r={pr * 0.42} fill="#fff" />
            <circle cx={px - pr * 0.4} cy={py + pr * 0.5} r={pr * 0.18} fill="#fff" />
          </>
        ) : (
          <>
            <circle cx={px} cy={py} r={pr} fill={ink} />
            <circle cx={px + pr * 0.38} cy={py - pr * 0.4} r={pr * 0.32} fill="#fff" />
          </>
        )}
      </g>
    );
  };
  const arc = (e: Eye, up: boolean, key: number) => (
    <path key={key} d={up ? `M${e.x - e.r * 0.8} ${e.y + 3} Q${e.x} ${e.y - e.r * 0.9} ${e.x + e.r * 0.8} ${e.y + 3}` : `M${e.x - e.r * 0.8} ${e.y} Q${e.x} ${e.y + e.r * 0.7} ${e.x + e.r * 0.8} ${e.y}`}
      fill="none" stroke={ink} strokeWidth={4.2} strokeLinecap="round" />
  );
  const both = (f: (e: Eye, side: number) => ReactNode, L: Eye = L0, R: Eye = R0) => (
    <>
      {!hide.L && f(L, 0)}
      {!hide.R && f(R, 1)}
    </>
  );
  switch (style) {
    case "big":
      return both((e, s) => round({ ...e, r: 16 }, [s ? -0.12 : 0.12, 0.05], 0.62, s, "#5B36D6"));
    case "happy":
      return both((e, s) => arc(e, true, s));
    case "sleepy":
      return both((e, s) => (
        <g key={s}>
          <circle cx={e.x} cy={e.y} r={e.r - 1} fill="#fff" stroke={ink} strokeWidth={1.6} />
          <circle cx={e.x} cy={e.y + 4} r={(e.r - 1) * 0.5} fill={ink} />
          <path d={`M${e.x - e.r} ${e.y + 1} A${e.r} ${e.r} 0 0 1 ${e.x + e.r} ${e.y + 1}Z`} fill={c.body} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
        </g>
      ));
    case "determined": {
      // Regard « héros » : yeux en amande, sourcils froncés
      const eye = (e: Eye, s: number) => {
        const dir = s ? -1 : 1;
        const d = `M${e.x - 13} ${e.y - (s ? 6 : 0)} L${e.x + 13} ${e.y - (s ? 0 : 6)} C${e.x + 12} ${e.y + 10} ${e.x - 12} ${e.y + 10} ${e.x - 13} ${e.y - (s ? 6 : 0)}Z`;
        return (
          <g key={s}>
            <path d={d} fill="#fff" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
            <circle cx={e.x + dir * 2} cy={e.y + 2} r={5.6} fill={ink} />
            <circle cx={e.x + dir * 2 + 2} cy={e.y} r={1.8} fill="#fff" />
            <path d={`M${e.x - 13 * dir} ${e.y - 15} L${e.x + 12 * dir} ${e.y - 8}`} stroke={ink} strokeWidth={4.6} strokeLinecap="round" />
          </g>
        );
      };
      return both(eye);
    }
    case "star":
      return both((e, s) => (
        <g key={s} transform={`translate(${e.x} ${e.y}) scale(${e.r / 11})`}>
          <path d="M0 -12 L3.4 -3.8 L12 -3.6 L5.2 1.8 L7.6 10.4 L0 5.4 L-7.6 10.4 L-5.2 1.8 L-12 -3.6 L-3.4 -3.8Z" fill="#FFD23F" stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
        </g>
      ));
    case "heart":
      return both((e, s) => (
        <g key={s} transform={`translate(${e.x} ${e.y + 1}) scale(${e.r / 12})`}>
          <path d="M0 11 C-14 2 -14 -10 -6 -11 C-2 -11.5 0 -8 0 -6 C0 -8 2 -11.5 6 -11 C14 -10 14 2 0 11Z" fill="#FF2E7E" stroke={ink} strokeWidth={1.8} />
          <ellipse cx={-5} cy={-5} rx={2.4} ry={1.6} fill="#fff" opacity={0.8} />
        </g>
      ));
    case "wink":
      return both((e, s) => (s ? arc(e, true, s) : round(e, [0.15, 0.05], 0.56, s)));
    case "dots":
      return both((e, s) => (
        <g key={s} className={blinkCls}>
          <ellipse cx={e.x} cy={e.y + 2} rx={5.4} ry={6.6} fill={ink} />
          <circle cx={e.x + 1.8} cy={e.y - 0.6} r={1.8} fill="#fff" />
        </g>
      ));
    case "cross":
      return both((e, s) => round(e, s ? [-0.5, 0.15] : [0.5, 0.15], 0.5, s), { x: 42, y: 58, r: 13 }, { x: 78, y: 56, r: 16 });
    case "classic":
    default:
      return both((e, s) => round(e, s ? [-0.18, -0.12] : [0.28, 0.12], 0.56, s), { x: 42, y: 58, r: 13 }, { x: 78, y: 55, r: 16 });
  }
}

/* ───────── Bouche (selon l'humeur du moment) ───────── */
function mouth(mood: MascotMood, clipId: string): ReactNode {
  const mx = 60, my = 80;
  switch (mood) {
    case "shocked":
    case "mindblown":
      return <ellipse cx={mx} cy={my + 6} rx={6} ry={8} fill={INK} />;
    case "laughing":
    case "rofl":
    case "happy":
    case "wink":
    case "fire": {
      const big = mood === "laughing" || mood === "rofl";
      const w = big ? 15 : 11, h = big ? 17 : 13;
      const d = `M${mx - w} ${my - 3} H${mx + w} C${mx + w} ${my + h * 0.7} ${mx + w * 0.5} ${my + h} ${mx} ${my + h} C${mx - w * 0.5} ${my + h} ${mx - w} ${my + h * 0.7} ${mx - w} ${my - 3}Z`;
      return (
        <g>
          <clipPath id={`${clipId}-m`}><path d={d} /></clipPath>
          <path d={d} fill={INK} />
          <g clipPath={`url(#${clipId}-m)`}>
            {big && <rect x={mx - w} y={my - 3} width={w * 2} height={4} fill="#fff" />}
            <ellipse cx={mx} cy={my + h - 1} rx={w * 0.62} ry={h * 0.38} fill="#FF7A9C" />
          </g>
        </g>
      );
    }
    case "sad":
    case "angry":
    case "dead":
      return <path d={`M${mx - 9} ${my + 8} Q${mx} ${my - 1} ${mx + 9} ${my + 8}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    case "love":
    case "kiss":
      return <path d={`M${mx - 8} ${my + 1} Q${mx} ${my + 9} ${mx + 8} ${my + 1}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    case "cool":
    case "thinking":
      return <path d={`M${mx - 8} ${my + 4} Q${mx + 2} ${my + 10} ${mx + 11} ${my + 1}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    default:
      return <path d={`M${mx - 8} ${my + 5} L${mx + 8} ${my + 3}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
  }
}

/* ───────── Cheveux ───────── */
const flip = "translate(120 0) scale(-1 1)";

function hairLayers(id: string, hc: string): { back?: ReactNode; front?: ReactNode; skin?: ReactNode } {
  const dark = mix(hc, INK, 0.35);
  const light = mix(hc, "#ffffff", 0.45);
  const P = (d: string, extra?: ReactNode) => (
    <g>
      <path d={d} fill={hc} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {extra}
    </g>
  );
  const shine = (d: string, w = 3) => <path d={d} fill="none" stroke={light} strokeWidth={w} strokeLinecap="round" opacity={0.85} />;
  switch (id) {
    case "swoop":
      return {
        front: P("M11 54 C6 30 28 7 60 7 C92 7 114 28 110 54 C106 45 100 39 93 36 C95 42 93 47 89 50 C85 41 75 34 62 34 C52 34 44 37 37 43 C37 38 39 34 42 30 C29 33 18 42 11 54Z",
          shine("M30 19 C42 12 56 11 70 13")),
      };
    case "afro":
      return {
        back: (
          <g fill={hc} stroke={INK} strokeWidth={SW}>
            <circle cx={60} cy={16} r={26} /><circle cx={30} cy={25} r={22} /><circle cx={90} cy={25} r={22} />
            <circle cx={13} cy={47} r={16} /><circle cx={107} cy={47} r={16} />
          </g>
        ),
        front: P("M14 49 C12 31 29 15 45 19 C50 9 70 9 75 19 C91 15 108 31 106 49 C100 41 93 37 86 39 C82 33 73 31 67 35 C61 29 51 31 47 37 C41 33 31 35 27 41 C22 41 17 45 14 49Z",
          <g fill={dark} opacity={0.35}><circle cx={40} cy={26} r={2} /><circle cx={58} cy={20} r={2} /><circle cx={78} cy={25} r={2} /><circle cx={92} cy={34} r={2} /></g>),
      };
    case "mohawk":
      return {
        skin: <path d="M0 -10 H120 V36 C100 28 82 25 60 25 C38 25 20 28 0 36Z" fill={hc} opacity={0.3} />,
        front: P("M46 34 L41 7 L51 13 L51 -10 L60 2 L67 -12 L69 12 L79 5 L74 34 C66 31 54 31 46 34Z", shine("M56 -2 L58 14", 2.4)),
      };
    case "bun":
      return {
        back: (
          <g>
            <circle cx={60} cy={-1} r={14} fill={hc} stroke={INK} strokeWidth={SW} />
            <path d="M50 -6 C54 -10 62 -11 67 -7" fill="none" stroke={light} strokeWidth={2.4} strokeLinecap="round" />
          </g>
        ),
        front: P("M12 52 C8 28 32 8 60 8 C88 8 112 28 108 52 C100 38 84 30 60 30 C36 30 20 38 12 52Z",
          <><path d="M48 9 C50 14 54 18 60 20" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" />{shine("M28 21 C38 14 48 12 56 12")}</>),
      };
    case "pigtails": {
      const tail = "M17 38 C-3 32 -13 58 -5 79 C1 71 6 63 15 58Z";
      return {
        back: (
          <g>
            <path d={tail} fill={hc} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d={tail} transform={flip} fill={hc} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          </g>
        ),
        front: (
          <g>
            {P("M12 52 C8 28 32 8 60 8 C88 8 112 28 108 52 C102 40 90 32 76 32 C70 32 64 27 60 20 C56 27 50 32 44 32 C30 32 18 40 12 52Z", shine("M28 22 C36 15 44 12 52 12"))}
            <circle cx={14} cy={44} r={5} fill="#FF3EA5" stroke={INK} strokeWidth={2.4} />
            <circle cx={106} cy={44} r={5} fill="#FF3EA5" stroke={INK} strokeWidth={2.4} />
          </g>
        ),
      };
    }
    case "golden": {
      const d = "M10 56 L-8 34 L10 32 L-2 8 L22 18 L20 -10 L40 6 L48 -26 L61 0 L77 -24 L81 6 L102 -10 L100 18 L124 8 L110 32 L128 36 L110 56 C106 47 98 41 90 39 L86 48 L78 39 L70 48 L63 38 L56 49 L48 39 L39 47 L34 40 C24 42 15 48 10 56Z";
      return {
        front: P(d, <>
          <path d="M44 -12 L50 8 L36 10 M74 -12 L72 8 L86 6 M18 4 L28 20 M102 6 L94 22" fill="none" stroke={light} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 34 L32 30 M88 30 L98 34" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        </>),
      };
    }
    case "swordsman":
      return {
        front: P("M13 56 C9 30 30 9 60 9 C90 9 111 30 107 56 L103 49 C101 42 96 37 89 36 L85 40 L80 33 L72 37 L66 31 L60 36 L54 31 L48 37 L40 33 L35 40 L31 36 C24 37 19 42 17 49Z",
          <path d="M30 21 l3 5 M42 15 l2 5 M56 12 l1 5 M70 13 l-1 5 M84 17 l-2 5 M95 24 l-3 4" fill="none" stroke={dark} strokeWidth={2.2} strokeLinecap="round" />),
      };
    case "hero":
      return {
        front: P("M8 58 L-8 42 L8 36 L-4 16 L18 20 L14 -2 L34 10 L42 -18 L55 4 L68 -16 L74 6 L95 -6 L92 16 L116 12 L106 32 L128 40 L110 58 C106 49 100 43 92 41 L89 49 L82 40 L75 47 L69 38 L62 48 L56 38 L49 47 L44 39 L36 45 L34 40 C24 42 14 48 8 58Z",
          <path d="M40 -6 L46 8 M68 -6 L66 9 M20 10 L28 22 M96 6 L90 20" fill="none" stroke={light} strokeWidth={2.6} strokeLinecap="round" />),
      };
    case "long":
      return {
        back: <path d="M60 6 C26 6 4 30 4 62 L3 102 Q13 108 23 101 L97 101 Q107 108 117 102 L116 62 C116 30 94 6 60 6Z" fill={dark} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />,
        front: P("M10 60 C6 28 30 7 60 7 C90 7 114 28 110 60 C106 46 98 37 85 33 C75 30 66 25 60 17 C54 25 45 30 35 33 C22 37 14 46 10 60Z", shine("M26 24 C34 16 42 12 50 11")),
      };
    case "buzz":
      return {
        skin: (
          <g>
            <path d="M0 -10 H120 V42 C110 37 104 34 98 33 C86 29 74 27 60 27 C46 27 34 29 22 33 C16 34 10 37 0 42Z" fill={hc} opacity={0.82} />
            <path d="M30 19 C40 14 50 13 58 14" fill="none" stroke={light} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
            <g fill={light} opacity={0.45}>
              {[[30, 26], [42, 21], [54, 19], [66, 19], [78, 21], [90, 26], [36, 31], [60, 24], [84, 31]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} />)}
            </g>
          </g>
        ),
      };
    case "curly": {
      const ring = (rad: number, a0: number, a1: number, n: number, r: number) =>
        Array.from({ length: n }, (_, i) => {
          const a = ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
          return <circle key={`${rad}-${i}`} cx={60 + Math.cos(a) * rad} cy={50 + Math.sin(a) * rad} r={r} />;
        });
      return {
        back: <g fill={hc} stroke={INK} strokeWidth={SW}><circle cx={10} cy={56} r={10} /><circle cx={110} cy={56} r={10} /></g>,
        front: (
          <g fill={hc} stroke={INK} strokeWidth={2.6}>
            {ring(44, 190, 350, 9, 11)}
            {ring(32, 215, 325, 6, 10)}
          </g>
        ),
      };
    }
    case "bowl":
      return {
        front: P("M9 60 C4 26 30 4 60 4 C90 4 116 26 111 60 L104 60 C104 50 101 42 97 37 L23 37 C19 42 16 50 16 60Z",
          <path d="M34 37 L36 28 M48 37 L49 28 M60 37 L60 28 M72 37 L71 28 M86 37 L84 28" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" opacity={0.7} />),
      };
    case "emo":
      return {
        front: P("M10 56 C6 28 30 6 62 6 C94 6 114 30 111 60 C109 73 101 80 94 79 C97 68 93 56 85 47 C71 40 51 36 37 36 C27 38 16 46 10 56Z", shine("M70 14 C86 18 98 28 104 44")),
      };
    case "flame":
      return {
        front: P("M12 56 C4 40 6 24 16 12 C16 22 20 26 24 26 C20 12 28 -2 40 -8 C36 4 40 12 46 14 C46 0 54 -12 64 -18 C62 -6 66 4 72 8 C74 -2 82 -8 90 -10 C86 0 88 10 94 14 C100 10 104 6 108 2 C112 18 112 34 108 56 C104 47 96 41 88 39 C76 35 66 37 60 41 C52 35 40 35 30 39 C22 41 16 47 12 56Z",
          <path d="M30 30 C28 22 32 14 38 8 C38 16 42 20 46 22 C48 12 54 4 60 0 C60 10 64 16 70 18 C72 12 78 8 84 6 C82 14 84 20 90 24" fill="none" stroke="#FFD23F" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />),
      };
    default:
      return {};
  }
}

/* ───────── Chapeaux ───────── */
function hatLayer(id: string, dy: number, bc: string): ReactNode {
  const S = { stroke: INK, strokeWidth: SW, strokeLinejoin: "round" as const };
  switch (id) {
    case "straw":
      return (
        <g transform="rotate(-6 60 24)">
          <ellipse cx={60} cy={25} rx={55} ry={12} fill="#F2C14E" {...S} />
          <path d="M14 27 C30 33 90 33 106 27" fill="none" stroke="#C9952E" strokeWidth={1.8} strokeLinecap="round" />
          <path d="M31 25 C29 3 42 -9 60 -9 C78 -9 91 3 89 25Z" fill="#F6CF5E" {...S} />
          <path d="M31.4 15 C44 19 76 19 88.6 15 L89 24.5 C76 28.5 44 28.5 31 24.5Z" fill="#E5322D" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M44 -3 C42 4 42 9 43 13 M60 -7 L60 12 M76 -3 C78 4 78 9 77 13" fill="none" stroke="#C9952E" strokeWidth={1.6} strokeLinecap="round" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M22 32 C8 31 -6 34 -14 41 C-12 28 2 21 24 22Z" fill="#C81E3A" {...S} />
          <path d="M16 32 C16 7 38 -5 60 -5 C82 -5 104 7 104 32Z" fill="#FF3E5B" {...S} />
          <path d="M60 -5 C54 6 52 18 52 32 M60 -5 C68 6 70 18 70 32" fill="none" stroke="#C81E3A" strokeWidth={2} />
          <path d="M28 14 C34 6 42 2 50 1" fill="none" stroke="#FF9AA8" strokeWidth={3} strokeLinecap="round" />
          <circle cx={60} cy={-5} r={3.6} fill="#C81E3A" stroke={INK} strokeWidth={2.2} />
        </g>
      );
    case "beanie":
      return (
        <g>
          <circle cx={60} cy={-9} r={9} fill="#fff" {...S} />
          <path d="M14 36 C12 10 34 -5 60 -5 C86 -5 108 10 106 36Z" fill="#3D7BFF" {...S} />
          <path d="M11 27 C34 21 86 21 109 27 L109 40 C86 34 34 34 11 40Z" fill="#2A5BD6" {...S} />
          <path d="M22 25 L22 37 M34 23 L34 35 M46 22 L46 34 M58 22 L58 34 M70 22 L70 34 M82 23 L82 35 M94 24 L94 36" fill="none" stroke="#1F44A8" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      );
    case "crown":
      return (
        <g transform={`translate(60 ${12 + dy}) rotate(-6)`}>
          <path d="M-22 6 L-26 -18 L-12 -6 L0 -24 L12 -6 L26 -18 L22 6Z" fill="#FFD23F" {...S} />
          <path d="M-20 0 H20" stroke="#E09A00" strokeWidth={2} />
          <circle cx={0} cy={-6} r={3.6} fill="#FF3EA5" stroke={INK} strokeWidth={1.8} />
          <circle cx={-15} cy={-2} r={2.2} fill="#4ECDC4" stroke={INK} strokeWidth={1.4} />
          <circle cx={15} cy={-2} r={2.2} fill="#4ECDC4" stroke={INK} strokeWidth={1.4} />
        </g>
      );
    case "horns": {
      const h = "M33 26 C24 19 21 7 25 -5 C31 5 37 11 44 15Z";
      return (
        <g transform={`translate(0 ${Math.min(0, dy * 0.6)})`}>
          <path d={h} fill="#E8304A" {...S} />
          <path d={h} transform={flip} fill="#E8304A" {...S} />
          <path d="M27 3 C29 9 32 13 36 16" fill="none" stroke="#FF9AA8" strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    }
    case "bucket":
      return (
        <g>
          <path d="M24 30 C24 6 40 -4 60 -4 C80 -4 96 6 96 30Z" fill="#F7E9C8" {...S} />
          <g fill="#FF6B5B"><circle cx={40} cy={10} r={2.6} /><circle cx={56} cy={4} r={2.6} /><circle cx={72} cy={8} r={2.6} /><circle cx={84} cy={18} r={2.6} /><circle cx={48} cy={20} r={2.6} /><circle cx={66} cy={20} r={2.6} /></g>
          <path d="M8 38 L22 27 L98 27 L112 38 C92 45 28 45 8 38Z" fill="#EAD6A8" {...S} />
        </g>
      );
    case "ninja":
      return (
        <g>
          <path d="M104 29 C115 29 123 35 131 45 C123 44 116 40 107 37Z" fill="#26306B" {...S} />
          <path d="M104 33 C116 37 121 46 125 58 C117 52 110 46 103 40Z" fill="#26306B" {...S} />
          <g clipPath={`url(#${bc})`}><rect x={0} y={23} width={120} height={15} fill="#26306B" /><path d="M0 23 H120 M0 38 H120" stroke={INK} strokeWidth={2.4} /></g>
          <rect x={39} y={20} width={42} height={21} rx={4} fill="#C9D1E2" {...S} />
          <path d="M42 24 H78" stroke="#EEF2FA" strokeWidth={2.4} strokeLinecap="round" />
          <path d="M50 32 H70" stroke="#8E9AB5" strokeWidth={2.2} strokeLinecap="round" />
          <g fill="#8E9AB5"><circle cx={44} cy={25} r={1.6} /><circle cx={76} cy={25} r={1.6} /><circle cx={44} cy={36} r={1.6} /><circle cx={76} cy={36} r={1.6} /></g>
        </g>
      );
    case "cowboy":
      return (
        <g transform="translate(0 -4)">
          <path d="M30 28 C28 6 38 -6 46 -4 C52 -2 56 4 60 4 C64 4 68 -2 74 -4 C82 -6 92 6 90 28Z" fill="#A0622D" {...S} />
          <path d="M31 19 C46 23 74 23 89 19 L90 27 C74 31 46 31 30 27Z" fill="#5A3420" stroke={INK} strokeWidth={2.2} />
          <path d="M-6 21 C8 31 30 29 60 29 C90 29 112 31 126 21 C122 35 98 41 60 41 C22 41 -2 35 -6 21Z" fill="#B8743A" {...S} />
          <path d="M46 2 C48 8 50 12 52 14" fill="none" stroke="#C98A4E" strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case "bow":
      return (
        <g transform="translate(31 19) rotate(-22) scale(1.15)">
          <path d="M0 0 C-6 -12 -20 -10 -17 2 C-15 11 -6 7 0 0Z" fill="#FF3EA5" {...S} strokeWidth={2.6} />
          <path d="M0 0 C6 -12 20 -10 17 2 C15 11 6 7 0 0Z" fill="#FF3EA5" {...S} strokeWidth={2.6} />
          <circle cx={0} cy={0} r={4.2} fill="#FF7EC0" stroke={INK} strokeWidth={2.4} />
        </g>
      );
    case "halo":
      return (
        <g transform={`translate(0 ${dy - 5})`}>
          <ellipse cx={60} cy={2} rx={25} ry={6.5} fill="none" stroke={INK} strokeWidth={8.5} />
          <ellipse cx={60} cy={2} rx={25} ry={6.5} fill="none" stroke="#FFD23F" strokeWidth={4.4} />
          <path d="M44 0 C48 -2 54 -3 58 -3" fill="none" stroke="#FFF3A0" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      );
    case "tophat":
      return (
        <g transform="rotate(-5 60 20)">
          <path d="M37 21 L39 -24 C50 -27 70 -27 81 -24 L83 21Z" fill="#2E2250" {...S} />
          <path d="M38 8 L82 8 L82.6 18 L37.4 18Z" fill="#E8304A" stroke={INK} strokeWidth={2.2} />
          <path d="M44 -20 L44 4" stroke="#5B4A8A" strokeWidth={2.4} strokeLinecap="round" />
          <ellipse cx={60} cy={22} rx={39} ry={7} fill="#22183A" {...S} />
        </g>
      );
    case "party":
      return (
        <g transform={`translate(0 ${dy}) rotate(-10 60 12)`}>
          <path d="M45 15 L60 -26 L75 15 C66 19 54 19 45 15Z" fill="#3DDC97" {...S} />
          <path d="M51 -2 L69 -2 M55 -13 L65 -13 M47.6 8 L72.4 8" stroke="#FFD23F" strokeWidth={3.4} />
          <path d="M45 15 L60 -26 L75 15 C66 19 54 19 45 15Z" fill="none" {...S} />
          <circle cx={60} cy={-27} r={5} fill="#FF3EA5" stroke={INK} strokeWidth={2.4} />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M11 39 C1 45 -5 53 -8 62 C1 58 7 52 13 45Z" fill="#1E1830" {...S} />
          <path d="M14 41 C8 51 8 59 10 67 C16 59 18 51 18 45Z" fill="#1E1830" {...S} />
          <path d="M12 38 C10 11 34 -3 60 -3 C86 -3 110 11 108 38 C88 31 32 31 12 38Z" fill="#2A2342" {...S} />
          <path d="M18 30 C40 25 80 25 102 30" fill="none" stroke="#4A3F6B" strokeWidth={2} />
          <g fill="#fff" opacity={0.55}><circle cx={40} cy={10} r={1.8} /><circle cx={60} cy={5} r={1.8} /><circle cx={80} cy={10} r={1.8} /><circle cx={50} cy={18} r={1.5} /><circle cx={70} cy={18} r={1.5} /><circle cx={30} cy={22} r={1.5} /><circle cx={90} cy={22} r={1.5} /></g>
          <circle cx={14} cy={38} r={6} fill="#2A2342" {...S} />
        </g>
      );
    default:
      return null;
  }
}

/* ───────── Accessoires du visage ───────── */
function faceLayer(id: string, c: { body: string; deep: string }, hc: string, bc: string): { skin?: ReactNode; over?: ReactNode } {
  const S = { stroke: INK, strokeWidth: SW, strokeLinejoin: "round" as const };
  switch (id) {
    case "shades":
      return {
        over: (
          <g>
            <path d="M25 47 H97" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <path d="M26 46 H56 V55 C56 67 26 67 26 55Z" fill={INK} />
            <path d="M64 46 H95 V55 C95 67 64 67 64 55Z" fill={INK} />
            <path d="M32 51 l8 0 M70 51 l8 0" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.75} />
          </g>
        ),
      };
    case "round":
      return {
        over: (
          <g fill="none" stroke={INK} strokeWidth={3.4}>
            <circle cx={42} cy={57} r={17} fill="#fff" fillOpacity={0.14} />
            <circle cx={78} cy={57} r={17} fill="#fff" fillOpacity={0.14} />
            <path d="M58 54 Q60 50 62 54 M25 54 L13 50 M95 54 L107 50" strokeLinecap="round" />
          </g>
        ),
      };
    case "moustache":
      return {
        over: <path d="M60 73 C53 65 39 65 31 76 C38 73 45 76 51 79 C56 80 58 78 60 76 C62 78 64 80 69 79 C75 76 82 73 89 76 C81 65 67 65 60 73Z" fill={hc} {...S} strokeWidth={2.4} />,
      };
    case "scar":
      return {
        skin: (
          <g>
            <path d="M28 77 C35 74 42 72 51 71" fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
            <path d="M28 77 C35 74 42 72 51 71" fill="none" stroke="#FFB3C2" strokeWidth={2.6} strokeLinecap="round" />
            <path d="M34 71 l2 8 M40 69.6 l1.8 7.6 M46 68.6 l1.4 7" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
          </g>
        ),
      };
    case "plaster":
      return {
        over: (
          <g transform="translate(89 77) rotate(-28)">
            <rect x={-12} y={-5} width={24} height={10} rx={4} fill="#FFD9B0" stroke={INK} strokeWidth={2.2} />
            <rect x={-4} y={-5} width={8} height={10} fill="#F2BC8A" stroke={INK} strokeWidth={1.4} />
            <g fill="#D99A68"><circle cx={-8} cy={-1.5} r={0.9} /><circle cx={-8} cy={1.5} r={0.9} /><circle cx={8} cy={-1.5} r={0.9} /><circle cx={8} cy={1.5} r={0.9} /></g>
          </g>
        ),
      };
    case "mask":
      return {
        over: (
          <g clipPath={`url(#${bc})`}>
            <path d="M0 74 C20 70 40 69 60 72 C80 69 100 70 120 74 V130 H0Z" fill="#2A2F4F" stroke={INK} strokeWidth={SW} />
            <path d="M22 86 C42 82 78 82 98 86 M28 97 C46 93 74 93 92 97" fill="none" stroke="#454B73" strokeWidth={2.2} strokeLinecap="round" />
          </g>
        ),
      };
    case "patch":
      return {
        over: (
          <g>
            <path d="M14 30 L66 47 M92 60 L109 66" stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <ellipse cx={78} cy={57} rx={15} ry={13} fill={INK} />
            <path d="M70 52 C73 49 78 48 82 49" fill="none" stroke="#4A3F6B" strokeWidth={2} strokeLinecap="round" />
          </g>
        ),
      };
    case "blush":
      return {
        skin: (
          <g>
            <ellipse cx={27} cy={77} rx={9} ry={5.2} fill="#FF4F8B" opacity={0.6} />
            <ellipse cx={93} cy={77} rx={9} ry={5.2} fill="#FF4F8B" opacity={0.6} />
            <path d="M23 75 l2 -3 M28 75 l2 -3 M89 75 l2 -3 M94 75 l2 -3" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
          </g>
        ),
      };
    case "goggles":
      return {
        over: (
          <g>
            <path d="M8 52 L23 54 M97 54 L112 52" stroke="#6B3E1F" strokeWidth={6} strokeLinecap="round" />
            <path d="M8 52 L23 54 M97 54 L112 52" stroke={INK} strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />
            {[42, 78].map((x) => (
              <g key={x}>
                <circle cx={x} cy={57} r={17.5} fill="#FFB020" fillOpacity={0.35} stroke={INK} strokeWidth={7.5} />
                <circle cx={x} cy={57} r={17.5} fill="none" stroke="#C08040" strokeWidth={4} />
                <path d={`M${x - 9} ${50} q4 -4 9 -4`} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
              </g>
            ))}
            <path d="M59 55 h2" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          </g>
        ),
      };
    case "freckles":
      return {
        skin: (
          <g fill={mix(c.deep, INK, 0.3)} opacity={0.7}>
            {[[25, 72], [31, 76], [23, 79], [29, 81], [95, 72], [89, 76], [97, 79], [91, 81]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} />)}
          </g>
        ),
      };
    case "beard":
      return {
        skin: (
          <path d="M8 64 C14 72 21 77 30 78 C40 74 50 75 60 79 C70 75 80 74 90 78 C99 77 106 72 112 64 L120 130 L0 130Z" fill={hc} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        ),
      };
    case "domino":
      return {
        over: (
          <path fillRule="evenodd" fill={INK}
            d="M17 50 C23 39 46 40 60 46 C74 40 97 39 103 50 C105 63 94 71 84 69 C74 67 66 61 60 59 C54 61 46 67 36 69 C26 71 15 63 17 50Z M33 57 a9 8 0 1 0 18 0 a9 8 0 1 0 -18 0Z M69 57 a9 8 0 1 0 18 0 a9 8 0 1 0 -18 0Z" />
        ),
      };
    default:
      return {};
  }
}

/* ───────── Accessoires du corps ───────── */
function extraLayers(id: string, c: { body: string; deep: string }, top: number, bc: string): { back?: ReactNode; front?: ReactNode; top?: ReactNode } {
  const S = { stroke: INK, strokeWidth: SW, strokeLinejoin: "round" as const };
  switch (id) {
    case "scarf":
      return {
        front: (
          <g>
            <g clipPath={`url(#${bc})`}>
              <path d="M0 89 C30 98 90 98 120 89 L120 112 C90 120 30 120 0 112Z" fill="#E8304A" {...S} />
              <path d="M24 94 L22 110 M40 97 L39 112 M56 98 L56 113 M72 98 L72 113 M88 96 L89 111" stroke="#fff" strokeWidth={3.2} opacity={0.9} />
            </g>
            <path d="M28 96 L20 120 L35 122 L41 99Z" fill="#E8304A" {...S} />
            <path d="M26 105 L37 107 M23 113 L35 115" stroke="#fff" strokeWidth={2.8} />
          </g>
        ),
      };
    case "armband":
      return {
        back: (
          <g>
            <ellipse cx={9} cy={84} rx={11} ry={8} transform="rotate(30 9 84)" fill={c.body} {...S} />
            <ellipse cx={113} cy={82} rx={13} ry={9} transform="rotate(-30 113 82)" fill={c.body} {...S} />
            <path d="M110 72 L119 90" stroke={INK} strokeWidth={11} strokeLinecap="round" />
            <path d="M110 72 L119 90" stroke="#2A2342" strokeWidth={7} strokeLinecap="round" />
            <circle cx={113} cy={78} r={1.2} fill="#fff" /><circle cx={116} cy={84} r={1.2} fill="#fff" />
            <path d="M119 88 L129 94 L124 99Z M118 90 L122 102 L115 101Z" fill="#2A2342" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          </g>
        ),
      };
    case "necklace":
      return {
        front: (
          <g>
            <path d="M32 93 C44 103 76 103 88 93" fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
            <path d="M32 93 C44 103 76 103 88 93" fill="none" stroke="#FFD23F" strokeWidth={2.6} strokeLinecap="round" />
            <path transform="translate(60 104) scale(0.62)" d="M0 -12 L3.4 -3.8 L12 -3.6 L5.2 1.8 L7.6 10.4 L0 5.4 L-7.6 10.4 L-5.2 1.8 L-12 -3.6 L-3.4 -3.8Z" fill="#FFD23F" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
          </g>
        ),
      };
    case "bowtie":
      return {
        front: (
          <g>
            <path d="M60 104 L43 95 L43 113Z" fill="#E8304A" {...S} />
            <path d="M60 104 L77 95 L77 113Z" fill="#E8304A" {...S} />
            <rect x={55.5} y={99.5} width={9} height={9} rx={2.4} fill="#C41F3A" {...S} strokeWidth={2.4} />
          </g>
        ),
      };
    case "cape":
      return {
        back: (
          <g>
            <path d="M24 40 C8 62 -4 92 -6 116 C14 111 36 116 60 112 C84 116 106 111 126 116 C124 92 112 62 96 40Z" fill="#E8304A" {...S} />
            <path d="M6 108 C14 104 22 104 30 108 M90 108 C98 104 106 104 114 108" fill="none" stroke="#A3132A" strokeWidth={2} strokeLinecap="round" />
          </g>
        ),
      };
    case "tie":
      return {
        front: (
          <g>
            <path d="M57 103 L63 103 L67 117 L60 123 L53 117Z" fill="#3D7BFF" {...S} strokeWidth={2.6} />
            <path d="M55 96 L65 96 L63 103.5 L57 103.5Z" fill="#2A5BD6" {...S} strokeWidth={2.6} />
            <path d="M56 109 L65 106 M55 115 L66 111" stroke="#FFD23F" strokeWidth={2} />
          </g>
        ),
      };
    case "headphones": {
      const t = Math.min(4, top - 6);
      return {
        top: (
          <g>
            <path d={`M13 58 C9 ${t + 22} 32 ${t} 60 ${t} C88 ${t} 111 ${t + 22} 107 58`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <path d={`M13 58 C9 ${t + 22} 32 ${t} 60 ${t} C88 ${t} 111 ${t + 22} 107 58`} fill="none" stroke="#3D3366" strokeWidth={4.4} strokeLinecap="round" />
            <rect x={1} y={48} width={16} height={26} rx={7} fill="#FF3EA5" {...S} />
            <rect x={103} y={48} width={16} height={26} rx={7} fill="#FF3EA5" {...S} />
            <path d="M5 54 v12 M115 54 v12" stroke="#FF9DD0" strokeWidth={2.4} strokeLinecap="round" />
          </g>
        ),
      };
    }
    case "wings": {
      const w = "M18 60 C3 44 -14 46 -15 59 C-9 60 -12 68 -5 71 C-9 76 -1 82 5 79 C9 84 16 81 19 76Z";
      return {
        back: (
          <g>
            <path d={w} fill="#fff" {...S} />
            <path d={w} transform={flip} fill="#fff" {...S} />
            <path d="M-6 62 C2 62 10 64 16 68 M126 62 C118 62 110 64 104 68" fill="none" stroke="#C9C0E0" strokeWidth={1.8} strokeLinecap="round" />
          </g>
        ),
      };
    }
    case "lei": {
      const cols = ["#FF3EA5", "#FFD23F", "#FF9A2E", "#fff"];
      return {
        front: (
          <g>
            {Array.from({ length: 9 }, (_, i) => {
              const k = i / 8;
              const x = 24 + 72 * k, y = 89 + 12 * Math.sin(Math.PI * k);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={6} fill={cols[i % cols.length]} stroke={INK} strokeWidth={2.2} />
                  <circle cx={x} cy={y} r={1.8} fill={INK} />
                </g>
              );
            })}
          </g>
        ),
      };
    }
    default:
      return {};
  }
}

/* ───────── Composant ───────── */
export interface AvatarBlobProps {
  look: AvatarLook;
  size?: number;
  /** Humeur du moment (bouche) : les yeux restent ceux du look */
  mood?: MascotMood;
  /** Animation légère (gigote + cligne) */
  animate?: boolean;
  shadow?: boolean;
  /** Costume de jeu : prioritaire sur le chapeau (top) et les accessoires du visage (face) */
  costume?: (ctx: AvatarCostumeCtx) => AvatarCostumeLayers;
  className?: string;
  style?: CSSProperties;
}

export function AvatarBlob({ look, size = 96, mood = "happy", animate = true, shadow = false, costume, className, style }: AvatarBlobProps) {
  useAvatarStyle();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <div className={[animate ? "av-wob" : "", className ?? ""].join(" ")} style={{ width: size, height: size, flexShrink: 0, position: "relative", ...style }} aria-hidden>
      <AvatarSvg look={look} size={size} mood={mood} animate={animate} shadow={shadow} costume={costume} uid={uid} />
    </div>
  );
}

/** Le SVG seul (aussi utilisé pour les images de partage). */
export function AvatarSvg({ look, size, mood = "happy", animate = false, shadow = false, costume, uid, viewBox = "0 0 120 120" }: {
  look: AvatarLook; size: number; mood?: MascotMood; animate?: boolean; shadow?: boolean;
  costume?: AvatarBlobProps["costume"]; uid: string; viewBox?: string;
}) {
  const c = AVATAR_PALETTE[look.color] ?? AVATAR_PALETTE.pink;
  const clip = `av-c-${uid}`, gBody = `av-b-${uid}`, gShade = `av-s-${uid}`, hatClip = `av-h-${uid}`;
  const hc = HAIR_COLORS[look.hairColor] || HAIR_DEFAULT[look.hair] || "#6B3E1F";
  const cos = costume?.({ c, L: L0, R: R0, clip }) ?? {};
  // Costume avec couvre-chef : il gagne ; la coupe se réduit à une tonsure de sa couleur (rien ne dépasse)
  const hair = cos.top && look.hair !== "none" ? { skin: hairLayers("buzz", hc).skin } : hairLayers(look.hair, hc);
  const top = cos.top ? 14 : HAIR_TOP[look.hair] ?? 14;
  const hatId = cos.top ? "none" : look.hat;
  const cover = HAT_COVER[hatId];
  const face = cos.face ? {} : faceLayer(look.face, c, look.hair !== "none" ? hc : "#5A3420", clip);
  const extra = extraLayers(look.extra, c, top, clip);
  const hideEyes = { L: !cos.face && look.face === "shades", R: !cos.face && (look.face === "shades" || look.face === "patch") };
  const hideMouth = !cos.face && look.face === "mask";
  // Couvre-chef : les cheveux au-dessus du bord sont rangés dessous
  const underHat = (n: ReactNode) => (cover !== undefined && n ? <g clipPath={`url(#${hatClip})`}>{n}</g> : n);
  const sw = Math.max(3.2, 300 / size);

  return (
    <svg viewBox={viewBox} width={size} height={size} style={{ overflow: "visible", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={gBody} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor={c.hi} />
          <stop offset="38%" stopColor={c.body} />
          <stop offset="100%" stopColor={c.body} />
        </radialGradient>
        <radialGradient id={gShade} cx="36%" cy="30%" r="80%">
          <stop offset="62%" stopColor={c.deep} stopOpacity={0} />
          <stop offset="100%" stopColor={c.deep} stopOpacity={0.75} />
        </radialGradient>
        <clipPath id={clip}><path d={SHAPE} /></clipPath>
        {cover !== undefined && <clipPath id={hatClip}><rect x={-60} y={cover - 1} width={240} height={200} /></clipPath>}
      </defs>

      {shadow && <ellipse cx={60} cy={113} rx={38} ry={5} fill="#000" opacity={0.3} />}

      {/* Dos */}
      {extra.back}
      {underHat(hair.back)}
      {cos.back}

      {/* Corps : ombre dure, dégradé, contour */}
      <path d={SHAPE} transform="translate(0 4)" fill={INK} stroke={INK} strokeWidth={sw + 1.6} strokeLinejoin="round" />
      <path d={SHAPE} fill={`url(#${gBody})`} />
      <path d={SHAPE} fill={`url(#${gShade})`} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx={37} cy={30} rx={14} ry={8.5} transform="rotate(-24 37 30)" fill="#fff" opacity={0.5} />
        <circle cx={55} cy={22} r={2.6} fill="#fff" opacity={0.6} />
        {hair.skin}
        {face.skin}
      </g>
      {cos.skin}
      <path d={SHAPE} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />

      {/* Visage */}
      {eyes(look.eyes, c, hideEyes, animate)}
      {!hideMouth && mouth(mood, clip)}
      {face.over}
      {cos.face}

      {/* Devant */}
      {underHat(hair.front)}
      {extra.front}
      {hatLayer(hatId, top - 14, clip)}
      {cos.top}
      {extra.top}
    </svg>
  );
}
