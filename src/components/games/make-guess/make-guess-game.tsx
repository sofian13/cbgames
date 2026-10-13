"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot, type MascotColor } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { registerSoftReplay } from "@/lib/game-replay";
import { getSavedPlayers, savePlayers } from "@/lib/saved-players";
import { ArrowRight, Check, Crown, Plus, Undo2, X } from "lucide-react";
import { GameIconBadge, GameIconButton, GameInlineIcon } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { TopRightControls } from "@/components/games/patate/rules-sheet";
import { C, Chip, DISPLAY, INK, KitStyles, SectionTitle, SoftLink, StickerBtn, StickerCard, StickerScreen, BOTTOM_PAD, dotted, sticker } from "@/components/games/patate/sticker-kit";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";

const RULES = [
  "Faites des équipes de 2.",
  "L'un tient le tél et décrit le mot sans le dire.",
  "L'autre devine, sans voir l'écran.",
  "Trouvé = 1 point. Bloqué ? Passe au suivant.",
];
const ACCENT = "#FFD23F";

// Couleurs de blob par équipe (DA du site).
const TEAM_BLOB: MascotColor[] = ["yellow", "sky", "coral", "mint", "pink", "lavender"];

// ── Word lists ─────────────────────────────────────────────

const WORDS_OBJECTS = [
  "Parapluie", "Aspirateur", "Trampoline", "Skateboard", "Télescope",
  "Boussole", "Hamac", "Toboggan", "Marionnette", "Sablier",
  "Cerf-volant", "Monocle", "Catapulte", "Périscope", "Sifflet",
  "Échasses", "Kaléidoscope", "Métronome", "Pendule", "Entonnoir",
  "Briquet", "Ciseaux", "Ampoule", "Cravate", "Lunettes",
  "Réveil", "Cadenas", "Extincteur", "Bouée", "Dé",
  "Jumelles", "Baguette magique", "Pansement", "Stéthoscope", "Antenne",
  "Hameçon", "Échelle", "Loupe", "Boomerang", "Haltère",
  "Lampe", "Valise", "Horloge", "Bouteille", "Verre",
  "Assiette", "Fourchette", "Cuillère", "Couteau", "Casserole",
  "Poêle", "Frigo", "Four", "Micro-ondes", "Canapé",
  "Couverture", "Matelas", "Rideau", "Tapis", "Balai",
  "Seau", "Éponge", "Savon", "Serviette", "Baignoire",
  "Brosse à dents", "Peigne", "Parfum", "Shampoing", "Dentifrice",
  "Rasoir", "Sac à dos", "Brouette", "Marteau", "Tournevis",
  "Clou", "Perceuse", "Scie", "Pelle", "Râteau",
  "Tondeuse", "Arrosoir", "Tiroir", "Panier", "Allumette",
  "Lanterne", "Chargeur", "Prise électrique", "Calendrier", "Globe",
  "Pinceau", "Crayon", "Gomme", "Règle", "Compas",
  "Calculatrice", "Imprimante", "Clavier", "Écouteurs", "Vinyle",
  "Cassette", "Clé USB", "Veste", "Manteau", "Pull",
  "Chemise", "Pantalon", "Short", "Chaussettes", "Baskets",
  "Sandales", "Chapeau", "Gants", "Ceinture", "Maillot de bain",
];

const WORDS_ANIMALS = [
  "Hippopotame", "Caméléon", "Ornithorynque", "Flamant rose", "Hérisson",
  "Paresseux", "Tatou", "Colibri", "Narval", "Capybara",
  "Salamandre", "Toucan", "Iguane", "Scarabée", "Koala",
  "Okapi", "Axolotl", "Pangolin", "Suricate", "Lion",
  "Dauphin", "Lapin", "Girafe", "Serpent", "Pingouin",
  "Cheval", "Crocodile", "Panda", "Loup", "Tigre",
  "Araignée", "Scorpion", "Souris", "Rat", "Crevette",
  "Homard", "Hibou", "Chouette", "Aigle", "Requin",
  "Baleine", "Tortue", "Perroquet", "Renard", "Cerf",
  "Ours", "Phoque", "Méduse", "Papillon", "Mouche",
  "Fourmi", "Escargot", "Grenouille", "Sanglier", "Bison",
  "Autruche", "Pieuvre", "Corbeau", "Chien", "Chat",
  "Éléphant", "Zèbre", "Vache", "Mouton", "Chèvre",
  "Cochon", "Hamster", "Écureuil", "Kangourou", "Crabe",
  "Pigeon", "Moineau", "Paon", "Cygne", "Canard",
  "Poule", "Coq", "Abeille", "Bourdon", "Guêpe",
  "Coccinelle", "Luciole", "Libellule", "Sauterelle", "Chenille",
  "Tarentule", "Gecko", "Cobra", "Anaconda", "Hippocampe",
  "Raie", "Anguille", "Saumon", "Requin marteau", "Orque",
  "Cachalot", "Lamantin", "Morse", "Otarie", "Albatros",
  "Mouette", "Gorille", "Chimpanzé", "Orang-outan", "Lémurien",
  "Panda roux", "Raton laveur", "Blaireau", "Furet", "Hermine",
  "Chinchilla", "Gazelle", "Antilope", "Buffle", "Chameau",
];

const WORDS_FAMOUS = [
  "Napoléon", "Cléopâtre", "Einstein", "Mozart", "Picasso",
  "Shakespeare", "Mandela", "Charlie Chaplin", "Gandhi", "Marie Curie",
  "Jules César", "Marco Polo", "Beethoven", "Van Gogh", "Darwin",
  "Aristote", "Léonard de Vinci", "Molière", "Voltaire", "Pasteur",
  "Zidane", "Ronaldo", "Messi", "Mbappé", "Beyoncé",
  "Rihanna", "Drake", "Eminem", "Kanye West", "Elon Musk",
  "Steve Jobs", "Neymar", "Maradona", "Pelé", "Federer",
];

