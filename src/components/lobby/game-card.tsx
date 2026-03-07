"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameMeta } from "@/lib/games/types";
import { GameCover } from "@/components/shared/game-cover";

interface GameCardProps {
  game: GameMeta;
  isSelected: boolean;
  isHost: boolean;
  onSelect: () => void;
}

const CATEGORY_CLASSES: Record<string, string> = {
  words: "cat-words",
  trivia: "cat-trivia",
  speed: "cat-speed",
  strategy: "cat-strategy",
  social: "cat-social",
  cards: "cat-cards",
  party: "cat-party",
  sport: "cat-sport",
};

export function GameCard({ game, isSelected, isHost, onSelect }: GameCardProps) {
  const [showRules, setShowRules] = useState(false);
  const disabled = !game.implemented || !isHost;

  return (
    <>
      <article
        className={cn(
          "site-card-hover relative min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-800/90 bg-[#d7dfeb] p-2 shadow-[0_12px_0_rgba(15,23,42,0.92)]",
          CATEGORY_CLASSES[game.category],
          isSelected
            ? "ring-4 ring-cyan-300/45"
            : "",
          disabled && "opacity-60"
        )}
      >
        <div
          role={disabled ? undefined : "button"}
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && onSelect()}
          onKeyDown={(event) => {
            if (!disabled && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              onSelect();
            }
          }}
          className={cn("cursor-pointer outline-none", disabled && "cursor-default")}
        >
          <div className="space-y-3">
            <GameCover
              gameId={game.id}
              name={game.name}
              category={game.category}
              className="w-full"
            />

            <div className="rounded-[1.25rem] bg-[#31385b] px-3 py-3 text-white">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-2 text-sm font-black leading-5 tracking-[-0.02em] text-white">
                    {game.name}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs leading-4 text-white/68">
                    {game.description}
                  </p>
                </div>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-900">
                    <CheckCircle2 className="h-3 w-3" />
                    Actif
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-100/80">
                  <Users className="h-3.5 w-3.5 text-cyan-200/80" />
                  {game.minPlayers}-{game.maxPlayers}
                </div>

                <button
                  onClick={() => setShowRules(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-2.5 py-1.5 text-[11px] font-semibold text-white/74 transition hover:border-white/24 hover:text-white"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Regles
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {showRules && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-md sm:items-center"
          onClick={() => setShowRules(false)}
        >
          <div
            className="site-panel w-full max-w-lg rounded-[2rem] p-6 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-3xl">
                  {game.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{game.name}</h3>
                  <p className="mt-1 text-sm text-white/48">
                    {game.minPlayers}-{game.maxPlayers} joueurs
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="rounded-full border border-white/10 bg-white/[0.05] p-2 text-white/42 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {game.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/72"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/70" />
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
