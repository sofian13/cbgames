import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Config -----------------------------------------------
const INTRO_TIME = 3200;
const CLUE_TIME = 45;
const GUESS_TIME = 30;
const REVEAL_TIME = 8500;
const START_DELAY = 1300;

// Points selon la distance |guess - target| (0-100)
function distancePoints(d: number): number {
  if (d <= 5) return 5;
  if (d <= 12) return 3;
  if (d <= 22) return 2;
  return 0;
}

// -- Spectrum bank ----------------------------------------
interface Spectrum {
  left: string;
  right: string;
}

const SPECTRUMS: Spectrum[] = [
  { left: "Ta mère approuverait", right: "Ta mère appellerait un prêtre" },
  { left: "Dimanche soir déprime", right: "Vendredi soir 23h" },
  { left: "Truc de boomer", right: "Truc de Gen Z" },
  { left: "Red flag", right: "Green flag" },
  { left: "Ça passe en story", right: "Ça reste en amis proches" },
  { left: "Mon banquier est fier", right: "Mon banquier pleure" },
  { left: "Message vu à 8h", right: "Message vu à 4h du mat" },
  { left: "Ça sent le linge propre", right: "Ça sent le vestiaire" },
  { left: "Réveil tout frais", right: "Réveil de zombie" },
  { left: "Truc de daron", right: "Truc de gamin" },
  { left: "Pote fiable", right: "Pote qui ghoste" },
  { left: "Même pas de 2e date", right: "Présenté(e) aux parents" },
  { left: "Faisable un lundi", right: "Seulement en vacances" },
  { left: "Personne ne remarque", right: "Tout le bureau en parle" },
  { left: "Phrase de drague gênante", right: "Phrase de drague qui marche" },
  { left: "Gâteau de mamie", right: "Plat de chef étoilé" },
  { left: "Ça se dit au repas de famille", right: "Surtout pas au repas de famille" },
  { left: "Un 👍 suffit", right: "Ça mérite un vocal de 5 min" },
  { left: "Normal à 30 ans", right: "Bizarre à 30 ans" },
  { left: "Énergie de figurant", right: "Énergie de perso principal" },
  { left: "Silence gênant", right: "Fou rire général" },
  { left: "Lit défait toute la semaine", right: "Appart de catalogue" },
  { left: "Moment de solitude", right: "Moment de gloire" },
  { left: "Ça craque au premier lavage", right: "Indestructible" },
  { left: "Ça se règle par SMS", right: "Ça se règle en face" },
  { left: "Calme plat", right: "Drama de télé-réalité" },
  { left: "Anecdote oubliée demain", right: "Histoire racontée à ton mariage" },
  { left: "Talent de canapé", right: "Talent de scène" },
  { left: "Fond de placard", right: "Repas de fête" },
  { left: "Un peu fatigué(e)", right: "Je dors trois jours" },
  { left: "Ça vaut un mot d'excuse", right: "Ça vaut une démission" },
  { left: "Truc de collégien", right: "Truc d'adulte responsable" },
  { left: "Pas besoin de tuto", right: "Faut un tuto de 2h" },
  { left: "Spoiler pardonnable", right: "Spoiler impardonnable" },
  { left: "Ça fait sourire", right: "Ça fait pleurer de rire" },
  { left: "Vibe bibliothèque", right: "Vibe festival" },
  { left: "Prénom de chien", right: "Prénom de bébé" },
  { left: "Mérite un like", right: "Mérite d'être partagé partout" },
  { left: "Tenue pour sortir les poubelles", right: "Tenue de mariage" },
  { left: "Coloc de rêve", right: "Coloc de l'enfer" },
  { left: "Hygiène de vie de moine", right: "Hygiène de vie de rockstar" },
  { left: "Repas de régime", right: "Repas de lendemain de soirée" },
  { left: "Discret comme un ninja", right: "Discret comme une fanfare" },
  { left: "Je l'avoue au premier date", right: "Je l'emporte dans la tombe" },
  { left: "Deux minutes de retard", right: "J'ai raté mon train" },
  { left: "Sport de chill", right: "Sport de guerrier" },
  { left: "Réaction de mamie", right: "Réaction d'ado" },
  { left: "Zéro stress", right: "Stress d'entretien d'embauche" },
  { left: "Musique d'ascenseur", right: "Son de fin de soirée" },
  { left: "Plus vieux que tes parents", right: "Sorti la semaine dernière" },
  { left: "Cringe", right: "Iconique" },
  { left: "Idée de premier date", right: "Idée de dixième date" },
  { left: "Ça se fait seul(e)", right: "Ça se fait à quinze" },
  { left: "Snack de 16h", right: "Festin de Noël" },
  { left: "Personnalité de chat", right: "Personnalité de chien" },
  { left: "Mensonge pieux", right: "Mensonge d'État" },
  { left: "Petit plaisir", right: "Bonheur absolu" },
  { left: "Week-end sous la couette", right: "Week-end sans dormir" },
  { left: "Effort minimum", right: "Effort olympique" },
  { left: "Avis de tonton", right: "Avis d'expert" },
  { left: "Swipe à gauche", right: "Swipe à droite" },
  { left: "OK dès 8 ans", right: "Interdit aux moins de 18 ans" },
  { left: "Énergie de lundi matin", right: "Énergie de samedi soir" },
  { left: "Romantique comme un ticket de caisse", right: "Romantique comme un film de Noël" },
  { left: "Truc qu'on assume", right: "Truc qu'on cache à ses potes" },
  { left: "Sage comme une image", right: "Coquin(e) assumé(e)" },
  { left: "Ça se pardonne", right: "On en reparlera dans 10 ans" },
  { left: "Vibe camping", right: "Vibe palace" },
];

