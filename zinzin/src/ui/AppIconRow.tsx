import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { useT, type I18n } from "@/lib/i18n";
import { requestPaywall } from "@/lib/entitlements";
import { APP_ICONS, appIconSupported, currentAppIcon, setAppIcon, type AppIconId } from "../app-icon";
import { haptic } from "./util";

const STR: I18n<{ title: string; sub: string; names: Record<AppIconId, string>; aria: (n: string) => string; locked: string; failed: string }> = {
  fr: {
    title: "Icône de l'app",
    sub: "Réservé à Zinzin+",
    names: { classic: "Classique", or: "Or", nuit: "Nuit", neon: "Néon" },
    aria: (n) => `Icône ${n}`,
    locked: "(Zinzin+)",
    failed: "L'icône n'a pas pu changer, réessaie.",
  },
  en: {
    title: "App icon",
    sub: "Zinzin+ only",
    names: { classic: "Classic", or: "Gold", nuit: "Night", neon: "Neon" },
    aria: (n) => `${n} icon`,
    locked: "(Zinzin+)",
    failed: "Couldn't change the icon, try again.",
  },
  es: {
    title: "Icono de la app",
    sub: "Solo con Zinzin+",
    names: { classic: "Clásico", or: "Oro", nuit: "Noche", neon: "Neón" },
    aria: (n) => `Icono ${n}`,
    locked: "(Zinzin+)",
    failed: "No se pudo cambiar el icono, inténtalo otra vez.",
  },
};

/**
 * Réglages : « Icône de l'app » (Classique + Or, Nuit, Néon pour Zinzin+).
 * Masquée si l'appareil ne sait pas changer d'icône (web, simulateur sans support…).
 */
export function AppIconRow({ premium, toast }: { premium: boolean; toast: (m: string) => void }) {
  const t = useT(STR);
  const [supported, setSupported] = useState(false);
  const [current, setCurrent] = useState<AppIconId>("classic");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void appIconSupported().then(async (ok) => {
      if (!alive || !ok) return;
      const cur = await currentAppIcon();
      if (alive) { setCurrent(cur); setSupported(true); }
    });
    return () => { alive = false; };
  }, []);

  if (!supported) return null;

  const choose = async (id: AppIconId) => {
    if (busy || id === current) return;
    haptic();
    // Les variantes sont dans Zinzin+ : cadenas → écran d'abonnement, puis on applique si débloqué
    if (id !== "classic" && !premium && !(await requestPaywall())) return;
    setBusy(true);
    const ok = await setAppIcon(id);
    setBusy(false);
    if (ok) setCurrent(id);
    else toast(t.failed);
  };

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="zz-title text-[20px] text-white">{t.title}</div>
        {!premium && <div className="text-[13px] font-semibold" style={{ color: "var(--zz-dim)" }}>{t.sub}</div>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {APP_ICONS.map((ic) => {
          const on = ic.id === current;
          const locked = ic.id !== "classic" && !premium;
          const name = t.names[ic.id];
          return (
            <button
              key={ic.id}
              type="button"
              onClick={() => void choose(ic.id)}
              aria-pressed={on}
              aria-label={`${t.aria(name)}${locked ? ` ${t.locked}` : ""}`}
              className="zz-push flex min-h-12 flex-col items-center gap-1.5 rounded-[18px] pb-1.5 pt-2 text-[12px] font-extrabold tracking-tight"
              style={{ background: on ? "#FFD23F" : "rgba(255,255,255,0.08)", color: on ? "var(--zz-ink)" : "#fff", rotate: on ? "-2deg" : undefined }}
            >
              <span className="relative block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${import.meta.env.BASE_URL}${ic.thumb}`} alt="" width={52} height={52} draggable={false}
                  className="block h-[52px] w-[52px] rounded-[12px]" style={{ border: "2.5px solid var(--zz-ink)", opacity: locked ? 0.75 : 1 }} />
                {locked && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full" style={{ background: "#FF3EA5", color: "#fff", border: "2px solid var(--zz-ink)" }}>
                    <Lock size={10} strokeWidth={3.4} />
                  </span>
                )}
                {on && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full" style={{ background: "#3DDC97", color: "var(--zz-ink)", border: "2px solid var(--zz-ink)" }}>
                    <Check size={11} strokeWidth={3.6} />
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
