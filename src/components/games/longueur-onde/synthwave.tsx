"use client";

/**
 * Synthwave DA for Longueur d'onde — retro sun, perspective grid, neon FM radio.
 * Faithful port of the prototype "SYNTHWAVE / RADIO FM" Pose screen.
 */

import type { ReactNode } from "react";

interface Spectrum { left: string; right: string; }

export function SynthwaveScreen({
  round, total, spectrum, children,
}: {
  round: number; total: number; spectrum: Spectrum | null; children: ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-[100svh] flex-col overflow-hidden text-white"
      style={{ background: "linear-gradient(180deg, #0A0420 0%, #1B0945 18%, #4B0F6E 40%, #8A1064 60%, #C8244E 78%, #FF5C2A 92%, #FFAA3D 100%)" }}
    >
      {/* Soleil rétro */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{
        bottom: 200, width: 320, height: 320, borderRadius: "50%",
        background: "linear-gradient(180deg, #FFE891 0%, #FFD23F 30%, #FF6B5B 60%, #FF3EA5 100%)",
        boxShadow: "0 0 80px rgba(255,107,91,0.55), 0 0 160px rgba(255,62,165,0.30)", opacity: 0.95,
      }}>
        {[0.55, 0.62, 0.7, 0.78, 0.85, 0.92].map((y, i) => (
          <div key={i} className="absolute inset-x-0" style={{ top: `${y * 100}%`, height: 3 + i * 0.5, background: "#0A0420", opacity: 0.65 }} />
        ))}
      </div>

      {/* Grille perspective */}
      <div className="pointer-events-none absolute inset-x-0" style={{
        bottom: -10, height: 240,
        background: "linear-gradient(180deg, transparent 0%, #0A0420 95%), repeating-linear-gradient(0deg, transparent 0px, transparent 24px, rgba(255,62,165,0.5) 24px, rgba(255,62,165,0.5) 26px), repeating-linear-gradient(90deg, transparent 0px, transparent 30px, rgba(255,62,165,0.4) 30px, rgba(255,62,165,0.4) 32px)",
        transform: "perspective(220px) rotateX(60deg)", transformOrigin: "50% 0%", opacity: 0.7,
      }} />

      {/* Étoiles */}
      <div className="absolute inset-0 overflow-hidden" style={{ height: "40%" }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: `${(i * 41 + 17) % 100}%`, top: `${(i * 29 + 7) % 90}%`, width: 2, height: 2,
            background: "white", boxShadow: "0 0 4px white", opacity: 0.6 + (i % 3) * 0.15,
            animation: `mascot-twinkle ${1.6 + (i % 5) * 0.4}s ease-in-out infinite`, animationDelay: `${(i * 0.13) % 2}s`,
          }} />
        ))}
      </div>

      {/* FM pill */}
      <div className="relative z-[3] flex items-center justify-center px-5 pt-14">
        <div className="inline-flex items-center gap-2" style={{
          padding: "6px 12px", background: "rgba(10,4,32,0.7)", border: "1px solid rgba(255,62,165,0.5)", borderRadius: 6,
          fontFamily: "var(--font-mono-face)", fontSize: 10, color: "#FF8FC8", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
          boxShadow: "0 0 16px rgba(255,62,165,0.3)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3DDC97", boxShadow: "0 0 6px #3DDC97" }} />
          88.7 FM · MANCHE {round}/{total}
        </div>
      </div>

      {/* Titre chrome */}
      <div className="relative z-[3] mt-5 text-center">
        <div style={{ fontFamily: "var(--font-mono-face)", fontSize: 10, fontWeight: 800, letterSpacing: 4, color: "#FF8FC8", textTransform: "uppercase", textShadow: "0 0 8px rgba(255,143,200,0.6)" }}>
          ★ FRÉQUENCE SECRÈTE ★
        </div>
        <h1 className="mt-1.5" style={{
          fontFamily: "var(--font-display)", fontSize: 34, color: "white", letterSpacing: -1, lineHeight: 1, textTransform: "uppercase",
          textShadow: "0 0 4px white, 0 2px 0 #FF3EA5, 0 4px 0 #5B36D6, 0 6px 30px rgba(255,62,165,0.6)",
        }}>
          Donne un indice
        </h1>
      </div>

      {/* Axe néon */}
      {spectrum && (
        <div className="relative z-[3] px-5 pt-5">
          <div className="flex items-center justify-between gap-3" style={{
            padding: "10px 16px", background: "rgba(10,4,32,0.65)", borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 24px rgba(255,62,165,0.2)",
          }}>
            <div className="text-left">
              <div style={{ fontFamily: "var(--font-mono-face)", fontSize: 9, color: "rgba(255,210,63,0.85)", fontWeight: 800, letterSpacing: 1.5 }}>← 1</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--af-yellow)", fontWeight: 800, lineHeight: 1, marginTop: 2, textShadow: "0 0 10px rgba(255,210,63,0.55)", textTransform: "uppercase" }}>{spectrum.left}</div>
            </div>
            <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg, var(--af-yellow), white 50%, var(--af-pink))", borderRadius: 99, boxShadow: "0 0 8px white" }} />
            <div className="text-right">
              <div style={{ fontFamily: "var(--font-mono-face)", fontSize: 9, color: "rgba(255,62,165,0.85)", fontWeight: 800, letterSpacing: 1.5 }}>10 →</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--af-pink)", fontWeight: 800, lineHeight: 1, marginTop: 2, textShadow: "0 0 10px rgba(255,62,165,0.55)", textTransform: "uppercase" }}>{spectrum.right}</div>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

