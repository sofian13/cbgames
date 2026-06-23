"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type { SpeedQuizState, SpeedQuizPlayer } from "@/lib/party/message-types";
import { useKeyedState } from "@/lib/use-keyed-state";

const palette = ["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8","#E89A2B","#00B3A6","#E23434"];

function initialsOf(name: string): string {
  return (name || "?").split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}
function colorFor(name: string): string {
  const hash = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export default function SpeedQuizGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "speed-quiz", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as SpeedQuizState;
  const roundKey = state?.round ?? 0;
  // input/submitted réinitialisés à chaque question (clés sur la manche)
  const [input, setInput] = useKeyedState<string>(roundKey, "");
  const [submitted, setSubmitted] = useKeyedState<boolean>(roundKey, false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.status === "question") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state?.status, state?.round]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || submitted) return;
    setSubmitted(true);
    sendAction({ action: "answer", answer: trimmed });
  }, [input, sendAction, setSubmitted, submitted]);

  if (!state || state.status === "waiting") {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-white">
        <div>
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
            préparation
          </span>
          <h2 className="cb-display-lg mt-2">Le quiz arrive…</h2>
        </div>
      </div>
    );
  }

  const me = state.players?.find((p) => p.id === playerId);

  // ── QUESTION PHASE ─────────────────────────────────────
  if (state.status === "question" && state.currentQuestion) {
    const total = state.currentQuestion.total;
    const idx = state.currentQuestion.index;
    const timeLeft = state.timeLeft ?? 0;
    const qTime = state.questionTime ?? 15;
    const urgent = timeLeft <= 5;
    const dashLen = 238.7;
    const dashOffset = dashLen * (1 - Math.max(0, timeLeft) / qTime);

    return (
      <div className="relative flex h-full flex-col">
        {/* Top: progress dots + score */}
        <div className="flex items-center justify-between px-4 pt-2">
          <span className="cb-mono text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Q {idx + 1}/{total}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className="block h-1 w-3 rounded-full"
                style={{
                  background: i < idx
                    ? "var(--cb-strategy)"
                    : i === idx
                    ? "var(--cb-trivia)"
                    : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
          <span className="cb-mono text-[10px] font-bold" style={{ color: "var(--cb-brand)" }}>
            {me?.score ?? 0} pts
          </span>
        </div>

        {/* Timer arc */}
        <div className="flex flex-col items-center pt-4">
          <div className="relative h-20 w-20">
            <svg width="80" height="80" viewBox="0 0 84 84"
                 style={{ transform: "rotate(-90deg)" }}>
              <circle cx="42" cy="42" r="38" fill="none"
                      stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
              <circle cx="42" cy="42" r="38" fill="none"
                      stroke={urgent ? "var(--cb-social)" : "var(--cb-trivia)"}
                      strokeWidth="5"
                      strokeDasharray={dashLen}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="cb-display-md text-white">{Math.max(0, timeLeft)}</span>
              <span className="cb-eyebrow text-[8px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                sec
              </span>
            </div>
          </div>
          <span className="cb-eyebrow mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            {state.currentQuestion.category}
          </span>
        </div>

        {/* Question */}
        <div className="px-6 pt-3 pb-2">
          {state.currentQuestion.image && (
            <div className="mb-3 flex justify-center">
              <picture>
                <img
                  src={state.currentQuestion.image}
                  alt=""
                  className="max-h-48 rounded-2xl border object-contain"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                />
              </picture>
            </div>
          )}
          <h2 className="cb-display-md text-center text-white text-balance">
            {state.currentQuestion.text}
          </h2>
        </div>

        {/* Input or waiting */}
        <div className="px-4">
          {!submitted ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="ta réponse..."
                autoFocus
                autoComplete="off"
                className="flex-1 rounded-xl border px-4 py-3 text-base font-bold outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: urgent ? "var(--cb-social)" : "var(--cb-trivia)",
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="cb-btn"
                style={{
                  background: input.trim() ? "var(--cb-brand)" : "rgba(255,255,255,0.06)",
                  color: input.trim() ? "var(--cb-brand-ink)" : "rgba(255,255,255,0.4)",
                }}
              >
                OK
              </button>
            </div>
          ) : (
            <div
              className="rounded-xl border px-4 py-3 text-center"
              style={{
                background: "var(--cb-brand-tint)",
                borderColor: "var(--line-brand)",
                color: "var(--cb-brand)",
              }}
            >
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Réponse envoyée
              </p>
              <p className="text-xs mt-0.5 opacity-75">la bonne réponse arrive…</p>
            </div>
          )}
        </div>

        {/* Players avatars at bottom */}
        <div className="mt-auto flex justify-center gap-1.5 px-4 py-3">
          {state.players?.map((p: SpeedQuizPlayer) => (
            <div
              key={p.id}
              className="relative h-9 w-9 rounded-full"
              style={{
                background: colorFor(p.name),
                opacity: p.hasAnswered ? 1 : 0.45,
                boxShadow: p.hasAnswered ? "0 0 0 2px var(--cb-strategy)" : "none",
              }}
            >
              <span
                className="flex h-full w-full items-center justify-center text-[10px] font-black"
                style={{ color: "#fff", fontFamily: "var(--font-display)" }}
              >
                {initialsOf(p.name)}
              </span>
              {p.hasAnswered && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2"
                  style={{
                    background: "var(--cb-strategy)",
                    borderColor: "var(--bg-deep)",
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── REVEAL PHASE (auto, façon "12 coups de midi") ──────
  if (state.status === "reveal" && state.currentQuestion) {
    const myResult = state.results?.find((r) => r.playerId === playerId);
    const good = myResult?.correct;
    const sorted = state.players?.slice().sort((a, b) => b.score - a.score) ?? [];

    return (
      <div className="flex h-full flex-col px-4 pt-3">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          réponse · Q {state.currentQuestion.index + 1}/{state.currentQuestion.total}
        </span>
        <h2 className="cb-display-sm mt-1 text-white text-balance">
          {state.currentQuestion.text}
        </h2>

        {/* Bonne réponse */}
        <div
          className="mt-3 rounded-2xl border px-4 py-4 text-center"
          style={{ background: "rgba(24,169,87,0.12)", borderColor: "rgba(24,169,87,0.4)" }}
        >
          <p className="cb-eyebrow" style={{ color: "var(--cb-strategy)" }}>la réponse</p>
          <p className="cb-display-md mt-1" style={{ color: "#fff" }}>{state.correctAnswer}</p>
        </div>

        {/* Mon résultat */}
        {myResult && (
          <div
            className="mt-3 flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{
              background: good ? "rgba(24,169,87,0.12)" : "rgba(226,52,52,0.10)",
              borderColor: good ? "rgba(24,169,87,0.4)" : "rgba(226,52,52,0.3)",
            }}
          >
            <span className="cb-display-sm" style={{ color: good ? "var(--cb-strategy)" : "var(--cb-social)" }}>
              {good ? "✓" : "✗"}
            </span>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>ta réponse</p>
              <p className="text-sm font-bold" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
                {myResult.answer || "(rien)"}
              </p>
            </div>
            <span className="cb-display-sm" style={{ color: good ? "var(--cb-strategy)" : "rgba(255,255,255,0.4)" }}>
              +{myResult.gained}
            </span>
          </div>
        )}

        {/* Classement compact */}
        <div className="cb-scroll mt-3 flex-1 overflow-y-auto space-y-1.5">
          {sorted.map((p, i) => {
            const r = state.results?.find((x) => x.playerId === p.id);
            return (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{
                  background: i === 0 ? "rgba(227,184,58,0.12)" : "rgba(255,255,255,0.04)",
                  borderColor: i === 0 ? "rgba(227,184,58,0.35)" : "rgba(255,255,255,0.08)",
                }}
              >
                <span className="cb-mono w-5 text-center text-[11px]" style={{ color: i === 0 ? "#E3B83A" : "rgba(255,255,255,0.4)" }}>
                  {i + 1}
                </span>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ background: colorFor(p.name), color: "#fff", fontFamily: "var(--font-display)" }}
                >
                  {initialsOf(p.name)}
                </span>
                <span className="flex-1 text-sm font-bold" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
                  {p.name}{p.id === playerId && <span style={{ color: "rgba(255,255,255,0.4)" }}> (toi)</span>}
                </span>
                {r && r.gained > 0 && (
                  <span className="cb-mono text-[11px]" style={{ color: "var(--cb-strategy)" }}>+{r.gained}</span>
                )}
                <span className="cb-mono text-sm font-bold" style={{ color: i === 0 ? "#E3B83A" : "rgba(255,255,255,0.6)" }}>
                  {p.score}
                </span>
              </div>
            );
          })}
        </div>

        <p className="py-3 text-center text-xs animate-pulse" style={{ color: "rgba(255,255,255,0.45)" }}>
          Question suivante…
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      {error && (
        <div
          className="rounded-xl border px-4 py-2 text-sm"
          style={{
            background: "rgba(226,52,52,0.12)",
            borderColor: "rgba(226,52,52,0.35)",
            color: "#FF8888",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
