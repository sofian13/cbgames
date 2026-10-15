import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FastForward } from "lucide-react";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { colorForIndex } from "@/components/games/local-kit";
import { type I18n, type Lang, pick, useLang } from "@/lib/i18n";
import { playCombo, playSfx } from "@/lib/sfx";
import { getZGame } from "../catalog";
import type { ZGameId } from "../catalog-text";
import { computeTrophies, finishCeremony, type SoireeState, type Trophy, type TrophyId } from "../soiree";
import { ZBlob, ZPALETTE } from "./ZBlob";
import { BandBlob } from "./BandBlob";
import { BigBtn, Tag, useTapReady } from "./common";
import { DiscoBall, SoireeStyles } from "./SoireeKit";
import { gameInfo, haptic, reducedMotion } from "./util";

/**
 * Cérémonie des prix de fin de Soirée Zinzin : chaque perso repart avec UN prix,
 * calculé dans soiree.ts sur ce qui a été mesuré. Un prix à la fois (roulement de tambour →
 * révélation), le Roi en avant-dernier, le Plus Gros Naze en grand final.
 */

/* ───────── Textes ───────── */
/** Un titre et sa petite vanne (plusieurs variantes par prix, tirées au hasard mais stables pour une soirée). */
type V = [title: string, quip: string];

type TStr = {
  ceremony: string;
  ceremonySub: (n: number) => string;
  start: string;
  skip: string;
  /** Bouton « Passer » visible pendant les prix → récap direct */
  skipShort: string;
  of: (i: number, n: number) => string;
  andTheWinner: string;
  tapNext: string;
  last: string;
  recapTitle: string;
  suggested: string;
  /** Liste de jeux : « Le Bluffeur + La Patate » */
  join: string;
  /** Les faits mesurés, affichés sous le prénom */
  fact: {
    won: (games: string) => string;
    second: (games: string) => string;
    cascadeur: (games: string) => string;
    touriste: (n: number) => string;
    nazeAll: (n: number) => string;
    nazeLoss: (n: number) => string;
    comeback: (lost: string, won: string) => string;
  };
  prizes: Record<Exclude<TrophyId, "game">, V[]>;
  games: Record<ZGameId, V[]>;
};

const plFr = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

