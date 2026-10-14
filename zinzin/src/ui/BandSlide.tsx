import { useLayoutEffect, useRef, useState } from "react";
import type { MascotMood } from "@/components/Mascot";
import { ArrowRight } from "lucide-react";
import { type Lang, pick } from "@/lib/i18n";
import type { ZFeatured } from "../catalog";
import { BAND_SLIDE } from "../strings";
import { Tag } from "./common";
import { haptic } from "./util";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { AvatarEditor } from "@/components/avatar/AvatarEditor";
import { BandScreen } from "@/components/avatar/BandScreen";
import { useBand } from "@/components/avatar/PlayerBlob";
import { colorForIndexSafe } from "@/components/avatar/colors";
import { baseLook, type AvatarLook } from "@/lib/avatar/look";
import { setBand } from "@/lib/saved-players";

/**
 * Bande d'exemple (bande vide ou sans looks) : déjà déguisée pour donner envie,
 * dont 2 éléments Zinzin+ (couronne, casque audio).
 */
export const SAMPLE_BAND: AvatarLook[] = [
  { color: "yellow", eyes: "happy", hair: "swoop", hairColor: "brown", hat: "crown", face: "blush", extra: "none" },
  { color: "mint", eyes: "wink", hair: "afro", hairColor: "auto", hat: "cap", face: "shades", extra: "none" },
  { color: "sky", eyes: "big", hair: "mohawk", hairColor: "pink", hat: "none", face: "round", extra: "headphones" },
  { color: "coral", eyes: "star", hair: "bun", hairColor: "auto", hat: "party", face: "freckles", extra: "bowtie" },
];

/**
 * Composition « photo de groupe serrée » selon la taille de la bande (1 à 6 persos montrés).
 * Unités libres (le « moi » fait ~100) : cx = centre horizontal, s = taille, row = rang
 * (0 = devant ; un rang de derrière se tient juste derrière ceux qu'il chevauche, le visage
 * au-dessus de leur tête), raise = pieds surélevés (rang 0), z = plan (plus grand = devant).
 * Le 1er de chaque liste est « moi » : devant, au centre. Plusieurs variantes par taille :
 * on garde celle qui donne les plus grands persos dans la place libre.
 */
