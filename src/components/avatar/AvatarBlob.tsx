"use client";

import { useId, useInsertionEffect, type CSSProperties, type ReactNode } from "react";
import type { MascotMood } from "@/components/Mascot";
import { AVATAR_PALETTE, HAIR_COLORS, type AvatarLook } from "@/lib/avatar/look";
import { isBossName, isZinzinName } from "@/lib/avatar/secrets";

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
  silver: "#EDEBF5", ponytail: "#2A1B3D", messy: "#E8304A", twintails: "#2FC7C0", sticks: "#221838",
  hedgehog: "#6B3E1F", streak: "#221838", peekaboo: "#33407A", ahoge: "#C4622B", mane: "#2B2350",
  mullet: "#C98A3A", quiff: "#221838",
};

/**
 * Point d'appui des petits chapeaux (couronne, auréole, cône, cornes) : y où se
 * pose la base, selon la coupe. Ce n'est pas toujours le sommet visible : sur
 * une crête ou des pointes, la couronne entoure la base (elle s'y enfonce) au
 * lieu de léviter au-dessus des pointes. Crâne nu = 18.
 */
const HAIR_SEAT: Record<string, number> = {
  none: 18, swoop: 11, afro: -4, mohawk: 24, bun: 12, pigtails: 12, golden: 6, swordsman: 13,
  hero: 4, long: 11, buzz: 18, curly: 1, bowl: 8, emo: 10, flame: 9,
  silver: 11, ponytail: 12, messy: 8, twintails: 12, sticks: 12, hedgehog: 9,
  streak: 12, peekaboo: 10, ahoge: 12, mane: 10,
  mullet: 10, quiff: -4,
};

/** Chapeaux qui couvrent le crâne : y du bord (les cheveux au-dessus sont cachés dessous). */
const HAT_COVER: Record<string, number> = {
  straw: 24, cap: 30, beanie: 32, bucket: 30, cowboy: 26, tophat: 23, bandana: 30, propeller: 30,
};

/* ───────── Styles CSS (une seule fois) ───────── */
const CSS = `
.av-wob{animation:av-wob var(--av-d,2.8s) ease-in-out infinite;transform-origin:50% 92%}
.av-blink{transform-box:fill-box;transform-origin:center;animation:av-blink 4.8s infinite}
@keyframes av-wob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-2.5%) scale(0.985,1.02)}}
@keyframes av-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(0.12)}}
.av-twk{transform-box:fill-box;transform-origin:center;animation:av-twk 2.2s ease-in-out infinite}
.av-crown{transform-box:fill-box;transform-origin:50% 100%;animation:av-crown 3.4s ease-in-out infinite}
@keyframes av-twk{0%,100%{opacity:1;transform:scale(1) rotate(0deg)}50%{opacity:.35;transform:scale(.55) rotate(45deg)}}
@keyframes av-crown{0%,100%{transform:rotate(0deg) translateY(0)}50%{transform:rotate(3deg) translateY(-1.5px)}}
.av-prop{transform-box:fill-box;transform-origin:center;animation:av-prop .7s linear infinite}
@keyframes av-prop{0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}}
@media (prefers-reduced-motion: reduce){.av-wob,.av-blink,.av-twk,.av-crown,.av-prop{animation:none!important}}
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
    case "allnighter": {
      // « Nuit blanche » : blanc rosi, petits vaisseaux rouges, grosses paupières tombantes (coin
      // extérieur plus bas), pupilles basses qui regardent un peu dans le vague, cernes.
      // Même structure que les yeux ronds (ombre en 1er, blanc #fff) : clignement, cernes de 3 h,
      // yeux en spirale et blob fatigué s'appliquent tels quels.
      const lid = mix(c.body, c.deep, 0.35);
      const eye = (e: Eye, s: number) => {
        const R = e.r + 0.6;
        const a = s ? 2.5 : 7, b = s ? 7 : 2.5; // bord de paupière : plus bas côté extérieur
        // Coins de la paupière posés sur le cercle de l'œil (l'arc suit exactement le haut de l'œil)
        const xa = e.x - Math.sqrt(R * R - a * a), xb = e.x + Math.sqrt(R * R - b * b);
        const edge = `Q${e.x} ${e.y + 8.5} ${xa} ${e.y + a}`;
        const dx = s ? 2.4 : -1.8, dy = s ? 8.2 : 8.9; // pupilles qui divergent un peu
        return (
          <g key={s}>
            <path d={`M${e.x - 9} ${e.y + e.r + 3.2} Q${e.x} ${e.y + e.r + 7} ${e.x + 9} ${e.y + e.r + 3.2}`} fill="none" stroke={mix(c.deep, INK, 0.35)} strokeWidth={2.2} strokeLinecap="round" opacity={0.55} />
            <g className={blinkCls} style={blink ? { animationDelay: `${s * 0.08}s` } : undefined}>
              <ellipse cx={e.x} cy={e.y + 2.2} rx={e.r} ry={e.r} fill={c.deep} opacity={0.5} />
              <circle cx={e.x} cy={e.y} r={e.r} fill="#fff" stroke={ink} strokeWidth={1.6} />
              <circle cx={e.x} cy={e.y} r={e.r - 0.8} fill="#FF5C66" opacity={0.42} />
              <g transform={s ? `translate(${2 * e.x} 0) scale(-1 1)` : undefined} fill="none" stroke="#D41E38" strokeWidth={1.5} strokeLinecap="round">
                <path d={`M${e.x - e.r + 1.2} ${e.y + 9} q3 -1.6 4.6 0.4 l2.4 -0.6 M${e.x - e.r + 3.6} ${e.y + 8.6} l0.6 -2`} />
                <path d={`M${e.x + 3} ${e.y + e.r - 1} q0.4 -2.6 2.6 -3.2 M${e.x + e.r - 1.4} ${e.y + 6.4} q-2.6 0.6 -3.4 2.4`} />
              </g>
              <circle cx={e.x + dx} cy={e.y + dy} r={4.8} fill={ink} />
              <circle cx={e.x + dx + 1.6} cy={e.y + dy - 1.4} r={1.4} fill="#fff" />
              <path d={`M${xa} ${e.y + a} A${R} ${R} 0 1 1 ${xb} ${e.y + b} ${edge}Z`} fill={lid} />
              <path d={`M${xa} ${e.y + a} A${R} ${R} 0 1 1 ${xb} ${e.y + b}`} fill="none" stroke={ink} strokeWidth={1.6} />
              <path d={`M${xb} ${e.y + b} ${edge}`} fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" />
            </g>
          </g>
        );
      };
      return both(eye);
    }
    case "tears": {
      // « Larmes de rire » : yeux plissés en chevrons, grosses larmes qui jaillissent sur les côtés
      const tear = "M0 -8 C3 -3 5.4 0.6 5.4 3.8 C5.4 7 3 9.2 0 9.2 C-3 9.2 -5.4 7 -5.4 3.8 C-5.4 0.6 -3 -3 0 -8Z";
      return both((e, s) => {
        const k = s ? -1 : 1; // côté intérieur
        return (
          <g key={s}>
            <path d={`M${e.x - 8 * k} ${e.y - 7} L${e.x + 6 * k} ${e.y} L${e.x - 8 * k} ${e.y + 7}`} fill="none" stroke={ink} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />
            <g transform={`translate(${e.x - 14 * k} ${e.y + 12}) rotate(${28 * k})`}>
              <path d={tear} fill="#7FD8FF" stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
              <ellipse cx={-1.6} cy={3} rx={1.3} ry={2.2} fill="#fff" opacity={0.85} />
            </g>
          </g>
        );
      });
    }
    case "classic":
    default:
      return both((e, s) => round(e, s ? [-0.18, -0.12] : [0.28, 0.12], 0.56, s), { x: 42, y: 58, r: 13 }, { x: 78, y: 55, r: 16 });
  }
}

/** Yeux « éliminé » (croix), à la place des yeux du look — comme le blob par défaut. */
function deadEyes(): ReactNode {
  return (
    <g stroke={INK} strokeWidth={5} strokeLinecap="round">
      {[L0, R0].map((e) => (
        <path key={e.x} d={`M${e.x - 8} ${e.y - 8} L${e.x + 8} ${e.y + 8} M${e.x + 8} ${e.y - 8} L${e.x - 8} ${e.y + 8}`} />
      ))}
    </g>
  );
}

/** Accessoires du visage qui masquent les yeux ou la bouche : retirés quand le perso est éliminé (lisibilité). */
const FACE_HIDDEN_WHEN_DEAD = new Set(["shades", "patch", "mask", "goggles"]);
/** Accessoires portés sur les yeux : remplacés (à l'affichage) par les lunettes noires du « Boss ». */
const EYEWEAR = new Set(["shades", "round", "patch", "goggles", "domino", "glasses3d"]);

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
    case "dead":
      // Éliminé : bouche en zigzag (comme le blob par défaut)
      return <path d={`M${mx - 11} ${my + 5} L${mx - 6} ${my + 1} L${mx - 2} ${my + 7} L${mx + 2} ${my + 1} L${mx + 6} ${my + 7} L${mx + 11} ${my + 3}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />;
    case "sad":
    case "angry":
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

