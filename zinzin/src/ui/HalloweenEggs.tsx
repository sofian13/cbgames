import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useT, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { ZBlob } from "./ZBlob";
import { haptic, reducedMotion } from "./util";
import { foundSecret } from "@/lib/secrets-found";

/**
 * Secrets d'Halloween de l'accueil (seulement en mode Halloween, voir season.ts) :
 * - GhostPass : de temps en temps un fantôme traverse l'écran ; le toucher → « Bouh ! » et il s'évapore.
 * - TrickOrTreat : une citrouille dépasse du bord ; la toucher → « Bonbon ou un sort ? »
 *   (bonbon : pluie de bonbons ; sort : les blobs virent au vert crapaud quelques secondes).
 * - LightsOff : appui long sur le logo (Logo.tsx, événement « zz:lights-off ») → noir complet,
 *   seuls les yeux des blobs brillent, le doigt fait lampe de poche.
 * - Midnight : à minuit pile, l'accueil vire au rouge une minute (« C'est l'heure des monstres… »).
 * Pour tester : window.dispatchEvent(new Event("zz:ghost" | "zz:lights-off" | "zz:midnight")).
 */

const T: I18n<{ boo: string; ask: string; treat: string; trick: string; after: string; midnight: string }> = {
  fr: { boo: "Bouh !", ask: "Bonbon ou un sort ?", treat: "🍬 Bonbon", trick: "🪄 Un sort", after: "Hé hé…", midnight: "Minuit. C'est l'heure des monstres…" },
  en: { boo: "Boo!", ask: "Trick or treat?", treat: "🍬 Treat", trick: "🪄 Trick", after: "Heh heh…", midnight: "Midnight. Monster hour has begun…" },
  es: { boo: "¡Buu!", ask: "¿Truco o trato?", treat: "🍬 Trato", trick: "🪄 Truco", after: "Je, je…", midnight: "Medianoche. Es la hora de los monstruos…" },
};

/** L'accueil est-il réellement à l'écran (pas recouvert par un jeu, une fiche ou les réglages) ? */
function homeVisible(home: HTMLElement | null): boolean {
  if (!home || document.hidden) return false;
  const r = home.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
  return !!top && home.contains(top);
}

/** Blobs (SVG 120×120) visibles à l'écran. */
function visibleBlobs(root: HTMLElement): SVGSVGElement[] {
  return Array.from(root.querySelectorAll<SVGSVGElement>("svg")).filter((s) => {
    if (!/120 120$/.test((s.getAttribute("viewBox") ?? "").trim())) return false;
    const r = s.getBoundingClientRect();
    return r.width > 16 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  });
}

/* ───────── Fantôme qui passe ───────── */

function GhostSvg({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} style={{ display: "block", overflow: "visible" }}>
      <path d="M12 104 V48 a38 38 0 0 1 76 0 V104 l-12.7 -9 -12.7 9 -12.6 -9 -12.6 9 -12.7 -9Z" fill="#F7F3FF" stroke="#15082E" strokeWidth={4.5} strokeLinejoin="round" />
      <ellipse cx={34} cy={30} rx={9} ry={5} fill="#fff" opacity={0.9} transform="rotate(-30 34 30)" />
      <ellipse cx={38} cy={52} rx={7} ry={10} fill="#15082E" />
      <ellipse cx={62} cy={52} rx={7} ry={10} fill="#15082E" />
      <ellipse cx={50} cy={74} rx={6} ry={8} fill="#15082E" />
      <circle cx={28} cy={64} r={4.5} fill="#FF9DD0" opacity={0.6} />
      <circle cx={72} cy={64} r={4.5} fill="#FF9DD0" opacity={0.6} />
    </svg>
  );
}

