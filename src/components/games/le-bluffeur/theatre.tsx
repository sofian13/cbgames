"use client";

/**
 * Theatre DA for Le Bluffeur — stage / spotlight / art-deco marquee.
 * Faithful port of the prototype "STAGE / SPOTLIGHT" Question screen.
 */

import type { ReactNode } from "react";

const CURTAIN_CLIP =
  "polygon(0 0, 100% 0, 100% 60%, 96% 100%, 92% 60%, 88% 100%, 84% 60%, 80% 100%, 76% 60%, 72% 100%, 68% 60%, 64% 100%, 60% 60%, 56% 100%, 52% 60%, 48% 100%, 44% 60%, 40% 100%, 36% 60%, 32% 100%, 28% 60%, 24% 100%, 20% 60%, 16% 100%, 12% 60%, 8% 100%, 4% 60%, 0 100%)";

export function TheatreScreen({
  round, total, children,
}: {
  round: number; total: number; children: ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-[100svh] flex-col overflow-hidden text-white"
      style={{ background: "radial-gradient(ellipse 90% 60% at 50% 18%, rgba(255,220,170,0.20) 0%, transparent 55%), linear-gradient(180deg, #1A0808 0%, #0A0204 50%, #0E0828 100%)" }}
    >
      {/* Rideau de scène */}
      <div className="absolute inset-x-0 top-0 z-[2]" style={{
        height: 32,
        background: "repeating-linear-gradient(90deg, #8B1A2A 0px, #6B0E1C 14px, #8B1A2A 28px, #A82336 42px)",
        clipPath: CURTAIN_CLIP, boxShadow: "0 6px 14px rgba(0,0,0,0.6)",
      }} />
      {/* Faisceau de spot */}
      <div className="pointer-events-none absolute left-1/2 top-[30px] z-[1] -translate-x-1/2" style={{
        width: "120%", height: "70%",
        background: "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(255,235,200,0.18) 0%, rgba(255,235,200,0.05) 35%, transparent 65%)",
      }} />

      {/* ON AIR */}
      <div className="relative z-[3] flex items-center justify-center px-6 pt-14">
        <div className="inline-flex items-center gap-2" style={{
          padding: "6px 14px", borderRadius: 4, background: "#C8102E", border: "2px solid #FFD23F",
          fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: 2, fontSize: 11,
          boxShadow: "0 0 20px rgba(200,16,46,0.6), inset 0 0 8px rgba(255,255,255,0.15)",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "white", boxShadow: "0 0 8px white", animation: "mascot-flicker 0.8s ease-in-out infinite alternate" }} />
          ON AIR · MANCHE {round}/{total}
        </div>
      </div>

      {children}
    </div>
  );
}

export function QuestionBillboard({ question, take }: { question: string | null; take?: string }) {
  const parts = (question ?? "").split(/_{2,}/);
  return (
    <div className="relative z-[3] mx-[18px] my-3 flex-1">
      {/* Cadre doré */}
      <div className="relative h-full" style={{
        padding: 8, borderRadius: 20,
        background: "linear-gradient(135deg, #FFD96B 0%, #C48800 30%, #FFD96B 60%, #8E5C00 100%)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.7), inset 0 0 0 2px rgba(0,0,0,0.25)",
      }}>
        {/* Ampoules */}
        {Array.from({ length: 22 }).map((_, i) => {
          const onTop = i < 11;
          const x = onTop ? i * 9 + 4.5 : (22 - i) * 9 - 4.5;
          return (
            <div key={i} className="absolute z-[4]" style={{
              top: onTop ? -4 : "auto", bottom: onTop ? "auto" : -4, left: `${x}%`,
              width: 8, height: 8, borderRadius: "50%",
              background: i % 3 === 0 ? "#FFE891" : "#FFD23F",
              boxShadow: "0 0 8px #FFD23F, 0 0 14px rgba(255,210,63,0.5)",
              animation: `mascot-blink ${1.5 + (i % 4) * 0.3}s steps(1) infinite`, animationDelay: `${i * 0.08}s`,
            }} />
          );
        })}

        {/* Carte scène */}
        <div className="relative flex h-full flex-col overflow-hidden" style={{
          background: "linear-gradient(180deg, #2A0F12 0%, #0E0204 100%)", borderRadius: 14,
          padding: "22px 22px 18px", boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,210,63,0.2)",
        }}>
          <div className="pointer-events-none absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)" }} />

          {/* Clap catégorie */}
          <div className="relative z-[2] inline-flex items-center gap-1.5 self-start" style={{
            padding: "4px 10px", background: "linear-gradient(90deg, #FFD23F 0%, #FFE891 100%)", color: "#1A0E2E",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
            borderRadius: 3, boxShadow: "0 2px 6px rgba(255,210,63,0.4)",
          }}>
            <span style={{ fontSize: 12 }}>🎬</span>{take ? `Le saviez-vous · ${take}` : "Le saviez-vous"}
          </div>

          {/* Question */}
          <h2 className="relative z-[2] mt-4" style={{
            fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.2, color: "#FFE7D2",
            letterSpacing: -0.3, textShadow: "0 2px 0 rgba(0,0,0,0.4)",
          }}>
            {parts[0]}
            {parts.length > 1 && (
              <span className="inline-block" style={{
                padding: "2px 12px 4px", color: "#FFD23F", fontFamily: "var(--font-mono-face)",
                letterSpacing: 4, borderBottom: "3px solid #FFD23F", fontWeight: 900,
                textShadow: "0 0 12px rgba(255,210,63,0.6)",
              }}>_ _ _ _</span>
            )}
            {parts.slice(1).join(" ")}
          </h2>

          {/* Footer */}
          <div className="relative z-[2] mt-auto flex items-center justify-between pt-4" style={{ borderTop: "1px dashed rgba(255,210,63,0.30)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, color: "#FFE7D2", letterSpacing: 1, textTransform: "uppercase" }}>
              ★ Invente. Trompe. Triomphe.
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 3, background: "rgba(255,210,63,0.18)", border: "1px solid rgba(255,210,63,0.40)", fontFamily: "var(--font-mono-face)", fontSize: 10, color: "#FFD23F", fontWeight: 800, letterSpacing: 1 }}>
              +20 SI PIÉGÉ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecWave({ timeLeft, max }: { timeLeft: number; max: number }) {
  const frac = max > 0 ? Math.max(0, Math.min(1, timeLeft / max)) : 1;
  const lit = Math.round(28 * frac);
  return (
    <div className="relative z-[3] px-6 pb-2">
      <div className="mb-1.5 flex items-center gap-2">
        <span style={{ fontFamily: "var(--font-mono-face)", fontSize: 10, color: "#FFD23F", fontWeight: 800, letterSpacing: 1 }}>REC ●</span>
        <div className="flex h-[18px] flex-1 items-end gap-[2px]">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="flex-1" style={{
              height: `${30 + Math.abs(Math.sin(i * 0.7)) * 70}%`,
              background: i < lit ? "linear-gradient(180deg, #FF3EA5 0%, #FFD23F 100%)" : "rgba(255,255,255,0.1)",
              borderRadius: 1,
              animation: i < lit ? `mascot-flicker ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : "none",
            }} />
          ))}
        </div>
        <span style={{ fontFamily: "var(--font-mono-face)", fontSize: 11, color: "white", fontWeight: 800, letterSpacing: 1 }}>{timeLeft}s</span>
      </div>
    </div>
  );
}
