"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { cn } from "@/lib/utils";

type PlayerState = {
  id: string;
  name: string;
  x: number;
  y: number;
  alive: boolean;
  finished: boolean;
  color: string;
};

type LevelState = {
  id: number;
  goalX: number;
  traps: Array<{ x: number; w: number }>;
  enemies: Array<{ x: number; y: number; w: number; h: number; alive: boolean }>;
};

type BlockRunnerState = {
  phase: "waiting" | "playing" | "failed" | "finished";
  playerCount: number;
  levelIndex: number;
  levelCount: number;
  attempt: number;
  failMessage: string | null;
  myPlayerId: string | null;
  players: PlayerState[];
  spectators: Array<{ id: string; name: string }>;
  level: LevelState;
  palette: string[];
};

const VIEW_W = 430;
const GROUND_H = 84;
const PLAYER_W = 28;
const PLAYER_H = 28;
const JOY_RADIUS = 44;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Color palette for players with matching glow
const COLOR_INFO: Record<string, { name: string; glow: string; dark: string }> = {
  "#ef4444": { name: "Rouge", glow: "rgba(239,68,68,0.5)", dark: "#b91c1c" },
  "#f59e0b": { name: "Jaune", glow: "rgba(245,158,11,0.5)", dark: "#d97706" },
  "#22c55e": { name: "Vert", glow: "rgba(34,197,94,0.5)", dark: "#16a34a" },
  "#3b82f6": { name: "Bleu", glow: "rgba(59,130,246,0.5)", dark: "#2563eb" },
  "#a855f7": { name: "Violet", glow: "rgba(168,85,247,0.5)", dark: "#7c3aed" },
};

// --- Player Character (cube with face) ---
function PlayerCharacter({ player, isMe }: { player: PlayerState; isMe: boolean }) {
  const info = COLOR_INFO[player.color] ?? { glow: "rgba(255,255,255,0.3)", dark: "#666" };
  const isDead = !player.alive;

  return (
    <div
      className="absolute transition-[left,bottom] duration-[33ms] linear"
      style={{
        left: 0,
        bottom: 0,
        width: `${PLAYER_W + 4}px`,
        height: `${PLAYER_H + 4}px`,
        transform: "translateX(-50%)",
        opacity: isDead ? 0 : player.finished ? 0.6 : 1,
        transition: isDead ? "opacity 0.3s" : undefined,
      }}
    >
      {/* Glow under character */}
      {!isDead && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: "24px",
            height: "6px",
            background: info.glow,
            filter: "blur(4px)",
          }}
        />
      )}
      {/* Body */}
      <div
        className="relative w-full h-full rounded-md border-2 border-white/30"
        style={{
          background: `linear-gradient(135deg, ${player.color} 0%, ${info.dark} 100%)`,
          boxShadow: `0 0 12px ${info.glow}, inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.3)`,
        }}
      >
        {/* Eyes */}
        <div className="absolute top-[6px] left-1/2 -translate-x-1/2 flex gap-[6px]">
          <div className="w-[5px] h-[6px] bg-white rounded-sm shadow-[0_0_4px_rgba(255,255,255,0.6)]">
            <div className="w-[2px] h-[3px] bg-black/80 rounded-full mt-[1px] ml-[2px]" />
          </div>
          <div className="w-[5px] h-[6px] bg-white rounded-sm shadow-[0_0_4px_rgba(255,255,255,0.6)]">
            <div className="w-[2px] h-[3px] bg-black/80 rounded-full mt-[1px] ml-[1px]" />
          </div>
        </div>
        {/* Mouth */}
        <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 w-[8px] h-[3px] bg-black/20 rounded-full" />
      </div>
      {/* Name tag */}
      {isMe && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[8px] font-mono font-bold text-white/70 bg-black/40 px-1 rounded">
            {player.name}
          </span>
        </div>
      )}
    </div>
  );
}

