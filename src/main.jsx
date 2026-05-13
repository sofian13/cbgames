// ===========================================================
// CB Games — Main canvas: artboards + tweaks
// ===========================================================

import React from "react";
import { createRoot } from "react-dom/client";

// Side-effect imports — each module attaches its components to window
import "./design-canvas.jsx";
import "./ios-frame.jsx";
import "./tweaks-panel.jsx";
import "./screens-core.jsx";
import "./screens-games.jsx";
import "./screens-cards.jsx";
import "./screens-cards-landscape.jsx";
import "./screens-president.jsx";

const {
  DesignCanvas, DCSection, DCArtboard,
  IOSDevice,
  TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakSelect, TweakToggle,
  useTweaks,
  CBHomeScreen, CBLobbyScreen, CBGameShellInGame, CBGameOverScreen,
  CBBombPartyScreen, CBQuizScreen, CBLoupGarouScreen, CBMotionTennisController, CBUndercoverScreen,
  CBContreeScreen, CB8AmericainScreen, CBContreeBiddingScreen, CB8AmericainRulesScreen, CBContreeSetupScreen,
  CBContreeLandscape, CB8AmericainLandscape, CBPresidentLandscape,
  CBPresidentRanking, CBPresidentExchange, CBPresidentPlaying,
} = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": "#FF6A3D",
  "radius": "round",
  "density": "cozy",
  "displayWeight": 900,
  "categoryAccent": "vibrant",
  "showEmoji": true
}/*EDITMODE-END*/;

const BRAND_SWATCHES = [
  "#FF6A3D", // sunset orange — default
  "#0A0A0A", // monochrome black
  "#E63CA0", // party pink
  "#2B6DE8", // electric blue
];

const RADIUS_PRESETS = {
  sharp: { sm:  4, md:  6, lg:  8, xl: 10, "2xl": 12 },
  round: { sm: 10, md: 14, lg: 18, xl: 22, "2xl": 28 },
  pill:  { sm: 14, md: 18, lg: 22, xl: 28, "2xl": 32 },
};

const DENSITY_PRESETS = {
  compact:     { s3: 8,  s4: 12, s5: 16, s6: 18 },
  cozy:        { s3: 12, s4: 16, s5: 20, s6: 24 },
  comfortable: { s3: 16, s4: 20, s5: 26, s6: 32 },
};

