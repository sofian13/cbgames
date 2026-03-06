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

// ===========================================================
//  300+ questions -- 13 categories -- 3 niveaux de difficulte
// ===========================================================

const CULTURE_GENERALE: QuizQuestion[] = [
  // Easy
  q("Combien de planetes composent le systeme solaire ?", ["8"], "Culture G", "easy"),
  q("Quel est le plus grand ocean du monde ?", ["Pacifique"], "Culture G", "easy"),
  q("Quelle planete est surnommee la planete rouge ?", ["Mars"], "Culture G", "easy"),
  q("Combien de cotes a un hexagone ?", ["6"], "Culture G", "easy"),
  q("Quel fleuve traverse Paris ?", ["Seine", "la Seine"], "Culture G", "easy"),
  q("Quelle est la formule chimique de l'eau ?", ["H2O"], "Culture G", "easy"),
  q("Combien de joueurs composent une equipe de football ?", ["11"], "Culture G", "easy"),
  q("Combien de faces a un de classique ?", ["6"], "Culture G", "easy"),
  q("Combien de lettres dans l'alphabet francais ?", ["26"], "Culture G", "easy"),
  q("Quelle ville est surnommee 'la ville lumiere' ?", ["Paris"], "Culture G", "easy"),
  q("De quelle couleur est une emeraude ?", ["Vert", "verte"], "Culture G", "easy"),
  // Medium
  q("Quelle est la capitale de l'Australie ?", ["Canberra"], "Culture G", "medium"),
  q("Quel est le plus haut sommet du monde ?", ["Everest", "mont Everest"], "Culture G", "medium"),
  q("Quel est le plus petit pays du monde ?", ["Vatican", "le Vatican"], "Culture G", "medium"),
  q("Combien de continents y a-t-il ?", ["7"], "Culture G", "medium"),
  q("Quel est le plus rapide animal terrestre ?", ["Guepard", "guepard"], "Culture G", "medium"),
  q("Quel animal est le symbole de la marque Lacoste ?", ["Crocodile"], "Culture G", "medium"),
  q("Quelle est la langue la plus parlee au monde (locuteurs natifs) ?", ["Mandarin", "chinois"], "Culture G", "medium"),
  q("Quel est le plus grand desert chaud du monde ?", ["Sahara"], "Culture G", "medium"),
  q("Quel est le pays le plus vaste du monde ?", ["Russie"], "Culture G", "medium"),
  q("Quel pays a invente les Jeux Olympiques antiques ?", ["Grece", "Grece"], "Culture G", "medium"),
  q("Quel est le plus grand mammifere marin ?", ["Baleine bleue"], "Culture G", "medium"),
  // Hard
  q("Combien d'os possede le corps humain adulte ?", ["206"], "Culture G", "hard"),
  q("Combien de dents a un adulte normalement ?", ["32"], "Culture G", "hard"),
  q("Combien de touches a un piano standard ?", ["88"], "Culture G", "hard"),
  q("Combien de cordes a un violon ?", ["4"], "Culture G", "hard"),
  q("Quel est le metal le plus abondant dans la croute terrestre ?", ["Aluminium"], "Culture G", "hard"),
  q("Quel gaz compose principalement l'atmosphere terrestre ?", ["Azote", "N2"], "Culture G", "hard"),
  q("Quel est le plus long fleuve d'Afrique ?", ["Nil", "le Nil"], "Culture G", "hard"),
  q("Quel est l'os le plus long du corps humain ?", ["Femur", "femur"], "Culture G", "hard"),
];

