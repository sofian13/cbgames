"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { isMuted, setMuted } from "./fx";

/** Boutons du coin haut-droit (règles ⓘ + son) et feuille de règles. Coin haut-gauche laissé libre pour l'app. */
export function TopRightControls({ title, rules, accent }: { title: string; rules: string[]; accent: string }) {
  const [open, setOpen] = useState(false);
  const [mute, setMute] = useState(isMuted());

  return (
    <>
      <div
        className="fixed right-3 z-40 flex gap-2"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
      >
        <button
          onClick={() => {
            setMuted(!mute);
            setMute(!mute);
          }}
          aria-label={mute ? "Activer le son" : "Couper le son"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          {mute ? "🔇" : "🔊"}
        </button>
        <button
          onClick={() => setOpen(true)}
          aria-label="Règles"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold text-white"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          ⓘ
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(5,2,15,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-[28px] p-6 text-white"
            style={{
              background: "#1A0F3A",
              borderTop: `3px solid ${accent}`,
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
              animation: "af-slide-up 0.25s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="cb-display-md mb-4">{title}</p>
            <ol className="space-y-3">
              {rules.map((r, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-snug">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: accent, color: "#15082E" }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>{r}</span>
                </li>
              ))}
            </ol>
            <button onClick={() => setOpen(false)} className="af-btn af-btn-primary mt-6 w-full" style={{ fontSize: 16 }}>
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Remet en haut les conteneurs scrollables parents à chaque changement d'écran. */
export function ScrollReset({ dep }: { dep: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    let el = ref.current?.parentElement ?? null;
    while (el) {
      if (el.scrollTop) el.scrollTop = 0;
      el = el.parentElement;
    }
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [dep]);
  return <span ref={ref} hidden />;
}
