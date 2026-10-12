"use client";

/**
 * TGV — le « plus ou moins » à enchaîner, sur un seul téléphone.
 * Le joueur voit une carte et parie sur la suivante : plus haute, plus basse
 * ou égale. Il doit passer tous les tas (wagons) d'affilée. Raté = une peine
 * (gorgée plafonnée à 3, ou un gage) et retour au premier wagon.
 *
 * 100 % local, cartes dessinées en CSS (aucune image), vrai paquet de 52 mélangé.
 */

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PlayersSetup, PassScreen, colorForIndex } from "@/components/games/local-kit";
import { useAudio } from "@/lib/hooks/useAudio";
import { sfxCardPlay, sfxTrickWin, sfxHandChime } from "@/lib/card-sfx";
import { ArrowDown, ArrowLeft, ArrowUp, Check, CupSoda, Dices, Drum, Equal, Flame, Layers, Siren, TrainFront, X, Zap, type LucideIcon } from "lucide-react";
import { GameInlineIcon } from "@/components/games/game-icon-button";

// ── Constantes ────────────────────────────────────────────
const ACCENT = "#FF3852";
const BG = `radial-gradient(circle at 50% 14%, ${ACCENT}28, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`;
const TOP_SAFE = "calc(env(safe-area-inset-top, 0px) + 64px)";
const BOTTOM_SAFE = "calc(env(safe-area-inset-bottom, 0px) + 20px)";

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
function drawPenalty(mode: PenaltyMode, sips: number): Penalty {
  const gage = GAGES[Math.floor(Math.random() * GAGES.length)];
  const kind = mode === "sips" ? "sips" : mode === "gages" ? "gage" : Math.random() < 0.5 ? "sips" : "gage";
  return { kind, sips: Math.min(3, Math.max(1, sips)), gage };
}

type Verdict = "win" | "loss" | "tie";
type Bet = "plus" | "moins" | "egal";

