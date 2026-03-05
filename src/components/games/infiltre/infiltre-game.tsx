"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

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

  const [clueInput, setClueInput] = useState("");
  const [clueSubmitted, setClueSubmitted] = useState(false);
  const [voteTarget, setVoteTarget] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [guessInput, setGuessInput] = useState("");
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const prevRoundRef = useRef(0);
  const prevPhaseRef = useRef("");
  const clueInputRef = useRef<HTMLInputElement>(null);
  const guessInputRef = useRef<HTMLInputElement>(null);

  const state = gameState as unknown as InfiltreState;

  // Reset local state on round / phase transitions
  useEffect(() => {
    if (!state) return;
    const round = state.round ?? 0;
    const phase = state.phase ?? "";

    if (round !== prevRoundRef.current) {
      prevRoundRef.current = round;
      setClueInput("");
      setClueSubmitted(false);
      setVoteTarget(null);
      setVoteSubmitted(false);
      setGuessInput("");
      setGuessSubmitted(false);
    }

    if (phase !== prevPhaseRef.current) {
      prevPhaseRef.current = phase;
      if (phase === "describe") {
        setClueInput("");
        setClueSubmitted(false);
        setTimeout(() => clueInputRef.current?.focus(), 100);
      }
      if (phase === "vote") {
        setVoteTarget(null);
        setVoteSubmitted(false);
      }
      if (phase === "guess-word") {
        setGuessInput("");
        setGuessSubmitted(false);
        setTimeout(() => guessInputRef.current?.focus(), 100);
      }
    }
  }, [state?.round, state?.phase, state]);

  // ── Actions ─────────────────────────────────────────────
  const handleSubmitClue = useCallback(() => {
    const trimmed = clueInput.trim();
    if (!trimmed || clueSubmitted) return;
    setClueSubmitted(true);
    sendAction({ action: "describe", clue: trimmed });
  }, [clueInput, clueSubmitted, sendAction]);

  const handleVote = useCallback(
    (targetId: string) => {
      if (voteSubmitted || targetId === playerId) return;
      setVoteTarget(targetId);
      setVoteSubmitted(true);
      sendAction({ action: "vote", targetId });
    },
    [voteSubmitted, playerId, sendAction]
  );

  const handleGuessWord = useCallback(() => {
    const trimmed = guessInput.trim();
    if (!trimmed || guessSubmitted) return;
    setGuessSubmitted(true);
    sendAction({ action: "guess-word", word: trimmed });
  }, [guessInput, guessSubmitted, sendAction]);

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
      <div className="flex flex-1 items-center justify-center" style={{ background: "#060606" }}>
        <div className="text-center">
          <p className="text-3xl mb-4">🕵️</p>
          <p className="text-white/40 animate-pulse font-sans">
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
        style={{ background: "#060606" }}
      >
        <span className="text-xs text-white/20 font-sans uppercase tracking-wider mb-8">
          Manche {state.round}
        </span>

        {isInfiltre ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-red-500/20 bg-red-500/5 mb-6">
              <span className="text-4xl">🕵️</span>
              <div className="text-left">
                <p className="text-red-400 font-serif text-xl font-light">
                  Tu es l&apos;Infiltr&eacute; !
                </p>
                <p className="text-red-400/50 text-xs font-sans mt-1">
                  Devine le mot secret en &eacute;coutant les autres
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p
                className="text-6xl font-serif font-light text-red-400/60 tracking-widest"
                style={{ textShadow: "0 0 60px rgba(239,68,68,0.2)" }}
              >
                ???
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs text-blue-400/60 font-sans mb-3 uppercase tracking-wider">
              Le mot secret est
            </p>
            <p
              className="text-5xl md:text-7xl font-serif font-light text-white/90 tracking-wide"
              style={{ textShadow: "0 0 80px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.05)" }}
            >
              {state.secretWord}
            </p>
            <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <span className="text-blue-400 text-xs font-sans">
                Tu es un Civil — ne sois pas trop explicite !
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <p className="text-xs text-white/20 font-sans">
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
      <div className="flex flex-1 flex-col p-4 md:p-6" style={{ background: "#060606" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/20 font-sans">Manche {state.round}</span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-sans font-medium",
              isInfiltre
                ? "text-red-400 bg-red-500/10 border-red-500/20"
                : "text-blue-400 bg-blue-500/10 border-blue-500/20"
            )}>
              {isInfiltre ? "Infiltr\u00e9" : "Civil"}
            </span>
          </div>
          <span className={cn(
            "text-sm font-mono font-bold",
            (state.timeLeft ?? 0) <= 5 ? "text-red-400" : "text-white/40"
          )}>
            {state.timeLeft}s
          </span>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden mb-6">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              (state.timeLeft ?? 0) <= 5 ? "bg-red-500" : "bg-white/20"
            )}
            style={{ width: `${((state.timeLeft ?? 0) / 20) * 100}%` }}
          />
        </div>

        {/* Current describer */}
        <div className="text-center mb-6">
          {isMyTurn ? (
            <div>
              <p className="text-xs text-cyan-400/60 font-sans uppercase tracking-wider mb-2">
                C&apos;est ton tour !
              </p>
              <p className="text-sm text-white/50 font-sans mb-4">
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
                    className="flex-1 px-4 py-3 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
                  />
                  <button
                    onClick={handleSubmitClue}
                    disabled={!clueInput.trim()}
                    className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-cyan-500 disabled:bg-white/[0.06] disabled:text-white/20 text-white font-sans text-sm font-medium transition-all"
                  >
                    Envoyer
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.03] max-w-md mx-auto">
                  <p className="text-sm text-white/50 font-sans">Indice envoy&eacute; !</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs text-white/30 font-sans uppercase tracking-wider mb-1">
                Au tour de
              </p>
              <p className="text-xl font-serif font-light text-white/80">
                {currentDescriber?.name ?? "..."}
              </p>
              <p className="text-xs text-white/20 font-sans mt-1 animate-pulse">
                En attente de son indice...
              </p>
            </div>
          )}
        </div>

        {/* Clue history */}
        {currentRoundClues.length > 0 && (
          <div className="w-full max-w-lg mx-auto mb-6">
            <p className="text-[10px] text-white/20 font-sans uppercase tracking-wider mb-2">
              Indices donn&eacute;s
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {currentRoundClues.map((c, i) => (
                <div
                  key={`${c.playerId}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                >
                  <span className="text-xs text-white/40 font-sans shrink-0">
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
          <div className="flex flex-wrap justify-center gap-2">
            {state.describeOrder?.map((pid) => {
              const p = state.players?.find((pl) => pl.id === pid);
              if (!p) return null;
              const isCurrent = pid === state.currentDescriberId;
              const hasGone = p.hasClue;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2.5 min-w-[80px] transition-all",
                    p.isEliminated && "opacity-30",
                    isCurrent && "border-cyan-500/40 bg-cyan-500/5 ring-1 ring-cyan-500/20",
                    !isCurrent && hasGone && "border-white/[0.08] bg-white/[0.04]",
                    !isCurrent && !hasGone && "border-white/[0.06] bg-white/[0.02]"
                  )}
                >
                  <span className={cn(
                    "text-xs font-medium truncate max-w-[70px] font-sans",
                    isCurrent ? "text-cyan-400" : "text-white/50"
                  )}>
                    {p.name}{p.id === playerId && " (toi)"}
                  </span>
                  <span className="text-[10px] text-white/20 font-sans">
                    {p.isEliminated
                      ? "\u00c9limin\u00e9"
                      : hasGone
                        ? "Fait"
                        : isCurrent
                          ? "Parle..."
                          : "En attente"}
                  </span>
                  <span className="text-xs text-cyan-400/80 font-mono">{p.score} pts</span>
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
      <div className="flex flex-1 flex-col p-4 md:p-6" style={{ background: "#060606" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/20 font-sans">Vote — Manche {state.round}</span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-sans font-medium",
              isInfiltre
                ? "text-red-400 bg-red-500/10 border-red-500/20"
                : "text-blue-400 bg-blue-500/10 border-blue-500/20"
            )}>
              {isInfiltre ? "Infiltr\u00e9" : "Civil"}
            </span>
          </div>
          <span className={cn(
            "text-sm font-mono font-bold",
            (state.timeLeft ?? 0) <= 10 ? "text-red-400" : "text-white/40"
          )}>
            {state.timeLeft}s
          </span>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden mb-6">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              (state.timeLeft ?? 0) <= 10 ? "bg-red-500" : "bg-white/20"
            )}
            style={{ width: `${((state.timeLeft ?? 0) / 30) * 100}%` }}
          />
        </div>

        <div className="text-center mb-6">
          <p className="text-lg font-serif font-light text-white/80 mb-1">
            Qui est l&apos;infiltr&eacute; ?
          </p>
          <p className="text-xs text-white/30 font-sans">
            Vote pour le joueur que tu suspectes
          </p>
        </div>

        {/* Clue summary */}
        {currentRoundClues.length > 0 && (
          <div className="w-full max-w-lg mx-auto mb-6">
            <p className="text-[10px] text-white/20 font-sans uppercase tracking-wider mb-2">
              Rappel des indices
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {currentRoundClues.map((c, i) => (
                <div
                  key={`${c.playerId}-${i}`}
                  className="flex items-center gap-3 rounded border border-white/[0.04] bg-white/[0.02] px-3 py-1.5"
                >
                  <span className="text-[10px] text-white/30 font-sans shrink-0">{c.playerName}</span>
                  <span className="text-xs text-white/50 font-sans">{c.clue}</span>
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
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-all cursor-pointer border-white/[0.06] bg-white/[0.03] hover:border-red-500/30 hover:bg-red-500/5"
                  >
                    <span className="text-sm font-sans text-white/70">{p.name}</span>
                    <span className="text-xs text-white/20 font-sans">{p.score} pts</span>
                  </button>
                ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                <span className="text-sm text-white/50 font-sans">
                  Vote envoy&eacute; pour{" "}
                  <span className="text-white/70">
                    {state.players?.find((p) => p.id === voteTarget)?.name}
                  </span>
                </span>
              </div>
              <p className="text-xs text-white/20 font-sans mt-3 animate-pulse">
                En attente des autres votes...
              </p>
            </div>
          )}
        </div>

        {/* Vote progress */}
        <div className="flex flex-wrap justify-center gap-2 mt-auto pt-4">
          {alivePlayers.map((p) => (
            <div
              key={p.id}
              className={cn(
                "text-center px-3 py-1.5 rounded border transition-all",
                p.hasVoted
                  ? "border-white/[0.12] bg-white/[0.05]"
                  : "border-white/[0.04] bg-white/[0.02]"
              )}
            >
              <span className="text-[10px] text-white/40 font-sans">{p.name}</span>
              <p className="text-[10px] text-white/20 font-sans">
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
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <span className="text-xs text-white/20 font-sans uppercase tracking-wider mb-6">
          R&eacute;sultat du vote — Manche {state.round}
        </span>

        {eliminated ? (
          <div className="text-center mb-8">
            <p className="text-2xl font-serif font-light text-white/80 mb-3">
              {eliminated.name} est &eacute;limin&eacute; !
            </p>
            {state.eliminatedIsInfiltre !== null && (
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg border",
                state.eliminatedIsInfiltre
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-blue-500/20 bg-blue-500/5"
              )}>
                {state.eliminatedIsInfiltre ? (
                  <span className="text-red-400 font-sans text-sm">
                    🕵️ C&apos;&eacute;tait un Infiltr&eacute; !
                  </span>
                ) : (
                  <span className="text-blue-400 font-sans text-sm">
                    C&apos;&eacute;tait un Civil innocent...
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center mb-8">
            <p className="text-xl font-serif font-light text-white/60">
              &Eacute;galit&eacute; — personne n&apos;est &eacute;limin&eacute;
            </p>
          </div>
        )}

        {/* Vote details */}
        {state.voteDetails && state.voteDetails.length > 0 && (
          <div className="w-full max-w-sm space-y-1.5 mb-6">
            {state.voteDetails.map((v, i) => {
              const target = state.players?.find((p) => p.id === v.targetId);
              return (
                <div
                  key={`${v.voterId}-${i}`}
                  className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                >
                  <span className="text-xs text-white/40 font-sans">{v.voterName}</span>
                  <span className="text-xs text-white/20 font-sans">{"\u2192"}</span>
                  <span className={cn(
                    "text-xs font-sans",
                    v.targetId === state.eliminatedThisRound ? "text-red-400" : "text-white/50"
                  )}>
                    {target?.name ?? "?"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {state.eliminatedIsInfiltre && (
          <p className="text-xs text-cyan-400/60 font-sans animate-pulse">
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
          background: "radial-gradient(ellipse at center, rgba(180,20,20,0.08) 0%, #060606 70%)",
        }}
      >
        <span className="text-xs text-white/20 font-sans uppercase tracking-wider mb-2">
          Derni&egrave;re chance
        </span>

        <span className={cn(
          "text-2xl font-mono font-bold mb-6",
          (state.timeLeft ?? 0) <= 5 ? "text-red-400 animate-pulse" : "text-red-400/60"
        )}>
          {state.timeLeft}s
        </span>

        {isGuesser ? (
          <div className="text-center w-full max-w-md">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 bg-red-500/5 mb-6">
              <span className="text-red-400 text-sm font-sans">
                🕵️ Tu as &eacute;t&eacute; d&eacute;masqu&eacute; ! Devine le mot pour gagner.
              </span>
            </div>

            {/* Clue history as hint */}
            {state.clueHistory && state.clueHistory.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] text-white/20 font-sans uppercase tracking-wider mb-2">
                  Indices donn&eacute;s pendant la partie
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {state.clueHistory.map((c, i) => (
                    <div
                      key={`${c.playerId}-${c.round}-${i}`}
                      className="flex items-center gap-2 rounded border border-white/[0.04] bg-white/[0.02] px-3 py-1.5"
                    >
                      <span className="text-[10px] text-white/20 font-sans">M{c.round}</span>
                      <span className="text-[10px] text-white/30 font-sans shrink-0">{c.playerName}</span>
                      <span className="text-xs text-white/50 font-sans">{c.clue}</span>
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
                  className="flex-1 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-white font-sans text-sm placeholder:text-red-400/20 focus:outline-none focus:border-red-500/50 focus:bg-red-500/10 transition-all"
                />
                <button
                  onClick={handleGuessWord}
                  disabled={!guessInput.trim()}
                  className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-white/[0.06] disabled:text-white/20 text-white font-sans text-sm font-medium transition-all"
                >
                  Deviner
                </button>
              </div>
            ) : (
              <div className="px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <p className="text-sm text-red-400/60 font-sans">R&eacute;ponse envoy&eacute;e...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-serif font-light text-white/70 mb-2">
              L&apos;infiltr&eacute; tente de deviner le mot...
            </p>
            <p className="text-xs text-white/20 font-sans animate-pulse">
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
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <span className="text-xs text-white/20 font-sans uppercase tracking-wider mb-6">
          R&eacute;sultat final
        </span>

        {state.lastGuessCorrect === true && (
          <div className="text-center mb-6">
            <p className="text-3xl mb-3">🕵️</p>
            <p
              className="text-3xl font-serif font-light text-red-400 mb-2"
              style={{ textShadow: "0 0 40px rgba(239,68,68,0.3)" }}
            >
              L&apos;infiltr&eacute; a devin&eacute; le mot !
            </p>
            <p className="text-white/50 font-sans text-sm">
              Le mot &eacute;tait : <span className="text-white/80 font-serif">{state.secretWord}</span>
            </p>
            {state.lastGuess && (
              <p className="text-xs text-red-400/40 font-sans mt-2">
                Sa r&eacute;ponse : &laquo;{state.lastGuess}&raquo;
              </p>
            )}
          </div>
        )}

        {state.lastGuessCorrect === false && (
          <div className="text-center mb-6">
            <p className="text-3xl mb-3">🎉</p>
            <p
              className="text-3xl font-serif font-light text-blue-400 mb-2"
              style={{ textShadow: "0 0 40px rgba(59,130,246,0.3)" }}
            >
              Les civils gagnent !
            </p>
            <p className="text-white/50 font-sans text-sm">
              Le mot &eacute;tait : <span className="text-white/80 font-serif">{state.secretWord}</span>
            </p>
            {state.lastGuess && (
              <p className="text-xs text-red-400/40 font-sans mt-2">
                L&apos;infiltr&eacute; a r&eacute;pondu : &laquo;{state.lastGuess}&raquo;
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-white/20 font-sans animate-pulse">
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
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: "#060606" }}>
        <span className="text-xs text-white/20 font-sans uppercase tracking-wider mb-3">
          Partie termin&eacute;e
        </span>

        {/* Full reveal */}
        <div className="text-center mb-6">
          <p className="text-lg font-serif font-light text-white/70 mb-2">
            Le mot secret &eacute;tait
          </p>
          <p
            className="text-4xl font-serif font-light text-white/90 mb-4"
            style={{ textShadow: "0 0 40px rgba(255,255,255,0.1)" }}
          >
            {state.secretWord}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
            <span className="text-red-400 text-sm font-sans">
              🕵️ {infiltreNames.length > 1 ? "Les infiltr\u00e9s \u00e9taient" : "L\u2019infiltr\u00e9 \u00e9tait"} : {infiltreNames.join(", ")}
            </span>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="w-full max-w-sm space-y-2">
          {sortedPlayers.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 transition-all",
                i === 0 && "border-cyan-500/30 bg-cyan-500/5",
                i > 0 && "border-white/[0.06] bg-white/[0.03]",
                p.isEliminated && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-lg font-mono w-7",
                  i === 0 ? "text-cyan-400" : "text-white/20"
                )}>
                  #{i + 1}
                </span>
                <div>
                  <span className={cn(
                    "text-sm font-sans",
                    i === 0 ? "text-white/90" : "text-white/60"
                  )}>
                    {p.name}{p.id === playerId && " (toi)"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.isInfiltre === true && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 font-sans">
                        Infiltr&eacute;
                      </span>
                    )}
                    {p.isInfiltre === false && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 font-sans">
                        Civil
                      </span>
                    )}
                    {p.isEliminated && (
                      <span className="text-[10px] text-white/20 font-sans line-through">
                        &Eacute;limin&eacute;
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className={cn(
                "text-lg font-mono font-bold",
                i === 0 ? "text-cyan-400" : "text-white/40"
              )}>
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
    <div className="flex flex-1 items-center justify-center" style={{ background: "#060606" }}>
      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
      {!error && (
        <p className="text-white/40 animate-pulse font-sans">Chargement...</p>
      )}
    </div>
  );
}