// -- Types ------------------------------------------------
interface WavePlayer {
  id: string;
  name: string;
  score: number;
  isPsychic: boolean;
  guess: number | null;
}

type GamePhase = "waiting" | "intro" | "clue" | "guessing" | "reveal" | "game-over";

// Mélange uniforme (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ==========================================================
export class LongueurOndeGame extends BaseGame {
  gamePlayers: Map<string, WavePlayer> = new Map();
  phase: GamePhase = "waiting";
  round = 0;
  totalRounds = 0;
  psychicQueue: string[] = [];
  psychicId: string | null = null;
  spectrum: Spectrum | null = null;
  usedSpectrums: Set<number> = new Set();
  target = 50;
  clue: string | null = null;
  roundPoints: Record<string, number> = {};
  timeLeft = 0;
  timer: ReturnType<typeof setInterval> | null = null;
  phaseTimeout: ReturnType<typeof setTimeout> | null = null;
  endTimer: ReturnType<typeof setTimeout> | null = null;

  start() {
    this.started = true;
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(() => this.beginGame(), START_DELAY);
  }

  beginGame() {
    this.gamePlayers.clear();
    for (const [id, player] of this.players) {
      this.gamePlayers.set(id, { id, name: player.name, score: 0, isPsychic: false, guess: null });
    }
    const ids = Array.from(this.gamePlayers.keys());
    this.psychicQueue = shuffle(ids);
    this.totalRounds = ids.length; // chacun est Médium une fois
    this.round = 0;
    this.usedSpectrums.clear();
    this.startRound();
  }

  startRound() {
    this.round++;
    this.phase = "intro";
    this.clue = null;
    this.roundPoints = {};
    // Médium du tour : on saute les joueurs partis
    const n = this.psychicQueue.length;
    this.psychicId = this.psychicQueue[(this.round - 1) % n];
    for (let k = 0; k < n; k++) {
      const cand = this.psychicQueue[(this.round - 1 + k) % n];
      if (this.players.has(cand)) {
        this.psychicId = cand;
        break;
      }
    }

    for (const p of this.gamePlayers.values()) {
      p.guess = null;
      p.isPsychic = p.id === this.psychicId;
    }

    if (this.usedSpectrums.size >= SPECTRUMS.length) this.usedSpectrums.clear();
    let idx = Math.floor(Math.random() * SPECTRUMS.length);
    while (this.usedSpectrums.has(idx)) idx = Math.floor(Math.random() * SPECTRUMS.length);
    this.usedSpectrums.add(idx);
    this.spectrum = SPECTRUMS[idx];

    this.target = 8 + Math.floor(Math.random() * 85); // 8..92

    this.broadcastPersonalizedState();

    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(() => {
      this.phase = "clue";
      this.timeLeft = CLUE_TIME;
      this.broadcastPersonalizedState();
      this.startTimer();
    }, INTRO_TIME);
  }

  startGuessing() {
    this.stopTimer();
    this.phase = "guessing";
    this.timeLeft = GUESS_TIME;
    this.broadcastPersonalizedState();
    this.startTimer();
  }

  resolve() {
    this.stopTimer();
    const pts: Record<string, number> = {};
    for (const p of this.gamePlayers.values()) pts[p.id] = 0;

    const guessers = Array.from(this.gamePlayers.values()).filter((p) => !p.isPsychic);
    let sum = 0;
    let count = 0;
    for (const g of guessers) {
      if (g.guess == null) continue;
      const d = Math.abs(g.guess - this.target);
      const p = distancePoints(d);
      pts[g.id] += p;
      sum += p;
      count++;
    }
    // Le Médium gagne la moyenne (arrondie) des points de l'équipe
    if (this.psychicId) {
      pts[this.psychicId] = count > 0 ? Math.round(sum / count) : 0;
    }

    this.roundPoints = pts;
    for (const p of this.gamePlayers.values()) p.score += pts[p.id] ?? 0;

    this.phase = "reveal";
    this.broadcastPersonalizedState();

    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    this.phaseTimeout = setTimeout(() => {
      if (this.round >= this.totalRounds) this.endWave();
      else this.startRound();
    }, REVEAL_TIME);
  }

