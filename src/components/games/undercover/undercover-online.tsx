"use client";

import { useMemo, useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { Mascot, MASCOT_COLORS, type MascotColor, type MascotMood } from "@/components/Mascot";
import type { GameProps } from "@/lib/games/types";

/* ─────────────────────────────────────────────────────────────
   UNDERCOVER ONLINE — multi-appareils (PartyKit)
   ───────────────────────────────────────────────────────────── */

type Role = "civil" | "undercover" | "mrwhite";
type Phase =
  | "waiting" | "word-reveal" | "clue" | "vote"
  | "vote-result" | "mrwhite-guess" | "round-end" | "game-over";
type EndReason = "civils-win" | "undercover-wins" | "mrwhite-wins" | null;

interface UCPlayer {
  id: string; name: string; score: number;
  isEliminated: boolean; hasClue: boolean; hasVoted: boolean;
  clue: string | null; eliminatedRound: number | null;
  role: Role | null; word: string | null;
}

interface UCState {
  phase: Phase; round: number; timeLeft: number;
  config: { undercoverCount: number; includeMrWhite: boolean; autoBalance: boolean };
  currentSpeakerId: string | null;
  clueOrder: string[]; currentClueIdx: number;
  eliminatedThisRound: string | null; eliminatedRole: Role | null;
  voteTally: Record<string, number> | null;
  clueHistory: { round: number; playerId: string; playerName: string; clue: string }[];
  civilWord: string | null; undercoverWord: string | null;
  lastGuess: string | null; lastGuessCorrect: boolean | null;
  endReason: EndReason;
  players: UCPlayer[];
  myRole: Role | null; myWord: string | null; myId: string | null;
}

const ROLE_COLOR: Record<Role, string> = { civil: "#3DDC97", undercover: "#FF3EA5", mrwhite: "#FFD23F" };
const ROLE_LABEL: Record<Role, string> = { civil: "Civil", undercover: "Undercover", mrwhite: "Mr. White" };

const colorOf = (id: string): MascotColor => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return MASCOT_COLORS[Math.abs(h) % MASCOT_COLORS.length];
};

