/**
 * Le Faux Témoin — génération procédurale des scènes et des questions.
 * Données pures (aucun texte) : les libellés sont dans i18n.ts.
 * Une scène = un décor (35 lieux, chacun avec son gros élément coloré et, souvent, un détail
 * à compter) + 3 à 5 blobs (couleur, accessoire, endormi ? bras levés ?) + 1 à 3 objets
 * au sol + 1 à 2 éléments « au mur » (horloge, panneau, ballons). 6 à 10 éléments en tout.
 * Les questions sont tirées des attributs réellement présents : réponse juste garantie.
 */

export type ColorId = "red" | "yellow" | "blue" | "green" | "pink" | "purple" | "orange";
export const COLOR_IDS: ColorId[] = ["red", "yellow", "blue", "green", "pink", "purple", "orange"];
export const COLOR_HEX: Record<ColorId, string> = {
  red: "#FF4B3E",
  yellow: "#FFD23F",
  blue: "#3D8BFF",
  green: "#3DDC97",
  pink: "#FF3EA5",
  purple: "#8B5CF6",
  orange: "#FF9F1C",
};

export type DecorId =
  | "kitchen" | "beach" | "party" | "street" | "classroom" | "forest"
  | "tvset" | "pool" | "club" | "wedding" | "park"
  | "bank" | "supermarket" | "metro" | "camping" | "gym" | "birthday" | "airport" | "hospital"
  | "concert" | "zoo" | "funfair" | "laundromat" | "office" | "schoolyard" | "christmas" | "hotel"
  | "cruise" | "worksite" | "farm" | "museum" | "salon" | "train" | "festival" | "restaurant";
export const DECOR_IDS: DecorId[] = [
  "kitchen", "beach", "party", "street", "classroom", "forest", "tvset", "pool", "club", "wedding", "park",
  "bank", "supermarket", "metro", "camping", "gym", "birthday", "airport", "hospital",
  "concert", "zoo", "funfair", "laundromat", "office", "schoolyard", "christmas", "hotel",
  "cruise", "worksite", "farm", "museum", "salon", "train", "festival", "restaurant",
];
/** Décors en intérieur (l'horloge n'a de sens qu'au mur). */
export const INDOOR: Record<DecorId, boolean> = {
  kitchen: true, beach: false, party: true, street: false, classroom: true, forest: false,
  tvset: true, pool: false, club: true, wedding: true, park: false,
  bank: true, supermarket: true, metro: true, camping: false, gym: true, birthday: true, airport: true, hospital: true,
  concert: false, zoo: false, funfair: false, laundromat: true, office: true, schoolyard: false, christmas: true, hotel: true,
  cruise: false, worksite: false, farm: false, museum: true, salon: true, train: true, festival: false, restaurant: true,
};
/** Détail à compter propre au décor (bougies, lingots, mouettes…) : [min, max]. */
export type CountDecor = Exclude<DecorId, "kitchen" | "beach" | "party" | "street" | "classroom" | "forest" | "tvset" | "pool" | "club" | "wedding" | "park">;
export const COUNT_RANGE: Record<CountDecor, [number, number]> = {
  bank: [2, 5], supermarket: [2, 5], metro: [2, 4], camping: [2, 5], gym: [2, 4], birthday: [2, 6],
  airport: [2, 5], hospital: [2, 5], concert: [2, 5], zoo: [2, 4], funfair: [4, 8], laundromat: [2, 5],
  office: [2, 6], schoolyard: [2, 5], christmas: [3, 7], hotel: [2, 6], cruise: [2, 5], worksite: [2, 5],
  farm: [2, 5], museum: [2, 5], salon: [2, 5], train: [1, 4], festival: [2, 5], restaurant: [2, 5],
};
export const hasCount = (d: DecorId): d is CountDecor => d in COUNT_RANGE;
/** Couleurs interdites pour le gros élément (il se fondrait dans le décor). */
const FEATURE_AVOID: Partial<Record<DecorId, ColorId[]>> = {
  christmas: ["green"], zoo: ["yellow", "orange"], bank: ["yellow"], worksite: ["orange"],
};
/** Décors sans animal caché (on y voit déjà des animaux : la question serait ambiguë). */
const NO_PET: DecorId[] = ["zoo", "farm"];
/** Objets à éviter dans un décor (doublon avec le gros élément). */
const NO_OBJ: Partial<Record<DecorId, ObjId[]>> = { birthday: ["cake"], concert: ["guitar"] };

