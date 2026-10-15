"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Mascot, MascotAvatar, type MascotColor, type MascotMood } from "@/components/Mascot";
import { useUnlocked } from "@/lib/entitlements";
import { AVATAR_PALETTE, freeLook, type AvatarLook } from "@/lib/avatar/look";
import { getBand, getPlayerLook, subscribePlayers, type BandEntry } from "@/lib/saved-players";
import { colorForIndexSafe } from "./colors";
import { AvatarBlob, RainbowCrown, type AvatarCostumeLayers } from "./AvatarBlob";
import { isBossName, isZinzinName } from "@/lib/avatar/secrets";
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
 * un (« Ma bande »), sinon le blob coloré habituel (Mascot).
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
  name, colorIndex = 0, color, size = 56, mood = "happy", arms, bob, shadow = false, delay, animate = true, style, className, talk = false, autoTalk = false,
  crown = false, cheering = false, sweat, sparkle, blink, headroom = false,
}: {
  name?: string | null;
  colorIndex?: number;
  size?: number;
  mood?: MascotMood;
  /** Bras du blob par défaut (Mascot) */
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
  /** Couleur forcée du blob par défaut (sinon : couleur du rang colorIndex) */
  color?: MascotColor;
  /** Couronne du gagnant (blob par défaut ET perso) */
  crown?: boolean;
  /** Saute de joie (blob par défaut ET perso) */
  cheering?: boolean;
  /** Options du blob par défaut seulement (sans effet sur un perso) */
  sweat?: boolean;
  sparkle?: boolean;
  blink?: boolean;
  /**
   * Perso seulement : réserve de la place au-dessus (cheveux, chapeau) quand un texte est juste au-dessus.
   * true = marge fixe (20 % de la taille) ; "auto" = juste ce qui dépasse vraiment (mesuré : coupe haute, chapeau, casque…).
   */
  headroom?: boolean | "auto";
}) {
  const look = usePlayerLook(name);
  const art = useRef<HTMLDivElement>(null);
  const [overTop, setOverTop] = useState(0);
  const lookKey = look ? JSON.stringify(look) : "";
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
      // + le contour et la respiration du perso (≈ 3 %)
      const over = box.getBoundingClientRect().top - top + 4 + r.height * 0.03;
      setOverTop(Math.max(0, Math.round(over)));
    } catch { setOverTop(0); }
  }, [headroom, lookKey, size, crown]);
  const voice = usePersoVoice(talk ? name : null);
  const { ref, mood: talkingMood, talking } = usePersoTalk(name, { auto: autoTalk });
  const m = talkingMood ?? mood;
  const tap = talk && voice && name ? { onClick: () => void playPersoVoice(name), role: "button" as const, tabIndex: 0, "aria-label": name } : {};
  // Secret : un joueur nommé « Zinzin » porte la couronne arc-en-ciel (à la place de celle du gagnant)
  const zinzin = isZinzinName(name);
  if (!look) {
    // Secret : « Sofian » (le créateur) porte des lunettes noires, quelle que soit l'humeur
    const mascotProps = { size, color: color ?? colorForIndexSafe(colorIndex), mood: m, arms, shadow, delay, cheering, sweat, sparkle, blink, shades: isBossName(name) };
    const blob = zinzin
      ? <ZinzinMascot {...mascotProps} bob={bob} crownSpace={crown} style={talk || autoTalk ? undefined : style} className={talk || autoTalk ? undefined : className} />
      : <Mascot {...mascotProps} bob={bob} crown={crown} style={talk || autoTalk ? undefined : style} className={talk || autoTalk ? undefined : className} />;
    if (!talk && !autoTalk) return blob;
    return (
      <div ref={ref} className={className} style={{ position: "relative", display: "inline-block", flexShrink: 0, ...style }} {...tap}>
        {blob}
        {talk && voice && <VoiceBadge size={Math.max(16, Math.round(size * 0.3))} />}
      </div>
    );
  }
  // Même encombrement que le Mascot (largeur s, hauteur 1,15 s) : rien ne bouge dans la mise en page
  // (+ la place de la couronne au-dessus, comme le Mascot couronné)
  const k = size * 1.15;
  const crownH = crown ? size * 0.3 : 0;
  const cheer = cheering && !talking ? { animation: "mascot-cheer 0.9s ease-in-out infinite", animationDelay: `${delay ?? 0}s`, transformOrigin: "50% 80%" } : null;
  return (
    <div ref={ref} className={[cheer ? "pb-cheer" : "", className ?? ""].join(" ").trim() || undefined} style={{ position: "relative", width: size, height: k + crownH, flexShrink: 0, marginTop: headroom === "auto" ? overTop : headroom ? size * 0.2 : undefined, ...cheer, ...style }} {...tap}>
      {cheer && <style>{"@media (prefers-reduced-motion: reduce){.pb-cheer{animation:none!important}}"}</style>}
      <div ref={art} style={{ position: "absolute", left: (size - k) / 2, bottom: -k * 0.04 }}>
        <AvatarBlob look={look} size={k} mood={m} name={name} animate={animate && bob !== false && !talking && !cheer} costume={crown && !zinzin ? (look.extra === "headphones" ? crownHighCostume : crownCostume) : undefined} />
      </div>
      {talk && voice && <VoiceBadge size={Math.max(16, Math.round(size * 0.3))} />}
    </div>
  );
}

