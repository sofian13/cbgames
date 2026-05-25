import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ===========================================================
//  UNDERCOVER — Server logic
//  Civils vs Undercover (vs Mr. White optionnel)
//  Hébergé sur PartyKit, hérite de BaseGame.
// ===========================================================

// -- Config ------------------------------------------------
const WORD_REVEAL_TIME  = 6_000;   // ms — temps de mémorisation auto
const CLUE_TIME         = 25;      // sec par joueur pendant la phase d'indices
const VOTE_TIME         = 30;      // sec total de vote
const VOTE_RESULT_TIME  = 4_500;   // ms pour le tampon "éliminé"
const GUESS_TIME        = 20;      // sec pour Mr. White (deviner le mot civil)
const NEXT_ROUND_TIME   = 3_000;   // ms entre les manches

// -- Word bank (paires civil / undercover) ------------------
const WORD_PAIRS: [string, string][] = [
  // Bouffe
  ["Pizza", "Pâtes"], ["Hamburger", "Sandwich"], ["Sushi", "Maki"],
  ["Croissant", "Brioche"], ["Crêpe", "Galette"], ["Kebab", "Tacos"],
  ["Raclette", "Fondue"], ["Tiramisu", "Mousse au chocolat"], ["Café", "Thé"],
  ["Bière", "Vin"], ["Vodka", "Rhum"], ["Coca", "Pepsi"],
  // Lieux
  ["Plage", "Piscine"], ["Montagne", "Colline"], ["Forêt", "Jungle"],
  ["Hôpital", "Pharmacie"], ["Cinéma", "Théâtre"], ["Bibliothèque", "Librairie"],
  ["Aéroport", "Gare"], ["Restaurant", "Cafétéria"], ["Hôtel", "Auberge"],
  // Sports
  ["Football", "Rugby"], ["Tennis", "Badminton"], ["Ski", "Snowboard"],
  ["Boxe", "Karaté"], ["Natation", "Plongée"], ["Cyclisme", "Course à pied"],
  // Animaux
  ["Chien", "Chat"], ["Lion", "Tigre"], ["Aigle", "Faucon"],
  ["Dauphin", "Requin"], ["Vache", "Chèvre"], ["Cheval", "Âne"],
  ["Lapin", "Hamster"],
  // Films / pop culture
  ["Batman", "Superman"], ["Star Wars", "Star Trek"], ["Naruto", "One Piece"],
  ["Harry Potter", "Le Seigneur des Anneaux"], ["Titanic", "Avatar"],
  ["Mario", "Sonic"], ["Pokemon", "Digimon"],
  // Objets
  ["Voiture", "Moto"], ["Train", "Bus"], ["Avion", "Hélicoptère"],
  ["Téléphone", "Tablette"], ["Ordinateur", "Console"], ["Livre", "Magazine"],
  ["Stylo", "Crayon"], ["Lunettes", "Loupe"], ["Montre", "Bracelet"],
  // Nature / temps
  ["Soleil", "Lune"], ["Pluie", "Neige"], ["Été", "Hiver"],
  ["Printemps", "Automne"], ["Mer", "Lac"], ["Volcan", "Geyser"],
  // Evenements
  ["Mariage", "Anniversaire"], ["Noël", "Pâques"], ["Halloween", "Carnaval"],
  ["Festival", "Concert"], ["Enterrement", "Baptême"],
  // Métiers
  ["Médecin", "Infirmier"], ["Boulanger", "Pâtissier"], ["Avocat", "Juge"],
  ["Pompier", "Policier"], ["Pilote", "Astronaute"], ["Coiffeur", "Barbier"],
  ["Professeur", "Directeur"], ["Plombier", "Électricien"],
];

// -- Roles -------------------------------------------------
type Role = "civil" | "undercover" | "mrwhite";

interface UndercoverPlayer {
  id: string;
  name: string;
  score: number;
  role: Role;
  word: string | null;            // null pour Mr. White
  isEliminated: boolean;
  hasClue: boolean;               // a parlé pour la manche en cours
  clue: string | null;            // texte d'indice (multi)
  votedFor: string | null;
  eliminatedRound: number | null;
}

interface ClueEntry {
  round: number;
  playerId: string;
  playerName: string;
  clue: string;
}

type Phase =
  | "waiting"
  | "word-reveal"
  | "clue"
  | "vote"
  | "vote-result"
  | "mrwhite-guess"
  | "round-end"
  | "game-over";

