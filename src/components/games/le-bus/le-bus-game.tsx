"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import { cn } from "@/lib/utils";
import {
  PlayingCard,
  TableBg,
  CardSettings,
  useCardStyle,
  SEAT_PALETTE,
  type Suit,
  type CardStyle,
} from "@/components/games/cards/card-kit";

// ── Types (miroir du serveur) ─────────────────────────────
interface CardT {
  rank: number; // 1..13 (1 = As)
  suit: Suit;
}

interface PlayerT {
  id: string;
  name: string;
  cards: CardT[];
  sipsTaken: number;
  sipsGiven: number;
  hasAnswered: boolean;
  lastResult: { card: CardT; correct: boolean; sips: number } | null;
  pendingGive: number;
}

interface PyramidCardT {
  row: number;
  flipped: boolean;
  rank: number | null;
  suit: Suit | null;
  current: boolean;
}

interface BusState {
  phase:
    | "waiting"
    | "questions"
    | "pyramid-intro"
    | "pyramid"
    | "bus-intro"
    | "bus"
    | "game-over";
  questionRound: number;
  questionSub: "answer" | "reveal";
  deadline: number;
  pyramid: PyramidCardT[];
  busRiderId: string | null;
  busCurrent: CardT | null;
  busProgress: number;
  busSteps: number;
  busAttempts: number;
  busMaxAttempts: number;
  busLast: { card: CardT; correct: boolean } | null;
  busDone: boolean;
  feed: { id: number; text: string }[];
  players: PlayerT[];
}

const rankLabel = (rank: number): string => {
  if (rank === 1) return "1"; // card-kit affiche l'As
  if (rank === 11) return "V";
  if (rank === 12) return "D";
  if (rank === 13) return "R";
  return String(rank);
};

const QUESTION_META: Record<
  number,
  { title: string; hint: string; options: { value: string; label: string }[] }
> = {
  1: {
    title: "Rouge ou Noir ?",
    hint: "1 gorgée en jeu",
    options: [
      { value: "rouge", label: "🟥 Rouge" },
      { value: "noir", label: "⬛ Noir" },
    ],
  },
  2: {
    title: "Plus ou Moins que ta 1ʳᵉ carte ?",
    hint: "2 gorgées · égalité = perdu",
    options: [
      { value: "plus", label: "⬆️ Plus" },
      { value: "moins", label: "⬇️ Moins" },
    ],
  },
  3: {
    title: "Intérieur ou Extérieur de tes 2 cartes ?",
    hint: "3 gorgées · sur la borne = perdu",
    options: [
      { value: "interieur", label: "↔️ Intérieur" },
      { value: "exterieur", label: "🔀 Extérieur" },
    ],
  },
  4: {
    title: "Quelle couleur ?",
    hint: "4 gorgées en jeu",
    options: [
      { value: "♠", label: "♠" },
      { value: "♥", label: "♥" },
      { value: "♦", label: "♦" },
      { value: "♣", label: "♣" },
    ],
  },
};

function useCountdown(deadline: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!deadline) {
      setLeft(0);
      return;
    }
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [deadline]);
  return left;
}

function seatColor(players: PlayerT[], id: string): string {
  const i = Math.max(0, players.findIndex((p) => p.id === id));
  return SEAT_PALETTE[i % SEAT_PALETTE.length];
}

