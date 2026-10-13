"use client";

/**
 * Shared building blocks for single-device ("pass-and-play") local game modes.
 * Used by Top Ten, Le Bluffeur and Longueur d'onde to offer a local mode
 * alongside their online (multi-device) mode.
 */

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { getRecentNames, getSavedPlayers, sameName, savePlayers } from "@/lib/saved-players";
import { isOfflineApp } from "@/lib/offline-app";
import { Mascot, MASCOT_COLORS, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ArrowLeft, Check, Crown, Smartphone, Volume2, VolumeX, Wifi, X } from "lucide-react";
import { GameIconBadge, GameIconButton, GameInlineIcon, GameTopRight } from "@/components/games/game-icon-button";
import { isSfxMuted, playSfx, setSfxMuted, subscribeSfxMuted } from "@/lib/sfx";

export type GameMode = "local" | "online";

export function colorForIndex(i: number): MascotColor {
  return MASCOT_COLORS[i % MASCOT_COLORS.length];
}

const NIGHT = "#1E1250";
const SHELL = "relative flex min-h-[100dvh] w-full shrink-0 flex-col items-center text-white";
/** Fond « violet nuit » + pois discrets (DA sticker). L'accent n'est plus utilisé
 *  en halo : on garde la signature pour ne pas casser les appels existants. */
const BG = (accent: string) => {
  void accent;
  return `radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${NIGHT}`;
};