export default function UndercoverOnline({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const { sendAction } = useGame(roomCode, "undercover", playerId, playerName);
  const gameState = useGameStore((s) => s.gameState) as unknown as UCState | null;

  if (!gameState) return <Container><Loader /></Container>;

  const { phase } = gameState;
  return (
    <Container tone={toneFor(phase)}>
      {phase === "waiting"        && <WaitingPhase  state={gameState} sendAction={sendAction} myId={playerId} />}
      {phase === "word-reveal"    && <RevealPhase   state={gameState} sendAction={sendAction} myId={playerId} />}
      {phase === "clue"           && <CluePhase     state={gameState} sendAction={sendAction} myId={playerId} />}
      {phase === "vote"           && <VotePhase     state={gameState} sendAction={sendAction} myId={playerId} />}
      {(phase === "vote-result" || phase === "round-end") && <EliminatePhase state={gameState} />}
      {phase === "mrwhite-guess"  && <MrWhitePhase  state={gameState} sendAction={sendAction} myId={playerId} />}
      {phase === "game-over"      && <GameOverPhase state={gameState} onReturnToLobby={onReturnToLobby} />}
    </Container>
  );
}

const toneFor = (phase: Phase): Tone => {
  if (phase === "vote" || phase === "vote-result" || phase === "round-end") return "danger";
  if (phase === "mrwhite-guess") return "gold";
  if (phase === "game-over") return "civ";
  return "noir";
};

// ═════════════════════════════════════════════════════════════
// PRIMITIVES — partagées avec undercover-local.tsx (dupliquées
// ici pour éviter un fichier UI commun. Si tu refactores, extrais
// vers undercover-ui.tsx.)
// ═════════════════════════════════════════════════════════════
type Tone = "noir" | "danger" | "civ" | "gold";

function Container({ children, tone = "noir" }: { children: ReactNode; tone?: Tone }) {
  const bg: Record<Tone, string> = {
    noir:   "radial-gradient(120% 70% at 50% 0%, rgba(91,54,214,0.40) 0%, transparent 60%), radial-gradient(120% 60% at 50% 100%, rgba(255,62,165,0.18) 0%, transparent 60%), linear-gradient(180deg, #0A0420 0%, #150834 100%)",
    danger: "radial-gradient(circle at 50% 25%, rgba(255,62,165,0.40), transparent 55%), linear-gradient(180deg, #1A0414 0%, #0E0828 100%)",
    civ:    "radial-gradient(circle at 50% 25%, rgba(61,220,151,0.30), transparent 55%), linear-gradient(180deg, #0A1A18 0%, #0E0828 100%)",
    gold:   "radial-gradient(ellipse 90% 50% at 50% 18%, rgba(255,210,63,0.22) 0%, transparent 55%), linear-gradient(180deg, #1A1206 0%, #0E0828 100%)",
  };
  return (
    <div style={{
      minHeight: "100dvh", color: "white",
      fontFamily: "var(--font-body, 'DM Sans'), system-ui, sans-serif",
      background: bg[tone], position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes uc-pulse { 0% { transform: scale(0.95); opacity: 0.7; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes uc-spin { to { transform: rotate(360deg); } }
        @keyframes uc-rotate { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes uc-confetti { 0% { transform: translateY(-30px) rotate(0); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 1; } }
      `}</style>
      <div style={{
        position: "fixed", inset: 0,
        background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px)",
        maskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 80%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, padding: "24px 16px 36px", maxWidth: 460, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ textAlign: "center", padding: "120px 16px", color: "rgba(255,255,255,0.6)" }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        border: "3px solid rgba(255,210,63,0.25)", borderTopColor: "#FFD23F",
        animation: "uc-spin 1s linear infinite", margin: "0 auto 16px",
      }} />
      Connexion à la salle…
    </div>
  );
}

function Tag({ children, color = "#FFD23F", style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono, 'JetBrains Mono'), monospace",
      fontSize: 10, fontWeight: 800, letterSpacing: 2,
      textTransform: "uppercase", color,
      padding: "4px 9px",
      border: `1px solid ${color}55`, borderRadius: 4,
      background: `${color}11`, whiteSpace: "nowrap",
      display: "inline-block",
      ...style,
    }}>{children}</span>
  );
}

function NavBar({ sub, title, right }: { sub?: string; title?: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {sub && (
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "#FFD23F", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
            {sub}
          </div>
        )}
        {title && (
          <div style={{ fontFamily: "var(--font-display, 'Bricolage Grotesque'), system-ui", fontWeight: 800, fontSize: 24, color: "white", letterSpacing: -0.6, marginTop: 4, lineHeight: 1.05 }}>
            {title}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}

type BtnTone = "primary" | "danger" | "gold" | "ghost" | "mint";
function Btn({
  children, tone = "primary", disabled = false, onClick, full = true, icon, sub, style = {},
}: {
  children: ReactNode; tone?: BtnTone; disabled?: boolean; onClick?: () => void;
  full?: boolean; icon?: ReactNode; sub?: string; style?: CSSProperties;
}) {
  const tones: Record<BtnTone, { bg: string; color: string; shadow: string }> = {
    primary: { bg: "linear-gradient(180deg, #7A4EE8 0%, #4D26B6 100%)", color: "white", shadow: "0 14px 30px rgba(91,54,214,0.55), inset 0 1px 0 rgba(255,255,255,0.25)" },
    danger:  { bg: "linear-gradient(180deg, #FF3EA5 0%, #B5176E 100%)", color: "white", shadow: "0 14px 30px rgba(255,62,165,0.55), inset 0 1px 0 rgba(255,255,255,0.25)" },
    gold:    { bg: "linear-gradient(180deg, #FFD23F 0%, #C48800 100%)", color: "#1A0E2E", shadow: "0 14px 30px rgba(255,210,63,0.45), inset 0 1px 0 rgba(255,255,255,0.4)" },
    ghost:   { bg: "rgba(255,255,255,0.08)", color: "white", shadow: "inset 0 0 0 1px rgba(255,255,255,0.15)" },
    mint:    { bg: "linear-gradient(180deg, #3DDC97 0%, #189A66 100%)", color: "#0E0828", shadow: "0 14px 30px rgba(61,220,151,0.45), inset 0 1px 0 rgba(255,255,255,0.3)" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: full ? "100%" : "auto",
        padding: sub ? "12px 20px" : "16px 22px",
        borderRadius: 18, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: t.bg, color: t.color, boxShadow: t.shadow,
        opacity: disabled ? 0.45 : 1,
        fontWeight: 700, fontSize: 16, letterSpacing: -0.2,
        fontFamily: "var(--font-body, system-ui)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
        ...style,
      }}
    >
      {icon && <span>{icon}</span>}
      <span style={{ display: "flex", flexDirection: "column", alignItems: sub ? "flex-start" : "center" }}>
        <span>{children}</span>
        {sub && <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.78, letterSpacing: 0.3, marginTop: 2 }}>{sub}</span>}
      </span>
    </button>
  );
}

function SpyMascot({ id, size = 80, tilt = -3, mood = "sus", cheering = false, crown = false, arms = false, delay = 0 }: {
  id: string; size?: number; tilt?: number; mood?: MascotMood;
  cheering?: boolean; crown?: boolean; arms?: boolean; delay?: number;
}) {
  const color = colorOf(id);
  const w = size * 0.66, h = size * 0.18;
  return (
    <div style={{ position: "relative", display: "inline-block", width: size, height: size * 1.15 + (crown ? size * 0.3 : 0) }}>
      <Mascot size={size} color={color} mood={mood} cheering={cheering} crown={crown} arms={arms} delay={delay} />
      <div style={{ position: "absolute", left: "50%", top: (crown ? size * 0.3 : 0) + size * 0.32, width: w, height: h, transform: `translateX(-50%) rotate(${tilt}deg)`, pointerEvents: "none", zIndex: 5 }}>
        <svg viewBox="0 0 100 28" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M2 12 L18 12 M48 12 L52 12 M82 12 L98 12" stroke="#0E0828" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M18 4 Q18 18 30 22 Q44 24 47 14 Q48 6 36 4 Z" fill="#0E0828" stroke="#FFD23F" strokeWidth="1.2" />
          <path d="M53 14 Q56 24 70 22 Q82 18 82 4 L65 4 Q53 6 53 14 Z" fill="#0E0828" stroke="#FFD23F" strokeWidth="1.2" />
          <ellipse cx="26" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.6" />
          <ellipse cx="63" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.45" />
        </svg>
      </div>
    </div>
  );
}

function Stamp({ text, color = "#FF3EA5", rotate = -10, size = 18 }: { text: string; color?: string; rotate?: number; size?: number }) {
  return (
    <div style={{
      display: "inline-block",
      padding: `${size * 0.25}px ${size * 0.7}px`,
      border: `3px solid ${color}`, color,
      fontFamily: "var(--font-display, system-ui)",
      fontWeight: 900, fontSize: size, letterSpacing: 3,
      textTransform: "uppercase",
      transform: `rotate(${rotate}deg)`,
      borderRadius: 6, background: "rgba(0,0,0,0.3)",
      boxShadow: `inset 0 0 0 1px ${color}55, 0 6px 18px rgba(0,0,0,0.4)`,
      textShadow: `0 0 14px ${color}66`,
    }}>{text}</div>
  );
}

function Timer({ time, color = "#FFD23F" }: { time: number; color?: string }) {
  const mm = Math.floor(Math.max(0, time) / 60).toString().padStart(2, "0");
  const ss = (Math.max(0, time) % 60).toString().padStart(2, "0");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px", borderRadius: 99,
      background: `${color}22`, border: `1px solid ${color}55`,
      fontFamily: "var(--font-mono, monospace)",
      fontWeight: 800, fontSize: 11, letterSpacing: 1, color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {mm}:{ss}
    </span>
  );
}

function Confetti({ count = 40, accent = "#FFD23F" }: { count?: number; accent?: string }) {
  const pieces = useMemo(() => {
    const colors = ["#FF3EA5", "#FFD23F", "#3DDC97", "#4ECDC4", "#7A4EE8", "#FF6B5B", accent];
    return Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100, delay: Math.random() * 2.5,
      duration: 2.6 + Math.random() * 1.8,
      color: colors[i % colors.length],
      rot: Math.floor(Math.random() * 360),
      w: 6 + Math.floor(Math.random() * 6),
    }));
  }, [count, accent]);
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: "absolute", top: -20, left: `${p.left}%`,
          width: p.w, height: p.w * 1.4,
          background: p.color, borderRadius: 2,
          transform: `rotate(${p.rot}deg)`,
          animation: `uc-confetti ${p.duration}s ${p.delay}s linear infinite`,
        }} />
      ))}
    </div>
  );
}

function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono, monospace)", fontSize: 10,
      color: "rgba(255,255,255,0.5)", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
      ...style,
    }}>{children}</span>
  );
}

function FileCard({ children, accent = "#FFD23F", style }: { children: ReactNode; accent?: string; style?: CSSProperties }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 18, padding: 16,
      boxShadow: "0 12px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      ...style,
    }}>
      <div style={{
        position: "absolute", top: -1, right: -1,
        width: 22, height: 22, background: "#0E0828",
        clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.10)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        borderTopRightRadius: 18,
      }} />
      <div style={{
        position: "absolute", left: 0, top: 14, bottom: 14,
        width: 3, borderRadius: 3, background: accent,
        boxShadow: `0 0 12px ${accent}`, opacity: 0.9,
      }} />
      {children}
    </div>
  );
}

function Stat({ n, label, color, sub }: { n: number; label: string; color: string; sub?: string }) {
  return (
    <div style={{
      padding: "10px 6px", borderRadius: 10,
      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
      textAlign: "center",
    }}>
      <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 26, color, lineHeight: 1, fontWeight: 900 }}>{n}</div>
      <div style={{ fontSize: 11, color: "white", fontWeight: 700, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderTop: "1px dashed rgba(255,255,255,0.08)",
    }}>
      <div>
        <div style={{ fontSize: 13, color: "white", fontWeight: 700 }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange, disabled }: { value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  const btn: CSSProperties = {
    width: 30, height: 30, borderRadius: 9, border: "none",
    background: "rgba(255,255,255,0.06)", color: "white",
    fontWeight: 900, fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button style={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span style={{ width: 22, textAlign: "center", fontWeight: 800, fontSize: 18, fontFamily: "var(--font-display, system-ui)" }}>{value}</span>
      <button style={{ ...btn, background: value < max && !disabled ? "#FFD23F" : "rgba(255,255,255,0.06)", color: value < max && !disabled ? "#1A0E2E" : "white" }} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!value)} style={{
      width: 46, height: 26, borderRadius: 99, border: "none",
      background: value ? "#3DDC97" : "rgba(255,255,255,0.14)",
      position: "relative", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "background .15s",
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 22 : 2,
        width: 22, height: 22, borderRadius: "50%", background: "white",
        transition: "left .15s", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

// ═════════════════════════════════════════════════════════════
// PHASES (online)
// ═════════════════════════════════════════════════════════════
function WaitingPhase({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const isHost = state.players[0]?.id === myId;
  const cfg = state.config;
  const total = state.players.length;
  const civils = Math.max(0, total - cfg.undercoverCount - (cfg.includeMrWhite ? 1 : 0));
  const featured = state.players.slice(0, 3);

  return (
    <>
      <NavBar sub="DOSSIER · CASE #14" title="Briefing" right={<Tag color="#FF3EA5">BLUFF · {total}/7</Tag>} />

      <div style={{ position: "relative", height: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 8 }}>
        <div style={{
          position: "absolute", left: "50%", top: 20, transform: "translateX(-50%)",
          width: 380, height: 240, maxWidth: "100%",
          background: "radial-gradient(ellipse 60% 80% at 50% 30%, rgba(255,210,63,0.20) 0%, transparent 65%)",
        }} />
        {featured[1] && <div style={{ position: "absolute", left: "10%", bottom: 0 }}><SpyMascot id={featured[1].id} size={68} tilt={-10} mood="shifty" arms delay={0.3} /></div>}
        {featured[2] && <div style={{ position: "absolute", right: "10%", bottom: 0 }}><SpyMascot id={featured[2].id} size={68} tilt={8} mood="wink" arms delay={0.6} /></div>}
        <div style={{ position: "relative" }}>
          <SpyMascot id={featured[0]?.id ?? "host"} size={130} tilt={-3} mood="sus" arms delay={0} />
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <h1 style={{
          fontFamily: "var(--font-display, system-ui)",
          fontSize: 56, margin: 0, lineHeight: 0.9,
          color: "white", letterSpacing: -2.4, fontWeight: 900,
          textShadow: "0 0 36px rgba(255,62,165,0.35)",
        }}>
          Under<span style={{
            background: "linear-gradient(120deg, #FFD23F, #FF3EA5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>cover</span>
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "12px 12px 0", lineHeight: 1.5 }}>
          Chaque joueur reçoit un mot. Quelqu'un a un mot <em style={{ color: "#FFD23F", fontStyle: "normal", fontWeight: 800 }}>légèrement différent</em>. Démasque-le.
        </p>
      </div>

      <FileCard accent="#FF3EA5" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <Mono>Composition · {total} joueur{total > 1 ? "s" : ""}</Mono>
          {cfg.autoBalance && <Tag color="#3DDC97">AUTO</Tag>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
          <Stat n={civils} label="Civils" color="#3DDC97" sub="même mot" />
          <Stat n={cfg.undercoverCount} label="Undercover" color="#FF3EA5" sub="mot voisin" />
          <Stat n={cfg.includeMrWhite ? 1 : 0} label="Mr. White" color="#FFD23F" sub="aucun mot" />
        </div>

        <Row label="Undercover" hint="1 à 3">
          <Stepper value={cfg.undercoverCount} min={1} max={3} disabled={!isHost}
            onChange={(v) => sendAction({ action: "configure", config: { undercoverCount: v, autoBalance: false } })} />
        </Row>
        <Row label="Mr. White" hint="bonus chaos">
          <Toggle value={cfg.includeMrWhite} disabled={!isHost}
            onChange={(v) => sendAction({ action: "configure", config: { includeMrWhite: v, autoBalance: false } })} />
        </Row>
        <Row label="Auto-équilibrage" hint="le serveur décide">
          <Toggle value={cfg.autoBalance} disabled={!isHost}
            onChange={(v) => sendAction({ action: "configure", config: { autoBalance: v } })} />
        </Row>
      </FileCard>

      <div style={{ marginBottom: 14 }}>
        <Mono style={{ marginBottom: 10 }}>Salon · {total}/7</Mono>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {state.players.map((p) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 12px 5px 5px", borderRadius: 99,
              background: p.id === myId ? "rgba(255,210,63,0.12)" : "rgba(255,255,255,0.05)",
              border: p.id === myId ? "1px solid rgba(255,210,63,0.40)" : "1px solid rgba(255,255,255,0.10)",
            }}>
              <Mascot color={colorOf(p.id)} size={26} mood="happy" bob={false} blink={false} shadow={false} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</span>
              {p.id === myId && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#FFD23F", color: "#1A0E2E", fontWeight: 900, letterSpacing: 0.5 }}>TOI</span>}
              {p.id === state.players[0]?.id && p.id !== myId && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "rgba(255,255,255,0.10)", color: "white", fontWeight: 800, letterSpacing: 0.5 }}>HÔTE</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - total) }).map((_, i) => (
            <div key={i} style={{ padding: "5px 12px", borderRadius: 99, border: "1px dashed rgba(255,255,255,0.15)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>+ place libre</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 14 }}>
        {isHost ? (
          <Btn tone="gold" disabled={total < 3} onClick={() => sendAction({ action: "start-game" })} icon={<span style={{ fontSize: 18 }}>🕶️</span>}>
            {total < 3 ? `Attente · ${total}/3 joueurs` : "Distribuer les rôles"}
          </Btn>
        ) : (
          <div style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
            ⌛ En attente du lancement par l'hôte…
          </div>
        )}
      </div>
    </>
  );
}

function RevealPhase({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const role = state.myRole ?? "civil";
  const word = state.myWord;
  const meName = state.players.find((p) => p.id === myId)?.name ?? "Joueur";
  const color = ROLE_COLOR[role];
  const label = ROLE_LABEL[role];
  const hint = role === "civil"
    ? "Trouve les civils. Donne un indice clair sans aider l'undercover."
    : role === "undercover"
    ? "Mot voisin. Reste vague. Devine leur mot avant qu'ils ne te grillent."
    : "Aucun mot. Bluff. Si démasqué, devine le mot des civils pour gagner seul.";

  const blobColor: MascotColor = role === "civil" ? "mint" : role === "undercover" ? "pink" : "white";
  const blobMood: MascotMood = role === "civil" ? "happy" : role === "undercover" ? "shifty" : "thinking";

  return (
    <>
      <NavBar sub={`JOUEUR · ${meName.toUpperCase()}`} title="Mot secret" right={<Tag color={color}>{label.toUpperCase()}</Tag>} />
      <div style={{ display: "flex", justifyContent: "center", marginBottom: -10 }}>
        <Mascot color={blobColor} size={88} mood={blobMood} arms />
      </div>
      <DossierCard word={word} role={role} hint={hint} round={state.round} />
      <div style={{
        padding: "10px 14px", borderRadius: 12,
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,62,165,0.3)",
        display: "flex", gap: 10, alignItems: "center", marginBottom: 14,
      }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>Personne d'autre ne doit voir l'écran.</div>
      </div>
      <div style={{ marginTop: "auto" }}>
        <Btn tone="gold" onClick={() => sendAction({ action: "ack-word" })}>J'ai mémorisé · passer</Btn>
      </div>
    </>
  );
}

function DossierCard({ word, role, hint, round }: { word: string | null; role: Role; hint: string; round: number }) {
  const color = ROLE_COLOR[role];
  const label = ROLE_LABEL[role];
  return (
    <div style={{
      position: "relative", padding: "22px 20px 24px",
      borderRadius: 22,
      background: "linear-gradient(180deg, #FFF7E0 0%, #F0DA9A 100%)",
      color: "#1A0E2E",
      boxShadow: "0 24px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.10)",
      transform: "rotate(-1.5deg)", margin: "16px 4px",
    }}>
      <div style={{
        position: "absolute", top: -13, left: "50%", transform: "translateX(-50%) rotate(-2deg)",
        width: 100, height: 22,
        background: "linear-gradient(180deg, rgba(255,210,63,0.7) 0%, rgba(255,210,63,0.5) 100%)",
        borderTop: "1px dashed rgba(0,0,0,0.15)", borderBottom: "1px dashed rgba(0,0,0,0.15)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
      }} />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: 12, marginBottom: 16,
        borderBottom: "2px solid rgba(26,14,46,0.25)",
      }}>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>CONFIDENTIEL</div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#7A3008" }}>MANCHE {round}</div>
      </div>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "#7A3008", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>
        {role === "mrwhite" ? "Pas de mot" : "Ton mot secret"}
      </div>
      <div style={{
        fontFamily: "var(--font-display, system-ui)",
        fontSize: word ? 56 : 44, lineHeight: 1, margin: "10px 0 6px",
        letterSpacing: -2.5, color: "#1A0E2E", fontWeight: 900,
        textAlign: role === "mrwhite" ? "center" : "left",
        opacity: role === "mrwhite" ? 0.4 : 1,
      }}>{word ?? "?????"}</div>
      <div style={{ position: "absolute", top: 22, right: 16, transform: "rotate(8deg)" }}>
        <Stamp text={label} color={color} rotate={0} size={11} />
      </div>
      <div style={{
        marginTop: 12, paddingTop: 14,
        borderTop: "1px dashed rgba(26,14,46,0.25)",
        fontSize: 12, fontStyle: "italic", color: "#3A2700", lineHeight: 1.45,
      }}>{hint}</div>
    </div>
  );
}

function CluePhase({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const [text, setText] = useState("");
  const [showWord, setShowWord] = useState(false);
  const isMyTurn = state.currentSpeakerId === myId;
  const me = state.players.find((p) => p.id === myId);
  const dead = me?.isEliminated ?? false;
  const alive = state.players.filter((p) => !p.isEliminated).length;
  const isHost = state.players[0]?.id === myId;

  const orderIds = state.clueOrder.length > 0 ? state.clueOrder : state.players.map((p) => p.id);
  const orderedAlive = orderIds
    .map((id) => state.players.find((p) => p.id === id))
    .filter((p): p is UCPlayer => Boolean(p) && !p!.isEliminated);
  const dead_players = state.players.filter((p) => p.isEliminated);
  const orderedPlayers = [...orderedAlive, ...dead_players];

  const submitClue = () => {
    const v = text.trim();
    if (!v) return;
    sendAction({ action: "clue", clue: v });
    setText("");
  };

  return (
    <>
      <NavBar sub={`Manche ${state.round} · ordre de parole`} title="À qui le tour ?" right={<Tag color="#3DDC97">{alive} EN VIE</Tag>} />

      <div style={{
        padding: 8, borderRadius: 18,
        background: "rgba(0,0,0,0.32)",
        border: "1px dashed rgba(255,255,255,0.12)",
        display: "flex", flexDirection: "column", gap: 4,
        marginBottom: 16,
      }}>
        {orderedPlayers.map((p, idx) => {
          const isCurrent = p.id === state.currentSpeakerId;
          const isSpoken  = p.hasClue && !isCurrent;
          const isDead    = p.isEliminated;
          const n = isDead ? null : (orderedAlive.findIndex((q) => q.id === p.id) + 1) || idx + 1;
          const isMe = p.id === myId;
          return (
            <div key={p.id} style={{
              position: "relative", display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px 10px 8px", borderRadius: 12,
              background: isCurrent ? "linear-gradient(90deg, rgba(255,210,63,0.20) 0%, rgba(255,210,63,0.04) 100%)" : "transparent",
              border: isCurrent ? "1.5px solid #FFD23F" : "1px solid transparent",
              opacity: isDead ? 0.4 : 1,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                background: isCurrent ? "#FFD23F" : isDead ? "transparent" : "rgba(255,255,255,0.06)",
                border: isDead ? "1px dashed rgba(255,255,255,0.25)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display, system-ui)", fontWeight: 900, fontSize: 13,
                color: isCurrent ? "#1A0E2E" : isDead ? "rgba(255,255,255,0.4)" : "white",
              }}>{isDead ? "✕" : n}</div>

              <div style={{ position: "relative", flexShrink: 0 }}>
                {isCurrent && [0, 1].map((i) => (
                  <div key={i} style={{
                    position: "absolute", inset: -6, borderRadius: "50%",
                    border: "2px solid #FFD23F",
                    animation: "uc-pulse 1.6s ease-out infinite",
                    animationDelay: `${i * 0.6}s`, opacity: 0.5,
                  }} />
                ))}
                <Mascot size={40} color={colorOf(p.id)}
                  mood={isDead ? "dead" : isCurrent ? "happy" : isSpoken ? "wink" : "neutral"}
                  bob={false} delay={idx * 0.1} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontSize: 16, fontWeight: 800,
                    color: isDead ? "rgba(255,255,255,0.4)" : "white",
                    textDecoration: isDead ? "line-through" : "none",
                    lineHeight: 1, letterSpacing: -0.3,
                  }}>{p.name}</span>
                  {isMe && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#FFD23F", color: "#1A0E2E", fontWeight: 900 }}>TOI</span>}
                </div>
                <div style={{
                  fontSize: 11, marginTop: 4,
                  color: isCurrent ? "#FFD23F" : isDead ? "#FF3EA5" : "rgba(255,255,255,0.5)",
                  fontWeight: isCurrent ? 700 : 500,
                }}>
                  {isCurrent && (isMe ? "🎤 à toi · donne un indice" : "🎤 en train de parler")}
                  {isSpoken && p.clue && `« ${p.clue} »`}
                  {isDead && `éliminé · manche ${p.eliminatedRound ?? "?"}`}
                  {!isCurrent && !isSpoken && !isDead && "en attente"}
                </div>
              </div>

              {isSpoken && <span style={{ color: "#3DDC97", fontSize: 14, fontWeight: 800 }}>✓</span>}
              {isCurrent && !isMe && <Timer time={state.timeLeft} color="#FFD23F" />}
            </div>
          );
        })}
      </div>

      {isMyTurn && !dead && (
        <div style={{
          display: "flex", gap: 8, padding: 6, borderRadius: 14,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,210,63,0.30)",
          marginBottom: 12,
        }}>
          <input
            autoFocus value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitClue()}
            placeholder="Ton indice…" maxLength={28}
            style={{
              flex: 1, background: "transparent", border: "none", color: "white",
              fontSize: 16, padding: 10, outline: "none", fontWeight: 600, fontFamily: "inherit",
            }}
          />
          <Btn tone="gold" full={false} onClick={submitClue} style={{ padding: "10px 16px" }}>Envoyer →</Btn>
        </div>
      )}

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {!dead && (
          <Btn tone="ghost" icon={<span style={{ fontSize: 16 }}>👁</span>} onClick={() => setShowWord(true)}>
            Revoir mon mot
          </Btn>
        )}
        {isHost && orderedAlive.every((p) => p.hasClue || p.id === state.currentSpeakerId) && (
          <Btn tone="danger" icon={<span style={{ fontSize: 16 }}>⚖</span>} onClick={() => sendAction({ action: "force-vote" })}>
            Passer au vote
          </Btn>
        )}
      </div>

      {showWord && (
        <WordModal role={state.myRole ?? "civil"} word={state.myWord} onClose={() => setShowWord(false)} />
      )}
    </>
  );
}

function WordModal({ role, word, onClose }: { role: Role; word: string | null; onClose: () => void }) {
  const color = ROLE_COLOR[role];
  const label = ROLE_LABEL[role];
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "relative", maxWidth: 360, width: "100%",
        padding: "22px 20px 24px", borderRadius: 22,
        background: "linear-gradient(180deg, #FFF7E0 0%, #F0DA9A 100%)",
        color: "#1A0E2E", boxShadow: "0 24px 50px rgba(0,0,0,0.55)",
        transform: "rotate(-1.5deg)",
      }}>
        <div style={{
          position: "absolute", top: -13, left: "50%", transform: "translateX(-50%) rotate(-2deg)",
          width: 100, height: 22,
          background: "rgba(255,210,63,0.7)",
          borderTop: "1px dashed rgba(0,0,0,0.15)", borderBottom: "1px dashed rgba(0,0,0,0.15)",
        }} />
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>CONFIDENTIEL · 6s</div>
        <div style={{ marginTop: 12, fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "#7A3008", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>
          {role === "mrwhite" ? "Pas de mot" : "Ton mot"}
        </div>
        <div style={{
          fontFamily: "var(--font-display, system-ui)",
          fontSize: 56, lineHeight: 1, margin: "8px 0", letterSpacing: -2.5, fontWeight: 900,
          opacity: role === "mrwhite" ? 0.4 : 1,
          textAlign: role === "mrwhite" ? "center" : "left",
        }}>{word ?? "?????"}</div>
        <div style={{ position: "absolute", top: 22, right: 16, transform: "rotate(8deg)" }}>
          <Stamp text={label} color={color} rotate={0} size={11} />
        </div>
        <button onClick={onClose} style={{
          marginTop: 14, width: "100%", padding: 10,
          background: "#1A0E2E", color: "white", border: "none",
          borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>Cacher maintenant</button>
      </div>
    </div>
  );
}

function VotePhase({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  const me = state.players.find((p) => p.id === myId);
  const dead = me?.isEliminated ?? false;
  const alive = state.players.filter((p) => !p.isEliminated);
  const voted = alive.filter((p) => p.hasVoted).length;
  const cast = () => { if (picked && !me?.hasVoted) sendAction({ action: "vote", targetId: picked }); };

  return (
    <>
      <NavBar sub={`Manche ${state.round} · vote`} title="Qui démasquer ?" right={<Timer time={state.timeLeft} color="#FFD23F" />} />

      <div style={{ padding: "8px 12px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px dashed rgba(255,255,255,0.12)", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
        Choisis qui doit sortir. Tu ne peux pas voter pour toi-même.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {alive.map((p) => {
          const isMe = p.id === myId;
          const isPicked = picked === p.id;
          const tally = state.voteTally?.[p.id] ?? 0;
          return (
            <button key={p.id} disabled={isMe || dead || me?.hasVoted}
              onClick={() => !isMe && setPicked(p.id)}
              style={{
                position: "relative", padding: "16px 12px 14px", borderRadius: 18,
                background: isPicked ? "linear-gradient(160deg, rgba(255,62,165,0.35), rgba(0,0,0,0.4))" : "rgba(255,255,255,0.04)",
                border: isPicked ? "2px solid #FF3EA5" : "1px solid rgba(255,255,255,0.10)",
                boxShadow: isPicked ? "0 18px 36px rgba(255,62,165,0.4)" : "0 4px 10px rgba(0,0,0,0.3)",
                transform: isPicked ? "scale(1.04)" : "scale(1)",
                opacity: isMe ? 0.5 : 1,
                cursor: isMe || dead || me?.hasVoted ? "not-allowed" : "pointer",
                color: "white", textAlign: "center", fontFamily: "inherit",
              }}>
              {isMe && <span style={{ position: "absolute", top: 8, left: 8, padding: "2px 7px", borderRadius: 99, background: "#FFD23F", color: "#1A0E2E", fontSize: 8, fontWeight: 900 }}>TOI</span>}
              {tally > 0 && <span style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", borderRadius: 99, background: "#FF3EA5", color: "white", fontSize: 9, fontWeight: 800 }}>{tally} vote{tally > 1 ? "s" : ""}</span>}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                <Mascot color={colorOf(p.id)} size={64} mood={isPicked ? "shocked" : isMe ? "neutral" : "shifty"} arms bob={false} />
              </div>
              <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 18, marginTop: 10, lineHeight: 1, fontWeight: 800 }}>
                {p.name}
              </div>
              {isPicked ? (
                <div style={{ marginTop: 8, padding: "6px 0", borderRadius: 10, background: "#FF3EA5", color: "white", fontSize: 11, fontWeight: 800 }}>✕ Ton vote</div>
              ) : isMe ? (
                <div style={{ marginTop: 8, padding: "6px 0", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700 }}>pas toi-même</div>
              ) : (
                <div style={{ marginTop: 8, padding: "6px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700 }}>tap pour voter</div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <Mono>Participation</Mono>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, fontWeight: 800 }}>{voted} / {alive.length}</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${alive.length ? (voted / alive.length) * 100 : 0}%`, background: "linear-gradient(90deg, #FF3EA5, #FFD23F)" }} />
        </div>
      </div>

      <div style={{ marginTop: "auto" }}>
        <Btn tone="danger" disabled={!picked || dead || (me?.hasVoted ?? false)} onClick={cast}
          sub={picked ? state.players.find((p) => p.id === picked)?.name : undefined}>
          {me?.hasVoted ? "Vote envoyé · attends les autres" : "Confirmer le vote"}
        </Btn>
      </div>
    </>
  );
}

function EliminatePhase({ state }: { state: UCState }) {
  const elim = state.players.find((p) => p.id === state.eliminatedThisRound);
  const role = elim?.role ?? state.eliminatedRole;
  const color = role ? ROLE_COLOR[role] : "#FFD23F";

  return (
    <>
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 800, height: 800, maxWidth: "180vw",
        background: `conic-gradient(from 0deg, transparent 0deg, ${color}30 10deg, transparent 28deg, transparent 80deg, ${color}26 90deg, transparent 110deg, transparent 160deg, ${color}30 170deg, transparent 190deg, transparent 240deg, ${color}26 250deg, transparent 270deg, transparent 320deg, ${color}30 330deg, transparent 350deg)`,
        animation: "uc-rotate 18s linear infinite",
        opacity: 0.55, pointerEvents: "none", borderRadius: "50%", zIndex: 0,
        maskImage: "radial-gradient(circle, transparent 25%, black 50%, transparent 85%)",
      }} />

      <NavBar sub={`Verdict · manche ${state.round}`} title={elim ? "Démasqué !" : "Égalité"} right={<Tag color={color}>{role ? ROLE_LABEL[role].toUpperCase() : "—"}</Tag>} />

      {elim ? (
        <>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 20px" }}>
            <div style={{ position: "absolute", top: 10, width: 280, height: 220, background: `radial-gradient(circle, ${color}40 0%, transparent 65%)` }} />
            <div style={{ position: "relative" }}>
              <SpyMascot id={elim.id} size={160} tilt={-14} mood="dead" />
              <div style={{ position: "absolute", top: -8, right: -50, zIndex: 5 }}>
                <Stamp text="Éliminé" color={color} rotate={-12} size={20} />
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 44, marginTop: 14, letterSpacing: -1.5, fontWeight: 900 }}>{elim.name}</div>
          </div>

          {(elim.word !== null || state.civilWord) && (
            <div style={{
              padding: "16px 18px", borderRadius: 18,
              background: `linear-gradient(160deg, ${color}26, rgba(0,0,0,0.45))`,
              border: `1px solid ${color}55`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 16,
            }}>
              <div>
                <Mono>Son mot</Mono>
                <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 26, color, fontWeight: 900, marginTop: 4 }}>{elim.word ?? "Aucun mot"}</div>
              </div>
              <div style={{ fontSize: 22, color: "rgba(255,255,255,0.5)" }}>≠</div>
              <div style={{ textAlign: "right" }}>
                <Mono>Rôle</Mono>
                <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 22, color: "white", fontWeight: 900, marginTop: 4 }}>{role ? ROLE_LABEL[role] : "—"}</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.6)" }}>
          Pas de majorité — personne ne sort cette manche.
        </div>
      )}

      <div style={{ marginTop: "auto", fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        Préparation de la suite…
      </div>
    </>
  );
}

