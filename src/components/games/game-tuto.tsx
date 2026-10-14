"use client";

/**
 * Tuto en slides partagé par les jeux (généralisé depuis le TutoScreen du Verre Invisible) :
 * carte colorée penchée, vignette SVG animée sur fond nuit, titre Clash Display + une phrase,
 * points de progression, « Suivant » / « Compris ! », lien « Passer », swipe gauche/droite.
 *
 * Utilisation type :
 *   const tuto = useFirstTimeTuto("top-ten");
 *   // à la fin de la saisie des joueurs :  tuto.showIfFirstTime();
 *   {tuto.open && <GameTuto slides={slides} onDone={tuto.close} />}
 *   // dans les règles :  <TutoAgainButton onClick={tuto.show} />
 *
 * Le tuto s'affiche en surimpression (fixed, sous la croix « Quitter » de l'app) :
 * pas besoin d'ajouter une phase au jeu. Clé localStorage : zz-<id>-tuto = "1".
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, PlayCircle, X } from "lucide-react";
import { GameIconButton, GameInlineIcon } from "./game-icon-button";
import { DISPLAY, ZButton, ZZ, zBackground } from "./local-kit";
import { playSfx } from "@/lib/sfx";
import { type I18n, useT } from "@/lib/i18n";

const INK = ZZ.ink;

export type TutoSlide = { title: string; text: string; art: ReactNode };

const STR: I18n<{ next: string; understood: string; skip: string; again: string; rules: string; rulesTitle: string; close: string; slide: (i: number, n: number) => string }> = {
  fr: { next: "Suivant", understood: "Compris !", skip: "Passer", again: "Revoir le tuto", rules: "Règles", rulesTitle: "Les règles", close: "Fermer", slide: (i, n) => `Étape ${i} sur ${n}` },
  en: { next: "Next", understood: "Got it!", skip: "Skip", again: "Watch the tutorial again", rules: "Rules", rulesTitle: "The rules", close: "Close", slide: (i, n) => `Step ${i} of ${n}` },
  es: { next: "Siguiente", understood: "¡Entendido!", skip: "Saltar", again: "Ver el tutorial otra vez", rules: "Reglas", rulesTitle: "Las reglas", close: "Cerrar", slide: (i, n) => `Paso ${i} de ${n}` },
};

/** Couleurs des cartes, dans l'ordre (jaune, bleu ciel, corail, menthe, rose). */
export const TUTO_COLORS = [ZZ.yellow, ZZ.sky, ZZ.coral, ZZ.mint, ZZ.pink];

const tutoKey = (gameId: string) => `zz-${gameId}-tuto`;

/** Le tuto de ce jeu a-t-il déjà été vu ? (stockage indispo = on ne l'impose pas) */
export function tutoSeen(gameId: string): boolean {
  try { return localStorage.getItem(tutoKey(gameId)) === "1"; } catch { return true; }
}

/** Mémorise que le tuto a été vu (fin ou « Passer »). */
export function markTutoSeen(gameId: string) {
  try { localStorage.setItem(tutoKey(gameId), "1"); } catch { /* stockage indispo */ }
}

/**
 * État du tuto « 1re fois » d'un jeu.
 * - showIfFirstTime() : à appeler au moment voulu (après la saisie des joueurs) ; ouvre si jamais vu.
 * - show() : relance manuelle (« Revoir le tuto »).
 * - close() : ferme et mémorise.
 */
export function useFirstTimeTuto(gameId: string) {
  const [open, setOpen] = useState(false);
  const showIfFirstTime = useCallback(() => {
    if (tutoSeen(gameId)) return false;
    setOpen(true);
    return true;
  }, [gameId]);
  const show = useCallback(() => { playSfx("open", { volume: 0.5 }); setOpen(true); }, []);
  const close = useCallback(() => { markTutoSeen(gameId); setOpen(false); }, [gameId]);
  return { open, show, close, showIfFirstTime, seen: () => tutoSeen(gameId) };
}

