"use client";

/**
 * TU ME CONNAIS ? — quiz de couple/duo sur un seul téléphone.
 * À chaque manche : l'un répond sur lui-même en secret, l'autre devine.
 * Bonne réponse = 1 point pour celui qui devine. On alterne les rôles.
 * À la fin : taux de complicité. 100% local (LocalGame stub).
 */

import { useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { LocalShell, ModeSelect, PassScreen, colorForIndex, type GameMode } from "@/components/games/local-kit";
import { MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { QPACKS, type Q } from "./questions";

const ACCENT = "#FF6BAE";

function verdictFor(pct: number) {
  return pct >= 85 ? { t: "Âmes sœurs 💍", c: "#3DDC97" }
    : pct >= 65 ? { t: "Sacrée complicité ❤️", c: "#FFD23F" }
    : pct >= 45 ? { t: "Encore des choses à découvrir 👀", c: "#FF8A3D" }
    : { t: "Premier rendez-vous ? 😅", c: "#FF6B5B" };
}

// ── WRAPPER : choix local / en ligne ──
export default function CoupleQuizGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  if (mode === null) {
    return <ModeSelect emoji="❤️" name="Tu me connais ?"
      tagline="Quiz de couple : l'un répond sur lui, l'autre devine. Ensemble sur un tél, ou chacun le sien à distance."
      onPick={setMode} />;
  }
  if (mode === "local") return <CoupleQuizLocal onReturnToLobby={props.onReturnToLobby} />;
  return <CoupleQuizOnline {...props} />;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

type Phase = "names" | "config" | "pass-answer" | "answer" | "pass-guess" | "guess" | "reveal" | "over";
const TOP_SAFE = "calc(env(safe-area-inset-top, 0px) + 64px)";

// Conteneur plein écran : centré, sans jamais passer sous les coins du haut
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center px-5 text-white"
      style={{ background: `radial-gradient(circle at 50% 12%, ${ACCENT}30, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`, paddingTop: TOP_SAFE, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
      <div className="my-auto flex w-full flex-col items-center">{children}</div>
    </div>
  );
}

function CoupleQuizLocal({ onReturnToLobby }: { onReturnToLobby?: () => void }) {
  const [phase, setPhase] = useState<Phase>("names");
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [packs, setPacks] = useState<string[]>(() => QPACKS.filter((p) => p.defaultOn).map((p) => p.id));
  const [rounds, setRounds] = useState(10);
  const [deck, setDeck] = useState<Q[]>([]);
  const [round, setRound] = useState(0);
  const [answerer, setAnswerer] = useState(0); // index 0/1
  const [truth, setTruth] = useState<"a" | "b" | null>(null);
  const [guess, setGuess] = useState<"a" | "b" | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);

  const guesser = 1 - answerer;
  const q = deck[round];
  const pool = QPACKS.filter((p) => packs.includes(p.id)).flatMap((p) => p.qs);

  const begin = () => {
    // Les deux sens (A/B) sont mélangés pour éviter les automatismes
    const picked = shuffle(pool).slice(0, rounds).map((x) => (Math.random() < 0.5 ? x : { a: x.b, b: x.a }));
    setDeck(picked);
    setRound(0); setAnswerer(0); setScores([0, 0]); setTruth(null); setGuess(null);
    setPhase("pass-answer");
  };

  const onAnswer = (pick: "a" | "b") => { setTruth(pick); setPhase("pass-guess"); };
  const onGuess = (pick: "a" | "b") => {
    setGuess(pick);
    if (pick === truth) setScores((s) => (guesser === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
    try { navigator.vibrate?.(pick === truth ? 60 : [120, 60, 120]); } catch { /* rien */ }
    setPhase("reveal");
  };
  const nextRound = () => {
    if (round + 1 >= deck.length) { setPhase("over"); return; }
    setRound(round + 1); setAnswerer((a) => 1 - a); setTruth(null); setGuess(null);
    setPhase("pass-answer");
  };

  // ── Prénoms (2 joueurs exactement) ──
  if (phase === "names") {
    const ok = names[0].trim() && names[1].trim();
    return (
      <Screen>
        <div className="text-6xl">❤️</div>
        <h1 className="cb-display-lg mt-2 text-center">Tu me connais ?</h1>
        <p className="mt-2 max-w-sm text-center text-[15px]" style={{ color: "var(--text-dim)" }}>
          À deux, sur un seul tél. L&apos;un répond <b className="text-white">en secret</b> sur lui-même, l&apos;autre doit <b className="text-white">deviner</b> sa réponse. On alterne à chaque question.
        </p>
        <div className="mt-6 w-full max-w-sm space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <MascotAvatar color={colorForIndex(i)} size={40} mood="love" />
              <input
                value={names[i]}
                onChange={(e) => { const v = e.target.value.slice(0, 16); setNames((n) => (i === 0 ? [v, n[1]] : [n[0], v])); }}
                placeholder={i === 0 ? "Prénom 1" : "Prénom 2"}
                autoComplete="off" autoCorrect="off" autoCapitalize="words" spellCheck={false} enterKeyHint={i === 0 ? "next" : "done"}
                className="min-w-0 flex-1 rounded-2xl border px-4 outline-none"
                style={{ fontSize: 16, minHeight: 52, background: "rgba(255,255,255,0.06)", borderColor: "var(--line-soft)", color: "#fff" }}
              />
            </div>
          ))}
        </div>
        <button disabled={!ok} onClick={() => { setNames([names[0].trim(), names[1].trim()]); setPhase("config"); }}
          className="af-btn af-btn-primary mt-6 w-full max-w-sm disabled:opacity-40" style={{ fontSize: 17, minHeight: 54 }}>
          Continuer
        </button>
      </Screen>
    );
  }

  // ── Thèmes + nombre de questions ──
  if (phase === "config") {
    return (
      <Screen>
        <h1 className="cb-display-lg text-center">{names[0]} & {names[1]}</h1>
        <p className="af-eyebrow mt-6">Thèmes ({pool.length} questions)</p>
        <div className="mt-2 grid w-full max-w-sm grid-cols-2 gap-2">
          {QPACKS.map((p) => {
            const on = packs.includes(p.id);
            return (
              <button key={p.id} aria-pressed={on}
                onClick={() => setPacks((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]))}
                className="flex items-center gap-2 rounded-2xl px-3 text-left"
                style={{ minHeight: 52, background: on ? `${ACCENT}26` : "rgba(255,255,255,0.05)", border: `1.5px solid ${on ? ACCENT : "rgba(255,255,255,0.12)"}` }}>
                <span className="text-xl">{p.emoji}</span>
                <span className="min-w-0 flex-1 text-[14px] font-bold leading-tight">
                  {p.name}
                  {p.adult && <span className="block text-[12px] font-semibold" style={{ color: "#FF8CC8" }}>18+ · coquin</span>}
                </span>
                <span className="text-sm">{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
        <p className="af-eyebrow mt-6">Nombre de questions</p>
        <div className="mt-2 flex gap-2">
          {[6, 10, 16, 20].map((n) => (
            <button key={n} onClick={() => setRounds(n)} className="rounded-2xl px-4 text-base font-black"
              style={{ minHeight: 48, minWidth: 60, fontFamily: "var(--font-display)", background: rounds === n ? ACCENT : "rgba(255,255,255,0.06)", color: rounds === n ? "#3A0020" : "#fff", border: `1.5px solid ${rounds === n ? ACCENT : "rgba(255,255,255,0.14)"}` }}>
              {n}
            </button>
          ))}
        </div>
        <button disabled={pool.length < 2} onClick={begin} className="af-btn af-btn-primary mt-7 w-full max-w-sm disabled:opacity-40" style={{ fontSize: 17, minHeight: 54 }}>
          {pool.length < 2 ? "Choisis au moins un thème" : "C'est parti !"}
        </button>
        <button onClick={() => setPhase("names")} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>← Changer les prénoms</button>
      </Screen>
    );
  }

  // ── Pass to answerer ──
  if (phase === "pass-answer") {
    return <PassScreen toName={names[answerer]} colorIndex={answerer} accent={ACCENT}
      hint={`Réponds sur TOI, sans montrer l'écran. ${names[guesser]} devra deviner.`}
      buttonLabel="C'est moi — répondre" onReady={() => setPhase("answer")} />;
  }

  // ── Answerer picks their truth ──
  if (phase === "answer" && q) {
    return (
      <Screen>
        <div className="af-eyebrow mb-2" style={{ color: ACCENT }}>Question {round + 1}/{deck.length} · {names[answerer]} répond</div>
        <h2 className="cb-display-md mb-1 text-center">{names[answerer]}, toi tu es plutôt…</h2>
        <p className="mb-6 text-sm" style={{ color: "var(--text-dim)" }}>Réponds honnêtement (ne montre pas !)</p>
        <Choice a={q.a} b={q.b} onPick={onAnswer} />
      </Screen>
    );
  }

  // ── Pass to guesser ──
  if (phase === "pass-guess") {
    return <PassScreen toName={names[guesser]} colorIndex={guesser} accent={ACCENT}
      hint={`Devine ce que ${names[answerer]} a répondu sur soi.`}
      buttonLabel="C'est moi — deviner" onReady={() => setPhase("guess")} />;
  }

  // ── Guesser guesses ──
  if (phase === "guess" && q) {
    return (
      <Screen>
        <div className="af-eyebrow mb-2" style={{ color: ACCENT }}>Question {round + 1}/{deck.length} · {names[guesser]} devine</div>
        <h2 className="cb-display-md mb-1 text-center">{names[answerer]} est plutôt…</h2>
        <p className="mb-6 text-sm" style={{ color: "var(--text-dim)" }}>À ton avis, qu&apos;a répondu {names[answerer]} ?</p>
        <Choice a={q.a} b={q.b} onPick={onGuess} />
      </Screen>
    );
  }

  // ── Reveal ──
  if (phase === "reveal" && q) {
    const correct = guess === truth;
    const truthText = truth === "a" ? q.a : q.b;
    const guessText = guess === "a" ? q.a : q.b;
    return (
      <Screen>
        <div className="mb-2 text-6xl">{correct ? "💞" : "💔"}</div>
        <h1 className="cb-display-lg text-center" style={{ color: correct ? "#3DDC97" : "#FF6B5B" }}>{correct ? "Dans le mille !" : "Raté !"}</h1>
        <div className="mt-5 w-full max-w-sm space-y-2">
          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: `${ACCENT}66`, background: `${ACCENT}18` }}>
            <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{names[answerer]} est plutôt</div>
            <div className="text-lg font-bold">{truthText}</div>
          </div>
          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: "var(--line-soft)" }}>
            <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{names[guesser]} avait deviné</div>
            <div className="text-lg font-bold" style={{ color: correct ? "#3DDC97" : "#FF6B5B" }}>{guessText}</div>
          </div>
        </div>
        {!correct && <p className="mt-3 max-w-sm text-center text-[14px]" style={{ color: "var(--text-dim)" }}>💬 {names[answerer]}, explique-toi !</p>}
        <div className="mt-4 flex gap-4 text-center">
          <ScorePill name={names[0]} score={scores[0]} idx={0} />
          <ScorePill name={names[1]} score={scores[1]} idx={1} />
        </div>
        <button onClick={nextRound} className="af-btn af-btn-primary mt-6 w-full max-w-xs" style={{ fontSize: 16, minHeight: 54 }}>
          {round + 1 >= deck.length ? "Voir le résultat →" : "Question suivante →"}
        </button>
      </Screen>
    );
  }

  // ── Over ──
  if (phase === "over") {
    const total = scores[0] + scores[1];
    const pct = deck.length ? Math.round((total / deck.length) * 100) : 0;
    const verdict = verdictFor(pct);
    return (
      <Screen>
        {pct >= 65 && <ConfettiBurst count={60} />}
        <div className="af-eyebrow" style={{ color: "var(--text-dim)" }}>Taux de complicité</div>
        <div className="my-1 text-7xl font-extrabold" style={{ color: verdict.c }}>{pct} %</div>
        <h1 className="cb-display-md text-center" style={{ color: verdict.c }}>{verdict.t}</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>{total} bonne{total > 1 ? "s" : ""} réponse{total > 1 ? "s" : ""} sur {deck.length}</p>
        <div className="mt-5 flex gap-5">
          <ScorePill name={names[0]} score={scores[0]} idx={0} big />
          <ScorePill name={names[1]} score={scores[1]} idx={1} big />
        </div>
        <div className="mt-7 flex w-full max-w-xs flex-col gap-1">
          <button onClick={begin} className="af-btn af-btn-primary" style={{ fontSize: 16, minHeight: 54 }}>Rejouer (nouvelles questions)</button>
          <button onClick={() => setPhase("config")} className="text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>Changer les thèmes</button>
          {onReturnToLobby && <button onClick={onReturnToLobby} className="text-sm" style={{ color: "var(--text-muted)", minHeight: 44 }}>Quitter</button>}
        </div>
      </Screen>
    );
  }

  return null;
}

