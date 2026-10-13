"use client";

import { useMemo, useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Mascot, MASCOT_COLORS, MASCOT_PALETTE, type MascotColor, type MascotMood } from "@/components/Mascot";
import { registerSoftReplay } from "@/lib/game-replay";
import { ArrowLeft, BookOpen, Check, ChevronDown, ChevronUp, Dices, Eye, Lock, Mic, Minus, Plus, RotateCcw, Scale, Shuffle, Target, TriangleAlert } from "lucide-react";
import { GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { DISPLAY, PlayersSetup, SoundButton, ZButton, ZChip, ZZ, zBackground, useScrollTopOn } from "@/components/games/local-kit";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { isOfflineApp } from "@/lib/offline-app";

/* ─────────────────────────────────────────────────────────────
   L'INTRUS LOCAL — Pass-and-play (un seul téléphone)
   Toute la logique de jeu tourne dans le composant.
   Aucune dépendance serveur / PartyKit.
   ───────────────────────────────────────────────────────────── */

// ═════════════════════════════════════════════════════════════
//  Modèle de données
// ═════════════════════════════════════════════════════════════
type Role = "civil" | "undercover" | "mrwhite" | "jester";

interface LocalPlayer {
  idx: number;            // position d'origine (sert de "id" stable)
  name: string;
  role: Role;
  word: string | null;
  isEliminated: boolean;
  eliminatedRound: number | null;
  hasSpoken: boolean;     // a confirmé "j'ai parlé" pour la manche en cours
  score: number;
}

type LocalPhase =
  | "setup-players"
  | "setup-roles"
  | "pass-reveal"
  | "reveal"
  | "table"
  | "review-pick"
  | "review-pass"
  | "review-show"
  | "pass-vote"
  | "vote"
  | "tally"
  | "eliminate"
  | "mrwhite-pass"
  | "mrwhite-guess"
  | "over";

type EndReason = "civils-win" | "undercover-wins" | "mrwhite-wins" | "jester-wins";

// ═════════════════════════════════════════════════════════════
//  Banque de mots (même contenu que le serveur)
// ═════════════════════════════════════════════════════════════
// Grosse liste de mots, classée par catégorie. Chaque paire = (mot A, mot voisin B) ;
// au tirage, on choisit au hasard lequel va aux civils et lequel va à l'Intrus.
// Paires originales, sans marques. La catégorie « +18 » n'est jamais cochée par défaut.
const WORD_CATEGORIES: { id: string; label: string; emoji: string; adult?: boolean; pairs: [string, string][] }[] = [
  { id: "food", label: "Nourriture", emoji: "🍔", pairs: [
    ["Lasagnes", "Gratin dauphinois"], ["Croque-monsieur", "Panini"], ["Crêpe", "Gaufre"], ["Couscous", "Paella"],
    ["Quiche", "Tarte salée"], ["Omelette", "Œuf au plat"], ["Ratatouille", "Tian de légumes"], ["Hot-dog", "Burger"],
    ["Nems", "Samoussas"], ["Taboulé", "Salade de riz"], ["Purée", "Frites"], ["Pain au chocolat", "Croissant"],
    ["Éclair", "Religieuse"], ["Macaron", "Meringue"], ["Muffin", "Cupcake"], ["Yaourt", "Fromage blanc"],
    ["Camembert", "Brie"], ["Steak haché", "Boulette"], ["Saucisson", "Jambon"], ["Popcorn", "Chips"],
    ["Barbe à papa", "Guimauve"], ["Pizza", "Calzone"],
  ] },
  { id: "drinks", label: "Boissons", emoji: "🥤", pairs: [
    ["Soda au cola", "Soda à l'orange"], ["Jus de pomme", "Jus de raisin"], ["Limonade", "Eau pétillante"], ["Thé glacé", "Citronnade"],
    ["Chocolat chaud", "Café au lait"], ["Expresso", "Cappuccino"], ["Tisane", "Bouillon"], ["Milkshake", "Smoothie"],
    ["Sirop de menthe", "Sirop de grenadine"], ["Bière", "Cidre"], ["Vin rouge", "Vin rosé"], ["Champagne", "Crémant"],
    ["Mojito", "Piña colada"], ["Sangria", "Punch"], ["Rhum", "Whisky"], ["Kombucha", "Ginger beer"],
    ["Boisson énergisante", "Café serré"], ["Eau de coco", "Jus d'ananas"], ["Diabolo", "Panaché"],
  ] },
  { id: "places", label: "Lieux", emoji: "🌍", pairs: [
    ["Bibliothèque", "Médiathèque"], ["Boulangerie", "Pâtisserie"], ["Camping", "Gîte"], ["Zoo", "Aquarium"],
    ["Fête foraine", "Parc d'attractions"], ["Patinoire", "Piscine"], ["Mairie", "Préfecture"], ["Phare", "Château d'eau"],
    ["Grotte", "Tunnel"], ["Port", "Marina"], ["Ferme", "Ranch"], ["Laverie", "Pressing"],
    ["Cimetière", "Chapelle"], ["Escape game", "Salle d'arcade"], ["Salle de sport", "Dojo"], ["Plage", "Crique"],
    ["Refuge", "Chalet"], ["Office du tourisme", "Agence de voyage"], ["Planétarium", "Observatoire"], ["Péage", "Station-service"],
  ] },
  { id: "sport", label: "Sport", emoji: "⚽", pairs: [
    ["Football", "Futsal"], ["Tennis", "Squash"], ["Ping-pong", "Badminton"], ["Ski de fond", "Biathlon"],
    ["Escrime", "Kendo"], ["Aviron", "Canoë"], ["Water-polo", "Natation synchronisée"], ["Parapente", "Parachute"],
    ["Marathon", "Triathlon"], ["Boxe", "Kick-boxing"], ["Bowling", "Pétanque"], ["Saut en hauteur", "Saut à la perche"],
    ["Haltérophilie", "Musculation"], ["Tir à l'arc", "Fléchettes"], ["Roller", "Patin à glace"], ["Gymnastique", "Trampoline"],
    ["Rugby", "Football américain"], ["Kitesurf", "Planche à voile"], ["Golf", "Croquet"], ["Yoga", "Pilates"],
    ["Handball", "Volley"],
  ] },
  { id: "animals", label: "Animaux", emoji: "🐾", pairs: [
    ["Hérisson", "Porc-épic"], ["Koala", "Paresseux"], ["Panda", "Raton laveur"], ["Pieuvre", "Calamar"],
    ["Méduse", "Étoile de mer"], ["Chameau", "Dromadaire"], ["Zèbre", "Girafe"], ["Kangourou", "Wallaby"],
    ["Flamant rose", "Cigogne"], ["Perroquet", "Toucan"], ["Mouton", "Lama"], ["Cochon", "Sanglier"],
    ["Chauve-souris", "Hibou"], ["Fourmi", "Termite"], ["Coccinelle", "Luciole"], ["Phoque", "Otarie"],
    ["Moustique", "Mouche"], ["Écureuil", "Marmotte"], ["Poisson rouge", "Tortue d'eau"], ["Lynx", "Guépard"],
  ] },
  { id: "fiction", label: "Fiction", emoji: "🎬", pairs: [
    ["Vampire", "Loup-garou"], ["Sorcière", "Fée"], ["Zombie", "Momie"], ["Pirate", "Corsaire"],
    ["Chevalier", "Samouraï"], ["Ninja", "Espion"], ["Dragon", "Licorne"], ["Robot", "Cyborg"],
    ["Extraterrestre", "Astronaute"], ["Super-héros", "Super-vilain"], ["Princesse", "Reine"], ["Sirène", "Nymphe"],
    ["Ogre", "Troll"], ["Magicien", "Alchimiste"], ["Cow-boy", "Shérif"], ["Détective", "Inspecteur"],
    ["Dinosaure", "Mammouth"], ["Génie", "Elfe"], ["Gladiateur", "Viking"], ["Sitcom", "Téléréalité"],
    ["Western", "Film de cape et d'épée"],
  ] },
  { id: "transport", label: "Transport", emoji: "🚗", pairs: [
    ["Voiture", "Camionnette"], ["TGV", "Train de nuit"], ["Trottinette", "Skateboard"], ["Hélicoptère", "Montgolfière"],
    ["Kayak", "Pédalo"], ["Tracteur", "Moissonneuse"], ["Ambulance", "Camion de pompiers"], ["Taxi", "VTC"],
    ["Bus scolaire", "Car de tourisme"], ["Téléphérique", "Télésiège"], ["Jet-ski", "Hors-bord"], ["Monocycle", "Tandem"],
    ["Calèche", "Charrette"], ["Péniche", "Chalutier"], ["Scooter", "Mobylette"], ["Planeur", "ULM"],
    ["Paquebot", "Ferry"], ["Tramway", "Funiculaire"], ["Dépanneuse", "Camion-benne"], ["Fusée", "Satellite"],
  ] },
  { id: "objects", label: "Objets", emoji: "📦", pairs: [
    ["Agrafeuse", "Trombone"], ["Ciseaux", "Cutter"], ["Gomme", "Correcteur"], ["Bougie", "Lampe torche"],
    ["Réveil", "Minuteur"], ["Peigne", "Brosse à cheveux"], ["Brosse à dents", "Fil dentaire"], ["Coussin", "Oreiller"],
    ["Couette", "Plaid"], ["Tire-bouchon", "Décapsuleur"], ["Parapluie", "Imperméable"], ["Portefeuille", "Sac banane"],
    ["Jumelles", "Télescope"], ["Boussole", "Carte"], ["Cadenas", "Coffre-fort"], ["Sifflet", "Klaxon"],
    ["Ballon", "Frisbee"], ["Puzzle", "Casse-tête"], ["Dé", "Carte à jouer"], ["Marteau", "Maillet"],
    ["Tournevis", "Clé à molette"],
  ] },
  { id: "nature", label: "Nature", emoji: "🌦️", pairs: [
    ["Arc-en-ciel", "Aurore boréale"], ["Grêle", "Verglas"], ["Tsunami", "Tremblement de terre"], ["Avalanche", "Glissement de terrain"],
    ["Dune", "Falaise"], ["Marais", "Étang"], ["Récif", "Lagon"], ["Cactus", "Palmier"],
    ["Sapin", "Chêne"], ["Rose", "Tulipe"], ["Tournesol", "Marguerite"], ["Champignon", "Mousse"],
    ["Coquillage", "Galet"], ["Comète", "Météorite"], ["Éclipse", "Pleine lune"], ["Brise", "Rafale"],
    ["Glacier", "Iceberg"], ["Canyon", "Vallée"], ["Geyser", "Source chaude"], ["Cascade", "Rapides"],
  ] },
  { id: "events", label: "Événements", emoji: "🎉", pairs: [
    ["Mariage", "Fiançailles"], ["Anniversaire surprise", "Pendaison de crémaillère"], ["Enterrement de vie de jeune fille", "Baby shower"], ["Remise de diplômes", "Bal de promo"],
    ["Brocante", "Vide-grenier"], ["Feu d'artifice", "Lâcher de lanternes"], ["Saint-Valentin", "Fête des mères"], ["Réveillon de Noël", "Jour de l'An"],
    ["Chandeleur", "Mardi gras"], ["Carnaval", "Bal masqué"], ["Kermesse", "Fête de village"], ["Salon", "Foire"],
    ["Pique-nique", "Barbecue"], ["Rentrée scolaire", "Vacances d'été"], ["Déménagement", "Rénovation"], ["Entretien d'embauche", "Premier jour de travail"],
    ["Match", "Tournoi"], ["Défilé", "Parade"], ["Spectacle de fin d'année", "Remise des prix"], ["Halloween", "Soirée déguisée"],
  ] },
  { id: "jobs", label: "Métiers", emoji: "💼", pairs: [
    ["Facteur", "Livreur"], ["Boucher", "Poissonnier"], ["Chirurgien", "Anesthésiste"], ["Hôtesse de l'air", "Guide touristique"],
    ["Kinésithérapeute", "Ostéopathe"], ["Maçon", "Charpentier"], ["Mécanicien", "Carrossier"], ["DJ", "Animateur radio"],
    ["Photographe", "Cameraman"], ["Bibliothécaire", "Archiviste"], ["Sage-femme", "Pédiatre"], ["Notaire", "Comptable"],
    ["Vigile", "Garde du corps"], ["Chauffeur de bus", "Conducteur de train"], ["Agriculteur", "Viticulteur"], ["Pharmacien", "Opticien"],
    ["Maître-nageur", "Sauveteur en mer"], ["Styliste", "Couturier"], ["Prêtre", "Moine"], ["Clown", "Mime"],
  ] },
  { id: "tech", label: "Écrans & tech", emoji: "📱", pairs: [
    ["Smartphone", "Tablette"], ["Ordinateur portable", "Ordinateur fixe"], ["Console de salon", "Console portable"], ["Réseau social", "Messagerie"],
    ["Série", "Film"], ["Podcast", "Livre audio"], ["Selfie", "Photo de groupe"], ["Emoji", "GIF"],
    ["Clé USB", "Disque dur"], ["Wi-Fi", "Bluetooth"], ["Télécommande", "Manette"], ["Écouteurs sans fil", "Casque audio"],
    ["Montre connectée", "Podomètre"], ["Imprimante", "Scanner"], ["Mot de passe", "Code PIN"], ["Appel vidéo", "Message vocal"],
    ["Streaming", "Replay"], ["Jeu de tir", "Jeu de course"], ["Moteur de recherche", "Encyclopédie"], ["Drone", "Voiture télécommandée"],
    ["Plateforme vidéo", "Chaîne de télé"],
  ] },
  { id: "music", label: "Musique", emoji: "🎵", pairs: [
    ["Guitare", "Ukulélé"], ["Piano", "Orgue"], ["Violon", "Contrebasse"], ["Flûte", "Clarinette"],
    ["Trompette", "Cor de chasse"], ["Batterie", "Tambourin"], ["Accordéon", "Harmonica"], ["Harpe", "Lyre"],
    ["Rap", "Slam"], ["Rock", "Métal"], ["Reggae", "Ska"], ["Jazz", "Blues"],
    ["Chorale", "Fanfare"], ["Karaoké", "Blind test"], ["Opéra", "Comédie musicale"], ["Disque vinyle", "Cassette"],
    ["Chef d'orchestre", "Soliste"], ["Berceuse", "Comptine"], ["Tube de l'été", "Hymne national"], ["Platine", "Table de mixage"],
  ] },
  { id: "home", label: "Maison", emoji: "🏠", pairs: [
    ["Canapé", "Fauteuil"], ["Lit superposé", "Hamac"], ["Baignoire", "Jacuzzi"], ["Douche", "Sauna"],
    ["Cave", "Grenier"], ["Balcon", "Terrasse"], ["Volet", "Rideau"], ["Lave-vaisselle", "Lave-linge"],
    ["Micro-ondes", "Four"], ["Grille-pain", "Gaufrier"], ["Bouilloire", "Cafetière"], ["Poêle", "Casserole"],
    ["Tapis", "Paillasson"], ["Étagère", "Commode"], ["Lustre", "Lampadaire"], ["Serrure", "Interphone"],
    ["Cheminée", "Radiateur"], ["Aspirateur", "Serpillière"], ["Escalier", "Ascenseur"], ["Garage", "Abri de jardin"],
  ] },
  { id: "fashion", label: "Mode", emoji: "👕", pairs: [
    ["Jean", "Jogging"], ["Pull", "Sweat à capuche"], ["Basket", "Mocassin"], ["Bottes de pluie", "Après-ski"],
    ["Écharpe", "Foulard"], ["Bonnet", "Casquette"], ["Robe", "Jupe"], ["Chemise", "Polo"],
    ["Pyjama", "Peignoir"], ["Short", "Maillot de bain"], ["Cravate", "Nœud papillon"], ["Gants", "Moufles"],
    ["Manteau", "Doudoune"], ["Lunettes de soleil", "Masque de ski"], ["Collier", "Boucles d'oreilles"], ["Ceinture", "Bretelles"],
    ["Tongs", "Chaussons"], ["Costume", "Smoking"], ["Tablier", "Blouse"], ["Sac à main", "Cartable"],
  ] },
  { id: "anime", label: "Anime", emoji: "🎌", pairs: [
    ["Naruto", "Sasuke"], ["Goku", "Vegeta"], ["Luffy", "Zoro"], ["Itachi", "Madara"],
    ["Gojo", "Sukuna"], ["Tanjiro", "Zenitsu"], ["Levi", "Eren"], ["Mikasa", "Historia"],
    ["Nami", "Robin"], ["One Piece", "Bleach"], ["Konoha", "Akatsuki"], ["Sharingan", "Byakugan"],
    ["Bankai", "Zanpakuto"], ["Manga", "Comics"], ["Shinigami", "Hollow"], ["Titan", "Géant"],
  ] },
  { id: "adult", label: "+18", emoji: "🔞", adult: true, pairs: [
    ["Suçon", "Morsure"], ["Lingerie", "Nuisette"], ["String", "Tanga"],
    ["Porte-jarretelles", "Bas résille"], ["Strip-tease", "Effeuillage"], ["Lap dance", "Pole dance"],
    ["Menottes", "Bandeau sur les yeux"], ["Plume", "Glaçon"], ["Jeu de rôle", "Déguisement coquin"],
    ["Coup d'un soir", "Ex de passage"], ["Plan cul", "Sex friend"], ["Préservatif", "Lubrifiant"],
    ["Capote XL", "Capote parfumée"], ["Love room", "Love hotel"], ["Sexto", "Nude"],
    ["Photo osée", "Selfie miroir"], ["Préliminaires", "Câlin crapuleux"], ["Jacuzzi à deux", "Douche à deux"],
    ["Talons aiguilles", "Cuissardes"], ["Strip-poker", "Action ou vérité"], ["Dirty talk", "Mots doux à l'oreille"],
    ["Body", "Guêpière"], ["Déshabillé", "Pyjama sexy"], ["Huile de massage", "Bougie de massage"],
    ["Bain de minuit", "Baignade nue"], ["Cabine d'essayage", "Ascenseur"], ["Toilettes de boîte", "Siège arrière"],
    ["Fessée", "Fouet"], ["Gémissement", "Soupir"], ["Tatouage caché", "Piercing caché"],
    ["Sous-vêtement oublié", "Chaussette oubliée"], ["Gage coquin", "Défi osé"], ["Spectacle de strip-teaseurs", "Enterrement de vie de jeune fille"],
    ["Kamasutra", "Position acrobatique"], ["Nuit blanche", "Grasse mat' à deux"], ["Bisou dans le cou", "Souffle dans l'oreille"],
    ["Main aux fesses", "Main sur la cuisse"], ["Lit qui grince", "Voisin qui tape au mur"], ["Bain moussant", "Pétales de rose"],
    ["Regard qui en dit long", "Clin d'œil"],
  ] },
];
// Sans sélection : tout sauf le +18.
const ALL_WORD_PAIRS: [string, string][] = WORD_CATEGORIES.filter((c) => !c.adult).flatMap((c) => c.pairs);

// ═════════════════════════════════════════════════════════════
//  Tokens (mirror online)
// ═════════════════════════════════════════════════════════════
const ROLE_COLOR: Record<Role, string> = { civil: "#3DDC97", undercover: "#FF3EA5", mrwhite: "#FFD23F", jester: "#C58CFF" };
const ROLE_LABEL: Record<Role, string> = { civil: "Civil", undercover: "Intrus", mrwhite: "Fantôme", jester: "Bouffon" };
const ROLE_ARTICLE: Record<Role, string> = { civil: "un Civil", undercover: "l'Intrus", mrwhite: "le Fantôme", jester: "le Bouffon" };

/** Taille du mot secret adaptée à sa longueur (le mot le plus long décide). */
const wordFontSize = (word: string | null, max = 56) => {
  const longest = Math.max(1, ...(word ?? "?????").split(/\s+/).map((w) => w.length));
  return `clamp(24px, ${Math.min(15, 125 / longest).toFixed(1)}vw, ${max}px)`;
};
const WORD_WRAP: CSSProperties = { overflowWrap: "break-word", wordBreak: "break-word", hyphens: "auto" };

const colorByIdx = (idx: number): MascotColor => MASCOT_COLORS[idx % MASCOT_COLORS.length];

// ═════════════════════════════════════════════════════════════
//  Composant principal
// ═════════════════════════════════════════════════════════════
export default function UndercoverLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  // ── State global ────────────────────────────────────────
  const [phase, setPhase]           = useState<LocalPhase>("setup-players");
  const [players, setPlayers]       = useState<LocalPlayer[]>([]);
  const [round, setRound]           = useState(1);
  const [endReason, setEndReason]   = useState<EndReason | null>(null);
  // Catégories de mots sélectionnées (toutes par défaut, sauf le +18).
  const [selectedCats, setSelectedCats] = useState<Set<string>>(() => new Set(WORD_CATEGORIES.filter((c) => !c.adult).map((c) => c.id)));

  // Pair de mots tirée pour la partie
  const [civilWord, setCivilWord]   = useState("");
  const [rerollNotice, setRerollNotice] = useState(false);
  const [ucWord, setUcWord]         = useState("");

  // Config de rôles (configurée en setup-roles)
  const [ucCount, setUcCount]       = useState(1);
  const [mrWhite, setMrWhite]       = useState(false);
  const [jester, setJester]         = useState(false);  // Bouffon : gagne seul s'il se fait éliminer par le vote

  // Distribution / phase pass-reveal
  const [revealIdx, setRevealIdx]   = useState(0);   // joueur courant qui voit son mot

  // Ordre de parole + joueur courant
  const [order, setOrder]           = useState<number[]>([]); // index des joueurs vivants
  const [currentSpeaker, setCurrentSpeaker] = useState(0);    // position dans `order`

  // Phase vote
  const [voteOrder, setVoteOrder]   = useState<number[]>([]); // ordre des votants vivants
  const [voteIdx, setVoteIdx]       = useState(0);            // position dans voteOrder
  const [votes, setVotes]           = useState<Record<number, number>>({}); // voter → target

  // Phase eliminate
  const [eliminatedIdx, setEliminatedIdx] = useState<number | null>(null);

  // Phase review (revoir mon mot)
  const [reviewIdx, setReviewIdx]   = useState<number | null>(null);
  const [reviewBack, setReviewBack] = useState<LocalPhase>("table");

  // Le Fantôme devine
  const [mrWhiteGuess, setMrWhiteGuess] = useState<string | null>(null);
  const [mrWhiteRight, setMrWhiteRight] = useState<boolean | null>(null);

  useEffect(() => { preloadSfx(["card-shuffle", "card-flip", "whoosh", "tock", "gong", "boom", "wrong", "lose", "win", "powerup", "ding", "toggle", "select", "success"]); }, []);
  useScrollTopOn(`${phase}-${revealIdx}-${round}`);

  // ── Helpers ─────────────────────────────────────────────
  const alive = players.filter((p) => !p.isEliminated);
  const aliveUC = alive.filter((p) => p.role === "undercover").length;
  const aliveMW = alive.filter((p) => p.role === "mrwhite").length;
  const aliveCv = alive.filter((p) => p.role === "civil").length;

  // ── Démarrage : noms validés ────────────────────────────
  const handleStartNames = (names: string[]) => {
    const initial: LocalPlayer[] = names.map((n, i) => ({
      idx: i, name: n,
      role: "civil", word: null,
      isEliminated: false, eliminatedRound: null,
      hasSpoken: false, score: 0,
    }));
    setPlayers(initial);
    // Auto-balance par défaut selon nb joueurs
    const n = names.length;
    if (n <= 4)      { setUcCount(1); setMrWhite(false); }
    else if (n <= 6) { setUcCount(1); setMrWhite(true);  }
    else             { setUcCount(2); setMrWhite(true);  }
    setJester(false);
    setPhase("setup-roles");
  };

  // ── Distribution des rôles + mots ───────────────────────
  const distributeRoles = () => {
    // Pioche dans les catégories choisies (toutes si aucune sélection).
    const pool = selectedCats.size === 0
      ? ALL_WORD_PAIRS
      : WORD_CATEGORIES.filter((c) => selectedCats.has(c.id)).flatMap((c) => c.pairs);
    const src0 = pool.length > 0 ? pool : ALL_WORD_PAIRS;
    // Jamais deux fois la même paire d'affilée (bouton « Changer de mot »)
    const src = src0.length > 1 ? src0.filter((pp) => !pp.includes(civilWord)) : src0;
    const pair = src[Math.floor(Math.random() * src.length)];
    const [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
    setCivilWord(a); setUcWord(b);

    const ids = players.map((p) => p.idx);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);

    // Nouvelle distribution = manche neuve : on remet tout le monde en vie.
    const newPlayers: LocalPlayer[] = players.map((p) => ({ ...p, isEliminated: false, eliminatedRound: null, hasSpoken: false, role: "civil" as Role, word: a as string | null }));
    let i = 0;
    for (let u = 0; u < ucCount && i < shuffled.length; u++, i++) {
      const id = shuffled[i];
      newPlayers[id] = { ...newPlayers[id], role: "undercover", word: b };
    }
    if (mrWhite && i < shuffled.length) {
      const id = shuffled[i];
      newPlayers[id] = { ...newPlayers[id], role: "mrwhite", word: null };
      i++;
    }
    if (jester && i < shuffled.length) {
      const id = shuffled[i];
      // Le Bouffon a le mot des civils (il se fond dans la masse), mais son but
      // est de se faire éliminer.
      newPlayers[id] = { ...newPlayers[id], role: "jester", word: a };
      i++;
    }
    for (; i < shuffled.length; i++) {
      const id = shuffled[i];
      newPlayers[id] = { ...newPlayers[id], role: "civil", word: a };
    }

    setPlayers(newPlayers);
    setRevealIdx(0);
    playSfx("card-shuffle", { volume: 0.8 });
    setPhase("pass-reveal");
  };

  // « Relancer la partie » (menu paramètres) : si une partie est en cours,
  // on redistribue directement avec les mêmes joueurs + rôles (nouveau mot),
  // sans repasser par les écrans de réglages.
  const inGame = players.length > 0 && phase !== "setup-players" && phase !== "setup-roles";
  useEffect(() => {
    registerSoftReplay(inGame ? () => {
      setRound(1);
      setEndReason(null);
      setEliminatedIdx(null);
      setMrWhiteGuess(null);
      setMrWhiteRight(null);
      distributeRoles();
    } : null);
    return () => registerSoftReplay(null);
  });

  // « Mot nul ? » : nouvelle paire (et nouveaux rôles). Si c'est le 1er joueur,
  // il voit directement son nouveau mot ; sinon d'autres ont vu l'ancien → on
  // refait la distribution depuis le début.
  const rerollWord = () => {
    const first = revealIdx === 0;
    distributeRoles();
    if (first) setPhase("reveal");
    else setRerollNotice(true);
  };

  // ── Avancer dans pass-reveal ────────────────────────────
  const ackReveal = () => {
    if (revealIdx < players.length - 1) {
      setRevealIdx(revealIdx + 1);
      setPhase("pass-reveal");
    } else {
      // Tous ont vu leur mot → table de parole
      startRoundTable();
    }
  };

  // ── Démarrage manche : ordre de parole ──────────────────
  const startRoundTable = () => {
    const aliveIds = players
      .filter((p) => !p.isEliminated)
      .map((p) => p.idx);
    const shuffled = [...aliveIds].sort(() => Math.random() - 0.5);
    setOrder(shuffled);
    setCurrentSpeaker(0);
    // reset hasSpoken
    setPlayers((ps) => ps.map((p) => ({ ...p, hasSpoken: false })));
    setVotes({});
    setEliminatedIdx(null);
    setMrWhiteGuess(null);
    setMrWhiteRight(null);
    setPhase("table");
  };

  const advanceSpeaker = () => {
    const next = currentSpeaker + 1;
    setPlayers((ps) => ps.map((p) => p.idx === order[currentSpeaker] ? { ...p, hasSpoken: true } : p));
    if (next < order.length) {
      setCurrentSpeaker(next);
    }
    // Si plus personne → on n'avance pas automatiquement, l'hôte clique "Passer au vote"
  };

  // ── Vote de groupe (un seul, sur le téléphone partagé) ──
  const startVote = () => {
    setPhase("vote");
  };

  // La table désigne UN joueur ensemble → on l'élimine directement.
  const eliminateTarget = (id: number) => {
    const target = players[id];
    if (!target) return;
    setPlayers((ps) => ps.map((p) => (p.idx === id ? { ...p, isEliminated: true, eliminatedRound: round } : p)));
    setEliminatedIdx(id);
    // Roulement de tambour… puis le verdict (imposteur démasqué = gong, innocent = raté)
    playCombo("drumroll");
    if (target.role === "undercover") { playSfx("gong", { volume: 0.9, delay: 1.05 }); playSfx("success", { volume: 0.6, delay: 1.2 }); }
    else if (target.role === "jester") { playSfx("win", { volume: 0.9, delay: 1.05 }); }
    else if (target.role === "mrwhite") { playSfx("gong", { volume: 0.8, delay: 1.05 }); }
    else { playSfx("wrong", { volume: 0.8, delay: 1.05 }); playSfx("lose", { volume: 0.5, delay: 1.12 }); }
    if (target.role === "jester") {
      // Le Bouffon voulait être éliminé → il gagne immédiatement.
      setPlayers((ps) => ps.map((p) => (p.idx === id ? { ...p, score: p.score + 6 } : p)));
      setEndReason("jester-wins");
      setPhase("over");
      return;
    }
    if (target.role === "mrwhite") setPhase("mrwhite-pass");
    else setPhase("eliminate");
  };

  // ── Le Fantôme devine ───────────────────────────────────
  const submitMrWhiteGuess = (guess: string) => {
    setMrWhiteGuess(guess);
    const norm = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const right = norm(guess) === norm(civilWord);
    setMrWhiteRight(right);
    if (right) playCombo("fanfare"); else playCombo("fail");
    if (right) {
      // Le Fantôme gagne seul
      if (eliminatedIdx !== null) {
        setPlayers((ps) => ps.map((p) => p.idx === eliminatedIdx ? { ...p, score: p.score + 5 } : p));
      }
      setEndReason("mrwhite-wins");
      setPhase("over");
    } else {
      setPhase("eliminate");
    }
  };

  // ── Vérifier victoire / passer manche suivante ──────────
  const afterEliminate = () => {
    const remain = players.filter((p) => !p.isEliminated);
    const remUC = remain.filter((p) => p.role === "undercover").length;
    const remMW = remain.filter((p) => p.role === "mrwhite").length;
    const remCv = remain.filter((p) => p.role === "civil" || p.role === "jester").length;

    // Civils gagnent
    if (remUC === 0 && remMW === 0) {
      setPlayers((ps) => ps.map((p) => (p.role === "civil" && !p.isEliminated) ? { ...p, score: p.score + 3 } : p));
      setEndReason("civils-win");
      playCombo("fanfare");
      setPhase("over");
      return;
    }
    // Imposteurs gagnent (aussi nombreux que les autres joueurs vivants).
    // Le Bouffon n'est PAS un imposteur : il ne gagne que s'il est éliminé par le vote.
    if (remUC + remMW >= remCv) {
      setPlayers((ps) => ps.map((p) =>
        ((p.role === "undercover" || p.role === "mrwhite") && !p.isEliminated) ? { ...p, score: p.score + 5 } : p
      ));
      setEndReason("undercover-wins");
      playCombo("fanfare");
      setPhase("over");
      return;
    }
    // Bonus survie
    setPlayers((ps) => ps.map((p) => (p.role === "civil" && !p.isEliminated) ? { ...p, score: p.score + 1 } : p));
    // Manche suivante
    setRound(round + 1);
    startRoundTable();
  };

  // ── Revoir mon mot ──────────────────────────────────────
  const startReview = () => {
    setReviewBack(phase);
    setPhase("review-pick");
  };
  const pickReview = (idx: number) => {
    setReviewIdx(idx);
    setPhase("review-pass");
  };

  // ═════════════════════════════════════════════════════════
  //  Rendering par phase
  // ═════════════════════════════════════════════════════════

  // 1. Setup joueurs
  if (phase === "setup-players") {
    return (
      <PlayersSetup emoji="🕶️" name="L'Intrus" min={3} max={12} accent="#FF3EA5" onStart={handleStartNames} onBack={onReturnToLobby}
        footer={<IdeaButton game="L'Intrus" kind="mot" />} />
    );
  }

  // 2. Setup rôles
  if (phase === "setup-roles") {
    return (
      <SetupRoles
        players={players}
        ucCount={ucCount}
        setUcCount={setUcCount}
        mrWhite={mrWhite}
        setMrWhite={setMrWhite}
        jester={jester}
        setJester={setJester}
        selectedCats={selectedCats}
        setSelectedCats={setSelectedCats}
        onStart={distributeRoles}
        onBack={() => setPhase("setup-players")}
      />
    );
  }

  // 3. Pass phone for reveal
  if (phase === "pass-reveal") {
    const p = players[revealIdx];
    return (
      <PassScreenUC
        toName={p.name}
        colorIdx={p.idx}
        label={`${revealIdx + 1} / ${players.length} · Distribution`}
        tag={rerollNotice ? "Nouveau mot ! On refait la distribution" : undefined}
        players={players}
        currentIdx={p.idx}
        buttonLabel={<><GameInlineIcon icon={Eye} /> Voir mon rôle</>}
        onReady={() => { setRerollNotice(false); playSfx("card-flip", { volume: 0.8 }); setPhase("reveal"); }}
      />
    );
  }

  // 4. Reveal word
  if (phase === "reveal") {
    const p = players[revealIdx];
    return (
      <RevealScreen
        player={p}
        round={round}
        position={revealIdx + 1}
        total={players.length}
        onAck={ackReveal}
        onReroll={rerollWord}
      />
    );
  }

  // 5. Table (ordre de parole)
  if (phase === "table") {
    return (
      <TableScreen
        players={players}
        order={order}
        round={round}
        onReviewWord={startReview}
        onForceVote={startVote}
      />
    );
  }

  // 6. Review pick (qui veut revoir ?)
  if (phase === "review-pick") {
    return (
      <ReviewPick
        players={players}
        onPick={pickReview}
        onCancel={() => setPhase(reviewBack)}
      />
    );
  }
  if (phase === "review-pass") {
    const p = players[reviewIdx!];
    return (
      <PassScreenUC
        toName={p.name}
        colorIdx={p.idx}
        label="Revoir le mot"
        tag="Privé"
        buttonLabel={<><GameInlineIcon icon={Eye} /> Voir mon rôle</>}
        onReady={() => setPhase("review-show")}
      />
    );
  }
  if (phase === "review-show") {
    const p = players[reviewIdx!];
    return (
      <RevealScreen
        player={p}
        round={round}
        position={null}
        total={players.length}
        review
        onAck={() => setPhase(reviewBack)}
      />
    );
  }

  // 7. Vote
  if (phase === "vote" || phase === "pass-vote") {
    return (
      <GroupVoteScreen
        players={players}
        round={round}
        onEliminate={eliminateTarget}
        onCancel={() => setPhase("table")}
      />
    );
  }

  // 8. Eliminate
  if (phase === "eliminate") {
    const elim = eliminatedIdx !== null ? players[eliminatedIdx] : null;
    return (
      <EliminateScreen
        eliminated={elim}
        round={round}
        civilWord={civilWord}
        onNext={afterEliminate}
      />
    );
  }

  // 9. Le Fantôme : passe + devine
  if (phase === "mrwhite-pass") {
    const p = eliminatedIdx !== null ? players[eliminatedIdx] : null;
    if (!p) return null;
    return (
      <PassScreenUC
        toName={p.name}
        colorIdx={p.idx}
        label="Fantôme · dernière chance"
        tag="Bonus"
        buttonLabel={<><GameInlineIcon icon={Target} /> Tenter ma chance</>}
        onReady={() => setPhase("mrwhite-guess")}
      />
    );
  }
  if (phase === "mrwhite-guess") {
    const p = eliminatedIdx !== null ? players[eliminatedIdx] : null;
    if (!p) return null;
    return (
      <MrWhiteGuess
        player={p}
        onSubmit={submitMrWhiteGuess}
      />
    );
  }

  // 10. Game over
  if (phase === "over") {
    return (
      <GameOverScreen
        players={players}
        endReason={endReason!}
        civilWord={civilWord}
        ucWord={ucWord}
        mrWhiteGuess={mrWhiteGuess}
        mrWhiteRight={mrWhiteRight}
        onReplay={() => {
          // Revanche : mêmes joueurs + même config de rôles, on redistribue
          // juste un nouveau mot (pas besoin de repasser par les réglages).
          setRound(1);
          setEndReason(null);
          setEliminatedIdx(null);
          setMrWhiteGuess(null);
          setMrWhiteRight(null);
          distributeRoles();
        }}
        onLobby={onReturnToLobby}
      />
    );
  }

  return null;
}

