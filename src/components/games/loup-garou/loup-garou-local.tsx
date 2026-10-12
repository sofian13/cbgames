"use client";

/**
 * Loup-Garou sur UN SEUL téléphone : le tél est le meneur de jeu.
 * Setup (joueurs, rôles, options) → distribution secrète (on se passe le tél)
 * → nuits narrées (voix + écran) → jours (morts, débat chronométré, vote) → fin.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PassScreen, PlayersSetup, colorForIndex } from "@/components/games/local-kit";
import {
  MAX_PLAYERS, MIN_PLAYERS, ROLES, SPECIALS,
  applyDeaths, checkWinner, compositionProblem, deal, nightKills, recommended, villagersCount,
  type Composition, type Death, type Player, type Winner,
} from "./lg-local-data";
import { Ambience, speak, speechAvailable, stopSpeech } from "./lg-local-audio";
import { NightRunner, type NightResult } from "./lg-local-night";
import { BigButton, Confirm, Modal, PickList, PlayerRow, RoleCard, RulesContent, Screen, SkyBadge, type Tone } from "./lg-local-ui";

// ── Réglages persistants ──────────────────────────────────
interface Settings {
  voice: boolean;
  music: boolean;
  debateSec: number;
  voteMode: "hands" | "secret";
}
const SETTINGS_KEY = "zinzin-lg-local";
const DEFAULT_SETTINGS: Settings = { voice: true, music: true, debateSec: 180, voteMode: "hands" };

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
  const [names, setNames] = useState<string[]>([]);
  const [comp, setComp] = useState<Composition>(() => recommended(8));
  const [settings, setSettings] = useState<Settings>(() => (typeof window === "undefined" ? DEFAULT_SETTINGS : loadSettings()));
  const [game, setGame] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<Phase>({ k: "players" });
  const [modal, setModal] = useState<null | "rules" | "history" | "sound">(null);

  const ambience = useMemo(() => new Ambience(), []);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* rien */ }
    ambience.setEnabled(settings.music);
  }, [settings, ambience]);

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
    const lines = deaths.map((d) => `${CAUSE_EMOJI[d.cause]} ${players[d.id].name} meurt (${ROLES[players[d.id].role].name}).`);
    const history = [...g.history];
    if (context !== "dawn") {
      history.push({
        title: context === "vote" ? `Jour ${g.night} · vote` : `Jour ${g.night} · Chasseur`,
        lines: [...(extraLog ? [extraLog] : []), ...(lines.length ? lines : ["Personne n'est éliminé."])],
      });
    } else if (history.length) {
      const last = history[history.length - 1];
      history[history.length - 1] = { ...last, lines: [...last.lines, ...(lines.length ? lines : ["Personne ne meurt."])] };
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
      history: [...game.history, { title: `Nuit ${game.night}`, lines: r.log }],
    };
    kill(g, nightKills(a), "dawn", "debate");
  };
  useLayoutEffect(() => { nightDone.current = handleNightDone; });
  const onNightDone = useCallback((r: NightResult) => nightDone.current(r), []);

  const goNight = () => {
    ambience.unlock();
    keepAwake();
    ambience.setMood("night");
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
        name="Loup-Garou"
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
        hint="Les autres, regardez ailleurs 👀"
        buttonLabel="C'est moi — voir ma carte"
        onReady={() => setPhase({ k: "deal", i: phase.i, reveal: true })}
      />
    );
  } else if (game && phase.k === "ready") {
    const first = game.night === 1 && game.history.length === 0;
    content = (
      <Screen tone="night" center>
        <div className="text-center">
          <SkyBadge tone="night" size={96} />
          <p className="af-eyebrow mt-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            {first ? "Tout le monde a sa carte" : `Fin du jour ${game.night}`}
          </p>
          <h1 className="mt-2" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 36, lineHeight: 1.02 }}>
            Posez le téléphone au centre
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-[17px]" style={{ color: "rgba(255,255,255,0.65)" }}>
            Écran vers le haut, son allumé {settings.voice && speechAvailable() ? "🔊 : il va tout raconter." : "— quelqu'un lira les textes à voix haute."}
          </p>
          <div className="mt-10">
            <BigButton onClick={first ? goNight : nextNight}>🌙 Que la nuit tombe</BigButton>
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
          `🎯 Le Chasseur ${game.players[phase.id].name} emporte ${game.players[target].name}.`)}
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
        onTie={() => setPhase({ k: "tie", tied: null })}
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
        hint="Vote secret : personne d'autre ne regarde."
        buttonLabel="C'est moi — voter"
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
        onTie={(tied) => setPhase({ k: "tie", tied })}
      />
    );
  } else if (game && phase.k === "tie") {
    content = (
      <Screen tone="day" center>
        <div className="text-center">
          <div className="flex justify-center"><Mascot size={110} color="yellow" mood="thinking" /></div>
          <h1 className="mt-4" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 36 }}>Égalité !</h1>
          {phase.tied && (
            <p className="mt-2 text-[18px]" style={{ color: "rgba(255,255,255,0.8)" }}>
              Entre {phase.tied.map((id) => game.players[id].name).join(", ")}
            </p>
          )}
          <p className="mt-3 text-[17px]" style={{ color: "rgba(255,255,255,0.7)" }}>Qu&apos;est-ce qu&apos;on fait ?</p>
          <div className="mt-8 grid gap-2">
            <BigButton onClick={() => setPhase(settings.voteMode === "secret"
              ? secretStart(game, phase.tied)
              : { k: "vote", candidates: phase.tied })}>
              🔁 Revoter{phase.tied ? " entre les ex æquo" : ""}
            </BigButton>
            <BigButton variant="ghost" onClick={() => kill(game, [], "vote", "night", "🤝 Égalité : personne n'est éliminé.")}>
              Personne n&apos;est éliminé
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
      <div
        className="fixed right-3 z-50 flex gap-2"
        style={{ top: "calc(env(safe-area-inset-top) + 10px)", opacity: nightNow ? 0.55 : 1 }}
      >
        <ToolButton label="Règles" onClick={() => setModal("rules")}>ⓘ</ToolButton>
        {game && <ToolButton label="Historique" onClick={() => setModal("history")}>📜</ToolButton>}
        <ToolButton label="Son" onClick={() => setModal("sound")}>{settings.voice || settings.music ? "🔊" : "🔇"}</ToolButton>
      </div>

      {modal === "rules" && (
        <Modal title="Règles du jeu" onClose={() => setModal(null)}><RulesContent /></Modal>
      )}
      {modal === "sound" && (
        <Modal title="Son" onClose={() => setModal(null)}>
          <SoundOptions settings={settings} setSettings={setSettings} onToggle={() => ambience.unlock()} />
        </Modal>
      )}
      {modal === "history" && game && (
        <HistoryModal game={game} spoilerFree={phase.k === "end"} onClose={() => setModal(null)} />
      )}
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

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border text-[19px] text-white"
      style={{ background: "rgba(10,6,30,0.6)", borderColor: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}
    >
      {children}
    </button>
  );
}

