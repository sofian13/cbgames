import { getLang } from "@/lib/i18n";

/**
 * Réglages de l'app : langue, notifications, évaluer, partager.
 * Tout est local (pas de serveur) : pour l'instant les notifications = rappels de soirée locaux
 * (le push distant « nouveaux jeux / nouveautés » viendra plus tard, même interrupteur).
 */

const SHARE_URL = "https://zinzin-app.com";

/* ───────── Langue (partagée avec les jeux : src/lib/i18n.ts) ───────── */
export { LANGS, setLang, useLang } from "@/lib/i18n";
export type { Lang } from "@/lib/i18n";

/* ───────── Notifications (aujourd'hui : rappels de soirée locaux) ───────── */
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
    }[getLang()];
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

/** Partage l'app ; `custom` remplace le texte par défaut (ex. classement de la Soirée Zinzin). */
export async function shareApp(custom?: string): Promise<boolean> {
  const text = custom ?? {
    fr: "Zinzin : les jeux de soirée sur un seul téléphone (L'Intrus, La Patate, Test de pureté…). Télécharge-le :",
    en: "Zinzin: party games on a single phone. Get it here:",
    es: "Zinzin: juegos de fiesta en un solo móvil. Descárgalo aquí:",
  }[getLang()];
  const data = { title: "Zinzin", text, url: SHARE_URL };
  try {
    if (isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ ...data, dialogTitle: { fr: "Partager Zinzin", en: "Share Zinzin", es: "Compartir Zinzin" }[getLang()] });
      return true;
    }
    if (navigator.share) { await navigator.share(data); return true; }
    await navigator.clipboard?.writeText(`${data.text} ${data.url}`);
    return true;
  } catch {
    return false; // partage annulé
  }
}
