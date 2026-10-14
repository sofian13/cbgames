"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Lock, Mic, Play, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { requestPaywall } from "@/lib/entitlements";
import { playSfx } from "@/lib/sfx";
import type { AvatarLook } from "@/lib/avatar/look";
import { VOICE_STR } from "@/lib/avatar/voice-i18n";
import { AVATAR_STR } from "@/lib/avatar/i18n";
import { VOICE_MAX_S, getVoice, putVoice } from "@/lib/avatar/voice-store";
import {
  VoiceRecorder, playClip, stopVoice, talkMood, useSpeaking, voiceKey, warmUpMic, type RecError,
} from "@/lib/avatar/voice";
import { setReceivedMute, setVoiceFor, type BandEntry } from "@/lib/saved-players";
import type { MascotMood } from "@/components/Mascot";
import { AvatarBlob } from "./AvatarBlob";
import { AV_DISPLAY, AV_INK, RoundIconBtn, avSticker } from "./AvatarEditor";

/** Petit saut du blob quand il se met à parler. */
export function hopEl(el: HTMLElement | null) {
  if (!el || typeof el.animate !== "function") return;
  if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [
      { transform: "translateY(0) scale(1,1)" },
      { transform: "translateY(2px) scale(1.1,0.88)", offset: 0.18 },
      { transform: "translateY(-14%) scale(0.94,1.08)", offset: 0.5 },
      { transform: "translateY(0) scale(1.05,0.95)", offset: 0.8 },
      { transform: "translateY(0) scale(1,1)" },
    ],
    { duration: 500, easing: "ease-out" },
  );
}

/** Pastille discrète « ce perso a un son ». */
export function VoiceBadge({ size = 20, style }: { size?: number; style?: CSSProperties }) {
  return (
    <span aria-hidden className="pointer-events-none absolute grid place-items-center rounded-full"
      style={{ width: size, height: size, right: -2, bottom: 0, background: "#FFD23F", border: `2px solid ${AV_INK}`, color: AV_INK, ...style }}>
      <Volume2 size={Math.round(size * 0.6)} strokeWidth={3} />
    </span>
  );
}

/** Blob qui parle : bouche animée pendant la lecture, petit saut au départ, pastille son. */
export function TalkingBlob({
  look, size, speakKey, mood = "happy", animate = true, badge = false, onTap, label,
}: {
  look: AvatarLook;
  size: number;
  speakKey: string;
  mood?: MascotMood;
  animate?: boolean;
  badge?: boolean;
  onTap?: () => void;
  label?: string;
}) {
  const level = useSpeaking(speakKey);
  const talking = level !== null;
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (talking) hopEl(ref.current); }, [talking]);
  const inner = (
    <span ref={ref} className="relative inline-block">
      <AvatarBlob look={look} size={size} mood={talking ? talkMood(level) : mood} animate={animate && !talking} />
      {badge && <VoiceBadge size={Math.max(18, Math.round(size * 0.34))} />}
    </span>
  );
  if (!onTap) return inner;
  return (
    <button type="button" onClick={onTap} aria-label={label} className="relative grid place-items-end justify-center active:scale-95">
      {inner}
    </button>
  );
}

/* ───────── Enregistreur « maintenir pour parler » ───────── */
const MIC_OK = "zz-voice-mic";
const micAsked = () => { try { return localStorage.getItem(MIC_OK) === "1"; } catch { return false; } };

/**
 * Bouton micro à maintenir (5 s max, jauge + compte à rebours), réécoute, suppression.
 * Le son est rangé dans IndexedDB dès la fin de l'enregistrement ; `onChange` reçoit son id.
 * `locked` (son d'un autre perso sans Zinzin+) : l'appui ouvre le paywall.
 */
