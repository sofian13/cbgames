import { memo, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { I18n } from "@/lib/i18n";

/**
 * Décors de « Tapote le blob » (BlobClicker.tsx), débloqués aux paliers de taps.
 * Dessins SVG maison (style sticker de l'app : formes pleines, contours encre), plein écran derrière le blob.
 * Peu d'éléments animés, en transform/opacity seulement (jamais de flou ni de mélange : léger pour le téléphone).
 * Un voile sombre en haut garde le compteur lisible sur tous les décors.
 */

export type EnvId = "plain" | "salon" | "bar" | "club" | "beach" | "volcano" | "space" | "zinzin";

export const ENVS: { id: EnvId; at: number; icon: string; name: I18n<string> }[] = [
  // Le fond uni de l'app, toujours disponible
  { id: "plain", at: 0, icon: "🟣", name: { fr: "Fond classique", en: "Classic", es: "Clásico" } },
  { id: "salon", at: 0, icon: "🛋️", name: { fr: "Le salon", en: "The living room", es: "El salón" } },
  { id: "bar", at: 750, icon: "🍹", name: { fr: "Le bar", en: "The bar", es: "El bar" } },
  { id: "club", at: 2500, icon: "🪩", name: { fr: "La boîte de nuit", en: "The nightclub", es: "La discoteca" } },
  { id: "beach", at: 6000, icon: "🏖️", name: { fr: "La plage", en: "The beach", es: "La playa" } },
  { id: "volcano", at: 15000, icon: "🌋", name: { fr: "Le volcan", en: "The volcano", es: "El volcán" } },
  { id: "space", at: 40000, icon: "🚀", name: { fr: "L'espace", en: "Outer space", es: "El espacio" } },
  { id: "zinzin", at: 100000, icon: "🌈", name: { fr: "Le monde Zinzin", en: "Zinzin World", es: "El mundo Zinzin" } },
];

const INK = "#15082E";
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Voile du haut (lisibilité du compteur), commun à tous les décors */
function TopScrim({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`scrim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A041E" stopOpacity="0.62" />
          <stop offset="1" stopColor="#0A041E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="300" fill={`url(#scrim-${id})`} />
    </>
  );
}

/** Fond classique : le violet uni de l'app, avec ses petits pois discrets */
function Plain() {
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <pattern id="pl-dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="1.6" fill="#ffffff" opacity="0.07" /></pattern>
      </defs>
      <rect width="390" height="844" fill="#211052" />
      <rect width="390" height="844" fill="url(#pl-dots)" />
    </svg>
  );
}

function Salon() {
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="sl-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A1D6E" /><stop offset="1" stopColor="#24104A" /></linearGradient>
        <radialGradient id="sl-lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFD98A" stopOpacity="0.55" /><stop offset="1" stopColor="#FFD98A" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="390" height="844" fill="url(#sl-wall)" />
      {/* Papier peint : petits losanges */}
      {Array.from({ length: 9 }, (_, i) => Array.from({ length: 6 }, (_, j) => (
        <path key={`${i}-${j}`} d={`M${20 + j * 70 + (i % 2) * 35} ${70 + i * 62} l6 8 -6 8 -6 -8z`} fill="#4B2A86" />
      )))}
      {/* Fenêtre sur la ville la nuit */}
      <g transform="translate(34 150)">
        <rect width="150" height="180" rx="10" fill="#0E0A2A" {...S} />
        <circle cx="112" cy="40" r="16" fill="#FFF1A6" />
        <circle cx="106" cy="35" r="4" fill="#F2D36B" />
        <path d="M6 180 V118 h22 v-26 h24 v40 h18 v-62 h26 v54 h20 v-22 h28 v98z" fill="#1F1645" />
        {[[14, 128], [40, 102], [40, 122], [78, 86], [86, 110], [108, 132], [130, 150]].map(([x, y], k) => (
          <rect key={k} x={x} y={y} width="7" height="9" fill={k % 3 === 0 ? "#3A2E66" : "#FFD23F"} />
        ))}
        <path d="M75 0 V180 M0 90 H150" stroke={INK} strokeWidth="5" />
        <rect width="150" height="180" rx="10" fill="none" {...S} strokeWidth="6" />
      </g>
      {/* Cadre au mur */}
      <g transform="translate(236 168) rotate(4)">
        <rect width="104" height="122" rx="8" fill="#FF3EA5" {...S} />
        <rect x="12" y="12" width="80" height="98" rx="4" fill="#FFF0F8" {...S} strokeWidth="3" />
        <path d="M52 86 C30 72 30 48 44 46 C50 45 52 52 52 54 C52 52 54 45 60 46 C74 48 74 72 52 86Z" fill="#FF3EA5" {...S} strokeWidth="3" />
      </g>
      {/* Sol, plinthe, tapis */}
      <rect y="580" width="390" height="264" fill="#3B1F57" />
      <rect y="572" width="390" height="14" fill="#2A1442" {...S} strokeWidth="3" />
      <ellipse cx="195" cy="720" rx="190" ry="62" fill="#FF6B5B" {...S} />
      <ellipse cx="195" cy="720" rx="140" ry="40" fill="none" stroke="#FFD23F" strokeWidth="8" />
      <ellipse cx="195" cy="720" rx="84" ry="22" fill="none" stroke="#FFF0F8" strokeWidth="6" />
      {/* Lampe sur pied qui diffuse */}
      <circle cx="338" cy="430" r="130" fill="url(#sl-lamp)" />
      <path d="M338 452 V590" stroke={INK} strokeWidth="7" />
      <ellipse cx="338" cy="594" rx="26" ry="8" fill="#2A1442" {...S} strokeWidth="3" />
      <path d="M306 452 L320 396 H356 L370 452Z" fill="#FFD23F" {...S} />
      {/* Plante */}
      <g transform="translate(24 470)">
        <path d="M30 30 C10 0 -4 -20 6 -40 C20 -20 26 0 30 30Z M34 30 C40 -6 54 -30 72 -36 C66 -10 50 10 34 30Z M32 30 C30 0 32 -30 40 -56 C48 -30 44 0 32 30Z" fill="#3DDC97" {...S} strokeWidth="3" />
        <path d="M8 30 H58 L52 92 H14Z" fill="#FF8A1F" {...S} />
      </g>
      <TopScrim id="salon" />
    </svg>
  );
}

