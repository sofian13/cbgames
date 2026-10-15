import { useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { createPortal } from "react-dom";
import { Palette, Undo2 } from "lucide-react";
import { useT, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { haptic, reducedMotion } from "./util";
import { BG_THEME_NAMES, nextBgTheme, type BgTheme } from "./bg-theme";

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

const SECRET: I18n<{ unlocked: string; back: string; hint: string; aria: string }> = {
  fr: { unlocked: "Thème secret débloqué !", back: "Retour au thème normal", hint: "… ?", aria: "zinzin (touche-moi)" },
  en: { unlocked: "Secret theme unlocked!", back: "Back to the normal theme", hint: "…?", aria: "zinzin (tap me)" },
  es: { unlocked: "¡Tema secreto desbloqueado!", back: "Vuelta al tema normal", hint: "…¿?", aria: "zinzin (tócame)" },
};

const SECRET_TAPS = 10;
const HINT_TAP = 5;
const SECRET_WINDOW = 6000;

/**
 * Logo de l'accueil : un tap fait sauter les lettres en vague (+ petit son) ;
 * au 5e tap rapide les lettres tremblent fort et un petit « … ? » encourage à continuer ;
 * 10 taps en moins de 6 s → thème de fond secret suivant (bg-theme.ts), le dernier ramène le normal.
 * État local : seul le logo se redessine, jamais l'accueil.
 */
export function TapLogo({ size = 44 }: { size?: number }) {
  const t = useT(SECRET);
  const names = useT(BG_THEME_NAMES);
  const logo = useRef<HTMLSpanElement>(null);
  const taps = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [secret, setSecret] = useState<BgTheme | null>(null);
  const [hint, setHint] = useState(false);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(hintTimer.current); }, []);

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((x) => now - x < SECRET_WINDOW), now];
    const n = taps.current.length;
    haptic();
    playSfx(n % 2 ? "pop" : "pop2", { volume: 0.4, rate: n >= HINT_TAP ? 1 + (n - HINT_TAP) * 0.06 : 1 });
    // Vague : chaque lettre saute un peu après la précédente (couche intérieure : l'animation du logo continue)
    // À partir du 5e tap rapide : les lettres tremblent de plus en plus (ça chauffe…)
    if (!reducedMotion()) {
      const k = n >= HINT_TAP ? 1 + (n - HINT_TAP + 1) * 0.12 : 1;
      logo.current?.querySelectorAll<HTMLElement>(".zz-letter-jump").forEach((el, i) => {
        if (typeof el.animate !== "function") return;
        const r = (i % 2 ? 1 : -1) * (k - 1) * 40;
        el.animate(
          [
            { transform: "translateY(0) scale(1, 1) rotate(0deg)" },
            { transform: `translateY(4%) scale(1.08, 0.9) rotate(${r}deg)`, offset: 0.15 },
            { transform: `translateY(${-30 * k}%) scale(0.94, 1.08) rotate(${-r}deg)`, offset: 0.45 },
            { transform: `translateY(0) scale(1.05, 0.95) rotate(${r * 0.5}deg)`, offset: 0.75 },
            { transform: "translateY(0) scale(1, 1) rotate(0deg)" },
          ],
          { duration: 520, delay: i * 55, easing: "ease-out" },
        );
      });
    }
    if (n === HINT_TAP) {
      setHint(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(false), 1600);
    }
    if (n >= SECRET_TAPS) {
      taps.current = [];
      setHint(false);
      const theme = nextBgTheme();
      setSecret(theme);
      playSfx(theme === "normal" ? "pop2" : "tada", { volume: 0.45 });
      haptic("success");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSecret(null), 2800);
    }
  };

  return (
    <>
      <span className="relative block">
        <button type="button" onClick={tap} aria-label={t.aria} className="block leading-none" style={{ WebkitTapHighlightColor: "transparent" }}>
          <ZLogo size={size} jumpRef={logo} />
        </button>
        {hint && (
          <span aria-hidden className="zz-logo-hint zz-stk-sm pointer-events-none absolute -right-5 -top-3 rounded-full px-2 py-0.5 text-[14px] font-extrabold"
            style={{ background: "#fff", color: "var(--zz-ink)" }}>
            {t.hint}
          </span>
        )}
      </span>
      {secret && createPortal(
        <div className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-6" style={{ top: "calc(var(--sat) + 12px)" }} role="status">
          <div className="zz-pop zz-stk-sm flex items-center gap-2 rounded-[22px] px-4 py-2.5"
            style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-2deg" }}>
            {secret === "normal" ? <Undo2 size={20} strokeWidth={2.6} aria-hidden /> : <Palette size={20} strokeWidth={2.6} aria-hidden />}
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold">{secret === "normal" ? t.back : t.unlocked}</span>
              {secret !== "normal" && <span className="text-[13px] font-semibold" style={{ opacity: 0.75 }}>{names[secret]}</span>}
            </span>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