function GhostPass({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const t = useT(T);
  const [run, setRun] = useState<{ id: number; top: number; ltr: boolean } | null>(null);
  const [caught, setCaught] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let n = 0;
    const show = (force = false) => {
      if (force || homeVisible(homeRef.current)) {
        setCaught(false);
        setRun({ id: ++n, top: innerHeight * (0.22 + Math.random() * 0.45), ltr: Math.random() < 0.5 });
      }
    };
    const plan = (ms: number) => { timer = setTimeout(() => { show(); plan(70_000 + Math.random() * 70_000); }, ms); };
    plan(25_000 + Math.random() * 25_000);
    const test = () => show(true);
    window.addEventListener("zz:ghost", test);
    return () => { clearTimeout(timer); window.removeEventListener("zz:ghost", test); };
  }, [homeRef]);

  // Traversée : glisse d'un bord à l'autre en ondulant (Web Animations), puis disparaît
  useEffect(() => {
    const el = ref.current;
    if (!run || !el || typeof el.animate !== "function") return;
    const from = run.ltr ? -110 : innerWidth + 20, to = run.ltr ? innerWidth + 20 : -110;
    const steps = Array.from({ length: 9 }, (_, i) => {
      const k = i / 8;
      return { transform: `translate(${from + (to - from) * k}px, ${Math.sin(k * Math.PI * 4) * 18}px) scaleX(${run.ltr ? -1 : 1})` };
    });
    const a = el.animate(steps, { duration: reducedMotion() ? 4000 : 8500, easing: "linear", fill: "forwards" });
    a.onfinish = () => setRun((r) => (r?.id === run.id ? null : r));
    return () => a.cancel();
  }, [run]);

  if (!run) return null;
  const boo = () => {
    if (caught) return;
    setCaught(true);
    foundSecret("ghost");
    haptic("success");
    playSfx("ghost-boo", { volume: 0.8 });
    const el = ref.current;
    el?.getAnimations().forEach((a) => a.pause());
    const inner = el?.firstElementChild as HTMLElement | null;
    inner?.animate?.([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.5)", opacity: 1, offset: 0.4 }, { transform: "scale(0.2)", opacity: 0 }], { duration: 1100, easing: "ease-in", fill: "forwards" });
    setTimeout(() => setRun(null), 1300);
  };
  return createPortal(
    <div ref={ref} className="fixed left-0" style={{ top: run.top, zIndex: 35 }} onClick={boo} role="button" aria-label={t.boo}>
      <div style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,0.55))", opacity: 0.93 }}>
        <GhostSvg size={78} />
      </div>
      {caught && (
        <span className="zz-pop zz-stk-sm absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[18px] font-extrabold" style={{ background: "#fff", color: "var(--zz-ink)", scale: run.ltr ? "-1 1" : undefined }}>
          {t.boo}
        </span>
      )}
    </div>,
    document.body,
  );
}

/* ───────── Bonbon ou un sort ? ───────── */

const CANDY_COLORS = ["#FF3EA5", "#FFD23F", "#3DDC97", "#A98BFF", "#FF8A1F", "#52C7FF"];

