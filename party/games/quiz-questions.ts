export interface QuizQuestion {
  text: string;
  answers: string[]; // reference answers (shown to host as hint)
  category: string;
  difficulty: "easy" | "medium" | "hard";
  image?: string;
}

function q(
  text: string,
  answers: string[],
  category: string,
  difficulty: "easy" | "medium" | "hard",
  image?: string
): QuizQuestion {
  return image ? { text, answers, category, difficulty, image } : { text, answers, category, difficulty };
}

// ══════════════════════════════════════════════════════════
//  300+ questions — 13 catégories — 3 niveaux de difficulté
// ══════════════════════════════════════════════════════════

const CULTURE_GENERALE: QuizQuestion[] = [
  // Easy
  q("Combien de planètes composent le système solaire ?", ["8"], "Culture G", "easy"),
  q("Quel est le plus grand océan du monde ?", ["Pacifique"], "Culture G", "easy"),
  q("Quelle planète est surnommée la planète rouge ?", ["Mars"], "Culture G", "easy"),
  q("Combien de côtés a un hexagone ?", ["6"], "Culture G", "easy"),
  q("Quel fleuve traverse Paris ?", ["Seine", "la Seine"], "Culture G", "easy"),
  q("Quelle est la formule chimique de l'eau ?", ["H2O"], "Culture G", "easy"),
  q("Combien de joueurs composent une équipe de football ?", ["11"], "Culture G", "easy"),
  q("Combien de faces a un dé classique ?", ["6"], "Culture G", "easy"),
  q("Combien de lettres dans l'alphabet français ?", ["26"], "Culture G", "easy"),
  q("Quelle ville est surnommée 'la ville lumière' ?", ["Paris"], "Culture G", "easy"),
  q("De quelle couleur est une émeraude ?", ["Vert", "verte"], "Culture G", "easy"),
  // Medium
  q("Quelle est la capitale de l'Australie ?", ["Canberra"], "Culture G", "medium"),
  q("Quel est le plus haut sommet du monde ?", ["Everest", "mont Everest"], "Culture G", "medium"),
  q("Quel est le plus petit pays du monde ?", ["Vatican", "le Vatican"], "Culture G", "medium"),
  q("Combien de continents y a-t-il ?", ["7"], "Culture G", "medium"),
  q("Quel est le plus rapide animal terrestre ?", ["Guepard", "guépard"], "Culture G", "medium"),
  q("Quel animal est le symbole de la marque Lacoste ?", ["Crocodile"], "Culture G", "medium"),
  q("Quelle est la langue la plus parlée au monde (locuteurs natifs) ?", ["Mandarin", "chinois"], "Culture G", "medium"),
  q("Quel est le plus grand désert chaud du monde ?", ["Sahara"], "Culture G", "medium"),
  q("Quel est le pays le plus vaste du monde ?", ["Russie"], "Culture G", "medium"),
  q("Quel pays a inventé les Jeux Olympiques antiques ?", ["Grece", "Grèce"], "Culture G", "medium"),
  q("Quel est le plus grand mammifère marin ?", ["Baleine bleue"], "Culture G", "medium"),
  // Hard
  q("Combien d'os possède le corps humain adulte ?", ["206"], "Culture G", "hard"),
  q("Combien de dents a un adulte normalement ?", ["32"], "Culture G", "hard"),
  q("Combien de touches a un piano standard ?", ["88"], "Culture G", "hard"),
  q("Combien de cordes a un violon ?", ["4"], "Culture G", "hard"),
  q("Quel est le métal le plus abondant dans la croûte terrestre ?", ["Aluminium"], "Culture G", "hard"),
  q("Quel gaz compose principalement l'atmosphère terrestre ?", ["Azote", "N2"], "Culture G", "hard"),
  q("Quel est le plus long fleuve d'Afrique ?", ["Nil", "le Nil"], "Culture G", "hard"),
  q("Quel est l'os le plus long du corps humain ?", ["Femur", "fémur"], "Culture G", "hard"),
];

