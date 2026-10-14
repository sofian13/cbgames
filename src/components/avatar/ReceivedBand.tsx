"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { BAND_MAX } from "@/lib/avatar/look";
import { AVATAR_STR } from "@/lib/avatar/i18n";
import { VOICE_STR } from "@/lib/avatar/voice-i18n";
import type { BandFileResult, ReceivedMember } from "@/lib/avatar/band-file";
import { newVoiceId, putVoice } from "@/lib/avatar/voice-store";
import { playClip, stopVoice } from "@/lib/avatar/voice";
import { getBand, sameName, setBand, type BandEntry } from "@/lib/saved-players";
import { AV_DISPLAY, AV_INK, AvatarLayer, RoundIconBtn, avSticker } from "./AvatarEditor";
import { TalkingBlob } from "./VoiceUI";

/** Range le son reçu dans IndexedDB ; renvoie son id (ou null si le stockage échoue). */
async function storeVoice(m: ReceivedMember): Promise<string | null> {
  if (!m.voice) return null;
  const id = newVoiceId();
  const ok = await putVoice({ id, mime: m.voice.mime, dur: m.voice.dur, gain: m.voice.gain, data: m.voice.data });
  return ok ? id : null;
}

/**
 * Aperçu d'une bande reçue (fichier .zinzin) : « La bande de X », « De la part de X »,
 * toucher un perso = l'entendre → Ajouter à ma bande / Remplacer / Annuler.
 * Gratuit (c'est ce qui fait découvrir l'app). Fichier invalide : message clair, rien n'est modifié.
 */
