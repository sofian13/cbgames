/**
 * Le Faux Témoin — les 24 décors « bonus » (braquage, supermarché, métro…).
 * Même DA que scene-view.tsx : contours encre épais, couleurs franches, repère 360 × 300,
 * horizon à y = 176. Chaque décor = un fond (MoreBackdrop) + un gros élément coloré
 * (MoreFeature) qui porte aussi le détail à compter (`n` : bougies, lingots, mouettes…).
 * Zones à garder libres : x < 96 et x > 264 en haut (horloge / panneau / ballons),
 * et y > 200 au centre (les blobs de devant).
 */

import type { ReactNode } from "react";
import type { CountDecor } from "./scene";

const INK = "#15082E";
const H = 176;
const ST = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const SHADE = "rgba(21,8,46,0.16)";
const BRIGHT = ["#FFD23F", "#3DDC97", "#FF3EA5", "#3D8BFF", "#FF9F1C", "#8B5CF6", "#FF4B3E"];

/** Abscisses de n éléments centrés sur cx, espacés de gap. */
const row = (n: number, cx: number, gap: number) => Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * gap);

// ── Petits utilitaires de fond ───────────────────────────
function Checker({ a, b, w, h }: { a: string; b: string; w: number; h: number }) {
  const cols = Math.ceil(360 / w);
  const rows = Math.ceil((300 - H) / h);
  return (
    <g>
      {Array.from({ length: cols * rows }, (_, i) => {
        const cx = i % cols, cy = Math.floor(i / cols);
        return <rect key={i} x={cx * w} y={H + cy * h} width={w} height={h} fill={(cx + cy) % 2 ? a : b} />;
      })}
    </g>
  );
}
function Planks({ fill, line }: { fill: string; line: string }) {
  return (
    <g>
      <rect y={H} width={360} height={124} fill={fill} />
      {[200, 228, 258, 290].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke={line} strokeWidth={2} />)}
    </g>
  );
}
function Ground({ fill, tuft }: { fill: string; tuft?: string }) {
  return (
    <g>
      <rect y={H} width={360} height={124} fill={fill} />
      {tuft && [[40, 236], [170, 228], [300, 252], [110, 296], [250, 294]].map(([x, y], i) => (
        <path key={i} d={`M${x - 6},${y} l3,-8 l3,8 l3,-8 l3,8`} fill="none" stroke={tuft} strokeWidth={2.4} strokeLinejoin="round" />
      ))}
    </g>
  );
}
const Horizon = () => <line x1={0} x2={360} y1={H} y2={H} stroke={INK} strokeWidth={2.5} />;
function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 5} y={y} width={10} height={H - y} fill="#8A5A34" {...ST} strokeWidth={2.2} />
      <circle cx={x} cy={y - 10} r={24} fill="#3DBE73" {...ST} strokeWidth={2.5} />
    </g>
  );
}

