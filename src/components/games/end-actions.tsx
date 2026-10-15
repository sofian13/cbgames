"use client";

import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { isOfflineApp } from "@/lib/offline-app";
import { useSoireeNext } from "@/components/games/soiree-next";

/**
 * Actions des écrans de fin, communes à tous les jeux (app Zinzin + site) :
 * - une seule action principale : « Jeu suivant » dans une Soirée, sinon « Rejouer » ;
 * - le reste en petites pastilles sur une ligne (Partager, Une idée ?, Joueurs…) ;
 * - pas de « Retour à l'accueil » dans l'app : la croix en haut à gauche le fait déjà.
 * Tout reste dans le flux de la page (pas de barre collée en bas).
 */

const INK = "#15082E";

/** Rappel « retour à l'accueil » de fin de partie : rien dans l'app (la croix suffit). */
export function endHome<T>(cb: T | undefined): T | undefined {
  return isOfflineApp() ? undefined : cb;
}

/**
 * « Rejouer » : hors Soirée, le gros bouton du jeu (children) ;
 * dans une Soirée, « Jeu suivant » est le principal → simple bouton contour, plus discret.
 */
export function EndReplay({ onClick, label, children, className = "" }: {
  onClick: () => void;
  label: ReactNode;
  /** Gros bouton du jeu, affiché hors Soirée */
  children: ReactNode;
  className?: string;
}) {
  const next = useSoireeNext();
  if (!next) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mx-auto flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[17px] font-extrabold leading-tight transition-transform active:translate-y-[2px] ${className}`}
      style={{ border: "2.5px solid currentColor", background: "transparent", touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      <RotateCcw size={18} strokeWidth={3} aria-hidden /> {label}
    </button>
  );
}

/** Ligne de petites pastilles secondaires (tient en 375 px). */
export function EndPills({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex w-full flex-wrap items-center justify-center gap-2.5 ${className}`}>{children}</div>;
}

/** Pastille secondaire (même gabarit que Partager / Une idée ?). */
export function EndPill({ onClick, children, bg = "#fff", color = INK }: {
  onClick: () => void;
  children: ReactNode;
  bg?: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap px-3.5 text-[14px] font-extrabold transition-transform active:translate-y-[2px]"
      style={{ background: bg, color, border: `2.5px solid ${INK}`, boxShadow: `0 3px 0 ${INK}`, borderRadius: 999, touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}

/** Lien discret « Retour à l'accueil » : site web seulement. */
export function EndHomeLink({ onClick, children, color = "rgba(255,255,255,0.85)", className = "" }: {
  onClick?: () => void;
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  const cb = endHome(onClick);
  if (!cb) return null;
  return (
    <button
      type="button"
      onClick={cb}
      className={`mx-auto flex min-h-11 items-center justify-center gap-1.5 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4 ${className}`}
      style={{ color }}
    >
      {children}
    </button>
  );
}
