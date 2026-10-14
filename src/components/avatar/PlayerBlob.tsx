"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { Mascot, type MascotMood } from "@/components/Mascot";
import { useUnlocked } from "@/lib/entitlements";
import { freeLook, type AvatarLook } from "@/lib/avatar/look";
import { getBand, getPlayerLook, subscribePlayers, type BandEntry } from "@/lib/saved-players";
import { colorForIndexSafe } from "./colors";
import { AvatarBlob } from "./AvatarBlob";
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

export function PlayerBlob({
  name, colorIndex = 0, size = 56, mood = "happy", arms, bob, shadow = false, delay, animate = true, style, className, talk = false, autoTalk = false,
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
}) {
  const look = usePlayerLook(name);
  const voice = usePersoVoice(talk ? name : null);
  const { ref, mood: talkingMood, talking } = usePersoTalk(name, { auto: autoTalk });
  const m = talkingMood ?? mood;
  const tap = talk && voice && name ? { onClick: () => void playPersoVoice(name), role: "button" as const, tabIndex: 0, "aria-label": name } : {};
  if (!look) {
    const blob = <Mascot size={size} color={colorForIndexSafe(colorIndex)} mood={m} arms={arms} bob={bob} shadow={shadow} delay={delay} style={talk || autoTalk ? undefined : style} className={talk || autoTalk ? undefined : className} />;
    if (!talk && !autoTalk) return blob;
    return (
      <div ref={ref} className={className} style={{ position: "relative", display: "inline-block", flexShrink: 0, ...style }} {...tap}>
        {blob}
        {talk && voice && <VoiceBadge size={Math.max(16, Math.round(size * 0.3))} />}
      </div>
    );
  }
  // Même encombrement que le Mascot (largeur s, hauteur 1,15 s) : rien ne bouge dans la mise en page
  const k = size * 1.15;
  return (
    <div ref={ref} className={className} style={{ position: "relative", width: size, height: k, flexShrink: 0, ...style }} {...tap}>
      <div style={{ position: "absolute", left: (size - k) / 2, bottom: -k * 0.04 }}>
        <AvatarBlob look={look} size={k} mood={m} animate={animate && bob !== false && !talking} />
      </div>
      {talk && voice && <VoiceBadge size={Math.max(16, Math.round(size * 0.3))} />}
    </div>
  );
}
