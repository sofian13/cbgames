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

// ── Radial gradient backgrounds per color ────────────────
const COLOR_RADIALS: Record<CardColor, string> = {
  rouge: "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.25), transparent 40%)",
  bleu: "radial-gradient(circle at 50% 25%, rgba(59,130,246,0.25), transparent 40%)",
  vert: "radial-gradient(circle at 50% 25%, rgba(16,185,129,0.25), transparent 40%)",
  jaune: "radial-gradient(circle at 50% 25%, rgba(250,204,21,0.2), transparent 40%)",
};

const COLOR_PICKER_STYLES: Record<CardColor, { gradient: string; shadow: string }> = {
  rouge: {
    gradient: "bg-gradient-to-br from-red-400 to-red-600",
    shadow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
  },
  bleu: {
    gradient: "bg-gradient-to-br from-blue-400 to-blue-600",
    shadow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
  },
  vert: {
    gradient: "bg-gradient-to-br from-emerald-400 to-emerald-600",
    shadow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
  },
  jaune: {
    gradient: "bg-gradient-to-br from-yellow-300 to-yellow-500",
    shadow: "shadow-[0_0_20px_rgba(250,204,21,0.4)]",
  },
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

// ── Determine ambient background based on top card ───────
function getAmbientBackground(topCard?: CardData): string {
  if (!topCard) return "#0a0a0f";
  const color = topCard.type === "wild" ? topCard.chosenColor : topCard.color;
  if (!color) return "#0a0a0f";
  const radial = COLOR_RADIALS[color as CardColor];
  return radial ? `${radial}, #0a0a0f` : "#0a0a0f";
}

// ══════════════════════════════════════════════════════════
export default function UnoGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "uno", playerId, playerName);
  const { gameState, error } = useGameStore();
  const [colorPickerCard, setColorPickerCard] = useState<number | null>(null);
  const [unoToast, setUnoToast] = useState<UnoEvent | null>(null);
  const [playedCardAnim, setPlayedCardAnim] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const prevUnoEventRef = useRef<string>("");
  const drawLockRef = useRef(false);

  const state = gameState as unknown as UnoState;

  // Reset selected card when hand changes
  useEffect(() => {
    setSelectedCardIndex(null);
  }, [state?.myHand?.length]);

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
    if (drawLockRef.current) return;
    drawLockRef.current = true;
    sendAction({ action: "draw" });
    // Unlock after server has time to respond
    setTimeout(() => { drawLockRef.current = false; }, 1000);
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
      <div
        className="flex flex-1 items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.12), transparent 40%), radial-gradient(circle at 20% 70%, rgba(59,130,246,0.10), transparent 40%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.10), transparent 40%), #0a0a0f",
        }}
      >
        <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-10 py-8 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <span className="text-4xl font-serif font-semibold text-white/90 tracking-tight">
            UNO
          </span>
          <p className="text-white/40 animate-pulse font-sans text-sm">
            En attente des joueurs...
          </p>
        </div>
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
        className="flex flex-1 flex-col relative overflow-hidden select-none transition-all duration-700"
        style={{ background: getAmbientBackground(topCard) }}
      >
        {/* ── UNO Toast ──────────────────────────────── */}
        {unoToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div
              className={cn(
                "px-6 py-3 rounded-2xl border font-sans text-sm font-semibold animate-pulse backdrop-blur-md",
                unoToast.type === "called"
                  ? "bg-cyan-400/15 border-cyan-300/30 text-cyan-200 shadow-[0_0_20px_rgba(80,216,255,0.25)]"
                  : "bg-red-500/15 border-red-500/30 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
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
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md">
            <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-8 flex flex-col items-center gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <p className="text-white/90 font-serif text-xl font-semibold">Choisis une couleur</p>
              <div className="grid grid-cols-2 gap-4">
                {(["rouge", "bleu", "vert", "jaune"] as CardColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChooseColor(color)}
                    className={cn(
                      "w-24 h-24 rounded-2xl transition-all hover:scale-110 active:scale-95 border border-white/20",
                      COLOR_PICKER_STYLES[color].gradient,
                      COLOR_PICKER_STYLES[color].shadow,
                      "hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-sans font-semibold",
                        color === "jaune" ? "text-black/80" : "text-white/90"
                      )}
                    >
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setColorPickerCard(null)}
                className="text-xs text-white/25 hover:text-white/50 font-sans transition-colors mt-1"
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
                  "flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-2.5 min-w-[85px] transition-all",
                  p.isCurrentTurn
                    ? "border-cyan-400/30 bg-cyan-400/8 shadow-[0_0_20px_rgba(80,216,255,0.15)] backdrop-blur-sm"
                    : "border-white/[0.08] bg-white/[0.03] backdrop-blur-sm"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold font-sans truncate max-w-[70px]",
                    p.isCurrentTurn ? "text-cyan-300" : "text-white/50"
                  )}
                >
                  {p.name}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: Math.min(p.cardCount, 7) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-3 h-4 rounded-[3px] border",
                        p.isCurrentTurn
                          ? "bg-cyan-400/15 border-cyan-400/20"
                          : "bg-white/8 border-white/[0.08]"
                      )}
                      style={{
                        transform: `rotate(${(i - Math.min(p.cardCount, 7) / 2) * 4}deg)`,
                      }}
                    />
                  ))}
                  {p.cardCount > 7 && (
                    <span className="text-[9px] text-white/25 font-mono ml-0.5">
                      +{p.cardCount - 7}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/25 font-mono">
                  {p.cardCount} carte{p.cardCount !== 1 ? "s" : ""}
                </span>
                {p.calledUno && p.cardCount === 1 && (
                  <span className="text-[9px] font-sans font-bold text-cyan-300 drop-shadow-[0_0_6px_rgba(80,216,255,0.5)]">
                    UNO
                  </span>
                )}
                {p.mustCallUno && !p.calledUno && p.id !== playerId && (
                  <button
                    onClick={() => handleCatchUno(p.id)}
                    className="mt-0.5 px-2.5 py-1 rounded-lg text-[9px] font-sans font-bold bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] transition-all active:scale-95"
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
            <span className="text-[10px] text-white/20 font-sans uppercase tracking-widest">
              {state.direction === 1 ? "Sens horaire" : "Sens anti-horaire"}
            </span>
            <span className="text-white/25 text-sm">
              {state.direction === 1 ? "\u21BB" : "\u21BA"}
            </span>
          </div>

          {/* Timer */}
          {isMyTurn && (
            <div className="absolute top-2 right-4">
              <span
                className={cn(
                  "text-sm font-mono font-bold",
                  (state.timeLeft ?? 0) <= 5
                    ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                    : "text-white/40"
                )}
              >
                {state.timeLeft ?? 0}s
              </span>
            </div>
          )}

          {/* Turn indicator */}
          <div className="absolute top-2 left-4">
            {isMyTurn ? (
              <span className="text-xs font-sans text-cyan-300 font-semibold animate-pulse drop-shadow-[0_0_8px_rgba(80,216,255,0.4)]">
                Ton tour !
              </span>
            ) : (
              <span className="text-xs font-sans text-white/25">
                Tour de {otherPlayers.find((p) => p.id === state.currentPlayerId)?.name ?? "..."}
              </span>
            )}
          </div>

          {/* Draw pile */}
          <button
            onClick={handleDraw}
            disabled={!state.canDraw}
            className={cn(
              "relative w-[76px] h-[110px] rounded-2xl border-2 transition-all",
              state.canDraw
                ? "border-white/15 bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] cursor-pointer active:scale-95 backdrop-blur-sm"
                : "border-white/[0.06] bg-white/[0.02] cursor-default opacity-30"
            )}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl text-white/15">&#x1F0A0;</span>
              <span className="text-[9px] text-white/20 font-mono mt-1">{state.deckCount}</span>
            </div>
            {state.canDraw && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/25 font-sans whitespace-nowrap font-medium">
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
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl border border-white/[0.12] bg-white/[0.05] backdrop-blur-sm text-white/60 font-sans text-xs font-medium hover:bg-white/[0.08] hover:border-white/[0.2] transition-all active:scale-95"
            >
              Passer
            </button>
          )}
        </div>

        {/* ── UNO Button ─────────────────────────────── */}
        {showUnoButton && (
          <div className="flex justify-center py-3">
            <button
              onClick={handleUnoCall}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] hover:from-[#75efbf] hover:to-[#5edf9a] text-slate-950 font-sans font-bold text-xl tracking-wide shadow-[0_0_30px_rgba(78,207,138,0.45)] hover:shadow-[0_0_40px_rgba(78,207,138,0.65)] transition-all active:scale-95 animate-pulse"
            >
              UNO !
            </button>
          </div>
        )}

        {/* ── Catch UNO buttons ──────────────────────── */}
        {catchablePlayers.length > 0 && !showUnoButton && (
          <div className="flex justify-center gap-2 py-3">
            {catchablePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => handleCatchUno(p.id)}
                className="px-5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-sans text-xs font-bold hover:bg-red-500/25 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all active:scale-95 backdrop-blur-sm"
              >
                Attraper {p.name} !
              </button>
            ))}
          </div>
        )}

        {/* ── Bottom: My hand (fan spread) ───────────── */}
        <div className="relative pb-4 pt-2 px-2">
          {/* Hand backdrop glow */}
          {isMyTurn && (
            <div
              className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(80,216,255,0.06), transparent 70%)",
              }}
            />
          )}
          {state.drewCard && (
            <p className="text-center text-[10px] text-cyan-300/60 font-sans mb-1 font-medium">
              Carte piochee ! Joue-la ou passe.
            </p>
          )}

          {/* Selected card preview (mobile) */}
          {selectedCardIndex !== null && myHand[selectedCardIndex] && (
            <div className="sm:hidden flex justify-center mb-2">
              <div className="flex flex-col items-center gap-2">
                <CardView card={myHand[selectedCardIndex]} size="large" playable={myHand[selectedCardIndex].playable} />
                <div className="flex gap-2">
                  {myHand[selectedCardIndex].playable && (
                    <button
                      onClick={() => {
                        handlePlayCard(selectedCardIndex, myHand[selectedCardIndex]);
                        setSelectedCardIndex(null);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 font-sans text-xs font-semibold active:scale-95 transition-all"
                    >
                      Jouer
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCardIndex(null)}
                    className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 font-sans text-xs active:scale-95 transition-all"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center items-end relative" style={{ minHeight: "100px" }}>
            {myHand.map((card, index) => {
              const totalCards = myHand.length;
              const maxSpread = Math.min(totalCards * 40, 500);
              const cardWidth = Math.min(maxSpread / totalCards, 52);
              const centerOffset = index - (totalCards - 1) / 2;
              const rotationDeg = totalCards > 1 ? centerOffset * Math.min(3, 30 / totalCards) : 0;
              const translateY = totalCards > 1 ? Math.abs(centerOffset) * Math.min(3, 30 / totalCards) : 0;
              const isAnimating = playedCardAnim === index;
              const isSelected = selectedCardIndex === index;

              return (
                <div
                  key={`${index}-${getCardName(card)}`}
                  className={cn(
                    "transition-all duration-200",
                    isAnimating && "opacity-0 -translate-y-20 scale-75"
                  )}
                  style={{
                    width: `${cardWidth}px`,
                    transform: `rotate(${rotationDeg}deg) translateY(${isSelected ? translateY - 12 : translateY}px)`,
                    zIndex: isSelected ? 100 : index,
                    marginLeft: index === 0 ? "0" : `-${Math.max(0, 52 - cardWidth)}px`,
                  }}
                >
                  <button
                    onClick={() => {
                      // On mobile: tap to select, second tap to play
                      const isMobile = window.innerWidth < 640;
                      if (isMobile) {
                        if (selectedCardIndex === index) {
                          handlePlayCard(index, card);
                          setSelectedCardIndex(null);
                        } else {
                          setSelectedCardIndex(index);
                        }
                      } else {
                        handlePlayCard(index, card);
                      }
                    }}
                    disabled={false}
                    className={cn(
                      "block transition-all duration-150 origin-bottom",
                      card.playable
                        ? "sm:hover:-translate-y-8 sm:hover:scale-[1.35] cursor-pointer active:scale-95"
                        : "opacity-40 cursor-default",
                      isSelected && "ring-2 ring-cyan-400/60 rounded-xl"
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
    <div
      className="flex flex-1 items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.08), transparent 40%), #0a0a0f",
      }}
    >
      {error && (
        <p className="text-sm text-red-400 font-sans drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
          {error}
        </p>
      )}
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

  const sizeClasses = size === "large" ? "w-[92px] h-[134px]" : "w-[52px] h-[76px] sm:w-[72px] sm:h-[104px]";
  const labelSize = size === "large" ? "text-4xl" : "text-xl sm:text-2xl";
  const cornerSize = size === "large" ? "text-xs" : "text-[8px] sm:text-[10px]";

  // Build inline gradient for card background instead of flat color
  const cardGradient = (() => {
    if (isWild && !color) {
      return "linear-gradient(135deg, #ef4444 0%, #3b82f6 33%, #10b981 66%, #facc15 100%)";
    }
    if (color === "rouge") return "linear-gradient(145deg, #f87171 0%, #dc2626 50%, #b91c1c 100%)";
    if (color === "bleu") return "linear-gradient(145deg, #60a5fa 0%, #2563eb 50%, #1d4ed8 100%)";
    if (color === "vert") return "linear-gradient(145deg, #34d399 0%, #059669 50%, #047857 100%)";
    if (color === "jaune") return "linear-gradient(145deg, #fde047 0%, #eab308 50%, #ca8a04 100%)";
    return undefined;
  })();

  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-xl border-2 relative overflow-hidden flex-shrink-0",
        "flex items-center justify-center",
        "transition-shadow duration-200",
        // Use gradient backgrounds via style instead of solid Tailwind bg
        !cardGradient && "bg-gray-700 border-white/10",
        cardGradient && (isWild && !color ? "border-white/30" : "border-white/20"),
        playable && colorStyle && colorStyle.glow,
        playable && isWild && !color && "shadow-[0_0_20px_rgba(255,255,255,0.3)]",
        size === "large" && colorStyle && colorStyle.glow
      )}
      style={cardGradient ? { background: cardGradient } : undefined}
    >
      {/* Inner shine overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Oval center shape */}
      <div
        className="absolute inset-2 rounded-[40%] border border-white/20 bg-white/10"
        style={{ transform: "rotate(30deg)" }}
      />

      {/* Center label */}
      <span
        className={cn(
          labelSize,
          "font-mono font-black relative z-10",
          "drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]",
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
          "drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
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
          "drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
          isWild && !color ? "text-white" : colorStyle?.text ?? "text-white"
        )}
      >
        {label}
      </span>

      {/* Wild chosen color indicator dot */}
      {isWild && color && (
        <div
          className={cn(
            "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full z-10",
            COLOR_MAP[color as CardColor].bg,
            "border border-white/30",
            "shadow-[0_0_6px_rgba(255,255,255,0.2)]"
          )}
        />
      )}

      {/* Action card subtext */}
      {card.type === "action" && (
        <span
          className={cn(
            "absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-sans font-semibold uppercase tracking-wider z-10 whitespace-nowrap",
            colorStyle?.text ?? "text-white",
            "opacity-70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
          )}
        >
          {ACTION_NAMES[card.action ?? ""] ?? ""}
        </span>
      )}

      {/* Wild card subtext */}
      {isWild && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-sans font-semibold uppercase tracking-wider z-10 text-white/70 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          {card.wild === "plus4" ? "Pioche 4" : "Joker"}
        </span>
      )}
    </div>
  );
}
