"use client";

/**
 * Mots Espions — mode « un seul téléphone qu'on se passe ».
 * Déroulé : prénoms → 2 équipes → un chef par équipe → étape secrète (seuls les
 * chefs regardent la carte) → tours : le chef DIT son indice à voix haute (1 mot +
 * 1 nombre, rien à taper), se tait, son équipe touche les cartes ; nombre annoncé
 * optionnel (1-4, ∞) pour limiter à nombre + 1 essais ; 1 tap pour passer la main.
 * Le chrono (facultatif) part au « C'est parti ! » de chaque tour.
 * DA « sticker » de l'app Zinzin : aplats, contour encre, ombre dure.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { GameProps } from "@/lib/games/types";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PlayerBlob } from "@/components/avatar/PlayerBlob";
import { PlayersSetup, SoundButton } from "@/components/games/local-kit";
import { GameRulesSheet, GameTuto, RulesIconButton, useFirstTimeTuto, type TutoSlide } from "@/components/games/game-tuto";
import { GameTopRight } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { useGameFinished } from "@/lib/game-finished";
import { getLang, pick, useT, type Lang } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, Bomb, Check, Crown, Dices, Eye, Pointer, RotateCcw, Shuffle, Timer, Users, X } from "lucide-react";
import { CN_WORDS } from "./cn-local-words";
import { STR } from "./i18n";
import { ArtClue, ArtKey, ArtTap, ArtTeams } from "./tuto-art";
import { SoireeNextButton } from "@/components/games/soiree-next";
import { endHome, EndReplay } from "@/components/games/end-actions";

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
  /** words : l'équipe a trouvé ses mots ; gift : l'adversaire a révélé son dernier mot ; bomb */
  reason: "words" | "gift" | "bomb" | null;
  turnNo: number;
  /** Identifiant de la grille (clé des cartes) */
  seed: number;
  /** Nombre annoncé par le chef (facultatif : null = sans limite) */
  count: string | null;
  /** Cartes de l'équipe trouvées pendant ce tour */
  found: number;
}

type Step = "players" | "teams" | "chief-red" | "chief-blue" | "play" | "end";
type StarterChoice = "random" | Team;
type Overlay =
  | { k: "gate"; team: Team | null; initial: boolean }
  | { k: "key"; team: Team | null; initial: boolean }
  | { k: "pass" }
  | null;

interface Verdict {
  id: number;
  color: CardColor | "info";
  title: string;
  sub?: string;
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
/** Nombres annoncés proposés (sélecteur rapide et facultatif) */
const COUNTS = ["1", "2", "3", "4", "∞"] as const;
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
/** Haut d'écran : sous la croix « quitter » de l'app et les boutons ronds du coin droit. */
const TOP_PAD = "calc(env(safe-area-inset-top, 0px) + 66px)";
const BOTTOM_PAD = "calc(env(safe-area-inset-bottom, 0px) + 14px)";

const SOUNDS = [
  "card-shuffle", "card-flip", "tap", "ding", "success", "wrong", "tock", "whoosh",
  "tick", "bell", "pop", "toggle", "lose", "open", "close",
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

/** Répartition au hasard en 2 équipes équilibrées. */
function splitTeams(n: number): Team[] {
  const order = shuffle(Array.from({ length: n }, (_, i) => i));
  const teams = Array<Team>(n).fill("red");
  order.forEach((p, k) => { teams[p] = k % 2 ? "blue" : "red"; });
  return teams;
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
    count: null,
    found: 0,
  };
}

/** Essais autorisés pour un nombre annoncé : nombre + 1 ; ∞ ou rien = sans limite. */
function triesFor(count: string | null): number | null {
  const n = Number(count);
  return count === null || count === "∞" || !Number.isFinite(n) || n <= 0 ? null : n + 1;
}
/** Essais restants dans le tour (null = sans limite). */
const triesLeftOf = (g: GameState): number | null => {
  const max = triesFor(g.count);
  return max === null ? null : max - g.found;
};

const VOWELS = "AEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜŒÁÍÓÚ";
const isV = (c: string | undefined) => !!c && VOWELS.includes(c);
// Groupes de consonnes qu'on ne coupe pas (CH, PH, TR, BL…) ; + SH, CK, WH pour l'anglais
const KEEP = new Set(["CH", "PH", "TH", "GN", "BR", "CR", "DR", "FR", "GR", "PR", "TR", "VR", "BL", "CL", "FL", "GL", "PL", "SH", "CK", "WH"]);
// LL et RR ne se coupent pas en espagnol (en français : « CITROUIL-LE », pas « CITROUI-LLE »)
const KEEP_ES = new Set(["LL", "RR"]);

/** Césure maison (déterministe, indépendante du navigateur) pour les mots longs. */
function splitWord(w: string, lang: Lang): string[] {
  if (w.includes("-")) {
    const k = w.indexOf("-") + 1;
    return [w.slice(0, k), w.slice(k)];
  }
  if (w.length <= 7) return [w];
  const keep = (s: string) => KEEP.has(s) || (lang === "es" && KEEP_ES.has(s));
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
    if (!isV(a) && !isV(b) && isV(c) && isV(w[i - 2]) && !keep(a + b)) ok = true;
    // (V|C)-CCV avec groupe insécable : « ÉLÉ-PHANT », « FOUR-CHETTE »
    if (keep(b + c) && isV(w[i + 2])) ok = true;
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

function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* pas de vibration dispo */
  }
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

/** Lien discret « ← Retour ». */
function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="mx-auto flex min-h-11 items-center gap-1.5 px-4 text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
      <ArrowLeft size={17} strokeWidth={3} aria-hidden /> {label}
    </button>
  );
}

