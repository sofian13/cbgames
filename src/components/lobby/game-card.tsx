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

const CATEGORY_COLORS: Record<string, string> = {
  words: "from-cyan-400/20 to-cyan-600/5",
  trivia: "from-violet-400/20 to-violet-600/5",
  speed: "from-orange-400/20 to-orange-600/5",
  strategy: "from-emerald-400/20 to-emerald-600/5",
  social: "from-pink-400/20 to-pink-600/5",
  cards: "from-amber-400/20 to-amber-600/5",
  party: "from-fuchsia-400/20 to-fuchsia-600/5",
  sport: "from-green-400/20 to-green-600/5",
};

export function GameCard({ game, isSelected, isHost, onSelect }: GameCardProps) {
  const [showRules, setShowRules] = useState(false);
  const disabled = !game.implemented || !isHost;

  return (
    <>
      <div
        className={cn(
          "press-effect relative cursor-pointer rounded-2xl border p-4 transition-all duration-400",
          CATEGORY_CLASSES[game.category],
          isSelected
            ? "border-cyan-300/60 bg-cyan-300/[0.12] ring-1 ring-cyan-300/40 shadow-[0_0_30px_rgba(80,216,255,0.15)]"
            : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.05]",
          disabled && "opacity-40 cursor-not-allowed !transform-none",
          !disabled && !isSelected && "hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
        )}
        onClick={() => !disabled && onSelect()}
      >
        {/* Subtle gradient overlay on hover */}
        <div className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500",
          CATEGORY_COLORS[game.category] ?? "from-cyan-400/20 to-cyan-600/5",
          !disabled && !isSelected && "group-hover:opacity-100",
          isSelected && "opacity-100"
        )} />

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-cyan-300/50 bg-cyan-300/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-200"
            style={{ animation: "scaleIn 0.3s ease" }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Actif
          </div>
        )}

        <div className="relative z-[1] flex items-start gap-3.5">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-transform duration-300",
            isSelected ? "bg-cyan-300/10 scale-110" : "bg-white/[0.05]",
            !disabled && "group-hover:scale-105"
          )}>
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
                  className="flex items-center gap-1 text-[11px] text-white/25 hover:text-cyan-200/70 transition-colors font-sans press-effect"
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
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={() => setShowRules(false)}
          style={{ animation: "fadeIn 0.2s ease" }}
        >
          <div
            className="relative w-full max-w-md mx-4 rounded-3xl border border-white/[0.12] p-7 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(7,16,35,0.97) 0%, rgba(4,8,20,0.98) 100%)",
              backdropFilter: "blur(24px)",
              animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowRules(false)} className="absolute top-5 right-5 text-white/25 hover:text-white/60 transition-colors press-effect">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3.5 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-3xl">
                {game.icon}
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-white/90">{game.name}</h3>
                <p className="text-[11px] text-white/30 font-sans mt-0.5">{game.minPlayers}-{game.maxPlayers} joueurs</p>
              </div>
            </div>
            <ul className="space-y-3">
              {game.rules.map((rule, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[13px] text-white/55 font-sans leading-relaxed"
                  style={{ animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}
                >
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