// ═════════════════════════════════════════════════════════════
//  ÉCRANS — chacun mappé sur une maquette
// ═════════════════════════════════════════════════════════════

// — SETUP ROLES (composition)
function SetupRoles({
  players, ucCount, setUcCount, mrWhite, setMrWhite, jester, setJester, selectedCats, setSelectedCats, onStart, onBack,
}: {
  players: LocalPlayer[];
  ucCount: number; setUcCount: (v: number) => void;
  mrWhite: boolean; setMrWhite: (v: boolean) => void;
  jester: boolean; setJester: (v: boolean) => void;
  selectedCats: Set<string>; setSelectedCats: (v: Set<string>) => void;
  onStart: () => void; onBack: () => void;
}) {
  const toggleCat = (id: string) => {
    const next = new Set(selectedCats);
    if (next.has(id)) next.delete(id); else next.add(id);
    if (next.size === 0) return; // garder au moins une catégorie
    setSelectedCats(next);
  };
  // « Tout » = toutes les catégories tout public ; le +18 se coche à part.
  const safeIds = WORD_CATEGORIES.filter((c) => !c.adult).map((c) => c.id);
  const allSafe = safeIds.every((id) => selectedCats.has(id));
  const toggleAll = () => {
    const next = new Set(allSafe ? [safeIds[0]] : safeIds);
    for (const c of WORD_CATEGORIES) if (c.adult && selectedCats.has(c.id)) next.add(c.id);
    setSelectedCats(next);
  };
  const total = players.length;
  // Les civils doivent rester majoritaires : (Intrus + Fantôme) < civils.
  const impostorCap = Math.floor((total - 1) / 2); // nb max d'imposteurs au total
  const canMrWhite = impostorCap >= 2;             // Fantôme à partir de 5 joueurs
  const mwSlots = mrWhite && canMrWhite ? 1 : 0;
  const maxUC = Math.max(1, Math.min(3, impostorCap - mwSlots));
  const ucEff = Math.min(Math.max(1, ucCount), maxUC);
  // Le Bouffon est neutre : il prend une place côté civils. Il faut qu'il
  // reste au moins 1 vrai civil après Intrus + Fantôme + Bouffon.
  const canJester = total - ucEff - mwSlots >= 3;
  const jSlots = jester && canJester ? 1 : 0;
  const civils = total - ucEff - mwSlots - jSlots;
  const valid = ucEff >= 1 && civils >= 1 && ucEff + mwSlots < civils + jSlots;
  const toggleMrWhite = (v: boolean) => {
    const nv = v && canMrWhite;
    if (nv) {
      const cap = Math.max(1, Math.min(3, impostorCap - 1));
      if (ucCount > cap) setUcCount(cap);
    }
    setMrWhite(nv);
  };
  const toggleJester = (v: boolean) => setJester(v && canJester);

  return (
    <LocalShell tone="noir">
      <NavBar sub={`Étape 2 · ${total} joueurs`} title="Composition" onBack={onBack} right={<Tag color="#FF3EA5">Rôles</Tag>} />

      <FileCard accent="#FF3EA5" style={{ marginBottom: 14 }}>
        <div style={{ ...DISPLAY, fontSize: 24, marginBottom: 10 }}>Qui est qui</div>

        {/* Visualisation : un blob par rôle */}
        <div style={{
          padding: "14px 10px", borderRadius: 18,
          background: "#fff", border: `2.5px solid ${ZZ.ink}`,
          display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap",
          marginBottom: 14,
        }}>
          {Array.from({ length: civils }).map((_, i) => (
            <Mascot key={`c${i}`} size={42} color="mint" mood="happy" bob={false} shadow={false} delay={i * 0.1} />
          ))}
          {Array.from({ length: ucEff }).map((_, i) => (
            <Mascot key={`u${i}`} size={42} color="pink" mood="shifty" bob={false} shadow={false} delay={0.3 + i * 0.1} />
          ))}
          {mwSlots > 0 && <Mascot size={42} color="white" mood="thinking" bob={false} shadow={false} delay={0.5} />}
          {jSlots > 0 && <Mascot size={42} color="lavender" mood="laughing" bob={false} shadow={false} delay={0.6} />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: jSlots > 0 ? "repeat(4,1fr)" : "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
          <Stat n={civils} label="Civils" color="#3DDC97" sub="même mot" />
          <Stat n={ucEff} label="Intrus" color="#FF3EA5" sub="mot voisin" />
          <Stat n={mwSlots} label="Fantôme" color="#FFD23F" sub="sans mot" />
          {jSlots > 0 && <Stat n={jSlots} label="Bouffon" color="#C58CFF" sub="à éliminer" />}
        </div>

        <Row label="Intrus" hint={`1 à ${maxUC}`}>
          <Stepper value={ucEff} min={1} max={maxUC} onChange={setUcCount} />
        </Row>
        <Row label="Fantôme" hint={canMrWhite ? "aucun mot · devine s'il sort" : "5 joueurs min"}>
          <Toggle value={mwSlots > 0} onChange={toggleMrWhite} />
        </Row>
        <Row label="Bouffon" hint={canJester ? "gagne seul s'il se fait éliminer par le vote" : "pas assez de civils"}>
          <Toggle value={jSlots > 0} onChange={toggleJester} />
        </Row>
      </FileCard>

      {/* Catégories de mots */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 10px" }}>
        <div style={{ ...DISPLAY, fontSize: 28 }}>Les mots</div>
        <ZButton size="sm" bg={allSafe ? ZZ.yellow : "#fff"} onClick={toggleAll} style={{ width: "auto" }}>{allSafe ? "Tout est coché" : "Tout cocher"}</ZButton>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {WORD_CATEGORIES.map((c, i) => {
          const on = selectedCats.has(c.id);
          return (
            <button key={c.id} type="button" onClick={() => { playSfx("toggle", { volume: 0.45 }); toggleCat(c.id); }} aria-pressed={on}
              className="transition-[translate,box-shadow] shadow-[0_3px_0_#15082E] active:translate-y-[2px] active:shadow-[0_1px_0_#15082E]"
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "0 14px", minHeight: 44, borderRadius: 999,
                fontSize: 15, fontWeight: 800, color: ZZ.ink,
                background: on ? (c.adult ? ZZ.pink : ZZ.yellow) : "rgba(255,255,255,0.55)",
                border: `2.5px solid ${ZZ.ink}`, rotate: on ? `${i % 2 ? 1.5 : -1.5}deg` : undefined,
              }}>
              {on && <Check size={15} strokeWidth={3.2} aria-hidden />}{c.label}
            </button>
          );
        })}
      </div>

      <RulesCard jester={jSlots > 0} />

      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <Btn tone="gold" disabled={!valid} onClick={onStart} icon={<Shuffle size={20} strokeWidth={2.6} aria-hidden />}>
          Distribuer les rôles
        </Btn>
        <p style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 10 }}>Rôles au hasard. Chacun verra son mot à son tour.</p>
      </div>
    </LocalShell>
  );
}

