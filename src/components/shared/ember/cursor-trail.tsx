"use client";

import { useEffect, useRef } from "react";

type Vec2 = { x: number; y: number };

export function CursorTrail({ mouse }: { mouse: React.RefObject<Vec2 | null> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);
    const trail: { x: number; y: number; age: number }[] = [];
    let lx = -100, ly = -100;
    let raf: number;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const m = mouse.current ?? { x: -100, y: -100 };
      if (Math.abs(m.x - lx) > 0.5 || Math.abs(m.y - ly) > 0.5) {
        trail.push({ x: m.x, y: m.y, age: 0 });
        lx = m.x; ly = m.y;
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age++;
        const t = trail[i].age / 30;
        if (t >= 1) { trail.splice(i, 1); continue; }
        const alpha = (1 - t) * 0.12;
        const sz = 3 + (1 - t) * 10;
        ctx.beginPath(); ctx.arc(trail[i].x, trail[i].y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(78,180,255,${alpha})`; ctx.fill();
      }
      if (m.x > 0) {
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 35);
        g.addColorStop(0, "rgba(96,220,255,0.12)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(m.x - 35, m.y - 35, 70, 70);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onR = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }, [mouse]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[7]" />;
}
