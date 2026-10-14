import { useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { createPortal } from "react-dom";
import { Medal } from "lucide-react";
import { useT, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { haptic, reducedMotion } from "./util";

/**
 * Logo « zinzin » multicolore (même que sur le site) : lettres stickers
 * contourées qui sautillent chacune leur tour.
 */
const LETTERS = [
  { l: "z", r: -6, c: "#FFD23F" },
  { l: "i", r: 4, c: "#FF3EA5" },
  { l: "n", r: -3, c: "#3DDC97" },
  { l: "z", r: 5, c: "#4ECDC4" },
  { l: "i", r: -5, c: "#FF6B5B" },
  { l: "n", r: 3, c: "#A98BFF" },
];

export function ZLogo({ size = 40, className = "", style, jumpRef }: {
  size?: number; className?: string; style?: CSSProperties;
  /** Logo touchable : chaque lettre a une couche intérieure pour le saut (l'animation habituelle reste sur la lettre) */
  jumpRef?: Ref<HTMLSpanElement>;
}) {
  return (
    <span ref={jumpRef} role="img" aria-label="zinzin" className={`zz-wordmark inline-block select-none whitespace-nowrap ${className}`} style={{ fontSize: size, ...style }}>
      {LETTERS.map((x, i) => (
        <span
          key={i}
          aria-hidden
          className="zz-letter"
          style={{ color: x.c, ["--r" as string]: `${x.r}deg`, ["--d" as string]: `${i * 110}ms` }}
        >
          {jumpRef ? <span className="zz-letter-jump" style={{ display: "inline-block" }}>{x.l}</span> : x.l}
        </span>
      ))}
    </span>
  );
}

const SECRET: I18n<{ secret: string; aria: string }> = {
  fr: { secret: "Ok ok, t'es zinzin officiellement", aria: "zinzin (touche-moi)" },
  en: { secret: "Okay okay, you're officially zinzin", aria: "zinzin (tap me)" },
  es: { secret: "Vale, vale, eres zinzin oficialmente", aria: "zinzin (tócame)" },
};

const SECRET_TAPS = 10;
const SECRET_WINDOW = 6000;

/**
 * Logo de l'accueil : un tap fait sauter les lettres en vague (+ petit son) ;
 * 10 taps en moins de 6 s → message secret discret.
 */
export function TapLogo({ size = 44 }: { size?: number }) {
  const t = useT(SECRET);
  const logo = useRef<HTMLSpanElement>(null);
  const taps = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [secret, setSecret] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((x) => now - x < SECRET_WINDOW), now];
    const n = taps.current.length;
    haptic();
    playSfx(n % 2 ? "pop" : "pop2", { volume: 0.4 });
    // Vague : chaque lettre saute un peu après la précédente (couche intérieure : l'animation du logo continue)
    if (!reducedMotion()) {
      logo.current?.querySelectorAll<HTMLElement>(".zz-letter-jump").forEach((el, i) => {
        if (typeof el.animate !== "function") return;
        el.animate(
          [
            { transform: "translateY(0) scale(1, 1)" },
            { transform: "translateY(4%) scale(1.08, 0.9)", offset: 0.15 },
            { transform: "translateY(-30%) scale(0.94, 1.08)", offset: 0.45 },
            { transform: "translateY(0) scale(1.05, 0.95)", offset: 0.75 },
            { transform: "translateY(0) scale(1, 1)" },
          ],
          { duration: 520, delay: i * 55, easing: "ease-out" },
        );
      });
    }
    if (n >= SECRET_TAPS) {
      taps.current = [];
      setSecret(true);
      playSfx("tada", { volume: 0.45 });
      haptic("success");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSecret(false), 2800);
    }
  };

  return (
    <>
      <button type="button" onClick={tap} aria-label={t.aria} className="block leading-none" style={{ WebkitTapHighlightColor: "transparent" }}>
        <ZLogo size={size} jumpRef={logo} />
      </button>
      {secret && createPortal(
        <div className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-6" style={{ top: "calc(var(--sat) + 12px)" }} role="status">
          <div className="zz-pop zz-stk-sm flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-bold"
            style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-2deg" }}>
            <Medal size={20} strokeWidth={2.6} aria-hidden />
            {t.secret}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
