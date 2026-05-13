// ===========================================================
// CB Games — Jeux de cartes en MODE PAYSAGE (rotated phone)
// Contrée · 8 Américain · Le Président — table en feutre, timer
// 852 × 402 (iPhone landscape)
// ===========================================================

// ─────────────────────────────────────────────────────────────
// FeltTable — fond feutre vert avec pattern de couleur répétée
// (comme la référence Belote en ligne)
// ─────────────────────────────────────────────────────────────
function FeltTable({ children, suit = "♣", style }) {
  const isRed = suit === "♥" || suit === "♦";
  // Build a tiled background of subtle suit glyphs using SVG data-URI
  const svgGlyph = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
      <text x="50%" y="55%" font-family="Arial" font-size="40" font-weight="900"
            text-anchor="middle" dominant-baseline="middle"
            fill="rgba(255,255,255,0.04)">${suit}</text>
    </svg>
  `);
  return (
    <div style={{
      position: "relative",
      background: `
        url("data:image/svg+xml,${svgGlyph}") 0 0 / 60px 60px,
        radial-gradient(120% 80% at 50% 50%, #1F4630 0%, #0E2A1B 100%)`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -20px 40px rgba(0,0,0,0.25)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PlayerSeat — pastille joueur avec avatar, nom, trophée
// ─────────────────────────────────────────────────────────────
function PlayerSeat({ name, color, trophy, current, cardsLeft, bubble, partner }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      position: "relative",
    }}>
      {bubble && (
        <div style={{
          position: "absolute", left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)",
          padding: "4px 10px",
          background: "var(--cb-words)",
          color: "#fff",
          borderRadius: "var(--r-pill)",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11,
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(43,109,232,0.4)",
        }}>
          {bubble}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: color,
          border: "3px solid " + (current ? "var(--cb-brand)" : "rgba(255,255,255,0.25)"),
          boxShadow: current ? "0 0 0 4px rgba(255,106,61,0.25), 0 6px 16px rgba(255,106,61,0.3)" : "0 2px 8px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18,
          letterSpacing: "-0.02em",
        }}>
          {(name || "?").split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        {partner && (
          <span style={{
            position: "absolute", bottom: -2, right: -4,
            width: 18, height: 18, borderRadius: 50,
            background: "var(--cb-strategy)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontFamily: "var(--font-display)", fontWeight: 900,
            border: "2px solid rgba(0,0,0,0.3)",
          }}>P</span>
        )}
        {cardsLeft != null && (
          <span style={{
            position: "absolute", bottom: -4, left: -4,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "1px 5px", borderRadius: 999,
            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
            border: "1.5px solid rgba(255,255,255,0.2)",
          }}>
            {cardsLeft}🂠
          </span>
        )}
      </div>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
        padding: "0 4px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {trophy && (
            <>
              <span style={{ color: "#E3B83A", fontSize: 9 }}>🏆</span>
              <span style={{ color: "#fff", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700 }}>
                {trophy}
              </span>
            </>
          )}
        </div>
        <span style={{
          color: "#fff",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11,
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}>{name}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Turn timer — anneau au centre avec compte à rebours
// ─────────────────────────────────────────────────────────────
function TurnTimer({ seconds = 12, max = 20, size = 64, label = "à toi" }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - seconds / max);
  const urgent = seconds <= 5;
  return (
    <div style={{
      width: size, height: size, position: "relative",
      filter: urgent ? "drop-shadow(0 0 12px rgba(226,52,52,0.5))" : "drop-shadow(0 0 8px rgba(255,106,61,0.4))",
    }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size/2} cy={size/2} r={r}
                fill="rgba(0,0,0,0.4)"
                stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r}
                fill="none"
                stroke={urgent ? "var(--color-live)" : "var(--cb-brand)"}
                strokeWidth="3"
                strokeDasharray={c}
                strokeDashoffset={offset}
                strokeLinecap="round"/>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: size * 0.32, lineHeight: 1,
        }}>{seconds}</span>
        <span style={{
          color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2,
        }}>{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARD HAND (landscape, fanned) — large, swipeable cards
// Auto-tightens spacing + rotation when many cards so it doesn't overflow.
// ─────────────────────────────────────────────────────────────
function LandscapeHand({ cards, playable, highlightIdx, onCardClick }) {
  const n = cards.length;
  // Available fan width in the artboard (852 - 100 of padding for chrome)
  const maxFanWidth = 540;
  const cardW = 78; // size="lg"
  // Spacing between card centers — cap so the fan fits
  const idealSpacing = 56;
  const spacing = n > 1 ? Math.min(idealSpacing, (maxFanWidth - cardW) / (n - 1)) : 0;
  const rotPerStep = n > 1 ? Math.min(3.5, 24 / (n - 1)) : 0;
  return (
    <div style={{ position: "relative", height: 130, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
      <div style={{ position: "relative", width: maxFanWidth, height: 110 }}>
        {cards.map((c, i) => {
          const mid = (n - 1) / 2;
          const offset = (i - mid);
          const rot = offset * rotPerStep;
          const x = offset * spacing;
          const y = Math.abs(offset) * 2;
          const isPlayable = playable ? playable[i] : true;
          const isHighlighted = highlightIdx && highlightIdx.includes(i);
          return (
            <div key={i} style={{
              position: "absolute", left: "50%", bottom: 0,
              transform: `translateX(${x - cardW/2}px) translateY(${-y - (isHighlighted ? 12 : 0)}px) rotate(${rot}deg)`,
              transformOrigin: "center 95px",
              zIndex: isHighlighted ? 100 + i : i,
              transition: "transform 0.2s var(--ease-out)",
            }}>
              <PlayingCard value={c.value} suit={c.suit} size="lg"
                           dim={!isPlayable && !isHighlighted}
                           raised={isHighlighted}
                           style={isHighlighted ? {
                             boxShadow: "0 12px 28px rgba(255,106,61,0.5)",
                             outline: "3px solid var(--cb-brand)", outlineOffset: -3,
                           } : isPlayable ? {
                             boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                           } : undefined}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// LA CONTRÉE — LANDSCAPE
// ═════════════════════════════════════════════════════════════
function CBContreeLandscape() {
  // Pli en cours : Léa entame, Marwan (partner) coupe à l'atout, Chloé surcoupe
  const trick = [
    { who: "L", value: "10", suit: "♦" }, // Léa (left)
    { who: "M", value: "V",  suit: "♥", partner: true }, // Marwan (top — partner)
    { who: "R", value: "A",  suit: "♦" }, // Chloé (right) — As
  ];

  // Ma main : 6 cartes (avec belote prête R+D ♥)
  const myHand = [
    { value: "7",  suit: "♠" },
    { value: "R",  suit: "♥" }, // atout — belote
    { value: "D",  suit: "♥" }, // atout — rebelote
    { value: "8",  suit: "♣" },
    { value: "R",  suit: "♣" },
    { value: "A",  suit: "♠" }, // As
  ];
  const playable = [false, true, true, false, false, false];

  return (
    <div data-theme="dark" className="cb-app" style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <FeltTable suit="♥" style={{ width: "100%", height: "100%", position: "relative" }}>

        {/* Top-left: score panel */}
        <div style={{ position: "absolute", top: 12, left: 14,
          background: "rgba(0,0,0,0.55)",
          borderRadius: "var(--r-md)",
          padding: "8px 12px",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: "0 18px", alignItems: "center" }}>
            <span></span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center" }}>tour</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center" }}>total</span>

            <span style={{ width: 10, height: 10, borderRadius: 50, background: "var(--cb-strategy)" }} />
            <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16,
              textAlign: "center" }}>34</span>
            <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16,
              textAlign: "center" }}>728</span>

            <span style={{ width: 10, height: 10, borderRadius: 50, background: "var(--color-live)" }} />
            <span style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16,
              textAlign: "center" }}>21</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16,
              textAlign: "center" }}>370</span>
          </div>
          <div style={{
            marginTop: 6, paddingTop: 6,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>contrat</span>
            <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14 }}>120</span>
            <span style={{ color: "#E23434", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14 }}>♥</span>
            <span style={{ color: "var(--cb-brand)", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 8, letterSpacing: "0.1em" }}>COINCHÉ ×2</span>
          </div>
        </div>

        {/* Top-right: settings + close */}
        <div style={{ position: "absolute", top: 12, right: 14, display: "flex", gap: 8 }}>
          <button style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.55)",
            border: "1.5px solid rgba(255,255,255,0.15)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Partner top */}
        <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)" }}>
          <PlayerSeat name="Marwan" color="#18A957" trophy="1890" partner />
        </div>

        {/* Opponent left */}
        <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
          <PlayerSeat name="Léa" color="#2B6DE8" trophy="816" bubble="Pas pris" />
        </div>

        {/* Opponent right */}
        <div style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)" }}>
          <PlayerSeat name="Chloé" color="#E63CA0" trophy="59" />
        </div>

        {/* Center — current trick (cross layout) */}
        <div style={{ position: "absolute", left: "50%", top: "44%", transform: "translate(-50%, -50%)",
                        width: 220, height: 160 }}>
          {/* Léa (left of cross) */}
          <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%) rotate(8deg)" }}>
            <PlayingCard value={trick[0].value} suit={trick[0].suit} size="md"
                         style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.45)" }}/>
          </div>
          {/* Partner Marwan (top) — highlighted partner */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%) rotate(-3deg)" }}>
            <PlayingCard value={trick[1].value} suit={trick[1].suit} size="md" raised
                         style={{ boxShadow: "0 6px 18px rgba(24,169,87,0.45)",
                                   outline: "2px solid var(--cb-strategy)", outlineOffset: -2 }}/>
          </div>
          {/* Chloé (right) */}
          <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%) rotate(-8deg)" }}>
            <PlayingCard value={trick[2].value} suit={trick[2].suit} size="md"
                         style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.45)" }}/>
          </div>
          {/* My empty slot at bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: 56, height: 80, borderRadius: 7,
            border: "2px dashed rgba(255,255,255,0.3)",
          }} />
        </div>

        {/* Belote chip + timer — right of trick */}
        <div style={{ position: "absolute", left: "calc(50% + 130px)", top: "38%",
                        display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
          <TurnTimer seconds={9} max={15} size={64} />
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px",
            background: "rgba(24,169,87,0.2)",
            border: "1px solid rgba(24,169,87,0.4)",
            borderRadius: 999,
            fontSize: 9, color: "#fff",
            fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "0.06em",
          }}>
            <span style={{ color: "var(--cb-strategy)", fontSize: 11 }}>♥</span>
            BELOTE +20
          </div>
        </div>

        {/* Tricks won — bottom-left */}
        <div style={{ position: "absolute", bottom: 138, left: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>plis nous</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[1,2,3,4].map(i => (
                <span key={i} style={{ width: 8, height: 11, borderRadius: 1.5,
                  background: i <= 3 ? "var(--cb-strategy)" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>plis eux</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[1,2,3,4].map(i => (
                <span key={i} style={{ width: 8, height: 11, borderRadius: 1.5,
                  background: i <= 1 ? "var(--color-live)" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </div>
        </div>

        {/* My hand — fanned at bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <LandscapeHand cards={myHand} playable={playable} highlightIdx={[1,2]} />
        </div>

        {/* Bottom-right action chip */}
        <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", gap: 6 }}>
          <button style={{
            padding: "8px 14px", borderRadius: "var(--r-pill)",
            background: "var(--cb-brand)", color: "var(--cb-brand-ink)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11,
            letterSpacing: "0.08em", textTransform: "uppercase",
            boxShadow: "0 4px 12px rgba(255,106,61,0.4)",
          }}>
            Tu dois fournir ♥
          </button>
        </div>
      </FeltTable>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 8 AMÉRICAIN — LANDSCAPE
// ═════════════════════════════════════════════════════════════
function CB8AmericainLandscape() {
  const opponents = [
    { name: "Léa",    color: "#2B6DE8", trophy: "816",  cards: 4 },
    { name: "Marwan", color: "#18A957", trophy: "1890", cards: 7 },
    { name: "Chloé",  color: "#E63CA0", trophy: "59",   cards: 2, current: true, bubble: "+3 !" },
  ];

  const discardTop = { value: "8", suit: "♣" };
  const askedSuit  = "♥";

  const myHand = [
    { value: "7",  suit: "♥" },
    { value: "V",  suit: "♥" },
    { value: "9",  suit: "♦" },
    { value: "D",  suit: "♣" }, // Dame de trèfle — +3
    { value: "10", suit: "♠" },
    { value: "A",  suit: "♥" }, // As
    { value: "8",  suit: "♦" },
  ];
  const playable = [true, true, false, false, false, true, true];

  return (
    <div data-theme="dark" className="cb-app" style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <FeltTable suit="♠" style={{ width: "100%", height: "100%", position: "relative" }}>

        {/* Top-left: score / round */}
        <div style={{ position: "absolute", top: 12, left: 14,
          background: "rgba(0,0,0,0.55)",
          borderRadius: "var(--r-md)",
          padding: "8px 12px",
          backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>8 américain</span>
          <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16 }}>
            Manche 02
          </span>
        </div>

        <div style={{ position: "absolute", top: 12, right: 14 }}>
          <button style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.55)",
            border: "1.5px solid rgba(255,255,255,0.15)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 13 }}>?</span>
          </button>
        </div>

        {/* Top center: opponent Marwan */}
        <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)" }}>
          <PlayerSeat name="Marwan" color="#18A957" trophy="1890" cardsLeft={opponents[1].cards} />
        </div>

        {/* Left: Léa */}
        <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
          <PlayerSeat name="Léa" color="#2B6DE8" trophy="816" cardsLeft={opponents[0].cards} />
        </div>

        {/* Right: Chloé (current player who played 8♣) */}
        <div style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <PlayerSeat name="Chloé" color="#E63CA0" trophy="59" cardsLeft={2} current />
            <div style={{
              marginTop: 4,
              padding: "2px 8px", borderRadius: 999,
              background: "var(--color-live)", color: "#fff",
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 9,
              letterSpacing: "0.1em", textTransform: "uppercase",
              boxShadow: "0 2px 8px rgba(226,52,52,0.4)",
              animation: "cb-pulse 1.4s infinite",
            }}>
              UNO !
            </div>
          </div>
        </div>

        {/* Center: piles */}
        <div style={{ position: "absolute", left: "50%", top: "44%", transform: "translate(-50%, -50%)",
                        display: "flex", gap: 18, alignItems: "center" }}>
          {/* Pioche */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ position: "relative", width: 56, height: 80 }}>
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
                            fontWeight: 700, fontSize: 9, letterSpacing: "0.1em" }}>
              PIOCHE · 18
            </span>
          </div>

          {/* Discard top */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ position: "relative", width: 56, height: 80 }}>
              <div style={{ position: "absolute", inset: 0, transform: "rotate(-8deg)", opacity: 0.5 }}>
                <PlayingCard value="V" suit="♦" size="md" />
              </div>
              <div style={{ position: "absolute", inset: 0, transform: "rotate(4deg)", opacity: 0.7 }}>
                <PlayingCard value="10" suit="♦" size="md" />
              </div>
              <div style={{ position: "absolute", inset: 0 }}>
                <PlayingCard value={discardTop.value} suit={discardTop.suit} size="md" raised
                             style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.45)" }}/>
              </div>
              <div style={{
                position: "absolute", top: -10, right: -16,
                width: 30, height: 30, borderRadius: 999,
                background: "var(--cb-brand)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 900,
                color: "#E23434",
                boxShadow: "0 4px 10px rgba(255,106,61,0.45)",
                border: "2px solid #fff",
              }}>
                {askedSuit}
              </div>
            </div>
            <span style={{ color: "#fff", fontFamily: "var(--font-display)",
                            fontWeight: 700, fontSize: 9, letterSpacing: "0.1em" }}>
              CŒUR DEMANDÉ
            </span>
          </div>
        </div>

        {/* Timer left of piles */}
        <div style={{ position: "absolute", left: "calc(50% - 170px)", top: "40%" }}>
          <TurnTimer seconds={12} max={20} size={64} label="à toi" />
        </div>

        {/* My hand */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <LandscapeHand cards={myHand} playable={playable} />
        </div>

        {/* Bottom action: piocher */}
        <div style={{ position: "absolute", bottom: 14, left: 14 }}>
          <button style={{
            padding: "8px 14px", borderRadius: "var(--r-pill)",
            background: "rgba(0,0,0,0.65)", color: "#fff",
            border: "1.5px solid rgba(255,255,255,0.2)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11,
            letterSpacing: "0.08em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 6,
            backdropFilter: "blur(8px)",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Piocher
          </button>
        </div>
      </FeltTable>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// LE PRÉSIDENT — LANDSCAPE
// ═════════════════════════════════════════════════════════════
function CBPresidentLandscape() {
  const lastCombo = [
    { value: "8", suit: "♥" },
    { value: "8", suit: "♦" },
    { value: "8", suit: "♣" },
  ];

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
  const highlightIdx = [3, 4, 5]; // trio de 9

  return (
    <div data-theme="dark" className="cb-app" style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <FeltTable suit="♦" style={{ width: "100%", height: "100%", position: "relative" }}>

        {/* Top-left: round + rank */}
        <div style={{ position: "absolute", top: 12, left: 14,
          background: "rgba(0,0,0,0.55)",
          borderRadius: "var(--r-md)",
          padding: "8px 12px",
          backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>le président · m.04</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>⭐</span>
            <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 13 }}>
              Vice-Président
            </span>
          </div>
        </div>

        {/* Top center: Sofian opponent */}
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)" }}>
          <PlayerSeat name="Sofian" color="#FF6A3D" trophy="2140" cardsLeft={7} bubble="passe" />
        </div>

        {/* Far left: Léa (Président, currently leading) */}
        <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <PlayerSeat name="Léa" color="#2B6DE8" trophy="1890" cardsLeft={5} />
            <div style={{
              marginTop: 4,
              padding: "2px 8px", borderRadius: 999,
              background: "linear-gradient(135deg, #FFE082, #E3B83A)",
              color: "#5C3F00",
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 9,
              letterSpacing: "0.1em", textTransform: "uppercase",
              boxShadow: "0 2px 8px rgba(227,184,58,0.4)",
            }}>
              👑 Président
            </div>
          </div>
        </div>

        {/* Right: Marwan (current player) */}
        <div style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)" }}>
          <PlayerSeat name="Marwan" color="#18A957" trophy="816" cardsLeft={3} current />
        </div>

        {/* Center: trio de 8 à battre */}
        <div style={{ position: "absolute", left: "50%", top: "42%", transform: "translate(-50%, -50%)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{
            padding: "3px 10px", borderRadius: 999,
            background: "rgba(0,0,0,0.5)",
            fontSize: 9, color: "rgba(255,255,255,0.7)",
            fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            à battre · trio de 8
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {lastCombo.map((c, i) => (
              <div key={i} style={{ transform: `rotate(${(i - 1) * 3}deg) translateY(${Math.abs(i - 1) * 2}px)` }}>
                <PlayingCard value={c.value} suit={c.suit} size="md" raised
                  style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.45)" }}/>
              </div>
            ))}
          </div>
        </div>

        {/* Timer right of center */}
        <div style={{ position: "absolute", left: "calc(50% + 110px)", top: "36%" }}>
          <TurnTimer seconds={6} max={15} size={64} label="à toi" />
        </div>

        {/* Hint chip */}
        <div style={{ position: "absolute", left: 14, top: "65%" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            background: "var(--cb-strategy)", color: "#fff",
            borderRadius: 999,
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 10,
            letterSpacing: "0.06em",
            boxShadow: "0 4px 12px rgba(24,169,87,0.4)",
          }}>
            💡 Trio de 9 → bat le trio de 8
          </div>
        </div>

        {/* My hand */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <LandscapeHand cards={myHand} playable={[false, false, false, true, true, true, false, false, false]}
                         highlightIdx={highlightIdx}/>
        </div>

        {/* Bottom-right CTAs */}
        <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", gap: 6 }}>
          <button style={{
            padding: "8px 14px", borderRadius: "var(--r-pill)",
            background: "rgba(0,0,0,0.65)", color: "#fff",
            border: "1.5px solid rgba(255,255,255,0.2)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11,
            letterSpacing: "0.08em", textTransform: "uppercase",
            backdropFilter: "blur(8px)",
          }}>
            Passer
          </button>
          <button style={{
            padding: "8px 16px", borderRadius: "var(--r-pill)",
            background: "var(--cb-brand)", color: "var(--cb-brand-ink)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11,
            letterSpacing: "0.08em", textTransform: "uppercase",
            boxShadow: "0 4px 12px rgba(255,106,61,0.4)",
          }}>
            Jouer trio de 9
          </button>
        </div>
      </FeltTable>
    </div>
  );
}

Object.assign(window, {
  FeltTable, PlayerSeat, TurnTimer, LandscapeHand,
  CBContreeLandscape, CB8AmericainLandscape, CBPresidentLandscape,
});
