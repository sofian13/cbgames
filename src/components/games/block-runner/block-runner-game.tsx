"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";

type RunnerPlayer = {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  vy: number;
  alive: boolean;
  finished: boolean;
};

type RunnerEnemy = {
  x: number;
  w: number;
  h: number;
  alive: boolean;
};

type RunnerTrap = {
  x: number;
  w: number;
};

type RunnerLevel = {
  id: number;
  goalX: number;
  enemies: RunnerEnemy[];
  traps: RunnerTrap[];
};

type RunnerState = {
  phase: "setup" | "playing" | "failed" | "cleared" | "finished";
  playerCount: number;
  levelIndex: number;
  attempt: number;
  levels: RunnerLevel[];
  players: RunnerPlayer[];
  failMessage: string | null;
};

const PLAYER_COLORS = ["#f97316", "#22c55e", "#3b82f6", "#f43f5e", "#a855f7"];
const PLAYER_SPEED = 18;
const GRAVITY = -52;
const JUMP_VELOCITY = 22;
const PLAYER_WIDTH = 3.8;
const ENEMY_FOOT_OFFSET = 0.4;

function createLevels(): RunnerLevel[] {
  return [
    {
      id: 1,
      goalX: 130,
      enemies: [
        { x: 28, w: 4, h: 4, alive: true },
        { x: 62, w: 4, h: 4, alive: true },
        { x: 95, w: 4, h: 4, alive: true },
      ],
      traps: [{ x: 45, w: 8 }, { x: 82, w: 7 }],
    },
    {
      id: 2,
      goalX: 145,
      enemies: [
        { x: 24, w: 4, h: 4, alive: true },
        { x: 49, w: 4, h: 4, alive: true },
        { x: 76, w: 4, h: 4, alive: true },
        { x: 112, w: 4, h: 4, alive: true },
      ],
      traps: [{ x: 35, w: 7 }, { x: 64, w: 8 }, { x: 99, w: 7 }],
    },
    {
      id: 3,
      goalX: 165,
      enemies: [
        { x: 20, w: 4, h: 4, alive: true },
        { x: 44, w: 4, h: 4, alive: true },
        { x: 70, w: 4, h: 4, alive: true },
        { x: 96, w: 4, h: 4, alive: true },
        { x: 126, w: 4, h: 4, alive: true },
      ],
      traps: [{ x: 30, w: 8 }, { x: 58, w: 8 }, { x: 87, w: 8 }, { x: 117, w: 8 }],
    },
  ];
}

function createPlayers(playerCount: number): RunnerPlayer[] {
  return Array.from({ length: playerCount }, (_, i) => ({
    id: `p-${i + 1}`,
    name: `Joueur ${i + 1}`,
    color: PLAYER_COLORS[i],
    x: 0,
    y: 0,
    vy: 0,
    alive: true,
    finished: false,
  }));
}

function overlaps(aX: number, aW: number, bX: number, bW: number) {
  return aX < bX + bW && aX + aW > bX;
}

function resetLevelPlayers(players: RunnerPlayer[]): RunnerPlayer[] {
  return players.map((p) => ({ ...p, x: 0, y: 0, vy: 0, alive: true, finished: false }));
}

function cloneLevel(level: RunnerLevel): RunnerLevel {
  return {
    ...level,
    enemies: level.enemies.map((e) => ({ ...e })),
    traps: level.traps.map((t) => ({ ...t })),
  };
}

