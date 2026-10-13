import { useSyncExternalStore } from "react";
import { notifyPremiumChanged } from "@/lib/entitlements";
import { type Lang, getLang, pick } from "@/lib/i18n";
import { UI } from "./strings";

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

export type PlanKind = "weekly" | "monthly" | "yearly";

export interface Plan {
  id: string;
  /** Formule connue : titre / période / badge traduits à l'affichage */
  kind?: PlanKind;
  title: string;
  price: string;
  period: string;
  badge?: string;
  /** objet RevenueCat (package) quand dispo */
  pkg?: unknown;
}

/** Prix par défaut (mode test ou avant chargement), au format de la langue. */
const DEFAULT_PRICES: Record<PlanKind, Record<Lang, string>> = {
  weekly: { fr: "1,99 €", en: "€1.99", es: "1,99 €" },
  monthly: { fr: "2,99 €", en: "€2.99", es: "2,99 €" },
  yearly: { fr: "14,99 €", en: "€14.99", es: "14,99 €" },
};

/** Offres affichées par défaut (mode test ou avant chargement). */
export function defaultPlans(lang: Lang = getLang()): Plan[] {
  const t = pick(UI, lang).plans;
  return (["weekly", "monthly", "yearly"] as const).map((k) => ({
    id: k, kind: k, title: t[k].title, price: DEFAULT_PRICES[k][lang], period: t[k].period, badge: t[k].badge,
  }));
}

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
  const DEFAULT_PLANS = defaultPlans();
  if (isTestMode()) return DEFAULT_PLANS;
  try {
    const Purchases = await rc();
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    if (!pkgs.length) return DEFAULT_PLANS;
    return pkgs.map((p) => {
      const idf = p.identifier.toLowerCase();
      const fallback = DEFAULT_PLANS.find((d) => idf.includes(d.id.slice(0, 4))) ?? (/annual/.test(idf) ? DEFAULT_PLANS[2] : undefined);
      return {
        id: p.identifier,
        kind: fallback?.kind,
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
