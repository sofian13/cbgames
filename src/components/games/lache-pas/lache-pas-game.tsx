"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { colorForIndex } from "@/components/games/local-kit";
import { Mascot, MASCOT_PALETTE } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { buzz, sfxBoom, sfxDing, sfxHeart, sfxPop, sfxTick, unlockAudio } from "@/components/games/patate/fx";
import { ScrollReset, TopRightControls } from "@/components/games/patate/rules-sheet";
import { DARES, pick } from "@/components/games/patate/categories";

// ── Lâche pas ! 💣 ─────────────────────────────────────────
// Tout le monde pose un doigt sur l'écran : une bombe à retardement (cachée,
// 4 à 22 s) s'arme. On peut retirer son doigt quand on veut… mais :
//  • ceux encore posés au BOUM ont perdu ;
//  • si personne n'est pris, c'est le premier à avoir lâché (le trouillard) qui perd ;
//  • le dernier à lâcher avant le boum gagne la couronne.
// Multi-touch pur (Pointer Events) : aucun capteur, aucune permission, fiable en WKWebView.

const ACCENT = "#FF3E6C";
const BG = "linear-gradient(180deg, #170826 0%, #0B0620 100%)";
const MAX_FINGERS = 5; // limite multi-touch d'un iPhone

const RULES = [
  "Chacun pose UN doigt sur l'écran (2 à 5 doigts par manche — à plus, on tourne).",
  "Une bombe s'arme : elle explose entre 4 et 22 s, personne ne sait quand.",
  "Tu peux lâcher quand tu veux. Une fois levé, ton doigt ne compte plus.",
  "BOUM : tous les doigts encore posés ont perdu.",
  "Si tout le monde a lâché avant, c'est le premier qui a lâché (le trouillard) qui perd.",
  "Le dernier à lâcher avant le boum gagne la couronne 👑 et choisit qui fait un gage.",
];

const TAUNTS = ["Tu trembles ?", "Encore un peu…", "Elle chauffe 🔥", "Lâche pas !", "Qui craque en premier ?", "T'es sûr ?", "Ça sent le roussi", "Respire…"];

type Phase = "intro" | "lobby" | "count" | "live" | "result" | "end";
type Penalty = "dares" | "sips";

interface Finger {
  id: number; // pointerId
  slot: number; // couleur / ordre d'arrivée
  x: number;
  y: number;
  liftedAt: number | null; // ms depuis le début de la manche
}

interface Outcome {
  fuse: number;
  losers: number[]; // slots
  coward: number | null; // slot du trouillard (personne pris)
  winner: number | null; // slot couronné
  fingers: Finger[];
  penalty: string;
  alt: string | null;
}

