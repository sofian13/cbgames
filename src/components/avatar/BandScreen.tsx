"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ClipboardPaste, Clock3, Copy, Download, Gamepad2, Heart, Image as ImageIcon, Lock, Mic, Plus, Skull, Star, Volume2, X } from "lucide-react";
import { useLang, useT, type Lang } from "@/lib/i18n";
import { bandStatsGameName, favoriteGame, topLoser, type BandStats } from "@/lib/band-stats";
import { useUnlocked } from "@/lib/entitlements";
import { playSfx } from "@/lib/sfx";
import { uiSfx } from "@/lib/ui-sfx";
import { BAND_MAX, baseLook, decodeBand, encodeBand, lookHasPremium, type AvatarLook, type BandMember } from "@/lib/avatar/look";
import { AVATAR_STR } from "@/lib/avatar/i18n";
import { linkedVoiceIds, sameName, setBand, type BandEntry } from "@/lib/saved-players";
import { VOICE_STR } from "@/lib/avatar/voice-i18n";
import { gcVoices, getVoice } from "@/lib/avatar/voice-store";
import { playClip, stopVoice, voiceKey } from "@/lib/avatar/voice";
import { TalkingBlob, VoiceSheet } from "./VoiceUI";
import { shareBandCard } from "@/lib/share-card";
import { AvatarBlob } from "./AvatarBlob";
import { AV_DISPLAY, AV_INK, AvatarEditor, AvatarLayer, RoundIconBtn, avSticker } from "./AvatarEditor";
import { colorForIndexSafe } from "./colors";
import { useBand } from "./PlayerBlob";
import { BandStatsCard, BandStatsScreen, useBandStats } from "./BandStatsScreen";
import { useBandPlay } from "./band-play";

const lookOf = (e: { look: AvatarLook | null }, i: number) => e.look ?? baseLook(colorForIndexSafe(i));


/** Jours entiers (calendrier) depuis une date. */
function daysSince(ms: number): number {
  const a = new Date(ms), b = new Date();
  const d0 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const d1 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.round((d1 - d0) / 86_400_000));
}

/** Lignes de stats (écran et image partagée) : seulement ce qu'on sait vraiment. */
function statLines(s: BandStats, t: (typeof AVATAR_STR)["fr"], lang: Lang) {
  if (!s.games) return [];
  const fav = favoriteGame(s);
  const favName = fav ? bandStatsGameName(fav, lang) : undefined;
  const loser = topLoser(s);
  return [
    { key: "games", icon: Gamepad2, text: t.statGames(s.games) },
    ...(favName ? [{ key: "fav", icon: Heart, text: t.statFav(favName) }] : []),
    ...(loser ? [{ key: "loser", icon: Skull, text: t.statLoser(loser.name, loser.n) }] : []),
    ...(s.last ? [{ key: "last", icon: Clock3, text: t.statLast(daysSince(s.last)) }] : []),
  ];
}

/**
 * « Ma bande » : jusqu'à 16 persos (prénom + look), dans l'ordre choisi.
 * Ajout, modification, suppression, réordonnancement ; partage en image ou par code.
 */
