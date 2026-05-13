"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { PlayingCard, type Suit, type Rank, type CardValue } from "@/components/shared/playing-card";
import { cn } from "@/lib/utils";

interface OtherPlayer {
  id: string;
  name: string;
  cardCount: number;
  isCurrentTurn: boolean;
}

interface Card { rank: Rank | "JK"; suit: Suit | null; }

interface AmState {
  status: "waiting" | "playing" | "game-over";
  currentPlayerId: string | null;
  direction: 1 | -1;
  timeLeft: number;
  deckCount: number;
  discardTop: Card | null;
  askedSuit: Suit | null;
  pendingDraws: number;
  otherPlayers: OtherPlayer[];
  hands: Record<string, Card[]>;
}

const SUIT_PICK: { s: Suit; label: string; red: boolean }[] = [
  { s: "♥", label: "Cœur",    red: true  },
  { s: "♦", label: "Carreau", red: true  },
  { s: "♠", label: "Pique",   red: false },
  { s: "♣", label: "Trèfle",  red: false },
];

export default function HuitAmericainGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction, sendRaw } = useGame(roomCode, "huit-americain", playerId, playerName);
  const lastState = useGameStore((s) => s.gameState) as unknown as AmState | null;
  const [pickingSuit, setPickingSuit] = useState<{ index: number } | null>(null);

  const state = lastState;
  const myHand = state?.hands?.[playerId] ?? [];
  const isMyTurn = state?.currentPlayerId === playerId;

  // Reset suit picker when turn changes
  useEffect(() => {
    if (!isMyTurn) setPickingSuit(null);
  }, [isMyTurn]);

  function canPlay(card: Card): boolean {
    if (!state?.discardTop) return false;
    if (card.suit === null) return true; // joker
    if (card.rank === "8") return true;
    const top = state.discardTop;
    const eff = state.askedSuit ?? top.suit;
    if (card.suit && card.suit === eff) return true;
    if (card.rank === top.rank) return true;
    return false;
  }

  function handlePlay(index: number) {
    const card = myHand[index];
    if (!card) return;
    if (card.rank === "8" || card.rank === "JK") {
      setPickingSuit({ index });
      return;
    }
    sendAction({ action: "play-card",  playerId, cardIndex: index  });
  }

  function confirmSuit(suit: Suit) {
    if (!pickingSuit) return;
    sendAction({ action: "play-card", 
      playerId,
      cardIndex: pickingSuit.index,
      chosenSuit: suit,
     });
    setPickingSuit(null);
  }

  if (!state || !state.status || state.status === "waiting") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center"
           style={{ color: "var(--foreground)" }}>
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          en attente
        </span>
        <h2 className="cb-display-lg mt-2 text-white">Distribution…</h2>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Min 2 joueurs · vide ta main en premier
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

  const opps = state.otherPlayers.filter((p) => p.id !== playerId);
  const palette = ["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8","#E89A2B","#00B3A6","#E23434"];

  return (
    <div className="relative flex h-full flex-col">
      {/* Opponents row */}
      <div className="grid gap-2 px-3 pt-2"
           style={{ gridTemplateColumns: `repeat(${Math.max(1, opps.length)}, minmax(0, 1fr))` }}>
        {opps.map((o, i) => (
          <div
            key={o.id}
            className="relative rounded-xl border p-2"
            style={{
              background: o.isCurrentTurn ? "var(--cb-brand)" : "rgba(255,255,255,0.04)",
              color: o.isCurrentTurn ? "var(--cb-brand-ink)" : "#fff",
              borderColor: o.isCurrentTurn ? "transparent" : "rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
                style={{
                  background: palette[i % palette.length],
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                }}
              >
                {o.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate text-xs font-bold"
                    style={{ fontFamily: "var(--font-display)" }}>
                {o.name}
              </span>
              {o.cardCount === 1 && (
                <span
                  className="ml-auto rounded-full px-1.5 text-[8px] font-black"
                  style={{ background: "var(--cb-social)", color: "#fff" }}
                >
                  UNO!
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: Math.min(5, o.cardCount) }).map((_, k) => (
                <span
                  key={k}
                  className="block h-3 w-2 rounded-sm"
                  style={{ background: o.isCurrentTurn ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.18)" }}
                />
              ))}
              {o.cardCount > 5 && (
                <span className="ml-1 text-[9px]"
                      style={{ color: o.isCurrentTurn ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)" }}>
                  +{o.cardCount - 5}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Felt center */}
      <div
        className="relative mx-3 mt-3 flex flex-1 items-center justify-center rounded-3xl overflow-hidden"
        style={{
          background: "radial-gradient(120% 80% at 50% 50%, #2A1F4D 0%, #14102A 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-5">
          {/* Pioche */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-20 w-14">
              {[0,1,2,3].map((i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: i, top: -i,
                    transform: `rotate(${i * 0.6}deg)`,
                  }}
                >
                  <PlayingCard faceDown size="md" />
                </div>
              ))}
            </div>
            <button
              onClick={() => isMyTurn && sendAction({ action: "draw",  playerId  })}
              disabled={!isMyTurn}
              className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{
                background: isMyTurn ? "var(--cb-brand)" : "rgba(255,255,255,0.06)",
                color: isMyTurn ? "var(--cb-brand-ink)" : "rgba(255,255,255,0.5)",
                borderColor: "transparent",
                fontFamily: "var(--font-display)",
                cursor: isMyTurn ? "pointer" : "not-allowed",
              }}
            >
              {state.pendingDraws > 0 ? `Pioche +${state.pendingDraws}` : "Piocher"}
            </button>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              {state.deckCount} cartes
            </span>
          </div>

          {/* Discard */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-20 w-14">
              {state.discardTop && (
                <div className="absolute inset-0">
                  {state.discardTop.rank === "JK" ? (
                    <div
                      className="flex h-full w-full items-center justify-center rounded-lg text-white"
                      style={{
                        background: "linear-gradient(135deg, #E63CA0, #6B4FE8)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 900,
                        fontSize: 22,
                      }}
                    >
                      JK
                    </div>
                  ) : (
                    <PlayingCard
                      value={state.discardTop.rank as Rank}
                      suit={state.discardTop.suit as Suit}
                      size="md"
                      raised
                    />
                  )}
                </div>
              )}
              {state.askedSuit && (
                <div
                  className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 text-lg font-black"
                  style={{
                    background: "var(--cb-brand)",
                    borderColor: "#fff",
                    color: state.askedSuit === "♥" || state.askedSuit === "♦" ? "#E23434" : "#0A0A0A",
                  }}
                >
                  {state.askedSuit}
                </div>
              )}
            </div>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              {isMyTurn ? "à toi" : "à un adversaire"}
            </span>
          </div>
        </div>

        {/* Timer chip */}
        {isMyTurn && (
          <div
            className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-black"
            style={{
              background: state.timeLeft <= 5 ? "var(--cb-social)" : "var(--cb-brand)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            }}
          >
            {state.timeLeft}s
          </div>
        )}
      </div>

      {/* My hand */}
      <div className="relative h-32 px-3 pt-2">
        <div className="relative mx-auto" style={{ width: "100%", maxWidth: 540, height: 110 }}>
          {myHand.map((c, i) => {
            const n = myHand.length;
            const mid = (n - 1) / 2;
            const offset = i - mid;
            const spacing = Math.min(48, 280 / Math.max(1, n - 1));
            const rot = offset * Math.min(3.5, 18 / Math.max(1, n - 1));
            const x = offset * spacing;
            const y = Math.abs(offset) * 2;
            const playable = canPlay(c);
            return (
              <button
                key={i}
                onClick={() => playable && handlePlay(i)}
                disabled={!playable || !isMyTurn}
                className={cn("absolute outline-none transition-transform")}
                style={{
                  left: "50%", bottom: 0,
                  transform: `translateX(${x - 28}px) translateY(${-y}px) rotate(${rot}deg)`,
                  transformOrigin: "center 95px",
                  zIndex: i,
                  cursor: playable && isMyTurn ? "pointer" : "not-allowed",
                }}
              >
                {c.rank === "JK" ? (
                  <div
                    className="flex h-20 w-14 items-center justify-center rounded-lg text-white"
                    style={{
                      background: "linear-gradient(135deg, #E63CA0, #6B4FE8)",
                      boxShadow: playable
                        ? "0 8px 18px rgba(230,60,160,0.5), 0 0 0 2px var(--cb-brand)"
                        : "0 2px 6px rgba(0,0,0,0.2)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      fontSize: 18,
                      opacity: playable && isMyTurn ? 1 : 0.45,
                    }}
                  >
                    JK
                  </div>
                ) : (
                  <PlayingCard
                    value={c.rank as Rank}
                    suit={c.suit as Suit}
                    size="md"
                    dim={!playable || !isMyTurn}
                    raised={playable && isMyTurn}
                    style={playable && isMyTurn ? {
                      boxShadow: "0 8px 18px rgba(255,106,61,0.4)",
                      outline: "2px solid var(--cb-brand)",
                      outlineOffset: -2,
                    } : undefined}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suit picker overlay */}
      {pickingSuit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPickingSuit(null)}
        >
          <div
            className="rounded-3xl border p-5 sm:p-6"
            style={{
              background: "var(--surface)",
              borderColor: "rgba(255,255,255,0.08)",
              maxWidth: 320,
              width: "85%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="cb-eyebrow text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
              choisis la couleur
            </p>
            <p
              className="mt-2 mb-4 text-center cb-display-md text-white"
            >
              Tout le monde doit suivre
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUIT_PICK.map((s) => (
                <button
                  key={s.s}
                  onClick={() => confirmSuit(s.s)}
                  className="rounded-xl border px-3 py-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                >
                  <div
                    className="text-3xl"
                    style={{ color: s.red ? "#FF8888" : "#FFFFFF" }}
                  >
                    {s.s}
                  </div>
                  <div className="cb-eyebrow mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {s.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