type EndReason = "civils-win" | "undercover-wins" | "mrwhite-wins" | null;

// ===========================================================
export class UndercoverGame extends BaseGame {
  // -- Game-wide config (réglable par l'hôte avant `start`) --
  config = {
    undercoverCount: 1,            // recalculé au start si non touché
    includeMrWhite: false,
    autoBalance: true,             // recalcul auto selon le nb de joueurs
  };

  // -- State -------------------------------------------------
  gamePlayers = new Map<string, UndercoverPlayer>();
  phase: Phase = "waiting";

  civilWord = "";
  undercoverWord = "";

  round = 0;
  clueOrder: string[] = [];        // ids dans l'ordre de parole
  currentClueIdx = 0;
  timeLeft = 0;
  timer: ReturnType<typeof setInterval> | null = null;

  votes = new Map<string, string>(); // voter -> target
  eliminatedThisRound: string | null = null;
  eliminatedRole: Role | null = null;

  clueHistory: ClueEntry[] = [];

  lastGuess: string | null = null;
  lastGuessCorrect: boolean | null = null;
  endReason: EndReason = null;

  // ---------------------------------------------------------
  //  Lifecycle
  // ---------------------------------------------------------
  start() {
    this.started = true;
    this.round = 0;
    this.clueHistory = [];
    this.endReason = null;
    this.lastGuess = null;
    this.lastGuessCorrect = null;

    // Auto-balance si activé
    if (this.config.autoBalance) {
      const n = this.players.size;
      if (n <= 4)      { this.config.undercoverCount = 1; this.config.includeMrWhite = false; }
      else if (n <= 6) { this.config.undercoverCount = 1; this.config.includeMrWhite = n >= 5; }
      else             { this.config.undercoverCount = 2; this.config.includeMrWhite = true; }
    }

    // Init des joueurs
    this.gamePlayers.clear();
    for (const [id, p] of this.players) {
      this.gamePlayers.set(id, {
        id, name: p.name,
        score: 0, role: "civil", word: null,
        isEliminated: false, hasClue: false, clue: null,
        votedFor: null, eliminatedRound: null,
      });
    }

    // Choix d'une paire de mots
    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    // Aléatoirement, on inverse quel mot est "civil"
    if (Math.random() < 0.5) {
      this.civilWord = pair[0]; this.undercoverWord = pair[1];
    } else {
      this.civilWord = pair[1]; this.undercoverWord = pair[0];
    }

    // Distribution des rôles
    const ids = Array.from(this.gamePlayers.keys());
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    let i = 0;
    for (let u = 0; u < this.config.undercoverCount && i < shuffled.length; u++, i++) {
      const p = this.gamePlayers.get(shuffled[i]);
      if (p) { p.role = "undercover"; p.word = this.undercoverWord; }
    }
    if (this.config.includeMrWhite && i < shuffled.length) {
      const p = this.gamePlayers.get(shuffled[i]);
      if (p) { p.role = "mrwhite"; p.word = null; }
      i++;
    }
    for (; i < shuffled.length; i++) {
      const p = this.gamePlayers.get(shuffled[i]);
      if (p) { p.role = "civil"; p.word = this.civilWord; }
    }

    this.startWordReveal();
  }

  // ---------------------------------------------------------
  //  Phase 1 : Reveal du mot
  // ---------------------------------------------------------
  startWordReveal() {
    this.round++;
    this.phase = "word-reveal";
    this.eliminatedThisRound = null;
    this.eliminatedRole = null;
    this.lastGuess = null;
    this.lastGuessCorrect = null;
    this.votes.clear();

    for (const p of this.gamePlayers.values()) {
      if (!p.isEliminated) {
        p.hasClue = false;
        p.clue = null;
        p.votedFor = null;
      }
    }

    this.broadcastPersonalizedState();
    setTimeout(() => {
      if (this.phase === "word-reveal") this.startCluePhase();
    }, WORD_REVEAL_TIME);
  }

  // ---------------------------------------------------------
  //  Phase 2 : Tour de parole / indices
  // ---------------------------------------------------------
  startCluePhase() {
    this.phase = "clue";
    // L'ordre de parole tourne à chaque manche : random shuffle des vivants
    this.clueOrder = this.getAlive()
      .map((p) => p.id)
      .sort(() => Math.random() - 0.5);
    this.currentClueIdx = 0;
    this.timeLeft = CLUE_TIME;
    this.broadcastPersonalizedState();
    this.startTimer();
  }

