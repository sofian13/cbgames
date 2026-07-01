"use client";

import { useMemo, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { getOrCreateGuest } from "@/lib/guest";
import { getGameById } from "@/lib/games/registry";
import type { GameProps } from "@/lib/games/types";

// Jeux jouables sur UN seul téléphone, sans salle ni WebSocket → fonctionnent hors-ligne.
// (les 6 premiers sont 100% client ; les suivants montrent un choix de mode avant toute connexion.)
const OFFLINE_IDS = [
  "tu-prefere",
  "guess-word",
  "category-chrono",
  "make-guess",
  "tgv",
  "picolette",
  "undercover",
  "couple-quiz",
  "battleship",
  "chess",
] as const;

const loading = () => (
  <div className="flex flex-1 items-center justify-center">
    <p className="animate-pulse font-sans text-white/40">Chargement du jeu…</p>
  </div>
);

const LOCAL_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  "tu-prefere": dynamic(() => import("@/components/games/tu-prefere/tu-prefere-game"), { ssr: false, loading }),
  "guess-word": dynamic(() => import("@/components/games/guess-word/guess-word-game"), { ssr: false, loading }),
  "category-chrono": dynamic(() => import("@/components/games/category-chrono/category-chrono-game"), { ssr: false, loading }),
  "make-guess": dynamic(() => import("@/components/games/make-guess/make-guess-game"), { ssr: false, loading }),
  "tgv": dynamic(() => import("@/components/games/tgv/tgv-game"), { ssr: false, loading }),
  "picolette": dynamic(() => import("@/components/games/picolette/picolette-game"), { ssr: false, loading }),
  "undercover": dynamic(() => import("@/components/games/undercover/undercover-game"), { ssr: false, loading }),
  "couple-quiz": dynamic(() => import("@/components/games/couple-quiz/couple-quiz-game"), { ssr: false, loading }),
  "battleship": dynamic(() => import("@/components/games/battleship/battleship-game"), { ssr: false, loading }),
  "chess": dynamic(() => import("@/components/games/chess/chess-game"), { ssr: false, loading }),
};

export function LocalPlay({ onClose }: { onClose: () => void }) {
  const { id: playerId, name: playerName } = useMemo(() => {
    const guest = getOrCreateGuest();
    return { id: guest.id, name: guest.name };
  }, []);

  const [selected, setSelected] = useState<string | null>(null);

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

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
