"use client";

/**
 * Mots Espions — mode « un seul téléphone posé au milieu de la table ».
 * Deux équipes (Rouge / Bleue), les chefs consultent la carte secrète en
 * maintenant un bouton, donnent leur indice à voix haute, et l'équipe touche
 * les mots (1er tap = sélection, 2e tap ou « Valider » = révélation).
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { sfxBidPop, sfxCardPlay, sfxHandChime, sfxTrickWin } from "@/lib/card-sfx";
import { CN_LOCAL_WORDS } from "./cn-local-words";

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

// ── Palette ───────────────────────────────────────────────
const TEAM: Record<Team, { main: string; deep: string; soft: string; mascot: "coral" | "sky"; label: string }> = {
  red: { main: "#FF4D5E", deep: "#B3172A", soft: "rgba(255,77,94,0.22)", mascot: "coral", label: "Rouge" },
  blue: { main: "#3D86FF", deep: "#1846B3", soft: "rgba(61,134,255,0.22)", mascot: "sky", label: "Bleue" },
};
const NEUTRAL = { main: "#D9CDB2", deep: "#9C8E70", ink: "#3A3122" };
const BOMB = { main: "#140A24", deep: "#000" };
const CARD_FACE = "#F5F1E8";
const INK = "#15082E";

const TIMER_OPTIONS = [0, 60, 90, 120] as const;
const other = (t: Team): Team => (t === "red" ? "blue" : "red");

// ── Utilitaires ───────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newGame(starter: Team): GameState {
  const words = shuffle(CN_LOCAL_WORDS).slice(0, 25);
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

const VOWELS = "AEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜŒ";
const isV = (c: string | undefined) => !!c && VOWELS.includes(c);
// Groupes de consonnes qu'on ne coupe pas (CH, PH, TR, BL…)
const KEEP = new Set(["CH", "PH", "TH", "GN", "BR", "CR", "DR", "FR", "GR", "PR", "TR", "VR", "BL", "CL", "FL", "GL", "PL"]);

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

// ── Composant principal ───────────────────────────────────
export default function MotsEspionsLocal({ onReturnToLobby }: GameProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [names, setNames] = useState<Record<Team, string>>({ red: "Les Rouges", blue: "Les Bleus" });
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
    const g = newGame(starter);
    setGame(g);
    setSelected(null);
    setClue(null);
    setBusy(false);
    setBoom(false);
    setTimeLeft(timer);
    setPhase("play");
  }, [starterChoice, timer]);

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
  useEffect(() => {
    if (phase === "play" && timer > 0 && timeLeft === 0 && !busy) {
      vibrate([80, 60, 80]);
      sfxTrickWin();
      endTurn("⏰ Temps écoulé !");
    }
  }, [timeLeft, phase, timer, busy, endTurn, vibrate]);

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

      if (card.color === "bomb") {
        setGame({ ...game, cards });
        setBusy(true);
        vibrate([200, 80, 300]);
        sfxHandChime(false);
        later(() => setBoom(true), 450);
        later(() => {
          setGame((g) => (g ? { ...g, winner: other(team), reason: "bomb" } : g));
          setBoom(false);
          setBusy(false);
          setPhase("end");
        }, 2100);
        return;
      }

      // Quelqu'un a trouvé tous ses mots ?
      const winner: Team | null = left("red") === 0 ? "red" : left("blue") === 0 ? "blue" : null;
      if (winner) {
        setGame({ ...game, cards });
        setBusy(true);
        if (card.color === team) sfxBidPop();
        later(() => {
          setGame((g) => (g ? { ...g, winner, reason: "words" } : g));
          setBusy(false);
          setPhase("end");
          sfxHandChime(true);
        }, 900);
        return;
      }

      setGame({ ...game, cards });
      if (card.color === team) {
        sfxBidPop();
        vibrate(25);
        flash("Bien vu ! On continue", "good");
        return;
      }
      // Neutre ou adverse : fin du tour après l'animation
      setBusy(true);
      sfxTrickWin();
      vibrate([60, 40, 60]);
      flash(card.color === "neutral" ? "Mot neutre… fin du tour" : `Aïe, un mot de ${names[other(team)]} !`, "bad");
      later(() => endTurn(), 1300);
    },
    [game, busy, names, vibrate, later, flash, endTurn],
  );

  const tapCard = (idx: number) => {
    if (!game || busy || game.winner || game.cards[idx].revealed) return;
    if (selected === idx) {
      reveal(idx);
    } else {
      setSelected(idx);
      sfxCardPlay();
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

  return (
    <div
      className="relative flex flex-col overflow-hidden text-white select-none"
      style={{
        height: "100dvh",
        background: `radial-gradient(120% 60% at 50% -10%, ${accent.main}66, transparent 60%), radial-gradient(90% 50% at 50% 115%, ${accent.main}40, transparent 60%), linear-gradient(180deg, #0B0620 0%, #0E0828 100%)`,
        transition: "background 0.6s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <style>{CSS}</style>
      {/* Liseré couleur d'équipe : on sait toujours à qui c'est */}
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 0 4px ${accent.main}`, transition: "box-shadow 0.6s" }} />

      {/* ── En-tête (coin haut-gauche laissé libre pour le bouton quitter de l'app) */}
      <header className="relative z-10 flex items-center gap-2 pl-16 pr-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}>
        <div className="min-w-0 flex-1">
          {ended ? (
            <p className="cb-display-sm truncate">Partie terminée</p>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.65)" }}>
                C&apos;est au tour de
              </p>
              <p className="cb-display-md truncate" style={{ color: accent.main, textShadow: `0 0 18px ${accent.main}88` }}>
                {names[team]}
              </p>
            </>
          )}
        </div>
        {!ended && timer > 0 && (
          <div
            className={`flex h-11 min-w-[56px] items-center justify-center rounded-2xl px-2 font-bold tabular-nums ${lowTime ? "cn-pulse" : ""}`}
            style={{ background: lowTime ? "#FF4D5E" : "rgba(255,255,255,0.1)", fontSize: 18 }}
            aria-label="Temps restant"
          >
            {timeLeft}s
          </div>
        )}
        <button
          onClick={() => setShowRules(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          aria-label="Règles"
        >
          ⓘ
        </button>
      </header>

      {/* ── Compteurs + indice */}
      <div className="relative z-10 mx-auto mt-2 flex w-full max-w-[560px] items-stretch gap-2 px-3">
        <Counter team="red" name={names.red} left={remaining("red")} active={!ended && team === "red"} />
        {ended ? (
          <div className="flex flex-[1.3] items-center justify-center rounded-2xl px-2 text-center" style={{ background: "rgba(255,255,255,0.06)" }}>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>Grille révélée</span>
          </div>
        ) : (
          <button
            onClick={() => setShowClue(true)}
            className="flex min-w-0 flex-[1.3] flex-col items-center justify-center rounded-2xl px-2 py-1 text-center"
            style={{ background: "rgba(255,255,255,0.08)", border: `1px dashed ${clue ? accent.main : "rgba(255,255,255,0.25)"}` }}
          >
            {clue ? (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Indice</span>
                <span className="max-w-full truncate font-bold" style={{ fontSize: 16 }}>
                  {clue.word || "…"} {clue.count && <span style={{ color: accent.main }}>· {clue.count}</span>}
                </span>
              </>
            ) : (
              <span className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.75)" }}>
                ✏️ Noter l&apos;indice
                <br />
                <span style={{ color: "rgba(255,255,255,0.5)" }}>(optionnel)</span>
              </span>
            )}
          </button>
        )}
        <Counter team="blue" name={names.blue} left={remaining("blue")} active={!ended && team === "blue"} />
      </div>

      {/* ── Bandeau fin de partie */}
      {ended && game.winner && (
        <div className="relative z-10 mx-auto mt-3 flex w-full max-w-[560px] items-center gap-3 px-4 cn-pop">
          <Mascot size={64} color={TEAM[game.winner].mascot} mood={game.reason === "bomb" ? "cool" : "laughing"} cheering arms />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
              {game.reason === "bomb" ? `💣 Bombe touchée par ${names[other(game.winner)]}` : "Tous les mots trouvés !"}
            </p>
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Victoire de</p>
            <p className="cb-display-md truncate" style={{ color: TEAM[game.winner].main }}>
              {names[game.winner]}&nbsp;🏆
            </p>
          </div>
        </div>
      )}

      {/* ── Grille 5×5 */}
      <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 items-center px-2.5 py-3" style={{ minHeight: 0 }}>
        <div className="grid h-full max-h-[620px] w-full grid-cols-5 gap-[6px]" style={{ gridTemplateRows: "repeat(5, minmax(56px, 1fr))" }}>
          {game.cards.map((c, i) => (
            <WordCard
              key={`${seed}-${i}`}
              card={c}
              index={i}
              selected={selected === i}
              teamColor={TEAM[team].main}
              showAll={ended}
              onTap={() => tapCard(i)}
            />
          ))}
        </div>
      </div>

      {/* ── Barre d'actions */}
      <footer className="relative z-10 mx-auto flex w-full max-w-[560px] gap-2 px-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
        {ended ? (
          <>
            <button onClick={quit} className="af-btn af-btn-ghost h-14 flex-1" style={{ fontSize: 16 }}>
              Quitter
            </button>
            <button onClick={start} className="af-btn af-btn-primary h-14 flex-[1.6]" style={{ fontSize: 16 }}>
              🔄 Rejouer
            </button>
          </>
        ) : selected !== null ? (
          <>
            <button onClick={() => setSelected(null)} className="af-btn af-btn-ghost h-14 flex-1" style={{ fontSize: 15 }}>
              Annuler
            </button>
            <button
              onClick={() => reveal(selected)}
              className="af-btn h-14 min-w-0 flex-[2] truncate cn-pop"
              style={{ fontSize: 16, background: `linear-gradient(180deg, ${TEAM[team].main}, ${TEAM[team].deep})`, boxShadow: `0 10px 24px ${TEAM[team].main}66` }}
            >
              Valider « {game.cards[selected].word} »
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowKey(true)}
              disabled={busy}
              className="af-btn h-14 flex-[1.5] disabled:opacity-50"
              style={{ fontSize: 15, background: "linear-gradient(180deg, #2A1B52, #1A0F38)", border: "1px solid rgba(255,255,255,0.18)" }}
            >
              🕵️ Chefs : voir la carte
            </button>
            <button onClick={() => endTurn()} disabled={busy} className="af-btn af-btn-ghost h-14 flex-1 disabled:opacity-50" style={{ fontSize: 15 }}>
              Fin du tour
            </button>
          </>
        )}
      </footer>

      {/* ── Toast (en haut, pour ne pas masquer la grille) */}
      {toast && (
        <div key={toast.id} className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-6" style={{ top: "calc(env(safe-area-inset-top) + 62px)" }}>
          <div
            className="cn-toast rounded-full px-5 py-2.5 text-center font-bold shadow-xl"
            style={{
              fontSize: 15,
              background: toast.tone === "good" ? "#3DDC97" : toast.tone === "bad" ? "#FF4D5E" : "#FFD23F",
              color: toast.tone === "bad" ? "#fff" : INK,
            }}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* ── Annonce de tour */}
      {splash > 0 && !ended && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center" key={splash}>
          <div className="cn-splash flex flex-col items-center rounded-[32px] px-8 py-6 text-center" style={{ background: `linear-gradient(160deg, ${TEAM[team].main}, ${TEAM[team].deep})`, boxShadow: `0 20px 60px ${TEAM[team].main}88` }}>
            <Mascot size={86} color={TEAM[team].mascot} mood="wink" arms />
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.85)" }}>
              {game.turnNo === 1 ? `Ils commencent · ${remaining(team)} mots` : "À vous !"}
            </p>
            <p className="cb-display-lg">{names[team]}</p>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>Chef, regarde la carte et donne ton indice</p>
          </div>
        </div>
      )}

      {/* ── Explosion */}
      {boom && (
        <div className="cn-boom absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "radial-gradient(circle, #FF6B5B 0%, #3A0710 55%, #000 100%)" }}>
          <div style={{ fontSize: 96 }}>💣</div>
          <p className="cb-display-xl mt-2">BOUM&nbsp;!</p>
          <p className="mt-2 text-base" style={{ color: "rgba(255,255,255,0.85)" }}>
            Bombe touchée par {names[team]}
          </p>
        </div>
      )}

      {ended && game.winner && <ConfettiBurst count={70} />}

      {showKey && <KeyScreen cards={game.cards} names={names} onClose={() => setShowKey(false)} />}
      {showClue && (
        <ClueSheet
          team={team}
          initial={clue}
          onSave={(c) => {
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
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-2.5 py-1.5"
      style={{
        background: active ? `linear-gradient(160deg, ${t.main}, ${t.deep})` : t.soft,
        border: `2px solid ${active ? "#fff" : "transparent"}`,
        transform: active ? "scale(1.03)" : "scale(1)",
        transition: "all 0.35s ease",
        boxShadow: active ? `0 8px 22px ${t.main}66` : "none",
      }}
    >
      <span className="cb-display-md tabular-nums" style={{ fontSize: 26, lineHeight: 1 }}>
        {left}
      </span>
      <span className="min-w-0 truncate text-[11px] font-semibold leading-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
        {name}
      </span>
    </div>
  );
}

// ── Case de la grille (flip à la révélation) ──────────────
function faceStyle(color: CardColor): CSSProperties {
  if (color === "neutral") return { background: `linear-gradient(160deg, ${NEUTRAL.main}, ${NEUTRAL.deep})`, color: NEUTRAL.ink };
  if (color === "bomb") return { background: `radial-gradient(circle at 50% 35%, #3A1D5C, ${BOMB.main})`, color: "#fff", border: "2px solid #FF4D5E" };
  return { background: `linear-gradient(160deg, ${TEAM[color].main}, ${TEAM[color].deep})`, color: "#fff" };
}

