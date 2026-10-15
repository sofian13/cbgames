"use client";

/**
 * Loup-Garou sur UN SEUL téléphone : le tél est le meneur de jeu.
 * Setup (joueurs, rôles, options) → distribution secrète (on se passe le tél)
 * → nuits narrées (voix + écran) → jours (morts, débat chronométré, vote) → fin.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot } from "@/components/Mascot";
import { PlayerAvatar } from "@/components/avatar/PlayerBlob";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PassScreen, PlayersSetup, useScrollTopOn } from "@/components/games/local-kit";
import {
  MAX_PLAYERS, MIN_PLAYERS, ROLES, SPECIALS,
  applyDeaths, checkWinner, compositionProblem, deal, nightKills, recommended, villagersCount,
  type Composition, type Death, type Player, type Winner,
} from "./lg-local-data";
import { Ambience, lgSfx, preloadLgSfx, speak, speechAvailable, stopSpeech } from "./lg-local-audio";
import { isSfxMuted, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import { IdeaButton } from "@/components/games/idea-button";
import { NightRunner, type NightResult } from "./lg-local-night";
import { Check, Minus, Crosshair, Eye, EyeOff, FlaskConical, Handshake, Heart, HeartCrack, PawPrint, Shield, Skull, Fingerprint, Hand, Info, Moon, Music, Pause, Play, Plus, RotateCcw, Scale, ScrollText, Shuffle, SkipForward, Sparkles, Speech, Volume2, VolumeX, Vote, ArrowLeft } from "lucide-react";
import { GameIconBadge, GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import {
  BigButton, Confirm, CORAL, DISPLAY, INK, MINT, Modal, PickList, PlayerRow, RevealedBlob, RoleCard,
 RulesContent, Screen, SectionTitle, SkyBadge, Tag, Title, YELLOW, stk, type Tone,
} from "./lg-local-ui";
import { useT, pick, getLang } from "@/lib/i18n";
import { CAUSE_LABEL, ROLE_TEXT, STR, WIN_TEXT, type LgStrings } from "./lg-local-i18n";
import { RoleBlob } from "./lg-role-blob";
import { NightSleepers, WinnersParade } from "./lg-role-fx";
import { useGameFinished } from "@/lib/game-finished";
import { GameTuto, useFirstTimeTuto } from "@/components/games/game-tuto";
import { useLgTutoSlides } from "./tuto";
import { SoireeNextButton } from "@/components/games/soiree-next";
import { EndHomeLink, EndPill, EndPills, EndReplay } from "@/components/games/end-actions";

// ── Réglages persistants ──────────────────────────────────
interface Settings {
  voice: boolean;
  debateSec: number;
  voteMode: "hands" | "secret";
}
const SETTINGS_KEY = "zinzin-lg-local";
const DEFAULT_SETTINGS: Settings = { voice: true, debateSec: 180, voteMode: "hands" };

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch { /* défauts */ }
  return DEFAULT_SETTINGS;
}

// ── État de partie ────────────────────────────────────────
interface HistoryEntry { title: string; lines: string[] }

interface GameState {
  players: Player[];
  comp: Composition;
  lovers: [number, number] | null;
  night: number;
  potions: { life: boolean; death: boolean };
  lastProtected: number | null;
  history: HistoryEntry[];
  pendingHunters: number[];
}

type After = "debate" | "night";

type Phase =
  | { k: "players" }
  | { k: "roles" }
  | { k: "deal"; i: number; reveal: boolean }
  | { k: "ready" }
  | { k: "night" }
  | { k: "deaths"; deaths: Death[]; context: "dawn" | "vote" | "hunter"; after: After }
  | { k: "hunter"; id: number; after: After }
  | { k: "debate" }
  | { k: "vote"; candidates: number[] | null }
  | { k: "secret"; candidates: number[] | null; order: number[]; i: number; reveal: boolean; votes: Record<number, number> }
  | { k: "tally"; candidates: number[] | null; votes: Record<number, number> }
  | { k: "tie"; tied: number[] | null }
  | { k: "end"; winner: Winner };

const ACCENT = "#7A4EE8";

function dedupe(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((n) => {
    const k = n.toLowerCase();
    const c = (seen.get(k) ?? 0) + 1;
    seen.set(k, c);
    return c > 1 ? `${n} ${c}` : n;
  });
}

