import { useEffect, type RefObject } from "react";
import { spiralEyes } from "./spiral-eyes";
import { haptic, reducedMotion } from "./util";

/**
 * Secret de l'accueil : défiler très vite de haut en bas plusieurs fois (≥ 4 changements de sens
 * rapides en ~2 s) → les blobs visibles titubent, yeux en spirale, étoiles qui tournent au-dessus
 * de la tête, ~2 s. Puis repos (pas de boucle). Vibration seulement (pas de son).
 * Écouteur de défilement passif, aucun état React, rien par image : on mémorise juste la vitesse
 * la plus forte de chaque élan. L'élastique du haut / du bas (PullBlob) ne fait pas défiler : non concerné.
 * Animations : voir spiral-eyes.ts (Web Animations sur `rotate` / `translate` / `scale` : le gigotement
 * CSS des blobs, en `transform`, continue dessous sans être touché).
 */

const WINDOW_MS = 2000;
const REVERSALS = 4;
/** Vitesse d'un élan « très rapide » (px/ms) */
const FAST = 1.6;
const SHOW_MS = 2000;
const COOLDOWN_MS = 10_000;

export function DizzyHome({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const home = homeRef.current;
    if (!home || reducedMotion()) return;
    let y = home.scrollTop, t = performance.now();
    let dir = 0, peak = 0;
    let flips: number[] = [];
    let quietUntil = 0;
    let undo: (() => void) | undefined;

    const dizzy = () => {
      quietUntil = performance.now() + COOLDOWN_MS;
      flips = [];
      haptic("medium");
      // Yeux en spirale, étoiles au-dessus de la tête et démarche d'ivrogne (spiral-eyes.ts)
      undo = spiralEyes(home, SHOW_MS, { wobble: true });
    };

    const onScroll = () => {
      const now = performance.now();
      const ny = home.scrollTop;
      const dy = ny - y, dt = Math.max(1, now - t);
      y = ny; t = now;
      if (!dy || now < quietUntil) return;
      const d = dy > 0 ? 1 : -1;
      const v = Math.abs(dy) / dt;
      if (d !== dir) {
        // Changement de sens : l'élan précédent comptait-il (très rapide) ?
        if (dir !== 0 && peak >= FAST) {
          flips = flips.filter((x) => now - x < WINDOW_MS);
          flips.push(now);
          if (flips.length >= REVERSALS) dizzy();
        }
        dir = d;
        peak = v;
      } else if (v > peak) peak = v;
    };
    home.addEventListener("scroll", onScroll, { passive: true });
    return () => { home.removeEventListener("scroll", onScroll); undo?.(); };
  }, [homeRef]);
  return null;
}
