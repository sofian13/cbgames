"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { TableBg, SeatAvatar, PlayingCard, opponentSlots, useCardStyle, CARD_SIZES, SUIT_RED, type Suit, type Rank } from "@/components/games/cards/card-kit";
import { useAudio } from "@/lib/hooks/useAudio";
import { sfxCardPlay, sfxTrickWin, sfxHandChime } from "@/lib/card-sfx";

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

const SUIT_PICK: { s: Suit; label: string }[] = [
  { s: "♥", label: "Cœur" }, { s: "♦", label: "Carreau" },
  { s: "♠", label: "Pique" }, { s: "♣", label: "Trèfle" },
];

function JokerCard({ size = "md", dim, raised }: { size?: "xs" | "md"; dim?: boolean; raised?: boolean }) {
  const d = CARD_SIZES[size];
  return (
    <div style={{
      width: d.w, height: d.h, borderRadius: Math.max(4, d.w * 0.085),
      background: "linear-gradient(135deg, #E63CA0, #6B4FE8)",
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      fontFamily: "var(--font-display)", fontWeight: 900, fontSize: d.w * 0.32,
      opacity: dim ? 0.5 : 1,
      boxShadow: raised ? "0 10px 22px rgba(230,60,160,0.5), 0 0 0 1.5px rgba(255,255,255,0.85)" : "0 4px 10px rgba(0,0,0,0.3)",
    }}>JK</div>
  );
}

