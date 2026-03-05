"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GameRanking } from "@/lib/party/message-types";

interface ScoreboardProps {
  rankings: GameRanking[];
}

const RANK_STYLES = [
  "text-cyan-200 border-cyan-300/40 bg-cyan-300/12 shadow-[0_0_30px_rgba(80,216,255,0.2)]",
  "text-blue-100 border-blue-300/35 bg-blue-300/10",
  "text-indigo-200 border-indigo-300/35 bg-indigo-300/10",
];

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export function Scoreboard({ rankings }: ScoreboardProps) {
  return (
    <div className="space-y-2">
      {rankings.map((r, i) => (
        <Card
          key={r.playerId}
          className={cn(
            "border transition-all rounded-2xl",
            i < 3 ? RANK_STYLES[i] : "border-border"
          )}
        >
          <CardContent className="flex items-center gap-3 p-3">
            <span className="text-2xl w-10 text-center">
              {i < 3 ? RANK_EMOJIS[i] : `#${r.rank}`}
            </span>
            <span className="flex-1 font-semibold">{r.playerName}</span>
            <span className="font-mono font-bold text-lg">{r.score} pts</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
