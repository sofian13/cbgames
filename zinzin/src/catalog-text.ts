import type { I18n } from "@/lib/i18n";
import type { MascotColor } from "@/components/Mascot";
import { VERRE_TEXT } from "@/components/games/verre/i18n";

/**
 * Textes des jeux de l'app, dans les 3 langues (FR / EN / ES).
 * Le registry du site (src/lib/games/registry.ts) reste en français et n'est
 * plus lu par l'app : tout ce que l'app affiche sur un jeu vient d'ici.
 * Le typage I18n oblige à fournir les 3 langues pour chaque jeu.
 */

/** Une réplique de la mini BD. `color` facultatif : sinon couleur attitrée du prénom. */
export interface ZLine {
  who?: string;
  text: string;
  color?: MascotColor;
}

export interface ZGameText {
  /** Nom affiché (sans emoji) */
  name: string;
  /** Accroche courte des cartes de l'accueil (2 lignes max) */
  tagline: string;
  /** Phrase d'intro de la fiche */
  pitch: string;
  /** Exemple de partie (texte libre) */
  example: string;
  /** Règles détaillées (« Les règles en détail ») */
  rules: string[];
  /** Les règles en 3 à 5 étapes courtes */
  steps: string[];
  /**
   * Mini BD affichée dans la fiche (« Ça donne quoi ? ») : quelques répliques
   * courtes qui font comprendre le jeu en 5 s. Sans `who` = narrateur / le tél.
   */
  story: ZLine[];
}