// ══════════════════════════════════════════════════════════
export default function LeBusGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "le-bus", playerId, playerName);
  const { gameState, error } = useGameStore();
  const state = gameState as unknown as BusState;
  const cardStyle = useCardStyle();
  const timeLeft = useCountdown(state?.deadline ?? 0);
  // Carte de la pyramide sélectionnée en main → choix de la cible
  const [giveCardIndex, setGiveCardIndex] = useState<number | null>(null);

  if (error) {
    return <Centered emoji="⚠️" text={error} />;
  }
  if (!state || !state.phase || state.phase === "waiting" || !state.players) {
    return <Centered emoji="🚌" text="Le bus démarre… montez à bord !" />;
  }

  const me = state.players.find((p) => p.id === playerId) ?? null;

  return (
    <TableBg tone="plum">
      <CardSettings />
      <div
        className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.5rem)" }}
      >
        <Header state={state} timeLeft={timeLeft} />
        <Feed feed={state.feed} />

        {state.phase === "questions" && me && (
          <QuestionsPhase
            state={state}
            me={me}
            playerId={playerId}
            cardStyle={cardStyle}
            sendAction={sendAction}
          />
        )}

        {(state.phase === "pyramid-intro" || state.phase === "pyramid") && me && (
          <PyramidPhase
            state={state}
            me={me}
            playerId={playerId}
            cardStyle={cardStyle}
            giveCardIndex={giveCardIndex}
            setGiveCardIndex={setGiveCardIndex}
            sendAction={sendAction}
          />
        )}

        {(state.phase === "bus-intro" || state.phase === "bus") && (
          <BusPhase state={state} playerId={playerId} cardStyle={cardStyle} sendAction={sendAction} />
        )}

        {state.phase === "game-over" && <GameOverPhase state={state} playerId={playerId} />}

        <ScoreStrip state={state} playerId={playerId} />
      </div>
    </TableBg>
  );
}

// ── Header ────────────────────────────────────────────────
function Header({ state, timeLeft }: { state: BusState; timeLeft: number }) {
  const label =
    state.phase === "questions"
      ? `Manche ${state.questionRound}/4`
      : state.phase === "pyramid-intro" || state.phase === "pyramid"
        ? "La Pyramide"
        : state.phase === "bus-intro" || state.phase === "bus"
          ? "Le Bus"
          : "Résultats";
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">🚌 Le Bus</p>
        <p className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          {label}
        </p>
      </div>
      {timeLeft > 0 && (
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-base font-black"
          style={{
            fontFamily: "var(--font-display)",
            color: timeLeft <= 3 ? "#FF6A3D" : "#fff",
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
          }}
        >
          {timeLeft}
        </div>
      )}
    </div>
  );
}

// ── Feed (événements gorgées) ─────────────────────────────
function Feed({ feed }: { feed: { id: number; text: string }[] }) {
  if (!feed?.length) return null;
  const last = feed.slice(-2);
  return (
    <div className="mb-3 space-y-1">
      {last.map((f) => (
        <p
          key={f.id}
          className="rounded-lg px-3 py-1.5 text-[12px] text-white/85"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {f.text}
        </p>
      ))}
    </div>
  );
}

