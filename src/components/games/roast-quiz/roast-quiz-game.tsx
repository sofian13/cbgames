"use client";

import { useCallback } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

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
  { id: "shake",  label: "Tremble", icon: "📳",  desc: "écran qui tremble",  color: "var(--cb-party)"   },
  { id: "blur",   label: "Flou",    icon: "🌫️",  desc: "vision floue",       color: "var(--cb-cards)"   },
  { id: "invert", label: "Inverse", icon: "🔄",  desc: "réponses mélangées", color: "var(--cb-brand)"   },
  { id: "speed",  label: "Turbo",   icon: "⚡",  desc: "timer × 2",          color: "var(--cb-social)"  },
];

const palette = ["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8","#E89A2B","#00B3A6","#E23434"];
function initialsOf(n: string) { return (n||"?").split(/\s+/).map(s=>s[0]).slice(0,2).join("").toUpperCase(); }
function colorFor(n: string)   { const h=[...(n||"?")].reduce((a,c)=>a+c.charCodeAt(0),0); return palette[h%palette.length]; }

export default function RoastQuizGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "roast-quiz", playerId, playerName);
  const { gameState } = useGameStore();
  const state = gameState as unknown as RoastQuizState;
  const roundKey = state?.round ?? 0;
  const malusKey = `${state?.round ?? 0}-${state?.status ?? "waiting"}`;
  const [selectedAnswer, setSelectedAnswer] = useKeyedState<number | null>(roundKey, null);
  const [malusSent, setMalusSent] = useKeyedState<boolean>(malusKey, false);
  const [selectedTarget, setTarget] = useKeyedState<string | null>(malusKey, null);

  const handleAnswer = useCallback((idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    sendAction({ action: "answer", choiceIndex: idx });
  }, [selectedAnswer, sendAction, setSelectedAnswer]);

  const handleMalus = useCallback((targetId: string, malusType: string) => {
    if (malusSent) return;
    setMalusSent(true);
    sendAction({ action: "send-malus", targetId, malusType });
  }, [malusSent, sendAction, setMalusSent]);

  if (!state || state.status === "waiting") {
    return (
      <div className="flex h-full items-center justify-center text-white">
        <div className="text-center">
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>en attente</span>
          <h2 className="cb-display-lg mt-2">Préparation…</h2>
        </div>
      </div>
    );
  }

  const me = state.players?.find(p => p.id === playerId);
  const myMalus = me?.activeMalus;
  const isShaking = myMalus === "shake";
  const isBlurred = myMalus === "blur";

  // Question phase
  if (state.status === "question" && state.question) {
    const urgent = state.timeLeft <= 3;
    const reverse = myMalus === "invert";
    const choices = reverse ? [...state.question.choices].reverse() : state.question.choices;

    return (
      <div
        className={cn("relative flex h-full flex-col", isShaking && "cb-shake")}
        style={{ filter: isBlurred ? "blur(4px)" : undefined }}
      >
        {isShaking && (
          <style>{`@keyframes cb-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } } .cb-shake { animation: cb-shake 0.2s infinite; }`}</style>
        )}

        {/* Top row */}
        <div className="flex items-center justify-between px-4 pt-2">
          <span className="cb-mono text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Q {state.round}/{state.totalRounds}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: urgent ? "var(--cb-social)" : "var(--cb-trivia)",
              color: "#fff",
            }}
          >
            {state.timeLeft}s
          </span>
          <span className="cb-mono text-[10px] font-bold" style={{ color: "var(--cb-brand)" }}>
            {me?.score ?? 0} pts
          </span>
        </div>

        {myMalus && (
          <div className="px-4 pt-2">
            <div
              className="rounded-full border px-3 py-1 text-center text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: "rgba(226,52,52,0.10)",
                borderColor: "rgba(226,52,52,0.35)",
                color: "#FF8888",
              }}
            >
              🔥 malus actif : {MALUS_TYPES.find(m => m.id === myMalus)?.label}
            </div>
          </div>
        )}

        <div className="px-4 pt-3">
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
            {state.question.category}
          </span>
          <h2 className="cb-display-md mt-1 text-white text-balance">
            {state.question.text}
          </h2>
        </div>

        {/* Choices */}
        <div className="grid flex-1 grid-cols-2 gap-2.5 p-4">
          {choices.map((choice, i) => {
            const realIdx = reverse ? choices.length - 1 - i : i;
            const isSelected = selectedAnswer === realIdx;
            const answered = selectedAnswer !== null;
            return (
              <button
                key={i}
                onClick={() => handleAnswer(realIdx)}
                disabled={answered}
                className="rounded-2xl border p-3 text-left transition"
                style={{
                  background: isSelected ? "var(--cb-brand)" : "rgba(255,255,255,0.04)",
                  color: isSelected ? "var(--cb-brand-ink)" : "#fff",
                  borderColor: isSelected ? "transparent" :
                               answered ? "rgba(255,255,255,0.06)" :
                               "rgba(255,255,255,0.12)",
                  opacity: answered && !isSelected ? 0.45 : 1,
                  cursor: answered ? "default" : "pointer",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black"
                    style={{
                      background: isSelected ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
                <span className="mt-2 block cb-display-sm" style={{ fontSize: 14 }}>
                  {choice}
                </span>
              </button>
            );
          })}
        </div>

        {/* Players strip */}
        <div className="flex justify-center gap-1 px-4 pb-2">
          {state.players?.map(p => (
            <div
              key={p.id}
              className="relative h-7 w-7 rounded-full"
              style={{
                background: colorFor(p.name),
                opacity: p.hasAnswered ? 1 : 0.45,
                boxShadow: p.hasAnswered ? "0 0 0 2px var(--cb-strategy)" : "none",
              }}
            >
              <span
                className="flex h-full w-full items-center justify-center text-[9px] font-black"
                style={{ color: "#fff", fontFamily: "var(--font-display)" }}
              >
                {initialsOf(p.name)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Reveal phase
  if (state.status === "reveal" && state.question) {
    const lastCorrect = state.players.find(p => p.id === state.lastCorrectPlayer);
    return (
      <div className="flex h-full flex-col px-4 py-3 text-white">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          réponse — Q {state.round}/{state.totalRounds}
        </span>
        <h2 className="cb-display-md mt-1 text-balance">
          {state.question.text}
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {state.question.choices.map((choice, i) => {
            const correct = i === state.correctAnswer;
            const wrongPick = selectedAnswer === i && !correct;
            return (
              <div
                key={i}
                className="rounded-2xl border p-3"
                style={{
                  background: correct ? "var(--cb-strategy)" :
                               wrongPick ? "rgba(226,52,52,0.12)" :
                               "rgba(255,255,255,0.03)",
                  color: correct ? "#fff" :
                         wrongPick ? "rgba(255,200,200,0.7)" :
                         "rgba(255,255,255,0.4)",
                  borderColor: correct ? "transparent" :
                               wrongPick ? "rgba(226,52,52,0.3)" :
                               "rgba(255,255,255,0.06)",
                }}
              >
                <span className="cb-display-sm" style={{ fontSize: 14 }}>
                  {String.fromCharCode(65 + i)}. {choice}
                </span>
                {correct && (
                  <span className="ml-2" style={{ color: "#fff", fontWeight: 900 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>

        {lastCorrect && (
          <div
            className="mt-4 rounded-2xl border px-4 py-3 text-center"
            style={{
              background: "var(--cb-brand-tint)",
              borderColor: "var(--line-brand)",
            }}
          >
            <span className="cb-eyebrow" style={{ color: "var(--cb-brand)" }}>
              🔥 {lastCorrect.name} a eu juste
            </span>
            <p className="cb-display-sm mt-1" style={{ color: "var(--cb-brand)" }}>
              choisit un malus...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Malus choice phase
  if (state.status === "malus-choice") {
    const isChooser = state.malusChooser === playerId;
    const otherPlayers = state.players?.filter(p => p.id !== playerId) ?? [];

    if (!isChooser) {
      const chooser = state.players.find(p => p.id === state.malusChooser);
      return (
        <div className="flex h-full flex-col items-center justify-center text-white">
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>en attente</span>
          <h2 className="cb-display-lg mt-2 text-center">
            {chooser?.name} choisit un malus...
          </h2>
          <span className="cb-mono mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            {state.timeLeft}s
          </span>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col px-4 py-3 text-white">
        <div className="text-center">
          <span className="cb-eyebrow" style={{ color: "var(--cb-social)" }}>🔥 inflige un malus</span>
          <h2 className="cb-display-lg mt-1">Qui et quel malus ?</h2>
          <span className="cb-mono mt-2 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            {state.timeLeft}s
          </span>
        </div>

        <div className="mt-4">
          <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>1. cible</span>
          <div className="mt-2 flex gap-2 flex-wrap">
            {otherPlayers.map(p => {
              const sel = selectedTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setTarget(p.id)}
                  className="flex items-center gap-2 rounded-full border px-3 py-2 transition"
                  style={{
                    background: sel ? "var(--cb-brand)" : "rgba(255,255,255,0.04)",
                    color: sel ? "var(--cb-brand-ink)" : "#fff",
                    borderColor: sel ? "transparent" : "rgba(255,255,255,0.1)",
                  }}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
                    style={{
                      background: colorFor(p.name),
                      color: "#fff",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {initialsOf(p.name)}
                  </span>
                  <span className="text-xs font-bold">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedTarget && (
          <div className="mt-5">
            <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>2. malus</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MALUS_TYPES.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMalus(selectedTarget, m.id)}
                  disabled={malusSent}
                  className="rounded-2xl border p-3 text-left transition"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.1)",
                    cursor: malusSent ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <p className="mt-1 cb-display-sm" style={{ fontSize: 14, color: m.color }}>
                    {m.label}
                  </p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {m.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center text-white">
      <span className="cb-eyebrow animate-pulse" style={{ color: "rgba(255,255,255,0.5)" }}>
        chargement…
      </span>
    </div>
  );
}
