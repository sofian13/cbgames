import type { Connection } from "partykit/server";
import { BaseGame } from "./base-game";
import type { GameRanking } from "../shared/types";

// Reuse the same French word list as bomb-party
const FRENCH_WORDS = new Set([
  "abaisser", "abandon", "abandonner", "abeille", "aborder", "aboutir", "absence", "absent",
  "absolu", "absolument", "absorber", "abstrait", "absurde", "abuser", "accent", "accepter",
  "acces", "accident", "accompagner", "accomplir", "accord", "accorder", "accrocher", "accueil",
  "accueillir", "accuser", "acheter", "achever", "acier", "acte", "acteur", "actif",
  "action", "activite", "actrice", "actuel", "adapter", "addition", "admettre", "administration",
  "admirable", "admirer", "adopter", "adorer", "adresse", "adresser", "adulte", "adversaire",
  "affaire", "affecter", "affection", "affirmer", "affreux", "agacer", "age", "agent",
  "agir", "agiter", "agrandir", "agreable", "aider", "aigle", "aiguille", "aile",
  "ailleurs", "aimable", "aimer", "ajouter", "alarme", "album", "alerte",
  "alimenter", "alleger", "aller", "alliance", "allonger", "allumer", "alors", "altitude",
  "amasser", "amateur", "ambiance", "ambition", "ameliorer", "amener", "amer", "amical",
  "amitie", "amour", "amoureux", "amuser", "analyser", "ancien", "ange", "angle",
  "animal", "animer", "annee", "annoncer", "annuel", "apercevoir", "apparaitre", "appareil",
  "appartement", "appartenir", "appeler", "appetit", "applaudir", "appliquer", "apporter", "apprecier",
  "apprendre", "approcher", "approuver", "appuyer", "arbre", "argent", "argument", "arme",
  "armee", "arracher", "arranger", "arreter", "arrivee", "arriver", "art", "article",
  "artiste", "aspect", "assembler", "asseoir", "assez", "assister", "associer", "assurer",
  "atmosphere", "attacher", "attaquer", "atteindre", "attendre", "attention", "attirer", "attitude",
  "attraper", "aucun", "audace", "augmenter", "aujourd", "aussitot", "auteur", "autorite",
  "autour", "autre", "autrefois", "avaler", "avance", "avancer", "avantage", "avenir",
  "aventure", "avenue", "avertir", "aveugle", "avis", "avocat", "avoir", "avouer",
  "bagage", "bague", "baigner", "baisser", "balance", "balancer", "balcon", "balle",
  "ballon", "banane", "bande", "banque", "barbe", "barriere", "basculer", "bataille",
  "bateau", "batiment", "battre", "bavard", "beau", "beaucoup", "beaute", "berger",
  "besoin", "betise", "beurre", "bibliotheque", "bicyclette", "bien", "bienvenue", "bijou",
  "billet", "bizarre", "blanc", "blanche", "blesse", "blesser", "bleu", "bloquer",
  "boire", "bois", "boite", "bonbon", "bonheur", "bonjour", "bonsoir", "bonte",
  "bord", "border", "bouche", "boucher", "boucle", "bouger", "bougie", "boulanger",
  "boulevard", "bourgeois", "bousculer", "bouteille", "boutique", "bouton", "branche", "brave",
  "briller", "briser", "brouillard", "bruit", "bruler", "brusque", "brutal", "bureau",
  "cabane", "cabinet", "cacher", "cadeau", "cadre", "cafe", "cahier", "calcul",
  "calculer", "calme", "calmer", "camarade", "campagne", "capable", "capital", "capitaine",
  "caractere", "caresser", "carnet", "carreau", "carrefour", "carriere", "carte", "casser",
  "cause", "causer", "cave", "celebre", "celui", "centaine", "centre", "cercle",
  "ceremonie", "certain", "cerveau", "cesser", "chacun", "chagrin", "chaine", "chair",
  "chaise", "chaleur", "chambre", "champ", "champion", "chance", "changement", "changer",
  "chanson", "chanter", "chapeau", "chapitre", "charge", "charger", "charme", "chasser",
  "chateau", "chaud", "chauffer", "chaussure", "chemin", "chemise", "chercher", "cheval",
  "cheveu", "chiffre", "chimie", "chocolat", "choisir", "choix", "chose", "ciel",
  "cinema", "circonstance", "circuler", "citer", "citoyen", "civil", "clair", "clairement",
  "classe", "classer", "client", "climat", "cloche", "coeur", "coiffer", "coin",
  "colere", "collection", "coller", "colline", "combat", "combattre", "commander", "commencer",
  "comment", "commerce", "commettre", "commission", "communiquer", "compagnie", "compagnon",
  "comparer", "complet", "completer", "composer", "comprendre", "compter", "concentrer", "concept",
  "concernant", "concert", "conclure", "condition", "conduire", "confiance", "confier", "confirmer",
  "conflit", "confondre", "connaissance", "connaitre", "conscience", "conseil", "conseiller",
  "consentir", "consequence", "conserver", "considerer", "consister", "console", "construire",
  "consulter", "contact", "contenir", "content", "contenter", "contenu", "continuer", "contraire",
  "contre", "contribuer", "controle", "controler", "convaincre", "convenir", "conversation",
  "copain", "copier", "corde", "corps", "correct", "correspondre", "corriger", "costume",
  "coucher", "couler", "couleur", "couloir", "coup", "coupable", "couper", "couple",
  "courage", "courant", "courir", "cours", "course", "court", "cousin", "couteau",
  "couter", "coutume", "couvrir", "craindre", "crainte", "creer", "creuser", "crier",
  "crime", "criminel", "crise", "critique", "critiquer", "croire", "croiser", "croix",
  "cruel", "cuisine", "cuisinier", "curieux", "curiosite",
  "dame", "danger", "dangereux", "danser", "davantage", "debattre", "deborder", "debout",
  "debut", "debuter", "decevoir", "decider", "decision", "declaration", "declarer", "decor",
  "decorer", "decouverte", "decouvrir", "decrire", "dedans", "defaut", "defendre", "defense",
  "definir", "degager", "degre", "dehors", "deja", "dejeuner", "delicat", "demain",
  "demande", "demander", "demarche", "demenager", "demeurer", "demi", "democratie", "demolir",
  "depart", "depasser", "dependre", "depenser", "deplacer", "deposer", "depuis", "dernier",
  "derouler", "derriere", "desaccord", "descendre", "desert", "desespoir", "designer", "desir",
  "desirer", "desole", "desordre", "dessiner", "dessous", "dessus", "destin", "destruction",
  "detail", "determiner", "detester", "detruire", "devant", "developper", "devenir", "deviner",
  "devoir", "dialogue", "diamant", "difference", "different", "difficile", "difficulte",
  "dimanche", "dimension", "diminuer", "diner", "diriger", "direction", "discipline", "discours",
  "discussion", "discuter", "disparaitre", "disposer", "disposition", "dispute", "disputer",
  "distance", "distinguer", "distribuer", "divers", "diviser", "docteur", "document", "domaine",
  "dominer", "dommage", "donner", "dormir", "dossier", "double", "doucement", "douceur",
  "douleur", "douter", "douzaine", "dragon", "drame", "dresser", "droit", "droite",
  "drole", "dur", "durer", "duree",
  "echapper", "echelle", "echouer", "eclair", "eclairer", "eclat", "eclater", "ecole",
  "economie", "ecouter", "ecraser", "ecrire", "ecrivain", "education", "effacer", "effectuer",
  "effet", "effort", "effrayer", "egal", "egalement", "eglise", "election", "elegant",
  "element", "eleve", "elever", "eliminer", "eloigner", "embrasser", "emotion", "emouvoir",
  "empecher", "empereur", "empire", "emploi", "employer", "emporter", "emprunter", "encadrer",
  "encombrer", "encore", "encourager", "endormir", "endroit", "energie", "enfance", "enfant",
  "enfermer", "enfin", "engagement", "engager", "enlever", "ennemi", "ennui", "ennuyer",
  "enorme", "enquete", "enrichir", "enseigner", "ensemble", "ensuite", "entendre", "enthousiasme",
  "entier", "entourer", "entrainer", "entre", "entree", "entreprendre", "entreprise", "entrer",
  "entretenir", "envahir", "enveloppe", "envers", "envie", "environ", "environnement", "envisager",
  "envoyer", "epais", "epaule", "episode", "epoque", "epreuve", "eprouver", "equilibre",
  "equipe", "erreur", "escalier", "espace", "espece", "esperer", "espoir", "esprit",
  "essai", "essayer", "essentiel", "estimer", "etablir", "etage", "etaler", "etape",
  "etat", "eteindre", "etendre", "eternel", "etoile", "etonnant", "etonner", "etranger",
  "etroit", "etude", "etudier", "evenement", "evident", "eviter", "evolution", "evoquer",
  "exact", "exactement", "exagerer", "examen", "examiner", "excellent", "exception", "excessif",
  "exciter", "excuser", "executer", "exemple", "exercer", "exercice", "exiger", "existence",
  "exister", "experience", "explication", "expliquer", "exploiter", "explorer", "explosion",
  "exposer", "expression", "exprimer", "exterieur", "extraordinaire", "extreme",
  "fabriquer", "facade", "facile", "facilement", "faciliter", "facteur", "faible", "faiblesse",
  "faillir", "faim", "faire", "famille", "fameux", "familier", "fantaisie", "fatigue",
  "fatiguer", "faute", "fauteuil", "faveur", "favorable", "femme", "fenetre", "ferme",
  "fermer", "feroce", "fete", "feter", "feuille", "fievre", "figure", "figurer",
  "fil", "fille", "film", "fils", "final", "finalement", "finir", "flamme",
  "fleur", "fleuve", "fois", "folie", "fonction", "fond", "fonder", "fondre",
  "force", "forcer", "forger", "forme", "former", "formidable", "formule", "fortune",
  "fossile", "fou", "foule", "fournir", "foyer", "fragile", "frais", "franc",
  "francais", "franchir", "frapper", "frere", "froid", "fromage", "front", "frontiere",
  "fruit", "fuir", "fuite", "furieux", "fusil", "futur",
  "gagner", "galerie", "garantir", "garcon", "garde", "garder", "garer", "gauche",
  "geler", "general", "generation", "genereux", "genie", "genou", "genre", "gentil",
  "geste", "glace", "glisser", "gloire", "gouvernement", "gouverner", "grace", "grain",
  "grand", "grandir", "grave", "gris", "gros", "groupe", "guere", "guerre", "guider",
  "habiller", "habitant", "habiter", "habitude", "habituer", "hasard", "hater", "hausser",
  "hauteur", "herbe", "heritage", "heros", "hesiter", "heure", "heureux", "heurter",
  "hier", "histoire", "historique", "hiver", "homme", "honneur", "honte", "hopital",
  "horizon", "horloge", "horrible", "horreur", "hotel", "humain", "humble", "humeur",
  "humide", "humour",
  "ideal", "idee", "identifier", "ignorer", "illusion", "illustrer", "image", "imaginer",
  "immediat", "immense", "immobile", "impatienter", "importance", "important", "imposer", "impossible",
  "impression", "impressionner", "imprevue", "imprimer", "incapable", "incident", "inclure", "inconnu",
  "independance", "indiquer", "individu", "industrie", "influence", "informer", "ingenieur", "injuste",
  "innocent", "inquieter", "inscrire", "insister", "inspirer", "installer", "instant", "instinct",
  "institution", "instruction", "instrument", "intelligent", "intention", "interdire", "interesser",
  "interet", "interieur", "international", "interroger", "interrompre", "intervenir", "introduire",
  "inutile", "inventer", "invention", "inviter", "isoler",
  "jaloux", "jamais", "jambe", "jardin", "jaune", "jeter", "jeune", "jeunesse",
  "joie", "joindre", "joli", "jouer", "jouet", "jouir", "jour", "journal",
  "journee", "juge", "juger", "jumeau", "jurer", "jusque", "juste", "justement",
  "justice", "justifier",
  "lacher", "laid", "laine", "laisser", "lancer", "langage", "langue", "lapin",
  "large", "largement", "larme", "laver", "lecon", "lecteur", "lecture", "leger",
  "lendemain", "lentement", "lettre", "lever", "levre", "liberer", "liberte", "libre",
  "lien", "lier", "ligne", "limite", "limiter", "linge", "liquide", "lire",
  "liste", "literature", "livre", "livrer", "logement", "loger", "logique", "loin",
  "loisir", "long", "longtemps", "longueur", "louer", "lourd", "lumiere", "lundi",
  "lune", "lunette", "lutte", "lutter", "luxe",
  "machine", "madame", "magasin", "magnifique", "maigre", "main", "maintenir", "maintenant",
  "maire", "maison", "maitre", "majeur", "mal", "malade", "maladie", "malheur",
  "malheureux", "maman", "manche", "manger", "maniere", "manifester", "manoeuvre", "manquer",
  "manteau", "marche", "marcher", "mardi", "mariage", "marier", "marquer", "marron",
  "masse", "materiel", "matiere", "matin", "mauvais", "mecanique", "mechant", "mecontenter",
  "medecin", "meilleur", "melange", "melanger", "meler", "membre", "memoire", "menace",
  "menacer", "menager", "mener", "mensonge", "mentir", "mepriser", "merci", "meriter",
  "merveilleux", "message", "mesure", "mesurer", "methode", "metier", "mettre", "meuble",
  "milieu", "militaire", "million", "mince", "mine", "ministre", "minute", "miroir",
  "misere", "mission", "mobile", "mode", "modele", "moderne", "modifier", "moindre",
  "moins", "mois", "moitie", "moment", "monde", "monnaie", "monsieur", "montagne",
  "monter", "montrer", "monument", "moquer", "morceau", "mordre", "mort", "mortel",
  "moteur", "mouche", "mouiller", "mourir", "mouvement", "moyen", "muet", "multiplier",
  "munir", "mur", "murmurer", "musee", "musicien", "musique", "mystere", "mysterieux",
  "nager", "naissance", "naitre", "nation", "national", "nature", "naturel", "naturellement",
  "necessaire", "necessite", "negatif", "negligent", "negocier", "neige", "nerf", "nerveux",
  "nettoyer", "neuf", "neutre", "noble", "noir", "nombre", "nombreux", "nommer",
  "normal", "noter", "nourrir", "nourriture", "nouveau", "nouvelle", "nuage", "nuire",
  "nuit", "numero",
  "objet", "obligation", "obliger", "obscur", "observation", "observer", "obstacle", "obtenir",
  "occasion", "occuper", "odeur", "oeil", "oeuvre", "offenser", "officiel", "officier",
  "offrir", "oiseau", "ombre", "operation", "opinion", "opposer", "opposition", "optimiste",
  "orage", "orange", "ordinaire", "ordre", "oreille", "organiser", "original", "oser",
  "oublier", "ouvrage", "ouvrier", "ouvrir",
  "page", "pain", "paix", "palais", "papa", "papier", "paquet", "paradis",
  "paraitre", "parcourir", "pardon", "pardonner", "pareil", "parent", "parfait", "parfaitement",
  "parfois", "parfum", "parking", "parler", "parmi", "parole", "part", "partager",
  "partenaire", "participer", "particulier", "partie", "partir", "partout", "parvenir", "passage",
  "passer", "passion", "patience", "patient", "patron", "pauvre", "pauvrete", "payer",
  "paysage", "paysan", "peau", "peindre", "peine", "peintre", "peinture", "pencher",
  "pendant", "penetrer", "penible", "pensee", "penser", "perdre", "pere", "perfection",
  "permettre", "personnage", "personne", "personnel", "perspective", "persuader", "perte", "peser",
  "petit", "peu", "peuple", "peur", "phrase", "piece", "pierre", "piste",
  "pitie", "placer", "plafond", "plage", "plaindre", "plaine", "plaire", "plaisir",
  "plan", "planche", "planter", "plat", "plein", "pleurer", "plonger", "pluie",
  "plume", "plupart", "plus", "plusieurs", "plutot", "poche", "poesie", "poete",
  "poids", "poignee", "point", "pointe", "poisson", "poitrine", "police", "policier",
  "politique", "pomme", "pont", "populaire", "population", "porte", "porter", "portrait",
  "poser", "position", "posseder", "possible", "poste", "pourquoi", "poursuivre", "pousser",
  "poussiere", "pouvoir", "pratique", "pratiquer", "precieux", "precis", "precisement", "preciser",
  "preferer", "premier", "prendre", "preparer", "presence", "present", "presenter", "president",
  "presque", "presser", "preter", "preuve", "prevenir", "prevoir", "prier", "prince",
  "principal", "principe", "printemps", "prison", "prisonnier", "priver", "privilege", "prix",
  "probable", "probablement", "probleme", "proceder", "prochain", "produire", "produit", "professeur",
  "profession", "profiter", "profond", "programme", "progres", "projet", "promener", "promesse",
  "promettre", "prononcer", "proposer", "proposition", "propre", "proprietaire", "propriete", "proteger",
  "prouver", "provoquer", "prudent", "public", "publier", "puissance", "puissant", "punir", "pur",
  "qualifier", "qualite", "quantite", "quartier", "question", "quitter", "quotidien",
  "raconter", "radio", "raide", "raison", "raisonnable", "ralentir", "ramasser", "ramener",
  "rang", "ranger", "rapide", "rapidement", "rappeler", "rapport", "rapporter", "rapprocher",
  "rare", "rassembler", "rassurer", "rater", "ravir", "reagir", "realiser", "realite",
  "recevoir", "recherche", "rechercher", "recit", "reclamer", "recommander", "recommencer",
  "reconcilier", "reconnaitre", "recours", "reculer", "rediger", "redouter", "reduire", "reel",
  "reflechir", "reflexion", "reforme", "refuser", "regard", "regarder", "regime", "region",
  "regle", "regler", "regretter", "regulier", "rejeter", "rejoindre", "relation", "relever",
  "religieux", "religion", "remarquer", "remercier", "remettre", "remonter", "remplacer", "remplir",
  "rencontre", "rencontrer", "rendre", "renoncer", "renouveler", "renseignement", "rentrer", "renverser",
  "repandre", "reparer", "repas", "repasser", "repeter", "repondre", "reponse", "reporter",
  "repos", "reposer", "reprendre", "representer", "reproduction", "republique", "reputation", "resister",
  "resolution", "resoudre", "respect", "respecter", "responsable", "ressembler", "ressource", "restaurant",
  "reste", "rester", "resultat", "retard", "retenir", "retirer", "retour", "retourner",
  "retraite", "retrouver", "reunion", "reunir", "reussir", "reveil", "reveiller", "reveler",
  "revenir", "rever", "revolte", "revolution", "revue", "riche", "richesse", "rideau",
  "ridicule", "rien", "rigoureux", "rire", "risque", "risquer", "riviere", "robe",
  "rocher", "role", "roman", "rompre", "rond", "rose", "rougir", "rouler",
  "route", "routine", "rue", "ruine", "ruse",
  "sable", "sabre", "saisir", "saison", "salaire", "salle", "salon", "saluer",
  "salut", "sang", "sante", "satisfaction", "satisfaire", "sauf", "sauter", "sauver",
  "savoir", "scandale", "scene", "science", "scientifique", "sculpteur", "secher", "secret",
  "secretaire", "securite", "seduire", "seigneur", "sejour", "semaine", "sembler", "semer",
  "sens", "sensation", "sensible", "sentiment", "sentir", "separer", "serieux", "serrer",
  "serrure", "servir", "service", "seuil", "seulement", "severe", "siecle", "siege",
  "signe", "signer", "signifier", "silence", "silencieux", "simple", "simplement", "simplifier",
  "sincere", "situation", "social", "societe", "soigner", "soin", "soir", "soiree",
  "soldat", "soleil", "solennel", "solide", "solitaire", "solitude", "solution", "sombre",
  "somme", "sommeil", "sommet", "songer", "sonner", "sorte", "sortir", "souci",
  "soudain", "souffler", "souffrance", "souffrir", "souhaiter", "soulager", "soulever", "souligner",
  "soumettre", "soupcon", "soupconner", "souper", "soupirer", "souple", "source", "sourd",
  "sourire", "souris", "soutenir", "souvenir", "souvent", "special", "spectacle", "spectateur",
  "splendide", "sport", "station", "statue", "structure", "stupide", "style", "subir",
  "substance", "subtil", "succeder", "succes", "sucre", "suffire", "suggerer", "suite",
  "suivant", "suivre", "sujet", "superieur", "supporter", "supposer", "supprimer", "surface",
  "surgir", "surprise", "surtout", "surveiller", "survivre", "suspect", "suspendre", "symbole",
  "sympathie", "systeme",
  "table", "tableau", "tache", "taille", "tailler", "taire", "talent", "tandis",
  "tapis", "tarder", "tasse", "telephone", "telephoner", "television", "tellement", "temoin",
  "temperature", "temple", "temps", "tendre", "tendresse", "tenir", "tenter", "terme",
  "terminer", "terrain", "terre", "terrible", "terreur", "territoire", "tete", "theatre",
  "theme", "theorie", "tiers", "timide", "tirer", "tissu", "titre", "toile",
  "toit", "tombe", "tomber", "ton", "toucher", "toujours", "tour", "tourner",
  "trace", "tracer", "tradition", "traduire", "tragique", "trahir", "train", "trainer",
  "trait", "traiter", "trajet", "tranquille", "transformer", "transmettre", "transport", "transporter",
  "travail", "travailler", "traverser", "trembler", "tresor", "tribunal", "triomphe", "triompher",
  "triste", "tristesse", "tromper", "troupeau", "trouver", "tuer", "tunnel", "type",
  "unique", "union", "univers", "universel", "universite", "urgent", "usage", "user",
  "usine", "utile", "utiliser",
  "vacances", "vague", "vaincre", "valet", "valeur", "valoir", "varier", "vaste",
  "veille", "veiller", "vendre", "vengeance", "venir", "vent", "ventre", "verdure",
  "veritable", "verite", "verre", "verser", "vertu", "vetement", "victime", "victoire",
  "vide", "vider", "vieillard", "vieillir", "vieux", "village", "ville", "violence",
  "violent", "visage", "visible", "visite", "visiter", "vitesse", "vitre", "vivant",
  "vivre", "voici", "voie", "voile", "voir", "voisin", "voiture", "voix",
  "voler", "volonte", "volume", "voter", "vouloir", "voyage", "voyager", "voyageur",
  "vrai", "vraiment", "vue",
]);

