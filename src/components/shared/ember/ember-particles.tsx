"use client";

import { useEffect, useRef } from "react";

type Vec2 = { x: number; y: number };

interface EmberParticlesProps {
  mouse: React.RefObject<Vec2 | null>;
  count?: number;
}

export function EmberParticles({ mouse, count = 80 }: EmberParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);

    interface P {
      x: number; y: number; vx: number; vy: number;
      size: number; op: number; life: number; max: number;
      hue: number; trail: Vec2[]; hasTrail: boolean;
    }

    function spawn(scattered = false): P {
      let x: number, y: number;
      if (scattered) {
        x = Math.random() * w;
        y = Math.random() * h;
      } else {
        const edge = Math.random();
        if (edge < 0.6) { x = Math.random() * w; y = h + 10; }
        else if (edge < 0.8) { x = -10; y = h * 0.4 + Math.random() * h * 0.6; }
        else { x = w + 10; y = h * 0.4 + Math.random() * h * 0.6; }
      }
      return {
        x, y, vx: (Math.random() - 0.5) * 0.4, vy: -(Math.random() * 0.6 + 0.15),
        size: Math.random() * 2.2 + 0.4, op: Math.random() * 0.45 + 0.08,
        life: scattered ? Math.random() * 400 : 0, max: 350 + Math.random() * 400,
        hue: Math.random() * 30, trail: [], hasTrail: Math.random() < 0.2,
      };
    }

    const particles: P[] = Array.from({ length: count }, () => spawn(true));
    let raf: number;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const m = mouse.current ?? { x: -999, y: -999 };
      const cx = w / 2, cy = h / 2;

      for (const p of particles) {
        if (p.hasTrail) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 8) p.trail.shift(); }

        const dxC = cx - p.x, dyC = cy - p.y;
        const distC = Math.hypot(dxC, dyC);
        if (distC > 60) { p.vx += (dxC / distC) * 0.002; p.vy += (dyC / distC) * 0.002; }

        const dxM = p.x - m.x, dyM = p.y - m.y;
        const distM = Math.hypot(dxM, dyM);
        if (distM < 130 && distM > 0) {
          const force = (130 - distM) / 130 * 0.12;
          p.vx += (dxM / distM) * force;
          p.vy += (dyM / distM) * force;
        }

        p.vx *= 0.994; p.vy *= 0.994;
        p.x += p.vx; p.y += p.vy; p.life++;

        if (p.life > p.max || p.y < -30 || p.x < -30 || p.x > w + 30) Object.assign(p, spawn());

        const t = p.life / p.max;
        const fade = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const a = p.op * fade;

        if (p.hasTrail) {
          for (let i = 0; i < p.trail.length - 1; i++) {
            const ta = (i / p.trail.length) * a * 0.25;
            const ts = p.size * (i / p.trail.length) * 0.4;
            ctx.beginPath(); ctx.arc(p.trail[i].x, p.trail[i].y, ts, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue},90%,55%,${ta})`; ctx.fill();
          }
        }

        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},90%,55%,${a})`; ctx.fill();

        if (p.size > 1.2) {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},80%,50%,${a * 0.08})`; ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onR = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }, [mouse, count]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[5]" />;
}
