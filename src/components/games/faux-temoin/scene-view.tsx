"use client";

/**
 * Le Faux Témoin — rendu SVG des scènes (DA « sticker » : contours encre épais,
 * couleurs franches, blobs). Tout est dessiné à la main en SVG, aucune image.
 * Repère : 360 × 300, horizon à y = 176.
 */

import type { CSSProperties, ReactNode } from "react";
import { MoreBackdrop, MoreFeature } from "./scene-decors";
import {
  COLOR_HEX, INDOOR, SLOTS, hasCount,
  type Acc, type ColorId, type DecorId, type FloorThing, type ObjId, type PetId, type SBlob, type Scene, type WallThing,
} from "./scene";

const INK = "#15082E";
const H = 176;
const ST = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// ── Blobs ────────────────────────────────────────────────
function Accessory({ acc, body }: { acc: Acc; body: ColorId }) {
  if (acc === "hat") {
    return (
      <g>
        <rect x={-13} y={-72} width={26} height={24} rx={4} fill={INK} />
        <rect x={-13} y={-58} width={26} height={6} fill={body === "pink" ? "#FFD23F" : "#FF3EA5"} />
        <rect x={-22} y={-52} width={44} height={7} rx={3.5} fill={INK} />
      </g>
    );
  }
  if (acc === "glasses") {
    return (
      <g>
        <rect x={-18} y={-35} width={15} height={11} rx={4} fill={INK} />
        <rect x={3} y={-35} width={15} height={11} rx={4} fill={INK} />
        <path d="M-4,-31 L4,-31" {...ST} strokeWidth={2.6} fill="none" />
        <path d="M-15,-32 l4,0 M6,-32 l4,0" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />
      </g>
    );
  }
  if (acc === "crown") {
    return (
      <g>
        <polygon points="-16,-45 -17,-64 -8,-55 0,-69 8,-55 17,-64 16,-45" fill="#FFD23F" {...ST} strokeWidth={2.6} />
        <circle cx={0} cy={-52} r={2.6} fill="#FF3EA5" />
      </g>
    );
  }
  // nœud papillon
  const c = body === "pink" || body === "red" ? "#FFD23F" : "#FF3EA5";
  return (
    <g>
      <polygon points="-15,-13 -15,1 0,-6" fill={c} {...ST} strokeWidth={2.4} />
      <polygon points="15,-13 15,1 0,-6" fill={c} {...ST} strokeWidth={2.4} />
      <circle cx={0} cy={-6} r={3.6} fill={c} {...ST} strokeWidth={2.2} />
    </g>
  );
}

export function BlobFigure({ color, acc, asleep, cheer, blindfold }: { color: ColorId; acc?: Acc | null; asleep?: boolean; cheer?: boolean; blindfold?: boolean }) {
  return (
    <g>
      <ellipse cx={0} cy={1} rx={22} ry={5} fill="rgba(21,8,46,0.28)" />
      {cheer && (
        // Bras levés (dessinés derrière le corps)
        <g strokeLinecap="round">
          <path d="M-18,-26 L-34,-50 M18,-26 L34,-50" stroke={INK} strokeWidth={10} />
          <path d="M-18,-26 L-34,-50 M18,-26 L34,-50" stroke={COLOR_HEX[color]} strokeWidth={4.6} />
          <circle cx={-35} cy={-52} r={6} fill={COLOR_HEX[color]} stroke={INK} strokeWidth={2.6} />
          <circle cx={35} cy={-52} r={6} fill={COLOR_HEX[color]} stroke={INK} strokeWidth={2.6} />
        </g>
      )}
      <path d="M-24,-4 C-27,-31 -15,-50 0,-50 C15,-50 27,-31 24,-4 C21,3 -21,3 -24,-4 Z" fill={COLOR_HEX[color]} {...ST} />
      <ellipse cx={-11} cy={-36} rx={4.5} ry={7} fill="#fff" opacity={0.45} transform="rotate(20 -11 -36)" />
      {blindfold ? (
        <g>
          <path d="M-25,-34 Q0,-40 25,-34 L25,-22 Q0,-28 -25,-22 Z" fill={INK} />
          <path d="M22,-30 l9,-6 M22,-27 l10,3" {...ST} strokeWidth={3.4} fill="none" />
        </g>
      ) : asleep ? (
        <g fill="none" {...ST} strokeWidth={2.6}>
          <path d="M-14,-29 q5,5 10,0" />
          <path d="M4,-29 q5,5 10,0" />
        </g>
      ) : (
        <g>
          <circle cx={-8} cy={-29} r={6} fill="#fff" stroke={INK} strokeWidth={2} />
          <circle cx={8} cy={-29} r={6} fill="#fff" stroke={INK} strokeWidth={2} />
          <circle cx={-7} cy={-28} r={3} fill={INK} />
          <circle cx={9} cy={-28} r={3} fill={INK} />
        </g>
      )}
      {asleep ? (
        <ellipse cx={0} cy={-15} rx={3} ry={3.6} fill={INK} />
      ) : cheer ? (
        <path d="M-8,-18 Q0,-18 8,-18 Q7,-8 0,-8 Q-7,-8 -8,-18 Z" fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      ) : (
        <path d={blindfold ? "M-6,-13 q6,-4 12,0" : "M-7,-17 q7,7 14,0"} fill="none" {...ST} strokeWidth={2.6} />
      )}
      {acc && <Accessory acc={acc} body={color} />}
      {asleep && (
        <g fontFamily="var(--font-display), system-ui, sans-serif" fontWeight={700} fill="#fff" stroke={INK} strokeWidth={1.6} paintOrder="stroke">
          <text x={20} y={-46} fontSize={15}>z</text>
          <text x={29} y={-58} fontSize={11}>z</text>
        </g>
      )}
    </g>
  );
}

