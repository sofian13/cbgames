"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";
import { ModeSelect, colorForIndex, type GameMode } from "@/components/games/local-kit";
import {
  recordGame,
  getProgress,
  levelFor,
  PP_BADGES,
  type RecordResult,
} from "@/lib/games/pensez-pareil-progress";

// ══════════════════════════════════════════════════════════
// Matching (dupliqué côté serveur dans party/games/pensez-pareil.ts)
// ══════════════════════════════════════════════════════════
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^(l'|le |la |les |un |une |des |du |de |d')/, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + c);
    }
  return dp[m][n];
}
function isMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const x = normalize(a), y = normalize(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x))) return true;
  return lev(x, y) <= 1 && Math.max(x.length, y.length) >= 4;
}

const SYNC_BASE = 100;
const COMBO_STEP = 25;
const TOTAL_ROUNDS = 8;
const ACCENT = "#FF3EA5";

// ── Prompts locaux (packs) ────────────────────────────────
type Tier = "soft" | "couple" | "spicy";
interface Prompt { text: string; tier: Tier; }

const LOCAL_PROMPTS: Prompt[] = [
  { text: "Un fruit", tier: "soft" },
  { text: "Une couleur", tier: "soft" },
  { text: "Un animal de compagnie", tier: "soft" },
  { text: "Un pays à visiter", tier: "soft" },
  { text: "Un chiffre entre 1 et 10", tier: "soft" },
  { text: "Une saison", tier: "soft" },
  { text: "Un dessert", tier: "soft" },
  { text: "Un super-héros", tier: "soft" },
  { text: "Une boisson chaude", tier: "soft" },
  { text: "Un film d'animation", tier: "soft" },
  { text: "Un emoji", tier: "soft" },
  { text: "Une garniture de pizza", tier: "soft" },
  { text: "Notre série du moment", tier: "couple" },
  { text: "Notre prochaine destination", tier: "couple" },
  { text: "Un plat qu'on commande toujours", tier: "couple" },
  { text: "Notre activité du dimanche", tier: "couple" },
  { text: "Notre chanson", tier: "couple" },
  { text: "Le prénom de notre futur animal", tier: "couple" },
  { text: "Notre resto préféré", tier: "couple" },
  { text: "Un truc qui nous fait toujours rire", tier: "couple" },
  { text: "Un endroit insolite pour s'embrasser", tier: "spicy" },
  { text: "Une partie du corps de l'autre", tier: "spicy" },
  { text: "Un mot pour notre dernière nuit", tier: "spicy" },
  { text: "Une tenue qui rend l'autre fou", tier: "spicy" },
];

type Pack = "soft" | "mix" | "hot";
const PACKS: { id: Pack; label: string; emoji: string; tiers: Tier[]; sub: string }[] = [
  { id: "soft", label: "Soft", emoji: "🌸", tiers: ["soft"], sub: "Tout public, on s'échauffe" },
  { id: "mix", label: "Couple", emoji: "💞", tiers: ["soft", "couple"], sub: "Notre vie à deux" },
  { id: "hot", label: "Hot 18+", emoji: "🔥", tiers: ["soft", "couple", "spicy"], sub: "Ça monte en température" },
];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
function buildDeck(pack: Pack): Prompt[] {
  const tiers = PACKS.find((p) => p.id === pack)!.tiers;
  const pool = shuffle(LOCAL_PROMPTS.filter((p) => tiers.includes(p.tier)));
  const out: Prompt[] = [];
  let i = 0;
  while (out.length < TOTAL_ROUNDS) {
    out.push(pool[i % pool.length]);
    i++;
  }
  return out;
}

// ══════════════════════════════════════════════════════════
// WRAPPER
// ══════════════════════════════════════════════════════════
export default function PensezPareilGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  if (mode === null) {
    return (
      <ModeSelect
        emoji="💞"
        name="Pensez Pareil"
        tagline="Répondez en aveugle et tombez sur la MÊME réponse. Plus vous êtes synchro, plus votre complicité monte."
        onPick={setMode}
      />
    );
  }
  if (mode === "local") return <PensezPareilLocal onReturnToLobby={props.onReturnToLobby} />;
  return <PensezPareilOnline {...props} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (pass-and-play à deux)
