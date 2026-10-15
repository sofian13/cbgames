import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ZBlob } from "./ZBlob";
import { haptic, reducedMotion } from "./util";
import { type Lang, useLang } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { baseLook } from "@/lib/avatar/look";
import { SECRET_GOLD_HAT, unlockSecret } from "@/lib/avatar/secrets";

/**
 * Secret de l'accueil : LE BLOB DORÉ. Environ 1 ouverture de l'accueil sur 40 (jamais deux fois
 * de suite, jamais pendant les 3 premières), un blob en or traverse l'accueil en sautillant, entre
 * le fond et les cartes. Le toucher (zone généreuse, même par-dessus une carte) → « bling »,
 * confettis dorés, vibration, et l'accessoire secret « Auréole dorée » est débloqué (même sans
 * Zinzin+). Raté : il repassera une autre fois. Aucun texte ni indice tant qu'il n'est pas trouvé.
 * Animation : un seul élément déplacé en transform (rAF), confettis sur un canvas éphémère.
 * Dev : `?zzgold` dans l'URL (serveur Vite) → il passe à chaque ouverture.
 */

const RATE = 1 / 40;
const MIN_OPENINGS = 3;
const N_KEY = "zz-gb-n";
const LAST_KEY = "zz-gb-last";
const SIZE = 88;
/** Rayon de toucher autour du centre (généreux : il bouge) */
const HIT = SIZE * 0.5 + 30;

// Or métallique (plus profond que le jaune des blobs de jeux) : reflet presque blanc, ombre bronze
const GOLD = { body: "#F2B200", deep: "#8F5600", hi: "#FFFBE0", ink: "#2A1A00" };

const TEXT: Record<Lang, { title: string; sub: string; again: string; againSub: string }> = {
  fr: { title: "Tu as trouvé le blob doré !", sub: "Accessoire secret débloqué : l'Auréole dorée (dans « Ma bande »)", again: "Encore toi ? Le blob doré t'adore.", againSub: "Ton Auréole dorée brille encore plus fort" },
  en: { title: "You found the golden blob!", sub: "Secret item unlocked: the Golden halo (in “My crew”)", again: "You again? The golden blob loves you.", againSub: "Your Golden halo shines even brighter" },
  es: { title: "¡Encontraste el blob dorado!", sub: "Accesorio secreto desbloqueado: la Aureola dorada (en «Mi grupo»)", again: "¿Otra vez tú? El blob dorado te adora.", againSub: "Tu Aureola dorada brilla aún más" },
};

const num = (k: string) => {
  try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; }
};
const save = (k: string, v: number) => {
  try { localStorage.setItem(k, String(v)); } catch { /* stockage indisponible */ }
};
const devForced = () => import.meta.env.DEV && /[?&]zzgold\b/.test(location.search);

/** Nouvelle ouverture de l'accueil : le blob doré passe-t-il cette fois ? */
function drawOpening(): boolean {
  const n = num(N_KEY) + 1;
  save(N_KEY, n);
  if (devForced()) return true;
  if (n <= MIN_OPENINGS) return false;
  if (num(LAST_KEY) === n - 1) return false; // jamais deux fois de suite
  return Math.random() < RATE;
}

/* ───────── Trajectoire : sauts, pause « je regarde autour », puis grand bond ───────── */
type Seg = { d: number; x0: number; x1: number; h: number; spin?: number; wiggle?: boolean };
function path(W: number): Seg[] {
  const mid = W * 0.4;
  return [
    { d: 760, x0: -SIZE * 1.1, x1: mid * 0.32, h: 50 },
    { d: 700, x0: mid * 0.32, x1: mid * 0.7, h: 40 },
    { d: 640, x0: mid * 0.7, x1: mid, h: 30 },
    { d: 900, x0: mid, x1: mid, h: 0, wiggle: true },
    { d: 520, x0: mid, x1: mid + W * 0.16, h: 26 },
    { d: 1000, x0: mid + W * 0.16, x1: W + SIZE * 1.2, h: 120, spin: 360 },
  ];
}