export function VoiceRecorderPanel({
  name, voiceId, locked, compact = false, onChange, onMessage,
}: {
  name: string;
  voiceId: string | null;
  locked: boolean;
  compact?: boolean;
  onChange: (id: string | null) => void;
  onMessage?: (m: string) => void;
}) {
  const t = useT(VOICE_STR);
  const [phase, setPhase] = useState<"idle" | "rec" | "saving">("idle");
  const [progress, setProgress] = useState(0);
  const [level, setLevel] = useState(0);
  const [ask, setAsk] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const rec = useRef<VoiceRecorder | null>(null);
  const raf = useRef(0);

  const say = (m: string) => { setNote(m); onMessage?.(m); };
  const errText = (e: unknown) => {
    const k = (typeof e === "string" ? e : "failed") as RecError;
    return { denied: t.denied, unavailable: t.unavailable, short: t.short, big: t.big, failed: t.failed }[k] ?? t.failed;
  };

  useEffect(() => () => { cancelAnimationFrame(raf.current); rec.current?.cancel(); rec.current = null; }, []);

  const end = async () => {
    const r = rec.current;
    if (!r) return;
    rec.current = null;
    cancelAnimationFrame(raf.current);
    if (!r.started) { r.cancel(); return; } // relâché avant l'ouverture du micro : start() lève « short »
    setPhase("saving");
    try {
      const clip = await r.stop();
      await putVoice(clip);
      onChange(clip.id);
      setNote(t.saved);
      onMessage?.(t.saved);
      // Réécoute immédiate : on entend tout de suite ce qu'on a fait
      void playClip(voiceKey(name), clip);
    } catch (e) {
      say(errText(e));
    } finally {
      setPhase("idle");
      setProgress(0);
      setLevel(0);
    }
  };

  const begin = async () => {
    if (phase !== "idle" || rec.current) return;
    setConfirmDel(false);
    if (locked) { await requestPaywall(); return; } // abonné ensuite : on rappuie pour enregistrer
    if (!micAsked()) { setAsk(true); return; }
    stopVoice();
    const r = new VoiceRecorder(() => void end());
    rec.current = r;
    setPhase("rec");
    setNote(null);
    try {
      await r.start();
    } catch (e) {
      if (rec.current === r) rec.current = null;
      setPhase("idle");
      say(errText(e));
      return;
    }
    if (rec.current !== r) return;
    navigator.vibrate?.(12);
    const loop = () => {
      if (rec.current !== r) return;
      setProgress(Math.min(1, r.elapsed() / VOICE_MAX_S));
      setLevel(r.level());
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };

  const allowMic = async () => {
    const e = await warmUpMic();
    setAsk(false);
    if (e) { say(errText(e)); return; }
    try { localStorage.setItem(MIC_OK, "1"); } catch { /* indispo */ }
    say(voiceId ? t.holdRedo : t.hold);
  };

  const play = async () => {
    if (!voiceId) return;
    const clip = await getVoice(voiceId);
    if (!clip || !(await playClip(voiceKey(name), clip))) say(t.unreadable);
  };

  const del = () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setConfirmDel(false);
    stopVoice();
    onChange(null);
    playSfx("back", { volume: 0.4 });
    setNote(t.deleted);
    onMessage?.(t.deleted);
  };

  const recording = phase === "rec";
  const left = Math.max(0, Math.ceil(VOICE_MAX_S * (1 - progress)));
  const holdLabel = recording ? t.recording(left) : voiceId ? t.holdRedo : t.hold;
  const holdProps = {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      void begin();
    },
    onPointerUp: () => void end(),
    onPointerCancel: () => void end(),
    onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); void begin(); } },
    onKeyUp: (e: React.KeyboardEvent) => { if (e.key === " " || e.key === "Enter") void end(); },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    "aria-label": t.holdAria(name),
    "aria-pressed": recording,
    style: { touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" } as CSSProperties,
  };

  const askCard = ask && (
    <div className="mt-2 rounded-[18px] p-3" style={{ ...avSticker("#FFF6E5", 3), color: AV_INK }} role="dialog" aria-label={t.micAskTitle}>
      <p className="text-[15px] leading-tight" style={AV_DISPLAY}>{t.micAskTitle}</p>
      <p className="mt-1 text-[13px] font-semibold leading-snug">{t.micAskText}</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={allowMic} className="min-h-11 flex-1 rounded-full px-3 text-[14px] font-bold" style={{ ...avSticker("#3DDC97", 3), color: AV_INK }}>{t.micAskOk}</button>
        <button type="button" onClick={() => setAsk(false)} className="min-h-11 rounded-full px-3 text-[14px] font-bold" style={{ color: AV_INK }}>{t.micAskLater}</button>
      </div>
    </div>
  );

  const playBtn = voiceId && !recording && (
    <button type="button" onClick={play} aria-label={t.playAria(name)}
      className={compact ? "grid h-11 w-11 shrink-0 place-items-center rounded-full" : "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 text-[15px] font-bold"}
      style={{ ...avSticker("#4ECDC4", 3), color: AV_INK }}>
      <Play size={compact ? 18 : 18} strokeWidth={3} fill={AV_INK} />{!compact && t.play}
    </button>
  );
  const delBtn = voiceId && !recording && (
    <button type="button" onClick={del} aria-label={confirmDel ? t.delConfirm : t.del}
      className={compact && !confirmDel ? "grid h-11 w-11 shrink-0 place-items-center rounded-full" : "flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[14px] font-bold"}
      style={{ ...avSticker(confirmDel ? "#FF6B5B" : "#fff", 3), color: confirmDel ? "#fff" : AV_INK }}>
      <Trash2 size={17} strokeWidth={2.8} />{(confirmDel || !compact) && (confirmDel ? t.delConfirm : t.del)}
    </button>
  );

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2">
          <button type="button" {...holdProps}
            className="relative flex h-11 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full px-3 text-[14px] font-bold"
            style={{ ...holdProps.style, ...avSticker(recording ? "#FF3EA5" : locked ? "#2A1F5C" : "#FFD23F", 3), color: recording || locked ? "#fff" : AV_INK }}>
            {recording && <span aria-hidden className="absolute inset-y-0 left-0" style={{ width: `${progress * 100}%`, background: "rgba(255,255,255,0.28)" }} />}
            <span className="relative flex min-w-0 items-center gap-1.5">
              {locked ? <Lock size={15} strokeWidth={3} /> : <Mic size={17} strokeWidth={2.8} style={{ transform: `scale(${1 + level * 0.35})` }} />}
              <span className="truncate">{phase === "saving" ? "…" : recording || !voiceId ? holdLabel : t.redoShort}</span>
            </span>
          </button>
          {playBtn}
          {delBtn}
        </div>
        {(note || locked) && !ask && (
          <p className="mt-1 text-center text-[12px] font-bold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }} role="status">{note ?? t.lockedVoice}</p>
        )}
        {askCard}
      </div>
    );
  }

  // Grand format (fiche du perso dans « Ma bande »)
  const R = 46, C = 2 * Math.PI * R;
  return (
    <div className="flex w-full flex-col items-center">
      <p className="text-center text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.voiceHint}</p>
      <button type="button" {...holdProps} className="relative mt-3 grid h-[104px] w-[104px] place-items-center rounded-full"
        style={{ ...holdProps.style, ...avSticker(recording ? "#FF3EA5" : locked ? "#2A1F5C" : "#FFD23F", 5), color: recording || locked ? "#fff" : AV_INK }}>
        <svg viewBox="0 0 104 104" className="pointer-events-none absolute inset-0" aria-hidden>
          <circle cx={52} cy={52} r={R} fill="none" stroke="rgba(21,8,46,0.18)" strokeWidth={6} />
          {recording && <circle cx={52} cy={52} r={R} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 52 52)" />}
        </svg>
        {locked ? <Lock size={34} strokeWidth={2.8} /> : <Mic size={40} strokeWidth={2.6} style={{ transform: `scale(${1 + level * 0.3})`, transition: "transform 60ms" }} />}
      </button>
      <p className="mt-2 text-center text-[16px]" style={AV_DISPLAY} aria-live="polite">{phase === "saving" ? "…" : holdLabel}</p>
      {recording && (
        <div className="mt-2 h-2.5 w-40 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} aria-hidden>
          <div className="h-full rounded-full" style={{ width: `${Math.round(level * 100)}%`, background: "#3DDC97", transition: "width 60ms" }} />
        </div>
      )}
      {(playBtn || delBtn) && <div className="mt-3 flex w-full gap-2.5">{playBtn}{delBtn}</div>}
      {(note || locked) && !ask && (
        <p className="mt-2 text-center text-[13px] font-bold leading-snug" style={{ color: note && note !== t.saved && note !== t.deleted ? "#FFD9A0" : "rgba(255,255,255,0.85)" }} role="status">{note ?? t.lockedVoice}</p>
      )}
      {askCard}
    </div>
  );
}