/** Tuto plein écran en slides (surimpression). */
export function GameTuto({ slides, onDone }: { slides: TutoSlide[]; onDone: () => void }) {
  const t = useT(STR);
  const [i, setI] = useState(0);
  const n = slides.length;
  const idx = Math.min(i, n - 1);
  const last = idx === n - 1;
  const slide = slides[idx];
  const color = TUTO_COLORS[idx % TUTO_COLORS.length];
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const go = (to: number) => {
    if (to < 0 || to >= n) return;
    playSfx("card-slide", { volume: 0.5 });
    setI(to);
  };
  const next = () => {
    if (last) { playSfx("confirm", { volume: 0.5 }); onDone(); } else go(idx + 1);
  };

  // Retour en haut à chaque slide (petits écrans : la carte peut dépasser)
  useEffect(() => { scroller.current?.scrollTo?.({ top: 0 }); }, [idx]);

  return (
    <div
      ref={scroller}
      className="fixed inset-0 flex flex-col items-center overflow-y-auto px-5"
      role="dialog"
      aria-modal
      aria-label={slide?.title}
      style={{
        zIndex: 55,
        background: zBackground(ZZ.night),
        color: "#fff",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        overscrollBehavior: "contain",
      }}
      onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? idx + 1 : idx - 1);
      }}
      onPointerCancel={() => { swipe.current = null; }}
    >
      <div className="flex w-full max-w-md flex-1 flex-col">
        {/* points de progression (touchables) */}
        <div className="flex justify-center gap-2" role="tablist" aria-label={t.slide(idx + 1, n)}>
          {slides.map((_, k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === idx}
              aria-label={t.slide(k + 1, n)}
              onClick={() => go(k)}
              className="grid h-6 place-items-center"
              style={{ touchAction: "manipulation" }}
            >
              <span className="block h-3 rounded-full transition-all" style={{ width: k === idx ? 34 : 12, background: k === idx ? color : "rgba(255,255,255,0.3)", border: `2px solid ${INK}` }} />
            </button>
          ))}
        </div>
        <div
          key={idx}
          className="gt-card mt-3 overflow-hidden"
          style={{ background: color, border: `3px solid ${INK}`, boxShadow: `0 6px 0 ${INK}`, borderRadius: 28, rotate: idx % 2 ? "1.5deg" : "-1.5deg" }}
        >
          <div className="mx-3 mt-3 overflow-hidden rounded-[20px]" style={{ background: ZZ.night, border: `3px solid ${INK}`, height: "clamp(108px, calc(100dvh - 470px), 264px)" }}>
            {slide?.art}
          </div>
          <div className="px-5 pb-4 pt-3 [@media(min-height:720px)]:pb-5 [@media(min-height:720px)]:pt-4" style={{ color: INK }}>
            <h2 className="text-[26px] leading-none [@media(min-height:720px)]:text-[30px] min-[380px]:[@media(min-height:720px)]:text-[34px]" style={DISPLAY}>{slide?.title}</h2>
            <p className="mt-1.5 text-[15px] font-semibold leading-snug [@media(min-height:720px)]:mt-2 [@media(min-height:720px)]:text-[16px] min-[380px]:[@media(min-height:720px)]:text-[17px]">{slide?.text}</p>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-0.5 pt-4">
          <ZButton bg={last ? ZZ.yellow : "#fff"} onClick={next}>
            {last ? t.understood : t.next}
          </ZButton>
          {!last ? (
            <button type="button" onClick={onDone} className="mx-auto min-h-11 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ color: "rgba(255,255,255,0.85)" }}>
              {t.skip}
            </button>
          ) : (
            <span className="min-h-11" aria-hidden />
          )}
        </div>
      </div>
      <style>{"@keyframes gt-in{from{transform:translateY(24px) scale(.94);opacity:0}to{transform:none;opacity:1}}.gt-card{animation:gt-in .35s cubic-bezier(.2,1.4,.4,1)}@media (prefers-reduced-motion: reduce){.gt-card{animation:none}}"}</style>
    </div>
  );
}

/** Lien « Revoir le tuto » (écran de réglages, feuille de règles…). `color` : sur fond clair, passer l'encre. */
export function TutoAgainButton({ onClick, color = "rgba(255,255,255,0.85)", className }: { onClick: () => void; color?: string; className?: string }) {
  const t = useT(STR);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mx-auto flex min-h-11 items-center justify-center gap-1.5 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4 ${className ?? ""}`}
      style={{ color, touchAction: "manipulation" }}
    >
      <GameInlineIcon icon={PlayCircle} />
      {t.again}
    </button>
  );
}

/** Bouton rond « Règles » (livre), à mettre dans GameTopRight / ZScreen tools. */
export function RulesIconButton({ onClick }: { onClick: () => void }) {
  const t = useT(STR);
  return <GameIconButton icon={BookOpen} label={t.rules} bg={ZZ.sky} onClick={() => { playSfx("open", { volume: 0.5 }); onClick(); }} />;
}

const STEP_COLORS = [ZZ.yellow, ZZ.pink, ZZ.sky, ZZ.mint, ZZ.coral];

/**
 * Feuille de règles « sticker » (fond crème, étapes numérotées), généralisée du Verre.
 * `onTuto` : affiche le lien « Revoir le tuto » (ferme la feuille puis relance le tuto).
 */
export function GameRulesSheet({ name, rules, onClose, onTuto, title }: { name?: string; rules: ReactNode[]; onClose: () => void; onTuto?: () => void; title?: string }) {
  const t = useT(STR);
  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 62, background: "rgba(10,4,32,0.6)" }} onClick={onClose} role="dialog" aria-modal aria-label={title ?? t.rulesTitle}>
      <div
        className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto px-5 pt-6"
        style={{ background: ZZ.cream, color: INK, borderRadius: "30px 30px 0 0", border: `3px solid ${INK}`, borderBottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label={t.close} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full" style={{ background: "#fff", border: `2.5px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>
          <X size={20} strokeWidth={3} />
        </button>
        <h2 className="pr-14 text-[30px] leading-none" style={DISPLAY}>{title ?? t.rulesTitle}</h2>
        {name && <p className="mt-1 text-[15px] font-semibold" style={{ color: "#4A3A66" }}>{name}</p>}
        <ol className="mt-5 space-y-3">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[17px]" style={{ ...DISPLAY, background: STEP_COLORS[i % STEP_COLORS.length], border: `2.5px solid ${INK}`, boxShadow: `0 3px 0 ${INK}`, rotate: `${i % 2 ? 4 : -4}deg` }}>{i + 1}</span>
              <p className="pt-1 text-[16px] font-semibold leading-snug">{r}</p>
            </li>
          ))}
        </ol>
        {onTuto && <TutoAgainButton color={INK} className="mt-4" onClick={() => { onClose(); onTuto(); }} />}
        <ZButton className="mt-4" bg={ZZ.yellow} onClick={onClose}>{t.understood}</ZButton>
      </div>
    </div>
  );
}
