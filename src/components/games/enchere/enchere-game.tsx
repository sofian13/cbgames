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

  if (!state || state.status === "waiting") return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden" style={{ background: "#060606" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.08), transparent 40%)" }} />
      <p className="text-lg text-white/40 animate-pulse font-sans tracking-wide">En attente...</p>
    </div>
  );

  const me = state.players?.find(p => p.id === playerId);

  if (state.status === "bidding" && state.currentItem) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden" style={{ background: "#060606" }}>
        {/* Ambient glow */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 25%, rgba(56, 189, 248, 0.10), transparent 40%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.06), transparent 35%)" }} />

        <div className="relative z-10 w-full max-w-md space-y-6">
          {/* Round & Timer header */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em]">
              Ench&egrave;re {state.round}/{state.totalRounds}
            </span>
            <span
              className={cn(
                "text-sm font-mono font-semibold px-3 py-1 rounded-full",
                state.timeLeft <= 5
                  ? "text-red-400 bg-red-500/10 shadow-[0_0_12px_rgba(248,113,113,0.2)]"
                  : "text-amber-400 bg-amber-500/10"
              )}
            >
              {state.timeLeft}s
            </span>
          </div>

          {/* Item card */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-8 text-center space-y-4 shadow-[0_0_20px_rgba(56,189,248,0.08)]">
            <span className="text-5xl block" style={{ filter: "drop-shadow(0 0 20px rgba(56,189,248,0.25))" }}>
              {state.currentItem.emoji}
            </span>
            <h2 className="text-3xl font-serif font-semibold text-white/90 tracking-tight">
              {state.currentItem.name}
            </h2>
            <p className="text-sm text-white/40 font-sans italic leading-relaxed">
              {state.currentItem.hint}
            </p>
          </div>

          {/* Bid controls */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 font-sans uppercase tracking-wider">Ta mise</span>
              <span className="text-sm font-mono text-amber-400/80">{me?.gold ?? 0} 🪙 disponibles</span>
            </div>

            <input type="range" min={0} max={me?.gold ?? 0} step={25} value={bidAmount}
              onChange={e => setBidAmount(Number(e.target.value))}
              disabled={hasBid}
              className="w-full accent-[#4ecf8a] h-2 rounded-full"
            />

            <div className="flex items-center justify-between">
              <span className="text-3xl font-mono font-semibold text-white/90">
                {bidAmount} <span className="text-lg">🪙</span>
              </span>
              <div className="flex gap-3">
                <button onClick={() => handleBid(0)} disabled={hasBid}
                  className="rounded-2xl border border-white/25 bg-black/30 backdrop-blur-sm px-5 py-2.5 text-sm font-sans text-white/40 hover:text-white/70 hover:border-white/40 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  Passer
                </button>
                <button onClick={() => handleBid(bidAmount)} disabled={hasBid || bidAmount < 50}
                  className="rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-7 py-2.5 text-sm font-sans font-semibold text-black hover:shadow-[0_0_20px_rgba(78,207,138,0.35)] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  Miser
                </button>
              </div>
            </div>
          </div>

          {/* Bid confirmation */}
          {hasBid && (
            <p className="text-xs text-[#65dfb2]/50 text-center font-sans tracking-wide animate-pulse">
              Mise enregistr&eacute;e
            </p>
          )}

          {/* Players row */}
          <div className="flex gap-4 flex-wrap justify-center">
            {state.players.map(p => (
              <div key={p.id} className={cn(
                "text-center rounded-2xl px-4 py-2.5 border transition-all duration-300",
                p.hasBid
                  ? "border-[#4ecf8a]/30 bg-[#4ecf8a]/5 shadow-[0_0_12px_rgba(78,207,138,0.1)]"
                  : "border-white/10 bg-white/[0.02]"
              )}>
                <span className={cn(
                  "text-xs font-sans font-semibold block",
                  p.hasBid ? "text-[#65dfb2]/70" : "text-white/25"
                )}>
                  {p.name}
                </span>
                <p className="text-xs text-white/40 font-mono mt-0.5">{p.gold}🪙</p>
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
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden" style={{ background: "#060606" }}>
        {/* Poison ambient glow */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 25%, rgba(168, 85, 247, 0.10), transparent 40%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 40% 60%, rgba(239, 68, 68, 0.06), transparent 35%)" }} />

        <div className="relative z-10 w-full max-w-md text-center space-y-6">
          {/* Winner announcement */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-6 space-y-2">
            <span className="text-4xl block">{state.currentItem?.emoji}</span>
            <p className="text-lg text-white/90 font-sans font-semibold">
              {state.winner?.playerName} remporte <span className="font-serif">{state.currentItem?.name}</span>
            </p>
            <p className="text-sm text-white/40 font-mono">
              pour {state.winner?.bid} 🪙
            </p>
          </div>

          {isPoisoner && !poisonDecided ? (
            <div className="rounded-3xl border border-purple-500/25 bg-black/30 backdrop-blur-sm p-8 space-y-5 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <p className="text-3xl font-serif font-semibold text-white/90">
                Empoisonner l'objet ?
              </p>
              <p className="text-sm text-white/40 font-sans leading-relaxed">
                Co&ucirc;t : <span className="font-mono text-amber-400/70">50🪙</span> — la valeur sera divis&eacute;e par 2
              </p>
              <div className="flex gap-4 justify-center pt-2">
                <button onClick={() => { setPoisonDecided(true); sendAction({ action: "poison" }); }}
                  className="rounded-2xl bg-gradient-to-r from-red-500/80 to-purple-600/80 border border-red-400/30 px-7 py-3 text-sm font-sans font-semibold text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-200">
                  🧫 Empoisonner
                </button>
                <button onClick={() => { setPoisonDecided(true); sendAction({ action: "pass-poison" }); }}
                  className="rounded-2xl border border-white/25 bg-black/30 backdrop-blur-sm px-7 py-3 text-sm font-sans text-white/40 hover:text-white/70 hover:border-white/40 transition-all duration-200">
                  Passer
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur-sm p-6">
              <p className="text-sm text-white/25 font-sans animate-pulse tracking-wide">
                En attente de la d&eacute;cision...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state.status === "reveal") {
    const val = state.revealedValue ?? 0;
    const isPositive = val >= 0;
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden" style={{ background: "#060606" }}>
        {/* Reveal ambient glow - color depends on value */}
        <div className="absolute inset-0" style={{
          background: isPositive
            ? "radial-gradient(circle at 50% 25%, rgba(52, 211, 153, 0.12), transparent 40%)"
            : "radial-gradient(circle at 50% 25%, rgba(248, 113, 113, 0.12), transparent 40%)"
        }} />

        <div className="relative z-10 w-full max-w-md text-center space-y-6">
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-10 space-y-5"
            style={{
              boxShadow: isPositive
                ? "0 0 30px rgba(52, 211, 153, 0.1)"
                : "0 0 30px rgba(248, 113, 113, 0.1)"
            }}>
            <span className="text-5xl block" style={{
              filter: isPositive
                ? "drop-shadow(0 0 20px rgba(52,211,153,0.3))"
                : "drop-shadow(0 0 20px rgba(248,113,113,0.3))"
            }}>
              {state.currentItem?.emoji}
            </span>
            <h2 className="text-3xl font-serif font-semibold text-white/90 tracking-tight">
              {state.currentItem?.name}
            </h2>
            <p className={cn(
              "text-5xl font-mono font-semibold",
              isPositive ? "text-emerald-400" : "text-red-400"
            )} style={{
              textShadow: isPositive
                ? "0 0 30px rgba(52,211,153,0.4)"
                : "0 0 30px rgba(248,113,113,0.4)"
            }}>
              {val >= 0 ? "+" : ""}{val} pts
            </p>

            {state.poisoned && (
              <p className="text-sm text-red-400/70 font-sans flex items-center justify-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400/60 shadow-[0_0_6px_rgba(248,113,113,0.4)]" />
                Empoisonn&eacute; ! Valeur divis&eacute;e par 2
              </p>
            )}
          </div>

          {state.winner ? (
            <p className="text-sm text-white/40 font-sans">
              Remport&eacute; par <span className="text-white/60 font-semibold">{state.winner.playerName}</span> pour <span className="font-mono text-amber-400/60">{state.winner.bid}🪙</span>
            </p>
          ) : (
            <p className="text-sm text-white/25 font-sans">Aucune ench&egrave;re</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden" style={{ background: "#060606" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.08), transparent 40%)" }} />
      <p className="text-lg text-white/40 animate-pulse font-sans tracking-wide">Chargement...</p>
    </div>
  );
}
