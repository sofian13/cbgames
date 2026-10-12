import { Suspense, lazy, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, CreditCard, FileText, Mail, RotateCcw, Shield, Sparkles, X } from "lucide-react";
import { getZGame } from "../catalog";
import { isTestMode, resetPremiumForTests, restore } from "../premium";
import { ZBlob } from "./ZBlob";
import { RoundBtn, Sheet } from "./common";
import { APP_VERSION, haptic, setAgeOk } from "./util";

export type LegalPage = "cgu" | "confidentialite";

/* ───────── Vérification d'âge (premier lancement) ───────── */
export function AgeGate({ onOk }: { onOk: () => void }) {
  const [out, setOut] = useState(false);
  return (
    <div
      className="fixed inset-0 flex flex-col items-center px-7 text-center"
      style={{ zIndex: 46, background: "var(--zz-bg)", paddingTop: "calc(var(--sat) + 48px)", paddingBottom: "calc(var(--sab) + 20px)", opacity: out ? 0 : 1, transition: "opacity 240ms ease" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="zz-glow" style={{ width: 340, height: 340, left: "50%", top: 40, marginLeft: -170, background: "#7A4EE8", opacity: 0.4 }} />
      </div>
      <div className="flex-1" />
      <div className="zz-pop relative">
        <ZBlob size={150} color="purple" mood="sus" seed={1} />
        <span className="zz-font absolute -right-5 top-2 grid h-14 w-14 rotate-12 place-items-center rounded-full text-[19px] font-bold" style={{ background: "#FFD23F", color: "#2A1A00", boxShadow: "0 6px 18px rgba(0,0,0,0.3)" }}>18+</span>
      </div>
      <h1 className="zz-font zz-rise mt-6 text-white" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", ["--d" as string]: "100ms" }}>
        Zinzin est réservé aux 18 ans et plus
      </h1>
      <p className="zz-rise mt-4 max-w-[320px] text-[16px] leading-relaxed" style={{ color: "var(--zz-dim)", ["--d" as string]: "180ms" }}>
        Les jeux à boire se jouent avec modération, eau et soft acceptés.
      </p>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => { haptic("medium"); setAgeOk(); setOut(true); setTimeout(onOk, 240); }}
        className="zz-press zz-rise flex h-[58px] w-full max-w-md items-center justify-center rounded-full text-[18px] font-extrabold text-white"
        style={{ background: "linear-gradient(90deg,#7A4EE8,#FF3EA5)", boxShadow: "0 12px 34px rgba(122,78,232,0.4)", ["--d" as string]: "260ms" }}
      >
        J'ai 18 ans ou plus
      </button>
    </div>
  );
}

/* ───────── Réglages ───────── */
export function SettingsSheet({
  premium, onClose, onUnlock, onLegal, toast,
}: {
  premium: boolean;
  onClose: () => void;
  onUnlock: () => void;
  onLegal: (p: LegalPage) => void;
  toast: (m: string) => void;
}) {
  const test = isTestMode();
  return (
    <Sheet onClose={onClose} label="Réglages" maxHeight="88dvh">
      {(close) => (
        <div className="zz-scroll px-5 pt-3" style={{ paddingBottom: "calc(var(--sab) + 18px)" }}>
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between">
            <h2 className="zz-font text-white" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>Réglages</h2>
            <RoundBtn onClick={close} label="Fermer"><X size={21} strokeWidth={2.6} /></RoundBtn>
          </div>

          {/* Statut */}
          <div className="mt-4 flex items-center gap-3 rounded-[22px] p-3.5" style={{ background: premium ? "linear-gradient(90deg, rgba(255,210,63,0.18), rgba(255,210,63,0.06))" : "rgba(255,255,255,0.05)", border: "1px solid var(--zz-line)" }}>
            <ZBlob size={52} color={premium ? "yellow" : "lavender"} mood={premium ? "cool" : "happy"} seed={2} shadow={false} wobble={false} />
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-extrabold text-white">{premium ? "Zinzin Premium" : "Version gratuite"}</div>
              <div className="text-[13px]" style={{ color: "var(--zz-dim)" }}>{premium ? "Tous les jeux sont débloqués" : "3 jeux offerts"}</div>
            </div>
            {!premium && (
              <button type="button" onClick={() => { close(); setTimeout(onUnlock, 260); }} className="zz-press h-11 rounded-full px-4 text-[14px] font-extrabold text-white" style={{ background: "#FF3EA5" }}>
                Débloquer
              </button>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-[22px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--zz-line)" }}>
            <Row icon={<RotateCcw size={19} />} label="Restaurer mes achats" onClick={async () => {
              haptic();
              const ok = await restore();
              toast(ok ? "Achats restaurés" : "Aucun achat à restaurer");
            }} />
            <Row icon={<CreditCard size={19} />} label="Gérer l'abonnement" href="https://apps.apple.com/account/subscriptions" />
            <Row icon={<FileText size={19} />} label="Conditions d'utilisation" onClick={() => onLegal("cgu")} />
            <Row icon={<Shield size={19} />} label="Confidentialité" onClick={() => onLegal("confidentialite")} />
            <Row icon={<Mail size={19} />} label="Nous contacter" href="mailto:contact@zinzin.app" last />
          </div>

          {test && (
            <button
              type="button"
              onClick={() => { resetPremiumForTests(); haptic(); toast("Retour en gratuit (test)"); }}
              className="zz-press mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] text-[14px] font-bold"
              style={{ background: "rgba(255,210,63,0.08)", color: "#FFD23F", border: "1px dashed rgba(255,210,63,0.4)" }}
            >
              <Sparkles size={16} /> Revenir en gratuit (test)
            </button>
          )}

          <p className="mt-5 text-center text-[12px]" style={{ color: "var(--zz-mute)" }}>
            Zinzin · version {APP_VERSION}
          </p>
        </div>
      )}
    </Sheet>
  );
}

function Row({ icon, label, onClick, href, last }: { icon: ReactNode; label: string; onClick?: () => void; href?: string; last?: boolean }) {
  const cls = "zz-tap flex min-h-[54px] w-full items-center gap-3 px-4 text-left text-[16px] font-semibold text-white active:bg-white/5";
  const style = { borderBottom: last ? "none" : "1px solid var(--zz-line)" };
  const inner = (
    <>
      <span style={{ color: "var(--zz-dim)" }}>{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={18} style={{ color: "var(--zz-mute)" }} />
    </>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={cls} style={style}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls} style={style}>{inner}</button>;
}

/* ───────── Pages légales (à compléter) ───────── */
export function LegalScreen({ page, onClose }: { page: LegalPage; onClose: () => void }) {
  const title = page === "cgu" ? "Conditions d'utilisation" : "Politique de confidentialité";
  return (
    <div className="zz-screen-in zz-scroll fixed inset-0" style={{ zIndex: 70, background: "var(--zz-bg)" }} role="dialog" aria-modal aria-label={title}>
      <div className="mx-auto max-w-lg px-5" style={{ paddingTop: "calc(var(--sat) + 8px)", paddingBottom: "calc(var(--sab) + 24px)" }}>
        <RoundBtn onClick={onClose} label="Retour"><ChevronLeft size={24} strokeWidth={2.4} /></RoundBtn>
        <h1 className="zz-font mt-4 text-white" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{title}</h1>
        <p className="mt-4 text-[16px] leading-relaxed" style={{ color: "var(--zz-dim)" }}>
          Texte à compléter.
        </p>
        <p className="mt-3 text-[16px] leading-relaxed" style={{ color: "var(--zz-dim)" }}>
          {page === "cgu"
            ? "Zinzin est une application de jeux de soirée réservée aux personnes majeures. L'abonnement se renouvelle automatiquement et peut être annulé à tout moment depuis les réglages de ton compte."
            : "Zinzin fonctionne entièrement hors-ligne : les prénoms saisis restent sur ton téléphone. Aucune donnée personnelle n'est collectée par l'application."}
        </p>
      </div>
    </div>
  );
}

/* ───────── Jeu en plein écran ───────── */
export function GameScreen({ id, onExit }: { id: string; onExit: () => void }) {
  const game = getZGame(id)!;
  const Comp = useMemo(() => lazy(game.load), [game]);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="zz-screen-in fixed inset-0 flex flex-col overflow-y-auto" style={{ background: "#0A0420", zIndex: 30 }}>
      <Suspense fallback={<Loading />}>
        <Comp roomCode="LOCAL" playerId="local" playerName="Joueur" onReturnToLobby={onExit} />
      </Suspense>

      {/* Quitter : discret, en haut à gauche (le coin droit reste aux jeux) */}
      <button
        type="button"
        onClick={() => { haptic(); setConfirm(true); }}
        aria-label="Quitter la partie"
        className="zz-press fixed left-2 grid h-11 w-11 place-items-center rounded-full"
        style={{ top: "calc(var(--sat) + 6px)", zIndex: 60, background: "rgba(10,4,32,0.45)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <X size={19} strokeWidth={2.6} />
      </button>

      {confirm && (
        <div className="fixed inset-0 grid place-items-center px-8" style={{ zIndex: 70 }} role="alertdialog" aria-modal aria-label="Quitter la partie ?">
          <div className="zz-backdrop" onClick={() => setConfirm(false)} />
          <div className="zz-pop relative w-full max-w-[320px] rounded-[28px] px-5 pb-5 pt-4 text-center" style={{ background: "var(--zz-bg-2)", border: "1px solid var(--zz-line)", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
            <div className="-mt-14 flex justify-center"><ZBlob size={88} color={game.color} mood="shocked" seed={3} /></div>
            <h2 className="zz-font mt-1 text-white" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Quitter la partie ?</h2>
            <p className="mt-1.5 text-[14px]" style={{ color: "var(--zz-dim)" }}>La partie en cours sera perdue.</p>
            <button type="button" onClick={() => setConfirm(false)} className="zz-press mt-5 h-[52px] w-full rounded-full text-[16px] font-extrabold" style={{ background: "#fff", color: "#15082E" }}>
              Continuer à jouer
            </button>
            <button type="button" onClick={() => { haptic("medium"); onExit(); }} className="zz-press mt-2 h-[48px] w-full rounded-full text-[16px] font-bold" style={{ color: "#FF6B5B" }}>
              Quitter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="m-auto flex flex-col items-center gap-3">
      <ZBlob size={72} color="lavender" mood="thinking" seed={2} />
      <p className="text-[14px] font-semibold" style={{ color: "var(--zz-mute)" }}>Chargement…</p>
    </div>
  );
}
