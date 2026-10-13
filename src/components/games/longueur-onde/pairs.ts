/**
 * Banque de paires d'extrêmes du Curseur (mode un seul téléphone).
 * Règle d'écriture : des échelles CONCRÈTES que tout le monde place sans réfléchir
 * (froid ↔ chaud, pas cher ↔ hors de prix…), libellés courts, et pour chaque paire
 * 3 exemples d'indice (gauche / milieu / droite) montrés au Médium pour l'aider.
 */

export interface CursorPair {
  left: string;
  right: string;
  /** Exemples d'indices : [tout à gauche, au milieu, tout à droite] */
  ex: [string, string, string];
  /**
   * Manche « catégorie » : le Médium doit donner UN exemple de cette catégorie
   * (ex. « destination ») qui se place à l'endroit de la cible. Sans article.
   */
  category?: string;
  /** Article de la catégorie, pour accorder « Une destination » / « Trouve UN plat ». */
  art?: "un" | "une";
}

export const CURSOR_PAIRS: CursorPair[] = [
  { left: "Froid", right: "Chaud", ex: ["la banquise", "un bain tiède", "un volcan"] },
  { left: "Nul", right: "Génial", ex: ["une chaussette mouillée", "un sandwich triangle", "les grandes vacances"] },
  { left: "Minuscule", right: "Énorme", ex: ["une fourmi", "un chat", "une baleine"] },
  { left: "Sain", right: "Pas sain du tout", ex: ["un brocoli", "une pizza", "un kebab à 4 h du mat"] },
  { left: "Calme", right: "Bruyant", ex: ["une bibliothèque", "un open space", "un concert de métal"] },
  { left: "Ringard", right: "Stylé", ex: ["chaussettes + sandales", "un jean basique", "une veste en cuir"] },
  { left: "Facile", right: "Impossible", ex: ["faire cuire des pâtes", "monter un meuble en kit", "se lécher le coude"] },
  { left: "Pas cher", right: "Hors de prix", ex: ["une baguette", "un resto", "un yacht"] },
  { left: "Gentil", right: "Méchant", ex: ["un bébé panda", "un chat", "le grand méchant loup"] },
  { left: "Doux", right: "Épicé", ex: ["une purée", "un curry", "un piment de l'enfer"] },
  { left: "Romantique", right: "Pas du tout romantique", ex: ["un dîner aux chandelles", "un ciné", "un date à la laverie"] },
  { left: "Inutile", right: "Indispensable", ex: ["un fax", "un parapluie", "le wifi"] },
  { left: "Lent", right: "Rapide", ex: ["un escargot", "un vélo", "une fusée"] },
  { left: "Moche", right: "Magnifique", ex: ["un pull de Noël raté", "une plante verte", "un coucher de soleil"] },
  { left: "Léger", right: "Lourd", ex: ["une plume", "un sac de courses", "un piano"] },
  { left: "Tout propre", right: "Dégoûtant", ex: ["un bloc opératoire", "une chambre d'ado", "les toilettes d'un festival"] },
  { left: "Triste", right: "Joyeux", ex: ["un enterrement", "un lundi matin", "un anniversaire surprise"] },
  { left: "Sucré", right: "Salé", ex: ["la barbe à papa", "le caramel au beurre salé", "les chips"] },
  { left: "Trouillard", right: "Courageux", ex: ["dormir avec la lumière", "un chat", "un pompier"] },
  { left: "Truc de gamin", right: "Truc d'adulte", ex: ["un toboggan", "un jeu vidéo", "payer ses impôts"] },
  { left: "Ennuyeux", right: "Passionnant", ex: ["une file d'attente", "un documentaire", "une finale de foot"] },
  { left: "Ancien", right: "Moderne", ex: ["un dinosaure", "une télé", "un robot"] },
  { left: "Raisonnable", right: "Complètement fou", ex: ["un livret d'épargne", "un tatouage", "sauter en parachute"] },
  { left: "Tout doux", right: "Ça pique", ex: ["un chaton", "une serviette", "un cactus"] },
  { left: "Petit creux", right: "Gros festin", ex: ["une pomme", "un sandwich", "un buffet à volonté"] },
  { left: "Sec", right: "Trempé", ex: ["le désert", "une serviette", "une piscine"] },
  { left: "Sombre", right: "Lumineux", ex: ["une cave", "un salon", "le soleil"] },
  { left: "Mou", right: "Dur", ex: ["un marshmallow", "du pain", "un caillou"] },
  { left: "Ça dure 2 secondes", right: "Ça dure une éternité", ex: ["un éternuement", "un film", "une réunion du lundi"] },
  { left: "Super rare", right: "Il y en a partout", ex: ["un trèfle à 4 feuilles", "un parapluie", "un pigeon"] },
  { left: "Sans danger", right: "Super dangereux", ex: ["un oreiller", "un vélo", "un requin"] },
  { left: "J'en ai honte", right: "J'en suis fier", ex: ["trébucher devant tout le monde", "un selfie", "un diplôme"] },
  { left: "Simple", right: "Prise de tête", ex: ["une tartine", "un meuble en kit", "un contrat d'assurance"] },
  { left: "Pas sexy", right: "Très sexy", ex: ["un pyjama en pilou", "une chemise", "un tango"] },
  { left: "Mauvaise idée", right: "Excellente idée", ex: ["écrire à son ex à 3 h", "une coupe de cheveux maison", "une sieste"] },
  { left: "Ça pue", right: "Ça sent bon", ex: ["une poubelle", "un bus", "une boulangerie"] },
  { left: "Débutant", right: "Expert", ex: ["un premier cours de ski", "un permis tout neuf", "un chef étoilé"] },
  { left: "Discret", right: "Voyant", ex: ["un ninja", "un pull gris", "un costume de licorne"] },
  { left: "Lève-tôt", right: "Couche-tard", ex: ["un boulanger", "un employé de bureau", "un DJ"] },
  { left: "Délicieux", right: "Immangeable", ex: ["une crêpe au chocolat", "un plat de cantine", "une soupe de chaussettes"] },
  { left: "Normal", right: "Bizarre", ex: ["dire bonjour", "parler à ses plantes", "promener son poisson rouge"] },
  { left: "Fragile", right: "Solide", ex: ["un œuf", "une chaise", "un tank"] },
  { left: "Bas de gamme", right: "Grand luxe", ex: ["un jogging troué", "un pull", "une montre en or"] },
  { left: "Mauviette", right: "Costaud", ex: ["une souris", "un humain moyen", "un gorille"] },
  { left: "Pas futé", right: "Génie", ex: ["une poule", "un chien", "un dauphin"] },
  { left: "Sérieux", right: "Rigolo", ex: ["un notaire", "un prof", "un clown"] },
  { left: "Timide", right: "Extraverti", ex: ["une tortue dans sa carapace", "un chat", "un animateur de camping"] },
  { left: "Rassurant", right: "Flippant", ex: ["un câlin", "un hôpital", "un clown dans une cave"] },
  { left: "Flemmard", right: "Hyperactif", ex: ["un paresseux", "un chat", "un écureuil"] },
  { left: "Tout près", right: "Très loin", ex: ["la boulangerie d'en bas", "l'Espagne", "la Lune"] },
  { left: "Beau temps", right: "Sale temps", ex: ["un ciel bleu", "un nuage gris", "un ouragan"] },
  { left: "Has-been", right: "Tendance", ex: ["un minitel", "une montre", "une trottinette électrique"] },
  { left: "OK au 1er date", right: "Jamais au 1er date", ex: ["un ciné", "parler de son ex", "présenter sa maman"] },
  { left: "Ça se dit à sa mère", right: "Jamais à sa mère", ex: ["j'ai eu mon permis", "j'ai démissionné", "mon samedi soir"] },
  { left: "Tranquille", right: "Stressant", ex: ["un hamac", "un examen", "désamorcer une bombe"] },
  { left: "Truc de mamie", right: "Truc d'ado", ex: ["le tricot", "le vélo", "les stories"] },
  { left: "Sobre", right: "Bling-bling", ex: ["une chemise blanche", "une montre", "une chaîne en or"] },
  { left: "Mignon", right: "Effrayant", ex: ["un chaton", "un pigeon", "une araignée géante"] },
  { left: "Tout jeune", right: "Très très vieux", ex: ["un nouveau-né", "un prof", "une momie"] },
  { left: "Inconnu", right: "Superstar", ex: ["ton voisin", "le maire de ta ville", "le Père Noël"] },
  { left: "Tout plat", right: "Très en pente", ex: ["une crêpe", "une colline", "l'Everest"] },
  { left: "Liquide", right: "Solide", ex: ["de l'eau", "du miel", "une brique"] },
  { left: "Ça se partage", right: "Ça se garde", ex: ["des chips", "un secret", "une brosse à dents"] },
  { left: "Pire cadeau", right: "Meilleur cadeau", ex: ["des chaussettes", "un livre", "un voyage"] },
  { left: "Pire job", right: "Job de rêve", ex: ["nettoyer les égouts", "caissier", "testeur de matelas"] },
  { left: "Pouvoir nul", right: "Pouvoir de ouf", ex: ["parler aux pigeons", "respirer sous l'eau", "se téléporter"] },
  { left: "Excuse bidon", right: "Excuse en béton", ex: ["mon chien a mangé mes devoirs", "j'étais malade", "j'ai sauvé un chaton"] },
  { left: "Soirée ratée", right: "Soirée de légende", ex: ["personne n'est venu", "une soirée jeux", "danser jusqu'au matin"] },
  { left: "Fast-food", right: "Gastronomique", ex: ["des frites", "une raclette", "du homard"] },
  { left: "Bon animal de compagnie", right: "Très mauvaise idée", ex: ["un chat", "un cochon", "un crocodile"] },
  { left: "Sport tranquille", right: "Sport extrême", ex: ["la pétanque", "le tennis", "le saut en parachute"] },
  { left: "OK au bureau", right: "Jamais au bureau", ex: ["une chemise", "un short", "un pyjama"] },
  { left: "Une fois dans sa vie", right: "Tous les jours", ex: ["un mariage", "un resto", "se brosser les dents"] },
  { left: "Pas peur du tout", right: "Terrifiant", ex: ["un doudou", "une piqûre", "une maison hantée"] },
  { left: "Glauque", right: "Chic", ex: ["un parking", "une gare", "un palace"] },
  { left: "Tout raide", right: "Tout souple", ex: ["une barre de fer", "une règle en plastique", "un chewing-gum"] },
  { left: "Truc du matin", right: "Truc du soir", ex: ["le café", "le goûter", "un bisou de bonne nuit"] },
  { left: "Bien vu en soirée", right: "Très mal vu", ex: ["apporter à manger", "arriver en retard", "partir avec le gâteau"] },
  { left: "Vite oublié", right: "Inoubliable", ex: ["un mardi", "un anniversaire", "son premier baiser"] },
  { left: "Petit bobo", right: "Urgences", ex: ["une écharde", "une entorse", "une jambe cassée"] },
  { left: "Zéro effort", right: "Ultra sportif", ex: ["le canapé", "une balade", "un marathon"] },
  { left: "Petit mensonge", right: "Énorme mensonge", ex: ["« j'adore ton pull »", "« j'étais dans les bouchons »", "« je suis astronaute »"] },
  { left: "Muet", right: "Bavard", ex: ["un poisson", "un prof", "un perroquet"] },
  { left: "Pas drôle", right: "Trop drôle", ex: ["une feuille d'impôts", "une blague de tonton", "un chat qui rate son saut"] },
  { left: "Bon pour la planète", right: "Mauvais pour la planète", ex: ["un vélo", "une voiture", "un jet privé"] },
  { left: "Ça se lave vite", right: "Corvée de vaisselle", ex: ["une cuillère", "une poêle", "un plat de lasagnes cramé"] },
  { left: "Ça se range", right: "Bazar total", ex: ["une bibliothèque", "un sac à main", "un garage"] },
  { left: "Ça se mange avec les doigts", right: "Faut des couverts", ex: ["des frites", "une salade", "une soupe"] },
  { left: "Petit bruit", right: "Gros boum", ex: ["une souris", "une porte qui claque", "un feu d'artifice"] },
];

