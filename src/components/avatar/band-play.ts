"use client";

import { useEffect, type RefObject } from "react";
import { haptic } from "@/lib/app-mode";
import { playSfx } from "@/lib/sfx";

/**
 * Secrets de « Ma bande » (la rangée de blobs côte à côte) :
 * - Appui long (~450 ms) sur un blob : il s'écrase comme un marshmallow sous le pouce tant qu'on
 *   appuie, puis reprend sa forme en gigotant (ressort) quand on lâche. Petit son mou + vibration.
 * - Appui long puis glisser sur un autre blob : au lâcher, les deux se penchent l'un vers l'autre
 *   pour un bisou (petits cœurs qui montent), puis celui qu'on a déplacé revient à sa place.
 *   Rien n'est réordonné (l'ordre se change avec les flèches de « Gérer la bande »).
 * Un toucher normal (court) ne change pas : il fait parler le blob / ouvre son éditeur. Un glisser
 * sans appui long reste un défilement. Tout passe par Web Animations et des styles posés hors
 * React (aucun rendu par image).
 * Repères : le conteneur porte la rangée ; chaque blob est un `[data-band-blob]` dont le bouton
 * (TalkingBlob) est l'élément animé.
 */

const HOLD_MS = 450;
const SLOP = 10;
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Petits cœurs qui montent (éléments éphémères posés sur la page). */
function hearts(x: number, y: number) {
  if (reduced()) return;
  for (let i = 0; i < 6; i++) {
    const s = 14 + Math.round(Math.random() * 10);
    const el = document.createElement("span");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `position:fixed;left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;z-index:200;pointer-events:none;opacity:0`;
    el.innerHTML = `<svg viewBox="-14 -13 28 26" width="${s}" height="${s}"><path d="M0 11 C-14 2 -14 -10 -6 -11 C-2 -11.5 0 -8 0 -6 C0 -8 2 -11.5 6 -11 C14 -10 14 2 0 11Z" fill="${i % 3 ? "#FF2E7E" : "#FF7AB6"}" stroke="#15082E" stroke-width="2"/></svg>`;
    document.body.appendChild(el);
    const dx = (Math.random() - 0.5) * 60;
    const a = el.animate(
      [
        { opacity: 0, transform: "translate(0, 0) scale(0.4)" },
        { opacity: 1, transform: `translate(${dx * 0.3}px, -24px) scale(1.1)`, offset: 0.25 },
        { opacity: 0, transform: `translate(${dx}px, ${-80 - Math.random() * 40}px) scale(0.8) rotate(${dx * 0.4}deg)` },
      ],
      { duration: 1100 + Math.random() * 400, delay: i * 90, easing: "ease-out", fill: "both" },
    );
    a.onfinish = () => el.remove();
    a.oncancel = () => el.remove();
  }
}

/** (dx, dy) écran → repère du blob (son enveloppe est un peu tournée : `rotate` en ligne). */
function toLocal(wrap: HTMLElement, dx: number, dy: number): [number, number] {
  const a = (-(parseFloat(wrap.style.rotate) || 0) * Math.PI) / 180;
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
}

