/**
 * Sons des persos (« Ma bande ») : stockés dans IndexedDB (localStorage est trop petit).
 * Une entrée = un enregistrement (clé : identifiant aléatoire du son) ; le lien perso ↔ son
 * est gardé dans les données de la bande (src/lib/saved-players.ts, champ `voices`).
 * Tout reste sur le téléphone. Aucune exception ne remonte : stockage indisponible = pas de son.
 */

export interface VoiceClip {
  id: string;
  /** Type MIME de base (audio/mp4, audio/webm, audio/ogg…) */
  mime: string;
  /** Durée en secondes (≤ VOICE_MAX_S) */
  dur: number;
  /** Gain de normalisation appliqué à la lecture (1 = tel quel) */
  gain: number;
  /** Données audio compressées */
  data: ArrayBuffer;
}

/** Durée max d'un son (s) et taille max d'un enregistrement (octets). */
export const VOICE_MAX_S = 5;
export const VOICE_MAX_BYTES = 96 * 1024;
/** Types acceptés (enregistrés ici ou reçus dans un fichier de bande). */
export const VOICE_MIMES = ["audio/mp4", "audio/aac", "audio/x-m4a", "audio/webm", "audio/ogg", "audio/mpeg", "audio/wav"];

const DB = "zz-voices";
const STORE = "voices";
const ID_RE = /^[a-z0-9]{6,32}$/;

export function isVoiceId(v: unknown): v is string {
  return typeof v === "string" && ID_RE.test(v);
}

export function newVoiceId(): string {
  const a = new Uint8Array(9);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => (b % 36).toString(36)).join("") + Date.now().toString(36).slice(-4);
}

/** Type de base, en minuscules, sans paramètres (« audio/webm;codecs=opus » → « audio/webm »). */
export function baseMime(m: unknown): string | null {
  if (typeof m !== "string") return null;
  const b = m.split(";")[0].trim().toLowerCase();
  return VOICE_MIMES.includes(b) ? b : null;
}

let dbP: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (dbP) return dbP;
  dbP = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") { resolve(null); return; }
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  // Échec : on retentera au prochain appel
  void dbP.then((d) => { if (!d) dbP = null; });
  return dbP;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | null> {
  return open().then((db) => new Promise<T | null>((resolve) => {
    if (!db) { resolve(null); return; }
    try {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      let out: T | null = null;
      if (req) req.onsuccess = () => { out = req.result; };
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    } catch {
      resolve(null);
    }
  }));
}

// Petit cache mémoire : la lecture en jeu ne relit pas IndexedDB à chaque fois
const mem = new Map<string, VoiceClip>();

export async function putVoice(clip: VoiceClip): Promise<boolean> {
  mem.set(clip.id, clip);
  const r = await run("readwrite", (s) => s.put(clip));
  return r !== null;
}

export async function getVoice(id: string): Promise<VoiceClip | null> {
  if (!isVoiceId(id)) return null;
  const m = mem.get(id);
  if (m) return m;
  const v = await run<VoiceClip | undefined>("readonly", (s) => s.get(id) as IDBRequest<VoiceClip | undefined>);
  if (!v || !(v.data instanceof ArrayBuffer)) return null;
  mem.set(id, v);
  return v;
}

export async function deleteVoice(id: string): Promise<void> {
  mem.delete(id);
  await run("readwrite", (s) => s.delete(id));
}

export async function listVoiceIds(): Promise<string[]> {
  const keys = await run<IDBValidKey[]>("readonly", (s) => s.getAllKeys());
  return (keys ?? []).filter(isVoiceId);
}

/** Supprime les sons qui ne sont plus liés à aucun perso. */
export async function gcVoices(keep: string[]): Promise<void> {
  const k = new Set(keep);
  for (const id of await listVoiceIds()) if (!k.has(id)) await deleteVoice(id);
}

/** Efface tous les sons (« Effacer mes données »). */
export async function clearVoices(): Promise<void> {
  mem.clear();
  await run("readwrite", (s) => s.clear());
}
