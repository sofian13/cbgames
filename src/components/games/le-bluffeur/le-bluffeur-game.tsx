"use client";

import { useCallback, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";

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

// Stable color per player
const COLORS: MascotColor[] = ["purple", "pink", "yellow", "mint", "sky", "coral", "lavender"];
function colorFor(id: string): MascotColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
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

  const vote = useCallback((optionId: string) => {
    if (state?.myVote) return;
    sendAction({ action: "vote", optionId });
  }, [state?.myVote, sendAction]);

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return <Centered emoji="🎭" text="Préparation des questions..." />;
  }

  // ── WRITING ─────────────────────────────────────────────
  if (state.phase === "writing") {
    const submitted = !!state.myFake;
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
                className="flex-1 rounded-2xl border px-4 py-3.5 text-base outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(91,54,214,0.35)",
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                }}
              />
              <button
                onClick={submitFake}
                disabled={!fakeInput.trim()}
                className="af-btn af-btn-primary disabled:opacity-30"
                style={{ padding: "0 24px", fontSize: 14 }}
              >
                OK
              </button>
            </div>
            <p className="mt-3 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
              💡 Le but : faire croire que c&apos;est la vraie réponse 😏
            </p>
          </div>
        ) : (
          <Waiting text={`Bluff envoyé ! ${state.players.filter(p => p.hasFake).length}/${state.players.length} joueurs prêts`} />
        )}
        <PlayerProgress players={state.players} done={(p) => p.hasFake} selfId={playerId} />
      </Shell>
    );
  }

  // ── VOTING ──────────────────────────────────────────────
  if (state.phase === "voting") {
    const voted = !!state.myVote;
    return (
      <Shell round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} label="Trouve la VRAIE réponse">
        {/* Reminder of question */}
        <div className="mx-auto mt-3 max-w-md rounded-xl border border-dashed px-4 py-2"
             style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.15)" }}>
          <p className="af-eyebrow mb-1">La question</p>
          <p className="text-sm" style={{ color: "var(--text-dim)", lineHeight: 1.35 }}>{state.question}</p>
        </div>

        {state.iFoundTruth ? (
          <Waiting text="Tu as écrit la vraie réponse ! 🎯 En attente des votes des autres..." />
        ) : !voted ? (
          <div className="w-full max-w-md mt-4 space-y-2">
            {state.options?.map((o, i) => {
              const isMine = state.myFake && o.text.toLowerCase().trim() === state.myFake.toLowerCase().trim();
              return (
                <button
                  key={o.id}
                  onClick={() => !isMine && vote(o.id)}
                  disabled={!!isMine}
                  className={cn(
                    "w-full text-left rounded-2xl border px-4 py-3.5 transition-all flex items-center gap-3",
                    isMine
                      ? "cursor-not-allowed opacity-40"
                      : "hover:scale-[1.01] active:scale-[0.99]",
                  )}
                  style={{
                    background: isMine ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                    borderColor: isMine ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black"
                       style={{
                         background: "rgba(255,255,255,0.08)",
                         color: "var(--text-muted)",
                         fontFamily: "var(--font-display)",
                       }}>
                    {"ABCDEFGH"[i]}
                  </div>
                  <span className="text-sm text-white/85">
                    {o.text}
                    {isMine && <span className="ml-2 text-[10px] text-white/30">(ton bluff)</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <Waiting text="Vote enregistré ! En attente des autres..." />
        )}
        <PlayerProgress players={state.players} done={(p) => p.hasVoted} selfId={playerId} />
      </Shell>
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const myPts = state.roundPoints?.[playerId] ?? 0;
    const truthOption = state.options?.find(o => o.isTruth);
    const bluffs = state.options?.filter(o => !o.isTruth) ?? [];
    const playerById = new Map(state.players.map(p => [p.id, p]));

    return (
      <div className="relative flex flex-1 flex-col items-center overflow-y-auto p-5"
           style={{
             background: "radial-gradient(circle at 50% 25%, #FF3EA5 0%, #5B36D6 40%, #0E0828 100%)",
           }}>
        <ConfettiBurst count={60} />
        <Sparkles count={14} />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-4">
            <p className="af-eyebrow" style={{ color: "var(--af-yellow)", letterSpacing: 3 }}>✦ La vraie réponse ✦</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>{state.question}</p>
          </div>

          {/* TRUTH CARD — spectacular big yellow */}
          {truthOption && (
            <div
              className="relative mb-5 rounded-3xl p-5"
              style={{
                background: "linear-gradient(160deg, var(--af-yellow), #FFA800)",
                boxShadow: "0 20px 60px rgba(255,210,63,0.5), 0 0 0 4px rgba(255,210,63,0.2)",
                animation: "af-slide-up .6s ease-out",
              }}
            >
              <div className="absolute left-1/2 -top-3 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black tracking-wider"
                   style={{ background: "var(--af-mint)", color: "#0E0828" }}>
                VÉRITÉ ✓
              </div>
              <p className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.55)" }}>La bonne réponse était…</p>
              <p className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#1A0E2E", letterSpacing: -0.5, lineHeight: 1.1 }}>
                {state.trueAnswer ?? truthOption.text}
              </p>
              {(truthOption.voterNames?.length ?? 0) > 0 && (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
                   style={{ background: "rgba(0,0,0,0.12)", color: "#3A1B00" }}>
                  ✓ Trouvée par {truthOption.voterNames?.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* BLUFFS UNVEILED */}
          <p className="af-eyebrow mb-2 text-center" style={{ color: "var(--text-muted)" }}>✘ Les bluffs démasqués</p>
          <div className="space-y-2">
            {bluffs.map((o) => {
              const authorId = state.players.find(p => p.name === o.authors?.[0])?.id;
              const color: MascotColor = authorId ? colorFor(authorId) : "coral";
              const voterCount = o.voteCount ?? 0;
              return (
                <div key={o.id}
                     className="flex items-center gap-3 rounded-2xl border p-3"
                     style={{
                       background: "rgba(0,0,0,0.4)",
                       borderColor: "rgba(255,255,255,0.08)",
                       backdropFilter: "blur(6px)",
                     }}>
                  <MascotAvatar color={color} size={32} mood={voterCount > 0 ? "wink" : "neutral"} border={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{o.authors?.[0] ?? "?"}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>a écrit :</span>
                    </div>
                    <p className="truncate text-xs italic" style={{ color: "var(--text-dim)" }}>
                      &ldquo;{o.text}&rdquo;
                    </p>
                  </div>
                  {voterCount > 0 ? (
                    <span className="cb-mono text-xs font-bold" style={{ color: "var(--af-mint)" }}>
                      +{voterCount * 500}
                    </span>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>0 piégé</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* YOUR POINTS */}
          <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl border px-5 py-3"
               style={{
                 background: "rgba(91,54,214,0.18)",
                 borderColor: "rgba(91,54,214,0.45)",
               }}>
            <span className="text-sm">Tu marques</span>
            <span className="cb-display-md" style={{ color: "var(--af-yellow)", fontSize: 24 }}>+{myPts} pts</span>
          </div>
          <p className="mt-3 animate-pulse text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
            Manche suivante…
          </p>
        </div>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    return <BluffScoreboard players={state.players} playerId={playerId} />;
  }

  return <Centered emoji="🎭" text={error ?? "Chargement..."} />;
}

// ── Sub-components ────────────────────────────────────────
function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border"
           style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", boxShadow: "0 0 40px rgba(91,54,214,0.3)" }}>
        <span className="text-4xl">{emoji}</span>
      </div>
      <p className="animate-pulse text-center text-lg" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}

function Shell({
  round, total, timeLeft, max, label, children,
}: {
  round: number; total: number; timeLeft: number; max: number; label: string; children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center p-5 md:p-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <span className="af-chip">Manche {round}/{total}</span>
        <span className={cn("cb-mono text-lg font-bold", timeLeft <= 5 ? "animate-pulse" : "")}
              style={{ color: timeLeft <= 5 ? "var(--af-coral)" : "var(--text-muted)" }}>
          {timeLeft}s
        </span>
      </div>
      <div className="mb-3 mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-linear"
             style={{
               width: `${(timeLeft / max) * 100}%`,
               background: "linear-gradient(90deg, var(--cb-brand), var(--af-pink))",
             }} />
      </div>
      <p className="af-eyebrow mb-3" style={{ color: "var(--af-yellow)" }}>{label}</p>
      {children}
    </div>
  );
}

function QuestionCard({ question }: { question: string | null }) {
  return (
    <div className="relative w-full max-w-md mt-3">
      <div className="absolute" style={{ inset: "8px -6px -6px 6px", background: "rgba(255,62,165,0.4)", borderRadius: 28, filter: "blur(0.5px)" }} />
      <div className="absolute" style={{ inset: "4px -3px -3px 3px", background: "rgba(91,54,214,0.6)", borderRadius: 28 }} />
      <div className="relative rounded-3xl p-6"
           style={{
             background: "linear-gradient(160deg, #F5F1E8 0%, #FFE4D2 100%)",
             boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
           }}>
        <div className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-base font-black text-white"
             style={{ background: "var(--cb-brand)", fontFamily: "var(--font-display)" }}>
          ?
        </div>
        <p className="text-xl text-center leading-snug"
           style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#1A0E2E", letterSpacing: -0.4 }}>
          {question}
        </p>
      </div>
    </div>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <div className="mt-6 max-w-md rounded-2xl border px-5 py-4"
         style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}>
      <p className="animate-pulse text-center text-sm" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}

function PlayerProgress({ players, done, selfId }: {
  players: BluffPlayerState[];
  done: (p: BluffPlayerState) => boolean;
  selfId: string;
}) {
  return (
    <div className="mt-auto flex flex-wrap justify-center gap-2 pt-5">
      {players?.map((p) => {
        const c = colorFor(p.id);
        const isDone = done(p);
        return (
          <div key={p.id} className="relative">
            <MascotAvatar color={c} size={36} mood={isDone ? "wink" : "shifty"} border={p.id === selfId} />
            {isDone && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-black text-white"
                   style={{ background: "var(--af-mint)", borderColor: "#0E0828" }}>
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BluffScoreboard({ players, playerId }: { players: BluffPlayerState[]; playerId: string }) {
  const sorted = [...(players ?? [])].sort((a, b) => b.score - a.score);
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-6">
      <ConfettiBurst count={50} />
      <div className="relative z-10 w-full max-w-sm">
        <p className="af-eyebrow text-center" style={{ color: "var(--af-yellow)" }}>Partie terminée</p>
        <h2 className="cb-display-lg text-center mt-2">🎭 Résultats</h2>
        <div className="mt-6 space-y-2.5">
          {sorted.map((p, i) => {
            const c = colorFor(p.id);
            return (
              <div key={p.id}
                   className="flex items-center justify-between rounded-3xl border p-4"
                   style={{
                     background: i === 0
                       ? `linear-gradient(120deg, ${MASCOT_PALETTE[c].body}30, rgba(255,255,255,0.04))`
                       : "rgba(255,255,255,0.04)",
                     borderColor: i === 0 ? `${MASCOT_PALETTE[c].body}55` : "rgba(255,255,255,0.10)",
                     boxShadow: i === 0 ? `0 0 25px ${MASCOT_PALETTE[c].body}33` : undefined,
                   }}>
                <div className="flex items-center gap-3">
                  <span className="cb-mono w-8 text-xl font-bold" style={{ color: i === 0 ? MASCOT_PALETTE[c].body : "var(--text-muted)" }}>#{i + 1}</span>
                  <MascotAvatar color={c} size={36} mood={i === 0 ? "wink" : "neutral"} />
                  <span className="text-sm font-bold" style={{ color: i === 0 ? "#fff" : "var(--text-dim)" }}>
                    {p.name}{p.id === playerId && " (toi)"}
                  </span>
                </div>
                <span className="cb-mono text-xl font-bold" style={{ color: i === 0 ? MASCOT_PALETTE[c].body : "var(--text-muted)" }}>{p.score}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