// ── Animaux ──────────────────────────────────────────────
function Pet({ pet }: { pet: PetId }) {
  if (pet === "cat") {
    return (
      <g>
        <ellipse cx={0} cy={1} rx={20} ry={4} fill="rgba(21,8,46,0.25)" />
        <path d="M14,-8 C28,-10 28,-30 20,-34" fill="none" {...ST} strokeWidth={6} />
        <path d="M14,-8 C28,-10 28,-30 20,-34" fill="none" stroke="#9AA0B5" strokeWidth={2.6} strokeLinecap="round" />
        <ellipse cx={2} cy={-11} rx={16} ry={11} fill="#9AA0B5" {...ST} />
        <polygon points="-20,-34 -18,-48 -9,-38" fill="#9AA0B5" {...ST} strokeWidth={2.6} />
        <polygon points="-4,-38 2,-48 4,-33" fill="#9AA0B5" {...ST} strokeWidth={2.6} />
        <circle cx={-10} cy={-28} r={12} fill="#9AA0B5" {...ST} />
        <circle cx={-14} cy={-29} r={2} fill={INK} />
        <circle cx={-6} cy={-29} r={2} fill={INK} />
        <path d="M-12,-23 l2,2 l2,-2" fill="none" {...ST} strokeWidth={1.8} />
      </g>
    );
  }
  if (pet === "dog") {
    return (
      <g>
        <ellipse cx={0} cy={1} rx={21} ry={4} fill="rgba(21,8,46,0.25)" />
        <path d="M16,-12 l9,-9" {...ST} strokeWidth={5} />
        <ellipse cx={3} cy={-11} rx={17} ry={11} fill="#C7834A" {...ST} />
        <circle cx={-11} cy={-27} r={12} fill="#C7834A" {...ST} />
        <ellipse cx={-20} cy={-24} rx={5} ry={9} fill="#7A4A26" {...ST} strokeWidth={2.4} />
        <ellipse cx={-3} cy={-25} rx={5} ry={9} fill="#7A4A26" {...ST} strokeWidth={2.4} transform="rotate(-15 -3 -25)" />
        <circle cx={-14} cy={-29} r={2} fill={INK} />
        <circle cx={-8} cy={-29} r={2} fill={INK} />
        <ellipse cx={-11} cy={-22} rx={3} ry={2.2} fill={INK} />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={0} cy={1} rx={18} ry={4} fill="rgba(21,8,46,0.25)" />
      <path d="M-6,-1 l-2,4 M6,-1 l2,4" stroke="#FF9F1C" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={3} cy={-11} rx={17} ry={11} fill="#FFE066" {...ST} />
      <circle cx={-9} cy={-27} r={10} fill="#FFE066" {...ST} />
      <path d="M-18,-27 L-28,-24 L-18,-21 Z" fill="#FF9F1C" {...ST} strokeWidth={2.2} />
      <circle cx={-10} cy={-29} r={2} fill={INK} />
      <path d="M2,-14 q8,-6 14,2" fill="none" {...ST} strokeWidth={2.2} />
    </g>
  );
}

// ── Objets ───────────────────────────────────────────────
export function ObjectFigure({ obj, color = "blue" }: { obj: ObjId; color?: ColorId }) {
  const c = COLOR_HEX[color];
  switch (obj) {
    case "pizza":
      return (
        <g>
          <ellipse cx={0} cy={-10} rx={22} ry={12} fill="#E8A54B" {...ST} />
          <ellipse cx={0} cy={-11} rx={16} ry={8} fill="#FFCF5C" />
          <circle cx={-7} cy={-12} r={3} fill="#E5383B" />
          <circle cx={5} cy={-14} r={3} fill="#E5383B" />
          <circle cx={3} cy={-7} r={3} fill="#E5383B" />
          <circle cx={-12} cy={-8} r={1.6} fill="#2E9E6A" />
        </g>
      );
    case "guitar":
      return (
        <g transform="rotate(-22)">
          <rect x={-3.5} y={-66} width={7} height={34} rx={2} fill="#8A5A34" {...ST} strokeWidth={2.4} />
          <rect x={-5.5} y={-74} width={11} height={10} rx={3} fill="#8A5A34" {...ST} strokeWidth={2.4} />
          <circle cx={0} cy={-30} r={10} fill={c} {...ST} />
          <circle cx={0} cy={-13} r={13} fill={c} {...ST} />
          <circle cx={0} cy={-22} r={4} fill={INK} />
          <rect x={-6} y={-12} width={12} height={3} rx={1.5} fill={INK} />
        </g>
      );
    case "gift": {
      const rib = color === "yellow" ? "#FF3EA5" : "#FFD23F";
      return (
        <g>
          <rect x={-17} y={-32} width={34} height={31} rx={4} fill={c} {...ST} />
          <rect x={-4} y={-32} width={8} height={31} fill={rib} />
          <rect x={-17} y={-32} width={34} height={31} rx={4} fill="none" {...ST} />
          <path d="M0,-32 C-14,-46 -18,-34 0,-32 C18,-34 14,-46 0,-32 Z" fill={rib} {...ST} strokeWidth={2.4} />
        </g>
      );
    }
    case "plant":
      return (
        <g>
          <ellipse cx={-8} cy={-38} rx={7} ry={14} fill="#3DDC97" {...ST} strokeWidth={2.4} transform="rotate(-25 -8 -38)" />
          <ellipse cx={8} cy={-38} rx={7} ry={14} fill="#3DDC97" {...ST} strokeWidth={2.4} transform="rotate(25 8 -38)" />
          <ellipse cx={0} cy={-44} rx={7} ry={15} fill="#2FBF7F" {...ST} strokeWidth={2.4} />
          <polygon points="-14,-22 14,-22 10,0 -10,0" fill="#E07A3F" {...ST} />
        </g>
      );
    case "ball":
      return (
        <g>
          <ellipse cx={0} cy={1} rx={14} ry={3.5} fill="rgba(21,8,46,0.25)" />
          <circle cx={0} cy={-16} r={16} fill={c} {...ST} />
          <path d="M-15,-20 Q0,-10 15,-20" fill="none" stroke="#fff" strokeWidth={4} />
          <path d="M-4,-31 Q4,-16 -4,-1" fill="none" stroke="#fff" strokeWidth={4} />
          <circle cx={0} cy={-16} r={16} fill="none" {...ST} />
        </g>
      );
    case "trophy":
      return (
        <g>
          <rect x={-13} y={-8} width={26} height={8} rx={2} fill="#8A5A34" {...ST} strokeWidth={2.4} />
          <rect x={-3} y={-18} width={6} height={11} fill="#F2B705" {...ST} strokeWidth={2.2} />
          <path d="M-12,-20 C-21,-22 -21,-36 -12,-36 M12,-20 C21,-22 21,-36 12,-36" fill="none" {...ST} strokeWidth={3} />
          <path d="M-14,-42 L14,-42 C14,-26 8,-18 0,-18 C-8,-18 -14,-26 -14,-42 Z" fill="#FFD23F" {...ST} />
          <path d="M0,-36 l2,4 4,0.5 -3,3 1,4 -4,-2 -4,2 1,-4 -3,-3 4,-0.5 Z" fill="#fff" />
        </g>
      );
    case "radio":
      return (
        <g>
          <path d="M-12,-30 L-8,-38 L8,-38 L12,-30" fill="none" {...ST} strokeWidth={2.6} />
          <rect x={-24} y={-30} width={48} height={28} rx={6} fill="#4A4458" {...ST} />
          <circle cx={-12} cy={-16} r={8} fill="#fff" {...ST} strokeWidth={2.4} />
          <circle cx={12} cy={-16} r={8} fill="#fff" {...ST} strokeWidth={2.4} />
          <circle cx={-12} cy={-16} r={3} fill={INK} />
          <circle cx={12} cy={-16} r={3} fill={INK} />
        </g>
      );
    case "cake":
      return (
        <g>
          <rect x={-19} y={-18} width={38} height={17} rx={4} fill="#FFA5CD" {...ST} />
          <rect x={-12} y={-32} width={24} height={15} rx={4} fill="#FFF6E5" {...ST} />
          <path d="M-12,-27 q3,4 6,0 q3,4 6,0 q3,4 6,0 q3,4 6,0" fill="none" stroke="#FF3EA5" strokeWidth={2.4} />
          <circle cx={0} cy={-36} r={4.5} fill="#E5383B" {...ST} strokeWidth={2.2} />
        </g>
      );
    case "book":
      return (
        <g>
          <rect x={-20} y={-12} width={40} height={11} rx={2.5} fill={c} {...ST} />
          <rect x={-16} y={-23} width={34} height={11} rx={2.5} fill="#FFF6E5" {...ST} />
          <rect x={-18} y={-34} width={36} height={11} rx={2.5} fill={c} {...ST} />
          <path d="M-12,-29 l20,0" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
        </g>
      );
  }
}

function FloorItem({ f }: { f: FloorThing }) {
  if (f.kind === "pet") return <Pet pet={f.pet} />;
  if (f.kind === "obj") return <ObjectFigure obj={f.obj} color={f.color} />;
  return (
    <g>
      <ellipse cx={0} cy={1} rx={30} ry={5} fill="rgba(21,8,46,0.25)" />
      <rect x={-24} y={-36} width={6} height={36} rx={2} fill="#8A5A34" {...ST} strokeWidth={2.4} />
      <rect x={18} y={-36} width={6} height={36} rx={2} fill="#8A5A34" {...ST} strokeWidth={2.4} />
      <rect x={-32} y={-42} width={64} height={9} rx={4} fill="#C98B5A" {...ST} />
      <g transform="translate(0 -41) scale(0.82)">
        <ObjectFigure obj={f.item} color="pink" />
      </g>
    </g>
  );
}

// ── Mur / ciel ───────────────────────────────────────────
function WallItem({ w, indoor }: { w: WallThing; indoor: boolean }) {
  const x = w.side === 0 ? 54 : 306;
  if (w.kind === "clock") {
    const a = ((w.hour % 12) * 30 * Math.PI) / 180;
    return (
      <g transform={`translate(${x} 62)`}>
        <circle r={34} fill="#fff" {...ST} strokeWidth={3.4} />
        {Array.from({ length: 12 }, (_, i) => {
          const t = (i * 30 * Math.PI) / 180;
          const big = i % 3 === 0;
          const r1 = big ? 0 : 27;
          if (big) return null;
          return <line key={i} x1={Math.sin(t) * r1} y1={-Math.cos(t) * r1} x2={Math.sin(t) * 31} y2={-Math.cos(t) * 31} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />;
        })}
        <g fontFamily="var(--font-display), system-ui, sans-serif" fontWeight={700} fontSize={12} fill={INK} textAnchor="middle">
          <text x={0} y={-20}>12</text>
          <text x={23} y={4}>3</text>
          <text x={0} y={29}>6</text>
          <text x={-23} y={4}>9</text>
        </g>
        <line x1={0} y1={0} x2={0} y2={-24} stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <line x1={0} y1={0} x2={Math.sin(a) * 16} y2={-Math.cos(a) * 16} stroke="#FF3EA5" strokeWidth={5} strokeLinecap="round" />
        <circle r={3.5} fill={INK} />
      </g>
    );
  }
  if (w.kind === "sign") {
    return (
      <g transform={`translate(${x} 58)`}>
        {indoor ? (
          <path d="M-22,-24 L0,-44 L22,-24" fill="none" {...ST} strokeWidth={2.4} />
        ) : (
          <rect x={-4} y={20} width={8} height={H - 58 - 4} fill="#8A5A34" {...ST} strokeWidth={2.4} />
        )}
        <rect x={-38} y={-25} width={76} height={50} rx={9} fill="#FFF6E5" {...ST} strokeWidth={3.4} />
        <text x={0} y={13} textAnchor="middle" fontFamily="var(--font-display), system-ui, sans-serif" fontWeight={700} fontSize={36} fill={INK} letterSpacing={-1}>{w.n}</text>
      </g>
    );
  }
  // ballons : grappe en éventail, ficelles qui se rejoignent
  const n = w.count;
  const pts = Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : -1 + (2 * i) / (n - 1);
    return { bx: t * (n > 3 ? 30 : 22), by: -Math.abs(t) * -8 + (i % 2 ? -10 : 0) };
  });
  return (
    <g transform={`translate(${x} 58)`}>
      {pts.map((p, i) => <path key={`s${i}`} d={`M${p.bx},${p.by + 15} Q${p.bx * 0.4},${40} 0,62`} fill="none" stroke={INK} strokeWidth={1.8} />)}
      {pts.map((p, i) => (
        <g key={i} transform={`translate(${p.bx} ${p.by})`}>
          <ellipse rx={13} ry={15.5} fill={COLOR_HEX[w.color]} {...ST} strokeWidth={2.8} />
          <ellipse cx={-4.5} cy={-5} rx={3} ry={5} fill="#fff" opacity={0.55} />
          <path d="M-3,16 L0,13 L3,16 Z" fill={COLOR_HEX[w.color]} {...ST} strokeWidth={2} />
        </g>
      ))}
    </g>
  );
}

