"use client";

/**
 * Loup-Garou local : briques d'interface (écrans jour/nuit, cartes de rôle,
 * listes de joueurs, fenêtres modales, règles).
 */

import { useEffect, type ReactNode } from "react";
import { Mascot, MascotAvatar } from "@/components/Mascot";
import { colorForIndex } from "@/components/games/local-kit";
import { ROLES, SPECIALS, type Player, type RoleId } from "./lg-local-data";
import { X } from "lucide-react";
import { GameIconButton } from "@/components/games/game-icon-button";

export type Tone = "night" | "day" | "dusk";

const BACKGROUNDS: Record<Tone, string> = {
  // Nuit : quasi noir pour ne pas éclairer la pièce
  night: "radial-gradient(circle at 50% -10%, #1B1446 0%, #07041A 45%, #020108 100%)",
  // Jour : plus clair, chaud
  day: "radial-gradient(circle at 50% -5%, rgba(255,196,110,0.55), transparent 55%), linear-gradient(180deg, #4A3796 0%, #2E2268 100%)",
  dusk: "radial-gradient(circle at 50% 8%, rgba(122,78,232,0.35), transparent 50%), linear-gradient(180deg, #0F0A2C 0%, #0B0620 100%)",
};

export function Screen({ tone, children, center = false }: { tone: Tone; children: ReactNode; center?: boolean }) {
  return (
    <div
      className="relative flex w-full flex-col items-center text-white"
      style={{
        minHeight: "100dvh",
        background: BACKGROUNDS[tone],
        padding: "calc(env(safe-area-inset-top) + 68px) 20px calc(env(safe-area-inset-bottom) + 24px)",
        justifyContent: center ? "center" : "flex-start",
        transition: "background 1s",
      }}
    >
      <div className="flex w-full max-w-md flex-1 flex-col" style={{ justifyContent: center ? "center" : "flex-start" }}>
        {children}
      </div>
    </div>
  );
}

/** Lune / soleil décoratif */
export function SkyBadge({ tone, size = 84 }: { tone: Tone; size?: number }) {
  const night = tone === "night";
  return (
    <div
      aria-hidden
      className="mx-auto"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: night
          ? "radial-gradient(circle at 35% 35%, #F7F1DC, #C9C0A3 60%, #8E876F)"
          : "radial-gradient(circle at 40% 40%, #FFF3B0, #FFC93C 60%, #FF9F1C)",
        boxShadow: night ? "0 0 60px rgba(247,241,220,0.25)" : "0 0 70px rgba(255,201,60,0.55)",
      }}
    />
  );
}

export function BigButton({
  children, onClick, variant = "primary", disabled = false, className = "",
}: {
  children: ReactNode; onClick: () => void; variant?: "primary" | "pink" | "ghost" | "danger"; disabled?: boolean; className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {},
    pink: {},
    ghost: {},
    danger: { background: "linear-gradient(180deg, #FF4D5E, #B3122A)", boxShadow: "0 10px 24px rgba(255,77,94,0.35)" },
  };
  const cls = variant === "danger" ? "" : variant === "ghost" ? "af-btn-ghost" : variant === "pink" ? "af-btn-pink" : "af-btn-primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`af-btn ${cls} w-full disabled:opacity-35 ${className}`}
      style={{ fontSize: 18, minHeight: 58, ...styles[variant] }}
    >
      {children}
    </button>
  );
}

/** Carte de rôle (blob + nom + pouvoir) */
export function RoleCard({ role, compact = false, subtitle }: { role: RoleId; compact?: boolean; subtitle?: string }) {
  const r = ROLES[role];
  return (
    <div
      className="relative flex w-full flex-col items-center rounded-[28px] border text-center"
      style={{
        padding: compact ? "18px 16px" : "26px 20px",
        borderColor: `${r.accent}66`,
        background: `radial-gradient(circle at 50% 20%, ${r.accent}38, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))`,
        boxShadow: `0 0 50px ${r.accent}30`,
      }}
    >
      <div className="relative">
        <Mascot size={compact ? 92 : 132} color={r.color} mood={r.mood} sparkle={role === "voyante" || role === "sorciere"} arms={role === "chasseur" || role === "gardien"} look={role === "loup" ? "shifty" : "center"} />
        <span className="absolute -right-3 -top-1" style={{ fontSize: compact ? 30 : 40 }}>{r.emoji}</span>
      </div>
      {subtitle && <p className="af-eyebrow mt-3" style={{ color: "var(--text-dim)" }}>{subtitle}</p>}
      <h2 className="mt-2" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: compact ? 30 : 40, lineHeight: 1, color: r.accent }}>
        {r.name}
      </h2>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: r.camp === "loups" ? "#FF8A95" : "#9BF0C9" }}>
        {r.camp === "loups" ? "Camp des loups" : "Camp du village"}
      </p>
      {!compact && <p className="mt-3 text-[17px] leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{r.power}</p>}
    </div>
  );
}

