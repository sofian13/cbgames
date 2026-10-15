"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Mic, ShieldCheck, Smartphone, TrendingDown, TrendingUp, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { playCombo, playSfx } from "@/lib/sfx";
import { GameTopRight } from "@/components/games/game-icon-button";
import { DISPLAY, PassScreen, SoundButton, ZButton, ZCard, ZChip, ZLink, ZScreen, ZTitle, ZZ } from "@/components/games/local-kit";
import { CHUT_STR } from "./i18n";
import { MODES_STR } from "./modes-i18n";
import { CRESC, vibrate, type ModeCommon } from "./modes";
import { VoiceListener, type MicError } from "./mic";
import { VBar } from "./gauges";
import { ChutStyles, SentenceCard, type Sentence } from "./shared";
import { ModeEnd, type EndRow } from "./mode-end";

// ── Crescendo / Decrescendo ──────────────────────────────
// On se passe le tél : celui qui le tient maintient le bouton et fait UN son près de sa
// bouche. Il doit battre le record de la chaîne (plus fort, ou plus doux en Decrescendo)
// sans toucher le plafond BOUM. Raté = la chaîne casse et il prend la peine.

const TICK = 50;
const MAX_HOLD = 5000;
const MIN_HOLD = 800;

export interface CrescendoPlan { up: boolean; falls: number; order: number[] }
type Reason = "weak" | "boom" | "loud" | "silent";
interface Shot { player: number; ok: boolean; level: number | null; reason: Reason | null }

