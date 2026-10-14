/**
 * Orientation de l'écran (app Zinzin).
 * L'app est verrouillée en portrait ; seul « Deviner le Mot » passe en paysage
 * le temps de la manche (tél sur le front).
 * - App native : plugin @capacitor/screen-orientation (Info.plist autorise portrait + paysage) ;
 * - Web : screen.orientation.lock si le navigateur le permet (souvent seulement en plein écran), sinon rien.
 */

export type LockKind = "portrait" | "landscape";

function isNative(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/** Verrouille l'écran ; ne lève jamais d'erreur (orientation = confort, pas bloquant). */
export async function lockOrientation(kind: LockKind): Promise<void> {
  if (typeof window === "undefined") return;
  if (isNative()) {
    try {
      const { ScreenOrientation } = await import("@capacitor/screen-orientation");
      await ScreenOrientation.lock({ orientation: kind });
      return;
    } catch {
      /* plugin indisponible : on tente l'API web */
    }
  }
  try {
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    await so?.lock?.(kind);
  } catch {
    /* non supporté (desktop, Safari hors plein écran…) */
  }
}

/** Paysage tant que `on` est vrai ; retour au portrait ensuite et au démontage. */
export function landscapeWhile(on: boolean): () => void {
  if (!on) return () => {};
  void lockOrientation("landscape");
  return () => void lockOrientation("portrait");
}
