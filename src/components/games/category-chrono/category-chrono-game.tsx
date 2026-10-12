"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { PlayersSetup, colorForIndex } from "@/components/games/local-kit";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { useAudio } from "@/lib/hooks/useAudio";
import { PACKS, type Category } from "./categories";
import { ArrowLeft, Check, FolderOpen, Heart, RefreshCw, Skull, X, Zap } from "lucide-react";
import { GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";

// ── Catégorie Chrono ───────────────────────────────────────
// Une catégorie s'affiche, le tél tourne : chacun doit donner un mot de la
// catégorie avant la fin du chrono (qui raccourcit à chaque bonne réponse).
// Pas de mot, mot déjà dit ou hors sujet = une vie en moins. Dernier en vie gagne.

const ACCENT = "#FF7A3D";
const TOP_SAFE = "calc(env(safe-area-inset-top, 0px) + 64px)";
const BOTTOM_SAFE = "calc(env(safe-area-inset-bottom, 0px) + 20px)";
const BG = `radial-gradient(circle at 50% 12%, ${ACCENT}26, transparent 45%), linear-gradient(180deg, #0a0118 0%, #120428 60%, #08011a 100%)`;
const MIN_TIME = 3;

interface P {
  name: string;
  lives: number;
}

type Phase = "setup" | "config" | "reveal" | "playing" | "lost" | "over";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let actx: AudioContext | null = null;
function beep(freq: number, dur = 0.1, type: OscillatorType = "triangle", gain = 0.12, delay = 0) {
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
@keyframes cc-pop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
@keyframes cc-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 50% { transform: translateX(8px) } 75% { transform: translateX(-4px) } }
`;

export default function CategoryChronoGame({ onReturnToLobby }: GameProps) {
  const { muted } = useAudio();
  const sound = !muted;

  const [phase, setPhase] = useState<Phase>("setup");
  const [names, setNames] = useState<string[]>([]);
  const [packs, setPacks] = useState<string[]>(() => PACKS.filter((p) => p.defaultOn).map((p) => p.id));
  const [timerBase, setTimerBase] = useState(10);
  const [startLives, setStartLives] = useState(3);

  const [players, setPlayers] = useState<P[]>([]);
  const [cur, setCur] = useState(0);
  const [queue, setQueue] = useState<Category[]>([]);
  const [catIdx, setCatIdx] = useState(0);
  const [streak, setStreak] = useState(0); // bonnes réponses dans la catégorie
  const [timeLeft, setTimeLeft] = useState(0);
  const [lostIdx, setLostIdx] = useState(0);
  const endAt = useRef(0);

  const pool = useMemo(() => PACKS.filter((p) => packs.includes(p.id)).flatMap((p) => p.items), [packs]);
  const category = queue[catIdx];
  const turnTime = (n: number) => Math.max(MIN_TIME, timerBase - n * 0.5);

  const nextAlive = (from: number, list: P[]) => {
    for (let k = 1; k <= list.length; k++) {
      const i = (from + k) % list.length;
      if (list[i].lives > 0) return i;
    }
    return from;
  };

  // Chrono (échéance absolue → pas de dérive ; nettoyé à chaque changement)
  useEffect(() => {
    if (phase !== "playing") return;
    let lastBeep = -1;
    const id = setInterval(() => {
      const left = Math.max(0, (endAt.current - Date.now()) / 1000);
      setTimeLeft(left);
      const s = Math.ceil(left);
      if (left > 0 && s <= 3 && s !== lastBeep) {
        lastBeep = s;
        if (sound) beep(700, 0.06, "square", 0.08);
      }
      if (left <= 0) {
        clearInterval(id);
        lose();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cur, streak]);

  const startGame = (list: string[]) => {
    setPlayers(list.map((name) => ({ name, lives: startLives })));
    setQueue(shuffle(pool));
    setCatIdx(0);
    setCur(0);
    setStreak(0);
    setPhase("reveal");
  };

  const go = () => {
    setStreak(0);
    endAt.current = Date.now() + timerBase * 1000;
    setTimeLeft(timerBase);
    setPhase("playing");
    if (sound) beep(880, 0.15, "square", 0.1);
  };

  const valid = () => {
    if (phase !== "playing") return;
    const n = streak + 1;
    const t = turnTime(n);
    endAt.current = Date.now() + t * 1000;
    setTimeLeft(t);
    setStreak(n);
    setCur(nextAlive(cur, players));
    if (sound) beep(880 + Math.min(n, 12) * 30, 0.08);
    vib(25);
  };

  function lose() {
    if (phase !== "playing") return;
    const updated = players.map((p, i) => (i === cur ? { ...p, lives: p.lives - 1 } : p));
    setPlayers(updated);
    setLostIdx(cur);
    if (sound) {
      beep(300, 0.25, "sawtooth", 0.1);
      beep(180, 0.45, "sawtooth", 0.1, 0.2);
    }
    vib([200, 80, 200]);
    setPhase(updated.filter((p) => p.lives > 0).length <= 1 ? "over" : "lost");
  }

  const continueGame = () => {
    // Le perdant (s'il est encore en vie) relance sur une nouvelle catégorie
    setCur(players[lostIdx].lives > 0 ? lostIdx : nextAlive(lostIdx, players));
    if (catIdx + 1 < queue.length) setCatIdx(catIdx + 1);
    else {
      setQueue(shuffle(pool));
      setCatIdx(0);
    }
    setPhase("reveal");
  };

  // ── Écrans ─────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <PlayersSetup
        emoji="⏱️"
        name="Catégorie Chrono"
        min={2}
        max={12}
        accent={ACCENT}
        onStart={(list) => {
          setNames(list);
          setPhase("config");
        }}
      />
    );
  }

  if (phase === "config") {
    return (
      <Shell>
        <Mascot size={78} color="coral" mood="shocked" arms shadow={false} />
        <h1 className="cb-display-lg mt-2 text-center">Catégorie Chrono</h1>
        <div className="mt-4 w-full max-w-sm rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-[14px] leading-snug text-white/90">
            <GameInlineIcon icon={FolderOpen} /> Une <b>catégorie</b> s&apos;affiche (ex. « Fruits »).
            <br />
            <GameInlineIcon icon={RefreshCw} /> Chacun son tour, dis <b>un mot</b> de la catégorie avant la fin du chrono, puis passe le tél.
            <br />
            <GameInlineIcon icon={Zap} /> Le chrono <b>raccourcit</b> à chaque mot. Pas de mot, répétition ou hors sujet = <b>une vie en moins</b>.
          </p>
        </div>

        <p className="af-eyebrow mt-6">Thèmes ({pool.length} catégories)</p>
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
                  background: on ? (p.adult ? "rgba(255,62,165,0.18)" : "rgba(255,122,61,0.16)") : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${on ? (p.adult ? "#FF3EA5" : ACCENT) : "rgba(255,255,255,0.12)"}`,
                }}
                aria-pressed={on}
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="min-w-0 flex-1 text-[14px] font-bold leading-tight">
                  {p.name}
                  {p.adult && (
                    <span className="block text-[12px] font-semibold" style={{ color: "#FF8CC8" }}>
                      18+ · coquin
                    </span>
                  )}
                </span>
                <span className="text-sm">{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>

        <p className="af-eyebrow mt-6">Chrono de départ</p>
        <div className="mt-2 flex gap-2">
          {[6, 8, 10, 15].map((d) => (
            <Pill key={d} on={timerBase === d} onClick={() => setTimerBase(d)}>
              {d} s
            </Pill>
          ))}
        </div>
        <p className="af-eyebrow mt-6">Vies</p>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3].map((n) => (
            <Pill key={n} on={startLives === n} onClick={() => setStartLives(n)}>
              <LifeHearts n={n} />
            </Pill>
          ))}
        </div>

        <button
          disabled={!pool.length}
          onClick={() => startGame(names)}
          className="af-btn af-btn-primary mt-6 w-full max-w-sm disabled:opacity-40"
          style={{ fontSize: 17, minHeight: 54 }}
        >
          {pool.length ? `C'est parti ! (${names.length} joueurs)` : "Choisis au moins un thème"}
        </button>
        <button onClick={() => setPhase("setup")} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
          <GameInlineIcon icon={ArrowLeft} /> Modifier les joueurs
        </button>
      </Shell>
    );
  }

  if (phase === "reveal" && category) {
    return (
      <Shell>
        <style>{KEYFRAMES}</style>
        <Lives players={players} cur={cur} />
        <p className="af-eyebrow mt-6">Catégorie</p>
        <div className="mt-1 text-6xl" style={{ animation: "cc-pop .45s ease-out" }}>
          {category.emoji}
        </div>
        <h2 className="cb-display-lg mt-2 max-w-sm text-center" style={{ overflowWrap: "anywhere" }}>
          {category.name}
        </h2>
        <p className="mt-2 text-[14px]" style={{ color: "var(--text-dim)" }}>
          Ex. : {category.examples}
        </p>
        <p className="mt-6 text-[15px]" style={{ color: "var(--text-dim)" }}>
          <b className="text-white">{players[cur]?.name}</b> commence · {timerBase} s
        </p>
        <button onClick={go} className="af-btn af-btn-primary mt-3 w-full max-w-xs" style={{ fontSize: 18, minHeight: 56 }}>
          GO !
        </button>
      </Shell>
    );
  }

  if (phase === "playing" && category) {
    const total = turnTime(streak);
    const pct = Math.max(0, Math.min(100, (timeLeft / total) * 100));
    const color = pct > 50 ? "#3DDC97" : pct > 25 ? "#FFD23F" : "#FF5B5B";
    return (
      <div className="relative flex min-h-[100svh] select-none flex-col text-white" style={{ background: BG, touchAction: "manipulation", paddingTop: TOP_SAFE, paddingBottom: BOTTOM_SAFE }}>
        <style>{KEYFRAMES}</style>
        <div className="px-5 text-center">
          <p className="text-[15px] font-bold text-white/80">
            {category.emoji} {category.name}
          </p>
          <div className="mx-auto mt-3 h-2.5 w-full max-w-sm overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width .1s linear" }} />
          </div>
          <p className="mt-2 font-black tabular-nums" style={{ fontFamily: "var(--font-display)", fontSize: 40, lineHeight: 1, color: timeLeft <= 3 ? "#FF5B5B" : "#fff" }}>
            {timeLeft.toFixed(1).replace(".", ",")}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <p className="af-eyebrow">C&apos;est à</p>
          <div key={`${cur}-${streak}`} style={{ animation: "cc-pop .25s ease-out" }} className="flex flex-col items-center">
            <Mascot size={90} color={colorForIndex(cur)} mood={timeLeft <= 3 ? "shocked" : "happy"} arms />
            <h2 className="cb-display-lg mt-2 max-w-full" style={{ overflowWrap: "anywhere" }}>
              {players[cur]?.name}
            </h2>
          </div>
          <p className="mt-2 text-[15px]" style={{ color: "var(--text-dim)" }}>
            Dis un mot, puis passe le tél ! {streak > 0 ? `· ${streak} mot${streak > 1 ? "s" : ""} déjà dit${streak > 1 ? "s" : ""}` : ""}
          </p>
        </div>

        <div className="flex gap-3 px-5">
          <button onClick={valid} className="flex flex-1 flex-col items-center justify-center rounded-3xl" style={{ minHeight: 96, background: "rgba(61,220,151,0.16)", border: "2px solid rgba(61,220,151,0.5)" }}>
            <GameIconBadge icon={Check} bg="#3DDC97" size={48} />
            <span className="text-[15px] font-black" style={{ color: "#3DDC97" }}>
              Validé
            </span>
          </button>
          <button onClick={lose} className="flex flex-1 flex-col items-center justify-center rounded-3xl" style={{ minHeight: 96, background: "rgba(255,91,91,0.14)", border: "2px solid rgba(255,91,91,0.45)" }}>
            <GameIconBadge icon={X} bg="#FF6B6B" size={48} />
            <span className="text-[15px] font-black" style={{ color: "#FF8A8A" }}>
              Raté
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === "lost") {
    const p = players[lostIdx];
    const out = p.lives <= 0;
    return (
      <Shell>
        <style>{KEYFRAMES}</style>
        <div style={{ animation: "cc-shake .5s ease-out" }}>
          <Mascot size={110} color={colorForIndex(lostIdx)} mood={out ? "dead" : "sad"} arms />
        </div>
        <h2 className="cb-display-lg mt-3 max-w-full text-center" style={{ color: "#FF8A8A", overflowWrap: "anywhere" }}>
          {p.name}
        </h2>
        <p className="mt-1 text-lg font-bold">{out ? "est éliminé·e ! 💀" : "perd une vie 💔"}</p>
        <Lives players={players} cur={-1} />
        <button onClick={continueGame} className="af-btn af-btn-primary mt-7 w-full max-w-xs" style={{ fontSize: 16, minHeight: 54 }}>
          Catégorie suivante →
        </button>
      </Shell>
    );
  }

  // ── Fin de partie ──
  const ranking = players.map((p, i) => ({ ...p, i })).sort((a, b) => b.lives - a.lives);
  const winner = ranking[0];
  return (
    <Shell>
      <span className="text-6xl">🏆</span>
      <p className="af-eyebrow mt-2">Dernier·e en vie</p>
      <h2 className="cb-display-lg mt-1 max-w-full text-center" style={{ color: "#FFE07A", overflowWrap: "anywhere" }}>
        {winner?.name ?? "Personne"}
      </h2>
      <div className="mt-5 w-full max-w-sm space-y-1.5">
        {ranking.map((p, k) => (
          <div
            key={p.i}
            className="flex items-center gap-3 rounded-2xl px-3"
            style={{ minHeight: 48, background: k === 0 ? "rgba(255,210,63,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${k === 0 ? "rgba(255,210,63,0.45)" : "rgba(255,255,255,0.1)"}` }}
          >
            <span className="w-6 text-center text-sm font-black">{k === 0 ? "🥇" : p.lives > 0 ? k + 1 : <Skull size={16} strokeWidth={2.6} className="mx-auto" aria-hidden />}</span>
            <MascotAvatar color={colorForIndex(p.i)} size={28} mood={k === 0 ? "cool" : "sad"} />
            <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{p.name}</span>
            <span className="text-sm">{p.lives > 0 && <LifeHearts n={p.lives} />}</span>
          </div>
        ))}
      </div>
      <button onClick={() => startGame(names)} className="af-btn af-btn-primary mt-6 w-full max-w-sm" style={{ fontSize: 16, minHeight: 54 }}>
        Rejouer
      </button>
      <button onClick={() => setPhase("config")} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
        Changer les réglages
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
      className="rounded-2xl px-4 text-base font-black"
      style={{
        minHeight: 48,
        minWidth: 60,
        fontFamily: "var(--font-display)",
        background: on ? ACCENT : "rgba(255,255,255,0.06)",
        color: on ? "#2A0E00" : "#fff",
        border: `1.5px solid ${on ? ACCENT : "rgba(255,255,255,0.14)"}`,
      }}
    >
      {children}
    </button>
  );
}

function Lives({ players, cur }: { players: P[]; cur: number }) {
  return (
    <div className="mt-4 flex max-w-sm flex-wrap justify-center gap-1.5">
      {players.map((p, i) => (
        <span
          key={i}
          className="rounded-full px-3 py-1.5 text-[13px] font-bold"
          style={{
            opacity: p.lives > 0 ? 1 : 0.4,
            background: i === cur ? "rgba(255,122,61,0.2)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${i === cur ? ACCENT : "rgba(255,255,255,0.12)"}`,
          }}
        >
          {p.name} {p.lives > 0 ? <LifeHearts n={p.lives} size={13} /> : <GameInlineIcon icon={Skull} />}
        </span>
      ))}
    </div>
  );
}

/** Vies restantes : petits cœurs pleins (icônes, pas d'emoji). */
function LifeHearts({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" aria-label={`${n} vie${n > 1 ? "s" : ""}`}>
      {Array.from({ length: n }, (_, k) => (
        <Heart key={k} size={size} strokeWidth={2.4} fill="#FF4D6D" color="#FF4D6D" aria-hidden />
      ))}
    </span>
  );
}
