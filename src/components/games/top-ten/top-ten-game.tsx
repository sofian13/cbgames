"use client";

import { useCallback, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────
interface TopTenPlayerState {
  id: string;
  name: string;
  score: number;
  isCaptain: boolean;
}

interface ThemeState {
  theme: string;
  low: string;
  high: string;
}

interface TopTenState {
  phase: "waiting" | "intro" | "answering" | "ordering" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  captainId: string | null;
  captainName: string | null;
  theme: ThemeState | null;
  numberedOrder: string[];
  captainGuess: string[] | null;
  trueOrder: string[] | null;
  revealNumbers: Record<string, number> | null;
  correctPairs: number | null;
  totalPairs: number | null;
  perfect: boolean | null;
  roundPoints: Record<string, number> | null;
  players: TopTenPlayerState[];
  amCaptain: boolean;
  myNumber: number | null;
}

const ACCENT = "#ff5a8a";

// ══════════════════════════════════════════════════════════
export default function TopTenGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "top-ten", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as TopTenState;

  const nameOf = useCallback(
    (id: string) => state?.players?.find((p) => p.id === id)?.name ?? "?",
    [state?.players]
  );

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return (
      <Centered>
        <div className="text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-sm"
            style={{ boxShadow: `0 0 40px ${ACCENT}22` }}
          >
            <span className="text-4xl">🔥</span>
          </div>
          <p className="text-white/40 animate-pulse font-sans text-lg">
            Distribution des num&eacute;ros...
          </p>
        </div>
      </Centered>
    );
  }

  // ── INTRO ───────────────────────────────────────────────
  if (state.phase === "intro") {
    return (
      <Centered>
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
          Manche {state.round} / {state.totalRounds}
        </span>
        <p className="text-sm text-white/40 font-sans mb-3">Le Capitaine de ce tour est</p>
        <p
          className="text-5xl font-serif font-semibold text-white/90 mb-8"
          style={{ textShadow: `0 0 50px ${ACCENT}33` }}
        >
          {state.captainName}
          {state.amCaptain && <span className="text-white/40 text-2xl"> (toi)</span>}
        </p>
        <p className="text-xs text-white/30 font-sans max-w-xs text-center animate-pulse">
          {state.amCaptain
            ? "Tu ne tires pas de numéro. Écoute bien tout le monde..."
            : "Tu vas recevoir un numéro secret de 1 à 10"}
        </p>
      </Centered>
    );
  }

  // ── ANSWERING ───────────────────────────────────────────
  if (state.phase === "answering") {
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 md:p-6"
        style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}14, transparent 45%), #060606` }}
      >
        <Header round={state.round} total={state.totalRounds} captain={state.captainName} amCaptain={state.amCaptain} />

        {/* Theme card */}
        <div
          className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 mt-4 mb-6"
          style={{ boxShadow: `0 0 40px ${ACCENT}1a` }}
        >
          <p className="text-[10px] text-white/30 font-sans uppercase tracking-[0.25em] mb-3 text-center">
            Th&egrave;me 18+
          </p>
          <p className="text-2xl font-serif font-semibold text-white/95 text-center leading-snug">
            {state.theme?.theme}
          </p>
          <div className="mt-5 flex items-stretch gap-2 text-center">
            <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
              <p className="text-emerald-400 font-mono font-bold text-lg">1</p>
              <p className="text-[11px] text-white/45 font-sans leading-tight mt-1">{state.theme?.low}</p>
            </div>
            <div className="flex items-center text-white/20 text-xs font-sans">vers</div>
            <div className="flex-1 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5">
              <p className="font-mono font-bold text-lg" style={{ color: ACCENT }}>10</p>
              <p className="text-[11px] text-white/45 font-sans leading-tight mt-1">{state.theme?.high}</p>
            </div>
          </div>
        </div>

        {/* My number / captain panel */}
        {state.amCaptain ? (
          <CaptainAnswering onStart={() => sendAction({ action: "start-ordering" })} />
        ) : (
          <NumberCard myNumber={state.myNumber} />
        )}
      </div>
    );
  }

  // ── ORDERING (captain reorders) ─────────────────────────
  if (state.phase === "ordering") {
    if (state.amCaptain) {
      return (
        <OrderingBoard
          key={`${state.round}-${state.numberedOrder.join(",")}`}
          ids={state.numberedOrder}
          nameOf={nameOf}
          onSubmit={(order) => sendAction({ action: "submit-order", order })}
          round={state.round}
          total={state.totalRounds}
        />
      );
    }
    return (
      <Centered>
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
          Manche {state.round} / {state.totalRounds}
        </span>
        <p className="text-3xl font-serif font-semibold text-white/90 mb-3 text-center px-6">
          {state.captainName} fait son classement...
        </p>
        <p className="text-sm text-white/30 font-sans animate-pulse">
          Du plus soft au plus hard
        </p>
      </Centered>
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const guess = state.captainGuess ?? [];
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 md:p-6 overflow-y-auto"
        style={{
          background: state.perfect
            ? `radial-gradient(circle at 50% 20%, ${ACCENT}22, transparent 50%), #060606`
            : "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.04), transparent 45%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-3 mt-1">
          Manche {state.round} / {state.totalRounds} — R&eacute;sultat
        </span>

        <p
          className={cn("text-3xl font-serif font-semibold mb-1 text-center", state.perfect ? "text-white/95" : "text-white/80")}
          style={state.perfect ? { textShadow: `0 0 40px ${ACCENT}55` } : undefined}
        >
          {state.perfect ? "🎉 Classement parfait !" : `${state.correctPairs}/${state.totalPairs} bien placés`}
        </p>
        <p className="text-xs text-white/35 font-sans mb-5 text-center">
          Classement de {state.captainName} (soft → hard)
        </p>

        {/* Captain's guess with revealed numbers */}
        <div className="w-full max-w-md space-y-2">
          {guess.map((id, i) => {
            const num = state.revealNumbers?.[id] ?? 0;
            const prev = i > 0 ? state.revealNumbers?.[guess[i - 1]] ?? 0 : -1;
            const orderOk = i === 0 || prev < num;
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-sm",
                  orderOk ? "border-emerald-500/25 bg-emerald-500/[0.07]" : "border-rose-500/30 bg-rose-500/[0.08]"
                )}
              >
                <span className="text-xs text-white/30 font-mono w-5">{i + 1}.</span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono font-bold text-sm"
                  style={{
                    background: `linear-gradient(135deg, #2bd47a ${(num / 10) * 0}%, ${ACCENT} 100%)`,
                    opacity: 0.25 + (num / 10) * 0.75,
                    color: "#fff",
                  }}
                >
                  {num}
                </span>
                <span className="text-sm font-sans font-semibold text-white/85 flex-1 truncate">
                  {nameOf(id)}
                  {id === playerId && <span className="text-white/35"> (toi)</span>}
                </span>
                <span className={cn("text-xs font-mono", orderOk ? "text-emerald-400/70" : "text-rose-400/80")}>
                  {orderOk ? "✓" : "✗"}
                </span>
                {state.roundPoints?.[id] != null && (
                  <span className="text-xs font-mono text-white/40">+{state.roundPoints[id]}</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-white/25 font-sans mt-5 animate-pulse">Manche suivante...</p>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    const sorted = [...(state.players ?? [])].sort((a, b) => b.score - a.score);
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}18, transparent 45%), #060606` }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-2">Partie termin&eacute;e</span>
        <p className="text-4xl mb-6">🔥</p>
        <div className="w-full max-w-sm space-y-2.5">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between rounded-3xl border p-4 backdrop-blur-sm",
                i === 0 ? "border-rose-500/35 bg-rose-500/10" : "border-white/10 bg-black/30"
              )}
              style={i === 0 ? { boxShadow: `0 0 25px ${ACCENT}33` } : undefined}
            >
              <div className="flex items-center gap-3">
                <span className={cn("text-xl font-mono font-bold w-8", i === 0 ? "text-rose-400" : "text-white/25")}>
                  #{i + 1}
                </span>
                <span className={cn("text-sm font-sans font-semibold", i === 0 ? "text-white/90" : "text-white/45")}>
                  {p.name}
                  {p.id === playerId && " (toi)"}
                </span>
              </div>
              <span
                className={cn("text-xl font-mono font-bold", i === 0 ? "text-rose-400" : "text-white/40")}
                style={i === 0 ? { textShadow: `0 0 15px ${ACCENT}55` } : undefined}
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
    <Centered>
      {error ? (
        <p className="text-sm text-red-400 font-sans font-semibold">{error}</p>
      ) : (
        <p className="text-white/40 animate-pulse font-sans text-lg">Chargement...</p>
      )}
    </Centered>
  );
}

// ── Sub-components ────────────────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center p-6"
      style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}10, transparent 45%), #060606` }}
    >
      {children}
    </div>
  );
}

