"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────
type Suit = "spades" | "hearts" | "diamonds" | "clubs";

interface Card {
  suit: Suit;
  value: number;
}

interface PokerPlayerState {
  id: string;
  name: string;
  chips: number;
  holeCards: (Card | null)[];
  currentBet: number;
  folded: boolean;
  allIn: boolean;
  eliminated: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  lastAction?: string;
  seatIndex: number;
  isCurrentPlayer: boolean;
}

interface ShowdownResult {
  playerId: string;
  playerName: string;
  holeCards: Card[];
  hand: { rank: number; name: string; cards: Card[] };
  won: boolean;
  chipsWon: number;
}

interface AvailableActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaiseTotal: number;
  maxRaiseTotal: number;
  canAllIn: boolean;
}

interface PokerState {
  phase: string;
  handNumber: number;
  maxHands: number;
  communityCards: Card[];
  pot: number;
  currentBetLevel: number;
  players: PokerPlayerState[];
  currentPlayerId: string | null;
  blinds: [number, number];
  timeLeft: number;
  showdownResults: ShowdownResult[];
  availableActions?: AvailableActions;
}

// ── Card Rendering Helpers ──────────────────────────────
const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

const SUIT_COLORS: Record<Suit, string> = {
  spades: "text-zinc-200",
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-zinc-200",
};

const VALUE_LABELS: Record<number, string> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10",
  11: "V", 12: "D", 13: "R", 14: "A",
};

// ── Card Component ──────────────────────────────────────
function CardView({
  card,
  size = "md",
  revealed = true,
  highlight = false,
}: {
  card: Card | null;
  size?: "sm" | "md" | "lg";
  revealed?: boolean;
  highlight?: boolean;
}) {
  const sizes = {
    sm: "w-8 h-11 text-[10px]",
    md: "w-11 h-16 text-sm",
    lg: "w-14 h-20 text-base",
  };

  if (!card || !revealed) {
    return (
      <div
        className={cn(
          sizes[size],
          "rounded-lg border border-white/[0.08] flex items-center justify-center",
          "bg-gradient-to-br from-blue-900/60 to-indigo-900/60 shadow-md",
          "select-none"
        )}
      >
        <span className="text-white/20 font-serif text-lg">?</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizes[size],
        "rounded-lg border flex flex-col items-center justify-center gap-0 font-mono font-bold shadow-md",
        "bg-white transition-all duration-300 select-none relative",
        highlight
          ? "border-amber-400/80 ring-1 ring-amber-400/40 shadow-amber-400/20 shadow-lg"
          : "border-zinc-300"
      )}
    >
      <span className={cn(SUIT_COLORS[card.suit], "leading-none")}>
        {VALUE_LABELS[card.value]}
      </span>
      <span className={cn(SUIT_COLORS[card.suit], "leading-none text-[0.7em]")}>
        {SUIT_SYMBOLS[card.suit]}
      </span>
    </div>
  );
}

