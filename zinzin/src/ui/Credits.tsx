import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import { useT, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { ZBlob, ZCOLORS } from "./ZBlob";
import { haptic } from "./util";
import { FACEDOWN_DIAG_KEY } from "./FaceDownBlob";
import { isLiteFx } from "./perf";
import { motionStatus } from "../app-icon";
import { foundSecret } from "@/lib/secrets-found";

/**
 * Secret des Réglages : 7 touchers rapides sur le numéro de version → « Générique » plein écran.
 * Les blobs de la bande (ou des blobs par défaut) dansent sur le jingle du lancement pendant que
 * le générique défile. Indice « Encore 3… » au 4e toucher (comme le logo). Toucher ou glisser
 * vers le bas pour fermer. Animations 100 % CSS (zinzin.css, .zz-credits*).
 */

const TAPS = 7;
const HINT_TAP = 4;
const WINDOW_MS = 5000;

type Line = { k?: string; v: string; big?: boolean };

const STR: I18n<{
  hint: (n: number) => string;
  title: string;
  lines: (cast: string) => Line[];
  everyone: string;
  close: string;
  aria: string;
}> = {
  fr: {
    hint: (n) => `Encore ${n}…`,
    title: "Générique",
    everyone: "Toute la bande des blobs",
    close: "Touche pour fermer",
    aria: "Générique secret",
    lines: (cast) => [
      { v: "Zinzin", big: true },
      { k: "Réalisé par", v: "Sofian" },
      { k: "Avec la participation de", v: cast },
      { k: "Effets spéciaux", v: "Des blobs qui gigotent" },
      { k: "Cascades", v: "Le blob doré, sans doublure" },
      { k: "Bruitages", v: "Des pops, des bloops et un élastique" },
      { k: "Coach en mauvaise foi", v: "Le perdant de la dernière partie" },
      { v: "Aucun blob n'a été maltraité pendant le tournage." },
      { v: "Merci d'avoir trouvé ce secret !" },
      { v: "Fin", big: true },
      { v: "(ou pas)" },
    ],
  },
  en: {
    hint: (n) => `${n} more…`,
    title: "Credits",
    everyone: "The whole blob crew",
    close: "Tap to close",
    aria: "Secret credits",
    lines: (cast) => [
      { v: "Zinzin", big: true },
      { k: "Directed by", v: "Sofian" },
      { k: "Starring", v: cast },
      { k: "Special effects", v: "Wiggly blobs" },
      { k: "Stunts", v: "The golden blob, no stunt double" },
      { k: "Sound effects", v: "Pops, bloops and one elastic band" },
      { k: "Bad sport coach", v: "Whoever lost the last game" },
      { v: "No blobs were harmed in the making of this app." },
      { v: "Thanks for finding this secret!" },
      { v: "The End", big: true },
      { v: "(or is it?)" },
    ],
  },
  es: {
    hint: (n) => `Faltan ${n}…`,
    title: "Créditos",
    everyone: "Toda la pandilla de blobs",
    close: "Toca para cerrar",
    aria: "Créditos secretos",
    lines: (cast) => [
      { v: "Zinzin", big: true },
      { k: "Dirigido por", v: "Sofian" },
      { k: "Con la participación de", v: cast },
      { k: "Efectos especiales", v: "Blobs que se menean" },
      { k: "Escenas de riesgo", v: "El blob dorado, sin doble" },
      { k: "Efectos de sonido", v: "Pops, bloops y una goma elástica" },
      { k: "Entrenador de mal perder", v: "Quien perdió la última partida" },
      { v: "Ningún blob sufrió daños durante el rodaje." },
      { v: "¡Gracias por encontrar este secreto!" },
      { v: "Fin", big: true },
      { v: "(¿o no?)" },
    ],
  },
};

/** Numéro de version des Réglages : touchable (secret), même apparence qu'avant. */
export function VersionTap({ text }: { text: string }) {
  const t = useT(STR);
  const taps = useRef<number[]>([]);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hint, setHint] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((x) => now - x < WINDOW_MS), now];
    const n = taps.current.length;
    haptic();
    if (n >= HINT_TAP) playSfx("pop", { volume: 0.3, rate: 1 + (n - HINT_TAP) * 0.08 });
    if (n === HINT_TAP) {
      setHint(TAPS - n);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(null), 1600);
    }
    if (n >= TAPS) {
      taps.current = [];
      setHint(null);
      haptic("success");
      setOpen(true);
    }
  };

  return (
    <>
      <span className="relative mx-auto block w-fit">
        <button type="button" onClick={tap} className="block min-h-11 px-4 text-center text-[13px]" style={{ color: "var(--zz-mute)", WebkitTapHighlightColor: "transparent" }}>
          {text}
        </button>
        {hint !== null && (
          <span aria-hidden className="zz-logo-hint zz-stk-sm pointer-events-none absolute -top-7 right-3 whitespace-nowrap rounded-full px-2 py-0.5 text-[13px] font-extrabold"
            style={{ background: "#fff", color: "var(--zz-ink)" }}>
            {t.hint(hint)}
          </span>
        )}
      </span>
      {open && <Credits onClose={() => setOpen(false)} />}
    </>
  );
}

