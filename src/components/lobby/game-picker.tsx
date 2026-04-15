"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GameCard } from "./game-card";
import { CATEGORIES, GAMES } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

interface GamePickerProps {
  selectedGameId: string | null;
  isHost: boolean;
  onSelectGame: (gameId: string) => void;
}

export function GamePicker({ selectedGameId, isHost, onSelectGame }: GamePickerProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filteredGames = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const games =
      activeCategory === "all"
        ? GAMES
        : activeCategory === "local"
        ? GAMES.filter((game) => game.local)
        : GAMES.filter((game) => game.category === activeCategory);

    if (!normalizedSearch) return games;

    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(normalizedSearch) ||
        game.description.toLowerCase().includes(normalizedSearch)
    );
  }, [activeCategory, deferredSearch]);

  return (
    <section className="site-panel min-w-0 overflow-hidden rounded-[1.6rem] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="section-title">{isHost ? "Choisis un jeu" : "Catalogue"}</p>
          <p className="mt-1 text-sm text-[color:var(--text-dim)]">
            {isHost ? "Selection rapide du prochain jeu." : "Le host choisit la prochaine partie."}
          </p>
        </div>
        <span className="w-fit rounded-full border border-[color:var(--line-brand)] bg-[rgba(46,124,255,0.08)] px-3 py-1 text-xs font-mono font-semibold text-[color:var(--brand-light)]">
          {filteredGames.length} jeu{filteredGames.length > 1 ? "x" : ""}
        </span>
      </div>

      <div className="mb-4 space-y-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un jeu"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white/90 outline-none transition placeholder:text-white/24 focus:border-[color:var(--brand)] focus:bg-[rgba(46,124,255,0.06)]"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                activeCategory === category.id
                  ? "border-[color:var(--brand)] bg-[rgba(46,124,255,0.14)] text-white shadow-[0_0_0_1px_rgba(46,124,255,0.3),0_8px_24px_rgba(46,124,255,0.18)]"
                  : "border-white/10 bg-white/[0.04] text-white/45 hover:border-[color:var(--line-brand)] hover:text-white/85"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
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
          <div className="site-panel-soft col-span-full rounded-[1.4rem] px-5 py-10 text-center">
            <p className="text-sm text-white/42">Aucun jeu ne correspond a la recherche.</p>
          </div>
        )}
      </div>
    </section>
  );
}
