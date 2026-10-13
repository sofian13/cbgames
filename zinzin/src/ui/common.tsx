import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { UI } from "../strings";

/** Bottom sheet avec animation d'entrée/sortie. `children` reçoit `close`. */
export function Sheet({
  onClose, children, maxHeight = "92dvh", bg = "var(--zz-bg-2)", label,
}: {
  onClose: () => void;
  children: (close: () => void) => ReactNode;
  maxHeight?: string;
  bg?: string;
  label: string;
}) {
  const [out, setOut] = useState(false);
  const close = useCallback(() => {
    if (out) return;
    setOut(true);
    setTimeout(onClose, 250);
  }, [out, onClose]);

  return (
    <div className="fixed inset-0" style={{ zIndex: 40 }} role="dialog" aria-modal aria-label={label}>
      <div className={`zz-backdrop ${out ? "is-out" : ""}`} onClick={close} />
      <div
        className={`zz-sheet ${out ? "is-out" : ""} absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-lg flex-col overflow-hidden`}
        style={{ maxHeight, background: bg, borderRadius: "32px 32px 0 0", border: "3px solid var(--zz-ink)", borderBottom: 0, boxShadow: "0 -20px 60px rgba(0,0,0,0.45)" }}
      >
        {children(close)}
      </div>
    </div>
  );
}

/** Bouton rond ≥ 44 px façon sticker (fermer, réglages…). */
export function RoundBtn({
  onClick, label, children, style, className,
}: { onClick: () => void; label: string; children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`zz-push zz-stk-sm grid h-11 w-11 shrink-0 place-items-center rounded-full ${className ?? ""}`}
      style={{ background: "#fff", color: "var(--zz-ink)", ...style }}
    >
      {children}
    </button>
  );
}

export function CloseBtn({ onClick, style }: { onClick: () => void; style?: CSSProperties }) {
  const t = useT(UI);
  return (
    <RoundBtn onClick={onClick} label={t.close} style={style}>
      <X size={22} strokeWidth={3} />
    </RoundBtn>
  );
}

/** Gros bouton plein, contour épais + ombre dure (l'action principale). */
export function BigBtn({
  onClick, children, bg, color = "var(--zz-ink)", disabled, className, style, label,
}: {
  onClick: () => void;
  children: ReactNode;
  bg: string;
  color?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`zz-push zz-stk zz-title flex h-[62px] w-full items-center justify-center gap-2 rounded-full text-[22px] ${className ?? ""}`}
      style={{ background: bg, color, letterSpacing: "-0.01em", ...style }}
    >
      {children}
    </button>
  );
}

/** Étiquette « sticker » inclinée (Nouveau, 18+, Gratuit…), en phrase normale. */
export function Tag({ children, bg, color = "var(--zz-ink)", tilt = -3, style }: { children: ReactNode; bg: string; color?: string; tilt?: number; style?: CSSProperties }) {
  return (
    <span
      className="inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-[13px] font-bold leading-none"
      style={{ background: bg, color, border: "2px solid var(--zz-ink)", boxShadow: "0 2px 0 var(--zz-ink)", rotate: `${tilt}deg`, ...style }}
    >
      {children}
    </span>
  );
}

/** Petit toast éphémère en bas d'écran. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = msg ? (
    <div className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-6" style={{ top: "calc(var(--sat) + 12px)" }} role="status">
      <div
        key={msg}
        className="zz-pop zz-stk-sm rounded-full px-5 py-3 text-center text-[15px] font-bold"
        style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "-1.5deg" }}
      >
        {msg}
      </div>
    </div>
  ) : null;
  return { show, node };
}
