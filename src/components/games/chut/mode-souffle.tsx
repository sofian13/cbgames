"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Hand, ShieldCheck, Smartphone, Timer, Trophy } from "lucide-react";
import { useT } from "@/lib/i18n";
import { playCombo, playSfx } from "@/lib/sfx";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { GameTopRight } from "@/components/games/game-icon-button";
import { DISPLAY, PassScreen, SoundButton, ZButton, ZCard, ZChip, ZLink, ZScreen, ZTitle, ZZ } from "@/components/games/local-kit";
import { CHUT_STR } from "./i18n";
import { MODES_STR } from "./modes-i18n";
import { SOUFFLE_BANDS, secs, souffleBand, vibrate, type ModeCommon, type ZoneId } from "./modes";
import { VoiceListener, type MicError } from "./mic";
import { VBar } from "./gauges";
import { ChutStyles, useReducedMotion, type Sentence } from "./shared";
import { ModeEnd, type EndRow } from "./mode-end";

// ── Le Souffle ───────────────────────────────────────────
// Chacun son tour, le tél près de la bouche : tenir un « Aaaah » le plus longtemps
// possible en restant dans la bande de volume. Le chrono s'arrête si on en sort.

const TICK = 50;
const GRACE = 450; // hors zone toléré (respiration, attaque du son)
const WAIT = 6000; // délai pour démarrer
const CAP = 60000;

export interface SoufflePlan { order: number[]; tours: number }
interface Try { player: number; tour: number; ms: number; started: boolean }

export function SouffleMode({ plan, ...c }: ModeCommon & { plan: SoufflePlan }) {
  const t = useT(CHUT_STR);
  const m = useT(MODES_STR);
  const reduced = useReducedMotion();
  const [tries, setTries] = useState<Try[]>([]);
  const [phase, setPhase] = useState<"pass" | "turn" | "result" | "end">("pass");
  const [loser, setLoser] = useState<{ p: number; s: Sentence } | null>(null);
  const n = plan.order.length;
  const total = n * plan.tours;
  const k = tries.length;
  const cur = Math.min(k, total - 1);
  const tour = Math.floor(cur / n);
  const player = plan.order[cur % n];
  const zone: ZoneId = SOUFFLE_BANDS[tour % SOUFFLE_BANDS.length];
  const best = (list: Try[], tr: number) => list.filter((x) => x.tour === tr).reduce<Try | null>((a, x) => (!a || x.ms > a.ms ? x : a), null);

  const done = (x: { ms: number; started: boolean }) => {
    const rec = best(tries, tour);
    setTries((v) => [...v, { ...x, player, tour }]);
    if (x.ms > 0 && (!rec || x.ms > rec.ms)) { playSfx("tada", { volume: 0.7 }); vibrate(40); }
    else if (x.ms >= 3000) playSfx("correct", { volume: 0.6 });
    else playSfx("crowd-aww", { volume: 0.5 });
    setPhase("result");
  };
  const totals = (list: Try[]) => c.players.map((_, p) => list.filter((x) => x.player === p).reduce((a, x) => a + x.ms, 0));
  const finish = () => {
    const tot = totals(tries);
    const ids = [...c.players.keys()].filter((p) => tries.some((x) => x.player === p));
    const min = Math.min(...ids.map((p) => tot[p]));
    const bottom = ids.filter((p) => tot[p] === min);
    setLoser(bottom.length === 1 && ids.length > 1 ? { p: bottom[0], s: c.newSentence() } : null);
    playCombo("drumroll", { duration: 1.2 });
    window.setTimeout(() => playCombo("fanfare"), 1250);
    setPhase("end");
  };
  const next = () => {
    if (tries.length < total) setPhase("pass");
    else finish();
  };
  const retry = () => {
    setTries((v) => v.slice(0, -1));
    playSfx("whoosh", { volume: 0.5 });
    setPhase("turn");
  };

  if (phase === "pass") {
    return (
      <PassScreen toName={c.players[player]} colorIndex={player} accent={ZZ.pink} hint={m.sPassHint(m.zone[zone])} onReady={() => setPhase("turn")} />
    );
  }

  if (phase === "turn") {
    const rec = best(tries, tour);
    return (
      <>
        {c.overlays}
        <SouffleTurn
          key={k}
          label={m.sTour(tour + 1, plan.tours)}
          zone={zone}
          name={c.players[player]}
          record={rec ? { name: c.players[rec.player], ms: rec.ms } : null}
          floor={c.floor}
          human={c.human}
          tools={c.tools}
          onDone={done}
          onMicFail={c.onMicFail}
        />
      </>
    );
  }

  if (phase === "result") {
    const x = tries[tries.length - 1];
    const before = best(tries.slice(0, -1), x.tour);
    const isRecord = x.ms > 0 && (!before || x.ms > before.ms);
    return (
      <ZScreen bg={isRecord ? ZZ.mint : x.ms > 0 ? ZZ.sky : ZZ.coral} tools={c.tools}>
        {c.overlays}
        <ChutStyles />
        {isRecord && !reduced && <ConfettiBurst count={40} />}
        <ZChip bg="#fff">{m.sTour(x.tour + 1, plan.tours)} · {m.zone[SOUFFLE_BANDS[x.tour % SOUFFLE_BANDS.length]]}</ZChip>
        <div className="mt-4 flex flex-col items-center text-center">
          <p className="text-[18px] font-bold" style={{ overflowWrap: "anywhere" }}>{c.players[x.player]}</p>
          <p className="chut-pop leading-none" style={{ ...DISPLAY, fontSize: "clamp(80px, 26vw, 120px)", WebkitTextStroke: `3px ${ZZ.ink}`, color: "#fff", textShadow: `5px 5px 0 ${ZZ.ink}` }}>
            {secs(x.ms, t.dec)}<span className="text-[32px]"> s</span>
          </p>
          <ZTitle size="clamp(28px, 8vw, 38px)" className="mt-2" style={{ rotate: "-2deg" }}>
            {!x.started ? m.sNoStart : isRecord ? m.sNewRecord : before ? m.sRecord(c.players[before.player], secs(before.ms, t.dec)) : ""}
          </ZTitle>
        </div>
        <div className="mt-auto flex flex-col gap-1 pt-6">
          <ZButton bg="#fff" onClick={next}>{tries.length < total ? m.nextPlayer : m.seeRanking}</ZButton>
          <ZLink onClick={retry} color={ZZ.ink}>{m.vRetry}</ZLink>
          {tries.length < total && <ZLink onClick={finish} color={ZZ.ink}>{m.finishEarly}</ZLink>}
        </div>
      </ZScreen>
    );
  }

  const tot = totals(tries);
  const ids = [...c.players.keys()].filter((p) => tries.some((x) => x.player === p));
  const rows: EndRow[] = ids
    .sort((a, b) => tot[b] - tot[a])
    .map((p) => {
      const b = tries.filter((x) => x.player === p).reduce((a, x) => Math.max(a, x.ms), 0);
      return { name: c.players[p], score: secs(tot[p], t.dec), colorIndex: p, note: m.sNote(secs(b, t.dec)) };
    });
  return (
    <ModeEnd
      rows={rows}
      result={{ scores: { names: ids.map((p) => c.players[p]), values: ids.map((p) => tot[p]) } }}
      unit={t.unitS}
      loser={loser ? { name: c.players[loser.p], colorIndex: loser.p, sentence: loser.s, onReroll: () => setLoser({ ...loser, s: c.rerollDare(loser.s) }), title: `${m.lastPenalty} · ${c.players[loser.p]}` } : null}
      tieNote={ids.length > 1 ? m.tieBottom : null}
      tools={c.tools}
      overlays={c.overlays}
      onReplay={c.onReplay}
      onQuit={c.onQuit}
    />
  );
}

