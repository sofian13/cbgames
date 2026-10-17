import { useId, type ReactNode } from "react";
import { ArrowRight, Lock, Play } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SOIREE, UI } from "../strings";
import { ZBlob } from "./ZBlob";
import { RoundBtn, Tag } from "./common";
import { haptic } from "./util";

/** Couleurs de la Soirée Zinzin */
export const SOIREE_BG = "#FF3EA5";

/** Animations propres à la soirée (blob qui danse, boule qui tourne, paillettes). */
export function SoireeStyles() {
  return (
    <style>{`
.zzs-dance { animation: zzs-dance 0.9s ease-in-out infinite; transform-origin: 50% 92%; }
@keyframes zzs-dance {
  0%, 100% { transform: translateY(0) rotate(-7deg) scale(1.03, 0.97); }
  25% { transform: translateY(-14%) rotate(0deg) scale(0.96, 1.05); }
  50% { transform: translateY(0) rotate(7deg) scale(1.03, 0.97); }
  75% { transform: translateY(-14%) rotate(0deg) scale(0.96, 1.05); }
}
.zzs-swing { animation: zzs-swing 3.2s ease-in-out infinite; transform-origin: 50% 0%; }
@keyframes zzs-swing { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
.zzs-tiles { animation: zzs-tiles 7s linear infinite; }
@keyframes zzs-tiles { from { transform: translateX(0); } to { transform: translateX(-90px); } }
.zzs-spark { animation: zzs-spark 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes zzs-spark { 0%, 100% { opacity: 0.2; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.1); } }
@media (prefers-reduced-motion: reduce) {
  .zzs-dance, .zzs-swing, .zzs-tiles, .zzs-spark { animation: none !important; }
}
`}</style>
  );
}

/** Boule à facettes (SVG maison, DA sticker). `hang` = fil qui la tient par le haut. */
export function DiscoBall({ size = 90, hang = 0 }: { size?: number; hang?: number }) {
  const uid = useId().replace(/:/g, "");
  const clip = `zzs-c-${uid}`, grad = `zzs-g-${uid}`;
  const tiles: ReactNode[] = [];
  const palette = ["#FFFFFF", "#D9D4F0", "#B8B0DD", "#F2EEFF", "#FFD23F", "#9E95CC", "#FFA5CD", "#E4E0F7", "#A4F2CC"];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 21; c++) {
      tiles.push(
        <rect key={`${r}-${c}`} x={c * 10} y={10 + r * 10} width={9} height={9} rx={1.5} fill={palette[(r * 5 + c * 7) % palette.length]} />,
      );
    }
  }
  const h = size + hang;
  return (
    <svg width={size} height={h} viewBox={`0 ${-hang * (100 / size)} 100 ${100 + hang * (100 / size)}`} style={{ overflow: "visible", display: "block" }} aria-hidden>
      <defs>
        <clipPath id={clip}><circle cx={50} cy={50} r={40} /></clipPath>
        <radialGradient id={grad} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.6} />
          <stop offset="60%" stopColor="#fff" stopOpacity={0} />
          <stop offset="100%" stopColor="#2A1866" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      {hang > 0 && <line x1={50} y1={-hang * (100 / size)} x2={50} y2={10} stroke="#15082E" strokeWidth={3} />}
      <rect x={43} y={5} width={14} height={8} rx={2} fill="#9E95CC" stroke="#15082E" strokeWidth={2.6} />
      <circle cx={50} cy={54} r={40} fill="#15082E" />
      <g clipPath={`url(#${clip})`}>
        <rect x={0} y={0} width={100} height={100} fill="#6F679C" />
        <g className="zzs-tiles">{tiles}</g>
        <rect x={0} y={0} width={100} height={100} fill={`url(#${grad})`} />
      </g>
      <circle cx={50} cy={50} r={40} fill="none" stroke="#15082E" strokeWidth={3.2} />
      {/* Paillettes */}
      <path className="zzs-spark" d="M88 18 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#FFD23F" stroke="#15082E" strokeWidth={1.8} strokeLinejoin="round" />
      <path className="zzs-spark" style={{ animationDelay: "0.6s" }} d="M8 70 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#fff" stroke="#15082E" strokeWidth={1.6} strokeLinejoin="round" />
      <path className="zzs-spark" style={{ animationDelay: "1.1s" }} d="M94 80 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6z" fill="#A4F2CC" stroke="#15082E" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

