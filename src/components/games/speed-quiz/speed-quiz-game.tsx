"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type {
  SpeedQuizState,
  SpeedQuizPlayer,
  SpeedQuizAnswer,
} from "@/lib/party/message-types";
import { cn } from "@/lib/utils";

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
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevRoundRef = useRef(0);

  const state = gameState as unknown as SpeedQuizState;

  // Reset input when a new question starts
  useEffect(() => {
    const round = state?.round ?? 0;
    if (state?.status === "question" && round !== prevRoundRef.current) {
      prevRoundRef.current = round;
      setInput("");
      setSubmitted(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state?.status, state?.round]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || submitted) return;
    setSubmitted(true);
    sendAction({ action: "answer", answer: trimmed });
  }, [input, submitted, sendAction]);

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
      <div className="flex flex-1 items-center justify-center">
        <p className="text-white/40 animate-pulse font-sans">
          En attente des joueurs...
        </p>
      </div>
    );
  }

  const isHost = playerId === state.hostId;
  const diff = state.currentQuestion?.difficulty
    ? DIFF_COLORS[state.currentQuestion.difficulty]
    : DIFF_COLORS.medium;

  // ── QUESTION PHASE ─────────────────────────────────────
  if (state.status === "question" && state.currentQuestion) {
    return (
      <div className="flex flex-1 flex-col items-center gap-6 p-6">
        {/* Timer + difficulty */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/20 font-sans">
                Question {state.currentQuestion.index + 1} / {state.currentQuestion.total}
              </span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-sans font-medium", diff.bg, diff.border, diff.text)}>
                {diff.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40 font-sans">
                {state.currentQuestion.category}
              </span>
            </div>
            <span className={cn("text-sm font-mono font-bold", (state.timeLeft ?? 0) <= 5 ? "text-red-400" : "text-ember")}>
              {state.timeLeft ?? 0}s
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-linear", (state.timeLeft ?? 0) <= 5 ? "bg-red-500" : "bg-ember")}
              style={{ width: `${((state.timeLeft ?? 0) / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="w-full max-w-2xl text-center mt-6">
          {state.currentQuestion.image && (
            <div className="mb-6 flex justify-center">
              <img src={state.currentQuestion.image} alt="" className="max-h-60 rounded-lg border border-white/[0.06] object-contain" />
            </div>
          )}
          <h2 className="text-2xl font-light font-serif text-white/90 mb-8 leading-relaxed">
            {state.currentQuestion.text}
          </h2>

          {!submitted ? (
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ta réponse..."
                autoFocus
                autoComplete="off"
                className="flex-1 px-4 py-3 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-ember/50 focus:bg-white/[0.06] transition-all"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="px-6 py-3 rounded-lg bg-ember hover:bg-ember-glow disabled:bg-white/[0.06] disabled:text-white/20 text-white font-sans text-sm font-medium transition-all"
              >
                Valider
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="px-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                <p className="text-sm text-white/50 font-sans">Réponse envoyée</p>
              </div>
              <p className="text-xs text-white/20 font-sans mt-3 animate-pulse">
                En attente des autres joueurs...
              </p>
            </div>
          )}
        </div>

        {/* Players */}
        <div className="flex flex-wrap justify-center gap-3 mt-auto">
          {state.players?.map((p: SpeedQuizPlayer) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-3 min-w-[90px] transition-all",
                p.hasAnswered ? "border-white/[0.12] bg-white/[0.05]" : "border-white/[0.06] bg-white/[0.02]"
              )}
            >
              <span className="text-xs font-medium truncate max-w-[80px] text-white/60 font-sans">
                {p.name}{p.id === playerId && " (toi)"}
              </span>
              <span className="text-[10px] text-white/30 font-sans">{p.hasAnswered ? "Répondu" : "..."}</span>
              <span className="text-xs text-ember font-mono">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── VALIDATING PHASE ───────────────────────────────────
  if (state.status === "validating" && state.currentQuestion && state.answers) {
    const currentIdx = state.currentValidationIndex ?? 0;
    const currentAnswer = state.answers[currentIdx];

    return (
      <div className="flex flex-1 flex-col items-center gap-6 p-6">
        {/* Header */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/20 font-sans">
              Validation — Question {state.currentQuestion.index + 1} / {state.currentQuestion.total}
            </span>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-sans font-medium", diff.bg, diff.border, diff.text)}>
                {diff.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40 font-sans">
                {state.currentQuestion.category}
              </span>
            </div>
          </div>
          <p className="text-sm text-white/50 font-sans">{state.currentQuestion.text}</p>
        </div>

        {/* Reference answer hint for host */}
        {isHost && state.referenceAnswers && (
          <div className="px-3 py-1.5 rounded border border-cyan-500/20 bg-cyan-500/5">
            <p className="text-[10px] text-cyan-400/60 font-sans">
              Indice : {state.referenceAnswers.join(" / ")}
            </p>
          </div>
        )}

        {/* Already validated answers */}
        <div className="w-full max-w-md space-y-2">
          {state.answers.map((a: SpeedQuizAnswer, i: number) => {
            if (!a.validated && i !== currentIdx) return null;
            const isCurrent = i === currentIdx && !a.validated;

            return (
              <div
                key={a.playerId}
                className={cn(
                  "rounded-lg border p-4 transition-all",
                  isCurrent && "border-ember/40 bg-ember/5 ring-1 ring-ember/20",
                  a.validated && a.correct === true && "border-emerald-500/30 bg-emerald-500/5",
                  a.validated && a.correct === false && "border-red-500/20 bg-red-500/5",
                  !isCurrent && !a.validated && "border-white/[0.06] bg-white/[0.02] opacity-30",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/40 font-sans">
                      {a.playerName}{a.playerId === playerId && " (toi)"}
                    </span>
                    {a.answer !== null ? (
                      <p className={cn(
                        "text-lg font-sans mt-1",
                        isCurrent ? "text-white" : a.correct ? "text-emerald-400" : "text-red-400/60"
                      )}>
                        {a.answer || "(pas de réponse)"}
                      </p>
                    ) : (
                      <p className="text-sm text-white/20 font-sans mt-1">???</p>
                    )}
                  </div>
                  <div>
                    {a.validated && a.correct === true && (
                      <span className="text-emerald-400 text-xl">✓</span>
                    )}
                    {a.validated && a.correct === false && (
                      <span className="text-red-400/60 text-xl">✗</span>
                    )}
                  </div>
                </div>

                {/* Host validation buttons for current answer */}
                {isCurrent && isHost && (
                  <div className="flex gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleValidate(true)}
                      className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-sm font-medium transition-all"
                    >
                      Correct ✓
                    </button>
                    <button
                      onClick={() => handleValidate(false)}
                      className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-sans text-sm font-medium transition-all"
                    >
                      Faux ✗
                    </button>
                  </div>
                )}

                {/* Non-host sees "waiting for host" on current */}
                {isCurrent && !isHost && (
                  <p className="text-xs text-white/20 font-sans mt-3 pt-3 border-t border-white/[0.06] animate-pulse">
                    L&apos;hôte valide...
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Scoreboard */}
        <div className="flex flex-wrap justify-center gap-4 mt-auto">
          {state.players
            ?.slice()
            .sort((a: SpeedQuizPlayer, b: SpeedQuizPlayer) => b.score - a.score)
            .map((p: SpeedQuizPlayer) => (
              <div key={p.id} className="text-center">
                <span className="text-xs text-white/30 font-sans">{p.name}</span>
                <p className="text-lg text-ember font-mono font-bold">{p.score}</p>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // ── SCORES PHASE ───────────────────────────────────────
  if (state.status === "scores" && state.currentQuestion) {
    return (
      <div className="flex flex-1 flex-col items-center gap-6 p-6">
        <div className="w-full max-w-2xl text-center">
          <span className="text-xs text-white/20 font-sans">
            Résultats — Question {state.currentQuestion.index + 1} / {state.currentQuestion.total}
          </span>
        </div>

        {/* All answers summary */}
        <div className="w-full max-w-md space-y-2">
          {state.answers?.map((a: SpeedQuizAnswer) => (
            <div
              key={a.playerId}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                a.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/10 bg-red-500/[0.02]"
              )}
            >
              <div>
                <span className="text-xs text-white/50 font-sans">
                  {a.playerName}{a.playerId === playerId && " (toi)"}
                </span>
                <p className={cn("text-sm font-sans", a.correct ? "text-emerald-400" : "text-red-400/50")}>
                  {a.answer || "(pas de réponse)"}
                </p>
              </div>
              <span className={cn("text-sm font-mono", a.correct ? "text-emerald-400" : "text-white/20")}>
                {a.correct ? "+1" : "0"}
              </span>
            </div>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="w-full max-w-md mt-4">
          <p className="text-xs text-white/20 font-sans text-center mb-3">Classement</p>
          <div className="flex flex-wrap justify-center gap-6">
            {state.players
              ?.slice()
              .sort((a: SpeedQuizPlayer, b: SpeedQuizPlayer) => b.score - a.score)
              .map((p: SpeedQuizPlayer, i: number) => (
                <div key={p.id} className="text-center">
                  <span className={cn("text-xs font-sans", i === 0 ? "text-cyan-400" : "text-white/40")}>
                    {p.name}
                  </span>
                  <p className={cn("text-2xl font-mono font-bold", i === 0 ? "text-ember" : "text-white/60")}>
                    {p.score}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <p className="text-xs text-white/20 font-sans animate-pulse mt-auto">
          Prochaine question...
        </p>
      </div>
    );
  }

  // ── FALLBACK ───────────────────────────────────────────
  return (
    <div className="flex flex-1 items-center justify-center">
      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
    </div>
  );
}