type Pos = { x: number; y: number };

export function GoldenBlob({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const lang = useLang();
  const layer = useRef<HTMLDivElement>(null);
  const node = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState<{ id: number; docY: number; dir: 1 | -1 } | null>(null);
  const [won, setWon] = useState<{ id: number; x: number; y: number; again: boolean } | null>(null);
  const pos = useRef<Pos | null>(null);
  const caught = useRef(false);

  // Chaque apparition de l'accueil (lancement, retour d'un jeu) = une ouverture
  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    let shown = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tryStart = (tries: number) => {
      const home = homeRef.current;
      if (!home || !shown) return;
      // Accueil au premier plan seulement (pas d'écran de lancement, fiche ou réglages par-dessus)
      const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      if (!top || !home.contains(top) || document.visibilityState !== "visible") {
        if (tries > 0) timer = setTimeout(() => tryStart(tries - 1), 1000);
        return;
      }
      const docY = pickLane(home) + home.scrollTop;
      save(LAST_KEY, num(N_KEY));
      caught.current = false;
      setRun({ id: Date.now(), docY, dir: Math.random() < 0.5 ? 1 : -1 });
    };
    const io = new IntersectionObserver((entries) => {
      const now = entries.some((e) => e.isIntersecting);
      if (now && !shown) {
        shown = true;
        if (drawOpening()) timer = setTimeout(() => tryStart(30), devForced() ? 1200 : 1800 + Math.random() * 2500);
      } else if (!now && shown) {
        shown = false;
        clearTimeout(timer);
        setRun(null); // accueil masqué (jeu lancé) : il file
      }
    });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [homeRef]);

  // Course : transform seulement, rAF ; suit le défilement de l'accueil (il est « dans » la page)
  useEffect(() => {
    if (!run) return;
    const home = homeRef.current;
    const el = node.current;
    if (!home || !el) return;
    const W = innerWidth;
    const segs = path(W);
    const total = segs.reduce((a, s) => a + s.d, 0);
    const reduce = reducedMotion();
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      if (caught.current) return;
      let t = now - t0;
      if (t >= total) { pos.current = null; setRun(null); return; }
      let i = 0;
      while (t > segs[i].d) { t -= segs[i].d; i++; }
      const s = segs[i];
      const u = t / s.d;
      const xr = s.x0 + (s.x1 - s.x0) * (s.spin ? u * u * 0.6 + u * 0.4 : u);
      const x = run.dir > 0 ? xr : W - xr - SIZE;
      const hop = reduce ? 0 : 4 * s.h * u * (1 - u);
      const y = run.docY - home.scrollTop - SIZE / 2 - hop;
      // Écrasé à l'atterrissage, étiré en l'air ; se dandine pendant la pause
      const land = Math.max(0, 1 - Math.min(u, 1 - u) * 9);
      const sq = s.h ? (u < 0.12 || u > 0.88 ? land * 0.16 : -0.06) : 0.03 * Math.sin(t / 70);
      const rot = s.wiggle ? 14 * Math.sin(t / 110) * run.dir : (s.spin ? s.spin * u : (u - 0.5) * 16) * run.dir;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg) scale(${(1 + sq).toFixed(3)}, ${(1 - sq).toFixed(3)})`;
      pos.current = { x: x + SIZE / 2, y: y + SIZE / 2 };
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); pos.current = null; };
  }, [run, homeRef]);

  // Toucher : test de distance au doigt (le blob est sous les cartes : on capte le toucher avant elles)
  useEffect(() => {
    if (!run) return;
    const home = homeRef.current;
    if (!home) return;
    let swallow = false;
    const catchIt = (p: Pos) => {
      const isNew = unlockSecret(SECRET_GOLD_HAT);
      // Gros « bling » : cloche claire + pièces + carillon
      playSfx("ding2", { volume: 0.9, rate: 1.25 });
      playSfx("coins", { volume: 0.55, delay: 0.05 });
      playSfx("chime", { volume: 0.5, delay: 0.12 });
      haptic("success");
      try { navigator.vibrate?.([40, 60, 40]); } catch { /* indispo */ }
      // Arrêt net + « boing » de joie, puis il s'envole en tournoyant
      const el = inner.current;
      if (el && typeof el.animate === "function" && !reducedMotion()) {
        el.animate(
          [
            { transform: "scale(1,1)" },
            { transform: "scale(1.3,0.7)", offset: 0.14 },
            { transform: "scale(0.82,1.25)", offset: 0.34 },
            { transform: "scale(1.1,0.92)", offset: 0.5 },
            { transform: "scale(1,1)", offset: 0.62 },
            { transform: "translateY(-30px) scale(1.05) rotate(-20deg)", offset: 0.8, opacity: 1 },
            { transform: "translateY(-160px) scale(0.3) rotate(340deg)", opacity: 0 },
          ],
          { duration: 1500, easing: "ease-out", fill: "forwards" },
        );
      }
      setWon({ id: Date.now(), x: p.x, y: p.y, again: !isNew });
      setTimeout(() => { pos.current = null; setRun(null); }, 1550);
    };
    const onDown = (e: PointerEvent) => {
      const p = pos.current;
      if (!p || caught.current) return;
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > HIT) return;
      caught.current = true;
      swallow = true; // la carte touchée par la même occasion ne s'ouvre pas
      setTimeout(() => { swallow = false; }, 700);
      catchIt(p);
    };
    const onClick = (e: MouseEvent) => {
      if (!swallow) return;
      swallow = false;
      e.stopPropagation();
      e.preventDefault();
    };
    home.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    home.addEventListener("click", onClick, true);
    return () => {
      home.removeEventListener("pointerdown", onDown, { capture: true });
      home.removeEventListener("click", onClick, true);
    };
  }, [run, homeRef]);

  const t = TEXT[lang] ?? TEXT.fr;
  return (
    <>
      <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        {run && (
          <div key={run.id} ref={node} data-zz-gold className="absolute left-0 top-0" style={{ width: SIZE, height: SIZE, transform: "translate3d(-300px, -300px, 0)", willChange: "transform" }}>
            <div ref={inner} className="relative h-full w-full" style={{ transformOrigin: "50% 90%" }}>
              <div className="zz-gold-glow" />
              <ZBlob size={SIZE} palette={GOLD} mood="laughing" seed={3} speed={1.6} shadow={false} outline gloss hop={false} />
              <Sparkle className="zz-gold-spk" style={{ left: -10, top: 4, width: 18 }} />
              <Sparkle className="zz-gold-spk" style={{ right: -12, top: 18, width: 14, animationDelay: "-0.5s" }} />
              <Sparkle className="zz-gold-spk" style={{ left: 30, top: -14, width: 12, animationDelay: "-1s" }} />
              <Sparkle className="zz-gold-spk" style={{ right: 4, bottom: -6, width: 12, animationDelay: "-0.25s" }} />
              <Sparkle className="zz-gold-spk" style={{ left: -4, bottom: 10, width: 10, animationDelay: "-0.75s" }} />
              <Sparkle className="zz-gold-spk" style={{ right: 20, top: -18, width: 16, animationDelay: "-0.35s" }} />
            </div>
          </div>
        )}
      </div>
      {won && typeof document !== "undefined" && createPortal(
        <GoldWin key={won.id} x={won.x} y={won.y} title={won.again ? t.again : t.title} sub={won.again ? t.againSub : t.sub} onDone={() => setWon(null)} />,
        document.body,
      )}
    </>
  );
}

/**
 * Bande horizontale la plus « dégagée » de l'écran (titres de section, marges : pas de carte
 * ni de bouton), pour que le blob se voie entre les cartes. Une vingtaine de sondages, une seule fois.
 */
function pickLane(home: HTMLElement): number {
  const H = innerHeight;
  const W = innerWidth;
  let best = H * 0.55;
  let bestScore = -1;
  for (let k = 0; k <= 10; k++) {
    const y = H * (0.3 + k * 0.05);
    let free = 0;
    for (const fx of [0.08, 0.3, 0.5, 0.7, 0.92]) {
      const hit = document.elementFromPoint(W * fx, y);
      if (hit && home.contains(hit) && !hit.closest("button, a, [role=button], .zz-carousel")) free++;
    }
    // À égalité, plutôt vers le milieu de l'écran
    const score = free - Math.abs(y / H - 0.55) * 0.8;
    if (score > bestScore) { bestScore = score; best = y; }
  }
  return best;
}

function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={`absolute ${className ?? ""}`} style={{ height: "auto", overflow: "visible", ...style }} aria-hidden>
      <path d="M12 1.5c.9 5.2 2.3 6.6 7.5 7.5-5.2.9-6.6 2.3-7.5 7.5-.9-5.2-2.3-6.6-7.5-7.5 5.2-.9 6.6-2.3 7.5-7.5z" fill="#FFF3A0" stroke="#2A1A00" strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

/* ───────── Victoire : confettis dorés (canvas éphémère) + sticker ───────── */
const CONFETTI = ["#FFD23F", "#FFE680", "#FFC21A", "#E09A00", "#FFF6C8", "#FFFFFF"];

function GoldWin({ x, y, title, sub, onDone }: { x: number; y: number; title: string; sub: string; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [out, setOut] = useState(false);

  // Confettis : ~90 paillettes depuis le blob, gravité, 1,8 s
  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const n = reducedMotion() ? 30 : 90;
    const parts = Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      const v = 380 + Math.random() * 520;
      return {
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 14, s: 5 + Math.random() * 7, c: CONFETTI[i % CONFETTI.length], star: i % 5 === 0,
      };
    });
    const t0 = performance.now();
    let last = t0;
    let raf = 0;
    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const t = now - t0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalAlpha = t > 1300 ? Math.max(0, 1 - (t - 1300) / 500) : 1;
      for (const p of parts) {
        p.vy += 1100 * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.star) {
          const k = p.s * 0.9;
          ctx.beginPath();
          ctx.moveTo(0, -k); ctx.quadraticCurveTo(0, 0, k, 0); ctx.quadraticCurveTo(0, 0, 0, k);
          ctx.quadraticCurveTo(0, 0, -k, 0); ctx.quadraticCurveTo(0, 0, 0, -k);
          ctx.fill();
        } else {
          ctx.fillRect(-p.s / 2, -p.s * 0.3, p.s, p.s * 0.6 * Math.abs(Math.cos(p.r * 1.7)) + 1);
        }
        ctx.restore();
      }
      if (t < 1800) raf = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [x, y]);

  // Sticker : reste ~4 s (toucher = fermer)
  useEffect(() => {
    const a = setTimeout(() => setOut(true), 4200);
    return () => clearTimeout(a);
  }, []);
  useEffect(() => {
    if (!out) return;
    const b = setTimeout(onDone, 260);
    return () => clearTimeout(b);
  }, [out, onDone]);

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 60 }}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 flex justify-center px-5" style={{ top: "calc(var(--sat, 0px) + 18%)" }}>
        <button
          type="button"
          onClick={() => setOut(true)}
          role="status"
          className={`zz-stk pointer-events-auto flex max-w-[360px] items-center gap-3 rounded-[24px] py-3 pl-2 pr-4 text-left ${out ? "zz-gold-out" : "zz-gold-in"}`}
          style={{ background: "linear-gradient(135deg, #FFF6C8, #FFD23F 45%, #FFC21A)", color: "var(--zz-ink)", rotate: "-2deg" }}
        >
          <span className="grid shrink-0 place-items-center" style={{ width: 66, height: 70, paddingTop: 12 }}>
            <AvatarBlob look={{ ...baseLook("yellow"), hat: SECRET_GOLD_HAT, eyes: "star" }} size={54} mood="laughing" />
          </span>
          <span className="min-w-0">
            <span className="zz-title block text-[22px]" style={{ lineHeight: 1 }}>{title}</span>
            <span className="mt-1 block text-[13.5px] font-bold leading-snug" style={{ opacity: 0.82 }}>{sub}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
