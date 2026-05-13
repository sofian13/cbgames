"use client";

import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { PlayingCard, type Suit, type Rank } from "@/components/shared/playing-card";
import { cn } from "@/lib/utils";

interface Seat {
  id: string;
  name: string;
  team: 0 | 1;
  seatIndex: number;
  cardCount: number;
  isCurrentTurn: boolean;
}

interface Bid { amount: number; suit: Suit; bidder: string; multiplier: 1 | 2 | 4; }

interface ContreeState {
  phase: "waiting" | "bidding" | "playing" | "hand-over" | "match-over";
  handNumber: number;
  currentBidder: string | null;
  currentPlayerId: string | null;
  currentBid: Bid | null;
  timeLeft: number;
  trick: { card: { rank: Rank; suit: Suit }; seat: number }[];
  trumpSuit: Suit | null;
  pliCounts: [number, number];
  matchScore: [number, number];
  targetPoints: number;
  beloteHolder: string | null;
  seats: Seat[];
  hands: Record<string, { rank: Rank; suit: Suit }[]>;
}

const palette = ["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8","#E89A2B","#00B3A6","#E23434"];
const SUIT_RED = (s: Suit) => s === "♥" || s === "♦";

export default function ContreeGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "contree", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as unknown as ContreeState | null;

  // Bidding UI state
  const [bidAmount, setBidAmount] = useState(80);
  const [bidSuit, setBidSuit] = useState<Suit>("♥");

  const myHand = state?.hands?.[playerId] ?? [];
  const me = state?.seats.find((s) => s.id === playerId);
  const isMyTurn = state?.currentPlayerId === playerId;
  const isMyBid = state?.currentBidder === playerId;

  // Show belote chip if I'm the holder
  const showBelote = state?.beloteHolder === playerId && state?.phase === "playing";

  useEffect(() => {
    if (state?.currentBid) {
      const min = state.currentBid.amount + 10;
      if (bidAmount <= state.currentBid.amount) setBidAmount(Math.min(160, min));
    }
  }, [state?.currentBid, bidAmount]);

  function placeBid() {
    sendAction({ action: "bid",  playerId, amount: bidAmount, suit: bidSuit  });
  }
  function pass() {
    sendAction({ action: "pass",  playerId  });
  }
  function coincher() {
    sendAction({ action: "coincher",  playerId  });
  }
  function playCard(idx: number) {
    sendAction({ action: "play-card",  playerId, cardIndex: idx  });
  }

  if (!state || !state.phase || state.phase === "waiting") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>en attente</span>
        <h2 className="cb-display-lg mt-2">Distribution…</h2>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          4 joueurs nécessaires · 2v2
        </p>
      </div>
    );
  }

  if (state.phase === "match-over") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>partie terminée</span>
        <h2 className="cb-display-lg mt-2">
          {state.matchScore[0] > state.matchScore[1] ? "Équipe A gagne" : "Équipe B gagne"}
        </h2>
        <p className="mt-3 cb-mono text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          {state.matchScore[0]} – {state.matchScore[1]}
        </p>
      </div>
    );
  }

  // Render bidding UI
  if (state.phase === "bidding") {
    return (
      <div className="flex h-full flex-col px-4 py-3">
        {/* Top: last bid */}
        <div className="rounded-xl border p-3"
             style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          {state.currentBid ? (
            <>
              <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
                dernière enchère
              </span>
              <div className="mt-1 flex items-center gap-3">
                <span className="cb-display-md text-white">
                  {state.currentBid.amount}
                </span>
                <span className="text-2xl font-black"
                      style={{ color: SUIT_RED(state.currentBid.suit) ? "#FF8888" : "#FFFFFF" }}>
                  {state.currentBid.suit}
                </span>
                <span className="ml-auto text-xs"
                      style={{ color: "rgba(255,255,255,0.7)" }}>
                  par {state.seats.find((s) => s.id === state.currentBid?.bidder)?.name ?? "?"}
                </span>
                {state.currentBid.multiplier > 1 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{ background: "var(--cb-social)", color: "#fff" }}
                  >
                    {state.currentBid.multiplier === 2 ? "COINCHÉ ×2" : "SURCOINCHÉ ×4"}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
              aucune enchère encore
            </span>
          )}
        </div>

        {/* Whose turn */}
        <p className="mt-3 cb-eyebrow text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
          {isMyBid ? "ton enchère" : `tour de ${state.seats.find((s) => s.id === state.currentBidder)?.name ?? "?"}`}
        </p>

        {isMyBid && (
          <>
            {/* Amount picker */}
            <div className="mt-3">
              <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
                1. montant
              </span>
              <div className="cb-scroll mt-2 flex gap-2 overflow-x-auto pb-1">
                {[80, 90, 100, 110, 120, 130, 140, 150, 160].map((amt) => {
                  const tooLow = !!state.currentBid && amt <= state.currentBid.amount;
                  const active = bidAmount === amt;
                  return (
                    <button
                      key={amt}
                      onClick={() => !tooLow && setBidAmount(amt)}
                      disabled={tooLow}
                      className="shrink-0 rounded-xl border px-3 py-2 text-base font-black"
                      style={{
                        background: active ? "var(--cb-brand)" : "rgba(255,255,255,0.04)",
                        color: active ? "var(--cb-brand-ink)" : tooLow ? "rgba(255,255,255,0.3)" : "#fff",
                        borderColor: active ? "transparent" : "rgba(255,255,255,0.1)",
                        fontFamily: "var(--font-display)",
                        opacity: tooLow ? 0.5 : 1,
                      }}
                    >
                      {amt}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-2">
                {[
                  { v: 250, label: "Capot" },
                  { v: 500, label: "Générale" },
                ].map((s) => {
                  const active = bidAmount === s.v;
                  return (
                    <button
                      key={s.v}
                      onClick={() => setBidAmount(s.v)}
                      className="flex-1 rounded-xl border py-3"
                      style={{
                        background: active ? "var(--cb-cards)" : "rgba(255,255,255,0.04)",
                        color: "#fff",
                        borderColor: active ? "transparent" : "rgba(255,255,255,0.1)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: 14,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s.label} <span style={{ opacity: 0.6, fontSize: 10 }}>{s.v}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suit picker */}
            <div className="mt-3">
              <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
                2. couleur d&apos;atout
              </span>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {(["♥","♦","♠","♣"] as Suit[]).map((s) => {
                  const active = bidSuit === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setBidSuit(s)}
                      className="flex flex-col items-center justify-center rounded-xl border py-3"
                      style={{
                        background: active ? "var(--cb-brand)" : "rgba(255,255,255,0.04)",
                        borderColor: active ? "transparent" : "rgba(255,255,255,0.1)",
                      }}
                    >
                      <span
                        className="text-2xl"
                        style={{
                          color: SUIT_RED(s)
                            ? (active ? "#FFC0BD" : "#FF8888")
                            : (active ? "var(--cb-brand-ink)" : "#FFFFFF"),
                        }}
                      >
                        {s}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button onClick={pass} className="cb-btn cb-btn-soft flex-1">Passer</button>
              {state.currentBid && (
                <button onClick={coincher} className="cb-btn flex-1"
                        style={{ background: "var(--cb-social)", color: "#fff" }}>
                  Coincher ×2
                </button>
              )}
              <button onClick={placeBid} className="cb-btn cb-btn-brand flex-1">
                Annoncer
              </button>
            </div>
          </>
        )}

        {/* Hand preview */}
        <div className="mt-auto pt-3">
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
            ta main
          </span>
          <div className="mt-2 flex flex-wrap gap-1 justify-center">
            {myHand.map((c, i) => (
              <PlayingCard key={i} value={c.rank as Rank} suit={c.suit as Suit} size="sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  const myTeam = me?.team;
  const partnerSeat = state.seats.find((s) => s.team === myTeam && s.id !== playerId);
  const oppSeats = state.seats.filter((s) => s.team !== myTeam);

  return (
    <div className="relative flex h-full flex-col">
      {/* Contract + score */}
      <div className="mx-3 mt-2 flex gap-2">
        <div className="flex-1 rounded-lg border p-2"
             style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>contrat</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="cb-display-md text-white text-lg">{state.currentBid?.amount}</span>
            <span className="text-lg font-black"
                  style={{ color: SUIT_RED(state.trumpSuit!) ? "#FF8888" : "#FFFFFF" }}>
              {state.trumpSuit}
            </span>
            {state.currentBid && state.currentBid.multiplier > 1 && (
              <span className="text-[9px] font-bold ml-1"
                    style={{ color: "var(--cb-social)" }}>×{state.currentBid.multiplier}</span>
            )}
          </div>
        </div>
        <div className="flex-1 rounded-lg border p-2 flex justify-between items-center"
             style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
          <div>
            <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>nous</span>
            <div className="text-lg font-black" style={{ color: "var(--cb-strategy)" }}>
              {state.matchScore[myTeam ?? 0]}
            </div>
          </div>
          <div className="text-right">
            <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>eux</span>
            <div className="text-lg font-black" style={{ color: "var(--cb-social)" }}>
              {state.matchScore[1 - (myTeam ?? 0)]}
            </div>
          </div>
        </div>
      </div>

      {showBelote && (
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
             style={{
               background: "rgba(24,169,87,0.15)",
               borderColor: "rgba(24,169,87,0.4)",
               color: "var(--cb-strategy)",
             }}>
          <span style={{ color: "var(--cb-strategy)" }}>♥</span>
          <span className="font-bold" style={{ fontFamily: "var(--font-display)" }}>
            BELOTE-REBELOTE en main
          </span>
          <span className="ml-auto cb-mono font-bold">+20 pts</span>
        </div>
      )}

      {/* Felt table */}
      <div className="relative mx-3 mt-2 flex flex-1 flex-col items-center justify-center rounded-3xl"
           style={{
             background: "radial-gradient(120% 80% at 50% 50%, #1F4630 0%, #0E2A1B 100%)",
             border: "1px solid rgba(255,255,255,0.06)",
             overflow: "hidden",
           }}>
        {/* Partner top */}
        {partnerSeat && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: palette[partnerSeat.seatIndex], color: "#fff",
                           fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 12 }}>
              {partnerSeat.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[9px] font-bold" style={{ color: "var(--cb-strategy)" }}>
              ⚐ {partnerSeat.name}
            </span>
          </div>
        )}

        {/* Opponents */}
        {oppSeats[0] && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: palette[oppSeats[0].seatIndex], color: "#fff",
                           fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 12 }}>
              {oppSeats[0].name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.7)" }}>
              {oppSeats[0].name}
            </span>
          </div>
        )}
        {oppSeats[1] && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: palette[oppSeats[1].seatIndex], color: "#fff",
                           fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 12 }}>
              {oppSeats[1].name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.7)" }}>
              {oppSeats[1].name}
            </span>
          </div>
        )}

        {/* Trick in center */}
        <div className="flex flex-col items-center gap-2">
          {state.trick.length === 0 ? (
            <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>
              {isMyTurn ? "à toi de jouer" : "en attente"}
            </span>
          ) : (
            <div className="flex gap-1">
              {state.trick.map((t, i) => (
                <div key={i} style={{ transform: `rotate(${(i - 1) * 3}deg)` }}>
                  <PlayingCard value={t.card.rank as Rank} suit={t.card.suit as Suit} size="md"
                               style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.45)" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timer */}
        {isMyTurn && (
          <div className="absolute top-2 right-2 rounded-full px-2.5 py-1 text-xs font-black"
               style={{
                 background: state.timeLeft <= 5 ? "var(--cb-social)" : "var(--cb-brand)",
                 color: "#fff",
                 fontFamily: "var(--font-display)",
               }}>
            {state.timeLeft}s
          </div>
        )}

        {/* Tricks won */}
        <div className="absolute bottom-2 left-2 text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          plis nous · {state.pliCounts[myTeam ?? 0]}
        </div>
        <div className="absolute bottom-2 right-2 text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          plis eux · {state.pliCounts[1 - (myTeam ?? 0)]}
        </div>
      </div>

      {/* My hand */}
      <div className="relative h-32 px-3 pt-2">
        <div className="relative mx-auto" style={{ width: "100%", maxWidth: 540, height: 110 }}>
          {myHand.map((c, i) => {
            const n = myHand.length;
            const mid = (n - 1) / 2;
            const offset = i - mid;
            const spacing = Math.min(46, 320 / Math.max(1, n - 1));
            const rot = offset * Math.min(4, 18 / Math.max(1, n - 1));
            const x = offset * spacing;
            const y = Math.abs(offset) * 2;
            return (
              <button
                key={i}
                onClick={() => isMyTurn && playCard(i)}
                disabled={!isMyTurn}
                className="absolute outline-none transition-transform"
                style={{
                  left: "50%", bottom: 0,
                  transform: `translateX(${x - 28}px) translateY(${-y}px) rotate(${rot}deg)`,
                  transformOrigin: "center 95px",
                  zIndex: i,
                  cursor: isMyTurn ? "pointer" : "not-allowed",
                }}
              >
                <PlayingCard
                  value={c.rank as Rank}
                  suit={c.suit as Suit}
                  size="md"
                  dim={!isMyTurn}
                  raised={isMyTurn}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