// Apply tweaks by injecting a stylesheet that overrides both themes.
function applyTweaks(t) {
  const r = RADIUS_PRESETS[t.radius] || RADIUS_PRESETS.round;
  const d = DENSITY_PRESETS[t.density] || DENSITY_PRESETS.cozy;
  const css = `
    [data-theme="light"], [data-theme="dark"] {
      --cb-brand: ${t.brand};
      --cb-brand-tint: ${hexToRgba(t.brand, 0.14)};
      --cb-brand-ink: ${pickInkOn(t.brand)};
      --r-sm: ${r.sm}px;
      --r-md: ${r.md}px;
      --r-lg: ${r.lg}px;
      --r-xl: ${r.xl}px;
      --r-2xl: ${r["2xl"]}px;
      --s-3: ${d.s3}px;
      --s-4: ${d.s4}px;
      --s-5: ${d.s5}px;
      --s-6: ${d.s6}px;
    }
    .cb-app .cb-display-xl, .cb-app .cb-display-lg, .cb-app .cb-display-md, .cb-app .cb-display-sm, .cb-app h1, .cb-app h2, .cb-app h3 {
      font-weight: ${t.displayWeight} !important;
    }
    ${t.categoryAccent === "mono" ? `
      .cb-app [class*="cb-chip"]:not(.cb-chip-solid):not(.cb-chip-live) .cb-dot { background: var(--color-ink-muted) !important; }
    ` : ""}
    ${!t.showEmoji ? `
      .cb-no-emoji-hide { display: none !important; }
    ` : ""}
  `;
  let tag = document.getElementById("cb-tweak-overrides");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "cb-tweak-overrides";
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

function hexToRgba(hex, a = 1) {
  const m = hex.replace("#","").match(/.{2}/g);
  if (!m) return hex;
  const [r,g,b] = m.map(h => parseInt(h, 16));
  return `rgba(${r},${g},${b},${a})`;
}
function pickInkOn(hex) {
  const m = hex.replace("#","").match(/.{2}/g);
  if (!m) return "#000";
  const [r,g,b] = m.map(h => parseInt(h, 16));
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  return lum > 0.6 ? "#0A0A0A" : "#FFFFFF";
}

// Wrap an artboard's IOSDevice with no inner padding (we paint to edges)
function Frame({ children, dark = false }) {
  return (
    <IOSDevice width={402} height={852} dark={dark}>
      {children}
    </IOSDevice>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyTweaks(t); }, [t]);

  return (
    <>
      <DesignCanvas>

        {/* ===== Section 1 — Entrée ===== */}
        <DCSection id="entree" title="Entrée"
                   subtitle="Page d'accueil — créer ou rejoindre une salle. Light et dark à dispo.">
          <DCArtboard id="home-light" label="Home · Light" width={402} height={852}>
            <Frame><CBHomeScreen theme="light" /></Frame>
          </DCArtboard>
          <DCArtboard id="home-dark" label="Home · Dark" width={402} height={852}>
            <Frame dark><CBHomeScreen theme="dark" /></Frame>
          </DCArtboard>
        </DCSection>

        {/* ===== Section 2 — Lobby ===== */}
        <DCSection id="lobby" title="Lobby"
                   subtitle="Choix du jeu, ready check, joueurs. Deux états : sélection en cours et tout le monde prêt.">
          <DCArtboard id="lobby-pick-light" label="Lobby · choisir" width={402} height={852}>
            <Frame><CBLobbyScreen theme="light" state="picking" /></Frame>
          </DCArtboard>
          <DCArtboard id="lobby-ready-light" label="Lobby · tout prêt" width={402} height={852}>
            <Frame><CBLobbyScreen theme="light" state="ready" /></Frame>
          </DCArtboard>
          <DCArtboard id="lobby-pick-dark" label="Lobby · dark" width={402} height={852}>
            <Frame dark><CBLobbyScreen theme="dark" state="picking" /></Frame>
          </DCArtboard>
        </DCSection>

        {/* ===== Section 3 — Game Shell ===== */}
        <DCSection id="shell" title="Game Shell"
                   subtitle="Le cadre commun à tous les jeux : HUD en match, fin de partie et classement.">
          <DCArtboard id="shell-ingame" label="En match · HUD" width={402} height={852}>
            <Frame dark><CBGameShellInGame theme="dark" /></Frame>
          </DCArtboard>
          <DCArtboard id="shell-gameover" label="Fin de partie · classement" width={402} height={852}>
            <Frame><CBGameOverScreen theme="light" /></Frame>
          </DCArtboard>
        </DCSection>

        {/* ===== Section 4 — Jeux retravaillés ===== */}
        <DCSection id="games" title="Jeux retravaillés"
                   subtitle="Bomb Party · Quiz / Roast · Loup-Garou · Motion Tennis controller. Les 4 jeux où il y avait le plus à gagner en UX.">

          <DCArtboard id="bomb-party" label="Bomb Party · tension" width={402} height={852}>
            <Frame dark><CBBombPartyScreen theme="dark" danger={0.7} /></Frame>
          </DCArtboard>

          <DCArtboard id="quiz-answering" label="Speed Quiz · réponse" width={402} height={852}>
            <Frame><CBQuizScreen theme="light" mode="answering" /></Frame>
          </DCArtboard>

          <DCArtboard id="quiz-roast" label="Roast Quiz · inflige un malus" width={402} height={852}>
            <Frame><CBQuizScreen theme="light" mode="roast" /></Frame>
          </DCArtboard>

          <DCArtboard id="loup-night" label="Loup-Garou · nuit" width={402} height={852}>
            <Frame dark><CBLoupGarouScreen phase="night" /></Frame>
          </DCArtboard>

          <DCArtboard id="loup-day" label="Loup-Garou · jour" width={402} height={852}>
            <Frame><CBLoupGarouScreen phase="day" /></Frame>
          </DCArtboard>

          <DCArtboard id="tennis-calibrating" label="Motion Tennis · calibrage" width={402} height={852}>
            <Frame><CBMotionTennisController theme="light" state="calibrating" /></Frame>
          </DCArtboard>

          <DCArtboard id="tennis-ready" label="Motion Tennis · en jeu" width={402} height={852}>
            <Frame dark><CBMotionTennisController theme="dark" state="ready" /></Frame>
          </DCArtboard>

          <DCArtboard id="undercover-end" label="Undercover · fin de manche → rejouer" width={402} height={852}>
            <Frame><CBUndercoverScreen theme="light" /></Frame>
          </DCArtboard>

        </DCSection>

        {/* ===== Section 5 — Jeux de cartes ===== */}
        <DCSection id="cards" title="Jeux de cartes"
                   subtitle="Vraies cartes (10♦ = 10 carreaux, V/D/R illustrés). La Contrée (Belote 2v2 avec coinche + belote-rebelote) + 8 Américain (7 cartes spéciales).">

          <DCArtboard id="contree-setup" label="La Contrée · réglages partie" width={402} height={852}>
            <Frame><CBContreeSetupScreen theme="light" /></Frame>
          </DCArtboard>

          <DCArtboard id="contree-enchere" label="La Contrée · enchères + coinche" width={402} height={852}>
            <Frame><CBContreeBiddingScreen theme="light" /></Frame>
          </DCArtboard>

          <DCArtboard id="contree" label="La Contrée · ton tour (belote prête)" width={402} height={852}>
            <Frame dark><CBContreeScreen theme="dark" /></Frame>
          </DCArtboard>

          <DCArtboard id="huit-americain-rules" label="8 Américain · règles spéciales" width={402} height={852}>
            <Frame><CB8AmericainRulesScreen theme="light" /></Frame>
          </DCArtboard>

          <DCArtboard id="huit-americain" label="8 Américain · 8 joué" width={402} height={852}>
            <Frame><CB8AmericainScreen theme="light" state="playing" /></Frame>
          </DCArtboard>

          <DCArtboard id="huit-americain-pick" label="8 Américain · choix couleur" width={402} height={852}>
            <Frame><CB8AmericainScreen theme="light" state="pick-suit" /></Frame>
          </DCArtboard>

        </DCSection>

        {/* ===== Section 6 — Le Président (portrait : setup, échange, rangs) ===== */}
        <DCSection id="president" title="Le Président · setup & révélations"
                   subtitle="3-7 joueurs. Hiérarchie sociale et échange forcé entre manches : le Trou-du-cul donne ses 2 meilleures cartes au Président.">

          <DCArtboard id="president-ranking" label="Président · révélation des rangs" width={402} height={852}>
            <Frame dark><CBPresidentRanking theme="dark" /></Frame>
          </DCArtboard>

          <DCArtboard id="president-exchange" label="Président · échange forcé (POV Trou)" width={402} height={852}>
            <Frame dark><CBPresidentExchange theme="dark" /></Frame>
          </DCArtboard>

          <DCArtboard id="president-playing-portrait" label="Président · trio à battre (portrait)" width={402} height={852}>
            <Frame dark><CBPresidentPlaying theme="dark" /></Frame>
          </DCArtboard>

        </DCSection>

        {/* ===== Section 7 — Mode paysage (gameplay) ===== */}
        <DCSection id="landscape" title="Mode paysage · gameplay"
                   subtitle="Quand tu tournes le tel, les jeux de cartes passent en grand format. Vraies cartes (As = 1), feutre vert texturé avec pattern de couleur, timer de tour, joueurs autour de la table.">

          <DCArtboard id="contree-landscape" label="La Contrée · paysage" width={852} height={402}>
            <CBContreeLandscape />
          </DCArtboard>

          <DCArtboard id="8a-landscape" label="8 Américain · paysage" width={852} height={402}>
            <CB8AmericainLandscape />
          </DCArtboard>

          <DCArtboard id="president-landscape" label="Le Président · paysage" width={852} height={402}>
            <CBPresidentLandscape />
          </DCArtboard>

        </DCSection>

      </DesignCanvas>

      {/* ===== Tweaks panel ===== */}
      <TweaksPanel title="Tweaks · CB Games">
        <TweakSection label="Identité">
          <TweakColor
            label="Couleur brand"
            value={t.brand}
            options={BRAND_SWATCHES}
            onChange={(v) => setTweak("brand", v)}
          />
          <TweakRadio
            label="Accent catégories"
            value={t.categoryAccent}
            options={[
              { label: "Vibrant", value: "vibrant" },
              { label: "Mono", value: "mono" },
            ]}
            onChange={(v) => setTweak("categoryAccent", v)}
          />
        </TweakSection>

        <TweakSection label="Typo & formes">
          <TweakSelect
            label="Poids display"
            value={t.displayWeight}
            options={[
              { label: "Bold · 700",       value: 700 },
              { label: "Extra Bold · 800", value: 800 },
              { label: "Black · 900",      value: 900 },
            ]}
            onChange={(v) => setTweak("displayWeight", Number(v))}
          />
          <TweakRadio
            label="Coins"
            value={t.radius}
            options={[
              { label: "Sharp", value: "sharp" },
              { label: "Round", value: "round" },
              { label: "Pill",  value: "pill" },
            ]}
            onChange={(v) => setTweak("radius", v)}
          />
          <TweakRadio
            label="Densité"
            value={t.density}
            options={[
              { label: "Compact", value: "compact" },
              { label: "Cozy",    value: "cozy" },
              { label: "Confort", value: "comfortable" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
        </TweakSection>

        <TweakSection label="Contenu">
          <TweakToggle
            label="Emoji sur les cartes"
            value={t.showEmoji}
            onChange={(v) => setTweak("showEmoji", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
