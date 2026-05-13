"use client";

import { cn } from "@/lib/utils";
import type { GameRanking } from "@/lib/party/message-types";

interface ScoreboardProps {
  rankings: GameRanking[];
}

const RANK_ACCENTS = [
  { color: "#E3B83A", bg: "rgba(227,184,58,0.12)" }, // gold
  { color: "#B8B8B8", bg: "rgba(184,184,184,0.10)" }, // silver
  { color: "#C28F50", bg: "rgba(194,143,80,0.10)" },  // bronze
];

const RANK_LABELS = ["1er", "2e", "3e"];

export function Scoreboard({ rankings }: ScoreboardProps) {
  return (
    <div className="space-y-1.5">
      {rankings.map((r, i) => {
        const accent = i < 3 ? RANK_ACCENTS[i] : null;
        return (
          <div
            key={r.playerId}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3"
            )}
            style={{
              background: accent ? accent.bg : "rgba(255,255,255,0.04)",
              borderColor: accent ? accent.color + "40" : "rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black"
              style={{
                background: accent ? accent.bg : "rgba(255,255,255,0.05)",
                color: accent ? accent.color : "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-display)",
              }}
            >
              {i < 3 ? RANK_LABELS[i] : `#${r.rank}`}
            </div>
            <span
              className="flex-1 text-sm font-bold"
              style={{
                color: "rgba(255,255,255,0.92)",
                fontFamily: "var(--font-display)",
              }}
            >
              {r.playerName}
            </span>
            <span
              className="cb-mono text-sm font-bold"
              style={{ color: accent ? accent.color : "rgba(255,255,255,0.55)" }}
            >
              {r.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
