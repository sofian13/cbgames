"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
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

  useGSAP(
    () => {
      if (!ref.current) return;
      const rows = ref.current.querySelectorAll(".line-mask-inner");
      if (!rows.length) return;

      const anim = gsap.fromTo(
        rows,
        { yPercent: 110, opacity: 0, filter: "blur(10px)" },
        {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "expo.out",
          stagger,
          delay,
          paused: trigger === "scroll",
        }
      );

      if (trigger === "scroll") {
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top 88%",
          once: true,
          onEnter: () => anim.play(),
        });
      }
    },
    { scope: ref }
  );

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
