import React from "react";
// ===========================================================
// CB Games — Shared UI primitives + Home / Lobby / Game Shell
// ===========================================================

// Avatar with colored bg derived from name
function CBAvatar({ name, size = 36, ring = false, status, color }) {
  const initials = (name || "?").split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const palette = ["#FF6A3D", "#2B6DE8", "#18A957", "#E63CA0", "#6B4FE8", "#E89A2B", "#00B3A6", "#E23434"];
  const hash = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = color || palette[hash % palette.length];
  return (
    <div className={"cb-avatar" + (ring ? " cb-avatar-ring" : "")}
    style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
      {initials}
      {status &&
      <span style={{
        position: "absolute", bottom: -1, right: -1,
        width: size * 0.32, height: size * 0.32,
        borderRadius: "50%",
        background: status === "ready" ? "var(--color-success)" :
        status === "live" ? "var(--color-live)" :
        "var(--color-ink-subtle)",
        border: "2px solid var(--color-surface)"
      }} />
      }
    </div>);

}

// Page wrapper — applies theme + cb-app class, kills iOS frame's default bg
function CBPage({ children, theme = "light", padTop = 54, padBottom = 34, style }) {
  return (
    <div data-theme={theme} className="cb-app" style={{
      width: "100%", height: "100%",
      paddingTop: padTop, paddingBottom: padBottom,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      ...style
    }}>
      {children}
    </div>);

}

// Top-right floating chrome cluster per Focus DS rule "no global header"
function CBTopRight({ children }) {
  return (
    <div style={{
      position: "absolute", top: 60, right: 16, zIndex: 5,
      display: "flex", gap: 8, alignItems: "center"
    }}>
      {children}
    </div>);

}

// Top-left CB wordmark
function CBLogo({ size = 22 }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      fontFamily: "var(--font-display)", fontWeight: 900,
      fontSize: size, letterSpacing: "-0.04em",
      color: "var(--color-ink)"
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size + 8, height: size + 8,
        background: "var(--color-ink)", color: "var(--color-canvas)",
        borderRadius: 6, fontSize: size * 0.65, fontWeight: 900
      }}>cb</span>
      <span>games</span>
    </div>);

}