function Choice({ a, b, onPick }: { a: string; b: string; onPick: (p: "a" | "b") => void }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {(["a", "b"] as const).map((side) => (
        <button key={side} onClick={() => onPick(side)}
          className="rounded-3xl border p-5 text-center text-lg font-semibold transition active:scale-[0.98]"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--line-soft)", minHeight: 76, overflowWrap: "anywhere" }}>
          {side === "a" ? a : b}
        </button>
      ))}
    </div>
  );
}

function ScorePill({ name, score, idx, big }: { name: string; score: number; idx: number; big?: boolean }) {
  const c = colorForIndex(idx);
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center rounded-full font-extrabold"
        style={{ width: big ? 64 : 44, height: big ? 64 : 44, background: `${c}33`, border: `2px solid ${c}`, fontSize: big ? 26 : 18 }}>{score}</div>
      <div className="mt-1 text-xs font-semibold">{name}</div>
    </div>
  );
}

/* ════════════════ MODE EN LIGNE (2 téléphones à distance) ════════════════ */
interface OnlineState {
  started: boolean;
  phase: "lobby" | "answer" | "guess" | "reveal" | "over";
  round: number;
  total: number;
  players: { id: string; name: string }[];
  answererId: string | null;
  guesserId: string | null;
  question: { a: string; b: string } | null;
  truth: "a" | "b" | null;
  guess: "a" | "b" | null;
  scores: Record<string, number>;
}

