import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Play, WifiOff } from "lucide-react";
import { pick, useLang } from "@/lib/i18n";
import { ONBOARDING, SOIREE } from "../strings";
import { ZBlob, type ZColor } from "./ZBlob";
import type { ZCostume } from "./costumes";
import { BigBtn } from "./common";
import { haptic, reducedMotion } from "./util";
import { uiSfx } from "@/lib/ui-sfx";

/**
 * Tutoriel du premier lancement : 3 écrans courts (swipe ou « Suivant »),
 * après le splash / l'âge et avant le paywall. Une seule fois (clé locale),
 * on peut le revoir depuis les Réglages.
 */

const KEY = "zz-onboarded";

export const isOnboarded = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return true; }
};
const setOnboarded = () => {
  try { localStorage.setItem(KEY, "1"); } catch { /* stockage indisponible */ }
};

export function Onboarding({ onDone }: { onDone: () => void }) {
  const lang = useLang();
  const t = pick(ONBOARDING, lang);
  const soireeName = pick(SOIREE, lang).name;
  const [page, setPage] = useState(0);
  const [out, setOut] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const n = t.slides.length;
  const last = page === n - 1;

  const finish = () => {
    if (out) return;
    setOnboarded();
    setOut(true);
    setTimeout(onDone, 240);
  };

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: reducedMotion() ? "auto" : "smooth" });
  };

  // Page courante = position du swipe (scroll-snap natif)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setPage(Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [n]);

  const art: ReactNode[] = [<ArtPass key="a" />, <ArtPick key="b" soiree={soireeName} />, <ArtOffline key="c" />];

  return (
    <div
      className="zz-page fixed inset-0 flex flex-col"
      style={{ zIndex: 46, opacity: out ? 0 : 1, transition: "opacity 240ms ease" }}
      role="dialog"
      aria-modal
      aria-label={t.label}
    >
      {/* « Passer », discret */}
      <div className="flex justify-end px-3" style={{ paddingTop: "calc(var(--sat) + 6px)" }}>
        <button
          type="button"
          onClick={() => { haptic(); finish(); }}
          className="zz-tap min-h-11 rounded-full px-4 text-[15px] font-bold"
          style={{ color: "var(--zz-dim)", visibility: last ? "hidden" : undefined }}
        >
          {t.skip}
        </button>
      </div>

      {/* Écrans (swipe horizontal) */}
      <div ref={track} className="zz-carousel min-h-0 flex-1" aria-live="polite">
        {t.slides.map((s, i) => (
          <section
            key={i}
            className="flex h-full min-w-0 flex-col items-center justify-center overflow-hidden px-6 text-center"
            aria-roledescription="slide"
            aria-label={t.pageOf(i + 1, n)}
            aria-hidden={i !== page}
          >
            <div className="zz-ob-art relative grid w-full place-items-center">
              {/* Re-monté quand on arrive sur l'écran : les entrées rejouent */}
              {i === page ? art[i] : <div style={{ opacity: 0 }}>{art[i]}</div>}
            </div>
            <h1 key={`h${i}-${i === page}`} className="zz-title zz-rise mt-6 max-w-[340px] text-white" style={{ fontSize: "min(34px, 9vw)", ["--d" as string]: "60ms" }}>
              {s.title}
            </h1>
            <p key={`p${i}-${i === page}`} className="zz-rise mt-3 max-w-[330px] text-[17px] font-medium leading-snug" style={{ color: "var(--zz-dim)", ["--d" as string]: "140ms" }}>
              {s.text}
            </p>
            {i === n - 1 && (
              <p className="zz-rise mt-4 max-w-[320px] rounded-[16px] px-3.5 py-2 text-[14px] font-bold leading-snug" style={{ background: "rgba(255,210,63,0.12)", color: "#FFD23F", ["--d" as string]: "220ms" }}>
                {t.adult}
              </p>
            )}
          </section>
        ))}
      </div>

      {/* Indicateur + bouton */}
      <div className="mx-auto w-full max-w-md px-6" style={{ paddingBottom: "calc(var(--sab) + 18px)" }}>
        <div className="mb-5 flex items-center justify-center gap-2" role="tablist" aria-label={t.label}>
          {t.slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={t.pageOf(i + 1, n)}
              onClick={() => goTo(i)}
              className="zz-tap grid h-11 place-items-center px-1"
            >
              <span
                className="block h-2.5 rounded-full"
                style={{ width: i === page ? 28 : 10, background: i === page ? "#FFD23F" : "rgba(255,255,255,0.28)", transition: "width 260ms var(--zz-ease), background 260ms" }}
              />
            </button>
          ))}
        </div>
        <BigBtn
          onClick={() => { haptic(last ? "medium" : "light"); uiSfx.primary(); if (last) finish(); else goTo(page + 1); }}
          bg={last ? "#FF3EA5" : "#FFD23F"}
          color={last ? "#fff" : "var(--zz-ink)"}
        >
          {last ? t.start : <>{t.next}<ChevronRight size={24} strokeWidth={3} /></>}
        </BigBtn>
      </div>
    </div>
  );
}

