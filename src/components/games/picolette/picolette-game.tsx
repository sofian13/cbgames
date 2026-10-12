"use client";

/**
 * La Tournée — jeu d'ambiance 100 % oral, pour la soirée sur le canapé.
 * Un seul téléphone passe entre les mains. Le tel ne sert qu'à : tirer une carte,
 * désigner un perdant, faire tourner la roulette des peines (gorgées ou gage).
 *
 * Pas de tap rapide, pas de vote sur le tel, pas de mini-jeux écran.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { MascotAvatar } from "@/components/Mascot";
import { PlayersSetup, colorForIndex } from "@/components/games/local-kit";
import { useAudio } from "@/lib/hooks/useAudio";
import { sfxCardPlay, sfxTrickWin, sfxHandChime } from "@/lib/card-sfx";
import {
  type PicoletteCard, type Pack,
  PICOLETTE_CARDS, PACK_INFO, TYPE_INFO, GAGES,
  filterDeck, shuffleDeck,
} from "./cards";

const ACCENT = "#FF3EA5";
const BG_GRAD = `radial-gradient(circle at 50% 12%, ${ACCENT}30, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`;
const SAFE_TOP = "max(env(safe-area-inset-top), 12px)";
const SAFE_BOTTOM = "max(env(safe-area-inset-bottom), 12px)";

/** "mix" = la roulette tire entre gorgées (1 à 3) et gage ; "gage" = gages seulement. */
type PenaltyMode = "mix" | "gage";

/** Résultat de la roulette. */
type PenaltyResult = { kind: "sips"; n: number } | { kind: "gage"; text: string } | { kind: "shield" };

interface ActiveRule {
  text: string;
  startedAt: number;
  durationMs: number;
}

type PickMode = "loss" | "rule" | "shield";

