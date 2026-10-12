"use client";

import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { TableBg, SeatAvatar, FanHand, PlayingCard, opponentSlots, useCardStyle, type Suit, type Rank } from "@/components/games/cards/card-kit";
import { useAudio } from "@/lib/hooks/useAudio";
import { sfxCardPlay, sfxTrickWin, sfxHandChime } from "@/lib/card-sfx";

interface OtherPlayer {
  id: string;
  name: string;
  cardCount: number;
  isCurrentTurn: boolean;
  passed: boolean;
  finishedAt: number | null;
  isBot?: boolean;
  title?: Title | null;
}

type Title = "president" | "vice-president" | "neutre" | "vice-trou" | "trou";
type CardT = { rank: Rank; suit: Suit };

interface PresidentState {
  status: "waiting" | "exchange" | "playing" | "round-over";
  currentPlayerId: string | null;
  timeLeft: number;
  lastCombo: CardT[];
  lastComboPlayer: string | null;
  forcedRank: Rank | null;
  otherPlayers: OtherPlayer[];
  titles?: Record<string, Title>;
  hierarchy?: string[];
  exchangePending?: string[];
  myHand?: CardT[];
  myExchange?:
    | { role: "give"; count: number; toName: string; received: CardT[] }
    | { role: "gave"; count: number; toName: string; cards: CardT[] }
    | null;
}

// Titres de la hiérarchie
const TITLE_PILL: Record<Title, { label: string; bg: string; fg: string }> = {
  "president": { label: "PRÉSIDENT", bg: "linear-gradient(180deg,#FFD23F,#E0AA00)", fg: "#3B2900" },
  "vice-president": { label: "VICE-PRÉS.", bg: "linear-gradient(180deg,#5BA3FF,#2A6FDB)", fg: "#fff" },
  "neutre": { label: "NEUTRE", bg: "rgba(255,255,255,0.18)", fg: "#fff" },
  "vice-trou": { label: "VICE-TROU", bg: "linear-gradient(180deg,#B98A5E,#7A5434)", fg: "#fff" },
  "trou": { label: "TROU-DU-CUL", bg: "linear-gradient(180deg,#8B5A2B,#4A2C10)", fg: "#fff" },
};
const TITLE_NAME: Record<Title, string> = {
  "president": "Président", "vice-president": "Vice-Président", "neutre": "Neutre",
  "vice-trou": "Vice-Trou", "trou": "Trou-du-cul",
};

/** Titre provisoire pendant la manche : 1er sorti = Président, 2e = Vice-P (≥ 4), fini sur un 2 = Trou. */
function liveTitle(finishedAt: number | null, total: number): Title | null {
  if (finishedAt === null) return null;
  if (finishedAt === -1) return "trou";
  if (finishedAt === 1) return "president";
  if (finishedAt === 2 && total >= 4) return "vice-president";
  return "neutre";
}

const fmtCard = (c: CardT) => `${c.rank}${c.suit}`;

function Rules() {
  return (
    <ul className="mt-4 max-w-sm space-y-1.5 text-left text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>
      <li>• Bats le combo posé avec autant de cartes, de valeur ≥ (3 &lt; … &lt; A &lt; 2).</li>
      <li>• Même valeur posée → « X ou rien » : le suivant doit poser la même valeur, sinon ça saute.</li>
      <li>• Un 2 ferme le pli : tu relances. Mais finir sur un 2 = Trou-du-cul.</li>
      <li>• Manche suivante : le Trou-du-cul donne ses 2 meilleures cartes au Président, qui lui en rend 2 (1 carte entre Vice-Trou et Vice-Président à partir de 4 joueurs).</li>
    </ul>
  );
}

