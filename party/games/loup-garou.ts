import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ── Roles ────────────────────────────────────────────────
type Role = "villageois" | "loup-garou" | "voyante" | "sorciere" | "chasseur";

const ROLE_LABELS: Record<Role, string> = {
  villageois: "Villageois",
  "loup-garou": "Loup-Garou",
  voyante: "Voyante",
  sorciere: "Sorcière",
  chasseur: "Chasseur",
};

// ── Phase types ──────────────────────────────────────────
type Phase =
  | "setup"
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

/** « irl » : tout le monde est dans la même pièce et débat à voix haute.
 *  « remote » : débat par chat écrit (joueurs à distance). */
type Mode = "irl" | "remote";

// ── Config ───────────────────────────────────────────────
const ROLE_REVEAL_TIME = 5000;
const WOLF_VOTE_TIME = 30;
const SEER_TIME = 20;
const WITCH_TIME = 20;
const ANNOUNCEMENT_TIME = 5000;
const DISCUSSION_TIME = 60; // mode à distance (chat)
const IRL_DISCUSSION_TIME = 90; // mode en vrai (max, bouton « On passe au vote »)
// Durée crédible d'une phase de nuit quand le rôle concerné est mort / n'a plus rien
// à faire : on ne saute pas la phase instantanément (sinon tout le monde le devine).
const FAKE_NIGHT_MIN_MS = 5000;
const FAKE_NIGHT_MAX_MS = 10000;
const SEER_REVEAL_DELAY = 2000;
const VOTE_TIME = 30;
const RESULT_TIME = 5000;
const HUNTER_TIME = 15;

// ── Player state ─────────────────────────────────────────
interface LGPlayer {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
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
  phase: Phase = "setup";
  mode: Mode = "irl";
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

