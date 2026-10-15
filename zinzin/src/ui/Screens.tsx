import { Suspense, lazy, useEffect, useRef, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import type { GameProps } from "@/lib/games/types";
import { ArrowRight, Bell, ChevronLeft, CreditCard, GlassWater, Mail, RotateCcw, Share2, Sparkles, Star, Volume2, X } from "lucide-react";
import { LANGS, notificationsOn, rateApp, setLang, setNotifications, shareApp, useLang } from "../settings";
import { getZGame } from "../catalog";
import { isTestMode, resetPremiumForTests, restore } from "../premium";
import { IDEAS_EMAIL, getLegalDocs, getLegalUpdatedAt, type LegalDocId } from "@/lib/legal/zinzin";
import { pick, useT } from "@/lib/i18n";
import { ONBOARDING, UI } from "../strings";
import { IdeaButton } from "@/components/games/idea-button";
import { ZBlob, ZPALETTE } from "./ZBlob";
import { BigBtn, CloseBtn, RoundBtn, Sheet, TAP_GUARD_MS } from "./common";
import { ErrorBoundary } from "./ErrorBoundary";
import { APP_VERSION, haptic, setAgeOk } from "./util";
import { setNoAlcohol, useNoAlcohol } from "@/lib/party-mood";
import { NOALC_UI } from "../no-alcohol";
import { markRatedManually } from "../rating";
import { setCurrentGame } from "@/lib/game-finished";
import { SoireeNextContext } from "@/components/games/soiree-next";
import { AppIconRow } from "./AppIconRow";
import { BandScreen } from "@/components/avatar/BandScreen";
import { AvatarBlob } from "@/components/avatar/AvatarBlob";
import { useBand } from "@/components/avatar/PlayerBlob";
import { AVATAR_STR } from "@/lib/avatar/i18n";
import { baseLook } from "@/lib/avatar/look";
import { setVoicesInGame, useVoicesInGame } from "@/lib/avatar/voice";
import { VOICE_STR } from "@/lib/avatar/voice-i18n";
import { clearVoices } from "@/lib/avatar/voice-store";
import { uiSfx } from "@/lib/ui-sfx";

export type LegalPage = "cgu" | "confidentialite" | "mentions";

const LEGAL_ID: Record<LegalPage, LegalDocId> = { cgu: "conditions", confidentialite: "confidentialite", mentions: "mentions-legales" };

/* ───────── Vérification d'âge (premier lancement) ───────── */
export function AgeGate({ onOk }: { onOk: () => void }) {
  const [out, setOut] = useState(false);
  const t = useT(UI);
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
        {t.ageTitle}
      </h1>
      <p className="zz-rise mt-3 text-[17px] font-medium leading-relaxed" style={{ color: "var(--zz-dim)", ["--d" as string]: "180ms" }}>
        {t.ageText}
      </p>
      <div className="flex-1" />
      <div className="zz-rise" style={{ ["--d" as string]: "260ms" }}>
        <BigBtn onClick={() => { haptic("medium"); uiSfx.primary(); setAgeOk(); setOut(true); setTimeout(onOk, 240); }} bg="#FFD23F">
          {t.ageOk}
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
  const t = useT(UI);
  return (
    <Sheet onClose={onClose} label={t.settings} maxHeight="90dvh" bg="var(--zz-bg)">
      {(close) => (
        <div className="zz-scroll px-5 pt-3" style={{ paddingBottom: "calc(var(--sab) + 14px)" }}>
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/25" />
          <div className="flex items-center justify-between">
            <h2 className="zz-title text-white" style={{ fontSize: 40 }}>{t.settings}</h2>
            <CloseBtn onClick={close} />
          </div>

          {/* Carte Zinzin+ vivante */}
          <div
            className="zz-stk relative mt-8 rounded-[28px] px-5 pb-4 pt-4"
            style={{ background: premium ? "#FFD23F" : "#FF3EA5", color: premium ? "var(--zz-ink)" : "#fff", rotate: "-1deg" }}
          >
            <div className="absolute -top-10 right-3">
              <ZBlob size={96} color={premium ? "pink" : "yellow"} mood={premium ? "cool" : "happy"} seed={2} shadow={false} outline crown />
            </div>
            <div className="pr-24">
              <div className="text-[14px] font-bold" style={{ opacity: 0.85 }}>{premium ? t.yourStatus : t.freeVersion}</div>
              <div className="zz-title mt-1 text-[30px]">{premium ? t.premium : t.freeGames}</div>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug" style={{ opacity: 0.88 }}>
                {premium ? t.premiumText : t.freeText}
              </p>
            </div>
            {!premium && (
              <button
                type="button"
                onClick={() => { haptic(); close(); setTimeout(onUnlock, 260); }}
                className="zz-push zz-stk-sm zz-title mt-4 h-12 w-full rounded-full text-[19px]"
                style={{ background: "#FFD23F", color: "var(--zz-ink)" }}
              >
                {t.unlockEverything}
              </button>
            )}
          </div>

          {/* Ma bande : les persos personnalisés */}
          <BandTile />

          {/* Tuiles */}
          <div className="mt-3.5 grid grid-cols-2 gap-3.5">
            <Tile bg="#3DDC97" tilt={1.5} icon={<RotateCcw size={26} strokeWidth={2.6} />} label={t.restore} onClick={async () => {
              haptic();
              const ok = await restore();
              toast(ok ? t.restored : t.nothingToRestore);
            }} />
            <Tile bg="#4ECDC4" tilt={-1.5} icon={<CreditCard size={26} strokeWidth={2.6} />} label={t.manageSub} href="https://apps.apple.com/account/subscriptions" />
            <Tile bg="#FF6B5B" tilt={-1} icon={<Mail size={26} strokeWidth={2.6} />} label={t.contactUs} sub={t.contactSub} href={`mailto:${IDEAS_EMAIL}`} wide />
          </div>

          {/* Partager / évaluer */}
          <div className="mt-3.5 grid grid-cols-2 gap-3.5">
            <Tile bg="#FFD23F" tilt={-1.5} icon={<Share2 size={26} strokeWidth={2.6} />} label={t.share} onClick={async () => {
              haptic();
              if (await shareApp()) toast(t.thanksShare);
            }} />
            <Tile bg="#A98BFF" tilt={1.5} icon={<Star size={26} strokeWidth={2.6} />} label={t.rate} sub={t.rateSub} onClick={() => { haptic(); markRatedManually(); void rateApp(); }} />
          </div>

          {/* Rappels de soirée */}
          <NotifToggle toast={toast} />

          {/* Mode sans alcool : toutes les peines deviennent des gages */}
          <NoAlcoholToggle />

          {/* Voix des persos en jeu (tour du joueur, gagnant) */}
          <VoicesToggle />

          {/* Icône de l'app (Zinzin+) : masquée si l'appareil ne sait pas la changer */}
          <AppIconRow premium={premium} toast={toast} />

          {/* Langue */}
          <LangPicker />

          <div className="mt-5 flex justify-center">
            <IdeaButton game="Zinzin (nouveau jeu)" kind="idée de jeu" />
          </div>
          <ReplayTuto close={close} />

          {test && (
            <button
              type="button"
              onClick={() => { resetPremiumForTests(); haptic(); toast(t.backToFreeToast); }}
              className="zz-push mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] text-[14px] font-bold"
              style={{ color: "#FFD23F", border: "2.5px dashed rgba(255,210,63,0.55)" }}
            >
              <Sparkles size={16} /> {t.backToFree}
            </button>
          )}

          {/* Liens légaux, discrets */}
          {/* Liens soulignés espacés, sans « · » qui resterait seul en fin de ligne sur petit écran */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 text-[14px] font-semibold" style={{ color: "var(--zz-dim)" }}>
            <button type="button" className="zz-tap min-h-11 px-2 underline decoration-2 underline-offset-4" onClick={() => { uiSfx.open(); onLegal("cgu"); }}>{t.terms}</button>
            <button type="button" className="zz-tap min-h-11 px-2 underline decoration-2 underline-offset-4" onClick={() => { uiSfx.open(); onLegal("confidentialite"); }}>{t.privacy}</button>
            <button type="button" className="zz-tap min-h-11 px-2 underline decoration-2 underline-offset-4" onClick={() => { uiSfx.open(); onLegal("mentions"); }}>{t.legalNotice}</button>
          </div>
          <EraseData />
          <p className="text-center text-[13px]" style={{ color: "var(--zz-mute)" }}>
            {t.version(APP_VERSION)}
          </p>
        </div>
      )}
    </Sheet>
  );
}

/** Tuile « Ma bande » des Réglages : aperçu des persos, ouvre l'éditeur. */
function BandTile() {
  const [open, setOpen] = useState(false);
  const band = useBand();
  const t = useT(AVATAR_STR);
  const shown = band.length ? band.slice(0, 3) : [{ name: "", look: baseLook("yellow"), me: true }];
  return (
    <>
      <button
        type="button"
        onClick={() => { haptic(); uiSfx.open(); setOpen(true); }}
        className="zz-push zz-stk mt-6 flex w-full items-center gap-3 rounded-[24px] py-3 pl-4 pr-3 text-left"
        style={{ background: "#3DDC97", color: "var(--zz-ink)", rotate: "1deg" }}
      >
        <span className="flex shrink-0 items-end" style={{ height: 56 }}>
          {shown.map((b, i) => (
            <span key={b.name || i} style={{ marginLeft: i ? -16 : 0, zIndex: 3 - i }}>
              <AvatarBlob look={b.look ?? baseLook()} size={i ? 36 : 50} mood={i ? "happy" : "laughing"} animate={i === 0} />
            </span>
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="zz-title block text-[22px]">{t.myBand}</span>
          <span className="block text-[13px] font-semibold leading-snug opacity-80">{t.myBandSub}</span>
        </span>
        <ChevronLeft size={22} strokeWidth={3} style={{ transform: "rotate(180deg)" }} aria-hidden />
      </button>
      {open && <BandScreen onClose={() => setOpen(false)} />}
    </>
  );
}

/** Revoir le tuto du premier lancement (écouté par App.tsx). */
function ReplayTuto({ close }: { close: () => void }) {
  const t = useT(ONBOARDING);
  return (
    <div className="mt-1 flex justify-center">
      <button
        type="button"
        className="zz-tap min-h-11 px-3 text-[14px] font-bold underline decoration-2 underline-offset-4"
        style={{ color: "var(--zz-dim)" }}
        onClick={() => { haptic(); close(); setTimeout(() => window.dispatchEvent(new Event("zz:onboarding")), 260); }}
      >
        {t.replay}
      </button>
    </div>
  );
}

function NoAlcoholToggle() {
  const on = useNoAlcohol();
  const t = useT(NOALC_UI);
  return (
    <button
      type="button"
      onClick={() => { haptic(); uiSfx.choice(); setNoAlcohol(!on); }}
      className="zz-push zz-stk mt-3.5 flex w-full items-center gap-3 rounded-[22px] px-4 py-3.5 text-left"
      style={{ background: "#FFF6E5", color: "var(--zz-ink)" }}
      role="switch"
      aria-checked={on}
    >
      <GlassWater size={26} strokeWidth={2.6} />
      <span className="flex-1">
        <span className="zz-title block text-[19px]">{t.title}</span>
        <span className="block text-[13px] font-semibold opacity-75">{t.sub}</span>
      </span>
      <span className="relative h-8 w-14 shrink-0 rounded-full" style={{ background: on ? "#3DDC97" : "#CFC6E3", border: "2.5px solid var(--zz-ink)" }}>
        <span className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white transition-[left]" style={{ left: on ? 26 : 2, border: "2.5px solid var(--zz-ink)" }} />
      </span>
    </button>
  );
}

function VoicesToggle() {
  const on = useVoicesInGame();
  const t = useT(VOICE_STR);
  return (
    <button
      type="button"
      onClick={() => { haptic(); uiSfx.choice(); setVoicesInGame(!on); }}
      className="zz-push zz-stk mt-3.5 flex w-full items-center gap-3 rounded-[22px] px-4 py-3.5 text-left"
      style={{ background: "#FFF6E5", color: "var(--zz-ink)" }}
      role="switch"
      aria-checked={on}
    >
      <Volume2 size={26} strokeWidth={2.6} />
      <span className="flex-1">
        <span className="zz-title block text-[19px]">{t.inGame}</span>
        <span className="block text-[13px] font-semibold opacity-75">{t.inGameSub}</span>
      </span>
      <span className="relative h-8 w-14 shrink-0 rounded-full" style={{ background: on ? "#3DDC97" : "#CFC6E3", border: "2.5px solid var(--zz-ink)" }}>
        <span className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white transition-[left]" style={{ left: on ? 26 : 2, border: "2.5px solid var(--zz-ink)" }} />
      </span>
    </button>
  );
}

function NotifToggle({ toast }: { toast: (m: string) => void }) {
  const [on, setOn] = useState(notificationsOn);
  const [busy, setBusy] = useState(false);
  const t = useT(UI);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        haptic();
        uiSfx.choice();
        setBusy(true);
        const res = await setNotifications(!on);
        setBusy(false);
        setOn(res);
        if (!on && !res) toast(t.notifDenied);
        else toast(res ? t.notifOn : t.notifOff);
      }}
      className="zz-push zz-stk mt-3.5 flex w-full items-center gap-3 rounded-[22px] px-4 py-3.5 text-left"
      style={{ background: "#FFF6E5", color: "var(--zz-ink)" }}
      aria-pressed={on}
    >
      <Bell size={26} strokeWidth={2.6} />
      <span className="flex-1">
        <span className="zz-title block text-[19px]">{t.notifTitle}</span>
        <span className="block text-[13px] font-semibold opacity-75">{t.notifSub}</span>
      </span>
      <span className="relative h-8 w-14 shrink-0 rounded-full" style={{ background: on ? "#3DDC97" : "#CFC6E3", border: "2.5px solid var(--zz-ink)" }}>
        <span className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white transition-[left]" style={{ left: on ? 26 : 2, border: "2.5px solid var(--zz-ink)" }} />
      </span>
    </button>
  );
}

function LangPicker() {
  const lang = useLang();
  const t = pick(UI, lang);
  return (
    <div className="mt-5">
      <div className="zz-title mb-2 text-[20px] text-white">{t.language}</div>
      <div className="grid grid-cols-3 gap-2.5">
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => { haptic(); if (lang !== l.id) uiSfx.choice(); setLang(l.id); }}
            aria-pressed={lang === l.id}
            className="zz-push zz-stk-sm flex min-h-12 flex-col items-center justify-center rounded-[18px] py-2 text-[14px] font-extrabold"
            style={{ background: lang === l.id ? "#FFD23F" : "#fff", color: "var(--zz-ink)", rotate: lang === l.id ? "-2deg" : undefined }}
          >
            <span className="text-[20px] leading-none">{l.flag}</span>
            {l.label}
          </button>
        ))}
      </div>
    </div>
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
  const lang = useLang();
  const t = pick(UI, lang);
  const doc = getLegalDocs(lang)[LEGAL_ID[page]];
  const updatedAt = getLegalUpdatedAt(lang);
  return (
    <div className="zz-screen-in zz-scroll zz-page fixed inset-0" style={{ zIndex: 70 }} role="dialog" aria-modal aria-label={doc.title}>
      <div className="mx-auto max-w-lg px-5" style={{ paddingTop: "calc(var(--sat) + 8px)", paddingBottom: "calc(var(--sab) + 24px)" }}>
        <RoundBtn onClick={() => { uiSfx.close(); onClose(); }} label={t.back}><ChevronLeft size={24} strokeWidth={3} /></RoundBtn>
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
        {/* Pas de doublon si le texte donne déjà la date (CGU, confidentialité) */}
        {!doc.sections.some((sec) => sec.paragraphs.some((para) => para.includes(updatedAt))) && (
          <p className="mt-8 text-[13px]" style={{ color: "var(--zz-mute)" }}>{t.lastUpdate(updatedAt)}</p>
        )}
      </div>
    </div>
  );
}