function WordCard({
  card,
  index,
  selected,
  teamColor,
  showAll,
  onTap,
}: {
  card: Card;
  index: number;
  selected: boolean;
  teamColor: string;
  showAll: boolean;
  onTap: () => void;
}) {
  const lines = splitWord(card.word);
  const font = wordFont(lines);
  const flipped = card.revealed || showAll;
  // Cases révélées seulement en fin de partie : légèrement atténuées pour les distinguer
  const ghost = showAll && !card.revealed;
  const label = (
    <span className="block text-center font-extrabold uppercase" style={{ fontSize: font, lineHeight: 1.05, letterSpacing: "-0.02em", fontFamily: "'DM Sans', sans-serif" }}>
      {lines.map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </span>
  );
  return (
    <button
      onClick={onTap}
      className="relative h-full w-full"
      style={{
        perspective: 700,
        transform: selected ? "translateY(-7px) scale(1.06)" : "none",
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
          transition: `transform 0.6s cubic-bezier(.4,1.4,.5,1) ${showAll && !card.revealed ? (index % 25) * 35 : 0}ms`,
        }}
      >
        {/* Face cachée */}
        <span
          className="absolute inset-0 flex items-center justify-center rounded-[14px] px-0.5"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: CARD_FACE,
            color: INK,
            boxShadow: selected ? `0 0 0 3px ${teamColor}, 0 12px 24px ${teamColor}88` : "0 3px 0 #BDB39F, 0 6px 14px rgba(0,0,0,0.3)",
          }}
        >
          {label}
        </span>
        {/* Face révélée */}
        <span
          className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] px-0.5"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            opacity: ghost ? 0.62 : 1,
            boxShadow: "inset 0 2px 0 rgba(255,255,255,0.25), 0 4px 10px rgba(0,0,0,0.3)",
            ...faceStyle(card.color),
          }}
        >
          {card.color === "bomb" && <span style={{ fontSize: 18, lineHeight: 1 }}>💣</span>}
          <span style={{ opacity: card.revealed || showAll ? 0.95 : 0 }}>{label}</span>
          {ghost && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />}
        </span>
      </span>
    </button>
  );
}