/** Raccourci d'écriture d'une manche « catégorie ». */
const k = (art: "un" | "une", category: string, left: string, right: string, ex: [string, string, string]): CursorPair =>
  ({ art, category, left, right, ex });

/**
 * Manches « catégorie » : une catégorie + une échelle, le Médium cite UN exemple
 * de la catégorie qui tombe sur la cible (destination nulle ↔ géniale → « Bali »).
 * Exemples génériques (pas de marques), évidents pour toute la table.
 */
export const CATEGORY_PAIRS: CursorPair[] = [
  // Voyages
  k("une", "destination", "Nulle", "Géniale", ["une aire d'autoroute", "un camping sous la pluie", "les Maldives"]),
  k("une", "destination", "Pas chère", "Hors de prix", ["chez mamie", "l'Espagne en bus", "Dubaï en palace"]),
  k("une", "destination", "Calme", "Intense", ["un monastère", "Barcelone", "Las Vegas"]),
  k("une", "destination", "Pour les enfants", "Pour les adultes", ["un parc d'attractions", "la montagne", "Ibiza"]),
  k("un", "pays", "Glacial", "Brûlant", ["l'Islande", "la France", "l'Égypte"]),
  k("un", "pays", "Tout près", "Au bout du monde", ["la Belgique", "le Maroc", "la Nouvelle-Zélande"]),
  k("une", "ville", "Calme", "Ne dort jamais", ["un village de 200 habitants", "Bordeaux", "New York"]),
  k("un", "moyen de transport", "Confortable", "Galère", ["un jet privé", "le train", "le bus de nuit bondé"]),
  k("un", "moyen de transport", "Lent", "Rapide", ["une trottinette", "un bus", "un avion"]),
  // Écrans
  k("un", "réseau social", "Pour les ados", "Pour les darons", ["l'appli de vidéos courtes", "le réseau des photos", "le réseau où tata partage des chats"]),
  k("une", "appli", "Inutile", "Indispensable", ["une appli d'horoscope", "une appli de recettes", "le GPS"]),
  k("une", "appli", "Rassurante", "Stressante", ["une appli de méditation", "la météo", "l'appli de la banque en fin de mois"]),
  k("un", "film", "Pour les enfants", "Pour les adultes", ["un dessin animé de princesses", "un film de super-héros", "un thriller sanglant"]),
  k("un", "film", "Pour pleurer", "Pour rire", ["un drame où le chien meurt", "une comédie romantique", "une parodie débile"]),
  k("un", "film", "Tout doux", "Flippant", ["un dessin animé", "un polar", "un film d'exorcisme"]),
  k("un", "film", "Navet", "Chef-d'œuvre", ["un téléfilm de Noël", "un film d'action", "un grand classique"]),
  k("un", "film", "Parfait en date", "À éviter en date", ["une comédie romantique", "un film d'action", "un film d'horreur gore"]),
  k("une", "série", "Pour s'endormir", "À binger toute la nuit", ["un docu sur la pêche", "une sitcom", "un thriller plein de rebondissements"]),
  k("une", "série", "Légère", "Traumatisante", ["une sitcom", "une série policière", "une série de zombies"]),
  k("un", "emoji", "Gentil", "Agressif", ["le cœur", "le pouce levé", "le couteau"]),
  k("un", "emoji", "Ringard", "Stylé", ["le smiley qui pleure de rire", "le pouce levé", "le crâne"]),
  k("un", "emoji", "Innocent", "Sous-entendu", ["le soleil", "le clin d'œil", "l'aubergine"]),
  // À table
  k("un", "plat", "Sain", "Pas sain", ["une salade de quinoa", "des lasagnes", "un tacos 3 viandes"]),
  k("un", "plat", "Facile à cuisiner", "Galère à cuisiner", ["des pâtes au beurre", "un gratin", "un soufflé"]),
  k("un", "plat", "Pas cher", "Hors de prix", ["des pâtes", "une raclette", "du caviar"]),
  k("un", "plat", "Parfait en date", "Catastrophe en date", ["des sushis", "un burger", "des spaghettis à l'ail"]),
  k("un", "plat", "Ringard", "Tendance", ["la salade piémontaise", "un croque-monsieur", "un poke bowl"]),
  k("un", "dessert", "Léger", "Bourratif", ["une salade de fruits", "une tarte aux pommes", "un fondant au chocolat"]),
  k("un", "dessert", "Nul", "Génial", ["un yaourt nature", "une compote", "un tiramisu"]),
  k("un", "dessert", "Pour les enfants", "Pour les adultes", ["un flan", "une crème brûlée", "un café gourmand"]),
  k("un", "petit-déj", "Sain", "Pas sain", ["un bol de fruits", "une tartine beurrée", "des restes de pizza froide"]),
  k("un", "fromage", "Doux", "Qui pue", ["la mozzarella", "le comté", "le maroilles"]),
  k("une", "pizza", "Classique", "Sacrilège", ["la margherita", "la 4 fromages", "la pizza ananas-banane"]),
  k("un", "fruit", "Facile à manger", "Galère à manger", ["une banane", "une orange", "une grenade"]),
  k("un", "légume", "Les enfants détestent", "Les enfants adorent", ["les choux de Bruxelles", "les carottes", "les frites"]),
  k("un", "parfum de glace", "Classique", "Bizarre", ["vanille", "pistache", "fromage de chèvre"]),
  k("un", "plat de cantine", "Le pire", "Le meilleur", ["les épinards à la crème", "le hachis parmentier", "les frites du vendredi"]),
  k("un", "repas du soir", "Léger", "Bourratif", ["une soupe", "un steak-frites", "une raclette"]),
  k("une", "boisson de soirée", "Ringarde", "Stylée", ["le jus de pomme en brique", "un soda", "un mocktail à la menthe"]),
  k("une", "boisson", "Sucrée", "Amère", ["un sirop de grenadine", "un thé glacé", "un café serré"]),
  k("une", "boisson", "Pour les enfants", "Pour les adultes", ["un chocolat chaud", "un thé", "un expresso serré"]),
  k("une", "boisson", "Glacée", "Brûlante", ["un granité", "un jus d'orange", "un thé fumant"]),
  // Les gens
  k("un", "prénom", "Ringard", "Stylé", ["Gérard", "Julien", "Nova"]),
  k("un", "prénom", "Bébé de 2025", "Papy", ["Léo", "Thierry", "Marcel"]),
  k("un", "prénom", "Gentil", "Méchant de film", ["Câline", "Patrick", "Lucifer"]),
  k("un", "nom de chien", "Ridicule", "Impressionnant", ["Pupuce", "Max", "Zeus"]),
  k("un", "métier", "Tranquille", "Stressant", ["gardien de phare", "boulanger", "démineur"]),
  k("un", "métier", "Mal payé", "Très bien payé", ["stagiaire", "prof", "footballeur pro"]),
  k("un", "métier", "Propre", "Salissant", ["employé de banque", "cuisinier", "égoutier"]),
  k("un", "métier", "Rêve d'enfant", "Cauchemar d'enfant", ["astronaute", "banquier", "dentiste"]),
  k("un", "job d'été", "Tranquille", "L'enfer", ["maître-nageur", "serveur en terrasse", "les vendanges en pleine canicule"]),
  // Amour & soirées
  k("un", "premier rendez-vous", "Nul", "Génial", ["un fast-food sur un parking", "un ciné", "un dîner sur un rooftop"]),
  k("un", "premier rendez-vous", "Gênant", "Classe", ["chez ses parents", "un bowling", "un pique-nique au coucher du soleil"]),
  k("un", "premier rendez-vous", "Calme", "Intense", ["une balade au parc", "un karaoké", "un saut en parachute"]),
  k("un", "premier rendez-vous", "Pas cher", "Hors de prix", ["une balade", "un resto italien", "un week-end à Venise"]),
  k("une", "phrase de drague", "Gênante", "Classe", ["« t'es tombée du ciel ? »", "« salut, ça va ? »", "un compliment sincère sur son rire"]),
  k("un", "message à 3 h du mat", "Innocent", "À regretter", ["« bien rentré ? »", "« tu dors ? »", "« je t'ai toujours aimé »"]),
  k("un", "lieu pour demander en mariage", "Gênant", "Magique", ["sur l'écran géant du stade", "au resto", "sur une plage au coucher du soleil"]),
  k("un", "cadeau d'anniversaire", "Nul", "Génial", ["une paire de chaussettes", "un livre", "un voyage surprise"]),
  k("un", "cadeau d'anniversaire", "Pas cher", "Hors de prix", ["une carte faite main", "un parfum", "une voiture"]),
  k("un", "cadeau", "Romantique", "Pas romantique", ["un bouquet de roses", "un bon d'achat", "un aspirateur"]),
  k("une", "excuse pour partir tôt", "Crédible", "Pas crédible", ["je bosse tôt demain", "mon chat est malade", "mon poisson rouge déprime"]),
  k("une", "excuse pour être en retard", "Crédible", "Pas crédible", ["les bouchons", "j'ai perdu mes clés", "enlevé par des extraterrestres"]),
  k("une", "excuse pour annuler un date", "Polie", "Cruelle", ["je suis malade", "j'ai un empêchement", "j'ai rencontré quelqu'un hier"]),
  k("un", "lieu de soirée", "Calme", "Intense", ["un salon avec des jeux de société", "un bar", "une boîte de nuit"]),
  k("une", "fête", "Gênante", "Mythique", ["un repas de famille tendu", "un apéro", "un mariage où tout le monde danse"]),
  k("une", "fin de soirée", "Calme", "Chaotique", ["une tisane et au lit", "un kebab", "tout le monde à l'eau habillé"]),
  k("une", "chanson pour danser", "Ringarde", "Stylée", ["la danse des canards", "un tube disco", "le son du moment en boîte"]),
  k("une", "chanson", "Calme", "Intense", ["une berceuse", "une ballade pop", "du métal hurlé"]),
  k("une", "chanson", "Triste", "Joyeuse", ["une chanson de rupture", "une ballade", "Joyeux anniversaire"]),
  k("une", "chanson pour le karaoké", "Gênante", "Mythique", ["l'hymne national", "un slow en anglais", "un tube des années 80"]),
  k("un", "jeu de société", "Calme", "Finit en dispute", ["un puzzle", "les petits chevaux", "le jeu où on achète des rues"]),
  // Bêtes, pouvoirs & trucs
  k("un", "super-pouvoir", "Inutile", "Trop puissant", ["parler aux pigeons", "voir dans le noir", "arrêter le temps"]),
  k("un", "super-pouvoir", "Gênant", "Classe", ["rougir sur commande", "respirer sous l'eau", "voler"]),
  k("un", "animal de compagnie", "Facile", "Galère", ["un poisson rouge", "un chat", "un crocodile"]),
  k("un", "animal de compagnie", "Mignon", "Flippant", ["un lapin", "un perroquet", "une mygale"]),
  k("un", "animal de compagnie", "Calme", "Bruyant", ["une tortue", "un chien", "un coq"]),
  k("un", "animal de compagnie", "Pas cher", "Hors de prix", ["un poisson rouge", "un chien de race", "un cheval"]),
  k("un", "animal", "Inoffensif", "Mortel", ["un lapin", "un chien", "un requin blanc"]),
  k("une", "odeur", "Horrible", "Délicieuse", ["les poubelles en été", "la lessive", "le pain chaud"]),
  k("une", "odeur", "Rassurante", "Inquiétante", ["un gâteau au four", "l'eau de Javel", "le brûlé"]),
  k("une", "odeur", "Gênante", "Classe", ["des pieds après le sport", "le café", "un parfum de luxe"]),
  k("un", "bruit", "Apaisant", "Insupportable", ["la pluie sur le toit", "un aspirateur", "une craie sur un tableau"]),
  k("un", "sport", "Tranquille", "Épuisant", ["la pétanque", "le tennis", "le marathon"]),
  k("un", "sport", "Sans risque", "Dangereux", ["les échecs", "le foot", "le saut en base jump"]),
  k("un", "sport", "Ringard", "Stylé", ["le curling", "le badminton", "le surf"]),
  k("un", "sport", "Ennuyeux à regarder", "Captivant", ["le golf", "le tennis", "une finale de foot"]),
  k("un", "sport", "Pas cher", "Hors de prix", ["la course à pied", "le tennis", "le polo à cheval"]),
  k("une", "activité du dimanche", "Chill", "Sportive", ["la sieste", "une balade", "un trail en montagne"]),
  k("une", "tenue", "Décontractée", "Très habillée", ["un pyjama", "un jean-baskets", "un smoking"]),
  k("une", "coupe de cheveux", "Ringarde", "Stylée", ["la coupe au bol", "la raie sur le côté", "un dégradé bien net"]),
  k("un", "tatouage", "Regrettable", "Stylé", ["le prénom de son ex", "un petit cœur", "un dragon dans le dos"]),
  k("une", "voiture", "Pas chère", "Hors de prix", ["une vieille citadine", "un SUV familial", "une voiture de course"]),
  k("une", "voiture", "Ringarde", "Stylée", ["une voiture sans permis", "un break", "un cabriolet"]),
  k("une", "matière à l'école", "Facile", "Difficile", ["la récré", "l'anglais", "la physique quantique"]),
  k("un", "endroit pour dormir", "Inconfortable", "Le grand luxe", ["un banc de gare", "un canapé", "un lit king size dans un palace"]),
  k("un", "objet pour une île déserte", "Inutile", "Indispensable", ["une cravate", "un livre", "un couteau suisse"]),
  k("un", "objet oublié chez son date", "Pas grave", "Catastrophe", ["un stylo", "son écharpe", "son téléphone"]),
  k("une", "phrase à dire à son boss", "Pro", "Viré direct", ["« bien reçu, merci »", "« je peux partir plus tôt ? »", "« t'as une tête de chips »"]),
  k("une", "insulte", "Mignonne", "Méchante", ["patate", "andouille", "espèce de cafard"]),
  k("un", "compliment", "Bizarre", "Touchant", ["« t'as un beau front »", "« t'as l'air reposé »", "« t'es la personne la plus drôle que je connaisse »"]),
  k("une", "habitude", "Saine", "Pas saine", ["boire de l'eau", "le café du matin", "scroller jusqu'à 4 h"]),
];

