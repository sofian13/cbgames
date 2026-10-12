import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- Banque de mots « Mots Espions » ------------------------------------
// Mots français courants (avec accents), en privilégiant les mots à double
// sens (avocat, glace, carte, pêche…) qui font tout l'intérêt du jeu.
const RAW_WORDS: string[] = [
  "avocat", "glace", "carte", "pêche", "souris", "mousse", "botte",
  "bouchon", "lettre", "mine", "palais", "pièce", "poste", "page", "pompe",
  "ressort", "rayon", "rose", "sol", "temps", "tour", "vol", "verre",
  "livre", "mémoire", "mode", "moule", "note", "orange", "panneau", "pile",
  "plan", "plateau", "pont", "pomme", "pouce", "prise", "queue", "règle",
  "robe", "but", "bureau", "cours", "échelle", "feu", "fil", "fraise",
  "grue", "jumelle", "lame", "langue", "lentille", "lion", "lune", "marche",
  "marque", "membre", "menu", "mineur", "nœud", "ordre", "palme",
  "papillon", "parc", "patron", "perle", "phare", "pied", "piste", "place",
  "planche", "plume", "poêle", "poisson", "police", "canon", "chou", "coq",
  "cœur", "corne", "côte", "coupe", "couronne", "crochet", "croissant",
  "cuisinière", "dé", "diamant", "docteur", "éclair", "écran", "étoile",
  "flèche", "fort", "gorge", "grain", "grille", "guide", "hôtel", "banque",
  "banc", "baleine", "balle", "base", "bâton", "bec", "bille", "blanc",
  "bois", "boîte", "bonnet", "bouche", "boucle", "boule", "bouteille",
  "branche", "bras", "bulle", "cadre", "caisse", "calcul", "canard",
  "capitale", "cartouche", "cellule", "centre", "chaîne", "chaise", "champ",
  "chance", "chapeau", "char", "charge", "chat", "château", "chef",
  "chemin", "chêne", "cheval", "chèvre", "chiffre", "chute", "ciel",
  "cinéma", "cirque", "ciseaux", "clé", "cloche", "club", "col", "colle",
  "collier", "compte", "corde", "corps", "costume", "coton", "couche",
  "coude", "coulisse", "courant", "course", "couteau", "crabe", "crayon",
  "crème", "crête", "croix", "cube", "cuivre", "cygne", "danse", "dauphin",
  "dent", "désert", "diable", "dinosaure", "disque", "doigt", "dragon",
  "drapeau", "eau", "école", "écorce", "écureuil", "éléphant", "enveloppe",
  "épée", "éponge", "espace", "essence", "étage", "fantôme", "fée",
  "fenêtre", "fer", "ferme", "feuille", "figure", "filet", "flamme",
  "fleur", "flûte", "foire", "fond", "fontaine", "forêt", "fourchette",
  "fourmi", "frein", "front", "fusée", "galerie", "gant", "gâteau", "géant",
  "genou", "glacier", "gomme", "goutte", "grenade", "griffe", "guitare",
  "hache", "harpe", "herbe", "hérisson", "hibou", "histoire", "horloge",
  "île", "jardin", "jeu", "jour", "journal", "jungle", "kiwi", "laine",
  "lait", "lampe", "lapin", "laser", "lien", "ligne", "lit", "loup",
  "lumière", "lunettes", "machine", "main", "maison", "manche", "manteau",
  "marteau", "masque", "match", "médaille", "mer", "mercure", "miel",
  "miroir", "momie", "monde", "montagne", "montre", "moteur", "moto",
  "mouton", "mur", "musique", "nain", "navire", "neige", "nez", "nid",
  "noix", "nuage", "nuit", "œil", "œuf", "oie", "oiseau", "ombre", "onde",
  "opéra", "or", "oreille", "os", "ours", "paille", "pain", "panier",
  "papier", "parachute", "parapluie", "passe", "pâte", "patte", "peau",
  "peigne", "pelle", "pendule", "pétrole", "phoque", "piano", "pierre",
  "pilote", "pin", "pingouin", "pinceau", "pirate", "pizza", "plage",
  "planète", "plaque", "plat", "pluie", "pneu", "poche", "poids", "point",
  "poivre", "pôle", "porte", "poule", "poupée", "prince", "princesse",
  "prison", "puce", "pyramide", "quartier", "radar", "raie", "raisin",
  "rampe", "rat", "recette", "reine", "renard", "requin", "réseau",
  "rideau", "rivière", "robinet", "robot", "roche", "roi", "roue",
  "rouleau", "ruban", "ruche", "sable", "sac", "salade", "salle", "sapin",
  "satellite", "sauce", "saut", "savon", "scène", "scie", "seau", "sel",
  "selle", "serpent", "serre", "serveur", "sirène", "ski", "soldat",
  "soleil", "sorcière", "soupe", "sous-marin", "stade", "statue", "stylo",
  "sucre", "table", "tableau", "tache", "taille", "talon", "tambour",
  "tapis", "taupe", "taxi", "télé", "temple", "tennis", "tente", "terre",
  "tête", "théâtre", "thé", "ticket", "tigre", "timbre", "tir", "toile",
  "toit", "tomate", "tonneau", "tortue", "torche", "train", "trait",
  "trésor", "triangle", "trompe", "trompette", "tronc", "trou", "tube",
  "tuyau", "univers", "usine", "vache", "vague", "vaisseau", "valise",
  "vampire", "vapeur", "vase", "veine", "vent", "ver", "veste", "village",
  "violon", "virus", "vis", "voile", "voiture", "volant", "volcan", "zèbre",
  "zéro", "baguette", "bouton", "cadran", "canne", "casque", "chausson",
  "cliché", "compas", "lunette", "manège", "orgue", "palette", "patin",
  "pavé", "pellicule", "pépin", "perche", "pince", "pion", "piquet",
  "platine", "poing", "portable", "puits", "quille", "racine", "raquette",
  "rame", "rasoir", "relief", "remorque", "rocher", "rondelle", "sabot",
  "siège", "signe", "sirop", "souffle", "source", "spectre", "sphinx",
  "tablette", "tampon", "tarte", "terrier", "tige", "tissu", "toast",
  "tonnerre", "torchon", "toupie", "trappe", "trèfle", "tunnel", "vedette",
  "verrou", "vipère", "visage", "vitre", "voie", "volume", "aile",
  "aiguille", "ampoule", "ancre", "ange", "anneau", "araignée", "arbre",
  "arc", "arche", "argent", "armure", "as", "ascenseur", "assiette",
  "atlas", "aube", "autruche", "avion", "bague", "baie", "bain", "balai",
  "balance", "ballon", "bambou", "bande", "barbe", "barrage", "bassin",
  "bateau", "batterie", "bébé", "berger", "bijou", "biscuit", "blé",
  "bocal", "bol", "bonbon", "bougie", "boussole", "brique", "brosse",
  "bûche", "buffet", "cabane", "cactus", "café", "cage", "camion", "camp",
  "canal", "canapé", "cape", "caramel", "carotte", "carrosse", "carton",
  "cave", "ceinture", "cerf", "cerveau", "chameau", "champignon",
  "chandelle", "chapitre", "charbon", "chasse", "chaussette", "chenille",
  "chocolat", "cigogne", "cintre", "citron", "citrouille", "clou", "clown",
  "cochon", "coffre", "colonne", "comète", "concert", "coquillage",
  "coquille", "corbeau", "cordon", "couloir", "couverture", "crâne",
  "crocodile", "cuillère", "cyclone", "détective", "domino", "donjon",
  "douche", "dune", "écharpe", "écho", "élastique", "empire", "encre",
  "épice", "épine", "escalier", "escargot", "éventail", "facteur",
  "falaise", "farine", "fauteuil", "flocon", "foudre", "four", "fourrure",
  "frigo", "fromage", "fumée", "gare", "gaufre", "girafe", "globe",
  "gorille", "grenier", "grenouille", "grotte", "guêpe", "hamac", "hamster",
  "hélicoptère", "héros", "hippopotame", "homard", "igloo", "jambe",
  "kangourou", "koala", "labyrinthe", "lac", "lance", "lanterne", "lasso",
  "légende", "lézard", "licorne", "lime", "loupe", "magicien", "mammouth",
  "marais", "marionnette", "mât", "méduse", "mètre", "micro", "moulin",
  "moustache", "muscle", "nappe", "narval", "ninja", "oasis", "olive",
  "orchestre", "ordinateur", "oreiller", "orteil", "ouragan", "palmier",
  "panda", "pantalon", "paon", "parfum", "pastèque", "pélican", "perroquet",
  "pharaon", "pieuvre", "pigeon", "piment", "pique", "placard", "plongeur",
  "poignée", "pompier", "poussière", "prairie", "puzzle", "radeau", "rail",
  "rhinocéros", "rubis", "sabre", "saphir", "sardine", "saumon",
  "sauterelle", "scorpion", "serrure", "squelette", "tasse", "télescope",
  "tempête", "toboggan", "tornade", "totem", "tracteur", "traîneau",
  "trampoline", "tricot", "trident", "tulipe", "uniforme", "vélo",
  "ventilateur", "vitrail", "yaourt"
];