const HISTOIRE: QuizQuestion[] = [
  // Easy
  q("Qui a peint La Joconde ?", ["Leonard de Vinci", "Leonard de Vinci", "De Vinci", "da Vinci"], "Histoire", "easy"),
  q("Qui a decouvert l'Amerique en 1492 ?", ["Christophe Colomb", "Colomb"], "Histoire", "easy"),
  q("Qui a ecrit Les Miserables ?", ["Victor Hugo", "Hugo"], "Histoire", "easy"),
  q("Qui a invente la theorie de la relativite ?", ["Einstein", "Albert Einstein"], "Histoire", "easy"),
  // Medium
  q("En quelle annee l'homme a-t-il marche sur la Lune ?", ["1969"], "Histoire", "medium"),
  q("En quelle annee a eu lieu la Revolution francaise ?", ["1789"], "Histoire", "medium"),
  q("En quelle annee le Titanic a-t-il coule ?", ["1912"], "Histoire", "medium"),
  q("En quelle annee le mur de Berlin est-il tombe ?", ["1989"], "Histoire", "medium"),
  q("En quelle annee a debute la Seconde Guerre mondiale ?", ["1939"], "Histoire", "medium"),
  q("Quel roi de France a ete surnomme le Roi-Soleil ?", ["Louis XIV", "Louis 14"], "Histoire", "medium"),
  q("Qui a peint le plafond de la chapelle Sixtine ?", ["Michel-Ange", "Michelangelo"], "Histoire", "medium"),
  q("Quelle reine de France a ete surnommee 'Madame Deficit' ?", ["Marie-Antoinette", "Marie Antoinette"], "Histoire", "medium"),
  // Hard
  q("Qui etait le premier president des Etats-Unis ?", ["George Washington", "Washington"], "Histoire", "medium"),
  q("En quelle annee a debute la Premiere Guerre mondiale ?", ["1914"], "Histoire", "medium"),
  q("Quel pharaon est associe au masque d'or decouvert en 1922 ?", ["Toutankhamon", "Tutankhamun"], "Histoire", "hard"),
  q("En quelle annee Napoleon est-il devenu empereur ?", ["1804"], "Histoire", "hard"),
  q("Quel empereur romain a incendie Rome selon la legende ?", ["Neron", "Neron"], "Histoire", "hard"),
  q("Qui a invente l'imprimerie ?", ["Gutenberg", "Johannes Gutenberg"], "Histoire", "hard"),
  q("En quelle annee la bombe atomique a-t-elle ete larguee sur Hiroshima ?", ["1945"], "Histoire", "hard"),
  q("Qui etait le leader de la Revolution cubaine ?", ["Fidel Castro", "Castro"], "Histoire", "hard"),
  q("En quelle annee Nelson Mandela a-t-il ete libere de prison ?", ["1990"], "Histoire", "hard"),
  q("Qui a assassine Abraham Lincoln ?", ["John Wilkes Booth", "Booth"], "Histoire", "hard"),
  q("En quelle annee Christophe Colomb a-t-il decouvert l'Amerique ?", ["1492"], "Histoire", "medium"),
  q("En quelle annee la Declaration d'independance americaine a-t-elle ete signee ?", ["1776"], "Histoire", "hard"),
];

const GEOGRAPHIE: QuizQuestion[] = [
  // Easy
  q("Dans quel pays se trouve la tour de Pise ?", ["Italie"], "Geo", "easy"),
  q("Quel pays a pour forme une botte ?", ["Italie"], "Geo", "easy"),
  q("Sur quel continent se trouve l'Egypte ?", ["Afrique"], "Geo", "easy"),
  q("Quel pays est surnomme le pays du soleil levant ?", ["Japon"], "Geo", "easy"),
  q("Quel fleuve traverse l'Egypte ?", ["Nil", "le Nil"], "Geo", "easy"),
  // Medium
  q("Quelle est la capitale du Canada ?", ["Ottawa"], "Geo", "medium"),
  q("Quelle est la plus grande ile du monde ?", ["Groenland", "Greenland"], "Geo", "medium"),
  q("Quelle est la capitale du Bresil ?", ["Brasilia"], "Geo", "medium"),
  q("Quelle mer borde la cote sud de la France ?", ["Mediterranee", "Mediterranee"], "Geo", "medium"),
  q("Quelle est la capitale de la Turquie ?", ["Ankara"], "Geo", "medium"),
  q("Quelle est la capitale de l'Inde ?", ["New Delhi", "Delhi"], "Geo", "medium"),
  q("Quelle est la capitale de la Coree du Sud ?", ["Seoul", "Seoul"], "Geo", "medium"),
  q("Quelle est la capitale du Maroc ?", ["Rabat"], "Geo", "medium"),
  q("Quelle est la capitale de l'Argentine ?", ["Buenos Aires"], "Geo", "medium"),
  q("Quelle est la capitale de l'Egypte ?", ["Le Caire", "Cairo"], "Geo", "medium"),
  q("Quel est le plus grand pays d'Afrique ?", ["Algerie", "Algerie"], "Geo", "medium"),
  // Hard
  q("Quel pays a le plus de fuseaux horaires au monde ?", ["France"], "Geo", "hard"),
  q("Quelle est la capitale de la Thailande ?", ["Bangkok"], "Geo", "hard"),
  q("Quel est le plus petit continent ?", ["Oceanie", "Oceanie"], "Geo", "hard"),
  q("Quel pays a pour capitale Reykjavik ?", ["Islande"], "Geo", "hard"),
  q("Quelle est la capitale de la Pologne ?", ["Varsovie"], "Geo", "hard"),
  q("Quelle est la capitale du Portugal ?", ["Lisbonne", "Lisboa"], "Geo", "hard"),
  q("Quel detroit separe l'Europe de l'Asie a Istanbul ?", ["Bosphore", "le Bosphore"], "Geo", "hard"),
  q("Quel ocean borde la cote ouest de l'Afrique ?", ["Atlantique"], "Geo", "hard"),
];