/* ───────── Illustrations (blobs + stickers) ───────── */

const pop = (d: number) => ({ ["--d" as string]: `${d}ms` });

/** 1 · Le téléphone passe de main en main */
function ArtPass() {
  const band: { color: ZColor; mood: "happy" | "laughing" | "wink"; seed: number }[] = [
    { color: "yellow", mood: "wink", seed: 1 },
    { color: "pink", mood: "laughing", seed: 0 },
    { color: "mint", mood: "happy", seed: 5 },
  ];
  // Petits écrans (iPhone SE 1re gén.) : la scène rétrécit
  const k = Math.min(1, ((typeof window !== "undefined" ? window.innerWidth : 390) - 48) / 300);
  return (
    <div className="relative" style={{ width: 300 * k, height: "100%", ["--ob-x" as string]: `${108 * k}px` }}>
      <div className="zz-ob-phone absolute left-1/2 top-[6%] -ml-[25px]" aria-hidden>
        <div className="zz-stk grid h-[84px] w-[50px] place-items-center rounded-[14px]" style={{ background: "#fff" }}>
          <div className="grid h-[62px] w-[36px] place-items-center rounded-[8px]" style={{ background: "#7A4EE8" }}>
            <ZBlob size={26} color="yellow" mood="happy" seed={2} shadow={false} wobble={false} hop={false} />
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[4%] flex items-end justify-between">
        {band.map((b, i) => (
          <div key={b.color} className="zz-pop" style={pop(80 + i * 90)}>
            <ZBlob size={Math.round((i === 1 ? 100 : 84) * k)} color={b.color} mood={b.mood} seed={b.seed} outline shadow={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 2 · Des jeux… ou la Soirée qui les enchaîne */
function ArtPick({ soiree }: { soiree: string }) {
  const games: { color: ZColor; costume: ZCostume; bg: string; tilt: number }[] = [
    { color: "purple", costume: "wolf", bg: "#FFD23F", tilt: -5 },
    { color: "pink", costume: "potato", bg: "#4ECDC4", tilt: 4 },
    { color: "mint", costume: "spy", bg: "#FF6B5B", tilt: 3 },
    { color: "yellow", costume: "ten", bg: "#A98BFF", tilt: -4 },
  ];
  return (
    <div className="relative grid h-full grid-cols-2 place-content-center gap-3">
      {games.map((g, i) => (
        <div key={g.costume} className="zz-pop zz-stk grid h-[min(104px,14dvh)] w-[min(104px,14dvh)] place-items-center rounded-[22px]" style={{ ...pop(60 + i * 80), background: g.bg, rotate: `${g.tilt}deg` }}>
          <ZBlob size={68} color={g.color} mood="happy" seed={i} costume={g.costume} shadow={false} wobble={i % 2 === 0} hop={false} />
        </div>
      ))}
      <div className="zz-pop absolute left-1/2 top-1/2 z-[1]" style={{ ...pop(420), translate: "-50% -50%" }}>
        <span className="zz-stk zz-title zz-ob-wiggle inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[19px]" style={{ background: "#FF3EA5", color: "#fff" }}>
          <Play size={18} strokeWidth={3} fill="#fff" /> {soiree}
        </span>
      </div>
    </div>
  );
}

/** 3 · Hors ligne, sans compte, 18+ */
function ArtOffline() {
  return (
    <div className="relative grid h-full place-items-center">
      <div className="zz-pop relative" style={pop(60)}>
        <ZBlob size={150} color="sky" mood="cool" seed={3} outline shadow={false} />
        <span className="zz-stk absolute -left-9 top-1 grid h-[62px] w-[62px] place-items-center rounded-full" style={{ background: "#fff", color: "var(--zz-ink)", rotate: "-12deg" }}>
          <WifiOff size={30} strokeWidth={2.8} />
        </span>
        <span className="zz-stk zz-title absolute -right-8 -top-1 grid h-[62px] w-[62px] place-items-center rounded-full text-[22px]" style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "14deg" }}>
          18+
        </span>
      </div>
    </div>
  );
}
