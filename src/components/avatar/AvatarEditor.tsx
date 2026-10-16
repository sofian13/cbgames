"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Dices, Lock, RotateCcw, Star, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { requestPaywall, useUnlocked } from "@/lib/entitlements";
import { playSfx } from "@/lib/sfx";
import { uiSfx } from "@/lib/ui-sfx";
import {
  AVATAR_COLORS, AVATAR_ITEMS, AVATAR_PALETTE, HAIR_COLORS, HAIR_COLOR_IDS, baseLook, cleanName,
  lookHasPremium, randomLook, type AvatarLook, type AvatarSlot, type AvatarTab,
} from "@/lib/avatar/look";
import { AVATAR_NAMES, AVATAR_STR } from "@/lib/avatar/i18n";
import { getSecrets, getServerSecrets, isBossName, isZinzinName, subscribeSecrets } from "@/lib/avatar/secrets";
import { AvatarBlob } from "./AvatarBlob";
import { VoiceRecorderPanel } from "./VoiceUI";
import { talkMood, useSpeaking, voiceKey } from "@/lib/avatar/voice";

export const AV_INK = "#15082E";
export const AV_NIGHT = "#1E1250";
export const avSticker = (bg: string, shadow = 4): CSSProperties => ({ background: bg, border: `2.5px solid ${AV_INK}`, boxShadow: `0 ${shadow}px 0 ${AV_INK}` });
export const AV_DISPLAY: CSSProperties = { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, letterSpacing: "-0.01em", wordSpacing: "0.12em" };

/** Couche plein écran au-dessus de tout (sauf le paywall de l'app, z 45). */
export function AvatarLayer({ children, label, z = 44 }: { children: ReactNode; label: string; z?: number }) {
  // Ouvert seulement après un geste : toujours côté client
  const host = typeof document !== "undefined" ? document.body : null;
  // Pas de défilement de la page dessous
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  if (!host) return null;
  return createPortal(
    <div
      role="dialog" aria-modal aria-label={label}
      className="fixed inset-0 flex flex-col text-white"
      style={{ zIndex: z, background: `radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${AV_NIGHT}` }}
    >
      {children}
    </div>,
    host,
  );
}

export function RoundIconBtn({ onClick, label, children, bg = "#fff" }: { onClick: () => void; label: string; children: ReactNode; bg?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full active:translate-y-[2px]"
      style={{ ...avSticker(bg, 3), color: AV_INK }}>
      {children}
    </button>
  );
}

const TABS: AvatarTab[] = ["color", "eyes", "hair", "hat", "face", "extra"];

export interface AvatarEditorResult { name: string; look: AvatarLook; me: boolean; voice?: string | null }

/**
 * Éditeur de perso : aperçu animé, onglets à vignettes, hasard, réinitialiser.
 * Les éléments Zinzin+ s'essaient librement ; l'enregistrement ouvre le paywall.
 * `onSave` renvoie un message d'erreur (prénom déjà pris…) ou rien.
 */