  advanceClue() {
    this.currentClueIdx++;
    while (
      this.currentClueIdx < this.clueOrder.length &&
      this.gamePlayers.get(this.clueOrder[this.currentClueIdx])?.isEliminated
    ) this.currentClueIdx++;

    if (this.currentClueIdx >= this.clueOrder.length) {
      this.startVote();
    } else {
      this.timeLeft = CLUE_TIME;
      this.broadcastPersonalizedState();
      this.startTimer();
    }
  }

  // ---------------------------------------------------------
  //  Phase 3 : Vote
  // ---------------------------------------------------------
  startVote() {
    this.stopTimer();
    this.phase = "vote";
    this.timeLeft = VOTE_TIME;
    this.votes.clear();
    for (const p of this.gamePlayers.values()) {
      if (!p.isEliminated) p.votedFor = null;
    }
    this.broadcastPersonalizedState();
    this.startTimer();
  }

  resolveVotes() {
    this.stopTimer();

    // Tally
    const counts = new Map<string, number>();
    for (const tid of this.votes.values()) counts.set(tid, (counts.get(tid) ?? 0) + 1);

    let max = 0;
    const top: string[] = [];
    for (const [pid, n] of counts) {
      if (n > max) { max = n; top.length = 0; top.push(pid); }
      else if (n === max) top.push(pid);
    }

    // Pas de vote ou égalité parfaite → tirage au sort
    if (top.length === 0) {
      this.eliminatedThisRound = null;
      this.eliminatedRole = null;
      this.phase = "vote-result";
      this.broadcastPersonalizedState();
      setTimeout(() => this.afterEliminate(null), VOTE_RESULT_TIME);
      return;
    }

    const eliminatedId = top[Math.floor(Math.random() * top.length)];
    const target = this.gamePlayers.get(eliminatedId);
    if (!target) return;

    target.isEliminated = true;
    target.eliminatedRound = this.round;
    this.eliminatedThisRound = eliminatedId;
    this.eliminatedRole = target.role;

    // Récompenses pour avoir voté contre un undercover/mrwhite
    if (target.role !== "civil") {
      for (const [voterId, tId] of this.votes) {
        if (tId === eliminatedId) {
          const v = this.gamePlayers.get(voterId);
          if (v && v.role === "civil") v.score += 2;
        }
      }
    }

    this.phase = "vote-result";
    this.broadcastPersonalizedState();

    // Mr. White éliminé → il a une chance de deviner le mot civil
    if (target.role === "mrwhite") {
      setTimeout(() => this.startMrWhiteGuess(eliminatedId), VOTE_RESULT_TIME);
      return;
    }

    setTimeout(() => this.afterEliminate(eliminatedId), VOTE_RESULT_TIME);
  }

  // ---------------------------------------------------------
  //  Phase 4 : Mr. White devine
  // ---------------------------------------------------------
  startMrWhiteGuess(mrWhiteId: string) {
    this.phase = "mrwhite-guess";
    this.timeLeft = GUESS_TIME;
    this.eliminatedThisRound = mrWhiteId;
    this.lastGuess = null;
    this.lastGuessCorrect = null;
    this.broadcastPersonalizedState();
    this.startTimer();
  }

  resolveMrWhiteGuess(guess: string | null) {
    this.stopTimer();
    const norm = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    this.lastGuess = guess;
    this.lastGuessCorrect = !!guess && norm(guess) === norm(this.civilWord);

    if (this.lastGuessCorrect) {
      // Mr. White gagne seul
      const mw = this.eliminatedThisRound ? this.gamePlayers.get(this.eliminatedThisRound) : null;
      if (mw) mw.score += 5;
      this.endGameUC("mrwhite-wins");
      return;
    }
    // Sinon : on continue normalement
    this.afterEliminate(this.eliminatedThisRound);
  }

