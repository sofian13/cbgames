"use client";

import { useCallback, useMemo } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

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
  spades: "text-zinc-800",
  hearts: "text-red-600",
  diamonds: "text-red-600",
  clubs: "text-zinc-800",
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
    sm: "w-9 h-12 text-[10px]",
    md: "w-12 h-[68px] text-sm",
    lg: "w-16 h-[88px] text-lg",
  };

  if (!card || !revealed) {
    return (
      <div
        className={cn(
          sizes[size],
          "rounded-xl border border-amber-900/40 flex items-center justify-center",
          "bg-gradient-to-br from-emerald-950 via-emerald-900/80 to-green-950 shadow-lg",
          "select-none",
          "shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
        )}
      >
        <div className="w-[70%] h-[70%] rounded-md border border-amber-700/30 bg-gradient-to-br from-amber-900/20 to-emerald-900/30 flex items-center justify-center">
          <span className="text-amber-600/40 font-serif text-sm">AF</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizes[size],
        "rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 font-mono font-bold",
        "bg-gradient-to-br from-white via-gray-50 to-gray-100 transition-all duration-300 select-none relative overflow-hidden",
        highlight
          ? "border-amber-400/90 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
          : "border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
      )}
    >
      <span className={cn(SUIT_COLORS[card.suit], "leading-none drop-shadow-sm")}>
        {VALUE_LABELS[card.value]}
      </span>
      <span className={cn(SUIT_COLORS[card.suit], "leading-none text-[0.75em] drop-shadow-sm")}>
        {SUIT_SYMBOLS[card.suit]}
      </span>
    </div>
  );
}

