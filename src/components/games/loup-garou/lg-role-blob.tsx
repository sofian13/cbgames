"use client";

/**
 * Loup-Garou : un blob costumé par rôle (SVG inline, même DA que les blobs de
 * l'app : contour encre, aplats, reflet, ombre dure décalée, gros yeux).
 * États : éveillé (idle), endormi (bonnet de nuit + zZz), fantôme (mort),
 * fête (saute), hurlement (loup). Animations douces en CSS, coupées si
 * l'utilisateur a demandé moins de mouvement.
 */

import { useId, type CSSProperties, type ReactNode } from "react";
import type { RoleId } from "./lg-local-data";

export type BlobState = "idle" | "asleep" | "ghost" | "cheer" | "howl";

interface Pal { body: string; deep: string; hi: string }

/** Couleur de blob dédiée par rôle (lisible sur la nuit, le jour violet et sur la carte du rôle) */
export const ROLE_PAL: Record<RoleId, Pal> = {
  loup: { body: "#9A93C2", deep: "#5E5791", hi: "#DCD8F4" },
  villageois: { body: "#FFA94D", deep: "#D9731C", hi: "#FFDDB0" },
  voyante: { body: "#8B5CF6", deep: "#5A2FC4", hi: "#CDB8FF" },
  sorciere: { body: "#8FD14F", deep: "#4E9A2A", hi: "#D6F6B0" },
  chasseur: { body: "#C27A44", deep: "#87481F", hi: "#EFBE93" },
  cupidon: { body: "#FFE3EF", deep: "#EE9BBF", hi: "#FFFFFF" },
  gardien: { body: "#4A7BFF", deep: "#2B4FC2", hi: "#B2C8FF" },
};

const INK = "#15082E";
const SHAPE = "M60 14 C88 13 108 33 108 62 C108 90 88 106 60 106 C32 106 12 92 12 64 C12 35 32 15 60 14Z";
const GHOST = "M60 14 C88 13 108 33 108 62 L108 102 Q101 95 94 102 Q87 109 80 102 Q73 95 66 102 Q60 108 54 102 Q47 95 40 102 Q33 109 26 102 Q19 95 12 102 L12 64 C12 35 32 15 60 14Z";
const HEART = "M0 11 C-14 2 -14 -10 -6 -11 C-2 -11.5 0 -8 0 -6 C0 -8 2 -11.5 6 -11 C14 -10 14 2 0 11Z";

type EyeKind = "round" | "wolf" | "lid" | "closed" | "happy" | "x" | "heart" | "aim";
type MouthKind = "smile" | "small" | "fangs" | "innocent" | "o" | "howl" | "smirk" | "flat" | "wavy";
interface EyePos { x: number; y: number; r: number }

interface Look {
  L: EyePos; R: EyePos;
  eyes: [EyeKind, EyeKind];
  /** direction des pupilles (fraction du rayon) */
  look: [[number, number], [number, number]];
  mouth: MouthKind;
  mouthY: number;
  blush: boolean;
}

const BASE_L: EyePos = { x: 42, y: 57, r: 14 };
const BASE_R: EyePos = { x: 77, y: 54, r: 16 };

function looks(role: RoleId, disguised: boolean): Look {
  switch (role) {
    case "loup":
      return {
        L: { x: 40, y: 51, r: 12 }, R: { x: 80, y: 49, r: 13 }, eyes: ["wolf", "wolf"],
        look: [[0.15, 0.1], [-0.15, 0.1]], mouth: disguised ? "innocent" : "fangs", mouthY: 82, blush: disguised,
      };
    case "villageois":
      return { L: BASE_L, R: BASE_R, eyes: ["round", "round"], look: [[0.2, -0.38], [-0.1, -0.42]], mouth: "smile", mouthY: 80, blush: true };
    case "voyante":
      return { L: BASE_L, R: BASE_R, eyes: ["lid", "lid"], look: [[0.15, 0.4], [-0.1, 0.42]], mouth: "small", mouthY: 76, blush: false };
    case "sorciere":
      return {
        L: { x: 39, y: 55, r: 12 }, R: { x: 81, y: 53, r: 13 }, eyes: ["round", "happy"],
        look: [[0.35, 0.1], [0, 0]], mouth: "smirk", mouthY: 82, blush: false,
      };
    case "chasseur":
      return { L: BASE_L, R: BASE_R, eyes: ["aim", "round"], look: [[0, 0], [0.42, 0.05]], mouth: "small", mouthY: 86, blush: false };
    case "cupidon":
      return { L: BASE_L, R: BASE_R, eyes: ["heart", "heart"], look: [[0, 0], [0, 0]], mouth: "smile", mouthY: 80, blush: true };
    case "gardien":
      return {
        L: { x: 42, y: 61, r: 13 }, R: { x: 77, y: 59, r: 14 }, eyes: ["round", "round"],
        look: [[0.3, 0.05], [0.3, 0.05]], mouth: "flat", mouthY: 84, blush: false,
      };
  }
}

// ── Costumes (repère 120×120, comme les blobs de l'app) ───────
interface Costume { back?: ReactNode; skin?: ReactNode; face?: ReactNode; top?: ReactNode; front?: ReactNode }

