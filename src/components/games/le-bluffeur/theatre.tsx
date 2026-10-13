"use client";

/**
 * Habillage du Bluffeur en DA « sticker » (fond jaune plein, cartes à contour
 * épais et ombre dure). Les noms d'export sont gardés (TheatreScreen…) pour
 * le mode en ligne.
 */

import type { ReactNode } from "react";
import { DISPLAY, ZChip, ZScreen } from "@/components/games/local-kit";
import { GAME_INK } from "@/components/games/game-icon-button";
import { useT } from "@/lib/i18n";
import { STR } from "@/components/games/le-bluffeur/i18n";

export const BLUFF_COLOR = "#FFD23F";

export function TheatreScreen({
  round, total, children, tools,
}: {
  round: number; total: number; children: ReactNode; tools?: ReactNode;
}) {
  const t = useT(STR);
  return (
    <ZScreen bg={BLUFF_COLOR} tools={tools}>
      <div className="flex flex-wrap items-center gap-2">
        <ZChip bg="#fff" tilt={-2}>{t.round(round, total)}</ZChip>
        <ZChip bg={GAME_INK} tilt={2}>{t.perFooled}</ZChip>
      </div>
      {children}
    </ZScreen>
  );
}

/** Carte question : le trou « ___ » devient une ligne à remplir. */
export function QuestionBillboard({ question, take }: { question: string | null; take?: string }) {
  const t = useT(STR);
  const parts = (question ?? "").split(/_{2,}/);
  const rest = parts.slice(1).join(" ");
  return (
    <div className="relative mt-6">
      <div
        className="relative rounded-[26px] px-5 pb-6 pt-7"
        style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 6px 0 ${GAME_INK}`, rotate: "-1.5deg" }}
      >
        <span
          className="absolute -top-4 left-4 inline-flex min-h-8 items-center rounded-full px-3 text-[14px] font-bold"
          style={{ background: "#FF3EA5", color: GAME_INK, border: `2.5px solid ${GAME_INK}`, rotate: "-3deg" }}
        >
          {take ? `${t.didYouKnow} · ${take}` : t.didYouKnow}
        </span>
        <h2 style={{ ...DISPLAY, fontSize: (question ?? "").length > 90 ? 24 : 28, lineHeight: 1.12 }}>
          {parts[0]}
          {parts.length > 1 && (
            // Le trou et la ponctuation qui le suit restent collés (pas de « . » seul en début de ligne)
            <span className="whitespace-nowrap">
              <span className="inline-block text-center align-baseline" style={{ minWidth: 86, borderBottom: `4px solid #FF3EA5`, color: "#FF3EA5" }}>
                ?
              </span>
              {rest.match(/^[.,!?;:…]+/)?.[0] ?? ""}
            </span>
          )}
          {rest.replace(/^[.,!?;:…]+/, "")}
        </h2>
      </div>
    </div>
  );
}

/** Temps restant (mode en ligne) : barre sticker. */
export function RecWave({ timeLeft, max }: { timeLeft: number; max: number }) {
  const frac = max > 0 ? Math.max(0, Math.min(1, timeLeft / max)) : 1;
  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="h-5 flex-1 overflow-hidden rounded-full" style={{ background: "#fff", border: `2.5px solid ${GAME_INK}` }}>
        <div className="h-full transition-[width] duration-1000 ease-linear" style={{ width: `${frac * 100}%`, background: timeLeft <= 5 ? "#FF3EA5" : "#3DDC97" }} />
      </div>
      <span className="w-12 text-right text-[20px]" style={{ ...DISPLAY, color: GAME_INK }}>{timeLeft}s</span>
    </div>
  );
}
