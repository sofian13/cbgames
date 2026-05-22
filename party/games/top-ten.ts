import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Config -----------------------------------------------
const INTRO_TIME = 3200;
const REVEAL_TIME = 9000;
const START_DELAY = 1300; // laisse tout le monde se connecter avant de figer les joueurs

// -- Themes (18+) -----------------------------------------
// Chaque carte : un theme, et l'echelle 1 (le plus soft) -> 10 (le plus hard).
interface Theme {
  theme: string;
  low: string;
  high: string;
}

const THEMES: Theme[] = [
  { theme: "Un endroit ou tu ferais l'amour", low: "Dans ton lit, tranquille", high: "En public, avec le risque de se faire prendre" },
  { theme: "Un message coquin a envoyer a ton crush", low: "« Tu me manques... »", high: "Un truc carrement explicite" },
  { theme: "Une tenue pour une soiree", low: "Jean - t-shirt classique", high: "Quasi rien, tout est suggere" },
  { theme: "Un fantasme a avouer a voix haute", low: "Un calin sous la couette", high: "Le truc que t'oserais jamais dire normalement" },
  { theme: "Niveau d'alcool un samedi soir", low: "Un verre de vin, ca suffit", high: "Black-out total, plus aucun souvenir" },
  { theme: "Un truc qui t'excite", low: "Un regard appuye", high: "Quelque chose de carrement chaud" },
  { theme: "Une chose a faire pour un date parfait", low: "Diner aux chandelles", high: "On saute l'etape diner direct" },
  { theme: "Un endroit pour un premier baiser", low: "Devant sa porte, timidement", high: "Sur la piste, devant tout le monde" },
  { theme: "Le degre d'audace d'un sexto", low: "Un emoji coeur", high: "Photo et description detaillee" },
  { theme: "Une chose qu'on pourrait te demander dans une chambre", low: "Un massage du dos", high: "Un truc franchement osé" },
  { theme: "Ce que tu fais quand t'es bourre", low: "Je deviens tres calin", high: "Je fais un truc dont j'aurai honte demain" },
  { theme: "Le niveau d'un strip-tease", low: "J'enleve ma veste", high: "Je garde plus rien du tout" },
  { theme: "Une regle de jeu a boire", low: "Cul-sec quand tu perds", high: "Le perdant fait un gage interdit aux mineurs" },
  { theme: "Une partie du corps a embrasser", low: "La joue", high: "Un endroit tres intime" },
  { theme: "Un secret de chambre a coucher", low: "Je dors avec une peluche", high: "Le kink que personne ne connait" },
  { theme: "Ce que tu cherches sur une appli de rencontre", low: "Une vraie histoire d'amour", high: "Un plan d'un soir, ce soir" },
  { theme: "Le niveau d'un gage de soiree", low: "Imiter un animal", high: "Embrasser la personne a ta gauche" },
  { theme: "Une position", low: "Classique, face a face", high: "Acrobatique, faut etre souple" },
  { theme: "Un lieu insolite pour le faire", low: "Le canape du salon", high: "Les toilettes d'une boite de nuit" },
  { theme: "Ce que tu postes sur les reseaux", low: "Un coucher de soleil", high: "Une photo qui fait monter la temperature" },
  { theme: "Un compliment a faire a un inconnu", low: "« T'as un joli sourire »", high: "Une phrase tres directe et osee" },
  { theme: "Le niveau de jalousie en couple", low: "Je m'en fiche un peu", high: "Je fouille son telephone en cachette" },
  { theme: "Une chose a faire les yeux bandes", low: "Deviner un aliment au gout", high: "Quelque chose de bien plus coquin" },
  { theme: "Un truc a tester en couple", low: "Un resto romantique", high: "Un sextoy ou un accessoire" },
  { theme: "Ce que tu reponds a « on monte chez moi ? »", low: "« Il se fait tard, une autre fois »", high: "« J'attendais que ca depuis le debut »" },
  { theme: "Le niveau d'un suceon", low: "A peine visible", high: "Impossible a cacher au boulot" },
  { theme: "Une activite de couple un dimanche", low: "Brunch et serie", high: "On sort pas du lit de la journee" },
  { theme: "Un endroit pour une photo sexy", low: "Devant le miroir, habille", high: "Sous la douche, sans filtre" },
  { theme: "Ce qui te fait craquer chez quelqu'un", low: "Son humour", high: "Un detail tres physique et precis" },
  { theme: "Le niveau d'un date Tinder qui derape", low: "On s'est juste fait la bise", high: "On a fini la nuit ensemble" },
  { theme: "Une phrase a murmurer a l'oreille", low: "« T'es vraiment mignon(ne) »", high: "Un truc qui ferait rougir n'importe qui" },
  { theme: "Le degre d'une danse en boite", low: "Je bouge gentiment", high: "Collé-serré tres rapproché" },
  { theme: "Un objet du quotidien detourne au lit", low: "Une cravate", high: "Un truc auquel personne ne pense" },
  { theme: "Ce que tu fais le matin apres une nuit chaude", low: "Petit dej en amoureux", high: "Je file avant qu'il/elle se reveille" },
  { theme: "Le niveau d'un jeu de roles", low: "On se fait des surnoms", high: "Costumes et scenario complet" },
  { theme: "Une chose a faire dans le noir", low: "Se tenir la main", high: "Tout sauf dormir" },
  { theme: "Un endroit pour flirter", low: "Au bar, en discutant", high: "Dans l'ascenseur, entre deux etages" },
  { theme: "Le niveau d'un texto a 3h du matin", low: "« Tu dors ? »", high: "« Viens, je suis seul(e) »" },
  { theme: "Ce que tu reveles lors d'un strip-poker", low: "Une chaussette", high: "Tout, j'ai trop perdu" },
  { theme: "Une audace en vacances", low: "Bronzer sur la plage", high: "Se baigner sans maillot la nuit" },
];