function nextTick(state: RunnerState, dt: number, runPressed: Set<string>): RunnerState {
  if (state.phase !== "playing") return state;
  const currentLevel = cloneLevel(state.levels[state.levelIndex]);

  const players = state.players.map((player) => {
    if (!player.alive || player.finished) return player;
    const prevY = player.y;
    let x = player.x;
    let y = player.y;
    let vy = player.vy;

    if (runPressed.has(player.id)) {
      x += PLAYER_SPEED * dt;
    }
    vy += GRAVITY * dt;
    y += vy * dt;
    if (y <= 0) {
      y = 0;
      if (vy < 0) vy = 0;
    }

    const trapHit = currentLevel.traps.some((trap) => overlaps(x, PLAYER_WIDTH, trap.x, trap.w) && y <= 0.2);
    if (trapHit) {
      return { ...player, x, y, vy, alive: false };
    }

    for (let i = 0; i < currentLevel.enemies.length; i++) {
      const enemy = currentLevel.enemies[i];
      if (!enemy.alive) continue;
      if (!overlaps(x, PLAYER_WIDTH, enemy.x, enemy.w)) continue;
      if (y > enemy.h + 0.3 || y === 0) {
        continue;
      }

      const stomped = prevY > enemy.h + ENEMY_FOOT_OFFSET && y <= enemy.h + ENEMY_FOOT_OFFSET && vy < 0;
      if (stomped) {
        currentLevel.enemies[i] = { ...enemy, alive: false };
        vy = JUMP_VELOCITY * 0.75;
      } else {
        return { ...player, x, y, vy, alive: false };
      }
    }

    const finished = x >= currentLevel.goalX;
    return { ...player, x, y, vy, finished };
  });

  if (players.some((p) => !p.alive)) {
    return {
      ...state,
      phase: "failed",
      players,
      failMessage: "Un joueur est mort. On recommence le niveau.",
    };
  }

  const allFinished = players.every((p) => p.finished);
  if (allFinished) {
    if (state.levelIndex >= state.levels.length - 1) {
      return { ...state, phase: "finished", players, failMessage: null };
    }
    return { ...state, phase: "cleared", players, failMessage: null };
  }

  const updatedLevels = state.levels.map((lvl, idx) => (idx === state.levelIndex ? currentLevel : lvl));
  return { ...state, players, levels: updatedLevels, failMessage: null };
}