const HISTOIRE: QuizQuestion[] = [
  // Easy
  q("Qui a peint La Joconde ?", ["Leonard de Vinci", "Léonard de Vinci", "De Vinci", "da Vinci"], "Histoire", "easy"),
  q("Qui a découvert l'Amérique en 1492 ?", ["Christophe Colomb", "Colomb"], "Histoire", "easy"),
  q("Qui a écrit Les Misérables ?", ["Victor Hugo", "Hugo"], "Histoire", "easy"),
  q("Qui a inventé la théorie de la relativité ?", ["Einstein", "Albert Einstein"], "Histoire", "easy"),
  // Medium
  q("En quelle année l'homme a-t-il marché sur la Lune ?", ["1969"], "Histoire", "medium"),
  q("En quelle année a eu lieu la Révolution française ?", ["1789"], "Histoire", "medium"),
  q("En quelle année le Titanic a-t-il coulé ?", ["1912"], "Histoire", "medium"),
  q("En quelle année le mur de Berlin est-il tombé ?", ["1989"], "Histoire", "medium"),
  q("En quelle année a débuté la Seconde Guerre mondiale ?", ["1939"], "Histoire", "medium"),
  q("Quel roi de France a été surnommé le Roi-Soleil ?", ["Louis XIV", "Louis 14"], "Histoire", "medium"),
  q("Qui a peint le plafond de la chapelle Sixtine ?", ["Michel-Ange", "Michelangelo"], "Histoire", "medium"),
  q("Quelle reine de France a été surnommée 'Madame Déficit' ?", ["Marie-Antoinette", "Marie Antoinette"], "Histoire", "medium"),
  // Hard
  q("Qui était le premier président des États-Unis ?", ["George Washington", "Washington"], "Histoire", "medium"),
  q("En quelle année a débuté la Première Guerre mondiale ?", ["1914"], "Histoire", "medium"),
  q("Quel pharaon est associé au masque d'or découvert en 1922 ?", ["Toutankhamon", "Tutankhamun"], "Histoire", "hard"),
  q("En quelle année Napoléon est-il devenu empereur ?", ["1804"], "Histoire", "hard"),
  q("Quel empereur romain a incendié Rome selon la légende ?", ["Neron", "Néron"], "Histoire", "hard"),
  q("Qui a inventé l'imprimerie ?", ["Gutenberg", "Johannes Gutenberg"], "Histoire", "hard"),
  q("En quelle année la bombe atomique a-t-elle été larguée sur Hiroshima ?", ["1945"], "Histoire", "hard"),
  q("Qui était le leader de la Révolution cubaine ?", ["Fidel Castro", "Castro"], "Histoire", "hard"),
  q("En quelle année Nelson Mandela a-t-il été libéré de prison ?", ["1990"], "Histoire", "hard"),
  q("Qui a assassiné Abraham Lincoln ?", ["John Wilkes Booth", "Booth"], "Histoire", "hard"),
  q("En quelle année Christophe Colomb a-t-il découvert l'Amérique ?", ["1492"], "Histoire", "medium"),
  q("En quelle année la Déclaration d'indépendance américaine a-t-elle été signée ?", ["1776"], "Histoire", "hard"),
];

const GEOGRAPHIE: QuizQuestion[] = [
  // Easy
  q("Dans quel pays se trouve la tour de Pise ?", ["Italie"], "Géo", "easy"),
  q("Quel pays a pour forme une botte ?", ["Italie"], "Géo", "easy"),
  q("Sur quel continent se trouve l'Égypte ?", ["Afrique"], "Géo", "easy"),
  q("Quel pays est surnommé le pays du soleil levant ?", ["Japon"], "Géo", "easy"),
  q("Quel fleuve traverse l'Égypte ?", ["Nil", "le Nil"], "Géo", "easy"),
  // Medium
  q("Quelle est la capitale du Canada ?", ["Ottawa"], "Géo", "medium"),
  q("Quelle est la plus grande île du monde ?", ["Groenland", "Greenland"], "Géo", "medium"),
  q("Quelle est la capitale du Brésil ?", ["Brasilia"], "Géo", "medium"),
  q("Quelle mer borde la côte sud de la France ?", ["Mediterranee", "Méditerranée"], "Géo", "medium"),
  q("Quelle est la capitale de la Turquie ?", ["Ankara"], "Géo", "medium"),
  q("Quelle est la capitale de l'Inde ?", ["New Delhi", "Delhi"], "Géo", "medium"),
  q("Quelle est la capitale de la Corée du Sud ?", ["Seoul", "Séoul"], "Géo", "medium"),
  q("Quelle est la capitale du Maroc ?", ["Rabat"], "Géo", "medium"),
  q("Quelle est la capitale de l'Argentine ?", ["Buenos Aires"], "Géo", "medium"),
  q("Quelle est la capitale de l'Égypte ?", ["Le Caire", "Cairo"], "Géo", "medium"),
  q("Quel est le plus grand pays d'Afrique ?", ["Algerie", "Algérie"], "Géo", "medium"),
  // Hard
  q("Quel pays a le plus de fuseaux horaires au monde ?", ["France"], "Géo", "hard"),
  q("Quelle est la capitale de la Thaïlande ?", ["Bangkok"], "Géo", "hard"),
  q("Quel est le plus petit continent ?", ["Oceanie", "Océanie"], "Géo", "hard"),
  q("Quel pays a pour capitale Reykjavik ?", ["Islande"], "Géo", "hard"),
  q("Quelle est la capitale de la Pologne ?", ["Varsovie"], "Géo", "hard"),
  q("Quelle est la capitale du Portugal ?", ["Lisbonne", "Lisboa"], "Géo", "hard"),
  q("Quel détroit sépare l'Europe de l'Asie à Istanbul ?", ["Bosphore", "le Bosphore"], "Géo", "hard"),
  q("Quel océan borde la côte ouest de l'Afrique ?", ["Atlantique"], "Géo", "hard"),
];