// ── Chip Display ────────────────────────────────────────
function ChipCount({ amount, label }: { amount: number; label?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-[10px] text-white/40 font-sans">{label}</span>
      )}
      <span className="font-mono text-amber-400 font-bold text-xs drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]">
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
        "text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none select-none shadow-md",
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
        "flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 min-w-[110px] transition-all relative",
        "backdrop-blur-sm",
        player.eliminated && "opacity-30",
        player.folded && !player.eliminated && "opacity-40",
        player.isCurrentPlayer &&
          !player.folded &&
          !player.eliminated &&
          "border-amber-400/50 bg-amber-400/[0.08] ring-1 ring-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]",
        isWinner && "border-emerald-400/60 bg-emerald-400/[0.08] ring-1 ring-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.2)]",
        !player.isCurrentPlayer &&
          !isWinner &&
          !player.folded &&
          !player.eliminated &&
          "border-white/[0.12] bg-black/30",
        (player.folded || player.eliminated) &&
          "border-white/[0.06] bg-black/20",
        isMe && !player.isCurrentPlayer && !isWinner && "border-emerald-500/30 bg-emerald-500/[0.06]"
      )}
    >
      {/* Role badges */}
      <div className="flex gap-1 absolute -top-2.5 left-1/2 -translate-x-1/2">
        {player.isDealer && (
          <RoleBadge label="D" color="bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
        )}
        {player.isSmallBlind && (
          <RoleBadge label="SB" color="bg-gradient-to-r from-blue-500 to-blue-600 text-white" />
        )}
        {player.isBigBlind && (
          <RoleBadge label="BB" color="bg-gradient-to-r from-purple-500 to-purple-600 text-white" />
        )}
      </div>

      {/* Name */}
      <span
        className={cn(
          "text-xs font-medium truncate max-w-[90px] font-sans mt-1",
          isMe ? "text-emerald-300" : "text-white/60"
        )}
      >
        {player.name}
        {isMe && " (toi)"}
      </span>

      {/* Hole cards */}
      {hasCards && !player.folded && (
        <div className="flex gap-1">
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
            "text-[10px] font-sans px-2 py-0.5 rounded-full",
            player.lastAction === "Se couche"
              ? "text-red-400/80 bg-red-400/10 border border-red-400/20"
              : player.lastAction === "Tapis"
                ? "text-amber-300 bg-amber-300/10 border border-amber-300/20 font-bold"
                : "text-white/40 bg-white/[0.05] border border-white/[0.08]"
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
            <span className="block text-[10px] font-mono text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
              +{showdownResult.chipsWon}
            </span>
          )}
        </div>
      )}

      {/* Eliminated label */}
      {player.eliminated && (
        <span className="text-[10px] text-red-400/60 font-sans">
          Elimine
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
  const raiseKey = `${state?.handNumber ?? 0}-${state?.availableActions?.minRaiseTotal ?? 0}`;
  const [raiseAmount, setRaiseAmount] = useKeyedState<number>(
    raiseKey,
    () => state?.availableActions?.minRaiseTotal ?? 0
  );

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
      <div
        className="flex flex-1 items-center justify-center min-h-[400px]"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(16,80,50,0.5), transparent 60%), linear-gradient(180deg, #050a05 0%, #0a1a0e 50%, #050a05 100%)",
        }}
      >
        <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-10 text-center space-y-4">
          <div className="flex justify-center gap-3">
            {["\u2660", "\u2665", "\u2666", "\u2663"].map((s, i) => (
              <span
                key={s}
                className={cn(
                  "text-4xl font-serif animate-pulse",
                  i === 1 || i === 2 ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "text-amber-400/60 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                )}
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-white/40 animate-pulse font-sans text-lg">
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
      <div
        className="flex flex-1 flex-col items-center justify-center gap-6 p-6 min-h-[400px]"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(251,191,36,0.12), transparent 50%), radial-gradient(circle at 50% 75%, rgba(16,80,50,0.4), transparent 50%), linear-gradient(180deg, #050a05 0%, #0a1a0e 50%, #050a05 100%)",
        }}
      >
        <h2 className="text-3xl font-serif text-white/90 drop-shadow-[0_0_20px_rgba(251,191,36,0.25)]">
          Partie terminee
        </h2>
        <div className="w-full max-w-sm space-y-2.5">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-3.5 transition-all backdrop-blur-sm",
                i === 0
                  ? "border-amber-400/50 bg-amber-400/[0.08] shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                  : "border-white/[0.12] bg-black/30"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-xl font-mono font-bold w-7 text-center",
                    i === 0
                      ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                      : i === 1
                        ? "text-zinc-300"
                        : i === 2
                          ? "text-amber-700"
                          : "text-white/25"
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-sans",
                    p.id === playerId ? "text-emerald-300" : "text-white/70"
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
          "radial-gradient(circle at 50% 40%, rgba(16,80,50,0.5), transparent 55%), radial-gradient(circle at 80% 20%, rgba(251,191,36,0.06), transparent 40%), linear-gradient(180deg, #050a05 0%, #0a1a0e 50%, #050a05 100%)",
      }}
    >
      {/* Header: hand info + blinds + timer */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/25 font-sans">
            Main {state.handNumber}/{state.maxHands}
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/[0.06] text-amber-400/70 font-sans">
            Blindes {state.blinds[0]}/{state.blinds[1]}
          </span>
          <span
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-full border font-sans font-medium",
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
                "border-white/[0.12] bg-white/[0.04] text-white/40"
            )}
          >
            {state.phase === "pre-flop" && "Pre-flop"}
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
              "text-base font-mono font-bold",
              (state.timeLeft ?? 30) <= 10
                ? "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                : "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
            )}
          >
            {state.timeLeft ?? 30}s
          </span>
        )}
      </div>

      {/* Timer bar (only when it is my turn) */}
      {isMyTurn && (
        <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden mx-2">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              (state.timeLeft ?? 30) <= 10
                ? "bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"
                : "bg-gradient-to-r from-amber-500 to-emerald-500 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
            )}
            style={{ width: `${((state.timeLeft ?? 30) / 30) * 100}%` }}
          />
        </div>
      )}

      {/* Other players (top row) */}
      <div className="flex flex-wrap justify-center gap-2.5 px-2">
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
        <div className="flex items-center gap-2.5 px-5 py-2 rounded-3xl border border-amber-500/30 bg-black/30 backdrop-blur-sm shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          <span className="text-xs text-amber-400/60 font-sans font-medium tracking-wide uppercase">Pot</span>
          <span className="font-mono text-amber-400 font-bold text-lg drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">
            {state.pot.toLocaleString("fr-FR")}
          </span>
        </div>

        {/* Community cards */}
        <div className="flex items-center gap-2 min-h-[76px] p-3 rounded-2xl border border-white/[0.08] bg-emerald-950/30 backdrop-blur-sm">
          {state.communityCards.length === 0 && (
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-12 h-[68px] rounded-xl border border-dashed border-emerald-700/20 bg-emerald-900/10"
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
                  className="w-12 h-[68px] rounded-xl border border-dashed border-emerald-700/20 bg-emerald-900/10"
                />
              )
            )}
        </div>

        {/* Current bet level */}
        {state.currentBetLevel > 0 && (
          <span className="text-[11px] text-white/25 font-sans">
            Mise actuelle : {state.currentBetLevel}
          </span>
        )}
      </div>

      {/* Showdown results banner */}
      {(state.phase === "showdown" || state.phase === "hand-end") &&
        state.showdownResults.length > 0 && (
          <div className="mx-auto max-w-md w-full space-y-2 px-2">
            {state.showdownResults
              .filter((r) => r.won)
              .map((r) => (
                <div
                  key={r.playerId}
                  className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] backdrop-blur-sm px-4 py-2.5 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                >
                  <div>
                    <span className="text-xs font-sans text-emerald-300">
                      {r.playerName} remporte{" "}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-sm drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
                      {r.chipsWon}
                    </span>
                  </div>
                  <span className="text-[11px] font-serif text-emerald-300/70">
                    {r.hand.name}
                  </span>
                </div>
              ))}
          </div>
        )}

      {/* My seat + hole cards (large) */}
      {me && (
        <div className="flex flex-col items-center gap-2.5 mt-auto">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-white/[0.12] bg-black/30 backdrop-blur-sm">
            {me.isDealer && (
              <RoleBadge label="D" color="bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
            )}
            {me.isSmallBlind && (
              <RoleBadge label="SB" color="bg-gradient-to-r from-blue-500 to-blue-600 text-white" />
            )}
            {me.isBigBlind && (
              <RoleBadge label="BB" color="bg-gradient-to-r from-purple-500 to-purple-600 text-white" />
            )}
            <span className="text-sm text-emerald-300 font-sans font-medium">
              {me.name} (toi)
            </span>
            <ChipCount amount={me.chips} />
            {me.currentBet > 0 && (
              <span className="text-[11px] text-amber-300/60 font-mono">
                Mise : {me.currentBet}
              </span>
            )}
          </div>

          {/* My hole cards */}
          {me.holeCards.length > 0 && !me.folded && (
            <div className="flex gap-2.5">
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
            <span className="text-xs text-red-400/50 font-sans italic">Couche</span>
          )}

          {/* Showdown result for me */}
          {getShowdown(playerId) && (
            <span
              className={cn(
                "text-sm font-serif",
                getShowdown(playerId)?.won
                  ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
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
        <div className="flex flex-col items-center gap-3 pb-3">
          {/* Raise slider */}
          {actions.canRaise && (
            <div className="flex items-center gap-3 w-full max-w-sm px-4">
              <span className="text-[11px] text-white/30 font-mono">
                {actions.minRaiseTotal}
              </span>
              <input
                type="range"
                min={actions.minRaiseTotal}
                max={actions.maxRaiseTotal}
                step={Math.max(1, Math.floor(state.blinds[1] / 2))}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(Number(e.target.value))}
                className="flex-1 accent-emerald-500 h-2 bg-white/[0.08] rounded-full cursor-pointer"
              />
              <span className="text-[11px] text-white/30 font-mono">
                {actions.maxRaiseTotal}
              </span>
            </div>
          )}

          {/* Buttons row */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            {/* Fold */}
            {actions.canFold && (
              <button
                onClick={handleFold}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-sans text-sm font-semibold transition-all active:scale-95",
                  "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white",
                  "border border-red-500/30 shadow-[0_0_12px_rgba(220,38,38,0.2)]"
                )}
              >
                Se coucher
              </button>
            )}

            {/* Check */}
            {actions.canCheck && (
              <button
                onClick={handleCheck}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-sans text-sm font-semibold transition-all active:scale-95",
                  "bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white",
                  "border border-white/[0.12] shadow-md"
                )}
              >
                Parole
              </button>
            )}

            {/* Call */}
            {actions.canCall && (
              <button
                onClick={handleCall}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-sans text-sm font-semibold transition-all active:scale-95",
                  "bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white",
                  "border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                )}
              >
                Suivre ({actions.callAmount})
              </button>
            )}

            {/* Raise */}
            {actions.canRaise && (
              <button
                onClick={handleRaise}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-sans text-sm font-semibold transition-all active:scale-95",
                  "bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] hover:from-[#72e8bc] hover:to-[#5dd896] text-black",
                  "border border-emerald-400/30 shadow-[0_0_15px_rgba(78,207,138,0.25)]"
                )}
              >
                Relancer ({raiseAmount})
              </button>
            )}

            {/* All-in */}
            {actions.canAllIn && (
              <button
                onClick={handleAllIn}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-sans text-sm font-bold transition-all active:scale-95",
                  "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-black",
                  "border border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
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
            <p className="text-sm text-white/25 font-sans animate-pulse">
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
          <p className="text-sm text-white/25 font-sans animate-pulse">
            Prochaine main...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 font-sans text-center bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2 mx-auto">
          {error}
        </p>
      )}
    </div>
  );
}
