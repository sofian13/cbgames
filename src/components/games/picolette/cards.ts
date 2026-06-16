// Picolette — la banque de cartes orales (zéro tap sur l'écran à part désigner le perdant).
// Pensé pour la voiture/canapé : tout se joue à la voix. Pas d'imitation, pas d'observation route.

export type PicoletteType =
  | "vote"
  | "table"
  | "rule"
  | "prefere"
  | "valise"
  | "coquin"
  | "joker";

export type Pack = "soft" | "coquin" | "trash" | "quiz";

export interface PicoletteCard {
  type: PicoletteType;
  pack: Pack;
  text: string;        // ce que le lecteur lit à voix haute
  hint?: string;       // mini-règle d'exécution
  ruleSec?: number;    // pour les cartes "rule" : durée en secondes
  a?: string;          // option "main en haut" (cartes "prefere")
  b?: string;          // option "main en bas"  (cartes "prefere")
}

// 70 cartes — un mélange équilibré. Le contenu est l'âme du jeu, l'utilisateur en ajoutera.
export const PICOLETTE_CARDS: PicoletteCard[] = [
  // ── SOFT ─────────────────────────────────────────────
  { type: "vote", pack: "soft", text: "Qui pourrait sauver la Terre d'une invasion alien ?", hint: "3-2-1, tout le monde crie un nom en même temps." },
  { type: "vote", pack: "soft", text: "Qui finira riche et seul ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui ferait le pire parent ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui finirait dans une secte ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui pleurera le premier à un mariage ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui ferait le meilleur président ?", hint: "3-2-1, crie un nom. Le plus voté gagne — le moins voté perd." },
  { type: "vote", pack: "soft", text: "Qui ment le plus à ses potes ?", hint: "3-2-1, crie un nom." },

  { type: "table", pack: "soft", text: "Citez chacun votre tour un dessin animé. Premier qui sèche perd.", hint: "Lecteur : tape « X a séché »." },
  { type: "table", pack: "soft", text: "Citez chacun une marque de voiture. Pas de répétition.", hint: "Tour de table à l'oral, premier qui bloque perd." },
  { type: "table", pack: "soft", text: "Citez chacun un Pokémon. Pas de répétition.", hint: "Le premier qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun un président français.", hint: "Tour de table, premier qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun un fruit qui commence par une voyelle.", hint: "Premier qui sèche perd." },

  { type: "rule", pack: "soft", text: "Pendant 5 min : interdit de dire « genre »", hint: "1er qui dérape paye une peine.", ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « oui »", hint: "Réponds autrement. 1er qui craque paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « du coup »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « en fait »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « moi »", hint: "Parle sans te citer. 1er qui oublie paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 5 min : interdit de dire « ouais »", hint: "Dis « oui » comme un adulte. 1er qui craque paye.", ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « frère »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « tu vois »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « j'avoue »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « grave »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « wesh »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « trop »", hint: "1er qui dérape paye.", ruleSec: 240 },

  // ── TU PRÉFÈRES (vote main haut / main bas, minorité boit) ──
  { type: "prefere", pack: "soft", text: "Tu préfères :",
    a: "Ne plus jamais rire de ta vie",
    b: "Ne plus jamais pleurer de ta vie",
    hint: "3-2-1 : main en haut pour le choix du haut, main en bas pour le bas. Le côté avec le MOINS de mains boit." },
  { type: "prefere", pack: "soft", text: "Tu préfères :",
    a: "Vivre 1000 ans tout(e) seul(e)",
    b: "Vivre 30 ans entouré(e) de gens qui t'aiment",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "soft", text: "Tu préfères :",
    a: "Lire dans les pensées",
    b: "Être invisible quand tu veux",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "soft", text: "Tu préfères :",
    a: "Pas de musique pendant 1 an",
    b: "Pas de séries / films pendant 1 an",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "soft", text: "Tu préfères :",
    a: "Tes parents lisent TOUS tes messages",
    b: "Tes potes lisent TOUS tes messages",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "soft", text: "Tu préfères :",
    a: "Bouffer que de l'italien toute ta vie",
    b: "Bouffer que de l'asiatique toute ta vie",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "trash", text: "Tu préfères :",
    a: "Ta mère perd une jambe",
    b: "Ta copine / ton copain devient paralysé(e)",
    hint: "3-2-1, main haut / bas. Minorité = peine. Bienvenue chez les pourris." },
  { type: "prefere", pack: "trash", text: "Tu préfères :",
    a: "Personne ne t'aime mais tu fais ce que tu veux",
    b: "Tout le monde t'adore mais tu n'as plus aucun libre arbitre",
    hint: "Main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "trash", text: "Tu préfères :",
    a: "Trouver 1M€ en cash mais tu peux jamais l'avouer",
    b: "Gagner 50K€ légalement",
    hint: "Main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "coquin", text: "Tu préfères :",
    a: "Plus jamais coucher de ta vie",
    b: "Coucher pour toujours sans jamais aimer",
    hint: "Main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "coquin", text: "Tu préfères :",
    a: "Ton crush lit tout ton historique web",
    b: "Ta famille apprend tout sur ta vie sexuelle",
    hint: "Main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "coquin", text: "Tu préfères :",
    a: "Faire l'amour pour toujours sans en avoir envie",
    b: "En avoir envie sans jamais pouvoir en faire",
    hint: "Main haut / bas. Minorité = peine." },

  // ── DANS MA VALISE (mémoire cumulative tour de table) ──────
  { type: "valise", pack: "soft", text: "Dans ma valise il y a…",
    hint: "Chacun à son tour répète TOUTE la liste et ajoute un objet. Le premier qui oublie ou se trompe perd." },
  { type: "valise", pack: "soft", text: "Dans mon sac de soirée il y a…",
    hint: "Chacun répète toute la liste et ajoute un élément. 1er qui oublie perd." },
  { type: "valise", pack: "soft", text: "Dans ma voiture il y a…",
    hint: "Chacun répète toute la liste et ajoute un truc. 1er qui bloque perd." },
  { type: "valise", pack: "soft", text: "Dans le coffre de la voiture il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie un truc perd." },
  { type: "valise", pack: "soft", text: "Dans ma chambre d'ado il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie ou se trompe perd." },
  { type: "valise", pack: "soft", text: "Dans la cave de mes parents il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie perd." },
  { type: "valise", pack: "quiz", text: "Dans mon frigo il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie perd." },
  { type: "valise", pack: "coquin", text: "Dans mon tiroir de chevet il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie perd. Coquin autorisé." },
  { type: "valise", pack: "trash", text: "Dans mon historique Google il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie ou refuse de proposer perd." },
  { type: "valise", pack: "trash", text: "Dans mon historique de recherche il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie ou refuse de proposer perd." },

  // ── COQUIN 18+ ──────────────────────────────────────
  { type: "coquin", pack: "coquin", text: "Le pire endroit où t'as embrassé quelqu'un ?", hint: "Tour de table. Le plus bidon = peine." },
  { type: "coquin", pack: "coquin", text: "Cite trois trucs qui t'excitent en 5 secondes.", hint: "Le lecteur désigne. Échec = peine." },
  { type: "coquin", pack: "coquin", text: "Sexto à 3h du mat, qu'est-ce que t'écris ?", hint: "À voix haute, on vote sur le plus tiède." },
  { type: "vote", pack: "coquin", text: "Qui baise le mieux dans cette voiture ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "coquin", text: "Qui est le plus chaud à fond ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "coquin", text: "Qui a la plus grosse double-vie ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "coquin", text: "Qui ment le plus sur Tinder ?", hint: "3-2-1, crie un nom." },
  // ── TRASH 18+ ───────────────────────────────────────
  { type: "vote", pack: "trash", text: "Qui a déjà couché pour un job ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "trash", text: "Qui pourrait avoir une vraie double-vie ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "trash", text: "Qui finit le plus pété en soirée ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "trash", text: "Qui drague de la pire façon ?", hint: "3-2-1, crie un nom." },
  { type: "coquin", pack: "trash", text: "Avoue le truc le plus chelou que t'as déjà fait au lit.", hint: "Lecteur désigne. Bouche cousue = peine." },
  { type: "coquin", pack: "trash", text: "Le pire endroit où t'as fini une soirée ?", hint: "Tour de table. Personne ne croit ton histoire = peine." },
  // ── QUIZ DÉBILE ─────────────────────────────────────
  { type: "table", pack: "quiz", text: "Citez chacun un emoji que vous utilisez jamais. Pas de répétition.", hint: "Premier qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun une capitale européenne. Pas de répétition.", hint: "Premier qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun un acteur français vivant.", hint: "Premier qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun une marque de céréales.", hint: "Premier qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun un président américain.", hint: "Premier qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun un Disney Pixar.", hint: "Premier qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun une espèce de chien.", hint: "Premier qui sèche perd." },

  // ── JOKERS (rare, effet spécial) ────────────────────
  { type: "joker", pack: "soft", text: "🃏 SALVATEUR — Le lecteur garde cette carte. Il peut la jouer plus tard pour annuler une peine.", hint: "Garde-la en mémoire, c'est verbal." },
  { type: "joker", pack: "soft", text: "🃏 DOUBLON — La prochaine peine désignée compte double.", hint: "Le lecteur applique sur la prochaine peine." },
  { type: "joker", pack: "soft", text: "🃏 CHOISIS — Le lecteur désigne directement qui boit, sans débat.", hint: "Choisis vite, c'est ton heure." },
  { type: "joker", pack: "trash", text: "🃏 INVERSION — Le perdant désigné fait boire qui il veut à la place.", hint: "Le pouvoir change de main." },

  // ── VOTES supplémentaires ────────────────────────────────
  { type: "vote", pack: "soft", text: "Qui pourrait écrire un livre qui se vendra ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui ferait le meilleur acteur dans un film d'horreur ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui ferait le pire colocataire ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui est le plus susceptible de mentir pour éviter une soirée ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui survivrait le moins longtemps sur une île déserte ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui est le plus mauvais perdant ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui pourrait devenir célèbre pour une raison ridicule ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui finirait dans une émission de télé-réalité ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui a le plus de secrets ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui dépense le plus pour rien ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui ferait le meilleur espion ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui est le plus imprévisible ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui a la pire playlist Spotify ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "soft", text: "Qui a le plus de chance de gagner au loto un jour ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "trash", text: "Qui pourrait avoir un enfant non reconnu quelque part ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "trash", text: "Qui finirait premier en taule ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "coquin", text: "Qui a la double-vie la plus crédible ?", hint: "3-2-1, crie un nom." },

  // ── TOUR DE TABLE supplémentaires ────────────────────────
  { type: "table", pack: "soft", text: "Citez chacun un personnage de One Piece (ou anime).", hint: "1er qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun une boisson chaude.", hint: "1er qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun une couleur (pas de répétition).", hint: "1er qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun un sport olympique.", hint: "1er qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun une excuse pour arriver en retard.", hint: "1er qui sèche ou répète une excuse perd." },
  { type: "table", pack: "soft", text: "Citez chacun un objet qu'on trouve dans une cuisine.", hint: "Pas de répétition. 1er qui bloque perd." },
  { type: "table", pack: "soft", text: "Citez chacun une chose qu'on oublie toujours avant de partir.", hint: "1er qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun un truc qu'on fait quand on s'ennuie.", hint: "Pas de répétition. 1er qui bloque perd." },
  { type: "table", pack: "soft", text: "Citez chacun un prénom qui commence par A.", hint: "1er qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun une appli de téléphone.", hint: "Pas de répétition. 1er qui bloque perd." },
  { type: "table", pack: "soft", text: "Citez chacun une chose qu'on dit quand on ment mal.", hint: "1er qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun un truc qu'on peut acheter à la station-service.", hint: "Pas de répétition. 1er qui bloque perd." },
  { type: "table", pack: "soft", text: "Citez chacun un métier que personne ne voulait faire enfant.", hint: "1er qui sèche perd." },
  { type: "table", pack: "soft", text: "Citez chacun un truc qui coûte trop cher pour rien.", hint: "Pas de répétition. 1er qui bloque perd." },
  { type: "table", pack: "quiz", text: "Citez chacun une capitale africaine.", hint: "1er qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun un pays asiatique.", hint: "1er qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun un super-héros Marvel.", hint: "1er qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun un instrument de musique.", hint: "1er qui sèche perd." },
  { type: "table", pack: "quiz", text: "Citez chacun un sport collectif.", hint: "1er qui sèche perd." },

  // ── TU PRÉFÈRES supplémentaires ──────────────────────────
  { type: "prefere", pack: "soft", text: "Tu préfères :",
    a: "Toujours dire la vérité, même quand c'est cruel",
    b: "Mentir tout le temps pour rendre les gens heureux",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "soft", text: "Tu préfères :",
    a: "Connaître la date exacte de ta mort",
    b: "Savoir comment tu vas mourir",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "trash", text: "Tu préfères :",
    a: "Tes parents se font passer pour toi sur tes réseaux pendant 1 an",
    b: "Toi tu te fais passer pour tes parents sur les leurs pendant 1 an",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "coquin", text: "Tu préfères :",
    a: "Coucher avec ton/ta ex, personne le sait",
    b: "Coucher avec un(e) inconnu(e), ton crush l'apprend",
    hint: "Vote main haut / bas. Minorité = peine." },
  { type: "prefere", pack: "coquin", text: "Tu préfères :",
    a: "Quelqu'un raconte ton historique sexuel devant toi",
    b: "Quelqu'un balance toutes tes recherches Google de l'année",
    hint: "Vote main haut / bas. Minorité = peine." },

  // ── COQUIN supplémentaires ───────────────────────────────
  { type: "coquin", pack: "coquin", text: "Le pire surnom au lit que t'as déjà entendu ?", hint: "Tour de table à voix haute." },
  { type: "coquin", pack: "coquin", text: "La phrase la plus chaude de ta dernière conversation : lis-la (ou invente).", hint: "Lecteur désigne. Refus = peine double." },
  { type: "coquin", pack: "trash", text: "Le truc le plus chelou que t'as déjà fait au lit ?", hint: "Lecteur désigne. Bouche cousue = peine." },

  // ── RÈGLES live supplémentaires ──────────────────────────
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « voilà »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 5 min : interdit de prononcer le mot « non »", hint: "Esquive avec créativité.", ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Pendant 3 min : tout le monde parle à la 3ᵉ personne", hint: "« Léa pense que… » Sinon peine.", ruleSec: 180 },
  { type: "rule", pack: "soft", text: "Pendant 2 min : pas le droit de rigoler", hint: "1er qui rigole ou sourit prend la pénalité.", ruleSec: 120 },
  { type: "rule", pack: "trash", text: "Pendant 4 min : interdit de rire ou de sourire", hint: "1er qui craque ramasse 2 fois.", ruleSec: 240 },

  // ── JOKER supplémentaires ────────────────────────────────
  { type: "joker", pack: "soft", text: "🃏 STOP ! — Le lecteur peut transférer son tour de lecture à n'importe qui.", hint: "Garde-la mentalement, joue-la plus tard." },
  { type: "joker", pack: "soft", text: "🃏 BOUCLIER — Tu peux refuser une peine au cours de cette partie. (Une seule fois.)", hint: "Le lecteur retient ton bouclier." },
];

export function filterDeck(packs: Set<Pack>): PicoletteCard[] {
  return PICOLETTE_CARDS.filter((c) => packs.has(c.pack));
}

export function shuffleDeck<T>(deck: T[]): T[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const PACK_INFO: Record<Pack, { emoji: string; label: string; sub: string; tint: string }> = {
  soft:    { emoji: "😄", label: "Soft",    sub: "Entre potes, propre",     tint: "#5BA3FF" },
  coquin:  { emoji: "🔥", label: "Coquin",  sub: "18+, dates et sexe",      tint: "#FF3EA5" },
  trash:   { emoji: "💀", label: "Trash",   sub: "Gros gages, gros aveux",  tint: "#7A4EE8" },
  quiz:    { emoji: "🧠", label: "Quiz",    sub: "Tour de table débile",    tint: "#3DDC97" },
};

export const TYPE_INFO: Record<PicoletteType, { emoji: string; label: string; tint: string }> = {
  vote:    { emoji: "🗳️",  label: "Vote groupe",        tint: "#FF6B5B" },
  table:   { emoji: "🎤",  label: "Tour de table",      tint: "#3DDC97" },
  rule:    { emoji: "📝",  label: "Règle live",         tint: "#C58CFF" },
  prefere: { emoji: "🪙",  label: "Tu préfères",        tint: "#FF8C42" },
  valise:  { emoji: "🧳",  label: "Dans ma valise…",    tint: "#3DDC97" },
  coquin:  { emoji: "💋",  label: "Coquin 18+",         tint: "#FF3EA5" },
  joker:   { emoji: "🃏",  label: "Joker",              tint: "#7A4EE8" },
};