  // Hunter
  hunterPendingShot = false;
  /** Moment où le Chasseur est mort : décide de la phase qui suit son tir. */
  hunterContext: "night" | "day" | null = null;
  hunterShotTarget: string | null = null;

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
      });
      i++;
    }

    // Avant la partie : choix du mode (en vrai / à distance) + rappel des règles.
    this.phase = "setup";
    this.broadcastPersonalizedState();
  }

  beginRoleReveal() {
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
    // Remise à zéro des infos du jour précédent (sinon un tir du Chasseur la nuit
    // enchaînerait sur le résultat du vote au lieu de l'annonce du matin).
    this.eliminatedToday = null;
    this.dayVotes.clear();
    this.hunterContext = null;
    this.hunterShotTarget = null;

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

  /** Le rôle existe-t-il dans cette partie (vivant ou mort) ? */
  hasRole(role: Role): boolean {
    for (const p of this.lgPlayers.values()) if (p.role === role) return true;
    return false;
  }

  /** Fin de phase anticipée après une durée aléatoire crédible (5-10 s). */
  scheduleFakeEnd(next: () => void) {
    const delay =
      FAKE_NIGHT_MIN_MS +
      Math.floor(Math.random() * (FAKE_NIGHT_MAX_MS - FAKE_NIGHT_MIN_MS + 1));
    this.phaseTimeout = setTimeout(() => {
      this.phaseTimeout = null;
      this.stopTimer();
      next();
    }, delay);
  }

  startSeerPhase() {
    // Rôle absent de la partie : tout le monde le sait déjà, on peut sauter.
    if (!this.hasRole("voyante")) {
      this.startWitchPhase();
      return;
    }

    const seer = this.getAlivePlayerByRole("voyante");
    this.phase = "night-seer";
    this.seerResult = null;
    this.timeLeft = SEER_TIME;
    this.broadcastPersonalizedState();
    this.startCountdown(SEER_TIME, () => {
      this.startWitchPhase();
    });
    // Voyante morte : on garde la phase une durée crédible pour ne rien trahir.
    if (!seer) this.scheduleFakeEnd(() => this.startWitchPhase());
  }

  startWitchPhase() {
    if (!this.hasRole("sorciere")) {
      this.resolveNight();
      return;
    }

    const witch = this.getAlivePlayerByRole("sorciere");
    const canAct = !!witch && !(this.witchHealUsed && this.witchKillUsed);

    this.phase = "night-witch";
    this.witchHealTarget = this.wolfTarget;
    this.timeLeft = WITCH_TIME;
    this.broadcastPersonalizedState();
    this.startCountdown(WITCH_TIME, () => {
      this.resolveNight();
    });
    // Sorcière morte ou sans potion : durée crédible, pas de saut instantané.
    if (!canAct) this.scheduleFakeEnd(() => this.resolveNight());
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
      this.hunterContext = "night";
      this.hunterShotTarget = null;
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
    const duration = this.mode === "irl" ? IRL_DISCUSSION_TIME : DISCUSSION_TIME;
    this.phase = "day-discussion";
    this.chatMessages = [];
    this.timeLeft = duration;
    this.broadcastPersonalizedState();
    this.startCountdown(duration, () => {
      this.startDayVote();
    });
  }

  startDayVote() {
    this.phase = "day-vote";
    this.dayVotes.clear();
    this.eliminatedToday = null;
    this.hunterContext = null;
    this.hunterShotTarget = null;
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

      if (p && p.role === "chasseur") {
        this.phase = "hunter-shot";
        this.hunterPendingShot = true;
        this.hunterContext = "day";
        this.hunterShotTarget = null;
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

    // ── Choix du mode / lancement (avant la partie) ──
    if (action === "set-mode" && this.phase === "setup") {
      const mode = payload.mode;
      if (mode !== "irl" && mode !== "remote") return;
      this.mode = mode;
      this.broadcastPersonalizedState();
      return;
    }

    if (action === "begin" && this.phase === "setup") {
      this.beginRoleReveal();
      return;
    }

    // ── Mode « en vrai » : n'importe quel joueur vivant clôt le débat ──
    if (action === "end-discussion" && this.phase === "day-discussion") {
      if (this.mode !== "irl" || !lgPlayer.alive) return;
      this.stopTimer();
      this.clearPhaseTimeout();
      this.startDayVote();
      return;
    }

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
      this.phaseTimeout = setTimeout(() => {
        this.phaseTimeout = null;
        this.startWitchPhase();
      }, SEER_REVEAL_DELAY);
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
      this.hunterShotTarget = targetId;

      this.stopTimer();
      this.clearPhaseTimeout();

      if (this.hunterContext === "day") {
        this.showDayResult();
      } else {
        this.showDayAnnouncement();
      }
      return;
    }

    // ── Chat during discussion ──
    if (action === "chat" && this.phase === "day-discussion") {
      if (this.mode !== "remote" || !lgPlayer.alive) return;
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

      if (this.dayVotes.has(lgPlayer.id)) return;
      this.dayVotes.set(lgPlayer.id, targetId);

      const alivePlayers = this.getAlivePlayers();
      if (alivePlayers.every((p) => this.dayVotes.has(p.id))) {
        this.resolveDayVotes();
        return;
      }
      // État personnalisé (hasVoted) pour que le votant voie « Vote enregistré ».
      this.broadcastPersonalizedState();
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
      mode: this.mode,
      chatMessages: this.chatMessages,
      hunterShot: this.getHunterShotInfo(),
      players: this.getPublicPlayerList(playerId, isDead),
    };

    // Exception : le Chasseur mort doit pouvoir tirer — il ne passe pas en mode spectateur
    const isShootingHunter =
      this.phase === "hunter-shot" && lgPlayer?.role === "chasseur" && this.hunterPendingShot;

    // Les morts voient tout (mode spectateur). Un non-joueur (arrivé en cours de partie)
    // n'a jamais joué : il ne doit pas voir les rôles.
    if (
      isDead &&
      lgPlayer &&
      this.phase !== "role-reveal" &&
      this.phase !== "setup" &&
      !isShootingHunter
    ) {
      base.isSpectator = true;
      base.allRoles = this.getAllRoles();
      base.wolfTarget = this.wolfTarget;
      base.wolfVotes = Object.fromEntries(this.wolfVotes);
      base.nightDeaths = this.nightDeaths.map((id) => {
        const p = this.lgPlayers.get(id);
        return { id, name: p?.name ?? "?" };
      });
      base.eliminatedToday = this.eliminatedToday;
      base.eliminatedName = this.eliminatedToday
        ? this.lgPlayers.get(this.eliminatedToday)?.name ?? null
        : null;
      base.eliminatedRole = this.eliminatedToday
        ? this.lgPlayers.get(this.eliminatedToday)?.role ?? null
        : null;
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
      case "setup":
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

  /** Cible du dernier tir du Chasseur (affichée dans l'annonce du matin / le résultat du vote). */
  getHunterShotInfo(): { hunterName: string; targetName: string; targetRole: Role } | null {
    if (!this.hunterShotTarget) return null;
    const target = this.lgPlayers.get(this.hunterShotTarget);
    const hunter = Array.from(this.lgPlayers.values()).find((p) => p.role === "chasseur");
    if (!target) return null;
    return { hunterName: hunter?.name ?? "Le Chasseur", targetName: target.name, targetRole: target.role };
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
      mode: this.mode,
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