/** Bouton rond du coin haut-gauche (même place que la croix « quitter » des jeux). */
export function CornerBtn({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <RoundBtn
      onClick={() => { haptic(); onClick(); }}
      label={label}
      className="fixed left-3"
      style={{ top: "calc(var(--sat) + 10px)", zIndex: 60 }}
    >
      {children}
    </RoundBtn>
  );
}

/** Grosse carte d'entrée de l'accueil (+ reprise d'une soirée en cours). */
export function SoireeEntry({
  locked, resume, onStart, onResume,
}: {
  locked: boolean;
  /** Soirée en cours : numéro du jeu et total */
  resume: { i: number; n: number } | null;
  onStart: () => void;
  onResume: () => void;
}) {
  const t = useT(SOIREE);
  const ui = useT(UI);
  return (
    <div className="zz-rise mx-5 mt-4" style={{ ["--d" as string]: "60ms" }}>
      <SoireeStyles />
      <button
        type="button"
        onClick={() => { haptic(); if (resume) onResume(); else onStart(); }}
        className="zz-push zz-stk relative block w-full rounded-[30px] px-5 pb-4 pt-4 text-left"
        style={{ background: SOIREE_BG, color: "#fff", rotate: "1deg", minHeight: 176 }}
        aria-label={resume ? t.resume(resume.i, resume.n) : `${t.name} : ${t.cardSub}${locked ? ui.lockedSuffix : ""}`}
      >
        {/* La boule pend au-dessus de la carte, le blob DJ danse dessous */}
        {/* Secret : toucher la boule → l'accueil passe en boîte de nuit (DiscoMode.tsx), sans lancer la soirée */}
        <div
          className="zzs-swing absolute"
          style={{ right: 62, top: -40, padding: 8 }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.dispatchEvent(new Event("zz:disco")); }}
        >
          <DiscoBall size={64} hang={18} />
        </div>
        <div className="pointer-events-none absolute -right-2" style={{ bottom: -14 }}>
          <div className="zzs-dance"><ZBlob size={112} color="yellow" mood="cool" seed={4} outline shadow={false} wobble={false} hop={false} /></div>
        </div>
        <div className="relative" style={{ maxWidth: "64%" }}>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag bg="#FFD23F" tilt={-4}>{locked ? <><Lock size={12} strokeWidth={3} className="mr-1" />{ui.premium}</> : resume ? t.paused : ui.tagNew}</Tag>
          </div>
          <h2 className="zz-title mt-2.5" style={{ fontSize: 34, lineHeight: 0.92 }}>{t.name}</h2>
          <p className="mt-1.5 text-[15px] font-semibold leading-snug" style={{ opacity: 0.95 }}>{t.cardSub}</p>
          <span
            className="zz-stk-sm mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[15px] font-bold leading-tight"
            style={{ background: "#fff", color: "var(--zz-ink)", rotate: "-2deg" }}
          >
            {resume ? <><Play size={15} strokeWidth={3} fill="currentColor" /> {t.resume(resume.i, resume.n)}</> : <>{t.cardCta} <ArrowRight size={16} strokeWidth={3} /></>}
          </span>
        </div>
      </button>
      {resume && (
        <button
          type="button"
          onClick={() => { haptic(); onStart(); }}
          className="zz-tap mx-auto mt-2 block min-h-11 px-4 text-[14px] font-bold underline decoration-2 underline-offset-4"
          style={{ color: "var(--zz-dim)" }}
        >
          {t.newOne}
        </button>
      )}
    </div>
  );
}