export const GAME_TEXT = {
  /* ───────── L'Intrus ───────── */
  undercover: {
    fr: {
      name: "L'Intrus",
      tagline: "Un mot secret. Un intrus parmi vous.",
      pitch: "Le jeu de l'intrus : tout le monde a le même mot, sauf un qui en a un presque pareil.",
      example: "Vous avez tous « Pizza », mais Léa a « Burger ». Chacun donne un indice : « italien », « fromage », « fast-food »… Léa doit rester vague pour ne pas se griller. Vous votez : c'est elle ou pas ?",
      rules: [
        "Chaque joueur reçoit un mot en secret. L'Intrus a un mot légèrement différent… et ne sait pas qu'il est l'Intrus !",
        "À tour de rôle, donne un indice sur ton mot (sans le dire !)",
        "Après les indices, votez pour éliminer celui que vous suspectez",
        "Le Fantôme n'a aucun mot : il bluffe, et s'il est éliminé il peut gagner en devinant le mot des civils",
        "En option, le Bouffon : il n'a pas de camp et gagne seul s'il se fait éliminer",
        "Les civils gagnent si tous les imposteurs (Intrus et Fantôme) sont éliminés · les imposteurs gagnent s'ils sont aussi nombreux que les civils. Les points se cumulent d'une revanche à l'autre",
      ],
      steps: [
        "Chacun reçoit un mot secret. L'Intrus a un mot presque pareil… sans le savoir",
        "Chacun donne un indice sur son mot, sans le dire",
        "On vote pour éliminer le plus louche",
        "Les civils gagnent s'ils sortent tous les intrus",
      ],
      story: [
        { who: "Léa", text: "Mon indice : italien." },
        { who: "Malik", text: "Fromage qui file !" },
        { who: "Inès", text: "Euh… ça se mange vite ?" },
        { text: "Tout le monde vote Inès. Elle avait « burger » : l'Intrus est grillé !" },
      ],
    },
    en: {
      name: "The Impostor",
      tagline: "One secret word. One impostor.",
      pitch: "Everyone gets the same secret word… except one player, whose word is almost the same.",
      example: "You all have \"Pizza\", but Léa has \"Burger\". Everyone gives a clue: \"Italian\", \"cheese\", \"fast food\"… Léa has to stay vague so she doesn't get caught. Then you vote: is it her or not?",
      rules: [
        "Everyone secretly gets a word. The Impostor's word is slightly different… and they don't know they're the Impostor!",
        "Take turns giving one clue about your word (without saying it!)",
        "After the clues, vote to eliminate the player you suspect",
        "The Ghost has no word at all: they bluff, and if they're voted out they can still win by guessing the civilians' word",
        "Optional Jester: they have no side and win alone if they get voted out",
        "Civilians win if every impostor (Impostor and Ghost) is eliminated · impostors win once there are as many of them as civilians. Points add up from one rematch to the next",
      ],
      steps: [
        "Everyone gets a secret word. The Impostor's is almost the same… and they don't know it",
        "Each player gives a clue about their word, without saying it",
        "Vote out the shadiest player",
        "Civilians win if they catch every impostor",
      ],
      story: [
        { who: "Léa", text: "My clue: Italian." },
        { who: "Malik", text: "Stretchy cheese!" },
        { who: "Inès", text: "Uh… you eat it fast?" },
        { text: "Everyone votes Inès. She had \"burger\": the Impostor is busted!" },
      ],
    },
    es: {
      name: "El Impostor",
      tagline: "Una palabra secreta. Un impostor.",
      pitch: "Todos tienen la misma palabra secreta… menos uno, que tiene una casi igual.",
      example: "Todos tenéis «Pizza», pero Léa tiene «Hamburguesa». Cada uno da una pista: «italiana», «queso», «comida rápida»… Léa tiene que ser vaga para que no la pillen. Luego se vota: ¿es ella o no?",
      rules: [
        "Cada jugador recibe una palabra en secreto. La del Impostor es un poco distinta… ¡y no sabe que es el Impostor!",
        "Por turnos, da una pista sobre tu palabra (¡sin decirla!)",
        "Después de las pistas, se vota para eliminar al sospechoso",
        "El Fantasma no tiene palabra: se tira el farol, y si lo eliminan puede ganar adivinando la palabra de los civiles",
        "Opcional, el Bufón: no tiene bando y gana solo si lo eliminan",
        "Los civiles ganan si eliminan a todos los impostores (Impostor y Fantasma) · los impostores ganan si llegan a ser tantos como los civiles. Los puntos se acumulan de una revancha a otra",
      ],
      steps: [
        "Cada uno recibe una palabra secreta. El Impostor tiene una casi igual… sin saberlo",
        "Cada uno da una pista sobre su palabra, sin decirla",
        "Se vota para eliminar al más sospechoso",
        "Los civiles ganan si echan a todos los impostores",
      ],
      story: [
        { who: "Léa", text: "Mi pista: italiana." },
        { who: "Malik", text: "¡Queso que se estira!" },
        { who: "Inès", text: "Eh… ¿se come rápido?" },
        { text: "Todos votan a Inès. Tenía «hamburguesa»: ¡el Impostor está pillado!" },
      ],
    },
  },

  /* ───────── De 1 à 10 ───────── */
  "top-ten": {
    fr: {
      name: "De 1 à 10",
      tagline: "Un thème, un chiffre secret de 1 à 10.",
      pitch: "Un thème, un chiffre secret de 1 à 10 : réponds pile à ton niveau, puis toute la table range tout le monde ensemble.",
      example: "Thème : « une excuse pour être en retard ». Ton numéro secret est le 2 : « le métro était bloqué ». Ton pote a le 9 (sans le dire !) : « j'ai été enlevé par des extraterrestres ». Ensuite, tous ensemble, vous rangez la table du plus faible au plus fort… et on révèle qui a été bien compris.",
      rules: [
        "Choisis l'ambiance : Soirée 18+ (thèmes osés) ou Culture pop (classements que tout le monde connaît)",
        "Chacun reçoit un numéro secret de 1 à 10 (1 = le plus faible/soft, 10 = le plus fort/hard). Ne le dis jamais !",
        "Un thème est révélé (ex. « un perso de Dragon Ball par puissance ») : chacun donne une réponse à voix haute selon son numéro",
        "Ensuite, tous ensemble, mettez-vous d'accord sur l'ordre du plus faible au plus fort : une seule personne le rentre dans le tél",
        "On révèle les vrais numéros : rangé pile à ta place +2, à une place près +1. Le plus mal compris est démasqué",
        "L'équipe marque aussi : 2 points par paire de voisins bien rangée, +5 si l'ordre est parfait",
      ],
      steps: [
        "Chacun reçoit un numéro secret de 1 à 10",
        "Un thème tombe : réponds selon ton numéro (1 = tout doux, 10 = énorme), sans jamais le dire",
        "Tous ensemble, rangez les prénoms du plus faible au plus fort",
        "Révélation : qui a été pile à sa place, qui a été le plus mal compris ?",
      ],
      story: [
        { text: "Thème : une excuse pour être en retard" },
        { who: "Tom", text: "(en secret, il a le 2) « Le métro était bloqué. »" },
        { who: "Sarah", text: "(en secret, elle a le 9) « J'ai été enlevée par des extraterrestres ! »" },
        { text: "Personne ne dit son numéro. Toute la table range Tom avant Sarah… pile poil !" },
      ],
    },
    en: {
      name: "From 1 to 10",
      tagline: "One theme, a secret number 1 to 10.",
      pitch: "One theme, one secret number from 1 to 10: answer at exactly your level, then the whole table ranks everyone together.",
      example: "Theme: \"an excuse for being late\". Your secret number is 2: \"the train was delayed\". Your friend has a 9 (and doesn't say it!): \"I was abducted by aliens\". Then, all together, you rank the table from weakest to strongest… and find out who was understood.",
      rules: [
        "Pick the vibe: Party 18+ (spicy themes) or Pop culture (rankings everyone knows)",
        "Everyone gets a secret number from 1 to 10 (1 = the weakest/mildest, 10 = the strongest/wildest). Never say it!",
        "A theme is revealed (e.g. \"a superhero, by power level\"): everyone says an answer out loud that matches their number",
        "Then, all together, agree on the order from weakest to strongest: just one person enters it on the phone",
        "The real numbers are revealed: placed exactly right +2, one spot off +1. The most misunderstood gets exposed",
        "The team scores too: 2 points per pair of neighbours in the right order, +5 if the order is perfect",
      ],
      steps: [
        "Everyone gets a secret number from 1 to 10",
        "A theme drops: answer according to your number (1 = super mild, 10 = huge), without ever saying it",
        "All together, rank the names from weakest to strongest",
        "Reveal: who was spot on, who was the most misunderstood?",
      ],
      story: [
        { text: "Theme: an excuse for being late" },
        { who: "Tom", text: "(secretly a 2) \"The train was delayed.\"" },
        { who: "Sarah", text: "(secretly a 9) \"I was abducted by aliens!\"" },
        { text: "Nobody says their number. The table ranks Tom before Sarah… spot on!" },
      ],
    },
    es: {
      name: "Del 1 al 10",
      tagline: "Un tema, un número secreto del 1 al 10.",
      pitch: "Un tema, un número secreto del 1 al 10: responde justo a tu nivel y luego toda la mesa ordena a todos juntos.",
      example: "Tema: «una excusa para llegar tarde». Tu número secreto es el 2: «el metro iba fatal». Tu amigo tiene el 9 (¡sin decirlo!): «me abdujeron unos extraterrestres». Después, todos juntos, ordenáis la mesa de más flojo a más fuerte… y se revela quién se hizo entender.",
      rules: [
        "Elige el ambiente: Fiesta 18+ (temas atrevidos) o Cultura pop (rankings que todo el mundo conoce)",
        "Cada uno recibe un número secreto del 1 al 10 (1 = lo más flojo/suave, 10 = lo más fuerte/bestia). ¡No lo digas nunca!",
        "Se revela un tema (p. ej. «un superhéroe, según su poder»): cada uno da en voz alta una respuesta según su número",
        "Después, todos juntos, poneos de acuerdo en el orden de más flojo a más fuerte: una sola persona lo mete en el móvil",
        "Se revelan los números reales: en tu sitio exacto +2, a un puesto +1. El peor entendido queda al descubierto",
        "El equipo también puntúa: 2 por cada pareja de vecinos bien ordenada, +5 si el orden es perfecto",
      ],
      steps: [
        "Cada uno recibe un número secreto del 1 al 10",
        "Sale un tema: responde según tu número (1 = suavecito, 10 = enorme), sin decirlo nunca",
        "Todos juntos, ordenad los nombres de más flojo a más fuerte",
        "Revelación: ¿quién estaba en su sitio y quién fue el peor entendido?",
      ],
      story: [
        { text: "Tema: una excusa para llegar tarde" },
        { who: "Tom", text: "(en secreto tiene el 2) «El metro iba fatal.»" },
        { who: "Sarah", text: "(en secreto tiene el 9) «¡Me abdujeron unos extraterrestres!»" },
        { text: "Nadie dice su número. La mesa pone a Tom antes que a Sarah… ¡clavado!" },
      ],
    },
  },

  /* ───────── Tu préfères ? ───────── */
  "tu-prefere": {
    fr: {
      name: "Tu préfères ?",
      tagline: "Des dilemmes impossibles. On vote, on débat.",
      pitch: "Un dilemme impossible, tout le monde vote, et on débat.",
      example: "« Tu préfères ne plus jamais manger de fromage ou ne plus jamais boire de café ? » À 3, tout le monde lève la main, on compte les mains… et le camp minoritaire prend la peine.",
      rules: [
        "Un seul téléphone posé au milieu : pas besoin de se le passer.",
        "Choisissez une ambiance : Classique, Chaud, Absurde ou Couple.",
        "Lisez le dilemme à voix haute, votez tous « à 3 » avec la main.",
        "Touchez la carte A ou B une fois par main levée, puis révélez le résultat.",
        "Le camp minoritaire prend la peine : un gage, ou 1 à 2 gorgées de zinzin (eau OK). Égalité ou unanimité : tout le monde prend la peine !",
        "Une partie = 15 dilemmes (10 en Soirée Zinzin), puis le bilan : les votes unanimes et le dilemme le plus serré.",
      ],
      steps: [
        "Lisez le dilemme à voix haute",
        "À 3, tout le monde vote avec la main",
        "Comptez les mains sur l'écran",
        "La minorité prend la peine (égalité : tout le monde)",
      ],
      story: [
        { text: "Tu préfères ne plus jamais manger de fromage… ou ne plus jamais boire de café ?" },
        { who: "Léa", text: "Le café, sans hésiter." },
        { who: "Malik", text: "Tu rigoles ? Le fromage c'est la vie." },
        { text: "4 mains pour A, 1 pour B : Malik, seul contre tous, prend la peine !" },
      ],
    },
    en: {
      name: "Would You Rather?",
      tagline: "Tough dilemmas. Vote, then argue.",
      pitch: "One impossible dilemma, everyone votes, and the debate begins.",
      example: "\"Would you rather never eat cheese again or never drink coffee again?\" On 3, everyone raises a hand, you count them… and the minority side takes the penalty.",
      rules: [
        "One phone in the middle of the table: no need to pass it around.",
        "Pick a vibe: Classic, Spicy, Absurd or Couple.",
        "Read the dilemma out loud, everyone votes with their hand \"on 3\".",
        "Tap card A or B once per raised hand, then reveal the result.",
        "The minority side takes the penalty: a dare, or 1 to 2 zinzin sips (water is fine). Tie or unanimous: everyone takes the penalty!",
        "A game = 15 dilemmas (10 in a Zinzin Night), then the recap: unanimous votes and the closest call.",
      ],
      steps: [
        "Read the dilemma out loud",
        "On 3, everyone votes with their hand",
        "Count the hands on screen",
        "The minority takes the penalty (tie: everyone)",
      ],
      story: [
        { text: "Would you rather never eat cheese again… or never drink coffee again?" },
        { who: "Léa", text: "Coffee, easy." },
        { who: "Malik", text: "Are you kidding? Cheese is life." },
        { text: "4 hands for A, 1 for B: Malik, alone against everyone, takes the penalty!" },
      ],
    },
    es: {
      name: "¿Qué prefieres?",
      tagline: "Dilemas imposibles. Se vota y se debate.",
      pitch: "Un dilema imposible, todos votan y empieza el debate.",
      example: "«¿Qué prefieres: no volver a comer queso nunca o no volver a tomar café nunca?». A la de 3, todos levantan la mano, se cuentan… y el bando minoritario paga.",
      rules: [
        "Un solo móvil en el centro de la mesa: no hace falta pasarlo.",
        "Elige un ambiente: Clásico, Picante, Absurdo o Pareja.",
        "Lee el dilema en voz alta y todos votan con la mano «a la de 3».",
        "Toca la carta A o B una vez por mano levantada y revela el resultado.",
        "El bando minoritario paga: un reto, o 1 a 2 tragos de zinzin (vale agua). Empate o unanimidad: ¡paga todo el mundo!",
        "Una partida = 15 dilemas (10 en una Noche Zinzin), y luego el resumen: los votos unánimes y el dilema más reñido.",
      ],
      steps: [
        "Lee el dilema en voz alta",
        "A la de 3, todos votan con la mano",
        "Contad las manos en la pantalla",
        "La minoría paga (empate: todo el mundo)",
      ],
      story: [
        { text: "¿Qué prefieres: no volver a comer queso… o no volver a tomar café?" },
        { who: "Léa", text: "El café, sin dudarlo." },
        { who: "Malik", text: "¿Estás de broma? El queso es la vida." },
        { text: "4 manos por la A, 1 por la B: Malik, solo contra todos, ¡paga!" },
      ],
    },
  },

  /* ───────── La Patate ───────── */
  patate: {
    fr: {
      name: "La Patate",
      tagline: "Passe le tél avant le BOUM !",
      pitch: "Le téléphone est une patate chaude : réponds à la catégorie et passe-le avant qu'il explose !",
      example: "Catégorie « Un truc qu'on trouve dans une salle de bain ». Léa dit « brosse à dents » et passe à Malik, qui crie « peignoir ! » et passe à Inès. Le tic-tac s'emballe, Inès bloque… BOUM ! Elle a 2 gorgées ou un gage.",
      rules: [
        "Mettez-vous en cercle et entrez les prénoms dans l'ordre où vous êtes assis",
        "Une catégorie s'affiche : celui qui tient le tél dit UNE réponse à voix haute (pas de répétition)",
        "Il tape « J'ai répondu » et passe le tél à son voisin, vite !",
        "La mèche est cachée (15 à 60 s) et le tic-tac accélère : celui qui tient le tél au BOUM a perdu",
        "Mode « Ne la secoue pas ! » : trop secouée, la patate explose plus tôt",
        "Le perdant fait un gage (ou 1 à 3 gorgées, eau acceptée) et lance la manche suivante",
      ],
      steps: [
        "Asseyez-vous en cercle, prénoms dans l'ordre",
        "Une catégorie s'affiche : dis une réponse et passe le tél",
        "La mèche est cachée et le tic-tac accélère",
        "Celui qui tient le tél au BOUM fait un gage (ou 1 à 3 gorgées)",
      ],
      story: [
        { text: "Catégorie : un truc dans une salle de bain" },
        { who: "Léa", text: "Brosse à dents !" },
        { who: "Malik", text: "Peignoir !" },
        { who: "Inès", text: "Euh… euh…" },
        { text: "BOUM ! Inès : 2 gorgées ou un gage." },
      ],
    },
    en: {
      name: "Hot Potato",
      tagline: "Pass the phone before the BOOM!",
      pitch: "The phone is a hot potato: answer the category and pass it on before it explodes!",
      example: "Category: \"Something you find in a bathroom\". Léa says \"toothbrush\" and passes to Malik, who shouts \"bathrobe!\" and passes to Inès. The ticking speeds up, Inès freezes… BOOM! She takes 2 zinzin sips or a dare.",
      rules: [
        "Sit in a circle and enter your names in the order you're sitting",
        "A category appears: whoever holds the phone says ONE answer out loud (no repeats)",
        "They tap \"I answered\" and pass the phone to their neighbour, fast!",
        "The fuse is hidden (15 to 60 s) and the ticking speeds up: whoever holds the phone at BOOM loses",
        "\"Don't shake it!\" mode: shake the potato too hard and it blows up sooner",
        "The loser does a dare (or 1 to 3 zinzin sips, water counts) and starts the next round",
      ],
      steps: [
        "Sit in a circle, names in order",
        "A category appears: say an answer and pass the phone",
        "The fuse is hidden and the ticking speeds up",
        "Whoever holds the phone at BOOM does a dare (or 1 to 3 zinzin sips)",
      ],
      story: [
        { text: "Category: something in a bathroom" },
        { who: "Léa", text: "Toothbrush!" },
        { who: "Malik", text: "Bathrobe!" },
        { who: "Inès", text: "Uh… uhh…" },
        { text: "BOOM! Inès: 2 zinzin sips or a dare." },
      ],
    },
    es: {
      name: "La Patata Caliente",
      tagline: "¡Pasa el móvil antes del BUM!",
      pitch: "El móvil es una patata caliente: responde a la categoría y pásalo antes de que explote.",
      example: "Categoría: «Algo que hay en un baño». Léa dice «cepillo de dientes» y se lo pasa a Malik, que grita «¡albornoz!» y se lo pasa a Inès. El tictac se acelera, Inès se bloquea… ¡BUM! Le tocan 2 tragos de zinzin o un reto.",
      rules: [
        "Sentaos en círculo y escribid los nombres en el orden en que estáis sentados",
        "Sale una categoría: quien tiene el móvil dice UNA respuesta en voz alta (sin repetir)",
        "Toca «Ya he respondido» y le pasa el móvil a su vecino, ¡rápido!",
        "La mecha está oculta (de 15 a 60 s) y el tictac se acelera: quien tenga el móvil en el BUM pierde",
        "Modo «¡No la agites!»: si la agitas demasiado, la patata explota antes",
        "El que pierde hace un reto (o de 1 a 3 tragos de zinzin, vale agua) y lanza la siguiente ronda",
      ],
      steps: [
        "Sentaos en círculo, nombres en orden",
        "Sale una categoría: di una respuesta y pasa el móvil",
        "La mecha está oculta y el tictac se acelera",
        "Quien tenga el móvil en el BUM hace un reto (o de 1 a 3 tragos)",
      ],
      story: [
        { text: "Categoría: algo que hay en un baño" },
        { who: "Léa", text: "¡Cepillo de dientes!" },
        { who: "Malik", text: "¡Albornoz!" },
        { who: "Inès", text: "Eh… eh…" },
        { text: "¡BUM! Inès: 2 tragos de zinzin o un reto." },
      ],
    },
  },

  /* ───────── Test de pureté ───────── */
  purete: {
    fr: {
      name: "Test de pureté",
      tagline: "Ange ou démon ? Le tél tranche.",
      pitch: "« As-tu déjà… ? » : plus tu dis oui, moins tu es pur. Qui est l'ange de la table, et qui est le démon ? Joue au Test Officiel Zinzin (50 questions) ou à des questions au hasard.",
      example: "« As-tu déjà écrit à ton ex en pleine nuit ? » Léa tape « Jamais » en secret, Tom tape « Oui »… À la fin, le compteur de Tom dégringole jusqu'à 12 % : « Casier bien rempli », cornes sur la tête. Et l'appli balance : « 3 personnes sur 4 ont déjà dormi dans une voiture après une soirée ».",
      rules: [
        "Une question « As-tu déjà… ? » à la fois. « Oui » = tu perds de la pureté, « Jamais » = tu restes un ange",
        "Au choix : des questions au hasard dans tes packs, ou avec Zinzin+, le Test Officiel Zinzin (50 questions, du plus sage au plus hardcore, questions pour adultes)",
        "Chacun son tour : on se passe le tél et chacun répond seul, en secret, à toutes les questions d'affilée, puis grande révélation du classement",
        "Solo : réponds seul et découvre ton score… et tes aveux",
        "Tous ensemble : on lit à voix haute, ceux qui l'ont fait lèvent la main, on compte sur l'écran",
        "Score final en % de pureté avec un titre, de « Ange tombé du ciel » à « Démon certifié »",
        "Option peines : le moins pur prend un gage ou 1 à 3 gorgées de zinzin. Pack Coquin 18+ facultatif",
      ],
      steps: [
        "Des questions au hasard, ou le Test Officiel Zinzin (Zinzin+)",
        "Une question « As-tu déjà… ? » à la fois",
        "« Oui » = tu perds de la pureté, « Jamais » = tu restes un ange",
        "Réponds en secret (on se passe le tél) ou main levée, tous ensemble",
        "Score final en % de pureté, de l'ange au démon certifié",
      ],
      story: [
        { text: "As-tu déjà écrit à ton ex en pleine nuit ?" },
        { who: "Léa", text: "Jamais. Je suis une sainte." },
        { who: "Tom", text: "…Oui. Deux fois. Cette semaine." },
        { text: "Tom : 12 % de pureté. Casier bien rempli, cornes sur la tête." },
      ],
    },
    en: {
      name: "Purity Test",
      tagline: "Angel or devil? The phone decides.",
      pitch: "\"Have you ever…?\": the more you say yes, the less pure you are. Who's the angel at the table, and who's the devil? Play the Official Zinzin Test (50 questions) or random questions.",
      example: "\"Have you ever texted your ex in the middle of the night?\" Léa secretly taps \"Never\", Tom taps \"Yes\"… By the end, Tom's meter has crashed to 12%: \"Long rap sheet\", horns on his head. And the app drops: \"3 out of 4 people have slept in a car after a party\".",
      rules: [
        "One \"Have you ever…?\" question at a time. \"Yes\" = you lose purity, \"Never\" = you stay an angel",
        "Your pick: random questions from your packs, or with Zinzin+, the Official Zinzin Test (50 questions, from innocent to hardcore, adult questions)",
        "Take turns: pass the phone around, everyone answers all the questions in a row, alone and in secret, then the big ranking reveal",
        "Solo: answer on your own and discover your score… and your confessions",
        "All together: read it out loud, whoever's done it raises a hand, count them on the screen",
        "Final score as a purity % with a title, from \"Fallen angel\" to \"Certified devil\"",
        "Penalties option: the least pure takes a dare or 1 to 3 zinzin sips. Optional Naughty 18+ pack",
      ],
      steps: [
        "Random questions, or the Official Zinzin Test (Zinzin+)",
        "One \"Have you ever…?\" question at a time",
        "\"Yes\" = you lose purity, \"Never\" = you stay an angel",
        "Answer in secret (pass the phone) or with a show of hands, all together",
        "Final score as a purity %, from angel to certified devil",
      ],
      story: [
        { text: "Have you ever texted your ex in the middle of the night?" },
        { who: "Léa", text: "Never. I'm a saint." },
        { who: "Tom", text: "…Yes. Twice. This week." },
        { text: "Tom: 12% pure. Long rap sheet, horns on his head." },
      ],
    },
    es: {
      name: "Test de Pureza",
      tagline: "¿Ángel o demonio? El móvil decide.",
      pitch: "«¿Alguna vez has…?»: cuanto más dices que sí, menos puro eres. ¿Quién es el ángel de la mesa y quién el demonio? Juega al Test Oficial Zinzin (50 preguntas) o con preguntas al azar.",
      example: "«¿Alguna vez le has escrito a tu ex en plena noche?». Léa toca «Nunca» en secreto, Tom toca «Sí»… Al final, el contador de Tom se desploma hasta el 12 %: «Expediente bien cargado», cuernos en la cabeza. Y la app suelta: «3 de cada 4 personas han dormido en un coche después de una fiesta».",
      rules: [
        "Una pregunta «¿Alguna vez has…?» cada vez. «Sí» = pierdes pureza, «Nunca» = sigues siendo un ángel",
        "A elegir: preguntas al azar de tus packs o, con Zinzin+, el Test Oficial Zinzin (50 preguntas, de lo más inocente a lo más fuerte, preguntas para adultos)",
        "Por turnos: el móvil va pasando, cada uno responde solo y en secreto a todas las preguntas seguidas, y luego llega la gran revelación del ranking",
        "En solitario: responde tú solo y descubre tu puntuación… y tus confesiones",
        "Todos a la vez: se lee en voz alta, quien lo haya hecho levanta la mano y se cuenta en la pantalla",
        "Puntuación final en % de pureza con un título, de «Ángel caído del cielo» a «Demonio certificado»",
        "Opción castigos: el menos puro hace un reto o de 1 a 3 tragos de zinzin. Pack Pícaro 18+ opcional",
      ],
      steps: [
        "Preguntas al azar, o el Test Oficial Zinzin (Zinzin+)",
        "Una pregunta «¿Alguna vez has…?» cada vez",
        "«Sí» = pierdes pureza, «Nunca» = sigues siendo un ángel",
        "Responde en secreto (pasando el móvil) o a mano alzada, todos a la vez",
        "Puntuación final en % de pureza, del ángel al demonio certificado",
      ],
      story: [
        { text: "¿Alguna vez le has escrito a tu ex en plena noche?" },
        { who: "Léa", text: "Nunca. Soy una santa." },
        { who: "Tom", text: "…Sí. Dos veces. Esta semana." },
        { text: "Tom: 12 % de pureza. Expediente cargado, cuernos en la cabeza." },
      ],
    },
  },

  /* ───────── Lâche pas ! ───────── */
  "lache-pas": {
    fr: {
      name: "Lâche pas !",
      tagline: "Un doigt sur l'écran. Tiens bon !",
      pitch: "Tout le monde pose un doigt sur l'écran, une bombe s'arme : lâche avant le boum… mais pas le premier !",
      example: "On pose 4 doigts, la bombe s'arme. Un pétard claque, Tom lâche de peur. On tient… Inès lâche à 9 s, et BOUM à 10 s : Léa et Malik sont grillés, Inès gagne la couronne.",
      rules: [
        "Chacun pose UN doigt sur l'écran (2 à 5 joueurs) ; entrez vos prénoms pour les voir sous chaque doigt",
        "Une bombe s'arme et explose entre 4 et 22 s, personne ne sait quand",
        "Tu peux lâcher quand tu veux, mais un doigt levé ne revient pas",
        "Au BOUM, tous les doigts encore posés ont perdu",
        "Si tout le monde a lâché avant, c'est le premier à avoir lâché (le trouillard) qui perd",
        "Le dernier à lâcher avant le boum gagne la couronne 👑 et choisit qui fait un gage en plus",
      ],
      steps: [
        "Chacun pose un doigt sur l'écran",
        "La bombe explose entre 4 et 22 s, personne ne sait quand",
        "Lâche quand tu veux… mais pas le premier !",
        "Au BOUM, les doigts encore posés ont perdu",
      ],
      story: [
        { text: "4 doigts sur l'écran. La bombe s'arme…" },
        { who: "Tom", text: "J'ai entendu un clic, je lâche !" },
        { who: "Inès", text: "Je tiens… je tiens… je lâche !" },
        { text: "BOUM ! Léa et Malik sont grillés, Inès prend la couronne." },
      ],
    },
    en: {
      name: "Don't Let Go!",
      tagline: "One finger on the screen. Hold on!",
      pitch: "Everyone puts a finger on the screen and a bomb starts ticking: let go before the boom… but don't be the first!",
      example: "4 fingers go down, the bomb arms. A firecracker pops and Tom lets go in fright. The rest hold on… Inès lets go at 9 s, and BOOM at 10 s: Léa and Malik are toast, Inès wins the crown.",
      rules: [
        "Everyone puts ONE finger on the screen (2 to 5 players); add your names to see them under each finger",
        "A bomb arms and explodes between 4 and 22 s, nobody knows when",
        "You can let go whenever you want, but once a finger is up it can't come back",
        "At BOOM, every finger still on the screen loses",
        "If everyone let go before the boom, the first one to let go (the chicken) loses",
        "The last one to let go before the boom wins the crown 👑 and picks who does an extra dare",
      ],
      steps: [
        "Everyone puts a finger on the screen",
        "The bomb explodes between 4 and 22 s, nobody knows when",
        "Let go whenever you want… but not first!",
        "At BOOM, any finger still down loses",
      ],
      story: [
        { text: "4 fingers on the screen. The bomb is arming…" },
        { who: "Tom", text: "I heard a click, I'm out!" },
        { who: "Inès", text: "Holding… holding… letting go!" },
        { text: "BOOM! Léa and Malik are toast, Inès takes the crown." },
      ],
    },
    es: {
      name: "¡No Sueltes!",
      tagline: "Un dedo en la pantalla. ¡Aguanta!",
      pitch: "Todos ponen un dedo en la pantalla y se arma una bomba: suelta antes del bum… ¡pero no el primero!",
      example: "Se ponen 4 dedos y la bomba se arma. Suena un petardo y Tom suelta del susto. Los demás aguantan… Inès suelta a los 9 s y ¡BUM! a los 10 s: Léa y Malik han caído, Inès se lleva la corona.",
      rules: [
        "Cada uno pone UN dedo en la pantalla (de 2 a 5 jugadores); escribid vuestros nombres para verlos bajo cada dedo",
        "Se arma una bomba que explota entre los 4 y los 22 s, nadie sabe cuándo",
        "Puedes soltar cuando quieras, pero un dedo levantado no puede volver",
        "En el BUM, todos los dedos que sigan en la pantalla pierden",
        "Si todos han soltado antes, pierde el primero que soltó (el gallina)",
        "El último en soltar antes del bum gana la corona 👑 y elige quién hace un reto extra",
      ],
      steps: [
        "Cada uno pone un dedo en la pantalla",
        "La bomba explota entre los 4 y los 22 s, nadie sabe cuándo",
        "Suelta cuando quieras… ¡pero no el primero!",
        "En el BUM, los dedos que sigan puestos pierden",
      ],
      story: [
        { text: "4 dedos en la pantalla. La bomba se arma…" },
        { who: "Tom", text: "¡He oído un clic, suelto!" },
        { who: "Inès", text: "Aguanto… aguanto… ¡suelto!" },
        { text: "¡BUM! Léa y Malik han caído, Inès se lleva la corona." },
      ],
    },
  },

  /* ───────── Pile Poil ───────── */
  "pile-poil": {
    fr: {
      name: "Pile Poil",
      tagline: "Compte dans ta tête, stoppe pile.",
      pitch: "Compte dans ta tête et arrête le chrono invisible pile sur la cible.",
      example: "Cible : 7 secondes. Tu appuies sur GO, tu comptes dans ta tête… STOP à 6,82 s ! Ton pote fait 9,10 s : c'est lui le plus loin, il prend une peine.",
      rules: [
        "Une cible s'affiche (ex. 7 s) : appuie sur GO, compte dans ta tête, appuie sur STOP",
        "Le chrono est INVISIBLE pour toi : ton temps s'affiche seulement après",
        "Chacun passe à tour de rôle sur le même téléphone",
        "2 règles : « Le plus proche » (le plus loin prend une peine) ou « Sans dépasser » (tu dépasses = dernier de la manche)",
        "À 0,10 s près de la cible : PILE POIL ! 🎯",
        "Points : +1 au gagnant de la manche, +1 par PILE POIL",
      ],
      steps: [
        "Une cible s'affiche, par exemple 7 secondes",
        "GO, compte dans ta tête, STOP : le chrono est caché",
        "Chacun son tour sur le même tél",
        "Le plus loin prend une peine. À 0,10 s près : PILE POIL !",
      ],
      story: [
        { text: "Cible : 7 secondes. GO !" },
        { who: "Hugo", text: "…5, 6, 7. STOP !" },
        { text: "6,82 s. Pas mal du tout." },
        { who: "Sarah", text: "9,10 s ?! J'ai compté comme une tortue." },
        { text: "Sarah est la plus loin : elle prend une peine." },
      ],
    },
    en: {
      name: "Spot On",
      tagline: "Count in your head, stop spot on.",
      pitch: "Count in your head and stop the invisible timer exactly on the target.",
      example: "Target: 7 seconds. You hit GO, you count in your head… STOP at 6.82 s! Your friend gets 9.10 s: they're the furthest off, so they take a penalty.",
      rules: [
        "A target appears (e.g. 7 s): hit GO, count in your head, hit STOP",
        "The timer is INVISIBLE to you: your time only shows up afterwards",
        "Everyone takes a turn on the same phone",
        "2 rule sets: \"Closest wins\" (furthest off takes a penalty) or \"Don't go over\" (go over = last place for the round)",
        "Within 0.10 s of the target: SPOT ON! 🎯",
        "Points: +1 for the round winner, +1 for each SPOT ON",
      ],
      steps: [
        "A target appears, for example 7 seconds",
        "GO, count in your head, STOP: the timer is hidden",
        "Everyone takes a turn on the same phone",
        "Furthest off takes a penalty. Within 0.10 s: SPOT ON!",
      ],
      story: [
        { text: "Target: 7 seconds. GO!" },
        { who: "Hugo", text: "…5, 6, 7. STOP!" },
        { text: "6.82 s. Not bad at all." },
        { who: "Sarah", text: "9.10 s?! I counted like a tortoise." },
        { text: "Sarah is the furthest off: she takes a penalty." },
      ],
    },
    es: {
      name: "Justo a Tiempo",
      tagline: "Cuenta mentalmente y para en seco.",
      pitch: "Cuenta mentalmente y para el cronómetro invisible justo en el objetivo.",
      example: "Objetivo: 7 segundos. Pulsas GO, cuentas en tu cabeza… ¡STOP a los 6,82 s! Tu amigo hace 9,10 s: es el que más se aleja, le toca un castigo.",
      rules: [
        "Aparece un objetivo (p. ej. 7 s): pulsa GO, cuenta en tu cabeza, pulsa STOP",
        "El cronómetro es INVISIBLE para ti: tu tiempo solo aparece después",
        "Cada uno juega por turnos en el mismo móvil",
        "2 reglas: «El más cercano» (el que más se aleja recibe un castigo) o «Sin pasarse» (si te pasas, quedas último de la ronda)",
        "A 0,10 s o menos del objetivo: ¡CLAVADO! 🎯",
        "Puntos: +1 para el ganador de la ronda, +1 por cada CLAVADO",
      ],
      steps: [
        "Aparece un objetivo, por ejemplo 7 segundos",
        "GO, cuenta en tu cabeza, STOP: el cronómetro está oculto",
        "Cada uno juega por turnos en el mismo móvil",
        "El que más se aleja recibe un castigo. A 0,10 s: ¡CLAVADO!",
      ],
      story: [
        { text: "Objetivo: 7 segundos. ¡GO!" },
        { who: "Hugo", text: "…5, 6, 7. ¡STOP!" },
        { text: "6,82 s. Nada mal." },
        { who: "Sarah", text: "¡¿9,10 s?! He contado como una tortuga." },
        { text: "Sarah es la que más se aleja: le toca un castigo." },
      ],
    },
  },

  /* ───────── Loup-Garou ───────── */
  "loup-garou": {
    fr: {
      name: "Loup-Garou",
      tagline: "Le grand classique, sans meneur.",
      pitch: "Le grand classique, avec le téléphone en maître du jeu : il distribue les rôles et raconte la nuit.",
      example: "Le tél annonce « Les loups ouvrent les yeux… ». Ils choisissent Hugo. Au réveil, Hugo est mort : c'était la Voyante ! Le village débat 3 minutes et élimine Sarah… une simple villageoise. Les loups rigolent.",
      rules: [
        "Entrez les prénoms : le tél propose une répartition des rôles (Loups, Voyante, Sorcière, Chasseur…)",
        "Passez-vous le tél : chacun maintient le doigt pour voir son rôle en secret",
        "La nuit, posez le tél au centre : tout le monde ferme les yeux, le tél appelle chaque rôle à voix haute, qui ouvre les yeux et joue sur l'écran (sans la voix du tél : un meneur qui ne joue pas lit les textes, yeux ouverts)",
        "Le jour : on découvre les morts, on débat (minuteur) puis on vote pour éliminer un suspect",
        "Le village gagne s'il élimine tous les loups · les loups gagnent dès qu'ils sont aussi nombreux que les villageois",
        "Cupidon (dès 12 joueurs) lie deux amoureux : si l'un meurt, l'autre aussi. S'ils sont les deux derniers en vie, l'amour gagne. Le Gardien (dès 11) protège un joueur chaque nuit",
      ],
      steps: [
        "Entrez les prénoms : le tél distribue les rôles",
        "Chacun découvre son rôle en secret",
        "La nuit, le tél raconte et appelle chaque rôle",
        "Le jour : débat, vote, un suspect est éliminé",
        "Le village doit éliminer tous les loups",
      ],
      story: [
        { text: "La nuit tombe. Les loups ouvrent les yeux…" },
        { who: "Hugo", text: "Je suis mort ?! J'étais la Voyante !" },
        { who: "Sarah", text: "C'est Tom, il a rien dit de la partie." },
        { who: "Tom", text: "Moi ? Simple villageois, promis." },
        { text: "Le village élimine Sarah… simple villageoise. Les loups rigolent." },
      ],
    },
    en: {
      name: "Werewolf",
      tagline: "The great classic, no host needed.",
      pitch: "The great classic, with the phone as game master: it deals the roles and narrates the night.",
      example: "The phone announces \"The werewolves open their eyes…\". They pick Hugo. At dawn, Hugo is dead: he was the Seer! The village debates for 3 minutes and votes out Sarah… just a Villager. The werewolves are cracking up.",
      rules: [
        "Enter your names: the phone suggests a role setup (Werewolves, Seer, Witch, Hunter…)",
        "Pass the phone around: everyone holds a finger down to see their role in secret",
        "At night, put the phone in the middle: everyone closes their eyes, the phone calls each role out loud, and only they open their eyes and play on the screen (without the phone's voice: a host who isn't playing reads the texts, eyes open)",
        "During the day: reveal who died, debate (with a timer), then vote to eliminate a suspect",
        "The village wins if it eliminates every werewolf · the werewolves win as soon as they match the villagers in number",
        "Cupid (from 12 players) links two lovers: if one dies, so does the other. If they're the last two alive, love wins. The Guardian (from 11) protects one player each night",
      ],
      steps: [
        "Enter your names: the phone deals the roles",
        "Everyone discovers their role in secret",
        "At night, the phone narrates and calls each role",
        "During the day: debate, vote, a suspect is eliminated",
        "The village must eliminate every werewolf",
      ],
      story: [
        { text: "Night falls. The werewolves open their eyes…" },
        { who: "Hugo", text: "I'm dead?! I was the Seer!" },
        { who: "Sarah", text: "It's Tom, he hasn't said a word all game." },
        { who: "Tom", text: "Me? Just a Villager, I swear." },
        { text: "The village votes out Sarah… just a Villager. The werewolves are cracking up." },
      ],
    },
    es: {
      name: "El Hombre Lobo",
      tagline: "El gran clásico, sin narrador.",
      pitch: "El gran clásico, con el móvil como director de juego: reparte los roles y narra la noche.",
      example: "El móvil anuncia «Los lobos abren los ojos…». Eligen a Hugo. Al amanecer, Hugo está muerto: ¡era la Vidente! El pueblo debate 3 minutos y elimina a Sarah… una simple Aldeana. Los lobos se parten de risa.",
      rules: [
        "Escribid los nombres: el móvil propone un reparto de roles (Lobos, Vidente, Bruja, Cazador…)",
        "Pasaos el móvil: cada uno mantiene el dedo pulsado para ver su rol en secreto",
        "De noche, dejad el móvil en el centro: todos cierran los ojos, el móvil llama a cada rol en voz alta, que abre los ojos y juega en la pantalla (sin la voz del móvil: un narrador que no juega lee los textos, con los ojos abiertos)",
        "De día: se descubren los muertos, se debate (con temporizador) y se vota para eliminar a un sospechoso",
        "El pueblo gana si elimina a todos los lobos · los lobos ganan en cuanto son tantos como los aldeanos",
        "Cupido (desde 12 jugadores) une a dos enamorados: si uno muere, el otro también. Si son los dos últimos vivos, gana el amor. El Guardián (desde 11) protege a un jugador cada noche",
      ],
      steps: [
        "Escribid los nombres: el móvil reparte los roles",
        "Cada uno descubre su rol en secreto",
        "De noche, el móvil narra y llama a cada rol",
        "De día: debate, votación y un sospechoso eliminado",
        "El pueblo tiene que eliminar a todos los lobos",
      ],
      story: [
        { text: "Cae la noche. Los lobos abren los ojos…" },
        { who: "Hugo", text: "¡¿Estoy muerto?! ¡Era la Vidente!" },
        { who: "Sarah", text: "Es Tom, no ha dicho nada en toda la partida." },
        { who: "Tom", text: "¿Yo? Simple aldeano, lo juro." },
        { text: "El pueblo elimina a Sarah… simple aldeana. Los lobos se parten de risa." },
      ],
    },
  },

  /* ───────── Le Bluffeur ───────── */
  "le-bluffeur": {
    fr: {
      name: "Le Bluffeur",
      tagline: "Invente la fausse réponse parfaite.",
      pitch: "Invente une fausse réponse si crédible que les autres votent pour elle.",
      example: "« Le pétrichor désigne l'odeur ___. » Tu inventes « du pain qui brûle ». Deux joueurs votent pour ton bluff → +40 pts. La vraie réponse était « de la terre après la pluie ».",
      rules: [
        "À chaque manche, une question à trou s'affiche (mot rare, fait insolite) : lisez-la à voix haute",
        "Chacun son tour, en secret, invente une fausse réponse crédible (un bluff)",
        "Tous les bluffs + la vraie réponse sont mélangés : vote pour celle que tu crois vraie",
        "+30 pts si tu trouves la vérité, +20 pts par joueur piégé par ton bluff, +15 si tu as écrit la vraie réponse sans le savoir",
        "5 manches, de 3 à 8 joueurs : le plus malin gagne !",
      ],
      steps: [
        "Une question à trou s'affiche : lisez-la à voix haute",
        "Chacun invente une fausse réponse crédible",
        "Tout est mélangé avec la vraie : votez pour la bonne",
        "Trouver la vérité ou piéger les autres rapporte des points",
      ],
      story: [
        { text: "Le pétrichor désigne l'odeur ___." },
        { who: "Tom", text: "« Du pain qui brûle ». Crédible, non ?" },
        { who: "Léa", text: "J'y crois à fond, je vote ça." },
        { text: "Bluff réussi pour Tom ! La vraie réponse : de la terre après la pluie." },
      ],
    },
    en: {
      name: "The Bluffer",
      tagline: "Make up the perfect fake answer.",
      pitch: "Make up a fake answer so believable that the others vote for it.",
      example: "\"Petrichor is the smell of ___.\" You make up \"burnt toast\". Two players vote for your bluff → +40 pts. The real answer was \"earth after rain\".",
      rules: [
        "Each round, a fill-in-the-blank question appears (rare word, odd fact): read it out loud",
        "One by one, in secret, everyone makes up a believable fake answer (a bluff)",
        "All the bluffs + the real answer are shuffled: vote for the one you think is true",
        "+30 pts if you find the truth, +20 pts for every player fooled by your bluff, +15 if you wrote the real answer without knowing it",
        "5 rounds, 3 to 8 players: the sneakiest player wins!",
      ],
      steps: [
        "A fill-in-the-blank question appears: read it out loud",
        "Everyone makes up a believable fake answer",
        "Everything is shuffled with the real one: vote for the right one",
        "Finding the truth or fooling the others scores points",
      ],
      story: [
        { text: "Petrichor is the smell of ___." },
        { who: "Tom", text: "\"Burnt toast\". Believable, right?" },
        { who: "Léa", text: "Totally buying it, I'm voting for that." },
        { text: "Tom's bluff worked! The real answer: earth after rain." },
      ],
    },
    es: {
      name: "El Farsante",
      tagline: "Inventa la respuesta falsa perfecta.",
      pitch: "Inventa una respuesta falsa tan creíble que los demás voten por ella.",
      example: "«El petricor es el olor ___». Te inventas «a pan quemado». Dos jugadores votan por tu farol → +40 pts. La respuesta real era «a tierra mojada tras la lluvia».",
      rules: [
        "En cada ronda aparece una pregunta con un hueco (palabra rara, dato curioso): leedla en voz alta",
        "Por turnos y en secreto, cada uno se inventa una respuesta falsa creíble (un farol)",
        "Todos los faroles + la respuesta real se mezclan: vota por la que creas verdadera",
        "+30 pts si aciertas la verdad, +20 pts por cada jugador que caiga en tu farol, +15 si escribes la respuesta real sin saberlo",
        "5 rondas, de 3 a 8 jugadores: ¡gana el más listo!",
      ],
      steps: [
        "Aparece una pregunta con un hueco: leedla en voz alta",
        "Cada uno se inventa una respuesta falsa creíble",
        "Todo se mezcla con la verdadera: votad por la buena",
        "Acertar la verdad o engañar a los demás da puntos",
      ],
      story: [
        { text: "El petricor es el olor ___." },
        { who: "Tom", text: "«A pan quemado». Creíble, ¿no?" },
        { who: "Léa", text: "Me lo creo totalmente, voto eso." },
        { text: "¡Farol conseguido para Tom! La respuesta real: a tierra mojada tras la lluvia." },
      ],
    },
  },

  /* ───────── Le Curseur ───────── */
  "longueur-onde": {
    fr: {
      name: "Le Curseur",
      tagline: "Froid ↔ chaud : un indice, visez juste.",
      pitch: "Une échelle (froid ↔ chaud…), une cible cachée, un seul indice : placez le curseur au bon endroit.",
      example: "Échelle « froid ↔ chaud », la cible est tout à gauche. Le Devin dit : « la banquise ». Les autres placent le curseur tout à gauche… pile dedans : +4 !",
      rules: [
        "Chaque manche, un Devin (chacun son tour) voit en secret où se cache la cible sur une échelle entre 2 extrêmes (ex. froid ↔ chaud)",
        "Il dit UN truc qui se place à cet endroit de l'échelle (ex. cible tout à gauche → « la banquise »)",
        "Les autres bougent le curseur ensemble là où ils pensent que l'indice se situe, puis touchent « Valider »",
        "Pile dans la cible : 4 points, tout près : 3, pas loin : 2. Sur un seul tél, les points vont au Devin",
        "Chacun est Devin une fois : le meilleur Devin gagne !",
      ],
      steps: [
        "Le Devin voit en secret où est la cible sur l'échelle (froid ↔ chaud…)",
        "Il dit à voix haute UN truc qui se place là",
        "Les autres placent le curseur au doigt",
        "Pile dedans : +4, tout près : 3, pas loin : 2",
      ],
      story: [
        { text: "Échelle : froid ↔ chaud. Seule Léa voit la cible : tout à gauche." },
        { who: "Léa", text: "La banquise !" },
        { who: "Malik", text: "Facile, on met le curseur tout à gauche !" },
        { text: "Pile dans la cible : +4 pour Léa." },
      ],
    },
    en: {
      name: "The Dial",
      tagline: "Cold ↔ hot: one clue, aim true.",
      pitch: "A scale (cold ↔ hot…), a hidden target, a single clue: set the dial in the right spot.",
      example: "Scale \"cold ↔ hot\", the target is all the way left. The Psychic says: \"Antarctica\". The others slide the dial all the way left… bullseye: +4!",
      rules: [
        "Each round, a Psychic (everyone takes a turn) secretly sees where the target hides on a scale between 2 extremes (e.g. cold ↔ hot)",
        "They say ONE thing that belongs at that spot on the scale (e.g. target all the way left → \"Antarctica\")",
        "The others move the dial together to where they think the clue belongs, then tap \"Lock it in\"",
        "Bullseye: 4 points, very close: 3, not far: 2. On a single phone, the points go to the Psychic",
        "Everyone is the Psychic once: the best Psychic wins!",
      ],
      steps: [
        "The Psychic secretly sees where the target is on the scale (cold ↔ hot…)",
        "They say ONE thing out loud that belongs there",
        "The others move the dial with a finger",
        "Bullseye: +4, very close: 3, not far: 2",
      ],
      story: [
        { text: "Scale: cold ↔ hot. Only Léa sees the target: all the way left." },
        { who: "Léa", text: "Antarctica!" },
        { who: "Malik", text: "Easy, dial all the way left!" },
        { text: "Bullseye: +4 for Léa." },
      ],
    },
    es: {
      name: "El Dial",
      tagline: "Frío ↔ caliente: una pista, apunta bien.",
      pitch: "Una escala (frío ↔ caliente…), un objetivo oculto y una sola pista: coloca el dial en el sitio exacto.",
      example: "Escala «frío ↔ caliente», el objetivo está del todo a la izquierda. El Adivino dice: «la Antártida». Los demás ponen el dial del todo a la izquierda… ¡en el blanco: +4!",
      rules: [
        "En cada ronda, un Devin (por turnos) ve en secreto dónde está el objetivo en una escala entre 2 extremos (p. ej. frío ↔ caliente)",
        "Dice UNA cosa que encaje en ese punto de la escala (p. ej. objetivo del todo a la izquierda → «la Antártida»)",
        "Los demás mueven el dial juntos hasta donde creen que encaja la pista y tocan «Confirmar»",
        "En el blanco: 4 puntos, muy cerca: 3, no muy lejos: 2. En un solo móvil, los puntos son para el Adivino",
        "Cada uno es Adivino una vez: ¡gana el mejor Adivino!",
      ],
      steps: [
        "El Adivino ve en secreto dónde está el objetivo en la escala (frío ↔ caliente…)",
        "Dice en voz alta UNA cosa que encaje ahí",
        "Los demás mueven el dial con el dedo",
        "En el blanco: +4, muy cerca: 3, no muy lejos: 2",
      ],
      story: [
        { text: "Escala: frío ↔ caliente. Solo Léa ve el objetivo: del todo a la izquierda." },
        { who: "Léa", text: "¡La Antártida!" },
        { who: "Malik", text: "Fácil, ¡dial del todo a la izquierda!" },
        { text: "En el blanco: +4 para Léa." },
      ],
    },
  },

  /* ───────── Fais Deviner ───────── */
  "make-guess": {
    fr: {
      name: "Fais Deviner",
      tagline: "Fais deviner le mot sans le dire.",
      pitch: "Décris le mot sans le dire, ton coéquipier doit le trouver avant la fin du chrono.",
      example: "Le mot est « Girafe ». Tu dis : « animal, très grand cou, Afrique » → il trouve ! Touche « Trouvé », mot suivant. Bloqué ? Touche « Passer ».",
      rules: [
        "Formez au moins 2 équipes de 2 joueurs",
        "Celui qui fait deviner tient le téléphone. Le devineur ne regarde pas l'écran !",
        "« Trouvé » = +1, « Passer » = mot suivant sans point, « Annuler le dernier » si tu t'es trompé",
        "Chaque joueur fait deviner une fois par manche",
        "L'équipe avec le plus de mots trouvés gagne !",
      ],
      steps: [
        "Formez des équipes de 2 joueurs",
        "Celui qui fait deviner tient le tél, l'autre ne regarde pas",
        "« Trouvé » : +1. Trop dur : « Passer »",
        "L'équipe qui trouve le plus de mots gagne",
      ],
      story: [
        { text: "Le mot est « girafe »." },
        { who: "Léa", text: "Animal, très grand cou, Afrique !" },
        { who: "Malik", text: "GIRAFE !" },
        { text: "+1 ! Mot suivant, le chrono tourne." },
      ],
    },
    en: {
      name: "Make Them Guess",
      tagline: "Make them guess, don't say the word.",
      pitch: "Describe the word without saying it: your teammate has to get it before the timer runs out.",
      example: "The word is \"Giraffe\". You say: \"animal, super long neck, Africa\" → they get it! Tap \"Got it\", next word. Stuck? Tap \"Skip\".",
      rules: [
        "Make at least 2 teams of 2 players",
        "The clue-giver holds the phone: the guesser doesn't look at the screen!",
        "\"Got it\" = +1, \"Skip\" = next word, no point, Undo button if you made a mistake",
        "Every player gives clues once per round",
        "The team that finds the most words wins!",
      ],
      steps: [
        "Make teams of 2 players",
        "The clue-giver holds the phone, the other doesn't look",
        "\"Got it\": +1. Too hard: \"Skip\"",
        "The team that finds the most words wins",
      ],
      story: [
        { text: "The word is \"giraffe\"." },
        { who: "Léa", text: "Animal, super long neck, Africa!" },
        { who: "Malik", text: "GIRAFFE!" },
        { text: "+1! Next word, the clock is ticking." },
      ],
    },
    es: {
      name: "Haz que Adivinen",
      tagline: "Haz que adivinen la palabra sin decirla.",
      pitch: "Describe la palabra sin decirla: tu compañero tiene que acertarla antes de que acabe el tiempo.",
      example: "La palabra es «Jirafa». Dices: «animal, cuello larguísimo, África» → ¡la acierta! Toca «Acertada», siguiente palabra. ¿Atascado? Toca «Pasar».",
      rules: [
        "Formad al menos 2 equipos de 2 jugadores",
        "Quien da las pistas sujeta el móvil: ¡el que adivina no mira la pantalla!",
        "«Acertada» = +1, «Pasar» = siguiente palabra sin punto, botón Deshacer si te has equivocado",
        "Cada jugador da pistas una vez por ronda",
        "¡Gana el equipo que acierte más palabras!",
      ],
      steps: [
        "Formad equipos de 2 jugadores",
        "Quien da las pistas sujeta el móvil, el otro no mira",
        "«Acertada»: +1. Muy difícil: «Pasar»",
        "Gana el equipo que acierte más palabras",
      ],
      story: [
        { text: "La palabra es «jirafa»." },
        { who: "Léa", text: "¡Animal, cuello larguísimo, África!" },
        { who: "Malik", text: "¡JIRAFA!" },
        { text: "¡+1! Siguiente palabra, el reloj corre." },
      ],
    },
  },

  /* ───────── Deviner le Mot ───────── */
  "guess-word": {
    fr: {
      name: "Deviner le Mot",
      tagline: "Le tél sur le front, devine le mot.",
      pitch: "Le tél sur le front, tes potes te font deviner le mot sans le dire.",
      example: "Le mot est « Girafe ». Tes potes : « animal », « très grand cou », « Afrique »… Tu cries « Girafe ! », tu penches la tête en avant, mot suivant. 60 secondes, combien tu en trouves ?",
      rules: [
        "Choisis tes thèmes et la durée du tour",
        "Mets le tél sur ton front, en travers, écran vers les autres : tu ne vois pas le mot",
        "Les autres te donnent des indices (ou miment)",
        "Penche la tête en avant (écran vers le sol) si tu as trouvé, en arrière (écran vers le plafond) pour passer",
        "Chacun son tour : seul le devineur marque, le plus de mots trouvés gagne ! (Capteur capricieux ? des boutons de secours sont en bas de l'écran)",
      ],
      steps: [
        "Mets le tél sur ton front, écran vers les autres",
        "Les autres te donnent des indices ou miment",
        "Trouvé : penche en avant. On passe : en arrière",
        "Le plus de mots dans le temps gagne",
      ],
      story: [
        { text: "Le tél est sur le front d'Inès. Le mot : « girafe »." },
        { who: "Tom", text: "C'est un animal !" },
        { who: "Léa", text: "Avec un cou immense !" },
        { who: "Inès", text: "GIRAFE !" },
      ],
    },
    en: {
      name: "Guess the Word",
      tagline: "Phone on your head, guess the word.",
      pitch: "Phone on your forehead: your friends get you to guess the word without saying it.",
      example: "The word is \"Giraffe\". Your friends: \"animal\", \"super long neck\", \"Africa\"… You yell \"Giraffe!\", tip your head forward, next word. 60 seconds: how many can you get?",
      rules: [
        "Pick your themes and how long each turn lasts",
        "Put the phone sideways on your forehead, screen facing the others: you can't see the word",
        "The others give you clues (or act it out)",
        "Tip your head forward (screen to the floor) if you got it, back (screen to the ceiling) to skip",
        "Everyone takes a turn: only the guesser scores, most words found wins! (Sensor acting up? Backup buttons sit at the bottom of the screen)",
      ],
      steps: [
        "Put the phone on your forehead, screen facing the others",
        "The others give you clues or act it out",
        "Got it: tip forward. Skip: tip back",
        "Most words before time runs out wins",
      ],
      story: [
        { text: "The phone is on Inès's forehead. The word: \"giraffe\"." },
        { who: "Tom", text: "It's an animal!" },
        { who: "Léa", text: "With a massive neck!" },
        { who: "Inès", text: "GIRAFFE!" },
      ],
    },
    es: {
      name: "Adivina la Palabra",
      tagline: "El móvil en la frente, adivina la palabra.",
      pitch: "Con el móvil en la frente, tus amigos te hacen adivinar la palabra sin decirla.",
      example: "La palabra es «Jirafa». Tus amigos: «animal», «cuello larguísimo», «África»… Gritas «¡Jirafa!», inclinas la cabeza hacia delante y siguiente palabra. 60 segundos: ¿cuántas aciertas?",
      rules: [
        "Elige tus temas y la duración del turno",
        "Ponte el móvil de lado en la frente, con la pantalla hacia los demás: tú no ves la palabra",
        "Los demás te dan pistas (o hacen mímica)",
        "Inclina la cabeza hacia delante (pantalla al suelo) si la has acertado, hacia atrás (pantalla al techo) para pasar",
        "Por turnos: solo puntúa quien adivina, ¡gana quien acierte más palabras! (¿Falla el sensor? Hay botones de reserva abajo en la pantalla)",
      ],
      steps: [
        "Ponte el móvil en la frente, con la pantalla hacia los demás",
        "Los demás te dan pistas o hacen mímica",
        "Acertada: inclina hacia delante. Pasar: hacia atrás",
        "Gana quien acierte más palabras a tiempo",
      ],
      story: [
        { text: "El móvil está en la frente de Inès. La palabra: «jirafa»." },
        { who: "Tom", text: "¡Es un animal!" },
        { who: "Léa", text: "¡Con un cuello enorme!" },
        { who: "Inès", text: "¡JIRAFA!" },
      ],
    },
  },

  /* ───────── Catégorie Chrono ───────── */
  "category-chrono": {
    fr: {
      name: "Catégorie Chrono",
      tagline: "Une catégorie, un chrono qui fond.",
      pitch: "Une catégorie, chacun son tour, et le chrono raccourcit à chaque mot.",
      example: "Catégorie « Un fruit ». Pomme, banane, kiwi… le chrono passe de 10 s à 9,5 s, puis 9 s… Tom bloque sur « euh… » : il perd une vie !",
      rules: [
        "Une catégorie s'affiche (ex. « un fruit », « un truc qu'on trouve dans un frigo »)",
        "Chacun son tour, dis un mot de la catégorie avant la fin du chrono",
        "Une personne tient le téléphone et appuie sur « Validé » / « Raté » pour chacun : le prénom du suivant s'affiche aussitôt et son chrono part. Pas besoin de se passer le tél !",
        "Pas de répétition ! Le chrono raccourcit de 0,5 s à chaque mot (3 s minimum)",
        "Tu bloques ou le temps tombe : tu perds une vie (1 à 3 vies, au choix)",
        "Le dernier en vie gagne",
      ],
      steps: [
        "Une catégorie s'affiche",
        "Chacun son tour, dis un mot ; une personne tient le tél et appuie sur « Validé » ou « Raté »",
        "Pas de répétition, et le chrono raccourcit",
        "Tu bloques ? Une vie en moins. Le dernier debout gagne",
      ],
      story: [
        { text: "Catégorie : un fruit" },
        { who: "Léa", text: "Pomme !" },
        { who: "Malik", text: "Banane !" },
        { who: "Tom", text: "Kiwi… non attends, euh…" },
        { text: "Temps écoulé : Tom perd une vie." },
      ],
    },
    en: {
      name: "Category Clock",
      tagline: "One category, a shrinking timer.",
      pitch: "One category, everyone takes a turn, and the timer gets shorter with every word.",
      example: "Category: \"A fruit\". Apple, banana, kiwi… the timer drops from 10 s to 9.5 s, then 9 s… Tom freezes on \"uhh…\": he loses a life!",
      rules: [
        "A category appears (e.g. \"a fruit\", \"something you find in a fridge\")",
        "Take turns saying a word from the category before the timer runs out",
        "One person holds the phone and taps \"Good\" / \"Fail\" for everyone: the next name pops up right away and their timer starts. No need to pass the phone!",
        "No repeats! The timer gets 0.5 s shorter with every word (3 s minimum)",
        "If you freeze or time runs out, you lose a life (1 to 3 lives, your choice)",
        "The last one standing wins",
      ],
      steps: [
        "A category appears",
        "Take turns saying a word; one person holds the phone and taps \"Good\" or \"Fail\"",
        "No repeats, and the timer keeps shrinking",
        "Stuck? You lose a life. Last one standing wins",
      ],
      story: [
        { text: "Category: a fruit" },
        { who: "Léa", text: "Apple!" },
        { who: "Malik", text: "Banana!" },
        { who: "Tom", text: "Kiwi… no wait, uhh…" },
        { text: "Time's up: Tom loses a life." },
      ],
    },
    es: {
      name: "Categoría Contrarreloj",
      tagline: "Una categoría y un reloj que se acorta.",
      pitch: "Una categoría, cada uno en su turno, y el tiempo se acorta con cada palabra.",
      example: "Categoría: «Una fruta». Manzana, plátano, kiwi… el reloj baja de 10 s a 9,5 s, luego a 9 s… Tom se queda en «eh…»: ¡pierde una vida!",
      rules: [
        "Aparece una categoría (p. ej. «una fruta», «algo que hay en una nevera»)",
        "Por turnos, di una palabra de la categoría antes de que se acabe el tiempo",
        "Una persona sostiene el móvil y toca «Vale» / «Fallo» para todos: el nombre del siguiente aparece al instante y arranca su tiempo. ¡No hace falta pasarse el móvil!",
        "¡Sin repetir! El tiempo se acorta 0,5 s con cada palabra (3 s como mínimo)",
        "Si te bloqueas o se acaba el tiempo, pierdes una vida (de 1 a 3 vidas, a elegir)",
        "Gana el último que quede en pie",
      ],
      steps: [
        "Aparece una categoría",
        "Por turnos, di una palabra; una persona sostiene el móvil y toca «Vale» o «Fallo»",
        "Sin repetir, y el tiempo se acorta",
        "¿Te bloqueas? Pierdes una vida. Gana el último en pie",
      ],
      story: [
        { text: "Categoría: una fruta" },
        { who: "Léa", text: "¡Manzana!" },
        { who: "Malik", text: "¡Plátano!" },
        { who: "Tom", text: "Kiwi… no, espera, eh…" },
        { text: "Se acabó el tiempo: Tom pierde una vida." },
      ],
    },
  },

  /* ───────── Mots Espions ───────── */
  "code-names": {
    fr: {
      name: "Mots Espions",
      tagline: "Deux équipes, un seul mot-indice.",
      pitch: "Deux équipes, deux chefs, une grille de 25 mots : fais deviner les mots de ton équipe avec UN seul mot-indice.",
      example: "Léa est cheffe des Rouges. Sur la carte secrète, « Lune » et « Fusée » sont rouges. Elle dit à voix haute « Espace, 2 » et se tait. Malik touche Lune : rouge, bien vu ! Puis Étoile… neutre : fin du tour, au tour des Bleus.",
      rules: [
        "Formez 2 équipes (rouge et bleue), chacune choisit son chef",
        "Seuls les chefs regardent la carte secrète : elle montre les mots rouges, bleus, neutres (à personne) et la bombe",
        "À son tour, le chef dit à voix haute UN mot + un nombre (rien à taper) : combien de cartes de son équipe vont avec. Puis il se tait !",
        "Son équipe touche les cartes. Carte de l'équipe : on continue. Neutre ou adverse : fin du tour. Fini avant ? 1 tap sur « Au tour des Bleus ». (Option : touchez le nombre annoncé pour limiter à nombre + 1 essais)",
        "La bombe = défaite immédiate. La première équipe qui trouve tous ses mots (9 ou 8) gagne !",
      ],
      steps: [
        "Deux équipes, chacune son chef",
        "Seuls les chefs regardent la carte secrète",
        "Le chef dit un mot + un nombre, puis se tait",
        "Son équipe touche les cartes. Gare à la bombe !",
      ],
      story: [
        { who: "Léa", text: "Espace, 2." },
        { who: "Malik", text: "Lune, c'est sûr." },
        { text: "Lune : rouge ! Encore 2 essais." },
        { who: "Malik", text: "Et… Étoile ?" },
        { text: "Carte neutre : fin du tour. Au tour des Bleus !" },
      ],
    },
    en: {
      name: "Spy Words",
      tagline: "Two teams, one single clue word.",
      pitch: "Two teams, two captains, a grid of 25 words: get your team to find its words with ONE single clue word.",
      example: "Léa is the Red captain. On the secret key, “Moon” and “Rocket” are red. She says “Space, 2” out loud and goes silent. Malik taps Moon: red, nice! Then Star… neutral: turn over, Blue team's turn.",
      rules: [
        "Make 2 teams (red and blue), each one picks its captain",
        "Only the captains look at the secret key: it shows the red, blue and neutral (nobody's) words, and the bomb",
        "On their turn, the captain says ONE word + a number out loud (nothing to type): how many of their team's cards go with it. Then they stay silent!",
        "Their team taps the cards. Team card: keep going. Neutral or other team's card: end of turn. Done early? One tap on “Over to Blue”. (Optional: tap the number given to allow number + 1 guesses)",
        "The bomb = instant defeat. The first team to find all its words (9 or 8) wins!",
      ],
      steps: [
        "Two teams, each with a captain",
        "Only the captains look at the secret key",
        "The captain says one word + a number, then goes silent",
        "Their team taps the cards. Watch out for the bomb!",
      ],
      story: [
        { who: "Léa", text: "Space, 2." },
        { who: "Malik", text: "Moon, for sure." },
        { text: "Moon: red! 2 guesses left." },
        { who: "Malik", text: "And… Star?" },
        { text: "Neutral card: end of turn. Blue team's turn!" },
      ],
    },
    es: {
      name: "Palabras Espía",
      tagline: "Dos equipos, una sola palabra pista.",
      pitch: "Dos equipos, dos jefes y un tablero de 25 palabras: haz que tu equipo encuentre las suyas con UNA sola palabra pista.",
      example: "Léa es la jefa de los Rojos. En el mapa secreto, «Luna» y «Cohete» son rojas. Dice en voz alta «Espacio, 2» y se calla. Malik toca Luna: ¡roja, bien visto! Luego Estrella… neutral: fin del turno, les toca a los Azules.",
      rules: [
        "Formad 2 equipos (rojo y azul) y cada uno elige a su jefe",
        "Solo los jefes miran el mapa secreto: muestra las palabras rojas, azules, neutrales (de nadie) y la bomba",
        "En su turno, el jefe dice en voz alta UNA palabra + un número (nada que escribir): cuántas cartas de su equipo van con ella. ¡Luego se calla!",
        "Su equipo toca las cartas. Carta del equipo: seguís. Neutral o rival: fin del turno. ¿Acabáis antes? Un toque en «Turno de los Azules». (Opcional: tocad el número dicho para tener número + 1 intentos)",
        "La bomba = derrota inmediata. ¡Gana el primer equipo que encuentre todas sus palabras (9 u 8)!",
      ],
      steps: [
        "Dos equipos, cada uno con su jefe",
        "Solo los jefes miran el mapa secreto",
        "El jefe dice una palabra + un número y se calla",
        "Su equipo toca las cartas. ¡Ojo con la bomba!",
      ],
      story: [
        { who: "Léa", text: "Espacio, 2." },
        { who: "Malik", text: "Luna, seguro." },
        { text: "Luna: ¡roja! Quedan 2 intentos." },
        { who: "Malik", text: "¿Y… Estrella?" },
        { text: "Carta neutral: fin del turno. ¡Les toca a los Azules!" },
      ],
    },
  },

  /* ───────── Pensez Pareil ───────── */
  "pensez-pareil": {
    fr: {
      name: "Pensez Pareil",
      tagline: "À deux, dites le même mot en même temps.",
      pitch: "À deux, un thème, et à « 3, 2, 1 » vous dites votre mot en même temps. Tombez sur le même !",
      example: "Thème : « un plat pour un dimanche soir ». 3, 2, 1… « Pâtes ! » « Pâtes ! » → SYNC ! Un tap sur « Même mot ! » et le combo monte.",
      rules: [
        "À deux, le tél posé entre vous : un thème s'affiche (ex. « un fruit », « notre prochaine destination »)",
        "Chacun pense à un mot dans sa tête, sans rien dire",
        "Lancez « 3, 2, 1 » : à « 1 », vous dites votre mot à voix haute en même temps",
        "Exactement le même mot → touchez « Même mot ! » : SYNC, +100 pts ensemble (« pâtes » ≠ « spaghetti » : les synonymes ne comptent pas, c'est vous qui jugez)",
        "Enchaînez les syncs : la série fait grimper le combo (+25 pts/cran). 8 manches par partie, et votre niveau de complicité monte de partie en partie",
      ],
      steps: [
        "À deux : un thème s'affiche",
        "Chacun pense à un mot, sans rien dire",
        "3, 2, 1… dites-le en même temps !",
        "Même mot ? Un tap, SYNC : vous marquez ensemble",
      ],
      story: [
        { text: "Thème : un plat pour un dimanche soir" },
        { text: "3, 2, 1…" },
        { who: "Léa", text: "Pâtes !" },
        { who: "Tom", text: "Pâtes !" },
        { text: "« Même mot ! » SYNC, le combo monte." },
      ],
    },
    en: {
      name: "Think Alike",
      tagline: "As a pair, say the same word at once.",
      pitch: "As a pair, one theme, and on \"3, 2, 1\" you both say your word. Land on the same one!",
      example: "Theme: \"a dish for a Sunday night\". 3, 2, 1… \"Pasta!\" \"Pasta!\" → SYNC! One tap on \"Same word!\" and the combo goes up.",
      rules: [
        "Two players, the phone between you: a theme appears (e.g. \"a fruit\", \"our next trip\")",
        "Each of you thinks of a word, silently",
        "Start \"3, 2, 1\": on \"1\", you both say your word out loud",
        "Exactly the same word → tap \"Same word!\": SYNC, +100 pts together (\"pasta\" ≠ \"spaghetti\": synonyms don't count, you two judge)",
        "Chain your syncs: the streak boosts the combo (+25 pts per level). 8 rounds per game, and your connection level rises game after game",
      ],
      steps: [
        "Two players: a theme appears",
        "Each of you thinks of a word, silently",
        "3, 2, 1… say it together!",
        "Same word? One tap, SYNC: you score together",
      ],
      story: [
        { text: "Theme: a dish for a Sunday night" },
        { text: "3, 2, 1…" },
        { who: "Léa", text: "Pasta!" },
        { who: "Tom", text: "Pasta!" },
        { text: "\"Same word!\" SYNC, the combo goes up." },
      ],
    },
    es: {
      name: "Pensad Igual",
      tagline: "En pareja, decid la misma palabra a la vez.",
      pitch: "En pareja, un tema y, al «3, 2, 1», decís vuestra palabra a la vez. ¡Coincidid!",
      example: "Tema: «un plato para un domingo por la noche». 3, 2, 1… «¡Pasta!» «¡Pasta!» → ¡SYNC! Un toque en «¡Misma palabra!» y el combo sube.",
      rules: [
        "En pareja, con el móvil entre los dos: aparece un tema (p. ej. «una fruta», «nuestro próximo viaje»)",
        "Cada uno piensa una palabra, en silencio",
        "Lanzad «3, 2, 1»: al «1», decís vuestra palabra en voz alta a la vez",
        "Exactamente la misma palabra → tocad «¡Misma palabra!»: SYNC, +100 pts juntos («pasta» ≠ «espaguetis»: los sinónimos no cuentan, juzgáis vosotros)",
        "Encadenad syncs: la racha hace subir el combo (+25 pts por nivel). 8 rondas por partida, y vuestro nivel de complicidad sube partida tras partida",
      ],
      steps: [
        "En pareja: aparece un tema",
        "Cada uno piensa una palabra, en silencio",
        "3, 2, 1… ¡decidla a la vez!",
        "¿Misma palabra? Un toque, SYNC: puntuáis juntos",
      ],
      story: [
        { text: "Tema: un plato para un domingo por la noche" },
        { text: "3, 2, 1…" },
        { who: "Léa", text: "¡Pasta!" },
        { who: "Tom", text: "¡Pasta!" },
        { text: "«¡Misma palabra!» SYNC, el combo sube." },
      ],
    },
  },

  /* ───────── Tu me connais ? ───────── */
  "couple-quiz": {
    fr: {
      name: "Tu me connais ?",
      tagline: "Devine ce que l'autre a répondu.",
      pitch: "À deux : devine ce que l'autre a répondu sur lui-même.",
      example: "« Plutôt plage ou montagne ? » Léa répond « montagne » en secret. Tom devine « plage »… raté ! Léa doit s'expliquer.",
      rules: [
        "À deux, sur un seul téléphone",
        "L'un répond en secret à une question sur lui-même (2 choix)",
        "L'autre devine sa réponse : juste = 1 point pour celui qui devine",
        "Les rôles s'alternent à chaque question",
        "À la fin : votre taux de complicité !",
      ],
      steps: [
        "L'un répond en secret à une question sur lui",
        "L'autre devine sa réponse",
        "Bonne réponse = 1 point, puis on inverse",
        "À la fin : votre taux de complicité",
      ],
      story: [
        { text: "Plutôt plage ou montagne ?" },
        { who: "Léa", text: "(en secret) Montagne." },
        { who: "Tom", text: "Plage, évidemment !" },
        { who: "Léa", text: "Raté. Tu me connais vraiment ?" },
      ],
    },
    en: {
      name: "Do You Know Me?",
      tagline: "Guess what the other one answered.",
      pitch: "For two: guess what the other person answered about themselves.",
      example: "\"Beach or mountains?\" Léa secretly answers \"mountains\". Tom guesses \"beach\"… wrong! Léa has some explaining to do.",
      rules: [
        "Two players, one phone",
        "One of you secretly answers a question about yourself (2 options)",
        "The other guesses the answer: right = 1 point for the guesser",
        "Roles swap after every question",
        "At the end: your connection score!",
      ],
      steps: [
        "One of you secretly answers a question about yourself",
        "The other guesses the answer",
        "Right answer = 1 point, then swap",
        "At the end: your connection score",
      ],
      story: [
        { text: "Beach or mountains?" },
        { who: "Léa", text: "(in secret) Mountains." },
        { who: "Tom", text: "Beach, obviously!" },
        { who: "Léa", text: "Wrong. Do you even know me?" },
      ],
    },
    es: {
      name: "¿Me Conoces?",
      tagline: "Adivina lo que ha respondido el otro.",
      pitch: "En pareja: adivina lo que el otro ha respondido sobre sí mismo.",
      example: "«¿Playa o montaña?». Léa responde «montaña» en secreto. Tom adivina «playa»… ¡fallo! Léa tiene que dar explicaciones.",
      rules: [
        "En pareja, con un solo móvil",
        "Uno responde en secreto a una pregunta sobre sí mismo (2 opciones)",
        "El otro adivina su respuesta: acierto = 1 punto para quien adivina",
        "Los papeles se intercambian en cada pregunta",
        "Al final: ¡vuestro nivel de complicidad!",
      ],
      steps: [
        "Uno responde en secreto a una pregunta sobre sí mismo",
        "El otro adivina su respuesta",
        "Acierto = 1 punto, y luego al revés",
        "Al final: vuestro nivel de complicidad",
      ],
      story: [
        { text: "¿Playa o montaña?" },
        { who: "Léa", text: "(en secreto) Montaña." },
        { who: "Tom", text: "¡Playa, obviamente!" },
        { who: "Léa", text: "Fallo. ¿De verdad me conoces?" },
      ],
    },
  },

  /* ───────── La Tournée ───────── */
  picolette: {
    fr: {
      name: "La Tournée",
      tagline: "Le tél lit la carte, le groupe joue.",
      pitch: "Le jeu de cartes de soirée : le téléphone lit une carte, le groupe joue, le perdant ramasse.",
      example: "Max lit la carte : « Qui est le plus mauvais perdant ? ». Tout le monde pointe Léa. Max touche « Désigner un perdant », choisit Léa, et la roulette tombe sur 2 gorgées ou un gage. Carte suivante !",
      rules: [
        "Le téléphone ne sert qu'à lire les cartes et désigner le perdant : tout se joue à l'oral",
        "Paquet Découverte offert (60 cartes) ; avec Zinzin+, choisis tes packs (Soft, Coquin 18+, Trash, Quiz…)",
        "Cartes : vote du groupe, tour de table, règles live, avoue, jokers…",
        "Carte « Tu préfères » : la minorité perd ; égalité ou unanimité, tout le monde prend",
        "Le lecteur touche « Désigner un perdant » : la roulette tire 1 à 3 gorgées ou un gage",
        "Personne n'est obligé de boire de l'alcool : eau, soft, tout compte",
      ],
      steps: [
        "Celui qui tient le tél lit la carte à voix haute",
        "Toute la table la joue : vote, tour de table, défi…",
        "« Désigner un perdant » : la roulette tire 1 à 3 gorgées ou un gage",
        "Une gorgée de zinzin, c'est de ce que tu veux : eau et soft comptent, personne n'est obligé",
      ],
      story: [
        { text: "Votez : qui est le plus mauvais perdant ?" },
        { who: "Léa", text: "Max. Évidemment Max." },
        { who: "Malik", text: "Désolé Max…" },
        { who: "Max", text: "Bon. Je touche « Désigner un perdant »…" },
        { text: "2 gorgées ou un gage. Carte suivante !" },
      ],
    },
    en: {
      name: "The Round",
      tagline: "The phone reads, the group plays.",
      pitch: "The party card game: the phone reads a card, the group plays, the loser pays up.",
      example: "Max reads the card: \"Who has the worst playlist?\" Everyone points at Léa. Max taps \"Pick a loser\", picks Léa, and the wheel lands on 2 zinzin sips or a dare. Next card!",
      rules: [
        "The phone just reads the cards and picks the loser: everything else is played out loud",
        "A free Discovery deck (60 cards); with Zinzin+, pick your packs (Soft, Naughty 18+, Wild, Quiz…)",
        "Cards: group votes, round-the-table, live rules, confessions, jokers…",
        "\"Would you rather\" cards: the minority loses; tie or unanimous, everyone takes it",
        "The reader taps \"Pick a loser\": the wheel draws 1 to 3 zinzin sips or a dare",
        "Nobody has to drink alcohol: water, soft drinks, everything counts",
      ],
      steps: [
        "Whoever holds the phone reads the card out loud",
        "The whole table plays it: vote, round-the-table, challenge…",
        "\"Pick a loser\": the wheel draws 1 to 3 zinzin sips or a dare",
        "A zinzin sip is whatever you like: water and soft drinks count, nobody has to",
      ],
      story: [
        { text: "Vote: who has the worst playlist?" },
        { who: "Léa", text: "Max. Obviously Max." },
        { who: "Malik", text: "Sorry Max…" },
        { who: "Max", text: "Fine. I'll tap \"Pick a loser\"…" },
        { text: "2 zinzin sips or a dare. Next card!" },
      ],
    },
    es: {
      name: "La Ronda",
      tagline: "El móvil lee la carta, el grupo juega.",
      pitch: "El juego de cartas de fiesta: el móvil lee una carta, el grupo juega y el que pierde paga.",
      example: "Max lee la carta: «¿Quién es el peor perdedor?». Todos señalan a Léa. Max toca «Señalar a un perdedor», elige a Léa y la ruleta cae en 2 tragos de zinzin o un reto. ¡Siguiente carta!",
      rules: [
        "El móvil solo sirve para leer las cartas y señalar al perdedor: todo se juega en voz alta",
        "Mazo Descubrimiento gratis (60 cartas); con Zinzin+, elige tus packs (Suave, Pícaro 18+, Bestia, Quiz…)",
        "Cartas: votación del grupo, ronda por la mesa, reglas en vivo, confiesa, comodines…",
        "Carta «¿Qué prefieres?»: pierde la minoría; si hay empate o unanimidad, paga todo el mundo",
        "Quien lee toca «Señalar a un perdedor»: la ruleta saca de 1 a 3 tragos de zinzin o un reto",
        "Nadie está obligado a beber alcohol: agua, refrescos, todo vale",
      ],
      steps: [
        "Quien tiene el móvil lee la carta en voz alta",
        "Toda la mesa la juega: votación, ronda, reto…",
        "«Señalar a un perdedor»: la ruleta saca de 1 a 3 tragos o un reto",
        "Un trago de zinzin es de lo que quieras: agua y refrescos cuentan, nadie está obligado",
      ],
      story: [
        { text: "Votad: ¿quién es el peor perdedor?" },
        { who: "Léa", text: "Max. Obviamente Max." },
        { who: "Malik", text: "Lo siento, Max…" },
        { who: "Max", text: "Vale. Toco «Señalar a un perdedor»…" },
        { text: "2 tragos de zinzin o un reto. ¡Siguiente carta!" },
      ],
    },
  },

  /* ───────── Le Train Fou ───────── */
  tgv: {
    fr: {
      name: "Le Train Fou",
      tagline: "Plus ou moins ? Enchaîne les wagons.",
      pitch: "Plus ou moins ? Enchaîne les wagons sans te tromper.",
      example: "Carte posée : un 8. Tu dis « plus »… c'est un roi, wagon suivant ! « Moins » sur une dame… c'est un as : raté, 2 gorgées ou un gage, et retour au wagon 1.",
      rules: [
        "Choisis le nombre de wagons avant de lancer : un wagon = une bonne réponse d'affilée",
        "À ton tour : pari Plus, Moins ou Égalité sur la carte suivante. Ordre : 2, 3… 10, Valet, Dame, Roi, As (le plus fort)",
        "Bien joué → wagon suivant · Raté → peine (1 à 3 gorgées ou un gage) et retour au wagon 1 : tu rejoues jusqu'à la gare",
        "Tous les wagons enchaînés = arrivée en gare, tu distribues",
        "Eau et soft acceptés · jamais si tu conduis",
      ],
      steps: [
        "À ton tour : plus, moins ou égal sur la carte suivante",
        "Bon pari : wagon suivant",
        "Raté : 1 à 3 gorgées ou un gage, et retour au début",
        "Tous les wagons passés : c'est toi qui distribues",
      ],
      story: [
        { text: "Carte posée : un 8." },
        { who: "Hugo", text: "Plus !" },
        { text: "Un roi. Wagon suivant !" },
        { who: "Hugo", text: "Une dame… je dis moins." },
        { text: "Un as. Raté : 2 gorgées ou un gage, retour au wagon 1." },
      ],
    },
    en: {
      name: "The Crazy Train",
      tagline: "Higher or lower? Ride the train.",
      pitch: "Higher or lower? Clear every carriage without a single mistake.",
      example: "Card down: an 8. You say \"higher\"… it's a king, next carriage! \"Lower\" on a queen… it's an ace: wrong, 2 zinzin sips or a dare, and back to carriage 1.",
      rules: [
        "Pick the number of carriages before you start: one carriage = one right guess in a row",
        "On your turn: bet Higher, Lower or Same on the next card. Order: 2, 3… 10, Jack, Queen, King, Ace (highest)",
        "Right → next carriage · Wrong → penalty (1 to 3 zinzin sips or a dare) and back to carriage 1: you keep playing until the station",
        "Clear every carriage = you reach the station and hand out the sips",
        "Water and soft drinks count · never if you're driving",
      ],
      steps: [
        "On your turn: higher, lower or same on the next card",
        "Good bet: next carriage",
        "Wrong: 1 to 3 zinzin sips or a dare, and back to the start",
        "Clear every carriage: you get to hand them out",
      ],
      story: [
        { text: "Card down: an 8." },
        { who: "Hugo", text: "Higher!" },
        { text: "A king. Next carriage!" },
        { who: "Hugo", text: "A queen… I'll say lower." },
        { text: "An ace. Wrong: 2 zinzin sips or a dare, back to carriage 1." },
      ],
    },
    es: {
      name: "El Tren Loco",
      tagline: "¿Mayor o menor? Sube al tren.",
      pitch: "¿Mayor o menor? Encadena los vagones sin equivocarte.",
      example: "Carta boca arriba: un 8. Dices «mayor»… es un rey, ¡siguiente vagón! «Menor» con una reina… es un as: fallo, 2 tragos de zinzin o un reto, y vuelta al vagón 1.",
      rules: [
        "Elige el número de vagones antes de empezar: un vagón = un acierto seguido",
        "En tu turno: apuesta Mayor, Menor o Igual para la siguiente carta. Orden: 2, 3… 10, Jota, Reina, Rey, As (la más alta)",
        "Acierto → siguiente vagón · Fallo → castigo (de 1 a 3 tragos de zinzin o un reto) y vuelta al vagón 1: sigues jugando hasta la estación",
        "Todos los vagones encadenados = llegas a la estación y repartes tú",
        "Vale agua y refrescos · nunca si conduces",
      ],
      steps: [
        "En tu turno: mayor, menor o igual para la siguiente carta",
        "Buena apuesta: siguiente vagón",
        "Fallo: de 1 a 3 tragos o un reto, y vuelta al principio",
        "Todos los vagones superados: repartes tú",
      ],
      story: [
        { text: "Carta boca arriba: un 8." },
        { who: "Hugo", text: "¡Mayor!" },
        { text: "Un rey. ¡Siguiente vagón!" },
        { who: "Hugo", text: "Una reina… digo menor." },
        { text: "Un as. Fallo: 2 tragos o un reto, vuelta al vagón 1." },
      ],
    },
  },
  /* ───────── Le Faux Témoin ───────── */
  "faux-temoin": {
    fr: {
      name: "Le Faux Témoin",
      tagline: "Tout le monde a vu la scène. Sauf un.",
      pitch: "Une scène défile 5 secondes sous les yeux de chacun… sauf un, le Faux Témoin. Ensuite, tout se passe à l'oral : vous vous interrogez dans l'ordre tiré par l'app, à lui de bluffer pour ne pas se faire griller.",
      example: "Une plage : un parasol rouge, 4 blobs, un chien. L'app affiche l'ordre : Léa → Tom, Tom → Malik, Malik → Léa. Léa demande : « De quelle couleur était le blob qui levait les bras ? ». Tom : « Euh… bleu ? ». Puis Tom demande à Malik combien il y avait de mouettes. Réponse vague, question louche… c'est lui le Faux Témoin ?",
      rules: [
        "Chacun à son tour regarde la scène pendant 5 secondes. Le Faux Témoin, lui, voit seulement un écran « tu n'as rien vu ».",
        "Téléphone au centre, l'app affiche l'ordre des questions (ex. « Léa → Tom ») : chacun pose une question et en reçoit une, tout à voix haute. On ne touche plus le tél.",
        "En panne d'idée ? Le bouton discret « Une idée de question ? » en propose une tirée de la vraie scène, sans la réponse. Facultatif.",
        "Le Faux Témoin pose ses questions et répond comme les autres… au bluff. Méfiez-vous des réponses floues et des questions bizarres.",
        "Encore un tour de questions si vous voulez, puis vote : à trois, chacun pointe un suspect et le plus désigné est éliminé (égalité : on revote entre les ex æquo). Faux Témoin ? Démasqué ! Innocent ? La partie continue : nouveau tour de questions, puis nouveau vote.",
        "Les témoins gagnent quand tous les Faux Témoins sont démasqués. Les Faux Témoins gagnent dès qu'ils sont aussi nombreux que les témoins restants (ex. 1 Faux Témoin face à 1 témoin).",
        "Dès 6 joueurs, vous pouvez jouer avec 2 Faux Témoins (3 dès 9) : chacun ne voit rien et ne sait pas qui sont les autres.",
        "À la fin, la scène s'affiche à nouveau (avec les réponses des idées tirées) : on vérifie qui a menti.",
        "Points : à chaque innocent éliminé, chaque Faux Témoin encore en jeu marque +2 (il les garde même s'il est démasqué ensuite), +3 de bonus si les Faux Témoins gagnent. Chaque Faux Témoin démasqué rapporte +3 à chaque témoin encore en jeu.",
      ],
      steps: [
        "Regarde la scène 5 secondes",
        "L'app tire l'ordre : questions à voix haute",
        "Votez : le plus désigné est éliminé",
        "La scène réapparaît : qui a menti ?",
      ],
      story: [
        { who: "Léa", text: "Tom, combien d'oiseaux ?" },
        { who: "Tom", text: "Euh… 3 ? Ou 4." },
        { who: "Tom", text: "Malik, le blob rouge portait quoi ?" },
        { who: "Malik", text: "Question bizarre… y avait pas de blob rouge !" },
        { text: "Tom est démasqué." },
      ],
    },
    en: {
      name: "The Fake Witness",
      tagline: "Everyone saw the scene. Except one.",
      pitch: "A scene flashes in front of everyone for 5 seconds… except one player, the Fake Witness. Then it all happens out loud: you grill each other in the order the app picks, and they have to bluff to avoid getting caught.",
      example: "A beach: a red umbrella, 4 blobs, a dog. The app shows the order: Léa → Tom, Tom → Malik, Malik → Léa. Léa asks: \"What color was the blob with its arms up?\". Tom: \"Uh… blue?\". Then Tom asks Malik how many seagulls there were. Vague answer, fishy question… is he the Fake Witness?",
      rules: [
        "One by one, look at the scene for 5 seconds. The Fake Witness only gets a \"you saw nothing\" screen.",
        "Phone in the middle, the app shows the question order (e.g. \"Léa → Tom\"): everyone asks one question and answers one, all out loud. No more touching the phone.",
        "Out of ideas? The small \"Need a question idea?\" button suggests one taken from the real scene, without the answer. Optional.",
        "The Fake Witness asks and answers like everyone else… by bluffing. Watch out for vague answers and weird questions.",
        "One more round of questions if you like, then vote: on three, everyone points at a suspect and the most-pointed-at player is out (a tie: vote again between the tied players). A Fake Witness? Busted! Innocent? The game goes on: a new round of questions, then a new vote.",
        "The witnesses win once every Fake Witness is caught. The Fake Witnesses win as soon as there are as many of them as witnesses left (e.g. 1 Fake Witness against 1 witness).",
        "From 6 players, you can play with 2 Fake Witnesses (3 from 9): each one sees nothing and doesn't know who the others are.",
        "At the end, the scene shows up again (with the answers to any ideas drawn): check who lied.",
        "Points: for each innocent kicked out, every Fake Witness still in the game scores +2 (kept even if caught later), +3 bonus if the Fake Witnesses win. Each Fake Witness caught gives +3 to every witness still in the game.",
      ],
      steps: [
        "Look at the scene for 5 seconds",
        "The app picks the order: questions out loud",
        "Vote: the most-pointed-at player is out",
        "The scene shows up again: who lied?",
      ],
      story: [
        { who: "Léa", text: "Tom, how many birds?" },
        { who: "Tom", text: "Uh… 3? Or 4." },
        { who: "Tom", text: "Malik, what was the red blob wearing?" },
        { who: "Malik", text: "Weird question… there was no red blob!" },
        { text: "Tom is busted." },
      ],
    },
    es: {
      name: "El Falso Testigo",
      tagline: "Todos vieron la escena. Menos uno.",
      pitch: "Una escena pasa 5 segundos delante de todos… menos de uno, el Falso Testigo. Luego todo pasa en voz alta: os hacéis preguntas en el orden que sortea la app, y él tiene que marcarse un farol para que no lo pillen.",
      example: "Una playa: una sombrilla roja, 4 blobs, un perro. La app muestra el orden: Léa → Tom, Tom → Malik, Malik → Léa. Léa pregunta: «¿De qué color era el blob con los brazos en alto?». Tom: «Eh… ¿azul?». Luego Tom le pregunta a Malik cuántas gaviotas había. Respuesta vaga, pregunta sospechosa… ¿es él el Falso Testigo?",
      rules: [
        "Por turnos, mira la escena durante 5 segundos. El Falso Testigo solo ve una pantalla de «no has visto nada».",
        "Con el móvil en el centro, la app muestra el orden de las preguntas (p. ej. «Léa → Tom»): cada uno hace una pregunta y responde a otra, todo en voz alta. El móvil ya no se toca.",
        "¿Sin ideas? El botón discreto «¿Una idea de pregunta?» propone una sacada de la escena real, sin la respuesta. Opcional.",
        "El Falso Testigo pregunta y responde como los demás… de farol. Desconfiad de las respuestas vagas y de las preguntas raras.",
        "Otra ronda de preguntas si queréis, y luego a votar: a la de tres, cada uno señala a un sospechoso y el más señalado queda eliminado (empate: se vuelve a votar entre los empatados). ¿Falso Testigo? ¡Pillado! ¿Inocente? La partida sigue: nueva ronda de preguntas y nueva votación.",
        "Los testigos ganan cuando pillan a todos los Falsos Testigos. Los Falsos Testigos ganan en cuanto son tantos como los testigos que quedan (p. ej. 1 Falso Testigo contra 1 testigo).",
        "Desde 6 jugadores, podéis jugar con 2 Falsos Testigos (3 desde 9): cada uno no ve nada y no sabe quiénes son los demás.",
        "Al final, vuelve a aparecer la escena (con las respuestas de las ideas sacadas): comprobad quién mintió.",
        "Puntos: por cada inocente eliminado, cada Falso Testigo en juego gana +2 (se los queda aunque lo pillen después), +3 de bonus si ganan los Falsos Testigos. Cada Falso Testigo pillado da +3 a cada testigo en juego.",
      ],
      steps: [
        "Mira la escena 5 segundos",
        "La app sortea el orden: preguntas en voz alta",
        "Votad: el más señalado queda eliminado",
        "Vuelve a aparecer la escena: ¿quién mintió?",
      ],
      story: [
        { who: "Léa", text: "Tom, ¿cuántos pájaros?" },
        { who: "Tom", text: "Eh… ¿3? O 4." },
        { who: "Tom", text: "Malik, ¿qué llevaba el blob rojo?" },
        { who: "Malik", text: "Pregunta rara… ¡no había ningún blob rojo!" },
        { text: "Tom, pillado." },
      ],
    },
  },
  /* ───────── Le Verre Invisible (textes dans verre/i18n.ts) ───────── */
  verre: VERRE_TEXT,

  /* ───────── Chut ! ───────── */
  chut: {
    fr: {
      name: "Chut !",
      tagline: "Chuchote, crie… le micro juge !",
      pitch: "Quatre jeux au micro (il mesure le volume, rien n'est enregistré). En vedette : Le bon volume, où tu dis une phrase absurde en gardant l'aiguille dans la zone. Et aussi : Chuchote-le !, Crescendo et Le Souffle.",
      example: "Hugo tient le tél. Sa phrase : « Un poney en peignoir commande un expresso au comptoir », zone : MURMURE. Il maintient « Parler » et chuchote… mais s'emballe sur « expresso » : l'aiguille sort de la zone. 64 %, +20 pour la phrase entière : 84 points. Léa fait 97. Au classement final, le dernier prend 2 gorgées de zinzin ou un gage.",
      rules: [
        "Le micro mesure seulement le volume, en direct : rien n'est enregistré ni envoyé. On le calibre une fois par partie (3 s de silence).",
        "Il entend un bruit, pas qui l'a fait : chaque mode dit clairement qui il écoute (celui qui tient le tél, une équipe ou toute la table).",
        "Le bon volume : le tél passe de main en main. Dis la phrase en gardant l'aiguille dans la zone (murmure, voix normale, forte ou cri). Score = % du temps dans la zone, +20 si la phrase est dite en entier.",
        "Chuchote-le ! (dès 4 joueurs) : deux équipes, 60 s pour faire deviner un max de mots en chuchotant. Un éclat de voix à table = BUZZ, mot perdu et −1.",
        "Crescendo : chacun fait un son plus fort que le précédent (ou plus doux en Decrescendo), sans toucher le plafond BOUM. Celui qui rate prend la peine.",
        "Le Souffle : tiens un « Aaaah » le plus longtemps possible dans la zone de volume. Record à battre.",
        "Pas de micro ? Chaque mode se joue aussi avec la table pour arbitre. Peines : 1 à 3 gorgées de zinzin ou un gage (gages seuls en mode sans alcool).",
      ],
      steps: [
        "Choisis un des 4 modes (Le bon volume en vedette)",
        "Calibrez le micro une fois (3 s de silence)",
        "Le micro écoute celui qui tient le tél… ou toute la table",
        "Le dernier, l'équipe perdante (ou en Crescendo, celui qui rate) prend la peine",
      ],
      story: [
        { text: "Zone : MURMURE. « Un poney en peignoir commande un expresso. »" },
        { who: "Hugo", text: "(chuchote) Un poney en peignoir… commande un EXPRESSO !" },
        { text: "L'aiguille sort de la zone : 64 %." },
        { who: "Léa", text: "Passe-moi le tél, je vais te montrer." },
      ],
    },
    en: {
      name: "Shh!",
      tagline: "Whisper, shout… the mic is the judge!",
      pitch: "Four games played with the mic (it measures volume, nothing is recorded). The star: Volume Control, where you say an absurd line while keeping the needle in the zone. Plus: Whisper It!, Crescendo and Hold the Note.",
      example: "Hugo holds the phone. His line: \"A pony in a bathrobe is ordering an espresso at the bar\", zone: WHISPER. He holds \"Talk\" and whispers… but gets carried away on \"espresso\": the needle leaves the zone. 64%, +20 for the whole line: 84 points. Léa scores 97. In the final ranking, last place takes 2 zinzin sips or a dare.",
      rules: [
        "The mic only measures volume, live: nothing is recorded or sent. You calibrate it once per game (3 s of silence).",
        "It hears a sound, not who made it: each mode makes it clear who it's listening to (the player holding the phone, a team or the whole table).",
        "Volume Control: the phone goes from hand to hand. Say the line while keeping the needle in the zone (whisper, normal, loud or shout). Score = % of time in the zone, +20 if you say the whole line.",
        "Whisper It! (4+ players): two teams, 60 s to get as many words guessed as possible, in a whisper. Any loud burst at the table = BUZZ, word lost and −1.",
        "Crescendo: each player makes a sound louder than the last (or softer in Decrescendo), without hitting the BOOM ceiling. Miss it and you take the penalty.",
        "Hold the Note: hold an \"Aaaah\" for as long as you can inside the volume zone. Beat the record.",
        "No mic? Every mode also works with the table as referee. Penalties: 1 to 3 zinzin sips or a dare (dares only in alcohol-free mode).",
      ],
      steps: [
        "Pick one of the 4 modes (Volume Control is the star)",
        "Calibrate the mic once (3 s of silence)",
        "The mic listens to whoever holds the phone… or the whole table",
        "Last place, the losing team (or in Crescendo, whoever misses) takes the penalty",
      ],
      story: [
        { text: "Zone: WHISPER. \"A pony in a bathrobe is ordering an espresso.\"" },
        { who: "Hugo", text: "(whispering) A pony in a bathrobe… is ordering an ESPRESSO!" },
        { text: "The needle leaves the zone: 64%." },
        { who: "Léa", text: "Give me the phone, I'll show you how it's done." },
      ],
    },
    es: {
      name: "¡Chis!",
      tagline: "Susurra, grita… ¡el micro juzga!",
      pitch: "Cuatro juegos con el micro (mide el volumen, no se graba nada). La estrella: El volumen justo, donde dices una frase absurda con la aguja dentro de la zona. Y además: ¡Susúrralo!, Crescendo y Sin aliento.",
      example: "Hugo tiene el móvil. Su frase: «Un poni en albornoz pide un cortado en la barra», zona: SUSURRO. Mantiene «Hablar» y susurra… pero se le escapa el «cortado»: la aguja se sale de la zona. 64 %, +20 por la frase entera: 84 puntos. Léa saca 97. En la clasificación final, el último se lleva 2 tragos de zinzin o un reto.",
      rules: [
        "El micro solo mide el volumen, en directo: no se graba ni se envía nada. Se calibra una vez por partida (3 s de silencio).",
        "Oye un ruido, no quién lo hace: cada modo deja claro a quién escucha (a quien tiene el móvil, a un equipo o a toda la mesa).",
        "El volumen justo: el móvil pasa de mano en mano. Di la frase con la aguja dentro de la zona (susurro, voz normal, alta o grito). Puntuación = % del tiempo en la zona, +20 si dices la frase entera.",
        "¡Susúrralo! (desde 4 jugadores): dos equipos, 60 s para hacer adivinar el máximo de palabras susurrando. Una voz alta en la mesa = BUZZ, palabra perdida y −1.",
        "Crescendo: cada uno hace un sonido más fuerte que el anterior (o más suave en Decrescendo), sin tocar el techo BUM. Quien falla se lleva el castigo.",
        "Sin aliento: aguanta un «Aaaah» todo lo que puedas dentro de la zona de volumen. Bate el récord.",
        "¿Sin micro? Todos los modos se juegan también con la mesa como árbitro. Castigos: de 1 a 3 tragos de zinzin o un reto (solo retos en modo sin alcohol).",
      ],
      steps: [
        "Elige uno de los 4 modos (El volumen justo es la estrella)",
        "Calibrad el micro una vez (3 s de silencio)",
        "El micro escucha a quien tiene el móvil… o a toda la mesa",
        "El último, el equipo perdedor (o en Crescendo, quien falla) se lleva el castigo",
      ],
      story: [
        { text: "Zona: SUSURRO. «Un poni en albornoz pide un cortado.»" },
        { who: "Hugo", text: "(susurrando) Un poni en albornoz… ¡pide un CORTADO!" },
        { text: "La aguja se sale de la zona: 64 %." },
        { who: "Léa", text: "Pásame el móvil, que te enseño cómo se hace." },
      ],
    },
  },
} satisfies Record<string, I18n<ZGameText>>;

export type ZGameId = keyof typeof GAME_TEXT;