// — REVEAL (carte dossier)
function RevealScreen({
  player, round, position, total, review = false, onAck, onReroll,
}: {
  player: LocalPlayer;
  round: number;
  position: number | null;
  total: number;
  review?: boolean;
  onAck: () => void;
  /** Mot nul ? On retire une nouvelle paire (absent en relecture) */
  onReroll?: () => void;
}) {
  // L'Intrus NE SAIT PAS qu'il l'est : civils et Intrus voient juste leur mot
  // (aucune mention « Civil »). Le Fantôme et le Bouffon connaissent leur rôle
  // (ils ont un objectif spécial).
  const isMrWhite = player.role === "mrwhite";
  const isJester = player.role === "jester";
  const displayRole: Role = isMrWhite ? "mrwhite" : isJester ? "jester" : "civil";
  const color = isMrWhite || isJester ? ROLE_COLOR[displayRole] : "#FFD23F";
  const label = isMrWhite || isJester ? ROLE_LABEL[displayRole] : "Top secret";
  const hint = isMrWhite
    ? "Tu es le Fantôme : tu n'as pas de mot. Écoute, bluffe… Si tu es éliminé, devine le mot des civils pour gagner seul."
    : isJester
    ? "Tu es le Bouffon. Tu as le mot des civils, mais ton but est de te faire éliminer par le vote ! Sois louche… mais pas trop vite."
    : "Mémorise ton mot. Attention : tu ne sais pas si tu es civil… ou l'Intrus ! Donne un indice ni trop vague, ni trop évident.";

  const blobColor: MascotColor = isMrWhite ? "white" : isJester ? "lavender" : "mint";
  const blobMood: MascotMood = isMrWhite ? "thinking" : isJester ? "laughing" : "happy";

  return (
    <LocalShell tone={isMrWhite ? "gold" : "civ"}>
      <NavBar
        sub={review ? "Rappel · ne pas montrer" : `Joueur · ${player.name}`}
        title="Mot secret"
        right={<Tag color={color}>{label}</Tag>}
      />

      <div style={{ display: "flex", justifyContent: "center", marginBottom: -10 }}>
        <Mascot color={blobColor} size={64} mood={blobMood} arms shadow={false} />
      </div>

      <DossierCard word={player.word} role={displayRole} hint={hint} round={round} />

      {position !== null && (
        <div style={{
          padding: "10px 14px", borderRadius: 16, background: ZZ.pink, color: ZZ.ink,
          border: `2.5px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`,
          display: "flex", gap: 10, alignItems: "center", marginBottom: 14,
        }}>
          <Lock size={18} strokeWidth={2.8} aria-hidden />
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            Personne d&apos;autre ne doit voir l&apos;écran. ({position}/{total})
          </div>
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" onClick={onAck}>
          {review ? "Cacher · revenir" : "J’ai mémorisé · suivant →"}
        </Btn>
        {onReroll && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <RerollButton label="Mot nul ? Changer de mot" onClick={onReroll} />
          </div>
        )}
      </div>
    </LocalShell>
  );
}

// — TABLE (ordre de parole)
function TableScreen({
  players, order, round, onReviewWord, onForceVote,
}: {
  players: LocalPlayer[];
  order: number[];
  round: number;
  onReviewWord: () => void;
  onForceVote: () => void;
}) {
  const alive = players.filter((p) => !p.isEliminated);
  const dead = players.filter((p) => p.isEliminated);
  const orderedAlive = order.map((idx) => players[idx]).filter(Boolean) as LocalPlayer[];
  const rows: { p: LocalPlayer; n: number | null; dead: boolean }[] = [
    ...orderedAlive.map((p, i) => ({ p, n: i + 1, dead: false })),
    ...dead.map((p) => ({ p, n: null, dead: true })),
  ];

  return (
    <LocalShell tone="noir">
      <NavBar sub={`Manche ${round}`} title="Tour de table" right={<Tag color="#3DDC97">{alive.length} en vie</Tag>} />
      <Mono style={{ marginBottom: 14 }}>Dans l&apos;ordre, chacun dit UN mot-indice à voix haute. Puis on vote.</Mono>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {rows.map(({ p, n, dead: d }) => (
          <div key={p.idx} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "6px 12px", borderRadius: 18,
            background: d ? "transparent" : n === 1 ? ZZ.yellow : "#fff", color: d ? "rgba(255,255,255,0.75)" : ZZ.ink,
            border: d ? "2.5px dashed rgba(255,255,255,0.4)" : `3px solid ${ZZ.ink}`,
            boxShadow: d ? undefined : `0 4px 0 ${ZZ.ink}`,
            rotate: d ? undefined : `${(n ?? 0) % 2 ? -0.8 : 0.8}deg`,
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 999, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              ...DISPLAY, fontSize: 17, background: d ? "transparent" : ZZ.ink, color: d ? "#FF3EA5" : "#fff",
            }}>{d ? "✕" : n}</span>
            <Mascot size={40} color={colorByIdx(p.idx)} mood={d ? "dead" : "happy"} bob={false} shadow={false} />
            <span style={{ flex: 1, ...DISPLAY, fontSize: 20, textDecoration: d ? "line-through" : "none" }}>{p.name}</span>
            {n === 1 && <span style={{ fontSize: 13, fontWeight: 800 }}>commence</span>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, paddingTop: 18 }}>
        <Btn tone="ghost" icon={<Eye size={19} strokeWidth={2.6} aria-hidden />} onClick={onReviewWord}>Revoir mon mot</Btn>
        <Btn tone="danger" icon={<Scale size={19} strokeWidth={2.6} aria-hidden />} onClick={onForceVote}>Passer au vote</Btn>
      </div>
    </LocalShell>
  );
}

function PlayerRow({
  player, n, isCurrent, hasSpoken, isDead, right,
}: {
  player: LocalPlayer;
  n: number | null;
  isCurrent: boolean;
  hasSpoken: boolean;
  isDead: boolean;
  right?: ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px 10px 8px", borderRadius: 12,
      background: isCurrent ? "linear-gradient(90deg, rgba(255,210,63,0.20) 0%, rgba(255,210,63,0.04) 100%)" : "transparent",
      border: isCurrent ? "1.5px solid #FFD23F" : "1px solid transparent",
      opacity: isDead ? 0.4 : 1,
      boxShadow: isCurrent ? "0 8px 20px rgba(255,210,63,0.20)" : "none",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0,
        background: isCurrent ? "#FFD23F" : isDead ? "transparent" : "rgba(255,255,255,0.06)",
        border: isDead ? "1px dashed rgba(255,255,255,0.25)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display, system-ui)", fontWeight: 900, fontSize: 13,
        color: isCurrent ? "#1A0E2E" : isDead ? "rgba(255,255,255,0.4)" : "white",
      }}>{isDead ? "✕" : n}</div>

      <div style={{ position: "relative", flexShrink: 0 }}>
        {isCurrent && [0, 1].map((i) => (
          <div key={i} style={{
            position: "absolute", inset: -6, borderRadius: "50%",
            border: "2px solid #FFD23F",
            animation: "uc-pulse 1.6s ease-out infinite",
            animationDelay: `${i * 0.6}s`, opacity: 0.5,
          }} />
        ))}
        <Mascot size={40} color={colorByIdx(player.idx)}
          mood={isDead ? "dead" : isCurrent ? "happy" : hasSpoken ? "wink" : "neutral"}
          bob={false} delay={player.idx * 0.1} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16, fontWeight: 800,
          color: isDead ? "rgba(255,255,255,0.4)" : "white",
          textDecoration: isDead ? "line-through" : "none",
          lineHeight: 1, letterSpacing: -0.3,
        }}>{player.name}</div>
        <div style={{
          fontSize: 11, marginTop: 4,
          color: isCurrent ? "#FFD23F" : isDead ? "#FF3EA5" : hasSpoken ? "#3DDC97" : "rgba(255,255,255,0.5)",
          fontWeight: isCurrent ? 700 : 500,
        }}>
          {isCurrent && <><GameInlineIcon icon={Mic} /> à toi · donne un indice à voix haute</>}
          {hasSpoken && "✓ a parlé"}
          {isDead && `éliminé · manche ${player.eliminatedRound ?? "?"}`}
          {!isCurrent && !hasSpoken && !isDead && "en attente"}
        </div>
      </div>

      {right}
      {hasSpoken && <span style={{ color: "#3DDC97", fontSize: 14, fontWeight: 800 }}>✓</span>}
    </div>
  );
}

