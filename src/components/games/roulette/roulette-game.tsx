"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

interface RPS { id: string; name: string; points: number; isAlive: boolean; hasBet: boolean; }
interface RRes { hit: boolean; playerId: string; playerName: string; action: string; }
interface RS {
  status: "waiting" | "betting" | "action" | "resolution" | "game-over";
  turn: number; maxTurns: number; currentPlayerId: string;
  barrel: { chambers: number; bullets: number };
  players: RPS[]; timeLeft: number; resolution?: RRes;
}

const BETS = [25, 50, 100] as const;

function BarrelVisual({ chambers, bullets }: { chambers: number; bullets: number }) {
  const slots = Array.from({ length: 6 }, (_, i) => {
    const isActive = i < chambers;
    const angle = (i * 360) / 6 - 90;
    const rad = (angle * Math.PI) / 180;
    const cx = 50 + 32 * Math.cos(rad);
    const cy = 50 + 32 * Math.sin(rad);
    return { cx, cy, isActive, index: i };
  });
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx="50" cy="50" r="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        {slots.map((s) => (
          <circle key={s.index} cx={s.cx} cy={s.cy} r={s.isActive ? 7 : 5}
            fill={!s.isActive ? "rgba(255,255,255,0.02)" : s.index < bullets ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.08)"}
            stroke={!s.isActive ? "rgba(255,255,255,0.04)" : s.index < bullets ? "rgba(249,115,22,0.8)" : "rgba(255,255,255,0.15)"}
            strokeWidth="1" />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-mono text-white/30">{bullets}/{chambers}</span>
      </div>
    </div>
  );
}

