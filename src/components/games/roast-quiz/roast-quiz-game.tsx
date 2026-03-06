"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

interface RoastQuizState {
  status: "waiting" | "question" | "malus-choice" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  question: { text: string; choices: string[]; category: string } | null;
  correctAnswer?: number;
  timeLeft: number;
  players: { id: string; name: string; score: number; hasAnswered: boolean; activeMalus: string | null }[];
  malusChooser?: string;
  lastCorrectPlayer?: string;
}

const MALUS_TYPES = [
  { id: "shake", label: "Tremblement", emoji: "\u{1F4F3}", desc: "L'\u00E9cran tremble" },
  { id: "blur", label: "Flou", emoji: "\u{1F32B}\uFE0F", desc: "Vision floue" },
  { id: "invert", label: "Inversion", emoji: "\u{1F500}", desc: "R\u00E9ponses m\u00E9lang\u00E9es" },
  { id: "speed", label: "Turbo", emoji: "\u23E9", desc: "Timer r\u00E9duit" },
];

export default function RoastQuizGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "roast-quiz", playerId, playerName);
  const { gameState } = useGameStore();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [malusSent, setMalusSent] = useState(false);
  const prevRoundRef = useRef(0);

  const state = gameState as unknown as RoastQuizState;

  useEffect(() => {
    if (state?.round !== prevRoundRef.current) {
      prevRoundRef.current = state?.round ?? 0;
      setSelectedAnswer(null);
      setMalusSent(false);
    }
  }, [state?.round]);

  const handleAnswer = useCallback((idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    sendAction({ action: "answer", choiceIndex: idx });
  }, [selectedAnswer, sendAction]);

  const handleMalus = useCallback((targetId: string, malusType: string) => {
    if (malusSent) return;
    setMalusSent(true);
    sendAction({ action: "send-malus", targetId, malusType });
  }, [malusSent, sendAction]);

  if (!state || state.status === "waiting") {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.08), transparent 40%), #060606",
        }}
      >
        <p className="text-3xl text-white/40 animate-pulse font-serif">En attente des joueurs...</p>
      </div>
    );
  }

  const me = state.players?.find(p => p.id === playerId);
  const myMalus = me?.activeMalus;
  const isShaking = myMalus === "shake";
  const isBlurred = myMalus === "blur";

  // Question phase
  if (state.status === "question" && state.question) {
    return (
      <div
        className={cn("flex flex-1 flex-col items-center justify-center p-6 relative", isShaking && "animate-shake")}
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.1), transparent 40%), #060606",
          filter: isBlurred ? "blur(4px)" : undefined,
        }}
      >
        {isShaking && (
          <style>{`@keyframes shake { 0%,100% { transform: translateX(0); } 10%,30%,50%,70%,90% { transform: translateX(-4px); } 20%,40%,60%,80% { transform: translateX(4px); } } .animate-shake { animation: shake 0.5s infinite; }`}</style>
        )}
        <div className="w-full max-w-lg space-y-6">
          {/* Timer + round */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/25 font-sans uppercase tracking-widest">
              Question {state.round}/{state.totalRounds}
            </span>
            <div className="flex items-center gap-3">
              {myMalus === "speed" && (
                <span className="text-xs text-red-400 font-sans font-bold animate-pulse drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]">
                  TURBO !
                </span>
              )}
              <span
                className={cn(
                  "text-xl font-mono font-semibold",
                  state.timeLeft <= 3 ? "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" : "text-ember drop-shadow-[0_0_8px_rgba(80,216,255,0.3)]"
                )}
              >
                {state.timeLeft}s
              </span>
            </div>
          </div>

          {/* Timer bar */}
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(state.timeLeft / 12) * 100}%`,
                background: state.timeLeft <= 3
                  ? "linear-gradient(to right, #f87171, #ef4444)"
                  : "linear-gradient(to right, #65dfb2, #50d8ff)",
                boxShadow: state.timeLeft <= 3
                  ? "0 0 12px rgba(248,113,113,0.4)"
                  : "0 0 12px rgba(80,216,255,0.3)",
              }}
            />
          </div>

          {/* Category */}
          <div className="flex justify-center">
            <span
              className="inline-block text-[10px] text-ember/80 font-sans uppercase tracking-[0.2em] rounded-full px-3 py-1"
              style={{
                border: "1px solid rgba(80,216,255,0.2)",
                background: "rgba(80,216,255,0.05)",
              }}
            >
              {state.question.category}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-3xl font-serif font-semibold text-white/90 text-center leading-relaxed drop-shadow-[0_0_20px_rgba(80,216,255,0.08)]">
            {state.question.text}
          </h2>

          {/* Choices */}
          <div className="grid grid-cols-2 gap-3">
            {state.question.choices.map((choice, i) => {
              const answered = selectedAnswer !== null;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  className={cn(
                    "rounded-2xl border p-5 text-sm font-sans text-left transition-all duration-200",
                    answered && selectedAnswer === i
                      ? "border-ember/50 bg-ember/10 text-white shadow-[0_0_20px_rgba(80,216,255,0.15)]"
                      : answered
                        ? "border-white/[0.04] bg-white/[0.02] text-white/25"
                        : "border-white/[0.12] bg-black/30 backdrop-blur-sm text-white/70 hover:border-ember/40 hover:bg-ember/5 hover:shadow-[0_0_20px_rgba(80,216,255,0.1)] cursor-pointer active:scale-[0.98]"
                  )}
                >
                  <span className="text-white/25 font-mono text-xs mr-2">{String.fromCharCode(65 + i)}.</span>
                  {choice}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <p className="text-xs text-white/25 text-center font-sans animate-pulse">En attente des autres...</p>
          )}

          {/* Malus warning */}
          {myMalus && (
            <div className="flex justify-center">
              <p
                className="text-xs text-red-400/80 text-center font-sans px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.15)",
                }}
              >
                Malus actif : {MALUS_TYPES.find(m => m.id === myMalus)?.label}
              </p>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-5">
          {state.players?.map(p => (
            <div
              key={p.id}
              className={cn(
                "text-center px-3 py-1.5 rounded-xl transition-all",
                p.hasAnswered ? "bg-ember/5 border border-ember/15" : "bg-white/[0.02] border border-white/[0.06]"
              )}
            >
              <span className={cn("text-xs font-sans", p.hasAnswered ? "text-ember/70" : "text-white/25")}>{p.name}</span>
              <p className="text-lg text-ember font-mono font-semibold drop-shadow-[0_0_8px_rgba(80,216,255,0.25)]">{p.score}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Reveal phase
  if (state.status === "reveal" && state.question) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 relative"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(101,223,178,0.1), transparent 40%), #060606",
        }}
      >
        <div className="w-full max-w-lg space-y-6">
          <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em]">
            R\u00E9ponse — Question {state.round}/{state.totalRounds}
          </span>

          <h2 className="text-3xl font-serif font-semibold text-white/90 text-center leading-relaxed">
            {state.question.text}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {state.question.choices.map((choice, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border p-5 text-sm font-sans transition-all",
                  i === state.correctAnswer
                    ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(101,223,178,0.2)]"
                    : selectedAnswer === i
                      ? "border-red-500/30 bg-red-500/5 text-red-300/60"
                      : "border-white/[0.04] bg-white/[0.02] text-white/25"
                )}
              >
                <span className="text-white/25 font-mono text-xs mr-2">{String.fromCharCode(65 + i)}.</span>
                {choice}
                {i === state.correctAnswer && (
                  <span className="ml-2 text-emerald-400 drop-shadow-[0_0_6px_rgba(101,223,178,0.4)]">{"\u2713"}</span>
                )}
              </div>
            ))}
          </div>

          {state.lastCorrectPlayer && (
            <div
              className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-5 text-center"
              style={{ boxShadow: "0 0 20px rgba(80,216,255,0.08)" }}
            >
              <p className="text-lg text-ember font-sans font-semibold drop-shadow-[0_0_8px_rgba(80,216,255,0.25)]">
                {state.players.find(p => p.id === state.lastCorrectPlayer)?.name}
              </p>
              <p className="text-sm text-white/40 font-sans mt-1">choisit un malus...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Malus choice phase
  if (state.status === "malus-choice") {
    const isChooser = state.malusChooser === playerId;
    const otherPlayers = state.players?.filter(p => p.id !== playerId) ?? [];
    const [selectedTarget, setTarget] = useState<string | null>(null);

    if (!isChooser) {
      return (
        <div
          className="flex flex-1 flex-col items-center justify-center p-6 gap-4"
          style={{
            background: "radial-gradient(circle at 50% 25%, rgba(248,113,113,0.08), transparent 40%), #060606",
          }}
        >
          <p className="text-xl text-white/40 font-serif animate-pulse">
            {state.players.find(p => p.id === state.malusChooser)?.name} choisit un malus...
          </p>
          <span className="text-2xl text-white/25 font-mono font-semibold">{state.timeLeft}s</span>
        </div>
      );
    }

    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(248,113,113,0.1), transparent 40%), #060606",
        }}
      >
        <div className="w-full max-w-lg space-y-6">
          <h2 className="text-4xl font-serif font-semibold text-white/90 text-center drop-shadow-[0_0_20px_rgba(248,113,113,0.15)]">
            Choisis un malus !
          </h2>
          <span className="block text-2xl text-white/25 font-mono font-semibold text-center">{state.timeLeft}s</span>

          {/* Target selection */}
          <div
            className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-5 space-y-3"
            style={{ boxShadow: "0 0 20px rgba(248,113,113,0.08)" }}
          >
            <p className="text-xs text-white/40 font-sans uppercase tracking-[0.2em]">Cible</p>
            <div className="flex gap-3 flex-wrap">
              {otherPlayers.map(p => (
                <button
                  key={p.id}
                  onClick={() => setTarget(p.id)}
                  className={cn(
                    "rounded-2xl border px-5 py-3 text-sm font-sans font-semibold transition-all duration-200",
                    selectedTarget === p.id
                      ? "border-red-400/50 bg-red-500/10 text-white shadow-[0_0_20px_rgba(248,113,113,0.2)]"
                      : "border-white/[0.12] bg-black/30 backdrop-blur-sm text-white/60 hover:border-red-400/30 hover:bg-red-500/5 cursor-pointer"
                  )}
                >
                  {p.name}
                  <span className="ml-2 text-white/25 font-mono text-xs">{p.score}pts</span>
                </button>
              ))}
            </div>
          </div>

          {/* Malus type */}
          {selectedTarget && (
            <div className="space-y-3">
              <p className="text-xs text-white/40 font-sans uppercase tracking-[0.2em]">Malus</p>
              <div className="grid grid-cols-2 gap-3">
                {MALUS_TYPES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleMalus(selectedTarget, m.id)}
                    disabled={malusSent}
                    className="rounded-2xl border border-white/[0.12] bg-black/30 backdrop-blur-sm p-4 text-left hover:border-red-400/30 hover:bg-red-500/5 hover:shadow-[0_0_20px_rgba(248,113,113,0.1)] transition-all duration-200 active:scale-[0.97] cursor-pointer group"
                  >
                    <span className="text-2xl group-hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.4)] transition-all">{m.emoji}</span>
                    <p className="text-sm text-white/90 font-sans font-semibold mt-2">{m.label}</p>
                    <p className="text-[10px] text-white/25 font-sans">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 items-center justify-center"
      style={{
        background: "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.08), transparent 40%), #060606",
      }}
    >
      <p className="text-xl text-white/40 animate-pulse font-serif">Chargement...</p>
    </div>
  );
}
