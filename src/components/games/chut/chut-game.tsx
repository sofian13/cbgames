"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, BookOpen, Crown, CupSoda, Drama, Ear, Hand, Library, Mic, MicOff, Music, ShieldCheck, Shuffle, Skull, Sofa, Sparkles, Star, TrendingDown, TrendingUp, Trophy, Users, X } from "lucide-react";
import type { GameProps } from "@/lib/games/types";
import { getLang, useT } from "@/lib/i18n";
import { adultDefault, sipsAllowed } from "@/lib/party-mood";
import { playCombo, playSfx, preloadSfx, type SfxName } from "@/lib/sfx";
import { Mascot } from "@/components/Mascot";
import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { GameIconButton, GameTopRight } from "@/components/games/game-icon-button";
import { IdeaButton } from "@/components/games/idea-button";
import {
  DISPLAY, PassScreen, PlayersSetup, SoundButton, ZButton, ZCard, ZChip, ZChoice, ZLink, ZRanking, ZScreen, ZTitle, ZZ,
  colorForIndex, inkOn, useScrollTopOn,
} from "@/components/games/local-kit";
import { CHUT_STR, chutContent } from "./i18n";
import type { Ammo, ChutContent } from "./types";
import { MicMeter, floorFrom, gaugeOf, holdMsFor, thresholdFor, type MicError, type Sensitivity } from "./mic";
import { MODES_STR } from "./modes-i18n";
import { MODE_IDS, pickOne, roll3, secs, shuffle, vibrate, type ModeCommon, type ModeId, type Penalty } from "./modes";
import { modesContent } from "./content-modes";
import { ChutStyles, Countdown, Section, SentenceCard, useReducedMotion, type Sentence } from "./shared";
import { ModeArt } from "./gauges";
import { VolumeMode, buildVolume, type VolumeTurnPlan } from "./mode-volume";
import { WhisperMode, TEAM_COLORS, splitTeams, type WhisperPlan } from "./mode-whisper";
import { CrescendoMode, type CrescendoPlan } from "./mode-crescendo";
import { SouffleMode, type SoufflePlan } from "./mode-souffle";
import { ChutBlob, NoiseMeter } from "./visuals";
import { useGameFinished } from "@/lib/game-finished";
import { ShareResultButton } from "@/components/games/share-result-button";
import { chutCard } from "@/lib/share-cards";
import { GameTuto, TutoAgainButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { useChutTuto } from "./tuto";

// ── Chut ! ────────────────────────────────────────────────
// Jeux au micro, au choix : « Le bon volume » (mode phare), « Chuchote-le ! »,
// « Crescendo », « Le Souffle » (mode-*.tsx), le duel « Ne ris pas ! » et « Silence
// total » (ici). Le micro entend un bruit mais pas QUI l'a fait : chaque mode écoute
// soit celui qui tient le tél près de sa bouche, soit une équipe, soit toute la table.
// Duel : le Clown a 30 s pour faire craquer le Sérieux ; il ne parle qu'en maintenant
// « À moi ! » (micro en pause), puis 3 s de « silence qui tue ». Le micro ne mesure que
// le volume (rien n'est enregistré) et il est libéré dès que la manche finit.
// Calibrage une fois par partie. Sans micro : la table arbitre avec des boutons.

const INK = ZZ.ink;
const ACCENT = ZZ.pink;
const DUEL_MS = 30000;
const SUDDEN_MS = 15000;
const TABLE_MS = 30000;
const SILENCE_MS = 3000;
const MAX_TALK_MS = 8000;
const TICK = 50;

type Format = "rotation" | "ko";
interface Settings {
  mode: ModeId; format: Format; tours: number; sens: Sensitivity; penalty: Penalty; adult: boolean; human: boolean;
  /** Le bon volume / Le Souffle : nombre de tours */
  vTours: number;
  /** Chuchote-le ! : équipes et manches par équipe */
  teams: [number[], number[]] | null; wRounds: number;
  /** Crescendo : sens et nombre de chutes */
  up: boolean; falls: number;
}
type Plan =
  | { mode: "volume"; turns: VolumeTurnPlan[] }
  | { mode: "whisper"; plan: WhisperPlan }
  | { mode: "crescendo"; plan: CrescendoPlan }
  | { mode: "souffle"; plan: SoufflePlan };

interface Duel { serious: number; clown: number; ms: number; sudden?: boolean }
interface DuelResult { serious: number; clown: number; heldMs: number; cracked: boolean; ms: number }
interface Match { a: number; b: number; legs: DuelResult[]; winner: number | null; coin: boolean }
interface Ko { round: number; left: number; matches: Match[]; bye: number | null; cur: number; out: number[][]; byes: number[]; champion: number | null }
type Screen = "players" | "modes" | "config" | "calib" | "play" | "pass" | "arena" | "result" | "bracket" | "table" | "tableWho" | "tableResult" | "end";

const SFX: SfxName[] = ["ding", "correct", "wrong", "rise", "confirm", "buzzer", "crowd-cheer", "laugh", "drumroll", "drumroll-end", "tada", "applause", "whistle", "pop", "card-flip", "whoosh", "select", "scratch", "pluck", "boom", "coin", "twotone", "glass", "thump", "bell", "pep", "pop2", "crowd-aww", "firecracker", "gong", "explosion", "back", "card-shuffle"];

/** Rotation : chacun passe Sérieux une fois par tour, face à un Clown différent à chaque tour. */
function buildRotation(n: number, tours: number): Duel[] {
  const order = shuffle([...Array(n).keys()]);
  const out: Duel[] = [];
  for (let t = 0; t < tours; t++) {
    const off = 1 + (t % (n - 1));
    order.forEach((p, i) => out.push({ serious: p, clown: order[(i + off) % n], ms: DUEL_MS }));
  }
  return out;
}

/** Élimination : un tour de tableau (exempté au hasard si nombre impair). */
function koRound(entrants: number[], round: number, out: number[][], byes: number[]): Ko {
  let list = shuffle(entrants);
  let bye: number | null = null;
  if (list.length % 2 === 1) {
    const fresh = list.filter((p) => !byes.includes(p));
    bye = pickOne(fresh.length ? fresh : list);
    list = list.filter((p) => p !== bye);
  }
  const matches: Match[] = [];
  for (let i = 0; i < list.length; i += 2) matches.push({ a: list[i], b: list[i + 1], legs: [], winner: null, coin: false });
  return { round, left: entrants.length, matches, bye, cur: 0, out, byes: bye != null ? [...byes, bye] : byes, champion: null };
}
function legDuel(m: Match): Duel {
  const leg = m.legs.length;
  const a = leg % 2 === 0;
  return { serious: a ? m.a : m.b, clown: a ? m.b : m.a, ms: leg >= 2 ? SUDDEN_MS : DUEL_MS, sudden: leg >= 2 };
}
function settle(m: Match): Match {
  const n = m.legs.length;
  if (n % 2 === 1) return m;
  const [x, y] = m.legs.slice(n - 2);
  if (x.heldMs !== y.heldMs) return { ...m, winner: x.heldMs > y.heldMs ? m.a : m.b };
  if (n >= 4) return { ...m, winner: Math.random() < 0.5 ? m.a : m.b, coin: true };
  return m;
}
function koAfter(ko: Ko): Ko {
  if (ko.cur + 1 < ko.matches.length) return { ...ko, cur: ko.cur + 1 };
  const winners = ko.matches.map((m) => m.winner!);
  if (ko.bye != null) winners.push(ko.bye);
  const out = [...ko.out, ko.matches.map((m) => (m.winner === m.a ? m.b : m.a))];
  if (winners.length === 1) return { ...ko, cur: ko.matches.length, out, champion: winners[0] };
  return koRound(winners, ko.round + 1, out, ko.byes);
}

// Sons ridicules du mode « Toute la table » : [son, vitesse, délai] + durée totale (s)
const SKETCHES: { s: [SfxName, number, number][]; len: number }[] = [
  { s: [["pop2", 0.5, 0], ["pop2", 0.45, 0.18], ["pop2", 0.4, 0.36]], len: 0.8 },
  { s: [["scratch", 1.5, 0]], len: 0.6 },
  { s: [["pluck", 0.8, 0], ["pluck", 1, 0.12], ["pluck", 1.25, 0.24], ["pluck", 1.6, 0.36], ["pluck", 2, 0.48]], len: 0.8 },
  { s: [["whistle", 0.7, 0]], len: 2.5 },
  { s: [["crowd-aww", 1.7, 0]], len: 1.6 },
  { s: [["boom", 2.2, 0]], len: 0.7 },
  { s: [["coin", 0.5, 0]], len: 2.8 },
  { s: [["twotone", 0.6, 0]], len: 3.4 },
  { s: [["tada", 0.55, 0]], len: 4.2 },
  { s: [["glass", 1, 0], ["glass", 1.3, 0.15], ["glass", 0.7, 0.3]], len: 0.7 },
  { s: [["thump", 0.6, 0], ["thump", 0.6, 0.4], ["thump", 0.6, 0.8]], len: 1.8 },
  { s: [["bell", 2, 0], ["bell", 0.5, 0.3]], len: 4.1 },
  { s: [["pep", 0.5, 0], ["rise", 0.5, 0.2], ["pep", 2, 0.45]], len: 0.9 },
  { s: [["applause", 2.2, 0]], len: 2 },
  { s: [["firecracker", 0.6, 0]], len: 1.5 },
];

// ══════════════════════════════════════════════════════════
export default function ChutGame({ onReturnToLobby }: GameProps) {
  const t = useT(CHUT_STR);
  const m = useT(MODES_STR);
  const reduced = useReducedMotion();
  const [sipsOk] = useState(() => sipsAllowed(true)); // mode sans alcool / Soirée « Chill » : gages seulement
  const [players, setPlayers] = useState<string[]>([]);
  const [screen, setScreen] = useState<Screen>("players");
  useGameFinished(screen === "end"); // fin de partie → demande de note éventuelle (app)
  const [settings, setSettings] = useState<Settings>(() => ({
    mode: "volume", format: "rotation", tours: 1, sens: "living",
    penalty: sipsOk ? "sips" : "dares", adult: adultDefault(false), human: false,
    vTours: 2, teams: null, wRounds: 2, up: true, falls: 3,
  }));
  const [plan, setPlan] = useState<Plan | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  // Tuto général 1re fois (dès l'ouverture, avant les joueurs), relançable depuis les règles / réglages
  const tuto = useFirstTimeTuto("chut", { atMount: true });
  const tutoSlides = useChutTuto();
  const [toast, setToast] = useState<string | null>(null);

  // Duel
  const [queue, setQueue] = useState<Duel[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [ko, setKo] = useState<Ko | null>(null);
  const [duel, setDuel] = useState<Duel | null>(null);
  const [card, setCard] = useState<Ammo | null>(null);
  const [results, setResults] = useState<DuelResult[]>([]);
  const [last, setLast] = useState<DuelResult | null>(null);
  const [resumeMs, setResumeMs] = useState(0);
  const [sentence, setSentence] = useState<Sentence | null>(null);

  // Toute la table
  const [tableRound, setTableRound] = useState(1);
  const [tableCracks, setTableCracks] = useState<number[]>([]);
  const [culprit, setCulprit] = useState<number | null>(null);
  const [tableElapsed, setTableElapsed] = useState(0);
  const [firstScene, setFirstScene] = useState("");

  // Contenu figé dans la langue du début de partie ; pioches sans répétition
  const content = useRef<ChutContent | null>(null);
  const deck = useRef<{ list: Ammo[]; i: number }>({ list: [], i: 0 });
  const scenes = useRef<{ list: string[]; i: number }>({ list: [], i: 0 });

  useScrollTopOn(screen);
  useEffect(() => { preloadSfx(SFX); }, []);

  const drawAmmo = useCallback((): Ammo => {
    const d = deck.current;
    if (d.i >= d.list.length) {
      const c = content.current ?? chutContent(getLang());
      d.list = shuffle([...c.ammo, ...(settings.adult ? c.adult : [])]);
      d.i = 0;
    }
    return d.list[d.i++];
  }, [settings.adult]);
  const drawScene = useCallback((): string => {
    const d = scenes.current;
    if (d.i >= d.list.length) {
      d.list = shuffle((content.current ?? chutContent(getLang())).table);
      d.i = 0;
    }
    return d.list[d.i++];
  }, []);
  const newSentence = (): Sentence => ({
    sips: settings.penalty === "sips" && sipsOk ? roll3() : null,
    dare: pickOne((content.current ?? chutContent(getLang())).dares),
  });
  const otherDare = (s: Sentence): Sentence => {
    const dares = (content.current ?? chutContent(getLang())).dares.filter((d) => d !== s.dare);
    return { ...s, dare: pickOne(dares) };
  };
  const rerollDare = () => {
    if (sentence) setSentence(otherDare(sentence));
  };
  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  // ── Démarrage de partie ──
  const begin = (s: Settings = settings) => {
    content.current = chutContent(getLang());
    deck.current = { list: [], i: 0 };
    scenes.current = { list: [], i: 0 };
    setResults([]);
    if (s.mode === "volume" || s.mode === "whisper" || s.mode === "crescendo" || s.mode === "souffle") {
      const mc = modesContent(getLang());
      const n = players.length;
      if (s.mode === "volume") setPlan({ mode: "volume", turns: buildVolume(n, s.vTours, mc) });
      else if (s.mode === "whisper") setPlan({ mode: "whisper", plan: { teams: s.teams ?? splitTeams(n), rounds: s.wRounds, words: shuffle(mc.words) } });
      else if (s.mode === "crescendo") setPlan({ mode: "crescendo", plan: { up: s.up, falls: s.falls, order: shuffle([...Array(n).keys()]) } });
      else setPlan({ mode: "souffle", plan: { order: shuffle([...Array(n).keys()]), tours: s.vTours } });
      setScreen("play");
      return;
    }
    if (s.mode === "table") {
      setTableRound(1);
      setTableCracks(players.map(() => 0));
      setTableElapsed(0);
      setFirstScene(drawScene());
      setScreen("table");
      return;
    }
    if (s.format === "rotation") {
      const q = buildRotation(players.length, s.tours);
      setQueue(q);
      setQIdx(0);
      setKo(null);
      goDuel(q[0]);
    } else {
      const k = koRound([...players.keys()], 1, [], []);
      setKo(k);
      setQueue([]);
      goDuel(legDuel(k.matches[0]));
    }
  };
  const goDuel = (d: Duel) => {
    setDuel(d);
    setCard(drawAmmo());
    setResumeMs(0);
    setScreen("pass");
  };
  const afterConfig = () => {
    playSfx("confirm", { volume: 0.6 });
    // calibrage une seule fois par partie (gardé pour les revanches et changements de mode)
    if (settings.human || floor != null) begin();
    else setScreen("calib");
  };
  const pickMode = (id: ModeId) => {
    playSfx("select", { volume: 0.5 });
    setSettings((s) => ({ ...s, mode: id, teams: id === "whisper" && !s.teams ? splitTeams(players.length) : s.teams }));
    setScreen("config");
  };
  const micFailed = (e: MicError) => {
    void e;
    setSettings((s) => ({ ...s, human: true }));
    flash(t.micLost);
  };

  // ── Fin d'un duel ──
  const endDuel = (heldMs: number, cracked: boolean) => {
    if (!duel) return;
    const res: DuelResult = { serious: duel.serious, clown: duel.clown, heldMs: Math.min(duel.ms, heldMs), cracked, ms: duel.ms };
    setLast(res);
    setResults((r) => [...r, res]);
    if (ko) {
      const m = settle({ ...ko.matches[ko.cur], legs: [...ko.matches[ko.cur].legs, res] });
      setKo({ ...ko, matches: ko.matches.map((x, i) => (i === ko.cur ? m : x)) });
    }
    if (cracked) {
      setSentence(newSentence());
      playSfx("buzzer", { volume: 0.8 });
      playSfx("laugh", { volume: 0.8, delay: 0.25 });
      vibrate([70, 50, 260]);
    } else {
      setSentence(null);
      playCombo("fanfare");
      vibrate(40);
    }
    setScreen("result");
  };
  const falseAlarm = () => {
    if (!last || !duel) return;
    // On annule le dernier résultat et on reprend là où le chrono s'était arrêté
    setResults((r) => r.slice(0, -1));
    if (ko) {
      const m0 = ko.matches[ko.cur];
      const m = { ...m0, legs: m0.legs.slice(0, -1), winner: null, coin: false };
      setKo({ ...ko, matches: ko.matches.map((x, i) => (i === ko.cur ? m : x)) });
    }
    setResumeMs(last.heldMs);
    setLast(null);
    playSfx("whoosh", { volume: 0.5 });
    setScreen("arena");
  };
  const nextAfterResult = () => {
    if (ko) {
      const m = ko.matches[ko.cur];
      if (m.winner == null) { goDuel(legDuel(m)); return; }
      playCombo("reveal");
      setScreen("bracket");
      return;
    }
    if (qIdx + 1 < queue.length) {
      setQIdx(qIdx + 1);
      goDuel(queue[qIdx + 1]);
    } else finish();
  };
  const nextAfterBracket = () => {
    if (!ko) return;
    const k = koAfter(ko);
    setKo(k);
    if (k.champion != null) { finish(); return; }
    goDuel(legDuel(k.matches[k.cur]));
  };
  const finish = () => {
    playCombo("drumroll", { duration: 1.2 });
    window.setTimeout(() => playCombo("fanfare"), 1250);
    setScreen("end");
  };

  // ── Toute la table ──
  const tableCrack = (elapsed: number) => {
    setTableElapsed(elapsed);
    playSfx("buzzer", { volume: 0.8 });
    playSfx("laugh", { volume: 0.8, delay: 0.25 });
    vibrate([70, 50, 260]);
    setScreen("tableWho");
  };
  const tableSurvive = () => {
    setCulprit(null);
    setSentence(null);
    playCombo("fanfare");
    setScreen("tableResult");
  };
  const blame = (p: number) => {
    setCulprit(p);
    setTableCracks((c) => c.map((v, i) => (i === p ? v + 1 : v)));
    setSentence(newSentence());
    playSfx("gong", { volume: 0.6 });
    setScreen("tableResult");
  };
  const nextTableRound = () => {
    setTableRound((r) => r + 1);
    setTableElapsed(0);
    setFirstScene(drawScene());
    setScreen("table");
  };

  const tools = <GameIconButton icon={BookOpen} label={t.rulesLabel} onClick={() => setRulesOpen(true)} />;
  const overlays = (
    <>
      {rulesOpen && <RulesSheet mode={screen === "modes" || screen === "players" ? null : settings.mode} onClose={() => setRulesOpen(false)} onTuto={() => { setRulesOpen(false); tuto.show(); }} />}
      {tuto.open && <GameTuto slides={tutoSlides} onDone={tuto.close} />}
      {toast && (
        <div className="fixed inset-x-0 z-50 flex justify-center px-5" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
          <ZCard bg={ZZ.yellow} className="px-4 py-3 text-center text-[15px] font-bold" shadow={4}>{toast}</ZCard>
        </div>
      )}
    </>
  );

  // ══ Joueurs ══
  if (screen === "players") {
    return (
      <>
      <PlayersSetup
        emoji="🤫"
        name={t.name}
        min={2}
        max={12}
        accent={ACCENT}
        onStart={(names) => {
          setPlayers(names);
          // nouvelle liste de joueurs : équipes à refaire
          setSettings((s) => ({ ...s, teams: null, mode: s.mode === "whisper" && names.length < 4 ? "volume" : s.mode }));
          setScreen("modes");
        }}
        footer={<IdeaButton game={t.name} kind="carte" bg={ZZ.cream} />}
      />
      {tuto.open && <GameTuto slides={tutoSlides} onDone={tuto.close} />}
      </>
    );
  }

  // ══ Choix du mode ══
  if (screen === "modes") {
    const tint: Record<ModeId, string> = { volume: ZZ.yellow, whisper: ZZ.pink, crescendo: ZZ.coral, souffle: ZZ.mint, duel: ZZ.sky, table: ZZ.cream };
    return (
      <ZScreen tools={tools}>
        {overlays}
        <ChutStyles />
        <div className="flex items-end gap-3">
          <ChutBlob size={84} color="yellow" state="calm" />
          <div className="min-w-0 pb-1">
            <ZTitle size="clamp(34px, 10.5vw, 46px)" as="h1">{m.modesTitle}</ZTitle>
          </div>
        </div>
        <p className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{m.modesSub}</p>
        <div className="mt-5 flex flex-col gap-3">
          {MODE_IDS.map((id, i) => {
            const locked = id === "whisper" && players.length < 4;
            return (
              <button
                key={id}
                type="button"
                disabled={locked}
                onClick={() => pickMode(id)}
                className="relative flex min-h-[92px] w-full items-center gap-3 rounded-[24px] p-3 text-left transition-[translate,box-shadow] duration-100 active:translate-y-[3px] active:shadow-[0_1px_0_#15082E] disabled:active:translate-y-0"
                style={{
                  background: locked ? "#3A2C6E" : tint[id],
                  color: locked ? "rgba(255,255,255,0.75)" : ZZ.ink,
                  border: `3px solid ${ZZ.ink}`,
                  boxShadow: `0 ${i === 0 ? 6 : 4}px 0 ${ZZ.ink}`,
                  rotate: i % 2 ? "0.6deg" : "-0.6deg",
                  touchAction: "manipulation",
                }}
              >
                {i === 0 && (
                  <span className="absolute -right-2 -top-3 inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-[13px] font-extrabold" style={{ background: ZZ.pink, color: "#fff", border: `2.5px solid ${ZZ.ink}`, rotate: "4deg" }}>
                    <Star size={13} strokeWidth={3} aria-hidden /> {m.star}
                  </span>
                )}
                <span className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-[18px]" style={{ background: ZZ.night, border: `2.5px solid ${ZZ.ink}` }}>
                  <ModeArt mode={id} size={54} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[22px] leading-tight" style={DISPLAY}>{m.modeName[id]}</span>
                  <span className="mt-0.5 block text-[14px] font-semibold leading-snug">{m.modeSub[id]}</span>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-extrabold" style={{ background: locked ? "transparent" : "rgba(255,255,255,0.7)", border: `2px solid ${locked ? "rgba(255,255,255,0.5)" : ZZ.ink}` }}>
                    {id === "whisper" || id === "table" ? <Users size={12} strokeWidth={3} aria-hidden /> : <Mic size={12} strokeWidth={3} aria-hidden />}
                    {locked ? m.min4 : m.modeWho[id]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto pt-6">
          <p className="flex items-center justify-center gap-1.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
            <ShieldCheck size={16} strokeWidth={2.6} aria-hidden /> {t.noRecord}
          </p>
          <div className="mt-2 flex justify-center"><IdeaButton game={t.name} kind="carte" bg={ZZ.cream} /></div>
        </div>
      </ZScreen>
    );
  }

  // ══ Réglages du mode choisi ══
  if (screen === "config") {
    const mode = settings.mode;
    const nDuels = settings.format === "rotation" ? players.length * settings.tours : null;
    const set = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));
    const mic = mode !== "duel" && mode !== "table";
    const teams = settings.teams;
    return (
      <ZScreen tools={tools}>
        {overlays}
        <ChutStyles />
        <div className="flex items-center gap-3">
          <span className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-[22px]" style={{ background: ZZ.night, border: `3px solid ${ZZ.ink}`, boxShadow: `0 4px 0 ${ZZ.ink}`, rotate: "-3deg" }}>
            <ModeArt mode={mode} size={66} />
          </span>
          <div className="min-w-0">
            <ZTitle size="clamp(32px, 10vw, 44px)" as="h1">{m.modeName[mode]}</ZTitle>
            <p className="mt-1 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{m.modeSub[mode]}</p>
          </div>
        </div>

        {/* Le tuto : 3 étapes */}
        <ZCard bg={ZZ.cream} className="mt-5 p-4" shadow={5} radius={24} tilt={-0.6}>
          <p className="text-[19px]" style={DISPLAY}>{m.howTo}</p>
          <ol className="mt-2 flex flex-col gap-2">
            {m.steps[mode].map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] font-semibold leading-snug">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[14px]" style={{ ...DISPLAY, background: [ZZ.yellow, ZZ.pink, ZZ.sky][i % 3], border: `2.5px solid ${ZZ.ink}` }}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </ZCard>
        <TutoAgainButton className="mt-1" onClick={tuto.show} />

        {(mode === "volume" || mode === "souffle") && (
          <Section title={m.secTours}>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3].map((n) => (
                <ZChoice key={n} active={settings.vTours === n} onClick={() => set({ vTours: n })} color={ZZ.mint} className="px-3.5 py-2 text-center text-[15px] font-bold" style={{ borderRadius: 999 }}>
                  {m.tours(n)}
                </ZChoice>
              ))}
              <span className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{m.phrasesCount(players.length * settings.vTours)}</span>
            </div>
          </Section>
        )}

        {mode === "whisper" && teams && (
          <Section title={m.secTeams}>
            <div className="grid grid-cols-2 gap-3">
              {teams.map((list, k) => (
                <ZCard key={k} bg={TEAM_COLORS[k]} tilt={k ? 1 : -1} shadow={4} className="p-3">
                  <p className="text-[18px] leading-tight" style={DISPLAY}>{m.teamNames[k]}</p>
                  <ul className="mt-1.5 flex flex-col gap-0.5">
                    {list.map((p) => <li key={p} className="truncate text-[15px] font-bold">{players[p]}</li>)}
                  </ul>
                </ZCard>
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <ZButton size="sm" bg="#fff" className="w-auto" onClick={() => { playSfx("card-shuffle", { volume: 0.5 }); set({ teams: splitTeams(players.length) }); }}>
                <Shuffle size={16} strokeWidth={2.8} aria-hidden /> {m.shuffleTeams}
              </ZButton>
            </div>
          </Section>
        )}
        {mode === "whisper" && (
          <Section title={m.secRounds}>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3].map((n) => (
                <ZChoice key={n} active={settings.wRounds === n} onClick={() => set({ wRounds: n })} color={ZZ.mint} label={m.roundsPerTeam(n)} className="min-w-12 px-3.5 py-2 text-center text-[17px] font-bold" style={{ borderRadius: 999 }}>
                  {n}
                </ZChoice>
              ))}
              <span className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{m.roundsPerTeam(settings.wRounds)} · 60 s</span>
            </div>
          </Section>
        )}

        {mode === "crescendo" && (
          <>
            <Section title={m.secDirection}>
              <div className="grid grid-cols-2 gap-3">
                <ZChoice active={settings.up} onClick={() => set({ up: true })} color={ZZ.coral} tilt={-1.5}>
                  <TrendingUp size={24} strokeWidth={2.6} aria-hidden />
                  <p className="mt-1 text-[19px] leading-none" style={DISPLAY}>{m.dirUp}</p>
                  <p className="mt-1 text-[13px] font-semibold leading-snug">{m.dirUpSub}</p>
                </ZChoice>
                <ZChoice active={!settings.up} onClick={() => set({ up: false })} color={ZZ.sky} tilt={1.5}>
                  <TrendingDown size={24} strokeWidth={2.6} aria-hidden />
                  <p className="mt-1 text-[19px] leading-none" style={DISPLAY}>{m.dirDown}</p>
                  <p className="mt-1 text-[13px] font-semibold leading-snug">{m.dirDownSub}</p>
                </ZChoice>
              </div>
            </Section>
            <Section title={m.secFalls}>
              <div className="flex flex-wrap items-center gap-2">
                {[3, 5, 7].map((n) => (
                  <ZChoice key={n} active={settings.falls === n} onClick={() => set({ falls: n })} color={ZZ.mint} className="px-3.5 py-2 text-center text-[15px] font-bold" style={{ borderRadius: 999 }}>
                    {m.falls(n)}
                  </ZChoice>
                ))}
              </div>
              <p className="mt-2 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{m.fallsSub}</p>
            </Section>
          </>
        )}

        {mode === "duel" && (
          <Section title={t.secFormat}>
            <div className="flex flex-col gap-3">
              <ZChoice active={settings.format === "rotation"} onClick={() => set({ format: "rotation" })} color={ZZ.mint}>
                <p className="text-[19px] leading-none" style={DISPLAY}>{t.formatRotation}</p>
                <p className="mt-1 text-[14px] font-semibold leading-snug">{t.formatRotationSub}</p>
              </ZChoice>
              {settings.format === "rotation" && (
                <div className="flex flex-wrap items-center gap-2 pl-1">
                  {[1, 2, 3].map((n) => (
                    <ZChoice key={n} active={settings.tours === n} onClick={() => set({ tours: n })} color={ZZ.mint} className="px-3.5 py-2 text-center text-[15px] font-bold" style={{ borderRadius: 999 }}>
                      {t.tours(n)}
                    </ZChoice>
                  ))}
                  {nDuels != null && <span className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.duelsCount(nDuels)}</span>}
                </div>
              )}
              <ZChoice active={settings.format === "ko"} onClick={() => set({ format: "ko" })} color={ZZ.coral}>
                <p className="text-[19px] leading-none" style={DISPLAY}>{t.formatKo}</p>
                <p className="mt-1 text-[14px] font-semibold leading-snug">{t.formatKoSub}</p>
              </ZChoice>
            </div>
          </Section>
        )}

        <Section title={mic ? m.secMic : t.secSens}>
          <div className="flex flex-col gap-2.5">
            {mic && mode !== "whisper" && (
              <ZChoice active={!settings.human} onClick={() => set({ human: false })} color={ZZ.yellow} className="flex items-center gap-3 px-3.5 py-2.5">
                <Mic size={24} strokeWidth={2.6} aria-hidden className="shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[18px] leading-tight" style={DISPLAY}>{m.micOn}</span>
                  <span className="block text-[14px] font-semibold leading-snug">{m.micOnSub}</span>
                </span>
              </ZChoice>
            )}
            {(!mic || mode === "whisper") && ([
              { id: "library", icon: Library, title: t.sensLibrary, sub: t.sensLibrarySub, c: ZZ.mint },
              { id: "living", icon: Sofa, title: t.sensLiving, sub: t.sensLivingSub, c: ZZ.yellow },
              { id: "club", icon: Music, title: t.sensClub, sub: t.sensClubSub, c: ZZ.coral },
            ] as const).map((o, i) => (
              <ZChoice key={o.id} active={!settings.human && settings.sens === o.id} onClick={() => set({ sens: o.id, human: false })} color={o.c} tilt={i === 1 ? 1 : -1} className="flex items-center gap-3 px-3.5 py-2.5">
                <o.icon size={24} strokeWidth={2.6} aria-hidden className="shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[18px] leading-tight" style={DISPLAY}>{o.title}</span>
                  <span className="block text-[14px] font-semibold leading-snug">{mode === "whisper" ? m.wSens[o.id] : o.sub}</span>
                </span>
              </ZChoice>
            ))}
            <ZChoice active={settings.human} onClick={() => set({ human: !settings.human })} color={ZZ.cream} className="flex items-center gap-3 px-3.5 py-2.5">
              <MicOff size={24} strokeWidth={2.6} aria-hidden className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-[18px] leading-tight" style={DISPLAY}>{t.humanTitle}</span>
                <span className="block text-[14px] font-semibold leading-snug">{m.humanSub[mode]}</span>
              </span>
            </ZChoice>
          </div>
        </Section>

        {sipsOk && <Section title={mode === "whisper" ? m.secPenaltyTeam : mode === "duel" || mode === "table" || mode === "crescendo" ? t.secPenalty : m.secPenaltyLast}>
          <div className="grid grid-cols-2 gap-3">
            <ZChoice active={settings.penalty === "dares"} onClick={() => set({ penalty: "dares" })} color={ZZ.sky}>
              <Drama size={22} strokeWidth={2.6} aria-hidden />
              <p className="mt-1 text-[18px] leading-none" style={DISPLAY}>{t.dareTitle}</p>
              <p className="mt-1 text-[13px] font-semibold leading-snug">{t.dareSub}</p>
            </ZChoice>
            <ZChoice active={settings.penalty === "sips"} onClick={() => set({ penalty: "sips" })} color={ZZ.pink}>
              <CupSoda size={22} strokeWidth={2.6} aria-hidden />
              <p className="mt-1 text-[18px] leading-none" style={DISPLAY}>{t.sipsTitle}</p>
              <p className="mt-1 text-[13px] font-semibold leading-snug">{t.sipsSub}</p>
            </ZChoice>
          </div>
        </Section>}

        {mode === "duel" && (
          <Section title={t.secAmmo}>
            <div className="flex flex-col gap-3">
              <ZChoice active={settings.adult} onClick={() => set({ adult: !settings.adult })} color={ZZ.pink}>
                <p className="text-[18px] leading-none" style={DISPLAY}>{t.adultTitle}</p>
                <p className="mt-1 text-[14px] font-semibold leading-snug">{t.adultSub}</p>
              </ZChoice>
            </div>
          </Section>
        )}

        <div className="mt-auto pt-7">
          <ZButton bg={ACCENT} onClick={afterConfig}>{settings.human || floor != null ? t.go : t.toCalib}</ZButton>
          {!settings.human && floor != null && (
            <ZLink onClick={() => { playSfx("select", { volume: 0.5 }); setScreen("calib"); }}>
              <Ear size={16} strokeWidth={2.6} aria-hidden /> {m.calibrated} · {m.recalib}
            </ZLink>
          )}
          <ZLink onClick={() => { playSfx("back", { volume: 0.5 }); setScreen("modes"); }}>
            <ArrowLeft size={16} strokeWidth={2.6} aria-hidden /> {m.changeMode}
          </ZLink>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
            <ShieldCheck size={16} strokeWidth={2.6} aria-hidden /> {t.noRecord}
          </p>
        </div>
      </ZScreen>
    );
  }

  // ══ Calibrage ══
  if (screen === "calib") {
    return (
      <>
        {overlays}
        <Calibration
          sens={settings.sens}
          tools={tools}
          onDone={(f) => { setFloor(f); begin(); }}
          onHuman={() => { const s = { ...settings, human: true }; setSettings(s); begin(s); }}
        />
      </>
    );
  }

  // ══ Modes micro (Le bon volume, Chuchote-le !, Crescendo, Le Souffle) ══
  if (screen === "play" && plan) {
    const common: ModeCommon = {
      players, floor, human: settings.human, sens: settings.sens, tools, overlays,
      onMicFail: micFailed,
      onReplay: () => { playSfx("whoosh", { volume: 0.5 }); setPlan(null); setScreen("modes"); },
      onQuit: onReturnToLobby,
      newSentence, rerollDare: otherDare, flash,
    };
    if (plan.mode === "volume") return <VolumeMode {...common} plan={plan.turns} />;
    if (plan.mode === "whisper") return <WhisperMode {...common} plan={plan.plan} />;
    if (plan.mode === "crescendo") return <CrescendoMode {...common} plan={plan.plan} />;
    return <SouffleMode {...common} plan={plan.plan} />;
  }

  // ══ Passage du téléphone au Clown ══
  if (screen === "pass" && duel) {
    return (
      <PassScreen
        toName={players[duel.clown]}
        colorIndex={duel.clown}
        accent={ACCENT}
        hint={t.passHint(players[duel.serious])}
        onReady={() => setScreen("arena")}
      />
    );
  }

  // ══ Duel ══
  if (screen === "arena" && duel && card) {
    const label = ko ? (duel.sudden ? t.sudden : t.koRound(ko.left, ko.round)) : t.duelN(qIdx + 1, queue.length);
    return (
      <>
        {overlays}
        <DuelArena
          key={`${qIdx}-${ko?.round}-${ko?.cur}-${results.length}-${resumeMs}`}
          duel={duel}
          seriousName={players[duel.serious]}
          clownName={players[duel.clown]}
          label={label}
          card={card}
          onNextCard={() => setCard(drawAmmo())}
          sens={settings.sens}
          floor={floor}
          human={settings.human}
          elapsed0={resumeMs}
          tools={tools}
          onCrack={(ms) => endDuel(ms, true)}
          onSurvive={() => endDuel(duel.ms, false)}
          onMicFail={micFailed}
        />
      </>
    );
  }

  // ══ Résultat d'un duel ══
  if (screen === "result" && last) {
    const s = players[last.serious];
    const c = players[last.clown];
    const m = ko?.matches[ko.cur];
    const decided = m?.winner != null;
    return (
      <ZScreen bg={last.cracked ? ZZ.coral : ZZ.mint} tools={tools}>
        {overlays}
        {!last.cracked && !reduced && <ConfettiBurst count={40} />}
        <div className="flex flex-col items-center text-center">
          {last.cracked
            ? <ChutBlob size={150} color={colorForIndex(last.serious)} state="burst" />
            : <PlayerBlob name={players[last.serious]} colorIndex={last.serious} size={120} mood="cool" crown />}
          <ZTitle size={last.cracked ? "clamp(52px, 16vw, 72px)" : "clamp(40px, 12vw, 54px)"} as="h1" className="mt-1" style={{ color: last.cracked ? ZZ.yellow : "#fff", WebkitTextStroke: `2.5px ${INK}`, textShadow: `4px 4px 0 ${INK}`, rotate: "-3deg" }}>
            {last.cracked ? t.cracked : t.survivedTitle}
          </ZTitle>
          <p className="mt-3 text-[17px] font-bold leading-snug">
            {last.cracked ? t.crackedAfter(s, secs(last.heldMs, t.dec)) : t.survived(s, Math.round(last.ms / 1000))}
          </p>
          {last.cracked && <p className="mt-1 text-[15px] font-semibold">{t.clownScore(c)}</p>}
        </div>

        {last.cracked && sentence && <SentenceCard name={s} colorIndex={last.serious} sentence={sentence} onReroll={rerollDare} />}

        {m && (decided || m.legs.length > 0) && (
          <ZCard bg="#fff" className="mt-4 p-3.5" shadow={4}>
            <MatchLine m={m} players={players} />
            {decided && <p className="mt-2 text-center text-[16px] font-bold">{m.coin ? `${t.coin} ` : ""}{t.matchWon(players[m.winner!])}</p>}
          </ZCard>
        )}

        <div className="mt-auto flex flex-col gap-1 pt-6">
          <ZButton bg="#fff" onClick={nextAfterResult}>
            {ko ? (decided ? t.seeBracket : t.nextDuel) : qIdx + 1 < queue.length ? t.nextDuel : t.toResults}
          </ZButton>
          {last.cracked && <ZLink onClick={falseAlarm} color={INK}>{t.falseAlarm}</ZLink>}
          {!ko && qIdx + 1 < queue.length && <ZLink onClick={finish} color={INK}>{t.finish}</ZLink>}
        </div>
      </ZScreen>
    );
  }

  // ══ Tableau (élimination) ══
  if (screen === "bracket" && ko) {
    return (
      <ZScreen tools={tools}>
        {overlays}
        <ZChip bg={ZZ.coral}><Trophy size={16} strokeWidth={2.8} aria-hidden /> {t.koRound(ko.left, ko.round)}</ZChip>
        <ZTitle size="clamp(36px, 11vw, 48px)" className="mt-3" as="h1">{t.formatKo}</ZTitle>
        <div className="mt-5 flex flex-col gap-3">
          {ko.matches.map((m, i) => (
            <ZCard key={i} bg={i === ko.cur ? ZZ.yellow : "#fff"} tilt={i % 2 ? 0.8 : -0.8} shadow={4} className="p-3.5">
              {m.winner != null || m.legs.length > 0
                ? <MatchLine m={m} players={players} />
                : <p className="text-center text-[17px] font-bold">{t.matchOf(players[m.a], players[m.b])} · {t.pending}</p>}
            </ZCard>
          ))}
          {ko.bye != null && <p className="text-center text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.bye(players[ko.bye])}</p>}
        </div>
        <div className="mt-auto pt-6">
          <ZButton bg={ACCENT} onClick={nextAfterBracket}>{ko.cur + 1 < ko.matches.length ? t.nextMatch : ko.matches.length === 1 && ko.bye == null ? t.toResults : t.nextMatch}</ZButton>
        </div>
      </ZScreen>
    );
  }

  // ══ Toute la table : manche ══
  if (screen === "table") {
    return (
      <>
        {overlays}
        <TableArena
          key={`${tableRound}-${tableElapsed}`}
          round={tableRound}
          firstScene={firstScene}
          drawScene={drawScene}
          sens={settings.sens}
          floor={floor}
          human={settings.human}
          elapsed0={tableElapsed}
          tools={tools}
          onCrack={tableCrack}
          onSurvive={tableSurvive}
          onMicFail={micFailed}
        />
      </>
    );
  }

  // ══ Toute la table : qui a craqué ? ══
  if (screen === "tableWho") {
    return (
      <ZScreen bg={ZZ.coral} tools={tools}>
        {overlays}
        <div className="flex flex-col items-center text-center">
          <ChutBlob size={130} color="yellow" state="burst" />
          <ZTitle size="clamp(48px, 15vw, 66px)" as="h1" style={{ color: ZZ.yellow, WebkitTextStroke: `2.5px ${INK}`, textShadow: `4px 4px 0 ${INK}`, rotate: "-3deg" }}>{t.cracked}</ZTitle>
          <ZTitle size={28} className="mt-4">{t.tableWho}</ZTitle>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {players.map((p, i) => (
            <button key={i} type="button" onClick={() => blame(i)}
              className="flex min-h-14 items-center gap-2 rounded-[18px] px-3 py-2 text-left shadow-[0_4px_0_#15082E] transition-[translate,box-shadow] active:translate-y-[3px] active:shadow-[0_1px_0_#15082E]"
              style={{ background: "#fff", color: INK, border: `3px solid ${INK}` }}>
              <PlayerBlob name={p} colorIndex={i} size={32} mood="laughing" bob={false} />
              <span className="min-w-0 flex-1 text-[17px] leading-tight" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{p}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto pt-5">
          <ZLink onClick={() => { playSfx("whoosh", { volume: 0.5 }); setScreen("table"); }} color={INK}>{t.nobody}</ZLink>
        </div>
      </ZScreen>
    );
  }

  // ══ Toute la table : résultat ══
  if (screen === "tableResult") {
    return (
      <ZScreen bg={culprit != null ? ZZ.coral : ZZ.mint} tools={tools}>
        {overlays}
        {culprit == null && !reduced && <ConfettiBurst count={40} />}
        <div className="flex flex-col items-center text-center">
          <ZChip bg="#fff" className="self-center">{t.tableRound(tableRound)}</ZChip>
          {culprit != null
            ? <ChutBlob size={130} color={colorForIndex(culprit)} state="burst" style={{ marginTop: 10 }} />
            : <Mascot size={110} color="lavender" mood="cool" shadow={false} style={{ marginTop: 10 }} />}
          <ZTitle size="clamp(40px, 12vw, 54px)" as="h1" className="mt-1" style={{ color: "#fff", WebkitTextStroke: `2.5px ${INK}`, textShadow: `4px 4px 0 ${INK}`, rotate: "-2deg" }}>
            {culprit != null ? t.tableCulprit(players[culprit]) : t.tableSurvived}
          </ZTitle>
          {culprit == null && <p className="mt-3 text-[17px] font-bold">{t.tableSurvivedSub(TABLE_MS / 1000)}</p>}
        </div>
        {culprit != null && sentence && <SentenceCard name={players[culprit]} colorIndex={culprit} sentence={sentence} onReroll={rerollDare} />}
        <div className="mt-auto flex flex-col gap-1 pt-6">
          <ZButton bg="#fff" onClick={nextTableRound}>{t.nextRound}</ZButton>
          <ZLink onClick={finish} color={INK}>{t.finish}</ZLink>
        </div>
      </ZScreen>
    );
  }

  // ══ Fin : le verdict ══
  if (screen === "end") {
    return (
      <EndScreen
        players={players}
        mode={settings.mode}
        results={results}
        ko={ko}
        tableCracks={tableCracks}
        tools={tools}
        overlays={overlays}
        onReplay={() => { setScreen("modes"); }}
        onQuit={onReturnToLobby}
      />
    );
  }

  return null;
}

// ══════════════════════════════════════════════════════════
// Composants

function MatchLine({ m, players }: { m: Match; players: string[] }) {
  const t = useT(CHUT_STR);
  // Temps tenus par chacun (somme des manches où il était Sérieux)
  const held = (p: number) => m.legs.filter((l) => l.serious === p).reduce((a, l) => a + l.heldMs, 0);
  const played = (p: number) => m.legs.some((l) => l.serious === p);
  return (
    <div className="flex items-center justify-between gap-2" style={{ color: INK }}>
      {[m.a, m.b].map((p, i) => (
        <div key={p} className={`flex min-w-0 flex-1 items-center gap-2 ${i ? "flex-row-reverse text-right" : ""}`}>
          <PlayerBlob name={players[p]} colorIndex={p} size={34} mood={m.winner === p ? "cool" : m.winner != null ? "sad" : "happy"} crown={m.winner === p} bob={false} />
          <div className="min-w-0">
            <p className="truncate text-[17px] leading-tight" style={DISPLAY}>{players[p]}</p>
            <p className="text-[14px] font-bold">{played(p) ? t.sec(secs(held(p), t.dec)) : t.pending}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RulesSheet({ mode, onClose, onTuto }: { mode: ModeId | null; onClose: () => void; onTuto: () => void }) {
  const t = useT(CHUT_STR);
  const m = useT(MODES_STR);
  const rules = mode ? m.rules[mode] : MODE_IDS.map((id) => m.labelled(m.modeName[id], m.modeSub[id]));
  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 200 }} role="dialog" aria-modal aria-label={t.rulesTitle}>
      <div className="absolute inset-0" style={{ background: "rgba(10,4,32,0.6)" }} onClick={onClose} />
      <div className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto p-5"
        style={{ background: ZZ.cream, color: INK, borderRadius: "28px 28px 0 0", border: `3px solid ${INK}`, borderBottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <div className="absolute right-4 top-4"><GameIconButton icon={X} label={t.close} onClick={onClose} /></div>
        <ZTitle size={32} className="pr-14">{t.rulesTitle}</ZTitle>
        <p className="mt-1 text-[17px]" style={DISPLAY}>{mode ? m.modeName[mode] : m.allModes}</p>
        <ol className="mt-4 flex flex-col gap-2.5">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-2.5 text-[16px] font-semibold leading-snug">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[14px]" style={{ ...DISPLAY, background: [ZZ.yellow, ZZ.pink, ZZ.sky, ZZ.mint][i % 4], border: `2.5px solid ${INK}` }}>{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: "#4A3A66" }}>
          <ShieldCheck size={16} strokeWidth={2.6} aria-hidden /> {t.privacy}
        </p>
        <TutoAgainButton color={INK} className="mt-2" onClick={onTuto} />
      </div>
    </div>
  );
}

// ── Calibrage : 3 s de silence → bruit ambiant, puis test libre ──
function Calibration({ sens, tools, onDone, onHuman }: { sens: Sensitivity; tools: ReactNode; onDone: (floor: number) => void; onHuman: () => void }) {
  const t = useT(CHUT_STR);
  const [phase, setPhase] = useState<"intro" | "listening" | "done" | "error">("intro");
  const [err, setErr] = useState<MicError>("unavailable");
  const [left, setLeft] = useState(3);
  const [g, setG] = useState(0);
  const [floor, setFloor] = useState(-70);
  const [hit, setHit] = useState(0);
  const mic = useRef<MicMeter | null>(null);
  const loop = useRef(0);

  const stop = () => {
    window.clearInterval(loop.current);
    mic.current?.stop();
    mic.current = null;
  };
  useEffect(() => () => stop(), []);

  const start = async () => {
    stop();
    const m = new MicMeter();
    mic.current = m;
    try {
      await m.start();
    } catch (e) {
      setErr(e as MicError);
      setPhase("error");
      return;
    }
    if (mic.current !== m) return;
    setPhase("listening");
    setLeft(3);
    const samples: number[] = [];
    const t0 = performance.now();
    let f = -70;
    let thr = thresholdFor(f, sens);
    let hot = 0;
    let lastHit = 0;
    loop.current = window.setInterval(() => {
      const db = m.db();
      const el = performance.now() - t0;
      if (el < 3000) {
        if (el > 400) samples.push(db); // on laisse passer le « clic » du tap
        setLeft(Math.ceil((3000 - el) / 1000));
        setG(Math.min(0.5, Math.max(0, (db + 80) / 120)));
        return;
      }
      if (samples.length) {
        f = floorFrom(samples);
        thr = thresholdFor(f, sens);
        samples.length = 0;
        setFloor(f);
        setPhase("done");
        playSfx("ding", { volume: 0.5 });
      }
      const gg = gaugeOf(db, f, thr);
      setG(gg);
      hot = db > thr ? hot + TICK : 0;
      if (hot >= holdMsFor(sens) && performance.now() - lastHit > 1200) {
        lastHit = performance.now();
        setHit((h) => h + 1);
      }
    }, TICK);
  };

  const amb = floor < -55 ? t.ambQuiet : floor < -38 ? t.ambMid : t.ambLoud;
  return (
    <ZScreen tools={tools}>
      <ZChip bg={ZZ.sky}><Ear size={16} strokeWidth={2.8} aria-hidden /> {t.calibTitle}</ZChip>
      <div className="mt-2 flex flex-col items-center text-center">
        <ChutBlob size={96} color="yellow" state={phase === "done" && g > 0.2 ? "strain" : "calm"} level={g} />
        {phase === "intro" && <ZTitle size="clamp(32px, 10vw, 42px)" className="mt-2">{t.hush}</ZTitle>}
        {phase === "listening" && <ZTitle size={64} className="mt-2" style={{ color: ZZ.yellow }}>{left}</ZTitle>}
        {phase === "done" && <ZTitle size="clamp(32px, 10vw, 42px)" className="mt-2">{t.calibDone}</ZTitle>}
        {phase === "error" && <ZTitle size="clamp(30px, 9vw, 40px)" className="mt-2">{t.micErrTitle}</ZTitle>}
      </div>

      {(phase === "listening" || phase === "done") && (
        <div className="mt-3 flex justify-center">
          <NoiseMeter value={g} width={260} crackLabel={t.calibLoud} label={t.calibMeter} />
        </div>
      )}

      {phase === "intro" && <p className="mt-4 text-center text-[17px] font-semibold leading-snug">{t.calibIntro}</p>}
      {phase === "listening" && <p className="mt-3 text-center text-[17px] font-bold">{t.calibListening}</p>}
      {phase === "done" && (
        <div className="mt-3 flex flex-col items-center gap-2 text-center">
          <ZChip bg={floor < -55 ? ZZ.mint : floor < -38 ? ZZ.yellow : ZZ.coral} className="self-center">{amb}</ZChip>
          {floor >= -38 && sens !== "club" && <p className="text-[15px] font-semibold">{t.loudTip}</p>}
          <p key={hit} className="text-[16px] font-bold" style={{ color: hit ? ZZ.yellow : "#fff" }}>{hit ? t.testHit : t.tryIt}</p>
        </div>
      )}
      {phase === "error" && <p className="mt-4 text-center text-[17px] font-semibold leading-snug">{err === "denied" ? t.micDenied : t.micUnavailable}</p>}

      <ZCard bg="#fff" className="mt-4 flex items-start gap-2.5 p-3" shadow={4}>
        <ShieldCheck size={22} strokeWidth={2.6} aria-hidden className="mt-0.5 shrink-0" />
        <p className="text-[14px] font-semibold leading-snug">{t.privacy}</p>
      </ZCard>

      <div className="mt-auto flex flex-col gap-1 pt-6">
        {phase === "intro" && <ZButton bg={ACCENT} onClick={() => void start()}>{t.calibStart}</ZButton>}
        {phase === "done" && (
          <>
            <ZButton bg={ACCENT} onClick={() => { stop(); onDone(floor); }}>{t.calibOk}</ZButton>
            <ZLink onClick={() => void start()}>{t.recalibrate}</ZLink>
          </>
        )}
        {phase === "error" && (
          <>
            <ZButton bg={ACCENT} onClick={() => { stop(); onHuman(); }}>{t.playHuman}</ZButton>
            <ZLink onClick={() => void start()}>{t.retry}</ZLink>
          </>
        )}
        {phase === "intro" && <ZLink onClick={() => { stop(); onHuman(); }}>{t.playHuman}</ZLink>}
      </div>
    </ZScreen>
  );
}

// ── Moteur micro commun aux deux arènes ──
interface Engine {
  mic: MicMeter | null;
  loop: number;
  timers: number[];
  floor: number;
  thr: number;
  hot: number;
  gateUntil: number;
  elapsed: number;
  lastTick: number;
  done: boolean;
}
function newEngine(elapsed0: number): Engine {
  return { mic: null, loop: 0, timers: [], floor: -70, thr: -50, hot: 0, gateUntil: 0, elapsed: elapsed0, lastTick: 0, done: false };
}
function stopEngine(e: Engine) {
  window.clearInterval(e.loop);
  e.timers.forEach((x) => window.clearTimeout(x));
  e.timers = [];
  e.mic?.stop();
  e.mic = null;
}
/** Plancher de la manche : ne baisse jamais sous le calibrage, ne monte pas de plus de 12 dB. */
function roundFloor(cal: number | null, samples: number[]): number {
  const base = cal ?? floorFrom(samples);
  if (!samples.length) return base;
  return Math.min(Math.max(base, floorFrom(samples)), base + 12);
}

// ── Arène du duel ──
function DuelArena({
  duel, seriousName, clownName, label, card, onNextCard, sens, floor, human, elapsed0, tools, onCrack, onSurvive, onMicFail,
}: {
  duel: Duel; seriousName: string; clownName: string; label: string; card: Ammo; onNextCard: () => void;
  sens: Sensitivity; floor: number | null; human: boolean; elapsed0: number; tools: ReactNode;
  onCrack: (heldMs: number) => void; onSurvive: () => void; onMicFail: (e: MicError) => void;
}) {
  const t = useT(CHUT_STR);
  const [phase, setPhase] = useState<"ready" | "count" | "live">("ready");
  const [count, setCount] = useState(3);
  const [view, setView] = useState({ g: 0, left: duel.ms - elapsed0, talking: false, silence: 0 });
  const eng = useRef<Engine>(newEngine(elapsed0));
  const talk = useRef({ on: false, since: 0, silenceUntil: 0 });
  const cb = useRef({ onCrack, onSurvive });
  useEffect(() => { cb.current = { onCrack, onSurvive }; });

  useEffect(() => {
    const e = eng.current;
    // L'app passe en arrière-plan : on coupe le micro et on revient à « prêt » (le chrono est gardé)
    const onHide = () => {
      if (document.visibilityState === "hidden" && !e.done) {
        stopEngine(e);
        setPhase("ready");
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); stopEngine(e); };
  }, []);

  const end = (cracked: boolean) => {
    const e = eng.current;
    if (e.done) return;
    e.done = true;
    stopEngine(e); // micro libéré AVANT les sons de résultat
    if (cracked) cb.current.onCrack(e.elapsed);
    else cb.current.onSurvive();
  };
  const gate = (ms: number) => { eng.current.gateUntil = Math.max(eng.current.gateUntil, performance.now() + ms); };

  const press = () => {
    if (phase !== "live" || human) return;
    talk.current = { on: true, since: performance.now(), silenceUntil: 0 };
    playSfx("pop", { volume: 0.5 });
    setView((v) => ({ ...v, talking: true }));
  };
  const release = () => {
    if (!talk.current.on) return;
    talk.current = { on: false, since: 0, silenceUntil: performance.now() + SILENCE_MS };
    gate(250); // le relâché du doigt fait un petit « toc » sur la table
    setView((v) => ({ ...v, talking: false }));
  };

  const tick = () => {
    const e = eng.current;
    if (e.done) return;
    const now = performance.now();
    const dt = Math.min(200, now - e.lastTick);
    e.lastTick = now;
    e.elapsed += dt;
    const tk = talk.current;
    if (tk.on && now - tk.since > MAX_TALK_MS) release();
    let g = 0;
    if (!human && e.mic) {
      const db = e.mic.db();
      const ignoring = talk.current.on || now < e.gateUntil;
      if (!ignoring) {
        e.hot = db > e.thr ? e.hot + dt : 0;
        if (e.hot >= holdMsFor(sens)) { end(true); return; }
        g = gaugeOf(db, e.floor, e.thr);
        g = Math.max(0, Math.min(1, g + (Math.random() - 0.5) * 0.04 * (0.3 + g))); // l'aiguille tremble
      } else e.hot = 0;
    }
    const left = duel.ms - e.elapsed;
    const silence = Math.max(0, talk.current.silenceUntil - now);
    if (left <= 0 && !talk.current.on && silence <= 0) { end(false); return; }
    setView({ g, left, talking: talk.current.on, silence });
  };

  const launch = async () => {
    const e = eng.current;
    stopEngine(e);
    e.done = false;
    e.hot = 0;
    if (!human) {
      const m = new MicMeter();
      e.mic = m;
      try {
        await m.start();
      } catch (er) {
        e.mic = null;
        onMicFail(er as MicError);
        return;
      }
    }
    // 3, 2, 1 en silence : on mesure le bruit ambiant de la manche
    setPhase("count");
    setCount(3);
    const samples: number[] = [];
    const t0 = performance.now();
    e.loop = window.setInterval(() => {
      const el = performance.now() - t0;
      if (e.mic && el > 500) samples.push(e.mic.db());
      const c = 3 - Math.floor(el / 800);
      if (c > 0) { setCount(c); return; }
      window.clearInterval(e.loop);
      e.floor = roundFloor(floor, samples);
      e.thr = thresholdFor(e.floor, sens);
      e.lastTick = performance.now();
      talk.current = { on: false, since: 0, silenceUntil: 0 };
      playSfx("whistle", { volume: 0.55, rate: 1.4 });
      gate(1500); // le coup de sifflet du téléphone ne compte pas
      setPhase("live");
      e.loop = window.setInterval(tick, TICK);
    }, TICK);
  };

  const nextCard = () => {
    gate(450);
    playSfx("card-flip", { volume: 0.5 });
    onNextCard();
  };

  const live = phase === "live";
  const danger = live && !human ? Math.max(0, view.g - 0.45) / 0.55 : 0;
  const leftS = Math.max(0, Math.ceil(view.left / 1000));
  const overtime = live && view.left <= 0;
  const blobState = live && !human && (view.g > 0.12 || view.talking) ? "strain" : "calm";
  const silent = card.kind === "face";

  // ── Prêt : face à face ──
  if (phase === "ready") {
    return (
      <ZScreen tools={tools}>
        <ZChip bg={duel.sudden ? ZZ.coral : ZZ.yellow}>{label}</ZChip>
        <ZTitle size="clamp(36px, 11vw, 48px)" className="mt-3" as="h1">{t.faceOff}</ZTitle>
        <div className="mt-5 flex flex-col gap-3">
          <ZCard bg={ZZ.sky} tilt={-1.5} className="flex items-center gap-3 p-3.5">
            <ChutBlob size={58} color="sky" state="calm" />
            <div className="min-w-0">
              <p className="text-[14px] font-bold">{t.serious}</p>
              <p className="text-[24px] leading-tight" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{seriousName}</p>
              <p className="text-[14px] font-semibold">{t.seriousJob}</p>
            </div>
          </ZCard>
          <p className="text-center text-[18px]" style={DISPLAY}>{t.vs}</p>
          <ZCard bg={ZZ.pink} tilt={1.5} className="flex items-center gap-3 p-3.5">
            <Mascot size={54} color="yellow" mood="laughing" bob={false} shadow={false} />
            <div className="min-w-0">
              <p className="text-[14px] font-bold">{t.clown}</p>
              <p className="text-[24px] leading-tight" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{clownName}</p>
              <p className="text-[14px] font-semibold">{t.clownJob(Math.round(duel.ms / 1000))}</p>
            </div>
          </ZCard>
        </div>
        <p className="mt-5 text-center text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{human ? t.humanHint : t.setupPhone}</p>
        <div className="mt-auto pt-6">
          <ZButton bg={ACCENT} onClick={() => void launch()}>{t.startDuel}</ZButton>
          {!human && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
              <ShieldCheck size={16} strokeWidth={2.6} aria-hidden /> {t.noRecord}
            </p>
          )}
        </div>
      </ZScreen>
    );
  }

  // ── Compte à rebours + duel ──
  return (
    <div
      className="relative flex min-h-[100dvh] w-full shrink-0 select-none flex-col items-center px-4 text-white"
      style={{
        background: `radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${ZZ.night}`,
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
      }}
      onPointerDownCapture={() => gate(300)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Le rouge monte quand le Sérieux approche du seuil */}
      <div className="pointer-events-none fixed inset-0" style={{ boxShadow: `inset 0 0 ${80 + danger * 120}px rgba(255,62,108,${(danger * 0.85).toFixed(2)})`, transition: "box-shadow 120ms" }} />
      <GameTopRight>{tools}<SoundButton /></GameTopRight>
      {phase === "count" && <Countdown n={count} sub={human ? t.hush : t.measuring} />}

      {/* Bandeau du Sérieux, à l'envers (il est en face du Clown) */}
      <div className="w-full max-w-md" style={{ transform: "rotate(180deg)" }}>
        <ZCard bg={ZZ.sky} shadow={0} radius={18} className="flex items-center justify-between gap-2 px-3.5 py-2">
          <span className="min-w-0 truncate text-[18px] leading-tight" style={DISPLAY}>{seriousName}</span>
          <span className="shrink-0 text-[15px] font-bold">{view.talking ? t.holdOn : t.silenceSub}</span>
        </ZCard>
      </div>

      {/* Bruitomètre + blob qui retient son rire + chrono */}
      <div className="relative mt-2 flex w-full max-w-md flex-col items-center">
        {!human && <NoiseMeter value={view.talking ? 0 : view.g} paused={view.talking} width={220} crackLabel={t.crack} label={t.meter} />}
        <div className="mt-1 flex w-full items-center gap-2.5">
          <ChutBlob size={human ? 96 : 74} color={colorForIndex(duel.serious)} state={blobState} level={view.talking ? 0.35 : view.g} />
          <span className="grid min-h-11 min-w-[60px] shrink-0 place-items-center rounded-full px-3 text-[24px]" style={{ ...DISPLAY, background: leftS <= 5 ? ZZ.coral : "#fff", color: INK, border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>
            {overtime ? "0" : leftS}
          </span>
          <span className="min-w-0 text-[16px] font-bold leading-tight" style={{ color: view.silence > 0 ? ZZ.yellow : "#fff" }}>
            {human
              ? t.humanHint
              : view.talking
                ? t.talking
                : view.silence > 0
                  ? `${t.silence} · ${Math.ceil(view.silence / 1000)}`
                  : overtime ? t.overtime : t.silenceSub}
          </span>
        </div>
      </div>

      {/* Munition du Clown */}
      <ZCard bg={ZZ.cream} radius={24} shadow={5} className="mt-2.5 w-full max-w-md px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <ZChip bg={silent ? ZZ.mint : ZZ.yellow} tilt={-2}><Sparkles size={14} strokeWidth={2.8} aria-hidden /> {t.kinds[card.kind]}</ZChip>
          <button type="button" onClick={nextCard} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-extrabold shadow-[0_3px_0_#15082E] active:translate-y-[2px] active:shadow-[0_1px_0_#15082E]" style={{ background: "#fff", color: INK, border: `2.5px solid ${INK}` }}>
            {t.ammoNext}
          </button>
        </div>
        <p className="mt-2 text-[17px] font-bold leading-snug" style={{ textWrap: "pretty" }}>{card.text}</p>
        {!human && silent && <p className="mt-1 text-[13px] font-semibold" style={{ color: "#4A3A66" }}>{t.silentHint}</p>}
      </ZCard>

      {/* Gros bouton push-to-talk (ou arbitre humain) */}
      <div className="mt-auto w-full max-w-md pt-2.5">
        {human ? (
          <ZButton bg={ZZ.coral} onClick={() => end(true)} className="min-h-[76px]" style={{ fontSize: 26 }}>
            <Hand size={26} strokeWidth={2.8} aria-hidden /> {t.laughed(seriousName)}
          </ZButton>
        ) : (
          <button
            type="button"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); press(); }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            className="flex min-h-[76px] w-full flex-col items-center justify-center rounded-[28px] text-center"
            style={{
              background: view.talking ? ZZ.yellow : ACCENT,
              color: INK,
              border: `3px solid ${INK}`,
              boxShadow: view.talking ? `0 1px 0 ${INK}` : `0 6px 0 ${INK}`,
              transform: view.talking ? "translateY(5px)" : undefined,
              transition: "transform 80ms, box-shadow 80ms, background-color 120ms",
              touchAction: "none",
            }}
          >
            <span className="text-[30px] leading-none" style={DISPLAY}>{t.holdBtn}</span>
            <span className="mt-1 text-[14px] font-bold">{view.talking ? t.talking : t.holdSub}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Arène « Toute la table » ──
function TableArena({
  round, firstScene, drawScene, sens, floor, human, elapsed0, tools, onCrack, onSurvive, onMicFail,
}: {
  round: number; firstScene: string; drawScene: () => string; sens: Sensitivity; floor: number | null; human: boolean;
  elapsed0: number; tools: ReactNode; onCrack: (elapsed: number) => void; onSurvive: () => void; onMicFail: (e: MicError) => void;
}) {
  const t = useT(CHUT_STR);
  const [phase, setPhase] = useState<"ready" | "count" | "live">("ready");
  const [count, setCount] = useState(3);
  const [scene, setScene] = useState(firstScene);
  const [sceneKey, setSceneKey] = useState(0);
  const [view, setView] = useState({ g: 0, left: TABLE_MS - elapsed0, sound: false });
  const eng = useRef<Engine>(newEngine(elapsed0));
  const nextAt = useRef(0);
  const cb = useRef({ onCrack, onSurvive, drawScene });
  useEffect(() => { cb.current = { onCrack, onSurvive, drawScene }; });

  useEffect(() => {
    const e = eng.current;
    const onHide = () => {
      if (document.visibilityState === "hidden" && !e.done) {
        stopEngine(e);
        setPhase("ready");
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); stopEngine(e); };
  }, []);

  const end = (cracked: boolean) => {
    const e = eng.current;
    if (e.done) return;
    e.done = true;
    stopEngine(e);
    if (cracked) cb.current.onCrack(e.elapsed);
    else cb.current.onSurvive();
  };

  // Le téléphone attaque : une scène absurde + un son ridicule (le micro se bouche les oreilles)
  const attack = (newScene: boolean) => {
    const e = eng.current;
    const sk = SKETCHES[Math.floor(Math.random() * SKETCHES.length)];
    sk.s.forEach(([n, rate, delay]) => playSfx(n, { volume: 0.8, rate, delay }));
    e.gateUntil = performance.now() + (sk.len + 0.6) * 1000;
    if (newScene) {
      setScene(cb.current.drawScene());
      setSceneKey((k) => k + 1);
    }
  };

  const tick = () => {
    const e = eng.current;
    if (e.done) return;
    const now = performance.now();
    const dt = Math.min(200, now - e.lastTick);
    e.lastTick = now;
    e.elapsed += dt;
    if (now >= nextAt.current) {
      nextAt.current = now + 5500 + Math.random() * 2500;
      attack(true);
    }
    let g = 0;
    const sound = now < e.gateUntil;
    if (!human && e.mic && !sound) {
      const db = e.mic.db();
      e.hot = db > e.thr ? e.hot + dt : 0;
      if (e.hot >= holdMsFor(sens)) { end(true); return; }
      g = gaugeOf(db, e.floor, e.thr);
      g = Math.max(0, Math.min(1, g + (Math.random() - 0.5) * 0.04 * (0.3 + g)));
    } else e.hot = 0;
    const left = TABLE_MS - e.elapsed;
    if (left <= 0 && !sound) { end(false); return; }
    setView({ g, left, sound });
  };

  const launch = async () => {
    const e = eng.current;
    stopEngine(e);
    e.done = false;
    if (!human) {
      const m = new MicMeter();
      e.mic = m;
      try {
        await m.start();
      } catch (er) {
        e.mic = null;
        onMicFail(er as MicError);
        return;
      }
    }
    setPhase("count");
    setCount(3);
    const samples: number[] = [];
    const t0 = performance.now();
    e.loop = window.setInterval(() => {
      const el = performance.now() - t0;
      if (e.mic && el > 500) samples.push(e.mic.db());
      const c = 3 - Math.floor(el / 800);
      if (c > 0) { setCount(c); return; }
      window.clearInterval(e.loop);
      e.floor = roundFloor(floor, samples);
      e.thr = thresholdFor(e.floor, sens);
      e.lastTick = performance.now();
      setPhase("live");
      attack(false); // la 1re scène est déjà affichée : premier son tout de suite
      nextAt.current = performance.now() + 6000;
      e.loop = window.setInterval(tick, TICK);
    }, TICK);
  };

  const live = phase === "live";
  const danger = live && !human ? Math.max(0, view.g - 0.45) / 0.55 : 0;

  if (phase === "ready") {
    return (
      <ZScreen tools={tools}>
        <ZChip bg={ZZ.sky}><Users size={16} strokeWidth={2.8} aria-hidden /> {t.tableRound(round)}</ZChip>
        <div className="mt-4 flex justify-center gap-1">
          <ChutBlob size={84} color="pink" state="calm" />
          <ChutBlob size={100} color="yellow" state="calm" />
          <ChutBlob size={84} color="mint" state="calm" />
        </div>
        <ZTitle size="clamp(38px, 12vw, 52px)" className="mt-2 text-center" as="h1">{t.tableTitle}</ZTitle>
        <p className="mt-3 text-center text-[17px] font-semibold leading-snug">{human ? `${t.tableIntro} ${t.humanHint}` : t.tableIntro}</p>
        <div className="mt-auto pt-6">
          <ZButton bg={ACCENT} onClick={() => void launch()}>{t.tableStart}</ZButton>
          {!human && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
              <ShieldCheck size={16} strokeWidth={2.6} aria-hidden /> {t.noRecord}
            </p>
          )}
        </div>
      </ZScreen>
    );
  }

  return (
    <div
      className="relative flex min-h-[100dvh] w-full shrink-0 select-none flex-col items-center px-5 text-white"
      style={{
        background: `radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${ZZ.night}`,
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
      }}
    >
      <div className="pointer-events-none fixed inset-0" style={{ boxShadow: `inset 0 0 ${80 + danger * 120}px rgba(255,62,108,${(danger * 0.85).toFixed(2)})`, transition: "box-shadow 120ms" }} />
      <GameTopRight>{tools}<SoundButton /></GameTopRight>
      {phase === "count" && <Countdown n={count} sub={human ? t.hush : t.measuring} />}

      <div className="flex w-full max-w-md items-center justify-between">
        <ZChip bg={ZZ.sky}>{t.tableRound(round)}</ZChip>
        <span className="grid min-h-10 min-w-[64px] place-items-center rounded-full px-3 text-[24px]" style={{ ...DISPLAY, background: view.left <= 5000 ? ZZ.coral : "#fff", color: INK, border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>
          {Math.max(0, Math.ceil(view.left / 1000))}
        </span>
      </div>

      {/* La scène absurde */}
      <ZCard key={sceneKey} bg={[ZZ.yellow, ZZ.mint, ZZ.sky, ZZ.pink, ZZ.cream][sceneKey % 5]} tilt={sceneKey % 2 ? 1.5 : -1.5} shadow={6} radius={28} className="chut-card mt-5 w-full max-w-md p-5">
        <p className="text-[clamp(22px,6.6vw,28px)] leading-[1.12]" style={{ ...DISPLAY, textWrap: "balance" }}>{scene}</p>
      </ZCard>

      <div className="mt-5 flex w-full max-w-md flex-col items-center">
        {!human && <NoiseMeter value={view.g} paused={view.sound} width={250} crackLabel={t.crack} label={t.meter} />}
        <div className="mt-2 flex items-center justify-center gap-3">
          <ChutBlob size={human ? 110 : 80} color="yellow" state={!human && view.g > 0.12 ? "strain" : "calm"} level={view.g} />
          <p className="min-w-0 text-[17px] font-bold leading-tight" style={{ color: view.sound ? ZZ.yellow : "#fff" }}>
            {human ? t.humanHint : view.sound ? t.tableSound : t.tableLive}
          </p>
        </div>
      </div>

      {human && (
        <div className="mt-auto w-full max-w-md pt-3">
          <ZButton bg={ZZ.coral} onClick={() => end(true)} className="min-h-[76px]" style={{ fontSize: 26 }}>
            <Hand size={26} strokeWidth={2.8} aria-hidden /> {t.humanTable}
          </ZButton>
        </div>
      )}
      <ChutStyles />
    </div>
  );
}

// ── Le verdict ──
function EndScreen({ players, mode, results, ko, tableCracks, tools, overlays, onReplay, onQuit }: {
  players: string[]; mode: ModeId; results: DuelResult[]; ko: Ko | null; tableCracks: number[];
  tools: ReactNode; overlays: ReactNode; onReplay: () => void; onQuit?: () => void;
}) {
  const t = useT(CHUT_STR);
  const reduced = useReducedMotion();
  const idx = [...players.keys()];
  let rows: { name: string; score: number | string; colorIndex: number; note?: ReactNode }[];
  let tomb: number | null = null;
  let weak: number | null = null;
  let gold: number | null = null;
  let unit = t.unitS;

  if (mode === "table") {
    const order = [...idx].sort((a, b) => tableCracks[a] - tableCracks[b]);
    rows = order.map((p) => ({ name: players[p], score: tableCracks[p] ?? 0, colorIndex: p, note: t.noteTable(tableCracks[p] ?? 0) }));
    unit = "";
    tomb = order.length > 1 && tableCracks[order[1]] === tableCracks[order[0]] ? null : order[0];
    const w = order[order.length - 1];
    const wTie = order.length > 1 && tableCracks[order[order.length - 2]] === tableCracks[w];
    weak = tableCracks[w] > 0 && w !== tomb && !wTie ? w : null;
  } else {
    const st = idx.map((p) => {
      const mine = results.filter((r) => r.serious === p);
      return {
        p,
        cracks: mine.filter((r) => r.cracked).length,
        held: mine.filter((r) => !r.cracked).length,
        // au dixième de seconde : deux temps « égaux » à l'écran sont ex æquo
        ms: Math.round(mine.reduce((a, r) => a + r.heldMs, 0) / 100) * 100,
        caused: results.filter((r) => r.clown === p && r.cracked).length,
      };
    });
    let order: typeof st;
    if (ko) {
      // Champion, puis les éliminés du dernier tour au premier ; à égalité, le temps tenu
      const rank = new Map<number, number>();
      if (ko.champion != null) rank.set(ko.champion, 999);
      ko.out.forEach((list, r) => list.forEach((p) => rank.set(p, r)));
      order = [...st].sort((a, b) => (rank.get(b.p) ?? -1) - (rank.get(a.p) ?? -1) || b.ms - a.ms);
    } else {
      order = [...st].sort((a, b) => a.cracks - b.cracks || b.ms - a.ms);
    }
    rows = order.map((s) => ({ name: players[s.p], score: secs(s.ms, t.dec), colorIndex: s.p, note: t.noteDuel(s.cracks, s.held) }));
    const tTie = !ko && order[1] && order[1].cracks === order[0].cracks && order[1].ms === order[0].ms;
    tomb = tTie ? null : order[0]?.p ?? null;
    // Prix décernés seulement s'il n'y a pas d'ex æquo
    const ws = [...st].sort((a, b) => b.cracks - a.cracks || a.ms - b.ms);
    const w = ws[0];
    const wTie = ws[1] && ws[1].cracks === w.cracks && ws[1].ms === w.ms;
    weak = w && w.cracks > 0 && w.p !== tomb && !wTie ? w.p : null;
    const gs = [...st].sort((a, b) => b.caused - a.caused);
    gold = gs[0] && gs[0].caused > 0 && !(gs[1] && gs[1].caused === gs[0].caused) ? gs[0].p : null;
  }

  const awards = [
    tomb != null && { icon: ko ? Crown : Skull, title: ko ? t.champion : t.tombstone, sub: t.tombstoneSub, p: tomb, bg: ZZ.yellow, mood: "cool" as const },
    weak != null && { icon: Drama, title: t.weakest, sub: t.weakestSub, p: weak, bg: ZZ.coral, mood: "rofl" as const },
    gold != null && { icon: Sparkles, title: t.goldClown, sub: t.goldClownSub, p: gold, bg: ZZ.pink, mood: "laughing" as const },
  ].filter(Boolean) as { icon: typeof Crown; title: string; sub: string; p: number; bg: string; mood: "cool" | "rofl" | "laughing" }[];

  return (
    <ZScreen tools={tools}>
      {overlays}
      {!reduced && <ConfettiBurst count={50} />}
      <ZTitle size="clamp(42px, 13vw, 58px)" as="h1" className="text-center">{t.endTitle}</ZTitle>
      <div className="mt-5 flex flex-col gap-3">
        {awards.map((a, i) => (
          <ZCard key={a.title} bg={a.bg} tilt={i % 2 ? 1.2 : -1.2} shadow={5} className="flex items-center gap-3 p-3">
            <PlayerBlob name={players[a.p]} colorIndex={a.p} size={52} mood={a.mood} crown={i === 0} bob={false} />
            <div className="min-w-0 flex-1" style={{ color: inkOn(a.bg) }}>
              <p className="flex items-center gap-1.5 text-[14px] font-bold"><a.icon size={15} strokeWidth={2.8} aria-hidden /> {a.title}</p>
              <p className="truncate text-[24px] leading-tight" style={DISPLAY}>{players[a.p]}</p>
              <p className="text-[13px] font-semibold">{a.sub}</p>
            </div>
          </ZCard>
        ))}
      </div>
      <div className="mt-6">
        <ZRanking rows={rows} unit={unit} />
      </div>
      <div className="mt-auto flex flex-col items-center gap-1 pt-7">
        <ZButton bg={ACCENT} onClick={onReplay}>{t.replay}</ZButton>
        {onQuit && <ZLink onClick={onQuit}>{t.quit}</ZLink>}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <ShareResultButton bg={ZZ.yellow} card={() => chutCard(
            awards.map((a) => ({ title: a.title, sub: a.sub, name: players[a.p], colorIndex: a.p, bg: a.bg })),
            rows.map((r) => ({
              name: r.name, value: unit ? `${r.score} ${unit}` : String(r.score), note: typeof r.note === "string" ? r.note : undefined,
              colorIndex: r.colorIndex, rank: 1 + rows.findIndex((x) => x.score === r.score),
            })),
          )} />
          <IdeaButton game={t.name} kind="carte" bg={ZZ.cream} />
        </div>
      </div>
    </ZScreen>
  );
}
