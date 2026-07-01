"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { X, Download, Check, Loader2, WifiOff } from "lucide-react";
import { getOrCreateGuest } from "@/lib/guest";
import { getGameById } from "@/lib/games/registry";
import { warmOfflineGames, isOfflineReady } from "@/lib/warm-offline";
import type { GameProps } from "@/lib/games/types";

// Jeux jouables sur UN SEUL téléphone (pass-and-play), sans salle ni WebSocket
// → fonctionnent hors-ligne. Les jeux « party » ouvrent d'abord un choix de mode :
// choisis « Sur ce téléphone » (le mode en ligne, lui, a besoin de réseau).
const OFFLINE_IDS = [
  "tu-prefere",
  "le-bluffeur",
  "top-ten",
  "longueur-onde",
  "pensez-pareil",
  "couple-quiz",
  "guess-word",
  "make-guess",
  "category-chrono",
  "tgv",
  "picolette",
  "undercover",
] as const;

const loading = () => (
  <div className="flex flex-1 items-center justify-center">
    <p className="animate-pulse font-sans text-white/40">Chargement du jeu…</p>
  </div>
);

const LOCAL_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  "tu-prefere": dynamic(() => import("@/components/games/tu-prefere/tu-prefere-game"), { ssr: false, loading }),
  "le-bluffeur": dynamic(() => import("@/components/games/le-bluffeur/le-bluffeur-game"), { ssr: false, loading }),
  "top-ten": dynamic(() => import("@/components/games/top-ten/top-ten-game"), { ssr: false, loading }),
  "longueur-onde": dynamic(() => import("@/components/games/longueur-onde/longueur-onde-game"), { ssr: false, loading }),
  "pensez-pareil": dynamic(() => import("@/components/games/pensez-pareil/pensez-pareil-game"), { ssr: false, loading }),
  "couple-quiz": dynamic(() => import("@/components/games/couple-quiz/couple-quiz-game"), { ssr: false, loading }),
  "guess-word": dynamic(() => import("@/components/games/guess-word/guess-word-game"), { ssr: false, loading }),
  "make-guess": dynamic(() => import("@/components/games/make-guess/make-guess-game"), { ssr: false, loading }),
  "category-chrono": dynamic(() => import("@/components/games/category-chrono/category-chrono-game"), { ssr: false, loading }),
  "tgv": dynamic(() => import("@/components/games/tgv/tgv-game"), { ssr: false, loading }),
  "picolette": dynamic(() => import("@/components/games/picolette/picolette-game"), { ssr: false, loading }),
  "undercover": dynamic(() => import("@/components/games/undercover/undercover-game"), { ssr: false, loading }),
};

export function LocalPlay({ onClose }: { onClose: () => void }) {
  const { id: playerId, name: playerName } = useMemo(() => {
    const guest = getOrCreateGuest();
    return { id: guest.id, name: guest.name };
  }, []);

  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [priming, setPriming] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setReady(isOfflineReady());
    setOnline(navigator.onLine);
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const prime = async () => {
    if (priming || !navigator.onLine) return;
    setPriming(true);
    await warmOfflineGames();
    setReady(isOfflineReady());
    setPriming(false);
  };

  // ── Un jeu est en cours ────────────────────────────────
  if (selected) {
    const GameComponent = LOCAL_COMPONENTS[selected];
    return (
      <div className="fixed inset-0 z-[200] flex flex-col overflow-y-auto" style={{ background: "#0A0420" }}>
        {GameComponent && (
          <GameComponent
            roomCode="LOCAL"
            playerId={playerId}
            playerName={playerName}
            onReturnToLobby={() => setSelected(null)}
          />
        )}
      </div>
    );
  }

  // ── Sélecteur de jeu local ─────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto p-5 text-white" style={{ background: "radial-gradient(circle at 50% 12%, rgba(255,62,165,0.18), transparent 44%), linear-gradient(180deg, #0a0420 0%, #0e0828 100%)" }}>
      <div className="mx-auto w-full max-w-2xl pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]">
        <div className="mb-1 flex items-center justify-between">
          <span className="af-chip" style={{ background: "rgba(61,220,151,0.18)", borderColor: "rgba(61,220,151,0.3)", color: "var(--af-mint)", fontFamily: "var(--font-display)", fontWeight: 800 }}>
            Mode local · hors-ligne
          </span>
          <button onClick={onClose} aria-label="Fermer" className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <h1 className="cb-display-lg mt-2" style={{ letterSpacing: -1, lineHeight: 1 }}>Jouer sur ce téléphone</h1>
        <p className="mt-2 max-w-md text-sm" style={{ color: "var(--text-dim)" }}>
          Pas besoin d&apos;internet ni de code : passez-vous le tél entre potes. Idéal quand il n&apos;y a pas de réseau.
        </p>

        {/* Statut hors-ligne : télécharger les jeux tant qu'on a du réseau */}
        {ready ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm"
               style={{ background: "rgba(61,220,151,0.1)", borderColor: "rgba(61,220,151,0.35)", color: "#fff" }}>
            <Check className="h-4 w-4 shrink-0" style={{ color: "var(--af-mint)" }} />
            <span>Jeux téléchargés — jouables même sans réseau.</span>
          </div>
        ) : online ? (
          <button onClick={prime} disabled={priming}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-70"
                  style={{ background: "linear-gradient(120deg, var(--cb-brand), var(--af-pink))" }}>
            {priming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {priming ? "Téléchargement des jeux…" : "Télécharger les jeux pour le hors-ligne"}
          </button>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm"
               style={{ background: "rgba(255,210,63,0.1)", borderColor: "rgba(255,210,63,0.35)", color: "var(--text-dim)" }}>
            <WifiOff className="h-4 w-4 shrink-0" style={{ color: "var(--af-yellow)" }} />
            <span>Reconnecte-toi une fois, puis appuie sur « Télécharger » pour jouer ensuite sans réseau.</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {OFFLINE_IDS.map((id) => {
            const g = getGameById(id);
            if (!g) return null;
            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className="flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition active:scale-[0.98]"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--line-soft)" }}
              >
                <span className="text-3xl">{g.icon}</span>
                <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>{g.name}</span>
                <span className="line-clamp-2 text-[11px]" style={{ color: "var(--text-dim)" }}>{g.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