function Bar() {
  const bottles = ["#3DDC97", "#FF3EA5", "#FFD23F", "#52C7FF", "#A98BFF", "#FF6B5B", "#FF8A1F"];
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="390" height="844" fill="#1B0E2C" />
      {/* Mur en briques sombres */}
      {Array.from({ length: 14 }, (_, i) => Array.from({ length: 6 }, (_, j) => (
        <rect key={`${i}-${j}`} x={j * 70 - (i % 2) * 35} y={i * 40 + 40} width="64" height="34" rx="4" fill="#2A1636" />
      )))}
      {/* Enseigne néon */}
      <g transform="translate(78 222) scale(0.6)">
        <rect x="-92" y="-44" width="184" height="88" rx="20" fill="#120720" stroke="#FF3EA5" strokeWidth="5" />
        <text x="0" y="17" textAnchor="middle" fontSize="50" fontWeight="900" fill="#FFE1F2" stroke="#FF3EA5" strokeWidth="3"
          style={{ fontFamily: "var(--font-display), system-ui, sans-serif", letterSpacing: "4px" }}>BAR</text>
      </g>
      {/* Lampes suspendues */}
      {[200, 335].map((x, k) => (
        <g key={k}>
          <path d={`M${x} 0 V250`} stroke={INK} strokeWidth="4" />
          <path d={`M${x - 26} 278 L${x - 14} 248 H${x + 14} L${x + 26} 278Z`} fill="#FFD23F" {...S} strokeWidth="3" />
          <path d={`M${x - 26} 278 L${x - 80} 470 H${x + 80} L${x + 26} 278Z`} fill="#FFD98A" opacity="0.13" />
        </g>
      ))}
      {/* Étagères de bouteilles */}
      {[330, 430].map((y, r) => (
        <g key={r}>
          {bottles.map((c, k) => {
            const x = 30 + k * 50 + (r ? 18 : 0);
            const h = 50 + ((k * 7 + r * 3) % 4) * 8;
            return (
              <g key={k}>
                <rect x={x} y={y - h} width="24" height={h} rx="7" fill={c} {...S} strokeWidth="3" />
                <rect x={x + 8} y={y - h - 16} width="8" height="18" rx="2" fill={c} {...S} strokeWidth="3" />
                <rect x={x + 5} y={y - h + 14} width="5" height={h - 24} rx="2" fill="#fff" opacity="0.45" />
              </g>
            );
          })}
          <rect x="0" y={y} width="390" height="12" fill="#7A4A26" {...S} strokeWidth="3" />
        </g>
      ))}
      {/* Comptoir */}
      <rect y="560" width="390" height="284" fill="#5A321A" />
      <rect y="548" width="390" height="22" rx="4" fill="#8A5A30" {...S} />
      {Array.from({ length: 6 }, (_, k) => <path key={k} d={`M${k * 70 + 30} 580 V844`} stroke="#4A2812" strokeWidth="6" />)}
      <TopScrim id="bar" />
    </svg>
  );
}

