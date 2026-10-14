import { useRef, useState } from "react";
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

/** Place de chaque perso dans le groupe (cadre 168×190, ancré en bas à droite de la carte). */
const SPOTS = [
  { left: 52, bottom: 0, size: 116, z: 4, mood: "laughing" as const, d: 0 },
  { left: 0, bottom: 10, size: 74, z: 3, mood: "happy" as const, d: 400 },
  { left: 106, bottom: 116, size: 62, z: 2, mood: "wink" as const, d: 800 },
  { left: 26, bottom: 92, size: 56, z: 1, mood: "love" as const, d: 1200 },
];

/** Persos montrés : ceux de la bande (s'ils ont un look), sinon la bande d'exemple. */
function useShownLooks(): { looks: AvatarLook[]; hasBand: boolean } {
  const band = useBand();
  const custom = band.some((b) => b.look);
  if (!custom) return { looks: SAMPLE_BAND, hasBand: band.length > 0 };
  // « Moi » en premier (au centre), puis l'ordre de la bande
  const ordered = [...band].sort((a, b) => Number(b.me) - Number(a.me));
  return {
    looks: ordered.slice(0, 4).map((b) => b.look ?? baseLook(colorForIndexSafe(band.indexOf(b)))),
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
          {/* La bande, en groupe, déborde de la carte */}
          <div className="zz-band-grp pointer-events-none absolute" style={{ right: -10, bottom: -16, width: 168, height: 190 }}>
            {looks.slice(0, 4).map((look, i) => {
              const s = SPOTS[i];
              return (
                <div key={i} className="zz-band-bob absolute" style={{ left: s.left, bottom: s.bottom, zIndex: s.z, ["--d" as string]: `${-s.d}ms` }}>
                  <AvatarBlob look={look} size={s.size} mood={s.mood} animate={active && i < 2} />
                </div>
              );
            })}
          </div>
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