// ── Carte secrète des chefs ───────────────────────────────
function KeyScreen({ cards, names, onClose }: { cards: Card[]; names: Record<Team, string>; onClose: () => void }) {
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const stop = () => setHolding(false);

  return (
    <div className="absolute inset-0 z-[60] flex flex-col text-white" style={{ background: "linear-gradient(180deg, #0B0620, #160C33)" }}>
      <div className="flex items-center justify-end pl-16 pr-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}>
        <button onClick={onClose} className="flex h-11 items-center rounded-full px-4 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.1)" }}>
          ✕ Fermer
        </button>
      </div>

      {!confirmed ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center cn-pop">
          <Mascot size={120} color="purple" mood="shifty" look="shifty" arms />
          <p className="cb-display-lg mt-4">Seuls les chefs regardent&nbsp;!</p>
          <p className="mt-3 max-w-xs text-base" style={{ color: "rgba(255,255,255,0.75)" }}>
            Les autres, fermez les yeux ou tournez la tête. Chefs, prenez le téléphone en le cachant bien.
          </p>
          <button onClick={() => setConfirmed(true)} className="af-btn af-btn-pink mt-8 h-14 w-full max-w-xs" style={{ fontSize: 16 }}>
            On est chefs, on regarde
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-3" style={{ minHeight: 0 }}>
          <div className="mt-1 flex items-center justify-center gap-3 text-xs font-semibold">
            <Legend color={TEAM.red.main} label={names.red} />
            <Legend color={TEAM.blue.main} label={names.blue} />
            <Legend color={NEUTRAL.main} label="Neutre" />
            <Legend color="#000" label="Bombe" border="#FF4D5E" />
          </div>
          <div className="relative mx-auto mt-3 flex w-full max-w-[560px] flex-1 items-center" style={{ minHeight: 0 }}>
            <div
              className="grid h-full max-h-[560px] w-full grid-cols-5 gap-[6px]"
              style={{ gridTemplateRows: "repeat(5, minmax(48px, 1fr))", filter: holding ? "none" : "blur(14px)", transition: "filter 0.15s" }}
            >
              {cards.map((c, i) => {
                const lines = splitWord(c.word);
                // Tant qu'on ne maintient pas, rien n'est rendu (pas de triche par capture)
                const st: CSSProperties = holding ? faceStyle(c.color) : { background: "rgba(255,255,255,0.12)" };
                return (
                  <div key={i} className="relative flex flex-col items-center justify-center rounded-xl px-0.5" style={{ ...st, opacity: holding && c.revealed ? 0.35 : 1 }}>
                    {holding && c.color === "bomb" && <span style={{ fontSize: 16, lineHeight: 1 }}>💣</span>}
                    {holding && (
                      <span className="block text-center font-extrabold uppercase" style={{ fontSize: wordFont(lines), lineHeight: 1.05 }}>
                        {lines.map((l, k) => (
                          <span key={k} className="block">
                            {l}
                          </span>
                        ))}
                      </span>
                    )}
                    {holding && c.revealed && <span className="absolute right-1 top-0.5 text-xs">✓</span>}
                  </div>
                );
              })}
            </div>
            {!holding && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center text-lg font-bold">
                Maintiens le bouton pour voir la carte 👇
              </p>
            )}
          </div>
          <button
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setHolding(true);
            }}
            onPointerUp={stop}
            onPointerCancel={stop}
            onLostPointerCapture={stop}
            onContextMenu={(e) => e.preventDefault()}
            className="af-btn mx-auto mt-3 h-20 w-full max-w-[560px] touch-none"
            style={{
              fontSize: 17,
              marginBottom: "calc(env(safe-area-inset-bottom) + 12px)",
              background: holding ? "linear-gradient(180deg, #3DDC97, #1A7B4F)" : "linear-gradient(180deg, #FF3EA5, #B5226E)",
              boxShadow: holding ? "0 0 0 4px rgba(61,220,151,0.35)" : "0 10px 24px rgba(255,62,165,0.45)",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            {holding ? "Relâche pour cacher" : "👆 Maintenir pour voir"}
          </button>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label, border }: { color: string; label: string; border?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="h-3 w-3 shrink-0 rounded" style={{ background: color, border: border ? `1.5px solid ${border}` : undefined }} />
      <span className="max-w-[72px] truncate">{label}</span>
    </span>
  );
}

