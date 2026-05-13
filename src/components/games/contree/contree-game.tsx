"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  trickLeadSuit: Suit | null;
  lastTrickWinnerSeat: number | null;
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

function isLegalLocal(
  card: { rank: Rank; suit: Suit },
  state: ContreeState,
  hand: { rank: Rank; suit: Suit }[],
): boolean {
  if (state.phase !== "playing") return false;
  if (state.trick.length === 0) return true;
  const lead = state.trickLeadSuit ?? state.trick[0].card.suit;
  if (card.suit === lead) return true;
  const hasLead = hand.some((c) => c.suit === lead);
  if (hasLead) return false;
  return true;
}

// ─── Shared layout helpers — navy table look (Belote.com style) ─────────────
function BoardBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
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
  const pli = state.pliCounts ?? [0, 0];
  const score = state.matchScore ?? [0, 0];
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
        <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{pli[0]}</span>
        <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{score[0]}</span>

        <span className="h-3 w-3 rounded-full" style={{ background: myTeam === 1 ? "#5BA3FF" : "#E23434", boxShadow: `0 0 8px ${myTeam === 1 ? "#5BA3FF" : "#E23434"}` }} />
        <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{pli[1]}</span>
        <span className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{score[1]}</span>
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
  hand, onPlay, canPlay, isLegal, zIndex = 40,
}: {
  hand: { rank: Rank; suit: Suit }[];
  onPlay: (idx: number) => void;
  canPlay: boolean;
  isLegal?: (card: { rank: Rank; suit: Suit }) => boolean;
  zIndex?: number;
}) {
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const startPress = (idx: number) => {
    if (pressTimer) clearTimeout(pressTimer);
    const t = setTimeout(() => setZoomIdx(idx), 350);
    setPressTimer(t);
  };
  const endPress = () => {
    if (pressTimer) { clearTimeout(pressTimer); setPressTimer(null); }
    setTimeout(() => setZoomIdx(null), 80);
  };

  return (
    <>
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{ zIndex }}
      >
        <div
          className="relative mx-auto"
          style={{
            width: "100%",
            maxWidth: 820,
            height: 168,
            pointerEvents: canPlay || isLegal ? "auto" : "none",
          }}
        >
          {hand.length === 0 && (
            <div className="absolute left-1/2 bottom-6 -translate-x-1/2 text-[10px] uppercase tracking-[0.18em]"
                 style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-display)" }}>
              en attente de distribution
            </div>
          )}
          {hand.map((c, i) => {
            const n = hand.length;
            const mid = (n - 1) / 2;
            const offset = i - mid;
            const spacing = Math.min(58, 620 / Math.max(1, n));
            const rot = offset * Math.min(4, 16 / Math.max(1, n - 1));
            const x = offset * spacing;
            const y = Math.abs(offset) * 2;
            const playable = canPlay && (isLegal ? isLegal(c) : true);
            const dim = !playable;
            return (
              <button
                key={`${c.rank}${c.suit}-${i}`}
                onClick={() => playable && onPlay(i)}
                onPointerDown={() => startPress(i)}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                onContextMenu={(e) => e.preventDefault()}
                disabled={!playable}
                className="absolute outline-none transition-all duration-300 ease-out hover:-translate-y-4 focus-visible:-translate-y-4"
                style={{
                  left: "50%", bottom: 16,
                  transform: `translateX(${x - 32}px) translateY(${-y}px) rotate(${rot}deg)`,
                  transformOrigin: "center 140px",
                  zIndex: i,
                  cursor: playable ? "pointer" : "default",
                  touchAction: "manipulation",
                  filter: playable
                    ? "drop-shadow(0 0 10px rgba(140,255,170,0.45))"
                    : (canPlay ? "saturate(0.4) brightness(0.7)" : "none"),
                }}
              >
                <PlayingCard
                  value={c.rank as Rank}
                  suit={c.suit as Suit}
                  size="lg"
                  dim={dim && canPlay}
                  raised={playable}
                />
              </button>
            );
          })}
        </div>
      </div>

      {zoomIdx !== null && hand[zoomIdx] && (
        <div
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div
            style={{
              transform: "scale(2.2)",
              filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
              transition: "transform 200ms ease-out",
            }}
          >
            <PlayingCard
              value={hand[zoomIdx].rank as Rank}
              suit={hand[zoomIdx].suit as Suit}
              size="lg"
              raised
            />
          </div>
        </div>
      )}
    </>
  );
}

