"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { PlayersSetup, PassScreen, LocalShell, colorForIndex } from "@/components/games/local-kit";
import { Mascot } from "@/components/Mascot";

// ── Pile Poil ⏱️ ───────────────────────────────────────────
// Tout le jeu tourne sur le tél « manette » (pass-and-play). Le temps
// officiel = performance.now() entre les 2 taps, donc zéro latence réseau.
// Un 2e tél « écran » affiche le chrono en direct — seul le public voit si
// ça dépasse, le joueur compte à l'aveugle.

type PPMode = "closest" | "no-over"; // le plus proche / sans dépasser

interface Attempt {
  name: string;
  elapsedMs: number; // -1 = pas encore passé
  over: boolean;
}

const TARGET_PRESETS = [5, 7, 10, 15];
const FUN_TARGETS = [4, 5, 6.5, 7, 8, 9.5, 10, 11.11, 12, 13.37, 15];

const fmt = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
const fmtDelta = (ms: number, target: number) => {
  const d = ms - target * 1000;
  return `${d >= 0 ? "+" : "−"}${(Math.abs(d) / 1000).toFixed(2)} s`;
};

// Classement d'une manche : sans-dépasser → les "over" derrière, sinon écart absolu
function rankAttempts(attempts: Attempt[], target: number, mode: PPMode): Attempt[] {
  const gap = (a: Attempt) => Math.abs(a.elapsedMs - target * 1000);
  return [...attempts].sort((a, b) => {
    if (mode === "no-over" && a.over !== b.over) return a.over ? 1 : -1;
    return gap(a) - gap(b);
  });
}

export default function PilePoilGame({ roomCode, playerId, playerName }: GameProps) {
  const [role, setRole] = useState<"pick" | "duel" | "screen" | "pad">("pick");

  if (role === "pick") {
    return (
      <LocalShell accent="#00C2A8" center>
        <span className="text-6xl">⏱️</span>
        <h1 className="cb-display-lg mt-3 text-center">Pile Poil</h1>
        <p className="mt-2 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>
          Compte les secondes dans ta tête, l&apos;autre voit ton chrono en direct.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button onClick={() => setRole("duel")} className="af-btn af-btn-primary" style={{ fontSize: 16 }}>
            🔘 Le Bouton — c&apos;est moi qui joue
          </button>
          <button onClick={() => setRole("screen")} className="af-btn af-btn-primary" style={{ fontSize: 16, background: "linear-gradient(160deg,#4180D8,#2A5BB0)" }}>
            📺 L&apos;Écran — je vois son chrono
          </button>
          <button onClick={() => setRole("pad")} className="af-btn af-btn-ghost" style={{ fontSize: 14 }}>
            👥 Tournoi — tout sur ce tél (2-10 joueurs)
          </button>
        </div>
        <p className="mt-4 max-w-xs text-center text-[11px]" style={{ color: "var(--text-dim)" }}>
          À 2 : un tél prend « Le Bouton », l&apos;autre « L&apos;Écran » (même room). Le temps max se règle sur l&apos;écran — ou pas, il est optionnel.
        </p>
      </LocalShell>
    );
  }

  if (role === "duel") return <DuelPad roomCode={roomCode} playerId={playerId} playerName={playerName} />;
  if (role === "screen") return <ScreenView roomCode={roomCode} playerId={playerId} playerName={playerName} />;
  return <PadView roomCode={roomCode} playerId={playerId} playerName={playerName} />;
}

