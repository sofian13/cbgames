"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameMeta } from "@/lib/games/types";
import { GameArt, CB_CAT } from "@/components/lobby/game-art";

interface GameCardProps {
  game: GameMeta;
  isSelected: boolean;
  isHost: boolean;
  onSelect: () => void;
}

export function GameCard({ game, isSelected, isHost, onSelect }: GameCardProps) {
  const [showRules, setShowRules] = useState(false);
  const disabled = !game.implemented || !isHost;
  const cat = CB_CAT[game.category] ?? CB_CAT.party;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onSelect()}
        className={cn(
          "site-card-hover relative block w-full overflow-hidden rounded-[18px] border-0 p-0 text-left outline-none transition active:scale-[0.98]",
          disabled && "opacity-60"
        )}
        style={{
          height: 168,
          cursor: disabled ? "default" : "pointer",
          boxShadow: isSelected
            ? `0 0 0 2.5px ${cat.color}, 0 10px 28px ${cat.color}66`
            : `0 8px 20px rgba(0,0,0,0.30)`,
        }}
      >
        <GameArt game={game} rounded={18} />

        {/* Top: catégorie + Actif/Règles */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-1.5">
          <span className="cb-mono rounded-full px-2 py-0.5 text-[8.5px] font-bold tracking-[0.14em] text-white"
                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
            {cat.label.toUpperCase()}
          </span>
          {isSelected ? (
            <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ background: cat.color }}>
              <CheckCircle2 className="h-2.5 w-2.5" /> Actif
            </span>
          ) : (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setShowRules(true); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setShowRules(true); } }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-white"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
              aria-label="Règles"
            >
              <BookOpen className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Bottom: nom + joueurs */}
        <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-8"
             style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.82) 100%)" }}>
          <div className="cb-display-sm leading-tight text-white" style={{ fontSize: 15, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {game.name}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Users className="h-3 w-3" style={{ color: "rgba(255,255,255,0.75)" }} />
            <span className="cb-mono text-[9px] font-bold tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.75)" }}>
              {game.minPlayers}-{game.maxPlayers} joueurs
            </span>
          </div>
        </div>
      </button>

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
                    style={{ background: cat.color }}
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
