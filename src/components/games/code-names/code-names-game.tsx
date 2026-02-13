"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Types matching server state ──────────────────────────────────────
type Team = "red" | "blue";
type CardColor = "red" | "blue" | "neutral" | "assassin";
type Phase = "team-pick" | "spymaster-turn" | "team-guess" | "game-over";

interface CodeNamesCard {
  word: string;
  color: CardColor | null;
  revealed: boolean;
}

interface CodeNamesPlayerInfo {
  id: string;
  name: string;
  team: Team | null;
  isSpymaster: boolean;
}

interface CodeNamesState {
  phase: Phase;
  currentTeam: Team;
  startingTeam: Team;
  players: CodeNamesPlayerInfo[];
  cards: CodeNamesCard[];
  redRemaining: number;
  blueRemaining: number;
  currentClueWord: string | null;
  currentClueCount: number;
  guessesRemaining: number;
  timeLeft: number;
  hostId: string | null;
  myId: string | null;
  isSpymaster: boolean;
  winner: Team | null;
  winReason: string | null;
}

const TEAM_STYLES = {
  red: {
    bg: "bg-red-500/20",
    border: "border-red-500/40",
    text: "text-red-400",
    accent: "bg-red-500",
    accentHover: "hover:bg-red-600",
    label: "Rouge",
  },
  blue: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
    text: "text-blue-400",
    accent: "bg-blue-500",
    accentHover: "hover:bg-blue-600",
    label: "Bleu",
  },
} as const;

const CARD_COLORS: Record<CardColor, string> = {
  red: "bg-red-500/25 border-red-500/50 text-red-300",
  blue: "bg-blue-500/25 border-blue-500/50 text-blue-300",
  neutral: "bg-white/[0.06] border-white/[0.12] text-white/40",
  assassin: "bg-black border-white/20 text-white/80",
};

const SPYMASTER_OVERLAY: Record<CardColor, string> = {
  red: "ring-2 ring-red-500/60 bg-red-500/10",
  blue: "ring-2 ring-blue-500/60 bg-blue-500/10",
  neutral: "ring-1 ring-white/10 bg-white/[0.02]",
  assassin: "ring-2 ring-white/40 bg-black/40",
};

function SkullIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 3.5 1.5 6.5 4 8.5V22h2v-1h2v1h2v-1h2v1h2v-1.5c2.5-2 4-5 4-8.5 0-5.523-4.477-10-10-10z" />
      <circle cx="8.5" cy="11" r="2" />
      <circle cx="15.5" cy="11" r="2" />
      <path d="M9 16h6" strokeLinecap="round" />
      <path d="M10 16v2M12 16v2M14 16v2" strokeLinecap="round" />
    </svg>
  );
}

