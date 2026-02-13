"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

interface SSPlayer { id: string; name: string; lives: number; score: number; isAlive: boolean; lastResult: "success" | "fail" | null; }
interface SSChallenge { type: string; instruction: string; data: Record<string, unknown>; }
interface SSState {
  status: "waiting" | "challenge" | "result" | "game-over";
  round: number; challenge: SSChallenge | null; timeLimit: number; timeLeft: number;
  players: SSPlayer[]; roundResults?: { playerId: string; success: boolean }[];
}

export default function SplitSecondGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "split-second", playerId, playerName);
  const { gameState } = useGameStore();
  const [answered, setAnswered] = useState(false);
  const [typedWord, setTypedWord] = useState("");
  const [mathAnswer, setMathAnswer] = useState("");
  const [clickCount, setClickCount] = useState(0);
  const prevRoundRef = useRef(0);
  const state = gameState as unknown as SSState;

  useEffect(() => {
    if (state?.round !== prevRoundRef.current) {
      prevRoundRef.current = state?.round ?? 0;
      setAnswered(false); setTypedWord(""); setMathAnswer(""); setClickCount(0);
    }
  }, [state?.round]);

  const answer = useCallback((value: unknown) => {
    if (answered) return;
    setAnswered(true);
    sendAction({ action: "answer", value: String(value) });
  }, [answered, sendAction]);

  const handleClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    sendAction({ action: "click" });
  }, [clickCount, sendAction]);

  const handleDontClick = useCallback(() => {
    sendAction({ action: "clicked" });
    setAnswered(true);
  }, [sendAction]);

  if (!state || state.status === "waiting") return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">En attente...</p></div>;

  const me = state.players?.find(p => p.id === playerId);

  if (state.status === "challenge" && state.challenge) {
    const ch = state.challenge;
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/20 font-sans uppercase tracking-wider">Round {state.round}</span>
            <span className={cn("text-lg font-mono font-bold", state.timeLeft <= 1 ? "text-red-400" : "text-ember")}>{state.timeLeft}s</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-ember/60 transition-all duration-1000" style={{ width: `${(state.timeLeft / Math.ceil(state.timeLimit / 1000)) * 100}%` }} />
          </div>
          <h2 className="text-xl font-serif font-light text-white/90 text-center">{ch.instruction}</h2>

          {ch.type === "click-color" && (
            <div className="grid grid-cols-2 gap-3">
              {(ch.data.buttons as string[]).map((color: string) => (
                <button key={color} onClick={() => answer(color)} disabled={answered}
                  className={cn("rounded-xl border p-4 text-center font-sans text-lg transition-all",
                    answered ? "border-white/[0.04] text-white/30" : "border-white/[0.08] bg-white/[0.03] text-white/80 hover:border-ember/40 hover:bg-ember/5 active:scale-95")}>
                  {color}
                </button>
              ))}
            </div>
          )}

          {ch.type === "type-word" && (
            <div className="flex gap-2">
              <input type="text" value={typedWord} onChange={e => setTypedWord(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") answer(typedWord); }}
                disabled={answered} autoFocus placeholder="Tape le mot..."
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-lg text-white/80 font-mono placeholder:text-white/20 focus:outline-none focus:border-ember/30 uppercase" />
              <button onClick={() => answer(typedWord)} disabled={answered}
                className="rounded-lg bg-ember/80 px-6 py-3 text-sm font-sans text-white hover:bg-ember transition-colors disabled:opacity-30">OK</button>
            </div>
          )}

          {ch.type === "math" && (
            <div className="flex gap-2">
              <input type="number" value={mathAnswer} onChange={e => setMathAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") answer(mathAnswer); }}
                disabled={answered} autoFocus placeholder="= ?"
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-lg text-white/80 font-mono placeholder:text-white/20 focus:outline-none focus:border-ember/30" />
              <button onClick={() => answer(mathAnswer)} disabled={answered}
                className="rounded-lg bg-ember/80 px-6 py-3 text-sm font-sans text-white hover:bg-ember transition-colors disabled:opacity-30">OK</button>
            </div>
          )}

          {ch.type === "click-count" && (
            <div className="text-center space-y-3">
              <button onClick={handleClick} disabled={answered}
                className="w-32 h-32 rounded-full border-2 border-ember/40 bg-ember/10 text-3xl font-mono text-ember hover:bg-ember/20 active:scale-90 transition-all disabled:opacity-30 mx-auto block">
                {clickCount}
              </button>
              <p className="text-xs text-white/30 font-sans">Objectif : {ch.data.target as number}</p>
            </div>
          )}

          {ch.type === "dont-click" && (
            <div className="text-center space-y-3">
              <div className={cn("w-40 h-40 rounded-full border-2 mx-auto flex items-center justify-center cursor-pointer transition-all",
                answered ? "border-red-500/50 bg-red-500/10" : "border-red-500/30 bg-red-500/5 hover:bg-red-500/10")}
                onClick={handleDontClick}>
                <span className="text-4xl">🚫</span>
              </div>
              <p className={cn("text-sm font-sans", answered ? "text-red-400" : "text-white/40")}>
                {answered ? "Tu as cliqué !" : "Ne touche à rien !"}
              </p>
            </div>
          )}

          {ch.type === "biggest" && (
            <div className="grid grid-cols-2 gap-3">
              {(ch.data.numbers as number[]).map((num: number, i: number) => (
                <button key={i} onClick={() => answer(String(num))} disabled={answered}
                  className={cn("rounded-xl border p-4 text-center text-2xl font-mono transition-all",
                    answered ? "border-white/[0.04] text-white/30" : "border-white/[0.08] bg-white/[0.03] text-white/80 hover:border-ember/40 hover:bg-ember/5 active:scale-95")}>
                  {num}
                </button>
              ))}
            </div>
          )}

          {ch.type === "odd-one-out" && (
            <div className="grid grid-cols-4 gap-3">
              {(ch.data.items as string[]).map((item: string, i: number) => (
                <button key={i} onClick={() => answer(i)} disabled={answered}
                  className={cn("rounded-xl border p-4 text-center text-3xl transition-all",
                    answered ? "border-white/[0.04] opacity-30" : "border-white/[0.08] bg-white/[0.03] hover:border-ember/40 hover:bg-ember/5 active:scale-95")}>
                  {item}
                </button>
              ))}
            </div>
          )}

          {answered && <p className="text-xs text-white/20 text-center font-sans">Réponse envoyée</p>}
        </div>
      </div>
    );
  }

  if (state.status === "result") {
    const myResult = state.roundResults?.find(r => r.playerId === playerId);
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md text-center space-y-4">
          <span className="text-5xl">{myResult?.success ? "✅" : "❌"}</span>
          <h2 className={cn("text-2xl font-serif font-light", myResult?.success ? "text-emerald-300" : "text-red-300")}>
            {myResult?.success ? "Bien joué !" : "Raté !"}
          </h2>
          <div className="flex gap-3 flex-wrap justify-center">
            {state.players.map(p => (
              <div key={p.id} className={cn("text-center px-3 py-2 rounded-lg border", !p.isAlive ? "border-red-500/20 bg-red-500/5 opacity-40" : "border-white/[0.06] bg-white/[0.03]")}>
                <span className="text-xs font-sans text-white/60 block">{p.name}</span>
                <span className="text-xs font-mono text-white/30">{"❤️".repeat(p.lives)}</span>
                <p className="text-sm font-mono text-ember">{p.score}</p>
                {p.lastResult && <span className={cn("text-xs", p.lastResult === "success" ? "text-emerald-400" : "text-red-400")}>{p.lastResult === "success" ? "✓" : "✗"}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">Chargement...</p></div>;
}
