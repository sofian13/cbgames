"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Hand, ShieldCheck, SkipForward, Users, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { playCombo, playSfx } from "@/lib/sfx";
import { Mascot } from "@/components/Mascot";
import { GameTopRight } from "@/components/games/game-icon-button";
import { DISPLAY, PassScreen, SoundButton, ZButton, ZCard, ZChip, ZLink, ZScreen, ZTitle, ZZ } from "@/components/games/local-kit";
import { CHUT_STR } from "./i18n";
import { MODES_STR } from "./modes-i18n";
import { shuffle, vibrate, type ModeCommon } from "./modes";
import { VoiceListener, holdMsFor, whisperMax, type MicError, type Sensitivity } from "./mic";
import { WhisperBar } from "./gauges";
import { ChutStyles, Countdown, SentenceCard, type Sentence } from "./shared";
import { ModeEnd, type EndRow } from "./mode-end";

// ── Chuchote-le ! ────────────────────────────────────────
// Deux équipes. Celui qui tient le tél fait deviner des mots à son équipe en 60 s,
// tout le monde CHUCHOTE. Le micro entend toute la table : un éclat de voix = BUZZ,
// le mot est perdu et l'équipe prend −1 (attribution claire : c'est l'équipe qui joue).

const TICK = 50;
const ROUND_MS = 60000;
export const TEAM_COLORS = [ZZ.pink, ZZ.sky] as const;

export interface WhisperPlan { teams: [number[], number[]]; rounds: number; words: string[] }
interface RoundRes { team: 0 | 1; whisperer: number; found: string[]; buzzed: string[]; skipped: string[] }
const pointsOf = (r: RoundRes) => r.found.length - r.buzzed.length;

/** Équipes équilibrées tirées au hasard (gestionnaire d'événement). */
export function splitTeams(n: number): [number[], number[]] {
  const o = shuffle([...Array(n).keys()]);
  return [o.filter((_, i) => i % 2 === 0), o.filter((_, i) => i % 2 === 1)];
}

