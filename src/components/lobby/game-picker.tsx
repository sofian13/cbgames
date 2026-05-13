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
    <section
      className="min-w-0 overflow-hidden rounded-2xl border bg-[color:var(--surface)] p-4 sm:p-5"
      style={{ borderColor: "var(--line-soft)" }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="min-w-0">
          <span className="cb-eyebrow">jeux</span>
          <h2 className="cb-display-md mt-1">{isHost ? "Choisis un jeu" : "Catalogue"}</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
            {isHost
              ? "Tap pour sélectionner. Tu peux changer à tout moment."
              : "Le host choisit la prochaine partie."}
          </p>
        </div>
        <span
          className="w-fit rounded-full border px-3 py-1 text-xs cb-mono font-bold"
          style={{ borderColor: "var(--line-soft)", color: "var(--text-dim)" }}
        >
          {filteredGames.length} jeu{filteredGames.length > 1 ? "x" : ""}
        </span>
      </div>

      <div className="mb-4 space-y-3">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un jeu"
            className="h-11 w-full rounded-full border pl-10 pr-4 text-sm outline-none transition focus:ring-2"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--line-soft)",
              color: "var(--foreground)",
            }}
          />
        </label>

        <div className="cb-scroll flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => {
            const color = CATEGORY_COLOR[category.id] || "var(--foreground)";
            const active = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition"
                )}
                style={{
                  background: active ? "var(--primary)" : "var(--surface)",
                  color: active ? "var(--primary-foreground)" : "var(--text-strong)",
                  borderColor: active ? "transparent" : "var(--line-soft)",
                }}
              >
                <span
                  className="inline-block mr-1.5 h-1.5 w-1.5 rounded-full align-middle"
                  style={{ background: color }}
                />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-w-0 gap-2.5 md:grid-cols-2">
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
