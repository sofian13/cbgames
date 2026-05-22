"use client";

import { useCallback, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";

const BAND_WIDE = 22;
const BAND_MID  = 12;
const BAND_TIGHT = 5;

interface WavePlayerState {
  id: string;
  name: string;
  score: number;
  isPsychic: boolean;
  hasGuessed: boolean;
}

interface Spectrum { left: string; right: string; }

interface WaveState {
  phase: "waiting" | "intro" | "clue" | "guessing" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  timeLeft: number;
  psychicId: string | null;
  psychicName: string | null;
  spectrum: Spectrum | null;
  clue: string | null;
  target: number | null;
  guesses: Record<string, number> | null;
  roundPoints: Record<string, number> | null;
  players: WavePlayerState[];
  amPsychic: boolean;
  myGuess: number | null;
  myTarget: number | null;
}

const COLORS: MascotColor[] = ["purple", "pink", "yellow", "mint", "sky", "coral", "lavender"];
function colorFor(id: string): MascotColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

export default function LongueurOndeGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "longueur-onde", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as WaveState;

  const clueKey = `${state?.round ?? 0}-clue`;
  const [clueInput, setClueInput] = useKeyedState<string>(clueKey, "");

  const submitClue = useCallback(() => {
    const t = clueInput.trim();
    if (!t) return;
    sendAction({ action: "submit-clue", clue: t });
  }, [clueInput, sendAction]);

  const nameOf = useCallback((id: string) => state?.players?.find((p) => p.id === id)?.name ?? "?", [state?.players]);

  if (!state || state.phase === "waiting") {
    return <Centered emoji="📡" text="Calibrage des ondes..." />;
  }

  // ── INTRO ───────────────────────────────────────────────
  if (state.phase === "intro") {
    const psychicColor: MascotColor = state.psychicId ? colorFor(state.psychicId) : "purple";
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6">
        <Sparkles count={10} />
        <p className="af-eyebrow mb-6">Manche {state.round} / {state.totalRounds}</p>
        <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>Le Médium de ce tour est</p>
        <Mascot size={120} color={psychicColor} mood="wink" arms crown delay={0} />
        <h2 className="cb-display-xl mt-4" style={{ letterSpacing: -1.5, fontSize: "clamp(2rem, 7vw, 3.5rem)", textShadow: "0 0 40px rgba(91,54,214,0.5)" }}>
          {state.psychicName}
          {state.amPsychic && <span style={{ color: "var(--text-dim)", fontSize: "0.5em" }}> (toi)</span>}
        </h2>
        <p className="mt-6 max-w-xs animate-pulse text-center text-xs" style={{ color: "var(--text-muted)" }}>
          {state.amPsychic
            ? "Tu vas voir une cible secrète et donner un indice"
            : "Tu devras deviner où le Médium vise sur le curseur"}
        </p>
      </div>
    );
  }

  // ── CLUE — psychic gives a clue ─────────────────────────
  if (state.phase === "clue") {
    if (state.amPsychic) {
      return (
        <div className="flex flex-1 flex-col items-center p-5">
          <RoundHeader round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={45} role="🔮 Médium" />
          <p className="mt-4 max-w-md text-center text-base" style={{ color: "var(--text-dim)" }}>
            La cible est ici — trouve un <span style={{ color: "var(--af-yellow)" }}>indice</span> qui la situe.
          </p>
          <SpectrumDial spectrum={state.spectrum} target={state.myTarget} mode="psychic" />
          <div className="mt-6 w-full max-w-md">
            <div className="flex gap-2">
              <input
                value={clueInput}
                onChange={(e) => setClueInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitClue()}
                placeholder="Ton indice (un mot, un exemple...)"
                maxLength={60}
                autoComplete="off"
                className="flex-1 rounded-2xl border px-4 py-3.5 text-base outline-none transition"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(91,54,214,0.35)",
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                }}
              />
              <button onClick={submitClue} disabled={!clueInput.trim()}
                      className="af-btn af-btn-primary disabled:opacity-30" style={{ padding: "0 24px", fontSize: 14 }}>
                Envoyer
              </button>
            </div>
            <p className="mt-3 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
              💡 Ni trop vague, ni trop évident
            </p>
          </div>
        </div>
      );
    }
    return <Centered emoji="🔮" text={`${state.psychicName} cherche un indice...`} />;
  }

  // ── GUESSING ────────────────────────────────────────────
  if (state.phase === "guessing") {
    if (state.amPsychic) {
      const guessed = state.players?.filter((p) => !p.isPsychic && p.hasGuessed).length ?? 0;
      const total = state.players?.filter((p) => !p.isPsychic).length ?? 0;
      return (
        <div className="flex flex-1 flex-col items-center p-5">
          <RoundHeader round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} role="🔮 Médium" />
          <ClueBadge clue={state.clue} authorName={state.psychicName} />
          <SpectrumDial spectrum={state.spectrum} target={state.myTarget} mode="psychic" />
          <Waiting text={`${guessed}/${total} ont placé leur curseur...`} />
        </div>
      );
    }
    return (
      <GuessBoard
        key={`${state.round}-guess`}
        spectrum={state.spectrum}
        clue={state.clue}
        round={state.round}
        total={state.totalRounds}
        timeLeft={state.timeLeft}
        submitted={state.myGuess != null}
        onSubmit={(g) => sendAction({ action: "submit-guess", guess: g })}
        psychicName={state.psychicName}
      />
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const markers = Object.entries(state.guesses ?? {}).map(([id, val]) => ({
      value: val,
      label: nameOf(id),
      isMe: id === playerId,
      color: colorFor(id),
    }));
    const myPts = state.roundPoints?.[playerId] ?? 0;
    const bullseye = myPts >= 4;

    return (
      <div className="relative flex flex-1 flex-col items-center overflow-y-auto p-5">
        {bullseye && <ConfettiBurst count={50} />}
        <Sparkles count={8} />

        <div className="relative z-10 w-full">
          <div className="text-center">
            <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>
              {bullseye ? "✦ Bullseye !" : "Révélation"}
            </p>
            <h2 className="cb-display-xl mt-2" style={{ letterSpacing: -1.5, lineHeight: 0.95, fontSize: "clamp(2rem, 6vw, 3rem)" }}>
              +<span style={{ color: "var(--af-yellow)" }}>{myPts}</span> pts
            </h2>
            {bullseye && (
              <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
                Vous êtes vraiment sur la même longueur d&apos;onde.
              </p>
            )}
          </div>
          <ClueBadge clue={state.clue} authorName={state.psychicName} />
          <SpectrumDial spectrum={state.spectrum} target={state.target} markers={markers} mode="reveal" />
          <div className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3"
               style={{
                 background: "rgba(91,54,214,0.18)",
                 borderColor: "rgba(91,54,214,0.45)",
               }}>
            <span className="text-sm">{state.amPsychic ? "Ton indice rapporte" : "Tu marques"}</span>
            <span className="cb-display-md" style={{ color: "var(--af-yellow)", fontSize: 22 }}>+{myPts}</span>
          </div>
          <p className="mt-4 animate-pulse text-center text-[11px]" style={{ color: "var(--text-muted)" }}>Manche suivante…</p>
        </div>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    const sorted = [...(state.players ?? [])].sort((a, b) => b.score - a.score);
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6">
        <ConfettiBurst count={50} />
        <div className="relative z-10 w-full max-w-sm">
          <p className="af-eyebrow text-center" style={{ color: "var(--af-yellow)" }}>Partie terminée</p>
          <h2 className="cb-display-lg mt-2 text-center">📡 Résultats</h2>
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

  return <Centered emoji="📡" text={error ?? "Chargement..."} />;
}

// ── Guess board with interactive slider ───────────────────
function GuessBoard({
  spectrum, clue, round, total, timeLeft, submitted, onSubmit, psychicName,
}: {
  spectrum: Spectrum | null; clue: string | null;
  round: number; total: number; timeLeft: number;
  submitted: boolean; onSubmit: (g: number) => void;
  psychicName: string | null;
}) {
  const [value, setValue] = useState(50);
  const [sent, setSent] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setValue(Math.max(0, Math.min(100, Math.round(pct))));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (sent || submitted) return;
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    setFromClientX(e.clientX);
  };
  const onPointerUp = () => { dragging.current = false; };

  const submit = () => { if (!sent && !submitted) { setSent(true); onSubmit(value); } };
  const locked = sent || submitted;

  return (
    <div className="flex flex-1 flex-col items-center p-5">
      <RoundHeader round={round} total={total} timeLeft={timeLeft} max={30} role="Place le curseur" />
      <ClueBadge clue={clue} authorName={psychicName} />

      <div className="w-full max-w-md mt-6">
        {/* Spectrum labels */}
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: `${MASCOT_PALETTE.sky.body}22`, color: MASCOT_PALETTE.sky.body }}>
            {spectrum?.left}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>↔</span>
          <span className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: `${MASCOT_PALETTE.pink.body}22`, color: MASCOT_PALETTE.pink.body }}>
            {spectrum?.right}
          </span>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative h-20 cursor-pointer select-none rounded-full"
          style={{
            touchAction: "none",
            background: "linear-gradient(90deg, #4ECDC4 0%, #5B36D6 50%, #FF3EA5 100%)",
            boxShadow: "inset 0 4px 16px rgba(0,0,0,0.4), 0 8px 24px rgba(91,54,214,0.3)",
          }}
        >
          {/* Tick marks */}
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="absolute top-1/2 h-3 w-px -translate-y-1/2"
                 style={{ left: `${i * 10}%`, background: "rgba(255,255,255,0.3)" }} />
          ))}

          {/* KNOB */}
          <div
            className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform", locked ? "" : "scale-100")}
            style={{ left: `${value}%` }}
          >
            {!locked && (
              <div className="absolute -inset-3 rounded-full border-2"
                   style={{ borderColor: "rgba(255,255,255,0.3)", animation: "af-pulse-ring 1.8s ease-out infinite" }} />
            )}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full"
                 style={{
                   background: "linear-gradient(135deg, #fff 0%, #F0E8FF 100%)",
                   boxShadow: "0 8px 20px rgba(0,0,0,0.4), 0 0 0 6px rgba(91,54,214,0.25)",
                   color: "var(--cb-brand)",
                   fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
                 }}>
              {value}
            </div>
          </div>
        </div>
      </div>

      <button onClick={submit} disabled={locked}
              className="af-btn af-btn-primary mt-8 w-full max-w-md disabled:opacity-50"
              style={{ padding: "16px", fontSize: 15 }}>
        {locked ? "Curseur placé ✓" : "Valider la position"}
      </button>
    </div>
  );
}

