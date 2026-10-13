import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { buy, defaultPlans, isTestMode, loadPlans, restore, type Plan } from "../premium";
import { pick, useLang } from "@/lib/i18n";
import { UI } from "../strings";
import { ZBlob } from "./ZBlob";
import { BigBtn, CloseBtn } from "./common";
import { haptic } from "./util";

/** Couleurs des 4 avantages (textes : UI.perks) */
const PERK_COLORS = ["#FF3EA5", "#FFD23F", "#7A4EE8", "#3DDC97"];

/** « 14,99 € » / 12 → « 1,24 € », « $14.99 » → « $1.24 » : même format que le prix d'origine. */
function perMonth(price: string): string | null {
  const m = price.match(/\d+(?:[.,]\d{1,2})?/);
  if (!m) return null;
  const sep = m[0].includes(",") ? "," : ".";
  const n = parseFloat(m[0].replace(",", "."));
  if (!isFinite(n) || n <= 0) return null;
  return price.replace(m[0], (Math.floor((n / 12) * 100) / 100).toFixed(2).replace(".", sep));
}

export function Paywall({
  onClose, onUnlocked, onLegal, toast,
}: {
  onClose: () => void;
  onUnlocked: () => void;
  onLegal: (page: "cgu" | "confidentialite" | "mentions") => void;
  toast: (m: string) => void;
}) {
  const lang = useLang();
  const t = pick(UI, lang);
  const [plans, setPlans] = useState<Plan[]>(() => defaultPlans(lang));
  const [sel, setSel] = useState<string>("monthly");
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
    if (ok) { haptic("success"); toast(t.welcome); leave(onUnlocked); }
    else toast(t.buyFailed);
  };

  const onRestore = async () => {
    if (busy) return;
    haptic();
    setBusy("restore");
    const ok = await restore();
    setBusy(null);
    if (ok) { toast(t.restored); leave(onUnlocked); }
    else toast(t.nothingToRestore);
  };

  return (
    <div
      className="zz-scroll zz-page fixed inset-0 flex flex-col"
      style={{ zIndex: 45, opacity: out ? 0 : 1, transform: out ? "scale(0.98)" : "none", transition: "opacity 240ms ease, transform 240ms ease" }}
      role="dialog"
      aria-modal
      aria-label="Zinzin Premium"
    >
      <div className="absolute right-3 z-10" style={{ top: "calc(var(--sat) + 8px)" }}>
        <CloseBtn onClick={() => { haptic(); leave(onClose); }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5" style={{ paddingTop: "calc(var(--sat) + 14px)", paddingBottom: "calc(var(--sab) + 12px)" }}>
        {/* Trio de blobs */}
        <div className="relative mx-auto flex h-[88px] w-[230px] items-end justify-center">
          <div className="zz-pop absolute bottom-1 left-1" style={{ ["--d" as string]: "120ms" }}>
            <ZBlob size={58} color="yellow" mood="shocked" seed={3} outline shadow={false} />
          </div>
          <div className="zz-pop absolute bottom-0 right-0" style={{ ["--d" as string]: "220ms" }}>
            <ZBlob size={54} color="mint" mood="love" seed={6} outline shadow={false} />
          </div>
          <div className="zz-pop relative z-[1]" style={{ ["--d" as string]: "40ms" }}>
            <ZBlob size={84} color="pink" mood="laughing" seed={0} outline crown shadow={false} />
          </div>
        </div>

        <h1 className="zz-title zz-rise mt-4 text-center text-white" style={{ fontSize: 37, ["--d" as string]: "80ms" }}>
          {t.paywallTitle1}
          <br />
          <span className="zz-stk mt-1.5 inline-block rounded-[16px] px-3 pb-1 pt-0.5" style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-3deg" }}>{t.paywallTitle2}</span>
        </h1>

        <ul className="zz-rise mx-auto mt-5 grid w-full max-w-[330px] gap-2" style={{ ["--d" as string]: "160ms" }}>
          {t.perks.map((text, i) => (
            <li key={text} className="flex items-center gap-3 text-[16px] font-bold text-white">
              <span className="zz-stk-sm grid h-8 w-8 shrink-0 place-items-center rounded-[10px]" style={{ background: PERK_COLORS[i % PERK_COLORS.length], color: "var(--zz-ink)", rotate: `${i % 2 ? 6 : -6}deg` }}>
                <Check size={17} strokeWidth={3.6} />
              </span>
              {text}
            </li>
          ))}
        </ul>

        {/* Offres */}
        <div className="zz-rise mt-6 grid grid-cols-3 gap-3" style={{ ["--d" as string]: "240ms" }} role="radiogroup" aria-label={t.plansLabel}>
          {plans.map((p) => {
            const on = p.id === sel;
            // Formule connue : textes dans la langue courante
            const txt = p.kind ? t.plans[p.kind] : p;
            const pm = p.kind === "yearly" ? perMonth(p.price) : null;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => { haptic(); setSel(p.id); }}
                className="zz-push relative flex min-h-[118px] flex-col items-center justify-center rounded-[22px] px-1.5 pb-3 pt-5 text-center"
                style={{
                  background: on ? "#fff" : "var(--zz-plum)",
                  color: on ? "var(--zz-ink)" : "#fff",
                  border: "3px solid var(--zz-ink)",
                  boxShadow: on ? "0 6px 0 var(--zz-ink)" : "0 3px 0 var(--zz-ink)",
                  rotate: on ? "-2deg" : "0deg",
                  translate: on ? "0 -4px" : "0 0",
                  transition: "background 160ms, rotate 260ms var(--zz-spring), translate 260ms var(--zz-spring)",
                }}
              >
                {txt.badge && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-[3px] text-[12px] font-bold"
                    style={{ background: "#FF3EA5", color: "#fff", border: "2px solid var(--zz-ink)", rotate: "3deg" }}
                  >
                    {txt.badge}
                  </span>
                )}
                <span className="text-[13px] font-bold" style={{ opacity: on ? 0.75 : 0.7 }}>{txt.title}</span>
                {/* Prix toujours sur une ligne (« 14,99 € » ne se coupe pas sur petit écran) */}
                <span className="zz-title mt-1 whitespace-nowrap" style={{ fontSize: "min(24px, 5.4vw)" }}>{p.price}</span>
                <span className="mt-1 text-[12px] font-semibold" style={{ opacity: 0.65 }}>{txt.period}</span>
                {pm && <span className="mt-1 whitespace-nowrap text-[12px] font-bold" style={{ color: on ? "#C41F78" : "#FFD23F" }}>{pm}{t.perMonthSuffix}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="zz-rise mt-5" style={{ ["--d" as string]: "320ms" }}>
          <BigBtn onClick={onBuy} disabled={busy !== null} bg="#FF3EA5" color="#fff">
            {busy === "buy" ? <Loader2 className="animate-spin" size={24} /> : t.buyCta}
          </BigBtn>
        </div>
        <p className="mt-3 text-center text-[13px]" style={{ color: "var(--zz-mute)" }}>
          {t.autoRenew}
        </p>

        <div className="flex items-center justify-center whitespace-nowrap text-[13px] font-semibold" style={{ color: "var(--zz-dim)" }}>
          <button type="button" className="zz-tap min-h-11 px-2" onClick={onRestore} disabled={busy !== null}>
            {busy === "restore" ? t.restoring : t.restore}
          </button>
          <span aria-hidden style={{ color: "var(--zz-mute)" }}>·</span>
          <a href="#cgu" className="zz-tap flex min-h-11 items-center px-2.5" onClick={(e) => { e.preventDefault(); onLegal("cgu"); }}>{t.terms}</a>
          <span aria-hidden style={{ color: "var(--zz-mute)" }}>·</span>
          <a href="#confidentialite" className="zz-tap flex min-h-11 items-center px-2.5" onClick={(e) => { e.preventDefault(); onLegal("confidentialite"); }}>{t.privacy}</a>
        </div>

        {test && (
          <p className="text-center text-[12px]" style={{ color: "rgba(255,210,63,0.7)" }}>
            {t.testMode}
          </p>
        )}
      </div>
    </div>
  );
}
