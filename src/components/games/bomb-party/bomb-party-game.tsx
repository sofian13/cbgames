"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import type { GameProps } from "@/lib/games/types";
import type { BombPartyState, BombPartyPlayer } from "@/lib/party/message-types";

const palette = ["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8","#E89A2B","#00B3A6","#E23434"];

function initialsOf(name: string): string {
  return (name || "?").split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function colorFor(name: string): string {
  const hash = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

interface BombPartyEvent {
  kind: "word" | "boom" | "eliminated" | "left";
  playerId: string;
  playerName: string;
  word?: string;
  livesLeft?: number;
  at: number;
}

type State = Omit<BombPartyState, "currentPlayerId"> & {
  currentPlayerId: string | null;
  turnLocked?: boolean;
  lastEvent?: BombPartyEvent | null;
};

/** Hauteur/position du viewport visible : détecte le clavier mobile ouvert. */
function useVisualViewport() {
  const [vv, setVv] = useState<{ height: number; top: number; keyboard: boolean } | null>(null);
  useEffect(() => {
    const v = typeof window !== "undefined" ? window.visualViewport : null;
    if (!v) return;
    const update = () => {
      const keyboard = window.innerHeight - v.height > 140;
      setVv({ height: v.height, top: v.offsetTop, keyboard });
    };
    update();
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => {
      v.removeEventListener("resize", update);
      v.removeEventListener("scroll", update);
    };
  }, []);
  return vv;
}

function Lives({ lives, size }: { lives: number; size: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map((k) => (
        <span
          key={k}
          className="block rounded-full"
          style={{
            width: size, height: size,
            background: k < lives ? "var(--cb-social)" : "rgba(255,255,255,0.18)",
          }}
        />
      ))}
    </div>
  );
}

function Avatar({ p, active, size }: { p: BombPartyPlayer; active: boolean; size: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-black"
      style={{
        width: size, height: size, fontSize: size * 0.34,
        background: colorFor(p.name),
        color: "#fff",
        fontFamily: "var(--font-display)",
        border: active ? "2px solid #fff" : "none",
        boxShadow: active ? "0 0 0 3px var(--cb-brand)" : "0 2px 6px rgba(0,0,0,0.3)",
      }}
    >
      {initialsOf(p.name)}
    </div>
  );
}

export default function BombPartyGame({ roomCode, playerId, playerName }: GameProps) {
  const { sendAction } = useGame(roomCode, "bomb-party", playerId, playerName);
  const { gameState, error, setError } = useGameStore();
  const state = gameState as unknown as State | undefined;

  // Saisie liée à la syllabe en cours : changer de syllabe vide le champ, sans effet.
  const [draft, setDraft] = useState({ syl: "", text: "" });
  const [notice, setNotice] = useState<string | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const vv = useVisualViewport();

  const syllable = state?.syllable ?? "";
  const word = draft.syl === syllable ? draft.text : "";
  const isMyTurn = !!state && state.status === "playing" && !state.turnLocked && state.currentPlayerId === playerId;

  // Mon tour : focus (le champ n'est jamais désactivé, le clavier reste ouvert) + vibration
  useEffect(() => {
    if (!isMyTurn) return;
    inputRef.current?.focus();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 80, 50]);
    }
  }, [isMyTurn, syllable]);

  // Explosion qui me concerne → vibration longue
  const lastEvent = state?.lastEvent ?? null;
  useEffect(() => {
    if (!lastEvent || lastEvent.playerId !== playerId) return;
    if (lastEvent.kind === "boom" || lastEvent.kind === "eliminated") {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(300);
    }
  }, [lastEvent, playerId]);

  if (!state || !state.status || state.status === "waiting") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 pt-[max(env(safe-area-inset-top),12px)] text-center text-white">
        <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>
          en attente
        </span>
        <h2 className="cb-display-lg mt-2">Préparation…</h2>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = word.trim();
    if (!w) return;
    if (!isMyTurn) {
      setNotice(state.turnLocked ? "Attends la prochaine syllabe…" : "Pas ton tour !");
      return;
    }
    sendAction({ action: "submit-word", word: w });
    setDraft({ syl: syllable, text: "" });
  };

  const onChangeWord = (v: string) => {
    setDraft({ syl: syllable, text: v.toLowerCase() });
    if (notice) setNotice(null);
    if (error) setError(null);
  };

  const turnTime = Math.max(4, 10 - Math.floor((state.round ?? 1) / 3));
  const timeLeft = state.timeLeft ?? 0;
  const danger = Math.max(0, Math.min(1, 1 - timeLeft / turnTime));
  const urgent = timeLeft <= 3 && !state.turnLocked;
  const dashLen = 332;
  const dashOffset = dashLen * (1 - danger);

  const players = state.players || [];
  const opponents = players.filter((p) => p.id !== playerId);
  const me = players.find((p) => p.id === playerId);
  const currentPlayer = players.find((p) => p.id === state.currentPlayerId);
  const aliveCount = players.filter((p) => p.isAlive).length;
  const iAmOut = !!me && !me.isAlive;

  // Clavier ouvert → mise en page compacte, épinglée au viewport visible
  const compact = !!vv?.keyboard;
  const rad = 130;
  const bombSize = compact ? 132 : 220;

  const ev = lastEvent && lastEvent.at >= mountedAt - 1000 ? lastEvent : null;
  const evIsMe = ev?.playerId === playerId;
  const shake = ev && (ev.kind === "boom" || ev.kind === "eliminated");

  const rootStyle: React.CSSProperties = compact && vv
    ? { position: "fixed", left: 0, right: 0, top: vv.top, height: vv.height, zIndex: 20 }
    : { minHeight: "100%" };

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden pt-[max(env(safe-area-inset-top),12px)]"
      style={rootStyle}
    >
      <style>{`
        @keyframes bp-shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-10px) rotate(-3deg)} 30%{transform:translateX(9px) rotate(3deg)} 45%{transform:translateX(-7px)} 60%{transform:translateX(5px)} 75%{transform:translateX(-3px)} }
        @keyframes bp-flash { 0%{opacity:.55} 100%{opacity:0} }
        @keyframes bp-pop { 0%{transform:scale(.4);opacity:0} 18%{transform:scale(1.12);opacity:1} 30%{transform:scale(1)} 80%{opacity:1} 100%{opacity:0;transform:translateY(-12px)} }
      `}</style>

      {/* Flash plein écran : vert si mot accepté, rouge si explosion */}
      {ev && (ev.kind === "word" || shake) && (
        <div
          key={`flash-${ev.at}`}
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            background: ev.kind === "word" ? "rgba(34,197,94,0.45)" : "rgba(226,52,52,0.5)",
            animation: "bp-flash 0.7s ease-out forwards",
          }}
        />
      )}

      {/* Top status row — coin haut-droit réservé à l'engrenage */}
      <div className="flex items-center gap-2 pl-4 pr-16">
        <span
          className="rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
        >
          💣 Syllabombe
        </span>
        <span
          className="cb-chip-live rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{
            background: urgent ? "var(--cb-social)" : "var(--cb-brand)",
            color: "#fff",
            borderColor: "transparent",
          }}
        >
          {Math.max(0, timeLeft)} s
        </span>
        <span className="cb-mono text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
          {aliveCount}/{players.length} en vie
        </span>
      </div>

      {/* Turn banner */}
      <div className={compact ? "flex items-center justify-center px-4 py-1" : "flex items-center justify-center px-4 py-2"}>
        <div
          className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-[0.18em]"
          style={{
            background: isMyTurn ? "linear-gradient(90deg, #22C55E, #15803D)" : "rgba(0,0,0,0.5)",
            color: "#fff",
            border: isMyTurn ? "1.5px solid rgba(180,255,200,0.6)" : "1px solid rgba(255,255,255,0.12)",
            boxShadow: isMyTurn ? "0 0 28px rgba(34,197,94,0.55), inset 0 1px 0 rgba(255,255,255,0.25)" : "none",
            fontFamily: "var(--font-display)",
            animation: isMyTurn ? "cb-pulse 1.4s infinite" : undefined,
          }}
        >
          {isMyTurn ? (
            <>
              <span>🎯</span>
              <span>À toi de jouer</span>
            </>
          ) : state.turnLocked ? (
            <span style={{ color: "rgba(255,255,255,0.75)" }}>tour suivant…</span>
          ) : (
            <span style={{ color: "rgba(255,255,255,0.75)" }}>
              tour de <span className="text-white">{currentPlayer?.name ?? "…"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Adversaires en bandeau quand le clavier est ouvert */}
      {compact && opponents.length > 0 && (
        <div className="flex justify-center gap-3 overflow-x-auto px-4 py-1">
          {opponents.map((o) => (
            <div key={o.id} className="flex shrink-0 flex-col items-center gap-0.5" style={{ opacity: o.isAlive ? 1 : 0.35 }}>
              <Avatar p={o} active={o.id === state.currentPlayerId} size={28} />
              <Lives lives={o.lives} size={5} />
            </div>
          ))}
        </div>
      )}

      {/* Hero bomb area */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {!compact && opponents.map((o, i) => {
          const total = opponents.length || 1;
          const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * rad;
          const y = Math.sin(angle) * rad;
          return (
            <div
              key={o.id}
              className="absolute flex flex-col items-center gap-1"
              style={{
                left: "50%", top: "50%",
                transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
                opacity: o.isAlive ? 1 : 0.35,
              }}
            >
              <Avatar p={o} active={o.id === state.currentPlayerId} size={36} />
              <span className="max-w-[72px] truncate text-[11px] font-bold text-white/80">{o.name}</span>
              <Lives lives={o.lives} size={6} />
            </div>
          );
        })}

        {/* Center fuse ring + syllable */}
        <div
          key={shake ? `shake-${ev!.at}` : "bomb"}
          className="relative flex items-center justify-center"
          style={{
            width: bombSize, height: bombSize,
            animation: shake ? "bp-shake 0.6s ease-in-out" : undefined,
          }}
        >
          <svg width={bombSize} height={bombSize} viewBox="0 0 120 120"
               style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r="53" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle cx="60" cy="60" r="53" fill="none"
                    stroke={urgent ? "var(--cb-social)" : "var(--cb-brand)"}
                    strokeWidth="6"
                    strokeDasharray={dashLen}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div
            className="flex flex-col items-center justify-center rounded-full transition-all duration-300"
            style={{
              width: bombSize * 0.8, height: bombSize * 0.8,
              background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.06), rgba(0,0,0,0.5))",
              border: isMyTurn ? "2px solid rgba(34,197,94,0.7)" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: isMyTurn
                ? "0 0 60px rgba(34,197,94,0.55), 0 16px 48px rgba(0,0,0,0.4)"
                : "0 16px 48px rgba(0,0,0,0.4)",
              animation: urgent ? "cb-pulse 0.6s infinite" : "none",
            }}
          >
            {!compact && (
              <span className="cb-eyebrow mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                syllabe
              </span>
            )}
            <span
              className="font-black uppercase tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: compact ? 40 : 48, lineHeight: 1 }}
            >
              {state.syllable}
            </span>
          </div>

          {/* Bulle d'événement (mot accepté / BOUM / éliminé) */}
          {ev && (
            <div
              key={`ev-${ev.at}`}
              className="pointer-events-none absolute left-1/2 top-full z-40 -translate-x-1/2"
              style={{ marginTop: compact ? 4 : 10 }}
            >
              <div
                className="whitespace-nowrap rounded-full px-4 py-1.5 text-center text-sm font-black"
                style={{
                  animation: "bp-pop 1.8s ease-out forwards",
                  fontFamily: "var(--font-display)",
                  color: "#fff",
                  background: ev.kind === "word" ? "#16A34A" : "#DC2626",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                }}
              >
                {ev.kind === "word" && <>✓ {ev.word?.toUpperCase()}</>}
                {ev.kind === "boom" && <>💥 BOUM ! −1 vie pour {evIsMe ? "toi" : ev.playerName}</>}
                {ev.kind === "eliminated" && <>💀 {evIsMe ? "Tu es éliminé·e" : `${ev.playerName} est éliminé·e`}</>}
                {ev.kind === "left" && <>👋 {ev.playerName} a quitté la partie</>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input row — le champ n'est JAMAIS désactivé pour garder le clavier iOS ouvert */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-4 pb-2 pt-2">
        <input
          ref={inputRef}
          value={word}
          onChange={(e) => onChangeWord(e.target.value)}
          placeholder={
            iAmOut ? "tu es éliminé·e"
              : isMyTurn ? `mot avec « ${state.syllable} »`
              : "attends ton tour…"
          }
          aria-readonly={!isMyTurn}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-base font-bold lowercase outline-none transition"
          style={{
            background: isMyTurn ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
            borderColor: isMyTurn
              ? (urgent ? "var(--cb-social)" : "var(--cb-brand)")
              : "rgba(255,255,255,0.1)",
            color: isMyTurn ? "#fff" : "rgba(255,255,255,0.55)",
            fontFamily: "var(--font-display)",
            boxShadow: isMyTurn && urgent ? "0 0 0 3px rgba(226,52,52,0.25)" : undefined,
          }}
        />
        <button
          type="submit"
          // Empêche le bouton de voler le focus (sinon le clavier se ferme)
          onPointerDown={(e) => e.preventDefault()}
          className="cb-btn"
          style={{
            background: isMyTurn && word.trim() ? "var(--cb-brand)" : "rgba(255,255,255,0.06)",
            color: isMyTurn && word.trim() ? "var(--cb-brand-ink)" : "rgba(255,255,255,0.4)",
            minWidth: "3.5rem",
          }}
        >
          OK
        </button>
      </form>

      {/* Erreur serveur ou message local */}
      {(notice || error) && (
        <div
          className="mx-4 mb-2 rounded-lg border px-3 py-2 text-xs"
          style={{
            background: "rgba(226,52,52,0.12)",
            borderColor: "rgba(226,52,52,0.35)",
            color: "#FF8888",
          }}
        >
          {notice ?? error}
        </div>
      )}

      {/* Ma ligne (vies + score) — masquée clavier ouvert pour garder la place */}
      {me && !compact && (
        <div className="px-4 pb-[max(env(safe-area-inset-bottom),8px)]">
          <div
            className="flex items-center gap-3 rounded-lg border px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <Avatar p={me} active={false} size={28} />
            <span className="text-xs font-bold" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
              Toi
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Lives lives={me.lives} size={10} />
              <span className="cb-mono text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                {me.score} pts
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
