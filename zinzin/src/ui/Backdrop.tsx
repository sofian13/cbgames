import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { ZBlob, pauseWhenOffscreen } from "./ZBlob";
import { reducedMotion } from "./util";

/**
 * Fond vivant de l'accueil : lueurs qui dérivent, petits dessins qui flottent
 * et scintillent, mini-blobs qui dépassent des bords. Purement décoratif
 * (pointer-events: none), en transform/opacity uniquement pour rester à 60 fps.
 * Léger effet de profondeur au défilement du conteneur `scrollRef`.
 */

const INK = "#15082E";

type Doodle = { x: string; y: number; size: number; rot: number; color: string; kind: Kind; float: number; delay: number; twinkle?: boolean; mid?: boolean };
type Kind = "star" | "sparkle" | "squiggle" | "ring" | "heart" | "dice" | "card" | "bolt" | "question" | "plus";

// Décor généré une fois, de façon déterministe (même placement à chaque ouverture) :
// ~40 dessins répartis sur ~2 écrans et demi, sur toute la largeur.
const KINDS: Kind[] = ["sparkle", "star", "heart", "squiggle", "dice", "card", "bolt", "question", "ring", "plus"];
const COLORS = ["#FFD23F", "#FF3EA5", "#4ECDC4", "#A98BFF", "#3DDC97", "#FF6B5B"];
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const DOODLES: Doodle[] = Array.from({ length: 42 }, (_, i) => {
  const kind = KINDS[i % KINDS.length];
  // Alterne bords et milieu pour remplir sans gêner la lecture
  const lane = i % 3 === 0 ? 2 + rand(i) * 14 : i % 3 === 1 ? 80 + rand(i + 7) * 14 : 28 + rand(i + 3) * 44;
  return {
    x: `${lane.toFixed(1)}%`,
    y: 60 + i * 62 + rand(i + 11) * 36,
    size: 20 + Math.round(rand(i + 5) * 16),
    rot: Math.round(rand(i + 2) * 50 - 25),
    color: COLORS[(i * 5) % COLORS.length],
    kind,
    float: 6 + rand(i + 9) * 6,
    delay: rand(i + 13) * 6,
    twinkle: kind === "sparkle" || kind === "star",
    // Couloir du milieu : passe derrière les textes → plus discret
    mid: i % 3 === 2,
  };
});

export function Backdrop({ scrollRef }: { scrollRef: RefObject<HTMLElement | null> }) {
  const layer = useRef<HTMLDivElement>(null);

  // Parallaxe : le décor défile un peu moins vite que le contenu
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || reducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (layer.current) layer.current.style.transform = `translate3d(0, ${-el.scrollTop * 0.35}px, 0)`;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [scrollRef]);

  // Dessins hors écran (le décor fait ~2,5 écrans de haut) : animations en pause jusqu'à leur retour
  useEffect(() => {
    const stops = Array.from(layer.current?.querySelectorAll(".zz-doodle, .zz-peek") ?? [], pauseWhenOffscreen);
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Lueurs colorées qui dérivent (couleurs : --zz-glow / --zz-glow-2, changées par les thèmes secrets) */}
      <div className="zz-glow" style={{ left: "-30%", top: "8%", animationDelay: "0s" }} />
      <div className="zz-glow" style={{ right: "-35%", top: "45%", animationDelay: "-9s" }} />

      <div ref={layer} className="absolute inset-x-0 top-0" style={{ height: 2700, willChange: "transform" }}>
        {DOODLES.map((d, i) => (
          <div
            key={i}
            className={d.twinkle ? "zz-doodle zz-twinkle" : "zz-doodle"}
            style={{ left: d.x, top: d.y, width: d.size, height: d.size, rotate: `${d.rot}deg`, opacity: d.mid ? 0.3 : undefined, animationDuration: `${d.float}s`, animationDelay: `${-d.delay}s` }}
          >
            <DoodleSvg kind={d.kind} color={d.color} />
          </div>
        ))}

        {/* Mini-blobs qui dépassent des bords */}
        <Peek side="right" top={210}><ZBlob size={46} color="mint" mood="shocked" seed={11} speed={3} shadow={false} outline hop={false} /></Peek>
        <Peek side="left" top={760}><ZBlob size={40} color="yellow" mood="wink" seed={12} speed={3.4} shadow={false} outline hop={false} /></Peek>
        <Peek side="right" top={1420}><ZBlob size={44} color="pink" mood="love" seed={13} speed={2.8} shadow={false} outline hop={false} /></Peek>
      </div>
    </div>
  );
}

function Peek({ side, top, children }: { side: "left" | "right"; top: number; children: ReactNode }) {
  return (
    <div className={`zz-peek zz-peek-${side} absolute`} style={{ top, [side]: -14 }}>
      {children}
    </div>
  );
}

function DoodleSvg({ kind, color }: { kind: Kind; color: string }) {
  const common = { fill: color, stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (kind) {
    case "star":
      return <svg viewBox="0 0 24 24" width="100%" height="100%"><path {...common} d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z" /></svg>;
    case "sparkle":
      return <svg viewBox="0 0 24 24" width="100%" height="100%"><path {...common} d="M12 2c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7z" /></svg>;
    case "heart":
      return <svg viewBox="0 0 24 24" width="100%" height="100%"><path {...common} d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" /></svg>;
    case "ring":
      return <svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth="4" /><circle cx="12" cy="12" r="8" fill="none" stroke={INK} strokeWidth="1.2" opacity=".6" /></svg>;
    case "squiggle":
      return <svg viewBox="0 0 32 16" width="100%" height="100%"><path d="M2 10c3-6 6-6 9 0s6 6 9 0 6-6 9 0" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" /></svg>;
    case "dice":
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <rect {...common} x="3" y="3" width="18" height="18" rx="5" />
          {[[8, 8], [16, 16], [12, 12]].map(([cx, cy]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="1.7" fill={INK} />)}
        </svg>
      );
    case "card":
      return (
        <svg viewBox="0 0 20 26" width="100%" height="100%">
          <rect x="2" y="2" width="16" height="22" rx="3.5" fill="#fff" stroke={INK} strokeWidth="2.2" />
          <path d="M10 8.5l3 4.5-3 4.5-3-4.5z" fill={color} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "bolt":
      return <svg viewBox="0 0 24 24" width="100%" height="100%"><path {...common} d="M13.5 2L5 13.5h6L9.5 22 19 9.5h-6z" /></svg>;
    case "question":
      return <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M8.5 8.5a3.6 3.6 0 1 1 5.3 3.2c-1.2.7-1.8 1.4-1.8 2.8" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" /><circle cx="12" cy="19.3" r="1.9" fill={color} /></svg>;
    case "plus":
      return <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 4v16M4 12h16" stroke={color} strokeWidth="4" strokeLinecap="round" /></svg>;
  }
}
