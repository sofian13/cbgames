"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
import { Mascot, MascotAvatar, MASCOT_COLORS, type MascotColor, type MascotMood } from "@/components/Mascot";
import type { GameProps } from "@/lib/games/types";

// ===========================================================
//  UNDERCOVER — Client (refonte mobile-first, noir / dossier)
//  Toutes les phases du serveur sont mappées 1:1 ici.
//  Visuels alignés sur le design system AF Games (blob mascots,
//  fonts Bricolage / DM Sans, palette nuit-pourpre).
// ===========================================================

// ---------- Types miroir de l'état serveur ----------
type Role = "civil" | "undercover" | "mrwhite";
type Phase =
  | "waiting"
  | "word-reveal"
  | "clue"
  | "vote"
  | "vote-result"
  | "mrwhite-guess"
  | "round-end"
  | "game-over";
type EndReason = "civils-win" | "undercover-wins" | "mrwhite-wins" | null;

interface UCPlayer {
  id: string;
  name: string;
  score: number;
  isEliminated: boolean;
  hasClue: boolean;
  hasVoted: boolean;
  clue: string | null;
  eliminatedRound: number | null;
  role: Role | null;
  word: string | null;
}

interface UCState {
  phase: Phase;
  round: number;
  timeLeft: number;
  config: { undercoverCount: number; includeMrWhite: boolean; autoBalance: boolean };
  currentSpeakerId: string | null;
  clueOrder: string[];
  currentClueIdx: number;
  eliminatedThisRound: string | null;
  eliminatedRole: Role | null;
  voteTally: Record<string, number> | null;
  clueHistory: { round: number; playerId: string; playerName: string; clue: string }[];
  civilWord: string | null;
  undercoverWord: string | null;
  lastGuess: string | null;
  lastGuessCorrect: boolean | null;
  endReason: EndReason;
  players: UCPlayer[];
  myRole: Role | null;
  myWord: string | null;
  myId: string | null;
}

// ---------- Palette ----------
const ROLE_COLOR: Record<Role, string> = {
  civil: "#3DDC97",
  undercover: "#FF3EA5",
  mrwhite: "#FFD23F",
};
const ROLE_LABEL: Record<Role, string> = {
  civil: "Civil",
  undercover: "Undercover",
  mrwhite: "Mr. White",
};

// Couleurs déterministes par joueur (basées sur l'id)
const colorOf = (id: string): MascotColor => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return MASCOT_COLORS[Math.abs(h) % MASCOT_COLORS.length];
};

// ===========================================================
//  Composant principal
// ===========================================================
export default function UndercoverGame({ roomCode, playerId, playerName, onReturnToLobby }: GameProps) {
  const { sendAction } = useGame(roomCode, "undercover", playerId, playerName);
  const gameState = useGameStore((s) => s.gameState) as unknown as UCState | null;

  if (!gameState) {
    return <UCLoader text="Connexion à la salle…" />;
  }

  const phase = gameState.phase;

  return (
    <UCContainer>
      {phase === "waiting" && <PhaseWaiting state={gameState} sendAction={sendAction} myId={playerId} />}
      {phase === "word-reveal" && <PhaseWordReveal state={gameState} sendAction={sendAction} />}
      {phase === "clue" && <PhaseClue state={gameState} sendAction={sendAction} myId={playerId} />}
      {phase === "vote" && <PhaseVote state={gameState} sendAction={sendAction} myId={playerId} />}
      {phase === "vote-result" && <PhaseEliminate state={gameState} />}
      {phase === "mrwhite-guess" && <PhaseMrWhiteGuess state={gameState} sendAction={sendAction} myId={playerId} />}
      {phase === "round-end" && <PhaseEliminate state={gameState} />}
      {phase === "game-over" && <PhaseGameOver state={gameState} onReturnToLobby={onReturnToLobby} />}
    </UCContainer>
  );
}

// ===========================================================
//  Shell & UI primitives
// ===========================================================
function UCContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100dvh",
      color: "white",
      fontFamily: "var(--f-ui, 'DM Sans'), system-ui, sans-serif",
      background:
        "radial-gradient(120% 70% at 50% 0%, rgba(91,54,214,0.35) 0%, transparent 60%), " +
        "radial-gradient(120% 60% at 50% 100%, rgba(255,62,165,0.18) 0%, transparent 60%), " +
        "linear-gradient(180deg, #0A0420 0%, #150834 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", inset: 0,
        background:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px), " +
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px)",
        maskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 80%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, padding: "20px 16px 28px", maxWidth: 480, margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}

