"use client";

/**
 * Loup-Garou : petits effets autour des blobs de rôle — gerbe de particules à
 * la révélation (poils/lunes, étoiles, bulles, cœurs…), dormeurs de la nuit,
 * bande des vainqueurs en fin de partie. Tout est décoratif (aria-hidden) et
 * coupé si l'utilisateur préfère moins de mouvement.
 */

import type { ReactNode } from "react";
import type { Player, RoleId, Winner } from "./lg-local-data";
import { LgBlobStyles, RoleBlob } from "./lg-role-blob";

const INK = "#15082E";

// ── Particules thématiques ────────────────────────────────────
type Shape = "star" | "heart" | "bubble" | "moon" | "fur" | "straw" | "leaf" | "cork" | "feather" | "shield";

const SHAPES: Record<Shape, (fill: string) => ReactNode> = {
  star: (f) => <path d="M10 0 L12.6 7.4 L20 10 L12.6 12.6 L10 20 L7.4 12.6 L0 10 L7.4 7.4Z" fill={f} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />,
  heart: (f) => <path d="M10 18 C2 12 0 7 3 4 C6 1 9 3 10 5 C11 3 14 1 17 4 C20 7 18 12 10 18Z" fill={f} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />,
  bubble: (f) => <g><circle cx={10} cy={10} r={8} fill={f} stroke={INK} strokeWidth={1.6} /><circle cx={7} cy={7} r={2.2} fill="#fff" /></g>,
  moon: (f) => <path d="M13 2 A8.5 8.5 0 1 0 18.5 14 A6.6 6.6 0 1 1 13 2Z" fill={f} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />,
  fur: (f) => <path d="M2 17 L5 5 L8.5 12 L11 2 L13.5 12 L17 6 L18 17Z" fill={f} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />,
  straw: (f) => <g strokeLinecap="round"><path d="M3 17 L17 3" stroke={INK} strokeWidth={5} /><path d="M3 17 L17 3" stroke={f} strokeWidth={2.4} /></g>,
  leaf: (f) => <path d="M3 17 C3 8 8 3 17 3 C17 12 12 17 3 17Z" fill={f} stroke={INK} strokeWidth={1.5} />,
  cork: (f) => <rect x={5} y={3} width={10} height={14} rx={3} fill={f} stroke={INK} strokeWidth={1.6} />,
  feather: (f) => <path d="M3 17 C6 8 12 3 18 2 C17 8 12 14 3 17Z" fill={f} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />,
  shield: (f) => <path d="M3 3 H17 V10 C17 14 13 17 10 18 C7 17 3 14 3 10Z" fill={f} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />,
};

const BURST: Record<RoleId, [Shape, string][]> = {
  loup: [["fur", "#9A93C2"], ["moon", "#FFE27A"], ["fur", "#5E5791"], ["moon", "#FFF6E5"]],
  villageois: [["straw", "#F4CE5C"], ["leaf", "#3DDC97"], ["straw", "#FFE27A"], ["leaf", "#8FD14F"]],
  voyante: [["star", "#FFE27A"], ["star", "#fff"], ["star", "#9BE7FF"], ["star", "#FF4FA8"]],
  sorciere: [["bubble", "#3DDC97"], ["bubble", "#A35CFF"], ["star", "#FFE27A"], ["bubble", "#8FD14F"]],
  chasseur: [["cork", "#E2B07A"], ["feather", "#FF4D5E"], ["leaf", "#3C9447"], ["star", "#FFE27A"]],
  cupidon: [["heart", "#FF2E7E"], ["heart", "#FFA5CD"], ["heart", "#fff"], ["star", "#FFE27A"]],
  gardien: [["shield", "#FFD23F"], ["star", "#fff"], ["shield", "#B2C8FF"], ["star", "#FFE27A"]],
};

