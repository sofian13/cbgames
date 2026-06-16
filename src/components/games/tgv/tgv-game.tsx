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
  const [, setBet] = useState<"plus" | "moins" | "egalite" | null>(null);
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [rouletteSym, setRouletteSym] = useState("…");
  const [suspending, setSuspending] = useState(false); // roulement de tambour avant la dernière carte

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

  // Auto-déclenche la roulette quand on perd ou qu'on fait égalité
  // (court délai pour laisser voir la carte suivante + le verdict)
  useEffect(() => {
    if (verdict !== "loss" && verdict !== "tie") return;
    const startTimer = setTimeout(() => {
      setRouletteOpen(true);
      setRouletteSym("…");
      let ticks = 0;
      const total = 14 + Math.floor(Math.random() * 6);
      const spinInt = setInterval(() => {
        ticks++;
        setRouletteSym(Math.random() < 0.5 ? "🥃" : "🌿");
        if (ticks >= total) {
          clearInterval(spinInt);
          const final = rouletteOutcome(penalty);
          setRouletteSym(final);
          setLosses((prev) => prev.map((n, i) => (i === currentIdx ? n + 1 : n)));
          setTimeout(() => {
            setRouletteOpen(false);
            // Tie = on bois mais on reste sur le tas.
            // Loss = retour à zéro.
            if (verdict === "loss") { setPileIdx(0); setConquered(0); }
            setCard(drawCard());
            setNextCard(null);
            setVerdict(null);
            setBet(null);
            setRouletteSym("…");
          }, 1700);
        }
      }, 70);
    }, 950); // laisse voir la carte suivante avant la roulette
    return () => clearTimeout(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdict]);

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
    setRouletteOpen(false);
    setRouletteSym("…");
    setPhase("intro");
  };

  const makeBet = (b: "plus" | "moins" | "egalite") => {
    if (verdict || suspending) return;
    const next = drawCard();
    let v: "win" | "loss" | "tie" = "tie";
    if (next.v === card.v) v = b === "egalite" ? "win" : "tie";
    else if (b === "egalite") v = "loss";
    else if (b === "plus") v = next.v > card.v ? "win" : "loss";
    else v = next.v < card.v ? "win" : "loss";
    setBet(b);
    setNextCard(next);

    // 🥁 Suspense sur la DERNIÈRE carte du TGV : on attend ~1.6s
    // avant de révéler la carte et le verdict.
    const isLast = pileIdx === totalPiles - 1;
    if (isLast) {
      setSuspending(true);
      if (audioGate) sfxCardPlay();
      setTimeout(() => {
        setSuspending(false);
        setVerdict(v);
      }, 1700);
    } else {
      setVerdict(v);
    }
  };

  // Bouton « Tas suivant » après une bonne réponse
  const advanceAfterWin = () => {
    if (verdict !== "win") return;
    const nextPile = pileIdx + 1;
    const newConquered = conquered + 1;
    setConquered(newConquered);
    if (nextPile >= totalPiles) {
      if (audioGate) sfxHandChime(true);
      setPhase("win");
    } else {
      setPileIdx(nextPile);
      setCard(nextCard!);
      setNextCard(null);
      setVerdict(null);
      setBet(null);
    }
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
      <div className="flex flex-1 flex-row items-center justify-center gap-6 p-4 text-white"
        style={{ background: BG_GRAD, minHeight: "100svh" }}>
        <Mascot size={92} color={colorForIndex(currentIdx)} mood="wink" arms />
        <div className="flex flex-col items-start max-w-md">
          <p className="af-eyebrow" style={{ color: ACCENT }}>À toi de monter dans le TGV</p>
          <h1 className="cb-display-md mt-1">{currentName}</h1>
          <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
            {totalPiles} tas à enchaîner sans erreur. Plus ou moins ?
            Tu te plantes → roulette {penalty === "any" ? "🥃 ou 🌿" : penalty === "shot" ? "🥃" : "🌿"} + retour à zéro.
          </p>
          <button onClick={() => setPhase("play")}
            className="mt-3 py-2.5 px-5 rounded-2xl font-semibold text-white text-sm"
            style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 22px ${ACCENT}55` }}>
            Embarquer 🚄
          </button>
        </div>
      </div>
    );
  }

  if (phase === "play") {
    return (
      <div className="relative flex flex-1 flex-col text-white overflow-hidden"
        style={{ background: BG_GRAD, minHeight: "100svh" }}>
        {/* Top bar : train + ribbon + chips de peines + fin */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <TrainProgress total={totalPiles} conquered={conquered} pileIdx={pileIdx} compact />
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 shrink-0">
            <MascotAvatar color={colorForIndex(currentIdx)} size={22} mood="wink" />
            <span className="text-xs font-bold">{currentName}</span>
            <span className="text-[10px] text-white/45 cb-mono">{pileIdx + 1}/{totalPiles}</span>
          </div>
          <div className="flex-1 flex justify-end gap-1.5 overflow-hidden">
            {players.map((name, i) => (
              <div key={i}
                className={cn("flex items-center gap-1 rounded-full border px-1.5 py-0.5 shrink-0",
                  i === currentIdx ? "border-white/30 bg-white/[0.08]" : "border-white/10 bg-black/30")}>
                <MascotAvatar color={colorForIndex(i)} size={14} mood="happy" />
                <span className="cb-mono text-[10px] text-white/75">{losses[i]}</span>
              </div>
            ))}
          </div>
          <button onClick={finishGame}
            className="rounded-full border border-white/15 bg-black/40 px-2 py-1 text-[10px] shrink-0">Fin</button>
        </div>

        {/* Center : card à gauche, contrôles à droite */}
        <div className="flex-1 flex flex-row items-center justify-center gap-4 px-4 py-2 min-h-0">
          {/* Card stack */}
          <div className="flex items-center gap-2 shrink-0">
            <PlayingCard card={card} highlight={!verdict && !suspending} />
            {(verdict || suspending) && (
              <>
                <span className="text-2xl text-white/40">→</span>
                {suspending ? <MysteryCard /> : nextCard ? <PlayingCard card={nextCard} small /> : null}
              </>
            )}
          </div>

          {/* Côté droit : verdict + boutons */}
          <div className="flex flex-col justify-center gap-2 w-40 sm:w-52">
            {suspending ? (
              <div className="text-center">
                <div className="text-4xl mb-1 animate-bounce">🥁</div>
                <p className="cb-display-sm" style={{ color: ACCENT, textShadow: `0 0 14px ${ACCENT}88` }}>
                  Allez…
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                  Dernière carte du TGV. Roule, roule, roule…
                </p>
              </div>
            ) : !verdict ? (
              <>
                <p className="text-[10px] uppercase tracking-wider text-white/40 text-center mb-1">
                  {pileIdx === totalPiles - 1 ? "Dernière carte · TGV final 🚄" : "Prochaine carte ?"}
                </p>
                <BetButton label="PLUS" icon="↑" tint="#FF6B5B" onClick={() => makeBet("plus")} compact />
                <BetButton label="ÉGALITÉ" icon="=" tint="#FFD23F" onClick={() => makeBet("egalite")} compact />
                <BetButton label="MOINS" icon="↓" tint="#5BA3FF" onClick={() => makeBet("moins")} compact />
              </>
            ) : verdict === "win" ? (
              <>
                <p className="cb-display-sm text-center" style={{ color: "#3DDC97" }}>✅ Bien vu !</p>
                <button onClick={advanceAfterWin}
                  className="w-full py-3 rounded-2xl font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 25px ${ACCENT}55` }}>
                  {pileIdx === totalPiles - 1 ? "TGV terminé 🚄" : "Tas suivant →"}
                </button>
              </>
            ) : (
              <p className="cb-display-sm text-center"
                style={{ color: verdict === "tie" ? "#FFD23F" : ACCENT }}>
                {verdict === "tie" ? "🟡 Égalité" : "💥 Raté"}
                <span className="block text-xs text-white/50 mt-1 normal-case">Roulette de la peine…</span>
              </p>
            )}
          </div>
        </div>

        {/* Roulette en overlay quand on perd / égalité */}
        {rouletteOpen && (
          <RouletteOverlay sym={rouletteSym} playerName={currentName} />
        )}
      </div>
    );
  }

  if (phase === "win") {
    return (
      <div className="flex flex-1 flex-row items-center justify-center gap-6 p-4 text-white"
        style={{ background: BG_GRAD, minHeight: "100svh" }}>
        <div className="text-7xl animate-[pulse_1.4s_ease_infinite]">🚄</div>
        <div className="flex flex-col items-start max-w-md">
          <p className="af-eyebrow" style={{ color: ACCENT }}>TGV terminé</p>
          <h2 className="cb-display-md mt-1 mb-1">{currentName} a passé tous les tas !</h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-dim)" }}>
            Pas une goutte. Bravo champion·ne — à ton tour de regarder les autres galérer.
          </p>
          <div className="flex gap-2">
            <button onClick={nextPlayer}
              className="py-2 px-4 rounded-2xl font-semibold text-white text-sm"
              style={{ background: `linear-gradient(135deg, #2bd47a, ${ACCENT})`, boxShadow: `0 0 22px ${ACCENT}55` }}>
              Joueur suivant →
            </button>
            <button onClick={finishGame} className="py-2 px-4 rounded-2xl text-sm border border-white/15 bg-black/30">
              Terminer
            </button>
          </div>
        </div>
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

function TrainProgress({ total, conquered, pileIdx, compact }: { total: number; conquered: number; pileIdx: number; compact?: boolean }) {
  const wagons = useMemo(() => Array.from({ length: total }, (_, i) => i), [total]);
  const sz = compact ? "h-6 w-7" : "h-8 w-10";
  const txt = compact ? "text-[10px]" : "text-xs";
  return (
    <div className={cn("flex items-center gap-1 shrink-0", compact ? "" : "mt-4 gap-1.5")}>
      <span className={compact ? "text-lg mr-0.5" : "text-2xl mr-1"}>🚂</span>
      {wagons.map((i) => {
        const done = i < conquered;
        const here = i === pileIdx;
        return (
          <div key={i}
            className={cn(sz, "rounded-md border flex items-center justify-center font-bold transition-all", txt)}
            style={{
              background: done ? "#3DDC97" : here ? `${ACCENT}40` : "rgba(255,255,255,0.04)",
              borderColor: done ? "#1AA66A" : here ? `${ACCENT}aa` : "rgba(255,255,255,0.10)",
              color: done ? "#0a0420" : "#fff",
              boxShadow: here && !done ? `0 0 12px ${ACCENT}55` : undefined,
            }}>
            {done ? "✓" : i + 1}
          </div>
        );
      })}
    </div>
  );
}

function PlayingCard({ card, highlight, small }: { card: Card; highlight?: boolean; small?: boolean }) {
  // Tailles compactes pour tenir en landscape téléphone sans scroll
  const w = small ? 64 : 110;
  const h = small ? 90 : 154;
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

function MysteryCard() {
  return (
    <div
      className="rounded-2xl border-2 flex items-center justify-center animate-pulse"
      style={{
        width: 64, height: 90,
        borderColor: `${ACCENT}cc`,
        background: `linear-gradient(135deg, #1a0a2e, #2a0f4a)`,
        boxShadow: `0 0 35px ${ACCENT}88`,
      }}>
      <span className="text-3xl font-bold" style={{ color: ACCENT, textShadow: `0 0 12px ${ACCENT}` }}>?</span>
    </div>
  );
}

function BetButton({ label, icon, tint, onClick, compact }: { label: string; icon: string; tint: string; onClick: () => void; compact?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn(
        "rounded-2xl text-center font-bold text-white transition-all hover:brightness-110 active:scale-[0.97] flex items-center justify-center gap-2",
        compact ? "py-2.5 px-3" : "py-6"
      )}
      style={{
        background: `linear-gradient(135deg, ${tint}, ${tint}88)`,
        boxShadow: `0 0 22px ${tint}55`,
      }}>
      <div className={compact ? "text-2xl" : "text-4xl mb-1"}>{icon}</div>
      <div className={cn("cb-mono tracking-wider", compact ? "text-sm" : "text-sm")}>{label}</div>
    </button>
  );
}

function RouletteOverlay({ sym, playerName }: { sym: string; playerName: string }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.85)" }}>
      <p className="af-eyebrow mb-3" style={{ color: ACCENT }}>{playerName} prend la peine</p>
      <div className="flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center rounded-[2rem] border bg-black/60 text-[72px] sm:text-[100px]"
        style={{ borderColor: `${ACCENT}aa`, boxShadow: `0 0 80px ${ACCENT}88` }}>
        {sym}
      </div>
      <p className="mt-3 text-xs sm:text-sm" style={{ color: "var(--text-dim)" }}>Allez, santé. 🥂</p>
    </div>
  );
}