// --- Enemy Character ---
function EnemyCharacter({ enemy }: { enemy: { x: number; y: number; w: number; h: number; alive: boolean } }) {
  if (!enemy.alive) return null;
  return (
    <div
      className="absolute"
      style={{
        width: `${Math.max(20, enemy.w)}px`,
        height: `${enemy.h}px`,
      }}
    >
      {/* Body */}
      <div
        className="relative w-full h-full rounded-t-lg"
        style={{
          background: "linear-gradient(180deg, #c026d3 0%, #7e22ce 60%, #581c87 100%)",
          boxShadow: "0 0 14px rgba(192,38,211,0.4), inset 0 2px 0 rgba(255,255,255,0.2)",
          borderBottom: "3px solid #4a1764",
        }}
      >
        {/* Eyes */}
        <div className="absolute top-[4px] left-1/2 -translate-x-1/2 flex gap-[4px]">
          <div className="w-[5px] h-[5px] bg-white rounded-full">
            <div className="w-[2px] h-[2px] bg-red-600 rounded-full mt-[1px] ml-[2px]" />
          </div>
          <div className="w-[5px] h-[5px] bg-white rounded-full">
            <div className="w-[2px] h-[2px] bg-red-600 rounded-full mt-[1px] ml-[1px]" />
          </div>
        </div>
        {/* Angry mouth */}
        <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[8px] h-[2px] bg-red-400 rounded-full" />
        {/* Spikes on top */}
        <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 flex gap-[2px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-0 h-0" style={{
              borderLeft: "3px solid transparent",
              borderRight: "3px solid transparent",
              borderBottom: "5px solid #c026d3",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Trap (spikes) ---
function TrapSpikes({ width }: { width: number }) {
  const spikeCount = Math.max(2, Math.floor(width / 12));
  return (
    <div className="absolute bottom-0 flex" style={{ width: `${width}px` }}>
      {Array.from({ length: spikeCount }).map((_, i) => (
        <div key={i} className="flex-1 flex justify-center">
          <div className="w-0 h-0" style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderBottom: "14px solid #dc2626",
            filter: "drop-shadow(0 0 4px rgba(239,68,68,0.6))",
          }} />
        </div>
      ))}
      {/* Red glow base */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-600 rounded-t-sm" style={{
        boxShadow: "0 0 10px rgba(239,68,68,0.6), 0 -4px 12px rgba(239,68,68,0.3)",
      }} />
    </div>
  );
}

// --- Goal Flag ---
function GoalFlag() {
  return (
    <div className="absolute bottom-0 flex flex-col items-center" style={{ width: "20px" }}>
      {/* Pole */}
      <div className="w-[3px] bg-white/70 rounded-t-full" style={{ height: "80px" }}>
        {/* Star on top */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-yellow-400 text-sm" style={{
          filter: "drop-shadow(0 0 6px rgba(250,204,21,0.8))",
        }}>
          ★
        </div>
      </div>
      {/* Flag */}
      <div className="absolute top-1 left-[4px]" style={{
        width: "18px",
        height: "12px",
        background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
        clipPath: "polygon(0 0, 100% 20%, 100% 80%, 0 100%)",
        boxShadow: "0 0 10px rgba(245,158,11,0.5)",
      }} />
      {/* Checkered base */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[16px] h-[16px] rounded-sm overflow-hidden border border-white/30">
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
          <div className="bg-white" />
          <div className="bg-black" />
          <div className="bg-black" />
          <div className="bg-white" />
        </div>
      </div>
    </div>
  );
}