const WORDS_ACTIONS = [
  "Jongler", "Éternuer", "Ronfler", "Plonger", "Escalader",
  "Surfer", "Patiner", "Galoper", "Danser le tango", "Faire du mime",
  "Siffler", "Applaudir", "Ramper", "Méditer", "Bâiller",
  "Tricoter", "Souder", "Pêcher", "Déménager", "Négocier",
  "Courir", "Dormir", "Chanter", "Sauter", "Cuisiner",
  "Nager", "Pleurer", "Danser", "Conduire",
  "Voler", "Trébucher", "Embrasser", "Draguer", "Tricher",
  "Mentir", "Vomir", "Accoucher", "Pirater", "Cambrioler",
  "Kidnapper", "Hypnotiser", "Exorciser", "Ressusciter", "Twerker",
];

const WORDS_PLACES = [
  "Pyramides", "Tour Eiffel", "Colisée", "Muraille de Chine", "Machu Picchu",
  "Taj Mahal", "Statue de la Liberté", "Big Ben", "Acropole", "Chutes du Niagara",
  "Mont Blanc", "Sahara", "Amazonie", "Antarctique", "Hollywood",
  "Las Vegas", "Venise", "Tokyo", "Dubaï", "Tombouctou",
  "École", "Plage", "Hôpital", "Cinéma", "Forêt",
  "Restaurant", "Aéroport", "Montagne", "Supermarché", "Musée",
  "Paris", "Londres", "Bretagne", "Normandie",
  "Marseille", "Berlin", "Ibiza", "Amsterdam", "Bangkok",
  "Bali", "Mexique", "Maroc", "Égypte", "Japon",
  "Prison", "Casino", "Discothèque", "Stade", "Cimetière",
  "Gare", "Port", "Pont", "Tunnel", "Autoroute",
  "Village", "Immeuble", "Bibliothèque", "Banque", "Château",
  "Grenier", "Cave", "Volcan", "Désert", "Jungle",
  "Île", "Lac", "Rivière", "Océan", "Grotte",
  "Falaise", "Glacier", "Banquise", "Lagon", "Archipel",
  "Caserne de pompiers", "Ambassade", "Mairie", "Boulangerie", "Pharmacie",
];

const WORDS_NATURE = [
  "Soleil", "Lune", "Étoile", "Planète", "Comète",
  "Astéroïde", "Galaxie", "Trou noir", "Constellation", "Météorite",
  "Arc-en-ciel", "Orage", "Éclair", "Tempête", "Brouillard",
  "Nuage", "Neige", "Marée", "Vague", "Geyser",
  "Fossile", "Cristal", "Diamant", "Rubis", "Émeraude",
  "Perle", "Corail", "Racine", "Feuille", "Graine",
  "Pollen", "Équateur", "Gravité", "Électricité", "Aimant",
  "ADN", "Bactérie", "Virus", "Atome", "Tornade",
  "Séisme", "Avalanche", "Cascade", "Coucher de soleil", "Éclipse",
];

const WORDS_LEGENDS = [
  "Dragon", "Sorcier", "Épée", "Bouclier", "Chevalier",
  "Roi", "Reine", "Princesse", "Donjon", "Trésor",
  "Couronne", "Magie", "Sortilège", "Licorne", "Sirène",
  "Fée", "Ogre", "Troll", "Lutin", "Elfe",
  "Potion", "Grimoire", "Balai volant", "Tapis volant", "Génie",
  "Momie", "Zombie", "Cyclope", "Minotaure", "Phénix",
];

const WORDS_EXPRESSIONS = [
  "Avoir le cafard", "Poser un lapin", "Tomber dans les pommes",
  "Avoir la chair de poule", "Couper les cheveux en quatre",
  "Mettre les pieds dans le plat", "Se noyer dans un verre d'eau",
  "Prendre ses jambes à son cou", "Avoir un poil dans la main",
  "Tirer les vers du nez", "Donner sa langue au chat",
  "Être dans la lune", "Coûter les yeux de la tête",
  "Avoir le cœur sur la main", "Raconter des salades",
  "Mettre la main à la pâte", "Casser les pieds",
  "Avoir la tête dans les nuages", "Poser une colle",
  "Avoir un chat dans la gorge",
];

const WORDS_MOVIES = [
  "Game of Thrones", "Breaking Bad", "Titanic", "Star Wars", "Harry Potter",
  "Le Roi Lion", "Jurassic Park", "Stranger Things", "The Office", "Friends",
  "Matrix", "Inception", "Shrek", "Avatar", "Batman",
  "Squid Game", "La Casa de Papel", "Peaky Blinders", "Naruto", "Dragon Ball",
];

const WORDS_FOOD = [
  "Croissant", "Sushi", "Fondue", "Ratatouille", "Tiramisu",
  "Guacamole", "Bretzel", "Churros", "Bruschetta", "Macaron",
  "Crème brûlée", "Tartare", "Raclette", "Pain au chocolat", "Éclair au chocolat",
  "Mille-feuille", "Profiterole", "Galette des rois", "Crêpe", "Baba au rhum",
  "Pizza", "Banane", "Chocolat", "Burger", "Fromage",
  "Pastèque", "Bonbon", "Gâteau", "Soda", "Barbe à papa",
  "Café", "Thé", "Bière", "Vin", "Caramel",
  "Pomme", "Poire", "Ananas", "Fraise", "Framboise",
  "Beurre", "Tarte", "Kebab", "Tacos", "Popcorn",
  "Donut", "Pancake", "Omelette", "Steak", "Jambon",
  "Mozzarella", "Wasabi", "Piment", "Ketchup", "Mayonnaise",
  "Moutarde", "Cerise", "Mangue", "Kiwi", "Raisin",
  "Melon", "Citron", "Pêche", "Abricot", "Myrtille",
  "Grenade", "Noix de coco", "Cacahuète", "Pistache", "Pain",
  "Yaourt", "Riz", "Pâtes", "Sandwich", "Soupe",
  "Poulet rôti", "Frites", "Biscuit", "Glace", "Sucette",
];

