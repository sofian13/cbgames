"use client";

/**
 * Picolette — Picolo-like, 100% oral, pour la voiture / le canapé / la fin de soirée.
 * Un seul téléphone passe entre les mains. Le tel ne sert qu'à : tirer une carte,
 * désigner un perdant, faire tourner la roulette 🥃 / 🌿.
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
  PICOLETTE_CARDS, PACK_INFO, TYPE_INFO,
  filterDeck, shuffleDeck,
} from "./cards";

const ACCENT = "#FF3EA5";
const BG_GRAD = `radial-gradient(circle at 50% 12%, ${ACCENT}30, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`;

type Penalty = "shot" | "cbd" | "any";

interface ActiveRule {
  text: string;
  startedAt: number;
  durationMs: number;
}

export default function PicoletteGame({ onReturnToLobby }: GameProps) {
  type Phase = "setup" | "packs" | "intro" | "play" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [losses, setLosses] = useState<number[]>([]);
  const [packs, setPacks] = useState<Set<Pack>>(new Set<Pack>(["soft", "coquin", "musique", "quiz"]));
  const [penalty, setPenalty] = useState<Penalty>("any");
  const [deck, setDeck] = useState<PicoletteCard[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [activeRule, setActiveRule] = useState<ActiveRule | null>(null);
  const [picking, setPicking] = useState(false); // overlay "qui perd"
  const [pickingFromRule, setPickingFromRule] = useState(false);
  const [rouletteFor, setRouletteFor] = useState<number | null>(null); // index du joueur qui boit
  const [rouletteSym, setRouletteSym] = useState<string>("…");
  const [lastLoserIdx, setLastLoserIdx] = useState<number | null>(null); // pour l'undo

  const { muted } = useAudio();
  const audioGate = !muted;

  const card = deck[cardIdx];

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

  // ── Démarrage ─────────────────────────────────────────────
  const begin = (names: string[]) => {
    setPlayers(names);
    setLosses(names.map(() => 0));
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
    setCardIdx((i) => {
      const next = i + 1;
      if (next >= deck.length) {
        // reshuffle pour partie infinie
        const d = shuffleDeck(filterDeck(packs));
        setDeck(d);
        return 0;
      }
      return next;
    });
  };

  const activateRule = () => {
    if (!card || card.type !== "rule") return;
    const sec = card.ruleSec ?? 240;
    setActiveRule({ text: card.text, startedAt: Date.now(), durationMs: sec * 1000 });
    nextCard();
  };

  // ── Désignation d'un perdant + roulette ───────────────────
  const openPicker = (fromRule = false) => {
    setPickingFromRule(fromRule);
    setPicking(true);
  };

  const pickLoser = (idx: number) => {
    setPicking(false);
    // anime la roulette
    setRouletteFor(idx);
    if (audioGate) sfxTrickWin();
    let ticks = 0;
    const total = 14 + Math.floor(Math.random() * 6);
    const spin = setInterval(() => {
      ticks++;
      setRouletteSym(Math.random() < 0.5 ? "🥃" : "🌿");
      if (ticks >= total) {
        clearInterval(spin);
        const final = penalty === "shot" ? "🥃" : penalty === "cbd" ? "🌿" : Math.random() < 0.5 ? "🥃" : "🌿";
        setRouletteSym(final);
        setLosses((prev) => prev.map((n, i) => (i === idx ? n + 1 : n)));
        setLastLoserIdx(idx);
        // petite vibration au moment où la peine tombe (si l'appareil le supporte)
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(90);
        setTimeout(() => {
          setRouletteFor(null);
          setRouletteSym("…");
          if (!pickingFromRule) nextCard();
          setPickingFromRule(false);
        }, 1800);
      }
    }, 70);
  };

  const finishGame = () => { if (audioGate) sfxHandChime(true); setPhase("over"); };

  // Annule la dernière peine désignée (au cas où on se serait planté de joueur)
  const undoLastLoss = () => {
    if (lastLoserIdx == null) return;
    setLosses((prev) => prev.map((n, i) => (i === lastLoserIdx ? Math.max(0, n - 1) : n)));
    setLastLoserIdx(null);
  };

  // ── Render par phase ─────────────────────────────────────
  if (phase === "setup") {
    return (
      <PlayersSetup
        emoji="🍻" name="Picolette" min={2} max={10}
        accent={ACCENT} onStart={begin} onBack={onReturnToLobby}
      />
    );
  }

  if (phase === "packs") {
    return (
      <PacksScreen
        packs={packs} setPacks={setPacks}
        penalty={penalty} setPenalty={setPenalty}
        onLaunch={launch} onBack={() => setPhase("setup")}
      />
    );
  }

  if (phase === "intro") {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
        style={{ background: BG_GRAD }}>
        <div className="text-6xl mb-3">🍻</div>
        <h1 className="cb-display-lg mb-1">Picolette</h1>
        <p className="text-sm text-center max-w-md" style={{ color: "var(--text-dim)" }}>
          Le tel ne sert qu'à lire les cartes et désigner le perdant. Tout se joue à l'oral.
        </p>
        <div className="mt-7 w-full max-w-md rounded-3xl border p-5"
          style={{ borderColor: `${ACCENT}40`, background: "rgba(0,0,0,0.4)" }}>
          <p className="af-eyebrow text-center mb-2" style={{ color: ACCENT }}>Avant de commencer</p>
          <ul className="text-sm leading-relaxed space-y-1.5" style={{ color: "var(--text-dim)" }}>
            <li>· 18+. Conducteur sobre obligatoire.</li>
            <li>· Bois avec modération. Pas obligé, on s'amuse.</li>
            <li>· Les cartes sont des suggestions, vous adaptez.</li>
            <li>· Tout se passe à l'oral, restez ceinturés.</li>
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
    return (
      <div className="relative flex min-h-[100svh] flex-col items-stretch p-4 text-white"
        style={{ background: BG_GRAD }}>
        {/* Top: rule banner + finish */}
        <div className="flex items-start gap-2">
          {activeRule && (
            <div className="flex-1 rounded-2xl border bg-black/45 px-3 py-2 backdrop-blur-sm flex items-center gap-2"
              style={{ borderColor: "#C58CFF66" }}>
              <span className="text-base">📝</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#C58CFFbb" }}>Règle live</p>
                <p className="text-xs font-semibold truncate">{activeRule.text}</p>
              </div>
              <span className="cb-mono text-xs text-white/70">{formatTime(ruleRemaining)}</span>
              <button onClick={() => openPicker(true)} className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold">
                Qq a craqué
              </button>
            </div>
          )}
          <button onClick={finishGame} className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs">
            Fin
          </button>
        </div>

        {/* Card */}
        <div className="mt-4 flex-1 flex flex-col items-stretch justify-center">
          <div key={cardIdx}
            className="w-full max-w-md mx-auto rounded-3xl border p-6 animate-[cardFlip_0.45s_ease]"
            style={{
              background: `linear-gradient(160deg, ${t.tint}28, rgba(0,0,0,0.5))`,
              borderColor: `${t.tint}88`,
              boxShadow: `0 0 50px ${t.tint}44`,
            }}>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: t.tint, borderColor: `${t.tint}66`, background: `${t.tint}1a` }}>
                <span className="text-sm">{t.emoji}</span>{t.label}
              </span>
              <span className="text-[10px] text-white/30 cb-mono">{cardIdx + 1} / {deck.length}</span>
            </div>
            <p className="text-2xl md:text-3xl font-serif font-semibold text-white text-center leading-snug">
              {card.text}
            </p>
            {card.type === "prefere" && card.a && card.b && (
              <div className="mt-4 space-y-2">
                <div className="rounded-2xl border px-4 py-3 flex items-center gap-3"
                  style={{ borderColor: `${t.tint}66`, background: `${t.tint}14` }}>
                  <span className="text-2xl">☝️</span>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: t.tint }}>Main en haut</p>
                    <p className="text-base font-semibold text-white leading-snug">{card.a}</p>
                  </div>
                </div>
                <div className="rounded-2xl border px-4 py-3 flex items-center gap-3"
                  style={{ borderColor: `${t.tint}66`, background: `${t.tint}14` }}>
                  <span className="text-2xl">👇</span>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: t.tint }}>Main en bas</p>
                    <p className="text-base font-semibold text-white leading-snug">{card.b}</p>
                  </div>
                </div>
              </div>
            )}
            {card.hint && (
              <p className="mt-3 text-xs text-center" style={{ color: "var(--text-dim)" }}>
                {card.hint}
              </p>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="w-full max-w-md mx-auto space-y-2">
          {card.type === "rule" ? (
            <button onClick={activateRule}
              className="w-full py-4 rounded-2xl font-sans text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #C58CFF, #7A4EE8)", boxShadow: "0 0 25px #7A4EE855" }}>
              Activer la règle ({Math.round((card.ruleSec ?? 240) / 60)} min) →
            </button>
          ) : (
            <button onClick={() => openPicker(false)}
              className="w-full py-4 rounded-2xl font-sans text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #C71B7A)`, boxShadow: `0 0 25px ${ACCENT}55` }}>
              🥃 Désigner un perdant
            </button>
          )}
          <button onClick={nextCard}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white/70 border border-white/15 bg-white/[0.04]">
            Personne perd · Carte suivante →
          </button>
        </div>

        {/* Undo dernière peine (si on s'est planté de joueur) */}
        {lastLoserIdx != null && (
          <div className="mt-2 flex justify-center">
            <button onClick={undoLastLoss}
              className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] text-white/65 hover:text-white/95 hover:bg-white/10 transition-all">
              ↩ Annuler la peine de {players[lastLoserIdx]}
            </button>
          </div>
        )}

        {/* Losses recap */}
        <LossRecap players={players} losses={losses} highlight={lastLoserIdx ?? -1} />

        {/* Picker overlay */}
        {picking && (
          <PickerOverlay players={players} onPick={pickLoser} onCancel={() => setPicking(false)} />
        )}

        {/* Roulette overlay */}
        {rouletteFor != null && (
          <RouletteOverlay sym={rouletteSym} playerName={players[rouletteFor]} />
        )}
      </div>
    );
  }

  // OVER
  const ranking = players
    .map((name, i) => ({ name, i, losses: losses[i] }))
    .sort((a, b) => b.losses - a.losses);
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-white"
      style={{ background: BG_GRAD }}>
      <p className="af-eyebrow" style={{ color: ACCENT }}>Fin de partie</p>
      <h2 className="cb-display-lg mt-1 mb-5">🍻 Le palmarès</h2>
      <p className="text-xs mb-3" style={{ color: "var(--text-dim)" }}>Plus tu as ramassé, mieux t'as joué (ou pas).</p>
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
              {p.losses} 🥃🌿
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
function PacksScreen({
  packs, setPacks, penalty, setPenalty, onLaunch, onBack,
}: {
  packs: Set<Pack>;
  setPacks: (s: Set<Pack>) => void;
  penalty: Penalty;
  setPenalty: (p: Penalty) => void;
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
    <div className="flex min-h-[100svh] flex-col items-center p-6 text-white"
      style={{ background: BG_GRAD }}>
      <div className="text-5xl mb-2 mt-2">🍻</div>
      <h1 className="cb-display-md mb-1">Picolette</h1>
      <p className="text-xs mb-6" style={{ color: "var(--text-dim)" }}>Choisis tes packs.</p>

      <div className="grid w-full max-w-md grid-cols-1 gap-2">
        {(Object.keys(PACK_INFO) as Pack[]).map((p) => {
          const info = PACK_INFO[p];
          const active = packs.has(p);
          const count = PICOLETTE_CARDS.filter((c) => c.pack === p).length;
          return (
            <button key={p} onClick={() => togglePack(p)}
              className={cn("w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
                active ? "shadow-lg" : "hover:bg-white/[0.04]")}
              style={{
                borderColor: active ? `${info.tint}aa` : "rgba(255,255,255,0.10)",
                background: active ? `${info.tint}1e` : "rgba(0,0,0,0.32)",
                boxShadow: active ? `0 0 25px ${info.tint}44` : undefined,
              }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-base" style={{ color: active ? info.tint : "#fff" }}>{info.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>{info.sub} · {count} cartes</p>
                </div>
                <div className="text-2xl">{active ? "✓" : "○"}</div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="af-eyebrow mt-6 mb-2" style={{ color: ACCENT }}>La peine</p>
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

      <p className="text-[11px] text-white/30 mt-4">{total} cartes au total</p>

      <button onClick={onLaunch} disabled={total === 0}
        className="af-btn af-btn-primary mt-6 w-full max-w-md disabled:opacity-40">
        Commencer la partie
      </button>
      <button onClick={onBack} className="mt-3 text-sm text-white/40">← Modifier les joueurs</button>
    </div>
  );
}

function PickerOverlay({
  players, onPick, onCancel,
}: { players: string[]; onPick: (i: number) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.78)" }}>
      <p className="af-eyebrow mb-4" style={{ color: ACCENT }}>Qui perd cette manche ?</p>
      <div className="w-full max-w-md space-y-2">
        {players.map((name, i) => (
          <button key={i} onClick={() => onPick(i)}
            className="w-full rounded-2xl border border-white/20 bg-white/[0.05] p-4 flex items-center gap-3 hover:bg-white/[0.1] active:scale-[0.98]">
            <MascotAvatar color={colorForIndex(i)} size={36} mood="sad" />
            <span className="flex-1 text-left font-bold">{name}</span>
            <span className="text-xl">🥃🌿</span>
          </button>
        ))}
      </div>
      <button onClick={onCancel} className="mt-5 text-sm text-white/50 underline">Annuler</button>
    </div>
  );
}

function RouletteOverlay({ sym, playerName }: { sym: string; playerName: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.85)" }}>
      <p className="af-eyebrow mb-3" style={{ color: ACCENT }}>{playerName} prend la peine</p>
      <div className="flex h-44 w-44 items-center justify-center rounded-[2rem] border bg-black/60 text-[100px]"
        style={{ borderColor: `${ACCENT}aa`, boxShadow: `0 0 80px ${ACCENT}88` }}>
        {sym}
      </div>
      <p className="mt-4 text-sm" style={{ color: "var(--text-dim)" }}>Allez, santé.</p>
    </div>
  );
}

function LossRecap({ players, losses, highlight = -1 }: { players: string[]; losses: number[]; highlight?: number }) {
  return (
    <div className="mt-3 flex w-full max-w-md mx-auto flex-wrap items-center justify-center gap-1.5 text-xs">
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
            <span className="font-semibold text-xs">{name}</span>
            <span className="text-white/30">·</span>
            <span className="cb-mono text-xs" style={{ color: hot ? "#fff" : "rgba(255,255,255,0.7)" }}>{losses[i]}</span>
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
