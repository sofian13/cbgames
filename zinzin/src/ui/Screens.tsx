import { Suspense, lazy, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import type { GameProps } from "@/lib/games/types";
import { ChevronLeft, CreditCard, Mail, RotateCcw, Sparkles, X } from "lucide-react";
import { getZGame } from "../catalog";
import { isTestMode, resetPremiumForTests, restore } from "../premium";
import { IDEAS_EMAIL, LEGAL_DOCS, LEGAL_UPDATED_AT, type LegalDocId } from "@/lib/legal/zinzin";
import { IdeaButton } from "@/components/games/idea-button";
import { ZBlob, ZPALETTE } from "./ZBlob";
import { BigBtn, CloseBtn, RoundBtn, Sheet } from "./common";
import { ErrorBoundary } from "./ErrorBoundary";
import { APP_VERSION, haptic, setAgeOk } from "./util";

export type LegalPage = "cgu" | "confidentialite" | "mentions";

const LEGAL_ID: Record<LegalPage, LegalDocId> = { cgu: "conditions", confidentialite: "confidentialite", mentions: "mentions-legales" };

/* ───────── Vérification d'âge (premier lancement) ───────── */
export function AgeGate({ onOk }: { onOk: () => void }) {
  const [out, setOut] = useState(false);
  return (
    <div
      className="zz-page fixed inset-0 flex flex-col px-6"
      style={{ zIndex: 46, paddingTop: "calc(var(--sat) + 40px)", paddingBottom: "calc(var(--sab) + 20px)", opacity: out ? 0 : 1, transition: "opacity 240ms ease" }}
    >
      <div className="flex-1" />
      <div className="zz-pop relative mx-auto">
        <ZBlob size={170} color="purple" mood="sus" seed={1} outline shadow={false} />
        <span className="zz-stk zz-title absolute -right-8 -top-2 grid h-[72px] w-[72px] place-items-center rounded-full text-[26px]" style={{ background: "#FFD23F", color: "var(--zz-ink)", rotate: "14deg" }}>18+</span>
      </div>
      <h1 className="zz-title zz-rise mt-8 text-white" style={{ fontSize: 42, ["--d" as string]: "100ms" }}>
        Ici, c’est entre adultes.
      </h1>
      <p className="zz-rise mt-3 text-[17px] font-medium leading-relaxed" style={{ color: "var(--zz-dim)", ["--d" as string]: "180ms" }}>
        Zinzin est réservé aux 18 ans et plus. Dans les jeux à boire, une « gorgée de zinzin », c’est de ce que tu veux : eau, soft, jus… Avec modération.
      </p>
      <div className="flex-1" />
      <div className="zz-rise" style={{ ["--d" as string]: "260ms" }}>
        <BigBtn onClick={() => { haptic("medium"); setAgeOk(); setOut(true); setTimeout(onOk, 240); }} bg="#FFD23F">
          J’ai 18 ans ou plus
        </BigBtn>
      </div>
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
    <Sheet onClose={onClose} label="Réglages" maxHeight="90dvh" bg="var(--zz-bg)">
      {(close) => (
        <div className="zz-scroll px-5 pt-3" style={{ paddingBottom: "calc(var(--sab) + 14px)" }}>
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/25" />
          <div className="flex items-center justify-between">
            <h2 className="zz-title text-white" style={{ fontSize: 40 }}>Réglages</h2>
            <CloseBtn onClick={close} />
          </div>

          {/* Carte Premium vivante */}
          <div
            className="zz-stk relative mt-8 rounded-[28px] px-5 pb-4 pt-4"
            style={{ background: premium ? "#FFD23F" : "#FF3EA5", color: premium ? "var(--zz-ink)" : "#fff", rotate: "-1deg" }}
          >
            <div className="absolute -top-10 right-3">
              <ZBlob size={96} color={premium ? "pink" : "yellow"} mood={premium ? "cool" : "happy"} seed={2} shadow={false} outline crown />
            </div>
            <div className="pr-24">
              <div className="text-[14px] font-bold" style={{ opacity: 0.85 }}>{premium ? "Ton statut" : "Version gratuite"}</div>
              <div className="zz-title mt-1 text-[30px]">{premium ? "Zinzin Premium" : "3 jeux offerts"}</div>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug" style={{ opacity: 0.88 }}>
                {premium ? "Tout est débloqué. Les nouveaux jeux arrivent tout seuls." : "Le reste t'attend : tous les jeux, et du nouveau chaque mois."}
              </p>
            </div>
            {!premium && (
              <button
                type="button"
                onClick={() => { haptic(); close(); setTimeout(onUnlock, 260); }}
                className="zz-push zz-stk-sm zz-title mt-4 h-12 w-full rounded-full text-[19px]"
                style={{ background: "#FFD23F", color: "var(--zz-ink)" }}
              >
                Tout débloquer
              </button>
            )}
          </div>

          {/* Tuiles */}
          <div className="mt-6 grid grid-cols-2 gap-3.5">
            <Tile bg="#3DDC97" tilt={1.5} icon={<RotateCcw size={26} strokeWidth={2.6} />} label="Restaurer mes achats" onClick={async () => {
              haptic();
              const ok = await restore();
              toast(ok ? "Achats restaurés" : "Aucun achat à restaurer");
            }} />
            <Tile bg="#4ECDC4" tilt={-1.5} icon={<CreditCard size={26} strokeWidth={2.6} />} label="Gérer mon abonnement" href="https://apps.apple.com/account/subscriptions" />
            <Tile bg="#FF6B5B" tilt={-1} icon={<Mail size={26} strokeWidth={2.6} />} label="Nous écrire" sub="Un bug ? Une question ?" href={`mailto:${IDEAS_EMAIL}`} wide />
          </div>

          <div className="mt-5 flex justify-center">
            <IdeaButton game="Zinzin (nouveau jeu)" kind="idée de jeu" />
          </div>

          {test && (
            <button
              type="button"
              onClick={() => { resetPremiumForTests(); haptic(); toast("Retour en gratuit (test)"); }}
              className="zz-push mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] text-[14px] font-bold"
              style={{ color: "#FFD23F", border: "2.5px dashed rgba(255,210,63,0.55)" }}
            >
              <Sparkles size={16} /> Revenir en gratuit (test)
            </button>
          )}

          {/* Liens légaux, discrets */}
          {/* Liens soulignés espacés, sans « · » qui resterait seul en fin de ligne sur petit écran */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 text-[14px] font-semibold" style={{ color: "var(--zz-dim)" }}>
            <button type="button" className="zz-tap min-h-11 px-2 underline decoration-2 underline-offset-4" onClick={() => onLegal("cgu")}>Conditions</button>
            <button type="button" className="zz-tap min-h-11 px-2 underline decoration-2 underline-offset-4" onClick={() => onLegal("confidentialite")}>Confidentialité</button>
            <button type="button" className="zz-tap min-h-11 px-2 underline decoration-2 underline-offset-4" onClick={() => onLegal("mentions")}>Mentions légales</button>
          </div>
          <EraseData />
          <p className="text-center text-[13px]" style={{ color: "var(--zz-mute)" }}>
            Zinzin, version {APP_VERSION}. Fait avec amour et beaucoup de blobs.
          </p>
        </div>
      )}
    </Sheet>
  );
}

function Tile({
  icon, label, sub, onClick, href, bg, tilt, wide,
}: { icon: ReactNode; label: string; sub?: string; onClick?: () => void; href?: string; bg: string; tilt: number; wide?: boolean }) {
  const cls = `zz-push zz-stk flex rounded-[24px] p-4 text-left ${wide ? "col-span-2 min-h-[84px] flex-row items-center gap-4" : "min-h-[100px] flex-col justify-between gap-3"}`;
  const style = { background: bg, color: "var(--zz-ink)", rotate: `${tilt}deg` };
  const inner = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: "var(--zz-ink)", color: bg }}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="zz-title block text-[20px] leading-[1.02]">{label}</span>
        {sub && <span className="mt-1 block text-[14px] font-semibold" style={{ opacity: 0.8 }}>{sub}</span>}
      </span>
    </>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={cls} style={style}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls} style={style}>{inner}</button>;
}