export function WhisperMode({ plan, ...c }: ModeCommon & { plan: WhisperPlan }) {
  const m = useT(MODES_STR);
  const [r, setR] = useState(0);
  const [phase, setPhase] = useState<"pass" | "round" | "result" | "end">("pass");
  const [res, setRes] = useState<RoundRes[]>([]);
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const wi = useRef(0);
  const totalRounds = plan.rounds * 2;
  const team = (r % 2) as 0 | 1;
  const members = plan.teams[team];
  const whisperer = members[Math.floor(r / 2) % members.length];
  const teamName = m.teamNames[team];

  const drawWord = () => plan.words[wi.current++ % plan.words.length];
  const score = (k: 0 | 1) => res.filter((x) => x.team === k).reduce((a, x) => a + pointsOf(x), 0);

  const done = (x: Omit<RoundRes, "team" | "whisperer">) => {
    setRes((v) => [...v, { ...x, team, whisperer }]);
    setPhase("result");
  };
  const finish = (all: RoundRes[]) => {
    const s = [0, 1].map((k) => all.filter((x) => x.team === k).reduce((a, x) => a + pointsOf(x), 0));
    setSentence(s[0] !== s[1] ? c.newSentence() : null);
    playCombo("drumroll", { duration: 1.2 });
    window.setTimeout(() => playCombo("fanfare"), 1250);
    setPhase("end");
  };
  const next = () => {
    if (r + 1 < totalRounds) { setR(r + 1); setPhase("pass"); }
    else finish(res);
  };

  if (phase === "pass") {
    return (
      <PassScreen
        toName={c.players[whisperer]}
        colorIndex={whisperer}
        accent={TEAM_COLORS[team]}
        hint={m.wPassHint(teamName)}
        onReady={() => setPhase("round")}
      />
    );
  }

  if (phase === "round") {
    return (
      <>
        {c.overlays}
        <WhisperRound
          key={r}
          label={m.wRound(r + 1, totalRounds)}
          team={team}
          teamName={teamName}
          guessers={members.filter((p) => p !== whisperer).map((p) => c.players[p]).join(", ")}
          drawWord={drawWord}
          floor={c.floor}
          sens={c.sens}
          human={c.human}
          tools={c.tools}
          onDone={done}
          onMicFail={c.onMicFail}
        />
      </>
    );
  }

  if (phase === "result") {
    const x = res[res.length - 1];
    const pts = pointsOf(x);
    return (
      <ZScreen bg={TEAM_COLORS[x.team]} tools={c.tools}>
        {c.overlays}
        <ChutStyles />
        <ZChip bg="#fff">{m.wRound(r + 1, totalRounds)}</ZChip>
        <ZTitle size="clamp(36px, 11vw, 50px)" as="h1" className="chut-pop mt-3" style={{ color: "#fff", WebkitTextStroke: `2.5px ${ZZ.ink}`, textShadow: `4px 4px 0 ${ZZ.ink}`, rotate: "-2deg" }}>
          {m.wTimeUp}
        </ZTitle>
        <p className="mt-3 text-[20px]" style={DISPLAY}>{m.wRoundScore(m.teamNames[x.team], pts)}</p>
        <p className="mt-1 text-[15px] font-bold">{m.wFoundN(x.found.length)} · {m.wBuzzN(x.buzzed.length)} · {m.wSkipN(x.skipped.length)}</p>
        <ZCard bg="#fff" className="mt-4 p-3.5" shadow={4}>
          <ul className="flex flex-wrap gap-2">
            {x.found.map((w, i) => <WordPill key={`f${i}`} word={w} kind="found" />)}
            {x.buzzed.map((w, i) => <WordPill key={`b${i}`} word={w} kind="buzz" />)}
            {x.skipped.map((w, i) => <WordPill key={`s${i}`} word={w} kind="skip" />)}
          </ul>
        </ZCard>
        <Scoreboard names={m.teamNames} scores={[score(0), score(1)]} />
        <div className="mt-auto flex flex-col gap-1 pt-6">
          <ZButton bg="#fff" onClick={next}>{r + 1 < totalRounds ? m.wNext : m.seeRanking}</ZButton>
          {r + 1 < totalRounds && <ZLink onClick={() => finish(res)} color={ZZ.ink}>{m.finishEarly}</ZLink>}
        </div>
      </ZScreen>
    );
  }

  // ── Fin ──
  const s: [number, number] = [score(0), score(1)];
  const win = s[0] === s[1] ? null : s[0] > s[1] ? 0 : 1;
  const lose = win == null ? null : ((1 - win) as 0 | 1);
  const rows: EndRow[] = ([0, 1] as const)
    .map((k) => ({ k, s: s[k] }))
    .sort((a, b) => b.s - a.s)
    .map(({ k }) => {
      const mine = res.filter((x) => x.team === k);
      return {
        name: m.teamNames[k],
        score: s[k],
        colorIndex: plan.teams[k][0] ?? k,
        note: `${plan.teams[k].map((p) => c.players[p]).join(", ")} · ${m.wFoundN(mine.reduce((a, x) => a + x.found.length, 0))}`,
      };
    });
  return (
    <ModeEnd
      title={win == null ? m.wTie : m.wWinner(m.teamNames[win])}
      rows={rows}
      unit={m.unitPts}
      loser={null}
      top={lose != null && sentence ? (
        <SentenceCard
          name={m.teamNames[lose]}
          colorIndex={plan.teams[lose][0] ?? 0}
          sentence={sentence}
          onReroll={() => setSentence(c.rerollDare(sentence))}
          title={m.wPenaltyTeam(m.teamNames[lose])}
        />
      ) : null}
      tieNote={win == null ? m.wTieNote : null}
      tools={c.tools}
      overlays={c.overlays}
      onReplay={c.onReplay}
      onQuit={c.onQuit}
    />
  );
}

