import { useEffect, useRef, useState, type RefObject } from "react";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import { randomLook, type AvatarLook } from "@/lib/avatar/look";
import { playSfx } from "@/lib/sfx";
import { haptic, reducedMotion } from "./util";

/**
 * Secret de l'accueil : secouer le téléphone → une pluie de blobs (ceux de « Ma bande »
 * s'il y en a) tombe derrière le contenu, rebondit puis s'efface. Aucun texte, aucun indice.
 * Écoute active seulement quand l'accueil est affiché et l'app au premier plan ; 3 s entre deux pluies.
 * - App iOS : détection NATIVE de la secousse (celle de « secouer pour annuler », fiable et sans
 *   permission) : ZinzinBridgeViewController.motionEnded envoie l'événement window « zzshake ».
 * - Web (hors app) : « devicemotion », accélération linéaire ≥ 18 m/s², 3 pics en 1,2 s ; sans
 *   jamais appeler requestPermission (ne marche que si l'accès est déjà accordé, ou sans permission).
 */

// Web : seuils réglés pour une vraie secousse « exprès » au poignet (pas la marche) :
// ~1,8 g hors gravité, 3 pics en 1,2 s
const THRESHOLD = 18;
const REARM = 10;
const PEAKS = 3;
const WINDOW_MS = 1200;
const COOLDOWN_MS = 3000;
const G = 9.81;
/** Événement window envoyé par l'app iOS à chaque secousse détectée par le système. */
const NATIVE_SHAKE_EVENT = "zzshake";

type Vec = { x?: number | null; y?: number | null; z?: number | null } | null | undefined;
type MotionLike = { acceleration?: Vec; accelerationIncludingGravity?: Vec };

const isNative = () =>
  Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

/** Intensité d'un événement (m/s², hors gravité). */
function magnitude(e: MotionLike): number | null {
  const a = e.acceleration;
  if (a && a.x != null && a.y != null && a.z != null) return Math.hypot(a.x, a.y, a.z);
  // Pas d'accélération linéaire : on retire la gravité de l'accélération brute
  const g = e.accelerationIncludingGravity;
  if (g && g.x != null && g.y != null && g.z != null) return Math.abs(Math.hypot(g.x, g.y, g.z) - G);
  return null;
}

/** Détecteur de secousse (web) : renvoie une fonction à nourrir avec chaque événement. */
function shakeDetector(onShake: () => void) {
  const peaks: number[] = [];
  let armed = true;
  return (e: MotionLike) => {
    const m = magnitude(e);
    if (m == null) return;
    const now = performance.now();
    if (m < REARM) { armed = true; return; }
    if (m < THRESHOLD || !armed) return;
    armed = false;
    peaks.push(now);
    while (peaks.length && now - peaks[0] > WINDOW_MS) peaks.shift();
    if (peaks.length >= PEAKS) {
      peaks.length = 0;
      onShake();
    }
  };
}

/** Branche la détection de secousse (native dans l'app, accéléromètre sur le web). Renvoie l'arrêt. */
function listenShake(onShake: () => void): () => void {
  if (isNative()) {
    window.addEventListener(NATIVE_SHAKE_EVENT, onShake);
    return () => window.removeEventListener(NATIVE_SHAKE_EVENT, onShake);
  }
  const feed = shakeDetector(onShake);
  const onWin = (e: Event) => feed(e as unknown as MotionLike);
  window.addEventListener("devicemotion", onWin);
  return () => window.removeEventListener("devicemotion", onWin);
}

/* ───────── Pluie ───────── */
type Drop = { key: number; look: AvatarLook; size: number; mood: "laughing" | "shocked" };
type Body = { x: number; y: number; vx: number; vy: number; r: number; vr: number; t0: number; bounces: number };

const DURATION = 3400;
const FADE = 700;

