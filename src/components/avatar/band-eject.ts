"use client";

import { haptic } from "@/lib/app-mode";
import { getLang, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";

/**
 * Secret de « Ma bande » : quand le 16e perso arrive (bande pleine), un autre blob est éjecté
 * (il s'envole en tournoyant hors de l'écran), retombe à sa place puis râle dans une petite bulle.
 * Purement visuel : la bande n'est pas modifiée. Web Animations + éléments éphémères posés hors
 * React (comme les cœurs de band-play.ts), styles en ligne (aucune feuille de style requise).
 * Repères : chaque blob de la rangée est un `[data-band-blob]` qui porte `data-band-name`.
 */

const LINES: I18n<string[]> = {
  fr: [
    "Hé ! Y'a plus de place ou quoi ?",
    "Pousse-toi, j'étais là avant !",
    "On est serrés comme des sardines là…",
    "Seize ?! C'est complet, la bande !",
  ],
  en: [
    "Hey! Is there no room left or what?",
    "Scoot over, I was here first!",
    "We're packed like sardines in here…",
    "Sixteen?! The crew is full!",
  ],
  es: [
    "¡Eh! ¿Ya no queda sitio o qué?",
    "¡Hazte a un lado, yo estaba antes!",
    "Estamos como sardinas en lata…",
    "¿¡Dieciséis!? ¡La pandilla está completa!",
  ],
};

const FLY_MS = 2300;
const LAND_AT = 0.8;
const BUBBLE_MS = 2200;
let busy = false;
let lastLine = -1;

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Éjecte un blob de la rangée `box` (jamais `newcomer`, le perso qui vient d'arriver). */
export function ejectBlob(box: HTMLElement | null, newcomer: string) {
  if (!box || busy || typeof Element.prototype.animate !== "function") return;
  const all = Array.from(box.querySelectorAll<HTMLElement>("[data-band-blob]"));
  const others = all.filter((el) => el.dataset.bandName !== newcomer);
  if (!others.length) return;
  const wrap = others[Math.floor(Math.random() * others.length)];
  busy = true;
  // La rangée est hors de l'écran (on a ajouté le perso depuis le bas de la liste) : on la ramène d'abord
  const r0 = box.getBoundingClientRect();
  const visible = r0.top > 40 && r0.bottom < innerHeight - 20;
  if (!visible) box.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
  setTimeout(() => launch(wrap), visible ? 0 : 520);
}

function launch(wrap: HTMLElement) {
  if (!wrap.isConnected) { busy = false; return; }
  const r = wrap.getBoundingClientRect();
  const up = -(r.bottom + 40); // juste au-dessus du haut de l'écran
  const dir = r.left + r.width / 2 < innerWidth / 2 ? -1 : 1;
  wrap.style.position = "relative";
  wrap.style.zIndex = "6";
  haptic("medium");
  playSfx("whoosh", { volume: 0.45, rate: 1.15 });
  const anim = reduced()
    ? wrap.animate([{ transform: "translateY(0)" }, { transform: "translateY(-14px)" }, { transform: "translateY(0)" }], { duration: 500, easing: "ease-out" })
    : wrap.animate(
      [
        { transform: "translate(0, 0) rotate(0deg) scale(1, 1)" },
        { transform: "translate(0, 6px) rotate(0deg) scale(1.16, 0.82)", offset: 0.07 },
        { transform: `translate(${dir * 70}px, ${up}px) rotate(${dir * 620}deg) scale(0.8, 0.8)`, offset: 0.36, easing: "ease-in" },
        { transform: `translate(${dir * 70}px, ${up}px) rotate(${dir * 620}deg) scale(0.8, 0.8)`, offset: 0.5 },
        // Il retombe à sa place, droit, en râlant
        { transform: `translate(0, ${up}px) rotate(0deg) scale(0.9, 1.1)`, offset: 0.52, easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
        { transform: "translate(0, 0) rotate(0deg) scale(1.2, 0.78)", offset: LAND_AT },
        { transform: "translate(0, -10px) rotate(-6deg) scale(0.94, 1.06)", offset: 0.9 },
        { transform: "translate(0, 0) rotate(0deg) scale(1, 1)" },
      ],
      { duration: FLY_MS },
    );
  const land = setTimeout(() => {
    playSfx("thump", { volume: 0.4 });
    haptic();
    bubble(wrap);
  }, reduced() ? 300 : FLY_MS * LAND_AT);
  const end = () => {
    wrap.style.zIndex = "";
    wrap.style.position = "";
  };
  anim.onfinish = end;
  anim.oncancel = () => { clearTimeout(land); end(); busy = false; };
}

/** Petite bulle qui râle, au-dessus du blob (élément éphémère). */
function bubble(wrap: HTMLElement) {
  const lines = LINES[getLang()] ?? LINES.fr;
  let i = Math.floor(Math.random() * (lines.length - 1));
  if (i >= lastLine && lastLine >= 0) i++;
  lastLine = i;
  const r = wrap.getBoundingClientRect();
  const w = Math.min(196, innerWidth - 32);
  const cx = r.left + r.width / 2;
  const left = Math.max(16, Math.min(innerWidth - 16 - w, cx - w / 2));
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.cssText = [
    "position:fixed", `left:${left}px`, `width:${w}px`, `bottom:${innerHeight - r.top + 6}px`, "z-index:200", "pointer-events:none",
    "display:flex", "justify-content:center",
  ].join(";");
  const inner = document.createElement("span");
  inner.textContent = lines[i];
  inner.style.cssText = [
    "display:inline-block", "background:#fff", "color:#15082E", "border:2.5px solid #15082E", "box-shadow:0 3px 0 #15082E",
    "border-radius:18px", "padding:7px 12px", "font-weight:800", "font-size:14px", "line-height:1.25", "text-align:center",
    "text-wrap:balance", `transform-origin:${Math.round(cx - left)}px 100%`,
  ].join(";");
  el.appendChild(inner);
  document.body.appendChild(el);
  playSfx("pop", { volume: 0.35, rate: 0.9 });
  const a = inner.animate(
    [
      { opacity: 0, transform: "scale(0.4)" },
      { opacity: 1, transform: "scale(1.06)", offset: 0.1 },
      { opacity: 1, transform: "scale(1)", offset: 0.16 },
      { opacity: 1, transform: "scale(1)", offset: 0.86 },
      { opacity: 0, transform: "scale(0.6)" },
    ],
    { duration: BUBBLE_MS, easing: "ease-out", fill: "both" },
  );
  const done = () => { el.remove(); busy = false; };
  a.onfinish = done;
  a.oncancel = done;
}