// ── Setup des rôles ───────────────────────────────────────
function Toggle({ on, onClick, label, sub }: { on: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left" style={{ background: "rgba(255,255,255,0.05)", minHeight: 52 }}>
      <span className="flex-1">
        <span className="block text-[16px] font-bold">{label}</span>
        {sub && <span className="block text-[13px]" style={{ color: "var(--text-dim)" }}>{sub}</span>}
      </span>
      <span className="relative h-7 w-12 rounded-full transition" style={{ background: on ? "#3DDC97" : "rgba(255,255,255,0.18)" }}>
        <span className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? 24 : 4 }} />
      </span>
    </button>
  );
}

function Chips<T extends string | number>({ value, options, onPick }: { value: T; options: { v: T; label: string }[]; onPick: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onPick(o.v)}
          className="rounded-full border px-4 text-[15px] font-semibold"
          style={{
            minHeight: 44,
            borderColor: value === o.v ? "#FFD23F" : "rgba(255,255,255,0.14)",
            background: value === o.v ? "rgba(255,210,63,0.16)" : "transparent",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SoundOptions({ settings, setSettings, onToggle }: { settings: Settings; setSettings: (s: Settings) => void; onToggle: () => void }) {
  const canSpeak = speechAvailable();
  return (
    <div className="grid gap-2">
      <Toggle
        on={settings.voice && canSpeak}
        onClick={() => { onToggle(); if (canSpeak) setSettings({ ...settings, voice: !settings.voice }); }}
        label="🗣️ Narration vocale"
        sub={canSpeak ? "Le téléphone lit la nuit à voix haute" : "Indisponible sur cet appareil : lisez les textes à voix haute"}
      />
      <Toggle
        on={settings.music}
        onClick={() => { onToggle(); setSettings({ ...settings, music: !settings.music }); }}
        label="🎵 Ambiance sonore"
        sub="Nappes discrètes, grillons la nuit"
      />
    </div>
  );
}

function RolesSetup({
  n, comp, setComp, settings, setSettings, onBack, onStart,
}: {
  n: number; comp: Composition; setComp: (c: Composition) => void;
  settings: Settings; setSettings: (s: Settings) => void;
  onBack: () => void; onStart: () => void;
}) {
  const problem = compositionProblem(comp, n);
  const villagers = villagersCount(comp, n);
  const rec = recommended(n);
  const isRec = JSON.stringify(rec) === JSON.stringify(comp);
  const maxWolves = Math.max(1, Math.ceil(n / 2) - 1);

  return (
    <Screen tone="dusk">
      <h1 className="cb-display-lg text-center">Les rôles</h1>
      <p className="mt-1 text-center text-[15px]" style={{ color: "var(--text-dim)" }}>{n} joueurs · {comp.loup} loup{comp.loup > 1 ? "s" : ""} contre {n - comp.loup}</p>

      <div className="mt-5 grid gap-2">
        {/* Loups : compteur */}
        <div className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: "rgba(255,77,94,0.1)", minHeight: 60 }}>
          <MascotAvatar color="coral" mood="angry" size={40} border={false} />
          <span className="flex-1 text-[17px] font-bold">🐺 Loups-garous</span>
          <button aria-label="Moins de loups" onClick={() => setComp({ ...comp, loup: Math.max(1, comp.loup - 1) })} className="h-11 w-11 rounded-full text-2xl" style={{ background: "rgba(255,255,255,0.08)" }}>−</button>
          <span className="w-7 text-center text-2xl font-black">{comp.loup}</span>
          <button aria-label="Plus de loups" onClick={() => setComp({ ...comp, loup: Math.min(maxWolves, comp.loup + 1) })} className="h-11 w-11 rounded-full text-2xl" style={{ background: "rgba(255,255,255,0.08)" }}>+</button>
        </div>

        {SPECIALS.map((id) => {
          const r = ROLES[id];
          const on = comp[id as keyof Composition] as boolean;
          return (
            <button
              key={id}
              onClick={() => setComp({ ...comp, [id]: !on })}
              className="flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left"
              style={{ minHeight: 60, borderColor: on ? `${r.accent}88` : "rgba(255,255,255,0.08)", background: on ? `${r.accent}1A` : "rgba(255,255,255,0.03)", opacity: on ? 1 : 0.6 }}
            >
              <MascotAvatar color={r.color} mood={r.mood} size={40} border={false} />
              <span className="flex-1">
                <span className="block text-[17px] font-bold">{r.emoji} {r.name}</span>
                <span className="block text-[13px] leading-tight" style={{ color: "var(--text-dim)" }}>{r.power}</span>
              </span>
              <span className="text-xl">{on ? "✅" : "➕"}</span>
            </button>
          );
        })}

        <div className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: "rgba(61,220,151,0.08)", minHeight: 56 }}>
          <MascotAvatar color="mint" mood="happy" size={40} border={false} />
          <span className="flex-1 text-[17px] font-bold">🧑‍🌾 Villageois</span>
          <span className="w-10 text-center text-2xl font-black">{Math.max(0, villagers)}</span>
        </div>
      </div>

      {!isRec && (
        <button onClick={() => setComp(rec)} className="mt-3 self-center rounded-full border px-4 text-[15px] font-semibold" style={{ minHeight: 44, borderColor: "rgba(255,210,63,0.5)", color: "#FFD23F" }}>
          ✨ Répartition recommandée
        </button>
      )}

      <p className="af-eyebrow mt-7 mb-2" style={{ color: "var(--text-dim)" }}>Débat</p>
      <Chips value={settings.debateSec} onPick={(v) => setSettings({ ...settings, debateSec: v })}
        options={[{ v: 60, label: "1 min" }, { v: 120, label: "2 min" }, { v: 180, label: "3 min" }, { v: 300, label: "5 min" }]} />

      <p className="af-eyebrow mt-5 mb-2" style={{ color: "var(--text-dim)" }}>Vote</p>
      <Chips value={settings.voteMode} onPick={(v) => setSettings({ ...settings, voteMode: v })}
        options={[{ v: "hands", label: "✋ À main levée (rapide)" }, { v: "secret", label: "🤫 Secret" }]} />

      <p className="af-eyebrow mt-5 mb-2" style={{ color: "var(--text-dim)" }}>Son</p>
      <SoundOptions settings={settings} setSettings={setSettings} onToggle={() => {}} />

      <div className="mt-6 grid gap-2">
        {problem && <p className="text-center text-[15px] font-semibold" style={{ color: "#FF8A95" }}>{problem}</p>}
        <BigButton onClick={onStart} disabled={!!problem}>🃏 Distribuer les rôles</BigButton>
        <button onClick={onBack} className="text-[15px]" style={{ minHeight: 44, color: "var(--text-muted)" }}>← Modifier les joueurs</button>
      </div>
    </Screen>
  );
}

