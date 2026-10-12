"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { PlayersSetup, PassScreen, colorForIndex } from "@/components/games/local-kit";
import { MascotAvatar } from "@/components/Mascot";
import { useAudio } from "@/lib/hooks/useAudio";
import { PACKS } from "./words";

// ── Deviner le Mot ─────────────────────────────────────────
// Un joueur met le tél sur son front (écran vers les autres), les autres le
// font deviner sans dire le mot. Il tape à gauche s'il trouve, à droite pour
// passer. Chacun son tour, on cumule les mots trouvés.

const ACCENT = "#50D8FF";
const TOP_SAFE = "calc(env(safe-area-inset-top, 0px) + 64px)";
const BOTTOM_SAFE = "calc(env(safe-area-inset-bottom, 0px) + 20px)";
const BG = `radial-gradient(circle at 50% 12%, ${ACCENT}26, transparent 45%), linear-gradient(180deg, #040424 0%, #05113a 60%, #01072a 100%)`;
const DURATIONS = [30, 60, 90] as const;

type Phase = "setup" | "config" | "pass" | "countdown" | "playing" | "turn-end" | "final";
type WordResult = { word: string; ok: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Petits sons synthétisés (aucun fichier)
let actx: AudioContext | null = null;
function beep(freq: number, dur = 0.12, type: OscillatorType = "triangle", gain = 0.15, delay = 0) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    actx ??= new AC();
    if (actx.state === "suspended") void actx.resume();
    const t0 = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  } catch {
    /* audio indisponible */
  }
}
const vib = (p: number | number[]) => {
  try {
    navigator.vibrate?.(p);
  } catch {
    /* rien */
  }
};

const KEYFRAMES = `
@keyframes gw-pop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
@keyframes gw-flash { from { opacity: .55 } to { opacity: 0 } }
`;

