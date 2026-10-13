"use client";

/**
 * TEST DE PURETÉ — le classique « As-tu déjà… ? » version soirée, sur un seul téléphone.
 * Deux modes :
 *  - « Chacun son tour » : chacun répond en secret (on se passe le tél), puis grande révélation.
 *  - « Tous ensemble » : une question à l'écran, on répond à voix haute, le tél compte les oui.
 * Pureté = % de « jamais ». 100 % = ange, 0 % = démon. 100 % local, aucune donnée envoyée.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { GameProps } from "@/lib/games/types";
import { PlayersSetup, PassScreen, colorForIndex } from "@/components/games/local-kit";
import { Mascot, MascotAvatar, MASCOT_PALETTE, type MascotColor, type MascotMood } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { playCombo, playSfx, preloadSfx } from "@/lib/sfx";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { TopRightControls } from "@/components/games/patate/rules-sheet";
import { QUESTION_PACKS, GAGES, type PackId } from "@/components/games/purete/questions";
import { ArrowLeft, EyeOff, Flame, Hand, Heart, PartyPopper, RotateCcw, Target, User, type LucideIcon } from "lucide-react";
import { GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";

// ── Constantes visuelles ─────────────────────────────────
const INK = "#15082E";
const VIOLET = "#4B2BC2";
const YELLOW = "#FFD23F";
const PINK = "#FF3EA5";
const MINT = "#3DDC97";
const RED = "#FF4B3E";
const CREAM = "#FFF6E5";
const FLASHY = ["#FFD23F", "#3DDC97", "#6EC8FF", "#FF8FC8", "#B5A1FF", "#FF9A5B"];
const DISPLAY: CSSProperties = { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, letterSpacing: "-0.02em", wordSpacing: "0.12em" };

const block = (bg: string, radius = 22, shadow = 5): CSSProperties => ({
  background: bg,
  border: `3px solid ${INK}`,
  boxShadow: `0 ${shadow}px 0 ${INK}`,
  borderRadius: radius,
  color: INK,
});

const PACK_INFO: Record<PackId, { icon: LucideIcon; label: string; tag: string; color: string }> = {
  soft: { icon: Heart, label: "Soft", tag: "Tout public", color: "#6EC8FF" },
  soiree: { icon: PartyPopper, label: "Soirée", tag: "Fêtes, ex, bêtises", color: YELLOW },
  coquin: { icon: Flame, label: "Coquin", tag: "18+ · suggestif", color: PINK },
};

// Barème des titres (du plus pur au moins pur)
const TITLES: { min: number; title: string; emoji: string }[] = [
  { min: 90, title: "Ange tombé du ciel", emoji: "😇" },
  { min: 80, title: "Enfant de chœur", emoji: "🕊️" },
  { min: 70, title: "Sage comme une image", emoji: "🧸" },
  { min: 60, title: "Gentil, mais pas trop", emoji: "🙂" },
  { min: 50, title: "Ni ange ni démon", emoji: "⚖️" },
  { min: 40, title: "Petit diable en formation", emoji: "😏" },
  { min: 30, title: "Mauvaise influence", emoji: "🙊" },
  { min: 20, title: "Légende des soirées", emoji: "🪩" },
  { min: 10, title: "Casier bien rempli", emoji: "🚨" },
  { min: 0, title: "Démon certifié", emoji: "😈" },
];
const titleFor = (p: number) => TITLES.find((t) => p >= t.min) ?? TITLES[TITLES.length - 1];

function moodFor(p: number): MascotMood {
  if (p >= 60) return "happy";
  if (p >= 40) return "wink";
  if (p >= 20) return "sus";
  return "laughing";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const vibrate = (ms: number) => {
  try { navigator.vibrate?.(ms); } catch { /* pas grave */ }
};
// Sons du jeu (vrais samples, coupure globale gérée par sfx.ts)
const SFX = {
  yes: () => playSfx("pop", { volume: 0.8, rate: 0.9 }),
  no: () => playSfx("pop2", { volume: 0.6, rate: 1.15 }),
  tick: () => playSfx("tick", { volume: 0.4, rate: 1.1 }),
  drum: () => playCombo("drumroll"),
  reveal: () => playCombo("reveal"),
  pure: () => playSfx("success", { volume: 0.8 }),
  demon: () => { playSfx("gong", { volume: 0.7, rate: 0.85 }); playSfx("lose", { volume: 0.5, delay: 0.1 }); },
  fanfare: () => playCombo("fanfare"),
};
const PURETE_SFX = ["pop", "pop2", "tick", "tock", "success", "gong", "lose", "whoosh", "win", "powerup", "ding"] as const;

interface Question { text: string; pack: PackId }
type Mode = "solo" | "secret" | "groupe";

type Phase =
  | { k: "setup" }
  | { k: "players" }
  | { k: "pass"; p: number }
  | { k: "answer"; p: number; q: number }
  | { k: "allset" }
  | { k: "group"; q: number }
  | { k: "suspense"; i: number }
  | { k: "results" };

interface Revelation { text: string; yes: number; total: number; who: number[] | null }

// Choisit 3-4 révélations croustillantes dans les réponses
function buildRevelations(questions: Question[], counts: number[], total: number, whoByQ: number[][] | null): Revelation[] {
  if (total < 2) return [];
  const scored = questions.map((q, i) => {
    const k = counts[i];
    let score: number;
    if (k === 1 && total >= 3) score = 5;
    else if (k === total) score = 4;
    else if (k === 0) score = 0.5;
    else score = 3 - Math.abs(k / total - 0.5) * 2;
    if (q.pack === "coquin") score += 0.6;
    else if (q.pack === "soiree") score += 0.3;
    return { i, k, score: score + Math.random() * 0.8 };
  });
  scored.sort((a, b) => b.score - a.score);
  const out: Revelation[] = [];
  let solo = 0, zero = 0, all = 0;
  for (const s of scored) {
    if (out.length >= 4) break;
    if (s.k === 1 && total >= 3) { if (solo >= 2) continue; solo++; }
    if (s.k === 0) { if (zero >= 1) continue; zero++; }
    if (s.k === total) { if (all >= 1) continue; all++; }
    out.push({ text: questions[s.i].text, yes: s.k, total, who: whoByQ ? whoByQ[s.i] : null });
  }
  return out;
}