function Header({
  round,
  total,
  captain,
  amCaptain,
}: {
  round: number;
  total: number;
  captain: string | null;
  amCaptain: boolean;
}) {
  return (
    <div className="flex w-full max-w-md items-center justify-between">
      <span className="text-xs text-white/25 font-sans tracking-wide">
        Manche {round}/{total}
      </span>
      <span
        className="text-[10px] px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider"
        style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}
      >
        {amCaptain ? "Tu es Capitaine" : `Capitaine: ${captain}`}
      </span>
    </div>
  );
}

function NumberCard({ myNumber }: { myNumber: number | null }) {
  return (
    <div className="flex flex-col items-center mt-2">
      <p className="text-xs text-white/35 font-sans mb-3 uppercase tracking-[0.15em]">Ton num&eacute;ro secret</p>
      <div
        className="flex h-32 w-32 items-center justify-center rounded-3xl border backdrop-blur-sm"
        style={{
          borderColor: `${ACCENT}55`,
          background: "rgba(0,0,0,0.4)",
          boxShadow: `0 0 50px ${ACCENT}33`,
        }}
      >
        <span className="text-7xl font-serif font-bold text-white/95" style={{ textShadow: `0 0 30px ${ACCENT}66` }}>
          {myNumber ?? "?"}
        </span>
      </div>
      <p className="text-sm text-white/45 font-sans mt-5 max-w-xs text-center leading-relaxed">
        Donne une r&eacute;ponse <span className="text-white/80">à voix haute</span> qui colle à
        l&apos;intensit&eacute; de ton num&eacute;ro. Ni trop, ni trop peu — le Capitaine doit te ranger au bon endroit !
      </p>
    </div>
  );
}

