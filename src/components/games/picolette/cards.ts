// Picolette — la banque de cartes orales (zéro tap sur l'écran à part désigner le perdant).
// Pensé pour la voiture/canapé : tout se joue à la voix. Pas d'imitation, pas d'observation route.

export type PicoletteType =
  | "vote"
  | "table"
  | "chant"
  | "cine"
  | "duel"
  | "rule"
  | "avoue"
  | "prefere"
  | "valise"
  | "coquin"
  | "joker";

export type Pack = "soft" | "coquin" | "trash" | "musique" | "quiz";

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

  { type: "duel", pack: "soft", text: "Duel : pierre-feuille-ciseaux. Le lecteur désigne 2 joueurs au pif.", hint: "Compte « pierre-feuille-ciseaux » à voix haute. Le perdant boit." },
  { type: "duel", pack: "soft", text: "Battle de blagues : 2 joueurs au pif. Chacun raconte sa meilleure. Le groupe vote.", hint: "Le moins drôle perd." },
  { type: "duel", pack: "soft", text: "Bras de fer verbal : qui peut tenir « aaaaaa » le plus longtemps en une expiration.", hint: "Le premier qui s'arrête perd." },

  { type: "avoue", pack: "soft", text: "T'as déjà ghosté quelqu'un ?", hint: "Tous ceux qui disent oui boivent." },
  { type: "avoue", pack: "soft", text: "T'as déjà fait semblant d'être malade pour louper un truc ?", hint: "Ceux qui disent oui boivent." },
  { type: "avoue", pack: "soft", text: "T'as déjà cassé un truc et fait semblant que c'était pas toi ?", hint: "Ceux qui disent oui boivent." },
  { type: "avoue", pack: "soft", text: "T'as déjà menti sur ton âge pour entrer quelque part ?", hint: "Ceux qui disent oui boivent." },
  { type: "avoue", pack: "soft", text: "T'as déjà fait pipi dans la piscine ?", hint: "Ceux qui disent oui boivent." },

  { type: "rule", pack: "soft", text: "Pendant 5 min : interdit de dire « genre »", hint: "1er qui dérape paye une peine.", ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « du coup »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « en fait »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 5 min : interdit de dire « ouais »", hint: "Dis « oui » comme un adulte. 1er qui craque paye.", ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « tu vois »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « j'avoue »", hint: "1er qui dérape paye.", ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « grave »", hint: "1er qui dérape paye.", ruleSec: 240 },
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
  { type: "valise", pack: "soft", text: "Dans le coffre de la voiture il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie un truc perd." },
  { type: "valise", pack: "soft", text: "Dans la cave de mes parents il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie perd." },
  { type: "valise", pack: "quiz", text: "Dans mon frigo il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie perd." },
  { type: "valise", pack: "coquin", text: "Dans mon tiroir de chevet il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie perd. Coquin autorisé." },
  { type: "valise", pack: "trash", text: "Dans mon historique de recherche il y a…",
    hint: "Chacun répète + ajoute. 1er qui oublie ou refuse de proposer perd." },

  // ── MUSIQUE / CINE ──────────────────────────────────
  { type: "chant", pack: "musique", text: "Fredonne une chanson au choix. Si personne devine en 30 sec, tu perds.", hint: "Pas de paroles, juste la mélodie." },
  { type: "chant", pack: "musique", text: "Chante les 5 premières secondes d'un tube des années 2000.", hint: "Si personne reconnaît, tu perds." },
  { type: "chant", pack: "musique", text: "Le lecteur désigne quelqu'un : continue la chanson « Au clair de la lune… »", hint: "Bloque = peine." },
  { type: "cine", pack: "musique", text: "Décris un film en 3 mots, les autres devinent.", hint: "Personne ne trouve = tu perds." },
  { type: "cine", pack: "musique", text: "Cite ta scène ciné préférée de tous les temps, le groupe note de 1 à 10.", hint: "Note ≤ 5 = tu perds." },
  { type: "cine", pack: "musique", text: "Réplique culte ! Le lecteur désigne quelqu'un : cite UNE réplique de film identifiable.", hint: "Personne ne trouve = tu perds." },

  // ── COQUIN 18+ ──────────────────────────────────────
  { type: "coquin", pack: "coquin", text: "Le pire endroit où t'as embrassé quelqu'un ?", hint: "Tour de table. Le plus bidon = peine." },
  { type: "coquin", pack: "coquin", text: "Cite trois trucs qui t'excitent en 5 secondes.", hint: "Le lecteur désigne. Échec = peine." },
  { type: "coquin", pack: "coquin", text: "Sexto à 3h du mat, qu'est-ce que t'écris ?", hint: "À voix haute, on vote sur le plus tiède." },
  { type: "vote", pack: "coquin", text: "Qui baise le mieux dans cette voiture ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "coquin", text: "Qui est le plus chaud à fond ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "coquin", text: "Qui a la plus grosse double-vie ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "coquin", text: "Qui ment le plus sur Tinder ?", hint: "3-2-1, crie un nom." },
  { type: "avoue", pack: "coquin", text: "T'as déjà embrassé quelqu'un du même sexe que toi ?", hint: "Ceux qui disent oui boivent." },
  { type: "avoue", pack: "coquin", text: "T'as déjà couché dès le 1er date ?", hint: "Ceux qui disent oui boivent." },
  { type: "avoue", pack: "coquin", text: "T'as déjà eu un plan dans un lieu pas du tout fait pour ça ?", hint: "Ceux qui disent oui boivent." },

  // ── TRASH 18+ ───────────────────────────────────────
  { type: "vote", pack: "trash", text: "Qui a déjà couché pour un job ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "trash", text: "Qui pourrait avoir une vraie double-vie ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "trash", text: "Qui finit le plus pété en soirée ?", hint: "3-2-1, crie un nom." },
  { type: "vote", pack: "trash", text: "Qui drague de la pire façon ?", hint: "3-2-1, crie un nom." },
  { type: "coquin", pack: "trash", text: "Avoue le truc le plus chelou que t'as déjà fait au lit.", hint: "Lecteur désigne. Bouche cousue = peine." },
  { type: "coquin", pack: "trash", text: "Le pire endroit où t'as fini une soirée ?", hint: "Tour de table. Personne ne croit ton histoire = peine." },
  { type: "avoue", pack: "trash", text: "T'as déjà menti sur quelque chose d'important à un partenaire ?", hint: "Ceux qui disent oui boivent." },
  { type: "avoue", pack: "trash", text: "T'as déjà fait quelque chose dont t'as vraiment honte sous l'effet d'un truc ?", hint: "Ceux qui disent oui boivent." },

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
  musique: { emoji: "🎵", label: "Musique", sub: "Chants & ciné",           tint: "#FFD23F" },
  quiz:    { emoji: "🧠", label: "Quiz",    sub: "Tour de table débile",    tint: "#3DDC97" },
};

export const TYPE_INFO: Record<PicoletteType, { emoji: string; label: string; tint: string }> = {
  vote:    { emoji: "🗳️",  label: "Vote groupe",        tint: "#FF6B5B" },
  table:   { emoji: "🎤",  label: "Tour de table",      tint: "#3DDC97" },
  chant:   { emoji: "🎵",  label: "Devine la chanson",  tint: "#FFD23F" },
  cine:    { emoji: "🎬",  label: "Devine le film",     tint: "#FFD23F" },
  duel:    { emoji: "🤝",  label: "Duel verbal",        tint: "#5BA3FF" },
  rule:    { emoji: "📝",  label: "Règle live",         tint: "#C58CFF" },
  avoue:   { emoji: "🤫",  label: "Avoue…",             tint: "#FF3EA5" },
  prefere: { emoji: "🪙",  label: "Tu préfères",        tint: "#FF8C42" },
  valise:  { emoji: "🧳",  label: "Dans ma valise…",    tint: "#3DDC97" },
  coquin:  { emoji: "💋",  label: "Coquin 18+",         tint: "#FF3EA5" },
  joker:   { emoji: "🃏",  label: "Joker",              tint: "#7A4EE8" },
};
