"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";

// ── Types (miroir du serveur) ─────────────────────────────
interface CurvePlayer {
  id: string;
  name: string;
  colorIdx: number;
  x: number;
  y: number;
  angle: number;
  alive: boolean;
  points: number;
}

interface Head {
  id: string;
  x: number;
  y: number;
  alive: boolean;
  gapping: boolean;
  deathX: number | null;
  deathY: number | null;
  points: number;
}

interface NeonState {
  phase: "waiting" | "countdown" | "playing" | "round-end" | "game-over";
  round: number;
  roundSeq: number;
  targetScore: number;
  arena: number;
  deadline: number;
  feed: { id: number; text: string }[];
  players: CurvePlayer[];
  // fusionné par les game-update 30 Hz :
  heads?: Head[];
  tick?: number;
}

const NEON = ["#00E5FF", "#FF3EA5", "#B6FF3D", "#FFD23F", "#9D6BFF", "#FF6A3D", "#3DFFC8", "#FF5A5A"];
const K = 2; // résolution interne du canvas = arène × K

function useCountdown(deadline: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!deadline) {
      setLeft(0);
      return;
    }
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 200);
    return () => clearInterval(t);
  }, [deadline]);
  return left;
}

export default function NeonRushGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "neon-rush", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as NeonState;
  const countdown = useCountdown(state?.phase === "countdown" ? state.deadline : 0);

  const trailRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const prevHeads = useRef<Map<string, { x: number; y: number }>>(new Map());
  const explosions = useRef<Set<string>>(new Set());
  const lastRoundSeq = useRef(-1);

  // Couleur stable par joueur
  const colorOf = useCallback(
    (id: string) => {
      const p = state?.players?.find((x) => x.id === id);
      return NEON[(p?.colorIdx ?? 0) % NEON.length];
    },
    [state?.players]
  );

  // ── Dessin : traînées persistantes + têtes ──────────────
  useEffect(() => {
    if (!state || !state.arena) return;
    const trail = trailRef.current;
    const fx = fxRef.current;
    if (!trail || !fx) return;
    const tctx = trail.getContext("2d");
    const fctx = fx.getContext("2d");
    if (!tctx || !fctx) return;

    // Nouvelle manche → on efface tout
    if (state.roundSeq !== lastRoundSeq.current) {
      lastRoundSeq.current = state.roundSeq;
      tctx.clearRect(0, 0, trail.width, trail.height);
      prevHeads.current.clear();
      explosions.current.clear();
    }

    const heads: Head[] =
      state.heads ??
      (state.players ?? []).map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        alive: p.alive,
        gapping: false,
        deathX: null,
        deathY: null,
        points: p.points,
      }));

    // Traînées (dessin incrémental — jamais effacé pendant la manche)
    if (state.phase === "playing") {
      for (const h of heads) {
        const prev = prevHeads.current.get(h.id);
        if (prev && h.alive && !h.gapping) {
          const col = colorOf(h.id);
          tctx.strokeStyle = col;
          tctx.lineWidth = 4.4 * K;
          tctx.lineCap = "round";
          tctx.shadowColor = col;
          tctx.shadowBlur = 8;
          tctx.beginPath();
          tctx.moveTo(prev.x * K, prev.y * K);
          tctx.lineTo(h.x * K, h.y * K);
          tctx.stroke();
          tctx.shadowBlur = 0;
        }
        prevHeads.current.set(h.id, { x: h.x, y: h.y });

        // Explosion à la mort (une seule fois)
        if (!h.alive && h.deathX != null && !explosions.current.has(h.id)) {
          explosions.current.add(h.id);
          const col = colorOf(h.id);
          tctx.save();
          tctx.strokeStyle = col;
          tctx.shadowColor = col;
          tctx.shadowBlur = 16;
          for (let r = 4; r <= 14; r += 5) {
            tctx.globalAlpha = 0.5 - r * 0.025;
            tctx.lineWidth = 2 * K;
            tctx.beginPath();
            tctx.arc(h.deathX * K, (h.deathY ?? 0) * K, r * K, 0, Math.PI * 2);
            tctx.stroke();
          }
          tctx.restore();
          tctx.globalAlpha = 1;
        }
      }
    }

    // Têtes + noms (couche effacée à chaque frame)
    fctx.clearRect(0, 0, fx.width, fx.height);
    for (const h of heads) {
      if (!h.alive) continue;
      const col = colorOf(h.id);
      fctx.fillStyle = col;
      fctx.shadowColor = col;
      fctx.shadowBlur = 14;
      fctx.beginPath();
      fctx.arc(h.x * K, h.y * K, 3.4 * K, 0, Math.PI * 2);
      fctx.fill();
      fctx.shadowBlur = 0;
      if (state.phase === "countdown") {
        const p = state.players?.find((x) => x.id === h.id);
        if (p) {
          // Flèche de direction au départ
          fctx.strokeStyle = col;
          fctx.lineWidth = 1.5 * K;
          fctx.beginPath();
          fctx.moveTo(h.x * K, h.y * K);
          fctx.lineTo((h.x + Math.cos(p.angle) * 14) * K, (h.y + Math.sin(p.angle) * 14) * K);
          fctx.stroke();
        }
      }
      fctx.font = `bold ${9 * K}px var(--font-display), sans-serif`;
      fctx.textAlign = "center";
      fctx.fillStyle = "rgba(255,255,255,0.75)";
      fctx.fillText(h.id === playerId ? "toi" : (state.players?.find((x) => x.id === h.id)?.name ?? "").slice(0, 8), h.x * K, (h.y - 8) * K);
    }
  }, [state, colorOf, playerId]);

  // ── Contrôles : moitiés d'écran + flèches clavier ───────
  const pressed = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const lastSent = useRef(0);
  const sendDir = useCallback(() => {
    const dir = (pressed.current.left ? -1 : 0) + (pressed.current.right ? 1 : 0);
    if (dir !== lastSent.current) {
      lastSent.current = dir;
      sendAction({ action: "turn", dir });
    }
  }, [sendAction]);

  const press = useCallback(
    (side: "left" | "right", down: boolean) => {
      pressed.current[side] = down;
      sendDir();
    },
    [sendDir]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") press("left", true);
      if (e.key === "ArrowRight") press("right", true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") press("left", false);
      if (e.key === "ArrowRight") press("right", false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press]);

  if (error) return <Centered emoji="⚠️" text={error} />;
  if (!state || !state.phase || state.phase === "waiting" || !state.players) {
    return <Centered emoji="⚡" text="Allumage des néons…" />;
  }

  const me = state.players.find((p) => p.id === playerId);
  const sorted = [...state.players].sort((a, b) => b.points - a.points);
  const arenaPx = state.arena * K;

  return (
    <div
      className="relative flex min-h-dvh select-none flex-col items-center overflow-hidden"
      style={{
        background: "radial-gradient(120% 80% at 50% 0%, #14082E 0%, #050212 100%)",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.25rem)",
        touchAction: "none",
      }}
    >
      {/* HUD scores */}
      <div className="z-[5] mb-2 flex w-full max-w-md flex-wrap items-center justify-center gap-1.5 px-3">
        <span className="mr-1 text-[11px] font-black uppercase tracking-widest text-white/50">
          ⚡ Manche {state.round} · objectif {state.targetScore}
        </span>
        {sorted.map((p) => (
          <span
            key={p.id}
            className="rounded-full px-2 py-0.5 text-[11px] font-black"
            style={{
              color: p.alive || state.phase !== "playing" ? "#0A0518" : "rgba(255,255,255,0.35)",
              background: p.alive || state.phase !== "playing" ? NEON[p.colorIdx % NEON.length] : "rgba(255,255,255,0.08)",
              opacity: p.alive || state.phase !== "playing" ? 1 : 0.6,
              fontFamily: "var(--font-display)",
            }}
          >
            {p.name}
            {p.id === playerId && " (toi)"} {p.points}
          </span>
        ))}
      </div>

      {/* Arène */}
      <div
        className="relative z-[5]"
        style={{
          width: "min(92vw, 58dvh)",
          aspectRatio: "1",
          borderRadius: 12,
          border: "2px solid rgba(120,170,255,0.35)",
          boxShadow: "0 0 24px rgba(90,120,255,0.25), inset 0 0 40px rgba(60,40,140,0.25)",
          background: "rgba(8,4,24,0.85)",
          overflow: "hidden",
        }}
      >
        <canvas ref={trailRef} width={arenaPx} height={arenaPx} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <canvas ref={fxRef} width={arenaPx} height={arenaPx} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

        {state.phase === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-7xl font-black"
              style={{ fontFamily: "var(--font-display)", color: "#fff", textShadow: "0 0 30px rgba(0,229,255,0.8)" }}
            >
              {countdown > 0 ? countdown : "GO"}
            </span>
          </div>
        )}

        {state.phase === "round-end" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(5,2,18,0.72)" }}>
            <p className="mb-3 text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
              Fin de la manche {state.round}
            </p>
            {sorted.slice(0, 8).map((p, i) => (
              <p key={p.id} className="text-sm font-bold" style={{ color: NEON[p.colorIdx % NEON.length] }}>
                {i + 1}. {p.name} — {p.points} pts
              </p>
            ))}
            <p className="mt-3 text-[11px] text-white/50">Manche suivante…</p>
          </div>
        )}

        {state.phase === "game-over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(5,2,18,0.8)" }}>
            <p className="text-4xl">👑</p>
            <p className="mt-2 text-xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
              {sorted[0]?.name} gagne !
            </p>
            <p className="mt-1 text-sm text-white/60">{sorted[0]?.points} points</p>
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="z-[5] mt-2 h-10 w-full max-w-md px-4 text-center">
        {(state.feed ?? []).slice(-1).map((f) => (
          <p key={f.id} className="text-[12px] font-bold text-white/70">
            {f.text}
          </p>
        ))}
        {me && !me.alive && state.phase === "playing" && (
          <p className="text-[12px] font-black" style={{ color: "#FF5A5A" }}>
            T&apos;es mort 💀 — les survivants engrangent les points…
          </p>
        )}
      </div>

      {/* Zones tactiles gauche / droite */}
      <div className="absolute inset-x-0 bottom-0 z-[6] flex" style={{ top: "55%" }}>
        {(["left", "right"] as const).map((side) => (
          <button
            key={side}
            className="flex flex-1 items-end justify-center pb-10"
            style={{ background: "transparent", border: 0, touchAction: "none" }}
            onPointerDown={(e) => {
              e.preventDefault();
              press(side, true);
            }}
            onPointerUp={() => press(side, false)}
            onPointerLeave={() => press(side, false)}
            onPointerCancel={() => press(side, false)}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(4px)",
              }}
            >
              {side === "left" ? "⟲" : "⟳"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "#0A0518" }}>
      <span className="text-5xl">{emoji}</span>
      <p className="text-base font-bold text-white/80">{text}</p>
    </div>
  );
}