function Club() {
  const tiles = ["#FF3EA5", "#52C7FF", "#FFD23F", "#3DDC97", "#A98BFF"];
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="390" height="844" fill="#0B0620" />
      {/* Boule à facettes : calque animé (FX) */}
      {/* Enceintes */}
      {[0, 330].map((x, k) => (
        <g key={k} transform={`translate(${x} 470)`}>
          <rect width="60" height="110" rx="8" fill="#1E1440" {...S} />
          <circle cx="30" cy="34" r="16" fill="#2E2260" {...S} strokeWidth="3" />
          <circle cx="30" cy="80" r="11" fill="#2E2260" {...S} strokeWidth="3" />
        </g>
      ))}
      {/* Piste de danse qui s'allume */}
      <rect y="600" width="390" height="244" fill="#120A2C" />
      {Array.from({ length: 4 }, (_, r) => Array.from({ length: 6 }, (_, c) => (
        <rect key={`${r}-${c}`} x={c * 65 + 2} y={604 + r * 60} width="61" height="56" rx="6" fill={tiles[(r * 2 + c) % tiles.length]} opacity={0.45}
          style={{ animationDelay: `${-((r * 3 + c * 5) % 8) * 0.25}s` }} />
      )))}
      <TopScrim id="club" />
    </svg>
  );
}

