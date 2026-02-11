"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GameRanking } from "@/lib/party/message-types";

interface ScoreboardProps {
  rankings: GameRanking[];
}

const RANK_STYLES = [
  "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  "text-gray-300 border-gray-300/30 bg-gray-300/5",
  "text-amber-600 border-amber-600/30 bg-amber-600/5",
];

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export function Scoreboard({ rankings }: ScoreboardProps) {
  return (
    <div className="space-y-2">
      {rankings.map((r, i) => (
        <Card
          key={r.playerId}
          className={cn(
            "border transition-all",
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
