"use client";

import { useEffect, useRef, useState } from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function MagneticButton({ children, className, style, onClick, type = "button", disabled }: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf: number;
    const loop = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;
      setPos({ x: current.current.x, y: current.current.y });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      ref={btnRef}
      type={type}
      className={className}
      disabled={disabled}
      style={{ ...style, transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onClick={onClick}
      onMouseMove={e => {
        const r = btnRef.current!.getBoundingClientRect();
        target.current = { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3 };
      }}
      onMouseLeave={() => { target.current = { x: 0, y: 0 }; }}
    >
      {children}
    </button>
  );
}
