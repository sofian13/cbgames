"use client";

/**
 * Le Faux Témoin — jeu sur UN SEUL téléphone (3-10 joueurs).
 * Une scène illustrée (générée en SVG) passe de main en main : chacun la voit 5 s,
 * sauf le ou les Faux Témoins qui ne voient rien (ils ne savent pas qui sont les autres).
 * Ensuite l'app affiche juste l'ORDRE des questions (« Léa → Malik… ») : tout se passe
 * à l'oral, on ne touche plus le tél (bouton discret « Une idée de question ? » en option).
 * Vote à trois, comme L'Intrus : la personne désignée est éliminée. Innocente → les Faux
 * Témoins encore en jeu marquent et on repart pour un tour de questions ; Faux Témoin →
 * démasqué. Les Faux Témoins gagnent dès qu'ils sont aussi nombreux que les témoins restants.
 * À la fin : la scène + les réponses des idées tirées + le détail des points.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Dices, Lightbulb, Volume2, VolumeX, X, Eye } from "lucide-react";
import type { GameProps } from "@/lib/games/types";
import { useT } from "@/lib/i18n";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { Mascot } from "@/components/Mascot";
import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { GameIconButton, GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import {
  DISPLAY, PassScreen, PlayersSetup, ZButton, ZCard, ZChip, ZChoice, ZLink, ZRanking, ZScreen, ZTitle, ZZ,
  inkOn, useScrollTopOn, useSfxMuted,
} from "@/components/games/local-kit";
import { FT_STR, answerLabel, type FTStrings } from "./i18n";
import { BlobFigure, SceneView } from "./scene-view";
import { COLOR_HEX, DECOR_IDS, makeScene, planRound, shuffle, type Answer, type DecorId, type Question, type Scene } from "./scene";
import { useGameFinished } from "@/lib/game-finished";
import { GameTuto, TutoAgainButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { useFTExtra, useFTTuto } from "@/components/games/faux-temoin/tuto";
import { ShareResultButton } from "@/components/games/share-result-button";
import { rankingCard } from "@/lib/share-cards";

const ACCENT = "#4ECDC4";
const VIEW_SEC = 5;
/** Points : chaque Faux Témoin encore en jeu, par innocent éliminé (gardés même s'il est démasqué ensuite) */
const PTS_FOOL = 2;
/** Points : bonus de chaque Faux Témoin quand leur camp gagne */
const PTS_WIN = 3;
/** Points : chaque témoin encore en jeu, par Faux Témoin démasqué */
const PTS_CATCH = 3;
/** Nombre max de Faux Témoins : environ 1/3 des joueurs (1 jusqu'à 5, 2 dès 6, 3 dès 9) */
const maxFakes = (n: number) => Math.max(1, Math.floor(n / 3));

type Phase =
  | "setup" | "teaser" | "pass" | "view" | "order"
  | "vote" | "suspense" | "out" | "reveal" | "scores" | "end";

type Camp = "fakes" | "witnesses";

/** Ce qui s'est passé dans la manche (pour le récap des points) */
type Ev =
  | { k: "innocent"; who: number; fakes: number[] }
  | { k: "caught"; who: number; witnesses: number[] }
  | { k: "fakesWin"; fakes: number[] }
  | { k: "witnessesWin" };

const INK = GAME_INK;

/** Ordre des questions entre les joueurs encore en jeu : un cycle au hasard (chacun pose une question et en reçoit une). */
function makeOrder(ids: number[], prev?: [number, number][]): [number, number][] {
  let best: [number, number][] = [];
  for (let tries = 0; tries < 6; tries++) {
    const o = shuffle(ids);
    best = o.map((a, i) => [a, o[(i + 1) % o.length]] as [number, number]);
    // Évite de retomber sur exactement les mêmes duos que le tour précédent
    if (!prev || ids.length < 4 || best.some(([a, b]) => !prev.some(([x, y]) => x === a && y === b))) break;
  }
  return best;
}