const SCIENCES: QuizQuestion[] = [
  // Easy
  q("Quel gaz les plantes absorbent-elles pour la photosynthese ?", ["CO2", "dioxyde de carbone"], "Sciences", "easy"),
  q("Quel est le plus grand organe du corps humain ?", ["Peau", "la peau"], "Sciences", "easy"),
  q("Quel est le pH de l'eau pure ?", ["7"], "Sciences", "easy"),
  // Medium
  q("Quel element chimique a pour symbole 'Au' ?", ["Or"], "Sciences", "medium"),
  q("Quel est le symbole chimique du fer ?", ["Fe"], "Sciences", "medium"),
  q("Quelle est l'unite de mesure de la force ?", ["Newton", "N"], "Sciences", "medium"),
  q("Quel element chimique a pour symbole 'Na' ?", ["Sodium"], "Sciences", "medium"),
  q("Quel est le nom de la galaxie dans laquelle se trouve la Terre ?", ["Voie lactee", "Voie Lactee"], "Sciences", "medium"),
  q("Quel physicien a formule les trois lois du mouvement ?", ["Newton", "Isaac Newton"], "Sciences", "medium"),
  // Hard
  q("Combien de chromosomes possede un etre humain ?", ["46"], "Sciences", "hard"),
  q("Quel est l'element le plus abondant dans l'univers ?", ["Hydrogene", "Hydrogene"], "Sciences", "hard"),
  q("Quel scientifique a decouvert la penicilline ?", ["Fleming", "Alexander Fleming"], "Sciences", "hard"),
  q("Quel est le numero atomique de l'oxygene ?", ["8"], "Sciences", "hard"),
  q("Combien de litres de sang le corps humain contient-il environ ?", ["5"], "Sciences", "hard"),
  q("Quel type de sang est le donneur universel ?", ["O-", "O negatif"], "Sciences", "hard"),
  q("Quel organe produit l'insuline ?", ["Pancreas", "pancreas"], "Sciences", "hard"),
  q("Quelle est la vitesse de la lumiere en km/s (arrondi) ?", ["300000", "300 000"], "Sciences", "hard"),
  q("Quelle planete du systeme solaire a le plus de lunes ?", ["Saturne"], "Sciences", "hard"),
  q("Comment s'appelle l'etude des volcans ?", ["Volcanologie", "vulcanologie"], "Sciences", "hard"),
];

const MUSIQUE: QuizQuestion[] = [
  // Easy
  q("Quel groupe a chante 'Bohemian Rhapsody' ?", ["Queen"], "Musique", "easy"),
  q("Quel artiste a sorti l'album 'Thriller' ?", ["Michael Jackson", "MJ"], "Musique", "easy"),
  q("Quel artiste est surnomme 'The King of Pop' ?", ["Michael Jackson", "MJ"], "Musique", "easy"),
  q("Quel groupe a chante 'Hey Jude' ?", ["The Beatles", "Beatles"], "Musique", "easy"),
  q("Quel chanteur a interprete 'Imagine' ?", ["John Lennon", "Lennon"], "Musique", "easy"),
  // Medium
  q("Qui a compose la Symphonie n5 en do mineur ?", ["Beethoven"], "Musique", "medium"),
  q("Comment s'appelle le chanteur de Nirvana ?", ["Kurt Cobain", "Cobain"], "Musique", "medium"),
  q("Quel groupe a chante 'Smells Like Teen Spirit' ?", ["Nirvana"], "Musique", "medium"),
  q("Quel rappeur americain a sorti 'Lose Yourself' ?", ["Eminem"], "Musique", "medium"),
  q("Quel artiste a chante 'Shape of You' ?", ["Ed Sheeran", "Sheeran"], "Musique", "medium"),
  q("Quel DJ a produit 'Titanium' avec Sia ?", ["David Guetta", "Guetta"], "Musique", "medium"),
  q("Quel artiste a chante 'Bad Guy' ?", ["Billie Eilish", "Eilish"], "Musique", "medium"),
  q("Quel chanteur a interprete 'Formidable' ?", ["Stromae"], "Musique", "medium"),
  q("Quel groupe a chante 'Viva La Vida' ?", ["Coldplay"], "Musique", "medium"),
  q("Quel groupe a chante 'Wonderwall' ?", ["Oasis"], "Musique", "medium"),
  q("Quel artiste est surnomme 'Riri' ?", ["Rihanna"], "Musique", "medium"),
  // Hard
  q("Quel groupe a chante 'Stairway to Heaven' ?", ["Led Zeppelin"], "Musique", "hard"),
  q("Quel groupe a chante 'Hotel California' ?", ["Eagles", "The Eagles"], "Musique", "hard"),
  q("Quel chanteur francais a interprete 'Je t'aime... moi non plus' ?", ["Serge Gainsbourg", "Gainsbourg"], "Musique", "hard"),
  q("Quel groupe a chante 'Creep' en 1992 ?", ["Radiohead"], "Musique", "hard"),
  q("Quel artiste a sorti 'The Dark Side of the Moon' ?", ["Pink Floyd"], "Musique", "hard"),
  q("Quel rappeur a sorti l'album 'DAMN.' ?", ["Kendrick Lamar", "Kendrick"], "Musique", "hard"),
  q("Quel groupe a chante 'Mr. Brightside' ?", ["The Killers", "Killers"], "Musique", "hard"),
  q("Quel rappeur americain a sorti 'Graduation' ?", ["Kanye West", "Kanye", "Ye"], "Musique", "hard"),
];

