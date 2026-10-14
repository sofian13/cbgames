import type { ReactNode } from "react";
import type { MicError, Sensitivity } from "./mic";
import type { Sentence } from "./shared";

/**
 * Les modes de « Chut ! ». Le micro entend UN niveau sonore, pas QUI a fait le bruit :
 * chaque mode fixe donc clairement qui est écouté (celui qui tient le téléphone près
 * de sa bouche, une équipe, ou toute la table).
 */

export type ModeId = "volume" | "whisper" | "crescendo" | "souffle" | "duel" | "table";
export const MODE_IDS: ModeId[] = ["volume", "whisper", "crescendo", "souffle", "duel", "table"];

export type Penalty = "dares" | "sips";

/** Zones de voix sur l'échelle 0..1 de voiceLevel() (mic.ts). */
export type ZoneId = "whisper" | "normal" | "loud" | "shout";
export const ZONE_IDS: ZoneId[] = ["whisper", "normal", "loud", "shout"];
export const ZONES: Record<ZoneId, [number, number]> = {
  whisper: [0.1, 0.34],
  normal: [0.34, 0.56],
  loud: [0.56, 0.76],
  shout: [0.76, 1],
};

/** Une cible de « Le bon volume » : une zone, éventuellement resserrée (niveaux avancés). */
export interface Target {
  zone: ZoneId;
  lo: number;
  hi: number;
  narrow: boolean;
}

export function targetFor(zone: ZoneId, narrow: boolean): Target {
  const [lo, hi] = ZONES[zone];
  if (!narrow) return { zone, lo, hi, narrow };
  // zone étroite : 0,13 de large, centrée dans la zone (le cri reste atteignable)
  const c = zone === "shout" ? 0.86 : (lo + hi) / 2;
  return { zone, lo: c - 0.065, hi: c + 0.065, narrow };
}

/** Bandes du « Souffle » par tour (tour 1 voix normale, puis murmure, puis voix forte). */
export const SOUFFLE_BANDS: ZoneId[] = ["normal", "whisper", "loud"];
export function souffleBand(zone: ZoneId): [number, number] {
  // un peu plus large que la zone : tenir un son est déjà assez dur
  const [lo, hi] = ZONES[zone];
  return [Math.max(0.08, lo - 0.04), Math.min(0.95, hi + 0.06)];
}

/** Crescendo : plafond « explosion », pas minimal entre deux sons, seuil « audible ». */
export const CRESC = { ceiling: 0.92, step: 0.035, audible: 0.07 };

// ── Petits utilitaires (appelés dans des gestionnaires d'événements) ──
export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
export const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export const roll3 = () => 1 + Math.floor(Math.random() * 3);
export const vibrate = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* indispo */ } };
export const secs = (ms: number, dec: string) => (Math.round(ms / 100) / 10).toFixed(1).replace(".", dec);

// ── Props communes des composants de mode ──

export interface ModeCommon {
  players: string[];
  /** Bruit ambiant calibré (dBFS), null si pas calibré */
  floor: number | null;
  /** Sans micro : la table arbitre avec des boutons */
  human: boolean;
  sens: Sensitivity;
  tools: ReactNode;
  overlays: ReactNode;
  onMicFail: (e: MicError) => void;
  onReplay: () => void;
  onQuit?: () => void;
  newSentence: () => Sentence;
  rerollDare: (s: Sentence) => Sentence;
  flash: (msg: string) => void;
}