function hairLayers(id: string, hc: string, covered = false): { back?: ReactNode; front?: ReactNode; skin?: ReactNode } {
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
      // Sous un couvre-chef : flammèches courtes sur les côtés (pas de flammes coupées net)
      if (covered) {
        return {
          front: P("M12 56 C7 46 9 36 15 27 C17 33 21 35 25 33 C25 30 27 28 30 27 L90 27 C93 28 95 30 95 33 C99 35 103 33 105 27 C111 36 113 46 108 56 C104 47 96 41 88 39 C76 35 66 37 60 41 C52 35 40 35 30 39 C22 41 16 47 12 56Z",
            <path d="M16 46 C16 40 18 36 20 33 M104 46 C104 40 102 36 100 33" fill="none" stroke="#FFD23F" strokeWidth={2.6} strokeLinecap="round" opacity={0.9} />),
        };
      }
      return {
        front: P("M12 56 C4 40 6 24 16 12 C16 22 20 26 24 26 C20 12 28 -2 40 -8 C36 4 40 12 46 14 C46 0 54 -12 64 -18 C62 -6 66 4 72 8 C74 -2 82 -8 90 -10 C86 0 88 10 94 14 C100 10 104 6 108 2 C112 18 112 34 108 56 C104 47 96 41 88 39 C76 35 66 37 60 41 C52 35 40 35 30 39 C22 41 16 47 12 56Z",
          <path d="M30 30 C28 22 32 14 38 8 C38 16 42 20 46 22 C48 12 54 4 60 0 C60 10 64 16 70 18 C72 12 78 8 84 6 C82 14 84 20 90 24" fill="none" stroke="#FFD23F" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />),
      };
    /* ── Coupes « manga » (v2) ── */
    case "silver":
      // Longs cheveux lisses, raie au milieu, deux longues mèches devant les épaules
      return {
        back: (
          <g>
            <path d="M60 4 C26 4 5 28 5 62 L3 114 L22 110 L34 117 L48 110 L60 117 L72 110 L86 117 L98 110 L117 114 L115 62 C115 28 94 4 60 4Z" fill={mix(hc, INK, 0.18)} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M14 74 L13 104 M106 74 L107 104" fill="none" stroke={mix(hc, INK, 0.55)} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          </g>
        ),
        front: (
          <g>
            {P("M9 64 C4 30 28 6 60 6 C92 6 116 30 111 64 C107 53 101 45 95 41 C93 47 92 53 92 58 C86 46 76 39 65 36 L60 27 L55 36 C44 39 34 46 28 58 C28 53 27 47 25 41 C19 45 13 53 9 64Z",
              <>{shine("M24 26 C32 17 42 12 52 10")}<path d="M60 27 L60 9" stroke={dark} strokeWidth={2} strokeLinecap="round" /></>)}
            <path d="M10 56 C7 74 8 92 12 108 L18 101 L23 108 C22 90 21 74 20 60Z" fill={hc} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M110 56 C113 74 112 92 108 108 L102 101 L97 108 C98 90 99 74 100 60Z" fill={hc} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
          </g>
        ),
      };
    case "ponytail": {
      // Queue de cheval haute (guerrier) ; sous un couvre-chef, elle part de la nuque
      const tail = covered
        ? "M100 46 C116 50 126 64 124 82 C123 94 127 102 133 110 C117 108 107 94 107 78 C107 64 103 58 97 54Z"
        : "M84 8 C102 -8 126 -2 130 20 C134 40 122 60 132 86 C114 78 110 60 110 44 C110 30 102 20 88 18Z";
      const tie = covered ? { x: 101, y: 50 } : { x: 88, y: 10 };
      return {
        back: (
          <g>
            <path d={tail} fill={hc} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d={covered ? "M114 62 C118 74 118 88 124 100" : "M104 4 C118 6 124 18 122 34"} fill="none" stroke={light} strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
            <path d={covered ? "M110 70 C112 84 114 94 120 104" : "M112 34 C114 50 118 64 124 78"} fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
            <circle cx={tie.x} cy={tie.y} r={5.5} fill="#E8304A" stroke={INK} strokeWidth={2.4} />
          </g>
        ),
        front: P("M12 54 C8 28 32 8 60 8 C88 8 112 28 108 54 C104 44 98 38 90 34 C80 31 68 31 58 32 C56 38 52 44 46 48 C47 42 47 37 45 33 C33 35 20 42 12 54Z",
          <>{shine("M28 22 C38 14 50 11 62 11")}<path d="M66 14 C78 16 90 22 98 30 M54 18 C64 18 74 21 82 26" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" opacity={0.55} /></>),
      };
    }
    case "messy":
      // Épis ébouriffés dans tous les sens
      return {
        front: P("M10 58 C6 51 1 46 -5 44 C3 41 7 38 9 35 C2 29 -1 21 0 13 C7 19 13 21 19 21 C15 13 16 3 21 -4 C26 6 31 10 37 11 C39 1 45 -6 54 -10 C53 0 56 6 60 8 C66 -2 74 -8 85 -9 C80 0 80 6 82 10 C90 4 100 2 111 4 C104 11 102 17 102 22 C110 22 118 26 124 33 C116 34 111 37 109 41 C115 45 119 51 121 59 C113 53 105 49 97 47 C98 52 96 56 92 59 C90 51 85 45 79 42 C79 47 76 51 72 53 C71 46 67 40 61 38 C57 42 51 44 45 44 C47 41 47 38 45 36 C37 38 29 42 23 48 C21 45 19 43 16 43 C13 48 11 52 10 58Z",
          <path d="M26 6 C30 12 34 16 40 18 M58 -2 C58 6 60 12 64 16 M92 8 C90 14 90 20 92 24 M8 26 C14 28 20 30 24 32" fill="none" stroke={light} strokeWidth={2.6} strokeLinecap="round" />),
      };
    case "twintails": {
      // Longues couettes attachées haut, frange droite
      const tail = "M16 26 C-4 24 -17 44 -15 72 C-13 94 -3 106 -9 121 C7 113 15 97 11 77 C8 60 9 46 22 38Z";
      return {
        back: (
          <g>
            <path d={tail} fill={hc} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d={tail} transform={flip} fill={hc} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M0 42 C-7 56 -7 76 -3 96 M120 42 C127 56 127 76 123 96" fill="none" stroke={light} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
          </g>
        ),
        front: (
          <g>
            {P("M12 54 C8 28 32 8 60 8 C88 8 112 28 108 54 L102 54 C102 48 101 43 99 39 L92 44 L88 35 L80 42 L74 33 L66 40 L60 32 L54 40 L46 33 L40 42 L32 35 L28 44 L21 39 C19 43 18 48 18 54Z", shine("M28 22 C36 15 46 12 56 11"))}
            <circle cx={17} cy={30} r={5.4} fill="#FF3EA5" stroke={INK} strokeWidth={2.4} />
            <circle cx={103} cy={30} r={5.4} fill="#FF3EA5" stroke={INK} strokeWidth={2.4} />
          </g>
        ),
      };
    }
    case "sticks":
      // Chignon haut piqué de deux baguettes
      return {
        back: (
          <g>
            <path d="M34 -16 L88 10 M30 6 L84 -18" stroke={INK} strokeWidth={6.4} strokeLinecap="round" />
            <path d="M34 -16 L88 10 M30 6 L84 -18" stroke="#E8304A" strokeWidth={3} strokeLinecap="round" />
            <circle cx={60} cy={-1} r={15} fill={hc} stroke={INK} strokeWidth={SW} />
            <path d="M49 -7 C53 -12 62 -13 68 -9" fill="none" stroke={light} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M48 4 C54 8 64 8 71 3" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" />
          </g>
        ),
        front: P("M12 52 C8 28 32 8 60 8 C88 8 112 28 108 52 C102 42 94 36 84 34 C74 32 66 28 60 21 C54 28 46 32 36 34 C26 36 18 42 12 52Z",
          <>{shine("M26 24 C34 16 44 12 54 11")}<path d="M60 21 L60 10" stroke={dark} strokeWidth={2} strokeLinecap="round" /></>),
      };
    case "hedgehog": {
      // Hérisson : petits piquants réguliers tout autour du crâne
      const n = 11, pts: string[] = [];
      for (let i = 0; i <= n * 2; i++) {
        const a = ((196 + (148 * i) / (n * 2)) * Math.PI) / 180;
        const r = i % 2 ? 58 : 47;
        pts.push(`${(60 + Math.cos(a) * r).toFixed(1)} ${(60 + Math.sin(a) * r).toFixed(1)}`);
      }
      return {
        front: P(`M${pts[0]} L${pts.slice(1).join(" L")} C102 40 94 34 84 34 L80 40 L74 33 L66 39 L60 32 L54 39 L46 33 L40 40 L36 34 C26 34 18 40 ${pts[0]}Z`,
          <path d="M30 18 L34 24 M44 10 L46 18 M60 7 L60 15 M76 10 L74 18" fill="none" stroke={light} strokeWidth={2.4} strokeLinecap="round" />),
      };
    }
    case "streak": {
      // Frange balayée, une mèche de couleur vive (bleue, rose si les cheveux sont déjà bleus)
      const sc = hc === HAIR_COLORS.blue ? "#FF3EA5" : "#3D9BFF";
      return {
        front: P("M10 56 C6 30 28 8 60 8 C92 8 114 30 110 56 C106 46 98 40 90 38 C80 31 66 30 53 34 L41 54 L39 38 C28 42 16 48 10 56Z",
          <>
            <path d="M60 11 C50 18 44 30 41 52 L47 37 C51 27 60 18 71 13Z" fill={sc} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
            <path d="M56 15 C52 22 49 28 47 34" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
            {shine("M74 13 C86 16 96 22 102 30")}
          </>),
      };
    }
    case "peekaboo":
      // Mèches pointues qui tombent sur un œil
      return {
        front: P("M10 54 C6 28 30 6 62 6 C94 6 115 28 112 56 L109 76 L101 61 L97 80 L89 62 L83 76 L77 57 L71 66 L66 42 C54 36 40 36 30 38 C22 42 14 48 10 54Z",
          <>{shine("M30 18 C42 11 56 9 68 11")}<path d="M90 26 L96 52 M78 30 L82 50 M102 32 L104 50" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" opacity={0.6} /></>),
      };
    case "ahoge":
      // Coupe ronde avec une mèche « antenne » sur le dessus
      return {
        front: (
          <g>
            <path d="M57 11 C49 -5 57 -19 75 -17 C64 -12 62 -4 65 11Z" fill={hc} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M11 70 L13 50 L22 56Z M109 70 L107 50 L98 56Z" fill={hc} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
            {P("M11 56 C6 30 30 8 60 8 C90 8 114 30 109 56 C104 46 96 40 88 38 L84 46 L78 37 L68 42 L64 33 L56 42 L52 33 L42 40 L38 36 C26 40 16 46 11 56Z", shine("M28 22 C36 15 46 12 54 11"))}
          </g>
        ),
      };
    case "mane":
      // Longue crinière en pointes dans le dos, frange pointue
      return {
        back: <path d="M60 -2 L44 -8 L36 3 L20 -1 L18 15 L2 17 L8 33 L-8 43 L4 55 L-8 69 L4 79 L-6 95 L10 97 L6 114 L24 106 L30 118 L42 106 L60 116 L78 106 L90 118 L96 106 L114 114 L110 97 L126 95 L116 79 L128 69 L116 55 L128 43 L112 33 L118 17 L102 15 L100 -1 L84 3 L76 -8Z" fill={mix(hc, INK, 0.18)} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />,
        front: P("M10 58 C6 30 30 8 60 8 C90 8 114 30 110 58 L102 46 L98 56 L90 40 L84 50 L78 36 L70 46 L64 34 L56 46 L50 34 L44 48 L38 36 L30 50 L26 42 L18 56 L16 48Z",
          shine("M28 22 C38 14 50 11 62 11")),
      };
    /* ── Ajout v4 ── */
    case "mullet":
      // Mulet : court et en épis devant, long dans la nuque (pans qui dépassent sur les côtés)
      return {
        back: (
          <g>
            <path d="M60 10 C30 10 12 30 12 58 C12 72 8 84 1 97 L10 95 L11 106 L21 99 L30 105 L90 105 L99 99 L109 106 L110 95 L119 97 C112 84 108 72 108 58 C108 30 90 10 60 10Z" fill={mix(hc, INK, 0.15)} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M9 82 C8 87 6 91 4 94 M111 82 C112 87 114 91 116 94" fill="none" stroke={mix(hc, INK, 0.5)} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          </g>
        ),
        front: P("M11 52 C7 28 31 8 60 8 C89 8 113 28 109 52 C105 44 98 39 90 37 L86 43 L80 35 L72 41 L66 33 L59 40 L52 33 L45 40 L38 35 L33 42 C24 41 16 46 11 52Z",
          shine("M28 22 C36 15 46 12 56 11")),
      };
    case "quiff":
      // Banane : grosse vague ramenée vers l'avant, côtés courts
      return {
        skin: <path d="M0 -10 H120 V44 C110 38 104 35 98 34 C86 30 74 28 60 28 C46 28 34 30 22 34 C16 35 10 38 0 44Z" fill={hc} opacity={0.82} />,
        front: P("M28 35 C20 18 25 -1 42 -10 C57 -18 81 -17 95 -7 C105 0 107 14 99 20 C95 13 87 10 81 13 C89 18 93 26 91 34 C76 29 45 29 28 35Z",
          <>
            {shine("M37 3 C47 -8 63 -12 80 -10", 3)}
            <path d="M35 22 C40 9 52 2 67 0 M44 28 C49 18 60 13 73 13" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
          </>),
      };
    default:
      return {};
  }
}

/* ───────── Chapeaux ─────────
 * dy = point d'appui de la coupe − crâne nu (HAIR_SEAT) : seuls les petits
 * chapeaux (couronne, auréole, cône, cornes) en dépendent ; les couvre-chefs
 * enveloppants restent sur le crâne et rangent les cheveux dessous (HAT_COVER).
 */
function hatLayer(id: string, dy: number, bc: string, animate = false): ReactNode {
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
          <ellipse cx={60} cy={22} rx={50} ry={8.5} fill="#22183A" {...S} />
          <path d="M18 21 C34 17 86 17 102 21" fill="none" stroke="#3D3366" strokeWidth={2} strokeLinecap="round" />
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
    case "flowers": {
      // Couronne de fleurs : tige verte qui suit le haut du crâne (ou de la coupe), fleurs et feuilles
      const pts = Array.from({ length: 7 }, (_, i) => {
        const k = i / 6, u = 2 * k - 1;
        return { x: 24 + 72 * k, y: 15 + 14 * u * u, a: u * 40 };
      });
      const cols = ["#FF7EC0", "#FFD23F", "#fff", "#A98BFF", "#fff", "#FFD23F", "#FF7EC0"];
      const petals = [0, 72, 144, 216, 288];
      return (
        <g transform={`translate(0 ${dy})`}>
          <path d="M22 31 C30 17 46 14 60 14 C74 14 90 17 98 31" fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
          <path d="M22 31 C30 17 46 14 60 14 C74 14 90 17 98 31" fill="none" stroke="#3BAF5D" strokeWidth={2.4} strokeLinecap="round" />
          {[[35, 19, -40], [50, 13, -15], [70, 13, 15], [85, 19, 40]].map(([x, y, r]) => (
            <path key={x} transform={`translate(${x} ${y}) rotate(${r})`} d="M0 0 C3 -6 9 -7 12 -6 C10 -2 6 1 0 0Z" fill="#3DDC97" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
          ))}
          {pts.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.a + i * 17})`}>
              {petals.map((d) => <circle key={d} cx={Math.cos((d * Math.PI) / 180) * 4} cy={Math.sin((d * Math.PI) / 180) * 4} r={3.9} fill={cols[i]} stroke={INK} strokeWidth={1.6} />)}
              <circle r={2.6} fill={i % 2 ? "#FF9A2E" : "#FFD23F"} stroke={INK} strokeWidth={1.4} />
            </g>
          ))}
        </g>
      );
    }
    case "propeller":
      // Casquette à hélice : calotte en quartiers, petite visière, hélice qui tourne (animée)
      return (
        <g>
          <path d="M22 30 C30 39 50 41 60 40 L60 30Z" fill="#2A5BD6" {...S} />
          <path d="M16 32 C16 7 38 -5 60 -5 C82 -5 104 7 104 32Z" fill="#FF3E5B" />
          <path d="M16 32 C16 7 38 -5 60 -5 C47 4 39 18 37 32Z" fill="#3D7BFF" />
          <path d="M104 32 C104 7 82 -5 60 -5 C73 4 81 18 83 32Z" fill="#3DDC97" />
          <path d="M60 -5 C47 4 39 18 37 32 M60 -5 C73 4 81 18 83 32" fill="none" stroke={INK} strokeWidth={2} />
          <path d="M16 32 C16 7 38 -5 60 -5 C82 -5 104 7 104 32Z" fill="none" {...S} />
          <path d="M26 16 C32 8 40 3 48 1" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.6} />
          <rect x={57.5} y={-15} width={5} height={11} rx={1.5} fill="#FFD23F" stroke={INK} strokeWidth={2} />
          <g className={animate ? "av-prop" : undefined}>
            <path d="M60 -15 C52 -21 38 -21 35 -16 C38 -11 52 -11 60 -15Z" fill="#FFD23F" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
            <path d="M60 -15 C68 -9 82 -9 85 -14 C82 -19 68 -19 60 -15Z" fill="#FF3EA5" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          </g>
          <circle cx={60} cy={-15} r={3.4} fill="#fff" stroke={INK} strokeWidth={2} />
        </g>
      );
    case "goldhalo": {
      // Secret (blob doré de l'accueil) : auréole d'or massif qui rayonne, reflets et étincelles
      const g = `${bc}-gold`;
      const tw = animate ? "av-twk" : undefined;
      const rays = "M38 -6 L33 -13 M47 -9 L45 -18 M60 -10 L60 -21 M73 -9 L75 -18 M82 -6 L87 -13";
      return (
        <g transform={`translate(0 ${dy - 6})`}>
          <defs>
            <linearGradient id={g} x1="31" y1="0" x2="89" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#B87A00" />
              <stop offset="0.28" stopColor="#FFE680" />
              <stop offset="0.5" stopColor="#FFC21A" />
              <stop offset="0.72" stopColor="#FFF4B8" />
              <stop offset="1" stopColor="#C98A00" />
            </linearGradient>
          </defs>
          {/* Rayons de gloire */}
          <path d={rays} stroke={INK} strokeWidth={6.4} strokeLinecap="round" />
          <path d={rays} stroke="#FFD23F" strokeWidth={3} strokeLinecap="round" />
          <ellipse cx={60} cy={2} rx={29} ry={8} fill="none" stroke={INK} strokeWidth={11} />
          <ellipse cx={60} cy={2} rx={29} ry={8} fill="none" stroke={`url(#${g})`} strokeWidth={6.4} />
          <path d="M39 -2 C45 -5 53 -6.2 60 -6.2" fill="none" stroke="#FFFBE0" strokeWidth={2.2} strokeLinecap="round" />
          <path d="M70 9.4 C76 9 81 7.8 84 6.2" fill="none" stroke="#9C6400" strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
          {/* Étincelles (scintillent quand le perso est animé) */}
          <g fill="#FFF3A0" stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
            <path className={tw} d="M24 -14 l2.2 5.4 5.4 2.2 -5.4 2.2 -2.2 5.4 -2.2 -5.4 -5.4 -2.2 5.4 -2.2Z" />
            <path className={tw} style={animate ? { animationDelay: "-0.8s" } : undefined} d="M97 -18 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8Z" />
            <path className={tw} style={animate ? { animationDelay: "-1.5s" } : undefined} d="M98 6 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2Z" />
          </g>
        </g>
      );
    }
    default:
      return null;
  }
}

