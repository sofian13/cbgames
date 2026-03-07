"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

// ── Types ─────────────────────────────────────────────────
interface InfiltrePlayerState {
  id: string;
  name: string;
  score: number;
  isEliminated: boolean;
  hasClue: boolean;
  hasVoted: boolean;
  isInfiltre: boolean | null;
}

interface ClueEntry {
  playerId: string;
  playerName: string;
  clue: string;
  round: number;
}

interface VoteDetail {
  voterId: string;
  voterName: string;
  targetId: string;
}

interface InfiltreState {
  phase: "waiting" | "word-reveal" | "describe" | "vote" | "vote-result" | "guess-word" | "round-end" | "game-over";
  round: number;
  timeLeft: number;
  secretWord: string | null;
  myRole: "infiltre" | "civilian" | undefined;
  currentDescriberId: string | null;
  describeOrder: string[];
  eliminatedThisRound: string | null;
  eliminatedIsInfiltre: boolean | null;
  infiltreCount: number;
  voteTally: Record<string, number> | null;
  voteDetails: VoteDetail[] | null;
  lastGuess: string | null;
  lastGuessCorrect: boolean | null;
  clueHistory: ClueEntry[];
  players: InfiltrePlayerState[];
  infiltreIds?: string[];
}

// ══════════════════════════════════════════════════════════
export default function InfiltreGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "infiltre", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as InfiltreState;
  const clueKey = `${state?.round ?? 0}-${state?.phase === "describe" ? "describe" : state?.phase ?? "waiting"}`;
  const voteKey = `${state?.round ?? 0}-${state?.phase === "vote" ? "vote" : state?.phase ?? "waiting"}`;
  const guessKey = `${state?.round ?? 0}-${state?.phase === "guess-word" ? "guess-word" : state?.phase ?? "waiting"}`;
  const [clueInput, setClueInput] = useKeyedState<string>(clueKey, "");
  const [clueSubmitted, setClueSubmitted] = useKeyedState<boolean>(clueKey, false);
  const [voteTarget, setVoteTarget] = useKeyedState<string | null>(voteKey, null);
  const [voteSubmitted, setVoteSubmitted] = useKeyedState<boolean>(voteKey, false);
  const [guessInput, setGuessInput] = useKeyedState<string>(guessKey, "");
  const [guessSubmitted, setGuessSubmitted] = useKeyedState<boolean>(guessKey, false);
  const clueInputRef = useRef<HTMLInputElement>(null);
  const guessInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.phase === "describe") {
      setTimeout(() => clueInputRef.current?.focus(), 100);
    }
    if (state?.phase === "guess-word") {
      setTimeout(() => guessInputRef.current?.focus(), 100);
    }
  }, [state?.phase]);

  // ── Actions ─────────────────────────────────────────────
  const handleSubmitClue = useCallback(() => {
    const trimmed = clueInput.trim();
    if (!trimmed || clueSubmitted) return;
    setClueSubmitted(true);
    sendAction({ action: "describe", clue: trimmed });
  }, [clueInput, clueSubmitted, sendAction, setClueSubmitted]);

  const handleVote = useCallback(
    (targetId: string) => {
      if (voteSubmitted || targetId === playerId) return;
      setVoteTarget(targetId);
      setVoteSubmitted(true);
      sendAction({ action: "vote", targetId });
    },
    [playerId, sendAction, setVoteSubmitted, setVoteTarget, voteSubmitted]
  );

  const handleGuessWord = useCallback(() => {
    const trimmed = guessInput.trim();
    if (!trimmed || guessSubmitted) return;
    setGuessSubmitted(true);
    sendAction({ action: "guess-word", word: trimmed });
  }, [guessInput, guessSubmitted, sendAction, setGuessSubmitted]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, handler: () => void) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handler();
      }
    },
    []
  );

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(101,223,178,0.06), transparent 40%), #060606",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-sm"
            style={{ boxShadow: "0 0 40px rgba(101,223,178,0.1)" }}
          >
            <span className="text-4xl">🕵️</span>
          </div>
          <p className="text-white/40 animate-pulse font-sans text-lg">
            En attente des joueurs...
          </p>
        </div>
      </div>
    );
  }

  const alivePlayers = state.players?.filter((p) => !p.isEliminated) ?? [];
  const isMyTurn = state.currentDescriberId === playerId;
  const isInfiltre = state.myRole === "infiltre";

  // ── WORD REVEAL ─────────────────────────────────────────
  if (state.phase === "word-reveal") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 relative"
        style={{
          background: isInfiltre
            ? "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.1), transparent 40%), #060606"
            : "radial-gradient(circle at 50% 25%, rgba(59,130,246,0.1), transparent 40%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-8">
          Manche {state.round}
        </span>

        {isInfiltre ? (
          <div className="text-center">
            <div
              className="inline-flex items-center gap-4 rounded-3xl border border-red-500/25 bg-black/30 backdrop-blur-sm px-8 py-5 mb-8"
              style={{ boxShadow: "0 0 20px rgba(239,68,68,0.15)" }}
            >
              <span className="text-5xl">🕵️</span>
              <div className="text-left">
                <p className="text-red-400 font-serif text-2xl font-semibold">
                  Tu es l&apos;Infiltr&eacute; !
                </p>
                <p className="text-red-400/40 text-sm font-sans mt-1">
                  Devine le mot secret en &eacute;coutant les autres
                </p>
              </div>
            </div>
            <div className="mt-6">
              <p
                className="text-7xl font-serif font-semibold text-red-400/60 tracking-widest"
                style={{ textShadow: "0 0 60px rgba(239,68,68,0.25)" }}
              >
                ???
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-blue-400/50 font-sans mb-4 uppercase tracking-[0.15em]">
              Le mot secret est
            </p>
            <p
              className="text-5xl md:text-7xl font-serif font-semibold text-white/90 tracking-wide"
              style={{ textShadow: "0 0 80px rgba(59,130,246,0.15), 0 0 40px rgba(255,255,255,0.05)" }}
            >
              {state.secretWord}
            </p>
            <div
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-2xl border border-blue-500/25 bg-black/30 backdrop-blur-sm"
              style={{ boxShadow: "0 0 20px rgba(59,130,246,0.1)" }}
            >
              <span className="text-blue-400/90 text-sm font-sans">
                Tu es un Civil — ne sois pas trop explicite !
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <p className="text-xs text-white/25 font-sans">
            {state.infiltreCount} infiltr&eacute;{state.infiltreCount > 1 ? "s" : ""} parmi {state.players?.length} joueurs
          </p>
        </div>
      </div>
    );
  }

  // ── DESCRIBE ────────────────────────────────────────────
  if (state.phase === "describe") {
    const currentDescriber = state.players?.find((p) => p.id === state.currentDescriberId);
    const currentRoundClues = state.clueHistory?.filter((c) => c.round === state.round) ?? [];

    return (
      <div
        className="flex flex-1 flex-col p-4 md:p-6"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(0,200,255,0.06), transparent 40%), #060606",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/25 font-sans tracking-wide">Manche {state.round}</span>
            <span className={cn(
              "text-[10px] px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider",
              isInfiltre
                ? "text-red-400 bg-red-500/10 border-red-500/25"
                : "text-blue-400 bg-blue-500/10 border-blue-500/25"
            )}>
              {isInfiltre ? "Infiltr\u00e9" : "Civil"}
            </span>
          </div>
          <span className={cn(
            "text-lg font-mono font-bold",
            (state.timeLeft ?? 0) <= 5 ? "text-red-400 animate-pulse" : "text-white/40"
          )}
          style={(state.timeLeft ?? 0) <= 5 ? { textShadow: "0 0 20px rgba(239,68,68,0.25)" } : undefined}
          >
            {state.timeLeft}s
          </span>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-6">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              (state.timeLeft ?? 0) <= 5 ? "bg-red-500" : "bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a]"
            )}
            style={{
              width: `${((state.timeLeft ?? 0) / 20) * 100}%`,
              boxShadow: (state.timeLeft ?? 0) <= 5
                ? "0 0 12px rgba(239,68,68,0.4)"
                : "0 0 12px rgba(101,223,178,0.3)",
            }}
          />
        </div>

        {/* Current describer */}
        <div className="text-center mb-6">
          {isMyTurn ? (
            <div>
              <p className="text-sm text-cyan-400/80 font-sans uppercase tracking-[0.15em] mb-2 font-semibold">
                C&apos;est ton tour !
              </p>
              <p className="text-sm text-white/40 font-sans mb-5">
                Donne un indice pour prouver que tu connais le mot
                {isInfiltre && " (sans te faire griller)"}
              </p>
              {!clueSubmitted ? (
                <div className="flex gap-3 max-w-md mx-auto">
                  <input
                    ref={clueInputRef}
                    type="text"
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSubmitClue)}
                    placeholder="Ton indice..."
                    autoFocus
                    autoComplete="off"
                    maxLength={50}
                    className="flex-1 rounded-2xl border border-white/25 bg-black/30 px-5 py-3.5 font-mono text-lg text-white/90 placeholder:text-white/25 outline-none backdrop-blur-sm transition-all focus:border-cyan-500/50 focus:bg-black/40"
                    style={{ boxShadow: "0 0 20px rgba(0,200,255,0.05)" }}
                  />
                  <button
                    onClick={handleSubmitClue}
                    disabled={!clueInput.trim()}
                    className={cn(
                      "px-7 py-3.5 rounded-2xl font-sans text-sm font-semibold transition-all",
                      clueInput.trim()
                        ? "bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] text-black hover:brightness-110"
                        : "bg-white/[0.06] text-white/20"
                    )}
                    style={clueInput.trim() ? { boxShadow: "0 0 20px rgba(101,223,178,0.25)" } : undefined}
                  >
                    Envoyer
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-5 py-4 max-w-md mx-auto"
                  style={{ boxShadow: "0 0 20px rgba(101,223,178,0.1)" }}
                >
                  <p className="text-sm text-white/40 font-sans">Indice envoy&eacute; !</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs text-white/25 font-sans uppercase tracking-[0.15em] mb-2">
                Au tour de
              </p>
              <p
                className="text-3xl font-serif font-semibold text-white/90"
                style={{ textShadow: "0 0 30px rgba(0,200,255,0.1)" }}
              >
                {currentDescriber?.name ?? "..."}
              </p>
              <p className="text-xs text-white/25 font-sans mt-2 animate-pulse">
                En attente de son indice...
              </p>
            </div>
          )}
        </div>

        {/* Clue history */}
        {currentRoundClues.length > 0 && (
          <div className="w-full max-w-lg mx-auto mb-6">
            <p className="text-[10px] text-white/25 font-sans uppercase tracking-[0.2em] mb-3">
              Indices donn&eacute;s
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentRoundClues.map((c, i) => (
                <div
                  key={`${c.playerId}-${i}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm px-4 py-3"
                >
                  <span className="text-xs text-white/40 font-sans shrink-0 font-medium">
                    {c.playerName}{c.playerId === playerId ? " (toi)" : ""}
                  </span>
                  <span className="text-sm text-white/70 font-sans">
                    {c.clue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player cards */}
        <div className="mt-auto">
          <div className="flex flex-wrap justify-center gap-2.5">
            {state.describeOrder?.map((pid) => {
              const p = state.players?.find((pl) => pl.id === pid);
              if (!p) return null;
              const isCurrent = pid === state.currentDescriberId;
              const hasGone = p.hasClue;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border p-3 min-w-[85px] transition-all backdrop-blur-sm",
                    p.isEliminated && "opacity-30",
                    isCurrent && "border-cyan-500/40 bg-cyan-500/10",
                    !isCurrent && hasGone && "border-white/10 bg-black/30",
                    !isCurrent && !hasGone && "border-white/[0.06] bg-black/20"
                  )}
                  style={isCurrent ? { boxShadow: "0 0 20px rgba(0,200,255,0.15)" } : undefined}
                >
                  <span className={cn(
                    "text-xs font-semibold truncate max-w-[70px] font-sans",
                    isCurrent ? "text-cyan-400" : "text-white/40"
                  )}>
                    {p.name}{p.id === playerId && " (toi)"}
                  </span>
                  <span className="text-[10px] text-white/25 font-sans">
                    {p.isEliminated
                      ? "\u00c9limin\u00e9"
                      : hasGone
                        ? "Fait"
                        : isCurrent
                          ? "Parle..."
                          : "En attente"}
                  </span>
                  <span className="text-xs text-cyan-400/70 font-mono font-bold">{p.score} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── VOTE ────────────────────────────────────────────────
  if (state.phase === "vote") {
    const currentRoundClues = state.clueHistory?.filter((c) => c.round === state.round) ?? [];

    return (
      <div
        className="flex flex-1 flex-col p-4 md:p-6"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.08), transparent 40%), #060606",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/25 font-sans tracking-wide">Vote — Manche {state.round}</span>
            <span className={cn(
              "text-[10px] px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider",
              isInfiltre
                ? "text-red-400 bg-red-500/10 border-red-500/25"
                : "text-blue-400 bg-blue-500/10 border-blue-500/25"
            )}>
              {isInfiltre ? "Infiltr\u00e9" : "Civil"}
            </span>
          </div>
          <span className={cn(
            "text-lg font-mono font-bold",
            (state.timeLeft ?? 0) <= 10 ? "text-red-400 animate-pulse" : "text-white/40"
          )}
          style={(state.timeLeft ?? 0) <= 10 ? { textShadow: "0 0 20px rgba(239,68,68,0.25)" } : undefined}
          >
            {state.timeLeft}s
          </span>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-6">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              (state.timeLeft ?? 0) <= 10 ? "bg-red-500" : "bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a]"
            )}
            style={{
              width: `${((state.timeLeft ?? 0) / 30) * 100}%`,
              boxShadow: (state.timeLeft ?? 0) <= 10
                ? "0 0 12px rgba(239,68,68,0.4)"
                : "0 0 12px rgba(101,223,178,0.3)",
            }}
          />
        </div>

        <div className="text-center mb-6">
          <p
            className="text-3xl font-serif font-semibold text-white/90 mb-2"
            style={{ textShadow: "0 0 30px rgba(239,68,68,0.1)" }}
          >
            Qui est l&apos;infiltr&eacute; ?
          </p>
          <p className="text-sm text-white/40 font-sans">
            Vote pour le joueur que tu suspectes
          </p>
        </div>

        {/* Clue summary */}
        {currentRoundClues.length > 0 && (
          <div className="w-full max-w-lg mx-auto mb-6">
            <p className="text-[10px] text-white/25 font-sans uppercase tracking-[0.2em] mb-3">
              Rappel des indices
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {currentRoundClues.map((c, i) => (
                <div
                  key={`${c.playerId}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm px-4 py-2.5"
                >
                  <span className="text-[10px] text-white/40 font-sans shrink-0 font-medium">{c.playerName}</span>
                  <span className="text-xs text-white/60 font-sans">{c.clue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Votable player cards */}
        <div className="w-full max-w-lg mx-auto">
          {!voteSubmitted ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {alivePlayers
                .filter((p) => p.id !== playerId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleVote(p.id)}
                    className="flex flex-col items-center gap-2 rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-5 transition-all cursor-pointer hover:border-red-500/40 hover:bg-red-500/10 hover:scale-[1.03] active:scale-[0.98]"
                    style={{ boxShadow: "0 0 15px rgba(255,255,255,0.02)" }}
                  >
                    <span className="text-sm font-sans font-semibold text-white/90">{p.name}</span>
                    <span className="text-xs text-white/25 font-mono">{p.score} pts</span>
                  </button>
                ))}
            </div>
          ) : (
            <div className="text-center">
              <div
                className="inline-flex items-center gap-2 px-6 py-4 rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm"
                style={{ boxShadow: "0 0 20px rgba(239,68,68,0.1)" }}
              >
                <span className="text-sm text-white/40 font-sans">
                  Vote envoy&eacute; pour{" "}
                  <span className="text-white/90 font-semibold">
                    {state.players?.find((p) => p.id === voteTarget)?.name}
                  </span>
                </span>
              </div>
              <p className="text-xs text-white/25 font-sans mt-4 animate-pulse">
                En attente des autres votes...
              </p>
            </div>
          )}
        </div>

        {/* Vote progress */}
        <div className="flex flex-wrap justify-center gap-2.5 mt-auto pt-4">
          {alivePlayers.map((p) => (
            <div
              key={p.id}
              className={cn(
                "text-center px-4 py-2 rounded-2xl border transition-all backdrop-blur-sm",
                p.hasVoted
                  ? "border-white/25 bg-black/30"
                  : "border-white/[0.06] bg-black/15"
              )}
              style={p.hasVoted ? { boxShadow: "0 0 12px rgba(255,255,255,0.03)" } : undefined}
            >
              <span className="text-[10px] text-white/40 font-sans font-medium">{p.name}</span>
              <p className="text-[10px] text-white/25 font-sans">
                {p.hasVoted ? "A vot\u00e9" : "..."}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── VOTE RESULT ─────────────────────────────────────────
  if (state.phase === "vote-result") {
    const eliminated = state.players?.find((p) => p.id === state.eliminatedThisRound);

    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{
          background: state.eliminatedIsInfiltre
            ? "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.1), transparent 40%), #060606"
            : "radial-gradient(circle at 50% 25%, rgba(59,130,246,0.08), transparent 40%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-8">
          R&eacute;sultat du vote — Manche {state.round}
        </span>

        {eliminated ? (
          <div className="text-center mb-8">
            <p
              className="text-4xl font-serif font-semibold text-white/90 mb-4"
              style={{ textShadow: "0 0 40px rgba(255,255,255,0.1)" }}
            >
              {eliminated.name} est &eacute;limin&eacute; !
            </p>
            {state.eliminatedIsInfiltre !== null && (
              <div className={cn(
                "inline-flex items-center gap-3 px-6 py-3 rounded-3xl border backdrop-blur-sm",
                state.eliminatedIsInfiltre
                  ? "border-red-500/25 bg-red-500/10"
                  : "border-blue-500/25 bg-blue-500/10"
              )}
              style={{
                boxShadow: state.eliminatedIsInfiltre
                  ? "0 0 20px rgba(239,68,68,0.15)"
                  : "0 0 20px rgba(59,130,246,0.15)",
              }}
              >
                {state.eliminatedIsInfiltre ? (
                  <span className="text-red-400 font-sans text-sm font-semibold">
                    🕵️ C&apos;&eacute;tait un Infiltr&eacute; !
                  </span>
                ) : (
                  <span className="text-blue-400 font-sans text-sm font-semibold">
                    C&apos;&eacute;tait un Civil innocent...
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center mb-8">
            <p
              className="text-3xl font-serif font-semibold text-white/40"
              style={{ textShadow: "0 0 30px rgba(255,255,255,0.05)" }}
            >
              &Eacute;galit&eacute; — personne n&apos;est &eacute;limin&eacute;
            </p>
          </div>
        )}

        {/* Vote details */}
        {state.voteDetails && state.voteDetails.length > 0 && (
          <div className="w-full max-w-sm space-y-2 mb-6">
            {state.voteDetails.map((v, i) => {
              const target = state.players?.find((p) => p.id === v.targetId);
              return (
                <div
                  key={`${v.voterId}-${i}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm px-4 py-3"
                >
                  <span className="text-xs text-white/40 font-sans font-medium">{v.voterName}</span>
                  <span className="text-xs text-white/25 font-sans">{"\u2192"}</span>
                  <span className={cn(
                    "text-xs font-sans font-semibold",
                    v.targetId === state.eliminatedThisRound ? "text-red-400" : "text-white/40"
                  )}>
                    {target?.name ?? "?"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {state.eliminatedIsInfiltre && (
          <p
            className="text-sm text-cyan-400/60 font-sans animate-pulse font-medium"
            style={{ textShadow: "0 0 20px rgba(0,200,255,0.15)" }}
          >
            L&apos;infiltr&eacute; va tenter de deviner le mot...
          </p>
        )}
      </div>
    );
  }

  // ── GUESS WORD ──────────────────────────────────────────
  if (state.phase === "guess-word") {
    const isGuesser = playerId === state.eliminatedThisRound;

    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 relative"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.12), transparent 40%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-3">
          Derni&egrave;re chance
        </span>

        <span
          className={cn(
            "text-4xl font-mono font-bold mb-8",
            (state.timeLeft ?? 0) <= 5 ? "text-red-400 animate-pulse" : "text-red-400/60"
          )}
          style={{ textShadow: "0 0 20px rgba(239,68,68,0.25)" }}
        >
          {state.timeLeft}s
        </span>

        {isGuesser ? (
          <div className="text-center w-full max-w-md">
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-3xl border border-red-500/25 bg-black/30 backdrop-blur-sm mb-8"
              style={{ boxShadow: "0 0 20px rgba(239,68,68,0.15)" }}
            >
              <span className="text-red-400 text-sm font-sans font-semibold">
                🕵️ Tu as &eacute;t&eacute; d&eacute;masqu&eacute; ! Devine le mot pour gagner.
              </span>
            </div>

            {/* Clue history as hint */}
            {state.clueHistory && state.clueHistory.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] text-white/25 font-sans uppercase tracking-[0.2em] mb-3">
                  Indices donn&eacute;s pendant la partie
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {state.clueHistory.map((c, i) => (
                    <div
                      key={`${c.playerId}-${c.round}-${i}`}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm px-4 py-2.5"
                    >
                      <span className="text-[10px] text-white/25 font-mono font-bold">M{c.round}</span>
                      <span className="text-[10px] text-white/40 font-sans shrink-0 font-medium">{c.playerName}</span>
                      <span className="text-xs text-white/60 font-sans">{c.clue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!guessSubmitted ? (
              <div className="flex gap-3">
                <input
                  ref={guessInputRef}
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleGuessWord)}
                  placeholder="Le mot secret est..."
                  autoFocus
                  autoComplete="off"
                  className="flex-1 rounded-2xl border border-red-500/25 bg-black/30 px-5 py-3.5 font-mono text-lg text-white/90 placeholder:text-white/25 outline-none backdrop-blur-sm transition-all focus:border-red-500/50 focus:bg-black/40"
                  style={{ boxShadow: "0 0 20px rgba(239,68,68,0.08)" }}
                />
                <button
                  onClick={handleGuessWord}
                  disabled={!guessInput.trim()}
                  className={cn(
                    "px-7 py-3.5 rounded-2xl font-sans text-sm font-semibold transition-all",
                    guessInput.trim()
                      ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:brightness-110"
                      : "bg-white/[0.06] text-white/20"
                  )}
                  style={guessInput.trim() ? { boxShadow: "0 0 20px rgba(239,68,68,0.25)" } : undefined}
                >
                  Deviner
                </button>
              </div>
            ) : (
              <div
                className="rounded-3xl border border-red-500/25 bg-black/30 backdrop-blur-sm px-5 py-4"
                style={{ boxShadow: "0 0 20px rgba(239,68,68,0.1)" }}
              >
                <p className="text-sm text-red-400/60 font-sans">R&eacute;ponse envoy&eacute;e...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p
              className="text-3xl font-serif font-semibold text-white/90 mb-3"
              style={{ textShadow: "0 0 30px rgba(239,68,68,0.1)" }}
            >
              L&apos;infiltr&eacute; tente de deviner le mot...
            </p>
            <p className="text-sm text-white/25 font-sans animate-pulse">
              S&apos;il trouve, il gagne !
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── ROUND END ───────────────────────────────────────────
  if (state.phase === "round-end") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{
          background: state.lastGuessCorrect
            ? "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.12), transparent 40%), #060606"
            : "radial-gradient(circle at 50% 25%, rgba(59,130,246,0.1), transparent 40%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-8">
          R&eacute;sultat final
        </span>

        {state.lastGuessCorrect === true && (
          <div className="text-center mb-6">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/25 bg-black/30 backdrop-blur-sm"
              style={{ boxShadow: "0 0 40px rgba(239,68,68,0.2)" }}
            >
              <span className="text-4xl">🕵️</span>
            </div>
            <p
              className="text-4xl font-serif font-semibold text-red-400 mb-3"
              style={{ textShadow: "0 0 40px rgba(239,68,68,0.3)" }}
            >
              L&apos;infiltr&eacute; a devin&eacute; le mot !
            </p>
            <p className="text-white/40 font-sans text-sm">
              Le mot &eacute;tait : <span className="text-white/90 font-serif font-semibold">{state.secretWord}</span>
            </p>
            {state.lastGuess && (
              <p className="text-xs text-red-400/40 font-sans mt-3">
                Sa r&eacute;ponse : &laquo;{state.lastGuess}&raquo;
              </p>
            )}
          </div>
        )}

        {state.lastGuessCorrect === false && (
          <div className="text-center mb-6">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-blue-500/25 bg-black/30 backdrop-blur-sm"
              style={{ boxShadow: "0 0 40px rgba(59,130,246,0.2)" }}
            >
              <span className="text-4xl">🎉</span>
            </div>
            <p
              className="text-4xl font-serif font-semibold text-blue-400 mb-3"
              style={{ textShadow: "0 0 40px rgba(59,130,246,0.3)" }}
            >
              Les civils gagnent !
            </p>
            <p className="text-white/40 font-sans text-sm">
              Le mot &eacute;tait : <span className="text-white/90 font-serif font-semibold">{state.secretWord}</span>
            </p>
            {state.lastGuess && (
              <p className="text-xs text-red-400/40 font-sans mt-3">
                L&apos;infiltr&eacute; a r&eacute;pondu : &laquo;{state.lastGuess}&raquo;
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-white/25 font-sans animate-pulse">
          Fin de la partie...
        </p>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    const sortedPlayers = [...(state.players ?? [])].sort((a, b) => b.score - a.score);
    const infiltreNames = state.players
      ?.filter((p) => p.isInfiltre === true)
      .map((p) => p.name) ?? [];

    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(101,223,178,0.08), transparent 40%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-4">
          Partie termin&eacute;e
        </span>

        {/* Full reveal */}
        <div className="text-center mb-8">
          <p className="text-lg font-sans text-white/40 mb-3">
            Le mot secret &eacute;tait
          </p>
          <p
            className="text-5xl font-serif font-semibold text-white/90 mb-5"
            style={{ textShadow: "0 0 40px rgba(101,223,178,0.15)" }}
          >
            {state.secretWord}
          </p>
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-3xl border border-red-500/25 bg-black/30 backdrop-blur-sm"
            style={{ boxShadow: "0 0 20px rgba(239,68,68,0.15)" }}
          >
            <span className="text-red-400 text-sm font-sans font-semibold">
              🕵️ {infiltreNames.length > 1 ? "Les infiltr\u00e9s \u00e9taient" : "L\u2019infiltr\u00e9 \u00e9tait"} : {infiltreNames.join(", ")}
            </span>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="w-full max-w-sm space-y-2.5">
          {sortedPlayers.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between rounded-3xl border p-4 transition-all backdrop-blur-sm",
                i === 0 && "border-cyan-500/30 bg-cyan-500/10",
                i > 0 && "border-white/10 bg-black/30",
                p.isEliminated && "opacity-60"
              )}
              style={i === 0 ? { boxShadow: "0 0 20px rgba(0,200,255,0.15)" } : undefined}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-xl font-mono font-bold w-8",
                  i === 0 ? "text-cyan-400" : "text-white/25"
                )}>
                  #{i + 1}
                </span>
                <div>
                  <span className={cn(
                    "text-sm font-sans font-semibold",
                    i === 0 ? "text-white/90" : "text-white/40"
                  )}>
                    {p.name}{p.id === playerId && " (toi)"}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {p.isInfiltre === true && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-500/25 bg-red-500/10 text-red-400 font-sans font-semibold">
                        Infiltr&eacute;
                      </span>
                    )}
                    {p.isInfiltre === false && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-blue-400 font-sans font-semibold">
                        Civil
                      </span>
                    )}
                    {p.isEliminated && (
                      <span className="text-[10px] text-white/25 font-sans line-through">
                        &Eacute;limin&eacute;
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  "text-xl font-mono font-bold",
                  i === 0 ? "text-cyan-400" : "text-white/40"
                )}
                style={i === 0 ? { textShadow: "0 0 15px rgba(0,200,255,0.3)" } : undefined}
              >
                {p.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── FALLBACK ────────────────────────────────────────────
  return (
    <div
      className="flex flex-1 items-center justify-center"
      style={{
        background: "radial-gradient(circle at 50% 25%, rgba(101,223,178,0.06), transparent 40%), #060606",
      }}
    >
      {error && <p className="text-sm text-red-400 font-sans font-semibold">{error}</p>}
      {!error && (
        <p className="text-white/40 animate-pulse font-sans text-lg">Chargement...</p>
      )}
    </div>
  );
}
