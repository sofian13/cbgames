"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  stagger?: number;
  staggerSelector?: string;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 36,
  stagger,
  staggerSelector,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targets = stagger && staggerSelector
      ? el.querySelectorAll<HTMLElement>(staggerSelector)
      : [el];

    if (!targets.length) return;

    if (reduce) {
      return;
    }

    gsap.set(targets, { opacity: 0, y, scale: 0.985 });

    const anim = gsap.to(targets, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1,
      ease: "expo.out",
      stagger: stagger ?? 0,
      delay,
      overwrite: "auto",
      paused: true,
    });

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => anim.play(),
    });

    // Fallback: if already in view (above the fold), play after mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      requestAnimationFrame(() => anim.play());
    }

    return () => {
      st.kill();
      anim.kill();
    };
  }, [delay, y, stagger, staggerSelector]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
