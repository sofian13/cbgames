"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────
type Phase =
  | "role-reveal"
  | "night-wolves"
  | "night-seer"
  | "night-witch"
  | "day-announcement"
  | "day-discussion"
  | "day-vote"
  | "day-result"
  | "hunter-shot"
  | "game-over";

type Role =
  | "villageois"
  | "loup-garou"
  | "voyante"
  | "sorciere"
  | "chasseur"
  | "cupidon";

interface PlayerInfo {
  id: string;
  name: string;
  alive: boolean;
  isMe?: boolean;
  role?: Role;
  roleLabel?: string;
}

interface Target {
  id: string;
  name: string;
}

interface DeathInfo {
  id: string;
  name: string;
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

interface SeerResult {
  targetId: string;
  targetName: string;
  role: Role;
  roleLabel: string;
}

interface LoupGarouState {
  phase: Phase;
  dayCount: number;
  timeLeft: number;
  myId: string;
  myRole: Role | null;
  myAlive: boolean;
  players: PlayerInfo[];
  chatMessages: ChatMessage[];
  isSpectator?: boolean;
  wolfPlayers?: Target[];
  wolfVotes?: Record<string, string>;
  targets?: Target[];
  seerResult?: SeerResult;
  attackedPlayer?: Target | null;
  canHeal?: boolean;
  canKill?: boolean;
  hasHealed?: boolean;
  killTarget?: string | null;
  nightDeaths?: DeathInfo[];
  voteCounts?: Record<string, number>;
  voterIds?: string[];
  hasVoted?: boolean;
  eliminatedToday?: string | null;
  eliminatedName?: string | null;
  eliminatedRole?: Role | null;
  isHunter?: boolean;
  allRoles?: Array<{
    id: string;
    name: string;
    role: Role;
    roleLabel: string;
    alive: boolean;
  }>;
  winner?: "village" | "loups";
  winnerLabel?: string;
}

// ── Role visuals ─────────────────────────────────────────
const ROLE_CONFIG: Record<
  Role,
  {
    label: string;
    icon: string;
    color: string;
    glowColor: string;
    gradientFrom: string;
    gradientTo: string;
    description: string;
  }
> = {
  villageois: {
    label: "Villageois",
    icon: "\u{1F3D8}\u{FE0F}",
    color: "text-sky-300",
    glowColor: "rgba(56,189,248,0.25)",
    gradientFrom: "#38bdf8",
    gradientTo: "#0ea5e9",
    description: "Vote le jour pour eliminer les loups.",
  },
  "loup-garou": {
    label: "Loup-Garou",
    icon: "\u{1F43A}",
    color: "text-red-400",
    glowColor: "rgba(248,113,113,0.3)",
    gradientFrom: "#f87171",
    gradientTo: "#dc2626",
    description: "Devore un villageois chaque nuit.",
  },
  voyante: {
    label: "Voyante",
    icon: "\u{1F441}\u{FE0F}",
    color: "text-violet-400",
    glowColor: "rgba(167,139,250,0.3)",
    gradientFrom: "#a78bfa",
    gradientTo: "#7c3aed",
    description: "Decouvre le role d\u2019un joueur chaque nuit.",
  },
  sorciere: {
    label: "Sorciere",
    icon: "\u{1F9D9}",
    color: "text-emerald-400",
    glowColor: "rgba(52,211,153,0.25)",
    gradientFrom: "#34d399",
    gradientTo: "#059669",
    description: "Possede une potion de soin et une de mort.",
  },
  chasseur: {
    label: "Chasseur",
    icon: "\u{1F3AF}",
    color: "text-amber-400",
    glowColor: "rgba(251,191,36,0.25)",
    gradientFrom: "#fbbf24",
    gradientTo: "#d97706",
    description: "Emporte un joueur dans sa mort.",
  },
  cupidon: {
    label: "Cupidon",
    icon: "\u{1F498}",
    color: "text-pink-400",
    glowColor: "rgba(244,114,182,0.3)",
    gradientFrom: "#f472b6",
    gradientTo: "#db2777",
    description: "Lie deux amoureux la premiere nuit.",
  },
};

function isNightPhase(phase: Phase): boolean {
  return (
    phase === "night-wolves" ||
    phase === "night-seer" ||
    phase === "night-witch"
  );
}

// ══════════════════════════════════════════════════════════
export default function LoupGarouGame({
  roomCode,
  playerId,
  playerName,
}: GameProps) {
  const { sendAction } = useGame(roomCode, "loup-garou", playerId, playerName);
  const { gameState, error } = useGameStore();
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef<string>("");

  const state = gameState as unknown as LoupGarouState;

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state?.chatMessages?.length]);

  // Reset chat input on phase change
  useEffect(() => {
    if (state?.phase && state.phase !== prevPhaseRef.current) {
      prevPhaseRef.current = state.phase;
      setChatInput("");
    }
  }, [state?.phase]);

  // ── Action handlers ────────────────────────────────────
  const handleWolfVote = useCallback(
    (targetId: string) => sendAction({ action: "wolf-vote", targetId }),
    [sendAction]
  );

  const handleSeerInspect = useCallback(
    (targetId: string) => sendAction({ action: "seer-inspect", targetId }),
    [sendAction]
  );

  const handleWitchHeal = useCallback(
    () => sendAction({ action: "witch-heal" }),
    [sendAction]
  );

  const handleWitchKill = useCallback(
    (targetId: string) => sendAction({ action: "witch-kill", targetId }),
    [sendAction]
  );

  const handleWitchSkip = useCallback(
    () => sendAction({ action: "witch-skip" }),
    [sendAction]
  );

  const handleHunterShot = useCallback(
    (targetId: string) => sendAction({ action: "hunter-shot", targetId }),
    [sendAction]
  );

  const handleDayVote = useCallback(
    (targetId: string) => sendAction({ action: "day-vote", targetId }),
    [sendAction]
  );

  const handleChat = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) return;
    sendAction({ action: "chat", message: msg });
    setChatInput("");
  }, [chatInput, sendAction]);

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChat();
      }
    },
    [handleChat]
  );

  // ── Loading / Waiting ──────────────────────────────────
  if (!state || !state.phase) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(88,28,135,0.18), transparent 55%), radial-gradient(circle at 80% 70%, rgba(30,58,138,0.12), transparent 40%), #09090b",
        }}
      >
        <div className="text-center">
          <div
            className="text-5xl mb-6 animate-pulse"
            style={{ filter: "drop-shadow(0 0 20px rgba(248,113,113,0.4))" }}
          >
            {"\u{1F43A}"}
          </div>
          <p className="text-white/40 animate-pulse font-sans text-lg">
            En attente des joueurs...
          </p>
          {error && (
            <p className="text-sm text-red-400 font-sans mt-3">{error}</p>
          )}
        </div>
      </div>
    );
  }

  const myRole = state.myRole;
  const myAlive = state.myAlive;
  const roleConfig = myRole ? ROLE_CONFIG[myRole] : null;
  const isNight = isNightPhase(state.phase);

  // ── Background helpers ─────────────────────────────────
  const nightBg =
    "radial-gradient(circle at 50% 15%, rgba(49,10,101,0.25), transparent 50%), radial-gradient(circle at 85% 80%, rgba(30,27,75,0.3), transparent 45%), radial-gradient(circle at 15% 75%, rgba(55,15,80,0.15), transparent 40%), #09090b";
  const dayBg =
    "radial-gradient(circle at 50% 20%, rgba(234,179,8,0.08), transparent 45%), radial-gradient(circle at 80% 70%, rgba(217,119,6,0.06), transparent 40%), radial-gradient(circle at 20% 80%, rgba(180,83,9,0.04), transparent 35%), #09090b";

  // ── Reusable sub-components (render functions) ─────────

  function renderDeadOverlay(children: React.ReactNode) {
    if (myAlive && !state.isSpectator) return <>{children}</>;
    return (
      <div className="relative flex flex-1 flex-col">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-5 py-2.5 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <p className="text-sm font-sans text-white/40 text-center">
            {"\u{1F47B}"} Tu es mort &mdash; Mode spectateur
          </p>
        </div>
        <div className="flex flex-1 flex-col opacity-60 saturate-[0.6]">
          {children}
        </div>
      </div>
    );
  }

  function renderPhaseHeader(
    title: string,
    subtitle?: string,
    icon?: string,
    accentColor = "text-white/90"
  ) {
    return (
      <div className="text-center mb-8">
        {icon && (
          <div
            className="text-5xl mb-4"
            style={{
              filter: isNight
                ? "drop-shadow(0 0 25px rgba(139,92,246,0.35))"
                : "drop-shadow(0 0 25px rgba(234,179,8,0.3))",
            }}
          >
            {icon}
          </div>
        )}
        <h2
          className={cn(
            "text-3xl font-serif font-semibold tracking-tight",
            accentColor
          )}
          style={{
            textShadow: isNight
              ? "0 0 40px rgba(139,92,246,0.25)"
              : "0 0 40px rgba(234,179,8,0.15)",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-white/40 font-sans mt-2 tracking-wide">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  function renderTimer(warn = 10) {
    const isWarning = state.timeLeft <= warn;
    return (
      <div className="flex items-center justify-center mb-6">
        <span
          className={cn(
            "text-lg font-mono font-bold px-5 py-1.5 rounded-full border backdrop-blur-sm",
            isWarning
              ? "text-red-400 border-red-500/40 bg-red-500/10"
              : "text-white/90 border-white/25 bg-black/30"
          )}
          style={
            isWarning
              ? { boxShadow: "0 0 20px rgba(248,113,113,0.2)" }
              : undefined
          }
        >
          {state.timeLeft}s
        </span>
      </div>
    );
  }

  function renderRoleBadge(small = false) {
    if (!roleConfig || !myRole) return null;
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border font-sans backdrop-blur-sm",
          small ? "px-2.5 py-0.5 text-[10px]" : "px-3.5 py-1.5 text-xs"
        )}
        style={{
          borderColor: `${roleConfig.gradientFrom}40`,
          background: `linear-gradient(135deg, ${roleConfig.gradientFrom}12, ${roleConfig.gradientTo}08)`,
          boxShadow: `0 0 12px ${roleConfig.glowColor}`,
        }}
      >
        <span>{roleConfig.icon}</span>
        <span className={roleConfig.color}>{roleConfig.label}</span>
      </div>
    );
  }

  function renderTargetGrid(
    targets: Target[],
    onSelect: (id: string) => void,
    accentGradientFrom = "#65dfb2",
    accentGradientTo = "#4ecf8a",
    accentGlow = "rgba(101,223,178,0.25)",
    selectedId?: string | null,
    disabled = false
  ) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
        {targets.map((t) => {
          const isSelected = selectedId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => !disabled && onSelect(t.id)}
              disabled={disabled}
              className={cn(
                "px-4 py-3.5 rounded-2xl border text-sm font-sans font-medium transition-all duration-200",
                isSelected
                  ? "text-white scale-[1.03]"
                  : "border-white/25 bg-black/30 backdrop-blur-sm text-white/70 hover:bg-white/[0.08] hover:border-white/40 hover:scale-[1.02]",
                disabled && "opacity-40 cursor-not-allowed hover:scale-100"
              )}
              style={
                isSelected
                  ? {
                      background: `linear-gradient(135deg, ${accentGradientFrom}25, ${accentGradientTo}15)`,
                      borderColor: `${accentGradientFrom}60`,
                      boxShadow: `0 0 20px ${accentGlow}`,
                    }
                  : undefined
              }
            >
              {t.name}
            </button>
          );
        })}
      </div>
    );
  }

  function renderPlayerList() {
    return (
      <div className="w-full max-w-md mx-auto mt-auto pt-6">
        <div className="flex flex-wrap justify-center gap-2">
          {state.players?.map((p: PlayerInfo) => {
            const pRole = p.role ? ROLE_CONFIG[p.role] : null;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-sans transition-all",
                  !p.alive
                    ? "border-white/[0.06] bg-white/[0.02] text-white/25"
                    : p.isMe
                      ? "border-white/25 bg-black/30 backdrop-blur-sm text-white/90"
                      : "border-white/[0.12] bg-white/[0.04] text-white/60"
                )}
                style={
                  p.isMe && p.alive && roleConfig
                    ? {
                        borderColor: `${roleConfig.gradientFrom}35`,
                        boxShadow: `0 0 10px ${roleConfig.glowColor}`,
                      }
                    : undefined
                }
              >
                {!p.alive && <span>{"\u{1F47B}"}</span>}
                <span className={!p.alive ? "line-through" : ""}>
                  {p.name}
                </span>
                {p.isMe && (
                  <span className="text-[9px] text-white/25">(toi)</span>
                )}
                {p.role && state.phase === "game-over" && pRole && (
                  <span className={cn("text-[9px]", pRole.color)}>
                    {pRole.icon}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSpectatorInfo() {
    if (!state.isSpectator || !state.allRoles) return null;
    return (
      <div className="w-full max-w-lg mx-auto mb-5 rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-4 py-3">
        <p className="text-[10px] text-white/25 font-sans uppercase tracking-widest mb-2">
          Roles (spectateur)
        </p>
        <div className="flex flex-wrap gap-2">
          {state.allRoles.map((r) => {
            const rc = ROLE_CONFIG[r.role];
            return (
              <span
                key={r.id}
                className={cn(
                  "text-[10px] font-sans px-2 py-1 rounded-full border",
                  !r.alive && "opacity-30 line-through",
                  rc?.color
                )}
                style={{
                  borderColor: `${rc?.gradientFrom}30`,
                  background: `linear-gradient(135deg, ${rc?.gradientFrom}10, ${rc?.gradientTo}06)`,
                }}
              >
                {r.name}: {rc?.icon} {r.roleLabel}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  function renderNightWait(subtitle: string) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        {renderPhaseHeader(
          "La nuit tombe...",
          subtitle,
          "\u{1F319}",
          "text-indigo-300/80"
        )}
        <p className="text-sm text-white/25 font-sans animate-pulse">
          Rendors-toi paisiblement...
        </p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ROLE REVEAL
  // ══════════════════════════════════════════════════════════
  if (state.phase === "role-reveal") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(88,28,135,0.3), transparent 50%), radial-gradient(circle at 80% 70%, rgba(30,27,75,0.25), transparent 45%), #09090b",
        }}
      >
        <div className="text-center">
          <p className="text-xs text-white/25 font-sans uppercase tracking-[0.25em] mb-8">
            Ton role secret
          </p>
          {roleConfig && (
            <div
              className="rounded-3xl border p-10 max-w-xs mx-auto backdrop-blur-sm"
              style={{
                borderColor: `${roleConfig.gradientFrom}30`,
                background: `linear-gradient(160deg, ${roleConfig.gradientFrom}10, ${roleConfig.gradientTo}05, transparent)`,
                boxShadow: `0 0 60px ${roleConfig.glowColor}, inset 0 1px 0 ${roleConfig.gradientFrom}15`,
              }}
            >
              <div
                className="text-7xl mb-5"
                style={{
                  filter: `drop-shadow(0 0 30px ${roleConfig.glowColor})`,
                }}
              >
                {roleConfig.icon}
              </div>
              <h2
                className={cn(
                  "text-4xl font-serif font-semibold mb-3",
                  roleConfig.color
                )}
                style={{
                  textShadow: `0 0 30px ${roleConfig.glowColor}`,
                }}
              >
                {roleConfig.label}
              </h2>
              <p className="text-sm text-white/40 font-sans leading-relaxed">
                {roleConfig.description}
              </p>
            </div>
          )}
          <p className="text-xs text-white/25 font-sans mt-8 animate-pulse tracking-wide">
            Memorise ton role, la nuit va tomber...
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // NIGHT - WOLVES
  // ══════════════════════════════════════════════════════════
  if (state.phase === "night-wolves") {
    const isWolf = myRole === "loup-garou" && myAlive;
    const myVote = state.wolfVotes?.[playerId] ?? null;

    return renderDeadOverlay(
      <div
        className="flex flex-1 flex-col items-center p-6"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(127,29,29,0.18), transparent 45%), " +
            nightBg,
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-white/25 font-sans tracking-wide">
            Nuit {state.dayCount}
          </span>
          {renderRoleBadge(true)}
        </div>
        {renderTimer()}

        {isWolf ? (
          <>
            {renderPhaseHeader(
              "Les Loups se reveillent",
              "Choisissez une victime",
              "\u{1F43A}",
              "text-red-400"
            )}

            {state.wolfPlayers && state.wolfPlayers.length > 1 && (
              <div
                className="mb-5 px-4 py-2 rounded-2xl border backdrop-blur-sm"
                style={{
                  borderColor: "rgba(248,113,113,0.2)",
                  background:
                    "linear-gradient(135deg, rgba(248,113,113,0.08), rgba(220,38,38,0.04))",
                }}
              >
                <p className="text-[11px] text-red-400/60 font-sans">
                  Meute : {state.wolfPlayers.map((w) => w.name).join(", ")}
                </p>
              </div>
            )}

            {state.wolfVotes &&
              Object.keys(state.wolfVotes).length > 0 && (
                <div className="mb-5 space-y-1.5">
                  {Object.entries(state.wolfVotes).map(
                    ([wolfId, targetId]) => {
                      const wolf = state.wolfPlayers?.find(
                        (w) => w.id === wolfId
                      );
                      const target = state.targets?.find(
                        (t) => t.id === targetId
                      );
                      return (
                        <p
                          key={wolfId}
                          className="text-xs text-red-400/50 font-sans"
                        >
                          {wolf?.name ?? "?"} {"\u2192"}{" "}
                          {target?.name ?? "?"}
                        </p>
                      );
                    }
                  )}
                </div>
              )}

            {state.targets &&
              renderTargetGrid(
                state.targets,
                handleWolfVote,
                "#f87171",
                "#dc2626",
                "rgba(248,113,113,0.25)",
                myVote
              )}
          </>
        ) : (
          renderNightWait("Les Loups-Garous se reveillent")
        )}

        {renderPlayerList()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // NIGHT - SEER
  // ══════════════════════════════════════════════════════════
  if (state.phase === "night-seer") {
    const isSeer = myRole === "voyante" && myAlive;

    return renderDeadOverlay(
      <div
        className="flex flex-1 flex-col items-center p-6"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(109,40,217,0.18), transparent 45%), " +
            nightBg,
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-white/25 font-sans tracking-wide">
            Nuit {state.dayCount}
          </span>
          {renderRoleBadge(true)}
        </div>
        {renderTimer()}

        {isSeer ? (
          <>
            {renderPhaseHeader(
              "La Voyante se reveille",
              "Choisis un joueur a inspecter",
              "\u{1F441}\u{FE0F}",
              "text-violet-400"
            )}

            {state.seerResult ? (
              <div
                className="rounded-3xl border p-8 max-w-xs text-center backdrop-blur-sm"
                style={{
                  borderColor: `${ROLE_CONFIG[state.seerResult.role]?.gradientFrom}30`,
                  background: `linear-gradient(160deg, ${ROLE_CONFIG[state.seerResult.role]?.gradientFrom}12, ${ROLE_CONFIG[state.seerResult.role]?.gradientTo}06, transparent)`,
                  boxShadow: `0 0 40px ${ROLE_CONFIG[state.seerResult.role]?.glowColor}`,
                }}
              >
                <p className="text-sm text-white/40 font-sans mb-3">
                  {state.seerResult.targetName} est...
                </p>
                <div
                  className="text-4xl mb-3"
                  style={{
                    filter: `drop-shadow(0 0 20px ${ROLE_CONFIG[state.seerResult.role]?.glowColor})`,
                  }}
                >
                  {ROLE_CONFIG[state.seerResult.role]?.icon}
                </div>
                <p
                  className={cn(
                    "text-2xl font-serif font-semibold",
                    ROLE_CONFIG[state.seerResult.role]?.color
                  )}
                  style={{
                    textShadow: `0 0 20px ${ROLE_CONFIG[state.seerResult.role]?.glowColor}`,
                  }}
                >
                  {state.seerResult.roleLabel}
                </p>
              </div>
            ) : (
              state.targets &&
              renderTargetGrid(
                state.targets,
                handleSeerInspect,
                "#a78bfa",
                "#7c3aed",
                "rgba(167,139,250,0.25)"
              )
            )}
          </>
        ) : (
          renderNightWait("La Voyante ouvre les yeux")
        )}

        {renderPlayerList()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // NIGHT - WITCH
  // ══════════════════════════════════════════════════════════
  if (state.phase === "night-witch") {
    const isWitch = myRole === "sorciere" && myAlive;

    return renderDeadOverlay(
      <div
        className="flex flex-1 flex-col items-center p-6"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(6,95,70,0.18), transparent 45%), " +
            nightBg,
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-white/25 font-sans tracking-wide">
            Nuit {state.dayCount}
          </span>
          {renderRoleBadge(true)}
        </div>
        {renderTimer()}

        {isWitch ? (
          <>
            {renderPhaseHeader(
              "La Sorciere se reveille",
              "Utilise tes potions avec sagesse",
              "\u{1F9D9}",
              "text-emerald-400"
            )}

            {state.attackedPlayer && (
              <div
                className="mb-5 px-5 py-4 rounded-2xl border max-w-sm text-center backdrop-blur-sm"
                style={{
                  borderColor: "rgba(248,113,113,0.2)",
                  background:
                    "linear-gradient(135deg, rgba(248,113,113,0.08), rgba(220,38,38,0.03))",
                  boxShadow: "0 0 20px rgba(248,113,113,0.1)",
                }}
              >
                <p className="text-xs text-red-400/60 font-sans mb-2">
                  Cette nuit, les loups ont attaque :
                </p>
                <p
                  className="text-xl font-serif font-semibold text-red-400"
                  style={{ textShadow: "0 0 20px rgba(248,113,113,0.3)" }}
                >
                  {state.attackedPlayer.name}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full max-w-sm">
              {state.canHeal &&
                state.attackedPlayer &&
                !state.hasHealed && (
                  <button
                    onClick={handleWitchHeal}
                    className="w-full px-5 py-3.5 rounded-2xl border text-sm font-sans font-medium transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      borderColor: "rgba(52,211,153,0.3)",
                      background:
                        "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(5,150,105,0.06))",
                      color: "#34d399",
                      boxShadow: "0 0 15px rgba(52,211,153,0.15)",
                    }}
                  >
                    {"\u{1F48A}"} Potion de soin &mdash; Sauver{" "}
                    {state.attackedPlayer.name}
                  </button>
                )}

              {state.hasHealed && (
                <div
                  className="w-full px-5 py-3.5 rounded-2xl border text-center backdrop-blur-sm"
                  style={{
                    borderColor: "rgba(52,211,153,0.3)",
                    background:
                      "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(5,150,105,0.05))",
                    boxShadow: "0 0 15px rgba(52,211,153,0.15)",
                  }}
                >
                  <p className="text-sm text-emerald-400 font-sans font-medium">
                    {"\u{2705}"} Potion de soin utilisee !
                  </p>
                </div>
              )}

              {state.canKill && !state.killTarget && (
                <div className="mt-3">
                  <p className="text-xs text-white/25 font-sans text-center mb-3 tracking-wide">
                    {"\u{1F480}"} Potion de mort
                  </p>
                  {state.targets &&
                    renderTargetGrid(
                      state.targets,
                      handleWitchKill,
                      "#f87171",
                      "#dc2626",
                      "rgba(248,113,113,0.25)"
                    )}
                </div>
              )}

              {state.killTarget && (
                <div
                  className="w-full px-5 py-3.5 rounded-2xl border text-center backdrop-blur-sm"
                  style={{
                    borderColor: "rgba(248,113,113,0.2)",
                    background:
                      "linear-gradient(135deg, rgba(248,113,113,0.08), rgba(220,38,38,0.04))",
                    boxShadow: "0 0 15px rgba(248,113,113,0.1)",
                  }}
                >
                  <p className="text-sm text-red-400 font-sans font-medium">
                    {"\u{1F480}"} Potion de mort utilisee !
                  </p>
                </div>
              )}

              <button
                onClick={handleWitchSkip}
                className="w-full px-4 py-2.5 rounded-2xl border border-white/25 bg-black/30 backdrop-blur-sm text-white/40 font-sans text-xs hover:bg-white/[0.06] hover:border-white/40 transition-all duration-200 mt-2"
              >
                Ne rien faire
              </button>
            </div>
          </>
        ) : (
          renderNightWait("La Sorciere prepare ses potions")
        )}

        {renderPlayerList()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // DAY - ANNOUNCEMENT
  // ══════════════════════════════════════════════════════════
  if (state.phase === "day-announcement") {
    const deaths = state.nightDeaths ?? [];

    return renderDeadOverlay(
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(234,179,8,0.12), transparent 45%), " +
            dayBg,
        }}
      >
        {renderSpectatorInfo()}
        {renderPhaseHeader(
          "Le village se reveille",
          `Jour ${state.dayCount}`,
          "\u{2600}\u{FE0F}",
          "text-amber-300/90"
        )}

        {deaths.length > 0 ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-white/40 font-sans tracking-wide">
              Cette nuit, le village a perdu :
            </p>
            {deaths.map((d: DeathInfo) => (
              <div
                key={d.id}
                className="px-8 py-4 rounded-2xl border backdrop-blur-sm"
                style={{
                  borderColor: "rgba(248,113,113,0.25)",
                  background:
                    "linear-gradient(135deg, rgba(248,113,113,0.1), rgba(220,38,38,0.04))",
                  boxShadow: "0 0 25px rgba(248,113,113,0.12)",
                }}
              >
                <p
                  className="text-2xl font-serif font-semibold text-red-400"
                  style={{ textShadow: "0 0 20px rgba(248,113,113,0.3)" }}
                >
                  {d.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p
              className="text-xl font-serif font-semibold text-emerald-400/90"
              style={{ textShadow: "0 0 25px rgba(52,211,153,0.25)" }}
            >
              Personne n&apos;est mort cette nuit !
            </p>
            <p className="text-sm text-white/25 font-sans mt-2">
              Les loups ont rate leur coup...
            </p>
          </div>
        )}

        {renderPlayerList()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // DAY - DISCUSSION
  // ══════════════════════════════════════════════════════════
  if (state.phase === "day-discussion") {
    return renderDeadOverlay(
      <div
        className="flex flex-1 flex-col p-6"
        style={{ background: dayBg }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/25 font-sans tracking-wide">
              Jour {state.dayCount}
            </span>
            {renderRoleBadge(true)}
          </div>
          <span
            className={cn(
              "text-sm font-mono font-bold px-4 py-1 rounded-full border backdrop-blur-sm",
              state.timeLeft <= 10
                ? "text-red-400 border-red-500/40 bg-red-500/10"
                : "text-white/90 border-white/25 bg-black/30"
            )}
            style={
              state.timeLeft <= 10
                ? { boxShadow: "0 0 15px rgba(248,113,113,0.2)" }
                : undefined
            }
          >
            {state.timeLeft}s
          </span>
        </div>

        {renderPhaseHeader(
          "Discussion",
          "Debattez et trouvez les Loups-Garous !",
          "\u{1F4AC}",
          "text-amber-200/90"
        )}

        {/* Chat area */}
        <div
          className="flex-1 w-full max-w-lg mx-auto flex flex-col rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm overflow-hidden"
          style={{ boxShadow: "0 0 30px rgba(0,0,0,0.3)" }}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[200px] max-h-[400px]">
            {(!state.chatMessages ||
              state.chatMessages.length === 0) && (
              <p className="text-xs text-white/25 font-sans text-center py-10 tracking-wide">
                Aucun message pour le moment...
              </p>
            )}
            {state.chatMessages?.map((msg: ChatMessage) => (
              <div key={msg.id} className="flex gap-2.5">
                <span
                  className={cn(
                    "text-xs font-sans font-semibold shrink-0",
                    msg.playerId === playerId
                      ? "text-amber-400"
                      : "text-white/40"
                  )}
                >
                  {msg.playerName}
                </span>
                <p className="text-xs text-white/70 font-sans break-words leading-relaxed">
                  {msg.message}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {myAlive ? (
            <div className="flex gap-2 p-3 border-t border-white/[0.08]">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ton message..."
                maxLength={200}
                autoComplete="off"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-white/25 bg-black/40 text-white/90 font-sans text-xs placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-all"
                style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)" }}
              />
              <button
                onClick={handleChat}
                disabled={!chatInput.trim()}
                className="px-5 py-2.5 rounded-2xl font-sans text-xs font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.03]"
                style={{
                  background: chatInput.trim()
                    ? "linear-gradient(to right, #65dfb2, #4ecf8a)"
                    : "rgba(255,255,255,0.06)",
                  color: chatInput.trim()
                    ? "#0a0a0a"
                    : "rgba(255,255,255,0.2)",
                  boxShadow: chatInput.trim()
                    ? "0 0 20px rgba(101,223,178,0.25)"
                    : "none",
                }}
              >
                Envoyer
              </button>
            </div>
          ) : (
            <div className="p-3 border-t border-white/[0.08] text-center">
              <p className="text-xs text-white/25 font-sans">
                {"\u{1F47B}"} Les morts ne peuvent pas parler
              </p>
            </div>
          )}
        </div>

        {renderPlayerList()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // DAY - VOTE
  // ══════════════════════════════════════════════════════════
  if (state.phase === "day-vote") {
    return renderDeadOverlay(
      <div
        className="flex flex-1 flex-col items-center p-6"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(217,119,6,0.1), transparent 45%), " +
            dayBg,
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-white/25 font-sans tracking-wide">
            Jour {state.dayCount}
          </span>
          {renderRoleBadge(true)}
        </div>
        {renderTimer()}

        {renderPhaseHeader(
          "Vote du village",
          "Qui sera elimine ?",
          "\u{2696}\u{FE0F}",
          "text-amber-200/90"
        )}

        {state.targets && myAlive && !state.hasVoted && (
          <div className="w-full max-w-md space-y-2.5">
            {state.targets.map((t: Target) => {
              const voteCount = state.voteCounts?.[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  onClick={() => handleDayVote(t.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/25 bg-black/30 backdrop-blur-sm text-white/70 font-sans text-sm font-medium hover:bg-white/[0.08] hover:border-white/40 hover:scale-[1.01] transition-all duration-200"
                >
                  <span>{t.name}</span>
                  {voteCount > 0 && (
                    <span
                      className="text-xs text-red-400 font-mono px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(248,113,113,0.1)",
                        boxShadow: "0 0 8px rgba(248,113,113,0.15)",
                      }}
                    >
                      {voteCount} vote{voteCount > 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {state.hasVoted && (
          <div className="text-center">
            <div className="rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm px-6 py-4">
              <p className="text-sm text-white/40 font-sans">
                Vote enregistre
              </p>
            </div>
            <p className="text-xs text-white/25 font-sans mt-3 animate-pulse">
              En attente des autres joueurs...
            </p>
          </div>
        )}

        {state.voteCounts &&
          Object.keys(state.voteCounts).length > 0 && (
            <div className="mt-6 w-full max-w-md rounded-3xl border border-white/25 bg-black/30 backdrop-blur-sm p-5">
              <p className="text-xs text-white/25 font-sans text-center mb-3 uppercase tracking-widest">
                Votes en cours
              </p>
              <div className="space-y-2">
                {Object.entries(state.voteCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([targetId, count]) => {
                    const target = state.players?.find(
                      (p: PlayerInfo) => p.id === targetId
                    );
                    const totalAlive =
                      state.players?.filter(
                        (p: PlayerInfo) => p.alive
                      ).length ?? 1;
                    const pct = (count / totalAlive) * 100;
                    return (
                      <div
                        key={targetId}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs text-white/40 font-sans w-20 text-right truncate">
                          {target?.name ?? "?"}
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background:
                                "linear-gradient(to right, rgba(248,113,113,0.6), rgba(220,38,38,0.8))",
                              boxShadow:
                                pct > 30
                                  ? "0 0 10px rgba(248,113,113,0.3)"
                                  : "none",
                            }}
                          />
                        </div>
                        <span className="text-xs text-red-400 font-mono w-6">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <p className="text-[10px] text-white/20 font-sans text-center mt-2">
                {state.voterIds?.length ?? 0} /{" "}
                {state.players?.filter((p: PlayerInfo) => p.alive)
                  .length ?? 0}{" "}
                votes
              </p>
            </div>
          )}

        {renderPlayerList()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // DAY - RESULT
  // ══════════════════════════════════════════════════════════
  if (state.phase === "day-result") {
    return renderDeadOverlay(
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{ background: dayBg }}
      >
        {renderSpectatorInfo()}
        {renderPhaseHeader(
          "Resultat du vote",
          `Jour ${state.dayCount}`,
          "\u{2696}\u{FE0F}",
          "text-amber-200/90"
        )}

        {state.eliminatedToday && state.eliminatedName ? (
          <div className="text-center space-y-4">
            <div
              className="px-8 py-5 rounded-3xl border backdrop-blur-sm"
              style={{
                borderColor: "rgba(248,113,113,0.25)",
                background:
                  "linear-gradient(160deg, rgba(248,113,113,0.1), rgba(220,38,38,0.04), transparent)",
                boxShadow: "0 0 30px rgba(248,113,113,0.12)",
              }}
            >
              <p className="text-sm text-white/40 font-sans mb-2">
                Le village a decide d&apos;eliminer :
              </p>
              <p
                className="text-3xl font-serif font-semibold text-red-400"
                style={{ textShadow: "0 0 25px rgba(248,113,113,0.3)" }}
              >
                {state.eliminatedName}
              </p>
              {state.eliminatedRole && (
                <p
                  className={cn(
                    "text-sm font-sans mt-3",
                    ROLE_CONFIG[state.eliminatedRole]?.color ??
                      "text-white/40"
                  )}
                >
                  {ROLE_CONFIG[state.eliminatedRole]?.icon}{" "}
                  {ROLE_CONFIG[state.eliminatedRole]?.label}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p
              className="text-xl font-serif font-semibold text-white/40"
              style={{ textShadow: "0 0 20px rgba(255,255,255,0.05)" }}
            >
              Aucune majorite &mdash; personne n&apos;est elimine.
            </p>
          </div>
        )}

        <p className="text-xs text-white/25 font-sans mt-8 animate-pulse tracking-wide">
          La nuit va bientot tomber...
        </p>

        {renderPlayerList()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // HUNTER SHOT
  // ══════════════════════════════════════════════════════════
  if (state.phase === "hunter-shot") {
    return renderDeadOverlay(
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(217,119,6,0.15), transparent 45%), radial-gradient(circle at 70% 60%, rgba(180,83,9,0.08), transparent 40%), #09090b",
        }}
      >
        {renderSpectatorInfo()}
        {renderTimer(5)}

        {state.isHunter ? (
          <>
            {renderPhaseHeader(
              "Dernier tir du Chasseur",
              "Tu meurs ! Choisis qui emporter avec toi",
              "\u{1F3AF}",
              "text-amber-400"
            )}
            {state.targets &&
              renderTargetGrid(
                state.targets,
                handleHunterShot,
                "#fbbf24",
                "#d97706",
                "rgba(251,191,36,0.25)"
              )}
          </>
        ) : (
          <>
            {renderPhaseHeader(
              "Le Chasseur tire !",
              "Il emporte quelqu\u2019un dans sa mort...",
              "\u{1F3AF}",
              "text-amber-400/60"
            )}
            <p className="text-sm text-white/25 font-sans animate-pulse">
              En attente du tir du chasseur...
            </p>
          </>
        )}

        {renderPlayerList()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // GAME OVER
  // ══════════════════════════════════════════════════════════
  if (state.phase === "game-over") {
    const isWolfWin = state.winner === "loups";
    const myTeamWon = myRole
      ? (isWolfWin && myRole === "loup-garou") ||
        (!isWolfWin && myRole !== "loup-garou")
      : false;

    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{
          background: isWolfWin
            ? "radial-gradient(circle at 50% 25%, rgba(153,27,27,0.2), transparent 50%), radial-gradient(circle at 80% 70%, rgba(127,29,29,0.1), transparent 40%), #09090b"
            : "radial-gradient(circle at 50% 25%, rgba(37,99,235,0.15), transparent 50%), radial-gradient(circle at 20% 70%, rgba(29,78,216,0.08), transparent 40%), #09090b",
        }}
      >
        <div className="text-center mb-8">
          <div
            className="text-6xl mb-5"
            style={{
              filter: isWolfWin
                ? "drop-shadow(0 0 35px rgba(248,113,113,0.4))"
                : "drop-shadow(0 0 35px rgba(96,165,250,0.4))",
            }}
          >
            {isWolfWin ? "\u{1F43A}" : "\u{1F3E1}"}
          </div>
          <h2
            className={cn(
              "text-4xl font-serif font-semibold mb-3 tracking-tight",
              isWolfWin ? "text-red-400" : "text-blue-400"
            )}
            style={{
              textShadow: isWolfWin
                ? "0 0 50px rgba(220,38,38,0.35)"
                : "0 0 50px rgba(59,130,246,0.35)",
            }}
          >
            {state.winnerLabel ??
              (isWolfWin ? "Les Loups-Garous" : "Le Village")}{" "}
            remporte la partie !
          </h2>
          <p
            className={cn(
              "text-lg font-sans font-semibold",
              myTeamWon ? "text-emerald-400" : "text-red-400/60"
            )}
            style={
              myTeamWon
                ? { textShadow: "0 0 20px rgba(52,211,153,0.3)" }
                : undefined
            }
          >
            {myTeamWon ? "Victoire !" : "Defaite..."}
          </p>
        </div>

        {state.allRoles && (
          <div className="w-full max-w-md space-y-2.5 mb-6">
            <p className="text-xs text-white/25 font-sans text-center uppercase tracking-[0.25em] mb-4">
              Roles reveles
            </p>
            {state.allRoles.map((r) => {
              const rc = ROLE_CONFIG[r.role];
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center justify-between px-5 py-3 rounded-2xl border backdrop-blur-sm transition-all",
                    !r.alive && "opacity-40"
                  )}
                  style={{
                    borderColor: `${rc?.gradientFrom}25`,
                    background: `linear-gradient(135deg, ${rc?.gradientFrom}08, ${rc?.gradientTo}04)`,
                    boxShadow: r.alive
                      ? `0 0 12px ${rc?.glowColor}`
                      : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xl"
                      style={
                        r.alive
                          ? {
                              filter: `drop-shadow(0 0 8px ${rc?.glowColor})`,
                            }
                          : undefined
                      }
                    >
                      {rc?.icon}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-sans font-medium",
                        !r.alive
                          ? "text-white/25 line-through"
                          : "text-white/90"
                      )}
                    >
                      {r.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-sans", rc?.color)}>
                      {r.roleLabel}
                    </span>
                    {!r.alive && (
                      <span className="text-[10px] text-white/20">
                        {"\u{1F47B}"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // FALLBACK
  // ══════════════════════════════════════════════════════════
  return (
    <div
      className="flex flex-1 items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(88,28,135,0.1), transparent 50%), #09090b",
      }}
    >
      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
      {!error && (
        <p className="text-white/40 animate-pulse font-sans text-lg">
          Chargement...
        </p>
      )}
    </div>
  );
}
