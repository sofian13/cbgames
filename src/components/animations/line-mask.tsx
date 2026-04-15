"use client";

import { useEffect, useRef, type ReactNode } from "react";

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

    const play = () => el.classList.add("in-view");

    // Already in view on mount? Play immediately.
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
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );
    io.observe(el);

    return () => io.disconnect();
  }, [trigger]);

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
          style={{ animationDelay: `${itemDelay}s` }}
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
