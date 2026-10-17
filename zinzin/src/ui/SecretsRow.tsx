import { useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import { useFoundSecrets } from "@/lib/secrets-found";
import { HALLOWEEN_SECRETS, SECRETS, SECRETS_UI, type SecretInfo } from "../secrets-list";
import { SEASON } from "../season";
import { haptic } from "./util";
import { uiSfx } from "@/lib/ui-sfx";

/**
 * Réglages : « Secrets trouvés 7 / 18 » avec une barre ; touché → la liste (nom si trouvé,
 * « ??? » + petit indice sinon). Bonus Halloween à part (montré en saison ou dès qu'un est trouvé).
 */
export function SecretsRow() {
  const lang = useLang();
  const t = pick(SECRETS_UI, lang);
  const found = useFoundSecrets();
  const [open, setOpen] = useState(false);
  const n = SECRETS.filter((s) => found.has(s.id)).length;
  const nh = HALLOWEEN_SECRETS.filter((s) => found.has(s.id)).length;
  const showBonus = SEASON === "halloween" || nh > 0;

  const row = (s: SecretInfo) => {
    const ok = found.has(s.id);
    return (
      <li key={s.id} className="flex items-center gap-2.5 py-1.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: ok ? "#3DDC97" : "rgba(255,255,255,0.12)", color: ok ? "var(--zz-ink)" : "var(--zz-dim)" }}>
          {ok ? <Check size={15} strokeWidth={3.4} /> : <Lock size={13} strokeWidth={3} />}
        </span>
        <span className="min-w-0 text-[15px] leading-snug">
          {ok
            ? <span className="font-bold text-white">{s.name[lang]}</span>
            : <><span className="font-bold" style={{ color: "var(--zz-dim)" }}>??? </span><span className="font-semibold" style={{ color: "var(--zz-mute)" }}>{s.hint[lang]}</span></>}
        </span>
      </li>
    );
  };

  return (
    <div className="mt-5 rounded-[22px] px-4 py-3" style={{ background: "rgba(255,255,255,0.08)" }}>
      <button
        type="button"
        onClick={() => { haptic("light"); uiSfx.choice(); setOpen((o) => !o); }}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 text-left"
      >
        <span className="text-[22px]" aria-hidden>🔍</span>
        <span className="min-w-0 flex-1">
          <span className="zz-title block text-[19px] text-white">{t.title}</span>
          <span className="mt-1.5 block h-2.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.14)" }}>
            <span className="block h-full rounded-full" style={{ width: `${(n / SECRETS.length) * 100}%`, background: "#FFD23F", transition: "width 400ms ease" }} />
          </span>
        </span>
        <span className="zz-title shrink-0 text-[20px]" style={{ color: "#FFD23F" }}>{t.found(n, SECRETS.length)}</span>
        <ChevronDown size={20} strokeWidth={3} className="shrink-0 text-white" style={{ rotate: open ? "180deg" : "0deg", transition: "rotate 200ms" }} />
      </button>
      {open && (
        <div className="mt-2">
          <ul>{SECRETS.map(row)}</ul>
          {showBonus && (
            <>
              <p className="mt-3 text-[14px] font-extrabold" style={{ color: "#FF8A1F" }}>🎃 {t.bonus(nh, HALLOWEEN_SECRETS.length)}</p>
              <ul>{HALLOWEEN_SECRETS.map(row)}</ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