/**
 * Couronne arc-en-ciel (secret du prénom « Zinzin ») dans le repère 120×120 : couleurs du logo
 * qui défilent doucement, se balance un peu, joyaux. `uid` : identifiant unique du SVG hôte.
 * `dy` : décalage du point d'appui (coupe de cheveux).
 */
export function rainbowCrownLayer(uid: string, dy = 0, animate = false): ReactNode {
  const g = `${uid}-rb`;
  const S = { stroke: INK, strokeWidth: SW, strokeLinejoin: "round" as const };
  const body = "M-25 7 L-29 -15 L-16 -4 L-8 -21 L0 -5 L8 -21 L16 -4 L29 -15 L25 7Z";
  return (
    <g transform={`translate(60 ${11 + dy}) rotate(-6)`}>
      <defs>
        <linearGradient id={g} x1="-30" y1="0" x2="30" y2="0" gradientUnits="userSpaceOnUse" spreadMethod="repeat">
          <stop offset="0" stopColor="#FFD23F" />
          <stop offset="0.2" stopColor="#FF3EA5" />
          <stop offset="0.4" stopColor="#A98BFF" />
          <stop offset="0.6" stopColor="#4ECDC4" />
          <stop offset="0.8" stopColor="#3DDC97" />
          <stop offset="1" stopColor="#FFD23F" />
          {animate && <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="60 0" dur="5s" repeatCount="indefinite" />}
        </linearGradient>
      </defs>
      <g className={animate ? "av-crown" : undefined}>
        <path d={body} fill={`url(#${g})`} {...S} />
        {/* Bandeau, reflet, joyaux, pompons */}
        <path d="M-25.6 0.5 H25.6" stroke={INK} strokeWidth={2.2} />
        <path d="M-22 -9 L-24 -4 M-6 -15 L-7.6 -10" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.75} />
        <circle cx={-13} cy={3.8} r={2.2} fill="#fff" stroke={INK} strokeWidth={1.3} />
        <circle cx={0} cy={3.8} r={2.6} fill="#FF3EA5" stroke={INK} strokeWidth={1.4} />
        <circle cx={13} cy={3.8} r={2.2} fill="#fff" stroke={INK} strokeWidth={1.3} />
        <circle cx={-29} cy={-15} r={3.2} fill="#FFD23F" stroke={INK} strokeWidth={1.8} />
        <circle cx={-8} cy={-21} r={3.2} fill="#3DDC97" stroke={INK} strokeWidth={1.8} />
        <circle cx={8} cy={-21} r={3.2} fill="#FF6B5B" stroke={INK} strokeWidth={1.8} />
        <circle cx={29} cy={-15} r={3.2} fill="#4ECDC4" stroke={INK} strokeWidth={1.8} />
      </g>
    </g>
  );
}

