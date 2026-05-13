import React from "react";
// ===========================================================
// CB Games — Improved game screens
// Bomb Party · Speed/Roast Quiz · Loup-Garou · Motion Tennis
// ===========================================================

// ─────────────────────────────────────────────────────────────
// BOMB PARTY — improved
// Hero: huge syllable, fuse arc, opponents ring, gentle keyboard
// ─────────────────────────────────────────────────────────────
function CBBombPartyScreen({ theme = "dark", danger = 0.7 }) {
  // danger 0..1 drives the fuse + bomb intensity
  const time = Math.max(1, Math.round(8 - danger * 7));
  const opponents = [
    { name: "Léa",    color: "#2B6DE8", lives: 3, angle: -90 },
    { name: "Marwan", color: "#18A957", lives: 2, angle: -25 },
    { name: "Chloé",  color: "#E63CA0", lives: 1, angle:  40 },
    { name: "Yanis",  color: "#6B4FE8", lives: 3, angle: 110 },
    { name: "Inès",   color: "#E89A2B", lives: 3, angle: 180 },
    { name: "Karim",  color: "#00B3A6", lives: 2, angle: 230 },
  ];

  const rad = 130;
  const dashLen = 332;
  const dashOffset = dashLen * (1 - danger);

  return (
    <CBPage theme={theme}>
      {/* Top bar */}
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quitter
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <span className="cb-chip"><span style={{ fontSize: 11 }}>💣</span>BOMB PARTY</span>
          <span className="cb-chip" style={{ background: "var(--color-live)", color: "#fff", borderColor: "transparent" }}>
            <span className="cb-dot" style={{ background: "#fff", width: 5, height: 5 }} />
            T-{time}s
          </span>
        </div>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>3/8</span>
      </div>

      {/* Hero bomb area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {/* Opponents ring */}
        {opponents.map((o, i) => {
          const a = (o.angle * Math.PI) / 180;
          const x = Math.cos(a) * rad;
          const y = Math.sin(a) * rad;
          return (
            <div key={i} style={{
              position: "absolute", left: "50%", top: "50%",
              transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <CBAvatar name={o.name} color={o.color} size={36} />
              <div style={{ display: "flex", gap: 2 }}>
                {[0,1,2].map(k => (
                  <span key={k} style={{
                    width: 6, height: 6, borderRadius: 50,
                    background: k < o.lives ? "var(--color-live)" : "var(--color-hairline)",
                  }} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Center: fuse ring + syllable */}
        <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="220" height="220" viewBox="0 0 120 120" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r="53" fill="none"
                    stroke="var(--color-hairline)" strokeWidth="2"/>
            <circle cx="60" cy="60" r="53" fill="none"
                    stroke={danger > 0.6 ? "var(--color-live)" : "var(--cb-speed)"}
                    strokeWidth="6"
                    strokeDasharray={dashLen}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"/>
          </svg>
          {/* Inner bomb circle */}
          <div style={{
            width: 168, height: 168, borderRadius: "50%",
            background: "radial-gradient(circle at 30% 25%, var(--color-surface-raised), var(--color-surface))",
            border: "1px solid var(--color-hairline)",
            boxShadow: "var(--shadow-lg)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            animation: danger > 0.7 ? "cb-bomb-shake 0.25s infinite" : "none",
            position: "relative",
          }}>
            <span className="cb-eyebrow" style={{ marginBottom: 4, color: "var(--color-ink-muted)" }}>syllabe</span>
            <span className="cb-display-xl" style={{ fontSize: 52, letterSpacing: "-0.04em" }}>TION</span>
            <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)", marginTop: 4 }}>
              ~ 2 380 mots
            </span>
          </div>
        </div>
      </div>

      {/* Letters already used (alphabet hint — original game has this) */}
      <div style={{ padding: "0 16px 8px" }}>
        <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
          alphabet bonus · <span style={{ color: "var(--cb-strategy)" }}>+1 vie</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c, i) => {
            const used = "AETIONRMLP".includes(c);
            return (
              <span key={c} style={{
                width: 20, height: 20, borderRadius: 4,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 10,
                background: used ? "var(--cb-strategy)" : "var(--color-surface-raised)",
                color: used ? "#fff" : "var(--color-ink-subtle)",
                border: "1px solid " + (used ? "transparent" : "var(--color-hairline)"),
              }}>{c}</span>
            );
          })}
        </div>
      </div>

      {/* Input row */}
      <div style={{ padding: "8px 16px 0", display: "flex", gap: 8 }}>
        <div style={{
          flex: 1, height: 52,
          background: "var(--color-surface)",
          border: "2px solid " + (danger > 0.6 ? "var(--color-live)" : "var(--color-ink)"),
          borderRadius: "var(--r-md)",
          padding: "0 16px",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: danger > 0.6 ? "0 0 0 4px rgba(226,52,52,0.18)" : "var(--shadow-sm)",
        }}>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
            letterSpacing: "0.02em", color: "var(--color-ink)",
          }}>atten</span>
          <span style={{
            display: "inline-block", width: 2, height: 22,
            background: "var(--color-ink)", animation: "cb-pulse 1s infinite",
          }} />
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
            color: "var(--color-ink-subtle)",
          }}>__</span>
        </div>
        <button className="cb-btn cb-btn-primary" style={{ minWidth: 64, padding: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </CBPage>
  );
}

// ─────────────────────────────────────────────────────────────
// SPEED QUIZ / ROAST QUIZ — improved
// Big timer, question, 4 answers, then after correct: malus picker
// ─────────────────────────────────────────────────────────────
function CBQuizScreen({ theme = "light", mode = "answering" }) {
  // mode: "answering" | "result" | "roast"
  const answers = [
    { letter: "A", text: "Lyon",     correct: false, picked: false },
    { letter: "B", text: "Marseille",correct: true,  picked: mode !== "answering" },
    { letter: "C", text: "Toulouse", correct: false, picked: false },
    { letter: "D", text: "Nice",     correct: false, picked: false },
  ];

  return (
    <CBPage theme={theme}>
      {/* Top: progress dots + score */}
      <div style={{ padding: "8px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quitter
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{
              width: 18, height: 4, borderRadius: 2,
              background: i < 3 ? "var(--color-success)" :
                          i === 3 ? "var(--cb-trivia)" :
                          "var(--color-hairline)",
            }} />
          ))}
        </div>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
          <span style={{ color: "var(--color-ink)", fontWeight: 700 }}>340</span>
          <span style={{ marginLeft: 4 }}>pts</span>
        </span>
      </div>

      {/* Big timer arc + Q number */}
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 84, height: 84 }}>
          <svg width="84" height="84" viewBox="0 0 84 84" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="42" cy="42" r="38" fill="none" stroke="var(--color-hairline)" strokeWidth="5"/>
            <circle cx="42" cy="42" r="38" fill="none"
                    stroke={mode === "answering" ? "var(--cb-trivia)" : "var(--color-success)"}
                    strokeWidth="5"
                    strokeDasharray="238.7" strokeDashoffset={mode === "answering" ? "75" : "0"}
                    strokeLinecap="round"/>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span className="cb-display-md" style={{ fontSize: 26, lineHeight: 1 }}>
              {mode === "answering" ? "08" : "—"}
            </span>
            <span className="cb-eyebrow" style={{ fontSize: 8, color: "var(--color-ink-muted)" }}>secondes</span>
          </div>
        </div>
        <div className="cb-eyebrow" style={{ marginTop: 12 }}>question 04 / 10 · géo</div>
      </div>

      {/* Question */}
      <div style={{ padding: "12px 24px 16px" }}>
        <h2 className="cb-display-md" style={{ textAlign: "center", textWrap: "balance" }}>
          Quelle est la plus grande ville portuaire de France ?
        </h2>
      </div>

      {/* Answer grid */}
      <div style={{ padding: "0 16px", flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {answers.map((a, i) => {
          let bg = "var(--color-surface)";
          let color = "var(--color-ink)";
          let border = "var(--color-hairline)";
          let badge = null;
          if (mode !== "answering") {
            if (a.correct) {
              bg = "var(--color-success)"; color = "#fff"; border = "transparent";
              badge = "✓";
            } else if (a.picked) {
              bg = "var(--color-live)"; color = "#fff"; border = "transparent";
              badge = "✗";
            } else {
              bg = "var(--color-surface)"; color = "var(--color-ink-subtle)";
            }
          }
          return (
            <button key={i} style={{
              padding: 14, borderRadius: "var(--r-lg)",
              background: bg, color, border: "1px solid " + border,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              minHeight: 88, textAlign: "left",
              transition: "all var(--dur-base) var(--ease-out)",
              position: "relative",
              boxShadow: a.correct && mode !== "answering" ? "var(--shadow-md)" : "var(--shadow-xs)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="cb-display-sm" style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: mode === "answering" ? "var(--color-surface-raised)" : "rgba(255,255,255,0.18)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                }}>{a.letter}</span>
                {badge && <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18 }}>{badge}</span>}
              </div>
              <span className="cb-display-sm" style={{ fontSize: 17 }}>{a.text}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom area depending on mode */}
      {mode === "roast" ? (
        <div style={{ padding: "12px 16px 0" }}>
          <div className="cb-card" style={{
            padding: 14, background: "var(--color-ink)", color: "var(--color-canvas)", borderColor: "transparent",
          }}>
            <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>🔥 inflige un malus</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }} className="cb-scroll">
              {[
                { name: "Flou",    icon: "🌫️", color: "#6B4FE8" },
                { name: "Tremble", icon: "📳", color: "#E63CA0" },
                { name: "Inverse", icon: "🔄", color: "#FF6A3D" },
                { name: "Timer ½", icon: "⏱️", color: "#E23434" },
              ].map((m, i) => (
                <button key={i} style={{
                  flex: "0 0 auto", minWidth: 76,
                  padding: "10px 12px", borderRadius: "var(--r-md)",
                  background: i === 0 ? m.color : "rgba(255,255,255,0.06)",
                  border: "1px solid " + (i === 0 ? "transparent" : "rgba(255,255,255,0.08)"),
                  color: "#fff",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <span className="cb-eyebrow" style={{ color: "#fff", fontSize: 9 }}>{m.name}</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {[
                { name: "Léa", color: "#2B6DE8" },
                { name: "Marwan", color: "#18A957" },
                { name: "Chloé", color: "#E63CA0", target: true },
              ].map((p, i) => (
                <button key={i} style={{
                  flex: 1, padding: 8, borderRadius: "var(--r-sm)",
                  background: p.target ? "var(--cb-brand)" : "rgba(255,255,255,0.06)",
                  border: p.target ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                  color: p.target ? "var(--cb-brand-ink)" : "#fff",
                  display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
                }}>
                  <CBAvatar name={p.name} color={p.color} size={20} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : mode === "result" ? (
        <div style={{ padding: "12px 16px 0" }}>
          <div className="cb-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12,
            background: "var(--color-success)", color: "#fff", borderColor: "transparent" }}>
            <span style={{ fontSize: 28 }}>🎯</span>
            <div style={{ flex: 1 }}>
              <div className="cb-display-sm" style={{ fontSize: 16 }}>Bonne réponse !</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>+100 pts · bonus vitesse +28</div>
            </div>
            <div className="cb-display-md" style={{ fontSize: 22 }}>+128</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{
            display: "flex", gap: 8, alignItems: "center", justifyContent: "center",
            color: "var(--color-ink-muted)", fontSize: 11,
          }}>
            <span className="cb-mono">5 ont déjà répondu</span>
            <span style={{ display: "flex", gap: -4 }}>
              {["#FF6A3D","#2B6DE8","#18A957","#E63CA0","#6B4FE8"].map((c, i) => (
                <span key={i} style={{
                  width: 18, height: 18, borderRadius: 50,
                  background: c, border: "2px solid var(--color-canvas)",
                  marginLeft: i === 0 ? 0 : -8,
                }} />
              ))}
            </span>
          </div>
        </div>
      )}
    </CBPage>
  );
}

// ─────────────────────────────────────────────────────────────
// LOUP-GAROU — improved
// Night: dark canvas, role card, action cards
// Day: bright, voting grid
// ─────────────────────────────────────────────────────────────
function CBLoupGarouScreen({ theme = "dark", phase = "night" }) {
  // phase: "night" | "day"
  const players = [
    { name: "Sofian",  color: "#FF6A3D", alive: true,  vote: 0 },
    { name: "Léa",     color: "#2B6DE8", alive: true,  vote: 2 },
    { name: "Marwan",  color: "#18A957", alive: false, vote: 0, died: true },
    { name: "Chloé",   color: "#E63CA0", alive: true,  vote: 0 },
    { name: "Yanis",   color: "#6B4FE8", alive: true,  vote: 1 },
    { name: "Inès",    color: "#E89A2B", alive: true,  vote: 1 },
    { name: "Karim",   color: "#00B3A6", alive: true,  vote: 0 },
  ];

  if (phase === "night") {
    return (
      <CBPage theme="dark">
        {/* moon glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(60% 50% at 50% 0%, rgba(107,79,232,0.18), transparent 60%)" }} />

        <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
          <span className="cb-chip" style={{ background: "transparent", borderColor: "rgba(255,255,255,0.15)" }}>
            <span style={{ fontSize: 11 }}>🌙</span>
            Nuit 02
          </span>
          <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>loup-garou</div>
          <span className="cb-chip" style={{ background: "transparent", borderColor: "rgba(255,255,255,0.15)" }}>
            7 vivants
          </span>
        </div>

        {/* Role card */}
        <div style={{ padding: "20px 16px 0", position: "relative", zIndex: 1 }}>
          <div className="cb-eyebrow" style={{ marginBottom: 8, color: "rgba(255,255,255,0.4)" }}>ton rôle · secret</div>
          <div style={{
            padding: 20, borderRadius: "var(--r-xl)",
            background: "linear-gradient(135deg, #1A0A2E 0%, #2D1B47 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -10, right: -10, fontSize: 96, opacity: 0.12 }}>🐺</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 38 }}>🐺</span>
              <div>
                <div className="cb-display-md">Loup-Garou</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Camp des loups · 2 dans la partie</div>
              </div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.8)" }}>
              Avec ton acolyte, choisis discrètement un villageois à dévorer cette nuit. Vous gagnez si vous égalez le nombre de villageois.
            </div>
          </div>
        </div>

        {/* Action — choose victim */}
        <div style={{ padding: "16px 16px 0", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>choisis ta victime</span>
            <span className="cb-eyebrow" style={{ color: "var(--cb-social)" }}>action 1/1</span>
          </div>

          <div className="cb-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {players.filter(p => p.alive && p.name !== "Sofian").map((p, i) => (
              <button key={i} style={{
                width: "100%", padding: 10,
                background: i === 0 ? "rgba(226,52,52,0.12)" : "rgba(255,255,255,0.04)",
                border: "1px solid " + (i === 0 ? "var(--cb-social)" : "rgba(255,255,255,0.08)"),
                borderRadius: "var(--r-md)",
                display: "flex", alignItems: "center", gap: 12,
                color: "var(--color-ink)",
              }}>
                <CBAvatar name={p.name} color={p.color} size={36} />
                <span style={{ flex: 1, textAlign: "left", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
                  {p.name}
                </span>
                {i === 0 && (
                  <span className="cb-chip" style={{ background: "var(--cb-social)", color: "#fff", borderColor: "transparent" }}>
                    🩸 cible
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom — confirmation */}
        <div style={{ padding: "12px 16px 0", zIndex: 1 }}>
          <button className="cb-btn" style={{
            width: "100%", background: "var(--cb-social)", color: "#fff",
            boxShadow: "0 8px 24px rgba(226,52,52,0.3)",
          }}>
            Valider la cible
          </button>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 8 }}>
            Marwan, ton acolyte, a déjà voté · attente de tous les loups
          </div>
        </div>
      </CBPage>
    );
  }

  // DAY phase — voting
  return (
    <CBPage theme="light">
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="cb-chip">
          <span style={{ fontSize: 11 }}>☀️</span>
          Jour 03
        </span>
        <div className="cb-eyebrow">phase de vote</div>
        <span className="cb-chip cb-chip-live">0:34</span>
      </div>

      {/* Death banner */}
      <div style={{ padding: "16px 16px 0" }}>
        <div className="cb-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12,
          background: "var(--color-ink)", color: "var(--color-canvas)", borderColor: "transparent" }}>
          <span style={{ fontSize: 30 }}>🪦</span>
          <div style={{ flex: 1 }}>
            <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>cette nuit</div>
            <div className="cb-display-sm">Marwan a été dévoré</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Il était... Voyante</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="cb-eyebrow">vote pour éliminer</span>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>4 / 6 votes</span>
      </div>

      {/* Voting grid */}
      <div className="cb-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 16px",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignContent: "start" }}>
        {players.map((p, i) => (
          <button key={i} className="cb-card" style={{
            padding: 10, opacity: p.alive ? 1 : 0.4,
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: p.name === "Léa" ? "var(--color-ink)" : "var(--color-surface)",
            color: p.name === "Léa" ? "var(--color-canvas)" : "var(--color-ink)",
            borderColor: p.name === "Léa" ? "transparent" : "var(--color-hairline)",
            cursor: p.alive ? "pointer" : "not-allowed",
          }}>
            {p.died && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.04)", fontSize: 24 }}>💀</div>
            )}
            <div style={{ position: "relative" }}>
              <CBAvatar name={p.name} color={p.color} size={44}
                        ring={p.name === "Léa"}/>
              {p.vote > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  background: "var(--cb-social)", color: "#fff",
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 10,
                  width: 18, height: 18, borderRadius: 50,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--color-surface)",
                }}>{p.vote}</span>
              )}
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12,
                            overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
              {p.name}
            </span>
            {p.name === "Léa" && (
              <span style={{ fontSize: 9, opacity: 0.7 }}>ton vote</span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom — confirm */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 8 }}>
        <button className="cb-btn cb-btn-soft" style={{ flex: 1 }}>Passer</button>
        <button className="cb-btn cb-btn-primary" style={{ flex: 2 }}>
          Voter Léa
        </button>
      </div>
    </CBPage>
  );
}

// ─────────────────────────────────────────────────────────────
// MOTION TENNIS CONTROLLER — phone-as-racket
// ─────────────────────────────────────────────────────────────
function CBMotionTennisController({ theme = "dark", state = "ready" }) {
  // state: "calibrating" | "ready" | "swing"
  return (
    <CBPage theme={theme}>
      {/* status bar */}
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="cb-chip" style={{
          background: state === "calibrating" ? "transparent" : "rgba(0,179,166,0.16)",
          color: state === "calibrating" ? "var(--color-ink-muted)" : "var(--cb-sport)",
          borderColor: state === "calibrating" ? "var(--color-hairline)" : "transparent",
        }}>
          <span className="cb-dot" style={{ background: state === "calibrating" ? "var(--color-warning)" : "var(--cb-sport)" }} />
          {state === "calibrating" ? "Calibrage" : "Connecté · RVST"}
        </span>
        <span className="cb-eyebrow">🎾 motion tennis</span>
      </div>

      {/* Score */}
      <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="cb-eyebrow" style={{ color: "var(--color-ink-muted)" }}>toi</div>
          <div className="cb-display-xl" style={{ color: "var(--cb-sport)", fontSize: 56 }}>3</div>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--color-ink-subtle)" }}>—</div>
        <div style={{ textAlign: "center" }}>
          <div className="cb-eyebrow" style={{ color: "var(--color-ink-muted)" }}>bot</div>
          <div className="cb-display-xl" style={{ color: "var(--color-ink-muted)", fontSize: 56 }}>2</div>
        </div>
      </div>

      {/* Big swing zone */}
      <div style={{ flex: 1, padding: "16px 16px 0", display: "flex", flexDirection: "column" }}>
        <div style={{
          flex: 1, borderRadius: "var(--r-2xl)",
          background: state === "calibrating"
            ? "var(--color-surface)"
            : "linear-gradient(160deg, rgba(0,179,166,0.18), rgba(43,109,232,0.12))",
          border: "1px solid " + (state === "calibrating" ? "var(--color-hairline)" : "rgba(0,179,166,0.3)"),
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}>
          {state === "calibrating" && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16, animation: "cb-bomb-shake 1.2s infinite" }}>📱</div>
              <div className="cb-display-md" style={{ marginBottom: 6, textAlign: "center" }}>Calibre ta raquette</div>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", maxWidth: 280, textAlign: "center" }}>
                Tiens ton tel comme une raquette puis fais 3 swings de test.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 32, height: 6, borderRadius: 3,
                    background: i < 1 ? "var(--cb-sport)" : "var(--color-hairline)",
                  }} />
                ))}
              </div>
            </>
          )}

          {state === "ready" && (
            <>
              {/* Court mini-map */}
              <div style={{
                position: "absolute", top: 16, left: 16, right: 16, height: 100,
                borderRadius: "var(--r-md)",
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-hairline)",
                padding: 8, display: "flex", flexDirection: "column",
              }}>
                <div style={{ flex: 1, position: "relative",
                  background: "repeating-linear-gradient(90deg, transparent 0 24px, var(--color-hairline-soft) 24px 25px)",
                  borderRadius: 4 }}>
                  {/* Net */}
                  <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2,
                    background: "var(--color-ink-subtle)", transform: "translateX(-50%)" }} />
                  {/* Players */}
                  <div style={{ position: "absolute", left: "18%", top: "30%",
                    width: 16, height: 16, borderRadius: "50%", background: "var(--cb-sport)",
                    boxShadow: "0 0 0 4px rgba(0,179,166,0.25)" }} />
                  <div style={{ position: "absolute", right: "18%", bottom: "30%",
                    width: 16, height: 16, borderRadius: "50%", background: "var(--color-ink-muted)" }} />
                  {/* Ball */}
                  <div style={{ position: "absolute", left: "44%", top: "55%",
                    width: 8, height: 8, borderRadius: "50%", background: "var(--cb-trivia)",
                    boxShadow: "0 0 12px rgba(232,154,43,0.7)" }} />
                </div>
              </div>

              <div style={{ fontSize: 84, lineHeight: 1, marginTop: 80, marginBottom: 16,
                              filter: "drop-shadow(0 8px 18px rgba(0,179,166,0.4))" }}>🎾</div>
              <div className="cb-display-md" style={{ textAlign: "center", marginBottom: 6 }}>
                Swing maintenant
              </div>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", textAlign: "center", maxWidth: 240 }}>
                Tiens ton tel et frappe vers l'avant. Le timing décide de la direction.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats / last swing */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Dernier swing", value: "Coup droit", color: "var(--cb-sport)" },
            { label: "Puissance",     value: "78%",       color: "var(--cb-trivia)" },
            { label: "Hits",          value: "12 / 14",   color: "var(--color-ink)" },
          ].map((s, i) => (
            <div key={i} className="cb-card" style={{ flex: 1, padding: "8px 10px", textAlign: "center" }}>
              <div className="cb-eyebrow" style={{ fontSize: 8 }}>{s.label}</div>
              <div className="cb-display-sm" style={{ fontSize: 14, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </CBPage>
  );
}

Object.assign(window, {
  CBBombPartyScreen, CBQuizScreen, CBLoupGarouScreen, CBMotionTennisController,
  CBUndercoverScreen,
});

// ─────────────────────────────────────────────────────────────
// UNDERCOVER — round end + relaunch with same players
// Pattern that applies to every game: state resets, players stay.
// ─────────────────────────────────────────────────────────────
function CBUndercoverScreen({ theme = "light" }) {
  const reveals = [
    { name: "Sofian",  color: "#FF6A3D", role: "civil",      word: "Chaussure", out: false },
    { name: "Léa",     color: "#2B6DE8", role: "undercover", word: "Sandale",   out: true,  winner: false },
    { name: "Marwan",  color: "#18A957", role: "civil",      word: "Chaussure", out: false },
    { name: "Chloé",   color: "#E63CA0", role: "mr-white",   word: "—",         out: false, winner: true },
    { name: "Yanis",   color: "#6B4FE8", role: "civil",      word: "Chaussure", out: false },
  ];
  const roleStyle = {
    "civil":      { label: "Civil",      bg: "var(--color-surface-raised)", color: "var(--color-ink)",      ring: "var(--color-hairline)" },
    "undercover": { label: "Undercover", bg: "var(--cb-social)",            color: "#fff",                  ring: "transparent" },
    "mr-white":   { label: "Mr. White",  bg: "var(--color-ink)",            color: "var(--color-canvas)",   ring: "transparent" },
  };

  return (
    <CBPage theme={theme}>
      {/* Top */}
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Lobby
        </button>
        <span className="cb-eyebrow">🕶️ undercover · manche 03</span>
        <span className="cb-chip" style={{ height: 28 }}>
          <span className="cb-dot" style={{ background: "var(--color-success)", width: 6, height: 6 }} />
          5/5
        </span>
      </div>

      {/* Outcome banner */}
      <div style={{ padding: "16px 16px 0" }}>
        <div className="cb-card" style={{
          padding: 18, background: "var(--color-ink)", color: "var(--color-canvas)", borderColor: "transparent",
          position: "relative", overflow: "hidden", textAlign: "center",
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.18,
            background: "radial-gradient(120% 100% at 50% 0%, var(--color-ink-soft), transparent 60%)" }} />
          <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>victoire</div>
          <div className="cb-display-md" style={{ marginTop: 4 }}>Mr. White devine juste</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
            Le mot des civils était <b style={{ color: "#fff" }}>chaussure</b> · Chloé l'a deviné
          </div>
        </div>
      </div>

      {/* Reveals — qui était qui */}
      <div style={{ padding: "16px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="cb-eyebrow">révélations</span>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>5 joueurs</span>
      </div>

      <div className="cb-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 16px",
        display: "flex", flexDirection: "column", gap: 6 }}>
        {reveals.map((p, i) => {
          const r = roleStyle[p.role];
          return (
            <div key={i} className="cb-card" style={{
              padding: 12, display: "flex", alignItems: "center", gap: 12,
              opacity: p.out ? 0.55 : 1,
              border: "1px solid " + (p.winner ? "var(--cb-brand)" : "var(--color-hairline)"),
              boxShadow: p.winner ? "0 0 0 3px var(--cb-brand-tint)" : "var(--shadow-xs)",
            }}>
              <CBAvatar name={p.name} color={p.color} size={40} ring={p.winner} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }}>{p.name}</span>
                  {p.winner && (
                    <span className="cb-chip" style={{
                      height: 16, fontSize: 8, padding: "0 6px",
                      background: "var(--cb-brand)", color: "var(--cb-brand-ink)", borderColor: "transparent",
                    }}>🏆 winner</span>
                  )}
                  {p.out && (
                    <span style={{ fontSize: 9, color: "var(--color-ink-subtle)" }}>· éliminé</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-ink-muted)", marginTop: 2 }}>
                  son mot : <span className="cb-mono" style={{ color: "var(--color-ink)" }}>{p.word}</span>
                </div>
              </div>
              <span className="cb-chip" style={{
                background: r.bg, color: r.color, borderColor: r.ring,
              }}>{r.label}</span>
            </div>
          );
        })}
      </div>

      {/* Sticky rejouer block — pattern universel */}
      <div style={{
        padding: "12px 16px 0",
        borderTop: "1px solid var(--color-hairline)",
        background: "var(--color-canvas)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
          <span style={{ display: "flex" }}>
            {reveals.map((p, i) => (
              <span key={i} style={{
                width: 22, height: 22, borderRadius: 50,
                background: p.color, border: "2px solid var(--color-canvas)",
                marginLeft: i === 0 ? 0 : -8,
              }} />
            ))}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
            Les 5 restent · nouveaux mots à chaque manche
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="cb-btn cb-btn-soft" style={{ flex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Changer
          </button>
          <button className="cb-btn cb-btn-primary" style={{ flex: 2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Rejouer
          </button>
        </div>
      </div>
    </CBPage>
  );
}
