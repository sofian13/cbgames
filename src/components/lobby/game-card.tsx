"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameMeta } from "@/lib/games/types";
import { Mascot, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";

interface GameCardProps {
  game: GameMeta;
  isSelected: boolean;
  isHost: boolean;
  onSelect: () => void;
}

const CAT_MASCOT: Record<string, MascotColor> = {
  words: "sky", trivia: "yellow", speed: "coral", strategy: "mint",
  social: "pink", cards: "purple", party: "lavender", sport: "sky",
};

export function GameCard({ game, isSelected, isHost, onSelect }: GameCardProps) {
  const [showRules, setShowRules] = useState(false);
  const disabled = !game.implemented || !isHost;
  const mascotColor: MascotColor = CAT_MASCOT[game.category] ?? "purple";
  const body = MASCOT_PALETTE[mascotColor].body;
  const catColor = body;

  return (
    <>
      <article
        className={cn(
          "site-card-hover relative overflow-hidden rounded-2xl border p-4 transition",
          disabled && "opacity-60"
        )}
        style={{
          background: isSelected
            ? `linear-gradient(150deg, ${body}45, rgba(255,255,255,0.05))`
            : `linear-gradient(155deg, ${body}1A, rgba(255,255,255,0.04))`,
          borderColor: isSelected ? body : `${body}33`,
          boxShadow: isSelected ? `0 10px 28px ${body}40` : undefined,
          minHeight: 150,
        }}
      >
        {/* Mascotte de catégorie en coin */}
        <div className="pointer-events-none absolute -bottom-3 -right-2" style={{ opacity: 0.5 }}>
          <Mascot size={70} color={mascotColor} mood={isSelected ? "happy" : "neutral"} bob={isSelected} />
        </div>

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
          <div className="flex items-start justify-between">
            <span className="text-3xl leading-none">{game.icon}</span>
            {isSelected && (
              <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                    style={{ background: body }}>
                <CheckCircle2 className="h-2.5 w-2.5" />
                Actif
              </span>
            )}
          </div>

          <div className="relative mt-7 max-w-[78%]">
            <h4 className="cb-display-sm" style={{ fontSize: "1rem", color: isSelected ? "#fff" : body }}>
              {game.name}
            </h4>
            <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: "var(--text-dim)" }}>
              {game.description}
            </p>
          </div>
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" style={{ color: body }} />
            <span className="cb-mono" style={{ color: "var(--text-dim)" }}>
              {game.minPlayers}-{game.maxPlayers}
            </span>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition"
            style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}
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