export function ShakeRain({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const band = useBand();
  const layer = useRef<HTMLDivElement>(null);
  const [drops, setDrops] = useState<Drop[] | null>(null);
  const looksRef = useRef<AvatarLook[]>([]);
  useEffect(() => { looksRef.current = band.filter((b) => b.look).map((b) => b.look as AvatarLook); }, [band]);
  const busy = useRef(false);

  // Écoute de la secousse, seulement quand l'accueil est affiché et l'app au premier plan
  useEffect(() => {
    const el = layer.current;
    if (!el || typeof window === "undefined") return;
    let shown = false;
    let stop: (() => void) | null = null;

    let lastFire = -Infinity;
    const fire = () => {
      if (busy.current || document.visibilityState !== "visible") return;
      if (performance.now() - lastFire < COOLDOWN_MS) return;
      // L'accueil doit être au premier plan (pas de fiche, réglages, paywall… par-dessus)
      const home = homeRef.current;
      const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      if (!home || !top || !home.contains(top)) return;
      busy.current = true;
      lastFire = performance.now();
      const reduce = reducedMotion();
      const n = reduce ? 10 : 24;
      const mine = looksRef.current;
      const list: Drop[] = Array.from({ length: n }, (_, i) => ({
        key: Date.now() + i,
        // Bande de l'utilisateur : ~2 blobs sur 3 sont ses persos, le reste au hasard
        look: mine.length && i % 3 !== 2 ? mine[i % mine.length] : randomLook(),
        size: Math.round(46 + Math.random() * 40),
        mood: Math.random() < 0.5 ? "laughing" : "shocked",
      }));
      setDrops(list);
      playSfx("whooshdown", { volume: 0.5 });
      setTimeout(() => playSfx("pop", { volume: 0.6 }), 380);
      haptic("medium");
      try { navigator.vibrate?.([30, 50, 30]); } catch { /* indispo */ }
    };

    const sync = () => {
      const want = shown && document.visibilityState === "visible";
      if (want && !stop) stop = listenShake(fire);
      else if (!want && stop) { stop(); stop = null; }
    };
    // Accueil masqué (jeu, soirée : display none) → plus d'intersection → écoute coupée
    const io = new IntersectionObserver((entries) => {
      shown = entries.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      stop?.();
    };
  }, [homeRef]);

  // Animation : chute, rebonds, rotation, puis fondu (transforms seulement, rAF)
  useEffect(() => {
    if (!drops) return;
    const root = layer.current;
    if (!root) return;
    const reduce = reducedMotion();
    const nodes = Array.from(root.children) as HTMLElement[];
    const W = innerWidth;
    const H = innerHeight;
    const start = performance.now();
    const bodies: Body[] = drops.map((d, i) => ({
      x: Math.random() * (W - d.size),
      y: -d.size - Math.random() * 120,
      vx: (Math.random() - 0.5) * 160,
      vy: 80 + Math.random() * 220,
      r: reduce ? 0 : Math.random() * 60 - 30,
      vr: reduce ? 0 : (Math.random() - 0.5) * 540,
      // Arrivée échelonnée
      t0: (i / drops.length) * 700 + Math.random() * 120,
      bounces: 0,
    }));
    const gravity = 2400;
    let last = start;
    let raf = 0;
    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const t = now - start;
      const fade = t > DURATION - FADE ? Math.max(0, (DURATION - t) / FADE) : 1;
      bodies.forEach((b, i) => {
        const node = nodes[i];
        if (!node) return;
        if (t < b.t0) return;
        const size = drops[i].size;
        b.vy += gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.r += b.vr * dt;
        const floor = H - size * 0.92;
        if (b.y > floor) {
          b.y = floor;
          b.bounces++;
          b.vy = -Math.abs(b.vy) * (reduce ? 0.25 : 0.55);
          b.vx *= 0.8;
          b.vr = -b.vr * 0.6;
          if (Math.abs(b.vy) < 60) b.vy = 0;
        }
        if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); }
        if (b.x > W - size) { b.x = W - size; b.vx = -Math.abs(b.vx); }
        node.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) rotate(${b.r.toFixed(1)}deg)`;
        node.style.opacity = String(fade);
      });
      if (t < DURATION) raf = requestAnimationFrame(step);
      else { setDrops(null); busy.current = false; }
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); busy.current = false; };
  }, [drops]);

  return (
    <div ref={layer} aria-hidden className="zz-rain pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {drops?.map((d) => (
        <div key={d.key} className="absolute left-0 top-0" style={{ transform: "translate3d(-200px, -200px, 0)", willChange: "transform, opacity" }}>
          <AvatarBlob look={d.look} size={d.size} mood={d.mood} animate={false} />
        </div>
      ))}
    </div>
  );
}
