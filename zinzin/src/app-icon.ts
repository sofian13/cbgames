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
  /** Batterie (même plugin natif, voir AppIconPlugin.swift) : level 0…1 (-1 inconnu) */
  getBattery(): Promise<{ level: number; charging: boolean; known: boolean }>;
}

type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string };
const cap = () => (globalThis as { Capacitor?: Cap }).Capacitor;
const isIos = () => Boolean(cap()?.isNativePlatform?.()) && cap()?.getPlatform?.() === "ios";

// Développement : localStorage « zz-dev-icons » = 1 simule la fonction dans le navigateur (tests visuels)
const devMock = () => {
  try { return import.meta.env.DEV && localStorage.getItem("zz-dev-icons") === "1"; } catch { return false; }
};
let mockName: string | null = null;

// ⚠️ Un plugin Capacitor est un Proxy qui répond à TOUTES les propriétés, y compris « then » :
// il ne doit JAMAIS être la valeur d'une promesse (ni renvoyé par une fonction async), sinon
// il passe pour une promesse qui ne se résout jamais. On le garde emballé dans { p }.
type Holder = { p: AppIconPlugin } | null;
let plugin: Promise<Holder> | null = null;
function getPlugin(): Promise<Holder> {
  if (!isIos()) return Promise.resolve(null);
  plugin ??= import("@capacitor/core")
    .then(({ registerPlugin }) => ({ p: registerPlugin<AppIconPlugin>("ZinzinAppIcon") }))
    .catch(() => null);
  return plugin;
}

/** L'appareil sait-il changer d'icône ? (false sur le web / plugin absent) */
export async function appIconSupported(): Promise<boolean> {
  if (devMock()) return true;
  const h = await getPlugin();
  if (!h) return false;
  try { return (await h.p.isSupported()).value; } catch { return false; }
}

/** L'icône actuelle. */
export async function currentAppIcon(): Promise<AppIconId> {
  let name: string | null = null;
  if (devMock()) name = mockName;
  else {
    const h = await getPlugin();
    try { name = h ? (await h.p.getName()).value : null; } catch { name = null; }
  }
  return APP_ICONS.find((x) => x.native === name)?.id ?? "classic";
}

/** Change l'icône (iOS affiche sa petite alerte de confirmation). */
export async function setAppIcon(id: AppIconId): Promise<boolean> {
  const native = APP_ICONS.find((x) => x.id === id)?.native ?? null;
  if (devMock()) { mockName = native; return true; }
  const h = await getPlugin();
  if (!h) return false;
  try {
    await h.p.setName(native ? { name: native } : {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Batterie du téléphone (secret de l'accueil, TiredBlob.tsx) : niveau 0…1 et en charge, ou null si inconnu.
 * iOS : le plugin natif de l'app (UIDevice) ; web : navigator.getBattery s'il existe ; sinon null.
 */
export async function batteryInfo(): Promise<{ level: number; charging: boolean } | null> {
  if (isIos()) {
    const h = await getPlugin();
    if (!h) return null;
    try {
      const b = await h.p.getBattery();
      return b.known && b.level >= 0 ? { level: b.level, charging: b.charging } : null;
    } catch { return null; }
  }
  const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
  if (typeof nav.getBattery !== "function") return null;
  try {
    const b = await nav.getBattery();
    return { level: b.level, charging: b.charging };
  } catch { return null; }
}
