// Préchauffage du cache hors-ligne : on précharge (donc on met en cache via le
// service worker) les bundles des jeux jouables sur un seul téléphone.
// Doit être lancé EN LIGNE — idéalement depuis l'app installée elle-même (sur
// iOS, le cache de la PWA installée est séparé de celui de Safari).

const READY_KEY = "af-offline-ready";
let warmPromise: Promise<void> | null = null;

export function isOfflineReady(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(READY_KEY) === "1";
  } catch {
    return false;
  }
}

// Charge tous les bundles des jeux offline (→ mis en cache par le SW).
export function warmOfflineGames(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (warmPromise) return warmPromise;
  if (!navigator.onLine) return Promise.resolve();

  warmPromise = Promise.allSettled([
    import("@/components/local/local-play"),
    import("@/components/games/tu-prefere/tu-prefere-game"),
    import("@/components/games/le-bluffeur/le-bluffeur-game"),
    import("@/components/games/top-ten/top-ten-game"),
    import("@/components/games/longueur-onde/longueur-onde-game"),
    import("@/components/games/pensez-pareil/pensez-pareil-game"),
    import("@/components/games/couple-quiz/couple-quiz-game"),
    import("@/components/games/guess-word/guess-word-game"),
    import("@/components/games/make-guess/make-guess-game"),
    import("@/components/games/category-chrono/category-chrono-game"),
    import("@/components/games/tgv/tgv-game"),
    import("@/components/games/picolette/picolette-game"),
    import("@/components/games/undercover/undercover-game"),
  ]).then(() => {
    try {
      localStorage.setItem(READY_KEY, "1");
    } catch {
      /* stockage indispo : tant pis pour le flag */
    }
  });

  return warmPromise;
}