/**
 * Blob par défaut (Mascot) d'un joueur « Zinzin » : couronne arc-en-ciel posée sur la tête.
 * L'ensemble (blob + couronne) porte l'animation du Mascot pour bouger d'un bloc ;
 * même encombrement que le Mascot (couronné ou non).
 */
function ZinzinMascot({ size, bob, crownSpace, delay = 0, cheering, mood, style, className, ...rest }: {
  size: number; color: MascotColor; mood: MascotMood; arms?: boolean; bob?: boolean; shadow?: boolean; delay?: number;
  cheering?: boolean; sweat?: boolean; sparkle?: boolean; blink?: boolean; shades?: boolean; crownSpace: boolean; style?: CSSProperties; className?: string;
}) {
  const crownH = crownSpace ? size * 0.3 : 0;
  const anim = cheering
    ? "mascot-cheer 0.9s ease-in-out infinite"
    : mood === "rofl" ? "mascot-rofl 0.8s ease-in-out infinite"
      : bob !== false ? `mascot-bob ${2.4 + delay * 0.2}s ease-in-out infinite` : "none";
  return (
    <div className={className} style={{ position: "relative", width: size, height: size * 1.15 + crownH, flexShrink: 0, animation: anim, animationDelay: `${delay}s`, transformOrigin: "50% 80%", ...style }}>
      <Mascot {...rest} size={size} mood={mood} delay={delay} cheering={cheering} style={{ position: "absolute", left: 0, bottom: 0, animation: "none" }} />
      {/* Base de la couronne sur le haut du corps (comme la couronne du Mascot) */}
      <div style={{ position: "absolute", left: "50%", bottom: size * 0.84, width: size * 0.6, marginLeft: -size * 0.3, zIndex: 3 }}>
        <RainbowCrown width={size * 0.6} />
      </div>
    </div>
  );
}

/**
 * Pastille ronde d'un joueur (équivalent de MascotAvatar) : son perso s'il en a un,
 * sinon la pastille habituelle. Même encombrement (size × size).
 */
export function PlayerAvatar({ name, colorIndex = 0, color, size = 44, mood = "happy", border = true }: {
  name?: string | null;
  colorIndex?: number;
  color?: MascotColor;
  size?: number;
  mood?: MascotMood;
  border?: boolean;
}) {
  const look = usePlayerLook(name);
  if (!look) return <MascotAvatar color={color ?? colorForIndexSafe(colorIndex)} size={size} mood={mood} border={border} />;
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
        <AvatarBlob look={look} size={k} mood={mood} animate={false} />
      </div>
    </div>
  );
}
