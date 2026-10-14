"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { CupSoda, Drama } from "lucide-react";
import { useT } from "@/lib/i18n";
import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { GameInlineIcon } from "@/components/games/game-icon-button";
import { RerollButton } from "@/components/games/idea-button";
import { DISPLAY, ZCard, ZTitle, ZZ } from "@/components/games/local-kit";
import { CHUT_STR } from "./i18n";

/** Briques communes à tous les modes de « Chut ! ». */

const INK = ZZ.ink;

export interface Sentence { sips: number | null; dare: string }

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <ZTitle size={24} as="h2" className="mb-3">{title}</ZTitle>
      {children}
    </section>
  );
}

/** Carte de peine : 1 à 3 gorgées de zinzin OU un gage (ou gage seul). */
export function SentenceCard({ name, colorIndex, sentence, onReroll, title }: {
  name: string; colorIndex: number; sentence: Sentence; onReroll: () => void; title?: string;
}) {
  const t = useT(CHUT_STR);
  return (
    <ZCard bg={ZZ.cream} className="mt-5 p-4 text-center" shadow={6} radius={26} tilt={-1}>
      <div className="flex items-center justify-center gap-2">
        <PlayerBlob name={name} colorIndex={colorIndex} size={34} mood="dead" bob={false} />
        <span className="min-w-0 text-[22px] leading-tight" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{title ?? t.penaltyFor(name)}</span>
      </div>
      {sentence.sips != null ? (
        <p className="mt-2 text-[17px] font-semibold leading-snug">
          <b style={DISPLAY}><GameInlineIcon icon={CupSoda} /> {t.sips(sentence.sips)}</b> {t.orDare} {sentence.dare}
        </p>
      ) : (
        <p className="mt-2 text-[17px] font-semibold leading-snug"><GameInlineIcon icon={Drama} /> {sentence.dare}</p>
      )}
      <div className="mt-3 flex justify-center">
        <RerollButton onClick={onReroll} label={t.rerollDare} bg={ZZ.yellow} />
      </div>
    </ZCard>
  );
}

/** Gros compte à rebours plein écran (3, 2, 1). */
export function Countdown({ n, sub }: { n: number; sub: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center" style={{ background: "rgba(11,6,32,0.72)" }}>
      <div className="text-center">
        <p key={n} className="chut-pop leading-none" style={{ ...DISPLAY, fontSize: 150, color: ZZ.yellow, WebkitTextStroke: `3px ${INK}`, textShadow: `6px 6px 0 ${INK}` }}>{n}</p>
        <p className="mt-2 text-[18px] font-bold text-white">{sub}</p>
      </div>
    </div>
  );
}

// ── Animations communes + coupure si l'utilisateur réduit les animations ──
export const CHUT_CSS = `
@keyframes chut-pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
@keyframes chut-card { 0% { transform: scale(0.85) rotate(-6deg); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes chut-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-10px) rotate(-2deg); } 40% { transform: translateX(9px) rotate(2deg); } 60% { transform: translateX(-6px); } 80% { transform: translateX(4px); } }
@keyframes chut-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
.chut-pop { animation: chut-pop 0.35s ease-out; }
.chut-card { animation: chut-card 0.35s ease-out; }
.chut-shake { animation: chut-shake 0.45s ease-in-out; }
.chut-pulse { animation: chut-pulse 0.9s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .chut-pop, .chut-card, .chut-shake, .chut-pulse { animation: none !important; }
  .chut-tr { transition: none !important; }
}
`;

export function ChutStyles() {
  return <style>{CHUT_CSS}</style>;
}

const RM = "(prefers-reduced-motion: reduce)";
/** Animations réduites demandées par le système (pour couper les confettis). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof matchMedia === "undefined") return () => {};
      const m = matchMedia(RM);
      m.addEventListener?.("change", cb);
      return () => m.removeEventListener?.("change", cb);
    },
    () => typeof matchMedia !== "undefined" && matchMedia(RM).matches,
    () => false,
  );
}
