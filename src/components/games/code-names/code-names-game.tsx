"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

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

const MIN_PER_TEAM = 2;

const TEAM_STYLES = {
  red: {
    bg: "bg-red-500/20",
    border: "border-red-500/40",
    text: "text-red-400",
    accent: "bg-red-500",
    accentActive: "active:bg-red-600",
    label: "Rouge",
  },
  blue: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
    text: "text-blue-400",
    accent: "bg-blue-500",
    accentActive: "active:bg-blue-600",
    label: "Bleu",
  },
} as const;

// Cartes révélées : couleurs pleines, « neutre » en beige/pierre bien distinct
// des cartes encore cachées.
const CARD_COLORS: Record<CardColor, string> = {
  red: "bg-red-500/80 border-red-400 text-white",
  blue: "bg-blue-500/80 border-blue-400 text-white",
  neutral: "bg-stone-300 border-stone-400 text-stone-800",
  assassin: "bg-black border-white/40 text-white",
};

// Vue du Chef espion sur les cartes non révélées.
const SPYMASTER_OVERLAY: Record<CardColor, string> = {
  red: "ring-2 ring-red-500/70 bg-red-500/15 border-red-500/30",
  blue: "ring-2 ring-blue-500/70 bg-blue-500/15 border-blue-500/30",
  neutral: "ring-1 ring-stone-300/40 bg-stone-300/10 border-stone-300/20",
  assassin: "ring-2 ring-white/60 bg-black/70 border-white/20",
};

const CARD_GLOW: Record<CardColor, string> = {
  red: "shadow-[0_0_16px_rgba(239,68,68,0.3)]",
  blue: "shadow-[0_0_16px_rgba(59,130,246,0.3)]",
  neutral: "",
  assassin: "shadow-[0_0_16px_rgba(255,255,255,0.15)]",
};

/** Taille de police adaptée à la longueur du mot (grille 5×5 sur ~375 px). */
function wordSizeClass(word: string) {
  const len = word.length;
  if (len <= 7) return "text-[13px] sm:text-base";
  if (len <= 10) return "text-[11px] sm:text-sm";
  return "text-[10px] sm:text-xs";
}

function clueCountLabel(n: number) {
  return n === 0 ? "∞" : String(n);
}

function BombIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <circle cx="10" cy="14" r="7" />
      <path d="M14.5 8.5l2-2" strokeLinecap="round" />
      <path d="M17 6c1-1.5 2.5-2 4-1.5" strokeLinecap="round" />
      <path d="M20 2.5v1.2M22 4.5h-1.2M21.4 2.9l-.8.8" strokeLinecap="round" />
    </svg>
  );
}