// ── Compteur à suspense : défile de 100 % jusqu'à la cible ──
function useCountdown(target: number, run: boolean, dur = 2600) {
  const [v, setV] = useState(100);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let last = 100;
    const t0 = performance.now();
    const tick = (now: number) => {
      const x = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - x, 4); // ralentit à la fin : suspense
      const val = Math.round(100 - (100 - target) * e);
      if (val !== last) {
        last = val;
        if (val % 5 === 0) SFX.tick();
      }
      setV(val);
      if (x < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, dur]);
  return { v, done };
}

// ── Blob avec auréole (pur) ou cornes (pas pur) ──
function PureBlob({ color, purity, size = 120, show = true, cheering = false }: { color: MascotColor; purity: number; size?: number; show?: boolean; cheering?: boolean }) {
  const halo = show && purity >= 60;
  const horns = show && purity < 40;
  const s = size;
  return (
    <div style={{ position: "relative", width: s, height: s * 1.15, animation: "pur-bob 2.4s ease-in-out infinite" }}>
      {horns && (
        <>
          <div className="pur-pop" style={{ position: "absolute", top: -s * 0.06, left: s * 0.14, width: s * 0.22, height: s * 0.32, zIndex: 0, transform: "rotate(-18deg)", filter: `drop-shadow(3px 3px 0 ${INK})` }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #FF2D2D, #A0101E)", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
          </div>
          <div className="pur-pop" style={{ position: "absolute", top: -s * 0.06, right: s * 0.14, width: s * 0.22, height: s * 0.32, zIndex: 0, transform: "rotate(18deg)", filter: `drop-shadow(3px 3px 0 ${INK})` }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #FF2D2D, #A0101E)", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
          </div>
        </>
      )}
      <Mascot size={s} color={color} mood={show ? moodFor(purity) : "neutral"} bob={false} arms cheering={cheering} sparkle={show && purity >= 80} />
      {halo && (
        <div className="pur-halo" style={{
          position: "absolute", top: -s * 0.1, left: "50%", width: s * 0.62, height: s * 0.17, marginLeft: -s * 0.31,
          border: `${Math.max(4, s * 0.055)}px solid #FFE36B`, borderRadius: "50%", zIndex: 5,
          boxShadow: `0 0 16px rgba(255,227,107,0.9), 3px 3px 0 ${INK}`,
        }} />
      )}
    </div>
  );
}

// ── Bouton plein à contour épais ──
function Btn({ children, onClick, bg = YELLOW, color = INK, disabled, className = "", style, ariaLabel }: {
  children: ReactNode; onClick: () => void; bg?: string; color?: string; disabled?: boolean; className?: string; style?: CSSProperties; ariaLabel?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}
      className={`pur-btn min-h-[52px] px-5 text-lg disabled:opacity-40 ${className}`}
      style={{ ...block(bg, 18, 4), color, ...DISPLAY, ...style }}>
      {children}
    </button>
  );
}

function Toggle({ on, onChange, label, sub, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onChange(!on)} disabled={disabled}
      className="pur-btn flex w-full items-center gap-3 p-3 text-left disabled:opacity-45"
      style={{ ...block(CREAM, 18, 4) }} role="switch" aria-checked={on}>
      <div className="min-w-0 flex-1">
        <div className="text-[17px]" style={DISPLAY}>{label}</div>
        {sub && <div className="text-balance text-[13px] font-medium leading-snug" style={{ color: "#4A3A66" }}>{sub}</div>}
      </div>
      <div style={{ width: 54, height: 32, borderRadius: 999, border: `3px solid ${INK}`, background: on ? MINT : "#D9D2E6", position: "relative", flexShrink: 0, transition: "background .2s" }}>
        <div style={{ position: "absolute", top: 2, left: on ? 24 : 2, width: 22, height: 22, borderRadius: 999, background: "#fff", border: `3px solid ${INK}`, transition: "left .2s cubic-bezier(.4,1.6,.5,1)" }} />
      </div>
    </button>
  );
}

// ── Règles (bouton i) + son ──
const RULES = [
  "Une question « As-tu déjà… ? ». Réponds Oui ou Jamais.",
  "Chaque oui fait baisser ta pureté. 100 % = ange, 0 % = démon.",
  "À plusieurs, on se passe le tél en secret… ou on répond ensemble, main levée.",
  "Grande révélation à la fin. Personne n'est obligé de tout raconter !",
];
function RulesButton() {
  return <TopRightControls title="Test de pureté" rules={RULES} accent={CREAM} />;
}

// ── Écran plein, fond uni ──
function Screen({ bg, children, center }: { bg: string; children: ReactNode; center?: boolean }) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center overflow-x-hidden"
      style={{
        background: bg, color: INK, transition: "background .35s",
        justifyContent: center ? "center" : "flex-start",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
        paddingLeft: 18, paddingRight: 18,
      }}>
      <style>{CSS}</style>
      {children}
    </div>
  );
}