// ══════════════════════════════════════════════════════════
function PensezPareilLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  type Phase = "setup" | "passA" | "typeA" | "passB" | "typeB" | "reveal" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [pack, setPack] = useState<Pack>("mix");
  const [deck, setDeck] = useState<Prompt[]>([]);
  const [round, setRound] = useState(0);
  const [ansA, setAnsA] = useState("");
  const [ansB, setAnsB] = useState("");
  const [syncs, setSyncs] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [teamScore, setTeamScore] = useState(0);
  const [inputA, setInputA] = useKeyedState<string>(`${round}-A`, "");
  const [inputB, setInputB] = useKeyedState<string>(`${round}-B`, "");

  const prompt = deck[round] ?? null;
  const matched = isMatch(ansA, ansB);
  const lastPoints = matched ? SYNC_BASE + streak * COMBO_STEP : 0;

  const begin = (n: [string, string], p: Pack) => {
    setNames(n); setPack(p); setDeck(buildDeck(p));
    setRound(0); setSyncs(0); setStreak(0); setBestStreak(0); setTeamScore(0);
    setPhase("passA");
  };

  const resolveReveal = () => {
    if (matched) {
      setSyncs((s) => s + 1);
      const ns = streak + 1;
      setStreak(ns);
      setBestStreak((b) => Math.max(b, ns));
      setTeamScore((t) => t + lastPoints);
    } else {
      setStreak(0);
    }
  };

  if (phase === "setup") {
    return <CoupleSetup pack={pack} onBack={onReturnToLobby} onStart={begin} />;
  }
  if (phase === "passA") {
    return <Hand toName={names[0] || "Joueur 1"} idx={0}
      hint="Toi seul regardes : écris ta réponse sans la montrer."
      onReady={() => setPhase("typeA")} />;
  }
  if (phase === "typeA") {
    return <TypeScreen prompt={prompt} player={names[0] || "Joueur 1"} idx={0}
      value={inputA} onChange={setInputA}
      onSubmit={() => { setAnsA(inputA.trim()); setPhase("passB"); }} />;
  }
  if (phase === "passB") {
    return <Hand toName={names[1] || "Joueur 2"} idx={1}
      hint="À ton tour : même thème, réponds en secret."
      onReady={() => setPhase("typeB")} />;
  }
  if (phase === "typeB") {
    return <TypeScreen prompt={prompt} player={names[1] || "Joueur 2"} idx={1}
      value={inputB} onChange={setInputB}
      onSubmit={() => { setAnsB(inputB.trim()); resolveReveal(); setPhase("reveal"); }} />;
  }
  if (phase === "reveal") {
    return (
      <RevealScreen
        prompt={prompt} matched={matched} points={lastPoints} streak={matched ? streak + 1 : 0}
        names={[names[0] || "Joueur 1", names[1] || "Joueur 2"]} answers={[ansA, ansB]}
        round={round + 1} total={TOTAL_ROUNDS} syncs={syncs + (matched ? 1 : 0)}
        onNext={() => {
          if (round + 1 >= TOTAL_ROUNDS) setPhase("over");
          else { setRound((r) => r + 1); setPhase("passA"); }
        }}
      />
    );
  }
  // over
  return (
    <GameOverScreen
      teamScore={teamScore} syncs={syncs} total={TOTAL_ROUNDS} bestStreak={bestStreak}
      onReplay={() => setPhase("setup")} onReturnToLobby={onReturnToLobby}
    />
  );
}