export default function LoupGarouLocal({ onReturnToLobby }: GameProps) {
  const t = useT(STR);
  const roleText = useT(ROLE_TEXT);
  const [names, setNames] = useState<string[]>([]);
  const [comp, setComp] = useState<Composition>(() => recommended(8));
  const [settings, setSettings] = useState<Settings>(() => (typeof window === "undefined" ? DEFAULT_SETTINGS : loadSettings()));
  const [game, setGame] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<Phase>({ k: "players" });
  // Fin de partie → note éventuelle + Soirée (app) : les joueurs du camp gagnant (même bande que WinnersParade)
  const lgWinner = phase.k === "end" ? phase.winner : null;
  useGameFinished(phase.k === "end", {
    winners: !game || !lgWinner || lgWinner === "personne" ? [] : game.players
      .filter((p) => (lgWinner === "loups" ? p.role === "loup" : lgWinner === "village" ? p.role !== "loup" : game.lovers?.includes(p.id)))
      .map((p) => p.name),
  });
  const [modal, setModal] = useState<null | "rules" | "history" | "sound">(null);
  // Tuto en slides : 1re partie, dès l'ouverture (avant la saisie des joueurs)
  const tuto = useFirstTimeTuto("loup-garou", { atMount: true });
  const tutoSlides = useLgTutoSlides();
  // Chaque nouvel écran s'ouvre en haut (l'app garde le défilement entre deux écrans)
  useScrollTopOn(`${phase.k}-${"i" in phase ? phase.i : ""}-${"reveal" in phase ? phase.reveal : ""}-${game?.history.length ?? 0}`);

  const ambience = useMemo(() => new Ambience(), []);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* rien */ }
  }, [settings]);

  // Sons du jeu préchargés ; coupure son = celle de toute l'app
  useEffect(() => preloadLgSfx(), []);
  const sfxMuted = useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);

  // Nettoyage : voix, son, écran allumé
  useEffect(() => () => {
    stopSpeech();
    ambience.dispose();
    void wakeLock.current?.release().catch(() => {});
  }, [ambience]);

  const say = useCallback((t: string) => speak(t, settings.voice), [settings.voice]);

  const tone: Tone = phase.k === "night" || phase.k === "ready" ? "night"
    : phase.k === "players" || phase.k === "roles" || phase.k === "deal" ? "dusk" : "day";

  useEffect(() => {
    ambience.setMood(tone === "night" && phase.k === "night" ? "night" : tone === "day" ? "day" : "off");
  }, [tone, phase.k, ambience]);

  const keepAwake = () => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (wakeLock.current || !nav.wakeLock) return;
    nav.wakeLock.request("screen").then((l) => { wakeLock.current = l; }).catch(() => {});
  };

  // ── Mécanique ──
  const finishWith = (g: GameState, after: After) => {
    if (g.pendingHunters.length) {
      const [id, ...rest] = g.pendingHunters;
      setGame({ ...g, pendingHunters: rest });
      setPhase({ k: "hunter", id, after });
      return;
    }
    const w = checkWinner(g.players, g.lovers);
    setGame(g);
    if (w) {
      setPhase({ k: "end", winner: w });
      return;
    }
    if (after === "debate") setPhase({ k: "debate" });
    else setPhase({ k: "ready" });
  };

  const kill = (g: GameState, kills: Death[], context: "dawn" | "vote" | "hunter", after: After, extraLog?: string) => {
    const { players, deaths } = applyDeaths(g.players, kills, g.lovers);
    const hunters = deaths.filter((d) => players[d.id].role === "chasseur").map((d) => d.id);
    const lines = deaths.map((d) => `${CAUSE_EMOJI[d.cause]} ${t.logDies(players[d.id].name, roleText[players[d.id].role].name)}`);
    const history = [...g.history];
    if (context !== "dawn") {
      history.push({
        title: context === "vote" ? t.histVote(g.night) : t.histHunter(g.night),
        lines: [...(extraLog ? [extraLog] : []), ...(lines.length ? lines : [t.nobodyOut])],
      });
    } else if (history.length) {
      const last = history[history.length - 1];
      history[history.length - 1] = { ...last, lines: [...last.lines, ...(lines.length ? lines : [t.nobodyDies])] };
    }
    setGame({ ...g, players, history, pendingHunters: [...g.pendingHunters, ...hunters] });
    setPhase({ k: "deaths", deaths, context, after });
  };

  const startGame = (n: string[], c: Composition) => {
    const players = deal(n, c);
    setGame({
      players, comp: c, lovers: null, night: 1,
      potions: { life: true, death: true }, lastProtected: null, history: [], pendingHunters: [],
    });
    setPhase({ k: "deal", i: 0, reveal: false });
  };

  // Fin de nuit : on applique les actions puis on annonce les morts.
  // (handler lu via ref : le NightRunner garde une callback stable)
  const nightDone = useRef<(r: NightResult) => void>(() => {});
  const handleNightDone = (r: NightResult) => {
    if (!game) return;
    const a = r.actions;
    const g: GameState = {
      ...game,
      lovers: a.lovers ?? game.lovers,
      potions: { life: game.potions.life && !a.saved, death: game.potions.death && a.poison === null },
      lastProtected: a.protect,
      history: [...game.history, { title: t.nightN(game.night), lines: r.log }],
    };
    kill(g, nightKills(a), "dawn", "debate");
  };
  useLayoutEffect(() => { nightDone.current = handleNightDone; });
  const onNightDone = useCallback((r: NightResult) => nightDone.current(r), []);

  const goNight = () => {
    ambience.unlock();
    keepAwake();
    ambience.setMood("night");
    lgSfx.nightFall();
    // Premier mot dans le geste utilisateur (débloque la voix sur iOS)
    speak(" ", settings.voice);
    setPhase({ k: "night" });
  };

  const nextNight = () => {
    if (!game) return;
    setGame({ ...game, night: game.night + 1 });
    goNight();
  };

  // ── Rendu ──
  let content: React.ReactNode = null;

  if (phase.k === "players") {
    content = (
      <PlayersSetup
        emoji="🐺"
        name={t.gameName}
        min={MIN_PLAYERS}
        max={MAX_PLAYERS}
        accent={ACCENT}
        onStart={(n) => {
          const d = dedupe(n);
          setNames(d);
          setComp(recommended(d.length));
          setPhase({ k: "roles" });
        }}
      />
    );
  } else if (phase.k === "roles") {
    content = (
      <RolesSetup
        n={names.length}
        comp={comp}
        setComp={setComp}
        settings={settings}
        setSettings={setSettings}
        sfxMuted={sfxMuted}
        onBack={() => setPhase({ k: "players" })}
        onStart={() => {
          ambience.unlock();
          startGame(names, comp);
        }}
      />
    );
  } else if (game && phase.k === "deal") {
    const p = game.players[phase.i];
    const last = phase.i === game.players.length - 1;
    content = phase.reveal ? (
      <HoldReveal
        key={p.id}
        player={p}
        last={last}
        onDone={() => setPhase(last ? { k: "ready" } : { k: "deal", i: phase.i + 1, reveal: false })}
      />
    ) : (
      <PassScreen
        toName={p.name}
        colorIndex={p.id}
        accent={ACCENT}
        hint={t.dealHint}
        buttonLabel={t.dealBtn}
        onReady={() => setPhase({ k: "deal", i: phase.i, reveal: true })}
      />
    );
  } else if (game && phase.k === "ready") {
    const first = game.night === 1 && game.history.length === 0;
    content = (
      <Screen tone="night" center>
        <div className="text-center">
          <SkyBadge tone="night" size={64} />
          <div className="mt-3"><NightSleepers size={66} /></div>
          <div className="mt-4"><Tag bg="#2A1866" color="#fff" tilt={-2}>{first ? t.everyoneHasCard : t.endOfDay(game.night)}</Tag></div>
          <Title size={32} className="mt-3">{t.putPhone}</Title>
          <p className="mx-auto mt-3 max-w-xs text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>
            {settings.voice && speechAvailable() ? t.faceUpVoice : t.faceUpNoVoice}
          </p>
          {/* Consigne claire avant la nuit : on ferme les yeux */}
          <div className="mx-auto mt-5 max-w-xs rounded-[22px] px-4 py-3" style={{ background: "#FFD23F", color: "#15082E", border: "3px solid #15082E", boxShadow: "0 4px 0 #15082E", rotate: "-1.5deg" }}>
            <p className="flex items-center justify-center gap-2 text-[21px] leading-tight" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700 }}>
              <EyeOff size={24} strokeWidth={2.8} aria-hidden /> {t.closeEyes}
            </p>
            <p className="mt-1 text-[15px] font-semibold leading-snug">
              {settings.voice && speechAvailable() ? t.closeEyesVoice : t.closeEyesNoVoice}
            </p>
          </div>
          <div className="mt-6">
            <BigButton onClick={first ? goNight : nextNight}><GameInlineIcon icon={Moon} /> {t.letNightFall}</BigButton>
          </div>
        </div>
      </Screen>
    );
  } else if (game && phase.k === "night") {
    content = (
      <NightRunner
        key={game.night}
        night={game.night}
        players={game.players}
        comp={game.comp}
        potions={game.potions}
        lastProtected={game.lastProtected}
        voice={settings.voice}
        ambience={ambience}
        onDone={onNightDone}
      />
    );
  } else if (game && phase.k === "deaths") {
    content = (
      <DeathsScreen
        key={`${phase.context}-${game.history.length}-${phase.deaths.map((d) => d.id).join("-")}`}
        game={game}
        deaths={phase.deaths}
        context={phase.context}
        say={say}
        onNext={() => finishWith(game, phase.after)}
      />
    );
  } else if (game && phase.k === "hunter") {
    content = (
      <HunterScreen
        key={phase.id}
        game={game}
        hunterId={phase.id}
        say={say}
        onShoot={(target) => kill(game, [{ id: target, cause: "chasseur" }], "hunter", phase.after,
          t.logHunter(game.players[phase.id].name, game.players[target].name))}
      />
    );
  } else if (game && phase.k === "debate") {
    content = (
      <DebateScreen
        game={game}
        seconds={settings.debateSec}
        say={say}
        onBell={() => ambience.bell(2)}
        onVote={() => setPhase(settings.voteMode === "secret"
          ? secretStart(game, null)
          : { k: "vote", candidates: null })}
      />
    );
  } else if (game && phase.k === "vote") {
    content = (
      <HandsVote
        game={game}
        candidates={phase.candidates}
        say={say}
        onEliminate={(id) => kill(game, [{ id, cause: "vote" }], "vote", "night")}
        onTie={() => { lgSfx.tie(); setPhase({ k: "tie", tied: null }); }}
      />
    );
  } else if (game && phase.k === "secret") {
    const voter = game.players[phase.order[phase.i]];
    content = phase.reveal ? (
      <SecretBallot
        key={voter.id}
        game={game}
        voter={voter}
        candidates={phase.candidates}
        onVote={(target) => {
          const votes = { ...phase.votes, [voter.id]: target };
          if (phase.i + 1 < phase.order.length) setPhase({ ...phase, i: phase.i + 1, reveal: false, votes });
          else setPhase({ k: "tally", candidates: phase.candidates, votes });
        }}
      />
    ) : (
      <PassScreen
        toName={voter.name}
        colorIndex={voter.id}
        accent="#FFB347"
        hint={t.secretHint}
        buttonLabel={t.secretBtn}
        onReady={() => setPhase({ ...phase, reveal: true })}
      />
    );
  } else if (game && phase.k === "tally") {
    content = (
      <TallyScreen
        game={game}
        votes={phase.votes}
        say={say}
        onEliminate={(id) => kill(game, [{ id, cause: "vote" }], "vote", "night")}
        onTie={(tied) => { lgSfx.tie(); setPhase({ k: "tie", tied }); }}
      />
    );
  } else if (game && phase.k === "tie") {
    content = (
      <Screen tone="day" center>
        <div className="text-center">
          <div className="flex justify-center"><Mascot size={110} color="yellow" mood="thinking" shadow={false} /></div>
          <Title size={48} className="mt-4">{t.tieTitle}</Title>
          {phase.tied && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {phase.tied.map((id, k) => <Tag key={id} bg={YELLOW} tilt={k % 2 ? 2 : -2}>{game.players[id].name}</Tag>)}
            </div>
          )}
          <p className="mt-4 text-[18px] font-semibold">{t.tieWhat}</p>
          <div className="mt-8 grid gap-3">
            <BigButton onClick={() => setPhase(settings.voteMode === "secret"
              ? secretStart(game, phase.tied)
              : { k: "vote", candidates: phase.tied })}>
              <GameInlineIcon icon={RotateCcw} /> {t.revote(!!phase.tied)}
            </BigButton>
            <BigButton variant="ghost" onClick={() => kill(game, [], "vote", "night", t.logTie)}>
              {t.nobodyOutBtn}
            </BigButton>
          </div>
        </div>
      </Screen>
    );
  } else if (game && phase.k === "end") {
    content = (
      <EndScreen
        game={game}
        winner={phase.winner}
        say={say}
        onReplay={() => { setGame(null); setPhase({ k: "roles" }); }}
        onNewPlayers={() => { setGame(null); setPhase({ k: "players" }); }}
        onQuit={() => onReturnToLobby?.()}
        onHistory={() => setModal("history")}
      />
    );
  }

  const nightNow = phase.k === "night" || phase.k === "ready";

  return (
    <div className="relative w-full" style={{ minHeight: "100dvh", background: "#05030E" }}>
      {content}

      {/* Contrôles en haut à droite (le coin haut-gauche est réservé à l'app) */}
      <GameTopRight className="z-50" >
        <div className="flex gap-2.5" style={{ opacity: nightNow ? 0.55 : 1 }}>
          <GameIconButton icon={Info} label={t.rules} onClick={() => setModal("rules")} />
          {game && <GameIconButton icon={ScrollText} label={t.history} onClick={() => setModal("history")} />}
          <GameIconButton icon={settings.voice || !sfxMuted ? Volume2 : VolumeX} label={t.sound} onClick={() => setModal("sound")} />
        </div>
      </GameTopRight>

      {modal === "rules" && (
        <Modal title={t.rulesTitle} onClose={() => setModal(null)}><RulesContent onTuto={() => { setModal(null); tuto.show(); }} /></Modal>
      )}
      {modal === "sound" && (
        <Modal title={t.sound} onClose={() => setModal(null)}>
          <SoundOptions settings={settings} setSettings={setSettings} sfxMuted={sfxMuted} />
        </Modal>
      )}
      {modal === "history" && game && (
        <HistoryModal game={game} spoilerFree={phase.k === "end"} onClose={() => setModal(null)} />
      )}
      {tuto.open && <GameTuto slides={tutoSlides} onDone={tuto.close} />}
    </div>
  );
}

