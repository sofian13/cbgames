"use client";

import { useCallback } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

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
            fill={!s.isActive ? "rgba(255,255,255,0.02)" : s.index < bullets ? "rgba(80,216,255,0.6)" : "rgba(255,255,255,0.08)"}
            stroke={!s.isActive ? "rgba(255,255,255,0.04)" : s.index < bullets ? "rgba(80,216,255,0.85)" : "rgba(255,255,255,0.15)"}
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
  const state = gameState as unknown as RS;
  const turnKey = state?.turn ?? 0;
  const [betPrediction, setBetPrediction] = useKeyedState<"bang" | "safe" | null>(turnKey, null);
  const [betAmount, setBetAmount] = useKeyedState<number>(turnKey, 25);
  const [hasBet, setHasBet] = useKeyedState<boolean>(turnKey, false);

  const handleBet = useCallback(() => {
    if (hasBet || !betPrediction) return;
    setHasBet(true);
    sendAction({ action: "bet", prediction: betPrediction, amount: betAmount });
  }, [betAmount, betPrediction, hasBet, sendAction, setHasBet]);

  if (!state || state.status === "waiting") return (
    <div className="flex flex-1 items-center justify-center" style={{ background: "radial-gradient(circle at 50% 25%, rgba(101,223,178,0.06), transparent 40%), #060606" }}>
      <p className="text-white/40 animate-pulse font-sans text-lg">En attente...</p>
    </div>
  );

  const me = state.players?.find(p => p.id === playerId);
  const isMyTurn = state.currentPlayerId === playerId;

  if (state.status === "betting") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.08), transparent 40%), #060606" }}>
        <div className="w-full max-w-md space-y-6">
          {/* Header row */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em]">Tour {state.turn}/{state.maxTurns}</span>
            <span className="text-sm font-mono text-ember shadow-[0_0_20px_rgba(255,100,50,0.25)]">{state.timeLeft}s</span>
          </div>

          {/* Barrel */}
          <BarrelVisual chambers={state.barrel.chambers} bullets={state.barrel.bullets} />

          {/* Current turn info */}
          <p className="text-center text-white/90 font-sans text-xl font-semibold">
            {isMyTurn ? "C'est ton tour de tirer..." : `${state.players.find(p => p.id === state.currentPlayerId)?.name} va tirer`}
          </p>

          {/* Betting panel */}
          {!isMyTurn && me?.isAlive && !hasBet ? (
            <div className="space-y-4 rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-5 shadow-[0_0_20px_rgba(80,216,255,0.08)]">
              <p className="text-sm text-white/40 font-sans text-center uppercase tracking-wider">Ton pari</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setBetPrediction("bang")}
                  className={cn("rounded-2xl border px-5 py-2.5 text-sm font-sans font-semibold transition-all",
                    betPrediction === "bang"
                      ? "border-red-400/50 bg-red-500/15 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                      : "border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/15")}>
                  BANG
                </button>
                <button onClick={() => setBetPrediction("safe")}
                  className={cn("rounded-2xl border px-5 py-2.5 text-sm font-sans font-semibold transition-all",
                    betPrediction === "safe"
                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.25)]"
                      : "border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/15")}>
                  Safe
                </button>
              </div>
              <div className="flex gap-2 justify-center">
                {BETS.map(b => (
                  <button key={b} onClick={() => setBetAmount(b)}
                    className={cn("rounded-xl border px-4 py-1.5 text-xs font-mono transition-all",
                      betAmount === b
                        ? "border-ember/50 bg-ember/10 text-ember shadow-[0_0_12px_rgba(255,100,50,0.2)]"
                        : "border-white/[0.08] text-white/30 hover:text-white/50")}>
                    {b}
                  </button>
                ))}
              </div>
              <button onClick={handleBet} disabled={!betPrediction}
                className="w-full rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] py-3 text-sm font-sans font-semibold text-white shadow-[0_0_20px_rgba(101,223,178,0.25)] hover:shadow-[0_0_30px_rgba(101,223,178,0.35)] transition-all disabled:opacity-30 disabled:shadow-none">
                Parier
              </button>
            </div>
          ) : hasBet ? (
            <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm py-4 text-center">
              <p className="text-sm text-white/40 font-sans">Pari enregistre</p>
            </div>
          ) : isMyTurn ? (
            <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm py-4 text-center">
              <p className="text-sm text-ember/60 font-sans">Tu ne peux pas parier sur toi-meme</p>
            </div>
          ) : null}

          {/* Players row */}
          <div className="flex gap-3 flex-wrap justify-center">
            {state.players.map(p => (
              <div key={p.id} className={cn(
                "text-center px-3 py-2 rounded-2xl border transition-all",
                !p.isAlive
                  ? "opacity-30 border-white/[0.04]"
                  : p.id === state.currentPlayerId
                    ? "border-ember/30 bg-ember/5 shadow-[0_0_12px_rgba(255,100,50,0.15)]"
                    : "border-white/[0.06]"
              )}>
                <span className={cn("text-xs font-sans font-semibold", p.id === state.currentPlayerId ? "text-ember" : "text-white/40")}>{p.name}</span>
                <p className="text-xs text-white/25 font-mono">{p.points}pts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "action" && isMyTurn) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.08), transparent 40%), #060606" }}>
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em]">Ton action</span>
            <span className="text-sm font-mono text-ember shadow-[0_0_20px_rgba(255,100,50,0.25)]">{state.timeLeft}s</span>
          </div>

          {/* Barrel */}
          <BarrelVisual chambers={state.barrel.chambers} bullets={state.barrel.bullets} />

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => sendAction({ action: "tirer" })}
              className="rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-center font-sans text-red-300 hover:bg-red-500/15 hover:border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all col-span-2 backdrop-blur-sm">
              <span className="text-3xl block mb-2">🔫</span>
              <span className="text-lg font-semibold">Tirer</span>
            </button>
            <button onClick={() => sendAction({ action: "sauter" })}
              className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-4 text-center font-sans text-white/60 hover:text-white/90 hover:border-white/40 transition-all">
              <span className="text-xl block mb-1">⏭️</span>
              <span className="text-xs text-white/40">Passer (-100)</span>
            </button>
            <button onClick={() => sendAction({ action: "ajouter-balle" })}
              className="rounded-3xl border border-ember/30 bg-ember/5 backdrop-blur-sm p-4 text-center font-sans text-ember/80 hover:text-ember hover:border-ember/50 shadow-[0_0_12px_rgba(255,100,50,0.08)] hover:shadow-[0_0_20px_rgba(255,100,50,0.15)] transition-all">
              <span className="text-xl block mb-1">💀</span>
              <span className="text-xs">+Balle (-150)</span>
            </button>
            <button onClick={() => sendAction({ action: "verifier" })}
              className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-4 text-center font-sans text-white/60 hover:text-white/90 hover:border-white/40 transition-all col-span-2">
              <span className="text-xl">👁️</span>
              <span className="text-xs ml-2 text-white/40">Verifier (-75)</span>
            </button>
          </div>

          {/* Points */}
          <p className="text-sm text-white/25 font-mono text-center">{me?.points ?? 0} pts restants</p>
        </div>
      </div>
    );
  }

  if (state.status === "action") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "radial-gradient(circle at 50% 25%, rgba(80,216,255,0.06), transparent 40%), #060606" }}>
        <div className="w-full max-w-md space-y-6 text-center">
          <BarrelVisual chambers={state.barrel.chambers} bullets={state.barrel.bullets} />
          <p className="text-3xl font-serif font-semibold text-white/90">{state.players.find(p => p.id === state.currentPlayerId)?.name} choisit...</p>
          <span className="text-sm font-mono text-ember shadow-[0_0_20px_rgba(255,100,50,0.25)]">{state.timeLeft}s</span>
        </div>
      </div>
    );
  }

  if (state.status === "resolution" && state.resolution) {
    const r = state.resolution;
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{
        background: r.hit
          ? "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.12), transparent 40%), #060606"
          : "radial-gradient(circle at 50% 25%, rgba(52,211,153,0.10), transparent 40%), #060606"
      }}>
        <div className="w-full max-w-md text-center space-y-5">
          {/* Result icon */}
          <span className="text-7xl block">{r.hit ? "💥" : "😮‍💨"}</span>

          {/* Result title */}
          <h2 className={cn(
            "text-5xl font-serif font-semibold",
            r.hit
              ? "text-red-300 [text-shadow:0_0_30px_rgba(239,68,68,0.4)]"
              : "text-emerald-300 [text-shadow:0_0_30px_rgba(52,211,153,0.4)]"
          )}>
            {r.hit ? "BANG !" : "Safe..."}
          </h2>

          {/* Description */}
          <p className="text-base text-white/90 font-sans">
            {r.playerName} a {r.action === "tirer" ? "tire" : r.action === "sauter" ? "passe son tour" : r.action === "ajouter-balle" ? "ajoute une balle et tire" : "verifie et tire"}
          </p>

          {/* Player cards */}
          <div className="flex gap-3 flex-wrap justify-center mt-6">
            {state.players.map(p => (
              <div key={p.id} className={cn(
                "text-center px-4 py-3 rounded-3xl border backdrop-blur-sm transition-all",
                !p.isAlive
                  ? "border-red-500/20 bg-red-500/5 opacity-40"
                  : "border-white/25 bg-black/30 shadow-[0_0_12px_rgba(255,255,255,0.03)]"
              )}>
                <span className="text-sm font-sans font-semibold text-white/90">{p.name}</span>
                <p className="text-sm font-mono text-ember">{p.points}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center" style={{ background: "radial-gradient(circle at 50% 25%, rgba(101,223,178,0.06), transparent 40%), #060606" }}>
      <p className="text-white/40 animate-pulse font-sans text-lg">Chargement...</p>
    </div>
  );
}