/**
 * Pansement en croix sur la joue (secret de la Soirée : dernier 3 jeux classés de suite), repère 120×120.
 * Posé à l'affichage seulement, par-dessus le reste (rien ne change dans le look).
 */
export function bandaidLayer(x = 95, y = 82): ReactNode {
  const strip = (rot: number) => (
    <g transform={`rotate(${rot})`}>
      <rect x={-13} y={-4.6} width={26} height={9.2} rx={4.6} fill="#F7C893" stroke={INK} strokeWidth={2.2} />
      <rect x={-4.2} y={-3.4} width={8.4} height={6.8} rx={1.6} fill="#E9A46A" />
      <circle cx={-9} cy={-1.4} r={0.9} fill="#C98450" />
      <circle cx={-9} cy={1.6} r={0.9} fill="#C98450" />
      <circle cx={9} cy={-1.4} r={0.9} fill="#C98450" />
      <circle cx={9} cy={1.6} r={0.9} fill="#C98450" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden>
      {strip(-35)}
      {strip(40)}
    </g>
  );
}

/**
 * Couronne arc-en-ciel seule (pour poser sur un blob qui n'est pas un perso : Mascot, ZBlob).
 * SVG 64×36 (unités du repère 120×120 des persos), à placer en absolu : la base est à ~8 % du bas.
 */