const SCIENCES: QuizQuestion[] = [
  // Easy
  q("Quel gaz les plantes absorbent-elles pour la photosynthèse ?", ["CO2", "dioxyde de carbone"], "Sciences", "easy"),
  q("Quel est le plus grand organe du corps humain ?", ["Peau", "la peau"], "Sciences", "easy"),
  q("Quel est le pH de l'eau pure ?", ["7"], "Sciences", "easy"),
  // Medium
  q("Quel élément chimique a pour symbole 'Au' ?", ["Or"], "Sciences", "medium"),
  q("Quel est le symbole chimique du fer ?", ["Fe"], "Sciences", "medium"),
  q("Quelle est l'unité de mesure de la force ?", ["Newton", "N"], "Sciences", "medium"),
  q("Quel élément chimique a pour symbole 'Na' ?", ["Sodium"], "Sciences", "medium"),
  q("Quel est le nom de la galaxie dans laquelle se trouve la Terre ?", ["Voie lactee", "Voie Lactée"], "Sciences", "medium"),
  q("Quel physicien a formulé les trois lois du mouvement ?", ["Newton", "Isaac Newton"], "Sciences", "medium"),
  // Hard
  q("Combien de chromosomes possède un être humain ?", ["46"], "Sciences", "hard"),
  q("Quel est l'élément le plus abondant dans l'univers ?", ["Hydrogene", "Hydrogène"], "Sciences", "hard"),
  q("Quel scientifique a découvert la pénicilline ?", ["Fleming", "Alexander Fleming"], "Sciences", "hard"),
  q("Quel est le numéro atomique de l'oxygène ?", ["8"], "Sciences", "hard"),
  q("Combien de litres de sang le corps humain contient-il environ ?", ["5"], "Sciences", "hard"),
  q("Quel type de sang est le donneur universel ?", ["O-", "O negatif"], "Sciences", "hard"),
  q("Quel organe produit l'insuline ?", ["Pancreas", "pancréas"], "Sciences", "hard"),
  q("Quelle est la vitesse de la lumière en km/s (arrondi) ?", ["300000", "300 000"], "Sciences", "hard"),
  q("Quelle planète du système solaire a le plus de lunes ?", ["Saturne"], "Sciences", "hard"),
  q("Comment s'appelle l'étude des volcans ?", ["Volcanologie", "vulcanologie"], "Sciences", "hard"),
];

const MUSIQUE: QuizQuestion[] = [
  // Easy
  q("Quel groupe a chanté 'Bohemian Rhapsody' ?", ["Queen"], "Musique", "easy"),
  q("Quel artiste a sorti l'album 'Thriller' ?", ["Michael Jackson", "MJ"], "Musique", "easy"),
  q("Quel artiste est surnommé 'The King of Pop' ?", ["Michael Jackson", "MJ"], "Musique", "easy"),
  q("Quel groupe a chanté 'Hey Jude' ?", ["The Beatles", "Beatles"], "Musique", "easy"),
  q("Quel chanteur a interprété 'Imagine' ?", ["John Lennon", "Lennon"], "Musique", "easy"),
  // Medium
  q("Qui a composé la Symphonie n°5 en do mineur ?", ["Beethoven"], "Musique", "medium"),
  q("Comment s'appelle le chanteur de Nirvana ?", ["Kurt Cobain", "Cobain"], "Musique", "medium"),
  q("Quel groupe a chanté 'Smells Like Teen Spirit' ?", ["Nirvana"], "Musique", "medium"),
  q("Quel rappeur américain a sorti 'Lose Yourself' ?", ["Eminem"], "Musique", "medium"),
  q("Quel artiste a chanté 'Shape of You' ?", ["Ed Sheeran", "Sheeran"], "Musique", "medium"),
  q("Quel DJ a produit 'Titanium' avec Sia ?", ["David Guetta", "Guetta"], "Musique", "medium"),
  q("Quel artiste a chanté 'Bad Guy' ?", ["Billie Eilish", "Eilish"], "Musique", "medium"),
  q("Quel chanteur a interprété 'Formidable' ?", ["Stromae"], "Musique", "medium"),
  q("Quel groupe a chanté 'Viva La Vida' ?", ["Coldplay"], "Musique", "medium"),
  q("Quel groupe a chanté 'Wonderwall' ?", ["Oasis"], "Musique", "medium"),
  q("Quel artiste est surnommé 'Riri' ?", ["Rihanna"], "Musique", "medium"),
  // Hard
  q("Quel groupe a chanté 'Stairway to Heaven' ?", ["Led Zeppelin"], "Musique", "hard"),
  q("Quel groupe a chanté 'Hotel California' ?", ["Eagles", "The Eagles"], "Musique", "hard"),
  q("Quel chanteur français a interprété 'Je t'aime... moi non plus' ?", ["Serge Gainsbourg", "Gainsbourg"], "Musique", "hard"),
  q("Quel groupe a chanté 'Creep' en 1992 ?", ["Radiohead"], "Musique", "hard"),
  q("Quel artiste a sorti 'The Dark Side of the Moon' ?", ["Pink Floyd"], "Musique", "hard"),
  q("Quel rappeur a sorti l'album 'DAMN.' ?", ["Kendrick Lamar", "Kendrick"], "Musique", "hard"),
  q("Quel groupe a chanté 'Mr. Brightside' ?", ["The Killers", "Killers"], "Musique", "hard"),
  q("Quel rappeur américain a sorti 'Graduation' ?", ["Kanye West", "Kanye", "Ye"], "Musique", "hard"),
];

