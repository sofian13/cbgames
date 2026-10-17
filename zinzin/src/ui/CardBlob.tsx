import { memo, useEffect, useRef, useState, type MouseEvent } from "react";
import type { MascotMood } from "@/components/Mascot";
import { type Lang, useLang } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { ZBlob, type ZColor } from "./ZBlob";
import type { ZCostume } from "./costumes";
import { haptic, reducedMotion } from "./util";
import { foundSecret } from "@/lib/secrets-found";

/**
 * Secret de l'accueil : le blob qui dépasse d'une carte de jeu réagit quand on le touche
 * (sa zone est sa propre cible : la fiche ne s'ouvre pas, le reste de la carte l'ouvre toujours).
 * Il s'écrase comme de la gelée avec un petit son (varié) ; au 5e toucher rapide il se vexe :
 * il se détourne et boude 2-3 s avec une bulle (« Hé ! », « Oh ! », « Aïe ! »…, toujours très courtes), puis revient.
 * Un glissement du rail ne déclenche rien (pas de « click » après un défilement).
 * État local : seul ce blob se redessine (jamais l'accueil).
 */

const RAPID_MS = 900;
const SULK_AT = 5;
const SULK_MS = 2600;

/** Bulles du blob vexé (courtes : la bulle tient sur une ligne), jamais deux fois la même d'affilée */
const HEY: Record<Lang, string[]> = {
  fr: ["Hé !", "Oh !", "Aïe !", "Ouille !", "Hmpf !", "Pfff…", "Arrête !", "Mais euh !"],
  en: ["Hey!", "Oh!", "Ouch!", "Ow!", "Hmph!", "Pfff…", "Stop!", "Aww!"],
  es: ["¡Eh!", "¡Oh!", "¡Ay!", "¡Uy!", "¡Hmpf!", "Pfff…", "¡Para!", "¡Jo!"],
};
let lastHey = -1;
function pickHey(): number {
  let i = Math.floor(Math.random() * HEY.fr.length);
  if (i === lastHey) i = (i + 1) % HEY.fr.length;
  lastHey = i;
  return i;
}

/** Petits sons variés (bruitages existants), jamais deux fois le même d'affilée */
const SOUNDS: (() => void)[] = [
  () => playSfx("pop", { volume: 0.45, rate: 1.05 + Math.random() * 0.25 }),
  () => playSfx("bloop2", { volume: 0.45, rate: 0.8 + Math.random() * 0.2 }),
  () => playSfx("pop2", { volume: 0.45, rate: 1.1 + Math.random() * 0.2 }),
  () => playSfx("pep", { volume: 0.4, rate: 0.95 + Math.random() * 0.15 }),
  // Petit gloussement (début du rire, coupé en fondu)
  () => playSfx("laugh", { volume: 0.3, rate: 1.3, duration: 0.6 }),
];

function jelly(el: HTMLElement | null, hard: boolean) {
  if (!el || typeof el.animate !== "function" || reducedMotion()) return;
  const k = hard ? 1.25 : 1;
  el.animate(
    [
      { transform: "scale(1,1)" },
      { transform: `scale(${1 + 0.28 * k},${1 - 0.3 * k})`, offset: 0.14 },
      { transform: `scale(${1 - 0.16 * k},${1 + 0.2 * k})`, offset: 0.36 },
      { transform: `scale(${1 + 0.09 * k},${1 - 0.08 * k})`, offset: 0.56 },
      { transform: "scale(0.98,1.02)", offset: 0.76 },
      { transform: "scale(1,1)" },
    ],
    { duration: 560, easing: "ease-out" },
  );
}

export const CardBlob = memo(function CardBlob({ size, color, mood, seed, costume }: {
  size: number; color: ZColor; mood: MascotMood; seed: number; costume?: ZCostume;
}) {
  const lang = useLang();
  const wrap = useRef<HTMLDivElement>(null);
  const taps = useRef({ n: 0, at: 0 });
  const lastSound = useRef(-1);
  const [sulk, setSulk] = useState(false);
  const [hey, setHey] = useState(0);

  useEffect(() => {
    if (!sulk) return;
    const id = setTimeout(() => {
      setSulk(false);
      jelly(wrap.current, false);
    }, SULK_MS);
    return () => clearTimeout(id);
  }, [sulk]);

  const onTap = (e: MouseEvent) => {
    // Sa propre cible : la carte (bouton parent) ne reçoit pas ce toucher
    e.stopPropagation();
    e.preventDefault();
    if (sulk) {
      // Il boude : à peine un frisson
      wrap.current?.animate?.([{ translate: "0 0" }, { translate: "-3px 0" }, { translate: "3px 0" }, { translate: "0 0" }], { duration: 220 });
      return;
    }
    // Série de touchers rapides (chacun à moins de RAPID_MS du précédent)
    const now = performance.now();
    const tp = taps.current;
    tp.n = now - tp.at < RAPID_MS ? tp.n + 1 : 1;
    tp.at = now;
    const run = tp.n;
    haptic("light");
    if (run >= SULK_AT) {
      tp.n = 0;
      playSfx("pop2", { volume: 0.5, rate: 0.62 });
      try { navigator.vibrate?.(25); } catch { /* indispo */ }
      jelly(wrap.current, true);
      foundSecret("sulk");
      setHey(pickHey());
      setSulk(true);
      return;
    }
    let i = Math.floor(Math.random() * SOUNDS.length);
    if (i === lastSound.current) i = (i + 1) % SOUNDS.length;
    lastSound.current = i;
    SOUNDS[i]();
    jelly(wrap.current, run >= 3);
  };

  return (
    <div className="zz-cblob relative" style={{ width: size, height: size }} onClick={onTap}>
      <div ref={wrap} className="zz-cblob-in" style={{ transformOrigin: "50% 90%" }}>
        <div className={sulk ? "zz-sulk" : "zz-sulk-off"}>
          <ZBlob size={size} color={color} mood={sulk ? "angry" : mood} seed={seed} speed={2.4} shadow={false} outline costume={costume} hop={false} />
        </div>
      </div>
      {sulk && (
        <span className="zz-hey zz-stk-sm pointer-events-none absolute whitespace-nowrap rounded-full px-2.5 py-0.5 text-[15px] font-extrabold" style={{ right: "86%", top: 2, background: "#fff", color: "var(--zz-ink)" }}>
          {(HEY[lang] ?? HEY.fr)[hey]}
        </span>
      )}
    </div>
  );
});
