"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────
type CardColor = "rouge" | "bleu" | "vert" | "jaune";

interface CardData {
  type: "number" | "action" | "wild";
  color?: CardColor;
  value?: number;
  action?: "plus2" | "passe" | "inverse";
  wild?: "joker" | "plus4";
  chosenColor?: CardColor | null;
  playable?: boolean;
}

interface OtherPlayer {
  id: string;
  name: string;
  cardCount: number;
  isCurrentTurn: boolean;
  calledUno: boolean;
  mustCallUno: boolean;
}

interface UnoEvent {
  playerId: string;
  playerName: string;
  catcherName?: string;
  type: "called" | "caught";
}

interface UnoState {
  status: "waiting" | "playing" | "game-over";
  myHand: CardData[];
  myId: string;
  otherPlayers: OtherPlayer[];
  topCard: CardData;
  currentPlayerId: string;
  direction: 1 | -1;
  timeLeft: number;
  deckCount: number;
  isMyTurn: boolean;
  canDraw: boolean;
  drewCard: boolean;
  canPassAfterDraw: boolean;
  turnOrder: string[];
  unoEvent?: UnoEvent;
}

// ── Color config ─────────────────────────────────────────
const COLOR_MAP: Record<CardColor, { bg: string; ring: string; text: string; glow: string }> = {
  rouge: {
    bg: "bg-red-500",
    ring: "ring-red-500/50",
    text: "text-white",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
  },
  bleu: {
    bg: "bg-blue-500",
    ring: "ring-blue-500/50",
    text: "text-white",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
  },
  vert: {
    bg: "bg-emerald-500",
    ring: "ring-emerald-500/50",
    text: "text-white",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.5)]",
  },
  jaune: {
    bg: "bg-yellow-400",
    ring: "ring-yellow-400/50",
    text: "text-black",
    glow: "shadow-[0_0_20px_rgba(250,204,21,0.5)]",
  },
};

const ACTION_LABELS: Record<string, string> = {
  plus2: "+2",
  passe: "\u29B8",
  inverse: "\u21C4",
};

const ACTION_NAMES: Record<string, string> = {
  plus2: "Pioche 2",
  passe: "Passe",
  inverse: "Inverse",
};

// ── Card display helpers ─────────────────────────────────
function getCardLabel(card: CardData): string {
  if (card.type === "number") return String(card.value ?? 0);
  if (card.type === "action") return ACTION_LABELS[card.action ?? ""] ?? "?";
  if (card.wild === "plus4") return "+4";
  return "\u2605";
}

function getCardName(card: CardData): string {
  if (card.type === "number") return `${card.color}-${card.value}`;
  if (card.type === "action") return `${card.color}-${card.action}`;
  if (card.wild === "plus4") return "plus4";
  return "joker";
}