export default function RouletteGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "roulette", playerId, playerName);
  const { gameState } = useGameStore();
  const [betPrediction, setBetPrediction] = useState<"bang" | "safe" | null>(null);
  const [betAmount, setBetAmount] = useState<number>(25);
  const [hasBet, setHasBet] = useState(false);
  const prevTurnRef = useRef(0);
  const state = gameState as unknown as RS;

  useEffect(() => {
    if (state?.turn !== prevTurnRef.current) {
      prevTurnRef.current = state?.turn ?? 0;
      setBetPrediction(null); setBetAmount(25); setHasBet(false);
    }
  }, [state?.turn]);

  const handleBet = useCallback(() => {
    if (hasBet || !betPrediction) return;
    setHasBet(true);
    sendAction({ action: "bet", prediction: betPrediction, amount: betAmount });
  }, [hasBet, betPrediction, betAmount, sendAction]);

  if (!state || state.status === "waiting") return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">En attente...</p></div>;

  const me = state.players?.find(p => p.id === playerId);
  const isMyTurn = state.currentPlayerId === playerId;

  if (state.status === "betting") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/20 font-sans uppercase tracking-wider">Tour {state.turn}/{state.maxTurns}</span>
            <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
          </div>
          <BarrelVisual chambers={state.barrel.chambers} bullets={state.barrel.bullets} />
          <p className="text-center text-sm text-white/60 font-sans">
            {isMyTurn ? "C'est ton tour de tirer..." : `${state.players.find(p => p.id === state.currentPlayerId)?.name} va tirer`}
          </p>
          {!isMyTurn && me?.isAlive && !hasBet ? (
            <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-xs text-white/40 font-sans text-center">Ton pari</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setBetPrediction("bang")}
                  className={cn("rounded-lg border px-4 py-2 text-sm font-sans transition-all", betPrediction === "bang" ? "border-red-500/50 bg-red-500/10 text-red-300" : "border-white/[0.08] text-white/40 hover:text-white/60")}>
                  BANG
                </button>
                <button onClick={() => setBetPrediction("safe")}
                  className={cn("rounded-lg border px-4 py-2 text-sm font-sans transition-all", betPrediction === "safe" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-white/[0.08] text-white/40 hover:text-white/60")}>
                  Safe
                </button>
              </div>
              <div className="flex gap-2 justify-center">
                {BETS.map(b => (
                  <button key={b} onClick={() => setBetAmount(b)}
                    className={cn("rounded-lg border px-3 py-1 text-xs font-mono transition-all", betAmount === b ? "border-ember/50 bg-ember/10 text-ember" : "border-white/[0.08] text-white/30")}>
                    {b}
                  </button>
                ))}
              </div>
              <button onClick={handleBet} disabled={!betPrediction}
                className="w-full rounded-lg bg-ember/80 py-2 text-sm font-sans text-white hover:bg-ember transition-colors disabled:opacity-30">
                Parier
              </button>
            </div>
          ) : hasBet ? (
            <p className="text-xs text-white/20 text-center font-sans">Pari enregistré</p>
          ) : isMyTurn ? (
            <p className="text-xs text-ember/60 text-center font-sans">Tu ne peux pas parier sur toi-même</p>
          ) : null}
          <div className="flex gap-3 flex-wrap justify-center">
            {state.players.map(p => (
              <div key={p.id} className={cn("text-center", !p.isAlive && "opacity-30")}>
                <span className={cn("text-xs font-sans", p.id === state.currentPlayerId ? "text-ember" : "text-white/30")}>{p.name}</span>
                <p className="text-xs text-white/20 font-mono">{p.points}pts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "action" && isMyTurn) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/20 font-sans uppercase">Ton action</span>
            <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
          </div>
          <BarrelVisual chambers={state.barrel.chambers} bullets={state.barrel.bullets} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => sendAction({ action: "tirer" })}
              className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center font-sans text-red-300 hover:bg-red-500/10 transition-all col-span-2">
              <span className="text-2xl block mb-1">🔫</span>Tirer
            </button>
            <button onClick={() => sendAction({ action: "sauter" })}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center font-sans text-white/60 hover:text-white/80 transition-all">
              <span className="text-lg block mb-1">⏭️</span>
              <span className="text-xs">Passer (-100)</span>
            </button>
            <button onClick={() => sendAction({ action: "ajouter-balle" })}
              className="rounded-xl border border-ember/30 bg-ember/5 p-3 text-center font-sans text-ember/80 hover:text-ember transition-all">
              <span className="text-lg block mb-1">💀</span>
              <span className="text-xs">+Balle (-150)</span>
            </button>
            <button onClick={() => sendAction({ action: "verifier" })}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center font-sans text-white/60 hover:text-white/80 transition-all col-span-2">
              <span className="text-lg">👁️</span>
              <span className="text-xs ml-2">Vérifier (-75)</span>
            </button>
          </div>
          <p className="text-xs text-white/20 font-mono text-center">{me?.points ?? 0} pts restants</p>
        </div>
      </div>
    );
  }

  if (state.status === "action") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-6 text-center">
          <BarrelVisual chambers={state.barrel.chambers} bullets={state.barrel.bullets} />
          <p className="text-lg font-serif text-white/90">{state.players.find(p => p.id === state.currentPlayerId)?.name} choisit...</p>
          <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
        </div>
      </div>
    );
  }

  if (state.status === "resolution" && state.resolution) {
    const r = state.resolution;
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md text-center space-y-4">
          <span className="text-6xl">{r.hit ? "💥" : "😮‍💨"}</span>
          <h2 className={cn("text-2xl font-serif font-light", r.hit ? "text-red-300" : "text-emerald-300")}>
            {r.hit ? "BANG !" : "Safe..."}
          </h2>
          <p className="text-sm text-white/60 font-sans">
            {r.playerName} a {r.action === "tirer" ? "tiré" : r.action === "sauter" ? "passé son tour" : r.action === "ajouter-balle" ? "ajouté une balle et tiré" : "vérifié et tiré"}
          </p>
          <div className="flex gap-3 flex-wrap justify-center mt-4">
            {state.players.map(p => (
              <div key={p.id} className={cn("text-center px-3 py-2 rounded-lg border", !p.isAlive ? "border-red-500/20 bg-red-500/5 opacity-50" : "border-white/[0.06] bg-white/[0.03]")}>
                <span className="text-xs font-sans text-white/60">{p.name}</span>
                <p className="text-sm font-mono text-ember">{p.points}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">Chargement...</p></div>;
}