// ── Chip Display ────────────────────────────────────────
function ChipCount({ amount, label }: { amount: number; label?: string }) {
  return (
    <div className="flex items-center gap-1">
      {label && (
        <span className="text-[10px] text-white/30 font-sans">{label}</span>
      )}
      <span className="font-mono text-amber-400 font-bold text-xs">
        {amount.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

// ── Badge (D/SB/BB) ────────────────────────────────────
function RoleBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={cn(
        "text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none select-none",
        color
      )}
    >
      {label}
    </span>
  );
}

// ── Player Seat ─────────────────────────────────────────
function PlayerSeat({
  player,
  isMe,
  showdownResult,
}: {
  player: PokerPlayerState;
  isMe: boolean;
  showdownResult?: ShowdownResult;
}) {
  const hasCards = player.holeCards && player.holeCards.length > 0;
  const isRevealed = hasCards && player.holeCards[0] !== null;
  const isWinner = showdownResult?.won;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-2 min-w-[100px] transition-all relative",
        player.eliminated && "opacity-30",
        player.folded && !player.eliminated && "opacity-40",
        player.isCurrentPlayer &&
          !player.folded &&
          !player.eliminated &&
          "border-amber-400/50 bg-amber-400/[0.06] ring-1 ring-amber-400/20",
        isWinner && "border-emerald-400/50 bg-emerald-400/[0.06] ring-1 ring-emerald-400/20",
        !player.isCurrentPlayer &&
          !isWinner &&
          !player.folded &&
          !player.eliminated &&
          "border-white/[0.08] bg-white/[0.03]",
        (player.folded || player.eliminated) &&
          "border-white/[0.04] bg-white/[0.01]",
        isMe && !player.isCurrentPlayer && !isWinner && "border-blue-500/30 bg-blue-500/[0.04]"
      )}
    >
      {/* Role badges */}
      <div className="flex gap-1 absolute -top-2 left-1/2 -translate-x-1/2">
        {player.isDealer && (
          <RoleBadge label="D" color="bg-yellow-500 text-black" />
        )}
        {player.isSmallBlind && (
          <RoleBadge label="SB" color="bg-blue-500/80 text-white" />
        )}
        {player.isBigBlind && (
          <RoleBadge label="BB" color="bg-purple-500/80 text-white" />
        )}
      </div>

      {/* Name */}
      <span
        className={cn(
          "text-xs font-medium truncate max-w-[90px] font-sans mt-1",
          isMe ? "text-blue-300" : "text-white/60"
        )}
      >
        {player.name}
        {isMe && " (toi)"}
      </span>

      {/* Hole cards */}
      {hasCards && !player.folded && (
        <div className="flex gap-0.5">
          {player.holeCards.map((card, i) => (
            <CardView
              key={i}
              card={card}
              size="sm"
              revealed={isRevealed}
              highlight={isWinner}
            />
          ))}
        </div>
      )}

      {/* Chips */}
      <ChipCount amount={player.chips} />

      {/* Current bet */}
      {player.currentBet > 0 && (
        <span className="text-[10px] text-amber-300/60 font-mono">
          Mise : {player.currentBet}
        </span>
      )}

      {/* Last action */}
      {player.lastAction && (
        <span
          className={cn(
            "text-[10px] font-sans px-1.5 py-0.5 rounded-full",
            player.lastAction === "Se couche"
              ? "text-red-400/70 bg-red-400/10"
              : player.lastAction === "Tapis"
                ? "text-orange-400 bg-orange-400/10 font-bold"
                : "text-white/40 bg-white/[0.04]"
          )}
        >
          {player.lastAction}
        </span>
      )}

      {/* Showdown hand name */}
      {showdownResult && (
        <div className="text-center mt-0.5">
          <span
            className={cn(
              "text-[10px] font-serif",
              isWinner ? "text-emerald-400" : "text-white/40"
            )}
          >
            {showdownResult.hand.name}
          </span>
          {isWinner && showdownResult.chipsWon > 0 && (
            <span className="block text-[10px] font-mono text-emerald-400 font-bold">
              +{showdownResult.chipsWon}
            </span>
          )}
        </div>
      )}

      {/* Eliminated label */}
      {player.eliminated && (
        <span className="text-[10px] text-red-400/60 font-sans">
          Eliminé
        </span>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────
export default function PokerGame({
  roomCode,
  playerId,
  playerName,
}: GameProps) {
  const { sendAction } = useGame(roomCode, "poker", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as PokerState;
  const [raiseAmount, setRaiseAmount] = useState(0);
  const prevHandRef = useRef(0);

  // Reset raise when hand changes
  useEffect(() => {
    if (state?.handNumber && state.handNumber !== prevHandRef.current) {
      prevHandRef.current = state.handNumber;
      setRaiseAmount(0);
    }
  }, [state?.handNumber]);

  // Set default raise amount when available actions change
  useEffect(() => {
    if (state?.availableActions?.minRaiseTotal) {
      setRaiseAmount(state.availableActions.minRaiseTotal);
    }
  }, [state?.availableActions?.minRaiseTotal]);

  const handleFold = useCallback(() => {
    sendAction({ action: "fold" });
  }, [sendAction]);

  const handleCheck = useCallback(() => {
    sendAction({ action: "check" });
  }, [sendAction]);

  const handleCall = useCallback(() => {
    sendAction({ action: "call" });
  }, [sendAction]);

  const handleRaise = useCallback(() => {
    sendAction({ action: "raise", amount: raiseAmount });
  }, [sendAction, raiseAmount]);

  const handleAllIn = useCallback(() => {
    sendAction({ action: "all-in" });
  }, [sendAction]);

  // ── Layout: arrange players around the table ──────
  const me = state?.players?.find((p) => p.id === playerId);
  const others = useMemo(
    () => state?.players?.filter((p) => p.id !== playerId) ?? [],
    [state?.players, playerId]
  );

  const topPlayers = others;

  // Get showdown result for a player
  const getShowdown = useCallback(
    (pid: string) => state?.showdownResults?.find((r) => r.playerId === pid),
    [state?.showdownResults]
  );

  const isMyTurn =
    state?.currentPlayerId === playerId &&
    state?.phase !== "showdown" &&
    state?.phase !== "hand-end" &&
    state?.phase !== "game-over";

  const actions = state?.availableActions;

  // ── Waiting ───────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="flex justify-center gap-2">
            {["\u2660", "\u2665", "\u2666", "\u2663"].map((s, i) => (
              <span
                key={s}
                className={cn(
                  "text-3xl animate-pulse",
                  i === 1 || i === 2 ? "text-red-500" : "text-white/40"
                )}
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-white/40 animate-pulse font-sans">
            En attente des joueurs...
          </p>
        </div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────
  if (state.phase === "game-over") {
    const sorted = [...state.players].sort((a, b) => b.chips - a.chips);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 min-h-[400px]">
        <h2 className="text-2xl font-serif text-white/90">Partie terminée</h2>
        <div className="w-full max-w-sm space-y-2">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 transition-all",
                i === 0
                  ? "border-amber-400/40 bg-amber-400/[0.06]"
                  : "border-white/[0.08] bg-white/[0.03]"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-lg font-mono font-bold w-6 text-center",
                    i === 0
                      ? "text-amber-400"
                      : i === 1
                        ? "text-zinc-300"
                        : i === 2
                          ? "text-orange-600"
                          : "text-white/30"
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-sans",
                    p.id === playerId ? "text-blue-300" : "text-white/70"
                  )}
                >
                  {p.name}
                  {p.id === playerId && " (toi)"}
                </span>
              </div>
              <ChipCount amount={p.chips} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main Game View ────────────────────────────────
  return (
    <div
      className="flex flex-1 flex-col min-h-[500px] p-3 gap-3 select-none"
      style={{
        background:
          "linear-gradient(180deg, #060606 0%, #0a0f05 50%, #060606 100%)",
      }}
    >
      {/* Header: hand info + blinds + timer */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/20 font-sans">
            Main {state.handNumber}/{state.maxHands}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40 font-sans">
            Blindes {state.blinds[0]}/{state.blinds[1]}
          </span>
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-sans font-medium",
              state.phase === "pre-flop" &&
                "border-blue-500/30 bg-blue-500/10 text-blue-400",
              state.phase === "flop" &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
              state.phase === "turn" &&
                "border-amber-500/30 bg-amber-500/10 text-amber-400",
              state.phase === "river" &&
                "border-red-500/30 bg-red-500/10 text-red-400",
              state.phase === "showdown" &&
                "border-purple-500/30 bg-purple-500/10 text-purple-400",
              state.phase === "hand-end" &&
                "border-white/[0.08] bg-white/[0.03] text-white/40"
            )}
          >
            {state.phase === "pre-flop" && "Pré-flop"}
            {state.phase === "flop" && "Flop"}
            {state.phase === "turn" && "Turn"}
            {state.phase === "river" && "River"}
            {state.phase === "showdown" && "Abattage"}
            {state.phase === "hand-end" && "Fin de main"}
            {state.phase === "deal" && "Distribution"}
          </span>
        </div>
        {isMyTurn && (
          <span
            className={cn(
              "text-sm font-mono font-bold",
              (state.timeLeft ?? 30) <= 10 ? "text-red-400" : "text-amber-400"
            )}
          >
            {state.timeLeft ?? 30}s
          </span>
        )}
      </div>

      {/* Timer bar (only when it is my turn) */}
      {isMyTurn && (
        <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden mx-2">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              (state.timeLeft ?? 30) <= 10 ? "bg-red-500" : "bg-amber-400"
            )}
            style={{ width: `${((state.timeLeft ?? 30) / 30) * 100}%` }}
          />
        </div>
      )}

      {/* Other players (top row) */}
      <div className="flex flex-wrap justify-center gap-2 px-2">
        {topPlayers.map((p) => (
          <PlayerSeat
            key={p.id}
            player={p}
            isMe={false}
            showdownResult={getShowdown(p.id)}
          />
        ))}
      </div>

      {/* Table center: pot + community cards */}
      <div className="flex flex-col items-center gap-3 py-4">
        {/* Pot */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06]">
          <span className="text-xs text-amber-400/60 font-sans">Pot</span>
          <span className="font-mono text-amber-400 font-bold text-sm">
            {state.pot.toLocaleString("fr-FR")}
          </span>
        </div>

        {/* Community cards */}
        <div className="flex items-center gap-1.5 min-h-[68px]">
          {state.communityCards.length === 0 && (
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-11 h-16 rounded-lg border border-dashed border-white/[0.06] bg-white/[0.02]"
                />
              ))}
            </div>
          )}
          {state.communityCards.map((card, i) => (
            <div
              key={i}
              className="animate-in fade-in slide-in-from-top-2 duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardView card={card} size="md" />
            </div>
          ))}
          {/* Empty slots for remaining cards */}
          {state.communityCards.length > 0 &&
            state.communityCards.length < 5 &&
            Array.from({ length: 5 - state.communityCards.length }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-11 h-16 rounded-lg border border-dashed border-white/[0.06] bg-white/[0.02]"
                />
              )
            )}
        </div>

        {/* Current bet level */}
        {state.currentBetLevel > 0 && (
          <span className="text-[10px] text-white/20 font-sans">
            Mise actuelle : {state.currentBetLevel}
          </span>
        )}
      </div>

      {/* Showdown results banner */}
      {(state.phase === "showdown" || state.phase === "hand-end") &&
        state.showdownResults.length > 0 && (
          <div className="mx-auto max-w-md w-full space-y-1.5 px-2">
            {state.showdownResults
              .filter((r) => r.won)
              .map((r) => (
                <div
                  key={r.playerId}
                  className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2"
                >
                  <div>
                    <span className="text-xs font-sans text-emerald-300">
                      {r.playerName} remporte{" "}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-xs">
                      {r.chipsWon}
                    </span>
                  </div>
                  <span className="text-[10px] font-serif text-emerald-300/70">
                    {r.hand.name}
                  </span>
                </div>
              ))}
          </div>
        )}

      {/* My seat + hole cards (large) */}
      {me && (
        <div className="flex flex-col items-center gap-2 mt-auto">
          <div className="flex items-center gap-2">
            {me.isDealer && (
              <RoleBadge label="D" color="bg-yellow-500 text-black" />
            )}
            {me.isSmallBlind && (
              <RoleBadge label="SB" color="bg-blue-500/80 text-white" />
            )}
            {me.isBigBlind && (
              <RoleBadge label="BB" color="bg-purple-500/80 text-white" />
            )}
            <span className="text-xs text-blue-300 font-sans font-medium">
              {me.name} (toi)
            </span>
            <ChipCount amount={me.chips} />
            {me.currentBet > 0 && (
              <span className="text-[10px] text-amber-300/60 font-mono">
                Mise : {me.currentBet}
              </span>
            )}
          </div>

          {/* My hole cards */}
          {me.holeCards.length > 0 && !me.folded && (
            <div className="flex gap-2">
              {me.holeCards.map((card, i) => (
                <CardView
                  key={i}
                  card={card}
                  size="lg"
                  revealed={card !== null}
                  highlight={getShowdown(playerId)?.won}
                />
              ))}
            </div>
          )}

          {me.folded && (
            <span className="text-xs text-red-400/50 font-sans">Couché</span>
          )}

          {/* Showdown result for me */}
          {getShowdown(playerId) && (
            <span
              className={cn(
                "text-xs font-serif",
                getShowdown(playerId)?.won
                  ? "text-emerald-400"
                  : "text-white/40"
              )}
            >
              {getShowdown(playerId)?.hand.name}
              {getShowdown(playerId)?.won &&
                ` (+${getShowdown(playerId)?.chipsWon})`}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      {isMyTurn && actions && me && !me.folded && !me.eliminated && (
        <div className="flex flex-col items-center gap-3 pb-2">
          {/* Raise slider */}
          {actions.canRaise && (
            <div className="flex items-center gap-3 w-full max-w-sm px-4">
              <span className="text-[10px] text-white/30 font-mono">
                {actions.minRaiseTotal}
              </span>
              <input
                type="range"
                min={actions.minRaiseTotal}
                max={actions.maxRaiseTotal}
                step={Math.max(1, Math.floor(state.blinds[1] / 2))}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(Number(e.target.value))}
                className="flex-1 accent-emerald-500 h-1.5 bg-white/[0.06] rounded-full cursor-pointer"
              />
              <span className="text-[10px] text-white/30 font-mono">
                {actions.maxRaiseTotal}
              </span>
            </div>
          )}

          {/* Buttons row */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Fold */}
            {actions.canFold && (
              <button
                onClick={handleFold}
                className="px-4 py-2.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-sans text-sm font-medium transition-all active:scale-95"
              >
                Se coucher
              </button>
            )}

            {/* Check */}
            {actions.canCheck && (
              <button
                onClick={handleCheck}
                className="px-4 py-2.5 rounded-lg bg-zinc-700/80 hover:bg-zinc-600 text-white font-sans text-sm font-medium transition-all active:scale-95"
              >
                Parole
              </button>
            )}

            {/* Call */}
            {actions.canCall && (
              <button
                onClick={handleCall}
                className="px-4 py-2.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white font-sans text-sm font-medium transition-all active:scale-95"
              >
                Suivre ({actions.callAmount})
              </button>
            )}

            {/* Raise */}
            {actions.canRaise && (
              <button
                onClick={handleRaise}
                className="px-4 py-2.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-sans text-sm font-medium transition-all active:scale-95"
              >
                Relancer ({raiseAmount})
              </button>
            )}

            {/* All-in */}
            {actions.canAllIn && (
              <button
                onClick={handleAllIn}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-sans text-sm font-bold transition-all active:scale-95",
                  "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white",
                  "shadow-md shadow-orange-600/20"
                )}
              >
                Tapis ({me.chips})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Waiting message when not my turn */}
      {!isMyTurn &&
        state.phase !== "showdown" &&
        state.phase !== "hand-end" &&
        state.phase !== "game-over" &&
        state.currentPlayerId && (
          <div className="text-center pb-2">
            <p className="text-xs text-white/20 font-sans animate-pulse">
              En attente de{" "}
              {state.players.find((p) => p.id === state.currentPlayerId)
                ?.name ?? "..."}
              ...
            </p>
          </div>
        )}

      {/* Hand-end waiting message */}
      {state.phase === "hand-end" && (
        <div className="text-center pb-2">
          <p className="text-xs text-white/20 font-sans animate-pulse">
            Prochaine main...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 font-sans text-center">{error}</p>
      )}
    </div>
  );
}