function Beach() {
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="bc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4B2378" /><stop offset="0.45" stopColor="#FF6B8A" /><stop offset="1" stopColor="#FFC27A" />
        </linearGradient>
        <linearGradient id="bc-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A5BA8" /><stop offset="1" stopColor="#1E2F6E" /></linearGradient>
      </defs>
      <rect width="390" height="470" fill="url(#bc-sky)" />
      {/* Soleil qui se couche */}
      <circle cx="210" cy="462" r="92" fill="#FFD23F" />
      <circle cx="210" cy="462" r="70" fill="#FFE77A" />
      {/* Mer + reflets du soleil */}
      <rect y="460" width="390" height="200" fill="url(#bc-sea)" />
      {/* Vagues */}
      <path d="M-40 640 C0 620 40 660 80 640 C120 620 160 660 200 640 C240 620 280 660 320 640 C360 620 400 660 440 640 V680 H-40Z" fill="#52C7FF" />
      {/* Sable */}
      <path d="M0 660 C120 640 260 676 390 650 V844 H0Z" fill="#F4C27A" {...S} />
      {[[60, 740], [250, 780], [320, 712], [150, 800]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#D9A15A" />)}
      {/* Palmier */}
      <g transform="translate(40 660)">
        <path d="M10 0 C4 -80 16 -170 40 -230" fill="none" stroke="#8A5A30" strokeWidth="18" strokeLinecap="round" />
        <path d="M10 0 C4 -80 16 -170 40 -230" fill="none" stroke={INK} strokeWidth="4" strokeDasharray="2 18" />
        <g>
          {[-150, -100, -40, 10, 50].map((a, i) => (
            <path key={i} transform={`translate(40 -230) rotate(${a})`} d="M0 0 C30 -20 70 -16 100 4 C70 0 40 4 0 0Z" fill="#3DDC97" {...S} strokeWidth="3" />
          ))}
        </g>
      </g>
      <TopScrim id="beach" />
    </svg>
  );
}

function Volcano() {
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="vc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#14061F" /><stop offset="1" stopColor="#5A1220" /></linearGradient>
        <radialGradient id="vc-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FF6A1A" stopOpacity="0.6" /><stop offset="1" stopColor="#FF6A1A" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="390" height="844" fill="url(#vc-sky)" />
      <circle cx="195" cy="330" r="190" fill="url(#vc-glow)" />
      {/* Volcan */}
      <path d="M-20 700 L150 330 C170 318 220 318 240 330 L410 700Z" fill="#2E1018" {...S} />
      <path d="M150 330 C170 318 220 318 240 330 L226 352 C210 344 180 344 164 352Z" fill="#FF6A1A" {...S} strokeWidth="3" />
      {/* Coulées de lave */}
      <path d="M178 350 C172 420 186 470 160 560 C150 600 150 650 140 700" fill="none" stroke="#FF8A1F" strokeWidth="12" strokeLinecap="round" />
      <path d="M214 350 C224 410 236 460 262 540 C276 590 290 640 300 700" fill="none" stroke="#FFC12E" strokeWidth="9" strokeLinecap="round" />
      {/* Sol de roche avec fissures */}
      <rect y="690" width="390" height="154" fill="#1E0A10" />
      <path d="M30 730 l40 20 l-10 30 l50 18 M250 720 l30 30 l-20 26 l60 22" fill="none" stroke="#FF6A1A" strokeWidth="5" strokeLinecap="round" />
      <TopScrim id="volcano" />
    </svg>
  );
}

function Space() {
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <radialGradient id="sp-neb" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#A98BFF" stopOpacity="0.45" /><stop offset="1" stopColor="#A98BFF" stopOpacity="0" /></radialGradient>
        <radialGradient id="sp-neb2" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FF3EA5" stopOpacity="0.3" /><stop offset="1" stopColor="#FF3EA5" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="390" height="844" fill="#05031A" />
      <ellipse cx="90" cy="560" rx="220" ry="160" fill="url(#sp-neb)" />
      <ellipse cx="320" cy="300" rx="180" ry="140" fill="url(#sp-neb2)" />
      {/* Étoiles (deux couches qui scintillent) */}
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={(i * 97) % 390} cy={(i * 211) % 844} r={i % 5 === 0 ? 2.4 : 1.4} fill={i % 7 === 0 ? "#FFD23F" : "#fff"}
          style={{ animationDelay: `${(i % 6) * 0.5}s` }} />
      ))}
      {/* Planète à anneau */}
      <g transform="translate(300 200) rotate(-18)">
        <ellipse rx="96" ry="22" fill="none" stroke="#FFD23F" strokeWidth="10" />
        <circle r="58" fill="#FF8A1F" {...S} />
        <path d="M-54 -14 C-20 -4 20 -4 56 -16 M-50 20 C-16 30 24 28 52 18" stroke="#D2560A" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M-96 0 A96 22 0 0 0 96 0" fill="none" stroke="#FFD23F" strokeWidth="10" />
        <path d="M-96 0 A96 22 0 0 0 96 0" fill="none" stroke={INK} strokeWidth="3" />
      </g>
      {/* Petite lune */}
      <circle cx="70" cy="330" r="24" fill="#C9D1E2" {...S} strokeWidth="3" />
      <circle cx="62" cy="324" r="5" fill="#8E9AB5" /><circle cx="78" cy="340" r="4" fill="#8E9AB5" />
      {/* Astéroïdes au premier plan */}
      <path d="M0 760 C30 720 90 730 110 770 C120 800 80 844 30 844 H0Z" fill="#2E2554" {...S} />
      <path d="M300 800 C320 770 370 772 390 790 V844 H290Z" fill="#2E2554" {...S} />
      <TopScrim id="space" />
    </svg>
  );
}

