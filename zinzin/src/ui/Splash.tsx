import { useEffect, useMemo, useRef, useState } from "react";
import type { MascotMood } from "@/components/Mascot";
import { ZBlob, ZCOLORS, type ZColor } from "./ZBlob";
import { reducedMotion } from "./util";
import { ZLogo } from "./Logo";
import { useT } from "@/lib/i18n";
import { UI } from "../strings";
import { playSfx } from "@/lib/sfx";

/**
 * Écran de lancement : des blobs tombent, rebondissent (squash & stretch),
 * s'entassent en bas en se bousculant, puis le logo arrive avec un rebond.
 * Physique maison (cercles + gravité), rendu direct dans le DOM via refs.
 */

const MOODS: MascotMood[] = ["happy", "laughing", "shocked", "wink", "love", "mindblown", "happy", "cool", "laughing", "kiss", "fire", "shocked", "rofl", "happy"];
const LOGO_AT = 1250;
const END_AT = 2350;

interface Body {
  x: number; y: number; vx: number; vy: number; r: number; m: number;
  s: number; sv: number; born: number; alive: boolean; grounded: boolean;
}

function rand(seed: number) {
  // Pseudo-aléatoire déterministe (pile différente mais stable par rendu)
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function Splash({ onDone }: { onDone: () => void }) {
  const [logo, setLogo] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const doneRef = useRef(false);
  const W = typeof window !== "undefined" ? window.innerWidth : 390;
  const H = typeof window !== "undefined" ? window.innerHeight : 844;
  const still = reducedMotion();
  const t = useT(UI);

  // Blobs : tailles variées proportionnelles à la largeur
  const specs = useMemo(() => {
    const n = W > 600 ? 18 : 14;
    return Array.from({ length: n }, (_, i) => {
      const r = W * (0.075 + rand(i + 1) * 0.07);
      return { r, color: ZCOLORS[i % ZCOLORS.length] as ZColor, mood: MOODS[i % MOODS.length], seed: i * 3 + 1 };
    });
  }, [W]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    setTimeout(onDone, 260);
  };

  // Jingle de lancement (une fois, respecte le bouton son coupé)
  useEffect(() => { playSfx("jingle", { volume: 0.85 }); }, []);

  useEffect(() => {
    const logoT = setTimeout(() => setLogo(true), still ? 100 : LOGO_AT);
    const endT = setTimeout(finish, still ? 1300 : END_AT);
    if (still) {
      // Mouvement réduit : pile posée, sans physique
      let x = 0;
      specs.forEach((sp, i) => {
        const el = refs.current[i];
        if (!el) return;
        const d = (sp.r * 2) / 0.8;
        if (x + sp.r * 2 > W) x = 0;
        el.style.transform = `translate(${x}px, ${H - d - 8}px)`;
        el.style.opacity = "1";
        x += sp.r * 2;
      });
      return () => { clearTimeout(logoT); clearTimeout(endT); };
    }

    const floor = H - 6;
    const bodies: Body[] = specs.map((sp, i) => ({
      x: sp.r + rand(i * 7 + 3) * (W - sp.r * 2),
      y: -sp.r - 20 - rand(i * 5 + 2) * 120,
      vx: (rand(i * 11) - 0.5) * 160,
      vy: 300 + rand(i * 13) * 200,
      r: sp.r, m: sp.r * sp.r, s: 0, sv: 0,
      born: i * 55 + rand(i * 17) * 60, alive: false, grounded: false,
    }));

    const G = 2600;
    const t0 = performance.now();
    let last = t0;
    let raf = 0;
    let kicked = false;

    const step = (dt: number, t: number) => {
      for (const b of bodies) {
        if (!b.alive) { if (t >= b.born) b.alive = true; else continue; }
        b.vy += G * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.grounded = false;
        // Ressort de squash (gelée)
        b.sv += (-700 * b.s - 13 * b.sv) * dt;
        b.s += b.sv * dt;
      }
      // Collisions entre blobs (quelques passes pour un tas stable)
      for (let it = 0; it < 4; it++) {
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];
          if (!a.alive) continue;
          for (let j = i + 1; j < bodies.length; j++) {
            const b = bodies[j];
            if (!b.alive) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            const min = (a.r + b.r) * 0.92; // un peu mous : ils s'écrasent l'un dans l'autre
            const d2 = dx * dx + dy * dy;
            if (d2 >= min * min || d2 === 0) continue;
            const d = Math.sqrt(d2);
            const nx = dx / d, ny = dy / d;
            const over = min - d;
            const tm = a.m + b.m;
            a.x -= nx * over * (b.m / tm); a.y -= ny * over * (b.m / tm);
            b.x += nx * over * (a.m / tm); b.y += ny * over * (a.m / tm);
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) {
              const jimp = (-(1 + 0.3) * rv) / (1 / a.m + 1 / b.m);
              a.vx -= (jimp / a.m) * nx; a.vy -= (jimp / a.m) * ny;
              b.vx += (jimp / b.m) * nx; b.vy += (jimp / b.m) * ny;
              const k = Math.min(0.22, (-rv / 4000) * Math.abs(ny));
              if (k > 0.02 && it === 0) { a.s = Math.max(a.s, k); b.s = Math.max(b.s, k); }
            }
            if (ny > 0.5) a.grounded = true; else if (ny < -0.5) b.grounded = true;
          }
        }
        for (const b of bodies) {
          if (!b.alive) continue;
          if (b.y + b.r > floor) {
            b.y = floor - b.r;
            if (b.vy > 0) {
              if (it === 0 && b.vy > 250) b.s = Math.max(b.s, Math.min(0.34, b.vy / 4200));
              b.vy = b.vy > 250 ? -b.vy * 0.36 : 0;
              b.vx *= 0.92;
            }
            b.grounded = true;
          }
          if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.5; }
          if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.5; }
        }
      }
      for (const b of bodies) if (b.grounded) b.vx *= 0.985;
    };

    const render = () => {
      bodies.forEach((b, i) => {
        const el = refs.current[i];
        if (!el) return;
        if (!b.alive) { el.style.opacity = "0"; return; }
        const d = (b.r * 2) / 0.8;
        // En l'air : étiré dans le sens de la chute ; au sol : écrasé par le ressort
        const fall = b.grounded ? 0 : Math.min(0.08, Math.abs(b.vy) / 16000);
        const sq = Math.max(-0.2, Math.min(0.36, b.s - fall));
        const tilt = Math.max(-18, Math.min(18, b.vx * 0.06));
        el.style.opacity = "1";
        el.style.transform =
          `translate3d(${b.x - d / 2}px, ${b.y - d / 2 + b.r * 0.06}px, 0) rotate(${tilt}deg) scale(${1 + sq}, ${1 - sq})`;
      });
    };

    const loop = (now: number) => {
      const t = now - t0;
      let dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      // Bousculade quand le logo atterrit
      if (!kicked && t > LOGO_AT + 250) {
        kicked = true;
        bodies.forEach((b, i) => { if (i % 3 === 0) { b.vy -= 520 + rand(i) * 260; b.vx += (rand(i * 3) - 0.5) * 220; } });
      }
      while (dt > 0) { const h = Math.min(dt, 1 / 120); step(h, t); dt -= h; }
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); clearTimeout(logoT); clearTimeout(endT); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="zz-tap fixed inset-0 overflow-hidden"
      style={{ background: "var(--zz-bg)", opacity: leaving ? 0 : 1, transition: "opacity 260ms ease", zIndex: 50 }}
      onPointerDown={finish}
      role="button"
      aria-label={t.skipIntro}
    >
      <div className="zz-glow" style={{ width: W * 0.9, height: W * 0.9, left: -W * 0.2, top: H * 0.12, background: "#5A2BE0", opacity: 0.35 }} />
      <div className="zz-glow" style={{ width: W * 0.8, height: W * 0.8, right: -W * 0.3, top: H * 0.3, background: "#FF3EA5", opacity: 0.2 }} />

      {logo && (
        <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: "28%" }}>
          <h1 className="zz-logo-in select-none" style={{ lineHeight: 1 }}><ZLogo size={Math.min(104, W * 0.26)} /></h1>
          <p className="zz-fade mt-3 text-[15px] font-semibold" style={{ color: "var(--zz-dim)", animationDelay: "250ms" }}>
            {t.splashTagline}
          </p>
        </div>
      )}

      {specs.map((sp, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="absolute left-0 top-0"
          style={{ opacity: 0, transformOrigin: "50% 92%", willChange: "transform" }}
        >
          <ZBlob size={(sp.r * 2) / 0.8} color={sp.color} mood={sp.mood} seed={sp.seed} wobble={false} shadow={false} />
        </div>
      ))}
    </div>
  );
}
