"use client";

/**
 * La Tournée — jeu d'ambiance 100 % oral, pour la soirée sur le canapé.
 * Un seul téléphone passe entre les mains. Le tel ne sert qu'à : tirer une carte,
 * désigner un perdant, faire tourner la roulette des peines (gorgées ou gage).
 *
 * Pas de tap rapide, pas de vote sur le tel, pas de mini-jeux écran.
 * DA « sticker » (couleurs pleines, contour encre, ombre dure) + vrais samples (sfx.ts).
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { GameProps } from "@/lib/games/types";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PlayersSetup, colorForIndex } from "@/components/games/local-kit";
import { GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { isSfxMuted, playCombo, playSfx, preloadSfx, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import {
  ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Brain, Briefcase, Check, CupSoda, Dices, Drama, Ellipsis, Flame, Hand,
  Heart, Home, Mic, RotateCcw, ScrollText, Shield, Skull, Smile, Sparkles, Undo2, Users, Volume2, VolumeX,
  type LucideIcon,
} from "lucide-react";
import {
  type PicoletteCard, type Pack, type PicoletteType,
  PICOLETTE_CARDS, PACK_INFO, TYPE_INFO, GAGES,
  filterDeck, shuffleDeck,
} from "./cards";

// ── DA sticker ────────────────────────────────────────────
const INK = "#15082E";
const ACCENT = "#FFD23F"; // jaune du jeu
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

/** Lien discret (actions secondaires). */
function TextLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="mx-auto block min-h-11 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ color: "rgba(255,255,255,0.82)" }}>
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

// Couleur pleine + icône par type de carte
const TYPE_LOOK: Record<PicoletteType, { bg: string; icon: LucideIcon }> = {
  vote: { bg: "#FF6B5B", icon: Users },
  table: { bg: "#3DDC97", icon: Mic },
  rule: { bg: "#7A4EE8", icon: ScrollText },
  prefere: { bg: "#FFD23F", icon: ArrowUpDown },
  valise: { bg: "#4ECDC4", icon: Briefcase },
  coquin: { bg: "#FF3EA5", icon: Heart },
  joker: { bg: "#FFF6E5", icon: Sparkles },
};
const PACK_LOOK: Record<Pack, { bg: string; icon: LucideIcon }> = {
  soft: { bg: "#4ECDC4", icon: Smile },
  quiz: { bg: "#3DDC97", icon: Brain },
  coquin: { bg: "#FF3EA5", icon: Flame },
  trash: { bg: "#7A4EE8", icon: Skull },
};

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

const KEYFRAMES = `
@keyframes pt-in { 0% { transform: rotateY(80deg) scale(.92); opacity: 0 } 100% { transform: none; opacity: 1 } }
@keyframes pt-pop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
@keyframes pt-spin { 0%,100% { transform: rotate(-6deg) } 50% { transform: rotate(6deg) } }
`;

