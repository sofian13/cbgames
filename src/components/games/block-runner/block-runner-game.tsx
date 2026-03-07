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

type EnemyState = {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
};

type HazardState = {
  kind: "saw" | "orb";
  x: number;
  y: number;
  w: number;
  h: number;
};

type LevelState = {
  id: number;
  goalX: number;
  traps: Array<{ x: number; w: number }>;
  gaps: Array<{ x: number; w: number }>;
  enemies: EnemyState[];
  hazards: HazardState[];
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
const GROUND_H = 82;
const PLAYER_W = 28;
const JOY_RADIUS = 44;

const COLOR_INFO: Record<string, { glow: string; shadow: string }> = {
  "#ef4444": { glow: "rgba(239,68,68,0.45)", shadow: "#991b1b" },
  "#f59e0b": { glow: "rgba(245,158,11,0.45)", shadow: "#b45309" },
  "#22c55e": { glow: "rgba(34,197,94,0.45)", shadow: "#15803d" },
  "#3b82f6": { glow: "rgba(59,130,246,0.45)", shadow: "#1d4ed8" },
  "#a855f7": { glow: "rgba(168,85,247,0.45)", shadow: "#7e22ce" },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function worldPercent(worldX: number, cameraX: number) {
  return ((worldX - cameraX) / VIEW_W) * 100;
}

function buildGroundSegments(
  goalX: number,
  gaps: Array<{ x: number; w: number }> | null | undefined
) {
  const safeGaps = Array.isArray(gaps) ? gaps : [];
  const ordered = [...safeGaps].sort((a, b) => a.x - b.x);
  const segments: Array<{ x: number; w: number }> = [];
  let cursor = 0;

  for (const gap of ordered) {
    if (gap.x > cursor) {
      segments.push({ x: cursor, w: gap.x - cursor });
    }
    cursor = gap.x + gap.w;
  }

  const tailEnd = goalX + 180;
  if (cursor < tailEnd) {
    segments.push({ x: cursor, w: tailEnd - cursor });
  }

  return segments;
}

function PlayerCharacter({
  player,
  isMe,
}: {
  player: PlayerState;
  isMe: boolean;
}) {
  const colorInfo = COLOR_INFO[player.color] ?? {
    glow: "rgba(255,255,255,0.25)",
    shadow: "#475569",
  };
  const isDead = !player.alive;

  return (
    <div
      className="absolute transition-[left,bottom,opacity] duration-75 linear"
      style={{
        width: `${PLAYER_W}px`,
        height: `${PLAYER_W}px`,
        transform: "translateX(-50%)",
        opacity: isDead ? 0.12 : player.finished ? 0.78 : 1,
      }}
    >
      <div
        className="absolute left-1/2 top-full h-2 w-7 -translate-x-1/2 rounded-full"
        style={{
          background: isDead ? "rgba(15,23,42,0.5)" : colorInfo.glow,
          filter: "blur(7px)",
        }}
      />
      <div
        className="relative h-full w-full overflow-hidden rounded-[10px] border border-white/30"
        style={{
          background: `linear-gradient(180deg, ${player.color} 0%, ${colorInfo.shadow} 100%)`,
          boxShadow: isDead
            ? "none"
            : `0 8px 18px ${colorInfo.glow}, inset 0 2px 0 rgba(255,255,255,0.28)`,
        }}
      >
        <div className="absolute inset-x-[3px] top-[3px] h-[8px] rounded-full bg-white/18" />
        <div className="absolute left-1/2 top-[8px] flex -translate-x-1/2 gap-[6px]">
          <span className="h-[6px] w-[5px] rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.35)]" />
          <span className="h-[6px] w-[5px] rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.35)]" />
        </div>
        <div className="absolute bottom-[6px] left-1/2 h-[4px] w-[10px] -translate-x-1/2 rounded-full bg-slate-950/30" />
      </div>
      {isMe ? (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/12 bg-slate-950/55 px-2 py-0.5 text-[9px] font-semibold text-white/78 backdrop-blur">
          {player.name}
        </div>
      ) : null}
    </div>
  );
}

function EnemyCrawler({ enemy }: { enemy: EnemyState }) {
  if (!enemy.alive) return null;

  return (
    <div
      className="absolute"
      style={{
        width: `${Math.max(24, enemy.w)}px`,
        height: `${enemy.h}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-t-[12px] rounded-b-[8px] border border-fuchsia-300/25 bg-[linear-gradient(180deg,#fb7185_0%,#c026d3_52%,#581c87_100%)] shadow-[0_10px_25px_rgba(168,85,247,0.24)]">
        <div className="absolute inset-x-1 top-1 h-[7px] rounded-full bg-white/12" />
        <div className="absolute left-1/2 top-[6px] flex -translate-x-1/2 gap-[4px]">
          <span className="h-[5px] w-[5px] rounded-full bg-white" />
          <span className="h-[5px] w-[5px] rounded-full bg-white" />
        </div>
        <div className="absolute bottom-[4px] left-1/2 h-[3px] w-[11px] -translate-x-1/2 rounded-full bg-rose-950/40" />
      </div>
      <div className="absolute -top-[6px] left-1/2 flex -translate-x-1/2 gap-[2px]">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            className="block h-0 w-0"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: "6px solid #f472b6",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TrapSpikes({ width }: { width: number }) {
  const count = Math.max(3, Math.floor(width / 12));

  return (
    <div className="absolute inset-x-0 bottom-0">
      <div className="absolute inset-x-0 bottom-0 h-2 rounded-t-[6px] bg-[linear-gradient(180deg,#ef4444_0%,#7f1d1d_100%)] shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
      <div className="absolute bottom-[4px] left-0 flex w-full items-end">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex-1 px-[1px]">
            <div
              className="mx-auto h-0 w-0"
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderBottom: "15px solid #f97316",
                filter: "drop-shadow(0 0 4px rgba(249,115,22,0.5))",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GapPit() {
  return (
    <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden rounded-t-[16px] bg-[linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.88)_18%,rgba(2,6,23,1)_100%)]">
      <div className="absolute inset-x-0 top-0 h-3 bg-[linear-gradient(180deg,rgba(34,211,238,0.4)_0%,rgba(34,211,238,0)_100%)] opacity-70" />
      <div className="absolute inset-x-[8%] top-[18px] h-[20px] rounded-full bg-cyan-400/8 blur-xl" />
      <div className="absolute inset-x-0 bottom-0 h-[52%] bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),rgba(2,6,23,0)_55%)]" />
      <div className="absolute inset-x-0 bottom-0 flex justify-around px-2 pb-2 opacity-55">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className="block h-0 w-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "14px solid rgba(34,211,238,0.24)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MovingHazard({ hazard }: { hazard: HazardState }) {
  if (hazard.kind === "orb") {
    return (
      <div
        className="absolute"
        style={{
          width: `${hazard.w}px`,
          height: `${hazard.h}px`,
          transform: "translate(-50%, 0)",
        }}
      >
        <div className="absolute inset-[-8px] rounded-full bg-cyan-300/20 blur-md" />
        <div className="absolute inset-0 rounded-full border border-cyan-200/60 bg-[radial-gradient(circle_at_30%_30%,#f0fdfa_0%,#67e8f9_30%,#0ea5e9_72%,#1e3a8a_100%)] shadow-[0_0_20px_rgba(34,211,238,0.45)]" />
      </div>
    );
  }

  return (
    <div
      className="absolute animate-[sawSpin_1.2s_linear_infinite]"
      style={{
        width: `${hazard.w}px`,
        height: `${hazard.h}px`,
        transform: "translate(-50%, 0)",
      }}
    >
      <div className="absolute inset-[-6px] rounded-full bg-orange-500/18 blur-md" />
      <div className="absolute inset-0 rounded-full border border-white/25 bg-[conic-gradient(from_0deg,#e2e8f0_0_12deg,#64748b_12deg_24deg,#e2e8f0_24deg_36deg,#475569_36deg_48deg,#e2e8f0_48deg_60deg,#64748b_60deg_72deg,#e2e8f0_72deg_84deg,#475569_84deg_96deg,#e2e8f0_96deg_108deg,#64748b_108deg_120deg,#e2e8f0_120deg_132deg,#475569_132deg_144deg,#e2e8f0_144deg_156deg,#64748b_156deg_168deg,#e2e8f0_168deg_180deg,#475569_180deg_192deg,#e2e8f0_192deg_204deg,#64748b_204deg_216deg,#e2e8f0_216deg_228deg,#475569_228deg_240deg,#e2e8f0_240deg_252deg,#64748b_252deg_264deg,#e2e8f0_264deg_276deg,#475569_276deg_288deg,#e2e8f0_288deg_300deg,#64748b_300deg_312deg,#e2e8f0_312deg_324deg,#475569_324deg_336deg,#e2e8f0_336deg_348deg,#64748b_348deg_360deg)] shadow-[0_0_20px_rgba(248,113,113,0.28)]" />
      <div className="absolute inset-[28%] rounded-full bg-slate-900/85 ring-2 ring-white/10" />
    </div>
  );
}

function GoalGate() {
  return (
    <div className="absolute flex -translate-x-1/2 items-end">
      <div className="relative h-[108px] w-[14px] rounded-full bg-[linear-gradient(180deg,#f8fafc_0%,#94a3b8_100%)] shadow-[0_0_12px_rgba(255,255,255,0.28)]">
        <div className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-yellow-300 shadow-[0_0_14px_rgba(253,224,71,0.7)]" />
      </div>
      <div className="relative ml-2 mb-8 h-[40px] w-[26px] overflow-hidden rounded-r-[10px] border border-white/18 bg-[linear-gradient(180deg,#67e8f9_0%,#2563eb_100%)] shadow-[0_10px_25px_rgba(37,99,235,0.28)]">
        <div className="absolute inset-y-0 left-0 w-[8px] bg-white/12" />
        <div className="absolute inset-[5px] rounded-[8px] border border-white/20 bg-white/10" />
      </div>
    </div>
  );
}

export default function BlockRunnerGame({
  roomCode,
  playerId,
  playerName,
  onReturnToLobby,
}: GameProps) {
  const router = useRouter();
  const { sendAction } = useGame(roomCode, "block-runner", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as BlockRunnerState | null;

  const [joystick, setJoystick] = useState({ x: 0, y: 0, active: false });
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const joystickPointerIdRef = useRef<number | null>(null);
  const moveXRef = useRef(0);
  const moveLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const players = Array.isArray(state?.players) ? state.players : [];
  const palette = Array.isArray(state?.palette) ? state.palette : Object.keys(COLOR_INFO);
  const spectators = Array.isArray(state?.spectators) ? state.spectators : [];
  const level = state?.level
    ? {
        ...state.level,
        traps: Array.isArray(state.level.traps) ? state.level.traps : [],
        gaps: Array.isArray(state.level.gaps) ? state.level.gaps : [],
        enemies: Array.isArray(state.level.enemies) ? state.level.enemies : [],
        hazards: Array.isArray(state.level.hazards) ? state.level.hazards : [],
      }
    : null;
  const myPlayer = useMemo(
    () => players.find((player) => player.id === state?.myPlayerId) ?? null,
    [players, state?.myPlayerId]
  );
  const isActivePlayer = !!myPlayer;

  const cameraX = useMemo(() => {
    if (!level || !myPlayer) return 0;
    return clamp(myPlayer.x - VIEW_W * 0.32, 0, Math.max(0, level.goalX - VIEW_W + 120));
  }, [level, myPlayer]);

  const progress = useMemo(() => {
    if (!level || !myPlayer) return 0;
    return clamp(Math.round((myPlayer.x / level.goalX) * 100), 0, 100);
  }, [level, myPlayer]);

  const groundSegments = useMemo(
    () => (level ? buildGroundSegments(level.goalX, level.gaps) : []),
    [level]
  );

  const sendMove = useCallback(
    (moveX: number) => sendAction({ action: "input", moveX }),
    [sendAction]
  );

  const stopMove = useCallback(() => {
    moveXRef.current = 0;
    sendMove(0);
    setJoystick((prev) => ({ ...prev, x: 0, y: 0, active: false }));
  }, [sendMove]);

  const onJoystickPointer = useCallback((clientX: number, clientY: number) => {
    const base = joystickRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > JOY_RADIUS) {
      const scale = JOY_RADIUS / distance;
      dx *= scale;
      dy *= scale;
    }

    moveXRef.current = clamp(dx / JOY_RADIUS, -1, 1);
    setJoystick({ x: dx, y: dy, active: true });
  }, []);

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
    const updateOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(window.innerWidth < 960 && portrait);
    };

    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);

    try {
      const orientationApi = screen.orientation as {
        lock?: (orientation: "landscape") => Promise<void>;
      };
      const lockPromise = orientationApi.lock?.("landscape");
      if (lockPromise) {
        void lockPromise.catch(() => {});
      }
    } catch {}

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  useEffect(() => {
    const onGlobalMove = (event: PointerEvent) => {
      if (
        joystickPointerIdRef.current === null ||
        event.pointerId !== joystickPointerIdRef.current
      ) {
        return;
      }
      onJoystickPointer(event.clientX, event.clientY);
    };

    const onGlobalUp = (event: PointerEvent) => {
      if (
        joystickPointerIdRef.current === null ||
        event.pointerId !== joystickPointerIdRef.current
      ) {
        return;
      }
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
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[radial-gradient(circle_at_50%_20%,#18244e_0%,#081022_62%,#020617_100%)]">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/55 px-6 py-5 text-center backdrop-blur">
          <div className="mx-auto mb-3 h-12 w-12 animate-pulse rounded-[16px] border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.14)]" />
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/50">
            Block Runner
          </p>
          <p className="mt-2 text-base font-semibold text-white/88">Chargement du niveau...</p>
        </div>
      </div>
    );
  }

  const isFailed = state.phase === "failed";
  const isPlaying = state.phase === "playing";

  return (
    <div className="fixed inset-0 z-[140] flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#1a2c67_0%,#0c1637_38%,#040b1d_100%)] text-white select-none">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[48%] bg-[radial-gradient(circle_at_50%_10%,rgba(34,211,238,0.18),rgba(34,211,238,0)_55%)]" />
        <div className="absolute -left-[15%] top-[12%] h-[220px] w-[220px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -right-[12%] bottom-[10%] h-[240px] w-[240px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 px-3 pb-2 pt-3 md:px-5">
        <div className="flex items-start justify-between gap-3 rounded-[24px] border border-white/10 bg-slate-950/45 px-3 py-3 backdrop-blur-md md:px-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/72">
                Block Runner
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Niveau {state.levelIndex + 1}/{state.levelCount}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Essai {state.attempt}
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-white/92 md:text-xl">
              Course precise, pieges vicieux, zero marge.
            </p>
            <p className="mt-1 text-xs text-white/48 md:text-sm">
              Evite les trous, saute au bon timing et garde toute l&apos;equipe en vie.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => sendAction({ action: "restart-level" })}
              className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-40"
              disabled={!isPlaying && !isFailed}
            >
              Rejouer
            </button>
            <button
              onClick={() =>
                onReturnToLobby ? onReturnToLobby() : router.push(`/room/${roomCode}`)
              }
              className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold text-cyan-100/85 transition hover:border-cyan-200/30 hover:bg-cyan-300/16"
            >
              Quitter
            </button>
          </div>
        </div>
      </div>

      {state.phase === "waiting" ? (
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 pb-4 md:px-5">
          <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-4 backdrop-blur-md md:p-6">
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/52">
                  Parametres
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white/92">
                  Prepare une run propre.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/52">
                  Les boutons marchent deja bien. Ici, tu regles l&apos;equipe et tu pars
                  sur quatre niveaux plus agressifs: trous, scies et pieges mobiles.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/36">
                    Joueurs actifs
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((count) => (
                      <button
                        key={count}
                        onClick={() => sendAction({ action: "set-player-count", count })}
                        className={cn(
                          "h-11 w-11 rounded-2xl border text-sm font-semibold transition",
                          state.playerCount === count
                            ? "border-cyan-200/55 bg-cyan-300/20 text-white shadow-[0_0_20px_rgba(34,211,238,0.24)]"
                            : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06]"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/36">
                    Couleur
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {palette.map((color) => {
                      const mine = myPlayer?.color === color;
                      const colorInfo = COLOR_INFO[color];
                      return (
                        <button
                          key={color}
                          onClick={() => sendAction({ action: "set-color", color })}
                          className={cn(
                            "h-11 w-11 rounded-2xl border-2 transition",
                            mine
                              ? "scale-110 border-white"
                              : "border-white/18 hover:border-white/36"
                          )}
                          style={{
                            background: `linear-gradient(180deg, ${color} 0%, ${colorInfo?.shadow ?? color} 100%)`,
                            boxShadow: mine
                              ? `0 0 22px ${colorInfo?.glow ?? "rgba(255,255,255,0.18)"}`
                              : undefined,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(14,116,144,0.05))] px-4 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100/48">
                    Equipe
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/88">
                    {players.length}/{state.playerCount} joueurs en piste
                  </p>
                  {spectators.length > 0 ? (
                    <p className="mt-1 text-xs text-white/42">
                      Spectateurs: {spectators.map((spectator) => spectator.name).join(", ")}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={() => sendAction({ action: "start-game" })}
                  className="rounded-full bg-[linear-gradient(180deg,#67e8f9_0%,#22d3ee_45%,#0ea5e9_100%)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_28px_rgba(34,211,238,0.24)] transition hover:shadow-[0_18px_36px_rgba(34,211,238,0.3)] active:scale-[0.98]"
                >
                  Lancer la run
                </button>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-4 backdrop-blur-md md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/52">
                Apercu du danger
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  "Trous sans pitie qui cassent le rythme.",
                  "Orbes et scies mobiles a timer proprement.",
                  "Monstres de patrouille a ecraser ou eviter.",
                ].map((line) => (
                  <div
                    key={line}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/62"
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div className="relative mt-5 h-44 overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,#172554_0%,#0f172a_100%)]">
                <div className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.22),rgba(34,211,238,0)_65%)]" />
                <div className="absolute left-6 bottom-[58px] h-6 w-6 rounded-[8px] bg-[linear-gradient(180deg,#22c55e_0%,#166534_100%)] shadow-[0_0_18px_rgba(34,197,94,0.28)]" />
                <div className="absolute left-[84px] right-[108px] bottom-0 h-[54px] rounded-t-[16px] bg-[linear-gradient(180deg,#3f2a1c_0%,#1c1917_100%)]">
                  <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(180deg,#4ade80_0%,#16a34a_100%)]" />
                </div>
                <div className="absolute bottom-0 left-[146px] h-[92px] w-[72px] rounded-t-[16px] bg-[linear-gradient(180deg,rgba(2,6,23,0.1),rgba(2,6,23,1))]" />
                <div className="absolute left-[246px] bottom-[54px] h-[18px] w-[52px]">
                  <TrapSpikes width={52} />
                </div>
                <div className="absolute left-[314px] bottom-[92px] h-7 w-7 rounded-full border border-white/20 bg-[conic-gradient(from_0deg,#e2e8f0_0_25%,#475569_25%_50%,#cbd5e1_50%_75%,#64748b_75%_100%)] animate-[sawSpin_1.1s_linear_infinite]" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative z-10 px-3 md:px-5">
            <div className="rounded-[22px] border border-white/10 bg-slate-950/38 px-3 py-2.5 backdrop-blur-md md:px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px]",
                        player.alive
                          ? "border-white/10 bg-white/[0.04] text-white/72"
                          : "border-red-400/16 bg-red-400/8 text-red-100/60"
                      )}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: player.alive ? player.color : "#475569",
                          boxShadow: player.alive
                            ? `0 0 12px ${COLOR_INFO[player.color]?.glow ?? "rgba(255,255,255,0.15)"}`
                            : undefined,
                        }}
                      />
                      <span className="max-w-[82px] truncate">{player.name}</span>
                    </div>
                  ))}
                </div>
                <div className="shrink-0 rounded-full border border-cyan-300/16 bg-cyan-400/8 px-3 py-1.5 text-[11px] font-semibold text-cyan-100/80">
                  {isActivePlayer ? `${progress}%` : "Spectateur"}
                </div>
              </div>
              {isPlaying && isActivePlayer ? (
                <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#67e8f9_0%,#34d399_100%)] shadow-[0_0_16px_rgba(52,211,153,0.35)] transition-[width] duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 px-2 pb-2 pt-2 md:px-5 md:pb-4">
            <div
              className={cn(
                "relative min-h-0 flex-1 overflow-hidden rounded-[28px] border",
                isFailed ? "border-red-400/25" : "border-white/10"
              )}
              style={{
                background:
                  "linear-gradient(180deg, rgba(14,29,76,0.98) 0%, rgba(10,19,48,0.98) 50%, rgba(4,11,29,1) 100%)",
                boxShadow: isFailed
                  ? "inset 0 0 50px rgba(239,68,68,0.12)"
                  : "inset 0 0 80px rgba(0,0,0,0.28)",
              }}
            >
              <div className="pointer-events-none absolute inset-0">
                {Array.from({ length: 18 }).map((_, index) => (
                  <span
                    key={index}
                    className="absolute block rounded-full bg-white/70"
                    style={{
                      left: `${(index * 37) % 100}%`,
                      top: `${(index * 19) % 42}%`,
                      width: `${index % 4 === 0 ? 3 : 2}px`,
                      height: `${index % 4 === 0 ? 3 : 2}px`,
                      opacity: 0.14 + (index % 4) * 0.07,
                      animation: `twinkle ${2.6 + (index % 3) * 0.8}s ease-in-out ${index * 0.18}s infinite`,
                    }}
                  />
                ))}
                <div className="absolute inset-x-0 bottom-[148px] h-[120px] bg-[linear-gradient(180deg,rgba(14,165,233,0)_0%,rgba(34,211,238,0.08)_100%)]" />
                <div className="absolute inset-x-0 bottom-[74px] h-[88px] bg-[linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(8,47,73,0.18)_100%)] [clip-path:polygon(0%_100%,6%_62%,11%_78%,18%_45%,26%_70%,35%_35%,46%_72%,58%_30%,69%_65%,80%_38%,89%_76%,100%_100%)]" />
              </div>

              {groundSegments.map((segment, index) => {
                const left = worldPercent(segment.x, cameraX);
                const width = (segment.w / VIEW_W) * 100;
                if (left + width < -20 || left > 120) return null;

                return (
                  <div
                    key={`ground-${index}`}
                    className="absolute bottom-0 overflow-hidden rounded-t-[22px]"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      height: `${GROUND_H}px`,
                    }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,#4a2f1d_0%,#24160f_58%,#140c08_100%)]" />
                    <div className="absolute inset-x-0 top-0 h-[8px] bg-[linear-gradient(180deg,#4ade80_0%,#15803d_100%)] shadow-[0_0_14px_rgba(34,197,94,0.3)]" />
                    <div className="absolute inset-x-0 top-[8px] h-[10px] bg-[linear-gradient(180deg,rgba(74,222,128,0.18)_0%,rgba(74,222,128,0)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 h-[28px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.18)_100%)]" />
                  </div>
                );
              })}

              {level.gaps.map((gap, index) => {
                const left = worldPercent(gap.x, cameraX);
                const width = (gap.w / VIEW_W) * 100;
                if (left + width < -20 || left > 120) return null;

                return (
                  <div
                    key={`gap-${index}`}
                    className="absolute bottom-0"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      height: `${GROUND_H + 88}px`,
                    }}
                  >
                    <GapPit />
                  </div>
                );
              })}

              {level.traps.map((trap, index) => {
                const left = worldPercent(trap.x, cameraX);
                const width = (trap.w / VIEW_W) * 100;
                if (left + width < -20 || left > 120) return null;

                return (
                  <div
                    key={`trap-${index}`}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      bottom: `${GROUND_H - 2}px`,
                      height: "18px",
                    }}
                  >
                    <TrapSpikes width={Math.max(28, Math.floor(trap.w))} />
                  </div>
                );
              })}

              {level.hazards.map((hazard, index) => {
                const left = worldPercent(hazard.x, cameraX);
                if (left < -20 || left > 120) return null;

                return (
                  <div
                    key={`hazard-${index}`}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      bottom: `${GROUND_H + hazard.y}px`,
                    }}
                  >
                    <MovingHazard hazard={hazard} />
                  </div>
                );
              })}

              {level.enemies
                .filter((enemy) => enemy.alive)
                .map((enemy, index) => {
                  const left = worldPercent(enemy.x, cameraX);
                  if (left < -20 || left > 120) return null;

                  return (
                    <div
                      key={`enemy-${index}`}
                      className="absolute"
                      style={{
                        left: `${left}%`,
                        bottom: `${GROUND_H + enemy.y}px`,
                      }}
                    >
                      <EnemyCrawler enemy={enemy} />
                    </div>
                  );
                })}

              <div
                className="absolute"
                style={{
                  left: `${worldPercent(level.goalX, cameraX)}%`,
                  bottom: `${GROUND_H}px`,
                }}
              >
                <GoalGate />
              </div>

              {players.map((player) => {
                const left = worldPercent(player.x, cameraX);
                if (left < -20 || left > 120) return null;

                return (
                  <div
                    key={player.id}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      bottom: `${GROUND_H + player.y}px`,
                    }}
                  >
                    <PlayerCharacter player={player} isMe={player.id === state.myPlayerId} />
                  </div>
                );
              })}

              {isFailed ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.18),rgba(2,6,23,0.72))] px-4">
                  <div className="max-w-md rounded-[28px] border border-red-300/14 bg-slate-950/72 px-6 py-5 text-center shadow-[0_18px_40px_rgba(2,6,23,0.42)] backdrop-blur-md">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-red-200/58">
                      Impact
                    </p>
                    <p className="mt-3 text-xl font-semibold text-white/92">
                      {state.failMessage ?? "La run s'arrete ici."}
                    </p>
                    <p className="mt-2 text-sm text-white/46">
                      Le niveau repart tout seul. Recale juste ton timing.
                    </p>
                  </div>
                </div>
              ) : null}

              {state.phase === "finished" ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.2),rgba(2,6,23,0.78))] px-4">
                  <div className="max-w-md rounded-[28px] border border-cyan-300/16 bg-slate-950/72 px-6 py-5 text-center shadow-[0_20px_44px_rgba(2,6,23,0.48)] backdrop-blur-md">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-100/58">
                      Run complete
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-white/94">
                      Tous les niveaux sont valides.
                    </p>
                    <p className="mt-2 text-sm text-white/48">
                      Les trous, les scies et les monstres sont derriere toi.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative z-10 px-2 pb-2 md:px-5 md:pb-4">
            <div className="grid grid-cols-[1fr_auto] gap-2 md:grid-cols-[1fr_auto_auto]">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/42 px-3 py-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/34">
                      Controle
                    </p>
                    <p className="mt-1 text-sm text-white/66">
                      Stick gauche pour la course, bouton droit pour le saut.
                    </p>
                  </div>
                  <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/52 md:block">
                    {isActivePlayer ? "Timing propre" : "Mode spectateur"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/42 p-2 backdrop-blur-md">
                <div
                  ref={joystickRef}
                  className={cn(
                    "relative h-24 w-24 touch-none rounded-full border",
                    isActivePlayer ? "border-cyan-200/24" : "border-white/10 opacity-35"
                  )}
                  style={{
                    background:
                      "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.22) 100%)",
                    boxShadow: "inset 0 0 18px rgba(2,6,23,0.4)",
                  }}
                  onPointerDown={(event) => {
                    if (!isActivePlayer || state.phase !== "playing") return;
                    joystickPointerIdRef.current = event.pointerId;
                    try {
                      event.currentTarget.setPointerCapture(event.pointerId);
                    } catch {}
                    onJoystickPointer(event.clientX, event.clientY);
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
                  <div className="absolute left-1/2 top-[10px] -translate-x-1/2 text-[10px] text-white/18">
                    ^
                  </div>
                  <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 text-[10px] text-white/18">
                    v
                  </div>
                  <div className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[10px] text-white/18">
                    {"<"}
                  </div>
                  <div className="absolute right-[11px] top-1/2 -translate-y-1/2 text-[10px] text-white/18">
                    {">"}
                  </div>
                  <div
                    className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
                    style={{
                      transform: `translate(calc(-50% + ${joystick.x}px), calc(-50% + ${joystick.y}px))`,
                      background: joystick.active
                        ? "radial-gradient(circle at 35% 30%, #f0fdfa 0%, #67e8f9 30%, #0ea5e9 100%)"
                        : "radial-gradient(circle at 35% 30%, rgba(240,253,250,0.65), rgba(103,232,249,0.4) 35%, rgba(14,165,233,0.55) 100%)",
                      boxShadow: joystick.active
                        ? "0 0 24px rgba(34,211,238,0.42)"
                        : "0 0 14px rgba(34,211,238,0.18)",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/42 p-2 backdrop-blur-md">
                <button
                  onPointerDown={(event) => {
                    event.preventDefault();
                    if (!isActivePlayer || state.phase !== "playing") return;
                    sendAction({ action: "jump" });
                  }}
                  className={cn(
                    "h-24 w-24 rounded-full border text-center transition active:scale-95",
                    isActivePlayer
                      ? "border-amber-200/28 text-white"
                      : "border-white/10 text-white/25 opacity-35"
                  )}
                  style={{
                    background: isActivePlayer
                      ? "radial-gradient(circle at 35% 30%, rgba(254,240,138,0.95), rgba(251,191,36,0.7) 35%, rgba(217,119,6,0.85) 100%)"
                      : "rgba(255,255,255,0.03)",
                    boxShadow: isActivePlayer
                      ? "0 0 28px rgba(251,191,36,0.2), inset 0 -10px 18px rgba(146,64,14,0.22)"
                      : undefined,
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-950">JUMP</span>
                    <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-950/72">
                      Saut
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {error ? (
        <div className="relative z-10 px-3 pb-3 md:px-5">
          <p className="rounded-[18px] border border-red-300/18 bg-red-500/10 px-3 py-2 text-xs text-red-100/82 backdrop-blur">
            {error}
          </p>
        </div>
      ) : null}

      {isPortraitMobile ? (
        <div className="absolute inset-0 z-[180] flex items-center justify-center bg-slate-950/92 p-6 text-center backdrop-blur-sm">
          <div className="max-w-sm rounded-[30px] border border-white/10 bg-slate-950/72 px-6 py-7 shadow-[0_24px_40px_rgba(2,6,23,0.48)]">
            <div className="mx-auto mb-4 h-14 w-14 rounded-[18px] border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.14)]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-100/58">
              Orientation
            </p>
            <p className="mt-3 text-xl font-semibold text-white/92">
              Passe en paysage pour jouer proprement.
            </p>
            <p className="mt-2 text-sm leading-6 text-white/48">
              Le niveau est pense pour une vraie vue large. Les controles restent en bas.
            </p>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.16; transform: scale(1); }
          50% { opacity: 0.52; transform: scale(1.15); }
        }

        @keyframes sawSpin {
          from { transform: translate(-50%, 0) rotate(0deg); }
          to { transform: translate(-50%, 0) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
