import { useEffect, useRef, useState, type ReactNode } from "react";
import { type Lang, useLang } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { ZBlob, ZCOLORS, type ZColor } from "./ZBlob";
import { haptic } from "./util";

/**
 * Secret des Réglages : changer de langue → un blob surgit du bas de l'écran avec le chapeau du pays
 * et dit bonjour dans la nouvelle langue (béret « Bonjour ! », chapeau melon « Hello! », sombrero
 * « ¡Hola! »), ~2,5 s, puis repart. Ne bloque rien (aucun toucher intercepté). Animation CSS (zinzin.css, .zz-lang-*).
 */

const SHOW_MS = 2500;
const HELLO: Record<Lang, string> = { fr: "Bonjour !", en: "Hello!", es: "¡Hola!" };

const INK = "#1A0B33";
const S = { stroke: INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };

/** Chapeaux dessinés dans le repère 120×120 des blobs (haut de la tête vers y ≈ 14) */
const HATS: Record<Lang, ReactNode> = {
  // Béret : galette penchée + petite queue
  fr: (
    <g transform="rotate(-12 60 16)">
      <path d="M57 3 q2 -6 6 -5" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
      <path d="M22 18 C20 6 40 -1 62 0 C86 1 100 8 96 17 C92 24 30 26 22 18Z" fill="#26224A" {...S} />
      <path d="M34 9 C46 4 66 3 80 6" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.35} />
    </g>
  ),
  // Chapeau melon : dôme + ruban + bord
  en: (
    <g transform="rotate(-6 60 16)">
      <path d="M36 17 C34 -10 86 -10 84 17Z" fill="#2E2B33" {...S} />
      <path d="M37 11 H83 V16 H37Z" fill="#7A3B2E" stroke={INK} strokeWidth={2.4} />
      <path d="M22 19 C30 13 90 13 98 19 C92 24 28 24 22 19Z" fill="#2E2B33" {...S} />
      <path d="M46 -1 C50 -5 58 -6 62 -6" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.35} />
    </g>
  ),
  // Sombrero : grand bord, calotte, ruban rouge et zigzag vert
  es: (
    <g transform="rotate(-5 60 16)">
      <path d="M6 22 C14 10 106 10 114 22 C104 30 16 30 6 22Z" fill="#F2C14E" {...S} />
      <path d="M14 22 l6 -3 l6 3 l6 -3 l6 3 M82 22 l6 -3 l6 3 l6 -3 l6 3" fill="none" stroke="#2FA866" strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M40 18 C40 -14 80 -14 80 18Z" fill="#F2C14E" {...S} />
      <path d="M41 9 H79 V15 H41Z" fill="#E8483B" stroke={INK} strokeWidth={2.2} />
    </g>
  ),
};

type Pop = { id: number; lang: Lang; color: ZColor };

export function LangBlob() {
  const lang = useLang();
  const prev = useRef(lang);
  const [pop, setPop] = useState<Pop | null>(null);
  const n = useRef(0);

  useEffect(() => {
    if (prev.current === lang) return;
    prev.current = lang;
    setPop({ id: ++n.current, lang, color: ZCOLORS[Math.floor(Math.random() * ZCOLORS.length)] });
    haptic();
    playSfx("whoosh", { volume: 0.3, rate: 1.3 });
    const p = setTimeout(() => playSfx("pop", { volume: 0.35, rate: 1.2 }), 420);
    const t = setTimeout(() => setPop(null), SHOW_MS + 100);
    return () => { clearTimeout(p); clearTimeout(t); };
  }, [lang]);

  if (!pop) return null;
  const size = 104;
  return (
    <div key={pop.id} className="zz-lang-pop" aria-hidden style={{ ["--zz-lang-s" as string]: `${size}px` }}>
      <div className="zz-lang-blob relative" style={{ width: size, height: size }}>
        <ZBlob size={size} color={pop.color} mood="laughing" seed={pop.id} shadow={false} outline wobble={false} hop={false} />
        <svg viewBox="0 0 120 120" width={size} height={size} className="absolute inset-0" style={{ overflow: "visible" }}>
          {/* Un peu plus grand que nature, posé sur le haut de la tête */}
          <g transform="translate(60 20) scale(1.3) translate(-60 -18)">{HATS[pop.lang]}</g>
        </svg>
      </div>
      <div lang={pop.lang} className="zz-lang-bubble zz-bubble from-l px-3.5 py-2 text-[20px] font-extrabold leading-none" style={{ background: "#fff", color: "var(--zz-ink)" }}>
        {HELLO[pop.lang]}
      </div>
    </div>
  );
}