const RAP_FR: QuizQuestion[] = [
  // Easy
  q("Quel rappeur a chante 'Sapes comme jamais' ?", ["Maitre Gims", "Gims"], "Rap FR", "easy"),
  q("Quel rappeur est surnomme 'le Duc de Boulogne' ?", ["Booba", "B2O"], "Rap FR", "easy"),
  q("Quel rappeur a sorti 'Civilisation' en 2021 ?", ["Orelsan"], "Rap FR", "easy"),
  q("Quel rappeur a sorti 'Bande organisee' ?", ["Jul"], "Rap FR", "easy"),
  // Medium
  q("Quel rappeur a sorti l'album 'JVLIVS' ?", ["SCH"], "Rap FR", "medium"),
  q("De quelle ville vient le groupe IAM ?", ["Marseille"], "Rap FR", "medium"),
  q("Quel duo forme PNL ?", ["Ademo et N.O.S", "Ademo et NOS"], "Rap FR", "medium"),
  q("Quel rappeur a sorti l'album 'Deux freres' ?", ["PNL"], "Rap FR", "medium"),
  q("Comment s'appelle le groupe fonde par Kool Shen et JoeyStarr ?", ["NTM", "Supreme NTM"], "Rap FR", "medium"),
  q("Quel rappeur a sorti l'album 'QALF' ?", ["Damso"], "Rap FR", "medium"),
  q("Quel rappeur a sorti 'Fenomeno' ?", ["Ninho"], "Rap FR", "medium"),
  q("Quel rappeur a sorti 'Le monde Chico' ?", ["PNL"], "Rap FR", "medium"),
  q("De quelle ville vient SCH ?", ["Marseille", "Aubagne"], "Rap FR", "medium"),
  q("Quel rappeur francais a le plus de ventes de tous les temps ?", ["Jul"], "Rap FR", "medium"),
  // Hard
  q("Comment s'appelle le premier album studio de Nekfeu ?", ["Feu"], "Rap FR", "hard"),
  q("De quel pays est originaire Damso ?", ["Belgique", "Congo", "RDC"], "Rap FR", "hard"),
  q("Quel est le vrai nom de Booba ?", ["Elie Yaffa", "Elie Yaffa"], "Rap FR", "hard"),
  q("Quel rappeur a sorti l'album 'Ipseite' ?", ["Damso"], "Rap FR", "hard"),
  q("Quel rappeur a sorti l'album 'Les derniers salopards' ?", ["Alkpote"], "Rap FR", "hard"),
  q("Quel est le nom du label de Booba ?", ["92i"], "Rap FR", "hard"),
  q("Quel rappeur a sorti l'album 'Chrome' ?", ["Freeze Corleone", "Freeze"], "Rap FR", "hard"),
  q("Quel rappeur a sorti 'Neverland' ?", ["Nekfeu"], "Rap FR", "hard"),
  q("Quel rappeur est connu pour le morceau 'Freestyle du sale' ?", ["Vald"], "Rap FR", "hard"),
  q("Quel rappeur a chante 'Bruxelles vie' ?", ["Damso"], "Rap FR", "hard"),
  q("Quel rappeur a chante 'Tout va bien' ?", ["Alonzo"], "Rap FR", "hard"),
  q("De quelle ville vient Nekfeu ?", ["Paris", "le Perreux-sur-Marne"], "Rap FR", "hard"),
  q("Quel album de Rohff contient 'Qui est l'exemple ?' ?", ["La fierte des notres", "La fierte des notres"], "Rap FR", "hard"),
  q("Quel rappeur a sorti l'album 'Capo dei Capi' ?", ["La Fouine"], "Rap FR", "hard"),
];

