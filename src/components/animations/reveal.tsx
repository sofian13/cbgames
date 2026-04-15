"use client";

import { useEffect, useRef, type ReactNode } from "react";

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

    const targets: HTMLElement[] =
      stagger && staggerSelector
        ? Array.from(el.querySelectorAll<HTMLElement>(staggerSelector))
        : [el];

    targets.forEach((t, i) => {
      t.style.setProperty("--reveal-delay", `${delay + (stagger ?? 0) * i}s`);
      t.style.setProperty("--reveal-y", `${y}px`);
      t.classList.add("reveal-target");
    });

    const play = () => {
      targets.forEach((t) => t.classList.add("in-view"));
    };

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      play();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            play();
            io.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    io.observe(el);

    return () => io.disconnect();
  }, [delay, y, stagger, staggerSelector]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
