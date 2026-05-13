import React from "react";
// ===========================================================
// CB Games — Le Président (Trou-du-cul)
// 3 écrans : Révélation des rangs · Échange forcé · Partie
// ===========================================================

// ─────────────────────────────────────────────────────────────
// CBPresidentRanking — fin de manche, hiérarchie révélée
// ─────────────────────────────────────────────────────────────
function CBPresidentRanking({ theme = "dark" }) {
  const ranks = [
    { rank: 1, slug: "pres",     name: "Léa",    color: "#2B6DE8", icon: "👑", title: "PRÉSIDENT",       sub: "+ 100 XP · 1er à vider sa main",       accent: "#E3B83A", bg: "linear-gradient(135deg, #4D3E0F 0%, #1F1605 100%)" },
    { rank: 2, slug: "vice-p",   name: "Sofian", color: "#FF6A3D", icon: "⭐", title: "Vice-Président",  sub: "+ 60 XP",                              accent: "#B8B8B8", bg: "rgba(255,255,255,0.04)" },
    { rank: 3, slug: "neutre",   name: "Marwan", color: "#18A957", icon: "◇",  title: "Neutre",          sub: "+ 30 XP",                              accent: "var(--color-ink-muted)", bg: "rgba(255,255,255,0.03)" },
    { rank: 4, slug: "vice-t",   name: "Yanis",  color: "#6B4FE8", icon: "💀", title: "Vice-Trou",       sub: "donne 1 carte au Vice-Président",      accent: "#9C7A52", bg: "rgba(255,255,255,0.02)" },
    { rank: 5, slug: "trou",     name: "Chloé",  color: "#E63CA0", icon: "🚽", title: "Trou-du-cul",     sub: "donne ses 2 meilleures au Président",  accent: "#666", bg: "rgba(0,0,0,0.12)" },
  ];

  return (
    <CBPage theme={theme}>
      {/* Top */}
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quitter
        </button>
        <span className="cb-eyebrow">le président · manche 03</span>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>5/5</span>
      </div>

      {/* Title */}
      <div style={{ padding: "16px 20px 8px", textAlign: "center" }}>
        <div className="cb-eyebrow" style={{ color: "var(--color-ink-muted)" }}>fin de manche</div>
        <div className="cb-display-lg" style={{ marginTop: 4 }}>La hiérarchie</div>
        <div style={{ fontSize: 12, color: "var(--color-ink-muted)", marginTop: 4 }}>
          Échange forcé à la prochaine manche
        </div>
      </div>

      {/* Ranks list */}
      <div className="cb-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 16px",
        display: "flex", flexDirection: "column", gap: 6 }}>
        {ranks.map((r, i) => (
          <div key={r.slug} style={{
            padding: r.rank === 1 ? "16px 14px" : "12px 14px",
            borderRadius: "var(--r-lg)",
            background: r.bg,
            border: "1px solid " + (r.rank === 1 ? r.accent : "rgba(255,255,255,0.06)"),
            boxShadow: r.rank === 1 ? "0 8px 24px rgba(227,184,58,0.25)" : "none",
            display: "flex", alignItems: "center", gap: 12,
            position: "relative", overflow: "hidden",
            opacity: r.rank >= 4 ? 0.86 : 1,
          }}>
            {r.rank === 1 && (
              <div style={{ position: "absolute", top: -20, right: -20, fontSize: 110, opacity: 0.06, pointerEvents: "none" }}>
                👑
              </div>
            )}

            {/* Rank number */}
            <div style={{
              width: 28, fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: r.rank === 1 ? 26 : 20,
              color: r.rank === 1 ? r.accent : "var(--color-ink-muted)",
              textAlign: "center", flexShrink: 0,
            }}>
              {r.rank}
            </div>

            {/* Icon badge */}
            <div style={{
              width: r.rank === 1 ? 56 : 42, height: r.rank === 1 ? 56 : 42, borderRadius: "50%",
              background: r.rank === 1
                ? "radial-gradient(circle at 30% 30%, #FFE082 0%, #E3B83A 50%, #8C6B0F 100%)"
                : "var(--color-surface-raised)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: r.rank === 1 ? 28 : 22, flexShrink: 0,
              boxShadow: r.rank === 1 ? "0 4px 12px rgba(227,184,58,0.4)" : "none",
              filter: r.rank >= 4 ? "grayscale(0.3)" : "none",
            }}>
              {r.icon}
            </div>

            {/* Name + title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CBAvatar name={r.name} color={r.color} size={20} />
                <span style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: r.rank === 1 ? 16 : 14,
                }}>
                  {r.name}
                </span>
              </div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 900,
                fontSize: r.rank === 1 ? 22 : 16, marginTop: 4,
                color: r.rank === 1 ? r.accent : "var(--color-ink)",
                letterSpacing: "-0.02em",
                textTransform: r.rank === 1 ? "uppercase" : "none",
              }}>
                {r.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-ink-muted)", marginTop: 2 }}>
                {r.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      <div style={{ padding: "10px 16px 0", display: "flex", gap: 8 }}>
        <button className="cb-btn cb-btn-soft" style={{ flex: 1 }}>Quitter</button>
        <button className="cb-btn cb-btn-primary" style={{ flex: 2 }}>
          Échange forcé
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </CBPage>
  );
}

// ─────────────────────────────────────────────────────────────
// CBPresidentExchange — entre 2 manches, le Trou donne ses 2 meilleures
// On affiche le POV du Trou-du-cul (la position la plus visuellement intéressante)
// ─────────────────────────────────────────────────────────────
function CBPresidentExchange({ theme = "dark" }) {
  // Le Trou-du-cul (toi) doit donner ses 2 meilleures au Président
  // Tu recevras ses 2 pires
  const myBest = [
    { value: "A", suit: "♠" }, // 2 meilleures (les + fortes)
    { value: "A", suit: "♥" },
  ];
  const presidentWorst = [
    { value: "3", suit: "♣" },
    { value: "4", suit: "♦" },
  ];

  return (
    <CBPage theme={theme}>
      {/* Top */}
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="cb-chip" style={{ background: "rgba(255,255,255,0.04)" }}>
          🚽 ton rang
        </span>
        <span className="cb-eyebrow">échange forcé · 0:18</span>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>m. 04</span>
      </div>

      {/* Hero — tu es Trou-du-cul */}
      <div style={{ padding: "16px 16px 0" }}>
        <div className="cb-card" style={{
          padding: 16, position: "relative", overflow: "hidden",
          background: "var(--color-ink)", color: "var(--color-canvas)", borderColor: "transparent",
        }}>
          <div style={{ position: "absolute", top: -10, right: -10, fontSize: 110, opacity: 0.1 }}>🚽</div>
          <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>tu es</div>
          <div className="cb-display-lg" style={{ marginTop: 4, color: "#fff" }}>Trou-du-cul</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 6, lineHeight: 1.45, maxWidth: 280 }}>
            Tu donnes tes 2 meilleures cartes au Président. Il te rend ses 2 pires en échange.
          </div>
        </div>
      </div>

      {/* Visual exchange */}
      <div style={{ flex: 1, padding: "20px 16px 0", display: "flex", flexDirection: "column" }}>
        {/* You give */}
        <div style={{
          padding: 14, borderRadius: "var(--r-lg)",
          background: "rgba(226,52,52,0.08)",
          border: "1px solid rgba(226,52,52,0.25)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <CBAvatar name="Toi" color="#FF6A3D" size={28} />
            <div style={{ flex: 1 }}>
              <div className="cb-eyebrow" style={{ color: "var(--cb-social)" }}>tu donnes</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14 }}>
                Tes 2 meilleures →
              </div>
            </div>
            <span className="cb-chip" style={{ background: "var(--cb-social)", color: "#fff", borderColor: "transparent" }}>
              forcé
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {myBest.map((c, i) => (
              <div key={i} style={{ transform: `rotate(${(i - 0.5) * 4}deg)` }}>
                <PlayingCard value={c.value} suit={c.suit} size="md" raised
                  style={{ outline: "2px solid var(--cb-social)", outlineOffset: -2,
                            boxShadow: "0 8px 18px rgba(226,52,52,0.4)" }}/>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px 0" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-hairline)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-ink-muted)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M7 17l10-10M7 7l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* President gives */}
        <div style={{
          padding: 14, borderRadius: "var(--r-lg)",
          background: "rgba(227,184,58,0.08)",
          border: "1px solid rgba(227,184,58,0.3)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, #FFE082 0%, #E3B83A 50%, #8C6B0F 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
            }}>👑</div>
            <div style={{ flex: 1 }}>
              <div className="cb-eyebrow" style={{ color: "#E3B83A" }}>léa te donne</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14 }}>
                Ses 2 pires ←
              </div>
            </div>
            <span className="cb-chip" style={{
              background: "rgba(227,184,58,0.18)", color: "#E3B83A", borderColor: "rgba(227,184,58,0.4)",
            }}>
              👑 prés.
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {presidentWorst.map((c, i) => (
              <div key={i} style={{ transform: `rotate(${(i - 0.5) * 4}deg)` }}>
                <PlayingCard value={c.value} suit={c.suit} size="md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "12px 16px 0" }}>
        <button className="cb-btn cb-btn-primary cb-btn-lg" style={{ width: "100%" }}>
          Valider l'échange
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ fontSize: 11, color: "var(--color-ink-muted)", textAlign: "center", marginTop: 8 }}>
          Yanis (Vice-Trou) doit aussi donner 1 carte
        </div>
      </div>
    </CBPage>
  );
}

// ─────────────────────────────────────────────────────────────
// CBPresidentPlaying — partie en cours, combo à battre + ma main
// ─────────────────────────────────────────────────────────────
function CBPresidentPlaying({ theme = "dark" }) {
  // Combo précédent sur le tas : trio de 8
  const lastCombo = [
    { value: "8", suit: "♥" },
    { value: "8", suit: "♦" },
    { value: "8", suit: "♣" },
  ];

  // Joueurs autour : actuel = Marwan (à droite)
  const players = [
    { name: "Léa",    color: "#2B6DE8", cards: 5, played: lastCombo, pos: "left",  current: false },
    { name: "Sofian", color: "#FF6A3D", cards: 7, pos: "top",    current: false, me: false },
    { name: "Marwan", color: "#18A957", cards: 3, pos: "right",  current: true },
    { name: "Yanis",  color: "#6B4FE8", cards: 8, pos: "top-r",  current: false, passed: true },
  ];

  // Ma main (en bas), 9 cartes
  const myHand = [
    { value: "3",  suit: "♣" },
    { value: "5",  suit: "♥" },
    { value: "7",  suit: "♦" },
    { value: "9",  suit: "♠" },
    { value: "9",  suit: "♥" },
    { value: "9",  suit: "♦" },
    { value: "V",  suit: "♣" },
    { value: "D",  suit: "♥" },
    { value: "R",  suit: "♠" },
  ];
  // Tu peux battre le trio de 8 avec ton trio de 9 (indices 3,4,5)
  const groupHint = "Trio de 9 → bat le trio de 8";

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
        <span className="cb-eyebrow">le président · m. 04</span>
        <span className="cb-chip cb-chip-live">0:09</span>
      </div>

      {/* Players bar */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 6 }}>
        {players.map((p, i) => (
          <div key={i} style={{
            flex: 1, padding: "8px 8px",
            borderRadius: "var(--r-md)",
            background: p.current ? "var(--cb-brand)" : "var(--color-surface)",
            color: p.current ? "var(--cb-brand-ink)" : "var(--color-ink)",
            border: "1px solid " + (p.current ? "transparent" : "var(--color-hairline)"),
            opacity: p.passed ? 0.45 : 1,
            position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <CBAvatar name={p.name} color={p.color} size={18} />
              <span style={{ fontSize: 11, fontFamily: "var(--font-display)", fontWeight: 700,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="cb-mono" style={{ fontSize: 10, opacity: p.current ? 0.8 : 0.6 }}>
                {p.cards}🂠
              </span>
              {p.cards <= 3 && !p.passed && (
                <span style={{ fontSize: 8, fontWeight: 800, color: p.current ? "rgba(0,0,0,0.5)" : "var(--color-live)" }}>
                  !
                </span>
              )}
              {p.passed && (
                <span style={{ fontSize: 8, opacity: 0.6 }}>passe</span>
              )}
            </div>
            {p.current && (
              <span style={{
                position: "absolute", top: -4, right: 4,
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 7,
                letterSpacing: "0.12em", color: "var(--cb-brand-ink)",
                background: "var(--cb-brand-ink)", color: "var(--cb-brand)",
                padding: "1px 4px", borderRadius: 999,
              }}>JOUE</span>
            )}
          </div>
        ))}
      </div>

      {/* Felt with last combo */}
      <div style={{
        flex: 1, margin: "12px 16px 0", borderRadius: "var(--r-2xl)",
        background: theme === "dark"
          ? "radial-gradient(120% 80% at 50% 50%, #1B3D2A 0%, #0D2418 100%)"
          : "radial-gradient(120% 80% at 50% 50%, #2D6B49 0%, #1F4B33 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.25)",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none",
          background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)` }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
          background: "rgba(0,0,0,0.35)", padding: "4px 10px 4px 4px", borderRadius: 999,
        }}>
          <CBAvatar name="Léa" color="#2B6DE8" size={22} />
          <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11 }}>
            Léa a posé un trio
          </span>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {lastCombo.map((c, i) => (
            <div key={i} style={{ transform: `rotate(${(i - 1) * 3}deg) translateY(${Math.abs(i - 1) * 2}px)` }}>
              <PlayingCard value={c.value} suit={c.suit} size="md" raised
                style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.45)" }}/>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 16,
          padding: "6px 12px", borderRadius: 999,
          background: "rgba(0,0,0,0.4)",
          fontSize: 10, color: "rgba(255,255,255,0.7)",
          fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          à battre · combo de 3 cartes · 8
        </div>
      </div>

      {/* Hint + actions */}
      <div style={{ padding: "10px 16px 0", display: "flex", gap: 8, alignItems: "center" }}>
        <span className="cb-chip" style={{
          background: "var(--cb-strategy)", color: "#fff", borderColor: "transparent",
          fontSize: 10, padding: "0 10px", height: 26, flexShrink: 0,
        }}>💡 {groupHint}</span>
      </div>

      {/* My hand — fanned, with trio of 9 highlighted */}
      <div style={{ position: "relative", height: 130, padding: "6px 8px 0", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 360, height: 100 }}>
          {myHand.map((c, i) => {
            const total = myHand.length;
            const mid = (total - 1) / 2;
            const offset = (i - mid);
            const rot = offset * 2.5;
            const x = offset * 28;
            const y = Math.abs(offset) * 1.5;
            const playable = i >= 3 && i <= 5; // trio of 9
            return (
              <div key={i} style={{
                position: "absolute", left: "50%", bottom: 0,
                transform: `translateX(${x - 28}px) translateY(${-y - (playable ? 8 : 0)}px) rotate(${rot}deg)`,
                transformOrigin: "center 80px",
                zIndex: playable ? 100 + i : i,
              }}>
                <PlayingCard value={c.value} suit={c.suit} size="md"
                             dim={!playable}
                             raised={playable}
                             style={playable ? {
                               boxShadow: "0 10px 22px rgba(24,169,87,0.4)",
                               outline: "2px solid var(--cb-strategy)", outlineOffset: -2,
                             } : undefined}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      <div style={{ padding: "0 16px 0", display: "flex", gap: 8 }}>
        <button className="cb-btn cb-btn-soft" style={{ flex: 1, height: 48 }}>
          Passer
        </button>
        <button className="cb-btn cb-btn-primary" style={{ flex: 2, height: 48 }}>
          Jouer le trio de 9
        </button>
      </div>
    </CBPage>
  );
}

Object.assign(window, {
  CBPresidentRanking, CBPresidentExchange, CBPresidentPlaying,
});
