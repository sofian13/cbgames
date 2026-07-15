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
  const [role, setRole] = useState<"pick" | "pad" | "screen">("pick");

  if (role === "pick") {
    return (
      <LocalShell accent="#00C2A8" center>
        <span className="text-6xl">⏱️</span>
        <h1 className="cb-display-lg mt-3 text-center">Pile Poil</h1>
        <p className="mt-2 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>
          Compte les secondes dans ta tête et arrête le chrono pile sur la cible.
          Le tél passe de main en main — et un 2ᵉ tél peut servir d&apos;écran public.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button onClick={() => setRole("pad")} className="af-btn af-btn-primary" style={{ fontSize: 16 }}>
            🎮 Manette — on joue sur CE tél
          </button>
          <button onClick={() => setRole("screen")} className="af-btn af-btn-ghost" style={{ fontSize: 15 }}>
            📺 Écran — ce tél affiche le chrono en direct
          </button>
        </div>
        <p className="mt-4 max-w-xs text-center text-[11px]" style={{ color: "var(--text-dim)" }}>
          L&apos;écran est optionnel : ouvre ce jeu depuis la même room sur l&apos;autre tél et choisis « Écran ».
        </p>
      </LocalShell>
    );
  }

  if (role === "screen") return <ScreenView roomCode={roomCode} playerId={playerId} playerName={playerName} />;
  return <PadView roomCode={roomCode} playerId={playerId} playerName={playerName} />;
}

// ══════════════════════════════════════════════════════════
// MANETTE — toute la logique de jeu, temps mesuré ICI
// ══════════════════════════════════════════════════════════
type PadPhase = "setup" | "config" | "pass" | "ready" | "running" | "reveal" | "board" | "recap";

function PadView({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "pile-poil", playerId, playerName);

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

  const beginRound = () => {
    setAttempts([]);
    setTurnIdx(0);
    setPhase("pass");
    sync({ view: "pass", turnIdx: 0, attempts: [] });
  };

  const onStartTap = () => {
    startRef.current = performance.now();
    setPhase("running");
    sendAction({ action: "pp-start", seq: ++seqRef.current, playerName: players[turnIdx], target, mode });
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
        <button onClick={beginRound} className="af-btn af-btn-primary mt-7 w-full max-w-xs" style={{ fontSize: 16 }}>
          C&apos;est parti !
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
}

function ScreenView({ roomCode, playerId, playerName }: GameProps) {
  useGame(roomCode, "pile-poil", playerId, playerName);
  const { gameState } = useGameStore();
  const raw = gameState as unknown as ScreenSnap;
  // Un écran qui rejoint en cours de partie récupère le dernier snapshot serveur
  const snap: ScreenSnap = raw?.action ? raw : (raw?.snapshot ?? raw ?? {});

  const [now, setNow] = useState(0); // ms écoulées affichées
  const runningRef = useRef<{ t0: number; raf: number } | null>(null);
  const [display, setDisplay] = useState<"idle" | "running" | "stopped">("idle");
  const [official, setOfficial] = useState<number | null>(null);
  const lastSeq = useRef(-1);

  // Réagit aux événements relayés (chaque message a un seq unique)
  useEffect(() => {
    if (!raw?.action || raw.seq === undefined || raw.seq === lastSeq.current) return;
    lastSeq.current = raw.seq;

    if (raw.action === "pp-start") {
      const t0 = performance.now();
      setDisplay("running");
      setOfficial(null);
      const loop = () => {
        setNow(performance.now() - t0);
        runningRef.current = { t0, raf: requestAnimationFrame(loop) };
      };
      if (runningRef.current) cancelAnimationFrame(runningRef.current.raf);
      loop();
    }
    if (raw.action === "pp-stop") {
      if (runningRef.current) cancelAnimationFrame(runningRef.current.raf);
      runningRef.current = null;
      setOfficial(raw.elapsedMs ?? null);
      setDisplay("stopped");
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

  const target = snap?.target ?? 7;
  const over = display === "running" && now > target * 1000;
  const shown = display === "stopped" && official != null ? official : now;

  if (display === "running" || display === "stopped") {
    const gapMs = Math.abs((official ?? now) - target * 1000);
    const perfect = display === "stopped" && gapMs <= 150;
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-6 text-center transition-colors"
        style={{
          background: over
            ? "radial-gradient(120% 80% at 50% 0%, #4A0A0A 0%, #170202 100%)"
            : "radial-gradient(120% 80% at 50% 0%, #06302A 0%, #020D0B 100%)",
        }}
      >
        <p className="af-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          {snap?.playerName ?? "…"} vise {target} s
        </p>
        <p
          className="mt-4 font-black tabular-nums"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "min(24vw, 9rem)",
            lineHeight: 1,
            color: display === "stopped" ? (perfect ? "#FFD23F" : over ? "#FF6A5B" : "#5FF5DD") : over ? "#FF6A5B" : "#fff",
            textShadow: over ? "0 0 40px rgba(255,80,60,0.6)" : "0 0 40px rgba(0,194,168,0.35)",
          }}
        >
          {(shown / 1000).toFixed(display === "stopped" ? 2 : 1)}
        </p>
        {display === "running" && over && (
          <p className="mt-4 animate-pulse text-3xl font-black" style={{ fontFamily: "var(--font-display)", color: "#FF6A5B" }}>
            DÉPASSÉ !!! 🚨
          </p>
        )}
        {display === "running" && !over && (
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Chut… il/elle compte 🤫
          </p>
        )}
        {display === "stopped" && (
          <p className="mt-4 text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: perfect ? "#FFD23F" : over ? "#FF6A5B" : "#5FF5DD" }}>
            {perfect ? "PILE POIL ! 🎯" : fmtDelta(official ?? 0, target)}
          </p>
        )}
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
