import type { ReactNode } from "react";

/**
 * Déguisements des blobs : chaque jeu a son costume (SVG inline, repère 120×120
 * du ZBlob). Dessinés dans le SVG du blob → ils gigotent avec lui.
 * Couches : `back` (derrière le corps), `skin` (sur le corps, découpé à sa forme),
 * `face` (avec le visage), `top` (par-dessus tout : chapeaux, accessoires).
 */
export type ZCostume =
  | "wolf" | "groucho" | "pinocchio" | "ten" | "stopwatch" | "potato" | "fuse"
  | "spy" | "angeldevil" | "antenna" | "mime" | "card" | "hourglass" | "split"
  | "duo" | "hearts" | "beer" | "train";

/** Palette « pomme de terre » (le costume patate recolore le blob). */
export const POTATO = { body: "#D9A066", deep: "#A8692F", hi: "#F4D3A0", ink: "#2A1A00" };

const INK = "#1A0B33";
const SW = 3.2; // épaisseur des contours

interface Ctx {
  c: { body: string; deep: string; hi: string };
  L: { x: number; y: number; r: number };
  R: { x: number; y: number; r: number };
  clip: string;
}

export interface CostumeLayers { back?: ReactNode; skin?: ReactNode; face?: ReactNode; top?: ReactNode }

const heart = (x: number, y: number, k: number, fill = "#FF2E7E", cls?: string) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <path className={cls} d="M0 11 C-14 2 -14 -10 -6 -11 C-2 -11.5 0 -8 0 -6 C0 -8 2 -11.5 6 -11 C14 -10 14 2 0 11Z" fill={fill} stroke={INK} strokeWidth={SW / k} strokeLinejoin="round" />
  </g>
);