// ── Composant principal ───────────────────────────────────
export default function MotsEspionsLocal({ onReturnToLobby }: GameProps) {
  const t = useT(STR);
  // Langue fixée pour la partie (mots de la grille)
  const [lang] = useState<Lang>(() => getLang());
  const [step, setStep] = useState<Step>("players");
  const [players, setPlayers] = useState<string[]>([]);
  const [teamOf, setTeamOf] = useState<Team[]>([]);
  const [chiefs, setChiefs] = useState<Record<Team, number>>({ red: -1, blue: -1 });
  const [starterChoice, setStarterChoice] = useState<StarterChoice>("random");
  const [timer, setTimer] = useState<number>(0);
  const [game, setGame] = useState<GameState | null>(null);
  // Fin de partie → note éventuelle + Soirée (app) : les joueurs de l'équipe gagnante
  useGameFinished(step === "end", { winners: game?.winner ? players.filter((_, i) => teamOf[i] === game.winner) : [] });
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timeRef = useRef(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [boom, setBoom] = useState(false);
  const tuto = useFirstTimeTuto("code-names");
  // Tuto : 1re fois, dès l'ouverture du jeu (avant la saisie des prénoms)
  const showTutoOnce = useRef(tuto.showIfFirstTime);
  useEffect(() => { showTutoOnce.current(); }, []);
  const timeouts = useRef<number[]>([]);
  const seenWords = useRef<Set<string>>(new Set());

  useEffect(() => preloadSfx([...SOUNDS]), []);

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearLater = useCallback(() => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
  }, []);
  useEffect(() => clearLater, [clearLater]);

  const flash = useCallback(
    (text: string) => {
      const id = Date.now() + Math.random();
      setToast({ id, text });
      later(() => setToast((x) => (x && x.id === id ? null : x)), 1900);
    },
    [later],
  );

  const showVerdict = useCallback(
    (v: Omit<Verdict, "id">, ms: number) => {
      const id = Date.now() + Math.random();
      setVerdict({ ...v, id });
      later(() => setVerdict((x) => (x && x.id === id ? null : x)), ms);
    },
    [later],
  );

  const nameOf = (i: number) => players[i] ?? "";
  const membersOf = (team: Team) => players.map((_, i) => i).filter((i) => teamOf[i] === team);

  // ── Mise en place
  const onPlayers = (names: string[]) => {
    setPlayers(names);
    setTeamOf(splitTeams(names.length));
    setChiefs({ red: -1, blue: -1 });
    setStep("teams");
  };

  /** Chef proposé : le précédent s'il est encore dans l'équipe, sinon le 1er. */
  const defaultChief = (team: Team) => {
    const m = membersOf(team);
    return m.includes(chiefs[team]) ? chiefs[team] : m[0] ?? -1;
  };

  const startGame = (blueChief: number) => {
    const ch = { ...chiefs, blue: blueChief };
    setChiefs(ch);
    const starter: Team = starterChoice === "random" ? (Math.random() < 0.5 ? "red" : "blue") : starterChoice;
    clearLater();
    playSfx("card-shuffle", { volume: 0.8 });
    setGame(newGame(starter, seenWords.current, lang));
    setSelected(null);
    setBusy(false);
    setBoom(false);
    setVerdict(null);
    timeRef.current = timer;
    setTimeLeft(timer);
    setOverlay({ k: "gate", team: null, initial: true });
    setStep("play");
  };

  /** Rejouer : mêmes équipes, le rôle de chef tourne. */
  const replay = () => {
    const next = (team: Team) => {
      const m = membersOf(team);
      const k = m.indexOf(chiefs[team]);
      return m[(k + 1) % m.length] ?? -1;
    };
    setChiefs({ red: next("red"), blue: next("blue") });
    setGame(null);
    setStep("chief-red");
  };

  // ── Nouvelle grille : seulement pendant l'étape secrète du début (les deux chefs regardent)
  const reroll = () => {
    setGame((g) => (g ? newGame(g.starter, seenWords.current, lang) : g));
    playSfx("card-shuffle", { volume: 0.7, delay: 0.08 });
    flash(t.newGrid);
  };

  // ── Passage au tour suivant (écran « Au tour de… »)
  const endTurn = useCallback(() => {
    setGame((g) => (!g || g.winner ? g : { ...g, turn: other(g.turn), turnNo: g.turnNo + 1, count: null, found: 0 }));
    setSelected(null);
    setBusy(false);
    setVerdict(null);
    setOverlay({ k: "pass" });
  }, []);

  /** Fin de tour expliquée (verdict), puis écran de passage. */
  const endTurnWith = useCallback(
    (v: Omit<Verdict, "id">, ms = 1900) => {
      setBusy(true);
      setSelected(null);
      showVerdict(v, ms);
      later(endTurn, ms);
    },
    [showVerdict, later, endTurn],
  );

  // ── Chrono : seulement pendant que l'équipe touche les cartes, rien d'ouvert par-dessus
  const guessing = step === "play" && !!game && !game.winner;
  const running = guessing && timer > 0 && !busy && overlay === null && !showRules && !tuto.open;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const n = Math.max(0, timeRef.current - 1);
      timeRef.current = n;
      setTimeLeft(n);
      if (n > 0 && n <= 5) playSfx(n % 2 ? "tick" : "tock", { volume: 0.7, rate: 1 + (5 - n) * 0.08 });
      if (n === 0) {
        // Temps écoulé : fin du tour expliquée
        window.clearInterval(id);
        vibrate([80, 60, 80]);
        playSfx("bell", { volume: 0.8 });
        endTurnWith({ color: "info", title: t.vTime, sub: t.vTimeSub });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, endTurnWith, t]);

  // ── Révélation d'une case
  const reveal = (idx: number) => {
    if (!game || busy || game.winner) return;
    const card = game.cards[idx];
    if (card.revealed) return;
    const team = game.turn;
    const cards = game.cards.map((c, i) => (i === idx ? { ...c, revealed: true } : c));
    const left = (x: Team) => cards.filter((c) => c.color === x && !c.revealed).length;
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
        setStep("end");
        playSfx("lose", { volume: 0.6 });
      }, 2300);
      return;
    }

    // Quelqu'un n'a plus de mot à trouver ?
    const winner: Team | null = left("red") === 0 ? "red" : left("blue") === 0 ? "blue" : null;
    if (winner) {
      setGame({ ...game, cards });
      setBusy(true);
      if (card.color === team) {
        playSfx("ding", { volume: 0.7, delay: 0.15 });
        showVerdict({ color: card.color, title: t.vOwn(t.team[team].color) }, 1200);
      } else {
        playSfx("wrong", { volume: 0.75, delay: 0.15 });
        showVerdict({ color: card.color, title: t.vEnemy(t.team[winner].color) }, 1200);
      }
      later(() => {
        setGame((g) => (g ? { ...g, winner, reason: winner === team ? "words" : "gift" } : g));
        setBusy(false);
        setVerdict(null);
        setStep("end");
        playCombo("fanfare");
      }, 1300);
      return;
    }

    if (card.color === team) {
      const next = { ...game, cards, found: game.found + 1 };
      const tries = triesLeftOf(next);
      setGame(next);
      playSfx("success", { volume: 0.65, delay: 0.15 });
      vibrate(25);
      const title = t.vOwn(t.team[team].color);
      if (tries === 0) endTurnWith({ color: team, title, sub: t.vOwnLast });
      else showVerdict({ color: team, title, sub: tries === null ? t.vOwnFree : t.vOwnMore(tries) }, 1500);
      return;
    }

    // Neutre ou adverse : fin du tour, expliquée
    setGame({ ...game, cards });
    if (card.color === "neutral") playSfx("tock", { volume: 0.8, rate: 0.8, delay: 0.15 });
    else playSfx("wrong", { volume: 0.75, delay: 0.15 });
    vibrate([60, 40, 60]);
    endTurnWith(
      card.color === "neutral"
        ? { color: "neutral", title: t.vNeutral, sub: t.vNeutralSub }
        : { color: card.color, title: t.vEnemy(t.team[card.color].color), sub: t.vEnemySub(t.team[card.color].short) },
    );
  };

  /** Nombre annoncé (facultatif) : retoucher le même l'enlève. Trop petit vu les cartes déjà trouvées = impossible. */
  const pickCount = (n: string) => {
    if (!game || busy || game.winner) return;
    const count = game.count === n ? null : n;
    const left = triesLeftOf({ ...game, count });
    if (left !== null && left <= 0) return;
    playSfx("toggle", { volume: 0.4 });
    setGame({ ...game, count });
  };

  /** Passer la main à l'autre équipe (1 tap). */
  const passHand = () => {
    if (!game || busy || game.winner) return;
    playSfx("toggle", { volume: 0.5 });
    endTurnWith({ color: "info", title: t.vStop, sub: t.vStopSub }, 1300);
  };

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

  const tools = (
    <GameTopRight>
      <RulesIconButton onClick={() => setShowRules(true)} />
      <SoundButton />
    </GameTopRight>
  );
  const sheets = (
    <>
      {showRules && <GameRulesSheet name={t.title} rules={t.rulesItems} onClose={() => setShowRules(false)} onTuto={tuto.show} />}
      {tuto.open && <GameTuto slides={tutoSlides(t)} onDone={tuto.close} />}
    </>
  );

  // ── Écrans de mise en place
  if (step === "players") {
    return (
      <>
        <PlayersSetup emoji="🕵️" name={t.title} min={4} max={16} accent={PINK} onStart={onPlayers} footer={<IdeaButton game="Mots Espions" kind="mot" />} />
        {tools}
        {sheets}
      </>
    );
  }

  if (step === "teams") {
    return (
      <>
        <TeamsScreen
          players={players}
          teamOf={teamOf}
          setTeamOf={setTeamOf}
          starter={starterChoice}
          setStarter={setStarterChoice}
          timer={timer}
          setTimer={setTimer}
          onNext={() => setStep("chief-red")}
          onBack={() => setStep("players")}
        />
        {tools}
        {sheets}
      </>
    );
  }

  if (step === "chief-red" || step === "chief-blue") {
    const team: Team = step === "chief-red" ? "red" : "blue";
    return (
      <>
        <ChiefScreen
          key={team}
          team={team}
          players={players}
          members={membersOf(team)}
          initial={defaultChief(team)}
          onPick={(i) => {
            playSfx("pop", { volume: 0.6 });
            if (team === "red") {
              setChiefs((c) => ({ ...c, red: i }));
              setStep("chief-blue");
            } else startGame(i);
          }}
          onBack={() => setStep(team === "red" ? "teams" : "chief-red")}
        />
        {tools}
        {sheets}
      </>
    );
  }

  if (!game) return null;

  // ── Plateau (tour en cours ou fin de partie)
  const team = game.turn;
  const ended = step === "end";
  const w = game.winner;
  const accent = ended && w ? TEAM[w] : TEAM[team];
  const remaining = (x: Team) => game.cards.filter((c) => c.color === x && !c.revealed).length;
  const lowTime = timer > 0 && timeLeft <= 10;

  return (
    <div className="relative flex flex-col overflow-hidden text-white select-none" style={{ height: "100dvh", ...PAGE_BG, WebkitTapHighlightColor: "transparent" }}>
      <style>{CSS}</style>
      {/* Cadre couleur d'équipe : on sait toujours à qui c'est */}
      <div className="pointer-events-none absolute inset-0 z-20" style={{ boxShadow: `inset 0 0 0 6px ${accent.main}`, transition: "box-shadow 0.5s" }} />

      {/* ── En-tête (haut-gauche : croix de l'app ; haut-droit : règles + son) */}
      <header className="relative z-10 flex min-h-[44px] items-center pl-[68px] pr-[118px]" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        {ended ? (
          <p className="truncate text-[24px] leading-none" style={DISPLAY}>{t.gameOver}</p>
        ) : (
          <span className="inline-block max-w-full truncate rounded-full px-3 py-1.5 text-[17px] leading-tight" style={{ ...stk(accent.main, 3), color: accent.ink, ...DISPLAY, rotate: "-2deg" }}>
            {t.turnBanner(t.team[team].short)}
          </span>
        )}
      </header>

      {/* ── Compteurs + indice */}
      <div className="relative z-10 mx-auto mt-3 flex w-full max-w-[560px] items-stretch gap-2 px-3">
        <Counter team="red" label={t.team.red.short} left={remaining("red")} active={!ended && team === "red"} aria={t.counterAria(t.team.red.short, remaining("red"))} />
        {ended ? (
          <div className="flex flex-[1.3] items-center justify-center rounded-[18px] px-2 text-center" style={{ ...stk(CARD_FACE, 3), color: INK }}>
            <span className="text-[14px] font-bold leading-tight">{t.wholeGrid}</span>
          </div>
        ) : (
          <div className="flex min-h-[54px] min-w-0 flex-[1.3] flex-col items-center justify-center rounded-[18px] px-2 py-1 text-center" style={{ ...stk(game.count ? YELLOW : CARD_FACE, 3), color: INK }}>
            <span className="max-w-full leading-[1.05]" style={{ ...DISPLAY, fontSize: "clamp(14px, 4.2vw, 16px)", overflowWrap: "anywhere" }}>
              {game.count ? t.clueN(game.count) : t.clueOral}
            </span>
            <span className="text-[13px] font-bold leading-tight">
              {triesLeftOf(game) === null ? (game.count ? t.triesInf : t.noLimit) : t.triesLeft(triesLeftOf(game) ?? 0)}
            </span>
          </div>
        )}
        <Counter team="blue" label={t.team.blue.short} left={remaining("blue")} active={!ended && team === "blue"} aria={t.counterAria(t.team.blue.short, remaining("blue"))} />
      </div>

      {/* ── Bandeau fin de partie */}
      {ended && w && (
        <div className="relative z-10 mx-auto mt-3 w-full max-w-[560px] px-3 cn-pop">
          <div className="rounded-[24px] px-3 pb-2.5 pt-2" style={{ ...stk(TEAM[w].main, 5, 3), color: "#fff", rotate: "-1deg" }}>
            <div className="flex items-end justify-center gap-0.5">
              {membersOf(w).slice(0, 6).map((i) => (
                <PlayerBlob key={i} name={nameOf(i)} colorIndex={i} size={40} mood="laughing" crown={i === chiefs[w]} cheering />
              ))}
            </div>
            <p className="mt-1 text-center text-[26px] leading-[1.02]" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>
              {t.wins(t.team[w].The)}
            </p>
            <p className="mt-0.5 text-center text-[14px] font-bold leading-snug">
              {game.reason === "bomb"
                ? t.reasonBomb(t.team[other(w)].The)
                : game.reason === "gift"
                  ? t.reasonGift(t.team[other(w)].The, w)
                  : t.reasonWords}
            </p>
          </div>
        </div>
      )}

      {/* ── Grille 5×5 */}
      <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 items-center px-3 py-3" style={{ minHeight: 0 }}>
        <div className="grid h-full max-h-[620px] w-full grid-cols-5 gap-[7px]" style={{ gridTemplateRows: "repeat(5, minmax(46px, 1fr))" }}>
          {game.cards.map((c, i) => (
            <WordCard key={`${game.seed}-${i}`} card={c} index={i} lang={lang} selected={selected === i} showAll={ended} onTap={() => tapCard(i)} />
          ))}
        </div>
      </div>

      {/* ── Rappel contextuel + actions */}
      <footer className="relative z-10 mx-auto w-full max-w-[560px] px-3" style={{ paddingBottom: BOTTOM_PAD }}>
        {!ended && (
          <div className="mb-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {/* Nombre annoncé par le chef : facultatif, juste pour limiter les essais (étiquette au-dessus sur petit écran) */}
            <p className={`text-[13px] font-bold leading-tight ${timer === 0 ? "w-full min-[380px]:w-auto min-[380px]:min-w-0 min-[380px]:flex-1" : "w-full"}`} style={{ color: "rgba(255,255,255,0.85)" }}>{t.countLabel}</p>
            <div className={`flex gap-1.5 ${timer === 0 ? "" : "min-w-0 flex-1"}`} role="group" aria-label={t.countLabel}>
              {COUNTS.map((n) => {
                const on = game.count === n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={t.countAria(n)}
                    aria-pressed={on}
                    disabled={busy}
                    onClick={() => pickCount(n)}
                    className="cn-push grid h-11 w-11 shrink-0 place-items-center rounded-full text-[19px]"
                    style={{ ...stk(on ? YELLOW : CARD_FACE, 3, 2.5), color: INK, ...DISPLAY, letterSpacing: 0 }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {timer > 0 && (
              <div
                className={`flex h-11 min-w-[60px] shrink-0 items-center justify-center gap-1 rounded-full px-2 tabular-nums ${lowTime ? "cn-pulse" : ""}`}
                style={{ ...stk(lowTime ? "#FF5A5F" : "#fff", 3), color: lowTime ? "#fff" : INK, fontSize: 18, ...DISPLAY, letterSpacing: 0 }}
                aria-label={t.timeLeft}
              >
                <Timer size={16} strokeWidth={3} aria-hidden />
                {timeLeft}
              </div>
            )}
          </div>
        )}
        {ended && <SoireeNextButton bg="#3DDC97" className="mb-2.5" />}
        <div className="flex items-center gap-2.5">
          {ended ? (
            <>
              <IdeaButton game="Mots Espions" kind="mot" compact bg="#fff" />
              {/* App : pas de « Quitter » (la croix en haut à gauche le fait déjà) */}
              {endHome(onReturnToLobby) && (
                <Btn bg="#fff" onClick={() => onReturnToLobby?.()} className="flex-[0.8]">
                  {t.quit}
                </Btn>
              )}
              {/* Soirée : « Jeu suivant » au-dessus est le principal, Rejouer passe en secondaire */}
              <EndReplay onClick={replay} label={t.replay} className="flex-[2] whitespace-nowrap">
                <Btn bg={YELLOW} onClick={replay} className="flex-[2] whitespace-nowrap" big style={{ fontSize: 17 }}>
                  <RotateCcw size={20} strokeWidth={3} aria-hidden /> {t.replay}
                </Btn>
              </EndReplay>
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
                  setOverlay({ k: "gate", team, initial: false });
                }}
                className="shrink-0 !px-3.5"
                style={{ fontSize: 15 }}
              >
                <Eye size={18} strokeWidth={2.8} className="shrink-0" aria-hidden /> <span aria-hidden>{t.seeKeyShort}</span><span className="sr-only">{t.seeKey}</span>
              </Btn>
              <Btn bg={TEAM[other(team)].main} color="#fff" disabled={busy} onClick={passHand} className="min-w-0 flex-1 !px-3" style={{ fontSize: "clamp(14px, 4.2vw, 16px)" }}>
                <span className="truncate">{t.passTo(t.team[other(team)].short)}</span> <ArrowRight size={19} strokeWidth={3} className="shrink-0 max-[360px]:hidden" aria-hidden />
              </Btn>
            </>
          )}
        </div>
        {ended && (
          <div className="mt-1.5 flex justify-center">
            <button type="button" onClick={() => setStep("teams")} className="flex min-h-11 items-center gap-1.5 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ color: "rgba(255,255,255,0.85)" }}>
              <Users size={17} strokeWidth={2.8} aria-hidden /> {t.changeTeams}
            </button>
          </div>
        )}
      </footer>

      {/* ── Verdict de la carte touchée */}
      {verdict && <VerdictCard key={verdict.id} v={verdict} />}

      {/* ── Petit message (ex. « Attendez l'indice ») */}
      {toast && (
        <div key={toast.id} className="pointer-events-none absolute inset-x-0 z-[36] flex justify-center px-6" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 150px)" }}>
          <div className="cn-toast rounded-full px-5 py-2.5 text-center text-[16px] font-extrabold" style={{ ...stk(YELLOW, 4), color: INK, rotate: "-1.5deg" }}>
            {toast.text}
          </div>
        </div>
      )}

      {/* ── Explosion */}
      {boom && (
        <div className="cn-boom absolute inset-0 z-[38] flex flex-col items-center justify-center px-6 text-center" style={{ ...PAGE_BG, backgroundColor: "#FF6B5B" }}>
          <span className="cn-bomb grid h-36 w-36 place-items-center rounded-full" style={{ ...stk(INK, 6, 3), color: YELLOW }}>
            <Bomb size={78} strokeWidth={2.4} aria-hidden />
          </span>
          <p className="mt-5 text-[76px] leading-none" style={{ ...DISPLAY, color: INK }}>
            {t.boom}
          </p>
          <p className="mt-3 rounded-full px-4 py-2 text-[17px] font-extrabold" style={{ ...stk("#fff", 4), color: INK, rotate: "-2deg" }}>
            {t.bombHitBy(t.team[team].The)}
          </p>
        </div>
      )}

      {ended && game.winner && <ConfettiBurst count={70} />}

      {/* ── Étape secrète : seuls les chefs */}
      {overlay?.k === "gate" && (
        <GateScreen
          names={overlay.team ? [nameOf(chiefs[overlay.team])] : [nameOf(chiefs.red), nameOf(chiefs.blue)]}
          indexes={overlay.team ? [chiefs[overlay.team]] : [chiefs.red, chiefs.blue]}
          onOk={() => {
            playSfx("open", { volume: 0.5 });
            setOverlay({ k: "key", team: overlay.team, initial: overlay.initial });
          }}
          onCancel={overlay.initial ? undefined : () => setOverlay(null)}
        />
      )}
      {overlay?.k === "key" && (
        <KeyScreen
          cards={game.cards}
          starter={game.starter}
          lang={lang}
          onReroll={overlay.initial ? reroll : undefined}
          doneLabel={overlay.initial ? t.keyDone : t.keyBack}
          onDone={() => {
            playSfx("close", { volume: 0.5 });
            setOverlay(overlay.initial ? { k: "pass" } : null);
          }}
        />
      )}
      {overlay?.k === "pass" && (
        <PassTurn
          team={team}
          chief={chiefs[team]}
          players={players}
          members={membersOf(team)}
          first={game.turnNo === 1}
          counts={[remaining(team), remaining(other(team))]}
          onGo={() => {
            playSfx("whoosh", { volume: 0.5 });
            // Le chrono (facultatif) repart pour ce tour
            timeRef.current = timer;
            setTimeLeft(timer);
            setOverlay(null);
          }}
        />
      )}
      {tools}
      {sheets}
    </div>
  );
}