function MrWhitePhase({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const [text, setText] = useState("");
  const isMe = state.eliminatedThisRound === myId;
  const target = state.players.find((p) => p.id === state.eliminatedThisRound);

  return (
    <>
      <NavBar sub="Coup du destin" title="Mr. White devine" right={<Timer time={state.timeLeft} color="#FFD23F" />} />
      <div style={{
        padding: 18, borderRadius: 22,
        background: "linear-gradient(160deg, rgba(255,210,63,0.20) 0%, rgba(0,0,0,0.45) 100%)",
        border: "1px solid rgba(255,210,63,0.40)",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {target && <Mascot color={colorOf(target.id)} size={68} mood="thinking" arms />}
          <div>
            <Mono>Mr. White éliminé</Mono>
            <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 26, fontWeight: 900, marginTop: 4 }}>{target?.name}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
          {isMe
            ? "🎯 Une dernière chance. Tape le mot des civils pour gagner seul."
            : "Mr. White a une seule chance. S'il tape le mot exact, il vole la victoire."}
        </div>
      </div>

      {isMe && (
        <div style={{
          display: "flex", gap: 8, padding: 6, borderRadius: 14,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,210,63,0.40)",
          marginBottom: 12,
        }}>
          <input autoFocus value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && text.trim() && sendAction({ action: "mrwhite-guess", guess: text.trim() })}
            placeholder="Ton pari…"
            style={{
              flex: 1, background: "transparent", border: "none", color: "white",
              fontSize: 18, padding: 10, outline: "none", fontWeight: 700, letterSpacing: 0.5,
              fontFamily: "inherit",
            }} />
          <Btn tone="gold" full={false} onClick={() => text.trim() && sendAction({ action: "mrwhite-guess", guess: text.trim() })} style={{ padding: "10px 16px" }}>Parier</Btn>
        </div>
      )}
    </>
  );
}

