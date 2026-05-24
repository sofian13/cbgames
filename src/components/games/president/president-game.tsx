"use client";

import { useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { TableBg, SeatAvatar, FanHand, PlayingCard, useCardStyle, type Suit, type Rank } from "@/components/games/cards/card-kit";

interface OtherPlayer {
  id: string;
  name: string;
  cardCount: number;
  isCurrentTurn: boolean;
  passed: boolean;
  finishedAt: number | null;
}

interface PresidentState {
  status: "waiting" | "playing" | "round-over";
  currentPlayerId: string | null;
  timeLeft: number;
  lastCombo: { rank: Rank; suit: Suit }[];
  lastComboPlayer: string | null;
  otherPlayers: OtherPlayer[];
  hands: Record<string, { rank: Rank; suit: Suit }[]>;
}

// Finishing-position label (1st to empty hand = Président)
const RANK_PILL: Record<number, { label: string; bg: string; fg: string }> = {
  1: { label: "PRÉSIDENT", bg: "linear-gradient(180deg,#FFD23F,#E0AA00)", fg: "#3B2900" },
  2: { label: "VICE-P", bg: "linear-gradient(180deg,#5BA3FF,#2A6FDB)", fg: "#fff" },
};

export default function PresidentGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction, sendRaw } = useGame(roomCode, "president", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as unknown as PresidentState | null;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const cardStyle = useCardStyle();

  const myHand = state?.hands?.[playerId] ?? [];
  const isMyTurn = state?.currentPlayerId === playerId;

  function toggle(i: number) {
    setSelected((sel) => {
      const next = new Set(sel);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function playSelection() {
    if (selected.size === 0) return;
    sendAction({ action: "play-combo", playerId, indices: [...selected].sort((a, b) => a - b) });
    setSelected(new Set());
  }

  function pass() {
    sendAction({ action: "pass", playerId });
  }

  // ── Waiting / round-over (lightweight, keep felt look) ──
  if (!state || !state.status || state.status === "waiting") {
    return (
      <div className="relative min-h-0 w-full flex-1">
        <TableBg tone="green">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.55)" }}>en attente</span>
            <h2 className="cb-display-lg mt-2">Distribution…</h2>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Min 3 joueurs · 1er à vider = Président</p>
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

  if (state.status === "round-over") {
    return (
      <div className="relative min-h-0 w-full flex-1">
        <TableBg tone="green">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.55)" }}>fin de manche</span>
            <h2 className="cb-display-lg mt-2">Hiérarchie révélée</h2>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Le classement s&apos;affiche dans le shell…</p>
          </div>
        </TableBg>
      </div>
    );
  }

  const opps = state.otherPlayers.filter((p) => p.id !== playerId);

  return (
    <div className="relative min-h-0 w-full flex-1 select-none overflow-hidden">
      <TableBg tone="green">
        {/* Opponents — row across the top (under the shell's top bar) */}
        <div className="absolute inset-x-0 top-0 flex justify-center gap-5 px-12 pt-3 sm:gap-10">
          {opps.map((o, i) => {
            const pill = o.finishedAt ? RANK_PILL[o.finishedAt] : null;
            return (
              <div key={o.id} className="relative flex flex-col items-center" style={{ opacity: o.finishedAt ? 0.6 : 1 }}>
                {/* mini face-down fan */}
                <div className="mb-1 flex h-8 items-end justify-center">
                  {Array.from({ length: Math.min(4, o.cardCount) }).map((_, k) => (
                    <div key={k} style={{ marginLeft: k === 0 ? 0 : -22, transform: `rotate(${(k - 1.5) * 7}deg)` }}>
                      <PlayingCard faceDown size="xs" />
                    </div>
                  ))}
                </div>
                <SeatAvatar name={o.name} hue={i + 1} isBot isTurn={o.isCurrentTurn} cardCount={o.cardCount} />
                {pill && (
                  <span className="mt-1 rounded-full px-2 py-0.5 text-[8px] font-black tracking-wider"
                        style={{ background: pill.bg, color: pill.fg, fontFamily: "var(--font-display)" }}>
                    {pill.label}
                  </span>
                )}
                {o.passed && !o.finishedAt && (
                  <span className="mt-1 rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wider"
                        style={{ background: "rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-display)" }}>
                    PASSE
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Center — combo to beat */}
        <div className="absolute left-1/2 top-[44%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <span className="whitespace-nowrap rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em]"
                style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-display)" }}>
            {state.lastCombo.length === 0
              ? "tu mènes — joue ce que tu veux"
              : `à battre · ${state.lastCombo.length} carte${state.lastCombo.length > 1 ? "s" : ""}`}
          </span>
          {state.lastCombo.length > 0 && (
            <div className="flex">
              {state.lastCombo.map((c, i) => (
                <div key={i} style={{
                  marginLeft: i === 0 ? 0 : -14,
                  transform: `rotate(${(i - (state.lastCombo.length - 1) / 2) * 4}deg)`,
                  filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.55))",
                }}>
                  <PlayingCard rank={c.rank} suit={c.suit} size="md" cardStyle={cardStyle} raised />
                </div>
              ))}
            </div>
          )}
          {isMyTurn && (
            <span className="mt-1 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black tracking-[0.12em] text-white"
                  style={{ background: state.timeLeft <= 5 ? "linear-gradient(180deg,#FF6B5B,#C13D1A)" : "linear-gradient(180deg,#FF8E58,#C13D1A)", fontFamily: "var(--font-display)" }}>
              À TOI · {state.timeLeft}s
            </span>
          )}
        </div>

        {/* Action bar — above the fan */}
        {isMyTurn && (
          <div className="absolute bottom-[124px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            <span className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-bold text-white/85"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "var(--font-display)" }}>
              {selected.size === 0 ? "sélectionne un combo" : `${selected.size} carte${selected.size > 1 ? "s" : ""}`}
            </span>
            {state.lastCombo.length > 0 && (
              <button onClick={pass}
                className="rounded-full px-3.5 py-1.5 text-[10px] font-black tracking-[0.14em] text-white active:scale-95"
                style={{ background: "linear-gradient(180deg,#3B82F6,#1D4ED8)", border: "1.5px solid rgba(180,210,255,0.4)", fontFamily: "var(--font-display)", boxShadow: "0 0 14px rgba(59,130,246,0.4)" }}>
                PASSE
              </button>
            )}
            <button onClick={playSelection} disabled={selected.size === 0}
              className="rounded-full px-3.5 py-1.5 text-[10px] font-black tracking-[0.14em] text-white active:scale-95 disabled:opacity-50"
              style={{
                background: selected.size === 0 ? "rgba(255,255,255,0.08)" : "linear-gradient(180deg,#22C55E,#15803D)",
                border: "1.5px solid " + (selected.size === 0 ? "rgba(255,255,255,0.12)" : "rgba(180,255,200,0.4)"),
                fontFamily: "var(--font-display)",
                boxShadow: selected.size === 0 ? "none" : "0 0 14px rgba(34,197,94,0.4)",
              }}>
              JOUER ↑
            </button>
          </div>
        )}

        {/* My fan */}
        <div className="absolute inset-x-0 bottom-[-6px] z-40 flex justify-center">
          <div style={{ width: "min(88%, 620px)" }}>
            <FanHand
              hand={myHand}
              onClickIndex={isMyTurn ? toggle : undefined}
              selectedSet={selected}
              disabled={!isMyTurn}
              cardSize="md"
              maxWidth={560}
              cardStyle={cardStyle}
            />
          </div>
        </div>

        {/* Me — bottom-left */}
        <div className="absolute bottom-3 left-3 z-30">
          <SeatAvatar name={playerName} hue={2} isBot={false} isTurn={isMyTurn} cardCount={myHand.length} />
        </div>
      </TableBg>
    </div>
  );
}