// ── Distribution : appui long pour voir sa carte ─────────
function HoldReveal({ player, last, onDone }: { player: Player; last: boolean; onDone: () => void }) {
  const [holding, setHolding] = useState(false);
  const [seen, setSeen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const down = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setHolding(true); setSeen(true); }, 250);
  };
  const up = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <Screen tone="dusk">
      <p className="af-eyebrow text-center" style={{ color: "var(--text-dim)" }}>Carte secrète de</p>
      <h1 className="cb-display-lg mt-1 text-center">{player.name}</h1>

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
          <RoleCard role={player.role} subtitle="Tu es" />
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-[28px] border text-center"
            style={{
              minHeight: 380,
              borderColor: "rgba(255,255,255,0.14)",
              background: "repeating-linear-gradient(45deg, rgba(122,78,232,0.18) 0 14px, rgba(122,78,232,0.08) 14px 28px), #140C34",
            }}
          >
            <span style={{ fontSize: 64 }}>🌕</span>
            <p className="mt-4 px-6" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, lineHeight: 1.15 }}>
              Maintiens le doigt ici pour voir ton rôle
            </p>
            <p className="mt-2 text-[15px]" style={{ color: "var(--text-dim)" }}>Relâche pour le cacher</p>
          </div>
        )}
      </div>

      {player.role === "loup" && holding && (
        <p className="mt-3 text-center text-[15px]" style={{ color: "#FF8A95" }}>Ta meute se découvrira la première nuit.</p>
      )}

      <div className="mt-auto pt-6">
        <BigButton onClick={onDone} disabled={!seen}>
          {seen ? (last ? "J'ai vu — on lance la partie" : "J'ai vu — cacher et passer") : "Regarde d'abord ta carte"}
        </BigButton>
      </div>
    </Screen>
  );
}