const INITIAL_TIME = 8;
const MIN_TIME = 4;
const LIVES = 3;
const MIN_WORD_LENGTH = 3;

// Starting words that work well (common letters at end)
const STARTER_WORDS = [
  "maison", "table", "arbre", "route", "monde",
  "livre", "femme", "terre", "porte", "homme",
];

interface ChainPlayer {
  id: string;
  name: string;
  lives: number;
  score: number;
  isAlive: boolean;
}

export class WordChainGame extends BaseGame {
  chainPlayers: Map<string, ChainPlayer> = new Map();
  turnOrder: string[] = [];
  currentTurnIndex = 0;
  lastWord = "";
  requiredLetter = "";
  usedWords: Set<string> = new Set();
  timeLeft = INITIAL_TIME;
  timer: ReturnType<typeof setInterval> | null = null;
  round = 1;
  status: "waiting" | "playing" | "game-over" = "waiting";

  getCurrentTime(): number {
    return Math.max(MIN_TIME, INITIAL_TIME - Math.floor(this.round / 5));
  }

  start() {
    this.started = true;
    this.status = "playing";

    for (const [id, player] of this.players) {
      this.chainPlayers.set(id, {
        id,
        name: player.name,
        lives: LIVES,
        score: 0,
        isAlive: true,
      });
      this.turnOrder.push(id);
    }

    // Shuffle turn order
    for (let i = this.turnOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.turnOrder[i], this.turnOrder[j]] = [this.turnOrder[j], this.turnOrder[i]];
    }

