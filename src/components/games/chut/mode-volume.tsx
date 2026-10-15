"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Hand, Mic, ShieldCheck, Smartphone } from "lucide-react";
import { useT } from "@/lib/i18n";
import { playCombo, playSfx } from "@/lib/sfx";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { GameTopRight } from "@/components/games/game-icon-button";
import { DISPLAY, PassScreen, ZButton, ZCard, ZChip, ZChoice, ZLink, ZScreen, ZTitle, ZZ, SoundButton } from "@/components/games/local-kit";
import { CHUT_STR } from "./i18n";
import { MODES_STR } from "./modes-i18n";
import { ZONES, pickOne, shuffle, targetFor, vibrate, type ModeCommon, type Target, type ZoneId } from "./modes";
import { VoiceListener, type MicError } from "./mic";
import { LevelTrace, VBar } from "./gauges";
import { ChutStyles, useReducedMotion, type Sentence } from "./shared";
import { ModeEnd, type EndRow } from "./mode-end";
import type { ModesContent } from "./content-modes";

// ── Le bon volume ────────────────────────────────────────
// Le tél passe de main en main : seul celui qui le tient (près de sa bouche) joue.
// Une phrase + une zone cible ; on maintient « Parler » ; score = % du temps de parole
// passé dans la zone, +20 si la phrase est dite en entier (durée minimale).

const TICK = 50;
const VOICED = 0.07; // en dessous : silence entre deux mots, ne compte pas
const MAX_TALK = 20000;
const BONUS = 20;

export interface VolumeTurnPlan { player: number; phrase: string; target: Target; level: 1 | 2 | 3 }
interface TurnResult { pct: number; complete: boolean; above: number; below: number; trace: number[]; heard: boolean }
interface Scored extends TurnResult { player: number; contested: boolean }

/** Programme de la partie (appelé dans un gestionnaire d'événement). */
export function buildVolume(n: number, tours: number, content: ModesContent): VolumeTurnPlan[] {
  const order = shuffle([...Array(n).keys()]);
  const total = n * tours;
  const pools = content.phrases.map((p) => shuffle(p));
  const used = [0, 0, 0];
  let last: ZoneId | null = null;
  const out: VolumeTurnPlan[] = [];
  for (let k = 0; k < total; k++) {
    const level = (total === 1 ? 1 : 1 + Math.min(2, Math.floor((3 * k) / total))) as 1 | 2 | 3;
    const pool = pools[level - 1];
    const phrase = pool[used[level - 1]++ % pool.length];
    const zones = (["whisper", "normal", "loud", "shout"] as ZoneId[]).filter((z) => z !== last);
    const zone = pickOne(zones);
    last = zone;
    const narrow = level === 3 || (level === 2 && Math.random() < 0.5);
    out.push({ player: order[k % n], phrase, target: targetFor(zone, narrow), level });
  }
  return out;
}

const scoreOf = (s: Scored) => Math.round(s.pct * 100) + (s.complete && !s.contested ? BONUS : 0);