export function RainbowCrown({ width, animate = true, style }: { width: number; animate?: boolean; style?: CSSProperties }) {
  useAvatarStyle();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="28 -15 64 36" width={width} height={(width * 36) / 64} style={{ overflow: "visible", display: "block", ...style }} aria-hidden>
      {rainbowCrownLayer(`rc${uid}`, 0, animate)}
    </svg>
  );
}

/* ───────── Accessoires du visage ───────── */
function faceLayer(id: string, c: { body: string; deep: string }, hc: string, bc: string, mood: MascotMood = "happy"): { skin?: ReactNode; over?: ReactNode; top?: ReactNode } {
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
    case "crossscar": {
      // Cicatrice en croix sur la joue
      const d = "M19 76 L33 90 M33 76 L19 90";
      return {
        skin: (
          <g strokeLinecap="round" fill="none">
            <path d={d} stroke={INK} strokeWidth={5.6} />
            <path d={d} stroke="#FFB3C2" strokeWidth={2.6} />
          </g>
        ),
      };
    }
    case "bandages":
      // Bande enroulée en travers du front (par-dessus les cheveux) + compresse sur la joue
      return {
        top: (
          <g>
            <g clipPath={`url(#${bc})`}>
              <path d="M0 40 L120 17 L120 29 L0 52Z" fill="#F6F1E6" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
              <path d="M18 43 L22 39 M40 39 L44 35 M62 35 L66 31 M84 30 L88 26" stroke="#D9CFBC" strokeWidth={1.8} strokeLinecap="round" />
            </g>
            <path d="M103 23 C111 21 117 25 123 33 L118 37 C114 31 109 29 104 29Z" fill="#F6F1E6" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
            <path d="M103 28 C109 31 112 37 113 45 L108 45 C107 39 105 35 101 33Z" fill="#EDE5D3" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          </g>
        ),
        over: (
          <g transform="translate(25 86) rotate(-12)">
            <rect x={-8} y={-6} width={16} height={12} rx={2.5} fill="#F6F1E6" stroke={INK} strokeWidth={2.2} />
            <path d="M-11 -4 L11 4 M-11 4 L11 -4" stroke="#E8C9A0" strokeWidth={3} strokeLinecap="round" />
            <path d="M-11 -4 L11 4 M-11 4 L11 -4" stroke={INK} strokeWidth={0.9} strokeLinecap="round" opacity={0.5} />
          </g>
        ),
      };
    case "earring":
      // Boucle d'oreille pendante (anneau + goutte), côté gauche
      return {
        over: (
          <g>
            <circle cx={13} cy={72} r={4.6} fill="#FFD23F" stroke={INK} strokeWidth={2.4} />
            <path d="M13 76 L13 83" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <path d="M13 76 L13 83" stroke="#FFD23F" strokeWidth={2} strokeLinecap="round" />
            <path d="M13 81 C20 88 20 96 13 99 C6 96 6 88 13 81Z" fill="#3DDCC8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
            <path d="M10.6 89 C10.6 87 11.4 85.6 12.2 85" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" fill="none" />
          </g>
        ),
      };
    /* ── Ajout v4 ── */
    case "clown":
      return {
        over: (
          <g>
            <circle cx={60} cy={70.5} r={8.2} fill="#E8304A" stroke={INK} strokeWidth={2.6} />
            <ellipse cx={57} cy={67.4} rx={2.8} ry={2} fill="#fff" opacity={0.75} />
          </g>
        ),
      };
    case "glasses3d":
      // Lunettes 3D en carton : verres rouge et bleu translucides (les yeux restent visibles)
      return {
        over: (
          <g>
            <path d="M21 54 L9 50 M99 54 L111 50" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <path fillRule="evenodd" fill="#F6F1E6" stroke={INK} strokeWidth={2.6} strokeLinejoin="round"
              d="M20 42 C20 39 22 38 25 38 H95 C98 38 100 39 100 42 V69 C100 72 98 73 95 73 H68 C66 73 64 71 63 68 C62 65 61 64 60 64 C59 64 58 65 57 68 C56 71 54 73 52 73 H25 C22 73 20 72 20 69Z M26 43 V67 H55 V43Z M65 43 V67 H94 V43Z" />
            <rect x={26} y={43} width={29} height={24} fill="#FF3E5B" opacity={0.55} />
            <rect x={65} y={43} width={29} height={24} fill="#2EC4FF" opacity={0.55} />
            <path d="M29 47 l6 0 M68 47 l6 0" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
          </g>
        ),
      };
    case "goldtooth": {
      // Dent en or : posée en haut de la bouche ouverte, ou qui dépasse sous la bouche fermée
      const open: Partial<Record<MascotMood, [number, number, number, number]>> = {
        happy: [64.8, 77, 6.2, 6.6], wink: [64.8, 77, 6.2, 6.6], fire: [64.8, 77, 6.2, 6.6],
        laughing: [67.5, 77, 6.4, 6.8], rofl: [67.5, 77, 6.4, 6.8], shocked: [62, 79, 4.4, 5], mindblown: [62, 79, 4.4, 5],
      };
      const closed: Partial<Record<MascotMood, [number, number]>> = {
        sad: [64, 85], angry: [64, 85], love: [63, 85.6], kiss: [63, 85.6], cool: [64, 86.6], thinking: [64, 86.6], dead: [0, 0],
      };
      const o = open[mood];
      const [x, y, w, h] = o ?? [...(closed[mood] ?? [63, 85]), 5.6, 6];
      if (!x) return {};
      const tooth = `M${x - w / 2} ${y} V${y + h - 1.6} Q${x - w / 2} ${y + h} ${x} ${y + h} Q${x + w / 2} ${y + h} ${x + w / 2} ${y + h - 1.6} V${y}Z`;
      return {
        over: (
          <g>
            <path d={tooth} fill="#FFD23F" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
            <path d={`M${x - w / 2 + 1.4} ${y + 1.2} V${y + h - 2}`} stroke="#FFF6C2" strokeWidth={1.2} strokeLinecap="round" />
          </g>
        ),
      };
    }
    default:
      return {};
  }
}

