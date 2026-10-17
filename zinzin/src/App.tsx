import { useCallback, useEffect, useRef, useState } from "react";
import { notifyPaywallClosed } from "@/lib/entitlements";
import { getZGame } from "./catalog";
import { takeTrialOverPopup, usePremium } from "./premium";
import "./ui/zinzin.css";
import { useToast } from "./ui/common";
import { GameSheet } from "./ui/GameSheet";
import { Home, isLocked } from "./ui/Home";
import { Paywall } from "./ui/Paywall";
import { spiralEyes } from "./ui/spiral-eyes";
import { SECRET_FOUND_EVENT, foundSecrets } from "@/lib/secrets-found";
import { HALLOWEEN_SECRETS, SECRETS, SECRETS_UI } from "./secrets-list";
import { unlockSecret } from "@/lib/avatar/secrets";
import { pick, getLang } from "@/lib/i18n";
import { playSfx } from "@/lib/sfx";
import { AgeGate, GameScreen, LegalScreen, SettingsSheet, type LegalPage } from "./ui/Screens";
import { Splash } from "./ui/Splash";
import { Onboarding, isOnboarded } from "./ui/Onboarding";
import { installLookAtFinger } from "./ui/ZBlob";
import { isAgeOk } from "./ui/util";
import { SoireeSetup } from "./ui/SoireeSetup";
import { SoireeRun } from "./ui/SoireeRun";
import { LangBlob } from "./ui/LangBlob";
import { clearSoiree, getSoiree, resumeSoiree, startSoiree } from "./soiree";

type Phase = "splash" | "age" | "tuto" | "app";

/**
 * Navigation de l'app (état React, pas d'URL) :
 * lancement animé → âge (1re fois) → tuto (1re fois) → paywall (si pas premium) → accueil.
 */
/** Jour du dernier paywall de lancement (le 1er lancement compte comme « déjà vu aujourd'hui »). */
const LAUNCH_PAYWALL_KEY = "zz-launch-paywall-day";
function launchPaywallDue(): boolean {
  const today = new Date().toDateString();
  try {
    const last = localStorage.getItem(LAUNCH_PAYWALL_KEY);
    localStorage.setItem(LAUNCH_PAYWALL_KEY, today);
    return last !== null && last !== today;
  } catch {
    return false;
  }
}

