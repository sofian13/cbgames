"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameMeta } from "@/lib/games/types";

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
          "site-panel-soft site-card-hover relative min-w-0 overflow-hidden rounded-[1.5rem] border p-4 sm:p-5",
          CATEGORY_CLASSES[game.category],
          isSelected
            ? "border-[color:var(--brand)] bg-[rgba(46,124,255,0.08)] shadow-[0_20px_44px_rgba(0,0,0,0.35),0_0_0_2px_rgba(46,124,255,0.32),0_0_34px_rgba(139,92,246,0.18)]"
            : "border-white/8",
          disabled && "opacity-60"
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--brand)]/40 to-transparent" />

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
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                isSelected ? "bg-[rgba(46,124,255,0.12)] border-[color:var(--line-brand)]" : "bg-white/[0.04]"
              )}
            >
              {game.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-white/95">{game.name}</h4>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--brand)] bg-[rgba(46,124,255,0.16)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-light)]">
                    <CheckCircle2 className="h-3 w-3" />
                    Actif
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-5 text-white/56">{game.description}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-white/48">
            <Users className="h-3.5 w-3.5 text-[color:var(--brand-accent)]" />
            <span className="font-mono">{game.minPlayers}-{game.maxPlayers}</span>
            <span className="tracking-[0.14em] uppercase">joueurs</span>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/65 transition hover:border-[color:var(--brand)] hover:bg-[rgba(46,124,255,0.08)] hover:text-white"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Regles
          </button>
        </div>
      </article>

      {showRules && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-4 backdrop-blur-lg sm:items-center"
          onClick={() => setShowRules(false)}
        >
          <div
            className="site-panel w-full max-w-lg rounded-[1.8rem] p-6 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--line-brand)] bg-[rgba(46,124,255,0.08)] text-3xl">
                  {game.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{game.name}</h3>
                  <p className="mt-1 text-sm text-white/50 font-mono">
                    {game.minPlayers}-{game.maxPlayers} joueurs
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="rounded-full border border-white/10 bg-white/[0.05] p-2 text-white/45 transition hover:border-[color:var(--brand)] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {game.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/75"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand)] shadow-[0_0_8px_var(--glow-brand)]" />
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
