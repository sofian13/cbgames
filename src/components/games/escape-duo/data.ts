/* ──────────────────────────────────────────────────────────────
   ESCAPE DUO — donnees (codes, relais, roles) + types.
   Porte de duo-data.jsx / duo-app.jsx du prototype.
   ────────────────────────────────────────────────────────────── */

export type RoleId = "atelier" | "biblio";

export interface EduProgress {
  items: string[];
  clues: string[];
  escaped: boolean;
  hintsUsed: number;
  brickFound: boolean; drawerOpen: boolean; clockSet: boolean; safeOpen: boolean;
  lampFound: boolean; lampOn: boolean; bookOpen: boolean; calendarSeen: boolean; vitrineOpen: boolean;
  tonneauFound: boolean; chestOpen: boolean; boilerSet: boolean;
  noteFound: boolean; starmapSeen: boolean; telescopeSet: boolean;
}

export type SceneState = EduProgress & { finalReady: boolean };

export interface EduActions {
  addItem: (id: string) => void;
  setFlag: (k: keyof EduProgress | "escaped", v: boolean) => void;
  addClue: (t: string) => void;
  hasItem: (id: string) => boolean;
}

export const FRESH_PROGRESS: EduProgress = {
  items: [], clues: [], escaped: false, hintsUsed: 0,
  brickFound: false, drawerOpen: false, clockSet: false, safeOpen: false,
  lampFound: false, lampOn: false, bookOpen: false, calendarSeen: false, vitrineOpen: false,
  tonneauFound: false, chestOpen: false, boilerSet: false,
  noteFound: false, starmapSeen: false, telescopeSet: false,
};

// Cle de chiffrement (le livre rouge la revele)
export const CIPHER_ROWS: [string, number][] = [
  ["⚙", 8], ["✦", 1], ["☾", 5], ["⚷", 9],
  ["✶", 3], ["✷", 4], ["⚹", 7], ["✸", 2],
];

export const CODES = {
  drawer: "347",
  book: "619",
  clockH: 3, clockM: 45,
  safeSymbols: ["⚙", "✦", "☾", "⚷"],
  safe: "8159",
  vitrineSymbols: ["✦", "☾"],
  vitrine: "15",
  final: "27",
};

export const RELAY = {
  brick: "📢 Dis à ton binôme (Bibliothèque) : « le fermoir du grand livre rouge = 6 - 1 - 9 ».",
  lamp: "📢 Dis à ton binôme (Atelier) : « le tiroir de l'établi = 3 - 4 - 7 ».",
  calendar: "📢 Dis à ton binôme (Atelier) : « arrête l'horloge à 3 h 45 ».",
  clockOut: "📢 Dis à ton binôme (Bibliothèque) : « la vitrine veut Étoile puis Croissant (✦ ☾) ».",
  finalA: "📢 Dis à ton binôme : « mon chiffre est 2 ».",
  finalB: "📢 Dis à ton binôme : « mon chiffre est 7 ».",
};

export const ROLES = {
  atelier: {
    id: "atelier", name: "L'Atelier", short: "Atelier", emoji: "🔧", accent: "#C9A24B",
    blurb: "Établi, horloge, coffre. Tu manipules, tu règles, tu ouvres.",
    intro: "Tu es enfermé dans l'atelier du vieil horloger. Ton binôme est dans la bibliothèque, de l'autre côté du mur. Vous vous entendez, mais ne vous voyez pas. Fouillez, parlez, échappez-vous ensemble.",
  },
  biblio: {
    id: "biblio", name: "La Bibliothèque", short: "Biblio", emoji: "📚", accent: "#7FB2A6",
    blurb: "Livres, calendrier, vitrine. Tu décodes, tu cherches, tu déduis.",
    intro: "Tu es enfermé dans la bibliothèque. Ton binôme est dans l'atelier voisin. Le grand livre rouge tient la clé de bien des mystères — encore faut-il l'ouvrir. Parlez-vous à travers le mur.",
  },
} as const;