/* ───────── Pages légales (textes : src/lib/legal/zinzin.ts) ───────── */
export function LegalScreen({ page, onClose }: { page: LegalPage; onClose: () => void }) {
  const doc = LEGAL_DOCS[LEGAL_ID[page]];
  return (
    <div className="zz-screen-in zz-scroll zz-page fixed inset-0" style={{ zIndex: 70 }} role="dialog" aria-modal aria-label={doc.title}>
      <div className="mx-auto max-w-lg px-5" style={{ paddingTop: "calc(var(--sat) + 8px)", paddingBottom: "calc(var(--sab) + 24px)" }}>
        <RoundBtn onClick={onClose} label="Retour"><ChevronLeft size={24} strokeWidth={3} /></RoundBtn>
        <div className="relative mt-6">
          <h1 className="zz-title pr-20 text-white" style={{ fontSize: 36 }}>{doc.title}</h1>
          <div className="absolute -top-4 right-0"><ZBlob size={70} color="sky" mood="thinking" seed={3} outline shadow={false} /></div>
        </div>
        {doc.intro && <p className="mt-5 text-[16px] leading-relaxed text-white">{doc.intro}</p>}
        {doc.sections.map((sec) => (
          <section key={sec.title} className="mt-7">
            <h2 className="zz-title text-white" style={{ fontSize: 21 }}>{sec.title}</h2>
            {sec.paragraphs.map((para, k) => (
              <p key={k} className="mt-2.5 text-[15px] leading-relaxed" style={{ color: "var(--zz-dim)", userSelect: "text" }}>{para}</p>
            ))}
          </section>
        ))}
        <p className="mt-8 text-[13px]" style={{ color: "var(--zz-mute)" }}>Dernière mise à jour : {LEGAL_UPDATED_AT}</p>
      </div>
    </div>
  );
}

