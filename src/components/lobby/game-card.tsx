"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { GameMeta } from "@/lib/games/types";
import { BookOpen, CheckCircle2, X, Users } from "lucide-react";

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
      <div
        className={cn(
          "game-card-hover relative cursor-pointer rounded-2xl border p-4",
          CATEGORY_CLASSES[game.category],
          isSelected
            ? "border-cyan-300/60 bg-cyan-300/[0.12] ring-1 ring-cyan-300/50 shadow-[0_0_40px_rgba(80,216,255,0.25)]"
            : "border-white/[0.08] bg-white/[0.03]",
          disabled && "opacity-40 cursor-not-allowed !transform-none",
          !disabled && !isSelected && "hover:bg-white/[0.05]"
        )}
        onClick={() => !disabled && onSelect()}
      >
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-cyan-300/50 bg-cyan-300/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-200">
            <CheckCircle2 className="h-3 w-3" />
            Actif
          </div>
        )}

        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-2xl">
            {game.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-semibold text-[15px] text-white/90 leading-tight">
              {game.name}
            </h4>
            <p className="text-[12px] text-white/40 mt-1 leading-relaxed line-clamp-2 font-sans">
              {game.description}
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-1 text-[11px] text-white/25 font-sans">
                <Users className="h-3 w-3" />
                {game.minPlayers}-{game.maxPlayers}
              </div>
              {game.rules.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowRules(true); }}
                  className="flex items-center gap-1 text-[11px] text-white/25 hover:text-cyan-200/70 transition-colors font-sans"
                >
                  <BookOpen className="h-3 w-3" />
                  Regles
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rules modal */}
      {showRules && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-md" onClick={() => setShowRules(false)}>
          <div
            className="relative w-full max-w-md mx-4 rounded-2xl border border-white/[0.1] p-6 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(7,16,35,0.97) 0%, rgba(4,8,20,0.98) 100%)",
              backdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-3xl">
                {game.icon}
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-white/90">{game.name}</h3>
                <p className="text-[11px] text-white/30 font-sans">{game.minPlayers}-{game.maxPlayers} joueurs</p>
              </div>
            </div>
            <ul className="space-y-3">
              {game.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-white/55 font-sans leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/50" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