function CandyRain({ id }: { id: number }) {
  const items = useRef(Array.from({ length: 26 }, (_, i) => ({
    x: Math.random() * 100, d: Math.random() * 700, dur: 1700 + Math.random() * 1200,
    s: 26 + Math.random() * 18, rot: Math.random() * 720 - 360, c: CANDY_COLORS[i % CANDY_COLORS.length], lolly: i % 4 === 0,
  }))).current;
  return createPortal(
    <div key={id} aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 36 }}>
      {items.map((it, i) => (
        <div key={i} className="zz-candy absolute top-0" style={{ left: `${it.x}%`, width: it.s, animationDelay: `${it.d}ms`, animationDuration: `${it.dur}ms`, ["--r" as string]: `${it.rot}deg` } as CSSProperties}>
          {it.lolly ? (
            <svg viewBox="0 0 24 32" width="100%"><path d="M12 18v13" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><circle cx="12" cy="11" r="9" fill={it.c} stroke="#15082E" strokeWidth="2" /><path d="M12 11a4 4 0 1 1 4 -4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          ) : (
            <svg viewBox="0 0 32 16" width="100%"><path d="M9 8L3 3v10zM23 8l6-5v10z" fill={it.c} stroke="#15082E" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="16" cy="8" r="6.5" fill={it.c} stroke="#15082E" strokeWidth="1.8" /><path d="M12.5 5.5c2 1 5 3.5 7 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".8" /></svg>
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
}

/** La citrouille qui dépasse du bord droit de l'accueil (posée dans le flux de l'accueil, voir Home.tsx). */
export function TrickOrTreat({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const t = useT(T);
  const [ask, setAsk] = useState(false);
  const [after, setAfter] = useState(false);
  const [rain, setRain] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  const treat = () => {
    setAsk(false);
    foundSecret("trick");
    haptic("success");
    setRain((r) => r + 1);
    playSfx("coins", { volume: 0.5 });
    later(() => playSfx("tada", { volume: 0.35 }), 350);
    later(() => setRain(0), 3200);
    setAfter(true); later(() => setAfter(false), 1800);
  };
  const trick = () => {
    setAsk(false);
    foundSecret("trick");
    haptic("medium");
    const home = homeRef.current;
    playSfx("croak", { volume: 0.8 });
    later(() => playSfx("croak", { volume: 0.6, rate: 1.15 }), 900);
    // Style posé directement sur chaque blob visible (un sélecteur CSS sur l'attribut viewBox des SVG est peu fiable)
    const blobs = home ? visibleBlobs(home) : [];
    blobs.forEach((svg) => svg.classList.add("zz-hexed"));
    later(() => blobs.forEach((svg) => svg.classList.remove("zz-hexed")), 4500);
    setAfter(true); later(() => setAfter(false), 1800);
  };

  return (
    // Rogné à droite seulement (overflow-x: clip) : la citrouille inclinée ne doit jamais faire défiler l'accueil sur le côté
    <div className="relative h-0" style={{ overflowX: "clip", overflowY: "visible" }}>
      {/* Au niveau du sous-titre de la 1re section (texte court à gauche) : jamais sur le grand titre */}
      <div className="absolute right-0 flex items-center" style={{ top: 58, zIndex: 3 }}>
        {(ask || after) && (
          <div className="zz-pop zz-stk-sm mr-1 flex flex-col items-end gap-1.5 rounded-[18px] px-3 py-2" style={{ background: "#fff", color: "var(--zz-ink)" }}>
            <span className="text-[15px] font-extrabold">{after ? t.after : t.ask}</span>
            {ask && (
              <span className="flex gap-1.5">
                <button type="button" onClick={treat} className="zz-push h-9 rounded-full px-3 text-[14px] font-bold" style={{ background: "#FFD23F", border: "2px solid var(--zz-ink)" }}>{t.treat}</button>
                <button type="button" onClick={trick} className="zz-push h-9 rounded-full px-3 text-[14px] font-bold" style={{ background: "#3DDC97", border: "2px solid var(--zz-ink)" }}>{t.trick}</button>
              </span>
            )}
          </div>
        )}
        <button
          type="button"
          aria-label={t.ask}
          onClick={() => { haptic(); playSfx("pop", { volume: 0.4, rate: 0.9 }); setAfter(false); setAsk((a) => !a); }}
          className="block"
          style={{ marginRight: 2, rotate: "-14deg" }}
        >
          <ZBlob size={48} color="yellow" mood="wink" seed={21} shadow={false} outline costume="pumpkin" hop={false} speed={2.2} />
        </button>
      </div>
      {rain > 0 && <CandyRain id={rain} />}
    </div>
  );
}

/* ───────── Lumière éteinte ───────── */

const LIGHTS_MS = 9000;

function LightsOff({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const [on, setOn] = useState<{ eyes: { x: number; y: number; r: number }[] } | null>(null);
  const [lamp, setLamp] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const start = () => {
      const home = homeRef.current;
      if (!home || !homeVisible(home)) return;
      // Les yeux (blancs d'œil des blobs visibles) brilleront dans le noir
      const eyes: { x: number; y: number; r: number }[] = [];
      for (const svg of visibleBlobs(home)) {
        const k = svg.getBoundingClientRect().width / 120;
        for (const c of Array.from(svg.querySelectorAll('circle[fill="#fff"]'))) {
          const r = Number(c.getAttribute("r")), cx = Number(c.getAttribute("cx")), cy = Number(c.getAttribute("cy"));
          if (!(r >= 8 && r <= 22 && cx >= 20 && cx <= 100 && cy >= 35 && cy <= 80)) continue;
          const b = c.getBoundingClientRect();
          if (b.width) eyes.push({ x: b.left + b.width / 2, y: b.top + b.height / 2, r: Math.max(3, r * k * 0.75) });
        }
      }
      setLamp(null);
      setOn({ eyes: eyes.slice(0, 80) });
      foundSecret("lights");
      haptic("medium");
      playSfx("toggle", { volume: 0.7, rate: 0.8 });
      clearTimeout(timer);
      timer = setTimeout(() => { setOn(null); playSfx("toggle", { volume: 0.6 }); }, LIGHTS_MS);
    };
    window.addEventListener("zz:lights-off", start);
    return () => { clearTimeout(timer); window.removeEventListener("zz:lights-off", start); };
  }, [homeRef]);

  if (!on) return null;
  const move = (e: React.PointerEvent) => setLamp({ x: e.clientX, y: e.clientY });
  const R = 120;
  return createPortal(
    <div
      className="zz-lights fixed inset-0"
      style={{ zIndex: 38, touchAction: "none", background: lamp ? `radial-gradient(circle ${R}px at ${lamp.x}px ${lamp.y}px, rgba(4,2,10,0) 0%, rgba(4,2,10,0.15) 55%, rgba(4,2,10,0.97) 100%)` : "rgba(4,2,10,0.97)" }}
      onPointerDown={move}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") move(e); }}
      onPointerUp={() => setLamp(null)}
      onPointerCancel={() => setLamp(null)}
      aria-hidden
    >
      {on.eyes.map((e, i) => (
        <span key={i} className="zz-eye-glow absolute rounded-full" style={{ left: e.x - e.r, top: e.y - e.r, width: e.r * 2, height: e.r * 2, animationDelay: `${(i % 7) * 0.37}s`, opacity: lamp ? 0.25 : 1 }} />
      ))}
    </div>,
    document.body,
  );
}

/* ───────── Minuit ───────── */

const MIDNIGHT_KEY = "zz-midnight-last";

function Midnight({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const t = useT(T);
  const [on, setOn] = useState(false);

  useEffect(() => {
    let off: ReturnType<typeof setTimeout>;
    const fire = () => {
      setOn(true);
      foundSecret("midnight");
      haptic("medium");
      playSfx("gong", { volume: 0.6, rate: 0.7 });
      setTimeout(() => playSfx("spooky", { volume: 0.7 }), 600);
      clearTimeout(off);
      off = setTimeout(() => setOn(false), 60_000);
    };
    const check = () => {
      const d = new Date();
      if (d.getHours() !== 0 || d.getMinutes() !== 0 || !homeVisible(homeRef.current)) return;
      const day = d.toDateString();
      try { if (localStorage.getItem(MIDNIGHT_KEY) === day) return; localStorage.setItem(MIDNIGHT_KEY, day); } catch { /* indispo */ }
      fire();
    };
    const id = setInterval(check, 10_000);
    check();
    window.addEventListener("zz:midnight", fire);
    return () => { clearInterval(id); clearTimeout(off); window.removeEventListener("zz:midnight", fire); };
  }, [homeRef]);

  if (!on) return null;
  return createPortal(
    <div aria-live="polite" className="zz-midnight pointer-events-none fixed inset-0 flex items-start justify-center" style={{ zIndex: 34 }}>
      <p className="zz-title mt-[38vh] px-8 text-center text-[34px] leading-tight text-white" style={{ textShadow: "0 0 18px rgba(255,30,60,0.9), 0 3px 0 #15082E" }}>
        {t.midnight}
      </p>
    </div>,
    document.body,
  );
}

/** Tous les secrets d'Halloween « flottants » de l'accueil (la citrouille est posée à part, dans le flux). */
export function HalloweenEggs({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  return (
    <>
      <GhostPass homeRef={homeRef} />
      <LightsOff homeRef={homeRef} />
      <Midnight homeRef={homeRef} />
    </>
  );
}
