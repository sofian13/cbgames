"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import { useKeyedState } from "@/lib/use-keyed-state";

// ── Types ───────────────────────────────────────────────
// Les identifiants techniques restent rouge/bleu/vert/jaune ; l'affichage
// utilise les teintes de la DA (corail, ciel, menthe, soleil).
type CardColor = "rouge" | "bleu" | "vert" | "jaune";

interface CardData {
  type: "number" | "action" | "wild";
  color?: CardColor;
  value?: number;
  action?: "plus2" | "passe" | "inverse";
  wild?: "joker" | "plus4";
  chosenColor?: CardColor | null;
  playable?: boolean;
}

interface OtherPlayer {
  id: string;
  name: string;
  cardCount: number;
  isCurrentTurn: boolean;
  calledUno: boolean;
  mustCallUno: boolean;
  catchable?: boolean;
  isBot?: boolean;
  connected?: boolean;
}

interface UnoEvent {
  playerId: string;
  playerName: string;
  catcherName?: string;
  type: "called" | "caught";
}

interface UnoState {
  status: "waiting" | "playing" | "game-over";
  myHand: CardData[];
  myId: string;
  otherPlayers: OtherPlayer[];
  topCard: CardData;
  currentPlayerId: string;
  direction: 1 | -1;
  timeLeft: number;
  deckCount: number;
  isMyTurn: boolean;
  canDraw: boolean;
  drewCard: boolean;
  canPassAfterDraw: boolean;
  turnOrder: string[];
  unoEvent?: UnoEvent;
}

// ── Couleurs (DA) ────────────────────────────────────────
const COLORS: Record<CardColor, { name: string; hex: string; dark: string; ink: string; glow: string }> = {
  rouge: { name: "Corail", hex: "#FF6B5B", dark: "#D9483A", ink: "#fff", glow: "rgba(255,107,91,0.5)" },
  bleu: { name: "Ciel", hex: "#4ECDC4", dark: "#2A9D96", ink: "#0B2A28", glow: "rgba(78,205,196,0.5)" },
  vert: { name: "Menthe", hex: "#3DDC97", dark: "#22A86E", ink: "#0B2A1C", glow: "rgba(61,220,151,0.5)" },
  jaune: { name: "Soleil", hex: "#FFD23F", dark: "#E0AA00", ink: "#3B2900", glow: "rgba(255,210,63,0.5)" },
};
const COLOR_ORDER: CardColor[] = ["rouge", "bleu", "vert", "jaune"];
const JOKER_GRADIENT = "linear-gradient(145deg, #7A4EE8 0%, #5B36D6 45%, #FF3EA5 100%)";

const ACTION_LABELS: Record<string, string> = {
  plus2: "+2",
  passe: "⦸",
  inverse: "⇄",
};

const ACTION_NAMES: Record<string, string> = {
  plus2: "Pioche 2",
  passe: "Passe",
  inverse: "Inversion",
};

// ── Card display helpers ─────────────────────────────────
function getCardLabel(card: CardData): string {
  if (card.type === "number") return String(card.value ?? 0);
  if (card.type === "action") return ACTION_LABELS[card.action ?? ""] ?? "?";
  if (card.wild === "plus4") return "+4";
  return "★";
}

function getCardName(card: CardData): string {
  if (card.type === "number") return `${card.color}-${card.value}`;
  if (card.type === "action") return `${card.color}-${card.action}`;
  if (card.wild === "plus4") return "plus4";
  return "joker";
}

function getAmbientBackground(topCard?: CardData): string {
  const base = "#0a0a0f";
  if (!topCard) return base;
  const color = topCard.type === "wild" ? topCard.chosenColor : topCard.color;
  if (!color) return base;
  return `radial-gradient(circle at 50% 30%, ${COLORS[color].glow.replace("0.5", "0.22")}, transparent 45%), ${base}`;
}