/** Slides du tuto (textes de la langue courante + vignettes). */
function tutoSlides(t: (typeof STR)["fr"]): TutoSlide[] {
  const arts = [ArtTeams, ArtKey, ArtClue, ArtTap];
  return t.tuto.map((s, i) => {
    const Art = arts[i];
    return { ...s, art: <Art a={t.tutoArt} /> };
  });
}

// ── Compteur de mots restants ─────────────────────────────
function Counter({ team, label, left, active, aria }: { team: Team; label: string; left: number; active: boolean; aria: string }) {
  const c = TEAM[team];
  return (
    <div
      className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[18px] px-1.5 py-1"
      style={{ ...stk(c.main, active ? 4 : 2), color: c.ink, rotate: active ? (team === "red" ? "-2deg" : "2deg") : "0deg", opacity: active ? 1 : 0.8, transition: "rotate 0.3s ease" }}
      aria-label={aria}
    >
      <span className="tabular-nums" style={{ ...DISPLAY, fontSize: 26, lineHeight: 1 }}>
        {left}
      </span>
      <span className="max-w-full truncate text-[13px] font-bold leading-tight">{label}</span>
    </div>
  );
}

// ── Case de la grille (flip à la révélation) ──────────────
function faceStyle(color: CardColor): CSSProperties {
  if (color === "neutral") return { background: NEUTRAL.main, color: NEUTRAL.ink };
  if (color === "bomb") return { background: INK, color: YELLOW };
  return { background: TEAM[color].main, color: TEAM[color].ink };
}