// ── Un souffle ──
function SouffleTurn({ label, zone, name, record, floor, human, tools, onDone, onMicFail }: {
  label: string; zone: ZoneId; name: string; record: { name: string; ms: number } | null; floor: number | null; human: boolean; tools: ReactNode;
  onDone: (x: { ms: number; started: boolean }) => void; onMicFail: (e: MicError) => void;
}) {
  const t = useT(CHUT_STR);
  const m = useT(MODES_STR);
  const [phase, setPhase] = useState<"ready" | "live">("ready");
  const [view, setView] = useState({ lv: 0, held: 0, started: false, out: false });
  const lis = useRef<VoiceListener | null>(null);
  const loop = useRef(0);
  const st = useRef({ last: 0, started: false, held: 0, out: 0, wait: 0, done: false });
  const cb = useRef({ onDone });
  useEffect(() => { cb.current = { onDone }; });
  const [lo, hi] = souffleBand(zone);

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

  const end = () => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    stop();
    cb.current.onDone({ ms: Math.round(s.held), started: s.started });
  };

  const tick = () => {
    const s = st.current;
    const L = lis.current;
    if (s.done) return;
    const now = performance.now();
    const dt = Math.min(200, now - s.last);
    s.last = now;
    if (human) {
      if (s.started) s.held += dt;
      if (s.held >= CAP) { end(); return; }
      setView({ lv: 0, held: s.held, started: s.started, out: false });
      return;
    }
    if (!L) return;
    const lv = L.level();
    const inside = lv >= lo && lv <= hi;
    if (!s.started) {
      if (inside) s.started = true;
      else {
        s.wait += dt;
        if (s.wait > WAIT) { end(); return; }
      }
    } else if (inside) {
      s.held += dt;
      s.out = 0;
    } else {
      s.out += dt;
      if (s.out > GRACE) { end(); return; }
    }
    if (s.held >= CAP) { end(); return; }
    setView({ lv, held: s.held, started: s.started, out: s.started && !inside });
  };

  const open = async () => {
    st.current = { last: performance.now(), started: false, held: 0, out: 0, wait: 0, done: false };
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
      L.gate(350);
      st.current.last = performance.now();
      loop.current = window.setInterval(tick, TICK);
    }
    setPhase("live");
  };

  const humanStart = () => {
    const s = st.current;
    if (s.started) return;
    s.started = true;
    s.last = performance.now();
    playSfx("whistle", { volume: 0.5, rate: 1.4 });
    loop.current = window.setInterval(tick, TICK);
    setView((v) => ({ ...v, started: true }));
  };

  const zoneChip = <ZChip bg={ZZ.mint} className="text-[16px]">{m.zone[zone]}</ZChip>;
  const recLine = record ? m.sRecord(record.name, secs(record.ms, t.dec)) : m.sNoRecord;

  if (phase === "ready") {
    return (
      <ZScreen tools={tools}>
        <ChutStyles />
        <div className="flex flex-wrap items-center gap-2">
          <ZChip bg={ZZ.yellow}>{label}</ZChip>
          {zoneChip}
        </div>
        <ZTitle size="clamp(34px, 10vw, 46px)" className="mt-4" as="h1" style={{ overflowWrap: "anywhere" }}>{name}</ZTitle>
        <ZCard bg={ZZ.cream} tilt={-1} shadow={6} className="mt-4 p-4">
          <p className="flex items-center gap-2 text-[18px]" style={DISPLAY}><Trophy size={20} strokeWidth={2.6} aria-hidden /> {recLine}</p>
          <p className="mt-2 text-[16px] font-semibold leading-snug">{human ? m.sHumanHint : m.sReadyHint}</p>
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

  const ratio = record && record.ms > 0 ? Math.min(1, view.held / record.ms) : 0;
  const status = human ? (view.started ? m.sHolding : m.sHumanHint) : !view.started ? m.sWaiting : view.out ? m.sOut : m.sHolding;
  return (
    <div
      className="relative flex min-h-[100dvh] w-full shrink-0 select-none flex-col items-center px-4 text-white"
      style={{
        background: `radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${ZZ.night}`,
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 64px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
      }}
    >
      <ChutStyles />
      <GameTopRight>{tools}<SoundButton /></GameTopRight>
      <div className="flex w-full max-w-md flex-wrap items-center gap-2">
        <ZChip bg={ZZ.yellow}>{label}</ZChip>
        {zoneChip}
      </div>
      <p className="mt-4 text-center text-[22px]" style={{ ...DISPLAY, color: view.out ? ZZ.coral : view.started ? ZZ.mint : "#fff" }}>{status}</p>
      <p className={`mt-1 text-center leading-none ${view.started && !view.out ? "chut-pulse" : ""}`} style={{ ...DISPLAY, fontSize: "clamp(84px, 28vw, 128px)" }}>
        {secs(view.held, t.dec)}<span className="text-[30px]"> s</span>
      </p>
      {!human && (
        <div className="mt-2 flex w-full max-w-md items-center justify-center gap-4">
          <div className="w-[230px]">
            <VBar value={view.lv} lo={lo} hi={hi} height="clamp(150px, 34dvh, 240px)" label={m.meterLabel}
              zoneLabels={(["whisper", "normal", "loud", "shout"] as ZoneId[]).map((z, i) => ({ v: [0.22, 0.45, 0.66, 0.86][i], text: m.zone[z] }))} />
          </div>
        </div>
      )}
      <div className={`${human ? "mt-3" : "mt-auto pt-3"} w-full max-w-md`}>
        <div className="flex items-center justify-between text-[14px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
          <span className="flex items-center gap-1.5"><Timer size={15} strokeWidth={2.8} aria-hidden /> {recLine}</span>
        </div>
        <div className="mt-1 h-4 w-full overflow-hidden rounded-full" style={{ background: "#1E0F45", border: `2.5px solid ${ZZ.ink}` }}>
          <div className="chut-tr h-full" style={{ width: `${(ratio * 100).toFixed(1)}%`, background: ratio >= 1 ? ZZ.mint : ZZ.yellow, transition: "width 80ms linear" }} />
        </div>
      </div>
      {human && (
        <div className="mt-auto w-full max-w-md pt-4">
          {view.started ? (
            <ZButton bg={ZZ.coral} onClick={end} className="min-h-[76px]" style={{ fontSize: 26 }}><Hand size={26} strokeWidth={2.8} aria-hidden /> {m.sHumanStop}</ZButton>
          ) : (
            <ZButton bg={ZZ.mint} onClick={humanStart} className="min-h-[76px]" style={{ fontSize: 26 }}>{m.sHumanStart}</ZButton>
          )}
        </div>
      )}
    </div>
  );
}