// ===========================================================
// HOME SCREEN
// ===========================================================
function CBHomeScreen({ theme = "light", brandColor }) {
  const [code, setCode] = React.useState("RVST");
  return (
    <CBPage theme={theme} padBottom={34}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px 0" }}>
        <CBLogo />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="cb-chip">
            <span className="cb-dot" style={{ background: "var(--color-success)" }} />
            142 live
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "28px 20px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="cb-eyebrow" style={{ marginBottom: 12 }}>
          26 jeux · 2 → 8 joueurs
        </div>
        <h1 className="cb-display-xl" style={{ marginBottom: 12 }}>
          La soirée
          <br />
          <span style={{ color: brandColor || "var(--cb-brand)" }}>commence ici.</span>
        </h1>
        <p style={{ color: "var(--color-ink-muted)", fontSize: 15, lineHeight: 1.45, maxWidth: 320 }}>
          Un code, une salle, on joue. Pas de compte, pas d'install — juste ton tel et tes potes.
        </p>

        {/* Big primary CTA */}
        <div style={{ marginTop: 28 }}>
          <button className="cb-btn cb-btn-primary cb-btn-lg" style={{ width: "100%", backgroundColor: "rgb(255, 129, 61)" }}>
            Créer une salle
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Join with code */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ height: 1, flex: 1, background: "var(--color-hairline)" }} />
          <span className="cb-eyebrow">ou rejoins</span>
          <div style={{ height: 1, flex: 1, background: "var(--color-hairline)" }} />
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <input className="cb-input" value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="CODE" maxLength={4} style={{ flex: 1, textAlign: "center" }} />
          <button className="cb-btn cb-btn-soft" style={{ height: 52, minWidth: 52, padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Featured / trending strip */}
      <div style={{ padding: "20px 0 12px" }}>
        <div style={{ padding: "0 20px", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="cb-eyebrow">À l'affiche</span>
          <span className="cb-eyebrow" style={{ color: "var(--color-ink)" }}>tout voir →</span>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 20px 4px" }} className="cb-scroll">
          {[
          { emoji: "💣", name: "Bomb Party", cat: "Mots", color: "var(--cb-words)", players: "12k aujourd'hui" },
          { emoji: "🐺", name: "Loup-Garou", cat: "Bluff", color: "var(--cb-social)", players: "soirée classique" },
          { emoji: "🎾", name: "Motion Tennis", cat: "Sport", color: "var(--cb-sport)", players: "ton tel = raquette" },
          { emoji: "🔥", name: "Roast Quiz", cat: "Quiz", color: "var(--cb-trivia)", players: "salty" }].
          map((g, i) =>
          <div key={i} className="cb-card" style={{
            flex: "0 0 162px", padding: 14, position: "relative", overflow: "hidden"
          }}>
              <div style={{
              position: "absolute", inset: 0, opacity: 0.05,
              background: `radial-gradient(120% 120% at 100% 0%, ${g.color}, transparent 50%)`
            }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>{g.emoji}</span>
                <span className="cb-chip" style={{ height: 20, fontSize: 9, padding: "0 8px",
                background: "transparent", borderColor: g.color, color: g.color }}>
                  {g.cat}
                </span>
              </div>
              <div className="cb-display-sm" style={{ marginBottom: 4 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>{g.players}</div>
            </div>
          )}
        </div>
      </div>
    </CBPage>);

}

// ===========================================================
// LOBBY SCREEN
// ===========================================================
const CATEGORIES = [
{ id: "all", label: "Tous", color: "var(--color-ink)" },
{ id: "words", label: "Mots", color: "var(--cb-words)" },
{ id: "trivia", label: "Quiz", color: "var(--cb-trivia)" },
{ id: "speed", label: "Rapide", color: "var(--cb-speed)" },
{ id: "social", label: "Bluff", color: "var(--cb-social)" },
{ id: "strategy", label: "Stratégie", color: "var(--cb-strategy)" },
{ id: "cards", label: "Cartes", color: "var(--cb-cards)" },
{ id: "party", label: "Party", color: "var(--cb-party)" },
{ id: "sport", label: "Sport", color: "var(--cb-sport)" }];


const LOBBY_GAMES = [
{ id: "bomb-party", name: "Bomb Party", cat: "words", emoji: "💣", desc: "Trouve un mot avec la syllabe", min: 2, max: 8, hot: true },
{ id: "loup-garou", name: "Loup-Garou", cat: "social", emoji: "🐺", desc: "Village contre loups, nuit et jour", min: 4, max: 8, hot: true },
{ id: "speed-quiz", name: "Speed Quiz", cat: "trivia", emoji: "⚡", desc: "Culture G à la seconde", min: 2, max: 8 },
{ id: "undercover", name: "Undercover", cat: "social", emoji: "🕶️", desc: "Qui a le mot différent ?", min: 3, max: 8 },
{ id: "reaction", name: "Réflexes", cat: "speed", emoji: "🎯", desc: "Clique au bon moment", min: 2, max: 8 },
{ id: "code-names", name: "Noms de Code", cat: "strategy", emoji: "🔍", desc: "2 équipes, indices, mots", min: 4, max: 8 },
{ id: "motion-tennis", name: "Motion Tennis", cat: "sport", emoji: "🎾", desc: "Téléphone = raquette", min: 1, max: 2, hot: true },
{ id: "uno", name: "Uno", cat: "cards", emoji: "🃏", desc: "Le classique", min: 2, max: 8 },
{ id: "blind-control", name: "Blind Control", cat: "party", emoji: "🎮", desc: "Tous contrôlent le même perso", min: 2, max: 8 },
{ id: "roast-quiz", name: "Roast Quiz", cat: "trivia", emoji: "🔥", desc: "Quiz avec malus à infliger", min: 2, max: 8 }];


function CategoryPills({ active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 20px 8px" }} className="cb-scroll">
      {CATEGORIES.map((c) =>
      <button key={c.id} onClick={() => onChange?.(c.id)}
      className="cb-chip" style={{
        height: 30, padding: "0 12px", fontSize: 11,
        background: active === c.id ? "var(--color-ink)" : "var(--color-surface)",
        color: active === c.id ? "var(--color-canvas)" : "var(--color-ink)",
        borderColor: active === c.id ? "transparent" : "var(--color-hairline)",
        flexShrink: 0
      }}>
          <span className="cb-dot" style={{ background: c.color, width: 6, height: 6 }} />
          {c.label}
        </button>
      )}
    </div>);

}

function GameListRow({ game, selected, onClick }) {
  const cat = CATEGORIES.find((c) => c.id === game.cat);
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left",
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px",
      background: selected ? "var(--color-ink)" : "var(--color-surface)",
      color: selected ? "var(--color-canvas)" : "var(--color-ink)",
      borderRadius: "var(--r-md)",
      border: "1px solid " + (selected ? "transparent" : "var(--color-hairline)"),
      transition: "all var(--dur-base) var(--ease-out)",
      position: "relative"
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "var(--r-md)",
        background: selected ? "rgba(255,255,255,0.08)" : "var(--color-surface-raised)",
        border: "1px solid " + (selected ? "rgba(255,255,255,0.1)" : "var(--color-hairline)"),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0
      }}>{game.emoji}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span className="cb-display-sm" style={{ fontSize: 16 }}>{game.name}</span>
          {game.hot && !selected &&
          <span className="cb-chip" style={{ height: 16, fontSize: 8, padding: "0 6px",
            background: "var(--cb-brand-tint)", color: "var(--cb-brand)", borderColor: "transparent" }}>HOT</span>
          }
        </div>
        <div style={{ fontSize: 12, color: selected ? "rgba(255,255,255,0.6)" : "var(--color-ink-muted)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {game.desc}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <span className="cb-mono" style={{ fontSize: 10,
          color: selected ? "rgba(255,255,255,0.5)" : "var(--color-ink-subtle)" }}>
          {game.min}-{game.max}
        </span>
        <span className="cb-dot" style={{ background: cat.color, width: 6, height: 6 }} />
      </div>
    </button>);

}

function CBLobbyScreen({ theme = "light", state = "picking" }) {
  // state: "picking" | "ready"
  const [selected, setSelected] = React.useState(state === "ready" ? "loup-garou" : "bomb-party");
  const [cat, setCat] = React.useState("all");
  const selectedGame = LOBBY_GAMES.find((g) => g.id === selected);
  const filtered = cat === "all" ? LOBBY_GAMES : LOBBY_GAMES.filter((g) => g.cat === cat);

  const players = [
  { id: 1, name: "Sofian", host: true, ready: true, color: "#FF6A3D" },
  { id: 2, name: "Léa", ready: true, color: "#2B6DE8" },
  { id: 3, name: "Marwan", ready: state === "ready", color: "#18A957" },
  { id: 4, name: "Chloé", ready: state === "ready", color: "#E63CA0" },
  { id: 5, name: "Yanis", ready: state === "ready", color: "#6B4FE8" }];

  const readyCount = players.filter((p) => p.ready).length;
  const allReady = readyCount === players.length;

  return (
    <CBPage theme={theme}>
      {/* Header — room code + connection + leave */}
      <div style={{ padding: "8px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Quitter
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span className="cb-eyebrow">salle</span>
          <span className="cb-mono cb-display-sm" style={{ letterSpacing: "0.3em" }}>RVST</span>
        </div>

        <button className="cb-chip" style={{ height: 28 }}>
          <span className="cb-dot" style={{ background: "var(--color-success)", width: 6, height: 6 }} />
          {readyCount}/{players.length}
        </button>
      </div>

      {/* Hero card — selected game */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div className="cb-card" style={{
          padding: 18, position: "relative", overflow: "hidden",
          background: state === "ready" ? "var(--color-ink)" : "var(--color-surface)",
          color: state === "ready" ? "var(--color-canvas)" : "var(--color-ink)",
          borderColor: state === "ready" ? "transparent" : "var(--color-hairline)"
        }}>
          {state === "ready" &&
          <div style={{ position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none",
            background: `radial-gradient(140% 100% at 100% 0%, var(--cb-social), transparent 55%)` }} />
          }
          <div style={{ display: "flex", gap: 14, alignItems: "center", position: "relative" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "var(--r-md)",
              background: state === "ready" ? "rgba(255,255,255,0.08)" : "var(--color-surface-raised)",
              border: "1px solid " + (state === "ready" ? "rgba(255,255,255,0.12)" : "var(--color-hairline)"),
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0
            }}>{selectedGame?.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cb-eyebrow" style={{ color: state === "ready" ? "rgba(255,255,255,0.5)" : undefined }}>
                {state === "ready" ? "tout est prêt" : "jeu sélectionné"}
              </div>
              <div className="cb-display-md" style={{ marginTop: 2, marginBottom: 4 }}>{selectedGame?.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{selectedGame?.min}–{selectedGame?.max} joueurs · {selectedGame?.desc}</div>
            </div>
          </div>

          {state === "ready" &&
          <button className="cb-btn cb-btn-brand cb-btn-lg"
          style={{ width: "100%", marginTop: 16 }}>
              Lancer la partie
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </button>
          }
        </div>
      </div>

      {/* Toggle: jeux vs joueurs */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{
          display: "flex", gap: 4, padding: 4,
          background: "var(--color-surface-sunken)",
          borderRadius: "var(--r-pill)"
        }}>
          {["Jeux", "Joueurs"].map((t, i) =>
          <button key={t} style={{
            flex: 1, height: 34, borderRadius: "var(--r-pill)",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: i === (state === "ready" ? 1 : 0) ? "var(--color-surface)" : "transparent",
            color: i === (state === "ready" ? 1 : 0) ? "var(--color-ink)" : "var(--color-ink-muted)",
            boxShadow: i === (state === "ready" ? 1 : 0) ? "var(--shadow-xs)" : "none"
          }}>
              {t}
              {i === 1 &&
            <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 10 }}>{readyCount}/{players.length}</span>
            }
            </button>
          )}
        </div>
      </div>

      {state === "picking" ?
      <>
          <CategoryPills active={cat} onChange={setCat} />
          <div className="cb-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((g) =>
          <GameListRow key={g.id} game={g} selected={selected === g.id} onClick={() => setSelected(g.id)} />
          )}
          </div>
        </> :

      <div className="cb-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {players.map((p) =>
        <div key={p.id} className="cb-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <CBAvatar name={p.name} color={p.color} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }}>{p.name}</span>
                  {p.host &&
              <span className="cb-chip" style={{ height: 16, fontSize: 8, padding: "0 6px",
                background: "var(--color-ink)", color: "var(--color-canvas)", borderColor: "transparent" }}>HOST</span>
              }
                </div>
                <div style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
                  {p.ready ? "Prêt à jouer" : "En attente..."}
                </div>
              </div>
              <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: p.ready ? "var(--color-success)" : "var(--color-surface-raised)",
            border: "1px solid " + (p.ready ? "transparent" : "var(--color-hairline)"),
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
                {p.ready &&
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
            }
              </div>
            </div>
        )}
        </div>
      }
    </CBPage>);

}

