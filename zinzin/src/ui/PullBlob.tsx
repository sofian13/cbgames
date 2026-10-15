import { useEffect, useRef, type RefObject } from "react";
import { ZBlob } from "./ZBlob";
import { haptic, reducedMotion } from "./util";
import { playSfx } from "@/lib/sfx";

/**
 * Secret de l'accueil : tout en haut, tirer la page vers le bas fait descendre un blob suspendu
 * à un élastique qui suit le doigt (résistance progressive, ~140 px max). Au relâchement il remonte
 * d'un coup et claque (« boing ») ; la page rebondit un peu.
 * - Démarre seulement si l'accueil est déjà en haut ET que le 1er mouvement du doigt va vers le bas
 *   (un défilement normal ou un glissement de rail ne déclenche rien).
 * - iOS : le rebond natif est annulé (preventDefault) seulement pendant ce geste ; l'écouteur
 *   bloquant touchmove n'existe que pendant un toucher commencé en haut (défilement intact ailleurs).
 * - Rien dans React pendant le geste : transforms posés directement, une image par rAF.
 */

const MAX = 140;
const K = 170;
const SIZE = 66;
/** Part du tirage suivie par la page */
const SHIFT = 0.9;
/** Distance sur laquelle le blob arrive depuis le haut de l'écran */
const DROP = 70;
/** En dessous : on lâche sans « boing » (petit tiraillement involontaire) */
const MIN_SNAP = 34;