// -- Player state -----------------------------------------
interface TopTenPlayer {
  id: string;
  name: string;
  score: number;
  number: number | null; // numero secret 1-10 (null si capitaine ce tour)
  isCaptain: boolean;
}

type GamePhase = "waiting" | "intro" | "answering" | "ordering" | "reveal" | "game-over";

// ==========================================================
export class TopTenGame extends BaseGame {
  gamePlayers: Map<string, TopTenPlayer> = new Map();
  phase: GamePhase = "waiting";
  round = 0;
  totalRounds = 0;
  captainQueue: string[] = [];
  currentCaptainId: string | null = null;
  currentTheme: Theme | null = null;
  usedThemes: Set<number> = new Set();
  numberedOrder: string[] = []; // ordre melange affiche au capitaine
  captainGuess: string[] = []; // classement valide par le capitaine (soft -> hard)
  correctPairs = 0;
  totalPairs = 0;
  perfect = false;
  roundPoints: Record<string, number> = {};
  timer: ReturnType<typeof setTimeout> | null = null;

  start() {
    // Marque demarre tout de suite (anti double-start), mais attend un court instant
    // pour que tous les joueurs du lobby finissent de se connecter avant de figer la liste.
    this.started = true;
    this.clearTimer();
    this.timer = setTimeout(() => this.beginGame(), START_DELAY);
  }

  beginGame() {
    this.gamePlayers.clear();
    for (const [id, player] of this.players) {
      this.gamePlayers.set(id, {
        id,
        name: player.name,
        score: 0,
        number: null,
        isCaptain: false,
      });
    }

    const ids = Array.from(this.gamePlayers.keys());
    this.captainQueue = [...ids].sort(() => Math.random() - 0.5);
    this.totalRounds = ids.length; // chaque joueur est capitaine une fois
    this.round = 0;
    this.usedThemes.clear();

    this.startRound();
  }

