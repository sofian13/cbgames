"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { gsap } from "gsap";

type MarqueeProps = {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  className?: string;
};

export function Marquee({
  children,
  speed = 0.6,
  direction = "left",
  className,
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let rafId = 0;
    let offset = 0;
    let lastScrollY = window.scrollY;
    let velocityBoost = 0;
    let halfWidth = track.scrollWidth / 2;
    const dir = direction === "left" ? -1 : 1;

    const measure = () => {
      halfWidth = track.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const onScroll = () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      velocityBoost = Math.min(6, Math.abs(delta) * 0.04);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      offset += (speed + velocityBoost) * dir;
      velocityBoost *= 0.92;
      if (halfWidth > 0) {
        if (offset <= -halfWidth) offset += halfWidth;
        if (offset >= 0 && dir === 1) offset -= halfWidth;
      }
      gsap.set(track, { x: offset });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [speed, direction]);

  return (
    <div className={className}>
      <div className="marquee-viewport">
        <div ref={trackRef} className="marquee-track">
          {children}
          {children}
        </div>
      </div>
    </div>
  );
}