/* ───────── Accessoires du corps ───────── */
/** mid = dans le dos mais par-dessus les cheveux longs (ex. sabre : la poignée reste visible). */
function extraLayers(id: string, c: { body: string; deep: string }, seat: number, bc: string, animate = false): { back?: ReactNode; mid?: ReactNode; front?: ReactNode; top?: ReactNode } {
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
      const t = Math.min(4, seat - 10);
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
    case "katana":
      // Sabre dans le dos : poignée et garde au-dessus de l'épaule droite, pointe en bas à gauche
      return {
        mid: (
          <g transform="rotate(45 60 60)">
            <rect x={55} y={-2} width={10} height={124} rx={3} fill="#7A1F2E" stroke={INK} strokeWidth={2.6} />
            <rect x={54} y={112} width={12} height={12} rx={3} fill="#FFD23F" stroke={INK} strokeWidth={2.4} />
            <rect x={54} y={-26} width={12} height={24} rx={3} fill="#2A2342" stroke={INK} strokeWidth={2.6} />
            <path d="M55 -22 L65 -16 M65 -22 L55 -16 M55 -13 L65 -7 M65 -13 L55 -7" stroke="#A99BE0" strokeWidth={1.8} />
            <ellipse cx={60} cy={-1} rx={12.5} ry={4.2} fill="#FFD23F" stroke={INK} strokeWidth={2.4} />
            <rect x={55.5} y={-32} width={9} height={7} rx={2} fill="#FFD23F" stroke={INK} strokeWidth={2} />
          </g>
        ),
      };
    case "longscarf":
      // Écharpe longue qui flotte au vent (pans derrière, tour de cou devant)
      return {
        back: (
          <g>
            <path d="M92 92 C108 86 122 92 134 84 C140 80 146 80 152 82 C146 88 144 94 146 100 C136 98 128 104 116 104 C106 104 98 102 92 104Z" fill="#FF9A2E" {...S} />
            <path d="M94 100 C108 104 118 110 130 106 C134 112 138 116 144 118 C132 122 120 122 108 118 C100 116 94 112 90 110Z" fill="#D2650A" {...S} />
            <path d="M104 94 C114 92 124 94 132 90 M110 112 C118 114 126 116 134 116" fill="none" stroke="#FFD3A1" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
          </g>
        ),
        front: (
          <g clipPath={`url(#${bc})`}>
            <path d="M0 88 C30 97 90 97 120 88 L120 110 C90 118 30 118 0 110Z" fill="#FF9A2E" {...S} />
            <path d="M10 99 C40 106 80 106 110 99" fill="none" stroke="#D2650A" strokeWidth={2} strokeLinecap="round" />
            <path d="M14 93 C40 99 80 99 106 93" fill="none" stroke="#FFD3A1" strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />
          </g>
        ),
        top: <ellipse cx={96} cy={101} rx={7} ry={6} fill="#FF9A2E" {...S} />,
      };
    /* ── Ajout v4 ── */
    case "medal":
      // Médaille d'or au ruban tricolore (couleurs de l'app, pas de drapeau)
      return {
        front: (
          <g>
            <path d="M45 95 L55 111 L62 107 L53 94Z" fill="#3D7BFF" {...S} strokeWidth={2.4} />
            <path d="M75 95 L65 111 L58 107 L67 94Z" fill="#FF3EA5" {...S} strokeWidth={2.4} />
            <circle cx={60} cy={115} r={9.5} fill="#FFD23F" {...S} />
            <circle cx={60} cy={115} r={6} fill="none" stroke="#E09A00" strokeWidth={1.6} />
            <path transform="translate(60 115.4) scale(0.36)" d="M0 -12 L3.4 -3.8 L12 -3.6 L5.2 1.8 L7.6 10.4 L0 5.4 L-7.6 10.4 L-5.2 1.8 L-12 -3.6 L-3.4 -3.8Z" fill="#FFF3A0" stroke="#B87A00" strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M54 110 C55 108 57 107 59 107" fill="none" stroke="#FFF6C2" strokeWidth={1.6} strokeLinecap="round" />
          </g>
        ),
      };
    case "balloon": {
      // Ballon de fête attaché dans le dos (couleur qui ressort sur le blob), se balance si animé
      const warm = ["#FF3EA5", "#FF6B5B", "#E8304A", "#FF9A2E", "#FFC4A3", "#A8693E"].includes(c.body);
      const col = warm ? "#3D7BFF" : "#E8304A";
      return {
        back: (
          <g className={animate ? "av-crown" : undefined}>
            <path d="M100 86 C112 76 119 58 114 32" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
            <path d="M111 33 L117 33 L115 29 L113 29Z" fill={col} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
            <path d="M114 29 C101 28 96 16 97 7 C98 -3 105 -9 114 -9 C123 -9 130 -3 131 7 C132 16 127 28 114 29Z" fill={col} {...S} />
            <ellipse cx={107} cy={2} rx={3.4} ry={6} transform="rotate(20 107 2)" fill="#fff" opacity={0.55} />
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
  /** Prénom du perso : « Zinzin » porte la couronne arc-en-ciel (secret) à la place de son chapeau */
  name?: string | null;
  /** Pansement sur la joue (secret de la Soirée : le malchanceux) */
  bandaid?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function AvatarBlob({ look, size = 96, mood = "happy", animate = true, shadow = false, costume, name, bandaid = false, className, style }: AvatarBlobProps) {
  useAvatarStyle();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <div className={[animate ? "av-wob" : "", className ?? ""].join(" ")} style={{ width: size, height: size, flexShrink: 0, position: "relative", ...style }} aria-hidden>
      <AvatarSvg look={look} size={size} mood={mood} animate={animate} shadow={shadow} costume={costume} uid={uid} zinzin={isZinzinName(name)} boss={isBossName(name)} bandaid={bandaid} />
    </div>
  );
}

/** Le SVG seul (aussi utilisé pour les images de partage). */
export function AvatarSvg({ look, size, mood = "happy", animate = false, shadow = false, costume, uid, viewBox = "0 0 120 120", zinzin = false, boss = false, bandaid = false }: {
  look: AvatarLook; size: number; mood?: MascotMood; animate?: boolean; shadow?: boolean;
  costume?: AvatarBlobProps["costume"]; uid: string; viewBox?: string;
  /** Couronne arc-en-ciel (prénom « Zinzin ») : remplace le chapeau, pas le couvre-chef d'un costume de jeu */
  zinzin?: boolean;
  /** Lunettes noires « Le Boss » (prénom « Sofian ») : par-dessus le look, sans le modifier */
  boss?: boolean;
  /** Pansement sur la joue (secret de la Soirée) : par-dessus tout, sans modifier le look */
  bandaid?: boolean;
}) {
  const c = AVATAR_PALETTE[look.color] ?? AVATAR_PALETTE.pink;
  const clip = `av-c-${uid}`, gBody = `av-b-${uid}`, gShade = `av-s-${uid}`, hatClip = `av-h-${uid}`;
  const hc = HAIR_COLORS[look.hairColor] || HAIR_DEFAULT[look.hair] || "#6B3E1F";
  const cos = costume?.({ c, L: L0, R: R0, clip }) ?? {};
  // Costume avec couvre-chef : il gagne ; la coupe se réduit à une tonsure de sa couleur (rien ne dépasse)
  const hatId = cos.top || zinzin ? "none" : look.hat;
  const cover = HAT_COVER[hatId];
  const hair = cos.top && look.hair !== "none" ? { skin: hairLayers("buzz", hc).skin } : hairLayers(look.hair, hc, cover !== undefined);
  // Point d'appui des petits chapeaux / du casque audio selon la coupe
  const seat = cos.top ? 18 : HAIR_SEAT[look.hair] ?? 18;
  // Éliminé (mood « dead ») : yeux en croix + bouche zigzag, l'accessoire qui cache le visage est retiré
  const dead = mood === "dead";
  // Secret « Le Boss » : lunettes noires à la place de ses lunettes (le reste du visage est gardé) ;
  // pas sous un accessoire de costume, ni éliminé (yeux en croix lisibles)
  const bossOn = boss && !cos.face && !dead;
  const face0 = bossOn && EYEWEAR.has(look.face) ? "shades" : look.face;
  const faceId = dead && FACE_HIDDEN_WHEN_DEAD.has(face0) ? "none" : face0;
  const face = cos.face ? {} : faceLayer(faceId, c, look.hair !== "none" ? hc : "#5A3420", clip, mood);
  const bossShades = bossOn && faceId !== "shades" ? faceLayer("shades", c, hc, clip).over : null;
  const extra = extraLayers(look.extra, c, seat, clip, animate);
  const hideEyes = { L: !cos.face && (faceId === "shades" || bossOn), R: !cos.face && (faceId === "shades" || faceId === "patch" || bossOn) };
  const hideMouth = !cos.face && faceId === "mask";
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
      {extra.mid}
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
      {/* data-eyes / data-eyes-top : repères des yeux en spirale de l'app (zinzin/src/ui/spiral-eyes.ts), sans effet visuel */}
      <g data-eyes="">{dead ? deadEyes() : eyes(look.eyes, c, hideEyes, animate)}</g>
      {!hideMouth && mouth(mood, clip)}
      {face.over}
      {bossShades}
      {cos.face}
      <g data-eyes-top="" />

      {/* Devant */}
      {underHat(hair.front)}
      {extra.front}
      {face.top}
      {hatLayer(hatId, seat - 18, clip, animate)}
      {zinzin && !cos.top && rainbowCrownLayer(clip, seat - 18, animate)}
      {cos.top}
      {extra.top}
      {bandaid && bandaidLayer()}
    </svg>
  );
}