/** Pseudo-aléatoire stable (pas de Math.random au rendu) */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Gerbe de particules du rôle, centrée sur le parent (position relative) */
export function RoleBurst({ role, count = 16, spread = 1 }: { role: RoleId; count?: number; spread?: number }) {
  const kinds = BURST[role];
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }}>
      <LgBlobStyles />
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + rnd(i, 1) * 0.5;
        const d = (80 + rnd(i, 2) * 70) * spread;
        const s = 14 + rnd(i, 3) * 12;
        const [shape, fill] = kinds[i % kinds.length];
        return (
          <span
            key={i}
            className="lgb-p"
            style={{
              width: s, height: s,
              ["--dx" as string]: `${Math.cos(a) * d}px`,
              ["--dy" as string]: `${Math.sin(a) * d * 0.85 - 10}px`,
              ["--rot" as string]: `${(rnd(i, 4) - 0.5) * 300}deg`,
              animationDelay: `${0.12 + rnd(i, 5) * 0.18}s`,
            }}
          >
            <svg viewBox="0 0 20 20" width={s} height={s} style={{ overflow: "visible", display: "block" }}>{SHAPES[shape](fill)}</svg>
          </span>
        );
      })}
    </span>
  );
}

// ── La nuit : le village dort… sauf un ────────────────────────
/** Trois dormeurs en bonnet de nuit ; le loup déguisé garde les yeux qui brillent */
export function NightSleepers({ size = 74 }: { size?: number }) {
  return (
    <div aria-hidden className="flex items-end justify-center" style={{ gap: size * 0.08 }}>
      <RoleBlob role="villageois" state="asleep" size={size} delay={0.4} />
      <RoleBlob role="loup" disguised state="asleep" size={size * 1.08} delay={1.1} />
      <RoleBlob role="voyante" state="asleep" size={size} delay={1.8} />
    </div>
  );
}

// ── Fin de partie : la bande du camp gagnant ─────────────────
function Moon({ size }: { size: number }) {
  return (
    <span aria-hidden className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full" style={{ width: size, height: size, background: "#FFF1A6", border: `3px solid ${INK}`, boxShadow: `0 0 0 10px rgba(255,241,166,0.18), 0 0 46px 18px rgba(255,241,166,0.35)` }}>
      <span className="absolute rounded-full" style={{ left: "22%", top: "30%", width: size * 0.18, height: size * 0.18, background: "#F2D36B" }} />
      <span className="absolute rounded-full" style={{ left: "58%", top: "54%", width: size * 0.12, height: size * 0.12, background: "#F2D36B" }} />
    </span>
  );
}

export function WinnersParade({ players, winner, lovers }: { players: Player[]; winner: Winner; lovers: [number, number] | null }) {
  const band = winner === "loups" ? players.filter((p) => p.role === "loup")
    : winner === "village" ? players.filter((p) => p.role !== "loup")
    : winner === "amoureux" ? players.filter((p) => lovers?.includes(p.id))
    : players;
  const n = band.length;
  const size = n <= 2 ? 104 : n <= 4 ? 84 : n <= 6 ? 68 : n <= 9 ? 58 : 50;
  const wolves = winner === "loups";
  return (
    <div aria-hidden className="relative flex flex-col items-center" style={{ paddingTop: wolves ? 34 : 6 }}>
      {wolves && <Moon size={92} />}
      {winner === "amoureux" && <span className="absolute inset-x-0 top-6 h-24"><RoleBurst role="cupidon" count={12} spread={0.8} /></span>}
      <div className="relative flex flex-wrap items-end justify-center" style={{ gap: "6px 4px", maxWidth: 380 }}>
        {band.map((p, k) => {
          const dead = !p.alive || winner === "personne";
          const state = dead ? "ghost" : wolves ? "howl" : "cheer";
          return (
            <div key={p.id} className="flex flex-col items-center" style={{ width: size + 10 }}>
              <RoleBlob role={p.role} size={size} state={state} delay={k * 0.13} />
              <span className="mt-1 max-w-full truncate rounded-full px-2 text-[12px] font-bold leading-[18px]" style={{ background: "#fff", color: INK, border: `2px solid ${INK}`, opacity: dead ? 0.75 : 1 }}>
                {p.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