/** Le générique : blobs qui dansent en haut, texte qui défile, fermeture au toucher / glisser vers le bas. */
function Credits({ onClose }: { onClose: () => void }) {
  useEffect(() => { foundSecret("credits"); }, []);
  // État réel du capteur côté iPhone (diagnostic du téléphone retourné et de la secousse)
  const [motion, setMotion] = useState("");
  useEffect(() => {
    void motionStatus().then((m) => {
      if (m) setMotion(` · capt ${m.available ? (m.active ? "on" : "stop") : "absent"} ${m.samples} · arm ${m.armed} · rel ${m.fired} · sec ${m.shakes}`);
    });
  }, []);
  const t = useT(STR);
  const band = useBand();
  const [openedAt] = useState(() => performance.now());
  const y0 = useRef<number | null>(null);
  const [out, setOut] = useState(false);

  useEffect(() => {
    playSfx("jingle", { volume: 0.7 });
  }, []);

  const close = () => {
    if (out || performance.now() - openedAt < 500) return;
    setOut(true);
    playSfx("whooshdown", { volume: 0.35 });
    setTimeout(onClose, 260);
  };

  const cast = band.length ? band.map((b) => b.name).join(", ") : t.everyone;
  const lines = t.lines(cast);
  const n = band.length;
  const size = n <= 4 ? 78 : n <= 8 ? 58 : 44;

  return createPortal(
    <div
      role="dialog" aria-modal aria-label={t.aria}
      className={`zz-credits zz-page fixed inset-0 flex flex-col overflow-hidden ${out ? "is-out" : ""}`}
      style={{ zIndex: 70 }}
      onPointerDown={(e) => { y0.current = e.clientY; }}
      onPointerUp={(e) => {
        const dy = y0.current == null ? 0 : e.clientY - y0.current;
        y0.current = null;
        // Toucher (sans glisser) ou glisser vers le bas : on ferme
        if (Math.abs(dy) < 12 || dy > 50) close();
      }}
    >
      {/* La bande qui danse */}
      <div className="relative z-[1] flex flex-wrap items-end justify-center px-3" style={{ paddingTop: "calc(var(--sat) + 46px)", columnGap: n > 8 ? 2 : 8, rowGap: 6 }}>
        {n
          ? band.map((b, i) => (
            <div key={b.name} className="zz-credits-dance" style={{ animationDelay: `${-(i % 4) * 0.16}s` }}>
              {b.look
                ? <AvatarBlob look={b.look} name={b.name} size={size} mood={i % 3 ? "happy" : "laughing"} animate={false} />
                : <ZBlob size={size} color={ZCOLORS[i % ZCOLORS.length]} mood="laughing" seed={i} shadow={false} outline wobble={false} hop={false} />}
            </div>
          ))
          : ZCOLORS.slice(0, 5).map((c, i) => (
            <div key={c} className="zz-credits-dance" style={{ animationDelay: `${-(i % 4) * 0.16}s` }}>
              <ZBlob size={64} color={c} mood={i % 2 ? "happy" : "laughing"} seed={i} shadow={false} outline wobble={false} hop={false} />
            </div>
          ))}
      </div>

      {/* Le texte qui défile (en boucle) */}
      <div className="zz-credits-mask relative min-h-0 flex-1">
        <div className="zz-credits-roll absolute inset-x-0 top-0 px-8 text-center text-white" style={{ ["--zz-roll" as string]: `${lines.length * 2.2}s` }}>
          <p className="zz-title text-[22px]" style={{ color: "#FFD23F" }}>{t.title}</p>
          {lines.map((l, i) => (
            <div key={i} className="mt-9">
              {l.k && <p className="text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--zz-dim)" }}>{l.k}</p>}
              <p className={l.big ? "zz-title text-[44px]" : l.k ? "zz-title mt-1 text-[24px] leading-tight" : "text-[17px] font-bold leading-snug"}>{l.v}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="pointer-events-none relative z-[1] pb-2 text-center text-[13px] font-semibold" style={{ color: "var(--zz-mute)", paddingBottom: "calc(var(--sab) + 12px)" }}>
        {t.close}
        {/* Diagnostic discret du capteur « téléphone retourné » : signaux reçus / blob montré */}
        <span className="block text-[11px] opacity-60">{faceDiag()}{motion}</span>
      </p>
    </div>,
    document.body,
  );
}

function faceDiag(): string {
  try {
    const d = JSON.parse(localStorage.getItem(FACEDOWN_DIAG_KEY) ?? "{}") as Record<string, number | undefined>;
    // relevés reçus par l'app / blob montré · effets
    return `fd ${d.n ?? 0}/${d.shown ?? 0} · fx ${isLiteFx() ? "léger" : "max"}`;
  } catch {
    return "fd ?";
  }
}
