import type { I18n } from "@/lib/i18n";
import type { AvatarTab } from "./look";

/** Textes de l'éditeur de perso et de « Ma bande » (FR / EN / ES). */
export const AVATAR_STR: I18n<{
  myBand: string;
  myBandSub: string;
  tabs: Record<AvatarTab, string>;
  hairColor: string;
  random: string;
  reset: string;
  save: string;
  saveLocked: string;
  lockedHint: string;
  /** Pastille d'un accessoire secret trouvé (easter egg) */
  secret: string;
  /** Clin d'œil sous l'aperçu quand le perso s'appelle « Zinzin » */
  zinzinCrown: string;
  /** Secret du prénom « Sofian » (lunettes noires) */
  bossShades: string;
  locked: string;
  selected: string;
  close: string;
  editAria: (n: string) => string;
  editTitle: (n: string) => string;
  me: string;
  itsMe: string;
  nameLabel: string;
  namePlaceholder: string;
  nameTaken: string;
  saved: string;
  addMember: string;
  manageBand: string;
  doneManage: string;
  tapHint: string;
  bandCount: (n: number, max: number) => string;
  bandFull: string;
  bandEmpty: string;
  moveUp: (n: string) => string;
  moveDown: (n: string) => string;
  remove: (n: string) => string;
  removeConfirm: (n: string) => string;
  cancel: string;
  shareBand: string;
  shareImage: string;
  copyCode: string;
  copied: string;
  copyFail: string;
  importBand: string;
  importTitle: string;
  importHint: string;
  importPaste: string;
  importBad: string;
  importPreview: (n: number) => string;
  importAdd: string;
  importReplace: string;
  importDone: (n: number) => string;
  importPremiumNote: string;
  bandOf: (n: string) => string;
  ourBand: string;
  bandShareText: (n: string) => string;
  statsTitle: string;
  statGames: (n: number) => string;
  statFav: (game: string) => string;
  statLoser: (name: string, n: number) => string;
  /** d = nombre de jours depuis la dernière partie */
  statLast: (d: number) => string;
  statsReset: string;
  statsResetSure: string;
  statsResetDone: string;
  bandSubtitle: (n: number) => string;
}> = {
  fr: {
    myBand: "Ma bande",
    myBandSub: "Vos persos : couleur, coupe, chapeau…",
    tabs: { color: "Couleur", eyes: "Yeux", hair: "Cheveux", hat: "Chapeaux", face: "Visage", extra: "Accessoires" },
    hairColor: "Couleur des cheveux",
    random: "Au hasard",
    reset: "Réinitialiser",
    save: "Enregistrer",
    saveLocked: "Enregistrer avec Zinzin+",
    lockedHint: "Cadenas = Zinzin+ : essaie tout librement.",
    secret: "Secret",
    zinzinCrown: "Couronne réservée aux vrais Zinzin",
    bossShades: "Le Boss est dans la place 😎",
    locked: "Zinzin+",
    selected: "choisi",
    close: "Fermer",
    editAria: (n) => `Personnaliser ${n}`,
    editTitle: (n) => `Le perso de ${n}`,
    me: "Moi",
    itsMe: "C'est moi",
    nameLabel: "Prénom",
    namePlaceholder: "Son prénom",
    nameTaken: "Ce prénom est déjà dans la bande",
    saved: "Perso enregistré !",
    addMember: "Ajouter un perso",
    manageBand: "Modifier la bande",
    doneManage: "Terminé",
    tapHint: "Touche un perso pour l'entendre",
    bandCount: (n, max) => `${n}/${max} persos`,
    bandFull: "La bande est complète (16 persos)",
    bandEmpty: "Crée ton perso, puis ceux de tes potes : ils apparaîtront dans tous les jeux.",
    moveUp: (n) => `Monter ${n}`,
    moveDown: (n) => `Descendre ${n}`,
    remove: (n) => `Retirer ${n}`,
    removeConfirm: (n) => `Retirer ${n} de la bande ?`,
    cancel: "Annuler",
    shareBand: "Partager ma bande",
    shareImage: "Partager en image",
    copyCode: "Copier le code de ma bande",
    copied: "Code copié : envoie-le à tes potes !",
    copyFail: "Copie impossible : sélectionne le code ci-dessous.",
    importBand: "Importer une bande",
    importTitle: "Importer une bande",
    importHint: "Colle ici le code reçu (il commence par ZZB1-).",
    importPaste: "Coller",
    importBad: "Code illisible : vérifie qu'il est complet.",
    importPreview: (n) => `${n} perso${n > 1 ? "s" : ""} trouvé${n > 1 ? "s" : ""}`,
    importAdd: "Ajouter à ma bande",
    importReplace: "Remplacer ma bande",
    importDone: (n) => `${n} perso${n > 1 ? "s" : ""} ajouté${n > 1 ? "s" : ""} !`,
    importPremiumNote: "Les éléments Zinzin+ s'afficheront dans les jeux avec Zinzin+.",
    bandOf: (n) => `La bande de ${n}`,
    ourBand: "Notre bande",
    bandShareText: (n) => `${n} : la bande au complet sur Zinzin !`,
    statsTitle: "Les stats de la bande",
    statGames: (n) => `${n} partie${n > 1 ? "s" : ""} jouée${n > 1 ? "s" : ""}`,
    statFav: (g) => `Jeu préféré : ${g}`,
    statLoser: (name, n) => `Qui perd le plus : ${name} (${n})`,
    statLast: (d) => `Dernière partie : ${d === 0 ? "aujourd'hui" : d === 1 ? "hier" : d < 14 ? `il y a ${d} jours` : d < 60 ? `il y a ${Math.round(d / 7)} semaines` : `il y a ${Math.round(d / 30)} mois`}`,
    statsReset: "Remettre à zéro",
    statsResetSure: "Sûr ? Touche encore",
    statsResetDone: "Stats remises à zéro",
    bandSubtitle: (n) => `${n} perso${n > 1 ? "s" : ""}, zéro sérieux`,
  },
  en: {
    myBand: "My crew",
    myBandSub: "Your characters: colour, hair, hat…",
    tabs: { color: "Colour", eyes: "Eyes", hair: "Hair", hat: "Hats", face: "Face", extra: "Extras" },
    hairColor: "Hair colour",
    random: "Random",
    reset: "Reset",
    save: "Save",
    saveLocked: "Save with Zinzin+",
    lockedHint: "Padlock = Zinzin+: try anything on.",
    secret: "Secret",
    zinzinCrown: "Crown reserved for true Zinzins",
    bossShades: "The Boss is in the house 😎",
    locked: "Zinzin+",
    selected: "selected",
    close: "Close",
    editAria: (n) => `Customise ${n}`,
    editTitle: (n) => `${n}'s character`,
    me: "Me",
    itsMe: "This is me",
    nameLabel: "Name",
    namePlaceholder: "Their name",
    nameTaken: "That name is already in the crew",
    saved: "Character saved!",
    addMember: "Add a character",
    manageBand: "Edit the crew",
    doneManage: "Done",
    tapHint: "Tap a character to hear them",
    bandCount: (n, max) => `${n}/${max} characters`,
    bandFull: "Your crew is full (16 characters)",
    bandEmpty: "Make your character, then your friends': they'll show up in every game.",
    moveUp: (n) => `Move ${n} up`,
    moveDown: (n) => `Move ${n} down`,
    remove: (n) => `Remove ${n}`,
    removeConfirm: (n) => `Remove ${n} from the crew?`,
    cancel: "Cancel",
    shareBand: "Share my crew",
    shareImage: "Share as an image",
    copyCode: "Copy my crew code",
    copied: "Code copied: send it to your friends!",
    copyFail: "Couldn't copy: select the code below.",
    importBand: "Import a crew",
    importTitle: "Import a crew",
    importHint: "Paste the code you received (it starts with ZZB1-).",
    importPaste: "Paste",
    importBad: "Can't read that code: check it's complete.",
    importPreview: (n) => `${n} character${n > 1 ? "s" : ""} found`,
    importAdd: "Add to my crew",
    importReplace: "Replace my crew",
    importDone: (n) => `${n} character${n > 1 ? "s" : ""} added!`,
    importPremiumNote: "Zinzin+ items will show in games with Zinzin+.",
    bandOf: (n) => `${n}'s crew`,
    ourBand: "Our crew",
    bandShareText: (n) => `${n}: the whole crew on Zinzin!`,
    statsTitle: "Crew stats",
    statGames: (n) => `${n} game${n > 1 ? "s" : ""} played`,
    statFav: (g) => `Favourite game: ${g}`,
    statLoser: (name, n) => `Loses the most: ${name} (${n})`,
    statLast: (d) => `Last game: ${d === 0 ? "today" : d === 1 ? "yesterday" : d < 14 ? `${d} days ago` : d < 60 ? `${Math.round(d / 7)} weeks ago` : `${Math.round(d / 30)} months ago`}`,
    statsReset: "Reset",
    statsResetSure: "Sure? Tap again",
    statsResetDone: "Stats reset",
    bandSubtitle: (n) => `${n} character${n > 1 ? "s" : ""}, zero chill`,
  },
  es: {
    myBand: "Mi grupo",
    myBandSub: "Vuestros personajes: color, pelo, sombrero…",
    tabs: { color: "Color", eyes: "Ojos", hair: "Pelo", hat: "Sombreros", face: "Cara", extra: "Accesorios" },
    hairColor: "Color del pelo",
    random: "Al azar",
    reset: "Restablecer",
    save: "Guardar",
    saveLocked: "Guardar con Zinzin+",
    lockedHint: "Candado = Zinzin+: pruébalo todo.",
    secret: "Secreto",
    zinzinCrown: "Corona reservada a los verdaderos Zinzin",
    bossShades: "El Jefe ha llegado 😎",
    locked: "Zinzin+",
    selected: "elegido",
    close: "Cerrar",
    editAria: (n) => `Personalizar a ${n}`,
    editTitle: (n) => `El personaje de ${n}`,
    me: "Yo",
    itsMe: "Soy yo",
    nameLabel: "Nombre",
    namePlaceholder: "Su nombre",
    nameTaken: "Ese nombre ya está en el grupo",
    saved: "¡Personaje guardado!",
    addMember: "Añadir un personaje",
    manageBand: "Editar el grupo",
    doneManage: "Listo",
    tapHint: "Toca un personaje para oírlo",
    bandCount: (n, max) => `${n}/${max} personajes`,
    bandFull: "El grupo está completo (16 personajes)",
    bandEmpty: "Crea tu personaje y luego los de tus amigos: saldrán en todos los juegos.",
    moveUp: (n) => `Subir a ${n}`,
    moveDown: (n) => `Bajar a ${n}`,
    remove: (n) => `Quitar a ${n}`,
    removeConfirm: (n) => `¿Quitar a ${n} del grupo?`,
    cancel: "Cancelar",
    shareBand: "Compartir mi grupo",
    shareImage: "Compartir como imagen",
    copyCode: "Copiar el código de mi grupo",
    copied: "Código copiado: ¡mándaselo a tus amigos!",
    copyFail: "No se pudo copiar: selecciona el código de abajo.",
    importBand: "Importar un grupo",
    importTitle: "Importar un grupo",
    importHint: "Pega aquí el código que te han pasado (empieza por ZZB1-).",
    importPaste: "Pegar",
    importBad: "No se puede leer el código: comprueba que esté completo.",
    importPreview: (n) => `${n} personaje${n > 1 ? "s" : ""} encontrado${n > 1 ? "s" : ""}`,
    importAdd: "Añadir a mi grupo",
    importReplace: "Sustituir mi grupo",
    importDone: (n) => `¡${n} personaje${n > 1 ? "s" : ""} añadido${n > 1 ? "s" : ""}!`,
    importPremiumNote: "Los elementos Zinzin+ se verán en los juegos con Zinzin+.",
    bandOf: (n) => `El grupo de ${n}`,
    ourBand: "Nuestro grupo",
    bandShareText: (n) => `${n}: ¡el grupo al completo en Zinzin!`,
    statsTitle: "Las stats del grupo",
    statGames: (n) => `${n} partida${n > 1 ? "s" : ""} jugada${n > 1 ? "s" : ""}`,
    statFav: (g) => `Juego favorito: ${g}`,
    statLoser: (name, n) => `El que más pierde: ${name} (${n})`,
    statLast: (d) => `Última partida: ${d === 0 ? "hoy" : d === 1 ? "ayer" : d < 14 ? `hace ${d} días` : d < 60 ? `hace ${Math.round(d / 7)} semanas` : `hace ${Math.round(d / 30)} meses`}`,
    statsReset: "Poner a cero",
    statsResetSure: "¿Seguro? Toca otra vez",
    statsResetDone: "Stats a cero",
    bandSubtitle: (n) => `${n} personaje${n > 1 ? "s" : ""}, cero seriedad`,
  },
};

