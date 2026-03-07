"use client";

import { useCallback } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

interface LaTaupeState {
  status: "waiting" | "role-reveal" | "mission" | "mission-result" | "vote" | "vote-result" | "game-over";
  round: number; totalRounds: number; teamScore: number;
  mission: { type: "estimation" | "vote-unanime" | "confiance"; question: string } | null;
  missionResult: { success: boolean; detail: string; teamScore: number } | null;
  voteResults: { playerId: string; playerName: string; votesReceived: number }[] | null;
  players: { id: string; name: string; score: number; isEliminated: boolean; hasSubmitted: boolean; hasVoted: boolean }[];
  timeLeft: number; myRole?: "taupe" | "loyal"; eliminatedMoleId?: string; winner?: "loyaux" | "taupe";
}

export default function LaTaupeGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "la-taupe", playerId, playerName);
  const { gameState } = useGameStore();
  const state = gameState as unknown as LaTaupeState;
  const mission = state?.mission ?? null;
  const roundKey = state?.round ?? 0;
  const [input, setInput] = useKeyedState<string>(roundKey, "");
  const [submitted, setSubmitted] = useKeyedState<boolean>(roundKey, false);
  const [voted, setVoted] = useKeyedState<boolean>(roundKey, false);

  const handleSubmit = useCallback(() => {
    if (submitted || !mission) return;
    setSubmitted(true);
    if (mission.type === "estimation") sendAction({ action: "submit-estimation", value: Number(input) || 0 });
    else if (mission.type === "vote-unanime") sendAction({ action: "submit-vote-unanime", word: input });
  }, [input, mission, sendAction, setSubmitted, submitted]);

  const handleConfiance = useCallback((choice: string) => {
    if (submitted) return;
    setSubmitted(true);
    sendAction({ action: "submit-confiance", choice });
  }, [sendAction, setSubmitted, submitted]);

  const handleVote = useCallback((targetId: string) => {
    if (voted) return;
    setVoted(true);
    sendAction({ action: "vote-suspect", targetId });
  }, [sendAction, setVoted, voted]);

  if (!state || state.status === "waiting") {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={{ background: "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.08), transparent 40%), #060606" }}>
        <p className="text-3xl font-sans font-semibold text-white/40 animate-pulse">En attente des joueurs...</p>
      </div>
    );
  }

  // Role reveal
  if (state.status === "role-reveal") {
    const isTaupe = state.myRole === "taupe";
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden"
        style={{
          background: isTaupe
            ? "radial-gradient(circle at 50% 25%, rgba(239, 68, 68, 0.15), transparent 40%), #060606"
            : "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.15), transparent 40%), #060606",
        }}>
        <div className={cn(
          "rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-12 py-14 text-center space-y-6",
          isTaupe ? "shadow-[0_0_20px_rgba(239,68,68,0.25)]" : "shadow-[0_0_20px_rgba(78,207,138,0.25)]"
        )}>
          <span className="block text-7xl">{isTaupe ? "\uD83D\uDC00" : "\u270A"}</span>
          <h2 className="text-5xl font-serif font-semibold text-white/90">
            {isTaupe ? "Tu es la Taupe" : "Tu es Loyal"}
          </h2>
          <p className="text-lg text-white/40 font-sans max-w-xs mx-auto">
            {isTaupe ? "Sabote discr\u00e8tement sans te faire rep\u00e9rer !" : "Coop\u00e8re et d\u00e9masque la Taupe !"}
          </p>
        </div>
      </div>
    );
  }

  // Mission phase
  if (state.status === "mission" && state.mission) {
    const me = state.players.find(p => p.id === playerId);
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden"
        style={{ background: "radial-gradient(circle at 50% 25%, rgba(101, 223, 178, 0.1), transparent 40%), #060606" }}>
        <div className="w-full max-w-md space-y-6">
          {/* Header bar */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-white/40 font-sans uppercase tracking-wider">Mission <span className="font-mono text-white/90">{state.round}/{state.totalRounds}</span></span>
            <span className={cn(
              "text-xl font-mono font-semibold",
              state.timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white/90"
            )}>{state.timeLeft}s</span>
          </div>

          {/* Timer bar */}
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(state.timeLeft / 20) * 100}%`,
                background: "linear-gradient(to right, #65dfb2, #4ecf8a)",
                boxShadow: "0 0 12px rgba(78, 207, 138, 0.4)",
              }}
            />
          </div>

          {/* Taupe hint */}
          {state.myRole === "taupe" && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-center">
              <p className="text-sm text-red-400/60 font-sans">\uD83D\uDC00 Tu es la Taupe — sabote subtilement</p>
            </div>
          )}

          {/* Question card */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-8 py-8 shadow-[0_0_20px_rgba(101,223,178,0.1)]">
            <h2 className="text-3xl font-serif font-semibold text-white/90 text-center leading-snug">{state.mission.question}</h2>
          </div>

          {/* Input area */}
          {state.mission.type === "confiance" ? (
            <div className="flex gap-4">
              <button onClick={() => handleConfiance("contribuer")} disabled={submitted}
                className={cn(
                  "flex-1 rounded-3xl border p-5 text-center font-sans text-lg font-semibold transition-all",
                  submitted
                    ? "border-white/[0.04] text-white/25"
                    : "border-white/25 bg-black/30 backdrop-blur-sm text-emerald-300 hover:shadow-[0_0_20px_rgba(78,207,138,0.25)] hover:border-emerald-500/40"
                )}>
                \u270A Contribuer
              </button>
              <button onClick={() => handleConfiance("saboter")} disabled={submitted}
                className={cn(
                  "flex-1 rounded-3xl border p-5 text-center font-sans text-lg font-semibold transition-all",
                  submitted
                    ? "border-white/[0.04] text-white/25"
                    : "border-white/25 bg-black/30 backdrop-blur-sm text-red-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:border-red-500/40"
                )}>
                \uD83D\uDC80 Saboter
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type={state.mission.type === "estimation" ? "number" : "text"}
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                disabled={submitted}
                placeholder={state.mission.type === "estimation" ? "Ton estimation..." : "Ta r\u00e9ponse..."}
                className="flex-1 rounded-2xl border border-white/25 bg-black/30 px-5 py-3.5 font-mono text-lg text-white/90 placeholder:text-white/25 outline-none backdrop-blur-sm focus:shadow-[0_0_20px_rgba(101,223,178,0.15)] focus:border-emerald-500/40 transition-all"
              />
              <button onClick={handleSubmit} disabled={submitted}
                className="rounded-2xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-8 py-3.5 text-lg font-sans font-semibold text-white shadow-[0_0_20px_rgba(78,207,138,0.25)] hover:shadow-[0_0_30px_rgba(78,207,138,0.4)] transition-all disabled:opacity-30">
                OK
              </button>
            </div>
          )}

          {submitted && <p className="text-sm text-white/25 text-center font-sans animate-pulse">En attente des autres...</p>}

          {/* Player status chips */}
          <div className="flex gap-2 flex-wrap justify-center">
            {state.players.map(p => (
              <span key={p.id} className={cn(
                "text-sm font-sans px-3 py-1.5 rounded-full border transition-all",
                p.hasSubmitted
                  ? "text-emerald-300/80 bg-emerald-500/10 border-emerald-500/20"
                  : "text-white/25 bg-white/[0.03] border-white/[0.08]"
              )}>
                {p.name} {p.hasSubmitted ? "\u2713" : "..."}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mission result
  if (state.status === "mission-result" && state.missionResult) {
    const success = state.missionResult.success;
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden"
        style={{
          background: success
            ? "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.15), transparent 40%), #060606"
            : "radial-gradient(circle at 50% 25%, rgba(239, 68, 68, 0.15), transparent 40%), #060606",
        }}>
        <div className={cn(
          "w-full max-w-md rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-10 py-12 text-center space-y-6",
          success ? "shadow-[0_0_20px_rgba(78,207,138,0.25)]" : "shadow-[0_0_20px_rgba(239,68,68,0.25)]"
        )}>
          <span className="block text-7xl">{success ? "\u2705" : "\u274C"}</span>
          <h2 className={cn("text-4xl font-serif font-semibold", success ? "text-emerald-300" : "text-red-300")}>
            {success ? "Mission r\u00e9ussie !" : "Mission \u00e9chou\u00e9e"}
          </h2>
          <p className="text-lg text-white/60 font-sans">{state.missionResult.detail}</p>
          <div className="inline-block rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-3">
            <p className="text-sm text-white/40 font-sans">Score d&apos;\u00e9quipe : <span className="font-mono text-3xl text-white/90 font-semibold">{state.missionResult.teamScore}</span></p>
          </div>
        </div>
      </div>
    );
  }

  // Vote phase
  if (state.status === "vote") {
    const others = state.players.filter(p => p.id !== playerId && !p.isEliminated);
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden"
        style={{ background: "radial-gradient(circle at 50% 25%, rgba(239, 68, 68, 0.1), transparent 40%), #060606" }}>
        <div className="w-full max-w-md space-y-6">
          {/* Vote header */}
          <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <h2 className="text-3xl font-serif font-semibold text-white/90">Qui est la Taupe ?</h2>
            <span className={cn(
              "text-xl font-mono font-semibold",
              state.timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white/90"
            )}>{state.timeLeft}s</span>
          </div>

          {/* Player vote buttons */}
          <div className="space-y-3">
            {others.map(p => (
              <button key={p.id} onClick={() => handleVote(p.id)} disabled={voted}
                className={cn(
                  "w-full rounded-3xl border p-5 text-left font-sans transition-all flex items-center justify-between",
                  voted
                    ? "border-white/[0.04] bg-black/20 text-white/25"
                    : "border-white/25 bg-black/30 backdrop-blur-sm text-white/90 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                )}>
                <span className="text-lg font-semibold">{p.name}</span>
                <span className="text-sm font-mono text-white/40">{p.score} pts</span>
              </button>
            ))}
          </div>

          {voted && <p className="text-sm text-white/25 text-center font-sans animate-pulse">Vote enregistr\u00e9</p>}
        </div>
      </div>
    );
  }

  // Vote result
  if (state.status === "vote-result" && state.voteResults) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden"
        style={{ background: "radial-gradient(circle at 50% 25%, rgba(239, 68, 68, 0.1), transparent 40%), #060606" }}>
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-4xl font-serif font-semibold text-white/90 text-center">R\u00e9sultats du vote</h2>
          <div className="space-y-3">
            {state.voteResults.map((v, i) => (
              <div key={v.playerId} className={cn(
                "flex items-center justify-between rounded-3xl border p-5 font-sans transition-all",
                i === 0 && v.votesReceived > 0
                  ? "border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  : "border-white/25 bg-black/30 backdrop-blur-sm"
              )}>
                <span className="text-lg text-white/90 font-semibold">{v.playerName}</span>
                <span className="text-xl font-mono font-semibold text-white/90">{v.votesReceived} <span className="text-sm text-white/40">vote{v.votesReceived > 1 ? "s" : ""}</span></span>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/25 text-center font-sans">La Taupe survit... Prochaine mission !</p>
        </div>
      </div>
    );
  }

  // Game over
  if (state.status === "game-over") {
    const mole = state.players.find(p => p.id === state.eliminatedMoleId) ?? state.players.find(() => true);
    const loyauxWin = state.winner === "loyaux";
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 overflow-hidden"
        style={{
          background: loyauxWin
            ? "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.2), transparent 40%), #060606"
            : "radial-gradient(circle at 50% 25%, rgba(239, 68, 68, 0.2), transparent 40%), #060606",
        }}>
        <div className={cn(
          "w-full max-w-md rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-10 py-14 text-center space-y-6",
          loyauxWin ? "shadow-[0_0_20px_rgba(78,207,138,0.25)]" : "shadow-[0_0_20px_rgba(239,68,68,0.25)]"
        )}>
          <span className="block text-7xl">{loyauxWin ? "\uD83C\uDF89" : "\uD83D\uDC00"}</span>
          <h2 className="text-5xl font-serif font-semibold text-white/90">
            {loyauxWin ? "Les Loyaux gagnent !" : "La Taupe gagne !"}
          </h2>
          {state.eliminatedMoleId && (
            <div className="inline-block rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-3">
              <p className="text-lg text-white/40 font-sans">La Taupe \u00e9tait : <span className="font-semibold text-white/90">{state.players.find(p => p.id === state.eliminatedMoleId)?.name}</span></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(78, 207, 138, 0.08), transparent 40%), #060606" }}>
      <p className="text-3xl font-sans font-semibold text-white/40 animate-pulse">Chargement...</p>
    </div>
  );
}