// ── Phase 1 : Questions ───────────────────────────────────
function QuestionsPhase({
  state,
  me,
  playerId,
  cardStyle,
  sendAction,
}: {
  state: BusState;
  me: PlayerT;
  playerId: string;
  cardStyle: CardStyle;
  sendAction: (a: Record<string, unknown>) => void;
}) {
  const meta = QUESTION_META[state.questionRound];
  if (!meta) return null;

  // Mes cartes déjà gagnées (référence pour plus/moins & intérieur/extérieur)
  const myCards = (
    <div className="mb-4 flex justify-center gap-2">
      {me.cards.length === 0 ? (
        <p className="text-sm text-white/40">Ta 1ʳᵉ carte arrive…</p>
      ) : (
        me.cards.map((c, i) => (
          <PlayingCard key={i} rank={rankLabel(c.rank)} suit={c.suit} size="md" cardStyle={cardStyle} />
        ))
      )}
    </div>
  );

  if (state.questionSub === "answer") {
    const answered = me.hasAnswered;
    const readyCount = state.players.filter((p) => p.hasAnswered).length;
    return (
      <div className="flex flex-1 flex-col justify-center">
        {myCards}
        <p className="text-center text-xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          {meta.title}
        </p>
        <p className="mb-5 mt-1 text-center text-[12px] text-white/50">{meta.hint}</p>
        {!answered ? (
          <div className={cn("grid gap-3", meta.options.length === 4 ? "grid-cols-4" : "grid-cols-2")}>
            {meta.options.map((o) => (
              <button
                key={o.value}
                onClick={() => sendAction({ action: "answer", choice: o.value })}
                className="rounded-2xl py-4 font-black text-white transition-transform active:scale-95"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: meta.options.length === 4 ? 26 : 17,
                  color:
                    o.value === "♥" || o.value === "♦"
                      ? "#FF5A6E"
                      : o.value === "♠" || o.value === "♣"
                        ? "#fff"
                        : undefined,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-white/60">
            Réponse envoyée ✓ · {readyCount}/{state.players.length} prêts
          </p>
        )}
        <AnswerDots state={state} playerId={playerId} />
      </div>
    );
  }

  // Reveal
  const res = me.lastResult;
  const others = state.players.filter((p) => p.id !== playerId);
  return (
    <div className="flex flex-1 flex-col justify-center">
      {res && (
        <div className="mb-4 flex flex-col items-center">
          <PlayingCard rank={rankLabel(res.card.rank)} suit={res.card.suit} size="xl" cardStyle={cardStyle} raised />
          <p
            className="mt-3 text-lg font-black"
            style={{ fontFamily: "var(--font-display)", color: res.correct ? "#22C55E" : "#FF6A3D" }}
          >
            {res.correct
              ? `Bien vu ! Distribue ${res.sips} gorgée${res.sips > 1 ? "s" : ""} 🍻`
              : `Raté… tu bois ${res.sips} gorgée${res.sips > 1 ? "s" : ""} 🥴`}
          </p>
        </div>
      )}
      {me.pendingGive > 0 ? (
        <>
          <p className="mb-2 text-center text-[12px] uppercase tracking-widest text-white/50">À qui ?</p>
          <div className="grid grid-cols-2 gap-2">
            {others.map((p) => (
              <button
                key={p.id}
                onClick={() => sendAction({ action: "give-sips", targetId: p.id })}
                className="rounded-xl px-3 py-3 text-sm font-bold text-white transition-transform active:scale-95"
                style={{
                  background: `linear-gradient(160deg, ${seatColor(state.players, p.id)}55, rgba(255,255,255,0.05))`,
                  border: "1.5px solid rgba(255,255,255,0.2)",
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          {state.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-sm font-bold text-white/85">
                {p.name} {p.id === playerId && "· toi"}
              </span>
              {p.lastResult && (
                <span className="flex items-center gap-2 text-sm">
                  <span className="font-black" style={{ color: p.lastResult.card.suit === "♥" || p.lastResult.card.suit === "♦" ? "#FF5A6E" : "#fff" }}>
                    {rankLabel(p.lastResult.card.rank) === "1" ? "A" : rankLabel(p.lastResult.card.rank)}
                    {p.lastResult.card.suit}
                  </span>
                  <span>{p.lastResult.correct ? "✅" : "❌"}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerDots({ state, playerId }: { state: BusState; playerId: string }) {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {state.players.map((p) => (
        <span
          key={p.id}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            color: p.hasAnswered ? "#fff" : "rgba(255,255,255,0.4)",
            background: p.hasAnswered ? `${seatColor(state.players, p.id)}44` : "rgba(255,255,255,0.05)",
            border: `1px solid ${p.hasAnswered ? seatColor(state.players, p.id) : "rgba(255,255,255,0.12)"}`,
          }}
        >
          {p.name}
          {p.id === playerId && " (toi)"}
          {p.hasAnswered ? " ✓" : "…"}
        </span>
      ))}
    </div>
  );
}

// ── Phase 2 : Pyramide ────────────────────────────────────
function PyramidPhase({
  state,
  me,
  playerId,
  cardStyle,
  giveCardIndex,
  setGiveCardIndex,
  sendAction,
}: {
  state: BusState;
  me: PlayerT;
  playerId: string;
  cardStyle: CardStyle;
  giveCardIndex: number | null;
  setGiveCardIndex: (i: number | null) => void;
  sendAction: (a: Record<string, unknown>) => void;
}) {
  const intro = state.phase === "pyramid-intro";
  const current = state.pyramid.find((c) => c.current) ?? null;
  const rows: PyramidCardT[][] = [4, 3, 2, 1].map((r) => state.pyramid.filter((c) => c.row === r));
  const others = state.players.filter((p) => p.id !== playerId);

  const canPlay = (c: CardT) => !!current && current.rank === c.rank;

  return (
    <div className="flex flex-1 flex-col">
      {intro && (
        <p className="mb-3 text-center text-sm text-white/70">
          Une carte se retourne toutes les 8 s. Tu as la même en main ? Pose-la pour faire boire
          (rangée du bas = 1 gorgée… sommet = 4) ! Le joueur qui garde le plus de cartes monte dans le bus 🚌
        </p>
      )}

      {/* Pyramide (sommet en haut) */}
      <div className="mb-4 flex flex-col items-center gap-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((c, i) => (
              <div
                key={i}
                style={{
                  transform: c.current ? "scale(1.12)" : undefined,
                  transition: "transform 200ms",
                  filter: c.flipped && !c.current ? "brightness(0.6)" : undefined,
                }}
              >
                <PlayingCard
                  rank={c.rank ? rankLabel(c.rank) : "1"}
                  suit={c.suit ?? "♠"}
                  faceDown={!c.flipped}
                  size="sm"
                  cardStyle={cardStyle}
                  selected={c.current}
                />
              </div>
            ))}
          </div>
        ))}
        <p className="mt-1 text-[11px] text-white/45">↑ 4 gorgées · 3 · 2 · 1 gorgée ↓</p>
      </div>

      {current && current.rank && (
        <p className="mb-2 text-center text-sm font-bold text-white">
          Carte retournée :{" "}
          <span style={{ color: current.suit === "♥" || current.suit === "♦" ? "#FF5A6E" : "#fff" }}>
            {rankLabel(current.rank) === "1" ? "A" : rankLabel(current.rank)}
            {current.suit}
          </span>{" "}
          → tu as un {rankLabel(current.rank) === "1" ? "As" : rankLabel(current.rank)} ? Pose-le !
        </p>
      )}

      {/* Ma main */}
      <p className="mb-1.5 text-center text-[11px] uppercase tracking-widest text-white/50">
        Ta main ({me.cards.length})
      </p>
      <div className="flex justify-center gap-2">
        {me.cards.length === 0 ? (
          <p className="text-sm text-white/50">Plus de cartes — le bus est loin ! 😎</p>
        ) : (
          me.cards.map((c, i) => (
            <button
              key={i}
              onClick={() => canPlay(c) && setGiveCardIndex(i)}
              className={cn(canPlay(c) && "animate-bounce")}
              style={{ background: "transparent", border: 0, padding: 0 }}
            >
              <PlayingCard
                rank={rankLabel(c.rank)}
                suit={c.suit}
                size="md"
                cardStyle={cardStyle}
                playable={canPlay(c)}
                dim={!!current && !canPlay(c)}
              />
            </button>
          ))
        )}
      </div>

      {/* Choix de la cible */}
      {giveCardIndex !== null && me.cards[giveCardIndex] && canPlay(me.cards[giveCardIndex]) && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
          onClick={() => setGiveCardIndex(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-5 pb-10"
            style={{ background: "linear-gradient(180deg, #241040, #100620)", border: "1px solid rgba(255,255,255,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-center text-base font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
              Qui boit {current?.row} gorgée{(current?.row ?? 0) > 1 ? "s" : ""} ? 🍺
            </p>
            <div className="grid grid-cols-2 gap-2">
              {others.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    sendAction({ action: "play-pyramid-card", cardIndex: giveCardIndex, targetId: p.id });
                    setGiveCardIndex(null);
                  }}
                  className="rounded-xl px-3 py-3.5 text-sm font-bold text-white active:scale-95"
                  style={{
                    background: `linear-gradient(160deg, ${seatColor(state.players, p.id)}55, rgba(255,255,255,0.05))`,
                    border: "1.5px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button onClick={() => setGiveCardIndex(null)} className="mt-3 w-full text-center text-sm text-white/50">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Phase 3 : Le Bus ──────────────────────────────────────
function BusPhase({
  state,
  playerId,
  cardStyle,
  sendAction,
}: {
  state: BusState;
  playerId: string;
  cardStyle: CardStyle;
  sendAction: (a: Record<string, unknown>) => void;
}) {
  const rider = state.players.find((p) => p.id === state.busRiderId);
  const isMe = state.busRiderId === playerId;
  const intro = state.phase === "bus-intro";

  if (intro) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-5xl">🚌</p>
        <p className="mt-3 text-xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          {isMe ? "TU montes dans le bus !" : `${rider?.name} monte dans le bus !`}
        </p>
        <p className="mt-2 max-w-xs text-sm text-white/60">
          {state.busSteps} bonnes réponses Plus/Moins d&apos;affilée pour descendre. Chaque erreur se boit… et on repart de zéro !
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <p className="mb-1 text-sm font-bold text-white/70">
        {isMe ? "À toi de jouer !" : `${rider?.name} est dans le bus…`}
      </p>

      {/* Progression */}
      <div className="mb-4 flex gap-2">
        {Array.from({ length: state.busSteps }, (_, i) => (
          <span
            key={i}
            className="h-3 w-8 rounded-full"
            style={{
              background: i < state.busProgress ? "#22C55E" : "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {state.busCurrent && (
        <PlayingCard
          rank={rankLabel(state.busCurrent.rank)}
          suit={state.busCurrent.suit}
          size="xl"
          cardStyle={cardStyle}
          raised
        />
      )}

      {state.busLast && (
        <p
          className="mt-3 text-sm font-black"
          style={{ fontFamily: "var(--font-display)", color: state.busLast.correct ? "#22C55E" : "#FF6A3D" }}
        >
          {state.busLast.correct ? "Bonne pioche ✅" : "Déraillé ❌ on repart du début"}
        </p>
      )}

      {state.busDone ? (
        <p className="mt-4 text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          {state.busProgress >= state.busSteps ? "Descente triomphale ! 🎉" : "Le bus est parti… 🚌💨"}
        </p>
      ) : isMe ? (
        <div className="mt-6 grid w-full max-w-xs grid-cols-2 gap-3">
          <button
            onClick={() => sendAction({ action: "bus-guess", choice: "plus" })}
            className="rounded-2xl py-4 text-lg font-black text-white active:scale-95"
            style={{
              fontFamily: "var(--font-display)",
              background: "linear-gradient(160deg, #22C55E, #15803D)",
              border: "1.5px solid rgba(255,255,255,0.3)",
            }}
          >
            ⬆️ Plus
          </button>
          <button
            onClick={() => sendAction({ action: "bus-guess", choice: "moins" })}
            className="rounded-2xl py-4 text-lg font-black text-white active:scale-95"
            style={{
              fontFamily: "var(--font-display)",
              background: "linear-gradient(160deg, #FF6A3D, #C2410C)",
              border: "1.5px solid rgba(255,255,255,0.3)",
            }}
          >
            ⬇️ Moins
          </button>
        </div>
      ) : (
        <p className="mt-5 text-[12px] text-white/45">
          Tentative {state.busAttempts + 1}/{state.busMaxAttempts} · encourage (ou chambre) le rideur 📣
        </p>
      )}
    </div>
  );
}

// ── Fin de partie ─────────────────────────────────────────
function GameOverPhase({ state, playerId }: { state: BusState; playerId: string }) {
  const sorted = [...state.players].sort(
    (a, b) => a.sipsTaken - b.sipsTaken || b.sipsGiven - a.sipsGiven
  );
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="mb-4 text-center text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
        Terminus ! 🚌
      </p>
      <div className="space-y-2">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: i === 0 ? "rgba(255,210,63,0.12)" : "rgba(255,255,255,0.05)",
              border: i === 0 ? "1.5px solid rgba(255,210,63,0.5)" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-sm font-bold text-white">
              {i === 0 ? "👑" : `${i + 1}.`} {p.name} {p.id === playerId && "· toi"}
            </span>
            <span className="text-sm text-white/75">
              🍺 {p.sipsTaken} bue{p.sipsTaken > 1 ? "s" : ""} · 🍻 {p.sipsGiven} donnée{p.sipsGiven > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[12px] text-white/45">Le plus sobre a gagné. Buvez de l&apos;eau ! 💧</p>
    </div>
  );
}

// ── Bandeau scores (gorgées) ──────────────────────────────
function ScoreStrip({ state, playerId }: { state: BusState; playerId: string }) {
  if (state.phase === "game-over") return null;
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-1.5">
      {state.players.map((p) => (
        <span
          key={p.id}
          className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white/80"
          style={{
            background: p.id === playerId ? `${seatColor(state.players, p.id)}33` : "rgba(255,255,255,0.05)",
            border: `1px solid ${p.id === playerId ? seatColor(state.players, p.id) : "rgba(255,255,255,0.1)"}`,
          }}
        >
          {p.name} 🍺{p.sipsTaken}
        </span>
      ))}
    </div>
  );
}

function Centered({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-5xl">{emoji}</span>
      <p className="text-base font-bold text-white/80">{text}</p>
    </div>
  );
}
