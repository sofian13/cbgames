"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
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

  useGSAP(
    () => {
      if (!ref.current) return;

      const targets = stagger && staggerSelector
        ? ref.current.querySelectorAll(staggerSelector)
        : [ref.current];

      gsap.fromTo(
        targets,
        { opacity: 0, y, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "expo.out",
          stagger: stagger ?? 0,
          delay,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 86%",
            once: true,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
