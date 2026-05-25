"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/lib/party/use-game";
import { useGameStore } from "@/lib/stores/game-store";
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
const BLOB_COLORS = ["#7A4EE8", "#FF3EA5", "#3DDC97", "#FFD23F", "#FF6B5B", "#4ECDC4", "#A78BFA", "#F472B6"];
const colorOf = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return BLOB_COLORS[Math.abs(h) % BLOB_COLORS.length];
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

function Avatar({ name, id, size = 36, dead = false, ring = false }: { name: string; id: string; size?: number; dead?: boolean; ring?: boolean }) {
  const c = colorOf(id);
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {ring && (
        <div style={{
          position: "absolute", inset: -4, borderRadius: "50%",
          border: "2px solid #FFD23F", animation: "uc-pulse 1.6s ease-out infinite",
        }} />
      )}
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${c}, ${c}99)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: 800, fontSize: size * 0.42,
        boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3)",
        filter: dead ? "grayscale(1) brightness(0.55)" : "none",
        position: "relative",
      }}>
        {initial}
      </div>
      {dead && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "#FF3EA5", fontSize: size * 0.7, fontWeight: 900,
          pointerEvents: "none",
        }}>✕</div>
      )}
      <style>{`@keyframes uc-pulse { 0%{transform:scale(0.95);opacity:0.8;} 100%{transform:scale(1.5);opacity:0;} }`}</style>
    </div>
  );
}

// ===========================================================
//  PHASE — WAITING (configuration par l'hôte avant start)
// ===========================================================
function PhaseWaiting({ state, sendAction, myId }: { state: UCState; sendAction: (a: Record<string, unknown>) => void; myId: string }) {
  const isHost = state.players[0]?.id === myId; // approximation : l'hôte est le 1er
  const cfg = state.config;
  return (
    <div>
      <NavBar sub="Étape · Composition" title="Avant de commencer" right={<Tag color="#FF3EA5">RÔLES</Tag>} />

      <div style={{
        padding: 14, borderRadius: 18,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
      }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 12, lineHeight: 1.5 }}>
          <strong>Civils</strong> reçoivent le même mot. Les <strong style={{ color: "#FF3EA5" }}>Undercover</strong> ont un mot voisin. Si <strong style={{ color: "#FFD23F" }}>Mr. White</strong> est activé, il joue sans mot et tente de deviner s'il est démasqué.
        </div>

        <Row label={`Undercover · ${cfg.undercoverCount}`}>
          <Stepper
            value={cfg.undercoverCount}
            min={1}
            max={3}
            disabled={!isHost}
            onChange={(v) => sendAction({ action: "configure", config: { undercoverCount: v, autoBalance: false } })}
          />
        </Row>
        <Row label="Mr. White">
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
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.45)", textAlign: "center" }}>
        {isHost
          ? "Tu es l'hôte. Lance la partie quand tout le monde est prêt."
          : "En attente du lancement par l'hôte…"}
      </div>

      {isHost && (
        <div style={{ marginTop: 14 }}>
          <Btn
            tone="primary"
            disabled={state.players.length < 3}
            onClick={() => sendAction({ action: "start-game" })}
          >
            🕶️ Distribuer les rôles ({state.players.length}/3+ joueurs)
          </Btn>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <div style={{ fontFamily: "var(--f-mono, 'JetBrains Mono')", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          Salon · {state.players.length} joueur{state.players.length > 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {state.players.map((p) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 10px 6px 6px", borderRadius: 99,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
            }}>
              <Avatar id={p.id} name={p.name} size={24} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
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
    <div>
      <NavBar sub={`Verdict · manche ${state.round}`} title={elim ? "Démasqué !" : "Égalité — personne d'éliminé"} right={<Tag color={color}>{role ? ROLE_LABEL[role].toUpperCase() : "—"}</Tag>} />

      {elim ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0 20px" }}>
            <Avatar id={elim.id} name={elim.name} size={110} dead />
            <div style={{
              marginTop: -10, transform: "rotate(-10deg)",
              border: `3px solid ${color}`, padding: "4px 14px", borderRadius: 6,
              fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontWeight: 900,
              fontSize: 18, letterSpacing: 3, color, background: "rgba(0,0,0,0.2)",
            }}>
              ÉLIMINÉ
            </div>
            <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 28, marginTop: 12 }}>{elim.name}</div>
          </div>

          <div style={{
            padding: 14, borderRadius: 18,
            background: `linear-gradient(160deg, ${color}26, rgba(0,0,0,0.45))`,
            border: `1px solid ${color}55`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Son mot</div>
                <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 24, color: color, marginTop: 2, fontWeight: 800 }}>
                  {elim.word ?? "Aucun mot"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Rôle</div>
                <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 20, color: "white", marginTop: 2 }}>
                  {role ? ROLE_LABEL[role] : "—"}
                </div>
              </div>
            </div>
          </div>
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
    <div>
      <NavBar sub={`Fin · ${state.round} manche${state.round > 1 ? "s" : ""}`} title={title} right={<Tag color={accent}>VICTOIRE</Tag>} />

      <div style={{
        padding: 14, borderRadius: 16,
        background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.10)",
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
      }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>Mot civils</div>
          <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 20, color: "#3DDC97" }}>{state.civilWord}</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontWeight: 800 }}>vs</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>Mot undercover</div>
          <div style={{ fontFamily: "var(--f-display, 'Bricolage Grotesque')", fontSize: 20, color: "#FF3EA5" }}>{state.undercoverWord}</div>
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
