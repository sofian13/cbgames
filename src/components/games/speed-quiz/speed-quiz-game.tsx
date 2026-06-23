"use client";

import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type { SpeedQuizState, SpeedQuizPlayer } from "@/lib/party/message-types";
import { useKeyedState } from "@/lib/use-keyed-state";

const palette = ["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8","#E89A2B","#00B3A6","#E23434"];
const LETTERS = ["A", "B", "C", "D"];

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
  // sélection locale, réinitialisée à chaque question
  const [picked, setPicked] = useKeyedState<number | null>(roundKey, null);

  const me = state?.players?.find((p) => p.id === playerId);

  if (!state) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-white">
        <h2 className="cb-display-lg">Le quiz arrive…</h2>
      </div>
    );
  }

  // ── CONFIG PHASE (on choisit le timer + le nombre de questions) ──
  if (state.status === "config") {
    const times = state.timeOptions ?? [10, 15, 20, 30];
    const rounds = state.roundOptions ?? [10, 15, 20];
    return (
      <div className="flex h-full flex-col items-center justify-center px-5 text-white">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>réglages</span>
        <h2 className="cb-display-md mt-1 mb-5 text-center">Speed Quiz ⚡</h2>

        <p className="cb-eyebrow mb-2" style={{ color: "var(--cb-trivia)" }}>Temps par question</p>
        <div className="grid w-full max-w-md grid-cols-4 gap-2">
          {times.map((t) => {
            const active = t === state.questionTime;
            return (
              <button
                key={t}
                onClick={() => sendAction({ action: "set-time", time: t })}
                className="rounded-2xl border py-3 text-center transition active:scale-95"
                style={{
                  background: active ? "var(--cb-trivia)" : "rgba(255,255,255,0.05)",
                  borderColor: active ? "var(--cb-trivia)" : "rgba(255,255,255,0.1)",
                  color: active ? "#000" : "#fff",
                }}
              >
                <span className="cb-display-sm">{t}</span>
                <span className="block text-[10px] opacity-70">sec</span>
              </button>
            );
          })}
        </div>

        <p className="cb-eyebrow mb-2 mt-5" style={{ color: "var(--cb-trivia)" }}>Nombre de questions</p>
        <div className="grid w-full max-w-md grid-cols-3 gap-2">
          {rounds.map((r) => {
            const active = r === state.totalRounds;
            return (
              <button
                key={r}
                onClick={() => sendAction({ action: "set-rounds", rounds: r })}
                className="rounded-2xl border py-3 text-center transition active:scale-95"
                style={{
                  background: active ? "var(--cb-trivia)" : "rgba(255,255,255,0.05)",
                  borderColor: active ? "var(--cb-trivia)" : "rgba(255,255,255,0.1)",
                  color: active ? "#000" : "#fff",
                }}
              >
                <span className="cb-display-sm">{r}</span>
                <span className="block text-[10px] opacity-70">questions</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => sendAction({ action: "begin" })}
          className="cb-btn mt-7 w-full max-w-md py-4"
          style={{ background: "var(--cb-brand)", color: "var(--cb-brand-ink)" }}
        >
          Lancer le quiz
        </button>
        <p className="mt-3 text-[11px] text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
          N&apos;importe qui peut régler et lancer.
        </p>
      </div>
    );
  }

  // ── QUESTION PHASE ─────────────────────────────────────
  if (state.status === "question" && state.currentQuestion) {
    const total = state.currentQuestion.total;
    const idx = state.currentQuestion.index;
    const timeLeft = state.timeLeft ?? 0;
    const qTime = state.questionTime ?? 15;
    const urgent = timeLeft <= 5;
    const dashLen = 238.7;
    const dashOffset = dashLen * (1 - Math.max(0, timeLeft) / qTime);

    const choose = (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      sendAction({ action: "answer", choiceIndex: i });
    };

    return (
      <div className="relative flex h-full flex-col">
        {/* Top: progress + score */}
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
                  background: i < idx ? "var(--cb-strategy)" : i === idx ? "var(--cb-trivia)" : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
          <span className="cb-mono text-[10px] font-bold" style={{ color: "var(--cb-brand)" }}>
            {me?.score ?? 0} pts
          </span>
        </div>

        {/* Timer arc */}
        <div className="flex flex-col items-center pt-3">
          <div className="relative h-16 w-16">
            <svg width="64" height="64" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="42" cy="42" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
              <circle cx="42" cy="42" r="38" fill="none"
                stroke={urgent ? "var(--cb-social)" : "var(--cb-trivia)"} strokeWidth="5"
                strokeDasharray={dashLen} strokeDashoffset={dashOffset} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="cb-display-sm text-white">{Math.max(0, timeLeft)}</span>
            </div>
          </div>
          <span className="cb-eyebrow mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            {state.currentQuestion.category}
          </span>
        </div>

        {/* Question */}
        <div className="px-6 pt-2 pb-3">
          <h2 className="cb-display-sm text-center text-white text-balance">
            {state.currentQuestion.text}
          </h2>
        </div>

        {/* Choices */}
        <div className="mt-auto grid grid-cols-1 gap-2.5 px-4 pb-3">
          {state.currentQuestion.choices.map((c, i) => {
            const isPicked = picked === i;
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={picked !== null}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99] disabled:opacity-100"
                style={{
                  background: isPicked ? "var(--cb-brand-tint)" : "rgba(255,255,255,0.05)",
                  borderColor: isPicked ? "var(--cb-brand)" : "rgba(255,255,255,0.12)",
                  opacity: picked !== null && !isPicked ? 0.5 : 1,
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#fff", fontFamily: "var(--font-display)" }}
                >
                  {LETTERS[i]}
                </span>
                <span className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {c}
                </span>
              </button>
            );
          })}
        </div>

        {/* answered avatars */}
        <div className="flex justify-center gap-1.5 px-4 pb-3">
          {state.players?.map((p: SpeedQuizPlayer) => (
            <div
              key={p.id}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-black"
              style={{
                background: colorFor(p.name),
                color: "#fff",
                fontFamily: "var(--font-display)",
                opacity: p.hasAnswered ? 1 : 0.4,
                boxShadow: p.hasAnswered ? "0 0 0 2px var(--cb-strategy)" : "none",
              }}
            >
              {initialsOf(p.name)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── REVEAL PHASE (bonne réponse + explication + bouton Suivant) ──
  if (state.status === "reveal" && state.currentQuestion) {
    const correctIndex = state.correctIndex ?? -1;
    const myResult = state.results?.find((r) => r.playerId === playerId);
    const myChoice = myResult?.choiceIndex ?? null;
    const sorted = state.players?.slice().sort((a, b) => b.score - a.score) ?? [];
    const isLast = state.currentQuestion.index + 1 >= state.currentQuestion.total;

    return (
      <div className="flex h-full flex-col px-4 pt-3">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          réponse · Q {state.currentQuestion.index + 1}/{state.currentQuestion.total}
        </span>
        <h2 className="cb-display-sm mt-1 text-white text-balance">{state.currentQuestion.text}</h2>

        {/* Choices revealed */}
        <div className="mt-3 grid grid-cols-1 gap-2">
          {state.currentQuestion.choices.map((c, i) => {
            const isCorrect = i === correctIndex;
            const isMyWrong = i === myChoice && myChoice !== correctIndex;
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                style={{
                  background: isCorrect ? "rgba(24,169,87,0.16)" : isMyWrong ? "rgba(226,52,52,0.12)" : "rgba(255,255,255,0.04)",
                  borderColor: isCorrect ? "rgba(24,169,87,0.5)" : isMyWrong ? "rgba(226,52,52,0.4)" : "rgba(255,255,255,0.08)",
                }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#fff", fontFamily: "var(--font-display)" }}
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1 text-sm font-bold" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
                  {c}
                </span>
                {isCorrect && <span style={{ color: "var(--cb-strategy)" }}>✓</span>}
                {isMyWrong && <span style={{ color: "var(--cb-social)" }}>✗ toi</span>}
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        {state.explanation && (
          <div
            className="mt-3 rounded-2xl border px-4 py-3"
            style={{ background: "var(--cb-brand-tint)", borderColor: "var(--line-brand)" }}
          >
            <p className="cb-eyebrow mb-1" style={{ color: "var(--cb-brand)" }}>explication</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>{state.explanation}</p>
          </div>
        )}

        {/* Mini classement */}
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

        <button
          onClick={() => sendAction({ action: "next" })}
          className="cb-btn my-3 w-full py-4"
          style={{ background: "var(--cb-brand)", color: "var(--cb-brand-ink)" }}
        >
          {isLast ? "Voir le classement final" : "Question suivante →"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      {error && (
        <div className="rounded-xl border px-4 py-2 text-sm"
          style={{ background: "rgba(226,52,52,0.12)", borderColor: "rgba(226,52,52,0.35)", color: "#FF8888" }}>
          {error}
        </div>
      )}
    </div>
  );
}
