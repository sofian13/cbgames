// La Tournée — la banque de cartes orales (le tel sert juste à lire et désigner le perdant).
// Pensé pour la soirée sur le canapé : tout se joue à la voix.
// Peine = 1 à 3 gorgées (de ce que tu veux : eau, soft…) OU un gage soft tiré au sort.

import { getLang, type I18n, type Lang } from "@/lib/i18n";
import { CARDS_EN, GAGES_EN, PACK_TEXT_EN, TYPE_LABEL_EN } from "./cards.en";
import { CARDS_ES, GAGES_ES, PACK_TEXT_ES, TYPE_LABEL_ES } from "./cards.es";

export type PicoletteType =
  | "vote"
  | "table"
  | "rule"
  | "prefere"
  | "valise"
  | "coquin"
  | "joker"
  | "quiz"     // question avec réponse cachée (« Voir la réponse »)
  | "duel"     // {p1} contre {p2} : seuls eux peuvent perdre
  | "jamais"   // « Je n'ai jamais… »
  | "defi"
  | "mime"
  | "chanson"
  | "avoue";

export type Pack = "soft" | "quiz" | "pop" | "coquin" | "trash";

/** Effet des cartes joker (agissent réellement sur le compteur, ou immédiat sans état). */
export type JokerEffect =
  | "pick"     // le lecteur désigne directement qui prend une peine
  | "amnesty"  // annule la dernière peine
  | "shield"   // donne un bouclier : la prochaine peine de ce joueur est annulée
  | "clear"    // lève la règle live en cours
  | "reader"   // le lecteur choisit qui lit la carte suivante
  | "none";    // effet purement oral, immédiat

export interface PicoletteCard {
  type: PicoletteType;
  pack: Pack;
  /** Ce que le lecteur lit à voix haute. {p1} / {p2} = prénoms de joueurs tirés au sort (distincts). */
  text: string;
  hint?: string;       // mini-règle d'exécution (accepte aussi {p1} / {p2})
  answer?: string;     // cartes "quiz" : réponse dévoilée par le lecteur
  // Durée des cartes "rule" (une seule des trois ; défaut = 4 min)
  ruleSec?: number;    // en secondes
  ruleCards?: number;  // en nombre de cartes
  ruleUntilNext?: boolean; // jusqu'à la prochaine règle
  a?: string;          // option "main en haut" (cartes "prefere")
  b?: string;          // option "main en bas"  (cartes "prefere")
  joker?: JokerEffect; // pour les cartes "joker"
}

const V = "3-2-1, tout le monde pointe quelqu'un. Le plus désigné prend la peine.";
const T = "Tour de table, pas de répétition. Le premier qui sèche perd.";
const P = "3-2-1 : main en haut pour le choix du haut, main en bas pour le bas. Le camp minoritaire prend la peine.";
const R = "Le premier qui dérape prend la peine.";
const VAL = "Chacun répète TOUTE la liste et ajoute un truc. Le premier qui oublie ou se trompe perd.";

