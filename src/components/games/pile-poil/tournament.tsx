"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlayersSetup, PassScreen, colorForIndex } from "@/components/games/local-kit";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { useAudio } from "@/lib/hooks/useAudio";
import { ArrowLeft, Ban, CircleHelp, CupSoda, Dices, PenLine, Target, Tv, Zap } from "lucide-react";
import { GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";
import { fxBad, fxDrum, fxGood, fxOver, fxPerfect, fxTap, fxTick, fxUnlock, vibrate } from "./pp-fx";

// ── Pile Poil · mode Tournoi (tout sur un seul téléphone) ─────────────────
// Chacun à son tour : GO, on compte dans sa tête, STOP. Le temps est mesuré
// ICI (performance.now() au pointerdown) et révélé avec un compteur qui défile.
// Le plus proche gagne la manche, le plus loin prend une peine (gorgée ou gage).

export type PPMode = "closest" | "no-over"; // le plus proche / sans dépasser

export interface Attempt {
  pi: number; // index du joueur
  name: string;
  elapsedMs: number;
  over: boolean;
}

/** Pont optionnel vers le tél « Écran » (site uniquement, jamais dans l'app). */
export interface TournamentNet {
  emit: (action: string, payload: Record<string, unknown>) => void;
  /** Dernière cible saisie sur l'écran (n = compteur pour détecter une nouvelle saisie). */
  remote: { n: number; target: number } | null;
}

interface Challenge {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

// Défis spéciaux occasionnels (jamais deux manches d'affilée)
const CHALLENGES: Challenge[] = [
  { id: "eyes", emoji: "🙈", title: "Les yeux fermés", desc: "Appuie sur GO, ferme les yeux, et STOP sans les rouvrir." },
  { id: "sing", emoji: "🎤", title: "En chantant", desc: "Chante un refrain à voix haute pendant tout le chrono. Pas le droit de t'arrêter." },
  { id: "mystery", emoji: "❓", title: "Cible mystère", desc: "Personne ne connaît la cible ! Arrête-toi quand tu le sens : elle sera tirée au sort à la fin." },
  { id: "noise", emoji: "🗣️", title: "Les perturbateurs", desc: "Les autres ont le droit de compter à voix haute des faux chiffres pour te déconcentrer." },
  { id: "flamingo", emoji: "🦩", title: "Sur un pied", desc: "Tiens-toi sur un pied du GO jusqu'au STOP." },
  { id: "hand", emoji: "🫲", title: "Mauvaise main", desc: "GO et STOP avec ta main non dominante." },
  { id: "dance", emoji: "💃", title: "En dansant", desc: "Danse pendant tout le chrono. Les autres jugent l'engagement." },
  { id: "stare", emoji: "👀", title: "Les yeux dans les yeux", desc: "Fixe un autre joueur dans les yeux pendant que tu comptes. Interdit de rire." },
  { id: "calc", emoji: "🧮", title: "Calcul mental", desc: "La cible est un calcul. À toi de trouver combien de secondes ça fait !" },
  { id: "spin", emoji: "🌀", title: "La toupie", desc: "Fais un tour complet sur toi-même pendant le chrono." },
];

// Gages doux (alternative à la gorgée — l'eau et les softs comptent aussi)
const GAGES = [
  "Imite le cri d'un animal choisi par la table",
  "Parle avec un accent jusqu'à ton prochain tour",
  "Fais 10 squats en comptant à voix haute",
  "Raconte ta pire honte de soirée en 20 secondes",
  "Fais un compliment sincère à chaque joueur",
  "Chante le refrain que la table choisit",
  "Montre la dernière photo de ta galerie (ou fais 15 pompes)",
  "Garde une grimace jusqu'à la fin de la manche",
  "Danse 10 secondes sans musique",
  "Laisse la table choisir ton prochain défi",
  "Parle à la 3e personne jusqu'à ton prochain tour",
  "Fais une déclaration d'amour à un objet de la pièce",
  "Fais le présentateur météo de la soirée",
  "Mime ton métier de rêve, les autres devinent",
  "Envoie un emoji au hasard au 3e contact de ton tél",
  "Tiens la planche 20 secondes",
  "Raconte une blague. Si personne ne rit, refais-en une",
  "Fais un beatbox de 10 secondes",
];

const PERFECT_MS = 100; // ±0,10 s = PILE POIL
const CLOSE_MS = 300;
const ACCENT = "#00C2A8";
const GOLD = "#FFD23F";
const RED = "#FF6A5B";
const MINT = "#5FF5DD";
const DARK_BG = "radial-gradient(120% 80% at 50% 0%, #06302A 0%, #020D0B 100%)";
const TOP_SAFE = "calc(env(safe-area-inset-top, 0px) + 64px)";

const rnd = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const num = (s: number) => (Number.isInteger(s) ? String(s) : s.toFixed(2).replace(/0$/, "").replace(".", ","));
export const fmtS = (ms: number) => `${(ms / 1000).toFixed(2).replace(".", ",")} s`;
export const fmtDelta = (ms: number, target: number) => {
  const d = ms - target * 1000;
  return `${d >= 0 ? "+" : "−"}${(Math.abs(d) / 1000).toFixed(2).replace(".", ",")} s`;
};

// Cibles progressives : courtes au début, longues et « tordues » à la fin
const POOLS = [
  [3, 4, 5, 5.5, 6, 6.66, 7, 7.5, 8],
  [7, 8, 8.88, 9, 9.5, 10, 11, 11.11, 12, 12.34],
  [12, 13, 13.37, 14, 15, 16, 17.5, 18, 20, 22.22],
];
function pickTarget(manche: number, total: number, prev: number | null): number {
  const p = total <= 1 ? 0 : (manche - 1) / (total - 1);
  const pool = POOLS[p < 0.34 ? 0 : p < 0.67 ? 1 : 2].filter((t) => t !== prev);
  return rnd(pool);
}

// Écrit la cible sous forme de calcul (défi « Calcul mental »)
function calcLabel(t: number): string {
  const opts: string[] = [];
  if (Number.isInteger(t * 2)) opts.push(`la moitié de ${num(t * 2)}`);
  if (Number.isInteger(t) && t > 4) {
    const a = 2 + Math.floor(Math.random() * (t - 3));
    opts.push(`${a} + ${t - a}`);
    opts.push(`${t + 7} − 7`);
  }
  if (Number.isInteger(t) && t % 2 === 0) opts.push(`${t / 2} × 2`);
  if (Number.isInteger(t) && t % 3 === 0) opts.push(`${t / 3} × 3`);
  if (!opts.length) opts.push(`${num(t + 1)} − 1`);
  return rnd(opts);
}

interface Round {
  n: number;
  target: number; // en secondes
  challenge: Challenge | null;
  label: string | null; // cible écrite en calcul
  order: number[]; // ordre de passage (indices joueurs)
}

function rankAttempts(attempts: Attempt[], target: number, mode: PPMode): Attempt[] {
  const gap = (a: Attempt) => Math.abs(a.elapsedMs - target * 1000);
  return [...attempts].sort((a, b) => {
    if (mode === "no-over" && a.over !== b.over) return a.over ? 1 : -1;
    return gap(a) - gap(b);
  });
}

const isPerfect = (a: Attempt, target: number, mode: PPMode) =>
  Math.abs(a.elapsedMs - target * 1000) <= PERFECT_MS && !(mode === "no-over" && a.over);

/** Écran plein : centré verticalement, mais jamais sous les coins du haut (bouton quitter de l'app). */
function Screen({ accent = ACCENT, children }: { accent?: string; children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-[100svh] flex-col items-center overflow-x-hidden px-5 text-white"
      style={{
        background: `radial-gradient(circle at 50% 12%, ${accent}30, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`,
        paddingTop: TOP_SAFE,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      <div className="my-auto flex w-full flex-col items-center">{children}</div>
    </div>
  );
}

type Phase = "setup" | "config" | "intro" | "await-remote" | "pass" | "ready" | "running" | "reveal" | "board" | "final";

const KEYFRAMES = `
@keyframes pp-pop { 0% { transform: scale(0.3); opacity: 0 } 60% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1) } }
@keyframes pp-shake { 0%,100% { transform: translateX(0) rotate(0) } 20% { transform: translateX(-8px) rotate(-3deg) } 40% { transform: translateX(8px) rotate(3deg) } 60% { transform: translateX(-5px) rotate(-2deg) } 80% { transform: translateX(5px) rotate(2deg) } }
@keyframes pp-rise { from { transform: translateY(14px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes pp-glow { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
@keyframes pp-flash { 0% { opacity: .9 } 100% { opacity: 0 } }
`;

export function Tournament({ net, onExit }: { net?: TournamentNet; onExit?: () => void }) {
  const { muted } = useAudio();
  const sound = !muted;

  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [points, setPoints] = useState<number[]>([]);
  const [mode, setMode] = useState<PPMode>("closest");
  const [totalRounds, setTotalRounds] = useState(5);
  const [autoTargets, setAutoTargets] = useState(true);
  const [specials, setSpecials] = useState(true);
  const [round, setRound] = useState<Round | null>(null);
  const [turn, setTurn] = useState(0); // position dans round.order
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [history, setHistory] = useState<{ round: Round; attempts: Attempt[] }[]>([]);
  const startRef = useRef(0);

  const pi = round ? round.order[turn] : 0;

  // ── Pont vers l'écran (site) ──
  const push = useCallback(
    (view: string, extra: Record<string, unknown> = {}) => {
      net?.emit("pp-sync", {
        view,
        players,
        wins: points,
        mode,
        target: round?.target ?? 7,
        manche: round?.n ?? 1,
        turnIdx: pi,
        attempts,
        ...extra,
      });
    },
    [net, players, points, mode, round, pi, attempts]
  );

  const beginMatch = (names: string[]) => {
    setPlayers(names);
    setPoints(names.map(() => 0));
    setHistory([]);
    setPhase("config");
  };

  // Prépare la manche n (cible + défi éventuel + ordre tournant)
  const makeRound = (n: number, prev: Round | null): Round => {
    const target = autoTargets || !prev ? pickTarget(n, totalRounds, prev?.target ?? null) : prev.target;
    let challenge: Challenge | null = null;
    if (specials && n > 1 && !prev?.challenge && Math.random() < 0.45) {
      challenge = rnd(autoTargets ? CHALLENGES : CHALLENGES.filter((c) => c.id !== "mystery"));
    }
    if (specials && n === totalRounds && totalRounds >= 3 && !challenge && !prev?.challenge) challenge = rnd(CHALLENGES.filter((c) => c.id !== "mystery"));
    const shift = (n - 1) % players.length;
    const order = players.map((_, i) => (i + shift) % players.length);
    return { n, target, challenge, label: challenge?.id === "calc" ? calcLabel(target) : null, order };
  };

  const openRound = (n: number, prev: Round | null) => {
    const r = makeRound(n, prev);
    setRound(r);
    setTurn(0);
    setAttempts([]);
    setPhase("intro");
  };

  const startTurns = () => {
    if (!round) return;
    setPhase("pass");
    push("pass", { target: round.target, manche: round.n, turnIdx: round.order[0], attempts: [] });
  };

  // Cible saisie sur le tél « Écran » (site) pendant l'attente — ajustée au rendu
  const [seenRemote, setSeenRemote] = useState(net?.remote?.n ?? 0);
  const r = net?.remote;
  if (r && r.n !== seenRemote) {
    setSeenRemote(r.n);
    if (phase === "await-remote" && round && r.target >= 1 && r.target <= 120) {
      setRound({ ...round, target: r.target, label: null, challenge: round.challenge?.id === "calc" ? null : round.challenge });
      setPhase("intro");
    }
  }

  const onGo = () => {
    if (!round) return;
    fxUnlock();
    startRef.current = performance.now();
    setPhase("running");
    if (sound) fxTap(true);
    vibrate(15);
    net?.emit("pp-start", { playerName: players[pi], target: round.target, mode, startAt: Date.now() });
  };

  const onStop = () => {
    if (!round) return;
    const elapsed = performance.now() - startRef.current;
    if (elapsed < 250) return; // double-tap involontaire sur GO
    const a: Attempt = { pi, name: players[pi], elapsedMs: elapsed, over: elapsed > round.target * 1000 };
    setAttempts((prev) => [...prev, a]);
    setPhase("reveal");
    if (sound) fxTap(false);
    vibrate(15);
    net?.emit("pp-stop", { elapsedMs: elapsed, playerName: players[pi], target: round.target, mode });
  };

  const nextTurn = () => {
    if (!round) return;
    if (turn + 1 < round.order.length) {
      setTurn(turn + 1);
      setPhase("pass");
      push("pass", { turnIdx: round.order[turn + 1] });
      return;
    }
    // Fin de manche : +1 au vainqueur, +1 bonus par PILE POIL
    const ranked = rankAttempts(attempts, round.target, round.challenge?.id === "mystery" ? "closest" : mode);
    const gain = players.map(() => 0);
    if (players.length > 1 && ranked[0]) gain[ranked[0].pi] += 1;
    attempts.forEach((a) => {
      if (isPerfect(a, round.target, mode)) gain[a.pi] += 1;
    });
    const nextPoints = points.map((p, i) => p + gain[i]);
    setPoints(nextPoints);
    setHistory((h) => [...h, { round, attempts }]);
    setPhase("board");
    push("board", { wins: nextPoints });
  };

  const goNext = () => {
    if (!round) return;
    if (round.n >= totalRounds) {
      setPhase("final");
      push("recap");
      return;
    }
    openRound(round.n + 1, round);
  };

  // ── Écrans ─────────────────────────────────────────────
  if (phase === "setup") {
    return <PlayersSetup emoji="⏱️" name="Pile Poil" min={2} max={10} accent={ACCENT} onStart={beginMatch} />;
  }

  if (phase === "config") {
    return (
      <ConfigScreen
        players={players}
        mode={mode}
        setMode={setMode}
        totalRounds={totalRounds}
        setTotalRounds={setTotalRounds}
        autoTargets={autoTargets}
        setAutoTargets={setAutoTargets}
        specials={specials}
        setSpecials={setSpecials}
        onStart={() => {
          setPoints(players.map(() => 0));
          setHistory([]);
          openRound(1, null);
        }}
        onBack={() => setPhase("setup")}
      />
    );
  }

  if (!round) return null;

  if (phase === "intro") {
    return (
      <RoundIntro
        round={round}
        totalRounds={totalRounds}
        firstName={players[round.order[0]]}
        mode={mode}
        manual={!autoTargets}
        setTarget={(t) => setRound({ ...round, target: t, label: round.challenge?.id === "calc" ? calcLabel(t) : null })}
        onStart={startTurns}
        onRemote={
          net && !autoTargets
            ? () => {
                setPhase("await-remote");
                push("pick-target");
              }
            : undefined
        }
      />
    );
  }

  if (phase === "await-remote") {
    return (
      <Screen accent={ACCENT}>
        <GameIconBadge icon={Tv} bg={ACCENT} size={72} />
        <h2 className="cb-display-lg mt-3 text-center">L&apos;écran choisit…</h2>
        <p className="mt-2 max-w-xs text-center text-sm" style={{ color: "var(--text-dim)" }}>
          Saisis la cible sur le tél « Écran ». Dès qu&apos;elle est validée, la manche continue ici.
        </p>
        <button onClick={() => setPhase("intro")} className="af-btn af-btn-ghost mt-8 w-full max-w-xs" style={{ minHeight: 48 }}>
          <GameInlineIcon icon={ArrowLeft} /> Choisir ici
        </button>
      </Screen>
    );
  }

  const mystery = round.challenge?.id === "mystery";
  const targetText = mystery ? "???" : round.label ? round.label : `${num(round.target)} s`;

  if (phase === "pass") {
    return (
      <PassScreen
        toName={players[pi]}
        colorIndex={pi}
        accent={ACCENT}
        hint={
          mystery
            ? "Cible mystère : arrête-toi quand tu le sens !"
            : `Cible : ${targetText}${round.challenge ? ` · ${round.challenge.emoji} ${round.challenge.title}` : ""}`
        }
        buttonLabel="C'est moi — prêt"
        onReady={() => setPhase("ready")}
      />
    );
  }

  if (phase === "ready" || phase === "running") {
    const running = phase === "running";
    return (
      <div
        className="flex min-h-[100svh] select-none flex-col items-center justify-center px-6 text-center"
        style={{ background: DARK_BG, touchAction: "manipulation", paddingTop: TOP_SAFE, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        <style>{KEYFRAMES}</style>
        <p className="af-eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>
          {players[pi]} · manche {round.n}/{totalRounds}
        </p>
        <p className="mt-2 font-black text-white" style={{ fontFamily: "var(--font-display)", fontSize: round.label ? 40 : 64, lineHeight: 1.05 }}>
          {targetText}
        </p>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
          {running
            ? "🤫 Compte dans ta tête…"
            : mystery
              ? "Personne ne connaît la cible 🤐"
              : mode === "no-over"
                ? "Le plus proche SANS dépasser !"
                : "Le plus proche possible !"}
        </p>
        {round.challenge && (
          <div
            className="mt-4 w-full max-w-xs rounded-2xl px-4 py-2.5"
            style={{ background: "rgba(255,210,63,0.12)", border: "1.5px solid rgba(255,210,63,0.45)" }}
          >
            <p className="text-sm font-black" style={{ color: GOLD }}>
              {round.challenge.emoji} {round.challenge.title}
            </p>
            {!running && (
              <p className="mt-0.5 text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>
                {round.challenge.desc}
              </p>
            )}
          </div>
        )}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            if (running) onStop();
            else onGo();
          }}
          aria-label={running ? "Stop" : "Go"}
          className="mt-8 flex h-56 w-56 shrink-0 items-center justify-center rounded-full text-4xl font-black transition-transform active:scale-95"
          style={{
            fontFamily: "var(--font-display)",
            color: running ? "#2A0808" : "#04211C",
            background: running ? "radial-gradient(circle at 35% 30%, #FF8A7A, #E23434)" : "radial-gradient(circle at 35% 30%, #5FF5DD, #00C2A8)",
            border: "4px solid rgba(255,255,255,0.35)",
            boxShadow: running ? "0 0 70px rgba(226,52,52,0.55)" : "0 0 70px rgba(0,194,168,0.5)",
            touchAction: "none",
          }}
        >
          {running ? "STOP" : "GO"}
        </button>
        <p className="mt-6 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          {running ? "Le chrono est caché. Appuie quand tu penses y être." : "Appuie sur GO et commence à compter."}
        </p>
      </div>
    );
  }

  if (phase === "reveal") {
    const last = attempts[attempts.length - 1];
    if (!last) return null;
    return (
      <Reveal
        key={`${round.n}-${turn}`}
        attempt={last}
        target={round.target}
        mode={mode}
        mystery={mystery}
        sound={sound}
        nextLabel={turn + 1 < round.order.length ? `Au tour de ${players[round.order[turn + 1]]} →` : "Résultats de la manche"}
        onNext={nextTurn}
      />
    );
  }

  if (phase === "board") {
    return (
      <Board
        key={round.n}
        round={round}
        attempts={attempts}
        mode={mystery ? "closest" : mode}
        players={players}
        points={points}
        totalRounds={totalRounds}
        sound={sound}
        onNext={goNext}
        onFinish={() => {
          setPhase("final");
          push("recap");
        }}
      />
    );
  }

  // ── Classement final ──
  return (
    <FinalScreen
      players={players}
      points={points}
      history={history}
      onReplay={() => setPhase("config")}
      onNewPlayers={() => setPhase("setup")}
      onExit={onExit}
    />
  );
}

// ══════════════════════════════════════════════════════════
// Réglages
// ══════════════════════════════════════════════════════════
function Chip({ on, onClick, children, wide }: { on: boolean; onClick: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={wide ? "flex-1 rounded-2xl px-3 text-left" : "rounded-2xl px-4 text-base font-black"}
      style={{
        minHeight: 48,
        fontFamily: wide ? undefined : "var(--font-display)",
        background: on ? (wide ? "rgba(0,194,168,0.16)" : ACCENT) : "rgba(255,255,255,0.06)",
        color: on && !wide ? "#04211C" : "#fff",
        border: `1.5px solid ${on ? ACCENT : "rgba(255,255,255,0.14)"}`,
      }}
    >
      {children}
    </button>
  );
}

function ConfigScreen(p: {
  players: string[];
  mode: PPMode;
  setMode: (m: PPMode) => void;
  totalRounds: number;
  setTotalRounds: (n: number) => void;
  autoTargets: boolean;
  setAutoTargets: (v: boolean) => void;
  specials: boolean;
  setSpecials: (v: boolean) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div
      className="relative flex min-h-[100svh] flex-col items-center px-5 text-white"
      style={{
        background: `radial-gradient(circle at 50% 12%, ${ACCENT}30, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`,
        paddingTop: TOP_SAFE,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      <Mascot size={78} color="yellow" mood="thinking" arms shadow={false} />
      <h1 className="cb-display-lg mt-2 text-center">Pile Poil</h1>

      {/* Règle en 3 lignes : un nouveau joueur comprend en 10 s */}
      <div className="mt-4 w-full max-w-sm rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-[14px] leading-snug text-white/90">
          1. Une <b>cible</b> s&apos;affiche (ex. 7 s).
          <br />
          2. GO, tu comptes <b>dans ta tête</b> : le chrono est caché.
          <br />
          3. STOP quand tu y es. Le plus proche gagne la manche, <b>le plus loin prend une peine</b> (1 gorgée ou un gage).
        </p>
        <p className="mt-2 text-[13px] font-bold" style={{ color: GOLD }}>
          <GameInlineIcon icon={Target} /> À 0,10 s près : PILE POIL ! +1 point bonus.
        </p>
      </div>

      <p className="af-eyebrow mt-6">Nombre de manches</p>
      <div className="mt-2 flex gap-2">
        {[3, 5, 7, 10].map((n) => (
          <Chip key={n} on={p.totalRounds === n} onClick={() => p.setTotalRounds(n)}>
            {n}
          </Chip>
        ))}
      </div>

      <p className="af-eyebrow mt-6">La règle</p>
      <div className="mt-2 flex w-full max-w-sm gap-2">
        {(
          [
            { key: "closest", icon: Target, label: "Au plus proche", desc: "Avant ou après, peu importe" },
            { key: "no-over", icon: Ban, label: "Sans dépasser", desc: "Dépasser = dernier de la manche" },
          ] as const
        ).map((m) => (
          <Chip key={m.key} wide on={p.mode === m.key} onClick={() => p.setMode(m.key)}>
            <span className="block py-2">
              <span className="block text-sm font-black"><GameInlineIcon icon={m.icon} /> {m.label}</span>
              <span className="mt-0.5 block text-[12px]" style={{ color: "var(--text-dim)" }}>
                {m.desc}
              </span>
            </span>
          </Chip>
        ))}
      </div>

      <p className="af-eyebrow mt-6">Les cibles</p>
      <div className="mt-2 flex w-full max-w-sm gap-2">
        <Chip wide on={p.autoTargets} onClick={() => p.setAutoTargets(true)}>
          <span className="block py-2">
            <span className="block text-sm font-black"><GameInlineIcon icon={Dices} /> Surprise</span>
            <span className="mt-0.5 block text-[12px]" style={{ color: "var(--text-dim)" }}>
              De plus en plus dures
            </span>
          </span>
        </Chip>
        <Chip wide on={!p.autoTargets} onClick={() => p.setAutoTargets(false)}>
          <span className="block py-2">
            <span className="block text-sm font-black"><GameInlineIcon icon={PenLine} /> On choisit</span>
            <span className="mt-0.5 block text-[12px]" style={{ color: "var(--text-dim)" }}>
              À chaque manche
            </span>
          </span>
        </Chip>
      </div>

      <button
        onClick={() => p.setSpecials(!p.specials)}
        className="mt-4 flex w-full max-w-sm items-center justify-between rounded-2xl px-4 text-left"
        style={{ minHeight: 56, background: "rgba(255,255,255,0.05)", border: `1.5px solid ${p.specials ? "rgba(255,210,63,0.5)" : "rgba(255,255,255,0.12)"}` }}
        role="switch"
        aria-checked={p.specials}
      >
        <span>
          <span className="block text-sm font-black"><GameInlineIcon icon={Zap} /> Défis spéciaux</span>
          <span className="block text-[12px]" style={{ color: "var(--text-dim)" }}>
            Yeux fermés, en chantant, cible mystère…
          </span>
        </span>
        <span
          className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
          style={{ background: p.specials ? GOLD : "rgba(255,255,255,0.18)" }}
        >
          <span className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all" style={{ left: p.specials ? 24 : 4 }} />
        </span>
      </button>

      <button onClick={p.onStart} className="af-btn af-btn-primary mt-7 w-full max-w-sm" style={{ fontSize: 17, minHeight: 54 }}>
        C&apos;est parti ! ({p.players.length} joueurs)
      </button>
      <button onClick={p.onBack} className="mt-2 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
        <GameInlineIcon icon={ArrowLeft} /> Modifier les joueurs
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Annonce de manche (cible + défi)
// ══════════════════════════════════════════════════════════
function RoundIntro({
  round,
  totalRounds,
  firstName,
  mode,
  manual,
  setTarget,
  onStart,
  onRemote,
}: {
  round: Round;
  totalRounds: number;
  firstName: string;
  mode: PPMode;
  manual: boolean;
  setTarget: (t: number) => void;
  onStart: () => void;
  onRemote?: () => void;
}) {
  const mystery = round.challenge?.id === "mystery";
  const final = round.n === totalRounds;
  return (
    <Screen accent={round.challenge ? GOLD : ACCENT}>
      <style>{KEYFRAMES}</style>
      <p className="af-eyebrow" style={{ color: final ? GOLD : undefined }}>
        {final ? "🔥 Manche finale" : `Manche ${round.n} / ${totalRounds}`}
      </p>
      {!mystery && !manual && (
        <>
          <p className="mt-4 text-sm" style={{ color: "var(--text-dim)" }}>
            La cible
          </p>
          <p
            key={round.target}
            className="font-black text-white"
            style={{ fontFamily: "var(--font-display)", fontSize: round.label ? 44 : 88, lineHeight: 1, animation: "pp-pop .5s ease-out", textShadow: `0 0 40px ${ACCENT}88` }}
          >
            {round.label ?? `${num(round.target)} s`}
          </p>
        </>
      )}
      {manual && !mystery && (
        <>
          <p className="mt-4 text-sm" style={{ color: "var(--text-dim)" }}>
            Choisissez la cible
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {[3, 5, 7, 10, 12, 15, 20].map((t) => (
              <Chip key={t} on={round.target === t} onClick={() => setTarget(t)}>
                {t} s
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={() => setTarget(Math.max(1, Math.round((round.target - 0.5) * 2) / 2))} className="af-btn af-btn-ghost h-12 w-12 !p-0 text-xl" aria-label="Moins">
              −
            </button>
            <span className="w-28 text-center text-3xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
              {num(round.target)} s
            </span>
            <button onClick={() => setTarget(Math.min(60, Math.round((round.target + 0.5) * 2) / 2))} className="af-btn af-btn-ghost h-12 w-12 !p-0 text-xl" aria-label="Plus">
              +
            </button>
          </div>
          {round.label && (
            <p className="mt-2 text-sm font-bold" style={{ color: GOLD }}>
              Affichée en calcul : « {round.label} »
            </p>
          )}
        </>
      )}
      {mystery && (
        <p className="mt-4 font-black" style={{ fontFamily: "var(--font-display)", fontSize: 88, lineHeight: 1, color: GOLD, animation: "pp-pop .5s ease-out" }}>
          ???
        </p>
      )}

      {round.challenge ? (
        <div
          className="mt-6 w-full max-w-sm rounded-3xl p-4 text-center"
          style={{ background: "rgba(255,210,63,0.1)", border: "2px solid rgba(255,210,63,0.55)", animation: "pp-rise .5s .15s ease-out both" }}
        >
          <p className="af-eyebrow" style={{ color: GOLD }}>
            <GameInlineIcon icon={Zap} /> Défi spécial
          </p>
          <p className="mt-1 text-4xl">{round.challenge.emoji}</p>
          <p className="cb-display-md mt-1">{round.challenge.title}</p>
          <p className="mt-1 text-[14px] leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>
            {round.challenge.desc}
          </p>
        </div>
      ) : (
        <p className="mt-5 text-sm" style={{ color: "var(--text-dim)" }}>
          {mode === "no-over" ? <><GameInlineIcon icon={Ban} /> Sans dépasser</> : <><GameInlineIcon icon={Target} /> Au plus proche</>}
        </p>
      )}

      <p className="mt-6 text-sm" style={{ color: "var(--text-dim)" }}>
        <b className="text-white">{firstName}</b> commence
      </p>
      <button onClick={onStart} className="af-btn af-btn-primary mt-3 w-full max-w-xs" style={{ fontSize: 17, minHeight: 54 }}>
        C&apos;est parti →
      </button>
      {onRemote && (
        <button onClick={onRemote} className="af-btn af-btn-ghost mt-2 w-full max-w-xs" style={{ fontSize: 14, minHeight: 48 }}>
          <GameInlineIcon icon={Tv} /> C&apos;est l&apos;écran qui choisit la cible
        </button>
      )}
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════
// Révélation : le compteur défile jusqu'au vrai temps
// ══════════════════════════════════════════════════════════
function Reveal({
  attempt,
  target,
  mode,
  mystery,
  sound,
  nextLabel,
  onNext,
}: {
  attempt: Attempt;
  target: number;
  mode: PPMode;
  mystery: boolean;
  sound: boolean;
  nextLabel: string;
  onNext: () => void;
}) {
  const final = attempt.elapsedMs;
  const targetMs = target * 1000;
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const [overFlash, setOverFlash] = useState(false);

  useEffect(() => {
    // Durée du défilement : plus le temps est long, plus ça dure (1,6 → 2,8 s)
    const dur = Math.min(2800, Math.max(1600, 1200 + final * 0.08));
    const t0 = performance.now();
    let lastSec = 0;
    let crossed = false;
    let raf = 0;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3.2);
    const loop = (now: number) => {
      const x = Math.min(1, (now - t0) / dur);
      const v = final * ease(x);
      setShown(v);
      const sec = Math.floor(v / 1000);
      if (sec > lastSec) {
        lastSec = sec;
        if (sound) fxTick(sec);
        vibrate(8);
      }
      if (!mystery && !crossed && v > targetMs) {
        crossed = true;
        setOverFlash(true);
        if (sound) fxOver();
      }
      if (x < 1) raf = requestAnimationFrame(loop);
      else setDone(true);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [final, targetMs, mystery, sound]);

  const gap = Math.abs(final - targetMs);
  const perfect = !mystery && isPerfect(attempt, target, mode);
  const close = !mystery && !perfect && gap <= CLOSE_MS && !(mode === "no-over" && attempt.over);
  const busted = !mystery && mode === "no-over" && attempt.over;

  // Réaction finale (son + vibration) une seule fois
  const reacted = useRef(false);
  useEffect(() => {
    if (!done || reacted.current) return;
    reacted.current = true;
    if (mystery) {
      if (sound) fxGood();
      return;
    }
    if (perfect) {
      if (sound) fxPerfect();
      vibrate([90, 40, 90, 40, 260]);
    } else if (close) {
      if (sound) fxGood();
      vibrate(60);
    } else if (gap > 1500 || busted) {
      if (sound) fxBad();
      vibrate([200, 80, 200]);
    } else if (sound) fxGood();
  }, [done, perfect, close, gap, busted, mystery, sound]);

  const color = !done ? (overFlash ? RED : "#fff") : mystery ? "#fff" : perfect ? GOLD : busted || gap > 1500 ? RED : gap <= 700 ? MINT : "#fff";
  const scale = Math.max(targetMs * 1.5, final * 1.08, 1);

  const verdict = mystery
    ? "Cible révélée à la fin de la manche 🤐"
    : perfect
      ? ""
      : busted
        ? "Dépassé ! Dernier de la manche 🥴"
        : close
          ? "Presque ! 🔥"
          : gap <= 700
            ? "Pas mal 👌"
            : gap <= 1500
              ? "Bof… 😬"
              : attempt.over
                ? "Beaucoup trop long 🐌"
                : "Beaucoup trop pressé 🐇";

  return (
    <div
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center text-white"
      style={{
        background: perfect && done ? "radial-gradient(120% 80% at 50% 20%, #5A4200 0%, #120B00 100%)" : overFlash && !mystery ? "radial-gradient(120% 80% at 50% 0%, #3A0A0A 0%, #120202 100%)" : DARK_BG,
        transition: "background .4s",
        paddingTop: TOP_SAFE,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      <style>{KEYFRAMES}</style>
      {perfect && done && (
        <>
          <div className="pointer-events-none absolute inset-0" style={{ background: GOLD, animation: "pp-flash .6s ease-out forwards" }} />
          <ConfettiBurst count={90} />
        </>
      )}
      <Mascot
        size={96}
        color={colorForIndex(attempt.pi)}
        mood={!done ? "thinking" : mystery ? "wink" : perfect ? "mindblown" : busted || gap > 1500 ? "dead" : close ? "fire" : "happy"}
        arms
      />
      <p className="af-eyebrow mt-3">{attempt.name}</p>
      {!mystery && (
        <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
          Cible : {num(target)} s
        </p>
      )}
      <p
        className="mt-1 font-black tabular-nums"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "min(22vw, 6.5rem)",
          lineHeight: 1,
          color,
          textShadow: `0 0 40px ${color}55`,
          transition: "color .2s",
        }}
      >
        {(shown / 1000).toFixed(2).replace(".", ",")}
      </p>

      {/* Jauge : progression du temps vers la cible */}
      {!mystery && (
        <div className="relative mt-5 h-3 w-full max-w-xs rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${Math.min(100, (shown / scale) * 100)}%`, background: overFlash ? RED : ACCENT }}
          />
          <div className="absolute -top-1.5 bottom-[-6px] w-[3px] rounded" style={{ left: `${(targetMs / scale) * 100}%`, background: GOLD }} />
          <span className="absolute top-4 -translate-x-1/2" style={{ left: `${(targetMs / scale) * 100}%`, color: GOLD }}>
            <Target size={14} strokeWidth={3} aria-hidden />
          </span>
        </div>
      )}

      <div className="mt-8 flex min-h-[96px] flex-col items-center">
        {done && perfect && (
          <p
            className="font-black"
            style={{ fontFamily: "var(--font-display)", fontSize: 52, lineHeight: 1, color: GOLD, textShadow: "0 0 30px rgba(255,210,63,0.8)", animation: "pp-pop .45s ease-out, pp-shake .6s .45s" }}
          >
            PILE POIL !
          </p>
        )}
        {done && !mystery && (
          <p className="mt-2 text-xl font-black" style={{ fontFamily: "var(--font-display)", color: perfect ? GOLD : color, animation: "pp-rise .3s ease-out" }}>
            {fmtDelta(final, target)} {perfect ? "· +1 point bonus 🎯" : ""}
          </p>
        )}
        {done && verdict && (
          <p className="mt-1 text-base font-bold" style={{ color: "rgba(255,255,255,0.85)", animation: "pp-rise .3s .1s ease-out both" }}>
            {verdict}
          </p>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!done}
        className="af-btn af-btn-primary mt-6 w-full max-w-xs disabled:opacity-0"
        style={{ fontSize: 16, minHeight: 54, transition: "opacity .3s" }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Résultats de la manche
// ══════════════════════════════════════════════════════════
function Board({
  round,
  attempts,
  mode,
  players,
  points,
  totalRounds,
  sound,
  onNext,
  onFinish,
}: {
  round: Round;
  attempts: Attempt[];
  mode: PPMode;
  players: string[];
  points: number[];
  totalRounds: number;
  sound: boolean;
  onNext: () => void;
  onFinish: () => void;
}) {
  const mystery = round.challenge?.id === "mystery";
  // Cible mystère : roulement avant de dévoiler la cible
  const [rolled, setRolled] = useState(!mystery);
  const [rollShown, setRollShown] = useState(0);
  useEffect(() => {
    if (!mystery) return;
    if (sound) fxDrum(1.5);
    const iv = setInterval(() => setRollShown(3 + Math.random() * 17), 70);
    const to = setTimeout(() => {
      clearInterval(iv);
      setRolled(true);
      vibrate([60, 40, 120]);
      if (sound) fxGood();
    }, 1600);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [mystery, sound]);

  const [gage, setGage] = useState(() => rnd(GAGES));
  const ranked = useMemo(() => rankAttempts(attempts, round.target, mode), [attempts, round.target, mode]);
  const loser = ranked.length > 1 ? ranked[ranked.length - 1] : null;
  const loserGap = loser ? Math.abs(loser.elapsedMs - round.target * 1000) : 0;
  const sips = loserGap > 3000 ? 2 : 1;
  const perfects = attempts.filter((a) => isPerfect(a, round.target, mode));
  const last = round.n >= totalRounds;

  if (!rolled) {
    return (
      <Screen accent={GOLD}>
        <style>{KEYFRAMES}</style>
        <p className="af-eyebrow"><GameInlineIcon icon={CircleHelp} /> Cible mystère</p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
          La cible était…
        </p>
        <p className="font-black tabular-nums" style={{ fontFamily: "var(--font-display)", fontSize: 88, lineHeight: 1, color: GOLD }}>
          {rollShown.toFixed(1).replace(".", ",")}
        </p>
      </Screen>
    );
  }

  return (
    <div
      className="relative flex min-h-[100svh] flex-col items-center px-5 text-white"
      style={{
        background: `radial-gradient(circle at 50% 12%, ${ACCENT}30, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`,
        paddingTop: TOP_SAFE,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      <style>{KEYFRAMES}</style>
      <p className="af-eyebrow">
        Manche {round.n}/{totalRounds} · {mystery ? "la cible était" : "cible"}{" "}
        <span style={{ color: GOLD }}>{num(round.target)} s</span>
      </p>
      <h2 className="cb-display-lg mt-1">Résultats</h2>

      <div className="mt-4 w-full max-w-sm space-y-2">
        {ranked.map((a, i) => {
          const isWin = i === 0 && players.length > 1;
          const isLose = loser === a;
          const perfect = isPerfect(a, round.target, mode);
          const busted = mode === "no-over" && a.over;
          return (
            <div
              key={a.pi}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
              style={{
                animation: `pp-rise .35s ${i * 0.08}s ease-out both`,
                background: isWin ? "rgba(255,210,63,0.13)" : isLose ? "rgba(255,106,91,0.14)" : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${isWin ? "rgba(255,210,63,0.55)" : isLose ? "rgba(255,106,91,0.55)" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              <span className="w-6 text-center text-base font-black" style={{ color: isWin ? GOLD : "rgba(255,255,255,0.6)" }}>
                {isWin ? "👑" : isLose ? <CupSoda size={16} strokeWidth={2.6} className="mx-auto" aria-hidden /> : `${i + 1}`}
              </span>
              <MascotAvatar color={colorForIndex(a.pi)} size={32} mood={isWin ? "cool" : isLose ? "dead" : "happy"} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">{a.name}</span>
                <span className="block text-[12px]" style={{ color: "var(--text-dim)" }}>
                  {fmtS(a.elapsedMs)}
                  {busted ? " · dépassé" : ""}
                  {perfect ? " · 🎯 +1" : ""}
                </span>
              </span>
              <span className="shrink-0 text-[15px] font-black tabular-nums" style={{ fontFamily: "var(--font-display)", color: perfect ? GOLD : busted || isLose ? RED : Math.abs(a.elapsedMs - round.target * 1000) <= 700 ? MINT : "#fff" }}>
                {fmtDelta(a.elapsedMs, round.target)}
              </span>
            </div>
          );
        })}
      </div>

      {perfects.length > 0 && (
        <p className="mt-4 max-w-sm text-center text-[14px] font-bold" style={{ color: GOLD }}>
          🎯 PILE POIL pour {perfects.map((a) => a.name).join(", ")} : {perfects.length > 1 ? "chacun distribue" : "distribue"} 1 gorgée ou un gage !
        </p>
      )}

      {/* Le perdant, mis en avant */}
      {loser && (
        <div
          className="mt-4 w-full max-w-sm rounded-3xl p-4 text-center"
          style={{ background: "linear-gradient(160deg, rgba(255,106,91,0.22), rgba(255,106,91,0.06))", border: "2px solid rgba(255,106,91,0.6)", animation: `pp-pop .45s ${ranked.length * 0.08 + 0.1}s ease-out both` }}
        >
          <p className="af-eyebrow" style={{ color: RED }}>
            Le plus loin
          </p>
          <p className="cb-display-md mt-1">{loser.name} prend une peine</p>
          <p className="mt-1 text-[15px] font-bold text-white/90">
            {sips} gorgée{sips > 1 ? "s" : ""} (eau ou soft OK) <span style={{ color: "var(--text-dim)" }}>ou</span> le gage :
          </p>
          <p className="mt-2 rounded-2xl px-3 py-2 text-[15px] font-semibold" style={{ background: "rgba(0,0,0,0.25)" }}>
            « {gage} »
          </p>
          <button
            onClick={() => setGage((g) => rnd(GAGES.filter((x) => x !== g)))}
            className="mt-2 text-[13px] font-bold"
            style={{ color: "rgba(255,255,255,0.75)", minHeight: 44 }}
          >
            <GameInlineIcon icon={Dices} /> Autre gage
          </button>
        </div>
      )}

      {/* Scores cumulés */}
      <div className="mt-4 flex max-w-sm flex-wrap justify-center gap-1.5">
        {players
          .map((name, i) => ({ name, i, pts: points[i] ?? 0 }))
          .sort((a, b) => b.pts - a.pts)
          .map((s) => (
            <span key={s.i} className="rounded-full px-3 py-1.5 text-[13px] font-bold" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
              {s.name} · {s.pts} pt{s.pts > 1 ? "s" : ""}
            </span>
          ))}
      </div>

      <button onClick={onNext} className="af-btn af-btn-primary mt-6 w-full max-w-sm" style={{ fontSize: 16, minHeight: 54 }}>
        {last ? "Classement final 🏆" : `Manche ${round.n + 1} →`}
      </button>
      {!last && (
        <button onClick={onFinish} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
          Terminer la partie
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Classement final
// ══════════════════════════════════════════════════════════
function FinalScreen({
  players,
  points,
  history,
  onReplay,
  onNewPlayers,
  onExit,
}: {
  players: string[];
  points: number[];
  history: { round: Round; attempts: Attempt[] }[];
  onReplay: () => void;
  onNewPlayers: () => void;
  onExit?: () => void;
}) {
  // Écart cumulé = départage en cas d'égalité de points
  const totalGap = players.map((_, i) =>
    history.reduce((s, h) => s + h.attempts.filter((a) => a.pi === i).reduce((x, a) => x + Math.abs(a.elapsedMs - h.round.target * 1000), 0), 0)
  );
  const standings = players.map((name, i) => ({ name, i, pts: points[i] ?? 0, gap: totalGap[i] })).sort((a, b) => b.pts - a.pts || a.gap - b.gap);
  const champ = standings[0];

  const all = history.flatMap((h) => h.attempts.map((a) => ({ ...a, gap: Math.abs(a.elapsedMs - h.round.target * 1000), target: h.round.target })));
  const best = all.length ? all.reduce((m, a) => (a.gap < m.gap ? a : m)) : null;
  const worst = all.length ? all.reduce((m, a) => (a.gap > m.gap ? a : m)) : null;

  return (
    <Screen accent={GOLD}>
      <style>{KEYFRAMES}</style>
      <ConfettiBurst count={70} />
      <p className="af-eyebrow" style={{ color: GOLD }}>
        Champion·ne du chrono
      </p>
      <div style={{ animation: "pp-pop .6s ease-out" }}>
        <Mascot size={110} color={colorForIndex(champ?.i ?? 0)} mood="cool" arms />
      </div>
      <h2 className="cb-display-lg mt-2 max-w-full break-words text-center">{champ?.name ?? "—"}</h2>
      <p className="text-sm" style={{ color: "var(--text-dim)" }}>
        {champ?.pts ?? 0} point{(champ?.pts ?? 0) > 1 ? "s" : ""}
        {standings[1] && standings[1].pts === champ?.pts ? " · départagé au plus petit écart cumulé" : ""}
      </p>

      <div className="mt-4 w-full max-w-sm space-y-1.5">
        {standings.map((s, i) => (
          <div
            key={s.i}
            className="flex items-center gap-3 rounded-2xl px-3 py-2"
            style={{ background: i === 0 ? "rgba(255,210,63,0.13)" : "rgba(255,255,255,0.05)", border: `1px solid ${i === 0 ? "rgba(255,210,63,0.5)" : "rgba(255,255,255,0.1)"}`, animation: `pp-rise .35s ${i * 0.07}s ease-out both` }}
          >
            <span className="w-6 text-center font-black" style={{ color: i === 0 ? GOLD : "rgba(255,255,255,0.6)" }}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
            </span>
            <MascotAvatar color={colorForIndex(s.i)} size={28} mood={i === 0 ? "cool" : "happy"} />
            <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{s.name}</span>
            <span className="text-[15px] font-black" style={{ fontFamily: "var(--font-display)" }}>
              {s.pts} pt{s.pts > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>

      {best && worst && (
        <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2 text-left">
          <div className="rounded-2xl p-3" style={{ background: "rgba(95,245,221,0.08)", border: "1px solid rgba(95,245,221,0.3)" }}>
            <p className="text-[12px] font-bold" style={{ color: MINT }}>
              🎯 Meilleur tir
            </p>
            <p className="truncate text-[15px] font-black">{best.name}</p>
            <p className="text-[12px]" style={{ color: "var(--text-dim)" }}>
              à {(best.gap / 1000).toFixed(2).replace(".", ",")} s de {num(best.target)} s
            </p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: "rgba(255,106,91,0.08)", border: "1px solid rgba(255,106,91,0.3)" }}>
            <p className="text-[12px] font-bold" style={{ color: RED }}>
              🐌 Le plus à côté
            </p>
            <p className="truncate text-[15px] font-black">{worst.name}</p>
            <p className="text-[12px]" style={{ color: "var(--text-dim)" }}>
              {fmtS(worst.elapsedMs)} pour {num(worst.target)} s
            </p>
          </div>
        </div>
      )}

      <button onClick={onReplay} className="af-btn af-btn-primary mt-6 w-full max-w-xs" style={{ fontSize: 16, minHeight: 54 }}>
        Rejouer
      </button>
      <button onClick={onNewPlayers} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
        Changer de joueurs
      </button>
      {onExit && (
        <button onClick={onExit} className="text-sm" style={{ color: "var(--text-muted)", minHeight: 44 }}>
          Quitter
        </button>
      )}
    </Screen>
  );
}