export default function CodeNamesGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "code-names", playerId, playerName);
  const { gameState, error } = useGameStore();

  const [clueWord, setClueWord] = useState("");
  const [clueCount, setClueCount] = useState(1);
  const clueInputRef = useRef<HTMLInputElement>(null);

  const state = gameState as unknown as CodeNamesState;

  useEffect(() => {
    if (
      state?.phase === "spymaster-turn" &&
      state?.isSpymaster &&
      state?.currentTeam === state?.players?.find(p => p.id === playerId)?.team
    ) {
      setTimeout(() => clueInputRef.current?.focus(), 200);
    }
  }, [state?.phase, state?.isSpymaster, state?.currentTeam, playerId, state?.players]);

  const prevTeamRef = useRef<Team | null>(null);
  useEffect(() => {
    if (state?.currentTeam && state.currentTeam !== prevTeamRef.current) {
      prevTeamRef.current = state.currentTeam;
      setClueWord("");
      setClueCount(1);
    }
  }, [state?.currentTeam]);

  const joinTeam = useCallback(
    (team: Team) => sendAction({ action: "join-team", team }),
    [sendAction]
  );

  const startGame = useCallback(
    () => sendAction({ action: "start-game" }),
    [sendAction]
  );

  const giveClue = useCallback(() => {
    const trimmed = clueWord.trim();
    if (!trimmed) return;
    sendAction({ action: "give-clue", word: trimmed, count: clueCount });
    setClueWord("");
    setClueCount(1);
  }, [clueWord, clueCount, sendAction]);

  const guess = useCallback(
    (wordIndex: number) => sendAction({ action: "guess", wordIndex }),
    [sendAction]
  );

  const endTurn = useCallback(
    () => sendAction({ action: "end-turn" }),
    [sendAction]
  );

  if (!state || !state.phase) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <p className="text-white/40 animate-pulse font-sans">En attente des joueurs...</p>
      </div>
    );
  }

  const me = state.players?.find((p) => p.id === playerId);
  const isHost = playerId === state.hostId;
  const teamStyle = state.currentTeam ? TEAM_STYLES[state.currentTeam] : TEAM_STYLES.red;
  const redPlayers = state.players?.filter((p) => p.team === "red") ?? [];
  const bluePlayers = state.players?.filter((p) => p.team === "blue") ?? [];
  const unassigned = state.players?.filter((p) => !p.team) ?? [];

  // ── TEAM PICK PHASE ────────────────────────────────────────────────
  if (state.phase === "team-pick") {
    return (
      <div className="flex flex-1 flex-col items-center gap-8 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-light text-white/90 mb-2">Noms de Code</h1>
          <p className="text-sm text-white/40 font-sans">Choisis ton equipe</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
          {/* Red team */}
          <div className={cn(
            "flex-1 rounded-xl border-2 p-5 transition-all",
            me?.team === "red"
              ? "border-red-500/60 bg-red-500/10 shadow-lg shadow-red-500/10"
              : "border-red-500/20 bg-red-500/5 hover:border-red-500/40"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-sans font-semibold text-red-400">Equipe Rouge</h2>
              <span className="text-xs font-mono text-red-400/60">
                {redPlayers.length} joueur{redPlayers.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2 mb-4 min-h-[60px]">
              {redPlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10">
                  <span className="text-sm text-red-300 font-sans">
                    {p.name}{p.id === playerId && <span className="text-red-500/50 ml-1">(toi)</span>}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => joinTeam("red")}
              disabled={me?.team === "red"}
              className={cn(
                "w-full py-2.5 rounded-lg font-sans text-sm font-medium transition-all",
                me?.team === "red"
                  ? "bg-red-500/20 text-red-400/40 cursor-default"
                  : "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              {me?.team === "red" ? "Dans cette equipe" : "Rejoindre"}
            </button>
          </div>

          {/* Blue team */}
          <div className={cn(
            "flex-1 rounded-xl border-2 p-5 transition-all",
            me?.team === "blue"
              ? "border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/10"
              : "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-sans font-semibold text-blue-400">Equipe Bleue</h2>
              <span className="text-xs font-mono text-blue-400/60">
                {bluePlayers.length} joueur{bluePlayers.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2 mb-4 min-h-[60px]">
              {bluePlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10">
                  <span className="text-sm text-blue-300 font-sans">
                    {p.name}{p.id === playerId && <span className="text-blue-500/50 ml-1">(toi)</span>}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => joinTeam("blue")}
              disabled={me?.team === "blue"}
              className={cn(
                "w-full py-2.5 rounded-lg font-sans text-sm font-medium transition-all",
                me?.team === "blue"
                  ? "bg-blue-500/20 text-blue-400/40 cursor-default"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              {me?.team === "blue" ? "Dans cette equipe" : "Rejoindre"}
            </button>
          </div>
        </div>

        {unassigned.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-white/20 font-sans mb-2">Sans equipe :</p>
            <div className="flex flex-wrap justify-center gap-2">
              {unassigned.map((p) => (
                <span key={p.id} className="text-xs text-white/40 font-sans px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06]">
                  {p.name}{p.id === playerId && " (toi)"}
                </span>
              ))}
            </div>
          </div>
        )}

        {isHost && (
          <button
            onClick={startGame}
            disabled={redPlayers.length < 1 || bluePlayers.length < 1}
            className="px-8 py-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] disabled:bg-white/[0.03] disabled:text-white/20 text-white font-sans text-sm font-medium transition-all border border-white/[0.1] disabled:border-white/[0.05]"
          >
            Lancer la partie
          </button>
        )}

        {!isHost && (
          <p className="text-xs text-white/20 font-sans animate-pulse">
            L&apos;hote lance la partie...
          </p>
        )}

        {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
      </div>
    );
  }

  // ── GAME BOARD (spymaster-turn, team-guess, game-over) ─────────────
  const isMyTeamTurn = me?.team === state.currentTeam;
  const isMySpymasterTurn = state.phase === "spymaster-turn" && state.isSpymaster && isMyTeamTurn;
  const canGuess = state.phase === "team-guess" && isMyTeamTurn && !state.isSpymaster;

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Header: Scores + Turn indicator + Timer */}
      <div className="flex items-center justify-between gap-4">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
          state.currentTeam === "red" && state.phase !== "game-over"
            ? "border-red-500/60 bg-red-500/15 shadow-lg shadow-red-500/10"
            : "border-red-500/20 bg-red-500/5"
        )}>
          <span className="text-sm font-sans font-semibold text-red-400">Rouge</span>
          <span className="text-lg font-mono font-bold text-red-300">{state.redRemaining}</span>
        </div>

        <div className="flex flex-col items-center gap-1 flex-1">
          {state.phase === "game-over" && state.winner ? (
            <div className="text-center">
              <p className={cn("text-lg font-serif font-semibold", TEAM_STYLES[state.winner].text)}>
                Equipe {TEAM_STYLES[state.winner].label} gagne !
              </p>
              <p className="text-xs text-white/40 font-sans mt-1">{state.winReason}</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/30 font-sans">
                {state.phase === "spymaster-turn" && (
                  <>Espion <span className={teamStyle.text}>{teamStyle.label}</span> donne un indice</>
                )}
                {state.phase === "team-guess" && (
                  <>
                    Equipe <span className={teamStyle.text}>{teamStyle.label}</span> devine
                    {state.guessesRemaining > 0 && (
                      <span className="text-white/50 ml-1">
                        ({state.guessesRemaining} essai{state.guessesRemaining !== 1 ? "s" : ""} restant{state.guessesRemaining !== 1 ? "s" : ""})
                      </span>
                    )}
                  </>
                )}
              </p>
              <span className={cn("text-sm font-mono font-bold", state.timeLeft <= 10 ? "text-red-400" : "text-white/60")}>
                {state.timeLeft}s
              </span>
            </>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
          state.currentTeam === "blue" && state.phase !== "game-over"
            ? "border-blue-500/60 bg-blue-500/15 shadow-lg shadow-blue-500/10"
            : "border-blue-500/20 bg-blue-500/5"
        )}>
          <span className="text-sm font-sans font-semibold text-blue-400">Bleu</span>
          <span className="text-lg font-mono font-bold text-blue-300">{state.blueRemaining}</span>
        </div>
      </div>

      {/* Clue display */}
      {state.currentClueWord && state.phase === "team-guess" && (
        <div className="flex items-center justify-center gap-4 py-3">
          <div className={cn("px-6 py-3 rounded-xl border-2 text-center", teamStyle.border, teamStyle.bg)}>
            <p className={cn("text-2xl font-serif font-bold tracking-wide", teamStyle.text)}>
              {state.currentClueWord}
            </p>
            <p className={cn("text-sm font-mono mt-1", teamStyle.text)}>{state.currentClueCount}</p>
          </div>
        </div>
      )}

      {/* Spymaster clue input */}
      {isMySpymasterTurn && (
        <div className="flex items-center justify-center gap-3 py-2">
          <input
            ref={clueInputRef}
            type="text"
            value={clueWord}
            onChange={(e) => setClueWord(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); giveClue(); } }}
            placeholder="Ton indice..."
            autoComplete="off"
            className="px-4 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white font-sans text-sm placeholder:text-white/20 focus:outline-none focus:border-white/[0.3] focus:bg-white/[0.06] transition-all w-48"
          />
          <select
            value={clueCount}
            onChange={(e) => setClueCount(Number(e.target.value))}
            className="px-3 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white font-sans text-sm focus:outline-none focus:border-white/[0.3] transition-all appearance-none cursor-pointer"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n} className="bg-neutral-900 text-white">{n}</option>
            ))}
          </select>
          <button
            onClick={giveClue}
            disabled={!clueWord.trim()}
            className={cn(
              "px-5 py-2.5 rounded-lg font-sans text-sm font-medium transition-all text-white",
              teamStyle.accent, teamStyle.accentHover,
              "disabled:bg-white/[0.06] disabled:text-white/20"
            )}
          >
            Donner l&apos;indice
          </button>
        </div>
      )}

      {/* Spymaster waiting message */}
      {state.phase === "spymaster-turn" && !isMySpymasterTurn && (
        <div className="flex items-center justify-center py-2">
          <p className="text-sm text-white/30 font-sans animate-pulse">
            {isMyTeamTurn && !state.isSpymaster
              ? "Votre espion reflechit..."
              : `L'espion ${teamStyle.label.toLowerCase()} reflechit...`}
          </p>
        </div>
      )}

      {/* 5x5 Card grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {state.cards?.map((card, index) => {
          const isRevealed = card.revealed;
          const spymasterColor = state.isSpymaster && !isRevealed ? card.color : null;
          const revealedColor = isRevealed ? card.color : null;
          const isAssassinRevealed = isRevealed && card.color === "assassin";
          const canClick = canGuess && !isRevealed && state.phase === "team-guess";

          return (
            <button
              key={index}
              onClick={() => canClick && guess(index)}
              disabled={!canClick}
              className={cn(
                "relative aspect-[4/3] sm:aspect-[3/2] rounded-lg border text-center font-sans font-bold text-xs sm:text-sm uppercase transition-all duration-200 select-none flex items-center justify-center p-1",
                isRevealed && revealedColor && CARD_COLORS[revealedColor],
                !isRevealed && spymasterColor && SPYMASTER_OVERLAY[spymasterColor],
                !isRevealed && !spymasterColor && "bg-white/[0.04] border-white/[0.08]",
                canClick && !isRevealed && "hover:bg-white/[0.08] hover:border-white/[0.16] hover:scale-[1.03] cursor-pointer active:scale-[0.97]",
                !canClick && "cursor-default",
                isRevealed && "opacity-80"
              )}
            >
              {isAssassinRevealed && <SkullIcon className="absolute top-1 right-1 w-4 h-4 text-white/40" />}
              {!isRevealed && spymasterColor === "assassin" && <SkullIcon className="absolute top-1 right-1 w-3.5 h-3.5 text-white/30" />}
              <span className={cn("leading-tight", isRevealed && "line-through decoration-1")}>{card.word}</span>
            </button>
          );
        })}
      </div>

      {/* End turn button */}
      {canGuess && state.phase === "team-guess" && (
        <div className="flex justify-center pt-2">
          <button
            onClick={endTurn}
            className="px-6 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white/80 font-sans text-sm transition-all"
          >
            Finir le tour
          </button>
        </div>
      )}

      {/* Team rosters */}
      <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-4 border-t border-white/[0.06]">
        <div className="flex-1">
          <p className="text-xs text-red-400/60 font-sans mb-2 font-medium">Equipe Rouge</p>
          <div className="flex flex-wrap gap-1.5">
            {redPlayers.map((p) => (
              <span key={p.id} className={cn(
                "text-xs font-sans px-2 py-1 rounded border",
                p.isSpymaster ? "border-red-500/40 bg-red-500/15 text-red-300" : "border-red-500/15 bg-red-500/5 text-red-400/70",
                p.id === playerId && "ring-1 ring-red-400/30"
              )}>
                {p.isSpymaster && <span className="mr-1" title="Espion">{"[E]"}</span>}
                {p.name}{p.id === playerId && " (toi)"}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs text-blue-400/60 font-sans mb-2 font-medium">Equipe Bleue</p>
          <div className="flex flex-wrap justify-end gap-1.5">
            {bluePlayers.map((p) => (
              <span key={p.id} className={cn(
                "text-xs font-sans px-2 py-1 rounded border",
                p.isSpymaster ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-blue-500/15 bg-blue-500/5 text-blue-400/70",
                p.id === playerId && "ring-1 ring-blue-400/30"
              )}>
                {p.isSpymaster && <span className="mr-1" title="Espion">{"[E]"}</span>}
                {p.name}{p.id === playerId && " (toi)"}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Spymaster indicator */}
      {state.isSpymaster && state.phase !== "game-over" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
          <p className="text-xs text-amber-400 font-sans font-medium">Tu es l&apos;Espion - tu vois la carte secrete</p>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-sm">
          <p className="text-sm text-red-400 font-sans">{error}</p>
        </div>
      )}
    </div>
  );
}