const WORD_BANK: string[] = Array.from(
  new Set(RAW_WORDS.map(w => w.toLocaleUpperCase("fr-FR")))
);

/** Normalise un mot pour comparer indice / mots de la grille (accents, casse, ligatures). */
function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

/** Formes comparables d'un mot (singulier / pluriel simple). */
function wordForms(w: string): string[] {
  const n = normalizeWord(w);
  const forms = new Set([n]);
  if (n.length > 3 && /[sx]$/.test(n)) forms.add(n.slice(0, -1));
  if (n.length > 4 && n.endsWith("aux")) forms.add(n.slice(0, -3) + "al");
  if (n.length > 3 && n.endsWith("al")) forms.add(n.slice(0, -2) + "aux");
  forms.add(n + "s");
  forms.add(n + "x");
  return Array.from(forms);
}

// -- Card types -------------------------------------------------------
type CardColor = "red" | "blue" | "neutral" | "assassin";

interface Card {
  word: string;
  color: CardColor;     // True color (hidden from operatives)
  revealed: boolean;
}

type Team = "red" | "blue";
type Phase = "team-pick" | "spymaster-turn" | "team-guess" | "game-over";

interface CodeNamesPlayer {
  id: string;
  name: string;
  team: Team | null;
  isSpymaster: boolean;
}

