"use client";

/**
 * Version découverte des jeux gratuits de l'app Zinzin (freemium) :
 * - <PremiumNudge> : petite bannière sticker, discrète et fermable, affichée
 *   UNIQUEMENT en fin de manche / de partie (jamais pendant qu'on joue),
 *   au plus une fois par partie. Tap → écran d'abonnement Zinzin+.
 * - <LockedPack> : pack / thème réservé à Zinzin+, visible dans les réglages
 *   avec un cadenas (et un aperçu de 2-3 cartes). Tap → paywall.
 * Rien ne s'affiche quand Zinzin+ est actif, ni sur le site web (useUnlocked).
 */

import { useState, type CSSProperties } from "react";
import { ArrowRight, Lock, X } from "lucide-react";
import { requestPaywall, useUnlocked } from "@/lib/entitlements";
import { type I18n, type Lang, getLang, useT } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";

const INK = "#15082E";

/** Arrondi « vendeur » mais honnête (2 937 → 2 900, 512 → 500, 87 → 80). */
export function roundDown(n: number): number {
  if (n >= 1000) return Math.floor(n / 100) * 100;
  if (n >= 200) return Math.floor(n / 50) * 50;
  if (n >= 20) return Math.floor(n / 10) * 10;
  return n;
}

/** Nombre formaté dans la langue (FR/ES : espace fine insécable, EN : virgule). */
export function fmtCount(n: number, lang: Lang = getLang()): string {
  const r = roundDown(n);
  if (lang === "en") return r.toLocaleString("en-US");
  return r >= 1000 ? `${Math.floor(r / 1000)} ${String(r % 1000).padStart(3, "0")}` : String(r);
}

export const PLUS_STR: I18n<{
  plus: string;
  close: string;
  inPlus: string;
  lockedAria: (name: string) => string;
  unlockAll: string;
  free: string;
  quote: (s: string) => string;
}> = {
  fr: {
    plus: "Zinzin+",
    close: "Fermer",
    inPlus: "Dans Zinzin+",
    lockedAria: (name) => `${name} : disponible avec Zinzin+`,
    unlockAll: "Tout débloquer avec Zinzin+",
    free: "Gratuit",
    quote: (s) => `«\u00a0${s}\u00a0»`,
  },
  en: {
    plus: "Zinzin+",
    close: "Close",
    inPlus: "In Zinzin+",
    lockedAria: (name) => `${name}: available with Zinzin+`,
    unlockAll: "Unlock everything with Zinzin+",
    free: "Free",
    quote: (s) => `“${s}”`,
  },
  es: {
    plus: "Zinzin+",
    close: "Cerrar",
    inPlus: "En Zinzin+",
    lockedAria: (name) => `${name}: disponible con Zinzin+`,
    unlockAll: "Desbloquéalo todo con Zinzin+",
    free: "Gratis",
    quote: (s) => `«${s}»`,
  },
};

/**
 * Textes des bannières de fin, ton complice (n = contenu en plus dans Zinzin+,
 * déjà formaté avec fmtCount).
 */
export const NUDGE_STR: I18n<{
  undercover: (n: string) => string;
  topTen: (n: string) => string;
  tuPrefere: (n: string) => string;
  picolette: (n: string) => string;
  purete: string;
  patate: (n: string) => string;
  makeGuess: (n: string) => string;
}> = {
  fr: {
    undercover: (n) => `Déjà vu ces mots ? Il reste ${n} paires (et les thèmes coquins) dans Zinzin+`,
    topTen: (n) => `Vous connaissez ces thèmes par cœur ? ${n} autres (et des bien chauds) dans Zinzin+`,
    tuPrefere: (n) => `Envie de pire ? +${n} dilemmes (Chaud, Absurde, Couple) dans Zinzin+`,
    picolette: (n) => `Vous connaissez ces cartes par cœur ? +${n} cartes dans Zinzin+`,
    purete: "Le Test Officiel Zinzin (50 questions bien chaudes) est dans Zinzin+",
    patate: (n) => `Vous avez fait le tour des catégories ? +${n} autres dans Zinzin+`,
    makeGuess: (n) => `Déjà vu ces mots ? Il en reste ${n} autres dans Zinzin+`,
  },
  en: {
    undercover: (n) => `Seen these words before? ${n} more pairs (plus the naughty themes) in Zinzin+`,
    topTen: (n) => `Know these themes by heart? ${n} more (some pretty spicy) in Zinzin+`,
    tuPrefere: (n) => `Want worse? +${n} dilemmas (Spicy, Absurd, Couples) in Zinzin+`,
    picolette: (n) => `Know these cards by heart? +${n} more cards in Zinzin+`,
    purete: "The Official Zinzin Test (50 spicy questions) is in Zinzin+",
    patate: (n) => `Done all the categories? +${n} more in Zinzin+`,
    makeGuess: (n) => `Seen these words before? ${n} more waiting in Zinzin+`,
  },
  es: {
    undercover: (n) => `¿Ya conocéis estas palabras? Quedan ${n} parejas (y los temas picantes) en Zinzin+`,
    topTen: (n) => `¿Os sabéis estos temas de memoria? ${n} más (algunos bien picantes) en Zinzin+`,
    tuPrefere: (n) => `¿Queréis algo peor? +${n} dilemas (Picante, Absurdo, Pareja) en Zinzin+`,
    picolette: (n) => `¿Os sabéis estas cartas de memoria? +${n} cartas más en Zinzin+`,
    purete: "El Test Oficial Zinzin (50 preguntas bien picantes) está en Zinzin+",
    patate: (n) => `¿Ya habéis hecho todas las categorías? +${n} más en Zinzin+`,
    makeGuess: (n) => `¿Ya habéis visto estas palabras? Quedan ${n} más en Zinzin+`,
  },
};