/** « Une destination » (sticker de la manche). */
export function categoryLabel(pair: CursorPair): string | null {
  if (!pair.category) return null;
  const art = pair.art ?? "un";
  return `${art.charAt(0).toUpperCase()}${art.slice(1)} ${pair.category}`;
}

/**
 * Pioche d'une partie : 2 manches « catégorie » pour 1 paire simple, mélangées,
 * jamais deux fois la même (chaque paire n'apparaît qu'une fois dans la pioche).
 */
export function buildDeck(): CursorPair[] {
  const shuffle = <T,>(a: T[]): T[] => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const cats = shuffle(CATEGORY_PAIRS);
  const simple = shuffle(CURSOR_PAIRS);
  // une partie sur deux commence par une paire simple → le rythme varie
  const offset = Math.random() < 0.5 ? 0 : 2;
  const deck: CursorPair[] = [];
  while (cats.length || simple.length) {
    const wantSimple = (deck.length + offset) % 3 === 2;
    const next = (wantSimple ? simple.shift() ?? cats.shift() : cats.shift() ?? simple.shift())!;
    deck.push(next);
  }
  return deck;
}

/** Exemple d'indice pour la position de la cible (0 = tout à gauche, 100 = tout à droite). */
export function exampleFor(pair: CursorPair, target: number): string {
  return target < 36 ? pair.ex[0] : target > 64 ? pair.ex[2] : pair.ex[1];
}

/**
 * Points selon l'écart entre le curseur et la cible (échelle 0-100) :
 * 4 dans la part centrale, puis 3, puis 2, sinon 0.
 */
export const ZONE_4 = 4;
export const ZONE_3 = 11;
export const ZONE_2 = 18;
export function cursorPoints(diff: number): number {
  const d = Math.abs(diff);
  if (d <= ZONE_4) return 4;
  if (d <= ZONE_3) return 3;
  if (d <= ZONE_2) return 2;
  return 0;
}