/* ── Niveau 2 ── */
export const CODES2 = {
  carte: "428",
  coffre: "731",
  telescope: "73",
  chaudiere: "64",
  final: "49",
};

export const RELAY2 = {
  tonneau: "📢 Dis à ton binôme (Observatoire) : « la carte des étoiles = 4 - 2 - 8 ».",
  hublot: "📢 Dis à ton binôme (Cave) : « le coffre = 7 - 3 - 1 ».",
  coffreOut: "📢 Dis à ton binôme (Observatoire) : « oriente la lunette sur 7 puis 3 ».",
  carteOut: "📢 Dis à ton binôme (Cave) : « la pression de la chaudière = 6 - 4 ».",
  finalA: "📢 Dis à ton binôme : « mon chiffre est 4 ».",
  finalB: "📢 Dis à ton binôme : « mon chiffre est 9 ».",
};

export const ROOMS2 = {
  atelier: {
    name: "La Cave", short: "Cave", emoji: "🛢️", accent: "#C98F4B",
    intro: "Un escalier de pierre vous a menés à la cave humide. Ton binôme est monté à l'observatoire, tout en haut. Le mur vous sépare encore — mais vos voix passent. Trouvez la sortie.",
  },
  biblio: {
    name: "L'Observatoire", short: "Dôme", emoji: "🔭", accent: "#8AA6D8",
    intro: "Un escalier en colimaçon vous a hissés sous le dôme étoilé. Ton binôme est descendu à la cave. Le ciel regorge d'indices — et ton binôme aussi.",
  },
} as const;

export const HINTS: Record<RoleId, string[]> = {
  atelier: [
    "Une brique du mur bouge. Commence par là — et dicte ce que tu trouves à ton binôme.",
    "Le tiroir veut 3 chiffres : ton binôme les a trouvés sous une lampe, dans la Bibliothèque.",
    "Règle l'horloge : l'heure exacte est entourée sur le calendrier de ton binôme.",
    "Le coffre : ouvre d'abord le tiroir (loupe), lis les 4 symboles, ton binôme les traduit en code.",
    "Tu as ton chiffre. Échangez : tape le code à 2 chiffres (Atelier puis Biblio) sur la porte.",
  ],
  biblio: [
    "Soulève la lampe de lecture : un mot est glissé dessous. Dicte-le à ton binôme.",
    "Le grand livre rouge veut 3 chiffres : ton binôme les a trouvés derrière une brique.",
    "Feuillette le calendrier : l'heure entourée intéresse beaucoup ton binôme.",
    "La vitrine veut 2 chiffres : traduis les 2 symboles de ton binôme avec le livre rouge.",
    "Tu as ton chiffre. Échangez : tape le code à 2 chiffres (Atelier puis Biblio) sur la porte.",
  ],
};

export const HINTS2: Record<RoleId, string[]> = {
  atelier: [
    "Roule les tonneaux : un mot est tracé à la craie derrière. Dicte-le à ton binôme.",
    "Le vieux coffre veut 3 chiffres : ton binôme les a trouvés dans le hublot de l'Observatoire.",
    "La chaudière : récupère d'abord la manivelle dans le coffre, puis règle la pression que ton binôme lit sur la carte.",
    "Tu as ton chiffre. Échangez : tape le code à 2 chiffres (Cave puis Dôme) sur la porte.",
  ],
  biblio: [
    "Regarde le hublot : un mot y est glissé. Dicte-le à ton binôme.",
    "La carte des étoiles veut 3 chiffres : ton binôme les a trouvés derrière les tonneaux de la Cave.",
    "La lunette veut 2 chiffres d'orientation : ton binôme les a trouvés dans le coffre de la Cave.",
    "Tu as ton chiffre. Échangez : tape le code à 2 chiffres (Cave puis Dôme) sur la porte.",
  ],
};

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
