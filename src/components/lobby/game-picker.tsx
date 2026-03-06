"use client";

import { useState } from "react";
import { GameCard } from "./game-card";
import { GAMES, CATEGORIES } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

interface GamePickerProps {
  selectedGameId: string | null;
  isHost: boolean;
  onSelectGame: (gameId: string) => void;
}

export function GamePicker({ selectedGameId, isHost, onSelectGame }: GamePickerProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredGames = activeCategory === "all"
    ? GAMES
    : GAMES.filter((g) => g.category === activeCategory);

  return (
    <div className="space-y-4">
      <h3 className="section-title">
        {isHost ? "Choisis un jeu" : "En attente du choix du host..."}
      </h3>

      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-sans font-medium transition-all duration-300",
              activeCategory === cat.id
                ? "bg-cyan-400/15 text-cyan-200 border border-cyan-300/30 shadow-[0_0_15px_rgba(80,216,255,0.1)]"
                : "text-white/35 border border-transparent hover:text-white/55 hover:bg-white/[0.04]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Game grid */}
      <div className="grid gap-3 sm:grid-cols-2 custom-scroll">
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isSelected={selectedGameId === game.id}
            isHost={isHost}
            onSelect={() => onSelectGame(game.id)}
          />
        ))}
      </div>
    </div>
  );
}