// ===========================================================
// GAME SHELL — in-game HUD overlay (sample mid-game)
// ===========================================================
function CBGameShellInGame({ theme = "dark" }) {
  // A neutral mid-game view: top HUD + center game canvas placeholder + bottom action bar
  const players = [
  { name: "Sofian", color: "#FF6A3D", score: 4, live: true },
  { name: "Léa", color: "#2B6DE8", score: 3 },
  { name: "Marwan", color: "#18A957", score: 2 },
  { name: "Chloé", color: "#E63CA0", score: 1 }];

  return (
    <CBPage theme={theme} padTop={54} padBottom={34}>
      {/* Top HUD: score row */}
      <div style={{ padding: "8px 12px 0", display: "flex", gap: 6, alignItems: "stretch" }}>
        {players.map((p, i) =>
        <div key={i} style={{
          flex: 1, position: "relative",
          padding: "8px 8px",
          borderRadius: "var(--r-md)",
          background: p.live ? p.color : "var(--color-surface)",
          border: "1px solid " + (p.live ? "transparent" : "var(--color-hairline)"),
          color: p.live ? "#fff" : "var(--color-ink)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <span className="cb-dot" style={{ width: 6, height: 6, background: p.live ? "#fff" : p.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </span>
            </div>
            <div className="cb-display-sm" style={{ fontSize: 20, lineHeight: 1 }}>{p.score}</div>
            {p.live &&
          <div style={{
            position: "absolute", inset: -2, borderRadius: "calc(var(--r-md) + 2px)",
            border: "2px solid " + p.color, opacity: 0.45, pointerEvents: "none",
            animation: "cb-pulse 1.6s infinite"
          }} />
          }
          </div>
        )}
      </div>

      {/* Round counter + timer */}
      <div style={{ padding: "12px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="cb-eyebrow">manche</div>
          <div className="cb-display-sm">04 / 10</div>
        </div>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--color-surface)", border: "1px solid var(--color-hairline)",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
        }}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-hairline-soft)" strokeWidth="4" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--cb-speed)" strokeWidth="4"
            strokeDasharray="175.9" strokeDashoffset="62" strokeLinecap="round" />
          </svg>
          <span className="cb-display-md" style={{ fontSize: 18, position: "relative" }}>07</span>
        </div>
      </div>

      {/* Game canvas — placeholder showing 'live' content */}
      <div style={{ flex: 1, padding: "16px 16px 0", display: "flex", flexDirection: "column" }}>
        <div className="cb-card" style={{
          flex: 1, padding: 20, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center",
          position: "relative", overflow: "hidden",
          background: "var(--color-surface)"
        }}>
          <div className="cb-eyebrow" style={{ marginBottom: 10 }}>tour de sofian</div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: 84, letterSpacing: "-0.04em", lineHeight: 1,
            background: "linear-gradient(135deg, var(--cb-speed), var(--cb-party))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 12
          }}>tion</div>
          <div style={{ fontSize: 13, color: "var(--color-ink-muted)", maxWidth: 260 }}>
            Trouve un mot qui contient ces 3 lettres. Tu as les yeux des autres sur toi.
          </div>

          {/* faux mots déjà tapés */}
          <div style={{ display: "flex", gap: 6, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {["attention", "action", "invention"].map((w) =>
            <span key={w} className="cb-chip" style={{ background: "var(--color-success)", color: "#fff", borderColor: "transparent" }}>
                {w}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 8 }}>
        <button className="cb-btn cb-btn-soft" style={{ width: 48, padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <button className="cb-btn cb-btn-primary" style={{ flex: 1 }}>
          Envoyer
        </button>
      </div>
    </CBPage>);

}

// ===========================================================
// GAME OVER / Ranking
// ===========================================================
function CBGameOverScreen({ theme = "light" }) {
  const ranks = [
  { rank: 1, name: "Sofian", color: "#FF6A3D", score: 4280, points: 50, level: "Confirmé" },
  { rank: 2, name: "Léa", color: "#2B6DE8", score: 3120, points: 25 },
  { rank: 3, name: "Marwan", color: "#18A957", score: 2780, points: 10 },
  { rank: 4, name: "Chloé", color: "#E63CA0", score: 1840, points: 0 },
  { rank: 5, name: "Yanis", color: "#6B4FE8", score: 980, points: 0 }];

  return (
    <CBPage theme={theme}>
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Lobby
        </button>
        <span className="cb-eyebrow">bomb party · partie terminée</span>
        <button className="cb-chip" style={{ height: 28 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h6v6M20 4h-6v6M4 20h6v-6M20 20h-6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Trophy / winner card */}
      <div style={{ padding: "20px 16px 0" }}>
        <div className="cb-card" style={{
          padding: 22, textAlign: "center", position: "relative", overflow: "hidden",
          background: "var(--color-ink)", color: "var(--color-canvas)",
          borderColor: "transparent"
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.18,
            background: "radial-gradient(120% 100% at 50% 0%, var(--cb-brand), transparent 60%)" }} />
          <div className="cb-eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>vainqueur</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 12, position: "relative" }}>
            <CBAvatar name="Sofian" color="#FF6A3D" size={68} ring />
            <div className="cb-display-lg" style={{ fontSize: 32 }}>Sofian</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              <span>4 280 pts</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: "var(--cb-brand)", fontFamily: "var(--font-display)", fontWeight: 800 }}>+50 XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Classement */}
      <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span className="cb-eyebrow">classement</span>
        <span className="cb-eyebrow">+ points</span>
      </div>

      <div className="cb-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {ranks.slice(1).map((r) =>
        <div key={r.name} className="cb-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="cb-mono cb-display-sm" style={{ width: 22, color: "var(--color-ink-subtle)", textAlign: "center", fontSize: 16 }}>
              {String(r.rank).padStart(2, "0")}
            </span>
            <CBAvatar name={r.name} color={r.color} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: "var(--color-ink-muted)" }} className="cb-mono">{r.score.toLocaleString("fr-FR")} pts</div>
            </div>
            {r.points > 0 ?
          <span className="cb-chip" style={{
            background: "var(--cb-brand-tint)", color: "var(--cb-brand)", borderColor: "transparent" }}>
                +{r.points} XP
              </span> :

          <span style={{ fontSize: 10, color: "var(--color-ink-subtle)" }}>—</span>
          }
          </div>
        )}
      </div>

      {/* Rejouer block — pattern universel : les joueurs restent, on relance sans tout reconfigurer */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          paddingLeft: 4
        }}>
          <span style={{ display: "flex" }}>
            {["#FF6A3D", "#2B6DE8", "#18A957", "#E63CA0", "#6B4FE8"].map((c, i) =>
            <span key={i} style={{
              width: 22, height: 22, borderRadius: 50,
              background: c, border: "2px solid var(--color-canvas)",
              marginLeft: i === 0 ? 0 : -8
            }} />
            )}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
            Les 5 joueurs restent dans la salle
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="cb-btn cb-btn-soft" style={{ flex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Changer
          </button>
          <button className="cb-btn cb-btn-primary" style={{ flex: 2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Rejouer
          </button>
        </div>
      </div>
    </CBPage>);

}

// Export to window
Object.assign(window, {
  CBAvatar, CBPage, CBLogo, CBTopRight,
  CBHomeScreen, CBLobbyScreen,
  CBGameShellInGame, CBGameOverScreen,
  CATEGORIES, LOBBY_GAMES
});