"use client";

import { useCallback } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

interface BMCard { name: string; emoji: string; value: number; fakeValue: number; }
interface BMPlayer { id: string; name: string; score?: number; cardCount: number; }
interface PendingTrade { index: number; fromId: string; fromName: string; toId: string; claimedValue: number; }
interface BMState {
  status: "waiting" | "trading" | "reveal" | "game-over";
  round: number; totalRounds: number; timeLeft: number;
  myHand: BMCard[]; players: BMPlayer[];
  pendingTrades: PendingTrade[];
  recentTrades: { fromName: string; toName: string }[];
}

export default function BlackMarketGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "black-market", playerId, playerName);
  const { gameState } = useGameStore();
  const state = gameState as unknown as BMState;
  const roundKey = state?.round ?? 0;
  const [selectedCard, setSelectedCard] = useKeyedState<number | null>(roundKey, null);
  const [selectedTarget, setSelectedTarget] = useKeyedState<string | null>(roundKey, null);
  const [claimedValue, setClaimedValue] = useKeyedState<number>(roundKey, 20);

  const handleOffer = useCallback(() => {
    if (selectedCard === null || !selectedTarget) return;
    sendAction({ action: "offer-trade", cardIndex: selectedCard, targetId: selectedTarget, claimedValue });
    setSelectedCard(null); setSelectedTarget(null);
  }, [claimedValue, selectedCard, selectedTarget, sendAction, setSelectedCard, setSelectedTarget]);

  const handleAccept = useCallback((tradeIndex: number, myCardIndex: number) => {
    sendAction({ action: "accept-trade", tradeIndex, myCardIndex });
  }, [sendAction]);

  const handleDecline = useCallback((tradeIndex: number) => {
    sendAction({ action: "decline-trade", tradeIndex });
  }, [sendAction]);

  if (!state || state.status === "waiting") return (
    <div className="flex flex-1 items-center justify-center min-h-screen"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.08), transparent 40%), #060606" }}>
      <p className="text-3xl text-white/40 animate-pulse font-sans font-semibold tracking-wide">En attente...</p>
    </div>
  );

  if (state.status === "trading") {
    const incomingTrades = state.pendingTrades.filter(t => t.toId === playerId);
    const others = state.players.filter(p => p.id !== playerId);

    return (
      <div className="flex flex-1 flex-col p-6 overflow-auto min-h-screen"
        style={{ background: "radial-gradient(circle at 50% 25%, rgba(101, 223, 178, 0.1), transparent 40%), radial-gradient(circle at 80% 70%, rgba(78, 207, 138, 0.06), transparent 35%), #060606" }}>
        <div className="w-full max-w-lg mx-auto space-y-6">

          {/* Header */}
          <div className="flex justify-between items-center rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-6 py-4 shadow-[0_0_20px_rgba(101,223,178,0.08)]">
            <span className="text-sm text-white/40 font-sans uppercase tracking-widest">Manche {state.round}/{state.totalRounds}</span>
            <span className={cn(
              "text-3xl font-mono font-semibold",
              state.timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-[#65dfb2]"
            )}
              style={state.timeLeft > 10 ? { textShadow: "0 0 20px rgba(101,223,178,0.4)" } : { textShadow: "0 0 20px rgba(248,113,113,0.4)" }}>
              {state.timeLeft}s
            </span>
          </div>

          {/* My hand */}
          <div className="space-y-3">
            <p className="text-sm text-white/40 font-sans uppercase tracking-wider">Ta main</p>
            <div className="flex gap-3 flex-wrap">
              {state.myHand.map((card, i) => (
                <button key={i} onClick={() => setSelectedCard(selectedCard === i ? null : i)}
                  className={cn(
                    "rounded-2xl border p-4 text-center transition-all min-w-[85px] backdrop-blur-sm",
                    selectedCard === i
                      ? "border-[#65dfb2]/50 bg-[#65dfb2]/10 shadow-[0_0_20px_rgba(101,223,178,0.25)] scale-105"
                      : "border-white/25 bg-black/30 hover:border-white/40 hover:bg-black/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  )}>
                  <span className="text-3xl block mb-1">{card.emoji}</span>
                  <span className="text-xs font-sans text-white/40 block mb-1">{card.name}</span>
                  <span className={cn("text-sm font-mono font-semibold", card.value >= 0 ? "text-[#65dfb2]" : "text-red-400")}>{card.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Propose trade */}
          {selectedCard !== null && (
            <div className="rounded-3xl border border-[#65dfb2]/30 bg-[#65dfb2]/5 backdrop-blur-sm p-5 space-y-4 shadow-[0_0_20px_rgba(101,223,178,0.15)]">
              <p className="text-sm text-white/90 font-sans font-semibold">
                Proposer {state.myHand[selectedCard]?.emoji} <span className="text-white/40 font-normal">a :</span>
              </p>
              <div className="flex gap-3 flex-wrap">
                {others.map(p => (
                  <button key={p.id} onClick={() => setSelectedTarget(p.id)}
                    className={cn(
                      "rounded-2xl border px-4 py-2 text-sm font-sans transition-all",
                      selectedTarget === p.id
                        ? "border-[#65dfb2]/50 bg-[#65dfb2]/10 text-[#65dfb2] shadow-[0_0_15px_rgba(101,223,178,0.2)]"
                        : "border-white/25 bg-black/30 text-white/40 hover:border-white/40 hover:text-white/60"
                    )}>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/40 font-sans">Valeur annoncee :</span>
                <input type="number" value={claimedValue} onChange={e => setClaimedValue(Number(e.target.value))}
                  className="w-20 rounded-xl border border-white/25 bg-black/30 backdrop-blur-sm px-3 py-2 text-sm text-white/90 font-mono font-semibold focus:outline-none focus:border-[#65dfb2]/50 focus:shadow-[0_0_15px_rgba(101,223,178,0.15)] transition-all" />
              </div>
              <button onClick={handleOffer} disabled={!selectedTarget}
                className="rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-6 py-3 text-sm font-sans font-semibold text-black hover:shadow-[0_0_20px_rgba(101,223,178,0.4)] transition-all disabled:opacity-30 disabled:hover:shadow-none">
                Proposer l&apos;echange
              </button>
            </div>
          )}

          {/* Incoming trades */}
          {incomingTrades.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-white/40 font-sans uppercase tracking-wider">Offres recues</p>
              {incomingTrades.map(trade => (
                <div key={trade.index} className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-5 space-y-4 shadow-[0_0_20px_rgba(255,255,255,0.03)]">
                  <p className="text-sm text-white/90 font-sans">
                    <span className="font-semibold">{trade.fromName}</span>
                    <span className="text-white/40"> propose une carte (annoncee a </span>
                    <span className="text-[#65dfb2] font-mono font-semibold" style={{ textShadow: "0 0 10px rgba(101,223,178,0.3)" }}>{trade.claimedValue}</span>
                    <span className="text-white/40"> pts)</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {state.myHand.map((card, i) => (
                      <button key={i} onClick={() => handleAccept(trade.index, i)}
                        className="rounded-2xl border border-[#65dfb2]/25 bg-[#65dfb2]/5 px-4 py-2 text-sm text-[#65dfb2] font-sans font-semibold hover:bg-[#65dfb2]/10 hover:shadow-[0_0_15px_rgba(101,223,178,0.2)] transition-all">
                        Echanger {card.emoji}
                      </button>
                    ))}
                    <button onClick={() => handleDecline(trade.index)}
                      className="rounded-2xl border border-red-400/25 bg-red-400/5 px-5 py-2 text-sm text-red-400 font-sans font-semibold hover:bg-red-400/10 hover:shadow-[0_0_15px_rgba(248,113,113,0.2)] transition-all">
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent trades */}
          {state.recentTrades.length > 0 && (
            <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-5 py-4 space-y-2">
              <p className="text-xs text-white/25 font-sans uppercase tracking-wider mb-2">Echanges recents</p>
              {state.recentTrades.map((t, i) => (
                <p key={i} className="text-sm text-white/40 font-sans">
                  <span className="text-white/60">{t.fromName}</span>
                  <span className="text-[#65dfb2]/40 mx-2">&#x2194;</span>
                  <span className="text-white/60">{t.toName}</span>
                </p>
              ))}
            </div>
          )}

          {/* Players */}
          <div className="flex gap-4 flex-wrap justify-center">
            {state.players.map(p => (
              <div key={p.id} className="text-center rounded-2xl border border-white/25 bg-black/30 backdrop-blur-sm px-5 py-3 shadow-[0_0_10px_rgba(255,255,255,0.02)]">
                <span className="text-sm font-sans text-white/90 font-semibold block">{p.name}</span>
                <p className="text-xs text-white/25 font-mono mt-1">{p.cardCount} cartes</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  if (state.status === "reveal") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 min-h-screen"
        style={{ background: "radial-gradient(circle at 50% 25%, rgba(101, 223, 178, 0.12), transparent 40%), radial-gradient(circle at 30% 80%, rgba(78, 207, 138, 0.06), transparent 30%), #060606" }}>
        <div className="w-full max-w-md text-center space-y-8">

          <h2 className="text-4xl font-serif font-semibold text-white/90"
            style={{ textShadow: "0 0 30px rgba(255,255,255,0.1)" }}>
            Valeurs revelees
          </h2>

          <div className="flex gap-3 flex-wrap justify-center">
            {state.myHand.map((card, i) => (
              <div key={i} className="rounded-2xl border border-white/25 bg-black/30 backdrop-blur-sm p-5 text-center min-w-[90px] shadow-[0_0_20px_rgba(101,223,178,0.08)]">
                <span className="text-4xl block mb-2">{card.emoji}</span>
                <span className="text-xs text-white/40 font-sans block mb-2">{card.name}</span>
                <span className={cn(
                  "text-xl font-mono font-semibold",
                  card.value >= 0 ? "text-[#65dfb2]" : "text-red-400"
                )}
                  style={card.value >= 0
                    ? { textShadow: "0 0 15px rgba(101,223,178,0.4)" }
                    : { textShadow: "0 0 15px rgba(248,113,113,0.4)" }
                  }>
                  {card.value > 0 ? "+" : ""}{card.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 flex-wrap justify-center mt-6">
            {state.players.map((p, i) => (
              <div key={p.id} className={cn(
                "text-center px-6 py-4 rounded-3xl border backdrop-blur-sm transition-all",
                i === 0
                  ? "border-[#65dfb2]/30 bg-[#65dfb2]/5 shadow-[0_0_20px_rgba(101,223,178,0.2)]"
                  : "border-white/25 bg-black/30"
              )}>
                <span className="text-sm font-sans text-white/90 font-semibold block">{p.name}</span>
                <p className="text-3xl font-mono font-semibold text-[#65dfb2] mt-1"
                  style={{ textShadow: "0 0 20px rgba(101,223,178,0.35)" }}>
                  {p.score ?? 0}
                </p>
                <span className="text-xs text-white/25 font-sans">pts</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.08), transparent 40%), #060606" }}>
      <p className="text-3xl text-white/40 animate-pulse font-sans font-semibold tracking-wide">Chargement...</p>
    </div>
  );
}