const CINEMA: QuizQuestion[] = [
  // Easy
  q("Comment s'appelle le lion dans le Roi Lion ?", ["Simba"], "Cinema", "easy"),
  q("Quel film raconte l'histoire d'un poisson-clown perdu ?", ["Le Monde de Nemo", "Nemo", "Finding Nemo"], "Cinema", "easy"),
  q("Dans quel film entend-on 'Hakuna Matata' ?", ["Le Roi Lion", "Roi Lion"], "Cinema", "easy"),
  q("Quel film met en scene un parc de dinosaures clones ?", ["Jurassic Park"], "Cinema", "easy"),
  q("Quel acteur joue le capitaine Jack Sparrow ?", ["Johnny Depp", "Depp"], "Cinema", "easy"),
  // Medium
  q("Qui a realise 'Inception' ?", ["Christopher Nolan", "Nolan"], "Cinema", "medium"),
  q("Quel acteur joue Iron Man dans le MCU ?", ["Robert Downey Jr", "RDJ"], "Cinema", "medium"),
  q("Qui joue le Joker dans 'The Dark Knight' ?", ["Heath Ledger", "Ledger"], "Cinema", "medium"),
  q("Quel acteur joue Jack dans 'Titanic' ?", ["Leonardo DiCaprio", "DiCaprio"], "Cinema", "medium"),
  q("Comment s'appelle le personnage joue par Keanu Reeves dans Matrix ?", ["Neo", "Thomas Anderson"], "Cinema", "medium"),
  q("Quel acteur joue John Wick ?", ["Keanu Reeves", "Reeves"], "Cinema", "medium"),
  q("Quel acteur joue le role de Wolverine ?", ["Hugh Jackman", "Jackman"], "Cinema", "medium"),
  q("Quel acteur incarne Forrest Gump ?", ["Tom Hanks", "Hanks"], "Cinema", "medium"),
  q("Qui joue le role principal dans 'Joker' (2019) ?", ["Joaquin Phoenix", "Phoenix"], "Cinema", "medium"),
  q("Quel acteur incarne James Bond dans 'Casino Royale' (2006) ?", ["Daniel Craig", "Craig"], "Cinema", "medium"),
  q("Quel film francais a Omar Sy en tete d'affiche avec un tetraplegique ?", ["Intouchables", "Les Intouchables"], "Cinema", "medium"),
  q("Quel film de Pixar met en scene des emotions personnifiees ?", ["Vice-Versa", "Inside Out"], "Cinema", "medium"),
  // Hard
  q("En quelle annee est sorti le premier Star Wars ?", ["1977"], "Cinema", "hard"),
  q("Quel film a remporte l'Oscar du meilleur film en 2020 ?", ["Parasite"], "Cinema", "hard"),
  q("Qui a realise 'Pulp Fiction' ?", ["Quentin Tarantino", "Tarantino"], "Cinema", "hard"),
  q("Qui a realise 'Le Seigneur des Anneaux' ?", ["Peter Jackson", "Jackson"], "Cinema", "hard"),
  q("Qui a realise 'Fight Club' ?", ["David Fincher", "Fincher"], "Cinema", "hard"),
  q("Qui joue Thanos dans les films Avengers ?", ["Josh Brolin", "Brolin"], "Cinema", "hard"),
  q("Quel acteur joue Django dans 'Django Unchained' ?", ["Jamie Foxx"], "Cinema", "hard"),
  q("Qui a realise 'Shutter Island' ?", ["Martin Scorsese", "Scorsese"], "Cinema", "hard"),
  q("Qui a realise 'Interstellar' ?", ["Christopher Nolan", "Nolan"], "Cinema", "hard"),
  q("Qui a realise 'Les Evades' (The Shawshank Redemption) ?", ["Frank Darabont"], "Cinema", "hard"),
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
  q("Dans One Piece, quel est le reve de Luffy ?", ["Devenir le roi des pirates", "roi des pirates"], "Anime", "medium"),
  q("Quel est le nom du shinigami qui donne le Death Note a Light ?", ["Ryuk"], "Anime", "medium"),
  q("Comment s'appelle l'equipage de Luffy ?", ["Mugiwara", "Chapeau de Paille", "Straw Hat"], "Anime", "medium"),
  q("Dans Jujutsu Kaisen, comment s'appelle le personnage principal ?", ["Yuji Itadori", "Itadori", "Yuji"], "Anime", "medium"),
  q("Comment s'appelle la technique ultime de Naruto ?", ["Rasengan"], "Anime", "medium"),
  q("Dans Hunter x Hunter, comment s'appelle le personnage principal ?", ["Gon", "Gon Freecss"], "Anime", "medium"),
  q("Quel anime met en scene un garcon avec un bras mecanique (automail) ?", ["Fullmetal Alchemist", "FMA"], "Anime", "medium"),
  q("Comment s'appelle le sensei de Naruto (equipe 7) ?", ["Kakashi", "Kakashi Hatake"], "Anime", "medium"),
  q("Quel est le nom du titan d'Eren ?", ["Titan Assaillant", "Attack Titan"], "Anime", "medium"),
  q("Dans quel anime trouve-t-on le 'Nen' ?", ["Hunter x Hunter", "HxH"], "Anime", "medium"),
  q("Dans Tokyo Ghoul, comment s'appelle le personnage principal ?", ["Ken Kaneki", "Kaneki"], "Anime", "medium"),
  q("Comment s'appelle le personnage principal de Solo Leveling ?", ["Sung Jin-Woo", "Sung Jinwoo", "Jinwoo"], "Anime", "medium"),
  // Hard
  q("Comment s'appelle l'auteur de One Piece ?", ["Eiichiro Oda", "Oda"], "Anime", "hard"),
  q("Quel est le nom du Bankai d'Ichigo dans Bleach ?", ["Tensa Zangetsu"], "Anime", "hard"),
  q("Dans One Piece, comment s'appelle le fruit du demon de Luffy ?", ["Gomu Gomu", "Gomu Gomu no Mi", "Hito Hito modele Nika", "Nika"], "Anime", "hard"),
  q("Quel est le nom de l'organisation criminelle dans Naruto ?", ["Akatsuki"], "Anime", "hard"),
  q("Comment s'appelle le personnage principal de Fullmetal Alchemist ?", ["Edward Elric", "Edward", "Ed Elric"], "Anime", "hard"),
  q("Dans Demon Slayer, de quelle couleur est la lame de Tanjiro ?", ["Noir", "noire"], "Anime", "hard"),
  q("Quel anime met en scene un concours de cuisine entre lyceens ?", ["Food Wars", "Shokugeki no Soma"], "Anime", "hard"),
  q("Quel anime met en scene un match de volleyball au lycee ?", ["Haikyuu", "Haikyu"], "Anime", "hard"),
  q("Quel anime se deroule dans un monde ou 80% des gens ont des super-pouvoirs ?", ["My Hero Academia", "Boku no Hero Academia"], "Anime", "hard"),
];

