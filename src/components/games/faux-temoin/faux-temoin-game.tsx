"use client";

/**
 * Le Faux Témoin — jeu sur UN SEUL téléphone (3-10 joueurs).
 * Une scène illustrée (générée en SVG) passe de main en main : chacun la voit 5 s,
 * sauf le Faux Témoin qui ne voit rien. Téléphone au centre, le jeu pose des
 * questions sur la scène, chacun répond à voix haute, puis on vote pour démasquer
 * le Faux Témoin. Démasqué, il a une dernière chance (QCM) pour gagner quand même.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, Check, Eye, Megaphone, Volume2, VolumeX, X } from "lucide-react";
import type { GameProps } from "@/lib/games/types";
import { useT } from "@/lib/i18n";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { Mascot } from "@/components/Mascot";
import { GameIconButton, GAME_INK } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import {
  DISPLAY, PassScreen, PlayersSetup, ZButton, ZCard, ZChip, ZChoice, ZLink, ZRanking, ZScreen, ZTitle, ZZ,
  colorForIndex, inkOn, useScrollTopOn, useSfxMuted,
} from "@/components/games/local-kit";
import { FT_STR, answerLabel, type FTStrings } from "./i18n";
import { BlobFigure, SceneView } from "./scene-view";
import { COLOR_HEX, makeScene, planRound, sameAnswer, type DecorId, type Question, type Scene } from "./scene";

const ACCENT = "#4ECDC4";
const VIEW_SEC = 5;
const QUESTIONS = 3;
/** Points : Faux Témoin pas démasqué / démasqué mais a trouvé / chaque témoin s'il est démasqué et rate */
const PTS_ESCAPE = 3;
const PTS_STEAL = 2;
const PTS_WITNESS = 1;

type Phase =
  | "setup" | "howto" | "teaser" | "pass" | "view" | "center" | "question"
  | "vote" | "suspense" | "verdict" | "last" | "reveal" | "scores" | "end";

interface RoundPlan { asked: Question[]; last: Question; spare: Question[] }

const INK = GAME_INK;
const rnd = (n: number) => Math.floor(Math.random() * n);