// ── Saisie optionnelle de l'indice ─────────────────────────
function ClueSheet({
  team,
  initial,
  onSave,
  onClose,
}: {
  team: Team;
  initial: { word: string; count: string } | null;
  onSave: (c: { word: string; count: string } | null) => void;
  onClose: () => void;
}) {
  const [word, setWord] = useState(initial?.word ?? "");
  const [count, setCount] = useState(initial?.count ?? "");
  const t = TEAM[team];
  return (
    <div className="absolute inset-0 z-[55] flex items-end" style={{ background: "rgba(5,2,15,0.7)" }} onClick={onClose}>
      <div
        className="cn-sheet w-full rounded-t-[28px] px-5 pt-5"
        style={{ background: "#1A1038", borderTop: `3px solid ${t.main}`, paddingBottom: "calc(env(safe-area-inset-bottom) + 18px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="cb-display-sm">Noter l&apos;indice du chef</p>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
          Facultatif : le chef le dit à voix haute, ceci sert juste de pense-bête.
        </p>
        <input
          autoFocus
          value={word}
          onChange={(e) => setWord(e.target.value.slice(0, 24))}
          placeholder="Un mot (ex. : plage)"
          className="mt-4 w-full rounded-2xl border px-4 py-3 outline-none"
          style={{ fontSize: 16, background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.18)", color: "#fff" }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {["1", "2", "3", "4", "5", "6", "∞"].map((n) => (
            <button
              key={n}
              onClick={() => setCount(count === n ? "" : n)}
              className="h-11 w-11 rounded-xl text-base font-bold"
              style={{ background: count === n ? t.main : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={() => onSave(null)} className="af-btn af-btn-ghost h-12 flex-1">
            Effacer
          </button>
          <button
            onClick={() => onSave(word.trim() || count ? { word: word.trim().toUpperCase(), count } : null)}
            className="af-btn h-12 flex-[2]"
            style={{ background: `linear-gradient(180deg, ${t.main}, ${t.deep})` }}
          >
            Afficher
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Règles ────────────────────────────────────────────────
function Rules({ onClose }: { onClose: () => void }) {
  const items = [
    "Deux équipes, chacune avec un chef. Le téléphone reste posé au milieu de la table.",
    "Seuls les chefs regardent la carte secrète (bouton « Chefs : voir la carte », à maintenir) : elle dit quels mots sont rouges, bleus, neutres… et où est la Bombe.",
    "À son tour, le chef donne À VOIX HAUTE un seul mot + un nombre (ex. « Plage, 2 ») pour faire deviner ses mots. Interdit de dire un mot de la grille ou de mimer.",
    "L'équipe touche un mot pour le sélectionner, puis touche encore (ou « Valider ») pour le révéler.",
    "Mot de ton équipe : tu peux continuer. Mot neutre ou adverse : fin du tour. Tu peux aussi arrêter avec « Fin du tour ».",
    "La Bombe 💣 : défaite immédiate !",
    "La première équipe qui trouve tous ses mots gagne. L'équipe qui commence a 9 mots, l'autre 8.",
  ];
  return (
    <div className="absolute inset-0 z-[70] flex items-end sm:items-center sm:justify-center" style={{ background: "rgba(5,2,15,0.75)" }} onClick={onClose}>
      <div
        className="cn-sheet max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] px-5 pt-5 sm:max-w-md sm:rounded-[28px]"
        style={{ background: "#1A1038", paddingBottom: "calc(env(safe-area-inset-bottom) + 18px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="cb-display-md">Comment on joue</p>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-lg" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Fermer">
            ✕
          </button>
        </div>
        <ol className="mt-3 space-y-2.5">
          {items.map((r, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: i % 2 ? TEAM.blue.main : TEAM.red.main }}>
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
        <button onClick={onClose} className="af-btn af-btn-primary mt-5 h-12 w-full">
          Compris !
        </button>
      </div>
    </div>
  );
}

// ── Configuration ─────────────────────────────────────────
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
  const chip = (active: boolean, color = "#5B36D6"): CSSProperties => ({
    background: active ? color : "rgba(255,255,255,0.07)",
    border: `1.5px solid ${active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.14)"}`,
  });
  return (
    <div
      className="relative flex flex-col overflow-y-auto text-white"
      style={{
        height: "100dvh",
        background:
          "radial-gradient(70% 40% at 0% 10%, rgba(255,77,94,0.35), transparent 70%), radial-gradient(70% 40% at 100% 10%, rgba(61,134,255,0.35), transparent 70%), linear-gradient(180deg, #0B0620 0%, #0E0828 100%)",
      }}
    >
      <style>{CSS}</style>
      <div className="flex justify-end pl-16 pr-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}>
        <button
          onClick={onRules}
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          aria-label="Règles"
        >
          ⓘ
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-6">
        <div className="flex items-end justify-center gap-1">
          <Mascot size={78} color="coral" mood="shifty" look="right" arms />
          <span className="mb-4 text-4xl">🕵️</span>
          <Mascot size={78} color="sky" mood="sus" look="left" arms delay={0.4} />
        </div>
        <h1 className="cb-display-lg mt-2 text-center">Mots Espions</h1>
        <p className="mt-1 text-center text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
          Un téléphone au milieu de la table · 2 équipes · 1 chef chacune
        </p>

        <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Les équipes</p>
        <div className="space-y-2">
          {(["red", "blue"] as Team[]).map((t) => (
            <label key={t} className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: TEAM[t].soft, border: `1.5px solid ${TEAM[t].main}88` }}>
              <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: `linear-gradient(160deg, ${TEAM[t].main}, ${TEAM[t].deep})` }} />
              <input
                value={names[t]}
                onChange={(e) => setNames({ ...names, [t]: e.target.value.slice(0, 16) })}
                onBlur={() => !names[t].trim() && setNames({ ...names, [t]: t === "red" ? "Les Rouges" : "Les Bleus" })}
                className="min-w-0 flex-1 bg-transparent py-1.5 font-bold outline-none"
                style={{ fontSize: 17, color: "#fff" }}
                aria-label={`Nom de l'équipe ${TEAM[t].label}`}
              />
              <span className="text-sm opacity-60">✏️</span>
            </label>
          ))}
        </div>

        <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Qui commence ?</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ["random", "🎲 Au hasard"],
            ["red", names.red],
            ["blue", names.blue],
          ] as [StarterChoice, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setStarter(v)}
              className="h-12 truncate rounded-2xl px-2 text-sm font-semibold"
              style={chip(starter === v, v === "random" ? "#5B36D6" : TEAM[v as Team].main)}
            >
              {l}
            </button>
          ))}
        </div>

        <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Chrono par tour</p>
        <div className="grid grid-cols-4 gap-2">
          {TIMER_OPTIONS.map((t) => (
            <button key={t} onClick={() => setTimer(t)} className="h-12 rounded-2xl text-sm font-semibold" style={chip(timer === t)}>
              {t === 0 ? "Sans" : `${t} s`}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <button onClick={onStart} className="af-btn af-btn-pink h-14 w-full" style={{ fontSize: 17 }}>
            Distribuer les mots 🃏
          </button>
          <p className="mt-2 text-center text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Formez 2 équipes et choisissez un chef par équipe
          </p>
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
@keyframes cn-splash { 0% { transform: scale(.6) rotate(-4deg); opacity: 0 } 18% { transform: scale(1.06) rotate(1deg); opacity: 1 } 28% { transform: scale(1) rotate(0) } 82% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(.94) } }
@keyframes cn-boom { 0% { opacity: 0; transform: scale(1.3) } 15% { opacity: 1; transform: scale(1) } 25% { transform: translateX(-8px) } 35% { transform: translateX(8px) } 45% { transform: translateX(-5px) } 55% { transform: translateX(0) } 100% { opacity: 1 } }
@keyframes cn-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes cn-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.1) } }
.cn-pop { animation: cn-pop .35s ease-out both }
.cn-toast { animation: cn-toast 1.9s ease-out both }
.cn-splash { animation: cn-splash 1.5s cubic-bezier(.3,1.3,.5,1) both }
.cn-boom { animation: cn-boom 1.6s ease-out both }
.cn-sheet { animation: cn-sheet .28s cubic-bezier(.2,.9,.3,1) both }
.cn-pulse { animation: cn-pulse .8s ease-in-out infinite }
`;
