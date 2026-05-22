"use client";

import { useCallback, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

const ACCENT = "#36d0e0";
const BAND = 22; // demi-largeur de la zone affichee au reveal (zones de score)

interface WavePlayerState {
  id: string;
  name: string;
  score: number;
  isPsychic: boolean;
  hasGuessed: boolean;
}

interface Spectrum {
  left: string;
  right: string;
}

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
    return <Centered emoji="🌡️" text="Calibrage des ondes..." />;
  }

  // ── INTRO ───────────────────────────────────────────────
  if (state.phase === "intro") {
    return (
      <Centered>
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
          Manche {state.round} / {state.totalRounds}
        </span>
        <p className="text-sm text-white/40 font-sans mb-3">Le Médium de ce tour est</p>
        <p className="text-5xl font-serif font-semibold text-white/90 mb-8" style={{ textShadow: `0 0 50px ${ACCENT}44` }}>
          {state.psychicName}
          {state.amPsychic && <span className="text-white/40 text-2xl"> (toi)</span>}
        </p>
        <p className="text-xs text-white/30 font-sans max-w-xs text-center animate-pulse">
          {state.amPsychic ? "Tu vas voir une cible secrète et donner un indice" : "Tu devras deviner où le Médium vise sur le curseur"}
        </p>
      </Centered>
    );
  }

  // ── CLUE (psychic gives a clue) ─────────────────────────
  if (state.phase === "clue") {
    if (state.amPsychic) {
      return (
        <div className="flex flex-1 flex-col items-center p-5" style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}16, transparent 45%), #060606` }}>
          <RoundHeader round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={45} role="Tu es Médium" />
          <p className="text-center text-base font-serif text-white/80 mt-3 mb-2">
            La cible est ici — trouve un <span className="text-white" style={{ color: ACCENT }}>indice</span> qui la situe
          </p>
          <Dial spectrum={state.spectrum} target={state.myTarget} showBand markers={[]} />
          <div className="w-full max-w-md mt-6">
            <div className="flex gap-2">
              <input
                value={clueInput}
                onChange={(e) => setClueInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitClue()}
                placeholder="Ton indice (un mot, un exemple...)"
                maxLength={60}
                autoComplete="off"
                className="flex-1 rounded-2xl border border-white/20 bg-black/40 px-4 py-3.5 font-sans text-base text-white/90 placeholder:text-white/25 outline-none focus:border-[#36d0e0]/60"
              />
              <button onClick={submitClue} disabled={!clueInput.trim()} className="px-6 rounded-2xl font-sans text-sm font-semibold text-white transition-all disabled:opacity-30" style={{ background: `linear-gradient(135deg, #3a8cff, ${ACCENT})` }}>
                Envoyer
              </button>
            </div>
            <p className="text-[11px] text-white/30 font-sans mt-3 text-center">
              Ni trop vague, ni trop évident : les autres doivent retrouver la zone
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
        <div className="flex flex-1 flex-col items-center p-5" style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}16, transparent 45%), #060606` }}>
          <RoundHeader round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} role="Tu es Médium" />
          <ClueBadge clue={state.clue} />
          <Dial spectrum={state.spectrum} target={state.myTarget} showBand markers={[]} />
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
      />
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const markers = Object.entries(state.guesses ?? {}).map(([id, val]) => ({
      value: val,
      label: nameOf(id),
      isMe: id === playerId,
    }));
    const myPts = state.roundPoints?.[playerId] ?? 0;
    return (
      <div className="flex flex-1 flex-col items-center p-5 overflow-y-auto" style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}1c, transparent 45%), #060606` }}>
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-3 mt-1">
          Manche {state.round}/{state.totalRounds} — Révélation
        </span>
        <ClueBadge clue={state.clue} />
        <Dial spectrum={state.spectrum} target={state.target} showBand showZones markers={markers} />
        <div className="mt-5 px-5 py-2.5 rounded-2xl border font-sans text-sm" style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}14`, color: "#fff" }}>
          {state.amPsychic ? "Ton indice rapporte" : "Tu marques"} <span className="font-bold">+{myPts}</span> pts
        </div>
        <p className="text-[11px] text-white/25 font-sans mt-4 animate-pulse">Manche suivante...</p>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    const sorted = [...(state.players ?? [])].sort((a, b) => b.score - a.score);
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}18, transparent 45%), #060606` }}>
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-2">Partie terminée</span>
        <p className="text-4xl mb-6">🌡️</p>
        <div className="w-full max-w-sm space-y-2.5">
          {sorted.map((p, i) => (
            <div key={p.id} className={cn("flex items-center justify-between rounded-3xl border p-4 backdrop-blur-sm", i === 0 ? "border-[#36d0e0]/40 bg-[#36d0e0]/10" : "border-white/10 bg-black/30")} style={i === 0 ? { boxShadow: `0 0 25px ${ACCENT}33` } : undefined}>
              <div className="flex items-center gap-3">
                <span className={cn("text-xl font-mono font-bold w-8", i === 0 ? "text-[#5fe3f0]" : "text-white/25")}>#{i + 1}</span>
                <span className={cn("text-sm font-sans font-semibold", i === 0 ? "text-white/90" : "text-white/45")}>{p.name}{p.id === playerId && " (toi)"}</span>
              </div>
              <span className={cn("text-xl font-mono font-bold", i === 0 ? "text-[#5fe3f0]" : "text-white/40")}>{p.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <Centered emoji="🌡️" text={error ?? "Chargement..."} />;
}

// ── Guess board with interactive slider ───────────────────
function GuessBoard({
  spectrum,
  clue,
  round,
  total,
  timeLeft,
  submitted,
  onSubmit,
}: {
  spectrum: Spectrum | null;
  clue: string | null;
  round: number;
  total: number;
  timeLeft: number;
  submitted: boolean;
  onSubmit: (g: number) => void;
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
  const onPointerUp = () => {
    dragging.current = false;
  };

  const submit = () => {
    if (sent || submitted) return;
    setSent(true);
    onSubmit(value);
  };

  const locked = sent || submitted;

  return (
    <div className="flex flex-1 flex-col items-center p-5" style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}16, transparent 45%), #060606` }}>
      <RoundHeader round={round} total={total} timeLeft={timeLeft} max={30} role="Place le curseur" />
      <ClueBadge clue={clue} />

      <div className="w-full max-w-md mt-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-sans text-emerald-400 max-w-[42%] leading-tight">{spectrum?.left}</span>
          <span className="text-sm font-sans text-right max-w-[42%] leading-tight" style={{ color: ACCENT }}>{spectrum?.right}</span>
        </div>
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative h-14 rounded-full cursor-pointer select-none"
          style={{ touchAction: "none", background: "linear-gradient(90deg, #2bd47a, #3a8cff 50%, #36d0e0)" }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-16 w-3 rounded-full bg-white shadow-lg pointer-events-none"
            style={{ left: `${value}%`, boxShadow: "0 0 16px rgba(255,255,255,0.6)" }}
          />
          <div className="absolute -top-7 -translate-x-1/2 font-mono text-sm text-white/80 pointer-events-none" style={{ left: `${value}%` }}>
            {value}
          </div>
        </div>
      </div>

      <button onClick={submit} disabled={locked} className="mt-8 w-full max-w-md py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50" style={{ background: `linear-gradient(135deg, #3a8cff, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}>
        {locked ? "Curseur placé !" : "Valider ma réponse"}
      </button>
    </div>
  );
}

// ── Dial (read-only display: target band, zones, markers) ─
function Dial({
  spectrum,
  target,
  showBand,
  showZones,
  markers,
}: {
  spectrum: Spectrum | null;
  target: number | null;
  showBand?: boolean;
  showZones?: boolean;
  markers: { value: number; label: string; isMe: boolean }[];
}) {
  return (
    <div className="w-full max-w-md mt-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-sans text-emerald-400 max-w-[42%] leading-tight">{spectrum?.left}</span>
        <span className="text-sm font-sans text-right max-w-[42%] leading-tight" style={{ color: ACCENT }}>{spectrum?.right}</span>
      </div>
      <div className="relative h-14 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, #2bd47a, #3a8cff 50%, #36d0e0)" }}>
        {/* Score zones at reveal */}
        {showZones && target != null && (
          <>
            <Zone center={target} half={BAND} color="rgba(255,255,255,0.10)" />
            <Zone center={target} half={12} color="rgba(255,255,255,0.18)" />
            <Zone center={target} half={5} color="rgba(255,255,255,0.30)" />
          </>
        )}
        {/* Target line */}
        {showBand && target != null && (
          <div className="absolute top-0 bottom-0 w-1 bg-white" style={{ left: `${target}%`, transform: "translateX(-50%)", boxShadow: "0 0 14px rgba(255,255,255,0.8)" }} />
        )}
      </div>
      {/* Markers below */}
      {markers.length > 0 && (
        <div className="relative h-10 mt-1">
          {markers.map((m, i) => (
            <div key={i} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${m.value}%`, top: i % 2 === 0 ? 0 : 18 }}>
              <span className={cn("text-[10px] font-sans whitespace-nowrap px-1.5 py-0.5 rounded", m.isMe ? "text-white bg-white/20" : "text-white/60")}>
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

// ── Small shared pieces ───────────────────────────────────
function RoundHeader({ round, total, timeLeft, max, role }: { round: number; total: number; timeLeft: number; max: number; role: string }) {
  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/25 font-sans tracking-wide">Manche {round}/{total}</span>
        <span className="text-[10px] px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider" style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}>{role}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / max) * 100}%`, background: `linear-gradient(90deg, #3a8cff, ${ACCENT})` }} />
      </div>
    </div>
  );
}

function ClueBadge({ clue }: { clue: string | null }) {
  if (!clue) return null;
  return (
    <div className="mt-3 mb-1 px-5 py-2.5 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-sm">
      <p className="text-[10px] text-white/30 font-sans uppercase tracking-[0.2em] text-center">Indice</p>
      <p className="text-lg font-serif font-semibold text-white/95 text-center">« {clue} »</p>
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

function Centered({ emoji, text, children }: { emoji?: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6" style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}12, transparent 45%), #060606` }}>
      {children ?? (
        <>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/30" style={{ boxShadow: `0 0 40px ${ACCENT}22` }}>
            <span className="text-4xl">{emoji}</span>
          </div>
          <p className="text-white/40 animate-pulse font-sans text-lg text-center">{text}</p>
        </>
      )}
    </div>
  );
}