/** Hook : textes des bannières dans la langue courante. */
export function useNudgeText() {
  return useT(NUDGE_STR);
}

/**
 * Bannière de fin de partie (fermable). Ne rend rien si Zinzin+ est actif / site web.
 * À placer sur l'écran de fin (ou de fin de manche) — une seule par partie.
 */
export function PremiumNudge({ text, style, tilt = -1 }: { text: string; style?: CSSProperties; tilt?: number }) {
  const unlocked = useUnlocked();
  const t = useT(PLUS_STR);
  const [closed, setClosed] = useState(false);
  if (unlocked || closed) return null;
  return (
    <div
      data-zz-nudge
      className="relative flex w-full items-stretch"
      style={{
        background: "#FFF6E5",
        color: INK,
        border: `2.5px solid ${INK}`,
        boxShadow: `0 3px 0 ${INK}`,
        borderRadius: 20,
        rotate: tilt ? `${tilt}deg` : undefined,
        animation: "zzNudgeIn 420ms cubic-bezier(.2,1.4,.4,1) both",
        ...style,
      }}
    >
      <style>{"@keyframes zzNudgeIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}"}</style>
      <button
        type="button"
        onClick={() => { playSfx("tap", { volume: 0.5 }); void requestPaywall(); }}
        className="flex min-h-[52px] flex-1 items-center gap-2.5 py-2 pl-3 pr-1 text-left"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      >
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[12.5px] font-extrabold"
          style={{ background: "#FF3EA5", color: "#fff", border: `2px solid ${INK}`, rotate: "-4deg" }}
        >
          {t.plus}
        </span>
        <span className="min-w-0 flex-1 text-[14px] font-bold leading-snug">{text}</span>
        <ArrowRight size={18} strokeWidth={3} aria-hidden className="shrink-0" />
      </button>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label={t.close}
        className="grid w-11 shrink-0 place-items-center"
        style={{ borderLeft: `2px dashed rgba(21,8,46,0.25)`, touchAction: "manipulation" }}
      >
        <X size={18} strokeWidth={3} aria-hidden />
      </button>
    </div>
  );
}

/**
 * Pack / thème réservé à Zinzin+ dans les réglages d'un jeu : cadenas + aperçu.
 * Tap → paywall. (À n'afficher que si !useUnlocked().)
 */
export function LockedPack({
  label,
  preview,
  emoji,
  style,
}: {
  label: string;
  /** 2-3 cartes d'exemple affichées en petit */
  preview?: string[];
  emoji?: string;
  style?: CSSProperties;
}) {
  const t = useT(PLUS_STR);
  return (
    <button
      type="button"
      onClick={() => { playSfx("tap", { volume: 0.5 }); void requestPaywall(); }}
      aria-label={t.lockedAria(label)}
      className="w-full text-left transition-[translate,box-shadow] shadow-[0_3px_0_#15082E] active:translate-y-[2px] active:shadow-[0_1px_0_#15082E]"
      style={{
        display: "block", padding: "10px 14px", minHeight: 44, borderRadius: 18,
        background: "#fff", color: INK, border: `2.5px solid ${INK}`,
        touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <span className="flex items-center gap-2">
        <Lock size={15} strokeWidth={3} aria-hidden className="shrink-0" />
        {emoji && <span aria-hidden>{emoji}</span>}
        <span className="min-w-0 flex-1 text-[15px] font-extrabold leading-tight">{label}</span>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-extrabold" style={{ background: "#FFD23F", border: `2px solid ${INK}` }}>
          {t.plus}
        </span>
      </span>
      {preview && preview.length > 0 && (
        <span className="mt-1.5 block text-[13px] font-semibold leading-snug" style={{ opacity: 0.7 }}>
          {preview.slice(0, 3).map(t.quote).join(" · ")}
        </span>
      )}
    </button>
  );
}