export function BandScreen({ onClose }: { onClose: () => void }) {
  const t = useT(AVATAR_STR);
  const tv = useT(VOICE_STR);
  const unlocked = useUnlocked();
  const band = useBand();
  const lang = useLang();
  const stats = useBandStats();
  const lines = statLines(stats, t, lang);
  const [statsOpen, setStatsOpen] = useState(false);
  const [edit, setEdit] = useState<number | "new" | null>(null);
  const [voiceOf, setVoiceOf] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [manage, setManage] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const playRef = useRef<HTMLDivElement>(null);
  useBandPlay(playRef, band.length > 0);
  useEffect(() => () => { clearTimeout(timer.current); stopVoice(); }, []);
  // Ménage : sons enregistrés puis abandonnés (éditeur fermé sans enregistrer…)
  useEffect(() => { void gcVoices(linkedVoiceIds()); }, []);

  const toast = (m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2600);
  };

  const save = (list: BandEntry[]) => setBand(list.map((e) => ({ name: e.name, look: e.look, me: e.me, voice: e.voice })));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= band.length) return;
    const l = [...band];
    [l[i], l[j]] = [l[j], l[i]];
    save(l);
    playSfx("tap", { volume: 0.4 });
  };
  const remove = (i: number) => {
    save(band.filter((_, k) => k !== i));
    setConfirm(null);
    playSfx("back", { volume: 0.4 });
  };

  const meName = band.find((b) => b.me)?.name ?? band[0]?.name;
  const audible = (b: BandEntry) => !!b.voice;
  const title = meName ? t.bandOf(meName) : t.ourBand;

  const shareImage = async () => {
    if (!band.length || sharing) return;
    setSharing(true);
    try {
      // Image : 3 lignes de stats max (la date de la dernière partie reste sur l'écran)
      const card = lines.filter((l) => l.key !== "last").slice(0, 3).map((l) => l.text);
      await shareBandCard(band.map((b, i) => ({ name: b.name, look: lookOf(b, i) })), title, t.bandSubtitle(band.length), t.bandShareText(title), card);
    } finally {
      setSharing(false);
    }
  };

  // Toucher un perso qui a un son : il le dit ; sinon on ouvre son éditeur
  const hear = async (b: BandEntry, i: number) => {
    const clip = b.voice ? await getVoice(b.voice) : null;
    if (!clip) { setVoiceOf(i); return; }
    if (!(await playClip(voiceKey(b.name), clip))) toast(tv.unreadable);
  };

  const copyCode = async () => {
    const c = encodeBand(band.map((b, i): BandMember => ({ name: b.name, look: lookOf(b, i), me: b.me })));
    setCode(c);
    let ok = false;
    try {
      await navigator.clipboard.writeText(c);
      ok = true;
    } catch {
      // Webview sans presse-papiers asynchrone : ancienne méthode
      try {
        const ta = document.createElement("textarea");
        ta.value = c;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch { ok = false; }
    }
    toast(ok ? t.copied : t.copyFail);
  };

  const editing = edit === null ? null : edit === "new" ? { name: "", look: null, me: band.length === 0 } : band[edit];

  return (
    <AvatarLayer label={t.myBand} z={43}>
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        <div className="min-w-0 flex-1">
          <h2 style={{ ...AV_DISPLAY, fontSize: 32, lineHeight: 1 }}>{t.myBand}</h2>
          <p className="mt-1 text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.75)" }}>{t.bandCount(band.length, BAND_MAX)}</p>
        </div>
        <RoundIconBtn onClick={() => { uiSfx.close(); onClose(); }} label={t.close}><X size={22} strokeWidth={3} /></RoundIconBtn>
      </div>

      <div className="mx-auto w-full max-w-lg min-h-0 flex-1 overflow-y-auto px-4 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)", overscrollBehavior: "contain" }}>
        {band.length === 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-[22px] p-3" style={{ ...avSticker("#FFD23F", 4), color: AV_INK, rotate: "-1deg" }}>
            <AvatarBlob look={baseLook("pink")} size={64} mood="wink" />
            <p className="text-[15px] font-bold leading-snug">{t.bandEmpty}</p>
          </div>
        )}

        {/* La bande : les blobs côte à côte, toucher = entendre */}
        {band.length > 0 && (
          <div className="relative mb-3 rounded-[28px] px-2 pb-4 pt-5" style={{ background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.12)" }}>
            {/* Secrets : appui long = blob écrasé ; appui long + glisser sur un autre = bisou (band-play.ts) */}
            <div ref={playRef} className="flex flex-wrap items-end justify-center" style={{ columnGap: band.length > 8 ? 4 : 10, rowGap: 14, WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}>
              {band.map((b, i) => {
                const size = band.length <= 3 ? 104 : band.length <= 6 ? 84 : band.length <= 10 ? 68 : 58;
                return (
                  <div key={b.name} data-band-blob className="flex flex-col items-center" style={{ width: size + 8, rotate: `${((i * 37) % 7) - 3}deg` }}>
                    <TalkingBlob look={lookOf(b, i)} name={b.name} size={size} speakKey={voiceKey(b.name)} badge={audible(b)}
                      onTap={() => void hear(b, i)} label={audible(b) ? tv.playAria(b.name) : tv.micAria(b.name)} />
                    <span className="mt-1 block max-w-full truncate text-center text-[13px] font-extrabold" style={{ color: b.me ? "#FFD23F" : "#fff" }}>{b.name}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>{t.tapHint}</p>
          </div>
        )}

        {/* Stats de la bande : carte sticker → écran plein écran */}
        {band.length > 0 && <BandStatsCard onOpen={() => setStatsOpen(true)} />}

        {band.length > 0 && (
          <button type="button" onClick={() => { setManage((m) => !m); setConfirm(null); playSfx("tap", { volume: 0.4 }); }}
            className="mb-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold"
            style={manage ? { ...avSticker("#3DDC97", 3), color: AV_INK } : { border: "2.5px solid rgba(255,255,255,0.45)", color: "#fff" }}>
            {manage ? t.doneManage : t.manageBand}
          </button>
        )}

        {(manage || band.length === 0) && (<>
        <ol className="flex flex-col gap-2.5">
          {band.map((b, i) => (
            <li key={b.name} className="flex items-center gap-1.5 rounded-[22px] py-1.5 pl-2 pr-1" style={{ ...avSticker(b.me ? "#FFD23F" : "#fff", 3), color: AV_INK }}>
              <span className="grid h-[60px] w-[50px] shrink-0 place-items-end justify-center">
                <TalkingBlob look={lookOf(b, i)} name={b.name} size={46} animate={false} speakKey={voiceKey(b.name)} badge={audible(b)}
                  onTap={() => void hear(b, i)} label={audible(b) ? tv.playAria(b.name) : t.editAria(b.name)} />
              </span>
              <button type="button" onClick={() => { uiSfx.blob(); setEdit(i); }} aria-label={t.editAria(b.name)} className="flex min-h-[60px] min-w-0 flex-1 flex-col justify-center text-left">
                <span className="block w-full truncate" style={{ ...AV_DISPLAY, fontSize: b.name.length > 9 ? 16 : b.name.length > 6 ? 18 : 20 }}>{b.name}</span>
                {b.me && <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-extrabold"><Star size={12} strokeWidth={3} fill={AV_INK} /> {t.me}</span>}
              </button>
              {confirm === i ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => remove(i)} className="min-h-11 rounded-full px-3 text-[13px] font-bold" style={{ ...avSticker("#FF6B5B", 2), color: "#fff" }}>{t.remove(b.name).split(" ")[0]}</button>
                  <button type="button" onClick={() => setConfirm(null)} aria-label={t.cancel} className="grid h-11 w-11 place-items-center rounded-full"><X size={18} strokeWidth={3} /></button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center">
                  <button type="button" onClick={() => setVoiceOf(i)} aria-label={tv.micAria(b.name)} className="relative grid h-11 w-9 place-items-center">
                    {b.voice ? <Volume2 size={19} strokeWidth={2.8} /> : <Mic size={19} strokeWidth={2.8} />}
                    {!b.voice && !b.me && !unlocked && (
                      <span className="absolute right-0.5 top-1 grid h-4 w-4 place-items-center rounded-full" style={{ background: "#FF3EA5", color: "#fff" }}><Lock size={9} strokeWidth={3.4} /></span>
                    )}
                  </button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.moveUp(b.name)} className="grid h-11 w-8 place-items-center disabled:opacity-25"><ArrowUp size={19} strokeWidth={3} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === band.length - 1} aria-label={t.moveDown(b.name)} className="grid h-11 w-8 place-items-center disabled:opacity-25"><ArrowDown size={19} strokeWidth={3} /></button>
                  <button type="button" onClick={() => setConfirm(i)} aria-label={t.remove(b.name)} className="grid h-11 w-9 place-items-center"><X size={19} strokeWidth={3} /></button>
                </div>
              )}
            </li>
          ))}
        </ol>

        <button type="button" onClick={() => { uiSfx.open(); setEdit("new"); }} disabled={band.length >= BAND_MAX}
          className="mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[22px] text-[16px] font-bold disabled:opacity-50"
          style={{ border: "2.5px dashed rgba(255,255,255,0.45)", color: "#fff" }}>
          <Plus size={20} strokeWidth={3} /> {band.length >= BAND_MAX ? t.bandFull : t.addMember}
        </button>
        </>)}

        {/* Partager la bande */}
        <h3 className="mt-7" style={{ ...AV_DISPLAY, fontSize: 24 }}>{t.shareBand}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" onClick={shareImage} disabled={!band.length || sharing}
            className="flex min-h-[64px] flex-col items-start justify-center gap-1 rounded-[20px] px-3.5 py-2.5 text-left text-[14px] font-bold leading-tight disabled:opacity-50"
            style={{ ...avSticker("#FF3EA5", 4), color: "#fff", rotate: "-1deg" }}>
            <ImageIcon size={20} strokeWidth={2.6} /> {t.shareImage}
          </button>
          <button type="button" onClick={copyCode} disabled={!band.length}
            className="flex min-h-[64px] flex-col items-start justify-center gap-1 rounded-[20px] px-3.5 py-2.5 text-left text-[14px] font-bold leading-tight disabled:opacity-50"
            style={{ ...avSticker("#4ECDC4", 4), color: AV_INK, rotate: "1deg" }}>
            <Copy size={20} strokeWidth={2.6} /> {t.copyCode}
          </button>
        </div>
        {code && (
          <textarea readOnly value={code} onFocus={(e) => e.currentTarget.select()} aria-label={t.copyCode}
            className="mt-3 h-20 w-full resize-none rounded-[16px] p-3 font-mono text-[16px] leading-snug outline-none"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "2px solid rgba(255,255,255,0.3)", wordBreak: "break-all" }} />
        )}
        <button type="button" onClick={() => { uiSfx.open(); setImporting(true); }}
          className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-bold"
          style={{ ...avSticker("#fff", 4), color: AV_INK }}>
          <Download size={19} strokeWidth={2.8} /> {t.importBand}
        </button>
      </div>

      {msg && (
        <div className="pointer-events-none fixed inset-x-0 flex justify-center px-6" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)", zIndex: 5 }} role="status">
          <div className="rounded-full px-5 py-3 text-center text-[15px] font-bold" style={{ ...avSticker("#FFD23F", 3), color: AV_INK }}>{msg}</div>
        </div>
      )}

      {editing && (
        <AvatarEditor
          name={editing.name}
          look={editing.look}
          colorHint={colorForIndexSafe(edit === "new" ? band.length : (edit as number))}
          editName
          showMe
          isMe={editing.me}
          voice={{ id: editing.voice ?? null }}
          onClose={() => setEdit(null)}
          onSave={({ name, look, me, voice }) => {
            const idx = edit === "new" ? -1 : (edit as number);
            if (band.some((b, k) => k !== idx && sameName(b.name, name))) return t.nameTaken;
            const entry: BandEntry = { name, look, me, voice: voice ?? null };
            let l = idx < 0 ? [...band, entry] : band.map((b, k) => (k === idx ? entry : b));
            if (me) l = l.map((b) => (b === entry ? b : { ...b, me: false }));
            save(l);
            toast(t.saved);
          }}
        />
      )}

      {voiceOf !== null && band[voiceOf] && (
        <VoiceSheet entry={band[voiceOf]} look={lookOf(band[voiceOf], voiceOf)} locked={!unlocked && !band[voiceOf].me}
          onClose={() => { stopVoice(); setVoiceOf(null); }} />
      )}

      {statsOpen && <BandStatsScreen band={band} onClose={() => setStatsOpen(false)} onToast={toast} />}

      {importing && <ImportPanel band={band} onClose={() => setImporting(false)} onDone={(n) => { setImporting(false); toast(t.importDone(n)); }} />}
    </AvatarLayer>
  );
}