export default function PicoletteGame({ onReturnToLobby }: GameProps) {
  type Phase = "setup" | "packs" | "intro" | "play" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [losses, setLosses] = useState<number[]>([]);
  const [shields, setShields] = useState<boolean[]>([]);
  // Coquin / Trash (18+) ne sont PAS cochés par défaut
  const [packs, setPacks] = useState<Set<Pack>>(new Set<Pack>(["soft", "quiz"]));
  const [penaltyMode, setPenaltyMode] = useState<PenaltyMode>("mix");
  const [deck, setDeck] = useState<PicoletteCard[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [activeRule, setActiveRule] = useState<ActiveRule | null>(null);
  const [ruleToast, setRuleToast] = useState<string | null>(null);
  const [pickMode, setPickMode] = useState<PickMode | null>(null); // overlay "qui perd"
  const [rouletteFor, setRouletteFor] = useState<number | null>(null); // joueur qui prend la peine
  const [rouletteSym, setRouletteSym] = useState<string>("…");
  const [rouletteResult, setRouletteResult] = useState<PenaltyResult | null>(null);
  const [rouletteAdvance, setRouletteAdvance] = useState(false); // passer à la carte suivante après
  const [lastLoserIdx, setLastLoserIdx] = useState<number | null>(null); // pour l'undo
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { muted } = useAudio();
  const audioGate = !muted;

  const card = deck[cardIdx];

  // Nettoie la roulette si le composant est démonté en plein tirage
  useEffect(() => () => {
    if (spinRef.current) clearInterval(spinRef.current);
  }, []);

  // ── Timer pour la règle live ─────────────────────────────
  const [, setTick] = useState(0); // re-render à 250ms pour le compteur
  useEffect(() => {
    if (!activeRule) return;
    const t = setInterval(() => setTick((x) => x + 1), 250);
    return () => clearInterval(t);
  }, [activeRule]);
  const ruleRemaining = activeRule
    ? Math.max(0, activeRule.durationMs - (Date.now() - activeRule.startedAt))
    : 0;
  useEffect(() => {
    if (activeRule && ruleRemaining <= 0) setActiveRule(null);
  }, [activeRule, ruleRemaining]);

  // Toast « Nouvelle règle »
  useEffect(() => {
    if (!ruleToast) return;
    const t = setTimeout(() => setRuleToast(null), 3500);
    return () => clearTimeout(t);
  }, [ruleToast]);

  // ── Démarrage ─────────────────────────────────────────────
  const begin = (names: string[]) => {
    setPlayers(names);
    setLosses(names.map(() => 0));
    setShields(names.map(() => false));
    setLastLoserIdx(null);
    setPhase("packs");
  };

  const launch = () => {
    const d = shuffleDeck(filterDeck(packs));
    if (d.length === 0) return;
    setDeck(d);
    setCardIdx(0);
    setActiveRule(null);
    setPhase("intro");
  };

  // ── Avancer dans le deck ──────────────────────────────────
  const nextCard = () => {
    if (audioGate) sfxCardPlay();
    const next = cardIdx + 1;
    if (next >= deck.length) {
      // On rebat pour une partie infinie
      setDeck(shuffleDeck(filterDeck(packs)));
      setCardIdx(0);
    } else {
      setCardIdx(next);
    }
  };

  const activateRule = () => {
    if (!card || card.type !== "rule") return;
    const sec = card.ruleSec ?? 240;
    const replaced = activeRule && ruleRemaining > 0 ? activeRule.text : null;
    setActiveRule({ text: card.text, startedAt: Date.now(), durationMs: sec * 1000 });
    setRuleToast(replaced ? `Nouvelle règle : ${card.text} (remplace : ${replaced})` : `Nouvelle règle : ${card.text}`);
    nextCard();
  };

  // ── Désignation d'un perdant + roulette ───────────────────
  const onPick = (idx: number) => {
    const mode = pickMode;
    setPickMode(null);
    if (mode === "shield") {
      setShields((prev) => prev.map((s, i) => (i === idx ? true : s)));
      nextCard();
      return;
    }
    spinPenalty(idx, mode !== "rule");
  };

  const spinPenalty = (idx: number, advance: boolean) => {
    setRouletteFor(idx);
    setRouletteResult(null);
    setRouletteAdvance(advance);

    // Bouclier : la peine est annulée, le bouclier est consommé
    if (shields[idx]) {
      setShields((prev) => prev.map((s, i) => (i === idx ? false : s)));
      setRouletteSym("🛡️");
      setRouletteResult({ kind: "shield" });
      return;
    }

    if (audioGate) sfxTrickWin();
    let ticks = 0;
    const total = 14 + Math.floor(Math.random() * 6);
    if (spinRef.current) clearInterval(spinRef.current);
    spinRef.current = setInterval(() => {
      ticks++;
      setRouletteSym(penaltyMode === "gage" ? "🎭" : Math.random() < 0.5 ? "🥤" : "🎭");
      if (ticks >= total) {
        if (spinRef.current) clearInterval(spinRef.current);
        spinRef.current = null;
        const isGage = penaltyMode === "gage" || Math.random() < 0.5;
        const result: PenaltyResult = isGage
          ? { kind: "gage", text: GAGES[Math.floor(Math.random() * GAGES.length)] }
          : { kind: "sips", n: 1 + Math.floor(Math.random() * 3) }; // 1 à 3, jamais plus
        setRouletteSym(isGage ? "🎭" : "🥤");
        setRouletteResult(result);
        setLosses((prev) => prev.map((n, i) => (i === idx ? n + 1 : n)));
        setLastLoserIdx(idx);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(90);
      }
    }, 70);
  };

  const closeRoulette = () => {
    setRouletteFor(null);
    setRouletteSym("…");
    setRouletteResult(null);
    if (rouletteAdvance) nextCard();
  };

  const finishGame = () => { if (audioGate) sfxHandChime(true); setPhase("over"); };

  // Annule la dernière peine (erreur de joueur, ou joker Amnistie)
  const undoLastLoss = () => {
    if (lastLoserIdx == null) return;
    setLosses((prev) => prev.map((n, i) => (i === lastLoserIdx ? Math.max(0, n - 1) : n)));
    setLastLoserIdx(null);
  };

  // ── Render par phase ─────────────────────────────────────
  if (phase === "setup") {
    return (
      <PlayersSetup
        emoji="🍻" name="La Tournée" min={2} max={10}
        accent={ACCENT} onStart={begin} onBack={onReturnToLobby}
      />
    );
  }

  if (phase === "packs") {
    return (
      <PacksScreen
        packs={packs} setPacks={setPacks}
        penaltyMode={penaltyMode} setPenaltyMode={setPenaltyMode}
        onLaunch={launch} onBack={() => setPhase("setup")}
      />
    );
  }

  if (phase === "intro") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-white"
        style={{ background: BG_GRAD, paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }}>
        <div className="text-6xl mb-3">🍻</div>
        <h1 className="cb-display-lg mb-1">La Tournée</h1>
        <p className="text-sm text-center max-w-md" style={{ color: "var(--text-dim)" }}>
          Le tel ne sert qu&apos;à lire les cartes et désigner le perdant. Tout se joue à l&apos;oral, installés dans le canapé.
        </p>
        <div className="mt-7 w-full max-w-md rounded-3xl border p-5"
          style={{ borderColor: `${ACCENT}40`, background: "rgba(0,0,0,0.4)" }}>
          <p className="af-eyebrow text-center mb-2" style={{ color: ACCENT }}>Avant de commencer</p>
          <ul className="text-sm leading-relaxed space-y-1.5" style={{ color: "var(--text-dim)" }}>
            <li>· 18+. Personne ne prend le volant après la soirée.</li>
            <li>· La peine, c&apos;est 1 à 3 gorgées max… ou un gage soft.</li>
            <li>· Tu bois ce que tu veux : eau, soft, jus… ça compte pareil.</li>
            <li>· Personne n&apos;est obligé de boire, on peut toujours choisir le gage.</li>
            <li>· Les cartes sont des suggestions, vous adaptez.</li>
          </ul>
        </div>
        <button onClick={() => setPhase("play")} className="af-btn af-btn-primary mt-7 w-full max-w-md">
          OK, on lance
        </button>
      </div>
    );
  }

  if (phase === "play" && card) {
    const t = TYPE_INFO[card.type];
    const isJoker = card.type === "joker";
    return (
      <div className="relative flex min-h-[100svh] flex-col items-stretch px-4 text-white"
        style={{ background: BG_GRAD, paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }}>
        {/* Haut : fin de partie + règle active (coin haut-droit laissé à l'engrenage) */}
        <div className="flex items-start gap-2 pr-14">
          <button onClick={finishGame}
            className="min-h-[44px] shrink-0 rounded-full border border-white/15 bg-black/40 px-4 text-[13px] font-semibold active:bg-white/10">
            Fin
          </button>
          {activeRule && (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border bg-black/45 px-3 py-1.5 backdrop-blur-sm"
              style={{ borderColor: "#C58CFF66" }}>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] uppercase tracking-wider" style={{ color: "#C58CFFbb" }}>📝 Règle live · {formatTime(ruleRemaining)}</p>
                <p className="truncate text-[13px] font-semibold">{activeRule.text}</p>
              </div>
              <button onClick={() => setPickMode("rule")}
                className="min-h-[44px] shrink-0 rounded-full bg-white/10 px-3 text-[12px] font-semibold active:bg-white/20">
                Qqn a craqué
              </button>
            </div>
          )}
        </div>

        {/* Toast nouvelle règle */}
        {ruleToast && (
          <div className="pointer-events-none absolute inset-x-4 z-40 flex justify-center" style={{ top: `calc(${SAFE_TOP} + 56px)` }}>
            <p className="max-w-md rounded-2xl border px-4 py-2.5 text-center text-[13px] font-semibold backdrop-blur-md"
              style={{ borderColor: "#C58CFF88", background: "rgba(40,16,70,0.92)" }}>
              {ruleToast}
            </p>
          </div>
        )}

        {/* Carte */}
        <div className="mt-4 flex-1 flex flex-col items-stretch justify-center">
          <div key={cardIdx}
            className="w-full max-w-md mx-auto rounded-3xl border p-6 animate-[cardFlip_0.45s_ease]"
            style={{
              background: `linear-gradient(160deg, ${t.tint}28, rgba(0,0,0,0.5))`,
              borderColor: `${t.tint}88`,
              boxShadow: `0 0 50px ${t.tint}44`,
            }}>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: t.tint, borderColor: `${t.tint}66`, background: `${t.tint}1a` }}>
                <span className="text-sm">{t.emoji}</span>{t.label}
              </span>
              <span className="text-[12px] text-white/30 cb-mono">{cardIdx + 1} / {deck.length}</span>
            </div>
            <p className="text-2xl md:text-3xl font-serif font-semibold text-white text-center leading-snug break-words hyphens-auto">
              {card.text}
            </p>
            {card.type === "prefere" && card.a && card.b && (
              <div className="mt-4 space-y-2">
                <div className="rounded-2xl border px-4 py-3 flex items-center gap-3"
                  style={{ borderColor: `${t.tint}66`, background: `${t.tint}14` }}>
                  <span className="text-2xl">☝️</span>
                  <div className="flex-1">
                    <p className="text-[12px] uppercase tracking-wider mb-0.5" style={{ color: t.tint }}>Main en haut</p>
                    <p className="text-base font-semibold text-white leading-snug">{card.a}</p>
                  </div>
                </div>
                <div className="rounded-2xl border px-4 py-3 flex items-center gap-3"
                  style={{ borderColor: `${t.tint}66`, background: `${t.tint}14` }}>
                  <span className="text-2xl">👇</span>
                  <div className="flex-1">
                    <p className="text-[12px] uppercase tracking-wider mb-0.5" style={{ color: t.tint }}>Main en bas</p>
                    <p className="text-base font-semibold text-white leading-snug">{card.b}</p>
                  </div>
                </div>
              </div>
            )}
            {card.hint && (
              <p className="mt-3 text-[13px] text-center" style={{ color: "var(--text-dim)" }}>
                {card.hint}
              </p>
            )}
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="mt-4 w-full max-w-md mx-auto space-y-2">
          {card.type === "rule" ? (
            <button onClick={activateRule}
              className="w-full py-4 rounded-2xl font-sans text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #C58CFF, #7A4EE8)", boxShadow: "0 0 25px #7A4EE855" }}>
              Activer la règle ({Math.round((card.ruleSec ?? 240) / 60)} min) →
            </button>
          ) : isJoker ? (
            <JokerAction
              effect={card.joker ?? "none"}
              canUndo={lastLoserIdx != null}
              onPick={() => setPickMode("loss")}
              onShield={() => setPickMode("shield")}
              onAmnesty={() => { undoLastLoss(); nextCard(); }}
            />
          ) : (
            <button onClick={() => setPickMode("loss")}
              className="w-full py-4 rounded-2xl font-sans text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #C71B7A)`, boxShadow: `0 0 25px ${ACCENT}55` }}>
              🎲 Désigner un perdant
            </button>
          )}
          <button onClick={nextCard}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white/70 border border-white/15 bg-white/[0.04]">
            {isJoker ? "Carte suivante →" : "Personne ne perd · Carte suivante →"}
          </button>
        </div>

        {/* Undo dernière peine (si on s'est planté de joueur) */}
        {lastLoserIdx != null && (
          <div className="mt-2 flex justify-center">
            <button onClick={undoLastLoss}
              className="min-h-[44px] rounded-full border border-white/20 bg-black/40 px-4 text-[13px] text-white/70 active:bg-white/10 active:text-white">
              ↩ Annuler la peine de {players[lastLoserIdx]}
            </button>
          </div>
        )}

        {/* Récap des peines */}
        <LossRecap players={players} losses={losses} shields={shields} highlight={lastLoserIdx ?? -1} />

        {pickMode && (
          <PickerOverlay
            title={pickMode === "shield" ? "Qui reçoit le bouclier ?" : pickMode === "rule" ? "Qui a craqué ?" : "Qui perd cette manche ?"}
            players={players}
            shields={shields}
            onPick={onPick}
            onCancel={() => setPickMode(null)}
          />
        )}

        {rouletteFor != null && (
          <RouletteOverlay
            sym={rouletteSym}
            playerName={players[rouletteFor]}
            result={rouletteResult}
            onDone={closeRoulette}
          />
        )}
      </div>
    );
  }

  // FIN
  const ranking = players
    .map((name, i) => ({ name, i, losses: losses[i] }))
    .sort((a, b) => b.losses - a.losses);
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-white"
      style={{ background: BG_GRAD, paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }}>
      <p className="af-eyebrow" style={{ color: ACCENT }}>Fin de partie</p>
      <h2 className="cb-display-lg mt-1 mb-5">🍻 Le palmarès</h2>
      <p className="text-[13px] mb-3" style={{ color: "var(--text-dim)" }}>Plus tu as ramassé de peines, plus t&apos;as fait le show.</p>
      <div className="w-full max-w-sm space-y-2">
        {ranking.map((p, idx) => (
          <div key={p.i} className="flex items-center justify-between rounded-2xl border p-4"
            style={{
              background: idx === 0 ? `${ACCENT}22` : "rgba(255,255,255,0.04)",
              borderColor: idx === 0 ? `${ACCENT}55` : "var(--line-soft)",
            }}>
            <div className="flex items-center gap-3">
              <span className="cb-mono w-7 font-bold" style={{ color: idx === 0 ? ACCENT : "var(--text-muted)" }}>#{idx + 1}</span>
              <MascotAvatar color={colorForIndex(p.i)} size={34} mood={idx === 0 ? "rofl" : "happy"} />
              <span className="font-bold">{p.name}</span>
            </div>
            <span className="cb-mono font-bold text-sm" style={{ color: idx === 0 ? ACCENT : "#fff" }}>
              {p.losses} peine{p.losses > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px]" style={{ color: "var(--text-dim)" }}>Un grand verre d&apos;eau et personne ne conduit 💧</p>
      <div className="mt-6 flex gap-2">
        <button onClick={() => setPhase("setup")} className="af-btn af-btn-ghost">Rejouer</button>
        {onReturnToLobby && <button onClick={onReturnToLobby} className="af-btn af-btn-primary">Lobby</button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function JokerAction({
  effect, canUndo, onPick, onShield, onAmnesty,
}: {
  effect: NonNullable<PicoletteCard["joker"]>;
  canUndo: boolean;
  onPick: () => void;
  onShield: () => void;
  onAmnesty: () => void;
}) {
  const style = { background: "linear-gradient(135deg, #9B7BFF, #5B36D6)", boxShadow: "0 0 25px #7A4EE855" };
  const cls = "w-full py-4 rounded-2xl font-sans text-sm font-semibold text-white disabled:opacity-40";
  if (effect === "pick") return <button onClick={onPick} className={cls} style={style}>🃏 Choisir qui prend la peine</button>;
  if (effect === "shield") return <button onClick={onShield} className={cls} style={style}>🛡️ Donner le bouclier à…</button>;
  if (effect === "amnesty") {
    return (
      <button onClick={onAmnesty} disabled={!canUndo} className={cls} style={style}>
        {canUndo ? "🕊️ Annuler la dernière peine" : "Aucune peine à annuler"}
      </button>
    );
  }
  return null;
}

function PacksScreen({
  packs, setPacks, penaltyMode, setPenaltyMode, onLaunch, onBack,
}: {
  packs: Set<Pack>;
  setPacks: (s: Set<Pack>) => void;
  penaltyMode: PenaltyMode;
  setPenaltyMode: (p: PenaltyMode) => void;
  onLaunch: () => void;
  onBack: () => void;
}) {
  const togglePack = (p: Pack) => {
    const next = new Set(packs);
    if (next.has(p)) next.delete(p); else next.add(p);
    if (next.size === 0) next.add(p); // au moins 1 pack
    setPacks(next);
  };
  const total = useMemo(() => filterDeck(packs).length, [packs]);

  return (
    <div className="flex min-h-[100svh] flex-col items-center px-6 text-white"
      style={{ background: BG_GRAD, paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }}>
      <div className="text-5xl mb-2 mt-2">🍻</div>
      <h1 className="cb-display-md mb-1">La Tournée</h1>
      <p className="text-[13px] mb-6" style={{ color: "var(--text-dim)" }}>Choisis tes packs.</p>

      <div className="grid w-full max-w-md grid-cols-1 gap-2">
        {(Object.keys(PACK_INFO) as Pack[]).map((p) => {
          const info = PACK_INFO[p];
          const active = packs.has(p);
          const count = PICOLETTE_CARDS.filter((c) => c.pack === p).length;
          return (
            <button key={p} onClick={() => togglePack(p)}
              className={cn("w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
                active ? "shadow-lg" : "active:bg-white/[0.04]")}
              style={{
                borderColor: active ? `${info.tint}aa` : "rgba(255,255,255,0.10)",
                background: active ? `${info.tint}1e` : "rgba(0,0,0,0.32)",
                boxShadow: active ? `0 0 25px ${info.tint}44` : undefined,
              }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-base" style={{ color: active ? info.tint : "#fff" }}>
                    {info.label}
                    {info.adult && <span className="ml-2 rounded-full border border-white/25 px-1.5 py-0.5 text-[12px] text-white/70">18+</span>}
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>{info.sub} · {count} cartes</p>
                </div>
                <div className="text-2xl">{active ? "✓" : "○"}</div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="af-eyebrow mt-6 mb-2" style={{ color: ACCENT }}>La peine</p>
      <div className="grid w-full max-w-md grid-cols-2 gap-2">
        {([
          { v: "mix", emoji: "🥤🎭", label: "Gorgées (1 à 3) ou gage" },
          { v: "gage", emoji: "🎭", label: "Gages seulement" },
        ] as { v: PenaltyMode; emoji: string; label: string }[]).map((o) => (
          <button key={o.v} onClick={() => setPenaltyMode(o.v)}
            className={cn("rounded-2xl border px-2 py-3 text-center transition-all active:scale-[0.97]",
              o.v === penaltyMode ? "shadow-lg" : "active:bg-white/[0.04]")}
            style={{
              borderColor: o.v === penaltyMode ? `${ACCENT}aa` : "rgba(255,255,255,0.10)",
              background: o.v === penaltyMode ? `${ACCENT}1e` : "rgba(0,0,0,0.32)",
            }}>
            <p className="text-xl">{o.emoji}</p>
            <p className="text-[13px] mt-1 font-semibold">{o.label}</p>
          </button>
        ))}
      </div>
      <p className="mt-2 max-w-md text-center text-[12px] text-white/45">
        La roulette tire au hasard. Les gorgées, c&apos;est de ce que tu veux : eau, soft, jus…
      </p>

      <p className="text-[12px] text-white/40 mt-4">{total} cartes au total</p>

      <button onClick={onLaunch} disabled={total === 0}
        className="af-btn af-btn-primary mt-6 w-full max-w-md disabled:opacity-40">
        Commencer la partie
      </button>
      <button onClick={onBack} className="mt-3 min-h-[44px] px-4 text-sm text-white/50">← Modifier les joueurs</button>
    </div>
  );
}

function PickerOverlay({
  title, players, shields, onPick, onCancel,
}: { title: string; players: string[]; shields: boolean[]; onPick: (i: number) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto px-6 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.78)", paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }}>
      <p className="af-eyebrow mb-4" style={{ color: ACCENT }}>{title}</p>
      <div className="w-full max-w-md space-y-2">
        {players.map((name, i) => (
          <button key={i} onClick={() => onPick(i)}
            className="w-full rounded-2xl border border-white/20 bg-white/[0.05] p-4 flex items-center gap-3 active:bg-white/[0.1] active:scale-[0.98]">
            <MascotAvatar color={colorForIndex(i)} size={36} mood="sad" />
            <span className="flex-1 text-left font-bold">{name}</span>
            <span className="text-xl">{shields[i] ? "🛡️" : "🎲"}</span>
          </button>
        ))}
      </div>
      <button onClick={onCancel} className="mt-5 min-h-[44px] px-4 text-sm text-white/60 underline">Annuler</button>
    </div>
  );
}

function RouletteOverlay({
  sym, playerName, result, onDone,
}: { sym: string; playerName: string; result: PenaltyResult | null; onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.85)", paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM }}>
      <p className="af-eyebrow mb-3" style={{ color: ACCENT }}>{playerName} prend la peine</p>
      <div className="flex h-40 w-40 items-center justify-center rounded-[2rem] border bg-black/60 text-[88px]"
        style={{ borderColor: `${ACCENT}aa`, boxShadow: `0 0 80px ${ACCENT}88` }}>
        {sym}
      </div>
      {result ? (
        <>
          <p className="mt-5 max-w-sm text-center text-xl font-bold leading-snug text-white">
            {result.kind === "sips"
              ? `${result.n} gorgée${result.n > 1 ? "s" : ""} (eau ou soft, ça compte)`
              : result.kind === "gage"
                ? result.text
                : "Bouclier ! Peine annulée."}
          </p>
          <p className="mt-2 text-[13px]" style={{ color: "var(--text-dim)" }}>
            {result.kind === "shield" ? "Le bouclier est cassé, profites-en." : "La Tournée ne pardonne pas."}
          </p>
          <button onClick={onDone} className="af-btn af-btn-primary mt-6 w-full max-w-xs">
            C&apos;est fait →
          </button>
        </>
      ) : (
        <p className="mt-4 text-sm" style={{ color: "var(--text-dim)" }}>La roulette tourne…</p>
      )}
    </div>
  );
}

function LossRecap({
  players, losses, shields, highlight = -1,
}: { players: string[]; losses: number[]; shields: boolean[]; highlight?: number }) {
  return (
    <div className="mt-3 flex w-full max-w-md mx-auto flex-wrap items-center justify-center gap-1.5">
      {players.map((name, i) => {
        const hot = i === highlight;
        return (
          <div key={i}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all",
              hot ? "scale-105" : ""
            )}
            style={hot
              ? { borderColor: `${ACCENT}88`, background: `${ACCENT}22`, boxShadow: `0 0 18px ${ACCENT}55` }
              : { borderColor: "rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.3)" }}>
            <MascotAvatar color={colorForIndex(i)} size={16} mood={hot ? "sad" : "happy"} />
            <span className="font-semibold text-[12px]">{name}{shields[i] ? " 🛡️" : ""}</span>
            <span className="text-white/30">·</span>
            <span className="cb-mono text-[12px]" style={{ color: hot ? "#fff" : "rgba(255,255,255,0.7)" }}>{losses[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