const shades = (L: Ctx["L"], R: Ctx["R"]) => (
  <g>
    <path d={`M${L.x - 16} ${Math.min(L.y, R.y) - 8} H${R.x + 18}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <path d={`M${L.x - 15} ${L.y - 9} H${L.x + 14} V${L.y + 2} C${L.x + 14} ${L.y + 12} ${L.x - 15} ${L.y + 12} ${L.x - 15} ${L.y + 2}Z`} fill={INK} />
    <path d={`M${R.x - 15} ${R.y - 9} H${R.x + 17} V${R.y + 2} C${R.x + 17} ${R.y + 13} ${R.x - 15} ${R.y + 13} ${R.x - 15} ${R.y + 2}Z`} fill={INK} />
    <path d={`M${L.x - 9} ${L.y - 4} l7 0`} stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.75} />
    <path d={`M${R.x - 9} ${R.y - 4} l7 0`} stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.75} />
  </g>
);

export function costumeLayers(kind: ZCostume | undefined, ctx: Ctx): CostumeLayers {
  if (!kind) return {};
  const { c, L, R, clip } = ctx;
  const clipped = (n: ReactNode) => <g clipPath={`url(#${clip})`}>{n}</g>;

  switch (kind) {
    // Loup-Garou : pleine lune, oreilles pointues, touffe, truffe et crocs
    case "wolf":
      return {
        back: (
          <g>
            <circle cx={20} cy={20} r={17} fill="#FFF1A6" stroke={INK} strokeWidth={SW} />
            <circle cx={14} cy={16} r={3.5} fill="#F2D36B" />
            <circle cx={25} cy={26} r={2.5} fill="#F2D36B" />
            <path d="M20 46 L22 -2 L52 20Z" fill={c.deep} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M27 34 L28 10 L44 22Z" fill={c.hi} />
            <path d="M100 46 L98 -2 L68 20Z" fill={c.deep} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M93 34 L92 10 L76 22Z" fill={c.hi} />
          </g>
        ),
        top: <path d="M46 18 L50 4 L56 13 L61 0 L66 13 L72 5 L74 18" fill={c.deep} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />,
        face: (
          <g>
            <path d="M47 82 L51 93 L55 82Z" fill="#fff" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
            <path d="M65 82 L69 93 L73 82Z" fill="#fff" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
            <ellipse cx={60} cy={71} rx={8} ry={5.5} fill={INK} />
            <ellipse cx={57.5} cy={69.5} rx={2.6} ry={1.6} fill="#fff" opacity={0.7} />
          </g>
        ),
      };

    // L'Intrus : déguisement d'espion raté (lunettes-nez-moustache)
    case "groucho":
      return {
        face: (
          <g>
            <circle cx={L.x} cy={L.y} r={L.r + 3} fill="none" stroke={INK} strokeWidth={4} />
            <circle cx={R.x} cy={R.y} r={R.r + 3} fill="none" stroke={INK} strokeWidth={4} />
            <path d={`M${L.x + L.r + 2} ${L.y - 2} Q60 ${Math.min(L.y, R.y) - 8} ${R.x - R.r - 2} ${R.y - 2}`} fill="none" stroke={INK} strokeWidth={4} />
            <path d={`M${L.x - 13} ${L.y - L.r - 8} Q${L.x} ${L.y - L.r - 17} ${L.x + 13} ${L.y - L.r - 7}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
            <path d={`M${R.x - 13} ${R.y - R.r - 7} Q${R.x} ${R.y - R.r - 17} ${R.x + 13} ${R.y - R.r - 8}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
            <path d="M34 84 Q42 72 60 78 Q78 72 86 84 Q76 82 70 86 Q64 82 60 84 Q56 82 50 86 Q44 82 34 84Z" fill={INK} />
            <ellipse cx={60} cy={70} rx={10} ry={9} fill="#FFB49A" stroke={INK} strokeWidth={SW} />
            <ellipse cx={57} cy={67} rx={3} ry={2} fill="#fff" opacity={0.7} />
          </g>
        ),
      };

    // Le Bluffeur : nez de Pinocchio qui s'allonge
    case "pinocchio":
      return {
        face: (
          <g className="zc-nose">
            {/* Nez en bois conique : base ronde, pointe arrondie, veines du bois, petite feuille */}
            <path d="M54 62 C70 63 96 66 112 69 C117 70 118 75 113 76 C96 79 70 82 54 82 C47 81 47 63 54 62Z"
                  fill="#E8A86A" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M58 76 C74 76 96 74 110 73" fill="none" stroke="#B9733A" strokeWidth={2.4} strokeLinecap="round" />
            <path d="M60 67 C76 67 94 68 106 70" fill="none" stroke="#FFE2BF" strokeWidth={2.6} strokeLinecap="round" opacity={0.85} />
            <ellipse cx={55} cy={72} rx={8} ry={10} fill="#F0B57C" stroke={INK} strokeWidth={SW} />
            <ellipse cx={53} cy={68.5} rx={3} ry={2.2} fill="#fff" opacity={0.7} />
            <path d="M88 67 C90 58 98 55 103 57 C100 62 95 66 88 67Z" fill="#3DDC97" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
          </g>
        ),
      };

    // De 1 à 10 : bandeau avec un gros 10
    case "ten":
      return {
        skin: clipped(<path d="M8 38 Q60 22 112 38 L112 48 Q60 32 8 48Z" fill="#fff" stroke={INK} strokeWidth={SW} />),
        top: (
          <g transform="rotate(-8 60 26)">
            <rect x={39} y={12} width={42} height={28} rx={9} fill="#FFD23F" stroke={INK} strokeWidth={SW} />
            <text x={60} y={34} textAnchor="middle" fontSize={22} fontWeight={800} fill={INK} style={{ fontFamily: "var(--font-display), system-ui, sans-serif", letterSpacing: "-1px" }}>10</text>
          </g>
        ),
      };

    // Pile Poil : chronomètre posé sur la tête
    case "stopwatch":
      return {
        top: (
          <g transform="rotate(10 60 8)">
            <rect x={55} y={-18} width={10} height={8} rx={2} fill={INK} />
            <rect x={74} y={-10} width={7} height={6} rx={2} fill={INK} transform="rotate(40 77 -7)" />
            <circle cx={60} cy={6} r={17} fill="#fff" stroke={INK} strokeWidth={SW} />
            <circle cx={60} cy={6} r={12} fill="none" stroke="#FF3EA5" strokeWidth={2} strokeDasharray="2 4.3" />
            <g className="zc-tick" style={{ transformOrigin: "60px 6px" }}>
              <path d="M60 6 L60 -6" stroke={INK} strokeWidth={3} strokeLinecap="round" />
            </g>
            <circle cx={60} cy={6} r={2.6} fill={INK} />
          </g>
        ),
      };

    // La Patate : blob-pomme de terre (germes, taches) qui transpire
    case "potato":
      return {
        skin: clipped(
          <g fill={POTATO.deep} opacity={0.55}>
            <ellipse cx={26} cy={44} rx={3.2} ry={2.4} />
            <ellipse cx={92} cy={40} rx={2.6} ry={2} />
            <ellipse cx={86} cy={92} rx={3.4} ry={2.4} />
            <ellipse cx={30} cy={88} rx={2.4} ry={1.8} />
            <ellipse cx={58} cy={100} rx={2.2} ry={1.6} />
          </g>,
        ),
        top: (
          <g>
            <path d="M54 16 C52 6 44 2 36 4 C42 8 46 12 54 16Z" fill="#7BD35A" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M62 15 C64 4 72 0 80 1 C74 6 70 10 62 15Z" fill="#7BD35A" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path className="zb-drop" d="M16 30 C20 37 22 41 22 44 A6 6 0 0 1 10 44 C10 41 12 37 16 30Z" fill="#8FE3FF" stroke="#2A9CC4" strokeWidth={1.6} />
            <path className="zb-drop" style={{ animationDelay: "-1.1s" }} d="M104 54 C107 59 108 62 108 64 A4.5 4.5 0 0 1 99 64 C99 62 101 59 104 54Z" fill="#8FE3FF" stroke="#2A9CC4" strokeWidth={1.4} />
          </g>
        ),
      };

    // Lâche pas ! : mèche de bombe allumée
    case "fuse":
      return {
        top: (
          <g>
            <rect x={51} y={8} width={18} height={10} rx={3} fill="#4A4560" stroke={INK} strokeWidth={SW} />
            <path d="M60 8 C60 -2 70 -6 76 -12" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
            <path d="M60 8 C60 -2 70 -6 76 -12" fill="none" stroke="#C9935A" strokeWidth={3.6} strokeLinecap="round" />
            <g className="zb-flame" style={{ transformOrigin: "78px -14px" }}>
              <path d="M78 -28 L81 -18 L91 -17 L83 -11 L86 -1 L78 -7 L70 -1 L73 -11 L65 -17 L75 -18Z" fill="#FFD23F" stroke="#FF5A2E" strokeWidth={2.2} strokeLinejoin="round" />
            </g>
          </g>
        ),
      };

    // Mots Espions : chapeau d'espion + lunettes noires
    case "spy":
      return {
        face: shades(L, R),
        top: (
          <g transform="rotate(-6 60 18)">
            <path d="M34 22 Q34 -2 60 -1 Q86 -2 86 22Z" fill="#33304A" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M48 2 Q60 8 72 2" fill="none" stroke={INK} strokeWidth={2.4} />
            <rect x={35} y={13} width={50} height={7} fill="#FF3EA5" stroke={INK} strokeWidth={2.4} />
            <ellipse cx={60} cy={22} rx={42} ry={7} fill="#33304A" stroke={INK} strokeWidth={SW} />
          </g>
        ),
      };

    // Test de pureté : moitié auréole d'ange, moitié corne de diable
    case "angeldevil":
      return {
        top: (
          <g>
            <ellipse cx={40} cy={2} rx={19} ry={6} fill="none" stroke={INK} strokeWidth={8} />
            <ellipse cx={40} cy={2} rx={19} ry={6} fill="none" stroke="#FFD23F" strokeWidth={4} />
            <path d="M78 22 Q98 14 96 -6 Q88 8 72 14Z" fill="#E0245E" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M92 0 Q92 8 84 13" fill="none" stroke="#FF8FB1" strokeWidth={2} strokeLinecap="round" />
          </g>
        ),
      };

    // Le Curseur : antenne qui capte les ondes
    case "antenna":
      return {
        top: (
          <g>
            <path d="M60 16 L60 -6" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <circle cx={60} cy={-10} r={6} fill="#FF3EA5" stroke={INK} strokeWidth={SW} />
            <g fill="none" stroke="#FFD23F" strokeWidth={3.4} strokeLinecap="round">
              <path className="zc-wave" d="M48 -20 Q44 -10 48 0" />
              <path className="zc-wave" d="M72 -20 Q76 -10 72 0" />
              <path className="zc-wave zc-wave-2" d="M40 -26 Q33 -10 40 6" />
              <path className="zc-wave zc-wave-2" d="M80 -26 Q87 -10 80 6" />
            </g>
          </g>
        ),
      };

    // Fais Deviner : béret de mime + marinière
    case "mime":
      return {
        skin: clipped(
          <g>
            <rect x={0} y={88} width={120} height={32} fill="#fff" />
            <rect x={0} y={92} width={120} height={5} fill="#1B2A6B" />
            <rect x={0} y={101} width={120} height={5} fill="#1B2A6B" />
            <path d="M0 88 Q60 94 120 88" fill="none" stroke={INK} strokeWidth={SW} />
          </g>,
        ),
        top: (
          <g transform="rotate(-12 60 14)">
            <path d="M28 20 Q30 -2 62 0 Q94 2 90 18 Q60 26 28 20Z" fill="#26213A" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M60 0 L61 -7" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          </g>
        ),
      };

    // Deviner le Mot : carte collée sur le front
    case "card":
      return {
        top: (
          <g transform="rotate(-7 60 22)">
            <rect x={40} y={4} width={40} height={32} rx={6} fill="#fff" stroke={INK} strokeWidth={SW} />
            <text x={60} y={30} textAnchor="middle" fontSize={24} fontWeight={800} fill="#FF3EA5" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>?</text>
            <rect x={53} y={-1} width={14} height={7} fill="#FFE58A" opacity={0.9} transform="rotate(8 60 2)" />
          </g>
        ),
      };

    // Catégorie Chrono : sablier sur la tête
    case "hourglass":
      return {
        top: (
          <g transform="translate(60 4) scale(1.45) translate(-60 -4) rotate(12 60 0)">
            <path d="M50 -12 L70 -12 L62 1 L70 14 L50 14 L58 1Z" fill="#DFF6FF" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <path d="M53 -9 L67 -9 L61 -2 L59 -2Z" fill="#FFD23F" />
            <path d="M53 14 L67 14 L60 7Z" fill="#FFD23F" />
            <rect x={46} y={-17} width={28} height={6} rx={2} fill="#C77B3A" stroke={INK} strokeWidth={2.6} />
            <rect x={46} y={13} width={28} height={6} rx={2} fill="#C77B3A" stroke={INK} strokeWidth={2.6} />
          </g>
        ),
      };

    // Tu préfères ? : blob coupé en deux couleurs, gros « ? »
    case "split":
      return {
        skin: clipped(
          <g>
            <path d="M60 0 L66 30 L56 60 L66 90 L60 120 L120 120 L120 0Z" fill="#FF3EA5" />
            <path d="M60 0 L66 30 L56 60 L66 90 L60 120" fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          </g>,
        ),
        top: (
          <text x={60} y={14} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff" stroke={INK} strokeWidth={3.4} paintOrder="stroke" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>?</text>
        ),
      };

    // Pensez Pareil : un mini-blob collé + un cœur
    case "duo":
      return {
        top: (
          <g>
            <circle cx={102} cy={88} r={18} fill="#FF9DD0" stroke={INK} strokeWidth={SW} />
            <circle cx={96} cy={84} r={2.8} fill={INK} />
            <circle cx={108} cy={84} r={2.8} fill={INK} />
            <path d="M96 92 Q102 97 108 92" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
            {heart(102, 22, 0.9, "#FF2E7E", "zb-heart")}
          </g>
        ),
      };

    // Tu me connais ? : couronne de cœurs
    case "hearts":
      return {
        top: (
          <g>
            {heart(30, 22, 0.62)}
            {heart(44, 9, 0.7)}
            {heart(60, 3, 0.85, "#FF2E7E", "zb-heart")}
            {heart(76, 9, 0.7)}
            {heart(90, 22, 0.62)}
          </g>
        ),
      };

    // La Tournée : chapeau de mousse
    case "beer":
      return {
        top: (
          <g>
            <path d="M24 30 Q16 18 30 12 Q32 0 48 2 Q56 -8 70 0 Q86 -4 90 10 Q104 14 96 30 Q92 36 84 32 Q82 40 76 34 Q60 38 44 34 Q36 40 32 32 Q26 36 24 30Z" fill="#FFFDF5" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <circle cx={44} cy={14} r={3} fill="none" stroke={INK} strokeWidth={1.6} opacity={0.5} />
            <circle cx={72} cy={10} r={2.2} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.5} />
            <circle cx={60} cy={20} r={2.6} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.5} />
          </g>
        ),
      };

    // TGV : casquette de conducteur de train
    case "train":
      return {
        top: (
          <g transform="rotate(-5 60 20)">
            <path d="M32 24 Q32 -2 60 -2 Q88 -2 88 24Z" fill="#23357E" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <rect x={33} y={14} width={54} height={8} fill="#FF3852" stroke={INK} strokeWidth={2.4} />
            <circle cx={60} cy={8} r={5} fill="#FFD23F" stroke={INK} strokeWidth={2.2} />
            <path d="M30 24 Q60 32 98 22 Q102 30 92 32 Q60 38 28 30Z" fill={INK} />
          </g>
        ),
      };
  }
}
