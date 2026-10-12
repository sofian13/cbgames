import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { DEFAULT_PLANS, buy, isTestMode, loadPlans, restore, type Plan } from "../premium";
import { ZBlob } from "./ZBlob";
import { CloseBtn } from "./common";
import { haptic } from "./util";

const PERKS: { text: string; color: string }[] = [
  { text: "Tous les jeux, sans limite", color: "#FF3EA5" },
  { text: "De nouveaux jeux chaque mois", color: "#FFD23F" },
  { text: "Les packs 18+ débloqués", color: "#7A4EE8" },
  { text: "Zéro pub, jamais", color: "#3DDC97" },
];

/** « 14,99 € » / 12 → « 1,25 € » (pour l'annuel). */
function perMonth(price: string): string | null {
  const n = parseFloat(price.replace(/[^\d,.]/g, "").replace(",", "."));
  if (!isFinite(n) || n <= 0) return null;
  return (Math.floor((n / 12) * 100) / 100).toFixed(2).replace(".", ",") + " €";
}

export function Paywall({
  onClose, onUnlocked, onLegal, toast,
}: {
  onClose: () => void;
  onUnlocked: () => void;
  onLegal: (page: "cgu" | "confidentialite") => void;
  toast: (m: string) => void;
}) {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [sel, setSel] = useState<string>(DEFAULT_PLANS[1].id);
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);
  const [out, setOut] = useState(false);
  const test = isTestMode();

  useEffect(() => {
    let alive = true;
    loadPlans().then((p) => {
      if (!alive || !p.length) return;
      setPlans(p);
      setSel((cur) => (p.some((x) => x.id === cur) ? cur : (p[1] ?? p[0]).id));
    });
    return () => { alive = false; };
  }, []);

  const leave = (cb: () => void) => { setOut(true); setTimeout(cb, 240); };

  const onBuy = async () => {
    const plan = plans.find((p) => p.id === sel);
    if (!plan || busy) return;
    haptic("medium");
    setBusy("buy");
    const ok = await buy(plan);
    setBusy(null);
    if (ok) { haptic("success"); toast("Bienvenue dans la folie !"); leave(onUnlocked); }
    else toast("Achat non finalisé");
  };

  const onRestore = async () => {
    if (busy) return;
    haptic();
    setBusy("restore");
    const ok = await restore();
    setBusy(null);
    if (ok) { toast("Achats restaurés"); leave(onUnlocked); }
    else toast("Aucun achat à restaurer");
  };

  return (
    <div
      className="zz-scroll fixed inset-0 flex flex-col"
      style={{ zIndex: 45, background: "var(--zz-bg)", opacity: out ? 0 : 1, transform: out ? "scale(0.98)" : "none", transition: "opacity 240ms ease, transform 240ms ease" }}
      role="dialog"
      aria-modal
      aria-label="Zinzin Premium"
    >
      {/* Halos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="zz-glow" style={{ width: 360, height: 360, left: "50%", top: -120, marginLeft: -180, background: "#7A4EE8", opacity: 0.5 }} />
        <div className="zz-glow" style={{ width: 260, height: 260, right: -120, top: 260, background: "#FF3EA5", opacity: 0.22 }} />
      </div>

      <div className="absolute right-3 z-10" style={{ top: "calc(var(--sat) + 8px)" }}>
        <CloseBtn onClick={() => { haptic(); leave(onClose); }} style={{ background: "rgba(255,255,255,0.12)" }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5" style={{ paddingTop: "calc(var(--sat) + 16px)", paddingBottom: "calc(var(--sab) + 14px)" }}>
        {/* Trio de blobs */}
        <div className="relative mx-auto flex h-[108px] w-[250px] items-end justify-center">
          <div className="zz-pop absolute bottom-1 left-2" style={{ ["--d" as string]: "120ms" }}>
            <ZBlob size={70} color="yellow" mood="shocked" seed={3} />
          </div>
          <div className="zz-pop absolute bottom-0 right-1" style={{ ["--d" as string]: "220ms" }}>
            <ZBlob size={64} color="mint" mood="love" seed={6} />
          </div>
          <div className="zz-pop relative z-[1]" style={{ ["--d" as string]: "40ms" }}>
            <ZBlob size={104} color="pink" mood="laughing" seed={0} />
          </div>
        </div>

        <h1 className="zz-font zz-rise mt-2 text-center text-white" style={{ fontSize: 33, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.03em", ["--d" as string]: "80ms" }}>
          Débloque toute{" "}
          <span style={{ background: "linear-gradient(90deg,#FF3EA5,#FFD23F)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>la folie</span>
        </h1>

        <ul className="zz-rise mx-auto mt-4 grid w-full max-w-[320px] gap-2" style={{ ["--d" as string]: "160ms" }}>
          {PERKS.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-[16px] font-semibold text-white">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: p.color, color: "#15082E" }}>
                <Check size={15} strokeWidth={3.4} />
              </span>
              {p.text}
            </li>
          ))}
        </ul>

        {/* Offres */}
        <div className="zz-rise mt-6 grid grid-cols-3 gap-2.5" style={{ ["--d" as string]: "240ms" }} role="radiogroup" aria-label="Offres">
          {plans.map((p) => {
            const on = p.id === sel;
            const pm = /an/.test(p.period) ? perMonth(p.price) : null;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => { haptic(); setSel(p.id); }}
                className="zz-press relative flex min-h-[108px] flex-col items-center justify-center rounded-[22px] px-1.5 pb-3 pt-4 text-center"
                style={{
                  background: on ? "linear-gradient(180deg, rgba(255,62,165,0.22), rgba(255,62,165,0.08))" : "rgba(255,255,255,0.05)",
                  border: `2px solid ${on ? "#FF3EA5" : "rgba(255,255,255,0.1)"}`,
                  boxShadow: on ? "0 8px 30px rgba(255,62,165,0.28)" : "none",
                  transition: "background 200ms, border-color 200ms, box-shadow 200ms",
                }}
              >
                {p.badge && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-extrabold uppercase"
                    style={{ background: on ? "#FF3EA5" : "#FFD23F", color: on ? "#fff" : "#2A1A00", letterSpacing: "0.03em" }}
                  >
                    {p.badge}
                  </span>
                )}
                <span className="text-[13px] font-bold" style={{ color: on ? "#fff" : "var(--zz-dim)" }}>{p.title}</span>
                <span className="zz-font mt-1 text-[22px] font-bold leading-none text-white" style={{ letterSpacing: "-0.02em" }}>{p.price}</span>
                <span className="mt-1 text-[12px]" style={{ color: "var(--zz-mute)" }}>{p.period}</span>
                {pm && <span className="mt-1 text-[11px] font-semibold" style={{ color: "#FFD23F" }}>soit {pm}/mois</span>}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onBuy}
          disabled={busy !== null}
          className="zz-press zz-rise mt-5 flex h-[58px] w-full items-center justify-center gap-2 rounded-full text-[18px] font-extrabold text-white"
          style={{ background: "linear-gradient(90deg,#FF3EA5,#FF6B5B)", boxShadow: "0 12px 34px rgba(255,62,165,0.42)", ["--d" as string]: "320ms" }}
        >
          {busy === "buy" ? <Loader2 className="animate-spin" size={22} /> : "Continuer"}
        </button>
        <p className="mt-2.5 text-center text-[12px]" style={{ color: "var(--zz-mute)" }}>
          Renouvellement automatique, annulable à tout moment.
        </p>

        <div className="flex items-center justify-center whitespace-nowrap text-[13px] font-semibold" style={{ color: "var(--zz-dim)" }}>
          <button type="button" className="zz-tap min-h-11 px-2" onClick={onRestore} disabled={busy !== null}>
            {busy === "restore" ? "Restauration…" : "Restaurer mes achats"}
          </button>
          <span aria-hidden style={{ color: "var(--zz-mute)" }}>·</span>
          <a href="#cgu" className="zz-tap flex min-h-11 items-center px-2.5" onClick={(e) => { e.preventDefault(); onLegal("cgu"); }}>Conditions</a>
          <span aria-hidden style={{ color: "var(--zz-mute)" }}>·</span>
          <a href="#confidentialite" className="zz-tap flex min-h-11 items-center px-2.5" onClick={(e) => { e.preventDefault(); onLegal("confidentialite"); }}>Confidentialité</a>
        </div>

        {test && (
          <p className="text-center text-[12px]" style={{ color: "rgba(255,210,63,0.6)" }}>
            Mode test : l'achat débloque gratuitement
          </p>
        )}
      </div>
    </div>
  );
}
