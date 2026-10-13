"use client";

/**
 * Mots Espions — mode « un seul téléphone posé au milieu de la table ».
 * Deux équipes (Rouge / Bleue), les chefs consultent la carte secrète en
 * maintenant un bouton, donnent leur indice à voix haute, et l'équipe touche
 * les mots (1er tap = sélection, 2e tap ou « Valider » = révélation).
 * DA « sticker » de l'app Zinzin : aplats, contour encre, ombre dure.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { isSfxMuted, playCombo, playSfx, preloadSfx, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import { CN_WORDS, isGridWord } from "./cn-local-words";
import { STR } from "./i18n";
import { getLang, pick, useLang, useT, type Lang } from "@/lib/i18n";
import { ArrowDown, Bomb, Check, Dices, Eye, Info, Pencil, Pointer, RotateCcw, Shuffle, Timer, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { GameIconButton, GameInlineIcon } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { useGameFinished } from "@/lib/game-finished";

// ── Types ─────────────────────────────────────────────────
type Team = "red" | "blue";
type CardColor = Team | "neutral" | "bomb";

interface Card {
  word: string;
  color: CardColor;
  revealed: boolean;
}

interface GameState {
  cards: Card[];
  turn: Team;
  starter: Team;
  winner: Team | null;
  reason: "words" | "bomb" | null;
  /** Numéro de tour (sert de clé pour relancer chrono / annonce) */
  turnNo: number;
  /** Identifiant de la grille (change à chaque « Rejouer ») */
  seed: number;
}

type Phase = "setup" | "play" | "end";
type StarterChoice = "random" | Team;

interface Toast {
  id: number;
  text: string;
  tone: "good" | "bad" | "info";
}

// ── Palette (aplats « sticker ») ──────────────────────────
const INK = "#15082E";
const NIGHT = "#1E1250";
const TEAM: Record<Team, { main: string; ink: string; mascot: "coral" | "sky" }> = {
  red: { main: "#FF5A5F", ink: "#fff", mascot: "coral" },
  blue: { main: "#3D86FF", ink: "#fff", mascot: "sky" },
};
const NEUTRAL = { main: "#E6D9BC", ink: INK };
const CARD_FACE = "#FFF6E5";
const YELLOW = "#FFD23F";
const PINK = "#FF3EA5";
const VIOLET = "#7A4EE8";
const MINT = "#3DDC97";

const TIMER_OPTIONS = [0, 60, 90, 120] as const;
const other = (t: Team): Team => (t === "red" ? "blue" : "red");

const DISPLAY: CSSProperties = { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, letterSpacing: "-0.03em", wordSpacing: "0.1em" };
/** Fond violet nuit + pois discrets. */
const PAGE_BG: CSSProperties = {
  backgroundColor: NIGHT,
  backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px)",
  backgroundSize: "22px 22px",
};
/** Bloc « sticker » : aplat + contour encre + ombre dure décalée. */
const stk = (bg: string, shadow = 4, border = 2.5): CSSProperties => ({
  background: bg,
  border: `${border}px solid ${INK}`,
  boxShadow: `0 ${shadow}px 0 ${INK}`,
});

const SOUNDS = [
  "card-shuffle", "card-flip", "card-place", "tap", "ding", "success", "wrong", "tock", "whoosh",
  "tick", "bell", "pop", "toggle", "boom", "plate", "thump", "whooshdown", "win", "powerup", "lose", "open", "close",
] as const;

// ── Utilitaires ───────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Nouvelle grille (mots dans la langue de la partie) ; évite les mots déjà vus dans la session tant qu'il en reste assez. */
function newGame(starter: Team, seen: Set<string>, lang: Lang): GameState {
  const bank = pick(CN_WORDS, lang);
  let fresh = bank.filter((w) => !seen.has(w));
  if (fresh.length < 25) {
    seen.clear();
    fresh = [...bank];
  }
  const words = shuffle(fresh).slice(0, 25);
  words.forEach((w) => seen.add(w));
  const colors: CardColor[] = [
    ...Array<CardColor>(9).fill(starter),
    ...Array<CardColor>(8).fill(other(starter)),
    ...Array<CardColor>(7).fill("neutral"),
    "bomb",
  ];
  const mixed = shuffle(colors);
  return {
    cards: words.map((word, i) => ({ word, color: mixed[i], revealed: false })),
    turn: starter,
    starter,
    winner: null,
    reason: null,
    turnNo: 1,
    seed: Date.now() + Math.random(),
  };
}

const VOWELS = "AEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜŒÁÍÓÚ";
const isV = (c: string | undefined) => !!c && VOWELS.includes(c);
// Groupes de consonnes qu'on ne coupe pas (CH, PH, TR, BL…)
// (+ SH, CK, WH pour l'anglais ; LL, RR pour l'espagnol)
const KEEP = new Set(["CH", "PH", "TH", "GN", "BR", "CR", "DR", "FR", "GR", "PR", "TR", "VR", "BL", "CL", "FL", "GL", "PL", "SH", "CK", "WH", "LL", "RR"]);

