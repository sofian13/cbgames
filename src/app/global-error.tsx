"use client";

import { useEffect, useState } from "react";

// Boundary racine : attrape les crashs (souvent un service worker / cache périmé
// après un déploiement → un chunk JS manquant fait planter l'app).
// On tente une AUTO-RÉPARATION une seule fois : purge du SW + des caches, reload.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [healing, setHealing] = useState(true);

  async function purgeAndReload() {
    try {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* on recharge quand même */
    }
    // Reload "dur" : on repart du réseau, plus du cache périmé.
    window.location.reload();
  }

  useEffect(() => {
    const KEY = "af-self-heal";
    const canHeal =
      typeof window !== "undefined" &&
      !sessionStorage.getItem(KEY) &&
      navigator.onLine; // hors-ligne : on ne purge PAS (on garderait le cache local utile)
    // Une seule tentative auto par session pour éviter toute boucle de reload.
    if (canHeal) {
      sessionStorage.setItem(KEY, "1");
      purgeAndReload();
    } else {
      setHealing(false);
    }
  }, []);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          textAlign: "center",
          background:
            "radial-gradient(circle at 50% 12%, rgba(255,62,165,0.22), transparent 44%), linear-gradient(180deg, #0a0420 0%, #0e0828 100%)",
          color: "#fff",
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              margin: "0 auto 18px",
              display: "grid",
              placeItems: "center",
              fontSize: 34,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            {healing ? "🔧" : "😵"}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 10px" }}>
            {healing ? "Mise à jour…" : "Petit souci"}
          </h1>
          <p style={{ opacity: 0.7, lineHeight: 1.5, margin: "0 0 22px" }}>
            {healing
              ? "On nettoie le cache et on recharge, une seconde…"
              : "Une version en cache faisait planter l'app. Appuie pour vider le cache et repartir à neuf."}
          </p>
          {!healing && (
            <button
              onClick={() => {
                sessionStorage.removeItem("af-self-heal");
                purgeAndReload();
              }}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "14px 28px",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                background: "linear-gradient(120deg, #ff3ea5, #a06bff)",
              }}
            >
              Vider le cache & recharger
            </button>
          )}
          {!healing && (
            <button
              onClick={() => reset()}
              style={{
                display: "block",
                margin: "14px auto 0",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Réessayer sans vider
            </button>
          )}
        </div>
      </body>
    </html>
  );
}