const SERIES: QuizQuestion[] = [
  // Easy
  q("Dans quelle serie trouve-t-on le personnage de Walter White ?", ["Breaking Bad"], "Series", "easy"),
  q("Quelle serie met en scene un jeu mortel coreen avec des poupees geantes ?", ["Squid Game"], "Series", "easy"),
  q("Dans quelle serie des enfants jouent a Donjons & Dragons a Hawkins ?", ["Stranger Things"], "Series", "easy"),
  // Medium
  q("Comment s'appelle le personnage principal de Breaking Bad ?", ["Walter White", "Heisenberg"], "Series", "medium"),
  q("Quel personnage dit 'I am the danger' ?", ["Walter White", "Heisenberg"], "Series", "medium"),
  q("Dans quelle serie trouve-t-on le Trone de Fer ?", ["Game of Thrones", "GOT"], "Series", "medium"),
  q("Comment s'appelle le personnage principal de 'La Casa de Papel' ?", ["Le Professeur", "Professeur", "Sergio Marquina"], "Series", "medium"),
  q("Dans 'Friends', comment s'appelle le cafe ?", ["Central Perk"], "Series", "medium"),
  q("Dans 'Peaky Blinders', quel est le nom de famille principal ?", ["Shelby"], "Series", "medium"),
  q("Comment s'appelle le personnage principal de 'Peaky Blinders' ?", ["Thomas Shelby", "Tommy Shelby", "Tommy"], "Series", "medium"),
  q("Dans 'Narcos', quel baron de la drogue est le personnage central de la saison 1 ?", ["Pablo Escobar", "Escobar"], "Series", "medium"),
  q("Quelle serie met en scene des super-heros corrompus ?", ["The Boys"], "Series", "medium"),
  // Hard
  q("Comment s'appelle la prison dans 'Prison Break' ?", ["Fox River"], "Series", "hard"),
  q("Quel acteur joue Geralt de Riv dans la serie Netflix 'The Witcher' (saisons 1-3) ?", ["Henry Cavill", "Cavill"], "Series", "hard"),
  q("Comment s'appelle la serie prequelle de Game of Thrones ?", ["House of the Dragon", "HOTD"], "Series", "hard"),
  q("Quel personnage de 'The Office' est le manager regional de Dunder Mifflin ?", ["Michael Scott", "Scott"], "Series", "hard"),
  q("Dans quelle serie entend-on 'Winter is coming' ?", ["Game of Thrones", "GOT"], "Series", "medium"),
  q("Combien d'episodes compte la serie 'Game of Thrones' ?", ["73"], "Series", "hard"),
  q("Comment s'appelle la serie sur des lyceens espagnols dans une ecole d'elite ?", ["Elite", "Elite"], "Series", "hard"),
];

