"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Info, Volume2, VolumeX } from "lucide-react";
import { GameIconButton, GameTopRight } from "../game-icon-button";
import { isSfxMuted, playSfx, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import { DISPLAY, INK, StickerBtn, sticker } from "./sticker-kit";
import { Mascot } from "@/components/Mascot";

/** État « son coupé » global (partagé par tous les jeux, persisté par sfx.ts). */
export function useSfxMuted() {
  return useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);
}

/** Bouton son seul (coupure globale). */
export function SoundButton() {
  const mute = useSfxMuted();
  return (
    <GameIconButton
      icon={mute ? VolumeX : Volume2}
      label={mute ? "Activer le son" : "Couper le son"}
      active={mute}
      onClick={() => {
        setSfxMuted(!mute);
        if (mute) playSfx("toggle", { volume: 0.6 });
      }}
    />
  );
}

/** Boutons du coin haut-droit (son + règles) et feuille de règles. Coin haut-gauche laissé libre pour l'app. */
export function TopRightControls({ title, rules, accent }: { title: string; rules: string[]; accent: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <GameTopRight>
        <SoundButton />
        <GameIconButton
          icon={Info}
          label="Règles"
          bg={accent}
          onClick={() => {
            playSfx("open", { volume: 0.5 });
            setOpen(true);
          }}
        />
      </GameTopRight>

      {open && <RulesSheet title={title} rules={rules} accent={accent} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Feuille de règles « sticker » : fond crème, gros titre, étapes en stickers numérotés colorés. */
const STEP_COLORS = ["#FFD23F", "#FF3EA5", "#4ECDC4", "#3DDC97", "#FF6B5B", "#B5A1FF"];

export function RulesSheet({ title, rules, accent, onClose }: { title: string; rules: string[]; accent: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(10,4,32,0.6)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={`Règles : ${title}`}
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto px-5 pt-6"
        style={{
          background: "#FFF6E5",
          color: INK,
          borderRadius: "30px 30px 0 0",
          border: `3px solid ${INK}`,
          borderBottom: 0,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
          animation: "af-slide-up 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0" style={{ transform: "rotate(-8deg)" }}>
            <Mascot size={58} color={accent === "#FFD23F" ? "pink" : "yellow"} mood="happy" arms shadow={false} bob={false} />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold" style={{ color: "#4A3A66" }}>Comment on joue à</p>
            <p className="truncate text-[34px] leading-none" style={DISPLAY}>{title}</p>
          </div>
        </div>
        <ol className="mt-5 space-y-3">
          {rules.map((r, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{ ...sticker(i % 2 ? "#fff" : "#FFFDF7", { radius: 18, shadow: 3, border: 2.5 }), transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center text-[24px]"
                style={{ ...sticker(STEP_COLORS[i % STEP_COLORS.length], { radius: 14, shadow: 2, border: 2.5 }), ...DISPLAY, transform: `rotate(${i % 2 ? 6 : -6}deg)` }}
              >
                {i + 1}
              </span>
              <span className="text-[16px] font-semibold leading-snug">{r}</span>
            </li>
          ))}
        </ol>
        <StickerBtn big bg="#FFD23F" className="mt-6" onClick={onClose}>
          Compris !
        </StickerBtn>
      </div>
    </div>
  );
}

/** Remet en haut les conteneurs scrollables parents à chaque changement d'écran. */
export function ScrollReset({ dep }: { dep: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    let el = ref.current?.parentElement ?? null;
    while (el) {
      if (el.scrollTop) el.scrollTop = 0;
      el = el.parentElement;
    }
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [dep]);
  return <span ref={ref} hidden />;
}
