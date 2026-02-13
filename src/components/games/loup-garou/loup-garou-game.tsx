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
    bg: string;
    border: string;
    description: string;
  }
> = {
  villageois: {
    label: "Villageois",
    icon: "\u{1F3D8}\u{FE0F}",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    description: "Vote le jour pour eliminer les loups.",
  },
  "loup-garou": {
    label: "Loup-Garou",
    icon: "\u{1F43A}",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    description: "Devore un villageois chaque nuit.",
  },
  voyante: {
    label: "Voyante",
    icon: "\u{1F441}\u{FE0F}",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    description: "Decouvre le role d\u2019un joueur chaque nuit.",
  },
  sorciere: {
    label: "Sorciere",
    icon: "\u{1F9D9}",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    description: "Possede une potion de soin et une de mort.",
  },
  chasseur: {
    label: "Chasseur",
    icon: "\u{1F3AF}",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    description: "Emporte un joueur dans sa mort.",
  },
  cupidon: {
    label: "Cupidon",
    icon: "\u{1F498}",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">{"\u{1F43A}"}</div>
          <p className="text-white/40 animate-pulse font-sans">
            En attente des joueurs...
          </p>
          {error && (
            <p className="text-sm text-red-400 font-sans mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  const myRole = state.myRole;
  const myAlive = state.myAlive;
  const roleConfig = myRole ? ROLE_CONFIG[myRole] : null;
  const isNight = isNightPhase(state.phase);

  // ── Reusable sub-components (render functions) ─────────

  function renderDeadOverlay(children: React.ReactNode) {
    if (myAlive && !state.isSpectator) return <>{children}</>;
    return (
      <div className="relative flex flex-1 flex-col">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-black/80 border border-white/[0.08] backdrop-blur-sm">
          <p className="text-sm font-sans text-white/50 text-center">
            {"\u{1F47B}"} Tu es mort &mdash; Mode spectateur
          </p>
        </div>
        <div className="flex flex-1 flex-col opacity-70">{children}</div>
      </div>
    );
  }

  function renderPhaseHeader(
    title: string,
    subtitle?: string,
    icon?: string,
    accentColor = "text-white/60"
  ) {
    return (
      <div className="text-center mb-6">
        {icon && <div className="text-4xl mb-3">{icon}</div>}
        <h2
          className={cn("text-2xl font-serif font-light", accentColor)}
          style={
            isNight
              ? { textShadow: "0 0 30px rgba(100,100,255,0.15)" }
              : { textShadow: "0 0 30px rgba(255,200,100,0.1)" }
          }
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-white/30 font-sans mt-1">{subtitle}</p>
        )}
      </div>
    );
  }

  function renderTimer(warn = 10) {
    return (
      <div className="flex items-center justify-center mb-4">
        <span
          className={cn(
            "text-sm font-mono font-bold px-3 py-1 rounded-full border",
            state.timeLeft <= warn
              ? "text-red-400 border-red-500/30 bg-red-500/10"
              : "text-ember border-white/[0.08] bg-white/[0.03]"
          )}
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
          "inline-flex items-center gap-2 rounded-full border font-sans",
          roleConfig.bg,
          roleConfig.border,
          small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
        )}
      >
        <span>{roleConfig.icon}</span>
        <span className={roleConfig.color}>{roleConfig.label}</span>
      </div>
    );
  }

  function renderTargetGrid(
    targets: Target[],
    onSelect: (id: string) => void,
    accentColor = "border-ember/50 bg-ember/10",
    selectedId?: string | null,
    disabled = false
  ) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
        {targets.map((t) => (
          <button
            key={t.id}
            onClick={() => !disabled && onSelect(t.id)}
            disabled={disabled}
            className={cn(
              "px-4 py-3 rounded-lg border text-sm font-sans transition-all",
              selectedId === t.id
                ? accentColor + " text-white"
                : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:border-white/[0.12]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {t.name}
          </button>
        ))}
      </div>
    );
  }

  function renderPlayerList() {
    return (
      <div className="w-full max-w-md mx-auto mt-auto pt-4">
        <div className="flex flex-wrap justify-center gap-2">
          {state.players?.map((p: PlayerInfo) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-sans transition-all",
                !p.alive
                  ? "border-white/[0.04] bg-white/[0.01] text-white/20"
                  : p.isMe
                    ? "border-ember/30 bg-ember/5 text-ember"
                    : "border-white/[0.08] bg-white/[0.03] text-white/60"
              )}
            >
              {!p.alive && (
                <span>{"\u{1F47B}"}</span>
              )}
              <span className={!p.alive ? "line-through" : ""}>
                {p.name}
              </span>
              {p.isMe && (
                <span className="text-[9px] text-white/30">(toi)</span>
              )}
              {p.role && state.phase === "game-over" && (
                <span
                  className={cn(
                    "text-[9px]",
                    ROLE_CONFIG[p.role]?.color ?? "text-white/30"
                  )}
                >
                  {ROLE_CONFIG[p.role]?.icon}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSpectatorInfo() {
    if (!state.isSpectator || !state.allRoles) return null;
    return (
      <div className="w-full max-w-lg mx-auto mb-4 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        <p className="text-[10px] text-white/20 font-sans uppercase tracking-wider mb-1">
          Roles (spectateur)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {state.allRoles.map((r) => (
            <span
              key={r.id}
              className={cn(
                "text-[10px] font-sans px-1.5 py-0.5 rounded border",
                !r.alive && "opacity-40 line-through",
                ROLE_CONFIG[r.role]?.bg,
                ROLE_CONFIG[r.role]?.border,
                ROLE_CONFIG[r.role]?.color
              )}
            >
              {r.name}: {ROLE_CONFIG[r.role]?.icon} {r.roleLabel}
            </span>
          ))}
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
          "text-blue-300/60"
        )}
        <p className="text-sm text-white/20 font-sans animate-pulse">
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
            "radial-gradient(ellipse at center, rgba(60,40,100,0.15) 0%, #060606 70%)",
        }}
      >
        <div className="text-center">
          <p className="text-xs text-white/20 font-sans uppercase tracking-wider mb-6">
            Ton role secret
          </p>
          {roleConfig && (
            <div
              className={cn(
                "rounded-xl border p-8 max-w-xs mx-auto animate-[fadeInScale_0.5s_ease-out]",
                roleConfig.bg,
                roleConfig.border
              )}
            >
              <div className="text-6xl mb-4">{roleConfig.icon}</div>
              <h2
                className={cn(
                  "text-3xl font-serif font-light mb-2",
                  roleConfig.color
                )}
              >
                {roleConfig.label}
              </h2>
              <p className="text-sm text-white/40 font-sans leading-relaxed">
                {roleConfig.description}
              </p>
            </div>
          )}
          <p className="text-xs text-white/20 font-sans mt-6 animate-pulse">
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
            "radial-gradient(ellipse at center, rgba(120,20,20,0.08) 0%, #060606 70%)",
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-white/20 font-sans">
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
              <div className="mb-4 px-3 py-1.5 rounded border border-red-500/20 bg-red-500/5">
                <p className="text-[10px] text-red-400/60 font-sans">
                  Meute : {state.wolfPlayers.map((w) => w.name).join(", ")}
                </p>
              </div>
            )}

            {state.wolfVotes &&
              Object.keys(state.wolfVotes).length > 0 && (
                <div className="mb-4 space-y-1">
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
                "border-red-500/50 bg-red-500/10",
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
            "radial-gradient(ellipse at center, rgba(100,40,180,0.08) 0%, #060606 70%)",
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-white/20 font-sans">
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
              "text-purple-400"
            )}

            {state.seerResult ? (
              <div
                className={cn(
                  "rounded-xl border p-6 max-w-xs text-center",
                  ROLE_CONFIG[state.seerResult.role]?.bg,
                  ROLE_CONFIG[state.seerResult.role]?.border
                )}
              >
                <p className="text-sm text-white/50 font-sans mb-2">
                  {state.seerResult.targetName} est...
                </p>
                <div className="text-3xl mb-2">
                  {ROLE_CONFIG[state.seerResult.role]?.icon}
                </div>
                <p
                  className={cn(
                    "text-xl font-serif",
                    ROLE_CONFIG[state.seerResult.role]?.color
                  )}
                >
                  {state.seerResult.roleLabel}
                </p>
              </div>
            ) : (
              state.targets &&
              renderTargetGrid(
                state.targets,
                handleSeerInspect,
                "border-purple-500/50 bg-purple-500/10"
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
            "radial-gradient(ellipse at center, rgba(20,120,80,0.08) 0%, #060606 70%)",
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-white/20 font-sans">
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
              <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 max-w-sm text-center">
                <p className="text-xs text-red-400/60 font-sans mb-1">
                  Cette nuit, les loups ont attaque :
                </p>
                <p className="text-lg font-serif text-red-400">
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
                    className="w-full px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-sans text-sm hover:bg-emerald-500/20 transition-all"
                  >
                    {"\u{1F48A}"} Potion de soin &mdash; Sauver{" "}
                    {state.attackedPlayer.name}
                  </button>
                )}

              {state.hasHealed && (
                <div className="w-full px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-center">
                  <p className="text-sm text-emerald-400 font-sans">
                    {"\u{2705}"} Potion de soin utilisee !
                  </p>
                </div>
              )}

              {state.canKill && !state.killTarget && (
                <div className="mt-2">
                  <p className="text-xs text-white/30 font-sans text-center mb-2">
                    {"\u{1F480}"} Potion de mort
                  </p>
                  {state.targets &&
                    renderTargetGrid(
                      state.targets,
                      handleWitchKill,
                      "border-red-500/50 bg-red-500/10"
                    )}
                </div>
              )}

              {state.killTarget && (
                <div className="w-full px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-center">
                  <p className="text-sm text-red-400 font-sans">
                    {"\u{1F480}"} Potion de mort utilisee !
                  </p>
                </div>
              )}

              <button
                onClick={handleWitchSkip}
                className="w-full px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 font-sans text-xs hover:bg-white/[0.06] transition-all mt-2"
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
            "radial-gradient(ellipse at center, rgba(200,150,50,0.06) 0%, #060606 70%)",
        }}
      >
        {renderSpectatorInfo()}
        {renderPhaseHeader(
          "Le village se reveille",
          `Jour ${state.dayCount}`,
          "\u{2600}\u{FE0F}",
          "text-amber-300/80"
        )}

        {deaths.length > 0 ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-white/40 font-sans">
              Cette nuit, le village a perdu :
            </p>
            {deaths.map((d: DeathInfo) => (
              <div
                key={d.id}
                className="px-6 py-3 rounded-lg border border-red-500/20 bg-red-500/5"
              >
                <p className="text-xl font-serif text-red-400">{d.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg font-serif text-emerald-400/80">
              Personne n&apos;est mort cette nuit !
            </p>
            <p className="text-sm text-white/30 font-sans mt-1">
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
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(200,150,50,0.04) 0%, #060606 70%)",
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/20 font-sans">
              Jour {state.dayCount}
            </span>
            {renderRoleBadge(true)}
          </div>
          <span
            className={cn(
              "text-sm font-mono font-bold px-3 py-1 rounded-full border",
              state.timeLeft <= 10
                ? "text-red-400 border-red-500/30 bg-red-500/10"
                : "text-ember border-white/[0.08] bg-white/[0.03]"
            )}
          >
            {state.timeLeft}s
          </span>
        </div>

        {renderPhaseHeader(
          "Discussion",
          "Debattez et trouvez les Loups-Garous !",
          "\u{1F4AC}",
          "text-amber-300/70"
        )}

        {/* Chat area */}
        <div className="flex-1 w-full max-w-lg mx-auto flex flex-col rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[400px]">
            {(!state.chatMessages ||
              state.chatMessages.length === 0) && (
              <p className="text-xs text-white/20 font-sans text-center py-8">
                Aucun message pour le moment...
              </p>
            )}
            {state.chatMessages?.map((msg: ChatMessage) => (
              <div key={msg.id} className="flex gap-2">
                <span
                  className={cn(
                    "text-xs font-sans font-medium shrink-0",
                    msg.playerId === playerId
                      ? "text-ember"
                      : "text-white/50"
                  )}
                >
                  {msg.playerName}
                </span>
                <p className="text-xs text-white/70 font-sans break-words">
                  {msg.message}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {myAlive ? (
            <div className="flex gap-2 p-2 border-t border-white/[0.06]">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ton message..."
                maxLength={200}
                autoComplete="off"
                className="flex-1 px-3 py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white font-sans text-xs placeholder:text-white/20 focus:outline-none focus:border-ember/50 transition-all"
              />
              <button
                onClick={handleChat}
                disabled={!chatInput.trim()}
                className="px-4 py-2 rounded-lg bg-ember hover:bg-ember-glow disabled:bg-white/[0.06] disabled:text-white/20 text-white font-sans text-xs font-medium transition-all"
              >
                Envoyer
              </button>
            </div>
          ) : (
            <div className="p-2 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/20 font-sans">
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
            "radial-gradient(ellipse at center, rgba(200,100,20,0.06) 0%, #060606 70%)",
        }}
      >
        {renderSpectatorInfo()}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-white/20 font-sans">
            Jour {state.dayCount}
          </span>
          {renderRoleBadge(true)}
        </div>
        {renderTimer()}

        {renderPhaseHeader(
          "Vote du village",
          "Qui sera elimine ?",
          "\u{2696}\u{FE0F}",
          "text-amber-300/70"
        )}

        {state.targets && myAlive && !state.hasVoted && (
          <div className="w-full max-w-md space-y-2">
            {state.targets.map((t: Target) => {
              const voteCount = state.voteCounts?.[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  onClick={() => handleDayVote(t.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 font-sans text-sm hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                >
                  <span>{t.name}</span>
                  {voteCount > 0 && (
                    <span className="text-xs text-red-400 font-mono">
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
            <div className="px-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
              <p className="text-sm text-white/50 font-sans">
                Vote enregistre
              </p>
            </div>
            <p className="text-xs text-white/20 font-sans mt-2 animate-pulse">
              En attente des autres joueurs...
            </p>
          </div>
        )}

        {state.voteCounts &&
          Object.keys(state.voteCounts).length > 0 && (
            <div className="mt-4 w-full max-w-md">
              <p className="text-xs text-white/20 font-sans text-center mb-2">
                Votes en cours
              </p>
              <div className="space-y-1">
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
                    return (
                      <div
                        key={targetId}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs text-white/50 font-sans w-20 text-right truncate">
                          {target?.name ?? "?"}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-500/60 transition-all duration-300"
                            style={{
                              width: `${(count / totalAlive) * 100}%`,
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
              <p className="text-[10px] text-white/15 font-sans text-center mt-1">
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
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(200,150,50,0.04) 0%, #060606 70%)",
        }}
      >
        {renderSpectatorInfo()}
        {renderPhaseHeader(
          "Resultat du vote",
          `Jour ${state.dayCount}`,
          "\u{2696}\u{FE0F}",
          "text-amber-300/70"
        )}

        {state.eliminatedToday && state.eliminatedName ? (
          <div className="text-center space-y-3">
            <div className="px-6 py-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-white/40 font-sans mb-1">
                Le village a decide d&apos;eliminer :
              </p>
              <p className="text-2xl font-serif text-red-400">
                {state.eliminatedName}
              </p>
              {state.eliminatedRole && (
                <p
                  className={cn(
                    "text-sm font-sans mt-2",
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
            <p className="text-lg font-serif text-white/50">
              Aucune majorite &mdash; personne n&apos;est elimine.
            </p>
          </div>
        )}

        <p className="text-xs text-white/20 font-sans mt-6 animate-pulse">
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
            "radial-gradient(ellipse at center, rgba(180,120,20,0.08) 0%, #060606 70%)",
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
                "border-amber-500/50 bg-amber-500/10"
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
            <p className="text-sm text-white/20 font-sans animate-pulse">
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
            ? "radial-gradient(ellipse at center, rgba(150,20,20,0.1) 0%, #060606 70%)"
            : "radial-gradient(ellipse at center, rgba(20,80,180,0.1) 0%, #060606 70%)",
        }}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">
            {isWolfWin ? "\u{1F43A}" : "\u{1F3E1}"}
          </div>
          <h2
            className={cn(
              "text-3xl font-serif font-light mb-2",
              isWolfWin ? "text-red-400" : "text-blue-400"
            )}
            style={{
              textShadow: isWolfWin
                ? "0 0 40px rgba(220,38,38,0.3)"
                : "0 0 40px rgba(59,130,246,0.3)",
            }}
          >
            {state.winnerLabel ??
              (isWolfWin ? "Les Loups-Garous" : "Le Village")}{" "}
            remporte la partie !
          </h2>
          <p
            className={cn(
              "text-sm font-sans",
              myTeamWon ? "text-emerald-400" : "text-red-400/60"
            )}
          >
            {myTeamWon ? "Victoire !" : "Defaite..."}
          </p>
        </div>

        {state.allRoles && (
          <div className="w-full max-w-md space-y-2 mb-6">
            <p className="text-xs text-white/20 font-sans text-center uppercase tracking-wider mb-3">
              Roles reveles
            </p>
            {state.allRoles.map((r) => {
              const rc = ROLE_CONFIG[r.role];
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 rounded-lg border",
                    rc?.bg,
                    rc?.border,
                    !r.alive && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{rc?.icon}</span>
                    <span
                      className={cn(
                        "text-sm font-sans",
                        !r.alive
                          ? "text-white/30 line-through"
                          : "text-white/80"
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
    <div className="flex flex-1 items-center justify-center">
      {error && <p className="text-sm text-red-400 font-sans">{error}</p>}
      {!error && (
        <p className="text-white/40 animate-pulse font-sans">Chargement...</p>
      )}
    </div>
  );
}