export type Acc = "hat" | "glasses" | "crown" | "bow";
export const ACCS: Acc[] = ["hat", "glasses", "crown", "bow"];

export type ObjId = "pizza" | "guitar" | "gift" | "plant" | "ball" | "trophy" | "radio" | "cake" | "book";
export const OBJ_IDS: ObjId[] = ["pizza", "guitar", "gift", "plant", "ball", "trophy", "radio", "cake", "book"];
/** Objets qu'on pose sur une table. */
const TABLE_ITEMS: ObjId[] = ["pizza", "cake", "plant", "trophy", "gift", "book", "radio"];

export type PetId = "cat" | "dog" | "duck";
export const PET_IDS: PetId[] = ["cat", "dog", "duck"];

export interface SBlob { color: ColorId; acc: Acc | null; asleep: boolean; cheer?: boolean; slot: number }
export type FloorThing =
  | { kind: "obj"; obj: ObjId; color: ColorId; slot: number }
  | { kind: "pet"; pet: PetId; slot: number }
  | { kind: "table"; item: ObjId; slot: number };
export type WallThing =
  | { kind: "clock"; hour: number; side: 0 | 1 }
  | { kind: "sign"; n: number; side: 0 | 1 }
  | { kind: "balloons"; count: number; color: ColorId; side: 0 | 1 };

export interface Scene {
  id: string;
  decor: DecorId;
  featureColor: ColorId;
  /** Nombre du détail à compter (si le décor en a un) */
  featureN?: number;
  blobs: SBlob[];
  floor: FloorThing[];
  wall: WallThing[];
}

/** Emplacements au sol : 0-3 rangée du fond (plus petits), 4-8 rangée de devant. */
export const SLOTS: { x: number; y: number; s: number }[] = [
  { x: 34, y: 197, s: 0.8 }, { x: 96, y: 197, s: 0.8 }, { x: 264, y: 197, s: 0.8 }, { x: 326, y: 197, s: 0.8 },
  { x: 42, y: 276, s: 1 }, { x: 111, y: 276, s: 1 }, { x: 180, y: 276, s: 1 }, { x: 249, y: 276, s: 1 }, { x: 318, y: 276, s: 1 },
];

