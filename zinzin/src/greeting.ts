import type { I18n } from "@/lib/i18n";

/**
 * Petite phrase de l'accueil selon l'heure (et le week-end le matin).
 * Ton complice, jamais incitatif à boire. Tirée au hasard une fois par ouverture
 * (8 variantes par plage, jamais deux fois de suite la même).
 * Secret : de 3 h à 3 h 59, phrase spéciale (« three ») et les blobs de l'accueil ont des cernes
 * (classe zz-3h, voir Home.tsx / zinzin.css). En dev, `?zz3h=1` pour forcer.
 */
type BaseSlot = "morningWeekend" | "morning" | "day" | "apero" | "evening" | "night" | "late";
type Slot = BaseSlot | "three";

/** 3 h du matin : remplace la plage « late » pendant cette heure-là. */
const THREE_AM: I18n<string[]> = {
  fr: ["Il est 3 h. Vous êtes sûrs de vous ?", "3 h du mat'. Vous êtes sûrs de vous ?", "Il est 3 h. Même les blobs ont des cernes."],
  en: ["It's 3 a.m. Are you sure about this?", "3 a.m. Are you all sure about this?", "It's 3 a.m. Even the blobs look tired."],
  es: ["Son las 3. ¿Estáis seguros de esto?", "Las 3 de la mañana. ¿Seguro que sí?", "Son las 3. Hasta los blobs tienen ojeras."],
};

/** Entre 3 h et 3 h 59 (heure locale) ; en dev, `?zz3h=1` force le secret. */
export function isThreeAm(now = new Date()): boolean {
  if (import.meta.env.DEV && typeof location !== "undefined" && new URLSearchParams(location.search).get("zz3h") === "1") return true;
  return now.getHours() === 3;
}

const lines = (lang: keyof typeof LINES, slot: Slot): string[] => (slot === "three" ? THREE_AM[lang] : LINES[lang][slot]);