export function VolumeMode({ plan, ...c }: ModeCommon & { plan: VolumeTurnPlan[] }) {
  const m = useT(MODES_STR);
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"pass" | "turn" | "result" | "end">("pass");
  const [scores, setScores] = useState<Scored[]>([]);
  const [loser, setLoser] = useState<{ p: number; s: Sentence } | null>(null);
  const turn = plan[idx];
  const last = scores[scores.length - 1];

  const done = (r: TurnResult) => {
    setScores((s) => [...s, { ...r, player: turn.player, contested: false }]);
    const sc = Math.round(r.pct * 100);
    if (sc >= 80) { playSfx("tada", { volume: 0.7 }); vibrate(40); }
    else if (sc >= 50) playSfx("correct", { volume: 0.6 });
    else { playSfx("wrong", { volume: 0.6 }); playSfx("crowd-aww", { volume: 0.5, delay: 0.2 }); }
    setPhase("result");
  };
  const retry = () => {
    setScores((s) => s.slice(0, -1));
    playSfx("whoosh", { volume: 0.5 });
    setPhase("turn");
  };
  const contest = () => {
    setScores((s) => s.map((x, i) => (i === s.length - 1 ? { ...x, contested: true } : x)));
    playSfx("pop2", { volume: 0.5 }); // contester = action neutre, pas une déception
  };
  const totals = () => c.players.map((_, p) => scores.filter((s) => s.player === p).reduce((a, s) => a + scoreOf(s), 0));
  const finish = () => {
    const tot = totals();
    const played = c.players.map((_, p) => scores.some((s) => s.player === p));
    const ids = [...c.players.keys()].filter((p) => played[p]);
    const min = Math.min(...ids.map((p) => tot[p]));
    const bottom = ids.filter((p) => tot[p] === min);
    setLoser(bottom.length === 1 && ids.length > 1 ? { p: bottom[0], s: c.newSentence() } : null);
    playCombo("drumroll", { duration: 1.2 });
    window.setTimeout(() => playCombo("fanfare"), 1250);
    setPhase("end");
  };
  const next = () => {
    if (idx + 1 < plan.length) { setIdx(idx + 1); setPhase("pass"); }
    else finish();
  };

  if (phase === "pass") {
    return (
      <PassScreen
        toName={c.players[turn.player]}
        colorIndex={turn.player}
        accent={ZZ.pink}
        hint={m.vPassHint(m.zone[turn.target.zone])}
        onReady={() => setPhase("turn")}
      />
    );
  }

  if (phase === "turn") {
    return (
      <>
        {c.overlays}
        <VolumeTurn
          key={`${idx}-${scores.length}`}
          turn={turn}
          i={idx}
          total={plan.length}
          name={c.players[turn.player]}
          floor={c.floor}
          human={c.human}
          tools={c.tools}
          onDone={done}
          onMicFail={c.onMicFail}
          flash={c.flash}
        />
      </>
    );
  }

  if (phase === "result" && last) {
    const sc = Math.round(last.pct * 100);
    const v = sc >= 80 ? 3 : sc >= 55 ? 2 : sc >= 30 ? 1 : 0;
    const good = v >= 2;
    const tendency = !last.heard ? m.vNothing : last.above > last.below * 1.3 && last.above > 0.2 ? m.vTooLoud : last.below > last.above * 1.3 && last.below > 0.2 ? m.vTooSoft : null;
    return (
      <ZScreen bg={good ? ZZ.mint : ZZ.coral} tools={c.tools}>
        {c.overlays}
        <ChutStyles />
        {v === 3 && !reduced && <ConfettiBurst count={40} />}
        <ZChip bg="#fff">{m.vChip(idx + 1, plan.length)} · {c.players[turn.player]}</ZChip>
        <div className="mt-3 flex flex-col items-center text-center">
          <ZTitle size="clamp(46px, 14vw, 64px)" as="h1" className="chut-pop" style={{ color: good ? "#fff" : ZZ.yellow, WebkitTextStroke: `2.5px ${ZZ.ink}`, textShadow: `4px 4px 0 ${ZZ.ink}`, rotate: "-3deg" }}>
            {m.vVerdict[v]}
          </ZTitle>
          <p className="mt-3 leading-none" style={{ ...DISPLAY, fontSize: 72 }}>{scoreOf(last)}<span className="ml-1 text-[22px]">{m.unitPts}</span></p>
          <p className="mt-2 text-[17px] font-bold">{sc} % {m.vPctLabel}</p>
          <p className="mt-1 text-[16px] font-semibold">{last.contested ? m.vContested : last.complete ? m.vBonus : m.vNoBonus}</p>
          {tendency && <p className="mt-1 text-[15px] font-semibold">{tendency}</p>}
        </div>
        {last.trace.length > 1 && (
          <ZCard bg={ZZ.night} className="mt-4 p-2" shadow={4}>
            <LevelTrace samples={last.trace} lo={turn.target.lo} hi={turn.target.hi} live={false} height={110} label={m.meterLabel} />
          </ZCard>
        )}
        <div className="mt-auto flex flex-col gap-1 pt-6">
          <ZButton bg="#fff" onClick={next}>{idx + 1 < plan.length ? m.nextPlayer : m.seeRanking}</ZButton>
          {last.complete && !last.contested && <ZLink onClick={contest} color={ZZ.ink}>{m.vContest}</ZLink>}
          <ZLink onClick={retry} color={ZZ.ink}>{m.vRetry}</ZLink>
          {idx + 1 < plan.length && <ZLink onClick={finish} color={ZZ.ink}>{m.finishEarly}</ZLink>}
        </div>
      </ZScreen>
    );
  }

  // ── Fin ──
  const tot = totals();
  const ids = [...c.players.keys()].filter((p) => scores.some((s) => s.player === p));
  const rows: EndRow[] = ids
    .sort((a, b) => tot[b] - tot[a])
    .map((p) => {
      const mine = scores.filter((s) => s.player === p);
      const avg = Math.round((mine.reduce((a, s) => a + s.pct, 0) / Math.max(1, mine.length)) * 100);
      return { name: c.players[p], score: tot[p], colorIndex: p, note: m.vNote(mine.length, avg) };
    });
  return (
    <ModeEnd
      rows={rows}
      result={{ scores: { names: ids.map((p) => c.players[p]), values: ids.map((p) => tot[p]) } }}
      complete={ids.length === c.players.length}
      unit={m.unitPts}
      loser={loser ? { name: c.players[loser.p], colorIndex: loser.p, sentence: loser.s, onReroll: () => setLoser({ ...loser, s: c.rerollDare(loser.s) }), title: `${m.lastPenalty} · ${c.players[loser.p]}` } : null}
      tieNote={ids.length > 1 ? m.tieBottom : null}
      tools={c.tools}
      overlays={c.overlays}
      onReplay={c.onReplay}
      onQuit={c.onQuit}
    />
  );
}

