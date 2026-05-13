"use client";

import { useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { PlayingCard, type Suit, type Rank } from "@/components/shared/playing-card";
import { cn } from "@/lib/utils";

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

const palette = ["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8","#E89A2B","#00B3A6","#E23434"];

export default function PresidentGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "president", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as PresidentState | null;
  const [selected, setSelected] = useState<number[]>([]);

  const myHand = state?.hands?.[playerId] ?? [];
  const isMyTurn = state?.currentPlayerId === playerId;

  function toggle(i: number) {
    setSelected((sel) => sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]);
  }

  function playSelection() {
    if (selected.length === 0) return;
    sendAction({ action: "play-combo",  playerId, indices: selected  });
    setSelected([]);
  }

  function pass() {
    sendAction({ action: "pass",  playerId  });
  }

  if (!state || state.status === "waiting") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>en attente</span>
        <h2 className="cb-display-lg mt-2">Distribution…</h2>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Min 3 joueurs · 1er à vider = Président
        </p>
      </div>
    );
  }

  if (state.status === "round-over") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>fin de manche</span>
        <h2 className="cb-display-lg mt-2">Hiérarchie révélée</h2>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Le classement s&apos;affiche dans le shell…
        </p>
      </div>
    );
  }

  const opps = state.otherPlayers.filter((p) => p.id !== playerId);

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
              opacity: o.finishedAt ? 0.55 : 1,
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
                    style={{ fontFamily: "var(--font-display)" }}>{o.name}</span>
              {o.finishedAt && (
                <span
                  className="ml-auto rounded-full px-1.5 text-[8px] font-black"
                  style={{ background: "#E3B83A", color: "#3B2C00" }}
                >
                  #{o.finishedAt}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="cb-mono text-[10px]" style={{
                color: o.isCurrentTurn ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)"
              }}>
                {o.cardCount} cartes
              </span>
              {o.passed && (
                <span className="text-[9px]" style={{
                  color: o.isCurrentTurn ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.5)"
                }}>· passe</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Felt with last combo */}
      <div
        className="relative mx-3 mt-3 flex flex-1 flex-col items-center justify-center rounded-3xl"
        style={{
          background: "radial-gradient(120% 80% at 50% 50%, #1B3D2A 0%, #0D2418 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <span
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "rgba(0,0,0,0.4)",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "var(--font-display)",
          }}
        >
          {state.lastCombo.length === 0
            ? "tu mènes — joue ce que tu veux"
            : `à battre · ${state.lastCombo.length} carte${state.lastCombo.length > 1 ? "s" : ""}`}
        </span>

        {state.lastCombo.length > 0 && (
          <div className="mt-3 flex gap-1">
            {state.lastCombo.map((c, i) => (
              <div
                key={i}
                style={{ transform: `rotate(${(i - (state.lastCombo.length - 1) / 2) * 3}deg)` }}
              >
                <PlayingCard value={c.rank as Rank} suit={c.suit as Suit} size="md" raised
                             style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.45)" }}/>
              </div>
            ))}
          </div>
        )}

        {isMyTurn && (
          <div
            className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-black"
            style={{
              background: state.timeLeft <= 5 ? "var(--cb-social)" : "var(--cb-brand)",
              color: "#fff",
              fontFamily: "var(--font-display)",
            }}
          >
            {state.timeLeft}s
          </div>
        )}
      </div>

      {/* Selection summary + actions */}
      {isMyTurn && (
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              {selected.length === 0
                ? "Sélectionne une carte (ou un combo)"
                : `${selected.length} carte${selected.length > 1 ? "s" : ""} sélectionnée${selected.length > 1 ? "s" : ""}`}
            </span>
            {state.lastCombo.length > 0 && (
              <button onClick={pass} className="cb-btn cb-btn-soft cb-btn-sm">Passer</button>
            )}
            <button
              onClick={playSelection}
              disabled={selected.length === 0}
              className={cn("cb-btn cb-btn-sm",
                selected.length === 0 ? "cb-btn-soft" : "cb-btn-brand"
              )}
            >
              Jouer
            </button>
          </div>
        </div>
      )}

      {/* My hand */}
      <div className="relative h-32 px-3 pt-2">
        <div className="relative mx-auto" style={{ width: "100%", maxWidth: 540, height: 110 }}>
          {myHand.map((c, i) => {
            const n = myHand.length;
            const mid = (n - 1) / 2;
            const offset = i - mid;
            const spacing = Math.min(34, 320 / Math.max(1, n - 1));
            const rot = offset * Math.min(3, 16 / Math.max(1, n - 1));
            const x = offset * spacing;
            const y = Math.abs(offset) * 1.5;
            const isSelected = selected.includes(i);
            return (
              <button
                key={i}
                onClick={() => isMyTurn && toggle(i)}
                disabled={!isMyTurn}
                className="absolute outline-none"
                style={{
                  left: "50%", bottom: 0,
                  transform: `translateX(${x - 28}px) translateY(${-y - (isSelected ? 16 : 0)}px) rotate(${rot}deg)`,
                  transformOrigin: "center 95px",
                  zIndex: isSelected ? 100 + i : i,
                  cursor: isMyTurn ? "pointer" : "not-allowed",
                  transition: "transform 0.2s var(--ease-out)",
                }}
              >
                <PlayingCard
                  value={c.rank as Rank}
                  suit={c.suit as Suit}
                  size="md"
                  dim={!isMyTurn && !isSelected}
                  raised={isSelected}
                  style={isSelected ? {
                    boxShadow: "0 12px 24px rgba(255,106,61,0.5)",
                    outline: "3px solid var(--cb-brand)",
                    outlineOffset: -3,
                  } : undefined}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
