"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GameMeta } from "@/lib/games/types";

interface GameCardProps {
  game: GameMeta;
  isSelected: boolean;
  isHost: boolean;
  onSelect: () => void;
}

export function GameCard({ game, isSelected, isHost, onSelect }: GameCardProps) {
  const disabled = !game.implemented || !isHost;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary/20",
        disabled && "opacity-50 cursor-not-allowed hover:border-border",
        !disabled && "hover:scale-[1.02]"
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
            <p className="text-xs text-muted-foreground mt-2">
              {game.minPlayers}-{game.maxPlayers} joueurs
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
