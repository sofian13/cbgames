"use client";

import { useState } from "react";
import { Check, Share } from "lucide-react";
import { type I18n, useT } from "@/lib/i18n";
import { isOfflineApp } from "@/lib/offline-app";
import { playSfx } from "@/lib/sfx";
import { type ShareCard, shareResultCard } from "@/lib/share-card";

/**
 * Bouton secondaire « Partager mon résultat » des écrans de fin (app Zinzin) :
 * génère l'image story 1080×1920 du résultat et ouvre la feuille de partage.
 * Rien n'est envoyé ailleurs que là où le joueur choisit de partager.
 * Masqué sur le site web (la carte renvoie vers l'app).
 */

const INK = "#15082E";

const STR: I18n<{ share: string; short: string; busy: string; saved: string; shared: string; failed: string }> = {
  fr: { share: "Partager mon résultat", short: "Partager", busy: "Création de l'image…", saved: "Image enregistrée", shared: "Partagé !", failed: "Partage impossible" },
  en: { share: "Share my result", short: "Share", busy: "Making the image…", saved: "Image saved", shared: "Shared!", failed: "Couldn't share" },
  es: { share: "Compartir mi resultado", short: "Compartir", busy: "Creando la imagen…", saved: "Imagen guardada", shared: "¡Compartido!", failed: "No se pudo compartir" },
};

export function ShareResultButton({ card, bg = "#fff", className = "", short = false }: {
  /** Données de la carte, calculées au moment du tap */
  card: () => ShareCard;
  bg?: string;
  className?: string;
  /** petite pastille « Partager » (écrans de fin, à côté de « Une idée ? ») */
  short?: boolean;
}) {
  const t = useT(STR);
  const [state, setState] = useState<"idle" | "busy" | "saved" | "shared" | "failed">("idle");
  if (!isOfflineApp()) return null;

  const onClick = async () => {
    if (state === "busy") return;
    playSfx("pop", { volume: 0.5 });
    setState("busy");
    const res = await shareResultCard(card());
    setState(res === "cancelled" ? "idle" : res === "error" ? "failed" : res);
    if (res !== "cancelled") window.setTimeout(() => setState("idle"), 2600);
  };

  const label = state === "busy" ? t.busy : state === "saved" ? t.saved : state === "shared" ? t.shared : state === "failed" ? t.failed : short ? t.short : t.share;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-busy={state === "busy"}
      className={`inline-flex min-h-11 items-center justify-center font-extrabold transition-transform ${short ? "gap-1.5 whitespace-nowrap px-3.5 text-[14px] active:translate-y-[2px]" : "gap-2 px-4 text-[15px] active:translate-y-[3px]"} ${className}`}
      style={{ background: bg, color: INK, border: `2.5px solid ${INK}`, boxShadow: `0 ${short ? 3 : 4}px 0 ${INK}`, borderRadius: 999, opacity: state === "busy" ? 0.75 : 1 }}
    >
      {state === "saved" || state === "shared" ? <Check size={short ? 16 : 18} strokeWidth={3} aria-hidden /> : <Share size={short ? 16 : 18} strokeWidth={3} aria-hidden />}
      <span aria-live="polite">{label}</span>
    </button>
  );
}
