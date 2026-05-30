import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Config -----------------------------------------------
const INTRO_TIME = 3200;
const ORDER_TIME = 75000; // garde-fou : on resout meme si quelqu'un ne valide pas
const REVEAL_TIME = 11000;
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
  // -- Malaise / vie quotidienne (drole) ------------------
  { theme: "Tu ouvres un tiroir dans la chambre de tes parents, ya quoi ?", low: "De vieilles photos de vacances", high: "Un truc que t'aurais préféré ne jamais voir" },
  { theme: "Tu envoies un message dans le groupe famille, c'est quoi ?", low: "« Bon dimanche à tous »", high: "Un message tres prive destine a quelqu'un d'autre" },
  { theme: "Le dernier truc dans ton historique de recherche", low: "La meteo de demain", high: "Quelque chose a effacer d'urgence" },
  { theme: "Ce que ta mere trouverait en fouillant ton telephone", low: "Des memes debiles", high: "Une conversation qu'elle doit jamais lire" },
  { theme: "La derniere photo de ta galerie", low: "Un plat au resto", high: "Une photo carrement intime" },
  { theme: "Ce que tu caches quand quelqu'un entre dans ta chambre", low: "Le bazar par terre", high: "Un objet super genant" },
  { theme: "Le niveau de honte de ta photo de profil de 2014", low: "Une coupe de cheveux discutable", high: "A supprimer immediatement" },
  { theme: "Le dernier mensonge que t'as raconte", low: "« J'arrive dans 5 minutes »", high: "Un gros mensonge bien assume" },
  { theme: "Ce que tu fais quand t'es seul(e) a la maison", low: "Je chante sous la douche", high: "Un truc que j'avouerai jamais" },
  { theme: "Ce que ton ex pourrait balancer sur toi", low: "« Il/elle ronflait un peu »", high: "Un secret bien embarrassant" },
  { theme: "Le contenu de tes notes de telephone", low: "Une liste de courses", high: "Des trucs que personne doit lire" },
  { theme: "Ce que tu dirais a ton boss s'il y avait zero consequence", low: "« Faut qu'on parle salaire »", high: "Tout ce que je pense vraiment de lui" },
  { theme: "Le truc le plus louche que t'as commande a 2h du mat", low: "Une pizza", high: "Un truc franchement honteux" },
  { theme: "Ce que tu mettrais jamais sur ton CV", low: "Mon vrai niveau d'anglais", high: "La vraie raison de mon dernier depart" },
  { theme: "Le truc le plus genant dans ton panier de linge sale", low: "Des chaussettes trouees", high: "Quelque chose d'inavouable" },
  { theme: "Ce que tu googles en pleine nuit, panique", low: "« Pourquoi mon chat me fixe »", high: "Un symptome flippant que t'as invente" },
  { theme: "Le dernier truc pour lequel t'as pleure", low: "Une pub trop mignonne", high: "Un truc completement ridicule" },
  { theme: "Ce que t'as deja fait croire a un date", low: "« J'adore la rando »", high: "Un mensonge enorme sur ma vie" },
  // -- HARDCORE +18 (gros niveau, deconseille en famille) -
  { theme: "Le nombre de partenaires que t'as eu", low: "Tres peu, je compte sur une main", high: "J'ai arrete de compter" },
  { theme: "La plus grosse difference d'age avec qui t'as couche", low: "1 ou 2 ans", high: "Plus de 15 ans" },
  { theme: "Le truc le plus chelou que t'as deja insere quelque part", low: "Rien que de classique", high: "Un objet pas du tout fait pour ca" },
  { theme: "Le compliment le plus sale a dire pendant l'acte", low: "« T'es beau/belle »", high: "Une phrase carrement crue" },
  { theme: "Ton tabou sexuel le plus profond", low: "Un truc bizarre mais avouable", high: "Le secret que personne saura jamais" },
  { theme: "Le plan le plus louche que t'as eu sur une appli", low: "Un date qui parlait que de son chat", high: "Une rencontre vraiment chelou" },
  { theme: "Ce que tu regardes en cachette", low: "Une serie niaise", high: "Quelque chose de bien embarrassant" },
  { theme: "Une histoire dont t'as honte mais que tu referais", low: "Un texto envoye bourre", high: "Une nuit que personne doit savoir" },
  { theme: "Le pire endroit ou t'as fini la nuit", low: "Sur le canape d'un(e) inconnu(e)", high: "Un lieu carrement interdit" },
  { theme: "Le sexto le plus chaud que t'as deja envoye", low: "Un emoji bien place", high: "Une description tres detaillee et imagee" },
  { theme: "Le partenaire le plus surprenant que t'as eu", low: "Un(e) ami(e) d'ami(e)", high: "Quelqu'un qu'on aurait jamais imagine" },
  { theme: "Une chose interdite que t'as deja faite en cachette", low: "Voler un truc dans un magasin", high: "Quelque chose dont je n'avouerai jamais" },
  { theme: "Le delire d'un soir qui a vraiment derape", low: "On a fini en after", high: "Une nuit completement folle, vrai chaos" },
  { theme: "Ce que t'as deja fait dans des toilettes publiques", low: "Refaire mon maquillage", high: "Un truc carrement pas reglementaire" },
  { theme: "Ce que t'as deja fait sous l'effet d'un truc", low: "Rire trop fort en soiree", high: "Un truc que je pensais pas pouvoir faire" },
];

