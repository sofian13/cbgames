// La Tournée — la banque de cartes orales (le tel sert juste à lire et désigner le perdant).
// Pensé pour la soirée sur le canapé : tout se joue à la voix.
// Peine = 1 à 3 gorgées (de ce que tu veux : eau, soft…) OU un gage soft tiré au sort.

export type PicoletteType =
  | "vote"
  | "table"
  | "rule"
  | "prefere"
  | "valise"
  | "coquin"
  | "joker";

export type Pack = "soft" | "coquin" | "trash" | "quiz";

/** Effet des cartes joker (agissent réellement sur le compteur, ou immédiat sans état). */
export type JokerEffect =
  | "pick"     // le lecteur désigne directement qui prend une peine
  | "amnesty"  // annule la dernière peine
  | "shield"   // donne un bouclier : la prochaine peine de ce joueur est annulée
  | "none";    // effet purement oral, immédiat

export interface PicoletteCard {
  type: PicoletteType;
  pack: Pack;
  text: string;        // ce que le lecteur lit à voix haute
  hint?: string;       // mini-règle d'exécution
  ruleSec?: number;    // pour les cartes "rule" : durée en secondes
  a?: string;          // option "main en haut" (cartes "prefere")
  b?: string;          // option "main en bas"  (cartes "prefere")
  joker?: JokerEffect; // pour les cartes "joker"
}

const V = "3-2-1, tout le monde pointe quelqu'un. Le plus désigné prend la peine.";
const T = "Tour de table, pas de répétition. Le premier qui sèche perd.";
const P = "3-2-1 : main en haut pour le choix du haut, main en bas pour le bas. Le camp minoritaire prend la peine.";
const R = "Le premier qui dérape prend la peine.";
const VAL = "Chacun répète TOUTE la liste et ajoute un truc. Le premier qui oublie ou se trompe perd.";

