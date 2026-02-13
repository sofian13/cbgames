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
  { id: "shake", label: "Tremblement", emoji: "📳", desc: "L'écran tremble" },
  { id: "blur", label: "Flou", emoji: "🌫️", desc: "Vision floue" },
  { id: "invert", label: "Inversion", emoji: "🔀", desc: "Réponses mélangées" },
  { id: "speed", label: "Turbo", emoji: "⏩", desc: "Timer réduit" },
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
      <div className="flex flex-1 items-center justify-center">
        <p className="text-white/40 animate-pulse font-sans">En attente des joueurs...</p>
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
        className={cn("flex flex-1 flex-col items-center justify-center p-6", isShaking && "animate-shake")}
        style={{
          background: "#060606",
          filter: isBlurred ? "blur(4px)" : undefined,
        }}
      >
        {isShaking && (
          <style>{`@keyframes shake { 0%,100% { transform: translateX(0); } 10%,30%,50%,70%,90% { transform: translateX(-4px); } 20%,40%,60%,80% { transform: translateX(4px); } } .animate-shake { animation: shake 0.5s infinite; }`}</style>
        )}
        <div className="w-full max-w-lg space-y-6">
          {/* Timer + round */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/20 font-sans uppercase tracking-wider">
              Question {state.round}/{state.totalRounds}
            </span>
            <div className="flex items-center gap-2">
              {myMalus === "speed" && <span className="text-xs text-red-400 font-sans font-bold animate-pulse">TURBO !</span>}
              <span className={cn("text-sm font-mono", state.timeLeft <= 3 ? "text-red-400" : "text-ember")}>
                {state.timeLeft}s
              </span>
            </div>
          </div>
          {/* Timer bar */}
          <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-ember/60 transition-all duration-1000" style={{ width: `${(state.timeLeft / 12) * 100}%` }} />
          </div>
          {/* Category */}
          <span className="inline-block text-[10px] text-ember/60 font-sans uppercase tracking-widest border border-ember/20 rounded-full px-2 py-0.5">
            {state.question.category}
          </span>
          {/* Question */}
          <h2 className="text-xl font-serif font-light text-white/90 text-center leading-relaxed">
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
                    "rounded-lg border p-4 text-sm font-sans text-left transition-all",
                    answered && selectedAnswer === i
                      ? "border-ember/50 bg-ember/10 text-white"
                      : answered
                        ? "border-white/[0.04] bg-white/[0.02] text-white/30"
                        : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-ember/30 hover:bg-ember/5 cursor-pointer"
                  )}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {selectedAnswer !== null && (
            <p className="text-xs text-white/20 text-center font-sans">En attente des autres...</p>
          )}
          {/* Malus warning */}
          {myMalus && (
            <p className="text-xs text-red-400/60 text-center font-sans">
              Malus actif : {MALUS_TYPES.find(m => m.id === myMalus)?.label}
            </p>
          )}
        </div>
        {/* Scores */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
          {state.players?.map(p => (
            <div key={p.id} className="text-center">
              <span className={cn("text-xs font-sans", p.hasAnswered ? "text-ember/60" : "text-white/20")}>{p.name}</span>
              <p className="text-sm text-ember font-mono">{p.score}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Reveal phase
  if (state.status === "reveal" && state.question) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-lg space-y-6">
          <span className="text-xs text-white/20 font-sans uppercase tracking-wider">
            Réponse — Question {state.round}/{state.totalRounds}
          </span>
          <h2 className="text-xl font-serif font-light text-white/90 text-center">{state.question.text}</h2>
          <div className="grid grid-cols-2 gap-3">
            {state.question.choices.map((choice, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg border p-4 text-sm font-sans",
                  i === state.correctAnswer
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                    : selectedAnswer === i
                      ? "border-red-500/30 bg-red-500/5 text-red-300/60"
                      : "border-white/[0.04] bg-white/[0.02] text-white/30"
                )}
              >
                {choice}
                {i === state.correctAnswer && " ✓"}
              </div>
            ))}
          </div>
          {state.lastCorrectPlayer && (
            <p className="text-sm text-ember text-center font-sans">
              {state.players.find(p => p.id === state.lastCorrectPlayer)?.name} choisit un malus...
            </p>
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
        <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
          <p className="text-sm text-white/40 font-sans animate-pulse">
            {state.players.find(p => p.id === state.malusChooser)?.name} choisit un malus...
          </p>
          <span className="text-xs text-white/20 font-mono mt-2">{state.timeLeft}s</span>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-lg space-y-6">
          <h2 className="text-xl font-serif font-light text-white/90 text-center">Choisis un malus !</h2>
          <span className="block text-xs text-white/20 font-mono text-center">{state.timeLeft}s</span>
          {/* Target selection */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 font-sans uppercase tracking-wider">Cible</p>
            <div className="flex gap-2 flex-wrap">
              {otherPlayers.map(p => (
                <button
                  key={p.id}
                  onClick={() => setTarget(p.id)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-sans transition-all",
                    selectedTarget === p.id
                      ? "border-ember/50 bg-ember/10 text-white"
                      : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-ember/30"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          {/* Malus type */}
          {selectedTarget && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 font-sans uppercase tracking-wider">Malus</p>
              <div className="grid grid-cols-2 gap-2">
                {MALUS_TYPES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleMalus(selectedTarget, m.id)}
                    disabled={malusSent}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-left hover:border-ember/30 hover:bg-ember/5 transition-all"
                  >
                    <span className="text-lg">{m.emoji}</span>
                    <p className="text-sm text-white/80 font-sans mt-1">{m.label}</p>
                    <p className="text-[10px] text-white/30 font-sans">{m.desc}</p>
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
    <div className="flex flex-1 items-center justify-center">
      <p className="text-white/40 animate-pulse font-sans">Chargement...</p>
    </div>
  );
}