  // ---------------------------------------------------------
  //  Check victoire / suite
  // ---------------------------------------------------------
  afterEliminate(_lastEliminatedId: string | null) {
    const alive = this.getAlive();
    const aliveUC = alive.filter((p) => p.role === "undercover");
    const aliveMW = alive.filter((p) => p.role === "mrwhite");
    const aliveCv = alive.filter((p) => p.role === "civil");

    // Tous les imposteurs out → civils gagnent
    if (aliveUC.length === 0 && aliveMW.length === 0) {
      for (const c of aliveCv) c.score += 3;
      this.endGameUC("civils-win");
      return;
    }

    // Les imposteurs ≥ civils → undercover gagne
    if (aliveUC.length + aliveMW.length >= aliveCv.length) {
      for (const u of [...aliveUC, ...aliveMW]) u.score += 5;
      this.endGameUC("undercover-wins");
      return;
    }

    // Sinon : nouveau tour
    // Petit bonus de survie aux civils
    for (const c of aliveCv) c.score += 1;
    setTimeout(() => this.startWordReveal(), NEXT_ROUND_TIME);
  }

  // ---------------------------------------------------------
  //  Fin de partie
  // ---------------------------------------------------------
  endGameUC(reason: Exclude<EndReason, null>) {
    this.stopTimer();
    this.phase = "game-over";
    this.endReason = reason;

    const players = Array.from(this.gamePlayers.values());
    players.sort((a, b) => b.score - a.score);
    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id, playerName: p.name, rank: i + 1, score: p.score,
    }));

    this.broadcastPersonalizedState();
    setTimeout(() => this.endGame(rankings), 800);
  }

  // ---------------------------------------------------------
  //  Timer
  // ---------------------------------------------------------
  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({ type: "game-update", payload: { timeLeft: this.timeLeft } });
      if (this.timeLeft <= 0) this.onTimerExpired();
    }, 1000);
  }

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  onTimerExpired() {
    this.stopTimer();
    if (this.phase === "clue") {
      const currentId = this.clueOrder[this.currentClueIdx];
      const p = this.gamePlayers.get(currentId);
      if (p && !p.hasClue) {
        p.hasClue = true;
        p.clue = "(temps écoulé)";
        this.clueHistory.push({
          round: this.round, playerId: p.id, playerName: p.name, clue: "(temps écoulé)",
        });
      }
      this.advanceClue();
    } else if (this.phase === "vote") {
      this.resolveVotes();
    } else if (this.phase === "mrwhite-guess") {
      this.resolveMrWhiteGuess(null);
    }
  }

  // ---------------------------------------------------------
  //  Messages côté client
  // ---------------------------------------------------------
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const sp = this.findPlayerByConnection(sender.id);
    if (!sp) return;
    const gp = this.gamePlayers.get(sp.id);

    // -- Avant que la partie ne commence : config par l'hôte
    if (action === "configure" && !this.started) {
      const newCfg = payload.config as Partial<typeof this.config> | undefined;
      if (newCfg) {
        if (typeof newCfg.undercoverCount === "number") {
          this.config.undercoverCount = Math.max(1, Math.min(3, newCfg.undercoverCount));
          this.config.autoBalance = false;
        }
        if (typeof newCfg.includeMrWhite === "boolean") {
          this.config.includeMrWhite = newCfg.includeMrWhite;
          this.config.autoBalance = false;
        }
        if (typeof newCfg.autoBalance === "boolean") {
          this.config.autoBalance = newCfg.autoBalance;
        }
        this.broadcastPersonalizedState();
      }
      return;
    }

    // -- Confirmation "j'ai vu mon mot" (sert juste à logguer côté UI)
    if (action === "ack-word" && this.phase === "word-reveal") {
      // no-op serveur, l'auto-timer enchaîne
      return;
    }

    // -- Démarrage manuel par l'hôte (le routeur game.ts désactive l'auto-start)
    if (action === "start-game" && !this.started) {
      if (this.players.size < 3) return;
      this.start();
      return;
    }

    if (!gp || gp.isEliminated) return;

    // -- Soumission d'indice
    if (action === "clue" && this.phase === "clue") {
      const currentId = this.clueOrder[this.currentClueIdx];
      if (sp.id !== currentId) return;
      const clue = ((payload.clue as string) ?? "").trim();
      if (!clue) return;

      // Anti-triche basique : on refuse les mots qui contiennent exactement
      // le mot du rôle (insensible aux accents)
      const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (gp.word && norm(clue).includes(norm(gp.word))) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Tu ne peux pas dire ton mot directement." },
        });
        return;
      }

      gp.hasClue = true;
      gp.clue = clue;
      this.clueHistory.push({
        round: this.round, playerId: gp.id, playerName: gp.name, clue,
      });
      this.stopTimer();
      this.advanceClue();
      return;
    }

    // -- Vote
    if (action === "vote" && this.phase === "vote") {
      const target = payload.targetId as string;
      if (!target || target === sp.id) return;
      const t = this.gamePlayers.get(target);
      if (!t || t.isEliminated) return;
      gp.votedFor = target;
      this.votes.set(sp.id, target);
      this.broadcastPersonalizedState();

      const alive = this.getAlive();
      if (alive.every((p) => p.votedFor !== null)) {
        this.resolveVotes();
      }
      return;
    }

    // -- Mr. White devine
    if (action === "mrwhite-guess" && this.phase === "mrwhite-guess") {
      if (sp.id !== this.eliminatedThisRound) return;
      const guess = ((payload.guess as string) ?? "").trim();
      if (!guess) return;
      this.resolveMrWhiteGuess(guess);
      return;
    }
  }

  // ---------------------------------------------------------
  //  Re-play sans recréer la salle
  // ---------------------------------------------------------
  restartIfFinished(): boolean {
    if (this.phase !== "game-over") return false;
    this.start();
    return true;
  }

  // ---------------------------------------------------------
  //  Helpers
  // ---------------------------------------------------------
  getAlive(): UndercoverPlayer[] {
    return Array.from(this.gamePlayers.values()).filter((p) => !p.isEliminated);
  }

  findPlayerByConnection(connectionId: string) {
    for (const [, p] of this.players) {
      if (p.connectionId === connectionId) return p;
    }
    return null;
  }

  // ---------------------------------------------------------
  //  State broadcast (personnalisé par joueur)
  // ---------------------------------------------------------
  broadcastPersonalizedState() {
    for (const [, p] of this.players) {
      this.sendTo(p.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(p.id),
      });
    }
  }

  getStateForPlayer(pid: string): Record<string, unknown> {
    const base = this.buildPublicState();
    const me = this.gamePlayers.get(pid);
    if (me) {
      base.myRole = me.role;
      base.myWord = me.word;
      base.myId = me.id;
    }
    return base;
  }

  buildPublicState(): Record<string, unknown> {
    const revealAll = this.phase === "game-over";
    const revealEliminated = this.phase === "vote-result" || this.phase === "mrwhite-guess" || this.phase === "round-end" || this.phase === "game-over";

    let voteTally: Record<string, number> | null = null;
    if (this.phase === "vote-result" || this.phase === "mrwhite-guess" || this.phase === "round-end" || this.phase === "game-over") {
      voteTally = {};
      for (const t of this.votes.values()) voteTally[t] = (voteTally[t] ?? 0) + 1;
    }

    const currentSpeakerId =
      this.phase === "clue" && this.currentClueIdx < this.clueOrder.length
        ? this.clueOrder[this.currentClueIdx]
        : null;

    return {
      phase: this.phase,
      round: this.round,
      timeLeft: this.timeLeft,
      config: this.config,
      currentSpeakerId,
      clueOrder: this.clueOrder,
      currentClueIdx: this.currentClueIdx,
      eliminatedThisRound: this.eliminatedThisRound,
      eliminatedRole: this.eliminatedRole,
      voteTally,
      clueHistory: this.clueHistory,
      civilWord: revealAll ? this.civilWord : null,
      undercoverWord: revealAll ? this.undercoverWord : null,
      lastGuess: this.lastGuess,
      lastGuessCorrect: this.lastGuessCorrect,
      endReason: this.endReason,
      players: Array.from(this.gamePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isEliminated: p.isEliminated,
        hasClue: p.hasClue,
        hasVoted: p.votedFor !== null,
        clue: p.clue,
        eliminatedRound: p.eliminatedRound,
        // Le rôle n'est dévoilé qu'au moment où ça compte
        role: revealAll
          ? p.role
          : revealEliminated && p.id === this.eliminatedThisRound
          ? p.role
          : null,
        // Le mot n'est révélé à la fin que pour les undercover/mrwhite éliminés
        word: revealAll
          ? p.word
          : revealEliminated && p.id === this.eliminatedThisRound
          ? p.word
          : null,
      })),
    };
  }

  getState(): Record<string, unknown> {
    // Vue "publique" sans personnalisation (fallback)
    return this.buildPublicState();
  }

  cleanup() {
    this.stopTimer();
    this.clearBotTimeouts();
  }
}
