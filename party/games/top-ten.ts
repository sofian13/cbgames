import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Config -----------------------------------------------
const INTRO_TIME = 3200;
const ORDER_TIME = 75000; // garde-fou : on résout même si quelqu'un ne valide pas
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
  { theme: "Un endroit où tu ferais l'amour", low: "Dans ton lit, tranquille", high: "En public, avec le risque de se faire prendre" },
  { theme: "Un message coquin à envoyer à ton crush", low: "« Tu me manques... »", high: "Un truc carrément explicite" },
  { theme: "Une tenue pour une soirée", low: "Jean - t-shirt classique", high: "Quasi rien, tout est suggéré" },
  { theme: "Un fantasme à avouer à voix haute", low: "Un câlin sous la couette", high: "Le truc que t'oserais jamais dire normalement" },
  { theme: "Ton niveau de dignité un samedi à 4h du mat", low: "Impeccable, je rentre en taxi", high: "Je fais des câlins aux videurs" },
  { theme: "Un truc qui t'excite", low: "Un regard appuyé", high: "Quelque chose de carrément chaud" },
  { theme: "Une chose à faire pour un date parfait", low: "Dîner aux chandelles", high: "On saute l'étape dîner direct" },
  { theme: "Un endroit pour un premier baiser", low: "Devant sa porte, timidement", high: "Sur la piste, devant tout le monde" },
  { theme: "Le degré d'audace d'un sexto", low: "Un emoji cœur", high: "Photo et description détaillée" },
  { theme: "Une chose qu'on pourrait te demander dans une chambre", low: "Un massage du dos", high: "Un truc franchement osé" },
  { theme: "Ce que tu fais quand tu perds tout contrôle en soirée", low: "Je deviens très câlin", high: "Je fais un truc dont j'aurai honte demain" },
  { theme: "Le niveau d'un strip-tease", low: "J'enlève ma veste", high: "Je garde plus rien du tout" },
  { theme: "Un gage pour le perdant de la soirée", low: "Faire la vaisselle de tout le monde", high: "Un gage interdit aux mineurs" },
  { theme: "Une partie du corps à embrasser", low: "La joue", high: "Un endroit très intime" },
  { theme: "Un secret de chambre à coucher", low: "Je dors avec une peluche", high: "Le kink que personne ne connaît" },
  { theme: "Ce que tu cherches sur une appli de rencontre", low: "Une vraie histoire d'amour", high: "Un plan d'un soir, ce soir" },
  { theme: "Le niveau d'un gage de soirée", low: "Imiter un animal", high: "Embrasser la personne à ta gauche" },
  { theme: "Une position", low: "Classique, face à face", high: "Acrobatique, faut être souple" },
  { theme: "Un lieu insolite pour le faire", low: "Le canapé du salon", high: "Les toilettes d'une boîte de nuit" },
  { theme: "Ce que tu postes sur les réseaux", low: "Un coucher de soleil", high: "Une photo qui fait monter la température" },
  { theme: "Un compliment à faire à un inconnu", low: "« T'as un joli sourire »", high: "Une phrase très directe et osée" },
  { theme: "Le niveau de jalousie en couple", low: "Je m'en fiche un peu", high: "Je fouille son téléphone en cachette" },
  { theme: "Une chose à faire les yeux bandés", low: "Deviner un aliment au goût", high: "Quelque chose de bien plus coquin" },
  { theme: "Un truc à tester en couple", low: "Un resto romantique", high: "Une nuit sans aucune limite" },
  { theme: "Ce que tu réponds à « on monte chez moi ? »", low: "« Il se fait tard, une autre fois »", high: "« J'attendais que ça depuis le début »" },
  { theme: "Le niveau d'un suçon", low: "À peine visible", high: "Impossible à cacher au boulot" },
  { theme: "Une activité de couple un dimanche", low: "Brunch et série", high: "On sort pas du lit de la journée" },
  { theme: "Un endroit pour une photo sexy", low: "Devant le miroir, habillé", high: "Sous la douche, sans filtre" },
  { theme: "Ce qui te fait craquer chez quelqu'un", low: "Son humour", high: "Un détail très physique et précis" },
  { theme: "Le niveau d'un date sur une appli de rencontre qui dérape", low: "On s'est juste fait la bise", high: "On a fini la nuit ensemble" },
  { theme: "Une phrase à murmurer à l'oreille", low: "« T'es vraiment mignon(ne) »", high: "Un truc qui ferait rougir n'importe qui" },
  { theme: "Le degré d'une danse en boîte", low: "Je bouge gentiment", high: "Collé-serré très rapproché" },
  { theme: "Un objet du quotidien détourné au lit", low: "Une cravate", high: "Un truc auquel personne ne pense" },
  { theme: "Ce que tu fais le matin après une nuit chaude", low: "Petit déj en amoureux", high: "Je file avant qu'il/elle se réveille" },
  { theme: "Le niveau d'un jeu de rôles", low: "On se fait des surnoms", high: "Costumes et scénario complet" },
  { theme: "Une chose à faire dans le noir", low: "Se tenir la main", high: "Tout sauf dormir" },
  { theme: "Un endroit pour flirter", low: "Au bar, en discutant", high: "Dans l'ascenseur, entre deux étages" },
  { theme: "Le niveau d'un texto à 3h du matin", low: "« Tu dors ? »", high: "« Viens, je suis seul(e) »" },
  { theme: "Ce que tu révèles lors d'un strip-poker", low: "Une chaussette", high: "Tout, j'ai trop perdu" },
  { theme: "Une audace en vacances", low: "Bronzer sur la plage", high: "Se baigner sans maillot la nuit" },
  // -- Malaise / vie quotidienne (drôle) ------------------
  { theme: "Tu ouvres un tiroir dans la chambre de tes parents, y a quoi ?", low: "De vieilles photos de vacances", high: "Un truc que t'aurais préféré ne jamais voir" },
  { theme: "Tu envoies un message dans le groupe famille, c'est quoi ?", low: "« Bon dimanche à tous »", high: "Un message très privé destiné à quelqu'un d'autre" },
  { theme: "Le dernier truc dans ton historique de recherche", low: "La météo de demain", high: "Quelque chose à effacer d'urgence" },
  { theme: "Ce que ta mère trouverait en fouillant ton téléphone", low: "Des memes débiles", high: "Une conversation qu'elle doit jamais lire" },
  { theme: "La dernière photo de ta galerie", low: "Un plat au resto", high: "Une photo carrément intime" },
  { theme: "Ce que tu caches quand quelqu'un entre dans ta chambre", low: "Le bazar par terre", high: "Un objet super gênant" },
  { theme: "Le niveau de honte de ta photo de profil de 2014", low: "Une coupe de cheveux discutable", high: "À supprimer immédiatement" },
  { theme: "Le dernier mensonge que t'as raconté", low: "« J'arrive dans 5 minutes »", high: "Un gros mensonge bien assumé" },
  { theme: "Ce que tu fais quand t'es seul(e) à la maison", low: "Je chante sous la douche", high: "Un truc que j'avouerai jamais" },
  { theme: "Ce que ton ex pourrait balancer sur toi", low: "« Il/elle ronflait un peu »", high: "Un secret bien embarrassant" },
  { theme: "Le contenu de tes notes de téléphone", low: "Une liste de courses", high: "Des trucs que personne doit lire" },
  { theme: "Ce que tu dirais à ton boss s'il y avait zéro conséquence", low: "« Faut qu'on parle salaire »", high: "Tout ce que je pense vraiment de lui" },
  { theme: "Le truc le plus louche que t'as commandé à 2h du mat", low: "Une pizza", high: "Un truc franchement honteux" },
  { theme: "Ce que tu mettrais jamais sur ton CV", low: "Mon vrai niveau d'anglais", high: "La vraie raison de mon dernier départ" },
  { theme: "Le truc le plus gênant dans ton panier de linge sale", low: "Des chaussettes trouées", high: "Quelque chose d'inavouable" },
  { theme: "Ce que tu googles en pleine nuit, paniqué(e)", low: "« Pourquoi mon chat me fixe »", high: "Un symptôme flippant que t'as inventé" },
  { theme: "Le dernier truc pour lequel t'as pleuré", low: "Une pub trop mignonne", high: "Un truc complètement ridicule" },
  { theme: "Ce que t'as déjà fait croire à un date", low: "« J'adore la rando »", high: "Un mensonge énorme sur ma vie" },
  // -- Très osé +18 (gros niveau) -------------------------
  { theme: "Le nombre de partenaires que t'as eu", low: "Très peu, je compte sur une main", high: "J'ai arrêté de compter" },
  { theme: "Le crush le plus inattendu que t'as eu", low: "Un(e) collègue un peu mignon(ne)", high: "Quelqu'un que je devrais vraiment pas regarder" },
  { theme: "L'endroit le plus risqué où t'as eu un moment intime", low: "Chez mes parents, porte fermée", high: "Un endroit où on aurait pu finir au poste" },
  { theme: "Le compliment le plus sale à dire pendant l'acte", low: "« T'es beau/belle »", high: "Une phrase carrément crue" },
  { theme: "Ton tabou sexuel le plus profond", low: "Un truc bizarre mais avouable", high: "Le secret que personne saura jamais" },
  { theme: "Le plan le plus louche que t'as eu sur une appli", low: "Un date qui parlait que de son chat", high: "Une rencontre vraiment chelou" },
  { theme: "Ce que tu regardes en cachette", low: "Une série niaise", high: "Quelque chose de bien embarrassant" },
  { theme: "Une histoire dont t'as honte mais que tu referais", low: "Un texto regretté à 3h du mat", high: "Une nuit que personne doit savoir" },
  { theme: "Le pire endroit où t'as fini la nuit", low: "Sur le canapé d'un(e) inconnu(e)", high: "Un lieu carrément interdit" },
  { theme: "Le sexto le plus chaud que t'as déjà envoyé", low: "Un emoji bien placé", high: "Une description très détaillée et imagée" },
  { theme: "Le partenaire le plus surprenant que t'as eu", low: "Un(e) ami(e) d'ami(e)", high: "Quelqu'un qu'on aurait jamais imaginé" },
  { theme: "Une chose interdite que t'as déjà faite en cachette", low: "Manger le dessert des autres", high: "Quelque chose que j'avouerai jamais" },
  { theme: "Le délire d'un soir qui a vraiment dérapé", low: "On a fini en after", high: "Une nuit complètement folle, vrai chaos" },
  { theme: "Ce que t'as déjà fait dans des toilettes publiques", low: "Refaire mon maquillage", high: "Un truc carrément pas réglementaire" },
  { theme: "La chose la plus folle que t'as faite par amour (ou par désir)", low: "Traverser la ville à pied", high: "Un truc que je pensais pas pouvoir faire" },
];

