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

const CATEGORY_LABELS: Record<string, string> = {
  words: "Mots",
  trivia: "Culture",
  speed: "Rapide",
  strategy: "Strategie",
  social: "Bluff",
  cards: "Cartes",
  party: "Party",
  sport: "Sport",
};

export function GameCard({ game, isSelected, isHost, onSelect }: GameCardProps) {
  const [showRules, setShowRules] = useState(false);
  const disabled = !game.implemented || !isHost;

  return (
    <>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "group game-card-hover relative w-full overflow-hidden rounded-[1.75rem] border p-4 text-left",
          CATEGORY_CLASSES[game.category],
          isSelected
            ? "border-white/22 bg-white/[0.08] shadow-[0_22px_44px_rgba(0,0,0,0.3)]"
            : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]",
          disabled && "cursor-not-allowed opacity-45"
        )}
        onClick={() => !disabled && onSelect()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        <div className="absolute inset-0 opacity-80" style={{ background: "linear-gradient(145deg, hsla(var(--cat, 200, 90%, 60%), 0.22), transparent 55%)" }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              {game.icon}
            </div>
            {isSelected ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/88">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#8ff2bb]" />
                Actif
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/42">
                {CATEGORY_LABELS[game.category] ?? game.category}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-black text-white/92">{game.name}</h4>
            <p className="text-sm leading-6 text-white/58">{game.description}</p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 text-xs text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {game.minPlayers}-{game.maxPlayers} joueurs
            </span>
            {game.rules.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-white/60">
                <BookOpen className="h-3.5 w-3.5" />
                Regles
              </span>
            )}
          </div>
        </div>

        {game.rules.length > 0 && (
          <div className="absolute inset-x-4 bottom-4 translate-y-10 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Apercu des regles</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRules(true);
                }}
                className="text-xs font-semibold text-[#ffe2cd] transition hover:text-white"
              >
                Ouvrir
              </button>
            </div>
          </div>
        )}
      </div>

      {showRules && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 p-4 backdrop-blur-md"
          onClick={() => setShowRules(false)}
          style={{ animation: "fadeIn 0.2s ease" }}
        >
          <div
            className="premium-panel mesh-surface relative w-full max-w-lg rounded-[2rem] p-6"
            style={{ animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRules(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/45 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4 pr-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/8 text-4xl">
                {game.icon}
              </div>
              <div>
                <p className="section-title">{CATEGORY_LABELS[game.category] ?? game.category}</p>
                <h3 className="mt-2 text-2xl font-black text-white/94">{game.name}</h3>
                <p className="mt-1 text-sm text-white/46">{game.minPlayers}-{game.maxPlayers} joueurs</p>
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {game.rules.map((rule, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/68"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#72e4f7]" />
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