const CAUSE_EMOJI: Record<Death["cause"], string> = {
  loups: "🐺", poison: "☠️", vote: "🗳️", chasseur: "🎯", chagrin: "💔",
};

function secretStart(game: GameState, candidates: number[] | null): Phase {
  return {
    k: "secret", candidates, i: 0, reveal: false, votes: {},
    order: game.players.filter((p) => p.alive).map((p) => p.id),
  };
}

// ── Setup des rôles ───────────────────────────────────────
function Toggle({ on, onClick, label, sub }: { on: boolean; onClick: () => void; label: React.ReactNode; sub?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left transition-transform active:translate-y-[2px]"
      style={{ ...stk("#fff", 3), color: INK, minHeight: 60 }}
    >
      <span className="flex-1">
        <span className="block text-[17px] font-bold">{label}</span>
        {sub && <span className="block text-[14px] font-medium leading-snug" style={{ color: "#4A3A66" }}>{sub}</span>}
      </span>
      <span className="relative h-8 w-14 shrink-0 rounded-full transition" style={{ background: on ? MINT : "#D9D0E8", border: `2.5px solid ${INK}` }}>
        <span className="absolute top-[2px] h-[22px] w-[22px] rounded-full bg-white transition-all" style={{ left: on ? 26 : 3, border: `2px solid ${INK}` }} />
      </span>
    </button>
  );
}

