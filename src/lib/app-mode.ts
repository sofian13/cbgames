/** Vrai quand le site tourne dans l'app native Zinzin (Capacitor). */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.()) || navigator.userAgent.includes("ZinzinApp");
}

/** Petit retour haptique dans l'app (sans effet sur le web). */
export async function haptic(style: "light" | "medium" | "heavy" = "light") {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {
    // plugin indisponible : on ignore
  }
}
