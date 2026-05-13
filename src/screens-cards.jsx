// ===========================================================
// CB Games — Jeux de cartes : La Contrée (Belote) + 8 Américain
// ===========================================================

// ─────────────────────────────────────────────────────────────
// PlayingCard — vraies cartes 32/52 (SVG illustrés Younes Touati)
// Notation FR : 1 (= As), 7, 8, 9, 10, V, D, R — pip patterns réels
// ─────────────────────────────────────────────────────────────
const CARD_RANK_FILE = { "1": 1, "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
                         "8": 8, "9": 9, "10": 10, "V": 11, "D": 12, "R": 13 };
const FACE_CARD_SUIT = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };

function PlayingCard({ value, suit, size = "md", faceDown = false, dim = false, raised = false, style }) {
  const isRed = suit === "♥" || suit === "♦";
  const sizes = {
    xs: { w: 32, h: 46, fs: 8,  pad: 3 },
    sm: { w: 44, h: 62, fs: 10, pad: 4 },
    md: { w: 56, h: 80, fs: 12, pad: 4 },
    lg: { w: 78, h: 110, fs: 15, pad: 5 },
    xl: { w: 98, h: 140, fs: 18, pad: 6 },
  };
  const s = sizes[size];
  const ink = isRed ? "#E23434" : "#0A0A0A";

  if (faceDown) {
    return (
      <div style={{
        width: s.w, height: s.h, borderRadius: 7, flexShrink: 0,
        background: "linear-gradient(135deg, #1F2A55 0%, #0C1330 100%)",
        boxShadow: raised ? "0 6px 14px rgba(0,0,0,0.25)" : "0 2px 6px rgba(0,0,0,0.18)",
        border: "1px solid rgba(0,0,0,0.2)",
        position: "relative", overflow: "hidden",
        opacity: dim ? 0.35 : 1, ...style,
      }}>
        <div style={{
          position: "absolute", inset: 4, borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.14)",
          background: `
            repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 6px),
            repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 6px)`,
        }}/>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: s.w * 0.4, letterSpacing: "-0.05em",
        }}>cb</div>
      </div>
    );
  }

  const rankNum = CARD_RANK_FILE[value];
  const suitFile = FACE_CARD_SUIT[suit];
  const svgPath = rankNum && suitFile ? `cards/${rankNum}${suitFile}.svg` : null;

  // Tighter corner index — smaller font, less padding from edge — so it doesn't
  // overlap with the SVG art (which has its own pip arrangement coming in from
  // its top-left corner).
  const cornerStyle = {
    fontFamily: "var(--font-display)", fontWeight: 900, fontSize: s.fs,
    color: ink, display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 0.95,
    zIndex: 2,
  };

  return (
    <div style={{
      width: s.w, height: s.h, borderRadius: 7, flexShrink: 0,
      background: "#FAFAF9",
      boxShadow: raised ? "0 6px 14px rgba(0,0,0,0.18)" : "0 2px 6px rgba(0,0,0,0.14)",
      border: "1px solid rgba(0,0,0,0.08)",
      position: "relative", overflow: "hidden",
      opacity: dim ? 0.4 : 1,
      ...style,
    }}>
      {/* Real SVG art (pips for number cards, court figure for V/D/R) */}
      {svgPath && (
        <img
          src={svgPath}
          alt=""
          style={{
            position: "absolute",
            // Leave more space on the left/top so our corner index doesn't
            // overlap with the first SVG pip.
            top: "14%", left: "16%", width: "68%", height: "72%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Top-left index (FR notation : A/V/D/R + ♠♥♦♣) */}
      <div style={{ position: "absolute", top: s.pad, left: s.pad, ...cornerStyle }}>
        <span>{value}</span>
        <span style={{ fontSize: s.fs * 0.85 }}>{suit}</span>
      </div>
      {/* Bottom-right index (rotated) */}
      <div style={{ position: "absolute", bottom: s.pad, right: s.pad, transform: "rotate(180deg)", ...cornerStyle }}>
        <span>{value}</span>
        <span style={{ fontSize: s.fs * 0.85 }}>{suit}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LA CONTRÉE (Belote 4 joueurs, 2v2) — vue partie en cours
// Affiche : contrat, plis gagnés, partenaire/adversaires, pli en cours, ma main
// ─────────────────────────────────────────────────────────────
function CBContreeScreen({ theme = "dark" }) {
  // 4 joueurs : moi (bas) + partenaire (haut) vs 2 adversaires (G/D)
  const partner   = { name: "Marwan",  color: "#18A957", cards: 6 };
  const opponentL = { name: "Léa",     color: "#2B6DE8", cards: 6 };
  const opponentR = { name: "Chloé",   color: "#E63CA0", cards: 5 };

  // Pli en cours (chacun a posé une carte sauf moi, c'est mon tour)
  const trick = [
    { player: "L", value: "10", suit: "♦", color: "#2B6DE8" }, // Léa a entamé
    { player: "P", value: "V",  suit: "♥", color: "#18A957" }, // Marwan a coupé à l'atout
    { player: "R", value: "A",  suit: "♦", color: "#E63CA0" }, // Chloé a surcoupé en posant une plus haute? Non, As de carreau
  ];

  // Ma main : 6 cartes — j'ai R♥ + D♥ = belote/rebelote prête (+20 pts)
  const myHand = [
    { value: "7",  suit: "♠" },
    { value: "R",  suit: "♥" }, // atout — belote
    { value: "D",  suit: "♥" }, // atout — rebelote
    { value: "8",  suit: "♣" },
    { value: "R",  suit: "♣" },
    { value: "A",  suit: "♠" },
  ];
  // Cartes jouables (à l'atout pour gagner le pli)
  const playable = [false, true, true, false, false, false];

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
        <span className="cb-eyebrow">la contrée · main 04</span>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>2/2</span>
      </div>

      {/* Contract & score */}
      <div style={{ padding: "10px 16px 0", display: "flex", gap: 8 }}>
        <div className="cb-card" style={{ flex: 1, padding: "8px 12px",
          background: "var(--color-ink)", color: "var(--color-canvas)", borderColor: "transparent" }}>
          <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>contrat · ton équipe</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
            <span className="cb-display-md" style={{ fontSize: 18 }}>120</span>
            <span style={{ color: "#E23434", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>♥</span>
            <span style={{ fontSize: 9, color: "var(--cb-brand)", fontFamily: "var(--font-display)", fontWeight: 700,
                            marginLeft: 4, letterSpacing: "0.08em" }}>COINCHÉ ×2</span>
          </div>
        </div>
        <div className="cb-card" style={{ flex: 1, padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
          <div>
            <div className="cb-eyebrow">nous</div>
            <div className="cb-display-md" style={{ fontSize: 18, color: "var(--cb-strategy)" }}>62</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="cb-eyebrow">eux</div>
            <div className="cb-display-md" style={{ fontSize: 18, color: "var(--color-ink-muted)" }}>34</div>
          </div>
        </div>
      </div>

      {/* Belote indicator — tu as R+D d'atout */}
      <div style={{ padding: "6px 16px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px",
          background: "rgba(24,169,87,0.12)",
          border: "1px solid rgba(24,169,87,0.3)",
          borderRadius: "var(--r-md)",
          fontSize: 11,
        }}>
          <span style={{ fontSize: 14 }}>♥</span>
          <span style={{ flex: 1, color: "var(--cb-strategy)", fontFamily: "var(--font-display)",
                          fontWeight: 700, letterSpacing: "0.04em" }}>
            BELOTE-REBELOTE en main
          </span>
          <span className="cb-mono" style={{ fontSize: 10, color: "var(--cb-strategy)", fontWeight: 700 }}>
            +20 pts
          </span>
          <span style={{ display: "flex", gap: 2 }}>
            <span style={{ width: 4, height: 4, borderRadius: 50, background: "var(--cb-strategy)" }} />
            <span style={{ width: 4, height: 4, borderRadius: 50, background: "var(--cb-strategy)", opacity: 0.4 }} />
          </span>
        </div>
      </div>

      {/* Felt table — partner top, opponents L/R, center trick */}
      <div style={{
        margin: "12px 16px 0", flex: 1,
        borderRadius: "var(--r-2xl)",
        background: theme === "dark"
          ? "radial-gradient(120% 80% at 50% 50%, #1B3D2A 0%, #0D2418 100%)"
          : "radial-gradient(120% 80% at 50% 50%, #2D6B49 0%, #1F4B33 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.25)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Felt texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none",
          background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)`,
        }} />

        {/* Partner (top) */}
        <div style={{ position: "absolute", top: 8, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ display: "flex" }}>
            {Array.from({ length: partner.cards }).map((_, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? 0 : -28 }}>
                <PlayingCard faceDown size="xs" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2,
                          background: "rgba(0,0,0,0.35)", padding: "3px 8px 3px 3px", borderRadius: 999 }}>
            <CBAvatar name={partner.name} color={partner.color} size={22} />
            <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11 }}>{partner.name}</span>
            <span style={{ color: "var(--cb-strategy)", fontSize: 10, fontWeight: 700 }}>· partenaire</span>
          </div>
        </div>

        {/* Opponent left */}
        <div style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%) rotate(90deg)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ display: "flex" }}>
            {Array.from({ length: opponentL.cards }).map((_, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? 0 : -28 }}>
                <PlayingCard faceDown size="xs" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6,
                          background: "rgba(0,0,0,0.35)", padding: "3px 8px 3px 3px", borderRadius: 999 }}>
            <CBAvatar name={opponentL.name} color={opponentL.color} size={20} />
            <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11 }}>{opponentL.name}</span>
          </div>
        </div>

        {/* Opponent right */}
        <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%) rotate(-90deg)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ display: "flex" }}>
            {Array.from({ length: opponentR.cards }).map((_, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? 0 : -28 }}>
                <PlayingCard faceDown size="xs" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6,
                          background: "rgba(0,0,0,0.35)", padding: "3px 8px 3px 3px", borderRadius: 999 }}>
            <CBAvatar name={opponentR.name} color={opponentR.color} size={20} />
            <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11 }}>{opponentR.name}</span>
          </div>
        </div>

        {/* Center — current trick (cross layout) */}
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                        width: 150, height: 150 }}>
          {/* Léa (left of cross) */}
          <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%) rotate(8deg)" }}>
            <PlayingCard value={trick[0].value} suit={trick[0].suit} size="sm"
                         style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}/>
          </div>
          {/* Partner (top) */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%) rotate(-4deg)" }}>
            <PlayingCard value={trick[1].value} suit={trick[1].suit} size="sm" raised
                         style={{ boxShadow: "0 6px 16px rgba(24,169,87,0.4)",
                                   outline: "2px solid var(--cb-strategy)", outlineOffset: -2 }}/>
          </div>
          {/* Chloé (right) */}
          <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%) rotate(-8deg)" }}>
            <PlayingCard value={trick[2].value} suit={trick[2].suit} size="sm"
                         style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}/>
          </div>
          {/* My slot (bottom, empty, with hint) */}
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: 44, height: 62, borderRadius: 7,
            border: "2px dashed rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em" }}>
              TON TOUR
            </span>
          </div>
        </div>

        {/* Pli won badges */}
        <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="cb-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>plis nous</span>
          <div style={{ display: "flex", gap: 3 }}>
            {[1,2,3,4].map(i => (
              <span key={i} style={{ width: 8, height: 11, borderRadius: 1.5,
                background: i <= 3 ? "var(--cb-strategy)" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 14, display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
          <span className="cb-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>plis eux</span>
          <div style={{ display: "flex", gap: 3 }}>
            {[1,2,3,4].map(i => (
              <span key={i} style={{ width: 8, height: 11, borderRadius: 1.5,
                background: i <= 1 ? "var(--color-live)" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* My hand — fanned */}
      <div style={{ position: "relative", height: 130, padding: "8px 8px 0", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 320, height: 100 }}>
          {myHand.map((c, i) => {
            const total = myHand.length;
            const mid = (total - 1) / 2;
            const offset = (i - mid);
            const rot = offset * 4;
            const x = offset * 38;
            const y = Math.abs(offset) * 3;
            return (
              <div key={i} style={{
                position: "absolute", left: "50%", bottom: 0,
                transform: `translateX(${x - 28}px) translateY(${-y}px) rotate(${rot}deg)`,
                transformOrigin: "center 80px",
                transition: "transform 0.2s var(--ease-out)",
                zIndex: i,
              }}>
                <PlayingCard value={c.value} suit={c.suit} size="md"
                             dim={!playable[i]}
                             raised={playable[i]}
                             style={playable[i] ? {
                               boxShadow: "0 8px 18px rgba(24,169,87,0.4)",
                               outline: "2px solid var(--cb-strategy)", outlineOffset: -2,
                             } : undefined}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom helper */}
      <div style={{ padding: "0 16px", textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
          Tu dois <b style={{ color: "var(--cb-strategy)" }}>fournir de l'atout ♥</b> · 2 cartes jouables
        </span>
      </div>
    </CBPage>
  );
}

// ─────────────────────────────────────────────────────────────
// 8 AMÉRICAIN — Crazy Eights / Pouilleux
// Affiche : adversaires en haut, pioche + défausse au centre, ma main en bas
// État : 8 vient d'être joué → picker de couleur
// ─────────────────────────────────────────────────────────────
function CB8AmericainScreen({ theme = "light", state = "playing" }) {
  // state: "playing" | "pick-suit"
  const opponents = [
    { name: "Léa",     color: "#2B6DE8", cards: 4, current: false },
    { name: "Marwan",  color: "#18A957", cards: 7, current: false },
    { name: "Chloé",   color: "#E63CA0", cards: 2, current: true, lastPlayed: { value: "8", suit: "♣" } }, // joueuse en cours
  ];

  // Défausse — dernière carte visible : 8 ♣ (active), au-dessus du tas
  const discardTop = { value: "8", suit: "♣" };
  const askedSuit  = "♥"; // si elle a déjà choisi (pour version playing)

  // Ma main
  const myHand = [
    { value: "7",  suit: "♥" },
    { value: "V",  suit: "♥" },
    { value: "9",  suit: "♦" },
    { value: "D",  suit: "♣" }, // Dame de trèfle — +3 spéciale
    { value: "10", suit: "♠" },
    { value: "A",  suit: "♥" },
    { value: "8",  suit: "♦" },
  ];
  // After Chloé played 8♣ and asked ♥ : playable = cartes ♥ ou 8
  const playable = [true, true, false, false, false, true, true];

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
        <span className="cb-eyebrow">8 américain · partie 02</span>
        <span className="cb-chip" style={{ height: 28 }}>
          <span className="cb-dot" style={{ background: "var(--color-success)", width: 6, height: 6 }} />
          4/4
        </span>
      </div>

      {/* Opponents row */}
      <div style={{ padding: "14px 16px 0", display: "flex", gap: 8, justifyContent: "space-between" }}>
        {opponents.map((o, i) => (
          <div key={i} className="cb-card" style={{
            flex: 1, padding: "8px 10px", position: "relative",
            background: o.current ? "var(--color-ink)" : "var(--color-surface)",
            color: o.current ? "var(--color-canvas)" : "var(--color-ink)",
            borderColor: o.current ? "transparent" : "var(--color-hairline)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <CBAvatar name={o.name} color={o.color} size={22} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.name}
              </span>
              {o.cards === 2 && (
                <span style={{
                  marginLeft: "auto",
                  background: "var(--color-live)", color: "#fff",
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 8,
                  padding: "1px 4px", borderRadius: 3, letterSpacing: "0.1em",
                }}>!</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 1 }}>
              {Array.from({ length: o.cards }).slice(0, 5).map((_, k) => (
                <span key={k} style={{
                  width: 10, height: 14, borderRadius: 1.5,
                  background: o.current ? "rgba(255,255,255,0.2)" : "linear-gradient(135deg, #1F2A55, #0C1330)",
                  border: "1px solid " + (o.current ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
                }} />
              ))}
              {o.cards > 5 && (
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 9,
                  color: o.current ? "rgba(255,255,255,0.6)" : "var(--color-ink-muted)",
                  alignSelf: "center", marginLeft: 4,
                }}>+{o.cards - 5}</span>
              )}
            </div>
            {o.current && (
              <div style={{
                position: "absolute", top: -6, right: -6,
                background: "var(--cb-brand)", color: "var(--cb-brand-ink)",
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 8,
                padding: "2px 6px", borderRadius: 999, letterSpacing: "0.1em",
              }}>EN COURS</div>
            )}
          </div>
        ))}
      </div>

      {/* Center — felt + piles */}
      <div style={{ flex: 1, margin: "16px 16px 0", borderRadius: "var(--r-2xl)",
        background: theme === "dark"
          ? "radial-gradient(120% 80% at 50% 50%, #2A1F4D 0%, #14102A 100%)"
          : "radial-gradient(120% 80% at 50% 50%, #4A3A8A 0%, #2E2566 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.25)",
      }}>
        {/* Felt texture */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none",
          background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)` }} />

        {/* Draw pile */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", width: 60, height: 84 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                position: "absolute", left: i * 1, top: -i * 1,
                transform: `rotate(${i * 0.6}deg)`,
              }}>
                <PlayingCard faceDown size="md" />
              </div>
            ))}
          </div>
          <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-display)",
                          fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>
            PIOCHE · 18
          </span>
        </div>

        {/* Discard pile + asked suit */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", width: 60, height: 84 }}>
            {/* Some randomly rotated dimmer cards underneath */}
            <div style={{ position: "absolute", inset: 0, transform: "rotate(-10deg)", opacity: 0.5 }}>
              <PlayingCard value="V" suit="♦" size="md" />
            </div>
            <div style={{ position: "absolute", inset: 0, transform: "rotate(5deg)", opacity: 0.7 }}>
              <PlayingCard value="10" suit="♦" size="md" />
            </div>
            {/* Top: 8 ♣ */}
            <div style={{ position: "absolute", inset: 0 }}>
              <PlayingCard value={discardTop.value} suit={discardTop.suit} size="md" raised
                           style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.45)" }}/>
            </div>
            {/* Asked suit chip */}
            <div style={{
              position: "absolute", top: -8, right: -14,
              width: 32, height: 32, borderRadius: 999,
              background: "var(--cb-brand)", color: "var(--cb-brand-ink)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 900,
              boxShadow: "0 4px 10px rgba(255,106,61,0.45)",
              border: "2px solid #fff",
            }}>
              <span style={{ color: "#E23434" }}>{askedSuit}</span>
            </div>
          </div>
          <span style={{ color: "#fff", fontFamily: "var(--font-display)",
                          fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>
            CHLOÉ A DEMANDÉ <span style={{ color: "var(--cb-brand)" }}>CŒUR</span>
          </span>
        </div>
      </div>

      {/* My turn banner */}
      <div style={{ padding: "10px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="cb-chip cb-chip-solid" style={{ background: "var(--cb-brand)", color: "var(--cb-brand-ink)" }}>
            <span className="cb-dot" style={{ background: "var(--cb-brand-ink)" }} />
            Ton tour
          </span>
          <span style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
            3 cartes jouables
          </span>
        </div>
        <button className="cb-chip" style={{ height: 26 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Piocher
        </button>
      </div>

      {/* My hand fanned */}
      <div style={{ position: "relative", height: 130, padding: "6px 8px 0", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 340, height: 100 }}>
          {myHand.map((c, i) => {
            const total = myHand.length;
            const mid = (total - 1) / 2;
            const offset = (i - mid);
            const rot = offset * 3.5;
            const x = offset * 34;
            const y = Math.abs(offset) * 2;
            return (
              <div key={i} style={{
                position: "absolute", left: "50%", bottom: 0,
                transform: `translateX(${x - 28}px) translateY(${-y}px) rotate(${rot}deg)`,
                transformOrigin: "center 80px",
                zIndex: i,
              }}>
                <PlayingCard value={c.value} suit={c.suit} size="md"
                             dim={!playable[i]}
                             raised={playable[i]}
                             style={playable[i] ? {
                               boxShadow: "0 8px 18px rgba(255,106,61,0.4)",
                               outline: "2px solid var(--cb-brand)", outlineOffset: -2,
                             } : undefined}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* If 8 just played → suit picker overlay */}
      {state === "pick-suit" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div className="cb-card" style={{ padding: 20, width: "85%", maxWidth: 320, textAlign: "center" }}>
            <div className="cb-eyebrow" style={{ marginBottom: 8 }}>8 joué · choisis la couleur</div>
            <div className="cb-display-md" style={{ marginBottom: 16 }}>Tout le monde va devoir suivre</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { s: "♥", n: "Cœur", red: true },
                { s: "♦", n: "Carreau", red: true },
                { s: "♠", n: "Pique", red: false },
                { s: "♣", n: "Trèfle", red: false },
              ].map(o => (
                <button key={o.s} className="cb-card" style={{
                  padding: "14px 8px", textAlign: "center",
                  fontFamily: "var(--font-display)", fontWeight: 800,
                }}>
                  <div style={{ fontSize: 36, color: o.red ? "#E23434" : "#0A0A0A", lineHeight: 1, marginBottom: 4 }}>{o.s}</div>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>{o.n}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </CBPage>
  );
}

Object.assign(window, {
  PlayingCard, CBContreeScreen, CB8AmericainScreen, CBContreeBiddingScreen,
  CB8AmericainRulesScreen, CBContreeSetupScreen,
});

// ─────────────────────────────────────────────────────────────
// LA CONTRÉE · Setup — cible de points + options de règles
// ─────────────────────────────────────────────────────────────
function CBContreeSetupScreen({ theme = "light" }) {
  const [target, setTarget] = React.useState(1000);
  const [coinche, setCoinche] = React.useState(true);
  const [belote,  setBelote]  = React.useState(true);
  const [annonces, setAnnonces] = React.useState(false);

  const targets = [
    { v: 501,  label: "501",  sub: "partie rapide" },
    { v: 751,  label: "751",  sub: "tour de table" },
    { v: 1000, label: "1000", sub: "soirée classique" },
    { v: 1501, label: "1501", sub: "marathon" },
  ];

  const Toggle = ({ value, on }) => (
    <span style={{
      width: 38, height: 22, borderRadius: 999,
      background: value ? "var(--color-ink)" : "var(--color-surface-raised)",
      border: "1px solid " + (value ? "transparent" : "var(--color-hairline)"),
      position: "relative", flexShrink: 0,
      transition: "background var(--dur-base) var(--ease-out)",
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: 50,
        background: "var(--color-surface)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        transition: "left var(--dur-base) var(--ease-out)",
      }} />
    </span>
  );

  const teamA = [
    { name: "Sofian", color: "#FF6A3D" },
    { name: "Marwan", color: "#18A957" },
  ];
  const teamB = [
    { name: "Léa",   color: "#2B6DE8" },
    { name: "Chloé", color: "#E63CA0" },
  ];

  return (
    <CBPage theme={theme}>
      {/* Top bar */}
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Lobby
        </button>
        <span className="cb-eyebrow">la contrée · réglages</span>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>2v2</span>
      </div>

      {/* Teams hero */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
          {[
            { team: teamA, label: "Équipe A", color: "var(--cb-strategy)" },
            { team: teamB, label: "Équipe B", color: "var(--color-live)" },
          ].map((t, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>
                  <span className="cb-display-md" style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>vs</span>
                </div>
              )}
              <div className="cb-card" style={{
                flex: 1, padding: 10, position: "relative", overflow: "hidden",
                borderLeft: "3px solid " + t.color,
              }}>
                <div className="cb-eyebrow" style={{ fontSize: 9 }}>{t.label}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {t.team.map((p, k) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <CBAvatar name={p.name} color={p.color} size={26} />
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12 }}>
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Target points — big visual choice */}
      <div style={{ padding: "16px 16px 8px" }}>
        <div className="cb-eyebrow" style={{ marginBottom: 8 }}>1. partie en combien de points ?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {targets.map(t => {
            const active = target === t.v;
            return (
              <button key={t.v} onClick={() => setTarget(t.v)} style={{
                padding: 12,
                borderRadius: "var(--r-md)",
                background: active ? "var(--color-ink)" : "var(--color-surface)",
                color: active ? "var(--color-canvas)" : "var(--color-ink)",
                border: "1px solid " + (active ? "transparent" : "var(--color-hairline)"),
                boxShadow: active ? "var(--shadow-md)" : "var(--shadow-xs)",
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                textAlign: "left",
                position: "relative",
              }}>
                <span className="cb-display-md" style={{ fontSize: 26 }}>{t.label}</span>
                <span style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.6)" : "var(--color-ink-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  {t.sub}
                </span>
                {active && (
                  <span style={{ position: "absolute", top: 8, right: 8,
                    color: "var(--cb-brand)", fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 900 }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div style={{ padding: "8px 16px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="cb-eyebrow" style={{ marginBottom: 8 }}>2. règles maison</div>
        <div className="cb-card" style={{ padding: 0, overflow: "hidden" }}>
          {[
            { v: coinche,  set: setCoinche,  label: "Coinche / Surcoinche", sub: "Doubler la mise sur l'adversaire" },
            { v: belote,   set: setBelote,   label: "Belote-Rebelote",      sub: "R+D d'atout = +20 pts" },
            { v: annonces, set: setAnnonces, label: "Annonces (mode Coinche)", sub: "Tierce, cinquante, cent, carré" },
          ].map((opt, i) => (
            <button key={i} onClick={() => opt.set(!opt.v)} style={{
              width: "100%", padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 12,
              borderBottom: i < 2 ? "1px solid var(--color-hairline-soft)" : "none",
              textAlign: "left",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-ink-muted)", marginTop: 2 }}>
                  {opt.sub}
                </div>
              </div>
              <Toggle value={opt.v} />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ fontSize: 11, color: "var(--color-ink-muted)", textAlign: "center", marginBottom: 8 }}>
          <span className="cb-mono">~ {Math.ceil(target / 110)} mains</span> · estimé 25-40 min
        </div>
        <button className="cb-btn cb-btn-primary cb-btn-lg" style={{ width: "100%" }}>
          Lancer la partie
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </CBPage>
  );
}

// ─────────────────────────────────────────────────────────────
// LA CONTRÉE — Phase d'enchères
// Choisis le montant (80→160 par 10) puis Capot (250) ou Générale (500)
// + couleur d'atout (♥♦♣♠) ou Sans Atout / Tout Atout
// ─────────────────────────────────────────────────────────────
function CBContreeBiddingScreen({ theme = "light" }) {
  const [amount, setAmount] = React.useState(110);
  const [trump, setTrump]   = React.useState("♥");
  // Adversaire vient d'annoncer 100 ♣ — c'est mon tour
  const lastBid = { player: "Léa", color: "#2B6DE8", amount: 100, suit: "♣" };

  const amounts = [80, 90, 100, 110, 120, 130, 140, 150, 160];
  const specials = [
    { label: "Capot",    value: "capot",    pts: 250, color: "var(--cb-cards)" },
    { label: "Générale", value: "generale", pts: 500, color: "var(--cb-brand)" },
  ];
  const suits = [
    { s: "♥", n: "Cœur",    red: true,  bg: "#FFE5E5" },
    { s: "♦", n: "Carreau", red: true,  bg: "#FFE5E5" },
    { s: "♠", n: "Pique",   red: false, bg: "#E8E8E6" },
    { s: "♣", n: "Trèfle",  red: false, bg: "#E8E8E6" },
    { s: "SA",n: "Sans At.",red: false, bg: "#FFF6E0", small: true },
    { s: "TA",n: "Tout At.",red: false, bg: "#E8F4FF", small: true },
  ];
  const valid = amount > lastBid.amount;

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
        <span className="cb-eyebrow">la contrée · enchères</span>
        <span className="cb-chip cb-chip-live">0:18</span>
      </div>

      {/* Last bid */}
      <div style={{ padding: "16px 16px 0" }}>
        <div className="cb-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12,
                                            background: "var(--color-surface-raised)" }}>
          <CBAvatar name={lastBid.player} color={lastBid.color} size={40} />
          <div style={{ flex: 1 }}>
            <div className="cb-eyebrow">dernière enchère</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
              <span className="cb-display-md" style={{ fontSize: 24 }}>{lastBid.player}</span>
              <span style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>adversaire</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="cb-display-md" style={{ fontSize: 28 }}>{lastBid.amount}</div>
            <span style={{ fontSize: 22, color: lastBid.suit === "♥" || lastBid.suit === "♦" ? "#E23434" : "#0A0A0A",
                            fontFamily: "var(--font-display)", fontWeight: 900 }}>{lastBid.suit}</span>
          </div>
        </div>

        {/* Contrer + Passer side-by-side */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button className="cb-btn cb-btn-soft" style={{ flex: 1, height: 38 }}>
            Passer
          </button>
          <button className="cb-btn" style={{ flex: 1.4, height: 38,
            background: "var(--color-live)", color: "#fff", boxShadow: "0 4px 12px rgba(226,52,52,0.25)",
            flexDirection: "column", gap: 0 }}>
            <span>🔥 Coincher × 2</span>
            <span style={{ fontSize: 8, opacity: 0.85, letterSpacing: "0.08em",
                            textTransform: "uppercase", fontWeight: 700, marginTop: 1 }}>
              "vous l'aurez pas"
            </span>
          </button>
        </div>
      </div>

      {/* My bid composer */}
      <div style={{ padding: "14px 16px 0", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div className="cb-eyebrow" style={{ marginBottom: 8 }}>ton enchère · 1) montant</div>

        {/* Amount scroll picker */}
        <div className="cb-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {amounts.map(a => {
            const active = amount === a;
            const tooLow = a <= lastBid.amount;
            return (
              <button key={a} onClick={() => setAmount(a)} style={{
                flex: "0 0 auto", height: 48, minWidth: 52, padding: "0 14px",
                borderRadius: "var(--r-md)",
                background: active ? "var(--color-ink)" : "var(--color-surface)",
                color: active ? "var(--color-canvas)" :
                       tooLow ? "var(--color-ink-subtle)" :
                       "var(--color-ink)",
                border: "1px solid " + (active ? "transparent" : tooLow ? "var(--color-hairline-soft)" : "var(--color-hairline)"),
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17,
                opacity: tooLow ? 0.5 : 1,
                position: "relative",
              }}>
                {a}
                {tooLow && (
                  <span style={{ position: "absolute", top: 4, right: 4, fontSize: 9,
                    color: "var(--color-ink-subtle)" }}>×</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {specials.map(sp => (
            <button key={sp.value} style={{
              flex: 1, height: 48,
              borderRadius: "var(--r-md)",
              background: "var(--color-surface)",
              border: "1px solid " + sp.color,
              color: sp.color,
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
              letterSpacing: "0.04em", textTransform: "uppercase",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span>{sp.label}</span>
              <span style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>{sp.pts} pts</span>
            </button>
          ))}
        </div>

        {/* Suit picker */}
        <div className="cb-eyebrow" style={{ marginTop: 12, marginBottom: 6 }}>2) couleur d'atout</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {suits.map(suitOpt => {
            const active = trump === suitOpt.s;
            return (
              <button key={suitOpt.s} onClick={() => setTrump(suitOpt.s)} style={{
                aspectRatio: "1.6",
                borderRadius: "var(--r-md)",
                background: active ? "var(--color-ink)" : suitOpt.bg,
                color: active ? "#fff" : (suitOpt.red ? "#E23434" : "#0A0A0A"),
                border: "1px solid " + (active ? "transparent" : "var(--color-hairline)"),
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 2,
                fontFamily: "var(--font-display)", fontWeight: 800,
              }}>
                <span style={{ fontSize: suitOpt.small ? 16 : 24, lineHeight: 1,
                  color: active ? (suitOpt.red ? "#FF6868" : "#fff") : (suitOpt.red ? "#E23434" : "#0A0A0A") }}>
                  {suitOpt.s}
                </span>
                <span style={{ fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: active ? "rgba(255,255,255,0.8)" : "var(--color-ink-muted)" }}>
                  {suitOpt.n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validate */}
      <div style={{ padding: "10px 16px 0" }}>
        <div className="cb-card" style={{ padding: 10, marginBottom: 8, display: "flex",
          alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="cb-eyebrow">ton annonce</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
              <span className="cb-display-md" style={{ fontSize: 22 }}>{amount}</span>
              <span style={{ fontSize: 20, color: trump === "♥" || trump === "♦" ? "#E23434" : "#0A0A0A",
                fontFamily: "var(--font-display)", fontWeight: 900 }}>{trump}</span>
            </div>
          </div>
          <span className="cb-chip" style={{
            background: valid ? "var(--color-success)" : "var(--color-surface-raised)",
            color: valid ? "#fff" : "var(--color-ink-muted)",
            borderColor: "transparent",
          }}>
            {valid ? "✓ valide" : "trop bas"}
          </span>
        </div>
        <button className="cb-btn cb-btn-primary" style={{
          width: "100%", height: 50,
          opacity: valid ? 1 : 0.4, pointerEvents: valid ? "auto" : "none",
        }}>
          Annoncer {amount} {trump}
        </button>
      </div>
    </CBPage>
  );
}

// ─────────────────────────────────────────────────────────────
// 8 AMÉRICAIN · Règles / Légende des cartes spéciales
// As=+2 · Joker=+4 + couleur · 8=couleur · D♣=+3 · V=change sens · 7=saute · 10=rejoue
// ─────────────────────────────────────────────────────────────
function CB8AmericainRulesScreen({ theme = "light" }) {
  const rules = [
    { cards: [{ value: "A", suit: "♥" }, { value: "A", suit: "♠" }], label: "As", effect: "Pioche +2",       color: "var(--cb-words)" },
    { cards: [{ value: "JK" }], label: "Joker", effect: "Pioche +4 + couleur", color: "var(--cb-cards)" },
    { cards: [{ value: "8", suit: "♥" }, { value: "8", suit: "♣" }], label: "8",  effect: "Change la couleur",    color: "var(--cb-brand)" },
    { cards: [{ value: "D", suit: "♣" }], label: "Dame ♣", effect: "Pioche +3",  color: "var(--cb-strategy)" },
    { cards: [{ value: "V", suit: "♥" }, { value: "V", suit: "♠" }], label: "Valet", effect: "Change le sens",   color: "var(--cb-party)" },
    { cards: [{ value: "7", suit: "♥" }, { value: "7", suit: "♠" }], label: "7", effect: "Saute le prochain",   color: "var(--cb-trivia)" },
    { cards: [{ value: "10", suit: "♥" },{ value: "10", suit: "♠" }],label: "10", effect: "Tu rejoues",         color: "var(--cb-sport)" },
  ];

  return (
    <CBPage theme={theme}>
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour
        </button>
        <span className="cb-eyebrow">8 américain · règles</span>
        <span className="cb-mono" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>2-8</span>
      </div>

      {/* Hero */}
      <div style={{ padding: "12px 16px 6px" }}>
        <div className="cb-card" style={{ padding: 14,
          background: "var(--color-ink)", color: "var(--color-canvas)", borderColor: "transparent",
          position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.18,
            background: "radial-gradient(120% 100% at 0% 0%, var(--cb-brand), transparent 60%)" }} />
          <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>règle d'or</div>
          <div className="cb-display-md" style={{ fontSize: 20, marginTop: 4, marginBottom: 4 }}>Vide ta main en premier</div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: "rgba(255,255,255,0.8)" }}>
            Joue une carte de <b style={{ color: "#fff" }}>même couleur</b> ou <b style={{ color: "#fff" }}>même valeur</b>. Sinon, pioche.
          </div>
        </div>
      </div>

      {/* Special cards list */}
      <div style={{ padding: "4px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="cb-eyebrow">cartes spéciales</span>
        <span className="cb-mono" style={{ fontSize: 10, color: "var(--color-ink-muted)" }}>7 effets</span>
      </div>

      <div className="cb-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 16px 8px",
        display: "flex", flexDirection: "column", gap: 6 }}>
        {rules.map((r, i) => (
          <div key={i} className="cb-card" style={{ padding: 8, display: "flex", alignItems: "center", gap: 10,
            borderLeft: "3px solid " + r.color }}>
            <div style={{ display: "flex", width: 64, justifyContent: "center", flexShrink: 0 }}>
              {r.cards[0].value === "JK" ? (
                <div style={{
                  width: 40, height: 56, borderRadius: 6,
                  background: "linear-gradient(135deg, #E63CA0, #6B4FE8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900,
                  fontSize: 14, letterSpacing: "-0.04em",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                }}>JK</div>
              ) : r.cards.length === 1 ? (
                <PlayingCard value={r.cards[0].value} suit={r.cards[0].suit} size="xs" />
              ) : (
                <div style={{ position: "relative", width: 54, height: 56 }}>
                  <div style={{ position: "absolute", left: 0, transform: "rotate(-6deg)" }}>
                    <PlayingCard value={r.cards[0].value} suit={r.cards[0].suit} size="xs" />
                  </div>
                  <div style={{ position: "absolute", left: 16, transform: "rotate(6deg)" }}>
                    <PlayingCard value={r.cards[1].value} suit={r.cards[1].suit} size="xs" />
                  </div>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="cb-display-sm" style={{ fontSize: 15 }}>{r.label}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-ink-muted)", marginTop: 1 }}>{r.effect}</div>
            </div>
            <span className="cb-chip" style={{
              background: r.color, color: "#fff", borderColor: "transparent",
              fontSize: 9, padding: "0 8px",
            }}>
              effet
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 16px 0" }}>
        <button className="cb-btn cb-btn-primary" style={{ width: "100%", height: 48 }}>
          C'est parti
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </CBPage>
  );
}
