"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { Mascot, MASCOT_COLORS, type MascotColor } from "@/components/Mascot";
import { registerSoftReplay } from "@/lib/game-replay";
import { getSavedPlayers, savePlayers } from "@/lib/saved-players";

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

// ── Background wrapper ─────────────────────────────────────

const BG_GRADIENT =
  "bg-[radial-gradient(circle_at_18%_20%,rgba(80,216,255,0.14),transparent_35%),radial-gradient(circle_at_82%_70%,rgba(99,102,241,0.14),transparent_35%),linear-gradient(145deg,#040424,#05113a_42%,#01072a)]";

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
    setTurnWords((prev) => prev.slice(0, -1));
    setWordIndex((i) => Math.max(0, i - 1));
    setFlashColor(null);
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

  return (
    <div
      className={cn(
        "relative min-h-[100dvh] w-full overflow-hidden text-white",
        BG_GRADIENT
      )}
    >
      {/* Flash overlay */}
      {flashColor && (
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-50 transition-opacity duration-200",
            flashColor === "green" ? "bg-green-500/20" : "bg-red-500/20"
          )}
        />
      )}

      {/* ── SETUP (DA af.games) ───────────────────────────── */}
      {phase === "setup" && (
        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col items-center px-4 pb-10"
          style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 1.5rem)", fontFamily: "var(--font-sans)" }}>
          {/* Fond premium DA */}
          <div className="fixed inset-0 -z-10" style={{ background: "radial-gradient(120% 70% at 50% 0%, rgba(122,78,232,0.25) 0%, transparent 55%), linear-gradient(180deg,#0F0A1F 0%,#1A1230 100%)" }} />

          {/* Hero blobs + titre */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 flex items-end justify-center gap-1">
              <Mascot size={50} color="sky" mood="thinking" delay={0.15} />
              <Mascot size={82} color="yellow" mood="happy" arms cheering delay={0} />
              <Mascot size={50} color="coral" mood="laughing" delay={0.3} />
            </div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">af games · party</p>
            <h1 className="mt-1 font-black text-white" style={{ fontFamily: "var(--font-display)", fontSize: 46, letterSpacing: -2, lineHeight: 0.95 }}>
              Fais <span style={{ background: "linear-gradient(120deg,#FFD23F,#FF3EA5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Deviner</span>
            </h1>
            <p className="mt-2 text-sm text-white/55">Décris, fais deviner, marque des points !</p>
          </div>

          {/* Règles */}
          <div className="mt-6 w-full rounded-2xl p-4 text-sm leading-snug text-white/75" style={{ background: "rgba(255,210,63,0.07)", border: "1px solid rgba(255,210,63,0.25)" }}>
            <p className="mb-1.5 font-mono text-[11px] font-extrabold uppercase tracking-[2px]" style={{ color: "#FFD23F" }}>Comment jouer</p>
            <ul className="space-y-1">
              <li>• Minimum <b className="text-white">4 joueurs</b> : 2 équipes de 2, sur un seul téléphone.</li>
              <li>• Celui qui fait deviner <b className="text-white">tient le téléphone</b> et décrit le mot sans le dire.</li>
              <li>• Son coéquipier devine — il ne doit <b className="text-white">pas voir l&apos;écran</b>.</li>
              <li>• ✓ si trouvé, ➜ pour passer, ↶ pour annuler une erreur.</li>
              <li>• Une manche = chaque joueur fait deviner une fois.</li>
            </ul>
          </div>

          {/* Équipes */}
          <div className="mt-4 w-full space-y-2.5">
            {teams.map((team, i) => (
              <div key={i} className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="mb-2.5 flex items-center gap-3">
                  <Mascot size={36} color={TEAM_BLOB[i % TEAM_BLOB.length]} mood="happy" bob={false} shadow={false} />
                  <input
                    type="text" value={team.name} onChange={(e) => updateTeam(i, "name", e.target.value)} placeholder="Nom de l'équipe"
                    className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-base font-bold text-white outline-none"
                    style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-display)" }}
                  />
                  {teams.length > 2 && (
                    <button onClick={() => removeTeam(i)} aria-label="Supprimer"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: "rgba(255,107,91,0.12)", border: "1px solid rgba(255,107,91,0.3)", color: "#FF8B7A" }}>✕</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <input type="text" value={team.player1} onChange={(e) => updateTeam(i, "player1", e.target.value)} placeholder="Joueur 1"
                    className="min-w-0 rounded-xl px-3 py-2.5 text-base text-white outline-none" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <input type="text" value={team.player2} onChange={(e) => updateTeam(i, "player2", e.target.value)} placeholder="Joueur 2"
                    className="min-w-0 rounded-xl px-3 py-2.5 text-base text-white outline-none" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
            ))}
          </div>

          <button onClick={addTeam} className="mt-3 rounded-xl px-5 py-2.5 text-sm font-bold text-white/80"
            style={{ background: "rgba(122,78,232,0.14)", border: "1px solid rgba(122,78,232,0.4)" }}>
            + Ajouter une équipe
          </button>

          {/* Thèmes */}
          <div className="mt-6 w-full rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/45">Thèmes</span>
              <button onClick={selectAllThemes} className="min-h-[44px] rounded-full px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-wider"
                style={{ background: allThemesSelected ? "rgba(255,210,63,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${allThemesSelected ? "rgba(255,210,63,0.5)" : "rgba(255,255,255,0.12)"}`, color: allThemesSelected ? "#FFD23F" : "rgba(255,255,255,0.6)" }}>
                {allThemesSelected ? "Tout retirer" : "Tout mélanger"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => {
                const isSelected = selectedThemes.includes(theme.id);
                return (
                  <button key={theme.id} onClick={() => toggleTheme(theme.id)}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-bold transition-all"
                    style={{
                      background: isSelected ? "linear-gradient(160deg, rgba(122,78,232,0.28), rgba(0,0,0,0.2))" : "rgba(255,255,255,0.03)",
                      border: isSelected ? "1.5px solid rgba(122,78,232,0.7)" : "1px solid rgba(255,255,255,0.1)",
                      color: isSelected ? "#fff" : "rgba(255,255,255,0.4)",
                    }}>
                    <span style={{ fontSize: 15 }}>{theme.emoji}</span>{theme.label}
                    <span className="text-[11px]" style={{ color: isSelected ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)" }}>{getWordsForThemes([theme.id]).length}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs text-white/40">
              « Marques &amp; logos » et « 18+ » ne sont pas inclus par défaut.
            </p>
            <p className="mt-1 text-xs text-white/40">
              {getWordsForThemes(selectedThemes).length === 0
                ? "Choisis au moins un thème"
                : `${getWordsForThemes(selectedThemes).length} mots sélectionnés`}
            </p>
          </div>

          {/* Options */}
          <div className="mt-4 w-full rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="mb-2 font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/45">Durée du timer</p>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map((d) => {
                const active = timerDuration === d;
                return (
                  <button key={d} onClick={() => setTimerDuration(d)} className="flex-1 rounded-xl py-2.5 text-sm font-black"
                    style={{ background: active ? "linear-gradient(180deg,#FFD23F,#C48800)" : "rgba(255,255,255,0.05)", color: active ? "#1A0E2E" : "rgba(255,255,255,0.6)", border: active ? "1.5px solid transparent" : "1px solid rgba(255,255,255,0.1)", boxShadow: active ? "0 8px 20px rgba(255,210,63,0.3)" : "none", fontFamily: "var(--font-mono, monospace)" }}>
                    {d}s
                  </button>
                );
              })}
            </div>
            <p className="mb-2 mt-4 font-mono text-[10px] font-extrabold uppercase tracking-[2px] text-white/45">Nombre de manches</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((r) => {
                const active = totalRounds === r;
                return (
                  <button key={r} onClick={() => setTotalRounds(r)} className="flex h-11 w-11 items-center justify-center rounded-full text-base font-black"
                    style={{ background: active ? "linear-gradient(180deg,#FFD23F,#C48800)" : "rgba(255,255,255,0.05)", color: active ? "#1A0E2E" : "rgba(255,255,255,0.6)", border: active ? "1.5px solid transparent" : "1px solid rgba(255,255,255,0.1)", boxShadow: active ? "0 8px 20px rgba(255,210,63,0.3)" : "none", fontFamily: "var(--font-display)" }}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Commencer */}
          <button onClick={startGame} disabled={!canStart} className="mt-6 w-full rounded-2xl py-4 text-base font-bold transition active:scale-[0.99]"
            style={{ background: canStart ? "linear-gradient(180deg,#FFD23F,#C48800)" : "rgba(255,255,255,0.06)", color: canStart ? "#1A0E2E" : "rgba(255,255,255,0.35)", boxShadow: canStart ? "0 14px 30px rgba(255,210,63,0.4)" : "none", fontFamily: "var(--font-display)", cursor: canStart ? "pointer" : "not-allowed" }}>
            🎬 Commencer la partie
          </button>
          {!canStart && (
            <p className="mt-2 text-center text-xs text-white/50">Remplis tous les noms : au moins 2 équipes de 2 joueurs (4 joueurs).</p>
          )}
          {onReturnToLobby && (
            <button onClick={onReturnToLobby} className="mt-3 min-h-[44px] px-4 text-sm text-white/50 transition active:text-white/80">Retour au lobby</button>
          )}
        </div>
      )}

      {/* ── PRE-TURN ──────────────────────────────────────── */}
      {phase === "pre-turn" && currentTeam && (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-[max(env(safe-area-inset-top),12px)]">
          <div
            className="w-full max-w-sm rounded-3xl border border-cyan-300/20 bg-black/35 p-6 text-center backdrop-blur-xl"
            style={{ animation: "scaleIn 0.4s ease-out" }}
          >
            <p className="mb-1 font-sans text-xs uppercase tracking-wider text-cyan-200/50">
              Manche {currentRound} / {totalRounds} · Tour {subTurn + 1} / 2
            </p>
            <h2 className="mb-6 break-words font-serif text-3xl font-bold text-cyan-100">
              {currentTeam.name}
            </h2>

            <div className="mb-4 space-y-3">
              <div className="rounded-xl border border-cyan-300/10 bg-cyan-500/5 px-6 py-3">
                <p className="font-sans text-xs uppercase tracking-wider text-cyan-200/60">
                  Fait deviner · tient le téléphone
                </p>
                <p className="font-sans text-xl font-semibold text-cyan-100">
                  {describer}
                </p>
              </div>
              <div className="rounded-xl border border-cyan-300/10 bg-indigo-500/5 px-6 py-3">
                <p className="font-sans text-xs uppercase tracking-wider text-indigo-200/60">
                  Devine · ne regarde pas l&apos;écran
                </p>
                <p className="font-sans text-xl font-semibold text-indigo-100">
                  {guesser}
                </p>
              </div>
            </div>

            <p className="mb-5 text-sm text-cyan-100/60">
              Passe le téléphone à {describer}. {guesser} ne doit pas voir l&apos;écran !
            </p>

            <button
              onClick={startTurn}
              className="press-effect min-h-[48px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 font-sans text-lg font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all active:shadow-cyan-500/40"
            >
              C&apos;est parti !
            </button>
          </div>
        </div>
      )}

      {/* ── PLAYING ───────────────────────────────────────── */}
      {phase === "playing" && (
        <div className="relative flex h-[100dvh] flex-col pb-[env(safe-area-inset-bottom)] pt-[max(env(safe-area-inset-top),12px)]">
          {/* Timer bar (coin haut-droit réservé à l'engrenage) */}
          <div className="relative flex items-center justify-center py-3">
            <div
              className={cn(
                "font-mono text-5xl font-bold tabular-nums",
                timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-100"
              )}
            >
              {timeLeft}
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg border border-cyan-300/10 bg-black/30 px-3 py-1 backdrop-blur-xl">
              <span className="font-mono text-sm text-cyan-200/60">
                {turnScore} pts
              </span>
            </div>
          </div>

          {/* Word display */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
            {wordPool[wordIndex] ? (
              <h2
                lang="fr"
                className={cn(
                  "w-full max-w-full overflow-hidden break-words text-center font-serif font-bold leading-tight text-white hyphens-auto",
                  wordAnim && "animate-[scaleIn_0.25s_ease-out]"
                )}
                style={{ fontSize: wordFontSize(wordPool[wordIndex]) }}
                key={wordIndex}
              >
                {wordPool[wordIndex]}
              </h2>
            ) : (
              <p className="font-sans text-xl text-cyan-200/50">
                Plus de mots !
              </p>
            )}
            <button
              onClick={handleUndo}
              disabled={turnWords.length === 0}
              className="mt-5 flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white/75 transition active:scale-95 active:bg-white/15 disabled:opacity-30"
            >
              ↶ Annuler le dernier
            </button>
          </div>

          {/* Tap zones */}
          <div className="flex flex-1 items-stretch">
            {/* Correct zone (left / green) */}
            <button
              onClick={handleCorrect}
              className="flex w-1/2 flex-col items-center justify-center border-r border-green-400/10 bg-green-500/5 transition-colors active:bg-green-500/20"
            >
              <span className="text-4xl">&#10003;</span>
              <span className="mt-1 font-sans text-sm uppercase tracking-wider text-green-300/70">
                Correct
              </span>
            </button>

            {/* Pass zone (right / red) */}
            <button
              onClick={handlePass}
              className="flex w-1/2 flex-col items-center justify-center bg-red-500/5 transition-colors active:bg-red-500/20"
            >
              <span className="text-4xl">&#10140;</span>
              <span className="mt-1 font-sans text-sm uppercase tracking-wider text-red-300/70">
                Passer
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── TURN RESULT ───────────────────────────────────── */}
      {phase === "turn-result" && currentTeam && (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-[max(env(safe-area-inset-bottom),32px)] pt-[max(env(safe-area-inset-top),32px)]">
          <div
            className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl"
            style={{ animation: "scaleIn 0.4s ease-out" }}
          >
            <h2 className="mb-1 text-center font-serif text-2xl font-bold text-cyan-100">
              {currentTeam.name}
            </h2>
            <p className="mb-6 text-center font-mono text-4xl font-bold text-cyan-300">
              {turnScore} {turnScore === 1 ? "mot" : "mots"}
            </p>

            {/* Word list */}
            <div className="mb-6 max-h-60 space-y-1 overflow-y-auto">
              {turnWords.map((w, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-1.5 font-sans text-sm",
                    w.correct
                      ? "bg-green-500/10 text-green-300"
                      : "bg-white/5 text-gray-400"
                  )}
                >
                  <span>{w.word}</span>
                  <span>{w.correct ? "+" : "-"}</span>
                </div>
              ))}
            </div>

            <button
              onClick={nextTeam}
              className="press-effect min-h-[48px] w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-sans text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all active:shadow-cyan-500/40"
            >
              {currentTeamIndex + 1 < teams.length
                ? "Équipe suivante"
                : subTurn === 0
                ? "Tour suivant"
                : currentRound < totalRounds
                ? "Voir le récap"
                : "Résultats finaux"}
            </button>
          </div>
        </div>
      )}

      {/* ── ROUND SUMMARY ─────────────────────────────────── */}
      {phase === "round-summary" && (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-[max(env(safe-area-inset-bottom),32px)] pt-[max(env(safe-area-inset-top),32px)]">
          <div
            className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-black/35 p-6 backdrop-blur-xl"
            style={{ animation: "scaleIn 0.4s ease-out" }}
          >
            <p className="mb-1 text-center font-sans text-xs uppercase tracking-wider text-cyan-200/50">
              Fin de la manche {currentRound}
            </p>
            <h2 className="mb-6 text-center font-serif text-2xl font-bold text-cyan-100">
              Classement
            </h2>

            <div className="mb-6 space-y-2">
              {[...roundSummaryScores]
                .sort((a, b) => b.score - a.score)
                .map((t, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3",
                      i === 0
                        ? "border-yellow-400/30 bg-yellow-500/10"
                        : "border-cyan-300/10 bg-black/20"
                    )}
                  >
                    <span className="font-sans text-sm text-cyan-100">
                      {i + 1}. {t.name}
                    </span>
                    <span className="font-mono text-lg font-bold text-cyan-300">
                      {t.score}
                    </span>
                  </div>
                ))}
            </div>

            <button
              onClick={nextRound}
              className="press-effect min-h-[48px] w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-sans text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all active:shadow-cyan-500/40"
            >
              Manche {currentRound + 1}
            </button>
          </div>
        </div>
      )}

      {/* ── GAME OVER ─────────────────────────────────────── */}
      {phase === "game-over" && (() => {
        const top3 = sortedFinal.slice(0, 3);
        const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
        const PODIUM_BG: Record<number, string> = {
          1: "linear-gradient(180deg, #FFD23F 0%, #B27800 100%)",
          2: "linear-gradient(180deg, #E8E8E8 0%, #888 100%)",
          3: "linear-gradient(180deg, #FF8B5C 0%, #A04020 100%)",
        };
        const heights: Record<number, number> = { 1: 118, 2: 92, 3: 74 };
        return (
        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col items-center px-4 pb-10"
          style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 2rem)", fontFamily: "var(--font-sans)" }}>
          <div className="fixed inset-0 -z-10" style={{ background: "radial-gradient(120% 70% at 50% 0%, rgba(255,210,63,0.18) 0%, transparent 55%), linear-gradient(180deg,#1A1206 0%,#0F0A1F 100%)" }} />

          <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: "#FFD23F" }}>✦ Partie terminée</p>
          {sortedFinal[0] && (
            <h2 className="mt-1 text-center font-black text-white" style={{ fontFamily: "var(--font-display)", fontSize: 40, letterSpacing: -1.5, lineHeight: 0.95 }}>
              <span style={{ background: "linear-gradient(120deg,#FFD23F,#FF3EA5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{sortedFinal[0].name}</span> l&apos;emporte !
            </h2>
          )}

          {/* Podium */}
          {top3.length >= 2 && (
            <div className="mt-7 grid w-full max-w-md grid-cols-3 items-end gap-2.5">
              {podiumOrder.map((t) => {
                const place = sortedFinal.indexOf(t) + 1;
                return (
                  <div key={t.idx} className="flex flex-col items-center">
                    <Mascot size={place === 1 ? 76 : 56} color={TEAM_BLOB[t.idx % TEAM_BLOB.length]} mood="happy" arms cheering={place === 1} crown={place === 1} delay={place * 0.12} />
                    <div className="mt-2 flex w-full flex-col items-center rounded-t-2xl border border-b-0 pt-2.5"
                      style={{ height: heights[place], background: PODIUM_BG[place], borderColor: "rgba(255,255,255,0.18)" }}>
                      <div className="font-black" style={{ fontFamily: "var(--font-display)", fontSize: place === 1 ? 30 : 22, color: place === 1 ? "#3A2700" : "rgba(0,0,0,0.6)", lineHeight: 1 }}>{place}</div>
                      <div className="mt-1 px-1 text-center text-[11px] font-bold leading-tight" style={{ color: place === 1 ? "#3A2700" : "rgba(0,0,0,0.7)" }}>{t.name}</div>
                      <div className="font-mono text-[11px] font-bold" style={{ color: place === 1 ? "rgba(58,39,0,0.7)" : "rgba(0,0,0,0.55)" }}>{t.score} pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Classement (4e et +) */}
          {sortedFinal.length > 3 && (
            <div className="mt-4 w-full max-w-md space-y-1.5">
              {sortedFinal.slice(3).map((t, i) => (
                <div key={t.idx} className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="text-sm font-bold text-white/85">{i + 4}ᵉ · {t.name}</span>
                  <span className="font-mono text-base font-black text-white">{t.score}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex w-full max-w-md flex-col gap-2.5">
            <button onClick={replay} className="w-full rounded-2xl py-4 text-base font-bold transition active:scale-[0.99]"
              style={{ background: "linear-gradient(180deg,#FFD23F,#C48800)", color: "#1A0E2E", boxShadow: "0 14px 30px rgba(255,210,63,0.4)", fontFamily: "var(--font-display)" }}>
              🔄 Revanche (mêmes équipes)
            </button>
            <div className="flex gap-2.5">
              <button onClick={resetGame} className="flex-1 rounded-2xl py-3 text-sm font-bold text-white/85" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>Nouvelle partie</button>
              {onReturnToLobby && (
                <button onClick={onReturnToLobby} className="flex-1 rounded-2xl py-3 text-sm font-bold text-white/60" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>Menu</button>
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
