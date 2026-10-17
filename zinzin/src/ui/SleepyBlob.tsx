import { useEffect, useState, type RefObject } from "react";
import { playSfx } from "@/lib/sfx";
import { haptic, reducedMotion } from "./util";
import { foundSecret } from "@/lib/secrets-found";

/**
 * Secret de l'accueil : après ~30 s sur l'accueil (même en touchant ; ouvrir un jeu remet à zéro) (app au premier plan, rien d'ouvert
 * par-dessus), le blob d'une carte visible s'endort peu à peu : paupières qui tombent, légère
 * respiration, « Zzz » qui montent. Au premier toucher n'importe où, il se réveille en sursaut
 * (petit saut + pop doux) et redevient normal.
 * Tout passe par des classes CSS posées sur le blob choisi (zinzin.css) : l'accueil ne se
 * redessine jamais, seul ce composant (les « Zzz ») a un état.
 */

const IDLE_MS = 30_000;

/** Délai d'endormissement ; en dev, `?zzSleep=3` (secondes) pour tester sans attendre. */
function idleDelay(): number {
  if (import.meta.env.DEV && typeof location !== "undefined") {
    const v = Number(new URLSearchParams(location.search).get("zzSleep"));
    if (v > 0) return v * 1000;
  }
  return IDLE_MS;
}

/** Visible en entier, yeux ouverts (paupières animables), et rien par-dessus. */
function sleepable(home: HTMLElement, el: HTMLElement): boolean {
  if (!el.querySelector(".zb-blink")) return false; // lunettes, yeux fermés… : pas de paupières
  const r = el.getBoundingClientRect();
  if (r.top < 40 || r.left < 0 || r.right > innerWidth || r.bottom > innerHeight - 20) return false;
  // Rien par-dessus (fiche, réglages, paywall…) : le centre du blob appartient bien à l'accueil
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!hit && hit.closest(".zz-home") === home;
}

/** Le blob qui s'endort : celui d'une carte de jeu visible, sinon celui de la carte « à la une ». */
function pickBlob(home: HTMLElement): HTMLElement | null {
  const r0 = home.getBoundingClientRect();
  if (!r0.width || !r0.height) return null; // accueil masqué (jeu, Soirée…)
  const rails = Array.from(home.querySelectorAll<HTMLElement>(".zz-rail .zz-cblob")).filter((el) => sleepable(home, el));
  if (rails.length) return rails[Math.floor(Math.random() * rails.length)];
  // Carrousel : enveloppe du blob (le défilement auto s'arrête tant qu'il dort, voir Home.tsx)
  const featured = Array.from(home.querySelectorAll<HTMLElement>(".zz-carousel .zb"))
    .map((el) => el.parentElement)
    .filter((el): el is HTMLElement => !!el && sleepable(home, el));
  return featured[0] ?? null;
}

/** Réveil en sursaut : petit saut étiré + yeux grands ouverts. */
function startle(el: HTMLElement) {
  el.classList.add("zz-startled");
  setTimeout(() => el.classList.remove("zz-startled"), 560);
  if (reducedMotion() || typeof el.animate !== "function") return;
  el.animate(
    [
      { transform: "translateY(0) scale(1, 1) rotate(0deg)" },
      { transform: "translateY(4%) scale(1.12, 0.86) rotate(0deg)", offset: 0.12 },
      { transform: "translateY(-34%) scale(0.88, 1.14) rotate(-7deg)", offset: 0.42 },
      { transform: "translateY(0) scale(1.1, 0.9) rotate(4deg)", offset: 0.72 },
      { transform: "translateY(0) scale(1, 1) rotate(0deg)" },
    ],
    { duration: 560, easing: "ease-out" },
  );
}

/** L'accueil est-il réellement à l'écran (pas recouvert par un jeu ou une fiche) ? */
function homeVisible(home: HTMLElement): boolean {
  const r = home.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
  return !!top && home.contains(top);
}

export function SleepyBlob({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  // Position des « Zzz » (au-dessus du blob endormi), ou null
  const [zzz, setZzz] = useState<{ x: number; y: number; px: number; dx: 1 | -1 } | null>(null);

  useEffect(() => {
    const delay = idleDelay();
    let last = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let asleep: HTMLElement | null = null;

    // Un seul minuteur : à l'échéance, on vérifie le temps écoulé depuis le dernier toucher
    const check = () => {
      const left = last + delay - performance.now();
      if (left > 50) { timer = setTimeout(check, left); return; }
      const home = homeRef.current;
      const el = home && !document.hidden ? pickBlob(home) : null;
      // Personne d'endormable pour l'instant (carrousel en train de glisser, haut de page…) : on réessaie bientôt
      // Accueil masqué (jeu ou fiche ouverts) : le compte repart de zéro au retour
      if (!el) { if (!home || document.hidden || !homeVisible(home)) last = performance.now(); timer = setTimeout(check, Math.min(delay, 3000)); return; }
      asleep = el;
      el.classList.add("zz-dozing");
      const r = el.getBoundingClientRect();
      // Au-dessus d'un coin de la tête, côté où il reste de la place
      const right = r.right + 70 < innerWidth;
      setZzz({ x: r.left + r.width * (right ? 0.8 : 0.12), y: r.top + r.height * 0.22, px: Math.max(16, Math.round(r.width * 0.18)), dx: right ? 1 : -1 });
    };

    const wake = () => {
      const el = asleep;
      asleep = null;
      setZzz(null);
      if (!el) return;
      el.classList.remove("zz-dozing");
      foundSecret("sleepy");
      startle(el);
      haptic();
      playSfx("pop", { volume: 0.32, rate: 1.25 });
    };

    // Toucher l'écran n'empêche PAS l'endormissement (30 s sur l'accueil quoi qu'il arrive) ;
    // il réveille seulement le blob, et le compte repart alors de zéro.
    const onAct = () => {
      if (asleep) {
        last = performance.now();
        wake();
        clearTimeout(timer);
        timer = setTimeout(check, delay);
      }
    };
    // Retour au premier plan : on recommence à compter
    const onVis = () => { if (!document.hidden) { last = performance.now(); onAct(); } };

    timer = setTimeout(check, delay);
    addEventListener("pointerdown", onAct, { capture: true, passive: true });
    addEventListener("keydown", onAct, { capture: true });
    addEventListener("wheel", onAct, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(timer);
      asleep?.classList.remove("zz-dozing");
      removeEventListener("pointerdown", onAct, { capture: true });
      removeEventListener("keydown", onAct, { capture: true });
      removeEventListener("wheel", onAct, { capture: true });
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [homeRef]);

  if (!zzz) return null;
  return (
    <div aria-hidden className="zz-zzz" style={{ left: zzz.x, top: zzz.y, ["--zz-dx" as string]: zzz.dx }}>
      {/* Montent l'un après l'autre (après que les paupières sont tombées) */}
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ fontSize: zzz.px * (0.8 + i * 0.25), translate: `${zzz.dx * i * 0.45}em ${-i * 0.7}em`, animationDelay: `${2.4 + i * 1.1}s` }}>z</span>
      ))}
    </div>
  );
}