export default function LachePasGame({ onReturnToLobby }: GameProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [penalty, setPenalty] = useState<Penalty>("sips");
  const [fingers, setFingers] = useState<Finger[]>([]);
  const [count, setCount] = useState(3);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [fake, setFake] = useState(0); // incrément = fausse alerte (anim)
  const [elapsed, setElapsed] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [stats, setStats] = useState({ rounds: 0, boomed: 0, cowards: 0 });

  const fingersRef = useRef<Finger[]>([]);
  const phaseRef = useRef<Phase>("intro");
  const startRef = useRef(0);
  const fuseRef = useRef(0);
  const timers = useRef<number[]>([]);
  const rafRef = useRef(0);

  const setF = (f: Finger[]) => {
    fingersRef.current = f;
    setFingers(f);
  };
  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    cancelAnimationFrame(rafRef.current);
  };
  useEffect(() => () => clearTimers(), []);

  // ── Fin de manche ──
  const resolve = useCallback(
    (boomed: boolean) => {
      clearTimers();
      const fs = fingersRef.current;
      const fuse = fuseRef.current;
      const still = fs.filter((f) => f.liftedAt == null);
      const lifted = fs.filter((f) => f.liftedAt != null).sort((a, b) => a.liftedAt! - b.liftedAt!);
      let losers: number[] = [];
      let coward: number | null = null;
      if (still.length > 0) losers = still.map((f) => f.slot);
      else if (lifted.length > 0) {
        coward = lifted[0].slot;
        losers = [coward];
      }
      // Le plus courageux : dernier à lâcher avant le boum (s'il n'est pas le trouillard)
      const bravest = lifted.length > 0 ? lifted[lifted.length - 1].slot : null;
      const winner = bravest != null && bravest !== coward ? bravest : null;
      let pen: string;
      let alt: string | null = null;
      if (penalty === "dares") pen = pick(DARES);
      else {
        const n = 1 + Math.floor(Math.random() * 3);
        pen = `${n} gorgée${n > 1 ? "s" : ""}`;
        alt = pick(DARES);
      }
      if (boomed) {
        sfxBoom();
        buzz("boom");
      } else {
        sfxPop();
        buzz("warn");
      }
      setOutcome({ fuse, losers, coward, winner, fingers: fs, penalty: pen, alt });
      setStats((s) => ({ rounds: s.rounds + 1, boomed: s.boomed + (still.length > 0 ? still.length : 0), cowards: s.cowards + (coward != null ? 1 : 0) }));
      go("result");
    },
    [penalty],
  );

  // ── Lancement de la bombe ──
  const arm = useCallback(() => {
    go("live");
    sfxDing();
    buzz("pass");
    startRef.current = performance.now();
    fuseRef.current = 4000 + Math.random() * 18000;
    setElapsed(0);
    setTaunt(null);
    // Explosion
    timers.current.push(window.setTimeout(() => resolve(true), fuseRef.current));
    // Fausses alertes : 1 à 3 pétards au hasard pour faire lâcher les nerveux
    const fakes = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < fakes; i++) {
      const at = 1500 + Math.random() * 16000;
      if (at < fuseRef.current - 600) {
        timers.current.push(
          window.setTimeout(() => {
            sfxPop();
            buzz("warn");
            setFake((k) => k + 1);
          }, at),
        );
      }
    }
    // Battement de cœur : son rythme dépend du temps écoulé, PAS de la mèche (aucun indice)
    let beat = 0;
    const heart = () => {
      if (phaseRef.current !== "live") return;
      const t = performance.now() - startRef.current;
      sfxHeart();
      buzz("tick");
      beat++;
      if (beat % 4 === 0) setTaunt(pick(TAUNTS));
      timers.current.push(window.setTimeout(heart, Math.max(380, 1000 - t / 25)));
    };
    timers.current.push(window.setTimeout(heart, 400));
    const frame = () => {
      if (phaseRef.current !== "live") return;
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [resolve]);

  // ── Compte à rebours une fois les doigts posés ──
  const startCountdown = useCallback(() => {
    clearTimers();
    go("count");
    setCount(3);
    sfxTick(true);
    let c = 3;
    const step = () => {
      c--;
      if (c <= 0) {
        arm();
        return;
      }
      setCount(c);
      sfxTick(c % 2 === 0);
      timers.current.push(window.setTimeout(step, 800));
    };
    timers.current.push(window.setTimeout(step, 800));
  }, [arm]);

  // Lobby : dès que ≥2 doigts restent posés 1,2 s sans changement → compte à rebours
  useEffect(() => {
    if (phase !== "lobby") return;
    clearTimers();
    if (fingers.length >= 2) {
      timers.current.push(window.setTimeout(startCountdown, 1200));
    }
  }, [phase, fingers.length, startCountdown]);

  // ── Gestion des doigts (Pointer Events, multi-touch) ──
  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const p = phaseRef.current;
    if (p !== "lobby" && p !== "count") return; // pendant la bombe, aucun nouveau doigt
    const fs = fingersRef.current;
    if (fs.length >= MAX_FINGERS || fs.some((f) => f.id === e.pointerId)) return;
    unlockAudio();
    const used = new Set(fs.map((f) => f.slot));
    let slot = 0;
    while (used.has(slot)) slot++;
    buzz("tick");
    sfxTick(true);
    if (p === "count") go("lobby"); // un nouveau doigt relance l'attente
    setF([...fs, { id: e.pointerId, slot, x: e.clientX, y: e.clientY, liftedAt: null }]);
  };
  const onMove = (e: React.PointerEvent) => {
    const fs = fingersRef.current;
    const i = fs.findIndex((f) => f.id === e.pointerId && f.liftedAt == null);
    if (i < 0) return;
    const next = [...fs];
    next[i] = { ...next[i], x: e.clientX, y: e.clientY };
    setF(next);
  };
  const onUp = (e: React.PointerEvent) => {
    const p = phaseRef.current;
    const fs = fingersRef.current;
    const i = fs.findIndex((f) => f.id === e.pointerId && f.liftedAt == null);
    if (i < 0) return;
    if (p === "lobby" || p === "count") {
      // Avant la bombe : on retire simplement le doigt
      if (p === "count") {
        clearTimers();
        go("lobby");
      }
      setF(fs.filter((_, k) => k !== i));
      return;
    }
    if (p === "live") {
      const next = [...fs];
      next[i] = { ...next[i], liftedAt: performance.now() - startRef.current };
      setF(next);
      sfxPass();
      // Tout le monde a lâché : inutile d'attendre la bombe
      if (next.every((f) => f.liftedAt != null)) resolve(false);
    }
  };

  const newRound = () => {
    clearTimers();
    setF([]);
    setOutcome(null);
    go("lobby");
  };

  const top = "calc(env(safe-area-inset-top, 0px) + 64px)";
  const controls = (
    <>
      <TopRightControls title="Lâche pas ! 💣" rules={RULES} accent={ACCENT} />
      <ScrollReset dep={phase} />
    </>
  );

  // ══ Intro ══
  if (phase === "intro") {
    return (
      <div className="relative flex min-h-dvh flex-col items-center px-6 text-center text-white" style={{ background: `radial-gradient(circle at 50% 18%, rgba(255,62,108,0.3), transparent 50%), ${BG}`, paddingTop: top, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        {controls}
        <div className="relative mt-2 flex items-end justify-center gap-1">
          <Mascot size={70} color="pink" mood="shocked" sweat delay={0.1} />
          <div className="text-[86px] leading-none" style={{ animation: "lp-throb 0.9s ease-in-out infinite" }}>💣</div>
          <Mascot size={70} color="mint" mood="sus" delay={0.4} />
        </div>
        <h1 className="cb-display-xl mt-4">Lâche pas !</h1>
        <p className="mt-3 max-w-xs text-[17px] leading-snug" style={{ color: "var(--text-dim)" }}>
          Tout le monde pose un doigt. Une bombe s&apos;arme. <b className="text-white">Lâche avant le boum</b>… mais pas le premier !
        </p>

        <div className="mt-6 w-full max-w-sm">
          <p className="af-eyebrow mb-2 text-left" style={{ color: "var(--text-muted)" }}>Le perdant prend…</p>
          <div className="grid grid-cols-2 gap-2">
            {(["dares", "sips"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setPenalty(k)}
                className="rounded-2xl border px-3 py-3 text-left"
                style={{ background: penalty === k ? "rgba(255,62,108,0.18)" : "rgba(255,255,255,0.05)", borderColor: penalty === k ? ACCENT : "rgba(255,255,255,0.1)", minHeight: 64 }}
              >
                <span className="block text-xl">{k === "dares" ? "🎭" : "🥤"}</span>
                <span className="block text-[14px] font-bold">{k === "dares" ? "Un gage" : "Gorgées ou gage"}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            unlockAudio();
            newRound();
          }}
          className="af-btn af-btn-primary mt-auto w-full max-w-sm"
          style={{ fontSize: 18, padding: "16px 20px", background: `linear-gradient(160deg, #FF7A9A, ${ACCENT})` }}
        >
          Posez vos doigts 👆
        </button>
        <p className="mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>2 à 5 doigts par manche · posez le tél à plat</p>
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  // ══ Fin ══
  if (phase === "end") {
    return (
      <div className="relative flex min-h-dvh flex-col items-center px-6 text-center text-white" style={{ background: BG, paddingTop: top, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <ConfettiBurst count={40} />
        <ScrollReset dep={phase} />
        <Mascot size={120} color="pink" mood="mindblown" crown />
        <h1 className="cb-display-lg mt-3">Bien joué les têtes brûlées</h1>
        <div className="mt-6 grid w-full max-w-sm grid-cols-3 gap-2">
          {[
            { v: stats.rounds, l: "manches" },
            { v: stats.boomed, l: "doigts grillés" },
            { v: stats.cowards, l: "trouillards" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <p className="cb-display-lg" style={{ color: ACCENT }}>{s.v}</p>
              <p className="text-[12px]" style={{ color: "var(--text-dim)" }}>{s.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-auto flex w-full max-w-sm flex-col gap-2 pt-6">
          <button
            onClick={() => {
              setStats({ rounds: 0, boomed: 0, cowards: 0 });
              newRound();
            }}
            className="af-btn af-btn-primary w-full"
            style={{ fontSize: 17, padding: "15px 20px", background: `linear-gradient(160deg, #FF7A9A, ${ACCENT})` }}
          >
            Rejouer
          </button>
          {onReturnToLobby && (
            <button onClick={onReturnToLobby} className="af-btn af-btn-ghost w-full" style={{ fontSize: 15 }}>
              Quitter
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══ Résultat ══
  if (phase === "result" && outcome) {
    const caught = outcome.coward == null && outcome.losers.length > 0;
    const loserColors = outcome.losers.map((s) => colorForIndex(s));
    // Blobs affichés là où ils étaient pendant la manche, sans passer sous la carte du bas
    const viewH = typeof window !== "undefined" ? window.innerHeight : 800;
    return (
      <div className="relative flex min-h-dvh flex-col text-white" style={{ background: `radial-gradient(100% 60% at 50% 30%, ${caught ? "rgba(255,80,30,0.4)" : "rgba(181,161,255,0.3)"}, transparent 70%), ${BG}`, animation: caught ? "lp-quake 0.6s ease-out" : undefined }}>
        {controls}
        {caught && <div className="pointer-events-none fixed inset-0 z-30" style={{ animation: "lp-flash 0.9s ease-out forwards" }} />}
        {/* Les blobs restent à l'endroit où étaient les doigts : chacun retrouve le sien */}
        <div className="pointer-events-none absolute inset-0">
          {outcome.fingers.map((f) => {
            const lost = outcome.losers.includes(f.slot);
            const won = outcome.winner === f.slot;
            return (
              <div key={f.id} className="absolute" style={{ left: f.x, top: Math.min(f.y - 96, viewH - 380), transform: "translate(-50%,-50%)", opacity: lost || won ? 1 : 0.45 }}>
                <Mascot size={lost || won ? 76 : 56} color={colorForIndex(f.slot)} mood={lost ? (caught ? "dead" : "sad") : won ? "cool" : "happy"} crown={won} bob={false} />
                <p className="mt-1 text-center text-[12px] font-bold" style={{ textShadow: "0 1px 4px #000" }}>
                  {f.liftedAt == null ? "💥 pris" : `${(f.liftedAt / 1000).toFixed(1).replace(".", ",")} s`}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 px-5 text-center" style={{ paddingTop: top }}>
          <p className="font-black leading-none" style={{ fontFamily: "var(--font-display)", fontSize: caught ? 56 : 42, color: caught ? "#FFD23F" : "#B5A1FF", animation: "lp-pop 0.5s ease-out" }}>
            {caught ? "BOUM\u00a0!" : "TROUILLARD\u00a0!"}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
            {caught
              ? `La bombe était réglée sur ${(outcome.fuse / 1000).toFixed(1).replace(".", ",")} s`
              : `Tout le monde a lâché… la bombe était réglée sur ${(outcome.fuse / 1000).toFixed(1).replace(".", ",")} s`}
          </p>
        </div>

        <div className="relative z-10 mt-auto px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
          <div className="mx-auto w-full max-w-sm rounded-3xl p-4 text-center" style={{ background: "rgba(20,8,40,0.92)", border: `1px solid ${ACCENT}66` }}>
            <div className="flex items-center justify-center gap-1">
              {loserColors.map((c, k) => (
                <span key={k} className="inline-block h-5 w-5 rounded-full" style={{ background: MASCOT_PALETTE[c].body }} />
              ))}
              <span className="ml-1 text-[15px] font-bold">
                {caught ? (outcome.losers.length > 1 ? "Ces blobs ont perdu" : "Ce blob a perdu") : "Premier à lâcher = perdu"}
              </span>
            </div>
            {outcome.alt ? (
              <p className="mt-2 text-[15px] leading-snug">
                <b style={{ color: "#FFC59A" }}>🥤 {outcome.penalty}</b>
                <span style={{ color: "var(--text-dim)" }}> ou le gage : </span>
                {outcome.alt}
              </p>
            ) : (
              <p className="mt-2 text-[15px] font-semibold leading-snug">🎭 {outcome.penalty}</p>
            )}
            {outcome.winner != null && (
              <p className="mt-2 text-[13px]" style={{ color: "#FFE891" }}>
                👑 Le blob {colorName(colorForIndex(outcome.winner))} a lâché en dernier : il choisit qui fait le gage en plus !
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={() => go("end")} className="af-btn af-btn-ghost flex-1" style={{ fontSize: 14 }}>
                Terminer
              </button>
              <button onClick={newRound} className="af-btn af-btn-primary flex-[2]" style={{ fontSize: 16, background: `linear-gradient(160deg, #FF7A9A, ${ACCENT})` }}>
                Manche suivante
              </button>
            </div>
          </div>
        </div>
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  // ══ Plateau tactile (lobby / compte à rebours / bombe) ══
  const live = phase === "live";
  const holding = fingers.filter((f) => f.liftedAt == null).length;
  const t = elapsed / 1000;
  // L'ambiance monte avec le temps écoulé (jamais avec la mèche réelle)
  const heat = Math.min(1, t / 18);
  return (
    <>
    {/* Contrôles HORS de la zone tactile : un tap sur ⓘ ne doit pas compter comme un doigt */}
    {controls}
    <div
      className="relative min-h-dvh select-none overflow-hidden text-white"
      style={{
        background: live
          ? `radial-gradient(90% 60% at 50% 50%, rgba(255,${Math.round(70 - heat * 50)},60,${0.18 + heat * 0.4}), transparent 70%), ${BG}`
          : `radial-gradient(90% 60% at 50% 50%, rgba(255,62,108,0.16), transparent 70%), ${BG}`,
        touchAction: "none",
        WebkitTouchCallout: "none",
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Fausse alerte */}
      {fake > 0 && live && <div key={fake} className="pointer-events-none absolute inset-0 z-20" style={{ animation: "lp-fake 0.5s ease-out forwards" }} />}

      {/* Centre : consigne / compte à rebours / bombe */}
      <div className="pointer-events-none absolute inset-x-0 z-10 px-6 text-center" style={{ top: phase === "count" ? "38%" : "calc(env(safe-area-inset-top, 0px) + 70px)" }}>
        {phase === "lobby" && (
          <>
            <div className="text-[64px] leading-none" style={{ animation: "lp-throb 1.2s ease-in-out infinite" }}>👆</div>
            <p className="cb-display-lg mt-3">{fingers.length === 0 ? "Posez tous un doigt" : fingers.length === 1 ? "Encore un doigt…" : `${fingers.length} doigts — on attend…`}</p>
            <p className="mt-2 text-[14px]" style={{ color: "var(--text-dim)" }}>
              {fingers.length >= MAX_FINGERS ? "5 doigts max ! Les autres : à la prochaine." : "Ne bougez plus, ça démarre tout seul"}
            </p>
          </>
        )}
        {phase === "count" && (
          <p key={count} className="font-black leading-none" style={{ fontFamily: "var(--font-display)", fontSize: 140, color: ACCENT, animation: "lp-pop 0.4s ease-out" }}>
            {count}
          </p>
        )}
        {live && (
          <>
            <div className="text-[84px] leading-none" style={{ animation: `lp-throb ${Math.max(0.35, 0.9 - heat * 0.5)}s ease-in-out infinite`, filter: `drop-shadow(0 0 ${20 + heat * 40}px rgba(255,80,40,0.8))` }}>
              💣
            </div>
            <p className="cb-display-md mt-3" style={{ minHeight: 30 }}>{taunt ?? "LÂCHE PAS !"}</p>
            <p className="mt-1 text-[14px]" style={{ color: "var(--text-dim)" }}>{holding} doigt{holding > 1 ? "s" : ""} encore posé{holding > 1 ? "s" : ""}</p>
          </>
        )}
      </div>

      {/* Un blob sous chaque doigt (au-dessus, pour rester visible) */}
      {fingers.map((f) => {
        const c = colorForIndex(f.slot);
        const lifted = f.liftedAt != null;
        return (
          <div key={f.id} className="pointer-events-none absolute z-20" style={{ left: f.x, top: f.y }}>
            <div
              className="absolute rounded-full"
              style={{
                width: 96,
                height: 96,
                left: -48,
                top: -48,
                border: `4px solid ${MASCOT_PALETTE[c].body}`,
                boxShadow: `0 0 30px ${MASCOT_PALETTE[c].glow}`,
                opacity: lifted ? 0.15 : 1,
                animation: lifted ? undefined : `lp-ring ${live ? 0.6 : 1.2}s ease-in-out infinite`,
              }}
            />
            <div className="absolute" style={{ left: -32, top: -128, opacity: lifted ? 0.5 : 1 }}>
              <Mascot size={64} color={c} mood={lifted ? "cool" : live ? (heat > 0.5 ? "shocked" : "sus") : "happy"} sweat={live && !lifted} bob={false} />
              {lifted && <p className="text-center text-[12px] font-bold">{(f.liftedAt! / 1000).toFixed(1).replace(".", ",")} s</p>}
            </div>
          </div>
        );
      })}
      <style>{KEYFRAMES}</style>
    </div>
    </>
  );
}

function sfxPass() {
  // Petit son quand un doigt lâche (réutilise le tic aigu)
  sfxTick(true);
}

function colorName(c: string): string {
  const map: Record<string, string> = { purple: "violet", pink: "rose", yellow: "jaune", mint: "vert", sky: "turquoise", coral: "corail", lavender: "lavande", white: "blanc" };
  return map[c] ?? c;
}

const KEYFRAMES = `
@keyframes lp-throb { 0%,100% { transform: scale(1) rotate(-4deg); } 50% { transform: scale(1.1) rotate(4deg); } }
@keyframes lp-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
@keyframes lp-ring { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes lp-fake { 0% { background: rgba(255,255,255,0.85); } 30% { background: rgba(255,62,62,0.5); } 100% { background: rgba(255,62,62,0); } }
@keyframes lp-flash { 0% { background: #fff; } 15% { background: #FFD23F; } 40% { background: rgba(255,80,30,0.8); } 100% { background: rgba(255,80,30,0); } }
@keyframes lp-quake { 0%,100% { transform: translate(0,0); } 10% { transform: translate(-12px,8px); } 20% { transform: translate(10px,-10px); } 30% { transform: translate(-8px,6px); } 45% { transform: translate(6px,-4px); } 60% { transform: translate(-3px,2px); } }
`;