// ── Setup couple (2 joueurs + pack + niveau actuel) ───────
function CoupleSetup({ pack, onStart, onBack }: {
  pack: Pack;
  onStart: (names: [string, string], pack: Pack) => void;
  onBack?: () => void;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [sel, setSel] = useState<Pack>(pack);
  const lvl = levelFor(getProgress().xp);
  const can = a.trim() && b.trim();

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center p-5 text-white"
      style={{ background: `radial-gradient(circle at 50% 10%, ${ACCENT}30, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)` }}>
      <div className="mt-4 text-5xl">💞</div>
      <h1 className="cb-display-lg mt-1">Pensez Pareil</h1>
      <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
        style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--line-soft)" }}>
        <span>{lvl.emoji}</span>
        <span className="text-xs font-bold" style={{ color: "var(--af-yellow)" }}>Complicité : {lvl.name}</span>
      </div>

      <div className="mt-6 w-full max-w-sm space-y-2.5">
        {[{ v: a, set: setA, i: 0 }, { v: b, set: setB, i: 1 }].map(({ v, set, i }) => (
          <div key={i} className="flex items-center gap-3">
            <MascotAvatar color={colorForIndex(i)} size={36} mood="happy" />
            <input value={v} onChange={(e) => set(e.target.value.slice(0, 16))}
              placeholder={i === 0 ? "Toi" : "Ton/ta partenaire"}
              className="flex-1 rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--line-soft)", color: "#fff" }} />
          </div>
        ))}
      </div>

      <p className="af-eyebrow mt-6 mb-2">Ambiance</p>
      <div className="grid w-full max-w-sm grid-cols-3 gap-2">
        {PACKS.map((p) => {
          const on = sel === p.id;
          return (
            <button key={p.id} onClick={() => setSel(p.id)}
              className="rounded-2xl border p-3 text-center transition active:scale-95"
              style={{
                background: on ? `${ACCENT}22` : "rgba(255,255,255,0.04)",
                borderColor: on ? `${ACCENT}88` : "var(--line-soft)",
              }}>
              <div className="text-2xl">{p.emoji}</div>
              <div className="mt-1 text-xs font-bold">{p.label}</div>
              <div className="mt-0.5 text-[9px] leading-tight" style={{ color: "var(--text-muted)" }}>{p.sub}</div>
            </button>
          );
        })}
      </div>

      <button onClick={() => can && onStart([a.trim(), b.trim()], sel)} disabled={!can}
        className="af-btn af-btn-primary mt-7 w-full max-w-sm disabled:opacity-40" style={{ fontSize: 16 }}>
        C&apos;est parti 💞
      </button>
      {onBack && <button onClick={onBack} className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>← Mode</button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MODE ONLINE
// ══════════════════════════════════════════════════════════
interface PPState {
  phase: "waiting" | "intro" | "answer" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  timeLeft: number;
  prompt: Prompt | null;
  syncs: number;
  streak: number;
  bestStreak: number;
  teamScore: number;
  matched: boolean | null;
  lastPoints: number | null;
  answers: Record<string, string | null> | null;
  players: { id: string; name: string; hasAnswered: boolean }[];
  myAnswer: string | null;
}

function PensezPareilOnline({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const { sendAction } = useGame(roomCode, "pensez-pareil", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as PPState;

  const [input, setInput] = useKeyedState<string>(`${state?.round ?? 0}-ans`, "");
  const submit = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    sendAction({ action: "submit-answer", answer: t });
  }, [input, sendAction]);

  if (!state || state.phase === "waiting") {
    const waitingPartner = state?.players && state.players.length < 2;
    return <Centered emoji="💞" text={waitingPartner ? "En attente de ton/ta partenaire..." : "Connexion..."} />;
  }

  if (state.phase === "intro") {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-6">
        <Sparkles count={10} />
        <p className="af-eyebrow mb-5">Manche {state.round} / {state.totalRounds}</p>
        <Mascot size={120} color="pink" mood="love" arms delay={0} />
        <h2 className="cb-display-xl mt-4 text-center" style={{ fontSize: "clamp(1.8rem,7vw,3rem)" }}>Pensez pareil…</h2>
        <p className="mt-4 max-w-xs animate-pulse text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Un thème arrive — répondez la même chose sans vous parler !
        </p>
      </div>
    );
  }

  if (state.phase === "answer") {
    const me = state.players?.find((p) => p.id === playerId);
    const other = state.players?.find((p) => p.id !== playerId);
    if (me?.hasAnswered || state.myAnswer != null) {
      return (
        <div className="flex flex-1 flex-col items-center p-5">
          <RoundBar round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} streak={state.streak} />
          <PromptCard prompt={state.prompt} />
          <div className="mt-8 rounded-3xl border px-6 py-5 text-center"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--line-soft)" }}>
            <div className="text-4xl">✅</div>
            <p className="mt-2 font-bold">Réponse envoyée !</p>
            <p className="mt-1 animate-pulse text-xs" style={{ color: "var(--text-dim)" }}>
              {other?.hasAnswered ? "Révélation…" : `On attend ${other?.name ?? "l'autre"}…`}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center p-5">
        <RoundBar round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} streak={state.streak} />
        <PromptCard prompt={state.prompt} />
        <AnswerInput value={input} onChange={setInput} onSubmit={submit} />
      </div>
    );
  }

  if (state.phase === "reveal") {
    const ids = state.players?.map((p) => p.id) ?? [];
    const names = state.players?.map((p) => p.name) ?? [];
    const answers: [string, string] = [
      state.answers?.[ids[0]] ?? "—",
      state.answers?.[ids[1]] ?? "—",
    ];
    return (
      <RevealScreen
        prompt={state.prompt} matched={!!state.matched} points={state.lastPoints ?? 0} streak={state.streak}
        names={[names[0] ?? "J1", names[1] ?? "J2"]} answers={answers}
        round={state.round} total={state.totalRounds} syncs={state.syncs} auto
      />
    );
  }

  if (state.phase === "game-over") {
    return (
      <GameOverScreen
        teamScore={state.teamScore} syncs={state.syncs} total={state.totalRounds} bestStreak={state.bestStreak}
        onReturnToLobby={onReturnToLobby}
      />
    );
  }

  return <Centered emoji="💞" text={error ?? "Chargement…"} />;
}