/* ───────── Fiche « son » d'un perso (depuis « Ma bande ») ───────── */
export function VoiceSheet({ entry, look, locked, onClose }: {
  entry: BandEntry;
  look: AvatarLook;
  locked: boolean;
  onClose: () => void;
}) {
  const t = useT(VOICE_STR);
  const ta = useT(AVATAR_STR);
  const k = voiceKey(entry.name);
  const play = async () => {
    if (!entry.voice) return;
    const clip = await getVoice(entry.voice);
    if (clip) void playClip(k, clip);
  };
  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 4 }} role="dialog" aria-modal aria-label={t.voiceOf(entry.name)}>
      <div className="absolute inset-0" style={{ background: "rgba(10,4,32,0.7)" }} onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-[30px] px-5 pt-4"
        style={{ background: "#2A1A6B", border: `3px solid ${AV_INK}`, borderBottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)" }}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate" style={{ ...AV_DISPLAY, fontSize: 26 }}>{t.voiceOf(entry.name)}</h3>
          <RoundIconBtn onClick={onClose} label={ta.close}><X size={20} strokeWidth={3} /></RoundIconBtn>
        </div>
        <div className="mt-2 flex items-center justify-center" style={{ minHeight: 110 }}>
          <TalkingBlob look={look} size={96} speakKey={k} badge={!!entry.voice} onTap={entry.voice ? play : undefined} label={t.playAria(entry.name)} />
        </div>
        {entry.from && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-[18px] px-3 py-2" style={{ background: "rgba(255,255,255,0.1)" }}>
            <span className="text-[14px] font-bold">{t.recvFrom(entry.from)}</span>
            {entry.voice && (
              <button type="button" onClick={() => { setReceivedMute(entry.name, !entry.mute); if (!entry.mute) stopVoice(); }}
                aria-pressed={!!entry.mute} aria-label={entry.mute ? t.unmute(entry.name) : t.mute(entry.name)}
                className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold"
                style={{ ...avSticker(entry.mute ? "#FF6B5B" : "#fff", 3), color: entry.mute ? "#fff" : AV_INK }}>
                {entry.mute ? <VolumeX size={16} strokeWidth={3} /> : <Volume2 size={16} strokeWidth={3} />}
                {entry.mute ? t.muted : t.muteShort}
              </button>
            )}
          </div>
        )}
        <VoiceRecorderPanel name={entry.name} voiceId={entry.voice ?? null} locked={locked}
          onChange={(id) => setVoiceFor(entry.name, id)} />
      </div>
    </div>
  );
}
