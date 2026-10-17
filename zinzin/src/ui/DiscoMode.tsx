import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { playSfx } from "@/lib/sfx";
import { haptic, reducedMotion } from "./util";
import { foundSecret } from "@/lib/secrets-found";

/**
 * Secret de l'accueil : toucher la boule à facettes de la carte « Soirée Zinzin » (SoireeKit.tsx,
 * événement « zz:disco ») → l'accueil passe en boîte de nuit ~8 s : faisceaux colorés qui tournent,
 * petites taches de lumière, blobs qui dansent, boucle disco composée maison.
 * Pour tester : window.dispatchEvent(new Event("zz:disco")).
 */

export const DISCO_EVENT = "zz:disco";
const DISCO_MS = 8300;
const SPOTS = ["#FF3EA5", "#FFD23F", "#3DDC97", "#52C7FF", "#A98BFF", "#FF8A1F"];

export function DiscoMode({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const [on, setOn] = useState(0);

  useEffect(() => {
    let busy = false;
    let timer: ReturnType<typeof setTimeout>;
    let dancers: Element[] = [];
    const start = () => {
      const home = homeRef.current;
      if (busy || !home) return;
      busy = true;
      foundSecret("disco");
      haptic("medium");
      playSfx("disco", { volume: 0.8 });
      // Les blobs visibles dansent (pas tous en même temps : délais décalés)
      if (!reducedMotion()) {
        dancers = Array.from(home.querySelectorAll<SVGSVGElement>("svg")).filter((s) => {
          if (!/120 120$/.test((s.getAttribute("viewBox") ?? "").trim())) return false;
          const r = s.getBoundingClientRect();
          return r.width > 16 && r.bottom > 0 && r.top < innerHeight;
        });
        dancers.forEach((s, i) => {
          (s as SVGSVGElement).style.animationDelay = `${-(i % 4) * 0.12}s`;
          s.classList.add("zz-dancing");
        });
      }
      setOn((n) => n + 1);
      timer = setTimeout(() => {
        dancers.forEach((s) => { s.classList.remove("zz-dancing"); (s as SVGSVGElement).style.animationDelay = ""; });
        dancers = [];
        setOn(0);
        busy = false;
      }, DISCO_MS);
    };
    window.addEventListener(DISCO_EVENT, start);
    return () => {
      clearTimeout(timer);
      dancers.forEach((s) => s.classList.remove("zz-dancing"));
      window.removeEventListener(DISCO_EVENT, start);
    };
  }, [homeRef]);

  if (!on) return null;
  return createPortal(
    <div key={on} aria-hidden className="zz-disco pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 33 }}>
      {/* Faisceaux : fins rayons qui balaient depuis le haut (petits calques : presque rien en mémoire) */}
      {SPOTS.map((c, i) => (
        <span key={`beam${i}`} className="zz-disco-beam" style={{ left: `${10 + i * 16}%`, ["--c" as string]: c, animationDelay: `${-i * 0.45}s`, animationDuration: `${2.4 + (i % 3) * 0.5}s` } as CSSProperties} />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="zz-disco-spot absolute rounded-full"
          style={{
            left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: 18 + (i % 4) * 8, height: 18 + (i % 4) * 8,
            background: SPOTS[i % SPOTS.length], animationDelay: `${-(i % 6) * 0.35}s`, animationDuration: `${2.2 + (i % 5) * 0.4}s`,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}
