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
import { adultDefault, sipsAllowed } from "@/lib/party-mood";
import type { GameProps } from "@/lib/games/types";
import { Mascot } from "@/components/Mascot";
import { PlayerAvatar, PlayerBlob } from "@/components/avatar/PlayerBlob";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PlayersSetup } from "@/components/games/local-kit";
import { GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { IdeaButton, RerollButton } from "@/components/games/idea-button";
import { isSfxMuted, playCombo, playSfx, preloadSfx, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";
import {
  ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Brain, Briefcase, Check, CircleHelp, Clapperboard, CupSoda, Dices, Drama,
  Ellipsis, Eraser, Eye, Flame, Hand, Heart, Home, Infinity as InfinityIcon, Layers, Mic, Music, PersonStanding,
  RotateCcw, ScrollText, Shield, Skull, Smartphone, Smile, Sparkles, Swords, Timer, Undo2, Users, Volume2, VolumeX, Zap,
  type LucideIcon,
} from "lucide-react";
import {
  type PicoletteCard, type Pack, type PicoletteType,
  cardsFor, gagesFor, packInfoFor, typeInfoFor,
  filterDeck, freeDeck, shuffleDeck, splitHint,
} from "./cards";
import { useUnlocked } from "@/lib/entitlements";
import { LockedPack, PremiumNudge, fmtCount, useNudgeText } from "@/components/games/premium-nudge";
import { pick, useLang, useT } from "@/lib/i18n";
import { STR } from "./i18n";
import { uniqueMax, useGameFinished, winnersOf } from "@/lib/game-finished";
import { WIN_STR } from "@/lib/winners-text";
import { ShareResultButton } from "@/components/games/share-result-button";
import { tourneeCard } from "@/lib/share-cards";
import { GameTuto, RulesIconButton, useFirstTimeTuto } from "@/components/games/game-tuto";
import { TourneeRules, useTourneeSlides } from "./tuto";
import { SoireeNextButton } from "@/components/games/soiree-next";

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
function SoundToggle({ onRules, children }: { onRules?: () => void; children?: ReactNode }) {
  const muted = useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);
  const t = useT(STR);
  return (
    <GameTopRight>
      {onRules && <RulesIconButton onClick={onRules} />}
      {children}
      <GameIconButton icon={muted ? VolumeX : Volume2} label={muted ? t.soundOn : t.soundOff} active={muted} onClick={() => setSfxMuted(!muted)} />
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
  quiz: { bg: "#FFFFFF", icon: CircleHelp },
  duel: { bg: "#FF3EA5", icon: Swords },
  jamais: { bg: "#FFD23F", icon: Hand },
  defi: { bg: "#FF6B5B", icon: Zap },
  mime: { bg: "#4ECDC4", icon: PersonStanding },
  chanson: { bg: "#3DDC97", icon: Music },
  avoue: { bg: "#FFF6E5", icon: Eye },
};
const PACK_LOOK: Record<Pack, { bg: string; icon: LucideIcon }> = {
  soft: { bg: "#4ECDC4", icon: Smile },
  quiz: { bg: "#3DDC97", icon: Brain },
  pop: { bg: "#FF6B5B", icon: Clapperboard },
  coquin: { bg: "#FF3EA5", icon: Flame },
  trash: { bg: "#7A4EE8", icon: Skull },
};

/** "mix" = la roulette tire entre gorgées (1 à 3) et gage ; "gage" = gages seulement. */
type PenaltyMode = "mix" | "gage";

/** Résultat de la roulette. */
type PenaltyResult = { kind: "sips"; n: number } | { kind: "gage"; text: string } | { kind: "shield" };

/** Règle live en cours : durée en temps, en cartes, ou jusqu'à la prochaine règle. */
type ActiveRule = { text: string; by: string } & (
  | { kind: "time"; startedAt: number; endsAt: number }
  | { kind: "cards"; endTurn: number }
  | { kind: "next" }
);

type PickMode = "loss" | "rule" | "shield" | "duel" | "reader" | "camp"; // camp = plusieurs perdants (Tu préfères)

/** Carte distribuée : les joueurs tirés pour {p1} / {p2} (indices). */
type DealtCard = PicoletteCard & { who: number[] };

/** Fréquence visée par type (les gros paquets ne noient pas les autres, les petits ne reviennent pas en boucle). */
const TYPE_WEIGHT: Record<PicoletteType, number> = {
  table: 16, vote: 14, rule: 8, prefere: 8, quiz: 9, duel: 7, jamais: 7, defi: 6, avoue: 6,
  chanson: 5, mime: 5, coquin: 6, valise: 3, joker: 2,
};

/**
 * Mélange « varié » : on tire d'abord un type (selon TYPE_WEIGHT, atténué quand le type s'épuise),
 * jamais l'un des 2 derniers types sortis, puis une carte de ce type. Chaque carte sort une seule fois.
 */
function mixTypes<T extends { type: PicoletteType }>(cards: T[]): T[] {
  const byType = new Map<PicoletteType, T[]>();
  for (const c of shuffleDeck(cards)) {
    const list = byType.get(c.type);
    if (list) list.push(c); else byType.set(c.type, [c]);
  }
  const initial = new Map([...byType].map(([t, l]) => [t, l.length]));
  const out: T[] = [];
  const recent: PicoletteType[] = [];
  while (out.length < cards.length) {
    const left = [...byType.keys()].filter((t) => (byType.get(t)?.length ?? 0) > 0);
    // Première carte : ni joker ni règle
    const avoid: PicoletteType[] = out.length === 0 ? ["joker", "rule", ...recent] : recent;
    const fresh = left.filter((t) => !avoid.includes(t));
    const pool = fresh.length ? fresh : left;
    const w = pool.map((t) => TYPE_WEIGHT[t] * Math.sqrt((byType.get(t)?.length ?? 0) / (initial.get(t) ?? 1)));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    let k = 0;
    while (k < pool.length - 1 && r >= w[k]) { r -= w[k]; k++; }
    const t = pool[k];
    const c = byType.get(t)?.shift();
    if (!c) break;
    out.push(c);
    recent.push(t);
    if (recent.length > 2) recent.shift();
  }
  return out;
}

/** Mélange le paquet et tire les prénoms des cartes ciblées, en répartissant équitablement. */
function dealDeck(cards: PicoletteCard[], nPlayers: number): DealtCard[] {
  const count = new Array<number>(nPlayers).fill(0);
  const pickLeast = (exclude: number[]) => {
    const pool = Array.from({ length: nPlayers }, (_, i) => i).filter((i) => !exclude.includes(i));
    const min = Math.min(...pool.map((i) => count[i]));
    const best = pool.filter((i) => count[i] === min);
    const p = best[Math.floor(Math.random() * best.length)];
    count[p]++;
    return p;
  };
  return mixTypes(cards).map((c) => {
    const all = `${c.text} ${c.hint ?? ""} ${c.a ?? ""} ${c.b ?? ""}`;
    const who: number[] = [];
    if (all.includes("{p1}") || all.includes("{p2}")) who.push(pickLeast([]));
    if (all.includes("{p2}") && nPlayers > 1) who.push(pickLeast(who));
    return { ...c, who };
  });
}

/** Remplace {p1} / {p2} par les prénoms. */
function fill(text: string, who: number[], players: string[]): string {
  return text.replace(/\{p([12])\}/g, (_, n: string) => players[who[Number(n) - 1]] ?? pick(STR).someone);
}

/** « Léa, Tom et Max » (liste de prénoms dans la langue courante). */
function joinNames(names: string[]): string {
  if (names.length < 2) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} ${pick(STR).and} ${names[names.length - 1]}`;
}

/** Texte de carte avec les prénoms mis en valeur (sticker). */
function RichText({ text, who, players, cardBg }: { text: string; who: number[]; players: string[]; cardBg: string }) {
  const hl = cardBg === "#FFD23F" ? "#fff" : ["#FFFFFF", "#FFF6E5", "#fff"].includes(cardBg) ? "#FFD23F" : "#fff";
  return (
    <>
      {text.split(/(\{p[12]\})/).map((part, k) => {
        const m = part.match(/^\{p([12])\}$/);
        if (!m) return <span key={k}>{part}</span>;
        return (
          <span
            key={k}
            className="whitespace-nowrap rounded-[12px] px-[0.18em]"
            style={{ background: hl, color: INK, border: `2.5px solid ${INK}`, boxShadow: `0 2px 0 ${INK}`, WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}
          >
            {players[who[Number(m[1]) - 1]] ?? pick(STR).someone}
          </span>
        );
      })}
    </>
  );
}

/** Durée affichée d'une carte règle. */
function ruleDurationLabel(c: PicoletteCard): { icon: LucideIcon; label: string } {
  const t = pick(STR);
  if (c.ruleUntilNext) return { icon: InfinityIcon, label: t.untilNextRule };
  if (c.ruleCards) return { icon: Layers, label: t.forCards(c.ruleCards) };
  return { icon: Timer, label: t.forMin(Math.round((c.ruleSec ?? 240) / 60)) };
}

const KEYFRAMES = `
@keyframes pt-in { 0% { transform: rotateY(80deg) scale(.92); opacity: 0 } 100% { transform: none; opacity: 1 } }
@keyframes pt-pop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
@keyframes pt-spin { 0%,100% { transform: rotate(-6deg) } 50% { transform: rotate(6deg) } }
`;

const pickGage = (exclude?: string) => {
  const pool = gagesFor().filter((g) => g !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
};

export default function PicoletteGame({ onReturnToLobby }: GameProps) {
  const tr = useT(STR);
  const wt = useT(WIN_STR);
  type Phase = "setup" | "packs" | "intro" | "play" | "over";
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [losses, setLosses] = useState<number[]>([]);
  // Fin de partie → note éventuelle + Soirée (app) : le moins de peines gagne (comme l'écran de fin), le plus de peines perd
  useGameFinished(phase === "over", { loser: uniqueMax(players, losses), scores: { names: players, values: losses, lowerWins: true } });
  const [shields, setShields] = useState<boolean[]>([]);
  // Coquin / Trash (18+) ne sont PAS cochés par défaut (sauf en Soirée « Folle »)
  const [packs, setPacks] = useState<Set<Pack>>(() => new Set<Pack>(adultDefault(false) ? ["soft", "quiz", "pop", "coquin", "trash"] : ["soft", "quiz", "pop"]));
  const [penaltyMode, setPenaltyMode] = useState<PenaltyMode>(() => (sipsAllowed(true) ? "mix" : "gage")); // Soirée « Chill » : gages seulement
  const [deck, setDeck] = useState<DealtCard[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [turn, setTurn] = useState(0);       // nombre de cartes passées (durée des règles en cartes)
  const [reader, setReader] = useState(0);   // qui lit la carte (tourne à chaque carte)
  const [revealed, setRevealed] = useState(false); // réponse du quiz dévoilée
  const [activeRule, setActiveRule] = useState<ActiveRule | null>(null);
  const [ruleToast, setRuleToast] = useState<string | null>(null);
  const [pickMode, setPickMode] = useState<PickMode | null>(null); // overlay "qui perd"
  const [rouletteFor, setRouletteFor] = useState<number[] | null>(null); // joueur(s) qui prennent la peine
  const [rouletteSym, setRouletteSym] = useState<RouletteFace>("wait");
  const [rouletteResult, setRouletteResult] = useState<PenaltyResult | null>(null);
  const [rouletteAdvance, setRouletteAdvance] = useState(false); // passer à la carte suivante après
  const [rouletteSpared, setRouletteSpared] = useState<number[]>([]); // perdants sauvés par leur bouclier
  const [lastLosers, setLastLosers] = useState<number[]>([]); // pour l'undo (plusieurs si camp perdant)
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tuto 1re fois (dès l'ouverture, avant les prénoms) + règles en jeu (bouton livre, en haut à droite)
  const tuto = useFirstTimeTuto("picolette", { atMount: true });
  const tutoSlides = useTourneeSlides();
  const [rulesOpen, setRulesOpen] = useState(false);
  const tools = (
    <SoundToggle onRules={phase === "setup" ? undefined : () => setRulesOpen(true)}>
      {rulesOpen && <TourneeRules onClose={() => setRulesOpen(false)} onTuto={tuto.show} />}
      {tuto.open && <GameTuto slides={tutoSlides} onDone={tuto.close} />}
    </SoundToggle>
  );

  const card = deck[cardIdx];
  // App sans Zinzin+ : paquet découverte (60 cartes soft fixes) ; abonné / site : les packs choisis
  const unlocked = useUnlocked();
  const lang = useLang();
  const nudge = useNudgeText();
  const source = () => (unlocked ? filterDeck(packs) : freeDeck());
  // Zinzin+ activé en pleine partie : tous les packs arrivent dès la carte suivante (sans relancer)
  const wasUnlocked = useRef(unlocked);
  useEffect(() => {
    if (unlocked && !wasUnlocked.current && phase === "play") {
      const cur = deck[cardIdx];
      setDeck([...(cur ? [cur] : []), ...dealDeck(filterDeck(packs), players.length)]);
      setCardIdx(0);
    }
    wasUnlocked.current = unlocked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  // Sons du jeu préchargés + nettoyage de la roulette si démonté en plein tirage
  useEffect(() => {
    preloadSfx(["card-flip", "tick", "glass", "ding2", "powerup", "bell", "back", "whoosh", "pop", "win", "ding"]);
    return () => { if (spinRef.current) clearInterval(spinRef.current); };
  }, []);

  // ── Timer pour les règles live chronométrées (horloge mise à jour toutes les 250 ms) ──
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!activeRule || activeRule.kind !== "time") return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= activeRule.endsAt) {
        playSfx("ding2", { volume: 0.6 }); // fin de la règle : personne ne regarde l'écran
        setActiveRule(null);
        setRuleToast(pick(STR).ruleEnded(activeRule.text));
      }
    };
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [activeRule]);
  const ruleLeft = !activeRule
    ? ""
    : activeRule.kind === "time"
      ? formatTime(Math.max(0, activeRule.endsAt - Math.max(now, activeRule.startedAt)))
      : activeRule.kind === "cards"
        ? (() => { const n = Math.max(1, activeRule.endTurn - turn); return n > 1 ? tr.cardsLeft(n) : tr.lastCard; })()
        : tr.untilNextRuleShort;

  // Toast « Nouvelle règle »
  useEffect(() => {
    if (!ruleToast) return;
    const t = setTimeout(() => setRuleToast(null), 3000);
    return () => clearTimeout(t);
  }, [ruleToast]);

  // ── Démarrage ─────────────────────────────────────────────
  const begin = (names: string[]) => {
    setPlayers(names);
    setLosses(names.map(() => 0));
    setShields(names.map(() => false));
    setLastLosers([]);
    setPhase("packs");
  };

  const launch = () => {
    const d = dealDeck(source(), players.length);
    if (d.length === 0) return;
    setDeck(d);
    setCardIdx(0);
    setTurn(0);
    setReader(0);
    setRevealed(false);
    setActiveRule(null);
    setPhase("intro");
  };

  // ── Avancer dans le deck ──────────────────────────────────
  // rule : règle lancée par la carte qu'on quitte ; readerTo : lecteur imposé (joker Passe-main)
  const nextCard = (opts: { rule?: ActiveRule; readerTo?: number } = {}) => {
    playSfx("card-flip", { volume: 0.6 }); // l'action la plus fréquente : discret
    const t = turn + 1;
    setTurn(t);
    setReader(opts.readerTo ?? (reader + 1) % Math.max(1, players.length));
    setRevealed(false);
    if (opts.rule) {
      setActiveRule(opts.rule);
    } else if (activeRule?.kind === "cards" && t >= activeRule.endTurn) {
      playSfx("ding2", { volume: 0.5, delay: 0.2 });
      setActiveRule(null);
      setRuleToast(tr.ruleEnded(activeRule.text));
    }
    const next = cardIdx + 1;
    if (next >= deck.length) {
      // Paquet épuisé : on rebat pour une partie infinie
      setDeck(dealDeck(source(), players.length));
      setCardIdx(0);
    } else {
      setCardIdx(next);
    }
  };

  // « Pas fou ? Une autre » : la carte sort du paquet (jamais revue dans la partie)
  const rerollCard = () => {
    setRevealed(false);
    const rest = deck.filter((_, i) => i !== cardIdx);
    if (cardIdx >= rest.length) {
      setDeck(dealDeck(source(), players.length));
      setCardIdx(0);
    } else {
      setDeck(rest);
    }
  };

  const activateRule = () => {
    if (!card || card.type !== "rule") return;
    const text = fill(card.text, card.who, players);
    const by = players[reader] ?? "";
    const base = { text, by };
    const t = Date.now();
    const rule: ActiveRule = card.ruleUntilNext
      ? { ...base, kind: "next" }
      : card.ruleCards
        ? { ...base, kind: "cards", endTurn: turn + 1 + card.ruleCards }
        : { ...base, kind: "time", startedAt: t, endsAt: t + (card.ruleSec ?? 240) * 1000 };
    playSfx("bell", { volume: 0.7 });
    nextCard({ rule });
  };

  // Joker Libération : lève la règle en cours
  const clearRule = () => {
    if (!activeRule) return;
    setRuleToast(tr.ruleLifted(activeRule.text));
    setActiveRule(null);
    playSfx("powerup", { volume: 0.7 });
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
    if (mode === "reader") {
      playSfx("whoosh", { volume: 0.6 });
      nextCard({ readerTo: idx });
      return;
    }
    spinPenalty([idx], mode !== "rule");
  };

  // Camp perdant (Tu préfères) : tous prennent la même peine
  const onPickCamp = (idxs: number[]) => {
    setPickMode(null);
    if (idxs.length) spinPenalty(idxs, true);
  };

  const spinPenalty = (idxs: number[], advance: boolean) => {
    // Bouclier : la peine est annulée pour ceux qui en ont un, le bouclier est consommé
    const spared = idxs.filter((i) => shields[i]);
    const hit = idxs.filter((i) => !shields[i]);
    if (spared.length) setShields((prev) => prev.map((s, i) => (spared.includes(i) ? false : s)));
    setRouletteSpared(hit.length ? spared : []);
    setRouletteFor(hit.length ? hit : spared);
    setRouletteResult(null);
    setRouletteAdvance(advance);

    if (!hit.length) {
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
        setLosses((prev) => prev.map((n, i) => (hit.includes(i) ? n + 1 : n)));
        setLastLosers(hit);
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
    setRouletteSpared([]);
    setRouletteSym("wait");
    setRouletteResult(null);
    if (rouletteAdvance) nextCard();
  };

  const finishGame = () => { playCombo("fanfare"); setPhase("over"); };

  // Annule la dernière peine (erreur de joueur, ou joker Amnistie)
  const undoLastLoss = () => {
    if (!lastLosers.length) return;
    playSfx("back", { volume: 0.6 });
    setLosses((prev) => prev.map((n, i) => (lastLosers.includes(i) ? Math.max(0, n - 1) : n)));
    setLastLosers([]);
  };

  // ── Render par phase ─────────────────────────────────────
  if (phase === "setup") {
    return (
      <>
        <PlayersSetup emoji="🍻" name={tr.gameName} min={2} max={10} accent={ACCENT} onStart={begin} />
        {tools}
        <ScrollTop dep={phase} />
      </>
    );
  }

  if (phase === "packs") {
    return (
      <>
        <PacksScreen
          packs={packs} setPacks={setPacks} unlocked={unlocked}
          penaltyMode={penaltyMode} setPenaltyMode={setPenaltyMode}
          onLaunch={launch} onBack={() => setPhase("setup")}
        />
        {tools}
        <ScrollTop dep={phase} />
      </>
    );
  }

  if (phase === "intro") {
    return (
      <div className="flex min-h-[100svh] flex-col px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
        {tools}
        <ScrollTop dep={phase} />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <h1 style={{ ...DISPLAY, fontSize: 46, lineHeight: 0.95 }}>{tr.introTitle}</h1>
          <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>
            {tr.introSub}
          </p>
          <div className="relative mt-10">
            <div className="absolute -top-14 right-2 z-[1]"><Mascot size={72} color="yellow" mood="laughing" arms shadow={false} /></div>
            <ul className="space-y-2.5 rounded-[26px] p-5 pt-10 text-[16px] font-semibold leading-snug" style={{ ...stk("#FFF6E5", 6), color: INK, transform: "rotate(-1.5deg)" }}>
              {(sipsAllowed(true) ? tr.introRules : tr.introRulesNoSips).map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <Check size={20} strokeWidth={3.2} className="mt-0.5 shrink-0" style={{ color: "#E0218A" }} aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-h-8 flex-1" />
          <Push big bg={ACCENT} onClick={() => { playSfx("whoosh", { volume: 0.6 }); setPhase("play"); }} className="w-full">
            {tr.introGo}
          </Push>
        </div>
      </div>
    );
  }

  if (phase === "play" && card) {
    const look = TYPE_LOOK[card.type];
    const t = typeInfoFor()[card.type];
    const ink = inkOn(look.bg);
    const isJoker = card.type === "joker";
    const isPref = card.type === "prefere" && !!card.a && !!card.b;
    const hint = splitHint(card.hint);
    const TypeIcon = look.icon;
    const shown = fill(card.text, card.who, players);
    const dur = card.type === "rule" ? ruleDurationLabel(card) : null;
    const readerName = players[reader] ?? "";
    const longName = Math.max(0, ...card.who.map((i) => (players[i] ?? "").length)); // prénom long = police réduite
    return (
      <div className="relative flex min-h-[100svh] flex-col px-4 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
        <style>{KEYFRAMES}</style>
        {tools}
        {/* Chaque nouvelle carte repart du haut (sinon on arrive au milieu de la carte sur petit écran) */}
        <ScrollTop dep={`${phase}-${cardIdx}-${card.text}`} />

        {/* Règle live en cours */}
        {activeRule && (
          <div key={activeRule.text} className="mx-auto flex w-full max-w-md items-center gap-2 rounded-[20px] py-2 pl-3.5 pr-2" style={{ ...stk("#7A4EE8", 3, 2.5), color: "#fff", animation: "pt-pop .4s ease-out" }}>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
                <GameInlineIcon icon={ScrollText} /> {tr.ruleOngoing}
              </p>
              <p className="line-clamp-2 text-[15px] font-bold leading-tight">{activeRule.text}</p>
              <p className="mt-0.5 text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                {activeRule.by ? tr.ruleBy(activeRule.by) : ""}{ruleLeft}
              </p>
            </div>
            <button type="button" onClick={() => setPickMode("rule")} className="min-h-11 shrink-0 rounded-full px-3.5 py-1.5 text-center text-[14px] font-extrabold leading-tight" style={{ ...stk("#fff", 2, 2.5), color: INK }}>
              {tr.someoneCracked[0]}<br />{tr.someoneCracked[1]}
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
          {/* Qui lit cette carte (à voix haute) : bien visible, au-dessus de la carte */}
          {readerName && (
            <p
              key={`r-${cardIdx}`}
              className="mb-3 flex max-w-full items-center gap-2 rounded-full py-1 pl-1 pr-4 text-[16px] font-extrabold leading-tight"
              style={{ ...stk("#fff", 3, 2.5), color: INK, transform: "rotate(-1.5deg)", animation: "pt-pop .4s ease-out" }}
              aria-label={tr.readsCardAria(readerName)}
            >
              <PlayerAvatar name={readerName} colorIndex={reader} size={30} mood="happy" border={false} />
              <span className="min-w-0">{tr.readsAloud(readerName)}</span>
            </p>
          )}

          <div
            key={`${cardIdx}-${card.text}`}
            className="relative w-full max-w-md rounded-[28px] p-4 pb-5"
            style={{ ...stk(look.bg, 6), color: ink, transform: `rotate(${cardIdx % 2 ? 1.2 : -1.2}deg)`, animation: "pt-in .4s ease-out" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[15px] font-extrabold" style={{ ...stk("#fff", 2, 2.5), color: INK, transform: "rotate(-3deg)" }}>
                <TypeIcon size={17} strokeWidth={3} aria-hidden /> {t.label}
              </span>
            </div>
            <p className="mt-4 text-center" style={{ ...DISPLAY, fontSize: Math.min(shown.length > 90 ? 25 : shown.length > 55 ? 29 : 33, longName > 13 ? 25 : longName > 10 ? 29 : 33), lineHeight: 1.12, overflowWrap: "break-word", textWrap: "balance" }}>
              <RichText text={card.text} who={card.who} players={players} cardBg={look.bg} />
            </p>
            {dur && (
              <div className="mt-3 flex justify-center">
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[15px] font-extrabold" style={{ ...stk("#FFD23F", 2, 2.5), color: INK, transform: "rotate(2deg)" }}>
                  <dur.icon size={17} strokeWidth={3} aria-hidden /> {dur.label}
                </span>
              </div>
            )}
            {card.type === "quiz" && card.answer && (
              <div className="mt-3 flex justify-center">
                {revealed ? (
                  <p className="rounded-[18px] px-4 py-2 text-center text-[17px] font-extrabold leading-snug" style={{ ...stk("#3DDC97", 3, 2.5), color: INK, transform: "rotate(-1.5deg)", animation: "pt-pop .35s ease-out" }}>
                    {tr.answer(card.answer)}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => { playSfx("ding", { volume: 0.6 }); setRevealed(true); }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[16px] font-extrabold active:translate-y-[2px]"
                    style={{ ...stk("#FFD23F", 3, 2.5), color: INK }}
                  >
                    <Eye size={18} strokeWidth={3} aria-hidden /> {tr.showAnswer}
                  </button>
                )}
              </div>
            )}
            {isPref ? (
              <>
                <p className="mt-1.5 text-center text-[14px] font-semibold leading-snug" style={{ opacity: 0.88 }}>{tr.prefHow}</p>
                <div className="mt-2">
                  {[{ up: true, label: tr.handUp, v: card.a ?? "", bg: "#fff" }, { up: false, label: tr.handDown, v: card.b ?? "", bg: "#FFF6E5" }].map((o, k) => (
                    <div key={k}>
                      {k === 1 && (
                        <div className="relative z-[1] -my-2 flex justify-center">
                          <span className="rounded-full px-2.5 py-0.5 text-[13px] font-extrabold" style={{ background: INK, color: "#fff", border: `2px solid ${INK}` }}>{tr.or}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 rounded-[18px] px-3 py-2" style={{ ...stk(o.bg, 3, 2.5), color: INK }}>
                        {/* Main levée ↑ / main baissée ↓ */}
                        <span className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-[14px]" style={{ background: INK, color: "#fff" }} aria-hidden>
                          {o.up && <ArrowUp size={17} strokeWidth={3.4} />}
                          <Hand size={20} strokeWidth={2.6} style={o.up ? undefined : { transform: "rotate(180deg)" }} />
                          {!o.up && <ArrowDown size={17} strokeWidth={3.4} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ opacity: 0.6 }}>{o.label}</p>
                          <p className="text-[16px] font-bold leading-snug">{fill(o.v, card.who, players)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <LoseBox lose={tr.prefLose} extra={tr.prefTie} who={card.who} players={players} penaltyMode={penaltyMode} />
              </>
            ) : isJoker ? (
              card.hint && <p className="mt-3 text-center text-[15px] font-semibold leading-snug" style={{ opacity: 0.88 }}>{fill(card.hint, card.who, players)}</p>
            ) : (
              <>
                {hint.how && <p className="mt-3 text-center text-[15px] font-semibold leading-snug" style={{ opacity: 0.88 }}><RichText text={hint.how} who={card.who} players={players} cardBg={look.bg} /></p>}
                {hint.lose && <LoseBox lose={hint.lose} who={card.who} players={players} penaltyMode={penaltyMode} />}
              </>
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
              <ScrollText size={22} strokeWidth={3} aria-hidden /> {tr.activateRule}
            </Push>
          ) : isJoker ? (
            <JokerAction
              effect={card.joker ?? "none"}
              canUndo={lastLosers.length > 0}
              onPick={() => setPickMode("loss")}
              onShield={() => setPickMode("shield")}
              onAmnesty={() => { undoLastLoss(); nextCard(); }}
              hasRule={!!activeRule}
              onClear={clearRule}
              onReader={() => setPickMode("reader")}
            />
          ) : isPref ? (
            <Push big bg="#FF3EA5" onClick={() => { playSfx("pop", { volume: 0.6 }); setPickMode("camp"); }} className="w-full">
              <Users size={22} strokeWidth={3} aria-hidden /> {tr.pickCamp}
            </Push>
          ) : card.type === "duel" && card.who.length > 1 ? (
            <Push big bg="#FF3EA5" onClick={() => { playSfx("pop", { volume: 0.6 }); setPickMode("duel"); }} className="w-full">
              <Swords size={22} strokeWidth={3} aria-hidden /> {tr.whoLosesDuel}
            </Push>
          ) : (
            <Push big bg="#FF3EA5" onClick={() => { playSfx("pop", { volume: 0.6 }); setPickMode("loss"); }} className="w-full">
              <Dices size={22} strokeWidth={3} aria-hidden /> {tr.pickLoser}
            </Push>
          )}
          <Push bg="#fff" onClick={() => nextCard()} className="w-full">
            {isJoker || isPref ? tr.nextCard : card.type === "rule" ? tr.skipRule : tr.nobodyLoses}
          </Push>
        </div>

        {/* Undo dernière peine (si on s'est planté de joueur) */}
        {lastLosers.length > 0 && (
          <button type="button" onClick={undoLastLoss} className="mx-auto mt-2 flex min-h-11 items-center gap-1.5 px-3 text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
            <Undo2 size={17} strokeWidth={3} aria-hidden /> {tr.undoPenalty(joinNames(lastLosers.map((i) => players[i])))}
          </button>
        )}

        {/* Récap des peines */}
        <LossRecap players={players} losses={losses} shields={shields} highlight={lastLosers} />

        <div className="mt-1">
          <TextLink onClick={finishGame}>{tr.endGame}</TextLink>
        </div>

        {pickMode === "camp" && (
          <PickerOverlay
            title={tr.campTitle}
            sub={tr.campSub}
            players={players}
            shields={shields}
            multi
            onPick={() => {}}
            onConfirm={onPickCamp}
            onCancel={() => setPickMode(null)}
          />
        )}
        {pickMode && pickMode !== "camp" && (
          <PickerOverlay
            title={
              pickMode === "shield" ? tr.pickShield
                : pickMode === "rule" ? tr.pickCracked
                  : pickMode === "duel" ? tr.whoLosesDuel
                    : pickMode === "reader" ? tr.pickReader
                      : tr.pickRound
            }
            players={players}
            only={pickMode === "duel" ? card.who : undefined}
            mood={pickMode === "shield" || pickMode === "reader" ? "happy" : "sad"}
            shields={shields}
            onPick={onPick}
            onCancel={() => setPickMode(null)}
          />
        )}

        {rouletteFor != null && (
          <RouletteOverlay
            sym={rouletteSym}
            losers={rouletteFor}
            players={players}
            spared={rouletteSpared}
            result={rouletteResult}
            onReroll={rerollGage}
            onDone={closeRoulette}
          />
        )}
      </div>
    );
  }

  // FIN
  // Du moins de peines au plus ; couronnés = règle unique des gagnants (la même que la Soirée)
  const ranking = players
    .map((name, i) => ({ name, i, losses: losses[i] ?? 0 }))
    .sort((a, b) => a.losses - b.losses);
  const winners = winnersOf({ names: players, values: losses, lowerWins: true });
  const tops = ranking.filter((p) => winners.includes(p.name));
  const top = tops[0];
  const rest = ranking.filter((p) => !winners.includes(p.name));
  return (
    <div className="relative flex min-h-[100svh] flex-col px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
      {tools}
      <ScrollTop dep={phase} />
      <ConfettiBurst count={60} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h1 style={{ ...DISPLAY, fontSize: 48, lineHeight: 0.95 }}>{tr.overTitle}</h1>
        <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>
          {tr.overSub}
        </p>

        {top ? (
          <div className="relative mt-16 rounded-[26px] px-5 pb-4 pt-[52px] text-center" style={{ ...stk(ACCENT, 6), color: INK, transform: "rotate(-2deg)" }}>
            <div className="absolute -top-[62px] left-1/2 flex -translate-x-1/2 gap-1">
              {tops.map((p) => <PlayerBlob key={p.i} name={p.name} colorIndex={p.i} size={tops.length > 1 ? 60 : 76} mood="rofl" crown arms />)}
            </div>
            <p className="text-[15px] font-bold">{tr.overStar}</p>
            <p style={{ ...DISPLAY, fontSize: tops.length > 1 || top.name.length > 11 ? 32 : 40, lineHeight: 1, overflowWrap: "anywhere" }}>{wt.names(tops.map((p) => p.name))}</p>
            <p className="mt-1 text-[15px] font-bold">{tr.penalties(top.losses)}</p>
          </div>
        ) : (
          <p className="mt-6 text-center text-[20px]" style={DISPLAY}>{wt.allTiedSub}</p>
        )}

        <div className="mt-5 space-y-2.5">
          {rest.map((p, k) => (
            <div key={p.i} className="flex items-center gap-3 rounded-[18px] px-3.5" style={{ ...stk("#fff", 3, 2.5), color: INK, minHeight: 54, transform: `rotate(${k % 2 ? 0.8 : -0.8}deg)` }}>
              {/* Ex aequo = même rang */}
              <span className="w-7 text-[18px]" style={DISPLAY}>{1 + ranking.filter((x) => x.losses < p.losses).length}</span>
              <PlayerAvatar name={p.name} colorIndex={p.i} size={32} mood="happy" />
              <span className="min-w-0 flex-1 truncate text-[17px] font-bold">{p.name}</span>
              <span className="text-[15px] font-bold">{tr.penalties(p.losses)}</span>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>{tr.overWater}</p>
        {/* Version découverte : une seule petite bannière, en fin de partie */}
        {!unlocked && <PremiumNudge style={{ marginTop: 16 }} text={nudge.picolette(fmtCount(cardsFor(lang).length - freeDeck(lang).length, lang))} />}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <ShareResultButton card={() => tourneeCard(ranking.map((p) => ({ name: p.name, losses: p.losses, colorIndex: p.i })), tops.length > 0)} />
          <IdeaButton game={tr.gameName} kind={tr.ideaKind} />
        </div>

        <div className="min-h-6 flex-1" />
        <div className="space-y-3">
          <SoireeNextButton bg="#fff" />
          <Push big bg={ACCENT} onClick={() => { playSfx("whoosh", { volume: 0.6 }); setPhase("setup"); }} className="w-full">
            <RotateCcw size={22} strokeWidth={3} aria-hidden /> {tr.playAgain}
          </Push>
          {onReturnToLobby && (
            <Push bg="#fff" onClick={onReturnToLobby} className="w-full">
              <Home size={19} strokeWidth={3} aria-hidden /> {tr.backHome}
            </Push>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function JokerAction({
  effect, canUndo, onPick, onShield, onAmnesty, hasRule, onClear, onReader,
}: {
  effect: NonNullable<PicoletteCard["joker"]>;
  canUndo: boolean;
  onPick: () => void;
  onShield: () => void;
  onAmnesty: () => void;
  hasRule: boolean;
  onClear: () => void;
  onReader: () => void;
}) {
  const t = useT(STR);
  if (effect === "reader") return <Push big bg="#7A4EE8" onClick={onReader} className="w-full"><Smartphone size={22} strokeWidth={3} aria-hidden /> {t.pickReader}</Push>;
  if (effect === "clear") {
    return (
      <Push big bg="#7A4EE8" onClick={onClear} disabled={!hasRule} className="w-full">
        {hasRule ? <><Eraser size={22} strokeWidth={3} aria-hidden /> {t.liftRule}</> : t.noRule}
      </Push>
    );
  }
  if (effect === "pick") return <Push big bg="#7A4EE8" onClick={onPick} className="w-full"><Hand size={22} strokeWidth={3} aria-hidden /> {t.choosePenalty}</Push>;
  if (effect === "shield") return <Push big bg="#7A4EE8" onClick={onShield} className="w-full"><Shield size={22} strokeWidth={3} aria-hidden /> {t.giveShield}</Push>;
  if (effect === "amnesty") {
    return (
      <Push big bg="#7A4EE8" onClick={onAmnesty} disabled={!canUndo} className="w-full">
        {canUndo ? <><Undo2 size={22} strokeWidth={3} aria-hidden /> {t.undoLast}</> : t.nothingToUndo}
      </Push>
    );
  }
  return null;
}

function PacksScreen({
  packs, setPacks, unlocked, penaltyMode, setPenaltyMode, onLaunch, onBack,
}: {
  packs: Set<Pack>;
  unlocked: boolean;
  setPacks: (s: Set<Pack>) => void;
  penaltyMode: PenaltyMode;
  setPenaltyMode: (p: PenaltyMode) => void;
  onLaunch: () => void;
  onBack: () => void;
}) {
  const [sipsOk] = useState(() => sipsAllowed(true));
  const togglePack = (p: Pack) => {
    const next = new Set(packs);
    if (next.has(p)) next.delete(p); else next.add(p);
    if (next.size === 0) next.add(p); // au moins 1 pack
    playSfx("toggle", { volume: 0.5 });
    setPacks(next);
  };
  const t = useT(STR);
  const lang = useLang();
  const free = useMemo(() => freeDeck(lang), [lang]);
  const total = useMemo(() => (unlocked ? filterDeck(packs, lang).length : free.length), [packs, lang, unlocked, free]);
  const packInfo = packInfoFor(lang);
  const allCards = cardsFor(lang);

  return (
    <div className="flex min-h-[100svh] flex-col px-5 text-white" style={{ ...PAGE, paddingTop: TOP }}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h1 style={{ ...DISPLAY, fontSize: 48, lineHeight: 0.95 }}>{t.packsTitle}</h1>
        <p className="mt-2 text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>{t.packsSub}</p>

        {!unlocked && (
          <div className="mt-5 grid grid-cols-1 gap-3">
            {/* Paquet découverte, toujours le même */}
            <div className="flex w-full items-center gap-3 rounded-[22px] px-4 py-3.5 text-left" style={{ ...stk(PACK_LOOK.soft.bg, 4), color: inkOn(PACK_LOOK.soft.bg), transform: "rotate(-1deg)" }}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ ...stk("#fff", 2, 2.5), color: INK }}>
                <Sparkles size={22} strokeWidth={2.8} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block" style={{ ...DISPLAY, fontSize: 22, lineHeight: 1.05 }}>{t.freeDeck(free.length)}</span>
                <span className="mt-0.5 block text-[14px] font-semibold" style={{ opacity: 0.85 }}>{t.freeDeckSub}</span>
              </span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: INK, border: `2.5px solid ${INK}`, color: "#fff" }}>
                <Check size={18} strokeWidth={3.4} aria-hidden />
              </span>
            </div>
            <p className="mt-2 text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.82)" }}>{t.morePacks}</p>
            {(Object.keys(packInfo) as Pack[]).map((p) => {
              const info = packInfo[p];
              const freeSet = new Set(free.map((c) => c.text));
              // Aperçu : 2 cartes courtes du pack, hors paquet découverte, sans prénom à remplacer
              const preview = allCards
                .filter((c) => c.pack === p && !freeSet.has(c.text) && !c.text.includes("{") && c.text.length <= 60 && c.type !== "prefere")
                .slice(0, 2)
                .map((c) => c.text);
              return (
                <LockedPack
                  key={p}
                  label={`${info.label}${info.adult ? " · 18+" : ""} · ${t.cardsCount(allCards.filter((c) => c.pack === p).length)}`}
                  preview={preview}
                />
              );
            })}
          </div>
        )}

        {unlocked && <div className="mt-5 grid grid-cols-1 gap-3">
          {(Object.keys(packInfo) as Pack[]).map((p, k) => {
            const info = packInfo[p];
            const look = PACK_LOOK[p];
            const active = packs.has(p);
            const count = allCards.filter((c) => c.pack === p).length;
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
                  <span className="mt-0.5 block text-[14px] font-semibold" style={{ opacity: 0.85 }}>{info.sub.replace(/^18\+ · (.)/, (_m, c: string) => c.toUpperCase())}{"\u00A0"}· {t.cardsCount(count)}</span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: active ? INK : "transparent", border: `2.5px solid ${active ? INK : "rgba(255,255,255,0.5)"}`, color: "#fff" }}>
                  {active && <Check size={18} strokeWidth={3.4} aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>}

        <h2 className="mt-8" style={{ ...DISPLAY, fontSize: 30, lineHeight: 1 }}>{t.penaltyTitle}</h2>
        {/* Mode sans alcool / Soirée Chill : pas de choix, gages seulement */}
        {sipsOk && <div className="mt-3 grid grid-cols-2 gap-3">
          {([
            { v: "mix", icons: [CupSoda, Drama], label: t.modeMix },
            { v: "gage", icons: [Drama], label: t.modeDares },
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
        </div>}
        <p className="mt-3 text-[15px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>
          {sipsOk ? t.penaltyNote : t.penaltyNoSips}
        </p>

        <div className="mt-6 flex justify-center"><IdeaButton game={t.gameName} kind={t.ideaKind} /></div>

        <div className="min-h-6 flex-1" />
        <div className="sticky bottom-0 -mx-5 mt-4 px-5 pt-4" style={{ paddingBottom: BOTTOM, background: "linear-gradient(180deg, transparent, #1E1250 35%)" }}>
          <Push big bg={ACCENT} onClick={() => { playSfx("whoosh", { volume: 0.6 }); onLaunch(); }} disabled={total === 0} className="w-full">
            {t.launch(total)}
          </Push>
          <button type="button" onClick={onBack} className="mx-auto mt-1 flex min-h-11 items-center gap-1.5 px-4 text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.82)" }}>
            <ArrowLeft size={17} strokeWidth={3} aria-hidden /> {t.editPlayers}
          </button>
        </div>
      </div>
    </div>
  );
}

function PickerOverlay({
  title, sub, players, shields, onPick, onCancel, only, mood = "sad", multi, onConfirm,
}: {
  title: string; sub?: string; players: string[]; shields: boolean[]; onPick: (i: number) => void; onCancel: () => void;
  only?: number[]; mood?: "sad" | "happy";
  /** multi : on coche plusieurs joueurs puis on valide (camp perdant). */
  multi?: boolean; onConfirm?: (idxs: number[]) => void;
}) {
  const t = useT(STR);
  const [sel, setSel] = useState<number[]>([]);
  const tap = (i: number) => {
    if (!multi) { onPick(i); return; }
    playSfx("toggle", { volume: 0.5 });
    setSel((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0" style={{ background: "rgba(10,4,32,0.66)" }} onClick={onCancel} />
      <div
        className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto px-5 pt-5"
        style={{ background: "#FFF6E5", color: INK, borderRadius: "30px 30px 0 0", border: `3px solid ${INK}`, borderBottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)", animation: "pt-pop .3s ease-out" }}
      >
        <h2 style={{ ...DISPLAY, fontSize: multi ? 28 : 32, lineHeight: 1 }}>{title}</h2>
        {sub && <p className="mt-1.5 text-[15px] font-semibold leading-snug" style={{ opacity: 0.75 }}>{sub}</p>}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {players.map((name, i) => (only && !only.includes(i) ? null : (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              aria-pressed={multi ? sel.includes(i) : undefined}
              className="flex min-h-[58px] items-center gap-2.5 rounded-[18px] px-3 text-left active:translate-y-[3px]"
              style={{ ...stk(multi && sel.includes(i) ? "#FF3EA5" : "#fff", 3, 2.5), color: INK }}
            >
              <PlayerAvatar name={name} colorIndex={i} size={34} mood={mood} />
              <span className="line-clamp-2 min-w-0 flex-1 text-[16px] font-bold leading-tight" style={{ overflowWrap: "anywhere" }}>{name}</span>
              {shields[i] && <Shield size={20} strokeWidth={2.8} aria-label={t.shieldAria} />}
            </button>
          )))}
        </div>
        {multi && (
          <>
            {/* Égalité / tous pareil : tout le monde prend la peine, en un tap */}
            <button
              type="button"
              onClick={() => { playSfx("toggle", { volume: 0.5 }); setSel((prev) => (prev.length === players.length ? [] : players.map((_, i) => i))); }}
              aria-pressed={sel.length === players.length}
              className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[18px] px-3 text-[17px] font-extrabold active:translate-y-[3px]"
              style={{ ...stk(sel.length === players.length ? "#FF3EA5" : "#fff", 3, 2.5), color: INK }}
            >
              <Users size={20} strokeWidth={3} aria-hidden /> {t.everyone}
            </button>
          </>
        )}
        {multi && (
          <Push big bg={ACCENT} onClick={() => onConfirm?.(sel)} disabled={sel.length === 0} className="mt-4 w-full">
            <Check size={22} strokeWidth={3.2} aria-hidden /> {t.confirm(sel.length)}
          </Push>
        )}
        <button type="button" onClick={onCancel} className="mx-auto mt-3 block min-h-11 px-4 text-[16px] font-bold underline decoration-2 underline-offset-4">{t.cancel}</button>
      </div>
    </div>
  );
}

// Faces de la roulette de peine (icônes)
type RouletteFace = "wait" | "shield" | "gage" | "sips";
const ROULETTE_ICONS: Record<RouletteFace, LucideIcon> = { wait: Ellipsis, shield: Shield, gage: Drama, sips: CupSoda };

function RouletteOverlay({
  sym, losers, players, spared, result, onReroll, onDone,
}: { sym: RouletteFace; losers: number[]; players: string[]; spared: number[]; result: PenaltyResult | null; onReroll: () => void; onDone: () => void }) {
  const Icon = ROULETTE_ICONS[sym];
  const t = useT(STR);
  const names = joinNames(losers.map((i) => players[i] ?? ""));
  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto px-5 text-white" style={{ ...PAGE, paddingTop: TOP, paddingBottom: BOTTOM }}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <p className="text-[17px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.penaltyFallsOn}</p>
        <div className="mt-2 flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5" style={{ ...stk("#fff", 4), color: INK, transform: "rotate(-2deg)" }}>
          <span className="flex shrink-0">
            {losers.slice(0, 3).map((i, k) => (
              <span key={i} style={{ marginLeft: k ? -14 : 0 }}><PlayerAvatar name={players[i]} colorIndex={i} size={40} mood="shocked" /></span>
            ))}
          </span>
          <span style={{ ...DISPLAY, fontSize: losers.length > 1 || names.length > 14 ? 24 : 30, lineHeight: 1.05, overflowWrap: "anywhere" }}>{names}</span>
        </div>
        {spared.length > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
            <Shield size={16} strokeWidth={3} aria-hidden /> {t.shieldSpared(joinNames(spared.map((i) => players[i] ?? "")), spared.length)}
          </p>
        )}

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
                  ? t.sips(result.n)
                  : result.kind === "gage"
                    ? result.text
                    : t.shieldResult}
              </p>
              <p className="mt-2 text-[15px] font-semibold" style={{ opacity: 0.8 }}>
                {result.kind === "sips"
                  ? t.sipsNote
                  : result.kind === "shield"
                    ? t.shieldNote
                    : t.dareNote}
              </p>
            </div>
            {result.kind !== "shield" && (
              <div className="mt-5 flex justify-center">
                <RerollButton onClick={onReroll} label={result.kind === "sips" ? t.ratherDare : t.anotherDare} />
              </div>
            )}
          </div>
        ) : (
          <p className="mt-6 text-[17px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.spinning}</p>
        )}
      </div>
      {result && (
        <div className="mx-auto mt-6 w-full max-w-md">
          <Push big bg={ACCENT} onClick={onDone} className="w-full">
            <Check size={22} strokeWidth={3.2} aria-hidden /> {t.done}
          </Push>
        </div>
      )}
    </div>
  );
}

function LossRecap({
  players, losses, shields, highlight = [],
}: { players: string[]; losses: number[]; shields: boolean[]; highlight?: number[] }) {
  const t = useT(STR);
  return (
    <div className="mx-auto mt-4 flex w-full max-w-md flex-wrap items-center justify-center gap-2">
      {players.map((name, i) => {
        const hot = highlight.includes(i);
        return (
          <div
            key={i}
            className="flex h-9 items-center gap-1.5 rounded-full pl-1 pr-3"
            style={{ ...stk(hot ? "#FF3EA5" : "#fff", 2, 2.5), color: INK, transform: hot ? "rotate(-2deg) scale(1.05)" : undefined, transition: "transform .2s" }}
          >
            <PlayerAvatar name={name} colorIndex={i} size={26} mood={hot ? "sad" : "happy"} border={false} />
            <span className="max-w-[110px] truncate text-[14px] font-bold">{name}</span>
            {shields[i] && <Shield size={14} strokeWidth={3} aria-label={t.shieldAria} />}
            <span className="text-[14px] font-extrabold tabular-nums">{losses[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Pastille « Qui perd ? » : la condition de défaite + ce que vaut la peine (s'adapte au mode Chill). */
function LoseBox({
  lose, extra, who, players, penaltyMode,
}: { lose: string; extra?: string; who: number[]; players: string[]; penaltyMode: PenaltyMode }) {
  const t = useT(STR);
  return (
    <div className="mt-3 rounded-[18px] px-3.5 py-2.5 text-left" style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, transform: "rotate(-0.6deg)" }}>
      <p className="text-[16px] font-bold leading-snug" style={{ overflowWrap: "break-word" }}>
        <span className="mr-1.5 inline-flex translate-y-[-1px] items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 align-middle text-[13px] font-extrabold" style={{ background: "#FF3EA5", color: INK }}>
          <Skull size={14} strokeWidth={3} aria-hidden /> {t.loseTitle}
        </span>
        <RichText text={lose} who={who} players={players} cardBg={INK} />
      </p>
      {extra && <p className="mt-0.5 text-[14px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>{extra}</p>}
      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold leading-tight" style={{ color: "rgba(255,255,255,0.7)" }}>
        {penaltyMode === "mix" && <CupSoda size={15} strokeWidth={2.6} className="shrink-0" aria-hidden />}
        <Drama size={15} strokeWidth={2.6} className="shrink-0" aria-hidden />
        <span>{penaltyMode === "mix" ? t.penaltyIsMix : t.penaltyIsDare}</span>
      </p>
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
