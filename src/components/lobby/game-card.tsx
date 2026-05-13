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

const CATEGORY_COLOR: Record<string, string> = {
  words:    "var(--cb-words)",
  trivia:   "var(--cb-trivia)",
  speed:    "var(--cb-speed)",
  strategy: "var(--cb-strategy)",
  social:   "var(--cb-social)",
  cards:    "var(--cb-cards)",
  party:    "var(--cb-party)",
  sport:    "var(--cb-sport)",
};

export function GameCard({ game, isSelected, isHost, onSelect }: GameCardProps) {
  const [showRules, setShowRules] = useState(false);
  const disabled = !game.implemented || !isHost;
  const catColor = CATEGORY_COLOR[game.category] || "var(--text-dim)";

  return (
    <>
      <article
        className={cn(
          "site-card-hover relative overflow-hidden rounded-2xl border p-4 transition",
          disabled && "opacity-60"
        )}
        style={{
          background: isSelected ? "var(--primary)" : "var(--surface)",
          color: isSelected ? "var(--primary-foreground)" : "var(--foreground)",
          borderColor: isSelected ? "transparent" : "var(--line-soft)",
          boxShadow: isSelected
            ? "0 8px 24px rgba(10,10,10,0.18)"
            : undefined,
        }}
      >
        {isSelected && (
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(120% 100% at 100% 0%, ${catColor}, transparent 60%)`,
            }}
          />
        )}
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
          className={cn("relative cursor-pointer outline-none", disabled && "cursor-default")}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{
                background: isSelected
                  ? "rgba(255,255,255,0.08)"
                  : "var(--surface-2)",
                border: "1px solid " + (isSelected ? "rgba(255,255,255,0.1)" : "var(--line-soft)"),
              }}
            >
              {game.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h4
                  className="cb-display-sm"
                  style={{ fontSize: "0.9375rem", fontFamily: "var(--font-display)" }}
                >
                  {game.name}
                </h4>
                {isSelected && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Actif
                  </span>
                )}
              </div>
              <p
                className="mt-1 line-clamp-2 text-xs leading-5"
                style={{
                  color: isSelected ? "rgba(255,255,255,0.7)" : "var(--text-dim)",
                }}
              >
                {game.description}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Users
              className="h-3.5 w-3.5"
              style={{ color: isSelected ? "rgba(255,255,255,0.6)" : catColor }}
            />
            <span
              className="cb-mono"
              style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--text-dim)" }}
            >
              {game.minPlayers}-{game.maxPlayers}
            </span>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition"
            style={{
              background: isSelected ? "rgba(255,255,255,0.12)" : "var(--surface-2)",
              color: isSelected ? "rgba(255,255,255,0.85)" : "var(--text-dim)",
              border: "1px solid " + (isSelected ? "transparent" : "var(--line-soft)"),
            }}
          >
            <BookOpen className="h-3 w-3" />
            Règles
          </button>
        </div>
      </article>

      {showRules && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setShowRules(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border bg-[color:var(--surface)] p-6 shadow-2xl"
            style={{ borderColor: "var(--line-soft)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--line-soft)",
                  }}
                >
                  {game.icon}
                </div>
                <div>
                  <h3 className="cb-display-md">{game.name}</h3>
                  <p className="mt-1 cb-mono text-xs" style={{ color: "var(--text-dim)" }}>
                    {game.minPlayers}–{game.maxPlayers} joueurs · {game.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="rounded-full border p-1.5 transition"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--line-soft)",
                  color: "var(--text-dim)",
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {game.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border px-4 py-2.5 text-sm leading-6"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--line-soft)",
                    color: "var(--foreground)",
                  }}
                >
                  <span
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: catColor }}
                  />
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
