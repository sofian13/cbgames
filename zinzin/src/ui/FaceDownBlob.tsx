import { useEffect, useRef, useState, type RefObject } from "react";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import type { AvatarLook } from "@/lib/avatar/look";
import { useT, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { ZBlob, ZCOLORS, type ZColor } from "./ZBlob";
import { haptic } from "./util";
import { foundSecret } from "@/lib/secrets-found";

/**
 * Secret de l'accueil : téléphone posé écran contre la table (≥ 2 s) puis retourné → un blob
 * passe la tête par le bord de l'écran, dit une petite phrase dans une bulle, puis repart.
 * Détection NATIVE (ZinzinBridgeViewController, accéléromètre 5 Hz) : événement window « zzfacedown ».
 * Seulement si l'accueil est réellement à l'écran (pas de jeu, de fiche ni de réglages ouverts),
 * une fois par minute au plus. Animation 100 % CSS (zinzin.css, .zz-face-*).
 * Pour tester : window.dispatchEvent(new Event("zzfacedown")).
 * Aussi : capture d'écran sur l'accueil (NATIF, événement « zzscreenshot ») → le blob passe la tête :
 * « Tu m'as pris en photo ? 📸 » (10 s entre deux). Diagnostic du capteur : clé locale zz-diag-facedown
 * (affichée en bas du générique secret, Credits.tsx).
 */

const EVENT = "zzfacedown";
const SHOT_EVENT = "zzscreenshot";
const SHOT_COOLDOWN_MS = 10_000;
export const FACEDOWN_DIAG_KEY = "zz-diag-facedown";
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

const SHOT_LINES: I18n<string[]> = {
  fr: ["Hé ! Tu m'as pris en photo ? 📸", "Attends, j'étais pas prêt ! 📸", "Cheese ! Envoie-la au groupe 📸", "Mon meilleur profil, j'espère 😎"],
  en: ["Hey! Did you just take my picture? 📸", "Wait, I wasn't ready! 📸", "Cheese! Send it to the group 📸", "My best side, I hope 😎"],
  es: ["¡Eh! ¿Me has hecho una foto? 📸", "¡Espera, no estaba listo! 📸", "¡Patata! Mándala al grupo 📸", "Mi mejor perfil, espero 😎"],
};

/** L'accueil est-il réellement à l'écran (pas recouvert par un jeu, une fiche ou les réglages) ? */
function homeVisible(home: HTMLElement): boolean {
  const r = home.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
  return !!top && home.contains(top);
}

type Peek = { id: number; left: boolean; line: number; shot: boolean; color: ZColor; perso: { name: string; look: AvatarLook } | null };

export function FaceDownBlob({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const lines = useT(LINES);
  const shotLines = useT(SHOT_LINES);
  const band = useBand();
  const bandRef = useRef(band);
  useEffect(() => { bandRef.current = band; }, [band]);
  const [peek, setPeek] = useState<Peek | null>(null);

  useEffect(() => {
    let last = -Infinity, lastShot = -Infinity;
    let n = 0;
    let lastLine = -1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const diag = (shown: boolean) => {
      try {
        const d = JSON.parse(localStorage.getItem(FACEDOWN_DIAG_KEY) ?? "{}") as { n?: number; shown?: number };
        localStorage.setItem(FACEDOWN_DIAG_KEY, JSON.stringify({ n: (d.n ?? 0) + 1, shown: (d.shown ?? 0) + (shown ? 1 : 0) }));
      } catch { /* indispo */ }
    };
    const peekIn = (shot: boolean) => {
      const home = homeRef.current;
      const now = performance.now();
      const ok = !!home && !document.hidden && (shot ? now - lastShot >= SHOT_COOLDOWN_MS : now - last >= COOLDOWN_MS) && homeVisible(home);
      if (!shot) diag(ok);
      if (!ok) return;
      if (shot) lastShot = now; else last = now;
      foundSecret(shot ? "screenshot" : "facedown");
      // Jamais deux fois de suite la même phrase
      const count = (shot ? SHOT_LINES : LINES).fr.length;
      let line = Math.floor(Math.random() * (count - 1));
      if (line >= lastLine && lastLine >= 0) line++;
      lastLine = line % count;
      // Un perso de « Ma bande » s'il y en a, sinon un blob coloré
      const persos = bandRef.current.filter((b): b is typeof b & { look: AvatarLook } => !!b.look);
      const p = persos.length ? persos[Math.floor(Math.random() * persos.length)] : null;
      setPeek({
        id: ++n, left: Math.random() < 0.5, line, shot,
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
    const onFace = () => peekIn(false);
    const onShot = () => peekIn(true);
    window.addEventListener(EVENT, onFace);
    window.addEventListener(SHOT_EVENT, onShot);
    return () => { window.removeEventListener(EVENT, onFace); window.removeEventListener(SHOT_EVENT, onShot); clearTimeout(timer); };
  }, [homeRef]);

  if (!peek) return null;
  const size = 118;
  return (
    <div key={peek.id} className={`zz-face-peek ${peek.left ? "is-left" : "is-right"}`} style={{ ["--zz-face-s" as string]: `${size}px` }}>
      <div className="zz-face-blob" aria-hidden>
        {peek.perso
          ? <AvatarBlob look={peek.perso.look} name={peek.perso.name} size={size} mood={peek.shot ? "wink" : "shocked"} />
          : <ZBlob size={size} color={peek.color} mood={peek.shot ? "wink" : "shocked"} seed={peek.id} shadow={false} outline hop={false} />}
      </div>
      <div className={`zz-face-bubble zz-bubble ${peek.left ? "from-l" : "from-r"} px-3.5 py-2 text-[15px] font-extrabold leading-snug`}
        role="status" style={{ background: "#fff", color: "var(--zz-ink)" }}>
        {peek.shot ? shotLines[peek.line % shotLines.length] : lines[peek.line % lines.length]}
      </div>
    </div>
  );
}
