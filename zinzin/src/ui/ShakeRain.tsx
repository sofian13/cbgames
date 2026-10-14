import { useEffect, useRef, useState, type RefObject } from "react";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import { randomLook, type AvatarLook } from "@/lib/avatar/look";
import { playSfx } from "@/lib/sfx";
import { haptic, reducedMotion } from "./util";

/**
 * Secret de l'accueil : secouer FORT le téléphone → une pluie de blobs (ceux de « Ma bande »
 * s'il y en a) tombe derrière le contenu, rebondit puis s'efface. Aucun texte, aucun indice.
 *
 * Détection : accélération linéaire ≥ 25 m/s² (hors gravité), au moins 3 pics en moins d'1 s
 * (un pic = passage au-dessus du seuil après être redescendu sous 15 m/s²), 4 s entre deux pluies.
 * La marche ou un geste normal reste très loin de ces valeurs.
 * Écoute active seulement quand l'accueil est affiché et l'app au premier plan.
 * - App iOS/Android : @capacitor/motion (événement « accel ») ; la webview Capacitor accorde
 *   l'accès au mouvement sans afficher de demande (WebViewDelegationHandler → .grant).
 * - Web : simple écoute de « devicemotion », sans jamais appeler requestPermission
 *   (pas de demande affichée : ne marche que si l'accès est déjà accordé, ou sans permission).
 */

// Seuils réglés pour une vraie secousse « exprès » au poignet (pas la marche) :
// ~1,8 g hors gravité, 3 pics en 1,2 s
const THRESHOLD = 18;
const REARM = 10;
const PEAKS = 3;
const WINDOW_MS = 1200;
const COOLDOWN_MS = 4000;
const G = 9.81;

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

/** Détecteur de secousse : renvoie une fonction à nourrir avec chaque événement. */
function shakeDetector(onShake: () => void) {
  const peaks: number[] = [];
  let armed = true;
  let lastFire = -Infinity;
  return (e: MotionLike) => {
    const m = magnitude(e);
    if (m == null) return;
    const now = performance.now();
    if (m < REARM) { armed = true; return; }
    if (m < THRESHOLD || !armed) return;
    armed = false;
    peaks.push(now);
    while (peaks.length && now - peaks[0] > WINDOW_MS) peaks.shift();
    if (peaks.length >= PEAKS && now - lastFire > COOLDOWN_MS) {
      peaks.length = 0;
      lastFire = now;
      onShake();
    }
  };
}

let motionAsked = false;
/** Demande l'accès au mouvement au premier toucher de l'écran (une seule fois). */
function armMotionPermission() {
  if (motionAsked) return;
  const DM = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
  if (typeof DM?.requestPermission !== "function") { motionAsked = true; return; }
  const ask = () => {
    if (motionAsked) return;
    motionAsked = true;
    window.removeEventListener("touchend", ask, true);
    window.removeEventListener("click", ask, true);
    DM.requestPermission!().then((r) => { if (r !== "granted") motionAsked = false; }).catch(() => { motionAsked = false; });
  };
  // touchend / click comptent comme « geste » pour iOS (pointerdown non)
  window.addEventListener("touchend", ask, true);
  window.addEventListener("click", ask, true);
}

/** Branche l'accéléromètre. Renvoie l'arrêt. */
function listenMotion(feed: (e: MotionLike) => void): () => void {
  let stopped = false;
  const onWin = (e: Event) => feed(e as unknown as MotionLike);
  const web = () => window.addEventListener("devicemotion", onWin);
  let remove: (() => void) | null = null;
  if (isNative()) {
    // iOS : les événements de mouvement n'arrivent qu'après requestPermission(), qui exige un
    // geste. La webview Capacitor l'accorde sans afficher de fenêtre → on le fait au 1er toucher.
    armMotionPermission();
    import("@capacitor/motion")
      .then(async ({ Motion }) => {
        if (stopped) return;
        const h = await Motion.addListener("accel", (e) => feed(e as unknown as MotionLike));
        if (stopped) void h.remove();
        else remove = () => void h.remove();
      })
      .catch(() => { if (!stopped) { web(); remove = () => window.removeEventListener("devicemotion", onWin); } });
  } else {
    web();
    remove = () => window.removeEventListener("devicemotion", onWin);
  }
  return () => { stopped = true; remove?.(); };
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

  // Écoute de l'accéléromètre, seulement quand l'accueil est affiché et l'app au premier plan
  useEffect(() => {
    const el = layer.current;
    if (!el || typeof window === "undefined") return;
    let shown = false;
    let stop: (() => void) | null = null;

    const fire = () => {
      if (busy.current || document.visibilityState !== "visible") return;
      // L'accueil doit être au premier plan (pas de fiche, réglages, paywall… par-dessus)
      const home = homeRef.current;
      const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      if (!home || !top || !home.contains(top)) return;
      busy.current = true;
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
    const feed = shakeDetector(fire);

    const sync = () => {
      const want = shown && document.visibilityState === "visible";
      if (want && !stop) stop = listenMotion(feed);
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
