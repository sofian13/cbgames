"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { PlayingCard, type Suit, type Rank } from "@/components/shared/playing-card";

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
  dealer: number;
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

const palette = ["#5BA3FF","#FF6A3D","#7E66FF","#E63CA0","#18A957","#E89A2B","#00B3A6","#E23434"];
const SUIT_RED = (s: Suit) => s === "♥" || s === "♦";

// ─── Shared layout helpers — navy table look (Belote.com style) ─────────────
function BoardBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex h-full w-full overflow-hidden"
      style={{
        background: "radial-gradient(120% 80% at 50% 40%, #1B2C6B 0%, #0A1230 70%, #060A1E 100%)",
      }}
    >
      {/* Suit pattern overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><g fill='%234A6BCF' fill-opacity='0.18'><text x='30' y='42' font-size='28' text-anchor='middle' font-family='serif'>♠</text><text x='90' y='42' font-size='28' text-anchor='middle' font-family='serif'>♥</text><text x='30' y='102' font-size='28' text-anchor='middle' font-family='serif'>♦</text><text x='90' y='102' font-size='28' text-anchor='middle' font-family='serif'>♣</text></g></svg>")`,
          backgroundSize: "120px 120px",
        }}
      />
      {/* Center vignette to focus the modal/trick */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 50% 45%, rgba(60,110,200,0.12), transparent 70%)" }}
      />
      {children}
    </div>
  );
}

function Scoreboard({ state, myTeam }: { state: ContreeState; myTeam: 0 | 1 }) {
  return (
    <div className="absolute left-4 top-4 z-30 rounded-2xl px-4 py-3"
         style={{
           background: "rgba(8,14,40,0.7)",
           border: "1px solid rgba(120,170,255,0.18)",
           boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
         }}>
      <div className="grid grid-cols-[20px_1fr_1fr] items-center gap-x-4 gap-y-1.5">
        <span className="col-span-1" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-display)" }}>tour</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-display)" }}>total</span>

        <span className="h-3 w-3 rounded-full" style={{ background: myTeam === 0 ? "#5BA3FF" : "#E23434", boxShadow: `0 0 8px ${myTeam === 0 ? "#5BA3FF" : "#E23434"}` }} />
        <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{state.pliCounts[0]}</span>
        <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{state.matchScore[0]}</span>

        <span className="h-3 w-3 rounded-full" style={{ background: myTeam === 1 ? "#5BA3FF" : "#E23434", boxShadow: `0 0 8px ${myTeam === 1 ? "#5BA3FF" : "#E23434"}` }} />
        <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{state.pliCounts[1]}</span>
        <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{state.matchScore[1]}</span>
      </div>
      {state.currentBid && (
        <div className="mt-2 border-t pt-2 text-[10px] font-bold tracking-wider"
             style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-display)" }}>
          CONTRAT <span className="text-white">{state.currentBid.amount}</span>
          <span className="ml-1" style={{ color: SUIT_RED(state.currentBid.suit) ? "#FF8C8C" : "#FFFFFF" }}>{state.currentBid.suit}</span>
          {state.currentBid.multiplier > 1 && <span className="ml-1 text-[var(--cb-social)]">×{state.currentBid.multiplier}</span>}
        </div>
      )}
    </div>
  );
}

