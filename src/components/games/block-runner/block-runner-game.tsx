"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";

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
const JOY_RADIUS = 38;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

  if (!state || !level) {
    return (
      <div
        className="fixed inset-0 z-[140] flex items-center justify-center font-sans text-white/40"
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(56, 189, 248, 0.12), transparent 40%), #05080f",
        }}
      >
        <span className="text-3xl font-semibold tracking-wide text-white/90">Chargement...</span>
      </div>
    );
  }

  const worldToViewLeft = (x: number) => x - cameraX;
  const progress = myControlledPlayer ? Math.floor((myControlledPlayer.x / level.goalX) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[140] flex flex-col font-sans text-white"
      style={{
        background: "radial-gradient(circle at 50% 25%, rgba(56, 189, 248, 0.1), transparent 40%), radial-gradient(circle at 80% 80%, rgba(78, 207, 138, 0.06), transparent 35%), #070c16",
      }}
    >
      {/* --- Top bar --- */}
      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg font-semibold tracking-wide text-white/90">
            Block Runner
          </span>
          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-0.5 font-mono text-xs text-white/40 backdrop-blur-sm">
            Niv. {state.levelIndex + 1}/{state.levelCount}
          </span>
          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-0.5 font-mono text-xs text-white/40 backdrop-blur-sm">
            #{state.attempt}
          </span>
        </div>
        <button
          onClick={() => router.push(`/room/${roomCode}`)}
          className="rounded-xl border border-white/25 bg-black/30 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-black/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          Quitter la partie
        </button>
      </div>

      {/* --- Waiting / Setup panel --- */}
      {state.phase === "waiting" && (
        <div
          className="mx-4 rounded-3xl border border-white/25 bg-black/30 p-5 backdrop-blur-sm shadow-[0_0_20px_rgba(56,189,248,0.08)]"
        >
          <p className="font-sans text-sm font-semibold text-white/90">Nombre de joueurs (max 5)</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((count) => (
              <button
                key={count}
                onClick={() => sendAction({ action: "set-player-count", count })}
                className={
                  state.playerCount === count
                    ? "rounded-xl border border-[#65dfb2]/50 bg-gradient-to-r from-[#65dfb2]/25 to-[#4ecf8a]/25 px-2 py-2.5 font-mono text-sm font-semibold text-white/90 shadow-[0_0_20px_rgba(78,207,138,0.25)] transition-all"
                    : "rounded-xl border border-white/15 bg-white/[0.03] px-2 py-2.5 font-mono text-sm text-white/40 transition-all hover:border-white/25 hover:bg-white/[0.06]"
                }
              >
                {count}
              </button>
            ))}
          </div>

          <p className="mt-5 font-sans text-sm font-semibold text-white/90">Choisis ta couleur</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {state.palette.map((color) => {
              const mine = myControlledPlayer?.color === color;
              return (
                <button
                  key={color}
                  onClick={() => sendAction({ action: "set-color", color })}
                  className={`h-9 w-9 rounded-full border-2 transition-all ${mine ? "border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.25)]" : "border-white/25 hover:border-white/50"}`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-white/40">
              Actifs: {activePlayers.length}/{state.playerCount}
            </span>
            <button
              onClick={() => sendAction({ action: "start-game" })}
              className="rounded-xl bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] px-5 py-2.5 text-sm font-semibold text-[#0a1a10] shadow-[0_0_20px_rgba(78,207,138,0.25)] transition-all hover:shadow-[0_0_30px_rgba(78,207,138,0.35)]"
            >
              Lancer
            </button>
          </div>
          {state.spectators.length > 0 && (
            <p className="mt-3 text-xs text-white/25">Spectateurs: {state.spectators.map((s) => s.name).join(", ")}</p>
          )}
        </div>
      )}

      {/* --- Game viewport --- */}
      <div
        className="mx-3 mt-3 flex-1 overflow-hidden rounded-3xl border border-white/25 shadow-[0_0_20px_rgba(56,189,248,0.08)]"
        style={{
          background: "linear-gradient(to bottom, rgba(56,189,248,0.18), rgba(78,207,138,0.08))",
        }}
      >
        <div className="relative h-full w-full">
          <div className="absolute bottom-0 left-0 right-0" style={{ height: `${GROUND_H}px`, background: "rgba(26,109,39,0.8)" }} />

          {level.traps.map((trap, i) => {
            const left = (worldToViewLeft(trap.x) / VIEW_W) * 100;
            const width = (trap.w / VIEW_W) * 100;
            if (left + width < -15 || left > 115) return null;
            return (
              <div
                key={`trap-${i}`}
                className="absolute bottom-0 bg-gradient-to-r from-red-600 to-orange-500"
                style={{ left: `${left}%`, width: `${width}%`, height: "22px" }}
              />
            );
          })}

          {level.enemies
            .filter((e) => e.alive)
            .map((enemy, i) => {
              const left = (worldToViewLeft(enemy.x) / VIEW_W) * 100;
              if (left < -20 || left > 120) return null;
              return (
                <div
                  key={`enemy-${i}`}
                  className="absolute flex items-center justify-center rounded-md bg-fuchsia-700 shadow-[0_0_16px_rgba(217,70,239,0.35)]"
                  style={{
                    left: `${left}%`,
                    bottom: `${GROUND_H}px`,
                    width: `${Math.max(16, enemy.w)}px`,
                    height: `${enemy.h}px`,
                  }}
                >
                  <span className="text-[16px] leading-none">👾</span>
                </div>
              );
            })}

          <div
            className="absolute bottom-[84px] w-1 bg-yellow-300"
            style={{ left: `${(worldToViewLeft(level.goalX) / VIEW_W) * 100}%`, height: "220px" }}
          />

          {activePlayers.map((player) => {
            const left = (worldToViewLeft(player.x) / VIEW_W) * 100;
            if (left < -20 || left > 120) return null;
            return (
              <div
                key={player.id}
                className="absolute rounded-sm shadow-[0_0_0_2px_rgba(255,255,255,0.28)]"
                style={{
                  left: `${left}%`,
                  bottom: `${GROUND_H + player.y}px`,
                  width: `${PLAYER_W}px`,
                  height: `${PLAYER_H}px`,
                  backgroundColor: player.alive ? player.color : "#6b7280",
                  transform: "translateX(-50%)",
                  opacity: player.finished ? 0.7 : 1,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* --- Status bar --- */}
      <div className="mx-4 mt-2 flex items-center justify-between">
        <span className="font-sans text-sm font-semibold text-white/90">
          {state.failMessage ?? (isActivePlayer ? `Progression ${progress}%` : "Mode spectateur")}
        </span>
        {state.phase !== "waiting" && (
          <button
            onClick={() => sendAction({ action: "restart-level" })}
            className="rounded-xl border border-white/25 bg-black/30 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-black/40"
          >
            Recommencer
          </button>
        )}
      </div>

      {/* --- Progress bar (playing) --- */}
      {state.phase === "playing" && isActivePlayer && (
        <div className="mx-4 mt-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#65dfb2] to-[#4ecf8a] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* --- Finished banner --- */}
      {state.phase === "finished" && (
        <div
          className="mx-4 mt-3 rounded-3xl border border-white/25 bg-black/30 p-5 text-center backdrop-blur-sm shadow-[0_0_20px_rgba(78,207,138,0.25)]"
        >
          <p className="font-serif text-3xl font-semibold text-white/90">Termine !</p>
          <p className="mt-2 text-sm text-white/40">Tous les niveaux sont termines.</p>
        </div>
      )}

      {/* --- Controls (Joystick + Jump) --- */}
      <div className="mx-3 mb-3 mt-auto grid grid-cols-[1fr_2fr_1fr] gap-2">
        {/* Joystick area */}
        <div className="flex items-end justify-center rounded-3xl border border-white/25 bg-black/30 p-3 backdrop-blur-sm">
          <div
            ref={joystickRef}
            className={`relative h-28 w-28 touch-none rounded-full border border-white/20 bg-white/5 ${isActivePlayer ? "" : "opacity-40"}`}
            onPointerDown={(e) => {
              if (!isActivePlayer || state.phase !== "playing") return;
              joystickPointerIdRef.current = e.pointerId;
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
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
            <div
              className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/80 shadow-[0_0_20px_rgba(103,232,249,0.25)]"
              style={{ transform: `translate(calc(-50% + ${joystick.x}px), calc(-50% + ${joystick.y}px))` }}
            />
          </div>
        </div>

        {/* Middle spacer */}
        <div />

        {/* Jump button area */}
        <div className="flex items-end justify-center rounded-3xl border border-white/25 bg-black/30 p-3 backdrop-blur-sm">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              if (!isActivePlayer || state.phase !== "playing") return;
              sendAction({ action: "jump" });
            }}
            className={`h-24 w-24 touch-none rounded-full border-2 border-amber-300/40 text-sm font-semibold transition-all ${isActivePlayer ? "bg-gradient-to-br from-amber-400/30 to-orange-500/25 text-white/90 shadow-[0_0_20px_rgba(251,191,36,0.2)] active:shadow-[0_0_30px_rgba(251,191,36,0.35)]" : "bg-amber-500/10 text-white/25 opacity-40"}`}
          >
            Saut
          </button>
        </div>
      </div>

      {/* --- Error display --- */}
      {error && (
        <p className="mx-4 mb-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 backdrop-blur-sm">
          {error}
        </p>
      )}

      {/* --- Landscape warning overlay --- */}
      {!isLandscape && (
        <div className="absolute inset-0 z-[180] flex items-center justify-center bg-black/82 p-6 text-center">
          <div
            className="rounded-3xl border border-white/25 bg-black/30 p-8 backdrop-blur-sm shadow-[0_0_20px_rgba(56,189,248,0.15)]"
          >
            <p className="font-serif text-3xl font-semibold text-white/90">Mode Paysage</p>
            <p className="mt-3 text-sm text-white/40">
              Tourne le telephone en mode paysage pour jouer comme sur Switch.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