function ZinzinWorld() {
  const rainbow = ["#FF3EA5", "#FF8A1F", "#FFD23F", "#3DDC97", "#52C7FF", "#A98BFF"];
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="zw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5B2BB8" /><stop offset="0.5" stopColor="#B06BFF" /><stop offset="1" stopColor="#FF9DD0" /></linearGradient>
      </defs>
      <rect width="390" height="844" fill="url(#zw-sky)" />
      {/* Arc-en-ciel */}
      {rainbow.map((c, i) => (
        <path key={i} d={`M${-10 + i * 16} 640 A${205 - i * 16} ${205 - i * 16} 0 0 1 ${400 - i * 16} 640`} fill="none" stroke={c} strokeWidth="16" />
      ))}
      <path d="M-18 640 A213 213 0 0 1 408 640" fill="none" stroke={INK} strokeWidth="4" />
      {/* Collines bonbon */}
      <path d="M0 680 C80 620 160 650 220 690 C280 650 340 640 390 670 V844 H0Z" fill="#FF7EC0" {...S} />
      <path d="M0 760 C100 720 200 760 280 740 C330 728 370 734 390 744 V844 H0Z" fill="#3DDC97" {...S} />
      {[[60, 700], [190, 712], [320, 700]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 0 V-40" stroke="#fff" strokeWidth="5" />
          <circle cy="-48" r="14" fill={rainbow[i * 2]} {...S} strokeWidth="3" />
          <path d={`M-8 -48 a8 8 0 0 1 16 0`} fill="none" stroke="#fff" strokeWidth="3" />
        </g>
      ))}
      <TopScrim id="zinzin" />
    </svg>
  );
}

const SCENES: Record<EnvId, () => React.JSX.Element> = { plain: Plain, salon: Salon, bar: Bar, club: Club, beach: Beach, volcano: Volcano, space: Space, zinzin: ZinzinWorld };

/* ───── Éléments animés : petits calques séparés posés sur le dessin fixe ─────
 * Dans un SVG plein écran, la moindre animation fait redessiner tout le dessin. Ici chaque élément qui bouge
 * est son propre petit calque (le téléphone le déplace / le fait clignoter sans rien redessiner).
 * Coordonnées dans le repère du dessin (390 × 844), recadrées comme lui (« slice »). */
interface Fx { x: number; y: number; w: number; h: number; cls: string; delay?: number; dur?: number; vars?: Record<string, string>; node: ReactNode }