// ══════════════════════════════════════════════════════════
// COMPOSANTS PARTAGÉS
// ══════════════════════════════════════════════════════════
function PromptCard({ prompt }: { prompt: Prompt | null }) {
  if (!prompt) return null;
  const tierLabel = prompt.tier === "spicy" ? "🔥 Coquin" : prompt.tier === "couple" ? "💞 Nous deux" : "🌸 Soft";
  return (
    <div className="mt-5 w-full max-w-md rounded-3xl border p-7 text-center"
      style={{
        background: `linear-gradient(150deg, ${ACCENT}1f, rgba(255,255,255,0.04))`,
        borderColor: `${ACCENT}55`,
        boxShadow: `0 0 40px ${ACCENT}22`,
      }}>
      <span className="af-chip" style={{ background: `${ACCENT}22`, borderColor: `${ACCENT}44`, color: ACCENT }}>{tierLabel}</span>
      <p className="cb-display-md mt-3" style={{ fontSize: "clamp(1.4rem,5.5vw,2rem)", letterSpacing: -0.5 }}>{prompt.text}</p>
      <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>Réponds en 1 ou 2 mots — sans vous concerter !</p>
    </div>
  );
}

function AnswerInput({ value, onChange, onSubmit }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void;
}) {
  return (
    <div className="mt-7 w-full max-w-md">
      <input
        autoFocus value={value} maxLength={40}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        placeholder="Ta réponse secrète…"
        className="w-full rounded-2xl border px-5 py-4 text-center text-lg outline-none"
        style={{ background: "rgba(255,255,255,0.07)", borderColor: `${ACCENT}55`, color: "#fff", fontFamily: "var(--font-display)" }}
      />
      <button onClick={onSubmit} disabled={!value.trim()}
        className="af-btn af-btn-primary mt-4 w-full disabled:opacity-40" style={{ fontSize: 15, padding: 16 }}>
        Verrouiller ma réponse 🔒
      </button>
    </div>
  );
}

