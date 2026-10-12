// Mots de « Deviner le Mot » — packs thématiques, contenu original.
// Le pack coquin reste suggestif mais jamais explicite, et décoché par défaut.

export interface WordPack {
  id: string;
  emoji: string;
  name: string;
  adult?: boolean;
  defaultOn?: boolean;
  words: string[];
}

export const PACKS: WordPack[] = [
  {
    id: "animaux",
    emoji: "🦒",
    name: "Animaux",
    defaultOn: true,
    words: [
      "Éléphant", "Girafe", "Crocodile", "Flamant rose", "Koala", "Paon", "Ornithorynque", "Caméléon", "Pangolin", "Axolotl",
      "Narval", "Toucan", "Anaconda", "Hérisson", "Raie manta", "Colibri", "Tatou", "Pieuvre", "Capybara", "Lynx",
      "Panda roux", "Iguane", "Scarabée", "Lion", "Tigre", "Zèbre", "Hippopotame", "Rhinocéros", "Gorille", "Kangourou",
      "Pingouin", "Dauphin", "Baleine", "Requin", "Tortue", "Escargot", "Papillon", "Abeille", "Coccinelle", "Libellule",
      "Autruche", "Aigle", "Hibou", "Perroquet", "Pélican", "Castor", "Loutre", "Renard", "Loup", "Ours polaire",
      "Panthère", "Gazelle", "Suricate", "Cobra", "Méduse", "Furet", "Chauve-souris", "Phoque", "Morse", "Hamster",
      "Lama", "Chameau", "Paresseux", "Moustique", "Fourmi", "Araignée", "Homard", "Crabe", "Poulpe", "Cygne",
      "Dindon", "Chèvre", "Mouton", "Cochon", "Âne", "Poule", "Corbeau", "Pigeon", "Écureuil", "Taupe",
    ],
  },
  {
    id: "bouffe",
    emoji: "🍕",
    name: "Bouffe",
    defaultOn: true,
    words: [
      "Sushi", "Tacos", "Croissant", "Pizza", "Hamburger", "Ramen", "Couscous", "Tiramisu", "Paella", "Fondue",
      "Kebab", "Ceviche", "Pad thaï", "Fish and chips", "Poutine", "Empanada", "Falafel", "Brownie", "Macaron", "Churros",
      "Bœuf bourguignon", "Bibimbap", "Crème brûlée", "Guacamole", "Lasagnes", "Spaghetti", "Risotto", "Gnocchi", "Tartiflette", "Quiche",
      "Crêpe", "Gaufre", "Hot-dog", "Nuggets", "Frites", "Omelette", "Burrito", "Nachos", "Tempura", "Curry",
      "Houmous", "Tajine", "Gyoza", "Donut", "Cheesecake", "Pancakes", "Cookie", "Éclair au chocolat", "Mille-feuille", "Baklava",
      "Tarte Tatin", "Raclette", "Cassoulet", "Croque-monsieur", "Pain perdu", "Barbe à papa", "Pop-corn", "Ratatouille", "Escargots de Bourgogne", "Huîtres",
      "Soupe à l'oignon", "Pot-au-feu", "Galette des rois", "Bûche de Noël", "Mayonnaise", "Moutarde", "Ketchup", "Baguette", "Camembert", "Fromage qui pue",
      "Céréales", "Pâtes au beurre", "Œuf en chocolat", "Brochette", "Salade de fruits", "Smoothie", "Chocolat chaud", "Pastèque", "Avocat", "Ananas",
    ],
  },
  {
    id: "objets",
    emoji: "🧦",
    name: "Objets",
    defaultOn: true,
    words: [
      "Chaussette", "Parapluie", "Brosse à dents", "Grille-pain", "Aspirateur", "Télécommande", "Chargeur", "Coussin", "Lampe torche", "Tire-bouchon",
      "Fer à repasser", "Sèche-cheveux", "Trousseau de clés", "Ventilateur", "Réveil", "Miroir", "Peigne", "Ciseaux", "Agrafeuse", "Calculatrice",
      "Casque audio", "Valise", "Tente", "Hamac", "Trottinette", "Skateboard", "Ballon de foot", "Raquette", "Haltère", "Tapis de yoga",
      "Bougie", "Plante verte", "Cadre photo", "Horloge", "Boîte aux lettres", "Poubelle", "Balai", "Serpillière", "Éponge", "Passoire",
      "Fouet", "Rouleau à pâtisserie", "Micro-ondes", "Machine à laver", "Frigo", "Lave-vaisselle", "Bouilloire", "Cafetière", "Mixeur", "Poêle",
      "Lunettes de soleil", "Montre", "Bague", "Collier", "Ceinture", "Écharpe", "Bonnet", "Gants", "Tongs", "Talons hauts",
      "Coussin péteur", "Boule à facettes", "Bouée canard", "Selfie stick", "Toupie", "Yoyo", "Cerf-volant", "Boomerang", "Loupe", "Boussole",
      "Extincteur", "Échelle", "Marteau", "Tournevis", "Perceuse", "Brouette", "Arrosoir", "Tondeuse", "Nain de jardin", "Barbecue",
    ],
  },
  {
    id: "metiers",
    emoji: "👩‍🚒",
    name: "Métiers",
    defaultOn: true,
    words: [
      "Pompier", "Astronaute", "Chirurgien", "Détective", "Pilote d'avion", "Plombier", "Boulanger", "Architecte", "Vétérinaire", "Photographe",
      "Journaliste", "Électricien", "Avocat", "Pharmacien", "Coach sportif", "Styliste", "Cascadeur", "Sommelier", "Tatoueur", "Apiculteur",
      "Paléontologue", "Ostéopathe", "Professeur", "Infirmier", "Dentiste", "Cuisinier", "Serveur", "Mécanicien", "Jardinier", "Facteur",
      "Policier", "Juge", "Comptable", "Banquier", "Développeur", "Peintre", "Chanteur d'opéra", "Danseuse étoile", "Réalisateur", "Écrivain",
      "Archéologue", "Astronome", "Chimiste", "Marin", "Capitaine de bateau", "Boucher", "Pâtissier", "Fleuriste", "Menuisier", "Maçon",
      "Clown", "Magicien", "Dompteur de lions", "Maître-nageur", "Moniteur de ski", "Guide touristique", "Hôtesse de l'air", "Chauffeur de taxi", "Livreur", "Coiffeur",
      "Influenceur", "Youtubeur", "DJ", "Videur de boîte", "Agent secret", "Pirate", "Chevalier", "Pharaon", "Bûcheron", "Berger",
    ],
  },
  {
    id: "lieux",
    emoji: "🌍",
    name: "Pays & lieux",
    defaultOn: true,
    words: [
      "Japon", "Brésil", "Australie", "Égypte", "Canada", "Inde", "Mexique", "Thaïlande", "Maroc", "Argentine",
      "Norvège", "Grèce", "Islande", "Vietnam", "Portugal", "Nouvelle-Zélande", "Suède", "Cuba", "Sénégal", "Italie",
      "Espagne", "Allemagne", "Chine", "États-Unis", "Royaume-Uni", "Belgique", "Suisse", "Croatie", "Tunisie", "Algérie",
      "Madagascar", "Corée du Sud", "Jamaïque", "Finlande", "Irlande", "Pérou", "Turquie", "Kenya", "Hawaï", "Antarctique",
      "Tour Eiffel", "Pyramides", "Muraille de Chine", "Statue de la Liberté", "Colisée", "Mont-Saint-Michel", "Big Ben", "Venise", "Las Vegas", "New York",
      "Marseille", "Lyon", "Bordeaux", "Paris", "Nice", "Lille", "Toulouse", "Strasbourg", "Corse", "Bretagne",
      "Plage", "Désert", "Jungle", "Volcan", "Igloo", "Château fort", "Aéroport", "Hôpital", "Piscine", "Supermarché",
      "Laverie", "Boîte de nuit", "Cinéma", "Zoo", "Cimetière", "Bibliothèque", "Prison", "Fête foraine", "Camping", "Station de ski",
    ],
  },
  {
    id: "sports",
    emoji: "⚽",
    name: "Sports & loisirs",
    words: [
      "Football", "Basket", "Tennis", "Natation", "Boxe", "Escalade", "Surf", "Judo", "Tir à l'arc", "Escrime",
      "Handball", "Volley", "Gymnastique", "Patinage artistique", "Plongée", "Rugby", "Golf", "Badminton", "Ski", "Kayak",
      "Aviron", "Hockey sur glace", "Cyclisme", "Marathon", "Équitation", "Skateboard", "Snowboard", "Karaté", "Ping-pong", "Pétanque",
      "Voile", "Triathlon", "Curling", "Trampoline", "Parkour", "Yoga", "Biathlon", "Water-polo", "Beach-volley", "Saut à la perche",
      "Bowling", "Billard", "Fléchettes", "Karting", "Paintball", "Laser game", "Escape game", "Karaoké", "Mots croisés", "Sudoku",
      "Puzzle", "Échecs", "Jardinage", "Tricot", "Pêche", "Randonnée", "Camping sauvage", "Parachute", "Saut à l'élastique", "Rodéo",
      "Zumba", "Breakdance", "Salsa", "Pole dance", "Hula hoop", "Jonglage", "Corde à sauter", "Bras de fer", "Course en sac", "Chaise musicale",
    ],
  },
  {
    id: "films",
    emoji: "🎬",
    name: "Films & séries",
    words: [
      "Titanic", "Matrix", "Star Wars", "Le Parrain", "Inception", "Interstellar", "Forrest Gump", "Pulp Fiction", "Le Roi Lion", "Harry Potter",
      "Jurassic Park", "Shrek", "Batman", "Spider-Man", "Gladiator", "Rocky", "Alien", "Terminator", "Indiana Jones", "Le Seigneur des anneaux",
      "Mad Max", "Avatar", "Joker", "Parasite", "La La Land", "Intouchables", "La Haine", "Le Fabuleux Destin d'Amélie Poulain", "Toy Story", "La Reine des neiges",
      "Aladdin", "Le Voyage de Chihiro", "Dune", "Retour vers le futur", "Le Cinquième Élément", "Scarface", "Shining", "Les Bronzés", "Astérix et Obélix", "Bienvenue chez les Ch'tis",
      "Le Dîner de cons", "Les Visiteurs", "OSS 117", "Taxi", "Kaamelott", "Game of Thrones", "Breaking Bad", "Friends", "Stranger Things", "La Casa de papel",
      "Les Simpson", "Bob l'éponge", "Dragon Ball", "One Piece", "Naruto", "Les Minions", "Le Petit Prince", "Ratatouille", "Le Monde de Nemo",
      "Mamma Mia", "Grease", "Top Gun", "E.T.", "King Kong", "Godzilla", "Les Dents de la mer", "James Bond", "Mission impossible", "Fast and Furious",
    ],
  },
  {
    id: "celebs",
    emoji: "🌟",
    name: "Célébrités & persos",
    words: [
      "Napoléon", "Cléopâtre", "Jules César", "Einstein", "Mozart", "Picasso", "Léonard de Vinci", "Jeanne d'Arc", "Louis XIV", "Marie-Antoinette",
      "Charlie Chaplin", "Marilyn Monroe", "Elvis Presley", "Michael Jackson", "Freddie Mercury", "Beyoncé", "Rihanna", "Céline Dion", "Johnny Hallyday", "Édith Piaf",
      "Zinédine Zidane", "Kylian Mbappé", "Usain Bolt", "Serena Williams", "Teddy Riner", "Tony Parker", "Omar Sy", "Jean Dujardin", "Louis de Funès", "Jamel Debbouze",
      "Leonardo DiCaprio", "Brad Pitt", "Tom Cruise", "Keanu Reeves", "Dwayne Johnson", "Jackie Chan", "Arnold Schwarzenegger", "Margot Robbie", "Zendaya", "Timothée Chalamet",
      "Le Père Noël", "La petite souris", "Dracula", "Frankenstein", "Sherlock Holmes", "Robin des bois", "Peter Pan", "Pinocchio", "Cendrillon", "Blanche-Neige",
      "Le Chat botté", "Le Petit Chaperon rouge", "Merlin l'enchanteur", "Le capitaine Crochet", "Astérix", "Tintin", "Lucky Luke", "Le Petit Prince", "Dark Vador", "Yoda",
      "Gollum", "Shrek", "Hulk", "Superman", "Wonder Woman", "Wolverine", "Le Joker", "Harley Quinn", "Hermione", "Voldemort",
    ],
  },
  {
    id: "soiree",
    emoji: "🎉",
    name: "Soirée & vie de jeune",
    words: [
      "Gueule de bois", "Afterwork", "Pendaison de crémaillère", "Karaoké raté", "Selfie flou", "Story en boucle", "Vu à 3 h du mat", "Ghoster quelqu'un", "Crush", "Vocal de 8 minutes",
      "Mode avion", "Batterie à 1 %", "Kebab de 4 h", "Taxi partagé", "Coloc", "Machine à laver qui fuit", "Pâtes au thon", "Fin de mois", "Découvert bancaire", "Partiels",
      "Stage non payé", "Entretien d'embauche", "Lundi matin", "Réveil qui sonne", "Snooze", "Télétravail", "Réunion qui aurait pu être un mail", "Pot de départ", "Team building", "Open space",
      "Festival", "Bracelet de festival", "Pogo", "Slam dans le public", "Bouchons d'oreilles", "Vestiaire de boîte", "Videur", "Dress code", "Soirée déguisée", "Soirée pyjama",
      "Blind test", "Jeu à boire", "Action ou vérité", "Spin the bottle", "Loup-garou", "Beer pong", "Apéro saucisson", "Planche de charcuterie", "Chips au vinaigre", "Pizza froide",
      "Dernier métro", "VTC à 40 €", "Retour à pied", "Talons à la main", "Mal de crâne", "Brunch", "Grasse matinée", "Série en boucle", "Spoiler", "Playlist de rupture",
      "Ex qui like une vieille photo", "Message envoyé au mauvais groupe", "Appel en visio", "Filtre chien", "Danse virale", "Hashtag", "Mème", "Emoji qui pleure de rire", "Groupe de famille", "Tonton gênant",
    ],
  },
  {
    id: "actions",
    emoji: "🕺",
    name: "Actions à mimer",
    words: [
      "Se brosser les dents", "Faire du vélo", "Changer une couche", "Traire une vache", "Faire un créneau", "Jongler", "Faire une omelette", "Prendre un selfie", "Danser le moonwalk", "Faire du surf",
      "Promener un chien", "Monter à cheval", "Jouer de la guitare", "Jouer du piano", "Diriger un orchestre", "Tondre la pelouse", "Faire la vaisselle", "Plier un drap", "Enfiler un collant", "Mettre des lentilles",
      "Se maquiller", "Se raser", "Éternuer", "Bâiller", "Ronfler", "Avoir le hoquet", "Marcher sur un Lego", "Glisser sur une peau de banane", "Rater une marche", "Chercher ses clés",
      "Courir après un bus", "Pêcher un poisson", "Allumer un feu de camp", "Monter une tente", "Faire du ski", "Patiner", "Nager le papillon", "Plonger", "Faire du yoga", "Soulever des haltères",
      "Ouvrir un bocal", "Manger un spaghetti", "Manger une glace qui coule", "Souffler des bougies", "Emballer un cadeau", "Faire un bonhomme de neige", "Lancer une boule de bowling", "Tirer un penalty", "Faire un strike", "Marquer un panier",
      "Faire du karaoké", "Faire du air guitar", "Dormir debout", "Se faire piquer par une guêpe", "Attraper une mouche", "Danser un slow", "Demander en mariage", "Faire un câlin à un arbre", "Faire de la méditation", "Se battre avec un parapluie",
    ],
  },
  {
    id: "coquin",
    emoji: "🔥",
    name: "Coquin",
    adult: true,
    words: [
      "Suçon", "Strip-poker", "Lingerie", "Massage", "Menottes en fourrure", "Jacuzzi", "Slow langoureux", "Clin d'œil", "Bisou dans le cou", "Pole dance",
      "Walk of shame", "Crush du bureau", "Coup d'un soir", "Ex toxique", "Premier rendez-vous", "Rendez-vous raté", "Message à 2 h du mat", "Sous-entendu", "Regard qui en dit long", "Draguer",
      "Râteau", "Lune de miel", "Nuit de noces", "Chambre d'hôtel", "Bain moussant", "Huile de massage", "Bougie parfumée", "Plumes", "Bandeau sur les yeux", "Jeu de rôle",
      "Déguisement d'infirmière", "Uniforme de pompier", "Talons aiguilles", "Porte-jarretelles", "Boxer moulant", "Strip-tease", "Danse lascive", "Câlin cuillère", "Réveil coquin", "Petit-déjeuner au lit",
      "Mordiller l'oreille", "Bisou esquimau", "French kiss", "Love letter", "Pyjama sexy", "Chemise ouverte", "Pectoraux", "Fesses", "Abdos en chocolat", "Tatouage caché",
      "Fantasme", "Plan à la plage", "Douche à deux", "Coussin en forme de cœur", "Saint-Valentin", "Chocolats en forme de cœur", "Sérénade sous la fenêtre", "Lettre d'amour", "Bague de fiançailles", "Mariage à Las Vegas",
    ],
  },
];
