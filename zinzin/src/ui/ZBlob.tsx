import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import type { MascotColor, MascotMood } from "@/components/Mascot";
import { POTATO, PUMPKIN, costumeLayers, type ZCostume } from "./costumes";
import { bandaidLayer, rainbowCrownLayer } from "@/components/avatar/AvatarBlob";

/**
 * ZBlob — les « blobs zinzins » de l'app.
 * Blob gélatineux en SVG inline : yeux globuleux de tailles différentes qui
 * louchent, bouche expressive, reflet brillant, corps qui gigote (CSS).
 */

export type ZColor = MascotColor;

export const ZPALETTE: Record<ZColor, { body: string; deep: string; hi: string; ink: string }> = {
  pink:     { body: "#FF3EA5", deep: "#C41F78", hi: "#FF9DD0", ink: "#2A0618" },
  yellow:   { body: "#FFD23F", deep: "#E09A00", hi: "#FFF0A8", ink: "#2A1A00" },
  purple:   { body: "#7A4EE8", deep: "#4C27B8", hi: "#B9A0FF", ink: "#FFFFFF" },
  mint:     { body: "#3DDC97", deep: "#1C9E68", hi: "#A8F5D0", ink: "#06281A" },
  sky:      { body: "#4ECDC4", deep: "#22938C", hi: "#B4F1EC", ink: "#062624" },
  coral:    { body: "#FF6B5B", deep: "#CF3B2C", hi: "#FFC0B8", ink: "#2C0904" },
  lavender: { body: "#A98BFF", deep: "#6E50D8", hi: "#E1D6FF", ink: "#160B33" },
  white:    { body: "#F5F1E8", deep: "#C9BFA8", hi: "#FFFFFF", ink: "#15082E" },
};

export const ZCOLORS: ZColor[] = ["pink", "yellow", "purple", "mint", "sky", "coral"];

const INK = "#1A0B33";
const TONGUE = "#FF7A9C";

// Silhouettes un peu bancales (viewBox 120×120)
const SHAPES = [
  "M60 14 C88 13 108 33 108 62 C108 90 88 106 60 106 C32 106 12 92 12 64 C12 35 32 15 60 14Z",
  "M57 15 C84 11 106 31 108 61 C110 90 90 107 60 107 C30 107 10 94 12 64 C14 37 33 18 57 15Z",
  "M61 12 C85 12 101 35 104 62 C107 92 88 107 60 107 C32 107 13 92 16 62 C19 35 37 12 61 12Z",
  "M60 16 C90 15 110 36 108 64 C106 91 86 106 60 106 C33 106 12 91 12 63 C12 37 30 17 60 16Z",
];

// Directions des pupilles (gauche, droite) en fraction du rayon : ils louchent
const LOOKS: [number, number][][] = [
  [[0.38, 0.22], [-0.32, -0.34]],   // louche vers le centre (comme l'icône)
  [[-0.42, 0.05], [0.4, -0.18]],    // chacun son côté
  [[0.3, -0.38], [0.42, -0.3]],     // en l'air à droite
  [[-0.12, 0.42], [0.38, 0.3]],     // en bas, désaccordés
  [[0.42, 0.0], [0.42, 0.1]],       // regard en coin
];

export interface ZBlobProps {
  size?: number;
  color?: ZColor;
  mood?: MascotMood;
  /** Variation (silhouette, yeux, regard) */
  seed?: number;
  /** Corps qui gigote */
  wobble?: boolean;
  /** Ombre au sol */
  shadow?: boolean;
  /** Durée de base du gigotement (s) */
  speed?: number;
  delay?: number;
  /** Contour épais façon sticker */
  outline?: boolean;
  /** Petite couronne (Premium) */
  crown?: boolean;
  /** Couronne arc-en-ciel (secret du prénom « Zinzin ») : remplace la petite couronne */
  rainbowCrown?: boolean;
  /** Lunettes noires « Le Boss » (secret du prénom « Sofian ») : yeux cachés, la bouche garde l'humeur */
  shades?: boolean;
  /** Pansement sur la joue (secret de la Soirée : dernier 3 jeux classés de suite) */
  bandaid?: boolean;
  /** Déguisement du jeu (voir costumes.tsx) */
  costume?: ZCostume;
  /** Saute quand on le touche (défaut : oui) */
  hop?: boolean;
  /** Couleurs sur mesure (blob doré…) : prioritaires sur `color` */
  palette?: { body: string; deep: string; hi: string; ink: string };
  /** Reflet qui balaie le corps (blob doré) */
  gloss?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Saut squash & stretch (Web Animations, rien si mouvement réduit). */
export function hopEl(el: HTMLElement | null) {
  if (!el || typeof el.animate !== "function") return;
  if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [
      { transform: "translateY(0) scale(1,1)" },
      { transform: "translateY(3%) scale(1.14,0.84)", offset: 0.16 },
      { transform: "translateY(-22%) scale(0.9,1.12)", offset: 0.48 },
      { transform: "translateY(0) scale(1.08,0.92)", offset: 0.78 },
      { transform: "translateY(0) scale(1,1)" },
    ],
    { duration: 560, easing: "ease-out" },
  );
}

