"use client";

import { useCallback } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

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
  const state = gameState as unknown as SSState;
  const roundKey = state?.round ?? 0;
  const [answered, setAnswered] = useKeyedState<boolean>(roundKey, false);
  const [typedWord, setTypedWord] = useKeyedState<string>(roundKey, "");
  const [mathAnswer, setMathAnswer] = useKeyedState<string>(roundKey, "");
  const [clickCount, setClickCount] = useKeyedState<number>(roundKey, 0);

  const answer = useCallback((value: unknown) => {
    if (answered) return;
    setAnswered(true);
    sendAction({ action: "answer", value: String(value) });
  }, [answered, sendAction, setAnswered]);

  const handleClick = useCallback(() => {
    setClickCount((count) => count + 1);
    sendAction({ action: "click" });
  }, [sendAction, setClickCount]);

  const handleDontClick = useCallback(() => {
    sendAction({ action: "clicked" });
    setAnswered(true);
  }, [sendAction, setAnswered]);

  if (!state || state.status === "waiting") return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(78,207,138,0.12), transparent 40%), #060606" }}>
      <p className="text-3xl font-sans font-semibold text-white/40 animate-pulse">En attente...</p>
    </div>
  );

  const me = state.players?.find(p => p.id === playerId);

  if (state.status === "challenge" && state.challenge) {
    const ch = state.challenge;
    const timerPct = (state.timeLeft / Math.ceil(state.timeLimit / 1000)) * 100;
    const urgent = state.timeLeft <= 1;
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-4"
        style={{ background: urgent
          ? "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.18), transparent 40%), #060606"
          : "radial-gradient(circle at 50% 25%, rgba(78,207,138,0.12), transparent 40%), #060606" }}>
        <div className="w-full max-w-md space-y-6">

          {/* Round header */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/25 font-sans uppercase tracking-widest">Round {state.round}</span>
            <span className={cn(
              "text-3xl font-mono font-bold",
              urgent ? "text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]" : "text-[#65dfb2]"
            )}>{state.timeLeft}s</span>
          </div>

          {/* Timer bar */}
          <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div className={cn(
              "h-full rounded-full transition-all duration-1000",
              urgent ? "bg-red-400/70" : "bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a]"
            )} style={{ width: `${timerPct}%` }} />
          </div>

          {/* Instruction panel */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-6 py-5">
            <h2 className="text-2xl font-serif font-semibold text-white/90 text-center leading-relaxed">{ch.instruction}</h2>
          </div>

          {/* Challenge: click-color */}
          {ch.type === "click-color" && (
            <div className="grid grid-cols-2 gap-3">
              {(ch.data.buttons as string[]).map((color: string) => (
                <button key={color} onClick={() => answer(color)} disabled={answered}
                  className={cn(
                    "rounded-3xl border p-5 text-center font-sans text-xl font-semibold transition-all",
                    answered
                      ? "border-white/[0.06] text-white/25 bg-black/20"
                      : "border-white/25 bg-black/30 backdrop-blur-sm text-white/90 hover:border-[#65dfb2]/50 hover:shadow-[0_0_20px_rgba(101,223,178,0.25)] active:scale-95"
                  )}>
                  {color}
                </button>
              ))}
            </div>
          )}

          {/* Challenge: type-word */}
          {ch.type === "type-word" && (
            <div className="flex gap-3">
              <input type="text" value={typedWord} onChange={e => setTypedWord(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") answer(typedWord); }}
                disabled={answered} autoFocus placeholder="Tape le mot..."
                className="flex-1 rounded-2xl border border-white/25 bg-black/30 px-5 py-3.5 font-mono text-lg text-white/90 placeholder:text-white/25 outline-none backdrop-blur-sm focus:border-[#65dfb2]/50 focus:shadow-[0_0_20px_rgba(101,223,178,0.15)] uppercase transition-all" />
              <button onClick={() => answer(typedWord)} disabled={answered}
                className="rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-7 py-3.5 text-base font-sans font-semibold text-black shadow-[0_0_20px_rgba(101,223,178,0.25)] hover:shadow-[0_0_30px_rgba(101,223,178,0.35)] transition-all disabled:opacity-30 active:scale-95">OK</button>
            </div>
          )}

          {/* Challenge: math */}
          {ch.type === "math" && (
            <div className="flex gap-3">
              <input type="number" value={mathAnswer} onChange={e => setMathAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") answer(mathAnswer); }}
                disabled={answered} autoFocus placeholder="= ?"
                className="flex-1 rounded-2xl border border-white/25 bg-black/30 px-5 py-3.5 font-mono text-lg text-white/90 placeholder:text-white/25 outline-none backdrop-blur-sm focus:border-[#65dfb2]/50 focus:shadow-[0_0_20px_rgba(101,223,178,0.15)] transition-all" />
              <button onClick={() => answer(mathAnswer)} disabled={answered}
                className="rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-7 py-3.5 text-base font-sans font-semibold text-black shadow-[0_0_20px_rgba(101,223,178,0.25)] hover:shadow-[0_0_30px_rgba(101,223,178,0.35)] transition-all disabled:opacity-30 active:scale-95">OK</button>
            </div>
          )}

          {/* Challenge: click-count */}
          {ch.type === "click-count" && (
            <div className="text-center space-y-4">
              <button onClick={handleClick} disabled={answered}
                className="w-36 h-36 rounded-full border-2 border-[#65dfb2]/40 bg-[#65dfb2]/10 text-4xl font-mono font-bold text-[#65dfb2] shadow-[0_0_20px_rgba(101,223,178,0.25)] hover:bg-[#65dfb2]/20 hover:shadow-[0_0_30px_rgba(101,223,178,0.35)] active:scale-90 transition-all disabled:opacity-30 mx-auto block backdrop-blur-sm">
                {clickCount}
              </button>
              <p className="text-sm text-white/40 font-sans">Objectif : <span className="font-mono text-white/60">{ch.data.target as number}</span></p>
            </div>
          )}

          {/* Challenge: dont-click */}
          {ch.type === "dont-click" && (
            <div className="text-center space-y-4">
              <div className={cn(
                "w-44 h-44 rounded-full border-2 mx-auto flex items-center justify-center cursor-pointer transition-all backdrop-blur-sm",
                answered
                  ? "border-red-500/50 bg-red-500/15 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                  : "border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              )} onClick={handleDontClick}>
                <span className="text-5xl select-none">&#x1F6AB;</span>
              </div>
              <p className={cn("text-lg font-sans font-semibold", answered ? "text-red-400" : "text-white/40")}>
                {answered ? "Tu as clique !" : "Ne touche a rien !"}
              </p>
            </div>
          )}

          {/* Challenge: biggest */}
          {ch.type === "biggest" && (
            <div className="grid grid-cols-2 gap-3">
              {(ch.data.numbers as number[]).map((num: number, i: number) => (
                <button key={i} onClick={() => answer(String(num))} disabled={answered}
                  className={cn(
                    "rounded-3xl border p-5 text-center text-3xl font-mono font-bold transition-all",
                    answered
                      ? "border-white/[0.06] text-white/25 bg-black/20"
                      : "border-white/25 bg-black/30 backdrop-blur-sm text-white/90 hover:border-[#65dfb2]/50 hover:shadow-[0_0_20px_rgba(101,223,178,0.25)] active:scale-95"
                  )}>
                  {num}
                </button>
              ))}
            </div>
          )}

          {/* Challenge: odd-one-out */}
          {ch.type === "odd-one-out" && (
            <div className="grid grid-cols-4 gap-3">
              {(ch.data.items as string[]).map((item: string, i: number) => (
                <button key={i} onClick={() => answer(i)} disabled={answered}
                  className={cn(
                    "rounded-3xl border p-4 text-center text-3xl transition-all",
                    answered
                      ? "border-white/[0.06] opacity-30 bg-black/20"
                      : "border-white/25 bg-black/30 backdrop-blur-sm hover:border-[#65dfb2]/50 hover:shadow-[0_0_20px_rgba(101,223,178,0.25)] active:scale-95"
                  )}>
                  {item}
                </button>
              ))}
            </div>
          )}

          {/* Answered feedback */}
          {answered && (
            <p className="text-sm text-white/25 text-center font-sans tracking-wide animate-pulse">Reponse envoyee</p>
          )}
        </div>
      </div>
    );
  }

  if (state.status === "result") {
    const myResult = state.roundResults?.find(r => r.playerId === playerId);
    const success = myResult?.success;
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-6"
        style={{ background: success
          ? "radial-gradient(circle at 50% 25%, rgba(101,223,178,0.18), transparent 40%), #060606"
          : "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.18), transparent 40%), #060606" }}>
        <div className="w-full max-w-md text-center space-y-6">

          {/* Result icon */}
          <span className={cn(
            "inline-block text-5xl",
            success ? "drop-shadow-[0_0_20px_rgba(101,223,178,0.5)]" : "drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
          )}>{success ? "\u2714" : "\u2718"}</span>

          {/* Result text */}
          <h2 className={cn(
            "text-4xl font-serif font-semibold",
            success ? "text-[#65dfb2]" : "text-red-400"
          )}>
            {success ? "Bien joue !" : "Rate !"}
          </h2>

          {/* Players scoreboard */}
          <div className="flex gap-3 flex-wrap justify-center">
            {state.players.map(p => (
              <div key={p.id} className={cn(
                "text-center px-4 py-3 rounded-3xl border backdrop-blur-sm transition-all",
                !p.isAlive
                  ? "border-red-500/20 bg-red-500/5 opacity-40"
                  : p.id === playerId
                    ? "border-[#65dfb2]/30 bg-[#65dfb2]/5 shadow-[0_0_20px_rgba(101,223,178,0.15)]"
                    : "border-white/25 bg-black/30"
              )}>
                <span className="text-sm font-sans text-white/60 block mb-1">{p.name}</span>
                <span className="text-xs font-mono text-red-400/70 block mb-1">
                  {Array.from({ length: p.lives }).map((_, i) => "\u2764").join("")}
                </span>
                <p className="text-xl font-mono font-bold text-[#65dfb2]">{p.score}</p>
                {p.lastResult && (
                  <span className={cn(
                    "text-sm font-sans font-semibold mt-1 block",
                    p.lastResult === "success" ? "text-[#65dfb2]" : "text-red-400"
                  )}>{p.lastResult === "success" ? "\u2713" : "\u2717"}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(78,207,138,0.12), transparent 40%), #060606" }}>
      <p className="text-3xl font-sans font-semibold text-white/40 animate-pulse">Chargement...</p>
    </div>
  );
}
