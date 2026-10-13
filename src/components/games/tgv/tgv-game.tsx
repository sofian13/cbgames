"use client";

/**
 * TGV — le « plus ou moins » à enchaîner, sur un seul téléphone.
 * Le joueur voit une carte et parie sur la suivante : plus haute, plus basse
 * ou égale. Il doit passer tous les tas (wagons) d'affilée. Raté = une peine
 * (gorgée plafonnée à 3, ou un gage) et retour au premier wagon.
 *
 * 100 % local, cartes dessinées en CSS (aucune image), vrai paquet de 52 mélangé.
 * DA « sticker » (couleurs pleines, contour encre, ombre dure) + vrais samples (sfx.ts).
 */

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PlayersSetup, PassScreen, colorForIndex } from "@/components/games/local-kit";
import { GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { isSfxMuted, playCombo, playSfx, preloadSfx, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import {
  ArrowDown, ArrowLeft, ArrowUp, Check, CupSoda, Dices, Equal, Flame, Home, RotateCcw, Siren, TrainFront,
  Volume2, VolumeX, X, type LucideIcon,
} from "lucide-react";

// ── DA sticker ────────────────────────────────────────────
const INK = "#15082E";
const ACCENT = "#FF6B5B"; // corail du train
const PAGE: CSSProperties = {
  backgroundColor: "#1E1250",
  backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px)",
  backgroundSize: "22px 22px",
};
const TOP = "calc(env(safe-area-inset-top, 0px) + 72px)";
const BOTTOM = "calc(env(safe-area-inset-bottom, 0px) + 16px)";
const DISPLAY: CSSProperties = { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, letterSpacing: "-0.03em", wordSpacing: "0.1em" };
const stk = (bg: string, shadow = 4, border = 3): CSSProperties => ({ background: bg, border: `${border}px solid ${INK}`, boxShadow: `0 ${shadow}px 0 ${INK}` });

/** Encre lisible sur un fond plein. */
function inkOn(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return INK;
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.22 ? INK : "#fff";
}

/** Bouton sticker qui s'enfonce dans son ombre à l'appui. */
function Push({
  bg, onClick, children, big, disabled, className = "", style, label,
}: { bg: string; onClick: () => void; children: ReactNode; big?: boolean; disabled?: boolean; className?: string; style?: CSSProperties; label?: string }) {
  const [down, setDown] = useState(false);
  const sh = big ? 6 : 4;
  const pressed = down && !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
      className={`flex items-center justify-center gap-2 rounded-full ${className}`}
      style={{
        ...stk(bg, pressed ? 1 : sh),
        color: inkOn(bg),
        minHeight: big ? 60 : 50,
        transform: pressed ? `translateY(${sh - 1}px)` : undefined,
        transition: "transform 110ms ease, box-shadow 110ms ease",
        opacity: disabled ? 0.55 : 1,
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        ...(big ? { ...DISPLAY, fontSize: 21, letterSpacing: "-0.01em" } : { fontSize: 16, fontWeight: 800 }),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Lien discret (actions secondaires). */
function TextLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="mx-auto flex min-h-11 items-center gap-1.5 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ color: "rgba(255,255,255,0.82)" }}>
      {children}
    </button>
  );
}

/** Bouton son (coupure globale partagée par toute l'app). */
function SoundToggle() {
  const muted = useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);
  return (
    <GameTopRight>
      <GameIconButton icon={muted ? VolumeX : Volume2} label={muted ? "Activer le son" : "Couper le son"} active={muted} onClick={() => setSfxMuted(!muted)} />
    </GameTopRight>
  );
}

/** Remet en haut le conteneur qui défile (l'app garde le scroll entre deux écrans). */
function ScrollTop({ dep }: { dep: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    for (let el = ref.current?.parentElement ?? null; el; el = el.parentElement) {
      if (el.scrollTop > 0) el.scrollTop = 0;
    }
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [dep]);
  return <span ref={ref} hidden />;
}

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R", "A"]; // valeur = index + 2
const RANK_NAMES: Record<string, string> = { V: "Valet", D: "Dame", R: "Roi", A: "As" };
const SUITS = [
  { s: "♠", red: false },
  { s: "♥", red: true },
  { s: "♦", red: true },
  { s: "♣", red: false },
];
interface Card {
  v: number;
  r: string;
  s: string;
  red: boolean;
}

function newDeck(): Card[] {
  const d: Card[] = [];
  RANKS.forEach((r, i) => SUITS.forEach((su) => d.push({ v: i + 2, r, s: su.s, red: su.red })));
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

const PILE_OPTIONS = [3, 4, 5, 6] as const;

// ── Peines : gorgées (max 3, toujours « ou un gage ») ou gages ──
type PenaltyMode = "mix" | "sips" | "gages";
const GAGES = [
  "Imite un animal choisi par la table",
  "Parle avec un accent jusqu'à ton prochain tour",
  "Fais 10 squats",
  "Fais un compliment à chaque joueur",
  "Chante un refrain choisi par la table",
  "Garde une grimace pendant un tour complet",
  "Danse 10 secondes sans musique",
  "Raconte ta pire honte en 20 secondes",
  "Parle à la 3e personne jusqu'à ton prochain tour",
  "Fais le présentateur météo de la soirée",
  "Tiens la planche 20 secondes",
  "Mime ton métier de rêve",
  "Fais un beatbox de 10 secondes",
  "Laisse la table choisir ton fond d'écran pour la soirée",
  "Fais une déclaration d'amour à un objet",
];
interface Penalty {
  kind: "sips" | "gage";
  sips: number;
  gage: string;
}
const pickGage = (exclude?: string) => {
  const pool = GAGES.filter((g) => g !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
};
function drawPenalty(mode: PenaltyMode, sips: number): Penalty {
  const kind = mode === "sips" ? "sips" : mode === "gages" ? "gage" : Math.random() < 0.5 ? "sips" : "gage";
  return { kind, sips: Math.min(3, Math.max(1, sips)), gage: pickGage() };
}

type Verdict = "win" | "loss" | "tie";
type Bet = "plus" | "moins" | "egal";

const KEYFRAMES = `
@keyframes tgv-flip { 0% { transform: rotateY(90deg) scale(.9); opacity: 0 } 100% { transform: rotateY(0) scale(1); opacity: 1 } }
@keyframes tgv-pop { 0% { transform: scale(.5); opacity: 0 } 70% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1) } }
@keyframes tgv-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 50% { transform: translateX(8px) } 75% { transform: translateX(-4px) } }
@keyframes tgv-wobble { 0%,100% { transform: rotate(-5deg) } 50% { transform: rotate(5deg) } }
`;

const vib = (p: number | number[]) => {
  try {
    navigator.vibrate?.(p);
  } catch {
    /* rien */
  }
};

// ──────────────────────────────────────────────────────────
export default function TgvGame({ onReturnToLobby }: GameProps) {
  type Phase = "setup" | "config" | "pass" | "play" | "win" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [losses, setLosses] = useState<number[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [numPiles, setNumPiles] = useState<number>(4);
  const [penaltyMode, setPenaltyMode] = useState<PenaltyMode>("mix");

  // Partie en cours
  const deckRef = useRef<Card[]>([]);
  const [pileIdx, setPileIdx] = useState(0);
  const [card, setCard] = useState<Card>(() => newDeck()[0]);
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [suspense, setSuspense] = useState(false);
  const [penalty, setPenalty] = useState<Penalty | null>(null);
  const [spin, setSpin] = useState<SpinFace | null>(null); // roulette en cours

  useEffect(() => {
    preloadSfx(["card-flip", "card-place", "success", "wrong", "lose", "twotone", "tick", "tock", "ding2", "win", "powerup", "ding", "whoosh", "toggle", "card-shuffle"]);
  }, []);

  const draw = (): Card => {
    if (!deckRef.current.length) deckRef.current = newDeck();
    return deckRef.current.pop()!;
  };

  // Roulette de la peine après un raté / une égalité non pariée.
  // Tous les timers sont nettoyés si on quitte l'écran en cours de route.
  useEffect(() => {
    if ((verdict !== "loss" && verdict !== "tie") || suspense) return;
    const sips = verdict === "tie" ? 1 : pileIdx + 1;
    const final = drawPenalty(penaltyMode, sips);
    const faces: SpinFace[] = ["sips", "gage", "sips", "hot"];
    let iv: ReturnType<typeof setInterval> | undefined;
    let ticks = 0;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        ticks++;
        setSpin(faces[ticks % faces.length]);
        if (ticks % 2 === 0) playSfx("tick", { volume: 0.5, rate: 0.9 + ticks * 0.03 });
        if (ticks >= 16) {
          clearInterval(iv);
          setSpin(null);
          setPenalty(final);
          playSfx("ding2", { volume: 0.8 });
          vib([150, 60, 150]);
        }
      }, 75);
    }, 900);
    return () => {
      clearTimeout(start);
      if (iv) clearInterval(iv);
    };
  }, [verdict, suspense, pileIdx, penaltyMode]);

  // Suspense sur la dernière carte du train (roulement de tambour)
  useEffect(() => {
    if (!suspense) return;
    playCombo("drumroll");
    const t = setTimeout(() => setSuspense(false), 1600);
    return () => clearTimeout(t);
  }, [suspense]);

  const currentName = players[currentIdx] ?? "";

  const startRun = () => {
    setPileIdx(0);
    setCard(draw());
    setNextCard(null);
    setVerdict(null);
    setPenalty(null);
    setSpin(null);
    playSfx("card-flip", { volume: 0.8 });
    setPhase("play");
  };

  const makeBet = (b: Bet) => {
    if (verdict || suspense) return;
    const next = draw();
    let v: Verdict;
    if (next.v === card.v) v = b === "egal" ? "win" : "tie";
    else if (b === "egal") v = "loss";
    else if (b === "plus") v = next.v > card.v ? "win" : "loss";
    else v = next.v < card.v ? "win" : "loss";
    setNextCard(next);
    if (pileIdx === numPiles - 1) setSuspense(true);
    setVerdict(v);
  };

  // Son + vibration au moment où la carte est vraiment révélée (après le suspense)
  useEffect(() => {
    if (!verdict || suspense) return;
    playSfx("card-flip", { volume: 0.8 });
    if (verdict === "win") {
      playSfx("success", { volume: 0.75, delay: 0.12 });
      vib(40);
    } else if (verdict === "tie") {
      playSfx("twotone", { volume: 0.7, delay: 0.12 });
    } else {
      playSfx("wrong", { volume: 0.8, delay: 0.12 });
      playSfx("lose", { volume: 0.5, delay: 0.2 });
    }
  }, [verdict, suspense]);

  const advanceAfterWin = () => {
    if (verdict !== "win" || !nextCard) return;
    if (pileIdx + 1 >= numPiles) {
      playCombo("fanfare");
      vib([80, 40, 80, 40, 220]);
      setPhase("win");
      return;
    }
    playSfx("card-place", { volume: 0.7 });
    setPileIdx(pileIdx + 1);
    setCard(nextCard);
    setNextCard(null);
    setVerdict(null);
  };

  // Après la peine : raté → retour au wagon 1 ; égalité → on reste sur le wagon
  const afterPenalty = () => {
    setLosses((prev) => prev.map((n, i) => (i === currentIdx ? n + 1 : n)));
    if (verdict === "loss") setPileIdx(0);
    setCard(nextCard ?? draw());
    setNextCard(null);
    setVerdict(null);
    setPenalty(null);
    playSfx("card-place", { volume: 0.7 });
  };

  // Le gage tombe mal : on en tire un autre (la peine reste la même)
  const rerollGage = () => setPenalty((p) => (p ? { ...p, kind: "gage", gage: pickGage(p.gage) } : p));

  const nextPlayer = () => {
    setCurrentIdx((currentIdx + 1) % players.length);
    playSfx("whoosh", { volume: 0.6 });
    setPhase("pass");
  };

  const endGame = () => { playSfx("win", { volume: 0.7 }); setPhase("over"); };

  // ── Écrans ─────────────────────────────────────────────
  const chrome = (
    <>
      <SoundToggle />
      <ScrollTop dep={phase} />
    </>
  );

  if (phase === "setup") {
    return (
      <>
        <PlayersSetup
          emoji="🚄"
          name="TGV"
          min={2}
          max={10}
          accent={ACCENT}
          onStart={(names) => {
            setPlayers(names);
            setLosses(names.map(() => 0));
            setCurrentIdx(0);
            setPhase("config");
          }}
        />
        {chrome}
      </>
    );
  }

  if (phase === "config") {
    const steps: { icon: LucideIcon; text: ReactNode }[] = [
      { icon: ArrowUp, text: <>Une carte est retournée : la suivante sera plus haute, plus basse ou égale&nbsp;?</> },
      { icon: TrainFront, text: <>Enchaîne tous les wagons sans te tromper pour arriver en gare.</> },
      { icon: CupSoda, text: <>Raté = une peine et retour au wagon 1. Plus tu tombes loin, plus elle grimpe (3 gorgées max, ou un gage).</> },
    ];
    return (
      <Page>
        {chrome}
        <div className="flex items-end justify-between gap-3">
          <h1 style={{ ...DISPLAY, fontSize: 64, lineHeight: 0.9 }}>TGV</h1>
          <Mascot size={70} color="coral" mood="cool" arms shadow={false} />
        </div>
        <ol className="mt-4 space-y-2.5 rounded-[24px] p-4" style={{ ...stk("#FFF6E5", 5), color: INK, transform: "rotate(-1deg)" }}>
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ ...stk(i === 1 ? "#FFD23F" : i === 2 ? "#FF3EA5" : ACCENT, 2, 2.5) }}>
                <s.icon size={18} strokeWidth={3} aria-hidden />
              </span>
              <span className="text-[15.5px] font-semibold leading-snug">{s.text}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-7" style={{ ...DISPLAY, fontSize: 28, lineHeight: 1 }}>Les wagons</h2>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {PILE_OPTIONS.map((n) => {
            const on = n === numPiles;
            return (
              <button
                key={n}
                type="button"
                onClick={() => { playSfx("toggle", { volume: 0.5 }); setNumPiles(n); }}
                aria-pressed={on}
                className="flex min-h-[74px] flex-col items-center justify-center rounded-[20px]"
                style={{ ...stk(on ? ACCENT : "#2B1B6E", on ? 4 : 0), color: on ? INK : "#fff" }}
              >
                <span style={{ ...DISPLAY, fontSize: 30, lineHeight: 1 }}>{n}</span>
                <span className="mt-0.5 text-[13px] font-bold">{n === 3 ? "express" : n === 4 ? "classique" : n === 5 ? "long" : "marathon"}</span>
              </button>
            );
          })}
        </div>

        <h2 className="mt-7" style={{ ...DISPLAY, fontSize: 28, lineHeight: 1 }}>La peine</h2>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {(
            [
              { v: "mix", icons: [CupSoda, Dices], label: "Mixte" },
              { v: "sips", icons: [CupSoda], label: "Gorgées" },
              { v: "gages", icons: [Dices], label: "Gages" },
            ] as { v: PenaltyMode; icons: LucideIcon[]; label: string }[]
          ).map((o) => {
            const on = o.v === penaltyMode;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => { playSfx("toggle", { volume: 0.5 }); setPenaltyMode(o.v); }}
                aria-pressed={on}
                className="flex min-h-[74px] flex-col items-center justify-center gap-1 rounded-[20px]"
                style={{ ...stk(on ? "#FFD23F" : "#2B1B6E", on ? 4 : 0), color: on ? INK : "#fff" }}
              >
                <span className="flex gap-1">{o.icons.map((I, k) => <I key={k} size={22} strokeWidth={2.8} aria-hidden />)}</span>
                <span className="text-[15px] font-extrabold">{o.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>
          Une gorgée, c&apos;est de ce que tu bois, eau et soft compris. On peut toujours prendre un gage à la place. 18+, avec modération, et jamais si tu conduis.
        </p>

        <div className="mt-5 flex justify-center"><IdeaButton game="TGV" kind="gage" /></div>

        <div className="min-h-6 flex-1" />
        <div className="sticky bottom-0 -mx-5 mt-4 px-5 pt-4" style={{ paddingBottom: BOTTOM, background: "linear-gradient(180deg, transparent, #1E1250 35%)" }}>
          <Push big bg={ACCENT} onClick={() => { playSfx("whoosh", { volume: 0.6 }); setCurrentIdx(0); setPhase("pass"); }} className="w-full">
            Lancer le train <TrainFront size={22} strokeWidth={3} aria-hidden />
          </Push>
          <TextLink onClick={() => setPhase("setup")}><ArrowLeft size={17} strokeWidth={3} aria-hidden /> Modifier les joueurs</TextLink>
        </div>
      </Page>
    );
  }

  if (phase === "pass") {
    return (
      <>
        <PassScreen
          toName={currentName}
          colorIndex={currentIdx}
          accent={ACCENT}
          hint={`À toi de monter dans le TGV : ${numPiles} wagons à enchaîner sans erreur.`}
          buttonLabel={<>Embarquer <GameInlineIcon icon={TrainFront} /></>}
          onReady={startRun}
        />
        {chrome}
      </>
    );
  }

  if (phase === "play") {
    const isLast = pileIdx === numPiles - 1;
    const revealed = verdict && !suspense;
    const sipsAtStake = Math.min(3, pileIdx + 1);
    return (
      <div className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
        <style>{KEYFRAMES}</style>
        {chrome}
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center">
          <div className="flex items-center gap-2 rounded-full py-1 pl-1 pr-4" style={{ ...stk("#fff", 3, 2.5), color: INK, transform: "rotate(-2deg)" }}>
            <MascotAvatar color={colorForIndex(currentIdx)} size={34} mood="wink" border={false} />
            <span style={{ ...DISPLAY, fontSize: 22, lineHeight: 1 }}>{currentName}</span>
          </div>
          <Train total={numPiles} pileIdx={pileIdx} cleared={verdict === "win" && revealed ? pileIdx + 1 : pileIdx} />
          <p className="mt-3 text-center text-[15px] font-bold" style={{ color: isLast ? "#FFD23F" : "rgba(255,255,255,0.85)" }}>
            {isLast ? <><GameInlineIcon icon={Siren} /> Dernier wagon !</> : `Wagon ${pileIdx + 1} sur ${numPiles}`} · en jeu : {sipsAtStake} gorgée{sipsAtStake > 1 ? "s" : ""} ou un gage
          </p>

          <div className="flex flex-1 items-center justify-center gap-4 py-5" style={{ perspective: 800 }}>
            <PlayingCard card={card} dim={!!nextCard && !suspense} />
            {nextCard && (suspense ? <MysteryCard /> : <PlayingCard key={`${nextCard.r}${nextCard.s}`} card={nextCard} ring={verdict === "win" ? "#3DDC97" : verdict === "tie" ? "#FFD23F" : ACCENT} />)}
          </div>

          <div className="flex min-h-[214px] w-full flex-col justify-end">
            {suspense ? (
              <div className="text-center">
                <p style={{ ...DISPLAY, fontSize: 34, color: "#FFD23F", animation: "tgv-wobble .3s ease-in-out infinite" }}>Dernière carte…</p>
              </div>
            ) : !verdict ? (
              <div className="flex flex-col gap-3">
                <p className="text-center text-[16px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>La prochaine carte sera…</p>
                <BetButton label="Plus haute" icon={ArrowUp} bg="#FF6B5B" onClick={() => makeBet("plus")} />
                <BetButton label="Égale" icon={Equal} bg="#FFD23F" onClick={() => makeBet("egal")} />
                <BetButton label="Plus basse" icon={ArrowDown} bg="#4ECDC4" onClick={() => makeBet("moins")} />
              </div>
            ) : verdict === "win" ? (
              <div className="text-center" style={{ animation: "tgv-pop .35s ease-out" }}>
                <p className="mx-auto inline-flex items-center gap-2 rounded-full px-5 py-1.5" style={{ ...stk("#3DDC97", 4), color: INK, transform: "rotate(-2deg)", ...DISPLAY, fontSize: 30 }}>
                  <Check size={28} strokeWidth={3.4} aria-hidden /> Bien vu !
                </p>
                <Push big bg="#FFD23F" onClick={advanceAfterWin} className="mt-5 w-full">
                  {isLast ? <>Arriver en gare <TrainFront size={22} strokeWidth={3} aria-hidden /></> : "Wagon suivant"}
                </Push>
              </div>
            ) : (
              <div className="pb-4 text-center" style={{ animation: "tgv-shake .45s ease-out" }}>
                <p className="mx-auto inline-flex items-center gap-2 rounded-full px-5 py-1.5" style={{ ...stk(verdict === "tie" ? "#FFD23F" : ACCENT, 4), color: INK, transform: "rotate(2deg)", ...DISPLAY, fontSize: 30 }}>
                  {verdict === "tie" ? <><Equal size={28} strokeWidth={3.4} aria-hidden /> Égalité !</> : <><X size={28} strokeWidth={3.4} aria-hidden /> Raté !</>}
                </p>
                <p className="mt-3 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{verdict === "tie" ? "Petite peine, mais tu restes sur ce wagon." : "Retour au wagon 1… après la peine."}</p>
              </div>
            )}
          </div>

          <TextLink onClick={endGame}>Terminer la partie</TextLink>
        </div>

        {(spin || penalty) && <PenaltyOverlay name={currentName} colorIndex={currentIdx} spin={spin} penalty={penalty} onReroll={rerollGage} onDone={afterPenalty} />}
      </div>
    );
  }

  if (phase === "win") {
    return (
      <Page center>
        {chrome}
        <style>{KEYFRAMES}</style>
        <ConfettiBurst count={80} />
        <h1 className="text-center" style={{ ...DISPLAY, fontSize: 46, lineHeight: 0.95 }}>Arrivé en gare&nbsp;!</h1>
        <div className="relative mt-16 rounded-[26px] px-5 pb-5 pt-12 text-center" style={{ ...stk("#FFD23F", 6), color: INK, transform: "rotate(-2deg)", animation: "tgv-pop .5s ease-out" }}>
          <div className="absolute -top-16 left-1/2 -translate-x-1/2"><Mascot size={96} color={colorForIndex(currentIdx)} mood="laughing" cheering crown shadow={false} /></div>
          <p style={{ ...DISPLAY, fontSize: 40, lineHeight: 1, overflowWrap: "anywhere" }}>{currentName}</p>
          <p className="mt-2 text-[16px] font-semibold leading-snug">Tous les wagons d&apos;un coup&nbsp;! Tu distribues 2 gorgées (ou un gage) à qui tu veux.</p>
        </div>
        <div className="min-h-8 flex-1" />
        <Push big bg={ACCENT} onClick={nextPlayer} className="mt-8 w-full">
          Au tour de {players[(currentIdx + 1) % players.length]}
        </Push>
        <div className="mt-1"><TextLink onClick={endGame}>Terminer la partie</TextLink></div>
      </Page>
    );
  }

  // ── OVER : classement (le moins de peines en tête) ──
  const ranking = players.map((name, i) => ({ name, i, losses: losses[i] ?? 0 })).sort((a, b) => a.losses - b.losses);
  const top = ranking[0];
  return (
    <Page>
      {chrome}
      <h1 style={{ ...DISPLAY, fontSize: 48, lineHeight: 0.95 }}>Terminus&nbsp;!</h1>
      <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>Le bilan du voyage : le moins de peines gagne.</p>
      {top && (
        <div className="relative mt-16 rounded-[26px] px-5 pb-4 pt-[52px] text-center" style={{ ...stk("#3DDC97", 6), color: INK, transform: "rotate(-2deg)" }}>
          <div className="absolute -top-[62px] left-1/2 -translate-x-1/2"><Mascot size={76} color={colorForIndex(top.i)} mood="cool" crown arms shadow={false} /></div>
          <p className="text-[15px] font-bold">Meilleur conducteur</p>
          <p style={{ ...DISPLAY, fontSize: 40, lineHeight: 1, overflowWrap: "anywhere" }}>{top.name}</p>
          <p className="mt-1 text-[15px] font-bold">{top.losses} peine{top.losses > 1 ? "s" : ""}</p>
        </div>
      )}
      <div className="mt-5 space-y-2.5">
        {ranking.slice(1).map((p, k) => (
          <div key={p.i} className="flex items-center gap-3 rounded-[18px] px-3.5" style={{ ...stk("#fff", 3, 2.5), color: INK, minHeight: 54, transform: `rotate(${k % 2 ? 0.8 : -0.8}deg)` }}>
            <span className="w-7 text-[18px]" style={DISPLAY}>{k + 2}</span>
            <MascotAvatar color={colorForIndex(p.i)} size={32} mood="happy" />
            <span className="min-w-0 flex-1 truncate text-[17px] font-bold">{p.name}</span>
            <span className="text-[15px] font-bold">{p.losses} peine{p.losses > 1 ? "s" : ""}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-center"><IdeaButton game="TGV" kind="gage" /></div>
      <div className="min-h-6 flex-1" />
      <div className="mt-6 space-y-3">
        <Push
          big
          bg={ACCENT}
          onClick={() => {
            setLosses(players.map(() => 0));
            setCurrentIdx(0);
            deckRef.current = newDeck();
            playSfx("card-shuffle", { volume: 0.7 });
            setPhase("pass");
          }}
          className="w-full"
        >
          <RotateCcw size={22} strokeWidth={3} aria-hidden /> Rejouer
        </Push>
        <div className="grid grid-cols-2 gap-3">
          <Push bg="#fff" onClick={() => setPhase("config")}>Réglages</Push>
          {onReturnToLobby && <Push bg="#fff" onClick={onReturnToLobby}><Home size={18} strokeWidth={3} aria-hidden /> Accueil</Push>}
        </div>
      </div>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────
function Page({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <div className="relative flex min-h-[100svh] flex-col px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
      <div className={`mx-auto flex w-full max-w-md flex-1 flex-col ${center ? "justify-center" : ""}`}>{children}</div>
    </div>
  );
}

function Train({ total, pileIdx, cleared }: { total: number; pileIdx: number; cleared: number }) {
  return (
    <div className="mt-4 flex items-center gap-1.5">
      <span className="grid h-10 w-12 place-items-center rounded-[12px_18px_12px_12px]" style={{ ...stk(ACCENT, 3, 2.5), color: INK }}>
        <TrainFront size={22} strokeWidth={2.8} aria-hidden />
      </span>
      {Array.from({ length: total }, (_, i) => {
        const done = i < cleared;
        const here = i === pileIdx && !done;
        return (
          <div
            key={i}
            className="grid h-10 w-10 place-items-center rounded-[12px]"
            style={{
              ...stk(done ? "#3DDC97" : here ? "#FFD23F" : "#2B1B6E", here ? 3 : done ? 2 : 0, 2.5),
              color: done || here ? INK : "rgba(255,255,255,0.8)",
              transform: here ? "translateY(-3px)" : undefined,
              ...DISPLAY,
              fontSize: 18,
            }}
          >
            {done ? <Check size={20} strokeWidth={3.4} aria-hidden /> : i + 1}
          </div>
        );
      })}
    </div>
  );
}

// Carte dessinée en CSS : coin + gros symbole, lisible de loin
function PlayingCard({ card, dim, ring }: { card: Card; dim?: boolean; ring?: string }) {
  const color = card.red ? "#E0263D" : INK;
  return (
    <div
      className="relative flex flex-col rounded-[20px]"
      aria-label={`${RANK_NAMES[card.r] ?? card.r} ${card.s}`}
      style={{
        ...stk("#fff", 6),
        width: 132,
        height: 184,
        color,
        opacity: dim ? 0.6 : 1,
        transform: dim ? "scale(0.9) rotate(-4deg)" : ring ? "rotate(3deg)" : undefined,
        transition: "opacity .3s, transform .3s",
        outline: ring ? `5px solid ${ring}` : undefined,
        outlineOffset: 3,
        animation: "tgv-flip .4s ease-out",
        fontFamily: "var(--font-display)",
      }}
    >
      <div className="absolute left-2.5 top-2 flex flex-col items-center leading-none">
        <span className="text-[24px] font-bold">{card.r}</span>
        <span className="text-[18px]">{card.s}</span>
      </div>
      <div className="absolute bottom-2 right-2.5 flex rotate-180 flex-col items-center leading-none">
        <span className="text-[24px] font-bold">{card.r}</span>
        <span className="text-[18px]">{card.s}</span>
      </div>
      <div className="m-auto text-[66px] leading-none">{card.s}</div>
    </div>
  );
}

function MysteryCard() {
  return (
    <div
      className="grid place-items-center rounded-[20px]"
      style={{ ...stk("#7A4EE8", 6), width: 132, height: 184, color: "#fff", animation: "tgv-wobble .3s ease-in-out infinite", backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 2px, transparent 2.4px)", backgroundSize: "16px 16px" }}
    >
      <span style={{ ...DISPLAY, fontSize: 72, lineHeight: 1 }}>?</span>
    </div>
  );
}

function BetButton({ label, icon: Icon, bg, onClick }: { label: string; icon: LucideIcon; bg: string; onClick: () => void }) {
  return (
    <Push big bg={bg} onClick={onClick} className="w-full">
      <Icon size={24} strokeWidth={3.2} aria-hidden /> {label}
    </Push>
  );
}

function PenaltyOverlay({
  name, colorIndex, spin, penalty, onReroll, onDone,
}: { name: string; colorIndex: number; spin: SpinFace | null; penalty: Penalty | null; onReroll: () => void; onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <p className="text-[17px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>Une peine pour</p>
        <div className="mt-2 flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5" style={{ ...stk("#fff", 4), color: INK, transform: "rotate(-2deg)" }}>
          <MascotAvatar color={colorForIndex(colorIndex)} size={40} mood="shocked" />
          <span style={{ ...DISPLAY, fontSize: 30, lineHeight: 1, overflowWrap: "anywhere" }}>{name}</span>
        </div>
        {spin ? (
          <div className="mt-8 grid h-36 w-36 place-items-center rounded-[34px]" style={{ ...stk(ACCENT, 6), color: INK, animation: "tgv-wobble .25s linear infinite" }}>
            <SpinIcon face={spin} />
          </div>
        ) : penalty ? (
          <div className="mt-6 w-full" style={{ animation: "tgv-pop .4s ease-out" }}>
            <Mascot size={86} color="coral" mood="rofl" arms shadow={false} className="mx-auto" />
            <div className="mt-2 rounded-[24px] px-5 py-4" style={{ ...stk("#FFF6E5", 5), color: INK, transform: "rotate(1deg)" }}>
              {penalty.kind === "sips" ? (
                <>
                  <p style={{ ...DISPLAY, fontSize: 36, lineHeight: 1.05 }}>{penalty.sips} gorgée{penalty.sips > 1 ? "s" : ""}</p>
                  <p className="mt-2 text-[15px] font-semibold" style={{ opacity: 0.8 }}>Ou le gage, au choix : « {penalty.gage} »</p>
                </>
              ) : (
                <>
                  <p style={{ ...DISPLAY, fontSize: 26, lineHeight: 1.1 }}>{penalty.gage}</p>
                  <p className="mt-2 text-[15px] font-semibold" style={{ opacity: 0.8 }}>Ou {penalty.sips} gorgée{penalty.sips > 1 ? "s" : ""}, au choix (eau ou soft, ça compte).</p>
                </>
              )}
            </div>
            <div className="mt-5 flex justify-center">
              <RerollButton onClick={onReroll} label="Pas fou ? Un autre gage" />
            </div>
          </div>
        ) : null}
      </div>
      {penalty && !spin && (
        <div className="mx-auto mt-6 w-full max-w-md">
          <Push big bg="#FFD23F" onClick={onDone} className="w-full">
            <Check size={22} strokeWidth={3.2} aria-hidden /> C&apos;est fait
          </Push>
        </div>
      )}
    </div>
  );
}

// Faces de la roulette de peine (icônes)
type SpinFace = "sips" | "gage" | "hot";
const SPIN_ICONS: Record<SpinFace, LucideIcon> = { sips: CupSoda, gage: Dices, hot: Flame };
function SpinIcon({ face }: { face: SpinFace }) {
  const I = SPIN_ICONS[face];
  return <I size={70} strokeWidth={2.4} aria-hidden />;
}
