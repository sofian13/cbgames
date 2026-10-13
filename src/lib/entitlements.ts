import { useSyncExternalStore } from "react";
import { isOfflineApp } from "@/lib/offline-app";

/**
 * Accès Premium, lisible par les jeux (qui ne peuvent pas importer zinzin/).
 * Source de vérité : zinzin/src/premium.ts, qui écrit `zz-premium` et émet `zz:premium`.
 * Sur le site (hors app), tout est accessible : les limites ne concernent que l'app.
 */

const KEY = "zz-premium";
const EVENT = "zz:premium";

function read(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

/** true = tout débloqué (abonné, ou on est sur le site web). */
export function useUnlocked(): boolean {
  const premium = useSyncExternalStore(subscribe, read, () => false);
  return !isOfflineApp() || premium;
}

/** Appelé par zinzin/src/premium.ts quand l'abonnement change. */
export function notifyPremiumChanged() {
  window.dispatchEvent(new Event(EVENT));
}

/** Ouvre l'écran d'abonnement de l'app (écouté par zinzin/src/App.tsx). */
export function requestPaywall() {
  window.dispatchEvent(new Event("zz:paywall"));
}
