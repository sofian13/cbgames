"use client";

import { useState } from "react";
import type { GameProps } from "@/lib/games/types";
import type { GameMode } from "@/components/games/local-kit";
import { Mascot } from "@/components/Mascot";
import UndercoverOnline from "@/components/games/undercover/undercover-online";
import UndercoverLocal from "@/components/games/undercover/undercover-local";

export default function UndercoverGame(props: GameProps) {
  const [mode, setMode] = useState<GameMode | null>(null);

  if (mode === null) {
    return <UCModeSelect onPick={setMode} onBack={props.onReturnToLobby} />;
  }
  if (mode === "local") {
    return <UndercoverLocal onReturnToLobby={props.onReturnToLobby} />;
  }
  return <UndercoverOnline {...props} />;
}

// ── Écran 01/02 — "Comment vous jouez ?" (fidèle à la maquette) ──
function UCModeSelect({ onPick, onBack }: { onPick: (m: GameMode) => void; onBack?: () => void }) {
  const [sel, setSel] = useState<GameMode>("local");
  const mono: React.CSSProperties = { fontFamily: "var(--font-mono, monospace)", fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" };

  return (
    <div style={{
      minHeight: "100dvh", color: "#fff", position: "relative", overflow: "hidden",
      fontFamily: "var(--font-body, 'DM Sans'), system-ui, sans-serif",
      background: "radial-gradient(120% 70% at 50% 0%, rgba(91,54,214,0.40) 0%, transparent 60%), radial-gradient(120% 60% at 50% 100%, rgba(255,62,165,0.16) 0%, transparent 60%), linear-gradient(180deg, #0A0420 0%, #150834 100%)",
    }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", display: "flex", minHeight: "100dvh", flexDirection: "column", padding: "calc(env(safe-area-inset-top, 0px) + 16px) 16px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          {onBack && (
            <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>‹</button>
          )}
          <div>
            <div style={{ ...mono, color: "#FFD23F" }}>Étape 1/3</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, marginTop: 2 }}>Comment vous jouez ?</div>
          </div>
        </div>

        {/* Local card */}
        <button onClick={() => setSel("local")} style={{
          position: "relative", textAlign: "left", cursor: "pointer", marginBottom: 14,
          borderRadius: 22, padding: "18px 18px 16px", overflow: "hidden",
          background: sel === "local" ? "linear-gradient(160deg, rgba(255,210,63,0.12), rgba(122,78,232,0.10))" : "rgba(255,255,255,0.04)",
          border: sel === "local" ? "1.5px solid #FFD23F" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: sel === "local" ? "0 0 28px rgba(255,210,63,0.25)" : "none",
        }}>
          <div style={{ position: "absolute", top: 14, right: 10, display: "flex" }}>
            {(["pink", "purple", "mint"] as const).map((c, i) => (
              <div key={c} style={{ marginLeft: i === 0 ? 0 : -22 }}>
                <Mascot size={i === 1 ? 48 : 38} color={c} mood={i === 1 ? "wink" : "happy"} bob={false} shadow={false} />
              </div>
            ))}
          </div>
          <div style={{ ...mono, color: "#FFD23F" }}>Recommandé</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, marginTop: 4 }}>Un seul téléphone</div>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 6, maxWidth: "78%" }}>On se passe l&apos;appareil entre nous. Idéal entre amis à la même table.</p>
          <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
            <span>🔌 Hors-ligne</span><span>🤝 3-7 joueurs</span><span>⚡ Setup 30s</span>
          </div>
        </button>

        {/* Online card */}
        <button onClick={() => setSel("online")} style={{
          position: "relative", textAlign: "left", cursor: "pointer",
          borderRadius: 22, padding: "18px", overflow: "hidden",
          background: sel === "online" ? "linear-gradient(160deg, rgba(78,205,196,0.12), rgba(91,54,214,0.10))" : "rgba(255,255,255,0.04)",
          border: sel === "online" ? "1.5px solid #4ECDC4" : "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{ position: "absolute", top: 16, right: 12, display: "flex" }}>
            {(["coral", "sky"] as const).map((c, i) => (
              <div key={c} style={{ marginLeft: i === 0 ? 0 : -18 }}>
                <Mascot size={40} color={c} mood="neutral" bob={false} shadow={false} />
              </div>
            ))}
          </div>
          <div style={{ ...mono, color: "#4ECDC4" }}>En ligne</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, marginTop: 4 }}>Chacun son téléphone</div>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 6, maxWidth: "72%" }}>Salle avec code à partager, sync temps réel, réactions live.</p>
        </button>

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button onClick={() => onPick(sel)} style={{
            width: "100%", padding: "16px", borderRadius: 18, border: "none", cursor: "pointer",
            background: "linear-gradient(180deg, #FFD23F 0%, #C48800 100%)", color: "#1A0E2E",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17,
            boxShadow: "0 14px 30px rgba(255,210,63,0.4)",
          }}>Continuer →</button>
        </div>
      </div>
    </div>
  );
}
