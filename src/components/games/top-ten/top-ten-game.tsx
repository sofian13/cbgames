"use client";

import { useCallback, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { MascotAvatar } from "@/components/Mascot";
import { ModeSelect, PlayersSetup, PassScreen, colorForIndex, type GameMode } from "@/components/games/local-kit";

// ── Types ─────────────────────────────────────────────────
interface TopTenPlayerState {
  id: string;
  name: string;
  score: number;
}

interface ThemeState {
  theme: string;
  low: string;
  high: string;
}

interface RoundResult {
  correct: number;
  total: number;
  perfect: boolean;
  points: number;
}

interface TopTenState {
  phase: "waiting" | "intro" | "answering" | "ordering" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  theme: ThemeState | null;
  numberedOrder: string[];
  submittedCount: number;
  submittedIds: string[] | null;
  trueOrder: string[] | null;
  revealNumbers: Record<string, number> | null;
  roundResults: Record<string, RoundResult> | null;
  players: TopTenPlayerState[];
  myNumber: number | null;
  iSubmitted: boolean;
  myGuess: string[] | null;
}

const ACCENT = "#ff5a8a";

// ── Thèmes 18+ (mode local) ───────────────────────────────
const LOCAL_THEMES: ThemeState[] = [
  { theme: "Un endroit où tu ferais l'amour", low: "Dans ton lit, tranquille", high: "En public, avec le risque de se faire prendre" },
  { theme: "Un message coquin à envoyer à ton crush", low: "« Tu me manques... »", high: "Un truc carrément explicite" },
  { theme: "Une tenue pour une soirée", low: "Jean - t-shirt classique", high: "Quasi rien, tout est suggéré" },
  { theme: "Un fantasme à avouer à voix haute", low: "Un câlin sous la couette", high: "Le truc que t'oserais jamais dire" },
  { theme: "Niveau d'alcool un samedi soir", low: "Un verre de vin", high: "Black-out total" },
  { theme: "Un truc qui t'excite", low: "Un regard appuyé", high: "Quelque chose de carrément chaud" },
  { theme: "Une chose à faire pour un date parfait", low: "Dîner aux chandelles", high: "On saute l'étape dîner" },
  { theme: "Un endroit pour un premier baiser", low: "Devant sa porte, timidement", high: "Sur la piste, devant tout le monde" },
  { theme: "Le degré d'audace d'un sexto", low: "Un emoji cœur", high: "Photo et description détaillée" },
  { theme: "Une chose qu'on pourrait te demander dans une chambre", low: "Un massage du dos", high: "Un truc franchement osé" },
  { theme: "Ce que tu fais quand t'es bourré", low: "Je deviens très câlin", high: "Un truc dont j'aurai honte demain" },
  { theme: "Le niveau d'un strip-tease", low: "J'enlève ma veste", high: "Je garde plus rien" },
  { theme: "Une partie du corps à embrasser", low: "La joue", high: "Un endroit très intime" },
  { theme: "Ce que tu cherches sur une appli de rencontre", low: "Une vraie histoire", high: "Un plan d'un soir, ce soir" },
  { theme: "Le niveau d'un gage de soirée", low: "Imiter un animal", high: "Embrasser la personne à ta gauche" },
  { theme: "Un lieu insolite pour le faire", low: "Le canapé du salon", high: "Les toilettes d'une boîte" },
  { theme: "Ce que tu postes sur les réseaux", low: "Un coucher de soleil", high: "Une photo qui fait monter la température" },
  { theme: "Une chose à tester en couple", low: "Un resto romantique", high: "Un sextoy ou un accessoire" },
  { theme: "Ce que tu réponds à « on monte chez moi ? »", low: "« Une autre fois »", high: "« J'attendais que ça »" },
  { theme: "Une activité de couple un dimanche", low: "Brunch et série", high: "On sort pas du lit" },
  { theme: "Une phrase à murmurer à l'oreille", low: "« T'es mignon(ne) »", high: "Un truc qui ferait rougir n'importe qui" },
  { theme: "Le degré d'une danse en boîte", low: "Je bouge gentiment", high: "Collé-serré très rapproché" },
  { theme: "Une audace en vacances", low: "Bronzer sur la plage", high: "Se baigner sans maillot la nuit" },
  { theme: "Le niveau d'un texto à 3h du matin", low: "« Tu dors ? »", high: "« Viens, je suis seul(e) »" },
];

// Score un classement (paires adjacentes bien ordonnées soft→hard)
function scorePairs(orderedNums: number[]): { correct: number; total: number; perfect: boolean; points: number } {
  const total = Math.max(0, orderedNums.length - 1);
  let correct = 0;
  for (let i = 0; i < orderedNums.length - 1; i++) {
    if (orderedNums[i] < orderedNums[i + 1]) correct++;
  }
  const perfect = total > 0 && correct === total;
  return { correct, total, perfect, points: correct * 2 + (perfect ? 5 : 0) };
}

// ── WRAPPER : le joueur choisit local ou online ───────────
export default function TopTenGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  if (mode === null) {
    return (
      <ModeSelect emoji="🔥" name="Top Ten"
        tagline="Un thème osé, un numéro secret de 1 à 10. Chacun joue l'intensité… puis tout le monde classe la table du plus soft au plus hard. (18+)"
        onPick={setMode} />
    );
  }
  if (mode === "local") return <TopTenLocal onReturnToLobby={props.onReturnToLobby} />;
  return <TopTenOnline {...props} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (pass-and-play — chacun voit son numéro, puis chacun classe)
// ══════════════════════════════════════════════════════════
function TopTenLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  type Phase = "setup" | "pass-number" | "show-number" | "answer" | "pass-rank" | "rank" | "reveal" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [themes] = useState(() => [...LOCAL_THEMES].sort(() => Math.random() - 0.5));
  const [numbers, setNumbers] = useState<Record<number, number>>({}); // playerIdx -> numéro
  const [passOrder, setPassOrder] = useState<number[]>([]); // ordre de passage (mélangé)
  const [stepIdx, setStepIdx] = useState(0); // index dans passOrder (voir numéro / classer)
  const [guesses, setGuesses] = useState<Record<number, number[]>>({}); // playerIdx -> classement (player indices)
  const [results, setResults] = useState<Record<number, RoundResult>>({});

  const total = players.length;
  const theme = themes[(round - 1) % themes.length] ?? null;
  const totalRounds = Math.min(8, Math.max(4, total));

  const startRound = (r: number, names = players) => {
    const all = names.map((_, i) => i);
    const pool = Array.from({ length: 10 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const nums: Record<number, number> = {};
    all.forEach((idx, k) => { nums[idx] = pool[k]; });
    setNumbers(nums);
    setPassOrder([...all].sort(() => Math.random() - 0.5));
    setStepIdx(0);
    setGuesses({});
    setResults({});
    setRound(r);
    setPhase("pass-number");
  };

  const begin = (names: string[]) => {
    setPlayers(names); setScores(names.map(() => 0));
    startRound(1, names);
  };

  // Quand tout le monde a classé → score + reveal
  const finishRanking = (allGuesses: Record<number, number[]>) => {
    const res: Record<number, RoundResult> = {};
    const gained: number[] = players.map(() => 0);
    players.forEach((_, idx) => {
      const guess = allGuesses[idx] ?? passOrder;
      const nums = guess.map((pIdx) => numbers[pIdx]);
      const r = scorePairs(nums);
      res[idx] = r;
      gained[idx] = r.points;
    });
    setResults(res);
    setScores((s) => s.map((v, i) => v + gained[i]));
    setPhase("reveal");
  };

  if (phase === "setup") {
    return <PlayersSetup emoji="🔥" name="Top Ten" min={3} max={10} accent="#ff5a8a" onStart={begin} onBack={onReturnToLobby} />;
  }
  if (phase === "pass-number") {
    const idx = passOrder[stepIdx];
    return <PassScreen toName={players[idx]} colorIndex={idx} accent="#ff5a8a"
      hint="Toi seul : tu vas voir ton numéro secret (1 = soft, 10 = hard)." onReady={() => setPhase("show-number")} />;
  }
  if (phase === "show-number") {
    const idx = passOrder[stepIdx];
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
        style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}30, transparent 45%), #0E0828` }}>
        <p className="af-eyebrow mb-2">{players[idx]} · ton numéro</p>
        <NumberCard myNumber={numbers[idx]} />
        <button onClick={() => {
          if (stepIdx < passOrder.length - 1) { setStepIdx(stepIdx + 1); setPhase("pass-number"); }
          else { setStepIdx(0); setPhase("answer"); }
        }} className="af-btn af-btn-primary mt-8 w-full max-w-xs">J&apos;ai vu — cacher</button>
      </div>
    );
  }
  if (phase === "answer") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center p-5 text-white"
        style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}26, transparent 45%), #0E0828` }}>
        <p className="af-eyebrow mt-3">Manche {round}/{totalRounds}</p>
        <div className="mt-4 w-full max-w-md rounded-3xl border p-6" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)" }}>
          <p className="af-eyebrow mb-2 text-center" style={{ color: ACCENT }}>Thème 18+</p>
          <p className="cb-display-sm text-center">{theme?.theme}</p>
          <div className="mt-4 flex gap-2 text-center text-xs">
            <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2"><b className="text-emerald-400">1</b><br/>{theme?.low}</div>
            <div className="flex-1 rounded-2xl border p-2" style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}><b style={{ color: ACCENT }}>10</b><br/>{theme?.high}</div>
          </div>
        </div>
        <p className="mt-5 max-w-xs text-center text-sm" style={{ color: "var(--text-dim)" }}>
          Chacun annonce sa réponse <b>à voix haute</b> selon l&apos;intensité de son numéro. Écoutez bien : ensuite <b>chacun</b> classera la table à son tour.
        </p>
        <button onClick={() => { setStepIdx(0); setPhase("pass-rank"); }} className="af-btn af-btn-primary mt-6 w-full max-w-md">Tout le monde a parlé → classer</button>
      </div>
    );
  }
  if (phase === "pass-rank") {
    const idx = passOrder[stepIdx];
    return <PassScreen toName={players[idx]} colorIndex={idx} accent="#ff5a8a"
      buttonLabel="C'est moi, je classe" hint="Personne ne regarde ! Classe la table du plus soft au plus hard, selon ce que t'as entendu." onReady={() => setPhase("rank")} />;
  }
  if (phase === "rank") {
    const ranker = passOrder[stepIdx];
    return (
      <OrderingBoard
        key={`${round}-${stepIdx}`}
        ids={passOrder.map(String)}
        nameOf={(id) => players[+id]}
        rankerName={players[ranker]}
        round={round} total={totalRounds}
        onSubmit={(o) => {
          const g = o.map(Number);
          const next = { ...guesses, [ranker]: g };
          setGuesses(next);
          if (stepIdx < passOrder.length - 1) { setStepIdx(stepIdx + 1); setPhase("pass-rank"); }
          else finishRanking(next);
        }} />
    );
  }
  if (phase === "reveal") {
    // Vrai classement (soft → hard)
    const trueOrder = [...passOrder].sort((a, b) => numbers[a] - numbers[b]);
    const perRound = players
      .map((name, i) => ({ name, i, ...results[i] }))
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    return (
      <div className="flex min-h-[100svh] flex-col items-center overflow-y-auto p-5 text-white"
        style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}26, transparent 45%), #0E0828` }}>
        <p className="af-eyebrow mt-3">Manche {round}/{totalRounds} — Résultat</p>
        <p className="cb-display-sm mt-1 mb-3">Le vrai classement</p>
        <div className="w-full max-w-md space-y-1.5">
          {trueOrder.map((idx, i) => {
            const num = numbers[idx];
            return (
              <div key={idx} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5">
                <span className="cb-mono w-5 text-white/40">{i + 1}.</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full font-mono font-bold text-white" style={{ background: ACCENT, opacity: 0.3 + (num / 10) * 0.7 }}>{num}</span>
                <span className="flex-1 font-semibold">{players[idx]}</span>
              </div>
            );
          })}
        </div>

        <p className="af-eyebrow mt-6 mb-2" style={{ color: ACCENT }}>Précision de chacun</p>
        <div className="w-full max-w-md space-y-2">
          {perRound.map((p) => (
            <div key={p.i} className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", p.perfect ? "border-emerald-500/40 bg-emerald-500/[0.1]" : "border-white/10 bg-black/30")}>
              <MascotAvatar color={colorForIndex(p.i)} size={30} mood={p.perfect ? "wink" : "happy"} />
              <span className="flex-1 font-semibold">{p.name}</span>
              <span className="cb-mono text-sm text-white/60">{p.correct}/{p.total}{p.perfect ? " 🎉" : ""}</span>
              <span className="cb-mono font-bold" style={{ color: ACCENT }}>+{p.points}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { if (round >= totalRounds) setPhase("over"); else startRound(round + 1); }}
          className="af-btn af-btn-primary mt-6 mb-4 w-full max-w-md">{round >= totalRounds ? "Voir les scores" : "Manche suivante"}</button>
      </div>
    );
  }
  // over
  const ranking = players.map((name, i) => ({ name, score: scores[i], i })).sort((a, b) => b.score - a.score);
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
      style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}2e, transparent 45%), #0E0828` }}>
      <p className="af-eyebrow" style={{ color: ACCENT }}>Partie terminée</p>
      <h2 className="cb-display-lg mt-1 mb-5">🔥 Meilleur flair</h2>
      <div className="w-full max-w-sm space-y-2">
        {ranking.map((p, idx) => (
          <div key={p.i} className="flex items-center justify-between rounded-2xl border p-4"
            style={{ background: idx === 0 ? `${ACCENT}22` : "rgba(255,255,255,0.04)", borderColor: idx === 0 ? `${ACCENT}55` : "var(--line-soft)" }}>
            <div className="flex items-center gap-3">
              <span className="cb-mono w-7 font-bold" style={{ color: idx === 0 ? ACCENT : "var(--text-muted)" }}>#{idx + 1}</span>
              <MascotAvatar color={colorForIndex(p.i)} size={34} mood={idx === 0 ? "wink" : "happy"} />
              <span className="font-bold">{p.name}</span>
            </div>
            <span className="cb-mono font-bold" style={{ color: idx === 0 ? ACCENT : "#fff" }}>{p.score}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <button onClick={() => setPhase("setup")} className="af-btn af-btn-ghost">Nouvelle partie</button>
        {onReturnToLobby && <button onClick={onReturnToLobby} className="af-btn af-btn-primary">Lobby</button>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MODE ONLINE (multi-appareils) — tout le monde classe
// ══════════════════════════════════════════════════════════
function TopTenOnline({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "top-ten", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as TopTenState;

  const nameOf = useCallback(
    (id: string) => state?.players?.find((p) => p.id === id)?.name ?? "?",
    [state?.players]
  );

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return (
      <Centered>
        <div className="text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-sm"
            style={{ boxShadow: `0 0 40px ${ACCENT}22` }}
          >
            <span className="text-4xl">🔥</span>
          </div>
          <p className="text-white/40 animate-pulse font-sans text-lg">
            Distribution des num&eacute;ros...
          </p>
        </div>
      </Centered>
    );
  }

  // ── INTRO ───────────────────────────────────────────────
  if (state.phase === "intro") {
    return (
      <Centered>
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
          Manche {state.round} / {state.totalRounds}
        </span>
        <p className="text-5xl mb-6">🔥</p>
        <p className="text-2xl font-serif font-semibold text-white/90 mb-3 text-center px-6" style={{ textShadow: `0 0 40px ${ACCENT}33` }}>
          Chacun reçoit un numéro secret
        </p>
        <p className="text-xs text-white/30 font-sans max-w-xs text-center animate-pulse">
          De 1 (soft) à 10 (hard). Joue l&apos;intensité… puis tout le monde classera la table.
        </p>
      </Centered>
    );
  }

  // ── ANSWERING ───────────────────────────────────────────
  if (state.phase === "answering") {
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 md:p-6"
        style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}14, transparent 45%), #060606` }}
      >
        <Header round={state.round} total={state.totalRounds} />

        {/* Theme card */}
        <div
          className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 mt-4 mb-6"
          style={{ boxShadow: `0 0 40px ${ACCENT}1a` }}
        >
          <p className="text-[10px] text-white/30 font-sans uppercase tracking-[0.25em] mb-3 text-center">
            Th&egrave;me 18+
          </p>
          <p className="text-2xl font-serif font-semibold text-white/95 text-center leading-snug">
            {state.theme?.theme}
          </p>
          <div className="mt-5 flex items-stretch gap-2 text-center">
            <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
              <p className="text-emerald-400 font-mono font-bold text-lg">1</p>
              <p className="text-[11px] text-white/45 font-sans leading-tight mt-1">{state.theme?.low}</p>
            </div>
            <div className="flex items-center text-white/20 text-xs font-sans">vers</div>
            <div className="flex-1 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5">
              <p className="font-mono font-bold text-lg" style={{ color: ACCENT }}>10</p>
              <p className="text-[11px] text-white/45 font-sans leading-tight mt-1">{state.theme?.high}</p>
            </div>
          </div>
        </div>

        {/* My secret number */}
        <NumberCard myNumber={state.myNumber} />

        <button
          onClick={() => sendAction({ action: "start-ordering" })}
          className="mt-7 w-full max-w-md py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}
        >
          Tout le monde a parlé → Classer
        </button>
        <p className="text-[11px] text-white/25 font-sans mt-3 text-center max-w-xs">
          Quand chacun a donné sa réponse à voix haute, lance le classement (n&apos;importe qui peut le faire).
        </p>
      </div>
    );
  }

  // ── ORDERING (tout le monde classe) ─────────────────────
  if (state.phase === "ordering") {
    if (state.iSubmitted) {
      return (
        <Centered>
          <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-6">
            Manche {state.round} / {state.totalRounds}
          </span>
          <p className="text-3xl mb-4">✅</p>
          <p className="text-2xl font-serif font-semibold text-white/90 mb-3 text-center px-6">
            Classement envoyé
          </p>
          <p className="text-sm text-white/40 font-sans animate-pulse">
            {state.submittedCount}/{state.players.length} ont validé…
          </p>
        </Centered>
      );
    }
    return (
      <OrderingBoard
        key={`${state.round}-${state.numberedOrder.join(",")}`}
        ids={state.numberedOrder}
        nameOf={nameOf}
        myId={playerId}
        onSubmit={(order) => sendAction({ action: "submit-order", order })}
        round={state.round}
        total={state.totalRounds}
        submittedCount={state.submittedCount}
        playerCount={state.players.length}
      />
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const trueOrder = state.trueOrder ?? [];
    const myResult = state.roundResults?.[playerId];
    const ranking = [...(state.players ?? [])]
      .map((p) => ({ ...p, res: state.roundResults?.[p.id] }))
      .sort((a, b) => (b.res?.points ?? 0) - (a.res?.points ?? 0));
    return (
      <div
        className="flex flex-1 flex-col items-center p-5 md:p-6 overflow-y-auto"
        style={{
          background: myResult?.perfect
            ? `radial-gradient(circle at 50% 20%, ${ACCENT}22, transparent 50%), #060606`
            : "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.04), transparent 45%), #060606",
        }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-3 mt-1">
          Manche {state.round} / {state.totalRounds} — R&eacute;sultat
        </span>

        <p
          className={cn("text-3xl font-serif font-semibold mb-1 text-center", myResult?.perfect ? "text-white/95" : "text-white/85")}
          style={myResult?.perfect ? { textShadow: `0 0 40px ${ACCENT}55` } : undefined}
        >
          {myResult?.perfect
            ? "🎉 Classement parfait !"
            : myResult
            ? `Toi : ${myResult.correct}/${myResult.total} bien placés`
            : "Résultat"}
        </p>
        <p className="text-xs text-white/35 font-sans mb-4 text-center">Le vrai classement (soft → hard)</p>

        {/* Vrai classement */}
        <div className="w-full max-w-md space-y-1.5 mb-5">
          {trueOrder.map((id, i) => {
            const num = state.revealNumbers?.[id] ?? 0;
            return (
              <div key={id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-xs text-white/30 font-mono w-5">{i + 1}.</span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono font-bold text-sm text-white"
                  style={{ background: ACCENT, opacity: 0.25 + (num / 10) * 0.75 }}
                >
                  {num}
                </span>
                <span className="text-sm font-sans font-semibold text-white/85 flex-1 truncate">
                  {nameOf(id)}
                  {id === playerId && <span className="text-white/35"> (toi)</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Précision de chacun */}
        <p className="text-[10px] text-white/30 font-sans uppercase tracking-[0.25em] mb-2" style={{ color: `${ACCENT}cc` }}>
          Précision de chacun
        </p>
        <div className="w-full max-w-md space-y-2">
          {ranking.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-sm",
                p.res?.perfect ? "border-emerald-500/35 bg-emerald-500/[0.09]" : "border-white/10 bg-black/30"
              )}
            >
              <span className="text-sm font-sans font-semibold text-white/85 flex-1 truncate">
                {p.name}
                {p.id === playerId && <span className="text-white/35"> (toi)</span>}
              </span>
              <span className="text-xs font-mono text-white/50">
                {p.res ? `${p.res.correct}/${p.res.total}` : "—"}{p.res?.perfect ? " 🎉" : ""}
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: ACCENT }}>+{p.res?.points ?? 0}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-white/25 font-sans mt-5 animate-pulse">Manche suivante...</p>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    const sorted = [...(state.players ?? [])].sort((a, b) => b.score - a.score);
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}18, transparent 45%), #060606` }}
      >
        <span className="text-xs text-white/25 font-sans uppercase tracking-[0.2em] mb-2">Partie termin&eacute;e</span>
        <p className="text-4xl mb-6">🔥</p>
        <div className="w-full max-w-sm space-y-2.5">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between rounded-3xl border p-4 backdrop-blur-sm",
                i === 0 ? "border-rose-500/35 bg-rose-500/10" : "border-white/10 bg-black/30"
              )}
              style={i === 0 ? { boxShadow: `0 0 25px ${ACCENT}33` } : undefined}
            >
              <div className="flex items-center gap-3">
                <span className={cn("text-xl font-mono font-bold w-8", i === 0 ? "text-rose-400" : "text-white/25")}>
                  #{i + 1}
                </span>
                <span className={cn("text-sm font-sans font-semibold", i === 0 ? "text-white/90" : "text-white/45")}>
                  {p.name}
                  {p.id === playerId && " (toi)"}
                </span>
              </div>
              <span
                className={cn("text-xl font-mono font-bold", i === 0 ? "text-rose-400" : "text-white/40")}
                style={i === 0 ? { textShadow: `0 0 15px ${ACCENT}55` } : undefined}
              >
                {p.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── FALLBACK ────────────────────────────────────────────
  return (
    <Centered>
      {error ? (
        <p className="text-sm text-red-400 font-sans font-semibold">{error}</p>
      ) : (
        <p className="text-white/40 animate-pulse font-sans text-lg">Chargement...</p>
      )}
    </Centered>
  );
}

// ── Sub-components ────────────────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center p-6"
      style={{ background: `radial-gradient(circle at 50% 25%, ${ACCENT}10, transparent 45%), #060606` }}
    >
      {children}
    </div>
  );
}

function Header({ round, total }: { round: number; total: number }) {
  return (
    <div className="flex w-full max-w-md items-center justify-between">
      <span className="text-xs text-white/25 font-sans tracking-wide">
        Manche {round}/{total}
      </span>
      <span
        className="text-[10px] px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider"
        style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}
      >
        Th&egrave;me 18+
      </span>
    </div>
  );
}

function NumberCard({ myNumber }: { myNumber: number | null }) {
  return (
    <div className="flex flex-col items-center mt-2">
      <p className="text-xs text-white/35 font-sans mb-3 uppercase tracking-[0.15em]">Ton num&eacute;ro secret</p>
      <div
        className="flex h-32 w-32 items-center justify-center rounded-3xl border backdrop-blur-sm"
        style={{
          borderColor: `${ACCENT}55`,
          background: "rgba(0,0,0,0.4)",
          boxShadow: `0 0 50px ${ACCENT}33`,
        }}
      >
        <span className="text-7xl font-serif font-bold text-white/95" style={{ textShadow: `0 0 30px ${ACCENT}66` }}>
          {myNumber ?? "?"}
        </span>
      </div>
      <p className="text-sm text-white/45 font-sans mt-5 max-w-xs text-center leading-relaxed">
        Donne une r&eacute;ponse <span className="text-white/80">à voix haute</span> qui colle à
        l&apos;intensit&eacute; de ton num&eacute;ro. Ni trop, ni trop peu — les autres devront te ranger au bon endroit !
      </p>
    </div>
  );
}

// ── Drag & drop reorder board (touch + mouse) ─────────────
function OrderingBoard({
  ids,
  nameOf,
  onSubmit,
  round,
  total,
  myId,
  rankerName,
  submittedCount,
  playerCount,
}: {
  ids: string[];
  nameOf: (id: string) => string;
  onSubmit: (order: string[]) => void;
  round: number;
  total: number;
  myId?: string;
  rankerName?: string;
  submittedCount?: number;
  playerCount?: number;
}) {
  const [order, setOrder] = useState<string[]>(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handlePointerDown = (id: string) => (e: React.PointerEvent) => {
    if (submitted) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    e.preventDefault();
    const y = e.clientY;
    // Find which item we're hovering over
    let targetId: string | null = null;
    for (const id of order) {
      const el = itemRefs.current.get(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        targetId = id;
        break;
      }
    }
    if (!targetId || targetId === dragId) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragId);
      const to = prev.indexOf(targetId!);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
  };

  const handlePointerUp = () => setDragId(null);

  const move = (id: string, dir: -1 | 1) => {
    if (submitted) return;
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(order);
  };

  return (
    <div
      className="flex flex-1 flex-col p-5 md:p-6"
      style={{ background: `radial-gradient(circle at 50% 15%, ${ACCENT}14, transparent 45%), #060606` }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/25 font-sans tracking-wide">Manche {round}/{total}</span>
        <span
          className="text-[10px] px-3 py-1 rounded-full border font-sans font-semibold uppercase tracking-wider"
          style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}
        >
          {rankerName ? rankerName : "Ton classement"}
        </span>
      </div>
      <p className="text-center text-lg font-serif font-semibold text-white/90 mt-2 mb-1">
        Classe-les du plus soft au plus hard
      </p>
      <div className="flex items-center justify-between max-w-md w-full mx-auto px-1 mb-3">
        <span className="text-[10px] text-emerald-400 font-sans uppercase tracking-wider">↑ 1 · Soft</span>
        <span className="text-[10px] font-sans uppercase tracking-wider" style={{ color: ACCENT }}>10 · Hard ↓</span>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto space-y-2 select-none" style={{ touchAction: "none" }}>
        {order.map((id, i) => {
          const isDragging = id === dragId;
          const isMe = myId != null && id === myId;
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) itemRefs.current.set(id, el);
                else itemRefs.current.delete(id);
              }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3 py-3.5 backdrop-blur-sm transition-shadow",
                isDragging
                  ? "border-white/40 bg-black/60 shadow-2xl scale-[1.02]"
                  : isMe
                  ? "border-white/20 bg-white/[0.06]"
                  : "border-white/10 bg-black/35"
              )}
              style={isDragging ? { boxShadow: `0 0 30px ${ACCENT}44` } : undefined}
            >
              <span className="text-sm font-mono font-bold w-6 text-center text-white/30">{i + 1}</span>
              <div
                onPointerDown={handlePointerDown(id)}
                className="flex items-center gap-1 text-white/30 cursor-grab active:cursor-grabbing touch-none"
                aria-label="Glisser pour réordonner"
              >
                <DotsIcon />
              </div>
              <span className="flex-1 text-sm font-sans font-semibold text-white/90 truncate">
                {nameOf(id)}
                {isMe && <span className="text-white/35"> (toi)</span>}
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => move(id, -1)}
                  disabled={i === 0 || submitted}
                  className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 text-white/40 disabled:opacity-20 hover:bg-white/10 active:scale-90"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(id, 1)}
                  disabled={i === order.length - 1 || submitted}
                  className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 text-white/40 disabled:opacity-20 hover:bg-white/10 active:scale-90"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={submit}
        disabled={submitted}
        className="mt-4 w-full max-w-md mx-auto py-4 rounded-2xl font-sans text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}44` }}
      >
        {submitted
          ? submittedCount != null
            ? `Envoyé — ${submittedCount}/${playerCount}…`
            : "Classement envoyé..."
          : "Valider mon classement"}
      </button>
    </div>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
      {[4, 10, 16].map((cy) =>
        [4, 10].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" />)
      )}
    </svg>
  );
}