function SettingsMenu({ onLeave, onReplay }: { onLeave: () => void; onReplay?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute right-4 top-4 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="paramètres"
        className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          background: "rgba(8,14,40,0.85)",
          border: "1.5px solid rgba(120,170,255,0.3)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
      {open && (
        <>
          <button
            onClick={() => setOpen(false)}
            aria-label="fermer"
            className="fixed inset-0 z-0"
            style={{ background: "transparent" }}
          />
          <div
            className="absolute right-0 top-12 z-10 w-48 overflow-hidden rounded-xl"
            style={{
              background: "rgba(8,14,40,0.95)",
              border: "1px solid rgba(120,170,255,0.3)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              backdropFilter: "blur(12px)",
            }}
          >
            {onReplay && (
              <button
                onClick={() => { setOpen(false); onReplay(); }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                Rejouer
              </button>
            )}
            <button
              onClick={() => { setOpen(false); onLeave(); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/10"
              style={{ color: "#FF8E70", fontFamily: "var(--font-display)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Quitter la partie
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ContreeGame({ roomCode, playerId, playerName }: GameProps) {
  const router = useRouter();
  const { sendAction, sendRaw } = useGame(roomCode, "contree", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as unknown as ContreeState | null;
  const leaveGame = () => router.push(`/room/${roomCode}`);

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
      <BoardBackground>
        <SettingsMenu onLeave={leaveGame} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>en attente</span>
          <h2 className="cb-display-lg mt-2">Distribution…</h2>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            4 joueurs nécessaires · 2v2
          </p>
          <button
            onClick={() => sendRaw({ type: "start-with-bots" })}
            className="mt-8 rounded-2xl px-6 py-3 text-sm font-black tracking-widest transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(180deg, #3B82F6, #1D4ED8)",
              color: "#fff",
              border: "1.5px solid rgba(180,210,255,0.5)",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 24px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            LANCER AVEC BOTS
          </button>
        </div>
      </BoardBackground>
    );
  }

  if (state.phase === "match-over") {
    return (
      <BoardBackground>
        <SettingsMenu onLeave={leaveGame} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>partie terminée</span>
          <h2 className="cb-display-lg mt-2" style={{ fontFamily: "var(--font-display)" }}>
            {state.matchScore[0] > state.matchScore[1] ? "Équipe A gagne" : "Équipe B gagne"}
          </h2>
          <p className="mt-3 cb-mono text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            {state.matchScore[0]} – {state.matchScore[1]}
          </p>
        </div>
      </BoardBackground>
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
        <SettingsMenu onLeave={leaveGame} />
        <Scoreboard state={state} myTeam={myTeam} />

        <SeatAvatar seat={partnerSeat} position="top"   isTurn={state.currentBidder === partnerSeat?.id} myTeam={myTeam} bubble={getBubble(partnerSeat?.id, state)} />
        <SeatAvatar seat={leftOpp}     position="left"  isTurn={state.currentBidder === leftOpp?.id}     myTeam={myTeam} dealerSeat={state.dealer} bubble={getBubble(leftOpp?.id, state)} />
        <SeatAvatar seat={rightOpp}    position="right" isTurn={state.currentBidder === rightOpp?.id}    myTeam={myTeam} dealerSeat={state.dealer} bubble={getBubble(rightOpp?.id, state)} />

        {/* Bidding modal — compact mobile-first */}
        <div
          className="absolute left-1/2 z-[55] w-[88%] max-w-md -translate-x-1/2 rounded-2xl p-4 sm:p-5"
          style={{
            top: "44%",
            transform: "translate(-50%, -50%)",
            background: "linear-gradient(180deg, rgba(40,70,150,0.65), rgba(20,38,90,0.78))",
            border: "1.5px solid rgba(120,170,255,0.35)",
            boxShadow: "0 0 60px rgba(80,140,255,0.25), 0 30px 80px rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header — current top bid or "Enchères" */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-display)" }}>
              {state.currentBid ? `par ${state.seats.find((s) => s.id === state.currentBid?.bidder)?.name ?? "?"}` : "à toi d'ouvrir"}
            </span>
            {state.currentBid && (
              <span className="flex items-center gap-1 text-xs font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
                {state.currentBid.amount}
                <span style={{ color: SUIT_RED(state.currentBid.suit) ? "#FF8C8C" : "#FFFFFF" }}>{state.currentBid.suit}</span>
                {state.currentBid.multiplier > 1 && (
                  <span className="ml-1 rounded px-1 py-0.5 text-[9px] font-bold" style={{ background: "var(--cb-social)" }}>
                    ×{state.currentBid.multiplier}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Amount stepper */}
          {isMyBid ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => stepAmount(-1)}
                  disabled={curIdx <= 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white transition-all disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  aria-label="Montant inférieur"
                >
                  ‹
                </button>
                <div
                  className="flex h-12 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white"
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
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white transition-all disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  aria-label="Montant supérieur"
                >
                  ›
                </button>
                <button
                  onClick={() => setBidAmount(250)}
                  className="ml-1 rounded-full px-2.5 py-1.5 text-[10px] font-black"
                  style={{
                    background: bidAmount === 250 ? "var(--cb-cards)" : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.04em",
                    border: bidAmount === 250 ? "1.5px solid transparent" : "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  CAPOT
                </button>
                <button
                  onClick={() => setBidAmount(500)}
                  className="rounded-full px-2.5 py-1.5 text-[10px] font-black"
                  style={{
                    background: bidAmount === 500 ? "var(--cb-brand)" : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.04em",
                    border: bidAmount === 500 ? "1.5px solid transparent" : "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  GÉN.
                </button>
              </div>

              {/* Suit cards */}
              <div className="mt-4 flex justify-center gap-2">
                {(["♦","♠","♥","♣"] as Suit[]).map((s) => {
                  const active = bidSuit === s;
                  const red = SUIT_RED(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setBidSuit(s)}
                      className="flex h-12 w-10 items-center justify-center rounded-md transition-transform active:scale-95"
                      style={{
                        background: "#FAFAF9",
                        border: active ? "3px solid #6BB1FF" : "2px solid transparent",
                        boxShadow: active ? "0 0 16px rgba(107,177,255,0.5)" : "0 2px 6px rgba(0,0,0,0.25)",
                      }}
                    >
                      <span className="text-2xl font-black" style={{ color: red ? "#E23434" : "#0A0A0A" }}>
                        {s}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={pass}
                  className="flex-1 rounded-xl py-2.5 text-xs font-black tracking-widest transition-transform active:scale-95"
                  style={{
                    background: "linear-gradient(180deg, #3B82F6, #1D4ED8)",
                    color: "#fff",
                    border: "1.5px solid rgba(180,210,255,0.5)",
                    fontFamily: "var(--font-display)",
                    boxShadow: "0 0 18px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                >
                  PASSE
                </button>
                {state.currentBid ? (
                  <>
                    <button
                      onClick={placeBid}
                      className="flex-1 rounded-xl py-2.5 text-xs font-black tracking-widest transition-transform active:scale-95"
                      style={{
                        background: "linear-gradient(180deg, #22C55E, #15803D)",
                        color: "#fff",
                        border: "1.5px solid rgba(180,255,200,0.4)",
                        fontFamily: "var(--font-display)",
                        boxShadow: "0 0 18px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      ENCHÉRIR
                    </button>
                    <button
                      onClick={coincher}
                      className="flex-1 rounded-xl py-2.5 text-xs font-black tracking-widest transition-transform active:scale-95"
                      style={{
                        background: "linear-gradient(180deg, #B91C1C, #7F1D1D)",
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
                    className="flex-1 rounded-xl py-2.5 text-xs font-black tracking-widest transition-transform active:scale-95"
                    style={{
                      background: "linear-gradient(180deg, #22C55E, #15803D)",
                      color: "#fff",
                      border: "1.5px solid rgba(180,255,200,0.4)",
                      fontFamily: "var(--font-display)",
                      boxShadow: "0 0 18px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    ANNONCER
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-5 text-center">
              <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>en cours</span>
              <div className="mt-1 text-sm text-white" style={{ fontFamily: "var(--font-display)" }}>
                {state.seats.find((s) => s.id === state.currentBidder)?.name} réfléchit…
              </div>
            </div>
          )}
        </div>

        {/* Hand at the bottom — z-30 (below modal z-55) */}
        <BottomHand hand={myHand} onPlay={() => {}} canPlay={false} zIndex={30} />
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
      <SettingsMenu onLeave={leaveGame} />
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
        {state.trick.map((t, i) => {
          const winnerSeat = state.lastTrickWinnerSeat;
          const collected = winnerSeat !== null;
          const finalStyle = collected
            ? trickPosStyle(winnerSeat)
            : trickPosStyle(t.seat);
          return (
            <div
              key={`${t.card.rank}${t.card.suit}-${t.seat}`}
              style={{
                position: "absolute",
                left: "50%", top: "50%",
                ...finalStyle,
                zIndex: 10 + i,
                filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.45))",
                opacity: collected ? 0 : 1,
                transition: "transform 700ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 700ms ease-out 200ms",
              }}
            >
              <PlayingCard
                value={t.card.rank as Rank}
                suit={t.card.suit as Suit}
                size="lg"
                raised
              />
            </div>
          );
        })}
      </div>

      <BottomHand
        hand={myHand}
        onPlay={playCard}
        canPlay={isMyTurn && state.lastTrickWinnerSeat === null}
        isLegal={(c) => isLegalLocal(c, state, myHand)}
      />
    </BoardBackground>
  );
}
