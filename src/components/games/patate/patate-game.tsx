"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { PlayersSetup, colorForIndex } from "@/components/games/local-kit";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { CATEGORIES_CLASSIC, CATEGORIES_SPICY, DARES, DARES_SPICY, pick, shuffle } from "./categories";
import { buzz, sfxBoom, sfxDing, sfxPass, sfxTick, unlockAudio } from "./fx";
import { ScrollReset, TopRightControls } from "./rules-sheet";

// ── La Patate 🥔 ───────────────────────────────────────────
// Le téléphone EST la patate chaude. Une catégorie, chacun dit une réponse
// puis passe le tél. La mèche dure entre 15 et 60 s (cachée), le tic-tac
// accélère ; celui qui tient le tél quand ça explose a perdu.
// Mode « Ne la secoue pas ! » : l'accéléromètre fait exploser plus tôt la
// patate secouée trop fort pendant les passes.

const ACCENT = "#FF8A3D";
const BG = "linear-gradient(180deg, #1A0A2E 0%, #0E0828 100%)";

const RULES = [
  "Mettez-vous en cercle : on entre les prénoms dans l'ordre où vous êtes assis.",
  "Une catégorie s'affiche. Celui qui tient le tél dit UNE réponse à voix haute…",
  "… puis tape « J'ai répondu » et passe le tél à son voisin. Pas de répétition !",
  "La mèche est cachée (15 à 60 s) et le tic-tac accélère. Boum = celui qui tient le tél a perdu.",
  "Mode « Ne la secoue pas ! » : si vous la balancez trop fort, elle explose plus tôt.",
  "Le perdant fait un gage (ou 1 à 3 gorgées, eau acceptée) et lance la manche suivante.",
];

type Phase = "setup" | "config" | "ready" | "play" | "boom" | "end";
type Penalty = "dares" | "sips";

interface Run {
  start: number;
  fuse: number;
  stress: number;
  lastPass: number;
  lastFrame: number;
  nextTick: number;
  high: boolean;
  raf: number;
  over: boolean;
}

// Typage de l'API iOS (absente des types DOM standard)
type MotionCtor = { requestPermission?: () => Promise<"granted" | "denied"> };