export function ReceivedBandScreen({ result, onClose, onDone }: {
  result: BandFileResult;
  onClose: () => void;
  /** Bande ajoutée / remplacée : message à afficher */
  onDone: (msg: string) => void;
}) {
  const t = useT(VOICE_STR);
  const ta = useT(AVATAR_STR);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => () => stopVoice(), []);

  if (!result.ok) {
    return (
      <AvatarLayer label={t.recvErrTitle} z={47}>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full" style={{ ...avSticker("#FFD23F", 4), color: AV_INK }}><AlertTriangle size={30} strokeWidth={2.6} /></span>
          <h2 className="mt-4" style={{ ...AV_DISPLAY, fontSize: 28 }}>{t.recvErrTitle}</h2>
          <p className="mt-2 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }} role="alert">{t.recvErr[result.error]}</p>
          <button type="button" onClick={onClose} className="mt-6 min-h-[54px] w-full max-w-xs rounded-full text-[18px]" style={{ ...avSticker("#fff", 4), color: AV_INK, ...AV_DISPLAY }}>{t.ok}</button>
        </div>
      </AvatarLayer>
    );
  }

  const { from, members } = result.band;
  const voices = members.filter((m) => m.voice).length;
  const hear = async (m: ReceivedMember, i: number) => {
    if (!m.voice) return;
    if (!(await playClip(`r:${i}`, m.voice))) setNote(t.unreadable);
  };

  // Le « moi » du destinataire n'est jamais écrasé par la bande reçue
  const add = async () => {
    if (busy) return;
    setBusy(true);
    stopVoice();
    const band = getBand();
    const l: BandEntry[] = [...band];
    let added = 0;
    for (const m of members) {
      const at = l.findIndex((b) => sameName(b.name, m.name));
      if (at >= 0) {
        if (l[at].me) continue;
        const voice = m.voice ? await storeVoice(m) : l[at].voice ?? null;
        l[at] = { ...l[at], look: m.look, voice, from, mute: false };
        added++;
        continue;
      }
      if (l.length >= BAND_MAX) break;
      l.push({ name: m.name, look: m.look, me: false, voice: await storeVoice(m), from, mute: false });
      added++;
    }
    setBand(l);
    setBusy(false);
    if (!added) { setNote(t.recvFull); return; }
    playSfx("success", { volume: 0.5 });
    onDone(t.recvAdded(added));
  };

  const replace = async () => {
    if (busy) return;
    setBusy(true);
    stopVoice();
    const mine = getBand().find((b) => b.me);
    const l: BandEntry[] = mine ? [mine] : [];
    for (const m of members) {
      if (l.length >= BAND_MAX) break;
      if (mine && sameName(mine.name, m.name)) continue;
      l.push({ name: m.name, look: m.look, me: false, voice: await storeVoice(m), from, mute: false });
    }
    setBand(l);
    setBusy(false);
    playSfx("success", { volume: 0.5 });
    onDone(t.recvAdded(l.length - (mine ? 1 : 0)));
  };

  const small = members.length > 9;
  return (
    <AvatarLayer label={t.recvTitle(from)} z={47}>
      <div className="mx-auto flex w-full max-w-lg items-start gap-3 px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        <div className="min-w-0 flex-1">
          <h2 style={{ ...AV_DISPLAY, fontSize: "clamp(26px, 8vw, 34px)", lineHeight: 1.02, overflowWrap: "anywhere" }}>{t.recvTitle(from)}</h2>
          <p className="mt-2 inline-block rounded-full px-3 py-1 text-[13px] font-extrabold" style={{ ...avSticker("#FFD23F", 2), color: AV_INK, rotate: "-1.5deg" }}>{t.recvFrom(from)}</p>
        </div>
        <RoundIconBtn onClick={onClose} label={ta.close}><X size={22} strokeWidth={3} /></RoundIconBtn>
      </div>

      <div className="mx-auto w-full max-w-lg min-h-0 flex-1 overflow-y-auto px-4 pt-3" style={{ overscrollBehavior: "contain" }}>
        <p className="text-[14px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
          {ta.importPreview(members.length)}{voices ? ` · ${t.recvVoices(voices)}` : ""}
        </p>
        {voices > 0 && <p className="mt-0.5 text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{t.recvHint}</p>}
        <div className="mt-3 grid gap-x-1 gap-y-3 rounded-[22px] p-3" style={{ gridTemplateColumns: `repeat(${small ? 4 : 3}, minmax(0, 1fr))`, background: "rgba(255,255,255,0.08)" }}>
          {members.map((m, i) => (
            <div key={m.name} className="flex min-w-0 flex-col items-center">
              <div className="grid place-items-end" style={{ height: small ? 70 : 92 }}>
                <TalkingBlob look={m.look} size={small ? 56 : 76} speakKey={`r:${i}`} badge={!!m.voice} mood={m.me ? "laughing" : "happy"}
                  onTap={m.voice ? () => void hear(m, i) : undefined} label={t.playAria(m.name)} />
              </div>
              <span className="mt-1 w-full truncate text-center text-[14px] font-bold">{m.name}</span>
            </div>
          ))}
        </div>
        {note && <p className="mt-3 text-center text-[14px] font-bold" style={{ color: "#FFD9A0" }} role="status">{note}</p>}
      </div>

      <div className="mx-auto grid w-full max-w-lg shrink-0 grid-cols-2 gap-3 px-4 pt-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}>
        <button type="button" onClick={add} disabled={busy} className="col-span-2 min-h-[58px] rounded-full text-[19px] disabled:opacity-60" style={{ ...avSticker("#3DDC97", 5), color: AV_INK, ...AV_DISPLAY }}>{t.recvAdd}</button>
        <button type="button" onClick={replace} disabled={busy} className="min-h-[50px] rounded-full px-2 text-[15px] leading-tight disabled:opacity-60" style={{ ...avSticker("#fff", 4), color: AV_INK, ...AV_DISPLAY }}>{t.recvReplace}</button>
        <button type="button" onClick={onClose} className="min-h-[50px] rounded-full px-2 text-[15px] font-bold" style={{ border: "2.5px solid rgba(255,255,255,0.5)", color: "#fff" }}>{t.recvCancel}</button>
      </div>
    </AvatarLayer>
  );
}