const JEUX_VIDEO: QuizQuestion[] = [
  // Easy
  q("Comment s'appelle le plombier emblematique de Nintendo ?", ["Mario", "Super Mario"], "Jeux Video", "easy"),
  q("Dans quel jeu construit-on des structures avec des blocs ?", ["Minecraft"], "Jeux Video", "easy"),
  q("Dans quel jeu trouve-t-on les Creepers ?", ["Minecraft"], "Jeux Video", "easy"),
  q("Dans quel jeu peut-on capturer des creatures dans des Pokeballs ?", ["Pokemon", "Pokemon"], "Jeux Video", "easy"),
  // Medium
  q("Comment s'appelle le personnage principal de 'The Legend of Zelda' ?", ["Link"], "Jeux Video", "medium"),
  q("Comment s'appelle le personnage principal de God of War ?", ["Kratos"], "Jeux Video", "medium"),
  q("Quel jeu met en scene des matchs 5v5 avec des agents aux capacites uniques, par Riot Games ?", ["Valorant"], "Jeux Video", "medium"),
  q("Quel jeu de Riot Games est un MOBA avec des champions ?", ["League of Legends", "LoL", "LOL"], "Jeux Video", "medium"),
  q("Comment s'appelle le personnage emblematique de Sonic ?", ["Sonic", "Sonic the Hedgehog"], "Jeux Video", "medium"),
  q("Comment s'appelle la princesse que Mario sauve souvent ?", ["Peach", "Princesse Peach"], "Jeux Video", "medium"),
  q("Dans quel jeu explore-t-on le monde de Teyvat ?", ["Genshin Impact", "Genshin"], "Jeux Video", "medium"),
  // Hard
  q("Comment s'appelle le createur de Minecraft ?", ["Notch", "Markus Persson"], "Jeux Video", "hard"),
  q("Quel jeu de FromSoftware se passe dans les Terres Intermediaires ?", ["Elden Ring"], "Jeux Video", "hard"),
  q("Comment s'appelle le personnage principal de 'The Witcher 3' ?", ["Geralt", "Geralt de Riv"], "Jeux Video", "hard"),
  q("Quel jeu de tir en ligne 5v5 de Valve est sorti en 2012 ?", ["CS:GO", "Counter-Strike", "CSGO", "CS2"], "Jeux Video", "hard"),
  q("Quel jeu inde met en scene un squelette nomme Sans ?", ["Undertale"], "Jeux Video", "hard"),
  q("Quel jeu de survie multijoueur se passe sur une ile avec des dinosaures ?", ["Ark", "ARK Survival Evolved", "ARK"], "Jeux Video", "hard"),
  q("Quel jeu de battle royale a popularise le genre en 2017 ?", ["Fortnite", "PUBG"], "Jeux Video", "hard"),
  q("Dans quel jeu incarne-t-on un Ashen One dans un monde sombre et difficile ?", ["Dark Souls", "Dark Souls 3"], "Jeux Video", "hard"),
];

const SPORT: QuizQuestion[] = [
  // Easy
  q("Combien de temps dure un match de football (temps reglementaire) en minutes ?", ["90"], "Sport", "easy"),
  q("Quel pays a remporte la Coupe du Monde 2018 ?", ["France"], "Sport", "easy"),
  q("Quel sport pratique-t-on a Roland-Garros ?", ["Tennis"], "Sport", "easy"),
  q("De quel pays est originaire Cristiano Ronaldo ?", ["Portugal"], "Sport", "easy"),
  // Medium
  q("Quel footballeur est surnomme 'La Pulga' ?", ["Messi", "Lionel Messi"], "Sport", "medium"),
  q("Quel pays a remporte la Coupe du Monde 2022 ?", ["Argentine"], "Sport", "medium"),
  q("Quel joueur de football detient le record de Ballons d'Or ?", ["Messi", "Lionel Messi"], "Sport", "medium"),
  q("Quel sportif jamaicain detient le record du 100m ?", ["Usain Bolt", "Bolt"], "Sport", "medium"),
  q("Quel club de foot est surnomme 'les Merengues' ?", ["Real Madrid", "Real"], "Sport", "medium"),
  q("Quel pays a remporte le plus de Coupes du Monde de football ?", ["Bresil", "Bresil"], "Sport", "medium"),
  q("Quel footballeur francais a fait un triple en finale de la Coupe du Monde 2022 ?", ["Mbappe", "Mbappe", "Kylian Mbappe"], "Sport", "medium"),
  q("Quel sport pratique LeBron James ?", ["Basketball", "basket", "NBA"], "Sport", "medium"),
  q("Dans quel pays se sont deroules les JO de 2024 ?", ["France", "Paris"], "Sport", "medium"),
  // Hard
  q("Combien de joueurs y a-t-il dans une equipe de basketball NBA sur le terrain ?", ["5"], "Sport", "hard"),
  q("Combien de sets faut-il gagner pour un Grand Chelem hommes ?", ["3"], "Sport", "hard"),
  q("Quelle est la distance d'un marathon en km ?", ["42.195", "42 km", "42,195"], "Sport", "hard"),
  q("Quel sport pratique Tiger Woods ?", ["Golf"], "Sport", "hard"),
  q("Quel joueur de tennis a remporte le plus de Grand Chelem ?", ["Djokovic", "Novak Djokovic"], "Sport", "hard"),
  q("Dans quel sport utilise-t-on un volant (shuttlecock) ?", ["Badminton"], "Sport", "hard"),
  q("Dans quel sport trouve-t-on le Tour de France ?", ["Cyclisme", "velo", "velo"], "Sport", "hard"),
];

