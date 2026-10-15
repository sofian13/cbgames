"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { MascotColor, MascotMood } from "@/components/Mascot";
import { useUnlocked } from "@/lib/entitlements";
import { AVATAR_PALETTE, defaultLookFor, freeLook, lookSideOverflow, type AvatarLook } from "@/lib/avatar/look";
import { getBand, getPlayerLook, subscribePlayers, type BandEntry } from "@/lib/saved-players";
import { colorForIndexSafe } from "./colors";
import { AvatarBlob, type AvatarCostumeLayers } from "./AvatarBlob";
import { isZinzinName } from "@/lib/avatar/secrets";
import { playPersoVoice, talkMood, usePersoVoice, useSpeaking, voiceKey } from "@/lib/avatar/voice";
import { VoiceBadge, hopEl } from "./VoiceUI";

/**
 * Voix d'un perso dans un jeu : bouche animée quand il parle, petit saut,
 * et (optionnel) lecture automatique une fois au montage (tour du joueur, gagnant).
 */
export function usePersoTalk(name: string | null | undefined, { auto = false, delay = 450 }: { auto?: boolean; delay?: number } = {}) {
  const level = useSpeaking(name ? voiceKey(name) : null);
  const talking = level !== null;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (talking) hopEl(ref.current); }, [talking]);
  // Une seule fois par montage / changement de joueur (jamais en boucle)
  useEffect(() => {
    if (!auto || !name) return;
    const id = setTimeout(() => void playPersoVoice(name, { auto: true }), delay);
    return () => clearTimeout(id);
  }, [auto, name, delay]);
  return { ref, mood: talking ? talkMood(level) : null, talking };
}

/**
 * Le blob d'un joueur, partout dans les jeux : son perso personnalisé s'il en a
 * un (« Ma bande »), sinon un perso de base dans la couleur de son rang (même style).
 * Sans Zinzin+ (app), les éléments Zinzin+ sont remplacés par l'équivalent gratuit.
 */

/** Look brut enregistré pour ce prénom (réactif), ou null. */
export function useStoredLook(name?: string | null): AvatarLook | null {
  return useSyncExternalStore(
    subscribePlayers,
    () => (name ? getPlayerLook(name) : null),
    () => null,
  );
}

/** Look à afficher en jeu pour ce prénom (filtré selon l'abonnement), ou null. */
export function usePlayerLook(name?: string | null): AvatarLook | null {
  const look = useStoredLook(name);
  const unlocked = useUnlocked();
  return look && !unlocked ? freeLook(look) : look;
}

let bandCacheKey = "";
let bandCache: BandEntry[] = [];
function bandSnapshot(): BandEntry[] {
  const b = getBand();
  const key = JSON.stringify(b);
  if (key !== bandCacheKey) { bandCacheKey = key; bandCache = b; }
  return bandCache;
}

/** « Ma bande » (réactif). */
export function useBand(): BandEntry[] {
  return useSyncExternalStore(subscribePlayers, bandSnapshot, () => bandCache);
}

/** Couronne du gagnant sur un perso (repère 120×120), posée à la place du chapeau
 *  (au-dessus de l'arceau s'il porte un casque audio). */
const crownAt = (y: number): AvatarCostumeLayers => ({
  top: (
    <g transform={`translate(60 ${y}) rotate(-8)`}>
      <path d="M-20 4 L-24 -16 L-11 -6 L0 -22 L11 -6 L24 -16 L20 4Z" fill="#FFD23F" stroke="#15082E" strokeWidth={3.4} strokeLinejoin="round" />
      <circle cx={0} cy={-6} r={3.2} fill="#FF3EA5" stroke="#15082E" strokeWidth={1.6} />
    </g>
  ),
});
const CROWN = crownAt(12);
const CROWN_HIGH = crownAt(-3);
const crownCostume = () => CROWN;
const crownHighCostume = () => CROWN_HIGH;

