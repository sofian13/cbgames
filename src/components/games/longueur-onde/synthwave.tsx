"use client";

/**
 * Habillage du Curseur en DA « sticker » (fond lavande plein, cartes à contour
 * épais, ombre dure). Les noms d'export sont gardés pour le mode en ligne.
 */

import type { ReactNode } from "react";
import { DISPLAY, ZButton, ZChip, ZScreen, ZTitle } from "@/components/games/local-kit";
import { GAME_INK } from "@/components/games/game-icon-button";

export const WAVE_COLOR = "#B5A1FF";

interface Spectrum { left: string; right: string; }

/** Les deux extrêmes de la manche, en stickers face à face. */
export function SpectrumPair({ spectrum }: { spectrum: Spectrum | null }) {
  if (!spectrum) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-[18px] px-3 py-2.5" style={{ background: "#4ECDC4", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}`, rotate: "-1.5deg" }}>
        <p className="text-[13px] font-bold">0 · à gauche</p>
        <p className="text-[18px] leading-tight" style={DISPLAY}>{spectrum.left}</p>
      </div>
      <div className="rounded-[18px] px-3 py-2.5 text-right" style={{ background: "#FF3EA5", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}`, rotate: "1.5deg" }}>
        <p className="text-[13px] font-bold">à droite · 100</p>
        <p className="text-[18px] leading-tight" style={DISPLAY}>{spectrum.right}</p>
      </div>
    </div>
  );
}

export function SynthwaveScreen({
  round, total, spectrum, children, title = "Donne un indice", tools,
}: {
  round: number; total: number; spectrum: Spectrum | null; children: ReactNode; title?: string; tools?: ReactNode;
}) {
  return (
    <ZScreen bg={WAVE_COLOR} tools={tools}>
      <ZChip bg="#fff" tilt={-2}>Manche {round}/{total}</ZChip>
      <ZTitle size={36} className="mt-3">{title}</ZTitle>
      <div className="mt-4"><SpectrumPair spectrum={spectrum} /></div>
      {children}
    </ZScreen>
  );
}

/** Carte qui entoure le cadran (le « readout » devient une petite étiquette). */
export function NeonConsole({ readout, children }: { readout?: string; children: ReactNode }) {
  return (
    <div className="relative mt-5 rounded-[24px] px-3 pb-3 pt-4" style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 5px 0 ${GAME_INK}` }}>
      {readout && (
        <span className="absolute -top-4 left-4 inline-flex min-h-8 items-center rounded-full px-3 text-[14px] font-bold"
          style={{ background: "#FFD23F", border: `2.5px solid ${GAME_INK}`, rotate: "-3deg" }}>
          {readout}
        </span>
      )}
      {children}
    </div>
  );
}

/** Champ de l'indice + bouton d'envoi. */
export function CassetteInput({ value, onChange, onSubmit, placeholder, error }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string; error?: string | null;
}) {
  return (
    <div className="mt-5">
      <div className="rounded-[20px] px-4 pb-3 pt-2.5" style={{ background: "#fff", color: GAME_INK, border: `3px solid ${GAME_INK}`, boxShadow: `0 4px 0 ${GAME_INK}` }}>
        <p className="text-[14px] font-bold">Ton indice (un mot, un exemple)</p>
        <input
          value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={placeholder} maxLength={60} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          className="mt-1 w-full bg-transparent outline-none"
          style={{ ...DISPLAY, fontSize: 22, color: GAME_INK, letterSpacing: "-0.01em" }}
        />
      </div>
      {error && <p role="alert" className="mt-2 text-center text-[15px] font-bold" style={{ color: GAME_INK }}>{error}</p>}
      <ZButton bg={GAME_INK} className="mt-4" onClick={onSubmit} disabled={!value.trim() || !!error}>
        Envoyer l&apos;indice
      </ZButton>
    </div>
  );
}
