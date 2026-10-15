"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adultDefault, sipsAllowed } from "@/lib/party-mood";
import type { GameProps } from "@/lib/games/types";
import { PlayersSetup, colorForIndex } from "@/components/games/local-kit";
import { PlayerAvatar, PlayerBlob } from "@/components/avatar/PlayerBlob";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PATATE_THEMES, freeCategories, patateContent, pick, shuffle, themeCategories } from "./categories";
import { PATATE_STR, decimal } from "./i18n";
import { getLang, useLang, useT } from "@/lib/i18n";
import { useUnlocked } from "@/lib/entitlements";
import { LockedPack, PremiumNudge, fmtCount, useNudgeText } from "../premium-nudge";
import { buzz, fuseHeat, preloadObjectSfx, sfxBoom, sfxDetonator, sfxIgnite, sfxPass, sfxTick, startFuse, unlockAudio } from "./fx";
import { ScrollReset, TopRightControls } from "./rules-sheet";
import { C, DISPLAY, INK, NameTag, OptionCard, PotatoBlob, SectionTitle, SoftLink, StickerBtn, StickerCard, StickerScreen, KitStyles, TOP_PAD, BOTTOM_PAD, dotted, sticker } from "./sticker-kit";
import { IdeaButton, RerollButton } from "../idea-button";
import { playCombo, type LoopHandle } from "@/lib/sfx";
import { Check, CupSoda, Drama, Flame, RotateCw, Vibrate } from "lucide-react";
import { GameInlineIcon } from "../game-icon-button";
import { MASCOT_PALETTE } from "@/components/Mascot";
import { uniqueMax, useGameFinished } from "@/lib/game-finished";
import { SoireeGain, SoireeNextButton } from "@/components/games/soiree-next";
import { EndHomeLink, EndPill, EndPills, EndReplay } from "@/components/games/end-actions";

// ── La Patate ──────────────────────────────────────────────
// Le téléphone EST la patate chaude. Une catégorie, chacun dit une réponse
// puis passe le tél. La mèche dure entre 15 et 60 s (cachée), le tic-tac
// accélère ; celui qui tient le tél quand ça explose a perdu.
// Mode « Ne la secoue pas ! » : l'accéléromètre fait exploser plus tôt la
// patate secouée trop fort pendant les passes.

const ACCENT = "#FF8A3D";


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
  /** prochain bip de détonateur (dernières secondes) */
  nextBeep: number;
  /** mèche qui crépite en boucle pendant la manche */
  fuseLoop: LoopHandle | null;
  raf: number;
  over: boolean;
}

/** Les bips de détonateur commencent quand il reste moins de … ms. */
const BEEP_WINDOW = 2200;

// Typage de l'API iOS (absente des types DOM standard)
type MotionCtor = { requestPermission?: () => Promise<"granted" | "denied"> };

/** Taille d'un gros prénom : réduite pour les prénoms longs (évite « Jean- / Christophe »). */
function fitName(name: string, base: string, vw: number): string {
  return `min(${base}, max(24px, ${(vw / (Math.max(name.length, 1) * 0.6)).toFixed(2)}vw))`;
}

