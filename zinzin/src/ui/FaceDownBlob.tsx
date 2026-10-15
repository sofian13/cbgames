import { useEffect, useRef, useState, type RefObject } from "react";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import type { AvatarLook } from "@/lib/avatar/look";
import { useT, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { ZBlob, ZCOLORS, type ZColor } from "./ZBlob";
import { haptic } from "./util";

/**
 * Secret de l'accueil : téléphone posé écran contre la table (≥ 2 s) puis retourné → un blob
 * passe la tête par le bord de l'écran, dit une petite phrase dans une bulle, puis repart.
 * Détection NATIVE (ZinzinBridgeViewController, accéléromètre 5 Hz) : événement window « zzfacedown ».
 * Seulement si l'accueil est réellement à l'écran (pas de jeu, de fiche ni de réglages ouverts),
 * une fois par minute au plus. Animation 100 % CSS (zinzin.css, .zz-face-*).
 * Pour tester : window.dispatchEvent(new Event("zzfacedown")).
 */

const EVENT = "zzfacedown";
const COOLDOWN_MS = 60_000;
const SHOW_MS = 3800;

const LINES: I18n<string[]> = {
  fr: [
    "Hé ! On voyait rien là-dessous 👀",
    "C'était tout noir ! J'ai eu peur 😱",
    "Ah, re-bonjour la lumière ! ☀️",
    "Face contre la table ?! Sympa… 😤",
  ],
  en: [
    "Hey! We couldn't see a thing down there 👀",
    "It was pitch black! I got scared 😱",
    "Ah, hello again, daylight! ☀️",
    "Face down on the table?! Rude… 😤",
  ],
  es: [
    "¡Eh! Ahí abajo no se veía nada 👀",
    "¡Estaba todo oscuro! Qué miedo 😱",
    "¡Ah, hola otra vez, luz! ☀️",
    "¿Boca abajo en la mesa? ¡Qué feo! 😤",
  ],
};

/** L'accueil est-il réellement à l'écran (pas recouvert par un jeu, une fiche ou les réglages) ? */
function homeVisible(home: HTMLElement): boolean {
  const r = home.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
  return !!top && home.contains(top);
}

type Peek = { id: number; left: boolean; line: number; color: ZColor; perso: { name: string; look: AvatarLook } | null };

export function FaceDownBlob({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const lines = useT(LINES);
  const band = useBand();
  const bandRef = useRef(band);
  useEffect(() => { bandRef.current = band; }, [band]);
  const [peek, setPeek] = useState<Peek | null>(null);

  useEffect(() => {
    let last = -Infinity;
    let n = 0;
    let lastLine = -1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const on = () => {
      const home = homeRef.current;
      const now = performance.now();
      if (!home || document.hidden || now - last < COOLDOWN_MS || !homeVisible(home)) return;
      last = now;
      // Jamais deux fois de suite la même phrase
      let line = Math.floor(Math.random() * (LINES.fr.length - 1));
      if (line >= lastLine && lastLine >= 0) line++;
      lastLine = line;
      // Un perso de « Ma bande » s'il y en a, sinon un blob coloré
      const persos = bandRef.current.filter((b): b is typeof b & { look: AvatarLook } => !!b.look);
      const p = persos.length ? persos[Math.floor(Math.random() * persos.length)] : null;
      setPeek({
        id: ++n, left: Math.random() < 0.5, line,
        color: ZCOLORS[Math.floor(Math.random() * ZCOLORS.length)],
        perso: p ? { name: p.name, look: p.look } : null,
      });
      haptic();
      playSfx("whoosh", { volume: 0.3, rate: 1.2 });
      // La bulle apparaît une fois la tête passée
      setTimeout(() => playSfx("pop", { volume: 0.35, rate: 1.3 }), 650);
      clearTimeout(timer);
      timer = setTimeout(() => setPeek(null), SHOW_MS + 100);
    };
    window.addEventListener(EVENT, on);
    return () => { window.removeEventListener(EVENT, on); clearTimeout(timer); };
  }, [homeRef]);

  if (!peek) return null;
  const size = 118;
  return (
    <div key={peek.id} className={`zz-face-peek ${peek.left ? "is-left" : "is-right"}`} style={{ ["--zz-face-s" as string]: `${size}px` }}>
      <div className="zz-face-blob" aria-hidden>
        {peek.perso
          ? <AvatarBlob look={peek.perso.look} name={peek.perso.name} size={size} mood="shocked" />
          : <ZBlob size={size} color={peek.color} mood="shocked" seed={peek.id} shadow={false} outline hop={false} />}
      </div>
      <div className={`zz-face-bubble zz-bubble ${peek.left ? "from-l" : "from-r"} px-3.5 py-2 text-[15px] font-extrabold leading-snug`}
        role="status" style={{ background: "#fff", color: "var(--zz-ink)" }}>
        {lines[peek.line % lines.length]}
      </div>
    </div>
  );
}
