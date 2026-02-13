"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Types (mirrors server state) ────────────────────────────

type Role = "civilian" | "undercover" | "mrwhite";
type GamePhase =
  | "waiting"
  | "role-reveal"
  | "describe"
  | "vote"
  | "vote-result"
  | "mrwhite-guess"
  | "game-over";

interface UndercoverPlayerState {
  id: string;
  name: string;
  alive: boolean;
  hasDescribed: boolean;
  hasVoted: boolean;
  description: string | null;
  role: Role | null;
  word: string | null;
}

interface ClueEntry {
  playerId: string;
  playerName: string;
  text: string;
  round: number;
}

interface UndercoverState {
  phase: GamePhase;
  round: number;
  players: UndercoverPlayerState[];
  turnOrder: string[];
  currentDescriberId: string | null;
  clueHistory: ClueEntry[];
  timeLeft: number;
  myRole: Role | null;
  myWord: string | null;
  eliminatedPlayerId: string | null;
  eliminatedRole: Role | null;
  mrWhiteGuessCorrect: boolean | null;
  winners: Role | null;
  civilianWord: string | null;
  undercoverWord: string | null;
}

// ── Helpers ─────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  civilian: "Civil",
  undercover: "Undercover",
  mrwhite: "Mr. White",
};

const ROLE_COLORS: Record<Role, string> = {
  civilian: "text-blue-400",
  undercover: "text-red-400",
  mrwhite: "text-white",
};

const ROLE_BG: Record<Role, string> = {
  civilian: "border-blue-400/30 bg-blue-400/5",
  undercover: "border-red-400/30 bg-red-400/5",
  mrwhite: "border-white/30 bg-white/5",
};

const ROLE_GLOW: Record<Role, string> = {
  civilian: "0 0 40px rgba(96,165,250,0.3), 0 0 80px rgba(96,165,250,0.15)",
  undercover:
    "0 0 40px rgba(248,113,113,0.3), 0 0 80px rgba(248,113,113,0.15)",
  mrwhite: "0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.15)",
};

function getRoleLabel(role: Role | null): string {
  return role ? ROLE_LABELS[role] : "???";
}

function getRoleColor(role: Role | null): string {
  return role ? ROLE_COLORS[role] : "text-white/40";
}

// ── Component ───────────────────────────────────────────────