export default function PresidentGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction, sendRaw } = useGame(roomCode, "president", playerId, playerName);
  const state = useGameStore((s) => s.gameState) as unknown as PresidentState | null;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const cardStyle = useCardStyle();
  const { muted } = useAudio();

  const myHand = state?.myHand ?? [];
  const isMyTurn = state?.status === "playing" && state?.currentPlayerId === playerId;

  // Réinitialise la sélection dès que la situation change (passe auto, nouveau pli, échange…)
  const selKey = `${state?.status}:${state?.currentPlayerId}:${state?.lastComboPlayer}:${state?.lastCombo?.length}:${myHand.length}`;
  const [prevSelKey, setPrevSelKey] = useState(selKey);
  if (selKey !== prevSelKey) {
    setPrevSelKey(selKey);
    setSelected(new Set());
  }

  // ── Bruitages : combo posé, pli emporté (relance), fin de manche ──
  const sfxComboRef = useRef("");
  const sfxStatusRef = useRef("");
  useEffect(() => {
    if (!state) return;
    const sig = `${state.lastComboPlayer ?? ""}:${state.lastCombo.map((c) => `${c.rank}${c.suit}`).join(",")}`;
    if (!muted) {
      if (sig !== sfxComboRef.current) {
        if (state.lastCombo.length > 0) sfxCardPlay();        // un combo vient d'être posé
        else if (sfxComboRef.current && sfxComboRef.current.split(":")[1]) sfxTrickWin(); // pli nettoyé → relance
      }
      if (state.status === "round-over" && sfxStatusRef.current !== "round-over") sfxHandChime(true);
    }
    sfxComboRef.current = sig;
    sfxStatusRef.current = state.status;
  }, [state, muted]);

  function toggle(i: number) {
    // When a rank is locked, only that rank can be selected.
    if (state?.status === "playing" && state?.forcedRank && myHand[i]?.rank !== state.forcedRank) return;
    setSelected((sel) => {
      const next = new Set(sel);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function playSelection() {
    if (selected.size === 0) return;
    sendAction({ action: "play-combo", indices: [...selected].sort((a, b) => a - b) });
    setSelected(new Set());
  }

  function pass() {
    sendAction({ action: "pass" });
    setSelected(new Set());
  }

  function giveSelection() {
    sendAction({ action: "give-cards", indices: [...selected] });
    setSelected(new Set());
  }

  // ── Waiting / round-over (lightweight, keep felt look) ──
  if (!state || !state.status || state.status === "waiting") {
    return (
      <div className="relative min-h-0 w-full flex-1">
        <TableBg tone="green">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.55)" }}>en attente</span>
            <h2 className="cb-display-lg mt-2">Distribution…</h2>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Min 3 joueurs · 1er à vider sa main = Président</p>
            <Rules />
            <button onClick={() => sendRaw({ type: "start-with-bots" })}
              className="mt-6 min-h-[44px] rounded-xl px-5 py-3 text-sm font-black"
              style={{ background: "var(--cb-brand)", color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>
              Jouer avec des bots
            </button>
          </div>
        </TableBg>
      </div>
    );
  }

  if (state.status === "round-over") {
    return (
      <div className="relative min-h-0 w-full flex-1">
        <TableBg tone="green">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.55)" }}>fin de manche</span>
            <h2 className="cb-display-lg mt-2">Hiérarchie révélée</h2>
            <ol className="mt-4 space-y-1.5">
              {(state.hierarchy ?? []).map((id) => {
                const t = state.titles?.[id];
                const name = id === playerId ? "Toi" : state.otherPlayers.find((p) => p.id === id)?.name ?? "?";
                return (
                  <li key={id} className="flex items-center justify-center gap-2 text-sm font-bold">
                    <span>{name}</span>
                    {t && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-black tracking-wider"
                            style={{ background: TITLE_PILL[t].bg, color: TITLE_PILL[t].fg, fontFamily: "var(--font-display)" }}>
                        {TITLE_PILL[t].label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>Les titres sont gardés pour la manche suivante (avec l&apos;échange de cartes).</p>
          </div>
        </TableBg>
      </div>
    );
  }

  if (state.status === "exchange") {
    const ex = state.myExchange;
    const giving = ex?.role === "give";
    return (
      <div className="relative min-h-0 w-full flex-1 select-none overflow-hidden">
        <TableBg tone="green">
          <div className="absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-[max(env(safe-area-inset-top),12px)] text-center text-white">
            <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.6)" }}>échange de cartes · {state.timeLeft}s</span>
            {giving && ex ? (
              <>
                <p className="mt-2 text-sm font-bold">
                  Tu as reçu {ex.received.map(fmtCard).join(" ")} de {ex.toName}.
                </p>
                <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Choisis {ex.count} carte{ex.count > 1 ? "s" : ""} à lui rendre (sinon tes plus faibles partent automatiquement).
                </p>
                <button onClick={giveSelection} disabled={selected.size !== ex.count}
                  className="mt-3 min-h-[44px] rounded-full px-5 text-[13px] font-black tracking-[0.1em] text-white active:scale-95 disabled:opacity-50"
                  style={{ background: selected.size === ex.count ? "linear-gradient(180deg,#22C55E,#15803D)" : "rgba(255,255,255,0.1)", fontFamily: "var(--font-display)" }}>
                  DONNER {selected.size}/{ex.count}
                </button>
              </>
            ) : ex?.role === "gave" ? (
              <p className="mt-2 text-sm font-bold">
                Tu as donné {ex.cards.map(fmtCard).join(" ")} à {ex.toName}. Il va t&apos;en rendre {ex.count}…
              </p>
            ) : (
              <p className="mt-2 text-sm font-bold">Le Président et le Trou-du-cul échangent leurs cartes…</p>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)-2px)] z-40 flex justify-center">
            <div style={{ width: "min(88%, 620px)" }}>
              <FanHand
                hand={myHand}
                onClickIndex={giving ? (i) => {
                  setSelected((sel) => {
                    const next = new Set(sel);
                    if (next.has(i)) next.delete(i);
                    else if (ex && next.size < ex.count) next.add(i);
                    return next;
                  });
                } : undefined}
                selectedSet={selected}
                disabled={!giving}
                cardSize="md"
                maxWidth={560}
                cardStyle={cardStyle}
              />
            </div>
          </div>
        </TableBg>
      </div>
    );
  }

  const opps = state.otherPlayers.filter((p) => p.id !== playerId);
  const total = state.otherPlayers.length;
  const myTitle = state.titles?.[playerId] ?? null;
  const slots = opponentSlots(opps.length);

  return (
    <div className="relative min-h-0 w-full flex-1 select-none overflow-hidden">
      <TableBg tone="green">
        {/* Opponents — arranged in a circle around the table */}
        {opps.map((o, i) => {
          const slot = slots[i] ?? { left: 50, top: 13 };
          const live = liveTitle(o.finishedAt, total);
          const t = live ?? o.title ?? null;
          const pill = t && t !== "neutre" ? TITLE_PILL[t] : null;
          return (
            <div key={o.id} className="absolute z-20 flex flex-col items-center"
                 style={{ left: `${slot.left}%`, top: `calc(${slot.top}% + env(safe-area-inset-top,0px))`, transform: "translate(-50%,-50%)", opacity: o.finishedAt ? 0.6 : 1 }}>
              {/* mini face-down fan */}
              <div className="mb-1 flex h-7 items-end justify-center">
                {Array.from({ length: Math.min(4, o.cardCount) }).map((_, k) => (
                  <div key={k} style={{ marginLeft: k === 0 ? 0 : -22, transform: `rotate(${(k - 1.5) * 7}deg)` }}>
                    <PlayingCard faceDown size="xs" />
                  </div>
                ))}
              </div>
              <SeatAvatar name={o.name} hue={i + 1} isBot={!!o.isBot} isTurn={o.isCurrentTurn} cardCount={o.cardCount} />
              {pill && (
                <span className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-black tracking-wider"
                      style={{ background: pill.bg, color: pill.fg, fontFamily: "var(--font-display)", opacity: live ? 1 : 0.8 }}>
                  {pill.label}
                </span>
              )}
              {o.passed && !o.finishedAt && (
                <span className="mt-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wider"
                      style={{ background: "rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-display)" }}>
                  PASSE
                </span>
              )}
            </div>
          );
        })}

        {/* Center — combo to beat */}
        <div className="absolute left-1/2 top-[46%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <span className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]"
                style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-display)" }}>
            {state.lastCombo.length === 0
              ? "tu mènes — joue ce que tu veux"
              : `à battre · ${state.lastCombo.length} carte${state.lastCombo.length > 1 ? "s" : ""}`}
          </span>
          {state.lastCombo.length > 0 && (
            <div className="flex">
              {state.lastCombo.map((c, i) => (
                <div
                  key={`${state.lastComboPlayer}-${i}-${c.rank}${c.suit}`}
                  style={{
                    animation: "trickCardIn 280ms cubic-bezier(0.34,1.2,0.64,1)",
                    ["--enter-from" as string]: "translateY(-46px) scale(0.55)",
                  }}
                >
                  <div style={{
                    marginLeft: i === 0 ? 0 : -14,
                    transform: `rotate(${(i - (state.lastCombo.length - 1) / 2) * 4}deg)`,
                    filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.55))",
                  }}>
                    <PlayingCard rank={c.rank} suit={c.suit} size="md" cardStyle={cardStyle} raised />
                  </div>
                </div>
              ))}
            </div>
          )}
          {isMyTurn && (
            <span className="mt-1 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-black tracking-[0.12em] text-white"
                  style={{ background: state.timeLeft <= 5 ? "linear-gradient(180deg,#FF6B5B,#C13D1A)" : "linear-gradient(180deg,#FF8E58,#C13D1A)", fontFamily: "var(--font-display)" }}>
              À TOI · {state.timeLeft}s
            </span>
          )}
        </div>

        {/* Locked-rank banner — "X ou rien" */}
        {state.forcedRank && (
          <div className="absolute left-1/2 top-[27%] z-30 -translate-x-1/2 animate-pulse">
            <span className="whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black tracking-[0.08em] text-white"
                  style={{ background: "linear-gradient(180deg,#FF8E58,#C13D1A)", border: "1.5px solid rgba(255,255,255,0.3)", fontFamily: "var(--font-display)", boxShadow: "0 0 18px rgba(255,140,90,0.5)" }}>
              🔒 {state.forcedRank} ou rien — sinon ça saute
            </span>
          </div>
        )}

        {/* Action bar — above the fan */}
        {isMyTurn && (
          <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+118px)] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            <span className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-[12px] font-bold text-white/85"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "var(--font-display)" }}>
              {selected.size === 0 ? "sélectionne un combo" : `${selected.size} carte${selected.size > 1 ? "s" : ""}`}
            </span>
            {state.lastCombo.length > 0 && (
              <button onClick={pass}
                className="min-h-[44px] rounded-full px-4 text-[13px] font-black tracking-[0.12em] text-white active:scale-95"
                style={{ background: "linear-gradient(180deg,#3B82F6,#1D4ED8)", border: "1.5px solid rgba(180,210,255,0.4)", fontFamily: "var(--font-display)", boxShadow: "0 0 14px rgba(59,130,246,0.4)" }}>
                PASSE
              </button>
            )}
            <button onClick={playSelection} disabled={selected.size === 0}
              className="min-h-[44px] rounded-full px-4 text-[13px] font-black tracking-[0.12em] text-white active:scale-95 disabled:opacity-50"
              style={{
                background: selected.size === 0 ? "rgba(255,255,255,0.08)" : "linear-gradient(180deg,#22C55E,#15803D)",
                border: "1.5px solid " + (selected.size === 0 ? "rgba(255,255,255,0.12)" : "rgba(180,255,200,0.4)"),
                fontFamily: "var(--font-display)",
                boxShadow: selected.size === 0 ? "none" : "0 0 14px rgba(34,197,94,0.4)",
              }}>
              JOUER ↑
            </button>
          </div>
        )}

        {/* My fan */}
        <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)-2px)] z-40 flex justify-center">
          <div style={{ width: "min(88%, 620px)" }}>
            <FanHand
              hand={myHand}
              onClickIndex={isMyTurn ? toggle : undefined}
              selectedSet={selected}
              disabled={!isMyTurn}
              isLegal={state.forcedRank ? (c) => c.rank === state.forcedRank : undefined}
              cardSize="md"
              maxWidth={560}
              cardStyle={cardStyle}
            />
          </div>
        </div>

        {/* Me — bottom-left */}
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] left-3 z-30">
          <SeatAvatar name={playerName} hue={2} isBot={false} isTurn={isMyTurn} cardCount={myHand.length} />
          {myTitle && myTitle !== "neutre" && (
            <span className="mt-1 block whitespace-nowrap rounded-full px-2 py-0.5 text-center text-[11px] font-black tracking-wider"
                  style={{ background: TITLE_PILL[myTitle].bg, color: TITLE_PILL[myTitle].fg, fontFamily: "var(--font-display)" }}>
              {TITLE_NAME[myTitle]}
            </span>
          )}
        </div>
      </TableBg>
    </div>
  );
}
