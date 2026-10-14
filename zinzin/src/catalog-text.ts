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
        "Chaque joueur reçoit un mot en secret — l'Intrus a un mot légèrement différent… et ne sait pas qu'il est l'Intrus !",
        "À tour de rôle, donne un indice sur ton mot (sans le dire !)",
        "Après les indices, votez pour éliminer celui que vous suspectez",
        "Le Fantôme n'a aucun mot : il bluffe, et s'il est éliminé il peut gagner en devinant le mot des civils",
        "Les civils gagnent si tous les imposteurs sont éliminés · les imposteurs gagnent s'ils sont aussi nombreux que les civils",
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
        "Civilians win if every impostor is eliminated · impostors win once there are as many of them as civilians",
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
        "Los civiles ganan si eliminan a todos los impostores · los impostores ganan si llegan a ser tantos como los civiles",
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
      pitch: "Un thème, un chiffre secret de 1 à 10 : réponds pile à ton niveau et laisse les autres te classer.",
      example: "Thème : « une excuse pour rater un date ». Tu as le 2 : « j'ai mal à la tête ». Ton pote a le 9 : « mon poisson rouge est en deuil ». Tout le monde doit remettre les réponses dans l'ordre de 1 à 10.",
      rules: [
        "Choisis l'ambiance : Soirée 18+ (thèmes osés) ou Culture pop (classements que tout le monde connaît)",
        "Chacun reçoit un numéro secret de 1 à 10 (1 = le plus faible/soft, 10 = le plus fort/hard)",
        "Un thème est révélé (ex. « un perso de Dragon Ball par puissance ») : chacun donne une réponse à voix haute selon son numéro",
        "Ensuite tout le monde classe la table du plus faible au plus fort (glisser-déposer)",
        "Plus ton classement est juste, plus tu marques — le meilleur flair gagne !",
      ],
      steps: [
        "Chacun reçoit un numéro secret de 1 à 10",
        "Un thème tombe : réponds selon ton numéro (1 = tout doux, 10 = énorme)",
        "Ensemble, rangez les réponses de la plus petite à la plus grande",
        "Plus le classement est juste, plus vous marquez",
      ],
      story: [
        { text: "Thème : une excuse pour rater un date" },
        { who: "Tom", text: "J'ai le 2… « j'ai un peu mal à la tête »." },
        { who: "Sarah", text: "J'ai le 9 : « mon poisson rouge est en deuil »." },
        { text: "Maintenant, rangez tout le monde de 1 à 10 !" },
      ],
    },
    en: {
      name: "From 1 to 10",
      tagline: "One theme, a secret number 1 to 10.",
      pitch: "One theme, one secret number from 1 to 10: answer at exactly your level and let the others rank you.",
      example: "Theme: \"an excuse to bail on a date\". You have a 2: \"I've got a headache\". Your friend has a 9: \"my goldfish is in mourning\". Everyone has to put the answers back in order from 1 to 10.",
      rules: [
        "Pick the vibe: Party 18+ (spicy themes) or Pop culture (rankings everyone knows)",
        "Everyone gets a secret number from 1 to 10 (1 = the weakest/mildest, 10 = the strongest/wildest)",
        "A theme is revealed (e.g. \"a superhero, by power level\"): everyone says an answer out loud that matches their number",
        "Then everyone ranks the table from weakest to strongest (drag and drop)",
        "The more accurate your ranking, the more you score: the best instincts win!",
      ],
      steps: [
        "Everyone gets a secret number from 1 to 10",
        "A theme drops: answer according to your number (1 = super mild, 10 = huge)",
        "Together, rank the answers from smallest to biggest",
        "The more accurate the ranking, the more you score",
      ],
      story: [
        { text: "Theme: an excuse to bail on a date" },
        { who: "Tom", text: "I've got a 2… \"I have a bit of a headache\"." },
        { who: "Sarah", text: "I've got a 9: \"my goldfish is in mourning\"." },
        { text: "Now rank everyone from 1 to 10!" },
      ],
    },
    es: {
      name: "Del 1 al 10",
      tagline: "Un tema, un número secreto del 1 al 10.",
      pitch: "Un tema, un número secreto del 1 al 10: responde justo a tu nivel y deja que los demás te ordenen.",
      example: "Tema: «una excusa para faltar a una cita». Tienes el 2: «me duele la cabeza». Tu amigo tiene el 9: «mi pez está de luto». Todos tienen que ordenar las respuestas del 1 al 10.",
      rules: [
        "Elige el ambiente: Fiesta 18+ (temas atrevidos) o Cultura pop (rankings que todo el mundo conoce)",
        "Cada uno recibe un número secreto del 1 al 10 (1 = lo más flojo/suave, 10 = lo más fuerte/bestia)",
        "Se revela un tema (p. ej. «un superhéroe, según su poder»): cada uno da en voz alta una respuesta según su número",
        "Después, todos ordenan la mesa de más flojo a más fuerte (arrastrando)",
        "Cuanto más acertado sea tu orden, más puntos: ¡gana el que tenga mejor olfato!",
      ],
      steps: [
        "Cada uno recibe un número secreto del 1 al 10",
        "Sale un tema: responde según tu número (1 = suavecito, 10 = enorme)",
        "Entre todos, ordenad las respuestas de menor a mayor",
        "Cuanto más acertado el orden, más puntos",
      ],
      story: [
        { text: "Tema: una excusa para faltar a una cita" },
        { who: "Tom", text: "Tengo el 2… «me duele un poco la cabeza»." },
        { who: "Sarah", text: "Tengo el 9: «mi pez está de luto»." },
        { text: "¡Ahora, ordenad a todos del 1 al 10!" },
      ],
    },
  },

  /* ───────── Tu préfères ? ───────── */
  "tu-prefere": {
    fr: {
      name: "Tu préfères ?",
      tagline: "Des dilemmes impossibles. On vote, on débat.",
      pitch: "Un dilemme impossible, tout le monde vote, et on débat.",
      example: "« Tu préfères ne plus jamais manger de fromage ou ne plus jamais boire de café ? » — À 3, tout le monde lève la main, on compte les mains… et le camp minoritaire prend la peine.",
      rules: [
        "Sur un seul téléphone (pass-and-play).",
        "Choisissez une ambiance : Classique, Chaud, Absurde ou Couple.",
        "Lisez le dilemme à voix haute, votez tous « à 3 » avec la main.",
        "Touchez la carte A ou B une fois par main levée, puis révélez le résultat.",
        "Le camp minoritaire prend la peine : un gage, ou 1 à 2 gorgées de zinzin (eau OK). Égalité ou unanimité : tout le monde prend la peine !",
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
        "All on one phone (pass and play).",
        "Pick a vibe: Classic, Spicy, Absurd or Couple.",
        "Read the dilemma out loud, everyone votes with their hand \"on 3\".",
        "Tap card A or B once per raised hand, then reveal the result.",
        "The minority side takes the penalty: a dare, or 1 to 2 zinzin sips (water is fine). Tie or unanimous: everyone takes the penalty!",
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
        "En un solo móvil, que se va pasando.",
        "Elige un ambiente: Clásico, Picante, Absurdo o Pareja.",
        "Lee el dilema en voz alta y todos votan con la mano «a la de 3».",
        "Toca la carta A o B una vez por mano levantada y revela el resultado.",
        "El bando minoritario paga: un reto, o 1 a 2 tragos de zinzin (vale agua). Empate o unanimidad: ¡paga todo el mundo!",
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
        "Au choix : le Test Officiel Zinzin (50 questions, du plus sage au plus hardcore, questions pour adultes) ou des questions au hasard dans tes packs",
        "Chacun son tour : on se passe le tél et chacun répond en secret, puis grande révélation du classement",
        "Solo : réponds seul et découvre ton score… et tes aveux",
        "Tous ensemble : on lit à voix haute, ceux qui l'ont fait lèvent la main, on compte sur l'écran",
        "Score final en % de pureté avec un titre, de « Ange tombé du ciel » à « Démon certifié »",
        "Option peines : le moins pur prend un gage ou 1 à 3 gorgées de zinzin. Pack Coquin 18+ facultatif",
      ],
      steps: [
        "Le Test Officiel Zinzin (50 questions) ou des questions au hasard",
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
        "Your pick: the Official Zinzin Test (50 questions, from innocent to hardcore, adult questions) or random questions from your packs",
        "Take turns: pass the phone around, everyone answers in secret, then the big ranking reveal",
        "Solo: answer on your own and discover your score… and your confessions",
        "All together: read it out loud, whoever's done it raises a hand, count them on the screen",
        "Final score as a purity % with a title, from \"Fallen angel\" to \"Certified devil\"",
        "Penalties option: the least pure takes a dare or 1 to 3 zinzin sips. Optional Naughty 18+ pack",
      ],
      steps: [
        "The Official Zinzin Test (50 questions) or random questions",
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
        "A elegir: el Test Oficial Zinzin (50 preguntas, de lo más inocente a lo más fuerte, preguntas para adultos) o preguntas al azar de tus packs",
        "Por turnos: el móvil va pasando, cada uno responde en secreto y luego llega la gran revelación del ranking",
        "En solitario: responde tú solo y descubre tu puntuación… y tus confesiones",
        "Todos a la vez: se lee en voz alta, quien lo haya hecho levanta la mano y se cuenta en la pantalla",
        "Puntuación final en % de pureza con un título, de «Ángel caído del cielo» a «Demonio certificado»",
        "Opción castigos: el menos puro hace un reto o de 1 a 3 tragos de zinzin. Pack Pícaro 18+ opcional",
      ],
      steps: [
        "El Test Oficial Zinzin (50 preguntas) o preguntas al azar",
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
        "Chacun pose UN doigt sur l'écran (2 à 5 doigts par manche ; à plus, on tourne)",
        "Une bombe s'arme et explose entre 4 et 22 s, personne ne sait quand",
        "Tu peux lâcher quand tu veux, mais un doigt levé ne revient pas",
        "Au BOUM, tous les doigts encore posés ont perdu",
        "Si tout le monde a lâché avant, c'est le premier à avoir lâché (le trouillard) qui perd",
        "Le dernier à lâcher avant le boum gagne la couronne 👑 et choisit qui fait un gage",
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
        "Everyone puts ONE finger on the screen (2 to 5 fingers per round; more players take turns)",
        "A bomb arms and explodes between 4 and 22 s, nobody knows when",
        "You can let go whenever you want, but once a finger is up it can't come back",
        "At BOOM, every finger still on the screen loses",
        "If everyone let go before the boom, the first one to let go (the chicken) loses",
        "The last one to let go before the boom wins the crown 👑 and picks who does a dare",
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
        "Cada uno pone UN dedo en la pantalla (de 2 a 5 dedos por ronda; si sois más, se va rotando)",
        "Se arma una bomba que explota entre los 4 y los 22 s, nadie sabe cuándo",
        "Puedes soltar cuando quieras, pero un dedo levantado no puede volver",
        "En el BUM, todos los dedos que sigan en la pantalla pierden",
        "Si todos han soltado antes, pierde el primero que soltó (el gallina)",
        "El último en soltar antes del bum gana la corona 👑 y elige quién hace un reto",
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
        "Le chrono est INVISIBLE pour toi — ton temps s'affiche seulement après",
        "Chacun passe à tour de rôle sur le même téléphone",
        "2 règles : « Le plus proche » (le plus loin prend une peine) ou « Sans dépasser » (tu dépasses = perdu)",
        "À moins de 0,15 s de la cible : PILE POIL ! 🎯",
      ],
      steps: [
        "Une cible s'affiche, par exemple 7 secondes",
        "GO, compte dans ta tête, STOP : le chrono est caché",
        "Chacun son tour sur le même tél",
        "Le plus loin prend une peine. À 0,15 s près : PILE POIL !",
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
        "2 rule sets: \"Closest wins\" (furthest off takes a penalty) or \"Don't go over\" (go over = you lose)",
        "Within 0.15 s of the target: SPOT ON! 🎯",
      ],
      steps: [
        "A target appears, for example 7 seconds",
        "GO, count in your head, STOP: the timer is hidden",
        "Everyone takes a turn on the same phone",
        "Furthest off takes a penalty. Within 0.15 s: SPOT ON!",
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
        "2 reglas: «El más cercano» (el que más se aleja recibe un castigo) o «Sin pasarse» (si te pasas, pierdes)",
        "A menos de 0,15 s del objetivo: ¡CLAVADO! 🎯",
      ],
      steps: [
        "Aparece un objetivo, por ejemplo 7 segundos",
        "GO, cuenta en tu cabeza, STOP: el cronómetro está oculto",
        "Cada uno juega por turnos en el mismo móvil",
        "El que más se aleja recibe un castigo. A 0,15 s: ¡CLAVADO!",
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
      example: "Le tél annonce « Les loups ouvrent les yeux… ». Ils choisissent Hugo. Au réveil, Hugo est mort : c'était la Voyante ! Le village débat 2 minutes et élimine Sarah… une simple villageoise. Les loups rigolent.",
      rules: [
        "Entrez les prénoms : le tél propose une répartition des rôles (Loups, Voyante, Sorcière, Chasseur…)",
        "Passez-vous le tél : chacun maintient le doigt pour voir son rôle en secret",
        "La nuit, posez le tél au centre : il appelle chaque rôle à voix haute, qui vient jouer sur l'écran",
        "Le jour : on découvre les morts, on débat (minuteur) puis on vote pour éliminer un suspect",
        "Le village gagne s'il élimine tous les loups · les loups gagnent dès qu'ils sont aussi nombreux que les villageois",
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
      example: "The phone announces \"The werewolves open their eyes…\". They pick Hugo. At dawn, Hugo is dead: he was the Seer! The village debates for 2 minutes and votes out Sarah… just a Villager. The werewolves are cracking up.",
      rules: [
        "Enter your names: the phone suggests a role setup (Werewolves, Seer, Witch, Hunter…)",
        "Pass the phone around: everyone holds a finger down to see their role in secret",
        "At night, put the phone in the middle: it calls each role out loud, and they play on the screen",
        "During the day: reveal who died, debate (with a timer), then vote to eliminate a suspect",
        "The village wins if it eliminates every werewolf · the werewolves win as soon as they match the villagers in number",
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
      example: "El móvil anuncia «Los lobos abren los ojos…». Eligen a Hugo. Al amanecer, Hugo está muerto: ¡era la Vidente! El pueblo debate 2 minutos y elimina a Sarah… una simple Aldeana. Los lobos se parten de risa.",
      rules: [
        "Escribid los nombres: el móvil propone un reparto de roles (Lobos, Vidente, Bruja, Cazador…)",
        "Pasaos el móvil: cada uno mantiene el dedo pulsado para ver su rol en secreto",
        "De noche, dejad el móvil en el centro: llama a cada rol en voz alta, que viene a jugar en la pantalla",
        "De día: se descubren los muertos, se debate (con temporizador) y se vota para eliminar a un sospechoso",
        "El pueblo gana si elimina a todos los lobos · los lobos ganan en cuanto son tantos como los aldeanos",
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
      example: "« Quel est le métier le plus bizarre qui existe ? » Tu inventes « testeur de toboggans ». Deux joueurs votent pour ton bluff → +40 pts. La vraie réponse était « renifleur de déodorant ».",
      rules: [
        "Une question à réponse improbable est posée à chaque manche",
        "Chacun invente une fausse réponse crédible (un bluff)",
        "Tous les bluffs + la vraie réponse sont mélangés : vote pour celle que tu crois vraie",
        "+30 pts si tu trouves la vérité, +20 pts par joueur piégé par ton bluff",
        "6 manches — le plus malin gagne !",
      ],
      steps: [
        "Une question improbable s'affiche",
        "Chacun invente une fausse réponse crédible",
        "Tout est mélangé avec la vraie : votez pour la bonne",
        "Trouver la vérité ou piéger les autres rapporte des points",
      ],
      story: [
        { text: "Quel est le métier le plus bizarre qui existe ?" },
        { who: "Tom", text: "Testeur de toboggans. Crédible, non ?" },
        { who: "Léa", text: "J'y crois à fond, je vote ça." },
        { text: "Bluff réussi pour Tom ! La vraie réponse : renifleur de déodorant." },
      ],
    },
    en: {
      name: "The Bluffer",
      tagline: "Make up the perfect fake answer.",
      pitch: "Make up a fake answer so believable that the others vote for it.",
      example: "\"What's the weirdest job in the world?\" You make up \"water slide tester\". Two players vote for your bluff → +40 pts. The real answer was \"deodorant sniffer\".",
      rules: [
        "Each round, a question with an unlikely answer is asked",
        "Everyone makes up a believable fake answer (a bluff)",
        "All the bluffs + the real answer are shuffled: vote for the one you think is true",
        "+30 pts if you find the truth, +20 pts for every player fooled by your bluff",
        "6 rounds: the sneakiest player wins!",
      ],
      steps: [
        "An unlikely question appears",
        "Everyone makes up a believable fake answer",
        "Everything is shuffled with the real one: vote for the right one",
        "Finding the truth or fooling the others scores points",
      ],
      story: [
        { text: "What's the weirdest job in the world?" },
        { who: "Tom", text: "Water slide tester. Believable, right?" },
        { who: "Léa", text: "Totally buying it, I'm voting for that." },
        { text: "Tom's bluff worked! The real answer: deodorant sniffer." },
      ],
    },
    es: {
      name: "El Farsante",
      tagline: "Inventa la respuesta falsa perfecta.",
      pitch: "Inventa una respuesta falsa tan creíble que los demás voten por ella.",
      example: "«¿Cuál es el trabajo más raro del mundo?». Te inventas «probador de toboganes». Dos jugadores votan por tu farol → +40 pts. La respuesta real era «olfateador de desodorantes».",
      rules: [
        "En cada ronda se hace una pregunta con una respuesta improbable",
        "Cada uno se inventa una respuesta falsa creíble (un farol)",
        "Todos los faroles + la respuesta real se mezclan: vota por la que creas verdadera",
        "+30 pts si aciertas la verdad, +20 pts por cada jugador que caiga en tu farol",
        "6 rondas: ¡gana el más listo!",
      ],
      steps: [
        "Aparece una pregunta improbable",
        "Cada uno se inventa una respuesta falsa creíble",
        "Todo se mezcla con la verdadera: votad por la buena",
        "Acertar la verdad o engañar a los demás da puntos",
      ],
      story: [
        { text: "¿Cuál es el trabajo más raro del mundo?" },
        { who: "Tom", text: "Probador de toboganes. Creíble, ¿no?" },
        { who: "Léa", text: "Me lo creo totalmente, voto eso." },
        { text: "¡Farol conseguido para Tom! La respuesta real: olfateador de desodorantes." },
      ],
    },
  },

  /* ───────── Le Curseur ───────── */
  "longueur-onde": {
    fr: {
      name: "Le Curseur",
      tagline: "Froid ↔ chaud : un indice, visez juste.",
      pitch: "Une échelle (froid ↔ chaud…), une cible cachée, un seul indice : placez le curseur au bon endroit.",
      example: "Échelle « froid ↔ chaud », la cible est tout à gauche. Le Médium dit : « la banquise ». Les autres placent le curseur tout à gauche… pile dedans : +4 !",
      rules: [
        "Chaque manche, un Médium (chacun son tour) voit en secret où se cache la cible sur une échelle entre 2 extrêmes (ex. froid ↔ chaud)",
        "Il dit UN truc qui se place à cet endroit de l'échelle (ex. cible tout à gauche → « la banquise »)",
        "Les autres placent le curseur là où ils pensent que l'indice se situe",
        "Pile dans la cible : 4 points, tout près : 3, pas loin : 2. Sur un seul tél, les points vont au Médium",
        "Chacun est Médium une fois : le meilleur Médium gagne !",
      ],
      steps: [
        "Le Médium voit en secret où est la cible sur l'échelle (froid ↔ chaud…)",
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
        "The others set the dial where they think the clue belongs",
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
      example: "Escala «frío ↔ caliente», el objetivo está del todo a la izquierda. El Médium dice: «la Antártida». Los demás ponen el dial del todo a la izquierda… ¡en el blanco: +4!",
      rules: [
        "En cada ronda, un Médium (por turnos) ve en secreto dónde está el objetivo en una escala entre 2 extremos (p. ej. frío ↔ caliente)",
        "Dice UNA cosa que encaje en ese punto de la escala (p. ej. objetivo del todo a la izquierda → «la Antártida»)",
        "Los demás colocan el dial donde creen que encaja la pista",
        "En el blanco: 4 puntos, muy cerca: 3, no muy lejos: 2. En un solo móvil, los puntos son para el Médium",
        "Cada uno es Médium una vez: ¡gana el mejor Médium!",
      ],
      steps: [
        "El Médium ve en secreto dónde está el objetivo en la escala (frío ↔ caliente…)",
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
      example: "Le mot est « Girafe ». Tu dis : « animal, très grand cou, Afrique » → il trouve ! Tape à gauche, mot suivant. Bloqué ? Tape à droite pour passer.",
      rules: [
        "Formez au moins 2 équipes de 2 joueurs",
        "Celui qui fait deviner tient le téléphone — le devineur ne regarde pas l'écran !",
        "Tap gauche = trouvé (+1), tap droite = passe, bouton Annuler si tu t'es trompé",
        "Chaque joueur fait deviner une fois par manche",
        "L'équipe avec le plus de mots trouvés gagne !",
      ],
      steps: [
        "Formez des équipes de 2 ou plus",
        "Celui qui fait deviner tient le tél, l'autre ne regarde pas",
        "Tap à gauche : trouvé. Tap à droite : on passe",
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
      example: "The word is \"Giraffe\". You say: \"animal, super long neck, Africa\" → they get it! Tap left, next word. Stuck? Tap right to skip.",
      rules: [
        "Make at least 2 teams of 2 players",
        "The clue-giver holds the phone: the guesser doesn't look at the screen!",
        "Tap left = got it (+1), tap right = skip, Undo button if you made a mistake",
        "Every player gives clues once per round",
        "The team that finds the most words wins!",
      ],
      steps: [
        "Make teams of 2 or more",
        "The clue-giver holds the phone, the other doesn't look",
        "Tap left: got it. Tap right: skip",
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
      example: "La palabra es «Jirafa». Dices: «animal, cuello larguísimo, África» → ¡la acierta! Toca a la izquierda, siguiente palabra. ¿Atascado? Toca a la derecha para pasar.",
      rules: [
        "Formad al menos 2 equipos de 2 jugadores",
        "Quien da las pistas sujeta el móvil: ¡el que adivina no mira la pantalla!",
        "Toque a la izquierda = acertada (+1), toque a la derecha = pasar, botón Deshacer si te has equivocado",
        "Cada jugador da pistas una vez por ronda",
        "¡Gana el equipo que acierte más palabras!",
      ],
      steps: [
        "Formad equipos de 2 o más",
        "Quien da las pistas sujeta el móvil, el otro no mira",
        "Toque a la izquierda: acertada. A la derecha: pasar",
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
      example: "Le mot est « Girafe ». Tes potes : « animal », « très grand cou », « Afrique »… Tu cries « Girafe ! », tu tapes à gauche, mot suivant. 60 secondes, combien tu en trouves ?",
      rules: [
        "Choisis tes thèmes et la durée du tour",
        "Mets le tél sur ton front, écran vers les autres : tu ne vois pas le mot",
        "Les autres te donnent des indices (ou miment)",
        "Tape à gauche si tu as trouvé, à droite pour passer",
        "Chacun son tour — le plus de mots trouvés gagne !",
      ],
      steps: [
        "Mets le tél sur ton front, écran vers les autres",
        "Les autres te donnent des indices ou miment",
        "Trouvé : tape à gauche. On passe : à droite",
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
      example: "The word is \"Giraffe\". Your friends: \"animal\", \"super long neck\", \"Africa\"… You yell \"Giraffe!\", tap left, next word. 60 seconds: how many can you get?",
      rules: [
        "Pick your themes and how long each turn lasts",
        "Put the phone on your forehead, screen facing the others: you can't see the word",
        "The others give you clues (or act it out)",
        "Tap left if you got it, right to skip",
        "Everyone takes a turn: most words found wins!",
      ],
      steps: [
        "Put the phone on your forehead, screen facing the others",
        "The others give you clues or act it out",
        "Got it: tap left. Skip: tap right",
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
      example: "La palabra es «Jirafa». Tus amigos: «animal», «cuello larguísimo», «África»… Gritas «¡Jirafa!», tocas a la izquierda y siguiente palabra. 60 segundos: ¿cuántas aciertas?",
      rules: [
        "Elige tus temas y la duración del turno",
        "Ponte el móvil en la frente, con la pantalla hacia los demás: tú no ves la palabra",
        "Los demás te dan pistas (o hacen mímica)",
        "Toca a la izquierda si la has acertado, a la derecha para pasar",
        "Por turnos: ¡gana quien acierte más palabras!",
      ],
      steps: [
        "Ponte el móvil en la frente, con la pantalla hacia los demás",
        "Los demás te dan pistas o hacen mímica",
        "Acertada: toca a la izquierda. Pasar: a la derecha",
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
      example: "Catégorie « Un fruit ». Pomme, banane, kiwi… le chrono passe à 4 s, puis 3,5 s… Tom bloque sur « euh… » : il perd une vie !",
      rules: [
        "Une catégorie s'affiche (ex. « un fruit », « un truc qu'on trouve dans un frigo »)",
        "Chacun son tour, dis un mot de la catégorie avant la fin du chrono",
        "Pas de répétition ! Le chrono raccourcit à chaque mot",
        "Tu bloques ou le temps tombe : tu perds une vie",
        "Le dernier en vie gagne",
      ],
      steps: [
        "Une catégorie s'affiche",
        "Chacun son tour, dis un mot avant la fin du chrono",
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
      example: "Category: \"A fruit\". Apple, banana, kiwi… the timer drops to 4 s, then 3.5 s… Tom freezes on \"uhh…\": he loses a life!",
      rules: [
        "A category appears (e.g. \"a fruit\", \"something you find in a fridge\")",
        "Take turns saying a word from the category before the timer runs out",
        "No repeats! The timer gets shorter with every word",
        "If you freeze or time runs out, you lose a life",
        "The last one standing wins",
      ],
      steps: [
        "A category appears",
        "Take turns saying a word before the timer runs out",
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
      example: "Categoría: «Una fruta». Manzana, plátano, kiwi… el reloj baja a 4 s, luego a 3,5 s… Tom se queda en «eh…»: ¡pierde una vida!",
      rules: [
        "Aparece una categoría (p. ej. «una fruta», «algo que hay en una nevera»)",
        "Por turnos, di una palabra de la categoría antes de que se acabe el tiempo",
        "¡Sin repetir! El tiempo se acorta con cada palabra",
        "Si te bloqueas o se acaba el tiempo, pierdes una vida",
        "Gana el último que quede en pie",
      ],
      steps: [
        "Aparece una categoría",
        "Por turnos, di una palabra antes de que se acabe el tiempo",
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
      pitch: "Deux équipes, une grille de 25 mots : fais deviner les tiens avec un seul mot-indice.",
      example: "Tu es chef des Rouges, tes mots sont « Lune » et « Fusée ». Tu dis « Espace, 2 ». Ton équipe touche Lune ✅, puis Étoile… raté, c'était neutre : le tour passe.",
      rules: [
        "Formez 2 équipes, chacune choisit un chef",
        "Seuls les chefs regardent la carte secrète (appui long) : elle montre quels mots sont à quelle équipe",
        "Le chef dit à voix haute 1 mot + un nombre de mots liés",
        "Son équipe touche les mots sur le tél (2 taps pour valider) — tant qu'elle trouve, elle continue",
        "La Bombe = défaite immédiate. Première équipe à trouver tous ses mots gagne !",
      ],
      steps: [
        "Deux équipes, chacune son chef",
        "Seuls les chefs regardent la carte secrète",
        "Le chef dit un mot et un nombre",
        "Son équipe touche les mots. Gare à la Bombe !",
      ],
      story: [
        { who: "Inès", text: "Espace, 2." },
        { who: "Malik", text: "Lune, c'est sûr." },
        { text: "Lune : rouge ! Bien joué." },
        { who: "Malik", text: "Et… Étoile ?" },
        { text: "Raté, c'était neutre. Au tour des bleus." },
      ],
    },
    en: {
      name: "Spy Words",
      tagline: "Two teams, one single clue word.",
      pitch: "Two teams, a grid of 25 words: get your team to find yours with a single clue word.",
      example: "You're the Red team's leader, your words are \"Moon\" and \"Rocket\". You say \"Space, 2\". Your team taps Moon ✅, then Star… miss, it was neutral: the turn passes.",
      rules: [
        "Make 2 teams, each one picks a leader",
        "Only the leaders look at the secret key (long press): it shows which words belong to which team",
        "The leader says 1 word out loud + how many words it links to",
        "Their team taps the words on the phone (2 taps to confirm): as long as they're right, they keep going",
        "The Bomb = instant defeat. First team to find all its words wins!",
      ],
      steps: [
        "Two teams, each with a leader",
        "Only the leaders look at the secret key",
        "The leader says one word and a number",
        "Their team taps the words. Watch out for the Bomb!",
      ],
      story: [
        { who: "Inès", text: "Space, 2." },
        { who: "Malik", text: "Moon, for sure." },
        { text: "Moon: red! Nice one." },
        { who: "Malik", text: "And… Star?" },
        { text: "Miss, it was neutral. Blue team's turn." },
      ],
    },
    es: {
      name: "Palabras Espía",
      tagline: "Dos equipos, una sola palabra pista.",
      pitch: "Dos equipos, una cuadrícula de 25 palabras: haz que tu equipo encuentre las suyas con una sola palabra pista.",
      example: "Eres el jefe de los Rojos y tus palabras son «Luna» y «Cohete». Dices «Espacio, 2». Tu equipo toca Luna ✅, luego Estrella… fallo, era neutral: pasa el turno.",
      rules: [
        "Formad 2 equipos y cada uno elige un jefe",
        "Solo los jefes miran la clave secreta (pulsación larga): muestra qué palabras son de cada equipo",
        "El jefe dice en voz alta 1 palabra + cuántas palabras están relacionadas",
        "Su equipo toca las palabras en el móvil (2 toques para confirmar): mientras acierte, sigue",
        "La Bomba = derrota inmediata. ¡Gana el primer equipo que encuentre todas sus palabras!",
      ],
      steps: [
        "Dos equipos, cada uno con su jefe",
        "Solo los jefes miran la clave secreta",
        "El jefe dice una palabra y un número",
        "Su equipo toca las palabras. ¡Cuidado con la Bomba!",
      ],
      story: [
        { who: "Inès", text: "Espacio, 2." },
        { who: "Malik", text: "Luna, seguro." },
        { text: "Luna: ¡roja! Bien jugado." },
        { who: "Malik", text: "¿Y… Estrella?" },
        { text: "Fallo, era neutral. Turno de los azules." },
      ],
    },
  },

  /* ───────── Pensez Pareil ───────── */
  "pensez-pareil": {
    fr: {
      name: "Pensez Pareil",
      tagline: "À deux, trouvez la même réponse.",
      pitch: "À deux, répondez en secret et tombez sur la même réponse.",
      example: "Thème : « un plat pour un dimanche soir ». Tu écris « pâtes », ton/ta partenaire écrit « pâtes » → SYNC ! Le combo monte.",
      rules: [
        "À deux : un thème s'affiche (ex. « un fruit », « notre prochaine destination »)",
        "Chacun écrit sa réponse en secret, sans se concerter",
        "Si vous écrivez la même chose → SYNC ! Vous marquez ensemble",
        "Enchaînez les syncs : la série fait grimper le combo (+25 pts/cran)",
        "Votre niveau de complicité monte de partie en partie et débloque des badges",
      ],
      steps: [
        "À deux : un thème s'affiche",
        "Chacun écrit sa réponse en secret",
        "Même réponse ? SYNC, vous marquez ensemble",
        "Enchaînez les syncs pour faire grimper le combo",
      ],
      story: [
        { text: "Thème : un plat pour un dimanche soir" },
        { who: "Léa", text: "J'écris… pâtes." },
        { who: "Tom", text: "Pâtes." },
        { text: "SYNC ! Le combo monte." },
      ],
    },
    en: {
      name: "Think Alike",
      tagline: "As a pair, land on the same answer.",
      pitch: "As a pair, answer in secret and try to land on the same answer.",
      example: "Theme: \"a dish for a Sunday night\". You write \"pasta\", your partner writes \"pasta\" → SYNC! The combo goes up.",
      rules: [
        "Two players: a theme appears (e.g. \"a fruit\", \"our next trip\")",
        "Each of you writes an answer in secret, no conferring",
        "If you write the same thing → SYNC! You score together",
        "Chain your syncs: the streak boosts the combo (+25 pts per level)",
        "Your connection level rises game after game and unlocks badges",
      ],
      steps: [
        "Two players: a theme appears",
        "Each of you writes an answer in secret",
        "Same answer? SYNC, you score together",
        "Chain syncs to boost the combo",
      ],
      story: [
        { text: "Theme: a dish for a Sunday night" },
        { who: "Léa", text: "I'm writing… pasta." },
        { who: "Tom", text: "Pasta." },
        { text: "SYNC! The combo goes up." },
      ],
    },
    es: {
      name: "Pensad Igual",
      tagline: "En pareja, dad con la misma respuesta.",
      pitch: "En pareja, responded en secreto e intentad dar con la misma respuesta.",
      example: "Tema: «un plato para un domingo por la noche». Escribes «pasta», tu pareja escribe «pasta» → ¡SYNC! El combo sube.",
      rules: [
        "En pareja: aparece un tema (p. ej. «una fruta», «nuestro próximo viaje»)",
        "Cada uno escribe su respuesta en secreto, sin ponerse de acuerdo",
        "Si escribís lo mismo → ¡SYNC! Puntuáis juntos",
        "Encadenad syncs: la racha hace subir el combo (+25 pts por nivel)",
        "Vuestro nivel de complicidad sube partida tras partida y desbloquea insignias",
      ],
      steps: [
        "En pareja: aparece un tema",
        "Cada uno escribe su respuesta en secreto",
        "¿Misma respuesta? SYNC, puntuáis juntos",
        "Encadenad syncs para que suba el combo",
      ],
      story: [
        { text: "Tema: un plato para un domingo por la noche" },
        { who: "Léa", text: "Escribo… pasta." },
        { who: "Tom", text: "Pasta." },
        { text: "¡SYNC! El combo sube." },
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
        "L'un répond en secret à une question sur lui-même",
        "L'autre devine sa réponse : juste = 1 point",
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
        "One of you secretly answers a question about yourself",
        "The other guesses the answer: right = 1 point",
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
        "Uno responde en secreto a una pregunta sobre sí mismo",
        "El otro adivina su respuesta: acierto = 1 punto",
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
      example: "Carte : « Votez : qui finirait en garde à vue en premier ? » — tout le monde pointe Max. Max fait tourner la roulette : 2 gorgées ou un gage. Carte suivante !",
      rules: [
        "Le téléphone ne sert qu'à lire les cartes et désigner le perdant — tout se joue à l'oral",
        "Choisis tes packs (Soft, Coquin 18+, Trash, Quiz…)",
        "Cartes : vote du groupe, tour de table, règles live, avoue, jokers…",
        "Carte « Tu préfères » : la minorité perd ; égalité ou unanimité, tout le monde prend",
        "Le perdant fait tourner la roulette : 1 à 3 gorgées ou un gage",
        "Personne n'est obligé de boire de l'alcool : eau, soft, tout compte",
      ],
      steps: [
        "Choisissez vos packs de cartes",
        "Lisez la carte à voix haute et jouez-la",
        "Le perdant fait tourner la roulette : 1 à 3 gorgées ou un gage",
        "Une gorgée de zinzin, c'est de ce que tu veux : eau et soft comptent, personne n'est obligé",
      ],
      story: [
        { text: "Votez : qui finirait en garde à vue en premier ?" },
        { who: "Léa", text: "Max. Évidemment Max." },
        { who: "Malik", text: "Désolé Max…" },
        { who: "Max", text: "Bon. Je fais tourner la roulette." },
        { text: "2 gorgées ou un gage. Carte suivante !" },
      ],
    },
    en: {
      name: "The Round",
      tagline: "The phone reads, the group plays.",
      pitch: "The party card game: the phone reads a card, the group plays, the loser pays up.",
      example: "Card: \"Vote: who's most likely to get arrested first?\" Everyone points at Max. Max spins the wheel: 2 zinzin sips or a dare. Next card!",
      rules: [
        "The phone just reads the cards and picks the loser: everything else is played out loud",
        "Pick your packs (Soft, Naughty 18+, Wild, Quiz…)",
        "Cards: group votes, round-the-table, live rules, confessions, jokers…",
        "\"Would you rather\" cards: the minority loses; tie or unanimous, everyone takes it",
        "The loser spins the wheel: 1 to 3 zinzin sips or a dare",
        "Nobody has to drink alcohol: water, soft drinks, everything counts",
      ],
      steps: [
        "Pick your card packs",
        "Read the card out loud and play it",
        "The loser spins the wheel: 1 to 3 zinzin sips or a dare",
        "A zinzin sip is whatever you like: water and soft drinks count, nobody has to",
      ],
      story: [
        { text: "Vote: who's most likely to get arrested first?" },
        { who: "Léa", text: "Max. Obviously Max." },
        { who: "Malik", text: "Sorry Max…" },
        { who: "Max", text: "Fine. I'll spin the wheel." },
        { text: "2 zinzin sips or a dare. Next card!" },
      ],
    },
    es: {
      name: "La Ronda",
      tagline: "El móvil lee la carta, el grupo juega.",
      pitch: "El juego de cartas de fiesta: el móvil lee una carta, el grupo juega y el que pierde paga.",
      example: "Carta: «Votad: ¿quién acabaría antes en comisaría?». Todos señalan a Max. Max gira la ruleta: 2 tragos de zinzin o un reto. ¡Siguiente carta!",
      rules: [
        "El móvil solo sirve para leer las cartas y señalar al perdedor: todo se juega en voz alta",
        "Elige tus packs (Suave, Pícaro 18+, Bestia, Quiz…)",
        "Cartas: votación del grupo, ronda por la mesa, reglas en vivo, confiesa, comodines…",
        "Carta «¿Qué prefieres?»: pierde la minoría; si hay empate o unanimidad, paga todo el mundo",
        "El que pierde gira la ruleta: de 1 a 3 tragos de zinzin o un reto",
        "Nadie está obligado a beber alcohol: agua, refrescos, todo vale",
      ],
      steps: [
        "Elegid vuestros packs de cartas",
        "Leed la carta en voz alta y jugadla",
        "El que pierde gira la ruleta: de 1 a 3 tragos o un reto",
        "Un trago de zinzin es de lo que quieras: agua y refrescos cuentan, nadie está obligado",
      ],
      story: [
        { text: "Votad: ¿quién acabaría antes en comisaría?" },
        { who: "Léa", text: "Max. Obviamente Max." },
        { who: "Malik", text: "Lo siento, Max…" },
        { who: "Max", text: "Vale. Giro la ruleta." },
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
        "Choisis le nombre de wagons (tas de cartes) avant de lancer",
        "À ton tour : pari Plus, Moins ou Égalité sur la carte suivante",
        "Bien joué → wagon suivant · Raté → peine (1 à 3 gorgées ou un gage) et retour au début",
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
        "Pick the number of carriages (card piles) before you start",
        "On your turn: bet Higher, Lower or Same on the next card",
        "Right → next carriage · Wrong → penalty (1 to 3 zinzin sips or a dare) and back to the start",
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
        "Elige el número de vagones (montones de cartas) antes de empezar",
        "En tu turno: apuesta Mayor, Menor o Igual para la siguiente carta",
        "Acierto → siguiente vagón · Fallo → castigo (de 1 a 3 tragos de zinzin o un reto) y vuelta al principio",
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
      pitch: "Une scène défile 5 secondes sous les yeux de chacun… sauf un, le Faux Témoin. Ensuite, vous vous interrogez à tour de rôle : à lui de bluffer pour ne pas se faire griller.",
      example: "Une plage : un parasol rouge, 4 blobs, un chien. Léa demande à Tom : « De quelle couleur était le blob qui levait les bras ? ». Tom : « Euh… bleu ? ». Puis Tom, en panne, touche « Une idée de question ? » et demande à Malik combien il y avait de mouettes. Réponse vague, question louche… c'est lui le Faux Témoin ?",
      rules: [
        "Chacun à son tour regarde la scène pendant 5 secondes. Le Faux Témoin, lui, voit seulement un écran « tu n'as rien vu ».",
        "Téléphone au centre, chacun son tour pose une question sur la scène au joueur de son choix (on touche son prénom). Il répond à voix haute.",
        "En panne d'idée ? Le bouton « Une idée de question ? » en propose une tirée de la vraie scène, sans la réponse.",
        "Le Faux Témoin pose ses questions et répond comme les autres… au bluff. Méfiez-vous des réponses floues et des questions bizarres.",
        "1, 2 ou 3 tours de table, puis vote à main levée. S'il est démasqué, il a une dernière chance : trouver la bonne réponse à une question à choix multiples.",
        "À la fin, la scène s'affiche avec les vraies réponses aux questions posées : on vérifie qui a menti.",
        "Points : Faux Témoin non démasqué +3, dernière chance réussie +2, sinon chaque témoin +1.",
      ],
      steps: [
        "Regarde la scène 5 secondes",
        "À ton tour, pose une question à qui tu veux",
        "Démasquez le Faux Témoin",
        "La scène et les vraies réponses : qui a menti ?",
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
      pitch: "A scene flashes in front of everyone for 5 seconds… except one player, the Fake Witness. Then you take turns grilling each other: they have to bluff to avoid getting caught.",
      example: "A beach: a red umbrella, 4 blobs, a dog. Léa asks Tom: \"What color was the blob with its arms up?\". Tom: \"Uh… blue?\". Then Tom, stuck, taps \"Need a question idea?\" and asks Malik how many seagulls there were. Vague answer, fishy question… is he the Fake Witness?",
      rules: [
        "One by one, look at the scene for 5 seconds. The Fake Witness only gets a \"you saw nothing\" screen.",
        "Phone in the middle, take turns asking a question about the scene to any player (tap their name). They answer out loud.",
        "Out of ideas? The \"Need a question idea?\" button suggests one taken from the real scene, without the answer.",
        "The Fake Witness asks and answers like everyone else… by bluffing. Watch out for vague answers and weird questions.",
        "1, 2 or 3 times around the table, then vote by pointing. If the Fake Witness gets caught, they get one last chance: pick the right answer to a multiple-choice question.",
        "At the end, the scene shows up with the real answers to the questions asked: check who lied.",
        "Points: Fake Witness not caught +3, last chance won +2, otherwise each witness +1.",
      ],
      steps: [
        "Look at the scene for 5 seconds",
        "On your turn, ask anyone a question",
        "Unmask the Fake Witness",
        "The scene and the real answers: who lied?",
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
      pitch: "Una escena pasa 5 segundos delante de todos… menos de uno, el Falso Testigo. Luego os hacéis preguntas por turnos: él tiene que marcarse un farol para que no lo pillen.",
      example: "Una playa: una sombrilla roja, 4 blobs, un perro. Léa le pregunta a Tom: «¿De qué color era el blob con los brazos en alto?». Tom: «Eh… ¿azul?». Luego Tom, sin ideas, toca «¿Una idea de pregunta?» y le pregunta a Malik cuántas gaviotas había. Respuesta vaga, pregunta sospechosa… ¿es él el Falso Testigo?",
      rules: [
        "Por turnos, mira la escena durante 5 segundos. El Falso Testigo solo ve una pantalla de «no has visto nada».",
        "Con el móvil en el centro, por turnos, hazle una pregunta sobre la escena a quien quieras (toca su nombre). Responde en voz alta.",
        "¿Sin ideas? El botón «¿Una idea de pregunta?» propone una sacada de la escena real, sin la respuesta.",
        "El Falso Testigo pregunta y responde como los demás… de farol. Desconfiad de las respuestas vagas y de las preguntas raras.",
        "1, 2 o 3 vueltas, y luego votad señalando con el dedo. Si lo pilláis, tiene una última oportunidad: acertar una pregunta de opción múltiple.",
        "Al final, aparece la escena con las respuestas reales a las preguntas hechas: comprobad quién mintió.",
        "Puntos: Falso Testigo no descubierto +3, última oportunidad acertada +2, si no, cada testigo +1.",
      ],
      steps: [
        "Mira la escena 5 segundos",
        "En tu turno, pregúntale algo a quien quieras",
        "Desenmascarad al Falso Testigo",
        "La escena y las respuestas reales: ¿quién mintió?",
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
      pitch: "Six jeux au micro (il mesure le volume, rien n'est enregistré). En vedette : Le bon volume, où tu dis une phrase absurde en gardant l'aiguille dans la zone. Et aussi : Chuchote-le !, Crescendo, Le Souffle, Ne ris pas ! et Silence total.",
      example: "Hugo tient le tél. Sa phrase : « Un poney en peignoir commande un expresso au comptoir », zone : MURMURE. Il maintient « Parler » et chuchote… mais s'emballe sur « expresso » : l'aiguille sort de la zone. 64 %, +20 pour la phrase entière : 84 points. Léa fait 97. Au classement final, le dernier prend 2 gorgées de zinzin ou un gage.",
      rules: [
        "Le micro mesure seulement le volume, en direct : rien n'est enregistré ni envoyé. On le calibre une fois par partie (3 s de silence).",
        "Il entend un bruit, pas qui l'a fait : chaque mode dit clairement qui il écoute (celui qui tient le tél, une équipe ou toute la table).",
        "Le bon volume : le tél passe de main en main. Dis la phrase en gardant l'aiguille dans la zone (murmure, voix normale, forte ou cri). Score = % du temps dans la zone, +20 si la phrase est dite en entier.",
        "Chuchote-le ! : deux équipes, 60 s pour faire deviner un max de mots en chuchotant. Un éclat de voix à table = BUZZ, mot perdu et −1.",
        "Crescendo : chacun fait un son plus fort que le précédent (ou plus doux en Decrescendo), sans toucher le plafond BOUM. Celui qui rate prend la peine.",
        "Le Souffle : tiens un « Aaaah » le plus longtemps possible dans la zone de volume. Record à battre.",
        "Ne ris pas ! : le Clown a 30 s pour faire craquer le Sérieux. Silence total : tout le monde se tait pendant que le téléphone fait l'idiot.",
        "Pas de micro ? Chaque mode se joue aussi avec la table pour arbitre. Peines : 1 à 3 gorgées de zinzin ou un gage (gages seuls en mode sans alcool).",
      ],
      steps: [
        "Choisis un des 6 modes (Le bon volume en vedette)",
        "Calibrez le micro une fois (3 s de silence)",
        "Le micro écoute celui qui tient le tél… ou toute la table",
        "Le dernier (ou l'équipe perdante) prend la peine",
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
      pitch: "Six games played with the mic (it measures volume, nothing is recorded). The star: Volume Control, where you say an absurd line while keeping the needle in the zone. Plus: Whisper It!, Crescendo, Hold the Note, Don't Laugh! and Total Silence.",
      example: "Hugo holds the phone. His line: \"A pony in a bathrobe is ordering an espresso at the bar\", zone: WHISPER. He holds \"Talk\" and whispers… but gets carried away on \"espresso\": the needle leaves the zone. 64%, +20 for the whole line: 84 points. Léa scores 97. In the final ranking, last place takes 2 zinzin sips or a dare.",
      rules: [
        "The mic only measures volume, live: nothing is recorded or sent. You calibrate it once per game (3 s of silence).",
        "It hears a sound, not who made it: each mode makes it clear who it's listening to (the player holding the phone, a team or the whole table).",
        "Volume Control: the phone goes from hand to hand. Say the line while keeping the needle in the zone (whisper, normal, loud or shout). Score = % of time in the zone, +20 if you say the whole line.",
        "Whisper It!: two teams, 60 s to get as many words guessed as possible, in a whisper. Any loud burst at the table = BUZZ, word lost and −1.",
        "Crescendo: each player makes a sound louder than the last (or softer in Decrescendo), without hitting the BOOM ceiling. Miss it and you take the penalty.",
        "Hold the Note: hold an \"Aaaah\" for as long as you can inside the volume zone. Beat the record.",
        "Don't Laugh!: the Clown has 30 s to crack the Straight Face. Total Silence: everyone shuts up while the phone acts silly.",
        "No mic? Every mode also works with the table as referee. Penalties: 1 to 3 zinzin sips or a dare (dares only in alcohol-free mode).",
      ],
      steps: [
        "Pick one of the 6 modes (Volume Control is the star)",
        "Calibrate the mic once (3 s of silence)",
        "The mic listens to whoever holds the phone… or the whole table",
        "Last place (or the losing team) takes the penalty",
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
      pitch: "Seis juegos con el micro (mide el volumen, no se graba nada). La estrella: El volumen justo, donde dices una frase absurda con la aguja dentro de la zona. Y además: ¡Susúrralo!, Crescendo, Sin aliento, ¡No te rías! y Silencio total.",
      example: "Hugo tiene el móvil. Su frase: «Un poni en albornoz pide un cortado en la barra», zona: SUSURRO. Mantiene «Hablar» y susurra… pero se le escapa el «cortado»: la aguja se sale de la zona. 64 %, +20 por la frase entera: 84 puntos. Léa saca 97. En la clasificación final, el último se lleva 2 tragos de zinzin o un reto.",
      rules: [
        "El micro solo mide el volumen, en directo: no se graba ni se envía nada. Se calibra una vez por partida (3 s de silencio).",
        "Oye un ruido, no quién lo hace: cada modo deja claro a quién escucha (a quien tiene el móvil, a un equipo o a toda la mesa).",
        "El volumen justo: el móvil pasa de mano en mano. Di la frase con la aguja dentro de la zona (susurro, voz normal, alta o grito). Puntuación = % del tiempo en la zona, +20 si dices la frase entera.",
        "¡Susúrralo!: dos equipos, 60 s para hacer adivinar el máximo de palabras susurrando. Una voz alta en la mesa = BUZZ, palabra perdida y −1.",
        "Crescendo: cada uno hace un sonido más fuerte que el anterior (o más suave en Decrescendo), sin tocar el techo BUM. Quien falla se lleva el castigo.",
        "Sin aliento: aguanta un «Aaaah» todo lo que puedas dentro de la zona de volumen. Bate el récord.",
        "¡No te rías!: el Payaso tiene 30 s para hacer reír al Serio. Silencio total: todos callados mientras el móvil hace el tonto.",
        "¿Sin micro? Todos los modos se juegan también con la mesa como árbitro. Castigos: de 1 a 3 tragos de zinzin o un reto (solo retos en modo sin alcohol).",
      ],
      steps: [
        "Elige uno de los 6 modos (El volumen justo es la estrella)",
        "Calibrad el micro una vez (3 s de silencio)",
        "El micro escucha a quien tiene el móvil… o a toda la mesa",
        "El último (o el equipo perdedor) se lleva el castigo",
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
