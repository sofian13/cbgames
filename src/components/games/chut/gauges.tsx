"use client";

import type { ModeId } from "./modes";

/**
 * Jauges des modes micro : tracé en direct, tube vertical (zone / record / plafond),
 * barre de chuchotement, et petites illustrations des modes. SVG uniquement.
 * Les transitions sont coupées par la règle prefers-reduced-motion de shared.tsx (.chut-rm).
 */

const INK = "#15082E";
const MINT = "#3DDC97";
const YELLOW = "#FFD23F";
const CORAL = "#FF6B5B";
const PINK = "#FF3EA5";
const SKY = "#4ECDC4";

/** Tracé du niveau des dernières secondes, avec la bande cible en vert. */
export function LevelTrace({ samples, lo, hi, live = true, height = 150, label }: {
  samples: number[];
  lo: number;
  hi: number;
  live?: boolean;
  height?: number | string;
  label?: string;
}) {
  const W = 300;
  const H = 120;
  // en direct : 6 dernières secondes, calées à droite ; après coup : tout le passage
  const N = live ? 120 : Math.max(2, samples.length);
  const y = (v: number) => H - 6 - Math.max(0, Math.min(1, v)) * (H - 12);
  const pts = samples.slice(-N);
  const off = N - pts.length;
  const d = pts.map((v, i) => `${(((off + i) / (N - 1)) * W).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const cur = pts.length ? pts[pts.length - 1] : 0;
  const inside = cur >= lo && cur <= hi;
  return (
    <div style={{ width: "100%", height }} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
        <rect x="0" y="0" width={W} height={H} rx="14" fill="#1E0F45" stroke={INK} strokeWidth="3" />
        {[0.34, 0.56, 0.76].map((v) => <line key={v} x1="6" x2={W - 6} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="4 6" />)}
        <rect x="3" y={y(hi)} width={W - 6} height={Math.max(2, y(lo) - y(hi))} fill={MINT} opacity="0.32" />
        <line x1="3" x2={W - 3} y1={y(hi)} y2={y(hi)} stroke={MINT} strokeWidth="2.5" />
        <line x1="3" x2={W - 3} y1={y(lo)} y2={y(lo)} stroke={MINT} strokeWidth="2.5" />
        {pts.length > 1 && (
          <polyline points={d} fill="none" stroke={live ? "#fff" : "rgba(255,255,255,0.5)"} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        )}
        {live && pts.length > 0 && <circle cx={W} cy={y(cur)} r="7" fill={inside ? MINT : CORAL} stroke={INK} strokeWidth="3" vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  );
}

/**
 * Tube vertical : remplissage = niveau, bande cible verte, marque du record,
 * plafond « BOUM » rouge, pic atteint. Étiquettes de zones à gauche (facultatives).
 */
export function VBar({ value, lo, hi, record, ceiling, floorMark, peak, height = 260, zoneLabels, ceilingLabel, recordLabel, label }: {
  value: number;
  lo?: number;
  hi?: number;
  record?: number | null;
  ceiling?: number;
  floorMark?: number;
  peak?: number | null;
  height?: number | string;
  zoneLabels?: { v: number; text: string }[];
  ceilingLabel?: string;
  /** Texte à côté de la flèche du record (le tube s'élargit à droite) */
  recordLabel?: string;
  label?: string;
}) {
  const H = 300;
  const y = (v: number) => H - 8 - Math.max(0, Math.min(1, v)) * (H - 16);
  const v = Math.max(0, Math.min(1, value));
  const fill = ceiling != null && v >= ceiling ? CORAL
    : lo != null && hi != null ? (v >= lo && v <= hi ? MINT : YELLOW)
    : record !== undefined || ceiling != null ? YELLOW
    : v > 0.75 ? PINK : v > 0.45 ? YELLOW : MINT;
  const L = zoneLabels ? 112 : 6;
  const X = L;
  const Wt = 74;
  const R = recordLabel ? 150 : 54;
  return (
    <div style={{ height, width: "100%", maxWidth: zoneLabels ? 250 : recordLabel ? 260 : 120 }} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <svg viewBox={`0 0 ${L + Wt + R} ${H}`} width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
        <rect x={X} y="2" width={Wt} height={H - 4} rx="26" fill="#1E0F45" stroke={INK} strokeWidth="4" />
        {ceiling != null && <rect x={X + 4} y="6" width={Wt - 8} height={y(ceiling) - 6} rx="20" fill={CORAL} opacity="0.5" />}
        {ceiling != null && ceilingLabel && (
          <text x={X + Wt / 2} y={Math.max(30, y(ceiling) / 2 + 10)} textAnchor="middle" fill="#fff" stroke={INK} strokeWidth="4" paintOrder="stroke" fontSize="20" fontWeight="800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{ceilingLabel}</text>
        )}
        {lo != null && hi != null && <rect x={X + 4} y={y(hi)} width={Wt - 8} height={Math.max(3, y(lo) - y(hi))} fill={MINT} opacity="0.35" />}
        <rect className="chut-tr" x={X + 10} y={y(v)} width={Wt - 20} height={Math.max(0, H - 10 - y(v))} rx="16" fill={fill} stroke={INK} strokeWidth="3" style={{ transition: "y 80ms linear, height 80ms linear" }} />
        {lo != null && hi != null && (
          <>
            <line x1={X - 6} x2={X + Wt + 6} y1={y(hi)} y2={y(hi)} stroke={MINT} strokeWidth="4" strokeLinecap="round" />
            <line x1={X - 6} x2={X + Wt + 6} y1={y(lo)} y2={y(lo)} stroke={MINT} strokeWidth="4" strokeLinecap="round" />
          </>
        )}
        {floorMark != null && <line x1={X - 6} x2={X + Wt + 6} y1={y(floorMark)} y2={y(floorMark)} stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeDasharray="5 5" />}
        {record != null && (
          <g>
            <line x1={X - 8} x2={X + Wt + 8} y1={y(record)} y2={y(record)} stroke={YELLOW} strokeWidth="5" strokeLinecap="round" />
            <path d={`M${X + Wt + 10} ${y(record)} l14 -10 v20 z`} fill={YELLOW} stroke={INK} strokeWidth="2.5" />
            {recordLabel && (
              <text x={X + Wt + 30} y={y(record) + 6} fill={YELLOW} stroke={INK} strokeWidth="4" paintOrder="stroke" fontSize="18" fontWeight="800" style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}>{recordLabel}</text>
            )}
          </g>
        )}
        {peak != null && <line x1={X + 2} x2={X + Wt - 2} y1={y(peak)} y2={y(peak)} stroke="#fff" strokeWidth="4" strokeDasharray="8 5" />}
        {zoneLabels?.map((z) => (
          <text key={z.text} x={L - 10} y={y(z.v) + 6} textAnchor="end" fill="#fff" fontSize="17" fontWeight="700" opacity="0.85" style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}>{z.text}</text>
        ))}
      </svg>
    </div>
  );
}

/** Barre horizontale « chuchotement » : vert jusqu'au seuil, rouge au-delà. */
export function WhisperBar({ value, max, okLabel, loudLabel, label }: { value: number; max: number; okLabel: string; loudLabel: string; label?: string }) {
  const v = Math.max(0, Math.min(1, value / (max / 0.7))); // le seuil tombe à 70 % de la barre
  const loud = value > max;
  return (
    <div className="w-full" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <div className="relative h-9 w-full overflow-hidden rounded-full" style={{ background: "#1E0F45", border: `3px solid ${INK}` }}>
        <div className="absolute inset-y-0 right-0" style={{ left: "70%", background: "rgba(255,107,91,0.45)" }} />
        <div className="chut-tr absolute inset-y-1 left-1 rounded-full" style={{ width: `calc(${(v * 100).toFixed(1)}% - 8px)`, minWidth: 8, background: loud ? CORAL : MINT, border: `2.5px solid ${INK}`, transition: "width 80ms linear" }} />
        <div className="absolute inset-y-0" style={{ left: "70%", width: 4, background: "#fff" }} />
      </div>
      <div className="mt-1 flex justify-between text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
        <span>{okLabel}</span>
        <span style={{ color: loud ? CORAL : undefined }}>{loudLabel}</span>
      </div>
    </div>
  );
}

/** Petites illustrations des tuiles de mode. */
export function ModeArt({ mode, size = 64 }: { mode: ModeId; size?: number }) {
  const s = { width: size, height: size, display: "block", overflow: "visible" } as const;
  if (mode === "volume") {
    return (
      <svg viewBox="0 0 64 64" style={s} aria-hidden>
        <path d="M8 46 A24 24 0 0 1 56 46" fill="none" stroke={INK} strokeWidth="12" strokeLinecap="round" />
        <path d="M8 46 A24 24 0 0 1 20 25" fill="none" stroke="#fff" strokeWidth="7" />
        <path d="M24 23 A24 24 0 0 1 42 23" fill="none" stroke={MINT} strokeWidth="7" />
        <path d="M46 25 A24 24 0 0 1 56 46" fill="none" stroke={CORAL} strokeWidth="7" />
        <path d="M32 46 L35 20 L29 20 Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="32" cy="46" r="6" fill={YELLOW} stroke={INK} strokeWidth="3" />
      </svg>
    );
  }
  if (mode === "whisper") {
    return (
      <svg viewBox="0 0 64 64" style={s} aria-hidden>
        <circle cx="24" cy="34" r="18" fill={YELLOW} stroke={INK} strokeWidth="3.5" />
        <circle cx="18" cy="31" r="3" fill={INK} />
        <circle cx="30" cy="31" r="3" fill={INK} />
        <rect x="22" y="36" width="5" height="16" rx="2.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <path d="M46 22 q6 6 0 12 M52 17 q10 11 0 22" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (mode === "crescendo") {
    return (
      <svg viewBox="0 0 64 64" style={s} aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={4 + i * 15} y={50 - (i + 1) * 10} width="11" height={(i + 1) * 10 + 6} rx="4" fill={[MINT, SKY, YELLOW, CORAL][i]} stroke={INK} strokeWidth="3" />
        ))}
        <path d="M6 12 L58 4" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="5 5" />
      </svg>
    );
  }
  if (mode === "souffle") {
    return (
      <svg viewBox="0 0 64 64" style={s} aria-hidden>
        <circle cx="20" cy="34" r="17" fill={PINK} stroke={INK} strokeWidth="3.5" />
        <circle cx="15" cy="29" r="3" fill={INK} />
        <circle cx="25" cy="29" r="3" fill={INK} />
        <ellipse cx="22" cy="41" rx="5" ry="6" fill={INK} />
        <path d="M38 40 q5 -8 10 0 t10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M38 30 q5 -8 10 0 t10 0" fill="none" stroke={MINT} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (mode === "duel") {
    return (
      <svg viewBox="0 0 64 64" style={s} aria-hidden>
        <circle cx="18" cy="34" r="14" fill={SKY} stroke={INK} strokeWidth="3.5" />
        <path d="M12 32 h4 M20 32 h4 M13 40 h10" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <circle cx="46" cy="34" r="14" fill={YELLOW} stroke={INK} strokeWidth="3.5" />
        <path d="M40 30 q2 -3 4 0 M48 30 q2 -3 4 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path d="M39 37 q7 9 14 0 z" fill={INK} />
        <circle cx="46" cy="21" r="4" fill={CORAL} stroke={INK} strokeWidth="2.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" style={s} aria-hidden>
      {[[14, MINT], [32, YELLOW], [50, PINK]].map(([x, c]) => (
        <g key={String(x)}>
          <circle cx={x as number} cy="38" r="11" fill={c as string} stroke={INK} strokeWidth="3" />
          <rect x={(x as number) - 2} y="38" width="4" height="12" rx="2" fill="#fff" stroke={INK} strokeWidth="2" />
        </g>
      ))}
      <path d="M22 12 h20" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
