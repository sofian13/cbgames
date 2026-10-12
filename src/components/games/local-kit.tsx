"use client";

/**
 * Shared building blocks for single-device ("pass-and-play") local game modes.
 * Used by Top Ten, Le Bluffeur and Longueur d'onde to offer a local mode
 * alongside their online (multi-device) mode.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getRecentNames, getSavedPlayers, sameName, savePlayers } from "@/lib/saved-players";
import { isOfflineApp } from "@/lib/offline-app";
import { Mascot, MASCOT_COLORS, MASCOT_PALETTE, type MascotColor } from "@/components/Mascot";
import { ArrowLeft, Smartphone, Wifi, X } from "lucide-react";
import { GameIconBadge, GameInlineIcon } from "@/components/games/game-icon-button";

export type GameMode = "local" | "online";

export function colorForIndex(i: number): MascotColor {
  return MASCOT_COLORS[i % MASCOT_COLORS.length];
}

const SHELL = "relative flex min-h-[100svh] flex-col items-center text-white";
const BG = (accent: string) =>
  `radial-gradient(circle at 50% 12%, ${accent}, transparent 45%), linear-gradient(180deg, #0A0420 0%, #0E0828 100%)`;

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
    <div className={SHELL} style={{ background: BG("rgba(91,54,214,0.35)"), justifyContent: "center", padding: 24 }}>
      <div className="mb-3"><Mascot size={84} color="purple" mood="happy" arms shadow={false} /></div>
      <h1 className="cb-display-lg text-center sm:text-5xl">{name}</h1>
      <p className="mt-2 mb-8 max-w-md text-center text-sm sm:text-base" style={{ color: "var(--text-dim)" }}>{tagline}</p>

      <div className="w-full max-w-md space-y-3 sm:max-w-xl">
        <button
          onClick={() => onPick("local")}
          className="w-full rounded-3xl border p-5 text-left transition active:scale-[0.99]"
          style={{ background: "linear-gradient(140deg, rgba(255,62,165,0.18), rgba(255,255,255,0.04))", borderColor: "rgba(255,62,165,0.4)" }}
        >
          <div className="flex items-center gap-3">
            <GameIconBadge icon={Smartphone} bg="#FF3EA5" size={48} />
            <div>
              <p className="cb-display-sm">Sur ce téléphone</p>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>On se passe le tél à tour de rôle (pass-and-play)</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onPick("online")}
          className="w-full rounded-3xl border p-5 text-left transition active:scale-[0.99]"
          style={{ background: "linear-gradient(140deg, rgba(78,205,196,0.16), rgba(255,255,255,0.04))", borderColor: "rgba(78,205,196,0.4)" }}
        >
          <div className="flex items-center gap-3">
            <GameIconBadge icon={Wifi} bg="#4ECDC4" size={48} />
            <div>
              <p className="cb-display-sm">Plusieurs téléphones</p>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>Chacun sur son tél, en ligne dans la même salle</p>
            </div>
          </div>
        </button>
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
function inkOn(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
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
}: {
  emoji: string;
  name: string;
  min: number;
  max: number;
  accent: string;
  onStart: (names: string[]) => void;
  onBack?: () => void;
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
      className="relative flex min-h-[100svh] w-full flex-col text-white"
      style={{
        background: BG(`${accent}38`),
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 64px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5">
        {/* Titre : le jeu en grand, en phrase normale */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Qui joue à</p>
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

        <div className="min-h-6 flex-1" />

        {/* Lancer : collant en bas quand la liste est longue */}
        <div
          className="sticky z-[2] -mx-5 px-5 pt-6"
          style={{ bottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)", marginBottom: "calc(-1 * (env(safe-area-inset-bottom, 0px) + 16px))", background: "linear-gradient(180deg, transparent, rgba(10,4,32,0.92) 40%)" }}
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
          {onBack && (
            <button type="button" onClick={onBack} className="mx-auto mt-1 block min-h-11 px-4 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
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
  buttonLabel = "C'est moi — ouvrir",
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
  const col = colorForIndex(colorIndex);
  const pal = MASCOT_PALETTE[col];
  const blob = useRef<HTMLDivElement | null>(null);
  return (
    <div className={SHELL} style={{ background: BG(`${accent}30`), justifyContent: "center", padding: 24 }}>
      <p className="mb-2 text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>Passe le téléphone à…</p>
      <div ref={blob} onPointerDown={() => hop(blob.current)} className="relative z-[1] -mb-6">
        <Mascot size={130} color={col} mood="wink" arms shadow={false} />
      </div>
      <h1
        className="rounded-[24px] px-6 pb-3 pt-7 text-center"
        style={{
          ...stickerStyle(pal.body, 5),
          color: inkOn(pal.body),
          transform: "rotate(-2deg)",
          fontFamily: "var(--font-display), system-ui, sans-serif", wordSpacing: "0.12em",
          fontWeight: 700,
          fontSize: "clamp(36px, 11vw, 56px)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          maxWidth: "100%",
          overflowWrap: "anywhere",
        }}
      >
        {toName}
      </h1>
      {hint && <p className="mt-5 max-w-sm text-center text-[16px]" style={{ color: "rgba(255,255,255,0.75)" }}>{hint}</p>}
      <button
        onClick={onReady}
        className="mt-8 h-[58px] w-full max-w-xs rounded-full text-[18px] active:translate-y-[3px] sm:max-w-sm"
        style={{ ...stickerStyle("#fff", 5), color: INK, fontFamily: "var(--font-display), system-ui, sans-serif", wordSpacing: "0.12em", fontWeight: 700 }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// ── Generic centered shell (loading etc.) ─────────────────
export function LocalShell({ accent = "#5B36D6", center, children }: { accent?: string; center?: boolean; children: React.ReactNode }) {
  return (
    <div className={SHELL} style={{ background: BG(`${accent}28`), justifyContent: center ? "center" : "flex-start", padding: "24px 20px" }}>
      {children}
    </div>
  );
}