/** Liste de joueurs à toucher (gros boutons, lisibles de loin) */
export function PickList({
  players, selected, onPick, note,
}: {
  players: Player[];
  selected: number[];
  onPick: (id: number) => void;
  /** texte grisé + désactivé si renvoie une chaîne */
  note?: (p: Player) => string | null;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-2">
      {players.map((p) => {
        const n = note?.(p) ?? null;
        const on = selected.includes(p.id);
        return (
          <button
            key={p.id}
            disabled={!!n}
            onClick={() => onPick(p.id)}
            className="flex w-full items-center gap-3 rounded-2xl border px-3 text-left transition active:scale-[0.99] disabled:opacity-35"
            style={{
              minHeight: 58,
              borderColor: on ? "#FFD23F" : "rgba(255,255,255,0.12)",
              background: on ? "rgba(255,210,63,0.16)" : "rgba(255,255,255,0.05)",
            }}
          >
            <MascotAvatar color={colorForIndex(p.id)} size={38} mood={on ? "shocked" : "neutral"} border={false} />
            <span className="flex-1 truncate" style={{ fontSize: 20, fontWeight: 700 }}>{p.name}</span>
            {n && <span className="text-xs" style={{ color: "var(--text-dim)" }}>{n}</span>}
            {on && <span style={{ fontSize: 22 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(3,1,10,0.78)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-t-[28px] border text-white sm:rounded-[28px]"
        style={{
          maxHeight: "86dvh",
          background: "#120C30",
          borderColor: "rgba(255,255,255,0.1)",
          padding: "20px 20px calc(env(safe-area-inset-bottom) + 20px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="cb-display-md">{title}</h3>
          <GameIconButton icon={X} label="Fermer" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  text, yes, onYes, onNo, danger = false,
}: { text: string; yes: string; onYes: () => void; onNo: () => void; danger?: boolean }) {
  return (
    <Modal title="Sûr ?" onClose={onNo}>
      <p className="mb-5 text-[18px] leading-snug">{text}</p>
      <div className="grid gap-2">
        <BigButton onClick={onYes} variant={danger ? "danger" : "primary"}>{yes}</BigButton>
        <BigButton onClick={onNo} variant="ghost">Annuler</BigButton>
      </div>
    </Modal>
  );
}

export function RulesContent() {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.86)" }}>
      <section>
        <p className="af-eyebrow mb-1" style={{ color: "#FFD23F" }}>Le but</p>
        <p>Des loups se cachent parmi vous. <b>Le village</b> gagne s&apos;il élimine tous les loups. <b>Les loups</b> gagnent dès qu&apos;ils sont aussi nombreux que les autres.</p>
      </section>
      <section>
        <p className="af-eyebrow mb-1" style={{ color: "#FFD23F" }}>Le téléphone est le meneur</p>
        <p>Chacun découvre sa carte en secret. Ensuite, on pose le tél au centre : il raconte la nuit, appelle chaque rôle, et les rôles appelés le prennent pour agir. Tout le monde garde les yeux fermés quand ce n&apos;est pas son tour.</p>
        <p className="mt-2">Même si un rôle est mort, le téléphone fait comme s&apos;il l&apos;appelait : impossible de deviner qui est encore en vie.</p>
      </section>
      <section>
        <p className="af-eyebrow mb-1" style={{ color: "#FFD23F" }}>Le jour</p>
        <p>On découvre qui est mort et son rôle. Puis débat chronométré, et vote : le joueur désigné est éliminé et révèle sa carte. En cas d&apos;égalité, on revote ou on épargne tout le monde.</p>
      </section>
      <section>
        <p className="af-eyebrow mb-2" style={{ color: "#FFD23F" }}>Les rôles</p>
        <div className="space-y-2">
          {(["loup", "villageois", ...SPECIALS] as RoleId[]).map((id) => (
            <div key={id} className="flex gap-3 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <span className="text-2xl">{ROLES[id].emoji}</span>
              <div>
                <p className="font-bold" style={{ color: ROLES[id].accent }}>{ROLES[id].name}</p>
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>{ROLES[id].power}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <p className="af-eyebrow mb-1" style={{ color: "#FFD23F" }}>Règles d&apos;or</p>
        <p>On ne montre jamais sa carte. Les morts se taisent (mais peuvent ricaner). Et on ment avec style.</p>
      </section>
    </div>
  );
}

/** Ligne de joueur pour les récaps (rôle révélé) */
export function PlayerRow({ p, lover = false, dim = false }: { p: Player; lover?: boolean; dim?: boolean }) {
  const r = ROLES[p.role];
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)", opacity: dim ? 0.55 : 1 }}>
      <MascotAvatar color={colorForIndex(p.id)} size={36} mood={p.alive ? "happy" : "dead"} border={false} />
      <span className="flex-1 truncate text-[17px] font-bold" style={{ textDecoration: p.alive ? "none" : "line-through" }}>
        {p.name} {lover && "💘"}
      </span>
      <span className="text-[15px] font-semibold" style={{ color: r.accent }}>{r.emoji} {r.name}</span>
    </div>
  );
}
