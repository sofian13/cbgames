"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

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
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [voted, setVoted] = useState(false);
  const prevRoundRef = useRef(0);

  const state = gameState as unknown as LaTaupeState;

  useEffect(() => {
    if (state?.round !== prevRoundRef.current) {
      prevRoundRef.current = state?.round ?? 0;
      setInput(""); setSubmitted(false); setVoted(false);
    }
  }, [state?.round]);

  const handleSubmit = useCallback(() => {
    if (submitted || !state?.mission) return;
    setSubmitted(true);
    if (state.mission.type === "estimation") sendAction({ action: "submit-estimation", value: Number(input) || 0 });
    else if (state.mission.type === "vote-unanime") sendAction({ action: "submit-vote-unanime", word: input });
  }, [submitted, input, state?.mission, sendAction]);

  const handleConfiance = useCallback((choice: string) => {
    if (submitted) return;
    setSubmitted(true);
    sendAction({ action: "submit-confiance", choice });
  }, [submitted, sendAction]);

  const handleVote = useCallback((targetId: string) => {
    if (voted) return;
    setVoted(true);
    sendAction({ action: "vote-suspect", targetId });
  }, [voted, sendAction]);

  if (!state || state.status === "waiting") {
    return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">En attente des joueurs...</p></div>;
  }

  // Role reveal
  if (state.status === "role-reveal") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="text-center space-y-4">
          <span className="text-6xl">{state.myRole === "taupe" ? "🐀" : "✊"}</span>
          <h2 className="text-3xl font-serif font-light text-white/90">
            {state.myRole === "taupe" ? "Tu es la Taupe" : "Tu es Loyal"}
          </h2>
          <p className="text-sm text-white/40 font-sans">
            {state.myRole === "taupe" ? "Sabote discrètement sans te faire repérer !" : "Coopère et démasque la Taupe !"}
          </p>
        </div>
      </div>
    );
  }

  // Mission phase
  if (state.status === "mission" && state.mission) {
    const me = state.players.find(p => p.id === playerId);
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/20 font-sans uppercase tracking-wider">Mission {state.round}/{state.totalRounds}</span>
            <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-ember/60 transition-all duration-1000" style={{ width: `${(state.timeLeft / 20) * 100}%` }} />
          </div>
          {state.myRole === "taupe" && <p className="text-xs text-red-400/40 text-center font-sans">🐀 Tu es la Taupe — sabote subtilement</p>}
          <h2 className="text-lg font-serif font-light text-white/90 text-center">{state.mission.question}</h2>

          {state.mission.type === "confiance" ? (
            <div className="flex gap-3">
              <button onClick={() => handleConfiance("contribuer")} disabled={submitted}
                className={cn("flex-1 rounded-lg border p-4 text-center font-sans transition-all", submitted ? "border-white/[0.04] text-white/30" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10")}>
                ✊ Contribuer
              </button>
              <button onClick={() => handleConfiance("saboter")} disabled={submitted}
                className={cn("flex-1 rounded-lg border p-4 text-center font-sans transition-all", submitted ? "border-white/[0.04] text-white/30" : "border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/10")}>
                💀 Saboter
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type={state.mission.type === "estimation" ? "number" : "text"}
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                disabled={submitted}
                placeholder={state.mission.type === "estimation" ? "Ton estimation..." : "Ta réponse..."}
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/80 font-sans placeholder:text-white/20 focus:outline-none focus:border-ember/30"
              />
              <button onClick={handleSubmit} disabled={submitted}
                className="rounded-lg bg-ember/80 px-6 py-3 text-sm font-sans text-white hover:bg-ember transition-colors disabled:opacity-30">
                OK
              </button>
            </div>
          )}
          {submitted && <p className="text-xs text-white/20 text-center font-sans">En attente des autres...</p>}
          <div className="flex gap-2 flex-wrap justify-center">
            {state.players.map(p => (
              <span key={p.id} className={cn("text-xs font-sans px-2 py-1 rounded", p.hasSubmitted ? "text-ember/60 bg-ember/5" : "text-white/20")}>
                {p.name} {p.hasSubmitted ? "✓" : "..."}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mission result
  if (state.status === "mission-result" && state.missionResult) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md text-center space-y-4">
          <span className="text-5xl">{state.missionResult.success ? "✅" : "❌"}</span>
          <h2 className={cn("text-2xl font-serif font-light", state.missionResult.success ? "text-emerald-300" : "text-red-300")}>
            {state.missionResult.success ? "Mission réussie !" : "Mission échouée"}
          </h2>
          <p className="text-sm text-white/60 font-sans">{state.missionResult.detail}</p>
          <p className="text-xs text-white/30 font-sans">Score d'équipe : {state.missionResult.teamScore}</p>
        </div>
      </div>
    );
  }

  // Vote phase
  if (state.status === "vote") {
    const others = state.players.filter(p => p.id !== playerId && !p.isEliminated);
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-light text-white/90">Qui est la Taupe ?</h2>
            <span className="text-sm font-mono text-ember">{state.timeLeft}s</span>
          </div>
          <div className="space-y-2">
            {others.map(p => (
              <button key={p.id} onClick={() => handleVote(p.id)} disabled={voted}
                className={cn("w-full rounded-lg border p-4 text-left font-sans transition-all flex items-center justify-between",
                  voted ? "border-white/[0.04] text-white/30" : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-red-500/30 hover:bg-red-500/5")}>
                <span>{p.name}</span>
                <span className="text-xs text-white/20">{p.score} pts</span>
              </button>
            ))}
          </div>
          {voted && <p className="text-xs text-white/20 text-center font-sans">Vote enregistré</p>}
        </div>
      </div>
    );
  }

  // Vote result
  if (state.status === "vote-result" && state.voteResults) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-xl font-serif font-light text-white/90 text-center">Résultats du vote</h2>
          {state.voteResults.map((v, i) => (
            <div key={v.playerId} className={cn("flex items-center justify-between rounded-lg border p-3 font-sans",
              i === 0 && v.votesReceived > 0 ? "border-red-500/30 bg-red-500/5" : "border-white/[0.06] bg-white/[0.03]")}>
              <span className="text-sm text-white/70">{v.playerName}</span>
              <span className="text-sm font-mono text-ember">{v.votesReceived} vote{v.votesReceived > 1 ? "s" : ""}</span>
            </div>
          ))}
          <p className="text-xs text-white/20 text-center font-sans">La Taupe survit... Prochaine mission !</p>
        </div>
      </div>
    );
  }

  // Game over
  if (state.status === "game-over") {
    const mole = state.players.find(p => p.id === state.eliminatedMoleId) ?? state.players.find(() => true);
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <div className="w-full max-w-md text-center space-y-4">
          <span className="text-5xl">{state.winner === "loyaux" ? "🎉" : "🐀"}</span>
          <h2 className="text-2xl font-serif font-light text-white/90">
            {state.winner === "loyaux" ? "Les Loyaux gagnent !" : "La Taupe gagne !"}
          </h2>
          {state.eliminatedMoleId && (
            <p className="text-sm text-white/40 font-sans">La Taupe était : {state.players.find(p => p.id === state.eliminatedMoleId)?.name}</p>
          )}
        </div>
      </div>
    );
  }

  return <div className="flex flex-1 items-center justify-center"><p className="text-white/40 animate-pulse font-sans">Chargement...</p></div>;
}
