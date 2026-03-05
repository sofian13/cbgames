"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GameMeta } from "@/lib/games/types";
import { BookOpen, X } from "lucide-react";

interface GameCardProps {
  game: GameMeta;
  isSelected: boolean;
  isHost: boolean;
  onSelect: () => void;
}

export function GameCard({ game, isSelected, isHost, onSelect }: GameCardProps) {
  const [showRules, setShowRules] = useState(false);
  const disabled = !game.implemented || !isHost;

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-all relative premium-panel-soft",
          isSelected && "border-cyan-300/50 bg-cyan-300/12 ring-1 ring-cyan-300/35 shadow-[0_0_30px_rgba(80,216,255,0.2)]",
          disabled && "opacity-50 cursor-not-allowed hover:border-border",
          !disabled && "hover:-translate-y-0.5 hover:border-cyan-300/45"
        )}
        onClick={() => !disabled && onSelect()}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{game.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{game.name}</h4>
                {!game.implemented && (
                  <Badge variant="outline" className="text-xs">Bientôt</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{game.description}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {game.minPlayers}-{game.maxPlayers} joueurs
                </p>
                {game.rules.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowRules(true); }}
                    className="flex items-center gap-1 text-[11px] text-white/35 hover:text-cyan-200 transition-colors"
                  >
                    <BookOpen className="h-3 w-3" />
                    Règles
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules modal */}
      {showRules && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRules(false)}>
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-cyan-300/22 bg-[#071023]/96 p-6 shadow-2xl premium-panel" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowRules(false)} className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{game.icon}</span>
              <h3 className="text-xl font-serif font-light text-white/90">{game.name}</h3>
            </div>
            <ul className="space-y-2.5">
              {game.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/60 font-sans">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember/60" />
                  {rule}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/20 font-sans">
              {game.minPlayers}-{game.maxPlayers} joueurs
            </p>
          </div>
        </div>
      )}
    </>
  );
}