export default function FauxTemoinGame({ onReturnToLobby }: GameProps) {
  const t = useT(FT_STR);
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [fakeCount, setFakeCount] = useState<number[]>([]);
  const [nFakes, setNFakes] = useState(1);
  const [round, setRound] = useState(1);
  const [scene, setScene] = useState<Scene | null>(null);
  const [ideasAll, setIdeasAll] = useState<Question[]>([]);
  const [usedDecors, setUsedDecors] = useState<DecorId[]>([]);
  const [fakes, setFakes] = useState<number[]>([]);
  const [viewer, setViewer] = useState(0);
  const [order, setOrder] = useState<[number, number][]>([]);
  const [orderRound, setOrderRound] = useState(1);
  const [idea, setIdea] = useState<Question | null>(null);
  const [ideaQueue, setIdeaQueue] = useState<Question[]>([]);
  const [drawn, setDrawn] = useState<Question[]>([]);
  const [showAll, setShowAll] = useState(false);
  /** Éliminés de la manche, dans l'ordre */
  const [out, setOut] = useState<number[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [roundPts, setRoundPts] = useState<number[]>([]);
  const [winner, setWinner] = useState<Camp | null>(null);
  /** Vote : prénom désigné, mode « égalité » (choix des ex æquo), revote restreint aux ex æquo */
  const [picked, setPicked] = useState<number | null>(null);
  const [tieMode, setTieMode] = useState(false);
  const [tieSel, setTieSel] = useState<number[]>([]);
  const [pool, setPool] = useState<number[] | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Fin de partie → note éventuelle + Soirée (app). Gagnants : le camp vainqueur (Faux Témoins
  // ou témoins) si on n'a joué qu'une manche ; au-delà, le podium des points fait foi.
  const campWinners = winner ? players.filter((_, i) => (winner === "fakes") === fakes.includes(i)) : [];
  useGameFinished(phase === "end", { scores: { names: players, values: scores }, winners: round === 1 ? campWinners : null });

  useScrollTopOn(`${phase}-${viewer}-${orderRound}-${tieMode}-${pool?.length ?? 0}`);
  // Tuto en slides : 1re fois, dès l'ouverture du jeu (avant la saisie des prénoms)
  const tuto = useFirstTimeTuto("faux-temoin");
  const tutoSlides = useFTTuto();
  const extra = useFTExtra();
  const showTutoOnce = useRef(tuto.showIfFirstTime);
  useEffect(() => { showTutoOnce.current(); }, []);

  useEffect(() => {
    preloadSfx(["whoosh", "whooshdown", "card-flip", "tick", "pop", "select", "drumroll", "drumroll-end", "gong", "tada", "applause", "buzzer", "crowd-aww", "correct", "coins"]);
  }, []);

  const k = Math.min(nFakes, maxFakes(players.length));
  const joinNames = (names: string[]) => names.length > 1 ? `${names.slice(0, -1).join(", ")} ${t.and} ${names[names.length - 1]}` : names[0] ?? "";
  const namesOf = (ids: number[]) => joinNames(ids.map((i) => players[i]));

  const alive = players.map((_, i) => i).filter((i) => !out.includes(i));
  const fakesAlive = fakes.filter((f) => !out.includes(f));
  const witnessesAlive = alive.filter((i) => !fakes.includes(i));

  // ── Manches ───────────────────────────────────────────
  const drawScene = (avoid: DecorId[]) => setScene(makeScene(avoid));

  const startGame = (names: string[]) => {
    setPlayers(names);
    setScores(names.map(() => 0));
    setFakeCount(names.map(() => 0));
    setNFakes(1);
    setRound(1);
    setUsedDecors([]);
    drawScene([]);
    setPhase("teaser");
  };

  const rerollScene = () => {
    if (!scene) return;
    // La scène écartée compte comme vue : on ne la retire pas tout de suite
    let seen = usedDecors.includes(scene.decor) ? usedDecors : [...usedDecors, scene.decor];
    if (seen.length >= DECOR_IDS.length) seen = [scene.decor];
    setUsedDecors(seen);
    drawScene(seen);
  };

  const deal = () => {
    if (!scene) return;
    // Faux Témoins au hasard parmi ceux qui l'ont été le moins souvent (rôle tournant, mais secret)
    const pool0 = shuffle(players.map((_, i) => i)).sort((a, b) => fakeCount[a] - fakeCount[b]);
    const f = pool0.slice(0, k);
    const ideas = planRound(scene, 0).ideas;
    setIdeasAll(ideas);
    setIdeaQueue(ideas);
    setFakes(f);
    setFakeCount((c) => c.map((x, i) => (f.includes(i) ? x + 1 : x)));
    setUsedDecors((u) => (u.includes(scene.decor) ? u : [...u, scene.decor]));
    setViewer(0);
    setOrder(makeOrder(players.map((_, i) => i)));
    setOrderRound(1);
    setIdea(null);
    setDrawn([]);
    setShowAll(false);
    setOut([]);
    setEvents([]);
    setRoundPts(players.map(() => 0));
    setWinner(null);
    setPhase("pass");
  };

  const viewDone = () => {
    if (viewer + 1 < players.length) {
      setViewer(viewer + 1);
      setPhase("pass");
    } else {
      playSfx("pop", { volume: 0.5 });
      setPhase("order");
    }
  };

  /** « Une idée de question ? » / « Une autre » : l'idée écartée repasse en fin de pile. */
  const drawIdea = () => {
    const queue = idea ? [...ideaQueue, idea] : ideaQueue;
    if (!queue.length) return;
    playSfx("card-flip", { volume: 0.5 });
    const q = queue[0];
    setIdea(q);
    setIdeaQueue(queue.slice(1));
    setDrawn((d) => (d.some((x) => x.id === q.id) ? d : [...d, q]));
  };

  /** Nouveau tour de questions (sur demande, ou après une élimination) entre les joueurs encore en jeu */
  const newTurn = () => {
    playSfx("whoosh", { volume: 0.5 });
    setOrder((o) => makeOrder(alive, o));
    setOrderRound((r) => r + 1);
    setIdea(null);
    setPhase("order");
  };

  const goVote = () => {
    playSfx("whoosh", { volume: 0.5 });
    setPicked(null);
    setTieMode(false);
    setTieSel([]);
    setPool(null);
    setPhase("vote");
  };

  const toggleTie = (i: number) => {
    playSfx("select", { volume: 0.4 });
    setTieSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };

  /** Élimine la personne désignée : points, fin de manche éventuelle, puis suspense. */
  const eliminate = () => {
    if (picked == null) return;
    const i = picked;
    const nextOut = [...out, i];
    const fA = fakes.filter((f) => !nextOut.includes(f));
    const wA = players.map((_, j) => j).filter((j) => !nextOut.includes(j) && !fakes.includes(j));
    const add = players.map(() => 0);
    const evs: Ev[] = [];
    if (fakes.includes(i)) {
      wA.forEach((w) => { add[w] += PTS_CATCH; });
      evs.push({ k: "caught", who: i, witnesses: wA });
    } else {
      fA.forEach((f) => { add[f] += PTS_FOOL; });
      evs.push({ k: "innocent", who: i, fakes: fA });
    }
    let w: Camp | null = null;
    if (!fA.length) {
      w = "witnesses";
      evs.push({ k: "witnessesWin" });
    } else if (fA.length >= wA.length) {
      w = "fakes";
      fakes.forEach((f) => { add[f] += PTS_WIN; });
      evs.push({ k: "fakesWin", fakes });
    }
    setOut(nextOut);
    setEvents((e) => [...e, ...evs]);
    setRoundPts((p) => p.map((x, j) => x + add[j]));
    setScores((p) => p.map((x, j) => x + add[j]));
    setWinner(w);
    playCombo("drumroll", { duration: 1.8 });
    setPhase("suspense");
  };

  const lastOut = out[out.length - 1];

  // Suspense → résultat de l'élimination
  useEffect(() => {
    if (phase !== "suspense") return;
    const id = window.setTimeout(() => {
      if (winner === "witnesses") playCombo("fanfare");
      else if (fakes.includes(lastOut)) playCombo("reveal");
      else playCombo("fail");
      setPhase("out");
    }, 1900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const nextRound = () => {
    setRound((r) => r + 1);
    // Pas de décor déjà joué tant qu'il en reste (35 lieux) ; ensuite on repart de zéro
    const exhausted = usedDecors.length >= DECOR_IDS.length;
    drawScene(exhausted ? [] : usedDecors);
    if (exhausted) setUsedDecors([]);
    setPhase("teaser");
  };

  const replay = () => {
    setScores(players.map(() => 0));
    setFakeCount(players.map(() => 0));
    setRound(1);
    setUsedDecors([]);
    drawScene([]);
    setPhase("teaser");
  };

  const tools = <Tools t={t} onRules={() => { playSfx("open", { volume: 0.5 }); setShowRules(true); }} />;
  const tutoLayer = tuto.open ? <GameTuto slides={tutoSlides} onDone={tuto.close} /> : null;
  const rulesSheet = (
    <>
      {showRules && <RulesSheet t={t} pointsLine={extra.pointsLine} onTuto={() => { setShowRules(false); tuto.show(); }} onClose={() => setShowRules(false)} />}
      {tutoLayer}
    </>
  );

  // ── Écrans ────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <>
        <PlayersSetup emoji="" name={t.name} min={3} max={10} accent={ACCENT} onStart={startGame} onBack={onReturnToLobby}
          footer={<IdeaButton game={t.name} kind={t.ideaKind} />} />
        {tutoLayer}
      </>
    );
  }

  if (!scene) return null;
  const fakeNames = namesOf(fakes);

  if (phase === "pass") {
    return (
      <PassScreen
        toName={players[viewer]}
        colorIndex={viewer}
        hint={t.passHint(VIEW_SEC)}
        buttonLabel={t.passBtn}
        onReady={() => setPhase("view")}
      />
    );
  }

  if (phase === "view") {
    return <ViewScreen key={viewer} t={t} scene={scene} isFake={fakes.includes(viewer)} nFakes={fakes.length} onDone={viewDone} />;
  }

  let body: ReactNode = null;
  let bg: string = ZZ.night;

  if (phase === "teaser") {
    const max = maxFakes(players.length);
    body = (
      <>
        <ZChip bg={ZZ.yellow}>{t.round(round)}</ZChip>
        <p className="mt-4 text-[17px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.teaserTitle}</p>
        <ZTitle size="clamp(34px, 10vw, 46px)" className="mt-1">{t.decor[scene.decor]}</ZTitle>
        <ZCard className="mt-5 overflow-hidden" tilt={-1.5} bg="#fff" style={{ aspectRatio: "6 / 5" }}>
          {/* Flou + noir et blanc : on devine l'ambiance, pas les détails ni les couleurs */}
          <div aria-label={t.teaserLabel} role="img" style={{ width: "100%", height: "100%", filter: "blur(16px) saturate(0.15)", transform: "scale(1.15)" }}>
            <SceneView scene={scene} label="" />
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-20 w-20 place-items-center rounded-full" style={{ background: "#fff", border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`, color: INK }}>
              <Eye size={38} strokeWidth={2.8} aria-hidden />
            </span>
          </div>
        </ZCard>
        <p className="mt-5 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{t.teaserSub}</p>
        <div className="mt-4 flex justify-center">
          <RerollButton label={t.rerollScene} onClick={rerollScene} />
        </div>
        {/* Réglage : nombre de Faux Témoins (dès 6 joueurs) */}
        {max > 1 && (
          <div className="mt-5">
            <p className="text-center text-[16px] font-bold">{t.fakesLabel}</p>
            <div className="mt-2.5 flex justify-center gap-3" role="radiogroup" aria-label={t.fakesLabel}>
              {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                <ZChoice key={n} active={k === n} onClick={() => { playSfx("select", { volume: 0.4 }); setNFakes(n); }} color={ZZ.pink} className="grid h-14 w-14 place-items-center !p-0 text-center" label={String(n)}>
                  <span style={{ ...DISPLAY, fontSize: 26 }}>{n}</span>
                </ZChoice>
              ))}
            </div>
          </div>
        )}
        <div className="min-h-6 flex-1" />
        <ZButton className="mt-6" bg={ACCENT} onClick={deal}>{t.deal}</ZButton>
      </>
    );
  } else if (phase === "order") {
    const noMore = !idea && !ideaQueue.length;
    body = (
      <>
        <ZChip bg={ZZ.yellow}>{t.orderChip(orderRound)}</ZChip>
        <ZTitle size="clamp(32px, 9.5vw, 44px)" className="mt-3">{t.orderTitle}</ZTitle>
        <p className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{t.orderText}</p>
        {fakesAlive.length > 1 && <p className="mt-1.5 text-[15px] font-bold leading-snug" style={{ color: ZZ.yellow }}>{t.orderFakes(fakesAlive.length)}</p>}
        {out.length > 0 && (
          <ZChip bg="#fff" tilt={1} className="mt-3" style={{ whiteSpace: "normal", lineHeight: 1.2, padding: "6px 12px" }}>{t.outLabel(namesOf(out))}</ZChip>
        )}
        {/* L'ordre des questions : qui interroge qui (tout se dit à voix haute) */}
        <ol className="mt-4 flex flex-col gap-2" aria-label={t.orderLabel}>
          {order.map(([a, b], i) => (
            <li key={`${orderRound}-${i}`} aria-label={t.pairLabel(players[a], players[b])}
              className="flex min-h-[46px] items-center gap-2 rounded-[18px] px-2.5 py-1"
              style={{ background: "#fff", color: INK, border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}`, rotate: i % 2 ? "0.6deg" : "-0.6deg" }}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[14px]" style={{ ...DISPLAY, background: INK, color: "#fff" }} aria-hidden>{i + 1}</span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5" aria-hidden>
                <PlayerBlob name={players[a]} colorIndex={a} size={26} mood="happy" bob={false} />
                <span className="min-w-0 truncate" style={{ ...DISPLAY, fontSize: 17 }}>{players[a]}</span>
              </span>
              <ArrowRight size={20} strokeWidth={3.2} className="shrink-0" aria-hidden />
              <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5" aria-hidden>
                <span className="min-w-0 truncate text-right" style={{ ...DISPLAY, fontSize: 17 }}>{players[b]}</span>
                <PlayerBlob name={players[b]} colorIndex={b} size={26} mood="sus" bob={false} />
              </span>
            </li>
          ))}
        </ol>
        {/* Idée de question : optionnel, discret */}
        {idea ? (
          <ZCard key={idea.id} bg={ZZ.cream} tilt={1} className="mt-5 px-4 pb-3 pt-4">
            <span className="absolute -left-2 -top-3.5 inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-[13px] font-extrabold" style={{ background: ZZ.yellow, border: `2.5px solid ${INK}`, color: INK }}>
              <Lightbulb size={14} strokeWidth={3} aria-hidden /> {t.ideaTag}
            </span>
            <ZTitle size="clamp(19px, 5.6vw, 23px)" style={{ lineHeight: 1.08, textWrap: "balance" }}>{t.question(idea.q)}</ZTitle>
            {ideaQueue.length > 0 && (
              <div className="mt-2.5 flex justify-end"><RerollButton label={t.ideaAnother} onClick={drawIdea} bg={ZZ.yellow} /></div>
            )}
          </ZCard>
        ) : noMore ? (
          <p className="mt-4 text-center text-[15px] font-bold" style={{ color: ZZ.yellow }}>{t.ideaNone}</p>
        ) : (
          <ZLink className="mt-3" onClick={drawIdea}><Lightbulb size={18} strokeWidth={2.8} aria-hidden /> {t.ideaBtn}</ZLink>
        )}
        <div className="min-h-4 flex-1" />
        <ZButton className="mt-5" bg={ZZ.pink} onClick={goVote}>{t.toVote}</ZButton>
        <ZLink className="mt-1" onClick={newTurn}>{t.moreTurn}</ZLink>
      </>
    );
  } else if (phase === "vote" && tieMode) {
    // Égalité : on désigne les ex æquo, puis revote entre eux seulement
    const cands = pool ?? alive;
    body = (
      <>
        <ZTitle size="clamp(32px, 9.5vw, 44px)">{t.tieTitle}</ZTitle>
        <p className="mt-3 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{t.tieText}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {cands.map((i, n) => {
            const on = tieSel.includes(i);
            const p = players[i];
            return (
              <ZChoice key={i} active={on} onClick={() => toggleTie(i)} color={ZZ.yellow} tilt={n % 2 ? 1.2 : -1.2} className="flex min-h-[64px] items-center gap-2.5">
                <PlayerBlob name={p} colorIndex={i} size={38} mood={on ? "shocked" : "sus"} bob={false} />
                <span className="min-w-0 flex-1 leading-tight" style={{ ...DISPLAY, fontSize: p.length > 10 ? 16 : 19, overflowWrap: "anywhere" }}>{p}</span>
              </ZChoice>
            );
          })}
        </div>
        <div className="min-h-6 flex-1" />
        <ZButton className="mt-6" bg={ZZ.yellow} disabled={tieSel.length < 2}
          onClick={() => { playSfx("whoosh", { volume: 0.5 }); setPool(cands.filter((i) => tieSel.includes(i))); setTieSel([]); setPicked(null); setTieMode(false); }}>
          {tieSel.length < 2 ? t.tiePick : t.tieBtn}
        </ZButton>
        <ZLink className="mt-1" onClick={() => { setTieMode(false); setTieSel([]); }}>{t.tieCancel}</ZLink>
      </>
    );
  } else if (phase === "vote") {
    const cands = pool ?? alive;
    body = (
      <>
        {pool && <ZChip bg={ZZ.yellow} className="mb-3">{t.revoteChip}</ZChip>}
        <ZTitle size="clamp(32px, 9.5vw, 44px)">{t.voteTitle(fakesAlive.length)}</ZTitle>
        <p className="mt-3 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{pool ? t.revoteText : t.voteText}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {cands.map((i, n) => {
            const on = picked === i;
            const p = players[i];
            return (
              <ZChoice key={i} active={on} onClick={() => { playSfx("select", { volume: 0.4 }); setPicked(on ? null : i); }} color={ZZ.pink} tilt={n % 2 ? 1.2 : -1.2} className="flex min-h-[64px] items-center gap-2.5">
                <PlayerBlob name={p} colorIndex={i} size={38} mood={on ? "shocked" : "sus"} bob={false} />
                <span className="min-w-0 flex-1 leading-tight" style={{ ...DISPLAY, fontSize: p.length > 10 ? 16 : 19, overflowWrap: "anywhere" }}>{p}</span>
              </ZChoice>
            );
          })}
        </div>
        <div className="min-h-6 flex-1" />
        <ZButton className="mt-6" bg={ZZ.pink} disabled={picked == null} onClick={eliminate}>
          {picked == null ? t.votePick : t.voteBtn(players[picked])}
        </ZButton>
        {pool ? (
          <ZLink className="mt-1" onClick={() => { playSfx("card-flip", { volume: 0.5 }); setPicked(pool[Math.floor(Math.random() * pool.length)]); }}>
            <Dices size={18} strokeWidth={2.6} aria-hidden /> {t.tieRandom}
          </ZLink>
        ) : (
          <ZLink className="mt-1" onClick={() => { playSfx("pop", { volume: 0.4 }); setPicked(null); setTieMode(true); }}>{t.tieLink}</ZLink>
        )}
      </>
    );
  } else if (phase === "suspense") {
    body = (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <PlayerBlob name={players[lastOut]} colorIndex={lastOut} size={130} mood="sus" arms />
        <ZTitle size="clamp(32px, 9vw, 44px)" className="mt-6" style={{ overflowWrap: "anywhere" }}>{t.suspense(players[lastOut])}</ZTitle>
      </div>
    );
  } else if (phase === "out") {
    const name = players[lastOut];
    const caught = fakes.includes(lastOut);
    bg = winner === "fakes" ? ZZ.coral : caught ? ZZ.mint : ZZ.coral;
    const k0 = fakes.length;
    body = (
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="mt-1"><PlayerBlob name={name} colorIndex={lastOut} size={winner ? 84 : 110} mood="shocked" arms /></div>
        <ZTitle size={winner ? "clamp(34px, 10vw, 46px)" : "clamp(40px, 12vw, 56px)"} className="mt-3" style={{ color: INK }}>{caught ? t.caughtTitle : t.innocentTitle}</ZTitle>
        <p className="mt-2 max-w-sm text-[18px] font-bold leading-snug" style={{ color: INK }}>{caught ? t.caughtText(name, k0) : t.innocentText(name)}</p>
        {/* Points de l'élimination (ceux des Faux Témoins restent secrets jusqu'à la fin) */}
        {caught ? (
          witnessesAlive.length > 0 && <ZChip bg="#fff" className="mt-4 self-center" style={{ whiteSpace: "normal", lineHeight: 1.2, padding: "8px 14px" }}>{t.witnessPts(PTS_CATCH)}</ZChip>
        ) : !winner && (
          <>
            <p className="mt-4" style={{ ...DISPLAY, fontSize: 24, color: INK, lineHeight: 1.1 }}>{t.stillFree(fakesAlive.length)}</p>
            <ZChip bg="#fff" className="mt-3 self-center" style={{ whiteSpace: "normal", lineHeight: 1.2, padding: "8px 14px" }}>{t.secretPts(PTS_FOOL, fakesAlive.length)}</ZChip>
          </>
        )}
        {winner === "fakes" && (
          <ZCard bg="#fff" tilt={-1.5} className="mt-5 w-full px-4 py-4">
            <div className="flex flex-wrap justify-center gap-3">
              {fakes.map((f) => (
                <div key={f} className="flex flex-col items-center">
                  <PlayerBlob name={players[f]} colorIndex={f} size={64} mood="cool" arms bob={false} />
                  <span className="mt-1 max-w-[120px] truncate" style={{ ...DISPLAY, fontSize: 17 }}>{players[f]}</span>
                </div>
              ))}
            </div>
            <ZTitle size={30} className="mt-2">{t.fakesWinTitle(k0)}</ZTitle>
            <p className="mt-1 text-[16px] font-bold leading-snug">{t.fakesWinText(fakeNames, k0)}</p>
            <p className="mt-1 text-[15px] font-semibold leading-snug">{t.fakesWinPts(PTS_WIN, k0)}</p>
          </ZCard>
        )}
        {winner === "witnesses" && (
          <ZCard bg={ZZ.yellow} tilt={-1.5} className="mt-5 w-full px-4 py-4">
            <ZTitle size={30}>{t.witnessesWinTitle}</ZTitle>
            <p className="mt-1 text-[16px] font-bold leading-snug">{t.witnessesWinText(k0)}</p>
          </ZCard>
        )}
        {!winner && (
          <ZCard bg="#fff" tilt={1.5} className="mt-5 w-full px-4 py-3.5">
            {caught && <p className="text-[16px] font-bold leading-snug">{t.leftFakes(fakesAlive.length)}</p>}
            <p className={`${caught ? "mt-1 " : ""}text-[15px] font-semibold leading-snug`} style={{ color: "#4A3A66" }}>{t.remaining(alive.length, fakesAlive.length)}</p>
            {fakesAlive.length >= witnessesAlive.length - 1 && (
              <p className="mt-1 text-[16px] font-extrabold leading-snug" style={{ color: "#C2185B" }}>{t.danger(fakesAlive.length)}</p>
            )}
          </ZCard>
        )}
        <div className="min-h-6 flex-1" />
        {winner ? (
          <ZButton className="mt-6" bg={winner === "witnesses" ? ACCENT : ZZ.yellow} onClick={() => { playSfx("whoosh", { volume: 0.5 }); setPhase("reveal"); }}>{t.seeScene}</ZButton>
        ) : (
          <ZButton className="mt-6" bg={ZZ.yellow} onClick={newTurn}>{t.nextQuestions}</ZButton>
        )}
      </div>
    );
  } else if (phase === "reveal") {
    const usedIds = new Set(drawn.map((q) => q.id));
    const others = ideasAll.filter((q) => !usedIds.has(q.id));
    // Récap : qui a gagné quoi, et pourquoi
    const lines = events.map((e) => {
      switch (e.k) {
        case "innocent": return t.evInnocent(players[e.who], namesOf(e.fakes), PTS_FOOL);
        case "caught": return t.evCaught(players[e.who], namesOf(e.witnesses), PTS_CATCH);
        case "fakesWin": return t.evFakesWin(namesOf(e.fakes), PTS_WIN, e.fakes.length);
        case "witnessesWin": return t.evWitnessesWin;
      }
    });
    const totals = players.map((name, i) => ({ name, i, pts: roundPts[i] ?? 0 })).filter((r) => r.pts > 0).sort((a, b) => b.pts - a.pts);
    body = (
      <>
        <div className="flex items-center justify-between gap-2">
          <ZChip bg={ZZ.yellow}>{t.round(round)}</ZChip>
        </div>
        <ZTitle size="clamp(34px, 10vw, 46px)" className="mt-3">{t.revealTitle}</ZTitle>
        <ZCard className="mt-4 overflow-hidden" bg="#fff" radius={22}>
          <SceneView scene={scene} label={t.sceneLabel} />
        </ZCard>
        <ZChip bg={ZZ.pink} tilt={2} className="mt-4" style={{ whiteSpace: "normal", lineHeight: 1.2, padding: "8px 14px" }}>{t.revealWho(fakeNames, fakes.length)}</ZChip>
        {drawn.length > 0 && (
          <>
            <p className="mt-6" style={{ ...DISPLAY, fontSize: 24 }}>{t.ideasTitle}</p>
            <div className="mt-3 flex flex-col gap-2.5">
              {drawn.map((q) => <AnswerRow key={q.id} t={t} q={q} />)}
            </div>
          </>
        )}
        {others.length > 0 && (showAll ? (
          <>
            <p className="mt-6" style={{ ...DISPLAY, fontSize: 22 }}>{t.moreDetails}</p>
            <div className="mt-3 flex flex-col gap-2.5">
              {others.map((q) => <AnswerRow key={q.id} t={t} q={q} />)}
            </div>
          </>
        ) : (
          <ZLink className="mt-3" onClick={() => { playSfx("pop", { volume: 0.4 }); setShowAll(true); }}>{t.moreDetails}</ZLink>
        ))}
        <ZCard bg={winner === "fakes" ? ZZ.coral : ZZ.mint} tilt={-1} className="mt-5 px-4 py-3.5">
          <p style={{ ...DISPLAY, fontSize: 22, lineHeight: 1.1 }}>{t.recapTitle}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {lines.map((l, i) => <li key={i} className="text-[15px] font-bold leading-snug">{l}</li>)}
          </ul>
          {totals.length > 0 && (
            <>
              <p className="mt-3 text-[13px] font-extrabold uppercase tracking-wide">{t.recapTotal}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {totals.map((r) => (
                  <span key={r.i} className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-[15px] font-extrabold" style={{ background: "#fff", color: INK, border: `2.5px solid ${INK}` }}>
                    <PlayerBlob name={r.name} colorIndex={r.i} size={20} bob={false} />
                    {r.name} +{r.pts}
                  </span>
                ))}
              </div>
            </>
          )}
        </ZCard>
        <ZButton className="mt-6" bg={ZZ.yellow} onClick={() => { playSfx("coins", { volume: 0.5 }); setPhase("scores"); }}>{t.scoresBtn}</ZButton>
      </>
    );
  } else if (phase === "scores" || phase === "end") {
    const ranking = players.map((name, i) => ({ name, score: scores[i], colorIndex: i })).sort((a, b) => b.score - a.score);
    const end = phase === "end";
    const tie = ranking.length > 1 && ranking[0].score === ranking[1].score;
    body = (
      <>
        {end && (
          <div className="mb-2 flex justify-center"><PlayerBlob name={ranking[0].name} colorIndex={ranking[0].colorIndex} size={110} mood="laughing" crown={!tie} arms cheering />
</div>
        )}
        <ZTitle size="clamp(34px, 10vw, 46px)" className={end ? "text-center" : ""}>{end ? t.endTitle : t.scoresTitle}</ZTitle>
        {end && <p className="mt-2 text-center text-[20px] font-bold" style={{ color: ZZ.yellow }}>{round === 1 && winner ? (winner === "fakes" ? t.fakesWinTitle(fakes.length) : t.witnessesWinTitle) : tie ? t.tie : t.winner(ranking[0].name)}</p>}
        <div className="mt-5"><ZRanking rows={ranking} unit={t.pts} /></div>
        <div className="min-h-6 flex-1" />
        {end ? (
          <>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ShareResultButton bg={ZZ.yellow} card={() => rankingCard("faux-temoin", ranking, t.pts)} />
              <IdeaButton game={t.name} kind={t.ideaKind} bg="#fff" />
            </div>
            <ZButton className="mt-5" bg={ACCENT} onClick={replay}>{t.replay}</ZButton>
            {onReturnToLobby && <ZButton className="mt-3" bg="#fff" size="md" onClick={onReturnToLobby}>{t.quit}</ZButton>}
          </>
        ) : (
          <>
            <ZButton className="mt-6" bg={ACCENT} onClick={nextRound}>{t.nextRound}</ZButton>
            <ZLink className="mt-2" onClick={() => { playCombo("fanfare"); setPhase("end"); }}>{t.finish}</ZLink>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <ZScreen bg={bg} sound={false} tools={tools}>{body}</ZScreen>
      {rulesSheet}
    </>
  );
}

// ── Une question + sa vraie réponse (révélation) ─────────
function AnswerRow({ t, q, who, fake, bg = "#fff" }: { t: FTStrings; q: Question; who?: string; fake?: boolean; bg?: string }) {
  const a: Answer = q.answer;
  return (
    <div className="rounded-[18px] px-4 py-3" style={{ background: bg, color: INK, border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>
      {who && <p className="mb-1 text-[13px] font-extrabold" style={{ color: fake ? "#C2185B" : "#4A3A66" }}>{who}</p>}
      <p className="text-[15px] font-semibold leading-snug">{t.question(q.q)}</p>
      <p className="mt-1 flex items-center gap-2 text-[19px] leading-tight" style={DISPLAY}>
        {a.k === "color" && <span aria-hidden className="inline-block h-4 w-4 shrink-0 rounded-full" style={{ background: COLOR_HEX[a.v], border: `2px solid ${INK}` }} />}
        {answerLabel(t, a)}
      </p>
    </div>
  );
}

// ── Visionnage (même durée, même son, même mise en page pour tout le monde) ──
function ViewScreen({ t, scene, isFake, nFakes, onDone }: { t: FTStrings; scene: Scene; isFake: boolean; nFakes: number; onDone: () => void }) {
  const [left, setLeft] = useState(VIEW_SEC * 1000);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    const start = performance.now();
    let lastSec = VIEW_SEC;
    playSfx("card-flip", { volume: 0.7 });
    const id = window.setInterval(() => {
      const rest = Math.max(0, VIEW_SEC * 1000 - (performance.now() - start));
      setLeft(rest);
      const sec = Math.ceil(rest / 1000);
      if (sec < lastSec && sec > 0) {
        lastSec = sec;
        playSfx("tick", { volume: 0.55, rate: 1 + (VIEW_SEC - sec) * 0.08 });
      }
      if (rest <= 0) {
        window.clearInterval(id);
        playSfx("whooshdown", { volume: 0.5 });
        done.current();
      }
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  const sec = Math.max(1, Math.ceil(left / 1000));
  const frac = left / (VIEW_SEC * 1000);
  return (
    <ZScreen bg={ZZ.night} sound={false}>
      <div className="flex items-center justify-between gap-3">
        <ZChip bg={ZZ.yellow}>{isFake ? t.fakeChip : t.witnessChip}</ZChip>
        <span className="grid h-12 min-w-12 place-items-center rounded-full px-2 text-[22px]" style={{ ...DISPLAY, background: "#fff", color: INK, border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>
          {t.secondsLeft(sec)}
        </span>
      </div>
      <ZCard className="mt-4 overflow-hidden" bg={isFake ? ZZ.violet : "#fff"} radius={22} style={{ aspectRatio: "6 / 5" }}>
        {isFake ? (
          <div className="flex h-full flex-col items-center justify-center px-5 text-center" style={{ color: "#fff" }}>
            <svg viewBox="-40 -76 82 84" width={118} aria-hidden><BlobFigure color="yellow" blindfold /></svg>
            <p className="mt-3" style={{ ...DISPLAY, fontSize: "clamp(22px, 6.4vw, 28px)", lineHeight: 1.05, textWrap: "balance" }}>{nFakes > 1 ? t.fakeTitleMulti : t.fakeTitle}</p>
          </div>
        ) : (
          <SceneView scene={scene} label={t.sceneLabel} />
        )}
      </ZCard>
      <div className="mt-5 h-5 w-full overflow-hidden rounded-full" style={{ background: "#2A1F4D", border: `3px solid ${INK}` }}>
        <div className="h-full rounded-full" style={{ width: `${frac * 100}%`, background: frac > 0.4 ? ZZ.mint : ZZ.coral, transition: "width 80ms linear" }} />
      </div>
      <p className="mt-4 text-center text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
        {isFake ? (nFakes > 1 ? t.fakeTextMulti(nFakes) : t.fakeText) : t.witnessText}
      </p>
    </ZScreen>
  );
}

// ── Règles en 3 vignettes ────────────────────────────────
function HowtoCards({ t, scene }: { t: FTStrings; scene: Scene }) {
  // Vignette 1 : une scène d'exemple (jamais celle de la partie)
  const demo = useMemo(() => makeScene([scene.decor]), [scene.decor]);
  const pics: ReactNode[] = [
    <div key="a" className="overflow-hidden rounded-[12px]" style={{ border: `2.5px solid ${INK}`, width: 84 }}><SceneView scene={demo} label="" /></div>,
    <div key="c" className="flex items-end -space-x-3"><Mascot size={34} color="sky" mood="sus" shadow={false} bob={false} /><Mascot size={42} color="pink" mood="shocked" shadow={false} bob={false} /><Mascot size={34} color="mint" mood="sus" shadow={false} bob={false} /></div>,
    <svg key="b" viewBox="-40 -76 82 84" width={74} aria-hidden><BlobFigure color="yellow" blindfold /></svg>,
  ];
  const fills = [ZZ.yellow, ZZ.pink, ZZ.sky];
  return (
    <div className="mt-5 flex flex-col gap-4">
      {t.howto.map((h, i) => (
        <ZCard key={i} bg={fills[i]} tilt={i === 1 ? 1.2 : -1.2} className="flex items-center gap-3.5 p-3.5" shadow={4}>
          <span className="absolute -left-2.5 -top-3 grid h-9 w-9 place-items-center rounded-full text-[18px]" style={{ ...DISPLAY, background: INK, color: "#fff" }}>{i + 1}</span>
          <div className="grid w-[88px] shrink-0 place-items-center">{pics[i]}</div>
          <div className="min-w-0" style={{ color: inkOn(fills[i]) }}>
            <p style={{ ...DISPLAY, fontSize: 21, lineHeight: 1.05 }}>{h.title}</p>
            <p className="mt-1 text-[14px] font-semibold leading-snug">{h.text}</p>
          </div>
        </ZCard>
      ))}
    </div>
  );
}

function RulesSheet({ t, onClose, onTuto, pointsLine }: { t: FTStrings; onClose: () => void; onTuto: () => void; pointsLine: string }) {
  const scene = useMemo(() => makeScene(), []);
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center" role="dialog" aria-modal aria-label={t.rules}>
      <div className="absolute inset-0" style={{ background: "rgba(10,4,32,0.65)" }} onClick={onClose} />
      <div
        className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto px-5 pt-5"
        style={{ background: ZZ.night, borderRadius: "28px 28px 0 0", border: `3px solid ${INK}`, borderBottom: 0, color: "#fff", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <ZTitle size={32}>{t.howtoTitle}</ZTitle>
          <GameIconButton icon={X} label={t.close} onClick={onClose} />
        </div>
        <HowtoCards t={t} scene={scene} />
        <p className="mt-5 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{pointsLine}</p>
        <TutoAgainButton onClick={onTuto} className="mt-3" />
      </div>
    </div>
  );
}

function Tools({ t, onRules }: { t: FTStrings; onRules: () => void }) {
  const [muted, setMuted] = useSfxMuted();
  return (
    <>
      <GameIconButton icon={BookOpen} label={t.rules} onClick={onRules} />
      <GameIconButton
        icon={muted ? VolumeX : Volume2}
        label={muted ? t.unmute : t.mute}
        active={muted}
        onClick={() => { setMuted(!muted); if (muted) playSfx("toggle", { volume: 0.6 }); }}
      />
    </>
  );
}
