"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { CupSoda, Drama, Gauge, Hand, Smartphone } from "lucide-react";
import type { GameProps } from "@/lib/games/types";
import { PlayersSetup, PassScreen, colorForIndex, DISPLAY, ZButton, ZCard, ZChip, ZChoice, ZLink, ZRanking, ZZ, inkOn, zBackground, useScrollTopOn } from "../local-kit";
import { IdeaButton, RerollButton } from "../idea-button";
import { GameInlineIcon } from "../game-icon-button";
import { Mascot, MASCOT_PALETTE } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { getPartyMood, sipsAllowed } from "@/lib/party-mood";
import { getLang, pick, useT } from "@/lib/i18n";
import { playCombo, playLoop, playSfx, preloadSfx, type LoopHandle, type SfxName } from "@/lib/sfx";
import { VERRE_STR, VERRE_MAX_PLAYERS, VERRE_MIN_PLAYERS, type EventId } from "./i18n";
import { DIFF, LIQUIDS, VerreScene, type Difficulty, type LiquidStyle } from "./scene";
import { keepAwake, newTiltInput, requestMotionPermission, startSensors, vibrate, type TiltInput } from "./sensors";
import { SpilledGlass } from "./art";
import { Tools, TutoScreen } from "./ui";

// ── Le Verre Invisible ──────────────────────────────────────
// « Jenga liquide » sur un seul tél : le tél tenu à plat est un plateau avec un verre.
// À ton tour tu verses (points), puis tu passes le tél à ton voisin SANS renverser.
// Le verre se remplit à chaque tour ; celui qui fait déborder perd la manche.

const ACCENT = ZZ.sky;
const INK = ZZ.ink;
const TUTO_KEY = "zz-verre-tuto";
const GAME_FR = "Le Verre Invisible";

type Phase = "setup" | "tuto" | "config" | "intro" | "round" | "result" | "end";
type Penalty = "dare" | "sips";
type Cause = "pour" | "pass" | "slow" | "leak";
type Sub = "calib" | "event" | "pour" | "pass" | "spill";

interface RoundResult { loser: number; cause: Cause; lost: number; sips: number | null; dare: string; liquid: LiquidStyle }

const SFX: SfxName[] = ["pour", "glug", "splash", "fizz", "laugh", "pop", "pop2", "clink", "glass", "tick", "tock", "whoosh", "whooshdown", "thump", "buzzer", "crowd-aww", "crowd-cheer", "tada", "applause", "pluck2", "success", "rise", "select", "confirm", "card-slide", "open", "scratch", "plate", "coin", "coins", "error"];