export const PICOLETTE_CARDS: PicoletteCard[] = [
  // ── VOTES — SOFT ─────────────────────────────────────
  { type: "vote", pack: "soft", text: "Qui pourrait sauver la Terre d'une invasion alien ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui finira riche et seul(e) avec 12 chats ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui ferait le parent le plus cool… et le plus perdu ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui finirait dans une secte en moins d'une semaine ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui pleurera le premier à un mariage ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui ferait le meilleur président ?", hint: "3-2-1, tout le monde pointe quelqu'un. Le MOINS désigné prend la peine." },
  { type: "vote", pack: "soft", text: "Qui ment le plus à ses potes ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui pourrait écrire un livre qui se vendra ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui serait le premier à mourir dans un film d'horreur ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui ferait le pire colocataire ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui invente une excuse pour éviter une soirée ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui survivrait le moins longtemps sur une île déserte ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui est le plus mauvais perdant ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui pourrait devenir célèbre pour une raison ridicule ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui finirait dans une émission de télé-réalité ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui a le plus de secrets ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui dépense le plus pour rien ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui ferait le meilleur espion ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui est le plus imprévisible ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui a la pire playlist ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui gagnera au loto et perdra le ticket ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui répond « j'arrive » alors qu'il est encore sous la douche ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui a déjà parlé tout seul dans la rue cette semaine ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui ouvre le frigo 10 fois en espérant qu'un truc apparaisse ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui laisse ses messages en « vu » pendant trois jours ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui serait le dernier debout dans une apocalypse zombie ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui a l'historique de mèmes le plus douteux ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui se perdrait avec un GPS dans sa propre ville ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui fait toujours semblant d'avoir lu le message du groupe ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui commande toujours le même plat au resto ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui finit toujours par s'endormir sur le canapé en soirée ?", hint: V },

  // ── TOUR DE TABLE — SOFT ─────────────────────────────
  { type: "table", pack: "soft", text: "Citez chacun votre tour un dessin animé.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un animal qui vit dans la mer.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un président de la République française.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un fruit ou un légume qui commence par une voyelle.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un personnage d'anime.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun une boisson sans alcool.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun une couleur.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un sport olympique.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun une excuse pour arriver en retard.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un objet qu'on trouve dans une cuisine.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun une chose qu'on oublie toujours avant de partir.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un truc qu'on fait quand on s'ennuie.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un prénom qui commence par A.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un type d'appli qu'on a tous sur son téléphone.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun une phrase qu'on dit quand on ment mal.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un métier que personne ne rêvait de faire enfant.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un truc qui coûte trop cher pour rien.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun une phrase que disent tous les parents.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un truc qu'on ne dit jamais à un premier rendez-vous.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun une raison bidon de quitter un groupe de discussion.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un animal qu'on n'aimerait pas trouver dans son lit.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un plat qu'on mange à 3 h du matin.", hint: T },
  { type: "table", pack: "soft", text: "Citez chacun un mot qui rime avec « soirée ».", hint: T },

  // ── RÈGLES LIVE ──────────────────────────────────────
  { type: "rule", pack: "soft", text: "Pendant 5 min : interdit de dire « genre »", hint: R, ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « oui »", hint: "Réponds autrement. " + R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « du coup »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « en fait »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « moi »", hint: "Parle sans te citer. " + R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 5 min : interdit de dire « ouais »", hint: "Dis « oui » comme un adulte. " + R, ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « frère »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « tu vois »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « j'avoue »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « grave »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « wesh »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « trop »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de dire « voilà »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 5 min : interdit de prononcer le mot « non »", hint: "Esquive avec créativité. " + R, ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Pendant 3 min : tout le monde parle à la 3ᵉ personne", hint: "« Léa pense que… » " + R, ruleSec: 180 },
  { type: "rule", pack: "soft", text: "Pendant 2 min : pas le droit de rigoler", hint: "Le premier qui rit ou sourit prend la peine.", ruleSec: 120 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de montrer du doigt", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 3 min : chaque phrase doit finir par « mon capitaine »", hint: R, ruleSec: 180 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit d'appeler quelqu'un par son prénom", hint: "Surnoms uniquement. " + R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Pendant 3 min : il faut lever la main avant de parler", hint: R, ruleSec: 180 },
  { type: "rule", pack: "soft", text: "Pendant 4 min : interdit de toucher son téléphone (sauf le lecteur)", hint: R, ruleSec: 240 },
  { type: "rule", pack: "trash", text: "Pendant 4 min : interdit de rire ou de sourire", hint: "Le premier qui craque prend la peine.", ruleSec: 240 },
  { type: "rule", pack: "trash", text: "Pendant 3 min : chaque phrase doit contenir un mot anglais", hint: R, ruleSec: 180 },

  // ── TU PRÉFÈRES ──────────────────────────────────────
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Ne plus jamais rire de ta vie", b: "Ne plus jamais pleurer de ta vie", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Vivre 1000 ans tout(e) seul(e)", b: "Vivre 30 ans entouré(e) de gens qui t'aiment", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Lire dans les pensées", b: "Être invisible quand tu veux", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Pas de musique pendant 1 an", b: "Pas de séries ni de films pendant 1 an", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Tes parents lisent TOUS tes messages", b: "Tes potes lisent TOUS tes messages", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Ne manger que de l'italien toute ta vie", b: "Ne manger que de l'asiatique toute ta vie", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Toujours dire la vérité, même quand c'est cruel", b: "Mentir tout le temps pour rendre les gens heureux", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Connaître la date exacte de ta mort", b: "Savoir comment tu vas mourir", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Avoir le hoquet à vie", b: "Avoir toujours une chaussette mouillée", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Parler à tous les animaux", b: "Parler toutes les langues du monde", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Être toujours 10 min en retard", b: "Être toujours 1 h en avance", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Ton rire devient une sirène de pompier", b: "Tes éternuements font un bruit de canard", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Revivre ta pire honte en boucle dans tes rêves", b: "Que tout le monde ici l'ait vue en vidéo", hint: P },
  { type: "prefere", pack: "trash", text: "Tu préfères :", a: "Ta mère devient ta coloc pendant 1 an", b: "Ton ex devient ton/ta coloc pendant 1 an", hint: P },
  { type: "prefere", pack: "trash", text: "Tu préfères :", a: "Personne ne t'aime mais tu fais ce que tu veux", b: "Tout le monde t'adore mais tu n'as plus aucun libre arbitre", hint: P },
  { type: "prefere", pack: "trash", text: "Tu préfères :", a: "Trouver 1 M€ mais ne jamais pouvoir en parler", b: "Gagner 50 000 € et le crier sur tous les toits", hint: P },
  { type: "prefere", pack: "trash", text: "Tu préfères :", a: "Tes parents se font passer pour toi sur tes réseaux pendant 1 an", b: "Tu te fais passer pour tes parents sur les leurs pendant 1 an", hint: P },
  { type: "prefere", pack: "trash", text: "Tu préfères :", a: "Tes notes vocales sont diffusées dans tout le bâtiment", b: "Ton historique de recherche est affiché au bureau", hint: P },
  { type: "prefere", pack: "coquin", text: "Tu préfères :", a: "Plus jamais de bisous de ta vie", b: "Des bisous à vie mais jamais d'amour", hint: P },
  { type: "prefere", pack: "coquin", text: "Tu préfères :", a: "Ton crush lit tout ton historique", b: "Ta famille apprend toute ta vie amoureuse", hint: P },
  { type: "prefere", pack: "coquin", text: "Tu préfères :", a: "Recroiser ton ex en soirée, personne ne le sait", b: "Un date avec un(e) inconnu(e), ton crush l'apprend", hint: P },
  { type: "prefere", pack: "coquin", text: "Tu préfères :", a: "Quelqu'un raconte tes pires dates devant toi", b: "Quelqu'un lit tes vieux messages de drague à voix haute", hint: P },
  { type: "prefere", pack: "coquin", text: "Tu préfères :", a: "Un date parfait mais aucune alchimie", b: "Une alchimie folle mais un date catastrophique", hint: P },

  // ── DANS MA VALISE (mémoire cumulative) ──────────────
  { type: "valise", pack: "soft", text: "Dans ma valise il y a…", hint: VAL },
  { type: "valise", pack: "soft", text: "Dans mon sac de soirée il y a…", hint: VAL },
  { type: "valise", pack: "soft", text: "Dans mon sac de plage il y a…", hint: VAL },
  { type: "valise", pack: "soft", text: "Dans le placard de la salle de bain il y a…", hint: VAL },
  { type: "valise", pack: "soft", text: "Dans ma chambre d'ado il y a…", hint: VAL },
  { type: "valise", pack: "soft", text: "Dans la cave de mes parents il y a…", hint: VAL },
  { type: "valise", pack: "soft", text: "Dans le sac de courses du dimanche soir il y a…", hint: VAL },
  { type: "valise", pack: "quiz", text: "Dans mon frigo il y a…", hint: VAL },
  { type: "valise", pack: "coquin", text: "Dans ma valise pour un week-end en amoureux il y a…", hint: VAL + " Coquin autorisé, explicite interdit." },
  { type: "valise", pack: "trash", text: "Dans mon historique de recherche il y a…", hint: VAL },
  { type: "valise", pack: "trash", text: "Dans les messages que je regrette il y a…", hint: VAL },

  // ── COQUIN 18+ (non explicite) ───────────────────────
  { type: "coquin", pack: "coquin", text: "Le pire endroit où t'as embrassé quelqu'un ?", hint: "Tour de table. L'histoire la plus bidon prend la peine." },
  { type: "coquin", pack: "coquin", text: "Cite trois trucs qui te font craquer chez quelqu'un, en 5 secondes.", hint: "Le lecteur désigne qui répond. Échec = peine." },
  { type: "coquin", pack: "coquin", text: "Message de drague à 3 h du mat : qu'est-ce que t'écris ?", hint: "À voix haute. Le groupe vote pour le plus tiède : peine." },
  { type: "coquin", pack: "coquin", text: "Le pire surnom affectueux qu'on t'a déjà donné ?", hint: "Tour de table à voix haute." },
  { type: "coquin", pack: "coquin", text: "Lis le message le plus mignon de ta dernière conversation (ou invente-le).", hint: "Le lecteur désigne. Refus = gage." },
  { type: "coquin", pack: "coquin", text: "Ta pire technique de drague, démonstration sur le coussin le plus proche.", hint: "Le lecteur désigne. Refus = gage." },
  { type: "coquin", pack: "coquin", text: "Raconte ton premier bisou en trois mots.", hint: "Tour de table. Le plus nul prend la peine." },
  { type: "coquin", pack: "coquin", text: "Le date le plus gênant de ta vie, en 30 secondes.", hint: "Le lecteur désigne. Le groupe juge." },
  { type: "vote", pack: "coquin", text: "Qui embrasse le mieux ici (d'après la rumeur) ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui est le plus charmeur sans le faire exprès ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui a la vie amoureuse la plus compliquée ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui ment le plus sur les applis de rencontre ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui a la double-vie la plus crédible ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui retourne toujours avec son ex ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui tombe amoureux le plus vite ?", hint: V },

  // ── TRASH 18+ ────────────────────────────────────────
  { type: "vote", pack: "trash", text: "Qui a déjà ghosté quelqu'un après un super date ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui pourrait avoir une vraie double-vie ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui drague de la pire façon ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui pourrait avoir un enfant caché quelque part ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui finirait premier en prison (pour un truc ridicule) ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui stalke encore son ex ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui a le plus de captures d'écran compromettantes sur les autres ?", hint: V },
  { type: "coquin", pack: "trash", text: "Avoue le truc le plus chelou que t'as fait pour plaire à quelqu'un.", hint: "Le lecteur désigne. Bouche cousue = gage." },
  { type: "coquin", pack: "trash", text: "Le pire endroit où t'as fini une soirée ?", hint: "Tour de table. Personne ne croit ton histoire = peine." },
  { type: "coquin", pack: "trash", text: "Le mensonge le plus gros que t'as dit à quelqu'un ici ?", hint: "Le lecteur désigne. Refus = gage." },
  { type: "coquin", pack: "trash", text: "Montre ta dernière recherche internet (ou prends la peine).", hint: "Le lecteur désigne." },

  // ── QUIZ DÉBILE ──────────────────────────────────────
  { type: "table", pack: "quiz", text: "Citez chacun un emoji que vous n'utilisez jamais.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun une capitale européenne.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un acteur ou une actrice français(e).", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un type de céréales du petit-déj.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un président américain.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un film d'animation.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun une race de chien.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun une capitale africaine.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un pays d'Asie.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un super-héros.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un instrument de musique.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un sport collectif.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun une planète ou une étoile.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un fromage.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un département français (nom ou numéro).", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un mot de 10 lettres ou plus.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un élément du tableau périodique.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un dieu ou une déesse de la mythologie.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un pays qui a gagné la Coupe du monde de foot.", hint: "Le premier qui sèche (ou se trompe) perd." },
  { type: "table", pack: "quiz", text: "Citez chacun un monument célèbre.", hint: T },
  { type: "table", pack: "quiz", text: "Citez chacun un personnage de conte de fées.", hint: T },

  // ── JOKERS (rares, effet immédiat) ───────────────────
  { type: "joker", pack: "soft", joker: "amnesty", text: "🃏 AMNISTIE — La dernière peine distribuée est annulée.", hint: "Le compteur est corrigé tout de suite." },
  { type: "joker", pack: "soft", joker: "pick", text: "🃏 CHOISIS — Le lecteur désigne directement qui prend une peine, sans débat.", hint: "Choisis vite, c'est ton heure." },
  { type: "joker", pack: "soft", joker: "shield", text: "🃏 BOUCLIER — Donne un bouclier à quelqu'un : sa prochaine peine sera annulée.", hint: "Le bouclier 🛡️ s'affiche à côté de son nom." },
  { type: "joker", pack: "soft", joker: "pick", text: "🃏 DOUBLON — Désigne deux joueurs : duel de regards. Le premier qui rit ou cligne des yeux prend la peine.", hint: "Le lecteur arbitre." },
  { type: "joker", pack: "soft", joker: "none", text: "🃏 PASSE-MAIN — Donne le téléphone à qui tu veux : c'est lui qui lit la suite.", hint: "Effet immédiat." },
  { type: "joker", pack: "trash", joker: "pick", text: "🃏 INVERSION — Le dernier perdant choisit qui prend une peine à sa place.", hint: "Le pouvoir change de main." },
];

/** Gages soft, drôles et sans danger, tirés au sort par la roulette. */
export const GAGES: string[] = [
  "Parle avec un accent de ton choix jusqu'à ton prochain tour.",
  "Fais un compliment sincère à chaque personne présente.",
  "Imite le cri d'un animal choisi par ton voisin de gauche.",
  "Raconte ta plus grosse honte du collège en 30 secondes.",
  "Fais 10 squats en chantant un générique de dessin animé.",
  "Chante le refrain d'une chanson choisie par le groupe.",
  "Fais une déclaration d'amour dramatique à un objet de la pièce.",
  "Parle uniquement en chuchotant pendant 2 cartes.",
  "Fais ta meilleure imitation (gentille) de quelqu'un ici.",
  "Présente la météo de la soirée comme à la télé.",
  "Danse 15 secondes sans musique, avec conviction.",
  "Fais un discours de remerciement comme si tu gagnais un prix.",
  "Mime ton métier ou tes études : les autres doivent deviner.",
  "Raconte une blague. Si personne ne rit, raconte-en une autre.",
  "Récite l'alphabet à l'envers, de Z jusqu'à M.",
  "Prends la pose d'une statue pendant 30 secondes.",
  "Traverse la pièce en défilant comme un mannequin.",
  "Donne un surnom à chaque joueur : il le garde jusqu'à la fin.",
  "Réponds à la prochaine question uniquement en chantant.",
  "Commente la soirée comme un match de foot pendant 1 minute.",
  "Laisse ton voisin de droite te coiffer en 30 secondes.",
  "Tiens 15 secondes de gainage (ou fais 3 pompes).",
  "Fais la voix off d'un documentaire animalier sur ton voisin.",
  "Invente un slogan publicitaire pour la personne à ta gauche.",
  "Fais un rap de 4 phrases sur la soirée.",
  "Dis trois qualités de la personne que tu connais le moins ici.",
  "Fais ta pire grimace : si le groupe n'est pas convaincu, recommence.",
  "Guide quelqu'un jusqu'à la cuisine en faisant la voix d'un GPS.",
  "Parle de toi à la 3ᵉ personne jusqu'à ton prochain tour.",
  "Vends un objet à portée de main comme dans le téléachat.",
  "Raconte ta journée comme un conte de fées.",
  "Tiens sur un pied pendant 20 secondes en racontant ta semaine.",
  "Échange ta place avec la personne de ton choix.",
  "Propose un toast (eau ou soft, ça compte) en l'honneur de quelqu'un.",
  "Fais deviner un film en mimant, sans un mot.",
  "Imite la sonnerie de ton réveil jusqu'à ce que quelqu'un rie.",
  "Joue la prochaine carte avec la voix d'un méchant de film.",
  "Invente le nom de ton futur groupe de musique et chante son tube 10 secondes.",
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

export const PACK_INFO: Record<Pack, { emoji: string; label: string; sub: string; tint: string; adult?: boolean }> = {
  soft:    { emoji: "😄", label: "Soft",    sub: "Entre potes, propre",                      tint: "#5BA3FF" },
  quiz:    { emoji: "🧠", label: "Quiz",    sub: "Tour de table débile",                     tint: "#3DDC97" },
  coquin:  { emoji: "🔥", label: "Coquin",  sub: "18+ · séduction et confidences, rien d'explicite", tint: "#FF3EA5", adult: true },
  trash:   { emoji: "💀", label: "Trash",   sub: "18+ · gros aveux, questions piquantes",    tint: "#7A4EE8", adult: true },
};

export const TYPE_INFO: Record<PicoletteType, { emoji: string; label: string; tint: string }> = {
  vote:    { emoji: "🗳️",  label: "Vote groupe",        tint: "#FF6B5B" },
  table:   { emoji: "🎤",  label: "Tour de table",      tint: "#3DDC97" },
  rule:    { emoji: "📝",  label: "Règle live",         tint: "#C58CFF" },
  prefere: { emoji: "🪙",  label: "Tu préfères",        tint: "#FF8C42" },
  valise:  { emoji: "🧳",  label: "Dans ma valise…",    tint: "#3DDC97" },
  coquin:  { emoji: "💋",  label: "Confidences 18+",    tint: "#FF3EA5" },
  joker:   { emoji: "🃏",  label: "Joker",              tint: "#7A4EE8" },
};