function strawHat(sw: number, tilt = -6): ReactNode {
  return (
    <g transform={`rotate(${tilt} 60 12)`}>
      <ellipse cx={60} cy={19} rx={42} ry={9} fill="#F4CE5C" stroke={INK} strokeWidth={sw} />
      <path d="M26 20 Q34 23 42 21 M78 21 Q86 23 94 20" fill="none" stroke="#C9992E" strokeWidth={2} strokeLinecap="round" />
      <path d="M38 19 C38 3 46 -6 60 -6 C74 -6 82 3 82 19Z" fill="#F4CE5C" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M38.6 11 Q60 15 81.4 11 L81.8 17 Q60 21 38.2 17Z" fill="#E8433A" stroke={INK} strokeWidth={sw * 0.6} strokeLinejoin="round" />
      <path d="M50 -1 Q52 4 50 8 M64 -3 Q66 2 65 7" fill="none" stroke="#C9992E" strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

function nightcap(sw: number): ReactNode {
  return (
    <g>
      <path d="M17 34 C18 8 42 -4 64 -3 C86 -2 100 10 104 26 C108 38 116 50 113 64 C106 56 101 46 97 38 C80 30 40 28 17 34Z"
        fill="#4ECDC4" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M40 4 C46 14 48 22 46 30 M66 -2 C72 8 74 20 72 29 M90 8 C94 18 96 26 96 36" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      <path d="M15 34 C38 24 82 24 105 34 L105 41 C82 31 38 31 15 41Z" fill="#fff" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx={113} cy={66} r={7.5} fill="#fff" stroke={INK} strokeWidth={sw} />
    </g>
  );
}

function costume(role: RoleId, pal: Pal, sw: number, disguised: boolean, ballId: string): Costume {
  switch (role) {
    // Loup-Garou : oreilles pointues, poils hérissés, truffe, crocs, queue touffue
    case "loup":
      return {
        back: (
          <g>
            <g className="lgb-tail" style={{ transformOrigin: "100px 100px" }}>
              <path d="M96 96 C116 100 128 84 122 66 C132 76 132 100 114 108 C106 111 98 106 96 96Z" fill={pal.deep} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
              <path d="M121 70 C128 80 128 94 120 102 C122 90 122 80 121 70Z" fill={pal.hi} />
            </g>
            <path d="M18 56 L3 60 L13 68 L1 76 L14 80 L6 90 L22 86Z" fill={pal.deep} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M102 56 L117 60 L107 68 L119 76 L106 80 L114 90 L98 86Z" fill={pal.deep} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <g className="lgb-ear-l" style={{ transformOrigin: "34px 34px" }}>
              <path d="M18 48 L16 -4 L50 22Z" fill={pal.deep} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
              <path d="M24 37 L23 9 L42 24Z" fill="#FF9DB5" />
            </g>
            <g className="lgb-ear-r" style={{ transformOrigin: "86px 34px" }}>
              <path d="M102 48 L104 -4 L70 22Z" fill={pal.deep} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
              <path d="M96 37 L97 9 L78 24Z" fill="#FF9DB5" />
            </g>
          </g>
        ),
        skin: <ellipse cx={60} cy={86} rx={27} ry={18} fill={pal.hi} opacity={0.85} />,
        top: disguised
          ? strawHat(sw, 7)
          : <path d="M44 19 L48 3 L55 12 L60 -2 L66 12 L72 4 L76 19" fill={pal.deep} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />,
        face: (
          <g>
            <ellipse cx={60} cy={69} rx={7.5} ry={5.2} fill={INK} />
            <ellipse cx={57.6} cy={67.4} rx={2.4} ry={1.5} fill="#fff" opacity={0.75} />
            {!disguised && (
              <g stroke={INK} strokeWidth={5} strokeLinecap="round">
                <path d="M27 33 L51 40" />
                <path d="M93 31 L69 39" />
              </g>
            )}
          </g>
        ),
        front: disguised ? (
          // Foulard de villageois… qui ne trompe personne
          <path d="M30 96 Q60 108 90 95 L84 106 Q72 112 60 120 Q48 112 36 106Z" fill="#E8433A" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        ) : null,
      };

    // Villageois : chapeau de paille, foulard à pois, fourche, brin de paille
    case "villageois":
      return {
        back: (
          <g transform="rotate(9 108 60)">
            <rect x={105} y={4} width={6} height={114} rx={3} fill="#C68B4E" stroke={INK} strokeWidth={sw} />
            <rect x={94} y={4} width={28} height={6} rx={3} fill="#B8BCCB" stroke={INK} strokeWidth={sw} />
            <path d="M97 5 V-12 M108 5 V-14 M119 5 V-12" stroke={INK} strokeWidth={6.5} strokeLinecap="round" />
            <path d="M97 5 V-12 M108 5 V-14 M119 5 V-12" stroke="#D5D9E6" strokeWidth={3} strokeLinecap="round" />
          </g>
        ),
        skin: (
          <g>
            <path d="M8 88 Q60 108 112 88 L112 124 L8 124Z" fill="#E8433A" />
            <path d="M8 88 Q60 108 112 88" fill="none" stroke={INK} strokeWidth={sw * 0.8} />
            <g fill="#fff">
              <circle cx={36} cy={101} r={2.4} /><circle cx={52} cy={105} r={2.4} /><circle cx={70} cy={105} r={2.4} /><circle cx={86} cy={100} r={2.4} />
            </g>
          </g>
        ),
        top: strawHat(sw),
        face: (
          <g>
            <g stroke={INK} strokeWidth={3.2} strokeLinecap="round" fill="none">
              <path d="M32 36 Q42 30 52 35" />
              <path d="M67 31 Q78 25 89 31" />
            </g>
            <g fill="#B4541A" opacity={0.7}>
              <circle cx={26} cy={72} r={1.6} /><circle cx={31} cy={75} r={1.6} /><circle cx={25} cy={78} r={1.6} />
              <circle cx={93} cy={70} r={1.6} /><circle cx={88} cy={73} r={1.6} /><circle cx={94} cy={76} r={1.6} />
            </g>
            <path d="M71 86 L94 77" stroke={INK} strokeWidth={5.5} strokeLinecap="round" />
            <path d="M71 86 L94 77" stroke="#F4CE5C" strokeWidth={2.6} strokeLinecap="round" />
          </g>
        ),
      };

    // Voyante : turban à joyau, créoles dorées, boule de cristal qui luit
    case "voyante":
      return {
        back: (
          <g fill="#FFE27A">
            <path className="lgb-twinkle" style={{ animationDelay: "-0.6s" }} d="M6 30 L8 36 L14 38 L8 40 L6 46 L4 40 L-2 38 L4 36Z" />
            <path className="lgb-twinkle" style={{ animationDelay: "-1.4s" }} d="M114 22 L115.5 26.5 L120 28 L115.5 29.5 L114 34 L112.5 29.5 L108 28 L112.5 26.5Z" />
          </g>
        ),
        top: (
          <g>
            <path d="M16 42 C12 12 36 -6 60 -6 C86 -6 108 12 104 42 C92 30 76 27 60 28 C44 27 28 30 16 42Z" fill="#FF4FA8" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M22 30 C36 14 70 4 98 22 M28 18 C46 6 74 2 92 12" fill="none" stroke="#C41F78" strokeWidth={3} strokeLinecap="round" />
            <path d="M60 18 C62 6 70 -4 78 -12 C78 -2 72 8 64 16Z" fill="#4ECDC4" stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />
            <circle cx={60} cy={22} r={8.5} fill="#FFD23F" stroke={INK} strokeWidth={sw} />
            <circle className="lgb-glow" cx={60} cy={22} r={4.6} fill="#3DDC97" />
          </g>
        ),
        front: (
          <g>
            <g fill="none" stroke={INK} strokeWidth={sw + 2.2}>
              <circle cx={14} cy={78} r={6} /><circle cx={106} cy={76} r={6} />
            </g>
            <g fill="none" stroke="#FFD23F" strokeWidth={sw * 0.9}>
              <circle cx={14} cy={78} r={6} /><circle cx={106} cy={76} r={6} />
            </g>
            <circle className="lgb-glow" cx={60} cy={100} r={24} fill="#9BE7FF" opacity={0.4} />
            <path d="M44 120 L48 110 H72 L76 120Z" fill="#FFD23F" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <circle cx={60} cy={100} r={14} fill={`url(#${ballId})`} stroke={INK} strokeWidth={sw} />
            <path className="lgb-twinkle" d="M58 95 L59.5 99 L63.5 100.5 L59.5 102 L58 106 L56.5 102 L52.5 100.5 L56.5 99Z" fill="#fff" />
            <ellipse cx={54} cy={93} rx={4} ry={2.4} transform="rotate(-30 54 93)" fill="#fff" opacity={0.8} />
          </g>
        ),
      };

    // Sorcière : chapeau pointu tordu, mèches, nez crochu, grain de beauté, 2 fioles qui bouillonnent
    case "sorciere": {
      const flask = (x: number, liquid: string, cls: string) => (
        <g>
          <g fill={liquid} stroke={INK} strokeWidth={1.4}>
            <circle className="lgb-bubble" style={{ animationDelay: "0s" }} cx={x} cy={80} r={2.6} />
            <circle className="lgb-bubble" style={{ animationDelay: "-0.8s" }} cx={x + 3} cy={80} r={2} />
            <circle className="lgb-bubble" style={{ animationDelay: "-1.5s" }} cx={x - 2} cy={80} r={1.8} />
          </g>
          <rect x={x - 4.5} y={81} width={9} height={11} rx={2} fill="#E9F7FF" stroke={INK} strokeWidth={sw} />
          <rect x={x - 5.5} y={77} width={11} height={6} rx={2} fill="#C68B4E" stroke={INK} strokeWidth={sw * 0.8} />
          <circle cx={x} cy={102} r={13} fill="#E9F7FF" stroke={INK} strokeWidth={sw} />
          <path className={cls} d={`M${x - 12.6} ${102} A12.6 12.6 0 0 0 ${x + 12.6} ${102}Z`} fill={liquid} />
          <circle cx={x} cy={102} r={13} fill="none" stroke={INK} strokeWidth={sw} />
          <ellipse cx={x - 5} cy={97} rx={3} ry={2} fill="#fff" opacity={0.85} />
        </g>
      );
      return {
        back: (
          <g fill="#3A1A7A" stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round">
            <path d="M22 22 C10 34 10 52 18 62 C20 50 26 40 34 32Z" />
            <path d="M98 22 C110 34 110 52 102 62 C100 50 94 40 86 32Z" />
          </g>
        ),
        top: (
          <g transform="rotate(-4 60 18)">
            <ellipse cx={60} cy={21} rx={46} ry={9} fill="#5B2BB5" stroke={INK} strokeWidth={sw} />
            <path d="M35 19 C44 6 52 -6 62 -12 C72 -18 84 -20 96 -16 C86 -12 78 -6 76 4 C76 10 80 14 85 19Z" fill="#6E3BD6" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M37 14 C52 18 70 18 83 13 L85 19 C68 23 52 23 35 19Z" fill="#FF8A3D" stroke={INK} strokeWidth={sw * 0.7} strokeLinejoin="round" />
            <rect x={55} y={13.5} width={9} height={7} rx={1.5} fill="#FFD23F" stroke={INK} strokeWidth={1.6} />
            <path d="M66 -2 L67.4 2 L71.5 2.4 L68.4 5 L69.4 9 L66 6.8 L62.6 9 L63.6 5 L60.5 2.4 L64.6 2Z" fill="#FFD23F" />
          </g>
        ),
        face: (
          <g>
            <path d="M57 62 C59 57 64 57 66 64 C69 71 70 75 64 75 C60 75 58 72 60 70Z" fill={pal.deep} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
            <circle cx={88} cy={74} r={2.4} fill="#3A2410" />
          </g>
        ),
        front: (
          <g>
            {flask(10, "#3DDC97", "lgb-slosh")}
            {flask(110, "#A35CFF", "lgb-slosh lgb-slosh-b")}
          </g>
        ),
      };
    }

    // Chasseur : chapeau tyrolien à plume, grosse moustache, fusil à bouchon
    case "chasseur":
      return {
        top: (
          <g transform="rotate(-5 60 14)">
            <g className="lgb-feather" style={{ transformOrigin: "82px 14px" }}>
              <path d="M80 14 C86 -2 96 -12 110 -18 C106 -6 98 6 83 16Z" fill="#FF4D5E" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
              <path d="M83 13 C90 2 98 -6 106 -13" fill="none" stroke="#9E1E2C" strokeWidth={1.8} strokeLinecap="round" />
            </g>
            <path d="M20 23 Q60 8 100 23 Q103 30 94 28 Q60 17 26 28 Q17 30 20 23Z" fill="#2F7A3A" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M34 21 C34 4 46 -5 60 -5 C74 -5 86 4 86 21 Q60 13 34 21Z" fill="#3C9447" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M35 14 Q60 7 85 14 L85.6 20 Q60 13 34.4 20Z" fill="#8A4B22" stroke={INK} strokeWidth={sw * 0.6} strokeLinejoin="round" />
          </g>
        ),
        face: (
          <g>
            <g stroke={INK} strokeWidth={4.6} strokeLinecap="round">
              <path d="M30 44 L53 48" />
              <path d="M66 33 Q77 27 90 33" fill="none" />
            </g>
            <path d="M60 76 C52 69 38 71 33 80 C40 78 46 83 52 83 C56 83 58 81 60 79 C62 81 64 83 68 83 C74 83 80 78 87 80 C82 71 68 69 60 76Z"
              fill="#5A2E12" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          </g>
        ),
        front: (
          <g transform="rotate(-14 60 104)">
            <path d="M8 96 L40 92 L44 106 L12 114 Q4 108 8 96Z" fill="#A0612F" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <rect x={40} y={94} width={56} height={9} rx={3} fill="#5D6B8A" stroke={INK} strokeWidth={sw} />
            <rect x={92} y={92} width={7} height={13} rx={2} fill="#3E4A66" stroke={INK} strokeWidth={sw * 0.8} />
            <path d="M99 99 C106 106 112 108 114 104" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="2 2.5" />
            <g className="lgb-cork">
              <rect x={100} y={93} width={11} height={12} rx={3} fill="#E2B07A" stroke={INK} strokeWidth={sw * 0.9} />
              <path d="M104 96 V102 M108 96 V102" stroke="#B5814A" strokeWidth={1.4} strokeLinecap="round" />
            </g>
            <rect x={46} y={95.5} width={30} height={2.4} rx={1.2} fill="#fff" opacity={0.55} />
          </g>
        ),
      };

    // Cupidon : ailettes qui battent, mèche dorée, arc à flèche-cœur
    case "cupidon":
      return {
        back: (
          <g>
            <g className="lgb-wing-l" style={{ transformOrigin: "20px 66px" }}>
              <path d="M20 54 C4 36 -12 42 -10 56 C-16 60 -12 72 -3 72 C-7 81 4 88 12 81 C14 86 21 84 23 77Z" fill="#fff" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
              <path d="M18 60 C8 54 0 54 -4 58 M17 68 C9 66 2 68 -1 71 M18 75 C13 77 9 80 8 82" fill="none" stroke="#E2B9CF" strokeWidth={2} strokeLinecap="round" />
            </g>
            <g className="lgb-wing-r" style={{ transformOrigin: "100px 66px" }}>
              <path d="M100 54 C116 36 132 42 130 56 C136 60 132 72 123 72 C127 81 116 88 108 81 C106 86 99 84 97 77Z" fill="#fff" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
              <path d="M102 60 C112 54 120 54 124 58 M103 68 C111 66 118 68 121 71 M102 75 C107 77 111 80 112 82" fill="none" stroke="#E2B9CF" strokeWidth={2} strokeLinecap="round" />
            </g>
          </g>
        ),
        top: (
          <g fill="none" strokeLinecap="round">
            <path d="M60 16 C51 13 51 1 60 0 C68 -1 70 9 63 10 C58 11 57 5 61 5" stroke={INK} strokeWidth={8} />
            <path d="M60 16 C51 13 51 1 60 0 C68 -1 70 9 63 10 C58 11 57 5 61 5" stroke="#FFC93C" strokeWidth={4.4} />
          </g>
        ),
        front: (
          <g>
            <path d="M94 66 Q120 88 94 112" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
            <path d="M94 66 Q120 88 94 112" fill="none" stroke="#FF3EA5" strokeWidth={4.2} strokeLinecap="round" />
            <path d="M94 66 L94 112" stroke={INK} strokeWidth={1.4} />
            <path d="M72 94 H114" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <path d="M72 94 H114" stroke="#C68B4E" strokeWidth={2.4} strokeLinecap="round" />
            <path d="M70 88 L76 94 L70 100 M75 88 L81 94 L75 100" fill="none" stroke="#FF3EA5" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            <g transform="translate(120 94) rotate(-90) scale(0.55)">
              <path className="lgb-beat" d={HEART} fill="#FF2E7E" stroke={INK} strokeWidth={4.6} strokeLinejoin="round" />
            </g>
          </g>
        ),
      };

    // Gardien : casque à cimier, bouclier doré qui brille
    case "gardien":
      return {
        top: (
          <g>
            <path d="M50 6 C44 -10 58 -20 74 -16 C66 -12 64 -4 66 4Z" fill="#FF4D5E" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M12 44 C10 16 34 1 60 1 C86 1 110 16 108 44 C92 36 76 34 60 34 C44 34 28 36 12 44Z" fill="#D7DCE8" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M30 18 C38 10 50 7 60 7" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.9} />
            <path d="M60 2 V34" stroke="#A9B1C6" strokeWidth={3} />
            <path d="M12 44 C28 36 44 34 60 34 C76 34 92 36 108 44 L108 50 C92 42 76 40 60 40 C44 40 28 42 12 50Z" fill="#A9B1C6" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <g fill={INK}><circle cx={26} cy={42} r={1.6} /><circle cx={44} cy={38} r={1.6} /><circle cx={76} cy={38} r={1.6} /><circle cx={94} cy={42} r={1.6} /></g>
          </g>
        ),
        face: (
          <g stroke={INK} strokeWidth={4} strokeLinecap="round">
            <path d="M31 47 L52 50" />
            <path d="M87 45 L67 48" />
          </g>
        ),
        front: (
          <g>
            <path d="M-2 72 H32 V88 C32 102 22 110 15 115 C8 110 -2 102 -2 88Z" fill="#FFD23F" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M5 78 H25 V88 C25 97 19 103 15 106 C11 103 5 97 5 88Z" fill="#2B4FC2" />
            <path d="M15 80 V102 M7 88 H23" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" />
            <path className="lgb-gleam" d="M2 76 L8 76 L-2 98 L-2 86Z" fill="#fff" opacity={0.7} />
          </g>
        ),
      };
  }
}

// ── Yeux et bouches ───────────────────────────────────────────
function eye(e: EyePos, kind: EyeKind, lk: [number, number], pal: Pal, side: 0 | 1): ReactNode {
  const { x, y, r } = e;
  switch (kind) {
    case "closed":
      return <path d={`M${x - r * 0.8} ${y + 1} Q${x} ${y + r * 0.6} ${x + r * 0.8} ${y + 1}`} fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />;
    case "happy":
      return <path d={`M${x - r * 0.8} ${y + 3} Q${x} ${y - r * 0.9} ${x + r * 0.8} ${y + 3}`} fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />;
    case "aim":
      return <path d={`M${x - r * 0.85} ${y + 2} Q${x} ${y - 2} ${x + r * 0.85} ${y + 1}`} fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />;
    case "x": {
      const k = r * 0.6;
      return <path d={`M${x - k} ${y - k} L${x + k} ${y + k} M${x + k} ${y - k} L${x - k} ${y + k}`} stroke={INK} strokeWidth={4.4} strokeLinecap="round" />;
    }
    case "heart":
      return (
        <g transform={`translate(${x} ${y + 1}) scale(${r / 12.5})`}>
          <path className="lgb-beat" d={HEART} fill="#FF2E7E" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
          <ellipse cx={-5} cy={-6} rx={2.4} ry={1.6} fill="#fff" opacity={0.85} />
        </g>
      );
    case "wolf": {
      const px = x + lk[0] * r, py = y + lk[1] * r;
      return (
        <g>
          <circle className="lgb-glow" cx={x} cy={y} r={r + 6} fill="#FFE066" opacity={0.45} />
          <circle cx={x} cy={y} r={r} fill="#FFE45C" stroke={INK} strokeWidth={2.4} />
          <ellipse cx={px} cy={py} rx={r * 0.24} ry={r * 0.72} fill={INK} />
          <circle cx={x + r * 0.38} cy={y - r * 0.4} r={r * 0.22} fill="#fff" />
        </g>
      );
    }
    default: {
      const px = x + lk[0] * r * 0.85, py = y + lk[1] * r * 0.85;
      const pr = r * 0.56;
      return (
        <g className="lgb-blink" style={{ animationDelay: `${side * 0.07}s` }}>
          <ellipse cx={x} cy={y + 2.2} rx={r} ry={r} fill={pal.deep} opacity={0.55} />
          <circle cx={x} cy={y} r={r} fill="#fff" />
          <circle cx={px} cy={py} r={pr} fill={INK} />
          <circle cx={px + pr * 0.38} cy={py - pr * 0.4} r={pr * 0.3} fill="#fff" />
          {kind === "lid" && (
            <path d={`M${x - r - 1} ${y - 1} A${r + 1} ${r + 1} 0 0 1 ${x + r + 1} ${y - 1}Z`} fill={pal.body} stroke={pal.deep} strokeWidth={1.6} />
          )}
        </g>
      );
    }
  }
}

function mouth(kind: MouthKind, my: number): ReactNode {
  const mx = 60;
  switch (kind) {
    case "smile": {
      const w = 12, h = 14;
      const d = `M${mx - w} ${my - 3} H${mx + w} C${mx + w} ${my + h * 0.7} ${mx + w * 0.5} ${my + h} ${mx} ${my + h} C${mx - w * 0.5} ${my + h} ${mx - w} ${my + h * 0.7} ${mx - w} ${my - 3}Z`;
      return (
        <g>
          <path d={d} fill={INK} />
          <ellipse cx={mx} cy={my + h - 3} rx={w * 0.55} ry={h * 0.28} fill="#FF7A9C" />
        </g>
      );
    }
    case "small":
      return <path d={`M${mx - 7} ${my + 1} Q${mx} ${my + 7} ${mx + 7} ${my}`} fill="none" stroke={INK} strokeWidth={3.8} strokeLinecap="round" />;
    case "smirk":
      return (
        <g>
          <path d={`M${mx - 12} ${my} Q${mx} ${my + 8} ${mx + 13} ${my - 4}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d={`M${mx + 2} ${my + 3.4} L${mx + 4} ${my + 8} L${mx + 6.5} ${my + 2.6}Z`} fill="#fff" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        </g>
      );
    case "fangs":
      return (
        <g className="lgb-growl">
          <path d={`M${mx - 17} ${my - 4} Q${mx} ${my + 2} ${mx + 17} ${my - 5} Q${mx + 12} ${my + 13} ${mx} ${my + 13} Q${mx - 12} ${my + 13} ${mx - 17} ${my - 4}Z`} fill={INK} />
          <path d={`M${mx - 11} ${my - 2.4} L${mx - 8} ${my + 7} L${mx - 5} ${my - 1}Z`} fill="#fff" />
          <path d={`M${mx + 5} ${my - 1} L${mx + 8} ${my + 7} L${mx + 11} ${my - 2.6}Z`} fill="#fff" />
        </g>
      );
    case "innocent":
      return (
        <g>
          <path d={`M${mx - 9} ${my} Q${mx} ${my + 8} ${mx + 9} ${my}`} fill="none" stroke={INK} strokeWidth={3.8} strokeLinecap="round" />
          <path d={`M${mx + 3} ${my + 3.6} L${mx + 5} ${my + 9} L${mx + 7.4} ${my + 2.6}Z`} fill="#fff" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        </g>
      );
    case "o":
      return <ellipse cx={mx} cy={my + 3} rx={4} ry={5} fill={INK} />;
    case "howl":
      return (
        <g>
          <ellipse cx={mx} cy={my + 2} rx={7.5} ry={10} fill={INK} />
          <ellipse cx={mx} cy={my + 7} rx={4.4} ry={3.4} fill="#FF7A9C" />
        </g>
      );
    case "flat":
      return <path d={`M${mx - 9} ${my + 2} Q${mx} ${my + 5} ${mx + 10} ${my}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    case "wavy":
      return <path d={`M${mx - 12} ${my + 3} q3 -5 6 0 t6 0 t6 0 t6 0`} fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />;
  }
}

// ── Le blob ───────────────────────────────────────────────────
export interface RoleBlobProps {
  role: RoleId;
  size?: number;
  state?: BlobState;
  /** Loup « déguisé en villageois » (chapeau de paille, foulard, sourire innocent) */
  disguised?: boolean;
  /** Bonnet de nuit (implicite en état endormi) */
  nightcap?: boolean;
  /** Entrée « pop » + costume qui tombe en place (révélation du rôle) */
  reveal?: boolean;
  /** Pas d'animation d'attente (listes) */
  still?: boolean;
  /** Décalage des animations (s), pour désynchroniser une bande de blobs */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export function RoleBlob({
  role, size = 96, state = "idle", disguised = false, nightcap: cap, reveal = false, still = false, delay = 0, className, style,
}: RoleBlobProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pal = ROLE_PAL[role];
  const ghost = state === "ghost";
  const asleep = state === "asleep";
  const howl = state === "howl" && role === "loup";
  const withCap = asleep || !!cap;
  // Contours plus épais quand le blob est petit (lisible dès 48 px)
  const sw = Math.max(3, 220 / size);
  const outline = Math.max(3.4, 300 / size);
  const lk = looks(role, disguised);
  const cos = costume(role, pal, sw, disguised, `lgb-ball-${uid}`);

  let eyes = lk.eyes;
  let mth = lk.mouth;
  if (ghost) { eyes = ["x", "x"]; mth = "wavy"; }
  else if (howl) { eyes = ["happy", "happy"]; mth = "howl"; }
  // La nuit, le loup ne dort que d'un œil… les deux grands ouverts, qui brillent
  else if (asleep && role !== "loup") { eyes = ["closed", "closed"]; mth = "o"; }
  else if (state === "cheer" && role !== "loup") { mth = "smile"; if (role !== "cupidon") eyes = ["happy", "happy"]; }

  const gBody = `lgb-g-${uid}`, gShade = `lgb-s-${uid}`, clip = `lgb-c-${uid}`;
  const shape = ghost ? GHOST : SHAPE;
  const anim = !still;
  const cls = [
    "lgb",
    reveal ? "lgb-pop" : "",
    anim ? "lgb-on" : "",
    anim && state === "cheer" ? "lgb-jump" : "",
    anim && ghost ? "lgb-float" : "",
    className ?? "",
  ].join(" ");

  return (
    <span
      className={cls}
      style={{ width: size, height: size, ["--lgb-delay" as string]: `${-delay}s`, ...style }}
      aria-hidden
    >
      <LgBlobStyles />
      <svg viewBox="-14 -24 148 148" width={size} height={size}>
        <defs>
          <radialGradient id={gBody} cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor={pal.hi} />
            <stop offset="40%" stopColor={pal.body} />
            <stop offset="100%" stopColor={pal.body} />
          </radialGradient>
          <radialGradient id={gShade} cx="36%" cy="30%" r="80%">
            <stop offset="62%" stopColor={pal.deep} stopOpacity={0} />
            <stop offset="100%" stopColor={pal.deep} stopOpacity={0.7} />
          </radialGradient>
          <radialGradient id={`lgb-ball-${uid}`} cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#F2FDFF" />
            <stop offset="45%" stopColor="#8FE0FF" />
            <stop offset="100%" stopColor="#4D7BFF" />
          </radialGradient>
          <clipPath id={clip}><path d={shape} /></clipPath>
        </defs>

        {!ghost && <ellipse cx={60} cy={117} rx={40} ry={5} fill="#000" opacity={0.3} />}

        {/* Halo du fantôme */}
        {ghost && (
          <g className="lgb-halo" style={{ transformOrigin: "60px -12px" }}>
            <ellipse cx={60} cy={-12} rx={23} ry={6.5} fill="none" stroke={INK} strokeWidth={8} />
            <ellipse cx={60} cy={-12} rx={23} ry={6.5} fill="none" stroke="#FFD23F" strokeWidth={4.4} />
          </g>
        )}

        <g className={howl ? "lgb-howl" : anim && !ghost && state !== "cheer" ? "lgb-wob" : undefined} opacity={ghost ? 0.8 : 1}>
          {cos.back}
          {/* Ombre dure décalée + corps + ombrage + reflet + contour encre */}
          {!ghost && <path d={shape} transform="translate(3 6)" fill={INK} />}
          <path d={shape} fill={ghost ? pal.body : `url(#${gBody})`} />
          {!ghost && <path d={shape} fill={`url(#${gShade})`} />}
          {ghost && <path d={shape} fill="#fff" opacity={0.3} />}
          <g clipPath={`url(#${clip})`}>
            {!ghost && cos.skin}
            <ellipse cx={37} cy={30} rx={14} ry={8.5} transform="rotate(-24 37 30)" fill="#fff" opacity={0.55} />
            <circle cx={55} cy={22} r={2.6} fill="#fff" opacity={0.65} />
          </g>
          <path d={shape} fill="none" stroke={INK} strokeWidth={outline} strokeLinejoin="round" />

          {/* Visage */}
          <g>
            {lk.blush && !ghost && (
              <g fill="#FF4F8B" opacity={0.35}>
                <ellipse cx={28} cy={76} rx={7} ry={4} />
                <ellipse cx={93} cy={73} rx={7} ry={4} />
              </g>
            )}
            {eye(lk.L, eyes[0], lk.look[0], pal, 0)}
            {eye(lk.R, eyes[1], lk.look[1], pal, 1)}
            {mouth(mth, lk.mouthY)}
            {cos.face}
          </g>

          <g className={reveal ? "lgb-drop" : undefined}>
            {withCap && !(role === "loup" && disguised && !asleep) ? nightcap(sw) : cos.top}
          </g>
          {!ghost && <g className={reveal ? "lgb-in" : undefined}>{cos.front}</g>}
        </g>

        {/* Hurlement : petites ondes vers la lune */}
        {howl && (
          <g className="lgb-waves" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round">
            <path d="M84 50 Q92 42 90 32" />
            <path d="M92 56 Q104 44 100 28" opacity={0.7} />
          </g>
        )}
        {asleep && role !== "loup" && (
          <g fill="#fff" fontWeight={800} style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
            <text className="lgb-zz" x={92} y={2} fontSize={18}>z</text>
            <text className="lgb-zz" x={100} y={-10} fontSize={14} style={{ animationDelay: "-0.8s" }}>z</text>
            <text className="lgb-zz" x={107} y={-20} fontSize={11} style={{ animationDelay: "-1.6s" }}>z</text>
          </g>
        )}
      </svg>
    </span>
  );
}

// ── Styles (injectés une seule fois grâce à href/precedence de React 19) ──
const CSS = `
.lgb{display:inline-block;position:relative;flex-shrink:0;line-height:0;vertical-align:middle}
.lgb svg{display:block;overflow:visible}
.lgb-on .lgb-wob{animation:lgb-wob 2.8s ease-in-out infinite;animation-delay:var(--lgb-delay,0s);transform-origin:60px 112px}
.lgb-on .lgb-blink{transform-box:fill-box;transform-origin:center;animation:lgb-blink 4.4s infinite}
.lgb-on .lgb-ear-l{animation:lgb-ear-l 3.6s ease-in-out infinite;animation-delay:var(--lgb-delay,0s)}
.lgb-on .lgb-ear-r{animation:lgb-ear-r 3.6s ease-in-out infinite;animation-delay:var(--lgb-delay,0s)}
.lgb-on .lgb-tail{animation:lgb-tail 1.6s ease-in-out infinite alternate}
.lgb-on .lgb-growl{animation:lgb-growl 3.6s linear infinite;animation-delay:var(--lgb-delay,0s)}
.lgb-on .lgb-glow{transform-box:fill-box;transform-origin:center;animation:lgb-glow 2.2s ease-in-out infinite alternate}
.lgb-on .lgb-twinkle{transform-box:fill-box;transform-origin:center;animation:lgb-twinkle 1.8s ease-in-out infinite}
.lgb-on .lgb-bubble{transform-box:fill-box;transform-origin:center;animation:lgb-bubble 2.2s ease-in infinite}
.lgb-on .lgb-slosh{transform-box:fill-box;transform-origin:50% 0;animation:lgb-slosh 1.4s ease-in-out infinite alternate}
.lgb-on .lgb-slosh-b{animation-delay:-0.7s}
.lgb-on .lgb-wing-l{animation:lgb-wing-l .55s ease-in-out infinite alternate}
.lgb-on .lgb-wing-r{animation:lgb-wing-r .55s ease-in-out infinite alternate}
.lgb-on .lgb-beat{transform-box:fill-box;transform-origin:center;animation:lgb-beat .9s ease-in-out infinite}
.lgb-on .lgb-feather{animation:lgb-feather 2.4s ease-in-out infinite alternate}
.lgb-on .lgb-cork{animation:lgb-cork 1.2s ease-in-out infinite alternate}
.lgb-on .lgb-gleam{animation:lgb-gleam 2.8s ease-in-out infinite}
.lgb-on .lgb-zz{animation:lgb-zz 2.4s ease-in-out infinite}
.lgb-on .lgb-halo{animation:lgb-halo 2.6s ease-in-out infinite alternate}
.lgb-on .lgb-howl{animation:lgb-howl 1.8s ease-in-out infinite;animation-delay:var(--lgb-delay,0s);transform-origin:60px 112px}
.lgb-on .lgb-waves{animation:lgb-waves 1.8s ease-out infinite;animation-delay:var(--lgb-delay,0s)}
.lgb-on.lgb-float{animation:lgb-float 2.6s ease-in-out infinite alternate;animation-delay:var(--lgb-delay,0s)}
.lgb-on.lgb-jump{transform-origin:50% 100%;animation:lgb-jump .8s cubic-bezier(.3,.7,.4,1) infinite;animation-delay:var(--lgb-delay,0s)}
.lgb-pop{animation:lgb-pop .55s cubic-bezier(.2,.9,.3,1.2) both !important}
.lgb-drop{animation:lgb-drop .62s cubic-bezier(.3,.8,.4,1.15) .22s both}
.lgb-in{transform-box:fill-box;transform-origin:center;animation:lgb-in .5s cubic-bezier(.3,.9,.4,1.3) .38s both}
.lgb-flip{animation:lgb-flip .5s cubic-bezier(.2,.8,.3,1.1) both;transform-origin:50% 50%}
.lgb-p{position:absolute;left:50%;top:50%;pointer-events:none;animation:lgb-burst 1.05s cubic-bezier(.15,.7,.3,1) both}
@keyframes lgb-wob{0%,100%{transform:scale(1,1)}50%{transform:scale(1.035,.965)}}
@keyframes lgb-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes lgb-ear-l{0%,64%,100%{transform:rotate(0)}70%{transform:rotate(-14deg)}76%{transform:rotate(5deg)}82%{transform:rotate(-8deg)}88%{transform:rotate(0)}}
@keyframes lgb-ear-r{0%,66%,100%{transform:rotate(0)}72%{transform:rotate(14deg)}78%{transform:rotate(-5deg)}84%{transform:rotate(8deg)}90%{transform:rotate(0)}}
@keyframes lgb-tail{from{transform:rotate(-6deg)}to{transform:rotate(10deg)}}
@keyframes lgb-growl{0%,60%,100%{transform:translate(0,0)}62%{transform:translate(-1px,.5px)}64%{transform:translate(1px,0)}66%{transform:translate(-1px,0)}68%{transform:translate(1px,.5px)}70%{transform:translate(0,0)}}
@keyframes lgb-glow{from{opacity:.25;transform:scale(.88)}to{opacity:.8;transform:scale(1.14)}}
@keyframes lgb-twinkle{0%,100%{opacity:.35;transform:scale(.6) rotate(0)}50%{opacity:1;transform:scale(1.15) rotate(45deg)}}
@keyframes lgb-bubble{0%{opacity:0;transform:translateY(4px) scale(.5)}25%{opacity:1}100%{opacity:0;transform:translateY(-22px) scale(1.1)}}
@keyframes lgb-slosh{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
@keyframes lgb-wing-l{from{transform:rotate(8deg) scaleX(.82)}to{transform:rotate(-10deg) scaleX(1)}}
@keyframes lgb-wing-r{from{transform:rotate(-8deg) scaleX(.82)}to{transform:rotate(10deg) scaleX(1)}}
@keyframes lgb-beat{0%,100%{transform:scale(1)}30%{transform:scale(1.18)}45%{transform:scale(.96)}}
@keyframes lgb-feather{from{transform:rotate(-7deg)}to{transform:rotate(9deg)}}
@keyframes lgb-cork{from{transform:translateX(0)}to{transform:translateX(2.5px)}}
@keyframes lgb-gleam{0%,60%,100%{opacity:0}75%{opacity:.85}}
@keyframes lgb-zz{0%{opacity:0;transform:translate(-4px,8px)}30%{opacity:1}100%{opacity:0;transform:translate(8px,-10px)}}
@keyframes lgb-halo{from{transform:translateY(0) rotate(-5deg)}to{transform:translateY(-3px) rotate(5deg)}}
@keyframes lgb-howl{0%,100%{transform:rotate(-12deg) scale(1,1)}50%{transform:rotate(-16deg) scale(.97,1.05)}}
@keyframes lgb-waves{0%{opacity:0;transform:translate(-4px,4px)}40%{opacity:1}100%{opacity:0;transform:translate(6px,-6px)}}
@keyframes lgb-float{from{transform:translateY(0)}to{transform:translateY(-7%)}}
@keyframes lgb-jump{0%{transform:translateY(0) scale(1.1,.9)}35%{transform:translateY(-24%) scale(.93,1.08)}65%{transform:translateY(0) scale(1.08,.92)}100%{transform:translateY(0) scale(1.1,.9)}}
@keyframes lgb-pop{0%{transform:scale(0) rotate(-14deg)}60%{transform:scale(1.16) rotate(4deg)}80%{transform:scale(.96) rotate(-1deg)}100%{transform:scale(1) rotate(0)}}
@keyframes lgb-drop{0%{opacity:0;transform:translateY(-48px) rotate(-10deg)}55%{opacity:1;transform:translateY(4px) rotate(3deg)}78%{transform:translateY(-3px) rotate(-1deg)}100%{opacity:1;transform:translateY(0) rotate(0)}}
@keyframes lgb-in{0%{opacity:0;transform:scale(0)}100%{opacity:1;transform:scale(1)}}
@keyframes lgb-flip{0%{transform:perspective(900px) rotateY(88deg) scale(.92)}65%{transform:perspective(900px) rotateY(-10deg) scale(1.02)}100%{transform:perspective(900px) rotateY(0) scale(1)}}
@keyframes lgb-burst{0%{opacity:1;transform:translate(-50%,-50%) scale(.3) rotate(0)}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--rot))}}
@keyframes lgb-sky{from{transform:translateY(0)}to{transform:translateY(-6px)}}
@media (prefers-reduced-motion: reduce){
  .lgb,.lgb *,.lgb-flip,.lgb-sway{animation:none !important}
  .lgb-p{display:none !important}
}
`;

export function LgBlobStyles() {
  return <style href="lg-role-blob" precedence="default">{CSS}</style>;
}