const WORDS_SIMPLE = [
  "Chat", "Voiture", "Soleil", "Bébé", "Porte",
  "Eau", "Main", "Livre", "Lit", "Ballon",
  "Chaise", "Téléphone", "Miroir", "Valise", "Montre",
  "Bougie", "Casque", "Stylo", "Oreiller", "Parapluie",
  "Chien", "Maison", "Lune", "École", "Table",
  "Ordinateur", "Fenêtre", "Clé", "Musique", "Danse",
  "Film", "Caméra", "Famille", "Ami", "Amour",
  "Vacances", "Cadeau", "Neige", "Pluie", "Orage",
  "Fleur", "Arbre", "Poisson", "Café", "Glace",
  "Jardin", "Bureau", "Bateau", "Fusée", "Robot",
  "Magicien", "Pirate", "Chevalier", "Couronne", "Trésor",
  "Carte", "Vélo", "Train", "Avion",
  "Piscine", "Douche", "Cendrier", "Tatouage", "Piercing",
  "Cicatrice", "Béquille", "Alarme", "Sonnette", "Micro",
  "Enceinte", "Télévision", "Manette", "Casquette", "Écharpe",
  "Bus", "Métro", "Moto", "Camion", "Hélicoptère",
];

const WORDS_JOBS = [
  "Médecin", "Pompier", "Professeur", "Policier", "Cuisinier",
  "Pilote", "Coiffeur", "Avocat", "Boulanger", "Journaliste",
  "Dentiste", "Plombier", "Facteur", "Astronaute", "Arbitre",
  "Barman", "DJ", "Tatoueur", "Boucher", "Pharmacien",
  "Notaire", "Architecte", "Vétérinaire", "Éboueur", "Chauffeur de taxi",
  "Infirmier", "Serveur", "Juge", "Ingénieur", "Musicien",
  "Acteur", "Réalisateur", "Photographe", "Scientifique", "Maire",
  "Jardinier", "Électricien", "Mécanicien", "Sauveteur", "Clown",
];

const WORDS_FUN = [
  "GPS", "Photocopieuse", "Mariage", "Selfie", "Vampire",
  "Trottinette", "Embouteillage", "Anniversaire", "Fantôme", "Loup-garou",
  "Camping", "Glamping", "Moustache", "Barbe", "Rire",
  "Divorce", "Héritage", "Procès", "Amende", "Contravention",
  "Grève", "Manifestation", "Panique", "Cauchemar", "Insomnie",
  "Gueule de bois", "Karma", "Complot", "Rumeur", "Scandale",
  "Hoquet", "Fou rire", "Chatouilles", "Coup de soleil", "Déjà-vu",
];

const WORDS_ABSTRACT = [
  "Jalousie", "Fierté", "Honte", "Courage", "Espoir",
  "Doute", "Liberté", "Silence", "Écho", "Mensonge",
  "Vérité", "Hasard", "Destin", "Souvenir", "Rêve",
  "Imagination", "Futur", "Passé", "Enfance", "Vieillesse",
  "Mystère", "Énigme", "Secret", "Colère", "Tristesse",
  "Joie", "Peur", "Surprise", "Stress", "Nostalgie",
];

// Thème descriptif (faire deviner un logo / une marque), non coché par défaut.
const WORDS_BRANDS = [
  "Netflix", "YouTube", "iPhone", "Samsung", "Instagram",
  "TikTok", "McDonald's", "Burger King", "Spotify", "Deezer",
  "WhatsApp", "Telegram", "Google", "Bing", "Tinder", "Bumble",
  "Coca-Cola", "Pepsi", "Nutella", "Snickers", "Tabasco",
  "Lego", "Ikea", "Nike", "Adidas", "Amazon",
];

const WORDS_CULTURE = [
  "Batman", "Superman", "Naruto", "Sasuke", "Goku", "Vegeta",
  "Luffy", "Zoro", "One Piece", "Bleach", "Manga", "Comics",
  "Football", "Rugby", "Tennis", "Badminton", "Ski", "Snowboard",
  "Karaté", "Judo", "Opéra", "Ballet", "Guitare", "Piano",
  "Violon", "Trompette", "Saxophone", "Batterie",
  "Pokémon", "Zelda", "Mario", "Minecraft", "Fortnite",
  "GTA", "FIFA", "Tetris", "Pac-Man", "Sonic",
  "Volley", "Golf", "Surf", "Natation", "Plongée",
  "Escalade", "Marathon", "Ping-pong", "Boxe", "Concert",
];

const WORDS_ADULT = [
  // Coquin mais jamais explicite (review App Store 18+)
  "Lingerie", "String", "Caleçon", "Porte-jarretelles", "Nuisette",
  "Préliminaires", "Suçon", "Câlin", "Bisou dans le cou", "Massage",
  "Fantasme", "Menottes", "Strip-tease", "Plan à trois", "Coup d'un soir",
  "Walk of shame", "Ex toxique", "Plan cul", "Sexto", "Nude",
  "Tromperie", "Adultère", "Amante", "Amant", "Jalousie",
  "Tentation", "Désir", "Chaleur", "Soupir", "Morsure",
  "Griffure", "Secret", "Alibi", "Webcam", "Sauna",
  "Jacuzzi", "Hôtel", "Love room", "Chambre d'hôtel", "Nuit de noces",
  "Lune de miel", "Speed dating", "Appli de rencontre", "Premier rendez-vous", "Râteau",
  "Friendzone", "Crush", "Ghosting", "Drague", "Clin d'œil",
  "Slow", "Danse collé-serré", "Saint-Valentin", "Pétales de rose", "Bougies parfumées",
  "Huile de massage", "Talons aiguilles", "Bas résille", "Body", "Peignoir",
];