export function PullBlob({ homeRef, contentRef }: { homeRef: RefObject<HTMLElement | null>; contentRef: RefObject<HTMLElement | null> }) {
  const rig = useRef<HTMLDivElement>(null);
  const rope = useRef<HTMLDivElement>(null);
  const blob = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const home = homeRef.current;
    const content0 = contentRef.current;
    if (!home) return;
    let state: "idle" | "maybe" | "pull" = "idle";
    let x0 = 0, y0 = 0, d = 0, raf = 0, buzzed = false;
    const reduce = reducedMotion();

    /** Haut de l'en-tête (mesuré au début du geste) : le blob pend juste au-dessus */
    let hdrTop = 50;
    const paint = () => {
      raf = 0;
      const content = contentRef.current;
      const r = rig.current, ro = rope.current, b = blob.current;
      if (!content || !r || !ro || !b) return;
      // La page descend presque autant que le doigt ; le blob descend dans l'espace libéré
      const shift = d * SHIFT;
      content.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
      const st = Math.min(1, d / MAX);
      const sy = 1 + st * 0.12, sx = 1 - st * 0.08;
      // Il « tombe » du haut sur les premiers px, puis reste calé juste au-dessus de l'en-tête
      const bottom = hdrTop + shift - 6 - Math.max(0, 1 - d / DROP) * (hdrTop + SIZE);
      b.style.transform = `translate3d(0, ${(bottom - SIZE).toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      ro.style.transform = `scaleY(${Math.max(0, bottom - SIZE * sy + 8).toFixed(1)})`;
      r.style.opacity = d > 1 ? "1" : "0";
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };

    const release = () => {
      const was = d;
      d = 0;
      cancelAnimationFrame(raf);
      raf = 0;
      const content = contentRef.current;
      const r = rig.current, ro = rope.current, b = blob.current;
      if (!content || !r || !ro || !b) return;
      const from = was * SHIFT;
      const snap = was >= MIN_SNAP;
      const bTop = hdrTop + from - 6 - Math.max(0, 1 - was / DROP) * (hdrTop + SIZE) - SIZE;
      if (snap) {
        // Il remonte d'un coup et claque en haut : « boing »
        playSfx("bloop2", { volume: 0.55, rate: 0.55 });
        playSfx("bloop2", { volume: 0.4, rate: 0.95, delay: 0.09 });
        haptic("light");
      }
      const dur = reduce ? 160 : snap ? 620 : 300;
      const done = content.animate(
        reduce || !snap
          ? [{ transform: `translate3d(0, ${from}px, 0)` }, { transform: "translate3d(0, 0, 0)" }]
          : [
            { transform: `translate3d(0, ${from}px, 0)` },
            { transform: "translate3d(0, -12px, 0)", offset: 0.38 },
            { transform: "translate3d(0, 5px, 0)", offset: 0.66 },
            { transform: "translate3d(0, -2px, 0)", offset: 0.84 },
            { transform: "translate3d(0, 0, 0)" },
          ],
        { duration: dur, easing: "ease-out" },
      );
      b.animate(
        [
          { transform: `translate3d(0, ${bTop}px, 0) scale(0.92, 1.12)` },
          { transform: `translate3d(0, ${-SIZE * 1.6}px, 0) scale(0.8, 1.3)`, offset: 0.45 },
          { transform: `translate3d(0, ${-SIZE * 1.6}px, 0) scale(1.3, 0.7)` },
        ],
        { duration: snap && !reduce ? 360 : 220, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)", fill: "forwards" },
      );
      ro.animate([{ transform: `scaleY(${Math.max(0, bTop + SIZE - SIZE * 1.12 + 8)})` }, { transform: "scaleY(0)" }], { duration: 200, easing: "ease-in", fill: "forwards" });
      done.onfinish = () => {
        content.style.transform = "";
        content.style.willChange = "";
        r.style.opacity = "0";
        b.getAnimations().forEach((a) => a.cancel());
        ro.getAnimations().forEach((a) => a.cancel());
        b.style.transform = `translate3d(0, ${-SIZE * 1.6}px, 0)`;
        ro.style.transform = "scaleY(0)";
      };
    };

    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || state === "idle") return;
      const dy = t.clientY - y0, dx = t.clientX - x0;
      if (state === "maybe") {
        // Décision au 1er mouvement : vers le bas, franchement vertical, page en haut, geste annulable
        if (dy > 0 && dy >= Math.abs(dx) * 1.2 && home.scrollTop <= 0 && e.cancelable) {
          state = "pull";
          const c = contentRef.current;
          if (c) {
            c.style.willChange = "transform";
            hdrTop = (c.firstElementChild ?? c).getBoundingClientRect().top;
          }
          buzzed = false;
        } else {
          state = "idle";
          home.removeEventListener("touchmove", onMove);
          return;
        }
      }
      e.preventDefault(); // pas de rebond natif pendant le tirage
      d = Math.max(0, MAX * (1 - Math.exp(-Math.max(0, dy) / K)));
      if (!buzzed && d > MAX * 0.85) { buzzed = true; haptic("light"); }
      schedule();
    };
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || home.scrollTop > 0) { state = "idle"; return; }
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      state = "maybe";
      // Écouteur bloquant seulement pour ce toucher (commencé en haut de l'accueil)
      home.addEventListener("touchmove", onMove, { passive: false });
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length) return;
      home.removeEventListener("touchmove", onMove);
      if (state === "pull") release();
      state = "idle";
    };
    home.addEventListener("touchstart", onStart, { passive: true });
    home.addEventListener("touchend", onEnd, { passive: true });
    home.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      home.removeEventListener("touchstart", onStart);
      home.removeEventListener("touchend", onEnd);
      home.removeEventListener("touchcancel", onEnd);
      home.removeEventListener("touchmove", onMove);
      cancelAnimationFrame(raf);
      if (content0) { content0.style.transform = ""; content0.style.willChange = ""; }
    };
  }, [homeRef, contentRef]);

  return (
    <div ref={rig} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 flex justify-center" style={{ zIndex: 2, opacity: 0, height: 0 }}>
      <div className="relative" style={{ width: SIZE }}>
        {/* Élastique : 1 px de haut étiré en scaleY (transform seulement) */}
        <div ref={rope} className="zz-pull-rope absolute left-1/2 top-0" style={{ transform: "scaleY(0)" }} />
        <div ref={blob} className="absolute left-0 top-0" style={{ width: SIZE, height: SIZE, transformOrigin: "50% 100%", transform: `translate3d(0, ${-SIZE * 1.6}px, 0)` }}>
          <ZBlob size={SIZE} color="pink" mood="shocked" seed={6} speed={1.8} shadow={false} outline hop={false} />
        </div>
      </div>
    </div>
  );
}
