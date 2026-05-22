"use client";

import { useEffect, useMemo, useState } from "react";

const CONFETTI_COLORS = ["#FF3EA5", "#FFD23F", "#3DDC97", "#4ECDC4", "#5B36D6", "#FF6B5B"];

// Decorative, randomized elements must be client-only to avoid SSR/client
// hydration mismatches (Math.random() differs between server and browser).
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

interface ConfettiBurstProps {
  count?: number;
}

export function ConfettiBurst({ count = 60 }: ConfettiBurstProps) {
  const mounted = useMounted();
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    i,
    left: Math.random() * 100,
    cx: (Math.random() - 0.5) * 80,
    delay: Math.random() * 2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rot: Math.random() * 360,
    dur: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.6 ? "50%" : Math.random() > 0.5 ? "2px" : "0",
  })), [count]);

  if (!mounted) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {pieces.map(p => (
        <div key={p.i} className="afgames-confetti" style={{
          left: `${p.left}%`,
          width: p.size, height: p.size * 1.4,
          background: p.color,
          borderRadius: p.shape,
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
          ["--cx" as never]: `${p.cx}px`,
          transform: `rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  );
}

interface SparklesProps {
  count?: number;
}

export function Sparkles({ count = 8 }: SparklesProps) {
  const mounted = useMounted();
  const sp = useMemo(() => Array.from({ length: count }, (_, i) => ({
    i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 4 + Math.random() * 10,
    delay: Math.random() * 3,
    color: ["#FFD23F", "#FF3EA5", "#FFFFFF"][i % 3],
  })), [count]);

  if (!mounted) return null;

  return (
    <>
      {sp.map(p => (
        <div
          key={p.i}
          className="afgames-sparkle"
          style={{
            left: `${p.left}%`, top: `${p.top}%`,
            width: p.size, height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}