// -- Player state -----------------------------------------
interface TopTenPlayer {
  id: string;
  name: string;
  score: number;
  number: number | null; // numero secret 1-10
}

interface RoundResult {
  correct: number;
  total: number;
  perfect: boolean;
  points: number;
}

type GamePhase = "waiting" | "config" | "intro" | "theme" | "answering" | "ordering" | "reveal" | "game-over";

const ALLOWED_RANGES = [10, 25, 50];

// ==========================================================
export class TopTenGame extends BaseGame {
  gamePlayers: Map<string, TopTenPlayer> = new Map();
  phase: GamePhase = "waiting";
  round = 0;
  totalRounds = 0;
  numberRange = 10; // echelle des numeros secrets (1..numberRange)
  currentTheme: Theme | null = null;
  usedThemes: Set<number> = new Set();
  numberedOrder: string[] = []; // ordre melange propose a tous pour classer
  submissions: Record<string, string[]> = {}; // classement valide par chaque joueur
  roundResults: Record<string, RoundResult> = {};
  timer: ReturnType<typeof setTimeout> | null = null;

  start() {
    // Anti double-start. On passe en phase "config" pour laisser le groupe choisir
    // le score cible (10/25/50/100) avant de demarrer reellement la partie.
    this.started = true;
    this.phase = "config";
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.broadcastPersonalizedState();
    }, START_DELAY);
  }

  beginGame() {
    this.gamePlayers.clear();
    for (const [id, player] of this.players) {
      this.gamePlayers.set(id, {
        id,
        name: player.name,
        score: 0,
        number: null,
      });
    }

    const ids = Array.from(this.gamePlayers.keys());
    this.totalRounds = Math.min(8, Math.max(4, ids.length));
    this.round = 0;
    this.usedThemes.clear();

    this.startRound();
  }

  // -- Phase: Intro ----------------------------------------
  startRound() {
    this.round++;
    this.phase = "intro";
    this.submissions = {};
    this.roundResults = {};

    this.pickTheme();

    // Assign distinct numbers from 1..numberRange (echelle choisie au setup)
    const everyone = Array.from(this.gamePlayers.values());
    const range = Math.max(this.numberRange, everyone.length); // sécurise
    const pool = Array.from({ length: range }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    everyone.forEach((p, i) => {
      p.number = pool[i];
    });

    this.numberedOrder = everyone.map((p) => p.id).sort(() => Math.random() - 0.5);

    this.broadcastPersonalizedState();

    // Splash rapide -> on montre la phrase (avec bouton "changer") AVANT les numeros.
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.phase = "theme";
      this.broadcastPersonalizedState();
    }, INTRO_TIME);
  }

  // Choisit un theme jamais vu cette partie (recycle si banque epuisee)
  pickTheme() {
    if (this.usedThemes.size >= THEMES.length) this.usedThemes.clear();
    let idx = Math.floor(Math.random() * THEMES.length);
    while (this.usedThemes.has(idx)) idx = Math.floor(Math.random() * THEMES.length);
    this.usedThemes.add(idx);
    this.currentTheme = THEMES[idx];
  }

  // -- Scoring & Reveal ------------------------------------
  scoreGuess(guess: string[]): { correct: number; total: number; perfect: boolean } {
    const total = Math.max(0, guess.length - 1);
    let correct = 0;
    for (let i = 0; i < guess.length - 1; i++) {
      const a = this.gamePlayers.get(guess[i]);
      const b = this.gamePlayers.get(guess[i + 1]);
      if (a?.number != null && b?.number != null && a.number < b.number) correct++;
    }
    return { correct, total, perfect: total > 0 && correct === total };
  }

  resolveRound() {
    this.clearTimer();

    this.roundResults = {};
    for (const p of this.gamePlayers.values()) {
      // si un joueur n'a pas valide, on prend l'ordre melange affiche par defaut
      const guess = this.submissions[p.id] ?? this.numberedOrder;
      const { correct, total, perfect } = this.scoreGuess(guess);
      const points = correct * 2 + (perfect ? 5 : 0);
      p.score += points;
      this.roundResults[p.id] = { correct, total, perfect, points };
    }

    this.phase = "reveal";
    this.broadcastPersonalizedState();

    this.clearTimer();
    this.timer = setTimeout(() => {
      if (this.round >= this.totalRounds) this.endTopTen();
      else this.startRound();
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

    // Phase "config" : n'importe qui choisit l'echelle (1..N) et lance la partie.
    if (action === "set-range" && this.phase === "config") {
      const r = Number(payload.range);
      if (ALLOWED_RANGES.includes(r)) {
        this.numberRange = r;
        this.broadcastPersonalizedState();
      }
      return;
    }
    if (action === "begin-game" && this.phase === "config") {
      this.beginGame();
      return;
    }

    // Phase "theme" : n'importe qui peut changer la phrase ou la valider.
    if (action === "change-theme" && this.phase === "theme") {
      this.pickTheme();
      this.broadcastPersonalizedState();
      return;
    }
    if (action === "start-answering" && this.phase === "theme") {
      this.phase = "answering";
      this.broadcastPersonalizedState();
      return;
    }

    // N'importe quel joueur peut lancer la phase de classement une fois tout le monde a parle.
    if (action === "start-ordering" && this.phase === "answering") {
      this.phase = "ordering";
      this.clearTimer();
      this.timer = setTimeout(() => this.resolveRound(), ORDER_TIME);
      this.broadcastPersonalizedState();
      return;
    }

    if (action === "submit-order" && this.phase === "ordering") {
      const order = payload.order as string[];
      if (!Array.isArray(order)) return;
      // Valide : doit contenir exactement les joueurs proposes
      const expected = new Set(this.numberedOrder);
      if (order.length !== expected.size || !order.every((id) => expected.has(id))) return;
      this.submissions[senderPlayer.id] = order;
      // Tout le monde a valide ? on resout tout de suite.
      if (Object.keys(this.submissions).length >= this.gamePlayers.size) {
        this.resolveRound();
      } else {
        this.broadcastPersonalizedState();
      }
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
    state.myNumber = me?.number ?? null;
    state.iSubmitted = this.submissions[pid] != null;
    state.myGuess = this.submissions[pid] ?? null;
    return state;
  }

  buildPublicState(): Record<string, unknown> {
    const isReveal = this.phase === "reveal" || this.phase === "game-over";

    // Vrai classement (soft -> hard) de tous les joueurs
    const trueOrder = Array.from(this.gamePlayers.values())
      .filter((p) => p.number != null)
      .sort((a, b) => a.number! - b.number!)
      .map((p) => p.id);

    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.totalRounds,
      numberRange: this.numberRange,
      theme: this.currentTheme,
      // Liste melangee a classer (numeros caches)
      numberedOrder: this.numberedOrder,
      // Suivi des validations pendant le classement
      submittedCount: Object.keys(this.submissions).length,
      submittedIds: this.phase === "ordering" ? Object.keys(this.submissions) : null,
      // Pendant le reveal seulement
      trueOrder: isReveal ? trueOrder : null,
      revealNumbers: isReveal
        ? Object.fromEntries(
            Array.from(this.gamePlayers.values())
              .filter((p) => p.number != null)
              .map((p) => [p.id, p.number])
          )
        : null,
      roundResults: isReveal ? this.roundResults : null,
      players: Array.from(this.gamePlayers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
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