/** Importer une bande : coller le code → aperçu → ajouter ou remplacer. */
function ImportPanel({ band, onClose, onDone }: { band: BandEntry[]; onClose: () => void; onDone: (n: number) => void }) {
  const t = useT(AVATAR_STR);
  const unlocked = useUnlocked();
  const [text, setText] = useState("");
  const parsed = text.trim() ? decodeBand(text) : null;
  const bad = text.trim().length > 0 && !parsed;
  const premium = !unlocked && !!parsed?.some((m) => lookHasPremium(m.look));

  const paste = async () => {
    try {
      const v = await navigator.clipboard.readText();
      if (v) setText(v.slice(0, 8000));
    } catch { /* presse-papiers refusé : on colle à la main */ }
  };
  // Le « moi » d'une bande reçue est celui de l'expéditeur : jamais repris
  const add = () => {
    if (!parsed) return;
    const l: BandEntry[] = band.map((b) => {
      const m = parsed.find((p) => sameName(p.name, b.name));
      return m ? { ...b, look: m.look } : b;
    });
    let added = 0;
    for (const m of parsed) {
      if (l.length >= BAND_MAX) break;
      if (l.some((b) => sameName(b.name, m.name))) continue;
      l.push({ name: m.name, look: m.look, me: false });
      added++;
    }
    setBand(l);
    playSfx("success", { volume: 0.5 });
    onDone(added || parsed.length);
  };
  const replace = () => {
    if (!parsed) return;
    const myName = band.find((b) => b.me)?.name;
    setBand(parsed.map((m) => ({ name: m.name, look: m.look, me: !!myName && sameName(m.name, myName) })));
    playSfx("success", { volume: 0.5 });
    onDone(parsed.length);
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 3 }} role="dialog" aria-modal aria-label={t.importTitle}>
      <div className="absolute inset-0" style={{ background: "rgba(10,4,32,0.7)" }} onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-[30px] px-5 pt-4"
        style={{ background: "#2A1A6B", border: `3px solid ${AV_INK}`, borderBottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <div className="flex items-center justify-between gap-3">
          <h3 style={{ ...AV_DISPLAY, fontSize: 26 }}>{t.importTitle}</h3>
          <RoundIconBtn onClick={onClose} label={t.close}><X size={20} strokeWidth={3} /></RoundIconBtn>
        </div>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.importHint}</p>
        <div className="mt-3 flex gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 8000))} placeholder="ZZB1-…" aria-label={t.importTitle}
            autoCorrect="off" autoCapitalize="off" spellCheck={false}
            className="h-24 min-w-0 flex-1 resize-none rounded-[16px] p-3 font-mono text-[16px] leading-snug outline-none"
            style={{ background: "#fff", color: AV_INK, border: `2.5px solid ${AV_INK}`, wordBreak: "break-all" }} />
          <button type="button" onClick={paste} className="flex w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] text-[12px] font-bold"
            style={{ ...avSticker("#FFD23F", 3), color: AV_INK }}>
            <ClipboardPaste size={20} strokeWidth={2.6} /> {t.importPaste}
          </button>
        </div>
        {bad && <p className="mt-2 text-[14px] font-bold" style={{ color: "#FF9AA8" }} role="alert">{t.importBad}</p>}
        {parsed && (
          <>
            <p className="mt-4 text-[14px] font-bold">{t.importPreview(parsed.length)}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-1 gap-y-2 rounded-[20px] p-2" style={{ background: "rgba(255,255,255,0.08)" }}>
              {parsed.map((m) => (
                <div key={m.name} className="flex w-[74px] flex-col items-center">
                  <div className="grid h-[62px] place-items-end"><AvatarBlob look={m.look} name={m.name} size={54} animate={false} /></div>
                  <span className="mt-0.5 w-full truncate text-center text-[13px] font-bold">{m.name}</span>
                </div>
              ))}
            </div>
            {premium && <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}><Lock size={14} strokeWidth={3} /> {t.importPremiumNote}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={add} className="min-h-[54px] rounded-full px-2 text-[15px] leading-tight" style={{ ...avSticker("#3DDC97", 4), color: AV_INK, ...AV_DISPLAY }}>{t.importAdd}</button>
              <button type="button" onClick={replace} className="min-h-[54px] rounded-full px-2 text-[15px] leading-tight" style={{ ...avSticker("#fff", 4), color: AV_INK, ...AV_DISPLAY }}>{t.importReplace}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