const RAP_FR: QuizQuestion[] = [
  // Easy
  q("Quel rappeur a chanté 'Sapés comme jamais' ?", ["Maitre Gims", "Gims"], "Rap FR", "easy"),
  q("Quel rappeur est surnommé 'le Duc de Boulogne' ?", ["Booba", "B2O"], "Rap FR", "easy"),
  q("Quel rappeur a sorti 'Civilisation' en 2021 ?", ["Orelsan"], "Rap FR", "easy"),
  q("Quel rappeur a sorti 'Bande organisée' ?", ["Jul"], "Rap FR", "easy"),
  // Medium
  q("Quel rappeur a sorti l'album 'JVLIVS' ?", ["SCH"], "Rap FR", "medium"),
  q("De quelle ville vient le groupe IAM ?", ["Marseille"], "Rap FR", "medium"),
  q("Quel duo forme PNL ?", ["Ademo et N.O.S", "Ademo et NOS"], "Rap FR", "medium"),
  q("Quel rappeur a sorti l'album 'Deux frères' ?", ["PNL"], "Rap FR", "medium"),
  q("Comment s'appelle le groupe fondé par Kool Shen et JoeyStarr ?", ["NTM", "Supreme NTM"], "Rap FR", "medium"),
  q("Quel rappeur a sorti l'album 'QALF' ?", ["Damso"], "Rap FR", "medium"),
  q("Quel rappeur a sorti 'Fenomeno' ?", ["Ninho"], "Rap FR", "medium"),
  q("Quel rappeur a sorti 'Le monde Chico' ?", ["PNL"], "Rap FR", "medium"),
  q("De quelle ville vient SCH ?", ["Marseille", "Aubagne"], "Rap FR", "medium"),
  q("Quel rappeur français a le plus de ventes de tous les temps ?", ["Jul"], "Rap FR", "medium"),
  // Hard
  q("Comment s'appelle le premier album studio de Nekfeu ?", ["Feu"], "Rap FR", "hard"),
  q("De quel pays est originaire Damso ?", ["Belgique", "Congo", "RDC"], "Rap FR", "hard"),
  q("Quel est le vrai nom de Booba ?", ["Elie Yaffa", "Élie Yaffa"], "Rap FR", "hard"),
  q("Quel rappeur a sorti l'album 'Ipséité' ?", ["Damso"], "Rap FR", "hard"),
  q("Quel rappeur a sorti l'album 'Les derniers salopards' ?", ["Alkpote"], "Rap FR", "hard"),
  q("Quel est le nom du label de Booba ?", ["92i"], "Rap FR", "hard"),
  q("Quel rappeur a sorti l'album 'Chrome' ?", ["Freeze Corleone", "Freeze"], "Rap FR", "hard"),
  q("Quel rappeur a sorti 'Neverland' ?", ["Nekfeu"], "Rap FR", "hard"),
  q("Quel rappeur est connu pour le morceau 'Freestyle du sale' ?", ["Vald"], "Rap FR", "hard"),
  q("Quel rappeur a chanté 'Bruxelles vie' ?", ["Damso"], "Rap FR", "hard"),
  q("Quel rappeur a chanté 'Tout va bien' ?", ["Alonzo"], "Rap FR", "hard"),
  q("De quelle ville vient Nekfeu ?", ["Paris", "le Perreux-sur-Marne"], "Rap FR", "hard"),
  q("Quel album de Rohff contient 'Qui est l'exemple ?' ?", ["La fierté des notres", "La fierté des nôtres"], "Rap FR", "hard"),
  q("Quel rappeur a sorti l'album 'Capo dei Capi' ?", ["La Fouine"], "Rap FR", "hard"),
];

