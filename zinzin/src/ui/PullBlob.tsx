import { useEffect, useRef, type RefObject } from "react";
import { ZBlob } from "./ZBlob";
import { haptic, reducedMotion } from "./util";
import { playLoop, playSfx, preloadSfx, type LoopHandle } from "@/lib/sfx";
import { foundSecret } from "@/lib/secrets-found";

/**
 * Secret de l'accueil : un blob au bout d'un élastique, aux deux bords.
 * - Tout en haut, tirer la page vers le bas fait descendre un blob suspendu qui suit le doigt.
 * - Tout en bas, tirer vers le haut fait monter un autre blob depuis le bas (même effet, inversé).
 * Résistance progressive (~140 px max). Au relâchement il repart d'un coup et claque (« boing ») ;
 * la page rebondit un peu.
 * - Son : pendant le tirage, grincement d'élastique en boucle (vrai enregistrement) dont le volume et
 *   la hauteur montent avec la tension ; coupé en fondu court au lâcher, juste sous le claquement.
 *   Bouton son coupé : playLoop/playSfx ne jouent rien.
 * - Démarre seulement si le doigt se pose alors que l'accueil est DÉJÀ au bord, et que son
 *   1er mouvement part vers l'extérieur, franchement vertical. Un défilement (même rapide) qui
 *   arrive au bord pendant le geste ne déclenche rien ; un glissement de rail non plus.
 * - iOS : le rebond natif de la webview est coupé côté natif (ZinzinBridgeViewController) et celui
 *   de l'accueil par `overscroll-behavior-y: none` (.zz-home). En plus, l'écouteur touchmove est
 *   NON passif en permanence : WebKit fige la nature (bloquante ou non) d'un toucher à son début,
 *   un écouteur ajouté pendant touchstart arrivait trop tard (touchmove non annulable → le rebond
 *   natif gagnait, le blob n'apparaissait qu'au hasard). Il n'appelle preventDefault que pendant
 *   le tirage ; le reste du temps il ne fait que lire deux nombres (défilement intact).
 * - Rien dans React pendant le geste : transforms posés directement, une image par rAF.
 */

const MAX = 140;
const K = 170;
const SIZE = 66;
/** Part du tirage suivie par la page */
const SHIFT = 0.9;
/** Distance sur laquelle le blob arrive depuis le bord de l'écran */
const DROP = 70;
/** En dessous : on lâche sans « boing » (petit tiraillement involontaire) */
const MIN_SNAP = 34;
/** Tolérance (px) pour « au bord » (arrondis de scrollTop sur écrans Retina) */
const EDGE = 1;
/** Grincement : volume et vitesse (= hauteur) au repos → à pleine tension */
const CREAK_VOL: [number, number] = [0.06, 0.62];
const CREAK_RATE: [number, number] = [0.78, 1.3];

type Side = "top" | "bottom";
type Rig = { r: HTMLDivElement; ro: HTMLDivElement; b: HTMLDivElement };