function WordLabel({ word, lang }: { word: string; lang: Lang }) {
  const lines = splitWord(word, lang);
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

function WordCard({ card, index, lang, selected, showAll, onTap }: { card: Card; index: number; lang: Lang; selected: boolean; showAll: boolean; onTap: () => void }) {
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
        opacity: ghost ? 0.55 : 1,
      }}
      aria-label={card.word}
      aria-pressed={selected}
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
        <span className="absolute inset-0 flex items-center justify-center px-0.5" style={{ ...tile, background: selected ? YELLOW : CARD_FACE, color: INK, boxShadow: `0 ${selected ? 6 : 3}px 0 ${INK}` }}>
          <WordLabel word={card.word} lang={lang} />
        </span>
        {/* Face révélée */}
        <span className="absolute inset-0 flex flex-col items-center justify-center px-0.5" style={{ ...tile, transform: "rotateY(180deg)", boxShadow: `0 3px 0 ${INK}`, ...faceStyle(card.color) }}>
          {card.color === "bomb" && <Bomb size={17} strokeWidth={2.6} aria-hidden />}
          <WordLabel word={card.word} lang={lang} />
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

// ── Verdict d'une carte (bonne / adverse / neutre / bombe / fin du tour) ──
function VerdictCard({ v }: { v: Verdict }) {
  const bg = v.color === "info" ? YELLOW : v.color === "neutral" ? NEUTRAL.main : v.color === "bomb" ? INK : TEAM[v.color].main;
  const fg = v.color === "info" || v.color === "neutral" ? INK : "#fff";
  return (
    <div className="pointer-events-none absolute inset-0 z-[34] flex items-center justify-center px-6" role="status" aria-live="polite">
      <div className="cn-verdict w-full max-w-[330px] rounded-[26px] px-5 py-4 text-center" style={{ ...stk(bg, 6, 3), color: fg, rotate: "-2deg" }}>
        <p className="text-[28px] leading-[1]" style={DISPLAY}>
          {v.title}
        </p>
        {v.sub && <p className="mt-1.5 text-[16px] font-bold leading-snug">{v.sub}</p>}
      </div>
    </div>
  );
}

