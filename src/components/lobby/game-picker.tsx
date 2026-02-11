"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {isHost ? "Choisis un jeu" : "En attente du choix du host..."}
        </h3>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className={cn("text-xs", activeCategory === cat.id && "font-semibold")}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Game grid */}
      <div className="grid gap-3 sm:grid-cols-2">
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