// -- Pack Culture pop & Classements -----------------------
// Même principe : 1 = le plus faible/nul -> 10 = le plus fort/ouf.
// Chacun nomme un truc connu qui colle a son numero, puis on classe.
const CULTURE_THEMES: Theme[] = [
  { theme: "Un perso de Dragon Ball, par puissance", low: "Yamcha", high: "Zeno, le roi de tout" },
  { theme: "Un Pokémon, par puissance", low: "Magicarpe", high: "Arceus" },
  { theme: "Un perso de One Piece, par prime", low: "Un pirate sans prime", high: "Un Yonko (Empereur)" },
  { theme: "Un perso de Naruto, par force", low: "Un genin de l'académie", high: "Kaguya" },
  { theme: "Un super-héros Marvel, par puissance", low: "Œil-de-Faucon", high: "Thanos" },
  { theme: "Une ville de France, de la plus stylée à la plus pourrie", low: "Une ville de rêve", high: "Le trou paumé le plus pourri" },
  { theme: "Un joueur de foot, par talent", low: "Un amateur du dimanche", high: "Messi" },
  { theme: "Un rappeur FR, par notoriété", low: "Un rappeur inconnu", high: "Une légende du game" },
  { theme: "Une marque de voiture, du low-cost au luxe", low: "Une Dacia", high: "Une Ferrari" },
  { theme: "Un animal, du plus inoffensif au plus dangereux", low: "Un lapin", high: "Un grand requin blanc" },
  { theme: "Un fast-food, du pire au meilleur", low: "Le pire endroit", high: "Ton resto préféré" },
  { theme: "Un réseau social, par temps perdu dessus", low: "LinkedIn", high: "TikTok" },
  { theme: "Une matière à l'école, de la plus cool à la plus chiante", low: "La plus cool", high: "La plus soûlante" },
  { theme: "Un métier, par salaire", low: "Stagiaire non payé", high: "PDG du CAC 40" },
  { theme: "Une console de jeu, par puissance", low: "Une vieille Game Boy", high: "Une PS5 / PC de gamer" },
  { theme: "Un plat, du plus light au plus lourd", low: "Une salade verte", high: "Une raclette" },
  { theme: "Une destination de vacances, du nul au paradis", low: "Camping sous la pluie", high: "Les Maldives" },
  { theme: "Un streamer/youtubeur FR, par notoriété", low: "Un inconnu à 10 vues", high: "Squeezie" },
  { theme: "Un film de super-héros, du flop au chef-d'œuvre", low: "Le gros navet", high: "Le chef-d'œuvre culte" },
  { theme: "Un perso de Disney, du plus gentil au plus méchant", low: "Le gentil tout mignon", high: "Le grand méchant" },
  { theme: "Un moyen de transport, du plus lent au plus rapide", low: "Une trottinette", high: "Un avion de chasse" },
  { theme: "Un méchant de film ou d'anime, du soft au terrifiant", low: "Un sbire de base", high: "Le boss final ultime" },
  { theme: "Un téléphone, du plus pourri au plus haut de gamme", low: "Un vieux Nokia 3310", high: "Le dernier iPhone" },
  { theme: "Une soirée, du flop au légendaire", low: "Seul devant la TV", high: "La soirée dont on parle encore" },
];

