import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ── Roles ────────────────────────────────────────────────
type Role =
  | "villageois"
  | "loup-garou"
  | "voyante"
  | "sorciere"
  | "chasseur"
  | "cupidon";

const ROLE_LABELS: Record<Role, string> = {
  villageois: "Villageois",
  "loup-garou": "Loup-Garou",
  voyante: "Voyante",
  sorciere: "Sorciere",
  chasseur: "Chasseur",
  cupidon: "Cupidon",
};

// ── Phase types ──────────────────────────────────────────
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

type Team = "village" | "loups";

// ── Config ───────────────────────────────────────────────
const ROLE_REVEAL_TIME = 5000;
const WOLF_VOTE_TIME = 30;
const SEER_TIME = 20;
const WITCH_TIME = 20;
const ANNOUNCEMENT_TIME = 5000;
const DISCUSSION_TIME = 60;
const VOTE_TIME = 30;
const RESULT_TIME = 5000;
const HUNTER_TIME = 15;

// ── Player state ─────────────────────────────────────────
interface LGPlayer {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
  lovers: boolean;
}

// ── Chat message ─────────────────────────────────────────
interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

// ══════════════════════════════════════════════════════════
export class LoupGarouGame extends BaseGame {
  lgPlayers: Map<string, LGPlayer> = new Map();
  phase: Phase = "role-reveal";
  dayCount = 0;
  timer: ReturnType<typeof setInterval> | null = null;
  phaseTimeout: ReturnType<typeof setTimeout> | null = null;
  timeLeft = 0;

  // Night tracking
  wolfVotes: Map<string, string> = new Map();
  wolfTarget: string | null = null;
  seerResult: { targetId: string; role: Role } | null = null;
  witchHealUsed = false;
  witchKillUsed = false;
  witchHealTarget: string | null = null;
  witchKillTarget: string | null = null;
  witchHealed = false;
  nightDeaths: string[] = [];

  // Day tracking
  dayVotes: Map<string, string> = new Map();
  eliminatedToday: string | null = null;

  // Cupid
  cupidLinks: [string, string] | null = null;
  cupidHasChosen = false;

  // Hunter
  hunterPendingShot = false;

  // Chat
  chatMessages: ChatMessage[] = [];
  chatIdCounter = 0;

  // ── Role distribution ──────────────────────────────────
  distributeRoles(): Role[] {
    const count = this.players.size;
    const roles: Role[] = [];

    if (count <= 4) {
      roles.push("loup-garou", "voyante");
      for (let i = 2; i < count; i++) roles.push("villageois");
    } else if (count <= 6) {
      roles.push("loup-garou", "voyante", "sorciere");
      for (let i = 3; i < count; i++) roles.push("villageois");
    } else {
      roles.push("loup-garou", "loup-garou", "voyante", "sorciere", "chasseur");
      for (let i = 5; i < count; i++) roles.push("villageois");
    }

    // Fisher-Yates shuffle
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    return roles;
  }

  // ── Start ──────────────────────────────────────────────
  start() {
    this.started = true;
    const roles = this.distributeRoles();

    let i = 0;
    for (const [id, player] of this.players) {
      this.lgPlayers.set(id, {
        id,
        name: player.name,
        role: roles[i] ?? "villageois",
        alive: true,
        lovers: false,
      });
      i++;
    }

    this.phase = "role-reveal";
    this.broadcastPersonalizedState();

    this.phaseTimeout = setTimeout(() => {
      this.startNight();
    }, ROLE_REVEAL_TIME);
  }

  // ── Night flow ─────────────────────────────────────────
  startNight() {
    this.dayCount++;
    this.wolfVotes.clear();
    this.wolfTarget = null;
    this.seerResult = null;
    this.witchHealTarget = null;
    this.witchKillTarget = null;
    this.witchHealed = false;
    this.nightDeaths = [];

    this.startWolfPhase();
  }

  startWolfPhase() {
    this.phase = "night-wolves";
    this.wolfVotes.clear();
    this.timeLeft = WOLF_VOTE_TIME;
    this.broadcastPersonalizedState();
    this.startCountdown(WOLF_VOTE_TIME, () => {
      this.resolveWolfVotes();
      this.startSeerPhase();
    });
  }

