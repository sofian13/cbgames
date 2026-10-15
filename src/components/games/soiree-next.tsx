"use client";

import { createContext, useContext, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { ZButton } from "@/components/games/local-kit";

/**
 * Soirée Zinzin (app) : l'écran de jeu de la Soirée fournit ce contexte pour que
 * l'écran de fin de chaque jeu affiche « Jeu suivant → » juste au-dessus de « Rejouer ».
 * Hors Soirée (partie simple, site web) : pas de contexte → le bouton ne rend rien.
 */
export interface SoireeNext {
  /** « Jeu suivant » ou « Voir les résultats » au dernier jeu */
  label: string;
  onNext: () => void;
}

export const SoireeNextContext = createContext<SoireeNext | null>(null);

export function useSoireeNext(): SoireeNext | null {
  return useContext(SoireeNextContext);
}

/** Gros bouton « Jeu suivant → » (même style que les gros boutons des jeux) ; rien hors Soirée. */
export function SoireeNextButton({ bg = "#FFD23F", className, style }: { bg?: string; className?: string; style?: CSSProperties }) {
  const next = useSoireeNext();
  if (!next) return null;
  return (
    <ZButton bg={bg} onClick={next.onNext} className={className} style={style}>
      {next.label} <ArrowRight size={22} strokeWidth={3} aria-hidden />
    </ZButton>
  );
}