/** Largeur mesurée d'un élément (pour serrer la main sans déborder). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const HAND_W = 56;
const HAND_H = 82;

// ══════════════════════════════════════════════════════════
export default function UnoGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction, sendRaw } = useGame(roomCode, "uno", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as UnoState;
  const [colorPickerCard, setColorPickerCard] = useState<number | null>(null);
  const drawLockRef = useRef(false);
  const [handRef, handW] = useWidth<HTMLDivElement>();

  const handKey =
    state?.myHand
      ?.map((card, index) =>
        `${index}-${getCardName(card)}-${card.playable ? 1 : 0}-${card.chosenColor ?? "none"}`
      )
      .join("|") ?? "empty";
  const unoEventKey = state?.unoEvent
    ? `${state.unoEvent.type}-${state.unoEvent.playerId}-${state.unoEvent.catcherName ?? ""}`
    : "none";
  const [selectedCardIndex, setSelectedCardIndex] = useKeyedState<number | null>(handKey, null);
  const [unoToast, setUnoToast] = useKeyedState<UnoEvent | null>(
    unoEventKey,
    () => state?.unoEvent ?? null
  );

  useEffect(() => {
    if (!unoToast) return;
    const timeout = setTimeout(() => setUnoToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [setUnoToast, unoToast]);

  // ── Actions ────────────────────────────────────────────
  const playCard = useCallback(
    (cardIndex: number, card: CardData) => {
      if (!card.playable) return;
      if (card.type === "wild") {
        setColorPickerCard(cardIndex);
        return;
      }
      sendAction({ action: "play-card", cardIndex });
      setSelectedCardIndex(null);
    },
    [sendAction, setSelectedCardIndex]
  );

  /** 1er tap = sélectionner (la carte se lève), 2e tap = jouer. */
  const tapCard = useCallback(
    (index: number, card: CardData) => {
      if (selectedCardIndex === index) playCard(index, card);
      else setSelectedCardIndex(index);
    },
    [playCard, selectedCardIndex, setSelectedCardIndex]
  );

  const handleChooseColor = useCallback(
    (color: CardColor) => {
      if (colorPickerCard === null) return;
      sendAction({ action: "play-card", cardIndex: colorPickerCard, chosenColor: color });
      setColorPickerCard(null);
      setSelectedCardIndex(null);
    },
    [colorPickerCard, sendAction, setSelectedCardIndex]
  );

  const handleDraw = useCallback(() => {
    if (drawLockRef.current) return;
    drawLockRef.current = true;
    sendAction({ action: "draw" });
    setTimeout(() => { drawLockRef.current = false; }, 1000);
  }, [sendAction]);

  const handlePassAfterDraw = useCallback(() => {
    sendAction({ action: "pass-after-draw" });
  }, [sendAction]);

  const handleUnoCall = useCallback(() => {
    sendAction({ action: "uno" });
  }, [sendAction]);

  const handleCatchUno = useCallback(
    (targetId: string) => {
      sendAction({ action: "catch-uno", targetId });
    },
    [sendAction]
  );

  // ── Waiting state ──────────────────────────────────────
  if (!state || !state.status || state.status === "waiting") {
    return (
      <div
        className="flex flex-1 items-center justify-center overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-[max(env(safe-area-inset-top),12px)]"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(255,107,91,0.12), transparent 40%), radial-gradient(circle at 20% 70%, rgba(78,205,196,0.10), transparent 40%), radial-gradient(circle at 80% 70%, rgba(61,220,151,0.10), transparent 40%), #0a0a0f",
        }}
      >
        <div className="flex max-w-md flex-col items-center gap-3 rounded-3xl border border-white/25 bg-black/30 px-6 py-6 text-center shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <span className="text-4xl font-black tracking-tight text-white/90" style={{ fontFamily: "var(--font-display)" }}>
            Pioche !
          </span>
          <ul className="space-y-1 text-left text-[13px] leading-snug text-white/65">
            <li>• Pose une carte de même couleur ou de même valeur. Le Joker change la couleur.</li>
            <li>• +2 / +4 : le suivant pioche et passe son tour (pas de cumul des +2/+4).</li>
            <li>• Plus qu&apos;une carte ? Appuie sur « Dernière carte ! » dans les 3 s, sinon on peut t&apos;attraper (+2).</li>
            <li>• Touche une carte pour la lever, retouche-la (ou « Jouer ») pour la poser.</li>
          </ul>
          <p className="animate-pulse text-sm text-white/40">En attente des joueurs…</p>
          <button
            onClick={() => sendRaw({ type: "start-with-bots" })}
            className="min-h-[44px] rounded-xl px-5 py-3 text-sm font-black text-white active:scale-95"
            style={{ background: "var(--cb-brand)", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
          >
            Jouer avec des bots
          </button>
        </div>
      </div>
    );
  }

  // ── Main game ──────────────────────────────────────────
  if (state.status === "playing" || state.status === "game-over") {
    const myHand = state.myHand ?? [];
    const otherPlayers = state.otherPlayers ?? [];
    const topCard = state.topCard;
    const isMyTurn = state.isMyTurn;
    const mePlayer = otherPlayers.find((p) => p.id === playerId);
    const showUnoButton = myHand.length === 1 && !!mePlayer?.mustCallUno;
    const catchablePlayers = otherPlayers.filter((p) => p.id !== playerId && p.catchable);
    const selected = selectedCardIndex !== null ? myHand[selectedCardIndex] : undefined;

    // Main serrée pour tenir dans la largeur disponible
    const n = myHand.length;
    const avail = Math.max(HAND_W, (handW || 600) - 8);
    const step = n > 1 ? Math.min(HAND_W + 4, (avail - HAND_W) / (n - 1)) : 0;

    return (
      <div
        className="relative flex flex-1 select-none flex-col overflow-hidden transition-all duration-700"
        style={{
          background: getAmbientBackground(topCard),
          paddingTop: "max(env(safe-area-inset-top), 8px)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {/* ── Toast ──────────────────────────────── */}
        {unoToast && (
          <div className="absolute left-1/2 top-[max(env(safe-area-inset-top),12px)] z-50 -translate-x-1/2">
            <div
              className={cn(
                "whitespace-nowrap rounded-2xl border px-5 py-2.5 text-sm font-semibold backdrop-blur-md",
                unoToast.type === "called"
                  ? "border-[#4ECDC4]/40 bg-[#4ECDC4]/15 text-[#BFF3EF]"
                  : "border-[#FF6B5B]/40 bg-[#FF6B5B]/15 text-[#FFC9C2]"
              )}
            >
              {unoToast.type === "called"
                ? `${unoToast.playerName} a dit « Dernière carte ! »`
                : `${unoToast.catcherName} a attrapé ${unoToast.playerName} : +2 cartes !`}
            </div>
          </div>
        )}

        {/* ── Choix de couleur ─────────────────────── */}
        {colorPickerCard !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md">
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/25 bg-black/30 p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-sm">
              <p className="text-lg font-semibold text-white/90" style={{ fontFamily: "var(--font-display)" }}>Choisis une couleur</p>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_ORDER.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChooseColor(color)}
                    className="flex h-20 w-20 items-end justify-center rounded-2xl border border-white/20 pb-2 transition-transform active:scale-95"
                    style={{
                      background: `linear-gradient(145deg, ${COLORS[color].hex}, ${COLORS[color].dark})`,
                      boxShadow: `0 0 20px ${COLORS[color].glow}`,
                    }}
                  >
                    <span className="text-[13px] font-bold" style={{ color: COLORS[color].ink }}>
                      {COLORS[color].name}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setColorPickerCard(null)}
                className="min-h-[44px] px-4 text-sm text-white/50 active:text-white/80"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* ── Haut : adversaires (coin haut-droit réservé à l'engrenage) ── */}
        <div className="flex items-start gap-2 overflow-x-auto pl-3 pr-16 pb-1">
          {otherPlayers
            .filter((p) => p.id !== playerId)
            .map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-3 py-1.5 transition-all",
                  p.isCurrentTurn
                    ? "border-[#4ECDC4]/50 bg-[#4ECDC4]/10 shadow-[0_0_16px_rgba(78,205,196,0.2)]"
                    : "border-white/[0.08] bg-white/[0.03]",
                  p.connected === false && "opacity-40"
                )}
              >
                <span
                  className={cn(
                    "max-w-[90px] truncate text-[12px] font-semibold",
                    p.isCurrentTurn ? "text-[#BFF3EF]" : "text-white/60"
                  )}
                >
                  {p.name}
                  {p.isBot ? " · bot" : ""}
                </span>
                <span className="text-[12px] font-bold text-white/45">
                  🂠 {p.cardCount}
                  {p.connected === false ? " · parti" : ""}
                </span>
                {p.calledUno && p.cardCount === 1 && (
                  <span className="text-[11px] font-bold text-[#4ECDC4]">Dernière carte !</span>
                )}
              </div>
            ))}
        </div>

        {/* ── Centre : pioche + défausse ── */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center gap-5">
          <div className="absolute left-3 top-1 flex items-center gap-2">
            {isMyTurn ? (
              <span className="text-[13px] font-semibold text-[#4ECDC4] animate-pulse">
                Ton tour ! · {state.timeLeft ?? 0}s
              </span>
            ) : (
              <span className="text-[13px] text-white/40">
                Tour de {otherPlayers.find((p) => p.id === state.currentPlayerId)?.name ?? "…"}
              </span>
            )}
            <span className="text-[12px] text-white/30">{state.direction === 1 ? "↻" : "↺"}</span>
          </div>

          {/* Pioche */}
          <button
            onClick={handleDraw}
            disabled={!state.canDraw}
            className={cn(
              "relative flex h-[104px] w-[72px] flex-col items-center justify-center rounded-2xl border-2 transition-all",
              state.canDraw
                ? "border-white/20 bg-white/[0.06] active:scale-95"
                : "border-white/[0.06] bg-white/[0.02] opacity-30"
            )}
          >
            <span className="text-[13px] font-bold text-white/70">Piocher</span>
            <span className="mt-1 text-[12px] text-white/35">{state.deckCount}</span>
          </button>

          {topCard && <CardView card={topCard} size="large" />}

          {state.canPassAfterDraw && (
            <button
              onClick={handlePassAfterDraw}
              className="min-h-[44px] rounded-xl border border-white/[0.15] bg-white/[0.06] px-5 text-sm font-semibold text-white/75 active:scale-95"
            >
              Passer
            </button>
          )}
        </div>

        {/* ── Barre d'actions ─────────────────────────── */}
        <div className="flex min-h-[48px] flex-wrap items-center justify-center gap-2 px-3">
          {showUnoButton && (
            <button
              onClick={handleUnoCall}
              className="min-h-[44px] animate-pulse rounded-2xl px-6 text-base font-black tracking-wide text-[#0B2A1C] shadow-[0_0_24px_rgba(61,220,151,0.45)] active:scale-95"
              style={{ background: "linear-gradient(90deg,#3DDC97,#4ECDC4)", fontFamily: "var(--font-display)" }}
            >
              Dernière carte !
            </button>
          )}
          {catchablePlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => handleCatchUno(p.id)}
              className="min-h-[44px] rounded-xl border border-[#FF6B5B]/40 bg-[#FF6B5B]/15 px-4 text-[13px] font-bold text-[#FFC9C2] active:scale-95"
            >
              {p.name} n&apos;a pas dit « Dernière carte ! » — Attrape-le (+2)
            </button>
          ))}
          {selected && isMyTurn && (
            <button
              onClick={() => selectedCardIndex !== null && playCard(selectedCardIndex, selected)}
              disabled={!selected.playable}
              className="min-h-[44px] rounded-xl px-6 text-sm font-black text-[#0B2A28] active:scale-95 disabled:opacity-40"
              style={{ background: "#4ECDC4", fontFamily: "var(--font-display)" }}
            >
              {selected.playable ? "Jouer" : "Pas jouable"}
            </button>
          )}
          {!selected && state.drewCard && (
            <span className="text-[13px] font-medium text-[#BFF3EF]/80">Carte piochée ! Joue-la ou passe.</span>
          )}
          {!selected && isMyTurn && !state.drewCard && !showUnoButton && catchablePlayers.length === 0 && (
            <span className="text-[12px] text-white/40">Touche une carte pour la lever, retouche pour la jouer</span>
          )}
        </div>

        {/* ── Ma main ───────────── */}
        <div
          ref={handRef}
          className="relative mx-3"
          style={{ height: HAND_H + 22, marginBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        >
          {myHand.map((card, index) => {
            const isSelected = selectedCardIndex === index;
            const x = (index - (n - 1) / 2) * step;
            return (
              <button
                key={`${index}-${getCardName(card)}`}
                onClick={() => tapCard(index, card)}
                aria-label={`Carte ${getCardLabel(card)}`}
                className={cn(
                  "absolute bottom-0 left-1/2 block transition-transform duration-150",
                  !card.playable && "opacity-45"
                )}
                style={{
                  transform: `translateX(${x - HAND_W / 2}px) translateY(${isSelected ? -20 : 0}px)`,
                  zIndex: isSelected ? 100 : index,
                }}
              >
                <CardView card={card} size="hand" playable={!!card.playable} selected={isSelected} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Fallback ───────────────────────────────────────────
  return (
    <div className="flex flex-1 items-center justify-center" style={{ background: "#0a0a0f" }}>
      {error && <p className="text-sm text-[#FF6B5B]">{error}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Carte plate : gros chiffre centré + petits chiffres en coins
// ══════════════════════════════════════════════════════════
function CardView({
  card,
  size = "hand",
  playable = false,
  selected = false,
}: {
  card: CardData;
  size?: "hand" | "large";
  playable?: boolean;
  selected?: boolean;
}) {
  const isWild = card.type === "wild";
  const color = isWild ? card.chosenColor : card.color;
  const c = color ? COLORS[color] : null;
  const label = getCardLabel(card);
  const ink = isWild && !color ? "#fff" : c?.ink ?? "#fff";
  const large = size === "large";

  const background = isWild ? JOKER_GRADIENT : c ? c.hex : "#374151";
  const subtext =
    card.type === "action" ? ACTION_NAMES[card.action ?? ""] ?? "" : isWild ? (card.wild === "plus4" ? "Pioche 4" : "Joker") : "";

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{
        width: large ? 76 : HAND_W,
        height: large ? 110 : HAND_H,
        background,
        border: selected ? "3px solid #fff" : "2px solid rgba(255,255,255,0.35)",
        boxShadow: selected
          ? "0 0 0 2px rgba(78,205,196,0.7), 0 10px 20px rgba(0,0,0,0.45)"
          : playable || large
            ? `0 0 14px ${c?.glow ?? "rgba(122,78,232,0.5)"}`
            : "0 4px 10px rgba(0,0,0,0.35)",
      }}
    >
      <span
        className="relative z-10 font-black leading-none"
        style={{ color: ink, fontSize: large ? 40 : 28, fontFamily: "var(--font-display)" }}
      >
        {label}
      </span>
      <span
        className="absolute left-1.5 top-1 z-10 font-bold leading-none"
        style={{ color: ink, fontSize: large ? 14 : 12, fontFamily: "var(--font-display)" }}
      >
        {label}
      </span>
      <span
        className="absolute bottom-1 right-1.5 z-10 rotate-180 font-bold leading-none"
        style={{ color: ink, fontSize: large ? 14 : 12, fontFamily: "var(--font-display)" }}
      >
        {label}
      </span>

      {/* Couleur choisie sur un Joker */}
      {isWild && color && (
        <div
          className="absolute bottom-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white"
          style={{ background: COLORS[color].hex }}
        />
      )}

      {large && subtext && !(isWild && color) && (
        <span
          className="absolute bottom-1.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider opacity-80"
          style={{ color: ink }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
}
