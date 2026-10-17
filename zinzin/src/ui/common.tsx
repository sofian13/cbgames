import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { UI } from "../strings";
import { reducedMotion } from "./util";
import { uiSfx } from "@/lib/ui-sfx";

/** Délai pendant lequel un fond qui vient d'apparaître ignore les taps (double tap sur le bouton d'ouverture). */
export const TAP_GUARD_MS = 400;

/**
 * Écran qui vient d'apparaître : `ready()` est faux pendant TAP_GUARD_MS. Le 2e tap d'un double tap
 * sur l'écran d'avant (même endroit) ne déclenche pas le bouton du nouvel écran (sauter un jeu…).
 */
export function useTapReady(): () => boolean {
  const [at] = useState(() => performance.now());
  return useCallback(() => performance.now() - at > TAP_GUARD_MS, [at]);
}

/** Hauteur (px) du haut de la fiche où le glisser vers le bas démarre toujours (poignée, en-tête). */
const GRAB_ZONE = 72;

/** Plus proche conteneur qui défile verticalement entre `el` et `root` (exclu). */
function scrollerOf(el: Element | null, root: HTMLElement): HTMLElement | null {
  for (let n = el; n && n !== root; n = n.parentElement) {
    if (!(n instanceof HTMLElement)) continue;
    const oy = getComputedStyle(n).overflowY;
    if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) return n;
  }
  return null;
}

/**
 * Glisser pour fermer (geste iOS) : la fiche suit le doigt vers le bas ; fermée si on l'a tirée
 * de plus de 25 % de sa hauteur ou lancée vite, sinon elle revient en place (ressort).
 * Le geste ne démarre que depuis le haut de la fiche (poignée / en-tête) ou quand le contenu
 * est déjà tout en haut : le défilement interne reste intact. Utilise `translate` (et pas
 * `transform`, tenu par les animations d'entrée/sortie).
 */
function useDragToClose(
  panel: RefObject<HTMLDivElement | null>,
  backdrop: RefObject<HTMLDivElement | null>,
  dismiss: () => void,
) {
  const dismissRef = useRef(dismiss);
  useEffect(() => { dismissRef.current = dismiss; });
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    type G = { id: number; x0: number; y0: number; grab: boolean; scroller: HTMLElement | null; state: "wait" | "drag" | "no"; dy: number; samples: { t: number; y: number }[] };
    let g: G | null = null;

    const setDim = (dy: number) => {
      const bd = backdrop.current;
      if (!bd) return;
      bd.style.animation = "none";
      bd.style.transition = "none";
      bd.style.opacity = String(Math.max(0, 1 - dy / Math.max(1, el.offsetHeight)));
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { g = null; return; }
      const t = e.touches[0];
      const target = e.target as Element | null;
      // Curseurs, champs : jamais de glisser (on règle une valeur, on sélectionne du texte)
      if (target?.closest("input, textarea, select, [data-no-drag]")) { g = null; return; }
      const top = el.getBoundingClientRect().top;
      g = {
        id: t.identifier, x0: t.clientX, y0: t.clientY, grab: t.clientY - top < GRAB_ZONE,
        scroller: scrollerOf(target, el), state: "wait", dy: 0, samples: [{ t: performance.now(), y: t.clientY }],
      };
    };

    const onMove = (e: TouchEvent) => {
      if (!g || g.state === "no") return;
      const t = Array.from(e.touches).find((x) => x.identifier === g!.id);
      if (!t) return;
      const dx = t.clientX - g.x0, dy = t.clientY - g.y0;
      if (g.state === "wait") {
        const atTop = !g.scroller || g.scroller.scrollTop <= 0;
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          // Pas encore décidé : on empêche déjà le défilement de partir (iOS le verrouille dès le 1er mouvement)
          if (dy > 0 && (g.grab || atTop) && e.cancelable) e.preventDefault();
          return;
        }
        // Vers le bas, plutôt vertical, depuis la poignée ou un contenu déjà en haut
        if (dy > 0 && Math.abs(dy) >= Math.abs(dx) && (g.grab || atTop)) {
          g.state = "drag";
          g.y0 = t.clientY; // pas de saut : la fiche part d'où est le doigt
          el.style.transition = "none";
          el.style.willChange = "translate"; // la fiche glisse sur son propre calque, sans rien repeindre
        } else { g.state = "no"; return; }
      }
      if (e.cancelable) e.preventDefault(); // la fiche bouge, pas le contenu
      const d = t.clientY - g.y0;
      // Vers le haut : forte résistance (on ne décolle pas la fiche du bas)
      g.dy = d >= 0 ? d : -Math.sqrt(-d) * 2;
      el.style.translate = `0 ${g.dy.toFixed(1)}px`;
      setDim(Math.max(0, g.dy));
      g.samples.push({ t: performance.now(), y: t.clientY });
      if (g.samples.length > 6) g.samples.shift();
    };

    const onEnd = (e: TouchEvent) => {
      if (!g) return;
      if (Array.from(e.touches).some((x) => x.identifier === g!.id)) return;
      const cur = g;
      g = null;
      el.style.willChange = "";
      if (cur.state !== "drag") return;
      // Vitesse sur les ~100 dernières ms (px/ms, positive vers le bas)
      const last = cur.samples[cur.samples.length - 1];
      const first = cur.samples.find((s) => last.t - s.t <= 100) ?? cur.samples[0];
      // (doigt arrêté avant de lâcher : pas de lancer)
      const v = last.t > first.t && performance.now() - last.t < 120 ? (last.y - first.y) / (last.t - first.t) : 0;
      const h = el.offsetHeight;
      const reduce = reducedMotion();
      const bd = backdrop.current;
      if (cur.dy > h * 0.25 || (v > 0.5 && cur.dy > 12)) {
        // Fermeture : continue sur sa lancée jusqu'en bas
        const rest = h + 40 - cur.dy;
        const ms = reduce ? 0 : Math.round(Math.min(280, Math.max(140, rest / Math.max(v, 1.6))));
        el.style.transition = ms ? `translate ${ms}ms cubic-bezier(0.25, 0.8, 0.4, 1)` : "none";
        el.style.translate = `0 ${h + 40}px`;
        if (bd) { bd.style.transition = ms ? `opacity ${ms}ms ease` : "none"; bd.style.opacity = "0"; }
        dismissRef.current();
      } else {
        // Retour en place, avec un petit ressort
        el.style.transition = reduce ? "none" : "translate 420ms cubic-bezier(0.34, 1.32, 0.64, 1)";
        el.style.translate = "0 0";
        if (bd) { bd.style.transition = reduce ? "none" : "opacity 300ms ease"; bd.style.opacity = "1"; }
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [panel, backdrop]);
}