function GameOverPhase({ state, onReturnToLobby }: { state: UCState; onReturnToLobby?: () => void }) {
  const reason = state.endReason;
  const title =
    reason === "civils-win" ? "Civils victorieux" :
    reason === "undercover-wins" ? "Undercover gagne" :
    reason === "mrwhite-wins" ? "Mr. White triomphe" : "Fin de partie";
  const accent =
    reason === "civils-win" ? "#3DDC97" :
    reason === "undercover-wins" ? "#FF3EA5" :
    reason === "mrwhite-wins" ? "#FFD23F" : "#FFD23F";

  const sorted = useMemo(() => [...state.players].sort((a, b) => b.score - a.score), [state.players]);

  return (
    <>
      <Confetti accent={accent} count={50} />
      <NavBar sub={`Fin · ${state.round} manche${state.round > 1 ? "s" : ""}`} title="" right={<Tag color={accent}>VICTOIRE</Tag>} />

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h1 style={{
          fontFamily: "var(--font-display, system-ui)",
          fontSize: 48, margin: 0, color: "white", letterSpacing: -2, lineHeight: 0.9, fontWeight: 900,
          textShadow: `0 0 36px ${accent}88`,
        }}>
          <span style={{
            background: `linear-gradient(120deg, ${accent}, #FFD23F)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{title.split(" ")[0]}</span>
          <br/>{title.split(" ").slice(1).join(" ")}
        </h1>
      </div>

      <div style={{ position: "relative", height: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ position: "absolute", left: "50%", top: 20, transform: "translateX(-50%)", width: 360, height: 220, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${accent}40, transparent 70%)` }} />
        {sorted[1] && <div style={{ position: "absolute", left: "12%", bottom: 0 }}><SpyMascot id={sorted[1].id} size={72} tilt={-8} mood="happy" arms delay={0.2} /></div>}
        {sorted[2] && <div style={{ position: "absolute", right: "12%", bottom: 0 }}><SpyMascot id={sorted[2].id} size={68} tilt={6} mood="wink" arms delay={0.3} /></div>}
        {sorted[0] && <div style={{ position: "relative", zIndex: 2 }}><SpyMascot id={sorted[0].id} size={130} tilt={-2} mood="happy" cheering arms crown delay={0} /></div>}
      </div>

      {state.civilWord && state.undercoverWord && (
        <div style={{
          padding: "12px 14px", borderRadius: 14,
          background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.10)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <div>
            <Mono>Civils</Mono>
            <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 20, color: "#3DDC97", fontWeight: 900 }}>{state.civilWord}</div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontWeight: 800 }}>vs</div>
          <div style={{ textAlign: "right" }}>
            <Mono>Undercover</Mono>
            <div style={{ fontFamily: "var(--font-display, system-ui)", fontSize: 20, color: "#FF3EA5", fontWeight: 900 }}>{state.undercoverWord}</div>
          </div>
        </div>
      )}

      <Mono style={{ marginBottom: 8 }}>Classement</Mono>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
        {sorted.map((p, i) => {
          const r = (p.role ?? "civil") as Role;
          const rc = ROLE_COLOR[r];
          const win = (reason === "civils-win" && r === "civil")
            || (reason === "undercover-wins" && (r === "undercover" || r === "mrwhite"))
            || (reason === "mrwhite-wins" && r === "mrwhite");
          return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 10px 6px 6px", borderRadius: 10,
              background: i === 0 ? "rgba(255,210,63,0.10)" : win ? "rgba(61,220,151,0.06)" : "rgba(255,62,165,0.06)",
              border: `1px solid ${i === 0 ? "rgba(255,210,63,0.30)" : win ? "rgba(61,220,151,0.20)" : "rgba(255,62,165,0.18)"}`,
            }}>
              <span style={{ width: 16, fontFamily: "var(--font-mono, monospace)", fontWeight: 800, fontSize: 11, color: i === 0 ? "#FFD23F" : "rgba(255,255,255,0.5)" }}>#{i + 1}</span>
              <Mascot color={colorOf(p.id)} size={28} mood={win ? "wink" : "dead"} bob={false} shadow={false} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{p.name}</span>
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 99,
                background: r === "mrwhite" ? "rgba(255,210,63,0.18)" : `${rc}26`,
                color: rc, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4,
              }}>{ROLE_LABEL[r]}</span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, fontWeight: 800, color: win ? "#3DDC97" : "rgba(255,255,255,0.5)", width: 38, textAlign: "right" }}>{p.score}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
        {onReturnToLobby && <Btn tone="ghost" full={false} style={{ flex: 1 }} onClick={onReturnToLobby}>Lobby</Btn>}
      </div>
    </>
  );
}