/** `active` : la rangée est affichée (elle n'existe pas tant que la bande est vide). */
export function useBandPlay(ref: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    const box = ref.current;
    if (!active || !box || typeof Element.prototype.animate !== "function") return;

    type G = {
      pid: number; wrap: HTMLElement; el: HTMLElement; x0: number; y0: number;
      phase: "wait" | "held" | "drag"; timer: ReturnType<typeof setTimeout>; held?: Animation; base?: DOMRect; tf?: string;
    };
    let g: G | null = null;
    let swallowUntil = 0;
    const busy = new Set<HTMLElement>();

    const reset = (x: G, origin = true) => {
      x.wrap.style.zIndex = "";
      x.wrap.style.position = "";
      x.el.style.transform = "";
      // Pivot d'origine rendu (l'enfoncement habituel du bouton reste identique)
      if (origin) x.el.style.transformOrigin = "";
    };

    /** Retour à la forme normale en gigotant (depuis l'état affiché, quel qu'il soit). */
    const wobbleBack = (x: G) => {
      const from = getComputedStyle(x.el).transform;
      x.held?.cancel();
      reset(x, false);
      if (reduced()) { x.el.style.transformOrigin = ""; return; }
      const a = x.el.animate(
        [
          { transform: from === "none" ? "none" : from },
          { transform: "scale(0.86, 1.16)", offset: 0.3 },
          { transform: "scale(1.08, 0.93)", offset: 0.55 },
          { transform: "scale(0.97, 1.03)", offset: 0.78 },
          { transform: "none" },
        ],
        { duration: 720, easing: "ease-out" },
      );
      a.onfinish = a.oncancel = () => { if (!busy.has(x.el) && g?.el !== x.el) x.el.style.transformOrigin = ""; };
    };

    /** Le blob déplacé revient à sa place (petit ressort). */
    const springHome = (x: G, from: string) => {
      busy.add(x.el);
      reset(x, false);
      x.wrap.style.position = "relative";
      x.wrap.style.zIndex = "5";
      const a = x.el.animate([{ transform: from }, { transform: "none" }], { duration: reduced() ? 1 : 560, easing: SPRING });
      a.onfinish = a.oncancel = () => { busy.delete(x.el); reset(x); };
    };

    /** Bisou entre le blob déplacé et celui sur lequel on l'a lâché. */
    const kiss = (x: G, other: HTMLElement) => {
      const base = x.base!;
      const o = other.getBoundingClientRect();
      const cur = x.el.getBoundingClientRect();
      // Côté où il a été lâché (sinon l'autre côté s'il sortirait de l'écran)
      let side = cur.left + cur.width / 2 < o.left + o.width / 2 ? -1 : 1;
      const gap = (o.width + base.width) / 2 * 0.86;
      const fits = (sd: number) => {
        const cx = o.left + o.width / 2 + sd * gap;
        return cx - base.width / 2 > 2 && cx + base.width / 2 < innerWidth - 2;
      };
      if (!fits(side) && fits(-side)) side = -side;
      const cx = o.left + o.width / 2 + side * gap;
      const cy = o.bottom - base.height / 2;
      const [tx, ty] = toLocal(x.wrap, cx - (base.left + base.width / 2), cy - (base.top + base.height / 2));
      const lean = -side * 13; // vers l'autre
      const from = x.tf ?? "none";
      busy.add(x.el);
      busy.add(other);
      x.el.style.transform = "";
      const T = `translate(${tx}px, ${ty}px)`;
      const T2 = `translate(${tx - side * 5}px, ${ty}px)`;
      const a = x.el.animate(
        [
          { transform: from },
          { transform: `${T} rotate(${lean}deg)`, offset: 0.22 },
          { transform: `${T2} rotate(${lean * 1.3}deg) scale(1.05, 0.95)`, offset: 0.34 },
          { transform: `${T} rotate(${lean}deg)`, offset: 0.5 },
          { transform: `${T} rotate(${lean}deg)`, offset: 0.82 },
          { transform: `${T} rotate(0deg)` },
        ],
        { duration: 1250, easing: "ease-in-out", fill: "forwards" },
      );
      other.style.transformOrigin = "50% 100%";
      other.animate(
        [
          { transform: "none" },
          { transform: `rotate(${-lean}deg)`, offset: 0.22 },
          { transform: `translateX(${side * 4}px) rotate(${-lean * 1.3}deg) scale(1.05, 0.95)`, offset: 0.34 },
          { transform: `rotate(${-lean}deg)`, offset: 0.5 },
          { transform: `rotate(${-lean}deg)`, offset: 0.82 },
          { transform: "none" },
        ],
        { duration: 1250, easing: "ease-in-out" },
      ).onfinish = () => { busy.delete(other); other.style.transformOrigin = ""; };
      // Le « smack » : deux petits pops aigus, une note douce, des cœurs entre les deux têtes
      setTimeout(() => {
        playSfx("pop", { volume: 0.4, rate: 1.9 });
        setTimeout(() => playSfx("pop2", { volume: 0.35, rate: 2.1 }), 110);
        playSfx("chime", { volume: 0.18, rate: 1.25 });
        void haptic("medium");
        hearts((cx + o.left + o.width / 2) / 2, o.top + o.height * 0.22);
      }, 400);
      a.onfinish = () => {
        // Puis il rentre chez lui, avec un petit ressort
        const end = getComputedStyle(x.el).transform;
        a.cancel();
        busy.delete(x.el);
        springHome(x, end);
      };
    };

    const onDown = (e: PointerEvent) => {
      if (g || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      const wrap = (e.target as Element | null)?.closest<HTMLElement>("[data-band-blob]");
      const el = wrap?.querySelector<HTMLElement>(":scope > button");
      if (!wrap || !el || busy.has(el)) return;
      const x: G = {
        pid: e.pointerId, wrap, el, x0: e.clientX, y0: e.clientY, phase: "wait",
        timer: setTimeout(() => {
          if (g !== x) return;
          // Appui long : écrasé sous le pouce
          x.phase = "held";
          swallowUntil = Infinity;
          el.style.transformOrigin = "50% 100%";
          x.base = el.getBoundingClientRect();
          if (!reduced()) {
            x.held = el.animate([{ transform: "none" }, { transform: "scale(1.24, 0.72)" }], { duration: 280, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)", fill: "forwards" });
          }
          playSfx("bloop2", { volume: 0.45, rate: 0.62 });
          void haptic("light");
        }, HOLD_MS),
      };
      g = x;
    };

    const onMove = (e: PointerEvent) => {
      const x = g;
      if (!x || e.pointerId !== x.pid) return;
      const dx = e.clientX - x.x0, dy = e.clientY - x.y0;
      if (x.phase === "wait") {
        // Ça bouge avant l'appui long : c'est un défilement, on laisse faire
        if (Math.hypot(dx, dy) > SLOP) { clearTimeout(x.timer); g = null; }
        return;
      }
      if (x.phase === "held" && Math.hypot(dx, dy) > SLOP + 2) {
        x.phase = "drag";
        x.held?.cancel();
        x.wrap.style.position = "relative";
        x.wrap.style.zIndex = "5";
      }
      if (x.phase === "drag") {
        const [lx, ly] = toLocal(x.wrap, dx, dy);
        const r = Math.max(-14, Math.min(14, dx * 0.08));
        x.tf = `translate(${lx}px, ${ly}px) rotate(${r}deg) scale(1.08, 0.94)`;
        x.el.style.transform = x.tf;
      }
    };

    const onUp = (e: PointerEvent) => {
      const x = g;
      if (!x || e.pointerId !== x.pid) return;
      g = null;
      clearTimeout(x.timer);
      if (x.phase === "wait") return; // toucher normal : le clic suit son cours
      // Le clic qui suit l'appui long ne fait pas parler le blob
      swallowUntil = performance.now() + 450;
      if (x.phase === "held") { wobbleBack(x); return; }
      // Lâché : sur quel blob (recouvrement suffisant) ?
      const r = x.el.getBoundingClientRect();
      let best: { el: HTMLElement; k: number } | null = null;
      if (e.type !== "pointercancel") {
        box.querySelectorAll<HTMLElement>("[data-band-blob]").forEach((w) => {
          const b = w.querySelector<HTMLElement>(":scope > button");
          if (!b || b === x.el || busy.has(b)) return;
          const o = b.getBoundingClientRect();
          const iw = Math.min(r.right, o.right) - Math.max(r.left, o.left);
          const ih = Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top);
          if (iw <= 0 || ih <= 0) return;
          const k = (iw * ih) / Math.min(r.width * r.height, o.width * o.height);
          if (k > 0.2 && (!best || k > best.k)) best = { el: b, k };
        });
      }
      const hit = best as { el: HTMLElement; k: number } | null;
      if (hit) kiss(x, hit.el);
      else springHome(x, x.tf ?? "none");
    };

    // Pendant l'appui long / le glisser : pas de défilement de la liste
    const onTouchMove = (e: TouchEvent) => { if (g && g.phase !== "wait" && e.cancelable) e.preventDefault(); };
    // Appui long : pas de menu contextuel
    const onContext = (e: Event) => { if (g && g.phase !== "wait") e.preventDefault(); };
    // Le clic d'après un appui long est avalé avant d'atteindre React (écouteur de capture sur window)
    const onClick = (e: MouseEvent) => {
      if (performance.now() > swallowUntil || !box.contains(e.target as Node)) return;
      swallowUntil = 0;
      e.stopPropagation();
      e.preventDefault();
    };

    box.addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onUp);
    box.addEventListener("touchmove", onTouchMove, { passive: false });
    box.addEventListener("contextmenu", onContext);
    addEventListener("click", onClick, true);
    return () => {
      if (g) { clearTimeout(g.timer); g = null; }
      box.removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onUp);
      box.removeEventListener("touchmove", onTouchMove);
      box.removeEventListener("contextmenu", onContext);
      removeEventListener("click", onClick, true);
    };
  }, [ref, active]);
}
