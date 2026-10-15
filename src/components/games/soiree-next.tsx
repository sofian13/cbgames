"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowRight, Crown } from "lucide-react";
import { PlayerAvatar } from "@/components/avatar/PlayerBlob";
import { ZButton } from "@/components/games/local-kit";
import { useLang, pick, type I18n } from "@/lib/i18n";

/**
 * Soirée Zinzin (app) : l'écran de jeu de la Soirée fournit ce contexte pour que
 * l'écran de fin de chaque jeu affiche « Jeu suivant → » juste au-dessus de « Rejouer ».
 * Hors Soirée (partie simple, site web) : pas de contexte → le bouton ne rend rien.
 */
export interface SoireeNext {
  /** « Jeu suivant » ou « Voir les résultats » au dernier jeu */
  label: string;
  onNext: () => void;
  /** Points de soirée que ce jeu rapporte (déjà comptés par la Soirée) : pastilles « +3 » du classement, sinon ligne au-dessus du bouton */
  gains?: { name: string; pts: number }[];
  /** Libellé de la ligne des points (« Soirée ») */
  gainsLabel?: string;
  /** Classement de la soirée APRÈS ce jeu (points de ce jeu compris), affiché au-dessus du bouton */
  totals?: { name: string; pts: number; rank: number; ci: number }[];
  /** Libellé du classement (« Classement de la soirée ») */
  totalsLabel?: string;
}

export const SoireeNextContext = createContext<SoireeNext | null>(null);

export function useSoireeNext(): SoireeNext | null {
  return useContext(SoireeNextContext);
}

/** Comparaison tolérante des prénoms (même règle que zinzin/src/soiree.ts : accents, casse et espaces ignorés). */
const norm = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Points de soirée gagnés par ce prénom du jeu dans ce jeu (0 hors Soirée ou sans gain). */
export function useSoireeGain(name: string | null | undefined): number {
  const gains = useSoireeNext()?.gains;
  if (!gains?.length || !name || !name.trim()) return 0;
  return (gains.find((g) => g.name === name) ?? gains.find((g) => norm(g.name) === norm(name)))?.pts ?? 0;
}

/* Pastilles affichées à l'écran : SoireeNextButton ne montre sa ligne « Points de soirée » que s'il n'y en a aucune. */
let shown = 0;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getShown = () => shown;
const bump = (d: number) => { shown += d; listeners.forEach((l) => l()); };

const GAIN_ARIA: I18n<(n: number) => string> = {
  fr: (n) => `+${n} ${n > 1 ? "points" : "point"} de soirée`,
  en: (n) => `+${n} party ${n > 1 ? "points" : "point"}`,
  es: (n) => `+${n} ${n > 1 ? "puntos" : "punto"} de la noche`,
};

/** Pastille « +3 » (points de soirée) en bout de ligne d'un classement ; rien hors Soirée ou à 0 point. */
export function SoireeGain({ name, className, style }: { name: string | null | undefined; className?: string; style?: CSSProperties }) {
  const pts = useSoireeGain(name);
  const lang = useLang();
  const visible = pts > 0;
  const ref = useRef<HTMLSpanElement>(null);
  // Ligne déjà jaune (gagnant) : pastille blanche pour rester lisible
  const [onYellow, setOnYellow] = useState(false);
  // Layout effect : compté avant l'affichage, la ligne de secours du bouton ne clignote pas
  useLayoutEffect(() => {
    if (!visible) return;
    bump(1);
    return () => bump(-1);
  }, [visible]);
  useLayoutEffect(() => {
    if (!visible) return;
    for (let el = ref.current?.parentElement; el; el = el.parentElement) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (!m || (m.length > 3 && Number(m[3]) === 0)) continue;
      const [r, g, b] = m.map(Number);
      setOnYellow(r > 200 && g > 160 && b < 130);
      return;
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <span
      ref={ref}
      role="img"
      aria-label={pick(GAIN_ARIA, lang)(pts)}
      className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2 text-[13px] font-black leading-none ${className ?? ""}`}
      style={{ background: onYellow ? "#fff" : "#FFD23F", color: "#15082E", border: "2px solid #15082E", boxShadow: "0 2px 0 #15082E", letterSpacing: 0, ...style }}
    >
      +{pts}
    </span>
  );
}

/** Gros bouton « Jeu suivant → » (même style que les gros boutons des jeux) ; rien hors Soirée. */
export function SoireeNextButton({ bg = "#FFD23F", className, style }: { bg?: string; className?: string; style?: CSSProperties }) {
  const next = useSoireeNext();
  const pills = useSyncExternalStore(subscribe, getShown, getShown);
  if (!next) return null;
  // Secours : ligne des points seulement si l'écran n'affiche aucune pastille « +3 »
  const gains = pills > 0 ? [] : next.gains ?? [];
  const totals = next.totals ?? [];
  return (
    <>
      {totals.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-center text-[13px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.75)" }}>{next.totalsLabel}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {totals.map((r) => {
              const lead = r.rank === 1 && r.pts > 0;
              return (
                <span key={r.name} className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3"
                  style={{ background: lead ? "#FFD23F" : "#fff", color: "#15082E", border: "2.5px solid #15082E", boxShadow: "0 3px 0 #15082E" }}>
                  <span className="relative inline-flex">
                    <PlayerAvatar name={r.name} colorIndex={r.ci} size={26} border={false} />
                    {lead && <Crown size={14} strokeWidth={3} aria-hidden className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ color: "#15082E", fill: "#FFD23F" }} />}
                  </span>
                  <span className="max-w-[90px] truncate text-[15px] font-bold">{r.name}</span>
                  <span className="text-[16px] font-extrabold tabular-nums">{r.pts}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
      {gains.length > 0 && (
        <p className="mb-2 text-center text-[15px] font-bold leading-snug" style={{ color: "rgba(255,255,255,0.92)" }}>
          <span style={{ color: "#FFD23F" }}>{next.gainsLabel}</span>
          {gains.map((g, i) => <span key={g.name}>{i ? " · " : " : "}{g.name}{" "}+{g.pts}</span>)}
        </p>
      )}
      <ZButton bg={bg} onClick={next.onNext} className={className} style={style}>
        {next.label} <ArrowRight size={22} strokeWidth={3} aria-hidden />
      </ZButton>
    </>
  );
}