const star = (c: string) => <path d="M10 0 C11.5 7 13 8.5 20 10 C13 11.5 11.5 13 10 20 C8.5 13 7 11.5 0 10 C7 8.5 8.5 7 10 0Z" fill={c} />;
const cloud = (blobFace: boolean) => (
  <g>
    <path d="M6 44 C0 22 20 8 38 16 C46 -2 78 -2 88 16 C108 12 118 30 110 44 Z" fill={blobFace ? "#fff" : "#FFE1EC"} stroke={blobFace ? INK : "none"} strokeWidth="4" strokeLinejoin="round" />
    {blobFace && <><circle cx="46" cy="30" r="3.5" fill={INK} /><circle cx="68" cy="30" r="3.5" fill={INK} /><path d="M50 36 Q57 42 64 36" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" /></>}
  </g>
);

const FX: Partial<Record<EnvId, Fx[]>> = {
  salon: [
    ...[[48, 278], [74, 252], [164, 300]].map(([x, y], i): Fx => ({ x, y, w: 7, h: 9, cls: "cs-twinkle", delay: -i * 0.9, node: <rect width="7" height="9" fill="#FFD23F" /> })),
  ],
  bar: [
    // Le néon grésille : un voile sombre qui clignote par-dessus l'enseigne
    { x: 22.8, y: 195.6, w: 110.4, h: 52.8, cls: "cs-neon", node: <rect width="110.4" height="52.8" rx="12" fill="#120720" /> },
  ],
  club: [
    { x: 300, y: 60, w: 90, h: 170, cls: "cs-ball", node: (
      <g transform="translate(45 120) scale(0.8)"><path d="M0 -120 V-46" stroke={INK} strokeWidth="4" />
        <circle r="44" fill="#C9D1E2" stroke={INK} strokeWidth="4" />
        {[-30, -15, 0, 15, 30].map((v) => <path key={`h${v}`} d={`M-44 ${v} H44 M${v} -44 V44`} stroke="#8E9AB5" strokeWidth="2.5" />)}
        <circle r="44" fill="none" stroke={INK} strokeWidth="4" /><path d="M-22 -24 l8 0 l0 8 l-8 0z" fill="#fff" /></g>) },
    ...[[0, 470], [330, 470]].map(([x, y], i): Fx => ({ x: x + 12, y: y + 16, w: 36, h: 36, cls: "cs-thump", delay: -i * 0.12, node: <circle cx="18" cy="18" r="16" fill="#2E2260" stroke={INK} strokeWidth="3" /> })),
    ...[[0, 1], [1, 4], [2, 2], [3, 5], [0, 3], [2, 0]].map(([r, c], i): Fx => ({ x: c * 65 + 2, y: 604 + r * 60, w: 61, h: 56, cls: "cs-tile", delay: -i * 0.33,
      node: <rect width="61" height="56" rx="6" fill={["#FF3EA5", "#52C7FF", "#FFD23F", "#3DDC97", "#A98BFF"][(r * 2 + c) % 5]} /> })),
  ],
  beach: [
    ...[[60, 290, 1], [290, 240, 0.8]].map(([x, y, k], i): Fx => ({ x, y, w: 120 * k, h: 50 * k, cls: "cs-cloud", delay: -i * 7, node: <g transform={`scale(${k})`}>{cloud(false)}</g> })),
    ...[0, 1, 2, 3, 4].map((i): Fx => ({ x: 160 + (i % 2) * 14, y: 478 + i * 24, w: 100 - i * 14, h: 6, cls: "cs-shimmer", delay: -i * 0.4,
      node: <rect width={100 - i * 14} height="6" rx="3" fill="#FFD23F" /> })),
  ],
  volcano: Array.from({ length: 9 }, (_, i): Fx => ({ x: 150 + (i * 23) % 100, y: 316, w: 10, h: 10, cls: "cs-ember", delay: -i * 0.55,
    vars: { "--dx": `${(i % 2 ? 1 : -1) * (12 + (i % 4) * 8)}px` }, node: <circle cx="5" cy="5" r={3 + (i % 3) * 0.7} fill={i % 2 ? "#FFC12E" : "#FF6A1A"} /> })),
  space: [
    ...[[40, 120], [180, 80], [350, 420], [120, 480], [260, 620], [30, 700]].map(([x, y], i): Fx => ({ x, y, w: 20, h: 20, cls: "cs-twinkle", delay: -i * 0.6, node: star(i % 2 ? "#FFD23F" : "#fff") })),
    { x: 300, y: 70, w: 96, h: 40, cls: "cs-shoot", node: <g><path d="M92 6 L4 36" stroke="#fff" strokeWidth="4" strokeLinecap="round" /><circle cx="92" cy="6" r="5" fill="#fff" /></g> },
  ],
  zinzin: [
    ...[[30, 220, 1], [250, 290, 0.85], [110, 370, 0.7]].map(([x, y, k], i): Fx => ({ x, y, w: 120 * k, h: 50 * k, cls: "cs-cloud", delay: -i * 5, node: <g transform={`scale(${k})`}>{cloud(true)}</g> })),
    ...Array.from({ length: 6 }, (_, i): Fx => ({ x: (i * 83) % 360 + 10, y: (i * 131) % 380 + 150, w: 20, h: 20, cls: "cs-twinkle", delay: -i * 0.4, node: star("#FFF36B") })),
  ],
};

function FxLayer({ env }: { env: EnvId }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ k: number; ox: number; oy: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight;
      const k = Math.max(w / 390, h / 844);
      setFit({ k, ox: (w - 390 * k) / 2, oy: (h - 844 * k) / 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const list = FX[env] ?? [];
  return (
    <div ref={ref} className="absolute left-0 top-0" style={fit ? { width: 390, height: 844, transform: `translate(${fit.ox}px, ${fit.oy}px) scale(${fit.k})`, transformOrigin: "0 0" } : { display: "none" }}>
      {list.map((f, i) => (
        <div key={i} className={`cs-fx ${f.cls}`} style={{ left: f.x, top: f.y, width: f.w, height: f.h, animationDelay: f.delay != null ? `${f.delay}s` : undefined, ...(f.vars ?? {}) } as CSSProperties}>
          <svg viewBox={`0 0 ${f.w} ${f.h}`} width={f.w} height={f.h} style={{ overflow: "visible", display: "block" }}>{f.node}</svg>
        </div>
      ))}
    </div>
  );
}

/** Décor plein écran, derrière le blob et les cartes. Mémorisé : ne se redessine que si le décor change. */
export const ClickerScene = memo(function ClickerScene({ env, still }: { env: EnvId; still?: boolean }) {
  const Scene = SCENES[env] ?? Salon;
  return (
    <div key={env} className={`cs-scene pointer-events-none absolute inset-0 overflow-hidden${still ? " cs-still" : ""}`} aria-hidden>
      <Scene />
      <FxLayer env={env} />
      {/* Boîte de nuit : faisceaux en calques séparés (le téléphone les fait pivoter sans rien redessiner) */}
      {env === "club" && ["#FF3EA5", "#52C7FF", "#FFD23F", "#3DDC97"].map((c, k) => (
        <span key={k} className="zz-disco-beam" style={{ left: `${15 + k * 23}%`, ["--c" as string]: c, animationDelay: `${-k * 0.6}s`, animationDuration: `${2.6 + (k % 2) * 0.6}s`, opacity: 0.22 } as CSSProperties} />
      ))}
    </div>
  );
});

/** Partie la plus reconnaissable de chaque décor (fraction de la hauteur où commence l'aperçu) */
const FOCUS: Record<EnvId, number> = { plain: 0.3, salon: 0.16, bar: 0.24, club: 0.66, beach: 0.42, volcano: 0.36, space: 0.16, zinzin: 0.6 };

/** Aperçu fixe d'un décor (fenêtre de choix du décor) : le dessin seul, sans animation, cadré sur l'essentiel. */
export const ScenePreview = memo(function ScenePreview({ env }: { env: EnvId }) {
  const Scene = SCENES[env] ?? Salon;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute left-0 top-0 w-full" style={{ aspectRatio: "390 / 844", transform: `translateY(-${FOCUS[env] * 100}%)` }}>
        <Scene />
      </div>
    </div>
  );
});
