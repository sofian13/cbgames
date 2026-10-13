import { useSyncExternalStore } from "react";
import { isOfflineApp } from "@/lib/offline-app";

/**
 * Accès Zinzin+ (abonnement, « premium » dans le code), lisible par les jeux (qui ne peuvent pas importer zinzin/).
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

/** Vrai abonnement Zinzin+ actif (lecture ponctuelle, hors React). */
export function isUnlockedNow(): boolean {
  return !isOfflineApp() || read();
}

/**
 * Ouvre l'écran d'abonnement Zinzin+ de l'app (écouté par zinzin/src/App.tsx).
 * La promesse se résout à la fermeture du paywall : true = Zinzin+ actif.
 * (Hors app : résolue tout de suite à true, tout est déjà accessible.)
 */
export function requestPaywall(): Promise<boolean> {
  if (!isOfflineApp()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const done = () => { window.removeEventListener(CLOSED, done); resolve(read()); };
    window.addEventListener(CLOSED, done);
    window.dispatchEvent(new Event("zz:paywall"));
  });
}

const CLOSED = "zz:paywall-closed";

/** Appelé par l'app quand le paywall se ferme (achat ou croix). */
export function notifyPaywallClosed() {
  window.dispatchEvent(new Event(CLOSED));
}
