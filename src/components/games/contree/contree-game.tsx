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
  const { sendAction, sendRaw } = useGame(roomCode, "contree", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as unknown as ContreeState | null;

  // Bidding UI state
  const [bidAmount, setBidAmount] = useState(80);
  const [bidSuit, setBidSuit] = useState<Suit>("♥");

  const myHand = state?.hands?.[playerId] ?? [];
  const me = state?.seats?.find((s) => s.id === playerId);
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
        <button
          onClick={() => sendRaw({ type: "start-with-bots" })}
          className="mt-6 rounded-xl px-5 py-3 text-sm font-black"
          style={{ background: "var(--cb-brand)", color: "var(--cb-brand-ink)", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
        >
          Lancer avec bots
        </button>
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

  // Playing phase — landscape table layout
  const myTeam = me?.team ?? 0;
  const mySeatIdx = me?.seatIndex ?? 0;
  const seatBy = (offset: number) => state.seats.find((s) => s.seatIndex === (mySeatIdx + offset) % 4);
  const partnerSeat = seatBy(2);
  const rightOpp = seatBy(1);
  const leftOpp = seatBy(3);

  // Relative position of each seat from my POV (0=bottom, 1=right, 2=top, 3=left)
  const relPos = (seatIdx: number) => (seatIdx - mySeatIdx + 4) % 4;
  const trickPosStyle = (seatIdx: number): React.CSSProperties => {
    const r = relPos(seatIdx);
    if (r === 0) return { transform: "translate(-50%, 30px) rotate(0deg)" };
    if (r === 1) return { transform: "translate(40px, -50%) rotate(90deg)" };
    if (r === 2) return { transform: "translate(-50%, -110px) rotate(180deg)" };
    return { transform: "translate(-140px, -50%) rotate(270deg)" };
  };

  const Avatar = ({ seat, position }: { seat: Seat | undefined; position: "top" | "left" | "right" }) => {
    if (!seat) return null;
    const isTurn = state.currentPlayerId === seat.id;
    const isTeammate = seat.team === myTeam;
    const color = palette[seat.seatIndex];
    const posClass =
      position === "top"   ? "left-1/2 top-4 -translate-x-1/2 flex-col items-center" :
      position === "left"  ? "left-4 top-1/2 -translate-y-1/2 flex-col items-center" :
                             "right-4 top-1/2 -translate-y-1/2 flex-col items-center";
    return (
      <div className={`absolute z-20 flex gap-1.5 ${posClass}`}>
        <div className="relative">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full transition-shadow"
            style={{
              background: color, color: "#fff",
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16,
              boxShadow: isTurn
                ? `0 0 0 3px ${color}, 0 0 24px ${color}aa`
                : "0 4px 12px rgba(0,0,0,0.35)",
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          >
            {seat.name.slice(0, 2).toUpperCase()}
          </span>
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] font-black"
            style={{
              background: "rgba(0,0,0,0.7)", color: "#fff",
              fontFamily: "var(--font-display)",
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
          >
            {seat.cardCount}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            {seat.name}
          </span>
          <span className="text-[9px]" style={{ color: isTeammate ? "var(--cb-strategy)" : "rgba(255,255,255,0.5)" }}>
            {isTeammate ? "coéquipier" : "adv."}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Felt table background — full bleed */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(140% 90% at 50% 50%, #1F5A3D 0%, #0D2A1B 80%)",
        }}
      />
      {/* Suit pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><text x='40' y='52' font-size='40' text-anchor='middle' fill='%23ffffff' font-family='serif'>${state.trumpSuit ?? "♣"}</text></svg>")`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Top bar: contrat + scores */}
      <div className="relative z-30 mx-3 mt-2 flex items-center gap-2">
        <div className="rounded-xl px-3 py-2"
             style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>contrat</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
              {state.currentBid?.amount}
            </span>
            <span className="text-xl font-black"
                  style={{ color: SUIT_RED(state.trumpSuit!) ? "#FF8888" : "#FFFFFF" }}>
              {state.trumpSuit}
            </span>
            {state.currentBid && state.currentBid.multiplier > 1 && (
              <span className="ml-1 rounded px-1 text-[9px] font-bold"
                    style={{ background: "var(--cb-social)", color: "#fff" }}>
                ×{state.currentBid.multiplier}
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto flex gap-2 rounded-xl px-3 py-2"
             style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-center">
            <span className="cb-eyebrow block" style={{ color: "rgba(255,255,255,0.5)" }}>nous</span>
            <span className="text-lg font-black" style={{ color: "var(--cb-strategy)", fontFamily: "var(--font-display)" }}>
              {state.matchScore[myTeam]}
            </span>
          </div>
          <div className="w-px" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="text-center">
            <span className="cb-eyebrow block" style={{ color: "rgba(255,255,255,0.5)" }}>eux</span>
            <span className="text-lg font-black" style={{ color: "var(--cb-social)", fontFamily: "var(--font-display)" }}>
              {state.matchScore[1 - myTeam]}
            </span>
          </div>
        </div>

        {isMyTurn && (
          <div className="rounded-full px-3 py-1.5 text-sm font-black"
               style={{
                 background: state.timeLeft <= 5 ? "var(--cb-social)" : "var(--cb-brand)",
                 color: "#fff",
                 fontFamily: "var(--font-display)",
               }}>
            {state.timeLeft}s
          </div>
        )}
      </div>

      {showBelote && (
        <div className="relative z-30 mx-3 mt-2 inline-flex self-start items-center gap-2 rounded-full border px-3 py-1 text-xs"
             style={{
               background: "rgba(24,169,87,0.18)",
               borderColor: "rgba(24,169,87,0.45)",
               color: "var(--cb-strategy)",
             }}>
          <span>♥</span>
          <span className="font-bold" style={{ fontFamily: "var(--font-display)" }}>
            BELOTE-REBELOTE
          </span>
          <span className="cb-mono font-bold">+20</span>
        </div>
      )}

      {/* Center playing area */}
      <div className="relative z-10 flex-1">
        {/* 3 opponents */}
        <Avatar seat={partnerSeat} position="top" />
        <Avatar seat={leftOpp} position="left" />
        <Avatar seat={rightOpp} position="right" />

        {/* Trick area — cards positioned by seat */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0">
          {state.trick.length === 0 && (
            <span
              className="cb-eyebrow whitespace-nowrap"
              style={{
                position: "absolute",
                left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.14em",
              }}
            >
              {isMyTurn ? "à toi de jouer" : "en attente"}
            </span>
          )}
          {state.trick.map((t, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%", top: "50%",
                ...trickPosStyle(t.seat),
                zIndex: 10 + i,
              }}
            >
              <PlayingCard
                value={t.card.rank as Rank}
                suit={t.card.suit as Suit}
                size="md"
                raised
              />
            </div>
          ))}
        </div>

        {/* Tricks counter (bottom corners of felt) */}
        <div className="absolute bottom-3 left-3 text-[10px] font-bold tracking-wider"
             style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-display)" }}>
          plis nous · <span style={{ color: "var(--cb-strategy)" }}>{state.pliCounts[myTeam]}</span>
        </div>
        <div className="absolute bottom-3 right-3 text-[10px] font-bold tracking-wider"
             style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-display)" }}>
          eux · <span style={{ color: "var(--cb-social)" }}>{state.pliCounts[1 - myTeam]}</span>
        </div>
      </div>

      {/* My hand — fan at the bottom */}
      <div className="relative z-20 h-36">
        <div
          className="relative mx-auto"
          style={{ width: "100%", maxWidth: 720, height: 140 }}
        >
          {myHand.map((c, i) => {
            const n = myHand.length;
            const mid = (n - 1) / 2;
            const offset = i - mid;
            const spacing = Math.min(56, 600 / Math.max(1, n));
            const rot = offset * Math.min(5, 22 / Math.max(1, n - 1));
            const x = offset * spacing;
            const y = Math.abs(offset) * 3;
            return (
              <button
                key={i}
                onClick={() => isMyTurn && playCard(i)}
                disabled={!isMyTurn}
                className="absolute outline-none transition-all duration-200 hover:-translate-y-3"
                style={{
                  left: "50%", bottom: 0,
                  transform: `translateX(${x - 28}px) translateY(${-y}px) rotate(${rot}deg)`,
                  transformOrigin: "center 110px",
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