export function PlayerBlob({
  name, colorIndex = 0, color, size = 56, mood = "happy", bob, shadow = false, delay, animate = true, style, className, talk = false, autoTalk = false,
  crown = false, cheering = false, sweat, sparkle, blink, headroom = false, fit, fallbackLook,
}: {
  name?: string | null;
  colorIndex?: number;
  size?: number;
  mood?: MascotMood;
  /** Ancien bras du blob par défaut : sans effet (les persos n'ont pas de bras), gardé pour l'API */
  arms?: boolean;
  bob?: boolean;
  shadow?: boolean;
  delay?: number;
  animate?: boolean;
  style?: CSSProperties;
  className?: string;
  /** Toucher le blob = il dit son son (+ pastille discrète s'il en a un) */
  talk?: boolean;
  /** Dit son son une fois à l'apparition (réglage « Voix des persos en jeu ») */
  autoTalk?: boolean;
  /** Couleur forcée du perso de base (sinon : couleur du rang colorIndex) */
  color?: MascotColor;
  /** Couronne du gagnant */
  crown?: boolean;
  /** Saute de joie */
  cheering?: boolean;
  /** Goutte de sueur (stress) */
  sweat?: boolean;
  /** Petites étoiles autour (pureté…) */
  sparkle?: boolean;
  /** false = ne cligne pas (et reste immobile si bob={false}) */
  blink?: boolean;
  /**
   * Réserve de la place au-dessus (cheveux, chapeau) quand un texte est juste au-dessus.
   * true = marge fixe (20 % de la taille) ; "auto" = juste ce qui dépasse vraiment (mesuré : coupe haute, chapeau, casque…).
   */
  headroom?: boolean | "auto";
  /**
   * Rangée serrée : le perso est un peu réduit si une coupe large (couettes…) déborderait sur les
   * côtés de sa case (sinon elle cache le début du prénom voisin). Défaut : oui jusqu’à 48 px.
   */
  fit?: boolean;
  /** Joueur sans perso seulement : éléments ajoutés à son perso de base (ex. lunettes d'espion) */
  fallbackLook?: Partial<AvatarLook>;
}) {
  const stored = usePlayerLook(name);
  // Sans perso « Ma bande » : perso de base dans la couleur de son rang (ses yeux suivent l'humeur)
  const baseColor = color ?? colorForIndexSafe(colorIndex);
  const fbKey = fallbackLook ? JSON.stringify(fallbackLook) : "";
  const look = useMemo(
    () => stored ?? { ...defaultLookFor(baseColor, mood), ...(fbKey ? (JSON.parse(fbKey) as Partial<AvatarLook>) : {}) },
    [stored, baseColor, mood, fbKey],
  );
  const art = useRef<HTMLDivElement>(null);
  const [overTop, setOverTop] = useState(0);
  const lookKey = JSON.stringify(look);
  // Coupe large dans une petite case : réduit pour ne pas déborder sur les côtés
  const doFit = fit ?? size <= 48;
  const side = doFit ? lookSideOverflow(look) : 0;
  // Demi-largeur visible (repère 120) du perso nu = 50,5 ; la case en laisse ≈ 52 (+ un peu de marge tolérée)
  const shrink = side > 0 ? Math.min(1, Math.max(0.72, 58 / (50.5 + side))) : 1;
  // « auto » : on mesure le haut réel du dessin (il déborde de son repère) avant l'affichage
  useLayoutEffect(() => {
    if (headroom !== "auto") return;
    const box = art.current?.parentElement;
    const svg = art.current?.querySelector("svg");
    if (!box || !svg || typeof svg.getBBox !== "function") { setOverTop(0); return; }
    try {
      const bb = svg.getBBox();
      const r = svg.getBoundingClientRect();
      const top = r.top + bb.y * (r.height / 120);
      // + le contour et la respiration du perso (≈ 4 %)
      const over = box.getBoundingClientRect().top - top + 4 + r.height * 0.04;
      setOverTop(Math.max(0, Math.round(over)));
    } catch { setOverTop(0); }
  }, [headroom, lookKey, size, crown]);
  const voice = usePersoVoice(talk ? name : null);
  const { ref, mood: talkingMood, talking } = usePersoTalk(name, { auto: autoTalk });
  const m = talkingMood ?? mood;
  const tap = talk && voice && name ? { onClick: () => void playPersoVoice(name), role: "button" as const, tabIndex: 0, "aria-label": name } : {};
  // Secret : un joueur nommé « Zinzin » porte la couronne arc-en-ciel (à la place de celle du gagnant)
  const zinzin = isZinzinName(name);
  // Même encombrement que l'ancien blob (largeur s, hauteur 1,15 s) : rien ne bouge dans la mise en page
  // (+ la place de la couronne au-dessus)
  const k = size * 1.15;
  const crownH = crown ? size * 0.3 : 0;
  const d = delay ?? 0;
  const cheer = cheering && !talking ? { animation: "mascot-cheer 0.9s ease-in-out infinite", animationDelay: `${d}s`, transformOrigin: "50% 80%" }
    : m === "rofl" && !talking ? { animation: "mascot-rofl 0.8s ease-in-out infinite", animationDelay: `${d}s`, transformOrigin: "50% 80%" }
      : null;
  const still = blink === false && bob === false;
  // Flottement : durée et départ propres à chacun (comme l'ancien blob avec `delay`)
  const wob = d ? ({ ["--av-d" as string]: `${(2.6 + d * 0.2).toFixed(2)}s`, animationDelay: `${-d}s` } as CSSProperties) : undefined;
  return (
    <div ref={ref} className={[cheer ? "pb-cheer" : "", className ?? ""].join(" ").trim() || undefined} style={{ position: "relative", width: size, height: k + crownH, flexShrink: 0, marginTop: headroom === "auto" ? overTop : headroom ? size * 0.2 : undefined, ...cheer, ...style }} {...tap}>
      {cheer && <style>{"@media (prefers-reduced-motion: reduce){.pb-cheer{animation:none!important}}"}</style>}
      <div ref={art} style={{ position: "absolute", left: (size - k) / 2, bottom: -k * 0.04, transform: shrink < 1 ? `scale(${shrink.toFixed(3)})` : undefined, transformOrigin: "50% 92%" }}>
        <AvatarBlob look={look} size={k} mood={m} name={name} animate={animate && !talking && !still} float={bob !== false && !cheer} shadow={shadow} style={wob}
          costume={crown && !zinzin ? (look.extra === "headphones" ? crownHighCostume : crownCostume) : undefined} />
      </div>
      {sparkle && <Sparkles size={size} top={crownH} />}
      {sweat && <SweatDrop size={size} top={crownH} />}
      {talk && voice && <VoiceBadge size={Math.max(16, Math.round(size * 0.3))} />}
    </div>
  );
}