export const TROPHY_STR: I18n<TStr> = {
  fr: {
    ceremony: "La remise des prix",
    ceremonySub: (n) => `${plFr(n, "prix", "prix")} à remettre, un par perso. Calculés sur ce qui s'est vraiment passé ce soir.`,
    start: "Ouvrir les enveloppes",
    skip: "Passer la cérémonie",
    skipShort: "Passer",
    of: (i, n) => `Prix ${i}/${n}`,
    andTheWinner: "Et le prix revient à…",
    tapNext: "Touche pour la suite",
    last: "Voir tous les prix",
    recapTitle: "Le palmarès de la soirée",
    suggested: "Proposé par le jeu : vérifiez avant de valider.",
    join: " + ",
    fact: {
      won: (g) => `A gagné ${g}`,
      second: (g) => `2e à ${g}`,
      cascadeur: (g) => `Dernier à ${g}`,
      touriste: (n) => `${plFr(n, "jeu joué", "jeux joués")}, 0 victoire`,
      nazeAll: (n) => `0 victoire sur ${plFr(n, "jeu", "jeux")}`,
      nazeLoss: (n) => `${plFr(n, "défaite", "défaites")} ce soir`,
      comeback: (l, w) => `Dernier à ${l}, puis vainqueur à ${w}`,
    },
    prizes: {
      king: [
        ["Le Roi de la soirée", "Prosternez-vous. Ou au moins applaudissez."],
        ["Le Roi de la soirée", "Couronne méritée, ego à surveiller."],
        ["Le Roi de la soirée", "Il ne va plus jamais nous laisser oublier ça."],
      ],
      naze: [
        ["Le Plus Gros Naze", "Il a tout donné. Littéralement tout."],
        ["Le Plus Gros Naze", "Champion du cœur, zéro au tableau."],
        ["Le Plus Gros Naze", "Perdre avec autant de constance, c'est presque un talent."],
        ["Le Plus Gros Naze", "La prochaine fois, c'est la bonne. Sûrement."],
      ],
      comeback: [
        ["Le Revenant", "Donné pour mort, revenu pour gagner."],
        ["Le Phénix", "Tombé au fond du trou, ressorti avec un trophée."],
      ],
      second: [
        ["Toujours deuxième, jamais premier", "Si près du but. Comme d'habitude."],
        ["La Médaille en chocolat", "Le podium, mais vu d'un peu loin."],
        ["Le Dauphin officiel", "Le premier des perdants, et fier de l'être."],
      ],
      cascadeur: [
        ["Le Cascadeur", "A pris les coups pour toute la bande. Merci."],
        ["Le Crash-Test", "Il fallait bien que quelqu'un essuie les plâtres."],
        ["Le Paratonnerre", "Toute la poisse de la soirée est tombée sur lui."],
      ],
      touriste: [
        ["Le Touriste", "Venu pour l'ambiance, reparti avec l'ambiance."],
        ["Le Figurant de luxe", "Indispensable au décor."],
        ["L'Observateur", "Il prenait des notes. Méfiez-vous la prochaine fois."],
      ],
    },
    games: {
      undercover: [["L'Insaisissable", "Personne ne l'a vu venir. Personne."], ["Le Caméléon", "Se fond dans la masse comme personne."]],
      "faux-temoin": [["L'Œil de Lynx", "Un mensonge ? Il l'a senti à trois mètres."], ["Le Détecteur de mytho", "Bip bip bip : menteur repéré."]],
      "loup-garou": [["Le Loup Solitaire", "Il a gagné la nuit. Louche, très louche."], ["Le Survivant de la pleine lune", "Plus malin que tout le village."]],
      "le-bluffeur": [["Le Requin du Bluff", "Ment avec un aplomb franchement inquiétant."], ["Le Poker Face", "Même sa mère n'y voit que du feu."]],
      patate: [["Le Démineur", "Des nerfs d'acier et des mains de magicien."], ["Les Mains de Velours", "La patate chaude ? Connaît pas."]],
      "lache-pas": [["La Poigne de Fer", "N'a rien lâché. Rien du tout."], ["Le Pot de Colle", "Accroché jusqu'au bout, comme à sa soirée."]],
      "pile-poil": [["L'Horloge Suisse", "Précis à la milliseconde. Flippant."], ["Le Métronome", "Le timing parfait, sauf pour rentrer chez lui."]],
      verre: [["La Main Sûre", "Pas une goutte à côté. Chirurgien ?"], ["Le Funambule", "Équilibre parfait, sang-froid total."]],
      chut: [["Le Sphinx", "Impassible. On a vérifié qu'il respirait."], ["Le Moine Zen", "Rien ne le fait craquer. Rien."]],
      "make-guess": [["Le Comédien", "Un geste, une grimace, et c'est plié."], ["La Star du mime", "Hollywood a appelé, il était occupé."]],
      "guess-word": [["Le Dico Vivant", "A un mot pour tout. Même pour ça."], ["Le Roi du Mot", "Trouve le mot avant qu'on l'ait dit."]],
      "code-names": [["L'Agent Secret", "Mission accomplie, en toute discrétion."], ["Le Maître Espion", "Ses indices ? Du grand art."]],
      "longueur-onde": [["Le Télépathe", "Lit dans vos pensées. C'est gênant."], ["Le Radar", "Toujours sur la bonne fréquence."]],
      "category-chrono": [["La Fusée", "Plus rapide que son ombre."], ["Le Cerveau Turbo", "Une réponse avant la fin de la question."]],
      "top-ten": [["Le Cerveau", "Tout était calculé. Évidemment."], ["Le Stratège", "Un plan, toujours un plan."]],
      "tu-prefere": [["L'Âme de la bande", "Pile dans l'esprit du groupe."], ["Le Baromètre", "Il sent la table mieux que personne."]],
      purete: [["L'Ange (ou presque)", "Une auréole… légèrement de travers."], ["Le Saint de la soirée", "Ou alors il cache bien son jeu."]],
      picolette: [["L'Increvable", "Encore debout à la fin de la tournée."], ["Le Survivant de la Tournée", "La chance était de son côté ce soir."]],
      tgv: [["Le Conducteur Fou", "Ce train, c'est lui qui le conduit."], ["Le Chef de Gare", "Tout le monde descend, sauf lui."]],
      "pensez-pareil": [["Le Jumeau Cosmique", "Même cerveau, deux corps."], ["La Connexion Wi-Fi", "Synchronisé à 100 %, sans fil."]],
      "couple-quiz": [["Le Fin Connaisseur", "Te connaît par cœur. Un peu trop."], ["L'Archiviste", "Il se souvient de tout. De TOUT."]],
    },
  },
  en: {
    ceremony: "The awards ceremony",
    ceremonySub: (n) => `${n} awards to hand out, one each. Based on what really happened tonight.`,
    start: "Open the envelopes",
    skip: "Skip the ceremony",
    skipShort: "Skip",
    of: (i, n) => `Award ${i}/${n}`,
    andTheWinner: "And the award goes to…",
    tapNext: "Tap to continue",
    last: "See all the awards",
    recapTitle: "Tonight's hall of fame",
    suggested: "Suggested by the game: check before confirming.",
    join: " + ",
    fact: {
      won: (g) => `Won ${g}`,
      second: (g) => `2nd in ${g}`,
      cascadeur: (g) => `Last in ${g}`,
      touriste: (n) => `${n} game${n > 1 ? "s" : ""} played, 0 wins`,
      nazeAll: (n) => `0 wins in ${n} game${n > 1 ? "s" : ""}`,
      nazeLoss: (n) => `${n} loss${n > 1 ? "es" : ""} tonight`,
      comeback: (l, w) => `Last in ${l}, then won ${w}`,
    },
    prizes: {
      king: [
        ["King of the night", "Bow down. Or at least clap."],
        ["King of the night", "Crown earned. Ego: keep an eye on it."],
        ["King of the night", "We'll never hear the end of this."],
      ],
      naze: [
        ["The Grand Flop", "Gave it everything. And we mean everything."],
        ["The Grand Flop", "Winner of hearts, zero on the scoreboard."],
        ["The Grand Flop", "Losing this consistently is almost a skill."],
        ["The Grand Flop", "Next time's the one. Probably."],
      ],
      comeback: [
        ["The Comeback Kid", "Written off, then came back swinging."],
        ["The Phoenix", "Hit rock bottom, rose with a trophy."],
      ],
      second: [
        ["Always the Bridesmaid", "So close. As usual."],
        ["The Chocolate Medal", "On the podium… seen from a distance."],
        ["Official Runner-Up", "First of the losers, and proud of it."],
      ],
      cascadeur: [
        ["The Stunt Double", "Took the hits for the whole crew. Thank you."],
        ["The Crash Test Dummy", "Someone had to go first."],
        ["The Lightning Rod", "All the bad luck of the night landed right here."],
      ],
      touriste: [
        ["The Tourist", "Came for the vibes, left with the vibes."],
        ["Deluxe Extra", "Essential to the scenery."],
        ["The Observer", "Was taking notes. Watch out next time."],
      ],
    },
    games: {
      undercover: [["The Untouchable", "Nobody saw it coming. Nobody."], ["The Chameleon", "Blends in like no one else."]],
      "faux-temoin": [["Eagle Eye", "A lie? Smelled it from across the room."], ["Human Lie Detector", "Beep beep beep: fibber spotted."]],
      "loup-garou": [["The Lone Wolf", "Won the night. Suspicious. Very suspicious."], ["Full Moon Survivor", "Smarter than the whole village."]],
      "le-bluffeur": [["The Bluff Shark", "Lies with genuinely worrying confidence."], ["Poker Face", "Not even their mum could tell."]],
      patate: [["Bomb Squad", "Nerves of steel, magician's hands."], ["Velvet Hands", "Hot potato? Never heard of it."]],
      "lache-pas": [["The Iron Grip", "Never let go. Not once."], ["The Limpet", "Hung on to the end."]],
      "pile-poil": [["The Swiss Watch", "Accurate to the millisecond. Creepy."], ["The Metronome", "Perfect timing, every single time."]],
      verre: [["The Steady Hand", "Not a drop spilled. Surgeon, maybe?"], ["The Tightrope Walker", "Perfect balance, ice-cold nerves."]],
      chut: [["The Sphinx", "Unshakeable. We checked they were breathing."], ["The Zen Monk", "Nothing cracks them. Nothing."]],
      "make-guess": [["The Performer", "One gesture, one face, done."], ["Mime Superstar", "Hollywood called. They were busy."]],
      "guess-word": [["The Walking Dictionary", "Has a word for everything. Even that."], ["Word Wizard", "Finds the word before you say it."]],
      "code-names": [["The Secret Agent", "Mission accomplished, very quietly."], ["The Spymaster", "Those clues? Pure art."]],
      "longueur-onde": [["The Mind Reader", "Reads your thoughts. It's awkward."], ["The Radar", "Always on the right wavelength."]],
      "category-chrono": [["The Rocket", "Faster than their own shadow."], ["Turbo Brain", "Answers before the question ends."]],
      "top-ten": [["The Brain", "It was all calculated. Obviously."], ["The Strategist", "Always a plan. Always."]],
      "tu-prefere": [["Heart of the Crew", "Perfectly in tune with the group."], ["The Vibe Check", "Reads the table better than anyone."]],
      purete: [["The (Almost) Angel", "A halo… slightly crooked."], ["Saint of the Night", "Or just very good at hiding it."]],
      picolette: [["The Unstoppable", "Still standing at the end of the round."], ["Lucky Survivor", "Luck was on their side tonight."]],
      tgv: [["The Mad Driver", "This train? They're driving it."], ["The Stationmaster", "Everybody off, except them."]],
      "pensez-pareil": [["The Cosmic Twin", "Same brain, two bodies."], ["Wi-Fi Connection", "100% in sync, no cables."]],
      "couple-quiz": [["The Expert", "Knows you by heart. A bit too well."], ["The Archivist", "Remembers everything. EVERYTHING."]],
    },
  },
  es: {
    ceremony: "La entrega de premios",
    ceremonySub: (n) => `${n} premio${n > 1 ? "s" : ""} por entregar, uno para cada uno. Según lo que de verdad pasó esta noche.`,
    start: "Abrir los sobres",
    skip: "Saltar la ceremonia",
    skipShort: "Saltar",
    of: (i, n) => `Premio ${i}/${n}`,
    andTheWinner: "Y el premio es para…",
    tapNext: "Toca para seguir",
    last: "Ver todos los premios",
    recapTitle: "El palmarés de la noche",
    suggested: "Propuesto por el juego: comprobadlo antes de validar.",
    join: " + ",
    fact: {
      won: (g) => `Ganó ${g}`,
      second: (g) => `2.º en ${g}`,
      cascadeur: (g) => `Último en ${g}`,
      touriste: (n) => `${n} juego${n > 1 ? "s" : ""}, 0 victorias`,
      nazeAll: (n) => `0 victorias en ${n} juego${n > 1 ? "s" : ""}`,
      nazeLoss: (n) => `${n} derrota${n > 1 ? "s" : ""} esta noche`,
      comeback: (l, w) => `Último en ${l}, luego ganó ${w}`,
    },
    prizes: {
      king: [
        ["El Rey de la noche", "Arrodillaos. O por lo menos aplaudid."],
        ["El Rey de la noche", "Corona merecida. El ego, vigiladlo."],
        ["El Rey de la noche", "No nos lo va a dejar olvidar nunca."],
      ],
      naze: [
        ["El Más Paquete", "Lo dio todo. Pero todo, todo."],
        ["El Más Paquete", "Campeón de corazón, cero en el marcador."],
        ["El Más Paquete", "Perder con tanta constancia casi es un don."],
        ["El Más Paquete", "La próxima es la buena. Seguro. Bueno, quizá."],
      ],
      comeback: [
        ["El Resucitado", "Lo dábamos por muerto y volvió para ganar."],
        ["El Ave Fénix", "Tocó fondo y salió con un trofeo."],
      ],
      second: [
        ["Siempre segundo, nunca primero", "Tan cerca… como siempre."],
        ["La Medalla de chocolate", "El podio, pero visto de lejos."],
        ["El Eterno Aspirante", "El primero de los perdedores, y con orgullo."],
      ],
      cascadeur: [
        ["El Doble de Riesgo", "Se comió los golpes de todo el grupo. Gracias."],
        ["El Muñeco de Pruebas", "Alguien tenía que estrenarse."],
        ["El Pararrayos", "Toda la mala suerte de la noche cayó aquí."],
      ],
      touriste: [
        ["El Turista", "Vino por el ambiente y se fue con el ambiente."],
        ["El Extra de lujo", "Imprescindible para el decorado."],
        ["El Observador", "Estaba tomando notas. Cuidado la próxima vez."],
      ],
    },
    games: {
      undercover: [["El Inalcanzable", "Nadie lo vio venir. Nadie."], ["El Camaleón", "Se camufla como nadie."]],
      "faux-temoin": [["Ojo de Lince", "¿Una mentira? La olió desde la otra punta."], ["El Detector de Trolas", "Bip bip bip: mentiroso localizado."]],
      "loup-garou": [["El Lobo Solitario", "Ganó la noche. Sospechoso, muy sospechoso."], ["Superviviente de la luna llena", "Más listo que todo el pueblo."]],
      "le-bluffeur": [["El Tiburón del Farol", "Miente con un aplomo preocupante."], ["Cara de Póker", "Ni su madre lo pillaría."]],
      patate: [["El Artificiero", "Nervios de acero y manos de mago."], ["Manos de Seda", "¿La patata caliente? Ni idea."]],
      "lache-pas": [["Mano de Hierro", "No soltó nada. Nada de nada."], ["La Lapa", "Agarrado hasta el final."]],
      "pile-poil": [["El Reloj Suizo", "Preciso al milisegundo. Da miedo."], ["El Metrónomo", "Timing perfecto, siempre."]],
      verre: [["Pulso de Cirujano", "Ni una gota fuera. ¿Es médico?"], ["El Equilibrista", "Equilibrio perfecto, sangre fría total."]],
      chut: [["La Esfinge", "Impasible. Comprobamos que respiraba."], ["El Monje Zen", "Nada lo hace reír. Nada."]],
      "make-guess": [["El Showman", "Un gesto, una mueca y listo."], ["La Estrella del mimo", "Hollywood llamó; estaba ocupado."]],
      "guess-word": [["El Diccionario Andante", "Tiene palabras para todo. Hasta para eso."], ["El Rey de las Palabras", "Encuentra la palabra antes de que la digas."]],
      "code-names": [["El Agente Secreto", "Misión cumplida, con total discreción."], ["El Maestro Espía", "¿Sus pistas? Puro arte."]],
      "longueur-onde": [["El Telépata", "Te lee la mente. Qué incómodo."], ["El Radar", "Siempre en la misma onda."]],
      "category-chrono": [["El Cohete", "Más rápido que su sombra."], ["Cerebro Turbo", "Responde antes de que acabe la pregunta."]],
      "top-ten": [["El Cerebro", "Todo calculado. Obviamente."], ["El Estratega", "Siempre tiene un plan."]],
      "tu-prefere": [["El Alma del Grupo", "En sintonía total con la mesa."], ["El Termómetro", "Lee a la mesa mejor que nadie."]],
      purete: [["El Ángel (o casi)", "Una aureola… algo torcida."], ["El Santo de la noche", "O lo esconde muy bien."]],
      picolette: [["El Incansable", "Sigue en pie al final de la ronda."], ["El Superviviente", "La suerte estuvo de su lado."]],
      tgv: [["El Maquinista Loco", "Este tren lo conduce él."], ["El Jefe de Estación", "Todos abajo, menos él."]],
      "pensez-pareil": [["El Gemelo Cósmico", "Mismo cerebro, dos cuerpos."], ["Conexión Wi-Fi", "Sincronizados al 100 %, sin cables."]],
      "couple-quiz": [["El Gran Conocedor", "Te conoce de memoria. Demasiado."], ["El Archivista", "Lo recuerda todo. TODO."]],
    },
  },
};