function Chips<T extends string | number>({ value, options, onPick }: { value: T; options: { v: T; label: React.ReactNode }[]; onPick: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o, k) => {
        const on = value === o.v;
        return (
          <button
            key={String(o.v)}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(o.v)}
            className="rounded-full px-4 text-[16px] font-bold transition-transform active:translate-y-[2px]"
            style={{ ...stk(on ? YELLOW : "#fff", on ? 4 : 2), color: INK, minHeight: 46, transform: on ? `rotate(${k % 2 ? 2 : -2}deg)` : undefined }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SoundOptions({ settings, setSettings, sfxMuted }: { settings: Settings; setSettings: (s: Settings) => void; sfxMuted: boolean }) {
  const canSpeak = speechAvailable();
  const t = useT(STR);
  return (
    <div className="grid gap-3">
      <Toggle
        on={settings.voice && canSpeak}
        onClick={() => { if (canSpeak) setSettings({ ...settings, voice: !settings.voice }); }}
        label={<><GameInlineIcon icon={Speech} /> {t.voiceLabel}</>}
        sub={canSpeak ? t.voiceSub : t.voiceNo}
      />
      <Toggle
        on={!sfxMuted}
        onClick={() => setSfxMuted(!sfxMuted)}
        label={<><GameInlineIcon icon={Music} /> {t.sfxLabel}</>}
        sub={t.sfxSub}
      />
    </div>
  );
}

function RolesSetup({
  n, comp, setComp, settings, setSettings, sfxMuted, onBack, onStart,
}: {
  n: number; comp: Composition; setComp: (c: Composition) => void;
  settings: Settings; setSettings: (s: Settings) => void; sfxMuted: boolean;
  onBack: () => void; onStart: () => void;
}) {
  const t = useT(STR);
  const roleText = useT(ROLE_TEXT);
  const problemCode = compositionProblem(comp, n);
  const problem = problemCode === "noWolf" ? t.problemNoWolf : problemCode === "tooManyRoles" ? t.problemTooManyRoles : problemCode ? t.problemTooManyWolves : null;
  const villagers = villagersCount(comp, n);
  const rec = recommended(n);
  const isRec = JSON.stringify(rec) === JSON.stringify(comp);
  const maxWolves = Math.max(1, Math.ceil(n / 2) - 1);

  return (
    <Screen tone="dusk">
      <Title size={48}>{t.rolesTitle}</Title>
      <div className="mt-3 flex flex-wrap gap-2">
        <Tag bg={YELLOW} tilt={-2}>{t.nPlayers(n)}</Tag>
        <Tag bg={CORAL} tilt={2}>{t.wolvesVs(comp.loup, n - comp.loup)}</Tag>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3">
        {/* Loups : compteur (gap réduit : tient en 375 px sans déborder) */}
        <div className="flex items-center gap-2 rounded-[22px] px-3 py-2" style={{ ...stk(ROLES.loup.accent, 4, 3), color: INK, minHeight: 66, transform: "rotate(-1deg)" }}>
          <RoleBlob role="loup" size={42} still />
          <span className="min-w-0 flex-1 truncate" style={{ ...DISPLAY, fontSize: 18, letterSpacing: "-0.02em" }}>{t.theWolves}</span>
          <GameIconButton icon={Minus} label={t.fewerWolves} onClick={() => setComp({ ...comp, loup: Math.max(1, comp.loup - 1) })} />
          <span className="w-7 text-center" style={{ ...DISPLAY, fontSize: 30 }}>{comp.loup}</span>
          <GameIconButton icon={Plus} label={t.moreWolves} bg={INK} color="#fff" onClick={() => setComp({ ...comp, loup: Math.min(maxWolves, comp.loup + 1) })} />
        </div>

        {SPECIALS.map((id) => {
          const r = ROLES[id];
          const on = comp[id as keyof Composition] as boolean;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setComp({ ...comp, [id]: !on })}
              className="flex w-full items-center gap-3 rounded-[22px] px-3 py-2.5 text-left transition-transform active:translate-y-[2px]"
              style={{ ...stk(on ? r.accent : "#2A1866", on ? 4 : 3, 3), color: on ? INK : "#fff", minHeight: 66 }}
            >
              <RoleBlob role={id} size={50} still={!on} />
              <span className="flex-1">
                <span className="block" style={{ ...DISPLAY, fontSize: 21, letterSpacing: "-0.01em" }}>{roleText[id].name}</span>
                <span className="block text-[14px] font-medium leading-snug" style={{ opacity: on ? 0.85 : 0.75 }}>{roleText[id].power}</span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ ...stk(on ? "#fff" : "#fff", 2, 2.5), color: INK }}>
                {on ? <Check size={19} strokeWidth={3.2} aria-hidden /> : <Plus size={19} strokeWidth={3.2} aria-hidden />}
              </span>
            </button>
          );
        })}

        <div className="flex items-center gap-3 rounded-[22px] px-3 py-2" style={{ ...stk(MINT, 4, 3), color: INK, minHeight: 62, transform: "rotate(1deg)" }}>
          <RoleBlob role="villageois" size={50} still />
          <span className="flex-1" style={{ ...DISPLAY, fontSize: 21, letterSpacing: "-0.01em" }}>{roleText.villageois.name}</span>
          <span className="w-10 text-center" style={{ ...DISPLAY, fontSize: 30 }}>{Math.max(0, villagers)}</span>
        </div>
      </div>

      {!isRec && (
        <button type="button" onClick={() => setComp(rec)} className="mt-4 self-center rounded-full px-4 text-[16px] font-bold active:translate-y-[2px]" style={{ ...stk(YELLOW, 3), color: INK, minHeight: 46 }}>
          <GameInlineIcon icon={Sparkles} /> {t.recommended}
        </button>
      )}

      <SectionTitle className="mt-8 mb-3">{t.debateTime}</SectionTitle>
      <Chips value={settings.debateSec} onPick={(v) => setSettings({ ...settings, debateSec: v })}
        options={[60, 120, 180, 300].map((v) => ({ v, label: t.min(v / 60) }))} />

      <SectionTitle className="mt-7 mb-3">{t.voteTitle}</SectionTitle>
      <Chips value={settings.voteMode} onPick={(v) => setSettings({ ...settings, voteMode: v })}
        options={[{ v: "hands", label: <><GameInlineIcon icon={Hand} /> {t.hands}</> }, { v: "secret", label: <><GameInlineIcon icon={EyeOff} /> {t.secret}</> }]} />

      <SectionTitle className="mt-7 mb-3">{t.soundTitle}</SectionTitle>
      <SoundOptions settings={settings} setSettings={setSettings} sfxMuted={sfxMuted} />

      <div className="mt-6 flex justify-center">
        <IdeaButton game="Loup-Garou" kind="idée de rôle" bg="#fff" />
      </div>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] mt-8 grid gap-1 pt-2">
        {problem && <p className="mb-2 rounded-full px-4 py-2 text-center text-[15px] font-bold" style={{ ...stk(CORAL, 3), color: INK }}>{problem}</p>}
        <BigButton onClick={onStart} disabled={!!problem}><GameInlineIcon icon={Shuffle} /> {t.dealRoles}</BigButton>
      </div>
      <button type="button" onClick={onBack} className="mt-2 text-[15px] font-semibold" style={{ minHeight: 44, color: "rgba(255,255,255,0.8)" }}><GameInlineIcon icon={ArrowLeft} /> {t.editPlayers}</button>
    </Screen>
  );
}

