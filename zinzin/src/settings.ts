import { useSyncExternalStore } from "react";

/**
 * Réglages de l'app : langue, rappels de soirée, évaluer, partager.
 * Tout est local (pas de serveur) : les rappels sont des notifications locales.
 */

const SHARE_URL = "https://zinzin-app.com";

/* ───────── Langue ───────── */
export type Lang = "fr" | "en" | "es";
export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "es", label: "Español", flag: "🇪🇸" },
];
const LANG_KEY = "zz-lang";
const listeners = new Set<() => void>();

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "fr" || saved === "en" || saved === "es") return saved;
  } catch { /* indispo */ }
  const nav = navigator.language?.toLowerCase() ?? "";
  return nav.startsWith("fr") ? "fr" : nav.startsWith("es") ? "es" : "en";
}
let lang: Lang = typeof window !== "undefined" ? initialLang() : "fr";

export function useLang(): Lang {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => lang, () => "fr");
}
export function setLang(v: Lang) {
  lang = v;
  try { localStorage.setItem(LANG_KEY, v); } catch { /* indispo */ }
  document.documentElement.lang = v;
  listeners.forEach((l) => l());
}

/* ───────── Rappels de soirée (notifications locales) ───────── */
const NOTIF_KEY = "zz-notif";
const REMINDER_IDS = [5101, 5102];

export function notificationsOn(): boolean {
  try { return localStorage.getItem(NOTIF_KEY) === "1"; } catch { return false; }
}

const isNative = () =>
  Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

/** Active/désactive les rappels du vendredi et du samedi soir. Renvoie l'état final. */
export async function setNotifications(on: boolean): Promise<boolean> {
  if (!isNative()) {
    try { localStorage.setItem(NOTIF_KEY, on ? "1" : "0"); } catch { /* indispo */ }
    return on;
  }
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: REMINDER_IDS.map((id) => ({ id })) }).catch(() => {});
  if (on) {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") {
      localStorage.setItem(NOTIF_KEY, "0");
      return false;
    }
    const T = {
      fr: ["C'est vendredi 🎉", "Soirée ce soir ? Lance un Zinzin avec ta bande.", "Samedi soir 🥳", "La Patate t'attend. Qui la tiendra au BOUM ?"],
      en: ["It's Friday 🎉", "Party tonight? Start a round of Zinzin with your crew.", "Saturday night 🥳", "The Potato is waiting. Who'll hold it at BOOM?"],
      es: ["¡Es viernes! 🎉", "¿Fiesta esta noche? Lanza un Zinzin con tu grupo.", "Sábado noche 🥳", "La Patata te espera. ¿Quién la tendrá en el BUM?"],
    }[lang];
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_IDS[0],
          title: T[0],
          body: T[1],
          schedule: { on: { weekday: 6, hour: 19, minute: 0 }, allowWhileIdle: true },
        },
        {
          id: REMINDER_IDS[1],
          title: T[2],
          body: T[3],
          schedule: { on: { weekday: 7, hour: 20, minute: 0 }, allowWhileIdle: true },
        },
      ],
    });
  }
  localStorage.setItem(NOTIF_KEY, on ? "1" : "0");
  return on;
}

/* ───────── Évaluer / partager ───────── */
export async function rateApp() {
  if (isNative()) {
    try {
      const { InAppReview } = await import("@capacitor-community/in-app-review");
      await InAppReview.requestReview();
      return;
    } catch { /* plugin indispo */ }
  }
  window.open(SHARE_URL, "_blank");
}

export async function shareApp(): Promise<boolean> {
  const text = {
    fr: "Zinzin : les jeux de soirée sur un seul téléphone (L'Intrus, La Patate, Test de pureté…). Télécharge-le :",
    en: "Zinzin: party games on a single phone. Get it here:",
    es: "Zinzin: juegos de fiesta en un solo móvil. Descárgalo aquí:",
  }[lang];
  const data = { title: "Zinzin", text, url: SHARE_URL };
  try {
    if (isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ ...data, dialogTitle: { fr: "Partager Zinzin", en: "Share Zinzin", es: "Compartir Zinzin" }[lang] });
      return true;
    }
    if (navigator.share) { await navigator.share(data); return true; }
    await navigator.clipboard?.writeText(`${data.text} ${data.url}`);
    return true;
  } catch {
    return false; // partage annulé
  }
}