/** Bottom sheet avec animation d'entrée/sortie, à fermer aussi en la tirant vers le bas. `children` reçoit `close`. */
export function Sheet({
  onClose, children, maxHeight = "92dvh", bg = "var(--zz-bg-2)", label,
}: {
  onClose: () => void;
  children: (close: () => void) => ReactNode;
  maxHeight?: string;
  bg?: string;
  label: string;
}) {
  const [out, setOut] = useState(false);
  // Fiche lâchée vers le bas : elle finit sa course elle-même (pas d'animation de sortie en plus)
  const [dragged, setDragged] = useState(false);
  const close = useCallback(() => {
    if (out || dragged) return;
    uiSfx.close();
    setOut(true);
    setTimeout(onClose, 250);
  }, [out, dragged, onClose]);
  // Double tap sur le bouton qui ouvre la fiche : le 2e tap tombe sur le fond, il ne doit pas la refermer
  const [openedAt] = useState(() => performance.now());
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const dismissDragged = useCallback(() => {
    if (out || dragged) return;
    uiSfx.close();
    setDragged(true);
    setTimeout(onClose, reducedMotion() ? 0 : 240);
  }, [out, dragged, onClose]);
  useDragToClose(panel, backdrop, dismissDragged);

  return (
    <div className="fixed inset-0" style={{ zIndex: 40 }} role="dialog" aria-modal aria-label={label}>
      <div ref={backdrop} className={`zz-backdrop ${out ? "is-out" : ""}`} onClick={() => { if (performance.now() - openedAt > TAP_GUARD_MS) close(); }} />
      <div
        ref={panel}
        className={`zz-sheet ${out ? "is-out" : ""} absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-lg flex-col overflow-hidden`}
        style={{ maxHeight, background: bg, borderRadius: "32px 32px 0 0", border: "3px solid var(--zz-ink)", borderBottom: 0, boxShadow: "0 -20px 60px rgba(0,0,0,0.45)" }}
      >
        {children(close)}
      </div>
    </div>
  );
}

/** Bouton rond ≥ 44 px façon sticker (fermer, réglages…). */
export function RoundBtn({
  onClick, label, children, style, className,
}: { onClick: () => void; label: string; children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`zz-push zz-stk-sm grid h-11 w-11 shrink-0 place-items-center rounded-full ${className ?? ""}`}
      style={{ background: "#fff", color: "var(--zz-ink)", ...style }}
    >
      {children}
    </button>
  );
}

export function CloseBtn({ onClick, style }: { onClick: () => void; style?: CSSProperties }) {
  const t = useT(UI);
  return (
    <RoundBtn onClick={onClick} label={t.close} style={style}>
      <X size={22} strokeWidth={3} />
    </RoundBtn>
  );
}

/** Gros bouton plein, contour épais + ombre dure (l'action principale). */
export function BigBtn({
  onClick, children, bg, color = "var(--zz-ink)", disabled, className, style, label,
}: {
  onClick: () => void;
  children: ReactNode;
  bg: string;
  color?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`zz-push zz-stk zz-title flex h-[62px] w-full items-center justify-center gap-2 rounded-full text-[22px] ${className ?? ""}`}
      style={{ background: bg, color, letterSpacing: "-0.01em", ...style }}
    >
      {children}
    </button>
  );
}

/** Étiquette « sticker » inclinée (Nouveau, 18+, Gratuit…), en phrase normale. */
export function Tag({ children, bg, color = "var(--zz-ink)", tilt = -3, style }: { children: ReactNode; bg: string; color?: string; tilt?: number; style?: CSSProperties }) {
  return (
    <span
      className="inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-[13px] font-bold leading-none"
      style={{ background: bg, color, border: "2px solid var(--zz-ink)", boxShadow: "0 2px 0 var(--zz-ink)", rotate: `${tilt}deg`, ...style }}
    >
      {children}
    </span>
  );
}

/** Petit toast éphémère en bas d'écran. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = msg ? (
    <div className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-6" style={{ top: "calc(var(--sat) + 12px)" }} role="status">
      <div
        key={msg}
        className="zz-pop zz-stk-sm rounded-full px-5 py-3 text-center text-[15px] font-bold"
        style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-1.5deg" }}
      >
        {msg}
      </div>
    </div>
  ) : null;
  return { show, node };
}
