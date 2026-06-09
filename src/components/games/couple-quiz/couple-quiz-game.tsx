"use client";

/**
 * TU ME CONNAIS ? — quiz de couple/duo sur un seul téléphone.
 * À chaque manche : l'un répond sur lui-même en secret, l'autre devine.
 * Bonne réponse = 1 point pour celui qui devine. On alterne les rôles.
 * À la fin : taux de complicité. 100% local (LocalGame stub).
 */

import { useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { LocalShell, PassScreen, PlayersSetup, colorForIndex } from "@/components/games/local-kit";

const ACCENT = "#FF6BAE";
const ROUNDS = 12;

interface Q { a: string; b: string; }
// Chaque question = « plutôt A ou B ? » à propos de celui qui répond.
const QUESTIONS: Q[] = [
  { a: "grasse matinée", b: "lève-tôt" },
  { a: "plage", b: "montagne" },
  { a: "sucré", b: "salé" },
  { a: "film d'horreur", b: "comédie romantique" },
  { a: "soirée canapé", b: "sortir dehors" },
  { a: "thé", b: "café" },
  { a: "chien", b: "chat" },
  { a: "pizza", b: "burger" },
  { a: "Netflix à la maison", b: "ciné" },
  { a: "appeler", b: "envoyer un texto" },
  { a: "fête surprise", b: "soirée tranquille" },
  { a: "cuisiner maison", b: "commander" },
  { a: "douche le matin", b: "douche le soir" },
  { a: "bain", b: "douche" },
  { a: "vacances organisées", b: "à l'aventure" },
  { a: "tatouage", b: "piercing" },
  { a: "garder son calme", b: "exploser puis ça passe" },
  { a: "romantique", b: "rigolo·te" },
  { a: "plutôt frileux·se", b: "toujours trop chaud" },
  { a: "arriver en avance", b: "toujours à la bourre" },
  { a: "sortie resto", b: "pique-nique improvisé" },
  { a: "musique à fond", b: "podcast tranquille" },
  { a: "ranger au fur et à mesure", b: "grand ménage d'un coup" },
  { a: "série à binge-watcher", b: "un épisode par soir" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

type Phase = "setup" | "pass-answer" | "answer" | "pass-guess" | "guess" | "reveal" | "over";

export default function CoupleQuizGame({ onReturnToLobby }: GameProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [names, setNames] = useState<string[]>([]);
  const [deck, setDeck] = useState<Q[]>([]);
  const [round, setRound] = useState(0);
  const [answerer, setAnswerer] = useState(0); // index 0/1
  const [truth, setTruth] = useState<"a" | "b" | null>(null);
  const [guess, setGuess] = useState<"a" | "b" | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);

  const guesser = 1 - answerer;
  const q = deck[round];

  const begin = (picked: string[]) => {
    setNames(picked.slice(0, 2));
    setDeck(shuffle(QUESTIONS).slice(0, ROUNDS));
    setRound(0); setAnswerer(0); setScores([0, 0]); setTruth(null); setGuess(null);
    setPhase("pass-answer");
  };

  const onAnswer = (pick: "a" | "b") => { setTruth(pick); setPhase("pass-guess"); };
  const onGuess = (pick: "a" | "b") => {
    setGuess(pick);
    if (pick === truth) setScores((s) => (guesser === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
    setPhase("reveal");
  };
  const nextRound = () => {
    if (round + 1 >= deck.length) { setPhase("over"); return; }
    setRound(round + 1); setAnswerer((a) => 1 - a); setTruth(null); setGuess(null);
    setPhase("pass-answer");
  };
  const restart = () => { setPhase("setup"); };

  // ── Setup ──
  if (phase === "setup") {
    return <PlayersSetup emoji="❤️" name="Tu me connais ?" min={2} max={2} accent={ACCENT} onStart={begin} onBack={onReturnToLobby} />;
  }

  // ── Pass to answerer ──
  if (phase === "pass-answer") {
    return <PassScreen toName={names[answerer]} colorIndex={answerer} accent={ACCENT}
      hint={`Réponds sur TOI, sans montrer. ${names[guesser]} devra deviner.`}
      buttonLabel="C'est moi — répondre" onReady={() => setPhase("answer")} />;
  }

  // ── Answerer picks their truth ──
  if (phase === "answer" && q) {
    return (
      <LocalShell accent={ACCENT} center>
        <div className="af-eyebrow mb-2" style={{ color: ACCENT }}>Manche {round + 1}/{deck.length} · {names[answerer]} répond</div>
        <h2 className="cb-display-sm mb-1 text-center sm:cb-display-md">Toi, {names[answerer]}, tu es plutôt…</h2>
        <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>Réponds honnêtement (ne montre pas !)</p>
        <Choice a={q.a} b={q.b} onPick={onAnswer} />
      </LocalShell>
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
      <LocalShell accent={ACCENT} center>
        <div className="af-eyebrow mb-2" style={{ color: ACCENT }}>Manche {round + 1}/{deck.length} · {names[guesser]} devine</div>
        <h2 className="cb-display-sm mb-1 text-center sm:cb-display-md">{names[answerer]} est plutôt…</h2>
        <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>À ton avis, qu&apos;a répondu {names[answerer]} ?</p>
        <Choice a={q.a} b={q.b} onPick={onGuess} />
      </LocalShell>
    );
  }

  // ── Reveal ──
  if (phase === "reveal" && q) {
    const correct = guess === truth;
    const truthText = truth === "a" ? q.a : q.b;
    const guessText = guess === "a" ? q.a : q.b;
    return (
      <LocalShell accent={ACCENT} center>
        <div className="text-6xl mb-2">{correct ? "💞" : "💔"}</div>
        <h1 className="cb-display-md text-center" style={{ color: correct ? "#3DDC97" : "#FF6B5B" }}>{correct ? "Dans le mille !" : "Raté !"}</h1>
        <div className="mt-5 w-full max-w-sm space-y-2">
          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: `${ACCENT}66`, background: `${ACCENT}18` }}>
            <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>{names[answerer]} est plutôt</div>
            <div className="text-lg font-bold">{truthText}</div>
          </div>
          <div className="rounded-2xl border p-3 text-center" style={{ borderColor: "var(--line-soft)" }}>
            <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>{names[guesser]} avait deviné</div>
            <div className="text-lg font-bold" style={{ color: correct ? "#3DDC97" : "#FF6B5B" }}>{guessText}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-center">
          <ScorePill name={names[0]} score={scores[0]} idx={0} />
          <ScorePill name={names[1]} score={scores[1]} idx={1} />
        </div>
        <button onClick={nextRound} className="af-btn af-btn-primary mt-6 w-full max-w-xs" style={{ fontSize: 16 }}>
          {round + 1 >= deck.length ? "Voir le résultat →" : "Manche suivante →"}
        </button>
      </LocalShell>
    );
  }

  // ── Over ──
  if (phase === "over") {
    const total = scores[0] + scores[1];
    const pct = deck.length ? Math.round((total / deck.length) * 100) : 0;
    const verdict = pct >= 85 ? { t: "Âmes sœurs 💍", c: "#3DDC97" }
      : pct >= 65 ? { t: "Sacrée complicité ❤️", c: "#FFD23F" }
      : pct >= 45 ? { t: "Encore des choses à découvrir 👀", c: "#FF8A3D" }
      : { t: "Premier rendez-vous ? 😅", c: "#FF6B5B" };
    return (
      <LocalShell accent={ACCENT} center>
        <div className="af-eyebrow" style={{ color: "var(--text-dim)" }}>Taux de complicité</div>
        <div className="my-1 text-7xl font-extrabold" style={{ color: verdict.c }}>{pct}%</div>
        <h1 className="cb-display-md text-center" style={{ color: verdict.c }}>{verdict.t}</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>{total} bonnes devinettes sur {deck.length}</p>
        <div className="mt-5 flex gap-5">
          <ScorePill name={names[0]} score={scores[0]} idx={0} big />
          <ScorePill name={names[1]} score={scores[1]} idx={1} big />
        </div>
        <div className="mt-7 flex w-full max-w-xs flex-col gap-2">
          <button onClick={() => begin(names)} className="af-btn af-btn-primary" style={{ fontSize: 16 }}>Rejouer</button>
          <button onClick={restart} className="text-sm" style={{ color: "var(--text-muted)" }}>Changer de joueurs</button>
          <button onClick={onReturnToLobby} className="text-sm" style={{ color: "var(--text-muted)" }}>Quitter</button>
        </div>
      </LocalShell>
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
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--line-soft)", minHeight: 76 }}>
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