const LINES: I18n<Record<BaseSlot, string[]>> = {
  fr: {
    morningWeekend: [
      "Ça pique un peu ce matin ?", "Grosse soirée hier, non ?", "Café d'abord, Zinzin ensuite.", "Au fait, qui a gagné hier ?",
      "Quelqu'un se souvient des scores ?", "On débriefe la soirée ?", "Doucement, le volume ce matin.", "Les gages d'hier, on en parle ?",
    ],
    morning: [
      "Déjà là ? Tu prépares ce soir ?", "Petit échauffement matinal ?", "Bien dormi ? On révise les règles.", "Le matin, on s'entraîne en secret.",
      "Personne ne saura que tu révises.", "Trop tôt pour tricher, non ?", "Café, croissant, Zinzin.", "Tu repères les jeux pour ce soir ?",
    ],
    day: [
      "Personne n'a dit qu'il fallait attendre ce soir.", "Pause de midi ? Une petite partie.", "Repérage pour ce soir ?", "Le tél est chargé ? Parfait.",
      "Une partie vite fait ? Promis, juste une.", "Ce soir, tu seras imbattable.", "Les collègues ne verront rien.", "Mode discret activé.",
    ],
    apero: [
      "L'heure de l'apéro approche…", "Sortez les chips, on arrive.", "Fin de journée : place au n'importe quoi.", "Qui ramène quoi ce soir ?",
      "Les cacahuètes sont prêtes ?", "La journée est finie, le fun commence.", "On chauffe la bande ?", "Qui invite qui ce soir ?",
    ],
    evening: [
      "La soirée commence, la bande est là ?", "Ce soir, quelqu'un va perdre. Qui ?", "Téléphone au centre de la table.", "Soirée en vue, ambiance zinzin.",
      "Que la meilleure bande gagne.", "Les mauvais perdants, on vous voit.", "Prêts à vous fâcher pour de faux ?", "Ce soir, pas de pitié (pour de rire).",
    ],
    night: [
      "La soirée bat son plein.", "Encore une partie ? Évidemment.", "Le niveau monte (le volume aussi).", "Pensez aux voisins. Un peu.",
      "Revanche ? Revanche.", "Qui a encore de la batterie ?", "Le mauvais perdant du soir est…", "On ne compte plus les fous rires.",
    ],
    late: [
      "Vous êtes encore debout ? Respect.", "Dernière partie… promis.", "À cette heure-ci, tout le monde triche.", "Un verre d'eau et on continue ?",
      "Les vrais sont encore là.", "Demain sera un autre jour. Lointain.", "Chut, le quartier dort.", "Qui rentre comment ? On s'organise.",
    ],
  },
  en: {
    morningWeekend: [
      "Feeling a bit rough this morning?", "Big night yesterday, huh?", "Coffee first, Zinzin later.", "So… who won last night?",
      "Anyone remember the scores?", "Debrief time?", "Easy on the volume this morning.", "Shall we talk about last night's dares?",
    ],
    morning: [
      "Up already? Planning tonight?", "A little morning warm-up?", "Slept well? Time to revise the rules.", "Secret morning training, huh?",
      "Nobody has to know you're practising.", "Too early to cheat, surely?", "Coffee, toast, Zinzin.", "Picking tonight's games already?",
    ],
    day: [
      "Nobody said you had to wait for tonight.", "Lunch break? Quick game.", "Scouting for tonight?", "Phone charged? Perfect.",
      "Just one quick game. Promise.", "Tonight, you'll be unbeatable.", "Your coworkers won't notice.", "Stealth mode: on.",
    ],
    apero: [
      "Happy hour is getting close…", "Get the snacks out, we're coming.", "End of the day: time for nonsense.", "Who's bringing what tonight?",
      "Crisps ready? Good.", "Work's done, fun starts now.", "Time to warm up the crew?", "Who's hosting tonight?",
    ],
    evening: [
      "The night begins. Is the crew here?", "Someone's losing tonight. Who?", "Phone in the middle of the table.", "Party ahead, zinzin vibes.",
      "May the best crew win.", "Sore losers, we see you.", "Ready to fake-fight your friends?", "No mercy tonight (just kidding).",
    ],
    night: [
      "The party's in full swing.", "One more game? Obviously.", "It's getting wild (and loud).", "Think of the neighbours. A bit.",
      "Rematch? Rematch.", "Who's still got battery?", "Tonight's sore loser is…", "We've lost count of the laughs.",
    ],
    late: [
      "Still up? Respect.", "Last game… promise.", "At this hour, everyone cheats.", "Glass of water, then we carry on?",
      "Only the legends are left.", "Tomorrow can wait. Way over there.", "Shh, the street's asleep.", "Who's getting home how? Sort it out.",
    ],
  },
  es: {
    morningWeekend: [
      "¿Un poco de resaca esta mañana?", "Noche movida ayer, ¿no?", "Primero café, luego Zinzin.", "Por cierto, ¿quién ganó ayer?",
      "¿Alguien se acuerda de los puntos?", "¿Hacemos repaso de la noche?", "Bajito el volumen esta mañana.", "¿Hablamos de los retos de ayer?",
    ],
    morning: [
      "¿Ya por aquí? ¿Preparando la noche?", "¿Un calentamiento mañanero?", "¿Has dormido bien? Repasa las reglas.", "Entrenamiento secreto de mañana.",
      "Nadie sabrá que estás practicando.", "Muy pronto para hacer trampas, ¿no?", "Café, tostada y Zinzin.", "¿Ya eliges los juegos de esta noche?",
    ],
    day: [
      "¿Quién dijo que hay que esperar a la noche?", "¿Pausa para comer? Una partidita.", "¿Preparando lo de esta noche?", "¿Móvil cargado? Perfecto.",
      "Una partida rápida. Solo una.", "Esta noche serás imbatible.", "Tus compañeros no se enterarán.", "Modo discreto: activado.",
    ],
    apero: [
      "Se acerca la hora del aperitivo…", "Sacad las patatas, ya llegamos.", "Fin del día: hora de hacer el tonto.", "¿Quién trae qué esta noche?",
      "¿Las aceitunas, listas?", "Se acabó el curro, empieza lo bueno.", "¿Calentamos al grupo?", "¿En casa de quién esta noche?",
    ],
    evening: [
      "Empieza la noche. ¿Está el grupo?", "Esta noche alguien pierde. ¿Quién?", "El móvil, en el centro de la mesa.", "Noche a la vista, modo zinzin.",
      "Que gane el mejor grupo.", "Malos perdedores: os vemos.", "¿Listos para pelearos de broma?", "Esta noche, sin piedad (es broma).",
    ],
    night: [
      "La fiesta está en su punto.", "¿Otra partida? Obvio.", "Esto se anima (y sube el volumen).", "Pensad en los vecinos. Un poco.",
      "¿Revancha? Revancha.", "¿A quién le queda batería?", "El mal perdedor de la noche es…", "Ya no contamos las carcajadas.",
    ],
    late: [
      "¿Seguís despiertos? Respeto.", "Última partida… prometido.", "A estas horas, todos hacen trampa.", "¿Un vaso de agua y seguimos?",
      "Solo quedan los valientes.", "Mañana puede esperar. Muy lejos.", "Chis, que el barrio duerme.", "¿Cómo vuelve cada uno? Organizaos.",
    ],
  },
};

function slotOf(d: Date): BaseSlot {
  const h = d.getHours();
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  if (h >= 1 && h < 6) return "late";
  if (h >= 6 && h < 11) return weekend ? "morningWeekend" : "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 19) return "apero";
  if (h >= 19 && h < 22) return "evening";
  return "night"; // 22 h → 1 h
}

const LAST_KEY = "zz-greet-last";

/** Tirage (une fois par ouverture) : la plage horaire + la variante, jamais la même que la dernière fois dans cette plage. */
export function drawGreeting(now = new Date()): { slot: Slot; i: number } {
  const slot: Slot = isThreeAm(now) ? "three" : slotOf(now);
  const n = lines("fr", slot).length;
  let last: Partial<Record<Slot, number>> = {};
  try { last = JSON.parse(localStorage.getItem(LAST_KEY) ?? "{}") ?? {}; } catch { last = {}; }
  const prev = typeof last[slot] === "number" ? last[slot]! : -1;
  // Tirage parmi les n − 1 autres variantes
  let i = Math.floor(Math.random() * (prev >= 0 && prev < n ? n - 1 : n));
  if (prev >= 0 && prev < n && i >= prev) i++;
  try { localStorage.setItem(LAST_KEY, JSON.stringify({ ...last, [slot]: i })); } catch { /* stockage indisponible */ }
  return { slot, i };
}

/** Le texte du tirage, dans la langue courante (même variante si on change de langue). */
export function greetingText(g: { slot: Slot; i: number }, lang: keyof typeof LINES): string {
  const list = lines(lang, g.slot);
  return list[g.i % list.length];
}