interface Spot { cx: number; s: number; row: number; z: number; mood: MascotMood; raise?: number }
type N = 1 | 2 | 3 | 4 | 5 | 6;
const MAX_SHOWN = 6;
const LAYOUTS: Record<N, Spot[][]> = {
  1: [[{ cx: 0, s: 100, row: 0, z: 9, mood: "laughing" }]],
  2: [
    // Le pote par-dessus l'épaule
    [
      { cx: 12, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -34, s: 82, row: 1, z: 5, mood: "wink" },
    ],
    // Épaule contre épaule
    [
      { cx: 14, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -56, s: 84, row: 0, z: 5, mood: "wink", raise: 10 },
    ],
  ],
  3: [
    // Pyramide : deux têtes derrière, de chaque côté
    [
      { cx: 0, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -36, s: 76, row: 1, z: 5, mood: "wink" },
      { cx: 36, s: 74, row: 1, z: 4, mood: "happy" },
    ],
    // En ligne serrée, « moi » un peu devant
    [
      { cx: 0, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -58, s: 80, row: 0, z: 5, mood: "wink", raise: 10 },
      { cx: 58, s: 78, row: 0, z: 4, mood: "happy", raise: 12 },
    ],
  ],
  4: [
    [
      { cx: 0, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -38, s: 74, row: 1, z: 5, mood: "wink" },
      { cx: 38, s: 72, row: 1, z: 4, mood: "happy" },
      { cx: 0, s: 64, row: 2, z: 2, mood: "love" },
    ],
    [
      { cx: 0, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -56, s: 78, row: 0, z: 5, mood: "wink", raise: 10 },
      { cx: 56, s: 76, row: 0, z: 4, mood: "happy", raise: 12 },
      { cx: 0, s: 68, row: 1, z: 2, mood: "love" },
    ],
  ],
  5: [
    [
      { cx: 0, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -38, s: 72, row: 1, z: 5, mood: "wink" },
      { cx: 38, s: 70, row: 1, z: 4, mood: "happy" },
      { cx: -24, s: 60, row: 2, z: 2, mood: "love" },
      { cx: 24, s: 58, row: 2, z: 1, mood: "laughing" },
    ],
    [
      { cx: 0, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -56, s: 76, row: 0, z: 5, mood: "wink", raise: 10 },
      { cx: 56, s: 74, row: 0, z: 4, mood: "happy", raise: 12 },
      { cx: -26, s: 64, row: 1, z: 2, mood: "love" },
      { cx: 26, s: 62, row: 1, z: 1, mood: "laughing" },
    ],
  ],
  6: [
    [
      { cx: 0, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -40, s: 70, row: 1, z: 5, mood: "wink" },
      { cx: 40, s: 68, row: 1, z: 4, mood: "happy" },
      { cx: -38, s: 56, row: 2, z: 3, mood: "love" },
      { cx: 0, s: 56, row: 2, z: 2, mood: "laughing" },
      { cx: 38, s: 54, row: 2, z: 1, mood: "wink" },
    ],
    [
      { cx: 0, s: 100, row: 0, z: 9, mood: "laughing" },
      { cx: -56, s: 76, row: 0, z: 5, mood: "wink", raise: 10 },
      { cx: 56, s: 74, row: 0, z: 4, mood: "happy", raise: 12 },
      { cx: -40, s: 62, row: 1, z: 3, mood: "love" },
      { cx: 0, s: 62, row: 1, z: 2, mood: "laughing" },
      { cx: 40, s: 60, row: 1, z: 1, mood: "wink" },
    ],
  ],
};

/** Étendue visible d'un perso (cheveux, chapeau, ombre compris), en fraction de sa taille. */
interface Ext { l: number; r: number; t: number; b: number }
const EXT0: Ext = { l: -0.12, r: 1.12, t: -0.5, b: 1.06 };
/** Corps du blob dans son repère (fractions de la taille) : x 0,1 → 0,9 ; haut du corps à 0,88 au-dessus du bas. */
const BODY_L = 0.12, BODY_R = 0.88, BODY_TOP = 0.88;
/** Part du corps d'un perso de derrière cachée par la tête de devant (les yeux restent dégagés). */
const HIDE = 0.3;

/** Positions en unités : pieds (by), et boîte visible de chaque perso. */
function compose(spots: Spot[], ext: Ext[]) {
  const placed: { x: number; by: number; s: number; row: number; box: { l: number; r: number; t: number; b: number } }[] = [];
  spots.forEach((sp, i) => {
    const e = ext[i] ?? EXT0;
    const x = sp.cx - sp.s / 2;
    let by = sp.raise ?? 0;
    if (sp.row > 0) {
      // Debout derrière ceux qu'on chevauche : le bas du corps passe derrière leur tête
      // (chapeau / coupe comptés en partie seulement : un haut-de-forme ne repousse pas toute la rangée)
      const bl = x + BODY_L * sp.s, br = x + BODY_R * sp.s;
      by = -Infinity;
      for (const p of placed) {
        if (p.row >= sp.row) continue;
        const pl = p.x + BODY_L * p.s, pr = p.x + BODY_R * p.s;
        if (Math.min(br, pr) - Math.max(bl, pl) > 0.08 * Math.min(sp.s, p.s)) {
          by = Math.max(by, Math.min(p.box.t, p.by + (BODY_TOP + 0.22) * p.s) - HIDE * sp.s);
        }
      }
      if (by === -Infinity) by = sp.raise ?? 0;
    }
    // y vers le haut : bas de la boîte = by, haut = by + s
    placed.push({
      x, by, s: sp.s, row: sp.row,
      box: { l: x + e.l * sp.s, r: x + e.r * sp.s, t: by + (1 - e.t) * sp.s, b: by + (1 - e.b) * sp.s },
    });
  });
  return placed;
}