// ── Distribution : appui long pour voir sa carte ─────────
function HoldReveal({ player, last, onDone }: { player: Player; last: boolean; onDone: () => void }) {
  const t = useT(STR);
  const [holding, setHolding] = useState(false);
  const [seen, setSeen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const down = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setHolding(true); setSeen(true); lgSfx.reveal(); }, 250);
  };
  const up = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <Screen tone="dusk">
      <p className="text-center text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.secretCardOf}</p>
      <Title size={player.name.length > 10 ? 38 : 48} className="mt-1 text-center">{player.name}</Title>

      <div
        className="mt-5 select-none"
        style={{ touchAction: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
        data-testid="hold-card"
      >
        {holding ? (
          <RoleCard role={player.role} subtitle={t.youAre} />
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-[28px] text-center"
            style={{
              ...stk("#7A4EE8", 6, 3),
              minHeight: "min(380px, 50dvh)",
              transform: "rotate(1.5deg)",
              backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 14px, transparent 14px 28px)",
            }}
          >
            <span className="grid h-24 w-24 place-items-center rounded-full" style={{ ...stk(YELLOW, 4, 3), color: INK }}>
              <Fingerprint size={54} strokeWidth={2.2} aria-hidden />
            </span>
            <p className="mt-5 px-6" style={{ ...DISPLAY, fontSize: 28, lineHeight: 1.05 }}>
              {t.holdHere}
            </p>
            <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.releaseHide}</p>
          </div>
        )}
      </div>

      {player.role === "loup" && holding && (
        <p className="mt-5 text-center text-[16px] font-bold" style={{ color: "#FFB3AA" }}>{t.packNote}</p>
      )}

      <div className="mt-auto pt-8">
        <BigButton onClick={onDone} disabled={!seen}>
          {seen ? (last ? t.seenLast : t.seenNext) : t.lookFirst}
        </BigButton>
      </div>
    </Screen>
  );
}

// ── Annonce des morts ─────────────────────────────────────
function deathSentence(t: LgStrings, p: Player, cause: Death["cause"]): string {
  const role = pick(ROLE_TEXT, getLang())[p.role].name;
  switch (cause) {
    case "vote": return t.sentVote(p.name, role);
    case "chasseur": return t.sentHunter(p.name, role);
    case "chagrin": return t.sentGrief(p.name, role);
    default: return t.sentNight(p.name, role);
  }
}