const CINEMA: QuizQuestion[] = [
  // Easy
  q("Comment s'appelle le lion dans le Roi Lion ?", ["Simba"], "Cinéma", "easy"),
  q("Quel film raconte l'histoire d'un poisson-clown perdu ?", ["Le Monde de Nemo", "Nemo", "Finding Nemo"], "Cinéma", "easy"),
  q("Dans quel film entend-on 'Hakuna Matata' ?", ["Le Roi Lion", "Roi Lion"], "Cinéma", "easy"),
  q("Quel film met en scène un parc de dinosaures clonés ?", ["Jurassic Park"], "Cinéma", "easy"),
  q("Quel acteur joue le capitaine Jack Sparrow ?", ["Johnny Depp", "Depp"], "Cinéma", "easy"),
  // Medium
  q("Qui a réalisé 'Inception' ?", ["Christopher Nolan", "Nolan"], "Cinéma", "medium"),
  q("Quel acteur joue Iron Man dans le MCU ?", ["Robert Downey Jr", "RDJ"], "Cinéma", "medium"),
  q("Qui joue le Joker dans 'The Dark Knight' ?", ["Heath Ledger", "Ledger"], "Cinéma", "medium"),
  q("Quel acteur joue Jack dans 'Titanic' ?", ["Leonardo DiCaprio", "DiCaprio"], "Cinéma", "medium"),
  q("Comment s'appelle le personnage joué par Keanu Reeves dans Matrix ?", ["Neo", "Thomas Anderson"], "Cinéma", "medium"),
  q("Quel acteur joue John Wick ?", ["Keanu Reeves", "Reeves"], "Cinéma", "medium"),
  q("Quel acteur joue le rôle de Wolverine ?", ["Hugh Jackman", "Jackman"], "Cinéma", "medium"),
  q("Quel acteur incarne Forrest Gump ?", ["Tom Hanks", "Hanks"], "Cinéma", "medium"),
  q("Qui joue le rôle principal dans 'Joker' (2019) ?", ["Joaquin Phoenix", "Phoenix"], "Cinéma", "medium"),
  q("Quel acteur incarne James Bond dans 'Casino Royale' (2006) ?", ["Daniel Craig", "Craig"], "Cinéma", "medium"),
  q("Quel film français a Omar Sy en tête d'affiche avec un tétraplégique ?", ["Intouchables", "Les Intouchables"], "Cinéma", "medium"),
  q("Quel film de Pixar met en scène des émotions personnifiées ?", ["Vice-Versa", "Inside Out"], "Cinéma", "medium"),
  // Hard
  q("En quelle année est sorti le premier Star Wars ?", ["1977"], "Cinéma", "hard"),
  q("Quel film a remporté l'Oscar du meilleur film en 2020 ?", ["Parasite"], "Cinéma", "hard"),
  q("Qui a réalisé 'Pulp Fiction' ?", ["Quentin Tarantino", "Tarantino"], "Cinéma", "hard"),
  q("Qui a réalisé 'Le Seigneur des Anneaux' ?", ["Peter Jackson", "Jackson"], "Cinéma", "hard"),
  q("Qui a réalisé 'Fight Club' ?", ["David Fincher", "Fincher"], "Cinéma", "hard"),
  q("Qui joue Thanos dans les films Avengers ?", ["Josh Brolin", "Brolin"], "Cinéma", "hard"),
  q("Quel acteur joue Django dans 'Django Unchained' ?", ["Jamie Foxx"], "Cinéma", "hard"),
  q("Qui a réalisé 'Shutter Island' ?", ["Martin Scorsese", "Scorsese"], "Cinéma", "hard"),
  q("Qui a réalisé 'Interstellar' ?", ["Christopher Nolan", "Nolan"], "Cinéma", "hard"),
  q("Qui a réalisé 'Les Évadés' (The Shawshank Redemption) ?", ["Frank Darabont"], "Cinéma", "hard"),
];

const ANIME: QuizQuestion[] = [
  // Easy
  q("Comment s'appelle le personnage principal de Naruto ?", ["Naruto Uzumaki", "Naruto"], "Anime", "easy"),
  q("Comment s'appelle le personnage principal de Death Note ?", ["Light Yagami", "Light"], "Anime", "easy"),
  q("Dans Dragon Ball, comment s'appelle la technique signature de Goku ?", ["Kamehameha"], "Anime", "easy"),
  q("Comment s'appelle le rival de Naruto ?", ["Sasuke", "Sasuke Uchiha"], "Anime", "easy"),
  q("Dans quel anime trouve-t-on les 'Hashira' ?", ["Demon Slayer", "Kimetsu no Yaiba"], "Anime", "easy"),
  q("Comment s'appelle le personnage principal de L'Attaque des Titans ?", ["Eren", "Eren Jaeger", "Eren Yeager"], "Anime", "easy"),
  q("Comment s'appelle le personnage principal de My Hero Academia ?", ["Izuku Midoriya", "Midoriya", "Deku"], "Anime", "easy"),
  // Medium
  q("Dans One Piece, quel est le rêve de Luffy ?", ["Devenir le roi des pirates", "roi des pirates"], "Anime", "medium"),
  q("Quel est le nom du shinigami qui donne le Death Note à Light ?", ["Ryuk"], "Anime", "medium"),
  q("Comment s'appelle l'équipage de Luffy ?", ["Mugiwara", "Chapeau de Paille", "Straw Hat"], "Anime", "medium"),
  q("Dans Jujutsu Kaisen, comment s'appelle le personnage principal ?", ["Yuji Itadori", "Itadori", "Yuji"], "Anime", "medium"),
  q("Comment s'appelle la technique ultime de Naruto ?", ["Rasengan"], "Anime", "medium"),
  q("Dans Hunter x Hunter, comment s'appelle le personnage principal ?", ["Gon", "Gon Freecss"], "Anime", "medium"),
  q("Quel anime met en scène un garçon avec un bras mécanique (automail) ?", ["Fullmetal Alchemist", "FMA"], "Anime", "medium"),
  q("Comment s'appelle le sensei de Naruto (équipe 7) ?", ["Kakashi", "Kakashi Hatake"], "Anime", "medium"),
  q("Quel est le nom du titan d'Eren ?", ["Titan Assaillant", "Attack Titan"], "Anime", "medium"),
  q("Dans quel anime trouve-t-on le 'Nen' ?", ["Hunter x Hunter", "HxH"], "Anime", "medium"),
  q("Dans Tokyo Ghoul, comment s'appelle le personnage principal ?", ["Ken Kaneki", "Kaneki"], "Anime", "medium"),
  q("Comment s'appelle le personnage principal de Solo Leveling ?", ["Sung Jin-Woo", "Sung Jinwoo", "Jinwoo"], "Anime", "medium"),
  // Hard
  q("Comment s'appelle l'auteur de One Piece ?", ["Eiichiro Oda", "Oda"], "Anime", "hard"),
  q("Quel est le nom du Bankai d'Ichigo dans Bleach ?", ["Tensa Zangetsu"], "Anime", "hard"),
  q("Dans One Piece, comment s'appelle le fruit du démon de Luffy ?", ["Gomu Gomu", "Gomu Gomu no Mi", "Hito Hito modele Nika", "Nika"], "Anime", "hard"),
  q("Quel est le nom de l'organisation criminelle dans Naruto ?", ["Akatsuki"], "Anime", "hard"),
  q("Comment s'appelle le personnage principal de Fullmetal Alchemist ?", ["Edward Elric", "Edward", "Ed Elric"], "Anime", "hard"),
  q("Dans Demon Slayer, de quelle couleur est la lame de Tanjiro ?", ["Noir", "noire"], "Anime", "hard"),
  q("Quel anime met en scène un concours de cuisine entre lycéens ?", ["Food Wars", "Shokugeki no Soma"], "Anime", "hard"),
  q("Quel anime met en scène un match de volleyball au lycée ?", ["Haikyuu", "Haikyu"], "Anime", "hard"),
  q("Quel anime se déroule dans un monde où 80% des gens ont des super-pouvoirs ?", ["My Hero Academia", "Boku no Hero Academia"], "Anime", "hard"),
];