// ── Hasard ────────────────────────────────────────────────
const rnd = (n: number) => Math.floor(Math.random() * n);
const pickOne = <T,>(a: readonly T[]): T => a[rnd(a.length)];
export function shuffle<T>(a: readonly T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Tire une scène (décor imposé ou au hasard parmi ceux pas encore joués). */
export function makeScene(avoid: DecorId[] = []): Scene {
  const pool = DECOR_IDS.filter((d) => !avoid.includes(d));
  const decor = pickOne(pool.length ? pool : DECOR_IDS);
  const nBlobs = 3 + rnd(3); // 3-5
  const nWall = 1 + rnd(2); // 1-2
  const nFloor = Math.min(3, Math.max(1, 9 - nBlobs - nWall - 1 - rnd(2))); // 1-3, total ≤ 10
  const slots = shuffle(SLOTS.map((_, i) => i));
  // Les blobs prennent d'abord la rangée de devant (plus lisibles)
  const front = slots.filter((s) => s >= 4);
  const back = slots.filter((s) => s < 4);
  const order = [...front, ...back];
  const blobSlots = order.slice(0, nBlobs);
  const rest = shuffle(order.slice(nBlobs));

  // Blobs : couleurs toutes différentes, accessoires variés (au moins un), parfois un endormi
  const colors = shuffle(COLOR_IDS).slice(0, nBlobs);
  const accPool: (Acc | null)[] = [null, null, "hat", "hat", "glasses", "glasses", "crown", "bow"];
  let blobs: SBlob[] = colors.map((color, i) => ({ color, acc: pickOne(accPool), asleep: false, slot: blobSlots[i] }));
  if (!blobs.some((b) => b.acc)) blobs[rnd(nBlobs)].acc = pickOne(ACCS);
  // Une seule couronne (sinon « le blob à la couronne » ne veut rien dire)
  let crowned = false;
  blobs = blobs.map((b) => {
    if (b.acc !== "crown") return b;
    if (crowned) return { ...b, acc: "hat" };
    crowned = true;
    return b;
  });
  if (Math.random() < 0.45) blobs[rnd(nBlobs)].asleep = true;
  // Parfois un blob lève les bras (jamais celui qui dort)
  if (Math.random() < 0.45) {
    const awake = blobs.map((b, i) => (b.asleep ? -1 : i)).filter((i) => i >= 0);
    if (awake.length) blobs[pickOne(awake)].cheer = true;
  }

  // Sol : objets / animal / table, sans doublon
  const floor: FloorThing[] = [];
  const usedObj = new Set<ObjId>(NO_OBJ[decor] ?? []);
  const kinds = shuffle<"obj" | "pet" | "table">(["obj", "obj", "pet", "table"]);
  for (let i = 0; i < nFloor; i++) {
    const kind = kinds[i % kinds.length];
    const slot = rest[i];
    if (kind === "pet" && !NO_PET.includes(decor) && !floor.some((f) => f.kind === "pet")) {
      floor.push({ kind: "pet", pet: pickOne(PET_IDS), slot });
    } else if (kind === "table" && !floor.some((f) => f.kind === "table")) {
      const item = pickOne(TABLE_ITEMS.filter((o) => !usedObj.has(o)));
      usedObj.add(item);
      floor.push({ kind: "table", item, slot });
    } else {
      const obj = pickOne(OBJ_IDS.filter((o) => !usedObj.has(o)));
      usedObj.add(obj);
      floor.push({ kind: "obj", obj, color: pickOne(COLOR_IDS), slot });
    }
  }

  // Mur / ciel : horloge (intérieur), panneau, ballons
  const wallKinds = shuffle<"clock" | "sign" | "balloons">(INDOOR[decor] ? ["clock", "sign", "balloons"] : ["sign", "balloons"]);
  const sides = shuffle<0 | 1>([0, 1]);
  const wall: WallThing[] = [];
  for (let i = 0; i < nWall; i++) {
    const k = wallKinds[i % wallKinds.length];
    const side = sides[i];
    if (k === "clock") wall.push({ kind: "clock", hour: 1 + rnd(12), side });
    else if (k === "sign") wall.push({ kind: "sign", n: Math.random() < 0.35 ? 1 + rnd(9) : 10 + rnd(90), side });
    else wall.push({ kind: "balloons", count: 2 + rnd(4), color: pickOne(COLOR_IDS), side });
  }

  const range = hasCount(decor) ? COUNT_RANGE[decor] : null;
  return {
    id: Math.random().toString(36).slice(2, 9),
    decor,
    featureColor: pickOne(COLOR_IDS.filter((c) => !(FEATURE_AVOID[decor] ?? []).includes(c))),
    featureN: range ? range[0] + rnd(range[1] - range[0] + 1) : undefined,
    blobs,
    floor,
    wall,
  };
}

// ── Questions ─────────────────────────────────────────────
export type Answer =
  | { k: "num"; v: number }
  | { k: "color"; v: ColorId }
  | { k: "hour"; v: number }
  | { k: "obj"; v: ObjId }
  | { k: "pet"; v: PetId };

export type QKind =
  | { t: "countBlobs" }
  | { t: "countAcc"; acc: Acc }
  | { t: "colorAcc"; acc: Acc }
  | { t: "colorSleeper" }
  | { t: "featureColor"; decor: DecorId }
  | { t: "featureCount"; decor: CountDecor }
  | { t: "colorCheer" }
  | { t: "clock" }
  | { t: "sign" }
  | { t: "balloonsCount" }
  | { t: "balloonsColor" }
  | { t: "tableItem" }
  | { t: "pet" }
  | { t: "objColor"; obj: ObjId }
  | { t: "objectPresent" };

export interface Question {
  id: string;
  /** Sujet (deux questions du même sujet ne tombent pas dans la même manche) */
  topic: string;
  q: QKind;
  answer: Answer;
  /** 4 choix mélangés (dont la bonne réponse), pour la dernière chance */
  options: Answer[];
  /** Seulement en QCM (pas à l'oral : la réponse n'est pas unique sans les choix) */
  qcmOnly?: boolean;
}

export const sameAnswer = (a: Answer, b: Answer) => a.k === b.k && a.v === b.v;

function numOptions(v: number, min: number, max: number, extra: number[] = []): Answer[] {
  const cands = [...extra, v - 1, v + 1, v + 2, v - 2, v + 3, v + 10, v - 10]
    .filter((n) => n >= min && n <= max && n !== v);
  const picked: number[] = [];
  for (const n of cands) if (!picked.includes(n) && picked.length < 3) picked.push(n);
  for (let n = min; picked.length < 3 && n <= max + 5; n++) if (n !== v && !picked.includes(n)) picked.push(n);
  return shuffle([v, ...picked]).map((n) => ({ k: "num", v: n }));
}
function colorOptions(v: ColorId, avoid: ColorId[] = []): Answer[] {
  const others = shuffle(COLOR_IDS.filter((c) => c !== v && !avoid.includes(c)));
  const fill = shuffle(COLOR_IDS.filter((c) => c !== v && !others.includes(c)));
  return shuffle([v, ...[...others, ...fill].slice(0, 3)]).map((c) => ({ k: "color", v: c }));
}
function hourOptions(v: number): Answer[] {
  const opp = ((v + 5) % 12) + 1; // aiguille à l'opposé
  const near = (v % 12) + 1;
  const pool = shuffle([opp, near, ((v + 2) % 12) + 1, ((v + 9) % 12) + 1].filter((h) => h !== v));
  const uniq = [...new Set(pool)].slice(0, 3);
  return shuffle([v, ...uniq]).map((h) => ({ k: "hour", v: h }));
}
function objOptions(v: ObjId, absent: ObjId[]): Answer[] {
  return shuffle([v, ...shuffle(absent).slice(0, 3)]).map((o) => ({ k: "obj", v: o }));
}

/** Toutes les questions possibles sur la scène. */
export function questionsFor(s: Scene): Question[] {
  const out: Question[] = [];
  const add = (topic: string, q: QKind, answer: Answer, options: Answer[], qcmOnly = false) =>
    out.push({ id: `${topic}-${q.t}`, topic, q, answer, options, qcmOnly });

  const nb = s.blobs.length;
  add("blobs", { t: "countBlobs" }, { k: "num", v: nb }, numOptions(nb, 1, 8));
  add("feature", { t: "featureColor", decor: s.decor }, { k: "color", v: s.featureColor }, colorOptions(s.featureColor));

  for (const acc of ACCS) {
    const withAcc = s.blobs.filter((b) => b.acc === acc);
    if (!withAcc.length) continue;
    add(`acc-${acc}`, { t: "countAcc", acc }, { k: "num", v: withAcc.length }, numOptions(withAcc.length, 0, 6));
    if (withAcc.length === 1) {
      // Distracteurs : d'abord les couleurs des AUTRES blobs (crédible), puis le reste
      const c = withAcc[0].color;
      const others = s.blobs.map((b) => b.color).filter((x) => x !== c);
      const opts = shuffle([c, ...shuffle(others).slice(0, 3)]);
      const full = opts.length >= 4 ? opts : [...opts, ...shuffle(COLOR_IDS.filter((x) => !opts.includes(x))).slice(0, 4 - opts.length)];
      add(`acc1-${acc}`, { t: "colorAcc", acc }, { k: "color", v: c }, shuffle(full).map((v) => ({ k: "color" as const, v })));
    }
  }
  // Couleur d'un blob précis : distracteurs = couleurs des autres blobs d'abord
  const blobColorOpts = (c: ColorId): Answer[] => {
    const others = s.blobs.map((b) => b.color).filter((x) => x !== c);
    const opts = [c, ...shuffle(others).slice(0, 3)];
    const full = opts.length >= 4 ? opts : [...opts, ...shuffle(COLOR_IDS.filter((x) => !opts.includes(x))).slice(0, 4 - opts.length)];
    return shuffle(full).map((v) => ({ k: "color" as const, v }));
  };
  const sleeper = s.blobs.find((b) => b.asleep);
  if (sleeper) add("sleeper", { t: "colorSleeper" }, { k: "color", v: sleeper.color }, blobColorOpts(sleeper.color));
  const cheerer = s.blobs.find((b) => b.cheer);
  if (cheerer) add("cheer", { t: "colorCheer" }, { k: "color", v: cheerer.color }, blobColorOpts(cheerer.color));
  const range = hasCount(s.decor) ? COUNT_RANGE[s.decor] : null;
  if (range && s.featureN != null) {
    add("count", { t: "featureCount", decor: s.decor as CountDecor }, { k: "num", v: s.featureN }, numOptions(s.featureN, Math.max(0, range[0] - 1), range[1] + 2));
  }

  for (const w of s.wall) {
    if (w.kind === "clock") add("clock", { t: "clock" }, { k: "hour", v: w.hour }, hourOptions(w.hour));
    if (w.kind === "sign") {
      const rev = w.n >= 10 ? Number(String(w.n).split("").reverse().join("")) : w.n + 5;
      add("sign", { t: "sign" }, { k: "num", v: w.n }, numOptions(w.n, 1, 99, [rev]));
    }
    if (w.kind === "balloons") {
      add("balloons", { t: "balloonsCount" }, { k: "num", v: w.count }, numOptions(w.count, 1, 8));
      add("balloons-c", { t: "balloonsColor" }, { k: "color", v: w.color }, colorOptions(w.color));
    }
  }

  const present = new Set<ObjId>();
  for (const f of s.floor) {
    if (f.kind === "obj") present.add(f.obj);
    if (f.kind === "table") present.add(f.item);
  }
  // « Un ballon » serait ambigu s'il y a des ballons de baudruche au mur
  const hasBalloons = s.wall.some((w) => w.kind === "balloons");
  const absent = OBJ_IDS.filter((o) => !present.has(o) && !(hasBalloons && o === "ball"));
  for (const f of s.floor) {
    if (f.kind === "table") {
      add("table", { t: "tableItem" }, { k: "obj", v: f.item }, objOptions(f.item, absent));
    } else if (f.kind === "pet") {
      add("pet", { t: "pet" }, { k: "pet", v: f.pet }, shuffle(PET_IDS).map((p) => ({ k: "pet" as const, v: p })));
    } else if (f.obj === "ball" || f.obj === "gift" || f.obj === "guitar" || f.obj === "book") {
      // Objets dont la couleur varie (les autres ont une couleur fixe)
      add(`obj-${f.obj}`, { t: "objColor", obj: f.obj }, { k: "color", v: f.color }, colorOptions(f.color));
    }
  }
  // « Lequel de ces objets était dans la scène ? » : réservé au QCM
  const floorObjs = s.floor.filter((f): f is Extract<FloorThing, { kind: "obj" }> => f.kind === "obj");
  if (floorObjs.length) {
    const o = pickOne(floorObjs).obj;
    add("present", { t: "objectPresent" }, { k: "obj", v: o }, objOptions(o, absent), true);
  }
  return out;
}

/**
 * Plan de la manche : `count` questions orales (sujets différents) + une question
 * de dernière chance jamais posée à l'oral + une réserve pour « Pas fou ? Une autre ».
 */
export function planRound(s: Scene, count: number): { asked: Question[]; last: Question; spare: Question[] } {
  const all = shuffle(questionsFor(s));
  // Dernière chance : de préférence un QCM pur, sinon n'importe laquelle
  const last = all.find((q) => q.qcmOnly) ?? all[all.length - 1];
  // Aucune question orale ne doit trahir la réponse de la dernière chance
  const leaks = (q: Question) =>
    last.q.t === "objectPresent" && last.answer.k === "obj" &&
    ((q.q.t === "objColor" && q.q.obj === last.answer.v) || (q.q.t === "tableItem" && sameAnswer(q.answer, last.answer)));
  const oral = all.filter((q) => q !== last && !q.qcmOnly && !leaks(q));
  const asked: Question[] = [];
  const spare: Question[] = [];
  for (const q of oral) {
    if (asked.length < count && !asked.some((a) => a.topic.split("-")[0] === q.topic.split("-")[0])) asked.push(q);
    else spare.push(q);
  }
  // Pas assez de sujets différents : on complète avec la réserve
  while (asked.length < count && spare.length) asked.push(spare.shift()!);
  return { asked, last, spare };
}
