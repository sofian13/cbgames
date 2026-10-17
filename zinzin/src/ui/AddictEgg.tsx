import { useEffect, useState, type RefObject } from "react";
import { GAME_FINISHED_EVENT, type GameFinishedDetail } from "@/lib/game-finished";
import { useT, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { spiralEyes } from "./spiral-eyes";
import { haptic } from "./util";
import { foundSecret } from "@/lib/secrets-found";

/**
 * Secret « accros » : 5 « Rejouer » de suite sur le même jeu → sur l'écran de fin, petit mot
 * « Vous êtes accros, là 😅 » et les blobs de l'écran ont les yeux en spirale ~3 s.
 * Branché une seule fois dans l'écran de jeu de l'app (GameScreen), pas dans les 21 jeux :
 * chaque arrivée sur un écran de fin émet déjà le signal « partie terminée » (src/lib/game-finished.ts).
 * 5 « Rejouer » = 6e écran de fin du même jeu d'affilée. Remis à zéro quand on ouvre un autre jeu
 * ou au redémarrage de l'app (mémoire seulement) ; une fois par jeu et par lancement de l'app.
 * Pour tester : finir 6 parties de suite du même jeu (ou envoyer 6 fois le signal de fin dans la console).
 */

const REPLAYS = 5;
const SHOW_MS = 3000;
/** Deux signaux de fin à moins de 1,5 s : le même écran de fin (double rendu), compté une fois */
const SAME_END_MS = 1500;

const STR: I18n<string> = {
  fr: "Vous êtes accros, là 😅",
  en: "You're hooked, aren't you? 😅",
  es: "Estáis enganchados, ¿eh? 😅",
};

// Mémoire de la session (perdue au redémarrage de l'app)
let streak: { id: string | null; ends: number; at: number } = { id: null, ends: 0, at: 0 };
const seen = new Set<string>();

export function AddictEgg({ id, boxRef }: { id: string; boxRef: RefObject<HTMLElement | null> }) {
  const text = useT(STR);
  const [show, setShow] = useState(0);

  useEffect(() => {
    // Un autre jeu ouvert : la série repart de zéro (le même jeu rouvert la continue)
    if (streak.id !== id) streak = { id, ends: 0, at: 0 };
    let undo: (() => void) | undefined;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const on = (e: Event) => {
      const d = (e as CustomEvent<GameFinishedDetail>).detail ?? {};
      if (d.soiree || (d.gameId && d.gameId !== id) || streak.id !== id) return;
      const now = performance.now();
      if (now - streak.at < SAME_END_MS) return;
      streak.at = now;
      streak.ends++;
      if (streak.ends < REPLAYS + 1 || seen.has(id)) return;
      seen.add(id);
      // Laisse l'écran de fin apparaître avant de faire tourner les yeux
      setTimeout(() => {
        const box = boxRef.current;
        if (!box || !box.isConnected) return;
        undo = spiralEyes(box, SHOW_MS);
        foundSecret("addicts");
        setShow(Date.now());
        haptic();
        playSfx("laugh", { volume: 0.35 });
        clearTimeout(hide);
        hide = setTimeout(() => setShow(0), SHOW_MS + 200);
      }, 700);
    };
    window.addEventListener(GAME_FINISHED_EVENT, on);
    return () => { window.removeEventListener(GAME_FINISHED_EVENT, on); undo?.(); clearTimeout(hide); };
  }, [id, boxRef]);

  if (!show) return null;
  return (
    <div key={show} className="zz-addict pointer-events-none fixed inset-x-0 flex justify-center px-6" style={{ top: "calc(var(--sat) + 64px)", zIndex: 65 }}>
      <div role="status" className="zz-stk-sm rounded-full px-4 py-2 text-center text-[16px] font-extrabold leading-snug" style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-2deg" }}>
        {text}
      </div>
    </div>
  );
}
