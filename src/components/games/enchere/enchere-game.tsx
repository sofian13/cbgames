"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

interface EnchereState {
  status: "waiting" | "bidding" | "poison-choice" | "reveal" | "game-over";
  round: number; totalRounds: number;
  currentItem: { name: string; emoji: string; hint: string } | null;
  revealedValue?: number;
  players: { id: string; name: string; gold: number; items: { name: string; emoji: string; value: number }[]; totalItemValue: number; hasBid: boolean }[];
  timeLeft: number;
  winner?: { playerId: string; playerName: string; bid: number };
  poisonerId?: string; poisoned?: boolean;
}

export default function EnchereGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "enchere", playerId, playerName);
  const { gameState } = useGameStore();
  const [bidAmount, setBidAmount] = useState(100);
  const [hasBid, setHasBid] = useState(false);
  const [poisonDecided, setPoisonDecided] = useState(false);
  const prevRoundRef = useRef(0);
  const state = gameState as unknown as EnchereState;

  useEffect(() => {
    if (state?.round !== prevRoundRef.current) {
      prevRoundRef.current = state?.round ?? 0;
      setBidAmount(100); setHasBid(false); setPoisonDecided(false);
    }
  }, [state?.round]);

  const handleBid = useCallback((amount: number) => {
    if (hasBid) return;
    setHasBid(true);
    sendAction({ action: "bid", amount });
  }, [hasBid, sendAction]);

  if (!state || state.status === "waiting") return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">En attente...</p></div>;

  const me = state.players?.find(p => p.id === playerId);

  if (state.status === "bidding" && state.currentItem) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/20 font-sans uppercase tracking-wider">Enchère {state.round}/{state.totalRounds}</span>
            <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 text-center space-y-3">
            <span className="text-5xl">{state.currentItem.emoji}</span>
            <h2 className="text-xl font-serif font-light text-white/90">{state.currentItem.name}</h2>
            <p className="text-sm text-white/40 font-sans italic">{state.currentItem.hint}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 font-sans">Ta mise</span>
              <span className="text-sm font-mono text-ember">{me?.gold ?? 0} 🪙 disponibles</span>
            </div>
            <input type="range" min={0} max={me?.gold ?? 0} step={25} value={bidAmount}
              onChange={e => setBidAmount(Number(e.target.value))}
              disabled={hasBid} className="w-full accent-orange-500" />
            <div className="flex items-center justify-between">
              <span className="text-lg font-mono text-white/80">{bidAmount} 🪙</span>
              <div className="flex gap-2">
                <button onClick={() => handleBid(0)} disabled={hasBid}
                  className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-sans text-white/40 hover:text-white/60 transition-colors disabled:opacity-30">
                  Passer
                </button>
                <button onClick={() => handleBid(bidAmount)} disabled={hasBid || bidAmount < 50}
                  className="rounded-lg bg-ember/80 px-6 py-2 text-sm font-sans text-white hover:bg-ember transition-colors disabled:opacity-30">
                  Miser
                </button>
              </div>
            </div>
          </div>
          {hasBid && <p className="text-xs text-white/20 text-center font-sans">Mise enregistrée</p>}
          <div className="flex gap-3 flex-wrap">
            {state.players.map(p => (
              <div key={p.id} className="text-center">
                <span className={cn("text-xs font-sans", p.hasBid ? "text-ember/60" : "text-white/20")}>{p.name}</span>
                <p className="text-xs text-white/30 font-mono">{p.gold}🪙</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "poison-choice") {
    const isPoisoner = state.poisonerId === playerId;
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md text-center space-y-4">
          <p className="text-sm text-white/60 font-sans">
            {state.winner?.playerName} remporte {state.currentItem?.name} {state.currentItem?.emoji} pour {state.winner?.bid}🪙
          </p>
          {isPoisoner && !poisonDecided ? (
            <div className="space-y-3">
              <p className="text-lg font-serif text-white/90">Empoisonner l'objet ?</p>
              <p className="text-xs text-white/30 font-sans">Coût : 50🪙 — la valeur sera divisée par 2</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setPoisonDecided(true); sendAction({ action: "poison" }); }}
                  className="rounded-lg bg-red-500/20 border border-red-500/30 px-6 py-2 text-sm text-red-300 hover:bg-red-500/30">
                  🧫 Empoisonner
                </button>
                <button onClick={() => { setPoisonDecided(true); sendAction({ action: "pass-poison" }); }}
                  className="rounded-lg border border-white/[0.08] px-6 py-2 text-sm text-white/40 hover:text-white/60">
                  Passer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/20 font-sans animate-pulse">En attente de la décision...</p>
          )}
        </div>
      </div>
    );
  }

  if (state.status === "reveal") {
    const val = state.revealedValue ?? 0;
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md text-center space-y-4">
          <span className="text-5xl">{state.currentItem?.emoji}</span>
          <h2 className="text-xl font-serif text-white/90">{state.currentItem?.name}</h2>
          <p className={cn("text-3xl font-mono font-bold", val >= 0 ? "text-emerald-400" : "text-red-400")}
            style={{ textShadow: val >= 0 ? "0 0 30px rgba(52,211,153,0.3)" : "0 0 30px rgba(248,113,113,0.3)" }}>
            {val >= 0 ? "+" : ""}{val} pts
          </p>
          {state.poisoned && <p className="text-xs text-red-400/60 font-sans">🧫 Empoisonné ! Valeur divisée par 2</p>}
          {state.winner ? (
            <p className="text-sm text-white/40 font-sans">Remporté par {state.winner.playerName} pour {state.winner.bid}🪙</p>
          ) : (
            <p className="text-sm text-white/30 font-sans">Aucune enchère</p>
          )}
        </div>
      </div>
    );
  }

  return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">Chargement...</p></div>;
}
