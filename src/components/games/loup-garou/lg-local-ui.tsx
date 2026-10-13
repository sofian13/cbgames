"use client";

/**
 * Loup-Garou local : briques d'interface en DA « sticker » (blocs pleins,
 * contour encre épais, ombre dure décalée, Clash Display pour les titres).
 * Écrans jour/nuit, cartes de rôle, listes de joueurs, modales, règles.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { MascotAvatar } from "@/components/Mascot";
import { RoleBlob } from "./lg-role-blob";
import { RoleBurst } from "./lg-role-fx";
import { colorForIndex } from "@/components/games/local-kit";
import { ROLES, SPECIALS, type Player, type RoleId } from "./lg-local-data";
import { Check, X } from "lucide-react";
import { GameIconButton } from "@/components/games/game-icon-button";
import { useT } from "@/lib/i18n";
import { ROLE_TEXT, STR } from "./lg-local-i18n";

export type Tone = "night" | "day" | "dusk";

export const INK = "#15082E";
export const CREAM = "#FFF6E5";
export const YELLOW = "#FFD23F";
export const PINK = "#FF3EA5";
export const MINT = "#3DDC97";
export const CORAL = "#FF6B5B";
export const VIOLET = "#7A4EE8";
export const SKY = "#4ECDC4";

/** Bloc sticker : couleur pleine + contour encre + ombre dure */
export const stk = (bg: string, shadow = 4, border = 2.5): CSSProperties => ({
  background: bg,
  border: `${border}px solid ${INK}`,
  boxShadow: `0 ${shadow}px 0 ${INK}`,
});

export const DISPLAY: CSSProperties = {
  fontFamily: "var(--font-display), system-ui, sans-serif",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  wordSpacing: "0.1em",
};

const DOTS = "radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px)";
const BACKGROUNDS: Record<Tone, string> = {
  // Nuit : très sombre pour ne pas éclairer la pièce
  night: "#0B0620",
  // Jour : la couleur du jeu
  day: VIOLET,
  dusk: "#1E1250",
};

export function Screen({ tone, children, center = false }: { tone: Tone; children: ReactNode; center?: boolean }) {
  return (
    <div
      className="relative flex w-full flex-col items-center text-white"
      style={{
        minHeight: "100dvh",
        backgroundColor: BACKGROUNDS[tone],
        backgroundImage: DOTS,
        backgroundSize: "22px 22px",
        padding: "calc(env(safe-area-inset-top, 0px) + 72px) 20px calc(env(safe-area-inset-bottom, 0px) + 20px)",
        justifyContent: center ? "center" : "flex-start",
        transition: "background-color 1s",
      }}
    >
      <div className="flex w-full max-w-md flex-1 flex-col" style={{ justifyContent: center ? "center" : "flex-start" }}>
        {children}
      </div>
    </div>
  );
}

/** Titre Clash Display (gros, serré) */
export function Title({ children, size = 40, className = "", style }: { children: ReactNode; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <h1 className={className} style={{ ...DISPLAY, fontSize: size, lineHeight: 0.98, overflowWrap: "anywhere", ...style }}>
      {children}
    </h1>
  );
}

