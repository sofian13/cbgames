import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// ===========================================================
//  L'INTRUS (id technique : undercover) — Server logic
//  Civils vs l'Intrus (vs le Fantôme optionnel)
//  Règle : l'Intrus NE SAIT PAS qu'il est l'Intrus (il reçoit juste son
//  mot). Seul le Fantôme sait qu'il n'a pas de mot.
//  Hébergé sur PartyKit, hérite de BaseGame.
// ===========================================================

// -- Config ------------------------------------------------
const WORD_REVEAL_TIME  = 6_000;   // ms — temps de mémorisation max (on avance dès que tous sont prêts)
const CLUE_TIME         = 25;      // sec par joueur pendant la phase d'indices
const VOTE_TIME         = 30;      // sec total de vote
const VOTE_RESULT_TIME  = 4_500;   // ms pour le tampon "éliminé"
const GUESS_TIME        = 20;      // sec pour le Fantôme (deviner le mot civil)
const NEXT_ROUND_TIME   = 3_000;   // ms entre les manches

// -- Word bank (paires de mots voisins) -------------------
// Copie (sans la catégorie +18) de WORD_CATEGORIES dans
// src/components/games/undercover/undercover-local.tsx — le serveur
// ne peut pas importer depuis src/. Reporter toute modif là-bas.
const WORD_PAIRS: [string, string][] = [
  // food
  ["Lasagnes", "Gratin dauphinois"], ["Croque-monsieur", "Panini"], ["Crêpe", "Gaufre"], ["Couscous", "Paella"],
  ["Quiche", "Tarte salée"], ["Omelette", "Œuf au plat"], ["Ratatouille", "Tian de légumes"], ["Hot-dog", "Burger"],
  ["Nems", "Samoussas"], ["Taboulé", "Salade de riz"], ["Purée", "Frites"], ["Pain au chocolat", "Croissant"],
  ["Éclair", "Religieuse"], ["Macaron", "Meringue"], ["Muffin", "Cupcake"], ["Yaourt", "Fromage blanc"],
  ["Camembert", "Brie"], ["Steak haché", "Boulette"], ["Saucisson", "Jambon"], ["Popcorn", "Chips"],
  ["Barbe à papa", "Guimauve"], ["Pizza", "Calzone"],
  // drinks
  ["Soda au cola", "Soda à l'orange"], ["Jus de pomme", "Jus de raisin"], ["Limonade", "Eau pétillante"], ["Thé glacé", "Citronnade"],
  ["Chocolat chaud", "Café au lait"], ["Expresso", "Cappuccino"], ["Tisane", "Bouillon"], ["Milkshake", "Smoothie"],
  ["Sirop de menthe", "Sirop de grenadine"], ["Bière", "Cidre"], ["Vin rouge", "Vin rosé"], ["Champagne", "Crémant"],
  ["Mojito", "Piña colada"], ["Sangria", "Punch"], ["Rhum", "Whisky"], ["Kombucha", "Ginger beer"],
  ["Boisson énergisante", "Café serré"], ["Eau de coco", "Jus d'ananas"], ["Diabolo", "Panaché"],
  // places
  ["Bibliothèque", "Médiathèque"], ["Boulangerie", "Pâtisserie"], ["Camping", "Gîte"], ["Zoo", "Aquarium"],
  ["Fête foraine", "Parc d'attractions"], ["Patinoire", "Piscine"], ["Mairie", "Préfecture"], ["Phare", "Château d'eau"],
  ["Grotte", "Tunnel"], ["Port", "Marina"], ["Ferme", "Ranch"], ["Laverie", "Pressing"],
  ["Cimetière", "Chapelle"], ["Escape game", "Salle d'arcade"], ["Salle de sport", "Dojo"], ["Plage", "Crique"],
  ["Refuge", "Chalet"], ["Office du tourisme", "Agence de voyage"], ["Planétarium", "Observatoire"], ["Péage", "Station-service"],
  // sport
  ["Football", "Futsal"], ["Tennis", "Squash"], ["Ping-pong", "Badminton"], ["Ski de fond", "Biathlon"],
  ["Escrime", "Kendo"], ["Aviron", "Canoë"], ["Water-polo", "Natation synchronisée"], ["Parapente", "Parachute"],
  ["Marathon", "Triathlon"], ["Boxe", "Kick-boxing"], ["Bowling", "Pétanque"], ["Saut en hauteur", "Saut à la perche"],
  ["Haltérophilie", "Musculation"], ["Tir à l'arc", "Fléchettes"], ["Roller", "Patin à glace"], ["Gymnastique", "Trampoline"],
  ["Rugby", "Football américain"], ["Kitesurf", "Planche à voile"], ["Golf", "Croquet"], ["Yoga", "Pilates"],
  ["Handball", "Volley"],
  // animals
  ["Hérisson", "Porc-épic"], ["Koala", "Paresseux"], ["Panda", "Raton laveur"], ["Pieuvre", "Calamar"],
  ["Méduse", "Étoile de mer"], ["Chameau", "Dromadaire"], ["Zèbre", "Girafe"], ["Kangourou", "Wallaby"],
  ["Flamant rose", "Cigogne"], ["Perroquet", "Toucan"], ["Mouton", "Lama"], ["Cochon", "Sanglier"],
  ["Chauve-souris", "Hibou"], ["Fourmi", "Termite"], ["Coccinelle", "Luciole"], ["Phoque", "Otarie"],
  ["Moustique", "Mouche"], ["Écureuil", "Marmotte"], ["Poisson rouge", "Tortue d'eau"], ["Lynx", "Guépard"],
  // fiction
  ["Vampire", "Loup-garou"], ["Sorcière", "Fée"], ["Zombie", "Momie"], ["Pirate", "Corsaire"],
  ["Chevalier", "Samouraï"], ["Ninja", "Espion"], ["Dragon", "Licorne"], ["Robot", "Cyborg"],
  ["Extraterrestre", "Astronaute"], ["Super-héros", "Super-vilain"], ["Princesse", "Reine"], ["Sirène", "Nymphe"],
  ["Ogre", "Troll"], ["Magicien", "Alchimiste"], ["Cow-boy", "Shérif"], ["Détective", "Inspecteur"],
  ["Dinosaure", "Mammouth"], ["Génie", "Elfe"], ["Gladiateur", "Viking"], ["Sitcom", "Téléréalité"],
  ["Western", "Film de cape et d'épée"],
  // transport
  ["Voiture", "Camionnette"], ["TGV", "Train de nuit"], ["Trottinette", "Skateboard"], ["Hélicoptère", "Montgolfière"],
  ["Kayak", "Pédalo"], ["Tracteur", "Moissonneuse"], ["Ambulance", "Camion de pompiers"], ["Taxi", "VTC"],
  ["Bus scolaire", "Car de tourisme"], ["Téléphérique", "Télésiège"], ["Jet-ski", "Hors-bord"], ["Monocycle", "Tandem"],
  ["Calèche", "Charrette"], ["Péniche", "Chalutier"], ["Scooter", "Mobylette"], ["Planeur", "ULM"],
  ["Paquebot", "Ferry"], ["Tramway", "Funiculaire"], ["Dépanneuse", "Camion-benne"], ["Fusée", "Satellite"],
  // objects
  ["Agrafeuse", "Trombone"], ["Ciseaux", "Cutter"], ["Gomme", "Correcteur"], ["Bougie", "Lampe torche"],
  ["Réveil", "Minuteur"], ["Peigne", "Brosse à cheveux"], ["Brosse à dents", "Fil dentaire"], ["Coussin", "Oreiller"],
  ["Couette", "Plaid"], ["Tire-bouchon", "Décapsuleur"], ["Parapluie", "Imperméable"], ["Portefeuille", "Sac banane"],
  ["Jumelles", "Télescope"], ["Boussole", "Carte"], ["Cadenas", "Coffre-fort"], ["Sifflet", "Klaxon"],
  ["Ballon", "Frisbee"], ["Puzzle", "Casse-tête"], ["Dé", "Carte à jouer"], ["Marteau", "Maillet"],
  ["Tournevis", "Clé à molette"],
  // nature
  ["Arc-en-ciel", "Aurore boréale"], ["Grêle", "Verglas"], ["Tsunami", "Tremblement de terre"], ["Avalanche", "Glissement de terrain"],
  ["Dune", "Falaise"], ["Marais", "Étang"], ["Récif", "Lagon"], ["Cactus", "Palmier"],
  ["Sapin", "Chêne"], ["Rose", "Tulipe"], ["Tournesol", "Marguerite"], ["Champignon", "Mousse"],
  ["Coquillage", "Galet"], ["Comète", "Météorite"], ["Éclipse", "Pleine lune"], ["Brise", "Rafale"],
  ["Glacier", "Iceberg"], ["Canyon", "Vallée"], ["Geyser", "Source chaude"], ["Cascade", "Rapides"],
  // events
  ["Mariage", "Fiançailles"], ["Anniversaire surprise", "Pendaison de crémaillère"], ["Enterrement de vie de jeune fille", "Baby shower"], ["Remise de diplômes", "Bal de promo"],
  ["Brocante", "Vide-grenier"], ["Feu d'artifice", "Lâcher de lanternes"], ["Saint-Valentin", "Fête des mères"], ["Réveillon de Noël", "Jour de l'An"],
  ["Chandeleur", "Mardi gras"], ["Carnaval", "Bal masqué"], ["Kermesse", "Fête de village"], ["Salon", "Foire"],
  ["Pique-nique", "Barbecue"], ["Rentrée scolaire", "Vacances d'été"], ["Déménagement", "Rénovation"], ["Entretien d'embauche", "Premier jour de travail"],
  ["Match", "Tournoi"], ["Défilé", "Parade"], ["Spectacle de fin d'année", "Remise des prix"], ["Halloween", "Soirée déguisée"],
  // jobs
  ["Facteur", "Livreur"], ["Boucher", "Poissonnier"], ["Chirurgien", "Anesthésiste"], ["Hôtesse de l'air", "Guide touristique"],
  ["Kinésithérapeute", "Ostéopathe"], ["Maçon", "Charpentier"], ["Mécanicien", "Carrossier"], ["DJ", "Animateur radio"],
  ["Photographe", "Cameraman"], ["Bibliothécaire", "Archiviste"], ["Sage-femme", "Pédiatre"], ["Notaire", "Comptable"],
  ["Vigile", "Garde du corps"], ["Chauffeur de bus", "Conducteur de train"], ["Agriculteur", "Viticulteur"], ["Pharmacien", "Opticien"],
  ["Maître-nageur", "Sauveteur en mer"], ["Styliste", "Couturier"], ["Prêtre", "Moine"], ["Clown", "Mime"],
  // tech
  ["Smartphone", "Tablette"], ["Ordinateur portable", "Ordinateur fixe"], ["Console de salon", "Console portable"], ["Réseau social", "Messagerie"],
  ["Série", "Film"], ["Podcast", "Livre audio"], ["Selfie", "Photo de groupe"], ["Emoji", "GIF"],
  ["Clé USB", "Disque dur"], ["Wi-Fi", "Bluetooth"], ["Télécommande", "Manette"], ["Écouteurs sans fil", "Casque audio"],
  ["Montre connectée", "Podomètre"], ["Imprimante", "Scanner"], ["Mot de passe", "Code PIN"], ["Appel vidéo", "Message vocal"],
  ["Streaming", "Replay"], ["Jeu de tir", "Jeu de course"], ["Moteur de recherche", "Encyclopédie"], ["Drone", "Voiture télécommandée"],
  ["Plateforme vidéo", "Chaîne de télé"],
  // music
  ["Guitare", "Ukulélé"], ["Piano", "Orgue"], ["Violon", "Contrebasse"], ["Flûte", "Clarinette"],
  ["Trompette", "Cor de chasse"], ["Batterie", "Tambourin"], ["Accordéon", "Harmonica"], ["Harpe", "Lyre"],
  ["Rap", "Slam"], ["Rock", "Métal"], ["Reggae", "Ska"], ["Jazz", "Blues"],
  ["Chorale", "Fanfare"], ["Karaoké", "Blind test"], ["Opéra", "Comédie musicale"], ["Disque vinyle", "Cassette"],
  ["Chef d'orchestre", "Soliste"], ["Berceuse", "Comptine"], ["Tube de l'été", "Hymne national"], ["Platine", "Table de mixage"],
  // home
  ["Canapé", "Fauteuil"], ["Lit superposé", "Hamac"], ["Baignoire", "Jacuzzi"], ["Douche", "Sauna"],
  ["Cave", "Grenier"], ["Balcon", "Terrasse"], ["Volet", "Rideau"], ["Lave-vaisselle", "Lave-linge"],
  ["Micro-ondes", "Four"], ["Grille-pain", "Gaufrier"], ["Bouilloire", "Cafetière"], ["Poêle", "Casserole"],
  ["Tapis", "Paillasson"], ["Étagère", "Commode"], ["Lustre", "Lampadaire"], ["Serrure", "Interphone"],
  ["Cheminée", "Radiateur"], ["Aspirateur", "Serpillière"], ["Escalier", "Ascenseur"], ["Garage", "Abri de jardin"],
  // fashion
  ["Jean", "Jogging"], ["Pull", "Sweat à capuche"], ["Basket", "Mocassin"], ["Bottes de pluie", "Après-ski"],
  ["Écharpe", "Foulard"], ["Bonnet", "Casquette"], ["Robe", "Jupe"], ["Chemise", "Polo"],
  ["Pyjama", "Peignoir"], ["Short", "Maillot de bain"], ["Cravate", "Nœud papillon"], ["Gants", "Moufles"],
  ["Manteau", "Doudoune"], ["Lunettes de soleil", "Masque de ski"], ["Collier", "Boucles d'oreilles"], ["Ceinture", "Bretelles"],
  ["Tongs", "Chaussons"], ["Costume", "Smoking"], ["Tablier", "Blouse"], ["Sac à main", "Cartable"],
  // anime
  ["Naruto", "Sasuke"], ["Goku", "Vegeta"], ["Luffy", "Zoro"], ["Itachi", "Madara"],
  ["Gojo", "Sukuna"], ["Tanjiro", "Zenitsu"], ["Levi", "Eren"], ["Mikasa", "Historia"],
  ["Nami", "Robin"], ["One Piece", "Bleach"], ["Konoha", "Akatsuki"], ["Sharingan", "Byakugan"],
  ["Bankai", "Zanpakuto"], ["Manga", "Comics"], ["Shinigami", "Hollow"], ["Titan", "Géant"],
];

