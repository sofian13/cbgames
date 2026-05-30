"use client";

/**
 * TGV — le jeu d'alcool classique du « plus ou moins » sur un seul téléphone.
 * Le joueur retourne une carte, parie + / − sur la suivante. Si raté, il boit et
 * recommence au tas 1 ; s'il enchaîne tous les tas, le train est arrivé.
 *
 * 100% local pass-and-play. Aucun serveur hors le LocalGame stub.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { PlayersSetup, colorForIndex } from "@/components/games/local-kit";
import { useAudio } from "@/lib/hooks/useAudio";
import { sfxCardPlay, sfxTrickWin, sfxHandChime } from "@/lib/card-sfx";

// ── Constantes ────────────────────────────────────────────
const ACCENT = "#FF3852"; // rouge SNCF
const BG_GRAD = `radial-gradient(circle at 50% 14%, ${ACCENT}28, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`;

const RANKS: { v: number; r: string; label: string }[] = [
  { v: 2, r: "2", label: "2" },
  { v: 3, r: "3", label: "3" },
  { v: 4, r: "4", label: "4" },
  { v: 5, r: "5", label: "5" },
  { v: 6, r: "6", label: "6" },
  { v: 7, r: "7", label: "7" },
  { v: 8, r: "8", label: "8" },
  { v: 9, r: "9", label: "9" },
  { v: 10, r: "10", label: "10" },
  { v: 11, r: "J", label: "Valet" },
  { v: 12, r: "Q", label: "Dame" },
  { v: 13, r: "K", label: "Roi" },
  { v: 14, r: "A", label: "As" },
];
const SUITS = ["S", "H", "D", "C"] as const;
type Suit = (typeof SUITS)[number];
interface Card { v: number; r: string; suit: Suit }

function drawCard(): Card {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { v: rank.v, r: rank.r, suit };
}

const PILE_OPTIONS = [3, 4, 5, 6] as const;

// ── Roulette de la peine (shot / CBD / les deux) ──────────
type Penalty = "shot" | "cbd" | "any";
function rouletteOutcome(p: Penalty) {
  if (p === "shot") return "🥃";
  if (p === "cbd") return "🌿";
  return Math.random() < 0.5 ? "🥃" : "🌿";
}

// ──────────────────────────────────────────────────────────
export default function TgvGame({ onReturnToLobby }: GameProps) {
  type Phase = "setup" | "config" | "intro" | "play" | "result" | "win" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [losses, setLosses] = useState<number[]>([]); // peines par joueur
  const [currentIdx, setCurrentIdx] = useState(0); // joueur actif
  const [numPiles, setNumPiles] = useState<number>(4);
  const [penalty, setPenalty] = useState<Penalty>("any");

  // état d'une partie en cours
  const [pileIdx, setPileIdx] = useState(0); // tas courant (0..numPiles-1)
  const [conquered, setConquered] = useState<number>(0); // wagons déjà conquis ce run
  const [card, setCard] = useState<Card>(() => drawCard());
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [verdict, setVerdict] = useState<"win" | "loss" | "tie" | null>(null);
  const [bet, setBet] = useState<"plus" | "moins" | null>(null);
  const [rouletteSpin, setRouletteSpin] = useState<string | null>(null);

  const { muted } = useAudio();
  const audioGate = !muted;

  // Pour SFX
  const lastVerdictRef = useRef<typeof verdict>(null);
  useEffect(() => {
    if (!audioGate) return;
    if (verdict && verdict !== lastVerdictRef.current) {
      if (verdict === "win") sfxCardPlay();
      if (verdict === "loss") sfxTrickWin();
      if (verdict === "tie") sfxCardPlay();
    }
    lastVerdictRef.current = verdict;
  }, [verdict, audioGate]);

  // ── Helpers ───────────────────────────────────────────────
  const totalPiles = numPiles;
  const currentName = players[currentIdx] ?? "";

  const begin = (names: string[]) => {
    setPlayers(names);
    setLosses(names.map(() => 0));
    setCurrentIdx(0);
    setPhase("config");
  };

  const startRun = () => {
    setPileIdx(0);
    setConquered(0);
    setCard(drawCard());
    setNextCard(null);
    setVerdict(null);
    setBet(null);
    setRouletteSpin(null);
    setPhase("intro");
  };

  const makeBet = (b: "plus" | "moins") => {
    if (verdict) return;
    const next = drawCard();
    let v: "win" | "loss" | "tie" = "tie";
    if (next.v === card.v) v = "tie";
    else if (b === "plus") v = next.v > card.v ? "win" : "loss";
    else v = next.v < card.v ? "win" : "loss";
    setBet(b);
    setNextCard(next);
    setVerdict(v);
  };

  const continueAfter = () => {
    if (!verdict) return;
    if (verdict === "win") {
      const nextPile = pileIdx + 1;
      const newConquered = conquered + 1;
      setConquered(newConquered);
      if (nextPile >= totalPiles) {
        // TGV terminé !
        if (audioGate) sfxHandChime(true);
        setPhase("win");
      } else {
        setPileIdx(nextPile);
        setCard(nextCard!);
        setNextCard(null);
        setVerdict(null);
        setBet(null);
      }
      return;
    }
    // loss ou tie → roulette
    setRouletteSpin("…");
    let ticks = 0;
    const total = 14 + Math.floor(Math.random() * 6);
    const t = setInterval(() => {
      ticks++;
      const sym = Math.random() < 0.5 ? "🥃" : "🌿";
      setRouletteSpin(sym);
      if (ticks >= total) {
        clearInterval(t);
        const final = rouletteOutcome(penalty);
        setRouletteSpin(final);
        setLosses((prev) => prev.map((n, i) => (i === currentIdx ? n + 1 : n)));
        setTimeout(() => {
          // Tie = on bois mais on reste sur le tas. Loss = retour à zéro.
          if (verdict === "loss") {
            setPileIdx(0);
            setConquered(0);
          }
          setCard(drawCard());
          setNextCard(null);
          setVerdict(null);
          setBet(null);
          setRouletteSpin(null);
        }, 1800);
      }
    }, 70);
  };

  const nextPlayer = () => {
    const ni = (currentIdx + 1) % players.length;
    setCurrentIdx(ni);
    startRun();
  };

  const finishGame = () => setPhase("over");

  // ── Phase rendering ───────────────────────────────────────
  if (phase === "setup") {
    return (
      <PlayersSetup
        emoji="🚄" name="TGV" min={2} max={10}
        accent={ACCENT} onStart={begin} onBack={onReturnToLobby}
      />
    );
  }

  if (phase === "config") {
    return <ConfigScreen
      numPiles={numPiles} setNumPiles={setNumPiles}
      penalty={penalty} setPenalty={setPenalty}
      onStart={() => { setCurrentIdx(0); startRun(); }}
      onBack={() => setPhase("setup")}
    />;
  }

  if (phase === "intro") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
        style={{ background: BG_GRAD }}>
        <p className="af-eyebrow mb-2" style={{ color: ACCENT }}>À toi de monter dans le TGV</p>
        <Mascot size={130} color={colorForIndex(currentIdx)} mood="wink" arms />
        <h1 className="cb-display-lg mt-3 text-center">{currentName}</h1>
        <p className="mt-3 max-w-sm text-center text-sm" style={{ color: "var(--text-dim)" }}>
          {totalPiles} tas à enchaîner sans erreur. Plus ou moins ?
          Tu te plantes → roulette {penalty === "any" ? "🥃 ou 🌿" : penalty === "shot" ? "🥃" : "🌿"} + retour à zéro.
        </p>
        <button onClick={() => setPhase("play")} className="af-btn af-btn-primary mt-7 w-full max-w-xs">
          Embarquer 🚄
        </button>
      </div>
    );
  }

  if (phase === "play") {
    return (
      <div className="relative flex min-h-[100svh] flex-col items-center p-5 text-white"
        style={{ background: BG_GRAD }}>
        {/* Train wagons */}
        <TrainProgress total={totalPiles} conquered={conquered} pileIdx={pileIdx} />

        {/* Player ribbon */}
        <div className="mt-4 flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
          <MascotAvatar color={colorForIndex(currentIdx)} size={26} mood="wink" />
          <span className="text-sm font-semibold">{currentName}</span>
          <span className="text-xs text-white/40">·</span>
          <span className="text-xs text-white/55">Tas {pileIdx + 1}/{totalPiles}</span>
        </div>

        {/* Card */}
        <div className="relative mt-6 flex flex-col items-center">
          <PlayingCard card={card} highlight={!verdict} />
          {/* Si on a un verdict, on affiche aussi la carte suivante à côté */}
          {verdict && nextCard && (
            <div className="mt-3 flex items-center gap-3 animate-[fadein_0.4s_ease]">
              <span className="text-2xl">→</span>
              <PlayingCard card={nextCard} small />
            </div>
          )}
        </div>

        {/* Verdict */}
        {verdict && (
          <p className="mt-4 cb-display-sm text-center"
            style={{ color: verdict === "win" ? "#3DDC97" : verdict === "tie" ? "#FFD23F" : ACCENT }}>
            {verdict === "win" ? "✅ Bien vu !" : verdict === "tie" ? "🟡 Égalité — tu bois quand même" : "💥 Raté !"}
          </p>
        )}

        {/* Buttons */}
        {!verdict ? (
          <div className="mt-7 grid w-full max-w-md grid-cols-2 gap-3">
            <BetButton label="MOINS" icon="↓" tint="#5BA3FF" onClick={() => makeBet("moins")} />
            <BetButton label="PLUS" icon="↑" tint="#FF6B5B" onClick={() => makeBet("plus")} />
          </div>
        ) : rouletteSpin ? (
          <div className="mt-7 flex flex-col items-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-3xl border bg-black/50 text-7xl"
              style={{ borderColor: `${ACCENT}66`, boxShadow: `0 0 50px ${ACCENT}55` }}>
              {rouletteSpin}
            </div>
            <p className="af-eyebrow mt-3" style={{ color: ACCENT }}>La peine tombe…</p>
          </div>
        ) : (
          <button onClick={continueAfter} className="af-btn af-btn-primary mt-7 w-full max-w-md">
            {verdict === "win" ? "Tas suivant →" : "Roulette 🥃/🌿"}
          </button>
        )}

        {/* Losses recap */}
        <LossRecap players={players} losses={losses} currentIdx={currentIdx} />
      </div>
    );
  }

  if (phase === "win") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-white relative overflow-hidden"
        style={{ background: BG_GRAD }}>
        <div className="text-7xl mb-2 animate-[pulse_1.4s_ease_infinite]">🚄</div>
        <p className="af-eyebrow" style={{ color: ACCENT }}>TGV terminé</p>
        <h2 className="cb-display-lg mt-1 mb-2 text-center">{currentName} a passé tous les tas !</h2>
        <p className="text-sm max-w-sm text-center mb-7" style={{ color: "var(--text-dim)" }}>
          Pas une goutte. Bravo champion. À ton tour de regarder les autres galérer.
        </p>
        <div className="flex w-full max-w-md flex-col gap-2.5">
          <button onClick={nextPlayer} className="af-btn af-btn-primary">Joueur suivant →</button>
          <button onClick={finishGame} className="af-btn af-btn-ghost">Terminer la partie</button>
        </div>
        <LossRecap players={players} losses={losses} currentIdx={currentIdx} />
      </div>
    );
  }

  // ── OVER : classement des moins arrosés ────────────────────
  const ranking = players
    .map((name, i) => ({ name, i, losses: losses[i] }))
    .sort((a, b) => a.losses - b.losses);
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
      style={{ background: BG_GRAD }}>
      <p className="af-eyebrow" style={{ color: ACCENT }}>Fin du voyage</p>
      <h2 className="cb-display-lg mt-1 mb-5">🚄 Plus sobre du wagon</h2>
      <div className="w-full max-w-sm space-y-2">
        {ranking.map((p, idx) => (
          <div key={p.i} className="flex items-center justify-between rounded-2xl border p-4"
            style={{
              background: idx === 0 ? `${ACCENT}22` : "rgba(255,255,255,0.04)",
              borderColor: idx === 0 ? `${ACCENT}55` : "var(--line-soft)",
            }}>
            <div className="flex items-center gap-3">
              <span className="cb-mono w-7 font-bold" style={{ color: idx === 0 ? ACCENT : "var(--text-muted)" }}>#{idx + 1}</span>
              <MascotAvatar color={colorForIndex(p.i)} size={34} mood={idx === 0 ? "wink" : "happy"} />
              <span className="font-bold">{p.name}</span>
            </div>
            <span className="cb-mono font-bold text-sm" style={{ color: idx === 0 ? ACCENT : "#fff" }}>
              {p.losses} {p.losses > 1 ? "peines" : "peine"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-7 flex gap-2">
        <button onClick={() => setPhase("setup")} className="af-btn af-btn-ghost">Rejouer</button>
        {onReturnToLobby && <button onClick={onReturnToLobby} className="af-btn af-btn-primary">Lobby</button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function ConfigScreen({
  numPiles, setNumPiles, penalty, setPenalty, onStart, onBack,
}: {
  numPiles: number;
  setNumPiles: (n: number) => void;
  penalty: Penalty;
  setPenalty: (p: Penalty) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
      style={{ background: BG_GRAD }}>
      <div className="text-5xl mb-2">🚄</div>
      <h1 className="cb-display-md mb-1">Configurer le TGV</h1>
      <p className="text-xs mb-6" style={{ color: "var(--text-dim)" }}>Combien de tas à enchaîner ?</p>

      <p className="af-eyebrow mb-2" style={{ color: ACCENT }}>Tas dans le train</p>
      <div className="grid w-full max-w-md grid-cols-4 gap-2 mb-7">
        {PILE_OPTIONS.map((n) => (
          <button key={n} onClick={() => setNumPiles(n)}
            className={cn("rounded-2xl border py-4 text-center transition-all active:scale-[0.97]",
              n === numPiles ? "shadow-lg" : "hover:bg-white/[0.04]")}
            style={{
              borderColor: n === numPiles ? `${ACCENT}aa` : "rgba(255,255,255,0.10)",
              background: n === numPiles ? `${ACCENT}1e` : "rgba(0,0,0,0.32)",
              boxShadow: n === numPiles ? `0 0 25px ${ACCENT}44` : undefined,
            }}>
            <p className="cb-mono text-2xl font-bold" style={{ color: n === numPiles ? ACCENT : "#fff" }}>{n}</p>
            <p className="text-[10px] text-white/50 mt-0.5">{n === 3 ? "express" : n === 4 ? "classique" : n === 5 ? "long" : "marathon"}</p>
          </button>
        ))}
      </div>

      <p className="af-eyebrow mb-2" style={{ color: ACCENT }}>La peine</p>
      <div className="grid w-full max-w-md grid-cols-3 gap-2">
        {([
          { v: "shot", emoji: "🥃", label: "Shot" },
          { v: "any", emoji: "🥃🌿", label: "Les deux" },
          { v: "cbd", emoji: "🌿", label: "CBD" },
        ] as { v: Penalty; emoji: string; label: string }[]).map((o) => (
          <button key={o.v} onClick={() => setPenalty(o.v)}
            className={cn("rounded-2xl border py-3 text-center transition-all active:scale-[0.97]",
              o.v === penalty ? "shadow-lg" : "hover:bg-white/[0.04]")}
            style={{
              borderColor: o.v === penalty ? `${ACCENT}aa` : "rgba(255,255,255,0.10)",
              background: o.v === penalty ? `${ACCENT}1e` : "rgba(0,0,0,0.32)",
            }}>
            <p className="text-xl">{o.emoji}</p>
            <p className="text-[11px] mt-1 font-semibold">{o.label}</p>
          </button>
        ))}
      </div>

      <button onClick={onStart} className="af-btn af-btn-primary mt-7 w-full max-w-md">Lancer le train</button>
      <button onClick={onBack} className="mt-3 text-sm text-white/40">← Modifier les joueurs</button>

      <p className="text-[10px] text-white/30 max-w-md mt-6 text-center">
        Conducteur sobre obligatoire. Bois avec modération. 18+.
      </p>
    </div>
  );
}

function TrainProgress({ total, conquered, pileIdx }: { total: number; conquered: number; pileIdx: number }) {
  const wagons = useMemo(() => Array.from({ length: total }, (_, i) => i), [total]);
  return (
    <div className="mt-4 flex items-center gap-1.5">
      <span className="text-2xl mr-1">🚂</span>
      {wagons.map((i) => {
        const done = i < conquered;
        const here = i === pileIdx;
        return (
          <div key={i}
            className="h-8 w-10 rounded-md border flex items-center justify-center text-xs font-bold transition-all"
            style={{
              background: done ? "#3DDC97" : here ? `${ACCENT}40` : "rgba(255,255,255,0.04)",
              borderColor: done ? "#1AA66A" : here ? `${ACCENT}aa` : "rgba(255,255,255,0.10)",
              color: done ? "#0a0420" : "#fff",
              boxShadow: here && !done ? `0 0 15px ${ACCENT}55` : undefined,
            }}>
            {done ? "✓" : i + 1}
          </div>
        );
      })}
    </div>
  );
}

function PlayingCard({ card, highlight, small }: { card: Card; highlight?: boolean; small?: boolean }) {
  const w = small ? 78 : 138;
  const h = small ? 110 : 196;
  return (
    <div key={`${card.r}${card.suit}-${Math.random()}`}
      className="rounded-2xl border bg-white shadow-2xl animate-[cardFlip_0.45s_ease]"
      style={{
        width: w, height: h,
        borderColor: highlight ? `${ACCENT}aa` : "rgba(255,255,255,0.2)",
        boxShadow: highlight ? `0 0 40px ${ACCENT}66` : "0 8px 24px rgba(0,0,0,0.4)",
      }}>
      <img alt="" src={`/cards/svg/${card.r}${card.suit}.svg`}
        style={{ width: "100%", height: "100%", objectFit: "fill", borderRadius: 14 }} />
    </div>
  );
}

function BetButton({ label, icon, tint, onClick }: { label: string; icon: string; tint: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="rounded-3xl py-6 text-center font-bold text-white transition-all hover:brightness-110 active:scale-[0.97]"
      style={{
        background: `linear-gradient(135deg, ${tint}, ${tint}88)`,
        boxShadow: `0 0 30px ${tint}55`,
      }}>
      <div className="text-4xl mb-1">{icon}</div>
      <div className="cb-mono text-sm tracking-wider">{label}</div>
    </button>
  );
}

function LossRecap({ players, losses, currentIdx }: { players: string[]; losses: number[]; currentIdx: number }) {
  return (
    <div className="mt-7 mb-6 flex w-full max-w-md flex-wrap items-center justify-center gap-2 text-xs">
      {players.map((name, i) => (
        <div key={i}
          className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1",
            i === currentIdx ? "border-white/30 bg-white/[0.06]" : "border-white/10 bg-black/30")}>
          <MascotAvatar color={colorForIndex(i)} size={18} mood="happy" />
          <span className="font-semibold">{name}</span>
          <span className="text-white/50">·</span>
          <span className="cb-mono text-white/70">{losses[i]} 🥃🌿</span>
        </div>
      ))}
    </div>
  );
}