// ── Annonce des morts ─────────────────────────────────────
function deathSentence(p: Player, cause: Death["cause"]): string {
  const role = ROLES[p.role].name;
  switch (cause) {
    case "vote": return `Le village élimine ${p.name}. Son rôle : ${role}.`;
    case "chasseur": return `Dans un dernier souffle, le Chasseur emporte ${p.name}. Son rôle : ${role}.`;
    case "chagrin": return `${p.name} ne survit pas à la perte de son amour. Son rôle : ${role}.`;
    default: return `${p.name} ne se réveillera pas. Son rôle : ${role}.`;
  }
}

function DeathsScreen({
  game, deaths, context, say, onNext,
}: {
  game: GameState; deaths: Death[]; context: "dawn" | "vote" | "hunter"; say: (t: string) => void; onNext: () => void;
}) {
  const intro = context === "dawn" ? "Le soleil se lève. Tout le monde ouvre les yeux !" : "";
  const none = context === "dawn" ? "Bonne nouvelle : personne n'est mort cette nuit." : "Personne n'est éliminé aujourd'hui.";
  const lines = deaths.length ? deaths.map((d) => deathSentence(game.players[d.id], d.cause)) : [none];

  useEffect(() => {
    say([intro, ...lines].filter(Boolean).join(" "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen tone="day">
      <div className="text-center">
        {context === "dawn" && <SkyBadge tone="day" size={72} />}
        <p className="af-eyebrow mt-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          {context === "dawn" ? `Jour ${game.night}` : context === "vote" ? "Verdict du village" : "Le coup du Chasseur"}
        </p>
        <h1 className="mt-1" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 34, lineHeight: 1.02 }}>
          {context === "dawn" ? "Le village se réveille" : deaths.length ? "Sentence exécutée" : "Tout le monde est épargné"}
        </h1>
      </div>

      <div className="mt-6 grid gap-3">
        {deaths.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl p-6 text-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <Mascot size={100} color="mint" mood="laughing" cheering />
            <p className="mt-3 text-[20px] font-bold">{none}</p>
          </div>
        ) : deaths.map((d) => {
          const p = game.players[d.id];
          const r = ROLES[p.role];
          return (
            <div key={d.id} className="flex items-center gap-4 rounded-3xl border p-4" style={{ borderColor: `${r.accent}66`, background: "rgba(10,6,30,0.35)" }}>
              <Mascot size={74} color={colorForIndex(p.id)} mood="dead" bob={false} />
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 28, lineHeight: 1.05 }}>{p.name}</p>
                <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.7)" }}>{CAUSE_LABEL[d.cause]}</p>
                <p className="mt-1 text-[20px] font-bold" style={{ color: r.accent }}>{r.emoji} {r.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <BigButton onClick={onNext}>Continuer</BigButton>
      </div>
    </Screen>
  );
}

const CAUSE_LABEL: Record<Death["cause"], string> = {
  loups: "Dévoré·e cette nuit",
  poison: "Retrouvé·e sans vie cette nuit",
  vote: "Éliminé·e par le village",
  chasseur: "Abattu·e par le Chasseur",
  chagrin: "Mort·e de chagrin 💔",
};

// ── Chasseur ──────────────────────────────────────────────
function HunterScreen({ game, hunterId, say, onShoot }: { game: GameState; hunterId: number; say: (t: string) => void; onShoot: (id: number) => void }) {
  const hunter = game.players[hunterId];
  const [sel, setSel] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    say(`${hunter.name} était le Chasseur ! Avant de mourir, il emporte quelqu'un avec lui. Prends le téléphone et choisis.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const alive = game.players.filter((p) => p.alive);
  const target = alive.find((p) => p.id === sel);
  return (
    <Screen tone="day">
      <div className="text-center">
        <span style={{ fontSize: 54 }}>🎯</span>
        <h1 className="mt-1" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 32, lineHeight: 1.05 }}>
          {hunter.name}, dernier tir !
        </h1>
        <p className="mt-2 text-[17px]" style={{ color: "rgba(255,255,255,0.75)" }}>Tu étais le Chasseur : choisis qui tu emportes avec toi.</p>
      </div>
      <div className="mt-5">
        <PickList players={alive} selected={sel === null ? [] : [sel]} onPick={setSel} />
      </div>
      <div className="sticky bottom-0 mt-auto pt-4" style={{ paddingBottom: 4 }}>
        <BigButton variant="danger" disabled={!target} onClick={() => setConfirm(true)}>
          {target ? `Tirer sur ${target.name}` : "Choisis ta cible"}
        </BigButton>
      </div>
      {confirm && target && (
        <Confirm text={`Emporter ${target.name} avec toi ?`} yes="Oui, tirer" danger onYes={() => onShoot(target.id)} onNo={() => setConfirm(false)} />
      )}
    </Screen>
  );
}

// ── Débat ─────────────────────────────────────────────────
function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function DebateScreen({ game, seconds, say, onBell, onVote }: { game: GameState; seconds: number; say: (t: string) => void; onBell: () => void; onVote: () => void }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(true);
  const rang = useRef(false);

  useEffect(() => {
    const m = Math.round(seconds / 60);
    say(`Place au débat ! Vous avez ${m} minute${m > 1 ? "s" : ""} pour démasquer les loups.`);
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
      say("Le temps est écoulé. Passons au vote !");
    }
  }, [left, onBell, say]);

  const alive = game.players.filter((p) => p.alive);
  const pct = Math.max(0, left / seconds);
  const over = left <= 0;

  return (
    <Screen tone="day">
      <p className="af-eyebrow text-center" style={{ color: "rgba(255,255,255,0.7)" }}>Jour {game.night} · débat</p>
      <h1 className="mt-1 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 32, lineHeight: 1.05 }}>
        {over ? "Temps écoulé !" : "Qui sont les loups ?"}
      </h1>

      <div className="relative mx-auto mt-6 flex items-center justify-center" style={{ width: 220, height: 220 }}>
        <svg width={220} height={220} className="absolute inset-0 -rotate-90">
          <circle cx={110} cy={110} r={98} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
          <circle cx={110} cy={110} r={98} fill="none" stroke={over ? "#FF4D5E" : left <= 15 ? "#FFB347" : "#FFD23F"} strokeWidth={12} strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 98} strokeDashoffset={2 * Math.PI * 98 * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 64, fontVariantNumeric: "tabular-nums" }}>{fmt(Math.max(0, left))}</span>
      </div>

      {!over && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <BigButton variant="ghost" onClick={() => setRunning((r) => !r)}>{running ? "⏸ Pause" : "▶️ Reprendre"}</BigButton>
          <BigButton variant="ghost" onClick={() => setLeft((l) => l + 30)}>+30 s</BigButton>
        </div>
      )}

      <p className="af-eyebrow mt-6 mb-2 text-center" style={{ color: "rgba(255,255,255,0.65)" }}>Encore en vie · {alive.length}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {alive.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[15px] font-semibold" style={{ background: "rgba(255,255,255,0.1)" }}>
            <MascotAvatar color={colorForIndex(p.id)} size={26} border={false} mood="sus" /> {p.name}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <BigButton variant={over ? "primary" : "ghost"} onClick={onVote}>{over ? "🗳️ Passer au vote" : "Passer au vote ⏭"}</BigButton>
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
  const [sel, setSel] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    say(candidates ? "On revote entre les ex æquo. À trois, pointez du doigt !" : "À trois, tout le monde pointe du doigt le joueur à éliminer. Un, deux, trois !");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const list = game.players.filter((p) => p.alive && (!candidates || candidates.includes(p.id)));
  const target = list.find((p) => p.id === sel);
  return (
    <Screen tone="day">
      <p className="af-eyebrow text-center" style={{ color: "rgba(255,255,255,0.7)" }}>Jour {game.night} · vote</p>
      <h1 className="mt-1 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 30, lineHeight: 1.05 }}>
        Qui le village élimine-t-il ?
      </h1>
      <p className="mt-2 text-center text-[15px]" style={{ color: "rgba(255,255,255,0.7)" }}>Votez à main levée, puis touchez le joueur qui a le plus de voix.</p>
      <div className="mt-5">
        <PickList players={list} selected={sel === null ? [] : [sel]} onPick={setSel} />
      </div>
      <div className="sticky bottom-0 mt-auto grid gap-2 pt-4" style={{ paddingBottom: 4 }}>
        <BigButton variant="danger" disabled={!target} onClick={() => setConfirm(true)}>
          {target ? `Éliminer ${target.name}` : "Touchez le joueur désigné"}
        </BigButton>
        <BigButton variant="ghost" onClick={onTie}>🤝 Égalité</BigButton>
      </div>
      {confirm && target && (
        <Confirm text={`Le village élimine ${target.name} ? Son rôle sera révélé.`} yes="Oui, éliminer" danger onYes={() => onEliminate(target.id)} onNo={() => setConfirm(false)} />
      )}
    </Screen>
  );
}

// ── Vote secret ───────────────────────────────────────────
function SecretBallot({ game, voter, candidates, onVote }: { game: GameState; voter: Player; candidates: number[] | null; onVote: (id: number) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const list = game.players.filter((p) => p.alive && p.id !== voter.id && (!candidates || candidates.includes(p.id)));
  const target = list.find((p) => p.id === sel);
  return (
    <Screen tone="dusk">
      <p className="af-eyebrow text-center" style={{ color: "var(--text-dim)" }}>Vote secret de</p>
      <h1 className="cb-display-lg mt-1 text-center">{voter.name}</h1>
      <p className="mt-2 text-center text-[16px]" style={{ color: "var(--text-dim)" }}>Contre qui votes-tu ?</p>
      <div className="mt-5">
        <PickList players={list} selected={sel === null ? [] : [sel]} onPick={setSel} />
      </div>
      <div className="sticky bottom-0 mt-auto pt-4" style={{ paddingBottom: 4 }}>
        <BigButton disabled={!target} onClick={() => target && onVote(target.id)}>
          {target ? `Voter contre ${target.name}` : "Choisis un joueur"}
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
  const counts = new Map<number, number>();
  Object.values(votes).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] ?? 0;
  const top = rows.filter((r) => r[1] === max).map((r) => r[0]);
  const winner = top.length === 1 ? game.players[top[0]] : null;

  useEffect(() => {
    say(winner ? `Les votes sont comptés. Le village désigne ${winner.name}.` : "Les votes sont comptés… et c'est l'égalité !");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen tone="day">
      <h1 className="text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 32 }}>Dépouillement</h1>
      <div className="mt-5 grid gap-2">
        {rows.map(([id, c]) => (
          <div key={id} className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: top.includes(id) ? "rgba(255,77,94,0.18)" : "rgba(255,255,255,0.07)", minHeight: 56 }}>
            <MascotAvatar color={colorForIndex(id)} size={36} border={false} mood={top.includes(id) ? "shocked" : "neutral"} />
            <span className="flex-1 text-[19px] font-bold">{game.players[id].name}</span>
            <span className="text-[22px] font-black">{c} {"🗳️"}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-8">
        {winner
          ? <BigButton variant="danger" onClick={() => onEliminate(winner.id)}>Éliminer {winner.name}</BigButton>
          : <BigButton onClick={() => onTie(top)}>🤝 Égalité — que faire ?</BigButton>}
      </div>
    </Screen>
  );
}

// ── Fin ───────────────────────────────────────────────────
const WIN_TEXT: Record<Winner, { title: string; sub: string; color: string; mood: "cool" | "angry" | "love" | "sad"; mascot: "mint" | "coral" | "pink" | "white" }> = {
  village: { title: "Le village gagne\u00A0!", sub: "Tous les loups ont été démasqués.", color: "#3DDC97", mood: "cool", mascot: "mint" },
  loups: { title: "Les loups gagnent\u00A0!", sub: "La meute a dévoré le village.", color: "#FF4D5E", mood: "angry", mascot: "coral" },
  amoureux: { title: "L'amour gagne\u00A0!", sub: "Les deux amoureux sont les derniers debout.", color: "#FF3EA5", mood: "love", mascot: "pink" },
  personne: { title: "Personne ne survit…", sub: "Le village est désert. Tout le monde a perdu.", color: "#B5A1FF", mood: "sad", mascot: "white" },
};

function EndScreen({
  game, winner, say, onReplay, onNewPlayers, onQuit, onHistory,
}: {
  game: GameState; winner: Winner; say: (t: string) => void;
  onReplay: () => void; onNewPlayers: () => void; onQuit: () => void; onHistory: () => void;
}) {
  const w = WIN_TEXT[winner];
  useEffect(() => {
    say(`${w.title} ${w.sub}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sorted = [...game.players].sort((a, b) => (a.role === "loup" ? 0 : 1) - (b.role === "loup" ? 0 : 1));
  return (
    <Screen tone="day">
      {winner !== "personne" && <ConfettiBurst count={70} />}
      <div className="text-center">
        <div className="flex justify-center"><Mascot size={120} color={w.mascot} mood={w.mood} cheering={winner !== "personne"} crown={winner !== "personne"} /></div>
        <h1 className="mt-3" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 36, lineHeight: 1.02, color: w.color }}>{w.title}</h1>
        <p className="mt-2 text-[17px]" style={{ color: "rgba(255,255,255,0.8)" }}>{w.sub}</p>
      </div>
      <p className="af-eyebrow mt-6 mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>Qui était qui</p>
      <div className="grid gap-2">
        {sorted.map((p) => <PlayerRow key={p.id} p={p} lover={!!game.lovers?.includes(p.id)} />)}
      </div>
      <button onClick={onHistory} className="mt-3 self-center text-[15px] font-semibold underline" style={{ minHeight: 44, color: "rgba(255,255,255,0.75)" }}>
        📜 Revoir l&apos;historique des nuits
      </button>
      <div className="mt-auto grid gap-2 pt-6">
        <BigButton onClick={onReplay}>🔁 Rejouer (mêmes joueurs)</BigButton>
        <BigButton variant="ghost" onClick={onNewPlayers}>Changer les joueurs</BigButton>
        <BigButton variant="ghost" onClick={onQuit}>Quitter</BigButton>
      </div>
    </Screen>
  );
}

// ── Historique (pour le meneur / la fin de partie) ───────
function HistoryModal({ game, spoilerFree, onClose }: { game: GameState; spoilerFree: boolean; onClose: () => void }) {
  const [unlocked, setUnlocked] = useState(spoilerFree);
  return (
    <Modal title="Historique" onClose={onClose}>
      {!unlocked ? (
        <div className="text-center">
          <span style={{ fontSize: 44 }}>🙈</span>
          <p className="mt-2 text-[17px] leading-snug">
            L&apos;historique dévoile qui a fait quoi la nuit. À ouvrir seulement si tout le monde est d&apos;accord (ou en fin de partie).
          </p>
          <div className="mt-5 grid gap-2">
            <BigButton variant="ghost" onClick={() => setUnlocked(true)}>Afficher quand même</BigButton>
          </div>
        </div>
      ) : game.history.length === 0 ? (
        <p className="text-[16px]" style={{ color: "var(--text-dim)" }}>Rien pour l&apos;instant : la première nuit n&apos;a pas encore eu lieu.</p>
      ) : (
        <div className="space-y-4">
          {game.history.map((h, i) => (
            <div key={i}>
              <p className="af-eyebrow mb-1" style={{ color: "#FFD23F" }}>{h.title}</p>
              <ul className="space-y-1 text-[15px]">
                {h.lines.map((l, j) => <li key={j}>{l}</li>)}
              </ul>
            </div>
          ))}
          {unlocked && !spoilerFree && (
            <div className="grid gap-2 pt-2">
              {game.players.map((p) => <PlayerRow key={p.id} p={p} lover={!!game.lovers?.includes(p.id)} dim={!p.alive} />)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