  // -- Phase: Intro ----------------------------------------
  startRound() {
    this.round++;
    this.phase = "intro";
    this.captainGuess = [];
    this.correctPairs = 0;
    this.totalPairs = 0;
    this.perfect = false;
    this.roundPoints = {};

    this.currentCaptainId = this.captainQueue[(this.round - 1) % this.captainQueue.length];

    // Reset numbers
    for (const p of this.gamePlayers.values()) {
      p.number = null;
      p.isCaptain = p.id === this.currentCaptainId;
    }

    // Pick a theme (no repeat until bank exhausted)
    if (this.usedThemes.size >= THEMES.length) this.usedThemes.clear();
    let idx = Math.floor(Math.random() * THEMES.length);
    while (this.usedThemes.has(idx)) idx = Math.floor(Math.random() * THEMES.length);
    this.usedThemes.add(idx);
    this.currentTheme = THEMES[idx];

    // Assign distinct numbers 1-10 to non-captain players
    const numbered = Array.from(this.gamePlayers.values()).filter((p) => !p.isCaptain);
    const pool = Array.from({ length: 10 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    numbered.forEach((p, i) => {
      p.number = pool[i];
    });

    this.numberedOrder = numbered.map((p) => p.id).sort(() => Math.random() - 0.5);

    this.broadcastPersonalizedState();

    this.clearTimer();
    this.timer = setTimeout(() => {
      this.phase = "answering";
      this.broadcastPersonalizedState();
    }, INTRO_TIME);
  }

  // -- Scoring & Reveal ------------------------------------
  resolveOrder(guess: string[]) {
    this.clearTimer();
    this.captainGuess = guess;

    this.totalPairs = Math.max(0, guess.length - 1);
    this.correctPairs = 0;
    for (let i = 0; i < guess.length - 1; i++) {
      const a = this.gamePlayers.get(guess[i]);
      const b = this.gamePlayers.get(guess[i + 1]);
      if (a?.number != null && b?.number != null && a.number < b.number) {
        this.correctPairs++;
      }
    }
    this.perfect = this.totalPairs > 0 && this.correctPairs === this.totalPairs;

    // Points : collaboratif. Tout le monde gagne sur les bonnes paires,
    // le capitaine touche un bonus pour avoir fait le classement.
    this.roundPoints = {};
    const base = this.correctPairs * 2;
    const perfectBonus = this.perfect ? 5 : 0;
    for (const p of this.gamePlayers.values()) {
      let pts = base + perfectBonus;
      if (p.id === this.currentCaptainId) {
        pts += this.correctPairs + (this.perfect ? 3 : 0);
      }
      p.score += pts;
      this.roundPoints[p.id] = pts;
    }

    this.phase = "reveal";
    this.broadcastPersonalizedState();

    this.clearTimer();
    this.timer = setTimeout(() => {
      if (this.round >= this.totalRounds) {
        this.endTopTen();
      } else {
        this.startRound();
      }
    }, REVEAL_TIME);
  }

  // -- End Game --------------------------------------------
  endTopTen() {
    this.clearTimer();
    this.phase = "game-over";

    const players = Array.from(this.gamePlayers.values());
    players.sort((a, b) => b.score - a.score);

    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));

    this.broadcastPersonalizedState();
    setTimeout(() => this.endGame(rankings), 500);
  }

  // -- Message Handler -------------------------------------
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const senderPlayer = this.findPlayerByConnection(sender.id);
    if (!senderPlayer) return;

    // Seul le capitaine du tour agit
    if (senderPlayer.id !== this.currentCaptainId) return;

    if (action === "start-ordering" && this.phase === "answering") {
      this.phase = "ordering";
      this.broadcastPersonalizedState();
      return;
    }

    if (action === "submit-order" && this.phase === "ordering") {
      const order = payload.order as string[];
      if (!Array.isArray(order)) return;
      // Valide : doit contenir exactement les joueurs numerotes
      const expected = new Set(this.numberedOrder);
      if (order.length !== expected.size || !order.every((id) => expected.has(id))) return;
      this.resolveOrder(order);
      return;
    }
  }

  // -- Helpers ---------------------------------------------
  findPlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // -- State Broadcasting ----------------------------------
  broadcastPersonalizedState() {
    for (const [pid, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(pid),
      });
    }
  }

  getStateForPlayer(pid: string): Record<string, unknown> {
    const state = this.buildPublicState();
    const me = this.gamePlayers.get(pid);
    state.amCaptain = pid === this.currentCaptainId;
    state.myNumber = me?.number ?? null;
    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const captain = this.currentCaptainId ? this.gamePlayers.get(this.currentCaptainId) : null;
    const isReveal = this.phase === "reveal" || this.phase === "game-over";

    // Vrai classement (soft -> hard) des joueurs numerotes
    const trueOrder = this.numberedOrder
      .map((id) => this.gamePlayers.get(id))
      .filter((p): p is TopTenPlayer => !!p && p.number != null)
      .sort((a, b) => (a.number! - b.number!))
      .map((p) => p.id);

    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.totalRounds,
      captainId: this.currentCaptainId,
      captainName: captain?.name ?? null,
      theme: this.currentTheme,
      // Liste melangee a classer (numeros caches)
      numberedOrder: this.numberedOrder,
      // Pendant le reveal seulement
      captainGuess: isReveal ? this.captainGuess : null,
      trueOrder: isReveal ? trueOrder : null,
      revealNumbers: isReveal
        ? Object.fromEntries(
            Array.from(this.gamePlayers.values())
              .filter((p) => p.number != null)
              .map((p) => [p.id, p.number])
          )
        : null,
      correctPairs: isReveal ? this.correctPairs : null,
      totalPairs: isReveal ? this.totalPairs : null,
      perfect: isReveal ? this.perfect : null,
      roundPoints: isReveal ? this.roundPoints : null,
      players: Array.from(this.gamePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isCaptain: p.isCaptain,
      })),
    };
  }

  getState(): Record<string, unknown> {
    return this.buildPublicState();
  }

  cleanup() {
    this.clearTimer();
  }
}