function SeatAvatar({
  seat, position, isTurn, myTeam, dealerSeat, bubble,
}: {
  seat: Seat | undefined;
  position: "top" | "left" | "right";
  isTurn: boolean;
  myTeam: 0 | 1;
  dealerSeat?: number;
  bubble?: string | null;
}) {
  if (!seat) return null;
  const color = palette[seat.seatIndex];
  const isTeammate = seat.team === myTeam;
  const isBot = seat.id.startsWith("bot-");
  const isDealer = dealerSeat === seat.seatIndex;

  const posClass =
    position === "top"   ? "left-1/2 top-4 -translate-x-1/2" :
    position === "left"  ? "left-4 top-1/2 -translate-y-1/2" :
                           "right-4 top-1/2 -translate-y-1/2";

  return (
    <div className={`absolute z-20 flex flex-col items-center gap-1.5 ${posClass}`}>
      <div className="relative">
        {/* Glow ring when it's their turn */}
        {isTurn && (
          <span
            aria-hidden
            className="absolute -inset-2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}44, transparent 70%)`,
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
        )}
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: `linear-gradient(160deg, ${color}, ${color}cc)`,
            border: isTurn ? `2.5px solid #fff` : "2.5px solid rgba(255,255,255,0.25)",
            boxShadow: isTurn
              ? `0 0 0 3px ${color}88, 0 0 24px ${color}, 0 6px 14px rgba(0,0,0,0.45)`
              : "0 6px 14px rgba(0,0,0,0.45)",
          }}
        >
          {isBot ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="3" r="1"/><path d="M12 4v3"/><circle cx="8.5" cy="13" r="1.2" fill="#fff"/><circle cx="15.5" cy="13" r="1.2" fill="#fff"/>
            </svg>
          ) : (
            <span className="text-base font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
              {seat.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        {/* Card count badge */}
        <span
          className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white"
          style={{ background: "#0A1230", border: "1.5px solid rgba(255,255,255,0.25)", fontFamily: "var(--font-display)" }}
        >
          {seat.cardCount}
        </span>
        {/* Dealer chip */}
        {isDealer && (
          <span
            className="absolute -left-2 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white"
            style={{ background: "linear-gradient(180deg,#FF6A3D,#C13D1A)", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
          >
            D
          </span>
        )}
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[12px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          {seat.name}
        </span>
        <span className="text-[9px]" style={{ color: isTeammate ? "#5BA3FF" : "rgba(255,255,255,0.55)" }}>
          {isTeammate ? "coéquipier" : "adversaire"}
        </span>
      </div>
      {bubble && (
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold text-white whitespace-nowrap"
          style={{
            background: "linear-gradient(180deg, rgba(60,110,200,0.95), rgba(30,60,150,0.95))",
            border: "1px solid rgba(180,210,255,0.5)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            fontFamily: "var(--font-display)",
          }}
        >
          {bubble}
        </div>
      )}
    </div>
  );
}

function getBubble(seatId: string | undefined, state: ContreeState): string | null {
  if (!seatId) return null;
  if (state.phase !== "bidding") return null;
  if (state.currentBid?.bidder === seatId) {
    return `${state.currentBid.amount}${state.currentBid.suit}`;
  }
  return null;
}

function BottomHand({
  hand, onPlay, canPlay,
}: {
  hand: { rank: Rank; suit: Suit }[];
  onPlay: (idx: number) => void;
  canPlay: boolean;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 h-36">
      <div className="relative mx-auto" style={{ width: "100%", maxWidth: 820, height: 140 }}>
        {hand.map((c, i) => {
          const n = hand.length;
          const mid = (n - 1) / 2;
          const offset = i - mid;
          const spacing = Math.min(58, 600 / Math.max(1, n));
          const rot = offset * Math.min(4, 16 / Math.max(1, n - 1));
          const x = offset * spacing;
          const y = Math.abs(offset) * 2;
          return (
            <button
              key={i}
              onClick={() => canPlay && onPlay(i)}
              disabled={!canPlay}
              className="absolute outline-none transition-all duration-200 hover:-translate-y-3"
              style={{
                left: "50%", bottom: 8,
                transform: `translateX(${x - 32}px) translateY(${-y}px) rotate(${rot}deg)`,
                transformOrigin: "center 120px",
                zIndex: i,
                cursor: canPlay ? "pointer" : "not-allowed",
              }}
            >
              <PlayingCard
                value={c.rank as Rank}
                suit={c.suit as Suit}
                size="lg"
                dim={!canPlay}
                raised={canPlay}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

  // Render bidding UI — Belote.com style
  if (state.phase === "bidding") {
    const myTeam = me?.team ?? 0;
    const mySeatIdx = me?.seatIndex ?? 0;
    const seatBy = (offset: number) => state.seats.find((s) => s.seatIndex === (mySeatIdx + offset) % 4);
    const partnerSeat = seatBy(2);
    const rightOpp = seatBy(1);
    const leftOpp = seatBy(3);

    const amounts = [80, 90, 100, 110, 120, 130, 140, 150, 160];
    const minBid = state.currentBid ? state.currentBid.amount + 10 : 80;
    const validAmounts = amounts.filter((a) => a >= minBid);
    const curIdx = validAmounts.indexOf(bidAmount);
    const stepAmount = (dir: 1 | -1) => {
      const next = validAmounts[curIdx + dir];
      if (next) setBidAmount(next);
    };

    return (
      <BoardBackground>
        <Scoreboard state={state} myTeam={myTeam} />

        <SeatAvatar seat={partnerSeat} position="top"   isTurn={state.currentBidder === partnerSeat?.id} myTeam={myTeam} bubble={getBubble(partnerSeat?.id, state)} />
        <SeatAvatar seat={leftOpp}     position="left"  isTurn={state.currentBidder === leftOpp?.id}     myTeam={myTeam} dealerSeat={state.dealer} bubble={getBubble(leftOpp?.id, state)} />
        <SeatAvatar seat={rightOpp}    position="right" isTurn={state.currentBidder === rightOpp?.id}    myTeam={myTeam} dealerSeat={state.dealer} bubble={getBubble(rightOpp?.id, state)} />

        {/* Bidding modal */}
        <div
          className="absolute left-1/2 top-1/2 z-30 w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
          style={{
            background: "linear-gradient(180deg, rgba(40,70,150,0.55), rgba(20,38,90,0.7))",
            border: "1.5px solid rgba(120,170,255,0.35)",
            boxShadow: "0 0 60px rgba(80,140,255,0.25), 0 30px 80px rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Header — current top bid or "Enchères" */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-display)" }}>
              {state.currentBid ? `enchère par ${state.seats.find((s) => s.id === state.currentBid?.bidder)?.name ?? "?"}` : "à toi d'ouvrir"}
            </span>
            {state.currentBid && (
              <span className="flex items-center gap-1.5 text-sm font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
                {state.currentBid.amount}
                <span style={{ color: SUIT_RED(state.currentBid.suit) ? "#FF8C8C" : "#FFFFFF" }}>{state.currentBid.suit}</span>
                {state.currentBid.multiplier > 1 && (
                  <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--cb-social)" }}>
                    ×{state.currentBid.multiplier}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Amount stepper */}
          {isMyBid ? (
            <>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => stepAmount(-1)}
                  disabled={curIdx <= 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-white transition-all disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  aria-label="Montant inférieur"
                >
                  ‹
                </button>
                <div
                  className="flex h-14 w-28 items-center justify-center rounded-2xl text-3xl font-black text-white"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
                    border: "1.5px solid rgba(180,210,255,0.4)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 18px rgba(0,0,0,0.25)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {bidAmount}
                </div>
                <button
                  onClick={() => stepAmount(1)}
                  disabled={curIdx >= validAmounts.length - 1 || curIdx < 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-white transition-all disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  aria-label="Montant supérieur"
                >
                  ›
                </button>
                <button
                  onClick={() => setBidAmount(250)}
                  className="ml-2 rounded-full px-3 py-2 text-[11px] font-black"
                  style={{
                    background: bidAmount === 250 ? "var(--cb-cards)" : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.06em",
                    border: bidAmount === 250 ? "1.5px solid transparent" : "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  CAPOT
                </button>
                <button
                  onClick={() => setBidAmount(500)}
                  className="rounded-full px-3 py-2 text-[11px] font-black"
                  style={{
                    background: bidAmount === 500 ? "var(--cb-brand)" : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.06em",
                    border: bidAmount === 500 ? "1.5px solid transparent" : "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  GÉNÉRALE
                </button>
              </div>

              {/* Suit cards */}
              <div className="mt-5 flex justify-center gap-3">
                {(["♦","♠","♥","♣"] as Suit[]).map((s) => {
                  const active = bidSuit === s;
                  const red = SUIT_RED(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setBidSuit(s)}
                      className="flex h-16 w-12 items-center justify-center rounded-lg transition-transform hover:-translate-y-0.5"
                      style={{
                        background: "#FAFAF9",
                        border: active ? "3px solid #6BB1FF" : "2px solid transparent",
                        boxShadow: active ? "0 0 20px rgba(107,177,255,0.5)" : "0 3px 8px rgba(0,0,0,0.25)",
                      }}
                    >
                      <span className="text-3xl font-black" style={{ color: red ? "#E23434" : "#0A0A0A" }}>
                        {s}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={pass}
                  className="flex-1 rounded-2xl py-3 text-sm font-black tracking-widest transition-transform hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(180deg, #3B82F6, #1D4ED8)",
                    color: "#fff",
                    border: "1.5px solid rgba(180,210,255,0.5)",
                    fontFamily: "var(--font-display)",
                    boxShadow: "0 0 24px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                >
                  JE PASSE
                </button>
                {state.currentBid ? (
                  <>
                    <button
                      onClick={placeBid}
                      className="flex-1 rounded-2xl py-3 text-sm font-black tracking-widest transition-transform hover:-translate-y-0.5"
                      style={{
                        background: "linear-gradient(180deg, #22C55E, #15803D)",
                        color: "#fff",
                        border: "1.5px solid rgba(180,255,200,0.4)",
                        fontFamily: "var(--font-display)",
                        boxShadow: "0 0 24px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      ENCHÉRIR
                    </button>
                    <button
                      onClick={coincher}
                      className="flex-1 rounded-2xl py-3 text-sm font-black tracking-widest transition-transform hover:-translate-y-0.5"
                      style={{
                        background: "linear-gradient(180deg, #7F1D1D, #450A0A)",
                        color: "#fff",
                        border: "1.5px solid rgba(255,150,150,0.4)",
                        fontFamily: "var(--font-display)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                    >
                      CONTRE
                    </button>
                  </>
                ) : (
                  <button
                    onClick={placeBid}
                    className="flex-1 rounded-2xl py-3 text-sm font-black tracking-widest transition-transform hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(180deg, #22C55E, #15803D)",
                      color: "#fff",
                      border: "1.5px solid rgba(180,255,200,0.4)",
                      fontFamily: "var(--font-display)",
                      boxShadow: "0 0 24px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    ANNONCER
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>en cours</span>
              <div className="mt-2 text-base text-white" style={{ fontFamily: "var(--font-display)" }}>
                {state.seats.find((s) => s.id === state.currentBidder)?.name} réfléchit…
              </div>
            </div>
          )}
        </div>

        {/* Hand at the bottom */}
        <BottomHand hand={myHand} onPlay={() => {}} canPlay={false} />
      </BoardBackground>
    );
  }

  // Playing phase — same navy table look
  const myTeam = me?.team ?? 0;
  const mySeatIdx = me?.seatIndex ?? 0;
  const seatBy = (offset: number) => state.seats.find((s) => s.seatIndex === (mySeatIdx + offset) % 4);
  const partnerSeat = seatBy(2);
  const rightOpp = seatBy(1);
  const leftOpp = seatBy(3);

  const relPos = (seatIdx: number) => (seatIdx - mySeatIdx + 4) % 4;
  const trickPosStyle = (seatIdx: number): React.CSSProperties => {
    const r = relPos(seatIdx);
    if (r === 0) return { transform: "translate(-50%, 50px) rotate(0deg)" };
    if (r === 1) return { transform: "translate(70px, -50%) rotate(8deg)" };
    if (r === 2) return { transform: "translate(-50%, -130px) rotate(180deg)" };
    return { transform: "translate(-170px, -50%) rotate(-8deg)" };
  };

  return (
    <BoardBackground>
      <Scoreboard state={state} myTeam={myTeam} />

      <SeatAvatar seat={partnerSeat} position="top"   isTurn={state.currentPlayerId === partnerSeat?.id} myTeam={myTeam} />
      <SeatAvatar seat={leftOpp}     position="left"  isTurn={state.currentPlayerId === leftOpp?.id}     myTeam={myTeam} dealerSeat={state.dealer} />
      <SeatAvatar seat={rightOpp}    position="right" isTurn={state.currentPlayerId === rightOpp?.id}    myTeam={myTeam} dealerSeat={state.dealer} />

      {/* Trump chip + timer (top right) */}
      <div className="absolute right-4 top-4 z-30 flex flex-col items-end gap-2">
        {state.trumpSuit && (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(180deg, #18A957, #0F7A3D)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              boxShadow: "0 0 24px rgba(24,169,87,0.5)",
            }}
            aria-label={`atout ${state.trumpSuit}`}
          >
            <span className="text-2xl font-black"
                  style={{ color: SUIT_RED(state.trumpSuit) ? "#FFE4E4" : "#FFFFFF", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              {state.trumpSuit}
            </span>
          </div>
        )}
        {isMyTurn && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full text-base font-black text-white"
               style={{
                 background: state.timeLeft <= 5
                   ? "radial-gradient(circle, #FF3D3D, #C81818)"
                   : "radial-gradient(circle, #FF8E58, #C13D1A)",
                 border: "2px solid rgba(255,255,255,0.3)",
                 boxShadow: "0 0 24px rgba(255,140,90,0.6)",
                 fontFamily: "var(--font-display)",
               }}>
            {state.timeLeft}s
          </div>
        )}
      </div>

      {showBelote && (
        <div className="absolute left-4 bottom-44 z-30 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
             style={{
               background: "rgba(24,169,87,0.25)",
               borderColor: "rgba(24,169,87,0.6)",
               color: "#A8F5C0",
               fontFamily: "var(--font-display)",
             }}>
          <span>♥</span>
          <span className="font-bold">BELOTE-REBELOTE +20</span>
        </div>
      )}

      {/* Trick area in center */}
      <div className="absolute left-1/2 top-1/2 z-10 h-0 w-0">
        {state.trick.length === 0 && (
          <span
            className="absolute whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{
              left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              color: "rgba(180,210,255,0.45)",
              fontFamily: "var(--font-display)",
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
              filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.45))",
            }}
          >
            <PlayingCard
              value={t.card.rank as Rank}
              suit={t.card.suit as Suit}
              size="lg"
              raised
            />
          </div>
        ))}
      </div>

      <BottomHand hand={myHand} onPlay={playCard} canPlay={isMyTurn} />
    </BoardBackground>
  );
}