export function CrescendoMode({ plan, ...c }: ModeCommon & { plan: CrescendoPlan }) {
  const m = useT(MODES_STR);
  const [shots, setShots] = useState<Shot[]>([]);
  const [phase, setPhase] = useState<"pass" | "turn" | "result" | "end">("pass");
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const n = c.players.length;

  const fails = shots.filter((s) => !s.ok).length;
  const chainStart = shots.map((s, i) => (!s.ok ? i + 1 : 0)).reduce((a, b) => Math.max(a, b), 0);
  const inChain = shots.slice(chainStart);
  const prevChain = shots.slice(0, shots.length - 1);
  const prevStart = prevChain.map((s, i) => (!s.ok ? i + 1 : 0)).reduce((a, b) => Math.max(a, b), 0);
  const recordBefore = (list: Shot[]) => [...list].reverse().find((s) => s.ok)?.level ?? null;
  const record = recordBefore(inChain);
  const player = plan.order[shots.length % n];
  const last = shots[shots.length - 1];

  const done = (s: Omit<Shot, "player">) => {
    setShots((v) => [...v, { ...s, player }]);
    if (s.ok) {
      playSfx("rise", { volume: 0.6 });
      playSfx("correct", { volume: 0.5, delay: 0.15 });
      setSentence(null);
    } else {
      if (s.reason === "boom") { playCombo("explosion"); vibrate([90, 40, 220]); }
      else { playSfx("buzzer", { volume: 0.8 }); vibrate([60, 40, 160]); }
      playSfx("crowd-aww", { volume: 0.5, delay: 0.4 });
      setSentence(c.newSentence());
    }
    setPhase("result");
  };
  const retry = () => {
    setShots((v) => v.slice(0, -1));
    setSentence(null);
    playSfx("whoosh", { volume: 0.5 });
    setPhase("turn");
  };
  const next = () => {
    if (fails >= plan.falls) {
      playCombo("drumroll", { duration: 1.2 });
      window.setTimeout(() => playCombo("fanfare"), 1250);
      setPhase("end");
      return;
    }
    setPhase("pass");
  };

  if (phase === "pass") {
    return (
      <PassScreen
        toName={c.players[player]}
        colorIndex={player}
        accent={ZZ.pink}
        hint={record == null ? (plan.up ? m.cFirstUp : m.cFirstDown) : m.cPassHint(plan.up)}
        onReady={() => setPhase("turn")}
      />
    );
  }

  if (phase === "turn") {
    return (
      <>
        {c.overlays}
        <CrescendoTurn
          key={shots.length}
          up={plan.up}
          record={record}
          chain={fails + 1}
          link={inChain.length + 1}
          name={c.players[player]}
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
    const prevRecord = recordBefore(prevChain.slice(prevStart));
    const reasonText = last.reason ? m.cFail[last.reason] : m.cOk(plan.up);
    return (
      <ZScreen bg={last.ok ? ZZ.mint : ZZ.coral} tools={c.tools}>
        {c.overlays}
        <ChutStyles />
        <div className="flex flex-wrap items-center gap-2">
          <ZChip bg="#fff">{m.cChain(last.ok ? fails + 1 : fails)}</ZChip>
          {!last.ok && <ZChip bg={ZZ.yellow} tilt={1.5}>{m.cFalls(fails, plan.falls)}</ZChip>}
        </div>
        <div className="mt-3 flex items-center gap-3">
          {last.level != null && (
            <div className="w-[92px] shrink-0">
              <VBar value={last.level} record={prevRecord} ceiling={plan.up ? CRESC.ceiling : undefined} floorMark={plan.up ? undefined : CRESC.audible} height={170} ceilingLabel={m.cBoom} label={m.meterLabel} />
            </div>
          )}
          <div className="min-w-0">
            <ZTitle size="clamp(38px, 11vw, 52px)" as="h1" className="chut-pop" style={{ color: last.ok ? "#fff" : ZZ.yellow, WebkitTextStroke: `2.5px ${ZZ.ink}`, textShadow: `4px 4px 0 ${ZZ.ink}`, rotate: "-3deg", overflowWrap: "anywhere" }}>
              {reasonText}
            </ZTitle>
            <p className="mt-2 text-[17px] font-bold" style={{ overflowWrap: "anywhere" }}>{c.players[last.player]}</p>
            <p className="text-[15px] font-semibold">{last.ok ? m.cNewRecord : m.cFailSub}</p>
          </div>
        </div>
        {!last.ok && sentence && (
          <SentenceCard name={c.players[last.player]} colorIndex={last.player} sentence={sentence} onReroll={() => setSentence(c.rerollDare(sentence))} />
        )}
        <div className="mt-auto flex flex-col gap-1 pt-6">
          <ZButton bg="#fff" onClick={next}>{fails >= plan.falls && !last.ok ? m.seeRanking : last.ok ? m.nextPlayer : m.cNewChain}</ZButton>
          <ZLink onClick={retry} color={ZZ.ink}>{m.vRetry}</ZLink>
          {fails < plan.falls && <ZLink onClick={() => { playCombo("fanfare"); setPhase("end"); }} color={ZZ.ink}>{m.finishEarly}</ZLink>}
        </div>
      </ZScreen>
    );
  }

  // ── Fin ──
  const st = c.players.map((_, p) => ({
    p,
    f: shots.filter((s) => s.player === p && !s.ok).length,
    ok: shots.filter((s) => s.player === p && s.ok).length,
    played: shots.some((s) => s.player === p),
  })).filter((x) => x.played);
  const rows: EndRow[] = st
    .sort((a, b) => a.f - b.f || b.ok - a.ok)
    .map((x) => ({ name: c.players[x.p], score: x.f, colorIndex: x.p, note: m.cNote(x.f, x.ok) }));
  return (
    <ModeEnd
      rows={rows}
      result={{ scores: { names: st.map((x) => c.players[x.p]), values: st.map((x) => x.f), lowerWins: true } }}
      unit=""
      loser={null}
      tools={c.tools}
      overlays={c.overlays}
      onReplay={c.onReplay}
      onQuit={c.onQuit}
    />
  );
}

// ── Un son ──
function CrescendoTurn({ up, record, chain, link, name, floor, human, tools, onDone, onMicFail, flash }: {
  up: boolean; record: number | null; chain: number; link: number; name: string; floor: number | null; human: boolean; tools: ReactNode;
  onDone: (s: Omit<Shot, "player">) => void; onMicFail: (e: MicError) => void; flash: (m: string) => void;
}) {
  const t = useT(CHUT_STR);
  const m = useT(MODES_STR);
  const [phase, setPhase] = useState<"ready" | "live">("ready");
  const [view, setView] = useState({ lv: 0, peak: 0, holding: false });
  const lis = useRef<VoiceListener | null>(null);
  const loop = useRef(0);
  const st = useRef({ holding: false, since: 0, peak: 0, done: false });
  const cb = useRef({ onDone });
  useEffect(() => { cb.current = { onDone }; });

  const stop = () => {
    window.clearInterval(loop.current);
    lis.current?.close();
    lis.current = null;
  };
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && !st.current.done) { stop(); st.current.holding = false; setPhase("ready"); }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); stop(); };
  }, []);

  const judge = (peak: number): Omit<Shot, "player"> => {
    if (peak < CRESC.audible) return { ok: false, level: peak, reason: "silent" };
    if (peak >= CRESC.ceiling) return { ok: false, level: peak, reason: "boom" };
    if (record != null) {
      if (up && peak < record + CRESC.step) return { ok: false, level: peak, reason: "weak" };
      if (!up && peak > record - CRESC.step) return { ok: false, level: peak, reason: "loud" };
    }
    return { ok: true, level: peak, reason: null };
  };

  const release = () => {
    const s = st.current;
    if (!s.holding || s.done) return;
    s.holding = false;
    if (performance.now() - s.since < MIN_HOLD) {
      flash(m.cShort);
      setView((v) => ({ ...v, holding: false }));
      return;
    }
    s.done = true;
    stop();
    cb.current.onDone(judge(s.peak));
  };

  const tick = () => {
    const s = st.current;
    const L = lis.current;
    if (!L || s.done) return;
    const lv = L.level();
    if (s.holding) {
      const held = performance.now() - s.since;
      if (held > 200) s.peak = Math.max(s.peak, lv);
      if (held > MAX_HOLD) { release(); return; }
    }
    setView({ lv, peak: s.peak, holding: s.holding });
  };

  const open = async () => {
    if (human) { setPhase("live"); return; }
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
    L.gate(400);
    st.current = { holding: false, since: 0, peak: 0, done: false };
    setPhase("live");
    loop.current = window.setInterval(tick, TICK);
  };

  const press = () => {
    const s = st.current;
    if (s.done || s.holding || !lis.current) return;
    lis.current.gate(180);
    Object.assign(s, { holding: true, since: performance.now(), peak: 0 });
    vibrate(15);
    setView((v) => ({ ...v, holding: true, peak: 0 }));
  };

  const Dir = up ? TrendingUp : TrendingDown;
  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <ZChip bg={ZZ.yellow}><Dir size={16} strokeWidth={2.8} aria-hidden /> {up ? m.dirUp : m.dirDown}</ZChip>
      <ZChip bg="#fff" tilt={1.5}>{m.cChain(chain)} · {link}</ZChip>
    </div>
  );
  const hint = record == null ? (up ? m.cFirstUp : m.cFirstDown) : m.cPassHint(up);

  if (phase === "ready") {
    return (
      <ZScreen tools={tools}>
        <ChutStyles />
        {header}
        <ZTitle size="clamp(34px, 10vw, 46px)" className="mt-4" as="h1" style={{ overflowWrap: "anywhere" }}>{name}</ZTitle>
        <ZCard bg={ZZ.cream} tilt={-1} shadow={6} className="mt-4 flex items-center gap-3 p-4">
          {!human && (
            <div className="w-[84px] shrink-0">
              <VBar value={0} record={record} ceiling={up ? CRESC.ceiling : undefined} floorMark={up ? undefined : CRESC.audible} height={150} ceilingLabel={m.cBoom} label={m.meterLabel} />
            </div>
          )}
          <div className="min-w-0">
            {record != null && !human && <p className="text-[14px] font-bold">{m.cRecord}</p>}
            <p className="text-[19px] font-bold leading-snug">{human ? m.cHumanHint(up) : hint}</p>
          </div>
        </ZCard>
        <p className="mt-5 flex items-start gap-2 text-[16px] font-semibold leading-snug"><Smartphone size={20} strokeWidth={2.6} aria-hidden className="mt-0.5 shrink-0" /> {m.holdNear}</p>
        <div className="mt-auto pt-6">
          <ZButton bg={ZZ.pink} onClick={() => void open()}>{m.ready}</ZButton>
          {!human && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
              <ShieldCheck size={16} strokeWidth={2.6} aria-hidden /> {t.noRecord}
            </p>
          )}
        </div>
      </ZScreen>
    );
  }

  if (human) {
    return (
      <ZScreen tools={tools}>
        <ChutStyles />
        {header}
        <ZTitle size="clamp(30px, 9vw, 40px)" className="mt-5" as="h1">{m.cJudge(up)}</ZTitle>
        <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
          <ZButton bg={ZZ.coral} onClick={() => onDone({ ok: false, level: null, reason: up ? "weak" : "loud" })}><X size={22} strokeWidth={3} aria-hidden /> {m.cNo}</ZButton>
          <ZButton bg={ZZ.mint} onClick={() => onDone({ ok: true, level: null, reason: null })}><Check size={22} strokeWidth={3} aria-hidden /> {m.cYes}</ZButton>
        </div>
      </ZScreen>
    );
  }

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
      <div className="w-full max-w-md">{header}</div>
      <p className="mt-3 w-full max-w-md text-[17px] font-bold leading-snug">{hint}</p>
      <div className="mt-3 flex w-full max-w-md flex-1 items-center justify-center gap-4">
        <div className="w-[260px]">
          <VBar
            value={view.lv}
            record={record}
            peak={view.holding && view.peak > 0 ? view.peak : null}
            ceiling={up ? CRESC.ceiling : undefined}
            floorMark={up ? undefined : CRESC.audible}
            height="clamp(170px, 44dvh, 300px)"
            ceilingLabel={m.cBoom}
            recordLabel={m.cRecord}
            label={m.meterLabel}
          />
        </div>
      </div>
      <div className="w-full max-w-md pt-3">
        <button
          type="button"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); press(); }}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          className="flex min-h-[84px] w-full flex-col items-center justify-center rounded-[28px] text-center"
          style={{
            background: view.holding ? ZZ.yellow : ZZ.pink,
            color: ZZ.ink,
            border: `3px solid ${ZZ.ink}`,
            boxShadow: view.holding ? `0 1px 0 ${ZZ.ink}` : `0 6px 0 ${ZZ.ink}`,
            transform: view.holding ? "translateY(5px)" : undefined,
            transition: "transform 80ms, box-shadow 80ms, background-color 120ms",
            touchAction: "none",
          }}
        >
          <span className="flex items-center gap-2 text-[26px] leading-none" style={DISPLAY}><Mic size={26} strokeWidth={2.8} aria-hidden /> {view.holding ? m.cHolding : m.cHold}</span>
          <span className="mt-1 text-[14px] font-bold">{m.cHoldSub}</span>
        </button>
      </div>
    </div>
  );
}
