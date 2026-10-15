import { useEffect, useState, type RefObject } from "react";
import { useT, type I18n } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { batteryInfo } from "../app-icon";
import { haptic, homeVisible } from "./util";

/**
 * Secret de l'accueil : batterie sous 10 % (et pas en charge) → les blobs de l'accueil ont l'air épuisés
 * (yeux mi-clos, ils s'affaissent un peu : classe « zz-tired », zinzin.css) et l'un d'eux soupire
 * dans une bulle « Branche-moi, je meurs… 🔋 ». ~4 s, une fois par heure au plus (localStorage).
 * Seulement si l'accueil est réellement à l'écran. Batterie : plugin natif de l'app (iOS),
 * navigator.getBattery sur le web s'il existe, sinon rien.
 * Pour tester : `?zzBattery=1` dans l'URL (force une batterie à 5 %, sans la limite d'une heure).
 */

const KEY = "zz-low-battery-at";
const HOUR = 3_600_000;
const SHOW_MS = 4000;
const LOW = 0.1;
/** Vérifications : peu après l'arrivée sur l'accueil, au retour au premier plan, puis toutes les 2 min */
const FIRST_MS = 2500;
const EVERY_MS = 120_000;

const LINES: I18n<string[]> = {
  fr: ["Branche-moi, je meurs… 🔋", "Plus de jus… on se recharge ? 🔋", "Je tiens plus debout… 🔋"],
  en: ["Plug me in, I'm dying… 🔋", "Running on empty… recharge? 🔋", "I can barely stand… 🔋"],
  es: ["Enchúfame, que me muero… 🔋", "Sin batería… ¿recargamos? 🔋", "Ya no me tengo en pie… 🔋"],
};

const forced = () => {
  try { return new URLSearchParams(location.search).get("zzBattery") === "1"; } catch { return false; }
};
const lastShown = () => {
  try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; }
};

/** Le blob qui soupire : celui d'une carte de jeu entièrement visible, sinon un autre grand blob visible. */
function pickBlob(home: HTMLElement): HTMLElement | null {
  const ok = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.top > 60 && r.left >= 0 && r.right <= innerWidth && r.bottom < innerHeight - 40;
  };
  const cards = Array.from(home.querySelectorAll<HTMLElement>(".zz-rail .zz-cblob")).filter(ok);
  if (cards.length) return cards[Math.floor(Math.random() * cards.length)];
  // Haut de l'accueil : un blob (ou un perso de la bande) aux yeux ouverts de la carte « à la une » ou de la Soirée
  const others = Array.from(home.querySelectorAll<HTMLElement>(".zb, .av-wob")).filter((el) => el.offsetWidth >= 44 && ok(el));
  const open = others.filter((el) => !!el.querySelector(".zb-blink, .av-blink"));
  const pool = open.length ? open : others;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

type Sigh = { id: number; x: number; y: number; line: number };

export function TiredBlob({ homeRef }: { homeRef: RefObject<HTMLElement | null> }) {
  const lines = useT(LINES);
  const [sigh, setSigh] = useState<Sigh | null>(null);

  useEffect(() => {
    const force = forced();
    let shownNow = false;
    let busy = false;
    let off: ReturnType<typeof setTimeout> | undefined;
    let first: ReturnType<typeof setTimeout> | undefined;
    let n = 0;

    const check = async () => {
      const home = homeRef.current;
      if (busy || shownNow || !home || document.hidden || !homeVisible(home)) return;
      if (!force && Date.now() - lastShown() < HOUR) return;
      busy = true;
      const b = force ? { level: 0.05, charging: false } : await batteryInfo();
      busy = false;
      if (!b || b.charging || b.level >= LOW) return;
      // L'accueil a pu être recouvert pendant la lecture de la batterie
      if (document.hidden || !homeVisible(home)) return;
      const el = pickBlob(home);
      if (!el) return;
      shownNow = true;
      try { localStorage.setItem(KEY, String(Date.now())); } catch { /* stockage indisponible */ }
      const r = el.getBoundingClientRect();
      home.classList.add("zz-tired");
      setSigh({ id: ++n, x: r.left + r.width / 2, y: r.top, line: Math.floor(Math.random() * LINES.fr.length) });
      haptic();
      playSfx("whooshdown", { volume: 0.25, rate: 0.8 });
      clearTimeout(off);
      off = setTimeout(() => {
        home.classList.remove("zz-tired");
        setSigh(null);
        // Une fois par heure : la prochaine vérification ne repassera qu'après (sauf test forcé, une fois par ouverture)
        if (!force) shownNow = false;
      }, SHOW_MS);
    };

    first = setTimeout(check, FIRST_MS);
    const every = setInterval(check, EVERY_MS);
    const onVis = () => { if (!document.hidden) { clearTimeout(first); first = setTimeout(check, FIRST_MS); } };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(first);
      clearTimeout(off);
      clearInterval(every);
      document.removeEventListener("visibilitychange", onVis);
      homeRef.current?.classList.remove("zz-tired");
    };
  }, [homeRef]);

  if (!sigh) return null;
  const w = Math.min(250, innerWidth - 32);
  const left = Math.max(16, Math.min(innerWidth - 16 - w, sigh.x - w / 2));
  return (
    <div key={sigh.id} className="zz-tired-sigh pointer-events-none fixed flex justify-center"
      style={{ left, width: w, bottom: innerHeight - sigh.y + 4, zIndex: 6, ["--zz-ox" as string]: `${Math.round(sigh.x - left)}px` }}>
      <span role="status" className="zz-stk-sm rounded-[18px] px-3 py-1.5 text-center text-[14px] font-extrabold leading-snug" style={{ background: "#fff", color: "var(--zz-ink)" }}>
        {lines[sigh.line % lines.length]}
      </span>
    </div>
  );
}