/** Le groupe : mesuré (vraie silhouette de chaque perso) puis mis à l'échelle de la place libre. */
function BandGroup({ looks, active }: { looks: AvatarLook[]; active: boolean }) {
  const n = Math.max(1, Math.min(MAX_SHOWN, looks.length)) as N;
  const host = useRef<HTMLDivElement>(null);
  const blobs = useRef<(HTMLDivElement | null)[]>([]);
  const [ext, setExt] = useState<Ext[]>([]);
  const [area, setArea] = useState<{ x0: number; w: number; h: number } | null>(null);
  const sig = looks.slice(0, MAX_SHOWN).map((l) => JSON.stringify(l)).join("|");

  // Silhouette réelle de chaque perso (le SVG déborde de sa boîte : chapeaux, cheveux…)
  useLayoutEffect(() => {
    const next = looks.slice(0, n).map((_, i) => {
      const svg = blobs.current[i]?.querySelector("svg");
      if (!svg) return EXT0;
      try {
        const bb = (svg as SVGSVGElement).getBBox();
        const m = 4; // contour + ombre dure
        return { l: (bb.x - m) / 120, r: (bb.x + bb.width + m) / 120, t: (bb.y - m) / 120, b: Math.max(1.04, (bb.y + bb.height + m) / 120) };
      } catch { return EXT0; }
    });
    setExt((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, n]);

  // Place libre : à droite du texte réellement affiché (lignes du titre, sous-titre, étiquette, bouton)
  useLayoutEffect(() => {
    const el = host.current;
    const txt = el?.parentElement?.querySelector<HTMLElement>(".zz-band-txt");
    if (!el || !txt) return;
    const measure = () => {
      const h = el.getBoundingClientRect();
      let right = h.left;
      const range = document.createRange();
      const walk = document.createTreeWalker(txt, NodeFilter.SHOW_TEXT);
      for (let t = walk.nextNode(); t; t = walk.nextNode()) {
        range.selectNodeContents(t);
        for (const r of Array.from(range.getClientRects())) right = Math.max(right, r.right);
      }
      for (const c of Array.from(txt.querySelectorAll<HTMLElement>("span"))) right = Math.max(right, c.getBoundingClientRect().right);
      // Rotation / ombre des étiquettes : petite marge en plus
      const x0 = Math.max(0, Math.ceil(right - h.left + 12));
      const w = Math.max(0, el.clientWidth - x0), hh = el.clientHeight;
      setArea((a) => (a && a.x0 === x0 && a.w === w && a.h === hh ? a : { x0, w, h: hh }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(txt);
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  // Variante qui donne les plus grands persos dans la place disponible
  let best = { spots: LAYOUTS[n][0], placed: compose(LAYOUTS[n][0], ext), k: -1, minX: 0, minY: 0, offX: 0 };
  for (const spots of LAYOUTS[n]) {
    const placed = compose(spots, ext);
    const minX = Math.min(...placed.map((p) => p.box.l)), maxX = Math.max(...placed.map((p) => p.box.r));
    const minY = Math.min(...placed.map((p) => p.box.b)), maxY = Math.max(...placed.map((p) => p.box.t));
    const k = area ? Math.min(area.w / (maxX - minX), area.h / (maxY - minY), 1.25) : 0;
    if (k > best.k) best = { spots, placed, k, minX, minY, offX: area ? (area.w - (maxX - minX) * k) / 2 : 0 };
  }
  const { spots, placed, k, minX, minY, offX } = best;

  return (
    <div ref={host} className="zz-band-grp pointer-events-none absolute" style={{ visibility: area ? undefined : "hidden" }}>
      {spots.map((sp, i) => {
        const look = looks[i];
        if (!look) return null;
        const p = placed[i];
        const size = Math.round(p.s * k) || 1;
        return (
          <div key={i} className="zz-band-bob absolute" style={{
            left: (area?.x0 ?? 0) + offX + (p.x - minX) * k, bottom: (p.by - minY) * k, zIndex: sp.z,
            ["--d" as string]: `${-i * 400}ms`,
          }}>
            <div ref={(el) => { blobs.current[i] = el; }}>
              <AvatarBlob look={look} size={size} mood={sp.mood} animate={active && i < 2} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Persos montrés : ceux de la bande (s'ils ont un look), sinon la bande d'exemple. */
function useShownLooks(): { looks: AvatarLook[]; hasBand: boolean } {
  const band = useBand();
  const custom = band.some((b) => b.look);
  if (!custom) return { looks: SAMPLE_BAND, hasBand: band.length > 0 };
  // « Moi » en premier (au centre), puis l'ordre de la bande
  const ordered = [...band].sort((a, b) => Number(b.me) - Number(a.me));
  return {
    looks: ordered.slice(0, MAX_SHOWN).map((b) => b.look ?? baseLook(colorForIndexSafe(band.indexOf(b)))),
    hasBand: true,
  };
}

/**
 * 1re slide du carrousel : « Personnalise ta bande ».
 * Toucher → « Ma bande » si elle existe, sinon l'éditeur pour créer son perso (« moi »).
 */
export function BandSlide({ f, lang, active, hidden }: { f: ZFeatured; lang: Lang; active: boolean; hidden: boolean }) {
  const t = pick(BAND_SLIDE, lang);
  const band = useBand();
  const { looks, hasBand } = useShownLooks();
  const [open, setOpen] = useState<"band" | "create" | null>(null);
  const action = hasBand ? t.see : t.create;
  // Perso créé : on enchaîne sur « Ma bande » (pour ajouter les potes)
  const created = useRef(false);

  const onOpen = () => {
    haptic();
    setOpen(band.length ? "band" : "create");
  };

  return (
    <div className="px-5 pb-6 pt-7" aria-hidden={hidden || undefined}>
      <button
        type="button"
        onClick={onOpen}
        tabIndex={hidden ? -1 : 0}
        className="zz-push block w-full rounded-[30px]"
        aria-label={t.aria(action)}
      >
        <div
          className="zz-stk relative h-[232px] w-full overflow-visible rounded-[30px] px-6 pt-4 text-left"
          style={{ background: f.bg, color: f.ink }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[27px] opacity-30" style={{ background: "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.55), transparent 45%)" }} />
          <div className="zz-band-txt relative" style={{ zIndex: 5 }}>
            <Tag bg="#fff" color="var(--zz-ink)" tilt={-4}>{f.kicker[lang]}</Tag>
            <h2 className="zz-title mt-2" style={{ fontSize: "clamp(23px, 7.4vw, 31px)", lineHeight: 0.94 }}>{f.title[lang]}</h2>
            <p className="zz-band-sub mt-1.5 font-semibold leading-snug" style={{ opacity: 0.88 }}>{f.subtitle[lang]}</p>
            <span className="zz-band-cta zz-stk-sm mt-2.5 inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full font-bold" style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "2deg" }}>
              {action} <ArrowRight size={16} strokeWidth={3} />
            </span>
          </div>
          {/* La bande, en groupe, dans la place libre à droite du texte */}
          <BandGroup looks={looks} active={active} />
        </div>
      </button>

      {open === "band" && <BandScreen onClose={() => setOpen(null)} />}
      {open === "create" && (
        <AvatarEditor
          name=""
          look={null}
          colorHint={colorForIndexSafe(0)}
          editName
          showMe
          isMe
          voice={{ id: null }}
          onClose={() => { setOpen(created.current ? "band" : null); created.current = false; }}
          onSave={({ name, look, me, voice }) => {
            // Premier perso de la bande (la bande était vide)
            setBand([{ name, look, me, voice: voice ?? null }]);
            created.current = true;
          }}
        />
      )}
    </div>
  );
}