export default function BlockRunnerGame({ roomCode, playerId, playerName }: GameProps) {
  useGame(roomCode, "block-runner", playerId, playerName);
  const { error } = useGameStore();

  const [state, setState] = useState<RunnerState>({
    phase: "setup",
    playerCount: 3,
    levelIndex: 0,
    attempt: 1,
    levels: createLevels(),
    players: [],
    failMessage: null,
  });

  const runPressed = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const level = state.levels[state.levelIndex];
  const progressByPlayer = useMemo(
    () =>
      state.players.map((p) => ({
        ...p,
        progress: level ? Math.min(100, (p.x / level.goalX) * 100) : 0,
      })),
    [level, state.players]
  );

  const startGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "playing",
      levelIndex: 0,
      attempt: 1,
      levels: createLevels(),
      players: createPlayers(prev.playerCount),
      failMessage: null,
    }));
  }, []);

  const jump = useCallback((id: string) => {
    setState((prev) => {
      if (prev.phase !== "playing") return prev;
      return {
        ...prev,
        players: prev.players.map((p) => {
          if (p.id !== id || !p.alive || p.finished) return p;
          if (p.y > 0.01) return p;
          return { ...p, vy: JUMP_VELOCITY };
        }),
      };
    });
  }, []);

  const restartCurrentLevel = useCallback((incrementAttempt: boolean) => {
    setState((prev) => {
      const freshLevel = cloneLevel(createLevels()[prev.levelIndex]);
      return {
        ...prev,
        phase: "playing",
        failMessage: null,
        levels: prev.levels.map((lvl, idx) => (idx === prev.levelIndex ? freshLevel : lvl)),
        players: resetLevelPlayers(prev.players),
        attempt: incrementAttempt ? prev.attempt + 1 : prev.attempt,
      };
    });
  }, []);

  const goNextLevel = useCallback(() => {
    setState((prev) => {
      if (prev.levelIndex >= prev.levels.length - 1) return prev;
      const nextLevelIndex = prev.levelIndex + 1;
      const levelsTemplate = createLevels();
      return {
        ...prev,
        phase: "playing",
        levelIndex: nextLevelIndex,
        levels: prev.levels.map((lvl, idx) => (idx === nextLevelIndex ? cloneLevel(levelsTemplate[nextLevelIndex]) : lvl)),
        players: resetLevelPlayers(prev.players),
      };
    });
  }, []);

  useEffect(() => {
    if (state.phase !== "playing") return;
    const frame = (time: number) => {
      const last = lastTickRef.current || time;
      const dt = Math.min(0.04, (time - last) / 1000);
      lastTickRef.current = time;
      setState((prev) => nextTick(prev, dt, runPressed.current));
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = 0;
    };
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "failed") {
      const timer = setTimeout(() => restartCurrentLevel(true), 1200);
      return () => clearTimeout(timer);
    }
    if (state.phase === "cleared") {
      const timer = setTimeout(() => goNextLevel(), 1200);
      return () => clearTimeout(timer);
    }
  }, [goNextLevel, restartCurrentLevel, state.phase]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden p-4 font-sans sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_85%_75%,rgba(251,146,60,0.14),transparent_38%),linear-gradient(145deg,#0f172a,#111827)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Niveaux coop</p>
            <h2 className="text-2xl text-white">Bloc Runner</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90">
              Niveau {state.levelIndex + 1}/{state.levels.length}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90">
              Tentative {state.attempt}
            </span>
          </div>
        </div>

        {state.phase === "setup" && (
          <div className="mt-6 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/85">Choisis le nombre de joueurs (max 5)</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setState((prev) => ({ ...prev, playerCount: count }))}
                  className={
                    state.playerCount === count
                      ? "rounded-lg border border-emerald-300/50 bg-emerald-400/15 px-2 py-2 text-sm text-emerald-100"
                      : "rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white/80"
                  }
                >
                  {count}
                </button>
              ))}
            </div>
            <button
              onClick={startGame}
              className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-500/80 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Lancer la partie
            </button>
          </div>
        )}

        {state.phase !== "setup" && level && (
          <>
            <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-sky-500/15 to-emerald-500/8 p-3">
              <div className="relative h-64 overflow-hidden rounded-xl border border-white/10 bg-[#70c9ff]/20 sm:h-72">
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#1f7a1f]/70" />
                {level.traps.map((trap, i) => (
                  <div
                    key={`trap-${i}`}
                    className="absolute bottom-0 h-5 bg-gradient-to-r from-red-500/90 to-orange-500/95"
                    style={{
                      left: `${(trap.x / level.goalX) * 100}%`,
                      width: `${(trap.w / level.goalX) * 100}%`,
                    }}
                  />
                ))}
                {level.enemies.filter((e) => e.alive).map((enemy, i) => (
                  <div
                    key={`enemy-${i}`}
                    className="absolute bottom-14 rounded-sm bg-fuchsia-500"
                    style={{
                      left: `${(enemy.x / level.goalX) * 100}%`,
                      width: `${Math.max(1.8, (enemy.w / level.goalX) * 100)}%`,
                      height: `${enemy.h * 8}px`,
                    }}
                  />
                ))}
                <div
                  className="absolute bottom-14 w-1 bg-yellow-300"
                  style={{ left: "99%", height: "180px" }}
                />
                {state.players.map((player) => (
                  <div
                    key={player.id}
                    className="absolute rounded-sm shadow-[0_0_0_2px_rgba(255,255,255,0.2)]"
                    style={{
                      left: `${Math.min(99, (player.x / level.goalX) * 100)}%`,
                      bottom: `${56 + player.y * 8}px`,
                      width: "20px",
                      height: "20px",
                      background: player.alive ? player.color : "#6b7280",
                      transform: "translateX(-50%)",
                      opacity: player.finished ? 0.6 : 1,
                    }}
                    title={player.name}
                  />
                ))}
              </div>
            </div>

            {state.phase === "failed" && <p className="mt-3 text-sm text-red-300">{state.failMessage}</p>}
            {state.phase === "cleared" && <p className="mt-3 text-sm text-emerald-300">Niveau valide. Niveau suivant...</p>}
            {state.phase === "finished" && (
              <p className="mt-3 text-sm text-emerald-200">Tous les niveaux sont termines. Bien joue.</p>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {progressByPlayer.map((player) => (
                <div key={`progress-${player.id}`} className="rounded-xl border border-white/12 bg-white/[0.04] p-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-white/85">
                    <span>{player.name}</span>
                    <span>{Math.floor(player.progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${player.progress}%`,
                        background: player.color,
                        transition: "width 100ms linear",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {state.phase === "playing" && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {state.players.map((player) => (
                  <div key={`ctrl-${player.id}`} className="rounded-xl border border-white/12 bg-white/[0.04] p-3">
                    <p className="mb-2 text-xs text-white/85">{player.name}</p>
                    <div className="flex gap-2">
                      <button
                        onPointerDown={() => runPressed.current.add(player.id)}
                        onPointerUp={() => runPressed.current.delete(player.id)}
                        onPointerLeave={() => runPressed.current.delete(player.id)}
                        onTouchEnd={() => runPressed.current.delete(player.id)}
                        className="flex-1 rounded-lg border border-cyan-300/40 bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100"
                      >
                        Avancer
                      </button>
                      <button
                        onClick={() => jump(player.id)}
                        className="flex-1 rounded-lg border border-amber-300/40 bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                      >
                        Sauter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => restartCurrentLevel(false)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90"
              >
                Recommencer le niveau
              </button>
              <button
                onClick={() => setState((prev) => ({ ...prev, phase: "setup", players: [], levels: createLevels(), levelIndex: 0 }))}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90"
              >
                Retour au choix des joueurs
              </button>
            </div>
          </>
        )}

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}