// ── Mode selection ────────────────────────────────────────
export function ModeSelect({
  emoji,
  name,
  tagline,
  onPick,
}: {
  emoji: string;
  name: string;
  tagline: string;
  onPick: (m: GameMode) => void;
}) {
  // App hors-ligne : pas de choix de mode, on part direct en local (avant le 1er paint).
  const offline = isOfflineApp();
  useLayoutEffect(() => {
    if (offline) onPick("local");
  }, [offline, onPick]);
  if (offline) return null;
  void emoji; // gardé pour l'API : un blob remplace l'emoji décoratif

  return (
    <div className={SHELL} style={{ background: BG(""), justifyContent: "center", padding: "calc(env(safe-area-inset-top, 0px) + 72px) 20px calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
      <div className="mb-3"><Mascot size={84} color="purple" mood="happy" arms shadow={false} /></div>
      <h1 className="text-center" style={{ ...DISPLAY, fontSize: "clamp(38px, 11vw, 56px)", lineHeight: 0.95 }}>{name}</h1>
      <p className="mt-3 mb-8 max-w-md text-center text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{tagline}</p>

      <div className="w-full max-w-md space-y-4 sm:max-w-xl">
        {([
          { m: "local" as const, icon: Smartphone, bg: "#FF3EA5", title: "Sur ce téléphone", sub: "On se passe le tél à tour de rôle", tilt: -1.5 },
          { m: "online" as const, icon: Wifi, bg: "#4ECDC4", title: "Plusieurs téléphones", sub: "Chacun sur son tél, en ligne dans la même salle", tilt: 1.5 },
        ]).map((o) => (
          <button
            key={o.m}
            onClick={() => onPick(o.m)}
            className="w-full rounded-[24px] p-5 text-left transition-[translate,box-shadow] active:translate-y-[4px] active:shadow-[0_1px_0_#15082E]"
            style={{ ...stickerStyle(o.bg, 5), color: inkOn(o.bg), rotate: `${o.tilt}deg` }}
          >
            <div className="flex items-center gap-3">
              <GameIconBadge icon={o.icon} bg="#fff" size={48} />
              <div>
                <p style={{ ...DISPLAY, fontSize: 24, lineHeight: 1 }}>{o.title}</p>
                <p className="mt-1 text-[14px] font-semibold">{o.sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Grammaire « sticker » (contour épais + ombre dure), partagée site/app ──
const INK = "#15082E";
const stickerStyle = (bg: string, shadow = 4): React.CSSProperties => ({
  background: bg,
  border: `2.5px solid ${INK}`,
  boxShadow: `0 ${shadow}px 0 ${INK}`,
});

/** Texte lisible sur une couleur pleine : encre foncée ou blanc. */
export function inkOn(hex: string): string {
  let h = hex.replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((c) => c + c).join("");
  const m = h.match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!m) return "#fff";
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.22 ? INK : "#fff";
}

/** Petit saut d'un élément (Web Animations, sans CSS global). */
function hop(el: HTMLElement | null) {
  if (!el || typeof el.animate !== "function") return;
  if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [
      { transform: "translateY(0) scale(1,1)" },
      { transform: "translateY(2px) scale(1.12,0.86)", offset: 0.18 },
      { transform: "translateY(-16px) scale(0.92,1.1)", offset: 0.5 },
      { transform: "translateY(0) scale(1.06,0.94)", offset: 0.8 },
      { transform: "translateY(0) scale(1,1)" },
    ],
    { duration: 520, easing: "ease-out" },
  );
}

/** Placeholders drôles (à la place de « Joueur 1 »). */
const FUNNY = [
  "Le pote en retard",
  "Reine du karaoké",
  "Ramène rien",
  "Le roi du bluff",
  "Dort déjà",
  "Le DJ du soir",
  "Mauvais perdant",
  "Le +1 surprise",
  "Rit trop fort",
  "Toujours au tél",
  "Le chef du barbeuc",
  "Triche un peu",
  "Gagne tout le temps",
  "Arrivée en dernier",
  "Le coloc",
  "Celle qui organise",
];

// ── Players setup (local) ─────────────────────────────────
export function PlayersSetup({
  emoji,
  name,
  min,
  max,
  accent,
  onStart,
  onBack,
  footer,
}: {
  emoji: string;
  name: string;
  min: number;
  max: number;
  accent: string;
  onStart: (names: string[]) => void;
  onBack?: () => void;
  /** Contenu discret sous la table (ex. bouton « Propose ton idée ») */
  footer?: ReactNode;
}) {
  void emoji; // gardé pour l'API (le titre n'affiche plus d'emoji décoratif)
  const blank = () => Array.from({ length: Math.min(max, Math.max(min, 4)) }, () => "");
  const [names, setNames] = useState<string[]>(blank);
  const [sameBand, setSameBand] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const blobs = useRef<(HTMLDivElement | null)[]>([]);
  const focusNext = useRef<number | null>(null);

  // Dernière table + prénoms récents (avant le 1er paint, côté client uniquement)
  useLayoutEffect(() => {
    const last = getSavedPlayers().slice(0, max);
    if (last.length) {
      while (last.length < min) last.push("");
      setNames(last);
      setSameBand(true);
    }
    setRecent(getRecentNames());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusNext.current === null) return;
    inputs.current[focusNext.current]?.focus();
    focusNext.current = null;
  }, [names.length]);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const canStart = filled.length >= min;
  const missing = Math.max(0, min - filled.length);

  const update = (i: number, v: string) => setNames((p) => p.map((n, idx) => (idx === i ? v.slice(0, 16) : n)));
  const add = () => {
    if (names.length >= max) return;
    focusNext.current = names.length;
    setNames((p) => (p.length < max ? [...p, ""] : p));
  };
  const remove = (i: number) =>
    setNames((p) => (p.length > min ? p.filter((_, idx) => idx !== i) : p.map((n, idx) => (idx === i ? "" : n))));
  const newBand = () => { setNames(blank()); setSameBand(false); };
  const addRecent = (r: string) => {
    setNames((p) => {
      const empty = p.findIndex((n) => !n.trim());
      if (empty >= 0) return p.map((n, idx) => (idx === empty ? r : n));
      return p.length < max ? [...p, r] : p;
    });
    setSameBand(false);
  };
  const start = () => {
    if (!canStart) return;
    savePlayers(filled);
    onStart(filled);
  };

  const suggestions = recent.filter((r) => !names.some((n) => sameName(n, r))).slice(0, 8);
  const full = names.length >= max && names.every((n) => n.trim());
  const accentInk = inkOn(accent);

  return (
    <div
      className="relative flex min-h-[100dvh] w-full shrink-0 flex-col text-white"
      style={{
        background: BG(`${accent}38`),
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 64px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5">
        {/* Titre : le jeu en grand, en phrase normale */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[17px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>Qui joue à</p>
          <span
            className="inline-block whitespace-nowrap rounded-full px-3 py-1 text-[14px] font-bold"
            style={{ ...stickerStyle(accent, 3), color: accentInk, transform: "rotate(3deg)" }}
          >
            {min === max ? `${min} joueurs` : `De ${min} à ${max} joueurs`}
          </span>
        </div>
        <h1
          className="mt-0.5"
          style={{ fontFamily: "var(--font-display), system-ui, sans-serif", wordSpacing: "0.12em", fontWeight: 700, fontSize: "clamp(38px, 11vw, 60px)", lineHeight: 0.92, letterSpacing: "-0.04em" }}
        >
          {name}&nbsp;?
        </h1>

        {/* Même bande que la dernière fois ? */}
        {sameBand && (
          <div
            className="mt-5 flex items-center gap-3 rounded-[20px] py-2.5 pl-4 pr-2.5"
            style={{ ...stickerStyle("#FFD23F"), color: INK, transform: "rotate(-1deg)" }}
          >
            <p className="flex-1 text-[15px] font-bold leading-tight">La même bande que la dernière fois&nbsp;?</p>
            <button
              type="button"
              onClick={newBand}
              className="min-h-11 shrink-0 rounded-full px-3.5 text-[14px] font-bold active:translate-y-[2px]"
              style={{ background: "#fff", border: `2.5px solid ${INK}`, color: INK }}
            >
              Nouvelle bande
            </button>
          </div>
        )}

        {/* La table : un blob par joueur, prénom en gros dessous */}
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          {names.map((n, i) => {
            const col = colorForIndex(i);
            const pal = MASCOT_PALETTE[col];
            const ink = inkOn(pal.body);
            const canRemove = names.length > min || n.trim() !== "";
            return (
              <div key={i} className="relative flex flex-col items-center" style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
                <div className="relative z-[1] -mb-5" ref={(el) => { blobs.current[i] = el; }} onPointerDown={() => hop(blobs.current[i])}>
                  <Mascot size={56} color={col} mood={n.trim() ? (i % 3 === 0 ? "laughing" : i % 3 === 1 ? "happy" : "wink") : "thinking"} shadow={false} delay={i * 0.2} />
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label={n.trim() ? `Retirer ${n.trim()}` : "Retirer ce joueur"}
                      className="absolute -right-6 -top-3 grid h-11 w-11 place-items-center"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full text-[17px] font-bold leading-none" style={{ background: "#fff", color: INK, border: `2.5px solid ${INK}` }}><X size={15} strokeWidth={3.2} aria-hidden /></span>
                    </button>
                  )}
                </div>
                <input
                  ref={(el) => { inputs.current[i] = el; }}
                  value={n}
                  onChange={(e) => update(i, e.target.value)}
                  onFocus={() => hop(blobs.current[i])}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (i + 1 < names.length) inputs.current[i + 1]?.focus();
                    else if (names.length < max) add();
                    else (e.target as HTMLInputElement).blur();
                  }}
                  placeholder={FUNNY[i % FUNNY.length]}
                  aria-label={`Prénom du joueur ${i + 1}`}
                  enterKeyHint="next"
                  autoCorrect="off" autoCapitalize="words" autoComplete="off" spellCheck={false}
                  className="zz-name w-full min-w-0 rounded-[18px] px-2 pb-2 pt-[22px] text-center outline-none"
                  style={{
                    ...stickerStyle(pal.body),
                    color: ink,
                    fontFamily: "var(--font-display), system-ui, sans-serif", wordSpacing: "0.12em",
                    fontWeight: 700,
                    fontSize: n ? 21 : 16,
                    letterSpacing: n ? "-0.01em" : 0,
                    ["--ph" as string]: ink === "#fff" ? "rgba(255,255,255,0.72)" : "rgba(21,8,46,0.55)",
                  }}
                />
              </div>
            );
          })}

          {/* Ajouter un pote */}
          {names.length < max && (
            <button
              type="button"
              onClick={add}
              className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-[18px] active:translate-y-[2px]"
              style={{ border: "2.5px dashed rgba(255,255,255,0.35)", color: "#fff" }}
              aria-label="Ajouter un joueur"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full text-[34px] font-bold leading-none" style={{ ...stickerStyle("#fff", 4), color: INK }}>+</span>
              <span className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Ajouter un pote</span>
            </button>
          )}
        </div>

        {/* Prénoms récents : un tap = le pote est ajouté */}
        {suggestions.length > 0 && !full && (
          <div className="mt-5">
            <p className="text-[15px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>Ils ont déjà joué, un tap et c&apos;est réglé :</p>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {suggestions.map((r, k) => {
                const pal = MASCOT_PALETTE[colorForIndex(k + 2)];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => addRecent(r)}
                    className="min-h-11 rounded-full px-3.5 text-[15px] font-bold active:translate-y-[2px]"
                    style={{ ...stickerStyle(pal.hi, 3), color: INK, transform: `rotate(${k % 2 ? 2 : -2}deg)` }}
                  >
                    + {r}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {footer && <div className="mt-6 flex justify-center">{footer}</div>}

        <div className="min-h-6 flex-1" />

        {/* Lancer : collant en bas quand la liste est longue */}
        <div
          className="sticky z-[2] -mx-5 px-5 pt-6"
          style={{ bottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)", marginBottom: "calc(-1 * (env(safe-area-inset-bottom, 0px) + 16px))", background: `linear-gradient(180deg, transparent, ${NIGHT} 40%)` }}
        >
          <button
            type="button"
            onClick={start}
            disabled={!canStart}
            className="h-[60px] w-full rounded-full text-[20px] transition-transform active:translate-y-[3px]"
            style={{
              ...(canStart ? stickerStyle(accent, 5) : { background: "#2A1F4D", border: `2.5px solid ${INK}`, boxShadow: `0 5px 0 ${INK}` }),
              color: canStart ? accentInk : "rgba(255,255,255,0.75)",
              fontFamily: "var(--font-display), system-ui, sans-serif", wordSpacing: "0.12em",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            {canStart ? "C'est parti !" : `Encore ${missing} joueur${missing > 1 ? "s" : ""} !`}
          </button>
          {/* Dans l'app, la croix « quitter » fait déjà le retour */}
          {onBack && !isOfflineApp() && (
            <button type="button" onClick={onBack} className="mx-auto mt-1 block min-h-11 px-4 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
              <GameInlineIcon icon={ArrowLeft} /> Changer de mode
            </button>
          )}
        </div>
      </div>
      <style>{`.zz-name::placeholder{color:var(--ph);opacity:1;font-family:"DM Sans",system-ui,sans-serif;font-weight:600;letter-spacing:0;word-spacing:0}`}</style>
    </div>
  );
}

// ── Pass-the-phone screen ─────────────────────────────────
export function PassScreen({
  toName,
  colorIndex,
  hint,
  buttonLabel = "C'est moi !",
  accent = "#5B36D6",
  onReady,
}: {
  toName: string;
  colorIndex: number;
  hint?: string;
  buttonLabel?: React.ReactNode;
  accent?: string;
  onReady: () => void;
}) {
  void accent; // gardé pour l'API : fond violet nuit commun
  const col = colorForIndex(colorIndex);
  const pal = MASCOT_PALETTE[col];
  const blob = useRef<HTMLDivElement | null>(null);
  // Le téléphone change de main : petit « whoosh »
  useEffect(() => { playSfx("whoosh", { volume: 0.45 }); }, [toName]);
  return (
    <div
      className={SHELL}
      style={{
        background: BG(""),
        justifyContent: "center",
        padding: "calc(env(safe-area-inset-top, 0px) + 72px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      <p className="mb-2 text-[18px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>Passe le téléphone à…</p>
      <div ref={blob} onPointerDown={() => hop(blob.current)} className="relative z-[1] -mb-6">
        <Mascot size={130} color={col} mood="wink" arms shadow={false} />
      </div>
      <h1
        className="rounded-[24px] px-6 pb-3 pt-7 text-center"
        style={{
          ...stickerStyle(pal.body, 6),
          color: inkOn(pal.body),
          transform: "rotate(-2deg)",
          ...DISPLAY,
          fontSize: "clamp(36px, 11vw, 56px)",
          lineHeight: 1,
          maxWidth: "100%",
          overflowWrap: "anywhere",
        }}
      >
        {toName}
      </h1>
      {hint && <p className="mt-6 max-w-sm text-center text-[16px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{hint}</p>}
      <ZButton onClick={onReady} bg="#fff" className="mt-8 max-w-sm">
        {buttonLabel}
      </ZButton>
    </div>
  );
}

// ── Generic centered shell (loading etc.) ─────────────────
export function LocalShell({ accent = "#5B36D6", center, children }: { accent?: string; center?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={SHELL}
      style={{
        background: BG(accent),
        justifyContent: center ? "center" : "flex-start",
        padding: "calc(env(safe-area-inset-top, 0px) + 72px) 20px calc(env(safe-area-inset-bottom, 0px) + 20px)",
      }}
    >
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Kit « sticker » des jeux locaux (DA de l'app Zinzin, aussi sur le site)
// Blocs pleins, contour encre épais, ombre dure décalée, Clash Display.
// Aucun CSS global : styles inline + Tailwind de base.
// ══════════════════════════════════════════════════════════

/** Palette pleine de la DA. */
export const ZZ = {
  ink: INK,
  yellow: "#FFD23F",
  pink: "#FF3EA5",
  violet: "#7A4EE8",
  mint: "#3DDC97",
  sky: "#4ECDC4",
  coral: "#FF6B5B",
  cream: "#FFF6E5",
  night: NIGHT,
  deep: "#0B0620",
} as const;

/** Style de titre : Clash Display gras, serré. */
export const DISPLAY: CSSProperties = {
  fontFamily: "var(--font-display), system-ui, sans-serif",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  wordSpacing: "0.12em",
};

/** Fond plein (couleur du jeu ou violet nuit) + pois. */
export function zBackground(color: string = NIGHT, dots = true): string {
  const dot = inkOn(color) === INK ? "rgba(21,8,46,0.08)" : "rgba(255,255,255,0.06)";
  return dots ? `radial-gradient(${dot} 1.4px, transparent 1.6px) 0 0 / 22px 22px, ${color}` : color;
}

/**
 * Écran plein de jeu : rien sous la barre d'état ni sous la croix « quitter »
 * (haut = safe-area + 72 px), bas = safe-area. Bouton son en haut à droite.
 */
export function ZScreen({
  bg = NIGHT,
  dots = true,
  center = false,
  sound = true,
  tools,
  children,
  className,
  style,
  max = "md",
}: {
  bg?: string;
  dots?: boolean;
  center?: boolean;
  /** Bouton son (coupure globale) en haut à droite */
  sound?: boolean;
  /** Boutons ronds supplémentaires en haut à droite */
  tools?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max?: "sm" | "md" | "lg";
}) {
  const ink = inkOn(bg);
  return (
    <div
      className="relative flex min-h-[100dvh] w-full shrink-0 flex-col"
      style={{
        background: zBackground(bg, dots),
        color: ink === INK ? INK : "#fff",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        ...style,
      }}
    >
      {(sound || tools) && (
        <GameTopRight>
          {tools}
          {sound && <SoundButton />}
        </GameTopRight>
      )}
      <div
        className={`mx-auto flex w-full flex-1 flex-col px-5 ${max === "sm" ? "max-w-sm" : max === "lg" ? "max-w-xl" : "max-w-md"} ${center ? "justify-center" : ""} ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}

/** Coupure du son globale (src/lib/sfx.ts), réactive. */
export function useSfxMuted(): [boolean, (v: boolean) => void] {
  const muted = useSyncExternalStore(subscribeSfxMuted, isSfxMuted, () => false);
  return [muted, setSfxMuted];
}

/** Bouton rond son on/off (une seule coupure pour toute l'app). */
export function SoundButton({ bg = "#fff" }: { bg?: string }) {
  const [muted, setMuted] = useSfxMuted();
  return (
    <GameIconButton
      icon={muted ? VolumeX : Volume2}
      label={muted ? "Remettre le son" : "Couper le son"}
      active={muted}
      bg={bg}
      onClick={() => {
        setMuted(!muted);
        if (muted) playSfx("toggle", { volume: 0.6 });
      }}
    />
  );
}

/** Gros bouton plein (contour, ombre dure, s'enfonce à l'appui). */
export function ZButton({
  onClick,
  children,
  bg = "#FFD23F",
  color,
  size = "lg",
  disabled,
  className,
  style,
  label,
}: {
  onClick?: () => void;
  children: ReactNode;
  bg?: string;
  color?: string;
  size?: "lg" | "md" | "sm";
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  const dims =
    size === "lg"
      ? "min-h-[60px] text-[21px] px-6 shadow-[0_5px_0_#15082E] active:shadow-[0_1px_0_#15082E] active:translate-y-[4px]"
      : size === "md"
        ? "min-h-[52px] text-[18px] px-5 shadow-[0_4px_0_#15082E] active:shadow-[0_1px_0_#15082E] active:translate-y-[3px]"
        : "min-h-11 text-[15px] px-4 shadow-[0_3px_0_#15082E] active:shadow-[0_1px_0_#15082E] active:translate-y-[2px]";
  const fill = disabled ? "#3A2C6E" : bg;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex w-full items-center justify-center gap-2 rounded-full text-center leading-tight transition-[translate,box-shadow] duration-100 disabled:active:translate-y-0 ${dims} ${className ?? ""}`}
      style={{
        background: fill,
        color: disabled ? "rgba(255,255,255,0.7)" : color ?? inkOn(bg),
        border: `${size === "sm" ? 2.5 : 3}px solid ${INK}`,
        ...(size === "sm" ? { fontWeight: 800 } : DISPLAY),
        letterSpacing: size === "sm" ? 0 : "-0.01em",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Bloc « sticker » plein (carte). */
export function ZCard({
  bg = "#fff",
  tilt = 0,
  shadow = 5,
  radius = 24,
  children,
  className,
  style,
}: {
  bg?: string;
  tilt?: number;
  shadow?: number;
  radius?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{
        background: bg,
        color: inkOn(bg),
        border: `3px solid ${INK}`,
        boxShadow: shadow ? `0 ${shadow}px 0 ${INK}` : undefined,
        borderRadius: radius,
        rotate: tilt ? `${tilt}deg` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Titre en Clash Display (pas de petites capitales espacées). */
export function ZTitle({
  children,
  size = 40,
  className,
  style,
  as: Tag = "h2",
}: {
  children: ReactNode;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2" | "h3" | "p" | "div";
}) {
  return (
    <Tag className={className} style={{ ...DISPLAY, fontSize: size, lineHeight: 0.98, overflowWrap: "break-word", ...style }}>
      {children}
    </Tag>
  );
}

/** Étiquette sticker inclinée, en phrase normale (Manche 2/5, Soirée 18+…). */
export function ZChip({ children, bg = "#fff", tilt = -2, className, style }: { children: ReactNode; bg?: string; tilt?: number; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={`inline-flex min-h-8 w-fit self-start items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[14px] font-bold leading-none ${className ?? ""}`}
      style={{ background: bg, color: inkOn(bg), border: `2.5px solid ${INK}`, boxShadow: `0 3px 0 ${INK}`, rotate: tilt ? `${tilt}deg` : undefined, ...style }}
    >
      {children}
    </span>
  );
}

/** Tuile d'option sélectionnable : pleine dans sa couleur si active, blanche sinon. */
export function ZChoice({
  active,
  onClick,
  color = "#FFD23F",
  children,
  className,
  style,
  tilt = 0,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tilt?: number;
  label?: string;
}) {
  const bg = active ? color : "#fff";
  return (
    <button
      type="button"
      onClick={() => { if (!active) playSfx("select", { volume: 0.5 }); onClick(); }}
      aria-pressed={active}
      aria-label={label}
      className={`relative rounded-[20px] p-3.5 text-left transition-[translate,box-shadow,rotate] duration-150 shadow-[0_4px_0_#15082E] active:translate-y-[3px] active:shadow-[0_1px_0_#15082E] ${className ?? ""}`}
      style={{
        background: bg,
        color: inkOn(bg),
        border: `3px solid ${INK}`,
        rotate: active ? `${tilt || -1.5}deg` : tilt ? `${tilt}deg` : undefined,
        touchAction: "manipulation",
        ...style,
      }}
    >
      {active && (
        <span
          aria-hidden
          className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full"
          style={{ background: "#fff", color: INK, border: `2.5px solid ${INK}` }}
        >
          <Check size={15} strokeWidth={3.4} />
        </span>
      )}
      {children}
    </button>
  );
}

/** Classement final en stickers (1er en jaune avec couronne). */
export function ZRanking({
  rows,
  unit = "pts",
}: {
  rows: { name: string; score: number | string; colorIndex: number; note?: ReactNode }[];
  unit?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      {rows.map((r, i) => {
        const first = i === 0;
        const bg = first ? "#FFD23F" : "#fff";
        return (
          <div
            key={`${r.name}-${i}`}
            className="flex items-center gap-3 rounded-[20px] py-2.5 pl-3 pr-4"
            style={{ ...stickerStyle(bg, first ? 5 : 4), border: `3px solid ${INK}`, color: INK, rotate: first ? "-1.5deg" : i % 2 ? "0.8deg" : "-0.6deg" }}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[17px]" style={{ ...DISPLAY, background: first ? INK : "#F1ECFF", color: first ? "#FFD23F" : INK }}>
              {first ? <Crown size={18} strokeWidth={2.8} aria-hidden /> : i + 1}
            </span>
            <Mascot size={38} color={colorForIndex(r.colorIndex)} mood={first ? "laughing" : "happy"} shadow={false} bob={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[19px] leading-tight" style={DISPLAY}>{r.name}</p>
              {r.note && <p className="text-[13px] font-semibold leading-tight" style={{ color: "#4A3A66" }}>{r.note}</p>}
            </div>
            <span className="shrink-0 text-[22px] leading-none" style={DISPLAY}>
              {r.score}
              <span className="ml-1 text-[13px] font-bold" style={{ fontFamily: "inherit", letterSpacing: 0 }}>{unit}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Lien discret secondaire (texte souligné, ≥ 44 px). */
export function ZLink({ onClick, children, color = "rgba(255,255,255,0.85)", className }: { onClick: () => void; children: ReactNode; color?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mx-auto flex min-h-11 items-center justify-center gap-1.5 px-4 text-[15px] font-bold underline decoration-2 underline-offset-4 ${className ?? ""}`}
      style={{ color }}
    >
      {children}
    </button>
  );
}

/**
 * Remonte en haut à chaque changement d'écran (l'app fait défiler le jeu dans un
 * conteneur fixe : sans ça, l'écran suivant s'ouvrirait à moitié défilé).
 */
export function useScrollTopOn(dep: unknown) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>("body div").forEach((el) => {
      if (el.scrollTop > 0) el.scrollTop = 0;
    });
  }, [dep]);
}