const THEMES: { id: string; label: string; emoji: string; words: string[] }[] = [
  { id: "simple", label: "Facile", emoji: "🟢", words: WORDS_SIMPLE },
  { id: "objects", label: "Objets", emoji: "🔧", words: WORDS_OBJECTS },
  { id: "animals", label: "Animaux", emoji: "🐾", words: WORDS_ANIMALS },
  { id: "famous", label: "Célébrités", emoji: "⭐", words: WORDS_FAMOUS },
  { id: "actions", label: "Actions", emoji: "🏃", words: WORDS_ACTIONS },
  { id: "places", label: "Lieux", emoji: "📍", words: WORDS_PLACES },
  { id: "nature", label: "Nature & espace", emoji: "🌍", words: WORDS_NATURE },
  { id: "legends", label: "Contes & légendes", emoji: "🐉", words: WORDS_LEGENDS },
  { id: "expressions", label: "Expressions", emoji: "💬", words: WORDS_EXPRESSIONS },
  { id: "movies", label: "Films/Séries", emoji: "🎬", words: WORDS_MOVIES },
  { id: "food", label: "Nourriture", emoji: "🍕", words: WORDS_FOOD },
  { id: "jobs", label: "Métiers", emoji: "👷", words: WORDS_JOBS },
  { id: "fun", label: "Drôle", emoji: "😂", words: WORDS_FUN },
  { id: "abstract", label: "Émotions & idées", emoji: "💭", words: WORDS_ABSTRACT },
  { id: "culture", label: "Culture Pop", emoji: "🎮", words: WORDS_CULTURE },
  { id: "brands", label: "Marques & logos", emoji: "🏷️", words: WORDS_BRANDS },
  { id: "adult", label: "18+", emoji: "🔞", words: WORDS_ADULT },
];

// Thèmes non cochés par défaut (et exclus de « Tout mélanger ») : à activer volontairement.
const OPT_IN_THEME_IDS = ["brands", "adult"];
const DEFAULT_THEME_IDS = THEMES.map((t) => t.id).filter((id) => !OPT_IN_THEME_IDS.includes(id));

function getWordsForThemes(selectedIds: string[]): string[] {
  // Aucun thème coché = aucun mot. Dédoublonnage insensible à la casse
  // (un même mot peut apparaître dans plusieurs thèmes).
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of THEMES) {
    if (!selectedIds.includes(t.id)) continue;
    for (const w of t.words) {
      const key = w.toLocaleLowerCase("fr");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(w);
    }
  }
  return out;
}

// Taille de police adaptative pour le mot à faire deviner (375 px de large).
function wordFontSize(word: string): number {
  const longest = Math.max(...word.split(/\s+/).map((w) => w.length));
  if (longest > 13) return 30;
  if (longest > 10) return 36;
  if (word.length > 18) return 36;
  return 46;
}

// ── Types ──────────────────────────────────────────────────

interface Team {
  name: string;
  player1: string;
  player2: string;
}

interface WordResult {
  word: string;
  correct: boolean;
}

interface TurnResult {
  teamIndex: number;
  round: number;
  words: WordResult[];
  score: number;
}

type Phase = "setup" | "pre-turn" | "playing" | "turn-result" | "round-summary" | "game-over";

// ── Helpers ────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ── Component ──────────────────────────────────────────────

