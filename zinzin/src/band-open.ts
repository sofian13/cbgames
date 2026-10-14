import { BAND_FILE_EXT, readBandFileUrl, type BandFileResult } from "@/lib/avatar/band-file";

/**
 * Réception d'une bande : l'utilisateur touche un fichier « .zinzin » (WhatsApp, iMessage,
 * AirDrop, Fichiers…) → iOS ouvre Zinzin avec l'URL du fichier (copié dans Documents/Inbox).
 * - app déjà ouverte : événement « appUrlOpen » (@capacitor/app) ;
 * - app lancée par le fichier : App.getLaunchUrl() au démarrage.
 * Rien n'est lu sans ce geste de l'utilisateur ; aucun réseau.
 */
const isNative = () =>
  Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

function isBandFile(url: string): boolean {
  if (!/^file:/i.test(url)) return false;
  let path = url.split(/[?#]/)[0];
  try { path = decodeURIComponent(path); } catch { /* garde tel quel */ }
  return path.toLowerCase().endsWith(`.${BAND_FILE_EXT}`);
}

export function initBandFileOpen(onFile: (r: BandFileResult) => void): () => void {
  if (!isNative()) return () => {};
  let stopped = false;
  let remove: (() => void) | null = null;
  // L'URL de lancement peut aussi arriver par « appUrlOpen » : on ne la traite qu'une fois
  const seen = new Set<string>();
  const handle = (url: string | undefined) => {
    if (!url || stopped || seen.has(url) || !isBandFile(url)) return;
    seen.add(url);
    void readBandFileUrl(url).then((r) => { if (!stopped) onFile(r); });
  };
  void import("@capacitor/app")
    .then(async ({ App }) => {
      if (stopped) return;
      const h = await App.addListener("appUrlOpen", (e) => handle(e.url));
      if (stopped) { void h.remove(); return; }
      remove = () => void h.remove();
      const launch = await App.getLaunchUrl().catch(() => undefined);
      handle(launch?.url);
    })
    .catch(() => { /* plugin indisponible : pas de réception de fichier */ });
  return () => { stopped = true; remove?.(); };
}