export default function HuitAmericainGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction, sendRaw } = useGame(roomCode, "huit-americain", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as unknown as AmState | null;
  const [pickingSuit, setPickingSuit] = useState<{ index: number } | null>(null);
  const cardStyle = useCardStyle();
  const { muted } = useAudio();

  const myHand = state?.hands?.[playerId] ?? [];
  const isMyTurn = state?.currentPlayerId === playerId;

  useEffect(() => { if (!isMyTurn) setPickingSuit(null); }, [isMyTurn]);

  // ── Bruitages : carte posée, pioche d'attaque (A/JK/D♣), fin de partie ──
  const sfxTopRef = useRef("");
  const sfxDrawsRef = useRef(0);
  const sfxStatusRef = useRef("");
  useEffect(() => {
    if (!state) return;
    const top = state.discardTop ? `${state.discardTop.rank}${state.discardTop.suit ?? "JK"}` : "";
    if (!muted) {
      if (top && top !== sfxTopRef.current && sfxTopRef.current !== "") sfxCardPlay();
      if ((state.pendingDraws ?? 0) > sfxDrawsRef.current) sfxTrickWin(); // pénalité de pioche empilée
      if (state.status === "game-over" && sfxStatusRef.current !== "game-over") sfxHandChime(true);
    }
    sfxTopRef.current = top;
    sfxDrawsRef.current = state.pendingDraws ?? 0;
    sfxStatusRef.current = state.status;
  }, [state, muted]);

  function canPlay(card: Card): boolean {
    if (!state?.discardTop) return false;
    if (card.suit === null) return true;
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
    if (card.rank === "8" || card.rank === "JK") { setPickingSuit({ index }); return; }
    sendAction({ action: "play-card", playerId, cardIndex: index });
  }

  function confirmSuit(suit: Suit) {
    if (!pickingSuit) return;
    sendAction({ action: "play-card", playerId, cardIndex: pickingSuit.index, chosenSuit: suit });
    setPickingSuit(null);
  }

  if (!state || !state.status || state.status === "waiting") {
    return (
      <div className="relative min-h-0 w-full flex-1">
        <TableBg tone="plum">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.55)" }}>en attente</span>
            <h2 className="cb-display-lg mt-2">Distribution…</h2>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Min 2 joueurs · vide ta main en premier</p>
            <button onClick={() => sendRaw({ type: "start-with-bots" })}
              className="mt-6 rounded-xl px-5 py-3 text-sm font-black"
              style={{ background: "var(--cb-brand)", color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>
              Lancer avec bots
            </button>
          </div>
        </TableBg>
      </div>
    );
  }

  const opps = state.otherPlayers.filter((p) => p.id !== playerId);
  const slots = opponentSlots(opps.length);
  const d = CARD_SIZES.md;
  const n = myHand.length;
  const mid = (n - 1) / 2;
  const spacing = Math.min(d.w * 0.7, 320 / Math.max(1, n - 1));

  return (
    <div className="relative min-h-0 w-full flex-1 select-none overflow-hidden">
      <TableBg tone="plum">
        {/* Opponents — circle */}
        {opps.map((o, i) => {
          const slot = slots[i] ?? { left: 50, top: 13 };
          return (
            <div key={o.id} className="absolute z-20 flex flex-col items-center"
                 style={{ left: `${slot.left}%`, top: `calc(${slot.top}% + env(safe-area-inset-top,0px))`, transform: "translate(-50%,-50%)" }}>
              <div className="mb-1 flex h-7 items-end justify-center">
                {Array.from({ length: Math.min(4, o.cardCount) }).map((_, k) => (
                  <div key={k} style={{ marginLeft: k === 0 ? 0 : -22, transform: `rotate(${(k - 1.5) * 7}deg)` }}>
                    <PlayingCard faceDown size="xs" />
                  </div>
                ))}
              </div>
              <SeatAvatar name={o.name} hue={i + 1} isBot isTurn={o.isCurrentTurn} cardCount={o.cardCount} />
              {o.cardCount === 1 && (
                <span className="mt-1 rounded-full px-2 py-0.5 text-[8px] font-black tracking-wider"
                      style={{ background: "var(--af-coral)", color: "#fff", fontFamily: "var(--font-display)" }}>
                  UNO !
                </span>
              )}
            </div>
          );
        })}

        {/* Center — draw pile + discard */}
        <div className="absolute left-1/2 top-[44%] flex -translate-x-1/2 -translate-y-1/2 items-center gap-6">
          {/* Draw pile */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: d.w + 6, height: d.h }}>
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="absolute" style={{ left: k, top: -k, transform: `rotate(${k * 0.6}deg)` }}>
                  <PlayingCard faceDown size="md" />
                </div>
              ))}
            </div>
            <button onClick={() => isMyTurn && sendAction({ action: "draw", playerId })} disabled={!isMyTurn}
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
              style={{ background: isMyTurn ? "var(--cb-brand)" : "rgba(255,255,255,0.06)", color: "#fff", fontFamily: "var(--font-display)" }}>
              {state.pendingDraws > 0 ? `Pioche +${state.pendingDraws}` : "Piocher"}
            </button>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{state.deckCount} cartes</span>
          </div>

          {/* Discard */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: d.w, height: d.h }}>
              {state.discardTop && (
                <div
                  key={`${state.discardTop.rank}${state.discardTop.suit ?? "X"}-${state.deckCount}`}
                  style={{ animation: "trickCardIn 280ms cubic-bezier(0.34,1.2,0.64,1)", ["--enter-from" as string]: "translateY(-40px) scale(0.6)" }}
                >
                  {state.discardTop.rank === "JK"
                    ? <JokerCard size="md" raised />
                    : <PlayingCard rank={state.discardTop.rank} suit={state.discardTop.suit as Suit} size="md" cardStyle={cardStyle} raised />}
                </div>
              )}
              {state.askedSuit && (
                <div className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 text-lg font-black"
                     style={{ background: "#fff", borderColor: "var(--cb-brand)", color: SUIT_RED(state.askedSuit) ? "#D11C2D" : "#0A0A0A" }}>
                  {state.askedSuit}
                </div>
              )}
            </div>
            {isMyTurn && (
              <span className="whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black tracking-[0.12em] text-white"
                    style={{ background: state.timeLeft <= 5 ? "linear-gradient(180deg,#FF6B5B,#C13D1A)" : "linear-gradient(180deg,#7A4EE8,#4A23B0)", fontFamily: "var(--font-display)" }}>
                À TOI · {state.timeLeft}s
              </span>
            )}
          </div>
        </div>

        {/* My fan */}
        <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)-2px)] z-40 flex justify-center">
          <div className="relative" style={{ width: "min(92%, 640px)", height: d.h + 28 }}>
            {myHand.map((c, i) => {
              const offset = i - mid;
              const rot = offset * Math.min(3.5, 14 / Math.max(1, n - 1));
              const x = offset * spacing;
              const y = Math.abs(offset) * 1.8;
              const playable = canPlay(c) && isMyTurn;
              return (
                <button key={i} onClick={() => playable && handlePlay(i)} disabled={!playable}
                  className="absolute outline-none"
                  style={{
                    left: "50%", bottom: 0,
                    transform: `translateX(${x - d.w / 2}px) translateY(${-y}px) rotate(${rot}deg)`,
                    transformOrigin: `center ${d.h + 60}px`,
                    zIndex: i, cursor: playable ? "pointer" : "default",
                    filter: playable ? "none" : "saturate(0.5) brightness(0.72)",
                    transition: "transform 200ms cubic-bezier(0.22,1,0.36,1)",
                  }}>
                  {c.rank === "JK"
                    ? <JokerCard size="md" raised={playable} dim={!playable} />
                    : <PlayingCard rank={c.rank} suit={c.suit as Suit} size="md" cardStyle={cardStyle} raised={playable} playable={playable} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Me — bottom-left */}
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] left-3 z-30">
          <SeatAvatar name={playerName} hue={2} isBot={false} isTurn={isMyTurn} cardCount={myHand.length} />
        </div>

        {/* Suit picker */}
        {pickingSuit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={() => setPickingSuit(null)}>
            <div className="w-full max-w-xs rounded-3xl border p-5" style={{ background: "var(--surface)", borderColor: "rgba(255,255,255,0.1)" }} onClick={(e) => e.stopPropagation()}>
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.5)" }}>choisis la couleur</p>
              <p className="cb-display-md mt-1 mb-4 text-center text-white">Tout le monde suit</p>
              <div className="grid grid-cols-2 gap-2">
                {SUIT_PICK.map((s) => (
                  <button key={s.s} onClick={() => confirmSuit(s.s)} className="rounded-2xl border px-3 py-3 text-center active:scale-95"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
                    <div className="text-3xl" style={{ color: SUIT_RED(s.s) ? "#FF8888" : "#FFFFFF" }}>{s.s}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </TableBg>
    </div>
  );
}