// ── Écran plein « sticker » commun aux surimpressions ──────
function FullScreen({ children, bg = NIGHT, z = 30 }: { children: ReactNode; bg?: string; z?: number }) {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-y-auto px-5 text-white"
      style={{ ...PAGE_BG, backgroundColor: bg, zIndex: z, paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}
    >
      {children}
    </div>
  );
}

// ── « Seuls les chefs regardent ! » ───────────────────────
function GateScreen({ names, indexes, onOk, onCancel }: { names: string[]; indexes: number[]; onOk: () => void; onCancel?: () => void }) {
  const t = useT(STR);
  return (
    <FullScreen>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center text-center cn-pop">
        <div className="flex items-end justify-center gap-2">
          {indexes.map((idx, k) => (
            <div key={idx} className="flex flex-col items-center">
              <PlayerBlob name={names[k]} colorIndex={idx} size={88} mood="shifty" arms />
              <span className="-mt-1 rounded-full px-2.5 py-0.5 text-[13px] font-extrabold" style={{ ...stk(YELLOW, 2, 2), color: INK }}>
                <Crown size={12} strokeWidth={3} className="mr-1 inline" aria-hidden />
                {names[k]}
              </span>
            </div>
          ))}
        </div>
        <h2 className="mt-5 text-[38px] leading-[0.95]" style={DISPLAY}>
          {t.onlyChiefs}
        </h2>
        <p className="mt-3 text-[17px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.9)" }}>
          {names.length > 1 ? t.gateBoth(names[0], names[1]) : t.gateOne(names[0])}
        </p>
        <Btn bg={PINK} color="#fff" big onClick={onOk} className="mt-8 w-full">
          <Eye size={22} strokeWidth={2.8} aria-hidden /> {names.length > 1 ? t.weAreChiefs : t.itsMe(names[0])}
        </Btn>
        {onCancel && <BackLink onClick={onCancel} label={t.back} />}
      </div>
    </FullScreen>
  );
}