const POP_CULTURE: QuizQuestion[] = [
  // Easy
  q("Sur quelle plateforme publie-t-on des videos courtes type TikTok ?", ["TikTok"], "Pop Culture", "easy"),
  q("Quelle plateforme de streaming est associee au gaming et au chat violet ?", ["Twitch"], "Pop Culture", "easy"),
  // Medium
  q("Comment s'appelle le createur de Facebook ?", ["Mark Zuckerberg", "Zuckerberg"], "Pop Culture", "medium"),
  q("Quel est le vrai nom de MrBeast ?", ["Jimmy Donaldson", "Jimmy"], "Pop Culture", "medium"),
  q("Quel streameur francais a organise le GP Explorer ?", ["Squeezie"], "Pop Culture", "medium"),
  q("Comment s'appelle l'IA conversationnelle d'OpenAI ?", ["ChatGPT", "GPT"], "Pop Culture", "medium"),
  q("Comment s'appelle la cryptomonnaie representee par un Shiba Inu ?", ["Dogecoin", "DOGE"], "Pop Culture", "medium"),
  // Hard
  q("Quel reseau social etait symbolise par un oiseau bleu ?", ["Twitter", "X"], "Pop Culture", "hard"),
  q("Quel Youtubeur francais est connu pour ses videos de science pop ?", ["Dr Nozman", "Nozman"], "Pop Culture", "hard"),
  q("Comment s'appelle l'evenement gaming annuel de Squeezie ?", ["GP Explorer"], "Pop Culture", "hard"),
  q("Quel Youtubeur francais est connu pour le Joueur du Grenier ?", ["Fred", "Fred Molas", "JDG"], "Pop Culture", "hard"),
  q("Quel streamer/Youtubeur est connu pour Minecraft et le Z Event ?", ["ZeratoR", "Zerator"], "Pop Culture", "hard"),
];

const DIVERS: QuizQuestion[] = [
  // Easy
  q("Quelle est la couleur obtenue en melangeant du bleu et du jaune ?", ["Vert"], "Divers", "easy"),
  q("Combien font 7 x 8 ?", ["56"], "Divers", "easy"),
  q("Quel mois de l'annee a 28 ou 29 jours ?", ["Fevrier", "Fevrier"], "Divers", "easy"),
  q("Combien de couleurs a l'arc-en-ciel ?", ["7"], "Divers", "easy"),
  q("Combien de pattes a une araignee ?", ["8"], "Divers", "easy"),
  q("Quel pays a invente la pizza ?", ["Italie"], "Divers", "easy"),
  // Medium
  q("Combien y a-t-il de signes du zodiaque ?", ["12"], "Divers", "medium"),
  q("Quel animal est l'embleme de la Republique francaise ?", ["Coq", "le coq", "coq gaulois"], "Divers", "medium"),
  q("Quelle fete celebre-t-on le 14 juillet en France ?", ["Fete nationale", "Fete nationale", "prise de la Bastille"], "Divers", "medium"),
  q("Dans quel pays a ete invente le sushi ?", ["Japon"], "Divers", "medium"),
  q("Quel instrument de musique possede 88 touches ?", ["Piano"], "Divers", "medium"),
  q("Comment s'appelle le plus grand reseau social professionnel ?", ["LinkedIn", "Linkedin"], "Divers", "medium"),
  q("Combien font 12^2 ?", ["144"], "Divers", "medium"),
  // Hard
  q("Quel est le plus gros fruit du monde ?", ["Jacquier", "jackfruit"], "Divers", "hard"),
  q("Quel est le nom de l'alphabet utilise en Russie ?", ["Cyrillique", "alphabet cyrillique"], "Divers", "hard"),
  q("Quel est le signe astrologique des personnes nees le 25 decembre ?", ["Capricorne"], "Divers", "hard"),
  q("Comment s'appelle la monnaie utilisee au Royaume-Uni ?", ["Livre sterling", "livre", "pound", "GBP"], "Divers", "hard"),
  q("Quel est le plus grand organe interne du corps humain ?", ["Foie", "le foie"], "Divers", "hard"),
  q("Quel est le plus ancien sport olympique ?", ["Course", "course a pied", "athletisme"], "Divers", "hard"),
];

// ===========================================================
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
  "Culture G", "Histoire", "Geo", "Sciences", "Musique",
  "Rap FR", "Cinema", "Anime", "Series", "Jeux Video",
  "Sport", "Pop Culture", "Divers",
];