const gameName = (id: ZGameId | undefined, lang: Lang) => {
  const g = id ? getZGame(id) : undefined;
  return g ? gameInfo(g, lang).name : "";
};

/** Titre, fait mesuré et vanne d'un prix. */
export function trophyText(t: Trophy, lang: Lang): { name: string; fact: string; quip: string } {
  const s = pick(TROPHY_STR, lang);
  const list = (ids: ZGameId[] | undefined) => (ids ?? []).map((id) => gameName(id, lang)).join(s.join);
  const variants = t.id === "game" ? (t.game ? s.games[t.game] : undefined) ?? s.prizes.touriste : s.prizes[t.id];
  const [name, quip] = variants[t.v % variants.length];
  const fact =
    t.id === "king" || t.id === "game" ? s.fact.won(t.id === "king" || t.games?.length ? list(t.games) : gameName(t.game, lang))
      : t.id === "naze" ? (t.allLost ? s.fact.nazeAll(t.n ?? 0) : s.fact.nazeLoss(t.n ?? 0))
        : t.id === "comeback" ? s.fact.comeback(gameName(t.lostGame, lang), gameName(t.game, lang))
          : t.id === "second" ? s.fact.second(list(t.games))
            : t.id === "cascadeur" ? s.fact.cascadeur(list(t.games))
              : s.fact.touriste(t.n ?? 0);
  return { name, fact, quip };
}