// ══════════════════════════════════════════════════════════
// LE BOUTON (duel 2 téls) — zéro config : GO, STOP, résultat
// ══════════════════════════════════════════════════════════
function DuelPad({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "pile-poil", playerId, playerName);
  const { gameState, isConnected } = useGameStore();
  const [st, setSt] = useState<"idle" | "running" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [maxTime, setMaxTime] = useState<number | null>(null); // réglé sur l'écran, optionnel
  const startRef = useRef(0);
  const seenSeq = useRef(-1);

  // Annonce le mode duel à chaque (re)connexion — idempotent, et résiste au
  // double-montage du Strict Mode (le 1er envoi part sur un socket déjà fermé).
  useEffect(() => {
    if (!isConnected) return;
    sendAction({ action: "pp-sync", seq: Math.floor(Math.random() * 1e9), view: "duel" });
  }, [isConnected, sendAction]);

  // Temps max (optionnel) poussé par l'écran à tout moment
  const raw = gameState as unknown as { action?: string; seq?: number; target?: number | null; t0?: number; sid?: string };
  useEffect(() => {
    if (!raw?.action || raw.seq === undefined || raw.seq === seenSeq.current) return;
    seenSeq.current = raw.seq;
    if (raw.action === "pp-target") {
      setMaxTime(typeof raw.target === "number" ? raw.target : null);
    }
    // Écho de sync d'horloge : réponse immédiate, l'écran calcule son décalage
    if (raw.action === "pp-ping" && raw.t0 != null) {
      sendAction({ action: "pp-pong", seq: Math.floor(Math.random() * 1e9), t0: raw.t0, sid: raw.sid, tPad: Date.now() });
    }
  }, [raw, sendAction]);

  const go = () => {
    startRef.current = performance.now();
    setSt("running");
    sendAction({
      action: "pp-start",
      seq: Math.floor(Math.random() * 1e9),
      playerName: "Le joueur",
      target: maxTime,
      mode: "free",
      startAt: Date.now(), // horodatage exact du tap → l'écran affiche le vrai temps écoulé
    });
  };
  const stop = () => {
    const e = performance.now() - startRef.current;
    setElapsed(e);
    setSt("done");
    sendAction({ action: "pp-stop", seq: Math.floor(Math.random() * 1e9), elapsedMs: e, target: maxTime, mode: "free" });
  };

  const reset = () => {
    setSt("idle");
    setElapsed(0);
    sendAction({ action: "pp-reset", seq: Math.floor(Math.random() * 1e9) });
  };

  const running = st === "running";
  void elapsed; // le temps ne s'affiche JAMAIS sur ce tél — seul l'écran le voit

  return (
    <div
      className="flex min-h-dvh select-none flex-col items-center justify-center px-6 text-center"
      style={{ background: "radial-gradient(120% 80% at 50% 0%, #06302A 0%, #020D0B 100%)", touchAction: "manipulation" }}
    >
      <p className="af-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
        {maxTime != null ? `Temps max : ${maxTime} s` : "Chrono libre"}
      </p>
      <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
        {running
          ? "🤫 Compte dans ta tête…"
          : st === "done"
            ? "⏸️ Pause — le temps s'affiche sur l'autre tél. Réappuie pour repartir."
            : "Appuie pour lancer — l'autre tél voit tout"}
      </p>
      <button
        onClick={running ? stop : go}
        className="mt-8 flex h-56 w-56 items-center justify-center rounded-full text-3xl font-black transition-transform active:scale-95"
        style={{
          fontFamily: "var(--font-display)",
          color: running ? "#2A0808" : "#04211C",
          background: running
            ? "radial-gradient(circle at 35% 30%, #FF8A7A, #E23434)"
            : "radial-gradient(circle at 35% 30%, #5FF5DD, #00C2A8)",
          border: "4px solid rgba(255,255,255,0.35)",
          boxShadow: running ? "0 0 60px rgba(226,52,52,0.5)" : "0 0 60px rgba(0,194,168,0.45)",
        }}
      >
        {running ? "⏸ PAUSE" : "GO"}
      </button>
      {st === "done" && (
        <button onClick={reset} className="af-btn af-btn-ghost mt-6 w-full max-w-[14rem]" style={{ fontSize: 15 }}>
          ↺ Réinitialiser
        </button>
      )}
      {st === "idle" && (
        <p className="mt-6 max-w-xs text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          Le temps max se règle sur l&apos;autre tél (optionnel) — sinon on l&apos;annonce à l&apos;oral.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MANETTE — toute la logique de jeu, temps mesuré ICI
// ══════════════════════════════════════════════════════════
type PadPhase = "setup" | "config" | "await-target" | "pass" | "ready" | "running" | "reveal" | "board" | "recap";

function PadView({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "pile-poil", playerId, playerName);
  const { gameState } = useGameStore();

  const [phase, setPhase] = useState<PadPhase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [wins, setWins] = useState<number[]>([]);
  const [mode, setMode] = useState<PPMode>("closest");
  const [target, setTarget] = useState(7);
  const [manche, setManche] = useState(1);
  const [turnIdx, setTurnIdx] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [lastElapsed, setLastElapsed] = useState(0);
  const startRef = useRef(0);
  const seqRef = useRef(0);

  // Snapshot → l'écran public reste synchro à chaque transition
  const sync = useCallback(
    (extra: Record<string, unknown>) => {
      sendAction({
        action: "pp-sync",
        seq: ++seqRef.current,
        players,
        wins,
        mode,
        target,
        manche,
        turnIdx,
        attempts,
        ...extra,
      });
    },
    [sendAction, players, wins, mode, target, manche, turnIdx, attempts]
  );

  const beginMatch = (names: string[]) => {
    setPlayers(names);
    setWins(names.map(() => 0));
    setPhase("config");
  };

  const beginRound = (targetOverride?: number) => {
    if (targetOverride != null) setTarget(targetOverride);
    setAttempts([]);
    setTurnIdx(0);
    setPhase("pass");
    sync({ view: "pass", turnIdx: 0, attempts: [], ...(targetOverride != null ? { target: targetOverride } : {}) });
  };

  // La cible peut être choisie sur le tél « écran » (annoncée à l'oral ici)
  const padSeq = useRef(-1);
  const raw = gameState as unknown as { action?: string; seq?: number; target?: number; t0?: number; sid?: string };
  useEffect(() => {
    if (!raw?.action || raw.seq === undefined || raw.seq === padSeq.current) return;
    padSeq.current = raw.seq;
    if (raw.action === "pp-target" && phase === "await-target" && typeof raw.target === "number" && raw.target >= 1 && raw.target <= 120) {
      beginRound(raw.target);
    }
    // Écho de sync d'horloge pour l'écran (précision du chrono live)
    if (raw.action === "pp-ping" && raw.t0 != null) {
      sendAction({ action: "pp-pong", seq: Math.floor(Math.random() * 1e9), t0: raw.t0, sid: raw.sid, tPad: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw?.seq]);

  const onStartTap = () => {
    startRef.current = performance.now();
    setPhase("running");
    sendAction({ action: "pp-start", seq: ++seqRef.current, playerName: players[turnIdx], target, mode, startAt: Date.now() });
  };

  const onStopTap = () => {
    const elapsed = performance.now() - startRef.current;
    setLastElapsed(elapsed);
    const attempt: Attempt = {
      name: players[turnIdx],
      elapsedMs: elapsed,
      over: elapsed > target * 1000,
    };
    const next = [...attempts, attempt];
    setAttempts(next);
    setPhase("reveal");
    sendAction({ action: "pp-stop", seq: ++seqRef.current, elapsedMs: elapsed, playerName: players[turnIdx], target, mode });
  };

  const nextTurn = () => {
    if (turnIdx + 1 < players.length) {
      setTurnIdx(turnIdx + 1);
      setPhase("pass");
      sync({ view: "pass", turnIdx: turnIdx + 1 });
    } else {
      // Fin de manche → le meilleur gagne
      const ranked = rankAttempts(attempts, target, mode);
      const winnerIdx = players.indexOf(ranked[0]?.name ?? "");
      if (winnerIdx >= 0) {
        setWins((w) => w.map((v, i) => (i === winnerIdx ? v + 1 : v)));
      }
      setPhase("board");
      sync({ view: "board" });
    }
  };

  const nextRound = () => {
    setManche((m) => m + 1);
    // Nouvelle cible fun différente de l'actuelle
    const pool = FUN_TARGETS.filter((t) => t !== target);
    setTarget(pool[Math.floor(Math.random() * pool.length)]);
    setPhase("config");
  };

  // ── Écrans ──────────────────────────────────────────────
  if (phase === "setup") {
    return <PlayersSetup emoji="⏱️" name="Pile Poil" min={1} max={10} accent="#00C2A8" onStart={beginMatch} />;
  }

  if (phase === "config") {
    return (
      <LocalShell accent="#00C2A8" center>
        <p className="af-eyebrow">Manche {manche}</p>
        <h2 className="cb-display-lg mt-1">La cible</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {TARGET_PRESETS.map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className="rounded-2xl px-5 py-3 text-lg font-black"
              style={{
                fontFamily: "var(--font-display)",
                background: target === t ? "#00C2A8" : "rgba(255,255,255,0.06)",
                color: target === t ? "#04211C" : "#fff",
                border: `1.5px solid ${target === t ? "#00C2A8" : "rgba(255,255,255,0.15)"}`,
              }}
            >
              {t} s
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => setTarget((t) => Math.max(3, Math.round((t - 0.5) * 2) / 2))} className="af-btn af-btn-ghost h-11 w-11 !p-0 text-xl">
            −
          </button>
          <span className="w-24 text-center text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
            {target} s
          </span>
          <button onClick={() => setTarget((t) => Math.min(60, Math.round((t + 0.5) * 2) / 2))} className="af-btn af-btn-ghost h-11 w-11 !p-0 text-xl">
            +
          </button>
        </div>

        <p className="af-eyebrow mt-7">La règle</p>
        <div className="mt-2 flex w-full max-w-sm flex-col gap-2">
          {(
            [
              { key: "closest", label: "🎯 Le plus proche", desc: "Le plus éloigné de la cible perd la manche (et boit)" },
              { key: "no-over", label: "🚫 Sans dépasser", desc: "Comme au Juste Prix : tu dépasses la cible = perdu direct" },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="rounded-2xl px-4 py-3 text-left"
              style={{
                background: mode === m.key ? "rgba(0,194,168,0.16)" : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${mode === m.key ? "#00C2A8" : "rgba(255,255,255,0.12)"}`,
              }}
            >
              <p className="text-sm font-black text-white">{m.label}</p>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-dim)" }}>
                {m.desc}
              </p>
            </button>
          ))}
        </div>
        <button onClick={() => beginRound()} className="af-btn af-btn-primary mt-7 w-full max-w-xs" style={{ fontSize: 16 }}>
          C&apos;est parti !
        </button>
        <button
          onClick={() => {
            setPhase("await-target");
            sync({ view: "pick-target" });
          }}
          className="af-btn af-btn-ghost mt-2 w-full max-w-xs"
          style={{ fontSize: 14 }}
        >
          📺 C&apos;est l&apos;écran qui choisit la cible
        </button>
        <p className="mt-2 max-w-xs text-center text-[11px]" style={{ color: "var(--text-dim)" }}>
          Quelqu&apos;un annonce la cible à l&apos;oral ? Le tél « Écran » la saisit et la manche démarre toute seule.
        </p>
      </LocalShell>
    );
  }

  if (phase === "await-target") {
    return (
      <LocalShell accent="#00C2A8" center>
        <span className="text-6xl">📺</span>
        <h2 className="cb-display-lg mt-3 text-center">L&apos;écran choisit…</h2>
        <p className="mt-2 max-w-xs text-center text-sm" style={{ color: "var(--text-dim)" }}>
          En attente de la cible saisie sur le tél « Écran ». Dès qu&apos;elle est validée, la manche démarre ici.
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-white/60">
          <span className="inline-block h-2 w-2 animate-ping rounded-full" style={{ background: "#00C2A8" }} />
          En attente…
        </div>
        <button
          onClick={() => {
            setPhase("config");
            sync({ view: "board" });
          }}
          className="af-btn af-btn-ghost mt-8 w-full max-w-xs"
        >
          ← Revenir au réglage manuel
        </button>
      </LocalShell>
    );
  }

  if (phase === "pass") {
    return (
      <PassScreen
        toName={players[turnIdx]}
        colorIndex={turnIdx}
        accent="#00C2A8"
        hint={`Cible : ${target} s · compte dans ta tête, le chrono est invisible !`}
        buttonLabel="C'est moi — prêt"
        onReady={() => setPhase("ready")}
      />
    );
  }

  if (phase === "ready" || phase === "running") {
    const running = phase === "running";
    return (
      <div
        className="flex min-h-dvh select-none flex-col items-center justify-center px-6"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, #06302A 0%, #020D0B 100%)", touchAction: "manipulation" }}
      >
        <p className="af-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          {players[turnIdx]} · manche {manche}
        </p>
        <p className="mt-2 text-6xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          {target} s
        </p>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          {running ? "🤫 Compte dans ta tête…" : mode === "no-over" ? "Sans dépasser !" : "Au plus proche !"}
        </p>
        <button
          onClick={running ? onStopTap : onStartTap}
          className="mt-10 flex h-56 w-56 items-center justify-center rounded-full text-3xl font-black transition-transform active:scale-95"
          style={{
            fontFamily: "var(--font-display)",
            color: running ? "#2A0808" : "#04211C",
            background: running
              ? "radial-gradient(circle at 35% 30%, #FF8A7A, #E23434)"
              : "radial-gradient(circle at 35% 30%, #5FF5DD, #00C2A8)",
            border: "4px solid rgba(255,255,255,0.35)",
            boxShadow: running ? "0 0 60px rgba(226,52,52,0.5)" : "0 0 60px rgba(0,194,168,0.45)",
          }}
        >
          {running ? "STOP" : "GO"}
        </button>
        {running && (
          <p className="mt-8 text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Aucun indice ici — le public, lui, voit tout 👀
          </p>
        )}
      </div>
    );
  }

  if (phase === "reveal") {
    const over = lastElapsed > target * 1000;
    const gapMs = Math.abs(lastElapsed - target * 1000);
    const perfect = gapMs <= 150;
    return (
      <LocalShell accent="#00C2A8" center>
        <Mascot size={110} color={colorForIndex(turnIdx)} mood={perfect ? "mindblown" : over && mode === "no-over" ? "dead" : "happy"} arms />
        <p className="af-eyebrow mt-4">{players[turnIdx]}</p>
        <p className="cb-display-lg mt-1" style={{ fontSize: 56 }}>
          {fmt(lastElapsed)}
        </p>
        <p
          className="mt-1 text-xl font-black"
          style={{ fontFamily: "var(--font-display)", color: perfect ? "#FFD23F" : over ? "#FF6A5B" : "#5FF5DD" }}
        >
          {perfect ? "PILE POIL ! 🎯" : `${fmtDelta(lastElapsed, target)} ${over ? "· dépassé !" : ""}`}
        </p>
        {mode === "no-over" && over && (
          <p className="mt-2 text-sm font-bold" style={{ color: "#FF6A5B" }}>
            Éliminé de la manche 🥴
          </p>
        )}
        <button onClick={nextTurn} className="af-btn af-btn-primary mt-8 w-full max-w-xs" style={{ fontSize: 16 }}>
          {turnIdx + 1 < players.length ? `Au tour de ${players[turnIdx + 1]} →` : "Résultats de la manche"}
        </button>
      </LocalShell>
    );
  }

  if (phase === "board") {
    const ranked = rankAttempts(attempts, target, mode);
    const loser = ranked[ranked.length - 1];
    return (
      <LocalShell accent="#00C2A8">
        <p className="af-eyebrow mt-2">Manche {manche} · cible {target} s</p>
        <h2 className="cb-display-lg mt-1">Résultats</h2>
        <div className="mt-5 w-full max-w-sm space-y-2">
          {ranked.map((a, i) => (
            <div
              key={a.name}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{
                background: i === 0 ? "rgba(255,210,63,0.12)" : "rgba(255,255,255,0.05)",
                border: i === 0 ? "1.5px solid rgba(255,210,63,0.5)" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-sm font-bold text-white">
                {i === 0 ? "👑" : `${i + 1}.`} {a.name}
              </span>
              <span className={cn("text-sm font-black")} style={{ color: a.over ? "#FF6A5B" : "#5FF5DD", fontFamily: "var(--font-display)" }}>
                {fmt(a.elapsedMs)} ({fmtDelta(a.elapsedMs, target)})
              </span>
            </div>
          ))}
        </div>
        {loser && players.length > 1 && (
          <p className="mt-4 text-center text-base font-black" style={{ color: "#FF6A5B", fontFamily: "var(--font-display)" }}>
            🍺 {loser.name} boit !
          </p>
        )}
        <div className="mt-6 flex w-full max-w-sm gap-2">
          <button onClick={nextRound} className="af-btn af-btn-primary flex-1">
            Manche suivante
          </button>
          <button
            onClick={() => {
              setPhase("recap");
              sync({ view: "recap" });
            }}
            className="af-btn af-btn-ghost"
          >
            Terminer
          </button>
        </div>
      </LocalShell>
    );
  }

  // Recap
  const standings = players
    .map((name, i) => ({ name, wins: wins[i] ?? 0 }))
    .sort((a, b) => b.wins - a.wins);
  return (
    <LocalShell accent="#00C2A8" center>
      <span className="text-6xl">🏆</span>
      <h2 className="cb-display-lg mt-3">Fin de partie</h2>
      <div className="mt-5 w-full max-w-sm space-y-2">
        {standings.map((s, i) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: i === 0 ? "rgba(255,210,63,0.12)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span className="text-sm font-bold text-white">
              {i === 0 ? "👑" : `${i + 1}.`} {s.name}
            </span>
            <span className="text-sm font-black text-white/80">{s.wins} manche{s.wins > 1 ? "s" : ""}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          setManche(1);
          setWins(players.map(() => 0));
          setPhase("config");
        }}
        className="af-btn af-btn-primary mt-7 w-full max-w-xs"
      >
        Rejouer
      </button>
    </LocalShell>
  );
}

// ══════════════════════════════════════════════════════════
// ÉCRAN PUBLIC — chrono live, aucune autorité sur le temps
// ══════════════════════════════════════════════════════════
interface ScreenSnap {
  seq?: number;
  action?: string;
  view?: string;
  players?: string[];
  wins?: number[];
  mode?: PPMode;
  target?: number;
  manche?: number;
  turnIdx?: number;
  attempts?: Attempt[];
  playerName?: string;
  elapsedMs?: number;
  snapshot?: ScreenSnap | null;
  relay?: boolean;
  // Sync d'horloge (ping NTP-style) + départ horodaté
  startAt?: number; // Date.now() du tél bouton au moment exact du tap GO
  t0?: number; // Date.now() de l'écran à l'envoi du ping
  tPad?: number; // Date.now() du pad à l'écho
  sid?: string; // identifiant de l'écran qui a pingé (chaque écran garde ses pongs)
}

// Réglage du temps max — optionnel, modifiable à tout moment depuis l'écran
function TargetControl({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const chip = (selected: boolean) => ({
    fontFamily: "var(--font-display)",
    background: selected ? "#00C2A8" : "rgba(255,255,255,0.06)",
    color: selected ? "#04211C" : "#fff",
    border: `1.5px solid ${selected ? "#00C2A8" : "rgba(255,255,255,0.15)"}`,
  });
  return (
    <div className="mt-6 w-full max-w-sm rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">⏱ Temps max — optionnel</p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button onClick={() => onChange(null)} className="rounded-xl px-3 py-2 text-sm font-black" style={chip(value == null)}>
          Aucun
        </button>
        {[5, 7, 10, 15].map((t) => (
          <button key={t} onClick={() => onChange(t)} className="rounded-xl px-3 py-2 text-sm font-black" style={chip(value === t)}>
            {t} s
          </button>
        ))}
        <button
          onClick={() => onChange(Math.max(1, Math.round(((value ?? 7) - 0.5) * 2) / 2))}
          className="rounded-xl px-3 py-2 text-sm font-black"
          style={chip(false)}
        >
          −
        </button>
        <button
          onClick={() => onChange(Math.min(120, Math.round(((value ?? 7) + 0.5) * 2) / 2))}
          className="rounded-xl px-3 py-2 text-sm font-black"
          style={chip(false)}
        >
          +
        </button>
      </div>
      {value != null && (
        <p className="mt-2 text-center text-[12px] font-bold" style={{ color: "#5FF5DD" }}>
          Réglé sur {value} s — « DÉPASSÉ » s&apos;affichera en direct
        </p>
      )}
    </div>
  );
}

function HistoryRow({ history, target }: { history: number[]; target: number | null }) {
  if (!history.length) return null;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
      {history.map((ms, i) => {
        const over = target != null && ms > target * 1000;
        return (
          <span
            key={i}
            className="rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: over ? "#FF6A5B" : "#5FF5DD",
              opacity: i === 0 ? 1 : 0.6,
            }}
          >
            {fmt(ms)}
          </span>
        );
      })}
    </div>
  );
}

function ScreenView({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "pile-poil", playerId, playerName);
  const { gameState, isConnected } = useGameStore();
  // Choix de cible depuis l'écran (obligatoire avant validation)
  const [chosen, setChosen] = useState<number | null>(null);
  const raw = gameState as unknown as ScreenSnap;
  // Base = dernier snapshot serveur (écran qui rejoint en cours de partie),
  // écrasée par les événements relayés en direct (fusionnés au niveau racine).
  // Sans cette fusion, un champ posé par le snapshot (ex. view:"duel") serait
  // perdu dès le premier pp-start reçu.
  const snap: ScreenSnap = { ...(raw?.snapshot ?? {}), ...(raw ?? {}) };

  const [now, setNow] = useState(0); // ms écoulées affichées
  const runningRef = useRef<{ t0: number; raf: number } | null>(null);
  const [display, setDisplay] = useState<"idle" | "running" | "stopped">("idle");
  const [official, setOfficial] = useState<number | null>(null);
  const lastSeq = useRef(-1);
  // Mode duel : temps max optionnel (autorité = cet écran) + historique
  const [maxSet, setMaxSet] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  // ── Sync d'horloge NTP-style : offset = horloge du pad − horloge d'ici.
  // On garde l'échantillon au RTT le plus court (le plus fiable). Avec ça,
  // le chrono affiche le VRAI temps écoulé depuis le tap, latence comprise.
  const sidRef = useRef(Math.random().toString(36).slice(2, 10));
  const offsetRef = useRef<{ off: number; rtt: number } | null>(null);
  useEffect(() => {
    if (!isConnected) return;
    const ping = () =>
      sendAction({ action: "pp-ping", seq: Math.floor(Math.random() * 1e9), t0: Date.now(), sid: sidRef.current });
    // Rafale initiale pour converger vite, puis entretien régulier
    const burst = [0, 250, 500, 800, 1200].map((d) => setTimeout(ping, d));
    const iv = setInterval(ping, 4000);
    return () => {
      burst.forEach(clearTimeout);
      clearInterval(iv);
    };
  }, [isConnected, sendAction]);

  // Réagit aux événements relayés (chaque message a un seq unique)
  useEffect(() => {
    if (!raw?.action || raw.seq === undefined || raw.seq === lastSeq.current) return;
    lastSeq.current = raw.seq;

    if (raw.action === "pp-pong" && raw.sid === sidRef.current && raw.t0 != null && raw.tPad != null) {
      const t1 = Date.now();
      const rtt = t1 - raw.t0;
      const off = raw.tPad - (raw.t0 + t1) / 2;
      if (!offsetRef.current || rtt <= offsetRef.current.rtt) offsetRef.current = { off, rtt };
    }
    if (raw.action === "pp-start") {
      // Départ replacé dans l'horloge de CE téléphone : le chrono démarre déjà
      // au vrai temps écoulé (latence réseau annulée par l'offset).
      const off = offsetRef.current?.off;
      const startScreen = raw.startAt != null && off != null ? raw.startAt - off : Date.now();
      setDisplay("running");
      setOfficial(null);
      const loop = () => {
        setNow(Math.max(0, Date.now() - startScreen));
        runningRef.current = { t0: startScreen, raf: requestAnimationFrame(loop) };
      };
      if (runningRef.current) cancelAnimationFrame(runningRef.current.raf);
      loop();
    }
    if (raw.action === "pp-stop") {
      if (runningRef.current) cancelAnimationFrame(runningRef.current.raf);
      runningRef.current = null;
      setOfficial(raw.elapsedMs ?? null);
      setDisplay("stopped");
      if (raw.elapsedMs != null) setHistory((h) => [raw.elapsedMs!, ...h].slice(0, 5));
    }
    if (raw.action === "pp-reset") {
      if (runningRef.current) cancelAnimationFrame(runningRef.current.raf);
      runningRef.current = null;
      setNow(0);
      setOfficial(null);
      setHistory([]);
      setDisplay("idle");
    }
    if (raw.action === "pp-sync") {
      if (runningRef.current) cancelAnimationFrame(runningRef.current.raf);
      runningRef.current = null;
      setDisplay("idle");
      setOfficial(null);
    }
  }, [raw]);

  useEffect(() => {
    return () => {
      if (runningRef.current) cancelAnimationFrame(runningRef.current.raf);
    };
  }, []);

  const duel = snap?.view === "duel";
  const target: number | null = duel ? maxSet : (snap?.target ?? 7);
  const shown = display === "stopped" && official != null ? official : now;

  const setMax = (v: number | null) => {
    setMaxSet(v);
    sendAction({ action: "pp-target", seq: Math.floor(Math.random() * 1e9), target: v });
  };

  if (display === "running" || display === "stopped") {
    const overNow = target != null && (display === "running" ? now : official ?? 0) > target * 1000;
    const gapMs = target != null ? Math.abs((official ?? now) - target * 1000) : 0;
    const perfect = target != null && display === "stopped" && gapMs <= 150;
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-6 text-center transition-colors"
        style={{
          background: overNow
            ? "radial-gradient(120% 80% at 50% 0%, #4A0A0A 0%, #170202 100%)"
            : "radial-gradient(120% 80% at 50% 0%, #06302A 0%, #020D0B 100%)",
        }}
      >
        <p className="af-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          {duel
            ? target != null
              ? `Temps max : ${target} s`
              : "Chrono libre"
            : `${snap?.playerName ?? "…"} vise ${target} s`}
        </p>
        <p
          className="mt-4 font-black tabular-nums"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "min(24vw, 9rem)",
            lineHeight: 1,
            color: display === "stopped" ? (perfect ? "#FFD23F" : overNow ? "#FF6A5B" : "#5FF5DD") : overNow ? "#FF6A5B" : "#fff",
            textShadow: overNow ? "0 0 40px rgba(255,80,60,0.6)" : "0 0 40px rgba(0,194,168,0.35)",
          }}
        >
          {(shown / 1000).toFixed(display === "stopped" ? 2 : 1)}
        </p>
        {display === "running" && overNow && (
          <p className="mt-4 animate-pulse text-3xl font-black" style={{ fontFamily: "var(--font-display)", color: "#FF6A5B" }}>
            DÉPASSÉ !!! 🚨
          </p>
        )}
        {display === "running" && !overNow && (
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Chut… il/elle compte 🤫
          </p>
        )}
        {display === "stopped" && target != null && (
          <p className="mt-4 text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: perfect ? "#FFD23F" : overNow ? "#FF6A5B" : "#5FF5DD" }}>
            {perfect ? "PILE POIL ! 🎯" : fmtDelta(official ?? 0, target)}
          </p>
        )}
        {duel && display === "stopped" && (
          <>
            <TargetControl value={maxSet} onChange={setMax} />
            <HistoryRow history={history} target={maxSet} />
            <p className="mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              En attente du prochain essai…
            </p>
          </>
        )}
      </div>
    );
  }

  // Duel au repos : prêt + réglage du temps max (optionnel)
  if (duel) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, #06302A 0%, #020D0B 100%)" }}
      >
        <span className="text-5xl">👀</span>
        <p className="mt-3 text-xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          Prêt à mater son chrono
        </p>
        <p className="mt-1 max-w-xs text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Dès qu&apos;il appuie sur GO, le temps défile ici en direct.
        </p>
        <TargetControl value={maxSet} onChange={setMax} />
        <HistoryRow history={history} target={maxSet} />
      </div>
    );
  }

  // La manette attend que CET écran saisisse la cible (annoncée à l'oral)
  if (snap?.view === "pick-target") {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, #06302A 0%, #020D0B 100%)" }}
      >
        <span className="text-5xl">🎯</span>
        <p className="mt-3 text-xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          À toi de fixer la cible !
        </p>
        <p className="mt-1 max-w-xs text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Annonce-la à voix haute (ou pas 😈) et saisis-la ici — obligatoire pour lancer la manche.
        </p>
        <div className="mt-6 flex max-w-sm flex-wrap justify-center gap-2">
          {[3, 5, 7, 10, 12, 15, 20, 30].map((t) => (
            <button
              key={t}
              onClick={() => setChosen(t)}
              className="rounded-2xl px-4 py-2.5 text-base font-black"
              style={{
                fontFamily: "var(--font-display)",
                background: chosen === t ? "#00C2A8" : "rgba(255,255,255,0.06)",
                color: chosen === t ? "#04211C" : "#fff",
                border: `1.5px solid ${chosen === t ? "#00C2A8" : "rgba(255,255,255,0.15)"}`,
              }}
            >
              {t} s
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setChosen((c) => Math.max(1, Math.round(((c ?? 7) - 0.5) * 2) / 2))}
            className="af-btn af-btn-ghost h-11 w-11 !p-0 text-xl"
          >
            −
          </button>
          <span className="w-24 text-center text-2xl font-black tabular-nums text-white" style={{ fontFamily: "var(--font-display)" }}>
            {chosen != null ? `${chosen} s` : "— s"}
          </span>
          <button
            onClick={() => setChosen((c) => Math.min(120, Math.round(((c ?? 7) + 0.5) * 2) / 2))}
            className="af-btn af-btn-ghost h-11 w-11 !p-0 text-xl"
          >
            +
          </button>
        </div>
        <button
          disabled={chosen == null}
          onClick={() => {
            if (chosen == null) return;
            sendAction({ action: "pp-target", seq: Math.floor(Math.random() * 1e9), target: chosen });
            setChosen(null);
          }}
          className="af-btn af-btn-primary mt-6 w-full max-w-xs disabled:opacity-40"
          style={{ fontSize: 16 }}
        >
          Valider la cible ✓
        </button>
      </div>
    );
  }

  // Idle : classement / attente
  const attempts = snap?.attempts ?? [];
  const ranked = snap?.target != null && attempts.length ? rankAttempts(attempts, snap.target, snap?.mode ?? "closest") : [];
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      style={{ background: "radial-gradient(120% 80% at 50% 0%, #06302A 0%, #020D0B 100%)" }}
    >
      <span className="text-5xl">📺</span>
      <p className="mt-3 text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
        Écran Pile Poil
      </p>
      {snap?.players?.length ? (
        <>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Manche {snap.manche ?? 1} · cible {snap.target ?? "?"} s · au tour de{" "}
            <b className="text-white">{snap.players[snap.turnIdx ?? 0]}</b>
          </p>
          {ranked.length > 0 && (
            <div className="mt-5 w-full max-w-sm space-y-1.5">
              {ranked.map((a, i) => (
                <div key={a.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <span className="text-sm font-bold text-white/85">
                    {i === 0 ? "👑" : `${i + 1}.`} {a.name}
                  </span>
                  <span className="text-sm font-black tabular-nums" style={{ color: a.over ? "#FF6A5B" : "#5FF5DD" }}>
                    {fmt(a.elapsedMs)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="mt-2 max-w-xs text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          En attente de la manette… Sur l&apos;autre tél, ouvre ce jeu et choisis « 🎮 Manette ».
        </p>
      )}
    </div>
  );
}
