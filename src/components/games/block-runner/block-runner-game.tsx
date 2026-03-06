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
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const sendMoveRef = useRef<number>(0);

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

  const sendMove = useCallback(
    (moveX: number) => {
      sendAction({ action: "input", moveX });
    },
    [sendAction]
  );

  const stopMove = useCallback(() => {
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
      const now = Date.now();
      if (now - sendMoveRef.current > 45) {
        sendMove(moveX);
        sendMoveRef.current = now;
      }
      setJoystick({ x: dx, y: dy, active: true });
    },
    [sendMove]
  );

  useEffect(() => {
    return () => {
      sendMove(0);
    };
  }, [sendMove]);

  if (!state || !level) {
    return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#05080f] font-sans text-white/70">
        Chargement...
      </div>
    );
  }

  const worldToViewLeft = (x: number) => x - cameraX;
  const progress = myControlledPlayer ? Math.floor((myControlledPlayer.x / level.goalX) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[140] flex flex-col bg-[#070c16] font-sans text-white">
      <div className="relative flex items-center justify-between p-3">
        <div className="text-xs text-white/85">
          Niveau {state.levelIndex + 1}/{state.levelCount} • Tentative {state.attempt}
        </div>
        <button
          onClick={() => router.push(`/room/${roomCode}`)}
          className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/90"
        >
          Quitter la partie
        </button>
      </div>

      {state.phase === "waiting" && (
        <div className="mx-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-sm text-white/85">Nombre de joueurs (max 5)</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((count) => (
              <button
                key={count}
                onClick={() => sendAction({ action: "set-player-count", count })}
                className={
                  state.playerCount === count
                    ? "rounded-lg border border-emerald-300/40 bg-emerald-400/20 px-2 py-2 text-sm text-emerald-100"
                    : "rounded-lg border border-white/15 bg-white/[0.03] px-2 py-2 text-sm text-white/85"
                }
              >
                {count}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-white/85">Choisis ta couleur</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.palette.map((color) => {
              const mine = myControlledPlayer?.color === color;
              return (
                <button
                  key={color}
                  onClick={() => sendAction({ action: "set-color", color })}
                  className={`h-8 w-8 rounded-full border-2 ${mine ? "border-white" : "border-white/25"}`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 text-xs">
            <span className="text-white/70">
              Actifs: {activePlayers.length}/{state.playerCount}
            </span>
            <button
              onClick={() => sendAction({ action: "start-game" })}
              className="rounded-lg border border-emerald-300/35 bg-emerald-500/30 px-3 py-2 text-emerald-100"
            >
              Lancer
            </button>
          </div>
          {state.spectators.length > 0 && (
            <p className="mt-2 text-xs text-white/55">Spectateurs: {state.spectators.map((s) => s.name).join(", ")}</p>
          )}
        </div>
      )}

      <div className="mx-3 mt-3 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-sky-300/25 to-emerald-300/10">
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
                  className="absolute rounded-md bg-fuchsia-500 shadow-[0_0_16px_rgba(217,70,239,0.35)]"
                  style={{
                    left: `${left}%`,
                    bottom: `${GROUND_H}px`,
                    width: `${Math.max(16, enemy.w)}px`,
                    height: `${enemy.h}px`,
                  }}
                />
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

      <div className="mx-3 mt-2 flex items-center justify-between text-xs text-white/75">
        <span>{state.failMessage ?? (isActivePlayer ? `Progression ${progress}%` : "Mode spectateur")}</span>
        {state.phase !== "waiting" && (
          <button
            onClick={() => sendAction({ action: "restart-level" })}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs"
          >
            Recommencer
          </button>
        )}
      </div>

      {state.phase === "finished" && (
        <div className="mx-3 mt-2 rounded-xl border border-emerald-300/30 bg-emerald-500/20 p-3 text-sm text-emerald-100">
          Tous les niveaux sont termines.
        </div>
      )}

      <div className="mx-3 mb-4 mt-auto flex items-end justify-between">
        <div
          ref={joystickRef}
          className={`relative h-24 w-24 rounded-full border border-white/20 bg-white/5 ${isActivePlayer ? "" : "opacity-40"}`}
          onPointerDown={(e) => {
            if (!isActivePlayer || state.phase !== "playing") return;
            onJoystickPointer(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!isActivePlayer || state.phase !== "playing") return;
            if (e.buttons !== 1) return;
            onJoystickPointer(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            if (!isActivePlayer) return;
            stopMove();
          }}
          onPointerLeave={() => {
            if (!isActivePlayer) return;
            stopMove();
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/80"
            style={{ transform: `translate(calc(-50% + ${joystick.x}px), calc(-50% + ${joystick.y}px))` }}
          />
        </div>

        <button
          onClick={() => {
            if (!isActivePlayer || state.phase !== "playing") return;
            sendAction({ action: "jump" });
          }}
          className={`h-20 w-20 rounded-full border border-amber-300/40 bg-amber-500/25 text-sm text-amber-100 ${isActivePlayer ? "" : "opacity-40"}`}
        >
          Saut
        </button>
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
