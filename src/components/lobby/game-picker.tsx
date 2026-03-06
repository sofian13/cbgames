"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
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
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    let games = activeCategory === "all"
      ? GAMES
      : GAMES.filter((g) => g.category === activeCategory);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      games = games.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
      );
    }

    return games;
  }, [activeCategory, search]);

  return (
    <div className="space-y-4">
      <h3 className="section-title">
        {isHost ? "Choisis un jeu" : "En attente du choix du host..."}
      </h3>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un jeu..."
          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/20 outline-none font-sans transition-all duration-300 focus:border-cyan-300/40 focus:bg-cyan-300/[0.04] focus:shadow-[0_0_20px_rgba(80,216,255,0.08)]"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
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
      <div className="grid gap-3 sm:grid-cols-2 custom-scroll card-stagger" key={`${activeCategory}-${search}`}>
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isSelected={selectedGameId === game.id}
              isHost={isHost}
              onSelect={() => onSelectGame(game.id)}
            />
          ))
        ) : (
          <div className="col-span-2 flex items-center justify-center py-12">
            <p className="text-sm text-white/25 font-sans">Aucun jeu trouve</p>
          </div>
        )}
      </div>
    </div>
  );
}
