import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";

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
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setOut(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  return (
    <div className="fixed inset-0" style={{ zIndex: 40 }} role="dialog" aria-modal aria-label={label}>
      <div className={`zz-backdrop ${out ? "is-out" : ""}`} onClick={close} />
      <div
        className={`zz-sheet ${out ? "is-out" : ""} absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-lg flex-col overflow-hidden`}
        style={{ maxHeight, background: bg, borderRadius: "32px 32px 0 0", boxShadow: "0 -20px 60px rgba(0,0,0,0.45)" }}
      >
        {children(close)}
      </div>
    </div>
  );
}

/** Bouton rond ≥ 44 px (fermer, réglages…). */
export function RoundBtn({
  onClick, label, children, style, className,
}: { onClick: () => void; label: string; children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`zz-press grid h-11 w-11 shrink-0 place-items-center rounded-full ${className ?? ""}`}
      style={{ background: "rgba(255,255,255,0.1)", color: "#fff", ...style }}
    >
      {children}
    </button>
  );
}

export function CloseBtn({ onClick, style }: { onClick: () => void; style?: CSSProperties }) {
  return (
    <RoundBtn onClick={onClick} label="Fermer" style={{ background: "rgba(10,4,32,0.38)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", ...style }}>
      <X size={22} strokeWidth={2.6} />
    </RoundBtn>
  );
}

export function Chip({ children, bg, color, style }: { children: ReactNode; bg: string; color: string; style?: CSSProperties }) {
  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-bold leading-none"
      style={{ background: bg, color, letterSpacing: "0.01em", ...style }}
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
        className="zz-pop rounded-full px-5 py-3 text-center text-[15px] font-semibold text-white"
        style={{ background: "rgba(30,18,70,0.96)", border: "1px solid var(--zz-line)", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}
      >
        {msg}
      </div>
    </div>
  ) : null;
  return { show, node };
}
