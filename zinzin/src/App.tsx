import { useCallback, useEffect, useState } from "react";
import { getZGame } from "./catalog";
import { usePremium } from "./premium";
import "./ui/zinzin.css";
import { useToast } from "./ui/common";
import { GameSheet } from "./ui/GameSheet";
import { Home, isLocked } from "./ui/Home";
import { Paywall } from "./ui/Paywall";
import { AgeGate, GameScreen, LegalScreen, SettingsSheet, type LegalPage } from "./ui/Screens";
import { Splash } from "./ui/Splash";
import { Onboarding, isOnboarded } from "./ui/Onboarding";
import { installLookAtFinger } from "./ui/ZBlob";
import { isAgeOk } from "./ui/util";
import { SoireeSetup } from "./ui/SoireeSetup";
import { SoireeRun } from "./ui/SoireeRun";
import { clearSoiree, getSoiree, resumeSoiree, startSoiree } from "./soiree";

type Phase = "splash" | "age" | "tuto" | "app";

/**
 * Navigation de l'app (état React, pas d'URL) :
 * lancement animé → âge (1re fois) → tuto (1re fois) → paywall (si pas premium) → accueil.
 */
export function App() {
  const premium = usePremium();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("splash");
  const [paywall, setPaywall] = useState<{ thenOpen?: string; thenSoiree?: boolean } | null>(null);
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
  useEffect(() => {
    const open = () => setReplayTuto(true);
    window.addEventListener("zz:onboarding", open);
    return () => window.removeEventListener("zz:onboarding", open);
  }, []);

  const afterIntro = useCallback(() => {
    // Paywall de lancement : uniquement pour les non-premium
    if (!premium) setPaywall({});
  }, [premium]);

  const openGame = (id: string) => setSheet(id);
  const newSoiree = () => {
    if (!premium) { setPaywall({ thenSoiree: true }); return; }
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
            const toSoiree = paywall.thenSoiree;
            setPaywall(null);
            if (next) setTimeout(() => setSheet(next), 80);
            if (toSoiree) setTimeout(() => { clearSoiree(); setSoiree("setup"); }, 80);
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

      {toast.node}
    </>
  );
}