const KEYFRAMES = `
@keyframes tgv-flip { 0% { transform: rotateY(90deg) scale(.9); opacity: 0 } 100% { transform: rotateY(0) scale(1); opacity: 1 } }
@keyframes tgv-pop { 0% { transform: scale(.5); opacity: 0 } 70% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1) } }
@keyframes tgv-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 50% { transform: translateX(8px) } 75% { transform: translateX(-4px) } }
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

  const { muted } = useAudio();
  const sound = !muted;

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
        if (sound && ticks % 2 === 0) sfxCardPlay();
        if (ticks >= 16) {
          clearInterval(iv);
          setSpin(null);
          setPenalty(final);
          vib([150, 60, 150]);
        }
      }, 75);
    }, 900);
    return () => {
      clearTimeout(start);
      if (iv) clearInterval(iv);
    };
  }, [verdict, suspense, pileIdx, penaltyMode, sound]);

  // Suspense sur la dernière carte du train
  useEffect(() => {
    if (!suspense) return;
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
    if (verdict === "win") {
      if (sound) sfxCardPlay();
      vib(40);
    } else if (sound) sfxTrickWin();
  }, [verdict, suspense, sound]);

  const advanceAfterWin = () => {
    if (verdict !== "win" || !nextCard) return;
    if (pileIdx + 1 >= numPiles) {
      if (sound) sfxHandChime(true);
      vib([80, 40, 80, 40, 220]);
      setPhase("win");
      return;
    }
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
  };

  const nextPlayer = () => {
    setCurrentIdx((currentIdx + 1) % players.length);
    setPhase("pass");
  };

  // ── Écrans ─────────────────────────────────────────────
  if (phase === "setup") {
    return (
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
    );
  }

  if (phase === "config") {
    return (
      <Shell>
        <Mascot size={78} color="coral" mood="cool" arms shadow={false} />
        <h1 className="cb-display-lg mt-2">TGV</h1>
        <div className="mt-4 w-full max-w-sm rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-[14px] leading-snug text-white/90">
            <GameInlineIcon icon={Layers} /> Une carte est retournée : la suivante sera <b>plus haute</b>, <b>plus basse</b> ou <b>égale</b> ?
            <br />
            <GameInlineIcon icon={TrainFront} /> Enchaîne tous les wagons sans te tromper pour arriver en gare.
            <br />
            <GameInlineIcon icon={Zap} /> Raté = <b>une peine</b> et retour au wagon 1. Plus tu tombes loin, plus la peine grimpe (3 gorgées max, ou un gage).
          </p>
        </div>

        <p className="af-eyebrow mt-6">Wagons à enchaîner</p>
        <div className="mt-2 grid w-full max-w-sm grid-cols-4 gap-2">
          {PILE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setNumPiles(n)}
              className="rounded-2xl border py-3 text-center"
              style={{ minHeight: 64, borderColor: n === numPiles ? `${ACCENT}aa` : "rgba(255,255,255,0.12)", background: n === numPiles ? `${ACCENT}22` : "rgba(0,0,0,0.3)" }}
            >
              <p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: n === numPiles ? ACCENT : "#fff" }}>
                {n}
              </p>
              <p className="text-[12px] text-white/60">{n === 3 ? "express" : n === 4 ? "classique" : n === 5 ? "long" : "marathon"}</p>
            </button>
          ))}
        </div>

        <p className="af-eyebrow mt-6">La peine</p>
        <div className="mt-2 grid w-full max-w-sm grid-cols-3 gap-2">
          {(
            [
              { v: "mix", icons: [CupSoda, Dices], label: "Mixte" },
              { v: "sips", icons: [CupSoda], label: "Gorgées" },
              { v: "gages", icons: [Dices], label: "Gages" },
            ] as { v: PenaltyMode; icons: LucideIcon[]; label: string }[]
          ).map((o) => (
            <button
              key={o.v}
              onClick={() => setPenaltyMode(o.v)}
              className="rounded-2xl border py-3 text-center"
              style={{ minHeight: 64, borderColor: o.v === penaltyMode ? `${ACCENT}aa` : "rgba(255,255,255,0.12)", background: o.v === penaltyMode ? `${ACCENT}22` : "rgba(0,0,0,0.3)" }}
            >
              <p className="flex justify-center gap-1" style={{ color: o.v === penaltyMode ? ACCENT : "#fff" }}>
                {o.icons.map((I, k) => <I key={k} size={22} strokeWidth={2.6} aria-hidden />)}
              </p>
              <p className="mt-1 text-[13px] font-bold">{o.label}</p>
            </button>
          ))}
        </div>
        <p className="mt-2 max-w-sm text-center text-[12px]" style={{ color: "var(--text-dim)" }}>
          Gorgée = ce que tu bois, eau et soft compris. On peut toujours choisir un gage à la place.
        </p>

        <button onClick={() => { setCurrentIdx(0); setPhase("pass"); }} className="af-btn af-btn-primary mt-6 w-full max-w-sm" style={{ fontSize: 17, minHeight: 54 }}>
          Lancer le train <GameInlineIcon icon={TrainFront} />
        </button>
        <button onClick={() => setPhase("setup")} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
          <GameInlineIcon icon={ArrowLeft} /> Modifier les joueurs
        </button>
        <p className="mt-4 max-w-sm text-center text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          18+. Bois avec modération, alterne avec de l&apos;eau, et jamais si tu conduis.
        </p>
      </Shell>
    );
  }

  if (phase === "pass") {
    return (
      <PassScreen
        toName={currentName}
        colorIndex={currentIdx}
        accent={ACCENT}
        hint={`À toi de monter dans le TGV : ${numPiles} wagons à enchaîner sans erreur.`}
        buttonLabel={<>Embarquer <GameInlineIcon icon={TrainFront} /></>}
        onReady={startRun}
      />
    );
  }

  if (phase === "play") {
    const isLast = pileIdx === numPiles - 1;
    const revealed = verdict && !suspense;
    const sipsAtStake = Math.min(3, pileIdx + 1);
    return (
      <div className="relative flex min-h-[100svh] flex-col items-center overflow-hidden px-5 text-white" style={{ background: BG, paddingTop: TOP_SAFE, paddingBottom: BOTTOM_SAFE }}>
        <style>{KEYFRAMES}</style>
        <div className="flex items-center gap-2">
          <MascotAvatar color={colorForIndex(currentIdx)} size={28} mood="wink" />
          <span className="text-[15px] font-bold">{currentName}</span>
        </div>
        <Train total={numPiles} pileIdx={pileIdx} cleared={verdict === "win" && revealed ? pileIdx + 1 : pileIdx} />
        <p className="mt-2 text-[13px]" style={{ color: "var(--text-dim)" }}>
          {isLast ? <><GameInlineIcon icon={Siren} /> Dernier wagon !</> : `Wagon ${pileIdx + 1}/${numPiles}`} · en jeu : {sipsAtStake} gorgée{sipsAtStake > 1 ? "s" : ""} ou un gage
        </p>

        <div className="flex flex-1 items-center justify-center gap-4 py-4" style={{ perspective: 800 }}>
          <PlayingCard card={card} dim={!!nextCard && !suspense} />
          {nextCard && (suspense ? <MysteryCard /> : <PlayingCard key={`${nextCard.r}${nextCard.s}`} card={nextCard} glow={verdict === "win" ? "#3DDC97" : ACCENT} />)}
        </div>

        <div className="flex min-h-[220px] w-full max-w-sm flex-col justify-end">
          {suspense ? (
            <div className="text-center">
              <div className="mb-1 flex animate-bounce justify-center" style={{ color: ACCENT }}><Drum size={40} strokeWidth={2.4} aria-hidden /></div>
              <p className="cb-display-md" style={{ color: ACCENT }}>
                Dernière carte…
              </p>
            </div>
          ) : !verdict ? (
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-center text-[14px] text-white/70">La prochaine carte sera…</p>
              <BetButton label="Plus haute" icon={ArrowUp} tint="#FF6B5B" onClick={() => makeBet("plus")} />
              <BetButton label="Égale" icon={Equal} tint="#E0A800" onClick={() => makeBet("egal")} />
              <BetButton label="Plus basse" icon={ArrowDown} tint="#4B8DFF" onClick={() => makeBet("moins")} />
            </div>
          ) : verdict === "win" ? (
            <div className="text-center" style={{ animation: "tgv-pop .35s ease-out" }}>
              <p className="cb-display-md" style={{ color: "#3DDC97" }}>
                <GameInlineIcon icon={Check} /> Bien vu !
              </p>
              <button onClick={advanceAfterWin} className="af-btn af-btn-primary mt-3 w-full" style={{ fontSize: 17, minHeight: 56 }}>
                {isLast ? <>Arriver en gare <GameInlineIcon icon={TrainFront} /></> : "Wagon suivant →"}
              </button>
            </div>
          ) : (
            <div className="text-center" style={{ animation: "tgv-shake .45s ease-out" }}>
              <p className="cb-display-md" style={{ color: verdict === "tie" ? "#FFD23F" : ACCENT }}>
                {verdict === "tie" ? <><GameInlineIcon icon={Equal} /> Égalité !</> : <><GameInlineIcon icon={X} /> Raté !</>}
              </p>
              <p className="mt-1 text-[14px] text-white/70">{verdict === "tie" ? "Petite peine, mais tu restes sur ce wagon." : "Retour au wagon 1… après la peine."}</p>
            </div>
          )}
        </div>

        <button onClick={() => setPhase("over")} className="mt-3 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
          Terminer la partie
        </button>

        {(spin || penalty) && <PenaltyOverlay name={currentName} spin={spin} penalty={penalty} onDone={afterPenalty} />}
      </div>
    );
  }

  if (phase === "win") {
    return (
      <Shell>
        <ConfettiBurst count={80} />
        <div style={{ animation: "tgv-pop .5s ease-out" }}>
          <Mascot size={110} color={colorForIndex(currentIdx)} mood="laughing" cheering crown />
        </div>
        <style>{KEYFRAMES}</style>
        <p className="af-eyebrow mt-3" style={{ color: ACCENT }}>
          Arrivé en gare !
        </p>
        <h2 className="cb-display-lg mt-1 max-w-full text-center" style={{ overflowWrap: "anywhere" }}>
          {currentName}
        </h2>
        <p className="mt-2 max-w-sm text-center text-[15px]" style={{ color: "rgba(255,255,255,0.85)" }}>
          Tous les wagons d&apos;un coup ! Tu <b>distribues 2 gorgées</b> (ou un gage) à qui tu veux.
        </p>
        <button onClick={nextPlayer} className="af-btn af-btn-primary mt-6 w-full max-w-sm" style={{ fontSize: 16, minHeight: 54 }}>
          Au tour de {players[(currentIdx + 1) % players.length]} →
        </button>
        <button onClick={() => setPhase("over")} className="mt-1 text-sm" style={{ color: "var(--text-dim)", minHeight: 44 }}>
          Terminer la partie
        </button>
      </Shell>
    );
  }

  // ── OVER : classement (le moins de peines en tête) ──
  const ranking = players.map((name, i) => ({ name, i, losses: losses[i] ?? 0 })).sort((a, b) => a.losses - b.losses);
  return (
    <Shell>
      <p className="af-eyebrow" style={{ color: ACCENT }}>
        Terminus
      </p>
      <h2 className="cb-display-lg mt-1 text-center">Le bilan du voyage</h2>
      <div className="mt-5 w-full max-w-sm space-y-2">
        {ranking.map((p, idx) => (
          <div
            key={p.i}
            className="flex items-center gap-3 rounded-2xl border px-3"
            style={{ minHeight: 52, background: idx === 0 ? `${ACCENT}22` : "rgba(255,255,255,0.04)", borderColor: idx === 0 ? `${ACCENT}55` : "var(--line-soft)" }}
          >
            <span className="w-7 font-bold" style={{ color: idx === 0 ? ACCENT : "var(--text-muted)" }}>
              #{idx + 1}
            </span>
            <MascotAvatar color={colorForIndex(p.i)} size={32} mood={idx === 0 ? "cool" : "happy"} />
            <span className="min-w-0 flex-1 truncate font-bold">{p.name}</span>
            <span className="text-sm font-bold" style={{ color: idx === 0 ? ACCENT : "#fff" }}>
              {p.losses} peine{p.losses > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          setLosses(players.map(() => 0));
          setCurrentIdx(0);
          deckRef.current = newDeck();
          setPhase("pass");
        }}
        className="af-btn af-btn-primary mt-7 w-full max-w-sm"
        style={{ fontSize: 16, minHeight: 54 }}
      >
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

// ─────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center px-5 text-white" style={{ background: BG, paddingTop: TOP_SAFE, paddingBottom: BOTTOM_SAFE }}>
      <div className="my-auto flex w-full flex-col items-center">{children}</div>
    </div>
  );
}

function Train({ total, pileIdx, cleared }: { total: number; pileIdx: number; cleared: number }) {
  return (
    <div className="mt-3 flex items-center gap-1.5">
      <TrainFront size={26} strokeWidth={2.6} color={ACCENT} aria-hidden />
      {Array.from({ length: total }, (_, i) => {
        const done = i < cleared;
        const here = i === pileIdx && !done;
        return (
          <div
            key={i}
            className="flex h-8 w-10 items-center justify-center rounded-lg border text-[13px] font-bold"
            style={{
              background: done ? "#3DDC97" : here ? `${ACCENT}40` : "rgba(255,255,255,0.05)",
              borderColor: done ? "#1AA66A" : here ? `${ACCENT}aa` : "rgba(255,255,255,0.12)",
              color: done ? "#0a0420" : "#fff",
              boxShadow: here ? `0 0 12px ${ACCENT}66` : undefined,
            }}
          >
            {done ? "✓" : i + 1}
          </div>
        );
      })}
    </div>
  );
}

// Carte dessinée en CSS : coin + gros symbole, lisible de loin
function PlayingCard({ card, dim, glow }: { card: Card; dim?: boolean; glow?: string }) {
  const color = card.red ? "#D7263D" : "#14111F";
  return (
    <div
      className="relative flex flex-col rounded-2xl bg-white"
      aria-label={`${RANK_NAMES[card.r] ?? card.r} ${card.s}`}
      style={{
        width: 130,
        height: 182,
        color,
        opacity: dim ? 0.55 : 1,
        transform: dim ? "scale(0.9)" : undefined,
        transition: "opacity .3s, transform .3s",
        boxShadow: glow ? `0 0 40px ${glow}aa, 0 10px 30px rgba(0,0,0,0.45)` : "0 10px 30px rgba(0,0,0,0.45)",
        animation: "tgv-flip .4s ease-out",
        fontFamily: "var(--font-display)",
      }}
    >
      <div className="absolute left-2.5 top-2 flex flex-col items-center leading-none">
        <span className="text-[22px] font-black">{card.r}</span>
        <span className="text-[18px]">{card.s}</span>
      </div>
      <div className="absolute bottom-2 right-2.5 flex rotate-180 flex-col items-center leading-none">
        <span className="text-[22px] font-black">{card.r}</span>
        <span className="text-[18px]">{card.s}</span>
      </div>
      <div className="m-auto text-[64px] leading-none">{card.s}</div>
    </div>
  );
}

function MysteryCard() {
  return (
    <div
      className="flex animate-pulse items-center justify-center rounded-2xl border-2"
      style={{ width: 130, height: 182, borderColor: `${ACCENT}cc`, background: "linear-gradient(135deg, #1a0a2e, #2a0f4a)", boxShadow: `0 0 35px ${ACCENT}88` }}
    >
      <span className="text-5xl font-bold" style={{ color: ACCENT, textShadow: `0 0 12px ${ACCENT}` }}>
        ?
      </span>
    </div>
  );
}

function BetButton({ label, icon: Icon, tint, onClick }: { label: string; icon: LucideIcon; tint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-3 rounded-2xl font-bold text-white transition-transform active:scale-[0.97]"
      style={{ minHeight: 58, background: `linear-gradient(135deg, ${tint}, ${tint}99)`, boxShadow: `0 0 22px ${tint}44` }}
    >
      <Icon size={26} strokeWidth={3} aria-hidden />
      <span className="text-[17px]">{label}</span>
    </button>
  );
}

function PenaltyOverlay({ name, spin, penalty, onDone }: { name: string; spin: SpinFace | null; penalty: Penalty | null; onDone: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6 text-center backdrop-blur-md" style={{ background: "rgba(0,0,0,0.85)" }}>
      <p className="af-eyebrow mb-3" style={{ color: ACCENT }}>
        {name} prend une peine
      </p>
      {spin ? (
        <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border text-[72px]" style={{ borderColor: `${ACCENT}aa`, boxShadow: `0 0 80px ${ACCENT}88` }}>
          <SpinIcon face={spin} />
        </div>
      ) : penalty ? (
        <div className="flex w-full max-w-sm flex-col items-center" style={{ animation: "tgv-pop .4s ease-out" }}>
          <Mascot size={90} color="coral" mood="rofl" arms />
          {penalty.kind === "sips" ? (
            <>
              <p className="cb-display-lg mt-3">
                <GameInlineIcon icon={CupSoda} /> {penalty.sips} gorgée{penalty.sips > 1 ? "s" : ""}
              </p>
              <p className="mt-2 text-[15px] text-white/80">ou le gage : « {penalty.gage} »</p>
            </>
          ) : (
            <>
              <p className="cb-display-md mt-3"><GameInlineIcon icon={Dices} /> « {penalty.gage} »</p>
              <p className="mt-2 text-[15px] text-white/80">
                ou {penalty.sips} gorgée{penalty.sips > 1 ? "s" : ""}, au choix
              </p>
            </>
          )}
          <button onClick={onDone} className="af-btn af-btn-primary mt-6 w-full" style={{ fontSize: 16, minHeight: 54 }}>
            C&apos;est fait ✓
          </button>
        </div>
      ) : null}
    </div>
  );
}

// Faces de la roulette de peine (icônes, plus d'emojis)
type SpinFace = "sips" | "gage" | "hot";
const SPIN_ICONS: Record<SpinFace, LucideIcon> = { sips: CupSoda, gage: Dices, hot: Flame };
function SpinIcon({ face }: { face: SpinFace }) {
  const I = SPIN_ICONS[face];
  return <I size={64} strokeWidth={2.4} color={ACCENT} aria-hidden />;
}
