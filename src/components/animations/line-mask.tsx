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
    if (trigger !== "scroll") return;
    if (!ref.current) return;
    const el = ref.current;
    const rows = el.querySelectorAll<HTMLElement>(".line-mask-inner");
    if (!rows.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

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

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => anim.play(),
    });

    return () => {
      st.kill();
      anim.kill();
    };
  }, [delay, stagger, trigger]);

  const isLoad = trigger === "load";
  const innerClass = isLoad
    ? "line-mask-inner line-mask-inner-load"
    : "line-mask-inner line-mask-inner-scroll";

  const wrap = (part: string, wordIndex: number) => {
    const itemDelay = delay + wordIndex * stagger;
    return (
      <span className="line-mask">
        <span
          className={innerClass}
          style={isLoad ? { animationDelay: `${itemDelay}s` } : undefined}
        >
          {part}
        </span>
      </span>
    );
  };

  let wordCounter = 0;
  const content =
    typeof children === "string"
      ? children.split(splitBy === "word" ? /(\s+)/ : /(\n)/).map((part, i) => {
          if (part.match(/^\s+$/)) return <span key={i}>{part}</span>;
          const node = wrap(part, wordCounter);
          wordCounter += 1;
          return <span key={i}>{node}</span>;
        })
      : wrap(String(children), 0);

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
