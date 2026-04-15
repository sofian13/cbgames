"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type LineMaskProps = {
  as?: "span" | "div";
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: "load" | "scroll";
  splitBy?: "word" | "line";
};

export function LineMask({
  as = "span",
  children,
  className,
  delay = 0,
  stagger = 0.06,
  trigger = "scroll",
  splitBy = "word",
}: LineMaskProps) {
  const ref = useRef<HTMLSpanElement & HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const rows = el.querySelectorAll<HTMLElement>(".line-mask-inner");
    if (!rows.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      rows.forEach((row) => {
        row.style.transform = "none";
        row.style.filter = "none";
        row.style.opacity = "1";
      });
      return;
    }

    gsap.set(rows, { yPercent: 110, opacity: 0, filter: "blur(10px)" });

    const anim = gsap.to(rows, {
      yPercent: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.9,
      ease: "expo.out",
      stagger,
      delay,
      overwrite: "auto",
      paused: true,
    });

    let st: ScrollTrigger | undefined;
    let raf = 0;

    if (trigger === "load") {
      raf = requestAnimationFrame(() => anim.play());
    } else {
      st = ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => anim.play(),
      });
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (st) st.kill();
      anim.kill();
    };
  }, [delay, stagger, trigger]);

  const content =
    typeof children === "string"
      ? children.split(splitBy === "word" ? /(\s+)/ : /(\n)/).map((part, i) =>
          part.match(/^\s+$/) ? (
            <span key={i}>{part}</span>
          ) : (
            <span key={i} className="line-mask">
              <span className="line-mask-inner">{part}</span>
            </span>
          )
        )
      : (
          <span className="line-mask">
            <span className="line-mask-inner">{children}</span>
          </span>
        );

  if (as === "div") {
    return (
      <div ref={ref} className={className}>
        {content}
      </div>
    );
  }
  return (
    <span ref={ref} className={className}>
      {content}
    </span>
  );
}
