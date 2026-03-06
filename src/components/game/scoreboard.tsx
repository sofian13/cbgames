"use client";

import { cn } from "@/lib/utils";
import type { GameRanking } from "@/lib/party/message-types";

interface ScoreboardProps {
  rankings: GameRanking[];
}

const RANK_STYLES = [
  "border-amber-400/30 bg-gradient-to-r from-amber-400/[0.08] to-yellow-400/[0.04] shadow-[0_0_30px_rgba(245,180,50,0.12)]",
  "border-slate-300/20 bg-gradient-to-r from-slate-300/[0.06] to-slate-400/[0.03]",
  "border-orange-400/20 bg-gradient-to-r from-orange-400/[0.06] to-orange-500/[0.03]",
];

const RANK_LABELS = ["1er", "2e", "3e"];

export function Scoreboard({ rankings }: ScoreboardProps) {
  return (
    <div className="space-y-2">
      {rankings.map((r, i) => (
        <div
          key={r.playerId}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-3.5 transition-all",
            i < 3 ? RANK_STYLES[i] : "border-white/[0.06] bg-white/[0.02]"
          )}
          style={i === 0 ? { animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both" } :
                 i === 1 ? { animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both" } :
                          { animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) " + (0.1 + i * 0.1) + "s both" }}
        >
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-serif font-bold",
            i === 0 ? "bg-amber-400/15 text-amber-300" :
            i === 1 ? "bg-slate-300/10 text-slate-300" :
            i === 2 ? "bg-orange-400/10 text-orange-300" :
            "bg-white/[0.04] text-white/30"
          )}>
            {i < 3 ? RANK_LABELS[i] : `#${r.rank}`}
          </div>
          <span className="flex-1 font-sans font-semibold text-sm text-white/80">{r.playerName}</span>
          <span className="font-mono font-bold text-sm text-white/60">{r.score}</span>
        </div>
      ))}
    </div>
  );
}