const CSS = `
@keyframes pur-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes pur-halo { 0%,100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-5px) rotate(3deg) } }
@keyframes pur-pop-k { 0% { transform: scale(0); opacity: 0 } 70% { transform: scale(1.25) } 100% { transform: scale(1); opacity: 1 } }
@keyframes pur-rise-k { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes pur-slam-k { 0% { transform: scale(2.4) rotate(-8deg); opacity: 0 } 60% { transform: scale(.92) rotate(2deg); opacity: 1 } 100% { transform: scale(1) rotate(-2deg) } }
@keyframes pur-shake-k { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-6px) rotate(-1deg) } 40% { transform: translateX(6px) rotate(1deg) } 60% { transform: translateX(-4px) } 80% { transform: translateX(4px) } }
@keyframes pur-card-k { from { transform: translateY(30px) rotate(3deg) scale(.94); opacity: 0 } to { transform: none; opacity: 1 } }
.pur-halo { animation: pur-halo 2.2s ease-in-out infinite, pur-pop-k .5s cubic-bezier(.3,1.6,.5,1) both; }
.pur-pop { animation: pur-pop-k .45s cubic-bezier(.3,1.6,.5,1) both; }
.pur-rise { animation: pur-rise-k .4s cubic-bezier(.2,1.2,.4,1) both; }
.pur-slam { animation: pur-slam-k .55s cubic-bezier(.3,1.4,.5,1) both; }
.pur-shake { animation: pur-shake-k .5s ease-in-out infinite; }
.pur-card { animation: pur-card-k .38s cubic-bezier(.2,1.3,.4,1) both; }
.pur-btn { transition: transform .08s, box-shadow .08s; -webkit-tap-highlight-color: transparent; }
.pur-btn:not(:disabled):active { transform: translateY(3px); box-shadow: 0 1px 0 ${INK} !important; }
`;