export function PullBlob({ homeRef, contentRef }: { homeRef: RefObject<HTMLElement | null>; contentRef: RefObject<HTMLElement | null> }) {
  const rigT = useRef<HTMLDivElement>(null);
  const ropeT = useRef<HTMLDivElement>(null);
  const blobT = useRef<HTMLDivElement>(null);
  const rigB = useRef<HTMLDivElement>(null);
  const ropeB = useRef<HTMLDivElement>(null);
  const blobB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const home = homeRef.current;
    const content0 = contentRef.current;
    if (!home) return;
    let state: "idle" | "maybe" | "pull" = "idle";
    /** Bords où l'accueil était au moment où le doigt s'est posé */
    let atTop = false, atBottom = false;
    let side: Side = "top";
    let x0 = 0, y0 = 0, d = 0, raf = 0, buzzed = false;
    /** Boucle du grincement pendant le tirage (null hors tirage) */
    let creak: LoopHandle | null = null;
    const stopCreak = (fade: number) => { creak?.(fade); creak = null; };
    const reduce = reducedMotion();

    const rigOf = (s: Side): Rig | null => {
      const r = s === "top" ? rigT.current : rigB.current;
      const ro = s === "top" ? ropeT.current : ropeB.current;
      const b = s === "top" ? blobT.current : blobB.current;
      return r && ro && b ? { r, ro, b } : null;
    };
    /** Sens du décalage de la page : vers le bas en haut, vers le haut en bas */
    const dir = () => (side === "top" ? 1 : -1);

    /**
     * Écart entre le bord de l'écran et le contenu (haut de l'en-tête, ou bas du dernier bloc),
     * mesuré au début du geste. Le rig du bas est retourné (scaleY(-1)) : les mêmes calculs
     * servent aux deux bords, comptés depuis le bord concerné.
     */
    let gap = 50;
    /** Position du bas du blob (depuis le bord) : il arrive du bord puis reste calé contre le contenu */
    const blobEdge = (dd: number) => gap + dd * SHIFT - 6 - Math.max(0, 1 - dd / DROP) * (gap + SIZE);

    const paint = () => {
      raf = 0;
      const content = contentRef.current;
      const g = rigOf(side);
      if (!content || !g) return;
      // La page suit presque le doigt ; le blob vient dans l'espace libéré
      content.style.transform = `translate3d(0, ${(d * SHIFT * dir()).toFixed(1)}px, 0)`;
      const st = Math.min(1, d / MAX);
      const sy = 1 + st * 0.12, sx = 1 - st * 0.08;
      const bottom = blobEdge(d);
      g.b.style.transform = `translate3d(0, ${(bottom - SIZE).toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      g.ro.style.transform = `scaleY(${Math.max(0, bottom - SIZE * sy + 8).toFixed(1)})`;
      g.r.style.opacity = d > 1 ? "1" : "0";
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };

    const release = () => {
      const was = d;
      // Le grincement s'efface (vite si ça claque, pour laisser la place au « boing »)
      stopCreak(was >= MIN_SNAP ? 0.04 : 0.12);
      d = 0;
      cancelAnimationFrame(raf);
      raf = 0;
      const content = contentRef.current;
      const g = rigOf(side);
      if (!content || !g) return;
      const { r, ro, b } = g;
      const k = dir();
      const from = was * SHIFT * k;
      const snap = was >= MIN_SNAP;
      const bTop = blobEdge(was) - SIZE;
      if (snap) {
        foundSecret("pull");
        // Il repart d'un coup et claque contre le bord : élastique lâché + « boing »
        playSfx("elastic-snap", { volume: 0.5, rate: 0.9 + Math.min(1, was / MAX) * 0.2 });
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
            { transform: `translate3d(0, ${-12 * k}px, 0)`, offset: 0.38 },
            { transform: `translate3d(0, ${5 * k}px, 0)`, offset: 0.66 },
            { transform: `translate3d(0, ${-2 * k}px, 0)`, offset: 0.84 },
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
      if (state === "idle") return; // cas courant : on ne touche à rien, le défilement suit son cours
      const t = e.touches[0];
      if (!t) return;
      const dy = t.clientY - y0, dx = t.clientX - x0;
      if (state === "maybe") {
        // Décision au 1er mouvement : vers l'extérieur du bord où l'on était, franchement vertical
        const vertical = Math.abs(dy) >= Math.abs(dx) * 1.2;
        const down = dy > 0 && atTop && home.scrollTop <= EDGE;
        const up = dy < 0 && atBottom && home.scrollTop + home.clientHeight >= home.scrollHeight - EDGE;
        if (vertical && (down || up) && e.cancelable) {
          state = "pull";
          side = down ? "top" : "bottom";
          const c = contentRef.current;
          if (c) {
            c.style.willChange = "transform";
            if (side === "top") {
              gap = (c.firstElementChild ?? c).getBoundingClientRect().top;
            } else {
              const last = c.lastElementChild ?? c;
              gap = Math.max(0, window.innerHeight - last.getBoundingClientRect().bottom);
            }
          }
          buzzed = false;
          creak = playLoop("elastic-stretch", { volume: CREAK_VOL[0], rate: CREAK_RATE[0], fadeIn: 0.06 });
        } else {
          state = "idle";
          return;
        }
      }
      e.preventDefault(); // pas de rebond natif pendant le tirage
      const pull = side === "top" ? dy : -dy;
      d = Math.max(0, MAX * (1 - Math.exp(-Math.max(0, pull) / K)));
      if (!buzzed && d > MAX * 0.85) { buzzed = true; haptic("light"); }
      if (creak) {
        // Plus on tire, plus l'élastique grince fort et aigu
        const st = Math.min(1, d / MAX);
        creak.setVolume(CREAK_VOL[0] + (CREAK_VOL[1] - CREAK_VOL[0]) * Math.pow(st, 0.8));
        creak.setRate(CREAK_RATE[0] + (CREAK_RATE[1] - CREAK_RATE[0]) * st);
      }
      schedule();
    };
    const onStart = (e: TouchEvent) => {
      state = "idle";
      if (e.touches.length !== 1) return;
      // Au bord AU MOMENT où le doigt se pose (pas pendant une inertie qui y arrive ensuite)
      atTop = home.scrollTop <= EDGE;
      atBottom = home.scrollHeight - home.clientHeight > EDGE && home.scrollTop + home.clientHeight >= home.scrollHeight - EDGE;
      if (!atTop && !atBottom) return;
      // Sons du tirage prêts avant le 1er mouvement (déjà en cache après la 1re fois)
      preloadSfx(["elastic-stretch", "elastic-snap", "bloop2"]);
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      state = "maybe";
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length) return;
      if (state === "pull") release();
      state = "idle";
    };
    home.addEventListener("touchstart", onStart, { passive: true });
    // Non passif en permanence (voir en-tête) : seul moyen fiable d'annuler le rebond natif sur iOS
    home.addEventListener("touchmove", onMove, { passive: false });
    home.addEventListener("touchend", onEnd, { passive: true });
    home.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      home.removeEventListener("touchstart", onStart);
      home.removeEventListener("touchmove", onMove);
      home.removeEventListener("touchend", onEnd);
      home.removeEventListener("touchcancel", onEnd);
      cancelAnimationFrame(raf);
      stopCreak(0.05);
      if (content0) { content0.style.transform = ""; content0.style.willChange = ""; }
    };
  }, [homeRef, contentRef]);

  return (
    <>
      <div ref={rigT} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 flex justify-center" style={{ zIndex: 2, opacity: 0, height: 0 }}>
        <div className="relative" style={{ width: SIZE }}>
          {/* Élastique : 1 px de haut étiré en scaleY (transform seulement) */}
          <div ref={ropeT} className="zz-pull-rope absolute left-1/2 top-0" style={{ transform: "scaleY(0)" }} />
          <div ref={blobT} className="absolute left-0 top-0" style={{ width: SIZE, height: SIZE, transformOrigin: "50% 100%", transform: `translate3d(0, ${-SIZE * 1.6}px, 0)` }}>
            <ZBlob size={SIZE} color="pink" mood="shocked" seed={6} speed={1.8} shadow={false} outline hop={false} />
          </div>
        </div>
      </div>
      {/* Bord du bas : le même montage retourné (les calculs restent ceux du haut) ;
          le blob, lui, est remis à l'endroit */}
      <div ref={rigB} aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center" style={{ zIndex: 2, opacity: 0, height: 0, transform: "scaleY(-1)" }}>
        <div className="relative" style={{ width: SIZE }}>
          <div ref={ropeB} className="zz-pull-rope absolute left-1/2 top-0" style={{ transform: "scaleY(0)" }} />
          <div ref={blobB} className="absolute left-0 top-0" style={{ width: SIZE, height: SIZE, transformOrigin: "50% 100%", transform: `translate3d(0, ${-SIZE * 1.6}px, 0)` }}>
            <div style={{ transform: "scaleY(-1)" }}>
              <ZBlob size={SIZE} color="yellow" mood="mindblown" seed={3} speed={1.8} shadow={false} outline hop={false} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
