"use client";

import { useRef, useState, useEffect } from "react";
import { EmberParticles } from "./ember-particles";
import { CursorTrail } from "./cursor-trail";
import { EmberOrb } from "./ember-orb";
import { FilmGrain } from "./film-grain";

type Vec2 = { x: number; y: number };

interface EmberBackgroundProps {
  children: React.ReactNode;
  particleCount?: number;
  showOrb?: boolean;
  showCursorTrail?: boolean;
}

export function EmberBackground({
  children,
  particleCount = 80,
  showOrb = true,
  showCursorTrail = true,
}: EmberBackgroundProps) {
  const mouseRef = useRef<Vec2>({ x: -100, y: -100 });
  const [mx, setMx] = useState(0.5);
  const [my, setMy] = useState(0.5);
  const [proximity, setProximity] = useState(0);

  useEffect(() => {
    let raf: number;
    const handler = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setMx(e.clientX / window.innerWidth);
        setMy(e.clientY / window.innerHeight);
        const dist = Math.hypot(e.clientX - window.innerWidth / 2, e.clientY - window.innerHeight / 2);
        setProximity(Math.max(0, 1 - dist / 340));
      });
    };
    window.addEventListener("mousemove", handler);
    return () => { window.removeEventListener("mousemove", handler); cancelAnimationFrame(raf); };
  }, []);

  const px = (mx - 0.5) * 26;
  const py = (my - 0.5) * 26;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#060606" }}>
      <FilmGrain />

      {/* Mouse-reactive background warmth */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background: `radial-gradient(ellipse 55% 50% at ${50 + (mx - 0.5) * 6}% ${47 + (my - 0.5) * 6}%, rgba(160,45,18,${0.04 + proximity * 0.025}) 0%, transparent 100%)`,
          transition: "background 0.3s ease",
        }}
      />

      <EmberParticles mouse={mouseRef} count={particleCount} />
      {showCursorTrail && <CursorTrail mouse={mouseRef} />}
      {showOrb && <EmberOrb px={px} py={py} boost={proximity} />}

      {/* Shockwaves */}
      {showOrb && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[3]">
          {[0, 1, 2].map(i => (
            <div key={i} className="absolute rounded-full" style={{ animation: `shockwave 4.5s ease-out ${i * 1.5}s infinite` }} />
          ))}
        </div>
      )}

      {/* Floating Orbs */}
      {showOrb && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[6]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="absolute rounded-full" style={{
              width: 6 + i * 2, height: 6 + i * 2,
              background: `radial-gradient(circle, rgba(225,80,35,${0.5 - i * 0.08}), transparent)`,
              boxShadow: `0 0 ${12 + i * 4}px rgba(200,55,28,0.25), 0 0 ${30 + i * 8}px rgba(200,55,28,0.1)`,
              animation: `orbit${i} ${12 + i * 4}s linear infinite`,
            }} />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