const SERIES: QuizQuestion[] = [
  // Easy
  q("Dans quelle série trouve-t-on le personnage de Walter White ?", ["Breaking Bad"], "Séries", "easy"),
  q("Quelle série met en scène un jeu mortel coréen avec des poupées géantes ?", ["Squid Game"], "Séries", "easy"),
  q("Dans quelle série des enfants jouent à Donjons & Dragons à Hawkins ?", ["Stranger Things"], "Séries", "easy"),
  // Medium
  q("Comment s'appelle le personnage principal de Breaking Bad ?", ["Walter White", "Heisenberg"], "Séries", "medium"),
  q("Quel personnage dit 'I am the danger' ?", ["Walter White", "Heisenberg"], "Séries", "medium"),
  q("Dans quelle série trouve-t-on le Trône de Fer ?", ["Game of Thrones", "GOT"], "Séries", "medium"),
  q("Comment s'appelle le personnage principal de 'La Casa de Papel' ?", ["Le Professeur", "Professeur", "Sergio Marquina"], "Séries", "medium"),
  q("Dans 'Friends', comment s'appelle le café ?", ["Central Perk"], "Séries", "medium"),
  q("Dans 'Peaky Blinders', quel est le nom de famille principal ?", ["Shelby"], "Séries", "medium"),
  q("Comment s'appelle le personnage principal de 'Peaky Blinders' ?", ["Thomas Shelby", "Tommy Shelby", "Tommy"], "Séries", "medium"),
  q("Dans 'Narcos', quel baron de la drogue est le personnage central de la saison 1 ?", ["Pablo Escobar", "Escobar"], "Séries", "medium"),
  q("Quelle série met en scène des super-héros corrompus ?", ["The Boys"], "Séries", "medium"),
  // Hard
  q("Comment s'appelle la prison dans 'Prison Break' ?", ["Fox River"], "Séries", "hard"),
  q("Quel acteur joue Geralt de Riv dans la série Netflix 'The Witcher' (saisons 1-3) ?", ["Henry Cavill", "Cavill"], "Séries", "hard"),
  q("Comment s'appelle la série préquelle de Game of Thrones ?", ["House of the Dragon", "HOTD"], "Séries", "hard"),
  q("Quel personnage de 'The Office' est le manager régional de Dunder Mifflin ?", ["Michael Scott", "Scott"], "Séries", "hard"),
  q("Dans quelle série entend-on 'Winter is coming' ?", ["Game of Thrones", "GOT"], "Séries", "medium"),
  q("Combien d'épisodes compte la série 'Game of Thrones' ?", ["73"], "Séries", "hard"),
  q("Comment s'appelle la série sur des lycéens espagnols dans une école d'élite ?", ["Elite", "Élite"], "Séries", "hard"),
];

