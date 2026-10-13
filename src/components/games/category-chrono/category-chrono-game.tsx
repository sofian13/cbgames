"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { adultDefault } from "@/lib/party-mood";
import type { GameProps } from "@/lib/games/types";
import { PlayersSetup, colorForIndex, useScrollTopOn } from "@/components/games/local-kit";
import { Mascot, MascotAvatar, MASCOT_PALETTE } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { isSfxMuted, playCombo, playSfx, preloadSfx, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import { PACKS_BY_LANG, type Category } from "./categories";
import { useLang, useT } from "@/lib/i18n";
import { STR } from "./i18n";
import { ArrowLeft, BookOpen, Check, Clapperboard, Flame, Heart, PartyPopper, RotateCcw, Skull, Volume2, VolumeX, X, type LucideIcon } from "lucide-react";
import { GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";

// ── Catégorie Chrono ───────────────────────────────────────
// Une catégorie s'affiche, le tél tourne : chacun doit donner un mot de la
// catégorie avant la fin du chrono (qui raccourcit à chaque bonne réponse).
// Pas de mot, mot déjà dit ou hors sujet = une vie en moins. Dernier en vie gagne.

const ACCENT = "#FF6B5B"; // corail du jeu
const INK = "#15082E";
const NIGHT = "#1E1250";
const TOP_SAFE = "calc(env(safe-area-inset-top, 0px) + 72px)";
const BOTTOM_SAFE = "calc(env(safe-area-inset-bottom, 0px) + 20px)";
const DOTS = "radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px)";
const MIN_TIME = 3;
const DISPLAY: CSSProperties = { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, letterSpacing: "-0.03em", wordSpacing: "0.12em" };

/** Icône de chaque pack (pas d'emoji en visuel d'interface) */
const PACK_ICON: Record<string, LucideIcon> = { classique: BookOpen, soiree: PartyPopper, culture: Clapperboard, coquin: Flame };

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

const vib = (p: number | number[]) => {
  try {
    navigator.vibrate?.(p);
  } catch {
    /* rien */
  }
};

const KEYFRAMES = `
@keyframes cc-pop { 0% { transform: scale(.6) rotate(var(--r,0deg)); opacity: 0 } 70% { transform: scale(1.06) rotate(var(--r,0deg)); opacity: 1 } 100% { transform: scale(1) rotate(var(--r,0deg)) } }
@keyframes cc-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 50% { transform: translateX(8px) } 75% { transform: translateX(-4px) } }
@keyframes cc-throb { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }
`;

/** Son coupé / actif : une seule coupure globale (sfx.ts). */
function useSfxMuted() {
  return useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);
}

export default function CategoryChronoGame({ onReturnToLobby }: GameProps) {
  const muted = useSfxMuted();
  // Langue courante : interface + catégories (mêmes packs dans toutes les langues)
  const lang = useLang();
  const t = STR[lang];
  const PACKS = PACKS_BY_LANG[lang];

  const [phase, setPhase] = useState<Phase>("setup");
  // Chaque écran repart du haut (sinon la catégorie s'ouvre défilée si on a scrollé les réglages)
  useScrollTopOn(phase);
  const [names, setNames] = useState<string[]>([]);
  const [packs, setPacks] = useState<string[]>(() => PACKS.filter((p) => (p.adult ? adultDefault(!!p.defaultOn) : p.defaultOn)).map((p) => p.id)); // pack 18+ selon l'ambiance de soirée
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

  const pool = useMemo(() => PACKS.filter((p) => packs.includes(p.id)).flatMap((p) => p.items), [packs, PACKS]);
  const category = queue[catIdx];
  const turnTime = (n: number) => Math.max(MIN_TIME, timerBase - n * 0.5);

  useEffect(() => {
    preloadSfx(["tick", "tock", "ding", "whoosh", "card-flip", "wrong", "lose", "boom", "thump", "plate", "whooshdown", "win", "powerup", "confirm"]);
  }, []);

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
    let lastTick = -1;
    const id = setInterval(() => {
      const left = Math.max(0, (endAt.current - Date.now()) / 1000);
      setTimeLeft(left);
      const s = Math.ceil(left);
      // tic-tac sur les 3 dernières secondes, de plus en plus aigu
      if (left > 0 && s <= 3 && s !== lastTick) {
        lastTick = s;
        playSfx(s % 2 ? "tick" : "tock", { volume: 0.9, rate: 1 + (3 - s) * 0.15 });
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
    playSfx("card-flip", { volume: 0.8 });
  };

  const go = () => {
    setStreak(0);
    endAt.current = Date.now() + timerBase * 1000;
    setTimeLeft(timerBase);
    setPhase("playing");
    playSfx("confirm", { volume: 0.8 });
  };

  /** Catégorie suivante dans la pioche (jamais vue dans la partie tant qu'il en reste). */
  const nextCategory = () => {
    if (catIdx + 1 < queue.length) setCatIdx(catIdx + 1);
    else {
      setQueue(shuffle(pool));
      setCatIdx(0);
    }
  };

  const valid = () => {
    if (phase !== "playing") return;
    const n = streak + 1;
    const t = turnTime(n);
    endAt.current = Date.now() + t * 1000;
    setTimeLeft(t);
    setStreak(n);
    setCur(nextAlive(cur, players));
    playSfx("ding", { volume: 0.7, rate: 1 + Math.min(n, 12) * 0.04 });
    playSfx("whoosh", { volume: 0.35, rate: 1.2, delay: 0.05 });
    vib(25);
  };

  function lose() {
    if (phase !== "playing") return;
    const updated = players.map((p, i) => (i === cur ? { ...p, lives: p.lives - 1 } : p));
    setPlayers(updated);
    setLostIdx(cur);
    const out = updated[cur].lives <= 0;
    const over = updated.filter((p) => p.lives > 0).length <= 1;
    if (out) playCombo("explosion");
    else playCombo("fail");
    if (over) setTimeout(() => playCombo("fanfare"), 700);
    vib([200, 80, 200]);
    setPhase(over ? "over" : "lost");
  }

  const continueGame = () => {
    // Le perdant (s'il est encore en vie) relance sur une nouvelle catégorie
    setCur(players[lostIdx].lives > 0 ? lostIdx : nextAlive(lostIdx, players));
    nextCategory();
    setPhase("reveal");
    playSfx("card-flip", { volume: 0.8 });
  };

  const soundBtn = (
    <GameTopRight>
      <GameIconButton
        icon={muted ? VolumeX : Volume2}
        label={muted ? t.soundOn : t.soundOff}
        active={muted}
        onClick={() => setSfxMuted(!muted)}
      />
    </GameTopRight>
  );

  // ── Écrans ─────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <PlayersSetup
        emoji="⏱️"
        name={t.title}
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
      <Page>
        {soundBtn}
        <div className="mx-auto w-full max-w-md">
          <h1 style={{ ...DISPLAY, fontSize: "clamp(40px, 12vw, 58px)", lineHeight: 0.92 }}>
            {t.titleTop}
            <br />
            <span style={{ color: ACCENT }}>{t.titleBottom}</span>
          </h1>

          {/* Les règles en 3 stickers */}
          <div className="mt-5 grid gap-3">
            {[
              { bg: "#FFD23F", t: <>{t.rule1[0]}<b>{t.rule1[1]}</b>{t.rule1[2]}</> },
              { bg: "#FFF6E5", t: <>{t.rule2[0]}<b>{t.rule2[1]}</b>{t.rule2[2]}</> },
              { bg: "#3DDC97", t: <>{t.rule3[0]}<b>{t.rule3[1]}</b>{t.rule3[2]}<b>{t.rule3[3]}</b>{t.rule3[4]}</> },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[20px] px-3.5 py-3" style={{ ...sticker(r.bg), color: INK, transform: `rotate(${i === 1 ? 1 : -1}deg)` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] text-[22px]" style={{ ...DISPLAY, ...sticker("#fff", 2), color: INK }}>
                  {i + 1}
                </span>
                <p className="text-[15px] font-semibold leading-snug">{r.t}</p>
              </div>
            ))}
          </div>

          <SectionTitle>{t.themes}</SectionTitle>
          <p className="mt-0.5 text-[14px] font-semibold text-white/70">{t.poolCount(pool.length)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {PACKS.map((p, i) => {
              const on = packs.includes(p.id);
              const bg = on ? (p.adult ? "#FF3EA5" : "#FFD23F") : "#2E1F6B";
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    playSfx("toggle", { volume: 0.5 });
                    setPacks((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]));
                  }}
                  className="relative flex items-center gap-2 rounded-[18px] pl-2.5 pr-2 text-left transition-transform active:translate-y-[3px]"
                  style={{ ...sticker(bg), color: on ? INK : "#fff", minHeight: 60, transform: `rotate(${i % 2 ? 1 : -1}deg)` }}
                  aria-pressed={on}
                >
                  {(() => { const Icon = PACK_ICON[p.id] ?? BookOpen; return <Icon size={20} strokeWidth={2.6} className="shrink-0" aria-hidden />; })()}
                  <span className="min-w-0 flex-1 text-[14.5px] font-bold leading-tight">
                    {p.name}
                    {p.adult && <span className="block text-[13px] font-semibold" style={{ opacity: 0.8 }}>18+</span>}
                  </span>
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                    style={{ background: on ? "#fff" : "transparent", border: `2.5px solid ${on ? INK : "rgba(255,255,255,0.5)"}` }}
                    aria-hidden
                  >
                    {on && <Check size={14} strokeWidth={3.5} color={INK} />}
                  </span>
                </button>
              );
            })}
          </div>

          <SectionTitle>{t.startTimer}</SectionTitle>
          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {[6, 8, 10, 15].map((d) => (
              <Pill key={d} on={timerBase === d} onClick={() => setTimerBase(d)}>
                {d}&nbsp;s
              </Pill>
            ))}
          </div>

          <SectionTitle>{t.lives}</SectionTitle>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((n) => (
              <Pill key={n} on={startLives === n} onClick={() => setStartLives(n)}>
                <LifeHearts n={n} size={18} label={t.livesAria(n)} />
              </Pill>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <IdeaButton game="Catégorie Chrono" kind="idée de catégorie" bg="#fff" />
          </div>
        </div>

        <BottomBar>
          <BigBtn bg={ACCENT} disabled={!pool.length} onClick={() => startGame(names)}>
            {pool.length ? t.letsGo : t.pickTheme}
          </BigBtn>
          <button type="button" onClick={() => setPhase("setup")} className="mx-auto mt-1 block min-h-11 px-4 text-[15px] font-semibold text-white/80">
            <GameInlineIcon icon={ArrowLeft} /> {t.editPlayers}
          </button>
        </BottomBar>
      </Page>
    );
  }

  if (phase === "reveal" && category) {
    const starter = players[cur];
    return (
      <Page center>
        <style>{KEYFRAMES}</style>
        {soundBtn}
        <Lives players={players} cur={cur} />
        <div className={`flex flex-1 flex-col items-center justify-center ${players.length > 6 ? "py-3" : "py-6"}`}>
          {/* beaucoup de joueurs : on gagne de la place pour que « Une autre » reste visible */}
          {players.length <= 6 && <p className="text-[17px] font-semibold text-white/80">{t.theCategory}</p>}
          <div
            key={category.name}
            className="mt-3 w-full max-w-sm rounded-[28px] px-5 pb-6 pt-5 text-center"
            style={{ ...sticker("#FFF6E5", 6), color: INK, ["--r" as string]: "-2deg", transform: "rotate(-2deg)", animation: "cc-pop .45s ease-out" }}
          >
            <h2 style={{ ...DISPLAY, fontSize: category.name.length > 22 ? 34 : 42, lineHeight: 0.98, overflowWrap: "anywhere" }}>{category.name}</h2>
            <p className="mt-3 text-[15px] font-semibold" style={{ color: "#4A3A66" }}>
              {t.forExample} {category.examples}
            </p>
          </div>
          <div className={players.length > 6 ? "mt-4" : "mt-6"}>
            <RerollButton onClick={() => { nextCategory(); playSfx("card-flip", { volume: 0.7, delay: 0.08 }); }} />
          </div>
        </div>
        <BottomBar>
          <p className="mb-3 text-center text-[16px] font-semibold text-white/85">
            <span className="rounded-full px-2.5 py-0.5 font-bold" style={{ ...sticker(MASCOT_PALETTE[colorForIndex(cur)].body, 2), color: inkOn(MASCOT_PALETTE[colorForIndex(cur)].body) }}>{starter?.name}</span>{" "}
            {t.starts(timerBase)}
          </p>
          <BigBtn bg={ACCENT} onClick={go}>{t.go}</BigBtn>
        </BottomBar>
      </Page>
    );
  }

  if (phase === "playing" && category) {
    const total = turnTime(streak);
    const pct = Math.max(0, Math.min(100, (timeLeft / total) * 100));
    const barColor = pct > 50 ? "#3DDC97" : pct > 25 ? "#FFD23F" : "#FF6B5B";
    const urgent = timeLeft <= 3;
    const col = colorForIndex(cur);
    return (
      <div
        className="relative flex min-h-[100dvh] shrink-0 select-none flex-col text-white"
        style={{ background: urgent ? "#3A0F3F" : NIGHT, backgroundImage: DOTS, backgroundSize: "22px 22px", touchAction: "manipulation", paddingTop: TOP_SAFE, paddingBottom: BOTTOM_SAFE, transition: "background-color .3s" }}
      >
        <style>{KEYFRAMES}</style>
        {soundBtn}
        <div className="mx-auto w-full max-w-md px-5">
          {/* Catégorie + chrono en un sticker */}
          <div className="rounded-[22px] px-4 pb-3.5 pt-3" style={{ ...sticker("#FFF6E5", 5), color: INK, transform: "rotate(-1deg)" }}>
            <p className="text-center text-[17px] font-bold leading-tight" style={{ overflowWrap: "anywhere" }}>{category.name}</p>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-4 flex-1 overflow-hidden rounded-full" style={{ background: "#fff", border: `2.5px solid ${INK}` }}>
                <div className="h-full" style={{ width: `${pct}%`, background: barColor, borderRight: pct > 0 && pct < 100 ? `2.5px solid ${INK}` : undefined, transition: "width .1s linear" }} />
              </div>
              <span
                className="w-[74px] text-right tabular-nums"
                style={{ ...DISPLAY, fontSize: 34, lineHeight: 1, color: urgent ? "#E2332B" : INK, animation: urgent ? "cc-throb .5s ease-in-out infinite" : undefined }}
              >
                {timeLeft.toFixed(1).replace(".", t.decimal)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <p className="text-[18px] font-semibold text-white/85">{t.itsTurn}</p>
          <div key={`${cur}-${streak}`} style={{ animation: "cc-pop .25s ease-out" }} className="flex flex-col items-center">
            <div className="relative z-[1] -mb-5">
              <Mascot size={104} color={col} mood={urgent ? "shocked" : "happy"} arms shadow={false} sweat={urgent} />
            </div>
            <h2
              className="max-w-full rounded-[22px] px-6 pb-2 pt-6"
              style={{ ...DISPLAY, ...sticker(MASCOT_PALETTE[col].body, 5), color: inkOn(MASCOT_PALETTE[col].body), fontSize: nameSize(players[cur]?.name ?? "", 54), lineHeight: 1, transform: "rotate(2deg)", overflowWrap: "anywhere" }}
            >
              {players[cur]?.name}
            </h2>
          </div>
          <p className="mt-5 text-[17px] font-semibold text-white/85">{t.sayWord}</p>
          {streak > 0 && (
            <span className="mt-2 rounded-full px-3 py-1 text-[15px] font-bold" style={{ ...sticker("#FFD23F", 3), color: INK, transform: "rotate(-2deg)" }}>
              {t.wordsSaid(streak)}
            </span>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-md gap-3 px-5">
          <PlayBtn bg="#3DDC97" onClick={valid} icon={<Check size={30} strokeWidth={3.5} />} label={t.valid} />
          <PlayBtn bg="#FF6B5B" onClick={lose} icon={<X size={30} strokeWidth={3.5} />} label={t.failed} />
        </div>
      </div>
    );
  }

  if (phase === "lost") {
    const p = players[lostIdx];
    const out = p.lives <= 0;
    const col = colorForIndex(lostIdx);
    return (
      <Page center>
        <style>{KEYFRAMES}</style>
        {soundBtn}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div style={{ animation: "cc-shake .5s ease-out" }} className="relative z-[1] -mb-5">
            <Mascot size={120} color={col} mood={out ? "dead" : "sad"} arms shadow={false} />
          </div>
          <div className="rounded-[24px] px-6 pb-4 pt-7 text-center" style={{ ...sticker(MASCOT_PALETTE[col].body, 6), color: inkOn(MASCOT_PALETTE[col].body), transform: "rotate(-2deg)", maxWidth: "100%" }}>
            <h2 style={{ ...DISPLAY, fontSize: nameSize(p.name, 50), lineHeight: 1, overflowWrap: "anywhere" }}>{p.name}</h2>
          </div>
          <p className="mt-5 text-center" style={{ ...DISPLAY, fontSize: 28, lineHeight: 1.05, color: out ? "#FF8A7E" : "#fff" }}>
            {out ? t.eliminated : t.losesLife}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[16px] font-semibold text-white/85">
            {out ? <><GameInlineIcon icon={Skull} /> {t.noLifeLeft}</> : <>{t.livesLeft} <LifeHearts n={p.lives} size={18} label={t.livesAria(p.lives)} /></>}
          </div>
          <div className="mt-6">
            <Lives players={players} cur={-1} />
          </div>
        </div>
        <BottomBar>
          <BigBtn bg="#FFD23F" onClick={continueGame}>{t.nextCategory}</BigBtn>
        </BottomBar>
      </Page>
    );
  }

  // ── Fin de partie ──
  const ranking = players.map((p, i) => ({ ...p, i })).sort((a, b) => b.lives - a.lives);
  const winner = ranking[0];
  const wcol = winner ? colorForIndex(winner.i) : "yellow";
  return (
    <Page>
      <ConfettiBurst />
      {soundBtn}
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <p className="text-[18px] font-semibold text-white/85">{t.lastStanding}</p>
        <div className="relative z-[1] -mb-5 mt-2">
          <Mascot size={118} color={wcol} mood="cool" arms crown cheering shadow={false} />
        </div>
        <div className="rounded-[26px] px-7 pb-4 pt-7 text-center" style={{ ...sticker(MASCOT_PALETTE[wcol].body, 6), color: inkOn(MASCOT_PALETTE[wcol].body), transform: "rotate(-2deg)", maxWidth: "100%" }}>
          <h2 style={{ ...DISPLAY, fontSize: nameSize(winner?.name ?? t.nobody, 58), lineHeight: 1, overflowWrap: "anywhere" }}>{winner?.name ?? t.nobody}</h2>
        </div>

        <SectionTitle>{t.ranking}</SectionTitle>
        <div className="mt-3 w-full space-y-2.5">
          {ranking.map((p, k) => (
            <div
              key={p.i}
              className="flex items-center gap-3 rounded-[18px] px-3"
              style={{ ...sticker(k === 0 ? "#FFD23F" : p.lives > 0 ? "#FFF6E5" : "#B9B0D6", 3), color: INK, minHeight: 56, transform: `rotate(${k % 2 ? 0.8 : -0.8}deg)` }}
            >
              <span className="w-7 text-center" style={{ ...DISPLAY, fontSize: 22 }}>
                {p.lives > 0 ? k + 1 : <Skull size={20} strokeWidth={2.8} className="mx-auto" aria-label={t.eliminatedAria} />}
              </span>
              <MascotAvatar color={colorForIndex(p.i)} size={34} mood={k === 0 ? "cool" : p.lives > 0 ? "happy" : "dead"} />
              <span className="min-w-0 flex-1 truncate text-[17px] font-bold">{p.name}</span>
              {p.lives > 0 && <LifeHearts n={p.lives} size={16} label={t.livesAria(p.lives)} />}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <IdeaButton game="Catégorie Chrono" kind="idée de catégorie" bg="#fff" />
        </div>
      </div>

      <BottomBar>
        <BigBtn bg={ACCENT} onClick={() => startGame(names)}>
          <RotateCcw size={22} strokeWidth={3} aria-hidden /> {t.playAgain}
        </BigBtn>
        <div className="mt-1 flex justify-center gap-2">
          <button type="button" onClick={() => setPhase("config")} className="min-h-11 px-3 text-[15px] font-semibold text-white/85">
            {t.changeSettings}
          </button>
          {onReturnToLobby && (
            <button type="button" onClick={onReturnToLobby} className="min-h-11 px-3 text-[15px] font-semibold text-white/85">
              {t.quit}
            </button>
          )}
        </div>
      </BottomBar>
    </Page>
  );
}

// ── Briques « sticker » ────────────────────────────────────
/** Taille d'un prénom en gros : baisse avec la longueur pour tenir sur une ligne (16 car. max). */
function nameSize(name: string, max: number): string {
  return `min(${max}px, 11vw, ${(118 / Math.max(1, name.length)).toFixed(1)}vw)`;
}

/** Texte lisible sur une couleur pleine : encre foncée ou blanc. */
function inkOn(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!m) return INK;
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.22 ? INK : "#fff";
}

function sticker(bg: string, shadow = 4): CSSProperties {
  return { background: bg, border: `${shadow >= 5 ? 3 : 2.5}px solid ${INK}`, boxShadow: `0 ${shadow}px 0 ${INK}` };
}

function Page({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <div
      className="relative flex min-h-[100dvh] shrink-0 flex-col px-5 text-white"
      style={{ background: NIGHT, backgroundImage: DOTS, backgroundSize: "22px 22px", paddingTop: TOP_SAFE, paddingBottom: BOTTOM_SAFE, alignItems: center ? "center" : undefined }}
    >
      {children}
    </div>
  );
}

/** Bas d'écran collant : bouton principal pleine largeur. */
function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky bottom-0 z-[2] -mx-5 mt-auto w-[calc(100%+40px)] px-5 pt-5"
      style={{ paddingBottom: BOTTOM_SAFE, marginBottom: `calc(-1 * ${BOTTOM_SAFE})`, background: `linear-gradient(180deg, transparent, ${NIGHT} 38%)` }}
    >
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}

function BigBtn({ bg, onClick, disabled, children }: { bg: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-full text-[22px] transition-transform active:translate-y-[3px] disabled:opacity-60"
      style={{ ...DISPLAY, letterSpacing: "-0.01em", ...(disabled ? sticker("#3B2C7A", 5) : sticker(bg, 5)), color: disabled ? "rgba(255,255,255,0.8)" : INK }}
    >
      {children}
    </button>
  );
}

function PlayBtn({ bg, onClick, icon, label }: { bg: string; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[26px] transition-transform active:translate-y-[4px]"
      style={{ ...sticker(bg, 6), color: INK, minHeight: 112 }}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full" style={{ ...sticker("#fff", 2) }}>{icon}</span>
      <span style={{ ...DISPLAY, fontSize: 24, lineHeight: 1 }}>{label}</span>
    </button>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-7" style={{ ...DISPLAY, fontSize: 26, lineHeight: 1 }}>{children}</h2>;
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => { playSfx("select", { volume: 0.5 }); onClick(); }}
      aria-pressed={on}
      className="flex min-h-[54px] items-center justify-center rounded-[18px] px-2 text-[20px] transition-transform active:translate-y-[3px]"
      style={{ ...DISPLAY, letterSpacing: "-0.02em", ...sticker(on ? "#FFD23F" : "#2E1F6B", on ? 4 : 3), color: on ? INK : "#fff", transform: on ? "rotate(-2deg)" : undefined }}
    >
      {children}
    </button>
  );
}

function Lives({ players, cur }: { players: P[]; cur: number }) {
  const livesAria = useT(STR).livesAria;
  // beaucoup de joueurs → pastilles plus compactes (la catégorie reste visible sur petit écran)
  const many = players.length > 6;
  return (
    <div className={`flex max-w-md flex-wrap justify-center ${many ? "gap-1.5" : "gap-2"}`}>
      {players.map((p, i) => {
        const on = i === cur;
        const alive = p.lives > 0;
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 rounded-full font-bold ${many ? "min-h-7 px-2.5 text-[13px]" : "min-h-9 px-3 text-[14px]"}`}
            style={{ ...sticker(on ? MASCOT_PALETTE[colorForIndex(i)].body : alive ? "#FFF6E5" : "#8F86AD", on ? 3 : 2), color: on ? inkOn(MASCOT_PALETTE[colorForIndex(i)].body) : INK, opacity: alive ? 1 : 0.75, transform: on ? "rotate(-3deg)" : undefined }}
          >
            {p.name} {alive ? <LifeHearts n={p.lives} size={many ? 11 : 13} label={livesAria(p.lives)} /> : <GameInlineIcon icon={Skull} />}
          </span>
        );
      })}
    </div>
  );
}

/** Vies restantes : petits cœurs pleins (icônes, pas d'emoji). */
function LifeHearts({ n, size = 16, label }: { n: number; size?: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" aria-label={label}>
      {Array.from({ length: n }, (_, k) => (
        <Heart key={k} size={size} strokeWidth={2.6} fill="#FF3E6C" color={INK} aria-hidden />
      ))}
    </span>
  );
}