/** Petites étoiles autour du perso (repris de l'ancien blob, en version « sticker » contourée). */
function Sparkles({ size: s, top }: { size: number; top: number }) {
  const pts = [
    { l: -s * 0.1, t: s * 0.08, sz: s * 0.14, d: 0 }, { l: s * 1.0, t: s * 0.12, sz: s * 0.12, d: 0.3 },
    { l: s * 0.16, t: -s * 0.08, sz: s * 0.16, d: 0.6 }, { l: s * 0.8, t: 0, sz: s * 0.13, d: 0.9 },
  ];
  return (
    <>
      {pts.map((p, i) => (
        <svg key={i} viewBox="-12 -12 24 24" width={p.sz} height={p.sz} aria-hidden
          style={{ position: "absolute", left: p.l, top: top + p.t, zIndex: 4, overflow: "visible", animation: "mascot-twinkle 1.8s ease-in-out infinite", animationDelay: `${p.d}s` }}>
          <path d="M0 -11 L2.8 -2.8 L11 0 L2.8 2.8 L0 11 L-2.8 2.8 L-11 0 L-2.8 -2.8Z" fill="#FFD23F" stroke="#15082E" strokeWidth={2.2} strokeLinejoin="round" />
        </svg>
      ))}
    </>
  );
}

/** Goutte de sueur sur la tempe (repris de l'ancien blob, contourée comme les persos). */
function SweatDrop({ size: s, top }: { size: number; top: number }) {
  const w = s * 0.17;
  return (
    <svg className="pb-sweat" viewBox="-7 -10 14 20" width={w} height={w * 1.43} aria-hidden
      style={{ position: "absolute", left: s * 0.84, top: top + s * 0.16, zIndex: 4, overflow: "visible" }}>
      <style>{".pb-sweat{animation:pb-sweat 1.8s ease-in infinite}@keyframes pb-sweat{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(55%);opacity:0}}@media (prefers-reduced-motion: reduce){.pb-sweat{animation:none!important}}"}</style>
      <path d="M0 -9 C3.5 -3.5 6 0.5 6 3.5 C6 7 3.4 9 0 9 C-3.4 9 -6 7 -6 3.5 C-6 0.5 -3.5 -3.5 0 -9Z" fill="#87DEFF" stroke="#15082E" strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={-2} cy={3.5} rx={1.4} ry={2.4} fill="#fff" opacity={0.85} />
    </svg>
  );
}

/**
 * Pastille ronde d'un joueur (équivalent de MascotAvatar) : son perso s'il en a un,
 * sinon son perso de base. Même encombrement (size × size).
 */
export function PlayerAvatar({ name, colorIndex = 0, color, size = 44, mood = "happy", border = true }: {
  name?: string | null;
  colorIndex?: number;
  color?: MascotColor;
  size?: number;
  mood?: MascotMood;
  border?: boolean;
}) {
  const stored = usePlayerLook(name);
  const baseColor = color ?? colorForIndexSafe(colorIndex);
  // Sans perso : son perso de base (même dessin), dans la couleur de son rang
  const look = useMemo(() => stored ?? defaultLookFor(baseColor, mood), [stored, baseColor, mood]);
  const c = AVATAR_PALETTE[look.color] ?? AVATAR_PALETTE.pink;
  const k = size * 0.96;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", position: "relative", flexShrink: 0, overflow: "hidden",
      background: `radial-gradient(circle at 30% 30%, ${c.hi}, ${c.body} 45%, ${c.deep})`,
      border: border ? `${Math.max(2, size * 0.06)}px solid white` : "none",
      boxShadow: `0 4px 12px ${c.body}66`,
    }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -k / 2, marginTop: -k * 0.42 }}>
        <AvatarBlob look={look} size={k} mood={mood} name={name} animate={false} />
      </div>
    </div>
  );
}