function UCLoader({ text }: { text: string }) {
  return (
    <UCContainer>
      <div style={{ textAlign: "center", padding: "120px 16px", color: "rgba(255,255,255,0.6)" }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          border: "3px solid rgba(255,210,63,0.25)", borderTopColor: "#FFD23F",
          animation: "uc-spin 1s linear infinite", margin: "0 auto 16px",
        }} />
        {text}
        <style>{`@keyframes uc-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </UCContainer>
  );
}

function Tag({ children, color = "#FFD23F" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontFamily: "var(--f-mono, 'JetBrains Mono'), monospace",
      fontSize: 9, fontWeight: 800, letterSpacing: 2,
      textTransform: "uppercase",
      color, padding: "3px 8px",
      border: `1px solid ${color}55`, borderRadius: 3,
      background: `${color}11`,
    }}>{children}</span>
  );
}

function NavBar({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {sub && (
          <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, color: "#FFD23F", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
            {sub}
          </div>
        )}
        <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontWeight: 800, fontSize: 22, color: "white", letterSpacing: -0.5, marginTop: 2 }}>
          {title}
        </div>
      </div>
      {right}
    </div>
  );
}

function Btn({
  children,
  tone = "primary",
  disabled = false,
  onClick,
  full = true,
  style = {},
}: {
  children: React.ReactNode;
  tone?: "primary" | "danger" | "gold" | "ghost" | "mint";
  disabled?: boolean;
  onClick?: () => void;
  full?: boolean;
  style?: React.CSSProperties;
}) {
  const tones: Record<string, { bg: string; color: string; shadow: string }> = {
    primary: { bg: "linear-gradient(180deg, #7A4EE8 0%, #4D26B6 100%)", color: "white", shadow: "0 12px 28px rgba(91,54,214,0.55), inset 0 1px 0 rgba(255,255,255,0.25)" },
    danger:  { bg: "linear-gradient(180deg, #FF3EA5 0%, #B5176E 100%)", color: "white", shadow: "0 12px 28px rgba(255,62,165,0.55), inset 0 1px 0 rgba(255,255,255,0.25)" },
    gold:    { bg: "linear-gradient(180deg, #FFD23F 0%, #C48800 100%)", color: "#1A0E2E", shadow: "0 12px 28px rgba(255,210,63,0.45), inset 0 1px 0 rgba(255,255,255,0.4)" },
    ghost:   { bg: "rgba(255,255,255,0.08)", color: "white", shadow: "inset 0 0 0 1px rgba(255,255,255,0.10)" },
    mint:    { bg: "linear-gradient(180deg, #3DDC97 0%, #189A66 100%)", color: "#0E0828", shadow: "0 12px 28px rgba(61,220,151,0.45), inset 0 1px 0 rgba(255,255,255,0.3)" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: full ? "100%" : "auto",
        padding: "14px 18px",
        borderRadius: 16,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: t.bg, color: t.color, boxShadow: t.shadow,
        opacity: disabled ? 0.45 : 1,
        fontWeight: 700, fontSize: 15, letterSpacing: -0.2,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "transform .12s",
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

function Avatar({ name: _name, id, size = 36, dead = false, ring = false, mood: moodProp }: { name?: string; id: string; size?: number; dead?: boolean; ring?: boolean; mood?: MascotMood }) {
  const color = colorOf(id);
  const mood: MascotMood = dead ? "dead" : (moodProp ?? "happy");
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {ring && (
        <div style={{
          position: "absolute", inset: -4, borderRadius: "50%",
          border: "2px solid #FFD23F", animation: "uc-pulse 1.6s ease-out infinite",
          zIndex: 0,
        }} />
      )}
      <div style={{ filter: dead ? "grayscale(0.6) brightness(0.8)" : "none", position: "relative" }}>
        <MascotAvatar color={color} size={size} mood={mood} border={false} />
      </div>
      <style>{`@keyframes uc-pulse { 0%{transform:scale(0.95);opacity:0.8;} 100%{transform:scale(1.5);opacity:0;} }`}</style>
    </div>
  );
}

// SpyAvatar — vrai blob expressif + lunettes de soleil dorées par dessus
function SpyAvatar({ name: _name, id, size = 80, tilt = -3, mood = "sus", cheering = false, crown = false, arms = false }: { name?: string; id: string; size?: number; tilt?: number; mood?: MascotMood; cheering?: boolean; crown?: boolean; arms?: boolean }) {
  const color = colorOf(id);
  return (
    <div style={{ position: "relative", width: size, height: size * 1.15 + (crown ? size * 0.3 : 0) }}>
      <Mascot size={size} color={color} mood={mood} cheering={cheering} crown={crown} arms={arms} />
      {/* Lunettes overlay */}
      <div style={{
        position: "absolute",
        left: "50%",
        // ajusté selon la géométrie de Mascot — les yeux sont autour de bodyH * 0.40 depuis le bas
        bottom: size * 0.06 + size * 0.94 * 0.36,
        width: size * 0.66, height: size * 0.18,
        transform: `translateX(-50%) rotate(${tilt}deg)`,
        pointerEvents: "none", zIndex: 5,
      }}>
        <svg viewBox="0 0 100 28" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M2 12 L18 12 M48 12 L52 12 M82 12 L98 12" stroke="#1A0E2E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M18 4 Q18 18 30 22 Q44 24 47 14 Q48 6 36 4 Z" fill="#0E0828" stroke="#FFD23F" strokeWidth="1" />
          <path d="M53 14 Q56 24 70 22 Q82 18 82 4 L65 4 Q53 6 53 14 Z" fill="#0E0828" stroke="#FFD23F" strokeWidth="1" />
          <ellipse cx="26" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.55" />
          <ellipse cx="63" cy="9" rx="3" ry="2" fill="#FFD23F" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

// ===========================================================
//  PHASE — WAITING (briefing + configuration par l'hôte)
// ===========================================================
function PhaseWaiting({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const isHost = state.players[0]?.id === myId;
  const cfg = state.config;
  const total = state.players.length;
  // Reconstruit la composition pour la visualisation
  const civils = Math.max(0, total - cfg.undercoverCount - (cfg.includeMrWhite ? 1 : 0));
  const tokens: Array<{ kind: "civil" | "undercover" | "mrwhite" | "empty" }> = [];
  for (let i = 0; i < civils; i++) tokens.push({ kind: "civil" });
  for (let i = 0; i < cfg.undercoverCount; i++) tokens.push({ kind: "undercover" });
  if (cfg.includeMrWhite) tokens.push({ kind: "mrwhite" });
  // remplit jusqu'à 8 visuellement
  while (tokens.length < Math.max(total, 3)) tokens.push({ kind: "empty" });

  // 3 premiers joueurs pour le cluster spy blob
  const featured = state.players.slice(0, 3);

  return (
    <div>
      {/* Spotlight backdrop */}
      <div style={{
        position: "absolute", left: "50%", top: 40, transform: "translateX(-50%)",
        width: 540, height: 360, maxWidth: "100%",
        background: "radial-gradient(ellipse 60% 80% at 50% 30%, rgba(255,210,63,0.18) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Top dossier ribbon */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 8,
        }}>
          <Tag>DOSSIER · CASE #14</Tag>
          <Tag color="#FF3EA5">BRIEFING</Tag>
        </div>

        {/* SpyBlob cluster */}
        <div style={{
          position: "relative", height: 180,
          display: "flex", justifyContent: "center", alignItems: "flex-end",
          marginBottom: 4,
        }}>
          {featured.length > 0 ? (
            <>
              {featured[1] && (
                <div style={{ position: "absolute", left: "18%", bottom: 6, opacity: 0.9 }}>
                  <SpyAvatar id={featured[1].id} name={featured[1].name} size={70} tilt={-6} />
                </div>
              )}
              {featured[2] && (
                <div style={{ position: "absolute", right: "18%", bottom: 6, opacity: 0.9 }}>
                  <SpyAvatar id={featured[2].id} name={featured[2].name} size={70} tilt={4} />
                </div>
              )}
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: "50%", top: "50%",
                  width: 220, height: 220, transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, rgba(122,78,232,0.28) 0%, transparent 65%)",
                  pointerEvents: "none",
                }} />
                <SpyAvatar id={featured[0].id} name={featured[0].name} size={130} tilt={-3} />
              </div>
            </>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                width: 220, height: 220, transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, rgba(122,78,232,0.28) 0%, transparent 65%)",
              }} />
              <SpyAvatar id="ghost-1" name="?" size={130} tilt={-3} />
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 10, color: "#FF3EA5", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
            Bluff · 3-8 joueurs · 10 min
          </div>
          <h1 style={{
            fontFamily: "var(--f-display, 'Bricolage Grotesque')",
            fontSize: 44, margin: "8px 0 6px", color: "white",
            letterSpacing: -1.8, lineHeight: 0.95, fontWeight: 800,
            textShadow: "0 0 30px rgba(255,62,165,0.35)",
          }}>
            Under
            <span style={{ background: "linear-gradient(120deg, #FFD23F, #FF3EA5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>cover</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0, lineHeight: 1.45 }}>
            Chaque joueur reçoit un mot secret.<br />
            Un d'eux a un mot <em style={{ color: "#FFD23F", fontStyle: "normal", fontWeight: 700 }}>légèrement différent</em>. Démasque-le.
          </p>
        </div>

        {/* How-to-play mini cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "18px 0 14px" }}>
          {[
            { n: "01", t: "Indice",     d: "Un mot par tour. Sans le dire." },
            { n: "02", t: "Vote",       d: "Qui sonne faux ?" },
            { n: "03", t: "Démasque",   d: "Le mot du suspect est révélé." },
          ].map((s) => (
            <div key={s.n} style={{
              padding: "10px 10px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, color: "#FFD23F", fontWeight: 800, letterSpacing: 1 }}>{s.n}</div>
              <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 14, color: "white", lineHeight: 1.1, marginTop: 2 }}>{s.t}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 1.3 }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* Composition file card */}
        <FileCard accent="#FF3EA5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, color: "rgba(255,255,255,0.55)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
              Composition · {total} joueur{total > 1 ? "s" : ""}
            </div>
            {cfg.autoBalance && <Tag color="#3DDC97">AUTO</Tag>}
          </div>

          {/* Tokens row */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {tokens.map((t, i) => {
              const col = t.kind === "civil" ? "#3DDC97" : t.kind === "undercover" ? "#FF3EA5" : t.kind === "mrwhite" ? "#FFD23F" : "rgba(255,255,255,0.12)";
              const icon = t.kind === "civil" ? "🛡" : t.kind === "undercover" ? "🕶" : t.kind === "mrwhite" ? "?" : "·";
              return (
                <div key={i} style={{
                  flex: 1, height: 38, borderRadius: 8,
                  background: t.kind === "empty" ? "transparent" : t.kind === "mrwhite" ? "rgba(255,210,63,0.10)" : `${col}1F`,
                  border: t.kind === "empty" ? "1px dashed rgba(255,255,255,0.15)" : `1px solid ${col}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: t.kind === "empty" ? "rgba(255,255,255,0.3)" : col,
                  fontWeight: 700,
                }}>{icon}</div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 12 }}>
            {[
              { lbl: "Civils",     n: civils,              col: "#3DDC97", sub: "même mot" },
              { lbl: "Undercover", n: cfg.undercoverCount, col: "#FF3EA5", sub: "mot voisin" },
              { lbl: "Mr. White",  n: cfg.includeMrWhite ? 1 : 0, col: "#FFD23F", sub: "aucun mot" },
            ].map((r) => (
              <div key={r.lbl} style={{
                padding: "8px 6px", borderRadius: 10,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}>
                <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 22, color: r.col, lineHeight: 1, fontWeight: 800 }}>{r.n}</div>
                <div style={{ fontSize: 10, color: "white", fontWeight: 700, marginTop: 3 }}>{r.lbl}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{r.sub}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <Row label={`Undercover · ${cfg.undercoverCount}`}>
            <Stepper
              value={cfg.undercoverCount}
              min={1}
              max={3}
              disabled={!isHost}
              onChange={(v) => sendAction({ action: "configure", config: { undercoverCount: v, autoBalance: false } })}
            />
          </Row>
          <Row label="Inclure Mr. White">
            <Toggle
              value={cfg.includeMrWhite}
              disabled={!isHost}
              onChange={(v) => sendAction({ action: "configure", config: { includeMrWhite: v, autoBalance: false } })}
            />
          </Row>
          <Row label="Auto-équilibrage">
            <Toggle
              value={cfg.autoBalance}
              disabled={!isHost}
              onChange={(v) => sendAction({ action: "configure", config: { autoBalance: v } })}
            />
          </Row>
        </FileCard>

        {/* Player chips */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Salon · {total} joueur{total > 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {state.players.map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 12px 5px 5px", borderRadius: 99,
                background: p.id === myId ? "rgba(255,210,63,0.10)" : "rgba(255,255,255,0.05)",
                border: p.id === myId ? "1px solid rgba(255,210,63,0.40)" : "1px solid rgba(255,255,255,0.10)",
              }}>
                <Avatar id={p.id} name={p.name} size={26} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</span>
                {p.id === myId && (
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#FFD23F", color: "#1A0E2E", fontWeight: 900, letterSpacing: 0.5 }}>TOI</span>
                )}
                {p.id === state.players[0]?.id && (
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "rgba(255,255,255,0.10)", color: "white", fontWeight: 800, letterSpacing: 0.5 }}>HÔTE</span>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 3 - total) }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                padding: "5px 12px", borderRadius: 99,
                border: "1px dashed rgba(255,255,255,0.15)",
                fontSize: 11, color: "rgba(255,255,255,0.4)",
              }}>+ place libre</div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 22 }}>
          {isHost ? (
            <Btn
              tone="gold"
              disabled={total < 3}
              onClick={() => sendAction({ action: "start-game" })}
            >
              🕶️ {total < 3 ? `Attente · ${total}/3 joueurs` : "Distribuer les rôles"}
            </Btn>
          ) : (
            <div style={{
              padding: "14px 16px", borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px dashed rgba(255,255,255,0.15)",
              fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center",
            }}>
              ⌛ En attente du lancement par l'hôte…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// FileCard — carte dossier avec angle coupé + bande accent (utilisée partout)
function FileCard({ children, accent = "#FFD23F" }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 18,
      padding: 16,
      boxShadow: "0 12px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
    }}>
      <div style={{
        position: "absolute", top: -1, right: -1,
        width: 22, height: 22,
        background: "#0E0828",
        clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.10)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        borderTopRightRadius: 18,
      }} />
      <div style={{
        position: "absolute", left: 0, top: 14, bottom: 14,
        width: 3, borderRadius: 3,
        background: accent, boxShadow: `0 0 12px ${accent}`,
        opacity: 0.9,
      }} />
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderTop: "1px dashed rgba(255,255,255,0.08)",
    }}>
      <span style={{ fontSize: 13, color: "white", fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange, disabled }: { value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  const btn: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 8, border: "none",
    background: "rgba(255,255,255,0.06)", color: "white", fontWeight: 800, fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button style={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span style={{ width: 22, textAlign: "center", fontWeight: 800 }}>{value}</span>
      <button style={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!value)}
      style={{
        width: 46, height: 26, borderRadius: 99, border: "none",
        background: value ? "#3DDC97" : "rgba(255,255,255,0.12)",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transition: "background .15s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: value ? 22 : 2,
        width: 22, height: 22, borderRadius: "50%", background: "white",
        transition: "left .15s",
      }} />
    </button>
  );
}

