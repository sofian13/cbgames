/**
 * Fichier de bande « .zinzin » : la bande (prénoms + looks, comme le code ZZB1) AVEC les sons.
 * JSON versionné, sans serveur : écrit dans le cache de l'app puis partagé par la feuille de
 * partage du téléphone (WhatsApp, iMessage, AirDrop…), ou téléchargé sur le web.
 *
 *   { "format": "zinzin-band", "v": 1, "from": "Sofian",
 *     "members": [ { "name": "Léa", "look": "0a1b2c3", "me": true,
 *                    "voice": { "mime": "audio/mp4", "dur": 2.1, "gain": 1.3, "data": "<base64>" } } ] }
 *
 * La lecture VALIDE tout strictement (taille, version, types, nombre de persos, sons) et ne lève
 * jamais : un fichier abîmé ou piégé donne une erreur propre, pas un plantage.
 */
import { getLang } from "@/lib/i18n";
import { BAND_MAX, cleanName, packLook, unpackLook, type AvatarLook } from "./look";
import { VOICE_MAX_BYTES, VOICE_MAX_S, baseMime, getVoice, type VoiceClip } from "./voice-store";

export const BAND_FILE_FORMAT = "zinzin-band";
export const BAND_FILE_VERSION = 1;
export const BAND_FILE_EXT = "zinzin";
/** Taille max d'un fichier de bande (16 sons de 96 Ko en base64 ≈ 2,1 Mo). */
export const BAND_FILE_MAX = 2_300_000;

export type BandFileError = "size" | "format" | "version" | "empty" | "read";

export interface ReceivedVoice { mime: string; dur: number; gain: number; data: ArrayBuffer }
export interface ReceivedMember { name: string; look: AvatarLook; me: boolean; voice: ReceivedVoice | null }
export interface ReceivedBand { from: string; members: ReceivedMember[] }
export type BandFileResult = { ok: true; band: ReceivedBand } | { ok: false; error: BandFileError };