// -- Roles -------------------------------------------------
type Role = "civil" | "undercover" | "mrwhite";

interface UndercoverPlayer {
  id: string;
  name: string;
  score: number;
  role: Role;
  word: string | null;            // null pour le Fantôme
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
    includeMrWhite: false,         // le Fantôme
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

  /** Joueurs ayant confirmé « J'ai mémorisé » pendant word-reveal. */
  readyIds = new Set<string>();
  /** Égalité : candidats du revote (null = vote normal). */
  revoteCandidates: string[] | null = null;
  /** Égalité au premier vote : ex-aequo affichés pendant vote-result. */
  tieCandidates: string[] | null = null;

  /** Tous les setTimeout de la partie (nettoyés dans cleanup / restart). */
  timeouts = new Set<ReturnType<typeof setTimeout>>();
  later(fn: () => void, ms: number) {
    const t = setTimeout(() => { this.timeouts.delete(t); fn(); }, ms);
    this.timeouts.add(t);
  }
  clearTimeouts() {
    for (const t of this.timeouts) clearTimeout(t);
    this.timeouts.clear();
  }

  lastGuess: string | null = null;
  lastGuessCorrect: boolean | null = null;
  endReason: EndReason = null;

  // ---------------------------------------------------------
  //  Lifecycle
  // ---------------------------------------------------------
  start() {
    this.clearTimeouts();
    this.stopTimer();
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

    // Garde-fou : les civils doivent rester majoritaires (Intrus + Fantôme < civils).
    {
      const n = this.players.size;
      const cap = Math.floor((n - 1) / 2); // nb max d'imposteurs au total
      if (n < 5) this.config.includeMrWhite = false; // Fantôme seulement à partir de 5
      const mw = this.config.includeMrWhite ? 1 : 0;
      this.config.undercoverCount = Math.max(1, Math.min(this.config.undercoverCount, 3, cap - mw));
      if (this.config.undercoverCount + mw > cap) this.config.includeMrWhite = false;
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
    this.readyIds.clear();
    this.revoteCandidates = null;
    this.tieCandidates = null;

    for (const p of this.gamePlayers.values()) {
      if (!p.isEliminated) {
        p.hasClue = false;
        p.clue = null;
        p.votedFor = null;
      }
    }

    this.broadcastPersonalizedState();
    const round = this.round;
    this.later(() => {
      if (this.phase === "word-reveal" && this.round === round) this.startCluePhase();
    }, WORD_REVEAL_TIME);
  }

  /** Tous les joueurs vivants (humains connectés) ont mémorisé → on avance. */
  allReady(): boolean {
    return this.getAlive().every((p) =>
      this.readyIds.has(p.id) || this.isBot(p.id) || !this.players.has(p.id)
    );
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
  startVote(candidates: string[] | null = null) {
    this.stopTimer();
    this.revoteCandidates = candidates;
    this.tieCandidates = null;
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

    const wasRevote = this.revoteCandidates !== null;

    // Égalité au premier vote → revote entre les ex-aequo (une seule fois).
    if (top.length > 1 && !wasRevote) {
      this.eliminatedThisRound = null;
      this.eliminatedRole = null;
      this.tieCandidates = [...top];
      this.phase = "vote-result";
      this.broadcastPersonalizedState();
      const candidates = [...top];
      this.later(() => this.startVote(candidates), VOTE_RESULT_TIME);
      return;
    }

    // Aucun vote, ou nouvelle égalité au revote → personne ne sort ce tour.
    if (top.length !== 1) {
      this.eliminatedThisRound = null;
      this.eliminatedRole = null;
      this.tieCandidates = null;
      this.phase = "vote-result";
      this.broadcastPersonalizedState();
      this.later(() => this.afterEliminate(null), VOTE_RESULT_TIME);
      return;
    }

    const eliminatedId = top[0];
    const target = this.gamePlayers.get(eliminatedId);
    if (!target) return;

    target.isEliminated = true;
    target.eliminatedRound = this.round;
    this.eliminatedThisRound = eliminatedId;
    this.eliminatedRole = target.role;

    // Récompenses pour avoir voté contre l'Intrus / le Fantôme
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

    // Fantôme éliminé → il a une chance de deviner le mot civil
    if (target.role === "mrwhite") {
      this.later(() => this.startMrWhiteGuess(eliminatedId), VOTE_RESULT_TIME);
      return;
    }

    this.later(() => this.afterEliminate(eliminatedId), VOTE_RESULT_TIME);
  }

  // ---------------------------------------------------------
  //  Phase 4 : le Fantôme devine
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
      // Le Fantôme gagne seul
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

    // Imposteurs aussi nombreux que les civils → les imposteurs gagnent
    if (aliveUC.length + aliveMW.length >= aliveCv.length) {
      for (const u of [...aliveUC, ...aliveMW]) u.score += 5;
      this.endGameUC("undercover-wins");
      return;
    }

    // Sinon : nouveau tour
    // Petit bonus de survie aux civils
    for (const c of aliveCv) c.score += 1;
    this.later(() => this.startWordReveal(), NEXT_ROUND_TIME);
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
    this.later(() => this.endGame(rankings), 800);
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

    // -- Confirmation « J'ai mémorisé » : quand tous les vivants sont prêts,
    //    on passe aux indices sans attendre la fin du timer (6 s max).
    if (action === "ack-word" && this.phase === "word-reveal") {
      if (!gp || gp.isEliminated) return;
      this.readyIds.add(sp.id);
      if (this.allReady()) this.startCluePhase();
      else this.broadcastPersonalizedState();
      return;
    }

    // -- Démarrage manuel par l'hôte (le routeur game.ts désactive l'auto-start)
    if (action === "start-game" && !this.started) {
      if (this.players.size < 3) return;
      this.start();
      return;
    }

    // -- Forçage du vote par l'hôte (si tout le monde a parlé)
    if (action === "force-vote" && this.phase === "clue") {
      // Seul l'hôte peut forcer (1er joueur connecté)
      const firstId = Array.from(this.players.values())[0]?.id;
      if (sp.id !== firstId) return;
      // On vérifie quand même que tous les vivants ont parlé
      const alive = this.getAlive();
      if (alive.every((p) => p.hasClue || p.id === this.clueOrder[this.currentClueIdx])) {
        this.startVote();
      }
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
      if (this.revoteCandidates && !this.revoteCandidates.includes(target)) return;
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

    // -- Le Fantôme devine
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
    // On ne relance que si la table est jouable ; sinon on reste sur l'écran de fin.
    if (this.players.size < 3) return false;
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
      // L'Intrus ne sait pas qu'il est l'Intrus : avant la fin (ou son
      // élimination, où son rôle est révélé à tous), il est vu comme civil.
      const roleKnown = this.phase === "game-over" || me.isEliminated;
      base.myRole = me.role === "undercover" && !roleKnown ? "civil" : me.role;
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

    // En phase d'attente, la liste des "joueurs de la partie" n'existe pas
    // encore (elle est initialisée dans start()). On retombe sur la liste
    // brute des joueurs connectés (héritée de BaseGame) pour que le lobby
    // affiche tout le monde.
    const playersPayload = this.phase === "waiting"
      ? Array.from(this.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
          score: 0,
          isEliminated: false,
          hasClue: false,
          hasVoted: false,
          ready: false,
          clue: null,
          eliminatedRound: null,
          role: null,
          word: null,
        }))
      : Array.from(this.gamePlayers.values()).map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          isEliminated: p.isEliminated,
          hasClue: p.hasClue,
          hasVoted: p.votedFor !== null,
          ready: this.readyIds.has(p.id),
          clue: p.clue,
          eliminatedRound: p.eliminatedRound,
          role: revealAll
            ? p.role
            : revealEliminated && p.id === this.eliminatedThisRound
            ? p.role
            : null,
          word: revealAll
            ? p.word
            : revealEliminated && p.id === this.eliminatedThisRound
            ? p.word
            : null,
        }));

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
      revoteCandidates: this.revoteCandidates,
      tieCandidates: this.tieCandidates,
      voteTally,
      clueHistory: this.clueHistory,
      civilWord: revealAll ? this.civilWord : null,
      undercoverWord: revealAll ? this.undercoverWord : null,
      lastGuess: this.lastGuess,
      lastGuessCorrect: this.lastGuessCorrect,
      endReason: this.endReason,
      players: playersPayload,
    };
  }

  getState(): Record<string, unknown> {
    // Vue "publique" sans personnalisation (fallback)
    return this.buildPublicState();
  }

  cleanup() {
    this.clearTimeouts();
    this.stopTimer();
    this.clearBotTimeouts();
  }
}
