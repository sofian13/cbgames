import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// -- French word bank (200+ common nouns, varied topics) --------------
const WORD_BANK: string[] = [
  "SOLEIL", "BANANE", "DRAGON", "ETOILE", "CHATEAU", "PLAGE", "MONTAGNE",
  "ROBOT", "FORET", "MIROIR", "FANTOME", "DIAMANT", "PIRATE", "BALLON",
  "MUSIQUE", "LUNE", "TIGRE", "FLAMME", "NUAGE", "ANCRE", "OISEAU",
  "TEMPLE", "SIRENE", "MARTEAU", "CLOCHE", "PAPILLON", "VOLCAN", "PLUIE",
  "SERPENT", "TRESOR", "HORLOGE", "CACTUS", "PHARE", "MASQUE", "EPEE",
  "BOUGIE", "CORAIL", "FOUDRE", "SAVANE", "TORTUE", "COMETE", "TOILE",
  "VIOLON", "REQUIN", "JUNGLE", "CERISE", "MOULIN", "RUBIS", "GLACIER",
  "SABLE", "AIGLE", "FUSEE", "COURONNE", "MEDUSE", "BRIQUE", "ORAGE",
  "HARPE", "LABYRINTHE", "PERLE", "ABRICOT", "RENARD", "NAVIRE", "PLUME",
  "GIRAFE", "ENCRE", "BROUILLARD", "COLOMBE", "CHAUDRON", "ATLAS",
  "EMERAUDE", "CAFE", "TROMPETTE", "SAPHIR", "CITRON", "MAGICIEN",
  "CHEVALIER", "FLECHE", "CASCADE", "HAMAC", "LICORNE", "OPERA",
  "CRISTAL", "TAMBOUR", "ARAIGNEE", "AURORE", "CANARI", "DRAPEAU",
  "GRENADE", "LOTUS", "OMBRE", "PHENIX", "RADAR", "TONNERRE", "VAGUE",
  "ZEPHYR", "BAMBOU", "CARNAVAL", "DUNE", "EMBLEME", "GALAXIE",
  "ICEBERG", "JARDIN", "KAYAK", "LEGENDE", "METEORE", "NECTAR",
  "ODYSSEE", "POTION", "QUARTZ", "RUCHE", "SPHINX", "TULIPE", "UNIVERS",
  "VAMPIRE", "WAGON", "XYLOPHONE", "YACHT", "ZEBRE", "ARMURE", "BISON",
  "CAPE", "DELTA", "FALAISE", "GROTTE", "HIBOU", "IVOIRE", "JADE",
  "KARMA", "LIBELLULE", "MANDARINE", "NIMBUS", "OASIS", "PANDA",
  "ROSEE", "SAFARI", "TITAN", "URANIUM", "VELOURS", "WOMBAT",
  "ACROBATE", "BAGUETTE", "CAMELEON", "DOMINO", "ESCARGOT", "FONTAINE",
  "GRENOUILLE", "HARMONICA", "IGLOO", "JONGLEUR", "KOALA", "LANTERNE",
  "MOSAIQUE", "NENUPHAR", "ORCHIDEE", "PALMIER", "ROULETTE", "SCORPION",
  "TRIDENT", "VIOLETTE", "BLIZZARD", "COCON", "DIESEL", "ECHO",
  "FAUCON", "GORILLE", "HORIZON", "INDIGO", "JASMIN", "KIWI",
  "MAMMOUTH", "NARVAL", "ORIGAMI", "PELICAN", "SAUMON", "TOTEM",
  "ACACIA", "BOUSSOLE", "CRAYON", "DAUPHIN", "ERMITE", "FRESQUE",
  "GAZELLE", "HYDRE", "IMPALA", "JACKAL", "LYNX", "MIRAGE", "OPALE",
  "PRISME", "SABRE", "TANGO", "VIPERE",
  // -- Extension : animaux ------------------------------------------
  "LION", "OURS", "LOUP", "CHAT", "CHIEN", "CHEVAL", "VACHE", "COCHON",
  "MOUTON", "CHEVRE", "POULE", "CANARD", "LAPIN", "SOURIS", "ELEPHANT",
  "RHINOCEROS", "HIPPOPOTAME", "SINGE", "KANGOUROU", "CROCODILE", "ABEILLE",
  "FOURMI", "MOUCHE", "GUEPE", "COCCINELLE", "CHENILLE", "BALEINE", "PHOQUE",
  "PINGOUIN", "MANCHOT", "AUTRUCHE", "PERROQUET", "FLAMANT", "CYGNE",
  "CORBEAU", "MOINEAU", "HIRONDELLE", "CHOUETTE", "VAUTOUR", "CASTOR",
  "HERISSON", "ECUREUIL", "TAUPE", "BLAIREAU", "SANGLIER", "CERF", "BICHE",
  "ELAN", "BUFFLE", "ANTILOPE", "GUEPARD", "JAGUAR", "LEOPARD", "PUMA",
  "LAMA", "DROMADAIRE", "CHAMEAU", "ANE", "TAUREAU", "AGNEAU", "POUSSIN",
  "OIE", "PIGEON", "MERLE", "ROSSIGNOL", "CIGOGNE", "HERON", "MOUETTE",
  "HOMARD", "CRABE", "CREVETTE", "HUITRE", "POULPE", "CALAMAR", "ANGUILLE",
  "TRUITE", "THON", "SARDINE", "RAIE",
  // -- Extension : nourriture & fruits ------------------------------
  "POMME", "POIRE", "RAISIN", "FRAISE", "FRAMBOISE", "MYRTILLE", "PECHE",
  "PRUNE", "MELON", "PASTEQUE", "ANANAS", "MANGUE", "NOIX", "AMANDE",
  "NOISETTE", "CHATAIGNE", "OLIVE", "TOMATE", "CAROTTE", "OIGNON",
  "POIVRON", "COURGETTE", "AUBERGINE", "CONCOMBRE", "SALADE", "EPINARD",
  "CHOU", "BROCOLI", "HARICOT", "LENTILLE", "MAIS", "PAIN", "FROMAGE",
  "BEURRE", "YAOURT", "MIEL", "SUCRE", "SEL", "POIVRE", "CHOCOLAT",
  "BONBON", "GATEAU", "TARTE", "GAUFRE", "BISCUIT", "SORBET", "CONFITURE",
  "SOUPE", "OEUF", "LAIT",
  // -- Extension : objets & maison ----------------------------------
  "TABLE", "CHAISE", "LIT", "ARMOIRE", "ETAGERE", "CANAPE", "FAUTEUIL",
  "TABOURET", "BUREAU", "LAMPE", "RIDEAU", "TAPIS", "COUSSIN", "OREILLER",
  "CADRE", "VASE", "ASSIETTE", "BOL", "TASSE", "VERRE", "BOUTEILLE",
  "FOURCHETTE", "COUTEAU", "CUILLERE", "CASSEROLE", "POELE", "MARMITE",
  "BOUILLOIRE", "FOUR", "FRIGO", "BALAI", "SEAU", "EPONGE", "SAVON",
  "BROSSE", "PEIGNE", "RASOIR", "SERVIETTE", "CISEAUX", "AIGUILLE", "FIL",
  "BOUTON", "CLE", "CADENAS", "SERRURE", "TOURNEVIS", "SCIE", "PERCEUSE",
  "CLOU", "ECHELLE", "BROUETTE", "PELLE", "RATEAU", "ARROSOIR",
  // -- Extension : transport ----------------------------------------
  "VOITURE", "CAMION", "BUS", "TRAIN", "METRO", "TRAMWAY", "VELO", "MOTO",
  "SCOOTER", "TROTTINETTE", "AVION", "HELICOPTERE", "BATEAU", "VOILIER",
  "RADEAU", "MONTGOLFIERE", "TRACTEUR", "AMBULANCE", "TAXI", "CARROSSE",
  "TRAINEAU", "SKATE",
  // -- Extension : corps humain -------------------------------------
  "TETE", "OEIL", "NEZ", "BOUCHE", "OREILLE", "DENT", "LANGUE", "JOUE",
  "MENTON", "FRONT", "COU", "EPAULE", "BRAS", "COUDE", "MAIN", "DOIGT",
  "POUCE", "DOS", "VENTRE", "JAMBE", "GENOU", "PIED", "TALON", "COEUR",
  "CERVEAU", "POUMON", "SQUELETTE", "CRANE", "MUSCLE",
  // -- Extension : nature -------------------------------------------
  "ARBRE", "FLEUR", "HERBE", "FEUILLE", "RACINE", "BRANCHE", "TRONC",
  "CHAMPIGNON", "ROCHER", "CAILLOU", "RIVIERE", "FLEUVE", "LAC", "ETANG",
  "MER", "OCEAN", "RUISSEAU", "SOURCE", "COLLINE", "VALLEE", "PLAINE",
  "PRAIRIE", "CHAMP", "DESERT", "NEIGE", "GIVRE", "GRELE", "VENT",
  "TEMPETE", "OURAGAN", "TORNADE", "ETINCELLE", "CENDRE", "FUMEE",
  // -- Extension : vetements & accessoires --------------------------
  "CHEMISE", "PANTALON", "JUPE", "ROBE", "MANTEAU", "VESTE", "PULL",
  "SHORT", "CHAUSSURE", "BOTTE", "BASKET", "SANDALE", "CHAPEAU",
  "CASQUETTE", "BONNET", "ECHARPE", "GANT", "CEINTURE", "CRAVATE",
  "BAGUE", "COLLIER", "BRACELET", "MONTRE", "LUNETTE", "SAC", "VALISE",
  "PARAPLUIE", "EVENTAIL",
  // -- Extension : personnages & metiers ----------------------------
  "ROI", "REINE", "PRINCE", "PRINCESSE", "SOLDAT", "GENERAL", "CAPITAINE",
  "MARIN", "FERMIER", "BERGER", "PECHEUR", "CHASSEUR", "MEDECIN", "JUGE",
  "POLICIER", "VOLEUR", "BANDIT", "ESPION", "CLOWN", "ACTEUR", "CHANTEUR",
  "DANSEUR", "PEINTRE", "ECRIVAIN", "SAVANT", "GEANT", "NAIN", "SORCIER",
  "FEE", "ANGE", "DEMON", "MOMIE", "ZOMBIE", "CYBORG",
  // -- Extension : lieux & batiments --------------------------------
  "MAISON", "IMMEUBLE", "TOUR", "PONT", "TUNNEL", "BARRAGE", "USINE",
  "GRANGE", "ECOLE", "EGLISE", "CATHEDRALE", "PYRAMIDE", "FORTERESSE",
  "DONJON", "CABANE", "TENTE", "HUTTE", "MARCHE", "PORT", "QUAI", "ARENE",
  "THEATRE",
  // -- Extension : musique & objets divers --------------------------
  "GUITARE", "PIANO", "FLUTE", "SAXOPHONE", "ACCORDEON", "CLARINETTE",
  "BANJO", "GONG", "CYMBALE", "LIVRE", "STYLO", "GOMME", "REGLE", "CAHIER",
  "GLOBE", "CARTE", "JUMELLES", "LOUPE", "MICROSCOPE", "TELESCOPE",
  "CAMERA", "RADIO", "ORDINATEUR", "CLAVIER", "ECRAN", "MANETTE", "CASQUE",
  "MICRO", "AMPOULE", "AIMANT", "RESSORT", "ENGRENAGE", "ROUE", "CHAINE",
  "CORDE", "FILET", "HAMECON", "CANNE", "CERF-VOLANT", "TOUPIE", "BILLE",
  "PUZZLE", "PION",
];

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

  // Winner info
  winner: Team | null = null;
  winReason: string | null = null;

  start() {
    // Overridden: Code Names uses team-pick first, actual game starts on host action
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

      // If during gameplay and active spymaster disconnects, end their turn
      if (this.phase === "spymaster-turn" || this.phase === "team-guess") {
        const cnPlayer = this.cnPlayers.get(removed.id);
        if (cnPlayer?.isSpymaster && cnPlayer.team === this.currentTeam) {
          if (this.phase === "spymaster-turn") {
            this.switchTurn();
          }
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

  // -- Auto-assign spymasters (first player in each team) --------------
  assignSpymasters() {
    // Reset all
    for (const p of this.cnPlayers.values()) {
      p.isSpymaster = false;
    }

    let redSpyAssigned = false;
    let blueSpyAssigned = false;

    for (const p of this.cnPlayers.values()) {
      if (p.team === "red" && !redSpyAssigned) {
        p.isSpymaster = true;
        redSpyAssigned = true;
      }
      if (p.team === "blue" && !blueSpyAssigned) {
        p.isSpymaster = true;
        blueSpyAssigned = true;
      }
      if (redSpyAssigned && blueSpyAssigned) break;
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
      this.winReason = "Tous les mots rouges ont ete trouves !";
      this.endCodeNames();
      return true;
    }
    if (this.blueRemaining === 0) {
      this.winner = "blue";
      this.winReason = "Tous les mots bleus ont ete trouves !";
      this.endCodeNames();
      return true;
    }
    return false;
  }

  triggerAssassinLoss(guessingTeam: Team) {
    this.winner = guessingTeam === "red" ? "blue" : "red";
    this.winReason = `L'equipe ${guessingTeam === "red" ? "rouge" : "bleue"} a touche l'assassin !`;
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

    // Build rankings: winning team first
    const rankings: GameRanking[] = [];
    let rank = 1;
    const winnerTeam = this.winner;

    // Winners
    for (const p of this.cnPlayers.values()) {
      if (p.team === winnerTeam) {
        rankings.push({
          playerId: p.id,
          playerName: p.name,
          rank,
          score: 1,
        });
      }
    }
    rank = rankings.length + 1;

    // Losers
    for (const p of this.cnPlayers.values()) {
      if (p.team !== winnerTeam && p.team !== null) {
        rankings.push({
          playerId: p.id,
          playerName: p.name,
          rank,
          score: 0,
        });
      }
    }

    this.broadcastPersonalizedState();

    // Delay endGame to let clients see the final state
    setTimeout(() => {
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

  handleStartGame(senderId: string) {
    if (this.phase !== "team-pick") return;
    if (senderId !== this.hostId) return;

    // Validate: at least 2 players per team, or at least 1 per team for small groups
    const redTeam = Array.from(this.cnPlayers.values()).filter(p => p.team === "red");
    const blueTeam = Array.from(this.cnPlayers.values()).filter(p => p.team === "blue");

    if (redTeam.length < 1 || blueTeam.length < 1) {
      this.sendToPlayer(senderId, {
        type: "game-error",
        payload: { message: "Chaque equipe doit avoir au moins 1 joueur." },
      });
      return;
    }

    this.startGame();
  }

  handleGiveClue(player: CodeNamesPlayer, word: string, count: number) {
    if (this.phase !== "spymaster-turn") return;
    if (player.team !== this.currentTeam) return;
    if (!player.isSpymaster) return;

    // Validate clue
    const trimmedWord = (word ?? "").trim().toUpperCase();
    if (!trimmedWord || trimmedWord.length === 0) return;

    // Count must be 0-9 (0 = "unlimited" hint, conventionally)
    const clueCount = Math.max(0, Math.min(9, Math.floor(count ?? 1)));

    // Check clue word is not one of the grid words
    const isGridWord = this.cards.some(c => c.word === trimmedWord && !c.revealed);
    if (isGridWord) {
      this.sendToPlayer(player.id, {
        type: "game-error",
        payload: { message: "L'indice ne peut pas etre un mot de la grille." },
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
  }
}