/** Césure maison (déterministe, indépendante du navigateur) pour les mots longs. */
function splitWord(w: string): string[] {
  if (w.includes("-")) {
    const k = w.indexOf("-") + 1;
    return [w.slice(0, k), w.slice(k)];
  }
  if (w.length <= 7) return [w];
  const mid = (w.length + 1) / 2; // le tiret compte dans la 1re ligne
  let best = -1;
  let bestD = Infinity;
  for (let i = 2; i <= w.length - 3; i++) {
    const a = w[i - 1];
    const b = w[i];
    const c = w[i + 1];
    let ok = false;
    // V-CV : « PA-PILLON »
    if (isV(a) && !isV(b) && isV(c)) ok = true;
    // VC-CV : « VEN-TILATEUR » (sauf groupes insécables)
    if (!isV(a) && !isV(b) && isV(c) && isV(w[i - 2]) && !KEEP.has(a + b)) ok = true;
    // (V|C)-CCV avec groupe insécable : « ÉLÉ-PHANT », « FOUR-CHETTE »
    if (KEEP.has(b + c) && isV(w[i + 2])) ok = true;
    if (ok && Math.abs(i + 0.5 - mid) < bestD) {
      best = i;
      bestD = Math.abs(i + 0.5 - mid);
    }
  }
  if (best < 0) best = Math.ceil(w.length / 2);
  return [w.slice(0, best) + "-", w.slice(best)];
}

/** Taille de police adaptée à la largeur d'une case (5 colonnes) et à la ligne la plus longue. */
function wordFont(lines: string[]): string {
  const n = Math.max(...lines.map((l) => l.length), 4);
  return `max(12px, min(16px, calc((min(100vw, 560px) - 40px) / 5 / ${(n * 0.8 + 0.6).toFixed(2)})))`;
}

function useVibrate() {
  return useCallback((ms: number | number[]) => {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* pas de vibration dispo */
    }
  }, []);
}

/** Coupure du son globale (partagée avec toute l'app). */
function useSfxMuted() {
  return useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);
}

function SoundButton() {
  const muted = useSfxMuted();
  const t = useT(STR);
  return (
    <GameIconButton
      icon={muted ? VolumeX : Volume2}
      label={muted ? t.muteOn : t.muteOff}
      active={muted}
      onClick={() => setSfxMuted(!muted)}
    />
  );
}