const BASE_CARDS: PicoletteCard[] = [
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
  { type: "rule", pack: "soft", text: "Interdit de dire « genre »", hint: R, ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Interdit de dire « oui »", hint: "Réponds autrement. " + R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « du coup »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « en fait »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « moi »", hint: "Parle sans te citer. " + R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « ouais »", hint: "Dis « oui » comme un adulte. " + R, ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Interdit de dire « frère »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « tu vois »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « j'avoue »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « grave »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « wesh »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « trop »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de dire « voilà »", hint: R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Interdit de prononcer le mot « non »", hint: "Esquive avec créativité. " + R, ruleSec: 300 },
  { type: "rule", pack: "soft", text: "Tout le monde parle à la 3ᵉ personne", hint: "« Léa pense que… » " + R, ruleSec: 180 },
  { type: "rule", pack: "soft", text: "Pas le droit de rigoler", hint: "Le premier qui rit ou sourit prend la peine.", ruleSec: 120 },
  { type: "rule", pack: "soft", text: "Interdit de montrer du doigt", hint: "Pour les votes, on désigne du menton. " + R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Chaque phrase doit finir par « mon capitaine »", hint: R, ruleSec: 180 },
  { type: "rule", pack: "soft", text: "Interdit d'appeler quelqu'un par son prénom", hint: "Surnoms uniquement. " + R, ruleSec: 240 },
  { type: "rule", pack: "soft", text: "Il faut lever la main avant de parler", hint: R, ruleSec: 180 },
  { type: "rule", pack: "soft", text: "Interdit de toucher son téléphone (sauf le lecteur)", hint: R, ruleSec: 240 },
  { type: "rule", pack: "trash", text: "Interdit de rire ou de sourire", hint: "Le premier qui craque prend la peine.", ruleSec: 240 },
  { type: "rule", pack: "trash", text: "Chaque phrase doit contenir un mot anglais", hint: R, ruleSec: 180 },

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
  { type: "joker", pack: "soft", joker: "amnesty", text: "AMNISTIE — La dernière peine distribuée est annulée.", hint: "Le compteur est corrigé tout de suite." },
  { type: "joker", pack: "soft", joker: "pick", text: "CHOISIS — Le lecteur désigne directement qui prend une peine, sans débat.", hint: "Choisis vite, c'est ton heure." },
  { type: "joker", pack: "soft", joker: "shield", text: "BOUCLIER — Donne un bouclier à quelqu'un : sa prochaine peine sera annulée.", hint: "Le bouclier 🛡️ s'affiche à côté de son nom." },
  { type: "joker", pack: "soft", joker: "pick", text: "DOUBLON — Désigne deux joueurs : duel de regards. Le premier qui rit ou cligne des yeux prend la peine.", hint: "Le lecteur arbitre." },
  { type: "joker", pack: "soft", joker: "reader", text: "PASSE-MAIN — Donne le téléphone à qui tu veux : c'est lui qui lit la suite.", hint: "Effet immédiat." },
  { type: "joker", pack: "trash", joker: "pick", text: "INVERSION — Le dernier perdant choisit qui prend une peine à sa place.", hint: "Le pouvoir change de main." },
];

// ═════════════════════════════════════════════════════════════
// Extension « La Tournée muscle » : Cite…, règles live à durée en cartes,
// quiz à réponse, duels, Je n'ai jamais, défis, mimes, chansons, aveux.
// {p1} / {p2} = prénoms tirés au sort au moment de mélanger.
// ═════════════════════════════════════════════════════════════
const TC = "Chacun son tour, sans répéter. Le premier qui sèche (ou invente) perd.";
const Q = "{p1} répond en 10 secondes. Faux ou rien = peine.";
const J = "Ceux qui l'ont déjà fait lèvent la main et racontent en une phrase. Refuser de raconter = peine.";
const M = "Sans un mot ni un bruit. Personne ne trouve en 30 secondes ? {p1} prend la peine.";
const CH = "Tu bloques plus de 10 secondes ? Peine.";
const AV = "Réponds franchement… ou prends la peine.";
const DF = "Refus ou échec = peine.";
const GV = "Le groupe vote. Le moins convaincant prend la peine.";

const MORE_CARDS: PicoletteCard[] = [
  // ── CITE… — CULTURE POP ───────────────────────────────
  { type: "table", pack: "pop", text: "Cite des mangas.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des persos de One Piece.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des persos de Naruto.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des persos de Dragon Ball.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des chanteuses françaises.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des chanteuses américaines.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des rappeurs français.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des rappeurs américains.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des séries Netflix.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des séries françaises.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des Pokémon.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des Pokémon de type Feu.", hint: "Le premier qui sèche (ou cite un Pokémon qui n'est pas Feu) perd." },
  { type: "table", pack: "pop", text: "Cite des persos de Harry Potter.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des films Disney ou Pixar.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des méchants Disney.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des chansons de films Disney.", hint: "Bonus d'honneur si tu chantes la première ligne. " + TC },
  { type: "table", pack: "pop", text: "Cite des persos des Simpson.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des dessins animés que tu regardais après l'école.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des jeux vidéo qui ont plus de 15 ans.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des persos de l'univers Mario.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des persos de jeux vidéo.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des consoles de jeux.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des tubes de l'été.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des chansons qu'on hurle toutes en soirée.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des émissions de télé-réalité.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des boys bands ou des girls bands.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des groupes de K-pop.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des films Marvel.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des super-vilains.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des persos de Star Wars.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des films d'horreur.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des films de Noël.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des sagas de films (au moins trois films).", hint: TC },
  { type: "table", pack: "pop", text: "Cite des films avec un chiffre dans le titre.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des attaques d'anime, en criant comme il faut.", hint: "Pas crié = pas compté. " + TC },
  { type: "table", pack: "pop", text: "Cite des persos d'anime aux cheveux de couleur pas naturelle.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des artistes connus sous un seul mot.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des duos ou groupes de musique français.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des youtubeurs ou streamers français.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des applis que plus personne n'utilise.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des mèmes ou des expressions nées sur internet.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des jeux de société.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des sitcoms.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des génériques de dessins animés que tu sais chanter.", hint: "Il faut chanter une ligne pour valider. " + TC },
  { type: "table", pack: "pop", text: "Cite des persos de Shrek.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des princesses ou princes Disney.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des chansons des années 2000.", hint: TC },
  { type: "table", pack: "pop", text: "Cite des films d'animation japonais.", hint: TC },

  // ── CITE… — BOUFFE, ENFANCE, VIE QUOTIDIENNE ──────────
  { type: "table", pack: "soft", text: "Cite des marques de bonbons.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des goûts de chips.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des parfums de glace.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des formes de pâtes.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des sauces.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des desserts.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des plats qu'on commande en livraison.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des goûters de quand t'étais petit.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des jeux de cour de récré.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des trucs qu'on trouvait dans une trousse.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des phrases de prof.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des trucs qu'on dit à son chat ou à son chien.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des noms de groupes de discussion que t'as déjà eus.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des mots en verlan.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des mots anglais qu'on dit tous les jours.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des excuses pour ne pas répondre à un message.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des trucs qui piquent.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des trucs jaunes.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des trucs qui ont des roues.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des clubs de foot.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des footballeurs ou footballeuses.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des sports où il y a une balle ou un ballon.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des danses.", hint: "Démo de deux secondes obligatoire. " + TC },
  { type: "table", pack: "soft", text: "Cite des marques de voitures.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des marques de vêtements de sport.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des chaînes de fast-food.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des boissons chaudes.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des fêtes ou des jours fériés.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des signes astrologiques… avec leur pire défaut.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des trucs qu'on fait le dimanche à 15 h.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des endroits où t'as déjà dormi (hors lit).", hint: TC },
  { type: "table", pack: "soft", text: "Cite des métiers qui finissent en « -eur ».", hint: TC },
  { type: "table", pack: "soft", text: "Cite des mots qui finissent en « -ette ».", hint: TC },
  { type: "table", pack: "soft", text: "Cite des légumes verts.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des oiseaux.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des animaux d'Afrique.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des trucs qu'on trouve au fond d'un sac.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des phrases qu'on dit au réveil.", hint: TC },
  { type: "table", pack: "soft", text: "Cite des trucs qu'on achète en se disant « je vais m'y mettre ».", hint: TC },

  // ── CITE… — QUIZ (géo, sciences, histoire) ────────────
  { type: "table", pack: "quiz", text: "Cite des pays d'Europe.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des pays d'Amérique du Sud ou centrale.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des capitales d'Amérique.", hint: "Le premier qui sèche (ou se trompe) perd." },
  { type: "table", pack: "quiz", text: "Cite des villes du monde qui commencent par B.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des fleuves ou des rivières.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des îles.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des pays au bord de la Méditerranée.", hint: "Le premier qui sèche (ou se trompe) perd." },
  { type: "table", pack: "quiz", text: "Cite des langues parlées dans le monde.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des os du corps humain.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des mammifères marins.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des peintres célèbres.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des rois ou reines de France.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des inventions qui ont changé le monde.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des pays avec une étoile sur le drapeau.", hint: "Le premier qui sèche (ou se trompe) perd." },
  { type: "table", pack: "quiz", text: "Cite des pays qui commencent par C.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des unités de mesure.", hint: TC },
  { type: "table", pack: "quiz", text: "Cite des philosophes ou des scientifiques.", hint: TC },

  // ── CITE… — COQUIN / TRASH ────────────────────────────
  { type: "table", pack: "coquin", text: "Cite des films romantiques.", hint: TC },
  { type: "table", pack: "coquin", text: "Cite des lieux de premier date.", hint: TC },
  { type: "table", pack: "coquin", text: "Cite des surnoms d'amoureux, avec la voix qui va bien.", hint: TC },
  { type: "table", pack: "coquin", text: "Cite des chansons parfaites pour un slow.", hint: TC },
  { type: "table", pack: "trash", text: "Cite des excuses bidon pour ne pas rendre de l'argent.", hint: TC },
  { type: "table", pack: "trash", text: "Cite des trucs que ta mère ne doit jamais trouver dans ta chambre.", hint: "Rien d'explicite. " + TC },
  { type: "table", pack: "trash", text: "Cite des phrases qu'on dit pour finir une conversation gênante.", hint: TC },

  // ── RÈGLES LIVE (durée en cartes) ─────────────────────
  { type: "rule", pack: "soft", text: "Interdit de dire « quoi »", hint: "Même « hein ? » est dangereux. " + R, ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Interdit de dire « oui » ou « non »", hint: "« Carrément », « jamais de la vie »… sois créatif. " + R, ruleCards: 5 },
  { type: "rule", pack: "soft", text: "Verre dans la main faible : main gauche pour les droitiers, main droite pour les gauchers", hint: "Celui qu'on grille avec le verre dans la mauvaise main prend la peine.", ruleUntilNext: true },
  { type: "rule", pack: "soft", text: "Interdit de dire un gros mot", hint: "« Mince » et « zut » sont tes nouveaux meilleurs amis. " + R, ruleCards: 8 },
  { type: "rule", pack: "soft", text: "Tout le monde parle avec un accent, au choix du lecteur", hint: "Celui qui perd son accent prend la peine.", ruleCards: 4 },
  { type: "rule", pack: "soft", text: "{p1} a le pouce royal", hint: "Quand {p1} pose discrètement son pouce sur la table, tout le monde l'imite. Le dernier prend la peine.", ruleUntilNext: true },
  { type: "rule", pack: "soft", text: "Interdit de répondre aux questions de {p1}", hint: "Celui qui répond à une question de {p1} prend la peine. Astuce : réponds par une autre question.", ruleCards: 8 },
  { type: "rule", pack: "soft", text: "{p1} a le regard maudit", hint: "Celui qui croise le regard de {p1} prend la peine.", ruleCards: 5 },
  { type: "rule", pack: "soft", text: "{p1} dirige l'orchestre", hint: "Quand {p1} lève la main, silence total. Le dernier qui parle prend la peine.", ruleUntilNext: true },
  { type: "rule", pack: "soft", text: "Tout le monde appelle {p1} « Votre Majesté »", hint: "Celui qui oublie prend la peine.", ruleUntilNext: true },
  { type: "rule", pack: "soft", text: "Nouveau prénom pour {p1} : Gérard (ou Josiane)", hint: "{p1} choisit et ne répond plus qu'à ça. Celui qui dit son vrai prénom prend la peine.", ruleUntilNext: true },
  { type: "rule", pack: "soft", text: "{p1} et {p2} se tiennent par le petit doigt", hint: "Celui qui lâche prend la peine.", ruleCards: 4 },
  { type: "rule", pack: "soft", text: "{p1} fait le DJ : un bruit de transition entre chaque carte", hint: "Si {p1} oublie, peine pour {p1}.", ruleCards: 5 },
  { type: "rule", pack: "soft", text: "Interdit de dire un chiffre ou un nombre", hint: R, ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Interdit de dire « je »", hint: "« On » est autorisé, bon courage. " + R, ruleCards: 5 },
  { type: "rule", pack: "soft", text: "Interdit de dire « ça »", hint: R, ruleCards: 4 },
  { type: "rule", pack: "soft", text: "Interdit de dire « c'est »", hint: R, ruleCards: 4 },
  { type: "rule", pack: "soft", text: "Interdit de dire « attends »", hint: R, ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Interdit de dire « vas-y »", hint: R, ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Interdit de dire « je sais pas »", hint: "Invente une réponse, même nulle. " + R, ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Interdit de dire « mdr », « ptdr » ou « lol » à voix haute", hint: R, ruleCards: 8 },
  { type: "rule", pack: "soft", text: "Interdit de dire « verre » ou « boire »", hint: "Paraphrase. " + R, ruleCards: 8 },
  { type: "rule", pack: "soft", text: "Plus un mot d'anglais : « ok », « cool », « nice », c'est fini", hint: "« D'accord », « chouette », « joli ». " + R, ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Tout le monde se vouvoie", hint: "Même ton meilleur pote. " + R, ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Chaque phrase commence par « Mesdames et messieurs »", hint: R, ruleCards: 4 },
  { type: "rule", pack: "soft", text: "Chaque phrase finit par « bisous »", hint: R, ruleCards: 4 },
  { type: "rule", pack: "soft", text: "On ne parle qu'en chuchotant", hint: "Le premier qui parle fort prend la peine.", ruleCards: 3 },
  { type: "rule", pack: "soft", text: "Tout le monde parle comme un présentateur du JT", hint: R, ruleCards: 3 },
  { type: "rule", pack: "soft", text: "Il faut se lever pour parler", hint: R, ruleCards: 3 },
  { type: "rule", pack: "soft", text: "Les mains sur la tête quand on parle", hint: R, ruleCards: 3 },
  { type: "rule", pack: "soft", text: "Interdit de croiser les bras ou les jambes", hint: R, ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Interdit de se toucher le visage ou les cheveux", hint: R, ruleCards: 5 },
  { type: "rule", pack: "soft", text: "Chaque fois que le téléphone change de main : « Abracadabra ! »", hint: "Celui qui le reçoit sans le dire prend la peine.", ruleCards: 6 },
  { type: "rule", pack: "soft", text: "On applaudit chaque fois que quelqu'un prend une peine", hint: "Celui qui n'applaudit pas prend la peine à son tour.", ruleCards: 6 },
  { type: "rule", pack: "soft", text: "Quand quelqu'un dit « zinzin », tout le monde crie « ZINZIN ! »", hint: "Le dernier à crier prend la peine.", ruleUntilNext: true },
  { type: "rule", pack: "pop", text: "Chaque phrase se termine par un cri d'anime", hint: "« … Kamehameha ! » marche aussi. " + R, ruleCards: 4 },
  { type: "rule", pack: "pop", text: "Interdit de dire le nom d'une série ou d'un film", hint: "Décris-le à la place. " + R, ruleCards: 6 },
  { type: "rule", pack: "pop", text: "Tout le monde parle comme dans un doublage de film des années 90", hint: "Voix grave, mots dramatiques. " + R, ruleCards: 3 },
  { type: "rule", pack: "trash", text: "Interdit de dire du mal de quelqu'un… même pour rire", hint: R, ruleCards: 6 },
  { type: "rule", pack: "coquin", text: "Chaque fois que quelqu'un dit « amour », clin d'œil obligatoire à sa droite", hint: "Celui qui oublie prend la peine.", ruleCards: 6 },

  // ── VOTES — SOFT / POP ────────────────────────────────
  { type: "vote", pack: "soft", text: "Qui envoie des vocaux de quatre minutes ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui parle à ses plantes ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui tape ses symptômes sur internet et se croit condamné ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui oublie toujours les anniversaires ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui garde des tickets de caisse de 2019 ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui se ferait avoir par un faux SMS de livraison ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui ouvrira un food truck un jour ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui deviendra viral sans le vouloir ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui a déjà l'âme d'un daron ou d'une daronne ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui chante faux au karaoké avec le plus d'assurance ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui dit « ce soir je me couche tôt » et finit à 5 h ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui a le rire le plus contagieux ?", hint: "3-2-1, tout le monde pointe quelqu'un. Le plus désigné fait rire le groupe en 10 secondes, sinon peine." },
  { type: "vote", pack: "soft", text: "Qui tiendrait 10 minutes de conversation avec un inconnu dans un ascenseur ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui se perdrait dans un magasin de meubles suédois ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui ferait le pire candidat d'une émission de survie ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui reviendrait de vacances fiancé(e) ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui ferait un prof génial… mais un peu flippant ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui a le plus de hoodies ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui s'est déjà fait recaler à l'entrée d'une soirée ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui raconte des histoires qui n'ont pas de fin ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui serait chef de la cantine en prison ?", hint: V },
  { type: "vote", pack: "soft", text: "Qui a 400 onglets ouverts sur son téléphone ?", hint: V },
  { type: "vote", pack: "pop", text: "Qui embarquerait sur le bateau de Luffy sans réfléchir ?", hint: V },
  { type: "vote", pack: "pop", text: "Qui ferait le meilleur méchant de manga ?", hint: V },
  { type: "vote", pack: "pop", text: "Qui serait le perso secondaire qui vole la vedette ?", hint: V },
  { type: "vote", pack: "pop", text: "Qui aurait été une star des années 2000 ?", hint: V },
  { type: "vote", pack: "pop", text: "Qui serait envoyé chez les Serpentard direct ?", hint: V },
  { type: "vote", pack: "pop", text: "Qui serait éliminé en premier dans Squid Game ?", hint: V },
  { type: "vote", pack: "pop", text: "Qui pourrait être jury d'un télé-crochet… et descendre tout le monde ?", hint: V },
  { type: "vote", pack: "pop", text: "Qui connaît toutes les chorés des clips par cœur ?", hint: "3-2-1, tout le monde pointe quelqu'un. Le plus désigné fait 5 secondes de choré, sinon peine." },
  { type: "vote", pack: "pop", text: "Qui pleure à chaque film d'animation ?", hint: V },

  // ── VOTES — COQUIN / TRASH ────────────────────────────
  { type: "vote", pack: "coquin", text: "Qui a un nouveau crush chaque mois ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui envoie des « tu dors ? » à 2 h du mat ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui se fait draguer sans jamais s'en rendre compte ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui rougit le plus vite ?", hint: V },
  { type: "vote", pack: "coquin", text: "Qui a le meilleur regard de séducteur ou de séductrice ?", hint: "3-2-1, tout le monde pointe quelqu'un. Le plus désigné fait une démo, sinon peine." },
  { type: "vote", pack: "coquin", text: "Qui ferait la demande en mariage la plus spectaculaire ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui a déjà fouillé le téléphone de quelqu'un ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui se ferait virer d'un groupe de discussion en premier ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui a un compte secret pour stalker ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui balancerait tout le monde pour une pizza ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui a déjà menti sur son âge ?", hint: V },
  { type: "vote", pack: "trash", text: "Qui ne sait pas garder un secret plus de 24 heures ?", hint: V },

  // ── JE N'AI JAMAIS ────────────────────────────────────
  { type: "jamais", pack: "soft", text: "Je n'ai jamais fait semblant de connaître une chanson en soirée.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais pleuré devant un dessin animé.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais envoyé un message à la mauvaise personne.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais fait semblant d'être au téléphone pour éviter quelqu'un.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais oublié un prénom deux secondes après qu'on me l'a dit.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais liké une vieille photo par accident en stalkant.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais appliqué la règle des 5 secondes.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais raté un train ou un avion.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais dit « je suis en bas » en étant encore chez moi.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais appelé un prof « maman » ou « papa ».", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais fait un concert entier sous la douche.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais menti sur un CV.", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais répondu « toi aussi » au serveur qui disait « bon appétit ».", hint: J },
  { type: "jamais", pack: "soft", text: "Je n'ai jamais dormi plus de 14 heures d'affilée.", hint: J },
  { type: "jamais", pack: "pop", text: "Je n'ai jamais enchaîné une saison entière en une nuit.", hint: J },
  { type: "jamais", pack: "pop", text: "Je n'ai jamais spoilé une série exprès.", hint: J },
  { type: "jamais", pack: "pop", text: "Je n'ai jamais fait de nuit blanche sur un jeu vidéo.", hint: J },
  { type: "jamais", pack: "pop", text: "Je n'ai jamais fait de cosplay.", hint: J },
  { type: "jamais", pack: "pop", text: "Je n'ai jamais appris une choré de clip par cœur.", hint: J },
  { type: "jamais", pack: "pop", text: "Je n'ai jamais crié une attaque d'anime en vrai.", hint: J },
  { type: "jamais", pack: "coquin", text: "Je n'ai jamais eu un crush sur un perso de dessin animé.", hint: J },
  { type: "jamais", pack: "coquin", text: "Je n'ai jamais dragué avec une phrase toute faite.", hint: J },
  { type: "jamais", pack: "coquin", text: "Je n'ai jamais relu dix fois une conversation avec mon crush.", hint: J },
  { type: "jamais", pack: "coquin", text: "Je n'ai jamais eu un date qui a duré moins d'une heure.", hint: J },
  { type: "jamais", pack: "coquin", text: "Je n'ai jamais embrassé quelqu'un dont j'avais oublié le prénom.", hint: J },
  { type: "jamais", pack: "trash", text: "Je n'ai jamais lu les messages de quelqu'un par-dessus son épaule.", hint: J },
  { type: "jamais", pack: "trash", text: "Je n'ai jamais annulé au dernier moment avec une excuse inventée.", hint: J },
  { type: "jamais", pack: "trash", text: "Je n'ai jamais offert un cadeau que j'avais moi-même reçu.", hint: J },
  { type: "jamais", pack: "trash", text: "Je n'ai jamais fait semblant d'être malade pour sécher.", hint: J },
  { type: "jamais", pack: "trash", text: "Je n'ai jamais critiqué quelqu'un qui est dans cette pièce.", hint: J },

  // ── TU PRÉFÈRES (rapides) ─────────────────────────────
  { type: "prefere", pack: "pop", text: "Tu préfères :", a: "Vivre dans l'univers de One Piece", b: "Vivre dans l'univers de Harry Potter", hint: P },
  { type: "prefere", pack: "pop", text: "Tu préfères :", a: "Être le héros d'un anime (et souffrir à chaque épisode)", b: "Être le pote rigolo du héros (et vivre tranquille)", hint: P },
  { type: "prefere", pack: "pop", text: "Tu préfères :", a: "Ta playlist bloquée sur les tubes de 2008", b: "Ta playlist bloquée sur les génériques de dessins animés", hint: P },
  { type: "prefere", pack: "pop", text: "Tu préfères :", a: "Chanter comme ta chanteuse préférée, mais seulement sous la douche", b: "Chanter faux devant 50 000 personnes", hint: P },
  { type: "prefere", pack: "pop", text: "Tu préfères :", a: "Un dîner avec ton artiste préféré(e)", b: "Un an de concerts gratuits", hint: P },
  { type: "prefere", pack: "pop", text: "Tu préfères :", a: "Le même tube de l'été en boucle pendant un mois", b: "Un mois sans aucune musique", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Revivre tes 10 ans pendant une journée", b: "Voir tes 50 ans pendant une journée", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Plus jamais de fromage", b: "Plus jamais de chocolat", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Toujours avoir 10 % de batterie", b: "Toujours avoir une seule barre de réseau", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Ne plus jamais envoyer de vocal", b: "Ne plus jamais envoyer d'emoji", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Ton ventre gargouille à chaque silence", b: "Tu éternues dès qu'on dit ton prénom", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Voler, mais à 1 m du sol maximum", b: "Être invisible, mais seulement quand personne ne te regarde", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Chanter tout ce que tu dis", b: "Danser chaque fois que tu marches", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Des pieds qui sentent la frite", b: "Des mains qui sentent l'ail", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Dire tout ce que tu penses à voix haute", b: "Ne plus jamais pouvoir mentir", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "10 vrais amis", b: "1 million d'abonnés", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Pouvoir mettre la vie en pause", b: "Pouvoir revenir 10 secondes en arrière", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Un dragon de compagnie de la taille d'un chat", b: "Un chat de la taille d'un dragon", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Toujours avoir du sable dans les chaussures", b: "Toujours avoir une miette dans le lit", hint: P },
  { type: "prefere", pack: "soft", text: "Tu préfères :", a: "Que ta sonnerie soit un cri de chèvre", b: "Que ton réveil soit ta mère qui chante", hint: P },
  { type: "prefere", pack: "trash", text: "Tu préfères :", a: "Ton historique vidéo projeté au mariage de ta cousine", b: "Tes notes de téléphone lues par ton boss", hint: P },
  { type: "prefere", pack: "trash", text: "Tu préfères :", a: "Montrer ta galerie photo à tout le monde ici pendant 1 minute", b: "Lire ta dernière conversation à voix haute", hint: P },
  { type: "prefere", pack: "trash", text: "Tu préfères :", a: "Coincé(e) 3 heures dans un ascenseur avec ton ex", b: "Coincé(e) 3 heures avec ton prof de maths du collège", hint: P },
  { type: "prefere", pack: "coquin", text: "Tu préfères :", a: "Un date au karaoké", b: "Un date dans un escape game", hint: P },
  { type: "prefere", pack: "coquin", text: "Tu préfères :", a: "Ton crush te voit pleurer devant un anime", b: "Ton crush t'entend chanter sous la douche", hint: P },
  { type: "prefere", pack: "coquin", text: "Tu préfères :", a: "Un date parfait, mais il ou elle mâche la bouche ouverte", b: "Un date gênant, mais il ou elle sent incroyablement bon", hint: P },

  // ── DUELS ({p1} contre {p2}) ──────────────────────────
  { type: "duel", pack: "soft", text: "Pierre-feuille-ciseaux entre {p1} et {p2}. En deux manches gagnantes.", hint: "Le perdant prend la peine." },
  { type: "duel", pack: "soft", text: "Concours de regard entre {p1} et {p2}.", hint: "Le premier qui cligne des yeux ou qui rit perd." },
  { type: "duel", pack: "soft", text: "Bataille de pouces entre {p1} et {p2}.", hint: "Pouce coincé 3 secondes = défaite." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : ni oui ni non. {p1} pose des questions pendant 30 secondes.", hint: "Si {p2} dit oui ou non, {p2} perd. Sinon c'est {p1}." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : vous dites un mot chacun votre tour pour raconter une histoire.", hint: "Le premier qui hésite ou qui rit perd." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : trouvez le plus de mots qui riment avec « zinzin » en 15 secondes.", hint: "Chacun son tour, le lecteur compte. Le moins inspiré perd." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : le premier qui touche un objet jaune dans la pièce gagne.", hint: "Sans courir. Le perdant prend la peine." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : Jacques a dit, version duel.", hint: "Le lecteur donne les ordres. Le premier qui se trompe perd." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : récitez l'alphabet le plus vite possible.", hint: "Le lecteur chronomètre. Le plus lent perd." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : {p1} doit faire rire {p2} en 20 secondes, sans contact.", hint: "{p2} rit ou sourit ? {p2} perd. Sinon c'est {p1}." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : vendez le téléphone à l'autre en 15 secondes chacun.", hint: GV },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : le meilleur cri de dinosaure.", hint: GV },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : imitez une alarme de voiture.", hint: "Applaudimètre : le moins applaudi perd." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : cinq pays qui commencent par C, le plus vite possible.", hint: "Le plus lent (ou celui qui se trompe) perd." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : qui a la photo la plus moche de lui dans son téléphone ?", hint: "Chacun montre la sienne. Le groupe vote : la moins moche perd." },
  { type: "duel", pack: "soft", text: "{p1} contre {p2} : le premier qui cite trois fromages qui puent gagne.", hint: "Le perdant prend la peine." },
  { type: "duel", pack: "pop", text: "{p1} contre {p2} : le plus de mangas cités en 20 secondes.", hint: "Chacun son tour, le lecteur compte. Le perdant prend la peine." },
  { type: "duel", pack: "pop", text: "{p1} contre {p2} : chantez 5 secondes d'une chanson Disney.", hint: GV },
  { type: "duel", pack: "pop", text: "{p1} contre {p2} : la meilleure pose de héros de manga.", hint: GV },
  { type: "duel", pack: "pop", text: "{p1} contre {p2} : le meilleur cri de guerre d'anime.", hint: GV },
  { type: "duel", pack: "pop", text: "{p1} contre {p2} : le groupe choisit une chanson, qui en connaît le plus de paroles ?", hint: "Chacun son tour, une phrase. Le premier qui bloque perd." },
  { type: "duel", pack: "pop", text: "{p1} contre {p2} : citez chacun votre tour une chanteuse française.", hint: "Le premier qui sèche perd." },
  { type: "duel", pack: "pop", text: "{p1} contre {p2} : citez chacun votre tour un Pokémon.", hint: "Le premier qui sèche perd." },
  { type: "duel", pack: "coquin", text: "{p1} contre {p2} : la meilleure phrase de drague (gentille) adressée au lecteur.", hint: "Le lecteur choisit. Le perdant prend la peine." },
  { type: "duel", pack: "trash", text: "{p1} contre {p2} : votre pire honte en 15 secondes chacun.", hint: "Le groupe vote : la moins drôle perd." },

  // ── QUIZ (réponse cachée) — CULTURE POP ───────────────
  { type: "quiz", pack: "pop", text: "Comment s'appelle le capitaine de l'équipage du Chapeau de paille ?", answer: "Monkey D. Luffy", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans quel manga trouve-t-on des « fruits du démon » ?", answer: "One Piece", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans Naruto, comment s'appelle le village de Naruto ?", answer: "Konoha, le village caché de la Feuille", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans Dragon Ball, combien de boules de cristal faut-il réunir ?", answer: "7", hint: Q },
  { type: "quiz", pack: "pop", text: "Qui est le héros de Death Note ?", answer: "Light Yagami", hint: Q },
  { type: "quiz", pack: "pop", text: "Quel Pokémon porte le numéro 1 du Pokédex ?", answer: "Bulbizarre", hint: Q },
  { type: "quiz", pack: "pop", text: "En quoi évolue Salamèche ?", answer: "Reptincel", hint: Q },
  { type: "quiz", pack: "pop", text: "Comment s'appelle le frère de Mario ?", answer: "Luigi", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans Le Roi Lion, comment s'appelle le père de Simba ?", answer: "Mufasa", hint: Q },
  { type: "quiz", pack: "pop", text: "Comment s'appelle la chouette de Harry Potter ?", answer: "Hedwige", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans La Reine des neiges, comment s'appelle le royaume ?", answer: "Arendelle", hint: Q },
  { type: "quiz", pack: "pop", text: "Où travaille Bob l'éponge ?", answer: "Au Crabe Croustillant", hint: Q },
  { type: "quiz", pack: "pop", text: "Comment s'appelle le chien de Tintin ?", answer: "Milou", hint: Q },
  { type: "quiz", pack: "pop", text: "Comment s'appelle le chat de Gargamel ?", answer: "Azraël", hint: Q },
  { type: "quiz", pack: "pop", text: "Quel jouet dit « Vers l'infini et au-delà » ?", answer: "Buzz l'Éclair", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans Stranger Things, comment s'appelle la fille aux pouvoirs ?", answer: "Onze (Eleven)", hint: Q },
  { type: "quiz", pack: "pop", text: "Quel est le premier jeu de Squid Game ?", answer: "1, 2, 3, soleil", hint: Q },
  { type: "quiz", pack: "pop", text: "Combien de saisons compte Friends ?", answer: "10", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans les Simpson, comment s'appelle le bar où va Homer ?", answer: "Chez Moe", hint: Q },
  { type: "quiz", pack: "pop", text: "Quel est le vrai prénom de Hulk ?", answer: "Bruce (Bruce Banner)", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans quel dessin animé trouve-t-on Timon et Pumbaa ?", answer: "Le Roi Lion", hint: Q },
  { type: "quiz", pack: "pop", text: "Dans L'Attaque des Titans, comment s'appelle le héros ?", answer: "Eren Jäger (Yeager)", hint: Q },
  { type: "quiz", pack: "pop", text: "Quelle créature est Shrek… et quel animal est son meilleur ami ?", answer: "Shrek est un ogre, son meilleur ami un âne", hint: Q },

  // ── QUIZ (réponse cachée) — CULTURE G ─────────────────
  { type: "quiz", pack: "quiz", text: "Combien de pattes a une araignée ?", answer: "8", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quelle est la capitale de l'Australie ?", answer: "Canberra (pas Sydney !)", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quelle est la capitale du Canada ?", answer: "Ottawa", hint: Q },
  { type: "quiz", pack: "quiz", text: "Combien de cœurs a une pieuvre ?", answer: "3", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quel est le plus grand océan du monde ?", answer: "Le Pacifique", hint: Q },
  { type: "quiz", pack: "quiz", text: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?", answer: "1969", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quel est l'animal terrestre le plus rapide ?", answer: "Le guépard", hint: Q },
  { type: "quiz", pack: "quiz", text: "Combien d'os a un adulte, à 10 près ?", answer: "206", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quelle planète est la plus proche du Soleil ?", answer: "Mercure", hint: Q },
  { type: "quiz", pack: "quiz", text: "Vrai ou faux : la tomate est un fruit.", answer: "Vrai", hint: Q },
  { type: "quiz", pack: "quiz", text: "Vrai ou faux : les poissons rouges n'ont que 3 secondes de mémoire.", answer: "Faux, ils se souviennent pendant des mois", hint: Q },
  { type: "quiz", pack: "quiz", text: "Vrai ou faux : on voit la Grande Muraille de Chine depuis l'espace à l'œil nu.", answer: "Faux", hint: Q },
  { type: "quiz", pack: "quiz", text: "Combien de minutes y a-t-il dans une journée ?", answer: "1 440", hint: Q },
  { type: "quiz", pack: "quiz", text: "Combien de zéros dans un milliard ?", answer: "9", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quelle est la somme de toutes les faces d'un dé à six faces ?", answer: "21", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quel est le plus long fleuve de France ?", answer: "La Loire", hint: Q },
  { type: "quiz", pack: "quiz", text: "Dans quel pays se trouve le Machu Picchu ?", answer: "Au Pérou", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quelle langue a le plus de locuteurs natifs au monde ?", answer: "Le chinois mandarin", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quel est le pays le plus peuplé du monde ?", answer: "L'Inde (devant la Chine depuis 2023)", hint: Q },
  { type: "quiz", pack: "quiz", text: "Combien de joueurs par équipe sur un terrain de rugby à XV ?", answer: "15", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quel est l'organe le plus grand du corps humain ?", answer: "La peau", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quel gaz les plantes rejettent-elles le jour ?", answer: "L'oxygène", hint: Q },
  { type: "quiz", pack: "quiz", text: "Combien de côtés a un hexagone ?", answer: "6", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quel est le symbole chimique de l'or ?", answer: "Au", hint: Q },
  { type: "quiz", pack: "quiz", text: "Quelle est la capitale du Japon ?", answer: "Tokyo", hint: "{p1} répond en 3 secondes chrono. Faux ou trop lent = peine." },

  // ── DÉFIS ─────────────────────────────────────────────
  { type: "defi", pack: "soft", text: "{p1}, fais le tour de la pièce en serrant la main de chacun comme un ministre en campagne.", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, fais un compliment à {p2}… avec une voix de robot.", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, joue une pub de parfum avec l'objet le plus proche.", hint: GV.replace("Le moins convaincant prend", "Pas convaincant ? {p1} prend") },
  { type: "defi", pack: "soft", text: "{p1}, fais un TED talk de 30 secondes sur la chaussette.", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, fais un tuto make-up sur {p2}… sans contact, juste en commentant.", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, fais le bruit d'un vieux modem qui se connecte à internet.", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, dis trois qualités sur toi sans rire.", hint: "Un sourire = raté = peine." },
  { type: "defi", pack: "soft", text: "{p1}, fais deviner un pays au groupe uniquement avec des bruits.", hint: "Personne ne trouve en 30 secondes ? Peine." },
  { type: "defi", pack: "soft", text: "{p1}, invente un cri de ralliement pour la soirée. Tout le monde le reprend.", hint: "Le dernier à le crier prend la peine." },
  { type: "defi", pack: "soft", text: "{p1}, parle 20 secondes de ton dernier repas sans dire « euh ».", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, garde un objet en équilibre sur ta tête pendant que le groupe compte jusqu'à 10.", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, explique les règles d'un sport que tu ne connais pas, avec l'assurance d'un expert.", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, raconte un film en trois phrases. Les autres devinent.", hint: "Personne ne trouve ? Peine." },
  { type: "defi", pack: "soft", text: "{p1}, prends un selfie de groupe où tout le monde fait sa tête la plus dramatique.", hint: "Le moins dramatique de la photo prend la peine." },
  { type: "defi", pack: "soft", text: "{p1}, fais le commentaire sportif de {p2} en train de se lever et de se rasseoir.", hint: DF },
  { type: "defi", pack: "soft", text: "{p1}, trouve trois mots qui commencent par Z en 5 secondes.", hint: DF },
  { type: "defi", pack: "pop", text: "{p1}, fais ta meilleure transformation d'anime, avec la musique faite à la bouche.", hint: GV.replace("Le moins convaincant prend", "Pas convaincant ? {p1} prend") },
  { type: "defi", pack: "pop", text: "{p1}, résume un manga ou une série comme si c'était un fait divers du JT.", hint: "Les autres devinent. Personne ne trouve ? Peine." },

  // ── MIMES ─────────────────────────────────────────────
  { type: "mime", pack: "soft", text: "{p1}, mime un métier soufflé à l'oreille par {p2}.", hint: M },
  { type: "mime", pack: "soft", text: "{p1}, mime un animal qui fait ses courses.", hint: "Les autres devinent l'animal. " + M.replace("Sans un mot ni un bruit. ", "") },
  { type: "mime", pack: "soft", text: "{p1}, mime une émotion compliquée : la jalousie, la honte ou la nostalgie.", hint: M },
  { type: "mime", pack: "soft", text: "{p1}, mime ce que tu fais un dimanche à 15 h.", hint: M },
  { type: "mime", pack: "soft", text: "{p1}, mime un sport olympique choisi par {p2}.", hint: M },
  { type: "mime", pack: "pop", text: "{p1}, mime un perso de manga célèbre.", hint: M },
  { type: "mime", pack: "pop", text: "{p1}, mime une chanson connue. Les autres trouvent le titre.", hint: M },
  { type: "mime", pack: "pop", text: "{p1}, mime un film Disney.", hint: M },
  { type: "mime", pack: "pop", text: "{p1}, mime un Pokémon.", hint: M },
  { type: "mime", pack: "pop", text: "{p1}, mime une série Netflix.", hint: M },
  { type: "mime", pack: "pop", text: "{p1}, mime un jeu vidéo.", hint: M },

  // ── CHANSONS ──────────────────────────────────────────
  { type: "chanson", pack: "pop", text: "{p1}, chante le refrain d'un générique de dessin animé.", hint: CH },
  { type: "chanson", pack: "pop", text: "{p1}, fredonne une chanson sans les paroles. Les autres devinent.", hint: "Personne ne trouve en 20 secondes ? {p1} prend la peine." },
  { type: "chanson", pack: "pop", text: "Chacun son tour, chantez une phrase de chanson qui contient le mot « amour ».", hint: "Le premier qui sèche perd." },
  { type: "chanson", pack: "pop", text: "Chacun son tour, chantez une phrase de chanson qui parle de la nuit.", hint: "Le premier qui sèche perd." },
  { type: "chanson", pack: "pop", text: "Chacun son tour, chantez une phrase d'une chanteuse française.", hint: "Le premier qui sèche perd." },
  { type: "chanson", pack: "pop", text: "Chacun son tour, fredonnez un générique de série. Les autres trouvent laquelle.", hint: "Celui dont personne ne trouve le générique prend la peine." },
  { type: "chanson", pack: "pop", text: "{p1}, chante le refrain d'un tube de l'été. Tout le monde reprend en chœur.", hint: "Personne ne reprend ? {p1} prend la peine." },
  { type: "chanson", pack: "pop", text: "{p1} commence une chanson, {p2} enchaîne la phrase suivante.", hint: "Celui qui bloque prend la peine." },
  { type: "chanson", pack: "pop", text: "{p1}, chante un opening d'anime. Le yaourt est autorisé.", hint: CH },
  { type: "chanson", pack: "pop", text: "{p1}, chante une chanson connue en remplaçant tous les mots par « miaou ».", hint: "Les autres devinent. Personne ne trouve ? Peine." },
  { type: "chanson", pack: "soft", text: "{p1}, chante « Joyeux anniversaire » comme une star de l'opéra.", hint: CH },
  { type: "chanson", pack: "soft", text: "{p1}, chante la météo de demain sur l'air d'un tube connu.", hint: CH },
  { type: "chanson", pack: "soft", text: "{p1}, transforme ta dernière phrase en final de comédie musicale.", hint: CH },

  // ── AVOUE… ────────────────────────────────────────────
  { type: "avoue", pack: "soft", text: "{p1}, avoue la série ou l'anime que tu regardes en cachette.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue la chanson honteuse que tu écoutes en boucle.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue le dernier mensonge que t'as dit.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue le truc le plus nul que t'as fait pour éviter quelqu'un.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue l'appli où tu passes le plus de temps. Temps d'écran à l'appui.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue ton plus gros craquage shopping.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue ta pire note à l'école, et dans quelle matière.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue un truc bizarre que tu fais quand t'es seul(e) chez toi.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue quel perso de dessin animé était ton premier crush.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue qui tu appellerais ici à 3 h du mat en cas de galère.", hint: AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue ce que tu as pensé de {p2} la première fois.", hint: "Avec tendresse. " + AV },
  { type: "avoue", pack: "soft", text: "{p1}, avoue la dernière chose que t'as googlée.", hint: AV },
  { type: "avoue", pack: "coquin", text: "{p1}, avoue ton crush du lycée (prénom ou initiale).", hint: AV },
  { type: "avoue", pack: "coquin", text: "{p1}, avoue ton type en trois mots.", hint: AV },
  { type: "avoue", pack: "coquin", text: "{p1}, avoue le pire message que t'as envoyé à un crush.", hint: AV },
  { type: "avoue", pack: "trash", text: "{p1}, avoue ta pire excuse pour ne pas venir à un truc.", hint: AV },
  { type: "avoue", pack: "trash", text: "{p1}, avoue le pire truc que t'as écrit dans un groupe privé (sans nom).", hint: AV },
  { type: "avoue", pack: "trash", text: "{p1}, avoue la soirée que tu regrettes le plus.", hint: AV },

  // ── COQUIN (suggestif, jamais explicite) ──────────────
  { type: "coquin", pack: "coquin", text: "Ton plus beau râteau, raconté en 20 secondes.", hint: "Le lecteur désigne qui raconte. Refus = gage." },
  { type: "coquin", pack: "coquin", text: "Décris ton date idéal uniquement avec des emojis, à voix haute.", hint: "Tour de table. Le plus nul prend la peine." },
  { type: "coquin", pack: "coquin", text: "Trouve un surnom mignon pour chaque personne ici.", hint: "Le lecteur désigne qui s'y colle. Un blanc = peine." },
  { type: "coquin", pack: "coquin", text: "La phrase de drague la plus nulle que tu connais, avec le ton.", hint: "Tour de table. Le groupe vote pour la moins drôle : peine." },
  { type: "coquin", pack: "coquin", text: "{p1}, fais ta déclaration la plus romantique… au canapé.", hint: "Pas convaincant ? Peine." },

  // ── JOKERS ────────────────────────────────────────────
  { type: "joker", pack: "soft", joker: "clear", text: "LIBÉRATION — La règle en cours est levée. Respirez.", hint: "Effet immédiat." },
  { type: "joker", pack: "soft", joker: "none", text: "PAUSE EAU — Tout le monde boit un verre d'eau. Aucune peine sur cette carte.", hint: "Hydratation, c'est la base." },
  { type: "joker", pack: "soft", joker: "none", text: "TOURNÉE DE COMPLIMENTS — Chacun fait un compliment sincère à son voisin de gauche.", hint: "Aucune peine sur cette carte." },
  { type: "joker", pack: "soft", joker: "shield", text: "ANGE GARDIEN — Le lecteur offre un bouclier à la personne de son choix.", hint: "Le bouclier s'affiche à côté de son nom." },
  { type: "joker", pack: "pop", joker: "pick", text: "VENGEANCE — Celui qui a le plus de peines choisit qui prend la suivante.", hint: "Le compteur décide qui a le pouvoir." },
];

/** Cartes françaises (référence : EN / ES suivent le même ordre et la même structure). */
export const PICOLETTE_CARDS: PicoletteCard[] = [...BASE_CARDS, ...MORE_CARDS];

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
  "Propose un toast de zinzin en l'honneur de quelqu'un.",
  "Fais deviner un film en mimant, sans un mot.",
  "Imite la sonnerie de ton réveil jusqu'à ce que quelqu'un rie.",
  "Joue la prochaine carte avec la voix d'un méchant de film.",
  "Invente le nom de ton futur groupe de musique et chante son tube 10 secondes.",
];

// ── Langues ─────────────────────────────────────────────────
// La langue est lue au moment de construire le paquet (début de partie / rebattage).
const CARDS: I18n<PicoletteCard[]> = { fr: PICOLETTE_CARDS, en: CARDS_EN, es: CARDS_ES };
const GAGES_ALL: I18n<string[]> = { fr: GAGES, en: GAGES_EN, es: GAGES_ES };

/** Toutes les cartes dans la langue demandée (par défaut : langue courante). */
export function cardsFor(lang: Lang = getLang()): PicoletteCard[] {
  return CARDS[lang] ?? PICOLETTE_CARDS;
}

/** Gages de la roulette dans la langue demandée. */
export function gagesFor(lang: Lang = getLang()): string[] {
  return GAGES_ALL[lang] ?? GAGES;
}

export function filterDeck(packs: Set<Pack>, lang: Lang = getLang()): PicoletteCard[] {
  return cardsFor(lang).filter((c) => packs.has(c.pack));
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
  quiz:    { emoji: "🧠", label: "Quiz",    sub: "Culture G, devinettes et tours de table",  tint: "#3DDC97" },
  pop:     { emoji: "📺", label: "Culture pop", sub: "Mangas, séries, chanteuses, années 2000", tint: "#FF6B5B" },
  coquin:  { emoji: "🔥", label: "Coquin",  sub: "18+ · séduction et confidences, rien d'explicite", tint: "#FF3EA5", adult: true },
  trash:   { emoji: "💀", label: "Trash",   sub: "18+ · gros aveux, questions piquantes",    tint: "#7A4EE8", adult: true },
};

const PACK_TEXT: I18n<Record<Pack, { label: string; sub: string }>> = { fr: PACK_INFO, en: PACK_TEXT_EN, es: PACK_TEXT_ES };

/** Infos des packs (libellés traduits, couleurs et emoji communs). */
export function packInfoFor(lang: Lang = getLang()): Record<Pack, { emoji: string; label: string; sub: string; tint: string; adult?: boolean }> {
  const txt = PACK_TEXT[lang] ?? PACK_INFO;
  return Object.fromEntries((Object.keys(PACK_INFO) as Pack[]).map((p) => [p, { ...PACK_INFO[p], ...txt[p] }])) as typeof PACK_INFO;
}

export const TYPE_INFO: Record<PicoletteType, { emoji: string; label: string; tint: string }> = {
  vote:    { emoji: "🗳️",  label: "Vote groupe",        tint: "#FF6B5B" },
  table:   { emoji: "🎤",  label: "Tour de table",      tint: "#3DDC97" },
  rule:    { emoji: "📝",  label: "Règle live",         tint: "#C58CFF" },
  prefere: { emoji: "🪙",  label: "Tu préfères",        tint: "#FF8C42" },
  valise:  { emoji: "🧳",  label: "Dans ma valise…",    tint: "#3DDC97" },
  coquin:  { emoji: "💋",  label: "Confidences 18+",    tint: "#FF3EA5" },
  joker:   { emoji: "🃏",  label: "Joker",              tint: "#7A4EE8" },
  quiz:    { emoji: "❓",  label: "Quiz",               tint: "#FFFFFF" },
  duel:    { emoji: "⚔️",  label: "Duel",               tint: "#FF3EA5" },
  jamais:  { emoji: "✋",  label: "Je n'ai jamais",     tint: "#FFD23F" },
  defi:    { emoji: "⚡",  label: "Défi",               tint: "#FF6B5B" },
  mime:    { emoji: "🤫",  label: "Mime",               tint: "#4ECDC4" },
  chanson: { emoji: "🎵",  label: "Chanson",            tint: "#3DDC97" },
  avoue:   { emoji: "👀",  label: "Avoue…",             tint: "#FFF6E5" },
};

const TYPE_LABEL: I18n<Record<PicoletteType, string> | null> = { fr: null, en: TYPE_LABEL_EN, es: TYPE_LABEL_ES };

/** Infos des types de carte (libellé traduit). */
export function typeInfoFor(lang: Lang = getLang()): Record<PicoletteType, { emoji: string; label: string; tint: string }> {
  const labels = TYPE_LABEL[lang];
  if (!labels) return TYPE_INFO;
  return Object.fromEntries((Object.keys(TYPE_INFO) as PicoletteType[]).map((t) => [t, { ...TYPE_INFO[t], label: labels[t] }])) as typeof TYPE_INFO;
}
