"use client";

import { useState } from "react";
import { BookOpen, X } from "lucide-react";
import { GameIconButton, GameTopRight } from "../game-icon-button";
import { DISPLAY, SoundButton, ZButton, ZZ, zBackground } from "../local-kit";
import { playSfx } from "@/lib/sfx";
import { sipsAllowed, soberLines } from "@/lib/party-mood";
import { useT } from "@/lib/i18n";
import { VERRE_STR } from "./i18n";
import { TutoPass, TutoPour, TutoSpill } from "./art";

const INK = ZZ.ink;
const STEP_COLORS = [ZZ.yellow, ZZ.pink, ZZ.sky, ZZ.mint, ZZ.coral];

/** Coin haut-droit : règles + son (le haut-gauche reste à la croix de l'app). */
export function Tools() {
  const t = useT(VERRE_STR);
  const [open, setOpen] = useState(false);
  return (
    <>
      <GameTopRight>
        <GameIconButton icon={BookOpen} label={t.rulesBtn} bg={ZZ.sky} onClick={() => { playSfx("open", { volume: 0.5 }); setOpen(true); }} />
        <SoundButton />
      </GameTopRight>
      {open && <RulesSheet onClose={() => setOpen(false)} />}
    </>
  );
}

/** Feuille de règles « sticker » (fond crème, étapes numérotées colorées). */
export function RulesSheet({ onClose }: { onClose: () => void }) {
  const t = useT(VERRE_STR);
  // Mode sans alcool / Soirée Chill : la règle de la peine ne parle que de gage
  const [rules] = useState(() => (sipsAllowed(true) ? t.rules : soberLines(t.rules, t.ruleNoSips)));
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: "rgba(10,4,32,0.6)" }} onClick={onClose} role="dialog" aria-modal aria-label={t.rulesTitle}>
      <div
        className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto px-5 pt-6"
        style={{ background: ZZ.cream, color: INK, borderRadius: "30px 30px 0 0", border: `3px solid ${INK}`, borderBottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label={t.close} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full" style={{ background: "#fff", border: `2.5px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>
          <X size={20} strokeWidth={3} />
        </button>
        <h2 className="pr-14 text-[30px] leading-none" style={DISPLAY}>{t.rulesTitle}</h2>
        <p className="mt-1 text-[15px] font-semibold" style={{ color: "#4A3A66" }}>{t.name}</p>
        <ol className="mt-5 space-y-3">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[17px]" style={{ ...DISPLAY, background: STEP_COLORS[i % STEP_COLORS.length], border: `2.5px solid ${INK}`, boxShadow: `0 3px 0 ${INK}`, rotate: `${i % 2 ? 4 : -4}deg` }}>{i + 1}</span>
              <p className="pt-1 text-[16px] font-semibold leading-snug">{r}</p>
            </li>
          ))}
        </ol>
        <ZButton className="mt-6" bg={ZZ.yellow} onClick={onClose}>{t.understood}</ZButton>
      </div>
    </div>
  );
}

/** Mini-tuto animé en 3 vignettes (premier lancement, ou « Revoir le tuto »). */
export function TutoScreen({ onDone }: { onDone: () => void }) {
  const t = useT(VERRE_STR);
  const [i, setI] = useState(0);
  const last = i === t.tuto.length - 1;
  const slide = t.tuto[i];
  const colors = [ZZ.yellow, ZZ.sky, ZZ.coral];
  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col items-center px-5"
      style={{ background: zBackground(ZZ.night), color: "#fff", paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
    >
      <Tools />
      <div className="flex w-full max-w-md flex-1 flex-col">
        {/* points de progression */}
        <div className="flex justify-center gap-2" aria-hidden>
          {t.tuto.map((_, k) => (
            <span key={k} className="h-3 rounded-full transition-all" style={{ width: k === i ? 34 : 12, background: k === i ? colors[i] : "rgba(255,255,255,0.3)", border: `2px solid ${INK}` }} />
          ))}
        </div>
        <div
          key={i}
          className="mt-5 overflow-hidden"
          style={{ background: colors[i], border: `3px solid ${INK}`, boxShadow: `0 6px 0 ${INK}`, borderRadius: 28, rotate: i === 1 ? "1.5deg" : "-1.5deg", animation: "vv-in .35s cubic-bezier(.2,1.4,.4,1)" }}
        >
          <div className="mx-3 mt-3 overflow-hidden rounded-[20px]" style={{ background: ZZ.night, border: `3px solid ${INK}`, aspectRatio: "220 / 170" }}>
            {i === 0 ? <TutoPour /> : i === 1 ? <TutoPass /> : <TutoSpill />}
          </div>
          <div className="px-5 pb-5 pt-4" style={{ color: INK }}>
            <h2 className="text-[34px] leading-none" style={DISPLAY}>{slide.title}</h2>
            <p className="mt-2 text-[17px] font-semibold leading-snug">{slide.text}</p>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-1 pt-6">
          <ZButton bg={last ? ZZ.yellow : "#fff"} onClick={() => { playSfx(last ? "confirm" : "card-slide", { volume: 0.5 }); if (last) onDone(); else setI(i + 1); }}>
            {last ? t.understood : t.next}
          </ZButton>
          {!last && (
            <button type="button" onClick={onDone} className="mx-auto min-h-11 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ color: "rgba(255,255,255,0.85)" }}>
              {t.skip}
            </button>
          )}
        </div>
      </div>
      <style>{"@keyframes vv-in{from{transform:translateY(24px) scale(.94);opacity:0}to{transform:none;opacity:1}}"}</style>
    </div>
  );
}