// -- Constants --------------------------------------------------------
const GRID_SIZE = 25;
const CLUE_TIMER = 60; // seconds
const GUESS_TIMER = 90; // seconds

// -- Helper: shuffle array (Fisher-Yates) -----------------------------
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class CodeNamesGame extends BaseGame {
  cnPlayers: Map<string, CodeNamesPlayer> = new Map();
  cards: Card[] = [];
  phase: Phase = "team-pick";
  currentTeam: Team = "red";
  startingTeam: Team = "red";

  // Clue state
  currentClueWord: string | null = null;
  currentClueCount: number = 0;
  guessesRemaining: number = 0;

  // Scores (cards remaining)
  redRemaining: number = 0;
  blueRemaining: number = 0;

  // Timer
  timeLeft: number = 0;
  timerInterval: ReturnType<typeof setInterval> | null = null;

  // Host (first player)
  hostId: string | null = null;

  endTimeout: ReturnType<typeof setTimeout> | null = null;

  // Winner info
  winner: Team | null = null;
  winReason: string | null = null;

  start() {
    // Mots Espions : choix des équipes d'abord, la partie démarre sur action de l'hôte, actual game starts on host action
    this.started = true;

    for (const [id, player] of this.players) {
      this.cnPlayers.set(id, {
        id,
        name: player.name,
        team: null,
        isSpymaster: false,
      });
    }

    if (!this.hostId) {
      this.hostId = Array.from(this.players.keys())[0] ?? null;
    }

    this.phase = "team-pick";
    this.broadcastPersonalizedState();
  }

  // -- Override addPlayer to track host --------------------------------
  override addPlayer(id: string, name: string, conn: Connection) {
    super.addPlayer(id, name, conn);

    if (!this.hostId) {
      this.hostId = id;
    }

    // If game already started, add to cnPlayers
    if (this.started) {
      if (!this.cnPlayers.has(id)) {
        this.cnPlayers.set(id, {
          id,
          name,
          team: null,
          isSpymaster: false,
        });
      }
      // Send personalized state to the new joiner
      const player = this.players.get(id);
      if (player) {
        this.sendTo(player.connectionId, {
          type: "game-state",
          payload: this.getStateForPlayer(id),
        });
      }
    }
  }

  // -- Override removePlayer for disconnection handling -----------------
  override removePlayer(connectionId: string) {
    const removed = super.removePlayer(connectionId);
    if (removed) {
      // Don't remove from cnPlayers during game to preserve state
      // If host leaves, reassign
      if (removed.id === this.hostId) {
        const remaining = Array.from(this.players.keys());
        this.hostId = remaining[0] ?? null;
      }

      // Un Chef espion se déconnecte en cours de partie : on désigne
      // automatiquement un autre membre connecté de son équipe.
      const cnPlayer = this.cnPlayers.get(removed.id);
      if (
        cnPlayer?.isSpymaster &&
        cnPlayer.team &&
        (this.phase === "spymaster-turn" || this.phase === "team-guess")
      ) {
        const team = cnPlayer.team;
        const replacement = Array.from(this.cnPlayers.values()).find(
          p => p.team === team && p.id !== removed.id && this.players.has(p.id)
        );
        cnPlayer.isSpymaster = false;
        if (replacement) {
          replacement.isSpymaster = true;
        } else if (this.phase === "spymaster-turn" && team === this.currentTeam) {
          // Plus personne dans l'équipe pour donner un indice : on passe la main.
          cnPlayer.isSpymaster = true;
          this.switchTurn();
          return removed;
        } else {
          cnPlayer.isSpymaster = true;
        }
      }

      this.broadcastPersonalizedState();
    }
    return removed;
  }

  // -- Generate the board ----------------------------------------------
  generateBoard() {
    // Pick 25 random words
    const words = shuffle(WORD_BANK).slice(0, GRID_SIZE);

    // Determine starting team (random)
    this.startingTeam = Math.random() < 0.5 ? "red" : "blue";
    this.currentTeam = this.startingTeam;

    // Starting team gets 9, other gets 8
    const startingCount = 9;
    const otherCount = 8;
    const neutralCount = 7;
    // assassin = 1 (25 - 9 - 8 - 7 = 1)

    const colors: CardColor[] = [];
    for (let i = 0; i < startingCount; i++) colors.push(this.startingTeam);
    const otherTeam: Team = this.startingTeam === "red" ? "blue" : "red";
    for (let i = 0; i < otherCount; i++) colors.push(otherTeam);
    for (let i = 0; i < neutralCount; i++) colors.push("neutral");
    colors.push("assassin");

    const shuffledColors = shuffle(colors);

    this.cards = words.map((word, i) => ({
      word,
      color: shuffledColors[i],
      revealed: false,
    }));

    this.redRemaining = this.cards.filter(c => c.color === "red").length;
    this.blueRemaining = this.cards.filter(c => c.color === "blue").length;
  }

  // -- Chefs espions : garde le choix fait au salon, sinon le premier ----
  assignSpymasters() {
    for (const team of ["red", "blue"] as Team[]) {
      const members = Array.from(this.cnPlayers.values()).filter(
        p => p.team === team && this.players.has(p.id)
      );
      const chosen = members.find(p => p.isSpymaster) ?? members[0];
      for (const p of this.cnPlayers.values()) {
        if (p.team === team) p.isSpymaster = p === chosen;
      }
    }
  }

  // -- Start the actual game (after team pick) -------------------------
  startGame() {
    this.assignSpymasters();
    this.generateBoard();
    this.phase = "spymaster-turn";
    this.currentClueWord = null;
    this.currentClueCount = 0;
    this.guessesRemaining = 0;
    this.startTimer(CLUE_TIMER);
    this.broadcastPersonalizedState();
  }

  // -- Timer management ------------------------------------------------
  startTimer(seconds: number) {
    this.clearTimer();
    this.timeLeft = seconds;
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.onTimerExpired();
      } else {
        this.broadcastPersonalizedState();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  onTimerExpired() {
    this.clearTimer();

    if (this.phase === "spymaster-turn") {
      // Spymaster ran out of time - auto skip (give clue "PASSE, 0")
      this.switchTurn();
    } else if (this.phase === "team-guess") {
      // Team ran out of guessing time
      this.switchTurn();
    }
  }

  // -- Switch turn to other team ---------------------------------------
  switchTurn() {
    this.clearTimer();
    this.currentTeam = this.currentTeam === "red" ? "blue" : "red";
    this.currentClueWord = null;
    this.currentClueCount = 0;
    this.guessesRemaining = 0;
    this.phase = "spymaster-turn";
    this.startTimer(CLUE_TIMER);
    this.broadcastPersonalizedState();
  }

  // -- Check win conditions --------------------------------------------
  checkWinCondition(): boolean {
    if (this.redRemaining === 0) {
      this.winner = "red";
      this.winReason = "Tous les mots rouges ont été trouvés !";
      this.endCodeNames();
      return true;
    }
    if (this.blueRemaining === 0) {
      this.winner = "blue";
      this.winReason = "Tous les mots bleus ont été trouvés !";
      this.endCodeNames();
      return true;
    }
    return false;
  }

  triggerAssassinLoss(guessingTeam: Team) {
    this.winner = guessingTeam === "red" ? "blue" : "red";
    this.winReason = `L'équipe ${guessingTeam === "red" ? "rouge" : "bleue"} a fait exploser la Bombe !`;
    this.endCodeNames();
  }

  // -- End game --------------------------------------------------------
  endCodeNames() {
    this.clearTimer();
    this.phase = "game-over";

    // Reveal all cards
    for (const card of this.cards) {
      card.revealed = true;
    }

    // Classement par équipe : toute l'équipe gagnante 1re, l'autre 2e.
    const rankings: GameRanking[] = [];
    const winnerTeam = this.winner;
    for (const p of this.cnPlayers.values()) {
      if (p.team === null) continue;
      const won = p.team === winnerTeam;
      rankings.push({
        playerId: p.id,
        playerName: p.name,
        rank: won ? 1 : 2,
        score: won ? 1 : 0,
      });
    }
    rankings.sort((x, y) => x.rank - y.rank);

    this.broadcastPersonalizedState();

    // Laisse le temps de voir la grille révélée avant l'écran de fin.
    if (this.endTimeout) clearTimeout(this.endTimeout);
    this.endTimeout = setTimeout(() => {
      this.endTimeout = null;
      this.endGame(rankings);
    }, 5000);
  }

  // -- Message handling ------------------------------------------------
  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;
    const senderId = this.findPlayerIdByConnection(sender.id);
    if (!senderId) return;

    const cnPlayer = this.cnPlayers.get(senderId);
    if (!cnPlayer) return;

    switch (action) {
      case "join-team":
        this.handleJoinTeam(cnPlayer, payload.team as Team);
        break;
      case "want-spymaster":
        this.handleWantSpymaster(cnPlayer);
        break;
      case "start-game":
        this.handleStartGame(senderId);
        break;
      case "give-clue":
        this.handleGiveClue(cnPlayer, payload.word as string, payload.count as number);
        break;
      case "guess":
        this.handleGuess(cnPlayer, payload.wordIndex as number);
        break;
      case "end-turn":
        this.handleEndTurn(cnPlayer);
        break;
      default:
        break;
    }
  }

  handleJoinTeam(player: CodeNamesPlayer, team: Team) {
    if (this.phase !== "team-pick") return;
    if (team !== "red" && team !== "blue") return;

    player.team = team;
    player.isSpymaster = false;
    this.broadcastPersonalizedState();
  }

  handleWantSpymaster(player: CodeNamesPlayer) {
    if (this.phase !== "team-pick") return;
    if (!player.team) return;
    for (const p of this.cnPlayers.values()) {
      if (p.team === player.team) p.isSpymaster = p.id === player.id;
    }
    this.broadcastPersonalizedState();
  }

  handleStartGame(senderId: string) {
    if (this.phase !== "team-pick") return;
    if (senderId !== this.hostId) return;

    // Chaque équipe a besoin d'au moins 2 joueurs connectés : 1 Chef espion +
    // 1 devineur (sinon l'équipe ne peut jamais deviner ni gagner).
    const connected = Array.from(this.cnPlayers.values()).filter(p => this.players.has(p.id));
    const redTeam = connected.filter(p => p.team === "red");
    const blueTeam = connected.filter(p => p.team === "blue");

    if (redTeam.length < 2 || blueTeam.length < 2) {
      this.sendToPlayer(senderId, {
        type: "game-error",
        payload: { message: "Chaque équipe doit avoir au moins 2 joueurs (1 Chef espion + 1 devineur)." },
      });
      return;
    }

    this.startGame();
  }

  handleGiveClue(player: CodeNamesPlayer, word: string, count: number) {
    if (this.phase !== "spymaster-turn") return;
    if (player.team !== this.currentTeam) return;
    if (!player.isSpymaster) return;

    // Validation de l'indice : un seul mot, pas un mot de la grille.
    const trimmedWord = String(word ?? "").trim().toLocaleUpperCase("fr-FR");
    if (!trimmedWord) return;
    if (/\s/.test(trimmedWord)) {
      this.sendToPlayer(player.id, {
        type: "game-error",
        payload: { message: "L'indice doit être un seul mot (sans espace)." },
      });
      return;
    }
    if (trimmedWord.length > 30 || !normalizeWord(trimmedWord)) {
      this.sendToPlayer(player.id, {
        type: "game-error",
        payload: { message: "Indice invalide." },
      });
      return;
    }

    // 0 = « ∞ » (nombre de mots illimité), sinon 1 à 9.
    const rawCount = Number(count);
    const clueCount = Number.isFinite(rawCount)
      ? Math.max(0, Math.min(9, Math.floor(rawCount)))
      : 1;

    // Interdit : un mot visible de la grille (accents, casse et pluriel ignorés).
    const clueForms = new Set(wordForms(trimmedWord));
    const isGridWord = this.cards.some(
      c => !c.revealed && wordForms(c.word).some(f => clueForms.has(f))
    );
    if (isGridWord) {
      this.sendToPlayer(player.id, {
        type: "game-error",
        payload: { message: "L'indice ne peut pas être un mot de la grille." },
      });
      return;
    }

    this.clearTimer();
    this.currentClueWord = trimmedWord;
    this.currentClueCount = clueCount;
    // Guesses = count + 1 (bonus guess). If count is 0, allow unlimited (max 25).
    this.guessesRemaining = clueCount === 0 ? GRID_SIZE : clueCount + 1;
    this.phase = "team-guess";
    this.startTimer(GUESS_TIMER);
    this.broadcastPersonalizedState();
  }

  handleGuess(player: CodeNamesPlayer, wordIndex: number) {
    if (this.phase !== "team-guess") return;
    if (player.team !== this.currentTeam) return;
    if (player.isSpymaster) return; // Spymasters don't guess

    // Validate index
    if (wordIndex < 0 || wordIndex >= GRID_SIZE) return;
    const card = this.cards[wordIndex];
    if (card.revealed) return;

    // Reveal the card
    card.revealed = true;
    this.guessesRemaining--;

    if (card.color === "assassin") {
      this.triggerAssassinLoss(this.currentTeam);
      return;
    }

    if (card.color === "red") this.redRemaining--;
    if (card.color === "blue") this.blueRemaining--;

    // Check win
    if (this.checkWinCondition()) return;

    // Determine if turn continues
    if (card.color === this.currentTeam) {
      // Correct guess! Continue if guesses remain
      if (this.guessesRemaining <= 0) {
        this.switchTurn();
      } else {
        this.broadcastPersonalizedState();
      }
    } else {
      // Wrong guess (neutral or opponent card) - turn ends
      this.switchTurn();
    }
  }

  handleEndTurn(player: CodeNamesPlayer) {
    if (this.phase !== "team-guess") return;
    if (player.team !== this.currentTeam) return;
    if (player.isSpymaster) return;

    this.switchTurn();
  }

  // -- State serialization (personalized) ------------------------------
  getStateForPlayer(playerId: string): Record<string, unknown> {
    const cnPlayer = this.cnPlayers.get(playerId);
    const isSpymaster = cnPlayer?.isSpymaster ?? false;

    const players = Array.from(this.cnPlayers.values()).map(p => ({
      id: p.id,
      name: p.name,
      team: p.team,
      isSpymaster: p.isSpymaster,
    }));

    const cards = this.cards.map(card => {
      if (card.revealed || isSpymaster || this.phase === "game-over") {
        // Show true color
        return { word: card.word, color: card.color, revealed: card.revealed };
      }
      // Hide color for non-spymaster on unrevealed cards
      return { word: card.word, color: null, revealed: false };
    });

    return {
      phase: this.phase,
      currentTeam: this.currentTeam,
      startingTeam: this.startingTeam,
      players,
      cards,
      redRemaining: this.redRemaining,
      blueRemaining: this.blueRemaining,
      currentClueWord: this.currentClueWord,
      currentClueCount: this.currentClueCount,
      guessesRemaining: this.guessesRemaining,
      timeLeft: this.timeLeft,
      hostId: this.hostId,
      myId: playerId,
      isSpymaster,
      winner: this.winner,
      winReason: this.winReason,
    };
  }

  // Default getState (used by game.ts on join before we have personalized context)
  getState(): Record<string, unknown> {
    const players = Array.from(this.cnPlayers.values()).map(p => ({
      id: p.id,
      name: p.name,
      team: p.team,
      isSpymaster: p.isSpymaster,
    }));

    // Return a safe state with no hidden info
    const cards = this.cards.map(card => {
      if (card.revealed || this.phase === "game-over") {
        return { word: card.word, color: card.color, revealed: card.revealed };
      }
      return { word: card.word, color: null, revealed: false };
    });

    return {
      phase: this.phase,
      currentTeam: this.currentTeam,
      startingTeam: this.startingTeam,
      players,
      cards,
      redRemaining: this.redRemaining,
      blueRemaining: this.blueRemaining,
      currentClueWord: this.currentClueWord,
      currentClueCount: this.currentClueCount,
      guessesRemaining: this.guessesRemaining,
      timeLeft: this.timeLeft,
      hostId: this.hostId,
      myId: null,
      isSpymaster: false,
      winner: this.winner,
      winReason: this.winReason,
    };
  }

  broadcastPersonalizedState() {
    for (const [playerId, player] of this.players) {
      this.sendTo(player.connectionId, {
        type: "game-state",
        payload: this.getStateForPlayer(playerId),
      });
    }
  }

  // -- Helpers ---------------------------------------------------------
  findPlayerIdByConnection(connectionId: string): string | null {
    for (const [id, player] of this.players) {
      if (player.connectionId === connectionId) return id;
    }
    return null;
  }

  cleanup() {
    this.clearTimer();
    if (this.endTimeout) {
      clearTimeout(this.endTimeout);
      this.endTimeout = null;
    }
  }
}