export default function MakeGuessGame({
  roomCode,
  playerId,
  playerName,
  onReturnToLobby,
}: GameProps) {
  // ── Setup state ──
  // Équipes pré-remplies avec la dernière bande (mémoire des prénoms), 2 par équipe
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = getSavedPlayers();
    const count = Math.max(2, Math.floor(saved.length / 2));
    return Array.from({ length: count }, (_, i) => ({
      name: `Équipe ${i + 1}`,
      player1: saved[i * 2] ?? "",
      player2: saved[i * 2 + 1] ?? "",
    }));
  });
  const [timerDuration, setTimerDuration] = useState(60);
  const [totalRounds, setTotalRounds] = useState(1);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([...DEFAULT_THEME_IDS]);

  // ── Game state ──
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  // Dans une manche : passage 0 → le joueur 1 de chaque équipe fait deviner,
  // passage 1 → le joueur 2. Une manche = chaque joueur fait deviner une fois.
  const [subTurn, setSubTurn] = useState<0 | 1>(0);
  const [wordPool, setWordPool] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [turnWords, setTurnWords] = useState<WordResult[]>([]);
  const [allResults, setAllResults] = useState<TurnResult[]>([]);
  const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null);
  const [wordAnim, setWordAnim] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived ──
  const currentTeam = teams[currentTeamIndex];
  const describerIsPlayer1 = subTurn === 0;
  const describer = currentTeam
    ? describerIsPlayer1
      ? currentTeam.player1
      : currentTeam.player2
    : "";
  const guesser = currentTeam
    ? describerIsPlayer1
      ? currentTeam.player2
      : currentTeam.player1
    : "";

  // ── Timer logic ──
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const endTurn = useCallback(() => {
    stopTimer();
    setPhase("turn-result");
  }, [stopTimer]);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((time) => {
          const next = Math.max(0, time - 1);
          if (next === 0) {
            stopTimer();
            setPhase("turn-result");
          }
          return next;
        });
      }, 1000);
      return () => stopTimer();
    }
  }, [phase, stopTimer]);

  // ── Sons : préchargés, tic-tac sur les 10 dernières secondes, cloche à la fin ──
  useEffect(() => {
    preloadSfx(["tick", "tock", "bell", "success", "whooshdown", "back", "gong", "win", "powerup", "ding"]);
  }, []);
  useEffect(() => {
    if (phase !== "playing" && !(phase === "turn-result" && timeLeft === 0)) return;
    if (timeLeft === 0) playSfx("bell", { volume: 0.8 });
    else if (timeLeft <= 10) playSfx(timeLeft % 2 ? "tick" : "tock", { volume: 0.6, rate: 1 + (10 - timeLeft) * 0.04 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);
  useEffect(() => {
    if (phase === "game-over") playCombo("fanfare");
  }, [phase]);

  // ── Setup handlers ──
  const updateTeam = useCallback(
    (index: number, field: keyof Team, value: string) => {
      setTeams((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
    },
    []
  );

  const addTeam = useCallback(() => {
    setTeams((prev) => [
      ...prev,
      {
        name: `Équipe ${prev.length + 1}`,
        player1: "",
        player2: "",
      },
    ]);
  }, []);

  const removeTeam = useCallback((index: number) => {
    setTeams((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const allThemesSelected = DEFAULT_THEME_IDS.every((id) => selectedThemes.includes(id));
  const canStart =
    teams.length >= 2 &&
    teams.every((t) => t.name.trim() && t.player1.trim() && t.player2.trim()) &&
    getWordsForThemes(selectedThemes).length > 0;

  const toggleTheme = useCallback((id: string) => {
    setSelectedThemes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  // Toggle global : tout cocher (hors thèmes opt-in « Marques » et « 18+ ») ou tout décocher.
  const selectAllThemes = useCallback(() => {
    setSelectedThemes((prev) =>
      DEFAULT_THEME_IDS.every((id) => prev.includes(id))
        ? []
        : [...DEFAULT_THEME_IDS, ...prev.filter((id) => OPT_IN_THEME_IDS.includes(id))]
    );
  }, []);

  const startGame = useCallback(() => {
    savePlayers(teams.flatMap((t) => [t.player1, t.player2]));
    const shuffled = shuffleArray(getWordsForThemes(selectedThemes));
    setWordPool(shuffled);
    setWordIndex(0);
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setSubTurn(0);
    setAllResults([]);
    setPhase("pre-turn");
  }, [selectedThemes, teams]);

  // ── Turn handlers ──
  const startTurn = useCallback(() => {
    setTimeLeft(timerDuration);
    setTurnWords([]);
    playSfx("gong", { volume: 0.55, rate: 1.2 });
    setPhase("playing");
    setWordAnim(true);
  }, [timerDuration]);

  const handleCorrect = useCallback(() => {
    if (phase !== "playing" || timeLeft <= 0) return;
    const word = wordPool[wordIndex];
    if (!word) {
      endTurn();
      return;
    }
    playSfx("success", { volume: 0.7 });
    setTurnWords((prev) => [...prev, { word, correct: true }]);
    setWordIndex((i) => i + 1);
    setFlashColor("green");
    setWordAnim(false);
    setTimeout(() => {
      setWordAnim(true);
      setFlashColor(null);
    }, 200);
  }, [phase, timeLeft, wordPool, wordIndex, endTurn]);

  const handlePass = useCallback(() => {
    if (phase !== "playing" || timeLeft <= 0) return;
    const word = wordPool[wordIndex];
    if (!word) {
      endTurn();
      return;
    }
    playSfx("whooshdown", { volume: 0.55 });
    setTurnWords((prev) => [...prev, { word, correct: false }]);
    setWordIndex((i) => i + 1);
    setFlashColor("red");
    setWordAnim(false);
    setTimeout(() => {
      setWordAnim(true);
      setFlashColor(null);
    }, 200);
  }, [phase, timeLeft, wordPool, wordIndex, endTurn]);

  // Annule le dernier tap (mauvais bouton) : le mot revient à l'écran.
  const handleUndo = useCallback(() => {
    if (phase !== "playing" || turnWords.length === 0) return;
    playSfx("back", { volume: 0.6 });
    setTurnWords((prev) => prev.slice(0, -1));
    setWordIndex((i) => Math.max(0, i - 1));
    setFlashColor(null);
    setWordAnim(true);
  }, [phase, turnWords.length]);

  // « Mot nul ? » : on saute le 1er mot du tour sans le compter (avant toute réponse)
  const handleReroll = useCallback(() => {
    if (phase !== "playing" || turnWords.length > 0) return;
    setWordIndex((i) => i + 1);
    setWordAnim(true);
  }, [phase, turnWords.length]);

  const turnScore = turnWords.filter((w) => w.correct).length;

  // ── Post-turn navigation ──
  const nextTeam = useCallback(() => {
    // Save turn result
    const result: TurnResult = {
      teamIndex: currentTeamIndex,
      round: currentRound,
      words: turnWords,
      score: turnWords.filter((w) => w.correct).length,
    };
    setAllResults((prev) => [...prev, result]);

    const nextIdx = currentTeamIndex + 1;
    if (nextIdx < teams.length) {
      // More teams this pass
      setCurrentTeamIndex(nextIdx);
      setPhase("pre-turn");
    } else if (subTurn === 0) {
      // Second passage : les joueurs 2 font deviner
      setSubTurn(1);
      setCurrentTeamIndex(0);
      setPhase("pre-turn");
    } else {
      // Round finished
      if (currentRound < totalRounds) {
        setPhase("round-summary");
      } else {
        // All rounds done — save and go to game over
        setPhase("game-over");
      }
    }
  }, [currentTeamIndex, currentRound, teams.length, totalRounds, turnWords, subTurn]);

  const nextRound = useCallback(() => {
    setCurrentRound((r) => r + 1);
    setCurrentTeamIndex(0);
    setSubTurn(0);
    setPhase("pre-turn");
  }, []);

  const resetGame = useCallback(() => {
    setPhase("setup");
    setAllResults([]);
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setSubTurn(0);
    setWordIndex(0);
  }, []);

  const replay = useCallback(() => {
    startGame();
  }, [startGame]);

  // « Relancer la partie » (menu paramètres) : revient au setup en GARDANT les
  // noms d'équipes/joueurs + les réglages (pas besoin de tout réécrire).
  useEffect(() => {
    registerSoftReplay(() => resetGame());
    return () => registerSoftReplay(null);
  }, [resetGame]);

  // ── Final scores (for game-over, include last turn) ──
  const finalScores = teams.map((t, tIdx) => {
    // allResults already contains everything by the time we reach game-over
    const score = allResults
      .filter((r) => r.teamIndex === tIdx)
      .reduce((sum, r) => sum + r.score, 0);
    return { name: t.name, score, idx: tIdx };
  });

  const sortedFinal = [...finalScores].sort((a, b) => b.score - a.score);

  // ── Round summary scores ──
  const roundSummaryScores = teams.map((t, tIdx) => {
    const score = allResults
      .filter((r) => r.teamIndex === tIdx)
      .reduce((sum, r) => sum + r.score, 0);
    return { name: t.name, score };
  });

  // ── Render ───────────────────────────────────────────────
  const controls = <TopRightControls title="Fais Deviner" rules={RULES} accent={ACCENT} />;
  const input = (bg: string, big = false): React.CSSProperties => ({
    ...sticker(bg, { radius: 16, shadow: 0, border: 2.5 }),
    ...(big ? DISPLAY : {}),
    fontSize: big ? 20 : 17,
    fontWeight: big ? 700 : 600,
  });
  const words = getWordsForThemes(selectedThemes).length;

  // ── SETUP ──
  if (phase === "setup") {
    return (
      <StickerScreen bg={C.night}>
        {controls}
        <div className="flex items-end justify-center gap-1">
          <Mascot size={52} color="sky" mood="thinking" delay={0.15} shadow={false} />
          <Mascot size={80} color="yellow" mood="happy" arms cheering shadow={false} />
          <Mascot size={52} color="coral" mood="laughing" delay={0.3} shadow={false} />
        </div>
        <h1 className="mt-2 text-center text-[clamp(46px,13vw,62px)] leading-[0.92]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          Fais Deviner
        </h1>
        <p className="mt-2 text-center text-[17px] font-semibold">Décris, fais deviner, marque des points !</p>

        <StickerCard bg={C.cream} radius={22} shadow={5} tilt={-1} className="mt-5 p-4">
          <p className="text-[21px] leading-tight" style={DISPLAY}>Comment jouer</p>
          <ul className="mt-2 space-y-1.5 text-[15px] font-semibold leading-snug">
            <li>Au moins <b>4 joueurs</b> : 2 équipes de 2, un seul téléphone.</li>
            <li>Celui qui fait deviner <b>tient le tél</b> et décrit le mot sans le dire.</li>
            <li>Son coéquipier devine, <b>sans voir l&apos;écran</b>.</li>
            <li><GameInlineIcon icon={Check} /> trouvé, <GameInlineIcon icon={ArrowRight} /> passer, <GameInlineIcon icon={Undo2} /> annuler une erreur.</li>
          </ul>
        </StickerCard>

        {/* Équipes */}
        <div className="mt-6 w-full space-y-3">
          <SectionTitle>Les équipes</SectionTitle>
          {teams.map((team, i) => (
            <div key={i} className="p-3" style={{ ...sticker(MASCOT_BG[TEAM_BLOB[i % TEAM_BLOB.length]], { radius: 22, shadow: 4 }), transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <Mascot size={38} color={TEAM_BLOB[i % TEAM_BLOB.length]} mood="happy" bob={false} shadow={false} />
                <input
                  type="text" value={team.name} onChange={(e) => updateTeam(i, "name", e.target.value)} placeholder="Nom de l'équipe" aria-label={`Nom de l'équipe ${i + 1}`}
                  className="min-h-12 min-w-0 flex-1 px-3 outline-none" style={input("#fff", true)}
                />
                {teams.length > 2 && <GameIconButton icon={X} label="Supprimer l'équipe" onClick={() => removeTeam(i)} />}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input type="text" value={team.player1} onChange={(e) => updateTeam(i, "player1", e.target.value)} placeholder="Joueur 1" aria-label={`Joueur 1, équipe ${i + 1}`}
                  className="min-h-12 min-w-0 px-3 outline-none" style={input("#fff")} />
                <input type="text" value={team.player2} onChange={(e) => updateTeam(i, "player2", e.target.value)} placeholder="Joueur 2" aria-label={`Joueur 2, équipe ${i + 1}`}
                  className="min-h-12 min-w-0 px-3 outline-none" style={input("#fff")} />
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-1">
            <StickerBtn bg="#fff" onClick={addTeam}><Plus size={18} strokeWidth={3} aria-hidden /> Ajouter une équipe</StickerBtn>
          </div>
        </div>

        {/* Thèmes */}
        <div className="mt-7 w-full">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h2 className="text-[22px] leading-tight" style={DISPLAY}>Les thèmes <span className="text-[16px]" style={{ color: "rgba(255,255,255,0.8)" }}>· {words} mots</span></h2>
            <button type="button" onClick={selectAllThemes} className="zk-push min-h-11 shrink-0 px-3.5 text-[14px] font-bold" style={sticker(allThemesSelected ? C.cream : C.yellow, { radius: 999, shadow: 3, border: 2.5 })}>
              {allThemesSelected ? "Tout retirer" : "Tout mélanger"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => {
              const on = selectedThemes.includes(theme.id);
              return (
                <button key={theme.id} type="button" onClick={() => toggleTheme(theme.id)} aria-pressed={on}
                  className="zk-push flex min-h-11 items-center gap-1.5 px-3.5 text-[15px] font-bold"
                  style={{ ...sticker(on ? (theme.id === "adult" ? C.pink : ACCENT) : C.cream, { radius: 999, shadow: on ? 3 : 2, border: 2.5 }), opacity: on ? 1 : 0.8 }}>
                  {on && <Check size={15} strokeWidth={3.5} aria-hidden />}
                  {theme.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>
            {words === 0 ? "Choisis au moins un thème." : "« Marques & logos » et « 18+ » ne sont pas inclus par défaut."}
          </p>
        </div>

        <div className="mt-6 w-full">
          <SectionTitle>Durée du chrono</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {[30, 60, 90, 120].map((d) => (
              <Chip key={d} on={timerDuration === d} onClick={() => setTimerDuration(d)} onBg={ACCENT} className="whitespace-nowrap px-1">{d === 120 ? "2 min" : `${d} s`}</Chip>
            ))}
          </div>
        </div>
        <div className="mt-6 w-full">
          <SectionTitle>Nombre de manches</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((r) => (
              <Chip key={r} on={totalRounds === r} onClick={() => setTotalRounds(r)} onBg={ACCENT}>{r}</Chip>
            ))}
          </div>
        </div>

        <div className="mt-auto flex w-full flex-col items-center pt-7">
          <StickerBtn big bg={ACCENT} disabled={!canStart} onClick={startGame}>Commencer la partie</StickerBtn>
          {!canStart && (
            <p className="mt-2.5 text-center text-[14px] font-semibold">Remplis tous les noms : au moins 2 équipes de 2 joueurs.</p>
          )}
          <div className="mt-4">
            <IdeaButton game="Fais Deviner" kind="mot" bg={C.cream} />
          </div>
        </div>
      </StickerScreen>
    );
  }

  // ── AVANT LE TOUR ──
  if (phase === "pre-turn" && currentTeam) {
    const blob = TEAM_BLOB[currentTeamIndex % TEAM_BLOB.length];
    return (
      <StickerScreen bg={C.night} center>
        {controls}
        <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker("#fff", { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
          Manche {currentRound}/{totalRounds} · tour {subTurn + 1}/2
        </span>
        <div className="relative z-[1] mt-4 -mb-6">
          <Mascot size={90} color={blob} mood="happy" arms shadow={false} />
        </div>
        <h2 className="max-w-full break-words px-6 pb-2 pt-6 text-center text-[clamp(34px,10vw,48px)] leading-none" style={{ ...sticker(MASCOT_BG[blob], { radius: 24, shadow: 5 }), ...DISPLAY, transform: "rotate(-2deg)" }}>
          {currentTeam.name}
        </h2>
        <div className="mt-6 grid w-full gap-3">
          <StickerCard bg={C.yellow} radius={20} shadow={4} tilt={-1} className="px-4 py-3">
            <p className="text-[15px] font-bold">Fait deviner, tient le tél</p>
            <p className="truncate text-[28px] leading-tight" style={DISPLAY}>{describer}</p>
          </StickerCard>
          <StickerCard bg={C.cream} radius={20} shadow={4} tilt={1} className="px-4 py-3">
            <p className="text-[15px] font-bold">Devine, sans regarder l&apos;écran</p>
            <p className="truncate text-[28px] leading-tight" style={DISPLAY}>{guesser}</p>
          </StickerCard>
        </div>
        <p className="mt-5 text-center text-[16px] font-semibold">Passe le tél à {describer}. {guesser} ne doit pas voir l&apos;écran !</p>
        <div className="mt-6 w-full">
          <StickerBtn big bg={ACCENT} onClick={startTurn}>C&apos;est parti !</StickerBtn>
        </div>
      </StickerScreen>
    );
  }

  // ── EN JEU ──
  if (phase === "playing") {
    const word = wordPool[wordIndex];
    const urgent = timeLeft <= 10;
    return (
      <div className="relative flex h-[100dvh] shrink-0 select-none flex-col" style={{ ...dotted(urgent ? "#5E1640" : C.night), color: "#fff", paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", transition: "background-color .5s" }}>
        <KitStyles />
        {flashColor && (
          <div className="pointer-events-none fixed inset-0 z-50" style={{ background: flashColor === "green" ? "rgba(61,220,151,0.35)" : "rgba(255,107,91,0.35)" }} />
        )}
        {/* Chrono centré (coins du haut laissés à la croix et aux réglages) */}
        <div className="flex flex-col items-center">
          <span className="px-5 py-0.5 tabular-nums leading-tight" style={{ ...sticker(urgent ? C.coral : "#fff", { radius: 999, shadow: 3 }), ...DISPLAY, fontSize: 42 }}>
            {timeLeft}
          </span>
          <span className="mt-2 text-[16px] font-bold">{currentTeam?.name} · {turnScore} pt{turnScore > 1 ? "s" : ""}</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
          {word ? (
            <div key={wordIndex} className={`max-w-full px-5 py-4 text-center ${wordAnim ? "zk-pop" : ""}`} style={{ ...sticker(C.cream, { radius: 26, shadow: 6 }), ["--zk-r" as string]: "-2deg", transform: "rotate(-2deg)" }}>
              <h2 lang="fr" className="break-words hyphens-auto" style={{ ...DISPLAY, fontSize: wordFontSize(word), lineHeight: 1.05 }}>{word}</h2>
            </div>
          ) : (
            <p className="text-[22px]" style={DISPLAY}>Plus de mots !</p>
          )}
          {turnWords.length === 0 ? (
            <div className="mt-6"><RerollButton onClick={handleReroll} label="Mot nul ? Changer de mot" /></div>
          ) : (
            <button
              type="button"
              onClick={handleUndo}
              className="zk-push mt-6 inline-flex min-h-11 items-center gap-2 px-4 text-[15px] font-bold"
              style={sticker("#fff", { radius: 999, shadow: 3, border: 2.5 })}
            >
              <Undo2 size={17} strokeWidth={3} aria-hidden /> Annuler le dernier
            </button>
          )}
        </div>

        {/* Zones de tap */}
        <div className="flex flex-1 items-stretch" style={{ borderTop: `3px solid ${INK}` }}>
          <button type="button" onClick={handleCorrect} className="flex w-1/2 flex-col items-center justify-center active:brightness-110" style={{ background: C.mint, color: INK, borderRight: `3px solid ${INK}`, paddingBottom: BOTTOM_PAD }}>
            <GameIconBadge icon={Check} bg="#fff" size={64} />
            <span className="mt-2 text-[22px]" style={DISPLAY}>Trouvé</span>
          </button>
          <button type="button" onClick={handlePass} className="flex w-1/2 flex-col items-center justify-center active:brightness-110" style={{ background: C.coral, color: INK, paddingBottom: BOTTOM_PAD }}>
            <GameIconBadge icon={ArrowRight} bg="#fff" size={64} />
            <span className="mt-2 text-[22px]" style={DISPLAY}>Passer</span>
          </button>
        </div>
      </div>
    );
  }

  // ── RÉSULTAT DU TOUR ──
  if (phase === "turn-result" && currentTeam) {
    return (
      <StickerScreen bg={C.night}>
        {controls}
        <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker(C.coral, { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
          Temps écoulé !
        </span>
        <h2 className="mt-3 max-w-full truncate text-center text-[40px] leading-none" style={{ ...DISPLAY, textShadow: `3px 3px 0 ${INK}` }}>{currentTeam.name}</h2>
        <div className="mt-3 px-6 py-1.5 text-center" style={{ ...sticker(ACCENT, { radius: 22, shadow: 5 }), transform: "rotate(-2deg)" }}>
          <p className="text-[56px] leading-none" style={DISPLAY}>{turnScore}</p>
          <p className="text-[16px] font-bold">mot{turnScore > 1 ? "s" : ""} trouvé{turnScore > 1 ? "s" : ""}</p>
        </div>
        <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
          {turnWords.map((w, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 text-[15px] font-bold" style={sticker(w.correct ? C.mint : C.cream, { radius: 999, shadow: 2, border: 2.5 })}>
              {w.correct ? <Check size={14} strokeWidth={3.5} aria-hidden /> : <X size={14} strokeWidth={3.5} aria-hidden />} {w.word}
            </span>
          ))}
          {turnWords.length === 0 && <p className="text-[16px] font-semibold">Aucun mot… au prochain tour !</p>}
        </div>
        <div className="mt-auto w-full pt-7">
          <StickerBtn big bg={ACCENT} onClick={nextTeam}>
            {currentTeamIndex + 1 < teams.length ? "Équipe suivante" : subTurn === 0 ? "Tour suivant" : currentRound < totalRounds ? "Voir le récap" : "Résultats finaux"}
          </StickerBtn>
        </div>
      </StickerScreen>
    );
  }

  // ── RÉCAP DE MANCHE ──
  if (phase === "round-summary") {
    const rows = [...roundSummaryScores].map((t, idx) => ({ ...t, idx })).sort((a, b) => b.score - a.score);
    return (
      <StickerScreen bg={C.night} center>
        {controls}
        <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker("#fff", { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
          Fin de la manche {currentRound}
        </span>
        <h2 className="mt-3 text-[48px] leading-none" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>Classement</h2>
        <div className="mt-5 w-full space-y-2">
          {rows.map((t, i) => (
            <div key={t.idx} className="flex items-center gap-3 px-3" style={{ ...sticker(i === 0 ? C.yellow : C.cream, { radius: 18, shadow: 3 }), minHeight: 54 }}>
              <span className="grid w-6 place-items-center text-[20px]" style={DISPLAY}>{i === 0 ? <Crown size={18} strokeWidth={2.8} aria-hidden /> : i + 1}</span>
              <Mascot size={32} color={TEAM_BLOB[t.idx % TEAM_BLOB.length]} mood="happy" bob={false} shadow={false} />
              <span className="min-w-0 flex-1 truncate text-[18px]" style={DISPLAY}>{t.name}</span>
              <span className="text-[20px]" style={DISPLAY}>{t.score}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 w-full">
          <StickerBtn big bg={ACCENT} onClick={nextRound}>Manche {currentRound + 1}</StickerBtn>
        </div>
      </StickerScreen>
    );
  }

  // ── FIN DE PARTIE ──
  const top3 = sortedFinal.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const PODIUM_BG: Record<number, string> = { 1: C.yellow, 2: C.cream, 3: C.coral };
  const heights: Record<number, number> = { 1: 118, 2: 92, 3: 74 };
  return (
    <StickerScreen bg={C.night}>
      {controls}
      <ConfettiBurst count={60} />
      <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker(C.yellow, { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
        Partie terminée
      </span>
      {sortedFinal[0] && (
        <h2 className="mt-3 text-center text-[clamp(36px,10vw,48px)] leading-[0.95]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          {sortedFinal[0].name} l&apos;emporte !
        </h2>
      )}

      {/* Podium */}
      {top3.length >= 2 && (
        <div className="mt-7 grid w-full grid-cols-3 items-end gap-2.5">
          {podiumOrder.map((t) => {
            const place = sortedFinal.indexOf(t) + 1;
            return (
              <div key={t.idx} className="flex flex-col items-center">
                <Mascot size={place === 1 ? 72 : 54} color={TEAM_BLOB[t.idx % TEAM_BLOB.length]} mood="happy" arms cheering={place === 1} crown={place === 1} delay={place * 0.12} shadow={false} />
                <div className="mt-1 flex w-full flex-col items-center pt-2" style={{ ...sticker(PODIUM_BG[place], { radius: 18, shadow: 4 }), borderBottomLeftRadius: 6, borderBottomRightRadius: 6, height: heights[place] }}>
                  <div className="leading-none" style={{ ...DISPLAY, fontSize: place === 1 ? 32 : 24 }}>{place}</div>
                  <div className="mt-1 w-full truncate px-1 text-center text-[14px] font-bold leading-tight">{t.name}</div>
                  <div className="text-[14px] font-bold">{t.score} pt{t.score > 1 ? "s" : ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Classement (4e et +) */}
      {sortedFinal.length > 3 && (
        <div className="mt-4 w-full space-y-2">
          {sortedFinal.slice(3).map((t, i) => (
            <div key={t.idx} className="flex items-center justify-between px-4" style={{ ...sticker(C.cream, { radius: 16, shadow: 3 }), minHeight: 48 }}>
              <span className="text-[16px] font-bold">{i + 4}ᵉ · {t.name}</span>
              <span className="text-[18px]" style={DISPLAY}>{t.score}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex w-full flex-col items-center pt-8">
        <StickerBtn big bg={ACCENT} onClick={replay}>Revanche</StickerBtn>
        <div className="mt-3 grid w-full grid-cols-2 gap-3">
          <StickerBtn bg={C.cream} onClick={resetGame}>Réglages</StickerBtn>
          {onReturnToLobby ? <StickerBtn bg={INK} color="#fff" onClick={onReturnToLobby}>Quitter</StickerBtn> : <span />}
        </div>
        <div className="mt-4">
          <IdeaButton game="Fais Deviner" kind="mot" bg={C.cream} />
        </div>
        <SoftLink onClick={replay}>Mêmes équipes, nouveaux mots</SoftLink>
      </div>
    </StickerScreen>
  );
}

// Fond plein de la carte d'équipe (couleur du blob)
const MASCOT_BG: Record<MascotColor, string> = {
  purple: "#B5A1FF", pink: "#FF8FC8", yellow: "#FFD23F", mint: "#3DDC97",
  sky: "#4ECDC4", coral: "#FF6B5B", lavender: "#B5A1FF", white: "#FFF6E5",
};