// ── Décors ───────────────────────────────────────────────
function Backdrop({ decor }: { decor: DecorId }): ReactNode {
  if (hasCount(decor)) return <MoreBackdrop decor={decor} />;
  switch (decor) {
    case "kitchen":
      return (
        <g>
          <rect width={360} height={H} fill="#FFF1D6" />
          {[110, 132, 154].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke="#EBCF9C" strokeWidth={2} />)}
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1={i * 30 + (i % 2 ? 0 : 15)} x2={i * 30 + (i % 2 ? 0 : 15)} y1={110} y2={176} stroke="#EBCF9C" strokeWidth={2} />)}
          {Array.from({ length: 48 }, (_, i) => {
            const cx = i % 12, cy = Math.floor(i / 12);
            return <rect key={i} x={cx * 30} y={H + cy * 31} width={30} height={31} fill={(cx + cy) % 2 ? "#E6DEFF" : "#C9BBFF"} />;
          })}
        </g>
      );
    case "beach":
      return (
        <g>
          <rect width={360} height={H} fill="#8FDCFF" />
          <circle cx={180} cy={24} r={17} fill="#FFD23F" {...ST} />
          <rect y={124} width={360} height={52} fill="#4FB6F0" />
          <path d="M0,132 q15,-8 30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0 t30,0" fill="none" stroke="#fff" strokeWidth={3} />
          <rect y={H} width={360} height={124} fill="#FFE3A3" />
          <line x1={0} x2={360} y1={H} y2={H} stroke={INK} strokeWidth={2.5} />
          {[[30, 230], [150, 214], [290, 240], [210, 292], [80, 290]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.2} fill="#E3B866" />)}
        </g>
      );
    case "party":
      return (
        <g>
          <rect width={360} height={H} fill="#3A2577" />
          <path d="M0,14 Q180,52 360,14" fill="none" stroke="#fff" strokeWidth={2} />
          {Array.from({ length: 9 }, (_, i) => {
            const x = 20 + i * 40;
            const y = 14 + 38 * (1 - ((x - 180) / 180) ** 2) * 0.5;
            const col = ["#FF3EA5", "#FFD23F", "#3DDC97", "#4ECDC4"][i % 4];
            return <polygon key={i} points={`${x - 10},${y} ${x + 10},${y} ${x},${y + 18}`} fill={col} stroke={INK} strokeWidth={2} />;
          })}
          <rect y={H} width={360} height={124} fill="#B97A50" />
          {[200, 228, 258, 290].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke="#9C6340" strokeWidth={2} />)}
          <line x1={0} x2={360} y1={H} y2={H} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case "street":
      return (
        <g>
          <rect width={360} height={H} fill="#A9E4FF" />
          {[[0, 64, 96, "#B9A8E8"], [64, 70, 128, "#9C8BD6"], [226, 64, 116, "#9C8BD6"], [290, 70, 88, "#B9A8E8"]].map(([x, w, h, c], i) => (
            <g key={i}>
              <rect x={x as number} y={H - (h as number)} width={w as number} height={h as number} fill={c as string} {...ST} strokeWidth={2.5} />
              {Array.from({ length: Math.floor((h as number) / 34) }, (_, k) => (
                <g key={k}>
                  <rect x={(x as number) + 12} y={H - (h as number) + 14 + k * 34} width={14} height={16} rx={2} fill="#FFF6E5" />
                  <rect x={(x as number) + (w as number) - 26} y={H - (h as number) + 14 + k * 34} width={14} height={16} rx={2} fill="#FFF6E5" />
                </g>
              ))}
            </g>
          ))}
          <rect y={150} width={360} height={26} fill="#D9D2EA" />
          <rect y={H} width={360} height={58} fill="#5A546B" />
          {Array.from({ length: 7 }, (_, i) => <rect key={i} x={10 + i * 54} y={H + 26} width={30} height={5} rx={2.5} fill="#fff" />)}
          <rect y={234} width={360} height={66} fill="#D9D2EA" />
          <line x1={0} x2={360} y1={234} y2={234} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case "classroom":
      return (
        <g>
          <rect width={360} height={H} fill="#BDEFD9" />
          <rect x={110} y={20} width={140} height={74} rx={6} fill="#2F5D50" {...ST} />
          <path d="M126,42 q10,-8 20,0 t20,0 M126,62 l50,0 M196,40 l30,22 M226,40 l-30,22" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
          <rect y={H} width={360} height={124} fill="#E7D3B0" />
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={i * 72} x2={i * 72 - 30} y1={H} y2={300} stroke="#CDB58B" strokeWidth={2} />)}
          <line x1={0} x2={360} y1={H} y2={H} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case "forest":
      return (
        <g>
          <rect width={360} height={H} fill="#C4EEFF" />
          {[[20, 110], [92, 84], [152, 120], [214, 96], [276, 118], [340, 86]].map(([x, h], i) => (
            <g key={i}>
              <rect x={x - 5} y={H - 22} width={10} height={22} fill="#8A5A34" {...ST} strokeWidth={2.2} />
              <polygon points={`${x - 30},${H - 18} ${x},${H - 18 - h} ${x + 30},${H - 18}`} fill={i % 2 ? "#2E9E6A" : "#38B57A"} {...ST} strokeWidth={2.5} />
            </g>
          ))}
          <rect y={H} width={360} height={124} fill="#7ED38A" />
          <line x1={0} x2={360} y1={H} y2={H} stroke={INK} strokeWidth={2.5} />
          {[[40, 236], [170, 228], [300, 252], [110, 296], [250, 294]].map(([x, y], i) => <path key={i} d={`M${x - 6},${y} l3,-8 l3,8 l3,-8 l3,8`} fill="none" stroke="#3FA65A" strokeWidth={2.4} strokeLinejoin="round" />)}
        </g>
      );
    case "tvset":
      return (
        <g>
          <rect width={360} height={H} fill="#251555" />
          {[50, 180, 310].map((x, i) => <polygon key={i} points={`${x - 10},0 ${x + 10},0 ${x + 60},${H} ${x - 60},${H}`} fill="#fff" opacity={0.08} />)}
          {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={10 + i * 20} cy={10} r={4} fill={i % 2 ? "#FFD23F" : "#FF3EA5"} stroke={INK} strokeWidth={1.5} />)}
          <rect y={H} width={360} height={124} fill="#3B2A7A" />
          <rect y={H} width={360} height={9} fill="#FFD23F" stroke={INK} strokeWidth={2.5} />
          {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={15 + i * 30} cy={H + 4.5} r={2} fill="#fff" />)}
        </g>
      );
    case "pool":
      return (
        <g>
          <rect width={360} height={H} fill="#9BE3FF" />
          <circle cx={318} cy={28} r={15} fill="#FFD23F" {...ST} />
          <rect y={104} width={360} height={72} fill="#39C6F0" />
          <line x1={0} x2={360} y1={104} y2={104} stroke={INK} strokeWidth={2.5} />
          <path d="M10,124 q12,-6 24,0 t24,0 M250,150 q12,-6 24,0 t24,0 M60,160 q12,-6 24,0" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
          <rect y={H} width={360} height={124} fill="#F2EEFF" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={i * 48} x2={i * 48} y1={H} y2={300} stroke="#D8D0F2" strokeWidth={2} />)}
          {[210, 250].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke="#D8D0F2" strokeWidth={2} />)}
          <rect y={H - 4} width={360} height={8} fill="#fff" stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case "club":
      return (
        <g>
          <rect width={360} height={H} fill="#120A2E" />
          {[[40, 70, "#FF3EA5"], [120, 40, "#4ECDC4"], [250, 50, "#FFD23F"], [320, 110, "#8B5CF6"], [80, 130, "#3DDC97"]].map(([x, y, c], i) => (
            <circle key={i} cx={x as number} cy={y as number} r={18} fill={c as string} opacity={0.22} />
          ))}
          <line x1={180} x2={180} y1={0} y2={10} stroke="#fff" strokeWidth={2} />
          <circle cx={180} cy={24} r={14} fill="#D8D6E8" {...ST} strokeWidth={2.5} />
          <path d="M168,20 l24,0 M167,28 l26,0 M180,10 l0,28" stroke="#9C98B8" strokeWidth={1.6} />
          {Array.from({ length: 32 }, (_, i) => {
            const cx = i % 8, cy = Math.floor(i / 8);
            return <rect key={i} x={cx * 45} y={H + cy * 31} width={45} height={31} fill={(cx + cy) % 2 ? "#2A1B5E" : "#3D2A80"} stroke="#120A2E" strokeWidth={1.5} />;
          })}
        </g>
      );
    case "wedding":
      return (
        <g>
          <rect width={360} height={H} fill="#FFE4EE" />
          {[30, 90, 270, 330].map((x) => <path key={x} d={`M${x},0 l0,26 q-8,0 -8,8 q8,0 8,8 q8,0 8,-8 q-8,0 -8,-8`} fill="#fff" stroke="#F3B6CC" strokeWidth={2} />)}
          <rect y={H} width={360} height={124} fill="#F8D3E1" />
          <polygon points={`150,${H} 210,${H} 250,300 110,300`} fill="#fff" />
          <line x1={0} x2={360} y1={H} y2={H} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case "park":
      return (
        <g>
          <rect width={360} height={H} fill="#BDEBFF" />
          <ellipse cx={70} cy={H} rx={130} ry={40} fill="#A4E39F" />
          <ellipse cx={300} cy={H} rx={140} ry={46} fill="#A4E39F" />
          {[[40, 120], [320, 112]].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 5} y={y} width={10} height={H - y} fill="#8A5A34" {...ST} strokeWidth={2.2} />
              <circle cx={x} cy={y - 10} r={26} fill="#3DBE73" {...ST} strokeWidth={2.5} />
            </g>
          ))}
          <rect y={H} width={360} height={124} fill="#8EDB8A" />
          <line x1={0} x2={360} y1={H} y2={H} stroke={INK} strokeWidth={2.5} />
          {[[60, 246], [200, 236], [320, 262], [140, 294]].map(([x, y], i) => <path key={i} d={`M${x - 6},${y} l3,-8 l3,8 l3,-8 l3,8`} fill="none" stroke="#4FB35A" strokeWidth={2.4} strokeLinejoin="round" />)}
        </g>
      );
  }
}