function DeathsScreen({
  game, deaths, context, say, onNext,
}: {
  game: GameState; deaths: Death[]; context: "dawn" | "vote" | "hunter"; say: (t: string) => void; onNext: () => void;
}) {
  const t = useT(STR);
  const roleText = useT(ROLE_TEXT);
  const causeLabel = useT(CAUSE_LABEL);
  const intro = context === "dawn" ? t.dawnIntro : "";
  const none = context === "dawn" ? t.noneDawn : t.noneVote;
  const lines = deaths.length ? deaths.map((d) => deathSentence(t, game.players[d.id], d.cause)) : [none];

  useEffect(() => {
    say([intro, ...lines].filter(Boolean).join(" "));
    if (context === "dawn") lgSfx.dawn();
    else if (deaths.length) lgSfx.verdict();
    // au vote, le verdict (boom) suffit : pas de 2e impact + « oh » par-dessus
    const t = setTimeout(() => {
      if (!deaths.length) lgSfx.spared();
      else if (context === "dawn") lgSfx.death();
    }, context === "dawn" ? 700 : 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen tone="day">
      <div className="text-center">
        {context === "dawn" && <SkyBadge tone="day" size={72} />}
        <div className="mt-5">
          <Tag bg="#fff" tilt={-2}>{context === "dawn" ? t.dayN(game.night) : context === "vote" ? t.tagVerdict : t.tagHunter}</Tag>
        </div>
        <Title size={40} className="mt-3">
          {context === "dawn" ? t.titleDawn : deaths.length ? t.titleExecuted : t.titleSpared}
        </Title>
      </div>

      <div className="mt-7 grid gap-4">
        {deaths.length === 0 ? (
          <div className="flex flex-col items-center rounded-[26px] p-6 text-center" style={{ ...stk(MINT, 6, 3), color: INK, transform: "rotate(-1.5deg)" }}>
            <Mascot size={100} color="mint" mood="laughing" cheering shadow={false} />
            <p className="mt-3" style={{ ...DISPLAY, fontSize: 24, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{none}</p>
          </div>
        ) : deaths.map((d, k) => {
          const p = game.players[d.id];
          const r = ROLES[p.role];
          return (
            <div key={d.id} className="flex items-center gap-4 rounded-[26px] p-4" style={{ ...stk("#fff", 5, 3), color: INK, transform: `rotate(${k % 2 ? 1.2 : -1.2}deg)` }}>
              <RevealedBlob p={p} size={84} ghost reveal delay={k * 0.4} />
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ ...DISPLAY, fontSize: 30, lineHeight: 1 }}>{p.name}</p>
                <p className="mt-0.5 text-[15px] font-semibold" style={{ color: "#4A3A66" }}>{causeLabel[d.cause]}</p>
                <span className="mt-2 inline-flex rounded-full px-3 py-1 text-[16px] font-bold" style={{ ...stk(r.accent, 2, 2) }}>{roleText[p.role].name}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <BigButton onClick={onNext}>{t.continue}</BigButton>
      </div>
    </Screen>
  );
}


// ── Chasseur ──────────────────────────────────────────────
function HunterScreen({ game, hunterId, say, onShoot }: { game: GameState; hunterId: number; say: (t: string) => void; onShoot: (id: number) => void }) {
  const t = useT(STR);
  const hunter = game.players[hunterId];
  const [sel, setSel] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    say(t.hunterSay(hunter.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const alive = game.players.filter((p) => p.alive);
  const target = alive.find((p) => p.id === sel);
  return (
    <Screen tone="day">
      <div className="text-center">
        <div className="flex justify-center"><RoleBlob role="chasseur" size={104} state="ghost" reveal /></div>
        <Title size={38} className="mt-3">{t.hunterTitle(hunter.name)}</Title>
        <p className="mt-2 text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{t.hunterSub}</p>
      </div>
      <div className="mt-6">
        <PickList players={alive} selected={sel === null ? [] : [sel]} onPick={setSel} />
      </div>
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] mt-auto pt-5">
        <BigButton variant="danger" disabled={!target} onClick={() => setConfirm(true)}>
          {target ? t.shootAt(target.name) : t.pickTarget}
        </BigButton>
      </div>
      {confirm && target && (
        <Confirm text={t.takeWith(target.name)} yes={t.yesShoot} danger onYes={() => onShoot(target.id)} onNo={() => setConfirm(false)} />
      )}
    </Screen>
  );
}

// ── Débat ─────────────────────────────────────────────────
function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function DebateScreen({ game, seconds, say, onBell, onVote }: { game: GameState; seconds: number; say: (t: string) => void; onBell: () => void; onVote: () => void }) {
  const t = useT(STR);
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(true);
  const rang = useRef(false);

  useEffect(() => {
    const m = Math.round(seconds / 60);
    say(t.debateSay(m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [running, left]);

  useEffect(() => {
    if (left === 0 && !rang.current) {
      rang.current = true;
      onBell();
      say(t.timeUpSay);
    }
  }, [left, onBell, say, t]);

  const alive = game.players.filter((p) => p.alive);
  const pct = Math.max(0, left / seconds);
  const over = left <= 0;
  const ring = over ? CORAL : left <= 15 ? "#FFB347" : YELLOW;

  return (
    <Screen tone="day">
      <div className="text-center"><Tag bg="#fff" tilt={-2}>{t.tagDebate(game.night)}</Tag></div>
      <Title size={40} className="mt-3 text-center">
        {over ? t.timeUp : t.whoWolves}
      </Title>

      <div className="relative mx-auto mt-6 flex items-center justify-center rounded-full" style={{ width: 220, height: 220, ...stk("#fff", 6, 3) }}>
        <svg width={208} height={208} className="absolute -rotate-90" style={{ left: 3, top: 3 }}>
          <circle cx={104} cy={104} r={88} fill="none" stroke="#EDE6F7" strokeWidth={18} />
          <circle cx={104} cy={104} r={88} fill="none" stroke={ring} strokeWidth={18} strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }} />
        </svg>
        <span className="relative" style={{ ...DISPLAY, fontSize: 58, color: INK, fontVariantNumeric: "tabular-nums" }}>{fmt(Math.max(0, left))}</span>
      </div>

      {!over && (
        <div className="mt-7 grid grid-cols-2 gap-3">
          <BigButton variant="ghost" onClick={() => setRunning((r) => !r)}>{running ? <><GameInlineIcon icon={Pause} /> {t.pause}</> : <><GameInlineIcon icon={Play} /> {t.resume}</>}</BigButton>
          <BigButton variant="ghost" onClick={() => setLeft((l) => l + 30)}>{t.plus30}</BigButton>
        </div>
      )}

      <SectionTitle className="mt-8 mb-3 text-center">{t.stillAlive(alive.length)}</SectionTitle>
      <div className="flex flex-wrap justify-center gap-2.5">
        {alive.map((p, k) => (
          <span key={p.id} className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[16px] font-bold" style={{ ...stk("#fff", 2, 2), color: INK, transform: `rotate(${k % 2 ? 1.5 : -1.5}deg)` }}>
            <PlayerAvatar name={p.name} colorIndex={p.id} size={28} border={false} mood="sus" /> {p.name}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <BigButton variant={over ? "primary" : "ghost"} onClick={onVote}>{over ? <><GameInlineIcon icon={Vote} /> {t.goVote}</> : <>{t.goVote} <GameInlineIcon icon={SkipForward} /></>}</BigButton>
      </div>
    </Screen>
  );
}

// ── Vote à main levée ─────────────────────────────────────
function HandsVote({
  game, candidates, say, onEliminate, onTie,
}: {
  game: GameState; candidates: number[] | null; say: (t: string) => void; onEliminate: (id: number) => void; onTie: () => void;
}) {
  const t = useT(STR);
  const [sel, setSel] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    say(candidates ? t.revoteSay : t.voteSay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const list = game.players.filter((p) => p.alive && (!candidates || candidates.includes(p.id)));
  const target = list.find((p) => p.id === sel);
  return (
    <Screen tone="day">
      <div className="text-center"><Tag bg="#fff" tilt={-2}>{t.tagVote(game.night)}</Tag></div>
      <Title size={36} className="mt-3 text-center">{t.whoOut}</Title>
      <p className="mt-2 text-center text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{t.handsHint}</p>
      <div className="mt-6">
        <PickList players={list} selected={sel === null ? [] : [sel]} onPick={setSel} />
      </div>
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] mt-auto grid gap-3 pt-5">
        <BigButton variant="danger" disabled={!target} onClick={() => setConfirm(true)}>
          {target ? t.eliminate(target.name) : t.touchDesignated}
        </BigButton>
        <BigButton variant="ghost" onClick={onTie}><GameInlineIcon icon={Scale} /> {t.tie}</BigButton>
      </div>
      {confirm && target && (
        <Confirm text={t.confirmEliminate(target.name)} yes={t.yesEliminate} danger onYes={() => onEliminate(target.id)} onNo={() => setConfirm(false)} />
      )}
    </Screen>
  );
}

// ── Vote secret ───────────────────────────────────────────
function SecretBallot({ game, voter, candidates, onVote }: { game: GameState; voter: Player; candidates: number[] | null; onVote: (id: number) => void }) {
  const t = useT(STR);
  const [sel, setSel] = useState<number | null>(null);
  const list = game.players.filter((p) => p.alive && p.id !== voter.id && (!candidates || candidates.includes(p.id)));
  const target = list.find((p) => p.id === sel);
  return (
    <Screen tone="dusk">
      <p className="text-center text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{t.secretOf}</p>
      <Title size={46} className="mt-1 text-center">{voter.name}</Title>
      <p className="mt-2 text-center text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.againstWho}</p>
      <div className="mt-6">
        <PickList players={list} selected={sel === null ? [] : [sel]} onPick={setSel} />
      </div>
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] mt-auto pt-5">
        <BigButton disabled={!target} onClick={() => target && onVote(target.id)}>
          {target ? t.voteAgainst(target.name) : t.pickPlayer}
        </BigButton>
      </div>
    </Screen>
  );
}

function TallyScreen({
  game, votes, say, onEliminate, onTie,
}: {
  game: GameState; votes: Record<number, number>; say: (t: string) => void; onEliminate: (id: number) => void; onTie: (tied: number[]) => void;
}) {
  const t = useT(STR);
  const counts = new Map<number, number>();
  Object.values(votes).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] ?? 0;
  const top = rows.filter((r) => r[1] === max).map((r) => r[0]);
  const winner = top.length === 1 ? game.players[top[0]] : null;

  useEffect(() => {
    say(t.tallySay(winner ? winner.name : null));
    lgSfx.card();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen tone="day">
      <Title size={42} className="text-center">{t.tallyTitle}</Title>
      <div className="mt-6 grid gap-3">
        {rows.map(([id, c], k) => (
          <div key={id} className="flex items-center gap-3 rounded-[20px] px-3 py-2" style={{ ...stk(top.includes(id) ? CORAL : "#fff", top.includes(id) ? 4 : 3), color: INK, minHeight: 60, transform: top.includes(id) ? `rotate(${k % 2 ? 1 : -1}deg)` : undefined }}>
            <PlayerAvatar name={game.players[id].name} colorIndex={id} size={38} border={false} mood={top.includes(id) ? "shocked" : "neutral"} />
            <span className="flex-1 truncate" style={{ ...DISPLAY, fontSize: 22, letterSpacing: "-0.01em" }}>{game.players[id].name}</span>
            <span className="flex items-center gap-1.5" style={{ ...DISPLAY, fontSize: 26 }}>{c} <Vote size={22} strokeWidth={2.6} aria-hidden /></span>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-8">
        {winner
          ? <BigButton variant="danger" onClick={() => onEliminate(winner.id)}>{t.eliminate(winner.name)}</BigButton>
          : <BigButton onClick={() => onTie(top)}><GameInlineIcon icon={Scale} /> {t.tieWhatNow}</BigButton>}
      </div>
    </Screen>
  );
}

// ── Fin ───────────────────────────────────────────────────
const WIN_STYLE: Record<Winner, { bg: string; mood: "cool" | "angry" | "love" | "sad"; mascot: "mint" | "coral" | "pink" | "white" }> = {
  village: { bg: MINT, mood: "cool", mascot: "mint" },
  loups: { bg: CORAL, mood: "angry", mascot: "coral" },
  amoureux: { bg: "#FF3EA5", mood: "love", mascot: "pink" },
  personne: { bg: "#B5A1FF", mood: "sad", mascot: "white" },
};

function EndScreen({
  game, winner, say, onReplay, onNewPlayers, onQuit, onHistory,
}: {
  game: GameState; winner: Winner; say: (t: string) => void;
  onReplay: () => void; onNewPlayers: () => void; onQuit: () => void; onHistory: () => void;
}) {
  const t = useT(STR);
  const w = { ...WIN_STYLE[winner], ...useT(WIN_TEXT)[winner] };
  useEffect(() => {
    say(`${w.title} ${w.sub}`);
    if (winner === "personne") lgSfx.allDead();
    else lgSfx.win();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sorted = [...game.players].sort((a, b) => (a.role === "loup" ? 0 : 1) - (b.role === "loup" ? 0 : 1));
  return (
    <Screen tone="day">
      {winner !== "personne" && <ConfettiBurst count={70} />}
      {/* La bande du camp gagnant saute de joie (les loups hurlent à la lune) */}
      <div className="relative z-[1] mb-3">
        <WinnersParade players={game.players} winner={winner} lovers={game.lovers} />
      </div>
      <div className="relative rounded-[28px] px-5 pb-6 pt-8 text-center" style={{ ...stk(w.bg, 6, 3), color: INK, transform: "rotate(-1.5deg)" }}>
        <Title size={42}>{w.title}</Title>
        <p className="mt-2 text-[17px] font-semibold">{w.sub}</p>
      </div>
      <SectionTitle className="mt-8 mb-3">{t.whoWasWho}</SectionTitle>
      <div className="grid gap-2.5">
        {sorted.map((p) => <PlayerRow key={p.id} p={p} lover={!!game.lovers?.includes(p.id)} gain />)}
      </div>
      <button type="button" onClick={onHistory} className="mt-4 self-center rounded-full px-4 text-[16px] font-bold active:translate-y-[2px]" style={{ ...stk("#fff", 3), color: INK, minHeight: 46 }}>
        <GameInlineIcon icon={ScrollText} /> {t.seeHistory}
      </button>
      <div className="mt-8 grid gap-3">
        {/* Une seule action principale (Jeu suivant en Soirée, sinon Rejouer), le reste en pastilles */}
        <SoireeNextButton />
        <EndReplay onClick={onReplay} label={t.replaySame}>
          <BigButton onClick={onReplay}><GameInlineIcon icon={RotateCcw} /> {t.replaySame}</BigButton>
        </EndReplay>
        <EndPills className="mt-1">
          <EndPill onClick={onNewPlayers}>{t.changePlayers}</EndPill>
          <IdeaButton short game="Loup-Garou" kind="idée de rôle" bg={YELLOW} />
        </EndPills>
        <EndHomeLink onClick={onQuit} color="inherit">{t.quit}</EndHomeLink>
      </div>
    </Screen>
  );
}

// ── Historique (pour le meneur / la fin de partie) ───────
/** Pastille d'icône (DA sticker) à la place des emojis stockés en tête des lignes d'historique. */
const LOG_ICONS: { e: string; icon: typeof Eye; bg: string }[] = [
  { e: "🐺", icon: PawPrint, bg: CORAL }, { e: "☠️", icon: Skull, bg: "#B5A1FF" }, { e: "🗳️", icon: Vote, bg: "#FFF6E5" },
  { e: "🎯", icon: Crosshair, bg: YELLOW }, { e: "💔", icon: HeartCrack, bg: "#FF3EA5" }, { e: "💘", icon: Heart, bg: "#FF3EA5" },
  { e: "🛡️", icon: Shield, bg: "#4ECDC4" }, { e: "🔮", icon: Eye, bg: "#B5A1FF" }, { e: "🧪", icon: FlaskConical, bg: "#FF3EA5" },
  { e: "🤝", icon: Handshake, bg: MINT },
];
function HistoryLine({ line }: { line: string }) {
  const m = LOG_ICONS.find((x) => line.startsWith(x.e));
  const text = m ? line.slice(m.e.length).trimStart() : line;
  const Icon = m?.icon ?? Check;
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-[0px] grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full" style={{ background: m?.bg ?? "#fff", border: `2px solid ${INK}`, color: INK }}>
        <Icon size={14} strokeWidth={2.5} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">{text}</span>
    </li>
  );
}

function HistoryModal({ game, spoilerFree, onClose }: { game: GameState; spoilerFree: boolean; onClose: () => void }) {
  const t = useT(STR);
  const [unlocked, setUnlocked] = useState(spoilerFree);
  return (
    <Modal title={t.historyTitle} onClose={onClose}>
      {!unlocked ? (
        <div className="text-center">
          <div className="flex justify-center"><GameIconBadge icon={EyeOff} bg="#B5A1FF" size={60} /></div>
          <p className="mt-3 text-[17px] font-semibold leading-snug">
            {t.spoilerWarn}
          </p>
          <div className="mt-5 grid gap-2">
            <BigButton variant="ghost" onClick={() => setUnlocked(true)}>{t.showAnyway}</BigButton>
          </div>
        </div>
      ) : game.history.length === 0 ? (
        <p className="text-[16px] font-semibold">{t.historyEmpty}</p>
      ) : (
        <div className="space-y-5">
          {game.history.map((h, i) => (
            <div key={i}>
              <SectionTitle className="mb-1.5">{h.title}</SectionTitle>
              <ul className="space-y-1 text-[16px] font-medium leading-snug">
                {h.lines.map((l, j) => <HistoryLine key={j} line={l} />)}
              </ul>
            </div>
          ))}
          {unlocked && !spoilerFree && (
            <div className="grid gap-2.5 pt-2">
              {game.players.map((p) => <PlayerRow key={p.id} p={p} lover={!!game.lovers?.includes(p.id)} dim={!p.alive} />)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