export default function CodeNamesGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "code-names", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as CodeNamesState;
  const currentTeamKey = state?.currentTeam ?? "none";
  const [clueWord, setClueWord] = useKeyedState<string>(currentTeamKey, "");
  const [clueCount, setClueCount] = useKeyedState<number>(currentTeamKey, 1);
  const clueInputRef = useRef<HTMLInputElement>(null);

  const phase = state?.phase;
  const myTeam = state?.players?.find((p) => p.id === playerId)?.team;

  useEffect(() => {
    if (phase === "spymaster-turn" && state?.isSpymaster && state?.currentTeam === myTeam) {
      const t = setTimeout(() => clueInputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [phase, state?.isSpymaster, state?.currentTeam, myTeam]);

  // Efface l'erreur quand la phase change (ex. « 2 joueurs par équipe » une fois lancée).
  useEffect(() => {
    useGameStore.getState().setError(null);
  }, [phase]);

  // Les erreurs disparaissent seules après quelques secondes.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => useGameStore.getState().setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const joinTeam = useCallback(
    (team: Team) => sendAction({ action: "join-team", team }),
    [sendAction]
  );

  const wantSpymaster = useCallback(
    () => sendAction({ action: "want-spymaster" }),
    [sendAction]
  );

  const startGame = useCallback(
    () => sendAction({ action: "start-game" }),
    [sendAction]
  );

  const clueTrimmed = clueWord.trim();
  const clueHasSpace = /\s/.test(clueTrimmed);
  const canSendClue = clueTrimmed.length > 0 && !clueHasSpace;

  const giveClue = useCallback(() => {
    const trimmed = clueWord.trim();
    if (!trimmed || /\s/.test(trimmed)) return;
    sendAction({ action: "give-clue", word: trimmed, count: clueCount });
    setClueWord("");
    setClueCount(1);
  }, [clueCount, clueWord, sendAction, setClueCount, setClueWord]);

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
      <div className="flex flex-1 items-center justify-center min-h-[60vh] px-6">
        <div
          className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-8 py-6"
          style={{ boxShadow: "0 0 40px rgba(100,200,255,0.06)" }}
        >
          <p className="text-lg text-white/40 animate-pulse font-sans font-semibold tracking-wide">
            En attente des joueurs…
          </p>
        </div>
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
    const canStart = redPlayers.length >= MIN_PER_TEAM && bluePlayers.length >= MIN_PER_TEAM;

    const renderTeam = (team: Team, players: CodeNamesPlayerInfo[]) => {
      const isRed = team === "red";
      const mine = me?.team === team;
      // Chef désigné : celui qui l'a demandé, sinon le premier de l'équipe.
      const chiefId = (players.find((p) => p.isSpymaster) ?? players[0])?.id;
      const iAmChief = mine && chiefId === playerId;
      return (
        <div
          className={cn(
            "flex-1 rounded-3xl border p-4 sm:p-6 transition-all duration-300",
            mine
              ? isRed
                ? "border-red-500/50 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                : "border-blue-500/50 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              : "border-white/25 bg-black/30 backdrop-blur-sm"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className={cn("text-xl font-sans font-semibold", isRed ? "text-red-400" : "text-blue-400")}>
              Équipe {isRed ? "Rouge" : "Bleue"}
            </h2>
            <span
              className={cn(
                "text-xs font-mono px-2 py-0.5 rounded-full",
                isRed ? "text-red-300/70 bg-red-500/10" : "text-blue-300/70 bg-blue-500/10"
              )}
            >
              {players.length} joueur{players.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2 mb-4 min-h-[48px]">
            {players.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border",
                  isRed ? "bg-red-500/10 border-red-500/15" : "bg-blue-500/10 border-blue-500/15"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isRed ? "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]" : "bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                  )}
                />
                <span className={cn("text-sm font-sans truncate", isRed ? "text-red-200" : "text-blue-200")}>
                  {p.name}
                  {p.id === playerId && <span className="opacity-50 ml-1">(toi)</span>}
                </span>
                {p.id === chiefId && (
                  <span className="ml-auto shrink-0 text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Chef espion
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => joinTeam(team)}
              disabled={mine}
              className={cn(
                "w-full min-h-[44px] py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-200",
                mine
                  ? isRed
                    ? "bg-red-500/15 text-red-300/50 cursor-default border border-red-500/20"
                    : "bg-blue-500/15 text-blue-300/50 cursor-default border border-blue-500/20"
                  : isRed
                    ? "bg-red-500 active:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] active:scale-[0.98]"
                    : "bg-blue-500 active:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] active:scale-[0.98]"
              )}
            >
              {mine ? "Dans cette équipe" : "Rejoindre"}
            </button>
            {mine && !iAmChief && (
              <button
                onClick={wantSpymaster}
                className="w-full min-h-[44px] py-3 rounded-xl font-sans text-sm font-semibold border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 active:scale-[0.98] transition-all"
              >
                Je veux être chef
              </button>
            )}
          </div>
        </div>
      );
    };

    return (
      <div
        lang="fr"
        className="relative flex flex-1 flex-col items-center gap-6 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),16px)] overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 25% 20%, rgba(239,68,68,0.08), transparent 40%), radial-gradient(circle at 75% 20%, rgba(59,130,246,0.08), transparent 40%)",
        }}
      >
        <div className="text-center pt-8 px-12">
          <h1 className="text-4xl sm:text-5xl font-serif font-semibold text-white/90 mb-2 tracking-tight">
            Mots Espions
          </h1>
          <p className="text-base text-white/50 font-sans font-light tracking-wide">
            Choisis ton équipe
          </p>
        </div>

        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60 font-sans leading-relaxed">
          Chaque équipe a un <span className="text-cyan-300 font-semibold">Chef espion</span> qui voit
          les couleurs et donne un indice d&apos;un seul mot + un nombre. Ses coéquipiers devinent
          les mots de leur couleur. Attention à <span className="text-white font-semibold">la Bombe</span> :
          la toucher fait perdre aussitôt.
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full max-w-2xl">
          {renderTeam("red", redPlayers)}
          {renderTeam("blue", bluePlayers)}
        </div>

        {unassigned.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-white/40 font-sans mb-2 uppercase tracking-widest">
              Sans équipe
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {unassigned.map((p) => (
                <span
                  key={p.id}
                  className="text-sm text-white/50 font-sans px-3 py-1.5 rounded-xl bg-black/30 border border-white/[0.08] backdrop-blur-sm"
                >
                  {p.name}
                  {p.id === playerId && " (toi)"}
                </span>
              ))}
            </div>
          </div>
        )}

        {isHost && (
          <div className="flex flex-col items-center gap-2 w-full max-w-sm">
            <button
              onClick={startGame}
              disabled={!canStart}
              className={cn(
                "w-full min-h-[48px] px-10 py-3.5 rounded-xl font-sans text-base font-semibold transition-all duration-200",
                canStart
                  ? "bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] text-black shadow-[0_0_20px_rgba(78,207,138,0.25)] active:scale-[0.98]"
                  : "bg-white/[0.04] text-white/30 border border-white/[0.08] cursor-not-allowed"
              )}
            >
              Lancer la partie
            </button>
            {!canStart && (
              <p className="text-sm text-white/45 font-sans text-center">
                Il faut au moins {MIN_PER_TEAM} joueurs par équipe (1 Chef espion + 1 devineur).
              </p>
            )}
          </div>
        )}

        {!isHost && (
          <p className="text-sm text-white/40 font-sans animate-pulse tracking-wide">
            L&apos;hôte lance la partie…
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-5 py-2.5">
            <p className="text-sm text-red-400 font-sans">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // ── GAME BOARD (spymaster-turn, team-guess, game-over) ─────────────
  const isMyTeamTurn = me?.team === state.currentTeam;
  const isMySpymasterTurn = state.phase === "spymaster-turn" && state.isSpymaster && isMyTeamTurn;
  const canGuess = state.phase === "team-guess" && isMyTeamTurn && !state.isSpymaster;
  const showSpyPill = state.isSpymaster && state.phase !== "game-over";

  const boardGradient =
    state.currentTeam === "red"
      ? "radial-gradient(circle at 50% 25%, rgba(239,68,68,0.06), transparent 40%)"
      : "radial-gradient(circle at 50% 25%, rgba(59,130,246,0.06), transparent 40%)";

  const scoreChip = (team: Team) => {
    const active = state.currentTeam === team && state.phase !== "game-over";
    const isRed = team === "red";
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 h-11 rounded-xl border transition-all duration-300",
          active
            ? isRed
              ? "border-red-500/60 bg-red-500/20 shadow-[0_0_14px_rgba(239,68,68,0.25)]"
              : "border-blue-500/60 bg-blue-500/20 shadow-[0_0_14px_rgba(59,130,246,0.25)]"
            : "border-white/15 bg-black/30"
        )}
        aria-label={`${isRed ? "Rouges" : "Bleus"} : ${isRed ? state.redRemaining : state.blueRemaining} mots restants`}
      >
        <span className={cn("w-2.5 h-2.5 rounded-full", isRed ? "bg-red-400" : "bg-blue-400")} />
        <span className={cn("text-2xl font-mono font-bold leading-none", isRed ? "text-red-300" : "text-blue-300")}>
          {isRed ? state.redRemaining : state.blueRemaining}
        </span>
      </div>
    );
  };

  return (
    <div
      lang="fr"
      className="relative flex flex-1 flex-col gap-3 px-2 sm:px-6 pt-[max(env(safe-area-inset-top),12px)] max-w-5xl mx-auto w-full"
      style={{
        background: state.phase !== "game-over" ? boardGradient : undefined,
        paddingBottom: showSpyPill
          ? "calc(env(safe-area-inset-bottom) + 72px)"
          : "max(env(safe-area-inset-bottom), 16px)",
      }}
    >
      {/* En-tête : scores + chrono à gauche, coin haut-droit réservé à l'engrenage */}
      <div className="flex items-center gap-2 pr-14 min-h-[44px]">
        {scoreChip("red")}
        {scoreChip("blue")}
        {state.phase !== "game-over" && (
          <span
            className={cn(
              "ml-auto text-lg font-mono font-bold px-3 h-11 flex items-center rounded-xl",
              state.timeLeft <= 10
                ? "text-red-400 bg-red-500/10 animate-pulse"
                : "text-white/60 bg-white/[0.05]"
            )}
          >
            {state.timeLeft}s
          </span>
        )}
      </div>

      {/* Statut du tour / résultat */}
      {state.phase === "game-over" && state.winner ? (
        <div
          className="text-center rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-5 py-4"
          style={{
            boxShadow:
              state.winner === "red"
                ? "0 0 30px rgba(239,68,68,0.2)"
                : "0 0 30px rgba(59,130,246,0.2)",
          }}
        >
          <p className={cn("text-2xl sm:text-3xl font-serif font-semibold", TEAM_STYLES[state.winner].text)}>
            L&apos;équipe {state.winner === "red" ? "Rouge" : "Bleue"} gagne !
          </p>
          <p className="text-sm text-white/50 font-sans mt-1">{state.winReason}</p>
        </div>
      ) : (
        <p className="text-sm text-white/60 font-sans text-center">
          {state.phase === "spymaster-turn" && (
            <>
              Chef espion{" "}
              <span className={cn(teamStyle.text, "font-semibold")}>{teamStyle.label}</span>{" "}
              donne un indice
            </>
          )}
          {state.phase === "team-guess" && (
            <>
              Équipe <span className={cn(teamStyle.text, "font-semibold")}>{teamStyle.label}</span>{" "}
              devine
              <span className="text-white/45 ml-1">
                {state.currentClueCount === 0
                  ? "(essais illimités)"
                  : `(${state.guessesRemaining} essai${state.guessesRemaining !== 1 ? "s" : ""} restant${state.guessesRemaining !== 1 ? "s" : ""})`}
              </span>
            </>
          )}
        </p>
      )}

      {/* Indice en cours */}
      {state.currentClueWord && state.phase === "team-guess" && (
        <div className="flex justify-center">
          <div
            className={cn(
              "flex items-baseline gap-3 max-w-full px-5 py-2.5 rounded-2xl border-2 backdrop-blur-sm",
              teamStyle.border,
              teamStyle.bg
            )}
            style={{
              boxShadow:
                state.currentTeam === "red"
                  ? "0 0 25px rgba(239,68,68,0.2)"
                  : "0 0 25px rgba(59,130,246,0.2)",
            }}
          >
            <p className={cn("text-2xl sm:text-4xl font-serif font-bold tracking-wide break-words min-w-0", teamStyle.text)}>
              {state.currentClueWord}
            </p>
            <p className={cn("text-2xl font-mono font-bold opacity-80 shrink-0", teamStyle.text)}>
              {clueCountLabel(state.currentClueCount)}
            </p>
          </div>
        </div>
      )}

      {/* Saisie de l'indice (Chef espion) : 2 lignes sur mobile */}
      {isMySpymasterTurn && (
        <div className="flex flex-col gap-2 w-full max-w-xl mx-auto rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm p-3">
          <input
            ref={clueInputRef}
            type="text"
            value={clueWord}
            onChange={(e) => setClueWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                giveClue();
              }
            }}
            placeholder="Ton indice (un seul mot)"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="send"
            maxLength={30}
            className="w-full h-12 px-4 rounded-xl border border-white/[0.15] bg-white/[0.05] text-white font-sans text-base uppercase placeholder:normal-case placeholder:text-white/35 focus:outline-none focus:border-white/[0.35] focus:bg-white/[0.08] transition-all"
          />
          {clueHasSpace && (
            <p className="text-sm text-amber-300/90 font-sans">Un seul mot, sans espace.</p>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/45 font-sans shrink-0 mr-1">Mots</span>
            {[1, 2, 3, 4, 5, 0].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setClueCount(n)}
                aria-pressed={clueCount === n}
                aria-label={n === 0 ? "Illimité" : `${n} mot${n > 1 ? "s" : ""}`}
                className={cn(
                  "flex-1 h-11 rounded-xl font-mono text-lg font-bold border transition-all active:scale-95",
                  clueCount === n
                    ? cn(teamStyle.accent, "text-white border-transparent")
                    : "bg-white/[0.04] text-white/70 border-white/[0.12]"
                )}
              >
                {clueCountLabel(n)}
              </button>
            ))}
          </div>
          <button
            onClick={giveClue}
            disabled={!canSendClue}
            className={cn(
              "w-full h-12 rounded-xl font-sans text-base font-semibold transition-all duration-200 text-white",
              teamStyle.accent,
              teamStyle.accentActive,
              canSendClue
                ? state.currentTeam === "red"
                  ? "shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                  : "shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                : "",
              "disabled:bg-white/[0.06] disabled:text-white/30 disabled:shadow-none"
            )}
          >
            Donner l&apos;indice
          </button>
        </div>
      )}

      {/* Attente de l'indice */}
      {state.phase === "spymaster-turn" && !isMySpymasterTurn && (
        <div className="flex justify-center">
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 backdrop-blur-sm px-5 py-2.5">
            <p className="text-sm text-white/50 font-sans animate-pulse">
              {isMyTeamTurn && !state.isSpymaster
                ? "Votre Chef espion réfléchit…"
                : `Le Chef espion ${teamStyle.label.toLowerCase()} réfléchit…`}
            </p>
          </div>
        </div>
      )}

      {/* Grille 5×5 pleine largeur */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2.5 w-full">
        {state.cards?.map((card, index) => {
          const isRevealed = card.revealed;
          const spymasterColor = state.isSpymaster && !isRevealed ? card.color : null;
          const revealedColor = isRevealed ? card.color : null;
          const isBombRevealed = isRevealed && card.color === "assassin";
          const canClick = canGuess && !isRevealed;

          return (
            <button
              key={index}
              onClick={() => canClick && guess(index)}
              disabled={!canClick}
              className={cn(
                "relative min-h-[56px] sm:aspect-[3/2] rounded-xl sm:rounded-2xl border text-center font-sans font-bold uppercase transition-all duration-200 select-none flex items-center justify-center px-0.5 py-1 overflow-hidden",
                isRevealed && revealedColor && CARD_COLORS[revealedColor],
                isRevealed && revealedColor && CARD_GLOW[revealedColor],
                !isRevealed && spymasterColor && SPYMASTER_OVERLAY[spymasterColor],
                !isRevealed && !spymasterColor && "bg-white/[0.06] border-white/[0.14] backdrop-blur-sm",
                canClick && "cursor-pointer active:scale-[0.95] active:bg-white/[0.14]",
                !canClick && "cursor-default"
              )}
            >
              {(isBombRevealed || (!isRevealed && spymasterColor === "assassin")) && (
                <BombIcon className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/60" />
              )}
              <span
                className={cn(
                  "w-full leading-tight break-words hyphens-auto",
                  wordSizeClass(card.word),
                  isRevealed
                    ? revealedColor === "neutral"
                      ? "text-stone-800/80"
                      : "text-white/85"
                    : "text-white/95"
                )}
              >
                {card.word}
              </span>
            </button>
          );
        })}
      </div>

      {/* Légende Chef espion */}
      {state.isSpymaster && state.phase !== "game-over" && (
        <div className="flex items-center justify-center gap-3 text-xs text-white/50 font-sans">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-stone-300/60" />Neutre</span>
          <span className="flex items-center gap-1"><BombIcon className="w-3.5 h-3.5" />La Bombe</span>
        </div>
      )}

      {/* Finir le tour */}
      {canGuess && (
        <div className="flex justify-center">
          <button
            onClick={endTurn}
            className="min-h-[44px] px-8 py-3 rounded-xl border border-white/[0.15] bg-black/30 backdrop-blur-sm active:bg-white/[0.1] text-white/70 font-sans text-sm font-medium transition-all duration-200"
          >
            Finir le tour
          </button>
        </div>
      )}

      {/* Équipes */}
      <div className="flex gap-3 mt-auto pt-3 border-t border-white/[0.08]">
        {(["red", "blue"] as Team[]).map((team) => {
          const isRed = team === "red";
          const players = isRed ? redPlayers : bluePlayers;
          return (
            <div key={team} className={cn("flex-1 min-w-0", !isRed && "text-right")}>
              <p className={cn("text-xs font-sans mb-1.5 font-semibold uppercase tracking-widest", isRed ? "text-red-400/70" : "text-blue-400/70")}>
                Équipe {isRed ? "Rouge" : "Bleue"}
              </p>
              <div className={cn("flex flex-wrap gap-1.5", !isRed && "justify-end")}>
                {players.map((p) => (
                  <span
                    key={p.id}
                    className={cn(
                      "text-xs font-sans px-2.5 py-1 rounded-lg border max-w-full truncate",
                      p.isSpymaster
                        ? isRed
                          ? "border-red-500/40 bg-red-500/15 text-red-200"
                          : "border-blue-500/40 bg-blue-500/15 text-blue-200"
                        : isRed
                          ? "border-red-500/15 bg-red-500/5 text-red-300/80"
                          : "border-blue-500/15 bg-blue-500/5 text-blue-300/80",
                      p.id === playerId && (isRed ? "ring-1 ring-red-400/40" : "ring-1 ring-blue-400/40")
                    )}
                  >
                    {p.isSpymaster && <span className="mr-1 text-cyan-300">Chef ·</span>}
                    {p.name}
                    {p.id === playerId && " (toi)"}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pastille Chef espion */}
      {showSpyPill && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full border border-cyan-500/30 bg-cyan-950/70 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)] max-w-[calc(100%-24px)]"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
        >
          <p className="text-xs sm:text-sm text-cyan-300 font-sans font-medium tracking-wide text-center">
            Tu es Chef espion : tu vois les couleurs secrètes
          </p>
        </div>
      )}

      {error && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl border border-red-500/30 bg-red-950/80 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.15)] max-w-[calc(100%-96px)]"
          style={{ top: "calc(max(env(safe-area-inset-top), 12px) + 4px)" }}
        >
          <p className="text-sm text-red-300 font-sans">{error}</p>
        </div>
      )}
    </div>
  );
}