/**
 * Les yeux de tous les blobs suivent le doigt : un seul écouteur global pose --zz-lx / --zz-ly
 * (-1…1) sur chaque groupe de pupilles (.zb-follow), qui s'y décale en CSS.
 * Posées sur <html>, ces variables (héritées) forçaient le recalcul du style de TOUTE la page à
 * chaque toucher / glissé (~4 000 éléments) : ici seuls les yeux sont recalculés. Un blob monté
 * ensuite reçoit la position courante dès son montage (ref applyLook), comme avant par héritage.
 */
let lookX: string | null = null;
let lookY: string | null = null;
function applyLook(el: Element | null) {
  if (!el || lookX == null || lookY == null) return;
  const st = (el as SVGElement).style;
  st.setProperty("--zz-lx", lookX);
  st.setProperty("--zz-ly", lookY);
}

export function installLookAtFinger(): () => void {
  if (typeof window === "undefined") return () => {};
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  let raf = 0, x = 0, y = 0;
  const flush = () => {
    raf = 0;
    const nx = x.toFixed(2), ny = y.toFixed(2);
    if (nx === lookX && ny === lookY) return;
    lookX = nx;
    lookY = ny;
    document.querySelectorAll(".zb-follow").forEach(applyLook);
  };
  const on = (e: PointerEvent) => {
    x = Math.max(-1, Math.min(1, (e.clientX / innerWidth) * 2 - 1));
    y = Math.max(-1, Math.min(1, (e.clientY / innerHeight) * 2 - 1));
    if (!raf) raf = requestAnimationFrame(flush);
  };
  addEventListener("pointerdown", on, { passive: true });
  addEventListener("pointermove", on, { passive: true });
  return () => {
    removeEventListener("pointerdown", on);
    removeEventListener("pointermove", on);
    cancelAnimationFrame(raf);
  };
}

/**
 * Animations en pause tant que l'élément est hors écran (carte d'un rail défilé, bas de l'accueil,
 * accueil masqué pendant un jeu…), reprises dès qu'il réapparaît (64 px avant d'entrer).
 * Rien ne change à l'écran : seules les animations invisibles s'arrêtent. Sans ça, l'accueil fait
 * tourner ~300 animations SVG (yeux, pupilles, visage) recalculées et repeintes à chaque image.
 * Un seul observateur partagé ; l'attribut est posé hors React (aucun rendu). CSS : [data-zz-off].
 */
let offscreenIO: IntersectionObserver | null | undefined;
export function pauseWhenOffscreen(el: Element | null): () => void {
  if (!el) return () => {};
  if (offscreenIO === undefined) {
    offscreenIO = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          for (const e of entries) e.target.toggleAttribute("data-zz-off", !e.isIntersecting);
        }, { rootMargin: "64px" })
      : null;
  }
  const io = offscreenIO;
  if (!io) return () => {};
  io.observe(el);
  return () => { io.unobserve(el); el.removeAttribute("data-zz-off"); };
}