function Waiting({ title, sub }: { title: string; sub?: string }) {
  return (
    <LocalShell accent={ACCENT} center>
      <div className="text-5xl mb-3">⏳</div>
      <h2 className="cb-display-md text-center">{title}</h2>
      {sub && <p className="mt-2 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>{sub}</p>}
    </LocalShell>
  );
}

function CoupleQuizOnline({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const { sendAction } = useGame(roomCode, "couple-quiz", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as unknown as OnlineState | null;

  // salon d'attente
  if (!state || !state.started) {
    const here = state?.players?.length ?? 0;
    return (
      <LocalShell accent={ACCENT} center>
        <div className="text-6xl mb-3">❤️</div>
        <h1 className="cb-display-lg text-center sm:text-5xl">Tu me connais ?</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>En ligne · <b style={{ color: "#fff" }}>{here}/2</b> joueurs connectés</p>
        <p className="mt-4 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>
          Ton/ta partenaire doit rejoindre <b style={{ color: "#fff" }}>la même salle</b> (code <b style={{ color: ACCENT }}>{roomCode}</b>) et choisir « Plusieurs téléphones ». Le jeu démarre dès que vous êtes 2.
        </p>
        <button onClick={onReturnToLobby} className="mt-7 text-sm" style={{ color: "var(--text-muted)" }}>← Quitter</button>
      </LocalShell>
    );
  }

  const players = state.players ?? [];
  const me = players.find((p) => p.id === playerId);
  const answererName = players.find((p) => p.id === state.answererId)?.name ?? "?";
  const guesserName = players.find((p) => p.id === state.guesserId)?.name ?? "?";
  const amAnswerer = state.answererId === playerId;
  const amGuesser = state.guesserId === playerId;
  const q = state.question;

  if (!me) return <Waiting title="Partie en cours" sub="« Tu me connais ? » se joue à 2. Les deux places sont prises." />;

  // fin
  if (state.phase === "over") {
    const s0 = state.scores[players[0]?.id] ?? 0;
    const s1 = state.scores[players[1]?.id] ?? 0;
    const total = s0 + s1;
    const pct = state.total ? Math.round((total / state.total) * 100) : 0;
    const v = verdictFor(pct);
    return (
      <LocalShell accent={ACCENT} center>
        <div className="af-eyebrow" style={{ color: "var(--text-dim)" }}>Taux de complicité</div>
        <div className="my-1 text-7xl font-extrabold" style={{ color: v.c }}>{pct}%</div>
        <h1 className="cb-display-md text-center" style={{ color: v.c }}>{v.t}</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>{total} bonnes devinettes sur {state.total}</p>
        <div className="mt-5 flex gap-5">
          <ScorePill name={players[0]?.name ?? "J1"} score={s0} idx={0} big />
          <ScorePill name={players[1]?.name ?? "J2"} score={s1} idx={1} big />
        </div>
        <div className="mt-7 flex w-full max-w-xs flex-col gap-2">
          <button onClick={() => sendAction({ action: "restart" })} className="af-btn af-btn-primary" style={{ fontSize: 16 }}>Rejouer</button>
          <button onClick={onReturnToLobby} className="text-sm" style={{ color: "var(--text-muted)" }}>Quitter</button>
        </div>
      </LocalShell>
    );
  }

  // phase réponse
  if (state.phase === "answer") {
    if (amAnswerer && q) {
      return (
        <LocalShell accent={ACCENT} center>
          <div className="af-eyebrow mb-2" style={{ color: ACCENT }}>Manche {state.round + 1}/{state.total} · à toi</div>
          <h2 className="cb-display-sm mb-1 text-center sm:cb-display-md">Toi, tu es plutôt…</h2>
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>Réponds honnêtement — {guesserName} va deviner.</p>
          <Choice a={q.a} b={q.b} onPick={(p) => sendAction({ action: "answer", pick: p })} />
        </LocalShell>
      );
    }
    return <Waiting title={`${answererName} répond…`} sub="Patiente, ce sera bientôt à toi de deviner." />;
  }

  // phase devinette
  if (state.phase === "guess") {
    if (amGuesser && q) {
      return (
        <LocalShell accent={ACCENT} center>
          <div className="af-eyebrow mb-2" style={{ color: ACCENT }}>Manche {state.round + 1}/{state.total} · devine</div>
          <h2 className="cb-display-sm mb-1 text-center sm:cb-display-md">{answererName} est plutôt…</h2>
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>À ton avis, qu&apos;a répondu {answererName} ?</p>
          <Choice a={q.a} b={q.b} onPick={(p) => sendAction({ action: "guess", pick: p })} />
        </LocalShell>
      );
    }
    return <Waiting title={`${guesserName} devine…`} sub={`${guesserName} essaie de retrouver ta réponse.`} />;
  }

  // révélation
  if (state.phase === "reveal" && q) {
    const correct = state.guess === state.truth;
    const truthText = state.truth === "a" ? q.a : q.b;
    const guessText = state.guess === "a" ? q.a : q.b;
    const s0 = state.scores[players[0]?.id] ?? 0;
    const s1 = state.scores[players[1]?.id] ?? 0;
    return (
      <LocalShell accent={ACCENT} center>
        <div className="text-6xl mb-2">{correct ? "💞" : "💔"}</div>
        <h1 className="cb-display-md text-center" style={{ color: correct ? "#3DDC97" : "#FF6B5B" }}>{correct ? "Dans le mille !" : "Raté !"}</h1>
        <div className="mt-5 w-full max-w-sm space-y-2">
          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: `${ACCENT}66`, background: `${ACCENT}18` }}>
            <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>{answererName} est plutôt</div>
            <div className="text-lg font-bold">{truthText}</div>
          </div>
          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: "var(--line-soft)" }}>
            <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>{guesserName} avait deviné</div>
            <div className="text-lg font-bold" style={{ color: correct ? "#3DDC97" : "#FF6B5B" }}>{guessText}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-center">
          <ScorePill name={players[0]?.name ?? "J1"} score={s0} idx={0} />
          <ScorePill name={players[1]?.name ?? "J2"} score={s1} idx={1} />
        </div>
        <button onClick={() => sendAction({ action: "next" })} className="af-btn af-btn-primary mt-6 w-full max-w-xs" style={{ fontSize: 16 }}>
          {state.round + 1 >= state.total ? "Voir le résultat →" : "Manche suivante →"}
        </button>
      </LocalShell>
    );
  }

  return <Waiting title="Connexion…" />;
}