/** Les prix de la soirée (un par perso), dans l'ordre de la cérémonie. */
export function allTrophies(s: SoireeState): Trophy[] {
  return computeTrophies(s);
}

/* ───────── Sticker de prix (SVG maison, DA sticker) ───────── */
const BADGE: Record<TrophyId, { bg: string; light?: boolean; d: ReactNode }> = {
  king: { bg: "#FFD23F", d: <path d="M3 17 L2 7 L7.5 11 L12 4 L16.5 11 L22 7 L21 17Z" /> },
  naze: {
    bg: "#B8B0DD",
    d: <><circle cx="12" cy="12" r="8.5" /><circle cx="9" cy="10.5" r="1.3" fill="#15082E" stroke="none" /><circle cx="15" cy="10.5" r="1.3" fill="#15082E" stroke="none" /><path d="M8.5 16.5 C10 14.6 14 14.6 15.5 16.5" fill="none" /><path d="M16.6 12.6 C17.4 14 16.4 15 16 15 C15.4 15 14.9 14 16.6 12.6Z" fill="#4ECDC4" /></>,
  },
  game: { bg: "#FF3EA5", d: <path d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z" fill="#FFD23F" /> },
  comeback: { bg: "#3DDC97", d: <path d="M12 3 L20 12 H15 V21 H9 V12 H4Z" /> },
  second: { bg: "#fff", d: <text x="12" y="18.5" textAnchor="middle" fontSize="17" fontWeight={800} fill="#15082E" stroke="none" fontFamily="var(--font-display), system-ui">2</text> },
  cascadeur: { bg: "#FF6B5B", d: <path d="M13.5 2L5 13.5h6L9.5 22 19 9.5h-6z" fill="#FFD23F" /> },
  touriste: { bg: "#4ECDC4", d: <><rect x="3.5" y="8" width="17" height="11" rx="2.5" /><path d="M8.5 8 L10 5.5 H14 L15.5 8" /><circle cx="12" cy="13.5" r="3.2" fill="#4ECDC4" /></> },
};

/** Coupe (dorée ; en fer-blanc cabossé pour le Plus Gros Naze) + pastille de l'emblème. */
export function TrophyCup({ id, size = 120 }: { id: TrophyId; size?: number }) {
  const b = BADGE[id];
  const tin = id === "naze";
  const metal = tin ? "#C9C3E3" : "#FFD23F";
  return (
    <svg width={size} height={size} viewBox="-6 -6 132 132" aria-hidden style={{ display: "block", overflow: "visible" }}>
      <g stroke="#15082E" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" transform={tin ? "rotate(-8 60 116)" : undefined}>
        {/* Ombre décalée */}
        <path d="M26 16 H94 V46 C94 74 78 86 60 86 C42 86 26 74 26 46Z M52 84 H68 V100 H52Z M32 100 H88 V116 H32Z" fill="#15082E" transform="translate(0 6)" />
        <path d={tin ? "M26 26 C4 26 4 58 34 66" : "M26 26 C4 26 4 58 34 66 M94 26 C116 26 116 58 86 66"} fill="none" strokeWidth={6.5} />
        <path d="M52 84 H68 V100 H52Z" fill={metal} />
        <path d="M32 100 H88 V116 H32Z" fill={metal} />
        <path d={tin ? "M26 16 H94 V46 C94 74 78 86 60 86 C42 86 26 74 26 46 L32 40 L26 34Z" : "M26 16 H94 V46 C94 74 78 86 60 86 C42 86 26 74 26 46Z"} fill={metal} />
        <path d="M37 24 h8 v26 c0 6 -4 8 -8 4z" fill="#fff" opacity={0.6} stroke="none" />
        {/* Anse cassée qui pend */}
        {tin && <path d="M94 30 C104 34 106 48 100 58" fill="none" strokeWidth={6.5} />}
      </g>
      {/* Emblème */}
      <g transform="translate(60 48)">
        <circle r={21} fill={b.bg} stroke="#15082E" strokeWidth={4} />
        <g transform="translate(-13.2 -13.2) scale(1.1)" stroke="#15082E" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" fill="#fff">
          {b.d}
        </g>
      </g>
      {/* Paillettes (pas pour le Naze : une petite mouche à la place) */}
      {tin ? (
        <g className="zzs-spark"><circle cx="108" cy="14" r="3.4" fill="#15082E" /><ellipse cx="105" cy="10" rx="3" ry="2" fill="#fff" stroke="#15082E" strokeWidth={1.4} /><ellipse cx="111" cy="10" rx="3" ry="2" fill="#fff" stroke="#15082E" strokeWidth={1.4} /></g>
      ) : (
        <>
          <path className="zzs-spark" d="M108 6 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#fff" stroke="#15082E" strokeWidth={2} strokeLinejoin="round" />
          <path className="zzs-spark" style={{ animationDelay: "0.7s" }} d="M8 74 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#A4F2CC" stroke="#15082E" strokeWidth={1.8} strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/** Animations de la cérémonie (coupées par prefers-reduced-motion). */
function CeremonyStyles() {
  return (
    <style>{`
.zzc-shake { animation: zzc-shake 0.42s ease-in-out infinite; transform-origin: 50% 90%; }
@keyframes zzc-shake { 0%, 100% { transform: rotate(-5deg) translateY(0); } 50% { transform: rotate(5deg) translateY(-6px); } }
.zzc-pop { animation: zzc-pop 0.62s cubic-bezier(.2,1.6,.4,1) both; }
@keyframes zzc-pop { 0% { transform: scale(0.2) rotate(-12deg); opacity: 0; } 100% { transform: scale(1) rotate(0); opacity: 1; } }
.zzc-in { animation: zzc-in 0.45s ease-out both; }
@keyframes zzc-in { from { transform: translateY(14px); opacity: 0; } to { transform: none; opacity: 1; } }
.zzc-glow { animation: zzc-glow 2.4s linear infinite; }
@keyframes zzc-glow { to { transform: rotate(360deg); } }
.zzc-slump { animation: zzc-slump 1.6s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes zzc-slump { 0%, 100% { transform: rotate(-4deg) scale(1.02, 0.96); } 50% { transform: rotate(-7deg) scale(1.05, 0.92) translateY(4px); } }
@media (prefers-reduced-motion: reduce) {
  .zzc-shake, .zzc-pop, .zzc-in, .zzc-glow, .zzc-slump { animation: none !important; }
}
`}</style>
  );
}

/** Rayons de lumière derrière le perso révélé. */
function Rays({ color }: { color: string }) {
  return (
    <svg className="zzc-glow pointer-events-none absolute" width={340} height={340} viewBox="-50 -50 100 100" aria-hidden style={{ left: "50%", top: "50%", marginLeft: -170, marginTop: -170, opacity: 0.3 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M0 0 L-5 -50 L5 -50Z" fill={color} transform={`rotate(${i * 30})`} />
      ))}
    </svg>
  );
}

/** Petit nuage de pluie au-dessus du Plus Gros Naze. */
function RainCloud() {
  return (
    <svg className="zzc-in pointer-events-none absolute" width={120} height={86} viewBox="0 0 120 86" aria-hidden style={{ left: "50%", marginLeft: -60, top: -64 }}>
      <path d="M28 44 C12 44 10 22 28 22 C30 8 52 4 60 16 C70 6 92 10 90 26 C106 26 106 44 92 44Z" fill="#B8B0DD" stroke="#15082E" strokeWidth={4} strokeLinejoin="round" />
      {[34, 54, 74, 88].map((x, i) => (
        <path key={x} className="zzs-spark" style={{ animationDelay: `${i * 0.3}s` }} d={`M${x} 54 l-4 10`} stroke="#4ECDC4" strokeWidth={4} strokeLinecap="round" />
      ))}
    </svg>
  );
}

const colorOf = (s: SoireeState, name: string) => colorForIndex(Math.max(0, s.band.indexOf(name)));

/* ───────── La cérémonie ───────── */
export function Ceremony({ s }: { s: SoireeState }) {
  const lang = useLang();
  const t = pick(TROPHY_STR, lang);
  const trophies = useMemo(() => computeTrophies(s), [s]);
  // -1 = écran d'intro
  const [step, setStep] = useState(-1);
  const ready = useTapReady();
  const small = typeof window !== "undefined" && window.innerHeight < 700;

  const finish = () => { playSfx("whoosh", { volume: 0.6 }); finishCeremony(); };
  const next = () => { if (step + 1 < trophies.length) setStep(step + 1); else finish(); };

  return (
    <div className="zz-screen-in fixed inset-0 overflow-hidden" style={{ zIndex: 30, background: "radial-gradient(rgba(255,255,255,0.07) 1.4px, transparent 1.6px) 0 0 / 22px 22px, #211052", color: "#fff" }}>
      <SoireeStyles />
      <CeremonyStyles />
      {step >= 0 && (
        // « Passer » bien lisible (texte + icône) : file directement au récap ; taper ailleurs = prix suivant
        <button
          type="button"
          onClick={() => { haptic(); finish(); }}
          aria-label={t.skip}
          className="zz-press fixed left-3 flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-extrabold"
          style={{ top: "calc(var(--sat) + 10px)", zIndex: 60, background: "#fff", color: "var(--zz-ink)", border: "2.5px solid var(--zz-ink)", boxShadow: "0 3px 0 var(--zz-ink)" }}
        >
          {t.skipShort} <FastForward size={16} strokeWidth={3} fill="currentColor" aria-hidden />
        </button>
      )}
      {step < 0 ? (
        <div className="zz-scroll absolute inset-0">
          <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center px-5 text-center" style={{ paddingTop: "calc(var(--sat) + 24px)", paddingBottom: "calc(var(--sab) + 16px)" }}>
            <div className="zzs-swing"><DiscoBall size={small ? 60 : 80} hang={small ? 16 : 34} /></div>
            <div className="zzc-pop mt-4"><TrophyCup id="king" size={small ? 104 : 150} /></div>
            <h1 className="zz-title mt-4" style={{ fontSize: "min(46px, 11vw)", lineHeight: 0.95 }}>{t.ceremony}</h1>
            <p className="mt-3 max-w-[330px] text-[16px] font-semibold leading-snug" style={{ color: "var(--zz-dim)" }}>{t.ceremonySub(trophies.length)}</p>
            <div className="mt-5 flex max-w-[340px] flex-wrap justify-center gap-1.5">
              {s.band.map((n, i) => (
                <div key={n} className="zzs-dance" style={{ animationDelay: `${i * 0.12}s` }}>
                  <BandBlob name={n} size={s.band.length > 6 ? 38 : 44} color={colorOf(s, n)} mood="happy" seed={i} outline shadow={false} wobble={false} hop={false} />
                </div>
              ))}
            </div>
            <div className="min-h-6 flex-1" />
            <BigBtn onClick={() => { if (!ready()) return; haptic("medium"); playSfx("confirm"); next(); }} bg="#FFD23F">{t.start}</BigBtn>
            <button type="button" onClick={() => { if (!ready()) return; haptic(); finish(); }} className="zz-tap mt-1 min-h-12 w-full text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ color: "var(--zz-dim)" }}>
              {t.skip}
            </button>
          </div>
        </div>
      ) : (
        <Reveal key={step} s={s} trophy={trophies[step]} index={step} total={trophies.length} onNext={next} last={step === trophies.length - 1} />
      )}
    </div>
  );
}

/** Un prix : roulement de tambour (perso mystère qui tremble) puis révélation. */
function Reveal({ s, trophy, index, total, onNext, last }: {
  s: SoireeState; trophy: Trophy; index: number; total: number; onNext: () => void; last: boolean;
}) {
  const lang = useLang();
  const t = pick(TROPHY_STR, lang);
  const txt = trophyText(trophy, lang);
  const naze = trophy.id === "naze";
  const king = trophy.id === "king";
  const [revealed, setRevealed] = useState(false);
  const [reduce] = useState(reducedMotion);
  const col = colorOf(s, trophy.name);
  const pal = ZPALETTE[col];
  const ready = useTapReady();
  // Petit écran (iPhone SE) : tout un peu plus petit
  const small = typeof window !== "undefined" && window.innerHeight < 700;

  useEffect(() => {
    // Plus de suspense pour les deux derniers (le Roi, puis le Naze)
    const roll = reduce ? 1 : king || naze ? 2.1 : 1.4;
    playSfx("whoosh", { volume: 0.5 });
    playCombo("drumroll", { duration: roll });
    const id = window.setTimeout(() => setRevealed(true), roll * 1000 + 80);
    return () => window.clearTimeout(id);
  }, [reduce, king, naze]);

  useEffect(() => {
    if (!revealed) return;
    haptic("success");
    if (naze) {
      // Grand final : « ooooh » compatissant, puis on applaudit quand même
      playCombo("fail");
      playSfx("crowd-aww", { volume: 0.6, delay: 0.2 });
      playSfx("applause", { volume: 0.4, delay: 1.3 });
    } else {
      playSfx("cymbal", { volume: 0.55 });
      playSfx("tada", { volume: 0.7, delay: 0.05 });
      playSfx(king ? "crowd-cheer" : "applause", { volume: king ? 0.5 : 0.35, delay: 0.25 });
    }
  }, [revealed, naze, king]);

  const tap = () => {
    if (!ready()) return;
    if (!revealed) { setRevealed(true); return; }
    haptic();
    onNext();
  };
  const blobSize = small ? 116 : 146;

  return (
    <button type="button" onClick={tap} className="absolute inset-0 block w-full text-left" style={{ WebkitTapHighlightColor: "transparent" }} aria-label={revealed ? `${txt.name} : ${trophy.name}. ${txt.quip} ${t.tapNext}` : txt.name}>
      {revealed && !reduce && <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}><ConfettiBurst count={naze ? 30 : king ? 90 : 55} /></div>}
      <div className="relative mx-auto flex h-full max-w-lg flex-col items-center px-5 text-center" style={{ zIndex: 2, paddingTop: "calc(var(--sat) + 18px)", paddingBottom: "calc(var(--sab) + 18px)" }}>
        <div className="flex w-full justify-end"><Tag bg="#fff" tilt={3}>{t.of(index + 1, total)}</Tag></div>
        <div className={revealed ? "zzc-pop" : "zzc-shake"} style={{ marginTop: small ? -6 : 4 }}>
          <TrophyCup id={trophy.id} size={small ? 88 : 116} />
        </div>
        <h1 className="zz-title mt-2 max-w-full" style={{ fontSize: txt.name.length > 22 ? "min(30px, 8vw)" : "min(40px, 10vw)", lineHeight: 0.98 }}>{txt.name}</h1>

        <div className="relative mt-3 flex flex-1 flex-col items-center justify-center" style={{ minHeight: small ? 150 : 210 }}>
          {revealed ? (
            <>
              {!naze && <Rays color={pal.hi} />}
              <div className="zzc-pop relative">
                {naze && <RainCloud />}
                <div className={naze ? "zzc-slump" : "zzs-dance"}>
                  <BandBlob name={trophy.name} size={blobSize} color={col} mood={naze ? "sad" : "laughing"} seed={index + 3} outline shadow={false} wobble={false} hop={false} crown={king} talk autoTalk talkDelay={naze ? 1400 : 500} />
                </div>
              </div>
            </>
          ) : (
            <div className="zzc-shake relative">
              <div style={{ filter: "brightness(0.2) saturate(0)" }}>
                <ZBlob size={blobSize} color="purple" mood="thinking" seed={index} outline shadow={false} wobble={false} hop={false} />
              </div>
              <span className="zz-title absolute inset-0 grid place-items-center text-[64px]" style={{ color: "#fff", textShadow: "3px 3px 0 #15082E" }}>?</span>
            </div>
          )}
        </div>

        <div style={{ minHeight: small ? 128 : 150 }} className="flex w-full flex-col items-center">
          {revealed ? (
            <div className="zzc-in flex w-full flex-col items-center">
              <span className="zz-stk zz-title inline-block max-w-full truncate rounded-full px-5 py-1.5" style={{ background: naze ? "#B8B0DD" : pal.body, color: naze ? "#15082E" : pal.ink, fontSize: trophy.name.length > 10 ? 28 : 36, rotate: "-2deg" }}>
                {trophy.name}
              </span>
              <p className="mt-2.5 text-[17px] font-bold leading-snug text-white">{txt.quip}</p>
              <p className="mt-1 text-[14px] font-bold leading-snug" style={{ color: "#FFD23F" }}>{txt.fact}</p>
              <p className="mt-2.5 text-[14px] font-bold" style={{ color: "var(--zz-dim)" }}>{last ? t.last : t.tapNext} →</p>
            </div>
          ) : (
            <p className="zz-title mt-2 text-[24px]" style={{ color: "var(--zz-dim)" }}>{t.andTheWinner}</p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ───────── Récap (écran de fin) ───────── */
export function TrophyList({ s, trophies }: { s: SoireeState; trophies: Trophy[] }) {
  const lang = useLang();
  return (
    <ol className="mt-5 flex flex-col gap-3">
      {trophies.map((tr, i) => {
        const txt = trophyText(tr, lang);
        const col = colorOf(s, tr.name);
        const king = tr.id === "king", naze = tr.id === "naze";
        return (
          <li
            key={`${tr.id}-${tr.name}`}
            className="zz-stk zz-rise relative flex items-center gap-2 rounded-[24px] py-2 pl-2 pr-3"
            style={{ background: king ? "#FFD23F" : naze ? "#D9D4F0" : "#fff", color: "var(--zz-ink)", rotate: `${i % 2 ? 0.8 : -0.8}deg`, ["--d" as string]: `${i * 70}ms` }}
          >
            <BandBlob name={tr.name} size={60} color={col} mood={naze ? "sad" : king ? "laughing" : "happy"} seed={i} outline shadow={false} wobble={false} hop={false} crown={king} talk />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-extrabold uppercase leading-tight tracking-wide" style={{ opacity: 0.7 }}>{txt.name}</span>
              <span className="zz-title block truncate text-[22px]">{tr.name}</span>
              <span className="block text-[13px] font-bold leading-tight">{txt.quip}</span>
              <span className="mt-0.5 block text-[12px] font-bold leading-tight" style={{ opacity: 0.6 }}>{txt.fact}</span>
            </span>
            <span className="shrink-0"><TrophyCup id={tr.id} size={52} /></span>
          </li>
        );
      })}
    </ol>
  );
}