function RoundBar({ round, total, timeLeft, streak }: {
  round: number; total: number; timeLeft?: number; streak: number;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="af-chip">Manche {round}/{total}</span>
        {streak > 0 && (
          <span className="af-chip" style={{ background: "rgba(255,140,0,0.18)", borderColor: "rgba(255,140,0,0.35)", color: "#FFA640" }}>
            🔥 Série x{streak}
          </span>
        )}
      </div>
      {timeLeft != null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.max(0, (timeLeft / 35) * 100)}%`, background: `linear-gradient(90deg, var(--cb-brand), ${ACCENT})` }} />
        </div>
      )}
    </div>
  );
}

// ── Reveal (sync ou raté) ─────────────────────────────────
function RevealScreen({
  prompt, matched, points, streak, names, answers, round, total, syncs, onNext, auto,
}: {
  prompt: Prompt | null; matched: boolean; points: number; streak: number;
  names: [string, string]; answers: [string, string];
  round: number; total: number; syncs: number;
  onNext?: () => void; auto?: boolean;
}) {
  return (
    <div className="relative flex min-h-[100svh] flex-1 flex-col items-center p-5 text-white"
      style={{ background: matched
        ? `radial-gradient(circle at 50% 18%, ${ACCENT}33, transparent 50%), #0E0828`
        : "radial-gradient(circle at 50% 18%, rgba(91,54,214,0.22), transparent 50%), #0E0828" }}>
      {matched && <ConfettiBurst count={50} />}
      <Sparkles count={matched ? 10 : 4} />

      <div className="mt-3 w-full max-w-md text-center">
        <p className="af-eyebrow" style={{ color: matched ? "var(--af-yellow)" : "var(--text-muted)" }}>
          Manche {round}/{total} · {syncs} sync{syncs > 1 ? "s" : ""}
        </p>
        <h2 className="cb-display-xl mt-1" style={{ fontSize: "clamp(2.2rem,9vw,3.4rem)", color: matched ? ACCENT : "#fff" }}>
          {matched ? "SYNC ! 💞" : "Presque…"}
        </h2>
        {matched ? (
          <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
            +{points} pts{streak >= 2 && <span style={{ color: "#FFA640" }}> · combo x{streak} 🔥</span>}
          </p>
        ) : (
          <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>Pas la même réponse — la série repart à zéro.</p>
        )}

        {prompt && <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>« {prompt.text} »</p>}

        <div className="mt-3 grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl border p-4"
              style={{
                background: matched ? `${ACCENT}1a` : "rgba(255,255,255,0.04)",
                borderColor: matched ? `${ACCENT}55` : "var(--line-soft)",
              }}>
              <div className="flex items-center justify-center gap-1.5">
                <MascotAvatar color={colorForIndex(i)} size={22} mood={matched ? "love" : "neutral"} />
                <span className="text-[11px] font-bold" style={{ color: "var(--text-dim)" }}>{names[i]}</span>
              </div>
              <p className="mt-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{answers[i] || "—"}</p>
            </div>
          ))}
        </div>
        {matched && <div className="mt-3 text-center text-2xl">🤝</div>}
      </div>

      {auto ? (
        <p className="mt-6 animate-pulse text-center text-[11px]" style={{ color: "var(--text-muted)" }}>Manche suivante…</p>
      ) : (
        <button onClick={onNext} className="af-btn af-btn-primary mt-7 w-full max-w-md" style={{ fontSize: 15 }}>
          {round >= total ? "Voir la complicité 💞" : "Manche suivante"}
        </button>
      )}
    </div>
  );
}