// ── Écran de question (commun aux 2 modes) ──
function QuestionCard({ text, index, total, k }: { text: string; index: number; total: number; k: string }) {
  return (
    <div key={k} className="pur-card w-full max-w-md p-5" style={block("#fff", 26, 6)}>
      <div className="flex items-center justify-between text-[14px] font-bold" style={{ color: "#5A4A78" }}>
        <span>Question {index + 1} / {total}</span>
        <span>{total - index - 1 === 0 ? "Dernière !" : `encore ${total - index - 1}`}</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full" style={{ border: `2px solid ${INK}`, background: "#EEE8F7" }}>
        <div style={{ width: `${((index + 1) / total) * 100}%`, height: "100%", background: VIOLET, transition: "width .3s" }} />
      </div>
      <p className="mt-4 break-words text-[clamp(26px,7.6vw,38px)] leading-[1.06]" style={DISPLAY}>{text}</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
export default function PureteGame({ onReturnToLobby }: GameProps) {
  // Réglages
  const [mode, setMode] = useState<Mode>("secret");
  const [packs, setPacks] = useState<Record<PackId, boolean>>({ soft: true, soiree: true, coquin: false });
  const [count, setCount] = useState<20 | 40 | 60>(20);
  const [anonymous, setAnonymous] = useState(true);
  const [withNames, setWithNames] = useState(true);
  const [tableSize, setTableSize] = useState(5);
  const [peines, setPeines] = useState(false);

  // Partie
  const [phase, setPhase] = useState<Phase>({ k: "setup" });
  const [players, setPlayers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<boolean[][]>([]); // [joueur][question]
  const [counts, setCounts] = useState<number[]>([]); // mode groupe sans prénoms
  const [flash, setFlash] = useState<null | "oui" | "non">(null);
  const used = useRef<Set<string>>(new Set());
  const busy = useRef(false);

  const selected = (Object.keys(packs) as PackId[]).filter((p) => packs[p]);
  const pool = selected.reduce((n, p) => n + QUESTION_PACKS[p].length, 0);
  const anonymousMode = !withNames && mode === "groupe";

  // Pioche des questions en évitant celles déjà vues dans la session
  const drawDeck = (): Question[] => {
    const all: Question[] = selected.flatMap((p) => QUESTION_PACKS[p].map((text) => ({ text, pack: p })));
    let fresh = all.filter((q) => !used.current.has(q.text));
    if (fresh.length < count) { used.current.clear(); fresh = all; }
    const deck = shuffle(fresh).slice(0, Math.min(count, fresh.length));
    deck.forEach((q) => used.current.add(q.text));
    return deck;
  };

  useEffect(() => {
    preloadSfx([...PURETE_SFX]);
  }, []);

  // « Pas fou ? Une autre » : remplace la question q par une jamais vue (personne n'y a encore répondu)
  const rerollQuestion = (q: number) => {
    const all: Question[] = selected.flatMap((p) => QUESTION_PACKS[p].map((text) => ({ text, pack: p })));
    const inDeck = new Set(questions.map((x) => x.text));
    let fresh = all.filter((x) => !inDeck.has(x.text) && !used.current.has(x.text));
    if (!fresh.length) fresh = all.filter((x) => !inDeck.has(x.text));
    if (!fresh.length) return;
    const nq = fresh[Math.floor(Math.random() * fresh.length)];
    used.current.add(nq.text);
    setQuestions((prev) => prev.map((x, i) => (i === q ? nq : x)));
    setAnswers((prev) => prev.map((row) => row.map((v, i) => (i === q ? false : v))));
    setCounts((prev) => prev.map((c, i) => (i === q ? 0 : c)));
  };

  const startGame = (names: string[]) => {
    const deck = drawDeck();
    setPlayers(names);
    setQuestions(deck);
    setAnswers(names.map(() => deck.map(() => false)));
    setCounts(deck.map(() => 0));
    if (mode === "solo") setPhase({ k: "answer", p: 0, q: 0 });
    else if (mode === "secret") setPhase({ k: "pass", p: 0 });
    else setPhase({ k: "group", q: 0 });
  };

  // Scores
  const nbPlayers = anonymousMode ? tableSize : players.length;
  const yesCounts = useMemo(
    () => (anonymousMode ? counts : questions.map((_, qi) => answers.reduce((n, a) => n + (a[qi] ? 1 : 0), 0))),
    [anonymousMode, counts, questions, answers],
  );
  const purities = useMemo(
    () => answers.map((a) => (questions.length ? Math.round(100 * (1 - a.filter(Boolean).length / questions.length)) : 100)),
    [answers, questions],
  );
  const tablePurity = useMemo(() => {
    if (!questions.length || !nbPlayers) return 100;
    const yes = yesCounts.reduce((a, b) => a + b, 0);
    return Math.round(100 * (1 - yes / (questions.length * nbPlayers)));
  }, [yesCounts, questions, nbPlayers]);
  // Ordre de révélation : du plus pur au moins pur (le démon en dernier)
  const order = useMemo(() => players.map((_, i) => i).sort((a, b) => purities[b] - purities[a]), [players, purities]);

  // Révélations + gage tirés une fois, à l'arrivée sur les résultats
  const [revelations, setRevelations] = useState<Revelation[]>([]);
  const [gage, setGage] = useState(GAGES[0]);
  const goResults = () => {
    const showNames = !anonymousMode && !(mode === "secret" && anonymous);
    const who = showNames ? questions.map((_, qi) => players.map((_, pi) => pi).filter((pi) => answers[pi]?.[qi])) : null;
    setRevelations(mode === "solo" ? [] : buildRevelations(questions, yesCounts, nbPlayers, who));
    setGage(GAGES[Math.floor(Math.random() * GAGES.length)]);
    setPhase({ k: "results" });
  };

  // ── Réponse en mode secret ──
  const answer = (p: number, q: number, yes: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setAnswers((prev) => prev.map((row, pi) => (pi === p ? row.map((v, qi) => (qi === q ? yes : v)) : row)));
    setFlash(yes ? "oui" : "non");
    if (yes) SFX.yes(); else SFX.no();
    vibrate(yes ? 30 : 10);
    window.setTimeout(() => {
      setFlash(null);
      busy.current = false;
      if (q + 1 < questions.length) setPhase({ k: "answer", p, q: q + 1 });
      else if (p + 1 < players.length) setPhase({ k: "pass", p: p + 1 });
      else setPhase({ k: "allset" });
    }, 380);
  };

  const replay = () => startGame(players);
  const changePlayers = () => setPhase(anonymousMode ? { k: "setup" } : { k: "players" });

  // ═══ SETUP ═══
  if (phase.k === "setup") {
    const canGo = selected.length > 0;
    const goNext = () => {
      if (!canGo) return;
      if (mode === "groupe" && !withNames) startGame([]);
      // Solo : pas de saisie, on joue direct
      else if (mode === "solo") startGame(["Toi"]);
      else setPhase({ k: "players" });
    };
    return (
      <Screen bg={VIOLET}>
        <RulesButton />
        <div className="flex items-end gap-1">
          <PureBlob color="white" purity={100} size={78} />
          <PureBlob color="coral" purity={0} size={78} />
        </div>
        <h1 className="mt-2 text-center text-[clamp(44px,13vw,64px)] leading-[0.9] text-white" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
          Test de<br />pureté
        </h1>
        <p className="mt-3 max-w-sm text-center text-[16px] font-medium text-white/85">
          Plus tu dis oui, moins tu es pur. Qui est l&apos;ange de la table… et qui est le démon ?
        </p>

        <div className="mt-6 w-full max-w-md space-y-5">
          {/* Mode */}
          <div className="grid grid-cols-2 gap-3">
            {([
              ["secret", EyeOff, "Chacun son tour", "En secret, on se passe le tél"],
              ["groupe", Hand, "Tous ensemble", "À voix haute, main levée"],
              ["solo", User, "Solo", "Rien que toi : découvre ton score"],
            ] as const).map(([m, e, l, s]) => (
              <button key={m} onClick={() => setMode(m)} className={`pur-btn flex gap-1 p-3.5 text-left ${m === "solo" ? "col-span-2 flex-row items-center gap-3" : "flex-col items-start"}`}
                style={{ ...block(mode === m ? YELLOW : CREAM, 20, mode === m ? 5 : 3), transform: mode === m ? "rotate(-1.5deg)" : undefined }}>
                <GameIconBadge icon={e} />
                <span className="flex flex-col gap-1">
                  <span className="text-[19px] leading-tight" style={DISPLAY}>{l}</span>
                  <span className="text-[13px] font-medium leading-snug" style={{ color: "#4A3A66" }}>{s}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Packs */}
          <div>
            <h2 className="mb-2 text-[22px] text-white" style={DISPLAY}>Les questions</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(PACK_INFO) as PackId[]).map((p) => {
                const info = PACK_INFO[p];
                const on = packs[p];
                return (
                  <button key={p} onClick={() => setPacks((x) => ({ ...x, [p]: !x[p] }))} aria-pressed={on}
                    className="pur-btn relative flex flex-col items-center gap-0.5 px-1.5 py-3"
                    style={{ ...block(on ? info.color : "#CFC6E3", 18, on ? 4 : 2), opacity: on ? 1 : 0.75 }}>
                    {on && <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[13px] text-white" style={{ background: INK }}>✓</span>}
                    <GameIconBadge icon={info.icon} size={34} />
                    <span className="text-[17px]" style={DISPLAY}>{info.label}</span>
                    <span className="text-center text-[12px] font-semibold leading-tight">{info.tag}</span>
                  </button>
                );
              })}
            </div>
            {!canGo && <p className="mt-2 text-[13px] font-semibold text-white">Coche au moins un pack.</p>}
          </div>

          {/* Nombre de questions */}
          <div>
            <h2 className="mb-2 text-[22px] text-white" style={DISPLAY}>Combien de questions ?</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {([20, 40, 60] as const).map((n) => (
                <button key={n} onClick={() => setCount(n)} className="pur-btn min-h-[52px] text-[24px]"
                  style={{ ...block(count === n ? MINT : CREAM, 16, count === n ? 4 : 2), ...DISPLAY }}>
                  {n}
                </button>
              ))}
            </div>
            {canGo && pool < count && <p className="mt-2 text-[13px] font-semibold text-white">Seulement {pool} questions dans ces packs : on jouera avec toutes.</p>}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {mode === "solo" ? null : mode === "secret" ? (
              <Toggle on={anonymous} onChange={setAnonymous} label="Révélations anonymes" sub="« 3 personnes sur 5 ont déjà… » sans dire qui" />
            ) : (
              <Toggle on={withNames} onChange={setWithNames} label="Avec les prénoms" sub="Pour avoir le score de chacun. Sinon, on compte juste les mains." />
            )}
            {mode === "groupe" && !withNames && (
              <div className="flex items-center gap-3 p-3" style={block(CREAM, 18, 4)}>
                <div className="flex-1 text-[17px]" style={DISPLAY}>Vous êtes combien&nbsp;?</div>
                <button onClick={() => setTableSize((n) => Math.max(2, n - 1))} aria-label="Moins" className="pur-btn h-11 w-11 text-2xl" style={{ ...block("#fff", 999, 2), ...DISPLAY }}>−</button>
                <span className="w-8 text-center text-[26px]" style={DISPLAY}>{tableSize}</span>
                <button onClick={() => setTableSize((n) => Math.min(30, n + 1))} aria-label="Plus" className="pur-btn h-11 w-11 text-2xl" style={{ ...block(YELLOW, 999, 2), ...DISPLAY }}>+</button>
              </div>
            )}
            {mode !== "solo" && <Toggle on={peines && !anonymousMode} onChange={setPeines} disabled={anonymousMode}
              label="Peines pour le moins pur"
              sub={anonymousMode ? "Il faut les prénoms pour savoir qui est le moins pur." : "Un gage, ou 1 à 3 gorgées de zinzin"} />}
          </div>

          <Btn onClick={goNext} disabled={!canGo} bg={PINK} color="#fff" className="w-full text-[22px]" style={{ minHeight: 60 }}>
            {(mode === "groupe" && !withNames) || mode === "solo" ? "C'est parti !" : "Qui joue ?"}
          </Btn>
          <div className="flex justify-center pt-1">
            <IdeaButton game="Test de pureté" kind="question" bg={CREAM} />
          </div>
        </div>
      </Screen>
    );
  }

  // ═══ JOUEURS ═══ (saisie partagée du kit, prénoms mémorisés)
  if (phase.k === "players") {
    return (
      <PlayersSetup emoji="😇" name="Test de pureté" min={2} max={12} accent={PINK}
        onStart={startGame} onBack={() => setPhase({ k: "setup" })} />
    );
  }

  // ═══ PASSE LE TÉL ═══
  if (phase.k === "pass") {
    return (
      <PassScreen toName={players[phase.p]} colorIndex={phase.p} accent={PINK}
        hint={`${questions.length} questions, réponds en secret. Personne ne regarde !`}
        buttonLabel="C'est moi, je réponds"
        onReady={() => setPhase({ k: "answer", p: phase.p, q: 0 })} />
    );
  }

  // ═══ RÉPONSES SECRÈTES ═══
  if (phase.k === "answer") {
    const { p, q } = phase;
    const bg = FLASHY[q % FLASHY.length];
    return (
      <Screen bg={bg}>
        <RulesButton />
        <div className="mb-3 flex w-full max-w-md items-center gap-3">
          <div style={{ transform: flash === "oui" ? "rotate(-8deg) scale(1.08)" : flash === "non" ? "translateY(-6px)" : undefined, transition: "transform .2s" }}>
            <PureBlob color={colorForIndex(p)} purity={flash === "oui" ? 0 : flash === "non" ? 100 : 50} size={72} show={flash !== null} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[28px] leading-none" style={DISPLAY}>{players[p]}</div>
            <div className="mt-1 text-[15px] font-bold" style={{ color: "#3A2A58" }}>{mode === "solo" ? "Réponds franchement" : "Réponds en secret"}</div>
          </div>
        </div>

        <QuestionCard k={`${p}-${q}-${questions[q].text}`} text={questions[q].text} index={q} total={questions.length} />
        {(mode === "solo" || p === 0) && (
          <div className="mt-4">
            <RerollButton onClick={() => rerollQuestion(q)} />
          </div>
        )}

        <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-3">
          <Btn onClick={() => answer(p, q, true)} bg={RED} color="#fff" className="text-[26px]" style={{ minHeight: 92, borderRadius: 24 }}>
            Oui
          </Btn>
          <Btn onClick={() => answer(p, q, false)} bg="#fff" className="text-[26px]" style={{ minHeight: 92, borderRadius: 24 }}>
            Jamais
          </Btn>
        </div>

        <div className="mt-auto flex w-full max-w-md items-center justify-between pt-5 text-[14px] font-bold">
          {q > 0 ? (
            <button onClick={() => setPhase({ k: "answer", p, q: q - 1 })} className="min-h-11 px-1" style={{ color: INK }}><GameInlineIcon icon={ArrowLeft} /> Question précédente</button>
          ) : <span />}
          <span className="rounded-full px-3 py-1.5" style={{ background: INK, color: "#fff" }}>Score caché</span>
        </div>
      </Screen>
    );
  }

  // ═══ TOUT LE MONDE A RÉPONDU ═══
  if (phase.k === "allset") {
    return (
      <Screen bg={YELLOW} center>
        <RulesButton />
        <div className="flex items-end gap-2">
          {players.slice(0, 5).map((_, i) => (
            <PureBlob key={i} color={colorForIndex(i)} purity={50} size={58} show={false} />
          ))}
        </div>
        {mode === "solo" ? (
          <>
            <h1 className="mt-4 text-center text-[clamp(40px,12vw,58px)] leading-[0.92]" style={DISPLAY}>C&apos;est fini !</h1>
            <p className="mt-3 max-w-xs text-center text-[17px] font-semibold">Ange ou démon ? Prépare-toi à assumer.</p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-center text-[clamp(40px,12vw,58px)] leading-[0.92]" style={DISPLAY}>Tout le monde<br />a répondu !</h1>
            <p className="mt-3 max-w-xs text-center text-[17px] font-semibold">Posez le téléphone au milieu de la table. L&apos;heure de vérité a sonné.</p>
          </>
        )}
        <Btn onClick={() => { SFX.reveal(); setPhase({ k: "suspense", i: 0 }); }} bg={PINK} color="#fff" className="mt-8 w-full max-w-xs text-[24px]" style={{ minHeight: 64 }}>
          Révéler
        </Btn>
      </Screen>
    );
  }

  // ═══ MODE TOUS ENSEMBLE ═══
  if (phase.k === "group") {
    const { q } = phase;
    const bg = FLASHY[q % FLASHY.length];
    const k = anonymousMode ? counts[q] : answers.reduce((n, a) => n + (a[q] ? 1 : 0), 0);
    const pct = nbPlayers ? Math.round((k / nbPlayers) * 100) : 0;
    const last = q + 1 >= questions.length;
    const togglePlayer = (pi: number) => {
      SFX.yes();
      vibrate(12);
      setAnswers((prev) => prev.map((row, i) => (i === pi ? row.map((v, qi) => (qi === q ? !v : v)) : row)));
    };
    const bump = (d: 1 | -1) => {
      if (d > 0) SFX.yes(); else SFX.no();
      setCounts((prev) => prev.map((c, i) => (i === q ? Math.max(0, Math.min(nbPlayers, c + d)) : c)));
    };
    return (
      <Screen bg={bg}>
        <RulesButton />
        <QuestionCard k={`g-${q}-${questions[q].text}`} text={questions[q].text} index={q} total={questions.length} />
        {k === 0 && (
          <div className="mt-4">
            <RerollButton onClick={() => rerollQuestion(q)} />
          </div>
        )}

        <div className="mt-4 w-full max-w-md p-4" style={block(CREAM, 24, 5)}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[19px] leading-tight" style={DISPLAY}>
              {anonymousMode ? "Combien ont dit oui ?" : "Qui l'a déjà fait ? Touchez les prénoms"}
            </span>
            <span className="shrink-0 rounded-full px-3 py-1 text-[18px]" style={{ ...DISPLAY, background: k ? RED : INK, color: "#fff" }}>{k} / {nbPlayers}</span>
          </div>

          {anonymousMode ? (
            <div className="mt-3 flex items-center justify-center gap-5">
              <button onClick={() => bump(-1)} disabled={k === 0} aria-label="Un oui de moins" className="pur-btn h-16 w-16 text-4xl disabled:opacity-40" style={{ ...block("#fff", 999, 3), ...DISPLAY }}>−</button>
              <span key={k} className="pur-pop w-20 text-center text-[64px] leading-none" style={DISPLAY}>{k}</span>
              <button onClick={() => bump(1)} disabled={k >= nbPlayers} aria-label="Un oui de plus" className="pur-btn h-16 w-16 text-4xl disabled:opacity-40" style={{ ...block(RED, 999, 3), color: "#fff", ...DISPLAY }}>+</button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {players.map((name, pi) => {
                const on = answers[pi][q];
                return (
                  <button key={pi} onClick={() => togglePlayer(pi)} aria-pressed={on}
                    className="pur-btn flex min-h-[48px] items-center gap-2 py-1.5 pl-1.5 pr-3.5 text-[17px]"
                    style={{ ...block(on ? RED : "#fff", 999, on ? 3 : 2), color: on ? "#fff" : INK, ...DISPLAY }}>
                    <MascotAvatar color={colorForIndex(pi)} size={34} mood={on ? "sus" : "happy"} border={false} />
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3 h-4 w-full overflow-hidden rounded-full" style={{ border: `2px solid ${INK}`, background: "#fff" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: RED, transition: "width .35s cubic-bezier(.4,1.4,.5,1)" }} />
          </div>
          <p className="mt-1.5 text-[14px] font-bold">
            {k === 0 ? "Que des anges pour l'instant…" : k === nbPlayers ? "Toute la table ! Aucune honte." : `${pct} % de la table a déjà craqué`}
          </p>
        </div>

        <div className="mt-auto flex w-full max-w-md items-center gap-3 pt-5">
          {q > 0 && (
            <Btn onClick={() => setPhase({ k: "group", q: q - 1 })} bg="#fff" className="px-4" ariaLabel="Question précédente"><ArrowLeft size={24} strokeWidth={3} aria-hidden /></Btn>
          )}
          <Btn onClick={() => {
            if (last) { SFX.reveal(); setPhase({ k: "suspense", i: 0 }); }
            else setPhase({ k: "group", q: q + 1 });
          }} bg={INK} color="#fff" className="flex-1 text-[21px]" style={{ minHeight: 60 }}>
            {last ? "Voir les résultats" : "Question suivante"}
          </Btn>
        </div>
      </Screen>
    );
  }

  // ═══ RÉVÉLATION À SUSPENSE ═══
  if (phase.k === "suspense") {
    if (anonymousMode) {
      return <SuspenseReveal key="table" label="La table est pure à…" name="Toute la table" color="lavender" purity={tablePurity}
        last onNext={goResults} />;
    }
    const pi = order[phase.i];
    const isLast = phase.i === order.length - 1;
    const label = mode === "solo" ? "Ton score de pureté…" : isLast ? "Et le moins pur de la table est…" : phase.i === 0 ? "Le plus pur de la table…" : `Révélation ${phase.i + 1} / ${order.length}`;
    return <SuspenseReveal key={phase.i} label={label} name={mode === "solo" ? undefined : players[pi]} color={colorForIndex(pi)} purity={purities[pi]} last={isLast}
      nextLabel={mode === "solo" ? "Voir mon verdict" : undefined}
      onNext={() => (isLast ? goResults() : setPhase({ k: "suspense", i: phase.i + 1 }))} />;
  }

  // ═══ RÉSULTATS ═══
  const minP = purities.length ? Math.min(...purities) : 100;
  const losers = players.map((n, i) => ({ n, i })).filter((x) => purities[x.i] === minP);
  const gorgees = minP < 20 ? 3 : minP < 50 ? 2 : 1;
  const tt = titleFor(tablePurity);

  return (
    <Screen bg={VIOLET}>
      <RulesButton />
      <h1 className="text-center text-[clamp(38px,11vw,54px)] leading-[0.92] text-white" style={{ ...DISPLAY, textShadow: `4px 4px 0 ${INK}` }}>
        {anonymousMode ? "Bilan de la table" : mode === "solo" ? "Ton verdict" : "Classement de pureté"}
      </h1>

      <div className="mt-5 w-full max-w-md space-y-3">
        {mode === "solo" ? (
          <SoloVerdict purity={purities[0] ?? 100} confessions={questions.filter((_, qi) => answers[0]?.[qi]).map((q) => q.text)} />
        ) : anonymousMode ? (
          <div className="pur-rise flex items-center gap-4 p-4" style={block(YELLOW, 24, 5)}>
            <PureBlob color="lavender" purity={tablePurity} size={84} />
            <div>
              <div className="text-[52px] leading-none" style={DISPLAY}>{tablePurity} %</div>
              <div className="text-[19px] leading-tight" style={DISPLAY}>{tt.title}</div>
            </div>
          </div>
        ) : (
          order.map((pi, rank) => {
            const pur = purities[pi];
            const t = titleFor(pur);
            const c = MASCOT_PALETTE[colorForIndex(pi)].body;
            return (
              <div key={pi} className="pur-rise flex items-center gap-3 p-3" style={{ ...block(rank === 0 ? YELLOW : CREAM, 20, 4), animationDelay: `${rank * 0.08}s` }}>
                <span className="w-7 text-center text-[24px]" style={DISPLAY}>{rank + 1}</span>
                <MascotAvatar color={colorForIndex(pi)} size={42} mood={moodFor(pur)} border={false} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[20px]" style={DISPLAY}>{players[pi]}</span>
                    <span className="shrink-0 text-[22px]" style={DISPLAY}>{pur} %</span>
                  </div>
                  <div className="mt-1 h-3.5 w-full overflow-hidden rounded-full" style={{ border: `2px solid ${INK}`, background: "#fff" }}>
                    <BarFill pct={pur} color={c} delay={rank * 0.12} />
                  </div>
                  <div className="mt-1 truncate text-[14px] font-bold">{t.title}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {revelations.length > 0 && (
        <div className="mt-7 w-full max-w-md">
          <h2 className="mb-3 text-[28px] text-white" style={{ ...DISPLAY, textShadow: `3px 3px 0 ${INK}` }}>Révélations</h2>
          <div className="space-y-3">
            {revelations.map((r, i) => (
              <div key={i} className="pur-rise p-4" style={{ ...block(FLASHY[(i + 2) % FLASHY.length], 22, 5), transform: `rotate(${i % 2 ? 1 : -1}deg)`, animationDelay: `${0.3 + i * 0.1}s` }}>
                <p className="text-[16px] font-semibold leading-snug">« {r.text} »</p>
                <p className="mt-2 text-[24px] leading-tight" style={DISPLAY}>{revelationLine(r, players)}</p>
                {r.who && r.yes > 1 && r.yes < r.total && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.who.map((pi) => (
                      <span key={pi} className="rounded-full px-2.5 py-1 text-[14px] font-bold" style={{ background: INK, color: "#fff" }}>{players[pi]}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {peines && mode !== "solo" && !anonymousMode && losers.length > 0 && (
        <div className="pur-rise mt-7 w-full max-w-md p-4" style={block(RED, 24, 5)}>
          <div className="flex items-center gap-3">
            <PureBlob color={colorForIndex(losers[0].i)} purity={0} size={64} />
            <div className="min-w-0 text-white">
              <div className="text-[15px] font-bold">La peine du démon</div>
              <div className="text-[26px] leading-tight" style={DISPLAY}>{losers.map((l) => l.n).join(" & ")}</div>
            </div>
          </div>
          <p className="mt-3 rounded-2xl p-3 text-[17px] font-semibold leading-snug" style={{ background: "#fff", border: `3px solid ${INK}` }}>
            <GameInlineIcon icon={Target} /> {gage}
          </p>
          <p className="mt-2 text-[15px] font-bold text-white">
            Ou {gorgees} gorgée{gorgees > 1 ? "s" : ""} de zinzin, au choix.
          </p>
        </div>
      )}

      <div className="mt-8 grid w-full max-w-md gap-3">
        <Btn onClick={replay} bg={YELLOW} className="text-[22px]" style={{ minHeight: 60 }}><GameInlineIcon icon={RotateCcw} /> Rejouer</Btn>
        <div className="grid grid-cols-2 gap-3">
          <Btn onClick={mode === "solo" ? () => setPhase({ k: "setup" }) : changePlayers} bg={CREAM} className="text-[16px] leading-tight">{mode === "solo" ? "Jouer à plusieurs" : "Changer les joueurs"}</Btn>
          <Btn onClick={() => (onReturnToLobby ? onReturnToLobby() : setPhase({ k: "setup" }))} bg={INK} color="#fff" className="text-[16px] leading-tight">Quitter</Btn>
        </div>
        <div className="flex justify-center pt-1">
          <IdeaButton game="Test de pureté" kind="question" bg={CREAM} />
        </div>
      </div>
    </Screen>
  );
}

function revelationLine(r: Revelation, players: string[]): string {
  if (r.yes === 0) return "Personne n'a dit oui. Une table d'anges ?";
  if (r.yes === r.total) return "Toute la table a dit oui !";
  if (r.yes === 1) return r.who?.length ? `Une seule personne : ${players[r.who[0]]} !` : "Une seule personne a dit oui…";
  return `${r.yes} personnes sur ${r.total} ont dit oui`;
}

function BarFill({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW(pct), 120 + delay * 1000);
    return () => window.clearTimeout(t);
  }, [pct, delay]);
  return <div style={{ width: `${w}%`, height: "100%", background: color, borderRight: w > 0 && w < 100 ? `2px solid ${INK}` : undefined, transition: "width 1s cubic-bezier(.3,1.2,.5,1)" }} />;
}

// ── Un joueur : compteur qui défile jusqu'à son % ──
/** Mode solo : grosse carte « à capturer » + les aveux (questions où on a dit oui). */
function SoloVerdict({ purity, confessions }: { purity: number; confessions: string[] }) {
  const t = titleFor(purity);
  const pure = purity >= 50;
  const shown = confessions.slice(0, 5);
  return (
    <>
      <div className="pur-rise flex flex-col items-center p-5 text-center" style={{ ...block(pure ? YELLOW : RED, 28, 6), transform: "rotate(-1.5deg)" }}>
        <PureBlob color={pure ? "white" : "coral"} purity={purity} size={110} cheering={pure} />
        <div className="mt-3 text-[clamp(72px,22vw,104px)] leading-none" style={{ ...DISPLAY, color: pure ? INK : "#fff" }}>{purity} %</div>
        <div className="mt-2 text-[clamp(22px,7vw,30px)] leading-tight" style={{ ...DISPLAY, color: pure ? INK : "#fff" }}>{t.title}</div>
      </div>
      {shown.length > 0 && (
        <div className="pur-rise mt-6 p-4" style={{ ...block(CREAM, 22, 5), animationDelay: "0.15s" }}>
          <h2 className="text-[24px] leading-tight" style={DISPLAY}>Tes aveux</h2>
          <ul className="mt-2 space-y-2">
            {shown.map((c) => (
              <li key={c} className="text-[16px] font-semibold leading-snug">« {c} » <span style={{ color: RED }}>Oui.</span></li>
            ))}
          </ul>
          {confessions.length > shown.length && (
            <p className="mt-2 text-[14px] font-bold" style={{ color: "#4A3A66" }}>… et {confessions.length - shown.length} autre{confessions.length - shown.length > 1 ? "s" : ""}. On ne juge pas. Un peu.</p>
          )}
        </div>
      )}
    </>
  );
}

function SuspenseReveal({ label, name, color, purity, last, onNext, nextLabel = "Voir le classement" }: {
  label: string; name?: string; color: MascotColor; purity: number; last: boolean; onNext: () => void; nextLabel?: string;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => { setGo(true); SFX.drum(); }, 700);
    return () => window.clearTimeout(t);
  }, []);
  const { v, done } = useCountdown(purity, go, last ? 3600 : 2600);
  useEffect(() => {
    if (!done) return;
    vibrate(purity < 40 ? 120 : 40);
    if (purity >= 90) SFX.fanfare();
    else if (purity >= 50) SFX.pure();
    else SFX.demon();
  }, [done, purity]);
  const t = titleFor(purity);
  const pure = purity >= 50;
  const bg = done ? (pure ? "#8FD8FF" : RED) : YELLOW;
  return (
    <Screen bg={bg} center>
      <RulesButton />
      {done && purity >= 90 && <ConfettiBurst count={50} />}
      <p className="px-12 text-center text-[20px] leading-tight" style={{ ...DISPLAY, textWrap: "balance" }}>{label}</p>
      {name && <h1 className={`mt-1 max-w-full truncate text-center leading-none ${name.length > 11 ? "text-[clamp(30px,9vw,44px)]" : "text-[clamp(40px,12vw,60px)]"}`} style={{ ...DISPLAY, whiteSpace: "nowrap", color: done && !pure ? "#fff" : INK, textShadow: done && !pure ? `3px 3px 0 ${INK}` : undefined }}>{name}</h1>}
      <div className={`mt-6 ${!done && go ? "pur-shake" : ""}`}>
        <PureBlob key={done ? "d" : "w"} color={color} purity={purity} size={150} show={done} cheering={done && pure} />
      </div>
      <div className="mt-5 px-6 py-2" style={{ ...block("#fff", 26, 6), transform: "rotate(-2deg)" }}>
        <span className="text-[clamp(72px,24vw,112px)] leading-none tabular-nums" style={DISPLAY}>{v}{"\u00A0"}%</span>
      </div>
      <div className="mt-5 min-h-[86px] text-center">
        {done && (
          <div className="pur-slam inline-block px-5 py-3" style={block(pure ? YELLOW : INK, 20, 5)}>
            <span className="text-[clamp(24px,7.4vw,34px)] leading-tight" style={{ ...DISPLAY, color: pure ? INK : "#fff" }}>{t.title}</span>
          </div>
        )}
      </div>
      <div className="mt-6 h-[60px] w-full max-w-xs">
        {done && (
          <Btn onClick={onNext} bg={pure ? PINK : YELLOW} color={pure ? "#fff" : INK} className="pur-rise h-full w-full text-[21px]">
            {last ? nextLabel : "Suivant"}
          </Btn>
        )}
      </div>
    </Screen>
  );
}
