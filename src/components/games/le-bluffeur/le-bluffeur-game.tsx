"use client";

import { useCallback, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ConfettiBurst, Sparkles } from "@/components/ConfettiBurst";
import { ModeSelect, PlayersSetup, PassScreen, colorForIndex, type GameMode } from "@/components/games/local-kit";
import { TheatreScreen, QuestionBillboard, RecWave } from "@/components/games/le-bluffeur/theatre";

interface BluffPlayerState {
  id: string;
  name: string;
  score: number;
  hasFake: boolean;
  hasVoted: boolean;
  foundTruth: boolean | null;
}

interface OptionState {
  id: string;
  text: string;
  isTruth: boolean | null;
  authors: string[] | null;
  voterNames: string[] | null;
  voteCount: number | null;
}

interface BluffState {
  phase: "waiting" | "writing" | "voting" | "reveal" | "game-over";
  round: number;
  totalRounds: number;
  timeLeft: number;
  question: string | null;
  trueAnswer: string | null;
  options: OptionState[] | null;
  roundPoints: Record<string, number> | null;
  players: BluffPlayerState[];
  myFake: string | null;
  myVote: string | null;
  iFoundTruth: boolean;
}

// Stable color per player
const COLORS: MascotColor[] = ["purple", "pink", "yellow", "mint", "sky", "coral", "lavender"];
function colorFor(id: string): MascotColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

// ── Questions (mode local) ───────────────────────────────
const LOCAL_QUESTIONS: { question: string; answer: string }[] = [
  { question: "Un escargot peut dormir jusqu'à ___ d'affilée.", answer: "3 ans" },
  { question: "Le cœur d'une crevette se situe dans ___.", answer: "sa tête" },
  { question: "Les flamants roses naissent de couleur ___.", answer: "grise" },
  { question: "La Tour Eiffel peut grandir d'environ ___ en été.", answer: "15 cm" },
  { question: "Les koalas dorment environ ___ par jour.", answer: "22 heures" },
  { question: "Le sang des pieuvres est de couleur ___.", answer: "bleue" },
  { question: "Une pieuvre possède ___ cœurs.", answer: "3" },
  { question: "Les loutres dorment en ___ pour ne pas se perdre.", answer: "se tenant la main" },
  { question: "Les requins existaient déjà avant ___.", answer: "les arbres" },
  { question: "Le ketchup était vendu au 19e siècle comme ___.", answer: "médicament" },
  { question: "Le premier objet scanné avec un code-barres était ___.", answer: "un paquet de chewing-gum" },
  { question: "Un nuage moyen pèse environ ___.", answer: "500 tonnes" },
  { question: "Le record du plus long hoquet a duré ___.", answer: "68 ans" },
  { question: "Un groupe de flamants roses s'appelle ___.", answer: "une flamboyance" },
  { question: "Le record du monde du plus long baiser est d'environ ___.", answer: "58 heures" },
  { question: "En moyenne, on passe ___ de sa vie à attendre aux feux rouges.", answer: "6 mois" },
  { question: "Le miel ne ___ jamais.", answer: "périme" },
  { question: "Il est quasi impossible d'___ les yeux ouverts.", answer: "éternuer" },
];

const normFake = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ");

interface LocalOption { id: number; text: string; authors: number[]; isTruth: boolean; }

// ── WRAPPER : le joueur choisit local ou online ───────────
export default function LeBluffeurGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  if (mode === null) {
    return (
      <ModeSelect emoji="🎭" name="Le Bluffeur"
        tagline="Invente une fausse réponse crédible, puis démasque la vraie parmi les bluffs."
        onPick={setMode} />
    );
  }
  if (mode === "local") return <LeBluffeurLocal onReturnToLobby={props.onReturnToLobby} />;
  return <LeBluffeurOnline {...props} />;
}

// ══════════════════════════════════════════════════════════
// MODE LOCAL (pass-and-play)
// ══════════════════════════════════════════════════════════
const TOTAL_LOCAL_ROUNDS = 5;

function LeBluffeurLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  type Phase = "setup" | "question" | "pass-write" | "write" | "pass-vote" | "vote" | "reveal" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [questions] = useState(() => [...LOCAL_QUESTIONS].sort(() => Math.random() - 0.5));
  const [fakes, setFakes] = useState<string[]>([]);
  const [wroteTruth, setWroteTruth] = useState<boolean[]>([]);
  const [turnIdx, setTurnIdx] = useState(0);
  const [options, setOptions] = useState<LocalOption[]>([]);
  const [votes, setVotes] = useState<number[]>([]); // optionId per player, -1 = none
  const [draft, setDraft] = useState("");

  const total = players.length;
  const q = questions[(round - 1) % questions.length] ?? null;
  const totalRounds = Math.min(TOTAL_LOCAL_ROUNDS, questions.length);

  const begin = (names: string[]) => {
    setPlayers(names); setScores(names.map(() => 0));
    startRound(1, names);
  };
  const startRound = (r: number, names = players) => {
    setRound(r);
    setFakes(names.map(() => ""));
    setWroteTruth(names.map(() => false));
    setVotes(names.map(() => -1));
    setOptions([]);
    setTurnIdx(0);
    setDraft("");
    setPhase("question");
  };

  const buildOptions = (allFakes: string[], truth: string) => {
    const truthN = normFake(truth);
    const map = new Map<string, { text: string; authors: number[] }>();
    const wt = players.map(() => false);
    allFakes.forEach((f, i) => {
      const n = normFake(f);
      if (!f.trim()) return;
      if (n === truthN) { wt[i] = true; return; }
      const ex = map.get(n);
      if (ex) ex.authors.push(i); else map.set(n, { text: f.trim(), authors: [i] });
    });
    const opts: LocalOption[] = [];
    let id = 0;
    for (const { text, authors } of map.values()) opts.push({ id: id++, text, authors, isTruth: false });
    opts.push({ id: id++, text: truth, authors: [], isTruth: true });
    setWroteTruth(wt);
    setOptions(opts.sort(() => Math.random() - 0.5));
  };

  const resolve = (finalVotes: number[]) => {
    const pts = players.map(() => 0);
    finalVotes.forEach((optId, voter) => {
      if (optId < 0) return;
      const opt = options.find((o) => o.id === optId);
      if (!opt) return;
      if (opt.isTruth) pts[voter] += 30;
      else opt.authors.forEach((a) => { pts[a] += 20; });
    });
    wroteTruth.forEach((w, i) => { if (w) pts[i] += 15; });
    setScores((s) => s.map((v, i) => v + pts[i]));
    setPhase("reveal");
  };

  if (phase === "setup") {
    return <PlayersSetup emoji="🎭" name="Le Bluffeur" min={3} max={8} accent="#7c5cff" onStart={begin} onBack={onReturnToLobby} />;
  }
  if (phase === "question") {
    return (
      <TheatreScreen round={round} total={totalRounds}>
        <QuestionBillboard question={q?.question ?? null} take={`prise ${String(round).padStart(2, "0")}`} />
        <div className="relative z-[3] px-6 pb-24 pt-1">
          <button onClick={() => { setTurnIdx(0); setDraft(""); setPhase("pass-write"); }}
            className="af-btn af-btn-primary w-full"
            style={{ background: "linear-gradient(135deg, #FFD23F, #C48800)", color: "#1A0E2E" }}>
            🎬 Action ! Chacun invente son bluff →
          </button>
        </div>
      </TheatreScreen>
    );
  }
  if (phase === "pass-write") {
    return <PassScreen toName={players[turnIdx]} colorIndex={turnIdx} accent="#7c5cff"
      hint="Toi seul : invente une fausse réponse crédible, sans la montrer aux autres." onReady={() => { setDraft(""); setPhase("write"); }} />;
  }
  if (phase === "write") {
    return (
      <TheatreScreen round={round} total={totalRounds}>
        <QuestionBillboard question={q?.question ?? null} take={players[turnIdx]} />
        <div className="relative z-[3] px-6 pb-24 pt-1">
          <div className="rounded-2xl border p-3" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))", borderColor: "rgba(255,210,63,0.4)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            <div className="mb-1.5 flex items-center justify-between">
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: 9, color: "#FFD23F", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{players[turnIdx]} · TON BLUFF · TAKE 01</span>
              <span style={{ fontFamily: "var(--font-mono-face)", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{draft.length}/80</span>
            </div>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ta fausse réponse crédible..." maxLength={80} autoComplete="off" autoFocus
              className="w-full bg-transparent text-base outline-none"
              style={{ color: "#fff", fontFamily: "var(--font-display)" }} />
          </div>
          <button disabled={!draft.trim()} onClick={() => {
            const nf = [...fakes]; nf[turnIdx] = draft.trim(); setFakes(nf);
            if (turnIdx < total - 1) { setTurnIdx(turnIdx + 1); setDraft(""); setPhase("pass-write"); }
            else { buildOptions(nf, q?.answer ?? ""); setTurnIdx(0); setPhase("pass-vote"); }
          }} className="af-btn mt-3 w-full disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #FFD23F, #C48800)", color: "#1A0E2E" }}>
            Valider mon bluff →
          </button>
        </div>
      </TheatreScreen>
    );
  }
  if (phase === "pass-vote") {
    return <PassScreen toName={players[turnIdx]} colorIndex={turnIdx} accent="#7c5cff"
      buttonLabel="C'est moi, je vote" hint="Trouve la VRAIE réponse parmi les propositions." onReady={() => setPhase("vote")} />;
  }
  if (phase === "vote") {
    const voter = turnIdx;
    return (
      <div className="flex min-h-[100svh] flex-col items-center p-5 text-white"
        style={{ background: "radial-gradient(circle at 50% 15%, rgba(124,92,255,0.26), transparent 45%), #0E0828" }}>
        <p className="af-eyebrow mt-3">{players[voter]} · vote</p>
        <p className="mt-1 mb-3 max-w-md text-center text-sm" style={{ color: "var(--text-dim)" }}>{q?.question}</p>
        <div className="w-full max-w-md space-y-2">
          {options.map((o) => {
            const own = o.authors.includes(voter);
            return (
              <button key={o.id} disabled={own}
                onClick={() => {
                  const nv = [...votes]; nv[voter] = o.id; setVotes(nv);
                  if (voter < total - 1) { setTurnIdx(voter + 1); setPhase("pass-vote"); }
                  else { resolve(nv); }
                }}
                className={cn("w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition", own ? "opacity-40" : "hover:scale-[1.01]")}
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                {o.text}{own && <span className="ml-2 text-[10px] text-white/30">(ton bluff)</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (phase === "reveal") {
    const truth = options.find((o) => o.isTruth);
    const bluffs = options.filter((o) => !o.isTruth);
    return (
      <div className="relative flex min-h-[100svh] flex-col items-center overflow-y-auto p-5 text-white"
        style={{ background: "radial-gradient(circle at 50% 25%, #FF3EA5 0%, #5B36D6 40%, #0E0828 100%)" }}>
        <ConfettiBurst count={40} />
        <p className="af-eyebrow mt-2" style={{ color: "var(--af-yellow)" }}>✦ La vraie réponse</p>
        <div className="mt-3 w-full max-w-md rounded-3xl p-5" style={{ background: "linear-gradient(160deg, var(--af-yellow), #FFA800)", color: "#1A0E2E" }}>
          <p className="text-xs font-semibold opacity-60">{q?.question}</p>
          <p className="mt-1 text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>{q?.answer}</p>
          {truth && truth.authors.length === 0 && (() => {
            const finders = votes.map((v, i) => (v === truth.id ? players[i] : null)).filter(Boolean);
            return finders.length > 0 ? <p className="mt-2 text-xs font-bold">✓ Trouvée par {finders.join(", ")}</p> : null;
          })()}
        </div>
        <p className="af-eyebrow mt-5 mb-2" style={{ color: "var(--text-muted)" }}>✘ Les bluffs</p>
        <div className="w-full max-w-md space-y-2">
          {bluffs.map((o) => {
            const voters = votes.map((v, i) => (v === o.id ? players[i] : null)).filter(Boolean);
            return (
              <div key={o.id} className="rounded-2xl border p-3" style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm">“{o.text}”</span>
                  <span className="cb-mono text-xs" style={{ color: voters.length ? "var(--af-mint)" : "var(--text-muted)" }}>{voters.length ? `+${voters.length * 20}` : "0"}</span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>de {o.authors.map((a) => players[a]).join(", ")}{voters.length ? ` · piégé : ${voters.join(", ")}` : ""}</p>
              </div>
            );
          })}
        </div>
        <button onClick={() => { if (round >= totalRounds) setPhase("over"); else startRound(round + 1); }}
          className="af-btn af-btn-primary mt-6 w-full max-w-md">{round >= totalRounds ? "Voir les scores" : "Manche suivante"}</button>
      </div>
    );
  }
  // over
  const ranking = players.map((name, i) => ({ name, score: scores[i], i })).sort((a, b) => b.score - a.score);
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
      style={{ background: "radial-gradient(circle at 50% 25%, rgba(124,92,255,0.3), transparent 45%), #0E0828" }}>
      <ConfettiBurst count={50} />
      <p className="af-eyebrow" style={{ color: "var(--af-yellow)" }}>Partie terminée</p>
      <h2 className="cb-display-lg mt-1 mb-5">🎭 Résultats</h2>
      <div className="w-full max-w-sm space-y-2">
        {ranking.map((p, idx) => (
          <div key={p.i} className="flex items-center justify-between rounded-2xl border p-4"
            style={{ background: idx === 0 ? "rgba(124,92,255,0.22)" : "rgba(255,255,255,0.04)", borderColor: idx === 0 ? "rgba(124,92,255,0.55)" : "var(--line-soft)" }}>
            <div className="flex items-center gap-3">
              <span className="cb-mono w-7 font-bold" style={{ color: idx === 0 ? "#a896ff" : "var(--text-muted)" }}>#{idx + 1}</span>
              <MascotAvatar color={colorForIndex(p.i)} size={34} mood={idx === 0 ? "wink" : "happy"} />
              <span className="font-bold">{p.name}</span>
            </div>
            <span className="cb-mono font-bold" style={{ color: idx === 0 ? "#a896ff" : "#fff" }}>{p.score}</span>
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
// MODE ONLINE (multi-appareils) — inchangé
// ══════════════════════════════════════════════════════════
function LeBluffeurOnline({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "le-bluffeur", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as BluffState;

  const writeKey = `${state?.round ?? 0}-write`;
  const [fakeInput, setFakeInput] = useKeyedState<string>(writeKey, "");
  const fakeRef = useRef<HTMLInputElement>(null);

  const submitFake = useCallback(() => {
    const t = fakeInput.trim();
    if (!t || state?.myFake) return;
    sendAction({ action: "submit-fake", fake: t });
  }, [fakeInput, state?.myFake, sendAction]);

  const vote = useCallback((optionId: string) => {
    if (state?.myVote) return;
    sendAction({ action: "vote", optionId });
  }, [state?.myVote, sendAction]);

  // ── WAITING ─────────────────────────────────────────────
  if (!state || state.phase === "waiting") {
    return <Centered emoji="🎭" text="Préparation des questions..." />;
  }

  // ── WRITING (DA théâtre) ────────────────────────────────
  if (state.phase === "writing") {
    const submitted = !!state.myFake;
    return (
      <TheatreScreen round={state.round} total={state.totalRounds}>
        <QuestionBillboard question={state.question} take={`prise ${String(state.round).padStart(2, "0")}`} />
        <RecWave timeLeft={state.timeLeft} max={40} />
        <div className="relative z-[3] px-6 pb-24 pt-1">
          {!submitted ? (
            <>
              <div className="rounded-2xl border p-3" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))", borderColor: "rgba(255,210,63,0.4)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span style={{ fontFamily: "var(--font-mono-face)", fontSize: 9, color: "#FFD23F", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>TON BLUFF · TAKE 01</span>
                  <span style={{ fontFamily: "var(--font-mono-face)", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{fakeInput.length}/80</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fakeRef} value={fakeInput} onChange={(e) => setFakeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitFake()}
                    placeholder="Ta fausse réponse crédible..." maxLength={80} autoComplete="off"
                    className="flex-1 bg-transparent text-base outline-none"
                    style={{ color: "#fff", fontFamily: "var(--font-display)" }}
                  />
                  <button onClick={submitFake} disabled={!fakeInput.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
                    style={{ background: "linear-gradient(135deg, #FFD23F, #C48800)", border: "1.5px solid #FFE891", color: "#1A0E2E", fontWeight: 800 }}>
                    →
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                💡 Fais croire que c&apos;est la vraie réponse 😏
              </p>
            </>
          ) : (
            <div className="rounded-2xl border px-5 py-4 text-center" style={{ background: "rgba(255,210,63,0.1)", borderColor: "rgba(255,210,63,0.3)" }}>
              <p className="text-sm" style={{ color: "#FFE7D2" }}>Bluff envoyé ! {state.players.filter((p) => p.hasFake).length}/{state.players.length} prêts</p>
            </div>
          )}
          <div className="mt-4"><PlayerProgress players={state.players} done={(p) => p.hasFake} selfId={playerId} /></div>
        </div>
      </TheatreScreen>
    );
  }

  // ── VOTING ──────────────────────────────────────────────
  if (state.phase === "voting") {
    const voted = !!state.myVote;
    return (
      <Shell round={state.round} total={state.totalRounds} timeLeft={state.timeLeft} max={30} label="Trouve la VRAIE réponse">
        {/* Reminder of question */}
        <div className="mx-auto mt-3 max-w-md rounded-xl border border-dashed px-4 py-2"
             style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.15)" }}>
          <p className="af-eyebrow mb-1">La question</p>
          <p className="text-sm" style={{ color: "var(--text-dim)", lineHeight: 1.35 }}>{state.question}</p>
        </div>

        {state.iFoundTruth ? (
          <Waiting text="Tu as écrit la vraie réponse ! 🎯 En attente des votes des autres..." />
        ) : !voted ? (
          <div className="w-full max-w-md mt-4 space-y-2">
            {state.options?.map((o, i) => {
              const isMine = state.myFake && o.text.toLowerCase().trim() === state.myFake.toLowerCase().trim();
              return (
                <button
                  key={o.id}
                  onClick={() => !isMine && vote(o.id)}
                  disabled={!!isMine}
                  className={cn(
                    "w-full text-left rounded-2xl border px-4 py-3.5 transition-all flex items-center gap-3",
                    isMine
                      ? "cursor-not-allowed opacity-40"
                      : "hover:scale-[1.01] active:scale-[0.99]",
                  )}
                  style={{
                    background: isMine ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                    borderColor: isMine ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black"
                       style={{
                         background: "rgba(255,255,255,0.08)",
                         color: "var(--text-muted)",
                         fontFamily: "var(--font-display)",
                       }}>
                    {"ABCDEFGH"[i]}
                  </div>
                  <span className="text-sm text-white/85">
                    {o.text}
                    {isMine && <span className="ml-2 text-[10px] text-white/30">(ton bluff)</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <Waiting text="Vote enregistré ! En attente des autres..." />
        )}
        <PlayerProgress players={state.players} done={(p) => p.hasVoted} selfId={playerId} />
      </Shell>
    );
  }

  // ── REVEAL ──────────────────────────────────────────────
  if (state.phase === "reveal") {
    const myPts = state.roundPoints?.[playerId] ?? 0;
    const truthOption = state.options?.find(o => o.isTruth);
    const bluffs = state.options?.filter(o => !o.isTruth) ?? [];
    const playerById = new Map(state.players.map(p => [p.id, p]));

    return (
      <div className="relative flex flex-1 flex-col items-center overflow-y-auto p-5"
           style={{
             background: "radial-gradient(circle at 50% 25%, #FF3EA5 0%, #5B36D6 40%, #0E0828 100%)",
           }}>
        <ConfettiBurst count={60} />
        <Sparkles count={14} />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-4">
            <p className="af-eyebrow" style={{ color: "var(--af-yellow)", letterSpacing: 3 }}>✦ La vraie réponse ✦</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>{state.question}</p>
          </div>

          {/* TRUTH CARD — spectacular big yellow */}
          {truthOption && (
            <div
              className="relative mb-5 rounded-3xl p-5"
              style={{
                background: "linear-gradient(160deg, var(--af-yellow), #FFA800)",
                boxShadow: "0 20px 60px rgba(255,210,63,0.5), 0 0 0 4px rgba(255,210,63,0.2)",
                animation: "af-slide-up .6s ease-out",
              }}
            >
              <div className="absolute left-1/2 -top-3 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black tracking-wider"
                   style={{ background: "var(--af-mint)", color: "#0E0828" }}>
                VÉRITÉ ✓
              </div>
              <p className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.55)" }}>La bonne réponse était…</p>
              <p className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#1A0E2E", letterSpacing: -0.5, lineHeight: 1.1 }}>
                {state.trueAnswer ?? truthOption.text}
              </p>
              {(truthOption.voterNames?.length ?? 0) > 0 && (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
                   style={{ background: "rgba(0,0,0,0.12)", color: "#3A1B00" }}>
                  ✓ Trouvée par {truthOption.voterNames?.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* BLUFFS UNVEILED */}
          <p className="af-eyebrow mb-2 text-center" style={{ color: "var(--text-muted)" }}>✘ Les bluffs démasqués</p>
          <div className="space-y-2">
            {bluffs.map((o) => {
              const authorId = state.players.find(p => p.name === o.authors?.[0])?.id;
              const color: MascotColor = authorId ? colorFor(authorId) : "coral";
              const voterCount = o.voteCount ?? 0;
              return (
                <div key={o.id}
                     className="flex items-center gap-3 rounded-2xl border p-3"
                     style={{
                       background: "rgba(0,0,0,0.4)",
                       borderColor: "rgba(255,255,255,0.08)",
                       backdropFilter: "blur(6px)",
                     }}>
                  <MascotAvatar color={color} size={32} mood={voterCount > 0 ? "wink" : "neutral"} border={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{o.authors?.[0] ?? "?"}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>a écrit :</span>
                    </div>
                    <p className="truncate text-xs italic" style={{ color: "var(--text-dim)" }}>
                      &ldquo;{o.text}&rdquo;
                    </p>
                  </div>
                  {voterCount > 0 ? (
                    <span className="cb-mono text-xs font-bold" style={{ color: "var(--af-mint)" }}>
                      +{voterCount * 20}
                    </span>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>0 piégé</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* YOUR POINTS */}
          <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl border px-5 py-3"
               style={{
                 background: "rgba(91,54,214,0.18)",
                 borderColor: "rgba(91,54,214,0.45)",
               }}>
            <span className="text-sm">Tu marques</span>
            <span className="cb-display-md" style={{ color: "var(--af-yellow)", fontSize: 24 }}>+{myPts} pts</span>
          </div>
          <p className="mt-3 animate-pulse text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
            Manche suivante…
          </p>
        </div>
      </div>
    );
  }

  // ── GAME OVER ───────────────────────────────────────────
  if (state.phase === "game-over") {
    return <BluffScoreboard players={state.players} playerId={playerId} />;
  }

  return <Centered emoji="🎭" text={error ?? "Chargement..."} />;
}

// ── Sub-components ────────────────────────────────────────
function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border"
           style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", boxShadow: "0 0 40px rgba(91,54,214,0.3)" }}>
        <span className="text-4xl">{emoji}</span>
      </div>
      <p className="animate-pulse text-center text-lg" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}

function Shell({
  round, total, timeLeft, max, label, children,
}: {
  round: number; total: number; timeLeft: number; max: number; label: string; children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center p-5 md:p-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <span className="af-chip">Manche {round}/{total}</span>
        <span className={cn("cb-mono text-lg font-bold", timeLeft <= 5 ? "animate-pulse" : "")}
              style={{ color: timeLeft <= 5 ? "var(--af-coral)" : "var(--text-muted)" }}>
          {timeLeft}s
        </span>
      </div>
      <div className="mb-3 mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-linear"
             style={{
               width: `${(timeLeft / max) * 100}%`,
               background: "linear-gradient(90deg, var(--cb-brand), var(--af-pink))",
             }} />
      </div>
      <p className="af-eyebrow mb-3" style={{ color: "var(--af-yellow)" }}>{label}</p>
      {children}
    </div>
  );
}

function QuestionCard({ question }: { question: string | null }) {
  return (
    <div className="relative w-full max-w-md mt-3">
      <div className="absolute" style={{ inset: "8px -6px -6px 6px", background: "rgba(255,62,165,0.4)", borderRadius: 28, filter: "blur(0.5px)" }} />
      <div className="absolute" style={{ inset: "4px -3px -3px 3px", background: "rgba(91,54,214,0.6)", borderRadius: 28 }} />
      <div className="relative rounded-3xl p-6"
           style={{
             background: "linear-gradient(160deg, #F5F1E8 0%, #FFE4D2 100%)",
             boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
           }}>
        <div className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-base font-black text-white"
             style={{ background: "var(--cb-brand)", fontFamily: "var(--font-display)" }}>
          ?
        </div>
        <p className="text-xl text-center leading-snug"
           style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#1A0E2E", letterSpacing: -0.4 }}>
          {question}
        </p>
      </div>
    </div>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <div className="mt-6 max-w-md rounded-2xl border px-5 py-4"
         style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}>
      <p className="animate-pulse text-center text-sm" style={{ color: "var(--text-dim)" }}>{text}</p>
    </div>
  );
}

function PlayerProgress({ players, done, selfId }: {
  players: BluffPlayerState[];
  done: (p: BluffPlayerState) => boolean;
  selfId: string;
}) {
  return (
    <div className="mt-auto flex flex-wrap justify-center gap-2 pt-5">
      {players?.map((p) => {
        const c = colorFor(p.id);
        const isDone = done(p);
        return (
          <div key={p.id} className="relative">
            <MascotAvatar color={c} size={36} mood={isDone ? "wink" : "shifty"} border={p.id === selfId} />
            {isDone && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-black text-white"
                   style={{ background: "var(--af-mint)", borderColor: "#0E0828" }}>
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BluffScoreboard({ players, playerId }: { players: BluffPlayerState[]; playerId: string }) {
  const sorted = [...(players ?? [])].sort((a, b) => b.score - a.score);
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-6">
      <ConfettiBurst count={50} />
      <div className="relative z-10 w-full max-w-sm">
        <p className="af-eyebrow text-center" style={{ color: "var(--af-yellow)" }}>Partie terminée</p>
        <h2 className="cb-display-lg text-center mt-2">🎭 Résultats</h2>
        <div className="mt-6 space-y-2.5">
          {sorted.map((p, i) => {
            const c = colorFor(p.id);
            return (
              <div key={p.id}
                   className="flex items-center justify-between rounded-3xl border p-4"
                   style={{
                     background: i === 0
                       ? `linear-gradient(120deg, ${MASCOT_PALETTE[c].body}30, rgba(255,255,255,0.04))`
                       : "rgba(255,255,255,0.04)",
                     borderColor: i === 0 ? `${MASCOT_PALETTE[c].body}55` : "rgba(255,255,255,0.10)",
                     boxShadow: i === 0 ? `0 0 25px ${MASCOT_PALETTE[c].body}33` : undefined,
                   }}>
                <div className="flex items-center gap-3">
                  <span className="cb-mono w-8 text-xl font-bold" style={{ color: i === 0 ? MASCOT_PALETTE[c].body : "var(--text-muted)" }}>#{i + 1}</span>
                  <MascotAvatar color={c} size={36} mood={i === 0 ? "wink" : "neutral"} />
                  <span className="text-sm font-bold" style={{ color: i === 0 ? "#fff" : "var(--text-dim)" }}>
                    {p.name}{p.id === playerId && " (toi)"}
                  </span>
                </div>
                <span className="cb-mono text-xl font-bold" style={{ color: i === 0 ? MASCOT_PALETTE[c].body : "var(--text-muted)" }}>{p.score}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