const JEUX_VIDEO: QuizQuestion[] = [
  // Easy
  q("Comment s'appelle le plombier emblématique de Nintendo ?", ["Mario", "Super Mario"], "Jeux Vidéo", "easy"),
  q("Dans quel jeu construit-on des structures avec des blocs ?", ["Minecraft"], "Jeux Vidéo", "easy"),
  q("Dans quel jeu trouve-t-on les Creepers ?", ["Minecraft"], "Jeux Vidéo", "easy"),
  q("Dans quel jeu peut-on capturer des créatures dans des Pokéballs ?", ["Pokemon", "Pokémon"], "Jeux Vidéo", "easy"),
  // Medium
  q("Comment s'appelle le personnage principal de 'The Legend of Zelda' ?", ["Link"], "Jeux Vidéo", "medium"),
  q("Comment s'appelle le personnage principal de God of War ?", ["Kratos"], "Jeux Vidéo", "medium"),
  q("Quel jeu met en scène des matchs 5v5 avec des agents aux capacités uniques, par Riot Games ?", ["Valorant"], "Jeux Vidéo", "medium"),
  q("Quel jeu de Riot Games est un MOBA avec des champions ?", ["League of Legends", "LoL", "LOL"], "Jeux Vidéo", "medium"),
  q("Comment s'appelle le personnage emblématique de Sonic ?", ["Sonic", "Sonic the Hedgehog"], "Jeux Vidéo", "medium"),
  q("Comment s'appelle la princesse que Mario sauve souvent ?", ["Peach", "Princesse Peach"], "Jeux Vidéo", "medium"),
  q("Dans quel jeu explore-t-on le monde de Teyvat ?", ["Genshin Impact", "Genshin"], "Jeux Vidéo", "medium"),
  // Hard
  q("Comment s'appelle le créateur de Minecraft ?", ["Notch", "Markus Persson"], "Jeux Vidéo", "hard"),
  q("Quel jeu de FromSoftware se passe dans les Terres Intermédiaires ?", ["Elden Ring"], "Jeux Vidéo", "hard"),
  q("Comment s'appelle le personnage principal de 'The Witcher 3' ?", ["Geralt", "Geralt de Riv"], "Jeux Vidéo", "hard"),
  q("Quel jeu de tir en ligne 5v5 de Valve est sorti en 2012 ?", ["CS:GO", "Counter-Strike", "CSGO", "CS2"], "Jeux Vidéo", "hard"),
  q("Quel jeu indé met en scène un squelette nommé Sans ?", ["Undertale"], "Jeux Vidéo", "hard"),
  q("Quel jeu de survie multijoueur se passe sur une île avec des dinosaures ?", ["Ark", "ARK Survival Evolved", "ARK"], "Jeux Vidéo", "hard"),
  q("Quel jeu de battle royale a popularisé le genre en 2017 ?", ["Fortnite", "PUBG"], "Jeux Vidéo", "hard"),
  q("Dans quel jeu incarne-t-on un Ashen One dans un monde sombre et difficile ?", ["Dark Souls", "Dark Souls 3"], "Jeux Vidéo", "hard"),
];

const SPORT: QuizQuestion[] = [
  // Easy
  q("Combien de temps dure un match de football (temps réglementaire) en minutes ?", ["90"], "Sport", "easy"),
  q("Quel pays a remporté la Coupe du Monde 2018 ?", ["France"], "Sport", "easy"),
  q("Quel sport pratique-t-on à Roland-Garros ?", ["Tennis"], "Sport", "easy"),
  q("De quel pays est originaire Cristiano Ronaldo ?", ["Portugal"], "Sport", "easy"),
  // Medium
  q("Quel footballeur est surnommé 'La Pulga' ?", ["Messi", "Lionel Messi"], "Sport", "medium"),
  q("Quel pays a remporté la Coupe du Monde 2022 ?", ["Argentine"], "Sport", "medium"),
  q("Quel joueur de football détient le record de Ballons d'Or ?", ["Messi", "Lionel Messi"], "Sport", "medium"),
  q("Quel sportif jamaïcain détient le record du 100m ?", ["Usain Bolt", "Bolt"], "Sport", "medium"),
  q("Quel club de foot est surnommé 'les Merengues' ?", ["Real Madrid", "Real"], "Sport", "medium"),
  q("Quel pays a remporté le plus de Coupes du Monde de football ?", ["Bresil", "Brésil"], "Sport", "medium"),
  q("Quel footballeur français a fait un triplé en finale de la Coupe du Monde 2022 ?", ["Mbappe", "Mbappé", "Kylian Mbappe"], "Sport", "medium"),
  q("Quel sport pratique LeBron James ?", ["Basketball", "basket", "NBA"], "Sport", "medium"),
  q("Dans quel pays se sont déroulés les JO de 2024 ?", ["France", "Paris"], "Sport", "medium"),
  // Hard
  q("Combien de joueurs y a-t-il dans une équipe de basketball NBA sur le terrain ?", ["5"], "Sport", "hard"),
  q("Combien de sets faut-il gagner pour un Grand Chelem hommes ?", ["3"], "Sport", "hard"),
  q("Quelle est la distance d'un marathon en km ?", ["42.195", "42 km", "42,195"], "Sport", "hard"),
  q("Quel sport pratique Tiger Woods ?", ["Golf"], "Sport", "hard"),
  q("Quel joueur de tennis a remporté le plus de Grand Chelem ?", ["Djokovic", "Novak Djokovic"], "Sport", "hard"),
  q("Dans quel sport utilise-t-on un volant (shuttlecock) ?", ["Badminton"], "Sport", "hard"),
  q("Dans quel sport trouve-t-on le Tour de France ?", ["Cyclisme", "velo", "vélo"], "Sport", "hard"),
];