// ===========================================================
//  PHASE — WORD REVEAL (mot secret, dossier card)
// ===========================================================
function PhaseWordReveal({ state, sendAction }: { state: UCState; sendAction: (a: Record<string, unknown>) => void }) {
  const role = state.myRole ?? "civil";
  const word = state.myWord;
  const color = ROLE_COLOR[role];
  const label = ROLE_LABEL[role];

  return (
    <div>
      <NavBar sub={`Manche ${state.round} · ton dossier`} title="Mot secret" right={<Tag color={color}>{label.toUpperCase()}</Tag>} />

      {/* Carte dossier */}
      <div style={{
        position: "relative",
        padding: "20px 18px 22px",
        borderRadius: 20,
        background: "linear-gradient(180deg, #FFF7E0 0%, #F5E2A8 100%)",
        color: "#1A0E2E",
        boxShadow: "0 22px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
        transform: "rotate(-0.6deg)", marginTop: 8,
      }}>
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%) rotate(-2deg)",
          width: 96, height: 22,
          background: "linear-gradient(180deg, rgba(255,210,63,0.55) 0%, rgba(255,210,63,0.35) 100%)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
        }} />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingBottom: 10, marginBottom: 14,
          borderBottom: "2px solid rgba(26,14,46,0.25)",
        }}>
          <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, fontWeight: 800, letterSpacing: 2 }}>
            CONFIDENTIEL · NE PAS MONTRER
          </div>
          <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, fontWeight: 800, color: "#7A3008" }}>
            CASE / MANCHE {state.round}
          </div>
        </div>

        <div style={{ fontSize: 11, fontFamily: "var(--f-mono, 'JetBrains Mono')", color: "#7A3008", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>
          {role === "mrwhite" ? "Tu n'as pas de mot" : "Ton mot secret"}
        </div>
        <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: word ? 54 : 38, lineHeight: 1, letterSpacing: -2, color: "#1A0E2E", margin: "10px 0 6px", fontWeight: 900 }}>
          {word ?? "?????"}
        </div>
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed rgba(26,14,46,0.25)", fontSize: 11, fontStyle: "italic", color: "#3A2700", lineHeight: 1.4 }}>
          {role === "civil" && "Trouve les autres civils en donnant un indice clair — sans aider l'undercover."}
          {role === "undercover" && "Reste vague. Devine le mot des civils en écoutant. Bluff pour survivre."}
          {role === "mrwhite" && "Tu n'as aucun mot. Bluff. Si tu es éliminé, tu auras une chance de deviner le mot des civils."}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        L'écran passe automatiquement…
      </div>
      <div style={{ marginTop: 12 }}>
        <Btn tone="gold" onClick={() => sendAction({ action: "ack-word" })}>J'ai mémorisé</Btn>
      </div>
    </div>
  );
}

