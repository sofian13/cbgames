"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlayersSetup, PassScreen, colorForIndex } from "@/components/games/local-kit";
import { Mascot, MascotAvatar, MASCOT_PALETTE } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { Ban, Crown, CupSoda, Dices, PenLine, Target, Tv, Zap } from "lucide-react";
import { GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { TopRightControls } from "@/components/games/patate/rules-sheet";
import { C, Chip as KitChip, DISPLAY, INK, KitStyles, NameTag, OptionCard, SectionTitle, SoftLink, StickerBtn, StickerCard, StickerScreen, TOP_PAD, BOTTOM_PAD, dotted, sticker } from "@/components/games/patate/sticker-kit";
import { fxBad, fxDrum, fxGood, fxOver, fxPerfect, fxPreload, fxReveal, fxTap, fxTick, fxUnlock, vibrate } from "./pp-fx";

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
const ACCENT = "#3DDC97";
const GOLD = "#FFD23F";
const RED = "#FF6B5B";

const RULES = [
  "Une cible s'affiche, par exemple 7 s.",
  "GO, compte dans ta tête (le chrono est caché), puis STOP.",
  "Le plus proche gagne la manche. À 0,10 s près : PILE POIL, +1 bonus.",
  "Le plus loin prend un gage ou 1 gorgée (eau OK).",
];

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

/** Écran plein (DA sticker), centré verticalement, jamais sous les coins du haut. */
function Screen({ bg = C.night, light, children }: { bg?: string; light?: boolean; children: React.ReactNode }) {
  return (
    <StickerScreen bg={bg} light={light} center>
      {children}
    </StickerScreen>
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
  // La coupure du son est globale (sfx.ts) : on joue toujours, sfx.ts filtre
  const sound = true;
  useEffect(() => {
    fxPreload();
  }, []);

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

  // Autre défi (avant que quiconque ait joué la manche : aucun impact sur le score)
  const rerollChallenge = () => {
    if (!round || !round.challenge) return;
    const pool = CHALLENGES.filter((c) => c.id !== round.challenge?.id && (autoTargets || c.id !== "mystery"));
    const ch = rnd(pool);
    setRound({ ...round, challenge: ch, label: ch.id === "calc" ? calcLabel(round.target) : null });
  };

  // Autre cible (cible tirée au sort, avant que quiconque ait joué)
  const rerollTarget = () => {
    if (!round) return;
    const t = pickTarget(round.n, totalRounds, round.target);
    setRound({ ...round, target: t, label: round.challenge?.id === "calc" ? calcLabel(t) : null });
  };

  const controls = <TopRightControls title="Pile Poil" rules={RULES} accent={ACCENT} />;

  // ── Écrans ─────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <>
        {controls}
        <PlayersSetup emoji="" name="Pile Poil" min={2} max={10} accent={ACCENT} onStart={beginMatch} />
      </>
    );
  }

  if (phase === "config") {
    return (
      <>
        {controls}
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
      </>
    );
  }

  if (!round) return null;

  if (phase === "intro") {
    return (
      <>
        {controls}
        <RoundIntro
          round={round}
          totalRounds={totalRounds}
          firstName={players[round.order[0]]}
          mode={mode}
          manual={!autoTargets}
          setTarget={(t) => setRound({ ...round, target: t, label: round.challenge?.id === "calc" ? calcLabel(t) : null })}
          onReroll={rerollChallenge}
          onRerollTarget={rerollTarget}
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
      </>
    );
  }

  if (phase === "await-remote") {
    return (
      <Screen>
        {controls}
        <GameIconBadge icon={Tv} bg={ACCENT} size={72} />
        <h2 className="mt-3 text-center text-[40px] leading-none" style={DISPLAY}>L&apos;écran choisit…</h2>
        <p className="mt-3 max-w-xs text-center text-[16px] font-semibold">
          Saisis la cible sur le tél « Écran ». Dès qu&apos;elle est validée, la manche continue ici.
        </p>
        <div className="mt-8 w-full">
          <StickerBtn big bg={C.cream} onClick={() => setPhase("intro")}>Choisir ici</StickerBtn>
        </div>
      </Screen>
    );
  }

  const mystery = round.challenge?.id === "mystery";
  const targetText = mystery ? "???" : round.label ? round.label : `${num(round.target)} s`;

  if (phase === "pass") {
    return (
      <>
        {controls}
        <PassScreen
          toName={players[pi]}
          colorIndex={pi}
          accent={ACCENT}
          hint={
            mystery
              ? "Cible mystère : arrête-toi quand tu le sens !"
              : `Cible : ${targetText}${round.challenge ? ` · ${round.challenge.title}` : ""}`
          }
          buttonLabel="C'est moi, prêt"
          onReady={() => setPhase("ready")}
        />
      </>
    );
  }

  if (phase === "ready" || phase === "running") {
    const running = phase === "running";
    const pal = MASCOT_PALETTE[colorForIndex(pi)];
    return (
      <div
        className="relative flex min-h-[100dvh] shrink-0 select-none flex-col items-center justify-center px-6 text-center text-white"
        style={{ ...dotted(running ? "#2A0E3E" : C.night), touchAction: "manipulation", paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD, transition: "background-color .3s" }}
      >
        <KitStyles />
        {controls}
        <p className="text-[20px] leading-tight" style={DISPLAY}>
          <NameTag bg={pal.body} style={{ color: pal.body === "#7A4EE8" ? "#fff" : INK, maxWidth: 200 }}>{players[pi]}</NameTag>
          <span className="ml-2">manche {round.n}/{totalRounds}</span>
        </p>
        <div className="mt-4 px-6 py-2" style={{ ...sticker(C.cream, { radius: 24, shadow: 5 }), transform: "rotate(-2deg)" }}>
          <p className="leading-none" style={{ ...DISPLAY, fontSize: round.label ? 40 : 66 }}>{targetText}</p>
        </div>
        <p className="mt-4 text-[17px] font-bold">
          {running
            ? "Compte dans ta tête…"
            : mystery
              ? "Personne ne connaît la cible"
              : mode === "no-over"
                ? "Le plus proche SANS dépasser !"
                : "Le plus proche possible !"}
        </p>
        {round.challenge && (
          <StickerCard bg={C.yellow} radius={20} shadow={4} tilt={1.5} className="mt-4 max-w-xs px-4 py-2.5">
            <p className="text-[19px] leading-tight" style={DISPLAY}><GameInlineIcon icon={Zap} /> {round.challenge.title}</p>
            {!running && <p className="mt-0.5 text-[14px] font-semibold leading-snug">{round.challenge.desc}</p>}
          </StickerCard>
        )}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (running) onStop();
            else onGo();
          }}
          aria-label={running ? "Stop" : "Go"}
          className="zk-push mt-8 flex h-52 w-52 shrink-0 items-center justify-center rounded-full text-[56px]"
          style={{ ...sticker(running ? RED : ACCENT, { radius: 999, shadow: 8, border: 4, color: running ? "#fff" : INK }), ...DISPLAY, touchAction: "none" }}
        >
          {running ? "STOP" : "GO"}
        </button>
        <p className="mt-6 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
          {running ? "Le chrono est caché. Appuie quand tu penses y être." : "Appuie sur GO et commence à compter."}
        </p>
      </div>
    );
  }

  if (phase === "reveal") {
    const last = attempts[attempts.length - 1];
    if (!last) return null;
    return (
      <>
        {controls}
        <Reveal
          key={`${round.n}-${turn}`}
          attempt={last}
          target={round.target}
          mode={mode}
          mystery={mystery}
          sound={sound}
          nextLabel={turn + 1 < round.order.length ? `Au tour de ${players[round.order[turn + 1]]}` : "Résultats de la manche"}
          onNext={nextTurn}
        />
      </>
    );
  }

  if (phase === "board") {
    return (
      <>
        {controls}
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
      </>
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
    <StickerScreen bg={C.night}>
      <Mascot size={74} color="mint" mood="thinking" arms shadow={false} />
      <h1 className="mt-1 text-center text-[clamp(44px,13vw,60px)] leading-[0.92]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
        Pile Poil
      </h1>

      {/* Règle en 3 lignes : un nouveau joueur comprend en 10 s */}
      <StickerCard bg={C.cream} radius={22} shadow={5} tilt={-1} className="mt-4 p-4">
        <ol className="space-y-1.5 text-[15px] font-semibold leading-snug">
          <li>1. Une <b>cible</b> s&apos;affiche (ex. 7 s).</li>
          <li>2. GO, tu comptes <b>dans ta tête</b> : le chrono est caché.</li>
          <li>3. STOP quand tu y es. Le plus proche gagne, <b>le plus loin prend une peine</b> (1 gorgée, eau OK, ou un gage).</li>
        </ol>
        <p className="mt-2 text-[16px] leading-tight" style={DISPLAY}>
          <GameInlineIcon icon={Target} /> À 0,10 s près : PILE POIL, +1 bonus.
        </p>
      </StickerCard>

      <div className="mt-6 w-full">
        <SectionTitle>Nombre de manches</SectionTitle>
        <div className="grid grid-cols-4 gap-2.5">
          {[3, 5, 7, 10].map((n) => (
            <KitChip key={n} on={p.totalRounds === n} onClick={() => p.setTotalRounds(n)} onBg={ACCENT}>
              {n}
            </KitChip>
          ))}
        </div>
      </div>

      <div className="mt-6 w-full space-y-2.5">
        <SectionTitle>La règle</SectionTitle>
        <OptionCard on={p.mode === "closest"} onClick={() => p.setMode("closest")} icon={Target} title="Au plus proche" sub="Avant ou après, peu importe" onBg={ACCENT} />
        <OptionCard on={p.mode === "no-over"} onClick={() => p.setMode("no-over")} icon={Ban} title="Sans dépasser" sub="Dépasser = dernier de la manche" onBg={ACCENT} />
      </div>

      <div className="mt-6 w-full space-y-2.5">
        <SectionTitle>Les cibles</SectionTitle>
        <OptionCard on={p.autoTargets} onClick={() => p.setAutoTargets(true)} icon={Dices} title="Surprise" sub="De plus en plus dures" onBg={C.yellow} />
        <OptionCard on={!p.autoTargets} onClick={() => p.setAutoTargets(false)} icon={PenLine} title="On choisit" sub="À chaque manche" onBg={C.yellow} />
        <OptionCard kind="switch" on={p.specials} onClick={() => p.setSpecials(!p.specials)} icon={Zap} title="Défis spéciaux" sub="Yeux fermés, en chantant, cible mystère…" onBg={C.pink} />
      </div>

      <div className="mt-auto flex w-full flex-col items-center pt-7">
        <StickerBtn big bg={ACCENT} onClick={p.onStart}>C&apos;est parti !</StickerBtn>
        <SoftLink onClick={p.onBack}>Modifier les joueurs ({p.players.length})</SoftLink>
        <div className="mt-2">
          <IdeaButton game="Pile Poil" kind="défi" bg={C.cream} />
        </div>
      </div>
    </StickerScreen>
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
  onReroll,
  onRerollTarget,
  onStart,
  onRemote,
}: {
  round: Round;
  totalRounds: number;
  firstName: string;
  mode: PPMode;
  manual: boolean;
  setTarget: (t: number) => void;
  onReroll: () => void;
  onRerollTarget: () => void;
  onStart: () => void;
  onRemote?: () => void;
}) {
  const mystery = round.challenge?.id === "mystery";
  const final = round.n === totalRounds;
  return (
    <Screen bg={round.challenge ? "#2A1A5E" : C.night}>
      <span className="px-3.5 py-1 text-[18px]" style={{ ...sticker(final ? GOLD : "#fff", { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
        {final ? "Manche finale" : `Manche ${round.n} / ${totalRounds}`}
      </span>
      {!mystery && !manual && (
        <>
          <p className="mt-5 text-[20px]" style={DISPLAY}>La cible</p>
          <div key={round.target} className="zk-pop mt-2 px-7 py-3" style={{ ...sticker(C.cream, { radius: 28, shadow: 6 }), ["--zk-r" as string]: "-2deg" }}>
            <p className="leading-none" style={{ ...DISPLAY, fontSize: round.label ? 44 : 92 }}>{round.label ?? `${num(round.target)} s`}</p>
          </div>
          <div className="mt-4">
            <RerollButton onClick={onRerollTarget} label="Pas fou ? Une autre cible" />
          </div>
        </>
      )}
      {manual && !mystery && (
        <>
          <p className="mt-5 text-[20px]" style={DISPLAY}>Choisissez la cible</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[3, 5, 7, 10, 12, 15, 20].map((t) => (
              <KitChip key={t} on={round.target === t} onClick={() => setTarget(t)} onBg={ACCENT}>
                {t} s
              </KitChip>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <StickerBtn bg="#fff" className="!px-0" style={{ width: 52, minHeight: 52, fontSize: 28 }} label="Moins" onClick={() => setTarget(Math.max(1, Math.round((round.target - 0.5) * 2) / 2))}>−</StickerBtn>
            <span className="w-32 text-center text-[40px] leading-none" style={DISPLAY}>{num(round.target)} s</span>
            <StickerBtn bg={C.yellow} className="!px-0" style={{ width: 52, minHeight: 52, fontSize: 28 }} label="Plus" onClick={() => setTarget(Math.min(60, Math.round((round.target + 0.5) * 2) / 2))}>+</StickerBtn>
          </div>
          {round.label && (
            <p className="mt-3 text-[16px] font-bold" style={{ color: GOLD }}>
              Affichée en calcul : « {round.label} »
            </p>
          )}
        </>
      )}
      {mystery && (
        <div className="zk-pop mt-5 px-7 py-3" style={{ ...sticker(GOLD, { radius: 28, shadow: 6 }), ["--zk-r" as string]: "2deg" }}>
          <p className="leading-none" style={{ ...DISPLAY, fontSize: 92 }}>???</p>
        </div>
      )}

      {round.challenge ? (
        <StickerCard bg={C.yellow} radius={24} shadow={5} tilt={1.5} className="zk-rise mt-6 p-4 text-center" style={{ animationDelay: ".15s" }}>
          <p className="text-[16px] font-bold"><GameInlineIcon icon={Zap} /> Défi spécial</p>
          <p className="mt-1 text-[28px] leading-tight" style={DISPLAY}>{round.challenge.title}</p>
          <p className="mt-1 text-[16px] font-semibold leading-snug">{round.challenge.desc}</p>
          <div className="mt-3 flex justify-center">
            <RerollButton onClick={onReroll} label="Pas fou ? Un autre défi" />
          </div>
        </StickerCard>
      ) : (
        <p className="mt-5 text-[17px] font-bold">
          {mode === "no-over" ? <><GameInlineIcon icon={Ban} /> Sans dépasser</> : <><GameInlineIcon icon={Target} /> Au plus proche</>}
        </p>
      )}

      <p className="mt-6 text-[20px]" style={DISPLAY}>{firstName} commence</p>
      <div className="mt-3 w-full">
        <StickerBtn big bg={ACCENT} onClick={onStart}>C&apos;est parti !</StickerBtn>
      </div>
      {onRemote && (
        <div className="mt-3 w-full">
          <StickerBtn bg={C.cream} className="w-full" onClick={onRemote}>
            <GameInlineIcon icon={Tv} /> L&apos;écran choisit la cible
          </StickerBtn>
        </div>
      )}
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════
// Révélation : roulement de tambour, puis le compteur défile jusqu'au vrai temps
// ══════════════════════════════════════════════════════════
const SUSPENSE_MS = 900;

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
    // Suspense : roulement, puis défilement (plus le temps est long, plus ça dure : 1,6 → 2,8 s)
    if (sound) fxDrum();
    const dur = Math.min(2800, Math.max(1600, 1200 + final * 0.08));
    const t0 = performance.now() + SUSPENSE_MS;
    let lastSec = 0;
    let crossed = false;
    let raf = 0;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3.2);
    const loop = (now: number) => {
      const x = Math.max(0, Math.min(1, (now - t0) / dur));
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

  const bad = busted || gap > 1500;
  const bg = !done ? (overFlash && !mystery ? "#5E1640" : C.night) : mystery ? C.night : perfect ? GOLD : bad ? RED : close ? ACCENT : C.night;
  const light = done && !mystery && (perfect || bad || close);
  const scale = Math.max(targetMs * 1.5, final * 1.08, 1);

  const verdict = mystery
    ? "Cible révélée à la fin de la manche"
    : perfect
      ? ""
      : busted
        ? "Dépassé ! Dernier de la manche"
        : close
          ? "Presque !"
          : gap <= 700
            ? "Pas mal du tout"
            : gap <= 1500
              ? "Bof…"
              : attempt.over
                ? "Beaucoup trop long"
                : "Beaucoup trop pressé";

  return (
    <StickerScreen bg={bg} light={light} center>
      {perfect && done && (
        <>
          <div className="pointer-events-none fixed inset-0 z-20" style={{ background: "#fff", animation: "pp-flash .6s ease-out forwards" }} />
          <ConfettiBurst count={90} />
        </>
      )}
      <style>{KEYFRAMES}</style>
      <Mascot
        size={92}
        color={colorForIndex(attempt.pi)}
        mood={!done ? "thinking" : mystery ? "wink" : perfect ? "mindblown" : bad ? "dead" : close ? "fire" : "happy"}
        arms
        shadow={false}
      />
      <p className="mt-2 text-[26px] leading-none" style={DISPLAY}>{attempt.name}</p>
      {!mystery && <p className="mt-1.5 text-[16px] font-bold">Cible : {num(target)} s</p>}
      <div className={`mt-3 px-6 py-2 ${!done && shown === 0 ? "pp-wait" : ""}`} style={{ ...sticker("#fff", { radius: 26, shadow: 6 }), transform: "rotate(-2deg)" }}>
        <p className="tabular-nums leading-none" style={{ ...DISPLAY, fontSize: "min(22vw, 6.5rem)", color: !done && overFlash && !mystery ? RED : INK }}>
          {(shown / 1000).toFixed(2).replace(".", ",")}
        </p>
      </div>

      {/* Jauge : progression du temps vers la cible */}
      {!mystery && (
        <div className="relative mt-6 h-5 w-full max-w-xs" style={sticker("#fff", { radius: 999, shadow: 0, border: 2.5 })}>
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (shown / scale) * 100)}%`, background: overFlash ? RED : ACCENT }} />
          <div className="absolute -top-2 bottom-[-8px] w-[4px] rounded" style={{ left: `${(targetMs / scale) * 100}%`, background: INK }} />
        </div>
      )}

      <div className="mt-6 flex min-h-[110px] flex-col items-center text-center">
        {done && perfect && (
          <p className="leading-none" style={{ ...DISPLAY, fontSize: 60, color: "#fff", textShadow: `5px 5px 0 ${INK}`, WebkitTextStroke: `2.5px ${INK}`, animation: "pp-pop .45s ease-out, pp-shake .6s .45s" }}>
            PILE POIL !
          </p>
        )}
        {done && !mystery && (
          <p className="zk-rise mt-2 text-[28px] leading-none" style={DISPLAY}>
            {fmtDelta(final, target)}{perfect ? " · +1 point bonus" : ""}
          </p>
        )}
        {done && verdict && (
          <p className="zk-rise mt-2 text-[18px] font-bold" style={{ animationDelay: ".1s" }}>{verdict}</p>
        )}
      </div>

      <div className="mt-4 w-full" style={{ opacity: done ? 1 : 0, transition: "opacity .3s" }}>
        <StickerBtn big bg={light ? INK : ACCENT} color={light ? "#fff" : INK} disabled={!done} onClick={onNext}>{nextLabel}</StickerBtn>
      </div>
    </StickerScreen>
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
    if (sound) fxDrum();
    const iv = setInterval(() => setRollShown(3 + Math.random() * 17), 70);
    const to = setTimeout(() => {
      clearInterval(iv);
      setRolled(true);
      vibrate([60, 40, 120]);
      if (sound) fxReveal();
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
      <Screen>
        <style>{KEYFRAMES}</style>
        <p className="text-[24px]" style={DISPLAY}>La cible mystère était…</p>
        <div className="mt-4 px-7 py-3" style={{ ...sticker(GOLD, { radius: 28, shadow: 6 }), transform: "rotate(-2deg)" }}>
          <p className="tabular-nums leading-none" style={{ ...DISPLAY, fontSize: 92 }}>{rollShown.toFixed(1).replace(".", ",")}</p>
        </div>
      </Screen>
    );
  }

  return (
    <StickerScreen bg={C.night}>
      <style>{KEYFRAMES}</style>
      <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker("#fff", { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
        Manche {round.n}/{totalRounds} · {mystery ? "la cible était" : "cible"} {num(round.target)} s
      </span>
      <h2 className="mt-3 text-[48px] leading-none" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>Résultats</h2>

      <div className="mt-4 w-full space-y-2">
        {ranked.map((a, i) => {
          const isWin = i === 0 && players.length > 1;
          const isLose = loser === a;
          const perfect = isPerfect(a, round.target, mode);
          const busted = mode === "no-over" && a.over;
          return (
            <div
              key={a.pi}
              className="flex items-center gap-3 px-3 py-2"
              style={{ ...sticker(isWin ? GOLD : isLose ? RED : C.cream, { radius: 18, shadow: 3 }), animation: `pp-rise .35s ${i * 0.08}s ease-out both` }}
            >
              <span className="grid w-7 place-items-center text-[20px]" style={DISPLAY}>
                {isWin ? <Crown size={20} strokeWidth={2.8} aria-hidden /> : isLose ? <CupSoda size={18} strokeWidth={2.8} aria-hidden /> : `${i + 1}`}
              </span>
              <MascotAvatar color={colorForIndex(a.pi)} size={34} mood={isWin ? "cool" : isLose ? "dead" : "happy"} border={false} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[18px] leading-tight" style={DISPLAY}>{a.name}</span>
                <span className="block text-[14px] font-semibold">
                  {fmtS(a.elapsedMs)}
                  {busted ? " · dépassé" : ""}
                  {perfect ? " · pile poil, +1" : ""}
                </span>
              </span>
              <span className="shrink-0 text-[18px] tabular-nums" style={DISPLAY}>{fmtDelta(a.elapsedMs, round.target)}</span>
            </div>
          );
        })}
      </div>

      {perfects.length > 0 && (
        <StickerCard bg={GOLD} radius={18} shadow={3} tilt={-1} className="mt-4 px-4 py-2.5 text-center text-[16px] font-bold">
          PILE POIL pour {perfects.map((a) => a.name).join(", ")} : {perfects.length > 1 ? "chacun distribue" : "distribue"} 1 gorgée ou un gage !
        </StickerCard>
      )}

      {/* Le perdant, mis en avant */}
      {loser && (
        <StickerCard bg={RED} radius={24} shadow={5} tilt={1} className="mt-5 p-4 text-center" style={{ animation: `pp-pop .45s ${ranked.length * 0.08 + 0.1}s ease-out both` }}>
          <p className="text-[26px] leading-tight" style={DISPLAY}>{loser.name} prend une peine</p>
          <p className="mt-1 text-[16px] font-bold">
            {sips} gorgée{sips > 1 ? "s" : ""} de zinzin ou le gage :
          </p>
          <p className="mt-2 px-3 py-2 text-[17px] font-semibold leading-snug" style={sticker("#fff", { radius: 16, shadow: 0, border: 2.5 })}>
            {gage}
          </p>
          <div className="mt-3 flex justify-center">
            <RerollButton onClick={() => setGage((g) => rnd(GAGES.filter((x) => x !== g)))} label="Pas fou ? Un autre gage" bg={C.yellow} />
          </div>
        </StickerCard>
      )}

      {/* Scores cumulés */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {players
          .map((name, i) => ({ name, i, pts: points[i] ?? 0 }))
          .sort((a, b) => b.pts - a.pts)
          .map((s) => (
            <span key={s.i} className="px-3 py-1.5 text-[15px] font-bold" style={sticker("#fff", { radius: 999, shadow: 2, border: 2.5 })}>
              {s.name} · {s.pts} pt{s.pts > 1 ? "s" : ""}
            </span>
          ))}
      </div>

      <div className="mt-auto flex w-full flex-col items-center pt-7">
        <StickerBtn big bg={ACCENT} onClick={onNext}>{last ? "Classement final" : `Manche ${round.n + 1}`}</StickerBtn>
        {!last && <SoftLink onClick={onFinish}>Terminer la partie</SoftLink>}
      </div>
    </StickerScreen>
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
  // Fanfare à l'arrivée sur le podium
  useEffect(() => {
    fxPerfect();
  }, []);

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
    <StickerScreen bg={C.night}>
      <style>{KEYFRAMES}</style>
      <ConfettiBurst count={70} />
      <span className="px-3.5 py-1 text-[17px]" style={{ ...sticker(GOLD, { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, transform: "rotate(-3deg)" }}>
        Champion·ne du chrono
      </span>
      <div className="mt-3" style={{ animation: "pp-pop .6s ease-out" }}>
        <Mascot size={104} color={colorForIndex(champ?.i ?? 0)} mood="cool" arms crown shadow={false} />
      </div>
      <h2 className="mt-1 max-w-full break-words text-center text-[clamp(40px,12vw,56px)] leading-[0.95]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>{champ?.name ?? "—"}</h2>
      <p className="mt-2 text-[16px] font-bold">
        {champ?.pts ?? 0} point{(champ?.pts ?? 0) > 1 ? "s" : ""}
        {standings[1] && standings[1].pts === champ?.pts ? " · départagé au plus petit écart cumulé" : ""}
      </p>

      <div className="mt-4 w-full space-y-2">
        {standings.map((s, i) => (
          <div key={s.i} className="flex items-center gap-3 px-3 py-2" style={{ ...sticker(i === 0 ? GOLD : C.cream, { radius: 18, shadow: 3 }), animation: `pp-rise .35s ${i * 0.07}s ease-out both` }}>
            <span className="w-6 text-center text-[20px]" style={DISPLAY}>{i + 1}</span>
            <MascotAvatar color={colorForIndex(s.i)} size={32} mood={i === 0 ? "cool" : "happy"} border={false} />
            <span className="min-w-0 flex-1 truncate text-[18px]" style={DISPLAY}>{s.name}</span>
            <span className="text-[18px]" style={DISPLAY}>{s.pts} pt{s.pts > 1 ? "s" : ""}</span>
          </div>
        ))}
      </div>

      {best && worst && (
        <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left">
          <div className="p-3" style={{ ...sticker(ACCENT, { radius: 18, shadow: 4 }), transform: "rotate(-1.5deg)" }}>
            <p className="text-[14px] font-bold">Meilleur tir</p>
            <p className="truncate text-[19px] leading-tight" style={DISPLAY}>{best.name}</p>
            <p className="text-[13px] font-semibold">à {(best.gap / 1000).toFixed(2).replace(".", ",")} s de {num(best.target)} s</p>
          </div>
          <div className="p-3" style={{ ...sticker(RED, { radius: 18, shadow: 4 }), transform: "rotate(1.5deg)" }}>
            <p className="text-[14px] font-bold">Le plus à côté</p>
            <p className="truncate text-[19px] leading-tight" style={DISPLAY}>{worst.name}</p>
            <p className="text-[13px] font-semibold">{fmtS(worst.elapsedMs)} pour {num(worst.target)} s</p>
          </div>
        </div>
      )}

      <div className="mt-auto flex w-full flex-col items-center pt-7">
        <StickerBtn big bg={ACCENT} onClick={onReplay}>Rejouer</StickerBtn>
        <div className="mt-3 grid w-full grid-cols-2 gap-3">
          <StickerBtn bg={C.cream} onClick={onNewPlayers}>Les joueurs</StickerBtn>
          {onExit ? <StickerBtn bg={INK} color="#fff" onClick={onExit}>Quitter</StickerBtn> : <span />}
        </div>
        <div className="mt-4">
          <IdeaButton game="Pile Poil" kind="défi" bg={C.cream} />
        </div>
      </div>
    </StickerScreen>
  );
}