// ── Carte secrète des chefs ───────────────────────────────
function KeyScreen({ cards, starter, lang, onReroll, doneLabel, onDone }: { cards: Card[]; starter: Team; lang: Lang; onReroll?: () => void; doneLabel: string; onDone: () => void }) {
  const t = useT(STR);
  const [holding, setHolding] = useState(false);
  const stop = () => setHolding(false);
  const count = (x: Team) => (x === starter ? 9 : 8);
  return (
    <FullScreen>
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col" style={{ minHeight: 0 }}>
        <h2 className="text-center text-[28px] leading-none" style={DISPLAY}>
          {t.keyTitle}
        </h2>
        <p className="mt-1 text-center text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
          {t.keyIntro}
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <Legend color={TEAM.red.main} label={t.legendTeam(count("red"), "red")} />
          <Legend color={TEAM.blue.main} label={t.legendTeam(count("blue"), "blue")} />
          <Legend color={NEUTRAL.main} label={t.legendNeutral} />
          <Legend color={INK} label={t.legendBomb} bomb />
        </div>
        <div className="relative mt-3 flex min-h-[230px] flex-1 items-center">
          <div className="grid h-full max-h-[520px] w-full grid-cols-5 gap-[6px]" style={{ gridTemplateRows: "repeat(5, minmax(42px, 1fr))" }}>
            {cards.map((c, i) => {
              // Tant qu'on ne maintient pas, rien n'est rendu (pas de triche par capture)
              const st: CSSProperties = holding ? faceStyle(c.color) : { background: "#3A2A7A" };
              return (
                <div key={i} className="relative flex flex-col items-center justify-center rounded-[12px] px-0.5" style={{ ...st, border: `2.5px solid ${INK}`, opacity: holding && c.revealed ? 0.35 : 1 }}>
                  {holding && c.color === "bomb" && <Bomb size={15} strokeWidth={2.6} aria-hidden />}
                  {holding && <WordLabel word={c.word} lang={lang} />}
                  {holding && c.revealed && <X size={14} strokeWidth={3} className="absolute right-1 top-1" aria-label={t.alreadyFound} />}
                </div>
              );
            })}
          </div>
          {!holding && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
              <span className="rounded-[20px] px-4 py-3 text-[18px] font-extrabold" style={{ ...stk(YELLOW, 4), color: INK, rotate: "-2deg" }}>
                {t.holdToSee}
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            playSfx("card-flip", { volume: 0.5 });
            setHolding(true);
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onContextMenu={(e) => e.preventDefault()}
          className="mt-3 flex h-[64px] w-full shrink-0 touch-none items-center justify-center gap-2 rounded-full"
          style={{
            ...stk(holding ? MINT : PINK, holding ? 1 : 6, 3),
            transform: holding ? "translateY(5px)" : "none",
            transition: "transform 0.1s, box-shadow 0.1s",
            color: holding ? INK : "#fff",
            fontSize: 21,
            ...DISPLAY,
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
        >
          {holding ? t.releaseHide : <><Pointer size={22} strokeWidth={2.8} aria-hidden /> {t.holdBtn}</>}
        </button>
        <div className="mt-3 flex shrink-0 flex-col items-stretch gap-2.5">
          <Btn bg="#fff" onClick={onDone}>
            <Check size={19} strokeWidth={3} aria-hidden /> {doneLabel}
          </Btn>
          {onReroll && (
            <div className="flex justify-center">
              <RerollButton onClick={onReroll} label={t.rerollGrid} />
            </div>
          )}
        </div>
      </div>
    </FullScreen>
  );
}

function Legend({ color, label, bomb }: { color: string; label: string; bomb?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-[12.5px] font-bold leading-tight" style={{ ...stk("#fff", 2, 2), color: INK }}>
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: color, border: `2px solid ${INK}`, color: YELLOW }}>
        {bomb && <Bomb size={11} strokeWidth={3} aria-hidden />}
      </span>
      <span className="min-w-0">{label}</span>
    </span>
  );
}

// ── « Au tour de l'équipe X ! » ───────────────────────────
function PassTurn({ team, chief, players, members, first, counts, onGo }: { team: Team; chief: number; players: string[]; members: number[]; first: boolean; counts: [number, number]; onGo: () => void }) {
  const t = useT(STR);
  const c = TEAM[team];
  const name = players[chief] ?? "";
  useEffect(() => { playSfx("whoosh", { volume: 0.5 }); }, []);
  return (
    <FullScreen bg={c.main}>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center text-center cn-pop">
        <p className="text-[34px] leading-[0.98]" style={{ ...DISPLAY, overflowWrap: "anywhere" }}>
          {t.turnOf(t.team[team].the)}
        </p>
        <div className="mt-4 flex items-end justify-center gap-1">
          {members.filter((i) => i !== chief).slice(0, 2).map((i) => (
            <PlayerBlob key={i} name={players[i]} colorIndex={i} size={52} mood="happy" />
          ))}
          <PlayerBlob name={name} colorIndex={chief} size={104} mood="wink" arms crown talk autoTalk />
          {members.filter((i) => i !== chief).slice(2, 4).map((i) => (
            <PlayerBlob key={i} name={players[i]} colorIndex={i} size={52} mood="happy" />
          ))}
        </div>
        <p className="mt-2 rounded-full px-4 py-1.5 text-[18px] font-extrabold" style={{ ...stk("#fff", 3), color: INK, rotate: "-2deg" }}>
          <Crown size={16} strokeWidth={3} className="mr-1 inline" aria-hidden />
          {t.chiefIs(name)}
        </p>
        {first && <p className="mt-4 text-[16px] font-bold leading-snug">{t.firstTurn(counts[0], counts[1])}</p>}
        <p className="mt-3 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.95)" }}>
          {t.passHint(name)}
        </p>
        <Btn bg={YELLOW} big onClick={onGo} className="mt-7 w-full">
          {t.go}
        </Btn>
      </div>
    </FullScreen>
  );
}