  endWave() {
    this.stopTimer();
    this.phase = "game-over";
    const players = Array.from(this.gamePlayers.values()).sort((a, b) => b.score - a.score);
    // Ex-aequo : même score = même rang
    const rankings: GameRanking[] = players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      rank: players.findIndex((q) => q.score === p.score) + 1,
      score: p.score,
    }));
    this.broadcastPersonalizedState();
    if (this.endTimer) clearTimeout(this.endTimer);
    this.endTimer = setTimeout(() => {
      this.endTimer = null;
      this.endGame(rankings);
    }, 500);
  }

  // -- Messages --------------------------------------------
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const sp = this.findPlayerByConnection(sender.id);
    if (!sp) return;
    const gp = this.gamePlayers.get(sp.id);
    if (!gp) return;

    if (action === "submit-clue" && this.phase === "clue") {
      if (gp.id !== this.psychicId) return;
      const clue = String(payload.clue ?? "").trim();
      if (!clue) return;
      // Un indice composé uniquement de chiffres donnerait directement la cible
      if (!/\p{L}/u.test(clue)) {
        this.sendTo(sender.id, {
          type: "game-update",
          payload: { clueError: "Indice refusé : pas de chiffres seuls, donne un mot ou un exemple !" },
        });
        return;
      }
      this.clue = clue.slice(0, 60);
      this.startGuessing();
      return;
    }

    if (action === "submit-guess" && this.phase === "guessing") {
      if (gp.isPsychic) return;
      let g = Number(payload.guess);
      if (Number.isNaN(g)) return;
      g = Math.max(0, Math.min(100, Math.round(g)));
      gp.guess = g;
      if (!this.checkAllGuessed()) this.broadcastPersonalizedState();
      return;
    }
  }

  /** Devineurs encore connectés (les absents ne bloquent pas la manche). */
  activeGuessers(): WavePlayer[] {
    return Array.from(this.gamePlayers.values()).filter(
      (p) => !p.isPsychic && this.players.has(p.id) && !this.isBot(p.id)
    );
  }

  /** Résout si tous les devineurs présents ont validé. */
  checkAllGuessed(): boolean {
    if (this.phase !== "guessing") return false;
    const active = this.activeGuessers();
    if (active.length === 0 || active.every((p) => p.guess != null)) {
      this.resolve();
      return true;
    }
    return false;
  }

  // Départ d'un joueur : on n'attend plus personne.
  removePlayer(connectionId: string) {
    const removed = super.removePlayer(connectionId);
    if (!removed || !this.started || this.gamePlayers.size === 0) return removed;
    if (removed.id === this.psychicId && (this.phase === "intro" || this.phase === "clue")) {
      // Le Médium est parti avant de donner son indice : on passe à la manche suivante
      this.stopTimer();
      if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
      if (this.round >= this.totalRounds) this.endWave();
      else this.startRound();
      return removed;
    }
    if (this.phase === "guessing" && this.checkAllGuessed()) return removed;
    this.broadcastPersonalizedState();
    return removed;
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({ type: "game-update", payload: { timeLeft: this.timeLeft } });
      if (this.timeLeft <= 0) {
        if (this.phase === "clue") {
          this.clue = this.clue ?? "(pas d'indice)";
          this.startGuessing();
        } else if (this.phase === "guessing") {
          this.resolve();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  // -- State -----------------------------------------------
  broadcastPersonalizedState() {
    for (const [pid, player] of this.players) {
      this.sendTo(player.connectionId, { type: "game-state", payload: this.getStateForPlayer(pid) });
    }
  }

  getStateForPlayer(pid: string): Record<string, unknown> {
    const state = this.buildPublicState();
    const me = this.gamePlayers.get(pid);
    const amPsychic = pid === this.psychicId;
    state.amPsychic = amPsychic;
    state.myGuess = me?.guess ?? null;
    // Arrivé après le lancement : spectateur (ses choix sont ignorés)
    state.isSpectator = this.gamePlayers.size > 0 && !me;
    state.clueError = null;
    // Le medium voit la cible pendant clue/guessing ; les autres jamais avant le reveal
    const isReveal = this.phase === "reveal" || this.phase === "game-over";
    state.myTarget = amPsychic && (this.phase === "clue" || this.phase === "guessing") ? this.target : isReveal ? this.target : null;
    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const psychic = this.psychicId ? this.gamePlayers.get(this.psychicId) : null;
    const isReveal = this.phase === "reveal" || this.phase === "game-over";

    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.totalRounds,
      timeLeft: this.timeLeft,
      psychicId: this.psychicId,
      psychicName: psychic?.name ?? null,
      spectrum: this.spectrum,
      clue: this.phase === "guessing" || isReveal ? this.clue : null,
      target: isReveal ? this.target : null,
      guesses: isReveal
        ? Object.fromEntries(
            Array.from(this.gamePlayers.values())
              .filter((p) => !p.isPsychic && p.guess != null)
              .map((p) => [p.id, p.guess])
          )
        : null,
      roundPoints: isReveal ? this.roundPoints : null,
      players: Array.from(this.gamePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isPsychic: p.isPsychic,
        hasGuessed: p.guess != null,
        present: this.players.has(p.id),
      })),
    };
  }

  getState(): Record<string, unknown> {
    return this.buildPublicState();
  }

  cleanup() {
    this.stopTimer();
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
    if (this.endTimer) clearTimeout(this.endTimer);
  }
}