    // Pick a random starting word
    const starter = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
    this.lastWord = starter;
    this.requiredLetter = starter[starter.length - 1].toUpperCase();
    this.usedWords.add(starter);

    this.startNewTurn();
  }

  startNewTurn() {
    if (this.status === "game-over") return;

    // Skip eliminated players
    let attempts = 0;
    while (attempts < this.turnOrder.length) {
      const playerId = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
      const cp = this.chainPlayers.get(playerId);
      if (cp?.isAlive) break;
      this.currentTurnIndex++;
      attempts++;
    }

    if (attempts >= this.turnOrder.length) {
      this.endWordChain();
      return;
    }

    this.timeLeft = this.getCurrentTime();
    this.broadcastState();
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.broadcast({
        type: "game-update",
        payload: { timeLeft: this.timeLeft },
      });

      if (this.timeLeft <= 0) {
        this.onTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onTimeUp() {
    this.stopTimer();
    const currentPlayerId = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
    const cp = this.chainPlayers.get(currentPlayerId);
    if (!cp) return;

    cp.lives--;
    if (cp.lives <= 0) {
      cp.isAlive = false;
    }

    const alivePlayers = Array.from(this.chainPlayers.values()).filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      if (alivePlayers.length === 1) {
        alivePlayers[0].score += 10;
      }
      this.endWordChain();
      return;
    }

    this.broadcast({
      type: "round-result",
      payload: {
        event: "time-up",
        playerId: currentPlayerId,
        playerName: cp.name,
        livesLeft: cp.lives,
        isEliminated: !cp.isAlive,
      },
    });

    this.round++;
    this.currentTurnIndex++;
    setTimeout(() => this.startNewTurn(), 2000);
  }

  onMessage(payload: Record<string, unknown>, sender: Connection) {
    const action = payload.action as string;

    if (action === "submit-word") {
      const word = (payload.word as string || "").toLowerCase().trim();
      const senderPlayer = this.findGamePlayerByConnection(sender.id);
      if (!senderPlayer) return;

      const currentPlayerId = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
      if (senderPlayer.id !== currentPlayerId) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce n'est pas ton tour !" },
        });
        return;
      }

      if (word.length < MIN_WORD_LENGTH) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: `Le mot doit faire au moins ${MIN_WORD_LENGTH} lettres` },
        });
        return;
      }

      if (word[0].toUpperCase() !== this.requiredLetter) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: `Le mot doit commencer par "${this.requiredLetter}"` },
        });
        return;
      }

      if (this.usedWords.has(word)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce mot a déjà été utilisé !" },
        });
        return;
      }

      if (!FRENCH_WORDS.has(word)) {
        this.sendTo(sender.id, {
          type: "game-error",
          payload: { message: "Ce mot n'est pas dans le dictionnaire" },
        });
        return;
      }

      // Valid word!
      this.stopTimer();
      this.usedWords.add(word);
      this.lastWord = word;
      this.requiredLetter = word[word.length - 1].toUpperCase();

      const cp = this.chainPlayers.get(currentPlayerId);
      if (cp) {
        cp.score++;
      }

      this.broadcast({
        type: "round-result",
        payload: {
          event: "word-accepted",
          playerId: currentPlayerId,
          word,
          nextLetter: this.requiredLetter,
        },
      });

      this.round++;
      this.currentTurnIndex++;
      setTimeout(() => this.startNewTurn(), 1000);
    }
  }

  endWordChain() {
    this.stopTimer();
    this.status = "game-over";

    const players = Array.from(this.chainPlayers.values());
    players.sort((a, b) => {
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      if (a.score !== b.score) return b.score - a.score;
      return b.lives - a.lives;
    });

    const rankings: GameRanking[] = players.map((p, i) => ({
      playerId: p.id,
      playerName: p.name,
      rank: i + 1,
      score: p.score,
    }));

    this.endGame(rankings);
  }

  findGamePlayerByConnection(connectionId: string) {
    for (const [, player] of this.players) {
      if (player.connectionId === connectionId) return player;
    }
    return null;
  }

  getState(): Record<string, unknown> {
    return {
      currentPlayerId: this.turnOrder[this.currentTurnIndex % this.turnOrder.length] ?? null,
      lastWord: this.lastWord,
      requiredLetter: this.requiredLetter,
      players: Array.from(this.chainPlayers.values()),
      timeLeft: this.timeLeft,
      status: this.status,
      usedWords: Array.from(this.usedWords),
      round: this.round,
    };
  }

  broadcastState() {
    this.broadcast({
      type: "game-state",
      payload: this.getState(),
    });
  }

  cleanup() {
    this.stopTimer();
  }
}