// — REVIEW PICK (qui veut revoir son mot ?)
function ReviewPick({
  players, onPick, onCancel,
}: {
  players: LocalPlayer[];
  onPick: (idx: number) => void;
  onCancel: () => void;
}) {
  const alive = players.filter((p) => !p.isEliminated);
  return (
    <LocalShell tone="noir">
      <NavBar sub="Mémoire courte ?" title="Qui veut revoir ?" onBack={onCancel} right={<Tag color="#FF3EA5">Confidentiel</Tag>} />

      <div style={{
        padding: "10px 14px", borderRadius: 16, background: ZZ.pink, color: ZZ.ink,
        border: `2.5px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`,
        fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginBottom: 16,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <TriangleAlert size={20} strokeWidth={2.8} style={{ flexShrink: 0 }} aria-hidden />
        <div>Choisis ton blob, puis <strong>personne d&apos;autre ne doit voir l&apos;écran.</strong></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {alive.map((p) => (
          <button key={p.idx} onClick={() => onPick(p.idx)} className="transition-[translate,box-shadow] shadow-[0_4px_0_#15082E] active:translate-y-[3px] active:shadow-[0_1px_0_#15082E]" style={{
            padding: "14px 10px 12px", borderRadius: 22,
            background: "#fff", border: `3px solid ${ZZ.ink}`,
            cursor: "pointer", color: ZZ.ink, textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            fontFamily: "inherit",
          }}>
            <Mascot color={colorByIdx(p.idx)} size={56} mood="neutral" bob={false} />
            <div style={{ ...DISPLAY, fontSize: 20, lineHeight: 1 }}>{p.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6B5C88" }}>touche pour revoir</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="ghost" onClick={onCancel} icon={<ArrowLeft size={19} strokeWidth={2.6} aria-hidden />}>Revenir au tour de table</Btn>
      </div>
    </LocalShell>
  );
}

// — VOTE
function GroupVoteScreen({
  players, round, onEliminate, onCancel,
}: {
  players: LocalPlayer[];
  round: number;
  onEliminate: (id: number) => void;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const alive = players.filter((p) => !p.isEliminated);

  return (
    <LocalShell tone="danger">
      <NavBar
        sub={`Manche ${round} · vote du groupe`}
        title="Qui éliminer ?"
        onBack={onCancel}
        right={<Tag color="#FF3EA5">{alive.length} en vie</Tag>}
      />

      <Mono style={{ marginBottom: 14 }}>Mettez-vous d&apos;accord, touchez le suspect, puis confirmez.</Mono>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {alive.map((p) => {
          const isPicked = picked === p.idx;
          return (
            <button key={p.idx} onClick={() => setPicked(p.idx)}
              style={{
                position: "relative", padding: "14px 10px 12px", borderRadius: 22,
                background: isPicked ? ZZ.pink : "#fff", border: `3px solid ${ZZ.ink}`,
                boxShadow: `0 ${isPicked ? 6 : 4}px 0 ${ZZ.ink}`,
                transform: isPicked ? "scale(1.04) rotate(-2deg)" : "scale(1)", transition: "transform 150ms",
                color: ZZ.ink, textAlign: "center", fontFamily: "inherit", cursor: "pointer",
              }}>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                <Mascot color={colorByIdx(p.idx)} size={64} mood={isPicked ? "shocked" : "shifty"} arms bob={false} />
              </div>
              <div style={{ ...DISPLAY, fontSize: 21, marginTop: 8, lineHeight: 1.05, overflowWrap: "anywhere" }}>{p.name}</div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: isPicked ? ZZ.ink : "#6B5C88" }}>
                {isPicked ? "Suspect choisi" : "touche pour choisir"}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="danger" disabled={picked === null} onClick={() => picked !== null && onEliminate(picked)}
          sub={picked !== null ? players[picked]?.name : undefined}>
          Éliminer ce joueur
        </Btn>
      </div>
    </LocalShell>
  );
}

// — ELIMINATE
function EliminateScreen({
  eliminated, round, civilWord, onNext,
}: {
  eliminated: LocalPlayer | null;
  round: number;
  civilWord: string;
  onNext: () => void;
}) {
    // On révèle le RÔLE à l'élimination, mais jamais le mot.
    void civilWord;
    const role = eliminated?.role ?? null;
    const color = role ? ROLE_COLOR[role] : "#FFD23F";
    const isImpostor = role === "undercover" || role === "mrwhite";

  return (
    <LocalShell tone="danger">
      <NavBar
        sub={`Verdict · manche ${round}`}
        title={eliminated ? (isImpostor ? "Démasqué !" : "Innocent…") : "Personne ne sort"}
        right={<Tag color={color}>{role ? ROLE_LABEL[role] : "Vote"}</Tag>}
      />

      {eliminated ? (
        <>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 20px" }}>
            <div style={{ position: "relative", animation: "uc-die 1.1s cubic-bezier(0.34,1.45,0.64,1) both" }}>
              <SpyMascotById idx={eliminated.idx} size={160} tilt={-14} mood="dead" />
              <div style={{ position: "absolute", top: -8, right: -50, zIndex: 5, animation: "uc-die 0.5s ease-out 0.9s both" }}>
                <Stamp text="Éliminé" color={color} rotate={-12} size={20} />
              </div>
            </div>
            <div style={{ ...DISPLAY, fontSize: "clamp(30px, 11vw, 46px)", marginTop: 14, textAlign: "center", overflowWrap: "anywhere" }}>{eliminated.name}</div>
          </div>

          <div style={{
            padding: "14px 18px", borderRadius: 24, background: color, color: ZZ.ink,
            border: `3px solid ${ZZ.ink}`, boxShadow: `0 5px 0 ${ZZ.ink}`, rotate: "-1.5deg",
            textAlign: "center", marginBottom: 16,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>C&apos;était…</div>
            <div style={{ ...DISPLAY, fontSize: 34, marginTop: 2 }}>{role ? ROLE_ARTICLE[role] : "—"}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Son mot reste secret.</div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.6)" }}>
          Pas de majorité — personne ne sort cette manche.
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <Btn tone="primary" onClick={onNext}>Continuer →</Btn>
      </div>
    </LocalShell>
  );
}

// — MR WHITE GUESS
function MrWhiteGuess({ player, onSubmit }: { player: LocalPlayer; onSubmit: (g: string) => void }) {
  const [text, setText] = useState("");
  return (
    <LocalShell tone="gold">
      <NavBar sub="Coup du destin" title="Le Fantôme devine" right={<Tag color="#FFD23F">Dernière chance</Tag>} />

      <div style={{
        padding: 18, borderRadius: 24, background: ZZ.yellow, color: ZZ.ink,
        border: `3px solid ${ZZ.ink}`, boxShadow: `0 5px 0 ${ZZ.ink}`, rotate: "-1deg",
        marginBottom: 18,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Mascot color={colorByIdx(player.idx)} size={68} mood="thinking" arms />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Fantôme éliminé</div>
            <div style={{ ...DISPLAY, fontSize: 28, marginTop: 2 }}>{player.name}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>
          <GameInlineIcon icon={Target} /> Une dernière chance. Tape le mot des civils pour gagner seul.
        </div>
      </div>

      <div style={{
        display: "flex", gap: 8, padding: 6, borderRadius: 20,
        background: "#fff", border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`,
        marginBottom: 12,
      }}>
        <input autoFocus value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && onSubmit(text.trim())}
          placeholder="Ton pari…"
          autoCorrect="off" autoCapitalize="off" spellCheck={false}
          style={{
            flex: 1, background: "transparent", border: "none", color: ZZ.ink,
            fontSize: 22, padding: 10, outline: "none", ...DISPLAY, letterSpacing: "-0.01em", minWidth: 0,
          }} />
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" disabled={!text.trim()} onClick={() => text.trim() && onSubmit(text.trim())} icon={<Dices size={20} strokeWidth={2.6} aria-hidden />}>
          Parier
        </Btn>
      </div>
    </LocalShell>
  );
}

// — GAME OVER
function GameOverScreen({
  players, endReason, civilWord, ucWord, mrWhiteGuess, mrWhiteRight, onReplay, onLobby,
}: {
  players: LocalPlayer[];
  endReason: EndReason;
  civilWord: string;
  ucWord: string;
  mrWhiteGuess: string | null;
  mrWhiteRight: boolean | null;
  onReplay: () => void;
  onLobby?: () => void;
}) {
  const [titleTop, titleBottom] =
    endReason === "civils-win" ? ["Civils", "victorieux"] :
    endReason === "undercover-wins" ? ["Imposteurs", "victorieux"] :
    endReason === "jester-wins" ? ["Le Bouffon", "gagne"] :
    ["Le Fantôme", "triomphe"];
  const accent =
    endReason === "civils-win" ? "#3DDC97" :
    endReason === "undercover-wins" ? "#FF3EA5" :
    endReason === "jester-wins" ? "#C58CFF" : "#FFD23F";

  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const winners = sorted.filter((p) => {
    if (endReason === "civils-win") return p.role === "civil";
    if (endReason === "undercover-wins") return p.role === "undercover" || p.role === "mrwhite";
    if (endReason === "jester-wins") return p.role === "jester";
    return p.role === "mrwhite";
  });

  return (
    <LocalShell tone="civ">
      <Confetti accent={accent} count={50} />

      <NavBar sub="Fin de partie" title="" right={<Tag color={accent}>Victoire</Tag>} />

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h1 style={{ ...DISPLAY, fontSize: "clamp(36px, 12vw, 50px)", margin: 0, lineHeight: 0.95 }}>
          <span style={{ color: accent }}>{titleTop}</span>
          <br/>{titleBottom}
        </h1>
      </div>

      <div style={{ position: "relative", height: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 14 }}>
        {winners[1] && <div style={{ position: "absolute", left: "12%", bottom: 0 }}><SpyMascotById idx={winners[1].idx} size={72} tilt={-8} mood="happy" arms delay={0.2} /></div>}
        {winners[2] && <div style={{ position: "absolute", right: "12%", bottom: 0 }}><SpyMascotById idx={winners[2].idx} size={68} tilt={6} mood="wink" arms delay={0.3} /></div>}
        {winners[0] && <div style={{ position: "relative", zIndex: 2 }}><SpyMascotById idx={winners[0].idx} size={130} tilt={-2} mood="happy" cheering arms crown /></div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ padding: "10px 12px", borderRadius: 20, background: ZZ.mint, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`, rotate: "-1.5deg" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Mot des civils</div>
          <div style={{ ...DISPLAY, fontSize: 22, lineHeight: 1.05, ...WORD_WRAP }}>{civilWord}</div>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: 20, background: ZZ.pink, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`, rotate: "1.5deg", textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Mot de l&apos;Intrus</div>
          <div style={{ ...DISPLAY, fontSize: 22, lineHeight: 1.05, ...WORD_WRAP }}>{ucWord}</div>
        </div>
      </div>

      {mrWhiteGuess !== null && (
        <div style={{
          padding: "10px 14px", borderRadius: 16,
          background: "#fff", color: ZZ.ink, border: `2.5px solid ${ZZ.ink}`,
          fontSize: 15, fontWeight: 600, marginBottom: 14, lineHeight: 1.4,
        }}>
          Le Fantôme a tenté : <strong>{mrWhiteGuess}</strong> {mrWhiteRight ? "✓ pari réussi" : "✕ raté"}
        </div>
      )}

      <div style={{ ...DISPLAY, fontSize: 28, marginBottom: 10 }}>Le classement</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {sorted.map((p, i) => {
          const win = winners.includes(p);
          const rc = ROLE_COLOR[p.role];
          return (
            <div key={p.idx} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 12px 6px 8px", borderRadius: 18,
              background: i === 0 ? ZZ.yellow : "#fff", color: ZZ.ink,
              border: `3px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`,
            }}>
              <span style={{ width: 22, ...DISPLAY, fontSize: 17 }}>{i + 1}</span>
              <Mascot color={colorByIdx(p.idx)} size={28} mood={win ? "wink" : "dead"} bob={false} shadow={false} />
              <span style={{ flex: 1, minWidth: 0, ...DISPLAY, fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span style={{
                fontSize: 13, padding: "3px 9px", borderRadius: 99,
                background: rc, color: ZZ.ink, border: `2px solid ${ZZ.ink}`, fontWeight: 800,
              }}>{ROLE_LABEL[p.role]}</span>
              <span style={{ ...DISPLAY, fontSize: 20, width: 40, textAlign: "right" }}>{p.score}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" onClick={onReplay} icon={<RotateCcw size={20} strokeWidth={2.8} aria-hidden />}>Revanche, nouveau mot</Btn>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}><IdeaButton game="L'Intrus" kind="mot" bg="#fff" /></div>
        {onLobby && <button type="button" onClick={onLobby} className="mx-auto mt-2 flex min-h-11 items-center px-4 text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ color: "rgba(255,255,255,0.9)" }}>Retour à l&apos;accueil</button>}
      </div>
    </LocalShell>
  );
}

// ═════════════════════════════════════════════════════════════
//  PRIMITIVES (locales — dupliquées de undercover-online.tsx
//  pour éviter une dépendance croisée. Si tu refactores, sors
//  vers un fichier undercover-ui.tsx commun.)
// ═════════════════════════════════════════════════════════════
type Tone = "noir" | "danger" | "civ" | "gold";

function LocalShell({ tone = "noir", children }: { tone?: Tone; children: ReactNode }) {
  // Fonds pleins (DA sticker) : violet nuit, ou la couleur du moment
  const bg: Record<Tone, string> = { noir: ZZ.night, danger: "#3A0E5C", civ: ZZ.night, gold: "#2B1A6E" };
  const offline = isOfflineApp();
  return (
    <div className="relative w-full shrink-0" style={{
      minHeight: "100dvh", color: "white",
      fontFamily: "var(--font-body, 'DM Sans'), system-ui, sans-serif",
      background: zBackground(bg[tone]), position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes uc-pulse { 0% { transform: scale(0.95); opacity: 0.7; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes uc-confetti { 0% { transform: translateY(-30px) rotate(0); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 1; } }
        @keyframes uc-die {
          0%   { transform: translateY(-26px) scale(1.12) rotate(0deg); opacity: 0; filter: none; }
          22%  { transform: translateY(0) scale(1) rotate(-9deg); opacity: 1; }
          40%  { transform: translateY(0) rotate(9deg); }
          55%  { transform: rotate(-7deg); }
          70%  { transform: rotate(5deg); }
          100% { transform: translateY(8px) rotate(-14deg); filter: grayscale(0.55) brightness(0.85); }
        }
      `}</style>
      {offline && <GameTopRight><SoundButton /></GameTopRight>}
      <div style={{ position: "relative", zIndex: 1, padding: `calc(env(safe-area-inset-top, 0px) + ${offline ? 72 : 18}px) 20px calc(env(safe-area-inset-bottom, 0px) + 24px)`, maxWidth: 460, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function Tag({ children, color = "#FFD23F", style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <ZChip bg={color} tilt={3} style={{ flexShrink: 0, ...style }}>{children}</ZChip>;
}

function NavBar({ sub, title, right, onBack }: { sub?: string; title?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    // Sur le site, le coin haut-droit reste à l'engrenage du shell
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingRight: isOfflineApp() ? 0 : 52 }}>
      {onBack && <GameIconButton icon={ArrowLeft} label="Retour" onClick={onBack} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {sub && <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>{sub}</div>}
        {title && <div style={{ ...DISPLAY, fontSize: 34, color: "white", marginTop: 2, lineHeight: 0.98 }}>{title}</div>}
      </div>
      {right}
    </div>
  );
}

type BtnTone = "primary" | "danger" | "gold" | "ghost" | "mint";
function Btn({ children, tone = "primary", disabled = false, onClick, full = true, icon, sub, style = {} }: {
  children: ReactNode; tone?: BtnTone; disabled?: boolean; onClick?: () => void;
  full?: boolean; icon?: ReactNode; sub?: string; style?: CSSProperties;
}) {
  const tones: Record<BtnTone, string> = { primary: ZZ.violet, danger: ZZ.pink, gold: ZZ.yellow, ghost: "#fff", mint: ZZ.mint };
  return (
    <ZButton bg={tones[tone]} onClick={onClick} disabled={disabled} size={full ? "lg" : "md"} style={{ width: full ? "100%" : "auto", ...style }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      <span style={{ display: "flex", flexDirection: "column", alignItems: sub ? "flex-start" : "center" }}>
        <span>{children}</span>
        {sub && <span style={{ fontFamily: "var(--font-body, 'DM Sans'), system-ui", fontSize: 13, fontWeight: 700, letterSpacing: 0, marginTop: 1 }}>{sub}</span>}
      </span>
    </ZButton>
  );
}

function SpyMascotById({ idx, size = 80, tilt = -3, mood = "sus", cheering = false, crown = false, arms = false, delay = 0 }: {
  idx: number; size?: number; tilt?: number; mood?: MascotMood; cheering?: boolean; crown?: boolean; arms?: boolean; delay?: number;
}) {
  const color = colorByIdx(idx);
  const w = size * 0.66, h = size * 0.18;
  // Les lunettes suivent l'animation du blob (sinon elles restent figées).
  const bobAnim = cheering ? "mascot-cheer 0.9s ease-in-out infinite" : `mascot-bob ${2.4 + delay * 0.2}s ease-in-out infinite`;
  return (
    <div style={{ position: "relative", display: "inline-block", width: size, height: size * 1.15 + (crown ? size * 0.3 : 0) }}>
      <Mascot size={size} color={color} mood={mood} cheering={cheering} crown={crown} arms={arms} delay={delay} />
      <div style={{ position: "absolute", left: `calc(50% - ${w / 2}px)`, top: (crown ? size * 0.3 : 0) + size * 0.32, width: w, height: h, transformOrigin: "50% 600%", animation: bobAnim, animationDelay: `${delay}s`, pointerEvents: "none", zIndex: 5 }}>
        <div style={{ width: "100%", height: "100%", transform: `rotate(${tilt}deg)` }}>
          <svg viewBox="0 0 100 28" width="100%" height="100%" preserveAspectRatio="none">
            <path d="M2 12 L18 12 M48 12 L52 12 M82 12 L98 12" stroke="#0E0828" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M18 4 Q18 18 30 22 Q44 24 47 14 Q48 6 36 4 Z" fill="#0E0828" stroke="#FFD23F" strokeWidth="1.2" />
            <path d="M53 14 Q56 24 70 22 Q82 18 82 4 L65 4 Q53 6 53 14 Z" fill="#0E0828" stroke="#FFD23F" strokeWidth="1.2" />
            <ellipse cx="26" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.6" />
            <ellipse cx="63" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.45" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Stamp({ text, color = "#FF3EA5", rotate = -10, size = 18 }: { text: string; color?: string; rotate?: number; size?: number }) {
  return (
    <div style={{
      display: "inline-block", padding: `${size * 0.3}px ${size * 0.7}px`,
      background: color, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`,
      ...DISPLAY, fontSize: size, transform: `rotate(${rotate}deg)`, borderRadius: 999, whiteSpace: "nowrap",
    }}>{text}</div>
  );
}

function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontSize: 15, color: "rgba(255,255,255,0.88)", fontWeight: 700, ...style }}>{children}</span>;
}

function FileCard({ children, accent = "#FFD23F", style }: { children: ReactNode; accent?: string; style?: CSSProperties }) {
  void accent;
  return (
    <div style={{ position: "relative", background: ZZ.violet, color: "#fff", border: `3px solid ${ZZ.ink}`, boxShadow: `0 5px 0 ${ZZ.ink}`, borderRadius: 24, padding: 16, ...style }}>
      {children}
    </div>
  );
}

function Stat({ n, label, color, sub }: { n: number; label: string; color: string; sub?: string }) {
  return (
    <div style={{ padding: "8px 4px", borderRadius: 16, background: color, color: ZZ.ink, border: `2.5px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`, textAlign: "center" }}>
      <div style={{ ...DISPLAY, fontSize: 28, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "2px dashed rgba(255,255,255,0.3)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...DISPLAY, fontSize: 19, color: "white" }}>{label}</div>
        {hint && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2, fontWeight: 600 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange, disabled }: { value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <GameIconButton icon={Minus} label="Un de moins" bg="#fff" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} />
      <span style={{ width: 24, textAlign: "center", ...DISPLAY, fontSize: 24 }}>{value}</span>
      <GameIconButton icon={Plus} label="Un de plus" bg={ZZ.yellow} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} />
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => { playSfx("toggle", { volume: 0.5 }); onChange(!value); }} aria-pressed={value} style={{
      minWidth: 64, height: 44, padding: 0, border: "none", background: "transparent", flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "flex-end",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    }}>
      <span style={{ width: 58, height: 34, borderRadius: 99, background: value ? ZZ.mint : "#fff", border: `2.5px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}`, position: "relative", transition: "background .15s", display: "block" }}>
        <span style={{ position: "absolute", top: 3, left: value ? 27 : 3, width: 23, height: 23, borderRadius: "50%", background: ZZ.ink, transition: "left .15s" }} />
      </span>
    </button>
  );
}

function DossierCard({ word, role, hint, round }: { word: string | null; role: Role; hint: string; round: number }) {
  // Le tampon ne dit jamais « Civil » : l'Intrus ne doit pas savoir qui il est.
  const special = role === "mrwhite" || role === "jester";
  const color = special ? ROLE_COLOR[role] : "#FF3EA5";
  const label = special ? ROLE_LABEL[role] : "Secret";
  return (
    <div style={{
      position: "relative", padding: "20px 20px 18px", borderRadius: 26,
      background: ZZ.cream, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 6px 0 ${ZZ.ink}`,
      transform: "rotate(-1.5deg)", margin: "16px 4px",
    }}>
      <div style={{ position: "absolute", top: -18, right: 14 }}>
        <Stamp text={label} color={color} rotate={6} size={15} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 800 }}>
        {role === "mrwhite" ? "Tu n'as pas de mot" : "Ton mot secret"} <span style={{ fontWeight: 600, color: "#6B5C88" }}>· manche {round}</span>
      </div>
      <div lang="fr" style={{
        ...DISPLAY, fontSize: word ? wordFontSize(word) : 44, lineHeight: 1.02, margin: "8px 0 6px",
        textAlign: role === "mrwhite" ? "center" : "left", opacity: role === "mrwhite" ? 0.4 : 1, ...WORD_WRAP,
      }}>{word ?? "?????"}</div>
      <div style={{ marginTop: 10, paddingTop: 12, borderTop: `2px dashed rgba(21,8,46,0.25)`, fontSize: 15, fontWeight: 600, color: "#3A2A56", lineHeight: 1.4 }}>{hint}</div>
    </div>
  );
}

function Confetti({ count = 40, accent = "#FFD23F" }: { count?: number; accent?: string }) {
  const pieces = useMemo(() => {
    const colors = ["#FF3EA5", "#FFD23F", "#3DDC97", "#4ECDC4", "#7A4EE8", "#FF6B5B", accent];
    return Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100, delay: Math.random() * 2.5,
      duration: 2.6 + Math.random() * 1.8,
      color: colors[i % colors.length],
      rot: Math.floor(Math.random() * 360),
      w: 6 + Math.floor(Math.random() * 6),
    }));
  }, [count, accent]);
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: "absolute", top: -20, left: `${p.left}%`,
          width: p.w, height: p.w * 1.4,
          background: p.color, borderRadius: 2,
          transform: `rotate(${p.rot}deg)`,
          animation: `uc-confetti ${p.duration}s ${p.delay}s linear infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Maquette 03 — "Qui joue ?" + grille LES SUSPECTS (remplace le PlayersSetup générique) ──
function PassScreenUC({ toName, colorIdx, label, players, currentIdx, buttonLabel, buttonSub, tag = "Rôles prêts", onReady }: {
  toName: string; colorIdx: number; label: string;
  players?: LocalPlayer[]; currentIdx?: number;
  buttonLabel: ReactNode; buttonSub?: string; tag?: string; onReady: () => void;
}) {
  return (
    <LocalShell tone="noir">
      <NavBar sub={label} right={<Tag color="#3DDC97">{tag}</Tag>} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 8 }}>
        <div style={{ position: "relative" }}>
          <Mascot size={110} color={MASCOT_COLORS[colorIdx % MASCOT_COLORS.length]} mood="wink" arms shadow={false} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: 4 }}>Passe le téléphone à</div>
        <div style={{ ...DISPLAY, fontSize: `clamp(32px, ${Math.min(14, 110 / Math.max(1, toName.length)).toFixed(1)}vw, 54px)`, lineHeight: 1.05, textAlign: "center", overflowWrap: "anywhere", maxWidth: "100%", padding: "8px 22px 10px", borderRadius: 24, background: MASCOT_PALETTE[MASCOT_COLORS[colorIdx % MASCOT_COLORS.length]].body, color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 6px 0 ${ZZ.ink}`, rotate: "-2deg" }}>{toName}</div>
      </div>

      {players && (
        <div style={{ marginTop: 22 }}>
          <Mono style={{ marginBottom: 8, display: "block", textAlign: "center" }}>Qui a vu son mot</Mono>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {players.map((p) => {
              const active = p.idx === currentIdx;
              return (
                <div key={p.idx} style={{ textAlign: "center", opacity: active ? 1 : 0.45, width: 52 }}>
                  <div style={{ borderRadius: "50%", border: active ? `3px solid ${ZZ.yellow}` : "3px solid transparent", padding: 1 }}>
                    <Mascot size={34} color={MASCOT_COLORS[p.idx % MASCOT_COLORS.length]} mood="happy" bob={false} shadow={false} />
                  </div>
                  <div style={{ fontSize: 13, marginTop: 3, color: active ? "#FFD23F" : "rgba(255,255,255,0.85)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 24 }}>
        <Btn tone="gold" sub={buttonSub} onClick={onReady}>{buttonLabel}</Btn>
      </div>
    </LocalShell>
  );
}

// Règles visibles avant la distribution (repliables).
function RulesCard({ jester }: { jester: boolean }) {
  const [open, setOpen] = useState(false);
  const items = [
    "Chacun reçoit un mot secret. Les civils ont tous le même ; l'Intrus a un mot voisin… et ne sait pas qu'il est l'Intrus !",
    "Le Fantôme (optionnel) n'a pas de mot, lui le sait : il écoute et bluffe. S'il est éliminé, il peut gagner seul en devinant le mot des civils.",
    "À tour de rôle, chacun donne un indice à voix haute sur son mot, puis la table désigne ensemble un suspect à éliminer.",
    "Les civils gagnent quand tous les imposteurs sont éliminés. Les imposteurs gagnent dès qu'ils sont aussi nombreux que les autres joueurs.",
    ...(jester ? ["Le Bouffon a le mot des civils mais joue pour lui : il gagne seul s'il se fait éliminer par le vote."] : []),
  ];
  return (
    <FileCard accent="#4ECDC4" style={{ marginBottom: 14 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", minHeight: 44, display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "transparent", border: "none", color: "white", padding: 0, cursor: "pointer", fontFamily: "inherit",
      }}>
        <span style={{ ...DISPLAY, fontSize: 21 }}><GameInlineIcon icon={BookOpen} /> Les règles</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{open ? "Masquer" : "Afficher"} <GameInlineIcon icon={open ? ChevronUp : ChevronDown} /></span>
      </button>
      {open && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8, fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: "#fff" }}>
          {items.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
    </FileCard>
  );
}