export default function BlockRunnerGame({ roomCode, playerId, playerName }: GameProps) {
  const router = useRouter();
  const { sendAction } = useGame(roomCode, "block-runner", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as BlockRunnerState | null;

  const [joystick, setJoystick] = useState({ x: 0, y: 0, active: false });
  const [isLandscape, setIsLandscape] = useState(false);
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const joystickPointerIdRef = useRef<number | null>(null);
  const moveXRef = useRef<number>(0);
  const moveLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activePlayers = useMemo(() => state?.players ?? [], [state?.players]);
  const level = state?.level;
  const myControlledPlayer = useMemo(
    () => activePlayers.find((p) => p.id === state?.myPlayerId) ?? null,
    [activePlayers, state?.myPlayerId]
  );

  const isActivePlayer = !!myControlledPlayer;

  const cameraX = useMemo(() => {
    if (!level || !myControlledPlayer) return 0;
    const maxCamera = Math.max(0, level.goalX - VIEW_W);
    return clamp(myControlledPlayer.x - VIEW_W * 0.32, 0, maxCamera);
  }, [level, myControlledPlayer]);

  const sendMove = useCallback((moveX: number) => sendAction({ action: "input", moveX }), [sendAction]);

  const stopMove = useCallback(() => {
    moveXRef.current = 0;
    sendMove(0);
    setJoystick((prev) => ({ ...prev, x: 0, y: 0, active: false }));
  }, [sendMove]);

  const onJoystickPointer = useCallback(
    (clientX: number, clientY: number) => {
      const base = joystickRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > JOY_RADIUS) {
        const scale = JOY_RADIUS / dist;
        dx *= scale;
        dy *= scale;
      }
      const moveX = clamp(dx / JOY_RADIUS, -1, 1);
      moveXRef.current = moveX;
      setJoystick({ x: dx, y: dy, active: true });
    },
    []
  );

  // Movement loop
  useEffect(() => {
    if (moveLoopRef.current) clearInterval(moveLoopRef.current);
    moveLoopRef.current = setInterval(() => {
      sendMove(moveXRef.current);
    }, 33);
    return () => {
      if (moveLoopRef.current) clearInterval(moveLoopRef.current);
      sendMove(0);
    };
  }, [sendMove]);

  // Orientation lock
  useEffect(() => {
    const updateOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight);
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    try {
      const orientationApi = (screen.orientation as { lock?: (o: "landscape") => Promise<void> } | undefined);
      if (orientationApi?.lock) {
        void orientationApi.lock("landscape").catch(() => {});
      }
    } catch {}
    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  // Global pointer events for joystick
  useEffect(() => {
    const onGlobalMove = (e: PointerEvent) => {
      if (joystickPointerIdRef.current === null || e.pointerId !== joystickPointerIdRef.current) return;
      onJoystickPointer(e.clientX, e.clientY);
    };
    const onGlobalUp = (e: PointerEvent) => {
      if (joystickPointerIdRef.current === null || e.pointerId !== joystickPointerIdRef.current) return;
      joystickPointerIdRef.current = null;
      stopMove();
    };
    window.addEventListener("pointermove", onGlobalMove);
    window.addEventListener("pointerup", onGlobalUp);
    window.addEventListener("pointercancel", onGlobalUp);
    return () => {
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
      window.removeEventListener("pointercancel", onGlobalUp);
    };
  }, [onJoystickPointer, stopMove]);

  // --- Loading state ---
  if (!state || !level) {
    return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #1a1a3e 0%, #0a0a1e 60%, #050510 100%)" }}>
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🧱</div>
          <p className="text-xl font-serif font-semibold text-white/80">Chargement...</p>
        </div>
      </div>
    );
  }

  const worldToViewLeft = (x: number) => x - cameraX;
  const progress = myControlledPlayer ? Math.floor((myControlledPlayer.x / level.goalX) * 100) : 0;
  const isFailed = state.phase === "failed";

  return (
    <div className="fixed inset-0 z-[140] flex flex-col select-none" style={{
      background: "linear-gradient(180deg, #0c1445 0%, #162055 30%, #1a2a60 60%, #0f1a40 100%)",
    }}>

      {/* ═══ TOP HUD ═══ */}
      <div className="relative flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-serif font-bold text-white/90 tracking-wide">
            🧱 Block Runner
          </span>
          <div className="flex gap-1.5">
            <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300/80">
              Niv. {state.levelIndex + 1}/{state.levelCount}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/40">
              #{state.attempt}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state.phase !== "waiting" && (
            <button
              onClick={() => sendAction({ action: "restart-level" })}
              className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[10px] font-semibold text-amber-300/80 transition-all hover:bg-amber-400/20"
            >
              Recommencer
            </button>
          )}
          <button
            onClick={() => router.push(`/room/${roomCode}`)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/50 transition-all hover:bg-white/10 hover:text-white/80"
          >
            Quitter
          </button>
        </div>
      </div>

      {/* ═══ PROGRESS BAR ═══ */}
      {state.phase === "playing" && isActivePlayer && (
        <div className="mx-3 mb-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #22c55e, #65dfb2, #4ecf8a)",
                boxShadow: "0 0 8px rgba(78,207,138,0.4)",
              }}
            />
          </div>
        </div>
      )}

      {/* ═══ WAITING / SETUP ═══ */}
      {state.phase === "waiting" && (
        <div className="mx-3 mb-2 rounded-2xl border border-white/15 p-4 backdrop-blur-sm"
          style={{ background: "rgba(10,15,40,0.85)" }}>
          <div className="flex flex-wrap items-start gap-6">
            {/* Player count */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-sans mb-2">Joueurs</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => sendAction({ action: "set-player-count", count })}
                    className={cn(
                      "w-9 h-9 rounded-lg font-mono text-sm font-bold transition-all",
                      state.playerCount === count
                        ? "bg-gradient-to-br from-[#65dfb2] to-[#4ecf8a] text-[#0a1a10] shadow-[0_0_15px_rgba(78,207,138,0.3)]"
                        : "border border-white/15 bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            {/* Color picker */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-sans mb-2">Couleur</p>
              <div className="flex gap-2">
                {state.palette.map((color) => {
                  const mine = myControlledPlayer?.color === color;
                  const info = COLOR_INFO[color];
                  return (
                    <button
                      key={color}
                      onClick={() => sendAction({ action: "set-color", color })}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        mine ? "scale-125 border-white" : "border-white/20 hover:border-white/50"
                      )}
                      style={{
                        backgroundColor: color,
                        boxShadow: mine ? `0 0 16px ${info?.glow ?? "rgba(255,255,255,0.3)"}` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {/* Launch */}
            <div className="ml-auto flex flex-col items-end gap-2">
              <span className="text-[10px] font-mono text-white/30">
                {activePlayers.length}/{state.playerCount} prets
              </span>
              <button
                onClick={() => sendAction({ action: "start-game" })}
                className="rounded-xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-6 py-2.5 text-sm font-bold text-[#0a1a10] shadow-[0_0_20px_rgba(78,207,138,0.3)] transition-all hover:shadow-[0_0_30px_rgba(78,207,138,0.5)] active:scale-95"
              >
                Lancer !
              </button>
            </div>
          </div>
          {state.spectators.length > 0 && (
            <p className="mt-3 text-[10px] text-white/20">Spectateurs: {state.spectators.map((s) => s.name).join(", ")}</p>
          )}
        </div>
      )}

      {/* ═══ GAME VIEWPORT ═══ */}
      <div
        className={cn(
          "mx-2 flex-1 overflow-hidden rounded-2xl border relative",
          isFailed ? "border-red-500/30" : "border-white/10"
        )}
        style={{
          background: "linear-gradient(180deg, #1e3a5f 0%, #2a4a70 40%, #1a3050 70%, #0f2040 100%)",
          boxShadow: isFailed
            ? "inset 0 0 40px rgba(239,68,68,0.15), 0 0 20px rgba(239,68,68,0.1)"
            : "inset 0 0 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[15, 45, 72, 88, 30, 60, 82, 10, 55, 38, 95, 22, 68, 78, 5, 50].map((left, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${left}%`,
                top: `${(i * 17 + 5) % 45}%`,
                width: `${i % 3 === 0 ? 2 : 1}px`,
                height: `${i % 3 === 0 ? 2 : 1}px`,
                opacity: 0.15 + (i % 4) * 0.1,
                animation: `twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Distant mountains */}
        <div className="absolute bottom-[84px] left-0 right-0 h-[60px] pointer-events-none" style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(15,25,50,0.6) 100%)",
          clipPath: "polygon(0% 100%, 5% 60%, 12% 80%, 20% 40%, 30% 70%, 40% 30%, 50% 60%, 60% 20%, 70% 50%, 80% 35%, 90% 65%, 95% 45%, 100% 100%)",
        }} />

        {/* Ground - grass + dirt */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: `${GROUND_H}px` }}>
          {/* Dirt */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(180deg, #3d2817 0%, #2a1a0e 50%, #1f1209 100%)",
          }} />
          {/* Grass top */}
          <div className="absolute top-0 left-0 right-0 h-[8px]" style={{
            background: "linear-gradient(180deg, #4ade80, #22c55e, #16a34a)",
            borderTop: "2px solid #86efac",
            boxShadow: "0 -2px 10px rgba(74,222,128,0.2)",
          }} />
          {/* Grass tufts */}
          <div className="absolute -top-[4px] left-0 right-0 h-[6px] pointer-events-none" style={{
            background: "repeating-linear-gradient(90deg, transparent 0px, transparent 8px, #4ade80 8px, #4ade80 10px, transparent 10px, transparent 20px)",
            opacity: 0.5,
          }} />
        </div>

        {/* === TRAPS (spikes) === */}
        {level.traps.map((trap, i) => {
          const leftPx = worldToViewLeft(trap.x);
          const leftPct = (leftPx / VIEW_W) * 100;
          const widthPct = (trap.w / VIEW_W) * 100;
          if (leftPct + widthPct < -15 || leftPct > 115) return null;
          return (
            <div
              key={`trap-${i}`}
              className="absolute"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                bottom: `${GROUND_H - 2}px`,
                height: "18px",
              }}
            >
              <TrapSpikes width={Math.max(20, Math.floor(trap.w))} />
            </div>
          );
        })}

        {/* === ENEMIES === */}
        {level.enemies.filter((e) => e.alive).map((enemy, i) => {
          const leftPx = worldToViewLeft(enemy.x);
          const leftPct = (leftPx / VIEW_W) * 100;
          if (leftPct < -20 || leftPct > 120) return null;
          return (
            <div
              key={`enemy-${i}`}
              className="absolute"
              style={{
                left: `${leftPct}%`,
                bottom: `${GROUND_H}px`,
                transform: "translateX(-50%)",
              }}
            >
              <EnemyCharacter enemy={enemy} />
            </div>
          );
        })}

        {/* === GOAL FLAG === */}
        <div
          className="absolute"
          style={{
            left: `${(worldToViewLeft(level.goalX) / VIEW_W) * 100}%`,
            bottom: `${GROUND_H}px`,
            transform: "translateX(-50%)",
          }}
        >
          <GoalFlag />
        </div>

        {/* === PLAYERS === */}
        {activePlayers.map((player) => {
          const leftPx = worldToViewLeft(player.x);
          const leftPct = (leftPx / VIEW_W) * 100;
          if (leftPct < -20 || leftPct > 120) return null;
          return (
            <div
              key={player.id}
              className="absolute"
              style={{
                left: `${leftPct}%`,
                bottom: `${GROUND_H + player.y}px`,
              }}
            >
              <PlayerCharacter
                player={player}
                isMe={player.id === state.myPlayerId}
              />
            </div>
          );
        })}

        {/* === DEATH OVERLAY === */}
        {isFailed && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: "radial-gradient(ellipse at center, rgba(220,38,38,0.2) 0%, rgba(0,0,0,0.4) 100%)" }}>
            <div className="text-center" style={{ animation: "fadeUp 0.3s ease-out" }}>
              <span className="text-4xl" style={{ filter: "drop-shadow(0 0 10px rgba(239,68,68,0.6))" }}>
                {state.failMessage?.includes("valide") ? "🎉" : "💀"}
              </span>
              <p className={cn(
                "text-lg font-serif font-bold mt-2",
                state.failMessage?.includes("valide") ? "text-emerald-300" : "text-red-300"
              )} style={{
                textShadow: state.failMessage?.includes("valide")
                  ? "0 0 20px rgba(52,211,153,0.5)"
                  : "0 0 20px rgba(239,68,68,0.5)",
              }}>
                {state.failMessage}
              </p>
            </div>
          </div>
        )}

        {/* === FINISHED OVERLAY === */}
        {state.phase === "finished" && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: "radial-gradient(ellipse at center, rgba(78,207,138,0.15) 0%, rgba(0,0,0,0.5) 100%)" }}>
            <div className="text-center rounded-3xl border border-white/20 bg-black/50 px-8 py-6 backdrop-blur-md"
              style={{ animation: "scaleIn 0.4s ease-out", boxShadow: "0 0 40px rgba(78,207,138,0.2)" }}>
              <span className="text-5xl block mb-3">🏆</span>
              <p className="text-2xl font-serif font-bold text-white/90" style={{
                textShadow: "0 0 20px rgba(250,204,21,0.5)",
              }}>
                Termine !
              </p>
              <p className="text-sm text-white/40 font-sans mt-2">Tous les niveaux sont termines</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div className="mx-3 mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activePlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border border-white/20" style={{
                backgroundColor: p.alive ? p.color : "#4b5563",
                boxShadow: p.alive ? `0 0 6px ${COLOR_INFO[p.color]?.glow ?? "rgba(255,255,255,0.2)"}` : undefined,
              }} />
              <span className="text-[10px] font-sans text-white/40">{p.name}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] font-mono text-white/25">
          {isActivePlayer ? `${progress}%` : "Spectateur"}
        </span>
      </div>

      {/* ═══ CONTROLS ═══ */}
      <div className="mx-2 mb-2 mt-auto grid grid-cols-[1fr_2fr_1fr] gap-2">
        {/* Joystick */}
        <div className="flex items-end justify-center rounded-2xl border border-white/10 p-2"
          style={{ background: "rgba(10,15,35,0.7)" }}>
          <div
            ref={joystickRef}
            className={cn(
              "relative h-28 w-28 touch-none rounded-full",
              isActivePlayer ? "opacity-100" : "opacity-30"
            )}
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              border: "2px solid rgba(255,255,255,0.12)",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.3)",
            }}
            onPointerDown={(e) => {
              if (!isActivePlayer || state.phase !== "playing") return;
              joystickPointerIdRef.current = e.pointerId;
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
              onJoystickPointer(e.clientX, e.clientY);
            }}
            onPointerUp={() => {
              if (!isActivePlayer) return;
              joystickPointerIdRef.current = null;
              stopMove();
            }}
            onPointerLeave={() => {
              if (!isActivePlayer) return;
              stopMove();
            }}
          >
            {/* Direction indicators */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/10 text-[8px]">▲</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/10 text-[8px]">▼</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/10 text-[8px]">◀</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10 text-[8px]">▶</div>
            {/* Nub */}
            <div
              className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                transform: `translate(calc(-50% + ${joystick.x}px), calc(-50% + ${joystick.y}px))`,
                background: joystick.active
                  ? "radial-gradient(circle, #67e8f9 0%, #22d3ee 50%, #06b6d4 100%)"
                  : "radial-gradient(circle, rgba(103,232,249,0.6) 0%, rgba(34,211,238,0.4) 100%)",
                boxShadow: joystick.active
                  ? "0 0 20px rgba(103,232,249,0.5), 0 0 40px rgba(34,211,238,0.2)"
                  : "0 0 10px rgba(103,232,249,0.2)",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            />
          </div>
        </div>

        {/* Middle spacer */}
        <div />

        {/* Jump button */}
        <div className="flex items-end justify-center rounded-2xl border border-white/10 p-2"
          style={{ background: "rgba(10,15,35,0.7)" }}>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              if (!isActivePlayer || state.phase !== "playing") return;
              sendAction({ action: "jump" });
            }}
            className={cn(
              "h-24 w-24 touch-none rounded-full border-2 transition-all active:scale-90",
              isActivePlayer
                ? "border-amber-400/40 text-white/90"
                : "border-white/10 text-white/20 opacity-30"
            )}
            style={{
              background: isActivePlayer
                ? "radial-gradient(circle at 40% 35%, rgba(251,191,36,0.35), rgba(245,158,11,0.2) 60%, rgba(234,88,12,0.15))"
                : "rgba(255,255,255,0.03)",
              boxShadow: isActivePlayer
                ? "0 0 20px rgba(251,191,36,0.15), inset 0 -3px 10px rgba(0,0,0,0.2)"
                : undefined,
            }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl" style={{
                filter: isActivePlayer ? "drop-shadow(0 0 6px rgba(251,191,36,0.5))" : undefined,
              }}>⬆</span>
              <span className="text-[10px] font-bold tracking-wider uppercase">Saut</span>
            </div>
          </button>
        </div>
      </div>

      {/* ═══ ERROR ═══ */}
      {error && (
        <p className="mx-3 mb-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] text-red-300 backdrop-blur-sm">
          {error}
        </p>
      )}

      {/* ═══ LANDSCAPE OVERLAY ═══ */}
      {!isLandscape && (
        <div className="absolute inset-0 z-[180] flex items-center justify-center p-6 text-center"
          style={{ background: "rgba(0,0,0,0.9)" }}>
          <div className="rounded-3xl border border-white/15 bg-black/60 p-8 backdrop-blur-md max-w-xs"
            style={{ boxShadow: "0 0 40px rgba(56,189,248,0.1)" }}>
            <span className="text-5xl block mb-4">📱</span>
            <p className="text-xl font-serif font-bold text-white/90 mb-2">Mode Paysage</p>
            <p className="text-sm text-white/40 font-sans leading-relaxed">
              Tourne ton telephone pour jouer comme sur Switch
            </p>
            <div className="mt-4 flex justify-center gap-6 text-white/20">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-lg">🕹</div>
                <span className="text-[9px] mt-1 block">Gauche</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-lg">⬆</div>
                <span className="text-[9px] mt-1 block">Droite</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Twinkle animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
