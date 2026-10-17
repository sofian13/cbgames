import { useSyncExternalStore } from "react";
import { notifyPremiumChanged } from "@/lib/entitlements";
import { type Lang, getLang, pick } from "@/lib/i18n";
import { TRIAL, UI } from "./strings";
import { notificationsOn } from "./settings";

/**
 * Abonnement « Zinzin+ » (tout débloquer ; « premium » dans le code).
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

/** Lecture ponctuelle (hors React). */
export function isPremium(): boolean {
  return premium;
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
  /** Essai gratuit (jours) auquel l'utilisateur a droit sur cette formule, sinon absent */
  trialDays?: number;
  /** objet RevenueCat (package) quand dispo */
  pkg?: unknown;
}

/** Prix par défaut (mode test ou avant chargement), au format de la langue. */
const DEFAULT_PRICES: Record<PlanKind, Record<Lang, string>> = {
  weekly: { fr: "2,99 €", en: "€2.99", es: "2,99 €" },
  monthly: { fr: "4,99 €", en: "€4.99", es: "4,99 €" },
  yearly: { fr: "29,99 €", en: "€29.99", es: "29,99 €" },
};

/** Essai simulé en mode test (offre de lancement prévue sur l'annuel). */
const TEST_TRIAL_DAYS = 3;

/**
 * Offres affichées par défaut (mode test ou avant chargement).
 * L'essai n'est simulé qu'en mode test : en vrai, il n'apparaît qu'une fois
 * l'éligibilité confirmée par le store (loadPlans).
 */
export function defaultPlans(lang: Lang = getLang()): Plan[] {
  const t = pick(UI, lang).plans;
  const test = isTestMode();
  return (["weekly", "monthly", "yearly"] as const).map((k) => ({
    id: k, kind: k, title: t[k].title, price: DEFAULT_PRICES[k][lang], period: t[k].period, badge: t[k].badge,
    trialDays: test && k === "yearly" ? TEST_TRIAL_DAYS : undefined,
  }));
}

/** Prix annuel par défaut (si le store n'a pas répondu). */
export const defaultYearlyPrice = (lang: Lang = getLang()) => DEFAULT_PRICES.yearly[lang];

/** Durée (jours) d'une offre de lancement GRATUITE (introPrice RevenueCat), sinon undefined. */
function freeTrialDays(intro: { price: number; periodUnit: string; periodNumberOfUnits: number; cycles: number } | null | undefined): number | undefined {
  if (!intro || intro.price !== 0) return undefined;
  const unit: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };
  const days = (unit[intro.periodUnit] ?? 0) * intro.periodNumberOfUnits * Math.max(1, intro.cycles);
  return days > 0 ? days : undefined;
}