/** Le gros élément coloré du décor (frigo, parasol, voiture…). */
function Feature({ decor, color, n }: { decor: DecorId; color: ColorId; n?: number }) {
  const c = COLOR_HEX[color];
  if (hasCount(decor)) return <MoreFeature decor={decor} c={c} n={n ?? 3} />;
  const shade = "rgba(21,8,46,0.16)";
  switch (decor) {
    case "kitchen":
      return (
        <g>
          <rect x={138} y={38} width={84} height={156} rx={12} fill={c} {...ST} />
          <line x1={138} x2={222} y1={92} y2={92} {...ST} />
          <rect x={204} y={58} width={7} height={22} rx={3.5} fill={INK} />
          <rect x={204} y={104} width={7} height={30} rx={3.5} fill={INK} />
          <rect x={148} y={46} width={8} height={36} rx={4} fill="#fff" opacity={0.45} />
        </g>
      );
    case "beach":
      return (
        <g>
          <line x1={180} x2={180} y1={70} y2={210} stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <line x1={180} x2={180} y1={70} y2={210} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M104,86 Q180,10 256,86 Z" fill={c} {...ST} />
          <path d="M166,86 Q170,38 180,34 Q190,38 194,86 Z" fill="#fff" {...ST} strokeWidth={2.4} />
          <path d="M104,86 q15,10 31,0 q15,10 31,0 q14,10 28,0 q15,10 31,0 q15,10 31,0" fill={c} {...ST} strokeWidth={2.6} />
        </g>
      );
    case "party":
      return (
        <g>
          <rect x={108} y={96} width={144} height={60} rx={18} fill={c} {...ST} />
          <rect x={102} y={140} width={156} height={44} rx={14} fill={c} {...ST} />
          <rect x={102} y={140} width={156} height={44} rx={14} fill={shade} />
          <line x1={180} x2={180} y1={142} y2={168} {...ST} strokeWidth={2.4} />
          <rect x={92} y={120} width={26} height={66} rx={12} fill={c} {...ST} />
          <rect x={242} y={120} width={26} height={66} rx={12} fill={c} {...ST} />
        </g>
      );
    case "street":
      return (
        <g>
          <ellipse cx={180} cy={214} rx={70} ry={6} fill="rgba(21,8,46,0.3)" />
          <path d="M140,170 Q150,134 176,134 L198,134 Q218,134 228,170 Z" fill={c} {...ST} />
          <path d="M150,166 Q156,144 174,144 L178,144 L178,166 Z M186,166 L186,144 L196,144 Q212,144 218,166 Z" fill="#CFF1FF" {...ST} strokeWidth={2.2} />
          <rect x={114} y={164} width={134} height={38} rx={14} fill={c} {...ST} />
          <rect x={238} y={174} width={10} height={8} rx={2} fill="#FFD23F" />
          <circle cx={148} cy={204} r={14} fill={INK} />
          <circle cx={148} cy={204} r={5} fill="#D8D6E8" />
          <circle cx={216} cy={204} r={14} fill={INK} />
          <circle cx={216} cy={204} r={5} fill="#D8D6E8" />
        </g>
      );
    case "classroom":
      return (
        <g>
          <rect x={128} y={134} width={104} height={52} rx={6} fill={c} {...ST} />
          <rect x={128} y={134} width={104} height={52} rx={6} fill={shade} />
          <rect x={116} y={122} width={128} height={16} rx={5} fill={c} {...ST} />
          <circle cx={150} cy={112} r={9} fill="#E5383B" {...ST} strokeWidth={2.4} />
          <path d="M150,103 q3,-6 8,-6" fill="none" stroke="#2E9E6A" strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case "forest":
      return (
        <g>
          <polygon points="102,194 180,86 258,194" fill={c} {...ST} />
          <polygon points="180,86 216,194 180,194" fill={shade} />
          <polygon points="160,194 180,140 200,194" fill={INK} />
          <line x1={180} x2={180} y1={86} y2={74} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case "tvset":
      return (
        <g>
          <polygon points="136,116 224,116 212,192 148,192" fill={c} {...ST} />
          <rect x={128} y={106} width={104} height={14} rx={5} fill={c} {...ST} />
          <path d="M180,134 l6,13 14,1 -11,9 4,14 -13,-8 -13,8 4,-14 -11,-9 14,-1 Z" fill="#fff" {...ST} strokeWidth={2} />
          <line x1={196} x2={208} y1={106} y2={86} stroke={INK} strokeWidth={3} />
          <circle cx={209} cy={83} r={5} fill={INK} />
        </g>
      );
    case "pool":
      return (
        <g>
          <ellipse cx={180} cy={146} rx={52} ry={22} fill={c} {...ST} />
          <ellipse cx={180} cy={144} rx={24} ry={9} fill="#39C6F0" {...ST} strokeWidth={2.6} />
          <path d="M136,134 l10,8 M214,134 l-10,8 M150,164 l6,-6 M210,164 l-6,-6" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    case "club":
      return (
        <g>
          <rect x={110} y={120} width={140} height={68} rx={8} fill={c} {...ST} />
          <rect x={104} y={108} width={152} height={16} rx={5} fill={INK} />
          <ellipse cx={146} cy={108} rx={20} ry={6} fill="#4A4458" stroke="#D8D6E8" strokeWidth={2} />
          <ellipse cx={214} cy={108} rx={20} ry={6} fill="#4A4458" stroke="#D8D6E8" strokeWidth={2} />
          <circle cx={180} cy={154} r={18} fill={INK} />
          <circle cx={180} cy={154} r={7} fill="#D8D6E8" />
        </g>
      );
    case "wedding":
      return (
        <g fill="none">
          <path d="M118,194 L118,104 A62,62 0 0 1 242,104 L242,194" stroke={INK} strokeWidth={22} strokeLinecap="round" />
          <path d="M118,194 L118,104 A62,62 0 0 1 242,104 L242,194" stroke={c} strokeWidth={15} strokeLinecap="round" />
          {[[118, 150], [122, 84], [150, 50], [210, 50], [238, 84], [242, 150]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={7} fill="#fff" stroke={INK} strokeWidth={2.2} />
              <circle cx={x} cy={y} r={2.6} fill="#FFD23F" />
            </g>
          ))}
        </g>
      );
    case "park":
      return (
        <g>
          <rect x={118} y={128} width={124} height={14} rx={5} fill={c} {...ST} />
          <rect x={118} y={148} width={124} height={14} rx={5} fill={c} {...ST} />
          <rect x={126} y={168} width={14} height={30} rx={3} fill={INK} />
          <rect x={220} y={168} width={14} height={30} rx={3} fill={INK} />
          <rect x={110} y={166} width={140} height={14} rx={5} fill={c} {...ST} />
          <rect x={110} y={166} width={140} height={14} rx={5} fill={shade} />
        </g>
      );
  }
}

/** La scène complète. */
export function SceneView({ scene, label, className, style }: { scene: Scene; label: string; className?: string; style?: CSSProperties }) {
  const items: { y: number; node: ReactNode }[] = [];
  scene.blobs.forEach((b: SBlob, i) => {
    const s = SLOTS[b.slot];
    items.push({ y: s.y, node: <g key={`b${i}`} transform={`translate(${s.x} ${s.y}) scale(${s.s})`}><BlobFigure color={b.color} acc={b.acc} asleep={b.asleep} cheer={b.cheer} /></g> });
  });
  scene.floor.forEach((f, i) => {
    const s = SLOTS[f.slot];
    items.push({ y: s.y, node: <g key={`f${i}`} transform={`translate(${s.x} ${s.y}) scale(${s.s})`}><FloorItem f={f} /></g> });
  });
  items.sort((a, b) => a.y - b.y);
  const indoor = INDOOR[scene.decor];
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label={label} className={className} style={{ display: "block", width: "100%", height: "auto", ...style }}>
      <Backdrop decor={scene.decor} />
      {scene.wall.map((w, i) => <WallItem key={i} w={w} indoor={indoor} />)}
      <Feature decor={scene.decor} color={scene.featureColor} n={scene.featureN} />
      {items.map((it) => it.node)}
    </svg>
  );
}
