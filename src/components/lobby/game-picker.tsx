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

const CATEGORY_COLOR: Record<string, string> = {
  all:      "var(--foreground)",
  local:    "var(--cb-party)",
  words:    "var(--cb-words)",
  trivia:   "var(--cb-trivia)",
  speed:    "var(--cb-speed)",
  strategy: "var(--cb-strategy)",
  social:   "var(--cb-social)",
  cards:    "var(--cb-cards)",
  party:    "var(--cb-party)",
  sport:    "var(--cb-sport)",
};

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
    <section className="min-w-0">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>la bibliothèque</p>
          <h2 className="cb-display-lg mt-1" style={{ letterSpacing: -1 }}>
            {isHost ? "Choisis un jeu." : "Catalogue."}
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
            {isHost ? "Tap pour sélectionner — tu peux changer à tout moment." : "Le host choisit la prochaine partie."}
          </p>
        </div>
        <span className="af-chip shrink-0" style={{ color: "var(--af-yellow)" }}>
          {filteredGames.length} jeu{filteredGames.length > 1 ? "x" : ""}
        </span>
      </div>

      <div className="mb-4 space-y-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un jeu…"
            className="h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:border-[color:var(--cb-brand)]"
            style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--line-soft)", color: "#fff" }}
          />
        </label>

        <div className="cb-scroll flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => {
            const color = CATEGORY_COLOR[category.id] || "var(--af-pink)";
            const active = activeCategory === category.id;
            const count = category.id === "all"
              ? GAMES.length
              : category.id === "local"
              ? GAMES.filter((g) => g.local).length
              : GAMES.filter((g) => g.category === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition")}
                style={{
                  background: active ? `${color}22` : "rgba(255,255,255,0.04)",
                  color: active ? "#fff" : "var(--text-dim)",
                  borderColor: active ? color : "var(--line-soft)",
                }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                {category.label}
                <span className="cb-mono text-[10px] font-bold" style={{ color: active ? color : "var(--text-muted)" }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3">
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
          <div
            className="col-span-full rounded-xl border bg-[color:var(--surface-2)] px-5 py-10 text-center text-sm"
            style={{ borderColor: "var(--line-soft)", color: "var(--text-dim)" }}
          >
            Aucun jeu ne correspond à la recherche.
          </div>
        )}
      </div>
    </section>
  );
}