// ── Game over + progression persistante ───────────────────
function GameOverScreen({
  teamScore, syncs, total, bestStreak, onReplay, onReturnToLobby,
}: {
  teamScore: number; syncs: number; total: number; bestStreak: number;
  onReplay?: () => void; onReturnToLobby?: () => void;
}) {
  const recordedRef = useRef(false);
  const [result, setResult] = useState<RecordResult | null>(null);

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    setResult(recordGame({ syncs, bestStreak, perfect: syncs === total && total > 0 }));
  }, [syncs, bestStreak, total]);

  const lvl = result?.toLevel ?? levelFor(getProgress().xp);
  const xp = result?.after.xp ?? getProgress().xp;
  const span = lvl.next === Infinity ? 1 : lvl.next - lvl.min;
  const into = lvl.next === Infinity ? 1 : (xp - lvl.min) / span;
  const pct = Math.max(0, Math.min(100, into * 100));

  return (
    <div className="relative flex min-h-[100svh] flex-1 flex-col items-center p-6 text-white"
      style={{ background: `radial-gradient(circle at 50% 20%, ${ACCENT}33, transparent 50%), #0E0828` }}>
      <ConfettiBurst count={50} />
      {result?.leveledUp && <ConfettiBurst count={40} />}

      <p className="af-eyebrow mt-2" style={{ color: "var(--af-yellow)" }}>Partie terminée</p>
      <h2 className="cb-display-lg mt-1">💞 {syncs}/{total} syncs</h2>

      <div className="mt-5 grid w-full max-w-sm grid-cols-3 gap-2 text-center">
        <Stat label="Score" value={teamScore} />
        <Stat label="Syncs" value={`${syncs}/${total}`} />
        <Stat label="Meilleure série" value={`x${bestStreak}`} />
      </div>

      {/* Carte complicité */}
      <div className="mt-6 w-full max-w-sm rounded-3xl border p-5"
        style={{ background: `linear-gradient(150deg, ${ACCENT}1f, rgba(255,255,255,0.04))`, borderColor: `${ACCENT}55` }}>
        {result?.leveledUp && (
          <p className="mb-2 text-center text-sm font-bold" style={{ color: "var(--af-yellow)" }}>
            ✨ Niveau de complicité débloqué !
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="text-4xl">{lvl.emoji}</div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Complicité</p>
            <p className="cb-display-sm" style={{ color: "#fff" }}>{lvl.name}</p>
          </div>
          <div className="text-right">
            <p className="cb-mono text-sm font-bold" style={{ color: ACCENT }}>{xp} XP</p>
            {lvl.next !== Infinity && (
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{lvl.next - xp} → niv. suiv.</p>
            )}
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, var(--cb-brand), ${ACCENT})` }} />
        </div>
        {result && result.newBadges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.newBadges.map((b) => (
              <span key={b} className="af-chip" style={{ background: "rgba(255,210,63,0.18)", borderColor: "rgba(255,210,63,0.35)", color: "var(--af-yellow)" }}>
                {PP_BADGES[b]?.emoji} {PP_BADGES[b]?.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-7 flex gap-2">
        {onReplay && <button onClick={onReplay} className="af-btn af-btn-ghost">Rejouer</button>}
        {onReturnToLobby && <button onClick={onReturnToLobby} className="af-btn af-btn-primary">Lobby</button>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border p-3" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--line-soft)" }}>
      <p className="cb-display-sm" style={{ fontSize: 22 }}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

// ── Pass / type (local) ───────────────────────────────────
function Hand({ toName, idx, hint, onReady }: { toName: string; idx: number; hint: string; onReady: () => void }) {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
      style={{ background: `radial-gradient(circle at 50% 12%, ${ACCENT}30, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)` }}>
      <p className="af-eyebrow mb-4" style={{ color: "var(--text-dim)" }}>Passe le téléphone à</p>
      <Mascot size={130} color={colorForIndex(idx)} mood="wink" arms />
      <h1 className="cb-display-lg mt-3 text-center">{toName}</h1>
      <p className="mt-2 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>{hint}</p>
      <button onClick={onReady} className="af-btn af-btn-primary mt-8 w-full max-w-xs" style={{ fontSize: 16 }}>C&apos;est moi 🔒</button>
    </div>
  );
}

function TypeScreen({ prompt, player, idx, value, onChange, onSubmit }: {
  prompt: Prompt | null; player: string; idx: number;
  value: string; onChange: (v: string) => void; onSubmit: () => void;
}) {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center p-5 text-white"
      style={{ background: `radial-gradient(circle at 50% 10%, ${ACCENT}26, transparent 45%), #0E0828` }}>
      <div className="mt-4 flex items-center gap-2">
        <MascotAvatar color={colorForIndex(idx)} size={28} mood="happy" />
        <span className="text-sm font-bold">{player}</span>
      </div>
      <PromptCard prompt={prompt} />
      <AnswerInput value={value} onChange={onChange} onSubmit={() => value.trim() && onSubmit()} />
    </div>
  );
}

function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--line-soft)", boxShadow: `0 0 40px ${ACCENT}33` }}>
        <span className="text-4xl">{emoji}</span>
      </div>
      <p className="animate-pulse text-center text-lg" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}
