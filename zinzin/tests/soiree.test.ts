/* Tests unitaires du comptage des points de la Soirée Zinzin (règle unique des gagnants).
 * Lancement : sh zinzin/tests/run.sh (bundle esbuild, alias @ → src, localStorage simulé). */
import {
  announced, announcedGains, captureFinished, computeTrophies, migrateSoiree, soireeGains, endSoiree, getSoiree, kingsOf, ranking, recapTitles, recordWinners,
  courageFor, lastStreak, uniqueLast, unluckyOf, resumeSoiree, setPhase, skipGame, startSoiree, uniqueBand, eligible,
  type SoireeState,
} from "../src/soiree";
import { getZGame } from "../src/catalog";
import {
  decideWinners, finishedPayload, rankByScores, rankingOf, topOf, uniqueMax, uniqueMin, winnersOf,
  type FinishedInfo, type GameFinishedDetail,
} from "@/lib/game-finished";
import { finalScores } from "@/components/games/pile-poil/tournament";

let pass = 0, fail = 0;
const out: string[] = [];
function check(name: string, ok: boolean, info = "") {
  if (ok) pass++; else fail++;
  out.push(`${ok ? "PASS" : "FAIL"} ${name}${info && !ok ? ` — ${info}` : ""}`);
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const J = JSON.stringify;

/** Joue un jeu de la Soirée comme l'UI : intro → playing → signal(s) du jeu → écran gagnant → points. */
function playGame(signals: (GameFinishedDetail | FinishedInfo)[], opts: { raw?: boolean; table?: string[] } = {}) {
  setPhase("playing");
  const s0 = getSoiree()!;
  for (const d of signals) {
    const detail = opts.raw ? (d as GameFinishedDetail) : finishedPayload(d as FinishedInfo, opts.table);
    captureFinished({ gameId: s0.playlist[s0.index], ...detail });
  }
  setPhase("winner");
  const w = announced(getSoiree()!).winners;
  recordWinners(w);
  return w;
}

const BAND = ["Léa", "Malik", "Tom", "Inès"];
const PL = ["patate", "category-chrono", "top-ten", "undercover", "faux-temoin", "verre", "pile-poil", "lache-pas", "tgv", "chut"] as never[];

/* ── 1. Règle unique (src/lib/game-finished.ts) ── */
check("rankByScores compétition 1,2,2,4", eq(rankByScores(["a", "b", "c", "d"], [9, 5, 5, 1]).map((r) => r.rank), [1, 2, 2, 4]));
check("rankByScores lowerWins", eq(rankByScores(["a", "b", "c"], [2, 0, 1], true), [{ name: "b", rank: 1 }, { name: "c", rank: 2 }, { name: "a", rank: 3 }]));
check("rankByScores départage (tiebreak plus petit)", eq(rankByScores(["a", "b", "c"], [5, 5, 1], false, [1, 0, 0], true).map((r) => [r.name, r.rank]), [["b", 1], ["a", 2], ["c", 3]]));
check("topOf : 2 ex æquo sur 4 → les 2", eq(topOf(rankByScores(["a", "b", "c", "d"], [3, 3, 1, 0])), ["a", "b"]));
check("topOf : 2 ex æquo sur 3 → les 2 (règle unique, plus de règle de la moitié)", eq(topOf(rankByScores(["a", "b", "c"], [3, 3, 1])), ["a", "b"]));
check("topOf : 3 ex æquo sur 4 → les 3", eq(topOf(rankByScores(["a", "b", "c", "d"], [2, 2, 2, 0])), ["a", "b", "c"]));
check("topOf : toute la table à égalité → personne", eq(topOf(rankByScores(["a", "b", "c"], [0, 0, 0])), []));
check("topOf : duo à égalité → personne", eq(topOf(rankByScores(["a", "b"], [3, 3])), []));
check("decideWinners : gagnants explicites gardés", eq(decideWinners({ winners: ["a", "b"] }, ["a", "b", "c"]), ["a", "b"]));
check("decideWinners : explicites = toute la table → personne", eq(decideWinners({ winners: ["a", "B "] }, ["a", "b"]), []));
check("finishedPayload : winners toujours présent (vide = pas de gagnant)", eq(finishedPayload({ scores: { names: ["a", "b"], values: [1, 1] } }).winners, []));
check("finishedPayload : noWinner → aucun gagnant, ni classement, ni perdant", eq(finishedPayload({ noWinner: true, scores: { names: ["a", "b"], values: [3, 1] }, loser: "b" }), { loser: null, winners: [] }));
check("uniqueMax égalité → null", uniqueMax(["a", "b"], [2, 2]) === null);
check("uniqueMin seul en bas", uniqueMin(["a", "b", "c"], [3, 1, 2]) === "b");

/* ── 2. Règle des gagnants, jeu par jeu (même calcul que l'écran de fin du jeu) ── */
// La Patate : le moins d'explosions
check("Patate : moins d'explosions gagne", eq(winnersOf({ names: BAND, values: [1, 0, 2, 1], lowerWins: true }), ["Malik"]));
check("Patate : 2 ex æquo à 0 explosion → les 2", eq(winnersOf({ names: BAND, values: [0, 0, 2, 1], lowerWins: true }), ["Léa", "Malik"]));
check("Patate : personne n'a explosé → pas de gagnant", eq(winnersOf({ names: BAND, values: [0, 0, 0, 0], lowerWins: true }), []));
// De 1 à 10 (cas réel de l'audit E2E : Léa, Malik, Inès ex æquo, Tom 4e)
check("De 1 à 10 : 3 ex æquo sur 4 → les 3 gagnent (écran = Soirée)", eq(finishedPayload({ scores: { names: BAND, values: [5, 5, 3, 5] } }).winners, ["Léa", "Malik", "Inès"]));
// Verre : départage par les renversements (comme l'écran)
check("Verre C2 : 12-12, A 0 renversement, B 1 → A seul", eq(winnersOf({ names: ["A", "B", "C"], values: [12, 12, 4], tiebreak: [0, 1, 0], tiebreakLowerWins: true }), ["A"]));
check("Verre : même points ET mêmes renversements → co-gagnants", eq(winnersOf({ names: ["A", "B", "C"], values: [12, 12, 4], tiebreak: [1, 1, 0], tiebreakLowerWins: true }), ["A", "B"]));
check("Verre : duo tout à 0 → pas de gagnant", eq(winnersOf({ names: ["A", "B"], values: [0, 0], tiebreak: [0, 0], tiebreakLowerWins: true }), []));
check("Verre : égalité totale 4 joueurs → pas de gagnant (au lieu de +1 à tous)", eq(finishedPayload({ loser: uniqueMax(BAND, [0, 0, 0, 0]), scores: { names: BAND, values: [0, 0, 0, 0], tiebreak: [0, 0, 0, 0], tiebreakLowerWins: true } }).winners, []));
// Pile Poil : départage à l'écart cumulé (fonction de l'écran de fin)
{
  const round = (target: number) => ({ target } as never);
  const hist = [
    { round: round(5), attempts: [{ pi: 0, elapsedMs: 5100 }, { pi: 1, elapsedMs: 5400 }] as never[] },
    { round: round(3), attempts: [{ pi: 0, elapsedMs: 3300 }, { pi: 1, elapsedMs: 2950 }] as never[] },
  ];
  const sc = finalScores(["A", "B"], [3, 3], hist);
  check("Pile Poil C4 : duo 3-3, A écart 400 ms < B 450 ms → A seul (comme « départagé à l'écart »)", eq(winnersOf(sc), ["A"]), J(sc));
  check("Pile Poil : classement transmis = classement affiché", eq(rankingOf(sc).map((r) => [r.name, r.rank]), [["A", 1], ["B", 2]]));
  const sc2 = finalScores(["A", "B", "C"], [4, 2, 1], hist);
  check("Pile Poil : points d'abord", eq(winnersOf(sc2), ["A"]));
}
// Lâche pas : la PARTIE (couronnes cumulées, départage au moins de défaites), pas la dernière manche
check("Lâche pas C3 : Léa couronnée 2×, Tom 1× (dernière manche) → Léa", eq(winnersOf({ names: ["Léa", "Tom", "Inès"], values: [2, 1, 0], tiebreak: [0, 1, 2], tiebreakLowerWins: true }), ["Léa"]));
check("Lâche pas : 1-1 en couronnes, Léa moins de défaites → Léa", eq(winnersOf({ names: ["Léa", "Tom", "Inès"], values: [1, 1, 0], tiebreak: [0, 2, 1], tiebreakLowerWins: true }), ["Léa"]));
check("Lâche pas : aucune couronne et mêmes défaites → pas de gagnant", eq(winnersOf({ names: ["Léa", "Tom"], values: [0, 0], tiebreak: [1, 1], tiebreakLowerWins: true }), []));
// Pureté : le plus pur
check("Pureté C5 : le plus pur gagne (classement nominatif)", eq(winnersOf({ names: BAND, values: [80, 95, 60, 70] }), ["Malik"]));
check("Pureté : 2 ex æquo en tête → les 2", eq(winnersOf({ names: BAND, values: [95, 95, 60, 70] }), ["Léa", "Malik"]));
// Train Fou : le moins de peines
check("Train Fou : le moins de peines", eq(winnersOf({ names: ["Ana", "Ben", "Cléo"], values: [3, 1, 2], lowerWins: true }), ["Ben"]));
// Chut (toute la table) : le moins de craquages
check("Chut M1 : table A0 B0 C1 D2 → A et B (plus « pas de gagnant »)", eq(finishedPayload({ scores: { names: ["A", "B", "C", "D"], values: [0, 0, 1, 2], lowerWins: true } }).winners, ["A", "B"]));
check("Chut duel : craquages égaux, départage au temps tenu", eq(winnersOf({ names: ["A", "B", "C"], values: [1, 1, 2], lowerWins: true, tiebreak: [4200, 5100, 900] }), ["B"]));
// Picolette : le moins de peines gagne (écran aligné), le plus de peines perd
{
  const p = finishedPayload({ loser: uniqueMax(BAND, [1, 4, 2, 2]), scores: { names: BAND, values: [1, 4, 2, 2], lowerWins: true } });
  check("Picolette M2 : gagnant = moins de peines, perdant = plus de peines", eq(p.winners, ["Léa"]) && p.loser === "Malik", J(p));
}
// Mime : chaque joueur prend le score de son équipe
check("Mime : 2 équipes ex æquo sur 3 → leurs 4 joueurs", eq(winnersOf({ names: ["a1", "a2", "b1", "b2", "c1", "c2"], values: [5, 5, 5, 5, 2, 2] }), ["a1", "a2", "b1", "b2"]));
check("Mime : 2 équipes à égalité → pas de gagnant", eq(winnersOf({ names: ["a1", "a2", "b1", "b2"], values: [5, 5, 5, 5] }), []));
// Tu me connais : duo
check("Tu me connais : 3-3 → pas de gagnant", eq(winnersOf({ names: ["A", "B"], values: [3, 3] }), []));
check("Tu me connais : 4-3 → A", eq(winnersOf({ names: ["A", "B"], values: [4, 3] }), ["A"]));
// Deviner le mot / Faux témoin / Bluffeur / Longueur d'onde : meilleur score, ex æquo = tous
check("Deviner le mot : 2 ex æquo sur 3 → les 2", eq(winnersOf({ names: ["A", "B", "C"], values: [5, 5, 2] }), ["A", "B"]));
check("Faux témoin (1 manche) : le camp gagnant", eq(finishedPayload({ scores: { names: BAND, values: [2, 2, 0, 1] }, winners: ["Tom", "Inès"] }).winners, ["Tom", "Inès"]));
check("Catégorie Chrono : dernier survivant", eq(finishedPayload({ winners: ["Inès"], scores: { names: BAND, values: [0, 0, 0, 2] } }).winners, ["Inès"]));
check("L'Intrus : camp gagnant", eq(finishedPayload({ winners: ["Malik", "Tom", "Inès"] }, BAND).winners, ["Malik", "Tom", "Inès"]));
check("Terminer avant un tour complet (noWinner) → pas de gagnant", eq(finishedPayload({ noWinner: true }).winners, []));

/* ── 3. La chaîne de la Soirée ── */
startSoiree(BAND, "soiree", 10, PL);
let w = playGame([{ loser: "Tom", scores: { names: BAND, values: [1, 0, 2, 1], lowerWins: true } }]);
check("Soirée : Patate → Malik", eq(w, ["Malik"]));
w = playGame([{ winners: ["Inès"], scores: { names: BAND, values: [0, 0, 0, 2] } }]);
check("Soirée : Chrono → Inès", eq(w, ["Inès"]));
let s = getSoiree()!;
check("points après 2 jeux (Patate classée 3/2/2/0 + Chrono survivante 2)", eq(s.points, { "Léa": 2, Malik: 3, Tom: 0, "Inès": 4 }), J(s.points));
check("index 2, phase intro", s.index === 2 && s.phase === "intro");
w = playGame([{ scores: { names: BAND, values: [5, 5, 3, 5] } }]);
check("C1 : De 1 à 10, 3 ex æquo → les 3 (3 pts chacun, comme l'écran du jeu)", eq(w, ["Léa", "Malik", "Inès"]) && eq(getSoiree()!.gains?.[2], { "Léa": 3, Malik: 3, "Inès": 3 }), J(getSoiree()!.gains));
// C1 : le jeu dit « pas de gagnant » (toute la table ex æquo) → la Soirée n'invente rien depuis le classement
const before = { ...getSoiree()!.points };
w = playGame([{ loser: null, scores: { names: BAND, values: [0, 0, 0, 0] } }]);
check("C1 : égalité totale → « Pas de gagnant » (jamais +1 à tous)", w.length === 0 && eq(getSoiree()!.points, before), J(getSoiree()!.points));
// Un signal « brut » avec un classement mais sans gagnants : la Soirée ne déduit rien
w = playGame([{ ranking: [{ name: "Léa", rank: 1 }, { name: "Tom", rank: 2 }] }], { raw: true });
check("C1 : classement sans gagnants désignés → aucun gagnant déduit par la Soirée", w.length === 0);

/* ── 4. Prénoms ── */
startSoiree(BAND, "soiree", 10, PL);
w = playGame([{ scores: { names: ["lea", "MALIK", "  tom ", "Ines"], values: [10, 2, 3, 4] } }]);
check("prénoms tolérants : « lea » → Léa", eq(w, ["Léa"]));
w = playGame([{ winners: ["  inès  "] }]);
check("prénoms tolérants : espaces + accent → Inès", eq(w, ["Inès"]));
setPhase("playing");
captureFinished({ gameId: getSoiree()!.playlist[getSoiree()!.index], ...finishedPayload({ winners: ["Léa2"], scores: { names: ["Léa2", "Malik", "Tom", "Inès"], values: [5, 1, 1, 1] } }) });
setPhase("winner");
const a = announced(getSoiree()!);
check("M7 : prénom inconnu (« Léa2 ») gardé pour l'annonce + « Corriger » (plus perdu en silence)", eq(a, { winners: [], unknown: ["Léa2"] }), J(a));
recordWinners(["Léa"], { manual: true }); // la table corrige : c'était Léa
check("M7 : après « Corriger » → Léa +2 (3 du 1er jeu + 2)", getSoiree()!.points["Léa"] === 5 && eq(getSoiree()!.gains?.[2], { "Léa": 2 }), J(getSoiree()!.points));
check("bande dédoublonnée (accents/casse/espaces)", eq(uniqueBand(["Léa", "lea", " Tom ", "tom", "Inès"]), ["Léa", "Tom", "Inès"]));
startSoiree(["Léa", "lea", "Tom"], "soiree", 4, PL.slice(0, 4));
s = getSoiree()!;
check("M8 : startSoiree dédoublonne : 2 membres, 2 clés de points", eq(s.band, ["Léa", "Tom"]) && Object.keys(s.points).length === 2, J(s.band));
check("recordWinners : prénom hors bande ignoré", (() => { setPhase("winner"); recordWinners(["Zorro", "tom"]); return eq(getSoiree()!.points, { "Léa": 0, Tom: 2 }); })(), J(getSoiree()!.points));

/* ── 5. Signaux parasites ── */
startSoiree(BAND, "soiree", 10, PL);
setPhase("playing");
captureFinished({ gameId: "verre", winners: ["Tom"] });
check("gameId différent ignoré", getSoiree()!.pending === undefined);
captureFinished({ gameId: "patate", soiree: true, winners: ["Tom"] });
check("signal de fin de Soirée ignoré", getSoiree()!.pending === undefined);
setPhase("intro");
captureFinished({ gameId: "patate", winners: ["Tom"] });
check("signal hors phase playing ignoré", getSoiree()!.pending === undefined);

/* ── 6. Rejouer puis croix : la DERNIÈRE partie terminée, exactement ── */
setPhase("playing");
captureFinished({ gameId: "patate", ...finishedPayload({ scores: { names: BAND, values: [0, 2, 2, 2], lowerWins: true }, loser: null }) });
captureFinished({ gameId: "patate", ...finishedPayload({ scores: { names: BAND, values: [3, 0, 1, 2], lowerWins: true }, loser: "Léa" }) });
s = getSoiree()!;
check("V1 : 2e partie terminée remplace la 1re (gagnant ET classement ET perdant)", eq(s.pending?.winners, ["Malik"]) && s.pending?.loser === "Léa" && s.pending?.ranking?.[0]?.name === "Malik", J(s.pending));
captureFinished({ gameId: "patate", ...finishedPayload({ scores: { names: BAND, values: [3, 0, 1, 2], lowerWins: true }, loser: "Léa" }) });
check("doublon StrictMode idempotent", eq(getSoiree()!.pending?.winners, ["Malik"]));
setPhase("winner"); // croix pendant la 3e partie, jamais finie
check("V1 : croix sans finir la partie relancée → résultat de la dernière terminée", eq(announced(getSoiree()!).winners, ["Malik"]));
recordWinners(announced(getSoiree()!).winners);
check("V1 : points de ce jeu comptés une fois, selon la DERNIÈRE partie (Malik 3, Tom 2, Inès 1, Léa 0)", eq(getSoiree()!.points, { "Léa": 0, Malik: 3, Tom: 2, "Inès": 1 }) && eq(getSoiree()!.results[0], ["Malik"]), J(getSoiree()!.points));

/* ── 7. Reprise après fermeture : pas de résultat périmé ── */
setPhase("playing");
captureFinished({ gameId: "category-chrono", winners: ["Tom"] });
resumeSoiree();
check("V2 : reprise → pending effacé, retour à l'intro", getSoiree()!.pending === undefined && getSoiree()!.phase === "intro");
setPhase("playing"); setPhase("winner");
check("V2 : croix sans finir après reprise → pas de gagnant", announced(getSoiree()!).winners.length === 0);
recordWinners([]);
// Pending périmé d'un jeu précédent : effacé au lancement du jeu
{
  const st = getSoiree()!;
  // simulation d'un état incohérent (ancienne version) : pending présent sur l'intro
  st.pending = { winners: ["Tom"], loser: null };
  setPhase("playing");
  check("lancement d'un jeu : aucun résultat d'avant", getSoiree()!.pending === undefined);
  setPhase("intro");
}

/* ── 8. Garde : un seul recordWinners par jeu ── */
startSoiree(BAND, "soiree", 4, PL.slice(0, 4));
setPhase("winner");
recordWinners(["Tom"]);
recordWinners(["Tom"]); // double tap : on est déjà sur l'intro du jeu 2
s = getSoiree()!;
check("V3 : 2e recordWinners ignoré (Tom=2, index=1)", s.points.Tom === 2 && s.index === 1, `Tom=${s.points.Tom} index=${s.index}`);
setPhase("playing");
recordWinners(["Tom"]);
check("V3 : recordWinners hors écran gagnant ignoré", getSoiree()!.points.Tom === 2);
setPhase("intro");

/* ── 9. Récap et cérémonie (C8) ── */
const TITLES = ["Roi de la soirée", "Le plus zinzin", "Toujours dans le coup", "L'ambianceur", "Le joker"];
const LAST = "Prix du fair-play";
function finish(band: string[], games: { winners: string[]; loser?: string }[]) {
  startSoiree(band, "soiree", 10, PL.slice(0, Math.max(4, games.length)) as never);
  for (const g of games) {
    setPhase("playing");
    const st = getSoiree()!;
    captureFinished({ gameId: st.playlist[st.index], winners: g.winners, loser: g.loser ?? null });
    setPhase("winner");
    recordWinners(announced(getSoiree()!).winners);
  }
  endSoiree();
  return getSoiree()!;
}
// Cas réel de l'audit : 4 ex æquo à 2 points
s = finish(BAND, [{ winners: ["Tom"] }, { winners: ["Léa"] }, { winners: ["Léa", "Malik", "Inès"] }, { winners: ["Malik", "Tom", "Inès"] }]);
check("C8 : 4 ex æquo à 4 pts (2 victoires de camp chacun)", Object.values(s.points).every((p) => p === 4), J(s.points));
let T = computeTrophies(s);
check("C8 : toute la bande ex æquo → pas de Roi", !T.some((t) => t.id === "king"), J(T.map((t) => [t.name, t.id])));
check("C8 : … et pas de Plus Gros Naze à égalité avec les autres", !T.some((t) => t.id === "naze"));
let titles = recapTitles(s, TITLES, LAST);
check("C8 : récap sans « Roi » ni « fair-play » pour des 1ers ex æquo", !titles.includes(TITLES[0]) && !titles.includes(LAST), J(titles));
// 2 ex æquo en tête sur 3 → co-rois
s = finish(["Tom", "Malik", "Léa"], [{ winners: ["Tom"] }, { winners: ["Malik"] }]);
check("C8 : ex æquo en tête → co-rois (Tom et Malik)", eq(kingsOf(s), ["Tom", "Malik"]));
T = computeTrophies(s);
check("C8 : trophée Roi pour chacun des co-rois", eq(T.filter((t) => t.id === "king").map((t) => t.name).sort(), ["Malik", "Tom"]));
titles = recapTitles(s, TITLES, LAST);
const rk = ranking(s);
check("C8 : les 2 co-rois ont « Roi de la soirée » dans le récap", rk.filter((r, i) => r.rank === 1 && titles[i] === TITLES[0]).length === 2, J([rk, titles]));
check("C8 : Naze = Léa (seule à 0, pas un ex æquo des rois)", T.find((t) => t.id === "naze")?.name === "Léa");
// Roi unique, Naze strictement dernier (plus de défaites) ; un 1er jamais « fair-play »
s = finish(["A", "B", "C", "D"], [{ winners: ["A"], loser: "D" }, { winners: ["A"], loser: "D" }, { winners: ["B"], loser: "C" }]);
T = computeTrophies(s);
const by = Object.fromEntries(T.map((t) => [t.name, t.id]));
check("Roi = le plus de points (A)", by.A === "king" && eq(kingsOf(s), ["A"]), J(by));
check("Naze = D (0 point, 2 défaites) plutôt que C (0 point, 1 défaite)", by.D === "naze");
check("B : prix de son jeu", by.B === "game");
check("un prix par personne", T.length === 4 && new Set(T.map((t) => t.name)).size === 4);
check("Naze révélé en dernier", T[T.length - 1].id === "naze");
titles = recapTitles(s, TITLES, LAST);
check("récap : A « Roi », C et D (derniers ex æquo) « fair-play »", titles[0] === TITLES[0] && titles[2] === LAST && titles[3] === LAST, J(titles));
// Tout le monde a gagné, mais pas autant : le Naze n'est jamais à égalité avec le Roi
s = finish(["A", "B", "C"], [{ winners: ["A"] }, { winners: ["A"] }, { winners: ["B"], loser: "C" }, { winners: ["C"] }]);
T = computeTrophies(s);
check("Naze jamais ex æquo du Roi (B et C à 2 pts, C a 1 défaite → C)", T.find((t) => t.id === "naze")?.name === "C" && T.find((t) => t.id === "king")?.name === "A", J(T.map((t) => [t.name, t.id])));
// Prix « jeu » : cite tous les jeux gagnés (m10)
s = finish(["A", "B", "C"], [{ winners: ["A"] }, { winners: ["B"] }, { winners: ["B"] }, { winners: ["A", "B"] }]);
T = computeTrophies(s);
check("m10 : prix de A cite tous ses jeux gagnés", (T.find((t) => t.name === "A")?.games ?? []).length === 2, J(T));


/* ── 11. Barème : classé 3/2/1, camp 2, manuel 2, pas de gagnant 0 ── */
/** Joue un jeu et renvoie [points gagnés sur ce jeu, points annoncés à l'écran] (doivent être identiques) */
function playScored(signals: (GameFinishedDetail | FinishedInfo)[], opts: { raw?: boolean; table?: string[]; manual?: string[] } = {}) {
  setPhase("playing");
  const s0 = getSoiree()!;
  for (const d of signals) {
    const detail = opts.raw ? (d as GameFinishedDetail) : finishedPayload(d as FinishedInfo, opts.table);
    captureFinished({ gameId: s0.playlist[s0.index], ...detail });
  }
  setPhase("winner");
  const shown = announcedGains(getSoiree()!);
  const before = { ...getSoiree()!.points };
  const idx = getSoiree()!.index;
  if (opts.manual) recordWinners(opts.manual, { manual: true });
  else recordWinners(announced(getSoiree()!).winners);
  const after = getSoiree()!;
  const delta = Object.fromEntries(after.band.map((n) => [n, (after.points[n] ?? 0) - (before[n] ?? 0)]).filter(([, v]) => v !== 0));
  const stored = after.gains?.[idx] ?? {};
  return { delta, shown, stored };
}
/** Comparaison de points sans tenir compte de l'ordre des clés */
const K = (o: object) => JSON.stringify(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const same = (r: { delta: object; stored: object; shown?: object }, exp: object) => K(r.delta) === K(exp) && K(r.stored) === K(exp);
const BAR = ["patate", "top-ten", "verre", "pile-poil", "undercover", "faux-temoin", "category-chrono", "make-guess", "tu-prefere", "chut"] as never[];

check("payload : scores seuls → jeu classé", finishedPayload({ scores: { names: BAND, values: [3, 2, 1, 0] } }).ranked === true);
check("payload : gagnants explicites (camp) → pas classé", finishedPayload({ winners: ["Tom"], scores: { names: BAND, values: [3, 2, 1, 0] } }).ranked === undefined);
check("payload : équipes (Fais Deviner) → pas classé", finishedPayload({ teams: true, scores: { names: BAND, values: [3, 3, 1, 1] } }).ranked === undefined);
check("payload : toute la table à égalité → pas classé, aucun gagnant", eq(finishedPayload({ scores: { names: BAND, values: [2, 2, 2, 2] } }), { loser: null, ranking: BAND.map((name) => ({ name, rank: 1 })), winners: [] }));
check("soireeGains pur : classé 1,2,2,4", eq(soireeGains(["a"], [{ name: "a", rank: 1 }, { name: "b", rank: 2 }, { name: "c", rank: 2 }, { name: "d", rank: 4 }], true), { a: 3, b: 2, c: 2 }));
check("soireeGains pur : gagnants ≠ 1ers du classement → 2 chacun (jamais un 3/2/1 incohérent)", eq(soireeGains(["b"], [{ name: "a", rank: 1 }, { name: "b", rank: 2 }], true), { b: 2 }));
check("soireeGains pur : pas de gagnant → rien", eq(soireeGains([], [{ name: "a", rank: 1 }, { name: "b", rank: 2 }], true), {}));

startSoiree(BAND, "soiree", 10, BAR);
let r = playScored([{ loser: "Tom", scores: { names: BAND, values: [2, 0, 3, 1], lowerWins: true } }]);
check("classé simple (Patate) : Malik 3, Inès 2, Léa 1, Tom 0", same(r, { "Léa": 1, Malik: 3, "Inès": 2 }) && K(r.shown) === K(r.stored), J(r));
r = playScored([{ scores: { names: BAND, values: [7, 7, 4, 1] } }]);
check("ex æquo en tête (De 1 à 10) : Léa 3, Malik 3, puis Tom 3e → 1, Inès 0", same(r, { "Léa": 3, Malik: 3, Tom: 1 }) && K(r.shown) === K(r.stored), J(r));
r = playScored([{ scores: { names: BAND, values: [12, 5, 5, 1], tiebreak: [0, 0, 0, 0], tiebreakLowerWins: true } }]);
check("ex æquo 2e (Verre) : Léa 3, Malik 2, Tom 2, Inès 4e → 0", same(r, { "Léa": 3, Malik: 2, Tom: 2 }) && K(r.shown) === K(r.stored), J(r));
r = playScored([{ scores: { names: BAND, values: [9, 9, 9, 9] } }]);
check("toute la table à égalité → 0 pour tous, rien d'annoncé", same(r, {}) && eq(r.shown, {}) && getSoiree()!.gains?.[3] === null, J(r));
r = playScored([{ winners: ["Malik", "Tom", "Inès"] }], { table: BAND });
check("camp (L'Intrus) : 2 pts à chaque gagnant", same(r, { Malik: 2, Tom: 2, "Inès": 2 }) && K(r.shown) === K(r.stored), J(r));
r = playScored([{ scores: { names: BAND, values: [2, 2, 0, 1] }, winners: ["Tom", "Inès"] }]);
check("Faux Témoin en camp : 2 pts chacun (le classement ne compte pas)", same(r, { Tom: 2, "Inès": 2 }), J(r));
r = playScored([{ winners: ["Inès"], scores: { names: BAND, values: [0, 0, 0, 2] } }]);
check("Catégorie Chrono (dernier en vie désigné) : 2 pts", same(r, { "Inès": 2 }), J(r));
r = playScored([{ teams: true, scores: { names: ["Léa", "Malik", "Tom", "Inès"], values: [6, 6, 3, 3] } }]);
check("Fais Deviner (équipes) : 2 pts à chaque joueur de l'équipe gagnante, 0 aux autres", same(r, { "Léa": 2, Malik: 2 }), J(r));
r = playScored([]);
check("jeu sans gagnant (Tu préfères, aucun signal) : 0", same(r, {}), J(r));
const tot = getSoiree()!;
const sumGains = (st: SoireeState) => Object.fromEntries(st.band.map((n) => [n, (st.gains ?? []).reduce((a, g) => a + (g?.[n] ?? 0), 0)]));
check("total = somme des gains de chaque jeu (attendu = compté)", eq(tot.points, sumGains(tot)) && eq(tot.points, { "Léa": 9, Malik: 12, Tom: 7, "Inès": 8 }), J([tot.points, sumGains(tot)]));

// Choix manuel : toujours 2 pts par gagnant choisi, même sur un jeu classé, même s'il reprend la suggestion
startSoiree(BAND, "soiree", 4, BAR.slice(0, 4));
r = playScored([{ scores: { names: BAND, values: [9, 5, 3, 1] } }], { manual: ["Léa", "Tom"] });
check("manuel sur jeu classé : Léa 2, Tom 2, personne d'autre", same(r, { "Léa": 2, Tom: 2 }), J(r));
r = playScored([{ scores: { names: BAND, values: [9, 5, 3, 1] } }], { manual: ["Léa"] });
check("manuel = même gagnant que proposé : 2 (pas 3/2/1)", same(r, { "Léa": 2 }), J(r));
r = playScored([], { manual: ["Inès"] });
check("« Désigner un gagnant » sur un jeu sans gagnant : 2", same(r, { "Inès": 2 }), J(r));
// Prénom inconnu, « Continuer sans corriger » : les gagnants connus à 2, annonce = compte
r = playScored([{ scores: { names: ["Léa2", "Malik", "Tom", "Inès"], values: [9, 9, 3, 1] } }]);
check("gagnant inconnu + continuer : Malik 2 (barème camp), annoncé = compté", same(r, { Malik: 2 }) && eq(r.shown, { Malik: 2 }), J(r));

// Rejouer puis croix : barème de la DERNIÈRE partie terminée
startSoiree(BAND, "soiree", 4, BAR.slice(0, 4));
r = playScored([{ scores: { names: BAND, values: [9, 5, 3, 1] } }, { scores: { names: BAND, values: [1, 3, 5, 9] } }]);
check("Rejouer : 2e partie remplace la 1re (Inès 3, Tom 2, Malik 1)", same(r, { Malik: 1, Tom: 2, "Inès": 3 }), J(r));
r = playScored([{ scores: { names: BAND, values: [9, 5, 3, 1] } }, { scores: { names: BAND, values: [4, 4, 4, 4] } }]);
check("Rejouer : dernière partie à égalité totale → 0 (l'ancienne ne compte plus)", same(r, {}), J(r));
setPhase("playing");
captureFinished({ gameId: "verre", ...finishedPayload({ scores: { names: BAND, values: [9, 5, 3, 1] } }) });
resumeSoiree();
setPhase("playing"); setPhase("winner");
check("reprise : résultat d'avant la fermeture oublié → 0", eq(announcedGains(getSoiree()!), {}));
recordWinners(announced(getSoiree()!).winners);
check("reprise : rien compté", eq(getSoiree()!.gains?.[2], null) && eq(getSoiree()!.points, { "Léa": 0, Malik: 1, Tom: 2, "Inès": 3 }), J(getSoiree()!.points));

// Sauvegarde d'avant le barème (+1 par gagnant) : convertie à 2 par gagnant, une seule fois
{
  const old = {
    v: 1, band: ["A", "B", "C"], vibe: "soiree", length: 4, playlist: BAR.slice(0, 4), index: 2, phase: "winner",
    points: { A: 2, B: 1, C: 0 }, results: [["A"], ["A", "B"], null, null], played: 2, startedAt: 1,
    outcomes: [{ winners: ["A"] }, { winners: ["A", "B"] }, null, null], pending: { winners: ["C"], loser: null },
  } as unknown as SoireeState;
  const m = migrateSoiree(old);
  check("ancienne sauvegarde : points recalculés (A 4, B 2, C 0), gains par jeu", eq(m.points, { A: 4, B: 2, C: 0 }) && eq(m.gains, [{ A: 2 }, { A: 2, B: 2 }, null, null]) && m.scale === 2, J(m));
  check("ancienne sauvegarde : migration idempotente", migrateSoiree(m) === m);
  check("ancienne sauvegarde : jeu en attente conservé (phase, pending)", m.phase === "winner" && eq(m.pending?.winners, ["C"]));
}

// Roi = le plus de points, même sans victoire ; le Naze n'est jamais à égalité avec lui
startSoiree(BAND, "soiree", 4, BAR.slice(0, 4));
playScored([{ scores: { names: BAND, values: [9, 5, 3, 1] } }]); // Léa 3 Malik 2 Tom 1
playScored([{ scores: { names: BAND, values: [3, 5, 9, 1] } }]); // Tom 3 Malik 2 Léa 1
playScored([{ scores: { names: BAND, values: [1, 5, 3, 9] } }]); // Inès 3 Malik 2 Tom 1
endSoiree();
s = getSoiree()!;
check("barème cumulé : Malik 6 (trois 2es), Léa 4, Tom 5, Inès 3", eq(s.points, { "Léa": 4, Malik: 6, Tom: 5, "Inès": 3 }), J(s.points));
check("Roi = Malik (plus de points, 0 victoire)", eq(kingsOf(s), ["Malik"]));
T = computeTrophies(s);
{
  const king = T.find((t) => t.id === "king");
  check("trophée Roi : Malik, 6 pts, aucun jeu gagné", king?.name === "Malik" && king.n === 6 && (king.games ?? []).length === 0, J(king));
  const nz = T.find((t) => t.id === "naze");
  check("Naze (s'il y en a un) jamais le Roi ni un ex æquo du Roi", !nz || (nz.name !== "Malik" && s.points[nz.name] < 6), J(nz));
}
titles = recapTitles(s, TITLES, LAST);
check("récap : Malik « Roi », Inès (seule dernière, 4 joueurs) « fair-play »", titles[0] === TITLES[0] && ranking(s)[0].name === "Malik" && titles[3] === LAST && ranking(s)[3].name === "Inès", J([ranking(s), titles]));
// Égalité de points en tête après barème : co-rois
startSoiree(["A", "B", "C"], "soiree", 4, BAR.slice(0, 4));
playScored([{ scores: { names: ["A", "B", "C"], values: [3, 2, 1] } }]); // A3 B2 C1
playScored([{ scores: { names: ["A", "B", "C"], values: [2, 3, 1] } }]); // B3 A2 C1
endSoiree();
s = getSoiree()!;
check("co-rois à 5 pts (A, B), C dernier", eq(kingsOf(s), ["A", "B"]) && s.points.C === 2, J(s.points));

/* ── 10. Passer / bandes / catalogue ── */
startSoiree(BAND, "soiree", 4, PL.slice(0, 4));
setPhase("playing"); captureFinished({ gameId: PL[0], winners: ["Tom"] });
setPhase("intro"); skipGame();
s = getSoiree()!;
check("Passer ce jeu : pas de point, pending effacé", s.points.Tom === 0 && !s.pending && s.index === 1);
check("played non incrémenté par Passer", s.played === 0);
check("M4 : Mime exclu d'une Soirée à bande impaire", !eligible(getZGame("make-guess")!, 5, "soiree") && eligible(getZGame("make-guess")!, 6, "soiree"));
check("M5 : Deviner le mot / Chrono / Mots Espions jouables jusqu'à 16 (comme la bande)", ["guess-word", "category-chrono", "code-names"].every((id) => eligible(getZGame(id)!, 16, "soiree")));

/* ── 11. Secret « malchanceux » : 3 jeux classés de suite dernier (pansement, sans effet sur les points) ── */
check("uniqueLast : seul en bas", uniqueLast([{ name: "a", rank: 1 }, { name: "b", rank: 2 }, { name: "c", rank: 3 }]) === "c");
check("uniqueLast : ex æquo en bas → personne", uniqueLast([{ name: "a", rank: 1 }, { name: "b", rank: 2 }, { name: "c", rank: 2 }]) === null);
check("uniqueLast : toute la table à égalité / un seul joueur → personne", uniqueLast([{ name: "a", rank: 1 }, { name: "b", rank: 1 }]) === null && uniqueLast([{ name: "a", rank: 1 }]) === null);
{
  const IN_LAST = { scores: { names: BAND, values: [9, 5, 3, 1] } }; // Inès dernière
  startSoiree(BAND, "soiree", 10, BAR);
  playScored([IN_LAST]);
  playScored([IN_LAST]);
  s = getSoiree()!;
  check("2 fois dernière : pas encore de pansement", unluckyOf(s) === null && lastStreak(s)?.n === 2, J(lastStreak(s)));
  const pts2 = { ...s.points };
  // 3e jeu : écran gagnant (jeu en attente) → « Courage Inès » + pansement
  setPhase("playing");
  captureFinished({ gameId: s.playlist[s.index], ...finishedPayload(IN_LAST) });
  setPhase("winner");
  s = getSoiree()!;
  check("3e fois dernière : « Courage » sur l'écran gagnant", courageFor(s) === "Inès" && unluckyOf(s) === "Inès", J(lastStreak(s)));
  const shown = announcedGains(s);
  recordWinners(announced(s).winners);
  s = getSoiree()!;
  check("pansement : aucun effet sur les points (3/2/1 inchangé)", eq(shown, { "Léa": 3, Malik: 2, Tom: 1 }) && s.points["Inès"] === pts2["Inès"] && s.points["Léa"] === pts2["Léa"] + 3, J(s.points));
  check("après l'écran gagnant : pansement gardé, plus de « Courage »", unluckyOf(s) === "Inès" && courageFor(s) === null);
  // Jeu en camp (non classé) : ne compte pas, ne coupe pas la série
  playScored([{ winners: ["Tom"], scores: { names: BAND, values: [3, 5, 9, 1] } }]);
  s = getSoiree()!;
  check("jeu en camp : série ni comptée ni coupée", unluckyOf(s) === "Inès" && lastStreak(s)?.n === 3, J(lastStreak(s)));
  // Jeu passé : ne compte pas
  skipGame();
  check("jeu passé : série intacte", unluckyOf(getSoiree()!) === "Inès");
  // 4e fois dernière : encore un petit mot
  setPhase("playing");
  captureFinished({ gameId: getSoiree()!.playlist[getSoiree()!.index], ...finishedPayload(IN_LAST) });
  setPhase("winner");
  check("4e fois dernière : « Courage » encore", courageFor(getSoiree()!) === "Inès" && lastStreak(getSoiree()!)?.n === 4);
  recordWinners(announced(getSoiree()!).winners);
  // Ex æquo en bas : la série s'arrête, pansement retiré
  playScored([{ scores: { names: BAND, values: [9, 5, 1, 1] } }]);
  s = getSoiree()!;
  check("ex æquo en bas : série coupée, plus de pansement", unluckyOf(s) === null && lastStreak(s) === null, J(lastStreak(s)));
  check("jeux joués jusqu'ici dans la playlist", getSoiree()!.index === 7 && getSoiree()!.phase === "intro");
}
{
  // Un autre dernier 3 fois : Tom ; puis il remonte → pansement retiré
  startSoiree(BAND, "soiree", 10, BAR);
  const IN_LAST = { scores: { names: BAND, values: [9, 5, 3, 1] } };
  const TOM_LAST = { scores: { names: BAND, values: [9, 5, 1, 3] } };
  playScored([TOM_LAST]); playScored([TOM_LAST]); playScored([TOM_LAST]);
  check("Tom 3 fois dernier : pansement à Tom", unluckyOf(getSoiree()!) === "Tom");
  playScored([IN_LAST]);
  check("Tom n'est plus dernier : pansement retiré", unluckyOf(getSoiree()!) === null && lastStreak(getSoiree()!)?.name === "Inès");
}
{
  // Choix manuel sur un jeu classé : ne compte pas (pas de classement individuel validé)
  startSoiree(BAND, "soiree", 10, BAR);
  const IN_LAST = { scores: { names: BAND, values: [9, 5, 3, 1] } };
  playScored([IN_LAST]); playScored([IN_LAST]);
  playScored([IN_LAST], { manual: ["Léa"] });
  check("gagnant choisi à la main : le jeu ne compte pas", unluckyOf(getSoiree()!) === null && lastStreak(getSoiree()!)?.n === 2);
  // Équipes (Fais Deviner) : jamais compté
  playScored([{ teams: true, scores: { names: BAND, values: [6, 6, 3, 1] } }]);
  check("jeu par équipes : ne compte pas", lastStreak(getSoiree()!)?.n === 2);
}

const st: SoireeState | null = getSoiree();
void st;
console.log(out.join("\n"));
console.log(`\n${pass}/${pass + fail} PASS${fail ? ` — ${fail} FAIL` : ""}`);
if (fail) (globalThis as { process?: { exitCode?: number } }).process!.exitCode = 1;