type Pack = "adult" | "culture";

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
export class TopTenGame extends BaseGame {
  gamePlayers: Map<string, TopTenPlayer> = new Map();
  phase: GamePhase = "waiting";
  round = 0;
  totalRounds = 0;
  numberRange = 10; // echelle des numeros secrets (1..numberRange)
  selectedPack: Pack = "adult"; // banque de themes choisie au setup
  currentTheme: Theme | null = null;
  usedThemes: Set<number> = new Set();
  numberedOrder: string[] = []; // ordre melange propose a tous pour classer
  submissions: Record<string, string[]> = {}; // classement valide par chaque joueur
  roundResults: Record<string, RoundResult> = {};
  timer: ReturnType<typeof setTimeout> | null = null;
  endTimer: ReturnType<typeof setTimeout> | null = null;
  orderDeadline: number | null = null; // timestamp de fin de la phase de classement

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
    const pool = shuffle(Array.from({ length: range }, (_, i) => i + 1));
    everyone.forEach((p, i) => {
      p.number = pool[i];
    });

    this.numberedOrder = shuffle(everyone.map((p) => p.id));

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
    const pool = this.selectedPack === "culture" ? CULTURE_THEMES : THEMES;
    if (this.usedThemes.size >= pool.length) this.usedThemes.clear();
    let idx = Math.floor(Math.random() * pool.length);
    while (this.usedThemes.has(idx)) idx = Math.floor(Math.random() * pool.length);
    this.usedThemes.add(idx);
    this.currentTheme = pool[idx];
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
    this.orderDeadline = null;

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