const EVENT_COLORS: Record<EventId, string> = {
  ice: "#ABEEEA", small: ZZ.yellow, crack: ZZ.coral, oneHand: ZZ.pink, eyes: "#B5A1FF", spin: ZZ.mint, foam: ZZ.cream, tray: ZZ.yellow,
};

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const deg = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function VerreGame({ onReturnToLobby }: GameProps) {
  const t = useT(VERRE_STR);
  // Contenu figé dans la langue du début de partie (gages, noms des liquides)
  const [content] = useState(() => pick(VERRE_STR, getLang()));
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [spills, setSpills] = useState<number[]>([]);
  const [bank, setBank] = useState<number[]>([]);
  const [diff, setDiff] = useState<Difficulty>("normal");
  // Soirée « Chill » : pas de gorgées ; « Folle » : gorgées cochées d'office ; sinon gage par défaut
  const [sipsOk] = useState(() => getPartyMood() !== "chill");
  const [penalty, setPenalty] = useState<Penalty>(() => (sipsAllowed(false) ? "sips" : "dare"));
  const [rounds, setRounds] = useState(3);
  const [round, setRound] = useState(1);
  const [starter, setStarter] = useState(0);
  const [order, setOrder] = useState<LiquidStyle[]>(() => shuffle(LIQUIDS));
  const [result, setResult] = useState<RoundResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const input = useRef<TiltInput>(newTiltInput());
  const stopSensors = useRef<(() => void) | null>(null);
  const usedDares = useRef(new Set<string>());
  const tutoNext = useRef<Phase>("config");

  useScrollTopOn(phase);
  useEffect(() => { preloadSfx(SFX); }, []);
  useEffect(() => () => { stopSensors.current?.(); }, []);

  const liquid = order[(round - 1) % order.length];

  const startGame = (names: string[]) => {
    setPlayers(names);
    setScores(names.map(() => 0));
    setSpills(names.map(() => 0));
    setBank(names.map(() => 0));
    let seen = false;
    try { seen = localStorage.getItem(TUTO_KEY) === "1"; } catch { /* stockage indispo */ }
    tutoNext.current = "config";
    setPhase(seen ? "config" : "tuto");
  };

  const tutoDone = () => {
    try { localStorage.setItem(TUTO_KEY, "1"); } catch { /* stockage indispo */ }
    setPhase(tutoNext.current);
  };

  // « C'est parti » : la permission capteurs DOIT être demandée dans ce geste (iOS)
  const go = () => {
    setNotice(null);
    const perm = requestMotionPermission();
    // On écoute tout de suite : les événements arrivent dès que l'accès est accordé.
    // Sans événement au bout de 1,6 s → mode tactile (la boucle de jeu bascule toute seule).
    stopSensors.current?.();
    stopSensors.current = startSensors(input.current);
    void perm.then((res) => {
      window.setTimeout(() => {
        if (!input.current.live) setNotice(res === "denied" ? t.noticeDenied : t.noticeNoSensor);
      }, 1600);
    });
    playSfx("confirm", { volume: 0.6 });
    setScores(players.map(() => 0));
    setSpills(players.map(() => 0));
    setBank(players.map(() => 0));
    setOrder(shuffle(LIQUIDS));
    setRound(1);
    setStarter(Math.floor(Math.random() * players.length));
    setPhase("intro");
  };

  const onBankPts = useCallback((i: number, pts: number) => {
    setScores((s) => s.map((v, k) => (k === i ? v + pts : v)));
    setBank((b) => b.map((v, k) => (k === i ? v + pts : v)));
  }, []);

  const pickDare = useCallback((avoid?: string) => {
    let pool = content.dares.filter((d) => !usedDares.current.has(d) && d !== avoid);
    if (!pool.length) { usedDares.current.clear(); pool = content.dares.filter((d) => d !== avoid); }
    const d = pool[Math.floor(Math.random() * pool.length)];
    usedDares.current.add(d);
    return d;
  }, [content]);

  // `bank` lu via une ref : la manche se termine dans la boucle d'animation
  const bankRef = useRef(bank);
  useLayoutEffect(() => { bankRef.current = bank; }, [bank]);

  const onSpill = useCallback((loser: number, cause: Cause, level: number, pending: number) => {
    const banked = bankRef.current[loser] ?? 0;
    // les points du tour en cours n'étaient pas encore comptés : on les affiche perdus aussi
    const lost = banked + pending;
    setScores((s) => s.map((v, k) => (k === loser ? v - banked : v)));
    setSpills((s) => s.map((v, k) => (k === loser ? v + 1 : v)));
    // plus le verre était plein, plus ça coûte (max 3, toujours « ou un gage »)
    const sips = penalty === "sips" ? clamp(1 + Math.round(level * 2), 1, 3) : null;
    setResult({ loser, cause, lost, sips, dare: pickDare(), liquid: order[(round - 1) % order.length] });
    setPhase("result");
  }, [penalty, pickDare, order, round]);

  const nextRound = () => {
    if (!result) return;
    setRound((r) => r + 1);
    setStarter(result.loser); // celui qui a renversé relance
    setBank(players.map(() => 0));
    setPhase("intro");
  };

  const finish = () => {
    playCombo("fanfare");
    setPhase("end");
  };

  const replay = () => {
    setScores(players.map(() => 0));
    setSpills(players.map(() => 0));
    setBank(players.map(() => 0));
    setOrder(shuffle(LIQUIDS));
    setRound(1);
    setResult(null);
    setStarter(Math.floor(Math.random() * players.length));
    setPhase("intro");
  };

  // ══ Écrans ══
  if (phase === "setup") {
    return (
      <>
        <Tools />
        <PlayersSetup
          emoji=""
          name={t.name}
          min={VERRE_MIN_PLAYERS}
          max={VERRE_MAX_PLAYERS}
          accent={ACCENT}
          onStart={startGame}
          footer={<IdeaButton game={GAME_FR} kind="idée" bg={ZZ.cream} />}
        />
      </>
    );
  }

  if (phase === "tuto") return <TutoScreen onDone={tutoDone} />;

  if (phase === "config") {
    const diffs: { id: Difficulty; title: string; sub: string; color: string }[] = [
      { id: "easy", title: t.easy, sub: t.easySub, color: ZZ.mint },
      { id: "normal", title: t.normal, sub: t.normalSub, color: ZZ.yellow },
      { id: "pro", title: t.pro, sub: t.proSub, color: ZZ.coral },
    ];
    return (
      <Screen>
        <Tools />
        <div className="flex items-end gap-3">
          <MiniGlass />
          <h1 className="pb-1 text-[clamp(40px,12vw,54px)] leading-[0.95]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>{t.beforeStart}</h1>
        </div>

        <SectionTitle>{t.difficulty}</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {diffs.map((d, k) => (
            <ZChoice key={d.id} active={diff === d.id} onClick={() => setDiff(d.id)} color={d.color} tilt={k === 1 ? 1.5 : -1.5} className="flex min-h-[112px] flex-col p-3">
              <span className="text-[19px] leading-[1.05]" style={DISPLAY}>{d.title}</span>
              <span className="mt-1.5 text-[13px] font-semibold leading-snug">{d.sub}</span>
            </ZChoice>
          ))}
        </div>

        {sipsOk && (
          <>
            <SectionTitle>{t.loserTakes}</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              <ZChoice active={penalty === "dare"} onClick={() => setPenalty("dare")} color={ZZ.pink} className="p-3.5">
                <span className="flex items-center gap-1.5 text-[19px]" style={DISPLAY}><GameInlineIcon icon={Drama} /> {t.dareTitle}</span>
                <span className="mt-1 block text-[13px] font-semibold leading-snug">{t.dareSub}</span>
              </ZChoice>
              <ZChoice active={penalty === "sips"} onClick={() => setPenalty("sips")} color={ZZ.sky} tilt={1.5} className="p-3.5">
                <span className="flex items-center gap-1.5 text-[19px]" style={DISPLAY}><GameInlineIcon icon={CupSoda} /> {t.sipsTitle}</span>
                <span className="mt-1 block text-[13px] font-semibold leading-snug">{t.sipsSub}</span>
              </ZChoice>
            </div>
          </>
        )}

        <SectionTitle>{t.roundsTitle}</SectionTitle>
        <div className="flex gap-2.5">
          {[3, 5, 7].map((n) => (
            <ZChoice key={n} active={rounds === n} onClick={() => setRounds(n)} color={ZZ.yellow} className="flex-1 text-center">
              <span className="text-[18px]" style={DISPLAY}>{t.roundsN(n)}</span>
            </ZChoice>
          ))}
        </div>

        <ZCard bg={ZZ.cream} tilt={-1} shadow={4} radius={20} className="mt-6 flex items-center gap-3 px-4 py-3">
          <Smartphone size={26} strokeWidth={2.8} className="shrink-0" aria-hidden />
          <p className="text-[14px] font-semibold leading-snug">{t.sensorNote}</p>
        </ZCard>

        <div className="mt-auto pt-7">
          <ZButton bg={ACCENT} onClick={go}>{t.go}</ZButton>
          <ZLink onClick={() => { tutoNext.current = "config"; setPhase("tuto"); }} className="mt-2">{t.tutoAgain}</ZLink>
          <div className="mt-2 flex justify-center">
            <IdeaButton game={GAME_FR} kind="idée" bg={ZZ.cream} />
          </div>
        </div>
      </Screen>
    );
  }

  if (phase === "intro") {
    return (
      <>
        <Tools />
        <PassScreen
          toName={players[starter]}
          colorIndex={starter}
          accent={ACCENT}
          hint={t.roundHint(round, content.liquids[liquid.id])}
          buttonLabel={t.firstBtn}
          onReady={() => setPhase("round")}
        />
      </>
    );
  }

  if (phase === "round") {
    return (
      <RoundPlay
        key={round}
        players={players}
        starter={starter}
        round={round}
        rounds={rounds}
        liquid={liquid}
        liquidName={content.liquids[liquid.id]}
        diff={diff}
        input={input}
        notice={notice}
        onBank={onBankPts}
        onSpill={onSpill}
      />
    );
  }

  const ranking = players
    .map((name, i) => ({ name, i, s: scores[i] ?? 0, sp: spills[i] ?? 0 }))
    .sort((a, b) => b.s - a.s || a.sp - b.sp);

  if (phase === "result" && result) {
    const pal = MASCOT_PALETTE[colorForIndex(result.loser)];
    const name = players[result.loser];
    const title = result.cause === "pass" ? t.spilledPass(name) : result.cause === "slow" ? t.spilledSlow(name) : result.cause === "leak" ? t.spilledLeak(name) : t.spilledPour(name);
    const last = round >= rounds;
    // le prénom (en sticker) peut être au milieu de la phrase : « ¡Léa tardó… », « Le verre de Léa… »
    const cut = title.indexOf(name);
    const before = cut >= 0 ? title.slice(0, cut) : "";
    const after = cut >= 0 ? title.slice(cut + name.length) : ` ${title}`;
    return (
      <Screen bg={ZZ.coral}>
        <Tools />
        <ZChip bg="#fff" tilt={-3}>{t.roundChip(round, rounds)} · {content.liquids[result.liquid.id]}</ZChip>
        <h1 className="mt-3 text-[clamp(32px,9.5vw,44px)] leading-[0.98]" style={{ ...DISPLAY, color: INK, overflowWrap: "anywhere" }}>
          {/* Prénom mis en valeur par un sticker, même police */}
          {before}<NameSticker name={name} bg={pal.body} />{after}
        </h1>
        <div className="relative mx-auto mt-2 w-full max-w-sm" style={{ aspectRatio: "300 / 150" }}>
          <SpilledGlass color={result.liquid.body} top={result.liquid.top} deep={result.liquid.deep} />
          <div className="absolute" style={{ right: "1%", bottom: "24%" }}>
            <Mascot size={62} color={colorForIndex(result.loser)} mood="shocked" arms shadow={false} />
          </div>
        </div>
        {result.lost > 0 && (
          <p className="text-center text-[16px] font-bold" style={{ color: INK }}>{t.lostPts(result.lost)}</p>
        )}

        <ZCard bg={ZZ.cream} radius={24} shadow={5} tilt={-1} className="mt-4 p-4 text-center">
          {result.sips != null ? (
            <>
              <p className="text-[26px] leading-tight" style={DISPLAY}><GameInlineIcon icon={CupSoda} /> {t.sips(result.sips)}</p>
              <p className="mt-1 text-[15px] font-bold" style={{ color: "#4A3A66" }}>{t.orDare}</p>
            </>
          ) : (
            <p className="text-[22px] leading-tight" style={DISPLAY}>{t.yourDare}</p>
          )}
          <p className="mt-1 text-[18px] font-semibold leading-snug">{result.dare}</p>
          <div className="mt-3 flex justify-center">
            <RerollButton label={t.rerollDare} bg={ZZ.yellow} onClick={() => setResult({ ...result, dare: pickDare(result.dare) })} />
          </div>
        </ZCard>

        <p className="mb-2 mt-6 text-center text-[22px]" style={{ ...DISPLAY, color: INK }}>{t.scoreTitle}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {ranking.map((r) => (
            <span key={r.i} className="flex min-h-9 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[15px] font-bold" style={{ background: r.i === result.loser ? ZZ.yellow : "#fff", color: INK, border: `2.5px solid ${INK}`, boxShadow: `0 2px 0 ${INK}` }}>
              <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: MASCOT_PALETTE[colorForIndex(r.i)].body, border: `2px solid ${INK}` }} />
              {r.name}
              <span style={DISPLAY}>· {r.s}</span>
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-1 pt-7">
          {last ? (
            <ZButton bg={ZZ.yellow} onClick={finish}>{t.finalRanking}</ZButton>
          ) : (
            <>
              <ZButton bg={ZZ.yellow} onClick={nextRound}>{t.nextRound}</ZButton>
              <ZLink color={INK} onClick={finish}>{t.stopHere}</ZLink>
            </>
          )}
        </div>
      </Screen>
    );
  }

  // ── Fin ──
  const best = ranking[0];
  const king = [...ranking].sort((a, b) => b.sp - a.sp)[0];
  return (
    <Screen>
      <Tools />
      <ConfettiBurst count={60} />
      <div className="flex justify-center">
        <Mascot size={118} color={colorForIndex(best?.i ?? 0)} mood="laughing" crown arms />
      </div>
      <h1 className="mt-3 text-center text-[clamp(38px,11vw,54px)] leading-[0.95]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}`, overflowWrap: "anywhere" }}>
        {t.winner(best?.name ?? "")}
      </h1>
      <p className="mt-2 text-center text-[19px]" style={{ ...DISPLAY, color: ZZ.yellow }}>{t.bestBarman}</p>
      <div className="mt-5">
        <ZRanking rows={ranking.map((r) => ({ name: r.name, score: r.s, colorIndex: r.i, note: t.spills(r.sp) }))} unit="pts" />
      </div>
      <ZCard bg={ZZ.coral} tilt={1.5} shadow={4} radius={20} className="mt-5 px-4 py-3 text-center">
        <p className="text-[18px] leading-tight" style={DISPLAY}>{king && king.sp > 0 ? t.spillKing(king.name, king.sp) : t.noSpill}</p>
      </ZCard>
      <div className="mt-auto flex flex-col gap-3 pt-7">
        <ZButton bg={ACCENT} onClick={replay}>{t.replay}</ZButton>
        <div className="grid grid-cols-2 gap-3">
          <ZButton size="md" bg={ZZ.cream} onClick={() => setPhase("setup")}>{t.players}</ZButton>
          {onReturnToLobby ? <ZButton size="md" bg={INK} color="#fff" onClick={onReturnToLobby}>{t.quit}</ZButton> : <span />}
        </div>
        <div className="mt-1 flex justify-center">
          <IdeaButton game={GAME_FR} kind="idée" bg={ZZ.cream} />
        </div>
      </div>
    </Screen>
  );
}

// ═════════════════════════════════════════════════════════════
// Petits composants d'écran
// ═════════════════════════════════════════════════════════════

function Screen({ bg = ZZ.night, children }: { bg?: string; children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-[100dvh] w-full shrink-0 flex-col"
      style={{ background: zBackground(bg), color: inkOn(bg) === INK ? INK : "#fff", paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2.5 mt-6 text-[22px] leading-none" style={DISPLAY}>{children}</h2>;
}

function NameSticker({ name, bg, style }: { name: string; bg: string; style?: CSSProperties }) {
  return (
    <span
      className="inline-block rounded-[16px] px-3 pb-1 pt-0.5"
      style={{ background: bg, color: inkOn(bg), border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`, rotate: "-2deg", ...style }}
    >
      {name}
    </span>
  );
}

/** Petit verre plein (titre des réglages). */
function MiniGlass() {
  return (
    <svg viewBox="0 0 64 80" width={58} height={72} aria-hidden className="shrink-0" style={{ rotate: "-6deg" }}>
      <path d="M8 10 L14 74 L50 74 L56 10 Z" fill="rgba(220,235,255,0.25)" />
      <path d="M10.5 30 L15 72 L49 72 L53.5 30 Z" fill="#4ECDC4" />
      <ellipse cx={32} cy={30} rx={21.5} ry={4.5} fill="#ABEEEA" stroke={INK} strokeWidth={2.5} />
      <path d="M8 10 L14 74 L50 74 L56 10" fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <ellipse cx={32} cy={10} rx={24} ry={5} fill="none" stroke={INK} strokeWidth={3.5} />
      <path d="M16 20 L19 62" stroke="rgba(255,255,255,0.8)" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// La manche : canvas plein écran + interface par-dessus
// ═════════════════════════════════════════════════════════════

interface Run {
  scene: VerreScene;
  sub: Sub;
  subT: number;
  holder: number;
  turn: number;
  refB: number;
  refG: number;
  tiltX: number;
  tiltZ: number;
  ax: number; ay: number; az: number;
  touch: boolean;
  touchX: number;
  touchZ: number;
  drag: { x0: number; y0: number; bx: number; bz: number; id: number } | null;
  holding: boolean;
  pts: number;
  lastPoured: number;
  trayMul: number;
  passLeft: number;
  passTotal: number;
  nextTick: number;
  tickHigh: boolean;
  event: EventId | null;
  lastBuzz: number;
  lastSlosh: number;
  turbPh: number;
  caught: boolean;
  cause: Cause;
  reported: boolean;
  canCatch: boolean;
}

function RoundPlay({
  players, starter, round, rounds, liquid, liquidName, diff, input: inputRef, notice, onBank, onSpill,
}: {
  players: string[];
  starter: number;
  round: number;
  rounds: number;
  liquid: LiquidStyle;
  liquidName: string;
  diff: Difficulty;
  input: React.RefObject<TiltInput>;
  notice: string | null;
  onBank: (i: number, pts: number) => void;
  onSpill: (loser: number, cause: Cause, level: number, pending: number) => void;
}) {
  const t = useT(VERRE_STR);
  const n = players.length;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const safeRef = useRef<HTMLDivElement | null>(null);
  const ptsRef = useRef<HTMLSpanElement | null>(null);
  const cdRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<SVGCircleElement | null>(null);
  const leakRef = useRef<HTMLDivElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);

  const [sub, setSub] = useState<Sub>("calib");
  const [holder, setHolder] = useState(starter);
  const [event, setEvent] = useState<EventId | null>(null);
  const [canCatch, setCanCatch] = useState(false);
  const [touch, setTouch] = useState(false);
  const [minHint, setMinHint] = useState(false);
  const [cause, setCause] = useState<Cause>("pour");

  const cb = useRef({ onBank, onSpill });
  useLayoutEffect(() => { cb.current = { onBank, onSpill }; }, [onBank, onSpill]);

  // État mutable de la manche (lu/écrit par la boucle d'animation, jamais pendant le rendu)
  const [initialRun] = useState<Run>(() => {
    const scene = new VerreScene();
    scene.diff = DIFF[diff];
    scene.setLiquid(liquid);
    scene.reset(0.15 + Math.random() * 0.06);
    return {
      scene, sub: "calib", subT: 0, holder: starter, turn: 0,
      refB: 0, refG: 0, tiltX: 0, tiltZ: 0, ax: 0, ay: 0, az: 0,
      touch: false, touchX: 0, touchZ: 0, drag: null, holding: false,
      pts: 0, lastPoured: 0, trayMul: 1, passLeft: 0, passTotal: 0, nextTick: 0, tickHigh: true,
      event: null, lastBuzz: 0, lastSlosh: 0, turbPh: Math.random() * 10, caught: false, cause: "pour", reported: false, canCatch: false,
    };
  });
  const run = useRef<Run>(initialRun);

  const setPhaseSub = useCallback((s: Sub) => {
    const r = run.current!;
    r.sub = s;
    r.subT = 0;
    setSub(s);
  }, []);

  // Couleur du blob = couleur du joueur qui tient le tél
  useEffect(() => {
    const pal = MASCOT_PALETTE[colorForIndex(holder)];
    run.current!.scene.mascotColor = pal.body;
    run.current!.scene.mascotDeep = pal.deep;
  }, [holder]);

  // Écran allumé pendant la manche
  useEffect(() => keepAwake(), []);

  // ── Débordement ──
  const spill = useCallback((c: Cause, gi: number) => {
    const r = run.current!;
    if (r.sub === "spill") return;
    r.holding = false;
    r.cause = c;
    r.scene.startSpill(gi);
    setCause(c);
    setPhaseSub("spill");
    playSfx("whooshdown", { volume: 0.7 });
    playSfx("thump", { volume: 0.9, delay: 0.05 });
    playSfx("plate", { volume: 0.5, delay: 0.12, rate: 0.8 });
    playSfx("splash", { volume: 1 });
    playCombo("fail");
    playSfx("crowd-cheer", { volume: 0.5, delay: 0.75 });
    playSfx("laugh", { volume: 0.8, delay: 0.55 });
    vibrate([90, 40, 220]);
  }, [setPhaseSub]);

  // ── Fin du calibrage : événement surprise éventuel, puis on verse ──
  const afterCalib = useCallback(() => {
    const r = run.current!;
    const sc = r.scene;
    const L = sc.main.L;
    const chance = r.turn === 0 ? (round > 1 ? 0.25 : 0) : 0.42;
    let ev: EventId | null = null;
    if (Math.random() < chance) {
      const pool: EventId[] = ["oneHand", "eyes", "spin", "foam", "crack"];
      if (L < 0.7) pool.push("ice", "ice");
      if (L < 0.6) pool.push("small");
      if (L < 0.72) pool.push("tray");
      const choices = pool.filter((e) => e !== r.event);
      ev = choices[Math.floor(Math.random() * choices.length)] ?? null;
    }
    r.event = ev;
    setEvent(ev);
    if (!ev) {
      setPhaseSub("pour");
      return;
    }
    playSfx("rise", { volume: 0.5 });
    playSfx("pop", { volume: 0.7, delay: 0.25 });
    if (ev === "ice") sc.dropIce();
    if (ev === "small") { sc.main.rimTarget = 0.84; playSfx("whooshdown", { volume: 0.5, delay: 0.3 }); }
    if (ev === "crack") {
      const total = diff === "easy" ? 15 : diff === "normal" ? 12 : 9.5;
      sc.crack = { h: 0.2, left: total, total, nextDrip: sc.time + 1.2 };
      playSfx("scratch", { volume: 0.7, delay: 0.2 });
    }
    if (ev === "foam") { sc.foamOn = true; sc.main.foam = 0.03; }
    if (ev === "tray") { sc.addTray(); r.trayMul = 2; playSfx("clink", { volume: 0.7, delay: 0.3 }); }
    setPhaseSub("event");
  }, [round, diff, setPhaseSub]);

  // ── Boucle d'animation (aucun setState par image) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = run.current!;
    const sc = r.scene;
    const input = inputRef.current;
    let dpr = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const cs = safeRef.current ? getComputedStyle(safeRef.current) : null;
      const st = cs ? parseFloat(cs.paddingTop) || 0 : 0;
      const sb = cs ? parseFloat(cs.paddingBottom) || 0 : 0;
      sc.resize(rect.width, rect.height, st, sb);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let alive = true;
    // Boucles sonores : versement (suit le débit) et pétillement léger (boissons gazeuses)
    let pourLoop: LoopHandle | null = null;
    let fizzLoop: LoopHandle | null = null;
    let fizzVol = -1;
    let lastGlug = 0;

    const frame = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      r.subT += dt;

      // ── Entrée : capteurs (lissés) ou doigt ──
      const live = input.live && now - input.last < 1500;
      if (live === r.touch) {
        r.touch = !live;
        setTouch(!live);
      }
      let rx: number;
      let rz: number;
      if (live) {
        if (r.sub === "calib") {
          // le zéro suit la façon dont le joueur tient le tél (borné : pas de triche)
          const k = Math.min(1, dt * 6);
          r.refG += (clamp(input.gamma, -20, 20) - r.refG) * k;
          r.refB += (clamp(input.beta, -20, 20) - r.refB) * k;
        }
        rx = input.gamma - r.refG;
        rz = input.beta - r.refB;
        const ka = 1 - Math.exp(-dt / 0.08);
        r.ax += (input.ax - r.ax) * ka;
        r.ay += (input.ay - r.ay) * ka;
        r.az += (input.az - r.az) * ka;
      } else {
        if (!r.drag) {
          const k = Math.exp(-dt * 4);
          r.touchX *= k;
          r.touchZ *= k;
        }
        rx = r.touchX;
        rz = r.touchZ;
        // pas de capteur : des « mains qui tremblent » pendant le passage, pour garder le suspense
        if (r.sub === "pass") {
          r.turbPh += dt;
          const amp = DIFF[diff].turb * (0.6 + 0.8 * clamp(r.subT / Math.max(1, r.passTotal), 0, 1));
          rx += amp * (3.2 * Math.sin(r.turbPh * 1.9) + 1.6 * Math.sin(r.turbPh * 4.7 + 1));
          rz += amp * (2.2 * Math.sin(r.turbPh * 1.3 + 2) + 1.2 * Math.sin(r.turbPh * 5.3));
        }
        r.ax *= 0.9; r.ay *= 0.9; r.az *= 0.9;
      }
      const ks = 1 - Math.exp(-dt / 0.07);
      r.tiltX += (deg(clamp(rx, -40, 40)) - r.tiltX) * ks;
      r.tiltZ += (deg(clamp(rz, -40, 40)) - r.tiltZ) * ks;
      sc.tiltX = r.tiltX;
      sc.tiltZ = r.tiltZ;
      sc.ax = r.ax; sc.ay = r.ay; sc.az = r.az;
      sc.pouring = r.sub === "pour" && r.holding;
      sc.step(dt);

      // ── Points en direct (plus le verre est plein, plus chaque goutte rapporte) ──
      const dP = sc.poured - r.lastPoured;
      r.lastPoured = sc.poured;
      if (dP > 0 && r.sub !== "spill") {
        r.pts += dP * 100 * (0.6 + 1.2 * sc.main.L) * r.trayMul;
        if (ptsRef.current) ptsRef.current.textContent = `+${Math.round(r.pts)}`;
      }

      // ── Sons de la scène ──
      const pouringNow = sc.streamOn > 0.05 && r.sub !== "spill";
      if (pouringNow) {
        // le versement s'accélère avec le débit (et monte un peu quand le verre se remplit)
        if (!pourLoop) pourLoop = playLoop("pour", { volume: 0, fadeIn: 0.08 });
        pourLoop.setVolume(0.65 * sc.streamOn);
        pourLoop.setRate(0.85 + 0.35 * clamp(sc.pourHeld / 1.3, 0, 1) + 0.15 * sc.main.L);
      } else if (pourLoop) {
        pourLoop(0.18);
        pourLoop = null;
      }
      if (sc.liquid.fizz > 0 && r.sub !== "spill") {
        const v = Math.round(sc.liquid.fizz * (0.05 + 0.1 * clamp(sc.main.L, 0, 1) + 0.08 * sc.streamOn) * 100) / 100;
        if (!fizzLoop) fizzLoop = playLoop("fizz", { volume: v, fadeIn: 0.6 });
        else if (v !== fizzVol) fizzLoop.setVolume(v);
        fizzVol = v;
      } else if (fizzLoop) {
        fizzLoop(0.3);
        fizzLoop = null;
      }
      for (const f of sc.fx) {
        if (f.t === "glug") {
          if (now - lastGlug > 320) { lastGlug = now; playSfx("glug", { volume: 0.3, rate: 0.7 + f.rate * 0.5 }); }
        }
        else if (f.t === "slosh" && now - r.lastSlosh > 260) {
          r.lastSlosh = now;
          playSfx("pop2", { volume: 0.12 + f.v * 0.3, rate: 0.42 + Math.random() * 0.08 });
        } else if (f.t === "plop") { playSfx("clink", { volume: 0.8 }); playSfx("pop", { volume: 0.6, rate: 0.5, delay: 0.03 }); }
        else if (f.t === "drip") playSfx("pluck2", { volume: 0.18, rate: 1.7 });
        else if (f.t === "spray") playSfx("pop2", { volume: 0.2, rate: 1.4 });
      }
      sc.fx.length = 0;

      // ── Ça tangue fort : vibration + vignette rouge ──
      const d = sc.dangerSmooth;
      if (vignetteRef.current) vignetteRef.current.style.opacity = r.sub === "spill" ? "0" : String(clamp((d - 0.55) / 0.4, 0, 1));
      if (d > 0.85 && r.sub !== "spill" && now - r.lastBuzz > 300) {
        r.lastBuzz = now;
        vibrate(18);
      }

      // ── Minuteries des sous-phases ──
      if (r.sub === "calib" && r.subT > 0.95) afterCalib();
      else if (r.sub === "event" && r.subT > 2.1) setPhaseSub("pour");
      else if (r.sub === "pass") {
        r.passLeft -= dt;
        const left = Math.max(0, r.passLeft);
        if (cdRef.current) cdRef.current.textContent = String(Math.ceil(left));
        if (ringRef.current) ringRef.current.style.strokeDashoffset = String(176 * (1 - left / r.passTotal));
        if (now >= r.nextTick && left > 0) {
          const urg = 1 - left / r.passTotal;
          playSfx(r.tickHigh ? "tick" : "tock", { volume: 0.55 + urg * 0.4, rate: 1 + urg * 0.3 });
          r.tickHigh = !r.tickHigh;
          r.nextTick = now + (left < 2 ? 260 : 500);
        }
        if (!r.canCatch && r.subT > 0.6) { r.canCatch = true; setCanCatch(true); }
        if (r.passLeft <= 0) spill("slow", 0);
      }
      if (sc.crack && r.sub !== "spill") {
        if (leakRef.current) leakRef.current.style.width = `${clamp(sc.crack.left / sc.crack.total, 0, 1) * 100}%`;
        if (sc.crack.left <= 0) spill("leak", 0);
      }
      if (r.sub !== "spill") {
        const gi = sc.overflowing();
        if (gi >= 0) spill(r.sub === "pass" ? "pass" : "pour", gi);
      } else if (r.subT > 2.4 && !r.reported) {
        r.reported = true;
        cb.current.onSpill(r.holder, r.cause, sc.main.L, Math.round(r.pts));
      }

      sc.draw(ctx, dpr);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      pourLoop?.(0.1);
      fizzLoop?.(0.1);
    };
  }, [inputRef, diff, afterCalib, setPhaseSub, spill]);

  // ── Mode tactile : on incline en glissant le doigt sur la scène ──
  const onScenePointerDown = (e: React.PointerEvent) => {
    const r = run.current!;
    if (!r.touch || r.drag) return;
    r.drag = { x0: e.clientX, y0: e.clientY, bx: r.touchX, bz: r.touchZ, id: e.pointerId };
  };
  const onScenePointerMove = (e: React.PointerEvent) => {
    const r = run.current!;
    if (!r.drag || r.drag.id !== e.pointerId) return;
    r.touchX = clamp(r.drag.bx + (e.clientX - r.drag.x0) * 0.14, -30, 30);
    r.touchZ = clamp(r.drag.bz + (e.clientY - r.drag.y0) * 0.14, -30, 30);
  };
  const onScenePointerUp = (e: React.PointerEvent) => {
    const r = run.current!;
    if (r.drag && r.drag.id === e.pointerId) r.drag = null;
  };

  // ── Actions ──
  const pourDown = (e: React.PointerEvent) => {
    const r = run.current!;
    if (r.sub !== "pour") return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    r.holding = true;
    setMinHint(false);
  };
  const pourUp = () => { run.current!.holding = false; };

  const done = () => {
    const r = run.current!;
    if (r.sub !== "pour") return;
    if (r.scene.poured < 0.02) {
      setMinHint(true);
      playSfx("error", { volume: 0.5 });
      return;
    }
    r.holding = false;
    r.passTotal = DIFF[diff].passTime + (r.event === "spin" ? 3 : 0);
    r.passLeft = r.passTotal;
    r.nextTick = performance.now() + 400;
    r.canCatch = false;
    setCanCatch(false);
    playSfx("whoosh", { volume: 0.55 });
    playSfx("coin", { volume: 0.4, delay: 0.05 });
    setPhaseSub("pass");
  };

  const caught = () => {
    const r = run.current!;
    if (r.sub !== "pass" || !r.canCatch) return;
    const pts = Math.round(r.pts);
    cb.current.onBank(r.holder, pts);
    playSfx("success", { volume: 0.7 });
    if (pts >= 20) playSfx("coins", { volume: 0.5, delay: 0.12 });
    vibrate(30);
    // fin des effets du tour
    const sc = r.scene;
    sc.main.rimTarget = 1;
    sc.removeTray();
    sc.foamOn = false;
    sc.crack = null;
    sc.poured = 0;
    r.lastPoured = 0;
    r.pts = 0;
    r.trayMul = 1;
    if (ptsRef.current) ptsRef.current.textContent = "+0";
    r.turn += 1;
    const next = (r.holder + 1) % n;
    r.holder = next;
    setHolder(next);
    setEvent(null);
    setMinHint(false);
    setPhaseSub("calib");
  };

  const next = (holder + 1) % n;
  const pal = MASCOT_PALETTE[colorForIndex(holder)];
  const nextPal = MASCOT_PALETTE[colorForIndex(next)];
  const ev = event ? t.events[event] : null;
  const showEvent = sub === "event" && ev && event;
  const evReminder = event && sub !== "event" && sub !== "spill" && (sub === "pass" ? ["oneHand", "eyes", "spin", "crack", "tray", "foam"].includes(event) : ["crack", "tray", "foam", "small"].includes(event));

  return (
    <div
      ref={wrapRef}
      className="relative h-[100dvh] w-full shrink-0 select-none overflow-hidden"
      style={{ background: zBackground(ZZ.night), touchAction: "none", WebkitUserSelect: "none", color: "#fff" }}
      onPointerDown={onScenePointerDown}
      onPointerMove={onScenePointerMove}
      onPointerUp={onScenePointerUp}
      onPointerCancel={onScenePointerUp}
    >
      {/* mesure de la safe-area (lue par le canvas) */}
      <div ref={safeRef} aria-hidden className="pointer-events-none absolute opacity-0" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />
      {/* vignette rouge quand ça va déborder */}
      <div ref={vignetteRef} aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: 0, background: "radial-gradient(ellipse at center, rgba(255,62,108,0) 45%, rgba(255,62,108,0.55) 100%)", transition: "opacity .15s" }} />

      <Tools />

      {/* ── Haut : manche + qui verse + points ── */}
      <div className="pointer-events-none absolute inset-x-0" style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
        <div style={{ paddingLeft: 72, paddingRight: 124 }}>
          <ZChip bg={liquid.body} tilt={-2} style={{ maxWidth: "100%" }}>
            <span className="sr-only">{liquidName} · </span>{t.roundChip(round, rounds)}
          </ZChip>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3 px-4">
          <div className="min-w-0">
            <NameSticker name={players[holder]} bg={pal.body} style={{ ...DISPLAY, fontSize: players[holder].length > 10 ? 22 : 28, lineHeight: 1.05, maxWidth: "62vw", overflowWrap: "anywhere" }} />
            {(sub === "calib" || sub === "pour") && <p className="ml-1 mt-1.5 text-[16px] font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{t.pours}</p>}
          </div>
          <div className="shrink-0 rounded-[18px] px-3 py-1.5 text-right" style={{ background: ZZ.yellow, color: INK, border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`, rotate: "3deg" }}>
            <span ref={ptsRef} className="block text-[30px] leading-none" style={DISPLAY}>+0</span>
            <span className="block text-[13px] font-bold leading-tight">{t.ptsUnit(2)}{event === "tray" ? ` · x2` : ""}</span>
          </div>
        </div>
        {/* rappel de l'événement en cours */}
        {evReminder && ev && event && (
          <div className="mt-3 flex flex-col items-start gap-2 px-4">
            <ZChip bg={EVENT_COLORS[event]} tilt={-2}>{ev.title}</ZChip>
            {event === "crack" && (
              <div className="h-4 w-44 overflow-hidden rounded-full" style={{ background: "#fff", border: `2.5px solid ${INK}` }} aria-label={t.leak}>
                <div ref={leakRef} className="h-full" style={{ width: "100%", background: ZZ.coral }} />
              </div>
            )}
          </div>
        )}
        {touch && notice === null && sub !== "spill" && (
          <div className="mt-3 px-4"><ZChip bg="#fff" tilt={1}><GameInlineIcon icon={Hand} /> {t.touchChip}</ZChip></div>
        )}
        {notice && sub === "calib" && round === 1 && (
          <div className="mx-4 mt-3 rounded-[16px] px-3 py-2 text-[14px] font-bold leading-snug" style={{ background: ZZ.cream, color: INK, border: `2.5px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>{notice}</div>
        )}
      </div>

      {/* ── Gros sticker d'événement surprise ── */}
      {showEvent && (
        <div className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-6" style={{ top: "calc(env(safe-area-inset-top, 0px) + 134px)" }}>
          <div className="w-full max-w-sm px-5 pb-4 pt-3 text-center" style={{ background: EVENT_COLORS[event], color: INK, border: `3.5px solid ${INK}`, boxShadow: `0 7px 0 ${INK}`, borderRadius: 26, animation: "vv-pop .5s cubic-bezier(.2,1.6,.4,1) both" }}>
            <p className="text-[clamp(32px,10vw,44px)] leading-none" style={DISPLAY}>{ev.title}</p>
            <p className="mt-2 text-[16px] font-bold leading-snug">{ev.sub}</p>
          </div>
        </div>
      )}

      {/* ── SPLASH ! ── */}
      {sub === "spill" && (
        <div className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center px-4" style={{ top: "30%" }}>
          <p className="text-center text-[clamp(60px,19vw,92px)] leading-none" style={{ ...DISPLAY, color: ZZ.yellow, WebkitTextStroke: `3px ${INK}`, textShadow: `6px 6px 0 ${INK}`, animation: "vv-pop .45s cubic-bezier(.2,1.6,.4,1) both" }}>
            {cause === "slow" ? t.tooSlow : t.splash}
          </p>
        </div>
      )}

      {/* ── Bas : commandes de la sous-phase ── */}
      <div className="absolute inset-x-0 z-20 px-4" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}>
        {sub === "calib" && (
          <div className="mx-auto flex max-w-md items-center justify-center gap-2.5 rounded-[24px] px-4 py-4" style={{ background: ZZ.cream, color: INK, border: `3px solid ${INK}`, boxShadow: `0 5px 0 ${INK}` }}>
            <Gauge size={24} strokeWidth={2.8} aria-hidden style={{ animation: "vv-spin 1s linear infinite" }} />
            <span className="text-[22px] leading-none" style={DISPLAY}>{t.calib}</span>
          </div>
        )}
        {(sub === "pour" || sub === "event") && (
          <div className="mx-auto max-w-md">
            <p className="mb-2 text-center text-[15px] font-bold" style={{ color: minHint ? ZZ.yellow : "rgba(255,255,255,0.85)" }}>
              {minHint ? t.pourMin : t.pourHold}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onPointerDown={pourDown}
                onPointerUp={pourUp}
                onPointerCancel={pourUp}
                onLostPointerCapture={pourUp}
                onContextMenu={(e) => e.preventDefault()}
                disabled={sub !== "pour"}
                aria-label={t.pourBtn}
                className="vv-press flex min-h-[96px] flex-[1.5] flex-col items-center justify-center rounded-[28px]"
                style={{ background: sub === "pour" ? liquid.body : "#3A2C6E", color: inkOn(liquid.body), border: `3.5px solid ${INK}`, boxShadow: `0 6px 0 ${INK}`, touchAction: "none", WebkitTouchCallout: "none" }}
              >
                <CupSoda size={30} strokeWidth={2.6} aria-hidden style={{ rotate: "-35deg" }} />
                <span className="mt-1 text-[26px] leading-none" style={DISPLAY}>{t.pourBtn}</span>
              </button>
              <button
                type="button"
                onClick={done}
                disabled={sub !== "pour"}
                className="vv-press min-h-[96px] flex-1 rounded-[28px] px-2 text-[21px] leading-[1.05]"
                style={{ ...DISPLAY, background: sub === "pour" ? ZZ.mint : "#3A2C6E", color: INK, border: `3.5px solid ${INK}`, boxShadow: `0 6px 0 ${INK}` }}
              >
                {t.doneBtn}
              </button>
            </div>
          </div>
        )}
        {sub === "pass" && (
          <div className="mx-auto max-w-md rounded-[28px] p-3" style={{ background: nextPal.body, color: inkOn(nextPal.body), border: `3.5px solid ${INK}`, boxShadow: `0 6px 0 ${INK}`, animation: "vv-pop .35s cubic-bezier(.2,1.5,.4,1) both" }}>
            <div className="flex items-center gap-3 px-1">
              <div className="relative grid h-[62px] w-[62px] shrink-0 place-items-center">
                <svg viewBox="0 0 64 64" className="absolute inset-0" aria-hidden>
                  <circle cx={32} cy={32} r={28} fill="#fff" stroke={INK} strokeWidth={3} />
                  <circle ref={ringRef} cx={32} cy={32} r={28} fill="none" stroke={ZZ.coral} strokeWidth={6} strokeDasharray={176} strokeDashoffset={0} transform="rotate(-90 32 32)" strokeLinecap="round" />
                </svg>
                <span ref={cdRef} className="relative text-[26px] leading-none" style={{ ...DISPLAY, color: INK }}>{DIFF[diff].passTime}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[clamp(22px,6.6vw,28px)] leading-[1.02]" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{t.passTo(players[next])}</p>
                <p className="mt-0.5 text-[14px] font-bold leading-snug">
                  {event && ["oneHand", "eyes", "spin"].includes(event) && ev ? ev.title : t.passSub}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={caught}
              disabled={!canCatch}
              aria-label={`${t.gotIt} ${t.gotItHint(players[next])}`}
              className="vv-press mt-3 min-h-[64px] w-full rounded-full text-[28px]"
              style={{ ...DISPLAY, background: "#fff", color: INK, border: `3.5px solid ${INK}`, boxShadow: `0 5px 0 ${INK}`, opacity: canCatch ? 1 : 0.6 }}
            >
              {t.gotIt}
            </button>
          </div>
        )}
      </div>

      <style>{`
@keyframes vv-pop { from { transform: scale(.4) rotate(-8deg); opacity: 0; } to { transform: scale(1) rotate(-2deg); opacity: 1; } }
@keyframes vv-spin { to { transform: rotate(360deg); } }
.vv-press { transition: transform .1s ease, box-shadow .1s ease; -webkit-tap-highlight-color: transparent; }
.vv-press:not(:disabled):active { transform: translateY(4px); box-shadow: 0 2px 0 ${INK} !important; }
`}</style>
    </div>
  );
}