/** Noms des éléments (aucun nom d'œuvre ni de personnage). */
export const AVATAR_NAMES: I18n<Record<string, string>> = {
  fr: {
    // couleurs
    "color.pink": "Rose", "color.yellow": "Jaune", "color.purple": "Violet", "color.mint": "Menthe", "color.sky": "Lagon",
    "color.coral": "Corail", "color.lavender": "Lavande", "color.white": "Crème", "color.orange": "Orange", "color.cherry": "Cerise",
    "color.blue": "Bleu", "color.forest": "Sapin", "color.cocoa": "Cacao", "color.peach": "Pêche", "color.night": "Nuit", "color.lime": "Citron vert",
    // couleurs de cheveux
    "hc.auto": "D'origine", "hc.black": "Noir", "hc.brown": "Châtain", "hc.blond": "Blond", "hc.ginger": "Roux", "hc.pink": "Rose",
    "hc.blue": "Bleu", "hc.green": "Vert", "hc.white": "Blanc", "hc.purple": "Violet",
    // yeux
    "eyes.classic": "Zinzin", "eyes.big": "Yeux brillants", "eyes.happy": "Ravi", "eyes.sleepy": "Endormi", "eyes.determined": "Déterminé",
    "eyes.star": "Étoiles", "eyes.heart": "Amoureux", "eyes.wink": "Clin d'œil", "eyes.dots": "Petits points", "eyes.cross": "Qui louche",
    // cheveux
    "hair.none": "Aucun", "hair.swoop": "Mèche", "hair.afro": "Afro", "hair.mohawk": "Crête", "hair.bun": "Chignon",
    "hair.pigtails": "Couettes", "hair.golden": "Pétard doré", "hair.swordsman": "Coupe du sabreur", "hair.hero": "Cheveux de héros",
    "hair.long": "Longs lisses", "hair.buzz": "Rasé", "hair.curly": "Bouclés", "hair.bowl": "Frange au bol", "hair.emo": "Mèche rebelle",
    "hair.flame": "Flammes",
    "hair.silver": "Longs cheveux d'argent", "hair.ponytail": "Queue de cheval haute", "hair.messy": "Épis en bataille",
    "hair.twintails": "Longues couettes", "hair.sticks": "Chignon à baguettes", "hair.hedgehog": "Hérisson",
    "hair.streak": "Mèche bleue", "hair.peekaboo": "Mèches sur l'œil", "hair.ahoge": "Épi antenne", "hair.mane": "Crinière sauvage",
    // chapeaux
    "hat.none": "Aucun", "hat.straw": "Chapeau de paille", "hat.cap": "Casquette", "hat.beanie": "Bonnet", "hat.crown": "Couronne",
    "hat.horns": "Cornes", "hat.bucket": "Bob", "hat.ninja": "Bandeau ninja", "hat.cowboy": "Chapeau de cowboy", "hat.bow": "Nœud",
    "hat.halo": "Auréole", "hat.tophat": "Haut-de-forme", "hat.party": "Chapeau de fête", "hat.bandana": "Bandana noué",
    "hat.goldhalo": "Auréole dorée",
    // visage
    "face.none": "Aucun", "face.shades": "Lunettes de soleil", "face.round": "Lunettes rondes", "face.moustache": "Moustache",
    "face.scar": "Cicatrice sous l'œil", "face.plaster": "Pansement", "face.mask": "Masque", "face.patch": "Bandeau sur l'œil",
    "face.blush": "Joues roses", "face.goggles": "Lunettes de pilote", "face.freckles": "Taches de rousseur", "face.beard": "Barbe",
    "face.domino": "Loup de justicier",
    "face.crossscar": "Cicatrice en croix", "face.bandages": "Bandages", "face.earring": "Boucle d'oreille",
    // accessoires
    "extra.none": "Aucun", "extra.scarf": "Écharpe", "extra.armband": "Bandana au bras", "extra.necklace": "Collier", "extra.bowtie": "Nœud papillon",
    "extra.cape": "Cape", "extra.tie": "Cravate", "extra.headphones": "Casque audio", "extra.wings": "Petites ailes", "extra.lei": "Collier de fleurs",
    "extra.katana": "Sabre dans le dos", "extra.longscarf": "Écharpe au vent",
  },
  en: {
    "color.pink": "Pink", "color.yellow": "Yellow", "color.purple": "Purple", "color.mint": "Mint", "color.sky": "Lagoon",
    "color.coral": "Coral", "color.lavender": "Lavender", "color.white": "Cream", "color.orange": "Orange", "color.cherry": "Cherry",
    "color.blue": "Blue", "color.forest": "Pine", "color.cocoa": "Cocoa", "color.peach": "Peach", "color.night": "Night", "color.lime": "Lime",
    "hc.auto": "Original", "hc.black": "Black", "hc.brown": "Brown", "hc.blond": "Blond", "hc.ginger": "Ginger", "hc.pink": "Pink",
    "hc.blue": "Blue", "hc.green": "Green", "hc.white": "White", "hc.purple": "Purple",
    "eyes.classic": "Zinzin", "eyes.big": "Sparkly eyes", "eyes.happy": "Delighted", "eyes.sleepy": "Sleepy", "eyes.determined": "Determined",
    "eyes.star": "Starry", "eyes.heart": "Lovestruck", "eyes.wink": "Wink", "eyes.dots": "Little dots", "eyes.cross": "Cross-eyed",
    "hair.none": "None", "hair.swoop": "Swoop", "hair.afro": "Afro", "hair.mohawk": "Mohawk", "hair.bun": "Bun",
    "hair.pigtails": "Pigtails", "hair.golden": "Golden spikes", "hair.swordsman": "Swordsman cut", "hair.hero": "Hero spikes",
    "hair.long": "Long & straight", "hair.buzz": "Buzz cut", "hair.curly": "Curly", "hair.bowl": "Bowl cut", "hair.emo": "Side fringe",
    "hair.flame": "Flames",
    "hair.silver": "Long silver hair", "hair.ponytail": "High ponytail", "hair.messy": "Messy spikes",
    "hair.twintails": "Long twin tails", "hair.sticks": "Bun with sticks", "hair.hedgehog": "Hedgehog",
    "hair.streak": "Blue streak", "hair.peekaboo": "Peekaboo fringe", "hair.ahoge": "Antenna strand", "hair.mane": "Wild mane",
    "hat.none": "None", "hat.straw": "Straw hat", "hat.cap": "Cap", "hat.beanie": "Beanie", "hat.crown": "Crown",
    "hat.horns": "Horns", "hat.bucket": "Bucket hat", "hat.ninja": "Ninja headband", "hat.cowboy": "Cowboy hat", "hat.bow": "Bow",
    "hat.halo": "Halo", "hat.tophat": "Top hat", "hat.party": "Party hat", "hat.bandana": "Tied bandana",
    "hat.goldhalo": "Golden halo",
    "face.none": "None", "face.shades": "Sunglasses", "face.round": "Round glasses", "face.moustache": "Moustache",
    "face.scar": "Scar under the eye", "face.plaster": "Plaster", "face.mask": "Face mask", "face.patch": "Eye patch",
    "face.blush": "Rosy cheeks", "face.goggles": "Pilot goggles", "face.freckles": "Freckles", "face.beard": "Beard",
    "face.domino": "Vigilante mask",
    "face.crossscar": "Cross scar", "face.bandages": "Bandages", "face.earring": "Drop earring",
    "extra.none": "None", "extra.scarf": "Scarf", "extra.armband": "Arm bandana", "extra.necklace": "Necklace", "extra.bowtie": "Bow tie",
    "extra.cape": "Cape", "extra.tie": "Tie", "extra.headphones": "Headphones", "extra.wings": "Little wings", "extra.lei": "Flower garland",
    "extra.katana": "Sword on the back", "extra.longscarf": "Windswept scarf",
  },
  es: {
    "color.pink": "Rosa", "color.yellow": "Amarillo", "color.purple": "Morado", "color.mint": "Menta", "color.sky": "Laguna",
    "color.coral": "Coral", "color.lavender": "Lavanda", "color.white": "Crema", "color.orange": "Naranja", "color.cherry": "Cereza",
    "color.blue": "Azul", "color.forest": "Pino", "color.cocoa": "Cacao", "color.peach": "Melocotón", "color.night": "Noche", "color.lime": "Lima",
    "hc.auto": "Original", "hc.black": "Negro", "hc.brown": "Castaño", "hc.blond": "Rubio", "hc.ginger": "Pelirrojo", "hc.pink": "Rosa",
    "hc.blue": "Azul", "hc.green": "Verde", "hc.white": "Blanco", "hc.purple": "Morado",
    "eyes.classic": "Zinzin", "eyes.big": "Ojos brillantes", "eyes.happy": "Encantado", "eyes.sleepy": "Dormido", "eyes.determined": "Decidido",
    "eyes.star": "Estrellas", "eyes.heart": "Enamorado", "eyes.wink": "Guiño", "eyes.dots": "Puntitos", "eyes.cross": "Bizco",
    "hair.none": "Ninguno", "hair.swoop": "Flequillo de lado", "hair.afro": "Afro", "hair.mohawk": "Cresta", "hair.bun": "Moño",
    "hair.pigtails": "Coletas", "hair.golden": "Puntas doradas", "hair.swordsman": "Corte de espadachín", "hair.hero": "Puntas de héroe",
    "hair.long": "Largo y liso", "hair.buzz": "Rapado", "hair.curly": "Rizado", "hair.bowl": "Corte tazón", "hair.emo": "Flequillo rebelde",
    "hair.flame": "Llamas",
    "hair.silver": "Melena plateada", "hair.ponytail": "Coleta alta", "hair.messy": "Puntas revueltas",
    "hair.twintails": "Coletas largas", "hair.sticks": "Moño con palillos", "hair.hedgehog": "Erizo",
    "hair.streak": "Mechón azul", "hair.peekaboo": "Flequillo sobre el ojo", "hair.ahoge": "Pelo antena", "hair.mane": "Melena salvaje",
    "hat.none": "Ninguno", "hat.straw": "Sombrero de paja", "hat.cap": "Gorra", "hat.beanie": "Gorro", "hat.crown": "Corona",
    "hat.horns": "Cuernos", "hat.bucket": "Gorro de pescador", "hat.ninja": "Cinta ninja", "hat.cowboy": "Sombrero vaquero", "hat.bow": "Lazo",
    "hat.halo": "Aureola", "hat.tophat": "Sombrero de copa", "hat.party": "Gorro de fiesta", "hat.bandana": "Pañuelo anudado",
    "hat.goldhalo": "Aureola dorada",
    "face.none": "Ninguno", "face.shades": "Gafas de sol", "face.round": "Gafas redondas", "face.moustache": "Bigote",
    "face.scar": "Cicatriz bajo el ojo", "face.plaster": "Tirita", "face.mask": "Mascarilla", "face.patch": "Parche en el ojo",
    "face.blush": "Mejillas rosas", "face.goggles": "Gafas de piloto", "face.freckles": "Pecas", "face.beard": "Barba",
    "face.domino": "Antifaz de justiciero",
    "face.crossscar": "Cicatriz en cruz", "face.bandages": "Vendas", "face.earring": "Pendiente colgante",
    "extra.none": "Ninguno", "extra.scarf": "Bufanda", "extra.armband": "Pañuelo en el brazo", "extra.necklace": "Collar", "extra.bowtie": "Pajarita",
    "extra.cape": "Capa", "extra.tie": "Corbata", "extra.headphones": "Cascos", "extra.wings": "Alitas", "extra.lei": "Collar de flores",
    "extra.katana": "Espada a la espalda", "extra.longscarf": "Bufanda al viento",
  },
};
