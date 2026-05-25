"use client";

import { useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { ModeSelect, type GameMode } from "@/components/games/local-kit";
import UndercoverOnline from "@/components/games/undercover/undercover-online";
import UndercoverLocal from "@/components/games/undercover/undercover-local";

/**
 * Undercover — wrapper qui propose deux modes :
 *  • Local pass-and-play (un seul téléphone, 3-7 joueurs)
 *  • Online multi-appareils (PartyKit)
 *
 * Le pattern suit Le Bluffeur / Top Ten / Longueur d'onde qui utilisent
 * tous le helper ModeSelect de local-kit.tsx.
 */
export default function UndercoverGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);

  if (mode === null) {
    return (
      <ModeSelect
        emoji="🕶️"
        name="Undercover"
        tagline="Un mot secret. Quelqu'un en a un différent. Démasque-le sans te griller."
        onPick={setMode}
      />
    );
  }

  if (mode === "local") {
    return <UndercoverLocal onReturnToLobby={props.onReturnToLobby} />;
  }

  return <UndercoverOnline {...props} />;
}
