"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type {
  SpeedQuizState,
  SpeedQuizPlayer,
  SpeedQuizAnswer,
} from "@/lib/party/message-types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

const DIFF_COLORS = {
  easy: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "Facile" },
  medium: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", label: "Moyen" },
  hard: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", label: "Difficile" },
};

export default function SpeedQuizGame({
  roomCode,
  playerId,
  playerName,
}: GameProps) {
  const { sendAction } = useGame(roomCode, "speed-quiz", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as SpeedQuizState;
  const roundKey = state?.round ?? 0;
  const [input, setInput] = useKeyedState<string>(roundKey, "");
  const [submitted, setSubmitted] = useKeyedState<boolean>(roundKey, false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset input when a new question starts
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleValidate = useCallback(
    (correct: boolean) => {
      sendAction({ action: "validate", correct });
    },
    [sendAction]
  );

  if (!state || state.status === "waiting") {
    return (
      <div
        className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(109,40,217,0.10), transparent 45%), #09090b",
        }}
      >
        <div className="rounded-3xl border border-white/25 bg-black/30 px-10 py-8 backdrop-blur-sm shadow-[0_0_20px_rgba(139,92,246,0.25)]">
          <p className="text-2xl font-sans font-semibold text-white/90 animate-pulse">
            En attente des joueurs...
          </p>
        </div>
      </div>
    );
  }

  const isHost = playerId === state.hostId;
  const diff = state.currentQuestion?.difficulty
    ? DIFF_COLORS[state.currentQuestion.difficulty]
    : DIFF_COLORS.medium;

  // ── QUESTION PHASE ─────────────────────────────────────
  if (state.status === "question" && state.currentQuestion) {
    const timeRatio = ((state.timeLeft ?? 0) / 20) * 100;
    const isUrgent = (state.timeLeft ?? 0) <= 5;

    return (
      <div
        className="relative flex min-h-screen flex-1 flex-col items-center gap-8 overflow-hidden px-6 py-8"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(109,40,217,0.10), transparent 45%), #09090b",
        }}
      >
        {/* Timer + round info panel */}
        <div className="w-full max-w-2xl rounded-3xl border border-white/25 bg-black/30 px-6 py-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-white/40">
                {state.currentQuestion.index + 1}
                <span className="text-white/25"> / {state.currentQuestion.total}</span>
              </span>
              <span
                className={cn(
                  "text-xs px-3 py-1 rounded-full border font-sans font-medium",
                  diff.bg,
                  diff.border,
                  diff.text
                )}
              >
                {diff.label}
              </span>
              <span className="text-xs px-3 py-1 rounded-full border border-white/[0.12] bg-white/[0.04] text-white/40 font-sans">
                {state.currentQuestion.category}
              </span>
            </div>
            <span
              className={cn(
                "text-3xl font-mono font-semibold",
                isUrgent ? "text-red-400 animate-pulse" : "text-violet-400"
              )}
              style={
                isUrgent
                  ? { textShadow: "0 0 14px rgba(248,113,113,0.5)" }
                  : { textShadow: "0 0 14px rgba(139,92,246,0.4)" }
              }
            >
              {state.timeLeft ?? 0}s
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                isUrgent
                  ? "bg-gradient-to-r from-red-500 to-red-400"
                  : "bg-gradient-to-r from-violet-500 to-purple-400"
              )}
              style={{
                width: `${timeRatio}%`,
                boxShadow: isUrgent
                  ? "0 0 12px rgba(239,68,68,0.4)"
                  : "0 0 12px rgba(139,92,246,0.35)",
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="w-full max-w-2xl text-center mt-2">
          {state.currentQuestion.image && (
            <div className="mb-8 flex justify-center">
              <picture>
                <img
                  src={state.currentQuestion.image}
                  alt=""
                  className="max-h-64 rounded-2xl border border-white/[0.12] object-contain shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                />
              </picture>
            </div>
          )}
          <h2
            className="text-3xl font-serif font-semibold text-white/90 mb-10 leading-relaxed"
            style={{ textShadow: "0 2px 20px rgba(139,92,246,0.15)" }}
          >
            {state.currentQuestion.text}
          </h2>

          {!submitted ? (
            <div className="flex gap-4 max-w-lg mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ta reponse..."
                autoFocus
                autoComplete="off"
                className="flex-1 rounded-2xl border border-white/25 bg-black/30 px-5 py-3.5 font-mono text-lg text-white/90 placeholder:text-white/25 outline-none backdrop-blur-sm transition-all focus:border-violet-400/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className={cn(
                  "rounded-2xl px-8 py-3.5 font-sans text-lg font-semibold text-white transition-all",
                  input.trim()
                    ? "bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] shadow-[0_0_20px_rgba(78,207,138,0.25)] hover:shadow-[0_0_28px_rgba(78,207,138,0.4)] hover:scale-[1.03] active:scale-[0.98]"
                    : "bg-white/[0.06] text-white/25 cursor-not-allowed"
                )}
              >
                Valider
              </button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto">
              <div className="rounded-3xl border border-white/25 bg-black/30 px-6 py-5 backdrop-blur-sm shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <p className="text-xl font-sans font-semibold text-white/90">
                  Reponse envoyee
                </p>
              </div>
              <p className="text-sm text-white/40 font-sans mt-4 animate-pulse">
                En attente des autres joueurs...
              </p>
            </div>
          )}
        </div>

        {/* Players */}
        <div className="flex flex-wrap justify-center gap-4 mt-auto">
          {state.players?.map((p: SpeedQuizPlayer) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-4 min-w-[100px] transition-all backdrop-blur-sm",
                p.hasAnswered
                  ? "border-violet-400/30 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                  : "border-white/[0.1] bg-black/30"
              )}
            >
              <span className="text-sm font-sans font-medium truncate max-w-[90px] text-white/90">
                {p.name}
                {p.id === playerId && (
                  <span className="text-white/40"> (toi)</span>
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-sans",
                  p.hasAnswered ? "text-violet-400" : "text-white/25"
                )}
              >
                {p.hasAnswered ? "Repondu" : "..."}
              </span>
              <span className="text-lg text-white/90 font-mono font-semibold">
                {p.score}
                <span className="text-xs text-white/40 ml-0.5">pts</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── VALIDATING PHASE ───────────────────────────────────
  if (state.status === "validating" && state.currentQuestion && state.answers) {
    const currentIdx = state.currentValidationIndex ?? 0;
    return (
      <div
        className="relative flex min-h-screen flex-1 flex-col items-center gap-8 overflow-hidden px-6 py-8"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(109,40,217,0.10), transparent 45%), #09090b",
        }}
      >
        {/* Header */}
        <div className="w-full max-w-2xl rounded-3xl border border-white/25 bg-black/30 px-6 py-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-sm text-white/40">
              Validation
              <span className="text-white/25">
                {" "}
                — {state.currentQuestion.index + 1} / {state.currentQuestion.total}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs px-3 py-1 rounded-full border font-sans font-medium",
                  diff.bg,
                  diff.border,
                  diff.text
                )}
              >
                {diff.label}
              </span>
              <span className="text-xs px-3 py-1 rounded-full border border-white/[0.12] bg-white/[0.04] text-white/40 font-sans">
                {state.currentQuestion.category}
              </span>
            </div>
          </div>
          <p
            className="text-xl font-serif font-semibold text-white/90 leading-relaxed"
            style={{ textShadow: "0 2px 20px rgba(139,92,246,0.12)" }}
          >
            {state.currentQuestion.text}
          </p>
        </div>

        {/* Reference answer hint for host */}
        {isHost && state.referenceAnswers && (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] px-5 py-3 backdrop-blur-sm shadow-[0_0_16px_rgba(34,211,238,0.1)]">
            <p className="text-sm text-cyan-400/80 font-sans">
              Indice : <span className="font-mono font-semibold text-cyan-300">{state.referenceAnswers.join(" / ")}</span>
            </p>
          </div>
        )}

        {/* Answers list */}
        <div className="w-full max-w-lg space-y-3">
          {state.answers.map((a: SpeedQuizAnswer, i: number) => {
            if (!a.validated && i !== currentIdx) return null;
            const isCurrent = i === currentIdx && !a.validated;

            return (
              <div
                key={a.playerId}
                className={cn(
                  "rounded-2xl border p-5 transition-all backdrop-blur-sm",
                  isCurrent &&
                    "border-violet-400/40 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]",
                  a.validated &&
                    a.correct === true &&
                    "border-emerald-400/30 bg-emerald-500/10",
                  a.validated &&
                    a.correct === false &&
                    "border-red-400/20 bg-red-400/[0.06]",
                  !isCurrent &&
                    !a.validated &&
                    "border-white/[0.08] bg-black/30 opacity-30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white/40 font-sans">
                      {a.playerName}
                      {a.playerId === playerId && (
                        <span className="text-white/25"> (toi)</span>
                      )}
                    </span>
                    {a.answer !== null ? (
                      <p
                        className={cn(
                          "text-2xl font-sans font-semibold mt-1",
                          isCurrent
                            ? "text-white/90"
                            : a.correct
                              ? "text-emerald-400"
                              : "text-red-400/60"
                        )}
                      >
                        {a.answer || "(pas de reponse)"}
                      </p>
                    ) : (
                      <p className="text-lg text-white/25 font-sans mt-1">???</p>
                    )}
                  </div>
                  <div>
                    {a.validated && a.correct === true && (
                      <span
                        className="text-4xl font-semibold text-emerald-400"
                        style={{
                          textShadow: "0 0 14px rgba(52,211,153,0.4)",
                        }}
                      >
                        +1
                      </span>
                    )}
                    {a.validated && a.correct === false && (
                      <span className="text-3xl font-semibold text-red-400/50">
                        0
                      </span>
                    )}
                  </div>
                </div>

                {/* Host validation buttons for current answer */}
                {isCurrent && isHost && (
                  <div className="flex gap-4 mt-4 pt-4 border-t border-white/[0.08]">
                    <button
                      onClick={() => handleValidate(true)}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] font-sans text-lg font-semibold text-white shadow-[0_0_20px_rgba(78,207,138,0.25)] hover:shadow-[0_0_28px_rgba(78,207,138,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Correct
                    </button>
                    <button
                      onClick={() => handleValidate(false)}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-400 font-sans text-lg font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_28px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Faux
                    </button>
                  </div>
                )}

                {/* Non-host sees "waiting for host" on current */}
                {isCurrent && !isHost && (
                  <p className="text-sm text-white/40 font-sans mt-4 pt-4 border-t border-white/[0.08] animate-pulse">
                    L&apos;hote valide...
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Scoreboard */}
        <div className="flex flex-wrap justify-center gap-6 mt-auto">
          {state.players
            ?.slice()
            .sort((a: SpeedQuizPlayer, b: SpeedQuizPlayer) => b.score - a.score)
            .map((p: SpeedQuizPlayer, i: number) => (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col items-center rounded-2xl border px-5 py-3 backdrop-blur-sm",
                  i === 0
                    ? "border-violet-400/30 bg-violet-500/10 shadow-[0_0_14px_rgba(139,92,246,0.2)]"
                    : "border-white/[0.1] bg-black/30"
                )}
              >
                <span className={cn("text-sm font-sans", i === 0 ? "text-violet-300" : "text-white/40")}>
                  {p.name}
                </span>
                <p className="text-2xl font-mono font-semibold text-white/90">{p.score}</p>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // ── SCORES PHASE ───────────────────────────────────────
  if (state.status === "scores" && state.currentQuestion) {
    const sorted = state.players
      ?.slice()
      .sort((a: SpeedQuizPlayer, b: SpeedQuizPlayer) => b.score - a.score);

    return (
      <div
        className="relative flex min-h-screen flex-1 flex-col items-center gap-8 overflow-hidden px-6 py-8"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(109,40,217,0.10), transparent 45%), #09090b",
        }}
      >
        {/* Round label */}
        <div className="rounded-3xl border border-white/25 bg-black/30 px-6 py-4 backdrop-blur-sm">
          <span className="font-mono text-sm text-white/40">
            Resultats
            <span className="text-white/25">
              {" "}
              — Question {state.currentQuestion.index + 1} / {state.currentQuestion.total}
            </span>
          </span>
        </div>

        {/* All answers summary */}
        <div className="w-full max-w-lg space-y-3">
          {state.answers?.map((a: SpeedQuizAnswer) => (
            <div
              key={a.playerId}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4 backdrop-blur-sm",
                a.correct
                  ? "border-emerald-400/25 bg-emerald-500/10"
                  : "border-red-400/15 bg-red-400/[0.04]"
              )}
            >
              <div>
                <span className="text-sm text-white/40 font-sans">
                  {a.playerName}
                  {a.playerId === playerId && (
                    <span className="text-white/25"> (toi)</span>
                  )}
                </span>
                <p
                  className={cn(
                    "text-lg font-sans font-semibold mt-0.5",
                    a.correct ? "text-emerald-400" : "text-red-400/50"
                  )}
                >
                  {a.answer || "(pas de reponse)"}
                </p>
              </div>
              <span
                className={cn(
                  "text-2xl font-mono font-semibold",
                  a.correct ? "text-emerald-400" : "text-white/20"
                )}
                style={
                  a.correct
                    ? { textShadow: "0 0 12px rgba(52,211,153,0.35)" }
                    : undefined
                }
              >
                {a.correct ? "+1" : "0"}
              </span>
            </div>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="w-full max-w-lg mt-4">
          <p
            className="text-lg font-serif font-semibold text-white/90 text-center mb-5"
            style={{ textShadow: "0 2px 16px rgba(139,92,246,0.15)" }}
          >
            Classement
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {sorted?.map((p: SpeedQuizPlayer, i: number) => (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col items-center rounded-2xl border px-6 py-4 backdrop-blur-sm transition-all",
                  i === 0
                    ? "border-violet-400/40 bg-violet-500/15 shadow-[0_0_24px_rgba(139,92,246,0.25)] scale-110"
                    : i === 1
                      ? "border-white/[0.15] bg-white/[0.06]"
                      : "border-white/[0.1] bg-black/30"
                )}
              >
                {i === 0 && (
                  <span
                    className="text-3xl mb-1"
                    style={{ textShadow: "0 0 10px rgba(250,204,21,0.4)" }}
                  >
                    1er
                  </span>
                )}
                <span
                  className={cn(
                    "text-sm font-sans font-medium",
                    i === 0 ? "text-violet-300" : "text-white/40"
                  )}
                >
                  {p.name}
                </span>
                <p
                  className={cn(
                    "font-mono font-semibold",
                    i === 0 ? "text-5xl text-white/90" : "text-3xl text-white/60"
                  )}
                  style={
                    i === 0
                      ? { textShadow: "0 0 20px rgba(139,92,246,0.35)" }
                      : undefined
                  }
                >
                  {p.score}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/40 font-sans animate-pulse mt-auto">
          Prochaine question...
        </p>
      </div>
    );
  }

  // ── FALLBACK ───────────────────────────────────────────
  return (
    <div
      className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 25%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(109,40,217,0.10), transparent 45%), #09090b",
      }}
    >
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2">
          <p className="text-sm text-red-400 font-sans">{error}</p>
        </div>
      )}
    </div>
  );
}