/** Petite étiquette sticker inclinée, en phrase normale (remplace les labels en capitales) */
export function Tag({ children, bg = "#fff", color = INK, tilt = -2, className = "" }: { children: ReactNode; bg?: string; color?: string; tilt?: number; className?: string }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center whitespace-nowrap rounded-full px-3 text-[14px] font-bold leading-none ${className}`}
      style={{ ...stk(bg, 2, 2), color, transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </span>
  );
}

/** Lune / soleil décoratif, façon sticker */
export function SkyBadge({ tone, size = 84 }: { tone: Tone; size?: number }) {
  const night = tone === "night";
  return (
    <div aria-hidden className="relative mx-auto" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full" style={{ ...stk(night ? CREAM : YELLOW, 5, 3) }} />
      {night ? (
        <>
          <span className="absolute rounded-full" style={{ left: "22%", top: "30%", width: size * 0.18, height: size * 0.18, background: "#E8DCC0", border: `2px solid ${INK}` }} />
          <span className="absolute rounded-full" style={{ left: "55%", top: "52%", width: size * 0.12, height: size * 0.12, background: "#E8DCC0", border: `2px solid ${INK}` }} />
        </>
      ) : (
        <span className="absolute rounded-full" style={{ inset: "22%", background: "#FFE88A", border: `2px solid ${INK}` }} />
      )}
    </div>
  );
}

type Variant = "primary" | "pink" | "ghost" | "danger";
const VARIANT_BG: Record<Variant, string> = { primary: YELLOW, pink: PINK, ghost: "#fff", danger: CORAL };

export function BigButton({
  children, onClick, variant = "primary", disabled = false, className = "",
}: {
  children: ReactNode; onClick: () => void; variant?: Variant; disabled?: boolean; className?: string;
}) {
  const [down, setDown] = useState(false);
  const ghost = variant === "ghost";
  const shadow = ghost ? 4 : 5;
  const pressed = down && !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
      className={`flex w-full items-center justify-center gap-2 rounded-full px-5 text-center ${className}`}
      style={{
        ...stk(disabled ? "#3A2C6B" : VARIANT_BG[variant], pressed ? 1 : shadow, 3),
        color: disabled ? "rgba(255,255,255,0.75)" : variant === "pink" ? "#fff" : INK,
        ...DISPLAY,
        letterSpacing: "-0.01em",
        fontSize: ghost ? 18 : 20,
        minHeight: ghost ? 54 : 60,
        transform: pressed ? `translateY(${shadow - 1}px)` : undefined,
        transition: "transform 110ms ease, box-shadow 110ms ease",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}

/**
 * Carte de rôle : bloc plein dans la couleur du rôle. À l'affichage, la carte se
 * retourne, le blob costumé fait « pop » et une gerbe de particules du rôle jaillit.
 * (Montée seulement quand le joueur concerné regarde : rien n'est pré-rendu.)
 */
export function RoleCard({ role, compact = false, subtitle }: { role: RoleId; compact?: boolean; subtitle?: string }) {
  const r = ROLES[role];
  const t = useT(STR);
  const rt = useT(ROLE_TEXT)[role];
  return (
    <div className="lgb-flip w-full">
    <div
      className="relative flex w-full flex-col items-center rounded-[28px] text-center"
      style={{ ...stk(r.accent, 6, 3), color: INK, padding: compact ? "14px 16px 20px" : "18px 20px 26px", transform: "rotate(-1.5deg)" }}
    >
      <div className="relative">
        <RoleBlob role={role} size={compact ? 104 : 150} reveal />
        <RoleBurst role={role} count={compact ? 12 : 18} spread={compact ? 0.8 : 1} />
      </div>
      {subtitle && <p className="mt-2 text-[17px] font-bold">{subtitle}</p>}
      <h2 className="mt-1" style={{ ...DISPLAY, fontSize: compact ? 36 : 48, lineHeight: 0.95 }}>{rt.name}</h2>
      <span className="mt-3">
        <Tag bg={r.camp === "loups" ? INK : "#fff"} color={r.camp === "loups" ? "#fff" : INK} tilt={2}>
          {r.camp === "loups" ? t.campWolves : t.campVillage}
        </Tag>
      </span>
      {!compact && <p className="mt-4 text-[17px] font-semibold leading-snug">{rt.power}</p>}
    </div>
    </div>
  );
}

/** Liste de joueurs à toucher (gros boutons sticker, lisibles de loin) */
export function PickList({
  players, selected, onPick, note,
}: {
  players: Player[];
  selected: number[];
  onPick: (id: number) => void;
  /** texte + désactivé si renvoie une chaîne */
  note?: (p: Player) => string | null;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-2.5">
      {players.map((p) => {
        const n = note?.(p) ?? null;
        const on = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            disabled={!!n}
            onClick={() => onPick(p.id)}
            className="flex w-full items-center gap-3 rounded-[20px] px-3 text-left transition-transform active:translate-y-[2px] disabled:opacity-50"
            style={{ ...stk(on ? YELLOW : "#fff", on ? 4 : 3), color: INK, minHeight: 60, transform: on ? "rotate(-1deg)" : undefined }}
          >
            <MascotAvatar color={colorForIndex(p.id)} size={40} mood={on ? "shocked" : "neutral"} border={false} />
            <span className="flex-1 truncate" style={{ ...DISPLAY, fontSize: 22, letterSpacing: "-0.01em" }}>{p.name}</span>
            {n && <span className="text-[14px] font-semibold">{n}</span>}
            {on && (
              <span className="grid h-8 w-8 place-items-center rounded-full" style={{ ...stk(MINT, 2, 2) }}>
                <Check size={18} strokeWidth={3.2} aria-hidden />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const t = useT(STR);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(10,4,32,0.66)" }}
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={title}
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-t-[28px] sm:rounded-[28px]"
        style={{
          maxHeight: "86dvh",
          background: CREAM,
          color: INK,
          border: `3px solid ${INK}`,
          borderBottom: 0,
          padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 22px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 style={{ ...DISPLAY, fontSize: 30, lineHeight: 1 }}>{title}</h3>
          <GameIconButton icon={X} label={t.close} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  text, yes, onYes, onNo, danger = false,
}: { text: string; yes: string; onYes: () => void; onNo: () => void; danger?: boolean }) {
  const t = useT(STR);
  return (
    <Modal title={t.sure} onClose={onNo}>
      <p className="mb-5 text-[18px] font-semibold leading-snug">{text}</p>
      <div className="grid gap-3">
        <BigButton onClick={onYes} variant={danger ? "danger" : "primary"}>{yes}</BigButton>
        <BigButton onClick={onNo} variant="ghost">{t.cancel}</BigButton>
      </div>
    </Modal>
  );
}

/** Titre de section en Clash Display (à la place des petites capitales) */
export function SectionTitle({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <h3 className={className} style={{ ...DISPLAY, fontSize: 24, lineHeight: 1.05, ...style }}>{children}</h3>;
}

export function RulesContent() {
  const t = useT(STR);
  const roles = useT(ROLE_TEXT);
  const [g0, g1, g2, g3, g4] = t.rulesGoalText;
  return (
    <div className="space-y-5 text-[16px] leading-relaxed" style={{ color: INK }}>
      <section>
        <SectionTitle className="mb-1">{t.rulesGoal}</SectionTitle>
        <p>{g0}<b>{g1}</b>{g2}<b>{g3}</b>{g4}</p>
      </section>
      <section>
        <SectionTitle className="mb-1">{t.rulesPhone}</SectionTitle>
        <p>{t.rulesPhoneText}</p>
        <p className="mt-2">{t.rulesPhoneText2}</p>
      </section>
      <section>
        <SectionTitle className="mb-1">{t.rulesDay}</SectionTitle>
        <p>{t.rulesDayText}</p>
      </section>
      <section>
        <SectionTitle className="mb-2">{t.rulesRoles}</SectionTitle>
        <div className="space-y-2.5">
          {(["loup", "villageois", ...SPECIALS] as RoleId[]).map((id, i) => (
            <div key={id} className="flex items-center gap-3 rounded-[18px] p-3" style={{ ...stk(ROLES[id].accent, 3), transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}>
              <RoleBlob role={id} size={52} still />
              <div className="min-w-0">
                <p style={{ ...DISPLAY, fontSize: 20, letterSpacing: "-0.01em" }}>{roles[id].name}</p>
                <p className="text-[14px] font-semibold leading-snug">{roles[id].power}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle className="mb-1">{t.rulesGold}</SectionTitle>
        <p>{t.rulesGoldText}</p>
      </section>
    </div>
  );
}

/** Ligne de joueur pour les récaps (rôle révélé) */
export function PlayerRow({ p, lover = false, dim = false }: { p: Player; lover?: boolean; dim?: boolean }) {
  const r = ROLES[p.role];
  const t = useT(STR);
  const name = useT(ROLE_TEXT)[p.role].name;
  return (
    <div className="flex items-center gap-3 rounded-[18px] px-3 py-2" style={{ ...stk("#fff", 3), color: INK, opacity: dim ? 0.6 : 1, minHeight: 56 }}>
      <RoleBlob role={p.role} size={46} state={p.alive ? "idle" : "ghost"} still />
      <span className="min-w-0 flex-1 truncate text-[17px] font-bold" style={{ textDecoration: p.alive ? "none" : "line-through" }}>
        {p.name}{lover && <span style={{ color: PINK }}> · {t.lover}</span>}
      </span>
      <span className="shrink-0 rounded-full px-2.5 py-1 text-[14px] font-bold" style={{ ...stk(r.accent, 0, 2) }}>{name}</span>
    </div>
  );
}
