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