export default function PatateGame({ onReturnToLobby }: GameProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [losses, setLosses] = useState<number[]>([]);
  // fin de partie → demande de note éventuelle + stats de la bande (app)
  useGameFinished(phase === "end", { loser: uniqueMax(players, losses), scores: { names: players, values: losses, lowerWins: true } });
  const [sipsOk] = useState(() => sipsAllowed(true)); // mode sans alcool / Soirée « Chill » : gages seulement
  const [penalty, setPenalty] = useState<Penalty>(() => (sipsOk ? "sips" : "dares"));
  const [spicy, setSpicy] = useState(() => adultDefault(false)); // pack 18+ selon l'ambiance de soirée
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
  // sips = null : gage seul ; sinon « n gorgées ou le gage »
  const [boom, setBoom] = useState<{ loser: number; reason: "time" | "shake"; sips: number | null; dare: string; secs: number } | null>(null);
  const t = useT(PATATE_STR);
  // Contenu figé dans la langue du début de partie
  const [content] = useState(() => patateContent(getLang()));
  // App sans Zinzin+ : version découverte (3 thèmes de base, pas de pack 18+)
  const unlocked = useUnlocked();
  const lang = useLang();
  const nudge = useNudgeText();
  const spicyOn = spicy && unlocked;

  const deck = useRef<string[]>([]);
  const run = useRef<Run | null>(null);
  const holderRef = useRef(0);
  const shakeOkRef = useRef(false);

  const nextCategory = useCallback(() => {
    if (deck.current.length === 0) {
      const base = unlocked ? content.classic : freeCategories(content);
      deck.current = shuffle(spicyOn ? [...base, ...content.spicy] : base);
    }
    return deck.current.pop()!;
  }, [spicyOn, unlocked, content]);
  // Zinzin+ activé en cours de partie : la pioche se recharge avec tout le contenu
  useEffect(() => { deck.current = []; }, [unlocked]);

  // ── Explosion ──
  const explode = useCallback(
    (reason: "time" | "shake") => {
      const r = run.current;
      if (!r || r.over) return;
      r.over = true;
      cancelAnimationFrame(r.raf);
      r.fuseLoop?.(0.04);
      r.fuseLoop = null;
      sfxBoom();
      buzz("boom");
      const loser = holderRef.current;
      const dares = spicyOn ? [...content.dares, ...content.daresSpicy] : content.dares;
      const sips = penalty === "dares" ? null : 1 + Math.floor(Math.random() * 3);
      setLosses((l) => l.map((v, i) => (i === loser ? v + 1 : v)));
      setBoom({ loser, reason, sips, dare: pick(dares), secs: (performance.now() - r.start) / 1000 });
      setPhase("boom");
    },
    [penalty, spicyOn, content],
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
        sfxTick(r.high, p);
        r.high = !r.high;
        if (p > 0.55) buzz("tick");
        const interval = Math.max(110, 720 - 600 * Math.pow(p, 1.3));
        r.nextTick = now + interval;
        fuseHeat(r.fuseLoop, p);
        setHeat(p);
        setStress(r.stress);
      }
      // Dernières secondes : bips de détonateur de plus en plus rapprochés
      const left = r.fuse - elapsed;
      if (left < BEEP_WINDOW && now >= r.nextBeep) {
        sfxDetonator();
        r.nextBeep = now + Math.max(110, left / 6);
      }
      r.raf = requestAnimationFrame(step);
    };
    step();
  }, [explode]);

  // Sons préchargés dès l'arrivée dans le jeu
  useEffect(() => {
    preloadObjectSfx();
  }, []);

  // Arrêt propre si on quitte le jeu en pleine manche (mèche comprise)
  useEffect(() => () => {
    if (run.current) {
      run.current.over = true;
      cancelAnimationFrame(run.current.raf);
      run.current.fuseLoop?.(0.05);
      run.current.fuseLoop = null;
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
            setNotice(t.noticeDenied);
          }
        })
        .catch(() => {
          setShakeMode(false);
          setNotice(t.noticeUnavailable);
        });
    } else if (shakeMode && !DM) {
      setShakeMode(false);
      setNotice(t.noticeNoSensor);
    }
    deck.current = [];
    setPhase("ready");
  };

  const light = () => {
    unlockAudio();
    const now = performance.now();
    run.current?.fuseLoop?.(0.05); // sécurité : jamais deux mèches
    run.current = {
      start: now,
      fuse: 15000 + Math.random() * 45000,
      stress: 0,
      lastPass: now,
      lastFrame: now,
      nextTick: now + 300,
      high: true,
      nextBeep: 0,
      fuseLoop: startFuse(),
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
    sfxIgnite();
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

  // Autre gage (le perdant n'a encore rien fait : aucun impact sur le score)
  const rerollDare = () => {
    if (!boom) return;
    const dares = (spicyOn ? [...content.dares, ...content.daresSpicy] : content.dares).filter((d) => d !== boom.dare);
    setBoom({ ...boom, dare: pick(dares) });
  };

  const finish = () => {
    playCombo("fanfare");
    setPhase("end");
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
  const controls = (
    <>
      <TopRightControls title={t.name} rules={sipsOk ? t.rules : [...t.rules.slice(0, -1), t.ruleNoSips]} accent={ACCENT} />
      <ScrollReset dep={phase} />
    </>
  );
  // Classement : le MOINS d'explosions en tête (ex æquo = même rang) ; le plus explosé = Patate d'or (perdant)
  const ranking = players
    .map((name, i) => ({ name, i, l: losses[i] ?? 0 }))
    .sort((a, b) => a.l - b.l)
    .map((r, _k, all) => ({ ...r, rank: 1 + all.filter((x) => x.l < r.l).length }));

  // ══ Écrans ══
  if (phase === "setup") {
    return (
      <>
        {controls}
        <PlayersSetup emoji="" name={t.name} min={3} max={10} accent={ACCENT} onStart={startGame} />
      </>
    );
  }

  if (phase === "config") {
    return (
      <StickerScreen bg={C.night}>
        {controls}
        <div style={{ animation: "zk-wobble 1.6s ease-in-out infinite" }}>
          <PotatoBlob size={118} face="smug" />
        </div>
        <h1 className="mt-1 text-center text-[clamp(40px,12vw,56px)] leading-[0.95]" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          {t.beforeStart}
        </h1>

        {/* Ordre de passage : important avant la 1re manche */}
        <StickerCard bg={C.sky} tilt={-1.5} radius={20} shadow={4} className="mt-5 flex items-center gap-3 px-4 py-3">
          <RotateCw size={26} strokeWidth={3} aria-hidden className="shrink-0" />
          <p className="text-[15px] font-bold leading-snug">
            {t.order}
          </p>
        </StickerCard>

        {sipsOk && (
          <div className="mt-6 w-full space-y-2.5">
            <SectionTitle>{t.loserTakes}</SectionTitle>
            <OptionCard on={penalty === "dares"} onClick={() => setPenalty("dares")} icon={Drama} title={t.dareTitle} sub={t.dareSub} onBg={ACCENT} />
            <OptionCard on={penalty === "sips"} onClick={() => setPenalty("sips")} icon={CupSoda} title={t.sipsTitle} sub={t.sipsSub} onBg={ACCENT} />
          </div>
        )}

        <div className="mt-6 w-full space-y-2.5">
          <SectionTitle>{t.modes}</SectionTitle>
          <OptionCard kind="switch" on={shakeMode} onClick={() => setShakeMode((s) => !s)} icon={Vibrate} title={t.shakeTitle} sub={t.shakeSub} onBg={C.yellow} />
          {unlocked ? (
            <OptionCard kind="switch" on={spicy} onClick={() => setSpicy((s) => !s)} icon={Flame} title={t.spicyTitle} sub={t.spicySub} onBg={C.pink} />
          ) : (
            <LockedPack label={t.spicyTitle} preview={content.spicy.slice(0, 2)} />
          )}
        </div>

        {/* Version découverte : thèmes offerts + thèmes Zinzin+ (cadenas, aperçu) */}
        {!unlocked && (
          <div className="mt-6 w-full space-y-2.5">
            <SectionTitle>{t.themesTitle}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {PATATE_THEMES.filter((th) => th.free).map((th, i) => (
                <span key={th.id} className="inline-flex min-h-11 items-center gap-1.5 px-3.5 text-[15px] font-extrabold"
                  style={{ ...sticker(C.yellow, { radius: 999, shadow: 3, border: 2.5 }), rotate: `${i % 2 ? 1.5 : -1.5}deg` }}>
                  <Check size={15} strokeWidth={3.2} aria-hidden /> {th.label[lang]}
                </span>
              ))}
            </div>
            {PATATE_THEMES.filter((th) => !th.free).map((th) => (
              <LockedPack key={th.id} label={th.label[lang]} preview={themeCategories(content, th).filter((c) => !/[«»“”"]/.test(c)).slice(0, 2)} />
            ))}
          </div>
        )}

        <div className="mt-auto w-full pt-7">
          <StickerBtn big bg={ACCENT} onClick={confirmConfig}>{t.go}</StickerBtn>
          <div className="mt-4 flex justify-center">
            <IdeaButton game="La Patate" kind="catégorie" bg={C.cream} />
          </div>
        </div>
      </StickerScreen>
    );
  }

  if (phase === "ready") {
    const pal = MASCOT_PALETTE[colorForIndex(holder)];
    return (
      <StickerScreen bg={ACCENT} light>
        {controls}
        <span className="text-[17px]" style={{ ...sticker("#fff", { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, letterSpacing: "-0.01em", padding: "4px 14px", transform: "rotate(-3deg)" }}>
          {t.round(round)}
        </span>
        <div className="relative z-[1] mt-3 -mb-6">
          <PlayerBlob name={players[holder]} colorIndex={holder} size={92} mood="shifty" arms />
        </div>
        <h1
          className="max-w-full px-6 pb-2 pt-6 text-center leading-none"
          style={{ ...sticker(pal.body, { radius: 24, shadow: 5, color: pal.body === "#7A4EE8" ? "#fff" : INK }), ...DISPLAY, fontSize: fitName(players[holder], "clamp(36px,11vw,54px)", 76), transform: "rotate(-2deg)", overflowWrap: "anywhere" }}
        >
          {players[holder]}
        </h1>
        <p className="mt-4 text-center text-[19px] leading-tight" style={DISPLAY}>{t.takesPhone}</p>
        {notice && (
          <StickerCard bg={C.cream} radius={18} shadow={3} className="mt-4 px-4 py-2.5 text-center text-[14px] font-bold">
            {notice}
          </StickerCard>
        )}
        <p className="mt-3 max-w-xs text-center text-[16px] font-semibold leading-snug">
          {t.readyHint(players[(holder + 1) % n])}
        </p>

        <button
          type="button"
          onClick={light}
          className="zk-push mt-6 flex shrink-0 flex-col items-center justify-center rounded-full"
          style={{ ...sticker(C.yellow, { radius: 999, shadow: 7, border: 3.5 }), ...DISPLAY, width: "max(132px, min(160px, 21dvh))", height: "max(132px, min(160px, 21dvh))", animation: "patate-pulse 1.4s ease-in-out infinite" }}
        >
          <Flame size={44} strokeWidth={2.6} aria-hidden />
          <span className="mt-1 text-[21px] leading-[1.05]">{t.light[0]}<br />{t.light[1]}</span>
        </button>
        {losses.some((l) => l > 0) && (
          <div className="mt-5">
            <SoftLink light onClick={finish}>{t.endGame}</SoftLink>
          </div>
        )}
        <style>{KEYFRAMES}</style>
      </StickerScreen>
    );
  }

  if (phase === "play") {
    const next = (holder + 1) % n;
    const wob = 1.1 - heat * 0.8; // secondes par oscillation
    // Fond : violet nuit → rouge braise à mesure que la mèche raccourcit
    const bg = heat < 0.5 ? C.night : heat < 0.8 ? "#5A1648" : "#8E1B2E";
    const pal = MASCOT_PALETTE[colorForIndex(holder)];
    return (
      <div
        className="relative flex min-h-dvh shrink-0 select-none flex-col text-white"
        style={{ ...dotted(bg), transition: "background-color .8s", touchAction: "manipulation", paddingTop: TOP_PAD }}
      >
        <KitStyles />
        {controls}
        {/* Catégorie */}
        <div className="px-5">
          <div
            key={category}
            className="zk-pop mx-auto w-full max-w-md px-5 py-4 text-center"
            style={{ ...sticker(C.cream, { radius: 24, shadow: 5 }), ["--zk-r" as string]: "-1.5deg" }}
          >
            <p className="text-[clamp(26px,7.6vw,34px)] leading-[1.05]" style={DISPLAY}>{category}</p>
          </div>
          {passes === 0 && (
            <div className="mt-4 flex justify-center">
              <RerollButton onClick={() => setCategory(nextCategory())} />
            </div>
          )}
        </div>

        {/* Patate */}
        <div className="flex flex-1 flex-col items-center justify-center py-2">
          <div key={jolt} style={{ animation: jolt ? "patate-jolt 0.3s ease-out" : undefined }}>
            <div style={{ animation: `zk-wobble ${wob}s ease-in-out infinite` }}>
              <PotatoBlob size={heat > 0.7 ? 168 : 150} heat={heat} />
            </div>
          </div>
          {shakeMode && (
            <div className="mt-2 w-52">
              <div className="h-4 overflow-hidden" style={{ ...sticker("#fff", { radius: 999, shadow: 0, border: 2.5 }) }}>
                <div className="h-full transition-[width] duration-150" style={{ width: `${Math.min(100, stress)}%`, background: stress > 60 ? C.coral : C.yellow }} />
              </div>
              <p className="mt-1.5 text-center text-[15px] font-bold">
                <GameInlineIcon icon={Vibrate} /> {shakeOk && stress > 50 ? t.gentle : t.shakeTitle}
              </p>
            </div>
          )}
          <p className="mt-3 flex items-center gap-2 text-[24px] leading-none" style={DISPLAY}>
            <NameTag bg={pal.body} style={{ color: pal.body === "#7A4EE8" ? "#fff" : INK, maxWidth: "calc(100vw - 130px)" }}>{players[holder]}</NameTag>
            <span>{t.holds}</span>
          </p>
        </div>

        {/* Gros bouton passe */}
        <div className="px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)" }}>
          <button
            type="button"
            onPointerDown={pass}
            className="zk-push flex w-full flex-col items-center justify-center"
            style={{ ...sticker(C.yellow, { radius: 32, shadow: 7, border: 3.5 }), ...DISPLAY, height: "27dvh", minHeight: 160, maxHeight: 240 }}
          >
            <span className="text-[38px] leading-none">{t.answered}</span>
            <span className="mt-2.5 max-w-[90%] truncate text-[21px] leading-tight" style={{ letterSpacing: "-0.01em" }}>
              {t.passTo(players[next])}
            </span>
          </button>
        </div>
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  if (phase === "boom" && boom) {
    const pal = MASCOT_PALETTE[colorForIndex(boom.loser)];
    return (
      <div
        className="relative flex min-h-dvh shrink-0 flex-col items-center px-5 text-white"
        style={{ ...dotted(C.coral, true), paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD, animation: "patate-quake 0.6s ease-out" }}
      >
        <KitStyles />
        {controls}
        {/* Flash de l'explosion */}
        <div className="pointer-events-none fixed inset-0 z-30" style={{ animation: "patate-flash 0.9s ease-out forwards" }} />
        <div className="flex w-full max-w-md flex-1 flex-col items-center">
          <p className="zk-pop text-[78px] leading-none" style={{ ...DISPLAY, color: C.yellow, textShadow: `5px 5px 0 ${INK}`, WebkitTextStroke: `2.5px ${INK}`, ["--zk-r" as string]: "-4deg" }}>
            {t.boom}
          </p>
          <p className="mt-2 text-center text-[16px] font-bold" style={{ color: INK }}>
            {boom.reason === "shake" ? t.tooShaken : t.fuseLasted(decimal(boom.secs, 1, t.dec))}
          </p>
          <div className="relative z-[1] mt-3 -mb-5">
            <PlayerBlob name={players[boom.loser]} colorIndex={boom.loser} size={92} mood="dead" />
          </div>
          <div
            className="max-w-full px-5 pb-2 pt-5 text-center"
            style={{ ...sticker(pal.body, { radius: 22, shadow: 5, color: pal.body === "#7A4EE8" ? "#fff" : INK }), transform: "rotate(-2deg)" }}
          >
            <p className="leading-none" style={{ ...DISPLAY, fontSize: fitName(players[boom.loser], "clamp(32px,10vw,46px)", 78), overflowWrap: "anywhere" }}>{players[boom.loser]}</p>
          </div>
          <p className="mt-3 text-[20px]" style={{ ...DISPLAY, color: INK }}>{t.heldPotato}</p>

          <StickerCard bg={C.cream} radius={24} shadow={5} className="mt-4 p-4 text-center">
            {boom.sips != null ? (
              <>
                <p className="text-[26px] leading-tight" style={DISPLAY}><GameInlineIcon icon={CupSoda} /> {t.sips(boom.sips)}</p>
                <p className="mt-1 text-[15px] font-bold" style={{ color: "#4A3A66" }}>{t.orDare}</p>
                <p className="mt-1 text-[18px] font-semibold leading-snug">{boom.dare}</p>
              </>
            ) : (
              <>
                <p className="text-[22px] leading-tight" style={DISPLAY}>{t.yourDare}</p>
                <p className="mt-1 text-[18px] font-semibold leading-snug">{boom.dare}</p>
              </>
            )}
            <div className="mt-3 flex justify-center">
              <RerollButton onClick={rerollDare} label={t.rerollDare} bg={C.yellow} />
            </div>
          </StickerCard>

          {/* Score des perdants */}
          <div className="mt-5 w-full">
            <p className="mb-2 text-center text-[20px]" style={{ ...DISPLAY, color: INK }}>{t.scoreTitle}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {ranking.map((r) => (
                <span
                  key={r.i}
                  className="flex items-center gap-1.5 py-1 pl-1 pr-3 text-[15px] font-bold"
                  style={{ ...sticker(r.i === boom.loser ? C.yellow : "#fff", { radius: 999, shadow: 2, border: 2.5 }) }}
                >
                  <PlayerAvatar name={r.name} colorIndex={r.i} size={28} mood={r.l > 0 ? "sad" : "happy"} border={false} />
                  {r.name}
                  <span style={DISPLAY}>· {r.l}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto flex w-full flex-col items-center gap-1 pt-6">
            <StickerBtn big bg={C.yellow} onClick={nextRound}>{t.nextRound}</StickerBtn>
            <SoftLink light onClick={finish}>{t.finish}</SoftLink>
          </div>
        </div>
        <style>{KEYFRAMES}</style>
      </div>
    );
  }

  // ── Fin ──
  const anyBoom = ranking.some((r) => r.l > 0);
  const leaders = ranking.filter((r) => r.rank === 1);
  const best = leaders.length === 1 ? leaders[0] : null;
  const worstName = uniqueMax(players, losses);
  const worst = worstName != null ? ranking.find((r) => r.name === worstName) ?? null : null;
  const hero = best ?? leaders[0];
  return (
    <StickerScreen bg={C.night}>
      <ConfettiBurst count={50} />
      <ScrollReset dep={phase} />
      <span className="text-[17px]" style={{ ...sticker(C.yellow, { radius: 999, shadow: 3, border: 2.5 }), ...DISPLAY, letterSpacing: "-0.01em", padding: "4px 14px", transform: "rotate(-3deg)" }}>
        {t.roundsPlayed(round)}
      </span>
      <div className="mt-4 flex items-end">
        {/* Ex æquo en tête : tous couronnés (ce sont eux qui gagnent, comme dans la Soirée) */}
        {anyBoom && leaders.length > 1
          ? leaders.map((r) => <PlayerBlob key={r.i} name={r.name} colorIndex={r.i} size={leaders.length > 2 ? 64 : 84} mood="cool" crown shadow />)
          : <PlayerBlob name={anyBoom ? hero?.name : undefined} colorIndex={anyBoom ? hero?.i ?? 0 : 0} size={110} mood="cool" crown={anyBoom} shadow />}
        <PotatoBlob size={70} face="smug" style={{ marginLeft: -18 }} />
      </div>
      {(() => {
        // Héros = le joueur qui a le MOINS explosé (égalité en tête = titre d'égalité)
        const title = !anyBoom ? t.nobody : best ? best.name : t.tieTop;
        const sub = !anyBoom ? t.nobodyBlew : best ? t.winsWith(best.l) : t.tieNames(leaders.map((r) => r.name).join(", "));
        return (
          <>
            <h1 className="mt-2 max-w-full text-center leading-[0.95]" style={{ ...DISPLAY, fontSize: fitName(title, "clamp(40px,12vw,56px)", 88), textShadow: `4px 4px 0 ${INK}`, overflowWrap: "anywhere" }}>
              {title}
            </h1>
            <p className="mt-2 text-center text-[19px] leading-tight" style={{ ...DISPLAY, color: C.yellow }}>{sub}</p>
          </>
        );
      })()}
      {/* Patate d'or : celui qui a le plus explosé (seul en tête des explosions) */}
      {worst && (
        <div className="mt-4 flex w-full items-center gap-3 px-3 py-2.5" style={{ ...sticker(C.yellow, { radius: 18, shadow: 3 }), transform: "rotate(-1deg)" }}>
          <PlayerAvatar name={worst.name} colorIndex={worst.i} size={40} mood="rofl" border={false} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[14px] font-bold">{t.goldTitle}</span>
            <span className="block text-[20px]" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{worst.name}</span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-[18px]" style={DISPLAY}>{t.booms(worst.l)}</span>
        </div>
      )}
      <div className="mt-5 w-full space-y-2">
        {ranking.map((r, k) => (
          <div key={r.i} className="zk-rise flex items-center gap-3 px-3 py-2" style={{ ...sticker(r.rank === 1 && anyBoom ? C.mint : C.cream, { radius: 18, shadow: 3 }), animationDelay: `${k * 0.06}s` }}>
            <span className="w-6 text-center text-[20px]" style={DISPLAY}>{r.rank}</span>
            <PlayerAvatar name={r.name} colorIndex={r.i} size={34} mood={r.rank === 1 ? "cool" : r.name === worst?.name ? "dead" : "happy"} border={false} />
            {/* Prénom long : passe à la ligne (au tiret) plutôt que d'être tronqué */}
            <span className="min-w-0 flex-1 text-[18px] leading-tight" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>{r.name}</span>
            <span className="shrink-0 whitespace-nowrap text-[18px]" style={DISPLAY}>{t.booms(r.l)}</span>
            <SoireeGain name={r.name} />
          </div>
        ))}
      </div>
      {!unlocked && (
        <PremiumNudge
          style={{ marginTop: 18 }}
          text={nudge.patate(fmtCount(content.classic.length - freeCategories(content).length + content.spicy.length, lang))}
        />
      )}
      {/* Une seule action principale (Jeu suivant en Soirée, sinon Rejouer), le reste en pastilles */}
      <div className="mt-auto flex w-full flex-col items-center gap-3 pt-7">
        <SoireeNextButton bg={ACCENT} />
        <EndReplay onClick={replay} label={t.replay}>
          <StickerBtn big bg={ACCENT} onClick={replay}>{t.replay}</StickerBtn>
        </EndReplay>
        <EndPills className="mt-1">
          <EndPill bg={C.cream} onClick={() => setPhase("setup")}>{t.players}</EndPill>
          <IdeaButton short game="La Patate" kind="catégorie" bg={C.cream} />
        </EndPills>
        <EndHomeLink onClick={onReturnToLobby}>{t.quit}</EndHomeLink>
      </div>
    </StickerScreen>
  );
}

const KEYFRAMES = `
@keyframes patate-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes patate-jolt { 0% { transform: translate(0,0); } 25% { transform: translate(-14px,6px) rotate(-8deg); } 50% { transform: translate(12px,-6px) rotate(7deg); } 75% { transform: translate(-6px,3px); } 100% { transform: translate(0,0); } }
@keyframes patate-flash { 0% { background: #fff; } 15% { background: #FFD23F; } 40% { background: rgba(255,80,30,0.8); } 100% { background: rgba(255,80,30,0); } }
@keyframes patate-quake { 0%,100% { transform: translate(0,0); } 10% { transform: translate(-12px,8px); } 20% { transform: translate(10px,-10px); } 30% { transform: translate(-8px,6px); } 45% { transform: translate(6px,-4px); } 60% { transform: translate(-3px,2px); } }
`;
