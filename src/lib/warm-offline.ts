// Préchauffage du cache hors-ligne : quand on est EN LIGNE, on précharge en
// tâche de fond (idle) les bundles des jeux jouables sur un seul téléphone.
// Le service worker (cacheFirst sur /_next/static) les met alors en cache, si
// bien qu'ils restent jouables plus tard sans réseau.

let warmed = false;

export function warmOfflineGames() {
  if (warmed || typeof window === "undefined") return;
  if (!navigator.onLine) return;
  warmed = true;

  const load = () => {
    // allSettled : un échec ne bloque pas les autres
    Promise.allSettled([
      import("@/components/local/local-play"),
      import("@/components/games/tu-prefere/tu-prefere-game"),
      import("@/components/games/guess-word/guess-word-game"),
      import("@/components/games/category-chrono/category-chrono-game"),
      import("@/components/games/make-guess/make-guess-game"),
      import("@/components/games/tgv/tgv-game"),
      import("@/components/games/picolette/picolette-game"),
      import("@/components/games/undercover/undercover-game"),
      import("@/components/games/couple-quiz/couple-quiz-game"),
      import("@/components/games/battleship/battleship-game"),
      import("@/components/games/chess/chess-game"),
    ]).catch(() => {});
  };

  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(load, { timeout: 5000 });
  } else {
    window.setTimeout(load, 2500);
  }
}