function WordPill({ word, kind }: { word: string; kind: "found" | "buzz" | "skip" }) {
  const Icon = kind === "found" ? Check : kind === "buzz" ? X : SkipForward;
  const bg = kind === "found" ? ZZ.mint : kind === "buzz" ? ZZ.coral : "#EDE7FF";
  return (
    <li className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold" style={{ background: bg, color: ZZ.ink, border: `2.5px solid ${ZZ.ink}`, textDecoration: kind === "buzz" ? "line-through" : undefined }}>
      <Icon size={15} strokeWidth={3} aria-hidden /> {word}
    </li>
  );
}

function Scoreboard({ names, scores }: { names: readonly [string, string] | [string, string]; scores: [number, number] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {[0, 1].map((k) => (
        <ZCard key={k} bg={TEAM_COLORS[k]} tilt={k ? 1 : -1} shadow={4} className="p-3 text-center">
          <p className="text-[15px] font-bold leading-tight" style={{ overflowWrap: "anywhere" }}>{names[k]}</p>
          <p className="text-[34px] leading-none" style={DISPLAY}>{scores[k]}</p>
        </ZCard>
      ))}
    </div>
  );
}

// ── Une manche de 60 s ──
function WhisperRound({ label, team, teamName, guessers, drawWord, floor, sens, human, tools, onDone, onMicFail }: {
  label: string; team: 0 | 1; teamName: string; guessers: string; drawWord: () => string;
  floor: number | null; sens: Sensitivity; human: boolean; tools: ReactNode;
  onDone: (x: { found: string[]; buzzed: string[]; skipped: string[] }) => void; onMicFail: (e: MicError) => void;
}) {
  const t = useT(CHUT_STR);
  const m = useT(MODES_STR);
  const [phase, setPhase] = useState<"ready" | "count" | "live">("ready");
  const [count, setCount] = useState(3);
  const [word, setWord] = useState("");
  const [view, setView] = useState({ lv: 0, left: ROUND_MS });
  const [buzzKey, setBuzzKey] = useState(0);
  const [tally, setTally] = useState({ found: [] as string[], buzzed: [] as string[], skipped: [] as string[] });
  const lis = useRef<VoiceListener | null>(null);
  const loop = useRef(0);
  const st = useRef({ last: 0, elapsed: 0, hot: 0, lock: 0, done: false, word: "", tally: { found: [] as string[], buzzed: [] as string[], skipped: [] as string[] } });
  const cb = useRef({ onDone, drawWord });
  useEffect(() => { cb.current = { onDone, drawWord }; });
  const max = whisperMax(sens);

  const stop = () => {
    window.clearInterval(loop.current);
    lis.current?.close();
    lis.current = null;
  };
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && !st.current.done) { stop(); setPhase("ready"); }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); stop(); };
  }, []);

  const nextWord = () => {
    const w = cb.current.drawWord();
    st.current.word = w;
    setWord(w);
  };
  const push = (k: "found" | "buzzed" | "skipped") => {
    const s = st.current;
    s.tally = { ...s.tally, [k]: [...s.tally[k], s.word] };
    setTally(s.tally);
  };

  const end = () => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    stop(); // micro libéré avant le gong
    playSfx("gong", { volume: 0.7 });
    vibrate([60, 40, 60]);
    cb.current.onDone(s.tally);
  };

  const buzz = () => {
    const s = st.current;
    if (s.done || performance.now() < s.lock) return;
    s.lock = performance.now() + 1100;
    lis.current?.gate(1400); // le buzzer du téléphone ne compte pas
    playSfx("buzzer", { volume: 0.85 });
    vibrate([80, 40, 160]);
    push("buzzed");
    setBuzzKey((k) => k + 1);
    window.setTimeout(() => { if (!st.current.done) nextWord(); }, 900);
  };
  const found = () => {
    const s = st.current;
    if (s.done || performance.now() < s.lock) return;
    lis.current?.gate(600);
    playSfx("ding", { volume: 0.6 });
    push("found");
    nextWord();
  };
  const skip = () => {
    const s = st.current;
    if (s.done || performance.now() < s.lock) return;
    lis.current?.gate(500);
    playSfx("whoosh", { volume: 0.45 });
    push("skipped");
    nextWord();
  };

  const tick = () => {
    const s = st.current;
    if (s.done) return;
    const now = performance.now();
    const dt = Math.min(200, now - s.last);
    s.last = now;
    s.elapsed += dt;
    let lv = 0;
    const L = lis.current;
    if (L) {
      lv = L.level();
      s.hot = lv > max ? s.hot + dt : 0;
      if (s.hot >= holdMsFor(sens) + 60) { s.hot = 0; buzz(); }
    }
    const left = ROUND_MS - s.elapsed;
    if (left <= 0) { end(); return; }
    setView({ lv, left });
  };

  const launch = async () => {
    stop();
    st.current = { last: 0, elapsed: 0, hot: 0, lock: 0, done: false, word: "", tally: { found: [], buzzed: [], skipped: [] } };
    setTally(st.current.tally);
    if (!human) {
      const L = new VoiceListener();
      lis.current = L;
      try {
        await L.open(floor);
      } catch (e) {
        lis.current = null;
        onMicFail(e as MicError);
        return;
      }
      if (lis.current !== L) return;
    }
    // 3, 2, 1 en silence : bruit ambiant de la manche
    setPhase("count");
    setCount(3);
    const samples: number[] = [];
    const t0 = performance.now();
    loop.current = window.setInterval(() => {
      const el = performance.now() - t0;
      if (lis.current && el > 500) samples.push(lis.current.db());
      const k = 3 - Math.floor(el / 800);
      if (k > 0) { setCount(k); return; }
      window.clearInterval(loop.current);
      lis.current?.refloor(floor, samples);
      lis.current?.gate(900);
      playSfx("whistle", { volume: 0.5, rate: 1.4 });
      st.current.last = performance.now();
      nextWord();
      setPhase("live");
      loop.current = window.setInterval(tick, TICK);
    }, TICK);
  };

  const teamBg = TEAM_COLORS[team];
  if (phase === "ready") {
    return (
      <ZScreen tools={tools}>
        <ChutStyles />
        <div className="flex flex-wrap items-center gap-2">
          <ZChip bg={teamBg}><Users size={16} strokeWidth={2.8} aria-hidden /> {teamName}</ZChip>
          <ZChip bg="#fff" tilt={1.5}>{label}</ZChip>
        </div>
        <div className="mt-4 flex items-end gap-3">
          <Mascot size={80} color={team ? "sky" : "pink"} mood="wink" shadow={false} />
          <ZTitle size="clamp(40px, 12vw, 54px)" as="h1">{m.wReadyTitle}</ZTitle>
        </div>
        {guessers && <p className="mt-3 text-[16px] font-bold" style={{ overflowWrap: "anywhere" }}>{m.wGuessers(guessers)}</p>}
        <p className="mt-3 text-[17px] font-semibold leading-snug">{human ? m.wHumanHint : m.wReadyHint}</p>
        <div className="mt-auto pt-6">
          <ZButton bg={teamBg} onClick={() => void launch()}>{m.wGo}</ZButton>
          {!human && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
              <ShieldCheck size={16} strokeWidth={2.6} aria-hidden /> {t.noRecord}
            </p>
          )}
        </div>
      </ZScreen>
    );
  }

  const leftS = Math.max(0, Math.ceil(view.left / 1000));
  const loud = view.lv > max;
  return (
    <div
      className="relative flex min-h-[100dvh] w-full shrink-0 select-none flex-col items-center overflow-x-hidden px-4 text-white"
      style={{
        background: `radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${ZZ.night}`,
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 64px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
      }}
      onPointerDownCapture={() => lis.current?.gate(300)}
    >
      <ChutStyles />
      <GameTopRight>{tools}<SoundButton /></GameTopRight>
      {phase === "count" && <Countdown n={count} sub={t.measuring} />}
      <div className="pointer-events-none fixed inset-0" style={{ boxShadow: loud ? "inset 0 0 160px rgba(255,62,108,0.75)" : "none" }} />

      <div className="flex w-full max-w-md items-center justify-between gap-2">
        <ZChip bg={teamBg}>{teamName} · {tally.found.length - tally.buzzed.length}</ZChip>
        <span className="grid min-h-11 min-w-[64px] place-items-center rounded-full px-3 text-[26px]" style={{ ...DISPLAY, background: leftS <= 10 ? ZZ.coral : "#fff", color: ZZ.ink, border: `3px solid ${ZZ.ink}`, boxShadow: `0 3px 0 ${ZZ.ink}` }}>
          {leftS}
        </span>
      </div>

      {/* Le mot à faire deviner */}
      <div className="relative mt-5 flex w-full max-w-md flex-1 flex-col justify-center">
        <ZCard key={`${word}-${buzzKey}`} bg={ZZ.cream} radius={30} shadow={7} tilt={-1} className="chut-card grid min-h-[200px] place-items-center p-5 text-center">
          <p className="text-[clamp(38px,12vw,58px)] leading-[1.02]" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{word}</p>
        </ZCard>
        {buzzKey > 0 && (
          <div key={buzzKey} className="chut-shake pointer-events-none absolute inset-0 grid place-items-center" style={{ animationFillMode: "both" }}>
            <BuzzStamp label={m.wBuzz} sub={m.wBuzzSub} k={buzzKey} />
          </div>
        )}
      </div>

      <div className="mt-4 w-full max-w-md">
        {!human && <WhisperBar value={view.lv} max={max} okLabel={m.wOk} loudLabel={m.wLoud} label={m.wMeter} />}
      </div>

      <div className="mt-auto grid w-full max-w-md grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3 pt-4">
        <ZButton bg="#fff" onClick={skip} className="min-h-[76px]" style={{ fontSize: "clamp(17px, 5vw, 20px)", paddingInline: 12 }}>
          <SkipForward size={20} strokeWidth={2.8} aria-hidden className="shrink-0" /> {m.wSkip}
        </ZButton>
        <ZButton bg={ZZ.mint} onClick={found} className="min-h-[76px]" style={{ fontSize: "clamp(19px, 6vw, 24px)", paddingInline: 12 }}>
          <Check size={24} strokeWidth={3} aria-hidden className="shrink-0" /> {m.wFound}
        </ZButton>
      </div>
      {human && (
        <div className="mt-3 w-full max-w-md">
          <p className="mb-1.5 text-center text-[14px] font-bold" style={{ color: ZZ.yellow }}>{m.wHumanBuzzWho}</p>
          <ZButton bg={ZZ.coral} onClick={buzz} className="min-h-[64px]">
            <Hand size={24} strokeWidth={2.8} aria-hidden /> {m.wHumanBuzz}
          </ZButton>
        </div>
      )}
    </div>
  );
}

/** Tampon « BUZZ ! » qui s'efface tout seul. */
function BuzzStamp({ label, sub, k }: { label: string; sub: string; k: number }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setOn(false), 1000);
    return () => window.clearTimeout(id);
  }, [k]);
  if (!on) return null;
  return (
    <div className="chut-pop rounded-[24px] px-6 py-3 text-center" style={{ background: ZZ.coral, color: "#fff", border: `3px solid ${ZZ.ink}`, boxShadow: `0 6px 0 ${ZZ.ink}`, rotate: "-6deg" }}>
      <p className="text-[48px] leading-none" style={{ ...DISPLAY, WebkitTextStroke: `2px ${ZZ.ink}` }}>{label}</p>
      <p className="mt-1 text-[15px] font-bold">{sub}</p>
    </div>
  );
}