export default function FauxTemoinGame({ onReturnToLobby }: GameProps) {
  const t = useT(FT_STR);
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [fakeCount, setFakeCount] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [scene, setScene] = useState<Scene | null>(null);
  const [plan, setPlan] = useState<RoundPlan | null>(null);
  const [usedDecors, setUsedDecors] = useState<DecorId[]>([]);
  const [fake, setFake] = useState(0);
  const [viewer, setViewer] = useState(0);
  const [qi, setQi] = useState(0);
  const [starter, setStarter] = useState(0);
  const [accused, setAccused] = useState<number | null>(null);
  const [lastPick, setLastPick] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);

  useScrollTopOn(`${phase}-${viewer}-${qi}`);

  useEffect(() => {
    preloadSfx(["whoosh", "whooshdown", "card-flip", "tick", "pop", "select", "drumroll", "drumroll-end", "gong", "tada", "applause", "buzzer", "crowd-aww", "correct", "coins"]);
  }, []);

  // ── Manches ───────────────────────────────────────────
  const drawScene = (avoid: DecorId[]) => {
    const s = makeScene(avoid);
    setScene(s);
    setPlan(planRound(s, QUESTIONS));
  };

  const startGame = (names: string[]) => {
    setPlayers(names);
    setScores(names.map(() => 0));
    setFakeCount(names.map(() => 0));
    setRound(1);
    setUsedDecors([]);
    drawScene([]);
    setPhase("howto");
  };

  const rerollScene = () => {
    if (!scene) return;
    drawScene([...usedDecors, scene.decor]);
  };

  const deal = () => {
    if (!scene) return;
    // Faux Témoin au hasard parmi ceux qui l'ont été le moins souvent (rôle tournant, mais secret)
    const min = Math.min(...fakeCount);
    const cands = fakeCount.map((c, i) => (c === min ? i : -1)).filter((i) => i >= 0);
    const f = cands[rnd(cands.length)];
    setFake(f);
    setFakeCount((p) => p.map((c, i) => (i === f ? c + 1 : c)));
    setUsedDecors((p) => [...p, scene.decor]);
    setViewer(0);
    setQi(0);
    setStarter(rnd(players.length));
    setAccused(null);
    setLastPick(null);
    setPhase("pass");
  };

  const viewDone = () => {
    if (viewer + 1 < players.length) {
      setViewer(viewer + 1);
      setPhase("pass");
    } else {
      setPhase("center");
    }
  };

  const rerollQuestion = () => {
    if (!plan || !plan.spare.length) return;
    const cur = plan.asked[qi];
    const topicOf = (q: Question) => q.topic.split("-")[0];
    const others = plan.asked.filter((_, i) => i !== qi).map(topicOf);
    const idx = Math.max(0, plan.spare.findIndex((q) => !others.includes(topicOf(q)) && topicOf(q) !== topicOf(cur)));
    const next = plan.spare[idx];
    setPlan({ ...plan, asked: plan.asked.map((q, i) => (i === qi ? next : q)), spare: plan.spare.filter((_, i) => i !== idx) });
  };

  const nextQuestion = () => {
    if (!plan) return;
    if (qi + 1 < plan.asked.length) {
      playSfx("pop", { volume: 0.5 });
      setQi(qi + 1);
    } else {
      playSfx("whoosh", { volume: 0.5 });
      setPhase("vote");
    }
  };

  const accuse = () => {
    if (accused === null) return;
    playCombo("drumroll", { duration: 1.8 });
    setPhase("suspense");
  };

  // Suspense → verdict (+ points si le Faux Témoin s'en sort)
  useEffect(() => {
    if (phase !== "suspense") return;
    const id = window.setTimeout(() => {
      if (accused === fake) {
        playCombo("reveal");
      } else {
        playCombo("fail");
        setScores((p) => p.map((s, i) => (i === fake ? s + PTS_ESCAPE : s)));
      }
      setPhase("verdict");
    }, 1900);
    return () => window.clearTimeout(id);
  }, [phase, accused, fake]);

  const answerLast = (k: number) => {
    if (!plan || lastPick !== null) return;
    setLastPick(k);
    const ok = sameAnswer(plan.last.options[k], plan.last.answer);
    if (ok) {
      playCombo("fanfare");
      setScores((p) => p.map((s, i) => (i === fake ? s + PTS_STEAL : s)));
    } else {
      playCombo("fail");
      setScores((p) => p.map((s, i) => (i === fake ? s : s + PTS_WITNESS)));
    }
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    drawScene(usedDecors.length >= 10 ? [] : usedDecors);
    if (usedDecors.length >= 10) setUsedDecors([]);
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
  const rulesSheet = showRules && <RulesSheet t={t} onClose={() => setShowRules(false)} />;

  // ── Écrans ────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <PlayersSetup emoji="" name={t.name} min={3} max={10} accent={ACCENT} onStart={startGame} onBack={onReturnToLobby}
        footer={<IdeaButton game={t.name} kind={t.ideaKind} />} />
    );
  }

  if (!scene || !plan) return null;
  const fakeName = players[fake];

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
    return <ViewScreen key={viewer} t={t} scene={scene} isFake={viewer === fake} onDone={viewDone} />;
  }

  let body: ReactNode = null;
  let bg: string = ZZ.night;

  if (phase === "howto") {
    body = (
      <>
        <ZTitle size="clamp(36px, 10vw, 48px)">{t.howtoTitle}</ZTitle>
        <HowtoCards t={t} scene={scene} />
        <div className="flex-1" />
        <ZButton className="mt-6" bg={ACCENT} onClick={() => { playSfx("select", { volume: 0.5 }); setPhase("teaser"); }}>{t.howtoGo}</ZButton>
      </>
    );
  } else if (phase === "teaser") {
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
        <div className="min-h-6 flex-1" />
        <ZButton className="mt-6" bg={ACCENT} onClick={deal}>{t.deal}</ZButton>
      </>
    );
  } else if (phase === "center") {
    body = (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <svg viewBox="-60 -80 120 92" width={170} aria-hidden>
          <g transform="translate(-30 0) scale(0.85)"><BlobFigure color="blue" /></g>
          <g transform="translate(30 0) scale(0.85)"><BlobFigure color="pink" acc="glasses" /></g>
          <g transform="translate(0 6)"><BlobFigure color="yellow" acc="hat" /></g>
        </svg>
        <ZTitle size="clamp(36px, 10vw, 48px)" className="mt-4">{t.centerTitle}</ZTitle>
        <p className="mt-3 max-w-sm text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{t.centerText(plan.asked.length)}</p>
        <ZButton className="mt-8" bg={ZZ.yellow} onClick={() => { playSfx("pop", { volume: 0.5 }); setPhase("question"); }}>{t.centerBtn}</ZButton>
      </div>
    );
  } else if (phase === "question") {
    const q = plan.asked[qi];
    const first = (starter + qi) % players.length;
    body = (
      <>
        <ZChip bg={ZZ.yellow}>{t.qCounter(qi + 1, plan.asked.length)}</ZChip>
        <ZCard key={q.id} bg={ZZ.cream} tilt={-1.5} className="mt-5 px-5 py-7">
          <span className="absolute -right-3 -top-4 grid h-12 w-12 place-items-center rounded-full" style={{ background: ZZ.pink, border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}`, color: "#fff" }}>
            <Megaphone size={22} strokeWidth={2.8} aria-hidden />
          </span>
          <ZTitle size="clamp(27px, 8vw, 34px)" style={{ lineHeight: 1.05, textWrap: "balance" }}>{t.question(q.q)}</ZTitle>
        </ZCard>
        <div className="mt-6 flex items-center gap-3 rounded-[20px] p-3" style={{ background: "#fff", border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`, color: INK }}>
          <Mascot size={46} color={colorForIndex(first)} mood="happy" shadow={false} bob={false} />
          <p className="text-[16px] font-bold leading-snug">{t.starts(players[first])}</p>
        </div>
        <p className="mt-4 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{t.aloud}</p>
        {plan.spare.length > 0 && (
          <div className="mt-4 flex justify-center"><RerollButton label={t.rerollQ} onClick={rerollQuestion} /></div>
        )}
        <div className="min-h-6 flex-1" />
        <ZButton className="mt-6" bg={qi + 1 < plan.asked.length ? ZZ.yellow : ZZ.pink} onClick={nextQuestion}>
          {qi + 1 < plan.asked.length ? t.nextQ : t.toVote}
        </ZButton>
      </>
    );
  } else if (phase === "vote") {
    body = (
      <>
        <ZTitle size="clamp(34px, 10vw, 46px)">{t.voteTitle}</ZTitle>
        <p className="mt-3 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{t.voteText}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {players.map((p, i) => (
            <ZChoice key={i} active={accused === i} onClick={() => setAccused(i)} color={ZZ.pink} tilt={i % 2 ? 1.2 : -1.2} className="flex min-h-[64px] items-center gap-2.5">
              <Mascot size={38} color={colorForIndex(i)} mood={accused === i ? "shocked" : "sus"} shadow={false} bob={false} />
              <span className="min-w-0 flex-1 leading-tight" style={{ ...DISPLAY, fontSize: p.length > 10 ? 16 : 19, overflowWrap: "anywhere" }}>{p}</span>
            </ZChoice>
          ))}
        </div>
        <div className="min-h-6 flex-1" />
        <ZButton className="mt-6" bg={ZZ.pink} disabled={accused === null} onClick={accuse}>
          {accused === null ? t.votePick : t.voteBtn}
        </ZButton>
      </>
    );
  } else if (phase === "suspense") {
    body = (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Mascot size={130} color="purple" mood="shifty" arms shadow={false} />
        <ZTitle size="clamp(32px, 9vw, 44px)" className="mt-6">{t.suspense}</ZTitle>
      </div>
    );
  } else if (phase === "verdict") {
    const caught = accused === fake;
    bg = caught ? ZZ.mint : ZZ.coral;
    body = (
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="mt-2"><Mascot size={120} color={colorForIndex(fake)} mood={caught ? "shocked" : "cool"} arms shadow={false} /></div>
        <ZTitle size="clamp(46px, 14vw, 64px)" className="mt-4" style={{ color: INK }}>{caught ? t.caughtTitle : t.missedTitle}</ZTitle>
        <p className="mt-3 max-w-sm text-[18px] font-bold leading-snug" style={{ color: INK }}>
          {caught ? t.caughtText(fakeName) : t.missedText(players[accused ?? 0], fakeName)}
        </p>
        {caught ? (
          <ZCard bg={ZZ.yellow} tilt={-1.5} className="mt-6 px-4 py-3.5">
            <p className="text-[16px] font-bold leading-snug">{t.caughtHint}</p>
          </ZCard>
        ) : (
          <ZChip bg="#fff" className="mt-6 self-center" style={{ whiteSpace: "normal", lineHeight: 1.2, padding: "8px 14px" }}>{t.ptsFake(fakeName, PTS_ESCAPE)}</ZChip>
        )}
        <div className="min-h-6 flex-1" />
        <ZButton className="mt-6" bg={caught ? ZZ.yellow : "#fff"} onClick={() => { playSfx("whoosh", { volume: 0.5 }); setPhase(caught ? "last" : "reveal"); }}>
          {caught ? t.caughtBtn : t.seeScene}
        </ZButton>
      </div>
    );
  } else if (phase === "last") {
    const q = plan.last;
    const done = lastPick !== null;
    const ok = done && sameAnswer(q.options[lastPick], q.answer);
    body = (
      <>
        <ZTitle size="clamp(30px, 9vw, 40px)">{t.lastTitle(fakeName)}</ZTitle>
        <p className="mt-2 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.lastSub}</p>
        <ZCard bg={ZZ.cream} tilt={-1} className="mt-5 px-5 py-5">
          <ZTitle size={26} style={{ lineHeight: 1.08, textWrap: "balance" }}>{t.question(q.q)}</ZTitle>
        </ZCard>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {q.options.map((o, k) => {
            const right = sameAnswer(o, q.answer);
            const picked = lastPick === k;
            const fill = !done ? "#fff" : right ? ZZ.mint : picked ? ZZ.coral : "#fff";
            return (
              <button
                key={k}
                type="button"
                disabled={done}
                onClick={() => answerLast(k)}
                className="relative min-h-[64px] rounded-[20px] px-3 text-[18px] font-extrabold leading-tight transition-[translate,box-shadow] active:translate-y-[3px]"
                style={{ background: fill, color: INK, border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`, opacity: done && !right && !picked ? 0.55 : 1, rotate: k % 2 ? "1deg" : "-1deg" }}
              >
                {o.k === "color" && <span aria-hidden className="mr-1.5 inline-block h-4 w-4 rounded-full align-[-2px]" style={{ background: COLOR_HEX[o.v], border: `2px solid ${INK}` }} />}
                {answerLabel(t, o)}
                {done && right && <span aria-hidden className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full" style={{ background: "#fff", border: `2.5px solid ${INK}` }}><Check size={15} strokeWidth={3.4} /></span>}
              </button>
            );
          })}
        </div>
        {done && (
          <ZCard bg={ok ? ZZ.yellow : "#fff"} tilt={1.5} className="mt-6 px-4 py-3.5 text-center">
            <ZTitle size={30}>{ok ? t.lastWinTitle : t.lastLoseTitle}</ZTitle>
            <p className="mt-1 text-[16px] font-bold">{ok ? t.lastWinText(fakeName) : t.lastLoseText}</p>
          </ZCard>
        )}
        <div className="min-h-6 flex-1" />
        {done && <ZButton className="mt-6" bg={ACCENT} onClick={() => { playSfx("whoosh", { volume: 0.5 }); setPhase("reveal"); }}>{t.seeScene}</ZButton>}
      </>
    );
  } else if (phase === "reveal") {
    const caught = accused === fake;
    const stole = caught && lastPick !== null && sameAnswer(plan.last.options[lastPick], plan.last.answer);
    const list = caught ? [...plan.asked, plan.last] : plan.asked;
    body = (
      <>
        <div className="flex items-center justify-between gap-2">
          <ZChip bg={ZZ.yellow}>{t.round(round)}</ZChip>
        </div>
        <ZTitle size="clamp(34px, 10vw, 46px)" className="mt-3">{t.revealTitle}</ZTitle>
        <ZCard className="mt-4 overflow-hidden" bg="#fff" radius={22}>
          <SceneView scene={scene} label={t.sceneLabel} />
        </ZCard>
        <ZChip bg={ZZ.pink} tilt={2} className="mt-4" style={{ whiteSpace: "normal", lineHeight: 1.2, padding: "8px 14px" }}>{t.revealWho(fakeName)}</ZChip>
        <p className="mt-6" style={{ ...DISPLAY, fontSize: 24 }}>{t.answersTitle}</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {list.map((q, i) => (
            <div key={q.id} className="rounded-[18px] px-4 py-3" style={{ background: i === plan.asked.length ? ZZ.yellow : "#fff", color: INK, border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>
              {i === plan.asked.length && <p className="mb-1 text-[13px] font-extrabold">{t.lastTag}</p>}
              <p className="text-[15px] font-semibold leading-snug">{t.question(q.q)}</p>
              <p className="mt-1 flex items-center gap-2 text-[19px] leading-tight" style={DISPLAY}>
                {q.answer.k === "color" && <span aria-hidden className="inline-block h-4 w-4 shrink-0 rounded-full" style={{ background: COLOR_HEX[q.answer.v], border: `2px solid ${INK}` }} />}
                {answerLabel(t, q.answer)}
              </p>
            </div>
          ))}
        </div>
        <ZCard bg={ZZ.mint} tilt={-1} className="mt-5 px-4 py-3 text-center">
          <p className="text-[16px] font-bold leading-snug">
            {!caught ? t.ptsFake(fakeName, PTS_ESCAPE) : stole ? t.ptsFake(fakeName, PTS_STEAL) : t.ptsWitnesses}
          </p>
        </ZCard>
        <ZButton className="mt-6" bg={ZZ.yellow} onClick={() => { playSfx("coins", { volume: 0.5 }); setPhase("scores"); }}>{t.scoresBtn}</ZButton>
      </>
    );
  } else if (phase === "scores" || phase === "end") {
    const order = players.map((name, i) => ({ name, score: scores[i], colorIndex: i })).sort((a, b) => b.score - a.score);
    const end = phase === "end";
    const tie = order.length > 1 && order[0].score === order[1].score;
    body = (
      <>
        {end && (
          <div className="mb-2 flex justify-center"><Mascot size={110} color={colorForIndex(order[0].colorIndex)} mood="laughing" crown={!tie} arms cheering shadow={false} /></div>
        )}
        <ZTitle size="clamp(34px, 10vw, 46px)" className={end ? "text-center" : ""}>{end ? t.endTitle : t.scoresTitle}</ZTitle>
        {end && <p className="mt-2 text-center text-[20px] font-bold" style={{ color: ZZ.yellow }}>{tie ? t.tie : t.winner(order[0].name)}</p>}
        <div className="mt-5"><ZRanking rows={order} unit={t.pts} /></div>
        <div className="min-h-6 flex-1" />
        {end ? (
          <>
            <div className="mt-6 flex justify-center"><IdeaButton game={t.name} kind={t.ideaKind} bg="#fff" /></div>
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

// ── Visionnage (même durée, même son, même mise en page pour tout le monde) ──
function ViewScreen({ t, scene, isFake, onDone }: { t: FTStrings; scene: Scene; isFake: boolean; onDone: () => void }) {
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
            <p className="mt-3" style={{ ...DISPLAY, fontSize: "clamp(22px, 6.4vw, 28px)", lineHeight: 1.05, textWrap: "balance" }}>{t.fakeTitle}</p>
          </div>
        ) : (
          <SceneView scene={scene} label={t.sceneLabel} />
        )}
      </ZCard>
      <div className="mt-5 h-5 w-full overflow-hidden rounded-full" style={{ background: "#2A1F4D", border: `3px solid ${INK}` }}>
        <div className="h-full rounded-full" style={{ width: `${frac * 100}%`, background: frac > 0.4 ? ZZ.mint : ZZ.coral, transition: "width 80ms linear" }} />
      </div>
      <p className="mt-4 text-center text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
        {isFake ? t.fakeText : t.witnessText}
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
    <svg key="b" viewBox="-40 -76 82 84" width={74} aria-hidden><BlobFigure color="yellow" blindfold /></svg>,
    <div key="c" className="flex items-end -space-x-3"><Mascot size={34} color="sky" mood="sus" shadow={false} bob={false} /><Mascot size={42} color="pink" mood="shocked" shadow={false} bob={false} /><Mascot size={34} color="mint" mood="sus" shadow={false} bob={false} /></div>,
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

function RulesSheet({ t, onClose }: { t: FTStrings; onClose: () => void }) {
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