// ── Fonds ────────────────────────────────────────────────
export function MoreBackdrop({ decor }: { decor: CountDecor }): ReactNode {
  switch (decor) {
    case "bank":
      return (
        <g>
          <rect width={360} height={H} fill="#E4DDF6" />
          <path d="M60,24 L300,160 M60,160 L300,24 M60,92 L300,92" stroke="#FF4B3E" strokeWidth={2} opacity={0.6} />
          {[18, 302].map((x) => (
            <g key={x}>
              <rect x={x} y={22} width={40} height={154} fill="#F6F2FF" {...ST} strokeWidth={2.5} />
              {[x + 10, x + 20, x + 30].map((l) => <line key={l} x1={l} x2={l} y1={30} y2={170} stroke="#D2C8EE" strokeWidth={2} />)}
              <rect x={x - 6} y={10} width={52} height={14} rx={3} fill="#F6F2FF" {...ST} strokeWidth={2.5} />
            </g>
          ))}
          <Checker a="#C9BFE6" b="#DDD6F2" w={45} h={31} />
          <Horizon />
        </g>
      );
    case "supermarket":
      return (
        <g>
          <rect width={360} height={H} fill="#E6F6FF" />
          <rect width={360} height={12} fill="#3DDC97" />
          {[0, 268].map((x) => (
            <g key={x}>
              <rect x={x} y={34} width={92} height={142} fill="#F2EEFF" {...ST} strokeWidth={2.5} />
              {[74, 114, 154].map((y, r) => (
                <g key={y}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <rect key={k} x={x + 6 + k * 17} y={y - 22 + ((k + r) % 2) * 4} width={13} height={22 - ((k + r) % 2) * 4} rx={2} fill={BRIGHT[(k + r * 2) % BRIGHT.length]} stroke={INK} strokeWidth={1.5} />
                  ))}
                  <rect x={x} y={y} width={92} height={6} fill="#B8B5C8" stroke={INK} strokeWidth={2} />
                </g>
              ))}
            </g>
          ))}
          <Checker a="#E2DEF0" b="#F4F2FA" w={40} h={31} />
          <Horizon />
        </g>
      );
    case "metro":
      return (
        <g>
          <rect width={360} height={H} fill="#EDEBF7" />
          {Array.from({ length: 9 }, (_, i) => <line key={i} x1={0} x2={360} y1={24 + i * 17} y2={24 + i * 17} stroke="#D6D2EA" strokeWidth={2} />)}
          {Array.from({ length: 13 }, (_, i) => <line key={`v${i}`} x1={i * 30} x2={i * 30} y1={16} y2={H} stroke="#D6D2EA" strokeWidth={2} />)}
          <rect width={360} height={16} fill="#3A2577" />
          <rect y={H} width={360} height={124} fill="#9A93B5" />
          <rect y={H + 10} width={360} height={7} fill="#FFD23F" />
          {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={10 + i * 20} cy={H + 13.5} r={1.6} fill={INK} opacity={0.5} />)}
          <Horizon />
        </g>
      );
    case "camping":
      return (
        <g>
          <rect width={360} height={H} fill="#BDEBFF" />
          <polygon points={`-20,${H} 60,74 140,${H}`} fill="#B9A8E8" {...ST} strokeWidth={2.5} />
          <polygon points="45,92 60,74 75,92 66,88 60,94 53,88" fill="#fff" />
          <polygon points={`210,${H} 300,64 390,${H}`} fill="#9C8BD6" {...ST} strokeWidth={2.5} />
          <polygon points="283,86 300,64 317,86 307,82 300,90 292,82" fill="#fff" />
          <Ground fill="#8EDB8A" tuft="#4FB35A" />
          <Horizon />
        </g>
      );
    case "gym":
      return (
        <g>
          <rect width={360} height={H} fill="#DCE4FF" />
          <rect x={98} y={16} width={164} height={150} rx={4} fill="#EAF6FF" {...ST} strokeWidth={2.5} />
          <path d="M120,150 L170,30 M146,150 L196,30" stroke="#fff" strokeWidth={6} opacity={0.8} />
          {[10, 286].map((x) => (
            <g key={x}>
              <rect x={x} y={20} width={8} height={156} fill="#E0A86A" {...ST} strokeWidth={2} />
              <rect x={x + 56} y={20} width={8} height={156} fill="#E0A86A" {...ST} strokeWidth={2} />
              {Array.from({ length: 9 }, (_, k) => <rect key={k} x={x + 8} y={30 + k * 16} width={48} height={4} fill="#E0A86A" stroke={INK} strokeWidth={1.4} />)}
            </g>
          ))}
          <rect y={H} width={360} height={124} fill="#4A4458" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 92 + 4} y={H + 30} width={84} height={50} rx={6} fill="#5B5470" />)}
          <Horizon />
        </g>
      );
    case "birthday":
      return (
        <g>
          <rect width={360} height={H} fill="#FFE9C7" />
          {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i % 10) * 38 + (Math.floor(i / 10) % 2 ? 19 : 0) + 6} cy={20 + Math.floor(i / 10) * 40} r={4} fill="#FFC6DD" />)}
          <path d="M0,10 Q90,34 180,12 Q270,34 360,10" fill="none" stroke={INK} strokeWidth={2} />
          {[16, 52, 88, 124, 236, 272, 308, 344].map((x, i) => {
            const y = x < 180 ? 10 + 22 * Math.sin((x / 180) * Math.PI) * 0.9 : 10 + 22 * Math.sin(((x - 180) / 180) * Math.PI) * 0.9;
            return <rect key={i} x={x - 9} y={y} width={18} height={18} rx={3} fill={BRIGHT[i % 5]} stroke={INK} strokeWidth={2} transform={`rotate(${i % 2 ? 6 : -6} ${x} ${y})`} />;
          })}
          <Planks fill="#C98B5A" line="#A86E42" />
          <Horizon />
        </g>
      );
    case "airport":
      return (
        <g>
          <rect width={360} height={H} fill="#E3E8F7" />
          <rect x={0} y={14} width={360} height={118} fill="#A9E4FF" />
          <ellipse cx={70} cy={50} rx={26} ry={9} fill="#fff" />
          <ellipse cx={250} cy={96} rx={30} ry={9} fill="#fff" />
          <g transform="translate(292 40) rotate(-12)">
            <path d="M-34,0 Q-34,-7 -24,-7 L28,-7 Q38,-7 40,0 Q38,7 28,7 L-24,7 Q-34,7 -34,0 Z" fill="#fff" {...ST} strokeWidth={2.2} />
            <path d="M-4,-6 L8,-26 L16,-26 L12,-6 M-4,6 L8,24 L16,24 L12,6 M-30,-5 L-36,-18 L-28,-18 L-22,-6" fill="#fff" {...ST} strokeWidth={2.2} />
          </g>
          {[0, 72, 144, 216, 288, 360].map((x) => <line key={x} x1={x} x2={x} y1={14} y2={132} stroke={INK} strokeWidth={4} />)}
          <rect x={0} y={12} width={360} height={6} fill={INK} />
          <rect x={0} y={130} width={360} height={6} fill={INK} />
          <rect y={H} width={360} height={124} fill="#F2F0FA" />
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={i * 80 - 20} x2={i * 80 + 30} y1={300} y2={H} stroke="#E2DEF0" strokeWidth={10} />)}
          <Horizon />
        </g>
      );
    case "hospital":
      return (
        <g>
          <rect width={360} height={H} fill="#DDF5EE" />
          <rect y={122} width={360} height={54} fill="#C3EBDD" />
          <line x1={0} x2={360} y1={122} y2={122} stroke="#9FD9C4" strokeWidth={3} />
          <g transform="translate(300 140)">
            <rect x={-14} y={-14} width={28} height={28} rx={6} fill="#fff" {...ST} strokeWidth={2.2} />
            <path d="M0,-8 L0,8 M-8,0 L8,0" stroke="#FF4B3E" strokeWidth={5} strokeLinecap="round" />
          </g>
          <Checker a="#D7E8EF" b="#EAF4F8" w={40} h={31} />
          <Horizon />
        </g>
      );
    case "concert":
      return (
        <g>
          <rect width={360} height={H} fill="#1B0F3F" />
          {[[30, 40], [70, 20], [300, 30], [330, 64], [20, 100], [340, 120]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2} fill="#fff" opacity={0.5} />)}
          {[10, 280].map((x) => (
            <g key={x}>
              <rect x={x} y={86} width={70} height={90} rx={4} fill="#2B2440" {...ST} strokeWidth={2.5} />
              <circle cx={x + 35} cy={110} r={13} fill="#4A4458" stroke="#9C98B8" strokeWidth={2} />
              <circle cx={x + 35} cy={150} r={17} fill="#4A4458" stroke="#9C98B8" strokeWidth={2} />
              <circle cx={x + 35} cy={150} r={6} fill="#9C98B8" />
            </g>
          ))}
          <rect y={H} width={360} height={124} fill="#2A1B5E" />
          {[200, 228, 258, 290].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke="#3D2A80" strokeWidth={2} />)}
          <rect y={H} width={360} height={8} fill="#4A3A90" stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case "zoo":
      return (
        <g>
          <rect width={360} height={H} fill="#C4EEFF" />
          {[[30, 150, 50], [110, 160, 40], [330, 150, 50], [250, 164, 36]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.6} fill="#7FCF86" />)}
          <rect x={0} y={140} width={360} height={6} fill="#C98B5A" stroke={INK} strokeWidth={1.8} />
          <rect x={0} y={158} width={360} height={6} fill="#C98B5A" stroke={INK} strokeWidth={1.8} />
          {Array.from({ length: 13 }, (_, i) => <rect key={i} x={i * 30 - 3} y={132} width={8} height={44} rx={2} fill="#A86E42" stroke={INK} strokeWidth={1.8} />)}
          <Ground fill="#F2D9A0" />
          {[[60, 240], [200, 230], [310, 266], [130, 290]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.4} fill="#D9B97A" />)}
          <Horizon />
        </g>
      );
    case "funfair":
      return (
        <g>
          <rect width={360} height={H} fill="#FFD9C2" />
          <rect y={120} width={360} height={56} fill="#FFC3A6" />
          {[[45, -1], [315, 1]].map(([x, d]) => (
            <g key={x}>
              <polygon points={`${x - 38},${H} ${x - 38},140 ${x},112 ${x + 38},140 ${x + 38},${H}`} fill="#fff" {...ST} strokeWidth={2.5} />
              {[-26, -8, 10, 28].map((o) => <rect key={o} x={x + o - 5} y={138} width={9} height={38} fill="#FF4B3E" opacity={0.85} />)}
              <polygon points={`${x - 38},140 ${x},112 ${x + 38},140`} fill="#FF4B3E" {...ST} strokeWidth={2.5} />
              <path d={`M${x},112 l0,-14 l${10 * d},4 l${-10 * d},4`} fill="#FFD23F" stroke={INK} strokeWidth={1.8} />
              <polygon points={`${x - 38},${H} ${x - 38},140 ${x},112 ${x + 38},140 ${x + 38},${H}`} fill="none" {...ST} strokeWidth={2.5} />
            </g>
          ))}
          <Ground fill="#E7D3B0" />
          {[[60, 236], [230, 250], [150, 290], [310, 288]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill={BRIGHT[i]} opacity={0.7} />)}
          <Horizon />
        </g>
      );
    case "laundromat":
      return (
        <g>
          <rect width={360} height={H} fill="#E3F2FF" />
          {Array.from({ length: 6 }, (_, i) => <line key={i} x1={0} x2={360} y1={20 + i * 24} y2={20 + i * 24} stroke="#CFE3F5" strokeWidth={2} />)}
          {[6, 274].map((x) => (
            <g key={x}>
              <rect x={x} y={104} width={80} height={72} rx={6} fill="#fff" {...ST} strokeWidth={2.5} />
              <rect x={x} y={104} width={80} height={14} rx={4} fill="#E2DEF0" stroke={INK} strokeWidth={2} />
              <circle cx={x + 40} cy={146} r={20} fill="#CFE3F5" stroke={INK} strokeWidth={2.4} />
              <circle cx={x + 40} cy={146} r={13} fill="#9BE3FF" />
            </g>
          ))}
          <Checker a="#CFC9E4" b="#F4F2FA" w={30} h={31} />
          <Horizon />
        </g>
      );
    case "office":
      return (
        <g>
          <rect width={360} height={H} fill="#EEF0FF" />
          {[8, 268].map((x) => (
            <g key={x}>
              <rect x={x} y={16} width={84} height={96} rx={4} fill="#A9E4FF" {...ST} strokeWidth={2.5} />
              {[[8, 50, 20], [32, 34, 18], [54, 60, 22]].map(([dx, top, w], i) => <rect key={i} x={x + dx} y={top} width={w} height={112 - top} fill="#9C8BD6" opacity={0.75} />)}
              <line x1={x + 42} x2={x + 42} y1={16} y2={112} stroke={INK} strokeWidth={2.5} />
            </g>
          ))}
          {[0, 260].map((x) => <rect key={x} x={x} y={140} width={100} height={36} fill="#B8B5C8" stroke={INK} strokeWidth={2.2} />)}
          <rect y={H} width={360} height={124} fill="#B9C2E8" />
          {Array.from({ length: 8 }, (_, i) => <line key={i} x1={i * 48} x2={i * 48} y1={H} y2={300} stroke="#A9B2DC" strokeWidth={2} />)}
          {[214, 254].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke="#A9B2DC" strokeWidth={2} />)}
          <Horizon />
        </g>
      );
    case "schoolyard":
      return (
        <g>
          <rect width={360} height={H} fill="#BDEBFF" />
          <Tree x={40} y={110} />
          <Tree x={322} y={104} />
          <rect y={150} width={360} height={26} fill="#E8957A" />
          {[158, 167].map((y, r) => Array.from({ length: 19 }, (_, i) => <line key={`${y}-${i}`} x1={i * 20 + (r ? 10 : 0)} x2={i * 20 + (r ? 10 : 0)} y1={y - 8} y2={y + 1} stroke="#C9705A" strokeWidth={1.6} />))}
          <line x1={0} x2={360} y1={158} y2={158} stroke="#C9705A" strokeWidth={1.6} />
          <line x1={0} x2={360} y1={150} y2={150} stroke={INK} strokeWidth={2} />
          <rect y={H} width={360} height={124} fill="#B8B0CC" />
          {/* Soleil à la craie */}
          <circle cx={330} cy={222} r={10} fill="none" stroke="#fff" strokeWidth={2.4} opacity={0.75} />
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3;
            return <line key={i} x1={330 + Math.cos(a) * 14} y1={222 + Math.sin(a) * 14} x2={330 + Math.cos(a) * 20} y2={222 + Math.sin(a) * 20} stroke="#fff" strokeWidth={2.4} opacity={0.75} strokeLinecap="round" />;
          })}
          <Horizon />
        </g>
      );
    case "christmas":
      return (
        <g>
          <rect width={360} height={H} fill="#2F6B57" />
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1={i * 32 + 16} x2={i * 32 + 16} y1={0} y2={H} stroke="#2A5F4D" strokeWidth={8} />)}
          <path d="M0,8 Q45,26 90,8 Q135,26 180,8 Q225,26 270,8 Q315,26 360,8" fill="none" stroke="#3DBE73" strokeWidth={7} />
          {[45, 135, 225, 315].map((x) => <circle key={x} cx={x} cy={17} r={4} fill="#FF4B3E" stroke={INK} strokeWidth={1.5} />)}
          <g transform="translate(276 116)">
            <rect x={0} y={0} width={76} height={60} fill="#C9705A" {...ST} strokeWidth={2.5} />
            <rect x={-6} y={-8} width={88} height={10} rx={3} fill="#FFF6E5" {...ST} strokeWidth={2.2} />
            <path d="M18,60 L18,34 Q38,16 58,34 L58,60 Z" fill="#2B2440" {...ST} strokeWidth={2.2} />
            <path d="M30,60 Q28,46 36,40 Q36,50 42,46 Q44,38 40,32 Q52,40 48,60 Z" fill="#FF9F1C" stroke="#FFD23F" strokeWidth={2} />
          </g>
          <Planks fill="#B97A50" line="#9C6340" />
          <Horizon />
        </g>
      );
    case "hotel":
      return (
        <g>
          <rect width={360} height={H} fill="#F6E7D0" />
          <rect y={116} width={360} height={60} fill="#C98B5A" />
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 42 + 6} y={124} width={32} height={44} rx={3} fill="none" stroke="#A86E42" strokeWidth={2} />)}
          <line x1={0} x2={360} y1={116} y2={116} stroke={INK} strokeWidth={2.5} />
          <rect y={H} width={360} height={124} fill="#B5485A" />
          {Array.from({ length: 16 }, (_, i) => {
            const x = (i % 8) * 48 + (Math.floor(i / 8) % 2 ? 24 : 0), y = H + 30 + Math.floor(i / 8) * 56;
            return <polygon key={i} points={`${x},${y - 12} ${x + 12},${y} ${x},${y + 12} ${x - 12},${y}`} fill="#C9606F" />;
          })}
          <Horizon />
        </g>
      );
    case "cruise":
      return (
        <g>
          <rect width={360} height={H} fill="#A9E4FF" />
          <rect y={104} width={360} height={50} fill="#3D8BFF" />
          <path d="M10,118 q12,-6 24,0 t24,0 M250,128 q12,-6 24,0 t24,0 M120,140 q12,-6 24,0" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
          <rect y={H} width={360} height={124} fill="#E0B07A" />
          {[200, 228, 258, 290].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke="#C9965E" strokeWidth={2} />)}
          {Array.from({ length: 13 }, (_, i) => <rect key={i} x={i * 30 - 2} y={140} width={5} height={36} fill="#fff" stroke={INK} strokeWidth={1.6} />)}
          <rect x={0} y={136} width={360} height={7} fill="#fff" stroke={INK} strokeWidth={2.2} />
          <rect x={0} y={156} width={360} height={4} fill="#fff" stroke={INK} strokeWidth={1.4} />
          {[30, 330].map((x) => (
            <g key={x}>
              <circle cx={x} cy={158} r={14} fill="none" stroke={INK} strokeWidth={11} />
              <circle cx={x} cy={158} r={14} fill="none" stroke="#fff" strokeWidth={7} />
              <circle cx={x} cy={158} r={14} fill="none" stroke="#FF4B3E" strokeWidth={7} strokeDasharray="11 11" />
            </g>
          ))}
          <line x1={0} x2={360} y1={H} y2={H} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    case "worksite":
      return (
        <g>
          <rect width={360} height={H} fill="#C4EEFF" />
          {[6, 276].map((x) => (
            <g key={x} fill="none" stroke="#FF9F1C" strokeWidth={3}>
              <rect x={x} y={64} width={78} height={112} fill="#E9E4F5" stroke={INK} strokeWidth={2.2} />
              {[64, 101, 138].map((y) => <line key={y} x1={x} x2={x + 78} y1={y} y2={y} />)}
              {[0, 39, 78].map((dx) => <line key={dx} x1={x + dx} x2={x + dx} y1={64} y2={H} />)}
              <path d={`M${x},101 L${x + 39},64 L${x + 78},101 M${x},138 L${x + 39},101 L${x + 78},138`} strokeWidth={2} />
            </g>
          ))}
          <Ground fill="#D9B382" />
          {[[60, 236], [200, 230], [310, 266], [130, 290], [260, 296]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={6} ry={3} fill="#BF9862" />)}
          <Horizon />
        </g>
      );
    case "farm":
      return (
        <g>
          <rect width={360} height={H} fill="#BDEBFF" />
          <circle cx={316} cy={30} r={15} fill="#FFD23F" {...ST} />
          <ellipse cx={60} cy={H} rx={130} ry={44} fill="#A4E39F" />
          <ellipse cx={320} cy={H} rx={120} ry={36} fill="#A4E39F" />
          {[[20, 150], [62, 154]].map(([x, y], i) => (
            <g key={i}>
              <rect x={x} y={y} width={36} height={24} rx={6} fill="#FFD966" {...ST} strokeWidth={2.2} />
              <path d={`M${x + 6},${y + 8} l24,0 M${x + 6},${y + 16} l24,0`} stroke="#D9A82E" strokeWidth={2} />
            </g>
          ))}
          {[290, 320, 350].map((x) => <rect key={x} x={x - 3} y={146} width={6} height={30} fill="#fff" stroke={INK} strokeWidth={1.6} />)}
          <rect x={276} y={152} width={84} height={5} fill="#fff" stroke={INK} strokeWidth={1.4} />
          <rect x={276} y={164} width={84} height={5} fill="#fff" stroke={INK} strokeWidth={1.4} />
          <Ground fill="#9BD98A" tuft="#5FB86A" />
          <Horizon />
        </g>
      );
    case "museum":
      return (
        <g>
          <rect width={360} height={H} fill="#F3EBDD" />
          <rect y={14} width={360} height={6} fill="#E2D2B8" />
          <rect y={150} width={360} height={26} fill="#E2D2B8" />
          {[[24, 40, "#3D8BFF"], [276, 46, "#FF3EA5"]].map(([x, y, col]) => (
            <g key={x as number}>
              <rect x={x as number} y={y as number} width={60} height={70} fill="#fff" stroke="#C98B5A" strokeWidth={6} />
              <rect x={x as number} y={y as number} width={60} height={70} fill="none" {...ST} strokeWidth={2} />
              <circle cx={(x as number) + 22} cy={(y as number) + 28} r={12} fill={col as string} />
              <rect x={(x as number) + 28} y={(y as number) + 38} width={22} height={22} fill="#FFD23F" />
            </g>
          ))}
          <Planks fill="#C98B5A" line="#A86E42" />
          <Horizon />
        </g>
      );
    case "salon":
      return (
        <g>
          <rect width={360} height={H} fill="#FFE0EC" />
          {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 30 + 8} y={0} width={14} height={H} fill="#FFD0E2" />)}
          <g transform="translate(46 128)">
            <path d="M-26,-30 Q-26,-56 0,-56 Q26,-56 26,-30 L26,-18 L-26,-18 Z" fill="#B8B5C8" {...ST} strokeWidth={2.4} />
            <rect x={-4} y={-18} width={8} height={48} fill="#9C98B8" {...ST} strokeWidth={2} />
            <ellipse cx={0} cy={44} rx={20} ry={5} fill="#9C98B8" {...ST} strokeWidth={2} />
          </g>
          <Checker a="#D9D2EA" b="#F4F2FA" w={30} h={31} />
          <Horizon />
        </g>
      );
    case "train":
      return (
        <g>
          <rect width={360} height={H} fill="#E8E6F5" />
          <rect x={0} y={10} width={360} height={6} fill="#B8B5C8" stroke={INK} strokeWidth={1.8} />
          {[8, 268].map((x) => (
            <g key={x}>
              <rect x={x} y={28} width={84} height={80} rx={14} fill="#A9E4FF" />
              <path d={`M${x},86 Q${x + 40},70 ${x + 84},84 L${x + 84},100 Q${x + 84},108 ${x + 70},108 L${x + 14},108 Q${x},108 ${x},100 Z`} fill="#8EDB8A" />
              <rect x={x} y={28} width={84} height={80} rx={14} fill="none" {...ST} strokeWidth={3} />
            </g>
          ))}
          {[6, 266].map((x) => (
            <g key={x}>
              <rect x={x} y={118} width={88} height={58} rx={14} fill="#5B4FB0" {...ST} strokeWidth={2.5} />
              <rect x={x + 10} y={124} width={68} height={12} rx={5} fill="#FFF6E5" opacity={0.85} />
            </g>
          ))}
          <rect y={H} width={360} height={124} fill="#8C86A3" />
          <polygon points={`130,${H} 230,${H} 270,300 90,300`} fill="#6B6488" />
          <Horizon />
        </g>
      );
    case "festival":
      return (
        <g>
          <rect width={360} height={H} fill="#C9F0FF" />
          <path d="M0,18 Q45,40 92,30" fill="none" stroke={INK} strokeWidth={1.8} />
          <path d="M268,30 Q315,40 360,18" fill="none" stroke={INK} strokeWidth={1.8} />
          {[[14, 24], [36, 30], [58, 33], [80, 31], [282, 31], [304, 33], [326, 30], [348, 24]].map(([x, y], i) => <circle key={i} cx={x} cy={y + 4} r={4} fill={BRIGHT[i % 4]} stroke={INK} strokeWidth={1.4} />)}
          {[[44, "#FF3EA5"], [316, "#3D8BFF"]].map(([x, col]) => (
            <g key={x as number}>
              <polygon points={`${(x as number) - 36},${H} ${x},122 ${(x as number) + 36},${H}`} fill="#fff" {...ST} strokeWidth={2.5} />
              <polygon points={`${(x as number) - 12},${H} ${x},150 ${(x as number) + 12},${H}`} fill={col as string} stroke={INK} strokeWidth={2} />
            </g>
          ))}
          <Ground fill="#8EDB8A" tuft="#4FB35A" />
          <Horizon />
        </g>
      );
    case "restaurant":
      return (
        <g>
          <rect width={360} height={H} fill="#DDE3EC" />
          {Array.from({ length: 9 }, (_, r) => Array.from({ length: 13 }, (_, i) => (
            <rect key={`${r}-${i}`} x={i * 30 - (r % 2 ? 15 : 0)} y={r * 18} width={30} height={18} fill="none" stroke="#C8D0DC" strokeWidth={1.6} />
          )))}
          {[8, 270].map((x) => (
            <g key={x}>
              <rect x={x} y={128} width={82} height={6} fill="#B8B5C8" stroke={INK} strokeWidth={2} />
              {[0, 1, 2].map((k) => <ellipse key={k} cx={x + 41} cy={124 - k * 6} rx={24} ry={4} fill="#fff" stroke={INK} strokeWidth={1.8} />)}
            </g>
          ))}
          <Checker a="#F4B6B0" b="#FFF1EE" w={30} h={31} />
          <Horizon />
        </g>
      );
  }
}