// ── Équipes ───────────────────────────────────────────────
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 mt-6 text-[22px] leading-none" style={DISPLAY}>
      {children}
    </h2>
  );
}

function TeamsScreen({
  players,
  teamOf,
  setTeamOf,
  starter,
  setStarter,
  timer,
  setTimer,
  onNext,
  onBack,
}: {
  players: string[];
  teamOf: Team[];
  setTeamOf: (t: Team[]) => void;
  starter: StarterChoice;
  setStarter: (s: StarterChoice) => void;
  timer: number;
  setTimer: (t: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const tr = useT(STR);
  const size = (x: Team) => teamOf.filter((y) => y === x).length;
  const short = (["red", "blue"] as Team[]).find((x) => size(x) < 2);
  const chip = (active: boolean, color: string, i: number): CSSProperties => ({
    ...stk(active ? color : "#fff", active ? 4 : 3),
    color: active && color !== YELLOW ? "#fff" : INK,
    rotate: active ? (i % 2 ? "2deg" : "-2deg") : "0deg",
    transition: "rotate 0.2s",
  });
  return (
    <div className="relative flex flex-col overflow-y-auto text-white" style={{ minHeight: "100dvh", ...PAGE_BG, paddingTop: TOP_PAD }}>
      <style>{CSS}</style>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4" style={{ paddingBottom: BOTTOM_PAD }}>
        <h1 className="text-[38px] leading-[0.95]" style={DISPLAY}>
          {tr.teamsTitle}
        </h1>
        <p className="mt-1.5 text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
          {tr.teamsSub}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {(["red", "blue"] as Team[]).map((x, k) => (
            <div key={x} className="rounded-[22px] p-2" style={{ ...stk(TEAM[x].main, 4), rotate: k ? "1deg" : "-1deg" }}>
              <p className="px-1 pb-1 text-[20px] leading-tight" style={{ ...DISPLAY, color: "#fff" }}>
                {tr.team[x].short} <span className="text-[15px] opacity-85">({size(x)})</span>
              </p>
              <div className="space-y-1.5">
                {players.map((p, i) =>
                  teamOf[i] !== x ? null : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        playSfx("toggle", { volume: 0.4 });
                        setTeamOf(teamOf.map((y, j) => (j === i ? other(y) : y)));
                      }}
                      className="cn-push flex min-h-[48px] w-full items-center gap-1.5 rounded-[16px] py-1 pl-1 pr-2 text-left"
                      style={{ ...stk("#fff", 2, 2), color: INK }}
                    >
                      <PlayerBlob name={p} colorIndex={i} size={36} mood="happy" delay={i * 0.3} />
                      <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold">{p}</span>
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => {
              playSfx("card-shuffle", { volume: 0.6 });
              setTeamOf(splitTeams(players.length));
            }}
            className="cn-push flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-extrabold"
            style={{ ...stk("#fff", 3), color: INK }}
          >
            <Shuffle size={17} strokeWidth={3} aria-hidden /> {tr.shuffle}
          </button>
        </div>

        <SectionTitle>{tr.whoStarts}</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {([
            ["random", tr.random],
            ["red", tr.team.red.short],
            ["blue", tr.team.blue.short],
          ] as [StarterChoice, string][]).map(([v, l], i) => (
            <button
              key={v}
              type="button"
              aria-pressed={starter === v}
              onClick={() => {
                playSfx("toggle", { volume: 0.4 });
                setStarter(v);
              }}
              className="cn-push flex h-[50px] min-w-0 items-center justify-center gap-1 rounded-full px-2 text-[15px] font-extrabold"
              style={chip(starter === v, v === "random" ? YELLOW : TEAM[v as Team].main, i)}
            >
              {v === "random" && <Dices size={17} strokeWidth={2.8} className="shrink-0" aria-hidden />}
              <span className="truncate">{l}</span>
            </button>
          ))}
        </div>

        <SectionTitle>{tr.timerTitle}</SectionTitle>
        <div className="grid grid-cols-4 gap-2.5">
          {TIMER_OPTIONS.map((x, i) => (
            <button
              key={x}
              type="button"
              aria-pressed={timer === x}
              onClick={() => {
                playSfx("toggle", { volume: 0.4 });
                setTimer(x);
              }}
              className="cn-push h-[50px] rounded-full text-[17px]"
              style={{ ...chip(timer === x, YELLOW, i), ...DISPLAY, letterSpacing: 0 }}
            >
              {x === 0 ? tr.noTimer : tr.secs(x)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
          {tr.timerHint}
        </p>

        <div
          className="sticky bottom-0 z-[2] -mx-4 mt-auto px-4 pt-5"
          style={{ background: `linear-gradient(180deg, ${NIGHT}00 0px, ${NIGHT} 18px)`, paddingBottom: BOTTOM_PAD, marginBottom: `calc(-1 * ${BOTTOM_PAD})` }}
        >
          {short && (
            <p role="alert" className="mb-2.5 text-center text-[15px] font-bold" style={{ color: YELLOW }}>
              {tr.needTwo(tr.team[short].the)}
            </p>
          )}
          <Btn bg={PINK} color="#fff" big disabled={!!short} onClick={onNext} className="w-full">
            <Crown size={21} strokeWidth={3} aria-hidden /> {tr.toChiefs}
          </Btn>
          <BackLink onClick={onBack} label={tr.back} />
        </div>
      </div>
    </div>
  );
}

// ── « Qui est le chef de l'équipe rouge ? » ───────────────
function ChiefScreen({ team, players, members, initial, onPick, onBack }: { team: Team; players: string[]; members: number[]; initial: number; onPick: (i: number) => void; onBack: () => void }) {
  const t = useT(STR);
  const [sel, setSel] = useState(initial);
  const c = TEAM[team];
  return (
    <div className="relative flex flex-col overflow-y-auto text-white" style={{ minHeight: "100dvh", ...PAGE_BG, paddingTop: TOP_PAD }}>
      <style>{CSS}</style>
      <div className="pointer-events-none fixed inset-0 z-20" style={{ boxShadow: `inset 0 0 0 6px ${c.main}` }} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5" style={{ paddingBottom: BOTTOM_PAD }}>
        <span className="self-start rounded-full px-3 py-1 text-[15px] font-extrabold" style={{ ...stk(c.main, 3), color: "#fff", rotate: "-2deg" }}>
          {t.team[team].The}
        </span>
        <h1 className="mt-3 text-[36px] leading-[0.98]" style={DISPLAY}>
          {t.chiefQ(t.team[team].the)}
        </h1>
        <p className="mt-2 text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
          {t.chiefRole}
        </p>
        <p className="mt-4 text-[14px] font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
          {t.chiefPick}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          {members.map((i, k) => {
            const on = sel === i;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  playSfx("tap", { volume: 0.5 });
                  setSel(i);
                }}
                className="cn-push relative flex flex-col items-center rounded-[20px] px-1 pb-2 pt-3"
                style={{ ...stk(on ? YELLOW : "#fff", on ? 5 : 3), color: INK, rotate: on ? (k % 2 ? "2deg" : "-2deg") : "0deg", transition: "rotate .2s" }}
              >
                {on && (
                  <span className="absolute -top-3 grid h-7 w-7 place-items-center rounded-full" style={{ ...stk(c.main, 2, 2), color: "#fff" }}>
                    <Crown size={15} strokeWidth={3} aria-hidden />
                  </span>
                )}
                <PlayerBlob name={players[i]} colorIndex={i} size={58} mood={on ? "cool" : "happy"} bob={on} />
                <span className="mt-1 max-w-full truncate text-[15px] font-extrabold">{players[i]}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto pt-6">
          <Btn bg={c.main} color="#fff" big disabled={sel < 0} onClick={() => onPick(sel)} className="w-full">
            <Crown size={21} strokeWidth={3} aria-hidden /> {t.chiefOk(players[sel] ?? "")}
          </Btn>
          <BackLink onClick={onBack} label={t.back} />
        </div>
      </div>
    </div>
  );
}

// ── Animations locales ────────────────────────────────────
const CSS = `
@keyframes cn-pop { 0% { transform: scale(.85); opacity: 0 } 60% { transform: scale(1.04); opacity: 1 } 100% { transform: scale(1) } }
@keyframes cn-toast { 0% { transform: translateY(16px) scale(.9); opacity: 0 } 12% { transform: translateY(0) scale(1); opacity: 1 } 85% { opacity: 1 } 100% { opacity: 0; transform: translateY(-6px) } }
@keyframes cn-verdict { 0% { transform: scale(.6) rotate(-6deg); opacity: 0 } 25% { transform: scale(1.06) rotate(1deg); opacity: 1 } 40% { transform: scale(1) rotate(-2deg) } 100% { transform: scale(1) rotate(-2deg); opacity: 1 } }
@keyframes cn-boom { 0% { opacity: 0; transform: scale(1.3) } 15% { opacity: 1; transform: scale(1) } 25% { transform: translateX(-10px) } 35% { transform: translateX(10px) } 45% { transform: translateX(-6px) } 55% { transform: translateX(0) } 100% { opacity: 1 } }
@keyframes cn-bomb { 0% { transform: scale(.3) rotate(-30deg) } 50% { transform: scale(1.15) rotate(8deg) } 100% { transform: scale(1) rotate(-4deg) } }
@keyframes cn-sheet { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes cn-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.1) } }
.cn-pop { animation: cn-pop .35s ease-out both }
.cn-toast { animation: cn-toast 1.9s ease-out both }
.cn-verdict { animation: cn-verdict .45s cubic-bezier(.3,1.3,.5,1) both }
.cn-boom { animation: cn-boom 1.6s ease-out both }
.cn-bomb { animation: cn-bomb .6s cubic-bezier(.3,1.5,.5,1) both }
.cn-sheet { animation: cn-sheet .28s cubic-bezier(.2,.9,.3,1) both }
.cn-pulse { animation: cn-pulse .8s ease-in-out infinite }
.cn-push { transition: translate .11s ease, box-shadow .11s ease; touch-action: manipulation; -webkit-tap-highlight-color: transparent }
.cn-push:not(:disabled):active { translate: 0 3px; box-shadow: 0 1px 0 ${INK} !important }
@media (prefers-reduced-motion: reduce) { .cn-pop, .cn-bomb, .cn-sheet, .cn-pulse, .cn-verdict { animation-duration: 1ms !important } }
`;
