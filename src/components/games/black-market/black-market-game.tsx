"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

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
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [claimedValue, setClaimedValue] = useState(20);
  const prevRoundRef = useRef(0);
  const state = gameState as unknown as BMState;

  useEffect(() => {
    if (state?.round !== prevRoundRef.current) {
      prevRoundRef.current = state?.round ?? 0;
      setSelectedCard(null); setSelectedTarget(null); setClaimedValue(20);
    }
  }, [state?.round]);

  const handleOffer = useCallback(() => {
    if (selectedCard === null || !selectedTarget) return;
    sendAction({ action: "offer-trade", cardIndex: selectedCard, targetId: selectedTarget, claimedValue });
    setSelectedCard(null); setSelectedTarget(null);
  }, [selectedCard, selectedTarget, claimedValue, sendAction]);

  const handleAccept = useCallback((tradeIndex: number, myCardIndex: number) => {
    sendAction({ action: "accept-trade", tradeIndex, myCardIndex });
  }, [sendAction]);

  const handleDecline = useCallback((tradeIndex: number) => {
    sendAction({ action: "decline-trade", tradeIndex });
  }, [sendAction]);

  if (!state || state.status === "waiting") return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">En attente...</p></div>;

  if (state.status === "trading") {
    const incomingTrades = state.pendingTrades.filter(t => t.toId === playerId);
    const others = state.players.filter(p => p.id !== playerId);

    return (
      <div className="flex flex-1 flex-col p-4 overflow-auto" style={{ background: "#060606" }}>
        <div className="w-full max-w-lg mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/20 font-sans uppercase tracking-wider">Manche {state.round}/{state.totalRounds}</span>
            <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
          </div>

          {/* My hand */}
          <div>
            <p className="text-xs text-white/30 font-sans mb-2">Ta main</p>
            <div className="flex gap-2 flex-wrap">
              {state.myHand.map((card, i) => (
                <button key={i} onClick={() => setSelectedCard(selectedCard === i ? null : i)}
                  className={cn("rounded-lg border p-3 text-center transition-all min-w-[70px]",
                    selectedCard === i ? "border-ember/50 bg-ember/10" : "border-white/[0.08] bg-white/[0.03] hover:border-white/20")}>
                  <span className="text-2xl block">{card.emoji}</span>
                  <span className="text-[10px] font-sans text-white/40 block">{card.name}</span>
                  <span className={cn("text-xs font-mono", card.value >= 0 ? "text-emerald-400" : "text-red-400")}>{card.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Propose trade */}
          {selectedCard !== null && (
            <div className="rounded-xl border border-ember/20 bg-ember/5 p-3 space-y-2">
              <p className="text-xs text-ember/60 font-sans">Proposer {state.myHand[selectedCard]?.emoji} à :</p>
              <div className="flex gap-2 flex-wrap">
                {others.map(p => (
                  <button key={p.id} onClick={() => setSelectedTarget(p.id)}
                    className={cn("rounded-lg border px-3 py-1 text-xs font-sans transition-all",
                      selectedTarget === p.id ? "border-ember/50 bg-ember/10 text-ember" : "border-white/[0.08] text-white/40")}>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30 font-sans">Valeur annoncée :</span>
                <input type="number" value={claimedValue} onChange={e => setClaimedValue(Number(e.target.value))}
                  className="w-16 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-white/80 font-mono focus:outline-none" />
              </div>
              <button onClick={handleOffer} disabled={!selectedTarget}
                className="rounded-lg bg-ember/80 px-4 py-2 text-xs font-sans text-white hover:bg-ember transition-colors disabled:opacity-30">
                Proposer l'échange
              </button>
            </div>
          )}

          {/* Incoming trades */}
          {incomingTrades.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/30 font-sans">Offres reçues</p>
              {incomingTrades.map(trade => (
                <div key={trade.index} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 space-y-2">
                  <p className="text-xs text-white/60 font-sans">
                    {trade.fromName} propose une carte (annoncée à <span className="text-ember font-mono">{trade.claimedValue}</span> pts)
                  </p>
                  <div className="flex gap-2">
                    {state.myHand.map((card, i) => (
                      <button key={i} onClick={() => handleAccept(trade.index, i)}
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10">
                        Échanger {card.emoji}
                      </button>
                    ))}
                    <button onClick={() => handleDecline(trade.index)}
                      className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10">
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent trades */}
          {state.recentTrades.length > 0 && (
            <div className="text-xs text-white/20 font-sans space-y-1">
              {state.recentTrades.map((t, i) => (
                <p key={i}>{t.fromName} ↔ {t.toName}</p>
              ))}
            </div>
          )}

          {/* Players */}
          <div className="flex gap-3 flex-wrap">
            {state.players.map(p => (
              <div key={p.id} className="text-center">
                <span className="text-xs font-sans text-white/40">{p.name}</span>
                <p className="text-xs text-white/20 font-mono">{p.cardCount} cartes</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "reveal") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md text-center space-y-4">
          <h2 className="text-xl font-serif font-light text-white/90">Valeurs révélées</h2>
          <div className="flex gap-2 flex-wrap justify-center">
            {state.myHand.map((card, i) => (
              <div key={i} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-center">
                <span className="text-2xl block">{card.emoji}</span>
                <span className="text-[10px] text-white/40 font-sans block">{card.name}</span>
                <span className={cn("text-sm font-mono font-bold", card.value >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {card.value > 0 ? "+" : ""}{card.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap justify-center mt-4">
            {state.players.map(p => (
              <div key={p.id} className="text-center px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03]">
                <span className="text-xs font-sans text-white/60 block">{p.name}</span>
                <p className="text-sm font-mono text-ember">{p.score ?? 0} pts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">Chargement...</p></div>;
}