const pickGage = (exclude?: string) => {
  const pool = GAGES.filter((g) => g !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
};

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
  const [rouletteSym, setRouletteSym] = useState<RouletteFace>("wait");
  const [rouletteResult, setRouletteResult] = useState<PenaltyResult | null>(null);
  const [rouletteAdvance, setRouletteAdvance] = useState(false); // passer à la carte suivante après
  const [lastLoserIdx, setLastLoserIdx] = useState<number | null>(null); // pour l'undo
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const card = deck[cardIdx];

  // Sons du jeu préchargés + nettoyage de la roulette si démonté en plein tirage
  useEffect(() => {
    preloadSfx(["card-flip", "tick", "glass", "ding2", "powerup", "bell", "back", "whoosh", "pop", "win", "ding"]);
    return () => { if (spinRef.current) clearInterval(spinRef.current); };
  }, []);

  // ── Timer pour la règle live (horloge mise à jour toutes les 250 ms) ──
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!activeRule) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t - activeRule.startedAt >= activeRule.durationMs) setActiveRule(null);
    };
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [activeRule]);
  const ruleRemaining = activeRule
    ? Math.max(0, activeRule.durationMs - (Math.max(now, activeRule.startedAt) - activeRule.startedAt))
    : 0;

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
    playSfx("card-flip", { volume: 0.8 });
    const next = cardIdx + 1;
    if (next >= deck.length) {
      // On rebat pour une partie infinie
      setDeck(shuffleDeck(filterDeck(packs)));
      setCardIdx(0);
    } else {
      setCardIdx(next);
    }
  };

  // « Pas fou ? Une autre » : la carte sort du paquet (jamais revue dans la partie)
  const rerollCard = () => {
    const rest = deck.filter((_, i) => i !== cardIdx);
    if (cardIdx >= rest.length) {
      setDeck(shuffleDeck(filterDeck(packs)));
      setCardIdx(0);
    } else {
      setDeck(rest);
    }
  };

  const activateRule = () => {
    if (!card || card.type !== "rule") return;
    const sec = card.ruleSec ?? 240;
    const replaced = activeRule && ruleRemaining > 0 ? activeRule.text : null;
    setActiveRule({ text: card.text, startedAt: Date.now(), durationMs: sec * 1000 });
    setRuleToast(replaced ? `Nouvelle règle : ${card.text} (remplace : ${replaced})` : `Nouvelle règle : ${card.text}`);
    playSfx("bell", { volume: 0.7 });
    nextCard();
  };

  // ── Désignation d'un perdant + roulette ───────────────────
  const onPick = (idx: number) => {
    const mode = pickMode;
    setPickMode(null);
    if (mode === "shield") {
      setShields((prev) => prev.map((s, i) => (i === idx ? true : s)));
      playSfx("powerup", { volume: 0.7 });
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
      setRouletteSym("shield");
      setRouletteResult({ kind: "shield" });
      playSfx("powerup", { volume: 0.8 });
      return;
    }

    let ticks = 0;
    const total = 14 + Math.floor(Math.random() * 6);
    if (spinRef.current) clearInterval(spinRef.current);
    spinRef.current = setInterval(() => {
      ticks++;
      setRouletteSym(penaltyMode === "gage" ? "gage" : Math.random() < 0.5 ? "sips" : "gage");
      if (ticks % 2 === 0) playSfx("tick", { volume: 0.5, rate: 0.9 + (ticks / total) * 0.5 });
      if (ticks >= total) {
        if (spinRef.current) clearInterval(spinRef.current);
        spinRef.current = null;
        const isGage = penaltyMode === "gage" || Math.random() < 0.5;
        const result: PenaltyResult = isGage
          ? { kind: "gage", text: pickGage() }
          : { kind: "sips", n: 1 + Math.floor(Math.random() * 3) }; // 1 à 3, jamais plus
        setRouletteSym(isGage ? "gage" : "sips");
        setRouletteResult(result);
        playSfx(isGage ? "ding2" : "glass", { volume: 0.8 });
        setLosses((prev) => prev.map((n, i) => (i === idx ? n + 1 : n)));
        setLastLoserIdx(idx);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(90);
      }
    }, 70);
  };

  // Gage qui tombe mal / préférer un gage aux gorgées : on retire un gage (même peine)
  const rerollGage = () => {
    setRouletteSym("gage");
    setRouletteResult((r) => ({ kind: "gage", text: pickGage(r?.kind === "gage" ? r.text : undefined) }));
  };

  const closeRoulette = () => {
    setRouletteFor(null);
    setRouletteSym("wait");
    setRouletteResult(null);
    if (rouletteAdvance) nextCard();
  };

  const finishGame = () => { playCombo("fanfare"); setPhase("over"); };

  // Annule la dernière peine (erreur de joueur, ou joker Amnistie)
  const undoLastLoss = () => {
    if (lastLoserIdx == null) return;
    playSfx("back", { volume: 0.6 });
    setLosses((prev) => prev.map((n, i) => (i === lastLoserIdx ? Math.max(0, n - 1) : n)));
    setLastLoserIdx(null);
  };

  // ── Render par phase ─────────────────────────────────────
  if (phase === "setup") {
    return (
      <>
        <PlayersSetup emoji="🍻" name="La Tournée" min={2} max={10} accent={ACCENT} onStart={begin} />
        <SoundToggle />
        <ScrollTop dep={phase} />
      </>
    );
  }

  if (phase === "packs") {
    return (
      <>
        <PacksScreen
          packs={packs} setPacks={setPacks}
          penaltyMode={penaltyMode} setPenaltyMode={setPenaltyMode}
          onLaunch={launch} onBack={() => setPhase("setup")}
        />
        <SoundToggle />
        <ScrollTop dep={phase} />
      </>
    );
  }

  if (phase === "intro") {
    return (
      <div className="flex min-h-[100svh] flex-col px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
        <SoundToggle />
        <ScrollTop dep={phase} />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <h1 style={{ ...DISPLAY, fontSize: 46, lineHeight: 0.95 }}>Avant de commencer</h1>
          <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>
            Le tél lit les cartes et désigne le perdant. Tout le reste se joue à l&apos;oral.
          </p>
          <div className="relative mt-10">
            <div className="absolute -top-14 right-2 z-[1]"><Mascot size={72} color="yellow" mood="laughing" arms shadow={false} /></div>
            <ul className="space-y-2.5 rounded-[26px] p-5 pt-10 text-[16px] font-semibold leading-snug" style={{ ...stk("#FFF6E5", 6), color: INK, transform: "rotate(-1.5deg)" }}>
              {[
                "18+. Personne ne prend le volant après la soirée.",
                "La peine : 1 à 3 gorgées max… ou un gage.",
                "Tu bois ce que tu veux : eau, soft, jus… ça compte pareil.",
                "Personne n'est obligé de boire : on peut toujours prendre le gage.",
                "Les cartes sont des suggestions, adaptez-les.",
              ].map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <Check size={20} strokeWidth={3.2} className="mt-0.5 shrink-0" style={{ color: "#E0218A" }} aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-h-8 flex-1" />
          <Push big bg={ACCENT} onClick={() => { playSfx("whoosh", { volume: 0.6 }); setPhase("play"); }} className="w-full">
            OK, on lance
          </Push>
        </div>
      </div>
    );
  }

  if (phase === "play" && card) {
    const look = TYPE_LOOK[card.type];
    const t = TYPE_INFO[card.type];
    const ink = inkOn(look.bg);
    const isJoker = card.type === "joker";
    const TypeIcon = look.icon;
    return (
      <div className="relative flex min-h-[100svh] flex-col px-4 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
        <style>{KEYFRAMES}</style>
        <SoundToggle />
        <ScrollTop dep={phase} />

        {/* Règle live en cours */}
        {activeRule && (
          <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-[20px] py-2 pl-3.5 pr-2" style={{ ...stk("#7A4EE8", 3, 2.5), color: "#fff" }}>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}><GameInlineIcon icon={ScrollText} /> Règle en cours · {formatTime(ruleRemaining)}</p>
              <p className="truncate text-[14px] font-bold">{activeRule.text}</p>
            </div>
            <button type="button" onClick={() => setPickMode("rule")} className="min-h-11 shrink-0 rounded-full px-3 text-[14px] font-extrabold" style={{ ...stk("#fff", 2, 2.5), color: INK }}>
              Qqn a craqué
            </button>
          </div>
        )}

        {/* Toast nouvelle règle */}
        {ruleToast && (
          <div className="pointer-events-none fixed inset-x-4 z-40 flex justify-center" style={{ top: "calc(env(safe-area-inset-top, 0px) + 66px)" }}>
            <p className="max-w-md rounded-[18px] px-4 py-2.5 text-center text-[15px] font-bold" style={{ ...stk("#FFD23F", 3, 2.5), color: INK, transform: "rotate(-1.5deg)", animation: "pt-pop .4s ease-out" }}>
              {ruleToast}
            </p>
          </div>
        )}

        {/* Carte */}
        <div className="flex flex-1 flex-col items-center justify-center py-3">
          <div
            key={`${cardIdx}-${card.text}`}
            className="relative w-full max-w-md rounded-[28px] p-4 pb-5"
            style={{ ...stk(look.bg, 6), color: ink, transform: `rotate(${cardIdx % 2 ? 1.2 : -1.2}deg)`, animation: "pt-in .4s ease-out" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[15px] font-extrabold" style={{ ...stk("#fff", 2, 2.5), color: INK, transform: "rotate(-3deg)" }}>
                <TypeIcon size={17} strokeWidth={3} aria-hidden /> {t.label}
              </span>
              <span className="text-[13px] font-bold tabular-nums" style={{ opacity: 0.7 }}>{cardIdx + 1} / {deck.length}</span>
            </div>
            <p className="mt-4 text-center" style={{ ...DISPLAY, fontSize: card.text.length > 90 ? 25 : card.text.length > 55 ? 29 : 33, lineHeight: 1.08, overflowWrap: "break-word" }}>
              {card.text}
            </p>
            {card.type === "prefere" && card.a && card.b && (
              <div className="mt-3 space-y-2">
                {[{ icon: ArrowUp, label: "Main en haut", v: card.a, bg: "#fff" }, { icon: ArrowDown, label: "Main en bas", v: card.b, bg: "#FFF6E5" }].map((o, k) => (
                  <div key={k} className="flex items-center gap-3 rounded-[18px] px-3.5 py-2.5" style={{ ...stk(o.bg, 3, 2.5), color: INK }}>
                    <o.icon size={26} strokeWidth={3} className="shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold" style={{ opacity: 0.65 }}>{o.label}</p>
                      <p className="text-[16px] font-bold leading-snug">{o.v}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {card.hint && (
              <p className="mt-3 text-center text-[14px] font-semibold leading-snug" style={{ opacity: 0.85 }}>{card.hint}</p>
            )}
          </div>
          <div className="mt-4">
            <RerollButton onClick={rerollCard} />
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="mx-auto w-full max-w-md space-y-3">
          {card.type === "rule" ? (
            <Push big bg="#7A4EE8" onClick={activateRule} className="w-full">
              <ScrollText size={22} strokeWidth={3} aria-hidden /> Activer la règle ({Math.round((card.ruleSec ?? 240) / 60)} min)
            </Push>
          ) : isJoker ? (
            <JokerAction
              effect={card.joker ?? "none"}
              canUndo={lastLoserIdx != null}
              onPick={() => setPickMode("loss")}
              onShield={() => setPickMode("shield")}
              onAmnesty={() => { undoLastLoss(); nextCard(); }}
            />
          ) : (
            <Push big bg="#FF3EA5" onClick={() => { playSfx("pop", { volume: 0.6 }); setPickMode("loss"); }} className="w-full">
              <Dices size={22} strokeWidth={3} aria-hidden /> Désigner un perdant
            </Push>
          )}
          <Push bg="#fff" onClick={nextCard} className="w-full">
            {isJoker ? "Carte suivante" : "Personne ne perd, carte suivante"}
          </Push>
        </div>

        {/* Undo dernière peine (si on s'est planté de joueur) */}
        {lastLoserIdx != null && (
          <button type="button" onClick={undoLastLoss} className="mx-auto mt-2 flex min-h-11 items-center gap-1.5 px-3 text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
            <Undo2 size={17} strokeWidth={3} aria-hidden /> Annuler la peine de {players[lastLoserIdx]}
          </button>
        )}

        {/* Récap des peines */}
        <LossRecap players={players} losses={losses} shields={shields} highlight={lastLoserIdx ?? -1} />

        <div className="mt-1">
          <TextLink onClick={finishGame}>Terminer la partie</TextLink>
        </div>

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
            colorIndex={rouletteFor}
            result={rouletteResult}
            onReroll={rerollGage}
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
  const top = ranking[0];
  return (
    <div className="relative flex min-h-[100svh] flex-col px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
      <SoundToggle />
        <ScrollTop dep={phase} />
      <ConfettiBurst count={60} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h1 style={{ ...DISPLAY, fontSize: 48, lineHeight: 0.95 }}>Le palmarès</h1>
        <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>
          Plus tu as ramassé de peines, plus t&apos;as fait le show.
        </p>

        {top && (
          <div className="relative mt-16 rounded-[26px] px-5 pb-4 pt-[52px] text-center" style={{ ...stk(ACCENT, 6), color: INK, transform: "rotate(-2deg)" }}>
            <div className="absolute -top-[62px] left-1/2 -translate-x-1/2"><Mascot size={76} color={colorForIndex(top.i)} mood="rofl" crown arms shadow={false} /></div>
            <p className="text-[15px] font-bold">La star de la soirée</p>
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

        <p className="mt-5 text-center text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>Un grand verre d&apos;eau, et personne ne conduit.</p>
        <div className="mt-4 flex justify-center"><IdeaButton game="La Tournée" kind="idée de carte" /></div>

        <div className="min-h-6 flex-1" />
        <div className="space-y-3">
          <Push big bg={ACCENT} onClick={() => { playSfx("whoosh", { volume: 0.6 }); setPhase("setup"); }} className="w-full">
            <RotateCcw size={22} strokeWidth={3} aria-hidden /> Rejouer
          </Push>
          {onReturnToLobby && (
            <Push bg="#fff" onClick={onReturnToLobby} className="w-full">
              <Home size={19} strokeWidth={3} aria-hidden /> Retour à l&apos;accueil
            </Push>
          )}
        </div>
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
  if (effect === "pick") return <Push big bg="#7A4EE8" onClick={onPick} className="w-full"><Hand size={22} strokeWidth={3} aria-hidden /> Choisir qui prend la peine</Push>;
  if (effect === "shield") return <Push big bg="#7A4EE8" onClick={onShield} className="w-full"><Shield size={22} strokeWidth={3} aria-hidden /> Donner le bouclier à…</Push>;
  if (effect === "amnesty") {
    return (
      <Push big bg="#7A4EE8" onClick={onAmnesty} disabled={!canUndo} className="w-full">
        {canUndo ? <><Undo2 size={22} strokeWidth={3} aria-hidden /> Annuler la dernière peine</> : "Aucune peine à annuler"}
      </Push>
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
    playSfx("toggle", { volume: 0.5 });
    setPacks(next);
  };
  const total = useMemo(() => filterDeck(packs).length, [packs]);

  return (
    <div className="flex min-h-[100svh] flex-col px-5 text-white" style={{ ...PAGE, paddingTop: TOP }}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h1 style={{ ...DISPLAY, fontSize: 48, lineHeight: 0.95 }}>Les cartes</h1>
        <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>Choisis tes packs, on mélange tout.</p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {(Object.keys(PACK_INFO) as Pack[]).map((p, k) => {
            const info = PACK_INFO[p];
            const look = PACK_LOOK[p];
            const active = packs.has(p);
            const count = PICOLETTE_CARDS.filter((c) => c.pack === p).length;
            const bg = active ? look.bg : "#2B1B6E";
            const ink = active ? inkOn(look.bg) : "#fff";
            const Icon = look.icon;
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePack(p)}
                aria-pressed={active}
                className="flex w-full items-center gap-3 rounded-[22px] px-4 py-3.5 text-left transition-transform active:translate-y-[3px]"
                style={{ ...stk(bg, active ? 4 : 0), color: ink, transform: active ? `rotate(${k % 2 ? 1 : -1}deg)` : undefined }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ ...stk("#fff", 2, 2.5), color: INK }}>
                  <Icon size={22} strokeWidth={2.8} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2" style={{ ...DISPLAY, fontSize: 22, lineHeight: 1.05 }}>
                    {info.label}
                    {info.adult && <span className="rounded-full px-2 py-0.5 text-[13px]" style={{ background: INK, color: "#fff", fontFamily: "inherit", letterSpacing: 0 }}>18+</span>}
                  </span>
                  <span className="mt-0.5 block text-[14px] font-semibold" style={{ opacity: 0.85 }}>{info.sub.replace(/^18\+ · /, "")} · {count} cartes</span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: active ? INK : "transparent", border: `2.5px solid ${active ? INK : "rgba(255,255,255,0.5)"}`, color: "#fff" }}>
                  {active && <Check size={18} strokeWidth={3.4} aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>

        <h2 className="mt-8" style={{ ...DISPLAY, fontSize: 30, lineHeight: 1 }}>La peine</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {([
            { v: "mix", icons: [CupSoda, Drama], label: "1 à 3 gorgées ou un gage" },
            { v: "gage", icons: [Drama], label: "Que des gages" },
          ] as { v: PenaltyMode; icons: LucideIcon[]; label: string }[]).map((o) => {
            const on = o.v === penaltyMode;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => { playSfx("toggle", { volume: 0.5 }); setPenaltyMode(o.v); }}
                aria-pressed={on}
                className="flex min-h-[86px] flex-col items-center justify-center gap-1.5 rounded-[22px] px-2 py-3 text-center"
                style={{ ...stk(on ? "#FF3EA5" : "#2B1B6E", on ? 4 : 0), color: on ? INK : "#fff" }}
              >
                <span className="flex gap-1">{o.icons.map((I, k) => <I key={k} size={24} strokeWidth={2.8} aria-hidden />)}</span>
                <span className="text-[15px] font-extrabold leading-tight">{o.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>
          La roulette tire au hasard. Une gorgée, c&apos;est de ce que tu veux : eau, soft, jus…
        </p>

        <div className="mt-6 flex justify-center"><IdeaButton game="La Tournée" kind="idée de carte" /></div>

        <div className="min-h-6 flex-1" />
        <div className="sticky bottom-0 -mx-5 mt-4 px-5 pt-4" style={{ paddingBottom: BOTTOM, background: "linear-gradient(180deg, transparent, #1E1250 35%)" }}>
          <Push big bg={ACCENT} onClick={() => { playSfx("whoosh", { volume: 0.6 }); onLaunch(); }} disabled={total === 0} className="w-full">
            C&apos;est parti ! ({total} cartes)
          </Push>
          <button type="button" onClick={onBack} className="mx-auto mt-1 flex min-h-11 items-center gap-1.5 px-4 text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.82)" }}>
            <ArrowLeft size={17} strokeWidth={3} aria-hidden /> Modifier les joueurs
          </button>
        </div>
      </div>
    </div>
  );
}

function PickerOverlay({
  title, players, shields, onPick, onCancel,
}: { title: string; players: string[]; shields: boolean[]; onPick: (i: number) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0" style={{ background: "rgba(10,4,32,0.66)" }} onClick={onCancel} />
      <div
        className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto px-5 pt-5"
        style={{ background: "#FFF6E5", color: INK, borderRadius: "30px 30px 0 0", border: `3px solid ${INK}`, borderBottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)", animation: "pt-pop .3s ease-out" }}
      >
        <h2 style={{ ...DISPLAY, fontSize: 32, lineHeight: 1 }}>{title}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {players.map((name, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              className="flex min-h-[58px] items-center gap-2.5 rounded-[18px] px-3 text-left active:translate-y-[3px]"
              style={{ ...stk("#fff", 3, 2.5), color: INK }}
            >
              <MascotAvatar color={colorForIndex(i)} size={34} mood="sad" />
              <span className="min-w-0 flex-1 truncate text-[17px] font-bold">{name}</span>
              {shields[i] && <Shield size={20} strokeWidth={2.8} aria-label="Bouclier" />}
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} className="mx-auto mt-3 block min-h-11 px-4 text-[16px] font-bold underline decoration-2 underline-offset-4">Annuler</button>
      </div>
    </div>
  );
}

// Faces de la roulette de peine (icônes)
type RouletteFace = "wait" | "shield" | "gage" | "sips";
const ROULETTE_ICONS: Record<RouletteFace, LucideIcon> = { wait: Ellipsis, shield: Shield, gage: Drama, sips: CupSoda };

function RouletteOverlay({
  sym, playerName, colorIndex, result, onReroll, onDone,
}: { sym: RouletteFace; playerName: string; colorIndex: number; result: PenaltyResult | null; onReroll: () => void; onDone: () => void }) {
  const Icon = ROULETTE_ICONS[sym];
  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <p className="text-[17px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>La peine tombe sur</p>
        <div className="mt-2 flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5" style={{ ...stk("#fff", 4), color: INK, transform: "rotate(-2deg)" }}>
          <MascotAvatar color={colorForIndex(colorIndex)} size={40} mood="shocked" />
          <span style={{ ...DISPLAY, fontSize: 30, lineHeight: 1, overflowWrap: "anywhere" }}>{playerName}</span>
        </div>

        <div
          className="mt-8 grid h-36 w-36 place-items-center rounded-[34px]"
          style={{ ...stk(result?.kind === "shield" ? "#4ECDC4" : "#FF3EA5", 6), color: INK, animation: result ? "pt-pop .4s ease-out" : "pt-spin .25s linear infinite" }}
        >
          <Icon size={72} strokeWidth={2.4} aria-hidden />
        </div>

        {result ? (
          <div className="mt-7 w-full" style={{ animation: "pt-pop .4s ease-out" }}>
            <div className="rounded-[24px] px-5 py-4" style={{ ...stk("#FFF6E5", 5), color: INK, transform: "rotate(1deg)" }}>
              <p style={{ ...DISPLAY, fontSize: result.kind === "gage" ? 25 : 34, lineHeight: 1.1 }}>
                {result.kind === "sips"
                  ? `${result.n} gorgée${result.n > 1 ? "s" : ""}`
                  : result.kind === "gage"
                    ? result.text
                    : "Bouclier ! Peine annulée."}
              </p>
              <p className="mt-2 text-[15px] font-semibold" style={{ opacity: 0.8 }}>
                {result.kind === "sips"
                  ? "De ce que tu veux (eau ou soft, ça compte)… ou un gage, au choix."
                  : result.kind === "shield"
                    ? "Le bouclier est cassé, profites-en."
                    : "Le gage ne passe pas ? Tire-en un autre."}
              </p>
            </div>
            {result.kind !== "shield" && (
              <div className="mt-5 flex justify-center">
                <RerollButton onClick={onReroll} label={result.kind === "sips" ? "Plutôt un gage" : "Pas fou ? Un autre gage"} />
              </div>
            )}
          </div>
        ) : (
          <p className="mt-6 text-[17px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>La roulette tourne…</p>
        )}
      </div>
      {result && (
        <div className="mx-auto mt-6 w-full max-w-md">
          <Push big bg={ACCENT} onClick={onDone} className="w-full">
            <Check size={22} strokeWidth={3.2} aria-hidden /> C&apos;est fait
          </Push>
        </div>
      )}
    </div>
  );
}

function LossRecap({
  players, losses, shields, highlight = -1,
}: { players: string[]; losses: number[]; shields: boolean[]; highlight?: number }) {
  return (
    <div className="mx-auto mt-4 flex w-full max-w-md flex-wrap items-center justify-center gap-2">
      {players.map((name, i) => {
        const hot = i === highlight;
        return (
          <div
            key={i}
            className="flex h-9 items-center gap-1.5 rounded-full pl-1 pr-3"
            style={{ ...stk(hot ? "#FF3EA5" : "#fff", 2, 2.5), color: INK, transform: hot ? "rotate(-2deg) scale(1.05)" : undefined, transition: "transform .2s" }}
          >
            <MascotAvatar color={colorForIndex(i)} size={26} mood={hot ? "sad" : "happy"} border={false} />
            <span className="max-w-[110px] truncate text-[14px] font-bold">{name}</span>
            {shields[i] && <Shield size={14} strokeWidth={3} aria-label="Bouclier" />}
            <span className="text-[14px] font-extrabold tabular-nums">{losses[i]}</span>
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