function CaptainAnswering({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center mt-2 max-w-xs text-center">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-sm mb-5"
        style={{ boxShadow: `0 0 40px ${ACCENT}22` }}
      >
        <span className="text-4xl">🎧</span>
      </div>
      <p className="text-sm text-white/45 font-sans leading-relaxed mb-6">
        Chaque joueur dit sa r&eacute;ponse à voix haute. &Eacute;coute bien, puis classe-les du
        <span className="text-emerald-400"> plus soft</span> au
        <span style={{ color: ACCENT }}> plus hard</span>.
      </p>
      <button
        onClick={onStart}
        className="px-8 py-3.5 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}
      >
        Tout le monde a parl&eacute; → Classer
      </button>
    </div>
  );
}

// ── Drag & drop reorder board (touch + mouse) ─────────────
function OrderingBoard({
  ids,
  nameOf,
  onSubmit,
  round,
  total,
}: {
  ids: string[];
  nameOf: (id: string) => string;
  onSubmit: (order: string[]) => void;
  round: number;
  total: number;
}) {
  const [order, setOrder] = useState<string[]>(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handlePointerDown = (id: string) => (e: React.PointerEvent) => {
    if (submitted) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    e.preventDefault();
    const y = e.clientY;
    // Find which item we're hovering over
    let targetId: string | null = null;
    for (const id of order) {
      const el = itemRefs.current.get(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        targetId = id;
        break;
      }
    }
    if (!targetId || targetId === dragId) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragId);
      const to = prev.indexOf(targetId!);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
  };

  const handlePointerUp = () => setDragId(null);

  const move = (id: string, dir: -1 | 1) => {
    if (submitted) return;
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(order);
  };

  return (
    <div
      className="flex flex-1 flex-col p-5 md:p-6"
      style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}14, transparent 45%), #060606` }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/25 font-sans tracking-wide">Manche {round}/{total}</span>
        <span
          className="text-[10px] px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider"
          style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}
        >
          Classement
        </span>
      </div>
      <p className="text-center text-lg font-serif font-semibold text-white/90 mt-2 mb-1">
        Classe-les du plus soft au plus hard
      </p>
      <div className="flex items-center justify-between max-w-md w-full mx-auto px-1 mb-3">
        <span className="text-[10px] text-emerald-400 font-sans uppercase tracking-wider">↑ 1 · Soft</span>
        <span className="text-[10px] font-sans uppercase tracking-wider" style={{ color: ACCENT }}>10 · Hard ↓</span>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto space-y-2 select-none" style={{ touchAction: "none" }}>
        {order.map((id, i) => {
          const isDragging = id === dragId;
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) itemRefs.current.set(id, el);
                else itemRefs.current.delete(id);
              }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3 py-3.5 backdrop-blur-sm transition-shadow",
                isDragging
                  ? "border-white/40 bg-black/60 shadow-2xl scale-[1.02]"
                  : "border-white/10 bg-black/35"
              )}
              style={isDragging ? { boxShadow: `0 0 30px ${ACCENT}44` } : undefined}
            >
              <span className="text-sm font-mono font-bold w-6 text-center text-white/30">{i + 1}</span>
              <div
                onPointerDown={handlePointerDown(id)}
                className="flex items-center gap-1 text-white/30 cursor-grab active:cursor-grabbing touch-none"
                aria-label="Glisser pour réordonner"
              >
                <DotsIcon />
              </div>
              <span className="flex-1 text-sm font-sans font-semibold text-white/90 truncate">{nameOf(id)}</span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => move(id, -1)}
                  disabled={i === 0 || submitted}
                  className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 text-white/40 disabled:opacity-20 hover:bg-white/10 active:scale-90"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(id, 1)}
                  disabled={i === order.length - 1 || submitted}
                  className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 text-white/40 disabled:opacity-20 hover:bg-white/10 active:scale-90"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={submit}
        disabled={submitted}
        className="mt-4 w-full max-w-md mx-auto py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}
      >
        {submitted ? "Classement envoyé..." : "Valider le classement"}
      </button>
    </div>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
      {[4, 10, 16].map((cy) =>
        [4, 10].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" />)
      )}
    </svg>
  );
}
