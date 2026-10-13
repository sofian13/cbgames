import { useSyncExternalStore } from "react";
import { notifyPremiumChanged } from "@/lib/entitlements";

/**
 * Abonnement « Zinzin Premium » (tout débloquer).
 * Achats via RevenueCat (App Store / Play Store). Tant que la clé n'est pas
 * configurée (VITE_RC_IOS_KEY / VITE_RC_ANDROID_KEY), on est en mode test :
 * le bouton d'achat débloque localement, pour pouvoir tester l'app.
 */

const KEY = "zz-premium";
const ENTITLEMENT = "premium";

let premium = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
const listeners = new Set<() => void>();

function setPremium(v: boolean) {
  premium = v;
  localStorage.setItem(KEY, v ? "1" : "0");
  listeners.forEach((l) => l());
  notifyPremiumChanged(); // les jeux (src/) se mettent à jour
}

export function usePremium(): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => premium,
    () => false,
  );
}

function isNative(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

function apiKey(): string | undefined {
  const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const platform = cap?.getPlatform?.();
  return platform === "android" ? import.meta.env.VITE_RC_ANDROID_KEY : import.meta.env.VITE_RC_IOS_KEY;
}

export const isTestMode = () => !isNative() || !apiKey();

export interface Plan {
  id: string;
  title: string;
  price: string;
  period: string;
  badge?: string;
  /** objet RevenueCat (package) quand dispo */
  pkg?: unknown;
}

/** Offres affichées par défaut (mode test ou avant chargement). */
export const DEFAULT_PLANS: Plan[] = [
  { id: "weekly", title: "Pass soirée", price: "1,99 €", period: "7 jours" },
  { id: "monthly", title: "Mensuel", price: "2,99 €", period: "par mois", badge: "Le + choisi" },
  { id: "yearly", title: "Annuel", price: "14,99 €", period: "par an", badge: "-58 %" },
];

let configured = false;

async function rc() {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  if (!configured) {
    await Purchases.configure({ apiKey: apiKey()! });
    configured = true;
  }
  return Purchases;
}

/** À appeler au démarrage : resynchronise l'état d'abonnement. */
export async function initPremium() {
  if (isTestMode()) return;
  try {
    const Purchases = await rc();
    const { customerInfo } = await Purchases.getCustomerInfo();
    setPremium(Boolean(customerInfo.entitlements.active[ENTITLEMENT]));
  } catch {
    // hors-ligne : on garde le dernier état connu
  }
}

export async function loadPlans(): Promise<Plan[]> {
  if (isTestMode()) return DEFAULT_PLANS;
  try {
    const Purchases = await rc();
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    if (!pkgs.length) return DEFAULT_PLANS;
    return pkgs.map((p) => {
      const fallback = DEFAULT_PLANS.find((d) => p.identifier.toLowerCase().includes(d.id.slice(0, 4)));
      return {
        id: p.identifier,
        title: fallback?.title ?? p.product.title,
        price: p.product.priceString,
        period: fallback?.period ?? "",
        badge: fallback?.badge,
        pkg: p,
      };
    });
  } catch {
    return DEFAULT_PLANS;
  }
}

export async function buy(plan: Plan): Promise<boolean> {
  if (isTestMode()) {
    setPremium(true);
    return true;
  }
  try {
    const Purchases = await rc();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: plan.pkg as any });
    const ok = Boolean(customerInfo.entitlements.active[ENTITLEMENT]);
    setPremium(ok);
    return ok;
  } catch {
    return false;
  }
}

export async function restore(): Promise<boolean> {
  if (isTestMode()) return premium;
  try {
    const Purchases = await rc();
    const { customerInfo } = await Purchases.restorePurchases();
    const ok = Boolean(customerInfo.entitlements.active[ENTITLEMENT]);
    setPremium(ok);
    return ok;
  } catch {
    return false;
  }
}

/** Mode test uniquement : revenir en gratuit. */
export function resetPremiumForTests() {
  setPremium(false);
}