    // Ex-aequo : même score = même rang (1, 2, 2, 4…)
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
    if (action === "set-pack" && this.phase === "config") {
      const p = payload.pack;
      if (p === "adult" || p === "culture") {
        this.selectedPack = p;
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
      this.orderDeadline = Date.now() + ORDER_TIME;
      this.timer = setTimeout(() => this.resolveRound(), ORDER_TIME);
      this.broadcastPersonalizedState();
      return;
    }

    if (action === "submit-order" && this.phase === "ordering") {
      // Seuls les joueurs de la partie (présents au lancement) classent.
      if (!this.gamePlayers.has(senderPlayer.id)) return;
      const order = payload.order as string[];
      if (!Array.isArray(order)) return;
      // Valide : doit contenir exactement les joueurs proposes
      const expected = new Set(this.numberedOrder);
      if (order.length !== expected.size || !order.every((id) => expected.has(id))) return;
      this.submissions[senderPlayer.id] = order;
      // Tout le monde (encore présent) a validé ? on résout tout de suite.
      if (!this.checkAllSubmitted()) this.broadcastPersonalizedState();
      return;
    }
  }

  /** Joueurs de la partie encore connectés (les bots et les absents ne bloquent pas). */
  activeRankers(): string[] {
    return Array.from(this.gamePlayers.keys()).filter((id) => this.players.has(id) && !this.isBot(id));
  }

  /** Résout la manche si tous les joueurs présents ont validé. Renvoie true si résolu. */
  checkAllSubmitted(): boolean {
    if (this.phase !== "ordering") return false;
    const active = this.activeRankers();
    if (active.length === 0) return false;
    if (active.every((id) => this.submissions[id] != null)) {
      this.resolveRound();
      return true;
    }
    return false;
  }

  // Un joueur qui part ne bloque plus la manche.
  removePlayer(connectionId: string) {
    const removed = super.removePlayer(connectionId);
    if (removed && this.started && this.phase === "ordering") {
      if (!this.checkAllSubmitted()) this.broadcastPersonalizedState();
    }
    return removed;
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
    state.isSpectator = this.gamePlayers.size > 0 && !this.gamePlayers.has(pid);
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
      pack: this.selectedPack,
      theme: this.currentTheme,
      // Liste melangee a classer (numeros caches)
      numberedOrder: this.numberedOrder,
      // Suivi des validations pendant le classement
      submittedCount: Object.keys(this.submissions).length,
      // Nombre de joueurs attendus (présents) pour le classement
      activeCount: this.activeRankers().length,
      // Temps restant (ms) au moment de l'envoi : le client recalcule son propre compte à rebours
      orderRemainingMs:
        this.phase === "ordering" && this.orderDeadline != null ? Math.max(0, this.orderDeadline - Date.now()) : null,
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
    if (this.endTimer) clearTimeout(this.endTimer);
    this.endTimer = null;
  }
}
