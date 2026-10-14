/**
 * Icônes alternatives de l'app (réservées à Zinzin+) : Classique, Or, Nuit, Néon.
 * Natif iOS : mini plugin local « ZinzinAppIcon » (ios/App/App/AppIconPlugin.swift),
 * icônes dans Assets.xcassets (AppIcon-Or…). Ailleurs (web, Android pour l'instant) : non supporté,
 * la rangée des Réglages est masquée.
 */
export type AppIconId = "classic" | "or" | "nuit" | "neon";

export const APP_ICONS: { id: AppIconId; native: string | null; thumb: string }[] = [
  { id: "classic", native: null, thumb: "app-icons/classic.png" },
  { id: "or", native: "AppIcon-Or", thumb: "app-icons/or.png" },
  { id: "nuit", native: "AppIcon-Nuit", thumb: "app-icons/nuit.png" },
  { id: "neon", native: "AppIcon-Neon", thumb: "app-icons/neon.png" },
];

interface AppIconPlugin {
  isSupported(): Promise<{ value: boolean }>;
  getName(): Promise<{ value: string | null }>;
  setName(o: { name?: string }): Promise<void>;
}

type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string };
const cap = () => (globalThis as { Capacitor?: Cap }).Capacitor;
const isIos = () => Boolean(cap()?.isNativePlatform?.()) && cap()?.getPlatform?.() === "ios";

// Développement : localStorage « zz-dev-icons » = 1 simule la fonction dans le navigateur (tests visuels)
const devMock = () => {
  try { return import.meta.env.DEV && localStorage.getItem("zz-dev-icons") === "1"; } catch { return false; }
};
let mockName: string | null = null;

let plugin: Promise<AppIconPlugin | null> | null = null;
function getPlugin(): Promise<AppIconPlugin | null> {
  if (!isIos()) return Promise.resolve(null);
  plugin ??= import("@capacitor/core")
    .then(({ registerPlugin }) => registerPlugin<AppIconPlugin>("ZinzinAppIcon"))
    .catch(() => null);
  return plugin;
}

/** L'appareil sait-il changer d'icône ? (false sur le web / plugin absent) */
export async function appIconSupported(): Promise<boolean> {
  if (devMock()) return true;
  const p = await getPlugin();
  if (!p) return false;
  try { return (await p.isSupported()).value; } catch { return false; }
}

/** L'icône actuelle. */
export async function currentAppIcon(): Promise<AppIconId> {
  let name: string | null = null;
  if (devMock()) name = mockName;
  else {
    const p = await getPlugin();
    try { name = p ? (await p.getName()).value : null; } catch { name = null; }
  }
  return APP_ICONS.find((x) => x.native === name)?.id ?? "classic";
}

/** Change l'icône (iOS affiche sa petite alerte de confirmation). */
export async function setAppIcon(id: AppIconId): Promise<boolean> {
  const native = APP_ICONS.find((x) => x.id === id)?.native ?? null;
  if (devMock()) { mockName = native; return true; }
  const p = await getPlugin();
  if (!p) return false;
  try {
    await p.setName(native ? { name: native } : {});
    return true;
  } catch {
    return false;
  }
}
