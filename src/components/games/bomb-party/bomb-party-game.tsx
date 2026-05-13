"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type { BombPartyState, BombPartyPlayer } from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

const palette = ["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8","#E89A2B","#00B3A6","#E23434"];

function initialsOf(name: string): string {
  return (name || "?").split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function colorFor(name: string): string {
  const hash = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export default function BombPartyGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "bomb-party", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as BombPartyState;

  const [word, setWord] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isMyTurn = state?.currentPlayerId === playerId;

  useEffect(() => {
    if (isMyTurn) inputRef.current?.focus();
    setWord("");
  }, [isMyTurn, state?.syllable]);

  if (!state || state.status === "waiting") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          en attente
        </span>
        <h2 className="cb-display-lg mt-2">Préparation...</h2>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !isMyTurn) return;
    sendAction({ action: "submit-word", word: word.trim() });
    setWord("");
  };

  const timeLeft = state.timeLeft ?? 0;
  const danger = Math.max(0, Math.min(1, 1 - timeLeft / 10));
  const urgent = timeLeft <= 3;
  const dashLen = 332;
  const dashOffset = dashLen * (1 - danger);

  // Opponents arranged around a ring
  const opponents = (state.players || []).filter((p) => p.id !== playerId);
  const rad = 130;
  const me = state.players?.find((p) => p.id === playerId);

  // Used alphabet from completed words (for bonus = use all 26 = +1 life)
  // We approximate by inspecting state.usedWords — collect letters typed by me
  const myUsedWords = (state.usedWords || []).filter(() => true).join("");
  const usedLetters = new Set(
    myUsedWords.toLowerCase().split("").filter((c) => /[a-z]/.test(c)).map((c) => c.toUpperCase())
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* Top status row */}
      <div className="flex items-center justify-between gap-2 px-4 pt-2">
        <span
          className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "rgba(0,0,0,0.4)",
            borderColor: "rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        >
          💣 Bomb Party
        </span>
        <span
          className="cb-chip-live rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: urgent ? "var(--cb-social)" : "var(--cb-brand)",
            color: "#fff",
            borderColor: "transparent",
          }}
        >
          T-{Math.max(0, timeLeft)}s
        </span>
        <span className="cb-mono text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          {(state.players || []).filter((p) => p.isAlive).length}/{state.players?.length ?? 0}
        </span>
      </div>

      {/* Hero bomb area */}
      <div className="relative flex flex-1 items-center justify-center">
        {/* Opponents ring */}
        {opponents.map((o, i) => {
          const total = opponents.length || 1;
          const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * rad;
          const y = Math.sin(angle) * rad;
          return (
            <div
              key={o.id}
              className="absolute flex flex-col items-center gap-1"
              style={{
                left: "50%", top: "50%",
                transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
                opacity: o.isAlive ? 1 : 0.35,
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black"
                style={{
                  background: colorFor(o.name),
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                  border: o.id === state.currentPlayerId ? "2px solid #fff" : "none",
                  boxShadow: o.id === state.currentPlayerId ? "0 0 0 3px var(--cb-brand)" : "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                {initialsOf(o.name)}
              </div>
              <div className="flex gap-0.5">
                {[0, 1, 2].map((k) => (
                  <span
                    key={k}
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: k < o.lives ? "var(--cb-social)" : "rgba(255,255,255,0.18)",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Center fuse ring + syllable */}
        <div className="relative h-56 w-56 flex items-center justify-center">
          <svg width="220" height="220" viewBox="0 0 120 120"
               style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r="53" fill="none"
                    stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle cx="60" cy="60" r="53" fill="none"
                    stroke={urgent ? "var(--cb-social)" : "var(--cb-brand)"}
                    strokeWidth="6"
                    strokeDasharray={dashLen}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div
            className="flex h-44 w-44 flex-col items-center justify-center rounded-full"
            style={{
              background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.06), rgba(0,0,0,0.5))",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
              animation: urgent ? "cb-pulse 0.6s infinite" : "none",
            }}
          >
            <span className="cb-eyebrow mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              syllabe
            </span>
            <span
              className="text-white text-5xl font-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {state.syllable}
            </span>
          </div>
        </div>
      </div>

      {/* Alphabet bonus row */}
      <div className="px-4 py-2">
        <span className="cb-eyebrow flex items-center gap-2" style={{ color: "rgba(255,255,255,0.5)" }}>
          alphabet bonus <span style={{ color: "var(--cb-strategy)" }}>+1 vie</span>
        </span>
        <div className="mt-1 flex flex-wrap gap-1">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => {
            const used = usedLetters.has(c);
            return (
              <span
                key={c}
                className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-black"
                style={{
                  background: used ? "var(--cb-strategy)" : "rgba(255,255,255,0.05)",
                  color: used ? "#fff" : "rgba(255,255,255,0.4)",
                  border: "1px solid " + (used ? "transparent" : "rgba(255,255,255,0.08)"),
                  fontFamily: "var(--font-display)",
                }}
              >
                {c}
              </span>
            );
          })}
        </div>
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-4 pb-2">
        <input
          ref={inputRef}
          value={word}
          onChange={(e) => setWord(e.target.value.toLowerCase())}
          placeholder={isMyTurn ? `mot avec « ${state.syllable} »` : "attends ton tour..."}
          disabled={!isMyTurn}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1 rounded-xl border px-4 py-3 text-base font-bold lowercase outline-none transition"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderColor: isMyTurn
              ? (urgent ? "var(--cb-social)" : "var(--cb-brand)")
              : "rgba(255,255,255,0.1)",
            color: "#fff",
            fontFamily: "var(--font-display)",
            boxShadow: isMyTurn && urgent ? "0 0 0 3px rgba(226,52,52,0.25)" : undefined,
          }}
        />
        <button
          type="submit"
          disabled={!isMyTurn || !word.trim()}
          className="cb-btn"
          style={{
            background: isMyTurn && word.trim() ? "var(--cb-brand)" : "rgba(255,255,255,0.06)",
            color: isMyTurn && word.trim() ? "var(--cb-brand-ink)" : "rgba(255,255,255,0.4)",
            minWidth: "3.5rem",
          }}
        >
          OK
        </button>
      </form>

      {/* Error chip */}
      {error && (
        <div
          className="mx-4 mb-2 rounded-lg border px-3 py-2 text-xs"
          style={{
            background: "rgba(226,52,52,0.12)",
            borderColor: "rgba(226,52,52,0.35)",
            color: "#FF8888",
          }}
        >
          {error}
        </div>
      )}

      {/* Player score strip (current + own lives at top) */}
      {me && (
        <div className="px-4 pb-2">
          <div
            className="flex items-center gap-3 rounded-lg border px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black"
              style={{
                background: colorFor(me.name),
                color: "#fff",
                fontFamily: "var(--font-display)",
              }}
            >
              {initialsOf(me.name)}
            </span>
            <span className="text-xs font-bold" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
              Toi
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((k) => (
                  <span
                    key={k}
                    className="block h-2.5 w-2.5 rounded-full"
                    style={{
                      background: k < me.lives ? "var(--cb-social)" : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
              <span className="cb-mono text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                {me.score} pts
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
