import { useEffect, type RefObject } from "react";
import { spiralEyes } from "./spiral-eyes";
import { haptic, reducedMotion } from "./util";

/**
 * Secret de l'accueil : défiler très vite de haut en bas plusieurs fois (≥ 2 changements de sens
 * rapides en ~2 s) → les blobs visibles titubent, yeux en spirale, ~2 s. Puis repos (pas de boucle).
 * Écouteur de défilement passif, aucun état React, rien par image : on mémorise juste la vitesse
 * la plus forte de chaque élan. L'élastique du haut / du bas (PullBlob) ne fait pas défiler : non concerné.
 * Animations : Web Animations sur les propriétés `rotate` / `translate` (le gigotement CSS des blobs,
 * en `transform`, continue dessous sans être touché).
 */

const WINDOW_MS = 2000;
const REVERSALS = 2;
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
      undo = spiralEyes(home, SHOW_MS);
      const blobs = Array.from(home.querySelectorAll<HTMLElement>(".zb")).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
      });
      blobs.forEach((el, i) => {
        if (typeof el.animate !== "function") return;
        const k = i % 2 ? -1 : 1;
        el.animate(
          [
            { rotate: "0deg", translate: "0 0" },
            { rotate: `${k * 14}deg`, translate: `${k * 4}px 0`, offset: 0.15 },
            { rotate: `${-k * 12}deg`, translate: `${-k * 5}px 2px`, offset: 0.35 },
            { rotate: `${k * 9}deg`, translate: `${k * 3}px 0`, offset: 0.55 },
            { rotate: `${-k * 6}deg`, translate: `${-k * 2}px 1px`, offset: 0.75 },
            { rotate: `${k * 2}deg`, translate: "0 0", offset: 0.9 },
            { rotate: "0deg", translate: "0 0" },
          ],
          { duration: SHOW_MS, delay: (i % 4) * 60, easing: "ease-in-out" },
        );
      });
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