export default function UndercoverGame({
  roomCode,
  playerId,
  playerName,
}: GameProps) {
  const { sendAction } = useGame(roomCode, "undercover", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as UndercoverState;

  const [clueInput, setClueInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [voteTarget, setVoteTarget] = useState<string | null>(null);
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [clueSubmitted, setClueSubmitted] = useState(false);
  const clueInputRef = useRef<HTMLInputElement>(null);
  const guessInputRef = useRef<HTMLInputElement>(null);
  const prevRoundRef = useRef(0);
  const prevPhaseRef = useRef<GamePhase>("waiting");
  const clueListRef = useRef<HTMLDivElement>(null);

  // Reset state on phase/round changes
  useEffect(() => {
    if (!state) return;
    const phaseChanged = state.phase !== prevPhaseRef.current;
    const roundChanged = state.round !== prevRoundRef.current;

    if (phaseChanged || roundChanged) {
      prevPhaseRef.current = state.phase;
      prevRoundRef.current = state.round;

      if (state.phase === "describe") {
        setClueInput("");
        setClueSubmitted(false);
      }
      if (state.phase === "vote") {
        setVoteTarget(null);
        setVoteConfirmed(false);
      }
      if (state.phase === "mrwhite-guess") {
        setGuessInput("");
      }
    }
  }, [state?.phase, state?.round, state]);

  // Focus clue input when it is my turn
  useEffect(() => {
    if (state?.phase === "describe" && state.currentDescriberId === playerId) {
      setTimeout(() => clueInputRef.current?.focus(), 100);
    }
  }, [state?.phase, state?.currentDescriberId, playerId]);

  // Focus guess input for Mr. White
  useEffect(() => {
    if (state?.phase === "mrwhite-guess" && state.myRole === "mrwhite") {
      setTimeout(() => guessInputRef.current?.focus(), 100);
    }
  }, [state?.phase, state?.myRole]);

  // Auto-scroll clue history
  useEffect(() => {
    if (clueListRef.current) {
      clueListRef.current.scrollTop = clueListRef.current.scrollHeight;
    }
  }, [state?.clueHistory?.length]);

  const handleSubmitClue = useCallback(() => {
    const trimmed = clueInput.trim();
    if (!trimmed || clueSubmitted) return;
    setClueSubmitted(true);
    sendAction({ action: "describe", text: trimmed });
  }, [clueInput, clueSubmitted, sendAction]);

  const handleClueKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitClue();
      }
    },
    [handleSubmitClue]
  );

  const handleVote = useCallback(() => {
    if (!voteTarget || voteConfirmed) return;
    setVoteConfirmed(true);
    sendAction({ action: "vote", targetId: voteTarget });
  }, [voteTarget, voteConfirmed, sendAction]);

  const handleMrWhiteGuess = useCallback(() => {
    const trimmed = guessInput.trim();
    if (!trimmed) return;
    sendAction({ action: "mrwhite-guess", guess: trimmed });
  }, [guessInput, sendAction]);

  const handleGuessKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleMrWhiteGuess();
      }
    },
    [handleMrWhiteGuess]
  );

  // ── Waiting ───────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-white/40 animate-pulse font-sans">
          En attente des joueurs...
        </p>
      </div>
    );
  }

  const me = state.players?.find((p) => p.id === playerId);
  const alivePlayers = state.players?.filter((p) => p.alive) ?? [];
  const isTimeLow = (state.timeLeft ?? 0) <= 5;

  // ── Role Reveal ───────────────────────────────────────────
  if (state.phase === "role-reveal") {
    const myRole = state.myRole;
    const myWord = state.myWord;

    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <span className="text-xs text-white/20 font-sans uppercase tracking-widest mb-8">
          Ton identite secrete
        </span>

        <div
          className={cn(
            "rounded-2xl border p-8 text-center max-w-sm w-full",
            myRole ? ROLE_BG[myRole] : "border-white/[0.06] bg-white/[0.03]"
          )}
        >
          {/* Role badge */}
          <span
            className={cn(
              "text-sm font-sans font-medium uppercase tracking-wider",
              getRoleColor(myRole)
            )}
          >
            {getRoleLabel(myRole)}
          </span>

          {/* Word or special message */}
          <div className="mt-6 mb-4">
            {myRole === "mrwhite" ? (
              <p
                className="text-3xl font-serif font-light text-white/90"
                style={{ textShadow: ROLE_GLOW.mrwhite }}
              >
                ???
              </p>
            ) : (
              <p
                className={cn(
                  "text-4xl font-serif font-light",
                  getRoleColor(myRole)
                )}
                style={{
                  textShadow: myRole ? ROLE_GLOW[myRole] : undefined,
                }}
              >
                {myWord}
              </p>
            )}
          </div>

          {myRole === "mrwhite" && (
            <p className="text-xs text-white/30 font-sans mt-2">
              Tu n&apos;as pas de mot. Ecoute les indices et bluff !
            </p>
          )}
          {myRole === "undercover" && (
            <p className="text-xs text-white/30 font-sans mt-2">
              Ton mot est different des autres. Sois discret !
            </p>
          )}
          {myRole === "civilian" && (
            <p className="text-xs text-white/30 font-sans mt-2">
              Decris ton mot sans te devoiler. Trouve l&apos;imposteur !
            </p>
          )}
        </div>

        <p className="text-xs text-white/20 font-sans mt-6 animate-pulse">
          Memorise ton mot...
        </p>
      </div>
    );
  }

  // ── Describe Phase ────────────────────────────────────────
  if (state.phase === "describe") {
    const isMyTurn = state.currentDescriberId === playerId;
    const currentDescriber = state.players?.find(
      (p) => p.id === state.currentDescriberId
    );
    const iAmAlive = me?.alive ?? false;

    return (
      <div className="flex flex-1 flex-col p-6 gap-4">
        {/* Header: round + timer */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/20 font-sans">
              Manche {state.round}
            </span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                isTimeLow ? "text-red-400" : "text-ember"
              )}
            >
              {state.timeLeft}s
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                isTimeLow ? "bg-red-500" : "bg-ember"
              )}
              style={{
                width: `${((state.timeLeft ?? 0) / 30) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Current describer */}
        <div className="text-center max-w-2xl mx-auto">
          {isMyTurn ? (
            <h2
              className="text-2xl font-serif font-light text-ember"
              style={{ textShadow: "0 0 30px rgba(249,115,22,0.3)" }}
            >
              C&apos;est ton tour !
            </h2>
          ) : (
            <h2 className="text-xl font-serif font-light text-white/70">
              <span className="text-ember">{currentDescriber?.name}</span>{" "}
              decrit son mot...
            </h2>
          )}
          <p className="text-xs text-white/30 font-sans mt-1">
            Donne un indice SANS dire ton mot
          </p>
        </div>

        {/* Clue input (only for current describer) */}
        {isMyTurn && iAmAlive && !clueSubmitted && (
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <input
              ref={clueInputRef}
              type="text"
              value={clueInput}
              onChange={(e) => setClueInput(e.target.value)}
              onKeyDown={handleClueKeyDown}
              placeholder="Ton indice..."
              autoFocus
              autoComplete="off"
              className="flex-1 px-4 py-3 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-ember/50 focus:bg-white/[0.06] transition-all"
            />
            <button
              onClick={handleSubmitClue}
              disabled={!clueInput.trim()}
              className="px-6 py-3 rounded-lg bg-ember hover:bg-ember-glow disabled:bg-white/[0.06] disabled:text-white/20 text-white font-sans text-sm font-medium transition-all"
            >
              Envoyer
            </button>
          </div>
        )}
        {isMyTurn && clueSubmitted && (
          <div className="max-w-md mx-auto text-center">
            <div className="px-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
              <p className="text-sm text-white/50 font-sans">
                Indice envoye !
              </p>
            </div>
          </div>
        )}

        {/* Clue history */}
        <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col min-h-0">
          <span className="text-xs text-white/20 font-sans mb-2">
            Indices donnes
          </span>
          <div
            ref={clueListRef}
            className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin"
          >
            {state.clueHistory?.length === 0 && (
              <p className="text-xs text-white/15 font-sans text-center py-4">
                Aucun indice pour le moment...
              </p>
            )}
            {state.clueHistory?.map((clue, i) => (
              <div
                key={`${clue.playerId}-${clue.round}-${i}`}
                className={cn(
                  "flex items-baseline gap-2 px-3 py-2 rounded-lg",
                  clue.playerId === playerId
                    ? "bg-ember/5 border border-ember/10"
                    : "bg-white/[0.02] border border-white/[0.04]"
                )}
              >
                <span className="text-[10px] text-white/20 font-mono shrink-0">
                  R{clue.round}
                </span>
                <span className="text-xs text-white/50 font-sans font-medium shrink-0">
                  {clue.playerName}
                </span>
                <span className="text-sm text-white/80 font-sans">
                  {clue.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Player grid */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {state.players?.map((p) => {
            const isDescribing = p.id === state.currentDescriberId;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2 min-w-[80px] transition-all",
                  !p.alive && "opacity-30",
                  isDescribing
                    ? "border-ember/40 bg-ember/5"
                    : p.hasDescribed
                      ? "border-white/[0.12] bg-white/[0.05]"
                      : "border-white/[0.06] bg-white/[0.02]"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium truncate max-w-[70px] font-sans",
                    isDescribing ? "text-ember" : "text-white/60"
                  )}
                >
                  {p.name}
                  {p.id === playerId && " (toi)"}
                </span>
                <span className="text-[10px] text-white/25 font-sans">
                  {!p.alive
                    ? "Elimine"
                    : p.hasDescribed
                      ? "Fait"
                      : isDescribing
                        ? "Parle..."
                        : "En attente"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Vote Phase ────────────────────────────────────────────
  if (state.phase === "vote") {
    const iAmAlive = me?.alive ?? false;

    return (
      <div className="flex flex-1 flex-col items-center p-6 gap-5">
        {/* Header */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/20 font-sans">
              Vote — Manche {state.round}
            </span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                isTimeLow ? "text-red-400" : "text-ember"
              )}
            >
              {state.timeLeft}s
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                isTimeLow ? "bg-red-500" : "bg-ember"
              )}
              style={{
                width: `${((state.timeLeft ?? 0) / 30) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="text-center">
          <h2
            className="text-2xl font-serif font-light text-white/90"
            style={{ textShadow: "0 0 30px rgba(255,255,255,0.1)" }}
          >
            Qui est l&apos;imposteur ?
          </h2>
          <p className="text-xs text-white/30 font-sans mt-1">
            Votez pour eliminer un joueur suspect
          </p>
        </div>

        {/* Vote cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full">
          {alivePlayers
            .filter((p) => p.id !== playerId)
            .map((p) => {
              const isSelected = voteTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (!voteConfirmed && iAmAlive) setVoteTarget(p.id);
                  }}
                  disabled={voteConfirmed || !iAmAlive}
                  className={cn(
                    "rounded-lg border p-4 text-center transition-all",
                    isSelected
                      ? "border-red-400/50 bg-red-400/10 ring-1 ring-red-400/20"
                      : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.05]",
                    (voteConfirmed || !iAmAlive) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-sans font-medium",
                      isSelected ? "text-red-400" : "text-white/70"
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Confirm vote */}
        {iAmAlive && !voteConfirmed && voteTarget && (
          <button
            onClick={handleVote}
            className="px-8 py-3 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-sans text-sm font-medium transition-all"
          >
            Confirmer le vote
          </button>
        )}
        {voteConfirmed && (
          <p className="text-xs text-white/20 font-sans animate-pulse">
            Vote enregistre. En attente des autres...
          </p>
        )}

        {/* Vote status */}
        <div className="flex flex-wrap justify-center gap-2 mt-auto">
          {alivePlayers.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2 min-w-[80px]",
                p.hasVoted
                  ? "border-white/[0.12] bg-white/[0.05]"
                  : "border-white/[0.06] bg-white/[0.02]"
              )}
            >
              <span className="text-xs text-white/60 font-sans truncate max-w-[70px]">
                {p.name}
                {p.id === playerId && " (toi)"}
              </span>
              <span className="text-[10px] text-white/25 font-sans">
                {p.hasVoted ? "A vote" : "..."}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Mr. White Guess ───────────────────────────────────────
  if (state.phase === "mrwhite-guess") {
    const iAmMrWhite = state.myRole === "mrwhite";
    const eliminatedPlayer = state.players?.find(
      (p) => p.id === state.eliminatedPlayerId
    );

    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <span className="text-xs text-white/20 font-sans uppercase tracking-widest">
            Mr. White elimine !
          </span>
          <h2
            className="text-3xl font-serif font-light text-white mt-3"
            style={{ textShadow: ROLE_GLOW.mrwhite }}
          >
            {eliminatedPlayer?.name ?? "Mr. White"}
          </h2>
          <p className="text-sm text-white/40 font-sans mt-2">
            Derniere chance : deviner le mot des civils !
          </p>
        </div>

        {/* Timer */}
        <span
          className={cn(
            "text-sm font-mono font-bold",
            isTimeLow ? "text-red-400" : "text-ember"
          )}
        >
          {state.timeLeft}s
        </span>

        {iAmMrWhite ? (
          <div className="flex gap-3 max-w-md w-full">
            <input
              ref={guessInputRef}
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={handleGuessKeyDown}
              placeholder="Le mot des civils est..."
              autoFocus
              autoComplete="off"
              className="flex-1 px-4 py-3 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
            />
            <button
              onClick={handleMrWhiteGuess}
              disabled={!guessInput.trim()}
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/[0.04] disabled:text-white/20 text-white font-sans text-sm font-medium transition-all"
            >
              Deviner
            </button>
          </div>
        ) : (
          <p className="text-xs text-white/20 font-sans animate-pulse">
            Mr. White tente de deviner le mot...
          </p>
        )}
      </div>
    );
  }

  // ── Vote Result ───────────────────────────────────────────
  if (state.phase === "vote-result") {
    const eliminatedPlayer = state.players?.find(
      (p) => p.id === state.eliminatedPlayerId
    );
    const noElimination = !state.eliminatedPlayerId;

    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 gap-6">
        {noElimination ? (
          <div className="text-center">
            <h2 className="text-3xl font-serif font-light text-white/60">
              Egalite !
            </h2>
            <p className="text-sm text-white/30 font-sans mt-2">
              Personne n&apos;est elimine ce tour.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-xs text-white/20 font-sans uppercase tracking-widest">
              Elimine
            </span>
            <h2
              className={cn(
                "text-3xl font-serif font-light mt-3",
                state.eliminatedRole
                  ? ROLE_COLORS[state.eliminatedRole]
                  : "text-white/90"
              )}
              style={{
                textShadow: state.eliminatedRole
                  ? ROLE_GLOW[state.eliminatedRole]
                  : undefined,
              }}
            >
              {eliminatedPlayer?.name}
            </h2>
            <div
              className={cn(
                "inline-block mt-3 px-4 py-1.5 rounded-full border text-sm font-sans font-medium",
                state.eliminatedRole ? ROLE_BG[state.eliminatedRole] : "",
                getRoleColor(state.eliminatedRole)
              )}
            >
              {getRoleLabel(state.eliminatedRole)}
            </div>
          </div>
        )}

        {/* Mr. White guess result */}
        {state.mrWhiteGuessCorrect !== null && (
          <div
            className={cn(
              "rounded-lg border p-4 text-center max-w-sm",
              state.mrWhiteGuessCorrect
                ? "border-emerald-400/30 bg-emerald-400/5"
                : "border-red-400/30 bg-red-400/5"
            )}
          >
            {state.mrWhiteGuessCorrect ? (
              <>
                <p className="text-lg text-emerald-400 font-serif">
                  Mr. White a devine le mot !
                </p>
                <p className="text-xs text-emerald-400/60 font-sans mt-1">
                  Victoire de Mr. White
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-red-400 font-serif">
                  Mauvaise reponse !
                </p>
                <p className="text-xs text-red-400/60 font-sans mt-1">
                  Mr. White n&apos;a pas trouve le mot
                </p>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-white/20 font-sans animate-pulse">
          La partie continue...
        </p>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────
  if (state.phase === "game-over") {
    const winnerLabel =
      state.winners === "civilian"
        ? "Les Civils"
        : state.winners === "mrwhite"
          ? "Mr. White"
          : "Les Undercovers";
    const winnerColor =
      state.winners === "civilian"
        ? "text-blue-400"
        : state.winners === "mrwhite"
          ? "text-white"
          : "text-red-400";
    const winnerGlow = state.winners ? ROLE_GLOW[state.winners] : undefined;

    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <span className="text-xs text-white/20 font-sans uppercase tracking-widest">
            Fin de la partie
          </span>
          <h2
            className={cn("text-4xl font-serif font-light mt-3", winnerColor)}
            style={{ textShadow: winnerGlow }}
          >
            {winnerLabel} gagnent !
          </h2>
        </div>

        {/* Word reveal */}
        <div className="flex gap-6 mt-2">
          <div className="text-center">
            <span className="text-[10px] text-blue-400/60 font-sans uppercase tracking-wider">
              Mot civil
            </span>
            <p className="text-xl font-serif text-blue-400 mt-1">
              {state.civilianWord}
            </p>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-red-400/60 font-sans uppercase tracking-wider">
              Mot undercover
            </span>
            <p className="text-xl font-serif text-red-400 mt-1">
              {state.undercoverWord}
            </p>
          </div>
        </div>

        {/* All players with roles revealed */}
        <div className="w-full max-w-md space-y-2 mt-4">
          {state.players?.map((p) => {
            const role = p.role;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  role
                    ? ROLE_BG[role]
                    : "border-white/[0.06] bg-white/[0.03]",
                  !p.alive && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-sans font-medium",
                      role ? ROLE_COLORS[role] : "text-white/60"
                    )}
                  >
                    {p.name}
                    {p.id === playerId && " (toi)"}
                  </span>
                  {!p.alive && (
                    <span className="text-[10px] text-white/20 font-sans">
                      elimine
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-sans font-medium uppercase tracking-wider",
                    getRoleColor(role)
                  )}
                >
                  {getRoleLabel(role)}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-white/20 font-sans animate-pulse mt-4">
          Retour au lobby...
        </p>
      </div>
    );
  }

  // ── Fallback ──────────────────────────────────────────────
  return (
    <div className="flex flex-1 items-center justify-center">
      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
    </div>
  );
}