const POP_CULTURE: QuizQuestion[] = [
  // Easy
  q("Sur quelle plateforme publie-t-on des vidéos courtes type TikTok ?", ["TikTok"], "Pop Culture", "easy"),
  q("Quelle plateforme de streaming est associée au gaming et au chat violet ?", ["Twitch"], "Pop Culture", "easy"),
  // Medium
  q("Comment s'appelle le créateur de Facebook ?", ["Mark Zuckerberg", "Zuckerberg"], "Pop Culture", "medium"),
  q("Quel est le vrai nom de MrBeast ?", ["Jimmy Donaldson", "Jimmy"], "Pop Culture", "medium"),
  q("Quel streameur français a organisé le GP Explorer ?", ["Squeezie"], "Pop Culture", "medium"),
  q("Comment s'appelle l'IA conversationnelle d'OpenAI ?", ["ChatGPT", "GPT"], "Pop Culture", "medium"),
  q("Comment s'appelle la cryptomonnaie représentée par un Shiba Inu ?", ["Dogecoin", "DOGE"], "Pop Culture", "medium"),
  // Hard
  q("Quel réseau social était symbolisé par un oiseau bleu ?", ["Twitter", "X"], "Pop Culture", "hard"),
  q("Quel Youtubeur français est connu pour ses vidéos de science pop ?", ["Dr Nozman", "Nozman"], "Pop Culture", "hard"),
  q("Comment s'appelle l'événement gaming annuel de Squeezie ?", ["GP Explorer"], "Pop Culture", "hard"),
  q("Quel Youtubeur français est connu pour le Joueur du Grenier ?", ["Fred", "Fred Molas", "JDG"], "Pop Culture", "hard"),
  q("Quel streamer/Youtubeur est connu pour Minecraft et le Z Event ?", ["ZeratoR", "Zerator"], "Pop Culture", "hard"),
];

const DIVERS: QuizQuestion[] = [
  // Easy
  q("Quelle est la couleur obtenue en mélangeant du bleu et du jaune ?", ["Vert"], "Divers", "easy"),
  q("Combien font 7 × 8 ?", ["56"], "Divers", "easy"),
  q("Quel mois de l'année a 28 ou 29 jours ?", ["Fevrier", "Février"], "Divers", "easy"),
  q("Combien de couleurs a l'arc-en-ciel ?", ["7"], "Divers", "easy"),
  q("Combien de pattes a une araignée ?", ["8"], "Divers", "easy"),
  q("Quel pays a inventé la pizza ?", ["Italie"], "Divers", "easy"),
  // Medium
  q("Combien y a-t-il de signes du zodiaque ?", ["12"], "Divers", "medium"),
  q("Quel animal est l'emblème de la République française ?", ["Coq", "le coq", "coq gaulois"], "Divers", "medium"),
  q("Quelle fête célèbre-t-on le 14 juillet en France ?", ["Fete nationale", "Fête nationale", "prise de la Bastille"], "Divers", "medium"),
  q("Dans quel pays a été inventé le sushi ?", ["Japon"], "Divers", "medium"),
  q("Quel instrument de musique possède 88 touches ?", ["Piano"], "Divers", "medium"),
  q("Comment s'appelle le plus grand réseau social professionnel ?", ["LinkedIn", "Linkedin"], "Divers", "medium"),
  q("Combien font 12² ?", ["144"], "Divers", "medium"),
  // Hard
  q("Quel est le plus gros fruit du monde ?", ["Jacquier", "jackfruit"], "Divers", "hard"),
  q("Quel est le nom de l'alphabet utilisé en Russie ?", ["Cyrillique", "alphabet cyrillique"], "Divers", "hard"),
  q("Quel est le signe astrologique des personnes nées le 25 décembre ?", ["Capricorne"], "Divers", "hard"),
  q("Comment s'appelle la monnaie utilisée au Royaume-Uni ?", ["Livre sterling", "livre", "pound", "GBP"], "Divers", "hard"),
  q("Quel est le plus grand organe interne du corps humain ?", ["Foie", "le foie"], "Divers", "hard"),
  q("Quel est le plus ancien sport olympique ?", ["Course", "course a pied", "athletisme"], "Divers", "hard"),
];

// ══════════════════════════════════════════════════════════
export const ALL_QUESTIONS: QuizQuestion[] = [
  ...CULTURE_GENERALE,
  ...HISTOIRE,
  ...GEOGRAPHIE,
  ...SCIENCES,
  ...MUSIQUE,
  ...RAP_FR,
  ...CINEMA,
  ...ANIME,
  ...SERIES,
  ...JEUX_VIDEO,
  ...SPORT,
  ...POP_CULTURE,
  ...DIVERS,
];

export const CATEGORIES = [
  "Culture G", "Histoire", "Géo", "Sciences", "Musique",
  "Rap FR", "Cinéma", "Anime", "Séries", "Jeux Vidéo",
  "Sport", "Pop Culture", "Divers",
];