export function App() {
  const premium = usePremium();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("splash");
  const [paywall, setPaywall] = useState<{ thenOpen?: string } | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [legal, setLegal] = useState<LegalPage | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  // Soirée Zinzin : préparation (3 écrans) ou déroulé (transitions + jeux + podium)
  const [soiree, setSoiree] = useState<"setup" | "run" | null>(null);
  // Tuto revu depuis les Réglages (événement « zz:onboarding »)
  const [replayTuto, setReplayTuto] = useState(false);

  // Les yeux des blobs suivent le doigt
  useEffect(() => installLookAtFinger(), []);
  // Un jeu demande l'abonnement (contenu verrouillé) → paywall par-dessus le jeu
  useEffect(() => {
    const open = () => setPaywall({});
    window.addEventListener("zz:paywall", open);
    return () => window.removeEventListener("zz:paywall", open);
  }, []);
  // Paywall refermé (achat ou croix) : le jeu qui l'a demandé reprend la main
  const hadPaywall = useRef(false);
  useEffect(() => {
    if (paywall) hadPaywall.current = true;
    else if (hadPaywall.current) { hadPaywall.current = false; notifyPaywallClosed(); }
  }, [paywall]);
  // Nouveau secret trouvé → « Secret trouvé ! (n/18) », un peu après l'effet du secret lui-même
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      const t = pick(SECRETS_UI, getLang());
      const found = foundSecrets();
      const bonus = HALLOWEEN_SECRETS.some((s) => s.id === id);
      const n = SECRETS.filter((s) => found.has(s.id)).length;
      // Tous les secrets trouvés : couleur secrète « Arc-en-ciel » pour les persos
      const all = !bonus && n === SECRETS.length && unlockSecret("color-rainbow");
      setTimeout(() => {
        playSfx(all ? "tada" : "chime", { volume: 0.45 });
        toast.show(all ? t.rainbowToast : bonus ? t.bonusToast : t.toast(n, SECRETS.length));
      }, 1600);
    };
    window.addEventListener(SECRET_FOUND_EVENT, on);
    return () => window.removeEventListener(SECRET_FOUND_EVENT, on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Secret de l'éditeur de perso (AvatarEditor) : gifles répétées → yeux en spirale sur l'aperçu
  useEffect(() => {
    const on = (e: Event) => {
      const el = (e as CustomEvent<Element>).detail;
      if (el instanceof Element) spiralEyes(el, 2800, { wobble: true });
    };
    window.addEventListener("zz:dizzy", on);
    return () => window.removeEventListener("zz:dizzy", on);
  }, []);

  useEffect(() => {
    const open = () => setReplayTuto(true);
    window.addEventListener("zz:onboarding", open);
    return () => window.removeEventListener("zz:onboarding", open);
  }, []);

  const afterIntro = useCallback(() => {
    // Paywall de lancement : uniquement pour les non-premium, jamais au tout premier lancement
    // (on joue d'abord), puis une fois par jour au plus. Les contenus verrouillés l'ouvrent toujours.
    // Essai gratuit terminé sans abonnement : paywall avec le bilan des jeux joués, une fois (même le jour déjà vu)
    const trialOver = takeTrialOverPopup();
    const due = launchPaywallDue();
    if (!premium && (trialOver || due)) setPaywall({});
  }, [premium]);

  const openGame = (id: string) => setSheet(id);
  // Soirée ouverte à tous : sans Zinzin+, elle n'enchaîne que les jeux gratuits (soiree.ts)
  const newSoiree = () => {
    clearSoiree();
    setSoiree("setup");
  };
  const leaveSoiree = () => {
    // Soirée terminée : on l'oublie ; sinon elle reste à reprendre depuis l'accueil
    if (getSoiree()?.phase === "end") clearSoiree();
    setSoiree(null);
  };

  return (
    <>
      {phase === "app" && (
        <div style={{ display: playing || soiree ? "none" : undefined }}>
          <Home
            premium={premium}
            onOpenGame={openGame}
            onSettings={() => setSettings(true)}
            onUnlock={() => setPaywall({})}
            onSoiree={newSoiree}
            onResumeSoiree={() => { resumeSoiree(); setSoiree("run"); }}
          />
        </div>
      )}

      {sheet && (
        <GameSheet
          key={sheet}
          id={sheet}
          premium={premium}
          locked={isLocked(getZGame(sheet)!, premium)}
          onClose={() => setSheet(null)}
          onPlay={(id) => { setSheet(null); setPlaying(id); }}
          onUnlock={() => { const id = sheet; setSheet(null); setPaywall({ thenOpen: id }); }}
        />
      )}

      {settings && (
        <SettingsSheet
          premium={premium}
          onClose={() => setSettings(false)}
          onUnlock={() => setPaywall({})}
          onLegal={setLegal}
          toast={toast.show}
        />
      )}

      {soiree === "setup" && (
        <SoireeSetup
          onClose={() => setSoiree(null)}
          onLaunch={(band, vibe, length, list) => { startSoiree(band, vibe, length, list); setSoiree("run"); }}
        />
      )}
      {soiree === "run" && <SoireeRun onHome={leaveSoiree} onNew={() => { clearSoiree(); setSoiree("setup"); }} toast={toast.show} />}

      {playing && <GameScreen key={playing} id={playing} onExit={() => setPlaying(null)} />}

      {paywall && (
        <Paywall
          onClose={() => setPaywall(null)}
          onUnlocked={() => {
            const next = paywall.thenOpen;
            setPaywall(null);
            if (next) setTimeout(() => setSheet(next), 80);
          }}
          onLegal={setLegal}
          toast={toast.show}
        />
      )}

      {phase === "age" && <AgeGate onOk={() => { if (!isOnboarded()) setPhase("tuto"); else { setPhase("app"); afterIntro(); } }} />}

      {phase === "tuto" && <Onboarding onDone={() => { setPhase("app"); afterIntro(); }} />}
      {replayTuto && <Onboarding onDone={() => setReplayTuto(false)} />}

      {phase === "splash" && (
        <Splash
          onDone={() => {
            if (!isAgeOk()) setPhase("age");
            else if (!isOnboarded()) setPhase("tuto");
            else { setPhase("app"); afterIntro(); }
          }}
        />
      )}

      {legal && <LegalScreen page={legal} onClose={() => setLegal(null)} />}

      {/* Secret : changement de langue (Réglages) → un blob dit bonjour avec le chapeau du pays */}
      {phase === "app" && <LangBlob />}

      {toast.node}
    </>
  );
}
