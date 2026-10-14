"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { Mascot, type MascotMood } from "@/components/Mascot";
import { useUnlocked } from "@/lib/entitlements";
import { freeLook, type AvatarLook } from "@/lib/avatar/look";
import { getBand, getPlayerLook, subscribePlayers, type BandEntry } from "@/lib/saved-players";
import { colorForIndexSafe } from "./colors";
import { AvatarBlob } from "./AvatarBlob";

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
  name, colorIndex = 0, size = 56, mood = "happy", arms, bob, shadow = false, delay, animate = true, style, className,
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
}) {
  const look = usePlayerLook(name);
  if (!look) {
    return <Mascot size={size} color={colorForIndexSafe(colorIndex)} mood={mood} arms={arms} bob={bob} shadow={shadow} delay={delay} style={style} className={className} />;
  }
  // Même encombrement que le Mascot (largeur s, hauteur 1,15 s) : rien ne bouge dans la mise en page
  const k = size * 1.15;
  return (
    <div className={className} style={{ position: "relative", width: size, height: k, flexShrink: 0, ...style }}>
      <div style={{ position: "absolute", left: (size - k) / 2, bottom: -k * 0.04 }}>
        <AvatarBlob look={look} size={k} mood={mood} animate={animate && bob !== false} />
      </div>
    </div>
  );
}