  resolveWolfVotes() {
    const voteCounts = new Map<string, number>();
    for (const targetId of this.wolfVotes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1);
    }

    let maxVotes = 0;
    const candidates: string[] = [];
    for (const [targetId, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates.length = 0;
        candidates.push(targetId);
      } else if (count === maxVotes) {
        candidates.push(targetId);
      }
    }

    if (candidates.length > 0) {
      this.wolfTarget = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      const aliveVillagers = this.getAlivePlayers().filter(
        (p) => p.role !== "loup-garou"
      );
      if (aliveVillagers.length > 0) {
        this.wolfTarget =
          aliveVillagers[Math.floor(Math.random() * aliveVillagers.length)].id;
      }
    }
  }

  startSeerPhase() {
    const seer = this.getAlivePlayerByRole("voyante");
    if (!seer) {
      this.startWitchPhase();
      return;
    }

    this.phase = "night-seer";
    this.seerResult = null;
    this.timeLeft = SEER_TIME;
    this.broadcastPersonalizedState();
    this.startCountdown(SEER_TIME, () => {
      this.startWitchPhase();
    });
  }

  startWitchPhase() {
    const witch = this.getAlivePlayerByRole("sorciere");
    if (!witch || (this.witchHealUsed && this.witchKillUsed)) {
      this.resolveNight();
      return;
    }

    this.phase = "night-witch";
    this.witchHealTarget = this.wolfTarget;
    this.timeLeft = WITCH_TIME;
    this.broadcastPersonalizedState();
    this.startCountdown(WITCH_TIME, () => {
      this.resolveNight();
    });
  }

  resolveNight() {
    this.stopTimer();
    this.clearPhaseTimeout();

    if (this.wolfTarget && !this.witchHealed) {
      this.nightDeaths.push(this.wolfTarget);
    }

    if (this.witchKillTarget) {
      if (!this.nightDeaths.includes(this.witchKillTarget)) {
        this.nightDeaths.push(this.witchKillTarget);
      }
    }

    this.checkLoverDeaths(this.nightDeaths);

    for (const id of this.nightDeaths) {
      const p = this.lgPlayers.get(id);
      if (p) p.alive = false;
    }

    const deadHunter = this.nightDeaths.find((id) => {
      const p = this.lgPlayers.get(id);
      return p && p.role === "chasseur";
    });

    if (deadHunter) {
      this.hunterPendingShot = true;
      this.phase = "hunter-shot";
      this.timeLeft = HUNTER_TIME;
      this.broadcastPersonalizedState();
      this.startCountdown(HUNTER_TIME, () => {
        this.hunterPendingShot = false;
        this.showDayAnnouncement();
      });
      return;
    }

    this.showDayAnnouncement();
  }

  showDayAnnouncement() {
    this.stopTimer();
    this.clearPhaseTimeout();

    const winner = this.checkWinCondition();
    if (winner) {
      this.endLoupGarou(winner);
      return;
    }

    this.phase = "day-announcement";
    this.broadcastPersonalizedState();

    this.phaseTimeout = setTimeout(() => {
      this.startDayDiscussion();
    }, ANNOUNCEMENT_TIME);
  }

  startDayDiscussion() {
    this.phase = "day-discussion";
    this.chatMessages = [];
    this.timeLeft = DISCUSSION_TIME;
    this.broadcastPersonalizedState();
    this.startCountdown(DISCUSSION_TIME, () => {
      this.startDayVote();
    });
  }

  startDayVote() {
    this.phase = "day-vote";
    this.dayVotes.clear();
    this.eliminatedToday = null;
    this.timeLeft = VOTE_TIME;
    this.broadcastPersonalizedState();
    this.startCountdown(VOTE_TIME, () => {
      this.resolveDayVotes();
    });
  }

  resolveDayVotes() {
    this.stopTimer();
    this.clearPhaseTimeout();

    const voteCounts = new Map<string, number>();
    for (const targetId of this.dayVotes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1);
    }

    let maxVotes = 0;
    const candidates: string[] = [];
    for (const [targetId, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates.length = 0;
        candidates.push(targetId);
      } else if (count === maxVotes) {
        candidates.push(targetId);
      }
    }

    if (candidates.length === 1) {
      this.eliminatedToday = candidates[0];
    } else if (candidates.length > 1) {
      this.eliminatedToday =
        candidates[Math.floor(Math.random() * candidates.length)];
    }

    if (this.eliminatedToday) {
      const p = this.lgPlayers.get(this.eliminatedToday);
      if (p) p.alive = false;

      const loverDeaths: string[] = [];
      this.checkLoverDeaths([this.eliminatedToday], loverDeaths);
      for (const id of loverDeaths) {
        const lp = this.lgPlayers.get(id);
        if (lp) lp.alive = false;
      }

      if (p && p.role === "chasseur") {
        this.phase = "hunter-shot";
        this.hunterPendingShot = true;
        this.timeLeft = HUNTER_TIME;
        this.broadcastPersonalizedState();
        this.startCountdown(HUNTER_TIME, () => {
          this.hunterPendingShot = false;
          this.showDayResult();
        });
        return;
      }
    }

    this.showDayResult();
  }

  showDayResult() {
    this.stopTimer();
    this.clearPhaseTimeout();

    const winner = this.checkWinCondition();
    if (winner) {
      this.endLoupGarou(winner);
      return;
    }

    this.phase = "day-result";
    this.broadcastPersonalizedState();

    this.phaseTimeout = setTimeout(() => {
      this.startNight();
    }, RESULT_TIME);
  }

  // ── Win condition ──────────────────────────────────────
  checkWinCondition(): Team | null {
    const alive = this.getAlivePlayers();
    const wolves = alive.filter((p) => p.role === "loup-garou");
    const villagers = alive.filter((p) => p.role !== "loup-garou");

    if (wolves.length === 0) return "village";
    if (wolves.length >= villagers.length) return "loups";
    return null;
  }

  endLoupGarou(winner: Team) {
    this.stopTimer();
    this.clearPhaseTimeout();
    this.phase = "game-over";

    const rankings: GameRanking[] = [];
    let rank = 1;

    for (const [, p] of this.lgPlayers) {
      const isWolf = p.role === "loup-garou";
      const isWinningTeam =
        (winner === "loups" && isWolf) || (winner === "village" && !isWolf);
      if (isWinningTeam) {
        rankings.push({
          playerId: p.id,
          playerName: p.name,
          rank,
          score: p.alive ? 3 : 1,
        });
      }
    }

    rank = rankings.length + 1;

    for (const [, p] of this.lgPlayers) {
      const isWolf = p.role === "loup-garou";
      const isWinningTeam =
        (winner === "loups" && isWolf) || (winner === "village" && !isWolf);
      if (!isWinningTeam) {
        rankings.push({
          playerId: p.id,
          playerName: p.name,
          rank,
          score: 0,
        });
      }
    }

    this.broadcastGameOver(winner, rankings);
    this.endGame(rankings);
  }

  // ── Message handling ───────────────────────────────────
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const senderPlayer = this.findPlayerByConnection(sender.id);
    if (!senderPlayer) return;

    const lgPlayer = this.lgPlayers.get(senderPlayer.id);
    if (!lgPlayer) return;

    // ── Wolf vote ──
    if (action === "wolf-vote" && this.phase === "night-wolves") {
      if (lgPlayer.role !== "loup-garou" || !lgPlayer.alive) return;
      const targetId = payload.targetId as string;
      const target = this.lgPlayers.get(targetId);
      if (!target || !target.alive || target.role === "loup-garou") return;

      this.wolfVotes.set(lgPlayer.id, targetId);
      this.broadcastToWolves();

      const aliveWolves = this.getAlivePlayers().filter(
        (p) => p.role === "loup-garou"
      );
      if (aliveWolves.every((w) => this.wolfVotes.has(w.id))) {
        this.resolveWolfVotes();
        this.stopTimer();
        this.clearPhaseTimeout();
        this.startSeerPhase();
      }
      return;
    }

    // ── Seer inspect ──
    if (action === "seer-inspect" && this.phase === "night-seer") {
      if (lgPlayer.role !== "voyante" || !lgPlayer.alive) return;
      if (this.seerResult) return;

      const targetId = payload.targetId as string;
      const target = this.lgPlayers.get(targetId);
      if (!target || !target.alive || target.id === lgPlayer.id) return;

      this.seerResult = { targetId: target.id, role: target.role };
      this.broadcastPersonalizedState();

      this.stopTimer();
      this.clearPhaseTimeout();
      setTimeout(() => {
        this.startWitchPhase();
      }, 2000);
      return;
    }

    // ── Witch actions ──
    if (action === "witch-heal" && this.phase === "night-witch") {
      if (lgPlayer.role !== "sorciere" || !lgPlayer.alive) return;
      if (this.witchHealUsed) return;

      this.witchHealUsed = true;
      this.witchHealed = true;
      this.broadcastPersonalizedState();
      return;
    }

    if (action === "witch-kill" && this.phase === "night-witch") {
      if (lgPlayer.role !== "sorciere" || !lgPlayer.alive) return;
      if (this.witchKillUsed) return;

      const targetId = payload.targetId as string;
      const target = this.lgPlayers.get(targetId);
      if (!target || !target.alive || target.id === lgPlayer.id) return;

      this.witchKillUsed = true;
      this.witchKillTarget = targetId;
      this.broadcastPersonalizedState();
      return;
    }

    if (action === "witch-skip" && this.phase === "night-witch") {
      if (lgPlayer.role !== "sorciere" || !lgPlayer.alive) return;
      this.stopTimer();
      this.clearPhaseTimeout();
      this.resolveNight();
      return;
    }

    // ── Hunter shot ──
    if (action === "hunter-shot" && this.phase === "hunter-shot") {
      if (lgPlayer.role !== "chasseur") return;
      if (!this.hunterPendingShot) return;

      const targetId = payload.targetId as string;
      const target = this.lgPlayers.get(targetId);
      if (!target || !target.alive) return;

      target.alive = false;
      this.hunterPendingShot = false;

      const loverDeaths: string[] = [];
      this.checkLoverDeaths([targetId], loverDeaths);
      for (const id of loverDeaths) {
        const lp = this.lgPlayers.get(id);
        if (lp) lp.alive = false;
      }

      this.stopTimer();
      this.clearPhaseTimeout();

      if (this.eliminatedToday !== null) {
        this.showDayResult();
      } else {
        this.showDayAnnouncement();
      }
      return;
    }

    // ── Chat during discussion ──
    if (action === "chat" && this.phase === "day-discussion") {
      if (!lgPlayer.alive) return;
      const message = ((payload.message as string) ?? "").trim();
      if (!message || message.length > 200) return;

      this.chatIdCounter++;
      this.chatMessages.push({
        id: `msg-${this.chatIdCounter}`,
        playerId: lgPlayer.id,
        playerName: lgPlayer.name,
        message,
        timestamp: Date.now(),
      });

      this.broadcast({
        type: "game-update",
        payload: { chatMessages: this.chatMessages },
      });
      return;
    }

    // ── Day vote ──
    if (action === "day-vote" && this.phase === "day-vote") {
      if (!lgPlayer.alive) return;
      const targetId = payload.targetId as string;
      const target = this.lgPlayers.get(targetId);
      if (!target || !target.alive || target.id === lgPlayer.id) return;

      this.dayVotes.set(lgPlayer.id, targetId);
      this.broadcastVoteCounts();

      const alivePlayers = this.getAlivePlayers();
      if (alivePlayers.every((p) => this.dayVotes.has(p.id))) {
        this.resolveDayVotes();
      }
      return;
    }
  }

  // ── Helpers ────────────────────────────────────────────
  getAlivePlayers(): LGPlayer[] {
    return Array.from(this.lgPlayers.values()).filter((p) => p.alive);
  }

  getAlivePlayerByRole(role: Role): LGPlayer | undefined {
    return Array.from(this.lgPlayers.values()).find(
      (p) => p.role === role && p.alive
    );
  }

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  checkLoverDeaths(deaths: string[], extraDeaths?: string[]) {
    if (!this.cupidLinks) return;
    const [a, b] = this.cupidLinks;
    for (const id of deaths) {
      if (id === a) {
        const lover = this.lgPlayers.get(b);
        if (lover && lover.alive) {
          if (extraDeaths) {
            extraDeaths.push(b);
          } else {
            if (!this.nightDeaths.includes(b)) {
              this.nightDeaths.push(b);
            }
          }
        }
      }
      if (id === b) {
        const lover = this.lgPlayers.get(a);
        if (lover && lover.alive) {
          if (extraDeaths) {
            extraDeaths.push(a);
          } else {
            if (!this.nightDeaths.includes(a)) {
              this.nightDeaths.push(a);
            }
          }
        }
      }
    }
  }

  // ── Timer management ───────────────────────────────────
  startCountdown(seconds: number, onComplete: () => void) {
    this.stopTimer();
    this.clearPhaseTimeout();
    this.timeLeft = seconds;

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({
        type: "game-update",
        payload: { timeLeft: this.timeLeft },
      });

      if (this.timeLeft <= 0) {
        this.stopTimer();
        onComplete();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  clearPhaseTimeout() {
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
  }

  // ── Broadcast to wolves only ───────────────────────────
  broadcastToWolves() {
    const wolves = Array.from(this.lgPlayers.values()).filter(
      (p) => p.role === "loup-garou" && p.alive
    );
    const wolfVoteData = Object.fromEntries(this.wolfVotes);

    for (const wolf of wolves) {
      const player = this.players.get(wolf.id);
      if (player) {
        this.sendTo(player.connectionId, {
          type: "game-update",
          payload: { wolfVotes: wolfVoteData },
        });
      }
    }
  }

  // ── Broadcast vote counts during day vote ──────────────
  broadcastVoteCounts() {
    const voteCounts: Record<string, number> = {};
    for (const targetId of this.dayVotes.values()) {
      voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
    }

    const voterIds = Array.from(this.dayVotes.keys());

    this.broadcast({
      type: "game-update",
      payload: { voteCounts, voterIds },
    });
  }

  // ── Personalized state broadcast ───────────────────────
  broadcastPersonalizedState() {
    for (const [playerId, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(playerId),
      });
    }
  }

  getStateForPlayer(playerId: string): Record<string, unknown> {
    const lgPlayer = this.lgPlayers.get(playerId);
    const isDead = lgPlayer ? !lgPlayer.alive : true;

    const base: Record<string, unknown> = {
      phase: this.phase,
      dayCount: this.dayCount,
      timeLeft: this.timeLeft,
      myId: playerId,
      myRole: lgPlayer?.role ?? null,
      myAlive: lgPlayer?.alive ?? false,
      chatMessages: this.chatMessages,
      players: this.getPublicPlayerList(playerId, isDead),
    };

    // Dead players see everything (spectator mode)
    if (isDead && this.phase !== "role-reveal") {
      base.isSpectator = true;
      base.allRoles = this.getAllRoles();
      base.wolfTarget = this.wolfTarget;
      base.wolfVotes = Object.fromEntries(this.wolfVotes);
      base.nightDeaths = this.nightDeaths.map((id) => {
        const p = this.lgPlayers.get(id);
        return { id, name: p?.name ?? "?" };
      });
      base.eliminatedToday = this.eliminatedToday;
      base.voteCounts = this.getDayVoteCounts();
      base.voterIds = Array.from(this.dayVotes.keys());
      if (this.seerResult) {
        base.seerResult = {
          targetId: this.seerResult.targetId,
          targetName: this.lgPlayers.get(this.seerResult.targetId)?.name ?? "?",
          role: this.seerResult.role,
          roleLabel: ROLE_LABELS[this.seerResult.role],
        };
      }
      return base;
    }

    switch (this.phase) {
      case "role-reveal":
        break;

      case "night-wolves":
        if (lgPlayer?.role === "loup-garou" && lgPlayer.alive) {
          base.wolfPlayers = this.getAlivePlayers()
            .filter((p) => p.role === "loup-garou")
            .map((p) => ({ id: p.id, name: p.name }));
          base.wolfVotes = Object.fromEntries(this.wolfVotes);
          base.targets = this.getAlivePlayers()
            .filter((p) => p.role !== "loup-garou")
            .map((p) => ({ id: p.id, name: p.name }));
        }
        break;

      case "night-seer":
        if (lgPlayer?.role === "voyante" && lgPlayer.alive) {
          base.targets = this.getAlivePlayers()
            .filter((p) => p.id !== playerId)
            .map((p) => ({ id: p.id, name: p.name }));
          if (this.seerResult) {
            base.seerResult = {
              targetId: this.seerResult.targetId,
              targetName:
                this.lgPlayers.get(this.seerResult.targetId)?.name ?? "?",
              role: this.seerResult.role,
              roleLabel: ROLE_LABELS[this.seerResult.role],
            };
          }
        }
        break;

      case "night-witch":
        if (lgPlayer?.role === "sorciere" && lgPlayer.alive) {
          const attackedPlayer = this.witchHealTarget
            ? this.lgPlayers.get(this.witchHealTarget)
            : null;
          base.attackedPlayer = attackedPlayer
            ? { id: attackedPlayer.id, name: attackedPlayer.name }
            : null;
          base.canHeal = !this.witchHealUsed;
          base.canKill = !this.witchKillUsed;
          base.hasHealed = this.witchHealed;
          base.killTarget = this.witchKillTarget;
          base.targets = this.getAlivePlayers()
            .filter((p) => p.id !== playerId)
            .map((p) => ({ id: p.id, name: p.name }));
        }
        break;

      case "day-announcement":
        base.nightDeaths = this.nightDeaths.map((id) => {
          const p = this.lgPlayers.get(id);
          return { id, name: p?.name ?? "?" };
        });
        break;

      case "day-discussion":
        break;

      case "day-vote":
        base.targets = this.getAlivePlayers()
          .filter((p) => p.id !== playerId)
          .map((p) => ({ id: p.id, name: p.name }));
        base.voteCounts = this.getDayVoteCounts();
        base.voterIds = Array.from(this.dayVotes.keys());
        base.hasVoted = this.dayVotes.has(playerId);
        break;

      case "day-result":
        base.eliminatedToday = this.eliminatedToday;
        base.eliminatedName = this.eliminatedToday
          ? this.lgPlayers.get(this.eliminatedToday)?.name ?? null
          : null;
        base.eliminatedRole = this.eliminatedToday
          ? this.lgPlayers.get(this.eliminatedToday)?.role ?? null
          : null;
        break;

      case "hunter-shot":
        if (lgPlayer?.role === "chasseur") {
          base.targets = this.getAlivePlayers()
            .filter((p) => p.id !== playerId)
            .map((p) => ({ id: p.id, name: p.name }));
          base.isHunter = true;
        }
        break;

      case "game-over":
        base.allRoles = this.getAllRoles();
        break;
    }

    return base;
  }

  getPublicPlayerList(
    viewerId: string,
    isSpectator: boolean
  ): Array<Record<string, unknown>> {
    return Array.from(this.lgPlayers.values()).map((p) => {
      const data: Record<string, unknown> = {
        id: p.id,
        name: p.name,
        alive: p.alive,
        isMe: p.id === viewerId,
      };

      if (this.phase === "game-over" || isSpectator) {
        data.role = p.role;
        data.roleLabel = ROLE_LABELS[p.role];
      }

      return data;
    });
  }

  getAllRoles(): Array<Record<string, unknown>> {
    return Array.from(this.lgPlayers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      roleLabel: ROLE_LABELS[p.role],
      alive: p.alive,
    }));
  }

  getDayVoteCounts(): Record<string, number> {
    const voteCounts: Record<string, number> = {};
    for (const targetId of this.dayVotes.values()) {
      voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
    }
    return voteCounts;
  }

  broadcastGameOver(winner: Team, rankings: GameRanking[]) {
    for (const [playerId, player] of this.players) {
      const state = this.getStateForPlayer(playerId);
      state.winner = winner;
      state.winnerLabel =
        winner === "loups" ? "Les Loups-Garous" : "Le Village";
      state.allRoles = this.getAllRoles();
      state.rankings = rankings;

      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: state,
      });
    }
  }

  // ── Required BaseGame methods ──────────────────────────
  getState(): Record<string, unknown> {
    return {
      phase: this.phase,
      dayCount: this.dayCount,
      timeLeft: this.timeLeft,
      players: Array.from(this.lgPlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        alive: p.alive,
      })),
    };
  }

  cleanup() {
    this.stopTimer();
    this.clearPhaseTimeout();
  }
}