// ===========================================================
//  PHASE — CLUE (tour de parole)
// ===========================================================
function PhaseClue({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const [text, setText] = useState("");
  const isMyTurn = state.currentSpeakerId === myId;
  const speaker = state.players.find((p) => p.id === state.currentSpeakerId);
  const me = state.players.find((p) => p.id === myId);
  const dead = me?.isEliminated ?? false;

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    sendAction({ action: "clue", clue: v });
    setText("");
  };

  return (
    <div>
      <NavBar
        sub={`Manche ${state.round} · indices`}
        title="Tour de parole"
        right={<Timer time={state.timeLeft} color="#FF3EA5" />}
      />

      {/* Spotlight */}
      <div style={{
        padding: 14, borderRadius: 18,
        background: "linear-gradient(160deg, rgba(255,210,63,0.10) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(255,210,63,0.30)",
        display: "flex", gap: 12, alignItems: "center",
      }}>
        {speaker && <Avatar id={speaker.id} name={speaker.name} size={52} ring />}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, color: "#FFD23F", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
            {isMyTurn ? "À toi de parler" : "Parle"}
          </div>
          <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 22, color: "white", lineHeight: 1, marginTop: 4 }}>
            {speaker?.name ?? "—"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
            Donne un indice. Pas le mot. Pas un synonyme exact.
          </div>
        </div>
      </div>

      {/* Input ou attente */}
      {isMyTurn && !dead ? (
        <div style={{ marginTop: 14 }}>
          <div style={{
            display: "flex", gap: 8, padding: 6, borderRadius: 14,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
          }}>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ton indice…"
              maxLength={28}
              style={{
                flex: 1, background: "transparent", border: "none", color: "white",
                fontSize: 16, padding: "10px 10px", outline: "none", fontWeight: 600,
              }}
            />
            <Btn tone="gold" full={false} onClick={submit} style={{ padding: "10px 16px" }}>
              Envoyer →
            </Btn>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px dashed rgba(255,255,255,0.12)", fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
          {dead ? "Tu as été éliminé — observe la partie." : `En attente de ${speaker?.name ?? "…"}.`}
        </div>
      )}

      {/* Board des indices */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          Tableau d'indices
        </div>
        <div style={{ padding: 8, borderRadius: 16, background: "rgba(0,0,0,0.32)", border: "1px dashed rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", gap: 4 }}>
          {state.players.map((p) => {
            const isSpeak = p.id === state.currentSpeakerId;
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "6px 8px", borderRadius: 10,
                background: isSpeak ? "rgba(255,210,63,0.12)" : "transparent",
                border: isSpeak ? "1px solid rgba(255,210,63,0.45)" : "1px solid transparent",
                opacity: p.isEliminated ? 0.4 : 1,
              }}>
                <Avatar id={p.id} name={p.name} size={28} dead={p.isEliminated} />
                <span style={{ fontSize: 12, fontWeight: 700, color: p.isEliminated ? "rgba(255,255,255,0.4)" : "white", width: 70, flexShrink: 0 }}>
                  {p.name}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {p.clue ? (
                    <span style={{ fontSize: 12, color: "white", padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.06)", fontWeight: 600 }}>
                      « {p.clue} »
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
                      {isSpeak ? "…en train de parler" : "en attente"}
                    </span>
                  )}
                </div>
                {p.hasClue && !p.isEliminated && <span style={{ color: "#3DDC97", fontSize: 12 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===========================================================
//  PHASE — VOTE
// ===========================================================
function PhaseVote({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  const me = state.players.find((p) => p.id === myId);
  const dead = me?.isEliminated ?? false;
  const alive = state.players.filter((p) => !p.isEliminated);
  const voted = alive.filter((p) => p.hasVoted).length;

  const cast = () => { if (picked) sendAction({ action: "vote", targetId: picked }); };

  return (
    <div>
      <NavBar
        sub={`Manche ${state.round} · vote`}
        title="Qui éliminer ?"
        right={<Timer time={state.timeLeft} color="#FFD23F" />}
      />

      <div style={{ padding: "8px 12px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px dashed rgba(255,255,255,0.12)", marginBottom: 12, fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
        Choisis qui doit sortir. Tu ne peux pas voter pour toi-même.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {alive.map((p) => {
          const isMe = p.id === myId;
          const isPicked = picked === p.id;
          const tally = state.voteTally?.[p.id] ?? 0;
          return (
            <button
              key={p.id}
              disabled={isMe || dead}
              onClick={() => !isMe && setPicked(p.id)}
              style={{
                position: "relative", padding: "14px 12px 12px", borderRadius: 18,
                background: isPicked
                  ? "linear-gradient(160deg, rgba(255,62,165,0.3), rgba(0,0,0,0.4))"
                  : "rgba(255,255,255,0.04)",
                border: isPicked ? "2px solid #FF3EA5" : "1px solid rgba(255,255,255,0.10)",
                boxShadow: isPicked ? "0 16px 36px rgba(255,62,165,0.35)" : "0 4px 10px rgba(0,0,0,0.3)",
                opacity: isMe ? 0.5 : 1,
                cursor: isMe || dead ? "not-allowed" : "pointer",
                color: "white",
              }}
            >
              {isMe && (
                <span style={{ position: "absolute", top: 8, left: 8, padding: "1px 6px", borderRadius: 99, background: "#FFD23F", color: "#1A0E2E", fontSize: 8, fontWeight: 900 }}>
                  TOI
                </span>
              )}
              {tally > 0 && (
                <span style={{ position: "absolute", top: 8, right: 8, padding: "1px 7px", borderRadius: 99, background: "#FF3EA5", color: "white", fontSize: 9, fontWeight: 800 }}>
                  {tally} vote{tally > 1 ? "s" : ""}
                </span>
              )}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                <Avatar id={p.id} name={p.name} size={52} />
              </div>
              <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 16, color: "white", textAlign: "center", marginTop: 8, lineHeight: 1 }}>
                {p.name}
              </div>
              {p.clue && (
                <div style={{ marginTop: 8, padding: "6px 8px", borderRadius: 8, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 10, color: "rgba(255,255,255,0.65)", textAlign: "center", fontStyle: "italic", minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  « {p.clue} »
                </div>
              )}
              {isPicked && (
                <div style={{ marginTop: 8, padding: "5px 0", borderRadius: 8, background: "#FF3EA5", textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 0.4 }}>
                  ✕ ton choix
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
            Participation
          </span>
          <span style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 11, fontWeight: 800 }}>
            {voted} / {alive.length}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${alive.length ? (voted / alive.length) * 100 : 0}%`,
            background: "linear-gradient(90deg, #FF3EA5, #FFD23F)",
            borderRadius: 99, transition: "width .25s",
          }} />
        </div>
      </div>

      <Btn tone="danger" disabled={!picked || dead || me?.hasVoted} onClick={cast}>
        {me?.hasVoted ? "Vote envoyé · attends les autres" : "Confirmer le vote"}
      </Btn>
    </div>
  );
}

// ===========================================================
//  PHASE — VOTE RESULT / ELIMINATION (also round-end)
// ===========================================================
function PhaseEliminate({ state }: { state: UCState }) {
  const elim = state.players.find((p) => p.id === state.eliminatedThisRound);
  const role = elim?.role ?? state.eliminatedRole;
  const color = role ? ROLE_COLOR[role] : "#FFD23F";

  return (
    <div style={{ position: "relative" }}>
      {/* Radial sunburst rays */}
      <div style={{
        position: "absolute", top: 60, left: "50%",
        transform: "translateX(-50%)",
        width: 520, height: 520, maxWidth: "110%",
        background: `conic-gradient(from 0deg,
          transparent 0deg, ${color}26 10deg, transparent 28deg,
          transparent 50deg, ${color}1F 60deg, transparent 80deg,
          transparent 100deg, ${color}26 110deg, transparent 130deg,
          transparent 150deg, ${color}1F 160deg, transparent 180deg,
          transparent 200deg, ${color}26 210deg, transparent 230deg,
          transparent 250deg, ${color}1F 260deg, transparent 280deg,
          transparent 300deg, ${color}26 310deg, transparent 330deg,
          transparent 350deg)`,
        animation: "uc-spin 22s linear infinite",
        opacity: 0.55, pointerEvents: "none",
        borderRadius: "50%",
        maskImage: "radial-gradient(circle, transparent 0%, black 30%, black 70%, transparent 95%)",
      }} />
      <style>{`@keyframes uc-spin { to { transform: translateX(-50%) rotate(360deg); } }`}</style>

      <div style={{ position: "relative", zIndex: 1 }}>
        <NavBar sub={`Verdict · manche ${state.round}`} title={elim ? "Démasqué !" : "Égalité — personne d'éliminé"} right={<Tag color={color}>{role ? ROLE_LABEL[role].toUpperCase() : "—"}</Tag>} />

        {elim ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 20px", position: "relative" }}>
              <div style={{
                position: "absolute", inset: "0 0 0 0", top: -20,
                width: 240, height: 240, margin: "0 auto",
                background: `radial-gradient(circle, ${color}40 0%, transparent 65%)`,
                pointerEvents: "none",
              }} />
              <div style={{ position: "relative" }}>
                <Avatar id={elim.id} name={elim.name} size={120} dead />
              </div>
              <div style={{
                marginTop: -14, transform: "rotate(-10deg)",
                border: `3px solid ${color}`, padding: "5px 16px", borderRadius: 6,
                fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontWeight: 900,
                fontSize: 20, letterSpacing: 3, color, background: "rgba(0,0,0,0.4)",
                textShadow: `0 0 14px ${color}99`,
                boxShadow: `inset 0 0 0 1px ${color}55, 0 8px 24px rgba(0,0,0,0.5)`,
              }}>
                ÉLIMINÉ
              </div>
              <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 32, marginTop: 16, fontWeight: 800 }}>{elim.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                Sorti{elim.eliminatedRound !== null ? ` en manche ${elim.eliminatedRound}` : ""}
              </div>
            </div>

            <FileCard accent={color}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Son mot</div>
                  <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 26, color: color, marginTop: 4, fontWeight: 800 }}>
                    {elim.word ?? "Aucun mot"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Rôle</div>
                  <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 22, color: "white", marginTop: 4, fontWeight: 800 }}>
                    {role ? ROLE_LABEL[role] : "—"}
                  </div>
                </div>
              </div>
            </FileCard>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.6)" }}>
            Pas de majorité — personne ne sort cette manche.
          </div>
        )}

        <div style={{ marginTop: 18, fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
          Préparation de la suite…
        </div>
      </div>
    </div>
  );
}

// ===========================================================
//  PHASE — MR WHITE GUESS
// ===========================================================
function PhaseMrWhiteGuess({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const [text, setText] = useState("");
  const isMe = state.eliminatedThisRound === myId;
  const target = state.players.find((p) => p.id === state.eliminatedThisRound);

  return (
    <div>
      <NavBar sub="Coup du destin" title="Mr. White devine" right={<Timer time={state.timeLeft} color="#FFD23F" />} />

      <div style={{
        padding: 16, borderRadius: 18,
        background: "linear-gradient(160deg, rgba(255,210,63,0.18) 0%, rgba(0,0,0,0.45) 100%)",
        border: "1px solid rgba(255,210,63,0.40)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {target && <Avatar id={target.id} name={target.name} size={56} />}
          <div>
            <div style={{ fontSize: 11, color: "#FFD23F", textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 }}>Mr. White éliminé</div>
            <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 22 }}>{target?.name}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
          {isMe
            ? "Une dernière chance. Tape le mot des civils pour gagner seul."
            : "Mr. White a une seule chance. S'il tape le mot, il vole la victoire."}
        </div>
      </div>

      {isMe && (
        <div style={{ marginTop: 14 }}>
          <div style={{
            display: "flex", gap: 8, padding: 6, borderRadius: 14,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
          }}>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && text.trim() && sendAction({ action: "mrwhite-guess", guess: text.trim() })}
              placeholder="Ton pari…"
              style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 18, padding: "10px 10px", outline: "none", fontWeight: 700, letterSpacing: 0.5 }}
            />
            <Btn tone="gold" full={false} onClick={() => text.trim() && sendAction({ action: "mrwhite-guess", guess: text.trim() })} style={{ padding: "10px 16px" }}>
              Parier
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================
//  PHASE — GAME OVER
// ===========================================================
function PhaseGameOver({ state, onReturnToLobby }: { state: UCState; onReturnToLobby?: () => void }) {
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
    <div style={{ position: "relative" }}>
      {/* Confetti */}
      <Confetti accent={accent} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <NavBar sub={`Fin · ${state.round} manche${state.round > 1 ? "s" : ""}`} title={title} right={<Tag color={accent}>VICTOIRE</Tag>} />

        {/* Cluster spy blobs */}
        <div style={{ position: "relative", height: 200, display: "flex", justifyContent: "center", alignItems: "flex-end", marginBottom: 8 }}>
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: 280, height: 220, transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${accent}40, transparent 70%)`,
            pointerEvents: "none",
          }} />
          {sorted[1] && (
            <div style={{ position: "absolute", left: "22%", bottom: 0, transform: "translateY(6px)" }}>
              <SpyAvatar id={sorted[1].id} name={sorted[1].name} size={70} tilt={-6} mood="happy" arms />
            </div>
          )}
          {sorted[2] && (
            <div style={{ position: "absolute", right: "22%", bottom: 0, transform: "translateY(8px)" }}>
              <SpyAvatar id={sorted[2].id} name={sorted[2].name} size={68} tilt={4} mood="wink" arms />
            </div>
          )}
          {sorted[0] && (
            <div style={{ position: "relative" }}>
              <SpyAvatar id={sorted[0].id} name={sorted[0].name} size={120} tilt={-2} mood="happy" cheering arms crown />
            </div>
          )}
        </div>

        <div style={{
          padding: 14, borderRadius: 16,
          background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.10)",
          display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
        }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>Mot civils</div>
            <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 22, color: "#3DDC97", fontWeight: 800 }}>{state.civilWord}</div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontWeight: 800 }}>vs</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>Mot undercover</div>
            <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 22, color: "#FF3EA5", fontWeight: 800 }}>{state.undercoverWord}</div>
          </div>
        </div>

        <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          Rôles révélés · classement
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {sorted.map((p, i) => {
            const r = p.role ?? "civil";
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 12,
                background: i === 0 ? "rgba(255,210,63,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${i === 0 ? "rgba(255,210,63,0.30)" : "rgba(255,255,255,0.08)"}`,
              }}>
                <span style={{ width: 18, fontFamily: "var(--f-mono, 'JetBrains Mono')", fontWeight: 800, fontSize: 12, color: i === 0 ? "#FFD23F" : "rgba(255,255,255,0.55)" }}>
                  #{i + 1}
                </span>
                <Avatar id={p.id} name={p.name} size={30} dead={p.isEliminated} />
                <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{p.name}</span>
                <span style={{
                  fontSize: 9, padding: "2px 7px", borderRadius: 99,
                  background: `${ROLE_COLOR[r]}26`, color: ROLE_COLOR[r],
                  fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4,
                }}>
                  {ROLE_LABEL[r]}
                </span>
                <span style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontWeight: 800, fontSize: 13 }}>
                  {p.score}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          {onReturnToLobby && (
            <Btn tone="ghost" full={false} style={{ flex: 1 }} onClick={onReturnToLobby}>
              Lobby
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

function Confetti({ accent = "#FFD23F", count = 40 }: { accent?: string; count?: number }) {
  const colors = ["#FF3EA5", "#FFD23F", "#3DDC97", "#4ECDC4", "#7A4EE8", "#FF6B5B", accent];
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 2.6 + Math.random() * 1.8,
    color: colors[i % colors.length],
    rot: Math.floor(Math.random() * 360),
    w: 6 + Math.floor(Math.random() * 6),
  })), [count]);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {pieces.map((p, i) => (
          <span key={i} style={{
            position: "absolute", top: -20,
            left: `${p.left}%`, width: p.w, height: p.w * 1.4,
            background: p.color, borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `uc-confetti ${p.duration}s ${p.delay}s linear infinite`,
            opacity: 0.92,
          }} />
        ))}
      </div>
      <style>{`@keyframes uc-confetti { 0% { transform: translateY(-30px) rotate(0); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 1; } }`}</style>
    </>
  );
}

// ===========================================================
//  Mini-composants
// ===========================================================
function Timer({ time, color }: { time: number; color: string }) {
  const mm = Math.floor(Math.max(0, time) / 60).toString().padStart(2, "0");
  const ss = (Math.max(0, time) % 60).toString().padStart(2, "0");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px", borderRadius: 99,
      background: `${color}22`, border: `1px solid ${color}55`,
      fontFamily: "var(--f-mono, 'JetBrains Mono')", fontWeight: 800,
      fontSize: 11, letterSpacing: 1, color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {mm}:{ss}
    </span>
  );
}