export const isAndroid = () =>
  (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.() === "android";

let configured = false;
/** INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE (RevenueCat) */
const INTRO_ELIGIBLE = 2;

// ⚠️ Un plugin Capacitor est un Proxy « thenable » : ne JAMAIS le renvoyer tel quel d'une fonction
// async (la promesse ne se résoudrait jamais). On le renvoie emballé : const { P } = await rc().
async function rc() {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  if (!configured) {
    await Purchases.configure({ apiKey: apiKey()! });
    configured = true;
  }
  return { P: Purchases };
}

/* Essai gratuit déjà commencé sur ce téléphone (pour le bilan « fin d'essai » du paywall) */
const TRIAL_SEEN_KEY = "zz-trial-seen";
const TRIAL_OVER_SHOWN_KEY = "zz-trial-over-shown";
function markTrialSeen() {
  try { localStorage.setItem(TRIAL_SEEN_KEY, "1"); localStorage.removeItem(TRIAL_OVER_SHOWN_KEY); } catch { /* indispo */ }
}

/** L'essai gratuit est fini sans abonnement (essai commencé ici, plus de Zinzin+). */
export function trialEnded(): boolean {
  try { return !premium && localStorage.getItem(TRIAL_SEEN_KEY) === "1"; } catch { return false; }
}

/** Une seule fois après la fin de l'essai : ouvrir le paywall (avec le bilan) au lancement. */
export function takeTrialOverPopup(): boolean {
  if (!trialEnded()) return false;
  try {
    if (localStorage.getItem(TRIAL_OVER_SHOWN_KEY) === "1") return false;
    localStorage.setItem(TRIAL_OVER_SHOWN_KEY, "1");
  } catch { return false; }
  return true;
}

/** À appeler au démarrage : resynchronise l'état d'abonnement. */
export async function initPremium() {
  if (isTestMode()) return;
  try {
    const { P: Purchases } = await rc();
    const { customerInfo } = await Purchases.getCustomerInfo();
    const ent = customerInfo.entitlements.active[ENTITLEMENT];
    setPremium(Boolean(ent));
    if (ent && String(ent.periodType).toLowerCase() === "trial") markTrialSeen();
    // Essai résilié / terminé : le rappel « l'essai se termine demain » n'a plus lieu d'être
    if (!ent || !ent.willRenew || String(ent.periodType).toLowerCase() !== "trial") void cancelTrialReminder();
  } catch {
    // hors-ligne : on garde le dernier état connu
  }
}

export async function loadPlans(): Promise<Plan[]> {
  const DEFAULT_PLANS = defaultPlans();
  if (isTestMode()) return DEFAULT_PLANS;
  try {
    const { P: Purchases } = await rc();
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    if (!pkgs.length) return DEFAULT_PLANS;
    // Essai : iOS → seulement si l'App Store confirme l'éligibilité (inconnu = pas d'essai affiché) ;
    // Android → Google Play ne renvoie que les offres auxquelles l'utilisateur a droit.
    const withTrial = pkgs.filter((p) => freeTrialDays(p.product.introPrice));
    let eligible = new Set<string>();
    if (withTrial.length) {
      if (isAndroid()) eligible = new Set(withTrial.map((p) => p.product.identifier));
      else {
        try {
          const res = await Purchases.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers: withTrial.map((p) => p.product.identifier) });
          eligible = new Set(Object.keys(res).filter((id) => res[id]?.status === INTRO_ELIGIBLE));
        } catch { /* éligibilité inconnue : pas d'essai affiché */ }
      }
    }
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
        trialDays: eligible.has(p.product.identifier) ? freeTrialDays(p.product.introPrice) : undefined,
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
    if (plan.trialDays) void scheduleTrialReminder(plan);
    return true;
  }
  try {
    const { P: Purchases } = await rc();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: plan.pkg as any });
    const ok = Boolean(customerInfo.entitlements.active[ENTITLEMENT]);
    setPremium(ok);
    if (ok && plan.trialDays) { markTrialSeen(); void scheduleTrialReminder(plan); }
    return ok;
  } catch {
    return false;
  }
}

export async function restore(): Promise<boolean> {
  if (isTestMode()) return premium;
  try {
    const { P: Purchases } = await rc();
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

/* ───────── Rappel de fin d'essai (notification locale) ───────── */
const TRIAL_REMINDER_ID = 5201;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Peut-on promettre « on te prévient » ? Seulement si les notifications sont
 * déjà autorisées (on ne redemande pas la permission depuis le paywall).
 * Web / mode test : suit le réglage « Rappels de soirée ».
 */
export async function trialReminderPossible(): Promise<boolean> {
  if (!isNative()) return notificationsOn();
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return (await LocalNotifications.checkPermissions()).display === "granted";
  } catch {
    return false;
  }
}

/** Programme la notif la veille de la fin de l'essai (J+2 pour 3 jours), si autorisée. */
async function scheduleTrialReminder(plan: Plan) {
  const days = plan.trialDays ?? 0;
  if (days < 2 || !isNative() || !(await trialReminderPossible())) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const t = pick(TRIAL, getLang());
    const price = plan.price || defaultYearlyPrice();
    await LocalNotifications.cancel({ notifications: [{ id: TRIAL_REMINDER_ID }] }).catch(() => {});
    await LocalNotifications.schedule({
      notifications: [{
        id: TRIAL_REMINDER_ID,
        title: t.reminderTitle,
        body: t.reminderBody(price, isAndroid()),
        schedule: { at: new Date(Date.now() + (days - 1) * DAY_MS), allowWhileIdle: true },
      }],
    });
  } catch { /* notifications indisponibles */ }
}

async function cancelTrialReminder() {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: TRIAL_REMINDER_ID }] });
  } catch { /* rien à annuler */ }
}