/* ───────── base64 ───────── */
const B64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function b64ToBytes(s: string): Uint8Array | null {
  if (s.length % 4 !== 0 || !B64_RE.test(s)) return null;
  try {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Texte UTF-8 → base64 (pour écrire le fichier côté natif). */
export function textToB64(text: string): string {
  return bytesToB64(new TextEncoder().encode(text));
}

/* ───────── Écriture ───────── */
export interface BandFileMember { name: string; look: AvatarLook; me?: boolean; voice?: string | null }

/** Construit le contenu du fichier (les sons sont relus dans IndexedDB). */
export async function buildBandFile(from: string, members: BandFileMember[], withVoices = true): Promise<string> {
  const rows = [];
  for (const m of members.slice(0, BAND_MAX)) {
    const row: Record<string, unknown> = { name: cleanName(m.name), look: packLook(m.look) };
    if (m.me) row.me = true;
    if (withVoices && m.voice) {
      const clip: VoiceClip | null = await getVoice(m.voice);
      if (clip && clip.data.byteLength <= VOICE_MAX_BYTES) {
        row.voice = { mime: clip.mime, dur: clip.dur, gain: clip.gain, data: bytesToB64(new Uint8Array(clip.data)) };
      }
    }
    rows.push(row);
  }
  return JSON.stringify({ format: BAND_FILE_FORMAT, v: BAND_FILE_VERSION, from: cleanName(from), members: rows });
}

/* ───────── Lecture (validation stricte) ───────── */
const LOOK_RE = /^[0-9a-z]{1,12}$/;
const B64_MAX = Math.ceil(VOICE_MAX_BYTES / 3) * 4;

function parseVoice(v: unknown): ReceivedVoice | null | "bad" {
  if (v === undefined || v === null) return null;
  if (typeof v !== "object" || Array.isArray(v)) return "bad";
  const o = v as Record<string, unknown>;
  const mime = baseMime(o.mime);
  const dur = o.dur;
  const gain = o.gain;
  if (!mime || typeof dur !== "number" || !Number.isFinite(dur) || dur <= 0 || dur > VOICE_MAX_S + 0.5) return "bad";
  if (typeof gain !== "number" || !Number.isFinite(gain) || gain < 0.1 || gain > 5) return "bad";
  if (typeof o.data !== "string" || !o.data.length || o.data.length > B64_MAX) return "bad";
  const bytes = b64ToBytes(o.data);
  if (!bytes || !bytes.length || bytes.length > VOICE_MAX_BYTES) return "bad";
  return { mime, dur: Math.min(dur, VOICE_MAX_S), gain, data: bytes.buffer as ArrayBuffer };
}

/** Lit le texte d'un fichier de bande. Ne lève jamais. */
export function parseBandFile(text: unknown): BandFileResult {
  try {
    if (typeof text !== "string") return { ok: false, error: "format" };
    if (text.length > BAND_FILE_MAX) return { ok: false, error: "size" };
    const raw = JSON.parse(text.replace(/^﻿/, "")) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "format" };
    const o = raw as Record<string, unknown>;
    if (o.format !== BAND_FILE_FORMAT) return { ok: false, error: "format" };
    if (typeof o.v !== "number" || !Number.isInteger(o.v) || o.v < 1) return { ok: false, error: "format" };
    if (o.v > BAND_FILE_VERSION) return { ok: false, error: "version" };
    const from = cleanName(o.from);
    if (!from) return { ok: false, error: "format" };
    if (!Array.isArray(o.members) || o.members.length > BAND_MAX) return { ok: false, error: "format" };
    const members: ReceivedMember[] = [];
    const seen = new Set<string>();
    let me = false;
    for (const r of o.members) {
      if (!r || typeof r !== "object" || Array.isArray(r)) return { ok: false, error: "format" };
      const m = r as Record<string, unknown>;
      const name = cleanName(m.name);
      if (!name || typeof m.look !== "string" || !LOOK_RE.test(m.look)) return { ok: false, error: "format" };
      if (m.me !== undefined && typeof m.me !== "boolean") return { ok: false, error: "format" };
      const voice = parseVoice(m.voice);
      if (voice === "bad") return { ok: false, error: "format" };
      const key = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      if (seen.has(key)) continue; // doublon : on garde le premier
      seen.add(key);
      const isMe = m.me === true && !me;
      if (isMe) me = true;
      members.push({ name, look: unpackLook(m.look), me: isMe, voice });
    }
    if (!members.length) return { ok: false, error: "empty" };
    return { ok: true, band: { from, members } };
  } catch {
    return { ok: false, error: "format" };
  }
}

/** Lit un fichier choisi dans le navigateur (input file). */
export async function readBandBlob(file: Blob): Promise<BandFileResult> {
  if (file.size > BAND_FILE_MAX) return { ok: false, error: "size" };
  try {
    return parseBandFile(await file.text());
  } catch {
    return { ok: false, error: "read" };
  }
}

const isNative = () =>
  Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

/** Lit un fichier ouvert dans l'app (iOS : file://…/Documents/Inbox/….zinzin). */
export async function readBandFileUrl(url: string): Promise<BandFileResult> {
  try {
    const { Filesystem } = await import("@capacitor/filesystem");
    try {
      const st = await Filesystem.stat({ path: url });
      if (st.size > BAND_FILE_MAX) return { ok: false, error: "size" };
    } catch { /* stat indisponible : la taille est revérifiée sur le contenu */ }
    const r = await Filesystem.readFile({ path: url });
    let text: string;
    if (typeof r.data === "string") {
      if (r.data.length > Math.ceil(BAND_FILE_MAX / 3) * 4 + 4) return { ok: false, error: "size" };
      const bytes = b64ToBytes(r.data.replace(/\s+/g, ""));
      if (!bytes) return { ok: false, error: "read" };
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } else {
      if (r.data.size > BAND_FILE_MAX) return { ok: false, error: "size" };
      text = await r.data.text();
    }
    // Copie reçue (Documents/Inbox) : on la jette une fois lue
    if (/\/Inbox\//.test(url)) void Filesystem.deleteFile({ path: url }).catch(() => {});
    return parseBandFile(text);
  } catch {
    return { ok: false, error: "read" };
  }
}

export type SendOutcome = "shared" | "saved" | "cancelled" | "error";

/** Nom de fichier sûr : « Bande de Léa.zinzin ». */
export function bandFileName(base: string): string {
  const clean = base.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Zinzin";
  return `${clean}.${BAND_FILE_EXT}`;
}

/**
 * Envoie le fichier : app → cache (@capacitor/filesystem) puis feuille de partage (@capacitor/share) ;
 * web → téléchargement. Aucun envoi automatique : c'est l'utilisateur qui choisit l'appli et le destinataire.
 */
export async function sendBandFile(content: string, name: string, text: string, dialogTitle: string): Promise<SendOutcome> {
  if (content.length > BAND_FILE_MAX) return "error";
  const file = bandFileName(name);
  if (isNative()) {
    try {
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const { uri } = await Filesystem.writeFile({ path: file, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
      try {
        await Share.share({ text, files: [uri], dialogTitle });
        return "shared";
      } catch (e) {
        return /cancel|abort/i.test(String((e as { message?: string })?.message ?? e)) ? "cancelled" : "error";
      }
    } catch {
      return "error";
    }
  }
  try {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "saved";
  } catch {
    return "error";
  }
}

/** Titre de la feuille de partage. */
export function sendDialogTitle(): string {
  return { fr: "Envoyer ma bande", en: "Send my crew", es: "Enviar mi grupo" }[getLang()];
}
