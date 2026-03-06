"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
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
    let games = activeCategory === "all" ? GAMES : GAMES.filter((g) => g.category === activeCategory);

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      games = games.filter(
        (g) => g.name.toLowerCase().includes(query) || g.description.toLowerCase().includes(query)
      );
    }

    return games;
  }, [activeCategory, search]);

  return (
    <section className="premium-panel mesh-surface rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title">Catalogue</p>
          <h2 className="mt-2 text-3xl font-black text-white">
            {isHost ? "Choisis le prochain jeu" : "Le host choisit le prochain jeu"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/54">
            Filtre par categorie, parcours les cartes et lance la room quand tout le monde est pret.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/58">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#72e4f7]" />
            <span>{filteredGames.length} resultat(s)</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un jeu, un style, une mecanique..."
            className="sunrise-input h-12 w-full rounded-2xl pl-11 pr-4 text-sm text-white/84 outline-none transition focus:border-[#72e4f7]/34 focus:shadow-[0_0_0_1px_rgba(114,228,247,0.22),0_0_26px_rgba(114,228,247,0.12)] placeholder:text-white/24"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300",
                  active
                    ? "border-white/18 bg-white/10 text-white shadow-[0_10px_22px_rgba(0,0,0,0.18)]"
                    : "border-white/8 bg-white/[0.03] text-white/42 hover:border-white/14 hover:bg-white/[0.05] hover:text-white/72"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-2 custom-scroll card-stagger" key={`${activeCategory}-${search}`}>
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
            <div className="xl:col-span-2 rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.03] px-6 py-14 text-center">
              <p className="text-lg font-semibold text-white/78">Aucun jeu ne correspond a la recherche.</p>
              <p className="mt-2 text-sm text-white/42">Change de categorie ou essaie un autre mot-cle.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