// ── Spectrum dial (read-only display) ─────────────────────
function SpectrumDial({
  spectrum, target, markers = [], mode,
}: {
  spectrum: Spectrum | null;
  target: number | null;
  markers?: { value: number; label: string; isMe: boolean; color: MascotColor }[];
  mode: "psychic" | "reveal";
}) {
  return (
    <div className="w-full max-w-md mt-4">
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: `${MASCOT_PALETTE.sky.body}22`, color: MASCOT_PALETTE.sky.body }}>
          {spectrum?.left}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>↔</span>
        <span className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: `${MASCOT_PALETTE.pink.body}22`, color: MASCOT_PALETTE.pink.body }}>
          {spectrum?.right}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-20 overflow-hidden rounded-full"
           style={{
             background: "linear-gradient(90deg, #4ECDC4 0%, #5B36D6 50%, #FF3EA5 100%)",
             boxShadow: "inset 0 4px 16px rgba(0,0,0,0.4)",
           }}>
        {/* Score zones — psychic sees target, reveal shows them too */}
        {target != null && (
          <>
            <Zone center={target} half={BAND_WIDE}  color="rgba(255,255,255,0.10)" />
            <Zone center={target} half={BAND_MID}   color="rgba(255,210,63,0.30)" />
            <Zone center={target} half={BAND_TIGHT} color="rgba(255,62,165,0.65)" />
            {/* Pts labels at reveal */}
            {mode === "reveal" && (
              <>
                <ZoneLabel value="5" center={target} y={"50%"} bold />
                <ZoneLabel value="3" center={target - 8} y={"50%"} />
                <ZoneLabel value="2" center={target - 17} y={"50%"} />
              </>
            )}
            {/* Target line */}
            <div className="absolute top-0 bottom-0 w-1 bg-white"
                 style={{ left: `${target}%`, transform: "translateX(-50%)", boxShadow: "0 0 14px rgba(255,255,255,0.8)" }} />
          </>
        )}
      </div>

      {/* Markers below for reveal */}
      {markers.length > 0 && (
        <div className="relative mt-2 h-12">
          {markers.map((m, i) => (
            <div key={i} className="absolute flex -translate-x-1/2 flex-col items-center"
                 style={{ left: `${m.value}%`, top: i % 2 === 0 ? 0 : 26 }}>
              <MascotAvatar color={m.color} size={20} mood={m.isMe ? "wink" : "happy"} border={m.isMe} />
              <span className={cn("mt-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px]")}
                    style={{
                      background: m.isMe ? "var(--cb-brand)" : "rgba(0,0,0,0.4)",
                      color: "#fff", fontWeight: 700,
                    }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Zone({ center, half, color }: { center: number; half: number; color: string }) {
  const left = Math.max(0, center - half);
  const right = Math.min(100, center + half);
  return <div className="absolute top-0 bottom-0" style={{ left: `${left}%`, width: `${right - left}%`, background: color }} />;
}

function ZoneLabel({ value, center, y, bold }: { value: string; center: number; y: string; bold?: boolean }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none"
      style={{
        left: `${center}%`,
        top: y,
        fontFamily: "var(--font-display)",
        fontSize: bold ? 14 : 11,
        fontWeight: 800,
        textShadow: "0 1px 4px rgba(0,0,0,0.6)",
      }}
    >
      {value}
    </div>
  );
}

// ── Small shared pieces ───────────────────────────────────
function RoundHeader({ round, total, timeLeft, max, role }: {
  round: number; total: number; timeLeft: number; max: number; role: string;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-1 flex items-center justify-between">
        <span className="af-chip">Manche {round}/{total}</span>
        <span className="af-chip" style={{
          background: "rgba(255,210,63,0.18)",
          borderColor: "rgba(255,210,63,0.3)",
          color: "var(--af-yellow)",
        }}>{role}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-linear"
             style={{
               width: `${(timeLeft / max) * 100}%`,
               background: "linear-gradient(90deg, var(--cb-brand), var(--af-pink))",
             }} />
      </div>
    </div>
  );
}

function ClueBadge({ clue, authorName }: { clue: string | null; authorName: string | null }) {
  if (!clue) return null;
  return (
    <div className="mx-auto mt-4 max-w-md rounded-2xl border px-5 py-3 text-center"
         style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(6px)" }}>
      <p className="af-eyebrow mb-1">Indice de {authorName ?? "?"}</p>
      <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", letterSpacing: -0.3 }}>
        « {clue} »
      </p>
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
