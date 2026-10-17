import { migrate, type ClickerState } from "./clicker-engine";

/**
 * Sauvegarde de « Tapote le blob », en double sur le téléphone :
 * - stockage local de l'app (instantané, comme le reste : persos, stats…) ;
 * - fichier natif dans les données de l'app (Capacitor Filesystem, dossier Data) : survit même si
 *   iOS vide un jour le stockage web. Au chargement, la copie la plus récente gagne.
 * Rien ne quitte le téléphone (supprimer l'app efface la partie).
 */

const KEY = "zz-clicker-v1";
const FILE = "zinzin-clicker.json";

const isNative = () => Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

export function loadLocal(): ClickerState {
  try { return migrate(JSON.parse(localStorage.getItem(KEY) ?? "null")); } catch { return migrate(null); }
}

/** Copie native (si plus récente que la locale) : à appeler une fois à l'ouverture. */
export async function loadBest(): Promise<ClickerState> {
  const local = loadLocal();
  if (!isNative()) return local;
  try {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const r = await Filesystem.readFile({ path: FILE, directory: Directory.Data, encoding: Encoding.UTF8 });
    const file = migrate(JSON.parse(String(r.data)));
    return file.savedAt > local.savedAt ? file : local;
  } catch {
    return local;
  }
}

export function saveLocal(s: ClickerState): ClickerState {
  const out = { ...s, last: Date.now(), savedAt: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* plein / indispo */ }
  return out;
}

let writing = false;
/** Écrit aussi le fichier natif (pas plus d'une écriture à la fois). */
export async function saveBoth(s: ClickerState): Promise<void> {
  const out = saveLocal(s);
  if (!isNative() || writing) return;
  writing = true;
  try {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    await Filesystem.writeFile({ path: FILE, directory: Directory.Data, encoding: Encoding.UTF8, data: JSON.stringify(out) });
  } catch { /* la copie locale suffit */ } finally {
    writing = false;
  }
}