export default function GuessWordGame({ onReturnToLobby }: GameProps) {
  const { muted } = useAudio();
  const sound = !muted;

  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [packs, setPacks] = useState<string[]>(() => PACKS.filter((p) => p.defaultOn).map((p) => p.id));
  const [duration, setDuration] = useState<number>(60);
  const [tours, setTours] = useState(2);

  const [turn, setTurn] = useState(0); // numéro de passage global
  const [deck, setDeck] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [count, setCount] = useState(3);
  const [results, setResults] = useState<WordResult[]>([]);
  const [flash, setFlash] = useState<{ ok: boolean; n: number } | null>(null);

  const current = players.length ? turn % players.length : 0;
  const totalTurns = players.length * tours;

  // Pioche : tous les mots des packs choisis, sans doublon, mélangés
  const pool = useMemo(() => {
    const set = new Set<string>();
    PACKS.filter((p) => packs.includes(p.id)).forEach((p) => p.words.forEach((w) => set.add(w)));
    return [...set];
  }, [packs]);

  // Compte à rebours 3-2-1 avant le tour
  useEffect(() => {
    if (phase !== "countdown") return;
    if (sound) beep(440, 0.12, "square", 0.1);
    const id = setTimeout(() => {
      if (count <= 1) {
        if (sound) beep(880, 0.25, "square", 0.12);
        vib(80);
        endAt.current = Date.now() + duration * 1000;
        setPhase("playing");
      } else setCount(count - 1);
    }, 850);
    return () => clearTimeout(id);
  }, [phase, count, sound, duration]);

  // Chrono du tour basé sur une échéance (pas de dérive), nettoyé au démontage
  const endAt = useRef(0);
  useEffect(() => {
    if (phase !== "playing") return;
    let last = -1;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      if (left === last) return;
      last = left;
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(id);
        if (sound) {
          beep(300, 0.3, "sawtooth", 0.1);
          beep(200, 0.5, "sawtooth", 0.1, 0.25);
        }
        vib([200, 80, 200]);
        // Le mot affiché au gong est grillé : le joueur suivant repart sur un mot neuf
        setWordIdx((i) => i + 1);
        setPhase("turn-end");
      } else if (left <= 5 && sound) beep(660, 0.06, "square", 0.08);
    }, 200);
    return () => clearInterval(id);
  }, [phase, sound]);

  const startTurn = () => {
    if (wordIdx >= deck.length) {
      setDeck(shuffle(pool));
      setWordIdx(0);
    }
    setResults([]);
    setTimeLeft(duration);
    setCount(3);
    setPhase("countdown");
  };

  const answer = useCallback(
    (ok: boolean) => {
      if (phase !== "playing") return;
      const word = deck[wordIdx];
      if (!word) return;
      setResults((r) => [...r, { word, ok }]);
      setFlash({ ok, n: Date.now() });
      if (sound) {
        if (ok) {
          beep(660, 0.1);
          beep(990, 0.16, "triangle", 0.14, 0.08);
        } else beep(220, 0.18, "sawtooth", 0.08);
      }
      vib(ok ? 40 : [30, 40, 30]);
      if (ok) setScores((s) => s.map((v, i) => (i === current ? v + 1 : v)));
      if (wordIdx + 1 >= deck.length) {
        // Pioche épuisée : on remélange plutôt que de bloquer
        setDeck(shuffle(pool));
        setWordIdx(0);
      } else setWordIdx(wordIdx + 1);
    },
    [phase, deck, wordIdx, sound, current, pool]
  );

  const nextTurn = () => {
    if (turn + 1 >= totalTurns) {
      setPhase("final");
      return;
    }
    setTurn(turn + 1);
    setPhase("pass");
  };

  // ── Écrans ─────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <PlayersSetup
        emoji="🤔"
        name="Deviner le Mot"
        min={2}
        max={12}
        accent={ACCENT}
        onStart={(names) => {
          setPlayers(names);
          setPhase("config");
        }}
      />
    );
  }

  if (phase === "config") {
    const canStart = pool.length > 0;
    return (
      <Shell>
        <span className="text-5xl">🤔</span>
        <h1 className="cb-display-lg mt-2 text-center">Deviner le Mot</h1>
        <div className="mt-4 w-full max-w-sm rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-[14px] leading-snug text-white/90">
            📱 Mets le tél <b>sur ton front</b>, écran vers les autres.
            <br />
            🗣️ Ils te font deviner le mot <b>sans le dire</b> (mime, indices, bruitages).
            <br />
            👈 Tape <b>à gauche</b> si tu trouves, 👉 <b>à droite</b> pour passer.
          </p>
        </div>

        <p className="af-eyebrow mt-6">Thèmes ({pool.length} mots)</p>
        <div className="mt-2 grid w-full max-w-sm grid-cols-2 gap-2">
          {PACKS.map((p) => {
            const on = packs.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setPacks((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]))}
                className="flex items-center gap-2 rounded-2xl px-3 text-left"
                style={{
                  minHeight: 52,
                  background: on ? (p.adult ? "rgba(255,62,165,0.18)" : "rgba(80,216,255,0.16)") : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${on ? (p.adult ? "#FF3EA5" : ACCENT) : "rgba(255,255,255,0.12)"}`,
                }}
                aria-pressed={on}
              >
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

        <p className="af-eyebrow mt-6">Temps par joueur</p>
        <div className="mt-2 flex gap-2">
          {DURATIONS.map((d) => (
            <Pill key={d} on={duration === d} onClick={() => setDuration(d)}>
              {d} s
            </Pill>
          ))}
        </div>

        <p className="af-eyebrow mt-6">Tours</p>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3].map((t) => (
            <Pill key={t} on={tours === t} onClick={() => setTours(t)}>
              {t}
            </Pill>
          ))}
        </div>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-dim)" }}>
          Chaque joueur passe {tours} fois avec le tél sur le front.
        </p>

        <button
          disabled={!canStart}
          onClick={() => {
            setScores(players.map(() => 0));
            setTurn(0);
            setDeck(shuffle(pool));
            setWordIdx(0);
            setPhase("pass");
          }}
          className="af-btn af-btn-primary mt-6 w-full max-w-sm disabled:opacity-40"
          style={{ fontSize: 17, minHeight: 54 }}
        >
          {canStart ? "C'est parti !" : "Choisis au moins un thème"}
        </button>
        <button onClick={() => setPhase("setup")} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
          ← Modifier les joueurs
        </button>
      </Shell>
    );
  }

  if (phase === "pass") {
    return (
      <PassScreen
        toName={players[current]}
        colorIndex={current}
        accent={ACCENT}
        hint={`C'est toi qui devines ! Tour ${Math.floor(turn / players.length) + 1}/${tours} · ${duration} s. Prépare-toi à mettre le tél sur ton front.`}
        buttonLabel="Prêt — lancer le compte à rebours"
        onReady={startTurn}
      />
    );
  }

  if (phase === "countdown") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center text-white" style={{ background: BG }}>
        <style>{KEYFRAMES}</style>
        <p className="text-lg font-bold text-white/80">📱 Tél sur le front !</p>
        <p key={count} className="mt-4 font-black" style={{ fontFamily: "var(--font-display)", fontSize: 160, lineHeight: 1, color: ACCENT, animation: "gw-pop .5s ease-out" }}>
          {count > 0 ? count : "GO"}
        </p>
      </div>
    );
  }

  if (phase === "playing") {
    const word = deck[wordIdx] ?? "";
    const urgent = timeLeft <= 10;
    const found = results.filter((r) => r.ok).length;
    const long = word.length > 14;
    return (
      <div className="relative flex min-h-[100svh] select-none flex-col overflow-hidden text-white" style={{ background: BG, touchAction: "manipulation" }}>
        <style>{KEYFRAMES}</style>
        {flash && (
          <div
            key={flash.n}
            className="pointer-events-none absolute inset-0 z-20"
            style={{ background: flash.ok ? "#3DDC97" : "#FF5B5B", animation: "gw-flash .4s ease-out forwards" }}
          />
        )}
        {/* Chrono et score centrés : coins du haut laissés libres */}
        <div className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
          <span className="font-black tabular-nums" style={{ fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 1, color: urgent ? "#FF6B6B" : "#fff" }}>
            {timeLeft}
          </span>
          <span className="mt-1 text-[13px] font-bold text-white/70">
            {players[current]} · ✓ {found}
          </span>
        </div>

        {/* Deux grandes moitiés tactiles : à l'aveugle, le front collé au tél */}
        <div className="absolute inset-0 flex">
          <button onClick={() => answer(true)} className="flex flex-1 flex-col items-center justify-end pb-10" style={{ background: "rgba(61,220,151,0.10)", borderRight: "1px solid rgba(255,255,255,0.08)", paddingBottom: BOTTOM_SAFE }} aria-label="Trouvé">
            <span className="text-4xl">✓</span>
            <span className="mt-1 text-[15px] font-black" style={{ color: "#3DDC97" }}>
              Trouvé
            </span>
          </button>
          <button onClick={() => answer(false)} className="flex flex-1 flex-col items-center justify-end pb-10" style={{ background: "rgba(255,91,91,0.10)", paddingBottom: BOTTOM_SAFE }} aria-label="Passer">
            <span className="text-4xl">✗</span>
            <span className="mt-1 text-[15px] font-black" style={{ color: "#FF8A8A" }}>
              Passer
            </span>
          </button>
        </div>

        <div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center px-5">
          <h2
            key={wordIdx + deck.length}
            className="text-center font-black"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: long ? "min(11vw, 3.2rem)" : "min(15vw, 4.5rem)",
              lineHeight: 1.05,
              overflowWrap: "anywhere",
              hyphens: "auto",
              animation: "gw-pop .25s ease-out",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            {word}
          </h2>
        </div>
      </div>
    );
  }

  if (phase === "turn-end") {
    const found = results.filter((r) => r.ok).length;
    const last = turn + 1 >= totalTurns;
    return (
      <Shell>
        <p className="af-eyebrow">Temps écoulé !</p>
        <MascotAvatar color={colorForIndex(current)} size={64} mood={found >= 8 ? "fire" : found >= 4 ? "happy" : "sad"} />
        <h2 className="cb-display-lg mt-2 text-center">{players[current]}</h2>
        <p className="font-black" style={{ fontFamily: "var(--font-display)", fontSize: 56, lineHeight: 1, color: ACCENT }}>
          {found}
        </p>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          mot{found > 1 ? "s" : ""} trouvé{found > 1 ? "s" : ""}
        </p>
        <div className="mt-4 flex w-full max-w-sm flex-wrap justify-center gap-1.5">
          {results.map((r, i) => (
            <span
              key={i}
              className="rounded-full px-3 py-1.5 text-[13px] font-semibold"
              style={{ background: r.ok ? "rgba(61,220,151,0.14)" : "rgba(255,91,91,0.12)", border: `1px solid ${r.ok ? "rgba(61,220,151,0.4)" : "rgba(255,91,91,0.35)"}`, color: r.ok ? "#9FF0C8" : "#FFB0B0" }}
            >
              {r.ok ? "✓" : "✗"} {r.word}
            </span>
          ))}
          {results.length === 0 && <p className="text-sm text-white/60">Aucun mot… on se réveille ! 😴</p>}
        </div>
        <Standings players={players} scores={scores} />
        <button onClick={nextTurn} className="af-btn af-btn-primary mt-6 w-full max-w-sm" style={{ fontSize: 16, minHeight: 54 }}>
          {last ? "Classement final 🏆" : `Au tour de ${players[(turn + 1) % players.length]} →`}
        </button>
        {!last && (
          <button onClick={() => setPhase("final")} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
            Terminer la partie
          </button>
        )}
      </Shell>
    );
  }

  // ── Classement final ──
  const ranking = players.map((name, i) => ({ name, i, s: scores[i] ?? 0 })).sort((a, b) => b.s - a.s);
  const top = ranking[0];
  const tie = ranking.length > 1 && ranking[1].s === top?.s;
  return (
    <Shell>
      <span className="text-6xl">🏆</span>
      <p className="af-eyebrow mt-2">{tie ? "Égalité au sommet !" : "Meilleur·e devin·e"}</p>
      <h2 className="cb-display-lg mt-1 max-w-full break-words text-center">{tie ? ranking.filter((r) => r.s === top.s).map((r) => r.name).join(" & ") : top?.name}</h2>
      <Standings players={players} scores={scores} big />
      <button
        onClick={() => {
          setScores(players.map(() => 0));
          setTurn(0);
          setDeck(shuffle(pool));
          setWordIdx(0);
          setPhase("pass");
        }}
        className="af-btn af-btn-primary mt-6 w-full max-w-sm"
        style={{ fontSize: 16, minHeight: 54 }}
      >
        Rejouer
      </button>
      <button onClick={() => setPhase("config")} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
        Changer les thèmes
      </button>
      {onReturnToLobby && (
        <button onClick={onReturnToLobby} className="text-sm" style={{ color: "var(--text-muted)", minHeight: 44 }}>
          Quitter
        </button>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center px-5 text-white" style={{ background: BG, paddingTop: TOP_SAFE, paddingBottom: BOTTOM_SAFE }}>
      <div className="my-auto flex w-full flex-col items-center">{children}</div>
    </div>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl px-5 text-base font-black"
      style={{
        minHeight: 48,
        minWidth: 64,
        fontFamily: "var(--font-display)",
        background: on ? ACCENT : "rgba(255,255,255,0.06)",
        color: on ? "#03203A" : "#fff",
        border: `1.5px solid ${on ? ACCENT : "rgba(255,255,255,0.14)"}`,
      }}
    >
      {children}
    </button>
  );
}

function Standings({ players, scores, big }: { players: string[]; scores: number[]; big?: boolean }) {
  const rows = players.map((name, i) => ({ name, i, s: scores[i] ?? 0 })).sort((a, b) => b.s - a.s);
  return (
    <div className="mt-5 w-full max-w-sm space-y-1.5">
      {rows.map((r, k) => (
        <div
          key={r.i}
          className="flex items-center gap-3 rounded-2xl px-3"
          style={{ minHeight: big ? 52 : 44, background: k === 0 && r.s > 0 ? "rgba(255,210,63,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${k === 0 && r.s > 0 ? "rgba(255,210,63,0.45)" : "rgba(255,255,255,0.1)"}` }}
        >
          <span className="w-6 text-center text-sm font-black text-white/60">{k === 0 && r.s > 0 ? "👑" : k + 1}</span>
          <MascotAvatar color={colorForIndex(r.i)} size={28} />
          <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{r.name}</span>
          <span className="text-[15px] font-black" style={{ fontFamily: "var(--font-display)" }}>
            {r.s}
          </span>
        </div>
      ))}
    </div>
  );
}