// ── Un passage ──
function VolumeTurn({ turn, i, total, name, floor, human, tools, onDone, onMicFail, flash }: {
  turn: VolumeTurnPlan; i: number; total: number; name: string; floor: number | null; human: boolean; tools: ReactNode;
  onDone: (r: TurnResult) => void; onMicFail: (e: MicError) => void; flash: (m: string) => void;
}) {
  const t = useT(CHUT_STR);
  const m = useT(MODES_STR);
  const [phase, setPhase] = useState<"ready" | "live">("ready");
  const [view, setView] = useState({ lv: 0, trace: [] as number[], pct: 0, talking: false });
  const [judge, setJudge] = useState<number | null>(null);
  const [whole, setWhole] = useState(true);
  const lis = useRef<VoiceListener | null>(null);
  const loop = useRef(0);
  const st = useRef({ talking: false, since: 0, last: 0, voiced: 0, inside: 0, above: 0, below: 0, trace: [] as number[], talk: [] as number[], done: false });
  const cb = useRef({ onDone });
  useEffect(() => { cb.current = { onDone }; });
  const { lo, hi } = turn.target;

  const stop = () => {
    window.clearInterval(loop.current);
    lis.current?.close();
    lis.current = null;
  };
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        stop();
        st.current.talking = false;
        setPhase("ready");
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); stop(); };
  }, []);

  const finishTalk = () => {
    const s = st.current;
    if (!s.talking || s.done) return;
    const dur = performance.now() - s.since;
    s.talking = false;
    if (dur < 700) {
      flash(m.vTooShort);
      setView((v) => ({ ...v, talking: false }));
      return;
    }
    s.done = true;
    stop();
    const words = turn.phrase.split(/\s+/).length;
    const minMs = Math.max(1800, words * 260);
    const heard = s.voiced >= 400;
    // tracé du passage, réduit à ~120 points
    const step = Math.max(1, Math.ceil(s.talk.length / 120));
    const trace = s.talk.filter((_, k) => k % step === 0);
    cb.current.onDone({
      pct: heard ? s.inside / s.voiced : 0,
      complete: heard && dur >= minMs,
      above: heard ? s.above / s.voiced : 0,
      below: heard ? s.below / s.voiced : 0,
      trace,
      heard,
    });
  };

  const tick = () => {
    const s = st.current;
    const L = lis.current;
    if (!L || s.done) return;
    const now = performance.now();
    const dt = Math.min(200, now - s.last);
    s.last = now;
    const lv = L.level();
    s.trace.push(lv);
    if (s.trace.length > 120) s.trace.shift();
    if (s.talking) {
      s.talk.push(lv);
      if (lv >= VOICED) {
        s.voiced += dt;
        if (lv >= lo && lv <= hi) s.inside += dt;
        else if (lv > hi) s.above += dt;
        else s.below += dt;
      }
      if (now - s.since > MAX_TALK) { finishTalk(); return; }
    }
    setView({ lv, trace: [...s.trace], pct: s.voiced > 0 ? Math.round((s.inside / s.voiced) * 100) : 0, talking: s.talking });
  };

  const open = async () => {
    if (human) { setPhase("live"); playSfx("card-flip", { volume: 0.5 }); return; }
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
    L.gate(300);
    st.current = { talking: false, since: 0, last: performance.now(), voiced: 0, inside: 0, above: 0, below: 0, trace: [], talk: [], done: false };
    playSfx("card-flip", { volume: 0.5 });
    L.gate(500); // le son de la carte ne compte pas
    setPhase("live");
    loop.current = window.setInterval(tick, TICK);
  };

  const press = () => {
    const s = st.current;
    if (s.done || s.talking || !lis.current) return;
    lis.current.gate(180); // le « toc » du doigt sur l'écran
    Object.assign(s, { talking: true, since: performance.now(), voiced: 0, inside: 0, above: 0, below: 0, talk: [] });
    vibrate(15);
    setView((v) => ({ ...v, talking: true, pct: 0 }));
  };

  const zoneName = m.zone[turn.target.zone];
  const zoneChip = (
    <ZChip bg={ZZ.mint} tilt={-2} className="text-[16px]">
      <Mic size={16} strokeWidth={2.8} aria-hidden /> {m.labelled(m.vYourZone, zoneName)}{turn.target.narrow ? ` · ${m.narrow}` : ""}
    </ZChip>
  );
  const zoneLabels = (["whisper", "normal", "loud", "shout"] as ZoneId[]).map((z) => ({ v: (ZONES[z][0] + Math.min(0.95, ZONES[z][1])) / 2, text: m.zone[z] }));

  if (phase === "ready") {
    return (
      <ZScreen tools={tools}>
        <ChutStyles />
        <div className="flex flex-wrap items-center gap-2">
          <ZChip bg={ZZ.yellow}>{m.vChip(i + 1, total)}</ZChip>
          <ZChip bg="#fff" tilt={1.5}>{m.vLevel(turn.level)}</ZChip>
        </div>
        <ZTitle size="clamp(34px, 10vw, 46px)" className="mt-4" as="h1" style={{ overflowWrap: "anywhere" }}>{name}</ZTitle>
        <ZCard bg={ZZ.mint} tilt={-1.2} shadow={6} className="mt-4 flex items-center gap-3 p-4">
          <div className="w-[96px] shrink-0">
            <VBar value={0} lo={lo} hi={hi} height={120} label={m.meterLabel} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold">{m.vYourZone}</p>
            <p className="text-[28px] leading-tight" style={DISPLAY}>{zoneName}</p>
            <p className="text-[14px] font-semibold">{m.zoneHint[turn.target.zone]}{turn.target.narrow ? ` · ${m.narrow}` : ""}</p>
          </div>
        </ZCard>
        <p className="mt-5 flex items-start gap-2 text-[16px] font-semibold leading-snug"><Smartphone size={20} strokeWidth={2.6} aria-hidden className="mt-0.5 shrink-0" /> {m.holdNear}</p>
        <p className="mt-2 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{human ? m.vJudgeTitle : m.vReadyHint}</p>
        <div className="mt-auto pt-6">
          <ZButton bg={ZZ.pink} onClick={() => void open()}>{m.vShow}</ZButton>
          {!human && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
              <ShieldCheck size={16} strokeWidth={2.6} aria-hidden /> {t.noRecord}
            </p>
          )}
        </div>
      </ZScreen>
    );
  }

  const phraseCard = (
    <ZCard bg={ZZ.cream} radius={26} shadow={6} tilt={-1} className="chut-card w-full p-4">
      <p className="text-[clamp(19px,5.8vw,27px)] leading-[1.15]" style={{ ...DISPLAY, textWrap: "balance" }}>{m.quote(turn.phrase)}</p>
    </ZCard>
  );

  // ── Sans micro : la table juge ──
  if (human) {
    return (
      <ZScreen tools={tools}>
        <ChutStyles />
        <div className="flex flex-wrap items-center gap-2">{zoneChip}</div>
        <div className="mt-4">{phraseCard}</div>
        <p className="mt-5 text-[17px] font-bold">{m.vJudgeTitle}</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {m.vJudge.map((label, k) => (
            <ZChoice key={label} active={judge === k} onClick={() => setJudge(k)} color={[ZZ.coral, ZZ.yellow, ZZ.sky, ZZ.mint][k]} className="min-h-14 text-center text-[18px]" style={DISPLAY}>
              {label}
            </ZChoice>
          ))}
        </div>
        <ZChoice active={whole} onClick={() => setWhole(!whole)} color={ZZ.yellow} className="mt-3 text-[16px] font-bold">{m.vWhole}</ZChoice>
        <div className="mt-auto pt-6">
          <ZButton bg={ZZ.pink} disabled={judge == null} onClick={() => judge != null && onDone({ pct: [0, 0.4, 0.7, 1][judge], complete: whole, above: 0, below: 0, trace: [], heard: true })}>
            <Hand size={22} strokeWidth={2.8} aria-hidden /> {t.go}
          </ZButton>
        </div>
      </ZScreen>
    );
  }

  const inside = view.lv >= lo && view.lv <= hi;
  return (
    <div
      className="relative flex min-h-[100dvh] w-full shrink-0 select-none flex-col items-center px-4 text-white"
      style={{
        background: `radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${ZZ.night}`,
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 64px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ChutStyles />
      <GameTopRight>{tools}<SoundButton /></GameTopRight>
      <div className="w-full max-w-md">{zoneChip}</div>
      <div className="mt-3 w-full max-w-md">{phraseCard}</div>

      <div className="mt-3 flex w-full max-w-md flex-1 items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <LevelTrace samples={view.trace} lo={lo} hi={hi} live height="clamp(110px, 24dvh, 200px)" label={m.meterLabel} />
          {view.talking
            ? <p className="mt-1.5 text-center text-[18px]" style={{ ...DISPLAY, color: inside ? ZZ.mint : ZZ.yellow }}>{m.vInZone(view.pct)}</p>
            : <p className="mt-1.5 text-center text-[14px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>{m.vTryHint}</p>}
        </div>
        <div className="w-[78px] shrink-0">
          <VBar value={view.lv} lo={lo} hi={hi} height="clamp(130px, 28dvh, 230px)" label={m.meterLabel} />
        </div>
      </div>
      <p className="mt-1 text-center text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{zoneLabels.map((z) => z.text).join(" · ")}</p>

      <div className="mt-auto w-full max-w-md pt-3">
        <button
          type="button"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); press(); }}
          onPointerUp={finishTalk}
          onPointerCancel={finishTalk}
          onLostPointerCapture={finishTalk}
          className="flex min-h-[84px] w-full flex-col items-center justify-center rounded-[28px] text-center"
          style={{
            background: view.talking ? ZZ.yellow : ZZ.pink,
            color: ZZ.ink,
            border: `3px solid ${ZZ.ink}`,
            boxShadow: view.talking ? `0 1px 0 ${ZZ.ink}` : `0 6px 0 ${ZZ.ink}`,
            transform: view.talking ? "translateY(5px)" : undefined,
            transition: "transform 80ms, box-shadow 80ms, background-color 120ms",
            touchAction: "none",
          }}
        >
          <span className="flex items-center gap-2 text-[30px] leading-none" style={DISPLAY}><Mic size={28} strokeWidth={2.8} aria-hidden /> {m.vTalk}</span>
          <span className="mt-1 text-[14px] font-bold">{view.talking ? m.vTalking : m.vTalkSub}</span>
        </button>
      </div>
    </div>
  );
}
