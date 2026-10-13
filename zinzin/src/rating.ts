import { GAME_FINISHED_EVENT, type GameFinishedDetail } from "@/lib/game-finished";
import { getPartyMood } from "@/lib/party-mood";

/**
 * Demande de note automatique, rare et au bon moment :
 * - seulement juste après la FIN d'une partie (ou d'une Soirée Zinzin complète),
 *   jamais en plein jeu : ~1,5 s après l'arrivée sur l'écran de fin ;
 * - pas avant la 3e partie terminée ;
 * - ensuite, de nouveau dès que 2 jours sont passés OU 5 parties ont été terminées depuis la dernière demande
 *   (iOS décide seul de l'afficher : 3 fois max par an, il ignore les demandes en trop) ;
 * - jamais si le joueur a déjà touché « Noter l'app » dans les Réglages.
 * iOS (SKStoreReviewController) plafonne de toute façon à 3 affichages par an.
 * Pendant une Soirée, les fins de jeux comptent mais on attend la fin de la soirée.
 */

const KEY = "zz-rating";
const DAY = 86_400_000;
export const RATING_RULES = { minGames: 3, gapDays: 2, gapGames: 5, delayMs: 1500 } as const;

export interface RatingState {
  /** 1re ouverture de l'app (ms) */
  firstOpen: number;
  /** Parties terminées */
  finished: number;
  /** Nombre de demandes déjà faites */
  asks: number;
  /** Date de la dernière demande (ms, 0 = jamais) */
  lastAsk: number;
  /** Parties terminées au moment de la dernière demande */
  finishedAtAsk: number;
  /** A touché « Noter l'app » dans les Réglages */
  manual: boolean;
}

export function freshState(now: number): RatingState {
  return { firstOpen: now, finished: 0, asks: 0, lastAsk: 0, finishedAtAsk: 0, manual: false };
}

/** Logique pure (testée) : faut-il demander une note maintenant ? */
export function shouldAsk(s: RatingState, now: number): boolean {
  const R = RATING_RULES;
  if (s.manual) return false;
  if (s.finished < R.minGames) return false;
  if (!s.lastAsk) return true;
  return now - s.lastAsk >= R.gapDays * DAY || s.finished - s.finishedAtAsk >= R.gapGames;
}

function load(): RatingState {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...freshState(now), ...(JSON.parse(raw) as Partial<RatingState>) };
  } catch { /* stockage indisponible ou JSON abîmé */ }
  return freshState(now);
}

function save(s: RatingState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* indispo */ }
}

const isNative = () =>
  Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

/** « Noter l'app » touché dans les Réglages : plus jamais de demande automatique. */
export function markRatedManually() {
  save({ ...load(), manual: true });
}

let installed = false;
let lastEvent = 0;

/** À appeler une fois au démarrage de l'app : mémorise la 1re ouverture et écoute les fins de partie. */
export function initRating() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  save(load()); // fixe firstOpen dès la 1re ouverture

  window.addEventListener(GAME_FINISHED_EVENT, (e) => {
    const now = Date.now();
    // Un même écran de fin peut émettre deux fois (StrictMode, re-montage) : on ignore les doublons
    if (now - lastEvent < 3000) return;
    lastEvent = now;
    const detail = (e as CustomEvent<GameFinishedDetail>).detail ?? {};
    const s = load();
    if (!detail.soiree) s.finished += 1;
    save(s);
    // Jeu terminé au milieu d'une Soirée : on attend la fin de la soirée
    if (!detail.soiree && getPartyMood() !== null) return;
    if (!isNative() || !shouldAsk(s, now)) return;
    window.setTimeout(() => {
      const cur = load();
      if (!shouldAsk(cur, Date.now())) return;
      save({ ...cur, asks: cur.asks + 1, lastAsk: Date.now(), finishedAtAsk: cur.finished });
      import("@capacitor-community/in-app-review")
        .then(({ InAppReview }) => InAppReview.requestReview())
        .catch(() => { /* plugin indispo */ });
    }, RATING_RULES.delayMs);
  });
}