export function ZBlob({
  size = 96, color = "pink", mood = "happy", seed = 0, wobble = true, shadow = true,
  speed = 2.6, delay = 0, outline = false, crown = false, rainbowCrown = false, shades = false, bandaid = false, costume, hop = true, palette, gloss = false, className, style,
}: ZBlobProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => pauseWhenOffscreen(ref.current), []);
  const uid = useId().replace(/:/g, "");
  const c = palette ?? (costume === "potato" ? POTATO : costume === "pumpkin" ? PUMPKIN : (ZPALETTE[color] ?? ZPALETTE.pink));
  const s = Math.abs(Math.floor(seed));
  const shape = SHAPES[s % SHAPES.length];
  const look = LOOKS[(s + (mood === "sus" || mood === "shifty" ? 4 : 0)) % LOOKS.length];

  // Un œil plus gros que l'autre, côté qui dépend de la graine
  const bigRight = s % 2 === 0;
  const big = mood === "shocked" || mood === "mindblown" ? 19 : 17;
  const small = mood === "shocked" || mood === "mindblown" ? 15 : 13;
  const L = { x: 42, y: bigRight ? 58 : 54, r: bigRight ? small : big };
  const R = { x: 77, y: bigRight ? 53 : 57, r: bigRight ? big : small };

  const gBody = `zb-b-${uid}`, gShade = `zb-s-${uid}`, clip = `zb-c-${uid}`;

  const eye = (e: { x: number; y: number; r: number }, lk: [number, number], side: 0 | 1): ReactNode => {
    const closedHappy = mood === "laughing" || mood === "rofl" || mood === "kiss" || (mood === "wink" && side === 1);
    if (mood === "asleep" || closedHappy) {
      // Œil fermé : arc ^ (rieur) ou trait (dodo)
      const d = mood === "asleep"
        ? `M${e.x - e.r * 0.8} ${e.y + 2} Q${e.x} ${e.y + e.r * 0.6} ${e.x + e.r * 0.8} ${e.y + 2}`
        : `M${e.x - e.r * 0.8} ${e.y + 3} Q${e.x} ${e.y - e.r * 0.9} ${e.x + e.r * 0.8} ${e.y + 3}`;
      return <path d={d} fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />;
    }
    if (mood === "dead") {
      const k = e.r * 0.6;
      return (
        <g stroke={INK} strokeWidth={4.2} strokeLinecap="round">
          <path d={`M${e.x - k} ${e.y - k} L${e.x + k} ${e.y + k} M${e.x + k} ${e.y - k} L${e.x - k} ${e.y + k}`} />
        </g>
      );
    }
    if (mood === "love") {
      const k = e.r / 13;
      return (
        <g transform={`translate(${e.x} ${e.y + 1}) scale(${k})`}>
          <path
            d="M0 11 C-14 2 -14 -10 -6 -11 C-2 -11.5 0 -8 0 -6 C0 -8 2 -11.5 6 -11 C14 -10 14 2 0 11Z"
            fill="#FF2E7E" stroke={INK} strokeWidth={1.6}
            className="zb-heart"
          />
        </g>
      );
    }
    const px = e.x + lk[0] * e.r * 0.85, py = e.y + lk[1] * e.r * 0.85;
    const pr = e.r * (mood === "shocked" ? 0.42 : 0.56);
    return (
      <g className="zb-blink" style={{ animationDelay: `${(s % 5) * 0.7 + side * 0.08}s` }}>
        <ellipse cx={e.x} cy={e.y + 2.2} rx={e.r} ry={e.r} fill={c.deep} opacity={0.55} />
        <circle cx={e.x} cy={e.y} r={e.r} fill="#fff" />
        <g className="zb-follow" ref={applyLook}><g className={side ? "zb-pupil-b" : "zb-pupil-a"} style={{ animationDelay: `${-(s % 7) * 0.9}s` }}>
          {mood === "mindblown" ? (
            <path
              transform={`translate(${px} ${py}) scale(${pr / 10})`}
              d="M0 -11 L3 -3.5 L11 -3.4 L4.7 1.6 L6.9 9.4 L0 4.8 L-6.9 9.4 L-4.7 1.6 L-11 -3.4 L-3 -3.5Z"
              fill={INK}
            />
          ) : (
            <>
              <circle cx={px} cy={py} r={pr} fill={INK} />
              <circle cx={px + pr * 0.38} cy={py - pr * 0.4} r={pr * 0.3} fill="#fff" />
            </>
          )}
        </g></g>
        {/* Paupière mi-close (soupçon) */}
        {(mood === "sus" || (mood === "cool" && side === 0)) && (
          <path d={`M${e.x - e.r - 1} ${e.y - 1} A${e.r + 1} ${e.r + 1} 0 0 1 ${e.x + e.r + 1} ${e.y - 1}Z`} fill={c.body} stroke={c.deep} strokeWidth={1.5} />
        )}
      </g>
    );
  };

  const brows = (): ReactNode => {
    const angry = mood === "angry" || mood === "fire";
    const think = mood === "thinking";
    const sus = mood === "sus";
    if (!angry && !think && !sus) return null;
    const lb = angry ? 14 : think ? -10 : -6;
    const rb = angry ? -14 : think ? 4 : 10;
    return (
      <g stroke={INK} strokeWidth={4} strokeLinecap="round">
        <path transform={`rotate(${lb} ${L.x} ${L.y - L.r - 6})`} d={`M${L.x - 8} ${L.y - L.r - 6 - (think ? 4 : 0)} H${L.x + 8}`} />
        <path transform={`rotate(${rb} ${R.x} ${R.y - R.r - 6})`} d={`M${R.x - 8} ${R.y - R.r - 6} H${R.x + 8}`} />
      </g>
    );
  };

  const mouth = (): ReactNode => {
    const mx = 60, my = 80;
    switch (mood) {
      case "shocked":
      case "mindblown":
        return <ellipse cx={mx} cy={my + 6} rx={6.5} ry={8.5} fill={INK} />;
      case "laughing":
      case "rofl":
      case "fire":
      case "happy":
      case "wink": {
        const w = mood === "laughing" || mood === "rofl" ? 17 : 13;
        const h = mood === "laughing" || mood === "rofl" ? 20 : 16;
        const d = `M${mx - w} ${my - 4} H${mx + w} C${mx + w} ${my + h * 0.7} ${mx + w * 0.5} ${my + h} ${mx} ${my + h} C${mx - w * 0.5} ${my + h} ${mx - w} ${my + h * 0.7} ${mx - w} ${my - 4}Z`;
        return (
          <g className="zb-mouth">
            <clipPath id={`${clip}-m`}><path d={d} /></clipPath>
            <path d={d} fill={INK} />
            <g clipPath={`url(#${clip}-m)`}>
              {(mood === "laughing" || mood === "rofl") && <rect x={mx - w} y={my - 4} width={w * 2} height={4.5} fill="#fff" />}
              <ellipse cx={mx + (mood === "wink" ? 3 : 0)} cy={my + h - 1} rx={w * 0.62} ry={h * 0.38} fill={TONGUE} />
            </g>
          </g>
        );
      }
      case "love":
        return <path d={`M${mx - 9} ${my} Q${mx} ${my + 9} ${mx + 9} ${my}`} fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />;
      case "kiss":
        return (
          <g transform={`translate(${mx + 2} ${my + 3})`}>
            <path d="M-2 -8 Q7 -6 2 -1 Q8 3 -2 7" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case "sad":
      case "angry":
        return <path d={`M${mx - 10} ${my + 8} Q${mx} ${my - 2} ${mx + 10} ${my + 8}`} fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />;
      case "thinking":
        return <path d={`M${mx - 6} ${my + 4} Q${mx + 4} ${my} ${mx + 12} ${my + 3}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
      case "dead":
        return <path d={`M${mx - 12} ${my + 4} q3 -5 6 0 t6 0 t6 0 t6 0`} fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />;
      case "asleep":
        return <ellipse cx={mx} cy={my + 4} rx={4} ry={5} fill={INK} />;
      case "cool":
        return <path d={`M${mx - 8} ${my + 4} Q${mx + 2} ${my + 10} ${mx + 12} ${my + 1}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
      case "sus":
      case "shifty":
      case "neutral":
      default:
        return <path d={`M${mx - 8} ${my + 5} L${mx + 9} ${my + 2}`} fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" />;
    }
  };

  const cos = costumeLayers(costume, { c, L, R, clip });
  // Lunettes noires (humeur « cool » ou costume d'espion) : yeux cachés
  // « Le Boss » : pas par-dessus un accessoire de costume sur le visage (bandeau, espion…)
  const boss = shades && !cos.face;
  const hideEyes = mood === "cool" || boss || costume === "spy" || costume === "blindfold";
  const blush = mood === "love" || mood === "kiss" || mood === "happy" || mood === "laughing" || mood === "wink";

  return (
    <div
      className={["zb", wobble ? "zb-wob" : "", mood === "rofl" ? "zb-rofl" : "", className ?? ""].join(" ")}
      style={{ width: size, height: size, ["--zb-d" as string]: `${speed + (s % 3) * 0.35}s`, animationDelay: `${-delay - (s % 4) * 0.4}s`, ...style }}
      aria-hidden
      ref={ref}
      onPointerDown={hop ? () => hopEl(ref.current) : undefined}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ overflow: "visible", display: "block" }}>
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
          <clipPath id={clip}><path d={shape} /></clipPath>
        </defs>

        {shadow && <ellipse cx={60} cy={113} rx={38} ry={5} fill="#000" opacity={0.32} />}

        {/* Corps : bord inférieur foncé + dégradé + ombrage + reflets */}
        {cos.back}
        {outline && <path d={shape} transform="translate(0 4)" fill={INK} stroke={INK} strokeWidth={Math.max(5, 360 / size)} strokeLinejoin="round" />}
        <path d={shape} transform="translate(0 4)" fill={c.deep} />
        <path d={shape} fill={`url(#${gBody})`} />
        <path d={shape} fill={`url(#${gShade})`} />
        {cos.skin}
        {outline && <path d={shape} fill="none" stroke={INK} strokeWidth={Math.max(3.4, 300 / size)} strokeLinejoin="round" />}
        <g clipPath={`url(#${clip})`}>
          <ellipse cx={37} cy={30} rx={14} ry={8.5} transform="rotate(-24 37 30)" fill="#fff" opacity={0.5} />
          <circle cx={55} cy={22} r={2.6} fill="#fff" opacity={0.6} />
          {gloss && <rect className="zb-gloss" x={-30} y={-20} width={18} height={160} fill="#fff" opacity={0.55} />}
        </g>

        {/* Visage (léger décalage gélatineux) */}
        <g className={wobble ? "zb-face" : undefined}>
          {blush && (
            <g fill="#FF4F8B" opacity={color === "pink" ? 0.0 : 0.32}>
              <ellipse cx={30} cy={77} rx={7} ry={4} />
              <ellipse cx={91} cy={74} rx={7} ry={4} />
            </g>
          )}
          {/* Lunettes de soleil : les yeux sont cachés (sinon ils débordent des verres) */}
          {/* data-eyes / data-eyes-top : repères des yeux en spirale (spiral-eyes.ts), sans effet visuel */}
          <g data-eyes="">
            {!hideEyes && eye(L, look[0], 0)}
            {!hideEyes && eye(R, look[1], 1)}
          </g>
          {brows()}
          {(mood === "cool" || boss) && (
            <g>
              <path d={`M${L.x - 15} ${L.y - 6} H${R.x + 17}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
              <path d={`M${L.x - 15} ${L.y - 7} H${L.x + 14} V${L.y + 2} C${L.x + 14} ${L.y + 12} ${L.x - 15} ${L.y + 12} ${L.x - 15} ${L.y + 2}Z`} fill={INK} />
              <path d={`M${R.x - 15} ${L.y - 7} H${R.x + 17} V${L.y + 2} C${R.x + 17} ${L.y + 12} ${R.x - 15} ${L.y + 12} ${R.x - 15} ${L.y + 2}Z`} fill={INK} />
              <path d={`M${L.x - 8} ${L.y - 2} l6 0`} stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
              <path d={`M${R.x - 8} ${L.y - 2} l6 0`} stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
            </g>
          )}
          {mouth()}
          {cos.face}
          {bandaid && bandaidLayer(96, 83)}
          {/* Yeux cachés (lunettes, bandeau…) : spirales posées sur les verres */}
          <g data-eyes-top={hideEyes ? `${L.x - 0.5} ${L.y + 2.5} 9 ${R.x + 1} ${L.y + 2.5} 9 lens` : `${L.x} ${L.y} ${L.r} ${R.x} ${R.y} ${R.r}`} />
        </g>
        {cos.top}

        {/* Accessoires d'humeur */}
        {rainbowCrown && !cos.top && rainbowCrownLayer(clip, 2, wobble)}
        {crown && !rainbowCrown && (
          <g transform="translate(60 14) rotate(-8)">
            <path d="M-20 4 L-24 -16 L-11 -6 L0 -22 L11 -6 L24 -16 L20 4Z" fill="#FFD23F" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
            <circle cx={0} cy={-6} r={3.2} fill="#FF3EA5" stroke={INK} strokeWidth={1.6} />
          </g>
        )}
        {mood === "fire" && (
          <path className="zb-flame" d="M60 -6 C66 4 74 8 72 18 C70 25 64 26 60 26 C55 26 48 24 48 16 C48 10 53 8 54 2 C57 6 58 9 58 12 C61 8 61 2 60 -6Z" fill="#FFB020" stroke="#FF5A2E" strokeWidth={2.4} strokeLinejoin="round" />
        )}
        {(mood === "shocked" || mood === "sad") && (
          <path className="zb-drop" d="M102 30 C106 37 108 41 108 44 A6 6 0 0 1 96 44 C96 41 98 37 102 30Z" fill="#8FE3FF" stroke="#2A9CC4" strokeWidth={1.5} />
        )}
        {mood === "asleep" && (
          <text x={98} y={22} fontSize={20} fontWeight={700} fill="#fff" opacity={0.85} className="zb-zz" style={{ fontFamily: "var(--font-display)" }}>z</text>
        )}
        {mood === "rofl" && (
          <g fill="#8FE3FF" stroke="#2A9CC4" strokeWidth={1.2}>
            <path d="M20 54 c-4 6 -5 9 -2 11 c3 2 6 -1 4 -5Z" />
            <path d="M101 50 c4 6 5 9 2 11 c-3 2 -6 -1 -4 -5Z" />
          </g>
        )}
      </svg>
    </div>
  );
}