export function AvatarEditor({
  name, look: initial, colorHint, editName = false, showMe = false, isMe = false, voice: initialVoice, onSave, onClose,
}: {
  name: string;
  look: AvatarLook | null;
  /** Couleur de départ si le joueur n'a pas encore de perso */
  colorHint?: string;
  /** Prénom modifiable (Ma bande) */
  editName?: boolean;
  /** Interrupteur « C'est moi » */
  showMe?: boolean;
  isMe?: boolean;
  /** Son du perso (« Ma bande ») : absent = pas de ligne « Son » */
  voice?: { id: string | null };
  onSave: (r: AvatarEditorResult) => string | void;
  onClose: () => void;
}) {
  const t = useT(AVATAR_STR);
  const names = useT(AVATAR_NAMES);
  const unlocked = useUnlocked();
  const start = useMemo(() => initial ?? baseLook(colorHint), [initial, colorHint]);
  const [look, setLook] = useState<AvatarLook>(start);
  const [tab, setTab] = useState<AvatarTab>("color");
  const [nm, setNm] = useState(name);
  const [me, setMe] = useState(isMe);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>(initialVoice?.id ?? null);
  const grid = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  // Aperçu à la taille de l'écran (iPhone SE → Pro Max)
  const [pv, setPv] = useState(150);
  useEffect(() => {
    const f = () => setPv(Math.round(Math.max(88, Math.min(156, innerHeight * 0.15))));
    f();
    addEventListener("resize", f);
    return () => removeEventListener("resize", f);
  }, []);

  const locked = !unlocked && lookHasPremium(look);
  const cleanNm = cleanName(nm);
  // Secrets : accessoires trouvés (affichés), prénom « Zinzin » (couronne arc-en-ciel)
  const secrets = useSyncExternalStore(subscribeSecrets, getSecrets, getServerSecrets);
  const shownName = editName ? cleanNm : name;
  const zinzin = isZinzinName(shownName);
  const boss = isBossName(shownName);
  // Bouche animée pendant la réécoute du son
  const talk = useSpeaking(voiceKey(cleanNm || name || "?"));
  const canSave = !busy && (!editName || cleanNm.length > 0);

  const bump = () => {
    const el = preview.current;
    if (!el || typeof el.animate !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [{ transform: "scale(1,1)" }, { transform: "scale(1.08,0.92)", offset: 0.3 }, { transform: "scale(0.96,1.05)", offset: 0.65 }, { transform: "scale(1,1)" }],
      { duration: 380, easing: "ease-out" },
    );
  };
  // Secret : toucher l'aperçu le gifle (tête qui part sur le côté, mine choquée) ;
  // 5 gifles rapides → il a le tournis (yeux en spirale, côté app : événement « zz:dizzy »)
  const [slapped, setSlapped] = useState(false);
  const slaps = useRef({ n: 0, at: 0, dir: 1, dizzyUntil: 0 });
  const slapT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(slapT.current), []);
  const slap = () => {
    const el = preview.current;
    const now = performance.now();
    const sl = slaps.current;
    if (now < sl.dizzyUntil) return; // il a déjà le tournis : on le laisse tranquille
    sl.n = now - sl.at < 900 ? sl.n + 1 : 1;
    sl.at = now;
    sl.dir = -sl.dir; // aller-retour : une joue, puis l'autre
    // Vraie gifle enregistrée, jamais tout à fait la même (3 prises, hauteur un peu variée)
    playSfx((["slap", "slap2", "slap3"] as const)[Math.floor(Math.random() * 3)], { volume: 0.75, rate: 0.95 + Math.random() * 0.1 });
    setSlapped(true);
    clearTimeout(slapT.current);
    slapT.current = setTimeout(() => setSlapped(false), 650);
    if (el && typeof el.animate === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const d = sl.dir;
      el.animate(
        [
          { transform: "translateX(0) rotate(0deg) scale(1,1)" },
          { transform: `translateX(${d * 14}px) rotate(${d * 20}deg) scale(1.06,0.94)`, offset: 0.18 },
          { transform: `translateX(${-d * 5}px) rotate(${-d * 8}deg) scale(0.97,1.03)`, offset: 0.5 },
          { transform: `translateX(${d * 2}px) rotate(${d * 3}deg)`, offset: 0.75 },
          { transform: "translateX(0) rotate(0deg) scale(1,1)" },
        ],
        { duration: 460, easing: "ease-out" },
      );
    }
    if (sl.n >= 5 && el) {
      sl.n = 0;
      sl.dizzyUntil = now + 3000;
      window.dispatchEvent(new CustomEvent("zz:dizzy", { detail: el }));
    }
  };

  const set = (patch: Partial<AvatarLook>) => {
    setLook((l) => ({ ...l, ...patch }));
    setErr(null);
    uiSfx.choice();
    bump();
  };
  const goTab = (x: AvatarTab) => {
    setTab(x);
    uiSfx.choice();
    grid.current?.scrollTo({ top: 0 });
  };

  const save = async () => {
    if (!canSave) return;
    if (locked) {
      setBusy(true);
      const ok = await requestPaywall();
      setBusy(false);
      if (!ok) return; // pas d'abonnement : on reste dans l'éditeur, rien n'est perdu
    }
    const e = onSave({ name: editName ? cleanNm : name, look, me, ...(initialVoice ? { voice: voiceId } : {}) });
    if (e) { setErr(e); return; }
    playSfx("confirm", { volume: 0.5 });
    onClose();
  };

  // Vignettes de l'onglet courant
  const tiles: { key: string; label: string; free: boolean; secret?: boolean; on: boolean; apply: () => void; preview: AvatarLook; swatch?: string }[] =
    tab === "color"
      ? AVATAR_COLORS.map((col) => ({ key: col, label: names[`color.${col}`], free: true, on: look.color === col, apply: () => set({ color: col }), preview: { ...look, color: col }, swatch: AVATAR_PALETTE[col].body }))
      : AVATAR_ITEMS[tab as AvatarSlot]
        // Accessoire secret : invisible tant qu'il n'est pas trouvé (sauf s'il est déjà porté, ex. code de bande)
        .filter((it) => !it.secret || secrets.includes(it.id) || look[tab as AvatarSlot] === it.id)
        .map((it) => {
          const slot = tab as AvatarSlot;
          return { key: it.id, label: names[`${slot}.${it.id}`], free: it.free, secret: it.secret, on: look[slot] === it.id, apply: () => set({ [slot]: it.id } as Partial<AvatarLook>), preview: { ...look, [slot]: it.id } };
        });

  const title = editName ? (cleanNm ? t.editTitle(cleanNm) : t.addMember) : t.editTitle(name);

  return (
    <AvatarLayer label={title}>
      {/* En-tête */}
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        <h2 className="min-w-0 flex-1 truncate" style={{ ...AV_DISPLAY, fontSize: "clamp(22px, 6.4vw, 28px)", lineHeight: 1.05 }}>{title}</h2>
        <RoundIconBtn onClick={() => { uiSfx.close(); onClose(); }} label={t.close}><X size={22} strokeWidth={3} /></RoundIconBtn>
      </div>

      {/* Aperçu */}
      <div className="relative mx-auto flex w-full max-w-lg shrink-0 items-center justify-between px-4" style={{ height: "min(22dvh, 200px)", minHeight: 108 }}>
        {/* Secret : clin d'œil aux « Zinzin » (couronne arc-en-ciel portée partout) */}
        {(zinzin || boss) && (
          <span className="pointer-events-none absolute bottom-0 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-bold"
            style={{ ...avSticker("#fff", 2), color: AV_INK, rotate: "-2deg", borderWidth: 2 }}>
            {zinzin ? t.zinzinCrown : t.bossShades}
          </span>
        )}
        <div className="flex flex-col items-center gap-1.5">
          <RoundIconBtn onClick={() => { set(randomLook(false)); }} label={t.random} bg="#FFD23F"><Dices size={22} strokeWidth={2.6} /></RoundIconBtn>
          <span className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.random}</span>
        </div>
        <div className="relative grid h-full flex-1 place-items-center">
          <div className="absolute bottom-[4%] h-[12%] w-[46%] rounded-[50%]" style={{ background: "rgba(0,0,0,0.28)" }} />
          <div ref={preview} onClick={slap} role="button" aria-label={shownName || "Perso"} style={{ marginTop: "10%", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            <AvatarBlob look={look} name={shownName} size={pv} mood={talk !== null ? talkMood(talk) : slapped ? "shocked" : "happy"} animate={talk === null} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <RoundIconBtn onClick={() => set(baseLook(start.color))} label={t.reset}><RotateCcw size={20} strokeWidth={2.8} /></RoundIconBtn>
          <span className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.reset}</span>
        </div>
      </div>

      {/* Prénom + « C'est moi » */}
      {(editName || showMe) && (
        <div className="mx-auto flex w-full max-w-lg items-center gap-2 px-4 pb-2">
          {editName && (
            <input
              value={nm}
              onChange={(e) => { setNm(e.target.value.slice(0, 16)); setErr(null); }}
              placeholder={t.namePlaceholder}
              aria-label={t.nameLabel}
              autoCorrect="off" autoCapitalize="words" autoComplete="off" spellCheck={false} enterKeyHint="done"
              className="h-11 min-w-0 flex-1 rounded-full px-4 text-center outline-none"
              style={{ ...avSticker("#fff", 3), color: AV_INK, ...AV_DISPLAY, fontSize: 18 }}
            />
          )}
          {showMe && (
            <button type="button" onClick={() => { setMe((v) => !v); uiSfx.choice(); }} aria-pressed={me}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-bold active:translate-y-[2px]"
              style={{ ...avSticker(me ? "#FFD23F" : "#2A1F5C", 3), color: me ? AV_INK : "#fff" }}>
              <Star size={16} strokeWidth={2.8} fill={me ? AV_INK : "none"} /> {t.itsMe}
            </button>
          )}
        </div>
      )}

      {/* Son du perso : gratuit pour « moi », Zinzin+ pour les autres */}
      {initialVoice && (
        <div className="mx-auto w-full max-w-lg px-4 pb-2">
          <VoiceRecorderPanel compact name={cleanNm || name || "?"} voiceId={voiceId} locked={!unlocked && !me} onChange={setVoiceId} />
        </div>
      )}

      {/* Onglets */}
      <div className="mx-auto w-full max-w-lg shrink-0">
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-1" style={{ scrollbarWidth: "none" }} role="tablist">
          {TABS.map((x) => {
            const on = tab === x;
            return (
              <button key={x} type="button" role="tab" aria-selected={on} onClick={() => goTab(x)}
                className="min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-[15px] font-bold active:translate-y-[2px]"
                style={{ ...avSticker(on ? "#FF3EA5" : "#fff", 3), color: on ? "#fff" : AV_INK }}>
                {t.tabs[x]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vignettes */}
      <div ref={grid} className="mx-auto w-full max-w-lg min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1" style={{ overscrollBehavior: "contain" }}>
        {tab === "hair" && (
          <div className="mb-3">
            <p className="mb-1.5 text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.hairColor}</p>
            <div className="flex flex-wrap gap-1.5">
              {HAIR_COLOR_IDS.map((h) => {
                const on = look.hairColor === h;
                return (
                  <button key={h} type="button" onClick={() => set({ hairColor: h })} aria-pressed={on} aria-label={names[`hc.${h}`]} title={names[`hc.${h}`]}
                    className="grid h-11 w-11 place-items-center rounded-full">
                    <span className="grid h-8 w-8 place-items-center rounded-full" style={{
                      background: h === "auto" ? "conic-gradient(#FFD84A, #3BAF5D, #221838, #FF5A2E, #FFD84A)" : HAIR_COLORS[h],
                      border: `2.5px solid ${AV_INK}`, outline: on ? "3px solid #FFD23F" : undefined, outlineOffset: 2,
                    }}>
                      {on && <Check size={14} strokeWidth={3.6} color={h === "white" || h === "blond" ? AV_INK : "#fff"} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2.5 min-[420px]:grid-cols-5">
          {tiles.map((x) => {
            const lockedTile = !x.free && !unlocked;
            return (
              <button key={x.key} type="button" onClick={x.apply} aria-pressed={x.on}
                aria-label={`${x.label}${lockedTile ? ` (${t.locked})` : ""}${x.on ? `, ${t.selected}` : ""}`}
                className="relative flex flex-col items-center rounded-[18px] px-1 pb-1.5 pt-2 active:translate-y-[2px]"
                style={{ ...avSticker(x.on ? "#FFD23F" : "#fff", x.on ? 4 : 3), color: AV_INK, outline: x.on ? "3px solid #fff" : undefined, outlineOffset: 2 }}>
                <span className="grid w-full place-items-center" style={{ height: 58, paddingTop: 10 }}>
                  <AvatarBlob look={x.preview} size={46} animate={false} />
                </span>
                <span className="mt-1 line-clamp-2 w-full text-center text-[12px] font-bold leading-[1.15]" style={{ minHeight: 28, overflowWrap: "break-word" }}>{x.label}</span>
                {lockedTile && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full" style={{ background: "#FF3EA5", border: `2px solid ${AV_INK}`, color: "#fff" }}>
                    <Lock size={12} strokeWidth={3} />
                  </span>
                )}
                {x.secret && !x.on && (
                  <span className="absolute -right-1.5 -top-2 rounded-full px-1.5 text-[12px] font-extrabold leading-[18px]" style={{ background: "linear-gradient(135deg, #FFF0A8, #FFD23F 45%, #E09A00)", border: `2px solid ${AV_INK}`, color: AV_INK, rotate: "6deg" }}>
                    {t.secret}
                  </span>
                )}
                {x.on && !lockedTile && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full" style={{ background: "#fff", border: `2px solid ${AV_INK}` }}>
                    <Check size={13} strokeWidth={3.6} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Enregistrer */}
      <div className="mx-auto w-full max-w-lg shrink-0 px-4 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)", background: `linear-gradient(180deg, ${AV_NIGHT}00, ${AV_NIGHT} 14px)` }}>
        {(err || locked) && (
          <p className="mb-1.5 text-center text-[12px] font-bold leading-snug" style={{ color: err ? "#FF9AA8" : "rgba(255,255,255,0.85)" }} role={err ? "alert" : undefined}>
            {err ?? t.lockedHint}
          </p>
        )}
        <button type="button" onClick={save} disabled={!canSave}
          className="flex h-[58px] w-full items-center justify-center gap-2 rounded-full text-[20px] active:translate-y-[3px]"
          style={{ ...avSticker(canSave ? (locked ? "#FF3EA5" : "#3DDC97") : "#2A1F4D", 5), color: canSave ? (locked ? "#fff" : AV_INK) : "rgba(255,255,255,0.7)", ...AV_DISPLAY }}>
          {locked && <Lock size={19} strokeWidth={3} />}
          {locked ? t.saveLocked : t.save}
        </button>
      </div>
    </AvatarLayer>
  );
}