// ── Gros élément coloré + détail à compter ───────────────
export function MoreFeature({ decor, c, n }: { decor: CountDecor; c: string; n: number }): ReactNode {
  switch (decor) {
    case "bank":
      return (
        <g>
          <rect x={118} y={44} width={124} height={134} rx={12} fill={c} {...ST} />
          <rect x={110} y={74} width={12} height={18} rx={3} fill={INK} />
          <rect x={110} y={132} width={12} height={18} rx={3} fill={INK} />
          <circle cx={184} cy={110} r={42} fill={c} {...ST} />
          <circle cx={184} cy={110} r={33} fill="rgba(255,255,255,0.28)" stroke={INK} strokeWidth={2} />
          <g stroke={INK} strokeWidth={4} strokeLinecap="round">
            <line x1={184} y1={88} x2={184} y2={132} />
            <line x1={165} y1={99} x2={203} y2={121} />
            <line x1={165} y1={121} x2={203} y2={99} />
          </g>
          <circle cx={184} cy={110} r={8} fill={INK} />
          {row(n, 180, 26).map((x, i) => (
            <g key={i}>
              <polygon points={`${x - 12},194 ${x + 12},194 ${x + 8},182 ${x - 8},182`} fill="#FFD23F" {...ST} strokeWidth={2.4} />
              <line x1={x - 5} x2={x + 3} y1={186} y2={186} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    case "supermarket":
      return (
        <g>
          {row(n, 178, 24).map((x, i) => {
            const h = 30 + (i % 3) * 7;
            return <rect key={i} x={x - 9} y={110 - h} width={18} height={h + 10} rx={3} fill={["#FFF6E5", "#FFD23F", "#3DDC97", "#FF9F1C", "#4ECDC4"][i % 5]} {...ST} strokeWidth={2.4} />;
          })}
          <path d="M112,98 L104,86 L94,86" fill="none" {...ST} strokeWidth={5} />
          <polygon points="112,98 248,98 236,160 124,160" fill={c} {...ST} />
          <g stroke={INK} strokeWidth={1.8} opacity={0.45}>
            {[140, 164, 188, 212].map((x) => <line key={x} x1={x} x2={x - 2} y1={100} y2={158} />)}
            <line x1={116} x2={244} y1={118} y2={118} />
            <line x1={120} x2={240} y1={138} y2={138} />
          </g>
          <path d="M124,160 L128,176 L236,176" fill="none" {...ST} strokeWidth={4} />
          <circle cx={136} cy={184} r={7} fill={INK} />
          <circle cx={226} cy={184} r={7} fill={INK} />
        </g>
      );
    case "metro": {
      const ww = (132 - (n - 1) * 10) / n;
      return (
        <g>
          <rect x={100} y={52} width={160} height={126} rx={18} fill={c} {...ST} />
          {Array.from({ length: n }, (_, i) => (
            <g key={i}>
              <rect x={114 + i * (ww + 10)} y={70} width={ww} height={42} rx={6} fill="#CFF1FF" {...ST} strokeWidth={2.4} />
              <line x1={120 + i * (ww + 10)} x2={128 + i * (ww + 10)} y1={98} y2={78} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
            </g>
          ))}
          <rect x={102} y={124} width={156} height={9} fill="#fff" opacity={0.75} />
          <rect x={100} y={162} width={160} height={16} rx={4} fill={INK} />
          <circle cx={118} cy={146} r={5} fill="#FFD23F" stroke={INK} strokeWidth={2} />
          <circle cx={242} cy={146} r={5} fill="#FFD23F" stroke={INK} strokeWidth={2} />
        </g>
      );
    }
    case "camping": {
      const pts = Array.from({ length: n }, (_, i) => 0.42 + (n === 1 ? 0 : (i * 0.5) / (n - 1)));
      return (
        <g>
          <line x1={110} y1={160} x2={96} y2={170} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <rect x={110} y={88} width={150} height={84} rx={28} fill={c} {...ST} />
          <rect x={114} y={136} width={142} height={8} fill="#fff" opacity={0.65} />
          <rect x={124} y={102} width={42} height={26} rx={7} fill="#CFF1FF" {...ST} strokeWidth={2.4} />
          <rect x={214} y={102} width={28} height={62} rx={6} fill={SHADE} stroke={INK} strokeWidth={2.4} />
          <circle cx={236} cy={134} r={2.4} fill={INK} />
          <circle cx={160} cy={174} r={12} fill={INK} />
          <circle cx={160} cy={174} r={4.5} fill="#D8D6E8" />
          {/* Feu de camp et pique à guimauves */}
          <g transform="translate(200 202)">
            <path d="M-16,0 L16,-6 M-16,-6 L16,0" stroke="#8A5A34" strokeWidth={6} strokeLinecap="round" />
            <path d="M-10,-4 Q-12,-20 0,-30 Q-2,-18 6,-22 Q12,-12 10,-4 Z" fill="#FF9F1C" stroke="#FF4B3E" strokeWidth={2} />
          </g>
          <line x1={112} y1={210} x2={236} y2={170} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <line x1={112} y1={210} x2={236} y2={170} stroke="#C98B5A" strokeWidth={2.6} strokeLinecap="round" />
          {pts.map((t, i) => {
            const x = 112 + 124 * t, y = 210 - 40 * t;
            return <rect key={i} x={x - 7} y={y - 6} width={14} height={12} rx={4} fill="#fff" {...ST} strokeWidth={2.2} transform={`rotate(-18 ${x} ${y})`} />;
          })}
        </g>
      );
    }
    case "gym":
      return (
        <g>
          <line x1={180} x2={180} y1={16} y2={42} stroke={INK} strokeWidth={4} strokeDasharray="6 4" />
          <rect x={156} y={40} width={48} height={120} rx={22} fill={c} {...ST} />
          <rect x={157} y={58} width={46} height={8} fill={INK} opacity={0.8} />
          <rect x={157} y={136} width={46} height={8} fill={INK} opacity={0.8} />
          <rect x={164} y={72} width={7} height={50} rx={3.5} fill="#fff" opacity={0.45} />
          {row(n, 180, 32).map((x, i) => (
            <g key={i} transform={`translate(${x} 194)`}>
              <path d="M-7,-18 Q-7,-30 0,-30 Q7,-30 7,-18" fill="none" {...ST} strokeWidth={4} />
              <circle cx={0} cy={-10} r={11} fill="#2B2440" {...ST} strokeWidth={2.6} />
              <ellipse cx={-4} cy={-14} rx={2.5} ry={3.5} fill="#fff" opacity={0.4} />
            </g>
          ))}
        </g>
      );
    case "birthday":
      return (
        <g>
          <rect x={112} y={146} width={136} height={12} rx={4} fill="#FFF6E5" {...ST} />
          <polygon points="114,158 246,158 242,182 118,182" fill="#fff" {...ST} />
          <path d="M118,182 q11,-8 22,0 q11,-8 22,0 q11,-8 22,0 q11,-8 22,0 q11,-8 22,0 q11,-8 22,0" fill="none" stroke="#FF3EA5" strokeWidth={2.2} />
          <rect x={128} y={108} width={104} height={40} rx={8} fill={c} {...ST} />
          <path d="M131,112 q8,10 16,0 q8,10 16,0 q8,10 16,0 q8,10 16,0 q8,10 16,0 q8,10 16,0" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          <rect x={148} y={78} width={64} height={32} rx={8} fill={c} {...ST} />
          <path d="M151,82 q7,8 14,0 q7,8 14,0 q7,8 14,0 q7,8 14,0" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          {row(n, 180, 11).map((x, i) => (
            <g key={i}>
              <rect x={x - 2.5} y={60} width={5} height={18} rx={1.5} fill="#FFF6E5" stroke={INK} strokeWidth={1.8} />
              <ellipse cx={x} cy={54} rx={3} ry={5} fill="#FFD23F" stroke={INK} strokeWidth={1.5} />
            </g>
          ))}
        </g>
      );
    case "airport": {
      const STICK: [number, number][] = [[152, 110], [208, 118], [160, 162], [206, 164], [182, 138]];
      return (
        <g>
          <rect x={164} y={50} width={5} height={42} fill="#B8B5C8" stroke={INK} strokeWidth={2} />
          <rect x={191} y={50} width={5} height={42} fill="#B8B5C8" stroke={INK} strokeWidth={2} />
          <rect x={158} y={44} width={44} height={9} rx={4} fill={INK} />
          <rect x={132} y={88} width={96} height={98} rx={14} fill={c} {...ST} />
          {[156, 180, 204].map((x) => <line key={x} x1={x} x2={x} y1={94} y2={180} stroke={INK} strokeWidth={2} opacity={0.25} />)}
          <circle cx={146} cy={192} r={6} fill={INK} />
          <circle cx={214} cy={192} r={6} fill={INK} />
          {STICK.slice(0, n).map(([x, y], i) => (
            i % 2 ? (
              <rect key={i} x={x - 9} y={y - 7} width={18} height={14} rx={3} fill={BRIGHT[(i + 2) % 7]} stroke={INK} strokeWidth={2} transform={`rotate(${i * 9 - 12} ${x} ${y})`} />
            ) : (
              <g key={i}>
                <circle cx={x} cy={y} r={9} fill={BRIGHT[i % 7]} stroke={INK} strokeWidth={2} />
                <path d={`M${x},${y - 5} l1.6,3.4 3.6,0.4 -2.7,2.4 0.8,3.6 -3.3,-1.9 -3.3,1.9 0.8,-3.6 -2.7,-2.4 3.6,-0.4 Z`} fill="#fff" />
              </g>
            )
          ))}
        </g>
      );
    }
    case "hospital":
      return (
        <g>
          <rect x={144} y={96} width={72} height={7} rx={2} fill="#C98B5A" {...ST} strokeWidth={2.2} />
          {Array.from({ length: n }, (_, i) => {
            const a = ((n === 1 ? 0 : -55 + (110 * i) / (n - 1)) * Math.PI) / 180;
            const hx = 180 + Math.sin(a) * 30, hy = 76 - Math.cos(a) * 30;
            return (
              <g key={i}>
                <line x1={180} y1={80} x2={hx} y2={hy} stroke="#2E9E6A" strokeWidth={2.6} strokeLinecap="round" />
                <circle cx={hx} cy={hy} r={7} fill={["#FF3EA5", "#FFD23F", "#FF4B3E", "#8B5CF6", "#FF9F1C"][i % 5]} stroke={INK} strokeWidth={2} />
                <circle cx={hx} cy={hy} r={2.4} fill="#fff" />
              </g>
            );
          })}
          <path d="M168,96 L166,82 Q180,76 194,82 L192,96 Z" fill="#4ECDC4" {...ST} strokeWidth={2.4} />
          <rect x={104} y={110} width={12} height={78} rx={4} fill="#B8B5C8" {...ST} strokeWidth={2.4} />
          <rect x={248} y={132} width={10} height={56} rx={4} fill="#B8B5C8" {...ST} strokeWidth={2.4} />
          <rect x={110} y={148} width={144} height={18} rx={6} fill="#fff" {...ST} strokeWidth={2.6} />
          <ellipse cx={134} cy={142} rx={18} ry={9} fill="#fff" {...ST} strokeWidth={2.4} />
          <rect x={150} y={134} width={102} height={34} rx={8} fill={c} {...ST} />
          <rect x={150} y={134} width={16} height={34} rx={6} fill="#fff" opacity={0.5} />
          {[124, 240].map((x) => <circle key={x} cx={x} cy={186} r={5} fill={INK} />)}
        </g>
      );
    case "concert": {
      const xs = row(n, 180, 34);
      return (
        <g>
          {xs.map((x, i) => <polygon key={`b${i}`} points={`${x - 6},34 ${x + 6},34 ${x + 26},172 ${x - 26},172`} fill="#FFF3B0" opacity={0.2} />)}
          <rect x={92} y={12} width={176} height={10} fill="#9C98B8" {...ST} strokeWidth={2.2} />
          <path d={Array.from({ length: 11 }, (_, i) => `${i ? "L" : "M"}${94 + i * 17},${i % 2 ? 21 : 13}`).join(" ")} fill="none" stroke={INK} strokeWidth={1.4} />
          {xs.map((x, i) => (
            <g key={i}>
              <rect x={x - 8} y={22} width={16} height={14} rx={3} fill="#4A4458" stroke={INK} strokeWidth={2.2} />
              <ellipse cx={x} cy={36} rx={7} ry={2.6} fill="#FFF3B0" stroke={INK} strokeWidth={1.4} />
            </g>
          ))}
          {[120, 240].map((x) => (
            <g key={x}>
              <line x1={x} x2={x} y1={98} y2={184} stroke={INK} strokeWidth={3} />
              <ellipse cx={x} cy={96} rx={20} ry={5} fill="#FFD23F" {...ST} strokeWidth={2.4} />
            </g>
          ))}
          <circle cx={150} cy={112} r={15} fill={c} {...ST} />
          <ellipse cx={150} cy={104} rx={12} ry={4} fill="#fff" stroke={INK} strokeWidth={1.8} />
          <circle cx={210} cy={112} r={15} fill={c} {...ST} />
          <ellipse cx={210} cy={104} rx={12} ry={4} fill="#fff" stroke={INK} strokeWidth={1.8} />
          <path d="M160,180 L154,192 M200,180 L206,192" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <circle cx={180} cy={150} r={33} fill={c} {...ST} />
          <circle cx={180} cy={150} r={21} fill="#fff" opacity={0.9} stroke={INK} strokeWidth={2} />
          <path d="M168,150 l24,0 M180,138 l0,24" stroke={c} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    }
    case "zoo":
      return (
        <g>
          <ellipse cx={146} cy={188} rx={46} ry={8} fill="#fff" {...ST} strokeWidth={2.4} />
          {row(n, 146, 22).map((x, i) => (
            <g key={i} transform={`translate(${x} 186) scale(1.25)`}>
              <ellipse cx={0} cy={-13} rx={8.5} ry={13} fill={INK} />
              <ellipse cx={0} cy={-10} rx={5.5} ry={9} fill="#fff" />
              <circle cx={-2.5} cy={-21} r={1.6} fill="#fff" />
              <circle cx={2.5} cy={-21} r={1.6} fill="#fff" />
              <path d="M-2.5,-18 L2.5,-18 L0,-14 Z" fill="#FF9F1C" />
              <path d="M-5,0 l3,-2 M5,0 l-3,-2" stroke="#FF9F1C" strokeWidth={2.4} strokeLinecap="round" />
            </g>
          ))}
          <path d="M254,130 q12,4 10,20" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          {[204, 216, 232, 244].map((x) => <rect key={x} x={x - 3.5} y={138} width={7} height={54} rx={3} fill="#FFC94A" {...ST} strokeWidth={2.2} />)}
          <ellipse cx={224} cy={134} rx={34} ry={20} fill="#FFC94A" {...ST} />
          <polygon points="222,130 238,126 252,54 238,50" fill="#FFC94A" {...ST} />
          {[[208, 130], [226, 144], [236, 124], [240, 98], [244, 72]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4.5} fill="#C7834A" />)}
          <ellipse cx={252} cy={44} rx={17} ry={10} fill="#FFC94A" {...ST} />
          <path d="M244,36 l-2,-12 M254,35 l2,-12" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <circle cx={242} cy={23} r={3} fill="#C7834A" stroke={INK} strokeWidth={1.6} />
          <circle cx={256} cy={22} r={3} fill="#C7834A" stroke={INK} strokeWidth={1.6} />
          <circle cx={250} cy={41} r={2.2} fill={INK} />
          <polygon points="231,80 254,86 252,100 228,94" fill={c} {...ST} strokeWidth={2.6} />
          <polygon points="232,94 244,97 238,124 226,120" fill={c} {...ST} strokeWidth={2.6} />
        </g>
      );
    case "funfair":
      return (
        <g>
          <path d="M180,96 L138,182 M180,96 L222,182" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <path d="M180,96 L138,182 M180,96 L222,182" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" />
          <g stroke={INK} strokeWidth={2}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              return <line key={i} x1={180} y1={96} x2={180 + Math.cos(a) * 64} y2={96 + Math.sin(a) * 64} />;
            })}
          </g>
          <circle cx={180} cy={96} r={64} fill="none" stroke={INK} strokeWidth={9} />
          <circle cx={180} cy={96} r={64} fill="none" stroke={c} strokeWidth={5} />
          <circle cx={180} cy={96} r={22} fill="none" stroke={c} strokeWidth={4} />
          <circle cx={180} cy={96} r={7} fill={INK} />
          {Array.from({ length: n }, (_, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + 0.3;
            const x = 180 + Math.cos(a) * 64, y = 96 + Math.sin(a) * 64;
            return (
              <g key={i}>
                <line x1={x} y1={y} x2={x} y2={y + 5} stroke={INK} strokeWidth={2} />
                <rect x={x - 10} y={y + 4} width={20} height={15} rx={4} fill={["#FFD23F", "#3DDC97", "#FF3EA5", "#3D8BFF"][i % 4]} stroke={INK} strokeWidth={2} />
              </g>
            );
          })}
        </g>
      );
    case "laundromat":
      return (
        <g>
          <path d="M106,30 Q180,44 254,30" fill="none" stroke={INK} strokeWidth={2} />
          {row(n, 180, 28).map((x, i) => {
            const y = 30 + 14 * (1 - ((x - 180) / 74) ** 2) * 0.9;
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <polygon points="-5,0 5,0 5,15 12,21 10,28 -3,25 -5,17" fill={["#FF4B3E", "#3DDC97", "#FFD23F", "#FF3EA5", "#8B5CF6"][i % 5]} {...ST} strokeWidth={2} />
                <rect x={-5} y={0} width={10} height={5} fill="#fff" stroke={INK} strokeWidth={1.6} />
                <rect x={-2} y={-4} width={4} height={7} rx={1} fill="#C98B5A" stroke={INK} strokeWidth={1.2} />
              </g>
            );
          })}
          <rect x={132} y={90} width={96} height={100} rx={10} fill={c} {...ST} />
          <rect x={134} y={92} width={92} height={16} rx={6} fill={SHADE} />
          <circle cx={146} cy={100} r={4} fill="#fff" stroke={INK} strokeWidth={1.6} />
          <rect x={196} y={96} width={22} height={8} rx={2} fill={INK} />
          <circle cx={180} cy={148} r={30} fill="#fff" {...ST} />
          <circle cx={180} cy={148} r={22} fill="#9BE3FF" stroke={INK} strokeWidth={2} />
          <path d="M166,150 q7,-12 14,0 t14,0" fill="none" stroke="#FF3EA5" strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={172} cy={140} rx={4} ry={6} fill="#fff" opacity={0.7} />
        </g>
      );
    case "office": {
      const NOTES: [number, number][] = [[134, 36], [170, 34], [208, 40], [140, 70], [178, 72], [214, 68]];
      return (
        <g>
          <rect x={112} y={20} width={136} height={80} rx={6} fill="#fff" stroke="#B8B5C8" strokeWidth={6} />
          <rect x={112} y={20} width={136} height={80} rx={6} fill="none" {...ST} strokeWidth={2.4} />
          <path d="M122,92 l30,0 M200,92 l38,0" stroke="#B8B5C8" strokeWidth={2.4} strokeLinecap="round" />
          {NOTES.slice(0, n).map(([x, y], i) => (
            <g key={i} transform={`rotate(${(i % 3) * 5 - 5} ${x + 11} ${y + 11})`}>
              <rect x={x} y={y} width={22} height={22} fill={["#FFE066", "#FF8CC6", "#7CEBB8"][i % 3]} stroke={INK} strokeWidth={2} />
              <path d={`M${x + 4},${y + 9} l13,0 M${x + 4},${y + 15} l9,0`} stroke={INK} strokeWidth={1.4} opacity={0.5} />
            </g>
          ))}
          <rect x={224} y={140} width={24} height={7} fill="#fff" {...ST} strokeWidth={2} />
          <rect x={136} y={122} width={88} height={66} rx={8} fill={c} {...ST} />
          <rect x={132} y={108} width={96} height={16} rx={4} fill={c} {...ST} />
          <rect x={133} y={110} width={94} height={12} rx={3} fill={SHADE} />
          <rect x={144} y={132} width={34} height={12} rx={3} fill={INK} />
          <circle cx={152} cy={138} r={2.4} fill="#3DDC97" />
          <rect x={146} y={156} width={68} height={6} rx={2} fill={INK} opacity={0.35} />
          <rect x={146} y={168} width={68} height={6} rx={2} fill={INK} opacity={0.35} />
        </g>
      );
    }
    case "schoolyard":
      return (
        <g>
          <rect x={108} y={60} width={144} height={116} fill="#FFF1D6" {...ST} />
          <polygon points="98,64 180,18 262,64" fill={c} {...ST} />
          <circle cx={180} cy={44} r={8} fill="#fff" stroke={INK} strokeWidth={2.2} />
          {row(n, 180, 27).map((x, i) => (
            <g key={i}>
              <rect x={x - 10} y={78} width={20} height={24} rx={3} fill="#CFF1FF" stroke={INK} strokeWidth={2.2} />
              <path d={`M${x},78 l0,24 M${x - 10},90 l20,0`} stroke={INK} strokeWidth={1.6} />
            </g>
          ))}
          <rect x={164} y={130} width={32} height={46} rx={4} fill="#8A5A34" {...ST} />
          <circle cx={190} cy={154} r={2.6} fill="#FFD23F" />
          <rect x={150} y={116} width={60} height={9} rx={3} fill="#FFD23F" stroke={INK} strokeWidth={2} />
        </g>
      );
    case "christmas": {
      const BAUBLES: [number, number][] = [[152, 158], [208, 160], [180, 140], [160, 116], [202, 112], [180, 86], [172, 62]];
      return (
        <g>
          <rect x={172} y={164} width={16} height={20} fill="#8A5A34" {...ST} strokeWidth={2.4} />
          <polygon points="116,170 244,170 180,104" fill="#2E9E6A" {...ST} />
          <polygon points="130,128 230,128 180,68" fill="#38B57A" {...ST} />
          <polygon points="146,88 214,88 180,34" fill="#2E9E6A" {...ST} />
          <path d="M126,160 Q180,146 234,160 M140,120 Q180,108 222,118" fill="none" stroke="#FFD23F" strokeWidth={2.6} strokeDasharray="5 5" />
          <polygon points="180,16 185,27 197,27 187,34 191,46 180,39 169,46 173,34 163,27 175,27" fill="#FFD23F" {...ST} strokeWidth={2.2} />
          {BAUBLES.slice(0, n).map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={7.5} fill={c} stroke={INK} strokeWidth={2.2} />
              <circle cx={x - 2.5} cy={y - 2.5} r={2} fill="#fff" opacity={0.7} />
            </g>
          ))}
        </g>
      );
    }
    case "hotel": {
      const HOOKS: [number, number][] = [[148, 34], [180, 34], [212, 34], [148, 60], [180, 60], [212, 60]];
      const order = [0, 4, 2, 3, 1, 5];
      const used = new Set(order.slice(0, n));
      return (
        <g>
          <rect x={124} y={20} width={112} height={66} rx={6} fill="#8A5A34" {...ST} />
          {HOOKS.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={2.6} fill="#FFD23F" stroke={INK} strokeWidth={1.2} />
              {used.has(i) && (
                <g>
                  <circle cx={x} cy={y + 6} r={4} fill="none" stroke="#FFD23F" strokeWidth={2.4} />
                  <rect x={x - 7} y={y + 9} width={14} height={15} rx={3} fill="#FFD23F" stroke={INK} strokeWidth={1.8} />
                  <circle cx={x} cy={y + 16} r={2} fill={INK} />
                </g>
              )}
            </g>
          ))}
          <rect x={104} y={120} width={152} height={66} rx={6} fill={c} {...ST} />
          <rect x={120} y={134} width={120} height={40} rx={4} fill={SHADE} />
          <rect x={98} y={112} width={164} height={12} rx={4} fill="#4A4458" {...ST} strokeWidth={2.6} />
          <path d="M210,111 Q210,98 222,98 Q234,98 234,111 Z" fill="#FFD23F" {...ST} strokeWidth={2.2} />
          <circle cx={222} cy={96} r={2.4} fill={INK} />
        </g>
      );
    }
    case "cruise": {
      const GULLS: [number, number][] = [[116, 28], [246, 30], [118, 72], [244, 74], [160, 18]];
      return (
        <g>
          <circle cx={198} cy={22} r={9} fill="#E2DEF0" />
          <circle cx={214} cy={12} r={7} fill="#E2DEF0" />
          <polygon points="144,40 216,40 224,150 136,150" fill={c} {...ST} />
          <polygon points="144,40 216,40 217,54 143,54" fill={INK} />
          <polygon points="140,84 220,84 221,98 139,98" fill="#fff" stroke={INK} strokeWidth={2} />
          <rect x={128} y={146} width={104} height={12} rx={3} fill="#fff" {...ST} strokeWidth={2.4} />
          {GULLS.slice(0, n).map(([x, y], i) => (
            <path key={i} d={`M${x - 14},${y + 2} Q${x - 7},${y - 9} ${x},${y} Q${x + 7},${y - 9} ${x + 14},${y + 2}`} fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>
      );
    }
    case "worksite":
      return (
        <g>
          <g stroke={INK} strokeWidth={6} strokeLinecap="round">
            <line x1={128} x2={128} y1={34} y2={176} />
            <line x1={146} x2={146} y1={34} y2={176} />
            <line x1={104} x2={252} y1={32} y2={32} />
            <line x1={104} x2={252} y1={44} y2={44} />
          </g>
          <g stroke={c} strokeWidth={3.2} strokeLinecap="round">
            <line x1={128} x2={128} y1={34} y2={176} />
            <line x1={146} x2={146} y1={34} y2={176} />
            <line x1={104} x2={252} y1={32} y2={32} />
            <line x1={104} x2={252} y1={44} y2={44} />
            <path d={Array.from({ length: 9 }, (_, i) => `${i ? "L" : "M"}${i % 2 ? 146 : 128},${48 + i * 16}`).join(" ")} fill="none" strokeWidth={2.4} />
            <path d={Array.from({ length: 10 }, (_, i) => `${i ? "L" : "M"}${150 + i * 11},${i % 2 ? 44 : 32}`).join(" ")} fill="none" strokeWidth={2.4} />
          </g>
          <rect x={100} y={44} width={22} height={18} rx={2} fill="#4A4458" {...ST} strokeWidth={2.4} />
          <rect x={126} y={46} width={24} height={18} rx={3} fill={c} {...ST} strokeWidth={2.4} />
          <rect x={132} y={50} width={12} height={8} rx={2} fill="#CFF1FF" />
          <line x1={234} x2={234} y1={44} y2={90} stroke={INK} strokeWidth={2} />
          <path d="M234,90 q0,6 -5,6" fill="none" stroke={INK} strokeWidth={2.6} />
          <rect x={206} y={96} width={56} height={10} rx={2} fill="#8C86A3" {...ST} strokeWidth={2.4} />
          {row(n, 196, 24).map((x, i) => (
            <g key={i} transform={`translate(${x} 196)`}>
              <polygon points="-8,0 8,0 2.5,-24 -2.5,-24" fill="#FF9F1C" {...ST} strokeWidth={2} />
              <polygon points="-5.2,-10 5.2,-10 4,-15 -4,-15" fill="#fff" />
              <rect x={-11} y={-3} width={22} height={4} rx={1.5} fill={INK} />
            </g>
          ))}
        </g>
      );
    case "farm":
      return (
        <g>
          <polygon points="118,176 118,96 180,60 242,96 242,176" fill={c} {...ST} />
          <path d="M110,100 L180,54 L250,100" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M110,100 L180,54 L250,100" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <rect x={168} y={78} width={24} height={20} rx={2} fill="#FFF6E5" stroke={INK} strokeWidth={2.2} />
          <rect x={150} y={118} width={60} height={58} fill="#FFF6E5" {...ST} />
          <path d="M150,118 L210,176 M210,118 L150,176 M180,118 L180,176" stroke={INK} strokeWidth={2.4} />
          {row(n, 180, 26).map((x, i) => (
            <g key={i} transform={`translate(${x} 198)`}>
              <path d="M-3,-4 l-1,4 M3,-4 l1,4" stroke="#FF9F1C" strokeWidth={2} strokeLinecap="round" />
              <ellipse cx={1} cy={-11} rx={10} ry={7.5} fill="#fff" {...ST} strokeWidth={2} />
              <path d="M8,-15 q6,-4 4,4" fill="#fff" stroke={INK} strokeWidth={1.8} />
              <circle cx={-7} cy={-19} r={5.5} fill="#fff" {...ST} strokeWidth={2} />
              <path d="M-10,-24 q1,-4 3,-1 q1,-4 3,0" fill="#FF4B3E" stroke={INK} strokeWidth={1.2} />
              <path d="M-12,-19 l-4,1 l4,2 Z" fill="#FF9F1C" />
              <circle cx={-8} cy={-20} r={1.2} fill={INK} />
            </g>
          ))}
        </g>
      );
    case "museum":
      return (
        <g>
          <rect x={112} y={16} width={136} height={112} rx={4} fill={c} {...ST} />
          <rect x={124} y={28} width={112} height={88} fill="#FFF6E5" stroke={INK} strokeWidth={2} />
          <line x1={124} x2={236} y1={100} y2={100} stroke="#C98B5A" strokeWidth={3} />
          <path d="M146,90 Q180,118 214,90 Z" fill="#4ECDC4" stroke={INK} strokeWidth={2} />
          {row(n, 180, 17).map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={i % 2 ? 76 : 84} r={8} fill="#FF4B3E" stroke={INK} strokeWidth={1.8} />
              <path d={`M${x},${(i % 2 ? 76 : 84) - 8} q3,-5 7,-4`} fill="none" stroke="#2E9E6A" strokeWidth={2.2} strokeLinecap="round" />
            </g>
          ))}
          {[116, 244].map((x) => (
            <g key={x}>
              <rect x={x - 3} y={148} width={6} height={42} fill="#FFD23F" {...ST} strokeWidth={2} />
              <ellipse cx={x} cy={190} rx={10} ry={3} fill="#FFD23F" {...ST} strokeWidth={2} />
              <circle cx={x} cy={146} r={5} fill="#FFD23F" {...ST} strokeWidth={2} />
            </g>
          ))}
          <path d="M120,152 Q180,178 240,152" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <path d="M120,152 Q180,178 240,152" fill="none" stroke="#E5383B" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case "salon":
      return (
        <g>
          <ellipse cx={180} cy={46} rx={52} ry={42} fill="#FFD23F" {...ST} />
          <ellipse cx={180} cy={46} rx={42} ry={33} fill="#EAF6FF" stroke={INK} strokeWidth={2} />
          <path d="M156,64 L184,24 M168,68 L192,34" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          {row(n, 180, 20).map((x, i) => {
            const h = 16 + (i % 3) * 4;
            return (
              <g key={i}>
                <rect x={x - 6} y={98 - h} width={12} height={h} rx={3} fill={["#3D8BFF", "#FF3EA5", "#3DDC97", "#FF9F1C", "#8B5CF6"][i % 5]} stroke={INK} strokeWidth={2} />
                <rect x={x - 3} y={98 - h - 5} width={6} height={6} rx={1} fill={INK} />
              </g>
            );
          })}
          <rect x={128} y={98} width={104} height={7} rx={2} fill="#C98B5A" {...ST} strokeWidth={2.2} />
          <rect x={150} y={108} width={60} height={42} rx={14} fill={c} {...ST} />
          <rect x={132} y={138} width={14} height={22} rx={5} fill={c} {...ST} strokeWidth={2.6} />
          <rect x={214} y={138} width={14} height={22} rx={5} fill={c} {...ST} strokeWidth={2.6} />
          <rect x={140} y={146} width={80} height={16} rx={6} fill={c} {...ST} />
          <rect x={140} y={146} width={80} height={16} rx={6} fill={SHADE} />
          <rect x={174} y={162} width={12} height={20} fill="#B8B5C8" {...ST} strokeWidth={2.2} />
          <ellipse cx={180} cy={186} rx={30} ry={6} fill="#B8B5C8" {...ST} strokeWidth={2.4} />
        </g>
      );
    case "train":
      return (
        <g>
          <rect x={112} y={26} width={136} height={84} rx={14} fill="#A9E4FF" />
          <path d="M112,82 Q160,62 200,76 Q228,68 248,74 L248,96 Q248,110 234,110 L126,110 Q112,110 112,96 Z" fill="#8EDB8A" />
          {row(n, 184, 30).map((x, i) => (
            <g key={i} transform={`translate(${x} ${96 - (i % 2) * 6}) scale(1.25)`}>
              <path d="M-6,0 l0,6 M6,0 l0,6" stroke={INK} strokeWidth={2} />
              <rect x={-10} y={-8} width={20} height={10} rx={4} fill="#fff" stroke={INK} strokeWidth={1.8} />
              <circle cx={-3} cy={-4} r={2.4} fill={INK} />
              <circle cx={5} cy={-2} r={1.8} fill={INK} />
              <rect x={-17} y={-12} width={9} height={8} rx={3} fill="#fff" stroke={INK} strokeWidth={1.8} />
              <rect x={-16} y={-7} width={6} height={3} rx={1.5} fill="#FFA5CD" />
            </g>
          ))}
          <rect x={112} y={26} width={136} height={84} rx={14} fill="none" {...ST} />
          <rect x={146} y={124} width={68} height={58} rx={6} fill={c} {...ST} />
          <path d="M146,144 l68,0 M146,162 l68,0" stroke={INK} strokeWidth={2} opacity={0.5} />
          <rect x={214} y={118} width={4} height={30} fill={INK} />
          {[156, 172, 188, 204].map((x, i) => (
            <rect key={x} x={x - 5} y={112} width={10} height={12} rx={2} fill={i % 2 ? "#FFF6E5" : "#fff"} stroke={INK} strokeWidth={1.8} />
          ))}
          <circle cx={156} cy={186} r={5} fill={INK} />
          <circle cx={204} cy={186} r={5} fill={INK} />
        </g>
      );
    case "festival":
      return (
        <g>
          {row(n, 180, 28).map((x, i) => (
            <g key={i}>
              <line x1={x} x2={x} y1={60} y2={92} stroke={INK} strokeWidth={2.4} />
              <polygon points={`${x},60 ${x + 17},66 ${x},72`} fill={BRIGHT[(i + 1) % 7]} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
            </g>
          ))}
          <rect x={104} y={90} width={152} height={84} rx={14} fill={c} {...ST} />
          <rect x={228} y={102} width={22} height={28} rx={5} fill="#CFF1FF" {...ST} strokeWidth={2.4} />
          <rect x={116} y={108} width={98} height={34} rx={4} fill="#2B2440" {...ST} strokeWidth={2.4} />
          <rect x={112} y={140} width={106} height={7} rx={2} fill="#fff" {...ST} strokeWidth={2} />
          <path d="M112,96 L218,96 L218,108 q-6.6,8 -13.25,0 q-6.6,8 -13.25,0 q-6.6,8 -13.25,0 q-6.6,8 -13.25,0 q-6.6,8 -13.25,0 q-6.6,8 -13.25,0 q-6.6,8 -13.25,0 q-6.6,8 -13.25,0 Z" fill="#fff" {...ST} strokeWidth={2.2} />
          {[0, 2, 4, 6].map((k) => <rect key={k} x={112 + k * 13.25} y={97} width={13.25} height={11} fill="#FF4B3E" opacity={0.85} />)}
          <circle cx={140} cy={176} r={12} fill={INK} />
          <circle cx={140} cy={176} r={4.5} fill="#D8D6E8" />
          <circle cx={226} cy={176} r={12} fill={INK} />
          <circle cx={226} cy={176} r={4.5} fill="#D8D6E8" />
        </g>
      );
    case "restaurant":
      return (
        <g>
          <line x1={112} x2={248} y1={22} y2={22} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          {row(n, 180, 30).map((x, i) => (
            <g key={i}>
              <line x1={x} x2={x} y1={22} y2={30} stroke={INK} strokeWidth={2} />
              <rect x={x - 2.5} y={29} width={5} height={20} rx={2} fill="#4A4458" stroke={INK} strokeWidth={1.8} />
              <circle cx={x} cy={62} r={13} fill="#4A4458" {...ST} strokeWidth={2.4} />
              <circle cx={x} cy={62} r={8} fill="#6B6488" />
            </g>
          ))}
          <path d="M164,90 q-6,-6 0,-12 M180,88 q-6,-6 0,-12 M196,90 q-6,-6 0,-12" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
          <rect x={112} y={136} width={136} height={52} rx={6} fill="#B8B5C8" {...ST} />
          <rect x={112} y={132} width={136} height={8} rx={2} fill={INK} />
          <rect x={140} y={154} width={80} height={28} rx={4} fill="#9C98B8" stroke={INK} strokeWidth={2} />
          {[124, 236].map((x) => <circle key={x} cx={x} cy={162} r={4} fill={INK} />)}
          <rect x={132} y={108} width={10} height={8} rx={3} fill={c} {...ST} strokeWidth={2.2} />
          <rect x={218} y={108} width={10} height={8} rx={3} fill={c} {...ST} strokeWidth={2.2} />
          <rect x={140} y={98} width={80} height={36} rx={8} fill={c} {...ST} />
          <ellipse cx={180} cy={98} rx={42} ry={7} fill={c} {...ST} strokeWidth={2.6} />
          <ellipse cx={180} cy={98} rx={42} ry={7} fill={SHADE} />
          <circle cx={180} cy={90} r={4} fill={INK} />
        </g>
      );
  }
}