/** RGPD : tout ce que l'app garde est local → on peut tout effacer d'un geste. */
function EraseData() {
  const [armed, setArmed] = useState(false);
  const t = useT(UI);
  return (
    <button
      type="button"
      onClick={async () => {
        if (!armed) { setArmed(true); haptic(); return; }
        try { localStorage.clear(); sessionStorage.clear(); } catch { /* indispo */ }
        // Les sons des persos (IndexedDB) aussi
        await clearVoices().catch(() => {});
        location.reload();
      }}
      className="zz-tap mx-auto mt-1 block min-h-11 px-3 text-[14px] font-semibold underline decoration-2 underline-offset-4"
      style={{ color: armed ? "#FF6B5B" : "var(--zz-mute)" }}
    >
      {armed ? t.eraseArmed : t.erase}
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

/** « Jeu suivant » d'une Soirée : bouton posé par chaque jeu dans son écran de fin (SoireeNextButton) */
export interface GameNext {
  label: string;
  onNext: () => void;
  /** Jeu sans fin de partie (Tu préfères) : petit bouton toujours visible en haut */
  always?: boolean;
}

export function GameScreen({ id, onExit, next }: { id: string; onExit: () => void; next?: GameNext }) {
  const game = getZGame(id)!;
  const [Comp] = useState(() => lazyGame(id));
  const [confirm, setConfirm] = useState(false);
  // Double tap sur la croix : le 2e tap tombe sur le fond de la confirmation, il ne doit pas la refermer
  const confirmAt = useRef(0);
  const t = useT(UI);
  // Jeu en cours : la fin de partie le signale avec son id (stats de la bande)
  useEffect(() => { setCurrentGame(id); return () => setCurrentGame(null); }, [id]);
  // Soirée : les jeux affichent « Jeu suivant » dans leur écran de fin (contexte lu par SoireeNextButton)
  const soireeNext = next ? { label: next.label, onNext: () => { haptic("medium"); uiSfx.primary(); next.onNext(); } } : null;

  return (
    <div className="zz-screen-in fixed inset-0 flex flex-col overflow-y-auto" style={{ background: "#0A0420", zIndex: 30 }}>
      <ErrorBoundary onBack={onExit} backLabel={t.backHome}>
        <SoireeNextContext.Provider value={soireeNext}>
          <Suspense fallback={<Loading />}>
            <Comp roomCode="LOCAL" playerId="local" playerName={t.player} onReturnToLobby={onExit} />
          </Suspense>
        </SoireeNextContext.Provider>
      </ErrorBoundary>

      {/* Jeu sans fin de partie : petit « Jeu suivant » en haut, à côté de la croix */}
      {next?.always && (
        <button
          type="button"
          onClick={() => { haptic("medium"); next.onNext(); }}
          className="zz-press fixed left-16 flex h-11 items-center gap-1 rounded-full px-3.5 text-[15px] font-extrabold"
          style={{ top: "calc(var(--sat) + 10px)", zIndex: 60, background: "#FFD23F", color: "var(--zz-ink)", border: "2.5px solid var(--zz-ink)" }}
        >
          {next.label} <ArrowRight size={17} strokeWidth={3} aria-hidden />
        </button>
      )}

      {/* Quitter : discret, en haut à gauche (le coin droit reste aux jeux) */}
      <button
        type="button"
        onClick={() => { haptic(); confirmAt.current = performance.now(); setConfirm(true); }}
        aria-label={t.quitAria}
        className="zz-press fixed left-3 grid h-11 w-11 place-items-center rounded-full"
        // Même ligne et même marge que les boutons d'outils des jeux (GameTopRight : right-3, +10px)
        style={{ top: "calc(var(--sat) + 10px)", zIndex: 60, background: "var(--zz-ink)", color: "#fff", border: "2.5px solid rgba(255,255,255,0.85)" }}
      >
        <X size={19} strokeWidth={2.6} />
      </button>

      {confirm && (
        <div className="fixed inset-0 grid place-items-center px-8" style={{ zIndex: 70 }} role="alertdialog" aria-modal aria-label={t.quitTitle}>
          <div className="zz-backdrop" onClick={() => { if (performance.now() - confirmAt.current > TAP_GUARD_MS) setConfirm(false); }} />
          <div className="zz-pop zz-stk relative w-full max-w-[330px] rounded-[30px] px-5 pb-5 pt-4 text-center" style={{ background: "#fff", color: "var(--zz-ink)", rotate: "-1.5deg" }}>
            <div className="-mt-16 flex justify-center"><ZBlob size={104} color={game.color} mood="shocked" seed={3} outline shadow={false} costume={game.costume} /></div>
            <h2 className="zz-title mt-2" style={{ fontSize: 32 }}>{t.quitTitle}</h2>
            <p className="mt-2 text-[15px] font-semibold" style={{ opacity: 0.7 }}>{t.quitText}</p>
            <BigBtn onClick={() => setConfirm(false)} bg={ZPALETTE[game.color].body} color={ZPALETTE[game.color].ink} className="mt-5">
              {t.keepPlaying}
            </BigBtn>
            <button type="button" onClick={() => { haptic("medium"); uiSfx.close(); onExit(); }} className="zz-tap mt-2 h-12 w-full rounded-full text-[16px] font-bold underline decoration-2 underline-offset-4">
              {t.quit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Loading() {
  const t = useT(UI);
  return (
    <div className="m-auto flex flex-col items-center gap-3">
      <ZBlob size={72} color="lavender" mood="thinking" seed={2} outline shadow={false} />
      <p className="text-[14px] font-semibold" style={{ color: "var(--zz-mute)" }}>{t.loading}</p>
    </div>
  );
}