/** Glass neon console wrapping the dial. */
export function NeonConsole({ readout, children }: { readout?: string; children: ReactNode }) {
  return (
    <div className="relative z-[3] mx-5 mt-3" >
      <div className="relative" style={{
        padding: "16px 12px 8px", background: "linear-gradient(180deg, rgba(10,4,32,0.85), rgba(10,4,32,0.65))",
        borderRadius: 18, border: "1.5px solid rgba(255,62,165,0.45)",
        boxShadow: "0 0 30px rgba(255,62,165,0.25), inset 0 0 30px rgba(255,62,165,0.08)",
      }}>
        {[{ l: 10, t: 10, c: "#FF3EA5" }, { r: 10, t: 10, c: "#3DDC97" }, { l: 10, b: 10, c: "#FFD23F" }, { r: 10, b: 10, c: "#5B36D6" }].map((p, i) => (
          <div key={i} className="absolute rounded-full" style={{ left: p.l, right: p.r, top: p.t, bottom: p.b, width: 6, height: 6, background: p.c, boxShadow: `0 0 8px ${p.c}`, animation: `mascot-flicker ${0.7 + i * 0.2}s ease-in-out infinite alternate` }} />
        ))}
        {readout && (
          <div className="text-center" style={{ marginBottom: 4, fontFamily: "var(--font-mono-face)", color: "#FFD23F", fontSize: 11, fontWeight: 800, letterSpacing: 3, textShadow: "0 0 8px rgba(255,210,63,0.6)" }}>
            ▸ {readout} ◂
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Cassette-tape styled clue input. */
export function CassetteInput({ value, onChange, onSubmit, placeholder }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string;
}) {
  return (
    <div className="relative z-[3] px-5 pb-2 pt-3">
      <div style={{
        padding: "12px 16px 14px", background: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))",
        border: "1.5px solid rgba(122,78,232,0.55)", borderRadius: 14,
        boxShadow: "0 0 24px rgba(91,54,214,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}>
        <div className="mb-1.5 flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-mono-face)", fontSize: 9, color: "#B5A1FF", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>◉ TON INDICE · LIVE</span>
          <div className="flex gap-1.5">
            {[0, 1].map((i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: "radial-gradient(circle, #1A0E2E 0%, #1A0E2E 30%, transparent 31%), conic-gradient(from 0deg, #FF3EA5, #FFD23F, #3DDC97, #FF3EA5)", animation: "mascot-spin 2.4s linear infinite", animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>
        </div>
        <input
          value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={placeholder} maxLength={60} autoComplete="off"
          className="w-full bg-transparent outline-none"
          style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "white", textShadow: "0 0 8px rgba(122,78,232,0.4)" }}
        />
      </div>
      <button onClick={onSubmit} disabled={!value.trim()} className="af-btn mt-3 w-full disabled:opacity-40" style={{
        background: "linear-gradient(135deg, #FF3EA5 0%, #FF6B5B 100%)", textTransform: "uppercase", letterSpacing: 1,
        boxShadow: "0 8px 28px rgba(255,62,165,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}>
        ▶ Émettre l&apos;indice
      </button>
    </div>
  );
}