/** RGPD : tout ce que l'app garde est local → on peut tout effacer d'un geste. */
function EraseData() {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (!armed) { setArmed(true); haptic(); return; }
        try { localStorage.clear(); sessionStorage.clear(); } catch { /* indispo */ }
        location.reload();
      }}
      className="zz-tap mx-auto mt-1 block min-h-11 px-3 text-[14px] font-semibold underline decoration-2 underline-offset-4"
      style={{ color: armed ? "#FF6B5B" : "var(--zz-mute)" }}
    >
      {armed ? "Sûr ? Prénoms, réglages… tout part. Re-tape pour confirmer" : "Effacer mes données de ce téléphone"}
    </button>
  );
}

/* ───────── Jeu en plein écran ───────── */
// Un composant lazy par jeu, créé une seule fois (pas pendant le rendu)
const LAZY_GAMES = new Map<string, LazyExoticComponent<ComponentType<GameProps>>>();
function lazyGame(id: string) {
  let c = LAZY_GAMES.get(id);
  if (!c) {
    c = lazy(getZGame(id)!.load);
    LAZY_GAMES.set(id, c);
  }
  return c;
}

export function GameScreen({ id, onExit }: { id: string; onExit: () => void }) {
  const game = getZGame(id)!;
  const [Comp] = useState(() => lazyGame(id));
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="zz-screen-in fixed inset-0 flex flex-col overflow-y-auto" style={{ background: "#0A0420", zIndex: 30 }}>
      <ErrorBoundary onBack={onExit} backLabel="Retour à l’accueil">
        <Suspense fallback={<Loading />}>
          <Comp roomCode="LOCAL" playerId="local" playerName="Joueur" onReturnToLobby={onExit} />
        </Suspense>
      </ErrorBoundary>

      {/* Quitter : discret, en haut à gauche (le coin droit reste aux jeux) */}
      <button
        type="button"
        onClick={() => { haptic(); setConfirm(true); }}
        aria-label="Quitter la partie"
        className="zz-press fixed left-3 grid h-11 w-11 place-items-center rounded-full"
        // Même ligne et même marge que les boutons d'outils des jeux (GameTopRight : right-3, +10px)
        style={{ top: "calc(var(--sat) + 10px)", zIndex: 60, background: "var(--zz-ink)", color: "#fff", border: "2.5px solid rgba(255,255,255,0.85)" }}
      >
        <X size={19} strokeWidth={2.6} />
      </button>

      {confirm && (
        <div className="fixed inset-0 grid place-items-center px-8" style={{ zIndex: 70 }} role="alertdialog" aria-modal aria-label="Quitter la partie ?">
          <div className="zz-backdrop" onClick={() => setConfirm(false)} />
          <div className="zz-pop zz-stk relative w-full max-w-[330px] rounded-[30px] px-5 pb-5 pt-4 text-center" style={{ background: "#fff", color: "var(--zz-ink)", rotate: "-1.5deg" }}>
            <div className="-mt-16 flex justify-center"><ZBlob size={104} color={game.color} mood="shocked" seed={3} outline shadow={false} costume={game.costume} /></div>
            <h2 className="zz-title mt-2" style={{ fontSize: 32 }}>On arrête déjà&nbsp;?</h2>
            <p className="mt-2 text-[15px] font-semibold" style={{ opacity: 0.7 }}>La partie en cours sera perdue.</p>
            <BigBtn onClick={() => setConfirm(false)} bg={ZPALETTE[game.color].body} color={ZPALETTE[game.color].ink} className="mt-5">
              Je continue
            </BigBtn>
            <button type="button" onClick={() => { haptic("medium"); onExit(); }} className="zz-tap mt-2 h-12 w-full rounded-full text-[16px] font-bold underline decoration-2 underline-offset-4">
              Quitter la partie
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
      <ZBlob size={72} color="lavender" mood="thinking" seed={2} outline shadow={false} />
      <p className="text-[14px] font-semibold" style={{ color: "var(--zz-mute)" }}>Chargement…</p>
    </div>
  );
}