// ══════════════════════════════════════════════════════════
export default function UnoGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "uno", playerId, playerName);
  const { gameState, error } = useGameStore();
  const [colorPickerCard, setColorPickerCard] = useState<number | null>(null);
  const [unoToast, setUnoToast] = useState<UnoEvent | null>(null);
  const [playedCardAnim, setPlayedCardAnim] = useState<number | null>(null);
  const prevUnoEventRef = useRef<string>("");

  const state = gameState as unknown as UnoState;

  // ── UNO event toast ────────────────────────────────────
  useEffect(() => {
    if (!state?.unoEvent) return;
    const key = `${state.unoEvent.type}-${state.unoEvent.playerId}-${Date.now()}`;
    if (prevUnoEventRef.current === key) return;
    prevUnoEventRef.current = key;

    setUnoToast(state.unoEvent);
    const timeout = setTimeout(() => setUnoToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [state?.unoEvent]);

  // ── Actions ────────────────────────────────────────────
  const handlePlayCard = useCallback(
    (cardIndex: number, card: CardData) => {
      if (!card.playable) return;

      if (card.type === "wild") {
        setColorPickerCard(cardIndex);
        return;
      }

      setPlayedCardAnim(cardIndex);
      setTimeout(() => setPlayedCardAnim(null), 400);
      sendAction({ action: "play-card", cardIndex });
    },
    [sendAction]
  );

  const handleChooseColor = useCallback(
    (color: CardColor) => {
      if (colorPickerCard === null) return;
      setPlayedCardAnim(colorPickerCard);
      setTimeout(() => setPlayedCardAnim(null), 400);
      sendAction({ action: "play-card", cardIndex: colorPickerCard, chosenColor: color });
      setColorPickerCard(null);
    },
    [colorPickerCard, sendAction]
  );

  const handleDraw = useCallback(() => {
    sendAction({ action: "draw" });
  }, [sendAction]);

  const handlePassAfterDraw = useCallback(() => {
    sendAction({ action: "pass-after-draw" });
  }, [sendAction]);

  const handleUnoCall = useCallback(() => {
    sendAction({ action: "uno" });
  }, [sendAction]);

  const handleCatchUno = useCallback(
    (targetId: string) => {
      sendAction({ action: "catch-uno", targetId });
    },
    [sendAction]
  );

  // ── Waiting state ──────────────────────────────────────
  if (!state || state.status === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center" style={{ background: "#060606" }}>
        <p className="text-white/40 animate-pulse font-sans">
          En attente des joueurs...
        </p>
      </div>
    );
  }

  // ── Main game ──────────────────────────────────────────
  if (state.status === "playing" || state.status === "game-over") {
    const myHand = state.myHand ?? [];
    const otherPlayers = state.otherPlayers ?? [];
    const topCard = state.topCard;
    const isMyTurn = state.isMyTurn;
    const mePlayer = otherPlayers.find((p) => p.id === playerId);
    const showUnoButton = myHand.length === 1 && mePlayer?.mustCallUno;
    const catchablePlayers = otherPlayers.filter(
      (p) => p.id !== playerId && p.mustCallUno && !p.calledUno
    );

    return (
      <div
        className="flex flex-1 flex-col relative overflow-hidden select-none"
        style={{ background: "#060606" }}
      >
        {/* ── UNO Toast ──────────────────────────────── */}
        {unoToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div
              className={cn(
                "px-4 py-2 rounded-lg border font-sans text-sm font-medium animate-pulse",
                unoToast.type === "called"
                  ? "bg-cyan-400/20 border-cyan-300/40 text-cyan-200"
                  : "bg-red-500/20 border-red-500/40 text-red-300"
              )}
            >
              {unoToast.type === "called"
                ? `${unoToast.playerName} a crie UNO !`
                : `${unoToast.catcherName} a attrape ${unoToast.playerName} ! +2 cartes`}
            </div>
          </div>
        )}

        {/* ── Color Picker Modal ─────────────────────── */}
        {colorPickerCard !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <p className="text-white/70 font-sans text-sm">Choisis une couleur</p>
              <div className="grid grid-cols-2 gap-3">
                {(["rouge", "bleu", "vert", "jaune"] as CardColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChooseColor(color)}
                    className={cn(
                      "w-20 h-20 rounded-xl transition-all hover:scale-110 active:scale-95",
                      COLOR_MAP[color].bg,
                      "shadow-lg"
                    )}
                  >
                    <span className={cn("text-sm font-sans font-medium", COLOR_MAP[color].text)}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setColorPickerCard(null)}
                className="text-xs text-white/30 hover:text-white/50 font-sans transition-colors mt-2"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* ── Top: Other players ─────────────────────── */}
        <div className="flex items-start justify-center gap-3 px-4 pt-4 pb-2 flex-wrap">
          {otherPlayers
            .filter((p) => p.id !== playerId)
            .map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-3 py-2 min-w-[80px] transition-all",
                  p.isCurrentTurn
                    ? "border-cyan-400/40 bg-cyan-400/5 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                    : "border-white/[0.06] bg-white/[0.02]"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium font-sans truncate max-w-[70px]",
                    p.isCurrentTurn ? "text-cyan-300" : "text-white/50"
                  )}
                >
                  {p.name}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: Math.min(p.cardCount, 7) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-4 rounded-[2px] bg-white/10 border border-white/[0.08]"
                      style={{
                        transform: `rotate(${(i - Math.min(p.cardCount, 7) / 2) * 4}deg)`,
                      }}
                    />
                  ))}
                  {p.cardCount > 7 && (
                    <span className="text-[9px] text-white/30 font-mono ml-0.5">
                      +{p.cardCount - 7}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/30 font-mono">
                  {p.cardCount} carte{p.cardCount !== 1 ? "s" : ""}
                </span>
                {p.calledUno && p.cardCount === 1 && (
                  <span className="text-[9px] font-sans font-bold text-cyan-300">UNO</span>
                )}
                {p.mustCallUno && !p.calledUno && p.id !== playerId && (
                  <button
                    onClick={() => handleCatchUno(p.id)}
                    className="mt-0.5 px-2 py-0.5 rounded text-[9px] font-sans font-bold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all active:scale-95"
                  >
                    Attraper !
                  </button>
                )}
              </div>
            ))}
        </div>

        {/* ── Center: Discard pile + Draw pile + Direction ── */}
        <div className="flex-1 flex items-center justify-center gap-6 relative">
          {/* Direction indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="text-[10px] text-white/20 font-sans uppercase tracking-wider">
              {state.direction === 1 ? "Sens horaire" : "Sens anti-horaire"}
            </span>
            <span className="text-white/20 text-sm">
              {state.direction === 1 ? "\u21BB" : "\u21BA"}
            </span>
          </div>

          {/* Timer */}
          {isMyTurn && (
            <div className="absolute top-2 right-4">
              <span
                className={cn(
                  "text-sm font-mono font-bold",
                  (state.timeLeft ?? 0) <= 5 ? "text-red-400" : "text-white/40"
                )}
              >
                {state.timeLeft ?? 0}s
              </span>
            </div>
          )}

          {/* Turn indicator */}
          <div className="absolute top-2 left-4">
            {isMyTurn ? (
              <span className="text-xs font-sans text-cyan-300 font-medium animate-pulse">
                Ton tour !
              </span>
            ) : (
              <span className="text-xs font-sans text-white/20">
                Tour de {otherPlayers.find((p) => p.id === state.currentPlayerId)?.name ?? "..."}
              </span>
            )}
          </div>

          {/* Draw pile */}
          <button
            onClick={handleDraw}
            disabled={!state.canDraw}
            className={cn(
              "relative w-[72px] h-[104px] rounded-xl border-2 transition-all",
              state.canDraw
                ? "border-white/20 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.06] cursor-pointer active:scale-95"
                : "border-white/[0.06] bg-white/[0.02] cursor-default opacity-40"
            )}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl text-white/20">&#x1F0A0;</span>
              <span className="text-[9px] text-white/20 font-mono mt-1">{state.deckCount}</span>
            </div>
            {state.canDraw && (
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/30 font-sans whitespace-nowrap">
                Piocher
              </span>
            )}
          </button>

          {/* Discard pile (top card) */}
          {topCard && <CardView card={topCard} size="large" />}

          {/* Pass after draw */}
          {state.canPassAfterDraw && (
            <button
              onClick={handlePassAfterDraw}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg border border-white/[0.12] bg-white/[0.05] text-white/60 font-sans text-xs hover:bg-white/[0.08] transition-all active:scale-95"
            >
              Passer
            </button>
          )}
        </div>

        {/* ── UNO Button ─────────────────────────────── */}
        {showUnoButton && (
          <div className="flex justify-center py-2">
            <button
              onClick={handleUnoCall}
              className="px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-bold text-lg tracking-wide shadow-[0_0_30px_rgba(80,216,255,0.45)] hover:shadow-[0_0_40px_rgba(80,216,255,0.65)] transition-all active:scale-95 animate-pulse"
            >
              UNO !
            </button>
          </div>
        )}

        {/* ── Catch UNO buttons ──────────────────────── */}
        {catchablePlayers.length > 0 && !showUnoButton && (
          <div className="flex justify-center gap-2 py-2">
            {catchablePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => handleCatchUno(p.id)}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-sans text-xs font-bold hover:bg-red-500/30 transition-all active:scale-95"
              >
                Attraper {p.name} !
              </button>
            ))}
          </div>
        )}

        {/* ── Bottom: My hand (fan spread) ───────────── */}
        <div className="relative pb-4 pt-2 px-2">
          {state.drewCard && (
            <p className="text-center text-[10px] text-cyan-300/60 font-sans mb-1">
              Carte piochee ! Joue-la ou passe.
            </p>
          )}
          <div className="flex justify-center items-end" style={{ minHeight: "130px" }}>
            {myHand.map((card, index) => {
              const totalCards = myHand.length;
              const maxSpread = Math.min(totalCards * 48, 600);
              const cardWidth = Math.min(maxSpread / totalCards, 72);
              const centerOffset = index - (totalCards - 1) / 2;
              const rotationDeg = totalCards > 1 ? centerOffset * Math.min(3, 30 / totalCards) : 0;
              const translateY = totalCards > 1 ? Math.abs(centerOffset) * Math.min(4, 40 / totalCards) : 0;
              const isAnimating = playedCardAnim === index;

              return (
                <div
                  key={`${index}-${getCardName(card)}`}
                  className={cn(
                    "transition-all duration-200",
                    isAnimating && "opacity-0 -translate-y-20 scale-75"
                  )}
                  style={{
                    width: `${cardWidth}px`,
                    transform: `rotate(${rotationDeg}deg) translateY(${translateY}px)`,
                    zIndex: index,
                    marginLeft: index === 0 ? "0" : `-${Math.max(0, 72 - cardWidth)}px`,
                  }}
                >
                  <button
                    onClick={() => handlePlayCard(index, card)}
                    disabled={!card.playable}
                    className={cn(
                      "block transition-all duration-150 origin-bottom",
                      card.playable
                        ? "hover:-translate-y-4 hover:scale-105 cursor-pointer active:scale-95"
                        : "opacity-40 cursor-default"
                    )}
                  >
                    <CardView card={card} size="hand" playable={card.playable} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback ───────────────────────────────────────────
  return (
    <div className="flex flex-1 items-center justify-center" style={{ background: "#060606" }}>
      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Card Component
// ══════════════════════════════════════════════════════════
function CardView({
  card,
  size = "hand",
  playable = false,
}: {
  card: CardData;
  size?: "hand" | "large";
  playable?: boolean;
}) {
  const isWild = card.type === "wild";
  const color = isWild ? card.chosenColor : card.color;
  const colorStyle = color ? COLOR_MAP[color as CardColor] : null;
  const label = getCardLabel(card);

  const sizeClasses = size === "large" ? "w-[88px] h-[128px]" : "w-[72px] h-[104px]";
  const labelSize = size === "large" ? "text-3xl" : "text-2xl";
  const cornerSize = size === "large" ? "text-xs" : "text-[10px]";

  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-xl border-2 relative overflow-hidden flex-shrink-0",
        "flex items-center justify-center",
        "transition-shadow duration-200",
        isWild && !color
          ? "bg-gradient-to-br from-red-500 via-blue-500 to-emerald-500 border-white/30"
          : colorStyle
            ? cn(colorStyle.bg, "border-white/20")
            : "bg-gray-700 border-white/10",
        playable && colorStyle && colorStyle.glow,
        playable && isWild && !color && "shadow-[0_0_20px_rgba(255,255,255,0.3)]"
      )}
    >
      {/* Oval center shape */}
      <div
        className="absolute inset-2 rounded-[40%] border border-white/20 bg-white/10"
        style={{ transform: "rotate(30deg)" }}
      />

      {/* Center label */}
      <span
        className={cn(
          labelSize,
          "font-mono font-black relative z-10 drop-shadow-md",
          isWild && !color ? "text-white" : colorStyle?.text ?? "text-white"
        )}
      >
        {label}
      </span>

      {/* Top-left corner */}
      <span
        className={cn(
          cornerSize,
          "absolute top-1.5 left-2 font-mono font-bold z-10",
          isWild && !color ? "text-white" : colorStyle?.text ?? "text-white"
        )}
      >
        {label}
      </span>

      {/* Bottom-right corner (rotated 180) */}
      <span
        className={cn(
          cornerSize,
          "absolute bottom-1.5 right-2 font-mono font-bold z-10 rotate-180",
          isWild && !color ? "text-white" : colorStyle?.text ?? "text-white"
        )}
      >
        {label}
      </span>

      {/* Wild chosen color indicator dot */}
      {isWild && color && (
        <div
          className={cn(
            "absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10",
            COLOR_MAP[color as CardColor].bg,
            "border border-white/30"
          )}
        />
      )}

      {/* Action card subtext */}
      {card.type === "action" && (
        <span
          className={cn(
            "absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-sans font-medium uppercase tracking-wider z-10 whitespace-nowrap",
            colorStyle?.text ?? "text-white",
            "opacity-70"
          )}
        >
          {ACTION_NAMES[card.action ?? ""] ?? ""}
        </span>
      )}

      {/* Wild card subtext */}
      {isWild && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-sans font-medium uppercase tracking-wider z-10 text-white/70 whitespace-nowrap">
          {card.wild === "plus4" ? "Pioche 4" : "Joker"}
        </span>
      )}
    </div>
  );
}