/** Bouton « sticker » qui s'enfonce à l'appui. */
function Btn({
  bg,
  color = INK,
  onClick,
  disabled,
  children,
  className = "",
  style,
  big,
}: {
  bg: string;
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cn-push flex items-center justify-center gap-2 rounded-full px-4 disabled:opacity-50 ${className}`}
      style={{
        ...stk(bg, big ? 5 : 4, big ? 3 : 2.5),
        color,
        minHeight: big ? 60 : 52,
        fontSize: big ? 21 : 16,
        ...(big ? DISPLAY : { fontWeight: 800 }),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Composant principal ───────────────────────────────────
export default function MotsEspionsLocal({ onReturnToLobby }: GameProps) {
  const t = useT(STR);
  // Langue fixée pour la partie (mots de la grille)
  const [lang] = useState<Lang>(() => getLang());
  const [phase, setPhase] = useState<Phase>("setup");
  useGameFinished(phase === "end"); // fin de partie → demande de note éventuelle (app)
  const [names, setNames] = useState<Record<Team, string>>(() => ({ red: pick(STR, lang).defaultRed, blue: pick(STR, lang).defaultBlue }));
  const [starterChoice, setStarterChoice] = useState<StarterChoice>("random");
  const [timer, setTimer] = useState<number>(0);
  const [game, setGame] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [clue, setClue] = useState<{ word: string; count: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [splash, setSplash] = useState<number>(0); // turnNo de l'annonce affichée
  const [showRules, setShowRules] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showClue, setShowClue] = useState(false);
  const [boom, setBoom] = useState(false);
  const vibrate = useVibrate();
  const timeouts = useRef<number[]>([]);
  const seenWords = useRef<Set<string>>(new Set());

  useEffect(() => preloadSfx([...SOUNDS]), []);

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timeouts.current.forEach((t) => window.clearTimeout(t)), []);

  const flash = useCallback(
    (text: string, tone: Toast["tone"]) => {
      const id = Date.now() + Math.random();
      setToast({ id, text, tone });
      later(() => setToast((t) => (t && t.id === id ? null : t)), 1900);
    },
    [later],
  );

  // ── Démarrage / rejouer
  const start = useCallback(() => {
    const starter: Team = starterChoice === "random" ? (Math.random() < 0.5 ? "red" : "blue") : starterChoice;
    const g = newGame(starter, seenWords.current, lang);
    playSfx("card-shuffle", { volume: 0.8 });
    setGame(g);
    setSelected(null);
    setClue(null);
    setBusy(false);
    setBoom(false);
    setTimeLeft(timer);
    setPhase("play");
  }, [starterChoice, timer, lang]);

  // ── Nouvelle grille avant le premier mot révélé (même équipe qui commence)
  const reroll = useCallback(() => {
    setGame((g) => {
      if (!g) return g;
      const n = newGame(g.starter, seenWords.current, lang);
      return { ...n, seed: g.seed + 1, turnNo: g.turnNo };
    });
    playSfx("card-shuffle", { volume: 0.7, delay: 0.08 });
    setSelected(null);
    setClue(null);
  }, [lang]);

  // ── Passage au tour suivant
  const endTurn = useCallback(
    (why?: string) => {
      setGame((g) => (!g || g.winner ? g : { ...g, turn: other(g.turn), turnNo: g.turnNo + 1 }));
      setSelected(null);
      setClue(null);
      setBusy(false);
      setTimeLeft(timer);
      if (why) flash(why, "info");
    },
    [timer, flash],
  );

  // ── Annonce « À vous ! » à chaque nouveau tour (et nouvelle grille)
  const turnNo = game?.turnNo ?? 0;
  const seed = game?.seed ?? 0;
  useEffect(() => {
    if (!turnNo) return;
    setSplash(turnNo);
    playSfx("whoosh", { volume: 0.55 });
    const id = window.setTimeout(() => setSplash((s) => (s === turnNo ? 0 : s)), 1500);
    return () => window.clearTimeout(id);
  }, [turnNo, seed]);

  // ── Chrono par tour
  const running = phase === "play" && timer > 0 && !busy && !showRules && splash === 0;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running, turnNo]);
  // Tic-tac qui s'accélère sur les 5 dernières secondes
  useEffect(() => {
    if (running && timeLeft > 0 && timeLeft <= 5) playSfx(timeLeft % 2 ? "tick" : "tock", { volume: 0.7, rate: 1 + (5 - timeLeft) * 0.08 });
  }, [timeLeft, running]);
  useEffect(() => {
    if (phase === "play" && timer > 0 && timeLeft === 0 && !busy) {
      vibrate([80, 60, 80]);
      playSfx("bell", { volume: 0.8 });
      endTurn(t.timeUp);
    }
  }, [timeLeft, phase, timer, busy, endTurn, vibrate, t]);

  // ── Révélation d'une case
  const reveal = useCallback(
    (idx: number) => {
      if (!game || busy || game.winner) return;
      const card = game.cards[idx];
      if (card.revealed) return;
      const team = game.turn;
      const cards = game.cards.map((c, i) => (i === idx ? { ...c, revealed: true } : c));
      const left = (t: Team) => cards.filter((c) => c.color === t && !c.revealed).length;
      setSelected(null);
      playSfx("card-flip", { volume: 0.8 });

      if (card.color === "bomb") {
        setGame({ ...game, cards });
        setBusy(true);
        vibrate([200, 80, 300]);
        later(() => {
          setBoom(true);
          playCombo("explosion");
        }, 450);
        later(() => {
          setGame((g) => (g ? { ...g, winner: other(team), reason: "bomb" } : g));
          setBoom(false);
          setBusy(false);
          setPhase("end");
          playSfx("lose", { volume: 0.6 });
        }, 2100);
        return;
      }

      // Quelqu'un a trouvé tous ses mots ?
      const winner: Team | null = left("red") === 0 ? "red" : left("blue") === 0 ? "blue" : null;
      if (winner) {
        setGame({ ...game, cards });
        setBusy(true);
        if (card.color === team) playSfx("ding", { volume: 0.7, delay: 0.15 });
        later(() => {
          setGame((g) => (g ? { ...g, winner, reason: "words" } : g));
          setBusy(false);
          setPhase("end");
          playCombo("fanfare");
        }, 900);
        return;
      }

      setGame({ ...game, cards });
      if (card.color === team) {
        playSfx("success", { volume: 0.65, delay: 0.15 });
        vibrate(25);
        flash(t.nice, "good");
        return;
      }
      // Neutre ou adverse : fin du tour après l'animation
      setBusy(true);
      if (card.color === "neutral") playSfx("tock", { volume: 0.8, rate: 0.8, delay: 0.15 });
      else playSfx("wrong", { volume: 0.75, delay: 0.15 });
      vibrate([60, 40, 60]);
      flash(card.color === "neutral" ? t.neutralEnd : t.enemyWord(names[other(team)]), "bad");
      later(() => endTurn(), 1300);
    },
    [game, busy, names, vibrate, later, flash, endTurn, t],
  );

  const tapCard = (idx: number) => {
    if (!game || busy || game.winner || game.cards[idx].revealed) return;
    if (selected === idx) {
      reveal(idx);
    } else {
      setSelected(idx);
      playSfx("tap", { volume: 0.5 });
      vibrate(10);
    }
  };

  const quit = () => onReturnToLobby?.();

  // ── Écrans
  if (phase === "setup" || !game) {
    return (
      <Setup
        names={names}
        setNames={setNames}
        starter={starterChoice}
        setStarter={setStarterChoice}
        timer={timer}
        setTimer={setTimer}
        onStart={start}
        onRules={() => setShowRules(true)}
        showRules={showRules}
        closeRules={() => setShowRules(false)}
      />
    );
  }

  const team = game.turn;
  const ended = phase === "end";
  const accent = ended && game.winner ? TEAM[game.winner] : TEAM[team];
  const remaining = (t: Team) => game.cards.filter((c) => c.color === t && !c.revealed).length;
  const lowTime = timer > 0 && timeLeft <= 10;
  const fresh = !ended && game.turnNo === 1 && !busy && game.cards.every((c) => !c.revealed);

  return (
    <div
      className="relative flex flex-col overflow-hidden text-white select-none"
      style={{ height: "100dvh", ...PAGE_BG, WebkitTapHighlightColor: "transparent" }}
    >
      <style>{CSS}</style>
      {/* Cadre couleur d'équipe : on sait toujours à qui c'est */}
      <div className="pointer-events-none absolute inset-0 z-20" style={{ boxShadow: `inset 0 0 0 6px ${accent.main}`, transition: "box-shadow 0.5s" }} />

      {/* ── En-tête (coin haut-gauche laissé libre pour le bouton quitter de l'app) */}
      <header className="relative z-10 flex items-center gap-2 pl-[68px] pr-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        <div className="min-w-0 flex-1">
          {ended ? (
            <p className="truncate text-[26px] leading-none" style={DISPLAY}>{t.gameOver}</p>
          ) : (
            <span
              className="inline-block max-w-full truncate rounded-full px-3.5 py-1.5 text-[21px] leading-tight"
              style={{ ...stk(accent.main, 3), color: accent.ink, ...DISPLAY, rotate: "-2deg" }}
            >
              {names[team]}
            </span>
          )}
        </div>
        {!ended && timer > 0 && (
          <div
            className={`flex h-11 min-w-[60px] items-center justify-center gap-1 rounded-full px-2.5 tabular-nums ${lowTime ? "cn-pulse" : ""}`}
            style={{ ...stk(lowTime ? "#FF5A5F" : "#fff", 3), color: lowTime ? "#fff" : INK, fontSize: 18, ...DISPLAY, letterSpacing: 0 }}
            aria-label={t.timeLeft}
          >
            <Timer size={16} strokeWidth={3} aria-hidden />
            {timeLeft}
          </div>
        )}
        <SoundButton />
        <GameIconButton icon={Info} label={t.rules} onClick={() => setShowRules(true)} />
      </header>

      {/* ── Compteurs + indice */}
      <div className="relative z-10 mx-auto mt-3 flex w-full max-w-[560px] items-stretch gap-2 px-3">
        <Counter team="red" name={names.red} left={remaining("red")} active={!ended && team === "red"} />
        {ended ? (
          <div className="flex flex-[1.2] items-center justify-center rounded-[18px] px-2 text-center" style={{ ...stk(CARD_FACE, 3), color: INK }}>
            <span className="text-[14px] font-bold leading-tight">{t.wholeGrid}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              playSfx("open", { volume: 0.5 });
              setShowClue(true);
            }}
            className="cn-push flex min-h-[52px] min-w-0 flex-[1.2] flex-col items-center justify-center rounded-[18px] px-2 py-1 text-center"
            style={{ ...stk(clue ? YELLOW : CARD_FACE, 3), color: INK }}
          >
            {clue ? (
              <span className="max-w-full truncate text-[18px] leading-tight" style={DISPLAY}>
                {clue.word || "…"}
                {clue.count && <span style={{ color: accent.main }}> · {clue.count}</span>}
              </span>
            ) : (
              <span className="text-[14px] font-bold leading-tight">
                <GameInlineIcon icon={Pencil} /> {t.noteClue}
              </span>
            )}
          </button>
        )}
        <Counter team="blue" name={names.blue} left={remaining("blue")} active={!ended && team === "blue"} />
      </div>

      {/* ── Bandeau fin de partie */}
      {ended && game.winner && (
        <div className="relative z-10 mx-auto mt-4 w-full max-w-[560px] px-4 cn-pop">
          <div className="flex items-center gap-3 rounded-[24px] py-2 pl-2 pr-4" style={{ ...stk(TEAM[game.winner].main, 5, 3), color: "#fff", rotate: "-1.5deg" }}>
            <Mascot size={62} color={TEAM[game.winner].mascot} mood={game.reason === "bomb" ? "cool" : "laughing"} cheering arms shadow={false} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-tight">{t.victoryFor}</p>
              <p className="text-[28px] leading-[1.02]" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>
                {names[game.winner]}
              </p>
              <p className="mt-0.5 text-[14px] font-bold leading-snug">
                {game.reason === "bomb" ? t.bombBy(names[other(game.winner)]) : t.allFound}
              </p>
            </div>
            <Trophy size={30} strokeWidth={2.6} className="shrink-0" aria-hidden />
          </div>
        </div>
      )}

      {/* ── Grille 5×5 */}
      <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 items-center px-3 py-3" style={{ minHeight: 0 }}>
        <div className="grid h-full max-h-[620px] w-full grid-cols-5 gap-[7px]" style={{ gridTemplateRows: "repeat(5, minmax(54px, 1fr))" }}>
          {game.cards.map((c, i) => (
            <WordCard
              key={`${seed}-${i}`}
              card={c}
              index={i}
              selected={selected === i}
              showAll={ended}
              onTap={() => tapCard(i)}
            />
          ))}
        </div>
      </div>

      {/* ── Grille qui ne plaît pas : on en tire une autre tant que rien n'est révélé */}
      {fresh && selected === null && (
        <div className="relative z-10 -mt-1 mb-2.5 flex justify-center">
          <RerollButton onClick={reroll} label={t.rerollGrid} />
        </div>
      )}

      {/* ── Barre d'actions */}
      <footer className="relative z-10 mx-auto flex w-full max-w-[560px] items-center gap-2.5 px-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}>
        {ended ? (
          <>
            <IdeaButton game="Mots Espions" kind="mot" compact bg="#fff" />
            <Btn bg="#fff" onClick={quit} className="flex-1">
              {t.quit}
            </Btn>
            <Btn bg={YELLOW} onClick={start} className="flex-[1.6]" big>
              <RotateCcw size={20} strokeWidth={3} aria-hidden /> {t.replay}
            </Btn>
          </>
        ) : selected !== null ? (
          <>
            <Btn bg="#fff" onClick={() => setSelected(null)} className="flex-1">
              {t.cancel}
            </Btn>
            <Btn bg={TEAM[team].main} color="#fff" onClick={() => reveal(selected)} className="min-w-0 flex-[2] cn-pop">
              <span className="truncate">{t.validate(game.cards[selected].word)}</span>
            </Btn>
          </>
        ) : (
          <>
            <Btn
              bg={VIOLET}
              color="#fff"
              disabled={busy}
              onClick={() => {
                playSfx("open", { volume: 0.5 });
                setShowKey(true);
              }}
              className="flex-[1.5]"
            >
              <Eye size={19} strokeWidth={2.8} aria-hidden /> {t.chiefsKey}
            </Btn>
            <Btn bg="#fff" disabled={busy} onClick={() => endTurn()} className="flex-1">
              {t.endTurn}
            </Btn>
          </>
        )}
      </footer>

      {/* ── Toast (en haut, pour ne pas masquer la grille) */}
      {toast && (
        <div key={toast.id} className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-6" style={{ top: "calc(env(safe-area-inset-top, 0px) + 66px)" }}>
          <div
            className="cn-toast rounded-full px-5 py-2.5 text-center text-[16px] font-extrabold"
            style={{
              ...stk(toast.tone === "good" ? MINT : toast.tone === "bad" ? "#FF5A5F" : YELLOW, 4),
              color: toast.tone === "bad" ? "#fff" : INK,
              rotate: "-1.5deg",
            }}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* ── Annonce de tour */}
      {splash > 0 && !ended && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-6" key={splash}>
          <div className="cn-splash flex w-full max-w-[330px] flex-col items-center rounded-[30px] px-6 pb-6 pt-3 text-center" style={{ ...stk(TEAM[team].main, 6, 3), color: "#fff" }}>
            <Mascot size={92} color={TEAM[team].mascot} mood="wink" arms shadow={false} />
            <p className="mt-1 text-[16px] font-bold">{game.turnNo === 1 ? t.youStart(remaining(team)) : t.yourTurn}</p>
            <p className="mt-1 max-w-full text-[40px] leading-[0.95]" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>
              {names[team]}
            </p>
            <p className="mt-3 rounded-full px-3 py-1.5 text-[14px] font-bold" style={{ ...stk("#fff", 3), color: INK }}>
              {t.chiefHint}
            </p>
          </div>
        </div>
      )}

      {/* ── Explosion */}
      {boom && (
        <div className="cn-boom absolute inset-0 z-50 flex flex-col items-center justify-center px-6 text-center" style={{ ...PAGE_BG, backgroundColor: "#FF6B5B" }}>
          <span className="cn-bomb grid h-36 w-36 place-items-center rounded-full" style={{ ...stk(INK, 6, 3), color: YELLOW }}>
            <Bomb size={78} strokeWidth={2.4} aria-hidden />
          </span>
          <p className="mt-5 text-[76px] leading-none" style={{ ...DISPLAY, color: INK }}>
            {t.boom}
          </p>
          <p className="mt-3 rounded-full px-4 py-2 text-[17px] font-extrabold" style={{ ...stk("#fff", 4), color: INK, rotate: "-2deg" }}>
            {t.bombHitBy(names[team])}
          </p>
        </div>
      )}

      {ended && game.winner && <ConfettiBurst count={70} />}

      {showKey && <KeyScreen cards={game.cards} names={names} onClose={() => setShowKey(false)} />}
      {showClue && (
        <ClueSheet
          team={team}
          initial={clue}
          grid={game.cards.filter((c) => !c.revealed).map((c) => c.word)}
          lang={lang}
          onSave={(c) => {
            if (c) playSfx("pop", { volume: 0.6 });
            setClue(c);
            setShowClue(false);
          }}
          onClose={() => setShowClue(false)}
        />
      )}
      {showRules && <Rules onClose={() => setShowRules(false)} />}
    </div>
  );
}

// ── Compteur de mots restants ─────────────────────────────
function Counter({ team, name, left, active }: { team: Team; name: string; left: number; active: boolean }) {
  const t = TEAM[team];
  const s = useT(STR);
  const lang = useLang();
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2 rounded-[18px] px-2.5 py-1.5"
      style={{
        ...stk(t.main, active ? 4 : 2),
        color: t.ink,
        rotate: active ? (team === "red" ? "-2deg" : "2deg") : "0deg",
        transition: "rotate 0.3s ease",
      }}
      aria-label={s.counterAria(name, left)}
    >
      <span className="tabular-nums" style={{ ...DISPLAY, fontSize: 30, lineHeight: 1 }}>
        {left}
      </span>
      <span
        className="min-w-0 text-[13px] font-bold leading-tight"
        lang={lang}
        style={{ hyphens: "auto", WebkitHyphens: "auto", overflowWrap: "anywhere", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {name}
      </span>
    </div>
  );
}

// ── Case de la grille (flip à la révélation) ──────────────
function faceStyle(color: CardColor): CSSProperties {
  if (color === "neutral") return { background: NEUTRAL.main, color: NEUTRAL.ink };
  if (color === "bomb") return { background: INK, color: YELLOW };
  return { background: TEAM[color].main, color: TEAM[color].ink };
}

function WordLabel({ word }: { word: string }) {
  const lines = splitWord(word);
  return (
    <span className="block text-center font-extrabold uppercase" style={{ fontSize: wordFont(lines), lineHeight: 1.05, letterSpacing: "-0.02em", fontFamily: "'DM Sans', sans-serif" }}>
      {lines.map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </span>
  );
}

function WordCard({
  card,
  index,
  selected,
  showAll,
  onTap,
}: {
  card: Card;
  index: number;
  selected: boolean;
  showAll: boolean;
  onTap: () => void;
}) {
  const flipped = card.revealed || showAll;
  const ghost = showAll && !card.revealed;
  const tile: CSSProperties = { border: `2.5px solid ${INK}`, borderRadius: 14, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };
  return (
    <button
      type="button"
      onClick={onTap}
      className="relative h-full w-full"
      style={{
        perspective: 700,
        transform: selected ? "translateY(-5px) rotate(-3deg) scale(1.05)" : "none",
        transition: "transform 0.22s cubic-bezier(.3,1.6,.5,1)",
        zIndex: selected ? 5 : 1,
      }}
      aria-label={card.word}
    >
      <span
        className="absolute inset-0 block"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "none",
          transition: `transform 0.6s cubic-bezier(.4,1.4,.5,1) ${ghost ? (index % 25) * 35 : 0}ms`,
        }}
      >
        {/* Face cachée */}
        <span
          className="absolute inset-0 flex items-center justify-center px-0.5"
          style={{
            ...tile,
            background: selected ? YELLOW : CARD_FACE,
            color: INK,
            boxShadow: `0 ${selected ? 6 : 3}px 0 ${INK}`,
          }}
        >
          <WordLabel word={card.word} />
        </span>
        {/* Face révélée */}
        <span
          className="absolute inset-0 flex flex-col items-center justify-center px-0.5"
          style={{
            ...tile,
            transform: "rotateY(180deg)",
            boxShadow: `0 3px 0 ${INK}`,
            ...faceStyle(card.color),
          }}
        >
          {card.color === "bomb" && <Bomb size={17} strokeWidth={2.6} aria-hidden />}
          <WordLabel word={card.word} />
          {/* En fin de partie : pastille sur les mots trouvés pendant la partie */}
          {showAll && card.revealed && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full" style={{ background: "#fff", color: INK, border: `2px solid ${INK}` }}>
              <Check size={12} strokeWidth={3.5} aria-hidden />
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

// ── Carte secrète des chefs ───────────────────────────────
function KeyScreen({ cards, names, onClose }: { cards: Card[]; names: Record<Team, string>; onClose: () => void }) {
  const t = useT(STR);
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const stop = () => setHolding(false);

  return (
    <div className="absolute inset-0 z-[60] flex flex-col text-white" style={PAGE_BG}>
      <div className="flex items-center justify-end pl-16 pr-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        <button
          type="button"
          onClick={() => {
            playSfx("close", { volume: 0.5 });
            onClose();
          }}
          className="cn-push flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-extrabold"
          style={{ ...stk("#fff", 3), color: INK }}
        >
          <X size={18} strokeWidth={3} aria-hidden /> {t.close}
        </button>
      </div>

      {!confirmed ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center cn-pop">
          <Mascot size={120} color="purple" mood="shifty" look="shifty" arms shadow={false} />
          <h2 className="mt-4 text-[38px] leading-[0.95]" style={DISPLAY}>
            {t.onlyChiefs}
          </h2>
          <p className="mt-3 max-w-xs text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
            {t.onlyChiefsText}
          </p>
          <Btn bg={PINK} color="#fff" big onClick={() => setConfirmed(true)} className="mt-8 w-full max-w-xs">
            {t.weAreChiefs}
          </Btn>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-3" style={{ minHeight: 0 }}>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Legend color={TEAM.red.main} label={names.red} />
            <Legend color={TEAM.blue.main} label={names.blue} />
            <Legend color={NEUTRAL.main} label={t.neutral} />
            <Legend color={INK} label={t.bomb} />
          </div>
          <div className="relative mx-auto mt-3 flex w-full max-w-[560px] flex-1 items-center" style={{ minHeight: 0 }}>
            <div
              className="grid h-full max-h-[560px] w-full grid-cols-5 gap-[7px]"
              style={{ gridTemplateRows: "repeat(5, minmax(48px, 1fr))", filter: holding ? "none" : "blur(10px)", transition: "filter 0.15s" }}
            >
              {cards.map((c, i) => {
                // Tant qu'on ne maintient pas, rien n'est rendu (pas de triche par capture)
                const st: CSSProperties = holding ? faceStyle(c.color) : { background: "#3A2A7A" };
                return (
                  <div
                    key={i}
                    className="relative flex flex-col items-center justify-center rounded-[12px] px-0.5"
                    style={{ ...st, border: `2.5px solid ${INK}`, opacity: holding && c.revealed ? 0.35 : 1 }}
                  >
                    {holding && c.color === "bomb" && <Bomb size={16} strokeWidth={2.6} aria-hidden />}
                    {holding && <WordLabel word={c.word} />}
                    {holding && c.revealed && <X size={14} strokeWidth={3} className="absolute right-1 top-1" aria-label={t.alreadyFound} />}
                  </div>
                );
              })}
            </div>
            {!holding && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
                <span className="rounded-[20px] px-4 py-3 text-[18px] font-extrabold" style={{ ...stk(YELLOW, 4), color: INK, rotate: "-2deg" }}>
                  {t.holdToSee} <GameInlineIcon icon={ArrowDown} />
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              playSfx("card-flip", { volume: 0.5 });
              setHolding(true);
            }}
            onPointerUp={stop}
            onPointerCancel={stop}
            onLostPointerCapture={stop}
            onContextMenu={(e) => e.preventDefault()}
            className="mx-auto mt-4 flex h-20 w-full max-w-[560px] touch-none items-center justify-center gap-2 rounded-full"
            style={{
              ...stk(holding ? MINT : PINK, holding ? 1 : 6, 3),
              transform: holding ? "translateY(5px)" : "none",
              transition: "transform 0.1s, box-shadow 0.1s",
              color: holding ? INK : "#fff",
              fontSize: 21,
              ...DISPLAY,
              marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            {holding ? t.releaseHide : <><Pointer size={22} strokeWidth={2.8} aria-hidden /> {t.holdBtn}</>}
          </button>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[13px] font-bold" style={{ ...stk("#fff", 2, 2), color: INK }}>
      <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: color, border: `2px solid ${INK}` }} />
      <span className="max-w-[80px] truncate">{label}</span>
    </span>
  );
}

// ── Feuille crème (indice, règles) ─────────────────────────
function CreamSheet({ onClose, label, children, scroll }: { onClose: () => void; label: string; children: ReactNode; scroll?: boolean }) {
  const t = useT(STR);
  return (
    <div className="absolute inset-0 z-[70] flex items-end sm:items-center sm:justify-center" style={{ background: "rgba(10,4,32,0.6)" }} onClick={onClose} role="dialog" aria-modal aria-label={label}>
      <div
        className={`cn-sheet relative w-full px-5 pt-5 sm:max-w-md ${scroll ? "max-h-[88dvh] overflow-y-auto" : ""}`}
        style={{ background: CARD_FACE, color: INK, borderRadius: "28px 28px 0 0", border: `3px solid ${INK}`, borderBottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-4 top-4">
          <GameIconButton icon={X} label={t.close} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Saisie optionnelle de l'indice ─────────────────────────
function ClueSheet({
  team,
  initial,
  grid,
  lang,
  onSave,
  onClose,
}: {
  team: Team;
  initial: { word: string; count: string } | null;
  /** Mots encore cachés : interdits comme indice (casse, accents, pluriel ignorés selon la langue) */
  grid: string[];
  lang: Lang;
  onSave: (c: { word: string; count: string } | null) => void;
  onClose: () => void;
}) {
  const s = useT(STR);
  const [word, setWord] = useState(initial?.word ?? "");
  const [count, setCount] = useState(initial?.count ?? "");
  const [error, setError] = useState<string | null>(null);
  const t = TEAM[team];
  const save = () => {
    const w = word.trim();
    if (!w && !count) return onSave(null);
    if (/\s/.test(w)) return setError(s.errOneWord);
    if (w && isGridWord(w, grid, lang)) {
      playSfx("wrong", { volume: 0.6 });
      return setError(s.errGridWord);
    }
    onSave({ word: w.toLocaleUpperCase(lang), count });
  };
  return (
    <CreamSheet onClose={onClose} label={s.noteClue}>
      <p className="pr-14 text-[28px] leading-[1.02]" style={DISPLAY}>
        {s.clueTitle}
      </p>
      <p className="mt-1.5 pr-12 text-[15px] font-semibold leading-snug" style={{ color: "#4A3A66" }}>
        {s.clueSub}
      </p>
      <input
        autoFocus
        value={word}
        onChange={(e) => { setWord(e.target.value.slice(0, 24)); setError(null); }}
        placeholder={s.cluePlaceholder}
        aria-label={s.clueAria}
        aria-invalid={!!error}
        className="mt-4 w-full rounded-2xl px-4 py-3 font-bold outline-none"
        style={{ fontSize: 17, background: "#fff", border: `2.5px solid ${error ? "#FF5A5F" : INK}`, color: INK }}
      />
      {error && (
        <p role="alert" className="mt-2 text-[15px] font-bold" style={{ color: "#D62839" }}>
          {error}
        </p>
      )}
      <p className="mt-4 text-[15px] font-bold">{s.howMany}</p>
      {/* Les 7 choix sur une seule ligne (le « ∞ » ne part plus seul à la ligne) */}
      <div className="mt-2 grid grid-cols-7 gap-1">
        {["1", "2", "3", "4", "5", "6", "∞"].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={s.countAria(n)}
            aria-pressed={count === n}
            onClick={() => setCount(count === n ? "" : n)}
            className="cn-push aspect-square w-full max-w-12 justify-self-center rounded-full text-[19px]"
            style={{ ...stk(count === n ? t.main : "#fff", 3), color: count === n ? "#fff" : INK, ...DISPLAY, letterSpacing: 0 }}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-5 flex gap-2.5">
        <Btn bg="#fff" onClick={() => onSave(null)} className="flex-1">
          {s.clear}
        </Btn>
        <Btn bg={t.main} color="#fff" onClick={save} className="flex-[2]">
          {s.show}
        </Btn>
      </div>
    </CreamSheet>
  );
}

// ── Règles ────────────────────────────────────────────────
function Rules({ onClose }: { onClose: () => void }) {
  const t = useT(STR);
  const items = t.rulesItems;
  return (
    <CreamSheet onClose={onClose} label={t.rulesTitle} scroll>
      <p className="pr-14 text-[30px] leading-[1.02]" style={DISPLAY}>
        {t.rulesTitle}
      </p>
      <ol className="mt-4 space-y-3">
        {items.map((r, i) => (
          <li key={i} className="flex items-start gap-3 text-[15.5px] font-semibold leading-snug">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[17px]"
              style={{ ...stk(i % 2 ? TEAM.blue.main : TEAM.red.main, 2, 2), color: "#fff", ...DISPLAY, letterSpacing: 0, rotate: i % 2 ? "3deg" : "-3deg" }}
            >
              {i + 1}
            </span>
            <span className="pt-1">{r}</span>
          </li>
        ))}
      </ol>
      <Btn bg={YELLOW} big onClick={onClose} className="mt-6 w-full">
        {t.gotIt}
      </Btn>
    </CreamSheet>
  );
}

// ── Configuration ─────────────────────────────────────────
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 mt-7 text-[25px] leading-none" style={DISPLAY}>
      {children}
    </h2>
  );
}

function Setup({
  names,
  setNames,
  starter,
  setStarter,
  timer,
  setTimer,
  onStart,
  onRules,
  showRules,
  closeRules,
}: {
  names: Record<Team, string>;
  setNames: (n: Record<Team, string>) => void;
  starter: StarterChoice;
  setStarter: (s: StarterChoice) => void;
  timer: number;
  setTimer: (t: number) => void;
  onStart: () => void;
  onRules: () => void;
  showRules: boolean;
  closeRules: () => void;
}) {
  const tr = useT(STR);
  const chip = (active: boolean, color: string, i: number): CSSProperties => ({
    ...stk(active ? color : "#fff", active ? 4 : 3),
    color: active && color !== YELLOW ? "#fff" : INK,
    rotate: active ? (i % 2 ? "2deg" : "-2deg") : "0deg",
    transition: "rotate 0.2s",
  });
  return (
    <div className="relative flex flex-col overflow-y-auto text-white" style={{ height: "100dvh", ...PAGE_BG }}>
      <style>{CSS}</style>
      <div className="flex justify-end gap-2.5 pl-16 pr-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        <SoundButton />
        <GameIconButton icon={Info} label={tr.rules} onClick={onRules} />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <div className="flex items-end justify-center gap-1">
          <Mascot size={80} color="coral" mood="shifty" look="right" arms shadow={false} />
          <Mascot size={80} color="sky" mood="sus" look="left" arms delay={0.4} shadow={false} />
        </div>
        <h1 className="mt-2 text-center text-[52px] leading-[0.92]" style={DISPLAY}>
          {tr.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-center text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
          {tr.subtitle}
        </p>

        <SectionTitle>{tr.teams}</SectionTitle>
        <div className="space-y-3">
          {(["red", "blue"] as Team[]).map((t, i) => (
            <label
              key={t}
              className="flex items-center gap-3 rounded-[22px] px-4 py-2"
              style={{ ...stk(TEAM[t].main, 4), color: "#fff", rotate: i ? "1deg" : "-1deg" }}
            >
              <Mascot size={38} color={TEAM[t].mascot} mood={i ? "sus" : "shifty"} shadow={false} bob={false} />
              <input
                value={names[t]}
                onChange={(e) => setNames({ ...names, [t]: e.target.value.slice(0, 16) })}
                onBlur={() => !names[t].trim() && setNames({ ...names, [t]: t === "red" ? tr.defaultRed : tr.defaultBlue })}
                className="min-w-0 flex-1 bg-transparent py-1.5 outline-none"
                style={{ fontSize: 22, color: "#fff", ...DISPLAY, letterSpacing: "-0.01em" }}
                aria-label={tr.teamNameAria(t === "red" ? tr.teamRed : tr.teamBlue)}
              />
              <Pencil size={19} strokeWidth={2.8} className="shrink-0" aria-hidden />
            </label>
          ))}
        </div>

        <SectionTitle>{tr.whoStarts}</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {([
            ["random", tr.random],
            ["red", names.red],
            ["blue", names.blue],
          ] as [StarterChoice, string][]).map(([v, l], i) => (
            <button
              key={v}
              type="button"
              aria-pressed={starter === v}
              onClick={() => {
                playSfx("toggle", { volume: 0.4 });
                setStarter(v);
              }}
              className="cn-push flex h-[52px] min-w-0 items-center justify-center gap-1 rounded-full px-2 text-[15px] font-extrabold"
              style={chip(starter === v, v === "random" ? YELLOW : TEAM[v as Team].main, i)}
            >
              {v === "random" && <Dices size={17} strokeWidth={2.8} className="shrink-0" aria-hidden />}
              <span className="truncate">{l}</span>
            </button>
          ))}
        </div>

        <SectionTitle>{tr.timerTitle}</SectionTitle>
        <div className="grid grid-cols-4 gap-2.5">
          {TIMER_OPTIONS.map((t, i) => (
            <button
              key={t}
              type="button"
              aria-pressed={timer === t}
              onClick={() => {
                playSfx("toggle", { volume: 0.4 });
                setTimer(t);
              }}
              className="cn-push h-[52px] rounded-full text-[18px]"
              style={{ ...chip(timer === t, YELLOW, i), ...DISPLAY, letterSpacing: 0 }}
            >
              {t === 0 ? tr.noTimer : tr.secs(t)}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <p className="mb-3 text-center text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
            {tr.formTeams}
          </p>
          <Btn bg={PINK} color="#fff" big onClick={onStart} className="w-full">
            {tr.deal} <Shuffle size={21} strokeWidth={3} aria-hidden />
          </Btn>
          <div className="mt-5 flex justify-center">
            <IdeaButton game="Mots Espions" kind="mot" bg="#fff" />
          </div>
        </div>
      </div>
      {showRules && <Rules onClose={closeRules} />}
    </div>
  );
}

// ── Animations locales ────────────────────────────────────
const CSS = `
@keyframes cn-pop { 0% { transform: scale(.85); opacity: 0 } 60% { transform: scale(1.04); opacity: 1 } 100% { transform: scale(1) } }
@keyframes cn-toast { 0% { transform: translateY(16px) scale(.9); opacity: 0 } 12% { transform: translateY(0) scale(1); opacity: 1 } 85% { opacity: 1 } 100% { opacity: 0; transform: translateY(-6px) } }
@keyframes cn-splash { 0% { transform: scale(.6) rotate(-6deg); opacity: 0 } 18% { transform: scale(1.06) rotate(1deg); opacity: 1 } 28% { transform: scale(1) rotate(-2deg) } 82% { opacity: 1; transform: scale(1) rotate(-2deg) } 100% { opacity: 0; transform: scale(.94) rotate(-2deg) } }
@keyframes cn-boom { 0% { opacity: 0; transform: scale(1.3) } 15% { opacity: 1; transform: scale(1) } 25% { transform: translateX(-10px) } 35% { transform: translateX(10px) } 45% { transform: translateX(-6px) } 55% { transform: translateX(0) } 100% { opacity: 1 } }
@keyframes cn-bomb { 0% { transform: scale(.3) rotate(-30deg) } 50% { transform: scale(1.15) rotate(8deg) } 100% { transform: scale(1) rotate(-4deg) } }
@keyframes cn-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes cn-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.1) } }
.cn-pop { animation: cn-pop .35s ease-out both }
.cn-toast { animation: cn-toast 1.9s ease-out both }
.cn-splash { animation: cn-splash 1.5s cubic-bezier(.3,1.3,.5,1) both }
.cn-boom { animation: cn-boom 1.6s ease-out both }
.cn-bomb { animation: cn-bomb .6s cubic-bezier(.3,1.5,.5,1) both }
.cn-sheet { animation: cn-sheet .28s cubic-bezier(.2,.9,.3,1) both }
.cn-pulse { animation: cn-pulse .8s ease-in-out infinite }
.cn-push { transition: translate .11s ease, box-shadow .11s ease; touch-action: manipulation; -webkit-tap-highlight-color: transparent }
.cn-push:not(:disabled):active { translate: 0 3px; box-shadow: 0 1px 0 ${INK} !important }
@media (prefers-reduced-motion: reduce) { .cn-pop, .cn-bomb, .cn-sheet, .cn-pulse { animation-duration: 1ms !important } }
`;