export default function PatateGame({ onReturnToLobby }: GameProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [losses, setLosses] = useState<number[]>([]);
  const [penalty, setPenalty] = useState<Penalty>("sips");
  const [spicy, setSpicy] = useState(false);
  const [shakeMode, setShakeMode] = useState(true);
  const [shakeOk, setShakeOk] = useState(false); // capteur réellement dispo
  const [notice, setNotice] = useState<string | null>(null);

  const [round, setRound] = useState(1);
  const [holder, setHolder] = useState(0);
  const [category, setCategory] = useState("");
  const [passes, setPasses] = useState(0);
  const [heat, setHeat] = useState(0); // 0→1, pilote l'ambiance visuelle
  const [stress, setStress] = useState(0); // 0→100
  const [jolt, setJolt] = useState(0); // incrémenté à chaque secousse (anim)
  const [boom, setBoom] = useState<{ loser: number; reason: "time" | "shake"; penalty: string; alt: string | null; secs: number } | null>(null);

  const deck = useRef<string[]>([]);
  const run = useRef<Run | null>(null);
  const holderRef = useRef(0);
  const shakeOkRef = useRef(false);

  const nextCategory = useCallback(() => {
    if (deck.current.length === 0) {
      deck.current = shuffle(spicy ? [...CATEGORIES_CLASSIC, ...CATEGORIES_SPICY] : CATEGORIES_CLASSIC);
    }
    return deck.current.pop()!;
  }, [spicy]);

  // ── Explosion ──
  const explode = useCallback(
    (reason: "time" | "shake") => {
      const r = run.current;
      if (!r || r.over) return;
      r.over = true;
      cancelAnimationFrame(r.raf);
      sfxBoom();
      buzz("boom");
      const loser = holderRef.current;
      const dares = spicy ? [...DARES, ...DARES_SPICY] : DARES;
      let pen: string;
      let alt: string | null = null;
      if (penalty === "dares") {
        pen = pick(dares);
      } else {
        const n = 1 + Math.floor(Math.random() * 3);
        pen = `${n} gorgée${n > 1 ? "s" : ""}`;
        alt = pick(dares);
      }
      setLosses((l) => l.map((v, i) => (i === loser ? v + 1 : v)));
      setBoom({ loser, reason, penalty: pen, alt, secs: (performance.now() - r.start) / 1000 });
      setPhase("boom");
    },
    [penalty, spicy],
  );

  // ── Boucle de jeu : tic-tac qui accélère + mèche cachée ──
  const loop = useCallback(() => {
    const step = () => {
      const r = run.current;
      if (!r || r.over) return;
      const now = performance.now();
      const dt = (now - r.lastFrame) / 1000;
      r.lastFrame = now;
      const elapsed = now - r.start;
      if (elapsed >= r.fuse) {
        explode("time");
        return;
      }
      const p = elapsed / r.fuse;
      // La patate se calme doucement quand on ne la secoue plus
      if (r.stress > 0) r.stress = Math.max(0, r.stress - dt * 6);
      if (now >= r.nextTick) {
        sfxTick(r.high);
        r.high = !r.high;
        if (p > 0.55) buzz("tick");
        const interval = Math.max(110, 720 - 600 * Math.pow(p, 1.3));
        r.nextTick = now + interval;
        setHeat(p);
        setStress(r.stress);
      }
      r.raf = requestAnimationFrame(step);
    };
    step();
  }, [explode]);

  // Arrêt propre si on quitte le jeu en pleine manche
  useEffect(() => () => {
    if (run.current) {
      run.current.over = true;
      cancelAnimationFrame(run.current.raf);
    }
  }, []);

  // ── Accéléromètre (mode « Ne la secoue pas ! ») ──
  useEffect(() => {
    if (phase !== "play" || !shakeMode || typeof window === "undefined") return;
    let lastWarn = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const r = run.current;
      if (!r || r.over) return;
      let mag: number | null = null;
      const a = e.acceleration;
      if (a && a.x != null && a.y != null && a.z != null) {
        mag = Math.hypot(a.x, a.y, a.z);
      } else {
        const g = e.accelerationIncludingGravity;
        if (g && g.x != null && g.y != null && g.z != null) mag = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81);
      }
      if (mag == null) return;
      if (!shakeOkRef.current) {
        shakeOkRef.current = true;
        setShakeOk(true);
      }
      // Passe normale : < ~10 m/s². Au-delà, la patate stresse.
      const SEUIL = 13;
      if (mag > SEUIL) {
        r.stress += (mag - SEUIL) * 1.6;
        const now = performance.now();
        if (now - lastWarn > 350) {
          lastWarn = now;
          setJolt((j) => j + 1);
          buzz("warn");
        }
        setStress(r.stress);
        if (r.stress >= 100) explode("shake");
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [phase, shakeMode, explode]);

  // ── Actions ──
  const startGame = (names: string[]) => {
    setPlayers(names);
    setLosses(names.map(() => 0));
    setHolder(Math.floor(Math.random() * names.length));
    setRound(1);
    setPhase("config");
  };

  const confirmConfig = () => {
    unlockAudio();
    setNotice(null);
    // iOS : la permission capteur DOIT être demandée dans le geste (pas d'await avant)
    const DM = (typeof window !== "undefined" ? (window as unknown as { DeviceMotionEvent?: MotionCtor }).DeviceMotionEvent : undefined);
    if (shakeMode && DM && typeof DM.requestPermission === "function") {
      DM.requestPermission()
        .then((res) => {
          if (res !== "granted") {
            setShakeMode(false);
            setNotice("Capteur refusé : on joue en mode classique (la patate ne craint pas les secousses).");
          }
        })
        .catch(() => {
          setShakeMode(false);
          setNotice("Capteur indisponible : mode classique.");
        });
    } else if (shakeMode && !DM) {
      setShakeMode(false);
      setNotice("Pas d'accéléromètre ici : mode classique.");
    }
    deck.current = [];
    setPhase("ready");
  };

  const light = () => {
    unlockAudio();
    const now = performance.now();
    run.current = {
      start: now,
      fuse: 15000 + Math.random() * 45000,
      stress: 0,
      lastPass: now,
      lastFrame: now,
      nextTick: now + 300,
      high: true,
      raf: 0,
      over: false,
    };
    holderRef.current = holder;
    setCategory(nextCategory());
    setPasses(0);
    setHeat(0);
    setStress(0);
    setBoom(null);
    setPhase("play");
    sfxDing();
    loop();
  };

  const pass = () => {
    const r = run.current;
    if (!r || r.over) return;
    const now = performance.now();
    if (now - r.lastPass < 450) return; // anti double-tap
    r.lastPass = now;
    const next = (holderRef.current + 1) % players.length;
    holderRef.current = next;
    setHolder(next);
    setPasses((p) => p + 1);
    sfxPass();
    buzz("pass");
  };

  const nextRound = () => {
    if (boom) setHolder(boom.loser); // le perdant relance
    setRound((r) => r + 1);
    setPhase("ready");
  };

  const replay = () => {
    setLosses(players.map(() => 0));
    setRound(1);
    setBoom(null);
    setPhase("ready");
  };

  const n = players.length;
  const top = useTopPad();

  // ══ Écrans ══
  if (phase === "setup") {
    return (
      <>
        <TopRightControls title="La Patate 🥔" rules={RULES} accent={ACCENT} />
        <ScrollReset dep={phase} />
        <PlayersSetup emoji="🥔" name="La Patate" min={3} max={10} accent={ACCENT} onStart={startGame} />
        <p
          className="pointer-events-none fixed inset-x-0 px-8 text-center text-[13px]"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)", color: "var(--text-muted)" }}
        >
          🔄 Entrez les prénoms dans l&apos;ordre où vous êtes assis : la patate tourne dans ce sens.
        </p>
      </>
    );
  }

  if (phase === "config") {
    return (
      <Screen>
        <TopRightControls title="La Patate 🥔" rules={RULES} accent={ACCENT} />
        <ScrollReset dep={phase} />
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5" style={{ paddingTop: top }}>
          <div className="text-center">
            <div className="text-6xl" style={{ animation: "patate-wobble 1.2s ease-in-out infinite" }}>🥔</div>
            <h1 className="cb-display-lg mt-2">Réglages</h1>
          </div>

          <Group label="Le perdant prend…">
            <Choice on={penalty === "dares"} onClick={() => setPenalty("dares")} emoji="🎭" title="Un gage" sub="Que des gages" />
            <Choice on={penalty === "sips"} onClick={() => setPenalty("sips")} emoji="🥤" title="Gorgées ou gage" sub="1 à 3, eau OK" />
          </Group>

          <Group label="Modes">
            <Toggle on={shakeMode} onClick={() => setShakeMode((s) => !s)} emoji="🫨" title="Ne la secoue pas !" sub="Trop secouée, elle explose plus tôt" />
            <Toggle on={spicy} onClick={() => setSpicy((s) => !s)} emoji="🌶️" title="Pack 18+" sub="Catégories coquines (rien d'explicite)" />
          </Group>

          <button onClick={confirmConfig} className="af-btn af-btn-primary w-full max-w-sm" style={{ fontSize: 18, padding: "16px 20px", background: `linear-gradient(160deg, #FFB067, ${ACCENT})`, color: "#2A1100" }}>
            C&apos;est parti 🔥
          </button>
        </div>
        <style>{KEYFRAMES}</style>
      </Screen>
    );
  }

  if (phase === "ready") {
    return (
      <Screen>
        <TopRightControls title="La Patate 🥔" rules={RULES} accent={ACCENT} />
        <ScrollReset dep={phase} />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center" style={{ paddingTop: top }}>
          <p className="af-eyebrow" style={{ color: ACCENT }}>Manche {round}</p>
          <div className="relative mt-4">
            <Mascot size={120} color={colorForIndex(holder)} mood="shifty" arms />
          </div>
          <h1 className="cb-display-lg mt-3">{players[holder]}</h1>
          <p className="mt-1 text-base" style={{ color: "var(--text-dim)" }}>prend le tél et commence</p>
          {notice && (
            <p className="mt-4 max-w-xs rounded-2xl px-4 py-2 text-[13px]" style={{ background: "rgba(255,138,61,0.15)", color: "#FFC59A" }}>
              {notice}
            </p>
          )}
          <p className="mt-6 max-w-xs text-sm" style={{ color: "var(--text-dim)" }}>
            Dès que tu appuies, la catégorie s&apos;affiche et la mèche s&apos;allume. Réponds, puis passe vite à <b className="text-white">{players[(holder + 1) % n]}</b> !
          </p>
          <button
            onClick={light}
            className="mt-7 flex h-40 w-40 flex-col items-center justify-center rounded-full font-black transition-transform active:scale-95"
            style={{
              fontFamily: "var(--font-display)",
              background: "radial-gradient(circle at 35% 30%, #FFC48A, #E8661A)",
              color: "#2A1100",
              border: "4px solid rgba(255,255,255,0.35)",
              boxShadow: "0 0 70px rgba(255,138,61,0.55)",
              animation: "patate-pulse 1.4s ease-in-out infinite",
            }}
          >
            <span className="text-5xl">🔥</span>
            <span className="mt-1 text-xl leading-tight">Allumer<br />la mèche</span>
          </button>
          {losses.some((l) => l > 0) && (
            <button onClick={() => setPhase("end")} className="mt-6 text-sm underline" style={{ color: "var(--text-muted)", minHeight: 44 }}>
              Terminer la partie
            </button>
          )}
        </div>
        <style>{KEYFRAMES}</style>
      </Screen>
    );
  }

  if (phase === "play") {
    const next = (holder + 1) % n;
    const wob = 1.1 - heat * 0.85; // secondes par oscillation
    const tint = `rgba(255,${Math.round(90 - heat * 60)},${Math.round(40 - heat * 30)},${0.12 + heat * 0.35})`;
    return (
      <div
        className="relative flex min-h-dvh select-none flex-col text-white"
        style={{ background: `radial-gradient(120% 70% at 50% 40%, ${tint}, transparent 70%), ${BG}`, touchAction: "manipulation" }}
      >
        <TopRightControls title="La Patate 🥔" rules={RULES} accent={ACCENT} />
        <ScrollReset dep={phase} />
        {/* Catégorie */}
        <div className="px-5 text-center" style={{ paddingTop: top }}>
          <p className="af-eyebrow" style={{ color: ACCENT }}>Catégorie</p>
          <h1
            key={category}
            className="mx-auto mt-2 max-w-sm text-[30px] font-black leading-[1.05]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", animation: "patate-pop 0.35s ease-out" }}
          >
            {category}
          </h1>
          {passes === 0 && (
            <button onClick={() => setCategory(nextCategory())} className="mt-2 text-[13px] underline" style={{ color: "var(--text-muted)", minHeight: 36 }}>
              🔄 Autre catégorie
            </button>
          )}
        </div>

        {/* Patate */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative" key={jolt} style={{ animation: jolt ? "patate-jolt 0.3s ease-out" : undefined }}>
            <div style={{ fontSize: 150, lineHeight: 1, animation: `patate-wobble ${wob}s ease-in-out infinite`, filter: `drop-shadow(0 0 ${20 + heat * 40}px rgba(255,120,40,${0.4 + heat * 0.5}))` }}>
              🥔
            </div>
            <span className="absolute -top-3 right-2 text-4xl" style={{ animation: "patate-spark 0.25s steps(2) infinite" }}>✨</span>
          </div>
          {shakeMode && (
            <div className="mt-3 w-48">
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${Math.min(100, stress)}%`, background: "linear-gradient(90deg,#FFD23F,#FF3E3E)" }} />
              </div>
              <p className="mt-1 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>
                {shakeOk ? (stress > 50 ? "😰 Doucement !!" : "🫨 Ne la secoue pas !") : "🫨 Ne la secoue pas !"}
              </p>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <MascotAvatar color={colorForIndex(holder)} size={40} mood="shocked" />
            <p className="cb-display-md">{players[holder]} <span style={{ color: "var(--text-dim)" }}>l&apos;a !</span></p>
          </div>
        </div>

        {/* Gros bouton passe */}
        <div className="px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
          <button
            onPointerDown={pass}
            className="flex w-full flex-col items-center justify-center rounded-[32px] font-black transition-transform active:scale-[0.97]"
            style={{
              height: "30dvh",
              minHeight: 170,
              fontFamily: "var(--font-display)",
              background: "linear-gradient(160deg, #FFE36B, #FFB000)",
              color: "#2A1600",
              boxShadow: "0 10px 0 #B87A00, 0 0 40px rgba(255,200,0,0.35)",
            }}
          >
            <span className="text-[34px] leading-none">J&apos;AI RÉPONDU</span>
            <span className="mt-2 text-lg font-bold opacity-80">→ passe à {players[next]}</span>
          </button>
        </div>
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  if (phase === "boom" && boom) {
    const ranking = players.map((name, i) => ({ name, i, l: losses[i] })).sort((a, b) => b.l - a.l);
    return (
      <div className="relative flex min-h-dvh flex-col items-center px-5 text-white" style={{ background: "radial-gradient(100% 60% at 50% 25%, rgba(255,80,30,0.45), transparent 70%), " + BG, paddingTop: top, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)", animation: "patate-quake 0.6s ease-out" }}>
        <TopRightControls title="La Patate 🥔" rules={RULES} accent={ACCENT} />
        <ScrollReset dep={phase} />
        {/* Flash de l'explosion */}
        <div className="pointer-events-none fixed inset-0 z-30" style={{ animation: "patate-flash 0.9s ease-out forwards" }} />
        <p className="text-[56px] font-black leading-none" style={{ fontFamily: "var(--font-display)", color: "#FFD23F", animation: "patate-pop 0.5s ease-out", textShadow: "0 0 30px rgba(255,120,40,0.8)" }}>
          BOUM !
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
          {boom.reason === "shake" ? "Trop secouée… elle a explosé 🫨" : `La mèche a tenu ${boom.secs.toFixed(1).replace(".", ",")} s`}
        </p>
        <div className="mt-3">
          <Mascot size={88} color={colorForIndex(boom.loser)} mood="dead" />
        </div>
        <h1 className="cb-display-lg mt-2 text-center">{players[boom.loser]}</h1>
        <p className="text-base" style={{ color: "var(--text-dim)" }}>tenait la patate !</p>

        <div className="mt-4 w-full max-w-sm rounded-3xl p-4 text-center" style={{ background: "rgba(255,138,61,0.14)", border: "1px solid rgba(255,138,61,0.4)" }}>
          {boom.alt ? (
            <>
              <p className="cb-display-md" style={{ color: "#FFC59A" }}>🥤 {boom.penalty}</p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--text-dim)" }}>ou le gage :</p>
              <p className="mt-1 text-[15px] leading-snug">{boom.alt}</p>
            </>
          ) : (
            <>
              <p className="af-eyebrow" style={{ color: "#FFC59A" }}>Gage</p>
              <p className="mt-1 text-[17px] font-semibold leading-snug">{boom.penalty}</p>
            </>
          )}
        </div>

        {/* Score des perdants */}
        <div className="mt-4 w-full max-w-sm">
          <p className="af-eyebrow mb-2 text-center" style={{ color: "var(--text-muted)" }}>Patates reçues</p>
          <div className="flex flex-wrap justify-center gap-2">
            {ranking.map((r) => (
              <div key={r.i} className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3" style={{ background: r.i === boom.loser ? "rgba(255,138,61,0.25)" : "rgba(255,255,255,0.07)" }}>
                <MascotAvatar color={colorForIndex(r.i)} size={26} mood={r.l > 0 ? "sad" : "happy"} />
                <span className="text-[13px] font-semibold">{r.name}</span>
                <span className="text-[13px]">{"🥔".repeat(Math.min(r.l, 5))}{r.l > 5 ? `×${r.l}` : r.l === 0 ? "0" : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex w-full max-w-sm flex-col gap-2 pt-5">
          <button onClick={nextRound} className="af-btn af-btn-primary w-full" style={{ fontSize: 17, padding: "15px 20px", background: `linear-gradient(160deg, #FFB067, ${ACCENT})`, color: "#2A1100" }}>
            Manche suivante 🥔
          </button>
          <button onClick={() => setPhase("end")} className="af-btn af-btn-ghost w-full" style={{ fontSize: 15 }}>
            Fin de la partie
          </button>
        </div>
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  // ── Fin ──
  const ranking = players.map((name, i) => ({ name, i, l: losses[i] })).sort((a, b) => b.l - a.l);
  const worst = ranking[0];
  return (
    <Screen>
      <ConfettiBurst count={50} />
      <ScrollReset dep={phase} />
      <div className="flex flex-1 flex-col items-center px-5 text-center" style={{ paddingTop: top, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <p className="af-eyebrow" style={{ color: ACCENT }}>Fin de partie · {round} manche{round > 1 ? "s" : ""}</p>
        <div className="mt-4">
          <Mascot size={120} color={colorForIndex(worst?.i ?? 0)} mood={worst && worst.l > 0 ? "rofl" : "cool"} crown />
        </div>
        <h1 className="cb-display-lg mt-2">{worst && worst.l > 0 ? worst.name : "Personne"}</h1>
        <p className="mt-1 text-base" style={{ color: "#FFC59A" }}>
          {worst && worst.l > 0 ? `remporte la Patate d'or 🥔 (${worst.l} explosion${worst.l > 1 ? "s" : ""})` : "n'a explosé. Bizarre."}
        </p>
        <div className="mt-5 w-full max-w-sm space-y-2">
          {ranking.map((r, k) => (
            <div key={r.i} className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
              <span className="w-5 text-sm font-bold" style={{ color: "var(--text-muted)" }}>{k + 1}</span>
              <MascotAvatar color={colorForIndex(r.i)} size={30} mood={r.l > 0 ? "dead" : "happy"} />
              <span className="flex-1 text-left font-semibold">{r.name}</span>
              <span className="font-bold">{r.l} 🥔</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex w-full max-w-sm flex-col gap-2 pt-6">
          <button onClick={replay} className="af-btn af-btn-primary w-full" style={{ fontSize: 17, padding: "15px 20px", background: `linear-gradient(160deg, #FFB067, ${ACCENT})`, color: "#2A1100" }}>
            Rejouer
          </button>
          <button onClick={() => setPhase("setup")} className="af-btn af-btn-ghost w-full" style={{ fontSize: 15 }}>
            Changer les joueurs
          </button>
          {onReturnToLobby && (
            <button onClick={onReturnToLobby} className="af-btn af-btn-ghost w-full" style={{ fontSize: 15 }}>
              Quitter
            </button>
          )}
        </div>
      </div>
    </Screen>
  );
}

// ── Petits composants ──
function useTopPad() {
  return "calc(env(safe-area-inset-top, 0px) + 64px)";
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col text-white" style={{ background: `radial-gradient(circle at 50% 10%, rgba(255,138,61,0.22), transparent 50%), ${BG}` }}>
      {children}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm">
      <p className="af-eyebrow mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Choice({ on, onClick, emoji, title, sub }: { on: boolean; onClick: () => void; emoji: string; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]"
      style={{ background: on ? "rgba(255,138,61,0.18)" : "rgba(255,255,255,0.05)", borderColor: on ? ACCENT : "rgba(255,255,255,0.1)" }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-[12px]" style={{ color: "var(--text-dim)" }}>{sub}</span>
      </span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2" style={{ borderColor: on ? ACCENT : "rgba(255,255,255,0.3)" }}>
        {on && <span className="h-3 w-3 rounded-full" style={{ background: ACCENT }} />}
      </span>
    </button>
  );
}

function Toggle({ on, onClick, emoji, title, sub }: { on: boolean; onClick: () => void; emoji: string; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]"
      style={{ background: on ? "rgba(255,138,61,0.18)" : "rgba(255,255,255,0.05)", borderColor: on ? ACCENT : "rgba(255,255,255,0.1)" }}
      aria-pressed={on}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-[12px]" style={{ color: "var(--text-dim)" }}>{sub}</span>
      </span>
      <span className="relative h-7 w-12 rounded-full transition-colors" style={{ background: on ? ACCENT : "rgba(255,255,255,0.18)" }}>
        <span className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? 24 : 4 }} />
      </span>
    </button>
  );
}

const KEYFRAMES = `
@keyframes patate-wobble { 0%,100% { transform: rotate(-9deg) scale(1); } 50% { transform: rotate(9deg) scale(1.05); } }
@keyframes patate-spark { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0.4; transform: scale(0.7) rotate(20deg); } }
@keyframes patate-pop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
@keyframes patate-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes patate-jolt { 0% { transform: translate(0,0); } 25% { transform: translate(-14px,6px) rotate(-8deg); } 50% { transform: translate(12px,-6px) rotate(7deg); } 75% { transform: translate(-6px,3px); } 100% { transform: translate(0,0); } }
@keyframes patate-flash { 0% { background: #fff; } 15% { background: #FFD23F; } 40% { background: rgba(255,80,30,0.8); } 100% { background: rgba(255,80,30,0); } }
@keyframes patate-quake { 0%,100% { transform: translate(0,0); } 10% { transform: translate(-12px,8px); } 20% { transform: translate(10px,-10px); } 30% { transform: translate(-8px,6px); } 45% { transform: translate(6px,-4px); } 60% { transform: translate(-3px,2px); } }
`;
