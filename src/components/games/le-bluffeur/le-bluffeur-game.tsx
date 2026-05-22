"use client";

import { useCallback, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

const ACCENT = "#7c5cff";

interface BluffPlayerState {
  id: string;
  name: string;
  score: number;
  hasFake: boolean;
  hasVoted: boolean;
  foundTruth: boolean | null;
}

interface OptionState {
  id: string;
  text: string;
  isTruth: boolean | null;
  authors: string[] | null;
  voterNames: string[] | null;
  voteCount: number | null;
}

interface BluffState {
  phase: "waiting" | "writing" | "voting" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  timeLeft: number;
  question: string | null;
  trueAnswer: string | null;
  options: OptionState[] | null;
  roundPoints: Record<string, number> | null;
  players: BluffPlayerState[];
  myFake: string | null;
  myVote: string | null;
  iFoundTruth: boolean;
}

export default function LeBluffeurGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "le-bluffeur", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as BluffState;

  const writeKey = `${state?.round ?? 0}-write`;
  const [fakeInput, setFakeInput] = useKeyedState<string>(writeKey, "");
  const fakeRef = useRef<HTMLInputElement>(null);

  const submitFake = useCallback(() => {
    const t = fakeInput.trim();
    if (!t || state?.myFake) return;
    sendAction({ action: "submit-fake", fake: t });
  }, [fakeInput, state?.myFake, sendAction]);

  const vote = useCallback(
    (optionId: string) => {
      if (state?.myVote) return;
      sendAction({ action: "vote", optionId });
    },
    [state?.myVote, sendAction]
  );

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return <Centered emoji="🎭" text="Préparation des questions..." />;
  }

  // ── WRITING ─────────────────────────────────────────────
  if (state.phase === "writing") {
    const submitted = !!state.myFake;
    const submittedCount = state.players?.filter((p) => p.hasFake).length ?? 0;
    return (
      <Shell round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={40} label="Invente une fausse réponse">
        <QuestionCard question={state.question} />
        {!submitted ? (
          <div className="w-full max-w-md mt-6">
            <div className="flex gap-2">
              <input
                ref={fakeRef}
                value={fakeInput}
                onChange={(e) => setFakeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitFake()}
                placeholder="Ta fausse réponse crédible..."
                maxLength={80}
                autoComplete="off"
                className="flex-1 rounded-2xl border border-white/20 bg-black/40 px-4 py-3.5 font-sans text-base text-white/90 placeholder:text-white/25 outline-none transition-all focus:border-[#7c5cff]/60"
              />
              <button
                onClick={submitFake}
                disabled={!fakeInput.trim()}
                className="px-6 rounded-2xl font-sans text-sm font-semibold text-white transition-all disabled:opacity-30"
                style={{ background: `linear-gradient(135deg, #5b8cff, ${ACCENT})` }}
              >
                OK
              </button>
            </div>
            <p className="text-[11px] text-white/30 font-sans mt-3 text-center">
              Le but : faire croire que c&apos;est la vraie réponse 😏
            </p>
          </div>
        ) : (
          <Waiting text={`Bluff envoyé ! ${submittedCount}/${state.players.length} joueurs prêts`} />
        )}
        <Progress players={state.players} done={(p) => p.hasFake} />
      </Shell>
    );
  }

  // ── VOTING ──────────────────────────────────────────────
  if (state.phase === "voting") {
    const voted = !!state.myVote;
    return (
      <Shell round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} label="Trouve la vraie réponse">
        <QuestionCard question={state.question} />
        {state.iFoundTruth ? (
          <Waiting text="Tu as écrit la vraie réponse ! 🎯 En attente des votes..." />
        ) : !voted ? (
          <div className="w-full max-w-md mt-5 space-y-2.5">
            {state.options?.map((o) => {
              const isMine = state.myFake && o.text.toLowerCase().trim() === state.myFake.toLowerCase().trim();
              return (
                <button
                  key={o.id}
                  onClick={() => !isMine && vote(o.id)}
                  disabled={!!isMine}
                  className={cn(
                    "w-full text-left rounded-2xl border px-4 py-3.5 font-sans text-sm transition-all",
                    isMine
                      ? "border-white/10 bg-white/[0.02] text-white/30 cursor-not-allowed"
                      : "border-white/15 bg-black/40 text-white/85 hover:border-[#7c5cff]/60 hover:bg-[#7c5cff]/10 active:scale-[0.99]"
                  )}
                >
                  {o.text}
                  {isMine && <span className="text-[10px] text-white/30 ml-2">(ton bluff)</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <Waiting text="Vote enregistré ! En attente des autres..." />
        )}
        <Progress players={state.players} done={(p) => p.hasVoted} />
      </Shell>
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const myPts = state.roundPoints?.[playerId] ?? 0;
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 overflow-y-auto"
        style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}1c, transparent 45%), #060606` }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-2 mt-1">
          Manche {state.round}/{state.totalRounds} — Révélation
        </span>
        <p className="text-sm text-white/40 font-sans text-center mb-1 px-4">{state.question}</p>
        <p className="text-xl font-serif font-semibold text-emerald-400 text-center mb-4">
          ✓ {state.trueAnswer}
        </p>

        <div className="w-full max-w-md space-y-2">
          {state.options?.map((o) => (
            <div
              key={o.id}
              className={cn(
                "rounded-2xl border px-4 py-3 backdrop-blur-sm",
                o.isTruth ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-black/35"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-sans font-semibold text-white/90">
                  {o.isTruth ? "✓ " : ""}
                  {o.text}
                </span>
                <span className="text-xs font-mono text-white/40 shrink-0">
                  {o.voteCount ?? 0} vote{(o.voteCount ?? 0) > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                {o.isTruth ? (
                  <span className="text-[11px] text-emerald-400/70 font-sans">La vérité</span>
                ) : (
                  <span className="text-[11px] text-rose-400/70 font-sans">
                    Bluff de {o.authors?.join(", ") || "?"}
                  </span>
                )}
                {(o.voterNames?.length ?? 0) > 0 && (
                  <span className="text-[11px] text-white/35 font-sans">
                    voté par {o.voterNames?.join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-5 px-5 py-2.5 rounded-2xl border font-sans text-sm"
          style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}14`, color: "#fff" }}
        >
          Tu marques <span className="font-bold">+{myPts}</span> pts cette manche
        </div>
        <p className="text-[11px] text-white/25 font-sans mt-4 animate-pulse">Manche suivante...</p>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    return <Scoreboard players={state.players} playerId={playerId} />;
  }

  return (
    <Centered emoji="🎭" text={error ?? "Chargement..."} />
  );
}

// ── Shared sub-components ─────────────────────────────────
function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}12, transparent 45%), #060606` }}>
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/30" style={{ boxShadow: `0 0 40px ${ACCENT}22` }}>
        <span className="text-4xl">{emoji}</span>
      </div>
      <p className="text-white/40 animate-pulse font-sans text-lg text-center">{text}</p>
    </div>
  );
}

function Shell({
  round,
  total,
  timeLeft,
  max,
  label,
  children,
}: {
  round: number;
  total: number;
  timeLeft: number;
  max: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center p-5 md:p-6" style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}14, transparent 45%), #060606` }}>
      <div className="flex w-full max-w-md items-center justify-between mb-1">
        <span className="text-xs text-white/25 font-sans tracking-wide">Manche {round}/{total}</span>
        <span className={cn("text-lg font-mono font-bold", timeLeft <= 5 ? "text-rose-400 animate-pulse" : "text-white/40")}>{timeLeft}s</span>
      </div>
      <div className="w-full max-w-md h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / max) * 100}%`, background: `linear-gradient(90deg, #5b8cff, ${ACCENT})` }} />
      </div>
      <p className="text-[10px] text-white/30 font-sans uppercase tracking-[0.2em] mb-2">{label}</p>
      {children}
    </div>
  );
}

function QuestionCard({ question }: { question: string | null }) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm p-5 mt-2" style={{ boxShadow: `0 0 40px ${ACCENT}18` }}>
      <p className="text-xl font-serif font-semibold text-white/95 text-center leading-snug">{question}</p>
    </div>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/15 bg-black/40 px-5 py-4 max-w-md">
      <p className="text-sm text-white/50 font-sans text-center animate-pulse">{text}</p>
    </div>
  );
}

function Progress({ players, done }: { players: BluffPlayerState[]; done: (p: BluffPlayerState) => boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-auto pt-5">
      {players?.map((p) => (
        <div key={p.id} className={cn("px-3 py-1.5 rounded-xl border text-[11px] font-sans transition-all", done(p) ? "border-white/25 bg-black/40 text-white/70" : "border-white/[0.06] bg-black/15 text-white/30")}>
          {p.name} {done(p) ? "✓" : "…"}
        </div>
      ))}
    </div>
  );
}

function Scoreboard({ players, playerId }: { players: BluffPlayerState[]; playerId: string }) {
  const sorted = [...(players ?? [])].sort((a, b) => b.score - a.score);
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}18, transparent 45%), #060606` }}>
      <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-2">Partie terminée</span>
      <p className="text-4xl mb-6">🎭</p>
      <div className="w-full max-w-sm space-y-2.5">
        {sorted.map((p, i) => (
          <div key={p.id} className={cn("flex items-center justify-between rounded-3xl border p-4 backdrop-blur-sm", i === 0 ? "border-[#7c5cff]/40 bg-[#7c5cff]/10" : "border-white/10 bg-black/30")} style={i === 0 ? { boxShadow: `0 0 25px ${ACCENT}33` } : undefined}>
            <div className="flex items-center gap-3">
              <span className={cn("text-xl font-mono font-bold w-8", i === 0 ? "text-[#a896ff]" : "text-white/25")}>#{i + 1}</span>
              <span className={cn("text-sm font-sans font-semibold", i === 0 ? "text-white/90" : "text-white/45")}>{p.name}{p.id === playerId && " (toi)"}</span>
            </div>
            <span className={cn("text-xl font-mono font-bold", i === 0 ? "text-[#a896ff]" : "text-white/40")}>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
